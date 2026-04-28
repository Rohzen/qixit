# Qixit Project Overview

## Project Structure
- **Desktop**: `qixit.html` (single HTML file with all game logic, CSS, and JavaScript in an IIFE)
- **Mobile**: `qixit-android.html` (Android-specific variant with touch controls from `mobile/mobile.js` and `mobile/mobile.css`)
- **Build Tools**: `build.js` (bundles for Android), `generate-manifest.js` (creates asset manifest)
- **Server**: `server.js` (Node.js dev server with `/api/manifest` endpoint)

## Architecture
### Game Variants
- **Desktop**: 32×24 grid system with `EMPTY / WALL / FILLED / TRAIL` states. Uses canvas gradients/sine waves for procedural drawing.
- **Mobile**: Adds touch controls via synthesized keyboard events (`pressKey`/`releaseKey`).

### Key Systems
- **Asset Management**: Dynamic manifest system that scans `assets/` folders. Manifest JSON is embedded in `qixit.html` for offline use.
- **Persistence**: All state (settings, scores, skins) stored in `localStorage`.
- **Audio**: Sound effects pooled as `Audio` objects; BGM selected from `localStorage`-stored pools.
- **Themes**: Background images fetched from public APIs (NASA, Met Museum, Unsplash) based on theme keywords in `localStorage`.

## Commands
```bash
node server.js          # Dev server (port 3000)
node server.js 8080     # Custom port
node build.js           # Android bundle
npm run android        # Capacitor Android sync
```

## Conventions
- No external JS dependencies (vanilla JS only)
- Mobile controls mimic keyboard events
- Assets added to `assets/` folders auto-discovered by `generate-manifest.js`
- No linting/test tools configured

## Notes
- Android app ID: `com.rohzen.qixit`
- Capacitor config points webRoot to `dist/`
- Windows environment (per CLAUDE.md instructions)
