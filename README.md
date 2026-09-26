# PRIMENET

A maths game about factors and primes, with a hacker theme. Students work out a bank's blueprint using factor pairs, then break into its vault using prime factors.

The game files are still the originals. Review decisions are in `docs/DECISIONS.md`.

## Layout

| Folder | What's in it |
|---|---|
| root | `index.html`, the title screen: codename, level choice, teacher controls |
| `shared/` | `primenet.css` (the agreed style) and `primenet.js` (agent, level rules and the mission record), used by every screen |
| `modules/` | The games being kept: Prime Frequency Scan, Factor Vault → Vault Grid → Blueprint → Prime Hack, plus `bank.js` (wallet) and the sound notes |
| `archive/` | Pieces cut in review. See `archive/README.md` |
| `docs/` | `DECISIONS.md` (what's been decided), `STYLE.md` (the chosen look), `Style_Root.txt` and `Segment_Instructions.docx` (your original design notes) |

Open `index.html` in a browser to start. The whole mission is linked: title screen → Frequency Scan → Factor Vault and Vault Grid for three floors → Blueprint → Prime Hack. Everything works offline, including the Blueprint's 3D view (Three.js is included in `shared/vendor/`). Only the fonts need internet, and without it they fall back to similar standard fonts.

**Sound:** switch it on or off from the title screen. Browsers only allow sound after a key press, so the Vault Grid and Blueprint may ask students to press a key before they start.

**Teacher controls:** on the title screen, hold Shift and click `v1` in the bottom corner, or press Ctrl + Shift + Y, then enter the PIN. The PIN is **2357**. To change it, edit `TEACHER_PIN` near the top of `shared/primenet.js`. From there you set the level rule, see the mission record, and download or load record files. While unlocked you can also preview any stage, see Vault Grid's layout controls, preview the Blueprint with sample numbers and use the Frequency Scan's Dev panel (press D). Unlocking lasts until you press Lock or close the browser tab. The Blueprint's 3D view loads Three.js from unpkg.com, so it needs an internet connection.
