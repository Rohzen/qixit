// ProceduralBG.js — deterministic procedural SVG backgrounds from keywords. Zero dependencies.
// CJS: const { drawBackground } = require('./ProceduralBG')
// Browser: window.ProceduralBG.drawBackground(word, seed, width, height)

const PALETTES = [
  { bg:'#040810', a:'#0a1a40', b:'#1040a0', c:'#4080ff', d:'#90c0ff' }, // deep blue
  { bg:'#080410', a:'#200840', b:'#601080', c:'#c030e0', d:'#f090ff' }, // violet
  { bg:'#100400', a:'#300800', b:'#801400', c:'#e03010', d:'#ffa060' }, // fire red
  { bg:'#040c00', a:'#082000', b:'#146000', c:'#28b040', d:'#80ff90' }, // forest green
  { bg:'#000c10', a:'#001830', b:'#005080', c:'#00b0d0', d:'#60f0ff' }, // ocean teal
  { bg:'#0c0800', a:'#281400', b:'#704000', c:'#e08000', d:'#ffd060' }, // amber
  { bg:'#040408', a:'#0a0a20', b:'#202060', c:'#6060c0', d:'#c0c0ff' }, // slate
  { bg:'#000808', a:'#001818', b:'#004848', c:'#00a8a8', d:'#60ffff' }, // cyan
  { bg:'#080008', a:'#200020', b:'#600060', c:'#c000c0', d:'#ff60ff' }, // magenta
  { bg:'#060402', a:'#181008', b:'#402818', c:'#806040', d:'#d0a880' }, // sepia
  { bg:'#020202', a:'#101010', b:'#303030', c:'#808080', d:'#e0e0e0' }, // monochrome
  { bg:'#000610', a:'#001428', b:'#003060', c:'#006090', d:'#40b0e0' }, // indigo
];

// Warm palettes indices: 2, 5
// Cool: 0, 4, 7
// Neon: 1, 8
// Dark: 6, 10

const SEMANTIC_PALETTE = {
  AURORA:  [0, 6, 1],   OCEAN:  [4, 7, 0],   GALAXY: [0, 6, 11],
  COSMOS:  [0, 11, 6],  FIRE:   [2, 5, 9],   LAVA:   [2, 5, 9],
  RAIN:    [4, 7, 11],  BUBBLES:[4, 7, 8],   CYBER:  [8, 1, 7],
  CITY:    [6, 11, 0],  GRID:   [6, 0, 11],  SPARK:  [8, 1, 2],
  DREAM:   [1, 0, 6],   VOID:   [6, 11, 0],  NEON:   [8, 1, 7],
  FOREST:  [3, 9, 5],   STORM:  [11, 6, 0],  PRISM:  [7, 1, 8],
};

const PATTERN_MAP = {
  waves:     ['AURORA','OCEAN','NEBULA','FLOW','NEON','DREAM'],
  stars:     ['COSMOS','GALAXY','SPACE','VOID','STARS','UNIVERSE'],
  grid:      ['GRID','CITY','MATRIX','ARCADE','CIRCUIT','PIXEL'],
  bubbles:   ['BUBBLES','RAIN','WATER','FOAM','BLOOM','DROPS'],
  triangles: ['FIRE','LAVA','STORM','CHAOS','ENERGY','PRISM'],
  lines:     ['CYBER','GLITCH','LASER','SPARK','WIRE','NEON'],
};

