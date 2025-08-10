import * as PIXI from "pixi.js";
import { WIDTH, HEIGHT, STATE } from "./state.js";
import { Input } from "./input.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Game } from "./game.js";

const mount = document.getElementById('app');

const app = new PIXI.Application();
await app.init({ width: WIDTH, height: HEIGHT, background: "#09101d", antialias: true });
mount.appendChild(app.canvas);

await PIXI.Assets.add({ alias: 'player', src: 'assets/player.svg' });
await PIXI.Assets.add({ alias: 'enemy',  src: 'assets/enemy.svg'  });
await PIXI.Assets.load(['player', 'enemy']);

const input = new Input(app);
const player = new Player(app);
const enemy  = new Enemy(app);
const game   = new Game(app, player, enemy);

app.ticker.add((ticker) => {
  const dt = Math.max(0.0001, Math.min(0.06, ticker.deltaMS / 1000));
  const { dir, startDraw, restart } = input.update();

  if (STATE.gameOver && restart) {
    Object.assign(STATE, {
      onFrame:true, drawing:false, path:[], fills:[], coveredArea:0,
      score: 0, lives: 3, gameOver:false
    });
    player.x = 60; player.y = 40 + 520/2;
  }

  if (!STATE.gameOver) {
    if (startDraw && STATE.onFrame && !STATE.drawing) game.startDrawing();

    const action = player.update(dt, dir, STATE.drawing, STATE);
    if (STATE.drawing) {
      if (game.checkEnemyHitPath()) {
        game.onTrailHit(); // perdi una vita e abortisci la chiusura
      } else {
        if (action === 'push')   game.pushPathPoint(player.x, player.y);
        if (action === 'finish') game.finishDrawing();
      }
    }

    // snap edge-aware solo sul bordo
    player.applySnap(STATE.onFrame);
    player.setColorTint(STATE.drawing);
    player.syncSprite();

    enemy.update(dt);
  }

  game.render();
  game.drawHUD();
});
