#!/usr/bin/env node
// Compiles contract/src/mandate.compact and lays the output out where the rest
// of the project expects it:
//
//   contract/artifacts/  the generated TypeScript contract module (imported by
//                        the DApp and the agent)
//   public/zk/keys/      prover + verifier keys, served over HTTP to the proof
//                        server by FetchZkConfigProvider
//   public/zk/zkir/      binary ZKIR, likewise
//
// Both output trees are committed, so a one-click Vercel deploy never needs the
// Compact toolchain. Re-run this only when mandate.compact changes.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const contractDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectDir = resolve(contractDir, '..');

const source = join(contractDir, 'src', 'mandate.compact');
const buildDir = join(contractDir, 'build');
const artifactsDir = join(contractDir, 'artifacts');
const zkDir = join(projectDir, 'public', 'zk');

const skipZk = process.argv.includes('--skip-zk');

function findCompiler() {
  if (process.env.COMPACTC) return process.env.COMPACTC;
  const home = process.env.HOME ?? '';
  for (const candidate of [
    join(home, '.compact', 'bin', 'compactc'),
    join(home, '.local', 'bin', 'compactc'),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return 'compactc';
}

const compiler = findCompiler();

console.log(`> compiling ${source}`);
rmSync(buildDir, { recursive: true, force: true });
try {
  execFileSync(compiler, [...(skipZk ? ['--skip-zk'] : []), source, buildDir], {
    stdio: 'inherit',
  });
} catch (error) {
  console.error(
    `\nCould not run the Compact compiler ("${compiler}").\n` +
      'Install the toolchain (https://docs.midnight.network/compact) or set COMPACTC ' +
      'to the compactc binary, then re-run.\n',
  );
  throw error;
}

console.log('> publishing the generated TypeScript module');
rmSync(artifactsDir, { recursive: true, force: true });
mkdirSync(artifactsDir, { recursive: true });
cpSync(join(buildDir, 'contract'), artifactsDir, { recursive: true });
cpSync(join(buildDir, 'compiler', 'contract-info.json'), join(artifactsDir, 'contract-info.json'));
// The generated module is ESM; mark it so Node resolves it that way regardless
// of how the importing package is configured.
writeFileSync(
  join(artifactsDir, 'package.json'),
  `${JSON.stringify({ name: '@mandate/contract', type: 'module', main: 'index.js', types: 'index.d.ts' }, null, 2)}\n`,
);

if (!skipZk) {
  console.log('> publishing ZK assets to public/zk');
  rmSync(zkDir, { recursive: true, force: true });
  mkdirSync(zkDir, { recursive: true });
  cpSync(join(buildDir, 'keys'), join(zkDir, 'keys'), { recursive: true });
  mkdirSync(join(zkDir, 'zkir'), { recursive: true });
  // FetchZkConfigProvider asks for `<circuitId>.bzkir`; the textual .zkir is
  // only useful for debugging, so it is left out of the deployed bundle.
  cpSync(join(buildDir, 'zkir'), join(zkDir, 'zkir'), {
    recursive: true,
    filter: (src) => !src.endsWith('.zkir'),
  });
}

console.log('> done');
