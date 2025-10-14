// ==UserScript==
// @name         osu!koko
// @namespace    chrafos
// @version      1.0
// @description  Overlay on index & detail; auto-download + auto-close; custom link option; reload-safe; SPA-safe; prevents multi-triggers.
// @author       chrafos
// @match        https://osu.ppy.sh/beatmapsets*
// @run-at       document-idle
// @grant        GM_openInTab
// ==/UserScript==

(() => {
  'use strict';

  const KEY = 'osukoko.overlay.settings';
  const DEF_VID   = 'https://catboy.best/d/${id}';
  const DEF_NOVID = 'https://catboy.best/d/${id}n';

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const persisted = load();
  const state = {
    DwnEnbl:   persisted.DwnEnbl ?? true,
    DwnBmVi:   persisted.DwnBmVi ?? false,
    AutoClose: persisted.AutoClose ?? true,
    UseCustom: persisted.UseCustom ?? false,
    customVid: persisted.customVid ?? '',
    customNoVid: persisted.customNoVid ?? '',
    ui: Object.assign({ x:24, y:24, w:360, h:230, minimized:false }, persisted.ui || {}),
  };

  const getId = () => {
    const m = location.pathname.match(/^\/beatmapsets\/(\d+)(?:[\/?#]|$)/);
    return m ? m[1] : null;
  };

  const sanitize = (input) => {
    if (!input) return '';
    let s = input.trim().replace(/\s+/g, '');
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    s = s.replace(/^http:\/\//i, 'https://');
    if (!s.includes('${id}')) s += s.endsWith('/') ? '${id}' : '/${id}';
    return /^https:\/\//i.test(s) ? s : '';
  };

  const resolveTpl = (noVid) => {
    if (!state.UseCustom) return noVid ? DEF_NOVID : DEF_VID;
    const t = noVid ? state.customNoVid : state.customVid;
    return t || (noVid ? DEF_NOVID : DEF_VID);
  };
  const buildUrl = (id, noVid) => resolveTpl(noVid).replace(/\$\{id\}/g, encodeURIComponent(id));

  // ---- Robust opener ----
  function openUrl(url) {
    try {
      if (typeof GM_openInTab === 'function') { GM_openInTab(url, { active:false, insert:true }); return; }
    } catch {}
    try {
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    } catch {
      location.href = url; // last resort
    }
  }

  // ---- Reliable auto-close (with fallback navigation only on detail pages) ----
  function tryClose(detailId) {
    if (!state.AutoClose) return;
    window.close();
    setTimeout(() => { open('', '_self'); window.close(); }, 100);
    setTimeout(() => {
      if (document.visibilityState !== 'hidden' && detailId) {
        if (history.length > 1) history.back();
        else location.replace('https://osu.ppy.sh/beatmapsets');
      }
    }, 300);
  }

  // ---- Single-shot guard to prevent duplicate downloads on the same URL in quick succession ----
let dlGuard = { id: null, t: 0 };
function shouldRunOnce(id) {
  const now = Date.now();
  if (dlGuard.id === id && (now - dlGuard.t) < 1500) return false; // 1.5s debounce by ID
  dlGuard = { id, t: now };
  return true;
}

  // ---- Auto-download on beatmap pages (reload-safe) ----
function autoDownload() {
  const id = getId();
  if (!id || !state.DwnEnbl) return;
  if (!shouldRunOnce(id)) return; // skip repeated triggers for same beatmap
  const url = buildUrl(id, state.DwnBmVi);
  openUrl(url);
  tryClose(id);
}

  // ---- Overlay (visible on index & detail) ----
  function makeOverlay() {
    if (document.getElementById('ok-overlay-host')) return;
    const host = document.createElement('div');
    host.id = 'ok-overlay-host';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    document.documentElement.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host{all:initial;}
      *,*::before,*::after{box-sizing:border-box;font-family:system-ui,Segoe UI,Arial;}
      .win{position:fixed;left:24px;top:24px;width:360px;height:230px;background:#111;color:#e5e7eb;
        border:1px solid #333;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,.45);
        display:flex;flex-direction:column;overflow:hidden;}
      .titlebar{height:34px;background:#1a1a1a;border-bottom:1px solid #222;display:flex;align-items:center;
        justify-content:space-between;padding:0 10px;cursor:move;user-select:none;}
      .title{font-weight:600;font-size:13px;}
      .btn{border:0;background:#222;color:#ccc;border-radius:4px;width:24px;height:24px;cursor:pointer;}
      .btn:hover{background:#2c2c2c;}
      .content{flex:1;padding:10px;font-size:13px;line-height:1.35;}
      label.row{display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;}
      input[type="checkbox"]{width:16px;height:16px;}
      .field{display:flex;flex-direction:column;gap:4px;margin-top:6px;}
      .field input[type="text"]{background:#0e0e0e;border:1px solid #2a2a2a;color:#e5e7eb;border-radius:6px;padding:6px 8px;}
      .hint{font-size:11px;color:#a1a1aa;}
      .resize{position:absolute;right:0;bottom:0;width:12px;height:12px;cursor:nwse-resize;
        background:linear-gradient(135deg,transparent 50%,#555 50%);}
    `;
    root.appendChild(style);

    const win = document.createElement('div');
    win.className = 'win';
    win.innerHTML = `
      <div class="titlebar" data-drag>
        <div class="title">osu!koko <span style="opacity:.6">overlay</span></div>
        <button class="btn" data-min>—</button>
      </div>
      <div class="content">
        <label class="row"><input type="checkbox" id="DwnEnbl"> Download Enable</label>
        <label class="row"><input type="checkbox" id="DwnBmVi"> Download Without Video</label>
        <label class="row"><input type="checkbox" id="AutoClose"> Auto-Close After Download</label>
        <label class="row"><input type="checkbox" id="UseCustom"> Use Custom Link</label>
        <div id="customWrap">
          <div class="field">
            <label>Custom URL (with video)</label>
            <input type="text" id="customVid" placeholder="https://catboy.best/d/\${id}">
            <div class="hint">Empty = default <code>${DEF_VID}</code></div>
          </div>
          <div class="field">
            <label>Custom URL (without video)</label>
            <input type="text" id="customNoVid" placeholder="https://catboy.best/d/\${id}n">
            <div class="hint">Empty = default <code>${DEF_NOVID}</code></div>
          </div>
        </div>
      </div>
      <div class="resize" data-resize></div>
    `;
    root.appendChild(win);

    const el = {
      DwnEnbl: root.getElementById('DwnEnbl'),
      DwnBmVi: root.getElementById('DwnBmVi'),
      AutoClose: root.getElementById('AutoClose'),
      UseCustom: root.getElementById('UseCustom'),
      customVid: root.getElementById('customVid'),
      customNoVid: root.getElementById('customNoVid'),
      wrap: root.getElementById('customWrap'),
      content: win.querySelector('.content'),
    };

    el.DwnEnbl.checked = state.DwnEnbl;
    el.DwnBmVi.checked = state.DwnBmVi;
    el.AutoClose.checked = state.AutoClose;
    el.UseCustom.checked = state.UseCustom;
    el.customVid.value = state.customVid;
    el.customNoVid.value = state.customNoVid;

    const toggleCustom = () => el.wrap.style.display = state.UseCustom ? '' : 'none';
    toggleCustom();

    const apply = () => {
      const vw = window.innerWidth, vh = window.innerHeight, ui = state.ui;
      ui.x = clamp(ui.x, 8, vw - 160); ui.y = clamp(ui.y, 8, vh - 80);
      ui.w = clamp(ui.w, 300, vw - 32); ui.h = clamp(ui.h, 160, vh - 32);
      Object.assign(win.style, { left: `${ui.x}px`, top: `${ui.y}px`, width: `${ui.w}px`, height: `${ui.h}px` });
    };
    const render = () => {
      if (state.ui.minimized) { el.content.style.display = 'none'; win.style.height = '34px'; }
      else { el.content.style.display = ''; apply(); }
    };
    apply(); render();

    const drag = win.querySelector('[data-drag]');
    drag.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      const r = win.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, ox = r.left, oy = r.top;
      const move = e => {
        win.style.left = clamp(ox + e.clientX - sx, 0, window.innerWidth - 80) + 'px';
        win.style.top = clamp(oy + e.clientY - sy, 0, window.innerHeight - 40) + 'px';
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        const r2 = win.getBoundingClientRect(); state.ui.x = r2.left; state.ui.y = r2.top; save(state);
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    drag.addEventListener('dblclick', () => { state.ui.minimized = !state.ui.minimized; render(); save(state); });

    const resize = win.querySelector('.resize');
    resize.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      const r = win.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, sw = r.width, sh = r.height;
      const move = e => {
        win.style.width = clamp(sw + e.clientX - sx, 300, window.innerWidth - 32) + 'px';
        win.style.height = clamp(sh + e.clientY - sy, 160, window.innerHeight - 32) + 'px';
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        const r2 = win.getBoundingClientRect(); state.ui.w = r2.width; state.ui.h = r2.height; save(state);
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });

    root.querySelector('[data-min]').addEventListener('click', () => {
      state.ui.minimized = !state.ui.minimized; render(); save(state);
    });
    el.DwnEnbl.addEventListener('input', () => { state.DwnEnbl = el.DwnEnbl.checked; save(state); });
    el.DwnBmVi.addEventListener('input', () => { state.DwnBmVi = el.DwnBmVi.checked; save(state); });
    el.AutoClose.addEventListener('input', () => { state.AutoClose = el.AutoClose.checked; save(state); });
    el.UseCustom.addEventListener('input', () => { state.UseCustom = el.UseCustom.checked; toggleCustom(); save(state); });
    el.customVid.addEventListener('change', () => { state.customVid = sanitize(el.customVid.value); el.customVid.value = state.customVid; save(state); });
    el.customNoVid.addEventListener('change', () => { state.customNoVid = sanitize(el.customNoVid.value); el.customNoVid.value = state.customNoVid; save(state); });
    window.addEventListener('resize', apply);
  }

  // ---- SPA-safe route handling (single handler, with single-shot debounce) ----
  function handleRoute() {
    makeOverlay();
    autoDownload();
  }

  handleRoute(); // initial load

  const _ps = history.pushState, _rs = history.replaceState;
  history.pushState = function(...a){ const r=_ps.apply(this,a); setTimeout(handleRoute,0); return r; };
  history.replaceState = function(...a){ const r=_rs.apply(this,a); setTimeout(handleRoute,0); return r; };
  window.addEventListener('popstate', handleRoute);

  let last = location.href;
  new MutationObserver(() => {
    if (location.href !== last) { last = location.href; handleRoute(); }
  }).observe(document, { subtree:true, childList:true });

})();
