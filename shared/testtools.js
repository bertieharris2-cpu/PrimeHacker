/* PRIMENET test tools. Only appear while the teacher controls are unlocked (PIN on the
   title screen). Each game registers its own shortcuts, e.g. "Solve this lock". Students
   never see this panel. */
(function(){
  "use strict";
  const PN = window.Primenet;
  if(!PN || !PN.isTeacher()) return;

  const FAST_KEY = "primenet_fast_animations";
  let fast = false;
  try{ fast = sessionStorage.getItem(FAST_KEY) === "1"; }catch(e){}

  const css = `
  .pnt{ position:fixed; left:12px; bottom:12px; z-index:99999; font-family:"Inter",system-ui,sans-serif; font-size:13px; color:#1a1405; }
  .pnt-toggle{ background:#f2c14e; color:#1a1405; border:0; font:inherit; font-weight:800; letter-spacing:.12em; padding:8px 12px; cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,.5); }
  .pnt-panel{ margin-bottom:6px; background:rgba(20,16,4,.96); border:2px solid #f2c14e; padding:10px; display:flex; flex-direction:column; gap:6px; min-width:220px; max-width:280px; }
  .pnt-panel[hidden]{ display:none; }
  .pnt-panel h4{ margin:0 0 2px; color:#f2c14e; font-size:11px; letter-spacing:.14em; }
  .pnt-panel button{ background:transparent; color:#f7e3a8; border:1px solid rgba(242,193,78,.55); font:inherit; font-weight:600; text-align:left; padding:7px 10px; cursor:pointer; }
  .pnt-panel button:hover{ background:rgba(242,193,78,.15); }
  .pnt-panel label{ color:#f7e3a8; display:flex; gap:8px; align-items:center; padding:4px 2px; cursor:pointer; }
  .pnt-msg{ color:#f7e3a8; font-size:12px; min-height:1.2em; opacity:.8; }
  .pnt-back{ margin-bottom:6px; background:rgba(20,16,4,.96); border:2px solid #f2c14e; padding:10px; display:flex; flex-direction:column; gap:6px; min-width:230px; }
  .pnt-back[hidden]{ display:none; }
  .pnt-back h4{ margin:0 0 2px; color:#f2c14e; font-size:11px; letter-spacing:.14em; }
  .pnt-back button{ background:transparent; color:#f7e3a8; border:1px solid rgba(242,193,78,.55); font:inherit; font-weight:600; text-align:left; padding:7px 10px; cursor:pointer; }
  .pnt-back button:hover{ background:rgba(242,193,78,.15); } .pnt-back button.now{ border-color:#f2c14e; color:#fff3cf; }`;

  const actions = [];
  let panel, list, msg;

  function build(){
    if(panel) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const wrap = document.createElement("div"); wrap.className = "pnt";
    wrap.innerHTML = `<div class="pnt-panel" hidden><h4>TEST TOOLS · TEACHER ONLY</h4><div class="pnt-list" style="display:flex;flex-direction:column;gap:6px"></div>
      <label><input type="checkbox" class="pnt-fast"> Fast animations</label><div class="pnt-msg"></div></div>
      <div class="pnt-back" hidden></div>
      <span style="display:flex;gap:6px"><button class="pnt-toggle" type="button" title="Test tools (teacher only)">TEST</button><button class="pnt-toggle pnt-bk" type="button" title="Replay this or go back to an earlier scene">◂ BACK</button><button class="pnt-toggle pnt-skip" type="button" hidden title="Skip this step (Ctrl+Shift+K)">SKIP ▸</button></span>`;
    document.body.appendChild(wrap);
    panel = wrap.querySelector(".pnt-panel"); list = wrap.querySelector(".pnt-list"); msg = wrap.querySelector(".pnt-msg");
    wrap.querySelector(".pnt-toggle").addEventListener("click", e => { e.stopPropagation(); panel.hidden = !panel.hidden; });
    const f = wrap.querySelector(".pnt-fast"); f.checked = fast;
    f.addEventListener("change", () => { fast = f.checked; try{ sessionStorage.setItem(FAST_KEY, fast ? "1" : "0"); }catch(e){} say(fast ? "Animations run 8× faster." : "Normal speed."); });
    // Keep clicks inside the panel from reaching the game (some games refocus on any click)
    wrap.addEventListener("click", e => e.stopPropagation());
    wrap.addEventListener("keydown", e => e.stopPropagation());
    actions.forEach(render);
    const bk = wrap.querySelector(".pnt-back");
    wrap.querySelector(".pnt-bk").addEventListener("click", e => { e.stopPropagation(); if(IN_TWIST){ location.reload(); return; } panel.hidden = true; if(bk.hidden) paintBack(bk); bk.hidden = !bk.hidden; });
    skipBtn = wrap.querySelector(".pnt-skip");
    skipBtn.addEventListener("click", e => { e.stopPropagation(); runSkip(); });
    paintSkip();
  }
  // One-click skip for the current step, also on Ctrl+Shift+K (teacher mode only)
  let skipAction = null, skipBtn = null;
  function paintSkip(){ if(!skipBtn) return; skipBtn.hidden = !skipAction; if(skipAction) skipBtn.title = `${skipAction.label} (Ctrl+Shift+K)`; }
  async function runSkip(){ if(!skipAction) return; try{ const r = await skipAction.run(); say(r || `Skipped: ${skipAction.label}.`); }catch(err){ say("Couldn't skip here: " + err.message); } }
  document.addEventListener("keydown", e => { if(e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k")){ e.preventDefault(); runSkip(); } }, true);
  function say(t){ if(msg) msg.textContent = t; }
  function render(a){
    const b = document.createElement("button"); b.type = "button"; b.textContent = a.label;
    b.addEventListener("click", async () => { try{ say("…"); const r = await a.run(); say(r || "Done."); }catch(err){ say("Couldn't do that here: " + err.message); } });
    list.appendChild(b);
  }

  // ---------- BACK (Bertie: replay what just happened) ----------
  // In a twist (an iframe in the mission) BACK restarts that twist. On a mission page it lists the scenes so far; a scene
  // on the blueprint page is reached by fast-forwarding through what comes before it (twists skipped, 16x speed).
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  const IN_TWIST = /^twist_/.test(page);   // a twist page (in a mission's frame or the Twist Lab): BACK restarts it
  const SCENES = [
    { id: "brief",    name: "Briefing",              url: "briefing.html" },
    { id: "scan",     name: "Intercept (the scan)",  url: "prime_frequency_scan.html" },
    { id: "email",    name: "The email",             url: "target_locked.html" },
    { id: "floors",   name: "Floors (from floor 1)", url: "factor_vault.html", fresh: true },
    { id: "building", name: "The building",          url: "vault_blueprint_viewer.html" },
    { id: "plan",     name: "The plan",              url: "vault_blueprint_viewer.html", jump: "plan" },
    { id: "recon",    name: "Guard recon",           url: "vault_blueprint_viewer.html", jump: "recon" },
    { id: "heist",    name: "The heist",             url: "vault_blueprint_viewer.html", jump: "heist" },
    { id: "vault",    name: "The vault",             url: "prime_hack.html" },
  ];
  const PAGE_SCENE = { "briefing.html": "brief", "prime_frequency_scan.html": "scan", "target_locked.html": "email", "factor_vault.html": "floors", "vault_grid_demo.html": "floors", "vault_blueprint_viewer.html": "building", "prime_hack.html": "vault" };
  const SCENE_KEY = "pn_scene_now", JUMP_KEY = "pn_jump";
  const idx = id => SCENES.findIndex(s => s.id === id);
  let sceneNow = PAGE_SCENE[page] || "";
  const setScene = id => { sceneNow = id; try{ sessionStorage.setItem(SCENE_KEY, id); }catch(e){} };
  if(sceneNow && !IN_TWIST) setScene(sceneNow);
  function paintBack(box){
    const here = Math.max(0, idx(sceneNow)), tw = document.querySelector(".pnts iframe");
    box.innerHTML = "<h4>◂ BACK · REPLAY</h4>";
    const add = (label, fn, now) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; if(now) b.className = "now"; b.addEventListener("click", fn); box.appendChild(b); };
    if(tw) add("Restart this twist", () => { try{ tw.contentWindow.location.reload(); }catch(e){} box.hidden = true; }, true);
    SCENES.slice(0, here + 1).reverse().forEach(sc => add((sc.id === sceneNow ? "Replay: " : "") + sc.name, () => {
      try{ if(sc.jump) sessionStorage.setItem(JUMP_KEY, sc.jump); else sessionStorage.removeItem(JUMP_KEY); }catch(e){}
      if(sc.fresh){ try{ localStorage.removeItem("blueprintProgress"); }catch(e){} }
      location.href = sc.url;
    }, sc.id === sceneNow && !tw));
  }
  // Fast-forward to a scene on this page
  let jumpTo = ""; try{ jumpTo = sessionStorage.getItem(JUMP_KEY) || ""; sessionStorage.removeItem(JUMP_KEY); }catch(e){}
  if(IN_TWIST) jumpTo = "";
  window.PNJump = {
    get target(){ return jumpTo; },
    skipping(){ return !!jumpTo; },
    // a page calls this as each scene starts; reaching the target ends the fast-forward
    reached(id){ if(idx(id) >= 0) setScene(id); if(jumpTo && idx(id) >= idx(jumpTo)) jumpTo = ""; },
  };

  window.PNTest = {
    get fast(){ return fast; },
    speed(){ return jumpTo ? 16 : fast ? 8 : 1; },
    add(label, run){ const a = { label, run }; actions.push(a); if(list) render(a); },
    skip(label, run){ skipAction = run ? { label, run } : null; paintSkip(); },
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
