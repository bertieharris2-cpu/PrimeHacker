/* PRIMENET shared data: the current agent, teacher settings and the session record.
   Everything is saved in this browser only. The teacher moves records between
   computers by downloading and loading JSON files (see docs/DECISIONS.md). */
(function(){
  "use strict";

  const KEYS = {
    settings: "primenet_settings_v1",
    agent: "primenet_agent_v1",
    records: "primenet_records_v1",
    device: "primenet_device_v1",
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
    write(KEYS.agent, { sessionId: session.id, codename: session.codename, level });
    return session;
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

  function randomCodename(){
    return CODENAMES[Math.floor(Math.random() * CODENAMES.length)];
  }

  window.Primenet = {
    LEVELS, LEVEL_ORDER, STAGES,
    getSettings, setSettings, allowedLevels,
    startSession, getAgent, log,
    getRecords, summary, suggestedLevel,
    exportData, downloadRecord, importRecords, clearRecords,
    randomCodename,
  };
})();
