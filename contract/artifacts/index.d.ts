import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type MandateRules = { maxTotalSpend: bigint;
                             maxPerTransaction: bigint;
                             validFrom: bigint;
                             validUntil: bigint;
                             periodSeconds: bigint;
                             periodLimit: bigint;
                             restrictRecipients: boolean;
                             allowedRecipients: Uint8Array[];
                             agentPublicKey: Uint8Array
                           };

export type MandateRecord = { commitment: Uint8Array;
                              agentPublicKey: Uint8Array;
                              creatorAuth: Uint8Array;
                              escrow: bigint;
                              deposited: bigint;
                              spent: bigint;
                              periodStart: bigint;
                              periodSpent: bigint;
                              actionCount: bigint;
                              revoked: boolean
                            };

export type Disclosure = { mandateId: Uint8Array;
                           kind: bigint;
                           value: bigint;
                           revealsValue: boolean
                         };

export type Witnesses<PS> = {
  localRules(context: __compactRuntime.WitnessContext<Ledger, PS>,
             id_0: Uint8Array): [PS, MandateRules];
  localSalt(context: __compactRuntime.WitnessContext<Ledger, PS>,
            id_0: Uint8Array): [PS, Uint8Array];
  localAgentSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      id_0: Uint8Array): [PS, Uint8Array];
  localCreatorSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>,
                        id_0: Uint8Array): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createMandate(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                deposit_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  fundMandate(context: __compactRuntime.CircuitContext<PS>,
              id_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  executeAction(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                recipient_0: Uint8Array,
                amount_0: bigint,
                now_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revokeMandate(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  withdraw(context: __compactRuntime.CircuitContext<PS>,
           id_0: Uint8Array,
           recipient_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  discloseTotalSpendRespected(context: __compactRuntime.CircuitContext<PS>,
                              id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  discloseField(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                kind_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
}

export type ProvableCircuits<PS> = {
  createMandate(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                deposit_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  fundMandate(context: __compactRuntime.CircuitContext<PS>,
              id_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  executeAction(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                recipient_0: Uint8Array,
                amount_0: bigint,
                now_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revokeMandate(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  withdraw(context: __compactRuntime.CircuitContext<PS>,
           id_0: Uint8Array,
           recipient_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  discloseTotalSpendRespected(context: __compactRuntime.CircuitContext<PS>,
                              id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  discloseField(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                kind_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
}

export type PureCircuits = {
  deriveAgentPublicKey(secretKey_0: Uint8Array): Uint8Array;
  deriveCreatorAuth(secretKey_0: Uint8Array): Uint8Array;
  deriveMandateCommitment(rules_0: MandateRules, salt_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  deriveAgentPublicKey(context: __compactRuntime.CircuitContext<PS>,
                       secretKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveCreatorAuth(context: __compactRuntime.CircuitContext<PS>,
                    secretKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveMandateCommitment(context: __compactRuntime.CircuitContext<PS>,
                          rules_0: MandateRules,
                          salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  createMandate(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                deposit_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  fundMandate(context: __compactRuntime.CircuitContext<PS>,
              id_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  executeAction(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                recipient_0: Uint8Array,
                amount_0: bigint,
                now_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revokeMandate(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  withdraw(context: __compactRuntime.CircuitContext<PS>,
           id_0: Uint8Array,
           recipient_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  discloseTotalSpendRespected(context: __compactRuntime.CircuitContext<PS>,
                              id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  discloseField(context: __compactRuntime.CircuitContext<PS>,
                id_0: Uint8Array,
                kind_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
}

export type Ledger = {
  mandates: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): MandateRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, MandateRecord]>
  };
  disclosureLog: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: Disclosure };
    [Symbol.iterator](): Iterator<Disclosure>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
