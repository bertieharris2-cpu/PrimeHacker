# How the three levels differ

A record of what changes between **L1 (Recruit)**, **L2 (Operative)** and **L3 (Specialist)**, stage by stage in story order. Written in Round 29, from the code as it is now (two twists per mission).

## Choosing a level
- The pupil picks a level on the title screen. It stays fixed for the whole mission; pupils can't switch level inside a game.
- **Teacher rule** (teacher settings):
  - *Any level* (the default).
  - *This level or higher.*
  - *Only this level.*
  - Levels a pupil can't pick show "Locked by your teacher". If only one level is allowed, it's picked for them.
- **Nothing has to be unlocked.** After a pupil's first completed mission, the title screen suggests the next level up ("Ready for L2? Bigger vaults, bigger rewards.").
- **Teacher record table:** flags a codename that has played two or more missions, all at L1 ("might be ready for more").

## At a glance

| Stage | L1 | L2 | L3 |
|---|---|---|---|
| Map | Old Town, low security | Harbour, medium | Financial District, high |
| Frequency scan: bands | 1–40 | 31–80 | 71–150 |
| Frequency scan: live intercept | 2–40, 14 peaks, slowest | 20–80, 16 peaks | 50–150, 18 peaks, fastest |
| Factor Vault | Drawing grid, plus a nudge when stuck | Drawing grid | Type the pairs, decrypt window |
| Corrupted blueprint | 3 patches, 1 L-room, 2 rooms placed for you | 4 patches, 2 L-rooms | 5 patches, 3 L-rooms, some arrive flipped |
| Guard patrols | Minutes 1–30, small gaps | Minutes 1–50 | Minutes 1–60, gaps that share a factor |
| Fire door stopwatch | Widest window | Narrower | Narrowest |
| Ceiling relays | L1 content | Same as L1 | Same as L1 |
| Key room door | 2 bolts, numbers to 60 | 2 bolts, numbers to 180 | 3 bolts, numbers to 240, powers |
| Deposit boxes | Totals to 24, the Venn sorts itself | Totals to 48 | Totals to 96 |
| Strongroom code crack | L1 content | Same as L1 | Same as L1 |
| Prime Hack locks | Adapts to the pupil (starts easiest) | Starts 2 rungs up | Starts 4 rungs up |
| Prime Hack trace | Slowest | Middle | Fastest, harshest |
| Getaway chase | 2–50, 8 s | 20–100, 7 s | 50–200, 6 s, cubes too |
| Detection meter | Most forgiving (×0.8) | Normal (×1) | Strictest (×1.15) |
| Finder's fee | 10% | 15% | 20% |

---

## 1. Briefing (the map)
- Only the targets in the pupil's level can be picked; the others say "needs clearance Lx".
- Targets:
  - **L1:** Rivercross Utilities, Northwick Transit, Sentinel Finance, then the finale **Haven Council**.
  - **L2:** Ember Freight, Crystal Holdings, Ironclad Alarms, then the finale **Pinnacle Corp**.
  - **L3:** Helix Dynamics, Nexus Global, Kronos Finance, then the finale **Atlas Prime**.
- No maths here.

## 2. Intercept: Prime Frequency Scan
**Band scan:** three bands of ten numbers, picked at random from the level's range.

| | L1 | L2 | L3 |
|---|---|---|---|
| Range | 1–40 | 31–80 | 71–150 |
| Jammer offers (multiples of) | 2, 3 (and 5 above 25) | up to 7 | up to 7 (and 11 from 130) |

**Live intercept:** number peaks travel across the screen; pupils click the prime ones. Half the peaks are prime.

| | L1 | L2 | L3 |
|---|---|---|---|
| Numbers | 2–40 | 20–80 | 50–150 |
| Peaks | 14 | 16 | 18 |
| Time to cross the screen | 5.6 s | 5.0 s | 4.4 s |

**The same at every level:**
- Help after a wrong check: first counts, then the exact cells are highlighted.
- Peaks speed up a little as the round goes on.
- The suspicion meter closes the channel for 4 seconds when full; it never fails.

## 3. Decrypt: Factor Vault (three floors)
- **Floor numbers are the same at every level.** Each mission has its own building with fixed floors, easiest first (decided in Round 22):

  | Mission | Floors |
  |---|---|
  | The quiet way in | 20, 36, 48 |
  | Lights out | 24, 30, 40 |
  | Plan B | 18, 36, 48 |
  | The quiet way in: deposit box | 16, 30, 42 |

- **The help changes with the level:**
  - **L1:** the drawing grid, plus a nudge after 25 seconds stuck. The nudge names a number to try, never the answer ("Try 3: does 3 go into 36 exactly? Count up in 3s").
  - **L2:** the drawing grid, no automatic nudge.
  - **L3:** no drawing grid, so pupils type the pairs. A **decrypt window** counts down (25 seconds per pair, so 75–125 seconds). When it runs out, the detection meter jumps and ORACLE buys another minute; it never fails.
