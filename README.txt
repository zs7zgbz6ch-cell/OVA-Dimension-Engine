OVA-D CLEAN ENGINE 0.3 — PRODUCTION SHELL

COMPLETE / SELF-CONTAINED REPLACEMENT BUILD

FOUNDATION
- Built directly from OVA-D Engine 0.2 Generic Navigation.
- 0.2 World / Dimension Gear / Agenda / Entity / Navigation / Simulation responsibilities remain separate.
- No old production world-time, Rionne navigation, Barmaid navigation, or entity-state code was copied in.

0.3 ADDS
- Full-screen Berklith Tavern / Rionne Room presentation shell.
- Known-good startup behavior and landscape guard, reimplemented around the clean engine.
- Hold empty scene for 840 ms to open the menu.
- Locations, Save, Load, Settings, Extra and Reset shell.
- Generic save serialization for Dimension Gear + every registered entity.
- Small development clock inside EXTRA > DEVELOPMENT.
- PWA manifest, service worker, iOS standalone metadata and icons.
- All required current scene/intro/icon assets included.

CLEANUP RULE
The old 0.2 developer harness UI and its entity cards/log renderer are removed. The simulation log still exists internally for debugging but has no production UI authority. Presentation owns only presentation state.

INSTALL
Upload the complete contents of this ZIP to the GitHub Pages root, preserving folders. Then open the site in Safari and use Share > Add to Home Screen. Existing Home Screen installs may need to be removed/re-added if iOS retains old manifest behavior.
