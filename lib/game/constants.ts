export type GameMode = 'mobile' | 'desktop';

export const BASE_RESOLUTIONS = {
  mobile: { width: 360, height: 640 },
  desktop: { width: 960, height: 540 }
} as const;
export const GROUND_HEIGHT = 80;

export const PLAYER_WIDTH = 48;
export const PLAYER_HEIGHT = 48;
export const PLAYER_X = 180;
export const PLAYER_X_MOBILE = 110;

export const GRAVITY = 2200;
export const JUMP_FORCE = 760;
export const JUMP_FORCE_MOBILE = Math.round(JUMP_FORCE * 1.1);

export const BASE_SPEED = 6;
export const MAX_SPEED = 20;
export const SPEED_RAMP = 0.35;

export const COIN_SIZE = 24;
export const COIN_SCORE = 10;

export const OBSTACLE_MIN_GAP = 1.2;
export const OBSTACLE_MAX_GAP = 2.4;
export const OBSTACLE_MIN_GAP_MOBILE = 1.5;
export const OBSTACLE_MAX_GAP_MOBILE = 2.8;
export const OBSTACLE_MIN_DISTANCE = 180;
export const OBSTACLE_MIN_DISTANCE_MOBILE = 220;
export const COIN_MIN_GAP = 1.0;
export const COIN_MAX_GAP = 2.0;

export const COIN_LIFTS = [60, 110];
export const COIN_LIFTS_MOBILE = [70, 130, 190];

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
