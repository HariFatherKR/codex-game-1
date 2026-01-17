export type GameStatus = 'READY' | 'RUNNING' | 'GAME_OVER';

export type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isGrounded: boolean;
};

export type Coin = {
  id: number;
  x: number;
  y: number;
  size: number;
  shimmerOffset: number;
  collected: boolean;
};

export type Obstacle = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'BIKE' | 'CAR' | 'SCOOTER';
};

export type GameSnapshot = {
  score: number;
  speed: number;
  status: GameStatus;
};

export type GameConfig = {
  baseWidth: number;
  baseHeight: number;
  groundHeight: number;
  player: {
    width: number;
    height: number;
    x: number;
  };
  physics: {
    gravity: number;
    jumpForce: number;
  };
  speed: {
    base: number;
    max: number;
    ramp: number;
  };
  coin: {
    size: number;
    score: number;
    liftOptions: number[];
    minGap: number;
    maxGap: number;
  };
  obstacle: {
    minGap: number;
    maxGap: number;
    minDistance: number;
    sizes: {
      BIKE: { width: number; height: number };
      CAR: { width: number; height: number };
      SCOOTER: { width: number; height: number };
    };
  };
};
