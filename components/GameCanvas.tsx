'use client';

import { useEffect, useRef, useState } from 'react';
import {
  COIN_MAX_GAP,
  COIN_MIN_GAP,
  GAME_HEIGHT,
  GAME_WIDTH,
  MIN_OBSTACLE_DISTANCE,
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

const TILE_SIZE = 16;

const PALETTE = {
  night: '#0a0f1f',
  wall: '#121c33',
  wallGlow: '#1d2a4d',
  neonPink: '#ff4d8d',
  neonBlue: '#4cc9f0',
  neonPurple: '#7b2cbf',
  floor: '#1a1f2e',
  floorTile: '#252b3d',
  outline: '#0b0b12',
  skin: '#f6c7a7',
  hair: '#3c2a21',
  shirt: '#36c36f',
  pants: '#3a5cff',
  shoes: '#f9c74f',
  cookie: '#4f2a1d',
  cookieDark: '#3b1c14',
  pistachio: '#6bcf6a',
  shine: '#fef9c3'
};

const PLAYER_RUN_FRAMES: string[][] = [
  [
    '....OOOOOOOO....',
    '...OHHHHHHHHO...',
    '..OHSSSSSSSSHO..',
    '..OHSSSSSSSSHO..',
    '..OHHHHHHHHHHO..',
    '..OOOOOOOOOOOO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCC..CC..CCO..',
    '..OCC..CC..CCO..',
    '..O..BB..BB..O..',
    '.OO.BB....BB.OO.',
    '.O..BB....BB..O.',
    '....OO....OO....'
  ],
  [
    '....OOOOOOOO....',
    '...OHHHHHHHHO...',
    '..OHSSSSSSSSHO..',
    '..OHSSSSSSSSHO..',
    '..OHHHHHHHHHHO..',
    '..OOOOOOOOOOOO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCC..CC..CCO..',
    '..OCC..CC..CCO..',
    '..O..BB..BB..O..',
    '.OO..BBOOBB..OO.',
    '.O....BB....OO..',
    '.....OO..OO.....'
  ],
  [
    '....OOOOOOOO....',
    '...OHHHHHHHHO...',
    '..OHSSSSSSSSHO..',
    '..OHSSSSSSSSHO..',
    '..OHHHHHHHHHHO..',
    '..OOOOOOOOOOOO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCC..CC..CCO..',
    '..OCC..CC..CCO..',
    '..O..BB..BB..O..',
    '.OO.BB....BB.OO.',
    '.O..BB....BB..O.',
    '....OO....OO....'
  ],
  [
    '....OOOOOOOO....',
    '...OHHHHHHHHO...',
    '..OHSSSSSSSSHO..',
    '..OHSSSSSSSSHO..',
    '..OHHHHHHHHHHO..',
    '..OOOOOOOOOOOO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCCCCCCCCCCO..',
    '..OCC..CC..CCO..',
    '..OCC..CC..CCO..',
    '..O..BB..BB..O..',
    '.OO..BBOOBB..OO.',
    '.O....BB....OO..',
    '.....OO..OO.....'
  ]
];

const PLAYER_JUMP_FRAME = [
  '....OOOOOOOO....',
  '...OHHHHHHHHO...',
  '..OHSSSSSSSSHO..',
  '..OHSSSSSSSSHO..',
  '..OHHHHHHHHHHO..',
  '..OOOOOOOOOOOO..',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OCC..CC..CCO..',
  '..OCC..CC..CCO..',
  '..O..BBBBBBBBO..',
  '..OO..BB..OO....',
  '....BB..BB......',
  '....OO..OO......'
];

const PLAYER_HIT_FRAME = [
  '....OOOOOOOO....',
  '...OHHHHHHHHO...',
  '..OHSSSSSSSSHO..',
  '..OHSSSSSSSSHO..',
  '..OHHHHHHHHHHO..',
  '..OOOOOOOOOOOO..',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OCC..CC..CCO..',
  '..OCC..CC..CCO..',
  '..O..BB..BB..O..',
  '.OO.BB..BB..OO..',
  '.O..BB....BB..O.',
  '....OO....OO....'
];

const COOKIE_FRAMES = [
  [
    '.....OOOOO......',
    '...OOOOOOOOO....',
    '..OOCCCCCCOOO...',
    '.OOCCPPPPCCOO...',
    '.OCCPPPPPPCCO...',
    '.OCPPSSSSPPCO...',
    '.OCPSSSSSPPCO...',
    '.OCPSSSSSPPCO...',
    '.OCPSSSSSPPCO...',
    '.OCPPSSSSPPCO...',
    '.OCCPPPPPPCCO...',
    '.OOCCPPPPCCOO...',
    '..OOCCCCCCOO....',
    '...OOOOOOOOO....',
    '.....OOOOO......',
    '................'
  ],
  [
    '.....OOOOO......',
    '...OOOOOOOOO....',
    '..OOCCCCCCOOO...',
    '.OOCCPPPPCCOO...',
    '.OCCPPPPPPCCO...',
    '.OCPPSSSSPPCO...',
    '.OCPSSSSSPPCO...',
    '.OCPSSSSSPPCO...',
    '.OCPSSSSSPPCO...',
    '.OCPPSSSSPPCO...',
    '.OCCPPPPPPCCO...',
    '.OOCCPPPPCCOO...',
    '..OOCCCCCCOO....',
    '...OOOOOOOOO....',
    '.....OOO.O......',
    '................'
  ]
];

const OBSTACLE_COLORS = {
  bicycle: { body: '#f7b801', detail: '#fce7a8', wheel: '#2b2d42' },
  car: { body: '#ef476f', detail: '#ffd166', wheel: '#2b2d42' },
  scooter: { body: '#4cc9f0', detail: '#bde0fe', wheel: '#2b2d42' }
};

const getObstacleColor = (type: Obstacle['type']) => {
  if (type === 'CAR') {
    return OBSTACLE_COLORS.car;
  }
  if (type === 'SCOOTER') {
    return OBSTACLE_COLORS.scooter;
  }
  return OBSTACLE_COLORS.bicycle;
};

const pickObstacleType = (lastType: Obstacle['type'] | null): Obstacle['type'] => {
  const choices: Array<{ type: Obstacle['type']; weight: number }> = [
    { type: 'BICYCLE', weight: 0.4 },
    { type: 'CAR', weight: 0.25 },
    { type: 'SCOOTER', weight: 0.35 }
  ];

  const filtered = lastType === 'CAR' ? choices.filter((choice) => choice.type !== 'CAR') : choices;
  const totalWeight = filtered.reduce((sum, choice) => sum + choice.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const choice of filtered) {
    roll -= choice.weight;
    if (roll <= 0) {
      return choice.type;
    }
  }
  return filtered[0].type;
};

const drawSprite = (
  context: CanvasRenderingContext2D,
  sprite: string[],
  x: number,
  y: number,
  pixelSize: number,
  paletteMap: Record<string, string>
) => {
  sprite.forEach((row, rowIndex) => {
    row.split('').forEach((pixel, colIndex) => {
      const color = paletteMap[pixel];
      if (!color) {
        return;
      }
      context.fillStyle = color;
      context.fillRect(x + colIndex * pixelSize, y + rowIndex * pixelSize, pixelSize, pixelSize);
    });
  });
};

const drawBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  midOffset: number,
  farOffset: number
) => {
  context.fillStyle = PALETTE.night;
  context.fillRect(0, 0, width, height);

  context.fillStyle = PALETTE.wall;
  context.fillRect(0, 0, width, groundY);

  const farSpeed = 0.35;
  const midSpeed = 0.6;

  for (let x = -TILE_SIZE; x < width + TILE_SIZE; x += TILE_SIZE * 2) {
    const offsetX = (x + farOffset * farSpeed) % (TILE_SIZE * 4);
    context.fillStyle = PALETTE.neonPurple;
    context.fillRect(offsetX, 40, TILE_SIZE, 6);
    context.fillStyle = PALETTE.neonBlue;
    context.fillRect(offsetX + TILE_SIZE, 70, TILE_SIZE, 6);
  }

  for (let x = -TILE_SIZE; x < width + TILE_SIZE; x += TILE_SIZE * 3) {
    const offsetX = (x + midOffset * midSpeed) % (TILE_SIZE * 6);
    context.fillStyle = PALETTE.wallGlow;
    context.fillRect(offsetX, groundY - 160, TILE_SIZE * 2, 40);
    context.fillStyle = PALETTE.neonPink;
    context.fillRect(offsetX + 8, groundY - 150, TILE_SIZE, 8);
  }

  context.strokeStyle = '#0e1730';
  context.lineWidth = 1;
  for (let y = 0; y < groundY; y += 8) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }
};

