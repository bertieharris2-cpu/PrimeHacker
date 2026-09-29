/* PRIMENET floor3d (round 12): one floor of the student's own blueprint in 3D, for the twists.
   The layout comes from localStorage.blueprintLayouts[N] (saved by the Vault Grid), so it is the same floor
   they built. With no saved layout (Twist Lab), a simple one is made from the factor pairs of N.
   Needs ../shared/vendor/three.min.js loaded first.

   const F = PNFloor3D.create(container, { n })   // n optional: the weak floor, else any saved floor, else 24
   F.rooms[i] = { a, b, x, z, w, d, mesh, lights: { draw(k), a, b }, name }
   F.lightsOn(ms), F.dark(ms), F.pulse(fromVec3, toVec3, colour), F.dot(colour) -> { set(x,z), walk(points, ms) },
   F.flyTo({ pos, look }, ms), F.roomCentre(r), F.cellToWorld(gx, gy), F.PLATE, F.H (room height) */
(function(){
  "use strict";
  const PLATE = 130, H = 16;
  const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const speed = () => (window.PNTest ? PNTest.speed() : 1);
  function tween(ms, fn, ease = easeInOut){ return new Promise(res => { const t0 = performance.now(), dur = ms / speed(); (function f(now){ const k = Math.min(1, (now - t0) / dur); fn(ease(k)); if(k < 1) requestAnimationFrame(f); else res(); })(t0); }); }
  function layouts(){ try{ return JSON.parse(localStorage.getItem("blueprintLayouts") || "{}") || {}; }catch(e){ return {}; } }
  function pickN(n){
    if(n) return n;
    const a = window.Primenet && Primenet.getAgent && Primenet.getAgent();
    if(a && a.weakN) return a.weakN;
    const saved = Object.keys(layouts()).map(Number).filter(Boolean);
    return saved.length ? saved[0] : 24;
  }
  // Fallback: shelf-pack the factor-pair rooms onto a grid with corridors
  function fallbackLayout(n){
    const pairs = []; for(let a = 1; a * a <= n; a++) if(n % a === 0) pairs.push([a, n / a]);
    const rooms = [];
    pairs.forEach(([a, b]) => { rooms.push({ w: b, h: a }); if(a !== b) rooms.push({ w: a, h: b }); });
    const grid = Math.max(Math.max(...rooms.map(r => Math.max(r.w, r.h))) + 2, Math.ceil(Math.sqrt(rooms.reduce((s, r) => s + (r.w + 1) * (r.h + 1), 0))) + 2);
    let x = 1, y = 1, rowH = 0; const out = [];
    rooms.sort((p, q) => q.h - p.h).forEach(r => {
      if(x + r.w > grid - 1){ x = 1; y += rowH + 1; rowH = 0; }
      out.push({ x, y, w: r.w, h: r.h, door: { side: "n", at: 0 } }); x += r.w + 1; rowH = Math.max(rowH, r.h);
    });
    return { grid: Math.max(grid, y + rowH + 1), rooms: out, exit: { x: 0, y: 1 } };
  }
  function roomName(a, b){ if(a === b) return "STRONGROOM"; if(a === 1) return "ARCHIVE"; if(b / a >= 4) return "SERVER ROW"; if(b / a >= 2) return "OFFICE"; return "SERVER ROOM"; }

  function create(container, opts = {}){
    const n = pickN(opts.n), L = opts.layout || layouts()[n] || fallbackLayout(n), cell = PLATE / L.grid;   // opts.layout: {grid, rooms, exit} to draw any floor
    const width = container.clientWidth || 800, height = container.clientHeight || 500;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(width, height);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 4000);
    const look = new THREE.Vector3(0, 4, 0);
    camera.position.set(80, 150, 170); camera.lookAt(look);
    scene.add(new THREE.AmbientLight(0xaaffee, 0.5));
    const dl = new THREE.DirectionalLight(0xaaffee, 0.6); dl.position.set(0.5, 1, 0.2); scene.add(dl);
    const root = new THREE.Group(); scene.add(root);
    // Plate and floor grid (the squares the rooms were drawn on)
    const slab = new THREE.Mesh(new THREE.BoxGeometry(PLATE, 1.2, PLATE), new THREE.MeshBasicMaterial({ color: 0x06161a, transparent: true, opacity: 0.85 }));
    slab.position.y = -0.6; root.add(slab);
    const grid = new THREE.GridHelper(PLATE, L.grid, 0x1c5a66, 0x0d3440); grid.position.y = 0.05; root.add(grid);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(PLATE, 0.6, PLATE)), new THREE.LineBasicMaterial({ color: 0x4aa3ff }));
    edge.position.y = 0.3; root.add(edge);
    const cellToWorld = (gx, gy) => new THREE.Vector3((gx + 0.5) * cell - PLATE / 2, 0, (gy + 0.5) * cell - PLATE / 2);
    // Rooms with a × b ceiling lights on top, as in the blueprint
    const rooms = L.rooms.map(r0 => {
      const a = Math.min(r0.w, r0.h), b = Math.max(r0.w, r0.h);
      const r = { a, b, rows: r0.h, cols: r0.w, gx: r0.x, gy: r0.y, gw: r0.w, gh: r0.h, door: r0.door, w: r0.w * cell - cell * 0.25, d: r0.h * cell - cell * 0.25, x: (r0.x + r0.w / 2) * cell - PLATE / 2, z: (r0.y + r0.h / 2) * cell - PLATE / 2, name: r0.name || roomName(a, b) };   // the grid page saves each room's name
      const strong = a === b;
      const geom = new THREE.BoxGeometry(r.w, H, r.d);
      const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x00ff99, emissive: 0x00ff99, emissiveIntensity: 0.25, transparent: true, opacity: strong ? 0.24 : 0.16 }));
      const lineMat = new THREE.LineBasicMaterial({ color: strong ? 0xffc94d : 0x00ffcc, transparent: true });
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom), lineMat));
      mesh.position.set(r.x, H / 2, r.z); root.add(mesh);
      // ceiling lights
      const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d"), tex = new THREE.CanvasTexture(cv);
      const R = r.rows, Cn = r.cols, order = [...Array(R * Cn).keys()].sort(() => Math.random() - .5), rank = []; order.forEach((c, i) => rank[c] = i);
      let lit = 0, tint = "rgba(255,222,140,0.9)";
      function draw(k, colour){
        lit = k; if(colour) tint = colour;
        g.clearRect(0, 0, 256, 256);
        const cw = 256 / Cn, ch = 256 / R, gx = Math.max(2, cw * .38), gy = Math.max(2, ch * .38);
        for(let row = 0; row < R; row++) for(let col = 0; col < Cn; col++){ g.fillStyle = rank[row * Cn + col] < k ? tint : "rgba(0,60,60,0.25)"; g.fillRect(col * cw + gx / 2, row * ch + gy / 2, cw - gx, ch - gy); }
        tex.needsUpdate = true;
      }
      draw(0);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(r.w * 0.92, r.d * 0.92), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      plane.rotation.x = -Math.PI / 2; plane.position.y = H / 2 + 0.2; mesh.add(plane);
      r.mesh = mesh; r.lineMat = lineMat; r.lights = { a, b, draw, get lit(){ return lit; } };
      return r;
    });
    // Grey blocks (lift, stairs) that rooms can't use
    (opts.blocks || []).forEach(b => { const m = new THREE.Mesh(new THREE.BoxGeometry(b.w * cell - 1, H * 1.3, b.h * cell - 1), new THREE.MeshBasicMaterial({ color: 0x3a4a4e, transparent: true, opacity: 0.8 })); m.position.set((b.x + b.w / 2) * cell - PLATE / 2, H * 0.65, (b.y + b.h / 2) * cell - PLATE / 2); root.add(m); });
    // Rooms can start flat (opts.flat) and rise with F.rise()
    if(opts.flat) rooms.forEach(r => { r.mesh.scale.y = 0.02; r.mesh.position.y = 0.2; });
    // Fire exit
    if(L.exit){ const ex = cellToWorld(L.exit.x, L.exit.y); const m = new THREE.Mesh(new THREE.BoxGeometry(cell * 0.9, 1, cell * 0.9), new THREE.MeshBasicMaterial({ color: 0x2fbf8a })); m.position.set(ex.x, 0.6, ex.z); root.add(m); }

    // Render loop
    let alive = true, spin = opts.spin ? 0.0015 : 0;
    const tickers = new Set();
    (function loop(now){ if(!alive) return; root.rotation.y += spin; tickers.forEach(f => f(now)); camera.lookAt(look); renderer.render(scene, camera); requestAnimationFrame(loop); })(performance.now());
    new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if(!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }).observe(container);

    const api = {
      n, layout: L, cell, PLATE, H, THREE, scene, camera, root, rooms, look, tween,
      cellToWorld,
      roomCentre: r => new THREE.Vector3(r.x, H + 0.5, r.z),
      setSpin(v){ spin = v; },
      onTick(f){ tickers.add(f); return () => tickers.delete(f); },
      flyTo({ pos, look: lk }, ms = 1200){ const p0 = camera.position.clone(), l0 = look.clone(); return tween(ms, e => { camera.position.lerpVectors(p0, pos, e); look.lerpVectors(l0, lk, e); }); },
      lightsOn(ms = 900, colour){ return tween(ms, e => rooms.forEach(r => r.lights.draw(Math.round(e * r.a * r.b), colour)), t => t); },
      // Everything goes dark: lights off, room edges dim
      async dark(ms = 700){
        await tween(ms, e => rooms.forEach(r => { r.lights.draw(Math.round((1 - e) * r.a * r.b)); r.lineMat.opacity = 1 - e * 0.8; r.mesh.material.opacity = 0.16 * (1 - e * 0.7); }));
        grid.material.opacity = 0.3; grid.material.transparent = true;
      },
      // Electricity: a bright bead with a trail running from one point to another along the ceiling
      pulse(from, to, colour = 0xffe14d, ms = 700){
        const geo = new THREE.SphereGeometry(1.6, 10, 10), bead = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colour }));
        const trailGeo = new THREE.BufferGeometry().setFromPoints([from.clone(), from.clone()]);
        const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.9 }));
        root.add(bead); root.add(trail);
        return tween(ms, e => { const p = from.clone().lerp(to, e); bead.position.copy(p); trailGeo.setFromPoints([from, p]); }, t => t)
          .then(() => { root.remove(bead); setTimeout(() => { trail.material.opacity = 0.35; }, 200); return trail; });
      },
      // A dot (guard, agent) that can be placed or walked along points
      dot(colour = 0xff4f6d, size = 2.4){
        const m = new THREE.Mesh(new THREE.SphereGeometry(size, 14, 14), new THREE.MeshBasicMaterial({ color: colour }));
        const halo = new THREE.Mesh(new THREE.RingGeometry(size * 1.3, size * 1.7, 24), new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
        halo.rotation.x = -Math.PI / 2; m.add(halo); root.add(m);
        return {
          mesh: m,
          set(x, z, y = size){ m.position.set(x, y, z); },
          at(){ return m.position.clone(); },
          walk(points, ms){ const path = new THREE.CurvePath(); for(let i = 1; i < points.length; i++) if(points[i].distanceTo(points[i - 1]) > 0.01) path.add(new THREE.LineCurve3(points[i - 1], points[i])); if(!path.curves.length) return Promise.resolve(); return tween(ms, e => { const p = path.getPointAt(Math.min(0.999, e)); if(p) m.position.set(p.x, size, p.z); }, t => t); },
          remove(){ root.remove(m); },
        };
      },
      // The rooms rise one after another, each with a callback (for a beep)
      async rise(ms = 500, gap = 160, onEach){ for(const r of rooms){ if(onEach) onEach(r); tween(ms, e => { r.mesh.scale.y = Math.max(0.02, e); r.mesh.position.y = H / 2 * Math.max(0.02, e); }); await new Promise(res => setTimeout(res, gap / speed())); } await new Promise(res => setTimeout(res, ms / speed())); },
      // A laser plane sweeping across the floor
      sweep(ms = 1400, colour = 0x6ee7ff){ const m = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, H * 1.6), new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); m.rotation.y = Math.PI / 2; root.add(m); return tween(ms, e => { m.position.set(-PLATE / 2 + e * PLATE, H * 0.8, 0); }, t => t).then(() => root.remove(m)); },
      destroy(){ alive = false; renderer.dispose(); },
    };
    return api;
  }
  window.PNFloor3D = { create, roomName, PLATE };
})();
