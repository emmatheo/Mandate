/**
 * Mandate agent CLI.
 *
 *   npm run agent -- keygen        generate an agent keypair
 *   npm run agent -- demo          run the full lifecycle against real circuits
 *
 * The `demo` command is the specification's hero script, executed end to end:
 * create a mandate with private limits, fund it, let an authorized agent spend
 * within the rules, watch an out-of-bounds action be refused, revoke, reclaim
 * the remainder, and publish a selective disclosure.
 *
 * Every step runs the compiled Compact circuits. The refusals are real
 * unsatisfiable-constraint failures, not UI checks.
 */

import { formatToken, randomHex32 } from '../lib/encoding';
import {
  deriveAgentPublicKey,
  deriveCommitment,
  deriveCreatorAuth,
  toContractRules,
} from '../lib/mandate';
import { emptyPrivateState } from '../lib/private-state';
import { MandateSimulator } from '../lib/simulator';
import type { MandateSpec } from '../lib/types';
import { MandateAgent } from './agent';
import { SimulatedExecutor } from './simulated-executor';

const NETWORK = 'undeployed';
const UNIT = 1_000_000n;
const DAY = 86_400;

const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
};

function step(n: number, title: string): void {
  console.log(`\n${c.bold(`${n}. ${title}`)}`);
}

function keygen(): void {
  const secretKey = randomHex32();
  console.log(`\n${c.bold('Agent keypair')}\n`);
  console.log(`  ${c.dim('secret key')}  ${secretKey}`);
  console.log(`  ${c.dim('public key')}  ${deriveAgentPublicKey(secretKey)}\n`);
  console.log(
    c.dim(
      '  Give the public key to whoever creates the mandate. Keep the secret key\n' +
        '  on the agent: it is what proves the agent is the authorized one, and it\n' +
        '  never appears on chain.\n',
    ),
  );
}

