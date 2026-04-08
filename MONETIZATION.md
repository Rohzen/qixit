# QIXIT — Freemium Monetization Plan

**Author:** Roberto Zanardo · **Date:** 2026-03-28
**Status:** Design proposal (pre-Android)

---

## Philosophy

The core loop must always be free. Players who never pay should still have a complete, fun experience. Monetization should feel like optional enhancements, never artificial friction.

> Rule of thumb: if removing a paywall makes the game **unfair** to free players, it's a bad design. If it makes it **prettier or more personalized**, it's fine.

---

## Revenue Streams

### 1. Interstitial Ads (free tier baseline)
Show a skippable ad after every 3 level completions (not on death — that feels punishing). Use a small "×" dismiss after 5 seconds.

**Platforms:**
- Web: Google AdSense / AdMob Web SDK
- Android: Google AdMob interstitial

**User escape valve:** One-time "Remove Ads" IAP (see §2).

---

### 2. One-Time Premium Unlock — *"QIXIT Pro"*
**Price suggestion:** €2.99 / $2.99

Unlocks permanently:
- No ads ever
- All cosmetic packs included (see §3)
- Cloud save / leaderboard entry (see §5)
- A "Pro" badge on the high-score board

This is the primary revenue driver for dedicated players. Keep it visible but not intrusive — a small "⭐ Go Pro" button on the menu.

---

### 3. Cosmetic Packs (IAP or Pro bundle)
These change visuals only — zero gameplay impact. Each pack is €0.99 or included in Pro.

#### 3a. Trail Skins
Change the trail color/style while drawing. Examples:
- **Neon** — electric blue/pink gradient trail
- **Fire** — animated orange→red→ember trail
- **Ice** — frozen blue with shimmer
- **Gold** — metallic shimmer trail
- **Rainbow** — hue-cycling trail

*Implementation:* Trail rendering currently fills `#e9c46a` solid. Replace with a `trailStyle` variable that maps to a draw function. Skins are just different fill/stroke styles, zero performance cost.

#### 3b. Player Skins
Change the animated rhomboid player shape. Examples:
- **Crystal** — multi-faceted gem with refraction effect
- **Plasma** — pulsing blob with animated glow
- **Classic** — original QIX-style dot
- **Ghost** — translucent with trailing afterimage

*Implementation:* Extract player rendering to a `drawPlayer(style)` function, swap style at runtime.

#### 3c. Enemy Themes
Change the Qix procedural rendering style. Examples:
- **Classic** (current) — multicolor rotating lines
- **DNA** — double-helix spiral
- **Fractal** — branching L-system
- **Glitch** — scanline corruption effect

Sparx also gets style variants: **Lightning bolt**, **Firefly**, **Pixel**.

*Implementation:* Already have `drawQixProcedural` / `drawSparxProcedural` — just add a `qixStyle` / `sparxStyle` enum and switch inside those functions.

#### 3d. Music Packs
Additional BGM tracks beyond the included library.

- **Chiptune Pack** — 8-bit retro tracks
- **Ambient Pack** — lo-fi, chill backgrounds
- **Synthwave Pack** — 80s retrowave

On Android: delivered as expansion APK or downloaded on first use.
On web: hosted on CDN, fetched and cached with Cache API.

---

### 4. Daily Challenge Mode (engagement driver)
A seeded daily puzzle with a fixed layout and a global score board. Free to play once per day; Pro players get unlimited replays and a visible rank badge.

**Why this matters for monetization:** daily challenges drive retention, which drives ad impressions and Pro conversion. The leaderboard creates social pressure to go Pro ("play more than once today").

*Implementation:*
- Seed the RNG with `new Date().toISOString().slice(0,10)` for deterministic level generation
- Submit score to a lightweight backend (Cloudflare Worker + KV, or Firebase Free Tier)
- Show top-10 on the menu overlay with truncated names

---

### 5. Cloud Save / Cross-Device Sync
Free users: local save only (already in `localStorage`).
Pro users: sync high score, unlocked cosmetics, and settings across devices via account (Google Sign-In on Android, anonymous token on web).

This is a Pro **retention** feature — once players have a cloud save, they're less likely to churn.

