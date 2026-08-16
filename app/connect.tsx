'use client';

/**
 * The gate in front of the dashboard.
 *
 * Nothing in the app can do anything meaningful without a wallet, so rather
 * than render an empty dashboard and fail on the first click, the connection
 * state is made the first thing a user deals with.
 */

import { useState } from 'react';

import {
  FAUCET_URL,
  FEE_TOKEN,
  NETWORK_LABEL,
  SPEND_TOKEN,
} from '../lib/network';
import { Field, Notice } from './components';
import { Arrow, Lock, Logo, Shield } from './icons';
import type { useSession } from './session';

type Session = ReturnType<typeof useSession>;

export function ConnectGate({ session }: { session: Session }) {
  const [password, setPassword] = useState('');
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const tooShort = password.length > 0 && password.length < 16;
  const canConnect = password.length >= 16 && session.status !== 'connecting';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    await session.connect(password);
  }

  return (
    <div className="gate">
      <div className="gate-inner">
        <div className="gate-brand">
          <Logo size={40} />
          <div>
            <div className="gate-title">Mandate</div>
            <div className="gate-sub">Private spending authority on {NETWORK_LABEL}</div>
          </div>
        </div>

        <form className="card" onSubmit={submit}>
          <div className="card-head">
            <div>
              <div className="card-title">
                <span className="tile tile-sm">
                  <Lock size={16} />
                </span>
                Connect your wallet
              </div>
              <p className="card-sub">
                Mandate settles on {NETWORK_LABEL}. Your wallet signs every transaction and
                generates every proof locally — this app never sees your keys or your rules.
              </p>
            </div>
          </div>

          <Field
            label="Private-state password"
            hint="Encrypts your mandate rules and the secrets that authorize revoke and withdraw. At least 16 characters. It is never sent anywhere and cannot be recovered — store it somewhere safe."
          >
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              placeholder="At least 16 characters"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {tooShort && (
            <div style={{ marginTop: 14 }}>
              <Notice tone="warn">
                That is {password.length} characters. The private-state store requires at least 16.
              </Notice>
            </div>
          )}

          {attempted && session.error && (
            <div style={{ marginTop: 14 }}>
              <Notice tone="bad">{session.error}</Notice>
            </div>
          )}

          <div className="btn-row" style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={!canConnect}>
              {session.status === 'connecting'
                ? (session.busyLabel ?? 'Connecting…')
                : 'Connect Lace wallet'}
              {session.status !== 'connecting' && <Arrow size={16} />}
            </button>
          </div>

          <div className="divider" />

          <p className="hint">
            You will need the <strong>Lace Midnight Preview</strong> extension, switched to{' '}
            <strong>{NETWORK_LABEL}</strong>, holding {SPEND_TOKEN} to fund mandates and{' '}
            {FEE_TOKEN} to pay fees.{' '}
            <a href={FAUCET_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--violet)' }}>
              Get test tokens from the faucet
            </a>
            .
          </p>
        </form>

        {/*
          Demo mode runs the same compiled circuits against an in-memory ledger.
          It is deliberately behind a confirmation: someone who wandered into it
          by accident would believe they were moving funds when they were not.
        */}
        <div className="gate-demo">
          {!showDemoConfirm ? (
            <button className="btn btn-sm" onClick={() => setShowDemoConfirm(true)}>
              No wallet? Explore in demo mode
            </button>
          ) : (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 10 }}>
                <span className="tile tile-sm">
                  <Shield size={16} />
                </span>
                Demo mode moves no money
              </div>
              <p className="card-sub" style={{ marginBottom: 16 }}>
                The circuits are the real compiled ones, so every authorization and refusal is a
                genuine zero-knowledge outcome. But there is no chain, no wallet and no{' '}
                {SPEND_TOKEN} — the ledger lives in this tab and disappears when you reload.
                Nothing you do here settles anywhere.
              </p>
              <div className="btn-row">
                <button className="btn" onClick={() => session.setMode('demo')}>
                  Continue in demo mode
                </button>
                <button className="btn btn-sm" onClick={() => setShowDemoConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
