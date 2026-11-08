// Pure transfer choreography. Connections decide *how* an edge is traversed.
// To/From markers guide presentation only and never enter the navigation graph.

import { TRANSFER_TIMING } from '../content/tuning.js';
export { TRANSFER_TIMING };

function location(world, step) {
    const spot = world.spot(step.scene, step.spot);
    if (!spot) throw new Error(`Missing transfer spot: ${step.scene}/${step.spot}`);
    return Object.freeze({
        scene: step.scene, spot: step.spot,
        type: spot.type, x: spot.x, y: spot.y, scale: spot.scale
    });
}

function marker(world, step) {
    const spot = world.transferMarker?.(step.scene, step.spot);
    return spot ? Object.freeze({
        scene: step.scene, spot: spot.id,
        type: 'tofrom', x: spot.x, y: spot.y, scale: spot.scale
    }) : null;
}

export function transferActions(world, route, scene, poseFor) {
    const actions = [];
    let walking = [];

    function flushWalk() {
        if (walking.length) {
            actions.push(Object.freeze({ kind: 'walk', legs: Object.freeze(walking) }));
            walking = [];
        }
    }

    function add(kind, details) {
        actions.push(Object.freeze({ kind, ...details }));
    }

    for (let index = 0; index < route.length; index++) {
        const current = route[index];
        const next = route[index + 1];
        if (current.scene !== scene) continue;
        const here = location(world, current);
        const previous = route[index - 1];

        if (previous && previous.scene !== scene) {
            flushWalk();
            const entrance = marker(world, current);
            if (entrance) add('marker', { from: entrance, to: here, entering: true });
            else add('fade-in', { at: here });
        }

        if (!next) continue;
        if (next.scene !== scene) {
            flushWalk();
            if (here.type === 'transfer') {
                add('pause', { ms: TRANSFER_TIMING.arrivalPauseMs });
                const exit = marker(world, current);
                if (exit) {
                    add('turn', { from: here, to: exit });
                    add('marker', { from: here, to: exit, entering: false });
                } else add('fade-out', { at: here });
            } else add('fade-out', { at: here });
            continue;
        }

        const destination = location(world, next);
        const movement = next.movement || world.connectionMovement?.(current, next) || 'walk';
        if (movement === 'walk') {
            if (here.type === 'transfer' && index > 0) {
                add('pause', { ms: TRANSFER_TIMING.arrivalPauseMs });
                add('turn', { from: here, to: destination });
            }
            walking.push(Object.freeze({
                from: here, to: destination,
                pose: poseFor(here, destination),
                smoothArrival: destination.type === 'waypoint'
            }));
            // Transfers are deliberate stops; waypoints remain continuous.
            if (destination.type === 'transfer' && route[index + 2]) {
                flushWalk();
            }
            continue;
        }
        if (movement !== 'fade') throw new Error(`Unknown movement type: ${movement}`);
        flushWalk();
        if (here.type === 'transfer') {
            add('pause', { ms: TRANSFER_TIMING.arrivalPauseMs });
            add('turn', { from: here, to: destination });
        }
        add('fade-out', { at: here });
        add('fade-in', { at: destination });
    }
    flushWalk();
    return Object.freeze(actions);
}
