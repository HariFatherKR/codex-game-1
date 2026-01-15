import {
  BASE_SPEED,
  COIN_RADIUS,
  COIN_SCORE,
  GROUND_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  MAX_SPEED,
  OBSTACLE_TYPES,
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

const pickObstacleType = (lastType?: Obstacle['type']): (typeof OBSTACLE_TYPES)[number] => {
  const available = lastType === 'CAR' ? OBSTACLE_TYPES.filter((item) => item.type !== 'CAR') : OBSTACLE_TYPES;
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of available) {
    roll -= item.weight;
    if (roll <= 0) {
      return item;
    }
  }
  return available[0];
};

export const createObstacle = (
  canvasWidth: number,
  groundY: number,
  lastType?: Obstacle['type']
): Obstacle => {
  const obstacle = pickObstacleType(lastType);
  return {
    id: objectId++,
    x: canvasWidth + 60,
    y: groundY - obstacle.height,
    width: obstacle.width,
    height: obstacle.height,
    type: obstacle.type
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
