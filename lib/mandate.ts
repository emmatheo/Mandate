/**
 * Translation between the user-facing mandate model and the Compact contract,
 * plus the local rule engine.
 *
 * The rule engine here mirrors, statement for statement, the assertions in
 * `executeAction` in `contract/src/mandate.compact`. It exists so that an agent
 * can fail fast with a precise reason before paying for proof generation, and so
 * the UI can explain *which* rule rejected an action. It is a convenience, never
 * the enforcement: the contract is the enforcement, and a disagreement between
 * the two can only ever cost an unnecessary proof attempt, never authority.
 */

import { pureCircuits, type MandateRules } from '@mandate/contract';

import {
  assertHex32,
  bytesToHex,
  decodeUnshieldedAddress,
  formatToken,
  hexToBytes,
  zeroBytes32,
} from './encoding';
import {
  MAX_ALLOWED_RECIPIENTS,
  PERIOD_SECONDS,
  type MandateRecordView,
  type MandateSpec,
  type PreCheckResult,
  type ProposedAction,
  type RuleCheck,
} from './types';

/** How far in the past a claimed timestamp may be; mirrors the contract. */
export const TIME_TOLERANCE_SECONDS = 300;

/**
 * Build the Compact `MandateRules` struct from a user-authored spec.
 *
 * Recipient padding matters for correctness. The contract folds a fixed vector
 * of eight slots and accepts a match in any of them, so unused slots must never
 * be left zeroed — a zero slot would authorize the all-zero address. Repeating
 * an address already on the list is inert.
 */
export function toContractRules(spec: MandateSpec, networkId: string): MandateRules {
  const restrictRecipients = spec.allowedRecipients.length > 0;

  if (spec.allowedRecipients.length > MAX_ALLOWED_RECIPIENTS) {
    throw new Error(
      `A mandate can allow at most ${MAX_ALLOWED_RECIPIENTS} recipients, got ${spec.allowedRecipients.length}`,
    );
  }

  let allowedRecipients: Uint8Array[];
  if (restrictRecipients) {
    const decoded = spec.allowedRecipients.map((address) =>
      decodeUnshieldedAddress(address, networkId),
    );
    allowedRecipients = Array.from({ length: MAX_ALLOWED_RECIPIENTS }, (_, i) =>
      i < decoded.length ? decoded[i] : decoded[decoded.length - 1],
    );
  } else {
    allowedRecipients = Array.from({ length: MAX_ALLOWED_RECIPIENTS }, () => zeroBytes32());
  }

  const periodSeconds = PERIOD_SECONDS[spec.period];

  return {
    maxTotalSpend: spec.maxTotalSpend,
    maxPerTransaction: spec.maxPerTransaction,
    validFrom: BigInt(spec.validFrom),
    validUntil: BigInt(spec.validUntil),
    periodSeconds,
    periodLimit: periodSeconds === 0n ? 0n : spec.periodLimit,
    restrictRecipients,
    allowedRecipients,
    agentPublicKey: hexToBytes(assertHex32(spec.agentPublicKey, 'Agent public key')),
  };
}

/**
 * Derive the public commitment for a rule set, locally.
 *
 * This runs the contract's own `deriveMandateCommitment` pure circuit, so the
 * value computed in the browser is bit-identical to the one the circuit will
 * recompute on chain. No proof, no network, no server sees the rules.
 */
export function deriveCommitment(rules: MandateRules, salt: string): string {
  return bytesToHex(
    pureCircuits.deriveMandateCommitment(rules, hexToBytes(assertHex32(salt, 'Salt'))),
  );
}

/** The public identity of an agent, derived from its secret key. */
export function deriveAgentPublicKey(agentSecretKey: string): string {
  return bytesToHex(
    pureCircuits.deriveAgentPublicKey(hexToBytes(assertHex32(agentSecretKey, 'Agent secret key'))),
  );
}

/** The creator's authorization handle, derived from their secret key. */
export function deriveCreatorAuth(creatorSecretKey: string): string {
  return bytesToHex(
    pureCircuits.deriveCreatorAuth(
      hexToBytes(assertHex32(creatorSecretKey, 'Creator secret key')),
    ),
  );
}

/**
 * Reject rule sets the contract's `createMandate` would refuse, so the UI can
 * say so before a deposit is ever signed.
 */
export function validateSpec(spec: MandateSpec): string[] {
  const problems: string[] = [];
  if (spec.maxPerTransaction <= 0n) {
    problems.push('The per-transaction limit must be greater than zero.');
  }
  if (spec.maxPerTransaction > spec.maxTotalSpend) {
    problems.push('The per-transaction limit cannot exceed the total spend limit.');
  }
  if (spec.validFrom >= spec.validUntil) {
    problems.push('The mandate must start before it ends.');
  }
  if (spec.period !== 'none' && spec.periodLimit <= 0n) {
    problems.push('A rolling limit needs a non-zero amount.');
  }
  if (spec.allowedRecipients.length > MAX_ALLOWED_RECIPIENTS) {
    problems.push(`At most ${MAX_ALLOWED_RECIPIENTS} recipients can be allow-listed.`);
  }
  try {
    assertHex32(spec.agentPublicKey, 'Agent public key');
  } catch (error) {
    problems.push((error as Error).message);
  }
  return problems;
}

