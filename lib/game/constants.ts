export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_HEIGHT = 80;

export const PLAYER_WIDTH = 48;
export const PLAYER_HEIGHT = 48;
export const PLAYER_X = 140;

export const GRAVITY = 2300;
export const JUMP_FORCE = 780;

export const BASE_SPEED = 6;
export const MAX_SPEED = 20;
export const SPEED_RAMP = 0.35;

export const COIN_RADIUS = 12;
export const COIN_SCORE = 10;

export const OBSTACLE_MIN_GAP = 1.2;
export const OBSTACLE_MAX_GAP = 2.4;
export const COIN_MIN_GAP = 1.0;
export const COIN_MAX_GAP = 2.0;

export const OBSTACLE_TYPES = [
  {
    type: 'BIKE',
    width: 32,
    height: 24,
    weight: 0.4
  },
  {
    type: 'SCOOTER',
    width: 28,
    height: 20,
    weight: 0.35
  },
  {
    type: 'CAR',
    width: 48,
    height: 24,
    weight: 0.25
  }
] as const;
