import type { Coin, GameConfig, GameSnapshot, Obstacle, Player } from './types';

let objectId = 0;

export const createPlayer = (groundY: number, config: GameConfig): Player => ({
  x: config.player.x,
  y: groundY - config.player.height,
  width: config.player.width,
  height: config.player.height,
  velocityY: 0,
  isGrounded: true
});

export const getGroundY = (height: number, config: GameConfig): number =>
  height - config.groundHeight;

export const jumpPlayer = (player: Player, config: GameConfig): void => {
  if (!player.isGrounded) {
    return;
  }
  player.velocityY = -config.physics.jumpForce;
  player.isGrounded = false;
};

export const updatePlayer = (
  player: Player,
  deltaSeconds: number,
  groundY: number,
  config: GameConfig
): void => {
  player.velocityY += config.physics.gravity * deltaSeconds;
  player.y += player.velocityY * deltaSeconds;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isGrounded = true;
  }
};

export const increaseSpeed = (speed: number, deltaSeconds: number, config: GameConfig): number => {
  const next = speed + config.speed.ramp * deltaSeconds;
  return Math.min(next, config.speed.max);
};

export const createCoin = (canvasWidth: number, groundY: number, config: GameConfig): Coin => {
  const options = config.coin.liftOptions;
  const lift = options[Math.floor(Math.random() * options.length)] ?? options[0] ?? 80;
  return {
    id: objectId++,
    x: canvasWidth + 40,
    y: groundY - lift,
    size: config.coin.size,
    shimmerOffset: Math.random() * 2 * Math.PI,
    collected: false
  };
};

export const createObstacle = (
  canvasWidth: number,
  groundY: number,
  lastType: Obstacle['type'] | null,
  config: GameConfig
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

  const obstacle = config.obstacle.sizes[selection];

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

export const getScoreForCoin = (config: GameConfig): number => config.coin.score;

export const resetSpeed = (config: GameConfig): number => config.speed.base;
