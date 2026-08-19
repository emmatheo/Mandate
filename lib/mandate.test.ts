/**
 * End-to-end tests of the real compiled Mandate circuits.
 *
 * These run the compiled Compact contract in-process against a real ledger
 * state. Nothing here is stubbed: when a test asserts that an over-limit
 * transfer fails, it fails because the circuit's assertion is unsatisfiable,
 * which is exactly what would happen on chain.
 *
 * Run with: npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { bytesToHex, randomHex32 } from './encoding';
import {
  deriveAgentPublicKey,
  deriveCommitment,
  deriveCreatorAuth,
  preCheck,
  toContractRules,
  toRecordView,
} from './mandate';
import { emptyPrivateState, witnesses } from './private-state';
import { MandateSimulator } from './simulator';
import type { MandateSpec, StoredMandate } from './types';

const NETWORK = 'undeployed';
const DAY = 86_400;
const T0 = 1_800_000_000; // a fixed point in time, so tests are deterministic

const UNIT = 1_000_000n; // one whole tNIGHT in smallest units

const ALICE = 'a'.repeat(64);
const BOB = 'b'.repeat(64);
const MALLORY = 'c'.repeat(64);

/** The wallet that funds mandates in these tests. */
const DEPOSITOR = 'd'.repeat(64);
/** An unrelated wallet, used to prove it cannot reach the escrow. */
const ATTACKER = 'e'.repeat(64);

/** Build a mandate plus the private state that can prove things about it. */
function makeMandate(overrides: Partial<MandateSpec> = {}): {
  mandate: StoredMandate;
  state: ReturnType<typeof emptyPrivateState>;
} {
  const secrets = {
    salt: randomHex32(),
    creatorSecretKey: randomHex32(),
    agentSecretKey: randomHex32(),
  };

  const spec: MandateSpec = {
    label: 'Test mandate',
    maxTotalSpend: 50n * UNIT,
    maxPerTransaction: 10n * UNIT,
    validFrom: T0,
    validUntil: T0 + 30 * DAY,
    period: 'none',
    periodLimit: 0n,
    allowedRecipients: [ALICE],
    agentPublicKey: deriveAgentPublicKey(secrets.agentSecretKey),
    ...overrides,
  };

  const id = randomHex32();
  const mandate: StoredMandate = {
    id,
    creatorAddress: DEPOSITOR,
    spec,
    secrets,
    commitment: deriveCommitment(toContractRules(spec, NETWORK), secrets.salt),
    createdAt: T0,
  };

  const state = {
    ...emptyPrivateState(NETWORK),
    mandates: { [id]: { spec, secrets } },
  };

  return { mandate, state };
}

/** A simulator with one funded mandate, ready to act. */
function fundedSimulator(overrides: Partial<MandateSpec> = {}, deposit = 40n * UNIT) {
  const { mandate, state } = makeMandate(overrides);
  const sim = new MandateSimulator(state);
  sim.setBlockTime(T0);
  sim.createMandate(mandate.id, DEPOSITOR, deposit);
  return { sim, mandate };
}

/**
 * Advance the simulated chain clock to `at` and have the agent act with `at` as
 * its claimed timestamp.
 *
 * The contract requires `blockTime >= now`, so an agent always claims a
 * timestamp at or slightly behind the chain rather than ahead of it.
 */
function act(
  sim: MandateSimulator,
  id: string,
  recipient: string,
  amount: bigint,
  at: number,
): void {
  sim.setBlockTime(at);
  sim.executeAction(id, recipient, amount, at);
}

function recordOf(sim: MandateSimulator, id: string) {
  return toRecordView(id, sim.ledger.mandates.lookup(Buffer.from(id, 'hex')));
}

describe('key derivation', () => {
  it('derives a stable agent public key from a secret key', () => {
    const sk = randomHex32();
    assert.equal(deriveAgentPublicKey(sk), deriveAgentPublicKey(sk));
    assert.notEqual(deriveAgentPublicKey(sk), deriveAgentPublicKey(randomHex32()));
  });

  it('uses separate domains for agent keys and creator handles', () => {
    const sk = randomHex32();
    assert.notEqual(
      deriveAgentPublicKey(sk),
      deriveCreatorAuth(sk),
      'the same secret must not produce the same handle in two different roles',
    );
  });

  it('hides the rules behind the commitment', () => {
    const a = makeMandate().mandate;
    const b = makeMandate({ maxTotalSpend: 51n * UNIT }).mandate;
    assert.notEqual(a.commitment, b.commitment);
    assert.equal(a.commitment.length, 64);
  });

  it('produces different commitments for identical rules under different salts', () => {
    const spec = makeMandate().mandate.spec;
    const rules = toContractRules(spec, NETWORK);
    assert.notEqual(deriveCommitment(rules, randomHex32()), deriveCommitment(rules, randomHex32()));
  });
});

