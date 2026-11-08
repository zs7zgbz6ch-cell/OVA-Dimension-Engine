OVA-Dimension 0.4.2e.8 — Character Card Framing (testing candidate)

FULL PROJECT ARCHIVE
This ZIP contains the entire game, including unchanged files and assets.
Keep the directory structure intact. index.html belongs at repository root.

CHANGES FROM 0.4.2e.7
- Opening character art sits lower, preserving the close-up zoom.
- Landscape Observe artwork is smaller with the same foot anchor.
- Portrait Observe reserves space below the iPhone top safe area for
  character headings, and slightly reduces artwork height.
- Landscape and portrait rotation hints are separate elements; only one
  can be displayed in its matching orientation.
- Existing card animation, dialogue, interaction blocking, back icon,
  movement, simulation, and scene behavior remain unchanged.

IPHONE TESTS
1. Open character card: name and location must not overlap the head.
2. Observe in landscape: full artwork, feet anchored, readable bottom hint.
3. Rotate to portrait: heading below Dynamic Island, no sprite overlap.
4. Only ROTATE TO CONTINUE GAMEPLAY is visible in portrait.
5. Rotate back: the landscape hint returns and back arrow still works.
6. Verify dialogue, NPC interactions, and other game systems still work.

RELEASE PROCESS
Upload changed/new files in the order supplied with the release;
service worker before index.html, and index.html last. This README is
included in the changed-file list for this release. Test on iPhone
before accepting the candidate.
