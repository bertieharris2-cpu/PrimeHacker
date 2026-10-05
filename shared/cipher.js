// PRIMENET cipher kit: the pieces of the cipher terminal shared by the code-crack twists (the strongroom, the fuse
// relays). Bertie's favourite effect (a number scrambles through random digits, then lands), the term-equation rules
// with their aligned working, and the rule explorer (n in a box, ▲▼, the working, a table; its values can hit the
// readings, and a request turns the last line of the working into the answer box).
// Needs shared/twist.js (PNTwist) loaded first. Styles: shared/cipher.css.
(function(){
  "use strict";
  const T = () => window.PNTwist;
  const sp = () => (window.PNTest ? PNTest.speed() : 1);
  const RM = () => document.documentElement.classList.contains("pn-reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rndDigits = k => String(Math.floor(Math.random() * Math.pow(10, k))).padStart(k, "0");

  // A number scrambles through random digits, then settles on data-v (or its own text). cls: a flash once it lands.
  function scramble(e, cls){
    return new Promise(r => {
      const node = [...e.childNodes].find(x => x.nodeType === 3), v = String(e.dataset.v != null ? e.dataset.v : e.textContent).trim();
      const land = () => { if(node) node.nodeValue = v; delete e.dataset.busy; if(cls){ e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); } r(); };
      if(e.dataset.busy || !node || RM()){ if(!e.dataset.busy) land(); else r(); return; }
      e.dataset.busy = 1; let k = 0;
      const t = setInterval(() => { if(k++ < 10) node.nodeValue = rndDigits(v.length); else { clearInterval(t); land(); } }, 50 / sp());
    });
  }
  const glitch = e => { e.classList.remove("glitch"); void e.offsetWidth; e.classList.add("glitch"); };

  // A rule as a term equation: { sq } n × n, { cube } n × n × n, { dbl } start then double, or { a, b } an + b.
  // Adds gen (its value for n), eq, code and rows (the working, as aligned grid rows: [=, a, ×, n, op, b];
  // a cell { t, span } spans columns). The answer is always the <b> in the last row.
  const sgn = b => b > 0 ? ` + ${b}` : b < 0 ? ` − ${-b}` : "";
  function rule(r){
    r.gen = r.sq ? (k => k * k) : r.cube ? (k => k * k * k) : r.dbl ? (k => r.dbl * Math.pow(2, k - 1)) : (k => r.a * k + r.b);
    r.eq = r.sq ? "n × n" : r.cube ? "n × n × n" : r.dbl ? `${r.dbl}, then double` : `${r.a}n${sgn(r.b)}`;
    r.code = r.eq;
    const N = n => `<span class="nb">${n}</span>`;
    r.rows = n => r.sq ? [["", N("n"), "×", N("n"), "", ""], ["", N(n), "×", N(n), "", ""], ["=", { t: `<b>${n * n}</b>`, span: 3 }]]
      : r.cube ? [["", N("n"), "×", N("n"), "×", N("n")], ["", N(n), "×", N(n), "×", N(n)], ["=", { t: n * n, span: 3 }, "×", n], ["=", { t: `<b>${n * n * n}</b>`, span: 5 }]]
      : r.dbl ? [["", { t: `${r.dbl} × 2 × 2 × …`, span: 5 }], ["", { t: `${r.dbl}${" × 2".repeat(Math.min(n - 1, 7))}${n > 8 ? " …" : ""}${n > 1 ? ` <small class="dn">(× 2, ${n - 1} time${n > 2 ? "s" : ""})</small>` : ""}`, span: 5 }], ["=", { t: `<b>${r.gen(n)}</b>`, span: 5 }]]
      : r.b ? [["", r.a, "", N("n"), r.b > 0 ? "+" : "−", Math.abs(r.b)], ["", r.a, "×", N(n), r.b > 0 ? "+" : "−", Math.abs(r.b)], ["=", { t: r.a * n, span: 3 }, r.b > 0 ? "+" : "−", Math.abs(r.b)], ["=", { t: `<b>${r.gen(n)}</b>`, span: 5 }]]
      : [["", r.a, "", N("n"), "", ""], ["", r.a, "×", N(n), "", ""], ["=", { t: `<b>${r.gen(n)}</b>`, span: 3 }]];
    return r;
  }

  // The rule explorer (Bertie: a learning tool). The term equation on top, n in a box you change with ▲▼, the
  // working with n put in underneath, and a little table of what the rule makes.
  //   nIs: what n means ("n = the number of wires"); banner: a guidance line on top; match: values to mark in the
  //   table (the glowing readings), with a nudge line; onVal: called with the value at each n (returns a note line:
  //   the readings react to it); steps: false hides ▲▼; max: the biggest n.
  // Returns { set, n, ask, input, banner }. ask({ n, check }): at that n the last line of the working becomes a box to
  // type the answer in (check(input) on Enter); every other n shows ? so the sum has to be done. ask(null) ends it.
  let rxKey = null;
  function explorer(host, rule, { n = 1, onN = null, max = 12, banner = "", match = null, onVal = null, steps = true, nIs = "n = the position: 1st, 2nd, 3rd…" } = {}){
    host.innerHTML = `<div class="rx${steps ? "" : " nostep"}">${banner ? `<div class="rx-ban">${banner}</div>` : ""}
      <div class="rx-eq"><small>RULE</small><span>${rule.words} · ${nIs}</span></div>
      <div class="rx-n"><span>n =</span><span class="nb big"></span><span class="rx-step"><button type="button" class="rx-b" data-d="1" aria-label="n up 1">▲</button><button type="button" class="rx-b" data-d="-1" aria-label="n down 1">▼</button></span><small>▲ ▼ change n</small></div>
      <div class="rx-grid"></div>${onVal ? `<div class="rx-note"></div>` : ""}<div class="rx-tab"></div>${match ? `<div class="rx-nudge">Do these numbers match the <b>glowing readings</b>?</div>` : ""}</div>`;
    let cur = n, ask = null;
    const set = v => {
      cur = Math.max(1, Math.min(max, v));
      host.querySelector(".nb.big").textContent = cur;
      // Bertie: every line the same size, n's box over the number that replaces it
      host.querySelector(".rx-grid").innerHTML = rule.rows(cur).map((row, ri) => `<div class="rr${ri === 0 ? " r0" : ""}">${row.map(c => typeof c === "object" && c !== null ? `<span style="grid-column:span ${c.span}">${c.t}</span>` : `<span>${c}</span>`).join("")}</div>`).join("");
      const from = Math.max(1, Math.min(cur - 3, max - 6)), ks = T().range(from, Math.min(max, from + 6));
      host.querySelector(".rx-tab").innerHTML = `<div><span>n</span>${ks.map(k => `<i class="${k === cur ? "cur" : ""}">${k}</i>`).join("")}</div><div><span>makes</span>${ks.map(k => `<i class="${k === cur ? "cur" : ""}${match && match.includes(rule.gen(k)) ? " glow" : ""}">${rule.gen(k)}</i>`).join("")}</div>`;
      if(ask && cur === ask.n){
        const last = host.querySelector(".rx-grid .rr:last-child b");
        if(last){ const inp = document.createElement("input"); inp.className = "ans"; inp.inputMode = "numeric"; inp.maxLength = 5; inp.setAttribute("aria-label", "Type the answer");
          last.replaceWith(inp); inp.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); if(inp.value.trim()) ask.check(inp); } });
          setTimeout(() => inp.isConnected && inp.focus({ preventScroll: true }), 0); }
      }
      // Bertie: while a request waits, the other n hide their answers, so the sum has to be done
      if(ask && cur !== ask.n){ const last = host.querySelector(".rx-grid .rr:last-child b"); if(last){ last.textContent = "?"; last.className = "hid"; } }
      const ban = host.querySelector(".rx-ban"); if(ban && ask) ban.classList.toggle("wait", cur !== ask.n);
      if(onVal) host.querySelector(".rx-note").innerHTML = onVal(rule.gen(cur)) || "";
      if(onN) onN(cur);
    };
    host.querySelectorAll(".rx-b").forEach(b => b.addEventListener("click", () => { set(cur + +b.dataset.d); T().SND("tick"); }));
    if(rxKey) document.removeEventListener("keydown", rxKey);
    rxKey = e => { if(!host.isConnected){ document.removeEventListener("keydown", rxKey); return; } if(e.target.tagName === "INPUT") return;
      const d = ["ArrowRight", "ArrowUp", "+", "="].includes(e.key) ? 1 : ["ArrowLeft", "ArrowDown", "-"].includes(e.key) ? -1 : 0; if(d){ e.preventDefault(); set(cur + d); T().SND("tick"); } };
    document.addEventListener("keydown", rxKey);
    set(cur);
    return { set, get n(){ return cur; }, ask(a){ ask = a; set(cur); }, input: () => host.querySelector("input.ans"), banner: html => { const b = host.querySelector(".rx-ban"); if(b && html != null) b.innerHTML = html; return b; } };
  }

  window.PNCipher = { scramble, glitch, rule, explorer, rndDigits };
})();
