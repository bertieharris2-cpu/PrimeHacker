# PRIMENET style

Chosen in review round 1, then adjusted in round 3. Every screen should use these values, with no one-off colours or fonts, so the look stays consistent.

| Choice | Decision | Where it came from |
|---|---|---|
| Background | Deep teal (`#071418`) with a soft teal glow | Round 3 |
| Main colour | Blue (`#4aa3ff`) for the build stages, steel green (`#2fbf8a`) for the hack stages | Blue from Factor Vault; steel green chosen in round 3 |
| Fonts | Chakra Petch for headings, labels and buttons; Courier Prime for numbers and terminal text. Inter is the fallback when a computer is offline | Round 3 |
| Corners | Sharp | `Style_Root.txt` |
| Background texture | Drifting laser lines (still when the computer asks for reduced motion) | Round 3 |
| Glow | Medium | Round 3 |
| Text size | Large (18px) by default. Each learner can pick Small, Medium, Large or Extra large on the title screen; it's saved for their codename on that computer | Menu and Frequency Scan, for dyslexic learners; size choice added in round 3 |
| Kept from round 1 | Slim lock banner, amber hint box, sharp corners, red Prime Hack header, green-and-blue logo | Round 3 |

Which stages are which:
- **Build (blue):** Factor Vault, Vault Grid, Blueprint. The interface, lasers and labels are blue; the arrays and buildings are **green**, the mix from the original Vault Grid.
- **Hack (green):** Frequency Scan, Prime Hack, the finale

## Where it lives

The values are in `shared/primenet.css`, which every screen loads. Each screen sets its phase on the `<html>` tag (`class="phase-build"` or `class="phase-hack"`), and `--accent` follows. Canvas and 3D drawing can't read CSS, so the Vault Grid and Blueprint use the same blue written out directly.

## Style code

```css
:root{
  --bg-primary: #071418;
  --bg-panel: rgba(6,18,22,.78);
  --line: rgba(17,90,110,.6);
  --accent-build: #4aa3ff;   /* factor stages: Factor Vault, Vault Grid, Blueprint */
  --accent-hack:  #2fbf8a;   /* steel green */   /* prime stages: Frequency Scan, Prime Hack, finale */
  --accent: var(--accent-build); /* each screen sets this to its own phase */
  --text-primary: rgba(235,255,248,.94);
  --text-muted: rgba(235,255,248,.64);
  --ok: #2fbf8a;
  --warning: #f2c14e;
  --danger: #ff6b6b;
  --font-ui: "Chakra Petch", "Inter", system-ui, sans-serif;
  --font-mono: "Courier Prime", ui-monospace, monospace;
  --radius: 0px;
  --glow-strength: .28;
  --font-size: 18px;
}
/* background texture: laser lines drifting side to side */
repeating-linear-gradient(120deg, rgba(var(--accent-rgb),.06) 0 1px, transparent 2px 44px);
```

## Sound

All sounds live in `shared/sound.js`, generated in code. One on/off switch (title screen) and one volume (teacher controls → Sound check) cover the whole game. Big moments sound mechanical, like a real vault: motors, metal latches, a heavy thunk and a low power hum. No high pings (feedback: they didn't sound realistic). A climbing bell still marks each correct answer in a row.

## Handler messages (ORACLE)

Short, one or two sentences, in the handler's voice. Name the student by codename and the target bank where it fits. Messages sit in the bottom-right corner and never block the game. The target and codename go in bright yellow in the briefing.

## Neon highlights (Prime Hack)

Used only for the student's own working, so they can look back at what they tried. Round 3 cut it to two colours: **pink** `#ff4fd8` for the pair they typed and **yellow** `#ffe14d` for the target. **Red** `#ff6b6b` still marks a number that isn't prime. Everything else stays in the normal text colour.
