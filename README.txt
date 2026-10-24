OVA-D ENGINE 0.2 — GENERIC NAVIGATION

Built directly from the working 0.1.1 boot-fix baseline.

CORE RULES
- Agenda declares destination + activity only.
- EntityRegistry owns entity state, but does not calculate routes.
- Navigator is generic: every Character/NPC uses the same World graph.
- World.findPath() remains the route authority.
- Simulation coordinates Agenda -> Navigation -> Entity state.
- No Rionne-specific or Barmaid-specific navigation functions exist.
- Logical navigation resolves immediately; presentation is deliberately not added yet.

DEVELOPER HARNESS
When an agenda change requires movement, SIMULATION CHANGES prints the World route.

Example at 07:00:
Rionne starts RIONNES_ROOM/SPOT_02 and her agenda wants BERKLITH_TAVERN/SPOT_04.
Expected route:
RIONNES_ROOM/SPOT_02
-> RIONNES_ROOM/SPOT_01
-> BERKLITH_TAVERN/SPOT_02
-> BERKLITH_TAVERN/SPOT_03
-> BERKLITH_TAVERN/SPOT_06
-> BERKLITH_TAVERN/SPOT_04

This is logical simulation only. Witnessed/missed/off-screen presentation comes later.
