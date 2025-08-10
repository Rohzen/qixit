// src/state.js
export const WIDTH = 800;
export const HEIGHT = 600;
export const PLAY_RECT = { x: 60, y: 40, w: 680, h: 520 };

export const CELL = 10;
export const GRID_W = Math.floor(PLAY_RECT.w / CELL);
export const GRID_H = Math.floor(PLAY_RECT.h / CELL);

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
  // griglia: 0 = libera, 1 = reclamata
  grid: Array.from({ length: GRID_H }, () => new Uint8Array(GRID_W)),
  // HUD
  coveredArea: 0,
  score: 0,
  lives: 3,
  gameOver: false,
};

export function addScore(by) {
  STATE.score = Math.max(0, STATE.score + by);
}
