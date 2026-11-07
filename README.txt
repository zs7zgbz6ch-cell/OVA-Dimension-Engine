OVA-Dimension 0.4.2c.2 — Movement Cornering & Visibility (TEST CANDIDATE)

Based on the full 0.4.2c.1 project.

Changes:
- Individual actor overlays hide and restore only their own final-state sprites.
- Skipped agenda fades complete before witnessed walking presentations.
- Mildly rounded waypoint corners with speed reduction through the bend.
- Walking pace adjusted from 42 to 55 ms per percentage unit.
- Continuous whole-route animation with directional sprite changes.
- Movement tests cover rounded waypoint and exact transfer anchors.

No world, agenda, simulation, save namespace, or spot coordinate changes.
Transfer pause/turn choreography and To/From support are NOT part of this release.

GitHub changed-file order:
1 js/ui/movement-view.js
2 tests/movement-view.mjs
3 tests/update-reliability.mjs
4 js/core/world.js
5 js/content/build.js
6 README.txt
7 sw.js
8 index.html (LAST)

Commit: fix: 0.4.2c.2 movement cornering

Test on iPhone at 07:00, 09:00, 10:00, 18:00.
Do not accept until visual tests pass.
