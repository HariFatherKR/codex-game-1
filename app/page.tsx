import GameCanvas from '@/components/GameCanvas';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">8-bit Arcade Runner</p>
          <h1>Coin Runner</h1>
          <p className="subtitle">
            Dash forward, time your jumps, and snag the Dubai chewy cookie coins as the neon
            arcade lights flash.
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
