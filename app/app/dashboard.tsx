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
import { PERIOD_SECONDS, type PeriodKind, type StoredMandate } from '../../lib/types';
import {
  DisclosureItem,
  EmptyState,
  FeedItem,
  Field,
  Hash,
  Notice,
  outcomeLabel,
  Pill,
  RuleReport,
  relativeTime,
} from '../components';
import {
  Ban,
  Chevron,
  Coins,
  Cog,
  Copy,
  Download,
  Eye,
  Grid,
  Lock,
  Logo,
  Plus,
  Pulse,
  Search,
  Send,
  Shield,
  Users,
  Wallet,
} from '../icons';
import { ConnectGate } from '../connect';
import {
  FAUCET_URL,
  FEE_TOKEN,
  NETWORK_LABEL,
  SPEND_TOKEN,
} from '../../lib/network';
import type { ActionResult } from '../session';
import { useSession } from '../session';

type Section = 'overview' | 'mandates' | 'agents' | 'history' | 'disclosure' | 'settings';
/** Which mandates the "My Mandates" screen is showing. */
type Filter = 'all' | 'active' | 'revoked';
type App = ReturnType<typeof useSession>;

const DAY = 86_400;

export function Dashboard() {
  const app = useSession();
  const [section, setSection] = useState<Section>('overview');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  // Nothing in here works without a wallet, a registry and local private state,
  // so the connection is dealt with first rather than failing on the first click.
  // There is no path past this gate that does not hold a live Midnight session.
  if (app.status !== 'ready') {
    return <ConnectGate session={app} />;
  }

  const go = (next: Section, nextFilter: Filter = 'all') => {
    setSection(next);
    setFilter(nextFilter);
  };

  return (
    <div className="db">
      <Sidebar section={section} filter={filter} onGo={go} />

      <div className="db-main">
        <header className="db-top">
          <label className="db-search">
            <Search size={16} />
            <input
              type="text"
              value={query}
              placeholder="Search mandates, agents and activity"
              aria-label="Search mandates, agents and activity"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query !== '' && (
              <button type="button" className="db-search-clear" onClick={() => setQuery('')}>
                Clear
              </button>
            )}
          </label>

          <div className="db-chips">
            <NetworkMenu app={app} />
            <SessionChip address={app.fundingAddress} />
          </div>
        </header>

        {app.busyLabel && (
          <div style={{ padding: '16px 30px 0' }}>
            <Notice tone="info">{app.busyLabel}</Notice>
          </div>
        )}

        <div className="db-body">
          {section === 'overview' && <Overview app={app} query={query} onGo={go} />}
          {section === 'mandates' && (
            <MandatesSection app={app} query={query} filter={filter} onFilter={setFilter} />
          )}
          {section === 'agents' && <AgentsSection app={app} query={query} />}
          {section === 'history' && <HistorySection app={app} query={query} />}
          {section === 'disclosure' && <DisclosureSection app={app} />}
          {section === 'settings' && <SettingsSection app={app} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function Sidebar({
  section,
  filter,
  onGo,
}: {
  section: Section;
  filter: Filter;
  onGo: (section: Section, filter?: Filter) => void;
}) {
  // "My Mandates" opens itself when you are inside it, and can be folded away
  // when you are not.
  const [open, setOpen] = useState(true);
  const mandatesOpen = open || section === 'mandates';

  return (
    <aside className="db-side">
      <Link href="/" className="db-brand" aria-label="Mandate — back to the landing page">
        <Logo size={28} />
        <span className="db-brand-name">MANDATE</span>
      </Link>
      <div className="db-brand-tag">Secure. Controlled. Verifiable.</div>

      {/*
        Every nav button carries its label as `aria-label` and `title`, not only
        as visible text: below 900px the sidebar collapses to icons and the text
        is hidden, which would otherwise leave six unnamed buttons.
      */}
      <nav className="db-nav">
        <button
          onClick={() => onGo('overview')}
          aria-current={section === 'overview' ? 'page' : undefined}
          aria-label="Dashboard"
          title="Dashboard"
        >
          <Grid />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            if (section === 'mandates') setOpen((value) => !value);
            else onGo('mandates', 'all');
          }}
          aria-current={section === 'mandates' ? 'page' : undefined}
          aria-expanded={mandatesOpen}
          aria-label="My Mandates"
          title="My Mandates"
        >
          <Shield />
          <span>My Mandates</span>
          <span className={`db-caret ${mandatesOpen ? 'db-caret-open' : ''}`}>
            <Chevron size={13} />
          </span>
        </button>

        {mandatesOpen && (
          <div className="db-sub">
            {/*
              Only the two states the contract actually has. A "paused" filter
              would be a tab that can never contain anything: revocation is
              permanent by design, so there is nothing in between.
            */}
            {(['all', 'active', 'revoked'] as Filter[]).map((key) => (
              <button
                key={key}
                onClick={() => onGo('mandates', key)}
                aria-current={section === 'mandates' && filter === key ? 'page' : undefined}
              >
                {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Revoked'}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onGo('agents')}
          aria-current={section === 'agents' ? 'page' : undefined}
          aria-label="Agents"
          title="Agents"
        >
          <Users />
          <span>Agents</span>
        </button>
        <button
          onClick={() => onGo('history')}
          aria-current={section === 'history' ? 'page' : undefined}
          aria-label="History"
          title="History"
        >
          <Pulse />
          <span>History</span>
        </button>
        <button
          onClick={() => onGo('disclosure')}
          aria-current={section === 'disclosure' ? 'page' : undefined}
          aria-label="Disclosure"
          title="Disclosure"
        >
          <Eye />
          <span>Disclosure</span>
        </button>
        <button
          onClick={() => onGo('settings')}
          aria-current={section === 'settings' ? 'page' : undefined}
          aria-label="Settings"
          title="Settings"
        >
          <Cog />
          <span>Settings</span>
        </button>
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
  );
}

/** The address that funds every mandate and receives every reclaim. */
function SessionChip({ address }: { address: string }) {
  return (
    <span
      className="db-chip"
      title={`Connected wallet. Mandates are funded from, and reclaimed to, ${address}`}
    >
      <Lock size={14} />
      <span className="mono">{address ? truncateAddress(address, 8, 4) : '—'}</span>
    </span>
  );
}

/**
 * The network control.
 *
 * It opens rather than switches: Preprod is pinned in `lib/network.ts` and the
 * app refuses any other network, so a dropdown offering alternatives would be
 * offering something that does not exist. What it shows instead is everything
 * about the connection worth checking.
 */
function NetworkMenu({ app }: { app: App }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="db-pop-wrap">
      <button
        className="db-chip db-chip-btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="dot" style={{ color: 'var(--green)' }} aria-hidden />
        {NETWORK_LABEL}
        <Chevron size={13} />
      </button>

      {open && (
        <div className="db-pop" role="dialog" aria-label="Network">
          <div className="db-pop-title">Connection</div>
          <dl className="kv kv-tight">
            <dt>Network</dt>
            <dd>{NETWORK_LABEL}</dd>
            <dt>Spend asset</dt>
            <dd>{SPEND_TOKEN}</dd>
            <dt>Fee asset</dt>
            <dd>{FEE_TOKEN}</dd>
            <dt>Registry</dt>
            <dd>
              {app.registryAddress ? (
                <Hash value={app.registryAddress} chars={14} />
              ) : (
                'not configured'
              )}
            </dd>
            <dt>Wallet</dt>
            <dd>
              <span className="mono">
                {app.fundingAddress ? truncateAddress(app.fundingAddress, 12, 6) : '—'}
              </span>
            </dd>
          </dl>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn btn-sm" onClick={() => void app.refreshBalances()}>
              Refresh balances
            </button>
            <a className="btn btn-sm" href={FAUCET_URL} target="_blank" rel="noreferrer">
              Faucet
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="db-page-head">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared derivations
// ---------------------------------------------------------------------------

function labelFor(app: App, mandateId: string): string {
  return app.mandates.find((m) => m.id === mandateId)?.spec.label ?? 'unknown mandate';
}

/** Free-text search across the fields a user would actually recognise. */
function matches(mandate: StoredMandate, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    mandate.spec.label.toLowerCase().includes(q) ||
    mandate.spec.agentPublicKey.toLowerCase().includes(q) ||
    mandate.id.toLowerCase().includes(q)
  );
}

/**
 * Sort revoked mandates last but never hide them: a revoked mandate can still
 * hold an unspent balance, and reclaiming it is the whole point of revoking.
 */
function useMandateList(app: App, query: string, filter: Filter = 'all'): StoredMandate[] {
  return useMemo(() => {
    const list = app.mandates.filter((mandate) => {
      if (!matches(mandate, query)) return false;
      const revoked = app.records[mandate.id]?.revoked ?? false;
      if (filter === 'active') return !revoked;
      if (filter === 'revoked') return revoked;
      return true;
    });
    return list.sort((a, b) => {
      const ra = app.records[a.id]?.revoked ? 1 : 0;
      const rb = app.records[b.id]?.revoked ? 1 : 0;
      return ra - rb;
    });
  }, [app.mandates, app.records, filter, query]);
}

function shortDuration(seconds: number): string {
  if (seconds <= 0) return 'now';
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))}m`;
  if (seconds < DAY) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / DAY)}d`;
}

/**
 * When this mandate's next limit boundary falls.
 *
 * A rolling window rolls at `periodStart + period`, and `periodStart` is zero
 * until the first payment. Without a rolling limit the only time boundary is
 * the mandate's own expiry.
 */
function nextLimitCheck(
  mandate: StoredMandate,
  periodStart: bigint,
): { value: string; detail: string } {
  const now = Math.floor(Date.now() / 1000);
  const { period, validUntil } = mandate.spec;

  if (period !== 'none') {
    if (periodStart === 0n) {
      return { value: `On first payment`, detail: `${period} limit window has not opened yet` };
    }
    const rollsAt = Number(periodStart + PERIOD_SECONDS[period]);
    if (rollsAt <= now) {
      return { value: 'Window open', detail: `${period} limit resets on the next payment` };
    }
    return {
      value: `in ${shortDuration(rollsAt - now)}`,
      detail: `${period} limit resets ${new Date(rollsAt * 1000).toLocaleString()}`,
    };
  }

  if (validUntil <= now) {
    return { value: 'Expired', detail: `Expired ${new Date(validUntil * 1000).toLocaleString()}` };
  }
  return {
    value: `Expires in ${shortDuration(validUntil - now)}`,
    detail: `Valid until ${new Date(validUntil * 1000).toLocaleString()}`,
  };
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

function Overview({
  app,
  query,
  onGo,
}: {
  app: App;
  query: string;
  onGo: (section: Section, filter?: Filter) => void;
}) {
  const mandates = useMandateList(app, query);
  const blocked = app.activity.filter((entry) => entry.outcome !== 'executed').length;

  return (
    <>
      <PageTitle title="Dashboard Overview" subtitle="Your secure AI spending control center." />

      {app.balances && app.balances.dust === 0n && (
        <div style={{ marginBottom: 22 }}>
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

      <div className="db-sec-label">Quick stats</div>
      <div className="db-stats">
        <Stat
          icon={<Shield size={17} />}
          label="Active mandates"
          value={String(app.totals.active)}
          sub={
            app.mandates.length === app.totals.active
              ? 'none revoked'
              : `${app.mandates.length - app.totals.active} revoked`
          }
        />
        <Stat
          icon={<Coins size={17} />}
          label="Total in escrow"
          value={formatAmount(app.totals.escrow)}
          unit={SPEND_TOKEN}
          sub="held by the contract, spendable only under proof"
        />
        <Stat
          icon={<Send size={17} />}
          label="Released to agents"
          value={formatAmount(app.totals.spent)}
          unit={SPEND_TOKEN}
          sub={`${app.activity.filter((e) => e.outcome === 'executed').length} authorized payments`}
        />
        <Stat
          icon={<Ban size={17} />}
          label="Blocked attempts"
          value={String(blocked)}
          sub={blocked === 0 ? 'no rule has been tested yet' : 'refused before any funds moved'}
        />
      </div>

      <div className="db-cols db-cols-wide">
        <div>
          <div className="db-sec-head">
            <div>
              <h2>
                Active mandates
                {app.totals.active > 0 && <span className="db-count">{app.totals.active}</span>}
              </h2>
              {/* Revoked mandates stay in the table below: one can still hold an
                  unspent balance, and reclaiming it is the point of revoking. */}
              <p>Every mandate you hold, its agent, and what is left to spend.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onGo('mandates')}>
              <Plus size={15} />
              New mandate
            </button>
          </div>

          <MandateTable
            app={app}
            mandates={mandates}
            emptyTitle={query.trim() === '' ? 'No mandates yet' : 'No mandates match that search'}
            emptyBody={
              query.trim() === ''
                ? 'A mandate gives one agent bounded spending authority under rules only you can read. Create one to begin.'
                : 'Nothing here matches. Clear the search to see every mandate.'
            }
            emptyAction={
              query.trim() === '' ? (
                <button className="btn btn-primary" onClick={() => onGo('mandates')}>
                  <Plus size={15} />
                  Create a mandate
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                <Pulse size={16} />
                Recent agent activity
              </div>
              <p className="card-sub">Every action an agent proposed, authorized or refused.</p>
            </div>
            {app.activity.length > 0 && <Pill tone="ok">Live</Pill>}
          </div>

          {app.activity.length === 0 ? (
            <p className="hint" style={{ padding: '20px 0' }}>
              Nothing yet. Actions appear here the moment an agent proposes one.
            </p>
          ) : (
            <>
              <div className="feed">
                {app.activity.slice(0, 7).map((entry) => (
                  <FeedItem key={entry.id} entry={entry} label={labelFor(app, entry.mandateId)} />
                ))}
              </div>
              {app.activity.length > 7 && (
                <button
                  className="btn btn-sm btn-block"
                  style={{ marginTop: 16 }}
                  onClick={() => onGo('history')}
                >
                  View full history
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="tile tile-xs">{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The mandate table
// ---------------------------------------------------------------------------

function MandateTable({
  app,
  mandates,
  emptyTitle,
  emptyBody,
  emptyAction,
}: {
  app: App;
  mandates: StoredMandate[];
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
}) {
  if (mandates.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />;
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Mandate name</th>
            <th>Authorized agent</th>
            <th>Status</th>
            <th className="tbl-num">Remaining balance</th>
            <th>Next limit check</th>
            <th className="tbl-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mandates.map((mandate) => (
            <MandateRow key={mandate.id} app={app} mandate={mandate} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type RowPanel = 'fund' | 'revoke' | 'withdraw' | null;

function MandateRow({ app, mandate }: { app: App; mandate: StoredMandate }) {
  const record = app.records[mandate.id];
  const [panel, setPanel] = useState<RowPanel>(null);
  const [topUp, setTopUp] = useState('');
  const [note, setNote] = useState<ActionResult | null>(null);

  if (!record) return null;

  const limit = nextLimitCheck(mandate, record.periodStart);
  // Progress is against the deposit, which is the money actually at stake.
  const used = record.deposited > 0n ? Number((record.spent * 100n) / record.deposited) : 0;
  const toggle = (next: RowPanel) => {
    setNote(null);
    setPanel((current) => (current === next ? null : next));
  };

  return (
    <>
      <tr className={record.revoked ? 'tbl-row tbl-row-off' : 'tbl-row'}>
        <td>
          <div className="tbl-name">{mandate.spec.label}</div>
          <div className="tbl-sub">
            {formatToken(record.spent)} of {formatToken(record.deposited)} released
          </div>
          <div className="meter meter-sm" role="presentation">
            <div className="meter-fill" style={{ width: `${Math.min(100, used)}%` }} />
          </div>
        </td>

        <td data-label="Authorized agent">
          {/* No avatar here: in a six-column table the glyph costs more width
              than it earns, and the key is the identity that matters. */}
          <div className="tbl-key" title={mandate.spec.agentPublicKey}>
            {truncateAddress(mandate.spec.agentPublicKey, 8, 4)}
          </div>
          <div className="tbl-sub">
            {record.actionCount === 0n
              ? 'no actions yet'
              : `${record.actionCount} action${record.actionCount === 1n ? '' : 's'}`}
          </div>
        </td>

        <td data-label="Status">
          {record.revoked ? <Pill tone="bad">Revoked</Pill> : <Pill tone="ok">Active</Pill>}
        </td>

        <td className="tbl-num" data-label="Remaining balance">
          <div className="tbl-amount">{formatAmount(record.escrow)}</div>
          <div className="tbl-sub">{SPEND_TOKEN}</div>
        </td>

        <td data-label="Next limit check">
          <div title={limit.detail}>{limit.value}</div>
          <div className="tbl-sub">
            {mandate.spec.period === 'none'
              ? 'no rolling limit'
              : `${formatAmount(mandate.spec.periodLimit)} ${SPEND_TOKEN} / ${mandate.spec.period}`}
          </div>
        </td>

        <td className="tbl-actions" data-label="Actions">
          <div className="tbl-btns">
            <button
              className="btn btn-xs"
              disabled={record.revoked}
              title={
                record.revoked
                  ? 'A revoked mandate cannot be topped up'
                  : 'Add more funds to this escrow'
              }
              onClick={() => toggle('fund')}
            >
              <Plus size={13} />
              Top up
            </button>
            <button
              className="btn btn-danger btn-xs"
              disabled={record.revoked}
              title="Permanently stop this agent and unlock the balance for reclaim"
              onClick={() => toggle('revoke')}
            >
              <Ban size={13} />
              Revoke
            </button>
            <button
              className="btn btn-primary btn-xs"
              disabled={!record.revoked || record.escrow === 0n}
              title={
                record.revoked
                  ? 'Return the unspent balance to the wallet that funded it'
                  : 'Revoke the mandate before reclaiming'
              }
              onClick={() => toggle('withdraw')}
            >
              <Download size={13} />
              Withdraw
            </button>
          </div>
        </td>
      </tr>

      {(panel !== null || note !== null) && (
        <tr className="tbl-panel-row">
          <td colSpan={6}>
            <div className="tbl-panel">
              {panel === 'fund' && (
                <div className="tbl-panel-body">
                  <Notice tone="info">
                    Topping up widens how much this agent can move, up to the mandate&rsquo;s own
                    total limit of {formatToken(mandate.spec.maxTotalSpend)}. Only you can do it —
                    the contract requires the creator secret.
                  </Notice>
                  <div className="tbl-panel-form">
                    <Field label={`Amount (${SPEND_TOKEN})`}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={topUp}
                        placeholder="0.00"
                        onChange={(event) => setTopUp(event.target.value)}
                      />
                    </Field>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        let amount: bigint;
                        try {
                          amount = parseAmount(topUp);
                        } catch (error) {
                          setNote({ ok: false, message: (error as Error).message });
                          return;
                        }
                        if (amount <= 0n) {
                          setNote({ ok: false, message: 'Enter an amount greater than zero.' });
                          return;
                        }
                        setPanel(null);
                        setTopUp('');
                        void app.fund(mandate.id, amount).then(setNote);
                      }}
                    >
                      Deposit
                    </button>
                    <button className="btn btn-sm" onClick={() => setPanel(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {panel === 'revoke' && (
                <div className="tbl-panel-body">
                  <Notice tone="warn">
                    Revoking is permanent. The agent will be unable to authorize anything further,
                    and the remaining {formatToken(record.escrow)} becomes reclaimable by you.
                  </Notice>
                  <div className="btn-row">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        setPanel(null);
                        void app.revoke(mandate.id).then(setNote);
                      }}
                    >
                      Confirm revoke
                    </button>
                    <button className="btn btn-sm" onClick={() => setPanel(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/*
                The destination is not asked for, because the contract does not
                accept one: the balance always returns to the address that funded
                the mandate. Showing that address is the honest way to confirm.
              */}
              {panel === 'withdraw' && (
                <div className="tbl-panel-body">
                  <Notice tone="info">
                    <div>
                      <strong>{formatToken(record.escrow)}</strong> will be returned to the wallet
                      that funded this mandate:
                      <br />
                      <span className="mono">{truncateAddress(record.creatorAddress, 20, 10)}</span>
                      <br />
                      The withdrawal circuit accepts no other destination, so this cannot be
                      redirected.
                    </div>
                  </Notice>
                  <div className="btn-row">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setPanel(null);
                        void app.withdraw(mandate.id).then(setNote);
                      }}
                    >
                      Confirm withdrawal
                    </button>
                    <button className="btn btn-sm" onClick={() => setPanel(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {note && <Notice tone={note.ok ? 'ok' : 'bad'}>{note.message}</Notice>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// My Mandates
// ---------------------------------------------------------------------------

function MandatesSection({
  app,
  query,
  filter,
  onFilter,
}: {
  app: App;
  query: string;
  filter: Filter;
  onFilter: (filter: Filter) => void;
}) {
  const mandates = useMandateList(app, query, filter);

  return (
    <>
      <PageTitle
        title="My Mandates"
        subtitle="Define the rules, fund the escrow, and see exactly what becomes public."
      />

      <div className="db-tabs">
        {(['all', 'active', 'revoked'] as Filter[]).map((key) => (
          <button
            key={key}
            className={filter === key ? 'db-tab db-tab-on' : 'db-tab'}
            onClick={() => onFilter(key)}
          >
            {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Revoked'}
          </button>
        ))}
      </div>

      <MandateTable
        app={app}
        mandates={mandates}
        emptyTitle={
          filter === 'revoked' ? 'No revoked mandates' : 'No mandates here yet'
        }
        emptyBody={
          filter === 'revoked'
            ? 'Revoked mandates appear here, so their unspent balance can still be reclaimed.'
            : 'A mandate gives one agent bounded spending authority under rules only you can read. Create one below.'
        }
      />

      <div className="db-cols" style={{ marginTop: 26 }}>
        <CreateForm app={app} />
        <MandateDetails app={app} query={query} />
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
        <Field label={`Deposit (${SPEND_TOKEN})`} hint="Public — funds move on a public ledger.">
          <input
            type="text"
            inputMode="decimal"
            value={deposit}
            placeholder="0.00"
            onChange={(e) => setDeposit(e.target.value)}
            required
          />
        </Field>
        <Field label={`Max total spend (${SPEND_TOKEN})`} hint="Private.">
          <input
            type="text"
            inputMode="decimal"
            value={maxTotal}
            placeholder="0.00"
            onChange={(e) => setMaxTotal(e.target.value)}
            required
          />
        </Field>
        <Field label={`Max per transaction (${SPEND_TOKEN})`} hint="Private.">
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
        <Field label={`Rolling limit amount (${SPEND_TOKEN})`} hint="Private.">
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

function MandateDetails({ app, query }: { app: App; query: string }) {
  const mandates = useMandateList(app, query);

  if (mandates.length === 0) {
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

      {mandates.map((mandate) => {
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

function AgentsSection({ app, query }: { app: App; query: string }) {
  const mandates = useMandateList(app, query);
  const [mandateId, setMandateId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [last, setLast] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = app.mandates.find((m) => m.id === mandateId) ?? mandates[0];

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

  return (
    <>
      <PageTitle
        title="Agents"
        subtitle="Each mandate is bound to one agent identity. Only that agent can act under it."
      />

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
                  <span className="tile tile-sm">
                    <Send size={16} />
                  </span>
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
                <select value={selected?.id ?? ''} onChange={(e) => setMandateId(e.target.value)}>
                  {app.mandates.map((mandate) => (
                    <option key={mandate.id} value={mandate.id}>
                      {mandate.spec.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Amount (${SPEND_TOKEN})`}>
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
            {mandates.length === 0 ? (
              <p className="hint" style={{ padding: '16px 0' }}>
                No agent matches that search.
              </p>
            ) : (
              mandates.map((mandate) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

function HistorySection({ app, query }: { app: App; query: string }) {
  const q = query.trim().toLowerCase();
  const entries = app.activity.filter((entry) => {
    if (q === '') return true;
    return (
      labelFor(app, entry.mandateId).toLowerCase().includes(q) ||
      entry.recipient.toLowerCase().includes(q) ||
      (entry.memo ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageTitle
        title="History"
        subtitle="Every action proposed under your mandates, and the rule that decided it."
      />

      {entries.length === 0 ? (
        <EmptyState
          title={q === '' ? 'No activity yet' : 'Nothing matches that search'}
          body={
            q === ''
              ? 'Actions appear here as soon as an agent proposes one — whether it was authorized or refused.'
              : 'Clear the search to see the full history.'
          }
        />
      ) : (
        <div className="card">
          <div className="feed">
            {entries.map((entry) => (
              <div className="feed-item" key={entry.id}>
                <span
                  className={`feed-icon ${entry.outcome === 'executed' ? 'feed-ok' : 'feed-bad'}`}
                >
                  {entry.outcome === 'executed' ? '✓' : '✕'}
                </span>
                <div className="feed-main">
                  <div className="feed-title">
                    <span>{outcomeLabel(entry.outcome)}</span>
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

function DisclosureSection({ app }: { app: App }) {
  const [mandateId, setMandateId] = useState('');
  const [note, setNote] = useState<ActionResult | null>(null);
  const selected = app.mandates.find((m) => m.id === mandateId) ?? app.mandates[0];

  return (
    <>
      <PageTitle
        title="Selective disclosure"
        subtitle="Prove one fact to a third party without opening anything else."
      />

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
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function SettingsSection({ app }: { app: App }) {
  const [copied, setCopied] = useState('');

  const copy = async (value: string, what: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };

  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Where this session is connected, and what it keeps on your device."
      />

      <div className="db-cols">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                <span className="tile tile-sm">
                  <Wallet size={16} />
                </span>
                Connection
              </div>
              <p className="card-sub">
                {SPEND_TOKEN} is the asset a mandate governs; {FEE_TOKEN} pays the transaction fees.
              </p>
            </div>
          </div>

          <dl className="kv">
            <dt>Network</dt>
            <dd>
              {NETWORK_LABEL}
              <div className="hint">
                Pinned in code, not configurable. The app refuses to proceed if the wallet reports
                any other network.
              </div>
            </dd>
            <dt>Registry contract</dt>
            <dd>
              {app.registryAddress ? (
                <span className="db-copy">
                  <span className="mono" title={app.registryAddress}>
                    {truncateAddress(app.registryAddress, 16, 8)}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => void copy(app.registryAddress!, 'registry')}
                  >
                    <Copy size={13} />
                    {copied === 'registry' ? 'Copied' : 'Copy'}
                  </button>
                </span>
              ) : (
                <>
                  not configured
                  <div className="hint">
                    Set NEXT_PUBLIC_CONTRACT_ADDRESS to a deployed registry address.
                  </div>
                </>
              )}
            </dd>
            <dt>Funding wallet</dt>
            <dd>
              {app.fundingAddress ? (
                <span className="db-copy">
                  <span className="mono" title={app.fundingAddress}>
                    {truncateAddress(app.fundingAddress, 16, 8)}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => void copy(app.fundingAddress, 'wallet')}
                  >
                    <Copy size={13} />
                    {copied === 'wallet' ? 'Copied' : 'Copy'}
                  </button>
                </span>
              ) : (
                '—'
              )}
              <div className="hint">
                Every mandate is funded from here, and every reclaim returns here.
              </div>
            </dd>
            <dt>Balances</dt>
            <dd>
              {app.balances ? (
                <>
                  {formatAmount(app.balances.night)} {SPEND_TOKEN} ·{' '}
                  {formatAmount(app.balances.dust)} {FEE_TOKEN}
                </>
              ) : (
                'unavailable'
              )}
            </dd>
          </dl>

          <div className="btn-row" style={{ marginTop: 18 }}>
            <button className="btn btn-sm" onClick={() => void app.refreshBalances()}>
              Refresh balances
            </button>
            <a className="btn btn-sm" href={FAUCET_URL} target="_blank" rel="noreferrer">
              Open the faucet
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                <span className="tile tile-sm">
                  <Shield size={16} />
                </span>
                What stays on this device
              </div>
            </div>
          </div>
          <p className="card-sub" style={{ marginBottom: 14 }}>
            Your mandate rules, the commitment salt, the creator secret and the agent secret are
            held in encrypted local storage under the password you entered. There is no server to
            send them to, and no recovery if the password is lost.
          </p>
          <dl className="kv">
            <dt>Mandates stored</dt>
            <dd>{app.mandates.length}</dd>
            <dt>Disclosures published</dt>
            <dd>{app.disclosures.length}</dd>
            <dt>Actions recorded</dt>
            <dd>{app.activity.length} this session</dd>
          </dl>

          <div style={{ marginTop: 18 }}>
            <Notice tone="warn">
              Losing the private-state password means losing the ability to prove anything about
              your mandates — including the ability to withdraw. Keep it somewhere durable.
            </Notice>
          </div>

          <div className="btn-row" style={{ marginTop: 18 }}>
            <Link href="/#security" className="btn btn-sm">
              How this is secured
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
