/* PRIMENET detection meter (Round 22, Bertie: "I want to discourage children just clicking and guessing").
   One red bar for every stage that can go wrong. A mistake fills it a little; a mistake soon after the last one
   (guessing) fills it a lot. How hard it bites depends on the stage:
     plan   the plan (recon, corrupted blueprint, Factor Vault): gentle. It drains away over time and a slow, thought-through
            mistake barely moves it; only rapid guessing fills it. Full: a near miss (lie low for a few seconds), never a fail.
     email  the email intercept (frequency scan): lots of wrong clicks raise suspicion. Full: the channel closes (rescan).
     heist  in the building: harsh, no drain. Two or three quick wrong clicks in a row and they're caught.
   The level scales it a little (L1 kinder, L3 stricter).

   const det = PNDetect.create({ stage: "heist", level: "L2", host, onFull, label })
   det.hit()               a mistake (returns how many so far, like the old alarm meter)
   det.hit({ soft: true }) a slip that only counts if it's rapid (trial and error puzzles: the corrupted blueprint)
   det.value, det.set(v), det.pause(on), det.el, det.destroy() */
(function(){
  "use strict";
  const STAGES = {
    plan:  { step: 9,  drain: 2,   rapid: 3,   burst: 5, label: "DETECTION", tip: "How close they are to noticing you. Guessing fills it fast; it drains away while you think." },
    email: { step: 12, drain: 1.5, rapid: 2.5, burst: 4, label: "SUSPICION", tip: "How suspicious their mail server is. Lots of wrong clicks, quickly, and it closes the channel." },
    heist: { step: 22, drain: 0,   rapid: 2,   burst: 3, label: "DETECTION", tip: "How close security is to catching FOX and WREN. Two or three quick wrong guesses and the alarm goes." },
  };
  const LEVEL = { L1: 0.8, L2: 1, L3: 1.15 };
  const RAPID_MS = 4000, BURST_MS = 1500;
  const css = `
  .pnd{ display:inline-flex; align-items:center; gap:8px; font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; letter-spacing:.14em; color:#ffb3c0; position:relative; }
  .pnd-bar{ position:relative; width:var(--pnd-w, 132px); height:var(--pnd-h, 10px); border:1px solid rgba(255,107,138,.7); background:rgba(30,0,8,.55); overflow:hidden; }
  .pnd-bar i{ position:absolute; left:0; top:0; bottom:0; width:0; background:linear-gradient(90deg, #ff9a5a, #ff4f6d 55%, #ff1f4b); box-shadow:0 0 10px rgba(255,79,109,.6); transition:width .35s ease; }
  .pnd-bar u{ position:absolute; top:0; bottom:0; width:2px; background:rgba(255,255,255,.45); text-decoration:none; }
  .pnd-v{ min-width:3.2em; font-family:var(--font-mono, monospace); letter-spacing:.02em; color:#ffd0d8; }
  .pnd.hot .pnd-bar{ animation:pndHot 1.2s ease-in-out infinite; } .pnd.hot .pnd-v{ color:#ff4f6d; }
  @keyframes pndHot{ 50%{ box-shadow:0 0 16px rgba(255,79,109,.75); } }
  .pnd-msg{ position:absolute; right:0; top:calc(100% + 4px); white-space:nowrap; font-size:11px; letter-spacing:.12em; color:#ff8aa0; background:rgba(20,2,8,.92); border:1px solid rgba(255,107,138,.6); padding:2px 7px; opacity:0; transition:opacity .25s; pointer-events:none; z-index:5; }
  .pnd-msg.on{ opacity:1; }
  .pnd-flash{ position:fixed; inset:0; z-index:40; pointer-events:none; animation:pndFlash .5s ease-in-out; }
  @keyframes pndFlash{ 50%{ background:rgba(255,30,60,var(--a, .2)); } }
  .pnd-near{ position:fixed; inset:0; z-index:8700; display:flex; align-items:center; justify-content:center; background:rgba(20,0,6,.55); }
  .pnd-near > div{ text-align:center; padding:20px 28px; border:1px solid #ff4f6d; background:rgba(16,2,6,.95); box-shadow:0 0 40px rgba(255,79,109,.35); font-family:var(--font-ui, sans-serif); color:#ffd0d8; max-width:min(560px, 90vw); }
  .pnd-near h3{ margin:0 0 8px; font-size:26px; letter-spacing:.2em; color:#ff4f6d; }
  .pnd-near p{ margin:0; font-size:17px; line-height:1.45; letter-spacing:.02em; }
  .pnd-near b{ font-family:var(--font-mono, monospace); color:#ffe14d; }
  @media (prefers-reduced-motion: reduce){ .pnd.hot .pnd-bar, .pnd-flash{ animation:none; } .pnd-bar i{ transition:none; } }
  html.pn-reduce-motion .pnd.hot .pnd-bar, html.pn-reduce-motion .pnd-flash{ animation:none; }`;
  let styled = false;
  const SND = (n, a) => { if(window.PNSound) PNSound.play(n, a); };
  const speed = () => (window.PNTest ? PNTest.speed() : 1);

  function create(opts = {}){
    if(!styled){ const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); styled = true; }
    const S = STAGES[opts.stage] || STAGES.heist, lv = LEVEL[opts.level] || 1;
    const el = document.createElement("span"); el.className = "pnd"; el.title = S.tip; el.setAttribute("role", "meter"); el.setAttribute("aria-label", (opts.label || S.label).toLowerCase()); el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
    el.innerHTML = `<span class="pnd-l">${opts.label || S.label}</span><span class="pnd-bar"><i></i></span><b class="pnd-v">0%</b><span class="pnd-msg"></span>`;
    if(opts.host !== null) (opts.host || document.querySelector(".tw-bar") || document.body).appendChild(el);
    const PN = window.Primenet;
    let decoy = opts.decoy != null ? opts.decoy : (PN && PN.perk ? PN.perk("strikes") : 0);   // safehouse gadget: the decoy drone takes the first mistake
    let value = 0, count = 0, last = -1e9, paused = false, msgT = 0, full = false;
    function paint(){
      el.querySelector(".pnd-bar i").style.width = value + "%";
      el.querySelector(".pnd-v").textContent = Math.round(value) + "%";
      el.classList.toggle("hot", value >= 70);
      el.setAttribute("aria-valuenow", String(Math.round(value)));
      if(opts.onPaint) opts.onPaint(value);
    }
    function msg(t){ const m = el.querySelector(".pnd-msg"); m.textContent = t; m.classList.add("on"); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove("on"), 2200 / speed()); }
    function flash(a){ const f = document.createElement("div"); f.className = "pnd-flash"; f.style.setProperty("--a", String(a)); document.body.appendChild(f); setTimeout(() => f.remove(), 520); }
    const drainT = S.drain ? setInterval(() => { if(paused || full || document.hidden || value <= 0) return; value = Math.max(0, value - S.drain * 0.25 * speed()); paint(); }, 250) : 0;
    const api = {
      el,
      get value(){ return value; }, get count(){ return count; },
      hit(o = {}){
        const now = performance.now(), dt = (now - last) * speed(); last = now;
        const f = dt < BURST_MS ? S.burst : dt < RAPID_MS ? S.rapid : 1;
        let add = o.soft ? (f > 1 ? S.step * (f - 1) * 0.5 : 0) : S.step * f;
        add *= lv * (o.weight || 1);
        if(!o.soft) count++;
        if(add <= 0) return count;
        if(decoy > 0 && !o.soft){ decoy--; msg("DECOY DRONE TOOK IT"); SND("untag"); return count; }
        value = Math.min(100, value + add); paint();
        flash(Math.min(0.32, 0.08 + add / 220));
        SND(value >= 70 ? "alarm" : "wrong");
        if(f > 1) msg(f === S.burst ? "GUESSING! SLOW DOWN" : "TOO QUICK: THINK FIRST");
        if(value >= 100 && !full){ full = true; if(opts.onFull) opts.onFull(api); }
        return count;
      },
      set(v){ value = Math.max(0, Math.min(100, v)); full = value >= 100; paint(); },
      pause(on){ paused = !!on; },
      destroy(){ clearInterval(drainT); el.remove(); },
    };
    paint();
    return api;
  }

  // The plan's near miss: a few seconds lying low (input blocked), then the bar drops back. Never a fail.
  function nearMiss(det, { title = "NEAR MISS", text = "Too much guessing: they nearly spotted us. Lie low for a moment, then think it through.", seconds = 5, after = 40 } = {}){
    const ov = document.createElement("div"); ov.className = "pnd-near"; ov.setAttribute("role", "alert");
    ov.innerHTML = `<div><h3>${title}</h3><p>${text}</p><p style="margin-top:10px">Back in <b>${seconds}</b></p></div>`;
    document.body.appendChild(ov); SND("denied");
    if(det) det.pause(true);
    return new Promise(res => {
      let n = seconds;
      const tick = () => { n--; const b = ov.querySelector("b"); if(b) b.textContent = String(Math.max(0, n)); if(n <= 0){ ov.remove(); if(det){ det.set(after); det.pause(false); } res(); } else setTimeout(tick, 1000 / speed()); };
      setTimeout(tick, 1000 / speed());
    });
  }

  window.PNDetect = { create, nearMiss, STAGES };
})();
