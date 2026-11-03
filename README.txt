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