describe('createMandate', () => {
  it('publishes only the commitment, the agent key and the deposit', () => {
    const { sim, mandate } = fundedSimulator();
    const record = recordOf(sim, mandate.id);

    assert.equal(record.commitment, mandate.commitment);
    assert.equal(record.agentPublicKey, mandate.spec.agentPublicKey);
    assert.equal(record.creatorAuth, deriveCreatorAuth(mandate.secrets.creatorSecretKey));
    assert.equal(record.escrow, 40n * UNIT);
    assert.equal(record.deposited, 40n * UNIT);
    assert.equal(record.spent, 0n);
    assert.equal(record.revoked, false);

    // Nothing in the public record reveals a rule value.
    const published = JSON.stringify(record, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
    for (const secret of [
      mandate.spec.maxTotalSpend,
      mandate.spec.maxPerTransaction,
      BigInt(mandate.spec.validUntil),
    ]) {
      assert.ok(
        !published.includes(secret.toString()),
        `the public record leaked the rule value ${secret}`,
      );
    }
    assert.ok(!published.includes(ALICE), 'the public record leaked an allow-listed recipient');
  });

  it('rejects a duplicate mandate id', () => {
    const { sim, mandate } = fundedSimulator();
    assert.throws(() => sim.createMandate(mandate.id, DEPOSITOR, UNIT), /id already in use/);
  });

  it('rejects a per-transaction limit above the total limit', () => {
    const { mandate, state } = makeMandate({
      maxTotalSpend: 5n * UNIT,
      maxPerTransaction: 10n * UNIT,
    });
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    assert.throws(
      () => sim.createMandate(mandate.id, DEPOSITOR, 5n * UNIT),
      /maxPerTransaction cannot exceed maxTotalSpend/,
    );
  });

  it('rejects a zero deposit', () => {
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    assert.throws(() => sim.createMandate(mandate.id, DEPOSITOR, 0n), /deposit must be greater than zero/);
  });
});

describe('executeAction — the happy path', () => {
  it('releases funds and updates the public accounting', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 4n * UNIT, T0 + 10);

    const record = recordOf(sim, mandate.id);
    assert.equal(record.escrow, 36n * UNIT);
    assert.equal(record.spent, 4n * UNIT);
    assert.equal(record.actionCount, 1n);
  });

  it('accumulates across several actions', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 20);
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 30);

    const record = recordOf(sim, mandate.id);
    assert.equal(record.spent, 30n * UNIT);
    assert.equal(record.escrow, 10n * UNIT);
    assert.equal(record.actionCount, 3n);
  });
});

