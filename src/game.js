import * as PIXI from "pixi.js";
import { STATE, PLAY_RECT, CELL } from "./state.js";
import { snapPoint, inwardDirFromEdge, polygonArea, shortestFrameArc } from "./geometry.js";

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
    const dir = (inward.x || inward.y) ? inward : {x:0,y:1};
    const p1 = { x: p0.x + dir.x * CELL, y: p0.y + dir.y * CELL };

    STATE.path = [ snapPoint(p0.x, p0.y), snapPoint(p1.x, p1.y) ];
    this.player.x = STATE.path[1].x;
    this.player.y = STATE.path[1].y;
  }

  finishDrawing() {
    STATE.drawing = false;
    if (STATE.path.length < 2) { STATE.path = []; return; }

    const start = STATE.path[0];
    const end = { x: this.player.x, y: this.player.y };
    const arc = shortestFrameArc(start, end);
    const poly = [...STATE.path, ...arc];
    const area = Math.abs(polygonArea(poly));
    STATE.fills.push(poly);
    STATE.coveredArea += area;
    STATE.path = [];
  }

  pushPathPoint(x, y) {
    const last = STATE.path[STATE.path.length - 1];
    const s = snapPoint(x, y);
    if (!last || last.x !== s.x || last.y !== s.y) {
      STATE.path.push(s);
    }
  }

  drawHUD() {
    const total = PLAY_RECT.w * PLAY_RECT.h;
    const raw = total ? (STATE.coveredArea / total) * 100 : 0;
    const pct = Math.min(100, isFinite(raw) ? raw : 0);
    const hud = document.getElementById('hud');
    if (hud) hud.textContent = `Area coperta: ${pct.toFixed(1)}%`;
  }

  render() {
    const g = this.gfx;
    g.clear();

    g.lineStyle(2, 0x334155, 1);
    g.drawRect(PLAY_RECT.x, PLAY_RECT.y, PLAY_RECT.w, PLAY_RECT.h);

    for (const poly of STATE.fills) {
      g.beginFill(0x1d4ed8, 0.35);
      g.moveTo(poly[0].x, poly[0].y);
      for (let i=1; i<poly.length; i++) g.lineTo(poly[i].x, poly[i].y);
      g.closePath(); g.endFill();

      g.lineStyle(1, 0x60a5fa, 0.8);
      g.moveTo(poly[0].x, poly[0].y);
      for (let i=1; i<poly.length; i++) g.lineTo(poly[i].x, poly[i].y);
      g.closePath();
    }

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
  }
}
