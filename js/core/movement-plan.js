import { transferActions } from './transfer-plan.js';
// Pure, scene-local presentation plans derived from committed simulation facts.
// No DOM, timing side effects, character identities or world mutations.

const locationKey = node => `${node.scene}/${node.spot}`;

// Presentation policy, independent of individual schedules or characters.
// A seek is a change of observation time, not a queue of animations to replay.
export const PRESENTATION_POLICY = Object.freeze({ maxAnimatedAdvanceMinutes: 60 });

export function movementPose(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y; // Stage Y increases toward the viewer.
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error('Invalid movement coordinates.');
    if (Math.abs(dx) < 0.00001 && Math.abs(dy) < 0.00001) return 'stationary';
    // Stage scale is authored depth. When moving significantly deeper into the
    // scene, the back must be visible even along a mostly horizontal route.
    const depth = Number.isFinite(from.scale) && Number.isFinite(to.scale)
        ? to.scale - from.scale : 0;
    if (depth < -1 && dy < 0) {
        return Math.abs(dx) <= Math.abs(dy) * 0.55
            ? 'back' : `back-three-quarter-${dx > 0 ? 'right' : 'left'}`;
    }
    if (Math.abs(dx) <= Math.abs(dy) * 0.55) return dy > 0 ? 'front' : 'back';
    if (Math.abs(dy) <= Math.abs(dx) * 0.55) return dx > 0 ? 'right' : 'left';
    return `${dy > 0 ? 'front' : 'back'}-three-quarter-${dx > 0 ? 'right' : 'left'}`;
}

function spotAt(world, node) {
    const spot = world.spot(node.scene, node.spot);
    if (!spot) throw new Error(`Missing movement spot: ${locationKey(node)}`);
    return Object.freeze({ scene: node.scene, spot: node.spot, type: spot.type, x: spot.x, y: spot.y, scale: spot.scale });
}

function visibleLegs(world, route, scene) {
    const legs = [];
    for (let i = 1; i < route.length; i++) {
        if (route[i - 1].scene !== scene || route[i].scene !== scene) continue;
        if (route[i].movement === 'fade' ||
            world.connectionMovement?.(route[i - 1], route[i]) === 'fade') continue;
        const from = spotAt(world, route[i - 1]);
        const to = spotAt(world, route[i]);
        legs.push(Object.freeze({ from, to, pose: movementPose(from, to), smoothArrival: to.type === 'waypoint' }));
    }
    return Object.freeze(legs);
}

// Only live boundary events animate. Crossed events are already committed to
// authoritative state and must never create historical presentation work.
export function planMovement({ moves, endMinute, startMinute = endMinute, scene, world }) {
    if (!Array.isArray(moves) || !Number.isSafeInteger(endMinute) ||
        !Number.isSafeInteger(startMinute) || startMinute > endMinute || !scene || !world?.spot) {
        throw new Error('Invalid movement planning input.');
    }
    const plans = [];
    for (const move of moves) {
        if (!move?.route?.length || !move.from || !move.to || !Number.isSafeInteger(move.minute)) {
            throw new Error('Invalid committed movement event.');
        }
        if (move.minute > endMinute) throw new Error('Movement occurs after advance end.');
        // Only a live boundary event can be witnessed. Never replay events
        // crossed by a seek, regardless of how many entities were involved.
        const witnessed = move.minute === endMinute &&
            endMinute - startMinute <= PRESENTATION_POLICY.maxAnimatedAdvanceMinutes;
        if (!witnessed) continue;
        const route = move.route;
        const visitsScene = route.some(step => step.scene === scene);
        if (!visitsScene) continue;
        if (witnessed) {
            const actions = transferActions(world, route, scene, movementPose);
            const legs = visibleLegs(world, route, scene);
            // A cross-scene hop is represented by its boundary nodes, never
            // interpolated across two unrelated background coordinate systems.
            const arrivals = [];
            const departures = [];
            for (let i = 0; i < route.length; i++) {
                if (route[i].scene !== scene) continue;
                if (i > 0 && route[i - 1].scene !== scene) arrivals.push(spotAt(world, route[i]));
                if (i < route.length - 1 && route[i + 1].scene !== scene) departures.push(spotAt(world, route[i]));
            }
            plans.push(Object.freeze({ entityId: move.entityId, minute: move.minute, mode: 'walk',
                actions, legs, arrivals: Object.freeze(arrivals), departures: Object.freeze(departures) }));
        }
    }
    return Object.freeze(plans);
}
