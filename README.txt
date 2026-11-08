OVA-Dimension 0.4.2e.11 — Dialogue Regression Fix
Testing candidate. Full game release; preserve all paths.

Fix: missing clamp() in js/ui/interactions.js prevented scene dialogue positioning and could leave the first speech bubble empty.
Content unchanged: Rionne has a three-line talk; barmaid has three rotating one-line talks.
Versioned cache/import URLs updated to 042e11. Saves and movement unchanged.

Install: upload changed files, sw.js before index.html, index.html LAST.
Test: New Game, talk to barmaid repeatedly, Rionne three-line Talk, character cards, save/load and transfers.
Automated tests: 30 files passed. ZIP integrity checked.