/**
 * Evaluate a proposed action against the private rules and the public record.
 *
 * Returns every rule with its verdict — not just the first failure — so the UI
 * can show the whole picture and the agent can log precisely what happened.
 */
export function preCheck(
  spec: MandateSpec,
  record: MandateRecordView,
  action: ProposedAction,
  now: number,
  networkId: string,
): PreCheckResult {
  const rules = toContractRules(spec, networkId);
  const timestamp = BigInt(now);
  const checks: RuleCheck[] = [];

  const add = (
    rule: RuleCheck['rule'],
    label: string,
    passed: boolean,
    detail?: string,
  ): void => {
    checks.push(passed ? { rule, label, passed } : { rule, label, passed, detail });
  };

  add(
    'agent-identity',
    'Authorized agent',
    bytesToHex(rules.agentPublicKey) === record.agentPublicKey,
    'This mandate is bound to a different agent key.',
  );

  add('not-revoked', 'Mandate is active', !record.revoked, 'The mandate has been revoked.');

  add(
    'valid-from',
    'Within validity window (start)',
    timestamp >= rules.validFrom,
    `The mandate does not start until ${new Date(Number(rules.validFrom) * 1000).toISOString()}.`,
  );

  add(
    'valid-until',
    'Within validity window (end)',
    timestamp < rules.validUntil,
    `The mandate expired on ${new Date(Number(rules.validUntil) * 1000).toISOString()}.`,
  );

  add('amount-positive', 'Amount is positive', action.amount > 0n, 'The amount must be above zero.');

  add(
    'per-transaction-limit',
    'Per-transaction limit',
    action.amount <= rules.maxPerTransaction,
    `${formatToken(action.amount)} exceeds the per-transaction limit of ${formatToken(rules.maxPerTransaction)}.`,
  );

  const newSpent = record.spent + action.amount;
  add(
    'total-spend-limit',
    'Total spend limit',
    newSpent <= rules.maxTotalSpend,
    `This would take total spend to ${formatToken(newSpent)}, past the limit of ${formatToken(rules.maxTotalSpend)}.`,
  );

  let recipientAllowed = true;
  if (rules.restrictRecipients) {
    const target = bytesToHex(decodeUnshieldedAddress(action.recipient, networkId));
    recipientAllowed = rules.allowedRecipients.some((slot) => bytesToHex(slot) === target);
  }
  add(
    'recipient-allow-list',
    'Recipient allow-list',
    recipientAllowed,
    'This recipient is not on the mandate’s allow-list.',
  );

  let periodOk = true;
  let periodDetail: string | undefined;
  if (rules.periodSeconds > 0n) {
    const windowElapsed = timestamp >= record.periodStart + rules.periodSeconds;
    const base = windowElapsed ? 0n : record.periodSpent;
    const newPeriodSpent = base + action.amount;
    periodOk = newPeriodSpent <= rules.periodLimit;
    periodDetail = `This would take spend in the current ${spec.period} window to ${formatToken(newPeriodSpent)}, past the limit of ${formatToken(rules.periodLimit)}.`;
  }
  add('period-limit', 'Rolling period limit', periodOk, periodDetail);

  add(
    'escrow-balance',
    'Escrow balance',
    record.escrow >= action.amount,
    `The escrow holds ${formatToken(record.escrow)}, less than the ${formatToken(action.amount)} requested.`,
  );

  const violation = checks.find((check) => !check.passed);
  return { authorized: violation === undefined, checks, violation };
}

/** Convert the raw ledger record into the view model the app uses. */
export function toRecordView(id: string, record: {
  commitment: Uint8Array;
  agentPublicKey: Uint8Array;
  creatorAuth: Uint8Array;
  escrow: bigint;
  deposited: bigint;
  spent: bigint;
  periodStart: bigint;
  periodSpent: bigint;
  actionCount: bigint;
  revoked: boolean;
}): MandateRecordView {
  return {
    id,
    commitment: bytesToHex(record.commitment),
    agentPublicKey: bytesToHex(record.agentPublicKey),
    creatorAuth: bytesToHex(record.creatorAuth),
    escrow: record.escrow,
    deposited: record.deposited,
    spent: record.spent,
    periodStart: record.periodStart,
    periodSpent: record.periodSpent,
    actionCount: record.actionCount,
    revoked: record.revoked,
  };
}
