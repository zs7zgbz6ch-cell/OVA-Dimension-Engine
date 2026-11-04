OVA-Dimension — Clean Engine 0.3.4i · FINAL ENGINE POLISH

Changes since accepted 0.3.4h:
- Autosaves now capture the same menu-motion presentation preference as manual saves.
  The autosave coordinator asks the UI for the current presentation at the safe
  save boundary. Continue restores that preference through the existing path.
- Service-worker offline and asset fallbacks now await cache.match() before
  deciding whether to use the fallback. Cache generations remain immutable.
- tools/stamp-release.mjs stamps the versioned resource URLs, service-worker
  cache identifier and build plaque for future ZIP preparation. It is not a
  runtime dependency: GitHub Pages and iPhone uploads remain plain files.
- Long validation/readout lines in player.js and dev-hud.js were reformatted.
- Regression coverage added for presentation capture and service-worker fallback.
- No gameplay, Save/Load schema, storage key, autosave checkpoint, or art changes.

Phone upload: application JavaScript files first, sw.js next, index.html last.
Wait until all GitHub Pages deployments finish before launching the installed PWA.

Suggested iPhone checks:
1. First launch shows 0.3.4i · FINAL ENGINE POLISH.
2. Set MENU MOTION to REDUCED, advance across a checkpoint, close and reopen.
3. Choose CONTINUE SAVED GAME and verify MENU MOTION remains REDUCED.
4. Verify manual Save/Load, travel, startup hold gating and HUD still work.
5. Confirm existing manual saves and autosaves remain available.

Project Foundation / roadmap: the Foundation document is not included in this
archive. Update the canonical GitHub copy to record accepted 0.3.4b–0.3.4h
save, shell and update milestones; 0.3.4i is pending device acceptance;
0.4.1 Entity Presence is next after acceptance. Do not overwrite the existing
Foundation document with a guessed reconstruction.

--- Previous release notes ---
OVA-Dimension — Clean Engine 0.3.4h · CONTINUE & RECOVERY

Current milestone:
- The opening screen offers CONTINUE SAVED GAME when at least one autosave exists.
- Continue restores the latest valid autosave; if corrupt, the older snapshot is tried.
- If recovery fails, the opening screen remains usable; no saves are deleted.
- Restored world location, entities, clock and presentation are rendered before the
  established opening fade, and player input remains blocked until startup completes.
- Tapping the opening screen still begins the prototype without loading an autosave.
- Manual slots, autosave schedule, storage keys and Reset Prototype remain unchanged.

Automated checks: node tests/continue-recovery.mjs, plus all existing tests/*.mjs.
Device checks: first-launch build plaque; Continue after crossing 06:00/12:00/18:00/00:00;
correct restored world time/location; opening fade and hold lock; existing manual saves;
normal tap-to-begin and reset preservation.

Previous milestone notes (historical; not current instructions):

OVA-Dimension — Clean Engine 0.3.4g · SCHEDULED AUTOSAVES

Checkpoint crossings at 00:00, 06:00, 12:00, 18:00 world time create one pending autosave, committed only after successful simulation advancement and a FREE player boundary. Two rotating autosave snapshots; manual slots unchanged. No title-screen Continue UI yet.

OVA-Dimension — Clean Engine 0.3.4d · SHELL SAFETY

Development milestone; accepted baseline remains 0.3.4c until iPhone testing.

Scope:
- Extracted menu navigation, save-menu presentation, travel preview/transition,
  hold gesture and scene rendering from js/main.js into focused js/ui modules.
- Preserved 180 ms hold delay, 500 ms fill, and orientation settling behavior.
- Hold/menu opening now requires player.isFree; closing the menu cannot override
  an unrelated STARTUP or TRAVEL interaction state.
- Travel fade and input state are released if a transition throws.
- Expanded Development HUD closes on outside pointerdown, consuming that tap.
- Development Reset Prototype continues to clear the legacy save only;
  manual and autosave slots are intentionally retained.
- Updated service worker cache list for the newly extracted modules.

Not included:
- No changes to game-world time, agendas, persistence schema, slot keys,
  autosave scheduling, title menu, Travel hierarchy or service-worker strategy.
- First-launch stale-build behavior is a known issue for the next milestone.

Changed: js/main.js, js/ui/dev-hud.js, js/content/build.js, sw.js, README.txt
New: js/ui/menu.js, js/ui/save-menu.js, js/ui/travel-view.js,
     js/ui/hold-input.js, js/ui/scene-view.js, tests/shell-boundaries.mjs
Deleted: none

Run: node tests/save-integrity.mjs
     node tests/save-slots.mjs
     node tests/save-menu-metadata.mjs
     node tests/shell-boundaries.mjs

iPhone checks: startup hold blocked during fade; hold gesture after startup;
Save/Load all slots; travel/preview/fade; portrait/landscape transitions;
HUD outside-tap dismissal (no underlying interaction); Development HUD time;
Reset Prototype and saved slot retention.

0.3.4e UPDATE RELIABILITY
- Versioned module import map, CSS and World Stage JSON prevent the old 0.3.4d
  service worker from matching stale unversioned resource URLs on first launch.
- SW installs a complete immutable cache before activation and does not overwrite
  individual app resources in the background. Offline navigation uses cached shell.
- The existing v034b save key namespace is intentionally permanent; do not rename.
- On a device already controlled by 0.3.4d, the initial launch may still briefly
  use its old controller. Future updates use the 0.3.4e cache strategy.

0.3.4f SIMULATION SAFETY
- Simulation.advance validates its target and rolls back gear, entities, and log on failure.
- Clock conversion/formatting centralized in Dimension Gear; manual slot metadata now includes weekday.
- Reset confirmation explicitly states manual and autosave slots are preserved.
- No scheduled autosave behavior added in this milestone.
- Update the complete set of changed files before launching the PWA.
