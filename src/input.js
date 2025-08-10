import { dirs } from "./state.js";

export class Input {
  constructor(app) {
    this.keys = {};
    this.dir = { ...dirs.right };

    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup',   (e) => { this.keys[e.code] = false; });

    let pointerDown = false;
    app.canvas.addEventListener('pointerdown', () => { pointerDown = true; });
    app.canvas.addEventListener('pointerup',   () => { pointerDown = false; });
    app.canvas.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      const dx = e.movementX, dy = e.movementY;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? dirs.right : dirs.left;
      else this.dir = dy > 0 ? dirs.down : dirs.up;
    });
  }

  update() {
    if (this.keys['ArrowLeft'] || this.keys['KeyA'])   this.dir = dirs.left;
    else if (this.keys['ArrowRight'] || this.keys['KeyD']) this.dir = dirs.right;
    else if (this.keys['ArrowUp'] || this.keys['KeyW'])    this.dir = dirs.up;
    else if (this.keys['ArrowDown'] || this.keys['KeyS'])  this.dir = dirs.down;

    return {
      dir: this.dir,
      startDraw: !!this.keys['Space'],
      restart: !!this.keys['KeyR']
    };
  }
}
