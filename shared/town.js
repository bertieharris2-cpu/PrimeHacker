/* PRIMENET town: ONE description of the city, shared by the 2D target map (PNTown.svg) and the 3D laser town (PNTown.segments).
   Change a street, the river or a building here and both follow. Map units: the map is 860 x 400, x east, y south;
   heights are in map units too. In 3D, 1 map unit = 0.1 (x → X, height → Y, y → Z, centred on the map). No THREE needed. */
(function(){
  "use strict";
  const W = 860, H = 400, S = 0.1;
  const DISTRICT = { L1: "Old Town", L2: "Harbour", L3: "Financial District" };
  const SECURITY = { L1: "Low", L2: "Medium", L3: "High" };
  const PINS = {   // pin positions as % of the map (the same as briefing.html); each target building stands on its pin
    "Rivercross Utilities": [12, 34], "Northwick Transit": [24, 22], "Sentinel Finance": [16, 62], "Haven Council": [30, 50],
    "Ember Freight": [44, 78], "Crystal Holdings": [55, 64], "Vault Secure": [42, 58], "Pinnacle Corp": [60, 86],
    "Helix Dynamics": [72, 30], "Nexus Global": [86, 22], "Kronos Finance": [80, 50], "Atlas Prime": [92, 42],
  };
  const DISTRICTS = [
    { id: "L1", name: "Old Town", rgb: "47,191,138", c: [.55, 1, .85], poly: [[0,0],[325,0],[325,400],[0,400]], label: [16, 386] },
    { id: "L2", name: "Harbour", rgb: "74,163,255", c: [.6, .85, 1], poly: [[325,180],[590,180],[590,400],[325,400]], label: [340, 386] },
    { id: "L3", name: "Financial District", rgb: "255,201,77", c: [1, .92, .72], poly: [[325,0],[860,0],[860,400],[590,400],[590,180],[325,180]], label: [626, 386] },
  ];
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // same town every time
  const rr = (a, b) => a + rnd() * (b - a);

  // ---------- Geometry helpers ----------
  function inPoly(x, y, poly){ let c = false; for(let i = 0, j = poly.length - 1; i < poly.length; j = i++){ const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  const districtAt = (x, y) => (DISTRICTS.find(d => inPoly(x, y, d.poly)) || DISTRICTS[0]).id;
  function segDist(x, y, a, b){ const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0;
    return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); }
  const lineDist = (pts, x, y) => { let m = 1e9; for(let i = 1; i < pts.length; i++) m = Math.min(m, segDist(x, y, pts[i - 1], pts[i])); return m; };
  function spline(cp, step){   // Catmull-Rom through the control points
    const out = [];
    for(let i = 0; i < cp.length - 1; i++){
      const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for(let k = 0; k < n; k++){ const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); }
    }
    out.push(cp[cp.length - 1].slice()); return out;
  }
  function offset(pts, d){ return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] - dy / l * d, p[1] + dx / l * d]; }); }
  const rectHit = (a, b, m = 0) => a.x0 - m < b.x1 && a.x1 + m > b.x0 && a.y0 - m < b.y1 && a.y1 + m > b.y0;
  const rectOf = (x, y, w, d) => ({ x0: x - w / 2, x1: x + w / 2, y0: y - d / 2, y1: y + d / 2 });

  // ---------- The river: from the north, past Rivercross, round Haven, through the Harbour and out between Harbour and Financial ----------
  const RIVER_HW = 14;
  const riverPts = spline([[170,-12],[158,60],[152,110],[168,165],[205,210],[250,245],[310,268],[380,280],[450,284],[520,292],[565,318],[588,360],[596,412]], 6);
  const river = { pts: riverPts, hw: RIVER_HW, left: offset(riverPts, -RIVER_HW), right: offset(riverPts, RIVER_HW) };
  const riverDist = (x, y) => lineDist(riverPts, x, y);
  const riverY = x => { let best = null, bd = 1e9; riverPts.forEach(p => { const d = Math.abs(p[0] - x); if(d < bd && p[1] > 200 && p[1] < 330){ bd = d; best = p[1]; } }); return best; };   // the harbour stretch

  // ---------- Railway: Northwick station sits on it ----------
  const rail = { pts: spline([[-12,62],[140,62],[330,60],[450,48],[560,40],[872,40]], 8) };
  const railDist = (x, y) => lineDist(rail.pts, x, y);

  // ---------- Parks ----------
  const parks = [
    { name: "Haven Park", x0: 280, y0: 176, x1: 318, y1: 224 },
    { name: "Riverside Green", x0: 100, y0: 305, x1: 155, y1: 350 },
    { name: "Kings Plaza", x0: 720, y0: 241, x1: 760, y1: 294 },
  ];
  parks.forEach(p => { p.trees = []; for(let y = p.y0 + 5; y < p.y1 - 3; y += 9) for(let x = p.x0 + 5 + (y % 2) * 3; x < p.x1 - 3; x += 9) if(rnd() < .7) p.trees.push([x + rr(-1.5, 1.5), y + rr(-1.5, 1.5)]); });

  // ---------- The 12 target buildings, built from simple parts at their pins ----------
  const box = (x, y, w, d, h, o) => ({ t: "box", x, y, w, d, h, y0: 0, roof: "flat", ...o });
  const cyl = (x, y, r, h, o) => ({ t: "cyl", x, y, r, h, y0: 0, ...o });
  const mast = (x, y, h, o) => ({ t: "mast", x, y, h, y0: 0, ...o });
  const TARGET_PARTS = {
    "Rivercross Utilities": { note: "Waterworks on the riverbank, with its own water tower.", parts: [box(103,136,30,22,16), cyl(131,124,6,9,{ y0: 18, legs: true }), cyl(79,129,6,5), cyl(79,144,6,5)] },
    "Northwick Transit": { note: "The main station, right beside the railway lines.", parts: [box(206,88,44,14,13,{ roof: "pitch" }), box(206,72,48,6,6)] },
    "Sentinel Finance": { note: "An old stone bank with columns across the front.", parts: [box(138,247,26,20,18,{ roof: "pitch", axis: "y", rh: 6 }), { t: "cols", x0: 127, x1: 149, y: 259.5, n: 6, h: 15 }] },
    "Haven Council": { note: "The town hall and clock tower, between the river and Haven Park.", parts: [box(258,200,28,22,16), box(258,200,8,8,22,{ y0: 16, roof: "pyramid", rh: 8 })] },
    "Ember Freight": { note: "A big warehouse on the docks, with a crane over the water.", parts: [box(378,312,40,22,14,{ roof: "saw" }), { t: "crane", x: 400, y: 297, h: 34, jib: 22 }] },
    "Crystal Holdings": { note: "A glass block of flats looking over the harbour.", parts: [box(473,256,24,18,40), box(473,256,18,12,8,{ y0: 40 })] },
    "Vault Secure": { note: "A squat, armoured building covered in aerials.", parts: [box(361,232,22,20,16), box(361,232,16,14,3,{ y0: 16 }), mast(367,227,12,{ y0: 19, dish: true })] },
    "Pinnacle Corp": { note: "A tower with a pointed top, right by the water.", parts: [box(516,344,24,24,38,{ roof: "pyramid", rh: 20 })] },
    "Helix Dynamics": { note: "A factory with two tall chimneys.", parts: [box(619,120,36,22,22,{ roof: "saw" }), cyl(606,112,3,40,{ y0: 22 }), cyl(616,112,3,40,{ y0: 22 })] },
    "Nexus Global": { note: "A tower topped by a huge broadband mast.", parts: [box(740,88,20,20,70), box(740,88,12,12,10,{ y0: 70 }), mast(740,88,40,{ y0: 80, dish: true })] },
    "Kronos Finance": { note: "A stepped tower in the middle of the money district.", parts: [box(688,200,22,22,60), box(688,200,16,16,24,{ y0: 60 }), box(688,200,10,10,14,{ y0: 84, roof: "pyramid", rh: 8 })] },
    "Atlas Prime": { note: "The tallest tower in the city. The trail ends at the top.", parts: [box(791,168,26,26,110), box(791,168,20,20,40,{ y0: 110 }), box(791,168,13,13,22,{ y0: 150 }), mast(791,168,40,{ y0: 172 })] },
  };
  function extent(parts){   // footprint rectangle and top height of a set of parts
    const e = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, top: 0 };
    parts.forEach(p => {
      const r = p.t === "box" ? rectOf(p.x, p.y, p.w, p.d) : p.t === "cyl" ? rectOf(p.x, p.y, p.r * 2, p.r * 2) : p.t === "cols" ? { x0: p.x0, x1: p.x1, y0: p.y - 1, y1: p.y + 1 }
        : p.t === "crane" ? { x0: p.x - 2, x1: p.x + 2, y0: p.y - p.jib, y1: p.y + 8 } : rectOf(p.x, p.y, 2, 2);
      e.x0 = Math.min(e.x0, r.x0); e.y0 = Math.min(e.y0, r.y0); e.x1 = Math.max(e.x1, r.x1); e.y1 = Math.max(e.y1, r.y1);
      e.top = Math.max(e.top, (p.y0 || 0) + p.h + (p.roof && p.roof !== "flat" ? (p.rh || 6) : 0));
    });
    return e;
  }
  const targets = {};
  Object.entries(TARGET_PARTS).forEach(([name, t]) => {
    const [px, py] = PINS[name], level = districtAt(px * W / 100, py * H / 100);
    targets[name] = { name, level, x: px * W / 100, y: py * H / 100, note: t.note, parts: t.parts, ext: extent(t.parts) };
  });
  const targetRects = Object.values(targets).map(t => t.ext);

  // ---------- Streets: straight lines, cut by the river (except bridges), parks and the target buildings ----------
  const ST = [   // [x1, y1, x2, y2, main road, bridge]
    [40,0,40,400], [95,170,95,400], [160,180,160,400], [236,0,236,400,1,1], [325,0,325,400,1,1],
    [0,30,325,30], [0,115,325,115,1,1], [0,170,325,170], [0,230,325,230], [0,300,325,300], [0,355,325,355],
    [420,0,420,400], [495,0,495,400,1,1], [545,0,545,400], [590,0,590,400,1,1], [660,0,660,400], [715,0,715,400], [765,0,765,400], [830,0,830,400],
    [325,180,590,180,1], [325,372,590,372], [325,65,860,65], [325,145,860,145], [590,235,860,235], [590,300,860,300], [590,360,860,360],
  ];
  const inRect = (x, y, r, m) => x > r.x0 - m && x < r.x1 + m && y > r.y0 - m && y < r.y1 + m;
  const streets = [];
  ST.forEach(([x1, y1, x2, y2, main, bridge]) => {
    const hw = main ? 4 : 3, len = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(len / 2);
    const bad = (x, y) => (!bridge && riverDist(x, y) < RIVER_HW + hw + 1) || parks.some(p => inRect(x, y, p, -.5)) || targetRects.some(r => inRect(x, y, r, hw + 1));
    let start = null;
    for(let i = 0; i <= n; i++){
      const t = i / n, b = bad(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
      if(!b && start === null) start = t;
      if((b || i === n) && start !== null){
        const e = b ? (i - 1) / n : t;
        if((e - start) * len >= 8){
          const s = { x1: x1 + (x2 - x1) * start, y1: y1 + (y2 - y1) * start, x2: x1 + (x2 - x1) * e, y2: y1 + (y2 - y1) * e, hw, main: !!main, span: null };
          if(bridge){ let a = null, z = null; for(let j = 0; j <= 100; j++){ const u = start + (e - start) * j / 100, x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u; if(riverDist(x, y) < RIVER_HW + 3){ if(a === null) a = [x, y]; z = [x, y]; } } if(a) s.span = [a, z]; }
          streets.push(s);
        }
        start = null;
      }
    }
  });
  const streetRect = s => ({ x0: Math.min(s.x1, s.x2) - s.hw, x1: Math.max(s.x1, s.x2) + s.hw, y0: Math.min(s.y1, s.y2) - s.hw, y1: Math.max(s.y1, s.y2) + s.hw });

  // ---------- Docks: piers into the Harbour stretch of the river ----------
  const docks = [];
  for(let x = 340; x <= 535; x += 22){
    const ry = riverY(x); if(ry === null) continue;
    if(streets.some(s => s.span && Math.abs(s.x1 - x) < 10)) continue;
    docks.push({ x0: x - 3, x1: x + 3, y0: ry + RIVER_HW - 11, y1: ry + RIVER_HW + 2 });   // south bank
    if(x % 44 === 32) docks.push({ x0: x - 3, x1: x + 3, y0: ry - RIVER_HW - 2, y1: ry - RIVER_HW + 9 });   // some on the north bank
  }

  // ---------- Everyday buildings: low blocks in Old Town, sheds in the Harbour, towers in the Financial District ----------
  const LOTS = { L1: { p: 11, w: [9, 16], d: [9, 15] }, L2: { p: 14, w: [17, 26], d: [11, 15] }, L3: { p: 12, w: [10, 16], d: [10, 16] } };
  const buildings = [], taken = [];
  DISTRICTS.forEach(dist => {
    const L = LOTS[dist.id];
    for(let y = L.p / 2; y < H; y += L.p) for(let x = L.p / 2; x < W; x += L.p){   // try a lot at every grid point; keep it if it fits
      if(districtAt(x, y) !== dist.id) continue;
      let w = rr(...L.w), d = rr(...L.d); if(dist.id === "L2" && rnd() < .3) [w, d] = [d, w];
      const cx = x + rr(-1.5, 1.5), cy = y + rr(-1.5, 1.5), r = rectOf(cx, cy, w, d);
      if(r.x0 < 4 || r.x1 > W - 4 || r.y0 < 4 || r.y1 > H - 26) continue;   // the bottom strip keeps the district names clear
      if([[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1]].some(([a, b]) => districtAt(a, b) !== dist.id)) continue;
      if(taken.some(t => rectHit(r, t, dist.id === "L1" ? 3 : 4)) || streets.some(s => rectHit(r, streetRect(s), 2)) || parks.some(p => rectHit(r, p, 3)) || targetRects.some(t => rectHit(r, t, 5)) || docks.some(k => rectHit(r, k, 4))) continue;
      const probe = [[cx, cy], [r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1], [cx, r.y0], [cx, r.y1], [r.x0, cy], [r.x1, cy]];
      if(probe.some(([a, b]) => riverDist(a, b) < RIVER_HW + (dist.id === "L2" ? 6 : 3) || railDist(a, b) < 9)) continue;
      if(rnd() < .1){ taken.push(r); continue; }   // an empty lot or car park
      taken.push(r);
      let parts;
      if(dist.id === "L1") parts = [box(cx, cy, w, d, rr(8, 16), { roof: rnd() < .4 ? "pitch" : "flat", rh: 5 })];
      else if(dist.id === "L2") parts = [box(cx, cy, w, d, rr(9, 14), { roof: rnd() < .55 ? "saw" : "pitch", rh: 4 })];
      else {
        const k = cx < 590 ? .7 : 1, h = (28 + rnd() * rnd() * 50) * k; parts = [box(cx, cy, w, d, h)];
        if(rnd() < .35) parts.push(box(cx, cy, w * .7, d * .7, h * .25, { y0: h }));
        else if(rnd() < .2) parts.push(mast(cx, cy, 12, { y0: h }));
      }
      buildings.push({ district: dist.id, x: cx, y: cy, parts, ext: extent(parts) });
    }
  });

  // ---------- 2D: the SVG map (viewBox 0 0 860 400) ----------
  const f1 = v => (Math.round(v * 10) / 10);
  const P = pts => pts.map((p, i) => (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1])).join("");
  function partSvg(p, stroke, fill, dist){
    const top = (p.y0 || 0) + p.h, sh = Math.min(18, top * .12), sy = Math.min(14, top * .09);
    if(p.t === "box"){
      const r = rectOf(p.x, p.y, p.w, p.d); let g = "";
      if(!p.y0) g += `<path d="M${f1(r.x0)} ${f1(r.y0)}H${f1(r.x1)}l${f1(sh)} ${f1(sy)}V${f1(r.y1 + sy)}H${f1(r.x0 + sh)}Z" fill="rgba(0,0,0,.35)"/>`;   // a shadow: taller throws longer
      g += `<rect x="${f1(r.x0)}" y="${f1(r.y0)}" width="${f1(p.w)}" height="${f1(p.d)}" fill="${fill(top)}" stroke="${stroke}"/>`;
      if(p.roof === "pitch"){ const ax = p.axis || (p.w >= p.d ? "x" : "y"); g += ax === "x" ? `<path d="M${f1(r.x0)} ${f1(p.y)}H${f1(r.x1)}" stroke="${stroke}"/>` : `<path d="M${f1(p.x)} ${f1(r.y0)}V${f1(r.y1)}" stroke="${stroke}"/>`; }
      if(p.roof === "saw"){ const n = Math.max(2, Math.round(p.w / 10)); for(let i = 1; i < n; i++) g += `<path d="M${f1(r.x0 + p.w * i / n)} ${f1(r.y0)}V${f1(r.y1)}" stroke="${stroke}" opacity=".7"/>`; }
      if(p.roof === "pyramid") g += `<path d="M${f1(r.x0)} ${f1(r.y0)}L${f1(r.x1)} ${f1(r.y1)}M${f1(r.x1)} ${f1(r.y0)}L${f1(r.x0)} ${f1(r.y1)}" stroke="${stroke}" opacity=".8"/>`;
      if(dist === "L3" && !p.y0 && top > 30) for(let k = r.y0 + 3; k < r.y1 - 2; k += 4) g += `<path d="M${f1(r.x0 + 2)} ${f1(k)}H${f1(r.x1 - 2)}" stroke="rgba(255,214,120,.16)"/>`;   // lit windows
      return g;
    }
    if(p.t === "cyl") return `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${fill(top)}" stroke="${stroke}"/>`;
    if(p.t === "mast") return `<circle cx="${p.x}" cy="${p.y}" r="1.8" fill="none" stroke="${stroke}"/><path d="M${p.x - 3} ${p.y}h6M${p.x} ${p.y - 3}v6" stroke="${stroke}"/>`;
    if(p.t === "cols"){ let g = ""; for(let i = 0; i < p.n; i++) g += `<circle cx="${f1(p.x0 + (p.x1 - p.x0) * i / (p.n - 1))}" cy="${p.y}" r="1.3" fill="${stroke}"/>`; return g; }
    if(p.t === "crane") return `<rect x="${p.x - 2}" y="${p.y - 2}" width="4" height="4" fill="none" stroke="${stroke}"/><path d="M${p.x} ${p.y + 8}V${p.y - p.jib}" stroke="${stroke}" stroke-width="1.5"/>`;
    return "";
  }
  function svg(){
    let g = `<defs><pattern id="pnt-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(47,191,138,.07)"/></pattern></defs>
      <rect width="${W}" height="${H}" fill="#051215"/><rect width="${W}" height="${H}" fill="url(#pnt-grid)"/>`;
    DISTRICTS.forEach(d => { g += `<path d="${P(d.poly)}Z" fill="rgba(${d.rgb},.04)"/>`; });
    g += `<path d="M325 0V400M325 180H590V400" fill="none" stroke="rgba(255,255,255,.07)" stroke-dasharray="4 6"/>`;   // district borders
    streets.forEach(s => { g += `<path d="M${f1(s.x1)} ${f1(s.y1)}L${f1(s.x2)} ${f1(s.y2)}" stroke="rgba(120,200,210,${s.main ? .16 : .1})" stroke-width="${s.hw * 2}"/>`; });
    g += `<path d="${P(river.pts)}" fill="none" stroke="#0c3550" stroke-width="${RIVER_HW * 2}" stroke-linejoin="round"/>
      <path d="${P(river.left)}M${P(river.right).slice(1)}" fill="none" stroke="rgba(74,163,255,.35)"/>
      <path d="${P(river.pts)}" fill="none" stroke="#12496b" stroke-width="3" stroke-dasharray="10 12"/>`;
    streets.filter(s => s.span).forEach(s => { const [a, b] = s.span, v = s.x1 === s.x2;   // bridges: the road over the water, with railings
      g += `<path d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}" stroke="rgba(150,215,225,.28)" stroke-width="${s.hw * 2}"/>`;
      [-1, 1].forEach(e => { g += `<path d="M${f1(a[0] + (v ? e * s.hw : 0))} ${f1(a[1] + (v ? 0 : e * s.hw))}L${f1(b[0] + (v ? e * s.hw : 0))} ${f1(b[1] + (v ? 0 : e * s.hw))}" stroke="rgba(190,240,250,.55)"/>`; }); });
    docks.forEach(k => { g += `<rect x="${f1(k.x0)}" y="${f1(k.y0)}" width="${f1(k.x1 - k.x0)}" height="${f1(k.y1 - k.y0)}" fill="#0d2a30" stroke="rgba(74,163,255,.45)"/>`; });
    g += `<path d="${P(offset(rail.pts, -2.5))}M${P(offset(rail.pts, 2.5)).slice(1)}" fill="none" stroke="rgba(255,214,120,.38)"/>
      <path d="${P(rail.pts)}" fill="none" stroke="rgba(255,214,120,.22)" stroke-width="9" stroke-dasharray="1.5 5"/>`;
    parks.forEach(p => { g += `<rect x="${p.x0}" y="${p.y0}" width="${p.x1 - p.x0}" height="${p.y1 - p.y0}" fill="rgba(47,191,138,.13)" stroke="rgba(47,191,138,.4)"/>`;
      p.trees.forEach(([x, y]) => { g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="rgba(47,191,138,.35)"/>`; }); });
    const DC = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));
    buildings.forEach(b => { const st = `rgba(${DC[b.district].rgb},.24)`, fill = h => `rgba(${13 + Math.min(20, h / 5)},${42 + Math.min(24, h / 4)},${48 + Math.min(24, h / 4)},.92)`;
      b.parts.forEach(p => { g += partSvg(p, st, fill, b.district); }); });
    Object.values(targets).forEach(t => { const fill = () => "rgba(22,70,74,.96)";
      g += `<g class="pnt-target" data-name="${t.name}">` + t.parts.map(p => partSvg(p, `rgba(${DC[t.level].rgb},.9)`, fill, t.level)).join("") + `</g>`; });
    return g;
  }
  const labels = () => DISTRICTS.map(d => ({ x: d.label[0], y: d.label[1], text: `${d.name.toUpperCase()} · ${d.id}`, rgb: d.rgb }));
  const labelsSvg = () => labels().map(l => `<text class="pnt-label" x="${l.x}" y="${l.y}" fill="rgba(${l.rgb},.6)" font-size="13" letter-spacing="3" font-family="Chakra Petch, sans-serif">${l.text}</text>`).join("");

  // ---------- 3D: every line of the town as {a, b, kind, grp, c, k, bid, tgt}. kind 0 = on the ground, 1 = building ----------
  const X = v => (v - W / 2) * S, Z = v => (v - H / 2) * S, Y = v => v * S;
  const toWorld = (x, y, h = 0) => [X(x), Y(h), Z(y)];
  function partSegs(p, push){
    const L = (a, b) => push(toWorld(a[0], a[2], a[1]), toWorld(b[0], b[2], b[1]));   // points given as [x, height, y]
    const y0 = p.y0 || 0, y1 = y0 + p.h;
    if(p.t === "box"){
      const r = rectOf(p.x, p.y, p.w, p.d), cs = [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]], rh = p.rh || 6;
      const ring = h => cs.forEach((c, i) => { const q = cs[(i + 1) % 4]; L([c[0], h, c[1]], [q[0], h, q[1]]); });
      ring(y0); cs.forEach(c => L([c[0], y0, c[1]], [c[0], y1, c[1]])); ring(y1);
      if(p.roof === "pitch"){
        if((p.axis || (p.w >= p.d ? "x" : "y")) === "x"){ L([r.x0, y1 + rh, p.y], [r.x1, y1 + rh, p.y]); [r.x0, r.x1].forEach(x => { L([x, y1, r.y0], [x, y1 + rh, p.y]); L([x, y1 + rh, p.y], [x, y1, r.y1]); }); }
        else { L([p.x, y1 + rh, r.y0], [p.x, y1 + rh, r.y1]); [r.y0, r.y1].forEach(y => { L([r.x0, y1, y], [p.x, y1 + rh, y]); L([p.x, y1 + rh, y], [r.x1, y1, y]); }); }
      }
      if(p.roof === "saw"){ const n = Math.max(2, Math.round(p.w / 10)), st = p.w / n;
        for(let i = 0; i < n; i++){ const xa = r.x0 + st * i, xb = xa + st;
          [r.y0, r.y1].forEach(y => { L([xa, y1, y], [xb, y1 + rh, y]); L([xb, y1 + rh, y], [xb, y1, y]); }); L([xb, y1 + rh, r.y0], [xb, y1 + rh, r.y1]); } }
      if(p.roof === "pyramid") cs.forEach(c => L([c[0], y1, c[1]], [p.x, y1 + rh, p.y]));
    }
    if(p.t === "cyl"){
      const ring = h => { for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2; L([p.x + Math.cos(a) * p.r, h, p.y + Math.sin(a) * p.r], [p.x + Math.cos(b) * p.r, h, p.y + Math.sin(b) * p.r]); } };
      ring(y0); ring(y1); for(let i = 0; i < 4; i++){ const a = i / 4 * Math.PI * 2 + .4; L([p.x + Math.cos(a) * p.r, y0, p.y + Math.sin(a) * p.r], [p.x + Math.cos(a) * p.r, y1, p.y + Math.sin(a) * p.r]); }
      if(p.legs) [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([u, v]) => L([p.x + u * p.r * .8, 0, p.y + v * p.r * .8], [p.x + u * p.r * .6, y0, p.y + v * p.r * .6]));
    }
    if(p.t === "mast"){ L([p.x, y0, p.y], [p.x, y1, p.y]); L([p.x - 2.5, y0 + p.h * .7, p.y], [p.x + 2.5, y0 + p.h * .7, p.y]);
      if(p.dish){ L([p.x, y0 + p.h * .5, p.y], [p.x - 3, y0 + p.h * .5 + 3, p.y + 2]); L([p.x - 4.5, y0 + p.h * .5 + 1, p.y + 2], [p.x - 1.5, y0 + p.h * .5 + 5, p.y + 2]); } }
    if(p.t === "cols"){ for(let i = 0; i < p.n; i++){ const x = p.x0 + (p.x1 - p.x0) * i / (p.n - 1); L([x, 0, p.y], [x, p.h, p.y]); } L([p.x0, p.h, p.y], [p.x1, p.h, p.y]); }
    if(p.t === "crane"){ const h = p.h, cs = [[-1.5,-1.5],[1.5,-1.5],[1.5,1.5],[-1.5,1.5]];
      cs.forEach(([u, v], i) => { const [u2, v2] = cs[(i + 1) % 4]; L([p.x + u, 0, p.y + v], [p.x + u, h, p.y + v]); L([p.x + u, h, p.y + v], [p.x + u2, h, p.y + v2]); });
      L([p.x, h, p.y + 8], [p.x, h, p.y - p.jib]); L([p.x, h + 7, p.y], [p.x, h, p.y - p.jib]); L([p.x, h + 7, p.y], [p.x, h, p.y + 8]); L([p.x, h, p.y - p.jib + 2], [p.x, h * .45, p.y - p.jib + 2]); }
  }
  function segments(){
    const out = [], DC = Object.fromEntries(DISTRICTS.map(d => [d.id, d.c]));
    const add = (a, b, o) => out.push({ a, b, ...o });
    const line = (pts, o) => { for(let i = 1; i < pts.length; i++) add(toWorld(...pts[i - 1]), toWorld(...pts[i]), o); };
    streets.forEach(s => { const v = s.x1 === s.x2, o = { kind: 0, grp: "street", c: [.75, .95, 1], k: s.main ? .6 : .45 };
      [-1, 1].forEach(e => line([[s.x1 + (v ? e * s.hw : 0), s.y1 + (v ? 0 : e * s.hw)], [s.x2 + (v ? e * s.hw : 0), s.y2 + (v ? 0 : e * s.hw)]], o));
      if(s.span){ const [a, b] = s.span; [-1, 1].forEach(e => { const dx = v ? e * s.hw : 0, dy = v ? 0 : e * s.hw;   // bridge railings, raised a little
        add(toWorld(a[0] + dx, a[1] + dy, 3), toWorld(b[0] + dx, b[1] + dy, 3), { kind: 0, grp: "bridge", c: [.85, .97, 1], k: .8 }); }); } });
    const ro = { kind: 0, grp: "river", c: [.35, .7, 1], k: .9 };
    line(river.left, ro); line(river.right, ro);
    const rl = { kind: 0, grp: "rail", c: [1, .85, .5], k: .55 };
    line(offset(rail.pts, -2.5), rl); line(offset(rail.pts, 2.5), rl);
    offset(rail.pts, -4.5).forEach((p, i) => { if(i % 2) return; const q = offset(rail.pts, 4.5)[i]; add(toWorld(p[0], p[1]), toWorld(q[0], q[1]), { ...rl, k: .3 }); });
    parks.forEach(p => { const po = { kind: 0, grp: "park", c: [.35, 1, .6], k: .7 };
      line([[p.x0, p.y0], [p.x1, p.y0], [p.x1, p.y1], [p.x0, p.y1], [p.x0, p.y0]], po);
      p.trees.forEach(([x, y]) => { add(toWorld(x, y), toWorld(x, y, 4), { ...po, k: .5 }); add(toWorld(x - 2, y, 4), toWorld(x + 2, y, 4), po); add(toWorld(x, y - 2, 4), toWorld(x, y + 2, 4), po); }); });
    docks.forEach(k => line([[k.x0, k.y0], [k.x1, k.y0], [k.x1, k.y1], [k.x0, k.y1], [k.x0, k.y0]], { kind: 0, grp: "dock", c: [.6, .85, 1], k: .7 }));
    buildings.forEach((b, i) => b.parts.forEach(p => partSegs(p, (a, c) => add(a, c, { kind: 1, grp: "building", c: DC[b.district], k: .85, bid: i, cx: b.x, cy: b.y }))));
    Object.values(targets).forEach(t => t.parts.forEach(p => partSegs(p, (a, c) => add(a, c, { kind: 1, grp: "target", c: DC[t.level], k: .85, tgt: t.name, cx: t.x, cy: t.y }))));
    return out;
  }

  window.PNTown = { W, H, S, DISTRICT, SECURITY, PINS, DISTRICTS, targets, buildings, streets, river, rail, parks, docks,
    districtAt, toWorld, svg, labels, labelsSvg, segments };
})();
