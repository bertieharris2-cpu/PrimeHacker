/* PRIMENET twist slots (round 11): the rotating twists woven into the bank mission.
   Each stage calls PNTwistSlot.run(point) where its twist would fit. If the mission's plan has a twist
   for that point, it plays in a full-screen frame over the stage ("change of plan"), and the promise
   resolves when the student presses Continue. Otherwise it resolves straight away.
   Testing: ?twist=<id> on a stage's URL forces that twist at its point; ?notwist=1 turns twists off there. */
(function(){
  "use strict";
  const PN = window.Primenet;
  const qs = new URLSearchParams(location.search);
  const INTRO = {
    sieve:      "Change of plan: their motion sensors run on number patterns. Knock out everything that isn't prime.",
    strongroom: "Hold on. This floor has a strongroom with a pressure-plated floor. Map it before we move on.",
    walls:      "Deposit boxes on this floor. Work out which rectangles fit the wall and we'll know where the key is.",
    primefloor: "One of these floors is a fake. Prove which ones are real.",
    cubes:      "Lights are on, and so are their cameras. The ceiling relays power them. Knock them out.",
    patrols:    "Guards on patrol at the entrance. Work out their timings so we slip in between them.",
    factortree: "Crew's at the key room door. It's bolted, and the bolts want prime factors.",
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
  @keyframes pntsIn{ from{ opacity:0; transform:scale(1.15); } }`;
  let styled = false;
  function run(point){
    if(!PN || !PN.twistAt || qs.get("notwist")) return Promise.resolve(null);
    let t = PN.twistAt(point);
    const force = qs.get("twist") && PN.TWISTS.find(x => x.id === qs.get("twist") && x.point === point && (x.page || x.proto));
    if(force) t = force;
    if(!t) return Promise.resolve(null);
    if(!styled){ const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); styled = true; }
    const lv = (PN.getAgent() && PN.getAgent().level) || "L1";
    const o = document.createElement("div"); o.className = "pnts"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", t.name);
    o.innerHTML = `<div class="pnts-card"><b>CHANGE OF PLAN</b><span>${t.name.toUpperCase()}</span></div>`;
    document.body.appendChild(o); document.body.classList.add("pnts-on");
    if(window.PNSound) PNSound.play("glitch");
    if(window.PNHandler && INTRO[t.id]) PNHandler.say(INTRO[t.id]);
    PN.log("twist-start", { id: t.id, point });
    return new Promise(resolve => {
      setTimeout(() => {
        const f = document.createElement("iframe");
        // Round 12: the teacher can switch missions to the prototype versions (Twist Lab / teacher controls)
        const page = (t.proto && (!t.page || qs.get("proto") || (PN.twistProtos && PN.twistProtos()))) ? t.proto : t.page;
        f.src = `${page}?level=${lv}&mission=1`; f.title = t.name;
        o.appendChild(f);
        f.addEventListener("load", () => { f.classList.add("on"); try{ f.contentWindow.focus(); }catch(e){} });
      }, 1600);
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
  window.PNTwistSlot = { run };
})();
