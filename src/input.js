// src/input.js
export class Input {
  constructor(app) {
    this.keys = {};
    this.dir = { x: 1, y: 0 };
    ensureDebugOverlay();

    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup',   (e) => { this.keys[e.code] = false; });

    let pointerDown = false;
    const canvas = app.canvas || app.view;
    canvas.addEventListener('pointerdown', () => { pointerDown = true; });
    canvas.addEventListener('pointerup',   () => { pointerDown = false; });
    canvas.addEventListener('pointerleave',() => { pointerDown = false; });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      const dx = e.movementX, dy = e.movementY;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? {x:1,y:0} : {x:-1,y:0};
      else this.dir = dy > 0 ? {x:0,y:1} : {x:0,y:-1};
    });
  }

  update() {
    if (this.keys['ArrowLeft'] || this.keys['KeyA'])   this.dir = {x:-1,y:0};
    else if (this.keys['ArrowRight'] || this.keys['KeyD']) this.dir = {x:1,y:0};
    else if (this.keys['ArrowUp'] || this.keys['KeyW'])    this.dir = {x:0,y:-1};
    else if (this.keys['ArrowDown'] || this.keys['KeyS'])  this.dir = {x:0,y:1};

    debugUpdate({ inputDir: this.dir });
    return { dir: this.dir, startDraw: !!this.keys['Space'], restart: !!this.keys['KeyR'] };
  }
}

export function ensureDebugOverlay() {
  if (document.getElementById('debug-overlay')) return;
  const el = document.createElement('div');
  el.id = 'debug-overlay';
  el.style.position = 'absolute';
  el.style.right = '10px';
  el.style.bottom = '10px';
  el.style.color = '#e0e6f0';
  el.style.font = '12px system-ui, Segoe UI, Roboto, sans-serif';
  el.style.background = 'rgba(0,0,0,.45)';
  el.style.padding = '8px 10px';
  el.style.borderRadius = '10px';
  el.style.whiteSpace = 'pre';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  window.__dbgData = {};
  renderDebug();
}

export function debugUpdate(obj) {
  window.__dbgData = Object.assign(window.__dbgData || {}, obj || {});
  renderDebug();
}

function renderDebug() {
  const el = document.getElementById('debug-overlay');
  if (!el) return;
  const d = window.__dbgData || {};
  const lines = [];
  if (d.mode) lines.push(`mode: ${d.mode}`);
  if (d.edge) lines.push(`edge: ${d.edge}`);
  if (d.edgeDir) lines.push(`edgeDir: x:${fmt(d.edgeDir.x)} y:${fmt(d.edgeDir.y)}`);
  if (d.inputDir) lines.push(`inputDir: x:${fmt(d.inputDir.x)} y:${fmt(d.inputDir.y)}`);
  if (d.player) lines.push(`player: x:${d.player.x} y:${d.player.y}`);
  if (d.dt!==undefined) lines.push(`dt: ${d.dt}`);
  el.textContent = lines.join('\n');
}

function fmt(v){ return (v===undefined||v===null)?'-':(v>=0?`+${v}`:`${v}`); }
