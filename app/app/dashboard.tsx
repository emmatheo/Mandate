'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatAmount,
  formatToken,
  isValidRecipient,
  parseAmount,
  randomHex32,
  truncateAddress,
} from '../../lib/encoding';
import { deriveAgentPublicKey } from '../../lib/mandate';
import type { PeriodKind, StoredMandate } from '../../lib/types';
import {
  DisclosureItem,
  EmptyState,
  FeedItem,
  Field,
  Hash,
  Notice,
  Pill,
  RuleReport,
  relativeTime,
} from '../components';
import {
  Ban,
  Download,
  Eye,
  Grid,
  Lock,
  Logo,
  Plus,
  Pulse,
  Send,
  Shield,
  Users,
} from '../icons';
import { ConnectGate } from '../connect';
import {
  FAUCET_URL,
  FEE_TOKEN,
  NETWORK_LABEL,
  SPEND_TOKEN,
} from '../../lib/network';
import type { ActionResult } from '../session';
import { DEMO_NETWORK_ID, useSession } from '../session';

type Section = 'overview' | 'mandates' | 'agents' | 'activity' | 'disclosure';
type App = ReturnType<typeof useSession>;

const DAY = 86_400;

const NAV: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Grid /> },
  { key: 'mandates', label: 'Mandates', icon: <Shield /> },
  { key: 'agents', label: 'Agents', icon: <Users /> },
  { key: 'activity', label: 'Activity', icon: <Pulse /> },
  { key: 'disclosure', label: 'Disclosure', icon: <Eye /> },
];

const SECTION_TITLES: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'Monitor and manage your mandates with confidence.' },
  mandates: { title: 'Mandates', subtitle: 'Define the rules, fund the escrow, and see exactly what becomes public.' },
  agents: { title: 'Agents', subtitle: 'Each mandate is bound to one agent identity. Only that agent can act under it.' },
  activity: { title: 'Activity', subtitle: 'Every action proposed under your mandates, and the rule that decided it.' },
  disclosure: { title: 'Selective disclosure', subtitle: 'Prove one fact to a third party without opening anything else.' },
};

