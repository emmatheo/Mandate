import Link from 'next/link';

import {
  Alert,
  Arrow,
  Ban,
  Check,
  Clock,
  Eye,
  Gauge,
  KeyOff,
  Lock,
  Logo,
  Send,
  Shield,
  Users,
} from './icons';

/**
 * Landing page.
 *
 * A static server component: no wallet, no circuits, no WebAssembly. The heavy
 * prover bundle is only fetched by people who actually open the app.
 *
 * Laid out to the supplied reference: a single centred hero, one primary
 * action, and three cards naming the three guarantees. Nothing on this page
 * claims a number — there is no state here to be honest about, so it makes
 * statements rather than showing figures.
 */

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-brand">
            <Logo size={30} />
            Mandate
          </Link>
          <nav className="lp-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#about">About</a>
            <a href="#security">Security</a>
          </nav>
          <Link href="/app" className="btn btn-primary">
            Launch App
          </Link>
        </div>
      </header>

      {/* ---------------------------------------------------------- hero */}
      <section className="lp-hero">
        <span className="lp-badge">
          <Shield size={14} />
          Zero-knowledge enforced on Midnight Preprod
        </span>

        <h1>
          Private Control over
          <br />
          AI Spending
        </h1>

        <p className="lp-lede">
          Give AI agents permission to spend money within strict, private rules you define. Secure,
          automated payments without the risk.
        </p>

        <div className="btn-row lp-hero-actions">
          <Link href="/app" className="btn btn-primary btn-lg">
            Launch App
            <Arrow size={16} />
          </Link>
          <a href="#about" className="btn btn-lg btn-ghost">
            Learn More
          </a>
        </div>
      </section>

      {/* ------------------------------------------------------ the three cards */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-cards">
            <Feature
              icon={<Lock size={22} />}
              title="Private Rules"
              body="Your limits, time windows and approved recipients never leave your device. Only a commitment to them reaches the chain — enough to enforce, not enough to read."
            />
            <Feature
              icon={<Gauge size={22} />}
              title="Defined Limits"
              body="A total ceiling, a per-payment cap, a validity window and an optional rolling daily or weekly limit. A payment that breaks one of them has no valid proof."
            />
            <Feature
              icon={<Ban size={22} />}
              title="Instant Revoke"
              body="Cancel an agent's authority in a single transaction and reclaim the unspent balance — always to the wallet that funded it, and to no other address."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------- what Mandate is, its aim */}
      <section className="lp-section lp-section-alt" id="about">
        <div className="lp-section-inner">
          <div className="lp-split">
            <div>
              <p className="lp-kicker">What is Mandate</p>
              <h2 className="lp-h2">A spending mandate your agent cannot exceed — or read past.</h2>
              <p className="lp-body">
                A <strong style={{ color: 'var(--text)' }}>mandate</strong> is a set of spending
                rules you write and keep: how much in total, how much per payment, for how long, to
                whom. You fund it once, and you name exactly one agent that may draw on it.
              </p>
              <p className="lp-body">
                The rules never leave your device. What goes on-chain is a cryptographic commitment
                to them — a value that binds the rules without revealing a single one. When your
                agent wants to pay, it must produce a zero-knowledge proof that its payment
                satisfies <em>every</em> rule behind that commitment. If it does not, the proof
                cannot be constructed. The money does not move.
              </p>
              <p className="lp-body">
                Not a warning. Not a policy engine that can be misconfigured or a service that can
                be persuaded. The limit is the shape of the mathematics.
              </p>

              <div className="lp-aim">
                <h3>The aim</h3>
                <p>
                  To make delegated spending safe enough to be worth doing. An agent should be able
                  to act without a human in the loop for every payment, without that autonomy
                  costing you your keys, your privacy, or your ability to stop it. Mandate exists so
                  the answer to &ldquo;what can this agent actually do with my money?&rdquo; is a
                  bounded, provable, private one.
                </p>
              </div>
            </div>

            <div>
              <p className="lp-kicker">Why it exists</p>
              <h2 className="lp-h2 lp-h2-wide">Every other way of doing this is broken.</h2>
              <div className="lp-problems">
                <Problem
                  icon={<KeyOff size={14} />}
                  title="Hand the agent a key"
                  body="Total custody. One bad decision, one poisoned prompt, one bug — and everything is gone."
                />
                <Problem
                  icon={<Clock size={14} />}
                  title="Approve every action yourself"
                  body="Safe, and pointless. If a human has to sign off on each payment, the agent is not autonomous."
                />
                <Problem
                  icon={<Alert size={14} />}
                  title="Use an off-chain policy engine"
                  body="You are trusting an operator to enforce rules honestly, with no proof that they did — and they can see everything."
                />
                <Problem
                  icon={<Eye size={14} />}
                  title="Put the rules on-chain in the clear"
                  body="Enforceable, but now your limits, your counterparties and your spending shape are public to everyone."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- how it works */}
      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <p className="lp-kicker">How it works</p>
          <h2 className="lp-h2 lp-h2-wide" style={{ marginBottom: 36 }}>
            Three steps, and the chain does the rest.
          </h2>
          <div className="lp-steps">
            <Step
              n={1}
              icon={<Lock size={16} />}
              title="Write the mandate"
              body="Set a total ceiling, a per-payment cap, a validity window, an optional daily or weekly limit, and an allow-list of recipients. Fund the escrow. Only the commitment and your deposit become public."
            />
            <Step
              n={2}
              icon={<Users size={16} />}
              title="Authorize one agent"
              body="A mandate is bound to a single agent identity. The agent holds its own key and a copy of the rules — never your wallet keys. No other agent can use the mandate."
            />
            <Step
              n={3}
              icon={<Send size={16} />}
              title="The chain decides"
              body="To move funds the agent must prove it knows the committed rules, that its payment satisfies all of them, and that it is the authorized agent. Anything else is unprovable."
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- security */}
      <section className="lp-section lp-section-alt" id="security">
        <div className="lp-section-inner">
          <p className="lp-kicker">Security</p>
          <h2 className="lp-h2 lp-h2-wide" style={{ marginBottom: 30 }}>
            What we can promise, and why.
          </h2>
          <div className="lp-guarantees">
            <Guarantee
              title="Your keys are never delegated"
              body="An agent holds its own keypair and nothing else. It can trigger a release from escrow under proof; it can never sign as you."
            />
            <Guarantee
              title="The rules are never published"
              body="Only a hiding commitment goes on-chain. Two mandates with identical rules produce different commitments, so nothing can be inferred by comparison."
            />
            <Guarantee
              title="Enforcement is not a promise"
              body="Every limit is an assertion inside a zero-knowledge circuit. A violating payment has no satisfying proof, so no valid transaction exists to submit."
            />
            <Guarantee
              title="Only the depositor is paid back"
              body="Revocation makes every future authorization unprovable, and the withdrawal circuit accepts no destination: the balance returns to the funding wallet, always."
            />
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-inner">
          <Link href="/" className="lp-brand lp-brand-sm">
            <Logo size={24} />
            Mandate
          </Link>
          <nav className="lp-foot-links">
            <a href="#about">About</a>
            <a href="#security">Security</a>
            <a
              href="https://github.com/emmatheo/Mandate/issues"
              target="_blank"
              rel="noreferrer"
            >
              Contact
            </a>
          </nav>
          <span className="lp-foot-note">Midnight Preprod · test network only</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="lp-feature">
      <span className="tile">{icon}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Problem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="lp-problem">
      <span className="lp-problem-mark">{icon}</span>
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="lp-step">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="lp-step-n" style={{ marginBottom: 0 }}>
          {n}
        </div>
        <span className="tile tile-sm">{icon}</span>
      </div>
      <h3 style={{ marginTop: 16 }}>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Guarantee({ title, body }: { title: string; body: string }) {
  return (
    <div className="lp-guarantee">
      <span className="lp-guarantee-mark">
        <Check size={13} />
      </span>
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    </div>
  );
}
