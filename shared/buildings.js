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
  window.PNBuildings = { BUILDINGS, current, order, nextN, layoutFor, layouts, install, reconFor, keyRouteFor };
})();
