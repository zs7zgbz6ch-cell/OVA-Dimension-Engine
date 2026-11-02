# OVA\-Dimension — Project Foundation

**Version:** 1\.0 · **Established:** 2 November 2026
**Baseline:** Clean Engine 0\.3\.3b — Gesture Audit
**Status:** Living project reference; not a claim that planned features are implemented\.

## 1\. Purpose and authority

OVA\-Dimension &#40;OVA\-D&#41; is an authored, illustrated, anime\-style interactive world\. The player experiences scenes and characters in a persistent world; this is not a conventional RPG\. The clean engine is the active development line\. The older prototype and abandoned project bible are **historical references**, not authoritative implementation sources\.

**Decision hierarchy:** &#40;1&#41; newly approved explicit decisions, &#40;2&#41; accepted and tested clean\-engine behavior, &#40;3&#41; verified current source contracts, &#40;4&#41; historical references and exploratory ideas\. When these disagree, record the discrepancy and ask rather than silently selecting an old rule\.

This document records architecture and development agreements\. It does not replace the actual source code, test results, or creative design documents\.

## 2\. Non\-negotiable engineering principles

1. One responsibility and one authoritative owner per kind of state\. Do not duplicate world truth in presentation\.
2. Understand and audit before changing\. Fix causes rather than stacking workarounds\.
3. Keep changes small, readable, testable, and independently reviewable\. No broad rewrites disguised as cleanup\.
4. The engine resolves generic rules; character\-specific content belongs in data, not branches hardcoded for Rionne\.
5. Presentation reads authoritative state and visualizes outcomes\. Animation must not move entities or advance time\.
6. Preserve working iPhone behavior unless a change is explicitly approved\.
7. Keep the old prototype read\-only unless a particular asset or technique is explicitly approved for adaptation\.
8. Avoid premature abstraction, global event buses, and extra state machines without demonstrated need\.
9. Every build: ZIP for GitHub upload, exact files\-changed list, Git commit summary under 50 characters, and focused iPhone test steps\.
10. Distinguish **implemented**, **tested**, **approved**, and **proposed**\. Never report a browser behavior as verified without an actual device test\.

## 3\. Engine ownership map

|Owner                           |Owns                                                                     |Must not own                                              |
|--------------------------------|-------------------------------------------------------------------------|----------------------------------------------------------|
|World Stage 0.8                 |Scenes, spots, connections, backgrounds, geography                       |Player viewpoint, agenda decisions, presentation animation|
|Player                          |Current scene, discovered scenes, transient interaction/busy state       |A player navigation spot, NPC positions                   |
|Entities                        |NPC identities, authoritative locations and activity state               |UI sprites and animations                                 |
|Dimension Gear                  |One authoritative in-game clock                                          |Real-time ticking independent of game actions             |
|Agenda                          |Intended activity/destination by in-game time                            |Moving entities                                           |
|Navigator                       |Route resolution through world connections                               |Character-specific cutscenes                              |
|Simulation                      |Applying agenda and navigation results on time advancement               |UI animation or presentation decisions                    |
|Travel                          |Player scene transitions                                                 |NPC schedules                                             |
|Save                            |Durable, validated game state                                            |Temporary menu/gesture state                              |
|Application shell / presentation|Title screen, scene display, overlays, orientation, input, future sprites|World truth or hidden simulation                          |

The player is a **scene\-level viewpoint**, with `currentScene`/scene identity and interaction state; **no Player Spot**\. World Stage spots describe NPC navigation and activity geography, not player staging\.

## 4\. Time and simulation contract

**Approved:** In\-game time is **action/event\-driven**, not real\-time\. Waiting in real life does not advance Dimension Gear\. Gameplay actions may consume authored durations &#40;e\.g\. examining something, conversation, travel&#41;; these are examples, not locked durations\. Development controls must use the **same Simulation advancement path** as gameplay actions\.

