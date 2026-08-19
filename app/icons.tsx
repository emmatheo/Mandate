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
  const id = `mg${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="icon">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M16 1.9 28.6 8.9v14.2L16 30.1 3.4 23.1V8.9L16 1.9Z" fill={`url(#${id})`} />
      <path
        d="M10.6 21.4v-10l5.4 4.8 5.4-4.8v10"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.95"
        strokeWidth="2.1"
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

export function Wallet2(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M19 7V6a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20H19a2 2 0 0 0 2-2v-1" />
      <path d="M21 10.5h-4.5a2.25 2.25 0 0 0 0 4.5H21v-4.5Z" />
    </svg>
  );
}

export function Clock(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  );
}

export function Coins(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <ellipse cx="12" cy="6.6" rx="7.2" ry="3.1" />
      <path d="M4.8 6.6v4.4c0 1.7 3.2 3.1 7.2 3.1s7.2-1.4 7.2-3.1V6.6" />
      <path d="M4.8 11v4.4c0 1.7 3.2 3.1 7.2 3.1s7.2-1.4 7.2-3.1V11" />
    </svg>
  );
}

export function Play(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M10.2 8.6 15.6 12l-5.4 3.4V8.6Z" fill="currentColor" />
    </svg>
  );
}

export function Dots(p: P) {
  return (
    <svg {...base(p.size ?? 16)}>
      <circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Alert(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <path d="M12 4.6 2.8 20h18.4L12 4.6Z" />
      <path d="M12 10.4v4" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Search(p: P) {
  return (
    <svg {...base(p.size ?? 16)}>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m15.6 15.6 4.2 4.2" />
    </svg>
  );
}

export function Chevron(p: P) {
  return (
    <svg {...base(p.size ?? 14)}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export function Cog(p: P) {
  return (
    <svg {...base(p.size ?? 17)}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.2 14.4a1.6 1.6 0 0 0 .32 1.76l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.05-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.46V20a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1.04-1.45 1.6 1.6 0 0 0-1.77.32l-.05.06a1.9 1.9 0 1 1-2.7-2.7l.06-.05a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.46-.97H4a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.45-1.04 1.6 1.6 0 0 0-.32-1.77l-.06-.05a1.9 1.9 0 1 1 2.7-2.7l.05.06a1.6 1.6 0 0 0 1.77.32H9.8a1.6 1.6 0 0 0 .97-1.46V4a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 .97 1.46 1.6 1.6 0 0 0 1.77-.32l.05-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.05a1.6 1.6 0 0 0-.32 1.77v.04a1.6 1.6 0 0 0 1.46.97H20a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.46.97Z" />
    </svg>
  );
}

export function Gauge(p: P) {
  return (
    <svg {...base(p.size ?? 20)}>
      <path d="M4.2 17.5a9 9 0 1 1 15.6 0" />
      <path d="M12 12.8 16 8.6" />
      <circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KeyOff(p: P) {
  return (
    <svg {...base(p.size ?? 15)}>
      <circle cx="8.2" cy="15.8" r="3.4" />
      <path d="m10.7 13.3 7.4-7.4" />
      <path d="m15.4 8.6 2 2" />
      <path d="m18 6 2.2 2.2" />
    </svg>
  );
}
