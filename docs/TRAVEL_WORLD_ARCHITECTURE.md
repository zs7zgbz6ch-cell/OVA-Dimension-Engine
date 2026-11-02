OVA-Dimension — Travel & World Architecture Specification

Version: 1.0
Date: 2 November 2026
Status: Approved design direction — implementation pending
Baseline: Clean Engine 0.3.3c
Related document: docs/PROJECT_FOUNDATION.md

⸻

1. Purpose

This specification defines the intended relationship between dimensions, world time, travel, locations, character agendas, discoveries, and persistent game state.

Its purpose is to guide future engine development without prematurely implementing unfinished gameplay systems.

The accepted Clean Engine 0.3.3c remains the stable baseline. New features must respect existing system ownership and preserve tested behavior.

2. Core World Principle

One shared timeline. Multiple simultaneous alternate realities.

OVA-Dimension contains multiple dimensions representing alternate realities, not separate timelines.

All dimensions share one authoritative world clock: Dimension Gear.

At any given world time, characters across all dimensions may be performing activities, following agendas, travelling, or participating in events.

Changing dimensions changes the player’s location, not the world’s timeline.

Required behavior

* World time moves forward only.
* No dimension maintains an independent game clock.
* Characters’ agendas continue to resolve as world time advances, regardless of the player’s location.
* Off-screen characters remain part of the authoritative world state.
* World simulation must not depend on whether a scene is currently rendered.
* The game remains event-driven; real-world elapsed time does not automatically advance Dimension Gear.

3. World Geography and Navigation Concepts

The following concepts must remain distinct.

Dimension

A dimension is a logical grouping of related world content and represents an alternate reality.

It is not itself a physical scene or player location.

Hub

The Hub is a future main location within the world, not a separate timeline.

Characters may eventually discover, access, visit, and follow agendas within the Hub.

Its gameplay design remains undecided: it may become explorable, menu-oriented, or a combination.

No placeholder Hub scene is required until its geography and gameplay are defined.

Main destination

A main destination is a deliberately authored location accessible through the global Travel interface when the player has appropriate discovery and access.

A main destination has a designated arrival scene.

Local scene

A local scene is a physical area reached through authored world interactions, such as doors, stairs, or passages.

Not every discovered scene is a global Travel destination.

NPC spot

NPC spots are used by entities and their navigation systems.

They are not player destinations, and the player does not require a Player Spot.

4. Travel Interface Hierarchy

The intended navigation flow is:

1. Main Menu → Travel
2. OVA-Dimensions directory
3. Dimension selection screen
4. Major destination panel
5. Full-screen location preview
6. GO → Actual travel

The OVA-Dimensions directory presents the Hub and accessible dimensions through thumbnail cards.

Dimension selection screens provide themed artwork and panels representing major destinations.

Selecting a destination opens its location preview before committing to travel.

Preview layout

* Location title and subtitle: upper-left
* BACK: upper-right
* GO: lower-right
* Full-screen destination artwork retained

Dimension-specific visual treatments and decorative frames may be introduced later as presentation configuration.

Presentation boundaries

Opening the directory, selecting a dimension, inspecting destination panels, and viewing previews do not change world time or player location.

Only a confirmed travel action may initiate the relevant world-state changes.

5. Travel Convenience and Time Selection

The player should be able to reach meaningful times without repeatedly performing unnecessary waiting or sleeping actions.

The destination preview will eventually offer five arrival options:

* Travel now
* Morning
* Afternoon
* Evening
* Night

Travel now is the default.

Time advancement rules

A time-of-day selection advances the single world clock forward to the first appropriate arrival time.

If the selected period has already passed, the next occurrence is used.

If the selected period is currently underway, immediate arrival within that period may be allowed.

For example, selecting Afternoon while it is already nighttime advances normally to the following afternoon.

Time must never move backward.

All intervening agenda transitions and relevant world events must be processed through the authoritative Simulation system.

A selected time period must never directly place a character at a desired location or guarantee an encounter.

Implementation details still open

Exact time-period boundaries, target arrival times, travel duration, and the handling of interrupted or unavailable travel remain to be specified before implementation.

Time advancement and arrival must be validated and coordinated so that a failed travel operation cannot leave the world partially updated.

6. Player Travel and Local Exploration

Global Travel is intended to be convenient.

Unlocked destinations are normally accessible without requiring the player to return to a portal or the Hub.

Specific story conditions may restrict access when explicitly authored.

Travel to a main destination uses its designated arrival scene by default.

After arrival, the player explores adjacent scenes through authored world interactions.

The Travel system remains authoritative for player scene transitions. UI components must not independently modify the player’s location.

7. Discovery and Destination Availability

Player discovery and destination access are separate concepts.

Major destinations may become available through exploration, conversations, story progression, or other authored events.

