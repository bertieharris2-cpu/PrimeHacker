/* PRIMENET twists: the rotating bank-heist tasks. Each twist is its own page so it can be tested
   away from the mission (open modules/twist_lab.html). This file gives every twist the same frame:
   a header with the level switch, an alarm meter, ORACLE, number helpers and the result screen.
   PNTwist.init({ id, stage, title, goal, story }) then PNTwist.level(), .alarm(max, onTrip), .finish({...}). */
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
  /* Feedback: instructions must be quick to take in. One goal line on the page; the story goes to ORACLE. */
  .tw-goal{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-family:var(--font-ui); font-size:clamp(19px,2.2vw,24px); letter-spacing:.03em; color:var(--text-primary); }
  .tw-goal .g{ font-size:12px; letter-spacing:.22em; color:#1a1405; background:var(--warning); padding:3px 8px; font-weight:700; }
  .tw-goal b{ color:var(--warning); }
  .tw-ex{ font-size:15px; color:var(--text-muted); border-left:2px solid var(--line-strong); padding-left:10px; }
  .tw-ex b{ color:var(--text-primary); }
  .tw-bar{ display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px 18px; font-size:15px; color:var(--text-muted); }
  .tw-bar b{ color:var(--text-primary); }
  .tw-meter{ display:inline-flex; align-items:center; gap:6px; font-family:var(--font-ui); letter-spacing:.14em; font-size:12px; }
  .tw-meter i{ width:22px; height:9px; border:1px solid rgba(255,107,107,.7); display:inline-block; }
  .tw-meter i.on{ background:#ff4f6d; box-shadow:0 0 10px #ff4f6d; }
  .tw-msg{ min-height:1.6em; font-size:17px; color:var(--text-muted); }
  .tw-msg.ok{ color:var(--ok); } .tw-msg.bad{ color:var(--danger); } .tw-msg.warn{ color:var(--warning); }
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
  function init({ id, stage, title, goal, story, brief, example }){
    const st = document.createElement("style"); st.textContent = css + (EMBED ? " .pnh{ display:none !important; }" : ""); document.head.appendChild(st);
    level = peekLevel();
    const wrap = document.querySelector(".tw") || document.body;
    const head = document.createElement("header"); head.className = "tw-head";
    const lv = ["L1", "L2", "L3"].map(l => { const u = new URL(location.href); u.searchParams.set("level", l); return `<a href="${u.pathname.split("/").pop()}${u.search}" aria-current="${l === level}">${l}</a>`; }).join("");
    head.innerHTML = MISSION
      ? `<div class="l"><span class="eb">CHANGE OF PLAN · ${level}</span><h1>${title}</h1></div>`
      : `<div class="l"><span class="eb">TWIST LAB · ${stage}</span><h1>${title}</h1></div>
      <div class="r"><nav class="tw-lv" aria-label="Level">${lv}</nav><button class="pn-btn small" type="button" id="twNew">New round</button><a class="pn-btn small" href="twist_lab.html" style="text-decoration:none">Twist Lab</a></div>`;
    wrap.prepend(head);
    if(!MISSION) head.querySelector("#twNew").addEventListener("click", () => location.reload());
    const g = document.createElement("div"); g.className = "tw-goal"; g.innerHTML = `<span class="g">GOAL</span><span class="gt">${goal || brief || ""}</span>`; head.after(g);
    if(example){ const e = document.createElement("div"); e.className = "tw-ex"; e.innerHTML = `Example: ${example}`; g.after(e); }
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

  function finish({ ok = true, title, lines = [], note = "" }){
    if(document.querySelector(".tw-result")) return;   // one result screen only (a twist could end twice)
    const ov = document.createElement("div"); ov.className = "tw-result" + (ok ? "" : " fail");
    const next = qs.get("next");
    ov.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="twResT"><h2 id="twResT">${title || (ok ? "TWIST CLEARED" : "ALARM TRIPPED")}</h2>
      <ul>${lines.map(l => `<li>${l}</li>`).join("")}</ul>${note ? `<p style="margin:0;color:var(--text-muted)">${note}</p>` : ""}
      <div class="btns">${MISSION ? `<button class="pn-btn small primary" type="button" data-a="cont">Continue the mission</button>`
        : `<a class="pn-btn small" href="twist_lab.html" style="text-decoration:none">Twist Lab</a><button class="pn-btn small" type="button" data-a="again">Play again</button>${next ? `<a class="pn-btn small primary" href="${next}" style="text-decoration:none">Continue</a>` : ""}`}</div></div>`;
    document.body.appendChild(ov);
    const again = ov.querySelector('[data-a="again"]'); if(again) again.addEventListener("click", () => location.reload());
    const cont = ov.querySelector('[data-a="cont"]');
    if(cont) cont.addEventListener("click", () => { SND("click"); if(EMBED) window.parent.postMessage({ type: "pn-twist-done", ok }, "*"); else if(next) location.href = next; });
    (ov.querySelector(".primary") || ov.querySelector("button")).focus();
    SND(ok ? "success" : "denied");
    if(PN) PN.log("twist-done", { ok, level });
  }

  function setGoal(html){ const el = document.querySelector(".tw-goal .gt"); if(el) el.innerHTML = html; }
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

  window.PNTwist = { init, peekLevel, setGoal, alarm, finish, say, target, targets, level: () => level, SND, isPrime, isSquare, isCube, pairs, smallestFactor, shuffle, pick, range, gcd, lcm };
})();
