import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mandate — private spending authority for AI agents',
  description:
    'Give AI agents real spending power under private, cryptographically enforced rules on Midnight.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
