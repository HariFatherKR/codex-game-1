import GameCanvas from '@/components/GameCanvas';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Next.js Canvas Runner</p>
          <h1>Coin Runner</h1>
          <p className="subtitle">
            Dash forward, time your jumps, and collect coins as the speed ramps up.
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
