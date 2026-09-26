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

Open `index.html` in a browser to start. The route after the Frequency Scan isn't linked up yet, so the other games still open directly from `modules/`.

**Teacher controls:** on the title screen, hold Shift and click `v1` in the bottom corner, or press Ctrl + Shift + Y. From there you set the level rule, see the mission record, and download or load record files. The Blueprint's 3D view loads Three.js from unpkg.com, so it needs an internet connection.
