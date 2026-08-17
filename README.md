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
| Creator | a hash of a secret, and the funding address | the secret itself |
| Money | deposits, transfers, balances | — |

Deposits and transfers are public because they are movements on a public ledger. Everything that *governs* them is private. The funding address is public for the same reason: the deposit is an unshielded transfer from it, so it already appears in the funding transaction.

## The contract

[`contract/src/mandate.compact`](contract/src/mandate.compact) — compiles with `compactc 0.31.1` (language 0.23.0, runtime 0.16.0, ledger 8.0.2).

| Circuit | What it does |
|---|---|
| `createMandate` | Derives the commitment in-circuit from local private state and funds the escrow |
| `fundMandate` | Creator-only; tops up a live mandate |
| `executeAction` | The core circuit: opens the commitment, proves agent identity, checks every rule, releases funds |
| `revokeMandate` | Creator-only; makes all future authorization proofs unsatisfiable |
| `withdraw` | Creator-only; returns the unspent balance **to the funding address only** |
| `discloseTotalSpendRespected` | Proves a limit was honoured **without revealing it** |
| `discloseField` | Reveals exactly one chosen field, proven against the commitment |

### Two design decisions worth explaining

**Time.** The mandate's validity window is private, so it can never be handed to a kernel time operation — that would publish it. Instead the agent supplies a claimed timestamp, the contract pins that claim to reality with `blockTimeGte(now)` and `blockTimeLt(now + 300)`, and the window comparison happens entirely in-circuit against the private bounds. The chain learns roughly when the action happened, never when the mandate expires.

**Rolling limits are public.** `periodStart` and `periodSpent` are in the public record. This is a deliberate trade: it means a daily or weekly cap is enforced by the *chain* rather than by an agent's honesty about its own local history. An agent that resets its private memory still cannot exceed the cap. The cost is that an observer can infer roughly when a window rolls over — but transfer amounts and timings are already public, so this adds little. Enforcement was worth more than that margin.

**Only the funding wallet can be paid back.** Two independent locks protect the escrow, and both must hold:

1. **Authorization.** `revokeMandate`, `withdraw` and `fundMandate` require proving knowledge of the creator's secret. No third party can trigger any of them.
2. **Destination.** `withdraw` takes *no* destination parameter. The balance always returns to the `creatorAddress` recorded when the mandate was funded. Even an attacker who fully compromised the creator's secret could do nothing but push the money back to the original depositor.

That second lock is what makes "only the wallet that deposited can withdraw" a property of the contract rather than of the user interface. The funding address is supplied by the depositor at creation; naming someone else's address there would only send your own refund to them, so it puts nobody else's funds at risk.

`fundMandate` is creator-only for a related reason: a stranger topping up the escrow would silently widen how much the agent can actually move. That is the creator's decision to make.

## Try it

### Run it against Midnight Preprod

Mandate settles on **Midnight Preprod**. tNIGHT is the asset a mandate governs; tDUST pays the fees.

**1. Get a wallet and test tokens**

- Install the **Lace Midnight Preview** extension and switch it to **Preprod**.
- Copy your **unshielded** address.
- Request tokens from the faucet: <https://faucet.preprod.midnight.network/>
- In Lace, complete the "Generate tDUST" / registration step so your tNIGHT starts producing spendable tDUST. Without tDUST every transaction fails at the fee stage.

**2. Deploy the registry** (once per environment)

```bash
cp .env.example .env.local     # fill in the deployment-only variables
npm run dev                    # serves the ZK keys the deploy script fetches
npm run contract:deploy        # in a second terminal
```

It prints a contract address. Put it in `NEXT_PUBLIC_CONTRACT_ADDRESS`.

**3. Run the app**

```bash
npm run dev                    # landing page at :3000, app at /app
```

Open `/app`, enter a private-state password (16+ characters — it encrypts your mandate rules and cannot be recovered), and connect Lace.

### Verify it end to end

Six steps. Each one is a real transaction on Preprod.

