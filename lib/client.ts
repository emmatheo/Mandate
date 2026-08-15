/**
 * Wiring between the Mandate contract and a live Midnight network.
 *
 * The browser path connects to a Lace wallet through the DApp connector:
 * the wallet supplies the indexer endpoints, balances and submits transactions,
 * and — via `getProvingProvider` — generates the zero-knowledge proofs itself.
 * That last part is what makes this deployable as a plain static Next.js app:
 * there is no proving service for the DApp to host.
 *
 * Nothing here ever sends mandate rules anywhere. The witness functions read
 * them from local private state during proving, which happens inside the
 * wallet's proving provider on the user's own machine.
 */

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import {
  createProofProvider,
  type MidnightProviders,
  type MidnightProvider,
  type ProofProvider,
  type UnboundTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import {
  deployContract,
  findDeployedContract,
  type DeployedContract,
  type FoundContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Contract } from '@mandate/contract';

import { bytesToHex, decodeUnshieldedAddress, hexToBytes } from './encoding';
import { toRecordView } from './mandate';
import { witnesses, type MandatePrivateState } from './private-state';
import type { MandateRecordView } from './types';

export type MandateContract = Contract<MandatePrivateState>;
export type MandateProviders = MidnightProviders<
  MandateCircuitId,
  typeof PRIVATE_STATE_ID,
  MandatePrivateState
>;

export type MandateCircuitId =
  | 'createMandate'
  | 'fundMandate'
  | 'executeAction'
  | 'revokeMandate'
  | 'withdraw'
  | 'discloseTotalSpendRespected'
  | 'discloseField';

/** Key under which this DApp's private state is stored locally. */
export const PRIVATE_STATE_ID = 'mandate';

/** Where `FetchZkConfigProvider` looks for keys and ZKIR, relative to the app. */
export const DEFAULT_ZK_BASE_PATH = '/zk';

/**
 * The compiled contract binding: the generated contract class, our witness
 * implementations, and the location of the ZK assets.
 */
export const compiledMandateContract = CompiledContract.make<MandateContract, MandatePrivateState>(
  'mandate',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  // The ZK artifacts are served over HTTP by `FetchZkConfigProvider`, so this
  // file-assets path is only a label here; nothing reads from disk in the browser.
  CompiledContract.withCompiledFileAssets('mandate'),
);

// ---------------------------------------------------------------------------
// Wallet connection
// ---------------------------------------------------------------------------

export interface WalletConnection {
  api: ConnectedAPI;
  walletName: string;
  networkId: string;
  indexerUri: string;
  indexerWsUri: string;
  unshieldedAddress: string;
}

/** The wallets currently injected into the page. */
export function availableWallets(): { key: string; wallet: InitialAPI }[] {
  if (typeof window === 'undefined' || !window.midnight) return [];
  return Object.entries(window.midnight).map(([key, wallet]) => ({ key, wallet }));
}

/**
 * Connect to an injected wallet and read back the service endpoints it prefers.
 *
 * The wallet's own configuration is used rather than hard-coded URLs: the user
 * may be pointed at a private indexer, and overriding that silently would leak
 * their activity to whichever service the DApp happened to prefer.
 */
export async function connectWallet(walletKey?: string): Promise<WalletConnection> {
  const wallets = availableWallets();
  if (wallets.length === 0) {
    throw new Error(
      'No Midnight wallet found. Install the Lace Midnight Preview extension and reload the page.',
    );
  }
  const chosen = walletKey ? wallets.find((w) => w.key === walletKey) : wallets[0];
  if (!chosen) throw new Error(`Wallet "${walletKey}" is not available.`);

  const requestedNetwork = process.env.NEXT_PUBLIC_NETWORK_ID ?? 'preprod';
  const api = await chosen.wallet.connect(requestedNetwork);

  await api.hintUsage([
    'getUnshieldedAddress',
    'getUnshieldedBalances',
    'balanceUnsealedTransaction',
    'submitTransaction',
    'getProvingProvider',
    'getConfiguration',
  ]);

  const configuration = await api.getConfiguration();
  const { unshieldedAddress } = await api.getUnshieldedAddress();

  if (configuration.networkId !== requestedNetwork) {
    throw new Error(
      `The wallet is connected to "${configuration.networkId}" but this app is configured for ` +
        `"${requestedNetwork}". Switch networks in the wallet, or set NEXT_PUBLIC_NETWORK_ID.`,
    );
  }

  return {
    api,
    walletName: chosen.wallet.name,
    networkId: configuration.networkId,
    indexerUri: configuration.indexerUri,
    indexerWsUri: configuration.indexerWsUri,
    unshieldedAddress,
  };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/** Bridges the wallet connector's string-serialized transactions to midnight-js. */
function walletProviderFrom(connection: WalletConnection): WalletProvider & MidnightProvider {
  const { api } = connection;
  return {
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const { tx: balanced } = await api.balanceUnsealedTransaction(
        bytesToHex(tx.serialize()),
      );
      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        hexToBytes(balanced),
      ) as FinalizedTransaction;
    },
    getCoinPublicKey() {
      throw new Error(
        'Mandate operates on unshielded native tokens; no shielded coin public key is used.',
      );
    },
    getEncryptionPublicKey() {
      throw new Error(
        'Mandate operates on unshielded native tokens; no encryption public key is used.',
      );
    },
    async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
      await api.submitTransaction(bytesToHex(tx.serialize()));
      const [identifier] = tx.identifiers();
      return identifier;
    },
  };
}

