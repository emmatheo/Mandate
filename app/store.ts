'use client';

/**
 * Application state for the Mandate dashboard.
 *
 * Two backends, one interface:
 *
 *  - **local** runs the compiled circuits in the browser against an in-memory
 *    ledger. Every rule rejection you see is a real unsatisfiable constraint,
 *    but nothing is on a chain and the ledger lasts only for the session.
 *  - **chain** talks to a deployed registry through a Lace wallet.
 *
 * The private half — rules, salts, secret keys — is handled identically in both
 * modes: it lives in this browser and is read only by the local prover. It is
 * never sent to a server, and this app has no server route that could receive it.
 */

import { useCallback, useMemo, useRef, useState } from 'react';

import { MandateAgent } from '../agent/agent';
import { SimulatedExecutor } from '../agent/simulated-executor';
import { formatToken, randomHex32 } from '../lib/encoding';
import {
  deriveAgentPublicKey,
  deriveCommitment,
  toContractRules,
  toRecordView,
  validateSpec,
} from '../lib/mandate';
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

export const LOCAL_NETWORK_ID = 'undeployed';

export interface AppState {
  mandates: StoredMandate[];
  records: Record<string, MandateRecordView>;
  activity: ActivityEntry[];
  disclosures: DisclosureView[];
  error?: string;
  busy: boolean;
}

export interface DisclosureView {
  mandateId: string;
  kind: number;
  value: bigint;
  revealsValue: boolean;
}

export interface CreateResult {
  ok: boolean;
  mandate?: StoredMandate;
  error?: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  preCheck?: PreCheckResult;
  violatedRule?: string;
}

function hexKey(id: string): Uint8Array {
  return Uint8Array.from(id.match(/.{2}/g)!.map((b) => Number.parseInt(b, 16)));
}

/**
 * The dashboard's state machine, backed by the in-browser simulator.
 *
 * The simulator instance is held in a ref rather than in state: it is mutable,
 * long-lived, and re-creating it on every render would silently reset the
 * ledger. React state carries only the derived, renderable snapshot.
 */
