'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatAmount,
  formatToken,
  parseAmount,
  randomHex32,
  truncateAddress,
} from '../../lib/encoding';
import { deriveAgentPublicKey } from '../../lib/mandate';
import type { MandateSpec, PeriodKind, StoredMandate } from '../../lib/types';
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
  Logo,
  Lock,
  Plus,
  Pulse,
  Refresh,
  Send,
  Shield,
  Users,
} from '../icons';
import type { ActionResult } from '../store';
import { LOCAL_NETWORK_ID, useMandateApp } from '../store';

type Section = 'overview' | 'mandates' | 'agents' | 'activity' | 'disclosure';
type App = ReturnType<typeof useMandateApp>;

const DAY = 86_400;

const NAV: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Grid /> },
  { key: 'mandates', label: 'Mandates', icon: <Shield /> },
  { key: 'agents', label: 'Agents', icon: <Users /> },
  { key: 'activity', label: 'Activity', icon: <Pulse /> },
  { key: 'disclosure', label: 'Disclosure', icon: <Eye /> },
];

export default function Dashboard() {
  const app = useMandateApp();
  const [section, setSection] = useState<Section>('overview');

  return (
    <div className="db">
      <aside className="db-side">
        <Link href="/" className="db-brand">
          <Logo size={26} />
          <span>Mandate</span>
        </Link>

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

        <div className="db-side-foot">
          <Lock size={16} />
          <div>
            Rules stay on this device.
            <br />
            You control access.
          </div>
        </div>
      </aside>

      <div className="db-main">
        <header className="db-top">
          <SessionChip />
          <NetworkChip />
        </header>

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
 * be the exact thing this product exists to make impossible. It says so instead.
 */
function SessionChip() {
  return (
    <span className="db-chip" title="No wallet is connected; this session is local to your browser">
      <Lock size={14} />
      Local session
    </span>
  );
}

function NetworkChip() {
  const configured = process.env.NEXT_PUBLIC_NETWORK_ID;
  return (
    <span className="db-chip">
      <span
        className="dot"
        style={{ color: configured ? 'var(--violet)' : 'var(--amber)' }}
        aria-hidden
      />
      {configured ? `Midnight ${configured}` : 'In-memory ledger'}
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
      <div className="db-head">
        <h1>Active mandates</h1>
        <p>Monitor and control the spending authority you have granted.</p>
      </div>

      {!process.env.NEXT_PUBLIC_NETWORK_ID && (
        <div style={{ marginBottom: 22 }}>
          <Notice tone="warn">
            <div>
              <strong>This session runs against an in-memory ledger.</strong> The circuits are the
              real compiled ones, so every authorization and refusal is a genuine zero-knowledge
              outcome — but nothing is settled on a chain, and the ledger resets when you reload.
            </div>
          </Notice>
        </div>
      )}

      <div className="db-cols">
        <div>
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
              <p className="card-sub">Every action an agent proposed, and what happened to it.</p>
            </div>
            <Refresh size={15} />
          </div>

          {app.activity.length === 0 ? (
            <p className="hint" style={{ padding: '18px 0' }}>
              Nothing yet. Actions appear here the moment an agent proposes one.
            </p>
          ) : (
            <>
              <div className="feed">
                {app.activity.slice(0, 6).map((entry) => (
                  <FeedItem
                    key={entry.id}
                    entry={entry}
                    label={labelFor(app, entry.mandateId)}
                  />
                ))}
              </div>
              {app.activity.length > 6 && (
                <button
                  className="btn btn-sm btn-block"
                  style={{ marginTop: 14 }}
                  onClick={() => onGo('activity')}
                >
                  View all activity
                </button>
              )}
            </>
          )}
        </div>
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
  const [reclaimTo, setReclaimTo] = useState('');
  const [askReclaim, setAskReclaim] = useState(false);

  if (!record) return null;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span style={{ color: 'var(--violet)', display: 'inline-flex' }}>
            <Shield size={17} />
          </span>
          {mandate.spec.label}
        </div>
      </div>

      <div className="mandate-line">
        <span>Remaining balance</span>
        <span>{formatToken(record.escrow)}</span>
      </div>
      {/*
        The spend limit is a private rule. It is safe to show here because this
        screen renders from local state on the owner's own device — it is never
        read back from the chain, where it does not exist.
      */}
      <div className="mandate-line">
        <span>Max spend limit</span>
        <span>{formatToken(mandate.spec.maxTotalSpend)}</span>
      </div>
      <div className="mandate-line">
        <span>Authorized agent</span>
        <span className="agent-tag">
          <span className="agent-avatar" aria-hidden />
          <Hash value={mandate.spec.agentPublicKey} chars={8} />
        </span>
      </div>
      <div className="mandate-line">
        <span>Status</span>
        <span>
          {record.revoked ? <Pill tone="bad">Revoked</Pill> : <Pill tone="ok">Active</Pill>}
        </span>
      </div>

      <div className="mandate-actions">
        <button
          className="btn btn-danger btn-sm"
          disabled={record.revoked}
          onClick={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            setConfirming(false);
            setNote(app.revoke(mandate.id));
          }}
        >
          <Ban size={14} />
          {confirming ? 'Confirm revoke' : 'Revoke'}
        </button>
        <button
          className="btn btn-sm"
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
        The reclaim address is asked for rather than assumed. It is bound into
        the proof, so getting it right matters and guessing on the user's behalf
        would be the wrong kind of convenience.
      */}
      {askReclaim && record.revoked && (
        <div style={{ marginTop: 14 }}>
          <Field label="Reclaim to" hint="Bound into the proof, so nobody can redirect the funds.">
            <input
              type="text"
              className="mono"
              value={reclaimTo}
              placeholder="Address to return the balance to"
              onChange={(e) => setReclaimTo(e.target.value.trim())}
            />
          </Field>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button
              className="btn btn-sm btn-primary"
              disabled={reclaimTo.length === 0}
              onClick={() => {
                setNote(app.withdraw(mandate.id, reclaimTo));
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
        <div style={{ marginTop: 14 }}>
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
    <>
      <div className="db-head">
        <h1>Mandates</h1>
        <p>Define the rules, fund the escrow, and see exactly what becomes public.</p>
      </div>
      <div className="db-cols">
        <CreateForm app={app} />
        <MandateDetails app={app} />
      </div>
    </>
  );
}

function CreateForm({ app }: { app: App }) {
  const [label, setLabel] = useState('');
  const [deposit, setDeposit] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [maxPer, setMaxPer] = useState('');
  const [period, setPeriod] = useState<PeriodKind>('none');
  const [periodLimit, setPeriodLimit] = useState('');
  const [days, setDays] = useState('30');
  const [recipients, setRecipients] = useState('');
  const [agentSecret, setAgentSecret] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const agentPublicKey = useMemo(() => {
    try {
      return deriveAgentPublicKey(agentSecret);
    } catch {
      return '';
    }
  }, [agentSecret]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      const created = app.createMandate(
        {
          label: label.trim() || 'Untitled mandate',
          maxTotalSpend: parseAmount(maxTotal),
          maxPerTransaction: parseAmount(maxPer),
          validFrom: now - 60,
          validUntil: now + Math.max(1, Number(days) || 1) * DAY,
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
        setResult({ ok: true, message: `Created. Commitment ${created.mandate!.commitment}` });
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
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-head">
        <div>
          <div className="card-title">
            <Plus size={16} />
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
            value={days}
            onChange={(e) => setDays(e.target.value)}
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
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn-sm" onClick={() => setAgentSecret(randomHex32())}>
          Generate agent key
        </button>
        {agentPublicKey && (
          <span className="hint" style={{ alignSelf: 'center' }}>
            Public key <Hash value={agentPublicKey} chars={10} />
          </span>
        )}
      </div>

      {result && (
        <div style={{ marginTop: 18 }}>
          <Notice tone={result.ok ? 'ok' : 'bad'}>
            <span className={result.ok ? 'mono' : undefined}>{result.message}</span>
          </Notice>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button type="submit" className="btn btn-primary">
          Create and fund escrow
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
            <Lock size={16} />
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
        <div>
          <div className="card-title">
            <Lock size={16} />
            What is on chain, and what is not
          </div>
        </div>
      </div>

      {app.mandates.map((mandate) => {
        const record = app.records[mandate.id];
        return (
          <div key={mandate.id} style={{ marginBottom: 22 }}>
            <div style={{ fontWeight: 560, marginBottom: 10 }}>{mandate.spec.label}</div>

            <div className="label" style={{ marginBottom: 6 }}>
              Public
            </div>
            <dl className="kv" style={{ marginBottom: 14 }}>
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
            </dl>

            <div className="label" style={{ marginBottom: 6 }}>
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
    setBusy(true);
    try {
      setLast(await app.runAgentAction(selected.id, recipient.trim(), parseAmount(amount), memo));
    } catch (error) {
      setLast({ ok: false, message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="db-head">
        <h1>Agents</h1>
        <p>Each mandate is bound to one agent identity. Only that agent can act under it.</p>
      </div>

      {app.mandates.length === 0 ? (
        <EmptyState
          title="No agents authorized"
          body="An agent becomes authorized when you bind its public key to a mandate. Create a mandate to authorize one."
        />
      ) : (
        <div className="db-cols">
          <form className="card" onSubmit={propose}>
            <div className="card-head">
              <div>
                <div className="card-title">
                  <Send size={16} />
                  Propose an action
                </div>
                <p className="card-sub">
                  The agent checks the action against the rules it holds, then proves compliance in
                  zero knowledge. Break a rule and the proof is unsatisfiable — the funds cannot
                  move, whatever the agent intends.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <Field label="Mandate">
                <select
                  value={selected?.id ?? ''}
                  onChange={(e) => setMandateId(e.target.value)}
                >
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

            <div className="btn-row" style={{ marginTop: 18 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Proving…' : 'Prove and submit'}
              </button>
            </div>

            {last && (
              <div style={{ marginTop: 20 }}>
                <Notice tone={last.ok ? 'ok' : 'bad'}>{last.message}</Notice>
                {last.preCheck && (
                  <div style={{ marginTop: 14 }}>
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
                  <Users size={16} />
                  Authorized agents
                </div>
                <p className="card-sub">One agent per mandate, bound at creation.</p>
              </div>
            </div>
            {app.mandates.map((mandate) => (
              <div className="mandate-line" key={mandate.id}>
                <span className="agent-tag">
                  <span className="agent-avatar" aria-hidden />
                  <Hash value={mandate.spec.agentPublicKey} chars={10} />
                </span>
                <span>{mandate.spec.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

function Activity({ app }: { app: App }) {
  return (
    <>
      <div className="db-head">
        <h1>Activity</h1>
        <p>Every action proposed under your mandates, and the rule that decided it.</p>
      </div>

      {app.activity.length === 0 ? (
        <EmptyState
          title="No activity yet"
          body="Actions appear here as soon as an agent proposes one — whether it was authorized or refused."
        />
      ) : (
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
                      {formatToken(entry.amount)} → {truncateAddress(entry.recipient, 10, 4)}
                    </span>
                    <span className="feed-time">{relativeTime(entry.at)}</span>
                  </div>
                  <div className="feed-meta">
                    {labelFor(app, entry.mandateId)}
                    {entry.memo ? ` · ${entry.memo}` : ''}
                  </div>
                  <div
                    className="feed-meta"
                    style={{ color: entry.outcome === 'executed' ? undefined : 'var(--red)' }}
                  >
                    {entry.message}
                  </div>
                </div>
                {entry.violatedRule && <Pill tone="bad">{entry.violatedRule}</Pill>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
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

  return (
    <>
      <div className="db-head">
        <h1>Selective disclosure</h1>
        <p>Prove one fact to a third party without opening anything else.</p>
      </div>

      {app.mandates.length === 0 ? (
        <EmptyState
          title="Nothing to disclose yet"
          body="Disclosures are proven against a mandate's commitment. Create a mandate first."
        />
      ) : (
        <div className="db-cols">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">
                  <Eye size={16} />
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

            <div className="btn-row" style={{ marginTop: 18 }}>
              <button
                className="btn btn-primary"
                onClick={() => selected && setNote(app.discloseTotalRespected(selected.id))}
              >
                Total limit was respected
              </button>
              <button
                className="btn"
                onClick={() => selected && setNote(app.discloseField(selected.id, 2n))}
              >
                Reveal max per transaction
              </button>
              <button
                className="btn"
                onClick={() => selected && setNote(app.discloseField(selected.id, 3n))}
              >
                Reveal valid until
              </button>
            </div>

            {note && (
              <div style={{ marginTop: 18 }}>
                <Notice tone={note.ok ? 'ok' : 'bad'}>{note.message}</Notice>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">
                  <Pulse size={16} />
                  Published
                </div>
                <p className="card-sub">What a third party reading the ledger would see.</p>
              </div>
            </div>

            {app.disclosures.length === 0 ? (
              <p className="hint" style={{ padding: '14px 0' }}>
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
      )}
    </>
  );
}
