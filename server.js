#!/usr/bin/env node
/**
 * server.js
 * Local dev server for qixit.
 * - Serves all static files from the project root
 * - GET /api/manifest  →  live scan of all asset directories (with frameSize detection)
 *
 * Usage:  node server.js          (default port 3000)
 *         node server.js 8080     (custom port)
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = parseInt(process.argv[2]) || 3000;
const ROOT      = __dirname;
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

// ── PNG dimension reader (no external deps) ────────────────────────────────────
function readPngSize(filepath) {
  try {
    const buf = Buffer.alloc(24);
    const fd  = fs.openSync(filepath, 'r');
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf[0] !== 137 || buf[1] !== 80 || buf[2] !== 78 || buf[3] !== 71) return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch (_) { return null; }
}

// frameSize = height when height ≤ 320 and width is an exact multiple, else nearest common divisor
function detectFrameSize(w, h) {
  if (h > 0 && h <= 320 && w % h === 0) return h;
  for (const s of [256, 192, 128, 96, 64, 48, 32]) {
    if (h % s === 0 && w % s === 0) return s;
  }
  return 64;
}

// ── Directory scanners ─────────────────────────────────────────────────────────
function scanAudio(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(f => AUDIO_EXT.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
      .map(f => ({
        src:   path.relative(ROOT, path.join(dir, f)).replace(/\\/g, '/'),
        label: audioLabel(f),
      }));
  } catch (_) { return []; }
}

function scanSprites(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(f => IMG_EXT.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
      .map(f => {
        const filepath  = path.join(dir, f);
        const size      = readPngSize(filepath);
        const frameSize = size ? detectFrameSize(size.w, size.h) : 64;
        return {
          src:   path.relative(ROOT, filepath).replace(/\\/g, '/'),
          label: spriteLabel(f),
          frameSize,
        };
      });
  } catch (_) { return []; }
}

// ── MIME types ─────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ogg':  'audio/ogg',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ico':  'image/x-icon',
};

// ── Request handler ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // Live manifest — rescans all asset folders on every call
  if (url === '/api/manifest') {
    const manifest = {
      bgm:     scanAudio(path.join(ROOT, 'assets/music/bgm')),
      sfx:     scanAudio(path.join(ROOT, 'assets/music/sfx')),
      sprites: scanSprites(path.join(ROOT, 'assets/sprites/enemies')),
      player:  scanSprites(path.join(ROOT, 'assets/sprites/player')),
      sparx:   scanSprites(path.join(ROOT, 'assets/sprites/sparx')),
      bonus:   scanSprites(path.join(ROOT, 'assets/sprites/bonus')),
    };
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify(manifest));
    return;
  }

  // Static files
  let filePath = path.join(ROOT, url === '/' ? 'qixit.html' : url);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`QIXIT dev server running at http://localhost:${PORT}/`);
  console.log(`Manifest API:             http://localhost:${PORT}/api/manifest`);
  console.log(`Asset folders:`);
  console.log(`  Enemies  → assets/sprites/enemies/`);
  console.log(`  Sparx    → assets/sprites/sparx/`);
  console.log(`  Player   → assets/sprites/player/`);
  console.log(`  Bonus    → assets/sprites/bonus/`);
});
