'use client';

import { useState } from 'react';

import {
  formatAmount,
  formatToken,
  parseAmount,
  randomHex32,
  truncateAddress,
} from '../lib/encoding';
import { deriveAgentPublicKey } from '../lib/mandate';
import type { ActionResult } from './store';
import { LOCAL_NETWORK_ID, useMandateApp } from './store';
import { Banner, Empty, Field, Hash, Pill, RuleReport, Stat } from './components';
import type { MandateSpec, PeriodKind, StoredMandate } from '../lib/types';

type Tab = 'mandates' | 'create' | 'agent' | 'disclosure';

const DAY = 86_400;

export default function Page() {
  const app = useMandateApp();
  const [tab, setTab] = useState<Tab>('create');

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">M</span>
            Mandate
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Pill tone="warn">Local demo ledger</Pill>
            <span className="hint">Midnight · Compact</span>
          </div>
        </div>
      </header>

      <main className="shell">
        <div style={{ paddingTop: 28 }}>
          <h1 style={{ fontSize: 22, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Spending authority for AI agents, under rules nobody else can read
          </h1>
          <p className="section-note">
            A mandate is a set of spending rules you write and keep. Only a cryptographic
            commitment to them reaches the chain. An agent you authorize can move money from
            escrow only by proving, in zero knowledge, that its action satisfies every one of
            those rules — and you can revoke and reclaim at any time.
          </p>
        </div>

        <Banner tone="warn">
          <div>
            <strong>This session runs against an in-memory ledger.</strong> The circuits are the
            real compiled ones, so every authorization and every refusal below is a genuine
            zero-knowledge constraint outcome — but nothing is being settled on a chain, and the
            ledger resets when you reload. To run against Midnight testnet, deploy the registry
            and connect a Lace wallet; see the README.
          </div>
        </Banner>

        <div className="grid-3" style={{ marginBottom: 4 }}>
          <Stat label="Active mandates" value={String(app.totals.active)} />
          <Stat label="Held in escrow" value={formatToken(app.totals.escrow)} />
          <Stat label="Released by agents" value={formatToken(app.totals.spent)} />
          <Stat label="Authorized actions" value={String(app.totals.actions)} />
        </div>

        <nav className="tabs" role="tablist">
          {(
            [
              ['create', 'Create mandate'],
              ['mandates', `Active mandates (${app.mandates.length})`],
              ['agent', 'Agent activity'],
              ['disclosure', 'Selective disclosure'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className="tab"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'create' && <CreateMandate app={app} onCreated={() => setTab('mandates')} />}
        {tab === 'mandates' && <Mandates app={app} />}
        {tab === 'agent' && <AgentConsole app={app} />}
        {tab === 'disclosure' && <Disclosure app={app} />}
      </main>
    </>
  );
}

type App = ReturnType<typeof useMandateApp>;

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

function CreateMandate({ app, onCreated }: { app: App; onCreated: () => void }) {
  const [label, setLabel] = useState('Supplier invoices');
  const [deposit, setDeposit] = useState('40');
  const [maxTotal, setMaxTotal] = useState('50');
  const [maxPer, setMaxPer] = useState('10');
  const [period, setPeriod] = useState<PeriodKind>('daily');
  const [periodLimit, setPeriodLimit] = useState('25');
  const [days, setDays] = useState('30');
  const [recipients, setRecipients] = useState('a'.repeat(64));
  const [agentSecret, setAgentSecret] = useState(() => randomHex32());
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const agentPublicKey = safeAgentKey(agentSecret);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      const draft: Omit<MandateSpec, 'agentPublicKey'> = {
        label,
        maxTotalSpend: parseAmount(maxTotal),
        maxPerTransaction: parseAmount(maxPer),
        validFrom: now - 60,
        validUntil: now + Number(days) * DAY,
        period,
        periodLimit: period === 'none' ? 0n : parseAmount(periodLimit),
        allowedRecipients: recipients
          .split(/[\s,]+/)
          .map((r) => r.trim())
          .filter(Boolean),
      };
      const created = app.createMandate(draft, agentSecret, parseAmount(deposit));
      if (created.ok) {
        setResult({ ok: true, message: `Mandate created. Commitment ${created.mandate!.commitment}` });
        onCreated();
      } else {
        setResult({ ok: false, message: created.error ?? 'Could not create the mandate.' });
      }
    } catch (error) {
      setResult({ ok: false, message: (error as Error).message });
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Rules</h2>
            <p className="card-sub">
              These values stay in this browser. Only a commitment to them — a hash that reveals
              nothing — is published, along with the authorized agent’s public key and the
              deposit amount.
            </p>
          </div>
        </div>

        <div className="grid-2">
          <Field label="Label" hint="For your reference only. Never committed, never published.">
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Deposit into escrow (tNIGHT)" hint="Public: the transfer is on a public ledger.">
            <input type="text" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </Field>
          <Field label="Maximum total spend (tNIGHT)" hint="Private.">
            <input type="text" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} />
          </Field>
          <Field label="Maximum per transaction (tNIGHT)" hint="Private.">
            <input type="text" value={maxPer} onChange={(e) => setMaxPer(e.target.value)} />
          </Field>
          <Field label="Rolling limit" hint="Private. Enforced by the chain, not by agent honesty.">
            <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKind)}>
              <option value="none">No rolling limit</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label="Rolling limit amount (tNIGHT)" hint="Private. Ignored when no rolling limit is set.">
            <input
              type="text"
              value={periodLimit}
              disabled={period === 'none'}
              onChange={(e) => setPeriodLimit(e.target.value)}
            />
          </Field>
          <Field label="Valid for (days)" hint="Private. The window is checked in-circuit against block time.">
            <input type="text" value={days} onChange={(e) => setDays(e.target.value)} />
          </Field>
        </div>

        <div className="divider" />

        <Field
          label="Allowed recipients"
          hint="Private. One per line, up to 8. Leave empty to let the agent pay anyone."
        >
          <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} rows={3} />
        </Field>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Authorized agent</h2>
            <p className="card-sub">
              A mandate is bound to one agent identity. In production the agent generates this
              keypair and gives you only the public key; the demo generates both so you can drive
              the agent from here.
            </p>
          </div>
        </div>
        <div className="grid-2">
          <Field label="Agent secret key" hint="Held by the agent. Proven, never published.">
            <input
              type="text"
              className="mono"
              value={agentSecret}
              onChange={(e) => setAgentSecret(e.target.value.trim())}
            />
          </Field>
          <Field label="Agent public key" hint="Published on chain as part of the mandate record.">
            <input type="text" className="mono" value={agentPublicKey} readOnly />
          </Field>
        </div>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-sm" onClick={() => setAgentSecret(randomHex32())}>
            Generate new agent key
          </button>
        </div>
      </div>

      {result && (
        <Banner tone={result.ok ? 'info' : 'bad'}>
          <span className={result.ok ? 'mono' : undefined}>{result.message}</span>
        </Banner>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button type="submit" className="btn btn-primary">
          Create mandate and fund escrow
        </button>
      </div>
    </form>
  );
}

function safeAgentKey(secret: string): string {
  try {
    return deriveAgentPublicKey(secret);
  } catch {
    return '—';
  }
}

// ---------------------------------------------------------------------------
// Active mandates
// ---------------------------------------------------------------------------

function Mandates({ app }: { app: App }) {
  const [feedback, setFeedback] = useState<Record<string, ActionResult>>({});
  const [refundTo, setRefundTo] = useState('f'.repeat(64));

  if (app.mandates.length === 0) {
    return (
      <div className="card">
        <Empty>No mandates yet. Create one to give an agent bounded spending authority.</Empty>
      </div>
    );
  }

  return (
    <div className="list">
      {app.mandates.map((mandate) => {
        const record = app.records[mandate.id];
        const note = feedback[mandate.id];
        return (
          <div className="card" key={mandate.id}>
            <div className="card-head">
              <div>
                <h2 className="card-title">{mandate.spec.label}</h2>
                <p className="card-sub">
                  <span className="mono">{mandate.id}</span>
                </p>
              </div>
              <div>
                {record?.revoked ? (
                  <Pill tone="bad">Revoked</Pill>
                ) : (
                  <Pill tone="ok">Active</Pill>
                )}
              </div>
            </div>

            {record && (
              <div className="grid-3" style={{ marginBottom: 18 }}>
                <Stat label="Escrow remaining" value={formatToken(record.escrow)} />
                <Stat
                  label="Released"
                  value={formatToken(record.spent)}
                  meter={{ used: record.spent, total: record.deposited }}
                />
                <Stat label="Actions authorized" value={String(record.actionCount)} />
              </div>
            )}

            <details>
              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12.5 }}>
                What is on chain, and what is not
              </summary>
              <div className="grid-2" style={{ marginTop: 14 }}>
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>
                    Public — anyone can read
                  </div>
                  <dl className="kv">
                    <dt>Commitment</dt>
                    <dd>
                      <Hash value={mandate.commitment} chars={18} />
                    </dd>
                    <dt>Agent public key</dt>
                    <dd>
                      <Hash value={mandate.spec.agentPublicKey} chars={18} />
                    </dd>
                    <dt>Deposited</dt>
                    <dd>{record ? formatToken(record.deposited) : '—'}</dd>
                    <dt>Released so far</dt>
                    <dd>{record ? formatToken(record.spent) : '—'}</dd>
                  </dl>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>
                    Private — only this browser holds it
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
                        : mandate.spec.allowedRecipients
                            .map((r) => truncateAddress(r, 10, 4))
                            .join(', ')}
                    </dd>
                  </dl>
                </div>
              </div>
            </details>

            <div className="divider" />

            <div className="grid-2" style={{ alignItems: 'end' }}>
              <Field label="Reclaim to" hint="Bound into the proof, so nobody can redirect it.">
                <input
                  type="text"
                  className="mono"
                  value={refundTo}
                  onChange={(e) => setRefundTo(e.target.value.trim())}
                />
              </Field>
              <div className="btn-row">
                <button
                  className="btn btn-danger"
                  disabled={record?.revoked}
                  onClick={() =>
                    setFeedback((f) => ({ ...f, [mandate.id]: app.revoke(mandate.id) }))
                  }
                >
                  Revoke mandate
                </button>
                <button
                  className="btn"
                  disabled={!record?.revoked || record.escrow === 0n}
                  onClick={() =>
                    setFeedback((f) => ({
                      ...f,
                      [mandate.id]: app.withdraw(mandate.id, refundTo),
                    }))
                  }
                >
                  Withdraw remaining
                </button>
              </div>
            </div>

            {note && (
              <div style={{ marginTop: 14 }}>
                <Banner tone={note.ok ? 'info' : 'bad'}>{note.message}</Banner>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent console
// ---------------------------------------------------------------------------

function AgentConsole({ app }: { app: App }) {
  const [mandateId, setMandateId] = useState(app.mandates[0]?.id ?? '');
  const [recipient, setRecipient] = useState('a'.repeat(64));
  const [amount, setAmount] = useState('8');
  const [memo, setMemo] = useState('Invoice #1041');
  const [last, setLast] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = app.mandates.find((m) => m.id === mandateId) ?? app.mandates[0];

  async function propose(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      setLast(await app.runAgentAction(selected.id, recipient, parseAmount(amount), memo));
    } catch (error) {
      setLast({ ok: false, message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Propose an action</h2>
            <p className="card-sub">
              The agent constructs the action, checks it against the private rules it holds, then
              produces a zero-knowledge proof and submits it. A rule violation makes the proof
              unsatisfiable — the money cannot move, whatever the agent intends.
            </p>
          </div>
        </div>

        {app.mandates.length === 0 ? (
          <Empty>Create a mandate first.</Empty>
        ) : (
          <form onSubmit={propose}>
            <div className="grid-2">
              <Field label="Mandate">
                <select value={selected?.id} onChange={(e) => setMandateId(e.target.value)}>
                  {app.mandates.map((mandate) => (
                    <option key={mandate.id} value={mandate.id}>
                      {mandate.spec.label} · {mandate.id.slice(0, 8)}…
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (tNIGHT)">
                <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Recipient" hint="Checked against the private allow-list in-circuit.">
                <input
                  type="text"
                  className="mono"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.trim())}
                />
              </Field>
              <Field label="Memo" hint="Local only. Never leaves this browser.">
                <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} />
              </Field>
            </div>
            <div className="btn-row" style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Proving…' : 'Prove and submit'}
              </button>
              {/*
                Each preset loads a complete scenario rather than editing one
                field, so the rule under test is the one that actually fires.
              */}
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setAmount('8');
                  setRecipient('a'.repeat(64));
                  setMemo('Invoice #1041');
                }}
              >
                A compliant action
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setAmount('25');
                  setRecipient('a'.repeat(64));
                  setMemo('Deliberately over the per-transaction limit');
                }}
              >
                Over the per-transaction limit
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setAmount('1');
                  setRecipient('c'.repeat(64));
                  setMemo('Deliberately to an unlisted recipient');
                }}
              >
                To an unlisted recipient
              </button>
            </div>
          </form>
        )}

        {last && (
          <div style={{ marginTop: 18 }}>
            <Banner tone={last.ok ? 'info' : 'bad'}>{last.message}</Banner>
            {last.preCheck && <RuleReport result={last.preCheck} />}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Activity log</h2>
            <p className="card-sub">
              Every action the agent proposed, and what happened to it. Refusals name the rule
              that stopped them.
            </p>
          </div>
        </div>
        {app.activity.length === 0 ? (
          <Empty>Nothing yet.</Empty>
        ) : (
          <div>
            {app.activity.map((entry) => (
              <div className="rule-row" key={entry.id}>
                <span
                  className="rule-mark"
                  style={{ color: entry.outcome === 'executed' ? 'var(--ok)' : 'var(--bad)' }}
                >
                  {entry.outcome === 'executed' ? '✓' : '✕'}
                </span>
                <span style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{formatToken(entry.amount)}</strong>
                    <span className="mono" style={{ color: 'var(--text-faint)' }}>
                      → {truncateAddress(entry.recipient, 10, 4)}
                    </span>
                    {entry.memo && <span style={{ color: 'var(--text-muted)' }}>{entry.memo}</span>}
                    {entry.violatedRule && <Pill tone="bad">{entry.violatedRule}</Pill>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{entry.message}</div>
                </span>
                <span className="hint">{new Date(entry.at * 1000).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Selective disclosure
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<number, string> = {
  0: 'Total spend limit was respected',
  1: 'Maximum total spend',
  2: 'Maximum per transaction',
  3: 'Valid until',
};

function Disclosure({ app }: { app: App }) {
  const [mandateId, setMandateId] = useState(app.mandates[0]?.id ?? '');
  const [note, setNote] = useState<ActionResult | null>(null);
  const selected = app.mandates.find((m) => m.id === mandateId) ?? app.mandates[0];

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Prove something to a third party</h2>
            <p className="card-sub">
              An auditor, a counterparty or a regulator may need to know one specific fact about a
              mandate. These circuits prove that fact against the same commitment without opening
              anything else.
            </p>
          </div>
        </div>

        {app.mandates.length === 0 ? (
          <Empty>Create a mandate first.</Empty>
        ) : (
          <>
            <Field label="Mandate">
              <select value={selected?.id} onChange={(e) => setMandateId(e.target.value)}>
                {app.mandates.map((mandate) => (
                  <option key={mandate.id} value={mandate.id}>
                    {mandate.spec.label} · {mandate.id.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </Field>

            <div className="btn-row" style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={() => selected && setNote(app.discloseTotalRespected(selected.id))}
              >
                Prove the total limit was respected
              </button>
              <button
                className="btn"
                onClick={() => selected && setNote(app.discloseField(selected.id, 2n))}
              >
                Reveal only “max per transaction”
              </button>
              <button
                className="btn"
                onClick={() => selected && setNote(app.discloseField(selected.id, 3n))}
              >
                Reveal only “valid until”
              </button>
            </div>

            <p className="hint" style={{ marginTop: 12 }}>
              The first proves a statement and publishes no rule value at all. The other two open
              exactly one field, proven consistent with the commitment; every other rule stays
              hidden.
            </p>
          </>
        )}

        {note && (
          <div style={{ marginTop: 16 }}>
            <Banner tone={note.ok ? 'info' : 'bad'}>{note.message}</Banner>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Published disclosures</h2>
            <p className="card-sub">What a third party reading the ledger would see.</p>
          </div>
        </div>
        {app.disclosures.length === 0 ? (
          <Empty>No disclosures published.</Empty>
        ) : (
          <div>
            {app.disclosures.map((entry, index) => (
              <div className="rule-row" key={`${entry.mandateId}-${index}`}>
                <span className="rule-mark" style={{ color: 'var(--accent)' }}>
                  ◆
                </span>
                <span style={{ flex: 1 }}>
                  <div>
                    <strong>{FIELD_LABELS[entry.kind] ?? `Field ${entry.kind}`}</strong>
                    {entry.revealsValue ? (
                      <span className="mono" style={{ marginLeft: 10 }}>
                        {formatToken(entry.value)}
                      </span>
                    ) : (
                      <Pill tone="ok">proven, no value revealed</Pill>
                    )}
                  </div>
                  <div className="hint">
                    mandate <Hash value={entry.mandateId} chars={12} />
                  </div>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