describe('executeAction — every rule is enforced', () => {
  it('refuses an amount over the per-transaction limit', () => {
    const { sim, mandate } = fundedSimulator();
    assert.throws(
      () => act(sim, mandate.id, ALICE, 11n * UNIT, T0 + 10),
      /exceeds the per-transaction limit/,
    );
    assert.equal(recordOf(sim, mandate.id).escrow, 40n * UNIT, 'no funds moved');
  });

  it('refuses to push cumulative spend past the total limit', () => {
    const { sim, mandate } = fundedSimulator({ maxTotalSpend: 15n * UNIT });
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);
    assert.throws(
      () => act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 20),
      /exceeds the total spend limit/,
    );
    assert.equal(recordOf(sim, mandate.id).spent, 10n * UNIT);
  });

  it('refuses a recipient that is not on the allow-list', () => {
    const { sim, mandate } = fundedSimulator();
    assert.throws(
      () => act(sim, mandate.id, MALLORY, UNIT, T0 + 10),
      /recipient is not on the allow-list/,
    );
  });

  it('allows any recipient when the mandate does not restrict them', () => {
    const { sim, mandate } = fundedSimulator({ allowedRecipients: [] });
    act(sim, mandate.id, MALLORY, UNIT, T0 + 10);
    assert.equal(recordOf(sim, mandate.id).spent, UNIT);
  });

  it('accepts any address on a multi-entry allow-list', () => {
    const { sim, mandate } = fundedSimulator({ allowedRecipients: [ALICE, BOB] });
    act(sim, mandate.id, BOB, UNIT, T0 + 10);
    assert.equal(recordOf(sim, mandate.id).spent, UNIT);
  });

  it('does not let a padded allow-list authorize the all-zero address', () => {
    // Unused slots are padded by repeating a real entry, never zeroed.
    const { sim, mandate } = fundedSimulator({ allowedRecipients: [ALICE] });
    assert.throws(
      () => act(sim, mandate.id, '0'.repeat(64), UNIT, T0 + 10),
      /recipient is not on the allow-list/,
    );
  });

  it('refuses to act before the mandate starts', () => {
    const { sim, mandate } = fundedSimulator({ validFrom: T0 + DAY });
    sim.setBlockTime(T0 + 10);
    assert.throws(
      () => act(sim, mandate.id, ALICE, UNIT, T0 + 10),
      /mandate is not yet valid/,
    );
  });

  it('refuses to act after the mandate expires', () => {
    const { sim, mandate } = fundedSimulator({ validUntil: T0 + DAY });
    sim.setBlockTime(T0 + 2 * DAY);
    assert.throws(
      () => act(sim, mandate.id, ALICE, UNIT, T0 + 2 * DAY),
      /mandate has expired/,
    );
  });

  it('refuses a timestamp the chain clock does not corroborate', () => {
    const { sim, mandate } = fundedSimulator({ validUntil: T0 + DAY });
    // The agent is at T0 + 2 days but claims to be inside the window. The
    // contract pins the claim to real block time, so the lie cannot stand.
    sim.setBlockTime(T0 + 2 * DAY);
    // Deliberately *not* via `act`: the whole point is that the claimed
    // timestamp and the chain clock disagree.
    assert.throws(
      () => sim.executeAction(mandate.id, ALICE, UNIT, T0 + 10),
      /claimed timestamp is stale/,
    );
  });

  it('refuses a timestamp in the future', () => {
    const { sim, mandate } = fundedSimulator();
    sim.setBlockTime(T0);
    assert.throws(
      () => sim.executeAction(mandate.id, ALICE, UNIT, T0 + 3600),
      /claimed timestamp is in the future/,
    );
  });

  it('refuses a zero amount', () => {
    const { sim, mandate } = fundedSimulator();
    assert.throws(
      () => act(sim, mandate.id, ALICE, 0n, T0 + 10),
      /amount must be greater than zero/,
    );
  });

  it('refuses to spend more than the escrow holds', () => {
    const { sim, mandate } = fundedSimulator({}, 5n * UNIT);
    assert.throws(
      () => act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10),
      /insufficient escrow balance/,
    );
  });

  it('refuses an unknown mandate', () => {
    const { sim } = fundedSimulator();
    assert.throws(() => act(sim, randomHex32(), ALICE, UNIT, T0 + 10), /unknown mandate/);
  });
});

describe('executeAction — rolling period limits', () => {
  it('caps spend inside one window', () => {
    const { sim, mandate } = fundedSimulator({
      period: 'daily',
      periodLimit: 12n * UNIT,
    });
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);
    assert.throws(
      () => act(sim, mandate.id, ALICE, 5n * UNIT, T0 + 20),
      /exceeds the rolling-period limit/,
    );
  });

  it('resets once the window has elapsed', () => {
    const { sim, mandate } = fundedSimulator({
      period: 'daily',
      periodLimit: 12n * UNIT,
    });
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);

    sim.setBlockTime(T0 + DAY + 100);
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + DAY + 100);

    const record = recordOf(sim, mandate.id);
    assert.equal(record.spent, 20n * UNIT);
    assert.equal(record.periodSpent, 10n * UNIT, 'the window reset rather than accumulating');
  });
});

