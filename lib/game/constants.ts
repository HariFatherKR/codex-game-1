export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_HEIGHT = 96;

export const PLAYER_WIDTH = 48;
export const PLAYER_HEIGHT = 48;
export const PLAYER_X = 140;

export const GRAVITY = 2200;
export const JUMP_FORCE = 760;

export const BASE_SPEED = 6;
export const MAX_SPEED = 20;
export const SPEED_RAMP = 0.35;

export const COIN_RADIUS = 8;
export const COIN_SCORE = 10;

export const OBSTACLE_MIN_GAP = 1.2;
export const OBSTACLE_MAX_GAP = 2.4;
export const COIN_MIN_GAP = 1.0;
export const COIN_MAX_GAP = 2.0;

export const OBSTACLES = {
  BICYCLE: { width: 32, height: 24, speedBoost: 0 },
  CAR: { width: 48, height: 24, speedBoost: 0 },
  SCOOTER: { width: 28, height: 20, speedBoost: 0.2 }
} as const;

export const MIN_OBSTACLE_DISTANCE = 180;
