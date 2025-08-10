// src/geometry.js
import { CELL, PLAY_RECT } from "./state.js";

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const snap = (v) => Math.round(v / CELL) * CELL;
export const snapPoint = (x, y) => ({ x: snap(x), y: snap(y) });

export function inRect(x, y, r = PLAY_RECT) {
  return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
}

export function projectToFrame(x, y) {
  const L = { x: PLAY_RECT.x, y: clamp(y, PLAY_RECT.y, PLAY_RECT.y + PLAY_RECT.h) };
  const R = { x: PLAY_RECT.x + PLAY_RECT.w, y: clamp(y, PLAY_RECT.y, PLAY_RECT.y + PLAY_RECT.h) };
  const T = { x: clamp(x, PLAY_RECT.x, PLAY_RECT.x + PLAY_RECT.w), y: PLAY_RECT.y };
  const B = { x: clamp(x, PLAY_RECT.x, PLAY_RECT.x + PLAY_RECT.w), y: PLAY_RECT.y + PLAY_RECT.h };
  const c = [L, R, T, B].map(p => snapPoint(p.x, p.y));
  c.sort((a,b)=> (a.x-x)**2 + (a.y-y)**2 - ((b.x-x)**2 + (b.y-y)**2));
  return c[0];
}

export function whichEdge(p) {
  const eps = 0.5;
  if (Math.abs(p.x - PLAY_RECT.x) < eps) return 'L';
  if (Math.abs(p.x - (PLAY_RECT.x + PLAY_RECT.w)) < eps) return 'R';
  if (Math.abs(p.y - PLAY_RECT.y) < eps) return 'T';
  if (Math.abs(p.y - (PLAY_RECT.y + PLAY_RECT.h)) < eps) return 'B';
  return 'N';
}

export function inwardDirFromEdge(p) {
  const e = whichEdge(p);
  if (e === 'T') return {x:0,y:1};
  if (e === 'B') return {x:0,y:-1};
  if (e === 'L') return {x:1,y:0};
  if (e === 'R') return {x:-1,y:0};
  return {x:0,y:0};
}

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return a / 2;
}

export function shortestFrameArc(start, end) {
  const per = 2 * (PLAY_RECT.w + PLAY_RECT.h);

  const tOf = (p) => {
    const e = whichEdge(p);
    if (e === 'T') return (p.x - PLAY_RECT.x);
    if (e === 'R') return PLAY_RECT.w + (p.y - PLAY_RECT.y);
    if (e === 'B') return PLAY_RECT.w + PLAY_RECT.h + (PLAY_RECT.x + PLAY_RECT.w - p.x);
    if (e === 'L') return PLAY_RECT.w + 2*PLAY_RECT.h + (PLAY_RECT.y + PLAY_RECT.h - p.y);
    return 0;
  };

  const unmapT = (t) => {
    let tt = t;
    const w = PLAY_RECT.w, h = PLAY_RECT.h, x0 = PLAY_RECT.x, y0 = PLAY_RECT.y;
    if (tt <= w) return { x: x0 + tt, y: y0 };
    tt -= w;
    if (tt <= h) return { x: x0 + w, y: y0 + tt };
    tt -= h;
    if (tt <= w) return { x: x0 + w - tt, y: y0 + h };
    tt -= w;
    return { x: x0, y: y0 + h - tt };
  };

  const ts = tOf(start), te = tOf(end);
  const d1 = Math.abs(te - ts);
  const d2 = per - d1;

  const step = CELL;
  const addAlong = (fromT, dist, clockwise) => {
    const pts = [];
    const dir = clockwise ? 1 : -1;
    const steps = Math.max(1, Math.round(dist / step));
    for (let i=1;i<=steps;i++) {
      const t = (fromT + dir * (i * step)) % per;
      const tt = (t + per) % per;
      pts.push(unmapT(tt));
    }
    return pts.map(p => snapPoint(p.x, p.y));
  };

  const arc = d1 <= d2 ? addAlong(ts, d1, te > ts) : addAlong(ts, d2, !(te > ts));
  arc.push({ x: end.x, y: end.y });
  return arc;
}
