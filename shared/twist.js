/* PRIMENET twists: the rotating bank-heist tasks. Each twist is its own page so it can be tested
   away from the mission (open modules/twist_lab.html). This file gives every twist the same frame:
   a header with the level switch, an alarm meter, ORACLE, number helpers and the result screen.
   PNTwist.init({ id, stage, title, goal, story }) then PNTwist.level(), .alarm(max, onTrip), .finish({...}).
   Instructions: the goal opens as a hologram brief; PNTwist.step(html) shows each new step there (H hides/shows it).
   Anything timed should wait while PNTwist.briefOpen() is true (a "pn-brief" event fires on window when it opens or closes). */
(function(){
  "use strict";
  const PN = window.Primenet;
  const qs = new URLSearchParams(location.search);
  const css = `
  .tw{ position:relative; z-index:1; width:min(1100px, 100%); margin:0 auto; padding:18px 16px 40px; display:flex; flex-direction:column; gap:16px; }
  .tw-head{ display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; border-bottom:1px solid var(--line); padding-bottom:12px; }
  .tw-head .l{ display:flex; flex-direction:column; gap:2px; }
  .tw-head .eb{ font-family:var(--font-ui); font-size:12px; font-weight:700; letter-spacing:.22em; color:var(--accent); }
  .tw-head h1{ margin:0; font-family:var(--font-ui); font-size:clamp(24px,3.4vw,34px); letter-spacing:.12em; }
  .tw-head .r{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .tw-lv{ display:flex; gap:4px; }
  .tw-lv a{ font-family:var(--font-ui); font-weight:700; font-size:13px; letter-spacing:.1em; text-decoration:none; color:var(--text-muted); border:1px solid var(--line); padding:6px 10px; }
  .tw-lv a[aria-current="true"]{ color:var(--accent); border-color:var(--accent); box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.35); }
  /* Round 13 (Bertie): no worksheet-style GOAL line. Instructions arrive as a hologram brief that zooms in over the
     game, then folds away into a small BRIEF tab once they've got it. H (or tapping the tab) zooms it back out. */
  .twb-layer{ position:fixed; inset:0; z-index:8600; pointer-events:none; perspective:1200px; }
  .twb-dim{ position:absolute; inset:0; background:radial-gradient(ellipse at 50% 40%, rgba(0,20,26,.25), rgba(0,4,6,.62)); opacity:0; transition:opacity .3s; pointer-events:none; }
  .twb-layer.open .twb-dim{ opacity:1; pointer-events:auto; cursor:pointer; }
  .twb-win{ position:absolute; left:50%; top:42%; width:min(640px, calc(100vw - 32px)); pointer-events:auto;
    transform:translate(-50%,-50%) translate(var(--dx,0px), var(--dy,0px)) scale(.04); opacity:0; filter:blur(4px);
    transition:transform .42s cubic-bezier(.2,1.1,.35,1), opacity .3s, filter .3s; }
  .twb-layer.open .twb-win{ transform:translate(-50%,-50%); opacity:1; filter:none; }
  .twb-win .hw{ position:relative; color:#dff8ff; font-family:var(--font-mono, "Courier Prime", monospace);
    background:linear-gradient(160deg, rgba(14,52,64,.9), rgba(6,30,38,.86) 60%, rgba(12,46,58,.9));   /* Bertie: a bit more opaque */
    border:1px solid rgba(140,235,255,.8); box-shadow:0 0 34px rgba(110,220,255,.4), inset 0 0 40px rgba(110,220,255,.14);
    clip-path:polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);
    backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px); animation:twbFlick 5s infinite; }
  .twb-win .hw::before{ content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg, rgba(160,240,255,.07) 0 1px, transparent 1px 3px); }
  .twb-win .hw::after{ content:""; position:absolute; left:0; right:0; height:40%; top:-40%; pointer-events:none; background:linear-gradient(transparent, rgba(160,240,255,.12), transparent); animation:twbSweep 2.6s ease-in-out infinite; }
  @keyframes twbSweep{ to{ top:100%; } }
  @keyframes twbFlick{ 0%,100%,92%,94%{ opacity:1; } 93%{ opacity:.6; } 97%{ opacity:.85; } }
  .twb-t{ display:flex; justify-content:space-between; gap:12px; padding:8px 16px; border-bottom:1px solid rgba(140,235,255,.45); font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; letter-spacing:.24em; color:#8feaff; }
  .twb-t i{ font-style:normal; color:#ff6b8a; animation:twbBlink 1s steps(2) infinite; } @keyframes twbBlink{ 50%{ opacity:.2; } }
  .twb-b{ padding:16px 18px 14px; display:flex; flex-direction:column; gap:10px; }
  .twb-step{ font-family:var(--font-ui, sans-serif); font-size:clamp(20px,2.6vw,27px); line-height:1.3; letter-spacing:.02em; color:#f2fdff; text-shadow:0 0 16px rgba(120,230,255,.55); }
  .twb-step b{ color:#ffe68a; text-shadow:0 0 14px rgba(255,220,120,.6); }
  .twb-goal{ font-size:15px; color:rgba(223,248,255,.78); } .twb-goal b{ color:#ffe68a; }
  .twb-goal:empty, .twb-ex:empty{ display:none; }
  .twb-ex{ font-size:14px; color:rgba(223,248,255,.72); border-left:2px solid rgba(140,235,255,.55); padding-left:10px; } .twb-ex b{ color:#dff8ff; }
  .twb-f{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:0 18px 14px; font-size:13px; color:rgba(160,235,255,.75); letter-spacing:.08em; }
  .twb-f kbd, .twb-chip kbd{ font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; color:#062027; background:#8feaff; padding:1px 6px; box-shadow:0 0 10px rgba(140,235,255,.6); }
  .twb-go{ font:inherit; font-family:var(--font-ui, sans-serif); font-weight:700; font-size:13px; letter-spacing:.18em; color:#062027; background:#8feaff; border:0; padding:9px 16px; cursor:pointer; box-shadow:0 0 18px rgba(140,235,255,.55); }
  .twb-go:focus-visible, .twb-chip:focus-visible{ outline:2px solid #ffe68a; outline-offset:3px; }
  .twb-chip{ position:fixed; right:18px; top:16px; z-index:8601; display:flex; align-items:center; gap:8px; font:inherit; font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; letter-spacing:.22em;
    color:#8feaff; background:rgba(110,220,255,.12); border:1px solid rgba(140,235,255,.7); padding:8px 12px; cursor:pointer; box-shadow:0 0 16px rgba(110,220,255,.3);
    clip-path:polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%); transition:opacity .25s, transform .25s; }
  .twb-chip.hide{ opacity:0; transform:scale(.8); pointer-events:none; }
  .twb-chip.ping{ animation:twbPing 1s ease-in-out 3; }
  @keyframes twbPing{ 50%{ background:rgba(140,235,255,.4); box-shadow:0 0 30px rgba(140,235,255,.8); } }
  .twb-sr{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
  @media (prefers-reduced-motion: reduce){ .twb-win{ transition:opacity .2s; } .twb-win .hw, .twb-win .hw::after, .twb-chip.ping{ animation:none; } }
  .tw-bar{ display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px 18px; font-size:15px; color:var(--text-muted); }
  .tw-bar b{ color:var(--text-primary); }
  .tw-meter{ display:inline-flex; align-items:center; gap:6px; font-family:var(--font-ui); letter-spacing:.14em; font-size:12px; }
  .tw-meter i{ width:22px; height:9px; border:1px solid rgba(255,107,107,.7); display:inline-block; }
  .tw-meter i.on{ background:#ff4f6d; box-shadow:0 0 10px #ff4f6d; }
  /* Feedback reads as a comms readout rather than worksheet text */
  .tw-msg{ min-height:1.6em; font-family:var(--font-mono); font-size:16px; letter-spacing:.03em; color:#9fe9ff; text-shadow:0 0 10px rgba(110,220,255,.35); }
  .tw-msg:not(:empty)::before{ content:"› "; color:#8feaff; }
  .tw-msg.ok{ color:#7dffc4; } .tw-msg.bad{ color:#ff8aa0; } .tw-msg.warn{ color:#ffe68a; }
  /* Number tiles, shared by the scan twists */
  .tw-grid{ display:grid; gap:6px; }
  .tw-tile{ position:relative; font:inherit; font-family:var(--font-mono); font-size:20px; font-weight:700; color:rgba(235,255,248,.86); aspect-ratio:1.25; min-width:0;
    background:rgba(8,26,31,.9); border:1px solid var(--line); cursor:pointer; transition:background .15s, border-color .15s, color .15s, opacity .3s; }
  .tw-tile:hover:not(:disabled){ border-color:rgba(var(--accent-rgb),.8); }
  .tw-tile:focus-visible{ outline:2px solid var(--warning); outline-offset:2px; }
  .tw-tile.on{ background:rgba(var(--accent-rgb),.3); border-color:var(--accent); color:#fff; box-shadow:0 0 14px rgba(var(--accent-rgb),.35); }
  .tw-tile.bad{ background:rgba(255,79,109,.28); border-color:#ff4f6d; }
  .tw-tile.gold{ background:rgba(255,201,77,.25); border-color:#ffc94d; color:#fff3cf; }
  .tw-tile.x{ opacity:.28; cursor:default; text-decoration:line-through; }
  .tw-tile.missed{ animation:twMiss 1s ease-in-out 3; border-color:var(--warning); }
  .tw-tile small{ position:absolute; left:0; right:0; bottom:3px; font-size:10px; font-weight:400; letter-spacing:.06em; color:rgba(255,255,255,.75); }
  @keyframes twMiss{ 50%{ background:rgba(242,193,78,.3); } }
  .tw-flash{ position:fixed; inset:0; z-index:40; pointer-events:none; animation:twFlash .45s ease-in-out; }
  @keyframes twFlash{ 50%{ background:rgba(255,30,60,.22); } }
  /* Result */
  .tw-result{ position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(2,8,10,.78); }
  .tw-result .card{ width:min(560px,100%); background:var(--bg-panel-solid); border:1px solid var(--accent); padding:22px; display:flex; flex-direction:column; gap:12px; box-shadow:0 20px 80px rgba(0,0,0,.7); }
  .tw-result h2{ margin:0; font-family:var(--font-ui); letter-spacing:.16em; font-size:22px; color:var(--accent); }
  .tw-result.fail h2{ color:var(--danger); }
  .tw-result.fail .card{ border-color:var(--danger); }
  .tw-result ul{ margin:0; padding-left:20px; display:flex; flex-direction:column; gap:4px; color:var(--text-muted); font-size:16px; }
  .tw-result li b{ color:var(--text-primary); }
  .tw-result .btns{ display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
  @media (prefers-reduced-motion: reduce){ .tw-tile.missed{ animation:none; } .tw-flash{ animation:none; } }`;

  let level = "L1";
  // Round 11: in a mission the twist plays inside the stage (an iframe); no lab header, and Continue hands back
  const MISSION = qs.get("mission") === "1";
  const EMBED = MISSION && window.parent !== window;
  const SND = (n, a) => { if(window.PNSound) PNSound.play(n, a); };

  // The level from ?level=, else the agent's level, else L1 (safe to call before init)
  function peekLevel(){ const a = PN && PN.getAgent(); return ["L1", "L2", "L3"].includes(qs.get("level")) ? qs.get("level") : (a && a.level) || "L1"; }
  function init({ id, stage, title, goal, story, brief, example, eyebrow }){
    const st = document.createElement("style"); st.textContent = css + (EMBED ? " .pnh{ display:none !important; }" : ""); document.head.appendChild(st);
    level = peekLevel();
    const wrap = document.querySelector(".tw") || document.body;
    const head = document.createElement("header"); head.className = "tw-head";
    const lv = ["L1", "L2", "L3"].map(l => { const u = new URL(location.href); u.searchParams.set("level", l); return `<a href="${u.pathname.split("/").pop()}${u.search}" aria-current="${l === level}">${l}</a>`; }).join("");
    head.innerHTML = MISSION
      ? `<div class="l"><span class="eb">${eyebrow || "CHANGE OF PLAN"} · ${level}</span><h1>${title}</h1></div>`
      : `<div class="l"><span class="eb">TWIST LAB · ${stage}</span><h1>${title}</h1></div>
      <div class="r"><nav class="tw-lv" aria-label="Level">${lv}</nav><button class="pn-btn small" type="button" id="twNew">New round</button><a class="pn-btn small" href="twist_lab.html" style="text-decoration:none">Twist Lab</a></div>`;
    wrap.prepend(head);
    if(!MISSION) head.querySelector("#twNew").addEventListener("click", () => location.reload());
    buildBrief(goal || brief || "", example);
    if(story && window.PNHandler && !EMBED) setTimeout(() => PNHandler.say(story), 500);   // in a mission the stage's ORACLE introduces it
    if(PN) PN.log("twist", { id, level });
    return level;
  }

  // Alarm meter: max strikes, then onTrip()
  function alarm(max, onTrip, host){
    const el = document.createElement("span"); el.className = "tw-meter";
    el.innerHTML = `ALARM ${Array.from({ length: max }, () => "<i></i>").join("")}`;
    (host || document.querySelector(".tw-bar") || document.body).appendChild(el);
    let n = 0;
    return {
      el, get count(){ return n; },
      hit(){
        n = Math.min(max, n + 1);
        el.querySelectorAll("i").forEach((i, k) => i.classList.toggle("on", k < n));
        const f = document.createElement("div"); f.className = "tw-flash"; document.body.appendChild(f); setTimeout(() => f.remove(), 480);
        SND("alarm");
        if(n >= max && onTrip) onTrip();
        return n;
      },
    };
  }

  function finish({ ok = true, title, lines = [], note = "", effect = "", auto = 0 }){   // auto: in a mission, carry on by itself after this many ms   // effect: something the stage shows afterwards (e.g. "dark")
    if(document.querySelector(".tw-result")) return;   // one result screen only (a twist could end twice)
    hideBrief(); if(B) B.chip.classList.add("hide");
    const ov = document.createElement("div"); ov.className = "tw-result" + (ok ? "" : " fail");
    const next = qs.get("next");
    ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="twResT"><h2 id="twResT">${title || (ok ? "TWIST CLEARED" : "ALARM TRIPPED")}</h2>
      <ul>${lines.map(l => `<li>${l}</li>`).join("")}</ul>${note ? `<p style="margin:0;color:var(--text-muted)">${note}</p>` : ""}
      <div class="btns">${MISSION ? `<button class="pn-btn small primary" type="button" data-a="cont">Continue the mission</button>`
        : `<a class="pn-btn small" href="twist_lab.html" style="text-decoration:none">Twist Lab</a><button class="pn-btn small" type="button" data-a="again">Play again</button>${next ? `<a class="pn-btn small primary" href="${next}" style="text-decoration:none">Continue</a>` : ""}`}</div></div>`;
    document.body.appendChild(ov);
    const again = ov.querySelector('[data-a="again"]'); if(again) again.addEventListener("click", () => location.reload());
    const cont = ov.querySelector('[data-a="cont"]');
    let sent = false;
    const carryOn = () => { if(sent) return; sent = true; if(EMBED) window.parent.postMessage({ type: "pn-twist-done", ok, effect }, "*"); else if(next) location.href = next; };
    if(cont) cont.addEventListener("click", () => { SND("click"); carryOn(); });
    if(auto && EMBED) setTimeout(carryOn, auto);
    (ov.querySelector(".primary") || ov.querySelector("button")).focus();
    SND(ok ? "success" : "denied");
    if(PN) PN.log("twist-done", { ok, level });
  }

  // ---------- Hologram brief ----------
  // The brief holds the goal (and an example). step() puts the current instruction on top and zooms it back in,
  // because it's new; step(html, { quiet: true }) just updates it. H, the GOT IT button or a click outside folds it away.
  let B = null;
  function buildBrief(goal, example){
    const layer = document.createElement("div"); layer.className = "twb-layer";
    layer.innerHTML = `<div class="twb-dim"></div><div class="twb-win" role="dialog" aria-label="Brief"><div class="hw">
      <div class="twb-t"><span>BRIEF</span><span><i>●</i> LIVE</span></div>
      <div class="twb-b"><div class="twb-step"></div><div class="twb-goal"></div><div class="twb-ex"></div></div>
      <div class="twb-f"><span>Press <kbd>H</kbd> to hide or show this</span><button class="twb-go" type="button">GOT IT ▸</button></div></div></div>
      <div class="twb-sr" aria-live="polite"></div>`;
    const chip = document.createElement("button"); chip.type = "button"; chip.className = "twb-chip hide"; chip.innerHTML = `BRIEF <kbd>H</kbd>`; chip.setAttribute("aria-label", "Show the brief (H)");
    document.body.append(layer, chip);
    B = { layer, chip, win: layer.querySelector(".twb-win"), step: layer.querySelector(".twb-step"), goal: layer.querySelector(".twb-goal"), ex: layer.querySelector(".twb-ex"), sr: layer.querySelector(".twb-sr"), open: false, goalHTML: goal, stepHTML: "" };
    B.ex.innerHTML = example ? `Example: ${example}` : "";
    render();
    layer.querySelector(".twb-go").addEventListener("click", () => hideBrief());
    layer.querySelector(".twb-dim").addEventListener("click", () => hideBrief());
    chip.addEventListener("click", () => showBrief());
    document.addEventListener("keydown", e => {
      if(e.key !== "h" && e.key !== "H") return;
      if(e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target, typing = t && (t.isContentEditable || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !/numeric|decimal/.test(t.inputMode || "") && t.type !== "number"));
      if(typing) return;
      e.preventDefault(); toggleBrief();
    });
    setTimeout(() => showBrief(), 350);
  }
  function render(){
    if(!B) return;
    // With no step yet, the goal is the headline; once there's a step, the goal sits underneath it
    B.step.innerHTML = B.stepHTML || B.goalHTML;
    B.goal.innerHTML = B.stepHTML ? B.goalHTML : "";
    B.sr.textContent = B.step.textContent;
  }
  function aimAtChip(){   // the window zooms out of / back into the BRIEF tab
    const r = B.chip.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    B.win.style.setProperty("--dx", (cx - innerWidth * 0.5) + "px"); B.win.style.setProperty("--dy", (cy - innerHeight * 0.42) + "px");
  }
  function showBrief(){
    if(!B || B.open || document.querySelector(".tw-result")) return;
    aimAtChip(); B.open = true; B.layer.classList.add("open"); window.dispatchEvent(new CustomEvent("pn-brief", { detail: { open: true } })); B.chip.classList.add("hide"); B.chip.classList.remove("ping");
    SND("holo");
    setTimeout(() => { if(B.open) B.layer.querySelector(".twb-go").focus({ preventScroll: true }); }, 60);
  }
  function hideBrief(){
    if(!B || !B.open) return;
    aimAtChip(); B.open = false; B.layer.classList.remove("open"); window.dispatchEvent(new CustomEvent("pn-brief", { detail: { open: false } })); B.chip.classList.remove("hide");
    SND("click");
  }
  function toggleBrief(){ if(B && B.open) hideBrief(); else showBrief(); }
  function step(html, opts = {}){
    if(!B) return;
    if(B.stepHTML === html) return;
    B.stepHTML = html; render();
    if(opts.quiet){ if(!B.open){ B.chip.classList.remove("ping"); void B.chip.offsetWidth; B.chip.classList.add("ping"); } }
    else showBrief();
  }
  function setGoal(html, opts = {}){ if(!B) return; B.goalHTML = html; B.stepHTML = ""; render(); if(!opts.quiet) showBrief(); }
  function say(text, opts){ if(EMBED){ window.parent.postMessage({ type: "pn-twist-say", text }, "*"); return; } if(window.PNHandler) PNHandler.say(text, opts); }
  const target = () => (PN && PN.mission && PN.mission().target) || "Sentinel Finance";
  const targets = () => { const t = target(); return /s$/i.test(t) ? t + "'" : t + "'s"; };   // possessive: "Rivercross Utilities'"

  // Number helpers
  const isPrime = n => { if(n < 2) return false; for(let d = 2; d * d <= n; d++) if(n % d === 0) return false; return true; };
  const isSquare = n => Number.isInteger(Math.sqrt(n));
  const isCube = n => { const r = Math.round(Math.cbrt(n)); return r * r * r === n; };
  const pairs = n => { const out = []; for(let a = 1; a * a <= n; a++) if(n % a === 0) out.push([a, n / a]); return out; };
  const smallestFactor = n => { for(let d = 2; d * d <= n; d++) if(n % d === 0) return d; return n; };
  const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const lcm = (a, b) => a * b / gcd(a, b);

  window.PNTwist = { init, peekLevel, setGoal, step, showBrief, hideBrief, briefOpen: () => !!(B && B.open), alarm, finish, say, target, targets, level: () => level, SND, isPrime, isSquare, isCube, pairs, smallestFactor, shuffle, pick, range, gcd, lcm };
})();
