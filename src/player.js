// src/player.js
import { PLAYER_SPEED, PLAYER_SIZE, PLAY_RECT } from "./state.js";
import { inRect, projectToFrame, snapPoint, whichEdge, clamp } from "./geometry.js";
import * as PIXI from "pixi.js";

export class Player {
  constructor(app) {
    this.app = app;

    // partenza sul bordo sinistro, a metà altezza (evita l’HUD)
    this.x = PLAY_RECT.x;
    this.y = PLAY_RECT.y + PLAY_RECT.h / 2;

    // sprite
    this.sprite = PIXI.Sprite.from("player");
    this.sprite.anchor.set(0.5);
    this.sprite.width = PLAYER_SIZE;
    this.sprite.height = PLAYER_SIZE;
    this.sprite.zIndex = 10;
    app.stage.addChild(this.sprite);
  }

  setColorTint(drawing) {
    this.sprite.tint = drawing ? 0xf59e0b : 0x7dd3fc;
  }

  /**
   * Aggiorna posizione:
   * - sul bordo: scorre tangente e fa auto-turn agli angoli
   * - in disegno: si muove dentro l’area, chiude quando rientra sul bordo
   * Ritorna:
   *  - 'push'   quando aggiungiamo un punto alla path
   *  - 'finish' quando chiudiamo e torniamo sul bordo
   *  - undefined negli altri casi
   */
  update(dt, dir, drawing, state) {
    const speed = PLAYER_SPEED * dt;

    // Non stiamo disegnando → muovi lungo il perimetro con auto-turn
    if (!drawing) {
      const e = whichEdge({ x: this.x, y: this.y });

      if (e === "L" || e === "R") {
        // bordo verticale → muovi su Y, gira su X agli angoli
        let ny = this.y + dir.y * speed;
        const top = PLAY_RECT.y;
        const bottom = PLAY_RECT.y + PLAY_RECT.h;

        if (ny <= top) {
          // angolo alto → passa al bordo TOP e vai orizzontale
          this.y = top;
          this.x = e === "L" ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
          dir.x = e === "L" ? +1 : -1; // verso destra dal lato sinistro, sinistra dal lato destro
          dir.y = 0;
          this.x = clamp(this.x + dir.x * speed, PLAY_RECT.x, PLAY_RECT.x + PLAY_RECT.w);
        } else if (ny >= bottom) {
          // angolo basso → passa al bordo BOTTOM
          this.y = bottom;
          this.x = e === "L" ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
          dir.x = e === "L" ? +1 : -1;
          dir.y = 0;
          this.x = clamp(this.x + dir.x * speed, PLAY_RECT.x, PLAY_RECT.x + PLAY_RECT.w);
        } else {
          // scorrimento verticale sul lato
          this.y = ny;
          this.x = e === "L" ? PLAY_RECT.x : PLAY_RECT.x + PLAY_RECT.w;
        }
      } else if (e === "T" || e === "B") {
        // bordo orizzontale → muovi su X, gira su Y agli angoli
        let nx = this.x + dir.x * speed;
        const left = PLAY_RECT.x;
        const right = PLAY_RECT.x + PLAY_RECT.w;

        if (nx <= left) {
          // angolo sinistro → passa al bordo LEFT
          this.x = left;
          this.y = e === "T" ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
          dir.y = e === "T" ? +1 : -1; // dal top scendi, dal bottom sali
          dir.x = 0;
          this.y = clamp(this.y + dir.y * speed, PLAY_RECT.y, PLAY_RECT.y + PLAY_RECT.h);
        } else if (nx >= right) {
          // angolo destro → passa al bordo RIGHT
          this.x = right;
          this.y = e === "T" ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
          dir.y = e === "T" ? +1 : -1;
          dir.x = 0;
          this.y = clamp(this.y + dir.y * speed, PLAY_RECT.y, PLAY_RECT.y + PLAY_RECT.h);
        } else {
          // scorrimento orizzontale sul lato
          this.x = nx;
          this.y = e === "T" ? PLAY_RECT.y : PLAY_RECT.y + PLAY_RECT.h;
        }
      } else {
        // non perfettamente allineato? ri-aggancia al bordo più vicino
        const edge = projectToFrame(this.x, this.y);
        this.x = edge.x;
        this.y = edge.y;
      }

      state.onFrame = true;
      return; // nessuna azione speciale
    }

    // Stiamo disegnando → muovi all’interno, chiudi quando rientri sul bordo
    const nx = this.x + dir.x * speed;
    const ny = this.y + dir.y * speed;
    const inside = inRect(nx, ny, PLAY_RECT);

    if (!inside) {
      // rientrato sul bordo → chiudi
      const hit = projectToFrame(nx, ny);
      this.x = hit.x;
      this.y = hit.y;
      state.onFrame = true;
      return "finish";
    } else {
      // continua a tracciare
      this.x = nx;
      this.y = ny;
      state.onFrame = false;
      return "push";
    }
  }

  applySnap() {
    const s = snapPoint(this.x, this.y);
    this.x = s.x;
    this.y = s.y;
  }

  syncSprite() {
    this.sprite.position.set(this.x, this.y);
  }
}