function seededRNG(seed) {
  let s = ((seed | 0) ^ 2166136261) >>> 0;
  if (s === 0) s = 1;
  return function () {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
}

function wordSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

function getPattern(word) {
  for (const [pat, words] of Object.entries(PATTERN_MAP)) {
    if (words.some(kw => word === kw || word.startsWith(kw.slice(0, 3)))) return pat;
  }
  const types = ['waves', 'stars', 'grid', 'bubbles', 'triangles', 'lines'];
  return types[word.charCodeAt(0) % types.length];
}

function getPalette(word, rng) {
  const pool = SEMANTIC_PALETTE[word];
  if (pool) return PALETTES[pool[Math.floor(rng() * pool.length)]];
  return PALETTES[Math.floor(rng() * PALETTES.length)];
}

function r2(n) { return Math.round(n * 100) / 100; }

function rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${r2(a)})`;
}

// ── Pattern builders ──────────────────────────────────────────────────────────

function buildWaves(rng, p, W, H) {
  let out = '';
  // Layered filled wave shapes (aurora / ocean feel)
  const count = 10 + Math.floor(rng() * 6);
  for (let i = 0; i < count; i++) {
    const t    = i / count;
    const yBase = H * (0.08 + t * 0.85) + (rng() - 0.5) * H * 0.06;
    const amp   = H * (0.04 + rng() * 0.09);
    const freq  = 0.8 + rng() * 1.8;
    const phase = rng() * Math.PI * 2;
    const col   = t < 0.4 ? p.b : t < 0.7 ? p.c : p.d;
    const alpha = 0.06 + rng() * 0.14;
    const steps = 20;
    const pts   = [];
    for (let s = 0; s <= steps; s++) {
      const x = r2(W * s / steps);
      const y = r2(yBase + Math.sin((s / steps) * Math.PI * 2 * freq + phase) * amp);
      pts.push(x + ',' + y);
    }
    pts.push(W + ',' + H, '0,' + H);
    out += `<polygon points="${pts.join(' ')}" fill="${rgba(col, alpha)}"/>`;
  }
  // Bright crest lines
  for (let i = 0; i < 4; i++) {
    const yBase = H * (0.15 + rng() * 0.7);
    const amp   = H * 0.02;
    const freq  = 1 + rng() * 2;
    const phase = rng() * Math.PI * 2;
    const steps = 20;
    const pts   = [];
    for (let s = 0; s <= steps; s++) {
      const x = r2(W * s / steps);
      const y = r2(yBase + Math.sin((s / steps) * Math.PI * 2 * freq + phase) * amp);
      pts.push(x + ',' + y);
    }
    out += `<polyline points="${pts.join(' ')}" stroke="${rgba(p.d, 0.25 + rng() * 0.2)}" stroke-width="${r2(0.6 + rng() * 1.2)}" fill="none"/>`;
  }
  return out;
}

function buildStars(rng, p, W, H) {
  let out = '';
  // Soft nebula blobs
  for (let i = 0; i < 4; i++) {
    const cx = W * rng(), cy = H * rng();
    const rx = W * (0.12 + rng() * 0.28), ry = H * (0.08 + rng() * 0.22);
    const col = i < 2 ? p.b : p.c;
    out += `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${rgba(col, 0.05 + rng() * 0.07)}"/>`;
  }
  // Small stars
  const n = 120 + Math.floor(rng() * 80);
  for (let i = 0; i < n; i++) {
    const x = r2(W * rng()), y = r2(H * rng());
    const r = r2(0.4 + rng() * 1.4);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${rgba(p.d, 0.3 + rng() * 0.7)}"/>`;
  }
  // Large glowing stars
  for (let i = 0; i < 10; i++) {
    const x = r2(W * rng()), y = r2(H * rng()), r = r2(1.5 + rng() * 3.5);
    out += `<circle cx="${x}" cy="${y}" r="${r2(r * 3)}" fill="${rgba(p.c, 0.04)}"/>`;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${rgba(p.d, 0.85 + rng() * 0.15)}"/>`;
  }
  return out;
}

function buildGrid(rng, p, W, H) {
  let out = '';
  const cols = 7 + Math.floor(rng() * 5);
  const rows = Math.max(3, Math.round(cols * H / W));
  const cw = W / cols, ch = H / rows, gap = 1.5 + rng() * 2;
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      const x = cx * cw + gap / 2, y = ry * ch + gap / 2;
      const t = (ry * cols + cx) / (rows * cols);
      const col = t < 0.33 ? p.a : t < 0.66 ? p.b : p.c;
      const bright = rng() > 0.88;
      out += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(cw - gap)}" height="${r2(ch - gap)}" fill="${rgba(bright ? p.d : col, bright ? 0.3 + rng() * 0.2 : 0.12 + rng() * 0.18)}" rx="2"/>`;
    }
  }
  return out;
}

function buildBubbles(rng, p, W, H) {
  let out = '';
  const n = 25 + Math.floor(rng() * 15);
  for (let i = 0; i < n; i++) {
    const cx = r2(W * (-0.1 + rng() * 1.2));
    const cy = r2(H * (-0.1 + rng() * 1.2));
    const r  = r2(W * (0.025 + rng() * 0.16));
    const col = rng() < 0.35 ? p.c : rng() < 0.55 ? p.b : p.a;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rgba(col, 0.04 + rng() * 0.1)}" stroke="${rgba(p.d, 0.06 + rng() * 0.08)}" stroke-width="${r2(0.5 + rng())}"/>`;
  }
  // Rim highlights
  for (let i = 0; i < 8; i++) {
    const cx = r2(W * rng()), cy = r2(H * rng()), r = r2(W * (0.008 + rng() * 0.05));
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${rgba(p.d, 0.18 + rng() * 0.2)}" stroke-width="0.7"/>`;
  }
  return out;
}

