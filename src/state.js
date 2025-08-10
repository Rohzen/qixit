export const WIDTH = 800;
export const HEIGHT = 600;
export const PLAY_RECT = { x: 60, y: 40, w: 680, h: 520 };
export const CELL = 10;
export const PLAYER_SPEED = 220;
export const PLAYER_SIZE = 12;
export const ENEMY_SPEED = 200;
export const ENEMY_RADIUS = 11;

export const dirs = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y:  1 },
  left:  { x:-1, y:  0 },
  right: { x: 1, y:  0 }
};

export const STATE = {
  onFrame: true,
  drawing: false,
  path: [],
  fills: [],
  coveredArea: 0,
  gameOver: false,
};
