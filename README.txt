OVA-Dimension 0.4.2e — Interaction Foundation (testing candidate)

Based on accepted 0.4.2d.1; all prior world, simulation, movement,
transfer, save, and scene assets are included in this full project ZIP.

Tap any visible character or NPC: short boop then compact menu.
NPC: TALK / CHECK / LEAVE. Character: INTERACT / CHECK / LEAVE.
Character card: TALK / OBSERVE / GIVE (disabled) / STATUS (disabled) / LEAVE.

Talk presents a typewriter speech balloon. Tap to reveal the line, tap
again to advance. NPCs cycle one line per completed conversation. Characters
may have multi-line conversations; completion costs exactly 5 game minutes.
Check presents a two-second observation, then floats/fades out, then costs
exactly 5 game minutes. Leave and Observe cost no time. While interacting,
scene taps, hold menu and development time controls are blocked. Interaction
content is authored in js/content/interactions.js; resolver in
js/core/interaction-content.js supports scene + agenda activity overrides.

The character card uses the authored portrait asset and the player's
current scene background. The portrait's white studio backdrop was keyed to
transparent PNG for layering; the original source is unchanged.

This release intentionally does NOT include agenda-start speech cues,
real-time clock behavior, Give/Status gameplay or dialogue persistence.
Dialogue rotation currently lasts for the active game session; save-format
changes will be considered when interaction history becomes gameplay state.

iPhone test:
- Tap Barmaid; TALK line 1; reveal/finish; confirm +5 minutes.
- Repeat twice; confirm lines 2 and 3; repeat to cycle.
- CHECK; wait for upward fade; confirm +5 minutes only afterward.
- Tap Rionne; INTERACT; confirm current scene background and portrait.
- OBSERVE/BACK; no time change. TALK; three lines; +5 once at end.
- Confirm GIVE/STATUS disabled and LEAVE never advances time.
- Confirm tapping another person during text cannot select them.
- Confirm ordinary movement and +5m development advance remain intact.

GitHub: upload changed/new files with sw.js before index.html;
index.html last. Always upload complete paths.

0.4.2e.1 — Interaction Presentation Polish (test candidate)
- Restores the original 853x1843 transparent Rionne character-card portrait.
- Narrows the landscape card and gives Observe a wider framed view.
- Adds artwork boop on taps in both Card and Observe (no time cost).
- Removes the Check panel; text floats above the scene and fades upward.
- Compacts and ornaments the three-option person menu; removes its name header.
- Restores the subtle Observe orientation hint (landscape only).
- No slide entrance, no magnifier yet, no changes to agenda or interaction timing.
- The existing player lock and +5-minute Check/Talk completion remain authoritative.

0.4.2e.2: Check narration enters after 180 ms, sits lower and falls on exit; compact menu decorations removed; card opens hips-up, Observe remains full-body; portrait Observe uses safe-area-aware viewport height. No simulation or agenda changes.

0.4.2e.4 · Character card polish
- Character headings use the current scene title, not a character-specific subtitle.
- Interact uses a portrait crop; Observe keeps a full-figure view at a stable card width.
- The card backdrop dismisses the card; portrait boops require a nontransparent pixel.
- Dialogue remains modal and cannot be dismissed by tapping the card backdrop.
- Portrait Observe fills the available viewport and shows a rotation hint.

0.4.2e.5 · Character choreography
- Card pops from selected actor position; Observe smoothly widens and zooms the same portrait.
- Portrait Observe reserves space for its rotate hint and respects safe areas.
- Dialogue pointer follows the actor anchor while the balloon stays on screen.
