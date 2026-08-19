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

## Where authorization actually happens

```
  BROWSER (private)                     MIDNIGHT PREPROD (public)
  ─────────────────                     ─────────────────────────
  rules, salt, secrets
  encrypted at rest
        │
        │ witness: localRules / localSalt
        │          localAgentSecretKey / localCreatorSecretKey
        ▼
  Lace proving provider ── proof ──▶  executeAction
        │                              · reopens the commitment
        │                              · checks agent identity
        │                              · checks every private rule
        │                              · pins the claimed time to block time
        │                              · sendUnshielded → recipient
        └── signs + submits ──────────▶ tx
```

The private half never crosses that line. What crosses is a proof and the values
the contract deliberately publishes: the commitment, the agent public key, the
amounts, the recipient, the rolling-window bookkeeping.

There is no other way to move escrowed funds. `executeAction` is the only
circuit that calls `sendUnshielded` to a caller-supplied address, it takes the
rules from witnesses and re-derives the commitment in-circuit, and an action
that violates any rule makes the circuit unsatisfiable — so no proof exists, and
no valid transaction can be constructed. The app has no bypass, no admin path
and no simulated mode: `lib/architecture.test.ts` asserts that structurally.

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

Without all three — a Lace wallet on Preprod, a deployed registry, and local private state — the app does not open. There is no offline mode, no simulated mode and no way past the connect screen. That is the point: everything Mandate does is a Compact proof, so a session without the means to produce one has nothing to offer.

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

### Inspecting the circuits without a wallet

```bash
npm install
npm test                     # 58 tests against the real compiled circuits
npm run agent -- selftest    # the circuit logic, in-process, in the terminal
```

Both are **developer harnesses, not the product**. They run the compiled circuits in-process against an in-memory ledger — every rule assertion is live, so a refusal is a genuine unsatisfiable constraint — but there is no wallet, no network, no proof and no funds. Nothing they do is an *authorization*, because on Midnight an authorization is a verified proof against committed private rules.

The app imports neither of them. `lib/architecture.test.ts` fails the build if anything under `app/` ever does.

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
lib/client.ts                  the only path to the chain: providers, circuit calls
lib/private-state.ts           witnesses — where private rules enter a proof
lib/                           domain model, rule engine, network config
lib/mandate.test.ts            circuit behaviour against the real circuits
lib/architecture.test.ts       structural guards: no path authorizes without a proof
lib/simulator.ts               in-process circuit harness — tests only, never the app
agent/                         the agent, its executors, and the selftest CLI
app/session.ts                 the single session path; every action is a proven tx
app/page.tsx                   landing page (static, no wallet or WebAssembly)
app/app/dashboard.tsx          the dashboard
```

## What is real, and what is not

Being precise about this matters more than sounding finished.

**Real:**
- The Compact contract compiles and every circuit is genuine. The proving keys in this repository were produced by `compactc`, not stubbed.
- All authorization logic, escrow accounting, revocation, withdrawal and selective disclosure are enforced by circuit constraints. Nothing about verification or money movement is mocked.
- **There is exactly one path through the app, and it goes through Midnight.** Every operation the dashboard offers is a Compact circuit call, proven inside the wallet and submitted to Preprod. There is no simulated mode, no offline mode and no local approval that stands in for a proof. Without Midnight private state and Compact authorization proofs, Mandate cannot authorize spends.
- 58 tests execute the compiled circuits in-process against real ledger state, including adversarial custody cases: an attacker holding the creator's secret still cannot redirect a withdrawal, the agent has no path to the escrow outside a valid authorization, and value is conserved across deposit, spend and reclaim. Five of them are structural guards that fail if the app ever gains a path around the proof.
- The dashboard renders only real state, read from the indexer. There is no seeded mandate, no sample balance and no placeholder activity anywhere in the app: with nothing created, every panel shows an empty state.

**Not yet exercised:**
- The Preprod path — wallet connection, proving in Lace, transaction balancing, submission, indexer reads, and the deploy script — is written against the current `midnight-js` and DApp-connector APIs but has **not** been executed against a live network. The build environment had no route to Preprod (every endpoint blocked at the egress proxy) and no browser for the Lace extension, so the six-step verification above is the step that closes this gap.
- No registry has been deployed, so there is no contract address to publish yet.
- **The browser click-through audit no longer runs here.** It used to drive the whole lifecycle through an in-process simulator; removing that simulator from the app removed the audit's ability to run without a wallet. That was the right trade — an audit that exercises a path the product does not have is worth less than not having the path — but it means the in-browser evidence now comes from your Preprod run, not from this repository.

## Scope

Deliberately not included, per the specification: multi-step autonomous planning, natural-language mandate interpretation, and cross-chain assets. The agent's job is to turn one concrete instruction into a proof or a precise refusal, and keeping it that small is what makes it trustworthy.

## Licence

Apache-2.0
