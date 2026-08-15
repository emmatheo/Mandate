/**
 * A local, in-process execution of the Mandate contract.
 *
 * This runs the *real* compiled circuits against a real ledger state via
 * `@midnight-ntwrk/compact-runtime` — the same code path a node takes, minus
 * proof generation and consensus. Every assertion in `mandate.compact` is live
 * here, so it is the honest way to demonstrate that a rule violation is
 * genuinely unsatisfiable rather than merely refused by the UI.
 *
 * Used by the test-suite and by `npm run agent -- demo`.
 */

import {
  type CircuitContext,
  createCircuitContext,
  createConstructorContext,
  emptyZswapLocalState,
  sampleContractAddress,
  CostModel,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, type Ledger } from '@mandate/contract';

import { hexToBytes } from './encoding';
import { witnesses, type MandatePrivateState } from './private-state';

const COIN_PUBLIC_KEY = '0'.repeat(64);

export class MandateSimulator {
  readonly contract: Contract<MandatePrivateState>;
  private context: CircuitContext<MandatePrivateState>;
  private readonly address = sampleContractAddress();

  constructor(initialPrivateState: MandatePrivateState) {
    this.contract = new Contract<MandatePrivateState>(witnesses);
    const { currentContractState, currentPrivateState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext(initialPrivateState, COIN_PUBLIC_KEY),
      );
    this.context = createCircuitContext(
      this.address,
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
      undefined,
      CostModel.initialCostModel(),
      0,
    );
  }

  /** The current public ledger state, decoded. */
  get ledger(): Ledger {
    return ledger(this.context.currentQueryContext.state);
  }

  get privateState(): MandatePrivateState {
    return this.context.currentPrivateState;
  }

  /** Move the simulated chain clock to `seconds` since the Unix epoch. */
  setBlockTime(seconds: number): void {
    this.context = createCircuitContext(
      this.address,
      this.context.currentZswapLocalState,
      this.context.currentQueryContext.state,
      this.context.currentPrivateState,
      undefined,
      CostModel.initialCostModel(),
      seconds,
    );
  }

  private run<R>(
    fn: (context: CircuitContext<MandatePrivateState>) => { result: R; context: CircuitContext<MandatePrivateState> },
  ): R {
    const { result, context } = fn(this.context);
    this.context = context;
    return result;
  }

  createMandate(id: string, deposit: bigint): Uint8Array {
    return this.run((context) =>
      this.contract.impureCircuits.createMandate(context, hexToBytes(id), deposit),
    );
  }

  fundMandate(id: string, amount: bigint): void {
    this.run((context) =>
      this.contract.impureCircuits.fundMandate(context, hexToBytes(id), amount),
    );
  }

  executeAction(id: string, recipient: string, amount: bigint, now: number): void {
    this.run((context) =>
      this.contract.impureCircuits.executeAction(
        context,
        hexToBytes(id),
        hexToBytes(recipient),
        amount,
        BigInt(now),
      ),
    );
  }

  revokeMandate(id: string): void {
    this.run((context) =>
      this.contract.impureCircuits.revokeMandate(context, hexToBytes(id)),
    );
  }

  withdraw(id: string, recipient: string): bigint {
    return this.run((context) =>
      this.contract.impureCircuits.withdraw(context, hexToBytes(id), hexToBytes(recipient)),
    );
  }

  discloseTotalSpendRespected(id: string): void {
    this.run((context) =>
      this.contract.impureCircuits.discloseTotalSpendRespected(context, hexToBytes(id)),
    );
  }

  discloseField(id: string, kind: bigint): bigint {
    return this.run((context) =>
      this.contract.impureCircuits.discloseField(context, hexToBytes(id), kind),
    );
  }
}
