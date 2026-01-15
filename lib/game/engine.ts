import {
  BASE_SPEED,
  COIN_RADIUS,
  COIN_SCORE,
  GROUND_HEIGHT,
  GRAVITY,
  HIGH_OBSTACLE,
  JUMP_FORCE,
  LOW_OBSTACLE,
  MAX_SPEED,
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
  const lift = Math.random() > 0.5 ? 110 : 60;
  return {
    id: objectId++,
    x: canvasWidth + 40,
    y: groundY - lift,
    radius: COIN_RADIUS,
    collected: false
  };
};

export const createObstacle = (canvasWidth: number, groundY: number): Obstacle => {
  const isHigh = Math.random() > 0.55;
  const obstacle = isHigh ? HIGH_OBSTACLE : LOW_OBSTACLE;
  return {
    id: objectId++,
    x: canvasWidth + 60,
    y: groundY - obstacle.height,
    width: obstacle.width,
    height: obstacle.height,
    type: isHigh ? 'HIGH' : 'LOW'
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
): T[] => objects.filter((obj) => obj.x + ('width' in obj ? obj.width : obj.radius * 2) > limit);

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
    x: coin.x - coin.radius,
    y: coin.y - coin.radius,
    width: coin.radius * 2,
    height: coin.radius * 2
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
