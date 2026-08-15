import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_3 = __compactRuntime.CompactTypeBoolean;

class _MandateRecord_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment())))))))));
  }
  fromValue(value_0) {
    return {
      commitment: _descriptor_0.fromValue(value_0),
      agentPublicKey: _descriptor_0.fromValue(value_0),
      creatorAuth: _descriptor_0.fromValue(value_0),
      escrow: _descriptor_1.fromValue(value_0),
      deposited: _descriptor_1.fromValue(value_0),
      spent: _descriptor_1.fromValue(value_0),
      periodStart: _descriptor_2.fromValue(value_0),
      periodSpent: _descriptor_1.fromValue(value_0),
      actionCount: _descriptor_2.fromValue(value_0),
      revoked: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.commitment).concat(_descriptor_0.toValue(value_0.agentPublicKey).concat(_descriptor_0.toValue(value_0.creatorAuth).concat(_descriptor_1.toValue(value_0.escrow).concat(_descriptor_1.toValue(value_0.deposited).concat(_descriptor_1.toValue(value_0.spent).concat(_descriptor_2.toValue(value_0.periodStart).concat(_descriptor_1.toValue(value_0.periodSpent).concat(_descriptor_2.toValue(value_0.actionCount).concat(_descriptor_3.toValue(value_0.revoked))))))))));
  }
}

const _descriptor_4 = new _MandateRecord_0();

const _descriptor_5 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

class _Disclosure_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_5.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment())));
  }
  fromValue(value_0) {
    return {
      mandateId: _descriptor_0.fromValue(value_0),
      kind: _descriptor_5.fromValue(value_0),
      value: _descriptor_1.fromValue(value_0),
      revealsValue: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.mandateId).concat(_descriptor_5.toValue(value_0.kind).concat(_descriptor_1.toValue(value_0.value).concat(_descriptor_3.toValue(value_0.revealsValue))));
  }
}

const _descriptor_6 = new _Disclosure_0();

const _descriptor_7 = new __compactRuntime.CompactTypeVector(8, _descriptor_0);

class _MandateRules_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_7.alignment().concat(_descriptor_0.alignment()))))))));
  }
  fromValue(value_0) {
    return {
      maxTotalSpend: _descriptor_1.fromValue(value_0),
      maxPerTransaction: _descriptor_1.fromValue(value_0),
      validFrom: _descriptor_2.fromValue(value_0),
      validUntil: _descriptor_2.fromValue(value_0),
      periodSeconds: _descriptor_2.fromValue(value_0),
      periodLimit: _descriptor_1.fromValue(value_0),
      restrictRecipients: _descriptor_3.fromValue(value_0),
      allowedRecipients: _descriptor_7.fromValue(value_0),
      agentPublicKey: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.maxTotalSpend).concat(_descriptor_1.toValue(value_0.maxPerTransaction).concat(_descriptor_2.toValue(value_0.validFrom).concat(_descriptor_2.toValue(value_0.validUntil).concat(_descriptor_2.toValue(value_0.periodSeconds).concat(_descriptor_1.toValue(value_0.periodLimit).concat(_descriptor_3.toValue(value_0.restrictRecipients).concat(_descriptor_7.toValue(value_0.allowedRecipients).concat(_descriptor_0.toValue(value_0.agentPublicKey)))))))));
  }
}

const _descriptor_8 = new _MandateRules_0();

const _descriptor_9 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

class _Either_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_10 = new _Either_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_11 = new _ContractAddress_0();

class _UserAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_12 = new _UserAddress_0();

class _Either_1 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_11.alignment().concat(_descriptor_12.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_11.fromValue(value_0),
      right: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_11.toValue(value_0.left).concat(_descriptor_12.toValue(value_0.right)));
  }
}

const _descriptor_13 = new _Either_1();

class _Maybe_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_6.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_3.fromValue(value_0),
      value: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_some).concat(_descriptor_6.toValue(value_0.value));
  }
}

