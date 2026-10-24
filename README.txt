OVA-D ENGINE 0.1 — SIMULATION CORE

Fresh architecture proof; intentionally not the visual game yet.

Test:
Start 06:55.
+5 => 07:00: Rionne WORK_BAR at Tavern/SPOT_04.
Advance to 09:00: Barmaid FLOOR_WORK at Tavern/SPOT_07.
09:20: Barmaid returns WORK_BAR/SPOT_05.
10:00: Rionne returns RIONNES_ROOM/SPOT_02.
Large jumps must still log every crossed agenda change.

Architecture:
World = geography.
Dimension Gear = only clock authority.
Agenda = intent.
Entity Registry = one current reality per entity.
Simulation = evaluates every registered entity for every crossed simulated minute.

Daily, weekly, monthly, yearly and one-off recurrence are supported by AgendaBook.
Navigation/witness/presentation are deliberately next, after this core passes.

Keep your existing assets/, lab/, manifest/PWA files and old working build safely preserved.
