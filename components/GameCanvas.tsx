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
  const speedRef = useRef<number>(resetSpeed());
  const scoreRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('READY');
  const coinTimerRef = useRef<number>(randomRange(COIN_MIN_GAP, COIN_MAX_GAP));
  const obstacleTimerRef = useRef<number>(randomRange(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP));
  const hudTimerRef = useRef<number>(0);
  const lastObstacleTypeRef = useRef<Obstacle['type'] | null>(null);

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
          const obstacle = createObstacle(
            canvas.width,
            groundY,
            lastObstacleTypeRef.current ?? undefined
          );
          obstaclesRef.current.push(obstacle);
          lastObstacleTypeRef.current = obstacle.type;
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
        drawBackground(context, canvas.width, canvas.height);
        drawGround(context, groundY, canvas.width, canvas.height);

        const player = playerRef.current;
        if (player) {
          const runFrame = Math.floor(timestamp / 120) % 4;
          const pose =
            statusRef.current === 'GAME_OVER'
              ? 'HIT'
              : player.isGrounded
                ? 'RUN'
                : 'JUMP';
          drawPlayer(context, player, runFrame, pose);
        }

        coinsRef.current.forEach((coin) => {
          if (coin.collected) {
            return;
          }
          const sparkleFrame = Math.floor(timestamp / 260) % 2;
          drawCoin(context, coin.x, coin.y, coin.size, sparkleFrame);
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

const drawPixelRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) => {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
};

const drawOutlinedBlock = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  outline: string
) => {
  drawPixelRect(context, x, y, width, height, outline);
  if (width > 2 && height > 2) {
    drawPixelRect(context, x + 1, y + 1, width - 2, height - 2, fill);
  }
};

const drawBackground = (context: CanvasRenderingContext2D, width: number, height: number) => {
  drawPixelRect(context, 0, 0, width, height, '#0a0f1f');

  for (let x = 0; x < width; x += 64) {
    drawPixelRect(context, x + 8, 24, 32, 8, 'rgba(76, 201, 240, 0.12)');
    drawPixelRect(context, x + 20, 54, 22, 6, 'rgba(247, 37, 133, 0.12)');
  }

  for (let y = 0; y < height; y += 4) {
    drawPixelRect(context, 0, y, width, 1, 'rgba(15, 23, 42, 0.2)');
  }
};

const drawGround = (
  context: CanvasRenderingContext2D,
  groundY: number,
  width: number,
  height: number
) => {
  drawPixelRect(context, 0, groundY, width, height - groundY, '#1d2036');
  const tile = 16;
  for (let x = 0; x < width; x += tile) {
    const color = x / tile % 2 === 0 ? '#2b2f4d' : '#252a44';
    drawPixelRect(context, x, groundY, tile, tile, color);
    drawPixelRect(context, x, groundY + tile, tile, tile, '#1b1f37');
  }
  drawPixelRect(context, 0, groundY, width, 4, '#6c63ff');
};

