export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_HEIGHT = 96;

export const PLAYER_WIDTH = 48;
export const PLAYER_HEIGHT = 48;
export const PLAYER_X = 140;

export const GRAVITY = 2100;
export const JUMP_FORCE = 740;

export const BASE_SPEED = 6;
export const MAX_SPEED = 20;
export const SPEED_RAMP = 0.35;

export const COIN_SIZE = 24;
export const COIN_SCORE = 10;

export const OBSTACLE_MIN_GAP = 1.3;
export const OBSTACLE_MAX_GAP = 2.6;
export const COIN_MIN_GAP = 1.0;
export const COIN_MAX_GAP = 2.0;

export const OBSTACLES = {
  BICYCLE: {
    width: 32,
    height: 24
  },
  CAR: {
    width: 48,
    height: 24
  },
  SCOOTER: {
    width: 28,
    height: 20
  }
} as const;