const drawFloor = (context: CanvasRenderingContext2D, width: number, height: number, groundY: number) => {
  context.fillStyle = PALETTE.floor;
  context.fillRect(0, groundY, width, height - groundY);

  for (let x = 0; x < width; x += TILE_SIZE) {
    for (let y = groundY; y < height; y += TILE_SIZE) {
      context.fillStyle = (Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2 === 0
        ? PALETTE.floorTile
        : PALETTE.floor;
      context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  context.strokeStyle = PALETTE.neonBlue;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, groundY + 2);
  context.lineTo(width, groundY + 2);
  context.stroke();
};

const drawPlayerSprite = (
  context: CanvasRenderingContext2D,
  player: Player,
  frameIndex: number,
  status: GameStatus
) => {
  const pixelSize = 3;
  const sprite = status === 'GAME_OVER'
    ? PLAYER_HIT_FRAME
    : player.isGrounded
      ? PLAYER_RUN_FRAMES[frameIndex % PLAYER_RUN_FRAMES.length]
      : PLAYER_JUMP_FRAME;

  const paletteMap = {
    O: PALETTE.outline,
    H: PALETTE.hair,
    S: PALETTE.skin,
    C: PALETTE.shirt,
    B: PALETTE.shoes,
    P: PALETTE.pants
  };

  drawSprite(context, sprite, player.x, player.y, pixelSize, paletteMap);
};

const drawCookie = (context: CanvasRenderingContext2D, coin: Coin, frameIndex: number) => {
  const pixelSize = 1;
  const sprite = COOKIE_FRAMES[frameIndex % COOKIE_FRAMES.length];
  const size = sprite.length * pixelSize;
  const x = coin.x - size / 2;
  const y = coin.y - size / 2;

  const paletteMap = {
    O: PALETTE.outline,
    C: PALETTE.cookie,
    P: PALETTE.cookieDark,
    S: PALETTE.pistachio,
    '.': '',
    H: PALETTE.shine
  };

  drawSprite(context, sprite, x, y, pixelSize, paletteMap);
};

const drawObstacle = (context: CanvasRenderingContext2D, obstacle: Obstacle) => {
  const colors = getObstacleColor(obstacle.type);
  const x = obstacle.x;
  const y = obstacle.y;

  context.fillStyle = PALETTE.outline;
  context.fillRect(x - 2, y - 2, obstacle.width + 4, obstacle.height + 4);

  context.fillStyle = colors.body;
  context.fillRect(x, y, obstacle.width, obstacle.height);

  context.fillStyle = colors.detail;
  if (obstacle.type === 'CAR') {
    context.fillRect(x + 6, y + 4, obstacle.width - 12, 8);
    context.fillRect(x + 10, y + 12, obstacle.width - 20, 6);
    context.fillStyle = colors.wheel;
    context.fillRect(x + 6, y + obstacle.height - 6, 10, 6);
    context.fillRect(x + obstacle.width - 16, y + obstacle.height - 6, 10, 6);
  } else if (obstacle.type === 'SCOOTER') {
    context.fillRect(x + 4, y + 6, obstacle.width - 8, 6);
    context.fillRect(x + obstacle.width - 8, y, 4, obstacle.height - 6);
    context.fillStyle = colors.wheel;
    context.fillRect(x + 2, y + obstacle.height - 6, 6, 6);
    context.fillRect(x + obstacle.width - 8, y + obstacle.height - 6, 6, 6);
  } else {
    context.fillRect(x + 6, y + 8, obstacle.width - 12, 6);
    context.fillStyle = colors.wheel;
    context.fillRect(x + 4, y + obstacle.height - 6, 8, 6);
    context.fillRect(x + obstacle.width - 12, y + obstacle.height - 6, 8, 6);
  }
};

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
  const animationRef = useRef<number>(0);
  const lastObstacleTypeRef = useRef<Obstacle['type'] | null>(null);
  const backgroundOffsetRef = useRef<{ mid: number; far: number }>({ mid: 0, far: 0 });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState<number>(Math.round(speedRef.current));
  const [status, setStatus] = useState<GameStatus>('READY');

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
    backgroundOffsetRef.current = { mid: 0, far: 0 };
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
          const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
          if (
            lastObstacle &&
            canvas.width + 60 - (lastObstacle.x + lastObstacle.width) < MIN_OBSTACLE_DISTANCE
          ) {
            obstacleTimerRef.current = 0.15;
          } else {
            const nextType = pickObstacleType(lastObstacleTypeRef.current);
            obstaclesRef.current.push(createObstacle(canvas.width, groundY, nextType));
            lastObstacleTypeRef.current = nextType;
            const minGap = Math.max(0.9, OBSTACLE_MIN_GAP - speedRef.current * 0.02);
            const maxGap = Math.max(1.4, OBSTACLE_MAX_GAP - speedRef.current * 0.02);
            obstacleTimerRef.current = randomRange(minGap, maxGap);
          }
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

      backgroundOffsetRef.current = {
        mid: backgroundOffsetRef.current.mid - speedRef.current * 1.2,
        far: backgroundOffsetRef.current.far - speedRef.current * 0.6
      };
      animationRef.current += delta;

      const render = () => {
        const groundY = getGroundY(canvas.height);
        drawBackground(
          context,
          canvas.width,
          canvas.height,
          groundY,
          backgroundOffsetRef.current.mid,
          backgroundOffsetRef.current.far
        );
        drawFloor(context, canvas.width, canvas.height, groundY);

        const player = playerRef.current;
        if (player) {
          const frameIndex = Math.floor(animationRef.current * 8) % PLAYER_RUN_FRAMES.length;
          drawPlayerSprite(context, player, frameIndex, statusRef.current);
        }

        const coinFrame = Math.floor(animationRef.current * 6) % COOKIE_FRAMES.length;
        coinsRef.current.forEach((coin) => {
          if (coin.collected) {
            return;
          }
          drawCookie(context, coin, coinFrame);
        });

        obstaclesRef.current.forEach((obstacle) => {
          drawObstacle(context, obstacle);
        });

        if (statusRef.current === 'READY') {
          drawOverlay('Tap / Space to Start', canvas, context);
        }
        if (statusRef.current === 'GAME_OVER') {
          drawOverlay('Game Over', canvas, context);
        }
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
            <h2>Coin Runner</h2>
            <p>Tap or press Space to jump.</p>
            <button type="button" onClick={startGame}>
              Start
            </button>
            <span className="hint">Collect the Dubai chewy cookie coins!</span>
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
  context.fillStyle = 'rgba(5, 8, 15, 0.6)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#f8f9fa';
  context.font = '700 28px "Press Start 2P", system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(message, canvas.width / 2, canvas.height / 2);
};
