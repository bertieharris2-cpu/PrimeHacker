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

  async function go(url){
    try{ sessionStorage.setItem(FLAG, "1"); }catch(e){}
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
    let flagged = false;
    try{ flagged = sessionStorage.getItem(FLAG) === "1"; sessionStorage.removeItem(FLAG); }catch(e){}
    if(!flagged) return;
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
