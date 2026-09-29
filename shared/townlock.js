/* PRIMENET target lock (shared by modules/briefing.html and modules/map_lab.html). Needs shared/town.js (PNTown); THREE for the 3D part.
   PNTownLock.map(el, { onPin(name, btn) }) : the plain 2D target map (PNTown.plainSvg) with a symbol for each target, in el.
     Returns { el, pins, setView(v), home(), zoom(name, ms, speed) }.
   PNTownLock.play(container, name, { map, speed, hold }) → Promise(true when TARGET LOCKED has shown, false if stopped or no WebGL):
     the map zooms in on the target and fades, four lasers draw its neighbourhood, the camera closes on its building, TARGET LOCKED.
   PNTownLock.stop() cancels and hides it; PNTownLock.close(ms) fades it out; PNTownLock.ok() says whether WebGL works. */
(function(){
  "use strict";
  const T = window.PNTown; if(!T) return;
  const SND = (n, a) => { if(window.PNSound) PNSound.play(n, a); };
  const reduced = () => { const PN = window.Primenet; return !!(PN && PN.reducedMotion ? PN.reducedMotion() : document.documentElement.classList.contains("pn-reduce-motion")); };
  const DRGB = Object.fromEntries(T.DISTRICTS.map(d => [d.id, d.rgb]));
  const NAMES = Object.keys(T.targets);

  const css = `
  .pnt-map{ position:relative; width:100%; aspect-ratio: 860 / 400; border:1px solid var(--line-strong, rgba(255,255,255,.2)); background:#051215; overflow:hidden; }
  .pnt-map > svg{ position:absolute; inset:0; width:100%; height:100%; }
  .pnt-map .pin{ --c:47,191,138; position:absolute; transform:translate(-50%,-17px); display:flex; flex-direction:column; align-items:center; gap:3px; padding:0; border:0; background:none; cursor:pointer; z-index:1; font:inherit; transition:opacity .4s ease; }
  .pnt-map .pin .ic{ position:relative; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; box-sizing:border-box;
    background:rgba(4,14,17,.92); border:2px solid rgba(var(--c),.9); color:rgb(var(--c)); box-shadow:0 0 12px rgba(var(--c),.3); transition:background .2s, color .2s, box-shadow .2s; }
  .pnt-map .pin .ic svg{ width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
  .pnt-map .pin .nm{ font-family:var(--font-ui); font-size:12px; font-weight:700; letter-spacing:.05em; white-space:nowrap; color:#eafff6; background:rgba(4,14,17,.82); padding:1px 6px; border:1px solid rgba(var(--c),.35); }
  .pnt-map .pin:hover .ic, .pnt-map .pin:focus-visible .ic{ box-shadow:0 0 18px rgba(var(--c),.7); }
  .pnt-map .pin:focus-visible{ outline:none; }
  .pnt-map .pin:focus-visible .nm{ border-color:rgb(var(--c)); }
  .pnt-map .pin.sel{ z-index:2; }
  .pnt-map .pin.sel .ic{ background:rgb(var(--c)); color:#041012; }
  .pnt-map .pin.sel .ic::after{ content:""; position:absolute; inset:-2px; border-radius:50%; animation:ptlPulse 1.8s ease-out infinite; }
  .pnt-map .pin.sel .nm{ background:rgb(var(--c)); color:#041012; }
  .pnt-map.locking .pin:not(.sel){ opacity:0; pointer-events:none; }
  @keyframes ptlPulse{ 0%{ box-shadow:0 0 0 0 rgba(var(--c),.55); } 100%{ box-shadow:0 0 0 14px rgba(var(--c),0); } }
  @media (max-width:700px){ .pnt-map .pin .nm{ font-size:10px; } .pnt-map .pin .ic{ width:26px; height:26px; } .pnt-map .pin .ic svg{ width:17px; height:17px; } .pnt-map .pin{ transform:translate(-50%,-13px); } }
  /* The cinematic, over the whole window (as target_locked.html used to be) */
  .ptl{ position:fixed; inset:0; z-index:10; font-family:var(--font-ui); pointer-events:none; }
  .ptl.live{ pointer-events:auto; }
  .ptl[hidden]{ display:none; }
  .ptl-bg{ position:absolute; inset:0; background:radial-gradient(ellipse at 50% 55%, #0b2a33 0%, #04101a 55%, #01060a 100%); opacity:0; }
  .ptl-stage{ position:absolute; inset:0; z-index:1; }
  .ptl-stage canvas{ display:block; width:100%; height:100%; }
  .ptl-scan{ position:absolute; inset:0; pointer-events:none; z-index:2; opacity:0; background:repeating-linear-gradient(0deg, rgba(120,230,255,.05) 0 1px, transparent 1px 4px); mix-blend-mode:screen; }
  .ptl-scan::after{ content:""; position:absolute; left:0; right:0; height:120px; top:-120px; background:linear-gradient(180deg, transparent, rgba(120,230,255,.10), transparent); animation:ptlSweep 3.2s linear infinite; }
  @keyframes ptlSweep{ to{ top:100%; } }
  .ptl-vig{ position:absolute; inset:0; pointer-events:none; z-index:2; opacity:0; box-shadow:inset 0 0 180px rgba(0,0,0,.85); }
  .ptl-head{ position:absolute; left:22px; top:calc(var(--pn-mode-h, 0px) + 18px); z-index:3; font-family:var(--font-mono); font-size:14px; letter-spacing:.14em; color:rgba(140,230,255,.8); line-height:1.7; opacity:0; transition:opacity .5s; }
  .ptl-head.on{ opacity:1; }
  .ptl-head b{ color:#bff4ff; font-weight:700; }
  .ptl-head em{ font-style:normal; color:#ffc94d; }
  .ptl-ret{ position:absolute; z-index:3; pointer-events:none; opacity:0; transform:translate(-50%,-50%); transition:width 1.1s cubic-bezier(.2,.8,.2,1), height 1.1s cubic-bezier(.2,.8,.2,1), opacity .3s; }
  .ptl-ret i{ position:absolute; width:34px; height:34px; border:3px solid #6fe8ff; filter:drop-shadow(0 0 6px rgba(111,232,255,.7)); }
  .ptl-ret i:nth-child(1){ left:0; top:0; border-right:0; border-bottom:0; }
  .ptl-ret i:nth-child(2){ right:0; top:0; border-left:0; border-bottom:0; }
  .ptl-ret i:nth-child(3){ left:0; bottom:0; border-right:0; border-top:0; }
  .ptl-ret i:nth-child(4){ right:0; bottom:0; border-left:0; border-top:0; }
  .ptl-ret.on{ opacity:1; }
  .ptl-ret.locked i{ border-color:#ffc94d; filter:drop-shadow(0 0 10px rgba(255,201,77,.8)); }
  .ptl-stamp{ position:absolute; left:50%; top:72%; z-index:4; transform:translate(-50%,-50%) rotate(-6deg) scale(2.4); opacity:0; pointer-events:none; text-align:center;
    border:5px solid #ffc94d; padding:14px 34px 12px; background:rgba(20,12,0,.55); box-shadow:0 0 40px rgba(255,201,77,.35), inset 0 0 30px rgba(255,201,77,.18); }
  .ptl-stamp b{ display:block; font-size:clamp(30px, 4vw, 54px); letter-spacing:.14em; white-space:nowrap; color:#ffc94d; text-shadow:0 0 24px rgba(255,201,77,.6); line-height:1; }
  .ptl-stamp span{ display:block; margin-top:10px; font-size:clamp(16px, 1.9vw, 24px); letter-spacing:.22em; color:#fff3cf; text-transform:uppercase; }
  .ptl-stamp.on{ animation:ptlStamp .38s cubic-bezier(.3,1.6,.5,1) forwards, ptlShake .3s .38s steps(3) 1; }
  @keyframes ptlStamp{ 0%{ opacity:0; transform:translate(-50%,-50%) rotate(-6deg) scale(2.4); } 100%{ opacity:1; transform:translate(-50%,-50%) rotate(-6deg) scale(1); } }
  @keyframes ptlShake{ 33%{ margin-left:4px; } 66%{ margin-left:-3px; } }
  .ptl-cut{ position:absolute; inset:0; z-index:5; background:#01060a; opacity:0; pointer-events:none; transition:opacity .4s ease; }
  /* Reduced motion: no pulsing, no sweep, the brackets and stamp just appear */
  @media (prefers-reduced-motion: reduce){ .pnt-map .pin.sel .ic::after, .ptl-scan::after{ animation:none; } .ptl-ret{ transition:opacity .3s; } .ptl-stamp.on{ animation:none; opacity:1; transform:translate(-50%,-50%) rotate(-6deg); } }
  .pn-reduce-motion .pnt-map .pin.sel .ic::after, .pn-reduce-motion .ptl-scan::after{ animation:none; }
  .pn-reduce-motion .ptl-ret{ transition:opacity .3s; }
  .pn-reduce-motion .ptl-stamp.on{ animation:none; opacity:1; transform:translate(-50%,-50%) rotate(-6deg); }`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const clamp = v => Math.max(0, Math.min(1, v));
  let runId = 0, spd = () => 1;
  const sleep = ms => new Promise(r => setTimeout(r, ms / spd()));
  function tween(ms, fn, id){
    const t0 = performance.now(), dur = ms / spd();
    return new Promise(res => (function f(now){ if(id !== runId) return res(); const k = Math.min(1, (now - t0) / dur); fn(k); if(k < 1) requestAnimationFrame(f); else res(); })(t0));
  }

  // ---------- The 2D map, drawn from PNTown, with a symbol for each target ----------
  function map(el, { onPin } = {}){
    el.classList.add("pnt-map");
    let svgEl = el.querySelector("svg");
    if(!svgEl){ svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg"); el.appendChild(svgEl); }
    svgEl.setAttribute("viewBox", `0 0 ${T.W} ${T.H}`); svgEl.setAttribute("aria-hidden", "true");
    svgEl.innerHTML = T.plainSvg();
    const pins = {};
    NAMES.forEach(name => {
      const t = T.targets[name];
      const b = document.createElement("button"); b.type = "button"; b.className = "pin"; b.style.setProperty("--c", DRGB[t.level]);
      b.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><g>${T.ICONS[name]}</g></svg></span><span class="nm">${name}</span>`;
      b.setAttribute("aria-label", `${name}, ${T.DISTRICT[t.level]}, security ${T.SECURITY[t.level]}`);
      el.appendChild(b); pins[name] = b;
      if(onPin) onPin(name, b);
    });
    // Centre each symbol in its circle: shift it so the middle of its drawn box sits at the middle of the 24 x 24 view box (needs the map on screen)
    const centre = () => Object.values(pins).forEach(b => { const g = b.querySelector(".ic g"); if(g.dataset.c) return;
      try{ const bb = g.getBBox(); if(bb.width){ g.setAttribute("transform", `translate(${(12 - bb.x - bb.width / 2).toFixed(2)} ${(12 - bb.y - bb.height / 2).toFixed(2)})`); g.dataset.c = 1; } }catch(e){} });
    let vb = [0, 0, T.W, T.H];
    function setView(v){
      vb = v; svgEl.setAttribute("viewBox", v.map(n => Math.round(n * 100) / 100).join(" "));
      NAMES.forEach(name => { const t = T.targets[name]; pins[name].style.left = (t.x - v[0]) / v[2] * 100 + "%"; pins[name].style.top = (t.y - v[1]) / v[3] * 100 + "%"; });
    }
    setView(vb); centre(); requestAnimationFrame(centre);
    const ZOOM = 2.3;
    return { el, pins, centre, setView, get view(){ return vb; },
      home(){ el.classList.remove("locking"); setView([0, 0, T.W, T.H]); },
      // The view box closes in on the area round the target
      zoom(name, ms, id){ const tg = T.targets[name], w = T.W / ZOOM, h = T.H / ZOOM, to = [tg.x - w / 2, tg.y - h / 2, w, h], from = vb.slice();
        return tween(ms, k => { const e = ease(k); setView(from.map((v, i) => v + (to[i] - v) * e)); }, id === undefined ? runId : id); } };
  }

  // ---------- The overlay ----------
  let ov = null, $ = null;
  function overlay(container){
    if(ov){ if(ov.parentNode !== container) container.appendChild(ov); return; }
    ov = document.createElement("div"); ov.className = "ptl"; ov.hidden = true;
    ov.innerHTML = `<div class="ptl-bg"></div><div class="ptl-stage" aria-hidden="true"></div><div class="ptl-scan"></div><div class="ptl-vig"></div><div class="ptl-head"></div>
      <div class="ptl-ret"><i></i><i></i><i></i><i></i></div><div class="ptl-stamp" role="status" aria-live="polite"><b>TARGET LOCKED</b><span></span></div><div class="ptl-cut"></div>`;
    container.appendChild(ov);
    $ = s => ov.querySelector(".ptl-" + s);
  }

  // ---------- The 3D scene: the camera, lasers and tracer, drawing the neighbourhood round the target ----------
  const CYAN = 0x6fe8ff, FOV = 38;
  let renderer = null, tried = false, sc, cam, world, G = null, city = [], target = null, water = null, rings = [], lasers = [], NB = null;
  let mapP = 0, zoomK = 0, tint = 0, bgOp = 0, townOp = 1, zDone = -1, looping = false;
  function scene(){
    if(tried) return !!renderer; tried = true;
    if(!window.THREE) return false;
    try{ renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); if(!renderer.getContext()) throw 0; }catch(e){ renderer = null; return false; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setClearColor(0x000000, 0);
    $("stage").appendChild(renderer.domElement);
    sc = new THREE.Scene(); cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 300);
    world = new THREE.Group(); sc.add(world);
    // The lasers: beams from four emitters up high, each with a glowing tip
    const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(160,240,255,.8)"); gr.addColorStop(1, "rgba(111,232,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const EMIT = [[22, 20, -22], [-22, 20, -22], [22, 20, 18], [-22, 20, 18]];
    lasers = EMIT.map(e => {
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...e, ...e], 3));
      const beam = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })); beam.frustumCulled = false; world.add(beam);
      const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); tip.scale.setScalar(2.8); world.add(tip);
      const src = new THREE.Sprite(tip.material); src.position.set(...e); src.scale.setScalar(1.6); world.add(src);
      return { beam, tip, src };
    });
    size(); window.addEventListener("resize", () => { size(); if(G && $("ret").classList.contains("on")) placeRet(true); });
    return true;
  }
  function size(){ const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }

  // A set of segments that a laser draws in order; the last one grows to meet the laser's tip
  function tracer(list, colFn, parent){
    const n = list.length, src = new Float32Array(n * 6), col = new Float32Array(n * 8);   // colour is RGBA: fading uses alpha, or faded lines turn black
    list.forEach((s, i) => { src.set(s.a, i * 6); src.set(s.b, i * 6 + 3); const c = colFn(s); col.set([...c, ...c], i * 8); });
    const g = new THREE.BufferGeometry(), pos = new THREE.BufferAttribute(src.slice(), 3), ca = new THREE.BufferAttribute(col.slice(), 4);
    g.setAttribute("position", pos); g.setAttribute("color", ca); g.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const obj = new THREE.LineSegments(g, mat); obj.frustumCulled = false; parent.add(obj);
    let cur = -1; const tip = new THREE.Vector3();
    return { obj, mat, list, col, ca, set(p){
      if(p <= 0 || !n){ g.setDrawRange(0, 0); return null; }
      const f = Math.min(1, p) * n, k = Math.min(n - 1, Math.floor(f)), fr = p >= 1 ? 1 : f - k, a = pos.array;
      if(cur >= 0 && cur !== k) for(let j = 3; j < 6; j++) a[cur * 6 + j] = src[cur * 6 + j];
      for(let j = 0; j < 3; j++) a[k * 6 + 3 + j] = src[k * 6 + j] + (src[k * 6 + 3 + j] - src[k * 6 + j]) * fr;
      cur = k; pos.needsUpdate = true; g.setDrawRange(0, (k + 1) * 2);
      return p >= 1 ? null : tip.set(a[k * 6 + 3], a[k * 6 + 4], a[k * 6 + 5]);
    } };
  }
  function flowTex(){   // soft streaks for the river's slow current
    const c = document.createElement("canvas"); c.width = 64; c.height = 256; const x = c.getContext("2d");
    for(let i = 0; i < 14; i++){ const u = 6 + Math.random() * 52, v = Math.random() * 256, l = 20 + Math.random() * 50, g = x.createLinearGradient(0, v, 0, v + l);
      g.addColorStop(0, "rgba(110,190,255,0)"); g.addColorStop(.5, "rgba(110,190,255,.55)"); g.addColorStop(1, "rgba(110,190,255,0)"); x.fillStyle = g; x.fillRect(u, v, 2, l); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const fade = (x, z) => Math.max(.12, Math.min(1, 1 - (Math.hypot(x, z) - 16) / 24));   // dimmer towards the edge of the map
  // Build the neighbourhood for this target: streets, river, rail, parks and docks first, then buildings, each laser from the middle outwards
  function build(name){
    if(G){ world.remove(G); G.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    G = new THREE.Group(); world.add(G);
    NB = T.near(name);
    // The river's water: a faint ribbon with a slow current, fading towards the edge (the lasers trace its banks)
    const pos = [], uv = [], cl = [], idx = []; let len = 0;
    NB.water.forEach(([l, r], i) => { if(i){ const [pl] = NB.water[i - 1]; len += Math.hypot(l[0] - pl[0], l[2] - pl[2]); }
      pos.push(l[0], .03, l[2], r[0], .03, r[2]); uv.push(0, len / 20, 1, len / 20);
      cl.push(1, 1, 1, fade(l[0], l[2]), 1, 1, 1, fade(r[0], r[2]));
      if(i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); });
    const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); rg.setAttribute("color", new THREE.Float32BufferAttribute(cl, 4)); rg.setIndex(idx);
    water = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: flowTex(), color: 0x6fb8ff, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); G.add(water);
    // The town, split between four lasers by quarter
    const streams = [[], [], [], []], quad = (x, z) => (x >= 0 ? 0 : 1) + (z >= 0 ? 0 : 2);
    NB.segs.forEach(s => { const mx = (s.a[0] + s.b[0]) / 2, mz = (s.a[2] + s.b[2]) / 2; streams[quad(mx, mz)].push({ ...s, d: Math.hypot(mx, mz), f: fade(mx, mz) }); });
    streams.forEach(l => l.sort((p, q) => p.kind - q.kind || p.d - q.d));   // ground first, from the middle outwards
    city = streams.map(l => tracer(l, s => [...s.c, s.k * s.f], G));
    // The target's own building: the lasers finish on it, gold once it's locked
    target = tracer(NB.target, () => [.75, .95, 1, 1], G);
    // Ground rings round the target (they fade in as the camera arrives)
    const r0 = Math.hypot(NB.w, NB.d) * .64;
    rings = [1, 1.17, 1.39].map((m, k) => {
      const c = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => { const a = i / 96 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r0 * m, 0, Math.sin(a) * r0 * m); }));
      const l = new THREE.Line(c, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); G.add(l);
      return [l, k === 0 ? .55 : .25];
    });
    zDone = -1;
  }

  // ---------- Cameras: high over the town, then down to the building (framed to its size) ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z), TAN2 = 2 * Math.tan(FOV / 2 * Math.PI / 180), EL = Math.atan2(2.1, 15.5);
  let C0, L0, look;
  function targetView(){
    const a = innerWidth / innerHeight, dist = Math.max(NB.top / (.4 * TAN2), Math.hypot(NB.w, NB.d) * .8 / (.34 * TAN2 * a), 12), lk = V(0, NB.top * .52, 0);
    return { pos: lk.clone().add(V(0, Math.sin(EL) * dist, Math.cos(EL) * dist)), look: lk };
  }
  const WROT = .3, wrot = () => reduced() ? WROT : WROT + t * .025;   // the town turns slowly
  // The brackets frame the building as the final camera will see it
  function placeRet(close){
    const tv = targetView(), c = cam.clone(); c.position.copy(tv.pos); c.lookAt(tv.look); c.updateMatrixWorld(); c.updateProjectionMatrix();
    world.updateMatrixWorld();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const v = V(0, 0, 0);
    NB.target.forEach(s => [s.a, s.b].forEach(p => { v.set(...p).applyMatrix4(world.matrixWorld).project(c);
      const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }));
    const w = Math.max(220, x1 - x0 + 70), h = Math.max(220, y1 - y0 + 70), k = close ? 1 : 1.5;
    Object.assign($("ret").style, { left: (x0 + x1) / 2 + "px", top: (y0 + y1) / 2 + "px", width: w * k + "px", height: h * k + "px" });
  }

  // ---------- Every frame (only while the overlay is showing) ----------
  let gold, cyan, last = 0, t = 0;
  function frame(now){ if(!looping) return; requestAnimationFrame(frame); tick(now); }
  function loop(on){ if(on && !looping){ looping = true; last = performance.now(); requestAnimationFrame(frame); } if(!on) looping = false; }
  function tick(now){
    const dt = Math.min(.1, (now - last) / 1000) * spd(), rm = reduced(); last = now; t += dt;
    $("bg").style.opacity = $("scan").style.opacity = $("vig").style.opacity = bgOp;
    if(ov.hidden || !G) return;
    // Camera: from high over the town down to the building
    const z = ease(zoomK), tv = targetView();
    cam.position.lerpVectors(C0, tv.pos, z); look.lerpVectors(L0, tv.look, z); cam.lookAt(look);
    world.rotation.y = wrot();
    // Lasers draw the town, then all four finish on the target
    const tips = city.map(c => c.set(mapP / .8)), tt = target.set((mapP - .72) / .28);
    const lk = mapP > 0 && mapP < 1 && !rm ? 1 : 0;
    lasers.forEach((L, i) => {
      const p = tips[i] || tt, on = lk && p; L.beam.visible = L.tip.visible = !!on; L.src.visible = !!lk;
      if(on){ const a = L.beam.geometry.attributes.position; a.setXYZ(1, p.x, p.y, p.z); a.needsUpdate = true; L.tip.position.copy(p); }
    });
    // The rest of the town fades back as the camera zooms in; the ground lines stay faintly
    if(zoomK !== zDone){ zDone = zoomK;
      city.forEach(c => { c.list.forEach((s, i) => { const v = c.col[i * 8 + 3] * (s.kind ? Math.pow(1 - zoomK, 2) : 1 - .7 * zoomK); c.ca.array[i * 8 + 3] = c.ca.array[i * 8 + 7] = v; }); c.ca.needsUpdate = true; });
    }
    city.forEach(c => { c.mat.opacity = townOp; });
    water.material.opacity = .45 * clamp(mapP * 3) * townOp * (1 - .6 * zoomK);
    if(!rm) water.material.map.offset.y -= dt * .1;
    target.mat.color.copy(cyan).lerp(gold, tint * .9);
    rings.forEach(([l, op]) => { l.material.opacity = op * zoomK; l.material.color.copy(cyan).lerp(gold, tint * .55); if(!rm) l.rotation.y = -t * .15; });
    renderer.render(sc, cam);
  }

  // ---------- The cinematic ----------
  const stat = s => { const e = ov.querySelector("#ptlStat"); if(e) e.textContent = s; };
  const fadeCut = (on, ms) => { const c = $("cut"); c.style.transitionDuration = ms / spd() + "ms"; c.style.opacity = on ? 1 : 0; return sleep(ms); };
  function reset(){
    mapP = zoomK = tint = bgOp = t = 0; townOp = 1;   // t = 0: the town's slow turn starts from the same angle every time
    $("ret").className = "ptl-ret"; $("stamp").className = "ptl-stamp"; const c = $("cut"); c.style.transitionDuration = "0ms"; c.style.opacity = 0;
    $("head").classList.remove("on"); ov.classList.remove("live"); ov.style.transition = ""; ov.style.opacity = "";
    $("bg").style.opacity = $("scan").style.opacity = $("vig").style.opacity = 0;
  }
  let finish = null, curMap = null;
  function play(container, name, opts = {}){
    overlay(container || document.body);
    stop(true);
    spd = opts.speed || (() => 1);
    curMap = opts.map || null;
    if(!scene()) return Promise.resolve(false);
    if(!gold){ gold = new THREE.Color(0xffc94d); cyan = new THREE.Color(CYAN); C0 = V(0, 46, 32); L0 = V(0, 0, 2); look = V(0, 0, 0); }
    const id = ++runId;
    return new Promise(res => { finish = v => { if(finish){ finish = null; res(v); } }; run(name, id, opts).then(v => { if(id === runId && finish) finish(v); }); });
  }
  async function run(name, id, opts){
    const alive = () => id === runId, rm = reduced(), map = curMap;
    reset(); ov.hidden = true;
    build(name);
    const tg = T.targets[name];
    $("head").innerHTML = `PRIMENET // TARGET ACQUISITION<br>${T.DISTRICT[tg.level].toUpperCase()} · SECURITY <b>${T.SECURITY[tg.level].toUpperCase()}</b><br>SIGNAL TRACED TO <b>${name.toUpperCase()}</b><br><em id="ptlStat">MAPPING THE TOWN</em>`;
    $("stamp").querySelector("span").textContent = name;
    if(map){ Object.values(map.pins).forEach(p => p.classList.toggle("sel", p === map.pins[name])); map.el.classList.add("locking"); }
    loop(true);
    if(rm || !map){
      // Reduced motion (or no map to zoom): fades and cuts, no lasers, no camera moves
      await sleep(rm ? 400 : 100); if(!alive()) return false;
      ov.hidden = false; ov.classList.add("live");
      await fadeCut(1, 500); if(!alive()) return false;
      bgOp = 1; mapP = 1; townOp = rm ? 0 : 1; $("head").classList.add("on"); tick(performance.now());
      await fadeCut(0, 500); if(!alive()) return false;
      if(rm){ await tween(1400, k => { townOp = k; }, id); if(!alive()) return false; await sleep(1600); }
      else { mapP = 0; SND("laser"); await tween(5200, k => { mapP = k; }, id); }
      if(!alive()) return false;
      stat("TARGET BUILDING FOUND"); SND("chirp");
      await sleep(500); await fadeCut(1, 400); if(!alive()) return false;
      zoomK = 1; tick(performance.now()); placeRet(true); $("ret").classList.add("on");
      await fadeCut(0, 400); if(!alive()) return false;
      await sleep(300); if(!alive()) return false;
    } else {
      // 1. The map zooms in on the area round the target, then fades to dark
      SND("zoom");
      const zm = map.zoom(name, 1150, id);
      await sleep(700); if(!alive()) return false;
      ov.hidden = false;
      await tween(800, k => { bgOp = k; }, id); await zm; if(!alive()) return false;
      ov.classList.add("live"); $("head").classList.add("on");
      await sleep(250); if(!alive()) return false;
      // 2. Lasers trace the neighbourhood: streets, river, rail, parks and docks, then the buildings, then the target
      SND("laser"); [1300, 2600, 3900].forEach(ms => setTimeout(() => { if(alive() && mapP < 1) SND("laser"); }, ms / spd()));
      await tween(5200, k => { mapP = k; }, id); if(!alive()) return false;
      stat("TARGET BUILDING FOUND"); SND("chirp");
      await sleep(250); if(!alive()) return false;
      // 3. Zoom in on the target's building, brackets closing in
      SND("zoom");
      setTimeout(() => { if(!alive()) return; placeRet(false); $("ret").classList.add("on"); requestAnimationFrame(() => requestAnimationFrame(() => { if(alive()) placeRet(true); })); }, 700 / spd());
      await tween(1900, k => { zoomK = k; }, id); if(!alive()) return false;
      await sleep(100); if(!alive()) return false;
    }
    // 4. TARGET LOCKED
    placeRet(true); $("ret").classList.add("on", "locked"); tint = 1;
    $("stamp").classList.add("on"); SND("lockon"); stat("TARGET LOCKED");
    if(opts.hold){ await sleep(opts.hold); if(!alive()) return false; }
    return true;
  }
  // Cancel the cinematic (a skip, or back to the map): hide it at once
  function stop(quiet){
    runId++; if(finish) finish(false);
    if(!ov) return;
    loop(false); reset(); ov.hidden = true;
    if(curMap && !quiet) curMap.home();
  }
  // Fade the whole overlay out (the page underneath has already changed), then hide it
  function close(ms = 500){
    if(!ov || ov.hidden) return Promise.resolve();
    const id = ++runId; ov.classList.remove("live");
    ov.style.transition = `opacity ${ms / spd()}ms ease`; ov.style.opacity = 0;
    return sleep(ms).then(() => { if(id === runId){ loop(false); reset(); ov.hidden = true; } });
  }
  function ok(){ overlay(ov ? ov.parentNode : document.body); return scene(); }

  window.PNTownLock = { map, play, stop, close, ok, NAMES, get overlay(){ return ov; } };
})();