| # | Action | What to expect |
|---|---|---|
| 1 | Create a mandate: deposit 10 tNIGHT, max total 10, max per transaction 2, allow-list your own second address | Lace prompts twice (prove, then sign). Escrow shows 10 tNIGHT. |
| 2 | Agents → pay **1 tNIGHT** to the allow-listed address | Authorized. Escrow drops to 9. Recipient balance rises. |
| 3 | Agents → pay **5 tNIGHT** (over the per-transaction limit) | Refused, naming the per-transaction limit. No transaction is submitted. |
| 4 | Agents → pay **1 tNIGHT** to an address *not* on the allow-list | Refused, naming the allow-list. |
| 5 | Dashboard → the mandate's row → **Revoke**, confirm | Mandate shows Revoked. A further agent action is refused. |
| 6 | Dashboard → the mandate's row → **Withdraw**, confirm | 9 tNIGHT returns **to the funding wallet**. No destination is offered, because the contract accepts none. |

The custody claim to check at step 6: the funds go back to the wallet that funded the mandate at step 1, and there is no field anywhere to send them elsewhere.

### Locally, without a wallet

```bash
npm install
npm test                  # 53 tests against the real compiled circuits
npm run agent -- demo     # the whole lifecycle, end to end, in the terminal
```

The app also has a **demo mode**, reachable from the connect screen behind an explicit confirmation. It runs the same compiled circuits against an in-memory ledger with no wallet and no chain, and is labelled as such everywhere it is visible. It exists to show the authorization logic without a funded wallet — it is never the default and nothing in it settles anywhere.

### Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import it.
3. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to your deployed registry address.
4. Accept the remaining defaults (framework Next.js, build `next build`) and deploy.

Verified from a clean checkout of only the committed files: `npm ci` then `next build` succeeds and every route is static, so there is no server runtime to configure.

The ZK proving and verifier keys are committed under `public/zk/` (~47 MB) and served as static assets, so a Vercel build never needs the Compact toolchain.

**Proving happens in the wallet.** The DApp asks Lace for a proving provider via `getProvingProvider` and hands it the ZK artifacts; the proof is produced on the user's own machine. There is no proof server for this app to host, which is what makes a static deploy sufficient.

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
lib/mandate.test.ts            53 tests against the real circuits
lib/simulator.ts               in-process execution of the compiled circuits
agent/                         the agent, its executors, and the demo CLI
app/page.tsx                   landing page (static, no wallet or WebAssembly)
app/app/dashboard.tsx          the dashboard
```

## What is real, and what is not

Being precise about this matters more than sounding finished.

**Real:**
- The Compact contract compiles and every circuit is genuine. The proving keys in this repository were produced by `compactc`, not stubbed.
- All authorization logic, escrow accounting, revocation, withdrawal and selective disclosure are enforced by circuit constraints. Nothing about verification or money movement is mocked.
- 53 tests execute the compiled circuits in-process against real ledger state, including adversarial custody cases: an attacker holding the creator's secret still cannot redirect a withdrawal, the agent has no path to the escrow outside a valid authorization, and value is conserved across deposit, spend and reclaim. The dashboard executes the same circuits in the browser.
- A click-through audit drives every button and error path in a real browser: input validation, both refusal types, top-up, revoke, reclaim, all three disclosure buttons, and the agent being blocked after revocation.
- The dashboard renders only real state. There is no seeded mandate, no sample balance and no placeholder activity anywhere in the app: with nothing created, every panel shows an empty state.

**Not yet exercised:**
- The Preprod path — wallet connection, transaction balancing, submission, indexer reads, and the deploy script — is written against the current `midnight-js` and DApp-connector APIs but has **not** been executed against a live network. The build environment had no route to Preprod (every endpoint blocked at the egress proxy) and no browser for the Lace extension, so the six-step verification above is the step that closes this gap.
- No registry has been deployed, so there is no contract address to publish yet.

## Scope

Deliberately not included, per the specification: multi-step autonomous planning, natural-language mandate interpretation, and cross-chain assets. The agent's job is to turn one concrete instruction into a proof or a precise refusal, and keeping it that small is what makes it trustworthy.

## Licence

Apache-2.0
