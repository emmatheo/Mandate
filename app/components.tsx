'use client';

/** Presentational building blocks shared across the dashboard. */

import { Check, Info, X } from './icons';
import type { ActivityEntry, PreCheckResult, RuleCheck } from '../lib/types';
import { formatToken, truncateAddress } from '../lib/encoding';

export function Pill({
  tone,
  children,
}: {
  tone: 'ok' | 'bad' | 'warn' | 'muted';
  children: React.ReactNode;
}) {
  return (
    <span className={`pill pill-${tone}`}>
      {(tone === 'ok' || tone === 'bad') && <span className="dot" />}
      {children}
    </span>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'ok' | 'warn' | 'bad';
  children: React.ReactNode;
}) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

/** A hash, recognisable without dominating the layout. */
export function Hash({ value, chars = 10 }: { value: string; chars?: number }) {
  return (
    <span className="mono" title={value}>
      {value.slice(0, chars)}…{value.slice(-4)}
    </span>
  );
}

/**
 * The authorization verdict, rule by rule.
 *
 * Every rule is listed, not only the one that failed: the product's claim is
 * that an agent's authority is bounded and legible, so the whole envelope is
 * worth showing.
 */
export function RuleReport({ result }: { result: PreCheckResult }) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        {result.authorized ? (
          <Pill tone="ok">Authorized — every rule satisfied</Pill>
        ) : (
          <Pill tone="bad">Refused — {result.violation?.label}</Pill>
        )}
      </div>
      {result.checks.map((check) => (
        <RuleRow key={check.rule} check={check} />
      ))}
    </div>
  );
}

function RuleRow({ check }: { check: RuleCheck }) {
  return (
    <div className="rule-row">
      <span className="rule-mark" style={{ color: check.passed ? 'var(--green)' : 'var(--red)' }}>
        {check.passed ? '✓' : '✕'}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ color: check.passed ? 'var(--text-muted)' : 'var(--text)' }}>
          {check.label}
        </span>
        {!check.passed && check.detail && (
          <div style={{ color: 'var(--red)', marginTop: 2 }}>{check.detail}</div>
        )}
      </span>
    </div>
  );
}

/** One row of the agent activity feed. */
export function FeedItem({ entry, label }: { entry: ActivityEntry; label: string }) {
  const executed = entry.outcome === 'executed';
  return (
    <div className="feed-item">
      <span className={`feed-icon ${executed ? 'feed-ok' : 'feed-bad'}`}>
        {executed ? <Check size={12} /> : <X size={12} />}
      </span>
      <div className="feed-main">
        <div className="feed-title">
          <span>{executed ? 'Payment executed' : 'Payment refused'}</span>
          <span className="feed-time">{relativeTime(entry.at)}</span>
        </div>
        <div className="feed-meta">
          {label} · {truncateAddress(entry.recipient, 8, 4)}
        </div>
        {/* A refused payment moved nothing, so it carries no minus sign. */}
        <div className={`feed-amount ${executed ? 'feed-amount-ok' : 'feed-amount-bad'}`}>
          {executed ? '−' : ''}
          {formatToken(entry.amount)}
          {!executed && ' · blocked'}
        </div>
        {!executed && (
          <div className="feed-meta" style={{ color: 'var(--red)' }}>
            {entry.message}
          </div>
        )}
      </div>
    </div>
  );
}

/** A published disclosure, as a third party would see it. */
export function DisclosureItem({
  title,
  detail,
}: {
  title: string;
  detail: React.ReactNode;
}) {
  return (
    <div className="feed-item">
      <span className="feed-icon feed-info">
        <Info size={12} />
      </span>
      <div className="feed-main">
        <div className="feed-title">
          <span>{title}</span>
        </div>
        <div className="feed-meta">{detail}</div>
      </div>
    </div>
  );
}

export function relativeTime(seconds: number): string {
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (delta < 60) return 'just now';
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86_400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86_400)}d ago`;
}
