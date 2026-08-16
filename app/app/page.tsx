'use client';

import dynamic from 'next/dynamic';

/**
 * The dashboard is browser-only and must never be server-rendered.
 *
 * It reaches the chain through the wallet connector, the indexer client and an
 * encrypted local private-state store — all of which depend on browser APIs or
 * on native modules that do not exist in a prerender. Loading it with
 * `ssr: false` keeps the build static while the page itself stays fully client
 * side, which is also what keeps mandate rules off any server.
 */
const Dashboard = dynamic(() => import('./dashboard').then((m) => m.Dashboard), {
  ssr: false,
  loading: () => (
    <div className="gate">
      <div className="gate-inner" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Mandate…
      </div>
    </div>
  ),
});

export default function AppPage() {
  return <Dashboard />;
}
