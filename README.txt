OVA-Dimension 0.4.2c.4 — Movement Waiting Visibility (TEST CANDIDATE)

Complete project based on 0.4.2c.2. No world coordinates, agendas,
simulation semantics, or save namespaces were changed.

Changes:
- Synchronously hide every participating final-position actor before any
  delayed fade or walk begins; unrelated actors remain visible.
- Restore each actor only after its final plan, or on cancellation.
- Separate pure rounded-path geometry into js/core/route-path.js.
- Split presentation into settle, walk, pose scheduling and cleanup functions.
- Report unexpected presentation failures without hiding them.
- Use Rionne's authentic right-facing three-quarter artwork, not mirroring.
- Retain 0.4.2c.2 walking speed, rounded corners and transfer anchors.
- Add actual presenter lifecycle regression test for immediate hide/cancel.

Not included: transfer pause/turn choreography, To/From behavior, Agenda Lab.

GitHub changed/new file upload order (index.html LAST):
1 assets/sprites/rionne-front-three-quarter-right.png (NEW)
2 assets/sprites/rionne-back-three-quarter-right.png (NEW)
3 js/core/route-path.js (NEW)
4 js/core/movement-plan.js
5 js/ui/movement-view.js
6 js/content/game.js
7 js/content/build.js
8 js/core/world.js
9 tests/movement-view.mjs
10 tests/movement-lifecycle.mjs (NEW)
11 tests/update-reliability.mjs
12 README.txt
13 sw.js
14 index.html (LAST)

Commit: fix: 0.4.2c.4 waiting sprite visibility

Test on iPhone at 07:00, 09:00, 10:00, 18:00, then day two 07:00.
Do not accept until visual tests pass and the independent code audit is done.

0.4.2c.4: Mount starting-position walking overlays before any settle fades.
The final-position sprites stay hidden while a walker waits for other NPCs.
No changes to movement geometry, walking pace, or agendas.

0.4.2d — Transfer choreography (testing candidate)
- World Stage 0.8.2 is the authored source for fade connections and To/From.
- Connection movement is preserved from the navigation graph into immutable
  committed events and pure, ordered presentation actions.
- Fade connections use paired endpoint fades; waypoints remain walk-only.
- To/From markers are presentation-only and never navigation destinations.
- Transfer pauses and turn timing live in js/core/transfer-plan.js.
- The simulation, save namespace and accepted walking geometry are unchanged.
- iPhone Safari verification is required before accepting this release.
