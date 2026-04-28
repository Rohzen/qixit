# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
node server.js          # Dev server on port 3000 (enables live asset discovery via /api/manifest)
node server.js 8080     # Custom port
node build.js           # Bundle for Android: copies qixit-android.html → dist/index.html + assets
node generate-manifest.js  # Regenerate embedded asset manifest in qixit.html (for offline play)
```

No lint or test tooling is configured. There is a `package.json` with `npm start` (server), `npm run build` (build), and `npm run android` (build + Capacitor sync for Android Studio) aliases.

For Android, use Capacitor CLI (`npx cap sync android`, `npx cap open android`) after running `node build.js`. The Android app embeds `dist/index.html` (= the Android variant) in a WebView.

## Architecture

### Two game variants

- **`qixit.html`** — Desktop/browser version. ~2,800 lines: all HTML, CSS, and game JS in one file. Used for direct-open or dev server play.
- **`mobile/qixit-android.html`** — Android fork. Adds `mobile/mobile.js` (touch D-pad + swipe controls) and `mobile/mobile.css`. Built to `dist/index.html` by `build.js`.

These two files diverge over time. Changes to game logic typically need to be applied to **both**.

### Game code structure (inside the main HTML files)

The JavaScript is one large IIFE. There is no module system. Key areas (searchable by comment):

- **Grid system** — 32×24 cell grid with `EMPTY / WALL / FILLED / TRAIL` states. Territory claiming uses a flood-fill (`carveArea`). Collision detection is cell-based, not pixel-based.
- **Enemy AI** — `Qix` (procedural rotating lines, unpredictable bounce) and `Sparx` (wall-follower pathfinding). Both are drawn procedurally with canvas gradients/sine waves — no sprite sheets required.
- **Game loop** — `requestAnimationFrame`; single `update()` + `draw()` cycle. State machine via `menuActive` flag.
- **Audio** — Sound effects are pooled `Audio` objects. BGM tracks are selected from configurable pools stored in `localStorage`.
- **Asset manifest** — On the dev server, `GET /api/manifest` scans asset folders and returns JSON with file lists and PNG frame sizes (detected from PNG headers). The same JSON is embedded as `<script id="asset-manifest">` in `qixit.html` for offline use; `generate-manifest.js` patches it.
- **Advanced Options UI** — Dynamically built from the manifest at runtime. Lets players pick music pools, SFX slots, sprites, and background themes. All persisted to `localStorage`.

### Server (`server.js`)

Plain Node.js HTTP server — no framework. Serves static files and the `/api/manifest` dynamic endpoint. The manifest scan infers sprite `frameSize` from PNG header dimensions (no external image lib).

### Android (`android/`)

Standard Capacitor 8 Android project. App ID: `com.rohzen.qixit`. `capacitor.config.json` points webRoot at `dist/`. Build: `compileSdk 34`, `minSdk 21`.

## Key conventions

- **localStorage** is the only persistence layer (settings, high scores, selected skins).
- **No external JS dependencies** — vanilla JS and Canvas API only.
- Background images are fetched at runtime from free public APIs (NASA, Met Museum, Unsplash, etc.); the fetch URL is chosen by theme keyword stored in localStorage.
- Mobile touch controls work by synthesizing keyboard events (`pressKey` / `releaseKey` dispatch `keydown`/`keyup`), so the core game loop doesn't need touch-awareness.
- When adding assets (music, sprites), drop files into the appropriate `assets/` subfolder and either restart the dev server (auto-discovery) or run `generate-manifest.js` (offline embed).
