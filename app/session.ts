'use client';

/**
 * The application session.
 *
 * Mandate runs against Midnight Preprod. That is the default and the only mode
 * in which funds actually move: a mandate is created by a transaction, the
 * escrow holds real tNIGHT, an agent releases funds by submitting a proof, and
 * the creator reclaims what is left. Every one of those is a signed transaction
 * through the connected wallet.
 *
 * A `demo` mode exists alongside it, running the same compiled circuits against
 * an in-memory ledger with no wallet. It is opt-in, never the default, and it is
 * labelled everywhere it is visible. It is there so the authorization logic can
 * be shown without a funded wallet — not as a substitute for the chain.
 *
 * The private half of a mandate — the rules, the salt, the creator and agent
 * secrets — never leaves the browser in either mode. On the chain path it is
 * held by the private-state provider, encrypted at rest under a password the
 * user supplies, and read only by the wallet's prover.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MandateAgent } from '../agent/agent';
import { SimulatedExecutor } from '../agent/simulated-executor';
import { formatToken, randomHex32 } from '../lib/encoding';
import { explainError } from '../lib/errors';
import {
  deriveAgentPublicKey,
  deriveCommitment,
  toContractRules,
  toRecordView,
  validateSpec,
} from '../lib/mandate';
import {
  checkFunding,
  configuredContractAddress,
  readBalances,
  REQUIRED_NETWORK_ID,
  type WalletBalances,
} from '../lib/network';
import { emptyPrivateState, type MandatePrivateState } from '../lib/private-state';
import { MandateSimulator } from '../lib/simulator';
import type {
  ActivityEntry,
  MandateRecordView,
  MandateSecrets,
  MandateSpec,
  PreCheckResult,
  StoredMandate,
} from '../lib/types';
import {
  connectMandateRegistry,
  connectWallet,
  createMandateOnChain,
  createProviders,
  deployMandateRegistry,
  discloseFieldOnChain,
  discloseTotalSpendRespectedOnChain,
  executeActionOnChain,
  fundMandateOnChain,
  PRIVATE_STATE_ID,
  revokeMandateOnChain,
  readRegistryLedger,
  withdrawOnChain,
  type MandateProviders,
  type WalletConnection,
} from '../lib/client';

/** Network id used by the opt-in demo mode, which touches no chain. */
export const DEMO_NETWORK_ID = 'undeployed';

export type Mode = 'chain' | 'demo';
export type ChainStatus = 'disconnected' | 'connecting' | 'ready' | 'error';

export interface DisclosureView {
  mandateId: string;
  kind: number;
  value: bigint;
  revealsValue: boolean;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  preCheck?: PreCheckResult;
  violatedRule?: string;
  txId?: string;
}

export interface CreateResult {
  ok: boolean;
  mandate?: StoredMandate;
  error?: string;
  txId?: string;
}

function hexKey(id: string): Uint8Array {
  return Uint8Array.from(id.match(/.{2}/g)!.map((b) => Number.parseInt(b, 16)));
}

