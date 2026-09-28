/* PRIMENET story: every target's story and the lines ORACLE, FOX and WREN say, in one place.
   Change a name, a line or a sum here and the whole game follows. {codename} (or {agent}) becomes the pupil's codename.
   PARKED (not used yet): hiddenSum, recoveredSoFar, victim, thanks, headline and clue are for the result screen,
   FEE_RATE is for the finder's fee, and finale/boss are for the finale after Level 3. */
(function(){
  "use strict";

  const TARGETS = {
    // ---------- Level 1 ----------
    "Rivercross Utilities": { level:"L1", mission:1, verb:"siphon",
      hook:"Rivercross Utilities has been overcharging families for their water and hiding the money in secret accounts.",
      cover:"in a meter-reading van", prize:"the hidden money", returnTo:"the families",
      hiddenSum:240000, recoveredSoFar:0, victim:"Mrs Okafor, a retired teacher on Alder Street",
      thanks:"I thought I'd never see that money again. It's paying for my grandson's school shoes. Thank you, whoever you are.",
      headline:"RIVERCROSS FAMILIES GET THEIR MONEY BACK", clue:"A payment slip in the vault marked \"consultancy fee, M.\"" },
    "Northwick Transit": { level:"L1", mission:2, verb:"expose",
      hook:"Northwick Transit was given money to fix the trains and pocketed it instead. Commuters are still riding broken carriages.",
      cover:"as a track inspection crew", prize:"the ledger that proves it", returnTo:"the rail repair fund",
      hiddenSum:300000, recoveredSoFar:0, victim:"Mr Thompson, who has driven the 7:15 for thirty years",
      thanks:"Thirty years I've driven the 7:15 and the carriages finally have new seats. Someone out there has our backs.",
      headline:"MISSING TRAIN FUNDS FOUND: NORTHWICK CARRIAGES TO BE FIXED", clue:"An email printout with the same \"M.\" and the same account number as the payment slip." },
    "Sentinel Finance": { level:"L1", mission:3, verb:"retrieve",
      hook:"Sentinel Finance froze pensioners' savings and blamed a computer fault that never existed.",
      cover:"as IT support contractors", prize:"the unlock codes", returnTo:"the pensioners",
      hiddenSum:420000, recoveredSoFar:0, victim:"Walter, 81",
      thanks:"I can pay the heating bill this winter. I'd like to shake your hand.",
      headline:"SENTINEL PENSIONERS GET THEIR SAVINGS BACK", clue:"A visitor pass with a diary note: \"Meet M. at the council offices, Thursday.\"" },
    "Haven Council": { level:"L1", mission:4, verb:"retrieve",
      hook:"Someone inside Haven Council is selling the town park to builders in secret, and taking a cut of the money.",
      cover:"as fire-safety inspectors", prize:"the signed contract selling the park", returnTo:"the park fund",
      hiddenSum:500000, recoveredSoFar:0, victim:"Bea, who runs the Saturday park club",
      thanks:"The gates are open and the Saturday club is back. The children don't know who saved their park, but I do. Thank you.",
      headline:"HAVEN PARK SAVED: SECRET DEAL EXPOSED", clue:"The initials \"M.\" belong to Councillor Marlowe." },
    // ---------- Level 2 ----------
    "Ember Freight": { level:"L2", mission:1, verb:"expose",
      hook:"Ember Freight has been charging small shops for insurance it never bought.",
      cover:"as forklift drivers and a delivery crew", prize:"the fake insurance records", returnTo:"the shops",
      hiddenSum:480000, recoveredSoFar:0, victim:"Hana, who runs a bakery",
      thanks:"I was about to close the bakery. Now I can buy the new oven. Bread's on me, always.",
      headline:"EMBER FREIGHT REPAYS SMALL SHOPS", clue:"A gold card with a mountain symbol, tucked in a shipping manifest." },
    "Crystal Holdings": { level:"L2", mission:2, verb:"siphon",
      hook:"Crystal Holdings has been keeping tenants' deposits by inventing damage that was never there.",
      cover:"as window cleaners", prize:"the kept deposits", returnTo:"the tenants",
      hiddenSum:360000, recoveredSoFar:0, victim:"Sam, a student",
      thanks:"That deposit is my rent for next term. I didn't think anyone believed me.",
      headline:"CRYSTAL TENANTS GET THEIR DEPOSITS BACK", clue:"The same mountain symbol on a private key fob." },
    "Vault Secure": { level:"L2", mission:3, verb:"retrieve",
      hook:"Vault Secure has been secretly keeping a copy of every customer's door code, and charging for protection it never provided.",
      cover:"as alarm engineers", prize:"the list of copied codes", returnTo:"the customers",
      hiddenSum:600000, recoveredSoFar:0, victim:"Mr and Mrs Baker, who run a corner shop",
      thanks:"New locks and every penny back. We sleep easier.",
      headline:"VAULT SECURE CUSTOMERS REFUNDED, ALL CODES DESTROYED", clue:"A guest list for \"The Pinnacle Club\" with the mountain symbol." },
    "Pinnacle Corp": { level:"L2", mission:4, verb:"expose",
      hook:"Pinnacle Corp rigged the town lottery so its own staff kept winning.",
      cover:"as lottery-machine technicians", prize:"the rigged draw software", returnTo:"local groups",
      hiddenSum:720000, recoveredSoFar:0, victim:"Joy, who raised money for the youth centre",
      thanks:"The youth centre opens next month. The prize money was meant for places like this all along.",
      headline:"PINNACLE LOTTERY RIGGING EXPOSED: PRIZE POT RETURNED TO LOCAL GROUPS", clue:"The guest list names Ms Ashcroft, chair of Pinnacle Corp." },
    // ---------- Level 3 ----------
    "Helix Dynamics": { level:"L3", mission:1, verb:"expose",
      hook:"Helix Dynamics has been hiding readings that show its factory is polluting the river, and keeping the clean-up money.",
      cover:"as environmental auditors", prize:"the real river readings", returnTo:"a clean-up fund",
      hiddenSum:1500000, recoveredSoFar:0, victim:"Kofi, who runs riverside boat hire",
      thanks:"The river's being cleaned and the boats are out again.",
      headline:"HELIX RIVER SECRET REVEALED: CLEAN-UP FUNDED", clue:"An ownership document with a folded corner showing the letters \"AP\"." },
    "Nexus Global": { level:"L3", mission:2, verb:"siphon",
      hook:"Nexus Global charged whole villages for broadband upgrades and never installed them.",
      cover:"as broadband engineers", prize:"the money for upgrades never installed", returnTo:"the villages",
      hiddenSum:1200000, recoveredSoFar:0, victim:"Elin, who looks after the village hall",
      thanks:"The village hall has broadband and the children are doing their homework at the hall table.",
      headline:"NEXUS VILLAGES FINALLY GET BROADBAND, AND THEIR MONEY", clue:"Board minutes with the same folded corner and \"AP\"." },
    "Kronos Finance": { level:"L3", mission:3, verb:"retrieve",
      hook:"Kronos Finance buried secret fees in family loan contracts so the debts never stopped growing.",
      cover:"as head-office auditors", prize:"the original contract copies", returnTo:"the families",
      hiddenSum:900000, recoveredSoFar:0, victim:"Carlos, a young dad",
      thanks:"The fees are gone. It's the first time in years I'm not scared of the post.",
      headline:"KRONOS FINANCE FORCED TO REPAY FAMILIES", clue:"An org chart with an unnamed box at the top labelled \"A.P.\"" },
    "Atlas Prime": { level:"L3", mission:4, verb:"expose", finale:true, boss:"Director Sable",
      hook:"Atlas Prime owns Helix, Nexus and Kronos, and hid the money all three of them took. The trail ends on its top floor.",
      cover:"as the catering team for the board dinner", prize:"the chain of ownership that ties the three companies together", returnTo:"the affected communities",
      hiddenSum:8000000, recoveredSoFar:0, victim:"Kofi, Elin and Carlos",
      thanks:"We never met you, but we know what you did. Thank you.",
      headline:"ATLAS PRIME UNMASKED: THREE COMPANIES, ONE OWNER", clue:"\"AP\" is Atlas Prime, run by Director Sable." },
  };

  // The final action in the vault, by verb: what the pupil sees happen
  const VERBS = {
    siphon:   { word:"SIPHON",   doing:"Siphoning the hidden money", done:"TRANSFER COMPLETE",
                line:"The hidden money is moving to PRIMENET's recovery account. From there it goes back to {returnTo}." },
    expose:   { word:"EXPOSE",   doing:"Exposing the evidence",      done:"EVIDENCE SENT",
                line:"The evidence is on its way to a newsroom and the regulator. The hidden money is frozen for {returnTo}." },
    retrieve: { word:"RETRIEVE", doing:"Retrieving {prize}",         done:"RETRIEVED",
                line:"FOX has {prize}. The hidden money is being transferred back to {returnTo}." },
  };

  // ORACLE's lines through the mission
  const LINES = {
    welcome: "Welcome to PRIMENET, {codename}. You're our new technical specialist.",
    pickTarget: "Pick your target, {codename}. The ones in your clearance are lit up on the map.",
    briefing: [
      "*{codename}*, this is ORACLE at PRIMENET.",
      "{hook}",
      "*FOX* and *WREN* are going in tonight, {cover}. They'll need you on the tech: intercept the plans, decrypt them, and get them past every security system inside.",
      "Ready?",
    ],
    scanStart: "They're sending their building plans to their security firm over an encrypted channel. The channel hides behind prime-numbered frequencies. Find the primes and we can lock on.",
    scanPeaks: "Locked on. Now catch the peaks. Every one that's prime is a piece of the file.",
    scanEnd: "Got it. The plans are ours to read. Let's decrypt them.",
    decrypt: "That's the file we just captured. Each floor is locked with a number. Find its factor pairs and the floor decrypts.",
    building: "Every floor, decrypted. Now FOX and WREN can see the whole building before they go in.",
    corrupt: "Part of the file arrived damaged. Rebuild it so FOX and WREN aren't planning around a hole.",
    plan: "Mark the route for FOX and WREN. Every weak point you find is one they don't have to guess at.",
    sendKit: "Send the access kit to the agents.",
  };

  // FOX and WREN over the radio. One line is picked at random from a bank, so runs feel different.
  const RADIO = {
    headingIn:   [["FOX","In position. Talk me through it, {codename}."], ["WREN","Nice disguise. Itchy, though."]],
    patrols:     [["FOX","Two guards, different rounds. I need the moment they both leave the door."], ["WREN","They're on a loop. Find when the loops line up."]],
    patrolsDone: [["FOX","Clear. Moving."]],
    cubes:       [["WREN","Found the fuse box. Over to you."], ["FOX","The relays are stacked in cubes. Get the numbers right or the lights go."]],
    cubesDone:   [["WREN","Lights out! That was you. Keep going."]],
    planb:       [["FOX","The key card is in one of these deposit boxes. Wrong box and we're stuck down here."], ["WREN","Three boxes, one key. No pressure."]],
    strongroom:  [["WREN","Pressure plates. Only the square ones are safe, I think."], ["FOX","Think isn't enough. Check."]],
    keyroom:     [["FOX","The key room door wants the primes behind a number."]],
    vault:       [["WREN","Four locks. Give me the primes, I'll turn the keys."]],
    vaultOpen:   [["FOX","We're in."], ["WREN","Told you we'd make a good team."]],
    getOut:      [["FOX","Doors are closing. We're heading out."], ["WREN","Keep the exits open for us, {codename}!"]],
    safe:        [["WREN","We're out! Van's moving."], ["FOX","Clean exit. Good work, {codename}."]],
  };

  const FEE_RATE = { L1:0.10, L2:0.15, L3:0.20 };   // PARKED: the finder's fee

  const pick = a => a[Math.floor(Math.random() * a.length)];
  // This mission's target story (the current agent's target when no name is given)
  function target(name){
    const PN = window.Primenet;
    const n = name || (PN && PN.mission ? PN.mission().target : "Rivercross Utilities");
    return TARGETS[n] || TARGETS["Rivercross Utilities"];
  }
  // Fill {codename} {hook} {cover} {prize} {returnTo} {target}
  function fill(text, name){
    const PN = window.Primenet, m = PN && PN.mission ? PN.mission() : { codename:"AGENT", target:"Rivercross Utilities" };
    const t = target(name || m.target);
    return String(text).replace(/\{(codename|agent|hook|cover|prize|returnTo|target)\}/g, (x, k) =>
      k === "codename" || k === "agent" ? m.codename : k === "target" ? (name || m.target) : t[k]);
  }
  const line = key => fill(LINES[key]);
  const verb = name => { const v = VERBS[target(name).verb]; return { ...v, doing: fill(v.doing, name), line: fill(v.line, name) }; };
  // A random radio line from a bank: { who, text }
  function radio(bank){ const r = pick(RADIO[bank] || [["FOX","..."]]); return { who: r[0], text: fill(r[1]) }; }

  window.PNStory = { TARGETS, VERBS, LINES, RADIO, FEE_RATE, target, fill, line, verb, radio };
})();
