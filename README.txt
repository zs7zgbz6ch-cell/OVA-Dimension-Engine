OVA-Dimension Clean Engine 0.3.2 — World / Game Data Contract

Foundation changes:
- Uses clean World Stage 0.8 production data: scenes, backgrounds, spots and connections only.
- Player presence is scene-level. Player is not a physical entity and does not occupy SPOT_XX.
- Character/NPC entities still use scene + spot for staging, agenda destinations and navigation.
- Player State owns current scene, interaction state and discovered scenes.
- Temporary New Game configuration lives in js/content/game.js and is ready to point to HUB later.
- Scene player-facing names/subtitles live in game content; World Stage remains geography.
- Locations renders Player-discovered scenes that exist in World; it does not enumerate all World scenes blindly.
- Locations travel uses a dedicated scene-level TravelSystem, not entity Navigator or World spots.
- Save/Load serializes the new Player State, including discovery.
- Save schema/key and service-worker cache were bumped for 0.3.2.

Current temporary player state:
- starts in BERKLITH_TAVERN
- BERKLITH_TAVERN and RIONNES_ROOM begin discovered for current testing

Not implemented in this milestone:
- discovery events/content rules
- player physical movement (not part of OVA-D's player model)
- witnessed/missed/off-screen autonomous presentation
- character rendering/interaction
- interactable scene objects
- visual startup/location-preview polish
- scene-bottom Dimension Gear test strip

The existing Extra development time controls remain available for engine testing.
