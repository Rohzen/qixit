// ProceduralSprite.js — geometric low-poly line-art SVG avatars, transparent background.
// Style: single-color stroke outlines, no fills, angular/faceted shapes (like the reference).
// CJS: const { drawSprite } = require('./ProceduralSprite')
// Browser: window.ProceduralSprite.drawSprite(word, seed, size)

'use strict';

const LINE_COLORS = [
  '#F0D9B0', // warm cream
  '#4DDDFF', // cyan
  '#FF7755', // coral
  '#44FF88', // green
  '#FFD044', // amber
  '#CC55FF', // violet
  '#FF5599', // pink
  '#44FFCC', // teal
  '#FF9933', // orange
  '#88AAFF', // periwinkle
];

function seededRNG(seed) {
  let s = ((seed | 0) ^ 2166136261) >>> 0;
  if (!s) s = 1;
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };
}

function wordSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h || 1;
}

function getArchetype(word) {
  if (word === 'SATAN') return 'devil';
  const MAP = {
    CAT:'cat', KITTEN:'cat', TIGER:'cat', LION:'cat', PANTHER:'cat',
    DOG:'dog', WOLF:'dog', HUSKY:'dog', PUPPY:'dog',
    FOX:'fox',
    BEAR:'bear', PANDA:'bear', KOALA:'bear',
    RABBIT:'rabbit', BUNNY:'rabbit', HARE:'rabbit',
    BIRD:'bird', EAGLE:'bird', OWL:'bird', HAWK:'bird', PARROT:'bird',
    REPTILE:'reptile', LIZARD:'reptile', SNAKE:'reptile', DRAGON:'reptile',
  };
  if (MAP[word]) return MAP[word];
  return ['bear','cat','dog','bird','fox','reptile'][word.charCodeAt(0) % 6];
}

function charSum(w) { let n=0; for (let i=0;i<w.length;i++) n+=w.charCodeAt(i); return n; }
function r2(n) { return Math.round(n * 100) / 100; }
function sc(x, S) { return r2(x * S); }
function pt(x, y, S) { return sc(x,S) + ',' + sc(y,S); }
function pts(arr, S) { return arr.map(([x,y]) => pt(x,y,S)).join(' '); }

