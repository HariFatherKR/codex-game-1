import type { GameConfig } from './types';

const DESKTOP_BASE = {
  baseWidth: 960,
  baseHeight: 540
};

const MOBILE_BASE = {
  baseWidth: 360,
  baseHeight: 640
};

const BASE_CONFIG: GameConfig = {
  ...DESKTOP_BASE,
  groundHeight: 80,
  player: {
    width: 48,
    height: 48,
    x: 180
  },
  physics: {
    gravity: 2200,
    jumpForce: 760
  },
  speed: {
    base: 6,
    max: 20,
    ramp: 0.35
  },
  coin: {
    size: 24,
    score: 10,
    liftOptions: [60, 110],
    minGap: 1.0,
    maxGap: 2.0
  },
  obstacle: {
    minGap: 1.2,
    maxGap: 2.4,
    minDistance: 180,
    sizes: {
      BIKE: {
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
    }
  }
};

export const createGameConfig = (isMobile: boolean): GameConfig => {
  if (!isMobile) {
    return BASE_CONFIG;
  }

  return {
    ...BASE_CONFIG,
    ...MOBILE_BASE,
    player: {
      ...BASE_CONFIG.player,
      x: 110
    },
    physics: {
      ...BASE_CONFIG.physics,
      jumpForce: 840
    },
    coin: {
      ...BASE_CONFIG.coin,
      liftOptions: [70, 140, 210],
      minGap: 1.1,
      maxGap: 2.2
    },
    obstacle: {
      ...BASE_CONFIG.obstacle,
      minGap: 1.3,
      maxGap: 2.6,
      minDistance: 220
    }
  };
};