**Verified in 0\.3\.3b source:** `Simulation.advance(minutes)` advances Dimension Gear, then evaluates agenda state for each intervening minute\. The current UI already exposes \+1, \+5, \+30, \+60 minute controls and a world\-time readout inside the DEVELOPMENT section\. **Not yet implemented:** \+12 hours &#40;720 minutes&#41; control; improved entity diagnostic readout\. **Known concern:** Simulation advances clock before evaluating; failures can leave partial progress\. Address during 0\.3\.4d\.

Do not create a second clock or developer\-only simulation rules\. A \+12\-hour test must process intervening agenda transitions correctly; visual animation is not required for unwitnessed events\.

## 5\. Accepted shell behavior and testing environment

- **Accepted baseline:** 0\.3\.3b, tested on iPhone 14 Pro Max through GitHub\-hosted PWA workflow\.
- Portrait and landscape transitions no longer flash Tavern imagery during intro; repeated rotation passed user testing\.
- Hold\-to\-menu: **180 ms initial delay \+ 500 ms ring fill**, approximately **680 ms total**\. Keep this timing\. The delay avoids accidental hold\-menu invocation from a tap\.
- Native iOS magnifier may appear on **double\-tap\-and\-hold**\. This is a **deferred, low\-priority issue**; do not add broad gesture blocking at the expense of future interactions\.
- Landscape intro is a future **Title Screen** with potential New Game, Continue/Load, Extra; do not implement the full title menu prematurely\.
- Version plaque reads central `BUILD_INFO` &#40;`js/content/build.js`&#41;\. Version visibility does not itself guarantee cache coherence\.
- Developer works entirely from iPhone and uploads provided ZIP contents to GitHub; tests must be feasible on that device\.

## 6\. Verified baseline and open technical risks

These findings are based on the supplied 0\.3\.3b source and the two external reviews; they are **audit items**, not proof that every failure has occurred in production\.

**High priority**

- `js/main.js` combines boot, menus, save/load UI, travel presentation, startup, and hold gestures\. Separate by responsibility in a controlled shell refactor\.
- `player.isFree` exists, but the hold gesture currently checks DOM classes\. Define an explicit interaction/input gate; avoid conflicting sources of truth\.
- `SaveSystem.load()` applies clock, player, then entities without whole\-save validation or rollback\. Failed restore can leave mixed state\.
- Player snapshot persists temporary interaction state &#40;e\.g\. MENU&#41;; exclude transient UI state from durable saves\.
- Menu save action lacks storage\-error handling\.
- Service worker’s cache\-first/background\-refresh behavior can mix module/content versions during upgrades\. Build label and cache identity are maintained separately\.

**Additional review items**

- Duplicate clock conversion and location\-copy helpers\.
- Simulation error behavior after time has already advanced\.
- Validate agenda destinations and route reachability at boot or in development tests\.
- Barmaid fallback at transfer spot SPOT\_01: review as content, not assume bug\.
- Debug `window.OVAD` exposure and unbounded `simulation.log`\.
- CSS is compressed; formatting/readability cleanup should be behavior\-preserving and separate from feature work\.

**Save compatibility decision pending:** Missing entities in older saves should be initialized safely, but their state must be reconciled with the restored in\-game time\. Define and test migration/restore policy before coding\.

## 7\. Roadmap and milestone gates

### 0\.3\.3c — Development controls refinement &#40;proposed next feature&#41;

Keep existing time readout and \+1/\+5/\+30/\+60 buttons; add \+720 minutes and a compact authoritative NPC scene/spot readout\. Confirm busy\-state behavior and error feedback\. No separate clock or simulation logic\. This is a test instrument, not a simulation integrity fix\.

### 0\.3\.4a — Save/Load integrity

Validate complete save before mutation; define compatibility for newly added NPCs; exclude transient interaction state; handle storage exceptions; test malformed/incomplete/old saves\.

### 0\.3\.4b — Shell responsibilities

Extract cohesive menu, hold\-input, and travel\-presentation responsibilities without changing visual behavior\. Make input gating explicit\. Preserve accepted orientation controller and hold timing\.

### 0\.3\.4c — Update reliability

Prevent mixed JS/content versions on upgrade\. Test fresh install, update, offline behavior, and cache identity; don’t assume a version plaque proves successful update\.

### 0\.3\.4d — Simulation integrity