const drawPlayer = (
  context: CanvasRenderingContext2D,
  player: Player,
  frame: number,
  pose: 'RUN' | 'JUMP' | 'HIT'
) => {
  const unit = Math.floor(player.width / 16);
  const baseX = player.x;
  const baseY = player.y;
  const outline = '#1b1f2a';
  const skin = '#f7c59f';
  const hair = '#3d2b1f';
  const shirt = '#2ec4b6';
  const pants = '#0f4c81';
  const shoe = '#ff9f1c';

  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    drawPixelRect(context, baseX + x * unit, baseY + y * unit, w * unit, h * unit, color);
  };

  const outlined = (x: number, y: number, w: number, h: number, color: string) => {
    drawOutlinedBlock(
      context,
      baseX + x * unit,
      baseY + y * unit,
      w * unit,
      h * unit,
      color,
      outline
    );
  };

  outlined(3, 0, 10, 7, skin);
  rect(3, 0, 10, 2, hair);
  rect(4, 2, 2, 2, '#1b1f2a');
  rect(9, 2, 2, 2, '#1b1f2a');
  rect(6, 4, 4, 1, '#d96c7e');

  outlined(4, 6, 8, 5, shirt);
  rect(3, 7, 2, 2, shirt);
  rect(11, 7, 2, 2, shirt);

  outlined(5, 10, 6, 4, pants);

  if (pose === 'HIT') {
    rect(5, 14, 3, 2, shoe);
    rect(8, 14, 3, 2, shoe);
    rect(4, 12, 2, 1, '#f94144');
    return;
  }

  if (pose === 'JUMP') {
    rect(5, 14, 3, 2, shoe);
    rect(8, 14, 3, 2, shoe);
    rect(2, 9, 3, 1, '#ffd6a5');
    rect(11, 9, 3, 1, '#ffd6a5');
    return;
  }

  if (frame === 0) {
    rect(4, 14, 4, 2, shoe);
    rect(9, 14, 3, 2, shoe);
  } else if (frame === 1) {
    rect(5, 14, 3, 2, shoe);
    rect(9, 13, 3, 2, shoe);
  } else if (frame === 2) {
    rect(4, 14, 3, 2, shoe);
    rect(8, 14, 4, 2, shoe);
  } else {
    rect(5, 13, 3, 2, shoe);
    rect(9, 14, 3, 2, shoe);
  }
  rect(2, 9, 3, 1, '#ffd6a5');
  rect(11, 9, 3, 1, '#ffd6a5');
};

const drawCoin = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  frame: number
) => {
  const unit = Math.floor(size / 8);
  const outline = '#2d1607';
  const chocolate = '#6f3d1f';
  const pistachio = '#7fd870';
  const shine = frame === 0 ? '#fef9c3' : '#f4d06f';

  drawOutlinedBlock(context, x, y, size, size, chocolate, outline);
  drawPixelRect(context, x + unit * 2, y + unit * 2, unit * 2, unit * 2, pistachio);
  drawPixelRect(context, x + unit * 4, y + unit * 4, unit * 2, unit * 2, pistachio);
  drawPixelRect(context, x + unit * 5, y + unit * 2, unit * 2, unit, shine);
  drawPixelRect(context, x + unit * 2, y + unit * 5, unit, unit, shine);
};

const drawObstacle = (context: CanvasRenderingContext2D, obstacle: Obstacle) => {
  const unit = 2;
  const baseX = obstacle.x;
  const baseY = obstacle.y;
  const outline = '#0b0f1f';

  const block = (x: number, y: number, w: number, h: number, color: string) => {
    drawPixelRect(context, baseX + x * unit, baseY + y * unit, w * unit, h * unit, color);
  };

  if (obstacle.type === 'BICYCLE') {
    block(0, 8, 4, 4, '#2f2d2e');
    block(12, 8, 4, 4, '#2f2d2e');
    block(2, 6, 12, 2, '#43aa8b');
    block(6, 4, 2, 4, '#577590');
    block(8, 2, 4, 2, '#f9c74f');
    block(1, 9, 2, 2, outline);
    block(13, 9, 2, 2, outline);
  } else if (obstacle.type === 'CAR') {
    block(0, 6, 24, 6, '#f72585');
    block(4, 2, 12, 4, '#4cc9f0');
    block(4, 8, 4, 4, '#1b1f2a');
    block(16, 8, 4, 4, '#1b1f2a');
    block(2, 9, 2, 2, outline);
    block(18, 9, 2, 2, outline);
  } else {
    block(0, 8, 6, 3, '#4361ee');
    block(4, 3, 2, 5, '#b5179e');
    block(8, 8, 4, 4, '#1b1f2a');
    block(1, 9, 2, 2, outline);
  }
};

const drawOverlay = (
  message: string,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
) => {
  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#f8f9fa';
  context.font = '24px "Press Start 2P", system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText(message, canvas.width / 2, canvas.height / 2);
};
