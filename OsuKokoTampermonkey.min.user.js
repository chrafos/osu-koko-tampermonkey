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

(()=>{"use strict";const T="osukoko.overlay.settings",A="ok-hud-host",B="https://osu.ppy.sh/beatmapsets",H=/^\/(?:beatmapsets|s)\/(\d+)(?:[/?#]|$)/,G=/\s+/g,R=/^http:\/\//i,O=/^https:\/\//i,$=/^[a-z][a-z0-9+.-]*:/i,N=/\$\{id\}/g,g=Object.freeze({vid:"https://catboy.best/d/${id}",noVid:"https://catboy.best/d/${id}n"}),L=(t,e,n)=>t<e?e:t>n?n:t,V=(t,e)=>{const n=Number(t);return Number.isFinite(n)?n:e};function D(t){if(typeof t!="string"||!t)return"";let e=t.trim().replace(G,"");if(!e)return"";if(R.test(e))e=e.replace(R,"https://");else if(!O.test(e)){if($.test(e))return"";e="https://"+e}e.includes("${id}")||(e+=e.endsWith("/")?"${id}":"/${id}");try{if(new URL(e.replace(N,"1")).protocol!=="https:")return""}catch{return""}return e}function P(){let t=null;try{t=JSON.parse(localStorage.getItem(T)||"null")}catch{t=null}const e=t&&typeof t=="object"?t:{},n=e.ui&&typeof e.ui=="object"?e.ui:{};return{DwnEnbl:!!(e.DwnEnbl??!0),DwnBmVi:!!(e.DwnBmVi??!1),AutoClose:!!(e.AutoClose??!0),UseCustom:!!(e.UseCustom??!1),customVid:D(e.customVid),customNoVid:D(e.customNoVid),ui:{x:V(n.x,16),y:V(n.y,-1),minimized:!!(n.minimized??!1)}}}function k(t){try{localStorage.setItem(T,JSON.stringify(t))}catch{}}const x=(t=location.pathname)=>{const e=H.exec(t);return e?e[1]:null};function q(t,e){const n=t.DwnBmVi,a=n?g.noVid:g.vid;return(t.UseCustom&&(n?t.customNoVid:t.customVid)||a).replace(N,encodeURIComponent(e))}function I(t){try{const e=document.body||document.documentElement;if(e){const n=document.createElement("a");return n.href=t,n.target="_blank",n.rel="noopener",n.referrerPolicy="origin",e.appendChild(n),n.click(),n.remove(),!0}}catch{}if(typeof GM_openInTab=="function")try{return GM_openInTab(t,{active:!1,insert:!0}),!0}catch{}return location.href=t,!1}function X(t,e,n){if(typeof GM_download=="function"){let a=!1;const r=()=>{a||(a=!0,n())};try{GM_download({url:t,name:`${e}.osz`,saveAs:!1,headers:{Referer:`${location.origin}/`},onload:r,onerror:()=>{I(t)&&r()},ontimeout:()=>{I(t)&&r()}});return}catch{}}I(t)&&n()}function Y(t){let e=null,n=null,a=0,r=0,i=0;const m=()=>{r&&clearTimeout(r),i&&clearTimeout(i),r=0,i=0},c=h=>{!t.AutoClose||x()!==h||(window.close(),r||(r=setTimeout(()=>{r=0,x()===h&&(window.open("","_self"),window.close())},120)),i||(i=setTimeout(()=>{i=0,!(document.visibilityState==="hidden"||x()!==h)&&(history.length>1?history.back():location.replace(B))},400)))};return function(){const p=x();if(!p)return e=null,m(),!1;if(!t.DwnEnbl||p===e)return!1;const w=Date.now();if(n===p&&w-a<1500)return!1;e=p,n=p,a=w,m();const b=q(t,p);return X(b,p,()=>c(p)),!0}}const F=`
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
  `;function _(t){if(document.getElementById(A))return;const e=document.body||document.documentElement;if(!e)return;const n=document.createElement("div");n.id=A,e.appendChild(n);const a=n.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=F;const i=document.createElement("div");i.className="dock",i.innerHTML=`<div class="bar"><div class="grip" data-grip title="Drag to move \xB7 Double-click to collapse">koko</div><div class="keys"><button type="button" class="key" data-k="DwnEnbl" title="Auto-download">DL</button><button type="button" class="key" data-k="DwnBmVi" title="Without video">NOVID</button><button type="button" class="key" data-k="AutoClose" title="Auto-close tab">CLOSE</button><button type="button" class="key" data-k="UseCustom" title="Use custom mirror">CUSTOM</button><button type="button" class="key" data-tray title="Mirror URLs">\u22EF</button></div></div><div class="tray" hidden><div class="row"><span class="tag">VID</span><input class="in" type="text" data-u="customVid" placeholder="${g.vid}"></div><div class="row"><span class="tag">NOVID</span><input class="in" type="text" data-u="customNoVid" placeholder="${g.noVid}"></div></div>`,a.append(r,i);const m=i.querySelector(".tray"),c=i.querySelector("[data-grip]"),h=i.querySelector("[data-tray]"),p=i.querySelectorAll("[data-k]"),w=i.querySelectorAll("[data-u]");let b=!1,f=t.ui.x,d=t.ui.y,C=0;const y=(o,s)=>{const l=i.getBoundingClientRect(),S=Math.max(10,window.innerWidth-(l.width||220)-10),j=Math.max(10,window.innerHeight-(l.height||28)-10);f=L(o,10,S),d=L(s,10,j),i.style.transform=`translate3d(${f}px, ${d}px, 0)`},E=()=>{i.dataset.armed=t.DwnEnbl?"1":"0",i.dataset.min=t.ui.minimized?"1":"0";for(const o of p)o.setAttribute("aria-pressed",String(!!t[o.dataset.k]));m.hidden=!b||t.ui.minimized,h.setAttribute("aria-pressed",String(!m.hidden))};for(const o of w)o.value=t[o.dataset.u];E(),d<0&&(d=Math.max(10,window.innerHeight-44)),y(f,d),a.addEventListener("click",o=>{const s=o.target;if(!(s instanceof HTMLElement))return;const l=s.dataset.k;if(l){t[l]=!t[l],l==="UseCustom"&&t.UseCustom&&(b=!0),E(),y(f,d),k(t);return}"tray"in s.dataset&&(b=!b,E(),y(f,d))}),a.addEventListener("change",o=>{const s=o.target;if(!(s instanceof HTMLInputElement))return;const l=s.dataset.u;if(!l)return;const S=D(s.value);t[l]=S,s.value=S,k(t)}),c.addEventListener("dblclick",()=>{t.ui.minimized=!t.ui.minimized,E(),y(f,d),k(t)});let u=null;c.addEventListener("pointerdown",o=>{o.button===0&&(u={sx:o.clientX,sy:o.clientY,ox:f,oy:d,moved:!1},c.setPointerCapture(o.pointerId))}),c.addEventListener("pointermove",o=>{if(!u)return;const s=o.clientX-u.sx,l=o.clientY-u.sy;!u.moved&&Math.abs(s)+Math.abs(l)<3||(u.moved=!0,y(u.ox+s,u.oy+l))});const U=o=>{if(!u)return;const s=u.moved;u=null,c.hasPointerCapture(o.pointerId)&&c.releasePointerCapture(o.pointerId),s&&(t.ui.x=Math.round(f),t.ui.y=Math.round(d),k(t))};c.addEventListener("pointerup",U),c.addEventListener("pointercancel",U),window.addEventListener("resize",()=>{C||(C=requestAnimationFrame(()=>{C=0,y(f,d)}))},{passive:!0})}function M(t){document.body?_(t):document.addEventListener("DOMContentLoaded",()=>_(t),{once:!0})}function W(t){let e=location.href;const n=()=>{const r=location.href;r!==e&&(e=r,t())},a=r=>function(...m){const c=r.apply(this,m);return n(),c};history.pushState=a(history.pushState),history.replaceState=a(history.replaceState),window.addEventListener("popstate",n,{passive:!0})}const v=P(),z=Y(v);z()&&v.AutoClose?setTimeout(()=>{document.visibilityState!=="hidden"&&M(v)},600):M(v),W(()=>{z(),M(v)})})();