Centralize time conversion, validate agenda destinations/routes, define failure semantics, bound diagnostics, and preserve multi\-day schedule correctness\.

### 0\.4\.1 — Entity presence

Render generic NPC presence from actual authoritative location, with appropriate sprite mapping and interaction boundaries\. No hardcoded show/hide by clock\.

### 0\.4\.2 — Generic movement presentation

Use navigation results and approved directional art to show movement generically\. Adapt useful old\-prototype visual techniques, not its hardcoded schedules or routes\. Keep visual choreography separate from world truth\.

### 0\.4\.3 — Agenda and witness lifecycle

Distinguish witnessed, busy/missed, and off\-screen changes\. Define a structured movement\-result/event contract &#40;entity, origin, destination, route, time&#41; only as complex as required; no global event bus by default\. Simulation resolves outcomes, presentation chooses visual response\. Record availability at the relevant event time rather than checking only afterward\.

**Milestone ordering:** Foundation document → small development\-control refinement → 0\.3\.4a–d → 0\.4\.x\. Reassess after each device test; do not bundle unrelated changes\.

## 8\. Old prototype: preserve ideas, not architecture

Potentially reusable with approval: directional character sprites; walking visuals; door fade transitions; off\-screen synchronization presentation; visible\-pixel sprite hit testing; regression checklist\. **Do not port:** monolithic HTML/JS architecture, hardcoded Rionne trips or schedule times, split localStorage truth, duplicated positions, or animation routines that mutate world state\.

World Stage is geography\. Presentation\-only coordinates, stair fades, and sprite choreography should be represented in presentation data or another clearly owned visual layer, not silently mixed into authoritative geography\.

## 9\. Creative and design decisions not yet locked

- Final opening time and starting scene: current source uses a temporary 06:55\-era test start; abandoned bible’s 17:20 opening is **not automatically canon**\.
- Final character artwork mapping, placement, scaling, and Observe interaction\.
- Social/narrative facts: distinguish player knowledge, character disclosures, relationship counters, and world consequences\. Design a durable facts owner before dialogue systems, not as speculative 0\.3\.4 work\.
- Exact gameplay action durations, character\-specific animation choreography, and future title\-menu content\.
- Whether visual witnessing needs callbacks, returned structured results, or an event stream: decide when implementing the witness lifecycle\.

## 10\. Acceptance and audit workflow

1. Inspect the actual latest accepted ZIP and identify source\-of\-truth files\.
2. State the problem, ownership, intended behavior, files in scope, and regression risk **before coding**\.
3. Make the smallest coherent change\. Avoid rewriting unrelated modules\.
4. Run available static/simulation tests; document what was and was not tested\.
5. Deliver a ZIP, exact changed\-file list, concise Git commit summary, and a short iPhone test checklist\.
6. User tests the build on iPhone; only then mark it accepted and update this foundation’s baseline and decision log\.
7. Audit periodically for duplication, unused code, ownership drift, save compatibility, and UI/world\-truth leakage\.

### Suggested repeatable regression set

Startup portrait/landscape; repeated rotation; title dismissal; hold delay/ring/cancel; menu navigation; player travel; save/load and failure messages; time increments across agenda transitions; entity location/route connectivity; version label and upgrade/offline behavior\.

## 11\. Decision log

|Date      |Decision                                                  |Status                         |
|----------|----------------------------------------------------------|-------------------------------|
|2026-11-02|Clean 0.3.3b is accepted shell baseline                   |Accepted, iPhone-tested        |
|2026-11-02|Keep 180+500 ms hold timing                               |Accepted                       |
|2026-11-02|Defer native iOS double-tap-and-hold magnifier            |Accepted                       |
|2026-11-02|Time advances through game actions, not real-world waiting|Approved design contract       |
|2026-11-02|Dev controls must call normal simulation advancement      |Approved; partially implemented|
|2026-11-02|Historical bible and old prototype are references only    |Accepted                       |
|2026-11-02|Foundation hardening precedes entity presentation         |Approved roadmap               |

**Maintenance rule:** Update this document when decisions change\. Never quietly overwrite an accepted rule or mark a planned feature as implemented without source verification and testing\.