function poly(arr, S, col, sw) {
  return `<polygon points="${pts(arr,S)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
function pline(arr, S, col, sw) {
  return `<polyline points="${pts(arr,S)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function ln(x1,y1, x2,y2, S, col, sw) {
  return `<line x1="${sc(x1,S)}" y1="${sc(y1,S)}" x2="${sc(x2,S)}" y2="${sc(y2,S)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

// ── Decorative scatter elements (drawn first, appear behind character) ─────────
function decorations(S, col, sw, rng) {
  const out = [];

  function randEdge() {
    const side = Math.floor(rng() * 4);
    if (side === 0) return [rng() * 0.16, rng()];
    if (side === 1) return [0.84 + rng() * 0.16, rng()];
    if (side === 2) return [rng(), rng() * 0.09];
    return [rng(), 0.91 + rng() * 0.09];
  }

  // Small squares / dots
  for (let i = 0; i < 8; i++) {
    const [x, y] = randEdge();
    const s = 0.008 + rng() * 0.010;
    out.push(poly([[x-s,y-s],[x+s,y-s],[x+s,y+s],[x-s,y+s]], S, col, r2(sw*0.65)));
  }
  // Plus/cross signs
  for (let i = 0; i < 5; i++) {
    const [x, y] = randEdge();
    const s = 0.014 + rng() * 0.014;
    out.push(ln(x-s,y, x+s,y, S, col, r2(sw*0.6)));
    out.push(ln(x,y-s, x,y+s, S, col, r2(sw*0.6)));
  }
  // Small irregular polygons (asteroid-like)
  for (let i = 0; i < 4; i++) {
    const [cx, cy] = randEdge();
    const r = 0.028 + rng() * 0.038;
    const n = 5 + Math.floor(rng() * 3);
    const verts = [];
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      const rv = r * (0.65 + rng() * 0.45);
      verts.push([cx + Math.cos(a)*rv, cy + Math.sin(a)*rv]);
    }
    out.push(poly(verts, S, col, r2(sw*0.72)));
  }

  return out.join('');
}

// ── Head (archetype-specific polygon with ears/horns) ─────────────────────────
function head(arch, S, col, sw, rng) {
  const out = [];
  const v = rng() * 0.02; // subtle per-seed ear variation

  if (arch === 'cat') {
    out.push(poly([
      [0.33+v,0.23],[0.40,0.08],[0.46,0.22],
      [0.54,0.22],[0.60,0.08],[0.67-v,0.23],
      [0.70,0.32],[0.64,0.45],[0.50,0.48],[0.36,0.45],[0.30,0.32],
    ], S, col, sw));
    out.push(ln(0.40,0.085, 0.43,0.21, S, col, r2(sw*0.7)));
    out.push(ln(0.60,0.085, 0.57,0.21, S, col, r2(sw*0.7)));

  } else if (arch === 'dog') {
    out.push(poly([
      [0.27,0.22],[0.31,0.11],[0.44,0.11],[0.49,0.22],
      [0.51,0.22],[0.56,0.11],[0.69,0.11],[0.73,0.22],
      [0.73,0.32],[0.66,0.46],[0.50,0.50],[0.34,0.46],[0.27,0.32],
    ], S, col, sw));

  } else if (arch === 'fox') {
    out.push(poly([
      [0.32,0.24],[0.38,0.05],[0.44,0.22],
      [0.56,0.22],[0.62,0.05],[0.68,0.24],
      [0.70,0.32],[0.64,0.46],[0.56,0.50],[0.50,0.52],[0.44,0.50],[0.36,0.46],[0.30,0.32],
    ], S, col, sw));
    out.push(ln(0.38,0.055, 0.42,0.22, S, col, r2(sw*0.7)));
    out.push(ln(0.62,0.055, 0.58,0.22, S, col, r2(sw*0.7)));

  } else if (arch === 'bear') {
    out.push(poly([
      [0.28,0.26],[0.32,0.14],[0.40,0.12],[0.44,0.21],
      [0.56,0.21],[0.60,0.12],[0.68,0.14],[0.72,0.26],
      [0.72,0.36],[0.65,0.47],[0.50,0.51],[0.35,0.47],[0.28,0.36],
    ], S, col, sw));

  } else if (arch === 'rabbit') {
    out.push(poly([[0.37,0.35],[0.38,0.04],[0.44,0.04],[0.45,0.35]], S, col, sw));
    out.push(poly([[0.55,0.35],[0.56,0.04],[0.62,0.04],[0.63,0.35]], S, col, sw));
    out.push(poly([
      [0.30,0.36],[0.30,0.28],[0.35,0.21],[0.43,0.19],[0.46,0.25],
      [0.54,0.25],[0.57,0.19],[0.65,0.21],[0.70,0.28],[0.70,0.36],
      [0.64,0.47],[0.50,0.51],[0.36,0.47],
    ], S, col, sw));

  } else if (arch === 'bird') {
    out.push(poly([
      [0.35,0.22],[0.38,0.13],[0.44,0.09],[0.56,0.09],[0.62,0.13],[0.65,0.22],
      [0.68,0.31],[0.65,0.36],[0.76,0.36],[0.65,0.42],  // integrated beak
      [0.62,0.45],[0.50,0.49],[0.38,0.45],[0.32,0.31],
    ], S, col, sw));
    // Crest feathers
    out.push(ln(0.44,0.09, 0.42,0.015, S, col, r2(sw*0.72)));
    out.push(ln(0.50,0.09, 0.50,0.005, S, col, r2(sw*0.72)));
    out.push(ln(0.56,0.09, 0.58,0.015, S, col, r2(sw*0.72)));

  } else if (arch === 'reptile') {
    out.push(poly([
      [0.36,0.22],[0.38,0.15],[0.42,0.18],[0.46,0.10],[0.50,0.14],
      [0.54,0.10],[0.58,0.18],[0.62,0.15],[0.64,0.22],
      [0.68,0.31],[0.63,0.45],[0.50,0.49],[0.37,0.45],[0.32,0.31],
    ], S, col, sw));

  } else if (arch === 'devil') {
    out.push(poly([
      [0.33,0.24],[0.42,0.21],[0.58,0.21],[0.67,0.24],
      [0.70,0.32],[0.64,0.45],[0.50,0.48],[0.36,0.45],[0.30,0.32],
    ], S, col, sw));
    // Ram-style angular horns
    out.push(pline([[0.33,0.24],[0.28,0.14],[0.32,0.05],[0.40,0.09],[0.42,0.21]], S, col, sw));
    out.push(pline([[0.67,0.24],[0.72,0.14],[0.68,0.05],[0.60,0.09],[0.58,0.21]], S, col, sw));
  }

  return out.join('');
}

// ── Eyes ─────────────────────────────────────────────────────────────────────
function eyes(arch, S, col, sw) {
  const out = [];

  if (arch === 'reptile') {
    out.push(poly([[0.36,0.30],[0.45,0.30],[0.45,0.35],[0.36,0.35]], S, col, sw));
    out.push(ln(0.405,0.30, 0.405,0.35, S, col, r2(sw*0.75)));
    out.push(poly([[0.55,0.30],[0.64,0.30],[0.64,0.35],[0.55,0.35]], S, col, sw));
    out.push(ln(0.595,0.30, 0.595,0.35, S, col, r2(sw*0.75)));

  } else if (arch === 'bird') {
    out.push(poly([[0.39,0.28],[0.44,0.26],[0.47,0.30],[0.44,0.34],[0.39,0.32]], S, col, sw));
    out.push(poly([[0.61,0.28],[0.56,0.26],[0.53,0.30],[0.56,0.34],[0.61,0.32]], S, col, sw));

  } else if (arch === 'cat' || arch === 'fox' || arch === 'devil') {
    // Slanted angular almond (more dramatic for devil)
    out.push(poly([[0.36,0.32],[0.43,0.27],[0.46,0.33],[0.42,0.37]], S, col, sw));
    out.push(poly([[0.64,0.32],[0.57,0.27],[0.54,0.33],[0.58,0.37]], S, col, sw));

  } else {
    // Dog / bear / rabbit — symmetric diamond
    out.push(poly([[0.37,0.31],[0.43,0.28],[0.47,0.32],[0.43,0.37],[0.37,0.34]], S, col, sw));
    out.push(poly([[0.63,0.31],[0.57,0.28],[0.53,0.32],[0.57,0.37],[0.63,0.34]], S, col, sw));
  }

  return out.join('');
}

// ── Face details: nose, whiskers / beak line / mouth ─────────────────────────
function face(arch, S, col, sw) {
  const out = [];

  if (arch === 'bird') return '';  // beak is part of head polygon

  // Nose triangle (pointing down) for all non-bird
  out.push(poly([[0.47,0.39],[0.53,0.39],[0.50,0.43]], S, col, sw));

  if (arch === 'reptile') {
    out.push(pline([[0.44,0.44],[0.50,0.47],[0.56,0.44]], S, col, r2(sw*0.8)));
  } else {
    // Whiskers — 3 per side, slightly fanned
    const lx = [0.11, 0.11, 0.14];
    const rx = [0.89, 0.89, 0.86];
    const ly = [0.37, 0.40, 0.43];
    ly.forEach((y, i) => {
      out.push(ln(0.46,y, lx[i],y, S, col, r2(sw*0.68)));
      out.push(ln(0.54,y, rx[i],y, S, col, r2(sw*0.68)));
    });
  }

  return out.join('');
}

// ── Sitting body ──────────────────────────────────────────────────────────────
function body(arch, S, col, sw) {
  const out = [];

  if (arch === 'bird') {
    out.push(poly([
      [0.50,0.49],[0.62,0.52],[0.70,0.62],[0.72,0.74],[0.68,0.84],
      [0.62,0.88],[0.58,0.88],[0.50,0.82],[0.42,0.88],[0.38,0.88],
      [0.32,0.84],[0.28,0.74],[0.30,0.62],[0.38,0.52],
    ], S, col, sw));
    // Wing lines
    out.push(pline([[0.38,0.55],[0.22,0.68],[0.28,0.80]], S, col, r2(sw*0.85)));
    out.push(pline([[0.62,0.55],[0.78,0.68],[0.72,0.80]], S, col, r2(sw*0.85)));
    // Fan tail feathers
    out.push(pline([[0.42,0.88],[0.38,0.95],[0.50,0.92],[0.62,0.95],[0.58,0.88]], S, col, r2(sw*0.85)));

  } else {
    out.push(poly([
      [0.50,0.49],[0.62,0.52],[0.68,0.62],[0.70,0.74],[0.67,0.84],
      [0.60,0.89],[0.54,0.89],[0.50,0.83],[0.46,0.89],[0.40,0.89],
      [0.33,0.84],[0.30,0.74],[0.32,0.62],[0.38,0.52],
    ], S, col, sw));
    // Chest V-facet
    out.push(pline([[0.38,0.52],[0.50,0.63],[0.62,0.52]], S, col, r2(sw*0.82)));
    // Center body vertical
    out.push(ln(0.50,0.63, 0.50,0.77, S, col, r2(sw*0.82)));
    // Hip diagonals
    out.push(ln(0.33,0.84, 0.50,0.77, S, col, r2(sw*0.82)));
    out.push(ln(0.67,0.84, 0.50,0.77, S, col, r2(sw*0.82)));
    // Paw center divider
    out.push(ln(0.50,0.83, 0.50,0.89, S, col, r2(sw*0.82)));

    // Reptile scale chevrons on body
    if (arch === 'reptile') {
      [0.58, 0.66, 0.74].forEach(y => {
        for (let x = 0.33; x < 0.67; x += 0.08) {
          out.push(pline([[x,y],[x+0.04,y+0.04],[x+0.08,y]], S, col, r2(sw*0.55)));
        }
      });
    }
  }

  return out.join('');
}

// ── Tail ──────────────────────────────────────────────────────────────────────
function tail(arch, S, col, sw) {
  if (arch === 'bird') return '';  // bird tail is part of body()

  if (arch === 'fox') {
    return pline([[0.67,0.78],[0.80,0.74],[0.87,0.63],[0.84,0.52],[0.75,0.48],[0.68,0.51]], S, col, sw);
  }
  if (arch === 'devil') {
    // Angular spaded tail
    return pline([[0.67,0.78],[0.79,0.74],[0.84,0.65],[0.82,0.55],[0.74,0.51],[0.78,0.46],[0.72,0.45],[0.76,0.50]], S, col, sw);
  }
  if (arch === 'reptile') {
    // Straight angular tail extending to lower right
    return pline([[0.67,0.84],[0.78,0.82],[0.87,0.80],[0.91,0.86]], S, col, sw);
  }
  // Default tail (cat/dog/bear/rabbit)
  return pline([[0.67,0.78],[0.78,0.74],[0.84,0.64],[0.82,0.54],[0.73,0.51]], S, col, sw);
}

// ── Crown (charSum > 500) ─────────────────────────────────────────────────────
function crown(arch, S, col, sw) {
  // Position crown above whichever archetype's topmost point
  const yTop = { rabbit: 0.02, fox: 0.03, cat: 0.06, devil: 0.03 }[arch] || 0.09;
  return poly([
    [0.36,yTop+0.06],[0.36,yTop+0.01],[0.41,yTop+0.04],[0.46,yTop-0.01],
    [0.50,yTop+0.03],[0.54,yTop-0.01],[0.59,yTop+0.04],[0.64,yTop+0.01],[0.64,yTop+0.06],
  ], S, col, sw);
}

// ── Public API ────────────────────────────────────────────────────────────────
function drawSprite(word, seed, size) {
  size = size > 0 ? size : 140;
  const w   = word ? String(word).toUpperCase() : 'CAT';
  const sn  = typeof seed === 'number' ? seed : wordSeed(String(seed != null ? seed : w));
  const rng = seededRNG(wordSeed(w) ^ sn);

  const arch      = getArchetype(w);
  const isSatan   = (w === 'SATAN');
  const hasSpec   = charSum(w) > 500;

  const lineCol = isSatan ? '#FF2233' : LINE_COLORS[Math.floor(rng() * LINE_COLORS.length)];
  const S  = size;
  const sw = r2(S * 0.019);

  // Decorations first (behind character), then character parts front-to-back
  const parts = [
    decorations(S, lineCol, sw, rng),
    tail(arch, S, lineCol, sw),
    body(arch, S, lineCol, sw),
    head(arch, S, lineCol, sw, rng),
    eyes(arch, S, lineCol, sw),
    face(arch, S, lineCol, sw),
    hasSpec ? crown(arch, S, lineCol, sw) : '',
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${parts.join('')}</svg>`;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { drawSprite };
if (typeof globalThis !== 'undefined') globalThis.ProceduralSprite = { drawSprite };