export function Dashboard() {
  const app = useSession();
  const [section, setSection] = useState<Section>('overview');

  // Nothing in here works without a wallet, so the connection is dealt with
  // first rather than failing on the first click.
  if (app.mode === 'chain' && app.status !== 'ready') {
    return <ConnectGate session={app} />;
  }

  return (
    <div className="db">
      <aside className="db-side">
        <Link href="/" className="db-brand">
          <Logo size={28} />
          <span className="db-brand-name">MANDATE</span>
        </Link>
        <div className="db-brand-tag">Secure. Controlled. Verifiable.</div>

        <nav className="db-nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              aria-current={section === item.key ? 'page' : undefined}
              title={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="db-side-foot" title="Mandate rules and secrets never leave this browser">
          <span className="tile tile-sm" style={{ width: 30, height: 30 }}>
            <Shield size={15} />
          </span>
          <div className="txt">
            <div className="lbl">Keys stay local</div>
            <div className="sub">
              <span className="dot" style={{ color: 'var(--green)' }} />
              Never leave this device
            </div>
          </div>
        </div>
      </aside>

      <div className="db-main">
        {app.mode === 'demo' && (
          <div className="demo-ribbon">
            Demo mode — real circuits, no chain. Nothing here settles on {NETWORK_LABEL} and no{' '}
            {SPEND_TOKEN} moves.
            <button className="btn btn-sm" onClick={() => app.setMode('chain')}>
              Connect a wallet
            </button>
          </div>
        )}

        <header className="db-top">
          <div>
            <h1>{SECTION_TITLES[section].title}</h1>
            <p>{SECTION_TITLES[section].subtitle}</p>
          </div>
          <div className="db-chips">
            {app.balances && (
              <span className="db-chip">
                <span className="bal">
                  <span className="bal-value">{formatAmount(app.balances.night)}</span>
                  <span className="bal-label">{SPEND_TOKEN}</span>
                </span>
                <span style={{ color: 'var(--border-strong)' }}>|</span>
                <span className="bal">
                  <span className="bal-value">{formatAmount(app.balances.dust)}</span>
                  <span className="bal-label">{FEE_TOKEN}</span>
                </span>
              </span>
            )}
            <SessionChip address={app.fundingAddress} demo={app.mode === 'demo'} />
            <NetworkChip demo={app.mode === 'demo'} />
          </div>
        </header>

        {app.busyLabel && (
          <div style={{ padding: '12px 30px 0' }}>
            <Notice tone="info">{app.busyLabel}</Notice>
          </div>
        )}

        <div className="db-body">
          {section === 'overview' && <Overview app={app} onGo={setSection} />}
          {section === 'mandates' && <Mandates app={app} />}
          {section === 'agents' && <Agents app={app} />}
          {section === 'activity' && <Activity app={app} />}
          {section === 'disclosure' && <Disclosure app={app} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

/**
 * Identifies the current session.
 *
 * With no wallet connected there is no address to show, and inventing one would
 * be exactly the thing this product exists to make impossible. It says so instead.
 */
/** The address that funds every mandate and receives every reclaim. */
function SessionChip({ address, demo }: { address: string; demo: boolean }) {
  return (
    <span
      className="db-chip"
      title={
        demo
          ? `Demo session. Mandates are funded from, and reclaimed to, ${address}`
          : `Connected wallet. Mandates are funded from, and reclaimed to, ${address}`
      }
    >
      <Lock size={14} />
      <span className="mono">{address ? truncateAddress(address, 8, 4) : '—'}</span>
    </span>
  );
}

function NetworkChip({ demo }: { demo: boolean }) {
  return (
    <span className="db-chip">
      <span
        className="dot"
        style={{ color: demo ? 'var(--amber)' : 'var(--green)' }}
        aria-hidden
      />
      {demo ? 'Demo — no chain' : NETWORK_LABEL}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function Overview({ app, onGo }: { app: App; onGo: (s: Section) => void }) {
  // Revoked mandates stay on this screen. A revoked mandate can still hold an
  // unspent balance, and reclaiming it is the whole point of revoking — hiding
  // the card would strand the funds.
  const mandates = useMemo(
    () =>
      [...app.mandates].sort((a, b) => {
        const ra = app.records[a.id]?.revoked ? 1 : 0;
        const rb = app.records[b.id]?.revoked ? 1 : 0;
        return ra - rb;
      }),
    [app.mandates, app.records],
  );

  return (
    <>
      {app.mode === 'chain' && app.balances && app.balances.dust === 0n && (
        <div style={{ marginBottom: 24 }}>
          <Notice tone="warn">
            <div>
              <strong>No spendable {FEE_TOKEN}.</strong> Every transaction needs {FEE_TOKEN} for
              fees. It accrues from your {SPEND_TOKEN} over time — complete the &ldquo;Generate{' '}
              {FEE_TOKEN}&rdquo; step in Lace, or{' '}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--violet)' }}>
                request {SPEND_TOKEN} from the faucet
              </a>{' '}
              first.
            </div>
          </Notice>
        </div>
      )}

      <div className="db-cols">
        <div>
          <div className="db-sec-head">
            <div>
              <h2>
                Active mandates
                {mandates.length > 0 && <span className="db-count">{mandates.length}</span>}
              </h2>
              <p>Track balances, limits and the agent authorized on each.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onGo('mandates')}>
              <Plus size={15} />
              New mandate
            </button>
          </div>

          {mandates.length === 0 ? (
            <EmptyState
              title="No mandates yet"
              body="A mandate gives one agent bounded spending authority under rules only you can read. Create one to begin."
              action={
                <button className="btn btn-primary" onClick={() => onGo('mandates')}>
                  <Plus size={15} />
                  Create a mandate
                </button>
              }
            />
          ) : (
            <div className="db-grid">
              {mandates.map((mandate) => (
                <MandateCard key={mandate.id} app={app} mandate={mandate} />
              ))}
            </div>
          )}

          {mandates.length > 0 && (
            <div className="foot-note">
              <Ban size={14} />
              Revoking a mandate is irreversible and immediately cancels all future authorizations.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                <Pulse size={16} />
                Recent agent activity
              </div>
              <p className="card-sub">Real-time activity from authorized agents.</p>
            </div>
            {/* No refresh control here: the feed updates as actions happen, and
                an icon that looks clickable but is not would be a lie. */}
            {app.activity.length > 0 && <Pill tone="ok">Live</Pill>}
          </div>

          {app.activity.length === 0 ? (
            <p className="hint" style={{ padding: '20px 0' }}>
              Nothing yet. Actions appear here the moment an agent proposes one.
            </p>
          ) : (
            <>
              <div className="feed">
                {app.activity.slice(0, 6).map((entry) => (
                  <FeedItem key={entry.id} entry={entry} label={labelFor(app, entry.mandateId)} />
                ))}
              </div>
              {app.activity.length > 6 && (
                <button
                  className="btn btn-sm btn-block"
                  style={{ marginTop: 16 }}
                  onClick={() => onGo('activity')}
                >
                  View all activity
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="db-strip">
        <div className="db-strip-main">
          <span className="tile">
            <Shield size={20} />
          </span>
          <div>
            <h3>Your mandates are enforced by cryptography, not by policy.</h3>
            <p>
              Rules never leave this device · Every payment verified by zero-knowledge proof ·
              Revocable at any time
            </p>
          </div>
        </div>
        <Link href="/#security" className="btn btn-sm">
          How this is secured
        </Link>
      </div>
    </>
  );
}

function labelFor(app: App, mandateId: string): string {
  return app.mandates.find((m) => m.id === mandateId)?.spec.label ?? 'unknown mandate';
}

function MandateCard({ app, mandate }: { app: App; mandate: StoredMandate }) {
  const record = app.records[mandate.id];
  const [note, setNote] = useState<ActionResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [askReclaim, setAskReclaim] = useState(false);

  if (!record) return null;

  // Progress is against the deposit, which is the money actually at stake.
  const used = record.deposited > 0n ? Number((record.spent * 100n) / record.deposited) : 0;

  return (
    <div className="card m-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span className="tile">
          <Shield size={20} />
        </span>
        {record.revoked ? <Pill tone="bad">Revoked</Pill> : <Pill tone="ok">Active</Pill>}
      </div>

      <div className="m-name">{mandate.spec.label}</div>

      <div className="m-amount">
        {formatAmount(record.escrow)}
        <span className="m-amount-unit">tNIGHT</span>
      </div>
      <div className="m-amount-label">Remaining balance</div>
      <div className="m-amount-of">of {formatToken(record.deposited)} deposited</div>

      <div className="meter" role="presentation">
        <div className="meter-fill" style={{ width: `${Math.min(100, used)}%` }} />
      </div>

      {/*
        The spend limit is a private rule. Showing it here is safe because this
        screen renders from local state on the owner's own device — it is never
        read back from the chain, where it does not exist.
      */}
      <div className="m-row">
        <span>Max spend limit</span>
        <span>{formatToken(mandate.spec.maxTotalSpend)}</span>
      </div>
      <div className="m-row">
        <span>Released so far</span>
        <span>{formatToken(record.spent)}</span>
      </div>

      <div className="divider" style={{ margin: '14px 0' }} />

      <div className="label" style={{ fontSize: 12 }}>
        Authorized agent
      </div>
      <div className="m-agent">
        <span className="m-agent-avatar" aria-hidden />
        <div>
          <div className="m-agent-key">{truncateAddress(mandate.spec.agentPublicKey, 8, 4)}</div>
          <div className="m-agent-role">
            {record.actionCount === 0n
              ? 'No actions yet'
              : `${record.actionCount} action${record.actionCount === 1n ? '' : 's'} authorized`}
          </div>
        </div>
      </div>

      <div className="m-row" style={{ marginTop: 12 }}>
        <span>Reclaims to</span>
        <span className="mono" title={record.creatorAddress}>
          {truncateAddress(record.creatorAddress, 8, 4)}
        </span>
      </div>

      <div className="m-actions">
        <button
          className="btn btn-danger btn-sm"
          disabled={record.revoked}
          title={
            confirming
              ? 'Click again to revoke permanently'
              : 'Permanently stop this agent and unlock the balance for reclaim'
          }
          onClick={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            setConfirming(false);
            void app.revoke(mandate.id).then(setNote);
          }}
        >
          <Ban size={14} />
          {confirming ? 'Confirm' : 'Revoke'}
        </button>
        <button
          className="btn btn-primary btn-sm"
          disabled={!record.revoked || record.escrow === 0n}
          title={
            record.revoked
              ? 'Return the unspent balance to an address you control'
              : 'Revoke the mandate before reclaiming'
          }
          onClick={() => setAskReclaim(true)}
        >
          <Download size={14} />
          Withdraw
        </button>
      </div>

      {/*
        The destination is not asked for, because the contract does not accept
        one: the balance always returns to the address that funded the mandate.
        Showing that address is the honest way to confirm the action.
      */}
      {confirming && !record.revoked && (
        <div style={{ marginTop: 14 }}>
          <Notice tone="warn">
            Revoking is permanent. The agent will be unable to authorize anything further, and the
            remaining {formatToken(record.escrow)} becomes reclaimable by you. Click Confirm to
            proceed.
          </Notice>
        </div>
      )}

      {askReclaim && record.revoked && (
        <div style={{ marginTop: 16 }}>
          <Notice tone="info">
            <div>
              <strong>{formatToken(record.escrow)}</strong> will be returned to the address that
              funded this mandate:
              <br />
              <span className="mono">{truncateAddress(record.creatorAddress, 16, 8)}</span>
              <br />
              The contract accepts no other destination, so this cannot be redirected.
            </div>
          </Notice>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                void app.withdraw(mandate.id).then(setNote);
                setAskReclaim(false);
              }}
            >
              Confirm withdrawal
            </button>
            <button className="btn btn-sm" onClick={() => setAskReclaim(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {note && (
        <div style={{ marginTop: 16 }}>
          <Notice tone={note.ok ? 'ok' : 'bad'}>{note.message}</Notice>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mandates — create and inspect
// ---------------------------------------------------------------------------

function Mandates({ app }: { app: App }) {
  return (
    <div className="db-cols">
      <CreateForm app={app} />
      <MandateDetails app={app} />
    </div>
  );
}

function CreateForm({ app }: { app: App }) {
  const [label, setLabel] = useState('');
  const [deposit, setDeposit] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [maxPer, setMaxPer] = useState('');
  const [period, setPeriod] = useState<PeriodKind>('none');
  const [periodLimit, setPeriodLimit] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [recipients, setRecipients] = useState('');
  const [agentSecret, setAgentSecret] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const agentPublicKey = useMemo(() => {
    try {
      return deriveAgentPublicKey(agentSecret);
    } catch {
      return '';
    }
  }, [agentSecret]);

  /**
   * Problems the user can see before they commit funds.
   *
   * Everything here is also enforced by the circuit; this only moves the
   * feedback to before the deposit rather than after it.
   */
  const problems = useMemo(() => {
    const found: string[] = [];
    const check = (value: string, what: string) => {
      if (value.trim() === '') return;
      try {
        if (parseAmount(value) <= 0n) found.push(`${what} must be greater than zero.`);
      } catch (error) {
        found.push(`${what}: ${(error as Error).message}`);
      }
    };
    check(deposit, 'Deposit');
    check(maxTotal, 'Max total spend');
    check(maxPer, 'Max per transaction');
    if (period !== 'none') check(periodLimit, 'Rolling limit amount');

    try {
      if (maxPer.trim() && maxTotal.trim() && parseAmount(maxPer) > parseAmount(maxTotal)) {
        found.push('The per-transaction limit cannot exceed the total spend limit.');
      }
    } catch {
      /* the individual amount errors above already cover this */
    }

    if (agentSecret.trim() !== '' && agentPublicKey === '') {
      found.push('The agent secret key must be 64 hexadecimal characters.');
    }

    const list = recipients.split(/[\s,]+/).map((r) => r.trim()).filter(Boolean);
    if (list.length > 8) found.push('At most 8 recipients can be allow-listed.');
    for (const address of list) {
      if (!isValidRecipient(address, app.networkId)) {
        found.push(`"${truncateAddress(address, 12, 4)}" is not a valid recipient address.`);
      }
    }

    const days = Number(validDays);
    if (!Number.isFinite(days) || days <= 0) {
      found.push('Validity must be a positive number of days.');
    }
    return found;
  }, [app.networkId, deposit, maxTotal, maxPer, period, periodLimit, agentSecret, agentPublicKey, recipients, validDays]);

  const unrestricted = recipients.trim() === '';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);
    if (problems.length > 0) {
      setResult({ ok: false, message: problems[0] });
      return;
    }
    setBusy(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const created = await app.createMandate(
        {
          label: label.trim() || 'Untitled mandate',
          maxTotalSpend: parseAmount(maxTotal),
          maxPerTransaction: parseAmount(maxPer),
          validFrom: now - 60,
          validUntil: now + Math.max(1, Number(validDays) || 1) * DAY,
          period,
          periodLimit: period === 'none' ? 0n : parseAmount(periodLimit),
          allowedRecipients: recipients
            .split(/[\s,]+/)
            .map((r) => r.trim())
            .filter(Boolean),
        },
        agentSecret,
        parseAmount(deposit),
      );

      if (created.ok) {
        setResult({
          ok: true,
          message: created.txId
            ? `Created on ${NETWORK_LABEL}. Transaction ${created.txId}`
            : `Created. Commitment ${created.mandate!.commitment}`,
        });
        setLabel('');
        setDeposit('');
        setMaxTotal('');
        setMaxPer('');
        setPeriodLimit('');
        setRecipients('');
        setAgentSecret('');
      } else {
        setResult({ ok: false, message: created.error ?? 'Could not create the mandate.' });
      }
    } catch (error) {
      setResult({ ok: false, message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-head">
        <div>
          <div className="card-title">
            <span className="tile tile-sm">
              <Plus size={16} />
            </span>
            New mandate
          </div>
          <p className="card-sub">
            Everything except the deposit stays in this browser. Only a commitment to these rules,
            the agent&rsquo;s public key and the deposit reach the chain.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <Field label="Label" hint="Yours only. Never committed, never published.">
          <input
            type="text"
            value={label}
            placeholder="e.g. Supplier invoices"
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        <Field label="Deposit (tNIGHT)" hint="Public — funds move on a public ledger.">
          <input
            type="text"
            inputMode="decimal"
            value={deposit}
            placeholder="0.00"
            onChange={(e) => setDeposit(e.target.value)}
            required
          />
        </Field>
        <Field label="Max total spend (tNIGHT)" hint="Private.">
          <input
            type="text"
            inputMode="decimal"
            value={maxTotal}
            placeholder="0.00"
            onChange={(e) => setMaxTotal(e.target.value)}
            required
          />
        </Field>
        <Field label="Max per transaction (tNIGHT)" hint="Private.">
          <input
            type="text"
            inputMode="decimal"
            value={maxPer}
            placeholder="0.00"
            onChange={(e) => setMaxPer(e.target.value)}
            required
          />
        </Field>
        <Field label="Rolling limit" hint="Private. Enforced by the chain, not by agent honesty.">
          <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKind)}>
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </Field>
        <Field label="Rolling limit amount (tNIGHT)" hint="Private.">
          <input
            type="text"
            inputMode="decimal"
            value={periodLimit}
            placeholder="0.00"
            disabled={period === 'none'}
            onChange={(e) => setPeriodLimit(e.target.value)}
            required={period !== 'none'}
          />
        </Field>
        <Field label="Valid for (days)" hint="Private. Checked in-circuit against block time.">
          <input
            type="text"
            inputMode="numeric"
            value={validDays}
            onChange={(e) => setValidDays(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="divider" />

      <Field
        label="Allowed recipients"
        hint="Private. Up to 8, one per line. Leave empty to let the agent pay anyone."
      >
        <textarea
          value={recipients}
          rows={3}
          placeholder="Leave empty for no restriction"
          onChange={(e) => setRecipients(e.target.value)}
        />
      </Field>

      <div className="divider" />

      <Field
        label="Agent secret key"
        hint="The agent proves it holds this; it is never published. In production the agent generates it and gives you only the public key."
      >
        <input
          type="text"
          className="mono"
          value={agentSecret}
          placeholder="64 hex characters"
          onChange={(e) => setAgentSecret(e.target.value.trim())}
          required
        />
      </Field>
      <div className="btn-row" style={{ marginTop: 12, alignItems: 'center' }}>
        <button type="button" className="btn btn-sm" onClick={() => setAgentSecret(randomHex32())}>
          Generate agent key
        </button>
        {agentPublicKey && (
          <span className="hint">
            Public key <Hash value={agentPublicKey} chars={10} />
          </span>
        )}
      </div>

      {unrestricted && (
        <div style={{ marginTop: 20 }}>
          <Notice tone="warn">
            <div>
              <strong>No recipient allow-list.</strong> With this left empty the agent may send to
              any address, including one it controls. The amount limits still apply, but naming the
              recipients you expect is the stronger guarantee.
            </div>
          </Notice>
        </div>
      )}

      {problems.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Notice tone="bad">
            <div>
              {problems.map((problem) => (
                <div key={problem}>{problem}</div>
              ))}
            </div>
          </Notice>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <Notice tone={result.ok ? 'ok' : 'bad'}>
            <span className={result.ok ? 'mono' : undefined}>{result.message}</span>
          </Notice>
        </div>
      )}

      <p className="hint" style={{ marginTop: 18 }}>
        Funds are deposited from, and can only ever be returned to, this session&rsquo;s address
        {app.fundingAddress ? (
          <>
            {' '}
            <span className="mono">{truncateAddress(app.fundingAddress, 12, 6)}</span>
          </>
        ) : (
          ''
        )}
        .
      </p>

      <div className="btn-row" style={{ marginTop: 14 }}>
        <button type="submit" className="btn btn-primary" disabled={busy || problems.length > 0}>
          {busy ? 'Proving…' : 'Create and fund escrow'}
        </button>
      </div>
    </form>
  );
}

function MandateDetails({ app }: { app: App }) {
  if (app.mandates.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <span className="tile tile-sm">
              <Lock size={16} />
            </span>
            Public vs private
          </div>
        </div>
        <p className="card-sub">
          Once you create a mandate, this panel shows exactly what the chain records and what stays
          on your device.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="tile tile-sm">
            <Lock size={16} />
          </span>
          What is on chain, and what is not
        </div>
      </div>

      {app.mandates.map((mandate) => {
        const record = app.records[mandate.id];
        return (
          <div key={mandate.id} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 580, marginBottom: 12 }}>{mandate.spec.label}</div>

            <div className="label" style={{ marginBottom: 7 }}>
              Public
            </div>
            <dl className="kv" style={{ marginBottom: 16 }}>
              <dt>Commitment</dt>
              <dd>
                <Hash value={mandate.commitment} chars={20} />
              </dd>
              <dt>Agent public key</dt>
              <dd>
                <Hash value={mandate.spec.agentPublicKey} chars={20} />
              </dd>
              <dt>Deposited</dt>
              <dd>{record ? formatToken(record.deposited) : '—'}</dd>
              <dt>Funding address</dt>
              <dd>
                <span className="mono">{truncateAddress(mandate.creatorAddress, 14, 6)}</span>
                <div className="hint">The only address the escrow can be returned to.</div>
              </dd>
            </dl>

            <div className="label" style={{ marginBottom: 7 }}>
              Private — this browser only
            </div>
            <dl className="kv">
              <dt>Max total spend</dt>
              <dd>{formatToken(mandate.spec.maxTotalSpend)}</dd>
              <dt>Max per transaction</dt>
              <dd>{formatToken(mandate.spec.maxPerTransaction)}</dd>
              <dt>Rolling limit</dt>
              <dd>
                {mandate.spec.period === 'none'
                  ? 'none'
                  : `${formatAmount(mandate.spec.periodLimit)} / ${mandate.spec.period}`}
              </dd>
              <dt>Expires</dt>
              <dd>{new Date(mandate.spec.validUntil * 1000).toLocaleString()}</dd>
              <dt>Allowed recipients</dt>
              <dd>
                {mandate.spec.allowedRecipients.length === 0
                  ? 'anyone'
                  : mandate.spec.allowedRecipients.map((r) => truncateAddress(r, 8, 4)).join(', ')}
              </dd>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

function Agents({ app }: { app: App }) {
  const [mandateId, setMandateId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [last, setLast] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = app.mandates.find((m) => m.id === mandateId) ?? app.mandates[0];

  async function propose(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;

    // Validate the inputs themselves before asking the agent to prove anything:
    // a malformed address is a typo, not a rule violation, and should not be
    // reported as one.
    let value: bigint;
    try {
      value = parseAmount(amount);
    } catch (error) {
      setLast({ ok: false, message: (error as Error).message });
      return;
    }
    if (!isValidRecipient(recipient.trim(), app.networkId)) {
      setLast({
        ok: false,
        message: 'That recipient is not a valid address. Paste it exactly as the wallet shows it.',
      });
      return;
    }

    setBusy(true);
    try {
      setLast(await app.runAgentAction(selected.id, recipient.trim(), value, memo));
    } catch (error) {
      setLast({ ok: false, message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (app.mandates.length === 0) {
    return (
      <EmptyState
        title="No agents authorized"
        body="An agent becomes authorized when you bind its public key to a mandate. Create a mandate to authorize one."
      />
    );
  }

  return (
    <div className="db-cols">
      <form className="card" onSubmit={propose}>
        <div className="card-head">
          <div>
            <div className="card-title">
              <span className="tile tile-sm">
                <Send size={16} />
              </span>
              Propose an action
            </div>
            <p className="card-sub">
              The agent checks the action against the rules it holds, then proves compliance in
              zero knowledge. Break a rule and the proof is unsatisfiable — the funds cannot move,
              whatever the agent intends.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <Field label="Mandate">
            <select value={selected?.id ?? ''} onChange={(e) => setMandateId(e.target.value)}>
              {app.mandates.map((mandate) => (
                <option key={mandate.id} value={mandate.id}>
                  {mandate.spec.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (tNIGHT)">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field label="Recipient" hint="Checked against the private allow-list in-circuit.">
            <input
              type="text"
              className="mono"
              value={recipient}
              placeholder="Recipient address"
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </Field>
          <Field label="Reference" hint="Local only. Never leaves this browser.">
            <input
              type="text"
              value={memo}
              placeholder="e.g. Invoice #1041"
              onChange={(e) => setMemo(e.target.value)}
            />
          </Field>
        </div>

        <div className="btn-row" style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Proving…' : 'Prove and submit'}
          </button>
        </div>

        {last && (
          <div style={{ marginTop: 22 }}>
            <Notice tone={last.ok ? 'ok' : 'bad'}>{last.message}</Notice>
            {last.preCheck && (
              <div style={{ marginTop: 16 }}>
                <RuleReport result={last.preCheck} />
              </div>
            )}
          </div>
        )}
      </form>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              <span className="tile tile-sm">
                <Users size={16} />
              </span>
              Authorized agents
            </div>
            <p className="card-sub">One agent per mandate, bound at creation.</p>
          </div>
        </div>
        {app.mandates.map((mandate) => (
          <div className="m-agent" key={mandate.id} style={{ padding: '10px 0' }}>
            <span className="m-agent-avatar" aria-hidden />
            <div style={{ flex: 1 }}>
              <div className="m-agent-key">
                {truncateAddress(mandate.spec.agentPublicKey, 10, 4)}
              </div>
              <div className="m-agent-role">{mandate.spec.label}</div>
            </div>
            {app.records[mandate.id]?.revoked ? (
              <Pill tone="bad">Revoked</Pill>
            ) : (
              <Pill tone="ok">Active</Pill>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

function Activity({ app }: { app: App }) {
  if (app.activity.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        body="Actions appear here as soon as an agent proposes one — whether it was authorized or refused."
      />
    );
  }

  return (
    <div className="card">
      <div className="feed">
        {app.activity.map((entry) => (
          <div className="feed-item" key={entry.id}>
            <span
              className={`feed-icon ${entry.outcome === 'executed' ? 'feed-ok' : 'feed-bad'}`}
            >
              {entry.outcome === 'executed' ? '✓' : '✕'}
            </span>
            <div className="feed-main">
              <div className="feed-title">
                <span>
                  {entry.outcome === 'executed' ? 'Payment executed' : 'Payment refused'}
                </span>
                <span className="feed-time">{relativeTime(entry.at)}</span>
              </div>
              <div className="feed-meta">
                {labelFor(app, entry.mandateId)} · {truncateAddress(entry.recipient, 10, 4)}
                {entry.memo ? ` · ${entry.memo}` : ''}
              </div>
              <div
                className={`feed-amount ${
                  entry.outcome === 'executed' ? 'feed-amount-ok' : 'feed-amount-bad'
                }`}
              >
                {entry.outcome === 'executed' ? '−' : ''}
                {formatToken(entry.amount)}
              </div>
              {entry.outcome !== 'executed' && (
                <div className="feed-meta" style={{ color: 'var(--red)' }}>
                  {entry.message}
                </div>
              )}
            </div>
            {entry.violatedRule && <Pill tone="bad">{entry.violatedRule}</Pill>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selective disclosure
// ---------------------------------------------------------------------------

const DISCLOSURE_LABELS: Record<number, string> = {
  0: 'Total spend limit was respected',
  1: 'Maximum total spend',
  2: 'Maximum per transaction',
  3: 'Valid until',
};

function Disclosure({ app }: { app: App }) {
  const [mandateId, setMandateId] = useState('');
  const [note, setNote] = useState<ActionResult | null>(null);
  const selected = app.mandates.find((m) => m.id === mandateId) ?? app.mandates[0];

  if (app.mandates.length === 0) {
    return (
      <EmptyState
        title="Nothing to disclose yet"
        body="Disclosures are proven against a mandate's commitment. Create a mandate first."
      />
    );
  }

  return (
    <div className="db-cols">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              <span className="tile tile-sm">
                <Eye size={16} />
              </span>
              Publish a proof
            </div>
            <p className="card-sub">
              The first proves a statement and publishes no rule value at all. The others open
              exactly one field, proven consistent with the commitment; every other rule stays
              hidden.
            </p>
          </div>
        </div>

        <Field label="Mandate">
          <select value={selected?.id ?? ''} onChange={(e) => setMandateId(e.target.value)}>
            {app.mandates.map((mandate) => (
              <option key={mandate.id} value={mandate.id}>
                {mandate.spec.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="btn-row" style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary"
            onClick={() => selected && void app.discloseTotalRespected(selected.id).then(setNote)}
          >
            Total limit was respected
          </button>
          <button
            className="btn"
            onClick={() => selected && void app.discloseField(selected.id, 2n).then(setNote)}
          >
            Reveal max per transaction
          </button>
          <button
            className="btn"
            onClick={() => selected && void app.discloseField(selected.id, 3n).then(setNote)}
          >
            Reveal valid until
          </button>
        </div>

        {note && (
          <div style={{ marginTop: 20 }}>
            <Notice tone={note.ok ? 'ok' : 'bad'}>{note.message}</Notice>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              <span className="tile tile-sm">
                <Pulse size={16} />
              </span>
              Published
            </div>
            <p className="card-sub">What a third party reading the ledger would see.</p>
          </div>
        </div>

        {app.disclosures.length === 0 ? (
          <p className="hint" style={{ padding: '16px 0' }}>
            No disclosures published.
          </p>
        ) : (
          <div className="feed">
            {app.disclosures.map((entry, index) => (
              <DisclosureItem
                key={`${entry.mandateId}-${index}`}
                title={DISCLOSURE_LABELS[entry.kind] ?? `Field ${entry.kind}`}
                detail={
                  <>
                    {entry.revealsValue ? (
                      <span className="mono">{formatToken(entry.value)}</span>
                    ) : (
                      'proven — no value revealed'
                    )}{' '}
                    · <Hash value={entry.mandateId} chars={8} />
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
