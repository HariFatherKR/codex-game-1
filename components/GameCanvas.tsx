'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createGameConfig } from '@/lib/game/constants';
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
import type { Coin, GameConfig, GameStatus, Obstacle, Player } from '@/lib/game/types';
import { readHighScore, writeHighScore } from '@/lib/game/storage';

const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const playerRef = useRef<Player | null>(null);
  const coinsRef = useRef<Coin[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('READY');
  const coinTimerRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);
  const hudTimerRef = useRef<number>(0);
  const lastObstacleTypeRef = useRef<Obstacle['type'] | null>(null);
  const backgroundOffsetRef = useRef<number>(0);
  const animationTimeRef = useRef<number>(0);
  const configRef = useRef<GameConfig>(createGameConfig(false));

  const [isMobile, setIsMobile] = useState(false);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>('READY');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFriendScore, setShowFriendScore] = useState(true);

  const searchParams = useSearchParams();

  const config = useMemo(() => createGameConfig(isMobile), [isMobile]);

  const resetGame = (canvas: HTMLCanvasElement, nextConfig: GameConfig) => {
    const groundY = getGroundY(canvas.height, nextConfig);
    playerRef.current = createPlayer(groundY, nextConfig);
    coinsRef.current = [];
    obstaclesRef.current = [];
    speedRef.current = resetSpeed(nextConfig);
    scoreRef.current = 0;
    coinTimerRef.current = randomRange(nextConfig.coin.minGap, nextConfig.coin.maxGap);
    obstacleTimerRef.current = randomRange(nextConfig.obstacle.minGap, nextConfig.obstacle.maxGap);
    lastObstacleTypeRef.current = null;
    backgroundOffsetRef.current = 0;
    animationTimeRef.current = 0;
    setScore(0);
    setFinalScore(0);
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
    resetGame(canvas, configRef.current);
    statusRef.current = 'RUNNING';
    setStatus('RUNNING');
  };

  const triggerGameOver = () => {
    statusRef.current = 'GAME_OVER';
    setStatus('GAME_OVER');
    setFinalScore(scoreRef.current);
    const nextHigh = Math.max(scoreRef.current, highScore);
    if (nextHigh !== highScore) {
      setHighScore(nextHigh);
      writeHighScore(nextHigh);
    }
  };

  const shareScore = async () => {
    const title = 'Dubai Cookie Dash';
    const text = `Dubai Cookie Dash에서 ${finalScore}점! 너 이길 수 있어?`;
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('s', String(finalScore));
    const url = shareUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // Fall back to clipboard when share is canceled or fails.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setToastMessage('복사 완료!');
    } catch (error) {
      setToastMessage('복사 실패');
    }
  };

  const friendScore = useMemo(() => {
    const rawScore = searchParams.get('s');
    if (!rawScore) {
      return null;
    }
    if (!/^\d+$/.test(rawScore)) {
      return null;
    }
    const parsed = Number.parseInt(rawScore, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999999) {
      return null;
    }
    return parsed;
  }, [searchParams]);

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
    jumpPlayer(player, configRef.current);
  };

  useEffect(() => {
    setHighScore(readHighScore());
  }, []);

  useEffect(() => {
    if (friendScore !== null) {
      setShowFriendScore(true);
    }
  }, [friendScore]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toastMessage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMatch = () => {
      setIsMobile(mediaQuery.matches);
    };
    updateMatch();
    mediaQuery.addEventListener('change', updateMatch);
    return () => {
      mediaQuery.removeEventListener('change', updateMatch);
    };
  }, []);

  useEffect(() => {
    configRef.current = config;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = config.baseWidth;
      canvas.height = config.baseHeight;
      resetGame(canvas, config);
    }
  }, [config]);

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
      const activeConfig = configRef.current;
      canvas.width = activeConfig.baseWidth;
      canvas.height = activeConfig.baseHeight;
      if (!playerRef.current) {
        resetGame(canvas, activeConfig);
      } else {
        const groundY = getGroundY(canvas.height, activeConfig);
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
        const activeConfig = configRef.current;
        const groundY = getGroundY(canvas.height, activeConfig);
        updatePlayer(player, delta, groundY, activeConfig);

        speedRef.current = increaseSpeed(speedRef.current, delta, activeConfig);
        animationTimeRef.current += delta;
        backgroundOffsetRef.current += speedRef.current * delta * 24;
        coinTimerRef.current -= delta;
        obstacleTimerRef.current -= delta;

        if (coinTimerRef.current <= 0) {
          coinsRef.current.push(createCoin(canvas.width, groundY, activeConfig));
          coinTimerRef.current = randomRange(activeConfig.coin.minGap, activeConfig.coin.maxGap);
        }
        if (obstacleTimerRef.current <= 0) {
          const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
          const minDistance = activeConfig.obstacle.minDistance;
          if (!lastObstacle || lastObstacle.x < canvas.width - minDistance) {
            const nextObstacle = createObstacle(
              canvas.width,
              groundY,
              lastObstacleTypeRef.current,
              activeConfig
            );
            obstaclesRef.current.push(nextObstacle);
            lastObstacleTypeRef.current = nextObstacle.type;
          }
          const minGap = Math.max(0.9, activeConfig.obstacle.minGap - speedRef.current * 0.02);
          const maxGap = Math.max(1.4, activeConfig.obstacle.maxGap - speedRef.current * 0.02);
          obstacleTimerRef.current = randomRange(minGap, maxGap);
        }

        moveObjects(coinsRef.current, speedRef.current, delta);
        moveObjects(obstaclesRef.current, speedRef.current, delta);

        coinsRef.current = removeOffscreen(coinsRef.current, -100);
        obstaclesRef.current = removeOffscreen(obstaclesRef.current, -120);

        coinsRef.current.forEach((coin) => {
          if (!coin.collected && checkCoinCollision(player, coin)) {
            coin.collected = true;
            scoreRef.current += getScoreForCoin(activeConfig);
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
        const groundY = getGroundY(canvas.height, configRef.current);

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
          drawOverlay('Press Space to Start', canvas, context);
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
  }, [highScore]);

  return (
    <div
      className="game-shell"
      data-mode={isMobile ? 'mobile' : 'desktop'}
      role="application"
      tabIndex={0}
      onPointerDown={handleJump}
      onKeyDown={(event) => {
        if (event.key === ' ') {
          event.preventDefault();
          handleJump();
        }
      }}
    >
      <div className="hud-layer">
        {friendScore !== null && showFriendScore ? (
          <div className="friend-score-banner" role="status">
            <span>친구 점수: {friendScore} — 이겨보세요!</span>
            <button
              type="button"
              className="friend-score-close"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setShowFriendScore(false);
              }}
              aria-label="친구 점수 배너 닫기"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="hud-row hud-top-left">
          <div className="hud-block">
            <span className="hud-label">Score</span>
            <span className="hud-value">{score}</span>
          </div>
        </div>
        <div className="hud-row hud-top-right">
          <div className="hud-block hud-block--mini">
            <span className="hud-label">High</span>
            <span className="hud-value">{highScore}</span>
          </div>
          <div className="hud-block hud-block--mini">
            <span className="hud-label">Speed</span>
            <span className="hud-value">{speedDisplay}</span>
          </div>
        </div>
        <div className="hud-row hud-bottom-left">
          <button
            type="button"
            className="hud-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            Sound
          </button>
        </div>
        <div className="hud-row hud-bottom-right">
          <button
            type="button"
            className="hud-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              shareScore();
            }}
          >
            Share
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={config.baseWidth}
        height={config.baseHeight}
      />
      {status === 'GAME_OVER' ? (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Game Over</h2>
            <p>Score: {finalScore}</p>
            <p>High Score: {highScore}</p>
            <div className="overlay-actions">
              <button
                type="button"
                className="overlay-button overlay-button--primary"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  restartGame();
                }}
              >
                Restart
              </button>
              <button
                type="button"
                className="overlay-button overlay-button--secondary"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  shareScore();
                }}
              >
                Share
              </button>
            </div>
            <span className="hint">Press Enter or tap to restart</span>
          </div>
        </div>
      ) : null}
      {status === 'READY' ? (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Dubai Cookie Dash</h2>
            <p>Tap or press Space to jump.</p>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                startGame();
              }}
            >
              Start
            </button>
          </div>
        </div>
      ) : null}
      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
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
