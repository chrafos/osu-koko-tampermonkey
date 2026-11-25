// ==UserScript==
// @name         osu!koko
// @namespace    chrafos
// @version      1.2.2
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

(()=>{let z=/^\/(?:beatmapsets|s)\/(\d+)(?:[/?#]|$)/,B=/\s+/g,_=/^http:\/\//i,G=/^https:\/\//i,H=/^[a-z][a-z0-9+.-]*:/i,S=/\$\{id\}/g,g=Object.freeze({vid:"https://catboy.best/d/${id}",noVid:"https://catboy.best/d/${id}n"}),N=(e,t,n)=>e<t?t:e>n?n:e,A=(e,t)=>{let n=Number(e);return Number.isFinite(n)?n:t};function T(e){if(typeof e!=="string"||!e)return"";let t=e.trim().replace(B,"");if(!t)return"";if(_.test(t))t=t.replace(_,"https://");else if(!G.test(t)){if(H.test(t))return"";t="https://"+t}if(!t.includes("${id}"))t+=t.endsWith("/")?"${id}":"/${id}";try{if(new URL(t.replace(S,"1")).protocol!=="https:")return""}catch{return""}return t}function P(){let e=null;try{e=JSON.parse(localStorage.getItem("osukoko.overlay.settings")||"null")}catch{e=null}let t=e&&typeof e==="object"?e:{},n=t.ui&&typeof t.ui==="object"?t.ui:{};return{DwnEnbl:Boolean(t.DwnEnbl??!0),DwnBmVi:Boolean(t.DwnBmVi??!1),AutoClose:Boolean(t.AutoClose??!0),UseCustom:Boolean(t.UseCustom??!1),DirectOpen:Boolean(t.DirectOpen??!1),customVid:T(t.customVid),customNoVid:T(t.customNoVid),ui:{x:A(n.x,16),y:A(n.y,-1),minimized:Boolean(n.minimized??!1)}}}function k(e){try{localStorage.setItem("osukoko.overlay.settings",JSON.stringify(e))}catch{}}let x=(e=location.pathname)=>{let t=z.exec(e);return t?t[1]:null};function O(e){let t=e.DwnBmVi,n=t?g.noVid:g.vid;return e.UseCustom?(t?e.customNoVid:e.customVid)||n:n}function Y(e,t){return O(e).replace(S,encodeURIComponent(t))}function M(e){let t="";try{t=new URL(O(e).replace(S,"1")).origin}catch{return}let n=document.head||document.documentElement;if(!n)return;let r=document.getElementById("ok-mirror-preconnect");if(!r)r=document.createElement("link"),r.id="ok-mirror-preconnect",r.rel="preconnect",n.appendChild(r);if(r.href!==t&&r.href!==`${t}/`)r.href=t}function q(e){if(typeof GM_openInTab==="function")try{return GM_openInTab(e,{active:!1,insert:!0}),!0}catch{}return E(e)}function E(e){try{let t=document.body||document.documentElement;if(t){let n=document.createElement("a");return n.href=e,n.target="_blank",n.rel="noopener",n.referrerPolicy="origin",t.appendChild(n),n.click(),n.remove(),!0}}catch{}if(typeof GM_openInTab==="function")try{return GM_openInTab(e,{active:!1,insert:!0}),!0}catch{}return location.href=e,!1}function X(e,t,n,r){if(n.DirectOpen){if(q(e))r();return}if(typeof GM_download==="function"){let a=!1,o=()=>{if(a)return;a=!0,r()};try{GM_download({url:e,name:`${t}.osz`,saveAs:!1,headers:{Referer:`${location.origin}/`},onload:o,onerror:()=>{if(E(e))o()},ontimeout:()=>{if(E(e))o()}});return}catch{}}if(E(e))r()}function F(e){let t=null,n=null,r=0,a=0,o=0,m=()=>{if(a)clearTimeout(a);if(o)clearTimeout(o);a=0,o=0},l=(b)=>{if(!e.AutoClose||x()!==b)return;if(window.close(),!a)a=setTimeout(()=>{if(a=0,x()!==b)return;window.open("","_self"),window.close()},120);if(!o)o=setTimeout(()=>{if(o=0,document.visibilityState==="hidden"||x()!==b)return;if(history.length>1)history.back();else location.replace("https://osu.ppy.sh/beatmapsets")},400)};return function(){let p=x();if(!p)return t=null,m(),!1;if(!e.DwnEnbl||p===t)return!1;let w=Date.now();if(n===p&&w-r<1500)return!1;t=p,n=p,r=w,m();let y=Y(e,p);return X(y,p,e,()=>l(p)),!0}}let K=`
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
  `;function L(e){if(document.getElementById("ok-hud-host"))return;let t=document.body||document.documentElement;if(!t)return;let n=document.createElement("div");n.id="ok-hud-host",t.appendChild(n);let r=n.attachShadow({mode:"open"}),a=document.createElement("style");a.textContent=K;let o=document.createElement("div");o.className="dock",o.innerHTML='<div class="bar">'+'<div class="grip" data-grip title="Drag to move · Double-click to collapse">koko</div>'+'<div class="keys"><button type="button" class="key" data-k="DwnEnbl" title="Auto-download">DL</button><button type="button" class="key" data-k="DwnBmVi" title="Without video">NOVID</button><button type="button" class="key" data-k="AutoClose" title="Auto-close tab">CLOSE</button><button type="button" class="key" data-k="DirectOpen" title="Bypass GM_download (for external download managers)">DIRECT</button><button type="button" class="key" data-k="UseCustom" title="Use custom mirror">CUSTOM</button>'+'<button type="button" class="key" data-tray title="Mirror URLs">⋯</button>'+`</div></div><div class="tray" hidden><div class="row"><span class="tag">VID</span><input class="in" type="text" data-u="customVid" placeholder="${g.vid}"></div><div class="row"><span class="tag">NOVID</span><input class="in" type="text" data-u="customNoVid" placeholder="${g.noVid}"></div></div>`,r.append(a,o);let m=o.querySelector(".tray"),l=o.querySelector("[data-grip]"),b=o.querySelector("[data-tray]"),p=o.querySelectorAll("[data-k]"),w=o.querySelectorAll("[data-u]"),y=!1,f=e.ui.x,d=e.ui.y,R=0,v=(i,s)=>{let c=o.getBoundingClientRect(),I=Math.max(10,window.innerWidth-(c.width||220)-10),j=Math.max(10,window.innerHeight-(c.height||28)-10);f=N(i,10,I),d=N(s,10,j),o.style.transform=`translate3d(${f}px, ${d}px, 0)`},D=()=>{o.dataset.armed=e.DwnEnbl?"1":"0",o.dataset.min=e.ui.minimized?"1":"0";for(let i of p)i.setAttribute("aria-pressed",String(Boolean(e[i.dataset.k])));m.hidden=!y||e.ui.minimized,b.setAttribute("aria-pressed",String(!m.hidden))};for(let i of w)i.value=e[i.dataset.u];if(D(),d<0)d=Math.max(10,window.innerHeight-44);v(f,d),r.addEventListener("click",(i)=>{let s=i.target;if(!(s instanceof HTMLElement))return;let c=s.dataset.k;if(c){if(e[c]=!e[c],c==="UseCustom"&&e.UseCustom)y=!0;if(D(),v(f,d),k(e),c==="UseCustom"||c==="DwnBmVi")M(e);return}if("tray"in s.dataset)y=!y,D(),v(f,d)}),r.addEventListener("change",(i)=>{let s=i.target;if(!(s instanceof HTMLInputElement))return;let c=s.dataset.u;if(!c)return;let I=T(s.value);e[c]=I,s.value=I,k(e),M(e)}),l.addEventListener("dblclick",()=>{e.ui.minimized=!e.ui.minimized,D(),v(f,d),k(e)});let u=null;l.addEventListener("pointerdown",(i)=>{if(i.button!==0)return;u={sx:i.clientX,sy:i.clientY,ox:f,oy:d,moved:!1},l.setPointerCapture(i.pointerId)}),l.addEventListener("pointermove",(i)=>{if(!u)return;let s=i.clientX-u.sx,c=i.clientY-u.sy;if(!u.moved&&Math.abs(s)+Math.abs(c)<3)return;u.moved=!0,v(u.ox+s,u.oy+c)});let V=(i)=>{if(!u)return;let s=u.moved;if(u=null,l.hasPointerCapture(i.pointerId))l.releasePointerCapture(i.pointerId);if(s)e.ui.x=Math.round(f),e.ui.y=Math.round(d),k(e)};l.addEventListener("pointerup",V),l.addEventListener("pointercancel",V),window.addEventListener("resize",()=>{if(R)return;R=requestAnimationFrame(()=>{R=0,v(f,d)})},{passive:!0})}function C(e){if(document.body)L(e);else document.addEventListener("DOMContentLoaded",()=>L(e),{once:!0})}function W(e){let t=location.href,n=()=>{let a=location.href;if(a===t)return;t=a,e()},r=(a)=>function(...m){let l=a.apply(this,m);return n(),l};history.pushState=r(history.pushState),history.replaceState=r(history.replaceState),window.addEventListener("popstate",n,{passive:!0})}let h=P(),U=F(h);if(M(h),U()&&h.AutoClose)setTimeout(()=>{if(document.visibilityState!=="hidden")C(h)},600);else C(h);W(()=>{U(),C(h)})})();
