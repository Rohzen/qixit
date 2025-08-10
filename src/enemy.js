import { ENEMY_SPEED, ENEMY_RADIUS, PLAY_RECT } from "./state.js";
import * as PIXI from "pixi.js";

export class Enemy {
  constructor(app) {
    this.sprite = PIXI.Sprite.from('enemy');
    this.sprite.anchor.set(0.5);
    this.sprite.zIndex = 5;
    app.stage.addChild(this.sprite);

    const ex = PLAY_RECT.x + 60 + Math.random()*(PLAY_RECT.w-120);
    const ey = PLAY_RECT.y + 60 + Math.random()*(PLAY_RECT.h-120);
    this.sprite.position.set(ex, ey);

    const ang = Math.random() * Math.PI * 2;
    this.vx = Math.cos(ang) * ENEMY_SPEED;
    this.vy = Math.sin(ang) * ENEMY_SPEED;
  }

  update(dt) {
    const r = ENEMY_RADIUS;
    const left = PLAY_RECT.x + r, right = PLAY_RECT.x + PLAY_RECT.w - r;
    const top = PLAY_RECT.y + r, bottom = PLAY_RECT.y + PLAY_RECT.h - r;

    let x = this.sprite.x + this.vx * dt;
    let y = this.sprite.y + this.vy * dt;

    let bounced = false;
    if (x <= left)   { x = left;   this.vx = Math.abs(this.vx);   bounced = true; }
    else if (x >= right) { x = right; this.vx = -Math.abs(this.vx); bounced = true; }
    if (y <= top)    { y = top;    this.vy = Math.abs(this.vy);   bounced = true; }
    else if (y >= bottom){ y = bottom; this.vy = -Math.abs(this.vy); bounced = true; }

    if (bounced) {
      const angle = Math.atan2(this.vy, this.vx);
      const jitter = (Math.random() * 40 - 20) * (Math.PI/180);
      const na = angle + jitter;
      this.vx = Math.cos(na) * ENEMY_SPEED;
      this.vy = Math.sin(na) * ENEMY_SPEED;
    }

    this.sprite.position.set(x, y);
  }
}
