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
  .pnt-msg{ color:#f7e3a8; font-size:12px; min-height:1.2em; opacity:.8; }`;

  const actions = [];
  let panel, list, msg;

  function build(){
    if(panel) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const wrap = document.createElement("div"); wrap.className = "pnt";
    wrap.innerHTML = `<div class="pnt-panel" hidden><h4>TEST TOOLS · TEACHER ONLY</h4><div class="pnt-list" style="display:flex;flex-direction:column;gap:6px"></div>
      <label><input type="checkbox" class="pnt-fast"> Fast animations</label><div class="pnt-msg"></div></div>
      <span style="display:flex;gap:6px"><button class="pnt-toggle" type="button" title="Test tools (teacher only)">TEST</button><button class="pnt-toggle pnt-skip" type="button" hidden title="Skip this step (Ctrl+Shift+K)">SKIP ▸</button></span>`;
    document.body.appendChild(wrap);
    panel = wrap.querySelector(".pnt-panel"); list = wrap.querySelector(".pnt-list"); msg = wrap.querySelector(".pnt-msg");
    wrap.querySelector(".pnt-toggle").addEventListener("click", e => { e.stopPropagation(); panel.hidden = !panel.hidden; });
    const f = wrap.querySelector(".pnt-fast"); f.checked = fast;
    f.addEventListener("change", () => { fast = f.checked; try{ sessionStorage.setItem(FAST_KEY, fast ? "1" : "0"); }catch(e){} say(fast ? "Animations run 8× faster." : "Normal speed."); });
    // Keep clicks inside the panel from reaching the game (some games refocus on any click)
    wrap.addEventListener("click", e => e.stopPropagation());
    wrap.addEventListener("keydown", e => e.stopPropagation());
    actions.forEach(render);
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

  window.PNTest = {
    get fast(){ return fast; },
    speed(){ return fast ? 8 : 1; },
    add(label, run){ const a = { label, run }; actions.push(a); if(list) render(a); },
    skip(label, run){ skipAction = { label, run }; paintSkip(); },
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
