'use client';

import { useEffect, useRef, useState } from 'react';
import {
  COIN_MAX_GAP,
  COIN_MIN_GAP,
  GAME_HEIGHT,
  GAME_WIDTH,
  OBSTACLE_MAX_GAP,
  OBSTACLE_MIN_GAP
} from '@/lib/game/constants';
import {
  checkCoinCollision,
  checkRectCollision,
  createCoin,
  createObstacle,
  createPlayer,
  getGroundY,
  getScoreForCoin,
  increaseSpeed,
  jumpPlayer,
  moveObjects,
  removeOffscreen,
  resetSpeed,
  updatePlayer
} from '@/lib/game/engine';
import type { Coin, GameStatus, Obstacle, Player } from '@/lib/game/types';
import { readHighScore, writeHighScore } from '@/lib/game/storage';

const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const playerRef = useRef<Player | null>(null);
  const coinsRef = useRef<Coin[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastObstacleTypeRef = useRef<Obstacle['type'] | null>(null);
  const speedRef = useRef<number>(resetSpeed());
  const scoreRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('READY');
  const coinTimerRef = useRef<number>(randomRange(COIN_MIN_GAP, COIN_MAX_GAP));
  const obstacleTimerRef = useRef<number>(randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP));
  const hudTimerRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState<number>(Math.round(speedRef.current));
  const [status, setStatus] = useState<GameStatus>('READY');

  const resetGame = (canvas: HTMLCanvasElement) => {
    const groundY = getGroundY(canvas.height);
    playerRef.current = createPlayer(groundY);
    coinsRef.current = [];
    obstaclesRef.current = [];
    lastObstacleTypeRef.current = null;
    speedRef.current = resetSpeed();
    scoreRef.current = 0;
    coinTimerRef.current = randomRange(COIN_MIN_GAP, COIN_MAX_GAP);
    obstacleTimerRef.current = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);
    setScore(0);
    setSpeedDisplay(Math.round(speedRef.current));
  };

  const startGame = () => {
    if (statusRef.current === 'RUNNING') {
      return;
    }
    statusRef.current = 'RUNNING';
    setStatus('RUNNING');
  };

  const restartGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    resetGame(canvas);
    statusRef.current = 'RUNNING';
    setStatus('RUNNING');
  };

  const triggerGameOver = () => {
    statusRef.current = 'GAME_OVER';
    setStatus('GAME_OVER');
    const nextHigh = Math.max(scoreRef.current, highScore);
    if (nextHigh !== highScore) {
      setHighScore(nextHigh);
      writeHighScore(nextHigh);
    }
  };

  const handleJump = () => {
    if (statusRef.current === 'READY') {
      startGame();
    }
    if (statusRef.current === 'GAME_OVER') {
      restartGame();
    }
    if (statusRef.current !== 'RUNNING') {
      return;
    }
    const player = playerRef.current;
    if (!player) {
      return;
    }
    jumpPlayer(player);
  };

  useEffect(() => {
    setHighScore(readHighScore());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      if (!playerRef.current) {
        resetGame(canvas);
      } else {
        const groundY = getGroundY(canvas.height);
        playerRef.current.y = groundY - playerRef.current.height;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleJump();
      }
      if (event.code === 'Enter') {
        if (statusRef.current === 'GAME_OVER') {
          restartGame();
        } else if (statusRef.current !== 'RUNNING') {
          startGame();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (statusRef.current === 'RUNNING' && playerRef.current) {
        const player = playerRef.current;
        const groundY = getGroundY(canvas.height);
        updatePlayer(player, delta, groundY);

        speedRef.current = increaseSpeed(speedRef.current, delta);
        coinTimerRef.current -= delta;
        obstacleTimerRef.current -= delta;

        if (coinTimerRef.current <= 0) {
          coinsRef.current.push(createCoin(canvas.width, groundY));
          coinTimerRef.current = randomRange(COIN_MIN_GAP, COIN_MAX_GAP);
        }
        if (obstacleTimerRef.current <= 0) {
          const lastType = lastObstacleTypeRef.current ?? undefined;
          const nextObstacle = createObstacle(canvas.width, groundY, lastType);
          obstaclesRef.current.push(nextObstacle);
          lastObstacleTypeRef.current = nextObstacle.type;
          const minGap = Math.max(0.9, OBSTACLE_MIN_GAP - speedRef.current * 0.02);
          const maxGap = Math.max(1.4, OBSTACLE_MAX_GAP - speedRef.current * 0.02);
          obstacleTimerRef.current = randomRange(minGap, maxGap);
        }

        moveObjects(coinsRef.current, speedRef.current, delta);
        moveObjects(obstaclesRef.current, speedRef.current, delta);

        coinsRef.current = removeOffscreen(coinsRef.current, -100);
        obstaclesRef.current = removeOffscreen(obstaclesRef.current, -120);

        coinsRef.current.forEach((coin) => {
          if (!coin.collected && checkCoinCollision(player, coin)) {
            coin.collected = true;
            scoreRef.current += getScoreForCoin();
            setScore(scoreRef.current);
          }
        });

        obstaclesRef.current.forEach((obstacle) => {
          if (
            checkRectCollision(player, {
              x: obstacle.x,
              y: obstacle.y,
              width: obstacle.width,
              height: obstacle.height
            })
          ) {
            triggerGameOver();
          }
        });
      }

      const render = (renderTime: number) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const groundY = getGroundY(canvas.height);
        context.imageSmoothingEnabled = false;

        drawBackground(context, canvas.width, canvas.height, renderTime);
        drawGround(context, canvas.width, canvas.height, renderTime, groundY);

        const player = playerRef.current;
        if (player) {
          drawPlayer(context, player, statusRef.current, renderTime);
        }

        coinsRef.current.forEach((coin) => {
          if (coin.collected) {
            return;
          }
          drawCookieCoin(context, coin, renderTime);
        });

        obstaclesRef.current.forEach((obstacle) => {
          drawObstacle(context, obstacle);
        });

        drawScanlines(context, canvas.width, canvas.height);

        if (statusRef.current === 'READY') {
          drawOverlay('Tap / Space to Start', canvas, context);
        }
        if (statusRef.current === 'GAME_OVER') {
          drawOverlay('Game Over', canvas, context);
        }
      };

      render(timestamp);

      hudTimerRef.current += delta;
      if (hudTimerRef.current >= 0.2) {
        setSpeedDisplay(Math.round(speedRef.current));
        hudTimerRef.current = 0;
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', onKeyDown);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [highScore]);

  return (
    <div
      className="game-shell"
      role="button"
      tabIndex={0}
      onPointerDown={handleJump}
      onKeyDown={(event) => {
        if (event.key === ' ') {
          event.preventDefault();
          handleJump();
        }
      }}
    >
      <div className="hud">
        <div className="hud-block">
          <span className="hud-label">Score</span>
          <span className="hud-value">{score}</span>
        </div>
        <div className="hud-block">
          <span className="hud-label">High</span>
          <span className="hud-value">{highScore}</span>
        </div>
        <div className="hud-block">
          <span className="hud-label">Speed</span>
          <span className="hud-value">{speedDisplay}</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="game-canvas" width={GAME_WIDTH} height={GAME_HEIGHT} />
      {status === 'GAME_OVER' ? (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Game Over</h2>
            <p>Score: {score}</p>
            <p>High Score: {highScore}</p>
            <button type="button" onClick={restartGame}>
              Restart
            </button>
            <span className="hint">Press Enter or tap to restart</span>
          </div>
        </div>
      ) : null}
      {status === 'READY' ? (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Cookie Dash</h2>
            <p>Tap or press Space to jump.</p>
            <button type="button" onClick={startGame}>
              Start
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const drawOverlay = (
  message: string,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
) => {
  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#f8f9fa';
  context.font = '16px "Press Start 2P", "VT323", monospace';
  context.textAlign = 'center';
  context.fillText(message, canvas.width / 2, canvas.height / 2);
};

const drawBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) => {
  context.fillStyle = '#0b0721';
  context.fillRect(0, 0, width, height);

  const neonOffset = (time * 0.02) % 120;
  const bandColors = ['#32155f', '#1b1f5e', '#2a0f3f'];
  bandColors.forEach((color, index) => {
    context.fillStyle = color;
    const bandHeight = 42 + index * 18;
    const y = 40 + index * 58 + (neonOffset / 6);
    context.fillRect(0, y, width, bandHeight);
  });

  const signOffset = (time * 0.03) % 80;
  context.fillStyle = '#5ef0ff';
  context.fillRect(40 + signOffset, 84, 72, 16);
  context.fillStyle = '#ff77e9';
  context.fillRect(width - 160 - signOffset, 120, 96, 18);
  context.fillStyle = '#ffc857';
  context.fillRect(width / 2 - 48, 64, 96, 14);
};

const drawGround = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  groundY: number
) => {
  const tileSize = 16;
  const offset = Math.floor((time * 0.06) % tileSize);
  context.fillStyle = '#140d2d';
  context.fillRect(0, groundY, width, height - groundY);

  for (let x = -offset; x < width + tileSize; x += tileSize) {
    context.fillStyle = (x / tileSize) % 2 === 0 ? '#1f1642' : '#251b4d';
    context.fillRect(x, groundY, tileSize, tileSize);
    context.fillStyle = '#2f2463';
    context.fillRect(x + 2, groundY + 2, tileSize - 4, tileSize - 4);
  }

  context.fillStyle = '#6bf6ff';
  context.fillRect(0, groundY - 3, width, 3);
};

const drawPlayer = (
  context: CanvasRenderingContext2D,
  player: Player,
  status: GameStatus,
  time: number
) => {
  const frame = Math.floor(time / 120) % 4;
  const isJumping = !player.isGrounded;
  const isHit = status === 'GAME_OVER';
  const baseX = Math.round(player.x);
  const baseY = Math.round(player.y);

  const skin = '#f6c7a6';
  const hair = '#2a1b1d';
  const jacket = '#3b6cff';
  const pants = '#2f2a6d';
  const outline = '#1a0f2a';

  context.fillStyle = outline;
  context.fillRect(baseX, baseY, player.width, player.height);

  context.fillStyle = '#3b2b33';
  context.fillRect(baseX + 2, baseY + 2, player.width - 4, player.height - 4);

  context.fillStyle = skin;
  context.fillRect(baseX + 14, baseY + 8, 20, 18);
  context.fillStyle = hair;
  context.fillRect(baseX + 12, baseY + 4, 24, 8);

  context.fillStyle = jacket;
  context.fillRect(baseX + 10, baseY + 26, 28, 14);
  context.fillStyle = pants;
  context.fillRect(baseX + 12, baseY + 38, 12, 8);
  context.fillRect(baseX + 24, baseY + 38, 12, 8);

  context.fillStyle = skin;
  context.fillRect(baseX + 6, baseY + 28, 8, 8);
  context.fillRect(baseX + 34, baseY + 28, 8, 8);

  if (isHit) {
    context.fillStyle = '#ff4f6d';
    context.fillRect(baseX + 18, baseY + 14, 12, 4);
    context.fillStyle = '#ffe3f1';
    context.fillRect(baseX + 20, baseY + 20, 8, 3);
    return;
  }

  if (isJumping) {
    context.fillStyle = '#ffe8d1';
    context.fillRect(baseX + 18, baseY + 14, 4, 4);
    context.fillRect(baseX + 26, baseY + 14, 4, 4);
    context.fillStyle = '#f2b5c4';
    context.fillRect(baseX + 20, baseY + 22, 8, 4);
    return;
  }

  const legOffset = frame % 2 === 0 ? 0 : 2;
  context.fillStyle = '#1b1030';
  context.fillRect(baseX + 12, baseY + 44, 8, 4);
  context.fillRect(baseX + 28, baseY + 44 + legOffset, 8, 4);
  context.fillRect(baseX + 18, baseY + 44 + legOffset, 8, 4);
};

const drawCookieCoin = (context: CanvasRenderingContext2D, coin: Coin, time: number) => {
  const size = coin.radius * 2;
  const x = Math.round(coin.x - coin.radius);
  const y = Math.round(coin.y - coin.radius);
  const sparkleFrame = Math.floor(time / 180) % 2;

  context.fillStyle = '#4b2a17';
  context.fillRect(x, y, size, size);

  context.fillStyle = '#7b3f1d';
  context.fillRect(x + 2, y + 2, size - 4, size - 4);

  context.fillStyle = '#6fd06f';
  context.fillRect(x + 4, y + 6, 4, 4);
  context.fillRect(x + 10, y + 8, 4, 4);
  context.fillRect(x + 6, y + 12, 4, 4);

  context.fillStyle = '#d8a76b';
  context.fillRect(x + 2, y + size - 6, size - 4, 2);

  if (sparkleFrame === 1) {
    context.fillStyle = '#fff3b0';
    context.fillRect(x + size - 6, y + 2, 2, 6);
    context.fillRect(x + size - 8, y + 4, 6, 2);
  }
};

const drawObstacle = (context: CanvasRenderingContext2D, obstacle: Obstacle) => {
  const baseX = Math.round(obstacle.x);
  const baseY = Math.round(obstacle.y);
  context.fillStyle = '#0f0b1f';
  context.fillRect(baseX - 2, baseY + obstacle.height - 4, obstacle.width + 4, 6);

  if (obstacle.type === 'BIKE') {
    context.fillStyle = '#ffb347';
    context.fillRect(baseX + 6, baseY + 4, 20, 6);
    context.fillStyle = '#3b2a48';
    context.fillRect(baseX + 12, baseY + 2, 8, 12);
    context.fillStyle = '#1a0f2a';
    context.fillRect(baseX + 4, baseY + 12, 8, 8);
    context.fillRect(baseX + 20, baseY + 12, 8, 8);
    context.fillStyle = '#6bf6ff';
    context.fillRect(baseX + 6, baseY + 14, 4, 4);
    context.fillRect(baseX + 22, baseY + 14, 4, 4);
    return;
  }

  if (obstacle.type === 'SCOOTER') {
    context.fillStyle = '#52b788';
    context.fillRect(baseX + 4, baseY + 8, 20, 6);
    context.fillStyle = '#2d6a4f';
    context.fillRect(baseX + 14, baseY + 2, 4, 10);
    context.fillStyle = '#1a0f2a';
    context.fillRect(baseX + 2, baseY + 14, 6, 6);
    context.fillRect(baseX + 20, baseY + 14, 6, 6);
    context.fillStyle = '#d0f4ff';
    context.fillRect(baseX + 4, baseY + 16, 2, 2);
    context.fillRect(baseX + 22, baseY + 16, 2, 2);
    return;
  }

  context.fillStyle = '#ff6b6b';
  context.fillRect(baseX + 2, baseY + 4, obstacle.width - 4, obstacle.height - 8);
  context.fillStyle = '#8ecae6';
  context.fillRect(baseX + 6, baseY + 6, 14, 8);
  context.fillStyle = '#1d3557';
  context.fillRect(baseX + 24, baseY + 6, 12, 8);
  context.fillStyle = '#1a0f2a';
  context.fillRect(baseX + 6, baseY + obstacle.height - 6, 10, 6);
  context.fillRect(baseX + obstacle.width - 16, baseY + obstacle.height - 6, 10, 6);
  context.fillStyle = '#ffd166';
  context.fillRect(baseX + obstacle.width - 6, baseY + 10, 4, 4);
};

const drawScanlines = (context: CanvasRenderingContext2D, width: number, height: number) => {
  context.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < height; y += 4) {
    context.fillRect(0, y, width, 1);
  }
};