let sequence = 0;
function entryId(): string {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function useSession() {
  // `chain` is the default. Demo mode is only ever entered deliberately.
  const [mode, setModeState] = useState<Mode>('chain');
  const [status, setStatus] = useState<ChainStatus>('disconnected');
  const [error, setError] = useState<string | undefined>();
  const [busyLabel, setBusyLabel] = useState<string | undefined>();

  const [wallet, setWallet] = useState<WalletConnection | undefined>();
  const [balances, setBalances] = useState<WalletBalances | undefined>();
  const [registryAddress, setRegistryAddress] = useState<string | undefined>(
    configuredContractAddress(),
  );

  const [mandates, setMandates] = useState<StoredMandate[]>([]);
  const [records, setRecords] = useState<Record<string, MandateRecordView>>({});
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureView[]>([]);

  const providersRef = useRef<MandateProviders | null>(null);
  const registryRef = useRef<Awaited<ReturnType<typeof connectMandateRegistry>> | null>(null);

  // --- demo-mode state, unused on the chain path ---------------------------
  const simRef = useRef<MandateSimulator | null>(null);
  const executorRef = useRef<SimulatedExecutor | null>(null);
  const demoPrivateRef = useRef<MandatePrivateState>(emptyPrivateState(DEMO_NETWORK_ID));
  const [demoAddress, setDemoAddress] = useState('');

  // Generated after mount: a value produced during render would differ between
  // the prerendered HTML and the client, and React would flag a mismatch.
  useEffect(() => {
    setDemoAddress((current) => (current === '' ? randomHex32() : current));
  }, []);

  const networkId = mode === 'chain' ? REQUIRED_NETWORK_ID : DEMO_NETWORK_ID;

  /** The address that funds mandates and receives every reclaim. */
  const fundingAddress = mode === 'chain' ? (wallet?.unshieldedAddress ?? '') : demoAddress;

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    setError(undefined);
    setMandates([]);
    setRecords({});
    setActivity([]);
    setDisclosures([]);
  }, []);

  const log = useCallback((entry: ActivityEntry) => {
    setActivity((previous) => [entry, ...previous]);
  }, []);

  // =========================================================================
  // Chain wiring
  // =========================================================================

  const ensureDemo = useCallback(() => {
    if (!simRef.current || !executorRef.current) {
      const sim = new MandateSimulator(demoPrivateRef.current);
      const executor = new SimulatedExecutor(sim, Math.floor(Date.now() / 1000));
      simRef.current = sim;
      executorRef.current = executor;
    }
    return { sim: simRef.current, executor: executorRef.current };
  }, []);

  /** Re-read every mandate's public record from wherever the truth lives. */
  const refresh = useCallback(
    async (list: StoredMandate[]) => {
      const next: Record<string, MandateRecordView> = {};

      if (mode === 'chain') {
        const providers = providersRef.current;
        const address = registryAddress;
        if (!providers || !address) return;
        const state = await readRegistryLedger(providers, address);
        if (!state) return;
        for (const mandate of list) {
          const key = hexKey(mandate.id);
          if (state.mandates.member(key)) {
            next[mandate.id] = toRecordView(mandate.id, state.mandates.lookup(key));
          }
        }
        setDisclosures(
          [...state.disclosureLog].map((entry) => ({
            mandateId: Array.from(entry.mandateId, (b: number) =>
              b.toString(16).padStart(2, '0'),
            ).join(''),
            kind: Number(entry.kind),
            value: entry.value,
            revealsValue: entry.revealsValue,
          })),
        );
      } else {
        const sim = simRef.current;
        if (!sim) return;
        for (const mandate of list) {
          const key = hexKey(mandate.id);
          if (sim.ledger.mandates.member(key)) {
            next[mandate.id] = toRecordView(mandate.id, sim.ledger.mandates.lookup(key));
          }
        }
        setDisclosures(
          [...sim.ledger.disclosureLog].map((entry) => ({
            mandateId: Array.from(entry.mandateId, (b: number) =>
              b.toString(16).padStart(2, '0'),
            ).join(''),
            kind: Number(entry.kind),
            value: entry.value,
            revealsValue: entry.revealsValue,
          })),
        );
      }

      setMandates(list);
      setRecords(next);
    },
    [mode, registryAddress],
  );

  const refreshBalances = useCallback(async () => {
    if (mode !== 'chain' || !wallet) return;
    try {
      setBalances(await readBalances(wallet.api));
    } catch {
      // A balance read failing is not worth interrupting the user over; the
      // next action will surface any real problem.
    }
  }, [mode, wallet]);

  /**
   * Connect the wallet, build the providers, and attach to the registry.
   *
   * `password` encrypts the private state at rest. It is the key to the mandate
   * rules and to the secrets that authorize revocation and withdrawal, so it is
   * asked for rather than derived, and it is never persisted.
   */
  const connect = useCallback(
    async (password: string): Promise<{ ok: boolean; message?: string }> => {
      setStatus('connecting');
      setError(undefined);
      setBusyLabel('Connecting wallet…');
      try {
        const connection = await connectWallet();
        setWallet(connection);

        setBusyLabel('Preparing prover and providers…');
        const providers = await createProviders(connection, {
          passwordProvider: () => password,
        });
        providersRef.current = providers;

        const configured = configuredContractAddress();
        if (!configured) {
          setStatus('error');
          setError(
            'No Mandate registry is configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS to a deployed ' +
              'registry address, or deploy one with `npm run contract:deploy`.',
          );
          setBusyLabel(undefined);
          return {
            ok: false,
            message: 'No registry configured for this deployment.',
          };
        }

        setBusyLabel('Attaching to the Mandate registry…');
        providers.privateStateProvider.setContractAddress(configured);
        const existing =
          (await providers.privateStateProvider.get(PRIVATE_STATE_ID)) ??
          emptyPrivateState(REQUIRED_NETWORK_ID);

        const registry = await connectMandateRegistry(providers, configured, existing);
        registryRef.current = registry;
        setRegistryAddress(configured);

        // Rebuild the mandate list from private state — that is the only place
        // the rules exist, and without them nothing can be proven.
        const restored: StoredMandate[] = Object.entries(existing.mandates).map(
          ([id, { spec, secrets }]) => ({
            id,
            creatorAddress: connection.unshieldedAddress,
            spec,
            secrets,
            commitment: deriveCommitment(
              toContractRules(spec, REQUIRED_NETWORK_ID),
              secrets.salt,
            ),
            createdAt: 0,
          }),
        );

        setBalances(await readBalances(connection.api));
        await refresh(restored);
        setStatus('ready');
        setBusyLabel(undefined);
        return { ok: true };
      } catch (caught) {
        const friendly = explainError(caught);
        setStatus('error');
        setError(friendly.message);
        setBusyLabel(undefined);
        return { ok: false, message: friendly.message };
      }
    },
    [refresh],
  );

  /** Persist the private half of a mandate so it survives a reload. */
  const persistPrivateState = useCallback(async (state: MandatePrivateState) => {
    const providers = providersRef.current;
    if (!providers) return;
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, state);
  }, []);

  // =========================================================================
  // Operations
  // =========================================================================

  const createMandate = useCallback(
    async (
      draft: Omit<MandateSpec, 'agentPublicKey'>,
      agentSecretKey: string,
      deposit: bigint,
    ): Promise<CreateResult> => {
      if (mode === 'chain' && status !== 'ready') {
        return { ok: false, error: 'Connect a wallet before creating a mandate.' };
      }
      if (fundingAddress === '') {
        return { ok: false, error: 'No funding address available yet. Reconnect and retry.' };
      }

      let spec: MandateSpec;
      let secrets: MandateSecrets;
      let id = '';
      try {
        secrets = {
          salt: randomHex32(),
          creatorSecretKey: randomHex32(),
          agentSecretKey,
        };
        spec = { ...draft, agentPublicKey: deriveAgentPublicKey(agentSecretKey) };

        const problems = validateSpec(spec);
        if (problems.length > 0) return { ok: false, error: problems.join(' ') };
        if (deposit <= 0n) return { ok: false, error: 'The deposit must be greater than zero.' };

        if (mode === 'chain' && balances) {
          const funding = checkFunding(balances, deposit);
          if (funding.length > 0) return { ok: false, error: funding.join(' ') };
        }

        id = randomHex32();
      } catch (caught) {
        return { ok: false, error: explainError(caught).message };
      }

      const commitment = deriveCommitment(toContractRules(spec, networkId), secrets.salt);

      setBusyLabel('Proving and submitting…');
      try {
        let txId: string | undefined;

        if (mode === 'chain') {
          const registry = registryRef.current!;
          const providers = providersRef.current!;

          // The witnesses read the rules during proving, so they must be in
          // private state before the circuit runs.
          const current =
            (await providers.privateStateProvider.get(PRIVATE_STATE_ID)) ??
            emptyPrivateState(REQUIRED_NETWORK_ID);
          const staged: MandatePrivateState = {
            ...current,
            mandates: { ...current.mandates, [id]: { spec, secrets } },
          };
          await persistPrivateState(staged);

          try {
            const outcome = await createMandateOnChain(
              registry,
              id,
              fundingAddress,
              deposit,
              REQUIRED_NETWORK_ID,
            );
            txId = outcome.txId;
          } catch (caught) {
            // The transaction failed, so the mandate does not exist. Do not
            // leave orphaned secrets behind implying that it does.
            await persistPrivateState(current);
            throw caught;
          }
        } else {
          demoPrivateRef.current.mandates[id] = { spec, secrets };
          const { sim } = ensureDemo();
          sim.setBlockTime(Math.floor(Date.now() / 1000));
          try {
            sim.createMandate(id, fundingAddress, deposit);
          } catch (caught) {
            delete demoPrivateRef.current.mandates[id];
            throw caught;
          }
        }

        const mandate: StoredMandate = {
          id,
          creatorAddress: fundingAddress,
          spec,
          secrets,
          commitment,
          createdAt: Math.floor(Date.now() / 1000),
        };
        await refresh([...mandates, mandate]);
        await refreshBalances();
        return { ok: true, mandate, txId };
      } catch (caught) {
        return { ok: false, error: explainError(caught).message };
      } finally {
        setBusyLabel(undefined);
      }
    },
    [
      balances,
      ensureDemo,
      fundingAddress,
      mandates,
      mode,
      networkId,
      persistPrivateState,
      refresh,
      refreshBalances,
      status,
    ],
  );

  const runAgentAction = useCallback(
    async (
      mandateId: string,
      recipient: string,
      amount: bigint,
      memo: string,
    ): Promise<ActionResult> => {
      const mandate = mandates.find((m) => m.id === mandateId);
      const record = records[mandateId];
      const base = {
        id: entryId(),
        mandateId,
        at: Math.floor(Date.now() / 1000),
        recipient,
        amount,
        memo: memo || undefined,
      };

      if (!mandate || !record) {
        const entry: ActivityEntry = {
          ...base,
          outcome: 'rejected-locally',
          message: 'That mandate is not available in this session.',
        };
        log(entry);
        return { ok: false, message: entry.message };
      }

      setBusyLabel('Proving and submitting…');
      try {
        if (mode === 'chain') {
          const registry = registryRef.current!;
          // The agent pre-checks locally so a doomed action fails with a named
          // rule rather than a wasted proof; the circuit still has final say.
          const { preCheck } = await import('../lib/mandate');
          const now = Math.floor(Date.now() / 1000) - 30;
          const check = preCheck(mandate.spec, record, { mandateId, recipient, amount }, now, REQUIRED_NETWORK_ID);

          if (!check.authorized) {
            const violation = check.violation!;
            const entry: ActivityEntry = {
              ...base,
              outcome: 'rejected-locally',
              violatedRule: violation.rule,
              message: `${violation.label}: ${violation.detail ?? 'rule not satisfied'}`,
            };
            log(entry);
            return {
              ok: false,
              message: entry.message,
              preCheck: check,
              violatedRule: violation.rule,
            };
          }

          const outcome = await executeActionOnChain(
            registry,
            mandateId,
            recipient,
            amount,
            now,
            REQUIRED_NETWORK_ID,
          );
          const entry: ActivityEntry = {
            ...base,
            outcome: 'executed',
            txId: outcome.txId,
            message: `Released ${formatToken(amount)} on Midnight Preprod.`,
          };
          log(entry);
          await refresh(mandates);
          await refreshBalances();
          return { ok: true, message: entry.message, preCheck: check, txId: outcome.txId };
        }

        // Demo mode: the same circuits, no chain.
        const { executor } = ensureDemo();
        executor.advanceTo(Math.floor(Date.now() / 1000));
        const agent = new MandateAgent({
          executor,
          mandates: { getSpec: (i) => demoPrivateRef.current.mandates[i]?.spec },
          networkId: DEMO_NETWORK_ID,
          timestampLagSeconds: 0,
        });
        const result = await agent.act({ mandateId, recipient, amount, memo: memo || undefined });
        log(result.entry);
        await refresh(mandates);
        return {
          ok: result.ok,
          message: result.entry.message,
          preCheck: result.preCheck,
          violatedRule: result.entry.violatedRule,
        };
      } catch (caught) {
        const friendly = explainError(caught);
        const entry: ActivityEntry = {
          ...base,
          outcome: 'rejected-on-chain',
          message: friendly.message,
        };
        log(entry);
        return { ok: false, message: friendly.message };
      } finally {
        setBusyLabel(undefined);
      }
    },
    [ensureDemo, log, mandates, mode, records, refresh, refreshBalances],
  );

  /** Wrap a creator-only chain call with consistent status and error handling. */
  const creatorAction = useCallback(
    async (
      label: string,
      onChain: () => Promise<{ txId: string }>,
      onDemo: () => void,
      success: (txId?: string) => string,
    ): Promise<ActionResult> => {
      setBusyLabel(label);
      try {
        let txId: string | undefined;
        if (mode === 'chain') {
          txId = (await onChain()).txId;
        } else {
          onDemo();
        }
        await refresh(mandates);
        await refreshBalances();
        return { ok: true, message: success(txId), txId };
      } catch (caught) {
        return { ok: false, message: explainError(caught).message };
      } finally {
        setBusyLabel(undefined);
      }
    },
    [mandates, mode, refresh, refreshBalances],
  );

  const revoke = useCallback(
    (mandateId: string) =>
      creatorAction(
        'Proving revocation…',
        () => revokeMandateOnChain(registryRef.current!, mandateId),
        () => ensureDemo().sim.revokeMandate(mandateId),
        () => 'Mandate revoked. No further agent action can be authorized under it.',
      ),
    [creatorAction, ensureDemo],
  );

  const withdraw = useCallback(
    (mandateId: string) => {
      const to = mandates.find((m) => m.id === mandateId)?.creatorAddress ?? '';
      return creatorAction(
        'Proving withdrawal…',
        () => withdrawOnChain(registryRef.current!, mandateId),
        () => {
          ensureDemo().sim.withdraw(mandateId);
        },
        () => `Reclaimed to the funding address ${to.slice(0, 12)}…`,
      );
    },
    [creatorAction, ensureDemo, mandates],
  );

  const fund = useCallback(
    (mandateId: string, amount: bigint) =>
      creatorAction(
        'Proving deposit…',
        () => fundMandateOnChain(registryRef.current!, mandateId, amount),
        () => ensureDemo().sim.fundMandate(mandateId, amount),
        () => `Added ${formatToken(amount)} to the escrow.`,
      ),
    [creatorAction, ensureDemo],
  );

  const discloseTotalRespected = useCallback(
    (mandateId: string) =>
      creatorAction(
        'Proving disclosure…',
        () => discloseTotalSpendRespectedOnChain(registryRef.current!, mandateId),
        () => ensureDemo().sim.discloseTotalSpendRespected(mandateId),
        () => 'Published: the total spend limit was respected. The limit itself stays private.',
      ),
    [creatorAction, ensureDemo],
  );

  const discloseField = useCallback(
    (mandateId: string, kind: bigint) =>
      creatorAction(
        'Proving disclosure…',
        () => discloseFieldOnChain(registryRef.current!, mandateId, kind),
        () => {
          ensureDemo().sim.discloseField(mandateId, kind);
        },
        () => 'Published one field. Every other rule stays hidden.',
      ),
    [creatorAction, ensureDemo],
  );

  const totals = useMemo(() => {
    const list = Object.values(records);
    return {
      active: list.filter((r) => !r.revoked).length,
      escrow: list.reduce((sum, r) => sum + r.escrow, 0n),
      spent: list.reduce((sum, r) => sum + r.spent, 0n),
    };
  }, [records]);

  return {
    mode,
    setMode,
    status,
    error,
    busyLabel,
    wallet,
    balances,
    registryAddress,
    fundingAddress,
    networkId,
    mandates,
    records,
    activity,
    disclosures,
    totals,
    connect,
    refreshBalances,
    createMandate,
    runAgentAction,
    revoke,
    withdraw,
    fund,
    discloseTotalRespected,
    discloseField,
  };
}
