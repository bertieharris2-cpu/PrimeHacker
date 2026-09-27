# Review decisions

## Round 1

| Element | Decision | Notes |
|---|---|---|
| Main menu | Cut | Moved to `archive/`. A new start screen is still needed |
| Old start screens (launcher, demo, hub, .bat) | Not sure | Round 2 |
| Prime Frequency Scan | Keep | Needs improving. Moved into `modules/` |
| Factor Vault | Keep | Needs improving |
| Factor Vault, older version | Cut | Moved to `archive/`. Its finale may be kept (round 2) |
| Vault Grid | Keep | |
| Bank Blueprint | Keep | |
| Prime Hack | Keep | |
| Factors mission | Cut | Lives in `archive/prime_hacker2.html` |
| Terminal tools | Not sure | Round 2 |
| Prime Hack layouts | Not sure | Round 2 |
| Bank & wallet | Keep | |

"Keep" means it stays in the game. Every kept piece will still be improved; nothing is treated as finished.

**Style:** chosen. See `STYLE.md`.

**Success screens:** parked until the list of elements is settled.

## Round 2

| Question | Decision |
|---|---|
| How the game starts | A simple title screen: game name, codename, Start |
| Old start screens | Cut. Moved to `archive/start-screens/` |
| Prime Hack layout | Current. The other two are in `archive/prime-hack-layouts/` |
| Always-visible hint box in Prime Hack | Add |
| Old Factor Vault finale | Don't port it as it is. Reuse its beeps and cell-by-cell fill in the Vault Grid (see below) |
| Tool `PRIME? n` | Add |
| Tool `PRIMES n` | Leave out |
| Tool `HINT` | Add, merged with `RANGE` |
| Tool `FACTOR n` | Leave out (gives the answer away) |

**Smaller features**

| Feature | Decision |
|---|---|
| Roleplay mode in Prime Hack | Keep |
| NEW TARGET button | Cut |
| Quick pair toggle and UNLOCK command | Cut. Students just type two numbers |
| "Show flipped" tick box in Factor Vault | Cut the tick box. Flipped arrays always show |
| Vault Grid 3D VIEW button | Cut. The 3D rise plays automatically |
| Frequency Scan DEV button | Cut from student view |
| Level buttons on student screens | Cut mid-game. Level is chosen once, on the title screen (see Levels below) |
| Vault Grid testing controls | Proposed: hide behind a teacher key (to confirm) |
| Blueprint demo numbers | Proposed: teacher preview only, behind the teacher key (to confirm) |

**The old finale.** The Vault Grid is already Factor Vault's ending: it draws the floor plan of the number that becomes a floor of the Blueprint. The old square-vault finale would be a second, competing picture of the same number. Instead, the parts that worked (the rising beeps and cells filling one by one) go into the Vault Grid's power fill. The corner pop-up in Factor Vault is replaced by moving straight into the Vault Grid.

**Teacher key.** One hidden key combination gives the teacher the tools students don't need: jumping between screens, Vault Grid's layout controls, and previewing the Blueprint with sample numbers.

## Levels

- **Students choose** their level on the title screen, before they start.
- **The teacher can restrict it** with one of three settings:
  - *Student choice*: any level.
  - *Minimum level*: for example L2 or above, so easy can't always be chosen.
  - *Fixed level*: everyone plays the same level.
- **The teacher can see a record** of each codename: which levels they chose, how far they got and when. This lets the teacher encourage a harder level.
- The game can also nudge students itself. Higher levels already pay far more in the bank, and the game could suggest moving up after a strong run.

**Different computers, occasional play.** Students move between computers and won't play often, so losing their level between sessions doesn't matter. Instead:
- At the end of a session, the teacher downloads the record from each computer as a JSON file (teacher key → Download record).
- If the class plays again, the teacher can upload earlier records (teacher key → Load record). Several files can be loaded at once and are combined into one class list.
- No online saving is needed.

## Round 3

Style (see `STYLE.md`):
- Deep teal background `#071418`, soft glow kept
- Steel green `#2fbf8a` for the prime stages; blue stays for the build stages
- Neon highlights: pink and yellow only
- Chakra Petch for headings
- Medium glow
- Drifting laser-line texture
- Text size: 18px, plus a size choice for each learner on the title screen
- Kept: slim banner, amber hint box, sharp corners, red header, green-and-blue logo, green-and-blue build mix
- The roleplay terminal's look (its SCAN output) is liked for a code-flood success screen in the real game