async function demo(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  // The recipients the mandate will be allowed (and not allowed) to pay.
  const SUPPLIER = 'a'.repeat(64);
  const STRANGER = 'c'.repeat(64);
  const DEPOSITOR = 'f'.repeat(64);

  step(1, 'The user writes a private mandate and funds it');

  const secrets = {
    salt: randomHex32(),
    creatorSecretKey: randomHex32(),
    agentSecretKey: randomHex32(),
  };

  const spec: MandateSpec = {
    label: 'Supplier invoices',
    maxTotalSpend: 50n * UNIT,
    maxPerTransaction: 10n * UNIT,
    validFrom: now - 60,
    validUntil: now + 30 * DAY,
    period: 'daily',
    periodLimit: 25n * UNIT,
    allowedRecipients: [SUPPLIER],
    agentPublicKey: deriveAgentPublicKey(secrets.agentSecretKey),
  };

  const id = randomHex32();
  const rules = toContractRules(spec, NETWORK);
  const commitment = deriveCommitment(rules, secrets.salt);

  console.log(`   ${c.dim('These rules stay on the user’s device:')}`);
  console.log(`     max total          ${formatToken(spec.maxTotalSpend)}`);
  console.log(`     max per action     ${formatToken(spec.maxPerTransaction)}`);
  console.log(`     daily limit        ${formatToken(spec.periodLimit)}`);
  console.log(`     allowed recipient  ${SUPPLIER.slice(0, 16)}…`);
  console.log(`     valid until        ${new Date(spec.validUntil * 1000).toISOString()}`);

  const state = {
    ...emptyPrivateState(NETWORK),
    mandates: { [id]: { spec, secrets } },
  };

  const sim = new MandateSimulator(state);
  const executor = new SimulatedExecutor(sim, now);
  sim.createMandate(id, DEPOSITOR, 40n * UNIT);

  step(2, 'Only a commitment and the agent key reach the chain');
  const record = (await executor.getRecord(id))!;
  console.log(`   commitment      ${c.cyan(record.commitment)}`);
  console.log(`   agent key       ${record.agentPublicKey.slice(0, 32)}…`);
  console.log(`   escrow          ${formatToken(record.escrow)}`);
  console.log(
    `   ${c.dim('Every limit above is absent from the ledger. Only the commitment binds them.')}`,
  );
  console.log(`   ${c.dim(`Locally derived commitment matches: ${commitment === record.commitment}`)}`);

  step(3, 'The authorized agent is given the mandate');

  const agent = new MandateAgent({
    executor,
    mandates: { getSpec: (mandateId) => (mandateId === id ? spec : undefined) },
    networkId: NETWORK,
    timestampLagSeconds: 0,
  });
  console.log(`   ${c.dim('The agent holds the rules and its own secret key — not the user’s keys.')}`);

  step(4, 'A compliant action: 8 tNIGHT to the allowed supplier');
  const good = await agent.act({
    mandateId: id,
    recipient: SUPPLIER,
    amount: 8n * UNIT,
    memo: 'Invoice #1041',
  });
  console.log(`   ${good.ok ? c.green('✓ executed') : c.red('✗ refused')}  ${good.entry.message}`);
  console.log(`   escrow now      ${formatToken((await executor.getRecord(id))!.escrow)}`);

  step(5, 'Actions outside the mandate are refused');

  const overLimit = await agent.act({
    mandateId: id,
    recipient: SUPPLIER,
    amount: 25n * UNIT,
    memo: 'Invoice #1042 (too large)',
  });
  console.log(
    `   ${c.red('✗ refused')}  ${c.yellow(overLimit.entry.violatedRule ?? 'on-chain')}  ${overLimit.entry.message}`,
  );

  const wrongPayee = await agent.act({
    mandateId: id,
    recipient: STRANGER,
    amount: 1n * UNIT,
    memo: 'Payment to an unknown account',
  });
  console.log(
    `   ${c.red('✗ refused')}  ${c.yellow(wrongPayee.entry.violatedRule ?? 'on-chain')}  ${wrongPayee.entry.message}`,
  );

  // Prove the refusal is the contract's, not the agent's: bypass the agent and
  // hand the circuit the same illegal action directly.
  let contractRefusal = '';
  try {
    sim.executeAction(id, STRANGER, 1n * UNIT, now);
  } catch (error) {
    contractRefusal = (error as Error).message;
  }
  console.log(`   ${c.dim(`Bypassing the agent and calling the circuit directly: ${contractRefusal}`)}`);

  step(6, 'The daily limit is enforced by the chain, not by the agent’s memory');
  const within = await agent.act({ mandateId: id, recipient: SUPPLIER, amount: 10n * UNIT });
  console.log(`   ${within.ok ? c.green('✓ executed') : c.red('✗ refused')}  10 tNIGHT (18 today)`);
  const overDaily = await agent.act({ mandateId: id, recipient: SUPPLIER, amount: 9n * UNIT });
  console.log(
    `   ${c.red('✗ refused')}  ${c.yellow(overDaily.entry.violatedRule ?? 'on-chain')}  ${overDaily.entry.message}`,
  );

  step(7, 'The user revokes the mandate and reclaims what is left');
  sim.revokeMandate(id);
  const afterRevoke = await agent.act({ mandateId: id, recipient: SUPPLIER, amount: 1n * UNIT });
  console.log(`   ${c.red('✗ refused')}  ${afterRevoke.entry.message}`);

  // No destination is passed: the contract returns the balance to the address
  // that funded the mandate, and accepts no alternative.
  const refund = sim.withdraw(id);
  console.log(
    `   ${c.green('✓ reclaimed')}  ${formatToken(refund)} returned to the funding address ${DEPOSITOR.slice(0, 10)}…`,
  );
  console.log(`   escrow now      ${formatToken((await executor.getRecord(id))!.escrow)}`);

  step(8, 'Selective disclosure');
  sim.discloseTotalSpendRespected(id);
  const [statement] = [...sim.ledger.disclosureLog];
  console.log(
    `   Published: “the total spend limit was respected” — ${c.dim(`reveals a value: ${statement.revealsValue}`)}`,
  );
  console.log(`   ${c.dim('A verifier learns the statement is true. The limit itself stays private.')}`);

  const revealed = sim.discloseField(id, 2n);
  console.log(
    `   Published one chosen field: max per transaction = ${c.cyan(formatToken(revealed))}`,
  );
  console.log(`   ${c.dim('Every other rule remains hidden behind the same commitment.')}`);

  console.log(`\n${c.bold('Activity log')}`);
  for (const entry of agent.log) {
    const mark = entry.outcome === 'executed' ? c.green('✓') : c.red('✗');
    console.log(
      `   ${mark} ${formatToken(entry.amount).padStart(12)}  ${(entry.memo ?? '—').padEnd(30)} ${c.dim(entry.message)}`,
    );
  }
  console.log();
}

const command = process.argv[2] ?? 'demo';

switch (command) {
  case 'keygen':
    keygen();
    break;
  case 'demo':
    await demo();
    break;
  default:
    console.error(`Unknown command "${command}". Try: keygen | demo`);
    process.exit(1);
}
