OVA-Dimension — Clean Engine 0.3.4j · SAVE FLOW SAFETY

Based on accepted 0.3.4i. This is a focused title and recovery UI milestone.

WHAT CHANGED
- Opening screen now has explicit CONTINUE, NEW GAME, LOAD GAME, EXTRA and SETTINGS.
- CONTINUE uses the existing newest-valid autosave with fallback to older recovery.
- NEW GAME starts the existing prototype at Day 1, 06:55. If autosaves exist,
  the player must confirm a themed warning. The warning does not delete saves;
  future checkpoint writes will rotate and eventually replace them.
- Title LOAD GAME reuses the in-game load UI. It exposes all three manual slots
  plus the newest and previous autosave recovery snapshots.
- In-game LOAD GAME also exposes both autosaves with their saved date, time and
  scene. Loading an older snapshot does not rotate or overwrite either autosave.
- Title SETTINGS and EXTRA reuse existing pages without beginning gameplay.
  The development reset control is hidden when opened from the title.
- Save format, permanent storage keys, world clock, simulation, travel and
  existing game art are unchanged.
- A brief golden dimensional-seal animation accompanies the New Game warning;
  Reduced Motion and OS reduced-motion preferences disable it.

IMPORTANT
- Manual save slots are never overwritten by New Game or autosave rotation.
- The two autosaves remain a rotating recovery pair, not separate campaigns.
- Title screen options do not advance the world clock.
- GitHub Pages needs no build tool. Upload changed files individually on iPhone.

PHONE UPLOAD (changes from 0.3.4i)
  REPLACE: css/ovad.css
  REPLACE: js/core/save-slots.js
  REPLACE: js/core/save.js
  REPLACE: js/ui/menu.js
  REPLACE: js/ui/save-menu.js
  REPLACE: js/main.js
  REPLACE: js/content/build.js
  REPLACE: tests/continue-recovery.mjs (optional)
  ADD:     tests/save-flow-safety.mjs (optional)
  REPLACE: README.txt (optional)
  REPLACE: sw.js
  REPLACE LAST: index.html

Wait for GitHub Pages deployment before launching the installed PWA.

IPHONE ACCEPTANCE TEST
1. First launch: build 0.3.4j, five title options visible.
2. With existing autosaves, NEW GAME opens the themed warning; BACK TO TITLE
   cancels, NEW GAME confirms and starts Day 1, 06:55.
3. Without autosaves, NEW GAME starts directly.
4. Title LOAD GAME shows manual saves and both autosave checkpoints. Load the
   previous autosave and verify its original clock and scene are restored.
5. Open the in-game Load menu; both autosaves are still accessible and intact.
6. Title SETTINGS and EXTRA return to the title without starting a game.
7. Verify CONTINUE, manual Save/Load, reduced motion, startup input gating,
   development HUD and travel still behave as in 0.3.4i.

ROADMAP
0.3.4i is the accepted baseline. Accept 0.3.4j only after iPhone testing.
Next milestone: 0.4.1 Entity Presence. The authoritative Foundation document
is not included; update its roadmap separately without replacing it.