const _descriptor_14 = new _Maybe_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.localRules) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localRules');
    }
    if (typeof(witnesses_0.localSalt) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localSalt');
    }
    if (typeof(witnesses_0.localAgentSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localAgentSecretKey');
    }
    if (typeof(witnesses_0.localCreatorSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localCreatorSecretKey');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      deriveAgentPublicKey(context, ...args_1) {
        return { result: pureCircuits.deriveAgentPublicKey(...args_1), context };
      },
      deriveCreatorAuth(context, ...args_1) {
        return { result: pureCircuits.deriveCreatorAuth(...args_1), context };
      },
      deriveMandateCommitment(context, ...args_1) {
        return { result: pureCircuits.deriveMandateCommitment(...args_1), context };
      },
      createMandate: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`createMandate: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        const deposit_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createMandate',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 181 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('createMandate',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 181 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        if (!(typeof(deposit_0) === 'bigint' && deposit_0 >= 0n && deposit_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('createMandate',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'mandate.compact line 181 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     deposit_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0).concat(_descriptor_1.toValue(deposit_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._createMandate_0(context,
                                               partialProofData,
                                               id_0,
                                               deposit_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      fundMandate: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`fundMandate: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        const amount_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('fundMandate',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 222 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('fundMandate',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 222 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('fundMandate',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'mandate.compact line 222 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     amount_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0).concat(_descriptor_1.toValue(amount_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._fundMandate_0(context,
                                             partialProofData,
                                             id_0,
                                             amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      executeAction: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`executeAction: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        const recipient_0 = args_1[2];
        const amount_0 = args_1[3];
        const now_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('executeAction',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 256 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('executeAction',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 256 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        if (!(recipient_0.buffer instanceof ArrayBuffer && recipient_0.BYTES_PER_ELEMENT === 1 && recipient_0.length === 32)) {
          __compactRuntime.typeError('executeAction',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'mandate.compact line 256 char 1',
                                     'Bytes<32>',
                                     recipient_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('executeAction',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'mandate.compact line 256 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     amount_0)
        }
        if (!(typeof(now_0) === 'bigint' && now_0 >= 0n && now_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('executeAction',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'mandate.compact line 256 char 1',
                                     'Uint<0..18446744073709551616>',
                                     now_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0).concat(_descriptor_0.toValue(recipient_0).concat(_descriptor_1.toValue(amount_0).concat(_descriptor_2.toValue(now_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._executeAction_0(context,
                                               partialProofData,
                                               id_0,
                                               recipient_0,
                                               amount_0,
                                               now_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      revokeMandate: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`revokeMandate: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('revokeMandate',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 348 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('revokeMandate',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 348 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._revokeMandate_0(context, partialProofData, id_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      withdraw: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`withdraw: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        const recipient_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('withdraw',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 377 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('withdraw',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 377 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        if (!(recipient_0.buffer instanceof ArrayBuffer && recipient_0.BYTES_PER_ELEMENT === 1 && recipient_0.length === 32)) {
          __compactRuntime.typeError('withdraw',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'mandate.compact line 377 char 1',
                                     'Bytes<32>',
                                     recipient_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0).concat(_descriptor_0.toValue(recipient_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._withdraw_0(context,
                                          partialProofData,
                                          id_0,
                                          recipient_0);
        partialProofData.output = { value: _descriptor_1.toValue(result_0), alignment: _descriptor_1.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      discloseTotalSpendRespected: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`discloseTotalSpendRespected: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('discloseTotalSpendRespected',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 414 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('discloseTotalSpendRespected',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 414 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._discloseTotalSpendRespected_0(context,
                                                             partialProofData,
                                                             id_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      discloseField: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`discloseField: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        const kind_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('discloseField',
                                     'argument 1 (as invoked from Typescript)',
                                     'mandate.compact line 442 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('discloseField',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'mandate.compact line 442 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        if (!(typeof(kind_0) === 'bigint' && kind_0 >= 0n && kind_0 <= 255n)) {
          __compactRuntime.typeError('discloseField',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'mandate.compact line 442 char 1',
                                     'Uint<0..256>',
                                     kind_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0).concat(_descriptor_5.toValue(kind_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._discloseField_0(context,
                                               partialProofData,
                                               id_0,
                                               kind_0);
        partialProofData.output = { value: _descriptor_1.toValue(result_0), alignment: _descriptor_1.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      createMandate: this.circuits.createMandate,
      fundMandate: this.circuits.fundMandate,
      executeAction: this.circuits.executeAction,
      revokeMandate: this.circuits.revokeMandate,
      withdraw: this.circuits.withdraw,
      discloseTotalSpendRespected: this.circuits.discloseTotalSpendRespected,
      discloseField: this.circuits.discloseField
    };
    this.provableCircuits = {
      createMandate: this.circuits.createMandate,
      fundMandate: this.circuits.fundMandate,
      executeAction: this.circuits.executeAction,
      revokeMandate: this.circuits.revokeMandate,
      withdraw: this.circuits.withdraw,
      discloseTotalSpendRespected: this.circuits.discloseTotalSpendRespected,
      discloseField: this.circuits.discloseField
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('createMandate', new __compactRuntime.ContractOperation());
    state_0.setOperation('fundMandate', new __compactRuntime.ContractOperation());
    state_0.setOperation('executeAction', new __compactRuntime.ContractOperation());
    state_0.setOperation('revokeMandate', new __compactRuntime.ContractOperation());
    state_0.setOperation('withdraw', new __compactRuntime.ContractOperation());
    state_0.setOperation('discloseTotalSpendRespected', new __compactRuntime.ContractOperation());
    state_0.setOperation('discloseField', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(0n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(1n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                                                                                             alignment: _descriptor_2.alignment() }))
                                                          .encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: new Uint8Array(32) };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _nativeToken_0() {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _blockTimeLt_0(context, partialProofData, time_0) {
    return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 2 } },
                                                                      { idx: { cached: true,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_5.toValue(2n),
                                                                                                 alignment: _descriptor_5.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(time_0),
                                                                                                                             alignment: _descriptor_2.alignment() }).encode() } },
                                                                      'lt',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value);
  }
  _blockTimeGte_0(context, partialProofData, time_0) {
    return !this._blockTimeLt_0(context, partialProofData, time_0);
  }
  _sendUnshielded_0(context, partialProofData, color_0, amount_0, recipient_0) {
    const tmp_0 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(7n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(amount_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    const tmp_1 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(8n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                              { value: _descriptor_10.toValue(tmp_1),
                                                                                                alignment: _descriptor_10.alignment() },
                                                                                              { value: _descriptor_13.toValue(recipient_0),
                                                                                                alignment: _descriptor_13.alignment() }
                                                                                            )).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(amount_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (recipient_0.is_left
        &&
        this._equal_0(recipient_0.left.bytes,
                      _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 2 } },
                                                                                  { idx: { cached: true,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_5.toValue(0n),
                                                                                                             alignment: _descriptor_5.alignment() } }] } },
                                                                                  { popeq: { cached: true,
                                                                                             result: undefined } }]).value).bytes))
    {
      const tmp_2 = this._left_0(color_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_5.toValue(6n),
                                                                    alignment: _descriptor_5.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_2),
                                                                                                alignment: _descriptor_10.alignment() }).encode() } },
                                         { dup: { n: 1 } },
                                         { dup: { n: 1 } },
                                         'member',
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(amount_0),
                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                         { swap: { n: 0 } },
                                         'neg',
                                         { branch: { skip: 4 } },
                                         { dup: { n: 2 } },
                                         { dup: { n: 2 } },
                                         { idx: { cached: true,
                                                  pushPath: false,
                                                  path: [ { tag: 'stack' }] } },
                                         'add',
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    return [];
  }
  _receiveUnshielded_0(context, partialProofData, color_0, amount_0) {
    const tmp_0 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(6n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(amount_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_9, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_8,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _agentKeyDomain_0() {
    return new Uint8Array([109, 97, 110, 100, 97, 116, 101, 58, 97, 103, 101, 110, 116, 45, 107, 101, 121, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _creatorKeyDomain_0() {
    return new Uint8Array([109, 97, 110, 100, 97, 116, 101, 58, 99, 114, 101, 97, 116, 111, 114, 45, 107, 101, 121, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _localRules_0(context, partialProofData, id_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localRules(witnessContext_0,
                                                                     id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && typeof(result_0.maxTotalSpend) === 'bigint' && result_0.maxTotalSpend >= 0n && result_0.maxTotalSpend <= 340282366920938463463374607431768211455n && typeof(result_0.maxPerTransaction) === 'bigint' && result_0.maxPerTransaction >= 0n && result_0.maxPerTransaction <= 340282366920938463463374607431768211455n && typeof(result_0.validFrom) === 'bigint' && result_0.validFrom >= 0n && result_0.validFrom <= 18446744073709551615n && typeof(result_0.validUntil) === 'bigint' && result_0.validUntil >= 0n && result_0.validUntil <= 18446744073709551615n && typeof(result_0.periodSeconds) === 'bigint' && result_0.periodSeconds >= 0n && result_0.periodSeconds <= 18446744073709551615n && typeof(result_0.periodLimit) === 'bigint' && result_0.periodLimit >= 0n && result_0.periodLimit <= 340282366920938463463374607431768211455n && typeof(result_0.restrictRecipients) === 'boolean' && Array.isArray(result_0.allowedRecipients) && result_0.allowedRecipients.length === 8 && result_0.allowedRecipients.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32) && result_0.agentPublicKey.buffer instanceof ArrayBuffer && result_0.agentPublicKey.BYTES_PER_ELEMENT === 1 && result_0.agentPublicKey.length === 32)) {
      __compactRuntime.typeError('localRules',
                                 'return value',
                                 'mandate.compact line 118 char 1',
                                 'struct MandateRules<maxTotalSpend: Uint<0..340282366920938463463374607431768211456>, maxPerTransaction: Uint<0..340282366920938463463374607431768211456>, validFrom: Uint<0..18446744073709551616>, validUntil: Uint<0..18446744073709551616>, periodSeconds: Uint<0..18446744073709551616>, periodLimit: Uint<0..340282366920938463463374607431768211456>, restrictRecipients: Boolean, allowedRecipients: Vector<8, Bytes<32>>, agentPublicKey: Bytes<32>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_8.toValue(result_0),
      alignment: _descriptor_8.alignment()
    });
    return result_0;
  }
  _localSalt_0(context, partialProofData, id_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localSalt(witnessContext_0,
                                                                    id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localSalt',
                                 'return value',
                                 'mandate.compact line 120 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _localAgentSecretKey_0(context, partialProofData, id_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localAgentSecretKey(witnessContext_0,
                                                                              id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localAgentSecretKey',
                                 'return value',
                                 'mandate.compact line 122 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _localCreatorSecretKey_0(context, partialProofData, id_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localCreatorSecretKey(witnessContext_0,
                                                                                id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localCreatorSecretKey',
                                 'return value',
                                 'mandate.compact line 124 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _deriveAgentPublicKey_0(secretKey_0) {
    return this._persistentHash_0([this._agentKeyDomain_0(), secretKey_0]);
  }
  _deriveCreatorAuth_0(secretKey_0) {
    return this._persistentHash_0([this._creatorKeyDomain_0(), secretKey_0]);
  }
  _deriveMandateCommitment_0(rules_0, salt_0) {
    return this._persistentCommit_0(rules_0, salt_0);
  }
  _anyMatch_0(acc_0, allowed_0, target_0) {
    return acc_0 || this._equal_1(allowed_0, target_0);
  }
  _bindToBlockTime_0(context, partialProofData, now_0) {
    __compactRuntime.assert(this._blockTimeGte_0(context,
                                                 partialProofData,
                                                 now_0),
                            'Mandate: claimed timestamp is in the future');
    __compactRuntime.assert(this._blockTimeLt_0(context,
                                                partialProofData,
                                                ((t1) => {
                                                  if (t1 > 18446744073709551615n) {
                                                    throw new __compactRuntime.CompactError('mandate.compact line 164 char 22: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                                  }
                                                  return t1;
                                                })(now_0 + 300n)),
                            'Mandate: claimed timestamp is stale');
    return [];
  }
  _createMandate_0(context, partialProofData, id_0, deposit_0) {
    const mandateId_0 = id_0;
    __compactRuntime.assert(!_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_5.toValue(0n),
                                                                                                                   alignment: _descriptor_5.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Mandate: id already in use');
    __compactRuntime.assert(deposit_0 > 0n,
                            'Mandate: deposit must be greater than zero');
    const rules_0 = this._localRules_0(context, partialProofData, id_0);
    const salt_0 = this._localSalt_0(context, partialProofData, id_0);
    let t_0;
    __compactRuntime.assert((t_0 = rules_0.maxPerTransaction, t_0 > 0n),
                            'Mandate: maxPerTransaction must be greater than zero');
    let t_1;
    __compactRuntime.assert((t_1 = rules_0.maxPerTransaction,
                             t_1 <= rules_0.maxTotalSpend),
                            'Mandate: maxPerTransaction cannot exceed maxTotalSpend');
    let t_2;
    __compactRuntime.assert((t_2 = rules_0.validFrom, t_2 < rules_0.validUntil),
                            'Mandate: validFrom must precede validUntil');
    let t_3, t_4;
    __compactRuntime.assert(!(t_4 = rules_0.periodSeconds, t_4 > 0n)
                            ||
                            (t_3 = rules_0.periodLimit, t_3 > 0n),
                            'Mandate: a rolling period needs a non-zero periodLimit');
    const commitment_0 = this._deriveMandateCommitment_0(rules_0, salt_0);
    const agentPk_0 = rules_0.agentPublicKey;
    const creatorAuth_0 = this._deriveCreatorAuth_0(this._localCreatorSecretKey_0(context,
                                                                                  partialProofData,
                                                                                  id_0));
    const amount_0 = deposit_0;
    this._receiveUnshielded_0(context,
                              partialProofData,
                              this._nativeToken_0(),
                              amount_0);
    const tmp_0 = { commitment: commitment_0,
                    agentPublicKey: agentPk_0,
                    creatorAuth: creatorAuth_0,
                    escrow: amount_0,
                    deposited: amount_0,
                    spent: 0n,
                    periodStart: 0n,
                    periodSpent: 0n,
                    actionCount: 0n,
                    revoked: false };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(0n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return commitment_0;
  }
  _fundMandate_0(context, partialProofData, id_0, amount_0) {
    const mandateId_0 = id_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_5.toValue(0n),
                                                                                                                  alignment: _descriptor_5.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Mandate: unknown mandate');
    const rec_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_5.toValue(0n),
                                                                                                        alignment: _descriptor_5.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(mandateId_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(!rec_0.revoked, 'Mandate: mandate has been revoked');
    __compactRuntime.assert(amount_0 > 0n,
                            'Mandate: amount must be greater than zero');
    const value_0 = amount_0;
    this._receiveUnshielded_0(context,
                              partialProofData,
                              this._nativeToken_0(),
                              value_0);
    const tmp_0 = { commitment: rec_0.commitment,
                    agentPublicKey: rec_0.agentPublicKey,
                    creatorAuth: rec_0.creatorAuth,
                    escrow:
                      ((t1) => {
                        if (t1 > 340282366920938463463374607431768211455n) {
                          throw new __compactRuntime.CompactError('mandate.compact line 236 char 13: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                        }
                        return t1;
                      })(rec_0.escrow + value_0),
                    deposited:
                      ((t1) => {
                        if (t1 > 340282366920938463463374607431768211455n) {
                          throw new __compactRuntime.CompactError('mandate.compact line 237 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                        }
                        return t1;
                      })(rec_0.deposited + value_0),
                    spent: rec_0.spent,
                    periodStart: rec_0.periodStart,
                    periodSpent: rec_0.periodSpent,
                    actionCount: rec_0.actionCount,
                    revoked: rec_0.revoked };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(0n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _executeAction_0(context, partialProofData, id_0, recipient_0, amount_0, now_0)
  {
    const mandateId_0 = id_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_5.toValue(0n),
                                                                                                                  alignment: _descriptor_5.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Mandate: unknown mandate');
    const rec_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_5.toValue(0n),
                                                                                                        alignment: _descriptor_5.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(mandateId_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(!rec_0.revoked, 'Mandate: mandate has been revoked');
    const value_0 = amount_0;
    const to_0 = recipient_0;
    const timestamp_0 = now_0;
    const rules_0 = this._localRules_0(context, partialProofData, id_0);
    const salt_0 = this._localSalt_0(context, partialProofData, id_0);
    __compactRuntime.assert(this._equal_2(this._deriveMandateCommitment_0(rules_0,
                                                                          salt_0),
                                          rec_0.commitment),
                            'Mandate: rules do not open the on-chain commitment');
    __compactRuntime.assert(this._equal_3(this._deriveAgentPublicKey_0(this._localAgentSecretKey_0(context,
                                                                                                   partialProofData,
                                                                                                   id_0)),
                                          rec_0.agentPublicKey),
                            'Mandate: caller is not the authorized agent');
    this._bindToBlockTime_0(context, partialProofData, timestamp_0);
    __compactRuntime.assert(timestamp_0 >= rules_0.validFrom,
                            'Mandate: mandate is not yet valid');
    __compactRuntime.assert(timestamp_0 < rules_0.validUntil,
                            'Mandate: mandate has expired');
    __compactRuntime.assert(value_0 > 0n,
                            'Mandate: amount must be greater than zero');
    __compactRuntime.assert(value_0 <= rules_0.maxPerTransaction,
                            'Mandate: amount exceeds the per-transaction limit');
    const newSpent_0 = rec_0.spent + value_0;
    __compactRuntime.assert(newSpent_0 <= rules_0.maxTotalSpend,
                            'Mandate: amount exceeds the total spend limit');
    const allowed_0 = this._folder_0((...args_0) => this._anyMatch_0(...args_0),
                                     false,
                                     rules_0.allowedRecipients,
                                     [to_0,
                                      to_0,
                                      to_0,
                                      to_0,
                                      to_0,
                                      to_0,
                                      to_0,
                                      to_0]);
    __compactRuntime.assert(!rules_0.restrictRecipients || allowed_0,
                            'Mandate: recipient is not on the allow-list');
    let t_0;
    const windowElapsed_0 = !(t_0 = rules_0.periodSeconds, t_0 > 0n)
                            ||
                            timestamp_0
                            >=
                            rec_0.periodStart + rules_0.periodSeconds;
    const periodBase_0 = windowElapsed_0 ? 0n : rec_0.periodSpent;
    const newPeriodSpent_0 = periodBase_0 + value_0;
    let t_1;
    __compactRuntime.assert(!(t_1 = rules_0.periodSeconds, t_1 > 0n)
                            ||
                            newPeriodSpent_0 <= rules_0.periodLimit,
                            'Mandate: amount exceeds the rolling-period limit');
    let t_2;
    __compactRuntime.assert((t_2 = rec_0.escrow, t_2 >= value_0),
                            'Mandate: insufficient escrow balance');
    this._sendUnshielded_0(context,
                           partialProofData,
                           this._nativeToken_0(),
                           value_0,
                           this._right_0({ bytes: to_0 }));
    let t_3;
    const tmp_0 = { commitment: rec_0.commitment,
                    agentPublicKey: rec_0.agentPublicKey,
                    creatorAuth: rec_0.creatorAuth,
                    escrow:
                      (t_3 = rec_0.escrow,
                       (__compactRuntime.assert(t_3 >= value_0,
                                                'result of subtraction would be negative'),
                        t_3 - value_0)),
                    deposited: rec_0.deposited,
                    spent:
                      ((t1) => {
                        if (t1 > 340282366920938463463374607431768211455n) {
                          throw new __compactRuntime.CompactError('mandate.compact line 333 char 12: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                        }
                        return t1;
                      })(newSpent_0),
                    periodStart:
                      windowElapsed_0 ? timestamp_0 : rec_0.periodStart,
                    periodSpent:
                      ((t1) => {
                        if (t1 > 340282366920938463463374607431768211455n) {
                          throw new __compactRuntime.CompactError('mandate.compact line 335 char 27: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                        }
                        return t1;
                      })(newPeriodSpent_0),
                    actionCount:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('mandate.compact line 336 char 18: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(rec_0.actionCount + 1n),
                    revoked: rec_0.revoked };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(0n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _revokeMandate_0(context, partialProofData, id_0) {
    const mandateId_0 = id_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_5.toValue(0n),
                                                                                                                  alignment: _descriptor_5.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Mandate: unknown mandate');
    const rec_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_5.toValue(0n),
                                                                                                        alignment: _descriptor_5.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(mandateId_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(this._equal_4(this._deriveCreatorAuth_0(this._localCreatorSecretKey_0(context,
                                                                                                  partialProofData,
                                                                                                  id_0)),
                                          rec_0.creatorAuth),
                            'Mandate: caller is not the creator of this mandate');
    __compactRuntime.assert(!rec_0.revoked,
                            'Mandate: mandate is already revoked');
    const tmp_0 = { commitment: rec_0.commitment,
                    agentPublicKey: rec_0.agentPublicKey,
                    creatorAuth: rec_0.creatorAuth,
                    escrow: rec_0.escrow,
                    deposited: rec_0.deposited,
                    spent: rec_0.spent,
                    periodStart: rec_0.periodStart,
                    periodSpent: rec_0.periodSpent,
                    actionCount: rec_0.actionCount,
                    revoked: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(0n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _withdraw_0(context, partialProofData, id_0, recipient_0) {
    const mandateId_0 = id_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_5.toValue(0n),
                                                                                                                  alignment: _descriptor_5.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Mandate: unknown mandate');
    const rec_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_5.toValue(0n),
                                                                                                        alignment: _descriptor_5.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(mandateId_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(this._equal_5(this._deriveCreatorAuth_0(this._localCreatorSecretKey_0(context,
                                                                                                  partialProofData,
                                                                                                  id_0)),
                                          rec_0.creatorAuth),
                            'Mandate: caller is not the creator of this mandate');
    __compactRuntime.assert(rec_0.revoked,
                            'Mandate: revoke the mandate before withdrawing');
    let t_0;
    __compactRuntime.assert((t_0 = rec_0.escrow, t_0 > 0n),
                            'Mandate: nothing left to withdraw');
    const to_0 = recipient_0;
    const refund_0 = rec_0.escrow;
    this._sendUnshielded_0(context,
                           partialProofData,
                           this._nativeToken_0(),
                           refund_0,
                           this._right_0({ bytes: to_0 }));
    const tmp_0 = { commitment: rec_0.commitment,
                    agentPublicKey: rec_0.agentPublicKey,
                    creatorAuth: rec_0.creatorAuth,
                    escrow: 0n,
                    deposited: rec_0.deposited,
                    spent: rec_0.spent,
                    periodStart: rec_0.periodStart,
                    periodSpent: rec_0.periodSpent,
                    actionCount: rec_0.actionCount,
                    revoked: rec_0.revoked };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(0n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return refund_0;
  }
  _discloseTotalSpendRespected_0(context, partialProofData, id_0) {
    const mandateId_0 = id_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_5.toValue(0n),
                                                                                                                  alignment: _descriptor_5.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Mandate: unknown mandate');
    const rec_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_5.toValue(0n),
                                                                                                        alignment: _descriptor_5.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(mandateId_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    const rules_0 = this._localRules_0(context, partialProofData, id_0);
    const salt_0 = this._localSalt_0(context, partialProofData, id_0);
    __compactRuntime.assert(this._equal_6(this._deriveMandateCommitment_0(rules_0,
                                                                          salt_0),
                                          rec_0.commitment),
                            'Mandate: rules do not open the on-chain commitment');
    __compactRuntime.assert(this._equal_7(this._deriveCreatorAuth_0(this._localCreatorSecretKey_0(context,
                                                                                                  partialProofData,
                                                                                                  id_0)),
                                          rec_0.creatorAuth),
                            'Mandate: caller is not the creator of this mandate');
    let t_0;
    __compactRuntime.assert((t_0 = rec_0.spent, t_0 <= rules_0.maxTotalSpend),
                            'Mandate: total spend limit was exceeded');
    const tmp_0 = { mandateId: mandateId_0,
                    kind: 0n,
                    value: 0n,
                    revealsValue: false };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(1n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { dup: { n: 0 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(2n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                                           alignment: _descriptor_6.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                                          .encode() } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(2n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 1 } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(1n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  _discloseField_0(context, partialProofData, id_0, kind_0) {
    const mandateId_0 = id_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_5.toValue(0n),
                                                                                                                  alignment: _descriptor_5.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mandateId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Mandate: unknown mandate');
    const rec_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_5.toValue(0n),
                                                                                                        alignment: _descriptor_5.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(mandateId_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    const rules_0 = this._localRules_0(context, partialProofData, id_0);
    const salt_0 = this._localSalt_0(context, partialProofData, id_0);
    __compactRuntime.assert(this._equal_8(this._deriveMandateCommitment_0(rules_0,
                                                                          salt_0),
                                          rec_0.commitment),
                            'Mandate: rules do not open the on-chain commitment');
    __compactRuntime.assert(this._equal_9(this._deriveCreatorAuth_0(this._localCreatorSecretKey_0(context,
                                                                                                  partialProofData,
                                                                                                  id_0)),
                                          rec_0.creatorAuth),
                            'Mandate: caller is not the creator of this mandate');
    const which_0 = kind_0;
    __compactRuntime.assert(which_0 >= 1n && which_0 <= 3n,
                            'Mandate: unknown disclosure field');
    const revealed_0 = this._equal_10(which_0, 1n) ?
                       rules_0.maxTotalSpend :
                       this._equal_11(which_0, 2n) ?
                       rules_0.maxPerTransaction :
                       rules_0.validUntil;
    const tmp_0 = { mandateId: mandateId_0,
                    kind: which_0,
                    value: revealed_0,
                    revealsValue: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(1n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { dup: { n: 0 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_5.toValue(2n),
                                                                  alignment: _descriptor_5.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                                           alignment: _descriptor_6.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                                          .encode() } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(2n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 1 } },
                                       { swap: { n: 0 } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(1n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       { ins: { cached: true, n: 2 } }]);
    return revealed_0;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _folder_0(f, x, a0, a1) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i], a1[i]); }
    return x;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_11(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    mandates: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(0n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(0n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'mandate.compact line 110 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(0n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'mandate.compact line 110 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(0n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_4.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    disclosureLog: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(1n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(1n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          'type',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(1n),
                                                                                                                                 alignment: _descriptor_5.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      length(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`length: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(1n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_5.toValue(2n),
                                                                                                     alignment: _descriptor_5.alignment() } }] } },
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      head(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`head: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_5.toValue(1n),
                                                                                                      alignment: _descriptor_5.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_5.toValue(0n),
                                                                                                      alignment: _descriptor_5.alignment() } }] } },
                                                                           { dup: { n: 0 } },
                                                                           'type',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(1n),
                                                                                                                                  alignment: _descriptor_5.alignment() }).encode() } },
                                                                           'eq',
                                                                           { branch: { skip: 4 } },
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(1n),
                                                                                                                                  alignment: _descriptor_5.alignment() }).encode() } },
                                                                           { swap: { n: 0 } },
                                                                           { concat: { cached: false,
                                                                                       n: (2+Number(__compactRuntime.maxAlignedSize(
                                                                                               _descriptor_6
                                                                                               .alignment()
                                                                                             ))) } },
                                                                           { jmp: { skip: 2 } },
                                                                           'pop',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                                                                  { value: _descriptor_5.toValue(0n),
                                                                                                                                    alignment: _descriptor_5.alignment() },
                                                                                                                                  { value: _descriptor_6.toValue({ mandateId: new Uint8Array(32), kind: 0n, value: 0n, revealsValue: false }),
                                                                                                                                    alignment: _descriptor_6.alignment() }
                                                                                                                                )).encode() } },
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return (() => {  var iter = { curr: self_0 };  iter.next = () => {    const arr = iter.curr.asArray();    const head = arr[0];    if(head.type() == "null") {      return { done: true };    } else {      iter.curr = arr[1];      return { value: _descriptor_6.fromValue(head.asCell().value), done: false };    }  };  return iter;})();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  localRules: (...args) => undefined,
  localSalt: (...args) => undefined,
  localAgentSecretKey: (...args) => undefined,
  localCreatorSecretKey: (...args) => undefined
});
export const pureCircuits = {
  deriveAgentPublicKey: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`deriveAgentPublicKey: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const secretKey_0 = args_0[0];
    if (!(secretKey_0.buffer instanceof ArrayBuffer && secretKey_0.BYTES_PER_ELEMENT === 1 && secretKey_0.length === 32)) {
      __compactRuntime.typeError('deriveAgentPublicKey',
                                 'argument 1',
                                 'mandate.compact line 133 char 1',
                                 'Bytes<32>',
                                 secretKey_0)
    }
    return _dummyContract._deriveAgentPublicKey_0(secretKey_0);
  },
  deriveCreatorAuth: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`deriveCreatorAuth: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const secretKey_0 = args_0[0];
    if (!(secretKey_0.buffer instanceof ArrayBuffer && secretKey_0.BYTES_PER_ELEMENT === 1 && secretKey_0.length === 32)) {
      __compactRuntime.typeError('deriveCreatorAuth',
                                 'argument 1',
                                 'mandate.compact line 138 char 1',
                                 'Bytes<32>',
                                 secretKey_0)
    }
    return _dummyContract._deriveCreatorAuth_0(secretKey_0);
  },
  deriveMandateCommitment: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`deriveMandateCommitment: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const rules_0 = args_0[0];
    const salt_0 = args_0[1];
    if (!(typeof(rules_0) === 'object' && typeof(rules_0.maxTotalSpend) === 'bigint' && rules_0.maxTotalSpend >= 0n && rules_0.maxTotalSpend <= 340282366920938463463374607431768211455n && typeof(rules_0.maxPerTransaction) === 'bigint' && rules_0.maxPerTransaction >= 0n && rules_0.maxPerTransaction <= 340282366920938463463374607431768211455n && typeof(rules_0.validFrom) === 'bigint' && rules_0.validFrom >= 0n && rules_0.validFrom <= 18446744073709551615n && typeof(rules_0.validUntil) === 'bigint' && rules_0.validUntil >= 0n && rules_0.validUntil <= 18446744073709551615n && typeof(rules_0.periodSeconds) === 'bigint' && rules_0.periodSeconds >= 0n && rules_0.periodSeconds <= 18446744073709551615n && typeof(rules_0.periodLimit) === 'bigint' && rules_0.periodLimit >= 0n && rules_0.periodLimit <= 340282366920938463463374607431768211455n && typeof(rules_0.restrictRecipients) === 'boolean' && Array.isArray(rules_0.allowedRecipients) && rules_0.allowedRecipients.length === 8 && rules_0.allowedRecipients.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32) && rules_0.agentPublicKey.buffer instanceof ArrayBuffer && rules_0.agentPublicKey.BYTES_PER_ELEMENT === 1 && rules_0.agentPublicKey.length === 32)) {
      __compactRuntime.typeError('deriveMandateCommitment',
                                 'argument 1',
                                 'mandate.compact line 144 char 1',
                                 'struct MandateRules<maxTotalSpend: Uint<0..340282366920938463463374607431768211456>, maxPerTransaction: Uint<0..340282366920938463463374607431768211456>, validFrom: Uint<0..18446744073709551616>, validUntil: Uint<0..18446744073709551616>, periodSeconds: Uint<0..18446744073709551616>, periodLimit: Uint<0..340282366920938463463374607431768211456>, restrictRecipients: Boolean, allowedRecipients: Vector<8, Bytes<32>>, agentPublicKey: Bytes<32>>',
                                 rules_0)
    }
    if (!(salt_0.buffer instanceof ArrayBuffer && salt_0.BYTES_PER_ELEMENT === 1 && salt_0.length === 32)) {
      __compactRuntime.typeError('deriveMandateCommitment',
                                 'argument 2',
                                 'mandate.compact line 144 char 1',
                                 'Bytes<32>',
                                 salt_0)
    }
    return _dummyContract._deriveMandateCommitment_0(rules_0, salt_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