Some destinations may be unlocked automatically when appropriate.

A dimension being known does not automatically require every destination within it to become accessible.

The global Travel interface should display destinations according to the player’s persistent discovery and access state.

Discovering a local scene does not automatically make it a global Travel destination.

8. Autonomous Character Agendas

Characters have authoritative agendas independent of the player’s current location.

As world time advances, the Simulation resolves relevant agenda activities and entity state across the shared world.

Characters may eventually travel between dimensions when their knowledge, access, agenda conditions, and valid navigation rules permit it.

Character-owned facts

The architecture must distinguish:

* Knowledge: A character knows a dimension or destination exists.
* Access: A character is permitted and able to travel there.
* Preferences: A character enjoys or favors particular locations.
* Agenda: The character’s authored activities and conditions.
* Actual state: The character’s authoritative current location and activity.

For example, after Rionne discovers the Hub and gains access, her agenda may become eligible to schedule visits there.

Learning about a destination does not automatically grant access, change her preferences, or teleport her.

Agenda conditions may read persistent character facts, but agenda evaluation must not invent those facts.

Cross-dimension movement must follow valid world navigation rules or explicitly authored travel mechanisms.

9. Player Knowledge and Agenda Discovery

The player’s knowledge of a character’s routine is distinct from that character’s actual agenda.

The player may discover information through dialogue, observation, exploration, and events.

Future character journal or agenda features may reveal partial or progressively detailed schedule information.

For example, the player might learn that Rionne often visits a certain location in the evening.

This information helps the player decide where and when to travel.

It does not change Rionne’s actual schedule or guarantee that she will be present.

The player chooses when and where to arrive. The world determines what they find.

10. Simulation and System Ownership

The existing architectural boundaries remain authoritative.

* Dimension Gear: One shared world clock.
* World Stage: Physical scenes, geography, spots, and authored connections.
* Player: Current scene, discoveries, and player-owned persistent facts.
* Entities: Character identity and authoritative state.
* Agenda: Intended activities, destinations, and eligibility conditions.
* Navigator: Valid routes between supported locations and spots.
* Simulation: Time advancement, agenda evaluation, and entity-state resolution.
* Travel: Authoritative player scene transitions.
* Save/Load: Persistence and restoration of valid authoritative state.
* Presentation/UI: Displays world state and gathers player intentions.

No second clock, independent Travel simulation, or presentation-owned character-location logic may be introduced.

Future cross-dimension routing may require explicit navigation extensions, but must not bypass authoritative movement rules.

11. Save/Load Requirements

The persistence model must accommodate:

* The single authoritative world time.
* The player’s current physical scene.
* Authoritative entity state.
* Player discoveries and destination access.
* Character-owned knowledge and access.
* Persistent story and world-progression facts.
* Player-unlocked character agenda information.

Transient interface state normally must not be saved as authoritative game state.

Examples include an open Travel menu, selected dimension card, location preview, or unconfirmed time-of-day selection.

Save restoration must be validated before applying changes to the live world.

Future additions of dimensions, destinations, characters, and facts must have deliberate compatibility and defaulting rules.

This specification does not require implementing the complete future facts system immediately. It requires avoiding persistence decisions that would prevent its clean introduction.

12. Deferred Design Decisions

The following remain open:

* Whether the Hub is explorable, menu-oriented, or hybrid.
* The Hub’s physical geography and character activities.
* Exact time-of-day boundaries and arrival calculations.
* Detailed travel-duration and travel-restriction policies.
* Character journal and unlocked-agenda presentation.
* Dimension-specific decorative interface designs.
* Cross-dimension character movement mechanisms.
* Detailed witnessed, missed, and off-screen event lifecycle behavior.

These must be resolved when their respective implementation milestones are reached.

13. Implementation Sequence

1. Record and approve this specification.
2. Audit Clean Engine 0.3.3c against the specification.
3. Harden Save/Load integrity, including future compatibility boundaries.
4. Refine shell responsibilities, update reliability, and simulation integrity in separately tested milestones.
5. Implement the Travel interface overhaul, including the agreed location-preview layout.
6. Continue Entity Presence and generic character movement.
7. Introduce persistent knowledge, cross-dimension agendas, and discovered agenda information when supporting gameplay systems are ready.

Do not introduce placeholder world content or speculative engine systems solely to demonstrate future interface concepts.

14. Guiding Principle

Convenient travel. One living world. Independent characters. Meaningful discovery.

The player should be free to choose destinations and arrival times without unnecessary friction.

Characters continue their lives across simultaneous alternate realities.

Knowledge and observation help the player understand those lives, but do not control them.

All new implementation must preserve authoritative system ownership, deterministic world progression, and the accepted stable baseline.

⸻

End of Specification v1.0