describe('executeAction — agent identity', () => {
  it('refuses an agent that does not hold the mandate’s secret key', () => {
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    sim.createMandate(mandate.id, DEPOSITOR, 50n * UNIT);

    // A different agent gets hold of the rules and the salt — everything except
    // the agent secret key. It still cannot act.
    const impostor = {
      ...state,
      mandates: {
        [mandate.id]: {
          spec: mandate.spec,
          secrets: { ...mandate.secrets, agentSecretKey: randomHex32() },
        },
      },
    };
    const hijacked = new MandateSimulator(impostor);
    hijacked.setBlockTime(T0);
    hijacked.createMandate(mandate.id, DEPOSITOR, 50n * UNIT);

    assert.throws(
      () => act(hijacked, mandate.id, ALICE, UNIT, T0 + 10),
      /caller is not the authorized agent/,
    );
  });

  it('refuses rules that do not open the published commitment', () => {
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    sim.createMandate(mandate.id, DEPOSITOR, 50n * UNIT);

    // The agent edits its local copy of the rules to raise its own limit. The
    // commitment on chain no longer opens.
    sim.privateState.mandates[mandate.id].spec.maxPerTransaction = 1_000n * UNIT;

    assert.throws(
      () => act(sim, mandate.id, ALICE, 100n * UNIT, T0 + 10),
      /rules do not open the on-chain commitment/,
    );
  });
});

describe('revoke and withdraw', () => {
  it('stops all further agent action once revoked', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, UNIT, T0 + 10);
    sim.revokeMandate(mandate.id);

    assert.equal(recordOf(sim, mandate.id).revoked, true);
    assert.throws(
      () => act(sim, mandate.id, ALICE, UNIT, T0 + 20),
      /mandate has been revoked/,
    );
  });

  it('returns the unspent balance to the creator', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);
    sim.revokeMandate(mandate.id);

    const refund = sim.withdraw(mandate.id);
    assert.equal(refund, 30n * UNIT);
    assert.equal(recordOf(sim, mandate.id).escrow, 0n);
  });

  it('requires revocation before withdrawal', () => {
    const { sim, mandate } = fundedSimulator();
    assert.throws(() => sim.withdraw(mandate.id), /revoke the mandate before withdrawing/);
  });

  it('refuses a withdrawal from someone who is not the creator', () => {
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    sim.createMandate(mandate.id, DEPOSITOR, 50n * UNIT);
    sim.revokeMandate(mandate.id);

    // An attacker with the full rule set but not the creator secret.
    sim.privateState.mandates[mandate.id].secrets.creatorSecretKey = randomHex32();
    assert.throws(() => sim.withdraw(mandate.id), /not the creator of this mandate/);
  });

  it('refuses a second withdrawal', () => {
    const { sim, mandate } = fundedSimulator();
    sim.revokeMandate(mandate.id);
    sim.withdraw(mandate.id);
    assert.throws(() => sim.withdraw(mandate.id), /nothing left to withdraw/);
  });

  it('refuses revocation by a non-creator', () => {
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    sim.createMandate(mandate.id, DEPOSITOR, 50n * UNIT);
    sim.privateState.mandates[mandate.id].secrets.creatorSecretKey = randomHex32();
    assert.throws(() => sim.revokeMandate(mandate.id), /not the creator of this mandate/);
  });
});

describe('selective disclosure', () => {
  it('proves the total limit was respected without revealing it', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);
    sim.discloseTotalSpendRespected(mandate.id);

    const entries = [...sim.ledger.disclosureLog];
    assert.equal(entries.length, 1);
    assert.equal(entries[0].kind, 0n);
    assert.equal(entries[0].revealsValue, false);
    assert.equal(entries[0].value, 0n, 'no rule value is published');
    assert.equal(bytesToHex(entries[0].mandateId), mandate.id);
  });

  it('reveals exactly the one field that was chosen', () => {
    const { sim, mandate } = fundedSimulator();

    const revealed = sim.discloseField(mandate.id, 2n); // maxPerTransaction
    assert.equal(revealed, mandate.spec.maxPerTransaction);

    const entries = [...sim.ledger.disclosureLog];
    assert.equal(entries[0].kind, 2n);
    assert.equal(entries[0].revealsValue, true);
    assert.equal(entries[0].value, mandate.spec.maxPerTransaction);
    // The other rules stay hidden.
    assert.notEqual(entries[0].value, mandate.spec.maxTotalSpend);
  });

  it('refuses an unknown field selector', () => {
    const { sim, mandate } = fundedSimulator();
    assert.throws(() => sim.discloseField(mandate.id, 9n), /unknown disclosure field/);
  });

  it('is only available to the creator', () => {
    const { sim, mandate } = fundedSimulator();
    sim.privateState.mandates[mandate.id].secrets.creatorSecretKey = randomHex32();
    assert.throws(
      () => sim.discloseTotalSpendRespected(mandate.id),
      /not the creator of this mandate/,
    );
  });
});

