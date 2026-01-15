import {
  BASE_SPEED,
  COIN_SCORE,
  COIN_SIZE,
  GROUND_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  MAX_SPEED,
  OBSTACLES,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_X,
  SPEED_RAMP
} from './constants';
import type { Coin, GameSnapshot, Obstacle, Player } from './types';

let objectId = 0;

export const createPlayer = (groundY: number): Player => ({
  x: PLAYER_X,
  y: groundY - PLAYER_HEIGHT,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  velocityY: 0,
  isGrounded: true
});

export const getGroundY = (height: number): number => height - GROUND_HEIGHT;

export const jumpPlayer = (player: Player): void => {
  if (!player.isGrounded) {
    return;
  }
  player.velocityY = -JUMP_FORCE;
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

export const createCoin = (canvasWidth: number, groundY: number): Coin => {
  const lift = Math.random() > 0.5 ? 120 : 72;
  return {
    id: objectId++,
    x: canvasWidth + 40,
    y: groundY - lift - COIN_SIZE,
    size: COIN_SIZE,
    collected: false
  };
};

export const createObstacle = (
  canvasWidth: number,
  groundY: number,
  previousType?: Obstacle['type']
): Obstacle => {
  const types: Obstacle['type'][] = ['BICYCLE', 'CAR', 'SCOOTER'];
  const availableTypes =
    previousType === 'CAR' ? types.filter((type) => type !== 'CAR') : types;
  const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const obstacle = OBSTACLES[type];
  return {
    id: objectId++,
    x: canvasWidth + 60,
    y: groundY - obstacle.height,
    width: obstacle.width,
    height: obstacle.height,
    type
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
): T[] =>
  objects.filter((obj) => obj.x + ('width' in obj ? obj.width : obj.size) > limit);

export const checkRectCollision = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export const checkCoinCollision = (player: Player, coin: Coin): boolean => {
  return checkRectCollision(player, {
    x: coin.x,
    y: coin.y,
    width: coin.size,
    height: coin.size
  });
};

export const getSnapshot = (score: number, speed: number, status: GameSnapshot['status']): GameSnapshot => ({
  score,
  speed,
  status
});

export const getScoreForCoin = (): number => COIN_SCORE;

export const resetSpeed = (): number => BASE_SPEED;
