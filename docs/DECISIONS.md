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
- [ ] Round 3 groups 2–6: see the build order under Round 3

## Success screens (first pass)

Every idea is a "maybe until I see it". Build these as prototypes to look at before deciding:

- Yes, if it looks right: vault door that opens, bank balance draining, tension before the release (alarm), rank-up stamp and codename, case file at the end, fast-forward on repeat plays
- Maybe: different finales each run (they must still match the stage the student is at), more doing and less watching, a proper sound sting, a real ending for Factor Vault
