import Link from 'next/link';

import { Arrow, Check, Eye, Link as LinkIcon, Lock, Logo, Shield } from './icons';

/**
 * Landing page.
 *
 * A static server component: no wallet, no circuits, no WebAssembly. Keeping it
 * that way means the marketing page loads instantly and the heavy prover bundle
 * is only fetched by people who actually open the app.
 *
 * Every link here goes somewhere real. The hero card is an illustration of a
 * mandate's shape and is labelled as one — it is not a rendering of anybody's
 * actual data.
 */

export default function Landing() {
  return (
    <div className="lp">
      <div className="lp-glow" aria-hidden />

      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-brand">
            <Logo size={30} />
            Mandate
          </Link>
          <nav className="lp-links">
            <a href="#how">How it works</a>
            <a href="#control" className="lp-link-hide">
              Guarantees
            </a>
          </nav>
          <Link href="/app" className="btn">
            Launch App
          </Link>
        </div>
      </header>

      <section className="lp-hero">
        <div>
          <h1>
            Give AI agents real spending power —{' '}
            <span style={{ color: 'var(--violet)' }}>privately</span>.
          </h1>
          <p className="lp-lede">
            Mandate lets you define private spending rules, enforce them cryptographically
            on-chain, and reveal only what&rsquo;s necessary — nothing more.
          </p>
          <div className="btn-row">
            <Link href="/app" className="btn btn-primary">
              Create a mandate
              <Arrow size={15} />
            </Link>
            <a href="#how" className="btn">
              How it works
            </a>
          </div>
        </div>

        <PolicyCard />
      </section>

      <section className="lp-section" id="control">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">Built for control. Designed for trust.</p>
          <div className="lp-features">
            <Feature
              tone="violet"
              icon={<Lock size={19} />}
              title="Private rules"
              body="Your spending limits, time windows and approved recipients stay on your device. Only a commitment to them reaches the chain."
            />
            <Feature
              tone="green"
              icon={<LinkIcon size={19} />}
              title="On-chain enforcement"
              body="Break a rule and the proof does not exist. Not a warning, not a policy check — the transaction is impossible."
            />
            <Feature
              tone="violet"
              icon={<Eye size={19} />}
              title="Selective disclosure"
              body="Prove a limit was respected without revealing what it was, or open exactly one field for an auditor and nothing else."
            />
            <Feature
              tone="violet"
              icon={<Shield size={19} />}
              title="Safe withdrawal"
              body="Revoke at any time and reclaim the unspent balance. Authority is proven by a secret you hold, never by publishing who you are."
            />
          </div>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">How it works</p>
          <div className="lp-steps">
            <Step
              n={1}
              title="Write the mandate"
              body="Set a total ceiling, a per-transaction cap, a validity window, an optional rolling limit and an allow-list of recipients. It never leaves your browser — only a commitment is published, along with your deposit."
            />
            <Step
              n={2}
              title="Authorize one agent"
              body="A mandate is bound to a single agent identity. The agent holds its own key and a copy of the rules. It never touches your wallet keys, and no other agent can use the mandate."
            />
            <Step
              n={3}
              title="The chain decides"
              body="To move funds the agent must prove it knows the committed rules, that its action satisfies every one of them, and that it is the authorized agent. Anything else is unprovable."
            />
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-inner">
          <span>Mandate — private spending authority on Midnight.</span>
          <span>Built in Compact. Test network only.</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * The hero illustration.
 *
 * Deliberately shows the *structure* of a mandate with no figures attached:
 * showing invented balances here would be indistinguishable from a real
 * dashboard, and this product's entire claim is that you can tell the
 * difference between what is proven and what is merely asserted.
 */
function PolicyCard() {
  return (
    <div className="lp-card" role="img" aria-label="Illustration of the structure of a mandate">
      <div className="lp-card-head">
        <div>
          <div className="lp-card-title">Spending policy</div>
          <div className="lp-card-sub">What a mandate is made of</div>
        </div>
        <span className="pill pill-muted">Illustration</span>
      </div>

      <div className="lp-block">
        <div className="lp-block-label">
          <Lock size={13} /> Rules — private
        </div>
        <div className="lp-line">
          <span>Total spend limit</span>
          <span style={{ color: 'var(--text-faint)' }}>hidden</span>
        </div>
        <div className="lp-line">
          <span>Per-transaction limit</span>
          <span style={{ color: 'var(--text-faint)' }}>hidden</span>
        </div>
        <div className="lp-line">
          <span>Validity window</span>
          <span style={{ color: 'var(--text-faint)' }}>hidden</span>
        </div>
        <div className="lp-line">
          <span>Allowed recipients</span>
          <span style={{ color: 'var(--text-faint)' }}>hidden</span>
        </div>
      </div>

      <div className="lp-block">
        <div className="lp-block-label">
          <Shield size={13} /> Enforcement — on-chain
        </div>
        <div className="lp-line">
          <span>Every rule checked in zero knowledge</span>
          <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center' }}>
            <Check size={15} />
          </span>
        </div>
        <div className="lp-line">
          <span>Escrow released only on a valid proof</span>
          <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center' }}>
            <Check size={15} />
          </span>
        </div>
      </div>

      <div className="lp-block">
        <div className="lp-block-label">
          <Eye size={13} /> Selective disclosure
        </div>
        <div className="lp-line">
          <span>Shared only with verifiers you choose</span>
        </div>
      </div>
    </div>
  );
}

function Feature({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'violet' | 'green';
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className={`lp-feature tone-${tone}`}>
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <article className="lp-step">
      <div className="lp-step-n">{n}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