- **The same at every level:** a gentle detection meter that drains while pupils think, and an ORACLE tip after three wrong tries.

## 4. The building: Corrupted blueprint (The quiet way in: deposit box)
The floor is always 16 × 11. It's trial and error at every level: a room goes anywhere it fits, and after three dead ends the room in the way glows.

| | L1 | L2 | L3 |
|---|---|---|---|
| Blacked-out patches | 3 | 4 | 5 |
| L-shaped rooms | 1 | 2 | 3 |
| Rooms to place | 8–12 | 9–13 | 10–14 |
| Extra | 2 rooms start already placed | none | L-rooms arrive flipped half the time |

## 5. The plan: Guard patrols (The quiet way in)
Pupils record two guards on CCTV, find how often each passes, mark the multiples, and find the first minute both are at the blind spot (the LCM). The steps are the same at every level; the numbers grow.

| | L1 | L2 | L3 |
|---|---|---|---|
| Minute grid | 1–30 | 1–50 | 1–60 |
| Guard pairs (LCM) | 3 & 4 (12), 4 & 5 (20), 3 & 5 (15), 4 & 6 (12), 2 & 5 (10) | 4 & 6 (12), 3 & 8 (24), 4 & 7 (28), 5 & 6 (30), 5 & 7 (35), 5 & 8 (40), 6 & 8 (24), 6 & 7 (42) | 6 & 9 (18), 6 & 10 (30), 8 & 10 (40), 8 & 12 (24), 9 & 12 (36), 10 & 12 (60), 4 & 10 (20), 5 & 12 (60), 4 & 11 (44) |

At L3 most pairs share a factor, so the LCM isn't just the two numbers multiplied.

## 6. The operation
**Fire door stopwatch (The quiet way in).** Pupils press SPACE at the planned minute.
- How close to the planned minute the press must be: within about 1.1 seconds at L1, 0.7 at L2, 0.4 at L3.
- Too early fills the meter; too late restarts the stopwatch. It never fails.

**Ceiling relays (Lights out, Plan B).** **L1 content at every level for now** (parked: L2 and L3).
- Everyone builds 8, 27 and 64, cracks n × n × n, and answers for 1, 5 and 10 wires.
- Only the detection meter's strictness changes.

**Key room door (Lights out).**

| | L1 | L2 | L3 |
|---|---|---|---|
| Bolts | 2 | 2 | 3 |
| Numbers | 24, 36, 40, 54, 56, 60 | 60–180 (e.g. 72, 90, 126, 168) | 72–240 (e.g. 144, 200, 216) |
| Prime buttons | Bolt 1 always has them; later, after one wrong try | After one wrong try | After one wrong try, and 11 and 13 are added |
| Powers | No | No | Yes: 2^3 × 3^2 × 5, or the long way |

**Deposit boxes (Plan B, The quiet way in: deposit box).** Two walls of boxes. Pupils check which factor pairs fit, sort the factors of both walls into a Venn diagram, and pick the highest common factor (the key box).

| | L1 | L2 | L3 |
|---|---|---|---|
| Box totals | 12, 16, 18, 20, 24 | 30, 36, 40, 45, 48 | 60, 72, 84, 90, 96 |
| Key box (HCF) | 2, 4, 6 or 8 | 3 to 15 | 6, 12, 18, 24 or 30 |
| The Venn | Sorts itself | Pupils tap each number in | Pupils tap each number in |
| Extra help | Tap a pair to preview it on the wall | none | none |

**Strongroom code crack (The quiet way in).** **L1 content at every level for now** (parked: L2 and L3, and the nth-term talk).
- The pattern rotates from the ticked list, newest first.
- Only the detection meter's strictness changes.

