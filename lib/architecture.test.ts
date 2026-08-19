/**
 * Structural guards on "Midnight is the backbone".
 *
 * The other test file proves the circuits behave correctly. This one proves the
 * *product* cannot reach a spend without them. Both are needed: a correct
 * circuit is worth nothing if the app can authorize around it, and every
 * bypass this project has had was introduced as a convenience, not as an
 * attack. These assertions are what stop one being reintroduced.
 */

import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test, describe } from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

function sourcesUnder(dir: string): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        // Test files are excluded: they quote the very identifiers these guards
        // forbid, so scanning them would only ever match this file.
      } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
        out.push({ path: full.slice(ROOT.length), text: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(join(ROOT, dir));
  return out;
}

describe('the app cannot authorize without Midnight', () => {
  const app = sourcesUnder('app');

  test('no file under app/ imports the in-process simulator', () => {
    for (const file of app) {
      const imports = [...file.text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
      for (const specifier of imports) {
        assert.ok(
          !/simulator|simulated-executor/.test(specifier),
          `${file.path} imports ${specifier}. The simulator produces no proof, so anything ` +
            'it "executes" is unauthorized. It belongs to the tests, never to the app.',
        );
      }
    }
  });

  test('no file under app/ constructs a contract or a circuit context directly', () => {
    for (const file of app) {
      assert.ok(
        !/from\s+'@midnight-ntwrk\/compact-runtime'/.test(file.text),
        `${file.path} reaches for compact-runtime directly. Circuit calls must go through ` +
          'lib/client.ts, where they become proven transactions submitted by the wallet.',
      );
    }
  });

  test('every spend-affecting operation in the session goes through lib/client', () => {
    const session = readFileSync(join(ROOT, 'app/session.ts'), 'utf8');
    for (const call of [
      'createMandateOnChain',
      'fundMandateOnChain',
      'executeActionOnChain',
      'revokeMandateOnChain',
      'withdrawOnChain',
    ]) {
      assert.ok(session.includes(call), `session.ts no longer calls ${call}`);
    }
    // A mode switch is how the previous bypass was expressed. There must not be
    // one: a single path means there is nowhere for a second one to hide.
    assert.ok(
      !/'demo'|"demo"/.test(session),
      'session.ts references a demo mode. There is exactly one path, and it is the chain.',
    );
  });
});

describe('the network is pinned', () => {
  test('nothing reads a network id from the environment', () => {
    for (const file of [...sourcesUnder('app'), ...sourcesUnder('lib'), ...sourcesUnder('agent')]) {
      assert.ok(
        !file.text.includes('NEXT_PUBLIC_NETWORK_ID'),
        `${file.path} reads NEXT_PUBLIC_NETWORK_ID. The network is pinned in lib/network.ts so ` +
          'that no build configuration can point these unaudited circuits at mainnet.',
      );
    }
  });

  test('the wallet connection asks for, and re-checks, the pinned network', () => {
    const client = readFileSync(join(ROOT, 'lib/client.ts'), 'utf8');
    assert.match(
      client,
      /connect\(REQUIRED_NETWORK_ID\)/,
      'connectWallet must request the pinned network id',
    );
    assert.match(
      client,
      /configuration\.networkId !== REQUIRED_NETWORK_ID/,
      'connectWallet must reject a wallet reporting any other network',
    );
  });
});