/**
 * Assemble the provider set for a connected wallet.
 *
 * Proving is delegated to the wallet: `getProvingProvider` hands it the ZK
 * artifacts it needs, and the proof is produced inside the wallet rather than
 * by any service this app controls.
 */
export interface ProviderOptions {
  /**
   * Supplies the password that encrypts private state at rest.
   *
   * This is the key to the mandate rules and to the creator secrets that
   * authorize revocation and withdrawal. Prompt the user for it; never derive
   * it from anything public, and never hard-code one.
   *
   * The provider enforces a strength policy: at least 16 characters, mixing at
   * least three of upper/lower/digit/symbol, no long runs or sequences.
   */
  passwordProvider: () => string | Promise<string>;
  zkBaseUrl?: string;
}

export async function createProviders(
  connection: WalletConnection,
  options: ProviderOptions,
): Promise<MandateProviders> {
  const zkBaseUrl =
    options.zkBaseUrl ??
    (typeof window === 'undefined'
      ? DEFAULT_ZK_BASE_PATH
      : new URL(DEFAULT_ZK_BASE_PATH, window.location.origin).toString());

  const zkConfigProvider = new FetchZkConfigProvider<MandateCircuitId>(zkBaseUrl);
  const provingProvider = await connection.api.getProvingProvider(
    zkConfigProvider.asKeyMaterialProvider(),
  );
  const proofProvider: ProofProvider = createProofProvider(provingProvider);
  const wallet = walletProviderFrom(connection);

  return {
    privateStateProvider: levelPrivateStateProvider<
      typeof PRIVATE_STATE_ID,
      MandatePrivateState
    >({
      privateStateStoreName: 'mandate-private-state',
      privateStoragePasswordProvider: options.passwordProvider,
      // Scopes storage per wallet, so two accounts in one browser never see
      // each other's mandates.
      accountId: connection.unshieldedAddress,
    }),
    publicDataProvider: indexerPublicDataProvider(
      connection.indexerUri,
      connection.indexerWsUri,
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}

// ---------------------------------------------------------------------------
// Deploy / connect
// ---------------------------------------------------------------------------

/** Deploy a fresh Mandate registry. Normally done once per environment. */
export async function deployMandateRegistry(
  providers: MandateProviders,
  initialPrivateState: MandatePrivateState,
): Promise<DeployedContract<MandateContract>> {
  return deployContract<MandateContract>(providers, {
    compiledContract: compiledMandateContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });
}

/** Connect to an already-deployed registry at `contractAddress`. */
export async function connectMandateRegistry(
  providers: MandateProviders,
  contractAddress: string,
  initialPrivateState: MandatePrivateState,
): Promise<FoundContract<MandateContract>> {
  return findDeployedContract<MandateContract>(providers, {
    compiledContract: compiledMandateContract,
    contractAddress,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

type Registry = FoundContract<MandateContract>;

export interface TxOutcome {
  txId: string;
  blockHeight?: number;
}

function outcomeOf(result: { public: { txId: string; blockHeight?: number } }): TxOutcome {
  return { txId: result.public.txId, blockHeight: result.public.blockHeight };
}

export async function createMandateOnChain(
  registry: Registry,
  id: string,
  deposit: bigint,
): Promise<TxOutcome> {
  const result = await registry.callTx.createMandate(hexToBytes(id), deposit);
  return outcomeOf(result as never);
}

export async function fundMandateOnChain(
  registry: Registry,
  id: string,
  amount: bigint,
): Promise<TxOutcome> {
  const result = await registry.callTx.fundMandate(hexToBytes(id), amount);
  return outcomeOf(result as never);
}

export async function executeActionOnChain(
  registry: Registry,
  id: string,
  recipient: string,
  amount: bigint,
  now: number,
  networkId: string,
): Promise<TxOutcome> {
  const result = await registry.callTx.executeAction(
    hexToBytes(id),
    decodeUnshieldedAddress(recipient, networkId),
    amount,
    BigInt(now),
  );
  return outcomeOf(result as never);
}

export async function revokeMandateOnChain(
  registry: Registry,
  id: string,
): Promise<TxOutcome> {
  const result = await registry.callTx.revokeMandate(hexToBytes(id));
  return outcomeOf(result as never);
}

export async function withdrawOnChain(
  registry: Registry,
  id: string,
  recipient: string,
  networkId: string,
): Promise<TxOutcome> {
  const result = await registry.callTx.withdraw(
    hexToBytes(id),
    decodeUnshieldedAddress(recipient, networkId),
  );
  return outcomeOf(result as never);
}

export async function discloseTotalSpendRespectedOnChain(
  registry: Registry,
  id: string,
): Promise<TxOutcome> {
  const result = await registry.callTx.discloseTotalSpendRespected(hexToBytes(id));
  return outcomeOf(result as never);
}

export async function discloseFieldOnChain(
  registry: Registry,
  id: string,
  kind: bigint,
): Promise<TxOutcome> {
  const result = await registry.callTx.discloseField(hexToBytes(id), kind);
  return outcomeOf(result as never);
}

// ---------------------------------------------------------------------------
// Reading public state
// ---------------------------------------------------------------------------

/**
 * Read the public record for one mandate.
 *
 * Returns `undefined` when the registry has no such mandate — a normal outcome
 * while a creation transaction is still being indexed.
 */
export function readMandateRecord(
  ledgerState: { mandates: { member(k: Uint8Array): boolean; lookup(k: Uint8Array): never } },
  id: string,
): MandateRecordView | undefined {
  const key = hexToBytes(id);
  if (!ledgerState.mandates.member(key)) return undefined;
  return toRecordView(id, ledgerState.mandates.lookup(key));
}
