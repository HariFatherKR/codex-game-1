import {
  BASE_SPEED,
  COIN_SIZE,
  COIN_SCORE,
  BIKE_OBSTACLE,
  CAR_OBSTACLE,
  GROUND_HEIGHT,
  GRAVITY,
  MAX_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SCOOTER_OBSTACLE,
  SPEED_RAMP,
  type GameConfig
} from './constants';
import type { Coin, GameSnapshot, Obstacle, Player } from './types';

let objectId = 0;

export const createPlayer = (groundY: number, config: GameConfig): Player => ({
  x: config.playerX,
  y: groundY - PLAYER_HEIGHT,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  velocityY: 0,
  isGrounded: true
});

export const getGroundY = (height: number): number => height - GROUND_HEIGHT;

export const jumpPlayer = (player: Player, config: GameConfig): void => {
  if (!player.isGrounded) {
    return;
  }
  player.velocityY = -config.jumpForce;
  player.isGrounded = false;
};

export const updatePlayer = (player: Player, deltaSeconds: number, groundY: number): void => {
  player.velocityY += GRAVITY * deltaSeconds;
  player.y += player.velocityY * deltaSeconds;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isGrounded = true;
  }
};

export const increaseSpeed = (speed: number, deltaSeconds: number): number => {
  const next = speed + SPEED_RAMP * deltaSeconds;
  return Math.min(next, MAX_SPEED);
};

export const createCoin = (canvasWidth: number, groundY: number, config: GameConfig): Coin => {
  const lift = config.coinHeights[Math.floor(Math.random() * config.coinHeights.length)] ?? 80;
  return {
    id: objectId++,
    x: canvasWidth + 40,
    y: groundY - lift,
    size: COIN_SIZE,
    shimmerOffset: Math.random() * 2 * Math.PI,
    collected: false
  };
};

export const createObstacle = (
  canvasWidth: number,
  groundY: number,
  lastType: Obstacle['type'] | null
): Obstacle => {
  const options: Array<{ type: Obstacle['type']; weight: number }> = [
    { type: 'BIKE', weight: 0.38 },
    { type: 'CAR', weight: 0.34 },
    { type: 'SCOOTER', weight: 0.28 }
  ];

  const filtered =
    lastType === 'CAR' ? options.filter((option) => option.type !== 'CAR') : options;

  const totalWeight = filtered.reduce((sum, option) => sum + option.weight, 0);
  const roll = Math.random() * totalWeight;
  let accumulator = 0;
  let selection = filtered[0]?.type ?? 'BIKE';
  for (const option of filtered) {
    accumulator += option.weight;
    if (roll <= accumulator) {
      selection = option.type;
      break;
    }
  }

  const obstacleLookup = {
    BIKE: BIKE_OBSTACLE,
    CAR: CAR_OBSTACLE,
    SCOOTER: SCOOTER_OBSTACLE
  } as const;
  const obstacle = obstacleLookup[selection];

  return {
    id: objectId++,
    x: canvasWidth + 60,
    y: groundY - obstacle.height,
    width: obstacle.width,
    height: obstacle.height,
    type: selection
  };
};

export const moveObjects = (objects: Array<Coin | Obstacle>, speed: number, deltaSeconds: number): void => {
  const distance = speed * 60 * deltaSeconds;
  objects.forEach((obj) => {
    obj.x -= distance;
  });
};

export const removeOffscreen = <T extends Coin | Obstacle>(
  objects: T[],
  limit: number
): T[] => objects.filter((obj) => obj.x + ('width' in obj ? obj.width : obj.size) > limit);

export const checkRectCollision = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export const checkCoinCollision = (player: Player, coin: Coin): boolean => {
  const coinBox = {
    x: coin.x,
    y: coin.y,
    width: coin.size,
    height: coin.size
  };

  return checkRectCollision(player, coinBox);
};

export const getSnapshot = (score: number, speed: number, status: GameSnapshot['status']): GameSnapshot => ({
  score,
  speed,
  status
});

export const getScoreForCoin = (): number => COIN_SCORE;

export const resetSpeed = (): number => BASE_SPEED;
