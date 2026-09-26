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
    learner: "primenet_learner_v1",         // { CODENAME: { text, font, motion } }, each learner's settings on this computer
  };

  const LEVELS = {
    L1: { id:"L1", rank:"Recruit",    factors:"numbers up to 24",  primes:"primes up to 19", reward:"£1,000–£9,000 a lock" },
    L2: { id:"L2", rank:"Operative",  factors:"numbers up to 64",  primes:"primes up to 37", reward:"£10,000–£90,000 a lock" },
    L3: { id:"L3", rank:"Specialist", factors:"numbers up to 100", primes:"primes up to 53", reward:"£100,000–£900,000 a lock" },
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
    return getRecords().filter(s => s.codename === name && s.events.some(e => e.stage === "complete")).length;
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
    mission, agentNumber, TARGETS, updateAgent,
  };
  applyPrefs();   // every page opens with the current agent's settings
})();
