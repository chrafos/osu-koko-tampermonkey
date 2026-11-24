// ==UserScript==
// @name         osu!koko
// @namespace    chrafos
// @version      1.2.0
// @description  Minimal osu!-native HUD + instant beatmapset auto-download, auto-close, and custom mirror templates.
// @author       chrafos
// @match        https://osu.ppy.sh/beatmapsets*
// @run-at       document-start
// @grant        GM_download
// @grant        GM_openInTab
// @connect      catboy.best
// @connect      *
// ==/UserScript==

(()=>{"use strict";const M="osukoko.overlay.settings",T="ok-hud-host",B="https://osu.ppy.sh/beatmapsets",H=/^\/beatmapsets\/(\d+)(?:[/?#]|$)/,G=/\s+/g,A=/^http:\/\//i,O=/^https:\/\//i,$=/^[a-z][a-z0-9+.-]*:/i,R=/\$\{id\}/g,v=Object.freeze({vid:"https://catboy.best/d/${id}",noVid:"https://catboy.best/d/${id}n"}),N=(t,e,o)=>t<e?e:t>o?o:t,L=(t,e)=>{const o=Number(t);return Number.isFinite(o)?o:e};function D(t){if(typeof t!="string"||!t)return"";let e=t.trim().replace(G,"");if(!e)return"";if(A.test(e))e=e.replace(A,"https://");else if(!O.test(e)){if($.test(e))return"";e="https://"+e}e.includes("${id}")||(e+=e.endsWith("/")?"${id}":"/${id}");try{if(new URL(e.replace(R,"1")).protocol!=="https:")return""}catch{return""}return e}function P(){let t=null;try{t=JSON.parse(localStorage.getItem(M)||"null")}catch{t=null}const e=t&&typeof t=="object"?t:{},o=e.ui&&typeof e.ui=="object"?e.ui:{};return{DwnEnbl:!!(e.DwnEnbl??!0),DwnBmVi:!!(e.DwnBmVi??!1),AutoClose:!!(e.AutoClose??!0),UseCustom:!!(e.UseCustom??!1),customVid:D(e.customVid),customNoVid:D(e.customNoVid),ui:{x:L(o.x,16),y:L(o.y,-1),minimized:!!(o.minimized??!1)}}}function g(t){try{localStorage.setItem(M,JSON.stringify(t))}catch{}}const k=(t=location.pathname)=>{const e=H.exec(t);return e?e[1]:null};function q(t,e){const o=t.DwnBmVi,a=o?v.noVid:v.vid;return(t.UseCustom&&(o?t.customNoVid:t.customVid)||a).replace(R,encodeURIComponent(e))}function V(t){try{const e=document.body||document.documentElement;if(e){const o=document.createElement("a");o.href=t,o.target="_blank",o.rel="noopener",o.referrerPolicy="origin",e.appendChild(o),o.click(),o.remove();return}}catch{}if(typeof GM_openInTab=="function")try{GM_openInTab(t,{active:!1,insert:!0});return}catch{}location.href=t}function X(t,e,o){if(typeof GM_download=="function"){let a=!1;const r=()=>{a||(a=!0,o())};try{GM_download({url:t,name:`${e}.osz`,saveAs:!1,headers:{Referer:`${location.origin}/`},onprogress:r,onload:r,onerror:()=>{V(t),r()}});return}catch{}}V(t),o()}function Y(t){let e=null,o=null,a=0,r=0,i=0;const m=()=>{r&&clearTimeout(r),i&&clearTimeout(i),r=0,i=0},l=h=>{!t.AutoClose||k()!==h||(window.close(),r||(r=setTimeout(()=>{r=0,k()===h&&(window.open("","_self"),window.close())},80)),i||(i=setTimeout(()=>{i=0,!(document.visibilityState==="hidden"||k()!==h)&&(history.length>1?history.back():location.replace(B))},320)))};return function(){const u=k();if(!u)return e=null,m(),!1;if(!t.DwnEnbl||u===e)return!1;const w=Date.now();if(o===u&&w-a<1500)return!1;e=u,o=u,a=w,m();const b=q(t,u),d=t.AutoClose?setTimeout(()=>l(u),450):0;return X(b,u,()=>{d&&clearTimeout(d),l(u)}),t.AutoClose}}const F=`
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
  `;function _(t){if(document.getElementById(T))return;const e=document.body||document.documentElement;if(!e)return;const o=document.createElement("div");o.id=T,e.appendChild(o);const a=o.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=F;const i=document.createElement("div");i.className="dock",i.innerHTML=`<div class="bar"><div class="grip" data-grip title="Drag to move \xB7 Double-click to collapse">koko</div><div class="keys"><button type="button" class="key" data-k="DwnEnbl" title="Auto-download">DL</button><button type="button" class="key" data-k="DwnBmVi" title="Without video">NOVID</button><button type="button" class="key" data-k="AutoClose" title="Auto-close tab">CLOSE</button><button type="button" class="key" data-k="UseCustom" title="Use custom mirror">CUSTOM</button><button type="button" class="key" data-tray title="Mirror URLs">\u22EF</button></div></div><div class="tray" hidden><div class="row"><span class="tag">VID</span><input class="in" type="text" data-u="customVid" placeholder="${v.vid}"></div><div class="row"><span class="tag">NOVID</span><input class="in" type="text" data-u="customNoVid" placeholder="${v.noVid}"></div></div>`,a.append(r,i);const m=i.querySelector(".tray"),l=i.querySelector("[data-grip]"),h=i.querySelector("[data-tray]"),u=i.querySelectorAll("[data-k]"),w=i.querySelectorAll("[data-u]");let b=!1,d=t.ui.x,p=t.ui.y,C=0;const y=(n,s)=>{const c=i.getBoundingClientRect(),S=Math.max(10,window.innerWidth-(c.width||220)-10),j=Math.max(10,window.innerHeight-(c.height||28)-10);d=N(n,10,S),p=N(s,10,j),i.style.transform=`translate3d(${d}px, ${p}px, 0)`},E=()=>{i.dataset.armed=t.DwnEnbl?"1":"0",i.dataset.min=t.ui.minimized?"1":"0";for(const n of u)n.setAttribute("aria-pressed",String(!!t[n.dataset.k]));m.hidden=!b||t.ui.minimized,h.setAttribute("aria-pressed",String(!m.hidden))};for(const n of w)n.value=t[n.dataset.u];E(),p<0&&(p=Math.max(10,window.innerHeight-44)),y(d,p),a.addEventListener("click",n=>{const s=n.target;if(!(s instanceof HTMLElement))return;const c=s.dataset.k;if(c){t[c]=!t[c],c==="UseCustom"&&t.UseCustom&&(b=!0),E(),y(d,p),g(t);return}"tray"in s.dataset&&(b=!b,E(),y(d,p))}),a.addEventListener("change",n=>{const s=n.target;if(!(s instanceof HTMLInputElement))return;const c=s.dataset.u;if(!c)return;const S=D(s.value);t[c]=S,s.value=S,g(t)}),l.addEventListener("dblclick",()=>{t.ui.minimized=!t.ui.minimized,E(),y(d,p),g(t)});let f=null;l.addEventListener("pointerdown",n=>{n.button===0&&(f={sx:n.clientX,sy:n.clientY,ox:d,oy:p,moved:!1},l.setPointerCapture(n.pointerId))}),l.addEventListener("pointermove",n=>{if(!f)return;const s=n.clientX-f.sx,c=n.clientY-f.sy;!f.moved&&Math.abs(s)+Math.abs(c)<3||(f.moved=!0,y(f.ox+s,f.oy+c))});const U=n=>{if(!f)return;const s=f.moved;f=null,l.hasPointerCapture(n.pointerId)&&l.releasePointerCapture(n.pointerId),s&&(t.ui.x=Math.round(d),t.ui.y=Math.round(p),g(t))};l.addEventListener("pointerup",U),l.addEventListener("pointercancel",U),window.addEventListener("resize",()=>{C||(C=requestAnimationFrame(()=>{C=0,y(d,p)}))},{passive:!0})}function I(t){document.body?_(t):document.addEventListener("DOMContentLoaded",()=>_(t),{once:!0})}function W(t){let e=location.href;const o=()=>{const r=location.href;r!==e&&(e=r,t())},a=r=>function(...m){const l=r.apply(this,m);return o(),l};history.pushState=a(history.pushState),history.replaceState=a(history.replaceState),window.addEventListener("popstate",o,{passive:!0})}const x=P(),z=Y(x);z()?setTimeout(()=>{document.visibilityState!=="hidden"&&I(x)},350):I(x),W(()=>{z(),I(x)})})();
