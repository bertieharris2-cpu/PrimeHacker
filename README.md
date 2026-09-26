# PRIMENET

A maths game about factors and primes, with a hacker theme. Students work out a bank's blueprint using factor pairs, then break into its vault using prime factors.

The game files are still the originals. Review decisions are in `docs/DECISIONS.md`.

## Layout

| Folder | What's in it |
|---|---|
| root | Old start screens: `launcher.html` (opened by `start-primenet.bat`), `demo.html` and `index.html` (the hub). Under review |
| `modules/` | The games being kept: Prime Frequency Scan, Factor Vault → Vault Grid → Blueprint → Prime Hack, plus `bank.js` (wallet) and the sound notes |
| `drafts/` | Other Prime Hack layouts, still under review |
| `archive/` | Pieces cut in review. See `archive/README.md` |
| `docs/` | `DECISIONS.md` (what's been decided), `STYLE.md` (the chosen look), `Style_Root.txt` and `Segment_Instructions.docx` (your original design notes) |

Open `launcher.html` in a browser to play. The Blueprint's 3D view loads Three.js from unpkg.com, so it needs an internet connection.
