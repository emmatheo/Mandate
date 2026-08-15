/**
 * Inline icon set.
 *
 * Kept local rather than pulled from an icon package: the app ships under a
 * strict no-external-request posture, and a handful of paths is cheaper than a
 * dependency.
 */

type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'icon',
  'aria-hidden': true,
});

export function Logo({ size = 30 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="icon">
      <path
        d="M16 2.6 27.5 9v14L16 29.4 4.5 23V9L16 2.6Z"
        fill="none"
        stroke="var(--green)"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M11 20.5v-9l5 4.4 5-4.4v9"
        fill="none"
        stroke="var(--green)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Grid(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function Shield(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <path d="M12 3 5 6v5.5c0 4.4 2.9 8.3 7 9.5 4.1-1.2 7-5.1 7-9.5V6l-7-3Z" />
    </svg>
  );
}

export function Users(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
      <path d="M16.5 3.9a4 4 0 0 1 0 7.2" />
    </svg>
  );
}

export function Pulse(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <path d="M2 12h4l3-8 5 16 3-8h5" />
    </svg>
  );
}

export function Eye(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function Lock(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3" />
    </svg>
  );
}

export function Link(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7" />
    </svg>
  );
}

export function Download(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M12 4v10.5" />
      <path d="m7.5 11 4.5 4 4.5-4" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

export function Ban(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="m6.1 6.1 11.8 11.8" />
    </svg>
  );
}

export function Copy(p: P) {
  return (
    <svg {...base(p.size ?? 14)}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9" />
    </svg>
  );
}

export function Wallet(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <rect x="3" y="6" width="18" height="13" rx="2.4" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Refresh(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M20 11a8 8 0 0 0-13.7-5.1L3 9" />
      <path d="M3 4.5V9h4.5" />
      <path d="M4 13a8 8 0 0 0 13.7 5.1L21 15" />
      <path d="M21 19.5V15h-4.5" />
    </svg>
  );
}

export function Check(p: P) {
  return (
    <svg {...base(p.size ?? 13)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function X(p: P) {
  return (
    <svg {...base(p.size ?? 13)}>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M17.5 6.5 6.5 17.5" />
    </svg>
  );
}

export function Info(p: P) {
  return (
    <svg {...base(p.size ?? 13)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Plus(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </svg>
  );
}

export function Arrow(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M4.5 12h14" />
      <path d="m13 6.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}

export function Send(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />
    </svg>
  );
}