*Implementation (minimal backend):*
```
POST /api/save  { userId, score, level, cosmetics }
GET  /api/save  { userId }
```
Use Firebase Realtime Database (free tier covers ~50K MAU) or Supabase (free tier, Postgres).

---

### 6. Rewarded Ads — "Continue" after Game Over
When the player dies with 0 lives, offer a "Watch ad to revive with 1 life" button.
Limit: once per game session (not per level — that gets abusive).

This is one of the highest-converting ad formats in mobile casual games. Keep it optional — always show a "No thanks / Back to Menu" alternative.

*Implementation:*
```js
// After gameOver = true, stopBGM(), playSFX(sfxGameOver):
if (!hasUsedReviveThisSession && adAvailable()) {
  showReviveOffer(); // renders overlay with "Watch Ad" + "No Thanks"
}
```

---

## Implementation Priority

| Phase | Feature | Effort | Revenue Impact |
|-------|---------|--------|---------------|
| 1 | Interstitial ads (web) | Low | Medium |
| 1 | "Remove Ads" IAP stub (web) | Low | High |
| 2 | Trail skins (3 free, 3 paid) | Low | Medium |
| 2 | Rewarded ad revive | Medium | High |
| 3 | Player & enemy skins | Medium | Medium |
| 3 | Daily challenge + leaderboard | Medium | High (retention) |
| 4 | Android port (WebView wrapper or Godot) | High | High |
| 4 | Google Play IAP integration | Medium | High |
| 5 | Cloud save | Medium | Low (retention) |
| 5 | Music packs | Low | Low |

---

## Android Port Strategy

### Option A — WebView Wrapper (fastest)
Wrap the existing HTML file in an Android `WebView` activity. Use **Capacitor** (by Ionic) or a bare `WebViewActivity`. Pros: zero rewrite, reuses all existing code. Cons: slightly worse performance, limited native API access.

IAP via [Capacitor Purchases plugin](https://github.com/capawesome-team/capacitor-plugins/tree/main/packages/purchases) (wraps Google Play Billing).

### Option B — Godot 4 Port (best long-term)
Rewrite the canvas rendering in Godot 4 (GDScript or C#). The game logic is simple enough (~600 lines of pure logic) that a port would take 1–2 weeks. Native performance, access to all Android APIs, easier monetization SDKs.

### Recommended path:
1. Start with **Option A** to validate the market quickly
2. If the game gets traction (>1K installs), invest in **Option B** for a v2.0

---

## Technical Notes for the Existing Codebase

### Gating cosmetics
Add a `unlockedItems = new Set()` persisted in `localStorage` (web) or SharedPreferences (Android). On purchase confirmation, add the item key:

```js
function unlockItem(key) {
  unlockedItems.add(key);
  saveUnlocked();
}
function isUnlocked(key) {
  return unlockedItems.has(key) || isPro();
}
```

### Tracking ad state
```js
let hasUsedReviveThisSession = false;
let levelsSinceLastAd = 0; // increment in nextLevel(), show ad at 3
```

### Keeping free users engaged (avoid dark patterns)
- Never show ads during gameplay — only on level complete or game over screens
- Never gate the core game behind a timer or energy system
- Free players should be able to reach level 20+ without friction
- Show cosmetic previews (animated, watermarked) so players know what they're getting

---

## Revenue Projection (rough, conservative)

Assuming 1 000 MAU at steady state:

| Stream | Conversion | ARPU | Monthly |
|--------|-----------|------|---------|
| Ads (interstitial, 3 per session, $0.002 CPM) | 70% play 3+ levels | ~$0.10 | ~$70 |
| Rewarded ads | 20% per game over | ~$0.05 | ~$50 |
| Pro unlock ($2.99) | 3% of MAU/month | $2.99 | ~$90 |
| Cosmetic packs ($0.99) | 2% of MAU/month | $0.99 | ~$20 |
| **Total** | | | **~$230/mo** |

At 10 000 MAU these scale roughly linearly. Pro conversion typically improves with time as the community grows.

---

*This document is a living design draft — update it as platform choices and user feedback evolve.*
