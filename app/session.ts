'use client';

/**
 * The application session.
 *
 * Mandate is a Midnight application, and this module is where that is enforced
 * rather than merely claimed. There is exactly one path through it:
 *
 *   1. a Lace wallet connects to Midnight Preprod,
 *   2. the mandate rules and secrets are written to encrypted local private
 *      state, where only the wallet's prover can read them,
 *   3. every state change is a Compact circuit call submitted as a transaction,
 *      proven inside the wallet against those witnesses.
 *
 * There is no second path. No simulator, no in-memory ledger, no local
 * "approval" that stands in for a proof. If the wallet, the network, the
 * registry or the private state is missing, every operation here fails loudly
 * and nothing is authorized.
 *
 * The private half of a mandate — the rules, the salt, the creator and agent
 * secrets — never leaves the browser. It is held by the private-state provider,
 * encrypted at rest under a password the user supplies, and read only by the
 * wallet's prover during proof generation.
 */

import { useCallback, useMemo, useState } from 'react';

import { formatToken, randomHex32 } from '../lib/encoding';
import { explainError } from '../lib/errors';
import {
  deriveAgentPublicKey,
  deriveCommitment,
  preCheck,
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

export type ChainStatus = 'disconnected' | 'connecting' | 'ready' | 'error';

/** A registry the wallet is attached to. Every circuit call goes through one. */
type Registry = Awaited<ReturnType<typeof connectMandateRegistry>>;

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

/**
 * Thrown when an operation is attempted without a live Midnight connection.
 *
 * This is a programming-error guard rather than a user-facing state: the
 * dashboard is gated behind `status === 'ready'`. It exists so that a future
 * refactor which lets a call slip past the gate fails immediately and visibly,
 * instead of appearing to succeed.
 */
class NotConnectedError extends Error {
  constructor(what: string) {
    super(
      `Not connected to Midnight ${REQUIRED_NETWORK_ID}: ${what}. ` +
        'Mandate cannot authorize anything without a wallet, a deployed registry and ' +
        'local private state — reconnect and try again.',
    );
    this.name = 'NotConnectedError';
  }
}

export function useSession() {
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

  const [providers, setProviders] = useState<MandateProviders | null>(null);
  const [registry, setRegistry] = useState<Registry | null>(null);

  const networkId = REQUIRED_NETWORK_ID;

  /** The address that funds every mandate and receives every reclaim. */
  const fundingAddress = wallet?.unshieldedAddress ?? '';

  const log = useCallback((entry: ActivityEntry) => {
    setActivity((previous) => [entry, ...previous]);
  }, []);

  // =========================================================================
  // Reading public state
  // =========================================================================

  /**
   * Re-read every mandate's public record from the indexer.
   *
   * The chain is the only source of escrow balances, spend totals and
   * revocation status. Nothing here is remembered locally and trusted later.
   */
  const refresh = useCallback(
    async (list: StoredMandate[], activeProviders?: MandateProviders | null) => {
      const p = activeProviders ?? providers;
      if (!p || !registryAddress) throw new NotConnectedError('no registry to read from');

      const state = await readRegistryLedger(p, registryAddress);
      const next: Record<string, MandateRecordView> = {};

      if (state) {
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
      }

      setMandates(list);
      setRecords(next);
    },
    [providers, registryAddress],
  );

  const refreshBalances = useCallback(async () => {
    if (!wallet) return;
    try {
      setBalances(await readBalances(wallet.api));
    } catch {
      // A balance read failing is not worth interrupting the user over; the
      // next action will surface any real problem.
    }
  }, [wallet]);

  // =========================================================================
  // Connecting
  // =========================================================================

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
        const configured = configuredContractAddress();
        if (!configured) {
          throw new Error(
            'No Mandate registry is configured for this deployment. Set ' +
              'NEXT_PUBLIC_CONTRACT_ADDRESS to a registry address deployed with ' +
              '`npm run contract:deploy`. Without it there is no contract to prove against, ' +
              'and Mandate cannot authorize anything.',
          );
        }

        const connection = await connectWallet();
        setWallet(connection);

        setBusyLabel('Preparing the wallet prover and providers…');
        const built = await createProviders(connection, {
          passwordProvider: () => password,
        });

        setBusyLabel('Attaching to the Mandate registry…');
        built.privateStateProvider.setContractAddress(configured);
        const existing =
          (await built.privateStateProvider.get(PRIVATE_STATE_ID)) ??
          emptyPrivateState(REQUIRED_NETWORK_ID);

        const found = await connectMandateRegistry(built, configured, existing);

        setProviders(built);
        setRegistry(found);
        setRegistryAddress(configured);

        // Rebuild the mandate list from private state — that is the only place
        // the rules exist, and without them nothing can be proven. A mandate
        // whose rules are lost is visible on chain but permanently unusable.
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
        await refresh(restored, built);
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
  const persistPrivateState = useCallback(
    async (state: MandatePrivateState) => {
      if (!providers) throw new NotConnectedError('no private-state provider');
      await providers.privateStateProvider.set(PRIVATE_STATE_ID, state);
    },
    [providers],
  );

  // =========================================================================
  // Operations — every one of these is a proven transaction
  // =========================================================================

  const createMandate = useCallback(
    async (
      draft: Omit<MandateSpec, 'agentPublicKey'>,
      agentSecretKey: string,
      deposit: bigint,
    ): Promise<CreateResult> => {
      if (status !== 'ready' || !registry || !providers) {
        return {
          ok: false,
          error: new NotConnectedError('cannot create a mandate').message,
        };
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

        if (balances) {
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

        let txId: string;
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
          // The transaction failed, so the mandate does not exist. Do not leave
          // orphaned secrets behind implying that it does.
          await persistPrivateState(current);
          throw caught;
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
      fundingAddress,
      mandates,
      networkId,
      persistPrivateState,
      providers,
      refresh,
      refreshBalances,
      registry,
      status,
    ],
  );

  /**
   * Run one agent action.
   *
   * The local rule check is advisory only. It exists so a doomed action fails
   * with a named rule instead of costing the user a proof and a fee, and it can
   * only ever *refuse* — it never authorizes anything. Authorization is the
   * circuit's, and only the circuit's: `executeAction` re-checks every rule
   * against the committed private rule set, and an action that violates one has
   * no satisfying proof, so no valid transaction exists to submit.
   */
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

      if (!registry) {
        const entry: ActivityEntry = {
          ...base,
          outcome: 'rejected-locally',
          message: new NotConnectedError('cannot submit an agent action').message,
        };
        log(entry);
        return { ok: false, message: entry.message };
      }

      if (!mandate || !record) {
        const entry: ActivityEntry = {
          ...base,
          outcome: 'rejected-locally',
          message:
            'This wallet holds no private rules for that mandate, so it cannot prove anything ' +
            'about it. Nothing was submitted.',
        };
        log(entry);
        return { ok: false, message: entry.message };
      }

      setBusyLabel('Proving and submitting…');
      try {
        const now = Math.floor(Date.now() / 1000) - 30;
        const check = preCheck(
          mandate.spec,
          record,
          { mandateId, recipient, amount },
          now,
          REQUIRED_NETWORK_ID,
        );

        if (!check.authorized) {
          const violation = check.violation!;
          const entry: ActivityEntry = {
            ...base,
            outcome: 'rejected-locally',
            violatedRule: violation.rule,
            message:
              `${violation.label}: ${violation.detail ?? 'rule not satisfied'} ` +
              '— refused before proving; no transaction was submitted.',
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
          message: `Released ${formatToken(amount)} on Midnight Preprod. Transaction ${outcome.txId}`,
        };
        log(entry);
        await refresh(mandates);
        await refreshBalances();
        return { ok: true, message: entry.message, preCheck: check, txId: outcome.txId };
      } catch (caught) {
        // The circuit or the network refused. Either way no funds moved.
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
    [log, mandates, records, refresh, refreshBalances, registry],
  );

  /** Wrap a creator-only circuit call with consistent status and error handling. */
  const creatorAction = useCallback(
    async (
      label: string,
      call: (registry: Registry) => Promise<{ txId: string }>,
      success: (txId: string) => string,
    ): Promise<ActionResult> => {
      if (!registry) {
        return { ok: false, message: new NotConnectedError(label.toLowerCase()).message };
      }
      setBusyLabel(label);
      try {
        const { txId } = await call(registry);
        await refresh(mandates);
        await refreshBalances();
        return { ok: true, message: success(txId), txId };
      } catch (caught) {
        return { ok: false, message: explainError(caught).message };
      } finally {
        setBusyLabel(undefined);
      }
    },
    [mandates, refresh, refreshBalances, registry],
  );

  const revoke = useCallback(
    (mandateId: string) =>
      creatorAction(
        'Proving revocation…',
        (r) => revokeMandateOnChain(r, mandateId),
        (txId) =>
          `Mandate revoked on chain. No further agent action can be authorized under it. ` +
          `Transaction ${txId}`,
      ),
    [creatorAction],
  );

  const withdraw = useCallback(
    (mandateId: string) => {
      const to = mandates.find((m) => m.id === mandateId)?.creatorAddress ?? '';
      return creatorAction(
        'Proving withdrawal…',
        (r) => withdrawOnChain(r, mandateId),
        (txId) => `Reclaimed to the funding address ${to.slice(0, 12)}…. Transaction ${txId}`,
      );
    },
    [creatorAction, mandates],
  );

  const fund = useCallback(
    (mandateId: string, amount: bigint) =>
      creatorAction(
        'Proving deposit…',
        (r) => fundMandateOnChain(r, mandateId, amount),
        (txId) => `Added ${formatToken(amount)} to the escrow. Transaction ${txId}`,
      ),
    [creatorAction],
  );

  const discloseTotalRespected = useCallback(
    (mandateId: string) =>
      creatorAction(
        'Proving disclosure…',
        (r) => discloseTotalSpendRespectedOnChain(r, mandateId),
        () => 'Published: the total spend limit was respected. The limit itself stays private.',
      ),
    [creatorAction],
  );

  const discloseField = useCallback(
    (mandateId: string, kind: bigint) =>
      creatorAction(
        'Proving disclosure…',
        (r) => discloseFieldOnChain(r, mandateId, kind),
        () => 'Published one field. Every other rule stays hidden.',
      ),
    [creatorAction],
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
