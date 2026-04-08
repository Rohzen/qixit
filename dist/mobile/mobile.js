/* ══════════════════════════════════════════════════════════════════════════
   QIXIT — Mobile Touch Controls & Layout Manager
   Loaded only in the Capacitor build (injected by build.js)
   ══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Detection ─────────────────────────────────────────────────────────
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouchDevice) return; // desktop — do nothing

  // ── Preferences ───────────────────────────────────────────────────────
  const STORAGE_KEY = 'qixit_ctrl_mode';
  let controlMode = localStorage.getItem(STORAGE_KEY) || 'dpad'; // 'dpad' | 'swipe'

  // ── Wait for game to initialise ───────────────────────────────────────
  // The game IIFE runs synchronously on load. This script loads after it,
  // so all DOM elements and the `keys` Set are ready.
  const canvas   = document.getElementById('game');
  const outerW   = document.getElementById('outer-wrap');
  const gameWrap = document.getElementById('game-wrap');
  const $hud     = document.querySelector('.hud');
  const $menuOpts = document.getElementById('menu-opts');

  // Access the game's key state — it's in the closure but attached to window scope
  // We'll listen to the same events and inject into the same Set
  // Since `keys` is local to the game IIFE, we need to simulate keyboard events
  function pressKey(key) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }
  function releaseKey(key) {
    window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }

  // ── Viewport meta ────────────────────────────────────────────────────
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute('content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  // ── Build Touch Controls DOM ────────────────────────────────────────
  const $touchControls = document.createElement('div');
  $touchControls.id = 'touch-controls';
  $touchControls.classList.add('visible');

  // D-pad
  const dpad = document.createElement('div');
  dpad.className = 'dpad';
  const dirs = [
    null, 'ArrowUp', null,
    'ArrowLeft', null, 'ArrowRight',
    null, 'ArrowDown', null
  ];
  const arrows = ['', '▲', '', '◀', '', '▶', '', '▼', ''];
  dirs.forEach((dir, i) => {
    if (dir) {
      const btn = document.createElement('button');
      btn.className = 'dpad-btn';
      btn.dataset.dir = dir;
      btn.textContent = arrows[i];
      dpad.appendChild(btn);
    } else {
      const blank = document.createElement('div');
      blank.className = 'dpad-blank';
      dpad.appendChild(blank);
    }
  });

  // DRAW button
  const $drawBtn = document.createElement('button');
  $drawBtn.className = 'action-btn';
  $drawBtn.id = 'draw-btn';
  $drawBtn.textContent = 'DRAW';

  // Swipe zone (invisible overlay on canvas)
  const $swipeZone = document.createElement('div');
  $swipeZone.id = 'swipe-zone';

  $touchControls.appendChild(dpad);
  $touchControls.appendChild($drawBtn);

  // Insert controls and swipe zone
  outerW.appendChild($touchControls);
  gameWrap.appendChild($swipeZone);

  // ── Layout Recalculation ─────────────────────────────────────────────
  function recalcLayout() {
    const touchH = $touchControls.offsetHeight || 0;
    const hudH = $hud.offsetHeight || 0;
    const gap = 4;
    const reservedH = touchH + hudH + gap * 2;
    outerW.style.width = `min(100vw, calc((100vh - ${reservedH}px) * 800 / 600))`;
  }
  requestAnimationFrame(() => requestAnimationFrame(recalcLayout));
  window.addEventListener('resize', recalcLayout);

  // ── D-pad Event Wiring ───────────────────────────────────────────────
  const activeTouches = new Map(); // touchId -> dir

  document.querySelectorAll('.dpad-btn').forEach(btn => {
    const dir = btn.dataset.dir;

    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      for (const touch of e.changedTouches) {
        activeTouches.set(touch.identifier, dir);
      }
      pressKey(dir);
      btn.classList.add('pressed');
    }, { passive: false });

    btn.addEventListener('touchend', e => {
      e.preventDefault();
      e.stopPropagation();
      for (const touch of e.changedTouches) {
        activeTouches.delete(touch.identifier);
      }
      // Only release if no other touch is holding same direction
      const stillHeld = [...activeTouches.values()].includes(dir);
      if (!stillHeld) {
        releaseKey(dir);
        btn.classList.remove('pressed');
      }
    }, { passive: false });

    btn.addEventListener('touchcancel', e => {
      for (const touch of e.changedTouches) {
        activeTouches.delete(touch.identifier);
      }
      releaseKey(dir);
      btn.classList.remove('pressed');
    });
  });

  // ── DRAW Button Wiring ───────────────────────────────────────────────
  $drawBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    e.stopPropagation();
    pressKey(' ');
    $drawBtn.classList.add('pressed');
  }, { passive: false });

  $drawBtn.addEventListener('touchend', e => {
    e.preventDefault();
    e.stopPropagation();
    releaseKey(' ');
    $drawBtn.classList.remove('pressed');
  }, { passive: false });

  $drawBtn.addEventListener('touchcancel', () => {
    releaseKey(' ');
    $drawBtn.classList.remove('pressed');
  });

  // ── Swipe Controls ───────────────────────────────────────────────────
  const SWIPE_THRESHOLD = 20; // minimum px to register a direction
  let swipeStartX = 0, swipeStartY = 0;
  let swipeCurrentDir = null;

  $swipeZone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    swipeStartX = t.clientX;
    swipeStartY = t.clientY;
    swipeCurrentDir = null;
  }, { passive: false });

  $swipeZone.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStartX;
    const dy = t.clientY - swipeStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < SWIPE_THRESHOLD) return;

    let newDir;
    if (Math.abs(dx) > Math.abs(dy)) {
      newDir = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    } else {
      newDir = dy > 0 ? 'ArrowDown' : 'ArrowUp';
    }

    if (newDir !== swipeCurrentDir) {
      if (swipeCurrentDir) releaseKey(swipeCurrentDir);
      pressKey(newDir);
      swipeCurrentDir = newDir;
    }

    // Reset start point for continuous direction changes
    swipeStartX = t.clientX;
    swipeStartY = t.clientY;
  }, { passive: false });

  $swipeZone.addEventListener('touchend', e => {
    e.preventDefault();
    if (swipeCurrentDir) {
      releaseKey(swipeCurrentDir);
      swipeCurrentDir = null;
    }
  }, { passive: false });

  $swipeZone.addEventListener('touchcancel', () => {
    if (swipeCurrentDir) {
      releaseKey(swipeCurrentDir);
      swipeCurrentDir = null;
    }
  });

  // ── Tap on canvas to start/continue ──────────────────────────────────
  canvas.addEventListener('touchstart', e => {
    // Only handle tap-to-start when in menu/level-complete (no swipe zone)
    if (controlMode === 'swipe' && $swipeZone.classList.contains('active')) return;
    e.preventDefault();
    pressKey(' ');
    setTimeout(() => releaseKey(' '), 100);
  }, { passive: false });

  // ── Control Mode Toggle ──────────────────────────────────────────────
  function applyControlMode() {
    if (controlMode === 'swipe') {
      dpad.style.display = 'none';
      $drawBtn.style.display = 'none';
      $swipeZone.classList.add('active');
      $touchControls.style.display = 'none';
    } else {
      dpad.style.display = '';
      $drawBtn.style.display = '';
      $swipeZone.classList.remove('active');
      $touchControls.style.display = '';
      $touchControls.classList.add('visible');
    }
    localStorage.setItem(STORAGE_KEY, controlMode);
    requestAnimationFrame(() => requestAnimationFrame(recalcLayout));
  }

  // Insert control toggle into the options menu
  function addControlToggle() {
    if (!$menuOpts || document.getElementById('ctrl-mode-row')) return;
    const row = document.createElement('div');
    row.className = 'opt-row';
    row.id = 'ctrl-mode-row';
    row.innerHTML = `
      <label class="ctrl-toggle">🎮 Controls
        <select id="ctrl-mode-select">
          <option value="dpad" ${controlMode === 'dpad' ? 'selected' : ''}>D-pad</option>
          <option value="swipe" ${controlMode === 'swipe' ? 'selected' : ''}>Swipe</option>
        </select>
      </label>
    `;
    // Insert before the Advanced button row
    const advRow = $menuOpts.querySelector('#adv-toggle')?.closest('.opt-row');
    if (advRow) {
      $menuOpts.insertBefore(row, advRow);
    } else {
      $menuOpts.appendChild(row);
    }

    document.getElementById('ctrl-mode-select').addEventListener('change', e => {
      controlMode = e.target.value;
      applyControlMode();
    });
  }

  // ── Canvas Text Override ─────────────────────────────────────────────
  // Monkey-patch CanvasRenderingContext2D.fillText to replace desktop prompts
  const _origFillText = CanvasRenderingContext2D.prototype.fillText;
  const textReplacements = {
    'Arrow keys  ·  Hold Space to draw  ·  Return to border to fill':
      'D-pad to move  ·  Hold DRAW to claim  ·  Return to border to fill',
    'PRESS SPACE TO START': 'TAP TO START',
    'PRESS SPACE TO CONTINUE': 'TAP TO CONTINUE',
  };

  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
    const replaced = textReplacements[text];
    if (replaced) {
      // Update replacement based on control mode for the instruction line
      if (text.startsWith('Arrow keys')) {
        const modeText = controlMode === 'swipe'
          ? 'Swipe to move  ·  Tap DRAW zone to claim  ·  Return to border to fill'
          : 'D-pad to move  ·  Hold DRAW to claim  ·  Return to border to fill';
        return _origFillText.call(this, modeText, x, y, maxWidth);
      }
      return _origFillText.call(this, replaced, x, y, maxWidth);
    }
    return _origFillText.call(this, text, x, y, maxWidth);
  };

  // ── Initialise ───────────────────────────────────────────────────────
  applyControlMode();
  // Use MutationObserver to inject the toggle once menu becomes visible
  const observer = new MutationObserver(() => {
    if ($menuOpts && !$menuOpts.classList.contains('hidden')) {
      addControlToggle();
    }
  });
  if ($menuOpts) {
    observer.observe($menuOpts, { attributes: true, attributeFilter: ['class'] });
    // Also try immediately in case menu is already visible
    addControlToggle();
  }

  console.log('[QIXIT Mobile] Touch controls initialized, mode:', controlMode);
})();
