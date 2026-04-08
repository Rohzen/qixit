# QIXIT

A QIX-inspired arcade game built with HTML5 Canvas.

## Playing the game

### Option A — Direct file (simplest)
Just open `qixit.html` in any modern browser. All game features work except dynamic asset discovery (new files you drop into `assets/` won't appear automatically in the Advanced Options panel until you regenerate the manifest — see below).

### Option B — Local server (recommended for development)
The local server enables **live asset scanning**: drop new music or sprite files into the asset folders and they appear in the Advanced Options panel on the next page reload — no extra steps.

**Requirements:** [Node.js](https://nodejs.org/) (any recent LTS)

```bash
node server.js
```

Then open **http://localhost:3000/** in your browser.

To use a different port:
```bash
node server.js 8080
```

## Asset folders

| Folder | Contents |
|--------|----------|
| `assets/music/bgm/` | Background music tracks (`.ogg`, `.mp3`, `.wav`) |
| `assets/music/sfx/` | Sound effects (`.ogg`, `.mp3`, `.wav`) |
| `assets/sprites/` | Sprite sheets (`.png`) |

Drop files into these folders and reload the page (server required for automatic discovery).

## Updating the static manifest (Option A only)

If you're running without the server, regenerate the embedded asset list after adding files:

```bash
node generate-manifest.js
```

This patches the `<script id="asset-manifest">` block inside `qixit.html`.

## Controls

| Key / Input | Action |
|-------------|--------|
| Arrow keys / WASD | Move player |
| Space / hold direction | Start drawing |
| ESC | Pause / resume |
| Menu button (HUD) | Return to main menu |
