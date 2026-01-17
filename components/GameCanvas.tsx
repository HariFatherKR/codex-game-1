'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, SyntheticEvent } from 'react';
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
  const speedRef = useRef<number>(resetSpeed());
  const scoreRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('READY');
  const coinTimerRef = useRef<number>(randomRange(COIN_MIN_GAP, COIN_MAX_GAP));
  const obstacleTimerRef = useRef<number>(randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP));
  const hudTimerRef = useRef<number>(0);
  const lastObstacleTypeRef = useRef<Obstacle['type'] | null>(null);
  const backgroundOffsetRef = useRef<number>(0);
  const animationTimeRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState<number>(Math.round(speedRef.current));
  const [status, setStatus] = useState<GameStatus>('READY');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const shareTimeoutRef = useRef<number | null>(null);

  const resetGame = (canvas: HTMLCanvasElement) => {
    const groundY = getGroundY(canvas.height);
    playerRef.current = createPlayer(groundY);
    coinsRef.current = [];
    obstaclesRef.current = [];
    speedRef.current = resetSpeed();
    scoreRef.current = 0;
    coinTimerRef.current = randomRange(COIN_MIN_GAP, COIN_MAX_GAP);
    obstacleTimerRef.current = randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);
    lastObstacleTypeRef.current = null;
    backgroundOffsetRef.current = 0;
    animationTimeRef.current = 0;
    setScore(0);
    setSpeedDisplay(Math.round(speedRef.current));
  };

  const startGame = () => {
    if (statusRef.current === 'RUNNING') {
      return;
    }
    if (isPaused) {
      setIsPaused(false);
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
    setIsPaused(false);
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
    if (isPaused) {
      return;
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
    return () => {
      if (shareTimeoutRef.current) {
        window.clearTimeout(shareTimeoutRef.current);
      }
    };
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
      if (event.code === 'KeyP') {
        event.preventDefault();
        if (statusRef.current === 'RUNNING') {
          setIsPaused((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (statusRef.current === 'RUNNING' && !isPaused && playerRef.current) {
        const player = playerRef.current;
        const groundY = getGroundY(canvas.height);
        updatePlayer(player, delta, groundY);

        speedRef.current = increaseSpeed(speedRef.current, delta);
        animationTimeRef.current += delta;
        backgroundOffsetRef.current += speedRef.current * delta * 24;
        coinTimerRef.current -= delta;
        obstacleTimerRef.current -= delta;

        if (coinTimerRef.current <= 0) {
          coinsRef.current.push(createCoin(canvas.width, groundY));
          coinTimerRef.current = randomRange(COIN_MIN_GAP, COIN_MAX_GAP);
        }
        if (obstacleTimerRef.current <= 0) {
          const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
          const minDistance = 180;
          if (!lastObstacle || lastObstacle.x < canvas.width - minDistance) {
            const nextObstacle = createObstacle(
              canvas.width,
              groundY,
              lastObstacleTypeRef.current
            );
            obstaclesRef.current.push(nextObstacle);
            lastObstacleTypeRef.current = nextObstacle.type;
          }
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

      const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const groundY = getGroundY(canvas.height);

        context.imageSmoothingEnabled = false;
        drawBackground(context, canvas.width, canvas.height, groundY, backgroundOffsetRef.current);

        const player = playerRef.current;
        if (player) {
          const playerState =
            statusRef.current === 'GAME_OVER'
              ? 'HIT'
              : player.isGrounded
                ? 'RUN'
                : 'JUMP';
          drawPlayer(context, player, playerState, animationTimeRef.current);
        }

        coinsRef.current.forEach((coin) => {
          if (coin.collected) {
            return;
          }
          drawCookieCoin(context, coin, animationTimeRef.current);
        });

        obstaclesRef.current.forEach((obstacle) => {
          drawObstacle(context, obstacle);
        });

        if (statusRef.current === 'READY') {
          drawOverlay('Tap to Jump', canvas, context);
        }
        if (statusRef.current === 'GAME_OVER') {
          drawOverlay('Game Over', canvas, context);
        }

        drawScanlines(context, canvas.width, canvas.height);
      };

      render();

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
  }, [highScore, isPaused]);

  const togglePause = (event?: SyntheticEvent) => {
    event?.stopPropagation();
    if (statusRef.current !== 'RUNNING') {
      return;
    }
    setIsPaused((prev) => !prev);
  };

  const toggleMute = (event?: SyntheticEvent) => {
    event?.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  const handleShare = async (event?: SyntheticEvent) => {
    event?.stopPropagation();
    const shareData = {
      title: 'Dubai Cookie Dash',
      text: '내 점수 이겼으면 인증해 😎 Dubai Cookie Dash',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        return;
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setShareState('copied');
      if (shareTimeoutRef.current) {
        window.clearTimeout(shareTimeoutRef.current);
      }
      shareTimeoutRef.current = window.setTimeout(() => {
        setShareState('idle');
      }, 1600);
    } catch (error) {
      setShareState('idle');
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('button')) {
      return;
    }
    if (isPaused && statusRef.current === 'RUNNING') {
      togglePause();
      return;
    }
    handleJump();
  };

  return (
    <div
      className="game-shell"
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
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
      <div className="hud-actions">
        <button type="button" className="hud-button" onClick={handleShare}>
          {shareState === 'copied' ? 'Copied!' : 'Share'}
        </button>
        <button type="button" className="hud-button" onClick={toggleMute}>
          {isMuted ? 'Sound Off' : 'Sound On'}
        </button>
        <button type="button" className="hud-button" onClick={togglePause}>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
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
            <h2>Dubai Cookie Dash</h2>
            <p className="overlay-instruction">Tap to Jump</p>
            <button type="button" onClick={startGame}>
              Start
            </button>
          </div>
        </div>
      ) : null}
      {isPaused && status === 'RUNNING' ? (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Paused</h2>
            <p>Tap to resume or press P.</p>
            <button type="button" onClick={togglePause}>
              Resume
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
  context.font = '700 24px "Press Start 2P", system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(message, canvas.width / 2, canvas.height / 2);
};

type Sprite = string[];

const PALETTE = {
  outline: '#0a0f1e',
  skin: '#f6c79f',
  hair: '#2b2b2b',
  shirt: '#4cc9f0',
  pants: '#4361ee',
  boots: '#111827',
  cookie: '#4b2d19',
  cookieShadow: '#2a160d',
  pistachio: '#74c69d',
  pistachioDark: '#40916c',
  highlight: '#fef9c3',
  chrome: '#00f5d4',
  neon: '#f72585'
};

const PLAYER_RUN_FRAMES: Sprite[] = [
  [
    '....OOOO....',
    '...OHHHHO...',
    '..OHSSSHO...',
    '..OHSTTTHO..',
    '..OHSTTTHO..',
    '..OOSTTTOO..',
    '..OOPPPPOO..',
    '..OPPPPPPO..',
    '...OPPPO...',
    '..OOP.OOO...',
    '..OO...OO...',
    '...B...B....'
  ],
  [
    '....OOOO....',
    '...OHHHHO...',
    '..OHSSSHO...',
    '..OHSTTTHO..',
    '..OHSTTTHO..',
    '..OOSTTTOO..',
    '..OOPPPPOO..',
    '..OPPPPPPO..',
    '...OPPPO...',
    '...OO.OOO...',
    '..OO...OO...',
    '..B.....B...'
  ],
  [
    '....OOOO....',
    '...OHHHHO...',
    '..OHSSSHO...',
    '..OHSTTTHO..',
    '..OHSTTTHO..',
    '..OOSTTTOO..',
    '..OOPPPPOO..',
    '..OPPPPPPO..',
    '....PPPO....',
    '...OO.OO....',
    '..OO...OO...',
    '..B.....B...'
  ],
  [
    '....OOOO....',
    '...OHHHHO...',
    '..OHSSSHO...',
    '..OHSTTTHO..',
    '..OHSTTTHO..',
    '..OOSTTTOO..',
    '..OOPPPPOO..',
    '..OPPPPPPO..',
    '...OPPPO...',
    '..OO.OOO....',
    '..OO...OO...',
    '...B...B....'
  ]
];

const PLAYER_JUMP: Sprite = [
  '....OOOO....',
  '...OHHHHO...',
  '..OHSSSHO...',
  '..OHSTTTHO..',
  '..OHSTTTHO..',
  '..OOSTTTOO..',
  '..OOPPPPOO..',
  '..OPPPPPPO..',
  '...OPPPPO...',
  '...OO..OO...',
  '..OO....OO..',
  '..B.....B...'
];

const PLAYER_HIT: Sprite = [
  '....OOOO....',
  '...OHHHHO...',
  '..OHSXSHO...',
  '..OHSTTTHO..',
  '..OHSTTTHO..',
  '..OOSTTTOO..',
  '..OOPPPPOO..',
  '..OPPPPPPO..',
  '...OPPPPO...',
  '..OO..OO....',
  '.OO....OO...',
  'B.......B...'
];

const COOKIE_SPRITE: Sprite = [
  '..cccccccc..',
  '.cccchhhhcc.',
  '.ccchpphccc.',
  'cchpppphhcc.',
  'cchpppphhcc.',
  'ccchppphccc.',
  '.ccchhhhhcc.',
  '..cccccccc..',
  '..cccchhcc..',
  '.ccchpphccc.',
  '.cccchhhhcc.',
  '..cccccccc..'
];

const BIKE_SPRITE: Sprite = [
  'bb....bb',
  'b.pppp.b',
  'bppppppb',
  'b.pppp.b',
  'bb....bb',
  '..pppp..'
];

const CAR_SPRITE: Sprite = [
  '..rrrrrrrr..',
  '.rnnnnnnnnr.',
  'rnnnssnnnnrr',
  'rnnnnnnnnnrr',
  '.rnnnnnnnnr.',
  '..rr..rr....'
];

const SCOOTER_SPRITE: Sprite = [
  'sssssss',
  'snnnnns',
  'snnnnns',
  's..s..s',
  'ww..ww.'
];

const drawSprite = (
  context: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  colorMap: Record<string, string>
) => {
  sprite.forEach((row, rowIndex) => {
    row.split('').forEach((cell, colIndex) => {
      if (cell === '.') {
        return;
      }
      const color = colorMap[cell];
      if (!color) {
        return;
      }
      context.fillStyle = color;
      context.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
};

const drawPlayer = (
  context: CanvasRenderingContext2D,
  player: Player,
  state: 'RUN' | 'JUMP' | 'HIT',
  time: number
) => {
  const scale = 4;
  const sprite =
    state === 'RUN'
      ? PLAYER_RUN_FRAMES[Math.floor((time * 8) % PLAYER_RUN_FRAMES.length)]
      : state === 'JUMP'
        ? PLAYER_JUMP
        : PLAYER_HIT;

  drawSprite(context, sprite, player.x, player.y, scale, {
    O: PALETTE.outline,
    S: PALETTE.skin,
    H: PALETTE.hair,
    P: PALETTE.pants,
    B: PALETTE.boots,
    X: PALETTE.neon,
    T: PALETTE.shirt
  });
};

const drawCookieCoin = (context: CanvasRenderingContext2D, coin: Coin, time: number) => {
  const scale = 2;
  const shimmer = Math.sin(time * 6 + coin.shimmerOffset) > 0.6;
  drawSprite(context, COOKIE_SPRITE, coin.x, coin.y, scale, {
    c: PALETTE.cookie,
    h: PALETTE.cookieShadow,
    p: shimmer ? PALETTE.highlight : PALETTE.pistachio
  });
  if (shimmer) {
    context.fillStyle = PALETTE.highlight;
    context.fillRect(coin.x + 4, coin.y + 2, 2, 2);
  }
};

const drawObstacle = (context: CanvasRenderingContext2D, obstacle: Obstacle) => {
  const sprite =
    obstacle.type === 'CAR' ? CAR_SPRITE : obstacle.type === 'BIKE' ? BIKE_SPRITE : SCOOTER_SPRITE;
  const scale = 4;
  const offsetX = obstacle.x;
  const offsetY = obstacle.y + obstacle.height - sprite.length * scale;
  drawSprite(context, sprite, offsetX, offsetY, scale, {
    b: PALETTE.outline,
    p: PALETTE.chrome,
    r: PALETTE.neon,
    n: '#1f2937',
    s: '#4cc9f0',
    w: '#f8f9fa'
  });
};

const drawBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  offset: number
) => {
  context.fillStyle = '#05070f';
  context.fillRect(0, 0, width, height);

  const layerOffset = offset * 0.3;
  const layerOffset2 = offset * 0.6;
  for (let x = -120; x < width + 120; x += 120) {
    const neonX = x - (layerOffset % 120);
    context.fillStyle = '#0b0f24';
    context.fillRect(neonX, 40, 90, 120);
    context.fillStyle = '#1b2a4a';
    context.fillRect(neonX + 10, 50, 70, 80);
    context.fillStyle = PALETTE.neon;
    context.fillRect(neonX + 8, 50, 4, 80);
  }

  for (let x = -160; x < width + 160; x += 160) {
    const neonX = x - (layerOffset2 % 160);
    context.fillStyle = '#111827';
    context.fillRect(neonX, 120, 110, 90);
    context.fillStyle = '#0f172a';
    context.fillRect(neonX + 8, 128, 94, 60);
    context.fillStyle = PALETTE.chrome;
    context.fillRect(neonX + 12, 128, 3, 60);
  }

  context.fillStyle = '#0d1328';
  context.fillRect(0, groundY, width, height - groundY);

  const tileSize = 16;
  for (let x = -tileSize; x < width + tileSize; x += tileSize) {
    const tileX = x - (offset % tileSize);
    context.fillStyle = '#1f2a44';
    context.fillRect(tileX, groundY, tileSize, tileSize);
    context.fillStyle = '#111a33';
    context.fillRect(tileX + 2, groundY + 2, tileSize - 4, tileSize - 4);
  }

  context.strokeStyle = '#4361ee';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, groundY + 1);
  context.lineTo(width, groundY + 1);
  context.stroke();
};

const drawScanlines = (context: CanvasRenderingContext2D, width: number, height: number) => {
  context.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let y = 0; y < height; y += 4) {
    context.fillRect(0, y, width, 1);
  }
};
