// src/player.js
import { PLAYER_SPEED, PLAYER_SIZE, PLAY_RECT } from "./state.js";
import { inRect, projectToFrame, snapPoint, whichEdge, clamp } from "./geometry.js";
import { debugUpdate } from "./input.js";
import * as PIXI from "pixi.js";

const PERIMETER_HAND = 'cw'; // 'cw' or 'ccw'

export class Player {
  constructor(app) {
    this.app = app;
    this.x = PLAY_RECT.x;
    this.y = PLAY_RECT.y + PLAY_RECT.h / 2;
    this.edgeDir = { x: 0, y: +1 };

    this.sprite = PIXI.Sprite.from("player");
    this.sprite.anchor.set(0.5);
    this.sprite.width = PLAYER_SIZE;
    this.sprite.height = PLAYER_SIZE;
    this.sprite.zIndex = 10;
    app.stage.addChild(this.sprite);
  }

  setColorTint(drawing) { this.sprite.tint = drawing ? 0xf59e0b : 0x7dd3fc; }

  update(dt, dir, drawing, state) {
    const speed = PLAYER_SPEED * dt;
    const handSign = (PERIMETER_HAND === 'cw') ? +1 : -1;

    // --- SUL BORDO (non stiamo disegnando) ---
    if (!drawing) {
      const e = whichEdge({ x: this.x, y: this.y });

      if (e === "L" || e === "R") {
        // bordo verticale → muovi su Y; ←/→ mappati a su/giù in base alla “mano”
        let moveY;
        if (dir.y !== 0) {
          moveY = Math.sign(dir.y);
        } else if (dir.x !== 0) {
          const s = Math.sign(dir.x) * handSign;
          moveY = (e === "L") ? +Math.abs(s) : -Math.abs(s);
        } else {
          moveY = (this.edgeDir.y !== 0 ? this.edgeDir.y : +1);
        }
        this.edgeDir = { x: 0, y: moveY };

        let ny = this.y + moveY * speed;
        const top = PLAY_RECT.y, bottom = PLAY_RECT.y + PLAY_RECT.h;

        if (ny <= top) {
          this.y = top;
          this.x = (e === "L") ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
          const turnX = (e === "L") ? +1 : -1;
          this.edgeDir = { x: turnX, y: 0 };
          this.x = clamp(this.x + turnX * speed, PLAY_RECT.x, PLAY_RECT.x + PLAY_RECT.w);
        } else if (ny >= bottom) {
          this.y = bottom;
          this.x = (e === "L") ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
          const turnX = (e === "L") ? +1 : -1;
          this.edgeDir = { x: turnX, y: 0 };
          this.x = clamp(this.x + turnX * speed, PLAY_RECT.x, PLAY_RECT.x + PLAY_RECT.w);
        } else {
          this.y = ny;
          this.x = (e === "L") ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
        }
      }
      else if (e === "T" || e === "B") {
        // bordo orizzontale → muovi su X; ↑/↓ mappati a dx/sx in base alla “mano”
        let moveX;
        if (dir.x !== 0) {
          moveX = Math.sign(dir.x);
        } else if (dir.y !== 0) {
          const s = Math.sign(dir.y) * handSign;
          moveX = (e === "T") ? +Math.abs(s) : -Math.abs(s);
        } else {
          moveX = (this.edgeDir.x !== 0 ? this.edgeDir.x : +1);
        }
        this.edgeDir = { x: moveX, y: 0 };

        let nx = this.x + moveX * speed;
        const left = PLAY_RECT.x, right = PLAY_RECT.x + PLAY_RECT.w;

        if (nx <= left) {
          this.x = left;
          this.y = (e === "T") ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
          const turnY = (e === "T") ? +1 : -1;
          this.edgeDir = { x: 0, y: turnY };
          this.y = clamp(this.y + turnY * speed, PLAY_RECT.y, PLAY_RECT.y + PLAY_RECT.h);
        } else if (nx >= right) {
          this.x = right;
          this.y = (e === "T") ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
          const turnY = (e === "T") ? +1 : -1;
          this.edgeDir = { x: 0, y: turnY };
          this.y = clamp(this.y + turnY * speed, PLAY_RECT.y, PLAY_RECT.y + PLAY_RECT.h);
        } else {
          this.x = nx;
          this.y = (e === "T") ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
        }
      }
      else {
        // riallinea al bordo più vicino se sei disallineato
        const edge = projectToFrame(this.x, this.y);
        this.x = edge.x; this.y = edge.y;
      }

      state.onFrame = true;
      debugUpdate({ mode: "FRAME", edge: whichEdge({x:this.x,y:this.y}), edgeDir: {...this.edgeDir}, player: {x:Math.round(this.x), y:Math.round(this.y)} });
      return;
    }

    // --- DISEGNO INTERNO (niente snap durante il movimento) ---
    const moveX = dir.x !== 0 ? Math.sign(dir.x) : 0;
    const moveY = dir.y !== 0 ? Math.sign(dir.y) : 0;
    const nx = this.x + moveX * speed;
    const ny = this.y + moveY * speed;

    if (!inRect(nx, ny, PLAY_RECT)) {
      const hit = projectToFrame(nx, ny);
      this.x = hit.x; this.y = hit.y; state.onFrame = true;
      debugUpdate({ mode: "CLOSE", edge: whichEdge({x:this.x,y:this.y}), edgeDir: {...this.edgeDir}, player: {x:Math.round(this.x), y:Math.round(this.y)} });
      return "finish";
    } else {
      this.x = nx; this.y = ny; state.onFrame = false;
      debugUpdate({ mode: "DRAW", edge: whichEdge({x:this.x,y:this.y}), edgeDir: {...this.edgeDir}, player: {x:Math.round(this.x), y:Math.round(this.y)} });
      return "push";
    }
  }

  // Snap SOLO quando siamo sul bordo (edge-aware)
  applySnap(onFrame = true) {
    if (!onFrame) return; // in disegno: nessuno snap
    const e = whichEdge({ x: this.x, y: this.y });
    if (e === 'L' || e === 'R') {
      this.x = (e === 'L') ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
    } else if (e === 'T' || e === 'B') {
      this.y = (e === 'T') ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
    } else {
      const s = snapPoint(this.x, this.y);
      this.x = s.x; this.y = s.y;
    }
  }

  syncSprite() { this.sprite.position.set(this.x, this.y); }
}
