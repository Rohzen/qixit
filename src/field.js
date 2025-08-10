// src/field.js
import { CELL, GRID_W, GRID_H, PLAY_RECT, STATE, addScore } from "./state.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// px -> cella (indices)
function toCell(x, y) {
  return {
    cx: Math.floor((x - PLAY_RECT.x) / CELL),
    cy: Math.floor((y - PLAY_RECT.y) / CELL),
  };
}
function toCellClamped(x, y) {
  let { cx, cy } = toCell(x, y);
  cx = clamp(cx, 0, GRID_W - 1);
  cy = clamp(cy, 0, GRID_H - 1);
  return { cx, cy };
}

// ---------- Rasterizzazione ORTOGONALE ----------
// Converte due punti mondo in una sequenza di celle solo orizz/vert (prima X poi Y).
function orthoCellsBetween(a, b) {
  let { cx: x0, cy: y0 } = toCell(a.x, a.y);
  let { cx: x1, cy: y1 } = toCell(b.x, b.y);

  const cells = [];
  const push = (x,y) => {
    if (x>=0 && x<GRID_W && y>=0 && y<GRID_H) cells.push({x,y});
  };

  // orizzontale
  const sx = x0 <= x1 ? 1 : -1;
  for (let x = x0; x !== x1; x += sx) push(x, y0);
  push(x1, y0);

  // verticale
  const sy = y0 <= y1 ? 1 : -1;
  for (let y = y0; y !== y1; y += sy) push(x1, y);
  // (ultima push non serve: già incluso)

  // dedupe consecutivi
  const out = [];
  for (const c of cells) {
    const last = out[out.length-1];
    if (!last || last.x!==c.x || last.y!==c.y) out.push(c);
  }
  return out;
}

function rasterizePolylineOrtho(pts) {
  const out = [];
  for (let i=0; i<pts.length-1; i++) {
    out.push(...orthoCellsBetween(pts[i], pts[i+1]));
  }
  // dedupe globale
  const set = new Set(), key = c => (c.x<<16)^c.y;
  return out.filter(c => {
    const k = key(c);
    if (set.has(k)) return false;
    set.add(k);
    return true;
  });
}

// ispessisce di 1 cella il muro
function thicken1(cells) {
  const out = new Set(cells.map(c => (c.x<<16)^c.y));
  for (const c of cells) {
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=c.x+dx, ny=c.y+dy;
      if (nx>=0 && nx<GRID_W && ny>=0 && ny<GRID_H) out.add((nx<<16)^ny);
    }
  }
  return Array.from(out).map(k => ({ x:(k>>16), y:(k&0xffff) }));
}

// ---------- Flood fill (4-neighbors) ----------
function floodFill(start, blocked) {
  const seen = Array.from({length: GRID_H}, () => new Uint8Array(GRID_W));
  const q = [];
  const inB = (x,y)=> x>=0 && x<GRID_W && y>=0 && y<GRID_H;

  const push=(x,y)=>{
    if (!inB(x,y)) return;
    if (seen[y][x] || blocked[y][x]) return;
    seen[y][x]=1; q.push({x,y});
  };

  push(start.x, start.y);
  for (let i=0; i<q.length; i++) {
    const {x,y}=q[i];
    push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1);
  }
  return seen; // 1 = raggiungibile
}

// ---------- Cleaning (rimuove spine singole) ----------
function cleanSpikes(grid) {
  const pass = (src) => {
    const dst = src.map(r => Uint8Array.from(r));
    const nN = (x,y) => {
      let n=0;
      if (y>0 && src[y-1][x]) n++;
      if (y<GRID_H-1 && src[y+1][x]) n++;
      if (x>0 && src[y][x-1]) n++;
      if (x<GRID_W-1 && src[y][x+1]) n++;
      return n;
    };
    for (let y=0;y<GRID_H;y++)
      for (let x=0;x<GRID_W;x++)
        if (src[y][x] && nN(x,y)<=1) dst[y][x]=0;
    return dst;
  };
  return pass(pass(grid));
}

// ---------- Taglio “alla Qix” ----------
export function applyCut(polylineWorldPoints, enemyWorldPos) {
  // blocked di base = celle già reclamate (NON blocchiamo il frame!)
  const blocked = Array.from({ length: GRID_H }, (_, y) =>
    Array.from({ length: GRID_W }, (_, x) => (STATE.grid[y][x] ? 1 : 0))
  );

  // Muro = rasterizzazione ORTOGONALE della traccia + ispessimento 1
  const wall = thicken1(rasterizePolylineOrtho(polylineWorldPoints));
  for (const c of wall) {
    if (c.x>=0 && c.x<GRID_W && c.y>=0 && c.y<GRID_H) blocked[c.y][c.x] = 1;
  }

  // Flood-fill dalla cella (clampata) del nemico
  const e = toCellClamped(enemyWorldPos.x, enemyWorldPos.y);
  const reach = floodFill({ x:e.cx, y:e.cy }, blocked);

  // Reclama tutto ciò che non raggiunge il nemico
  let newly = 0;
  for (let y=0;y<GRID_H;y++) {
    for (let x=0;x<GRID_W;x++) {
      if (!STATE.grid[y][x] && !reach[y][x]) {
        STATE.grid[y][x] = 1;
        newly++;
      }
    }
  }

  // Cleaning
  STATE.grid = cleanSpikes(STATE.grid);

  const areaAdded = newly * CELL * CELL;
  STATE.coveredArea += areaAdded;
  addScore(Math.max(1, Math.round(areaAdded / 10)));
  return areaAdded;
}

// Render a griglia
export function renderField(gfx) {
  gfx.lineStyle(0);
  gfx.beginFill(0x1d4ed8, 0.35);
  for (let y=0;y<GRID_H;y++) {
    for (let x=0;x<GRID_W;x++) {
      if (STATE.grid[y][x]) {
        const px = PLAY_RECT.x + x*CELL;
        const py = PLAY_RECT.y + y*CELL;
        gfx.drawRect(px, py, CELL, CELL);
      }
    }
  }
  gfx.endFill();
}
