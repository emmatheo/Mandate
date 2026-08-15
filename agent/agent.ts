/**
 * The Mandate agent.
 *
 * Scope is deliberately narrow: the agent turns a concrete instruction into a
 * proof and a transaction, or into a precise refusal. It does no planning, no
 * natural-language interpretation, and it never holds the user's master keys —
 * only its own agent secret key and a copy of the mandate it was authorized to
 * use.
 *
 * The loop is deterministic, which matters more than cleverness here: an agent
 * with spending power should behave identically given identical inputs.
 */

import { formatToken } from '../lib/encoding';
import { preCheck } from '../lib/mandate';
import type {
  ActivityEntry,
  MandateRecordView,
  MandateSpec,
  PreCheckResult,
  ProposedAction,
  RuleId,
} from '../lib/types';

/**
 * How the agent reaches the chain.
 *
 * Kept as an interface so the same agent runs unchanged against the local
 * simulator and against a live network.
 */
export interface MandateExecutor {
  /** The current public record, or undefined if the mandate is unknown. */
  getRecord(mandateId: string): Promise<MandateRecordView | undefined>;
  /** The chain's current time, in Unix seconds. */
  getChainTime(): Promise<number>;
  /** Prove and submit. Rejects if the proof cannot be produced or the call reverts. */
  submit(action: ProposedAction, now: number): Promise<{ txId: string }>;
}

/** Where the agent gets the private rules it was authorized to act under. */
export interface MandateSource {
  getSpec(mandateId: string): MandateSpec | undefined;
}

export interface AgentOptions {
  executor: MandateExecutor;
  mandates: MandateSource;
  networkId: string;
  /**
   * Seconds to subtract from chain time when claiming a timestamp.
   *
   * The contract requires the claimed timestamp to be at or behind real block
   * time, so claiming the current instant can lose a race with the next block.
   * A small lag makes that race unlosable while staying well inside the
   * contract's 300-second tolerance.
   */
  timestampLagSeconds?: number;
  onLog?: (entry: ActivityEntry) => void;
}

export interface AgentResult {
  ok: boolean;
  entry: ActivityEntry;
  preCheck?: PreCheckResult;
}

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export class MandateAgent {
  private readonly executor: MandateExecutor;
  private readonly mandates: MandateSource;
  private readonly networkId: string;
  private readonly lag: number;
  private readonly onLog?: (entry: ActivityEntry) => void;

  readonly log: ActivityEntry[] = [];

  constructor(options: AgentOptions) {
    this.executor = options.executor;
    this.mandates = options.mandates;
    this.networkId = options.networkId;
    this.lag = options.timestampLagSeconds ?? 30;
    this.onLog = options.onLog;
  }

  private record(entry: ActivityEntry): ActivityEntry {
    this.log.push(entry);
    this.onLog?.(entry);
    return entry;
  }

  /**
   * Run one action end to end.
   *
   * 1. Load the mandate the agent was authorized to use.
   * 2. Read the current public record.
   * 3. Pre-check locally, so a doomed action fails with a named rule instead of
   *    a wasted proof.
   * 4. Prove and submit.
   * 5. Log the outcome either way.
   */
  async act(action: ProposedAction): Promise<AgentResult> {
    const base = {
      id: nextId(),
      mandateId: action.mandateId,
      at: Math.floor(Date.now() / 1000),
      recipient: action.recipient,
      amount: action.amount,
      memo: action.memo,
    };

    const spec = this.mandates.getSpec(action.mandateId);
    if (!spec) {
      return {
        ok: false,
        entry: this.record({
          ...base,
          outcome: 'rejected-locally',
          message:
            'This agent has not been authorized to use that mandate: it holds no copy of the rules.',
        }),
      };
    }

    const record = await this.executor.getRecord(action.mandateId);
    if (!record) {
      return {
        ok: false,
        entry: this.record({
          ...base,
          outcome: 'rejected-locally',
          message: 'No such mandate exists on chain.',
        }),
      };
    }

    const chainTime = await this.executor.getChainTime();
    const claimedTime = Math.max(0, chainTime - this.lag);

    const check = preCheck(spec, record, action, claimedTime, this.networkId);
    if (!check.authorized) {
      const violation = check.violation!;
      return {
        ok: false,
        preCheck: check,
        entry: this.record({
          ...base,
          outcome: 'rejected-locally',
          violatedRule: violation.rule as RuleId,
          message: `${violation.label}: ${violation.detail ?? 'rule not satisfied'}`,
        }),
      };
    }

    try {
      const { txId } = await this.executor.submit(action, claimedTime);
      return {
        ok: true,
        preCheck: check,
        entry: this.record({
          ...base,
          outcome: 'executed',
          txId,
          message: `Released ${formatToken(action.amount)} under mandate ${action.mandateId.slice(0, 8)}…`,
        }),
      };
    } catch (error) {
      // The contract had the final word. This is the path that matters: if the
      // local pre-check and the circuit ever disagree, the circuit wins.
      return {
        ok: false,
        preCheck: check,
        entry: this.record({
          ...base,
          outcome: 'rejected-on-chain',
          message: describeContractError(error),
        }),
      };
    }
  }

  /** Run a batch in order, stopping at the first refusal. */
  async actAll(actions: ProposedAction[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    for (const action of actions) {
      const result = await this.act(action);
      results.push(result);
      if (!result.ok) break;
    }
    return results;
  }
}

/**
 * Turn a raw circuit failure into something a user can act on.
 *
 * Compact's assertion messages are already written for humans, so the job here
 * is mostly to find them and strip the runtime's framing.
 */
export function describeContractError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const assertion = /failed assert:\s*(.*)/i.exec(raw);
  if (assertion) return assertion[1].trim();
  return raw;
}