Ideas voted yes (from `IDEAS.md`), grouped into a build order:

1. **Whole-game feel:** one continuous heist, the ORACLE handler, mission briefing, glitch transitions, agent ID card, identity scan, a settings screen (text size is done)
2. **Frequency Scan:** show mistakes, bands that match the level, signal strength, jammer sieve, oscilloscope version
3. **Factor Vault and Vault Grid:** pairs-remaining scanner, reinforced (square) floors, security camera, named rooms, drone flythrough, drag to build
4. **Blueprint:** weak point, hidden room (common factor), plotter print, explore it
5. **Prime Hack:** combination-lock dial, trace meter
6. **Finale and rewards:** finales that match the stage, getaway, badges, loot shop, Most Wanted poster, target map

- Maybe: streak bonus. Concern: big prime pairs are hard, so a lost streak could frustrate
- No: nudge after two misses, three-prime locks, `TRY` command
- Roleplay ideas: parked for now

## Build progress

- [x] Title screen (`index.html`): codename, level choice, teacher level rule, mission record, download and load records
- [x] Teacher PIN on the teacher controls
- [x] Join the route: title → Frequency Scan → Factor Vault and Vault Grid ×3 → Blueprint → Prime Hack
- [x] Include the 3D code locally so the Blueprint works offline
- [x] Mission level used by every game; level buttons, Dev panel, Vault Grid test controls and Blueprint sample numbers are teacher-only
- [x] Vault Grid plays its 3D rise automatically; a wallet per codename
- [x] Agreed style applied to every game: shared colours (blue for build stages, green for hack stages), Inter + Courier Prime, sharp corners, scanline texture
- [x] Prime Hack: always-visible hint strip, `PRIME? n`, `HINT` (merged with `RANGE`), answers are just two numbers, NEW TARGET and the Assist toggle removed for students
- [x] Factor Vault: flipped arrays always shown, tick box removed
- [x] Play-test feedback 1: teal lifted; Vault Grid and Blueprint back to the green-and-blue mix (Factor Vault arrays green too); Prime Hack hint shows only on the first lock and after mistakes; HINT and HELP formatted as boxes; a banner for each new lock; sounds throughout (`shared/sound.js`) with a sound check in the teacher controls
- [x] Success screens in Prime Hack: a card for each cracked lock (the student's primes, the bank draining, bigger each lock); for the final lock an alarm, the buffer charge, a vault door with one bolt per lock labelled with the student's primes, the bank draining into the wallet, an ACCESS GRANTED stamp with rank, and a case file. Hold ENTER to fast-forward the cinematic parts. The old code flood is kept but switched off (`finalFloodSeconds: 0`)
- [x] Agent ranks by vaults breached per codename: Rookie, Field Agent, Senior Agent, Handler, Mastermind, Ghost
- [x] Prime Hack starts in Math mode. Roleplay is its own screen (`modules/roleplay_terminal.html`), opened from the title screen
- [x] Play-test feedback 2: Factor Vault input has one clean highlight, typed digits are bright, and found pairs move to the top so a correct pair in the "wrong" row never lingers; Vault Grid buildings get taller as N grows; Prime Hack lock banner and first hint are smaller; the student's tried pairs are neon pink, products cyan, TOO HIGH/LOW orange, the target yellow, a cracked lock green; buffer charge key presses type out real-looking commands that use the target bank, codename and cracked primes
- [x] Round 3 style: deep background, steel green, Chakra Petch, medium glow, drifting laser lines, pink and yellow neon only, text size per learner
- [x] Round 3 group 1, whole-game feel:
  - One heist per mission: the briefing picks a bank for the level and an operation name; ORACLE, the Blueprint title and Prime Hack all use it, and the case file carries the operation name
  - ORACLE, the handler (`shared/handler.js`): short typed comms in the corner at the start of each stage, after a second mistake, after each lock and at the getaway. Each message plays once per mission; click to skip
  - Briefing (`modules/briefing.html`) between the title and the Frequency Scan: hold SPACE (or press the pad) for the fingerprint identity scan, then ORACLE names the target, the operation and the plan
  - Glitch transitions between stages (`shared/glitch.js`): static and a screen tear, a plain fade with reduced motion
  - Agent ID card on the title screen: codename, agent number, rank, vaults, clearance and progress to the next rank
  - Settings on the title screen, saved per codename: text size, easy-read font (Atkinson Hyperlegible), reduce motion and sound
  - The code flood is back between the buffer charge and the vault door, in the roleplay terminal's style, with the student's cracked primes, the bank and their codename; it ends on FIREWALL DOWN. Hold ENTER fast-forwards it
  - Fixed: Prime Hack's first message said "Target bank: unknown" because the bank loaded after the target was picked
- [x] Round 3 group 2, Frequency Scan:
  - Bands match the level and change each mission: three bands of ten from L1 1–40, L2 31–80, L3 71–150
  - Mistakes: the first wrong verify says how many tags are noise and how many primes are missing; the second shows where (red = tagged noise, pulsing yellow = missed prime)
  - Jammer (a sieve): buttons for the small primes up to √(band end) knock out every multiple of that prime. Two charges a band, so students still reason about the rest
  - Live intercept (oscilloscope) after the three bands: numbers drift across a scope; click the primes before they escape
  - Signal strength: starts at 100%, drops 10% per wrong verify, 4% per missed or wrongly clicked intercept signal, 5% for a band over a minute. 80%+ earns 2 decoder charges for Factor Vault, 60%+ earns 1. A decoder cracks one factor pair
- [x] Sound: the stage-complete sound is now mechanical (motor, three latches, a thunk, air, a low power hum) instead of bells; the lock and identity sounds lost their high pings
- [x] Blueprint assembly: the three floors appear as an exploded view (hovering apart), fill with their rooms, then drop and lock together, ground floor first, with a docking sound and a ring flash. The outer shell rises last and the camera swings round. Reduced motion shows the finished building straight away. Square floors have gold plates and a gold strongroom
- [x] Round 3 group 3, Factor Vault and Vault Grid:
  - Pairs scanner: one dot per pair (gold for the square pair), how many are left, and whether a square pair exists
  - Reinforced floors: square numbers get a gold note ("one pair is a number times itself") and gold vault edges; the square pair's room is the gold STRONGROOM in Vault Grid and the Blueprint
  - Security camera: sweeps over the terminal every 7 seconds. Submitting while it watches raises the alert; three alerts lock the terminal for 5 seconds. Nothing is lost
  - Drag to build (numbers up to 40): a tray of N columns × √N rows; drag out a rectangle of exactly N squares to enter that pair
  - Named rooms in Vault Grid: CORRIDOR (1 × N), SERVICE TUNNEL (long), OFFICE, SERVER ROOM (near square), STRONGROOM (square)
  - Drone flythrough after the 3D rise: a drone camera sweeps the floor and logs each room
- [x] The original small code flood (fast random code with pink, yellow and red flecks, and a sweeping progress bar) is back as the last stage before the vault door, after the breach channel. It now ends on ENCRYPTION BROKEN so ACCESS GRANTED stays for the stamp
- [x] Round 3 group 4, Blueprint (plus lit windows and the floor quiz):
  - Plotter print: the three floor plans draw themselves line by line on blueprint paper before the 3D build
  - Lit windows: each room has a rows × b columns of windows, which light up floor by floor, so every room on a floor has N lights
  - Weak point: the floor with the fewest factor pairs glows red; ORACLE names it as the way in
  - Hidden vault: if the three numbers share a factor above 1, a gold basement vault rises, with the highest common factor explained
  - Explore: drag to turn the building, hover a room for its name and windows, click a floor to pull it out and list its pairs
  - Floor quiz: one question (most rooms, weak point, odd number of factors, highest common factor or rooms on a floor) before Prime Hack. A right answer adds 10% to the first heist's haul
- [x] Round 3 group 5, Prime Hack:
  - Combination dial beside the terminal: a correct pair spins the dial right to the first prime and left to the second, sets both tumblers with a click, and the shackle springs open. A wrong pair turns the dial, the tumblers show red and the lock jams
  - Trace meter: +15% (L1), +18% (L2) or +20% (L3) for a wrong product, two thirds of that for a non-prime, and +1% every 5 seconds on a lock. A cracked lock takes 15% off. At 50% ORACLE warns, at 75% the meter pulses with an alarm, and at 100% security swaps the lock for a new number and trace drops to 30%. No money or progress is lost. HINT and PRIME? never add trace
- [x] Round 3 group 6, finales and rewards:
  - Target map (briefing, after the identity scan): a city map with three districts, one per level (Old Town L1, Harbour L2, Financial District L3). Students pick one of the four banks at their clearance; higher banks show which level they need. Banks this codename has already hit are marked
  - Laser corridor (factor-half finale, after the third Vault Grid floor): tiles 1 to N, where N is the ground floor. Step on the factors of N in order; anything else is a laser hit with the division shown. No hits earns Laser Dancer
  - Getaway (after the vault opens): three "prime or not?" calls against a timer (8, 7 or 6 seconds by level) while the police close in. Always escapes; 3 out of 3 adds 5% to the haul
  - Server blackout: the prime-half finale on every second run. The lights go out; sweep a torch over 12 servers and shut down the primes (the student's own cracked primes are among them); composites are decoys
  - Badges (13), saved as events in the session record so they travel in record files: First Breach, Clean Sweep, Interceptor, Square Hunter, Laser Dancer, Treasure Hunter, Intel Analyst, Prime Sniper, Ghost Protocol, Wheelman, Lights Out, Speed Demon, High Roller. Shown when earned, on the ID card, in the case file and on the poster
  - Safehouse shop (title screen): terminal colours, vault door skins and ID card frames bought with the codename's wallet. Prices run from £10,000 to £1,000,000, so the best items need higher levels
  - Most Wanted poster (teacher controls → Preview): the class's top agents from the records on that computer, ranked by bounty, vaults or badges, with a full-screen button for the board
  - Ranks now count every vault breached, including extra runs in the same mission

## Success screens (first pass)

Every idea is a "maybe until I see it". Build these as prototypes to look at before deciding:

- Yes, if it looks right: vault door that opens, bank balance draining, tension before the release (alarm), rank-up stamp and codename, case file at the end, fast-forward on repeat plays
- Maybe: different finales each run (they must still match the stage the student is at), more doing and less watching, a proper sound sting, a real ending for Factor Vault

## Play-test feedback 3

- [x] Frequency Scan restyled to match the identity scan: a heading strip above the panel, corner brackets, Chakra Petch titles, glowing meters, larger number tiles and a slim log line instead of the boxed console
- [x] Live intercept rebuilt: numbers ride the scope's trace as peaks, with phosphor trails, a live frequency and gain readout, and lock-on brackets. 16 to 20 signals in about 12 seconds, getting faster as the round goes on (it was about 25 seconds)
- [x] Getaway: the cartoon van and police car are replaced by a live tracking map (generated streets and route, police units flashing behind, the gap in metres, radio chatter)
- [x] Between cracked locks, a short burst of generated code (bolt released with the student's primes, key rotation, hex, the next lock's modulus) runs before the next lock's banner


## Play-test feedback 4

- [x] Live intercept at L1 slowed down (14 signals, each on screen about 5.5 seconds); L2 and L3 unchanged
- [x] Buffer charge: once a stage is full, extra keys no longer type code; PRESS SPACE nudges instead
- [x] Prime Hack hint only appears after three wrong tries on a lock, and sits outside the terminal: in the left margin on wide screens, under the lock on narrower ones. No "Lock cracked" hint any more
- [x] A cracked lock now shows a holographic "WALL n BREACHED" banner that zooms in, with a KEY CHECK and ACCOUNT window either side (`shared/holo.js`)
- [x] Final breach: four holographic windows open across the screen (target profile, lock matrix, trace monitor, blueprint) while the breach runs
- [x] Sounds: the stage-change glitch lost its falling "boing" tone; Start / Accept mission is now a mechanical switch and relays instead of a rising sweep and bells; the encryption handshake has a low drone and a data rattle
- [x] Fixed: pressing Enter again while a lock was opening could crack it twice

## Play-test feedback 5 (screenshot review)

- [x] Title screen calmer: the agent ID card sits in the middle and four holographic panels project from it (clearance level, agent file, mission route, safehouse). The tagline, the long route strip and the separate roleplay box are gone. On narrow screens the panels stack under the card
- [x] Intercept: clicking near a number locks it (within about 70px), and the numbers are bigger
- [x] Factor Vault: arrays are packed together and always fit inside the panel. The drag tray is a bigger, centred grid (12 × 6 at N = 8), so it takes thought to place the rectangle
- [x] Sounds throughout are flat mechanical tones (relays, hums, buzzes) with no pitch slides or bells
- [x] Blueprint-style sweep transitions between Factor Vault, Vault Grid and the Blueprint
- [x] Vault Grid: every room is labelled (name and a × b), has a door onto the corridor side, and each floor has a fire exit. The drone highlights each room as it logs it, then a holographic FLOOR ANALYSIS rates the floor WEAK, STANDARD or SECURE by its number of factor pairs
- [x] Blueprint rebuilt from the student's own Vault Grid floors (same rooms, doors and exit), so it matches what they built. Storeys are spaced with a slab between each, windows are dimmer, the camera is closer, and the weak point is the floor with the fewest factor pairs
- [x] The plotter step is skipped (kept in the code, may come back as a holographic window)
- [ ] Camera cone in Factor Vault: to be explained through the narrative

## Narrative decisions

- Hybrid heists: the crew steals a physical item from the vault while the student siphons funds digitally
- Mission types to build first: bank, tech company, museum. Each target is "hiding something", which is the reason to break in
- ORACLE stays the only voice on the radio for now (a named crew member is still an open question)
- Laser corridor: out of the route, kept in the code and previewable from the teacher controls. Its place in the story is to be decided
- Next: finish the 3D floor-plan sequence, then write the bank mission script, then build the tech company and museum variants

## Play-test feedback 6 (3D sequence review)

- [x] Drag tray: each array is drawn both ways round (3 × 8, then 8 × 3) before the pair counts. The tray is deeper so most pairs fit turned round; a square only needs drawing once, and a pair too tall to turn round (1 × 24) says so and counts
- [x] Vault Grid sounds: the laser, seal and fill ticks are gone. One soft scanner hum covers the build, with a quiet plotter tick per room
- [x] A blueprint laser bar sweeps the site while the rooms are drawn
- [x] Wider stage, so the room labels at the sides are no longer cut off
- [x] One building: everything that isn't a room is shaded as corridors and open floor, and in 3D the plate has a floor and a low outer wall. The legend now says what each colour means
- [x] Sharp text: room labels in 3D are ordinary text placed over the view (they were painted on the tilted canvas, which blurred them), nudged apart so they never overlap. Holographic windows swing in at an angle and settle flat. The title panels are flat
- [x] 3D floor is bigger in its stage
- [x] Blueprint fits on one screen: floor labels on the left with more room, the building in the middle, intel down the right, and the Prime Hack button always visible (enabled once the route is planned)
- [x] Recon: a sheet of light rises up the building and reveals the stairs on every floor, a guard in each room (red dots), the CEO on the top floor and the key on the weak floor
- [x] Route: the agent is a glowing dot on the street. A dashed route with arrows is drawn in through the ground-floor fire exit, up the stairs to the weak floor and across to the key, then the dot walks it

## Play-test feedback 7

- [x] Drawing arrays: the drawing grid now fills the left panel (no floating tray over the arrays). Every array drawn stays on the grid in its own colour with its label, both ways round; the finished arrays show on the right. "Clear drawings" empties the board. The camera doesn't count drawn pairs
- [x] Room names: 1 × N rooms are ARCHIVES and long thin rooms are SERVER ROWS; the space between rooms is the corridor
- [x] Floor analysis: three flat holo windows (no tilt, sharp text): floor analysis, the factors of N in order with their pairs, and a SQUARE CHECK (is N square? which squares sit either side?) so square numbers show on every floor
- [x] Blueprint: after the floors lock together, the outside of the building fades in and out: walls with windows and a flat or pitched roof (fixed per target)
- [x] Rooms have ceiling lights (a × b panels on top) instead of windows on inside walls
- [x] Recon: the middle shaft is a LIFT (guarded). Fire stairs zigzag up the outside wall by the fire exit, and the route uses them: street → fire stairs → fire door on the weak floor → key
- [x] You, your route and its arrows are blue
- [x] The Prime Hack button is bigger and pulses when ready. The floor quiz sits beside the building so it can be checked. Then the student types anything to upload the breach kit (a filling bar; extra keys don't type once full) and presses ENTER to start the hack

## Play-test feedback 8

- [x] Drawing arrays works at every level (it was switched off above N = 40, so L2 floors like 48 and 64 couldn't be drawn). The grid fits the panel; a pair too long to draw (1 × 64) says so and is typed in the table
- [x] ORACLE's question comes up by itself once the route is planned, beside the building. Answering it opens the protocol typing straight away; ENTER then starts the hack. The button only appears if the quiz was already done
- [x] Drone camera over each floor is about twice as slow
- [x] Live intercept at L2 slowed (16 signals, about 5 seconds on screen each); L3 slowed a little too
- [x] Teacher SKIP button next to TEST (and Ctrl+Shift+K): cracks the current prime pair in Prime Hack, fills every factor pair in Factor Vault, solves the scan band, skips the identity scan, shows the next button in Vault Grid
- [x] Sound board picks: right answer = two flat confirm tones; a room filling = data trickle; a room locking = magnetic clamp; docking, recon scan and wrong answer unchanged. Hologram windows now use a quick zoom beep (from the note: "a higher pitched beep, like a zoomed sound")

## Bank heist rotation: the Twist Lab

- Decided: no new heists yet. The bank heist gets variety instead: Factor Vault and Prime Hack stay, and at five points each mission picks one task (map: scan band 2, Factor Vault floor 2, a new "getting in" step, Prime Hack lock 3, the finale)
- [x] Built as standalone pages first, so each can be tested away from the mission: `modules/twist_lab.html` (also linked from the teacher controls) opens each at L1, L2 or L3
  - Honeypot squares (tag primes; square-number channels trip the alarm)
  - Cube-number relays (find the cubes; each drawn as an n × n × n cube; the cube table appears after two mistakes)
  - Motion-sensor sieve (Sieve of Eratosthenes 1–50/100/150; the last prime's multiples found by hand)
  - Prime floor trap (four readings, one prime: prove the others with a factor pair)
  - Deposit-box walls (which factor-pair arrays fit a wall of a set size, either way round)
  - Guard patrols (two timetables, the LCM, then a safe gap to open the door)
  - Product-and-clue lock (product of two primes plus a sum, difference or range clue)
- [x] Shared frame for every twist (`shared/twist.js`): level switch, alarm meter (three strikes), ORACLE, result screen with Play again / Twist Lab / Continue (for when they join the mission), teacher SKIP
- [x] Prime Hack accepts `?finale=blackout` or `?finale=getaway` to test a finale
- [ ] Next: wire the rotation into the mission (one pick per point, no repeat for the same agent, teacher pin, twists logged in the record)

## Twist review and levels

- [x] MENU tab on every game screen (left edge, halfway down); asks before leaving because the stage's progress is lost
- [x] Prime Hack levels rebalanced. Each lock has a product cap and the smaller prime stays small, so trial division is short:
  - L1: products up to 35, 55, 77, 100 across the four locks (smaller prime at most 7)
  - L2: up to 120, 160, 230, 300 (smaller prime at most 13)
  - L3: up to 300, 400, 550, 700 (smaller prime at most 19). It was up to 2279 (43 × 53)
  - Level cards now say primes up to 19 / 29 / 41
- Review notes on the twists (to plan before building):
  - Too many prime tasks: add square-number and cube-number tasks and a prime factorisation one
  - Honeypot squares should be about finding square numbers; the product-and-clue lock leaves the bank (maybe another heist)
  - Cube relays: L1 should build cubes to discover them (differentiate the task by level, not just number size)
  - Deposit-box walls: loved; L1 should drag to experiment; "wall or basement" story unclear
  - Instructions are too long to take in quickly; narrative first, then function, then visuals
  - Teacher chooses which twists can appear (e.g. leave out prime factorisation until it's taught)

## Prime Hack feedback and twists 1–5

- [x] Prime Hack: the padlock is replaced by a KEY DECODER (two prime registers that scramble and settle, a status line, hex readout)
- [x] New BREACH bar in the orange-yellow gradient that fills one step per cracked lock, above the trace bar
- [x] No holograms in Prime Hack: each unlock is a "WALL n BREACHED" block in the terminal with the gradient bar filling as the account drains, then the short code burst. The final-breach holograms are gone
- [x] One code flood per run, taking turns between the big breach channel and the small handshake box
- [x] Twists, per the review:
  1. Honeypot squares is now **Square channels** (find the square numbers). The product-and-clue lock leaves the bank ("saved for other heists")
  2. New **Square strongroom** (Factor Vault) and **Factor-tree lock** (Prime Hack lock 3, prime factorisation)
  3. Tasks change by level: cubes (L1 build from blocks, L2 spot, L3 spot + cube root); squares (L1 with the first one shown, L2 among near misses, L3 + square root); strongroom (L1 drag squares, L2 can it be square, L3 side length); walls (L1 tap to try a rectangle on the wall and turn it); factor tree (L3 writes powers)
  4. Every twist has a one-line GOAL and an example; the story is ORACLE's message. "Prime floor trap" is now "Fake floor"; deposit-box walls is "fits / doesn't fit" (no basement)
  5. Teacher controls: "Twists in the bank heist" tick boxes; the Twist Lab marks any that are switched off
- [ ] Next: wire the rotation into the mission, using the ticked twists

## Review round 8 (by level)

- [x] Title screen shows the last agent again after a run (codename and level filled in, "Welcome back")
- [x] Prime Hack: "wall breached" block is a compact line with a thin bar; key decoder is larger; TRACE and BREACH have plain labels ("security finding you", "walls down") and hover explanations
- [x] Factor tree: one click per split. Each number still to split shows ÷2 ÷3 ÷5 ÷7 (and 11, 13 at L3); "a × b" still lets you type a pair
- [x] Square strongroom L3: drag along a line to set the side length instead of typing
- [x] Deposit-box walls L1: drag out rectangles on the wall to experiment; tapping a rectangle still tries it (scaffold only at L1)
- Proposed (awaiting decision): merge square channels + square strongroom into one square task (draw squares, then find them on a grid) and do the same for cubes (L1 build, L2 draw layers, L3 cube root, each followed by finding cubes on a grid); narratives for each twist

## Review round 8 decisions (built)
- Square channels and the square strongroom are one twist (vault point, `strongroom`). Step 1 builds the square room (L1 drag, L2 "can it be square?", L3 side length by strip or typing). Step 2 finds the live pressure plates, which are the square numbers (L1 1–48, L2 to 150 among near misses, L3 to 400). Squares built in step 1 are already marked. `twist_squares.html` now redirects here, and `squares` has left the teacher list.
- Cubes are the ceiling relays of the target floor. Step 1: L1 builds with + and −, L2 draws a square layer on a grid and stacks layers, L3 gives the cube root (strip or typing) or spots the dummy that isn't a cube. Step 2 finds the cube numbers on the relay board. A ceiling-circuit plan lights a wire per relay, and the floor's cameras go dark when all are powered.
- The factor-tree lock is the key room's door on the weak floor. Each finished tree releases one of two bolts, then the door slides open.
- Deposit-box walls: when a wall is sorted, the rectangles that fit slide in as banks of boxes and the key box glows gold. It is the only bank that fits turned round, or else the one closest to a square.

## Review round 9 (Factor Vault to 3D build, Prime Hack)
- Prime Hack: nothing is taken from the account while the locks are cracked. The terminal shows one plain line per wall, and the orange BREACH bar stays on the right.
- After the code flood comes a timed transfer screen. A red bar shows the time before security cuts the line, and a green bar shows the funds. The share is 100% at 20 s a lock or faster, falling to 40% at 80 s. The blackout, when it happens, adds 15%.
- The server blackout appears about one run in three. The vault door is out of the bank heist and saved for the museum.
- Then ORACLE says "GET OUT, GET OUT, GET OUT", followed by the getaway. The getaway asks yes/no about prime, square, and cube (cube at L3). The car moves continuously, and police-radio crackle plays.
- The buffer is continuous (no SPACE between stages), with terminal code running behind it. The handshake flood has the same kind of sound as the breach channel.
- Adaptive lock difficulty: all twelve lock bands sit on one ladder (L1, L2 then L3), and a run uses four in a row. New agents start at step 1 (L1), 3 (L2) or 5 (L3). An average of 12 s a lock or less with at most 1 wrong answer moves the next run up two steps. An average of 25 s or less with at most 2 wrong moves it up one. An average of 60 s or more, or 5 or more wrong, moves it down one. The step is stored per codename (`primenet_hacktier_v1`), and the case file shows it with the time per lock. Teacher tools can show or change it, and `?tier=n` sets it for testing. The title-screen level still sets the rest of the game.
- Floor plan: each room's unit squares stay on its roof while the floor tilts, fade, then the rooms rise (2.6 s). The drone's laser sweeps across and leaves the squares faintly visible. The holograms carry agent intel instead of maths (shift rota with the shift-change gap, a CCTV feed, a keycard log). Each opens large in the middle, then zooms out to its place.
- 3D build: the exploded floors sit lower and closer together, so floor 3 is visible. ORACLE's "There it is" line starts as the building's outline appears.
- Parked: a spatial "fit the arrays" puzzle (perhaps a corrupted blueprint), avoiding 1 × N. Also teacher-controlled hints, because some hints give answers away too early.
