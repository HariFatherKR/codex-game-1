import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel'
});

export const metadata: Metadata = {
  title: 'Dubai Cookie Dash',
  description: 'A neon pixel runner built for mobile-first play and sharing.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={pixelFont.variable}>{children}</body>
    </html>
  );
}
