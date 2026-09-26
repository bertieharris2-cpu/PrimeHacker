/* PRIMENET badges. Earned for specific achievements and saved as "badge" events in the
   session record, so they belong to the codename and travel in the teacher's record files.
   Games call PNBadges.award("square-hunter"); a badge is only ever awarded once per codename. */
(function(){
  "use strict";
  const PN = window.Primenet;

  const LIST = [
    { id: "first-breach",  name: "First Breach",    icon: "★", color: "#ffc94d", desc: "Breached your first vault." },
    { id: "clean-sweep",   name: "Clean Sweep",     icon: "◎", color: "#2fbf8a", desc: "Finished the Frequency Scan with 100% signal." },
    { id: "interceptor",   name: "Interceptor",     icon: "⌖", color: "#6ec8ff", desc: "Locked every prime in the live intercept without clicking any noise." },
    { id: "square-hunter", name: "Square Hunter",   icon: "■", color: "#ffc94d", desc: "Rebuilt a reinforced floor: a square number." },
    { id: "laser-dancer",  name: "Laser Dancer",    icon: "✦", color: "#ff4f6d", desc: "Crossed the laser corridor without a single hit." },
    { id: "treasure",      name: "Treasure Hunter", icon: "◆", color: "#ffc94d", desc: "Found a hidden vault: all three floors shared a factor." },
    { id: "analyst",       name: "Intel Analyst",   icon: "✚", color: "#4aa3ff", desc: "Answered ORACLE's floor quiz correctly." },
    { id: "prime-sniper",  name: "Prime Sniper",    icon: "✓", color: "#ff4fd8", desc: "Cracked every lock in a run on the first try." },
    { id: "ghost",         name: "Ghost Protocol",  icon: "◐", color: "#9fb7bb", desc: "Finished a run without the trace passing 50%." },
    { id: "wheelman",      name: "Wheelman",        icon: "▲", color: "#2fbf8a", desc: "Made a clean getaway: 3 out of 3." },
    { id: "lights-out",    name: "Lights Out",      icon: "●", color: "#6ec8ff", desc: "Shut down a whole server farm in the blackout finale." },
    { id: "speed-demon",   name: "Speed Demon",     icon: "»", color: "#ff9f43", desc: "Finished a whole mission in under 15 minutes." },
    { id: "high-roller",   name: "High Roller",     icon: "£", color: "#ffc94d", desc: "Held £1,000,000 in your wallet." },
  ];
  const byId = id => LIST.find(b => b.id === id);

  // Every badge a codename has earned, across all sessions on this computer
  function forCodename(codename){
    const name = String(codename || "").trim().toUpperCase();
    if(!PN || !name) return [];
    const got = new Set();
    PN.getRecords().filter(s => s.codename === name).forEach(s =>
      (s.events || []).forEach(e => { if(e.stage === "badge" && e.detail && byId(e.detail.id)) got.add(e.detail.id); }));
    return LIST.filter(b => got.has(b.id)).map(b => b.id);
  }
  // Badges earned in the current session only (for the case file)
  function thisMission(){
    const s = PN && PN.currentSession();
    return s ? (s.events || []).filter(e => e.stage === "badge" && e.detail).map(e => e.detail.id).filter(byId) : [];
  }

  // ---------- Unlock toast ----------
  const css = `
  .pnb-toast{ position:fixed; left:50%; top:18px; z-index:99990; transform:translate(-50%,-140%); transition:transform .45s cubic-bezier(.3,1.4,.5,1);
    display:flex; align-items:center; gap:14px; background:rgba(4,14,17,.97); border:1px solid var(--c); box-shadow:0 12px 50px rgba(0,0,0,.7), 0 0 30px color-mix(in srgb, var(--c) 35%, transparent);
    padding:12px 18px 12px 12px; font-family:var(--font-ui, sans-serif); color:#eafff6; pointer-events:none; max-width:min(520px, 92vw); }
  .pnb-toast.on{ transform:translate(-50%,0); }
  .pnb-toast small{ display:block; font-size:11px; letter-spacing:.22em; color:var(--c); font-weight:700; }
  .pnb-toast b{ display:block; font-size:19px; letter-spacing:.06em; margin:2px 0; }
  .pnb-toast span.d{ font-size:13px; color:rgba(235,255,248,.7); }
  .pnb-hex{ --c:#2fbf8a; width:52px; height:58px; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; color:#041012;
    background:var(--c); clip-path:polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); box-shadow:inset 0 0 0 3px rgba(255,255,255,.35); font-family:system-ui, sans-serif; }
  .pnb-hex.sm{ width:28px; height:32px; font-size:13px; }
  .pnb-hex.off{ background:rgba(255,255,255,.08); color:rgba(255,255,255,.25); }
  .pnb-toast .pnb-hex{ animation:pnbSpin .7s ease-out; }
  @keyframes pnbSpin{ from{ transform:rotateY(180deg) scale(.4); } to{ transform:none; } }`;
  let styled = false, queue = [], showing = false;
  function style(){ if(styled) return; styled = true; const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); }
  function hex(id, small){ const b = byId(id); style(); return b ? `<span class="pnb-hex${small ? " sm" : ""}" style="--c:${b.color}" title="${b.name}: ${b.desc}">${b.icon}</span>` : ""; }
  async function pump(){
    if(showing) return; showing = true;
    while(queue.length){
      const b = queue.shift(); style();
      const t = document.createElement("div"); t.className = "pnb-toast"; t.style.setProperty("--c", b.color);
      t.innerHTML = `${hex(b.id)}<div><small>BADGE UNLOCKED</small><b>${b.name}</b><span class="d">${b.desc}</span></div>`;
      document.body.appendChild(t);
      requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("on")));
      if(window.PNSound) PNSound.play("badge");
      await new Promise(r => setTimeout(r, 3600));
      t.classList.remove("on");
      await new Promise(r => setTimeout(r, 500));
      t.remove();
    }
    showing = false;
  }

  function award(id){
    const b = byId(id), a = PN && PN.getAgent();
    if(!b || !a) return false;
    if(forCodename(a.codename).includes(id)) return false;
    PN.log("badge", { id });
    queue.push(b); pump();
    return true;
  }

  window.PNBadges = { LIST, byId, award, forCodename, thisMission, hex };
})();
