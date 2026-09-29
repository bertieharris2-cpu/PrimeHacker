/* ORACLE, the PRIMENET team lead (and FOX and WREN, the agents inside, via radio()). Short comms messages at key moments, typed out with a
   radio crackle. Games call PNHandler.say("…") or PNHandler.once("key", "…").
   {agent} and {target} in a message become the codename and this mission's bank.
   Messages never block the game: they sit in the corner, then tuck away into a small chip above FULL SCREEN.
   Pressing H (or tapping the chip) opens the last message again. */
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
  .pnh-text b{ color:#ffe14d; font-weight:700; }
  /* tucking away: the box shrinks into the chip (just a fade with reduced motion) */
  .pnh-box.tuck{ transform-origin:100% 100%; transition:transform .42s cubic-bezier(.5,0,.75,0), opacity .42s cubic-bezier(.8,0,1,1); }
  /* the chip: the last message, one press of H away. Just above the FULL SCREEN button. */
  .pnh-chip{ all:unset; box-sizing:border-box; position:fixed; right:12px; bottom:52px; z-index:9000; display:flex; align-items:center; gap:8px;
        font-family:var(--font-ui, "Chakra Petch", sans-serif); font-weight:700; font-size:12px; letter-spacing:.18em; color:#2fbf8a;
        background:rgba(4,14,17,.94); border:1px solid rgba(47,191,138,.55); border-left:3px solid #2fbf8a; padding:5px 8px 5px 9px; cursor:pointer;
        box-shadow:0 6px 20px rgba(0,0,0,.5); transition:opacity .2s ease, transform .2s ease; }
  .pnh-chip.none{ display:none; }
  .pnh-chip.hide{ opacity:0; transform:scale(.85); pointer-events:none; }
  .pnh-chip:hover, .pnh-chip:focus-visible{ box-shadow:0 0 14px rgba(47,191,138,.35); outline:none; }
  .pnh-chip:focus-visible{ outline:2px solid #ffe68a; outline-offset:2px; }
  .pnh-chip .ic{ display:flex; gap:2px; align-items:center; height:12px; }
  .pnh-chip .ic i{ display:block; width:2px; background:currentColor; }
  .pnh-chip .ic i:nth-child(1){ height:5px; } .pnh-chip .ic i:nth-child(2){ height:11px; } .pnh-chip .ic i:nth-child(3){ height:7px; }
  .pnh-chip kbd{ font-family:var(--font-ui, sans-serif); font-weight:700; font-size:11px; letter-spacing:0; color:#062027; background:rgba(235,255,248,.88); padding:1px 6px; }
  html.pnm-docked .pnh-chip{ right:calc(var(--pnm-dock-w) + 24px); }   /* beside the docked typing terminal, like the box */
  body.pnts-on .pnh-chip{ display:none; }   /* a twist has its own H (BRIEF) */
  .hudBar ~ .pnh-chip{ bottom:68px; }   /* prime_hack: clear of its bottom HUD bar */
  @media (max-width:900px){ html.pnm-docked .pnh-chip{ display:none; } }
  @media (max-width:700px){ .pnh-chip{ bottom:12px; } }   /* FULL SCREEN moves to the top here */
  @media (prefers-reduced-motion: reduce){ .pnh-chip{ transition:opacity .2s ease; } .pnh-chip.hide{ transform:none; } }`;

  let wrap = null, chip = null, last = null, queue = [], busy = false;
  const calm = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function build(){
    if(wrap) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    wrap = document.createElement("div"); wrap.className = "pnh"; wrap.setAttribute("role", "status"); wrap.setAttribute("aria-live", "polite");
    document.body.appendChild(wrap);
    chip = document.createElement("button"); chip.type = "button"; chip.className = "pnh-chip none hide";
    chip.addEventListener("mousedown", e => e.preventDefault());   // no focus from a click, so Space and Enter stay with the game
    chip.addEventListener("click", e => { e.stopPropagation(); reopen(); });
    document.body.appendChild(chip);
  }
  // The chip shows who spoke last, in their colour
  function setChip(who){
    chip.innerHTML = `<span class="ic" aria-hidden="true"><i></i><i></i><i></i></span>${who[0]} <span aria-hidden="true">▸</span> <kbd>H</kbd>`;
    chip.style.color = chip.style.borderLeftColor = who[2];
    chip.setAttribute("aria-label", `Read ${who[0]}'s last message again (H)`); chip.title = `Read ${who[0]}'s last message again (H)`;
    chip.classList.remove("none");
  }
  // Shrink the box into the chip. With reduced motion, or when the chip can't be seen, it just fades.
  async function tuck(box){
    const shown = chip.offsetWidth > 0 && getComputedStyle(chip).display !== "none";
    if(shown && !calm()){
      const b = box.getBoundingClientRect(), cr = chip.offsetLeft + chip.offsetWidth, cb = chip.offsetTop + chip.offsetHeight;
      const k = Math.max(.08, chip.offsetWidth / b.width);
      box.classList.add("tuck");
      box.style.transform = `translate(${cr - b.right}px, ${cb - b.bottom}px) scale(${k}, ${Math.max(.08, chip.offsetHeight / b.height)})`;
    }
    box.classList.remove("on");
    await sleep(shown && !calm() ? 300 : 200);
    if(shown) chip.classList.remove("hide");
    await sleep(140);
  }

  function fill(text){
    const m = PN && PN.mission ? PN.mission() : { codename:"AGENT", target:"the target" };
    const poss = n => /s$/i.test(n) ? `${n}'` : `${n}'s`;   // "Rivercross Utilities'", "Atlas Prime's"
    return String(text).replace(/\{target\}'s/g, poss(m.target)).replace(/\{(agent|codename)\}/g, m.codename).replace(/\{target\}/g, m.target)
      .replace(/(\w+s)'s\b/g, "$1'");
  }

  const WHO = { ORACLE:["ORACLE","// PRIMENET LEAD","#2fbf8a"], FOX:["FOX","// AGENT INSIDE","#ffb35c"], WREN:["WREN","// AGENT INSIDE","#7fd4ff"] };
  async function show(item){
    build();
    const text = item.text, who = WHO[item.who] || WHO.ORACLE;
    // Teacher: a docked typing terminal has the bottom right, so a new message goes straight to the chip (a tap reads it)
    const docked = () => !item.again && document.documentElement.classList.contains("pnm-docked");
    if(docked()){ last = item; setChip(who); chip.classList.remove("hide"); SND("comms"); if(window.PNVoice) PNVoice.speak(text); return; }
    const box = document.createElement("div"); box.className = "pnh-box talking";
    box.innerHTML = `<div class="pnh-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div><div class="pnh-who" style="color:${who[2]}">${who[0]} <span>${who[1]}</span></div><div class="pnh-text"></div></div>`;
    box.style.borderLeftColor = who[2];
    wrap.innerHTML = ""; wrap.appendChild(box);
    last = item; setChip(who); chip.classList.add("hide");   // the chip hides while the full box is up
    let skip = !!item.again, closed = false;
    const close = () => { closed = true; box.classList.remove("on"); };
    box.addEventListener("click", () => { if(!skip) skip = true; else close(); });
    requestAnimationFrame(() => box.classList.add("on"));
    SND(item.again ? "click" : "comms");
    if(window.PNVoice) PNVoice.speak(text);   // read aloud, when the pupil has it on
    if(!item.again) await sleep(260);   // read again: all there at once, no typing
    // Type it out. Words in *stars* are highlighted.
    const el = box.querySelector(".pnh-text");
    const parts = text.split(/(\*[^*]+\*)/);
    let html = "";
    for(const part of parts){
      const bold = /^\*.*\*$/.test(part);
      const t = bold ? part.slice(1, -1) : part;
      for(let i = 0; i < t.length; i++){
        if(skip || docked()) break;
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
    // Stay up for a read, but move on sooner when another message is waiting (or a typing terminal docks)
    while(!closed && Date.now() - from < hold && !(queue.length && Date.now() - from > 1800) && !docked()) await sleep(100);
    if(queue.length){ box.classList.remove("on"); await sleep(260); }   // straight on to the next message
    else await tuck(box);
  }
  const esc = s => s.replace(/[&<>]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" })[c]);

  async function pump(){
    if(busy) return; busy = true;
    while(queue.length){ await show(queue.shift()); }
    busy = false;
  }

  // H or the chip: the last message again, typed in one go, then it tucks away again
  function reopen(){
    if(!last || busy) return false;
    queue = [{ ...last, again: true }]; pump(); return true;
  }
  // H only when it can't mean anything else: not while typing, not in a typing terminal, not over a twist (its H is BRIEF)
  window.addEventListener("keydown", e => {
    if(e.key !== "h" && e.key !== "H") return;
    if(e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !last || busy) return;
    const t = e.target;
    if(t && t.closest && (t.isContentEditable || t.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])"))) return;
    if(window.PNTwist || document.body.classList.contains("pnts-on")) return;
    if(document.querySelector(".pnm-type, .thinTerm:not(.done), .bp-term.on")) return;
    const inp = document.getElementById("input"); if(inp && inp.disabled) return;   // the roleplay terminal's hacker mode
    e.preventDefault(); reopen();
  });

  // Remember which one-off messages this mission has already heard, so a reload doesn't repeat them
  function onceKey(key){
    const a = PN && PN.getAgent ? PN.getAgent() : null;
    return "primenet_oracle_" + (a ? a.sessionId : "none") + "_" + key;
  }

  window.PNHandler = {
    say(text, { delay = 0, who = "ORACLE" } = {}){
      const t = { text: fill(text), who };
      // Only the newest waiting message is kept, so a fast student never gets stale news
      setTimeout(() => { queue = [t]; if(document.body) pump(); else document.addEventListener("DOMContentLoaded", pump); }, delay);
    },
    once(key, text, opts){
      try{ if(sessionStorage.getItem(onceKey(key))) return false; sessionStorage.setItem(onceKey(key), "1"); }catch(e){}
      this.say(text, opts); return true;
    },
    // FOX or WREN over the radio: a random line from a bank in shared/story.js
    radio(bank, opts = {}){ if(!window.PNStory) return; const r = PNStory.radio(bank); this.say(r.text, { ...opts, who: r.who }); return r; },
    fill,
    reopen,
  };
})();
