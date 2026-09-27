/* PRIMENET shared data: the current agent, teacher settings and the session record.
   Everything is saved in this browser only. The teacher moves records between
   computers by downloading and loading JSON files (see docs/DECISIONS.md). */
(function(){
  "use strict";

  /* Teacher PIN. Change it here: it applies on every computer that runs this copy of the game.
     It keeps students out of the teacher controls; it is not strong security. */
  const TEACHER_PIN = "2357";

  const KEYS = {
    settings: "primenet_settings_v1",
    agent: "primenet_agent_v1",
    records: "primenet_records_v1",
    device: "primenet_device_v1",
    teacher: "primenet_teacher_unlocked",   // sessionStorage: cleared when the browser tab closes
    floors: "blueprintProgress",            // numbers finished in Factor Vault this mission
    textSize: "primenet_textsize_v1",       // older text-size-only settings, read once and folded into `learner`
    learner: "primenet_learner_v1",
    loot: "primenet_loot_v1",               // { CODENAME: { owned:[ids], equip:{ term, door, frame } } }, bought in the safehouse shop         // { CODENAME: { text, font, motion } }, each learner's settings on this computer
  };

  const LEVELS = {
    L1: { id:"L1", rank:"Recruit",    factors:"numbers up to 24",  primes:"primes up to 19", reward:"£1,000–£9,000 a lock" },
    L2: { id:"L2", rank:"Operative",  factors:"numbers up to 64",  primes:"primes up to 29", reward:"£10,000–£90,000 a lock" },
    L3: { id:"L3", rank:"Specialist", factors:"numbers up to 100", primes:"primes up to 41", reward:"£100,000–£900,000 a lock" },
  };
  const LEVEL_ORDER = ["L1","L2","L3"];

  // The mission route, in play order. `furthest` in a session is the latest of these reached.
  const STAGES = [
    { id:"started",   label:"Started" },
    { id:"scan",      label:"Frequency Scan" },
    { id:"vault",     label:"Factor Vault" },
    { id:"blueprint", label:"Blueprint" },
    { id:"hack",      label:"Prime Hack" },
    { id:"complete",  label:"Mission complete" },
  ];

  const CODENAMES = [
    "NIGHTJAR","KESTREL","OSPREY","MERLIN","HERON","RAVEN","FALCON","SWIFT","MAGPIE","WREN",
    "COBALT","ONYX","QUARTZ","BASALT","FLINT","JASPER","GRANITE","SLATE","EMBER","FROST",
    "CIPHER","VECTOR","PRISM","SIGNAL","ORBIT","PULSE","VERTEX","NEXUS","RADAR","ECHO",
  ];

  function read(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  }
  function write(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e){ return false; }
  }
  function uid(prefix){
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function deviceId(){
    let id = read(KEYS.device, null);
    if(!id){ id = uid("PC"); write(KEYS.device, id); }
    return id;
  }

  /* ---------- Teacher settings ---------- */
  // rule: "choice" (any level), "min" (level or above), "fixed" (only that level)
  const DEFAULT_SETTINGS = { rule:"choice", level:"L1" };

  function getSettings(){
    const s = read(KEYS.settings, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...s };
  }
  function setSettings(next){
    const s = { ...getSettings(), ...next };
    if(!LEVELS[s.level]) s.level = "L1";
    if(!["choice","min","fixed"].includes(s.rule)) s.rule = "choice";
    write(KEYS.settings, s);
    return s;
  }
  function allowedLevels(){
    const s = getSettings();
    if(s.rule === "fixed") return [s.level];
    if(s.rule === "min") return LEVEL_ORDER.slice(LEVEL_ORDER.indexOf(s.level));
    return LEVEL_ORDER.slice();
  }

  /* ---------- Records ---------- */
  function getRecords(){ return read(KEYS.records, []); }
  function saveRecords(list){ write(KEYS.records, list); }

  function stageIndex(id){ return STAGES.findIndex(s => s.id === id); }

  function startSession(codename, level){
    const now = new Date().toISOString();
    const session = {
      id: uid("S"),
      device: deviceId(),
      codename: String(codename).trim().toUpperCase().slice(0, 20),
      level,
      rule: getSettings().rule,
      startedAt: now,
      lastAt: now,
      furthest: "started",
      events: [{ stage:"started", at: now }],
    };
    const list = getRecords();
    list.push(session);
    saveRecords(list);
    session.target = pickTarget(level);
    session.operation = pickOperation();
    write(KEYS.agent, { sessionId: session.id, codename: session.codename, level, target: session.target, operation: session.operation });
    try{ localStorage.removeItem(KEYS.floors); }catch(e){}   // a new mission starts with no floors built
    return session;
  }

  /* One heist per mission: the bank named in the briefing is the building the student
     rebuilds and the bank Prime Hack breaks into. Names match the accounts in modules/bank.js. */
  const TARGETS = {
    L1: ["Rivercross Utilities","Northwick Transit","Sentinel Finance","Haven Council"],
    L2: ["Ember Freight","Crystal Holdings","Vault Secure","Pinnacle Corp"],
    L3: ["Helix Dynamics","Nexus Global","Kronos Finance","Atlas Prime"],
  };
  const OP_A = ["SILENT","GLASS","IRON","HOLLOW","NEON","MIDNIGHT","COBALT","PAPER","STATIC","VELVET"];
  const OP_B = ["HERON","PRISM","LEDGER","HARBOUR","CIPHER","LANTERN","ORBIT","FALCON","VAULT","ECHO"];
  const pickFrom = a => a[Math.floor(Math.random() * a.length)];
  function pickTarget(level){ return pickFrom(TARGETS[level] || TARGETS.L1); }
  function pickOperation(){ return `${pickFrom(OP_A)} ${pickFrom(OP_B)}`; }
  // This mission's bank and operation name, with fallbacks for a game opened on its own
  function mission(){
    const a = getAgent() || {};
    return { target: a.target || "Rivercross Utilities", operation: a.operation || "SILENT HERON", codename: a.codename || "AGENT" };
  }

  // A stable agent number made from the codename, e.g. "AG-4821-K"
  function agentNumber(codename){
    const name = cleanName(codename || "");
    let h = 2166136261;
    for(const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return `AG-${String(1000 + h % 9000)}-${"ABCDEFGHJKLMNPQRSTUVWXYZ"[(h >>> 13) % 24]}`;
  }

  /* Learner settings, chosen on the title screen and saved per codename on this computer:
     text size (pages are scaled with CSS zoom because the games use fixed pixel sizes),
     an easy-read font and reduced motion. */
  const TEXT_SIZES = { S:{ id:"S", label:"Small", zoom:.9 }, M:{ id:"M", label:"Medium", zoom:1 }, L:{ id:"L", label:"Large", zoom:1.15 }, XL:{ id:"XL", label:"Extra large", zoom:1.3 } };
  const TEXT_ORDER = ["S","M","L","XL"];
  const DEFAULT_PREFS = { text:"M", font:false, motion:false };
  const cleanName = n => String(n).trim().toUpperCase().slice(0, 20);
  function prefsFor(codename){
    const name = cleanName(codename || (getAgent() || {}).codename || "");
    const saved = read(KEYS.learner, {})[name];
    if(saved) return { ...DEFAULT_PREFS, ...saved };
    const oldText = read(KEYS.textSize, {})[name];
    return { ...DEFAULT_PREFS, text: TEXT_SIZES[oldText] ? oldText : "M" };
  }
  function setPrefs(codename, prefs){
    const p = { ...DEFAULT_PREFS, ...prefs };
    const name = cleanName(codename || "");
    if(name){ const map = read(KEYS.learner, {}); map[name] = p; write(KEYS.learner, map); }
    applyPrefs(p);
    return p;
  }
  function applyPrefs(p){
    p = p || prefsFor();
    const root = document.documentElement;
    const z = (TEXT_SIZES[p.text] || TEXT_SIZES.M).zoom;
    root.style.zoom = z === 1 ? "" : String(z);
    root.classList.toggle("pn-easyfont", !!p.font);
    root.classList.toggle("pn-reduce-motion", !!p.motion);
    if(p.font && !document.getElementById("pn-easyfont-link")){
      const l = document.createElement("link");
      l.id = "pn-easyfont-link"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Atkinson+Hyperlegible+Mono:wght@400;700&display=swap";
      document.head.appendChild(l);
    }
  }
  const reducedMotion = () => document.documentElement.classList.contains("pn-reduce-motion") ||
    (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Older names, still used by the title screen's text-size code
  const textSizeFor = codename => prefsFor(codename).text;
  const setTextSize = (codename, size) => setPrefs(codename, { ...prefsFor(codename), text: size });
  const applyTextSize = size => applyPrefs({ ...prefsFor(), text: size || prefsFor().text });

  // The student picks the bank on the briefing's target map; the record keeps it too
  function setMissionTarget(name){
    const a = updateAgent({ target: name });
    const list = getRecords(), s = a && list.find(x => x.id === a.sessionId);
    if(s){ s.target = name; saveRecords(list); }
    return a;
  }

  /* Safehouse shop: cosmetics bought with the wallet each codename earns in Prime Hack.
     Prices climb steeply so the best items need higher levels (bigger vaults). */
  const SHOP = {
    term: { label: "Terminal colour", items: [
      { id: "term-green",  name: "Classic green", price: 0,       rgb: "47,191,138" },
      { id: "term-amber",  name: "Amber CRT",     price: 10000,   rgb: "255,176,64" },
      { id: "term-ice",    name: "Ice blue",      price: 25000,   rgb: "110,200,255" },
      { id: "term-pink",   name: "Hot pink",      price: 50000,   rgb: "255,79,216" },
      { id: "term-gold",   name: "Gold",          price: 250000,  rgb: "255,201,77" },
      { id: "term-cycle",  name: "Spectrum cycle",price: 1000000, rgb: "47,191,138", cycle: true },
    ]},
    door: { label: "Vault door", items: [
      { id: "door-steel",   name: "Steel",   price: 0 },
      { id: "door-brass",   name: "Brass",   price: 25000 },
      { id: "door-carbon",  name: "Carbon",  price: 100000 },
      { id: "door-neon",    name: "Neon",    price: 250000 },
      { id: "door-diamond", name: "Diamond", price: 1000000 },
    ]},
    frame: { label: "ID card frame", items: [
      { id: "frame-standard", name: "Standard",    price: 0 },
      { id: "frame-bronze",   name: "Bronze",      price: 10000 },
      { id: "frame-silver",   name: "Silver",      price: 50000 },
      { id: "frame-gold",     name: "Gold",        price: 250000 },
      { id: "frame-holo",     name: "Holographic", price: 1000000 },
    ]},
  };
  const DEFAULT_EQUIP = { term: "term-green", door: "door-steel", frame: "frame-standard" };
  const shopItem = id => Object.values(SHOP).flatMap(c => c.items).find(i => i.id === id) || null;
  function lootFor(codename){
    const name = cleanName(codename || (getAgent() || {}).codename || "");
    const saved = read(KEYS.loot, {})[name] || {};
    return { owned: saved.owned || [], equip: { ...DEFAULT_EQUIP, ...(saved.equip || {}) } };
  }
  function saveLoot(codename, loot){ const map = read(KEYS.loot, {}); map[cleanName(codename)] = loot; write(KEYS.loot, map); }
  // The wallet lives in each codename's bank (modules/bank.js); the shop reads and spends it directly
  const bankKey = codename => "PRIMENET_BANK_V1_" + cleanName(codename);
  function walletOf(codename){ const b = read(bankKey(codename), null); return b && b.walletBalance ? b.walletBalance : 0; }
  function buyItem(codename, id){
    const item = shopItem(id), loot = lootFor(codename);
    if(!item || !cleanName(codename || "")) return { ok: false, why: "No codename" };
    if(item.price === 0 || loot.owned.includes(id)) return { ok: true, already: true };
    const bank = read(bankKey(codename), null);
    if(!bank || (bank.walletBalance || 0) < item.price) return { ok: false, why: "Not enough in the wallet" };
    bank.walletBalance -= item.price;
    (bank.ledger = bank.ledger || []).push({ ts: Date.now(), type: "spend", module: "shop", item: id, amount: item.price });
    write(bankKey(codename), bank);
    loot.owned.push(id); saveLoot(codename, loot);
    return { ok: true };
  }
  function equipItem(codename, id){
    const item = shopItem(id), loot = lootFor(codename);
    if(!item) return false;
    if(item.price > 0 && !loot.owned.includes(id)) return false;
    const cat = Object.keys(SHOP).find(k => SHOP[k].items.includes(item));
    loot.equip[cat] = id; saveLoot(codename, loot);
    return true;
  }

  // Add to this mission's agent data, e.g. the scan's signal strength and decoder charges
  function updateAgent(patch){
    const a = getAgent(); if(!a) return null;
    const next = { ...a, ...patch }; write(KEYS.agent, next); return next;
  }

  // The level for this mission. Games fall back to L1 when opened without the title screen.
  function level(){
    const a = getAgent();
    return a && LEVELS[a.level] ? a.level : "L1";
  }

  /* ---------- Teacher unlock ---------- */
  function unlockTeacher(pin){
    if(String(pin).trim() !== TEACHER_PIN) return false;
    try{ sessionStorage.setItem(KEYS.teacher, "1"); }catch(e){}
    return true;
  }
  function isTeacher(){
    try{ return sessionStorage.getItem(KEYS.teacher) === "1"; }catch(e){ return false; }
  }
  function lockTeacher(){
    try{ sessionStorage.removeItem(KEYS.teacher); }catch(e){}
  }

  function getAgent(){ return read(KEYS.agent, null); }

  // Games call this when a student reaches a stage, e.g. Primenet.log("vault", {n: 24}).
  function log(stage, detail){
    const agent = getAgent();
    if(!agent) return null;
    const list = getRecords();
    const s = list.find(x => x.id === agent.sessionId);
    if(!s) return null;
    const now = new Date().toISOString();
    s.events.push(detail ? { stage, at: now, detail } : { stage, at: now });
    s.lastAt = now;
    if(stageIndex(stage) > stageIndex(s.furthest)) s.furthest = stage;
    saveRecords(list);
    return s;
  }

  // Summary per codename: how often each level was chosen, furthest stage, last played.
  function summary(list){
    const by = {};
    (list || getRecords()).forEach(s => {
      const k = s.codename || "UNKNOWN";
      const row = by[k] || (by[k] = { codename:k, sessions:0, levels:{L1:0,L2:0,L3:0}, furthest:"started", lastAt:"", lastLevel:"" });
      row.sessions++;
      if(row.levels[s.level] !== undefined) row.levels[s.level]++;
      if(stageIndex(s.furthest) > stageIndex(row.furthest)) row.furthest = s.furthest;
      if(!row.lastAt || s.lastAt > row.lastAt){ row.lastAt = s.lastAt; row.lastLevel = s.level; }
    });
    return Object.values(by).sort((a,b) => a.codename.localeCompare(b.codename));
  }

  // Suggest moving up after finishing at a level, within what the teacher allows.
  function suggestedLevel(codename){
    const name = String(codename || "").trim().toUpperCase();
    if(!name) return null;
    const done = getRecords().filter(s => s.codename === name && s.furthest === "complete");
    if(!done.length) return null;
    const best = done.reduce((m, s) => Math.max(m, LEVEL_ORDER.indexOf(s.level)), 0);
    const next = LEVEL_ORDER[best + 1];
    return next && allowedLevels().includes(next) ? next : null;
  }

  function exportData(){
    return {
      app: "PRIMENET",
      kind: "session-record",
      version: 1,
      exportedAt: new Date().toISOString(),
      device: deviceId(),
      settings: getSettings(),
      sessions: getRecords(),
    };
  }

  function downloadRecord(){
    const data = exportData();
    const stamp = data.exportedAt.slice(0, 16).replace(/[:T]/g, "-");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `primenet-record-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return a.download;
  }

  // Merge sessions from one or more exported files. Sessions already present are skipped.
  function importRecords(objects){
    const list = getRecords();
    const have = new Set(list.map(s => s.id));
    let added = 0, files = 0, rejected = 0;
    objects.forEach(obj => {
      if(!obj || obj.app !== "PRIMENET" || !Array.isArray(obj.sessions)){ rejected++; return; }
      files++;
      obj.sessions.forEach(s => {
        if(!s || !s.id || have.has(s.id)) return;
        if(!s.codename || !LEVELS[s.level]) return;
        list.push(s); have.add(s.id); added++;
      });
    });
    saveRecords(list);
    return { files, added, rejected };
  }

  function clearRecords(){ saveRecords([]); }

  /* ---------- Ranks: earned by breaching vaults with the same codename on this computer ---------- */
  const RANKS = [
    // Separate from the level names (Recruit, Operative, Specialist) so the two don't get confused
    { at:0, name:"Rookie" }, { at:1, name:"Field Agent" }, { at:2, name:"Senior Agent" },
    { at:3, name:"Handler" }, { at:5, name:"Mastermind" }, { at:8, name:"Ghost" },
  ];
  function vaultsBreached(codename){
    const name = String(codename || "").trim().toUpperCase();
    // Every run that ends in a breached vault counts, including extra runs in the same mission
    return getRecords().filter(s => s.codename === name).reduce((t, s) => t + s.events.filter(e => e.stage === "complete").length, 0);
  }
  function rankFor(count){ return RANKS.filter(r => r.at <= count).pop().name; }
  function agentRank(codename){
    const count = vaultsBreached(codename);
    const next = RANKS.find(r => r.at > count);
    return { count, rank: rankFor(count), next: next ? next.name : null, toNext: next ? next.at - count : 0 };
  }
  function currentSession(){
    const a = getAgent();
    return a ? getRecords().find(s => s.id === a.sessionId) || null : null;
  }

  function randomCodename(){
    return CODENAMES[Math.floor(Math.random() * CODENAMES.length)];
  }

  window.Primenet = {
    LEVELS, LEVEL_ORDER, STAGES,
    getSettings, setSettings, allowedLevels,
    startSession, getAgent, level, log,
    unlockTeacher, isTeacher, lockTeacher,
    getRecords, summary, suggestedLevel,
    exportData, downloadRecord, importRecords, clearRecords,
    randomCodename,
    agentRank, rankFor, currentSession,
    TEXT_SIZES, TEXT_ORDER, textSizeFor, setTextSize, applyTextSize,
    prefsFor, setPrefs, applyPrefs, reducedMotion,
    mission, agentNumber, TARGETS, updateAgent, setMissionTarget,
    SHOP, shopItem, lootFor, buyItem, equipItem, walletOf,
  };
  // ---------- Twists the teacher allows in the bank rotation (feedback: leave out what hasn't been taught) ----------
  const TWIST_KEY = "primenet_twists_v1";
  // Round 11: each twist has its own place in the mission, chosen by context (the ceiling relays follow the
  // blueprint's lights, the key room door comes before the last locks). `page` twists join the rotation;
  // the others are built into their stage and only use the tick box.
  const TWIST_POINTS = { scan:"After the Frequency Scan", vault:"Factor Vault (after floor 2)", lights:"Blueprint (after the lights)", getin:"Getting in", hack:"Prime Hack (before lock 3)", finale:"Finale" };
  const TWISTS = [
    { id:"sieve",      point:"scan",   name:"Motion-sensor sieve",    maths:"Primes and multiples", page:"twist_sieve.html" },
    { id:"jammer",     point:"scan",   name:"Jammer",                 maths:"Multiples" },
    { id:"strongroom", point:"vault",  name:"Square strongroom",      maths:"Square numbers", page:"twist_strongroom.html" },
    { id:"walls",      point:"vault",  name:"Deposit-box walls",      maths:"Factor pairs", page:"twist_walls.html" },
    { id:"primefloor", point:"vault",  name:"Fake floor",             maths:"Primes and factor pairs", page:"twist_primefloor.html" },
    { id:"cubes",      point:"lights", name:"Ceiling relays (cubes)", maths:"Cube numbers", page:"twist_cubes.html" },
    { id:"patrols",    point:"getin",  name:"Guard patrols",          maths:"Multiples and LCM", page:"twist_patrols.html" },
    { id:"corridor",   point:"getin",  name:"Laser corridor",         maths:"Factors" },
    { id:"factortree", point:"hack",   name:"Key room door (factor tree)", maths:"Prime factorisation", page:"twist_factortree.html" },
    { id:"blackout",   point:"finale", name:"Server blackout",        maths:"Primes" },
    { id:"getaway",    point:"finale", name:"Getaway chase",          maths:"Primes, squares, cubes" },
  ];
  const readTw = () => { try{ return JSON.parse(localStorage.getItem(TWIST_KEY) || "{}") || {}; }catch(e){ return {}; } };
  const writeTw = d => { try{ localStorage.setItem(TWIST_KEY, JSON.stringify(d)); }catch(e){} };
  function twistsOff(){ const d = readTw(); return Array.isArray(d.off) ? d.off : []; }
  function setTwistOn(id, on){ const d = readTw(), off = new Set(Array.isArray(d.off) ? d.off : []); if(on) off.delete(id); else off.add(id); d.off = [...off]; writeTw(d); }
  const twistOn = id => !twistsOff().includes(id);
  // The teacher can make one twist turn up in every mission (e.g. the whole class on square numbers)
  const twistPin = () => readTw().pin || "";
  function setTwistPin(id){ const d = readTw(); d.pin = id || ""; writeTw(d); }
  // How many rotating twists a mission gets
  const TWISTS_PER_MISSION = 2;
  // The mission's twist plan: made once per session, then every stage asks it "is there a twist here?".
  // It avoids the twists this agent had last mission when it can.
  const PLAN_KEY = "primenet_twistplan_v1";
  function twistPlan(){
    const a = getAgent(); if(!a) return {};
    let st; try{ st = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}") || {}; }catch(e){ st = {}; }
    if(st.session === a.sessionId && st.picks) return st.picks;
    const hist = (st.history || {})[a.codename] || [];
    const pool = TWISTS.filter(t => t.page && twistOn(t.id));
    const shuffle = arr => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const fresh = shuffle(pool.filter(t => !hist.includes(t.id))), stale = shuffle(pool.filter(t => hist.includes(t.id)));
    const picks = {};
    const pin = TWISTS.find(t => t.id === twistPin() && t.page && twistOn(t.id));
    if(pin) picks[pin.point] = pin.id;
    for(const t of [...fresh, ...stale]){ if(Object.keys(picks).length >= TWISTS_PER_MISSION) break; if(!picks[t.point]) picks[t.point] = t.id; }
    st.session = a.sessionId; st.picks = picks; st.history = st.history || {}; st.history[a.codename] = Object.values(picks);
    try{ localStorage.setItem(PLAN_KEY, JSON.stringify(st)); }catch(e){}
    return picks;
  }
  const twistAt = point => { const id = twistPlan()[point]; return id ? TWISTS.find(t => t.id === id) : null; };
  function setTwistPlan(picks){ const a = getAgent(); if(!a) return; let st; try{ st = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}") || {}; }catch(e){ st = {}; } st.session = a.sessionId; st.picks = picks; try{ localStorage.setItem(PLAN_KEY, JSON.stringify(st)); }catch(e){} }
  Object.assign(window.Primenet, { TWISTS, TWIST_POINTS, twistsOff, setTwistOn, twistOn, twistPin, setTwistPin, twistPlan, twistAt, setTwistPlan });

  applyPrefs();   // every page opens with the current agent's settings

  // ---------- Home button on every game screen (feedback: a way out to the main menu) ----------
  // Bottom-left, small. Asks first, because leaving part-way through a stage loses that stage's progress.
  function homeButton(){
    if(!/\/modules\//.test(location.pathname.replace(/\\/g, "/"))) return;
    if(window.parent !== window) return;   // a twist playing inside a mission stage
    const st = document.createElement("style");
    st.textContent = `.pn-home{ all:unset; box-sizing:border-box; position:fixed; left:0; top:50%; transform:translateY(-50%); z-index:99990; writing-mode:vertical-rl; rotate:180deg;
        font-family:"Chakra Petch","Inter",system-ui,sans-serif; font-weight:700; font-size:11px; letter-spacing:.2em; color:rgba(235,255,248,.75);
        background:rgba(4,14,17,.9); border:1px solid rgba(40,120,140,.75); border-left:0; padding:12px 6px; cursor:pointer; }
      .pn-home:hover, .pn-home:focus-visible{ color:#fff; border-color:#2fbf8a; outline:none; box-shadow:0 0 14px rgba(47,191,138,.35); }
      .pn-home-ask{ position:fixed; inset:0; z-index:99995; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(2,8,10,.72); }
      .pn-home-ask div{ width:min(420px,100%); background:#0a1c21; border:1px solid #2fbf8a; padding:20px; display:flex; flex-direction:column; gap:12px; font-family:"Courier Prime",monospace; color:rgba(235,255,248,.9); font-size:17px; }
      .pn-home-ask b{ font-family:"Chakra Petch",sans-serif; letter-spacing:.14em; color:#2fbf8a; }
      .pn-home-ask p{ margin:0; line-height:1.5; }
      .pn-home-ask span{ display:flex; gap:8px; justify-content:flex-end; }
      .pn-home-ask button{ font:inherit; font-family:"Chakra Petch",sans-serif; font-weight:700; letter-spacing:.1em; font-size:13px; padding:9px 14px; background:transparent; color:#eafff6; border:1px solid rgba(40,120,140,.75); cursor:pointer; }
      .pn-home-ask button.go{ border-color:#2fbf8a; color:#2fbf8a; }
`;
    document.head.appendChild(st);
    const b = document.createElement("button"); b.type = "button"; b.className = "pn-home"; b.textContent = "MENU ⌂"; b.title = "Back to the main menu";
    b.addEventListener("click", e => {
      e.stopPropagation();
      const ov = document.createElement("div"); ov.className = "pn-home-ask";
      ov.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="pnHomeT"><b id="pnHomeT">LEAVE FOR THE MAIN MENU?</b><p>Progress on this stage will be lost. Cash and badges you've already earned are kept.</p>
        <span><button type="button" class="stay">Stay</button><button type="button" class="go">Main menu</button></span></div>`;
      document.body.appendChild(ov);
      const close = () => ov.remove();
      ov.querySelector(".stay").addEventListener("click", close);
      ov.querySelector(".go").addEventListener("click", () => { location.href = "../index.html"; });
      ov.addEventListener("click", ev => { if(ev.target === ov) close(); });
      ov.addEventListener("keydown", ev => { ev.stopPropagation(); if(ev.key === "Escape") close(); });
      ov.querySelector(".stay").focus();
    });
    // Keys typed in the games shouldn't be swallowed by the button
    b.addEventListener("keydown", e => e.stopPropagation());
    document.body.appendChild(b);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", homeButton); else homeButton();
})();
