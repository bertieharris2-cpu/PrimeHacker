# PRIMENET

A maths game about factors and primes, with a hacker theme. Students work out a bank's blueprint using factor pairs, then break into its vault using prime factors.

The game files are still the originals. Review decisions are in `docs/DECISIONS.md`.

## Layout

| Folder | What's in it |
|---|---|
| `modules/` | The games being kept: Prime Frequency Scan, Factor Vault → Vault Grid → Blueprint → Prime Hack, plus `bank.js` (wallet) and the sound notes |
| `archive/` | Pieces cut in review. See `archive/README.md` |
| `docs/` | `DECISIONS.md` (what's been decided), `STYLE.md` (the chosen look), `Style_Root.txt` and `Segment_Instructions.docx` (your original design notes) |

There's no start screen yet (a new title screen is planned). For now, open a game in `modules/` directly, such as `modules/factor_vault.html`. The Blueprint's 3D view loads Three.js from unpkg.com, so it needs an internet connection.
