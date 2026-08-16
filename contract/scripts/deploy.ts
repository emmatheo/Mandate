/**
 * Deploy the Mandate registry to Midnight Preprod.
 *
 *   npm run contract:deploy
 *
 * Run once per environment. It prints a contract address; put that in
 * NEXT_PUBLIC_CONTRACT_ADDRESS and the DApp will attach to it.
 *
 * This uses a wallet seed from the environment rather than a browser wallet,
 * because deployment is a one-off operational step rather than something an
 * end user does. The seed is read from MIDNIGHT_WALLET_SEED and never written
 * anywhere.
 */

import { webcrypto } from 'node:crypto';

import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { Transaction, type FinalizedTransaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createProofProvider, type UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';

import {
  compiledMandateContract,
  deployMandateRegistry,
  PRIVATE_STATE_ID,
  type MandateCircuitId,
  type MandateProviders,
} from '../../lib/client';
import { emptyPrivateState } from '../../lib/private-state';
import { REQUIRED_NETWORK_ID } from '../../lib/network';

// Node 22 exposes webcrypto but not always as a global; the SDK expects one.
if (!globalThis.crypto) {
  (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `\nMissing ${name}.\n\n` +
        'Set these before deploying:\n' +
        '  MIDNIGHT_WALLET_SEED   hex seed of a funded Preprod wallet\n' +
        '  MIDNIGHT_INDEXER_URI   Preprod indexer GraphQL endpoint\n' +
        '  MIDNIGHT_INDEXER_WS    Preprod indexer websocket endpoint\n' +
        '  MIDNIGHT_NODE_URI      Preprod node RPC endpoint\n' +
        '  MIDNIGHT_PROOF_SERVER  local proof server, e.g. http://127.0.0.1:6300\n' +
        '  MANDATE_ZK_BASE_URL    where the ZK assets are served, e.g. http://127.0.0.1:3000/zk\n' +
        '  MANDATE_STATE_PASSWORD password encrypting local private state (16+ chars)\n',
    );
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const seed = required('MIDNIGHT_WALLET_SEED');
  const indexerUri = required('MIDNIGHT_INDEXER_URI');
  const indexerWs = required('MIDNIGHT_INDEXER_WS');
  const nodeUri = required('MIDNIGHT_NODE_URI');
  const proofServer = required('MIDNIGHT_PROOF_SERVER');
  const zkBaseUrl = required('MANDATE_ZK_BASE_URL');
  const password = required('MANDATE_STATE_PASSWORD');

  console.log(`\nDeploying the Mandate registry to ${REQUIRED_NETWORK_ID}…\n`);

  // The SDK's NetworkId is a branded string; Preprod is pinned in lib/network.
  const wallet = await WalletBuilder.buildFromSeed(
    indexerUri,
    indexerWs,
    proofServer,
    nodeUri,
    seed,
    REQUIRED_NETWORK_ID as never,
  );
  wallet.start();

  const state = await new Promise<{ address: string }>((resolve) => {
    const subscription = wallet.state().subscribe((snapshot) => {
      subscription.unsubscribe();
      resolve(snapshot as unknown as { address: string });
    });
  });
  console.log(`  wallet   ${state.address}`);

  const zkConfigProvider = new FetchZkConfigProvider<MandateCircuitId>(zkBaseUrl);
  const provingProvider = await (
    wallet as unknown as {
      getProvingProvider(k: unknown): Promise<never>;
    }
  ).getProvingProvider(zkConfigProvider.asKeyMaterialProvider());

  const walletBridge = {
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const balanced = await (
        wallet as unknown as { balanceTransaction(t: unknown): Promise<unknown> }
      ).balanceTransaction(tx);
      return balanced as FinalizedTransaction;
    },
    getCoinPublicKey(): never {
      throw new Error('Mandate uses unshielded native tokens only.');
    },
    getEncryptionPublicKey(): never {
      throw new Error('Mandate uses unshielded native tokens only.');
    },
    async submitTx(tx: FinalizedTransaction): Promise<string> {
      return (
        wallet as unknown as { submitTransaction(t: unknown): Promise<string> }
      ).submitTransaction(tx);
    },
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'mandate-deploy-state',
      privateStoragePasswordProvider: () => password,
      accountId: state.address,
    }),
    publicDataProvider: indexerPublicDataProvider(indexerUri, indexerWs),
    zkConfigProvider,
    proofProvider: createProofProvider(provingProvider),
    walletProvider: walletBridge,
    midnightProvider: walletBridge,
  } as unknown as MandateProviders;

  console.log('  compiling providers… ok');
  console.log('  submitting deployment transaction…');

  const deployed = await deployMandateRegistry(
    providers,
    emptyPrivateState(REQUIRED_NETWORK_ID),
  );

  const address = deployed.deployTxData.public.contractAddress;

  console.log('\n  Deployed.\n');
  console.log(`  contract address: ${address}\n`);
  console.log('  Add this to your environment (and to Vercel):\n');
  console.log(`    NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`);

  await wallet.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('\nDeployment failed:\n');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

// Referenced so the import is not elided; the compiled contract carries the
// witnesses and ZK asset binding used by deployMandateRegistry above.
void compiledMandateContract;
void Transaction;
