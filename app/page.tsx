import Link from 'next/link';

import {
  Alert,
  Arrow,
  Check,
  Clock,
  Coins,
  Eye,
  KeyOff,
  Link as LinkIcon,
  Lock,
  Logo,
  Play,
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
 * Every link goes somewhere real, and the hero card is an illustration of a
 * mandate's shape — labelled as one, with its rule values shown as hidden
 * rather than invented.
 */

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-brand">
            <Logo size={32} />
            Mandate
          </Link>
          <nav className="lp-links">
            <a href="#what">What is Mandate</a>
            <a href="#how">How it works</a>
            <a href="#security">Security</a>
            <a href="#docs">Docs</a>
          </nav>
          <Link href="/app" className="btn">
            <Lock size={15} />
            Launch App
          </Link>
        </div>
      </header>

      {/* ---------------------------------------------------------- hero */}
      <section className="lp-hero">
        <div>
          <p className="lp-eyebrow">Private AI agent spending control</p>
          <h1>
            Give AI agents real power.
            <br />
            Keep the control{' '}
            <span
              style={{
                background: 'linear-gradient(100deg, #a78bfa, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              private
            </span>
            .
          </h1>
          <p className="lp-lede">
            Mandate lets AI agents spend on your behalf — without ever exposing your keys, your
            limits, or the rules you set. Private rules. Verifiable enforcement. You stay in
            control.
          </p>
          <div className="btn-row">
            <Link href="/app" className="btn btn-primary btn-lg">
              Create a mandate
              <Arrow size={16} />
            </Link>
            <a href="#how" className="btn btn-lg">
              <Play size={16} />
              See how it works
            </a>
          </div>
        </div>

        <div className="lp-card-wrap">
          <MandateIllustration />
        </div>
      </section>

      {/* ------------------------------------------- what Mandate is, its aim */}
      <section className="lp-section lp-section-alt" id="what">
        <div className="lp-section-inner">
          <div className="lp-split">
            <div>
              <p className="lp-kicker">What is Mandate</p>
              <h2 className="lp-h2">A spending mandate your agent cannot exceed — or read past.</h2>
              <p className="lp-body">
                A <strong style={{ color: 'var(--text)' }}>mandate</strong> is a set of spending
                rules you write and keep: how much in total, how much per payment, for how long,
                to whom. You fund it once, and you name exactly one agent that may draw on it.
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

      {/* ------------------------------------------------------ capabilities */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-kicker">Built for control. Designed for trust.</p>
          <h2 className="lp-h2 lp-h2-wide" style={{ marginBottom: 36 }}>
            Four guarantees, enforced by the chain.
          </h2>
          <div className="lp-features">
            <Feature
              icon={<Lock size={20} />}
              title="Private rules"
              body="Define spending limits, time windows and approved recipients that never leave your device. Only a commitment reaches the chain."
            />
            <Feature
              icon={<LinkIcon size={20} />}
              title="On-chain enforcement"
              body="Zero-knowledge proofs enforce your rules on-chain. Break one and the proof does not exist — verifiable by anyone, revealing nothing."
            />
            <Feature
              icon={<Eye size={20} />}
              title="Selective disclosure"
              body="Share proofs, not data. Prove a limit was respected without revealing it, or open exactly one field for an auditor."
            />
            <Feature
              icon={<Shield size={20} />}
              title="Safe withdrawal"
              body="Revoke at any time and reclaim what is unspent. Authority is proven by a secret you hold, never by publishing who you are."
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- how it works */}
      <section className="lp-section lp-section-alt" id="how">
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
      <section className="lp-section" id="security">
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
              title="You can always stop it"
              body="Revocation makes every future authorization unprovable, and the unspent balance returns to an address you name — bound into the proof, so it cannot be redirected."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="lp-section lp-section-alt" id="docs">
        <div className="lp-cta">
          <h2>Try it in your browser.</h2>
          <p>
            The app runs the real compiled circuits locally, so you can create a mandate, watch an
            agent get authorized, and watch one get refused — before any wallet is involved.
          </p>
          <div className="btn-row">
            <Link href="/app" className="btn btn-primary btn-lg">
              Open the app
              <Arrow size={16} />
            </Link>
            <a
              href="https://github.com/emmatheo/Mandate#readme"
              className="btn btn-lg"
              target="_blank"
              rel="noreferrer"
            >
              Read the docs
            </a>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-inner">
          <span>Mandate — private spending authority for AI agents, on Midnight.</span>
          <span>Built in Compact. Test network only.</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * The hero illustration.
 *
 * Shows the *structure* of a mandate with its rule values marked hidden.
 * Inventing figures here would make it indistinguishable from a real dashboard,
 * which is precisely the confusion this product exists to remove.
 */
function MandateIllustration() {
  return (
    <div className="lp-card" role="img" aria-label="Illustration of the structure of a mandate">
      <div className="lp-card-head">
        <div className="lp-card-title">
          A mandate
          <span className="dot" style={{ color: 'var(--green)' }} />
        </div>
        <span className="lp-card-id">Illustration</span>
      </div>

      <div className="lp-sect-label">Private rules</div>
      <div className="lp-rule">
        <Coins size={15} className="lp-rule-icon" />
        <span className="lp-rule-name">Max total spend</span>
        <span className="lp-rule-value" style={{ color: 'var(--text-faint)' }}>
          hidden
        </span>
      </div>
      <div className="lp-rule">
        <Send size={15} className="lp-rule-icon" />
        <span className="lp-rule-name">Max per payment</span>
        <span className="lp-rule-value" style={{ color: 'var(--text-faint)' }}>
          hidden
        </span>
      </div>
      <div className="lp-rule">
        <Clock size={15} className="lp-rule-icon" />
        <span className="lp-rule-name">Validity window</span>
        <span className="lp-rule-value" style={{ color: 'var(--text-faint)' }}>
          hidden
        </span>
      </div>
      <div className="lp-rule">
        <Users size={15} className="lp-rule-icon" />
        <span className="lp-rule-name">Allowed recipients</span>
        <span className="lp-rule-value" style={{ color: 'var(--text-faint)' }}>
          hidden
        </span>
      </div>

      <div className="lp-card-rule">
        <div className="lp-sect-label">Enforcement</div>
        <div className="lp-enf">
          <span className="tile tile-sm" style={{ color: 'var(--green)', borderColor: 'var(--green-line)', background: 'var(--green-dim)' }}>
            <Shield size={16} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 570 }}>
              Verified on-chain
              <span className="pill pill-ok">ZK</span>
            </div>
            <p>Rules are enforced by zero-knowledge proof. No keys. No trust. Just math.</p>
          </div>
        </div>
      </div>

      <div className="lp-card-rule">
        <div className="lp-sect-label">Selective disclosure</div>
        <div className="lp-enf">
          <span className="tile tile-sm">
            <Eye size={16} />
          </span>
          <div>
            <div style={{ fontWeight: 570 }}>Only share what is needed</div>
            <p>Prove compliance without revealing the mandate behind it.</p>
          </div>
        </div>
      </div>

      <div className="lp-card-foot">
        <span>Auditable. Private. Revocable at any time.</span>
        <span className="pill pill-ok">Active</span>
      </div>
    </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
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
