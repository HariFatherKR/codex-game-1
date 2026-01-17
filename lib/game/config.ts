import {
  COIN_MAX_GAP,
  COIN_MIN_GAP,
  JUMP_FORCE,
  OBSTACLE_MAX_GAP,
  OBSTACLE_MIN_GAP
} from './constants';

export type GameMode = 'mobile' | 'desktop';

export type GameConfig = {
  mode: GameMode;
  baseWidth: number;
  baseHeight: number;
  playerX: number;
  jumpForce: number;
  coinLifts: number[];
  obstacleMinDistance: number;
  obstacleMinGap: number;
  obstacleMaxGap: number;
  coinMinGap: number;
  coinMaxGap: number;
};

const DESKTOP_CONFIG: GameConfig = {
  mode: 'desktop',
  baseWidth: 960,
  baseHeight: 540,
  playerX: 180,
  jumpForce: JUMP_FORCE,
  coinLifts: [60, 110],
  obstacleMinDistance: 180,
  obstacleMinGap: OBSTACLE_MIN_GAP,
  obstacleMaxGap: OBSTACLE_MAX_GAP,
  coinMinGap: COIN_MIN_GAP,
  coinMaxGap: COIN_MAX_GAP
};

const MOBILE_CONFIG: GameConfig = {
  mode: 'mobile',
  baseWidth: 360,
  baseHeight: 640,
  playerX: 110,
  jumpForce: Math.round(JUMP_FORCE * 1.1),
  coinLifts: [70, 140, 210],
  obstacleMinDistance: 230,
  obstacleMinGap: OBSTACLE_MIN_GAP + 0.15,
  obstacleMaxGap: OBSTACLE_MAX_GAP + 0.15,
  coinMinGap: COIN_MIN_GAP,
  coinMaxGap: COIN_MAX_GAP
};

export const getGameConfig = (mode: GameMode): GameConfig =>
  mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