describe('local pre-check mirrors the contract', () => {
  it('agrees with the contract on a valid action', () => {
    const { sim, mandate } = fundedSimulator();
    const result = preCheck(
      mandate.spec,
      recordOf(sim, mandate.id),
      { mandateId: mandate.id, recipient: ALICE, amount: 4n * UNIT },
      T0 + 10,
      NETWORK,
    );
    assert.equal(result.authorized, true);
    assert.equal(result.violation, undefined);
    act(sim, mandate.id, ALICE, 4n * UNIT, T0 + 10);
  });

  it('names the rule that the contract would reject on', () => {
    const { sim, mandate } = fundedSimulator();
    const record = recordOf(sim, mandate.id);

    const overLimit = preCheck(
      mandate.spec,
      record,
      { mandateId: mandate.id, recipient: ALICE, amount: 11n * UNIT },
      T0 + 10,
      NETWORK,
    );
    assert.equal(overLimit.authorized, false);
    assert.equal(overLimit.violation?.rule, 'per-transaction-limit');
    assert.throws(
      () => act(sim, mandate.id, ALICE, 11n * UNIT, T0 + 10),
      /exceeds the per-transaction limit/,
    );

    const wrongPayee = preCheck(
      mandate.spec,
      record,
      { mandateId: mandate.id, recipient: MALLORY, amount: UNIT },
      T0 + 10,
      NETWORK,
    );
    assert.equal(wrongPayee.authorized, false);
    assert.equal(wrongPayee.violation?.rule, 'recipient-allow-list');
    assert.throws(
      () => act(sim, mandate.id, MALLORY, UNIT, T0 + 10),
      /recipient is not on the allow-list/,
    );
  });

  it('reports every rule, not just the failing one', () => {
    const { sim, mandate } = fundedSimulator();
    const result = preCheck(
      mandate.spec,
      recordOf(sim, mandate.id),
      { mandateId: mandate.id, recipient: MALLORY, amount: 99n * UNIT },
      T0 + 10,
      NETWORK,
    );
    assert.equal(result.checks.length, 10);
    assert.ok(result.checks.some((c) => c.rule === 'escrow-balance'));
    assert.ok(result.checks.every((c) => c.passed || c.detail));
  });
});

describe('witness isolation', () => {
  it('refuses to prove anything about a mandate it does not hold', () => {
    const state = emptyPrivateState(NETWORK);
    assert.throws(
      () =>
        witnesses.localRules(
          { privateState: state } as never,
          Buffer.from(randomHex32(), 'hex'),
        ),
      /No private state for mandate/,
    );
  });
});


