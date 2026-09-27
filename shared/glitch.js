/* Glitch transitions between stages: a quick screen tear and a burst of static, so moving
   between games feels like jumping between systems. PNGlitch.go(url) plays it and then
   opens the next page, which plays a short glitch as it appears. Reduced motion gets a
   plain fade instead. */
(function(){
  "use strict";
  const FLAG = "primenet_glitch_in";
  const reduced = () => (window.Primenet && Primenet.reducedMotion) ? Primenet.reducedMotion()
    : (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  const css = `
  .png{ position:fixed; inset:0; z-index:100000; pointer-events:none; overflow:hidden; }
  .png canvas{ position:absolute; inset:0; width:100%; height:100%; mix-blend-mode:screen; opacity:.55; }
  .png .slice{ position:absolute; left:0; right:0; background:rgba(47,191,138,.18); border-top:1px solid rgba(255,79,216,.55); border-bottom:1px solid rgba(74,163,255,.55); }
  .png .shade{ position:absolute; inset:0; background:#071418; opacity:0; transition:opacity .16s linear; }
  .png.fade .shade{ transition:opacity .25s linear; }
  html.pn-glitching body > *:not(.png){ animation:pngShift .09s steps(2) infinite; }
  .png .sweep{ position:absolute; left:0; right:0; height:3px; top:-4px; background:#4aa3ff; box-shadow:0 0 18px 6px rgba(74,163,255,.55); }
  .png .grid{ position:absolute; inset:0; opacity:0; background:
    repeating-linear-gradient(0deg, rgba(74,163,255,.14) 0 1px, transparent 1px 32px),
    repeating-linear-gradient(90deg, rgba(74,163,255,.14) 0 1px, transparent 1px 32px), #071418; }
  @keyframes pngShift{ 0%{ transform:translate(0,0); filter:none; } 50%{ transform:translate(-6px,1px); filter:hue-rotate(40deg) saturate(1.6); } 100%{ transform:translate(5px,-1px); } }`;

  function layer(){
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const el = document.createElement("div"); el.className = "png";
    el.innerHTML = `<canvas></canvas><div class="shade"></div>`;
    document.body.appendChild(el);
    return el;
  }

  // Static noise and tearing slices for `ms` milliseconds
  function run(el, ms){
    return new Promise(done => {
      const cv = el.querySelector("canvas"), g = cv.getContext("2d");
      cv.width = 240; cv.height = 150;
      const img = g.createImageData(cv.width, cv.height);
      const start = performance.now();
      (function frame(now){
        const d = img.data;
        for(let i = 0; i < d.length; i += 4){ const v = Math.random() < .5 ? 0 : 255 * Math.random(); d[i] = v * .3; d[i+1] = v; d[i+2] = v * .8; d[i+3] = 255; }
        g.putImageData(img, 0, 0);
        el.querySelectorAll(".slice").forEach(s => s.remove());
        for(let k = 0; k < 5; k++){
          const s = document.createElement("div"); s.className = "slice";
          s.style.top = (Math.random() * 100) + "%"; s.style.height = (2 + Math.random() * 40) + "px";
          s.style.transform = `translateX(${(Math.random() - .5) * 80}px)`;
          el.appendChild(s);
        }
        if(now - start < ms) requestAnimationFrame(frame); else done();
      })(start);
    });
  }

  // "sweep": the calmer blueprint-style wipe used between the build stages (feedback: smoother transitions)
  function sweep(el, down, ms){
    return new Promise(done => {
      const line = document.createElement("div"); line.className = "sweep";
      const grid = document.createElement("div"); grid.className = "grid";
      el.append(grid, line);
      const t0 = performance.now();
      (function f(now){
        const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const y = (down ? e : 1 - e) * 100;
        line.style.top = `calc(${y}% - 2px)`;
        grid.style.clipPath = down ? `inset(0 0 ${100 - y}% 0)` : `inset(0 0 ${100 - y}% 0)`;
        grid.style.opacity = "1";
        if(k < 1) requestAnimationFrame(f); else done();
      })(t0);
    });
  }

  async function go(url, opts){
    const style = opts && opts.style === "sweep" ? "sweep" : "glitch";
    try{ sessionStorage.setItem(FLAG, style === "sweep" ? "sweep" : "1"); }catch(e){}
    if(style === "sweep" && document.body && !reduced()){
      const el = layer(); el.querySelector("canvas").remove();
      if(window.PNSound) PNSound.play("holo");
      await sweep(el, true, 520);
      location.href = url; return;
    }
    if(!document.body){ location.href = url; return; }
    const el = layer(), shade = el.querySelector(".shade");
    if(window.PNSound) PNSound.play("glitch");
    if(reduced()){
      el.classList.add("fade"); el.querySelector("canvas").remove();
      requestAnimationFrame(() => shade.style.opacity = "1");
      setTimeout(() => { location.href = url; }, 280);
      return;
    }
    document.documentElement.classList.add("pn-glitching");
    setTimeout(() => { shade.style.opacity = "1"; }, 230);
    await run(el, 380);
    location.href = url;
  }

  // The page we arrive on glitches in
  function arrive(){
    let flagged = false, kind = "1";
    try{ kind = sessionStorage.getItem(FLAG); flagged = !!kind; sessionStorage.removeItem(FLAG); }catch(e){}
    if(!flagged) return;
    if(kind === "sweep" && !reduced()){
      const el = layer(); el.querySelector("canvas").remove(); el.querySelector(".shade").remove();
      sweep(el, false, 520).then(() => el.remove());
      return;
    }
    const el = layer(), shade = el.querySelector(".shade");
    shade.style.transition = "none"; shade.style.opacity = "1";
    if(reduced()){
      el.querySelector("canvas").remove();
      requestAnimationFrame(() => { shade.style.transition = "opacity .3s linear"; shade.style.opacity = "0"; });
      setTimeout(() => el.remove(), 400);
      return;
    }
    document.documentElement.classList.add("pn-glitching");
    requestAnimationFrame(() => { shade.style.transition = "opacity .2s linear"; shade.style.opacity = "0"; });
    run(el, 260).then(() => { document.documentElement.classList.remove("pn-glitching"); el.remove(); });
  }

  window.PNGlitch = { go };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrive); else arrive();
})();
