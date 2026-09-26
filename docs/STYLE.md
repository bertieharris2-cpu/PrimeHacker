# PRIMENET style

Chosen in review round 1. Every screen should use these values, with no one-off colours or fonts, so the look stays consistent.

| Choice | Decision | Where it came from |
|---|---|---|
| Background | Deep teal | `Style_Root.txt`, Prime Hack |
| Main colour | Blue for the build stages, green for the hack stages | New: combines Factor Vault's blue and Prime Hack's green |
| Fonts | Inter for headings, labels and buttons; Courier Prime for numbers and terminal text | `Style_Root.txt` |
| Corners | Sharp | `Style_Root.txt` |
| Background texture | Scanlines plus a faint micro-grid | Prime Hack |
| Glow | Subtle | `Style_Root.txt` |
| Text size | Large (18px) | Menu and Frequency Scan, for dyslexic learners |

Which stages are which:
- **Build (blue):** Factor Vault, Vault Grid, Blueprint
- **Hack (green):** Frequency Scan, Prime Hack, the finale

## Where it lives

The values are in `shared/primenet.css`, which every screen loads. Each screen sets its phase on the `<html>` tag (`class="phase-build"` or `class="phase-hack"`), and `--accent` follows. Canvas and 3D drawing can't read CSS, so the Vault Grid and Blueprint use the same blue written out directly.

## Style code

```css
:root{
  --bg-primary: #071418;
  --bg-panel: rgba(6,16,20,.72);
  --line: rgba(17,75,95,.6);
  --accent-build: #4aa3ff;   /* factor stages: Factor Vault, Vault Grid, Blueprint */
  --accent-hack:  #43e58a;   /* prime stages: Frequency Scan, Prime Hack, finale */
  --accent: var(--accent-build); /* each screen sets this to its own phase */
  --text-primary: rgba(235,255,248,.94);
  --text-muted: rgba(235,255,248,.64);
  --ok: #43e58a;
  --warning: #f2c14e;
  --danger: #ff6b6b;
  --font-ui: "Inter", system-ui, sans-serif;
  --font-mono: "Courier Prime", ui-monospace, monospace;
  --radius: 0px;
  --glow-strength: .16;
  --font-size: 18px;
}
/* background texture: scanlines + micro-grid */
```
