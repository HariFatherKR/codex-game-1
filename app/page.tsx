import GameCanvas from '@/components/GameCanvas';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">8-Bit Arcade Runner</p>
          <h1>Cookie Dash</h1>
          <p className="subtitle">
            Neon arcade vibes, chibi hero sprites, and Dubai cookie coins in pixel glory.
          </p>
        </div>
        <div className="hero-card">
          <p>Controls</p>
          <ul>
            <li>Space / Tap: Jump</li>
            <li>Enter: Start or Restart</li>
          </ul>
        </div>
      </header>
      <section className="game-section">
        <GameCanvas />
      </section>
      <footer className="footer">
        <p>Built for Vercel deployment with Next.js App Router.</p>
      </footer>
    </main>
  );
}
