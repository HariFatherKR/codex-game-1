import GameCanvas from '@/components/GameCanvas';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">8-bit Arcade Runner</p>
          <h1>Dubai Cookie Dash</h1>
          <p className="subtitle">
            픽셀 네온 아케이드에서 점프 타이밍을 맞추고 두바이 쫀득쿠키 코인을
            모아보세요.
          </p>
        </div>
      </header>
      <section className="game-section">
        <div className="game-layout">
          <div className="game-stage">
            <div className="letterbox">
              <div className="game-viewport">
                <GameCanvas />
              </div>
            </div>
          </div>
          <aside className="controls-panel">
            <p>Controls</p>
            <ul>
              <li>Space / Tap: Jump</li>
              <li>Enter: Start or Restart</li>
              <li>Tap anywhere to jump.</li>
            </ul>
          </aside>
        </div>
      </section>
      <footer className="footer">
        <p>Next.js App Router + Vercel ready.</p>
      </footer>
    </main>
  );
}
