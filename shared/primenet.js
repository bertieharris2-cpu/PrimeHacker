/* PRIMENET shared data: the current agent, teacher settings and the session record.
   Everything is saved in this browser only. The teacher moves records between
   computers by downloading and loading JSON files (see docs/DECISIONS.md). */
(function(){
  "use strict";

  /* Teacher PIN. Change it here: it applies on every computer that runs this copy of the game.
     It keeps students out of the teacher controls; it is not strong security. */
  const TEACHER_PIN = "2357";
  const SHELL = window.parent !== window && window.name === "pnshell";   // shown inside the full screen shell (see toShell)

  const KEYS = {
    settings: "primenet_settings_v1",
    agent: "primenet_agent_v1",
    records: "primenet_records_v1",
    device: "primenet_device_v1",
    teacher: "primenet_teacher_unlocked",   // sessionStorage: cleared when the browser tab closes
    floors: "blueprintProgress",            // numbers finished in Factor Vault this mission
    textSize: "primenet_textsize_v1",       // older text-size-only settings, read once and folded into `learner`
    learner: "primenet_learner_v1",
    loot: "primenet_loot_v1",               // { CODENAME: { owned:[ids], equip:{ term, door, frame, holo, gadget, call } } }, bought in the safehouse shop         // { CODENAME: { text, font, motion } }, each learner's settings on this computer
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
    L2: ["Ember Freight","Crystal Holdings","Ironclad Alarms","Pinnacle Corp"],
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
    const t = a.target === "Vault Secure" ? "Ironclad Alarms" : a.target;   // renamed target (older saves)
    return { target: t || "Rivercross Utilities", operation: a.operation || "SILENT HERON", codename: a.codename || "AGENT" };
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
  const DEFAULT_PREFS = { text:"M", font:false, motion:false, voice:false };   // voice: read instructions aloud (shared/voice.js)
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

  /* Safehouse shop: bought with the wallet each codename earns in Prime Hack. Each category equips one item.
     Looks: terminal colour and vault door (Prime Hack), ID card frame and callsign (title screen, Prime Hack bar),
     hologram tint (the BRIEF in every twist). Gadgets change how a stage plays; see perk() and applyLoot().
     Every item has a swatch (a CSS background) or an icon for its shop card, and a one-line desc shown there.
     Prices climb steeply so the best items need higher levels (bigger vaults). */
  const SHOP = {
    term: { label: "Terminal colour", blurb: "The colour of the whole Prime Hack terminal.", items: [
      { id: "term-green",  name: "Classic green", price: 0,       rgb: "47,191,138",  desc: "The standard PRIMENET green." },
      { id: "term-amber",  name: "Amber CRT",     price: 10000,   rgb: "255,176,64",  desc: "Warm amber, like an old monitor." },
      { id: "term-ice",    name: "Ice blue",      price: 25000,   rgb: "110,200,255", desc: "Cold blue light." },
      { id: "term-pink",   name: "Hot pink",      price: 50000,   rgb: "255,79,216",  desc: "Loud and proud." },
      { id: "term-gold",   name: "Gold",          price: 250000,  rgb: "255,201,77",  desc: "For agents with money to burn." },
      { id: "term-cycle",  name: "Spectrum cycle",price: 1000000, rgb: "47,191,138",  cycle: true, desc: "Slowly drifts through every colour.", swatch: "linear-gradient(90deg,#2fbf8a,#6ec8ff,#ff4fd8,#ffc94d)" },
    ]},
    door: { label: "Vault door", blurb: "Your vault door, shown when the money is banked at the end of Prime Hack.", items: [
      { id: "door-steel",   name: "Steel",   price: 0,       desc: "Plain bank steel.",                   swatch: "#1c4a44" },
      { id: "door-brass",   name: "Brass",   price: 25000,   desc: "Old-money brass.",                    swatch: "#8a6a2a" },
      { id: "door-carbon",  name: "Carbon",  price: 100000,  desc: "Black carbon fibre.",                 swatch: "repeating-linear-gradient(45deg,#1a1d1f 0 5px,#0e1011 5px 10px)" },
      { id: "door-neon",    name: "Neon",    price: 250000,  desc: "Pink and blue neon glow.",            swatch: "linear-gradient(90deg,#ff4fd8,#6ec8ff)" },
      { id: "door-diamond", name: "Diamond", price: 1000000, desc: "A door made of diamond. Show-off.",   swatch: "linear-gradient(120deg,#bfe9ff,#fff,#9fd8ff)" },
    ]},
    frame: { label: "ID card frame", blurb: "The frame round your agent ID card.", items: [
      { id: "frame-standard", name: "Standard",    price: 0,       desc: "Standard issue.",                    swatch: "#16333a" },
      { id: "frame-bronze",   name: "Bronze",      price: 10000,   desc: "A bronze border.",                   swatch: "#b87333" },
      { id: "frame-silver",   name: "Silver",      price: 50000,   desc: "A silver border.",                   swatch: "#c9d6dc" },
      { id: "frame-gold",     name: "Gold",        price: 250000,  desc: "A gold border with a glow.",         swatch: "#ffc94d" },
      { id: "frame-holo",     name: "Holographic", price: 1000000, desc: "A slow rainbow shimmer.",            swatch: "linear-gradient(120deg,#ff4fd8,#6ec8ff,#2fbf8a,#ffc94d)" },
    ]},
    // rgb is the tint's colour triplet and hi its bright hex; twist.js reads them as --hb-rgb and --hb-hi (see applyLoot)
    holo: { label: "Hologram tint", blurb: "The colour of the BRIEF hologram in every twist.", items: [
      { id: "holo-ice",    name: "Ice",         price: 0,      rgb: "140,235,255", hi: "#8feaff", desc: "The standard ice blue." },
      { id: "holo-mint",   name: "Mint",        price: 10000,  rgb: "125,255,196", hi: "#7dffc4", desc: "Cool mint green." },
      { id: "holo-amber",  name: "Amber",       price: 25000,  rgb: "255,201,77",  hi: "#ffc94d", desc: "Warm amber, like a warning light." },
      { id: "holo-rose",   name: "Rose",        price: 50000,  rgb: "255,138,180", hi: "#ff8ab4", desc: "Soft pink." },
      { id: "holo-violet", name: "Violet",      price: 100000, rgb: "200,160,255", hi: "#c8a0ff", desc: "Deep-space violet." },
      { id: "holo-white",  name: "Ghost white", price: 250000, rgb: "235,245,255", hi: "#ebf5ff", desc: "Pure white light. Very rare." },
    ]},
    // One gadget at a time. perk keys: strikes (extra alarm strikes in a twist), lens (night tint on twists), trace (Prime Hack trace speed)
    gadget: { label: "Gadgets", blurb: "One at a time. Each gadget changes how a stage plays.", items: [
      { id: "gadget-none",      name: "No gadget",       price: 0,      icon: "○", desc: "Play it straight." },
      { id: "gadget-drone",     name: "Decoy drone",     price: 5000,   icon: "⌖", desc: "One extra alarm strike in every twist. The drone takes the first hit.", perk: { strikes: 1 } },
      { id: "gadget-lens",      name: "Night lens",      price: 15000,  icon: "◐", desc: "A soft green night-vision tint over every twist.", perk: { lens: 1 } },
      { id: "gadget-scrambler", name: "Trace scrambler", price: 50000,  icon: "≋", desc: "In Prime Hack the trace climbs a quarter slower.", perk: { trace: 0.75 } },
      { id: "gadget-cloak",     name: "Ghost cloak",     price: 250000, icon: "◈", desc: "The trace climbs half as fast, and you get the extra alarm strike too.", perk: { trace: 0.5, strikes: 1 } },
    ]},
    call: { label: "Callsign", blurb: "A badge on your ID card and in the Prime Hack bar.", items: [
      { id: "call-none",    name: "No callsign", price: 0,       icon: "○", desc: "Just your codename." },
      { id: "call-viper",   name: "VIPER",       price: 10000,   icon: "◆", color: "#2fbf8a", desc: "Quick and quiet." },
      { id: "call-bolt",    name: "BOLT",        price: 25000,   icon: "⚡", color: "#ffe14d", desc: "Fastest fingers in the network." },
      { id: "call-phantom", name: "PHANTOM",     price: 100000,  icon: "◐", color: "#c8a0ff", desc: "Never seen, never traced." },
      { id: "call-zero",    name: "ZERO",        price: 250000,  icon: "◎", color: "#6ec8ff", desc: "The one they all talk about." },
      { id: "call-legend",  name: "LEGEND",      price: 1000000, icon: "★", color: "#ffc94d", desc: "A million-pound name." },
    ]},
  };
  const DEFAULT_EQUIP = { term: "term-green", door: "door-steel", frame: "frame-standard", holo: "holo-ice", gadget: "gadget-none", call: "call-none" };
  const shopItem = id => Object.values(SHOP).flatMap(c => c.items).find(i => i.id === id) || null;
  const shopCat = item => Object.keys(SHOP).find(k => SHOP[k].items.includes(item)) || null;
  // The CSS background for an item's shop swatch (colour items derive it from their rgb)
  const shopSwatch = it => it.swatch || (it.rgb ? `rgb(${it.rgb})` : "transparent");
  function lootFor(codename){
    const name = cleanName(codename || (getAgent() || {}).codename || "");
    const saved = read(KEYS.loot, {})[name] || {};
    return { owned: saved.owned || [], equip: { ...DEFAULT_EQUIP, ...(saved.equip || {}) } };
  }
  function saveLoot(codename, loot){ const map = read(KEYS.loot, {}); map[cleanName(codename)] = loot; write(KEYS.loot, map); }
  // The item this codename has equipped in a category (the current agent when no codename is given)
  const equipped = (codename, cat) => shopItem(lootFor(codename).equip[cat]);
  // The wallet lives in each codename's bank (modules/bank.js); the shop reads and spends it directly
  const bankKey = codename => "PRIMENET_BANK_V1_" + cleanName(codename);
  function walletOf(codename){ const b = read(bankKey(codename), null); return b && typeof b.walletBalance === "number" && b.walletBalance > 0 ? b.walletBalance : 0; }
  // How much more this codename needs before it can buy the item (0 when it can, or already owns it)
  function shortBy(codename, id){ const item = shopItem(id); if(!item || item.price === 0 || lootFor(codename).owned.includes(id)) return 0; return Math.max(0, item.price - walletOf(codename)); }
  function buyItem(codename, id){
    const item = shopItem(id), loot = lootFor(codename);
    if(!item || !cleanName(codename || "")) return { ok: false, why: "No codename" };
    if(item.price === 0 || loot.owned.includes(id)) return { ok: true, already: true };
    const bank = read(bankKey(codename), null);
    if(!bank || typeof bank.walletBalance !== "number" || bank.walletBalance < item.price) return { ok: false, why: `Not enough in the wallet. You need ${"£" + shortBy(codename, id).toLocaleString("en-GB")} more.` };
    bank.walletBalance -= item.price;
    (bank.ledger = bank.ledger || []).push({ ts: Date.now(), type: "spend", module: "shop", item: id, amount: item.price });
    write(bankKey(codename), bank);
    loot.owned.push(id); saveLoot(codename, loot);
    return { ok: true, left: bank.walletBalance };
  }
  function equipItem(codename, id){
    const item = shopItem(id), loot = lootFor(codename);
    if(!item || !cleanName(codename || "")) return false;   // never save loot under an empty name
    if(item.price > 0 && !loot.owned.includes(id)) return false;
    loot.equip[shopCat(item)] = id; saveLoot(codename, loot);
    return true;
  }
  // A gadget's effect for the current agent, e.g. perk("strikes") is 1 with the decoy drone; fallback (0) when the gadget has none
  function perk(key, fallback){
    const g = equipped(null, "gadget"), v = g && g.perk ? g.perk[key] : undefined;
    return v === undefined ? (fallback === undefined ? 0 : fallback) : v;
  }
  // What the equipped items set on <html>: the hologram tint (--hb-rgb and --hb-hi, used by the twist brief) and the
  // night lens class. Twist pages call it from PNTwist.init; Prime Hack from boot. Returns the loot for further use.
  function applyLoot(codename){
    const root = document.documentElement, h = equipped(codename, "holo");
    if(h && h.rgb){ root.style.setProperty("--hb-rgb", h.rgb); root.style.setProperty("--hb-hi", h.hi); }
    root.classList.toggle("pn-lens", !!perk("lens"));
    return lootFor(codename);
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
    SHOP, shopItem, shopCat, shopSwatch, lootFor, buyItem, equipItem, walletOf, shortBy, equipped, perk, applyLoot,
  };
  // ---------- Twists the teacher allows in the bank rotation (feedback: leave out what hasn't been taught) ----------
  const TWIST_KEY = "primenet_twists_v1";
  // Round 11: each twist has its own place in the mission, chosen by context (the ceiling relays follow the
  // blueprint's lights, the key room door comes before the last locks). `page` twists join the rotation;
  // the others are built into their stage and only use the tick box.
  // Round 15 (Bertie): twists happen where the story puts them. The building can come in corrupted; the rest happen
  // during the heist itself (the way in, the fuse box, Plan B in the basement, the strongroom) or at the vault door.
  const TWIST_POINTS = { assembled:"The building (as it assembles)", entry:"Heist: the way in", power:"Heist: the fuse box", keyroom:"Heist: the key room door", planb:"Heist: the deposit boxes, in the basement", strongroom:"Heist: the strongroom", hack:"The vault (before lock 3)", finale:"Finale", warmup:"Warm-up (main menu, not in missions)" };
  const HEIST_POINTS = ["entry", "power", "keyroom", "planb", "strongroom"];
  const TWISTS = [
    { id:"corrupt",    point:"assembled",  name:"Corrupted blueprint",    maths:"Factor pairs as arrays", page:"twist_corrupt.html" },
    { id:"patrols",    point:"entry",      name:"Guard patrols",          maths:"Multiples and LCM", page:"twist_patrols3d.html" },
    { id:"cubes",      point:"power",      name:"Ceiling relays (cubes)", maths:"Cube numbers", page:"twist_cubes3d.html" },
    { id:"walls",      point:"planb",      name:"Deposit boxes", maths:"Factor pairs and HCF", page:"twist_walls3d.html" },
    { id:"strongroom", point:"strongroom", name:"Strongroom code crack",   maths:"Patterns (squares and more)", page:"twist_strongroom_hack.html" },   // Round 23: crack the floor code (a rotating pattern)
    { id:"factortree", point:"keyroom",    name:"Key room door",          maths:"Prime factorisation", page:"twist_door2.html" },
    { id:"blackout",   point:"finale",     name:"Server blackout",        maths:"Primes" },
    { id:"getaway",    point:"finale",     name:"Getaway chase",          maths:"Primes, squares, cubes" },
    { id:"sieve",      point:"warmup",     name:"Motion-sensor sieve",    maths:"Primes and multiples", warmup:"twist_sieve2.html" },
  ];
  const readTw = () => { try{ return JSON.parse(localStorage.getItem(TWIST_KEY) || "{}") || {}; }catch(e){ return {}; } };
  const writeTw = d => { try{ localStorage.setItem(TWIST_KEY, JSON.stringify(d)); }catch(e){} };
  function twistsOff(){ const d = readTw(); return Array.isArray(d.off) ? d.off : []; }
  function setTwistOn(id, on){ const d = readTw(), off = new Set(Array.isArray(d.off) ? d.off : []); if(on) off.delete(id); else off.add(id); d.off = [...off]; writeTw(d); }
  const twistOn = id => !twistsOff().includes(id);
  // The teacher can make one twist turn up in every mission (e.g. the whole class on square numbers)
  const twistPin = () => readTw().pin || "";
  function setTwistPin(id){ const d = readTw(); d.pin = id || ""; writeTw(d); }
  // Round 21: the teacher can fix the mission menu (every mission plays it until set back to random)
  const menuPin = () => readTw().menu || "";
  function setMenuPin(id){ const d = readTw(); d.menu = id || ""; writeTw(d); }
  // Round 12: missions can use the prototype pages (3D, in-the-building versions) instead of the current ones.
  // A twist with only a prototype (the corrupted blueprint) joins the rotation only while this is on.
  const twistProtos = () => !!readTw().protos;
  function setTwistProtos(on){ const d = readTw(); d.protos = !!on; writeTw(d); }
  const playable = t => t.point !== "warmup" && !!(t.page || (t.proto && twistProtos()));
  // Round 19 (Bertie): set menus. Each mission plays one menu: three twists that tell one story. Where the bank's
  // security key is, and how the mission ends, follow the menu. Quiet menus: FOX and WREN copy the key, put it back and
  // sneak out unseen; the vault is hacked from base. Loud menus: the crew wait at the vault, then get out fast.
  const MENUS = [
    { id:"quiet",      name:"The quiet way in",               quiet:true,  keyAt:"strongroom", picks:{ assembled:"corrupt", entry:"patrols", strongroom:"strongroom" } },
    { id:"lightsout",  name:"Lights out",                     quiet:false, keyAt:"keyroom",    picks:{ entry:"patrols", power:"cubes", keyroom:"factortree" } },
    { id:"planb",      name:"Plan B",                         quiet:false, keyAt:"deposit",    picks:{ power:"cubes", planb:"walls", strongroom:"strongroom" } },
    { id:"quietbox",   name:"The quiet way in: deposit box",  quiet:true,  keyAt:"deposit",    picks:{ assembled:"corrupt", entry:"patrols", planb:"walls" } },
  ];
  // The mission's twist plan: made once per session (one menu), then every stage asks it "is there a twist here?".
  // It avoids the menu this agent had last mission. A teacher pin keeps to menus with that twist; twists switched off
  // rule out the menus that use them.
  const PLAN_KEY = "primenet_twistplan_v1";
  const readPlan = () => { try{ return JSON.parse(localStorage.getItem(PLAN_KEY) || "{}") || {}; }catch(e){ return {}; } };
  const writePlan = st => { try{ localStorage.setItem(PLAN_KEY, JSON.stringify(st)); }catch(e){} };
  function menuOk(m){ return Object.values(m.picks).every(id => { const t = TWISTS.find(x => x.id === id); return t && playable(t) && twistOn(id); }); }
  function twistPlan(){
    const a = getAgent(); if(!a) return {};
    const st = readPlan();
    if(st.session === a.sessionId && st.picks) return st.picks;
    const last = (st.lastMenu || {})[a.codename];
    let pool = MENUS.filter(menuOk);
    const fixed = pool.find(m => m.id === menuPin());
    if(fixed) pool = [fixed];
    const pin = twistPin(); if(!fixed && pin && pool.some(m => Object.values(m.picks).includes(pin))) pool = pool.filter(m => Object.values(m.picks).includes(pin));
    if(pool.length > 1 && !fixed) pool = pool.filter(m => m.id !== last);
    const m = pool[Math.floor(Math.random() * pool.length)];
    st.session = a.sessionId; st.menu = m ? m.id : ""; st.picks = m ? { ...m.picks } : {};
    st.lastMenu = st.lastMenu || {}; if(m) st.lastMenu[a.codename] = m.id;
    writePlan(st);
    return st.picks;
  }
  const twistAt = point => { const id = twistPlan()[point]; return id ? TWISTS.find(t => t.id === id) : null; };
  // The current mission's menu (null if none, or a hand-made test plan)
  function twistMenu(){ const a = getAgent(); if(!a) return null; twistPlan(); const st = readPlan(); return MENUS.find(m => m.id === st.menu) || null; }
  // The same, but only reads: null until a stage has made this mission's plan (the Twist Lab never makes one by accident)
  function peekMenu(){ const a = getAgent(); if(!a) return null; const st = readPlan(); return st.session === a.sessionId ? MENUS.find(m => m.id === st.menu) || null : null; }
  // Testing: force a menu, or a hand-made set of picks
  function setTwistMenu(id){ const a = getAgent(), m = MENUS.find(x => x.id === id); if(!a || !m) return; const st = readPlan(); st.session = a.sessionId; st.menu = m.id; st.picks = { ...m.picks }; writePlan(st); }
  function setTwistPlan(picks){ const a = getAgent(); if(!a) return; const st = readPlan(); st.session = a.sessionId; st.menu = ""; st.picks = picks; writePlan(st); }
  // Round 23 (Bertie's brief): the strongroom is a code to crack, from a rotating bank of patterns. The teacher ticks
  // which patterns can appear; each agent keeps a codebook of the ones they've cracked (shown on the case file).
  const PATTERNS = [
    { id:"squares",     name:"Square numbers", code:"the square code",     order:"early", terms:"1, 4, 9, 16, 25", ready:true },
    { id:"matchsticks", name:"Matchsticks",    code:"the matchstick code", order:"early", terms:"4, 7, 10, 13, 16", ready:true },
    { id:"doubling",    name:"Doubling",       code:"the doubling code",   order:"early", terms:"1, 2, 4, 8, 16" },
    { id:"lshapes",     name:"L-shapes (odd numbers)", code:"the L code",  order:"early", terms:"1, 3, 5, 7, 9" },
    { id:"crosses",     name:"Crosses",        code:"the cross code",      order:"early", terms:"1, 5, 9, 13, 17" },
  ];
  function patternsOff(){ const d = readTw(); return Array.isArray(d.patternsOff) ? d.patternsOff : []; }
  function setPatternOn(id, on){ const d = readTw(), off = new Set(patternsOff()); if(on) off.delete(id); else off.add(id); d.patternsOff = [...off]; writeTw(d); }
  const patternOn = id => !patternsOff().includes(id);
  const CODEBOOK_KEY = "primenet_codebook_v1";
  const readCB = () => { try{ return JSON.parse(localStorage.getItem(CODEBOOK_KEY) || "{}") || {}; }catch(e){ return {}; } };
  const writeCB = d => { try{ localStorage.setItem(CODEBOOK_KEY, JSON.stringify(d)); }catch(e){} };
  const cbName = () => (getAgent() || {}).codename || "_guest";
  // { patternId: { at, times } } for the current agent
  function codebook(){ return (readCB()[cbName()] || {}).cracked || {}; }
  function crackPattern(id){ const d = readCB(), me = d[cbName()] = d[cbName()] || {}; me.cracked = me.cracked || {}; const c = me.cracked[id] || { times: 0 }; c.at = Date.now(); c.times++; me.cracked[id] = c; writeCB(d); }
  // Which pattern this strongroom plays: ticked by the teacher (available = what the page can play), never the last one,
  // uncracked first (early before later), then the one cracked longest ago
  function pickPattern(available){
    const d = readCB(), me = d[cbName()] = d[cbName()] || {}, cb = me.cracked || {};
    let pool = PATTERNS.filter(p => (!available || available.includes(p.id)) && patternOn(p.id));
    if(!pool.length) pool = PATTERNS.filter(p => !available || available.includes(p.id));
    if(pool.length > 1) pool = pool.filter(p => p.id !== me.last);
    const rank = p => cb[p.id] ? 2 + cb[p.id].at / 1e14 : (p.order === "early" ? 0 : 1);
    const best = Math.min(...pool.map(rank)), top = pool.filter(p => rank(p) === best);
    const p = top[Math.floor(Math.random() * top.length)];
    me.last = p.id; writeCB(d);
    return p.id;
  }
  Object.assign(window.Primenet, { PATTERNS, patternsOff, setPatternOn, patternOn, codebook, crackPattern, pickPattern, TWISTS, TWIST_POINTS, HEIST_POINTS, MENUS, menuPin, setMenuPin, twistsOff, setTwistOn, twistOn, twistPin, setTwistPin, twistPlan, twistAt, twistMenu, peekMenu, setTwistMenu, setTwistPlan, twistProtos, setTwistProtos });

  applyPrefs();   // every page opens with the current agent's settings
  // Round 14: shared helpers every page gets without its own script tag: the read-aloud voice
  (function loadShared(){
    const me = document.currentScript && document.currentScript.src;
    if(!me) return;
    const base = me.replace(/primenet\.js(\?.*)?$/, "");
    ["voice.js"].forEach(f => { if(document.querySelector(`script[src$="${f}"]`)) return; const sc = document.createElement("script"); sc.src = base + f; document.head.appendChild(sc); });
  })();

  // ---------- Home button on every game screen (feedback: a way out to the main menu) ----------
  // Bottom-left, small. Asks first, because leaving part-way through a stage loses that stage's progress.
  function homeButton(){
    if(!/\/modules\//.test(location.pathname.replace(/\\/g, "/"))) return;
    if(window.parent !== window && !SHELL) return;   // a twist playing inside a mission stage
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

  // ---------- Full screen button (Bertie): every page, top-left of the MENU tab; F11 or Escape leave as usual ----------
  // Browsers always leave full screen when the page changes. So pressing FULL SCREEN turns this tab into a "shell":
  // the top page goes full screen and shows the game in a full-window frame (named "pnshell"). Scene changes happen
  // inside the frame, so full screen never drops. The framed pages talk to the shell by postMessage only (file://).
  function toShell(){
    const de = document.documentElement;
    // A page can say where it had got to (PNResume), so the reload inside the frame carries on from there
    let url = location.href; try{ const r = window.PNResume && PNResume(); if(r) url = url.replace(/[?&]resume=[^&#]*/, "").replace(/(#.*)?$/, m => (url.includes("?") ? "&" : "?") + r + m); }catch(e){}
    de.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    // This copy of the page carries on inside the frame, so silence and stop it here
    try{ speechSynthesis.cancel(); speechSynthesis.speak = () => {}; }catch(e){}
    document.querySelectorAll("audio,video").forEach(m => { try{ m.pause(); }catch(e){} });
    try{ HTMLMediaElement.prototype.play = () => Promise.resolve(); AudioScheduledSourceNode.prototype.start = () => {}; }catch(e){}
    for(let i = setTimeout(() => {}); i > 0; i--) clearTimeout(i);
    for(let i = requestAnimationFrame(() => {}); i > 0; i--) cancelAnimationFrame(i);
    window.setTimeout = window.setInterval = window.requestAnimationFrame = () => 0;
    document.head.querySelectorAll("style,link,script").forEach(n => n.remove());
    de.removeAttribute("style"); de.removeAttribute("class");
    const body = document.createElement("body"), f = document.createElement("iframe");
    de.replaceChild(body, document.body);
    const st = document.createElement("style");
    st.textContent = `html,body{ margin:0; height:100%; overflow:hidden; background:#020a0c; } .pn-shell{ position:fixed; inset:0; width:100%; height:100%; border:0; display:block; }`;
    document.head.appendChild(st);
    f.className = "pn-shell"; f.name = "pnshell"; f.allow = "fullscreen; autoplay"; f.title = document.title; f.src = url;
    const tell = () => { try{ f.contentWindow.postMessage({ type: "pn-fs-state", on: !!document.fullscreenElement }, "*"); }catch(e){} };
    const focus = () => { f.focus(); try{ f.contentWindow.focus(); }catch(e){} };
    f.addEventListener("load", () => { focus(); tell(); });   // pupils type a lot: keys go to each new scene
    document.addEventListener("fullscreenchange", () => { tell(); focus(); try{ sessionStorage.setItem("primenet_fullscreen", document.fullscreenElement ? "1" : "0"); }catch(e){} });
    window.addEventListener("message", e => {
      const d = e.data || {};
      if(e.source !== f.contentWindow) return;
      if(d.type === "pn-fs"){ if(d.on && !document.fullscreenElement) de.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); else if(!d.on && document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
      if(d.type === "pn-shell-hi"){ if(d.title) document.title = d.title; tell(); }
    });
    body.appendChild(f);
  }
  // Inside the shell: full screen belongs to the top page, so this page's full screen calls (and any page's own
  // FULLSCREEN buttons) ask the shell, and document.fullscreenElement mirrors the shell's state.
  if(SHELL){
    let on = false;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => on ? document.documentElement : null });
    Element.prototype.requestFullscreen = function(){ parent.postMessage({ type: "pn-fs", on: true }, "*"); return Promise.resolve(); };
    document.exitFullscreen = () => { parent.postMessage({ type: "pn-fs", on: false }, "*"); return Promise.resolve(); };
    window.addEventListener("message", e => { const d = e.data || {}; if(e.source !== parent || d.type !== "pn-fs-state" || on === !!d.on) return; on = !!d.on; document.dispatchEvent(new Event("fullscreenchange")); });
    const hi = () => parent.postMessage({ type: "pn-shell-hi", title: document.title }, "*");
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", hi); else hi();
  }
  function fullscreenButton(){
    if((window.parent !== window && !SHELL) || !document.documentElement.requestFullscreen) return;
    const st = document.createElement("style");
    st.textContent = `.pn-full{ all:unset; box-sizing:border-box; position:fixed; right:12px; bottom:12px; z-index:99990; font-family:"Chakra Petch",sans-serif; font-weight:700; font-size:11px; letter-spacing:.16em; color:rgba(235,255,248,.75);
        background:rgba(6,20,25,.9); border:1px solid rgba(40,120,140,.7); padding:7px 10px; cursor:pointer; }
      .pn-full:hover, .pn-full:focus-visible{ color:#fff; border-color:#2fbf8a; box-shadow:0 0 14px rgba(47,191,138,.35); }
      .pnt ~ .pn-full{ bottom:12px; }
      @media (max-width:700px){ .pn-full{ bottom:auto; top:12px; } }`;
    document.head.appendChild(st);
    const b = document.createElement("button"); b.type = "button"; b.className = "pn-full"; b.title = "Full screen (Escape leaves it)";
    const label = () => { b.textContent = document.fullscreenElement ? "EXIT FULL SCREEN ⤡" : "FULL SCREEN ⤢"; };
    label();
    b.addEventListener("click", e => { e.stopPropagation(); if(document.fullscreenElement){ try{ if(!SHELL) sessionStorage.setItem("primenet_fullscreen", "0"); }catch(err){} document.exitFullscreen(); } else if(SHELL) document.documentElement.requestFullscreen(); else toShell(); });
    b.addEventListener("keydown", e => e.stopPropagation());
    document.body.appendChild(b);
    if(SHELL){ document.addEventListener("fullscreenchange", label); return; }
    // Fallback outside the shell (e.g. after a refresh): the browser drops full screen as the page changes, which
    // mustn't count as the pupil turning it off. Only Escape or the EXIT button do that.
    let leaving = false; window.addEventListener("pagehide", () => { leaving = true; }); window.addEventListener("beforeunload", () => { leaving = true; });
    document.addEventListener("fullscreenchange", () => { label(); try{ if(document.fullscreenElement) sessionStorage.setItem("primenet_fullscreen", "1"); else if(!leaving) sessionStorage.setItem("primenet_fullscreen", "0"); }catch(e){} });
    // If the pupil chose full screen, the first click or key press on a new page puts it back.
    let want = false; try{ want = sessionStorage.getItem("primenet_fullscreen") === "1"; }catch(e){}
    if(want && !document.fullscreenElement){
      const again = () => { document.removeEventListener("pointerdown", again, true); document.removeEventListener("keydown", again, true); if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); };
      document.addEventListener("pointerdown", again, true); document.addEventListener("keydown", again, true);
    }
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fullscreenButton); else fullscreenButton();
})();