## 7. The vault: Prime Hack
**The four locks** (two primes multiplied). Since Feedback round 9 the locks **adapt to each pupil**. Twelve difficulty rungs run from L1's easiest to L3's hardest, and each run uses four rungs in a row.
- **Where a new codename starts:** L1 at rung 1, L2 at rung 3 (two L1 locks, then two L2 locks), L3 at rung 5 (L2's numbers).
- **After each run:** fast and accurate moves up 1–2 rungs; slow (a minute a lock) or five wrong moves down 1.
- Example lock numbers: a new L1 pupil's first lock is one of 6, 10, 14, 15, 21, 35. The top rung reaches 377–697 (e.g. 13 × 41 = 533).

**The trace meter** (no time limit; a full trace swaps the lock for a new one):

| | L1 | L2 | L3 |
|---|---|---|---|
| Rises by itself | 1% every 5 s | 1% every 5 s | 1% every 3.5 s |
| Wrong product | +15 | +18 | +24 |

**The same at every level:**
- TOO HIGH / TOO LOW after a wrong answer.
- Hints from the third wrong try.
- The HINT and PRIME? commands.

**Getaway chase** (loud missions: Lights out, Plan B). Three yes/no calls.

| | L1 | L2 | L3 |
|---|---|---|---|
| Numbers | 2–50 | 20–100 | 50–200 |
| Time per call | 8 s | 7 s | 6 s |
| Questions | prime, square, prime | prime, square, prime | prime, square, **cube** |

All three right earns the clean-getaway bonus (+5% of the fee).

**Server blackout:** teacher-only since Round 29 (the Twist Lab or the TEST button). Its numbers follow the getaway ranges.

## 8. Money and rewards
**Finder's fee:** 10% / 15% / 20% of the target's hidden sum. The rest goes back to the victims.

| Level | Target | Hidden sum | Fee | Repeat run (half) |
|---|---|---|---|---|
| L1 | Rivercross Utilities | £240,000 | £24,000 | £12,000 |
| L1 | Northwick Transit | £300,000 | £30,000 | £15,000 |
| L1 | Sentinel Finance | £420,000 | £42,000 | £21,000 |
| L1 | **Haven Council (finale)** | £500,000 | £50,000 | – |
| L2 | Ember Freight | £480,000 | £72,000 | £36,000 |
| L2 | Crystal Holdings | £360,000 | £54,000 | £27,000 |
| L2 | Ironclad Alarms | £600,000 | £90,000 | £45,000 |
| L2 | **Pinnacle Corp (finale)** | £720,000 | £108,000 | – |
| L3 | Helix Dynamics | £1,500,000 | £300,000 | £150,000 |
| L3 | Nexus Global | £1,200,000 | £240,000 | £120,000 |
| L3 | Kronos Finance | £900,000 | £180,000 | £90,000 |
| L3 | **Atlas Prime (finale)** | £3,000,000 | £600,000 | – |

**The finale:**
- **Unlocks:** after the level's other three targets are done (the teacher key opens it early).
- **Return the funds:** the fee, plus the first time only:

  | Level | Boss | Title on the ID card | Trophy |
  |---|---|---|---|
  | L1 | Councillor Marlowe | PRIMENET Field Support | Framed front page |
  | L2 | Ms Ashcroft | PRIMENET Senior Specialist | PRIMENET nameplate |
  | L3 | Director Sable | PRIMENET Head of Technical Operations | Case Closed trophy |

- **Take it all:** the whole sum (£500,000 / £720,000 / £3,000,000), with no title or trophy. "Replay the finale" takes the money back out.

**Shop:** not locked by level. The dearer items are just out of reach until pupils earn bigger fees. Ranks and badges don't depend on the level.

## 9. Warm-up: Motion-sensor sieve (title screen, not in missions)

| | L1 | L2 | L3 |
|---|---|---|---|
| Sensors | 1–50 | 1–100 | 1–120 |
| Multiples switched off for you | All of them | Only for 2 and 3 | Only for 2 |
| Already sieved at the start | none | 1 prime (pupil names it) | 2 primes (pupil names both) |

## The detection meter (every twist and the plan)
- Guessing fills it; thinking time doesn't. A wrong answer within 4 seconds of the last counts double or more ("TOO QUICK: THINK FIRST").
- In the operation, a full meter trips that twist's alarm; the mission still carries on.
- **Strictness:** L1 ×0.8, L2 ×1, L3 ×1.15.
- **Mistakes, spaced out, to trip a twist:** 6 at L1, 5 at L2, 4 at L3.
- **Quick-fire guesses to trip it:** 3 at L1 and L2, 2 at L3.
- In the plan and the scan the meter is gentle: it drains, and a full meter is only a short pause.

---

## Gaps found while writing this (nothing changed yet; for Bertie to decide)
1. **The level cards promise "numbers up to 24 / 64 / 100"**, but Factor Vault floors are the same at every level (each mission's building is fixed). Either change the card wording, or give each building different floors per level.
2. **Prime Hack locks follow the pupil, not the level they picked.** The rung is saved per codename across all levels, so after the first run the chosen level no longer changes the locks. A new L3 pupil starts on L2's numbers.
3. **Ceiling relays and the strongroom code crack are L1 at every level** (parked, as agreed).
4. **Key room door: the detection meter is always at L1 strictness.** It's set up before the page reads the level. A one-line fix.
5. **Prime Hack HINT** lists prime pools for the chosen level, not the rung actually being played, so they can be off for pupils who have moved up or down.
6. **L3 Factor Vault:** when the decrypt window runs out and the meter jumps to 100%, it can stick full for the rest of that floor without the usual short pause.
7. **Getaway wording:** the screen says "+5% on what we recovered", but the bonus is 5% of the fee.
8. **Half-fee repeat runs reset if Prime Hack is reloaded** (or opened with FULL SCREEN), so the next run pays the full fee again.
9. **Two badges can't be earned now:** Intel Analyst (the blueprint quiz is parked) and Treasure Hunter (the hidden vault was removed).
