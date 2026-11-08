# OVA-Dimension 0.4.2e.9 — Engine Cleanup 1

**Status:** iPhone testing candidate, not yet accepted. Complete game repository snapshot.

## Scope

- Move existing motion and transfer timing defaults into `js/content/tuning.js`.
- Re-export the same constants from their previous modules to preserve callers and tests.
- Replace the movement view's numeric stagger cap with `MOTION.maxStaggerMs` (same value).
- Make dialogue precedence and cursor keys explicit in `resolveInteraction`, including when authored contexts share an object.
- Add regression tests. No intentional gameplay, layout, or asset changes.

## Installation

Upload the changed files in the listed order, retaining paths; upload `sw.js` before `index.html`, and `index.html` last. The full ZIP includes unchanged assets and files. Restart/reload the iPhone PWA to update its service-worker cache.

## iPhone checks

Verify NPC dialogue cycles, character Talk and Check, movement cornering and stagger, walking and fading transfers, card/Observe/portrait layouts, and reload/offline startup. Report any regression before accepting this release.

## Next cleanup candidates (not included)

Split the interaction controller into focused modules, then review old planner compatibility paths and README duplication. No removal of compatibility code in this release.
