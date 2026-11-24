// ==UserScript==
// @name         osu!koko
// @namespace    chrafos
// @version      1.2.1
// @description  Minimal osu!-native HUD + instant beatmapset auto-download, auto-close, and custom mirror templates.
// @author       chrafos
// @match        https://osu.ppy.sh/beatmapsets
// @match        https://osu.ppy.sh/beatmapsets/*
// @match        https://osu.ppy.sh/s/*
// @match        https://osu.ppy.sh/b/*
// @run-at       document-start
// @grant        GM_download
// @grant        GM_openInTab
// @grant        window.close
// @connect      catboy.best
// @connect      *
// ==/UserScript==

(() => {
  'use strict';

  const STORAGE_KEY = 'osukoko.overlay.settings';
  const HOST_ID = 'ok-hud-host';
  const INDEX_URL = 'https://osu.ppy.sh/beatmapsets';
  const DEDUPE_MS = 1500;
  const MARGIN = 10;

  const RE_SET_ID = /^\/(?:beatmapsets|s)\/(\d+)(?:[/?#]|$)/;
  const RE_WHITESPACE = /\s+/g;
  const RE_HTTP = /^http:\/\//i;
  const RE_HTTPS = /^https:\/\//i;
  const RE_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
  const RE_ID_TOKEN = /\$\{id\}/g;

  const DEFAULTS = Object.freeze({
    vid: 'https://catboy.best/d/${id}',
    noVid: 'https://catboy.best/d/${id}n',
  });

  const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

  const finite = (v, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  };

  function sanitizeTemplate(input) {
    if (typeof input !== 'string' || !input) return '';
    let value = input.trim().replace(RE_WHITESPACE, '');
    if (!value) return '';

    if (RE_HTTP.test(value)) {
      value = value.replace(RE_HTTP, 'https://');
    } else if (!RE_HTTPS.test(value)) {
      if (RE_SCHEME.test(value)) return '';
      value = 'https://' + value;
    }

    if (!value.includes('${id}')) {
      value += value.endsWith('/') ? '${id}' : '/${id}';
    }

    try {
      if (new URL(value.replace(RE_ID_TOKEN, '1')).protocol !== 'https:') return '';
    } catch {
      return '';
    }
    return value;
  }

  function loadSettings() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      raw = null;
    }
    const r = raw && typeof raw === 'object' ? raw : {};
    const ui = r.ui && typeof r.ui === 'object' ? r.ui : {};

    return {
      DwnEnbl: Boolean(r.DwnEnbl ?? true),
      DwnBmVi: Boolean(r.DwnBmVi ?? false),
      AutoClose: Boolean(r.AutoClose ?? true),
      UseCustom: Boolean(r.UseCustom ?? false),
      customVid: sanitizeTemplate(r.customVid),
      customNoVid: sanitizeTemplate(r.customNoVid),
      ui: {
        x: finite(ui.x, 16),
        y: finite(ui.y, -1), // -1 = anchor near bottom-left on first paint
        minimized: Boolean(ui.minimized ?? false),
      },
    };
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota or private-mode failures.
    }
  }

  const getBeatmapsetId = (path = location.pathname) => {
    const m = RE_SET_ID.exec(path);
    return m ? m[1] : null;
  };

  function buildDownloadUrl(settings, id) {
    const noVid = settings.DwnBmVi;
    const fallback = noVid ? DEFAULTS.noVid : DEFAULTS.vid;
    const tpl = settings.UseCustom ? ((noVid ? settings.customNoVid : settings.customVid) || fallback) : fallback;
    return tpl.replace(RE_ID_TOKEN, encodeURIComponent(id));
  }

  function fallbackOpen(url) {
    // Prefer GM_openInTab fallback only after anchor click (anchor preserves Referer for catboy.best).
    try {
      const parent = document.body || document.documentElement;
      if (parent) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.referrerPolicy = 'origin';
        parent.appendChild(a);
        a.click();
        a.remove();
        return true;
      }
    } catch {
      // Fall through to GM_openInTab.
    }

    if (typeof GM_openInTab === 'function') {
      try {
        GM_openInTab(url, { active: false, insert: true });
        return true;
      } catch {
        // Fall through to current tab navigation.
      }
    }
    location.href = url;
    return false;
  }

  function startDownload(url, id, onReadyToClose) {
    if (typeof GM_download === 'function') {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        onReadyToClose();
      };
      try {
        // Wait for onload (not onprogress/450ms timer): navigating or closing early
        // kills the tab's Tampermonkey sandbox and aborts in-flight GM_download.
        GM_download({
          url,
          name: `${id}.osz`,
          saveAs: false,
          headers: { Referer: `${location.origin}/` },
          onload: done,
          onerror: () => {
            if (fallbackOpen(url)) done();
          },
          ontimeout: () => {
            if (fallbackOpen(url)) done();
          },
        });
        return;
      } catch {
        // Fall through to browser navigation.
      }
    }
    if (fallbackOpen(url)) onReadyToClose();
  }

  function createDownloader(settings) {
    let activeId = null;
    let lastId = null;
    let lastTime = 0;
    let t1 = 0;
    let t2 = 0;

    const clearTimers = () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      t1 = 0;
      t2 = 0;
    };

    const closeTab = (id) => {
      if (!settings.AutoClose || getBeatmapsetId() !== id) return;
      window.close();
      if (!t1) {
        t1 = setTimeout(() => {
          t1 = 0;
          if (getBeatmapsetId() !== id) return;
          window.open('', '_self');
          window.close();
        }, 120);
      }
      if (!t2) {
        t2 = setTimeout(() => {
          t2 = 0;
          if (document.visibilityState === 'hidden' || getBeatmapsetId() !== id) return;
          if (history.length > 1) history.back();
          else location.replace(INDEX_URL);
        }, 400);
      }
    };

    return function onRoute() {
      const id = getBeatmapsetId();
      if (!id) {
        activeId = null;
        clearTimers();
        return false;
      }
      if (!settings.DwnEnbl || id === activeId) return false;

      const now = Date.now();
      if (lastId === id && now - lastTime < DEDUPE_MS) return false;

      activeId = id;
      lastId = id;
      lastTime = now;
      clearTimers();

      const url = buildDownloadUrl(settings, id);
      startDownload(url, id, () => closeTab(id));
      return true;
    };
  }

  // Palette mirrors osu.ppy.sh/beatmapsets CSS custom properties (--base-hue: 200).
  const HUD_CSS = `
    :host {
      all: initial;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483647;
      pointer-events: none;
      --bg-bar: hsl(var(--hsl-b5, 200, 10%, 15%));
      --bg-seg: hsl(var(--hsl-b4, 200, 10%, 20%));
      --bg-hi: hsl(var(--hsl-b3, 200, 10%, 25%));
      --line: hsl(var(--hsl-b2, 200, 10%, 30%));
      --line-hi: hsl(var(--hsl-b1, 200, 10%, 40%));
      --accent: hsl(var(--hsl-h1, 200, 100%, 70%));
      --accent-dim: hsl(var(--hsl-h2, 200, 50%, 45%));
      --ink: hsl(var(--hsl-c1, 200, 40%, 100%));
      --ink-sub: hsl(var(--hsl-l2, 200, 40%, 75%));
      --ink-off: hsl(var(--hsl-f1, 200, 10%, 60%));
    }
    *, *::before, *::after {
      box-sizing: border-box;
      font-family: Torus, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .dock {
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
      will-change: transform;
      user-select: none;
    }
    .bar {
      display: inline-flex;
      align-items: stretch;
      height: 28px;
      background: var(--bg-bar);
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;
    }
    .grip {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 9px 0 11px;
      background: var(--bg-seg);
      border-right: 1px solid var(--line);
      color: var(--ink-sub);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .04em;
      cursor: grab;
      touch-action: none;
    }
    .grip:active { cursor: grabbing; }
    .grip::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--line-hi);
      transition: background 120ms ease;
    }
    .dock[data-armed="1"] .grip::before { background: var(--accent); }
    .dock[data-armed="1"] .grip { color: var(--ink); }
    .keys {
      display: inline-flex;
      align-items: stretch;
    }
    .dock[data-min="1"] .keys,
    .dock[data-min="1"] .tray { display: none; }
    .key {
      position: relative;
      appearance: none;
      border: 0;
      border-right: 1px solid var(--line);
      background: transparent;
      color: var(--ink-off);
      padding: 0 9px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .03em;
      cursor: pointer;
      transition: background 110ms ease, color 110ms ease;
    }
    .key:last-child { border-right: 0; }
    .key:hover { background: var(--bg-seg); color: var(--ink); }
    .key[aria-pressed="true"] {
      background: var(--bg-hi);
      color: var(--ink);
    }
    .key[aria-pressed="true"]::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background: var(--accent);
    }
    .tray {
      width: 280px;
      padding: 8px;
      background: var(--bg-bar);
      border: 1px solid var(--line);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tray[hidden] { display: none; }
    .row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tag {
      width: 40px;
      flex: 0 0 40px;
      color: var(--ink-off);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .04em;
    }
    .in {
      flex: 1;
      min-width: 0;
      height: 24px;
      padding: 0 7px;
      background: var(--bg-seg);
      border: 1px solid var(--line);
      border-radius: 4px;
      color: var(--ink);
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      outline: none;
    }
    .in::placeholder { color: var(--ink-off); opacity: .7; }
    .in:focus { border-color: var(--accent-dim); }
  `;

  function mountHud(settings) {
    if (document.getElementById(HOST_ID)) return;
    const parent = document.body || document.documentElement;
    if (!parent) return;

    const host = document.createElement('div');
    host.id = HOST_ID;
    parent.appendChild(host);

    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = HUD_CSS;

    const dock = document.createElement('div');
    dock.className = 'dock';
    dock.innerHTML =
      `<div class="bar">` +
        `<div class="grip" data-grip title="Drag to move · Double-click to collapse">koko</div>` +
        `<div class="keys">` +
          `<button type="button" class="key" data-k="DwnEnbl" title="Auto-download">DL</button>` +
          `<button type="button" class="key" data-k="DwnBmVi" title="Without video">NOVID</button>` +
          `<button type="button" class="key" data-k="AutoClose" title="Auto-close tab">CLOSE</button>` +
          `<button type="button" class="key" data-k="UseCustom" title="Use custom mirror">CUSTOM</button>` +
          `<button type="button" class="key" data-tray title="Mirror URLs">⋯</button>` +
        `</div>` +
      `</div>` +
      `<div class="tray" hidden>` +
        `<div class="row"><span class="tag">VID</span><input class="in" type="text" data-u="customVid" placeholder="${DEFAULTS.vid}"></div>` +
        `<div class="row"><span class="tag">NOVID</span><input class="in" type="text" data-u="customNoVid" placeholder="${DEFAULTS.noVid}"></div>` +
      `</div>`;

    root.append(style, dock);

    const tray = dock.querySelector('.tray');
    const grip = dock.querySelector('[data-grip]');
    const trayBtn = dock.querySelector('[data-tray]');
    const keyBtns = dock.querySelectorAll('[data-k]');
    const urlInputs = dock.querySelectorAll('[data-u]');

    let trayOpen = false;
    let posX = settings.ui.x;
    let posY = settings.ui.y;
    let rafResize = 0;

    const setPosition = (x, y) => {
      const rect = dock.getBoundingClientRect();
      const maxX = Math.max(MARGIN, window.innerWidth - (rect.width || 220) - MARGIN);
      const maxY = Math.max(MARGIN, window.innerHeight - (rect.height || 28) - MARGIN);
      posX = clamp(x, MARGIN, maxX);
      posY = clamp(y, MARGIN, maxY);
      dock.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
    };

    const syncView = () => {
      dock.dataset.armed = settings.DwnEnbl ? '1' : '0';
      dock.dataset.min = settings.ui.minimized ? '1' : '0';
      for (const btn of keyBtns) {
        btn.setAttribute('aria-pressed', String(Boolean(settings[btn.dataset.k])));
      }
      tray.hidden = !trayOpen || settings.ui.minimized;
      trayBtn.setAttribute('aria-pressed', String(!tray.hidden));
    };

    for (const input of urlInputs) {
      input.value = settings[input.dataset.u];
    }
    syncView();

    if (posY < 0) posY = Math.max(MARGIN, window.innerHeight - 44);
    setPosition(posX, posY);

    // Single delegated click & change handlers inside Shadow DOM.
    root.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      const key = target.dataset.k;
      if (key) {
        settings[key] = !settings[key];
        if (key === 'UseCustom' && settings.UseCustom) trayOpen = true;
        syncView();
        setPosition(posX, posY);
        saveSettings(settings);
        return;
      }

      if ('tray' in target.dataset) {
        trayOpen = !trayOpen;
        syncView();
        setPosition(posX, posY);
      }
    });

    root.addEventListener('change', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      const field = target.dataset.u;
      if (!field) return;

      const cleaned = sanitizeTemplate(target.value);
      settings[field] = cleaned;
      target.value = cleaned;
      saveSettings(settings);
    });

    grip.addEventListener('dblclick', () => {
      settings.ui.minimized = !settings.ui.minimized;
      syncView();
      setPosition(posX, posY);
      saveSettings(settings);
    });

    // GPU-composited pointer drag with capture (no global document listeners).
    let drag = null;
    grip.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { sx: e.clientX, sy: e.clientY, ox: posX, oy: posY, moved: false };
      grip.setPointerCapture(e.pointerId);
    });

    grip.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      drag.moved = true;
      setPosition(drag.ox + dx, drag.oy + dy);
    });

    const endDrag = (e) => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);
      if (moved) {
        settings.ui.x = Math.round(posX);
        settings.ui.y = Math.round(posY);
        saveSettings(settings);
      }
    };
    grip.addEventListener('pointerup', endDrag);
    grip.addEventListener('pointercancel', endDrag);

    window.addEventListener(
      'resize',
      () => {
        if (rafResize) return;
        rafResize = requestAnimationFrame(() => {
          rafResize = 0;
          setPosition(posX, posY);
        });
      },
      { passive: true }
    );
  }

  function scheduleHudMount(settings) {
    if (document.body) {
      mountHud(settings);
    } else {
      document.addEventListener('DOMContentLoaded', () => mountHud(settings), { once: true });
    }
  }

  function watchRoutes(onChange) {
    let lastHref = location.href;
    const check = () => {
      const href = location.href;
      if (href === lastHref) return;
      lastHref = href;
      onChange();
    };

    const wrap = (fn) =>
      function wrappedHistory(...args) {
        const res = fn.apply(this, args);
        check();
        return res;
      };

    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', check, { passive: true });
  }

  const settings = loadSettings();
  const handleDownload = createDownloader(settings);

  // Fire download immediately at document-start before osu! hydrates.
  const triggered = handleDownload();

  // Mount HUD immediately unless tab is actively downloading with AutoClose enabled.
  if (triggered && settings.AutoClose) {
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') scheduleHudMount(settings);
    }, 600);
  } else {
    scheduleHudMount(settings);
  }

  watchRoutes(() => {
    handleDownload();
    scheduleHudMount(settings);
  });
})();
