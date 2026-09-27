/* Holographic windows: translucent laser-cyan panels that open from a thin line of light,
   hang in the air at a slight 3D tilt, then fold away. Like the screens in heist films.
   PNHolo.open({ title, html, x, y, w, tilt, life }) returns { el, body, close() }.
   x and y are the window's centre as a % of the screen. life (ms) closes it automatically. */
(function(){
  "use strict";
  const css = `
  .pnHoloLayer{ position:fixed; inset:0; z-index:8500; pointer-events:none; perspective:1100px; }
  .pnHolo{ position:absolute; transform-style:preserve-3d; transform:translate(-50%,-50%) rotateY(var(--tilt,0deg)) rotateX(var(--tiltx,0deg)); transition:transform .6s ease; }
  /* Feedback round 6: tilted text looked pixelated, so windows swing in at an angle and settle flat */
  .pnHolo.settled{ transform:translate(-50%,-50%); }
  .pnHolo .hw{ position:relative; color:#eafcff; font-family:var(--font-mono, "Courier Prime", monospace); font-size:16px; line-height:1.5;
    background:linear-gradient(160deg, rgba(12,48,60,.94), rgba(6,28,36,.92) 60%, rgba(10,42,54,.94));   /* round 13: opaque, for easy reading */
    border:1px solid rgba(140,235,255,.75); box-shadow:0 0 26px rgba(110,220,255,.35), inset 0 0 34px rgba(110,220,255,.12);
    clip-path:polygon(0 12px, 12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
    backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
    transform:scaleX(0) scaleY(.02); transform-origin:center; transition:transform .22s cubic-bezier(.2,.9,.3,1); }
  .pnHolo.line .hw{ transform:scaleX(1) scaleY(.02); }
  .pnHolo.open .hw{ transform:none; transition:transform .28s cubic-bezier(.2,1.2,.4,1); }
  .pnHolo.closing .hw{ transform:scaleX(1) scaleY(.02); transition:transform .18s ease-in; }
  .pnHolo.gone .hw{ transform:scaleX(0) scaleY(.02); transition:transform .16s ease-in; }
  .pnHolo .hw::before{ content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg, rgba(160,240,255,.07) 0 1px, transparent 1px 3px); animation:holoScan 3s linear infinite; }
  .pnHolo .hw::after{ content:""; position:absolute; left:0; right:0; height:40%; top:-40%; pointer-events:none; background:linear-gradient(transparent, rgba(160,240,255,.12), transparent); animation:holoSweep 2.4s ease-in-out infinite; }
  @keyframes holoScan{ to{ background-position:0 60px; } }
  @keyframes holoSweep{ to{ top:100%; } }
  .pnHolo .ht{ display:flex; justify-content:space-between; gap:12px; padding:6px 12px; border-bottom:1px solid rgba(140,235,255,.45); font-family:var(--font-ui, sans-serif); font-weight:700; font-size:11px; letter-spacing:.2em; color:#8feaff; }
  .pnHolo .ht i{ font-style:normal; color:#ff6b8a; animation:holoBlink 1s steps(2) infinite; }
  @keyframes holoBlink{ 50%{ opacity:.2; } }
  .pnHolo .hb{ padding:12px 16px 14px; opacity:0; transition:opacity .2s .12s; }
  .pnHolo.open .hb{ opacity:1; }
  .pnHolo .flick{ animation:holoFlicker 4s infinite; }
  @keyframes holoFlicker{ 0%,100%{ opacity:1; } 92%{ opacity:1; } 93%{ opacity:.55; } 94%{ opacity:1; } 97%{ opacity:.8; } }
  .pnHolo .big{ font-family:var(--font-ui, sans-serif); font-weight:700; letter-spacing:.14em; color:#eafcff; text-shadow:0 0 18px rgba(120,230,255,.8); }
  .pnHolo .k{ color:#8feaff; } .pnHolo .pk{ color:#ff7ae6; } .pnHolo .yl{ color:#ffe68a; } .pnHolo .ok{ color:#7dffc4; } .pnHolo .bad{ color:#ff8aa0; }
  .pnHolo .bar{ height:6px; background:rgba(140,235,255,.15); margin-top:6px; } .pnHolo .bar b{ display:block; height:100%; background:#8feaff; box-shadow:0 0 10px #8feaff; }
  @media (prefers-reduced-motion: reduce){ .pnHolo .hw::before, .pnHolo .hw::after, .pnHolo .flick{ animation:none; } }`;
  let layer = null;
  function ensure(){
    if(layer) return layer;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    layer = document.createElement("div"); layer.className = "pnHoloLayer"; layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    return layer;
  }
  const speed = () => (window.PNTest ? PNTest.speed() : 1);
  const wait = ms => new Promise(r => setTimeout(r, ms / speed()));

  function open({ title = "", html = "", x = 50, y = 50, w = 320, tilt = 0, tiltx = 0, life = 0, flag = "LIVE", sound = true } = {}){
    ensure();
    const el = document.createElement("div"); el.className = "pnHolo";
    el.style.left = x + "%"; el.style.top = y + "%"; el.style.setProperty("--tilt", tilt + "deg"); el.style.setProperty("--tiltx", tiltx + "deg");
    el.innerHTML = `<div class="hw flick" style="width:${w}px"><div class="ht"><span>${title}</span><span><i>●</i> ${flag}</span></div><div class="hb">${html}</div></div>`;
    layer.appendChild(el);
    if(sound && window.PNSound) PNSound.play("holo");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("line")));
    setTimeout(() => el.classList.add("open"), 200 / speed());
    setTimeout(() => el.classList.add("settled"), 420 / speed());
    let closed = false;
    const api = {
      el, body: el.querySelector(".hb"),
      async close(){
        if(closed) return; closed = true;
        el.classList.remove("open"); el.classList.add("closing");
        await wait(170); el.classList.add("gone");
        await wait(170); el.remove();
      },
    };
    if(life) setTimeout(() => api.close(), life / speed());
    return api;
  }
  // Several windows, one after another
  async function burst(list, gap = 220){
    const out = [];
    for(const w of list){ out.push(open(w)); await wait(gap); }
    return out;
  }
  window.PNHolo = { open, burst, wait };
})();
