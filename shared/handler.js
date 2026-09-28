/* ORACLE, the student's handler. Short comms messages at key moments, typed out with a
   radio crackle. Games call PNHandler.say("…") or PNHandler.once("key", "…").
   {agent} and {target} in a message become the codename and this mission's bank.
   Messages never block the game: they sit in the corner and fade after a few seconds. */
(function(){
  "use strict";
  const PN = window.Primenet;
  const SND = (n, a) => { if(window.PNSound) PNSound.play(n, a); };

  const css = `
  .pnh{ position:fixed; right:18px; bottom:86px; z-index:9000; width:min(380px, calc(100vw - 36px));
        font-family:var(--font-mono, "Courier Prime", monospace); pointer-events:none; }
  .pnh-box{ display:flex; gap:12px; align-items:flex-start; background:rgba(4,14,17,.94);
        border:1px solid rgba(47,191,138,.55); border-left:3px solid #2fbf8a; padding:12px 14px;
        box-shadow:0 12px 40px rgba(0,0,0,.6), 0 0 24px rgba(47,191,138,.12);
        transform:translateX(24px); opacity:0; transition:transform .25s ease, opacity .25s ease; cursor:pointer; }
  .pnh-box.on{ transform:none; opacity:1; pointer-events:auto; }   /* a faded-out box mustn't block the buttons under it */
  .pnh-wave{ flex:0 0 38px; height:38px; display:flex; gap:3px; align-items:center; justify-content:center;
        border:1px solid rgba(47,191,138,.45); background:rgba(47,191,138,.06); }
  .pnh-wave i{ display:block; width:3px; height:6px; background:#2fbf8a; }
  .pnh-box.talking .pnh-wave i{ animation:pnhBar .5s ease-in-out infinite alternate; }
  .pnh-wave i:nth-child(2){ animation-delay:-.15s !important; } .pnh-wave i:nth-child(3){ animation-delay:-.32s !important; }
  .pnh-wave i:nth-child(4){ animation-delay:-.08s !important; } .pnh-wave i:nth-child(5){ animation-delay:-.4s !important; }
  @keyframes pnhBar{ from{ height:4px; } to{ height:26px; } }
  .pnh-who{ font-family:var(--font-ui, sans-serif); font-weight:700; font-size:11px; letter-spacing:.2em; color:#2fbf8a; margin-bottom:4px; }
  .pnh-who span{ color:rgba(235,255,248,.45); font-weight:600; letter-spacing:.12em; }
  .pnh-text{ color:rgba(235,255,248,.94); font-size:16px; line-height:1.45; min-height:1.45em; }
  .pnh-text b{ color:#ffe14d; font-weight:700; }`;

  let wrap = null, queue = [], busy = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function build(){
    if(wrap) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    wrap = document.createElement("div"); wrap.className = "pnh"; wrap.setAttribute("role", "status"); wrap.setAttribute("aria-live", "polite");
    document.body.appendChild(wrap);
  }

  function fill(text){
    const m = PN && PN.mission ? PN.mission() : { codename:"AGENT", target:"the bank" };
    const poss = n => /s$/i.test(n) ? `${n}'` : `${n}'s`;   // "Rivercross Utilities'", "Atlas Prime's"
    return String(text).replace(/\{target\}'s/g, poss(m.target)).replace(/\{agent\}/g, m.codename).replace(/\{target\}/g, m.target)
      .replace(/(\w+s)'s\b/g, "$1'");
  }

  async function show(text){
    build();
    const box = document.createElement("div"); box.className = "pnh-box talking";
    box.innerHTML = `<div class="pnh-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div><div class="pnh-who">ORACLE <span>// HANDLER</span></div><div class="pnh-text"></div></div>`;
    wrap.innerHTML = ""; wrap.appendChild(box);
    let skip = false, closed = false;
    const close = () => { closed = true; box.classList.remove("on"); };
    box.addEventListener("click", () => { if(!skip) skip = true; else close(); });
    requestAnimationFrame(() => box.classList.add("on"));
    SND("comms");
    if(window.PNVoice) PNVoice.speak(text);   // read aloud, when the pupil has it on
    await sleep(260);
    // Type it out. Words in *stars* are highlighted.
    const el = box.querySelector(".pnh-text");
    const parts = text.split(/(\*[^*]+\*)/);
    let html = "";
    for(const part of parts){
      const bold = /^\*.*\*$/.test(part);
      const t = bold ? part.slice(1, -1) : part;
      for(let i = 0; i < t.length; i++){
        if(skip) break;
        el.innerHTML = html + (bold ? `<b>${esc(t.slice(0, i + 1))}</b>` : esc(t.slice(0, i + 1)));
        if(t[i] !== " " && i % 2 === 0) SND("chatter");
        await sleep(22);
      }
      html += bold ? `<b>${esc(t)}</b>` : esc(t);
      el.innerHTML = html;
    }
    box.classList.remove("talking");
    skip = true;
    const hold = Math.min(9000, 2600 + text.length * 45);
    const from = Date.now();
    // Stay up for a read, but move on sooner when another message is waiting
    while(!closed && Date.now() - from < hold && !(queue.length && Date.now() - from > 1800)) await sleep(100);
    box.classList.remove("on");
    await sleep(260);
  }
  const esc = s => s.replace(/[&<>]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" })[c]);

  async function pump(){
    if(busy) return; busy = true;
    while(queue.length){ await show(queue.shift()); }
    busy = false;
  }

  // Remember which one-off messages this mission has already heard, so a reload doesn't repeat them
  function onceKey(key){
    const a = PN && PN.getAgent ? PN.getAgent() : null;
    return "primenet_oracle_" + (a ? a.sessionId : "none") + "_" + key;
  }

  window.PNHandler = {
    say(text, { delay = 0 } = {}){
      const t = fill(text);
      // Only the newest waiting message is kept, so a fast student never gets stale news
      setTimeout(() => { queue = [t]; if(document.body) pump(); else document.addEventListener("DOMContentLoaded", pump); }, delay);
    },
    once(key, text, opts){
      try{ if(sessionStorage.getItem(onceKey(key))) return false; sessionStorage.setItem(onceKey(key), "1"); }catch(e){}
      this.say(text, opts); return true;
    },
    fill,
  };
})();
