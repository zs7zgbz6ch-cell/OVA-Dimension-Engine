# OVA-Dimension 0.4.2e.12 — Foundation Cleanup

Testing candidate based on the user-accepted 0.4.2e.11 stable build.

## Scope

- Remove obsolete pre-action movement-plan fields (`legs`, `arrivals`, `departures`) and the renderer's old-plan playback fallback. The action sequence is now the sole movement presentation contract.
- Import movement and transfer tuning directly from `content/tuning.js` in the view and tests; remove redundant re-exports from the core planning modules.
- Keep the authoritative simulation, authored World Stage spots, fade/walk connections, transfer choreography, dialogue, card framing, saves and all game timing unchanged.
- Refresh all versioned PWA references to 042e12 and add architecture regression coverage.

## Architecture boundaries

`core/movement-plan.js` creates immutable action plans from committed simulation events. `core/transfer-plan.js` authors action sequences for scene-local walk/fade/marker transitions. `ui/movement-view.js` presents actions and owns animation cancellation; it does not choose routes or mutate simulation. `content/tuning.js` owns presentation timing. Existing save compatibility in `core/save.js` and `core/save-slots.js` is intentionally preserved.

The remaining dependency from pure route geometry into `content/tuning.js` is explicitly noted for future dependency-injection work; it is not a gameplay regression and is outside this narrowly scoped release.

## Installation

Upload the changed files preserving their paths, with `sw.js` before `index.html`, and `index.html` LAST. The ZIP is the complete game repository, not a delta. Do not delete existing player saves. Retain e.11 as the fallback until iPhone testing is accepted.

## iPhone regression checks

1. New Game, continue, save/load, reset, and revisit scenes.
2. Walk, fade and marker transfers, including multi-character movement and waypoint corners.
3. Talk to Rionne through three lines; talk to barmaid repeatedly for rotating lines; test quick taps and dismissals.
4. Open, observe and leave character cards; rotate landscape/portrait and back.
5. Confirm version 0.4.2e.12, and relaunch the installed PWA to check cache freshness.

## Verification

Automated test results and ZIP integrity are recorded in the release response. The build is not accepted until physical iPhone verification.
