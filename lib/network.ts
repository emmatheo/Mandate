/**
 * Midnight network configuration and balance checks.
 *
 * Mandate targets Midnight Preprod (testnet) and nothing else. tNIGHT is the
 * asset a mandate governs; tDUST pays the fees for every transaction. Both are
 * checked before an action is attempted, because "insufficient funds" surfacing
 * as a proof failure is the kind of error that wastes a user's afternoon.
 */

import { nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

/**
 * The only network this app will operate on.
 *
 * Deliberately not a free-form env var. Pointing this DApp at mainnet would put
 * real funds behind circuits that have never been audited, so the value is
 * pinned here and the wallet is checked against it before anything is signed.
 */
export const REQUIRED_NETWORK_ID = 'preprod';

export const NETWORK_LABEL = 'Midnight Preprod';

/** The asset a mandate governs. */
export const SPEND_TOKEN = 'tNIGHT';
/** The token that pays transaction fees. */
export const FEE_TOKEN = 'tDUST';

export const FAUCET_URL = 'https://faucet.preprod.midnight.network/';

/**
 * Raw token type of the native asset (NIGHT / tNIGHT), as the wallet keys its
 * unshielded balance map.
 */
export function nativeTokenRaw(): string {
  return nativeToken().raw;
}

export interface WalletBalances {
  /** Spendable tNIGHT, in the smallest unit. */
  night: bigint;
  /** Spendable tDUST for fees, in the smallest unit. */
  dust: bigint;
  /** The ceiling tDUST generation can reach from the current tNIGHT holding. */
  dustCap: bigint;
}

/** Read the connected wallet's tNIGHT and tDUST balances. */
export async function readBalances(api: ConnectedAPI): Promise<WalletBalances> {
  const [unshielded, dust] = await Promise.all([
    api.getUnshieldedBalances(),
    api.getDustBalance(),
  ]);
  const raw = nativeTokenRaw();
  return {
    night: unshielded[raw] ?? 0n,
    dust: dust.balance,
    dustCap: dust.cap,
  };
}

/**
 * Reasons an action cannot be attempted yet, in the user's terms.
 *
 * Returns an empty array when the wallet can proceed. Each entry is written to
 * be shown directly in the interface.
 */
export function checkFunding(
  balances: WalletBalances,
  requiredNight: bigint,
): string[] {
  const problems: string[] = [];

  if (requiredNight > 0n && balances.night < requiredNight) {
    problems.push(
      `Not enough ${SPEND_TOKEN}. This needs ${formatUnits(requiredNight)} ${SPEND_TOKEN} ` +
        `and the wallet holds ${formatUnits(balances.night)}. Request more from the faucet.`,
    );
  }

  if (balances.dust === 0n) {
    problems.push(
      balances.dustCap === 0n
        ? `No ${FEE_TOKEN} to pay fees, and none can be generated because the wallet holds no ` +
          `${SPEND_TOKEN}. Request ${SPEND_TOKEN} from the faucet first.`
        : `No spendable ${FEE_TOKEN} yet. ${FEE_TOKEN} accrues from your ${SPEND_TOKEN} over ` +
          `time — complete the "Generate ${FEE_TOKEN}" step in Lace and wait a moment.`,
    );
  }

  return problems;
}

/** Local copy of amount formatting, to keep this module dependency-light. */
function formatUnits(value: bigint, decimals = 6): string {
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = value % scale;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
}

/**
 * The address of the deployed Mandate registry, if one is configured.
 *
 * When unset there is no contract to prove against, so the app refuses to
 * connect and says so. It does not deploy one silently, and it does not carry
 * on without one: a Mandate with no registry cannot authorize anything.
 */
export function configuredContractAddress(): string | undefined {
  const value = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim();
  return value && value.length > 0 ? value : undefined;
}

/** Explorer link for a transaction, when one can be constructed. */
export function explorerTxUrl(txId: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL?.trim();
  if (!base) return undefined;
  return `${base.replace(/\/$/, '')}/tx/${txId}`;
}
