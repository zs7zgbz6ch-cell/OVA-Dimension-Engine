OVA-Dimension 0.4.2e.12 — Foundation Cleanup
Testing candidate; e.11 remains the accepted stable fallback.

Changed: action-only movement plan and renderer; obsolete movement plan compatibility removed.
Tuning imports now use content/tuning.js directly in the movement view and tests.
Unchanged: save compatibility, simulation, transfer behavior, interactions, dialogue, visuals, timings.
Versioned PWA URLs and cache refreshed to 042e12.

Install: upload changed files in their listed order, sw.js before index.html, index.html LAST.
Test: movement/transfers, save/load/reset, three-line and rotating dialogues, character cards, rotation, PWA relaunch.
See README.md for architecture boundaries and full scope.
