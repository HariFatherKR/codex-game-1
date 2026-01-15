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
  radius: number;
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
