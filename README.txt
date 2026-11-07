OVA-Dimension 0.4.2c.1 — Movement Presentation Correction (testing candidate)

Continuous route easing, longer distance-based pace, sprite handoff for fades, and predecoded pose changes. No world, agenda, save, or Lab data changes.

OVA-Dimension 0.4.2c — Movement Renderer (testing candidate)

First visible movement presentation. Simulation and saved world state remain authoritative.
Exact-time agenda arrivals plan scene-local walks; skipped times use short fades.
Temporary MOVEMENT interaction lock releases on completion or cancellation.
To/From transfer choreography is reserved for 0.4.2d.

OVA-Dimension — Clean Engine 0.4.2b · MOVEMENT PLANNER

Based on accepted 0.3.4k. This release adds read-only NPC scene presence.
- Pure scenePresence projection of authoritative entity state.
- World.spot read-only lookup; no changes to save formats or simulation logic.
- Background and foot-anchored sprites use one 1536 × 708 stage.
- Unified refreshView after boot, Continue, load, travel and time advance.
- Original transparent character PNGs, registered in service worker cache.
- Rionne front and Barmaid serving poses used for presence. Other Rionne
  directions are included for later movement; no interaction yet.
- Existing save slots and autosave namespace remain unchanged.

Upload changed files individually in the supplied order, index.html LAST.

0.4.1b audit correction:
- Service worker serves all exact precached asset URLs, including unversioned sprites.
- Entity sprite-family paths live in content/game.js, not the scene renderer.
- Unknown asset families use the existing generic visual fallback.
- No preload manager, no sprite lifecycle changes, no authored spot changes.
- A first-time image decode delay may still occur; test on iPhone.

0.4.1c renderer lifecycle:
- Preserve unchanged sprite DOM elements by entity ID and asset path.
- Update Lab-authored spot positioning without replacing unchanged images.
- One shared fallback creator for unknown or failed sprite assets.
- No changes to simulation, saves, artwork or spot data.

0.4.2a movement events:
- Successful Simulation.advance() now returns immutable moves alongside old/now.
- Each event contains entityId, exact epoch minute, from/to and complete route.
- No events leak from a rolled-back advance; observers see committed results.
- Initialization does not generate movement events; visual behavior is unchanged.
- No movement animation, occupancy scheduling, or presentation logic yet.

0.4.2b movement planning:
Pure scene-local witness plans from committed movement events. Exact-minute routes, skipped-time settled fades, directional poses, cross-scene boundaries. No runtime animation or world data changes.
