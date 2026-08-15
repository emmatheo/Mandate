'use client';

/** Presentational building blocks for the Mandate dashboard. */

import type { PreCheckResult, RuleCheck } from '../lib/types';

export function Pill({
  tone,
  children,
}: {
  tone: 'ok' | 'bad' | 'warn' | 'muted';
  children: React.ReactNode;
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Stat({
  label,
  value,
  meter,
}: {
  label: string;
  value: string;
  meter?: { used: bigint; total: bigint };
}) {
  const pct =
    meter && meter.total > 0n
      ? Math.min(100, Number((meter.used * 100n) / meter.total))
      : undefined;
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {pct !== undefined && (
        <div className="meter">
          <div className="meter-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'bad';
  children: React.ReactNode;
}) {
  return <div className={`banner banner-${tone}`}>{children}</div>;
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

/**
 * The authorization verdict, rule by rule.
 *
 * Showing every rule rather than only the failure is deliberate: the point of
 * the product is that authority is bounded and legible, and a user should be
 * able to see the whole envelope their agent is operating inside.
 */
export function RuleReport({ result }: { result: PreCheckResult }) {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
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
      <span className="rule-mark" style={{ color: check.passed ? 'var(--ok)' : 'var(--bad)' }}>
        {check.passed ? '✓' : '✕'}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ color: check.passed ? 'var(--text-muted)' : 'var(--text)' }}>
          {check.label}
        </span>
        {!check.passed && check.detail && (
          <div style={{ color: 'var(--bad)', marginTop: 2 }}>{check.detail}</div>
        )}
      </span>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** A hash rendered so it is recognisable without dominating the layout. */
export function Hash({ value, chars = 10 }: { value: string; chars?: number }) {
  return (
    <span className="mono" title={value}>
      {value.slice(0, chars)}…{value.slice(-4)}
    </span>
  );
}
