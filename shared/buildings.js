/* PRIMENET buildings (Round 22, Bertie: "variety isn't as key"). Each mission menu has its own fixed building: the
   same three floor numbers at every level, and floor plans designed so the story and the twists make sense (guards walk
   the corridors, the blind spot really is out of sight of the fire door, the strongroom is a true square).

   A floor is the same format the Vault Grid saves in localStorage.blueprintLayouts[N]: { grid, rooms, exit }, so the
   blueprint and floor3d.js read it as they read any built floor. The grid is N + 1 squares across; x runs west to east,
   y north to south (the blueprint's camera looks in from the south).
   A room is written [x, y, w, h, name, door]: its top-left square, w squares across and h down, and its door,
   "n3" = in the north wall, 3 squares along (n and s walls count from the west end, w and e walls from the north end).
   A route is a list of corner squares; the guard walks straight from one to the next, round and back to the start.

   PNBuildings.current()      this mission's building (null with no mission menu: practice, Twist Lab, all twists off)
   PNBuildings.nextN()        the next floor number for the Factor Vault, easiest first (null: pick at random as before)
   PNBuildings.layoutFor(n)   the fixed floor plan for N in this mission's building, or null
   PNBuildings.layouts()      the saved floor plans, with this building's in place of any others for the same N
   PNBuildings.install()      saves this building's three floor plans (teacher jumps, demo)
   PNBuildings.reconFor(n)    the guard recon for floor N: { door, blind, behind, routes: [[{x,y}…], [{x,y}…]] }, or null
   PNBuildings.keyRouteFor(n) the walk from the fire door to the security key on floor N (squares), or null */
