import GameCanvas from '@/components/GameCanvas';
import ShareButton from '@/components/ShareButton';

export default function HomePage() {
  return (
    <main className="page">
      <header className="top-bar">
        <div className="brand">
          <p className="eyebrow">8-bit Arcade Runner</p>
          <h1>Dubai Cookie Dash</h1>
        </div>
        <ShareButton />
      </header>
      <p className="subtitle">
        픽셀 네온 아케이드에서 점프 타이밍을 맞추고 두바이 쫀득쿠키 코인을 모아보세요.
      </p>
      <section className="game-stage">
        <GameCanvas />
      </section>
      <section className="bottom-sheet" aria-label="모바일 안내">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-content">
          <p className="sheet-title">Tap to jump. Space to jump. Enter to restart.</p>
          <p className="sheet-text">
            시작 버튼을 눌러 게임을 시작하세요. 화면을 탭하면 점프합니다.
          </p>
        </div>
      </section>
      <footer className="footer">
        <p>Next.js App Router + Vercel ready.</p>
      </footer>
    </main>
  );
}
