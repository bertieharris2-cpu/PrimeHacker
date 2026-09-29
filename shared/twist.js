/* PRIMENET twists: the rotating bank-heist tasks. Each twist is its own page so it can be tested
   away from the mission (open modules/twist_lab.html). This file gives every twist the same frame:
   a header with the level switch, an alarm meter, ORACLE, number helpers and the result screen.
   PNTwist.init({ id, stage, title, goal, story }) then PNTwist.level(), .alarm(max, onTrip), .finish({...}).
   Instructions: the goal opens as a hologram brief; PNTwist.step(html) shows each new step there (H hides/shows it).
   Anything timed should wait while PNTwist.briefOpen() is true (a "pn-brief" event fires on window when it opens or closes).
   init({ briefStyle: "comms" }): the brief arrives as an ORACLE comms message (bottom right, fades) instead of the big panel,
   so the pupil can start straight away; H (or the BRIEF tab) sends it again. */
(function(){
  "use strict";
  const PN = window.Primenet;
  const qs = new URLSearchParams(location.search);
  const css = `
  .tw{ position:relative; z-index:1; width:min(1100px, 100%); margin:0 auto; padding:18px 16px 40px; display:flex; flex-direction:column; gap:16px; }
  .tw-head{ display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; border-bottom:1px solid var(--line); padding-bottom:12px;
    padding-right:max(0px, calc(150px - (100vw - 100%) / 2)); }   /* on a page widened to the screen edge, room for the fixed BRIEF tab in the corner; (100vw - 100%) / 2 is the gap beside the header */
  .tw-head .l{ display:flex; flex-direction:column; gap:2px; }
  .tw-head .eb{ font-family:var(--font-ui); font-size:12px; font-weight:700; letter-spacing:.22em; color:var(--accent); }
  .tw-head h1{ margin:0; font-family:var(--font-ui); font-size:clamp(24px,3.4vw,34px); letter-spacing:.12em; }
  .tw-head .r{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .tw-lv{ display:flex; gap:4px; }
  .tw-lv a{ font-family:var(--font-ui); font-weight:700; font-size:13px; letter-spacing:.1em; text-decoration:none; color:var(--text-muted); border:1px solid var(--line); padding:6px 10px; }
  .tw-lv a[aria-current="true"]{ color:var(--accent); border-color:var(--accent); box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.35); }
  /* Round 13 (Bertie): no worksheet-style GOAL line. Instructions arrive as a hologram brief that zooms in over the
     game, then folds away into a small BRIEF tab once they've got it. H (or tapping the tab) zooms it back out. */
  /* The brief's colour: ice blue unless a hologram tint from the safehouse shop overrides --hb-rgb / --hb-hi (Primenet.applyLoot) */
  :root{ --hb-rgb:140,235,255; --hb-hi:#8feaff; }
  .twb-layer{ position:fixed; inset:0; z-index:8600; pointer-events:none; perspective:1200px; }
  .twb-dim{ position:absolute; inset:0; background:radial-gradient(ellipse at 50% 40%, rgba(0,20,26,.25), rgba(0,4,6,.62)); opacity:0; transition:opacity .3s; pointer-events:none; }
  .twb-layer.open .twb-dim{ opacity:1; pointer-events:auto; cursor:pointer; }
  /* Bertie: the brief sits on the left, like a comms panel, and only pops up by itself if the tick box says so */
  .twb-win{ position:absolute; left:24px; top:50%; width:min(760px, calc(100vw - 48px)); pointer-events:auto;
    transform:translate(0,-50%) translate(var(--dx,0px), var(--dy,0px)) scale(.04); opacity:0; filter:blur(4px);
    transition:transform .42s cubic-bezier(.2,1.1,.35,1), opacity .3s, filter .3s; }
  .twb-layer.open .twb-win{ transform:translate(0,-50%); opacity:1; filter:none; }
  .twb-win .hw{ position:relative; color:#dff8ff; font-family:var(--font-mono, "Courier Prime", monospace);
    background:linear-gradient(160deg, rgba(10,44,56,.97), rgba(5,26,34,.96) 60%, rgba(9,40,52,.97));   /* Bertie: opaque enough to read easily */
    border:1px solid rgba(var(--hb-rgb),.8); box-shadow:0 0 34px rgba(var(--hb-rgb),.4), inset 0 0 40px rgba(var(--hb-rgb),.14);
    clip-path:polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);
    backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px); animation:twbFlick 5s infinite; }
  .twb-win .hw::before{ content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg, rgba(var(--hb-rgb),.07) 0 1px, transparent 1px 3px); }
  .twb-win .hw::after{ content:""; position:absolute; left:0; right:0; height:40%; top:-40%; pointer-events:none; background:linear-gradient(transparent, rgba(var(--hb-rgb),.12), transparent); animation:twbSweep 2.6s ease-in-out infinite; }
  @keyframes twbSweep{ to{ top:100%; } }
  @keyframes twbFlick{ 0%,100%,92%,94%{ opacity:1; } 93%{ opacity:.6; } 97%{ opacity:.85; } }
  .twb-t{ display:flex; justify-content:space-between; gap:12px; padding:10px 22px; border-bottom:1px solid rgba(var(--hb-rgb),.45); font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; letter-spacing:.24em; color:var(--hb-hi); }
  .twb-say{ all:unset; cursor:pointer; font-size:15px; margin-right:6px; filter:grayscale(.3); } .twb-say:hover{ filter:none; }
  .twb-hints .twb-win .hw{ border-color:rgba(255,230,138,.8); box-shadow:0 0 34px rgba(255,230,138,.3); } .twb-hints .twb-t{ color:#ffe68a; }
  .twb-chip-hints{ color:#ffe68a !important; border-color:rgba(255,230,138,.7) !important; }
  .twb-t i{ font-style:normal; color:#ff6b8a; animation:twbBlink 1s steps(2) infinite; } @keyframes twbBlink{ 50%{ opacity:.2; } }
  .twb-b{ padding:22px 26px 18px; display:flex; flex-direction:column; gap:16px; }
  .twb-step{ font-family:var(--font-ui, sans-serif); font-size:clamp(22px,2.8vw,31px); line-height:1.4; letter-spacing:.02em; color:#f6feff; text-shadow:0 0 16px rgba(var(--hb-rgb),.45); }
  .twb-step b{ color:#ffe68a; text-shadow:0 0 14px rgba(255,220,120,.5); }
  .twb-goal{ font-size:18px; line-height:1.55; color:rgba(230,250,255,.9); } .twb-goal b{ color:#ffe68a; }
  .twb-goal:empty, .twb-ex:empty{ display:none; }
  .twb-ex{ font-size:16px; line-height:1.5; color:rgba(230,250,255,.82); border-left:3px solid rgba(var(--hb-rgb),.6); padding:2px 0 2px 14px; } .twb-ex b{ color:#ffffff; }
  .twb-auto{ display:flex; align-items:center; gap:8px; cursor:pointer; } .twb-auto input{ width:18px; height:18px; accent-color:var(--hb-hi); cursor:pointer; }
  .twb-f{ display:flex; justify-content:space-between; align-items:center; gap:10px 18px; flex-wrap:wrap; padding:0 26px 18px; font-size:14px; color:rgba(180,240,255,.85); letter-spacing:.08em; }
  .twb-f kbd, .twb-chip kbd{ font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; color:#062027; background:var(--hb-hi); padding:1px 6px; box-shadow:0 0 10px rgba(var(--hb-rgb),.6); }
  .twb-go{ font:inherit; font-family:var(--font-ui, sans-serif); font-weight:700; font-size:14px; letter-spacing:.18em; color:#062027; background:var(--hb-hi); border:0; padding:11px 20px; cursor:pointer; box-shadow:0 0 18px rgba(var(--hb-rgb),.55); }
  .twb-go:focus-visible, .twb-chip:focus-visible{ outline:2px solid #ffe68a; outline-offset:3px; }
  .twb-chip{ position:fixed; left:18px; bottom:96px; z-index:8601; display:flex; align-items:center; gap:8px; font:inherit; font-family:var(--font-ui, sans-serif); font-weight:700; font-size:12px; letter-spacing:.22em;
    color:var(--hb-hi); background:rgba(var(--hb-rgb),.12); border:1px solid rgba(var(--hb-rgb),.7); padding:8px 12px; cursor:pointer; box-shadow:0 0 16px rgba(var(--hb-rgb),.3);
    clip-path:polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%); transition:opacity .25s, transform .25s; }
  .twb-chip.hide{ opacity:0; transform:scale(.8); pointer-events:none; }
  .twb-chip.ping{ animation:twbPing 1s ease-in-out 3; }
  @keyframes twbPing{ 50%{ background:rgba(var(--hb-rgb),.4); box-shadow:0 0 30px rgba(var(--hb-rgb),.8); } }
  /* Safehouse gadgets: the night lens is a soft green tint over the whole twist; the decoy drone's alarm pip is dashed mint */
  html.pn-lens body::after{ content:""; position:fixed; inset:0; z-index:9500; pointer-events:none; background:radial-gradient(ellipse at 50% 45%, rgba(70,210,130,.09), rgba(40,150,95,.14) 60%, rgba(0,30,15,.42) 100%); }
  .tw-meter i.decoy{ border-style:dashed; border-color:rgba(125,255,196,.85); } .tw-meter i.decoy.on{ background:#7dffc4; box-shadow:0 0 10px #7dffc4; }
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
  function init({ id, stage, title, goal, story, brief, example, eyebrow, briefTitle, context, briefStyle }){
    const st = document.createElement("style"); st.textContent = css + (EMBED ? " .pnh{ display:none !important; }" : ""); document.head.appendChild(st);
    if(PN && PN.applyLoot) PN.applyLoot();   // safehouse shop: hologram tint and night lens
    level = peekLevel();
    const wrap = document.querySelector(".tw") || document.body;
    const head = document.createElement("header"); head.className = "tw-head";
    const lv = ["L1", "L2", "L3"].map(l => { const u = new URL(location.href); u.searchParams.set("level", l); return `<a href="${u.pathname.split("/").pop()}${u.search}" aria-current="${l === level}">${l}</a>`; }).join("");
    head.innerHTML = MISSION
      ? `<div class="l"><span class="eb">${eyebrow || "CHANGE OF PLAN"} · ${level}</span><h1>${title}</h1></div>`
      : qs.get("warmup") === "1" ? `<div class="l"><span class="eb">WARM-UP · OPTIONAL</span><h1>${title}</h1></div><div class="r"><a class="pn-btn small" href="../index.html" style="text-decoration:none">Main menu</a></div>`
      : `<div class="l"><span class="eb">TWIST LAB · ${stage}</span><h1>${title}</h1></div>
      <div class="r"><nav class="tw-lv" aria-label="Level">${lv}</nav><button class="pn-btn small" type="button" id="twNew">New round</button><a class="pn-btn small" href="twist_lab.html" style="text-decoration:none">Twist Lab</a></div>`;
    wrap.prepend(head);
    if(!MISSION && head.querySelector("#twNew")) head.querySelector("#twNew").addEventListener("click", () => location.reload());
    buildBrief(goal || brief || "", example, briefTitle, context || story, briefStyle);
    if(story && window.PNHandler && !EMBED && briefStyle !== "comms") setTimeout(() => PNHandler.say(story), 500);   // in a mission the stage's ORACLE introduces it; comms style: the brief is the message
    if(PN) PN.log("twist", { id, level });
    return level;
  }

  // Alarm meter: max strikes, then onTrip()
  function alarm(max, onTrip, host){
    const decoy = PN && PN.perk ? PN.perk("strikes") : 0; max += decoy;   // safehouse gadget: the decoy drone takes the first strike
    const el = document.createElement("span"); el.className = "tw-meter";
    el.innerHTML = `ALARM ${Array.from({ length: max }, (_, k) => k < decoy ? '<i class="decoy" title="Decoy drone: one extra strike"></i>' : "<i></i>").join("")}`;
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
    hideBrief(); if(W.brief){ W.brief.chip.classList.add("hide"); W.hints.chip.classList.add("hide"); }
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

  // ---------- Brief (context) and HINTS (instructions) ----------
  // Round 14 (Bertie: "I never read instructions, I work it out"): two hologram windows.
  //  BRIEF: the story of this task in one line, plus the name of the current step ("Wall 1 of 2"). Opens at the start.
  //  HINTS: how to do it (the goal, the current step's instruction, an example). Never opens by itself unless the
  //  pupil ticks "Pop up for every new step". H opens/closes the brief, ? (or /) the hints.
  //  step(html, { name }) : html goes to HINTS, name (if given) to the brief. setGoal(html, { example, name }) likewise.
  //  briefOpen() is true while either window is open, so timed things wait for the pupil.
  const AUTO_KEY = "primenet_hints_auto";
  const autoHints = () => { try{ return localStorage.getItem(AUTO_KEY) === "1"; }catch(e){ return false; } };
  let B = null;
  const W = {};   // the two windows: W.brief, W.hints
  function makeWin(kind, title, chipLabel, key, chipPos){
    const layer = document.createElement("div"); layer.className = "twb-layer twb-" + kind;
    layer.innerHTML = `<div class="twb-dim"></div><div class="twb-win" role="dialog" aria-label="${title}"><div class="hw">
      <div class="twb-t"><span>${title}</span><span><button class="twb-say" type="button" aria-label="Read it aloud" title="Read it aloud">🔊</button> <i>●</i> LIVE</span></div>
      <div class="twb-b"><div class="twb-step"></div><div class="twb-goal"></div><div class="twb-ex"></div></div>
      <div class="twb-f"><span>Press <kbd>${key}</kbd> to hide or show this</span>${kind === "hints" ? `<label class="twb-auto"><input type="checkbox" class="twb-autoIn" ${autoHints() ? "checked" : ""}> Pop up for every new step</label>` : ""}<button class="twb-go pn-go" type="button">GOT IT</button></div></div></div>
      <div class="twb-sr" aria-live="polite"></div>`;
    const chip = document.createElement("button"); chip.type = "button"; chip.className = "twb-chip hide twb-chip-" + kind; chip.style.bottom = chipPos + "px";
    chip.innerHTML = `${chipLabel} <kbd>${key}</kbd>`; chip.setAttribute("aria-label", `${chipLabel} (${key})`);
    document.body.append(layer, chip);
    const w = { kind, layer, chip, win: layer.querySelector(".twb-win"), step: layer.querySelector(".twb-step"), goal: layer.querySelector(".twb-goal"), ex: layer.querySelector(".twb-ex"), sr: layer.querySelector(".twb-sr"), open: false };
    layer.querySelector(".twb-go").addEventListener("click", () => hideWin(w));
    layer.querySelector(".twb-dim").addEventListener("click", () => hideWin(w));
    layer.querySelector(".twb-say").addEventListener("click", e => { e.stopPropagation(); if(window.PNVoice) PNVoice.speak(w.win.querySelector(".twb-b").innerText, { force: true }); });
    chip.addEventListener("click", () => { if(kind === "brief" && B && B.comms) comms(); else showWin(w); });
    const auto = layer.querySelector(".twb-autoIn");
    if(auto) auto.addEventListener("change", e => { try{ localStorage.setItem(AUTO_KEY, e.target.checked ? "1" : "0"); }catch(err){} SND("click"); });
    return w;
  }
  function buildBrief(goal, example, title, context, style){
    W.brief = makeWin("brief", title || "BRIEF", title || "BRIEF", "H", 96);
    W.hints = makeWin("hints", "HINTS", "? HINTS", "?", 146);
    B = { goalHTML: goal, stepHTML: "", context: context || goal, name: "", example: example || "", comms: style === "comms" };
    render();
    document.addEventListener("keydown", e => {
      if(e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target, typing = t && (t.isContentEditable || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && /^(text|search|password|email|url|tel)$/.test(t.type || "text") && !/numeric|decimal/.test(t.inputMode || "")));
      if(typing) return;
      if(e.key === "h" || e.key === "H"){ e.preventDefault(); if(B.comms) comms(); else toggleWin(W.brief); }
      else if(e.key === "?" || e.key === "/"){ e.preventDefault(); toggleWin(W.hints); }
    });
    if(B.comms){   // no panel: the tab stays put and sends the comms again
      setTimeout(() => { W.brief.chip.classList.remove("hide"); W.hints.chip.classList.remove("hide"); comms(); }, EMBED ? 1200 : 600);   // in a mission, after the stage's own intro line
      return;
    }
    setTimeout(() => { showWin(W.brief); W.hints.chip.classList.remove("hide"); }, 350);
  }
  // Comms style: the brief as ORACLE's message (the stage's ORACLE in a mission); <b> becomes ORACLE's highlight
  function comms(){ if(!B || document.querySelector(".tw-result")) return; say(String(B.context).replace(/<b>(.*?)<\/b>/g, "*$1*").replace(/<[^>]+>/g, "")); }
  function render(){
    if(!B) return;
    W.brief.step.innerHTML = B.context;
    W.brief.goal.innerHTML = B.name ? `<b>${B.name}</b>` : "";
    W.brief.ex.innerHTML = "";
    W.hints.step.innerHTML = B.stepHTML || B.goalHTML;
    W.hints.goal.innerHTML = B.stepHTML ? B.goalHTML : "";
    W.hints.ex.innerHTML = B.example ? `Example: ${B.example}` : "";
    W.brief.sr.textContent = W.brief.step.textContent;
    W.hints.sr.textContent = W.hints.step.textContent;
  }
  function aimAtChip(w){   // the window zooms out of / back into its tab
    const r = w.chip.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    w.win.style.setProperty("--dx", (cx - 24 - w.win.offsetWidth / 2) + "px"); w.win.style.setProperty("--dy", (cy - innerHeight * 0.5) + "px");
  }
  const anyOpen = () => !!((W.brief && W.brief.open) || (W.hints && W.hints.open));
  function showWin(w){
    if(!w || w.open || document.querySelector(".tw-result")) return;
    const other = w === W.brief ? W.hints : W.brief; if(other && other.open) hideWin(other, true);
    const was = anyOpen();
    aimAtChip(w); w.open = true; w.layer.classList.add("open"); w.chip.classList.add("hide"); w.chip.classList.remove("ping");
    if(!was) window.dispatchEvent(new CustomEvent("pn-brief", { detail: { open: true } }));
    SND("zoom");
    if(window.PNVoice) PNVoice.speak(w.win.querySelector(".twb-b").innerText);
    setTimeout(() => { if(w.open) w.layer.querySelector(".twb-go").focus({ preventScroll: true }); }, 60);
  }
  function hideWin(w, swapping){
    if(!w || !w.open) return;
    aimAtChip(w); w.open = false; w.layer.classList.remove("open"); w.chip.classList.remove("hide");
    if(!swapping && !anyOpen()){ window.dispatchEvent(new CustomEvent("pn-brief", { detail: { open: false } })); SND("whooshDown"); }
  }
  function toggleWin(w){ if(w.open) hideWin(w); else showWin(w); }
  function ping(w){ if(!w || w.open) return; w.chip.classList.remove("ping"); void w.chip.offsetWidth; w.chip.classList.add("ping"); }
  function showBrief(){ if(B && B.comms) comms(); else showWin(W.brief); }
  function hideBrief(){ hideWin(W.hints, true); hideWin(W.brief); if(W.hints) hideWin(W.hints); }
  function showHints(){ showWin(W.hints); }
  function step(html, opts = {}){
    if(!B) return;
    const nameChanged = opts.name !== undefined && opts.name !== B.name;
    if(B.stepHTML === html && !nameChanged) return;
    B.stepHTML = html; if(opts.name !== undefined) B.name = opts.name; render();
    if(nameChanged) ping(W.brief);
    if(!opts.quiet && autoHints()) showWin(W.hints); else ping(W.hints);
  }
  function setGoal(html, opts = {}){   // a new goal for a new stage; opts.example replaces the example ("" clears it), opts.name / opts.context update the brief
    if(!B) return;
    B.goalHTML = html; B.stepHTML = "";
    if(opts.example !== undefined) B.example = opts.example || "";
    if(opts.name !== undefined) B.name = opts.name;
    if(opts.context !== undefined) B.context = opts.context;
    render();
    if(opts.context !== undefined && !opts.quiet){ if(B.comms) comms(); else showWin(W.brief); } else ping(W.brief);
    if(!opts.quiet && autoHints() && opts.context === undefined) showWin(W.hints); else ping(W.hints);
  }
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

  window.PNTwist = { init, peekLevel, setGoal, step, showBrief, hideBrief, showHints, briefOpen: anyOpen, alarm, finish, say, target, targets, level: () => level, SND, isPrime, isSquare, isCube, pairs, smallestFactor, shuffle, pick, range, gcd, lcm };
})();
