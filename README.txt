OVA-Dimension Clean Engine 0.3.1 — Player World State

Foundation changes:
- Player has authoritative World location + interaction state.
- Game start is configured once in js/content/game.js.
- Presentation renders the scene from Player State; no currentScene/showScene authority remains.
- Locations UI is generated from scenes in world/world-stage.json.
- Friendly scene labels are presentation metadata only and cannot create World locations.
- Location travel validates a route through the shared World/Navigator graph.
- Save/Load now serializes Player State alongside Dimension Gear and entities.
- Service worker cache bumped and includes the new modules.

Temporary start:
BERKLITH_TAVERN / SPOT_01
When HUB is authored in World Stage, GAME_START is the intended single configuration change.

Not implemented in this milestone:
- witnessed/missed/off-screen autonomous presentation
- character rendering/interaction
- visual startup/location-preview polish
- scene-bottom Dimension Gear test strip

The existing Extra development time controls remain available for engine testing.
