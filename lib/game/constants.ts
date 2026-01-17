export type GameMode = 'mobile' | 'desktop';

export type GameConfig = {
  baseWidth: number;
  baseHeight: number;
  playerX: number;
  jumpForce: number;
  obstacleMinGap: number;
  obstacleMaxGap: number;
  obstacleMinDistance: number;
  coinMinGap: number;
  coinMaxGap: number;
  coinHeights: number[];
};

export const GAME_CONFIGS: Record<GameMode, GameConfig> = {
  mobile: {
    baseWidth: 360,
    baseHeight: 640,
    playerX: 110,
    jumpForce: 840,
    obstacleMinGap: 1.35,
    obstacleMaxGap: 2.5,
    obstacleMinDistance: 220,
    coinMinGap: 0.95,
    coinMaxGap: 1.8,
    coinHeights: [70, 150, 230]
  },
  desktop: {
    baseWidth: 960,
    baseHeight: 540,
    playerX: 180,
    jumpForce: 760,
    obstacleMinGap: 1.2,
    obstacleMaxGap: 2.4,
    obstacleMinDistance: 180,
    coinMinGap: 1.0,
    coinMaxGap: 2.0,
    coinHeights: [60, 110]
  }
};

export const GROUND_HEIGHT = 80;

export const PLAYER_WIDTH = 48;
export const PLAYER_HEIGHT = 48;

export const GRAVITY = 2200;

export const BASE_SPEED = 6;
export const MAX_SPEED = 20;
export const SPEED_RAMP = 0.35;

export const COIN_SIZE = 24;
export const COIN_SCORE = 10;

export const BIKE_OBSTACLE = {
  width: 32,
  height: 24
};

export const CAR_OBSTACLE = {
  width: 48,
  height: 24
};

export const SCOOTER_OBSTACLE = {
  width: 28,
  height: 20
};
