/* PRIMENET mode bar (round 14). A pupil should always know two things without reading:
   is this my turn, or do I just watch? And where am I in the mission?
   - PNMode.watch(label, { seconds, onSkip }) : blue WATCH bar with a big progress bar and hacker code streaming.
     Nothing to do. Returns a handle with .progress(k 0..1) and .end().
   - PNMode.turn(label) : green YOUR TURN bar with the job in a few words.
   - PNMode.done()       : hides the bar.
   - PNMode.idle()       : a promise that resolves when no WATCH is running (twists wait on it).
   - PNMode.typeThrough({ label, keys }) : a short "hack in" where any key types gobbledegook; resolves when full.
     With dock:"br" it is a small panel in the bottom-right over the page (the page stays live, ORACLE moves left of it);
     it stays up at 100% and resolves with { el, close } so the page can show its own message in it.
   - PNMode.money(amount): lights the £ step at the end of the mission.
   The stage strip (SCAN · VAULT 1 2 3 · BLUEPRINT · HACK · £ after the hack) sits on the right of the bar. */
(function(){
  "use strict";
  const PN = window.Primenet;
  const qs = new URLSearchParams(location.search);
  const EMBED = window.parent !== window && window.name !== "pnshell";   // a twist in a stage (not the full screen shell)
  const PRACTICE = qs.get("practice") === "1";
  const SND = (n, a) => { if(window.PNSound) PNSound.play(n, a); };
  const speed = () => (window.PNTest ? PNTest.speed() : 1);
  // voice.js may still be loading when a page sets its first label, so wait a moment for it
  const say = (t, tries = 0) => { if(window.PNVoice) PNVoice.speak(t); else if(tries < 10) setTimeout(() => say(t, tries + 1), 200); };

  const css = `
  /* Round 16 (Bertie): the bar only shows for WATCH, as a thin strip over the page (it never pushes the page down).
     YOUR TURN has no bar: the page itself is the cue. The chapter cards say where you are. */
  .pnm{ position:fixed; left:0; right:0; top:0; z-index:9400; display:flex; align-items:stretch; gap:0; min-height:40px;
    font-family:"Chakra Petch", var(--font-ui, sans-serif); color:#eafcff; background:#041318; border-bottom:2px solid #1d4a55; box-shadow:0 6px 24px rgba(0,0,0,.5);
    transform:translateY(-110%); transition:transform .35s cubic-bezier(.2,1,.3,1), background .3s, border-color .3s; }
  .pnm.on{ transform:none; }
  .pnm .chip{ flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:0 14px; font-weight:700; font-size:15px; letter-spacing:.18em; }
  .pnm .chip svg{ width:20px; height:20px; }
  .pnm .mid{ flex:1 1 auto; min-width:0; display:flex; flex-direction:row; align-items:center; gap:14px; padding:6px 14px; }
  .pnm .lab{ flex:0 1 auto; font-size:15px; font-weight:600; letter-spacing:.04em; line-height:1.25; }   /* long jobs wrap rather than get cut off */
  .pnm .bar{ flex:1 1 auto; height:8px; background:rgba(110,200,255,.14); border:1px solid rgba(110,200,255,.45); display:none; }
  .pnm .bar i{ display:block; height:100%; width:0; background:linear-gradient(90deg,#3aa7ff,#8feaff); box-shadow:0 0 12px #6ec8ff; transition:width .25s linear; }
  .pnm .tick{ flex:0 0 auto; max-width:30vw; font-family:"Courier Prime", monospace; font-size:12px; color:rgba(160,230,255,.75); white-space:nowrap; overflow:hidden; display:none; }
  .pnm .skip{ display:none; align-self:center; margin-right:12px; font:inherit; font-weight:700; font-size:12px; letter-spacing:.16em; color:#bfefff; background:transparent; border:1px solid rgba(140,235,255,.5); padding:7px 12px; cursor:pointer; }
  .pnm.watch{ background:linear-gradient(90deg,#062235,#041a26); border-color:#3aa7ff; }
  .pnm.watch .chip{ background:#0d3552; color:#8feaff; }
  .pnm.watch .bar, .pnm.watch .tick{ display:block; }
  .pnm.watch.canskip .skip{ display:block; }
  .pnm.turn{ background:linear-gradient(90deg,#08301f,#05190f); border-color:#2fbf8a; }
  .pnm.turn .chip{ background:#2fbf8a; color:#03170e; }
  .pnm.turn .lab{ font-size:21px; color:#eafff4; }
  .pnm.pulse .chip{ animation:pnmPulse .9s ease-out 2; }
  @keyframes pnmPulse{ 40%{ filter:brightness(1.6); box-shadow:0 0 30px #2fbf8a; } }
  /* Where am I: the mission's stages, right-hand side */
  .pnm .stages{ display:none !important; flex:0 0 auto; align-items:center; gap:6px; padding:0 14px; border-left:1px solid rgba(255,255,255,.08); font-size:12px; font-weight:700; letter-spacing:.12em; }
  .pnm .st{ padding:5px 8px; border:1px solid rgba(255,255,255,.14); color:rgba(235,255,248,.45); white-space:nowrap; }
  .pnm .st.done{ color:#7dffc4; border-color:rgba(47,191,138,.5); }
  .pnm .st.done::before{ content:"✓ "; }
  .pnm .st.now{ color:#041318; background:#ffc94d; border-color:#ffc94d; }
  .pnm .st.money{ color:#ffc94d; border-color:rgba(255,201,77,.45); }
  .pnm .st.money.now{ color:#041318; background:#ffc94d; }
  .pnm .st small{ font-weight:600; letter-spacing:.06em; opacity:.85; }
  /* WATCH: hacker code streaming down the right edge. Code on screen = nothing for you to do. */
  .pnm-rain{ position:fixed; right:0; top:var(--pn-mode-h, 62px); width:min(260px, 20vw); height:min(32vh, 300px); z-index:9390; pointer-events:none; overflow:hidden;
    font-family:"Courier Prime", monospace; font-size:12px; line-height:1.45; color:rgba(110,220,255,.42); padding:8px 10px;
    background:linear-gradient(180deg, rgba(3,14,20,.55), rgba(3,14,20,0)); opacity:0; transition:opacity .4s; }
  .pnm-rain.on{ opacity:1; }
  .pnm-rain b{ color:#ffe68a; font-weight:400; }
  /* Teacher: beside the page's central container, not out at the screen edge (placeRain) */
  html.pn-rain-hug .pnm-rain{ left:var(--pn-rain-l); right:auto; width:var(--pn-rain-w); top:var(--pn-rain-t); padding-left:4px; transition:opacity .4s, left .5s ease, width .5s ease; }   /* glides, never jumps, if the container moves */
  /* typeThrough: a short hack where any key types */
  .pnm-type{ position:fixed; inset:0; z-index:9450; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(1,8,12,.82); }
  .pnm-type .box{ width:min(760px,100%); background:#031017; border:1px solid #2fbf8a; box-shadow:0 0 40px rgba(47,191,138,.25); padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  .pnm-type .hd{ display:flex; justify-content:space-between; font-family:"Chakra Petch", sans-serif; font-weight:700; letter-spacing:.2em; color:#2fbf8a; font-size:15px; }
  .pnm-type .code{ font-family:"Courier Prime", monospace; font-size:15px; color:#9fffd4; height:190px; overflow:hidden; white-space:pre-wrap; word-break:break-all; }
  .pnm-type .code::after{ content:"▌"; animation:pnmCur .8s steps(2) infinite; } @keyframes pnmCur{ 50%{ opacity:0; } }
  .pnm-type .meter{ height:14px; border:1px solid #2fbf8a; } .pnm-type .meter i{ display:block; height:100%; width:0; background:#2fbf8a; box-shadow:0 0 14px #2fbf8a; }
  .pnm-type .hint{ font-family:"Chakra Petch", sans-serif; font-size:18px; letter-spacing:.1em; color:#eafff4; text-align:center; }
  .pnm-type .hint kbd{ font:inherit; font-weight:700; color:#03170e; background:#2fbf8a; padding:2px 8px; }
  /* typeThrough({ dock:"br" }): the same terminal, small, bottom right, above the FULL SCREEN button */
  html{ --pnm-dock-w:min(460px, calc(100vw - 24px)); }
  .pnm-type.dock{ inset:auto; right:12px; bottom:52px; width:var(--pnm-dock-w); padding:0; background:none; display:block; }
  .pnm-type.dock .box{ width:100%; padding:10px 14px; gap:7px; background:rgba(3,16,23,.95); box-shadow:0 10px 40px rgba(0,0,0,.6), 0 0 28px rgba(47,191,138,.25); cursor:pointer; }
  .pnm-type.dock .hd{ font-size:15px; letter-spacing:.14em; }
  .pnm-type.dock .code{ font-size:15px; line-height:1.3; height:2.6em; }
  .pnm-type.dock .meter{ height:12px; }
  .pnm-type.dock .hint{ font-size:17px; letter-spacing:.04em; line-height:1.45; text-wrap:balance; min-height:2.9em; }
  .pnm-type.dock .hint.done{ color:#7dffc4; font-weight:700; letter-spacing:.1em; text-shadow:0 0 16px rgba(47,191,138,.6); }
  .pnm-type.dock.full .code::after{ content:none; }
  html.pnm-docked .pnh{ right:calc(var(--pnm-dock-w) + 24px); bottom:52px; }
  .pnm-chap{ position:fixed; inset:0; z-index:9420; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; pointer-events:none;
    background:radial-gradient(ellipse at 50% 50%, rgba(4,26,36,.92), rgba(1,8,12,.96)); opacity:0; transition:opacity .3s; font-family:"Chakra Petch", sans-serif; }
  .pnm-chap.on{ opacity:1; }
  .pnm-chap small{ font-size:18px; letter-spacing:.4em; color:#8feaff; }
  .pnm-chap b{ font-size:clamp(34px,6vw,72px); letter-spacing:.14em; color:#eafcff; text-shadow:0 0 30px rgba(110,220,255,.5); text-transform:uppercase; }
  @media (max-width:900px){ .pnm .stages{ display:none; } .pnm-rain{ display:none; } html.pnm-docked .pnh{ right:18px; bottom:auto; top:70px; } }
  @media (prefers-reduced-motion: reduce){ .pnm{ transition:none; } .pnm.pulse .chip, .pnm-type .code::after{ animation:none; } }
  html.pn-reduce-motion .pnm.pulse .chip{ animation:none; }`;

  const EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const HAND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 13V5a2 2 0 1 1 4 0v6m0-1V4a2 2 0 1 1 4 0v7m0-3a2 2 0 1 1 4 0v5a8 8 0 0 1-8 8h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3-2l3 3"/></svg>`;

  let bar = null, rain = null, state = "none", watchCount = 0, idleWaiters = [], rainTimer = null, tickTimer = null;

  // ---------- Gobbledegook ----------
  const hex = n => Array.from({ length: n }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function codeLine(){
    const m = PN && PN.mission ? PN.mission() : { codename: "AGENT", target: "TARGET" };
    const tgt = String(m.target || "TARGET").toLowerCase().replace(/[^a-z]+/g, "_");
    return pick([
      () => `ssh oracle@${tgt}.net -p ${1000 + Math.floor(Math.random() * 8999)}`,
      () => `mount /dev/${pick(["vault", "cam", "grid", "relay"])}${Math.floor(Math.random() * 9)} --ro`,
      () => `0x${hex(8)}  ${hex(4)} ${hex(4)} ${hex(4)} ${hex(4)}`,
      () => `decrypt --key <b>${hex(12)}</b>`,
      () => `trace.route(${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)})`,
      () => `agent[${m.codename}] :: handshake OK`,
      () => `scan.primes(${Math.floor(Math.random() * 90) + 10}) -> ${pick(["TRUE", "FALSE"])}`,
      () => `patch firewall.rule[${Math.floor(Math.random() * 64)}] = ALLOW`,
      () => `render.floor(${pick([1, 2, 3])}).lasers.on()`,
      () => `>> ${pick(["uplink", "cipher", "mirror", "relay", "ghost"])}.${pick(["sync", "spoof", "loop", "inject"])}() ${hex(6)}`,
    ])();
  }

  function build(){
    if(bar) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    bar = document.createElement("div"); bar.className = "pnm"; bar.setAttribute("role", "status"); bar.setAttribute("aria-live", "polite");
    bar.innerHTML = `<div class="chip"><span class="ic"></span><span class="nm"></span></div>
      <div class="mid"><div class="lab"></div><div class="bar"><i></i></div><div class="tick"></div></div>
      <button class="skip" type="button">TAP TO SKIP ▸▸</button><div class="stages"></div>`;
    rain = document.createElement("div"); rain.className = "pnm-rain"; rain.setAttribute("aria-hidden", "true");
    document.body.append(bar, rain);
    bar.querySelector(".skip").addEventListener("click", e => { e.stopPropagation(); if(bar._skip) bar._skip(); });
    renderStages();
    new ResizeObserver(() => document.documentElement.style.setProperty("--pn-mode-h", bar.offsetHeight + "px")).observe(bar);
  }
  function show(){
    build();
    
    requestAnimationFrame(() => bar.classList.add("on"));
  }

  // ---------- Chapter strip (round 15: the mission as chapters of a heist film) ----------
  const CHAPTERS = [
    { key: "intercept", name: "INTERCEPT" }, { key: "decrypt", name: "DECRYPT" }, { key: "building", name: "BUILDING" },
    { key: "plan", name: "PLAN" }, { key: "heist", name: "HEIST" }, { key: "vault", name: "VAULT" }, { key: "money", name: "£" },
  ];
  let moneyShown = false, forced = null;
  function where(){
    const p = location.pathname;
    const floors = (() => { try{ return (JSON.parse(localStorage.getItem("blueprintProgress") || "[]") || []).length; }catch(e){ return 0; } })();
    if(forced) return { now: forced };
    if(/briefing/.test(p)) return { now: "brief" };
    if(/prime_frequency_scan/.test(p)) return { now: "intercept" };
    if(/target_locked/.test(p)) return { now: "decrypt", floor: 1 };
    if(/factor_vault/.test(p)) return { now: "decrypt", floor: Math.min(3, floors + 1) };
    if(/vault_grid_demo/.test(p)) return { now: "decrypt", floor: Math.max(1, Math.min(3, floors)) };
    if(/vault_blueprint_viewer/.test(p)) return { now: "building" };
    if(/prime_hack/.test(p)) return { now: moneyShown ? "money" : "vault" };
    return null;
  }
  function renderStages(){
    if(!bar) return;
    const box = bar.querySelector(".stages"), w = where();
    if(!w || PRACTICE){ box.style.display = "none"; return; }
    const order = CHAPTERS.map(c => c.key), at = order.indexOf(w.now);
    const wallet = (() => { try{ const a = PN && PN.getAgent && PN.getAgent(); return a && PN.walletOf ? PN.walletOf(a.codename) : 0; }catch(e){ return 0; } })();
    box.innerHTML = CHAPTERS.map((c, i) => {
      const cls = w.now === "brief" ? "" : i < at ? "done" : i === at ? "now" : "";
      if(c.key === "money") return `<span class="st money ${cls}" title="The money comes after the vault">£ ${moneyShown ? `<small>THE MONEY</small>` : `<small>AFTER THE VAULT</small>`}${wallet ? ` · £${Number(wallet).toLocaleString("en-GB")}` : ""}</span>`;
      const floors = c.key === "decrypt" && w.now === "decrypt" && w.floor ? ` ${[1, 2, 3].map(n => n < w.floor ? "●" : n === w.floor ? "◉" : "○").join("")}` : "";
      return `<span class="st ${cls}">${c.name}${floors}</span>`;
    }).join("");
  }
  // PNMode.chapter("plan") : which chapter this page is on now (the blueprint page moves through three)
  function chapter(key){ forced = key; if(bar) renderStages(); }
  // PNMode.chapterCard(3, "Decrypt the plans") : a short title card between chapters, ~1.6 s, as a WATCH
  function chapterCard(num, title, { seconds = 1.6 } = {}){
    // Bertie: no MISSION · PART cards; the story flows straight on (kept as a no-op so pages needn't change)
    if(EMBED || PRACTICE || !chapterCard.on) return Promise.resolve();
    build();
    const card = document.createElement("div"); card.className = "pnm-chap"; card.setAttribute("role", "status");
    // Bertie: not "chapters" (not mission-like). The card just says MISSION · PART ONE; title stays for the teacher's notes
    const part = "PART " + (["ONE","TWO","THREE","FOUR","FIVE","SIX"][num - 1] || num);
    card.innerHTML = `<small>PRIMENET // CLASSIFIED</small><b>MISSION · ${part}</b>`;
    document.body.appendChild(card);
    const h = watch(`Mission part ${num}`, { seconds });
    SND("scanline");
    requestAnimationFrame(() => card.classList.add("on"));
    return new Promise(r => setTimeout(() => { card.classList.remove("on"); setTimeout(() => { card.remove(); h.end(); r(); }, 350); }, seconds * 1000 / speed()));
  }

  // ---------- WATCH / YOUR TURN ----------
  function setChip(kind, label){
    bar.classList.remove("watch", "turn", "canskip", "pulse");
    bar.classList.add(kind);
    bar.querySelector(".ic").innerHTML = kind === "watch" ? EYE : HAND;
    bar.querySelector(".nm").textContent = kind === "watch" ? "WATCH" : "YOUR TURN";
    bar.querySelector(".lab").innerHTML = label || "";
  }
  // Teacher: the rain sits 16px to the right of the page's central container rather than at the screen edge. A page marks
  // it with data-pn-centre (="top" also lines the rain up with its top), or it's listed here. No container, or under 150px
  // beside it: the top-right corner as before. Published as --pn-rain-l/-w/-t (html.pn-rain-hug) for the page's own panels.
  // "720px": a box that wide in the middle of the screen (target_locked: the building and its scan, wider than the closed brackets)
  const CENTRE = { briefing: ".stage", prime_frequency_scan: ".frame", target_locked: "720px", vault_grid_demo: "#stage", vault_blueprint_viewer: ".bp-stage top", prime_hack: ".terminalWindow" };
  function placeRain(){
    const de = document.documentElement, [sel = "", flag] = (CENTRE[(location.pathname.match(/(\w+)\.html$/) || [])[1]] || "").split(" "), px = /px$/.test(sel);
    const el = document.querySelector("[data-pn-centre]") || (sel && !px && document.querySelector(sel));
    const r = el ? (el.offsetWidth ? el.getBoundingClientRect() : null) : px ? { right: (de.clientWidth + parseFloat(sel)) / 2, top: 0 } : null;
    const left = r ? Math.round(r.right + 16) : 0, w = Math.min(260, de.clientWidth - left), hug = !!r && w >= 150 && innerWidth > 900;
    de.classList.toggle("pn-rain-hug", hug);
    if(!hug) return;
    de.style.setProperty("--pn-rain-l", left + "px"); de.style.setProperty("--pn-rain-w", w + "px");
    de.style.setProperty("--pn-rain-t", ((el && el.dataset.pnCentre) || flag) === "top" ? `max(var(--pn-mode-h, 62px), ${Math.round(r.top)}px)` : "var(--pn-mode-h, 62px)");
  }
  addEventListener("resize", () => { if(rain) placeRain(); });
  function startRain(){
    placeRain(); rain.classList.add("on");
    clearInterval(rainTimer); clearInterval(tickTimer);
    const lines = [];
    rainTimer = setInterval(() => { placeRain(); lines.push(codeLine()); if(lines.length > 30) lines.shift(); rain.innerHTML = lines.join("<br>"); SND("typing"); }, 150);
    const tick = bar.querySelector(".tick");
    tickTimer = setInterval(() => { tick.innerHTML = codeLine(); }, 380);
  }
  function stopRain(){ clearInterval(rainTimer); clearInterval(tickTimer); if(rain) rain.classList.remove("on"); }
  // Teacher: every bar must reach the right-hand end. When a WATCH ends, its fill runs quickly to 100% (from wherever
  // a timed or progress() fill had got to) and the strip stays up until the full bar has been seen.
  let hideTimer = null, fullAt = 0, hideGen = 0;
  function fillUp(fill){
    const box = fill.parentNode.clientWidth, px = fill.offsetWidth;
    if(!box || px >= box - 1){ fill.style.transition = "none"; fill.style.width = "100%"; fullAt = 0; return; }
    fill.style.transition = "none"; fill.style.width = px + "px"; void fill.offsetWidth;
    fill.style.transition = "width .22s ease-out"; fill.style.width = "100%";
    fullAt = performance.now() + 320;
  }
  function hideBar(){
    clearTimeout(hideTimer); hideTimer = null;
    const gen = ++hideGen, wait = fullAt - performance.now();
    if(wait <= 0){ bar.classList.remove("on"); return; }
    hideTimer = setTimeout(() => { hideTimer = null; whenFull(() => { if(gen === hideGen && watchCount === 0) bar.classList.remove("on"); }); }, wait);
  }
  // Runs fn once a frame with the full bar has been drawn (a busy page can skip frames)
  function whenFull(fn){
    const fill = bar.querySelector(".bar i"); let seen = 0, tries = 0;
    const check = () => {
      if(fill.offsetWidth >= fill.parentNode.clientWidth - 1) seen++;
      if(seen >= 2 || ++tries > 30) fn(); else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }
  function settleIdle(){ if(watchCount > 0) return; const w = idleWaiters; idleWaiters = []; w.forEach(f => f()); }

  function watch(label, { seconds = 0, onSkip = null } = {}){
    if(EMBED) return { progress(){}, end(){} };
    clearTimeout(hideTimer); hideTimer = null;
    show(); setChip("watch", label); state = "watch"; watchCount++;
    const fill = bar.querySelector(".bar i");
    let timer = null, ended = false, pending = null;
    const begin = () => {
      timer = null; fill.style.transition = "none"; fill.style.width = "0"; void fill.offsetWidth;
      if(seconds > 0){ fill.style.transition = `width ${seconds / speed()}s linear`; requestAnimationFrame(() => { fill.style.width = "100%"; }); }
      if(pending !== null) h.progress(pending);
    };
    // A WATCH that has only just ended shows its full bar for a moment before this one starts from empty
    const hold = fullAt - performance.now();
    if(hold > 0) timer = setTimeout(() => whenFull(() => { if(!ended) begin(); }), hold); else begin();
    if(onSkip){ bar.classList.add("canskip"); bar._skip = () => { SND("whoosh"); onSkip(); }; } else bar._skip = null;
    startRain(); say("Watch. " + label);
    const h = {
      progress(k){ if(ended) return; if(timer){ pending = k; return; } fill.style.transition = "width .3s linear"; fill.style.width = Math.round(Math.max(0, Math.min(1, k)) * 100) + "%"; },
      label(t){ if(!ended) bar.querySelector(".lab").innerHTML = t; },
      end(){ if(ended) return; ended = true; clearTimeout(timer); watchCount = Math.max(0, watchCount - 1); if(watchCount === 0){ stopRain(); bar._skip = null; bar.classList.remove("canskip"); fillUp(fill); if(state === "watch") state = "idle"; } settleIdle(); },
    };
    return h;
  }
  function turn(label){
    if(EMBED) return;
    // No bar for YOUR TURN (Bertie didn't like it): the WATCH strip slides away, a soft chirp, and the job is read aloud
    if(bar){ stopRain(); hideBar(); }
    state = "turn"; SND("chirp"); say(label);
  }
  function done(){ if(!bar) return; stopRain(); hideBar(); document.documentElement.classList.remove("pn-mode-on"); state = "none"; }
  function idle(){ return watchCount === 0 ? Promise.resolve() : new Promise(r => idleWaiters.push(r)); }
  // Run an async cinematic inside a WATCH: PNMode.during("Building floor 1", 20, async h => { ... })
  async function during(label, seconds, fn, opts = {}){
    const h = watch(label, { seconds, ...opts });
    try{ return await fn(h); } finally{ h.end(); }
  }

  // ---------- A short hack where any key types gobbledegook ----------
  // onProgress(k): called with k (0..1) on every key, so a page can drive its own animation from the typing
  function typeThrough({ label = "HACKING IN", keys = 16, hint = "Type anything to hack in", dock = "", onProgress = null } = {}){
    if(EMBED) return Promise.resolve();
    build();   // its styles live with the WATCH strip; a page can reach its first typing before any WATCH
    return new Promise(resolve => {
      const ov = document.createElement("div"); ov.className = "pnm-type" + (dock ? " dock" : "");
      ov.setAttribute("role", dock ? "region" : "dialog"); ov.setAttribute("aria-label", label);
      ov.innerHTML = `<div class="box"><div class="hd"><span>${label}</span><span class="pc">0%</span></div><div class="code"></div><div class="meter"><i></i></div>
        <div class="hint">${hint}: <kbd>any key</kbd> or tap</div></div>`;
      document.body.appendChild(ov);
      if(dock) document.documentElement.classList.add("pnm-docked");
      if(state !== "turn") turn(label.charAt(0) + label.slice(1).toLowerCase());
      const code = ov.querySelector(".code"), meter = ov.querySelector(".meter i"), pc = ov.querySelector(".pc");
      let n = 0, text = "", stream = codeLine() + "\n";
      const need = Math.max(4, Math.round(keys / Math.max(1, speed() / 2)));
      const close = () => { ov.remove(); if(!document.querySelector(".pnm-type.dock")) document.documentElement.classList.remove("pnm-docked"); };
      // Docked, a tap anywhere types too, except on the page's own buttons
      const tap = e => { if(ov.contains(e.target) || !e.target.closest("button, a, input, select, textarea, [role=button], .pnh-box")) press(null); };
      const press = e => {
        if(e && e.type === "keydown"){ if(e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab") return; e.preventDefault(); e.stopPropagation(); }
        if(n >= need) return;
        for(let k = 0; k < 4 + Math.floor(Math.random() * 4); k++){ if(!stream.length) stream = codeLine().replace(/<\/?b>/g, "") + "\n"; text += stream[0]; stream = stream.slice(1); }
        code.textContent = text.slice(-900); code.scrollTop = code.scrollHeight; n++; SND("typing");
        const k = Math.min(1, n / need); meter.style.width = Math.round(k * 100) + "%"; pc.textContent = Math.round(k * 100) + "%";
        if(onProgress) onProgress(k);
        if(k >= 1){
          document.removeEventListener("keydown", press, true); document.removeEventListener("pointerdown", tap, true); SND("lockon");
          if(dock){ ov.classList.add("full"); setTimeout(() => resolve({ el: ov, close }), 450 / speed()); }   // stays up at 100%
          else setTimeout(() => { ov.remove(); resolve(); }, 450 / speed());
        }
      };
      document.addEventListener("keydown", press, true);
      if(dock) document.addEventListener("pointerdown", tap, true);
      else ov.addEventListener("pointerdown", () => press(null));
    });
  }

  function money(){ moneyShown = true; renderStages(); }
  function refresh(){ renderStages(); }

  window.PNMode = { watch, turn, done, idle, during, typeThrough, money, refresh, codeLine, chapter, chapterCard, get state(){ return state; } };
})();
