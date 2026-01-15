import type { Metadata } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css';

const pressStart = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display'
});

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Cookie Dash',
  description: 'An 8-bit arcade runner built with Next.js for Vercel deployment.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${pressStart.variable} ${vt323.variable}`}>{children}</body>
    </html>
  );
}
