# OVA-Dimension 0.4.2e.8

**Status:** iPhone testing candidate. Complete game repository snapshot.

## Changes

- Shared character-card opening framing lowered without changing zoom.
- Observe art slightly reduced while keeping the bottom foot anchor.
- Portrait heading moved beneath the top safe area; art height reduced.
- Orientation-specific rotation instructions replace duplicated text.

## Install

Upload the complete archive contents to the repository root, preserving
paths. `index.html` stays at the root. For incremental updates, follow
the accompanying changed-file upload order, with `sw.js` before
`index.html` and `index.html` last. Reload the installed PWA to pick up
the new service-worker cache.

## iPhone acceptance checks

Check card title clearance, landscape Observe feet and top spacing,
portrait Dynamic Island clearance, one rotation instruction only,
and preserved card animation, dialogue and navigation behavior.