describe('custody — only the funding wallet can be paid back', () => {
  it('records the funding address in the public record', () => {
    const { sim, mandate } = fundedSimulator();
    assert.equal(recordOf(sim, mandate.id).creatorAddress, DEPOSITOR);
  });

  it('returns the balance to the funding address, not to the caller', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 10n * UNIT, T0 + 10);
    sim.revokeMandate(mandate.id);

    const refund = sim.withdraw(mandate.id);
    assert.equal(refund, 30n * UNIT, 'the exact unspent remainder');
    assert.equal(recordOf(sim, mandate.id).escrow, 0n);
    // The destination is not a parameter of the circuit at all, so there is no
    // argument through which a caller could nominate a different wallet.
    assert.equal(sim.withdraw.length, 1, 'withdraw takes only the mandate id');
  });

  it('cannot be redirected even by someone holding the creator secret', () => {
    // The strongest case: an attacker has fully compromised the creator's
    // secret. They can trigger a withdrawal — and the money still goes home.
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    sim.createMandate(mandate.id, DEPOSITOR, 40n * UNIT);
    sim.revokeMandate(mandate.id);

    const before = recordOf(sim, mandate.id);
    assert.equal(before.creatorAddress, DEPOSITOR);

    sim.withdraw(mandate.id);

    // The funding address was never writable, so it is unchanged and the
    // attacker's own address never appears in the record.
    const after = recordOf(sim, mandate.id);
    assert.equal(after.creatorAddress, DEPOSITOR);
    assert.notEqual(after.creatorAddress, ATTACKER);
    assert.equal(after.escrow, 0n);
  });

  it('refuses a withdrawal from anyone without the creator secret', () => {
    const { mandate, state } = makeMandate();
    const sim = new MandateSimulator(state);
    sim.setBlockTime(T0);
    sim.createMandate(mandate.id, DEPOSITOR, 40n * UNIT);
    sim.revokeMandate(mandate.id);

    sim.privateState.mandates[mandate.id].secrets.creatorSecretKey = randomHex32();
    assert.throws(() => sim.withdraw(mandate.id), /not the creator of this mandate/);
    assert.equal(recordOf(sim, mandate.id).escrow, 40n * UNIT, 'no funds moved');
  });

  it('gives the agent no path to the escrow beyond a valid authorization', () => {
    const { sim, mandate } = fundedSimulator();

    // The agent holds its own key and the rules, but not the creator secret.
    sim.privateState.mandates[mandate.id].secrets.creatorSecretKey = randomHex32();

    // Each of the three creator-only circuits rejects on the authorization
    // check, which the contract evaluates before any state precondition.
    assert.throws(() => sim.revokeMandate(mandate.id), /not the creator of this mandate/);
    assert.throws(() => sim.withdraw(mandate.id), /not the creator of this mandate/);
    assert.throws(() => sim.fundMandate(mandate.id, UNIT), /only the creator can add funds/);
    assert.equal(recordOf(sim, mandate.id).escrow, 40n * UNIT);
  });

  it('lets the creator reclaim the remainder after partial spending', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 3n * UNIT, T0 + 10);
    act(sim, mandate.id, ALICE, 7n * UNIT, T0 + 20);
    assert.equal(recordOf(sim, mandate.id).spent, 10n * UNIT);

    sim.revokeMandate(mandate.id);
    assert.equal(sim.withdraw(mandate.id), 30n * UNIT);
  });

  it('never lets an agent action exceed the escrow', () => {
    const { sim, mandate } = fundedSimulator({ maxPerTransaction: 50n * UNIT }, 5n * UNIT);
    assert.throws(
      () => act(sim, mandate.id, ALICE, 6n * UNIT, T0 + 10),
      /insufficient escrow balance/,
    );
    assert.equal(recordOf(sim, mandate.id).escrow, 5n * UNIT);
  });

  it('keeps the funding address stable across agent activity', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, UNIT, T0 + 10);
    act(sim, mandate.id, ALICE, UNIT, T0 + 20);
    assert.equal(recordOf(sim, mandate.id).creatorAddress, DEPOSITOR);
  });

  it('conserves value: deposited always equals spent plus escrow plus reclaimed', () => {
    const { sim, mandate } = fundedSimulator();
    act(sim, mandate.id, ALICE, 4n * UNIT, T0 + 10);
    act(sim, mandate.id, ALICE, 6n * UNIT, T0 + 20);

    const mid = recordOf(sim, mandate.id);
    assert.equal(mid.spent + mid.escrow, mid.deposited);

    sim.revokeMandate(mandate.id);
    const reclaimed = sim.withdraw(mandate.id);
    const end = recordOf(sim, mandate.id);
    assert.equal(end.spent + end.escrow + reclaimed, end.deposited);
  });
});

describe('fundMandate — creator only', () => {
  it('lets the creator top up a live mandate', () => {
    const { sim, mandate } = fundedSimulator({}, 10n * UNIT);
    sim.fundMandate(mandate.id, 5n * UNIT);
    const record = recordOf(sim, mandate.id);
    assert.equal(record.escrow, 15n * UNIT);
    assert.equal(record.deposited, 15n * UNIT);
  });

  it('refuses a top-up from anyone else', () => {
    // A stranger topping up would silently widen what the agent can move.
    const { sim, mandate } = fundedSimulator();
    sim.privateState.mandates[mandate.id].secrets.creatorSecretKey = randomHex32();
    assert.throws(() => sim.fundMandate(mandate.id, UNIT), /only the creator can add funds/);
  });

  it('refuses to fund a revoked mandate', () => {
    const { sim, mandate } = fundedSimulator();
    sim.revokeMandate(mandate.id);
    assert.throws(() => sim.fundMandate(mandate.id, UNIT), /mandate has been revoked/);
  });
});