(function(){
  "use strict";
  const room = ([x, y, w, h, name, door]) => ({ x, y, w, h, name, door: { side: door[0], at: +door.slice(1) } });
  const floor = (n, exit, rooms) => ({ grid: n + 1, exit: { x: exit[0], y: exit[1] }, rooms: rooms.map(room) });

  const BUILDINGS = {
    // 1. The quiet way in: the security key is in the strongroom on floor 2 (36 = 6 × 6). In through floor 2's fire door
    // when both guards are at the blind spot behind the plant room; copy the key, put it back, out the same way.
    quiet: {
      floors: [48, 36, 20], wayIn: 2,
      layouts: {
        48: floor(48, [36, 48], [
          [0, 0, 48, 1, "LOCKERS", "s20"],
          [0, 1, 1, 48, "ARCHIVE", "e30"],
          [3, 3, 24, 2, "TELLERS", "s12"],
          [30, 3, 6, 8, "SECURITY OFFICE", "w4"],
          [39, 3, 8, 6, "RECEPTION", "s4"],
          [3, 8, 16, 3, "WAITING AREA", "s8"],
          [3, 15, 3, 16, "POST ROOM", "e8"],
          [46, 14, 2, 24, "CASH STORE", "w12"],
          [10, 40, 12, 4, "CANTEEN", "n6"],
          [27, 33, 4, 12, "STAFF ROOM", "w6"],
        ]),
        36: floor(36, [27, 36], [
          [0, 0, 36, 1, "ARCHIVE", "s30"],
          [0, 1, 1, 36, "SERVER ROW", "e10"],
          [3, 3, 18, 2, "STAFF OFFICE", "s9"],
          [3, 8, 12, 3, "TRAINING ROOM", "s6"],
          [25, 8, 6, 6, "STRONGROOM", "e3"],
          [35, 2, 2, 18, "SECURITY LOCKERS", "w8"],
          [9, 24, 3, 12, "FILING ROOM", "w6"],
          [18, 21, 4, 9, "IT DESK", "e4"],
          [23, 31, 9, 4, "PLANT ROOM", "e1"],
        ]),
        20: floor(20, [15, 20], [
          [0, 0, 20, 1, "AIR HANDLING", "s10"],
          [0, 1, 1, 20, "STORAGE", "e10"],
          [13, 3, 5, 4, "CEO'S OFFICE", "s2"],
          [3, 3, 4, 5, "BOARDROOM", "e2"],
          [3, 16, 10, 2, "EXECUTIVE SUITE", "n5"],
          [18, 9, 2, 10, "ROOF ACCESS", "w4"],
        ]),
      },
      recon: { n: 36, blind: [22, 30], behind: "PLANT ROOM",
        routes: [
          [[22, 30], [32, 30], [32, 35], [22, 35], [22, 30]],
          [[22, 30], [22, 20], [8, 20], [8, 36], [21, 36], [21, 30], [22, 30]],
        ] },
      keyRoute: { n: 36, path: [[27, 36], [34, 36], [34, 11], [31, 11]] },
    },

    // 2. Lights out: in through floor 2's fire door when both guards are behind the server room, straight into the server
    // room for the fuse box, then (in the dark) the key room and its bolted door, then the vault on the same floor.
    lightsout: {
      floors: [40, 30, 24], wayIn: 2, keyRoom: "KEY ROOM", serverRoom: "SERVER ROOM",
      layouts: {
        40: floor(40, [28, 40], [
          [0, 0, 40, 1, "LOCKERS", "s20"],
          [0, 1, 1, 40, "ARCHIVE", "e20"],
          [16, 3, 8, 5, "RECEPTION", "s4"],
          [32, 3, 5, 8, "SECURITY OFFICE", "w4"],
          [3, 12, 20, 2, "TELLERS", "s10"],
          [38, 12, 2, 20, "CASH STORE", "w10"],
          [5, 30, 10, 4, "CANTEEN", "n5"],
          [33, 26, 4, 10, "STAFF ROOM", "w5"],
        ]),
        30: floor(30, [21, 30], [
          [0, 0, 30, 1, "ARCHIVE", "s10"],
          [0, 1, 1, 30, "LOCKERS", "e14"],
          [3, 3, 15, 2, "OPEN-PLAN OFFICE", "s7"],
          [9, 8, 6, 5, "VAULT", "e2"],
          [3, 8, 2, 15, "STORE ROOM", "e7"],
          [24, 12, 5, 6, "KEY ROOM", "s2"],
          [8, 22, 10, 3, "MEETING ROOM", "n5"],
          [23, 20, 3, 10, "SERVER ROOM", "w6"],
        ]),
        24: floor(24, [17, 24], [
          [0, 0, 24, 1, "AIR HANDLING", "s12"],
          [0, 1, 1, 24, "STORAGE", "e12"],
          [15, 3, 6, 4, "CEO'S OFFICE", "s3"],
          [3, 3, 4, 6, "BOARDROOM", "e3"],
          [3, 11, 3, 8, "IT ROOM", "e4"],
          [8, 16, 8, 3, "PA OFFICE", "n4"],
          [3, 21, 12, 2, "EXECUTIVE SUITE", "n6"],
          [22, 8, 2, 12, "ROOF ACCESS", "w6"],
        ]),
      },
      keyRoute: { n: 30, path: [[21, 30], [21, 18], [26, 18]] },   // up past the server room's door, then to the key room
      recon: { n: 30, blind: [26, 19], behind: "SERVER ROOM",
        routes: [
          [[26, 19], [26, 18], [23, 18], [23, 11], [29, 11], [29, 19], [26, 19]],
          [[26, 19], [22, 19], [22, 30], [30, 30], [30, 20], [26, 20], [26, 19]],
        ] },
    },

    // 3. Plan B: in through floor 2's fire door (no guards on this floor), the fuse box in the server room by the door,
    // then the key room. Change of plan: the key's been moved to a deposit box in the basement (the lift), then back up
    // to the strongroom on floor 2 (36 = 6 × 6) and the vault beyond it.
    planb: {
      floors: [48, 36, 18], wayIn: 2, keyRoom: "KEY ROOM", serverRoom: "SERVER ROOM",
      layouts: {
        48: floor(48, [11, 48], [
          [0, 0, 48, 1, "LOCKERS", "s30"],
          [0, 1, 1, 48, "ARCHIVE", "e24"],
          [20, 3, 8, 6, "RECEPTION", "s4"],
          [3, 3, 6, 8, "SECURITY OFFICE", "e4"],
          [22, 12, 24, 2, "TELLERS", "s12"],
          [3, 14, 16, 3, "WAITING AREA", "s8"],
          [44, 17, 4, 12, "STAFF ROOM", "w6"],
          [3, 32, 3, 16, "POST ROOM", "e8"],
          [30, 36, 12, 4, "CANTEEN", "n6"],
          [14, 24, 2, 24, "CASH STORE", "e12"],
        ]),
        36: floor(36, [8, 36], [
          [0, 0, 36, 1, "ARCHIVE", "s20"],
          [0, 1, 1, 36, "LOCKERS", "e10"],
          [3, 3, 18, 2, "OPEN-PLAN OFFICE", "s9"],
          [24, 6, 6, 6, "STRONGROOM", "s3"],
          [35, 2, 2, 18, "SECURITY LOCKERS", "w9"],
          [3, 11, 9, 4, "KEY ROOM", "s5"],
          [31, 23, 3, 12, "FILING ROOM", "w6"],
          [10, 26, 4, 9, "SERVER ROOM", "w4"],
          [17, 31, 12, 3, "TRAINING ROOM", "n6"],
        ]),
        18: floor(18, [4, 18], [
          [0, 0, 18, 1, "AIR HANDLING", "s9"],
          [0, 1, 1, 18, "STORAGE", "e9"],
          [11, 3, 6, 3, "CEO'S OFFICE", "s3"],
          [3, 3, 3, 6, "BOARDROOM", "e3"],
          [8, 13, 9, 2, "EXECUTIVE SUITE", "n4"],
          [17, 4, 2, 9, "ROOF ACCESS", "w4"],
        ]),
      },
    },

    // 4. The quiet way in: deposit box. In through the ground floor's fire door when both guards are behind the mail room,
    // up the corridor to the lift and down to the basement; copy the key, put it back, out the same way.
    quietbox: {
      floors: [42, 30, 16], wayIn: 1,
      layouts: {
        42: floor(42, [24, 42], [
          [0, 0, 42, 1, "LOCKERS", "s20"],
          [0, 1, 1, 42, "ARCHIVE", "e20"],
          [3, 3, 21, 2, "TELLERS", "s10"],
          [28, 3, 7, 6, "RECEPTION", "s3"],
          [3, 10, 14, 3, "WAITING AREA", "s7"],
          [37, 16, 2, 21, "CASH STORE", "w10"],
          [8, 26, 3, 14, "STAFF ROOM", "e7"],
          [28, 33, 6, 7, "MAIL ROOM", "w3"],
        ]),
        30: floor(30, [17, 30], [
          [0, 0, 30, 1, "ARCHIVE", "s15"],
          [0, 1, 1, 30, "SERVER ROW", "e12"],
          [3, 3, 15, 2, "OPEN-PLAN OFFICE", "s7"],
          [22, 4, 6, 5, "VAULT CHAMBER", "s3"],
          [3, 9, 3, 10, "FILING ROOM", "e5"],
          [23, 13, 5, 6, "IT DESK", "w3"],
          [29, 10, 2, 15, "SECURITY LOCKERS", "w7"],
          [6, 25, 10, 3, "MEETING ROOM", "n5"],
        ]),
        16: floor(16, [9, 16], [
          [0, 0, 16, 1, "AIR HANDLING", "s8"],
          [0, 1, 1, 16, "STORAGE", "e8"],
          [10, 3, 4, 4, "CEO'S OFFICE", "s2"],
          [3, 3, 2, 8, "BOARDROOM", "e4"],
          [6, 12, 8, 2, "EXECUTIVE SUITE", "n4"],
        ]),
      },
      recon: { n: 42, blind: [34, 36], behind: "MAIL ROOM",
        routes: [
          [[34, 36], [34, 32], [27, 32], [27, 40], [34, 40], [34, 36]],
          [[34, 36], [36, 36], [36, 15], [39, 15], [39, 42], [35, 42], [35, 37], [34, 37], [34, 36]],
        ] },
    },
  };

  // Expand the corner lists once
  function line(corners){
    const out = [{ x: corners[0][0], y: corners[0][1] }];
    for(let i = 1; i < corners.length; i++){
      let x = out[out.length - 1].x, y = out[out.length - 1].y; const tx = corners[i][0], ty = corners[i][1];
      while(x !== tx){ x += Math.sign(tx - x); out.push({ x, y }); }
      while(y !== ty){ y += Math.sign(ty - y); out.push({ x, y }); }
    }
    return out;
  }
  Object.values(BUILDINGS).forEach(b => {
    if(b.recon){ b.recon.door = b.layouts[b.recon.n].exit; b.recon.blind = { x: b.recon.blind[0], y: b.recon.blind[1] }; b.recon.cells = b.recon.routes.map(line); }
    if(b.keyRoute) b.keyRoute.cells = line(b.keyRoute.path);
  });

  const LKEY = "blueprintLayouts", FKEY = "blueprintProgress";
  const read = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; }catch(e){ return d; } };
  const P = () => window.Primenet;
  // This mission's building. make: pick the mission's menu now if it hasn't been (the Factor Vault, the first stage that
  // needs it); otherwise only read it, so the Twist Lab never sets a mission's menu by accident.
  function current(opts = {}){
    const pn = P(); if(!pn) return null;
    const m = opts.make ? (pn.twistMenu && pn.twistMenu()) : (pn.peekMenu && pn.peekMenu());
    return m && BUILDINGS[m.id] ? { id: m.id, ...BUILDINGS[m.id] } : null;
  }
  // Easiest first: the roof (smallest number), then floor 2, then the ground floor
  const order = b => b.floors.slice().sort((p, q) => p - q);
  function nextN(){
    const b = current({ make: true }); if(!b) return null;
    const done = read(FKEY, []);
    return order(b).find(n => !done.includes(n)) || null;
  }
  function layoutFor(n){ const b = current(); return b && b.layouts[n] ? JSON.parse(JSON.stringify(b.layouts[n])) : null; }
  function layouts(){ const all = read(LKEY, {}) || {}, b = current(); if(b) b.floors.forEach(n => { all[n] = JSON.parse(JSON.stringify(b.layouts[n])); }); return all; }
  function install(){ const b = current(); if(!b) return false; try{ localStorage.setItem(LKEY, JSON.stringify(layouts())); }catch(e){} return true; }
  function reconFor(n){ const b = current(); return b && b.recon && b.recon.n === n ? b.recon : null; }
  function keyRouteFor(n){ const b = current(); return b && b.keyRoute && b.keyRoute.n === n ? b.keyRoute : null; }

  // ----- Walking the corridors (the heist on a building floor) -----
  // walk(layout, a, b): every square from a to b over the free floor, the shortest way with as few turns as it can,
  // keeping to the walls where it's no longer. A square inside a room leaves (or enters) it by the room's door.
  // null if there's no way through. corners(squares): just the ends and the turning points.
  function doorOf(r){
    const d = r.door; if(!d) return null;
    if(d.side === "n") return { in: { x: r.x + d.at, y: r.y }, out: { x: r.x + d.at, y: r.y - 1 } };
    if(d.side === "s") return { in: { x: r.x + d.at, y: r.y + r.h - 1 }, out: { x: r.x + d.at, y: r.y + r.h } };
    if(d.side === "w") return { in: { x: r.x, y: r.y + d.at }, out: { x: r.x - 1, y: r.y + d.at } };
    return { in: { x: r.x + r.w - 1, y: r.y + d.at }, out: { x: r.x + r.w, y: r.y + d.at } };
  }
  function walk(L, a, b){
    const G = L.grid, occ = new Int16Array(G * G).fill(-1);
    L.rooms.forEach((r, i) => { for(let x = r.x; x < r.x + r.w; x++) for(let y = r.y; y < r.y + r.h; y++) if(x >= 0 && y >= 0 && x < G && y < G) occ[y * G + x] = i; });
    const clamp = c => ({ x: Math.max(0, Math.min(G - 1, Math.round(c.x))), y: Math.max(0, Math.min(G - 1, Math.round(c.y))) });
    a = clamp(a); b = clamp(b);
    const ra = occ[a.y * G + a.x], rb = occ[b.y * G + b.x];
    if(ra >= 0 && ra === rb) return [a, b];
    const pre = [], post = [];
    if(ra >= 0){ const d = doorOf(L.rooms[ra]); if(!d) return null; pre.push(a, d.in); a = d.out; }
    if(rb >= 0){ const d = doorOf(L.rooms[rb]); if(!d) return null; post.push(d.in, b); b = d.out; }
    const free = (x, y) => x >= 0 && y >= 0 && x < G && y < G && occ[y * G + x] < 0;
    if(!free(a.x, a.y) || !free(b.x, b.y)) return null;
    const hug = (x, y) => x === 0 || y === 0 || x === G - 1 || y === G - 1 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const i = x + dx, j = y + dy; return i >= 0 && j >= 0 && i < G && j < G && occ[j * G + i] >= 0; });
    // Dijkstra over (square, heading): a step costs 10 (9 beside a wall or room), a turn 14 more
    const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], N = G * G * 4, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
    const heap = []; const push = (k, d) => { heap.push([d, k]); let i = heap.length - 1; while(i){ const p = (i - 1) >> 1; if(heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if(heap.length){ heap[0] = last; let i = 0; for(;;){ const l = 2 * i + 1, r = l + 1; let m = i; if(l < heap.length && heap[l][0] < heap[m][0]) m = l; if(r < heap.length && heap[r][0] < heap[m][0]) m = r; if(m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const start = a.y * G + a.x;
    for(let h = 0; h < 4; h++){ dist[start * 4 + h] = 0; push(start * 4 + h, 0); }
    let end = -1;
    while(heap.length){
      const [d, k] = pop(); if(d > dist[k]) continue;
      const c = k >> 2, h = k & 3, x = c % G, y = (c / G) | 0;
      if(x === b.x && y === b.y){ end = k; break; }
      D4.forEach(([dx, dy], nh) => { const nx = x + dx, ny = y + dy; if(!free(nx, ny)) return;
        const nk = (ny * G + nx) * 4 + nh, nd = d + (hug(nx, ny) ? 9 : 10) + (nh === h || c === start ? 0 : 14);
        if(nd < dist[nk]){ dist[nk] = nd; prev[nk] = k; push(nk, nd); } });
    }
    if(end < 0) return null;
    const mid = []; for(let k = end; k >= 0; k = prev[k]){ const c = k >> 2; mid.unshift({ x: c % G, y: (c / G) | 0 }); if(c === start) break; }
    return [...pre, ...mid, ...post];
  }
  function corners(cells){
    if(!cells || cells.length < 3) return cells || [];
    const out = [cells[0]];
    for(let i = 1; i < cells.length - 1; i++){ const p = cells[i - 1], c = cells[i], n = cells[i + 1]; if((c.x - p.x) !== (n.x - c.x) || (c.y - p.y) !== (n.y - c.y)) out.push(c); }
    out.push(cells[cells.length - 1]); return out;
  }
  window.PNBuildings = { BUILDINGS, current, order, nextN, layoutFor, layouts, install, reconFor, keyRouteFor, walk, corners, doorOf };
})();
