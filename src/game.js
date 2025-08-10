// src/game.js
import * as PIXI from "pixi.js";
import { STATE, PLAY_RECT, CELL, ENEMY_RADIUS } from "./state.js";
import { snapPoint, inwardDirFromEdge } from "./geometry.js";
import { applyCut, renderField } from "./field.js";

export class Game {
  constructor(app, player, enemy) {
    this.app = app;
    this.player = player;
    this.enemy = enemy;

    this.gfx = new PIXI.Graphics();
    this.gfx.zIndex = 1;
    app.stage.addChild(this.gfx);

    app.stage.sortableChildren = true;
  }

  startDrawing() {
    STATE.drawing = true;
    STATE.onFrame = false;

    const p0 = { x: this.player.x, y: this.player.y };
    const inward = inwardDirFromEdge(p0);
    const dir = (inward.x || inward.y) ? inward : { x: 0, y: 1 };
    const p1 = { x: p0.x + dir.x * CELL, y: p0.y + dir.y * CELL };

    STATE.path = [snapPoint(p0.x, p0.y), snapPoint(p1.x, p1.y)];
    this.player.x = STATE.path[1].x;
    this.player.y = STATE.path[1].y;
  }

  finishDrawing() {
    STATE.drawing = false;
    if (STATE.path.length < 2) { STATE.path = []; return; }

    // polilinea = path + ultimo segmento fino al punto corrente del player
    const polyline = [...STATE.path, { x: this.player.x, y: this.player.y }];

    // taglio Qix: conserva regione del nemico, reclama l’altra
    applyCut(polyline, { x: this.enemy.sprite.x, y: this.enemy.sprite.y });

    STATE.path = [];
  }

  pushPathPoint(x, y) {
    const last = STATE.path[STATE.path.length - 1];
    const s = snapPoint(x, y);
    if (!last || last.x !== s.x || last.y !== s.y) STATE.path.push(s);
  }

  // --- collisione nemico con la traccia corrente (cerchio-segmento)
  _distPointSeg(px, py, ax, ay, bx, by) {
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx*abx + aby*aby || 1e-9;
    let t = (apx*abx + apy*aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t*abx, cy = ay + t*aby;
    return Math.hypot(px - cx, py - cy);
  }
  checkEnemyHitPath() {
    if (!STATE.drawing || STATE.path.length < 1) return false;
    const cx = this.enemy.sprite.x, cy = this.enemy.sprite.y, r = ENEMY_RADIUS;
    for (let i = 0; i < STATE.path.length - 1; i++) {
      const a = STATE.path[i], b = STATE.path[i+1];
      if (this._distPointSeg(cx, cy, a.x, a.y, b.x, b.y) <= r) return true;
    }
    const last = STATE.path[STATE.path.length - 1];
    if (this._distPointSeg(cx, cy, last.x, last.y, this.player.x, this.player.y) <= r) return true;
    return false;
  }
  onTrailHit() {
    STATE.path = [];
    STATE.drawing = false;
    STATE.onFrame = true;
    STATE.lives -= 1;
    if (STATE.lives <= 0) STATE.gameOver = true;
  }

  drawHUD() {
    const total = PLAY_RECT.w * PLAY_RECT.h;
    const raw = total ? (STATE.coveredArea / total) * 100 : 0;
    const pct = Math.min(100, isFinite(raw) ? raw : 0);
    const hud = document.getElementById('hud');
    if (hud) hud.textContent = `Area: ${pct.toFixed(1)}%  Lives: ${STATE.lives}  Score: ${STATE.score}`;
  }

  render() {
    const g = this.gfx;
    g.clear();

    // FILL a griglia (stabile)
    renderField(g);

    // PATH corrente
    if (STATE.drawing && STATE.path.length > 0) {
      g.lineStyle(2, 0xf59e0b, 1);
      g.moveTo(STATE.path[0].x, STATE.path[0].y);
      for (let i=1;i<STATE.path.length;i++) g.lineTo(STATE.path[i].x, STATE.path[i].y);
      g.lineTo(this.player.x, this.player.y);

      g.lineStyle(0);
      g.beginFill(0xffcc66, 1);
      for (const pt of STATE.path) g.drawRect(pt.x-2, pt.y-2, 4, 4);
      g.drawRect(this.player.x-2, this.player.y-2, 4, 4);
      g.endFill();
    }

    // FRAME per ultimo
    g.lineStyle(2, 0x334155, 1);
    g.drawRect(PLAY_RECT.x, PLAY_RECT.y, PLAY_RECT.w, PLAY_RECT.h);
  }
}
