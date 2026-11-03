OVA-Dimension Clean Engine 0.3.4a — SAVE INTEGRITY

Based on accepted 0.3.3c Development HUD. This release ONLY hardens
existing single-slot Save/Load. The agreed multi-slot and scheduled
safe-boundary autosave design is NOT implemented yet.

Changed files:
  js/core/save.js          validate entire snapshot before commit; rollback
  js/core/player.js        validate restore; discard transient interaction
  js/core/entities.js      validate all entities; initialize new ones from
                           authored agenda at saved time
  js/core/dimension-gear.js reject invalid/out-of-range saved timestamps
  js/main.js               handle save/reset storage errors
  js/content/build.js      build label
  sw.js                    versioned cache name (strategy unchanged)
Added:
  tests/save-integrity.mjs  automated regression checks (Node.js)

No changes to CSS, assets, navigation, hold gesture, orientation, HUD,
world-stage, agendas, or simulation behavior.

Regression on iPhone:
1. Install/upload all changed files together. Confirm 0.3.4a plaque.
2. Save in Tavern, travel to Rionne's Room, load: Tavern restored.
3. Advance time with HUD, save, advance more, load: clock and NPCs restored.
4. Open/close menus, rotate, hold, and test HUD as in 0.3.3c.
5. Reset Prototype and verify save is cleared; a subsequent Load says no data.
6. Verify previously created 0.3.3c saves load, if present.

Dev test: node --experimental-default-type=module tests/save-integrity.mjs

IMPORTANT: This release does not yet autosave, provide three manual slots,
or include a new title screen. Those remain separately planned milestones.