export function useMandateApp() {
  const simRef = useRef<MandateSimulator | null>(null);
  const executorRef = useRef<SimulatedExecutor | null>(null);
  const privateRef = useRef<MandatePrivateState>(emptyPrivateState(LOCAL_NETWORK_ID));

  const [state, setState] = useState<AppState>({
    mandates: [],
    records: {},
    activity: [],
    disclosures: [],
    busy: false,
  });

  const ensureSim = useCallback((): {
    sim: MandateSimulator;
    executor: SimulatedExecutor;
  } => {
    if (!simRef.current || !executorRef.current) {
      const sim = new MandateSimulator(privateRef.current);
      const executor = new SimulatedExecutor(sim, Math.floor(Date.now() / 1000));
      simRef.current = sim;
      executorRef.current = executor;
    }
    return { sim: simRef.current, executor: executorRef.current };
  }, []);

  /** Re-read every public record and the disclosure log from the ledger. */
  const refresh = useCallback((mandates: StoredMandate[]) => {
    const sim = simRef.current;
    if (!sim) return;

    const records: Record<string, MandateRecordView> = {};
    for (const mandate of mandates) {
      const key = hexKey(mandate.id);
      if (sim.ledger.mandates.member(key)) {
        records[mandate.id] = toRecordView(mandate.id, sim.ledger.mandates.lookup(key));
      }
    }

    const disclosures: DisclosureView[] = [...sim.ledger.disclosureLog].map((entry) => ({
      mandateId: Array.from(entry.mandateId, (b) => b.toString(16).padStart(2, '0')).join(''),
      kind: Number(entry.kind),
      value: entry.value,
      revealsValue: entry.revealsValue,
    }));

    setState((previous) => ({ ...previous, mandates, records, disclosures }));
  }, []);

  /**
   * Create a mandate: generate secrets, derive the commitment locally, then run
   * the createMandate circuit. The rules never leave this function's scope
   * except into local private state.
   */
  const createMandate = useCallback(
    (draft: Omit<MandateSpec, 'agentPublicKey'>, agentSecretKey: string, deposit: bigint): CreateResult => {
      try {
        const secrets: MandateSecrets = {
          salt: randomHex32(),
          creatorSecretKey: randomHex32(),
          agentSecretKey,
        };
        const spec: MandateSpec = {
          ...draft,
          agentPublicKey: deriveAgentPublicKey(agentSecretKey),
        };

        const problems = validateSpec(spec);
        if (problems.length > 0) return { ok: false, error: problems.join(' ') };
        if (deposit <= 0n) return { ok: false, error: 'The deposit must be greater than zero.' };

        const id = randomHex32();
        const commitment = deriveCommitment(toContractRules(spec, LOCAL_NETWORK_ID), secrets.salt);

        // Register in private state *before* running the circuit: the witness
        // functions read from it during execution.
        privateRef.current.mandates[id] = { spec, secrets };

        const { sim } = ensureSim();
        sim.setBlockTime(Math.floor(Date.now() / 1000));
        sim.createMandate(id, deposit);

        const mandate: StoredMandate = {
          id,
          spec,
          secrets,
          commitment,
          createdAt: Math.floor(Date.now() / 1000),
        };
        const mandates = [...state.mandates, mandate];
        refresh(mandates);
        return { ok: true, mandate };
      } catch (error) {
        delete privateRef.current.mandates[''];
        return { ok: false, error: (error as Error).message };
      }
    },
    [ensureSim, refresh, state.mandates],
  );

  /** Have the authorized agent attempt an action. */
  const runAgentAction = useCallback(
    async (
      mandateId: string,
      recipient: string,
      amount: bigint,
      memo: string,
    ): Promise<ActionResult> => {
      const { executor } = ensureSim();
      executor.advanceTo(Math.floor(Date.now() / 1000));

      const agent = new MandateAgent({
        executor,
        mandates: {
          getSpec: (id) => privateRef.current.mandates[id]?.spec,
        },
        networkId: LOCAL_NETWORK_ID,
        timestampLagSeconds: 0,
      });

      const result = await agent.act({ mandateId, recipient, amount, memo: memo || undefined });

      setState((previous) => ({
        ...previous,
        activity: [result.entry, ...previous.activity],
      }));
      refresh(state.mandates);

      return {
        ok: result.ok,
        message: result.entry.message,
        preCheck: result.preCheck,
        violatedRule: result.entry.violatedRule,
      };
    },
    [ensureSim, refresh, state.mandates],
  );

  const revoke = useCallback(
    (mandateId: string): ActionResult => {
      try {
        ensureSim().sim.revokeMandate(mandateId);
        refresh(state.mandates);
        return { ok: true, message: 'Mandate revoked. No further agent action can be authorized.' };
      } catch (error) {
        return { ok: false, message: cleanError(error) };
      }
    },
    [ensureSim, refresh, state.mandates],
  );

  const withdraw = useCallback(
    (mandateId: string, recipient: string): ActionResult => {
      try {
        const refund = ensureSim().sim.withdraw(mandateId, recipient);
        refresh(state.mandates);
        return {
          ok: true,
          message: `Reclaimed ${formatToken(refund)} to ${recipient.slice(0, 12)}…`,
        };
      } catch (error) {
        return { ok: false, message: cleanError(error) };
      }
    },
    [ensureSim, refresh, state.mandates],
  );

  const discloseTotalRespected = useCallback(
    (mandateId: string): ActionResult => {
      try {
        ensureSim().sim.discloseTotalSpendRespected(mandateId);
        refresh(state.mandates);
        return {
          ok: true,
          message: 'Published: the total spend limit was respected. The limit itself stays private.',
        };
      } catch (error) {
        return { ok: false, message: cleanError(error) };
      }
    },
    [ensureSim, refresh, state.mandates],
  );

  const discloseField = useCallback(
    (mandateId: string, kind: bigint): ActionResult => {
      try {
        const value = ensureSim().sim.discloseField(mandateId, kind);
        refresh(state.mandates);
        return {
          ok: true,
          message: `Published one field: ${formatToken(value)}. Every other rule stays hidden.`,
        };
      } catch (error) {
        return { ok: false, message: cleanError(error) };
      }
    },
    [ensureSim, refresh, state.mandates],
  );

  const totals = useMemo(() => {
    const records = Object.values(state.records);
    return {
      active: records.filter((r) => !r.revoked).length,
      escrow: records.reduce((sum, r) => sum + r.escrow, 0n),
      spent: records.reduce((sum, r) => sum + r.spent, 0n),
      actions: records.reduce((sum, r) => sum + r.actionCount, 0n),
    };
  }, [state.records]);

  return {
    ...state,
    totals,
    createMandate,
    runAgentAction,
    revoke,
    withdraw,
    discloseTotalRespected,
    discloseField,
  };
}

function cleanError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const assertion = /failed assert:\s*(.*)/i.exec(raw);
  return assertion ? assertion[1].trim() : raw;
}
