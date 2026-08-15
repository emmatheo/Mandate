# Mandate

**Give AI agents real spending power under private, cryptographically enforced rules that can be selectively disclosed.**

Built on [Midnight](https://midnight.network) in [Compact](https://docs.midnight.network/compact).

---

## The problem

Every current way of giving an AI agent power over money is broken:

| Approach | Failure |
|---|---|
| Hand the agent a private key | One bad decision loses everything |
| Require human approval per action | Destroys the point of an autonomous agent |
| Off-chain policy engine | No cryptographic proof; you must trust an operator |

What is missing is a primitive that is **private** (the rules stay hidden), **enforced** (not by trust, by cryptography), **selectively disclosable** (you can prove one fact without opening the rest), and **real** (the money actually moves on chain).

That is what Mandate is.

## How it works

A user writes a **mandate** — a set of spending rules — and deposits funds into escrow. The rules never leave their device. Only a commitment to them reaches the chain.

An agent the user authorized can move money out of that escrow only by producing a zero-knowledge proof that:

1. it knows the pre-image of the published commitment — the actual rules,
2. the transfer it proposes satisfies **every** one of those rules,
3. it holds the secret key behind the mandate's authorized agent public key,
4. the mandate is unrevoked and inside its validity window.

Violate any rule and the circuit is unsatisfiable. No proof exists. The money cannot move — regardless of what the agent intends, what it was prompted with, or what it has been convinced of.

```
   USER                          CHAIN                        AGENT
   ────                          ─────                        ─────
   full rules ──┐
   secrets      │  commitment ──▶ MandateRecord
   (local only) │  agent pubkey    · commitment       ┌── copy of rules
                │  deposit         · agent key        │   agent secret key
                └──────────────────· escrow ◀─────────┘   (local only)
                                   · spent
                                                       proposes action
                                   ◀── action + ZK proof ──
                                   verify → release funds → recipient
```

### What is public, and what is not

| | On chain | Private |
|---|---|---|
| Mandate rules | commitment only | max total, max per transaction, validity window, rolling limits, recipient allow-list |
| Agent | public key | secret key |
| Creator | a hash of a secret | the secret, and the wallet identity |
| Money | deposits, transfers, balances | — |

Deposits and transfers are public because they are movements on a public ledger. Everything that *governs* them is private.

## The contract

[`contract/src/mandate.compact`](contract/src/mandate.compact) — compiles with `compactc 0.31.1` (language 0.23.0, runtime 0.16.0, ledger 8.0.2).

| Circuit | What it does |
|---|---|
| `createMandate` | Derives the commitment in-circuit from local private state and funds the escrow |
| `fundMandate` | Tops up a live mandate |
| `executeAction` | The core circuit: opens the commitment, proves agent identity, checks every rule, releases funds |
| `revokeMandate` | Creator-only; makes all future authorization proofs unsatisfiable |
| `withdraw` | Creator-only; returns the unspent balance |
| `discloseTotalSpendRespected` | Proves a limit was honoured **without revealing it** |
| `discloseField` | Reveals exactly one chosen field, proven against the commitment |

### Two design decisions worth explaining

**Time.** The mandate's validity window is private, so it can never be handed to a kernel time operation — that would publish it. Instead the agent supplies a claimed timestamp, the contract pins that claim to reality with `blockTimeGte(now)` and `blockTimeLt(now + 300)`, and the window comparison happens entirely in-circuit against the private bounds. The chain learns roughly when the action happened, never when the mandate expires.

**Rolling limits are public.** `periodStart` and `periodSpent` are in the public record. This is a deliberate trade: it means a daily or weekly cap is enforced by the *chain* rather than by an agent's honesty about its own local history. An agent that resets its private memory still cannot exceed the cap. The cost is that an observer can infer roughly when a window rolls over — but transfer amounts and timings are already public, so this adds little. Enforcement was worth more than that margin.

**Authority without identity.** Revocation and withdrawal authenticate the creator by knowledge of a secret, not by wallet address. Reclaiming funds therefore never publishes who you are. The withdrawal address is a public argument bound into the proof, so nobody can lift a proof and redirect the funds.

## Try it

### Locally, in about a minute

```bash
npm install
npm test                  # 43 tests against the real compiled circuits
npm run agent -- demo     # the whole lifecycle, end to end
npm run dev               # landing page at http://localhost:3000, app at /app
```

`npm run agent -- demo` runs the full script: a private mandate created and funded, only the commitment on chain, a compliant payment executed, an over-limit payment and a payment to an unlisted recipient both refused, the daily cap enforced, revocation, reclaim, and both disclosure circuits. Step 5 also bypasses the agent and calls the circuit directly, so you can see the refusal is an unsatisfiable constraint rather than a UI check.

The dashboard runs the same compiled circuits **in your browser** against an in-memory ledger. Every authorization and refusal you see is real; nothing is settled on a chain until you connect a wallet.

### Deploy to Vercel

The app is a standard Next.js project with no backend, so a normal import works:

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import it.
3. Accept the defaults (framework Next.js, build `next build`) and deploy.

No environment variables are required — it will come up in local-demo mode. To point it at a deployed registry:

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_NETWORK_ID` | Network the wallet must be on | `preprod` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Address of the deployed Mandate registry | `0200…` |

The ZK proving and verifier keys are committed under `public/zk/` (~44 MB) and served as static assets, so a Vercel build never needs the Compact toolchain.

**Proving happens in the wallet.** The DApp asks Lace for a proving provider via `getProvingProvider` and hands it the ZK artifacts; the proof is produced on the user's own machine. There is no proof server for this app to host, which is what makes a static deploy sufficient.

## Getting testnet tokens

- **tNIGHT** is the asset the agent spends under the mandate.
- **tDUST** pays transaction fees.

1. Install the **Lace Midnight Preview** wallet.
2. Switch it to the **Preprod** network.
3. Copy your **unshielded** address.
4. Request tokens from the faucet: <https://faucet.preprod.midnight.network/>
5. In Lace, complete the "Generate tDUST" / registration flow so your tNIGHT starts producing spendable tDUST.

These are test tokens with no real value. Do not use mainnet tokens for development.

> **Note on units.** Amounts throughout are integers in the token's smallest unit, with `NIGHT_DECIMALS = 6` in [`lib/encoding.ts`](lib/encoding.ts). If a faucet payout does not line up with what the UI displays, that constant is the single place to correct.

## Rebuilding the contract

Only needed if you change `mandate.compact`.

```bash
# Install the Compact toolchain: https://docs.midnight.network/compact
npm run compact:build
```

This compiles the contract, publishes the generated TypeScript module to `contract/artifacts/`, and copies the proving keys and ZKIR to `public/zk/`. Both trees are committed.

## Layout

```
contract/src/mandate.compact   the contract — the whole product is here
contract/artifacts/            generated TypeScript (committed)
public/zk/                     proving + verifier keys, ZKIR (committed)
lib/                           domain model, rule engine, witnesses, network client
lib/mandate.test.ts            43 tests against the real circuits
lib/simulator.ts               in-process execution of the compiled circuits
agent/                         the agent, its executors, and the demo CLI
app/page.tsx                   landing page (static, no wallet or WebAssembly)
app/app/page.tsx               the dashboard
```

## What is real, and what is not

Being precise about this matters more than sounding finished.

**Real:**
- The Compact contract compiles and every circuit is genuine. The proving keys in this repository were produced by `compactc`, not stubbed.
- All authorization logic, escrow accounting, revocation, withdrawal and selective disclosure are enforced by circuit constraints. Nothing about verification or money movement is mocked.
- 43 tests execute the compiled circuits in-process against real ledger state. The dashboard executes the same circuits in the browser.
- The dashboard renders only real state. There is no seeded mandate, no sample balance and no placeholder activity anywhere in the app: with nothing created, every panel shows an empty state.

**Not yet exercised:**
- The live-network path in [`lib/client.ts`](lib/client.ts) — wallet connection, transaction balancing, submission, indexer reads — is written against the current `midnight-js` and DApp-connector APIs but has **not** been run against a deployed contract on Preprod. It needs a funded Lace wallet and network access, neither of which was available in the environment this was built in. Expect to iterate on it during first deployment.
- No registry has been deployed, so there is no contract address to publish yet.

## Scope

Deliberately not included, per the specification: multi-step autonomous planning, natural-language mandate interpretation, and cross-chain assets. The agent's job is to turn one concrete instruction into a proof or a precise refusal, and keeping it that small is what makes it trustworthy.

## Licence

Apache-2.0
