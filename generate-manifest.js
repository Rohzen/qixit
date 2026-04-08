#!/usr/bin/env node
/**
 * generate-manifest.js
 * Scans assets/ subdirectories and updates the <script id="asset-manifest"> in qixit.html.
 *
 * Usage:  node generate-manifest.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const HTML      = path.join(ROOT, 'qixit.html');
const AUDIO_EXT = ['.ogg', '.mp3', '.wav'];
const IMG_EXT   = ['.png'];

// ── Label helpers ──────────────────────────────────────────────────────────────
function audioLabel(filename) {
  return filename
    .replace(/\.(ogg|mp3|wav)$/i, '')
    .replace(/It_s\b/g,  "It's")
    .replace(/You_re\b/g, "You're")
    .replace(/\(miniclip\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function spriteLabel(filename) {
  const m = filename.match(/Pixel\s+(\d+)/i);
  return m ? `Smoke ${m[1]}` : filename.replace(/\.png$/i, '').trim();
}

// ── Read PNG dimensions from file header (no external deps) ───────────────────
function readPngSize(filepath) {
  try {
    const buf = Buffer.alloc(24);
    const fd  = fs.openSync(filepath, 'r');
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    // PNG signature: bytes 0-7  =  137 80 78 71 13 10 26 10
    if (buf[0] !== 137 || buf[1] !== 80 || buf[2] !== 78 || buf[3] !== 71) return null;
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return { w, h };
  } catch (_) { return null; }
}

// Detect frame size: height if it's ≤320 and width is a multiple of height, else 64
function detectFrameSize(w, h) {
  if (h > 0 && h <= 320 && w % h === 0) return h;
  // Try common sizes descending
  for (const s of [256, 192, 128, 96, 64, 48, 32]) {
    if (h % s === 0 && w % s === 0) return s;
  }
  return 64;
}

// ── Directory scan ─────────────────────────────────────────────────────────────
function scanAudio(dir) {
  return scan(dir, AUDIO_EXT, f => ({ label: audioLabel(f) }));
}

function scanSprites(dir) {
  return scan(dir, IMG_EXT, f => {
    const filepath = path.join(dir, f);
    const size     = readPngSize(filepath);
    const frameSize = size ? detectFrameSize(size.w, size.h) : 64;
    return { label: spriteLabel(f), frameSize };
  });
}

function scan(dir, extensions, extraFn) {
  try {
    return fs.readdirSync(dir)
      .filter(f => extensions.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
      .map(f => ({
        src:   path.relative(ROOT, path.join(dir, f)).replace(/\\/g, '/'),
        ...extraFn(f),
      }));
  } catch (e) {
    console.warn(`  Warning: could not read ${dir} — ${e.message}`);
    return [];
  }
}

// ── Build manifest ─────────────────────────────────────────────────────────────
const manifest = {
  bgm:     scanAudio(path.join(ROOT, 'assets/music/bgm')),
  sfx:     scanAudio(path.join(ROOT, 'assets/music/sfx')),
  sprites: scanSprites(path.join(ROOT, 'assets/sprites/enemies')),
  player:  scanSprites(path.join(ROOT, 'assets/sprites/player')),
  sparx:   scanSprites(path.join(ROOT, 'assets/sprites/sparx')),
  bonus:   scanSprites(path.join(ROOT, 'assets/sprites/bonus')),
};

console.log(
  `Found: ${manifest.bgm.length} BGM, ${manifest.sfx.length} SFX, ` +
  `${manifest.sprites.length} enemy, ${manifest.player.length} player, ` +
  `${manifest.sparx.length} sparx, ${manifest.bonus.length} bonus sprites`
);

// ── Inject into qixit.html ─────────────────────────────────────────────────────
const html    = fs.readFileSync(HTML, 'utf8');
const json    = JSON.stringify(manifest, null, 2);
const updated = html.replace(
  /(<script id="asset-manifest"[^>]*>)([\s\S]*?)(<\/script>)/,
  (_, open, _old, close) => `${open}\n${json}\n${close}`
);

if (updated === html) {
  console.error('ERROR: <script id="asset-manifest"> block not found in qixit.html');
  process.exit(1);
}

fs.writeFileSync(HTML, updated, 'utf8');
console.log('qixit.html manifest updated successfully.');
