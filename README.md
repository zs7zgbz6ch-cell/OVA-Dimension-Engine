# OVA-Dimension 0.4.2e.10 — Engine Cleanup 2

**Status:** iPhone testing candidate. Full game snapshot.

## Scope

- Correct the displayed build label to 0.4.2e.10 (the previous release still displayed e.6).
- Extract reusable alpha-aware portrait hit-testing into `js/ui/alpha-hit.js`.
- Extract viewport-aware person menu placement into `js/ui/person-menu.js`.
- Centralize existing interaction timing and layout defaults in `js/content/tuning.js`.
- Keep character-card choreography, Observe framing, dialogue flow, simulation time costs, and authored content unchanged.
- Update import map, PWA cache, and source-shape tests for the moved responsibilities.

**Not included:** the larger character-card/dialogue controller split, movement legacy-plan removal, or changes to game content. These remain separate cleanup steps.

## Installation

Upload changed files with their directories intact, `sw.js` before root `index.html`, and root `index.html` last. Refresh/reopen the installed PWA. The ZIP includes unchanged files.

## iPhone regression checklist

Verify e.10 appears in the build label; test person menu positioning, transparent sprite taps, card opening and Observe, Talk and Check, portrait rotation, dialogue tap-to-advance and blocking, and walking/fade transfers. Do not promote to stable until checked.

## Documentation

`README.md` is authoritative; `README.txt` is the concise mobile companion.
