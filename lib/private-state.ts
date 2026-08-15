/**
 * The user's (and agent's) private state, and the witness functions that feed it
 * into the circuits.
 *
 * This is the "User Layer" half of the information-transfer map: full mandate
 * rules and secrets live here, on the user's device, and are read by the local
 * prover. Nothing in this module is ever serialized to the ledger or to a
 * server — only values derived through `persistentCommit` / `persistentHash`
 * inside a circuit make it out.
 */

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, MandateRules, Witnesses } from '@mandate/contract';

import { assertHex32, bytesToHex, hexToBytes } from './encoding';
import { toContractRules } from './mandate';
import type { MandateSecrets, MandateSpec, StoredMandate } from './types';

/** Everything the local prover needs, keyed by mandate id. */
export interface MandatePrivateState {
  /** Network id the addresses in these specs were encoded against. */
  networkId: string;
  mandates: Record<string, { spec: MandateSpec; secrets: MandateSecrets }>;
}

export function emptyPrivateState(networkId: string): MandatePrivateState {
  return { networkId, mandates: {} };
}

export function withMandate(
  state: MandatePrivateState,
  mandate: StoredMandate,
): MandatePrivateState {
  return {
    ...state,
    mandates: {
      ...state.mandates,
      [mandate.id]: { spec: mandate.spec, secrets: mandate.secrets },
    },
  };
}

function entryFor(state: MandatePrivateState, id: Uint8Array) {
  const key = bytesToHex(id);
  const entry = state.mandates[key];
  if (!entry) {
    throw new Error(
      `No private state for mandate ${key}. This wallet does not hold the rules ` +
        'for that mandate, so it cannot prove anything about it.',
    );
  }
  return entry;
}

/**
 * The witness implementations.
 *
 * Each one is a pure lookup into local state. They never mutate it — the
 * returned private state is the same object — because a mandate's rules and
 * secrets are fixed at creation; only the *public* record evolves.
 */
export const witnesses: Witnesses<MandatePrivateState> = {
  localRules(
    context: WitnessContext<Ledger, MandatePrivateState>,
    id: Uint8Array,
  ): [MandatePrivateState, MandateRules] {
    const { spec } = entryFor(context.privateState, id);
    return [context.privateState, toContractRules(spec, context.privateState.networkId)];
  },

  localSalt(
    context: WitnessContext<Ledger, MandatePrivateState>,
    id: Uint8Array,
  ): [MandatePrivateState, Uint8Array] {
    const { secrets } = entryFor(context.privateState, id);
    return [context.privateState, hexToBytes(assertHex32(secrets.salt, 'Salt'))];
  },

  localAgentSecretKey(
    context: WitnessContext<Ledger, MandatePrivateState>,
    id: Uint8Array,
  ): [MandatePrivateState, Uint8Array] {
    const { secrets } = entryFor(context.privateState, id);
    return [
      context.privateState,
      hexToBytes(assertHex32(secrets.agentSecretKey, 'Agent secret key')),
    ];
  },

  localCreatorSecretKey(
    context: WitnessContext<Ledger, MandatePrivateState>,
    id: Uint8Array,
  ): [MandatePrivateState, Uint8Array] {
    const { secrets } = entryFor(context.privateState, id);
    return [
      context.privateState,
      hexToBytes(assertHex32(secrets.creatorSecretKey, 'Creator secret key')),
    ];
  },
};

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * JSON round-tripping for private state.
 *
 * `bigint` is not representable in JSON, so amounts are stored as decimal
 * strings. Kept explicit rather than using a reviver so that adding a field
 * without thinking about its encoding fails loudly at the type level.
 */
export function serializePrivateState(state: MandatePrivateState): string {
  return JSON.stringify(
    {
      networkId: state.networkId,
      mandates: Object.fromEntries(
        Object.entries(state.mandates).map(([id, { spec, secrets }]) => [
          id,
          {
            spec: {
              ...spec,
              maxTotalSpend: spec.maxTotalSpend.toString(),
              maxPerTransaction: spec.maxPerTransaction.toString(),
              periodLimit: spec.periodLimit.toString(),
            },
            secrets,
          },
        ]),
      ),
    },
    null,
    2,
  );
}

export function deserializePrivateState(json: string): MandatePrivateState {
  const raw = JSON.parse(json) as {
    networkId: string;
    mandates: Record<
      string,
      { spec: Omit<MandateSpec, 'maxTotalSpend' | 'maxPerTransaction' | 'periodLimit'> & {
        maxTotalSpend: string;
        maxPerTransaction: string;
        periodLimit: string;
      }; secrets: MandateSecrets }
    >;
  };
  return {
    networkId: raw.networkId,
    mandates: Object.fromEntries(
      Object.entries(raw.mandates ?? {}).map(([id, { spec, secrets }]) => [
        id,
        {
          spec: {
            ...spec,
            maxTotalSpend: BigInt(spec.maxTotalSpend),
            maxPerTransaction: BigInt(spec.maxPerTransaction),
            periodLimit: BigInt(spec.periodLimit),
          },
          secrets,
        },
      ]),
    ),
  };
}
