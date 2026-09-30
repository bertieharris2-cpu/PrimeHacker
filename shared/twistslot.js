/* PRIMENET twist slots (round 11): the rotating twists woven into the bank mission.
   Each stage calls PNTwistSlot.run(point) where its twist would fit. If the mission's plan has a twist
   for that point, it plays in a full-screen frame over the stage ("change of plan"), and the promise
   resolves when the twist hands back (by itself, no result card: { id, ok, effect }). Otherwise it resolves straight away.
   Testing: ?twist=<id> on a stage's URL forces that twist at its point; ?notwist=1 turns twists off there. */
(function(){
  "use strict";
  const PN = window.Primenet;
  const qs = new URLSearchParams(location.search);
  // Round 15: ORACLE's line as each twist starts, in the heist story
  const INTRO = {
    // corrupt: none (Bertie: the CORRUPTED label says it; fewer messages in the plan)
    patrols:    "Two guards on the fire door floor. Find when they're both at the blind spot and we slip past.",
    cubes:      "Fuse box. Wire the relays and we black out their cameras.",
    walls:      "Change of plan. The key card is in a deposit box in the basement.",
    strongroom: "Strongroom ahead. The floor is pressure plated. Find the safe way across.",
    factortree: "We're at the key room door. It's bolted, and the bolts want prime factors.",
  };

  const css = `
  .pnts{ position:fixed; inset:0; z-index:99980; background:rgba(2,8,10,.94); display:flex; align-items:center; justify-content:center; }
  .pnts-card{ font-family:"Chakra Petch",sans-serif; text-align:center; color:#ffc94d; letter-spacing:.2em; display:flex; flex-direction:column; gap:10px; animation:pntsIn .4s ease-out; }
  .pnts-card b{ font-size:clamp(30px,5vw,54px); text-shadow:0 0 24px rgba(255,201,77,.5); }
  .pnts-card span{ font-size:16px; color:rgba(235,255,248,.8); letter-spacing:.14em; }
  .pnts iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; background:#061013; opacity:0; transition:opacity .4s; }
  .pnts iframe.on{ opacity:1; }
  body.pnts-on .pnh{ z-index:99985; }   /* ORACLE stays visible over the twist */
  body.pnts-on .pnt, body.pnts-on .pn-home{ display:none !important; }   /* the twist has its own */
  .pnts.static{ background:rgba(2,8,10,.35); }
  .pnts.static .pnts-card{ opacity:0; }
  .pnts-noise{ position:absolute; inset:0; width:100%; height:100%; image-rendering:pixelated; mix-blend-mode:screen; animation:pntsJit .12s steps(2) infinite; }
  @keyframes pntsJit{ 50%{ transform:translate(3px,-2px); } }
  @keyframes pntsIn{ from{ opacity:0; transform:scale(1.15); } }`;
  let styled = false;
  // Round 14: a twist never opens in the middle of a WATCH section; it waits for the cinematic to finish
  // run(point, { intro }) : intro is an async function the page plays first (its own cinematic of what's happening,
  // e.g. the crew walking to the fuse box). With an intro there's no generic CHANGE OF PLAN card.
  // run(point, { params }) : extra settings for the twist's URL, e.g. { next: "fusebox" } (where the crew goes next)
  async function run(point, opts = {}){
    if(window.PNMode) await PNMode.idle();
    if(!PN || !PN.twistAt || qs.get("notwist")) return null;
    const t = PN.twistAt(point) || (qs.get("twist") && PN.TWISTS.find(x => x.id === qs.get("twist") && x.point === point && (x.page || x.proto)));
    if(!t) return null;
    if(opts.intro){ try{ await opts.intro(t); }catch(e){} if(window.PNMode) await PNMode.idle(); }
    return runNow(point, !!opts.intro, opts.params);
  }
  function has(point){ return !!(PN && PN.twistAt && !qs.get("notwist") && (PN.twistAt(point) || (qs.get("twist") && PN.TWISTS.find(x => x.id === qs.get("twist") && x.point === point)))); }
  function runNow(point, introPlayed, params){
    if(!PN || !PN.twistAt || qs.get("notwist")) return Promise.resolve(null);
    let t = PN.twistAt(point);
    const force = qs.get("twist") && PN.TWISTS.find(x => x.id === qs.get("twist") && x.point === point && (x.page || x.proto));
    if(force) t = force;
    if(!t) return Promise.resolve(null);
    if(!styled){ const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); styled = true; }
    const lv = (PN.getAgent() && PN.getAgent().level) || "L1";
    const o = document.createElement("div"); o.className = "pnts"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", t.name);
    // Some twists aren't a change of plan: the guards are recon (Round 17: in the plan, with last night's CCTV; the heist
    // plays its GO moment at the fire door: run('entry', { params: { phase: "recon" | "go" } }))
    const CARD = { patrols: ["RECON", "LAST NIGHT'S CCTV"] }[t.id] || ["CHANGE OF PLAN", t.name.toUpperCase()];
    o.innerHTML = introPlayed ? "" : `<div class="pnts-card"><b>${CARD[0]}</b><span>${CARD[1]}</span></div>`;
    // Round 12: the corrupted blueprint arrives as crackling interference over the stage first
    const STATIC = t.id === "corrupt" && !introPlayed;
    if(STATIC){
      o.classList.add("static");
      const cv = document.createElement("canvas"); cv.className = "pnts-noise"; cv.width = 320; cv.height = 180; o.appendChild(cv);
      const g = cv.getContext("2d"); let on = true;
      (function noise(){ if(!on) return; const im = g.createImageData(320, 180); for(let i = 0; i < im.data.length; i += 4){ const v = Math.random() * 255; im.data[i] = v * .6; im.data[i + 1] = v; im.data[i + 2] = v * .9; im.data[i + 3] = Math.random() < .5 ? 90 : 0; } g.putImageData(im, 0, 0); requestAnimationFrame(noise); })();
      if(window.PNSound){ PNSound.play("radio"); setTimeout(() => PNSound.play("glitch"), 400); setTimeout(() => PNSound.play("radio"), 900); }
      setTimeout(() => { o.classList.remove("static"); on = false; cv.remove(); }, 1500);
    }
    document.body.appendChild(o); document.body.classList.add("pnts-on");
    if(window.PNSound) PNSound.play(introPlayed ? "zoom" : "glitch");
    if(window.PNHandler && INTRO[t.id] && !introPlayed) PNHandler.say(INTRO[t.id]);
    PN.log("twist-start", { id: t.id, point });
    return new Promise(resolve => {
      setTimeout(() => {
        const f = document.createElement("iframe");
        // Round 12: the teacher can switch missions to the prototype versions (Twist Lab / teacher controls)
        const page = (t.proto && (!t.page || qs.get("proto") || (PN.twistProtos && PN.twistProtos()))) ? t.proto : t.page;
        const extra = Object.entries(params || {}).filter(([, v]) => v != null && v !== "").map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("");
        f.src = `${page}?level=${lv}&mission=1${extra}`; f.title = t.name;
        o.appendChild(f);
        f.addEventListener("load", () => { f.classList.add("on"); try{ f.contentWindow.focus(); }catch(e){} });
      }, STATIC ? 2600 : introPlayed ? 300 : 1600);
      const onMsg = e => {
        const d = e.data || {};
        if(d.type === "pn-twist-say"){ if(window.PNHandler) PNHandler.say(d.text); return; }   // the twist's ORACLE lines use the stage's ORACLE
        if(d.type !== "pn-twist-done") return;
        window.removeEventListener("message", onMsg);
        PN.log("twist-end", { id: t.id, point, ok: !!d.ok });
        o.style.transition = "opacity .35s"; o.style.opacity = "0";
        setTimeout(() => { o.remove(); document.body.classList.remove("pnts-on"); resolve({ id: t.id, ok: !!d.ok, effect: d.effect || "" }); }, 380);
      };
      window.addEventListener("message", onMsg);
    });
  }
  window.PNTwistSlot = { run, has, INTRO };
})();