function buildTriangles(rng, p, W, H) {
  let out = '';
  const n = 35 + Math.floor(rng() * 20);
  for (let i = 0; i < n; i++) {
    const cx = r2(W * (-0.05 + rng() * 1.1));
    const cy = r2(H * (-0.05 + rng() * 1.1));
    const sz = r2(W * (0.03 + rng() * 0.13));
    const ang = rng() * Math.PI * 2;
    const pts = [0, 1, 2].map(v => {
      const a = ang + v * (Math.PI * 2 / 3);
      return r2(cx + Math.cos(a) * sz) + ',' + r2(cy + Math.sin(a) * sz);
    }).join(' ');
    const col = rng() < 0.4 ? p.c : rng() < 0.65 ? p.b : p.a;
    out += `<polygon points="${pts}" fill="${rgba(col, 0.06 + rng() * 0.14)}" stroke="${rgba(p.d, 0.04 + rng() * 0.07)}" stroke-width="0.5"/>`;
  }
  return out;
}

function buildLines(rng, p, W, H) {
  let out = '';
  const D   = Math.sqrt(W * W + H * H);
  const n   = 60 + Math.floor(rng() * 40);
  const ang = rng() * Math.PI * 0.5 - Math.PI * 0.25;
  const cos = Math.cos(ang), sin = Math.sin(ang);
  for (let i = 0; i < n; i++) {
    const off = (W + H) * ((i / n) - 0.5 + (rng() - 0.5) * 0.02);
    const x0 = r2(W / 2 + cos * -D * 0.7 - sin * off);
    const y0 = r2(H / 2 + sin * -D * 0.7 + cos * off);
    const x1 = r2(W / 2 + cos *  D * 0.7 - sin * off);
    const y1 = r2(H / 2 + sin *  D * 0.7 + cos * off);
    const bright = rng() < 0.07;
    const col    = bright ? p.d : (rng() < 0.4 ? p.c : p.b);
    const sw     = r2(bright ? (0.8 + rng() * 1.5) : (0.3 + rng() * 0.5));
    const alpha  = bright ? (0.3 + rng() * 0.35) : (0.04 + rng() * 0.09);
    out += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${rgba(col, alpha)}" stroke-width="${sw}"/>`;
  }
  return out;
}

// ── Public API ────────────────────────────────────────────────────────────────

function drawBackground(word, seed, width, height) {
  width  = width  > 0 ? width  : 800;
  height = height > 0 ? height : 600;
  const w = word ? String(word).toUpperCase() : 'COSMOS';

  const seedNum = typeof seed === 'number'
    ? seed
    : wordSeed(String(seed != null ? seed : w));
  const rng = seededRNG(wordSeed(w) ^ seedNum);

  // When a level seed is provided (> 0), freely vary pattern and palette across
  // all 6 types / 12 palettes so every level looks visually distinct.
  // seed === 0 is reserved for UI previews, which use keyword-based selection.
  const TYPES = ['waves', 'stars', 'grid', 'bubbles', 'triangles', 'lines'];
  const pattern = seedNum > 0
    ? TYPES[(wordSeed(w) + seedNum) % TYPES.length]
    : getPattern(w);
  const palette = seedNum > 0
    ? PALETTES[Math.floor(rng() * PALETTES.length)]
    : getPalette(w, rng);

  const W = width, H = height;
  let body = `<rect width="${W}" height="${H}" fill="${palette.bg}"/>`;

  if (pattern === 'waves')     body += buildWaves(rng, palette, W, H);
  else if (pattern === 'stars')     body += buildStars(rng, palette, W, H);
  else if (pattern === 'grid')      body += buildGrid(rng, palette, W, H);
  else if (pattern === 'bubbles')   body += buildBubbles(rng, palette, W, H);
  else if (pattern === 'triangles') body += buildTriangles(rng, palette, W, H);
  else if (pattern === 'lines')     body += buildLines(rng, palette, W, H);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { drawBackground };
if (typeof globalThis !== 'undefined') globalThis.ProceduralBG = { drawBackground };
