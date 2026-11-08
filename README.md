# OVA-Dimension 0.4.2e.11 — Dialogue Regression Fix

Testing candidate based on complete 0.4.2e.10 Engine Cleanup 2.

## Scope

- Restore the missing `clamp` helper used by scene dialogue speech positioning. Without it, the first conversation could open an empty bubble and throw a ReferenceError before the typewriter starts.
- Preserve authored dialogue: Rionne has three lines in one conversation; the barmaid has three separate one-line conversations which rotate between interactions.
- No changes to character card geometry, dialogue content, movement, transfers, or save formats.
- Refresh versioned import-map, asset references, and service-worker cache to 042e11 to avoid mixed PWA releases.
- Add dialogue positioning regression test and update version-sensitive tests.

## Installation

Upload changed files preserving their paths, with `sw.js` before `index.html` and `index.html` last. This is a full repository game ZIP, not a delta. Existing saves should remain intact. Verify on iPhone before accepting as stable.

## iPhone regression checks

1. New Game > speak to barmaid: first speech bubble contains text immediately after typewriter begins, never stays empty.
2. Tap to finish typing, then tap to dismiss. Repeat talk three times to see each of the three authored barmaid lines.
3. Rionne > Interact > Talk: all three lines appear in sequence, each advancing on tap.
4. Confirm Observe, cards, save/load, transfers and version label are unchanged.

## Verification

All 30 test files passed locally; ZIP integrity verified after packaging.
