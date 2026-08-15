/**
 * A `MandateExecutor` backed by the in-process simulator.
 *
 * The circuits it runs are the real compiled ones, so a rejection here is a
 * genuine unsatisfiable-constraint failure rather than a mock. What it does not
 * do is consensus, fees, or wallet balancing — for that, point the agent at the
 * chain executor instead.
 */

import { toRecordView } from '../lib/mandate';
import { MandateSimulator } from '../lib/simulator';
import type { MandateRecordView, ProposedAction } from '../lib/types';
import type { MandateExecutor } from './agent';

export class SimulatedExecutor implements MandateExecutor {
  private time: number;

  constructor(
    readonly sim: MandateSimulator,
    startTime: number,
  ) {
    this.time = startTime;
    this.sim.setBlockTime(startTime);
  }

  /** Advance the simulated chain clock. */
  advanceTo(seconds: number): void {
    this.time = seconds;
    this.sim.setBlockTime(seconds);
  }

  advanceBy(seconds: number): void {
    this.advanceTo(this.time + seconds);
  }

  async getChainTime(): Promise<number> {
    return this.time;
  }

  async getRecord(mandateId: string): Promise<MandateRecordView | undefined> {
    const key = Uint8Array.from(
      mandateId.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)),
    );
    if (!this.sim.ledger.mandates.member(key)) return undefined;
    return toRecordView(mandateId, this.sim.ledger.mandates.lookup(key));
  }

  async submit(action: ProposedAction, now: number): Promise<{ txId: string }> {
    this.sim.executeAction(action.mandateId, action.recipient, action.amount, now);
    return { txId: `sim:${action.mandateId.slice(0, 8)}:${now}` };
  }
}
