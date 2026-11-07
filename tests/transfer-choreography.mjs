import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World } from '../js/core/world.js';
import { movementPose, planMovement } from '../js/core/movement-plan.js';
import { transferActions, TRANSFER_TIMING } from '../js/core/transfer-plan.js';

const data = JSON.parse(readFileSync(new URL('../world/world-stage.json', import.meta.url)));
const world = new World(data);
const tavern = 'BERKLITH_TAVERN';
const room = 'RIONNES_ROOM';
const loc = (scene, spot) => ({ scene, spot });
const edge = (a, b) => world.connectionMovement(loc(tavern, a), loc(tavern, b));
assert.equal(edge('SPOT_06', 'SPOT_04'), 'fade');
assert.equal(edge('SPOT_04', 'SPOT_06'), 'fade');
assert.equal(edge('SPOT_03', 'SPOT_07'), 'walk');
assert.equal(world.transferMarker(tavern, 'SPOT_02').id, 'SPOT_08');
assert.equal(world.findPath(loc(tavern, 'SPOT_02'), loc(tavern, 'SPOT_08')), null,
    'To/From must never become a navigable destination');

function actions(start, end, scene = tavern) {
    const route = world.findPath(start, end).map((node, index, path) => ({
        scene: node.scene, spot: node.id, type: node.type,
        movement: index ? world.connectionMovement(
            loc(path[index - 1].scene, path[index - 1].id),
            loc(node.scene, node.id)
        ) : null
    }));
    return transferActions(world, route, scene, movementPose);
}
const enterBar = actions(loc(tavern, 'SPOT_02'), loc(tavern, 'SPOT_04'));
assert.deepEqual(enterBar.slice(-4).map(a => a.kind), ['pause', 'turn', 'fade-out', 'fade-in']);
assert.equal(enterBar.at(-1).at.spot, 'SPOT_04');
const leaveBar = actions(loc(tavern, 'SPOT_04'), loc(tavern, 'SPOT_02'));
assert.deepEqual(leaveBar.slice(0, 4).map(a => a.kind), ['fade-out', 'fade-in', 'pause', 'turn']);
const table = actions(loc(tavern, 'SPOT_05'), loc(tavern, 'SPOT_07'));
assert.ok(table.some(a => a.kind === 'walk'));
assert.equal(table.filter(a => a.kind === 'fade-out').length, 1);
assert.equal(table.filter(a => a.kind === 'fade-in').length, 1);
assert.equal(table.at(-1).kind, 'walk');
const departure = actions(loc(tavern, 'SPOT_04'), loc(room, 'SPOT_02'));
const exit = departure.find(a => a.kind === 'marker');
assert.equal(exit.from.spot, 'SPOT_02');
assert.equal(exit.to.spot, 'SPOT_08');
assert.equal(exit.entering, false);
const arrival = actions(loc(room, 'SPOT_02'), loc(tavern, 'SPOT_04'));
assert.equal(arrival[0].kind, 'marker');
assert.equal(arrival[0].from.spot, 'SPOT_08');
assert.equal(arrival[0].entering, true);
assert.equal(TRANSFER_TIMING.arrivalPauseMs, 500);
assert.equal(TRANSFER_TIMING.turnPauseMs, 500);

const route = world.findPath(loc(tavern, 'SPOT_04'), loc(room, 'SPOT_02'));
const move = {
    entityId: 'rionne', minute: 600,
    from: loc(tavern, 'SPOT_04'), to: loc(room, 'SPOT_02'),
    route: route.map((node, index) => ({
        scene: node.scene, spot: node.id, type: node.type,
        movement: index ? world.connectionMovement(
            loc(route[index - 1].scene, route[index - 1].id),
            loc(node.scene, node.id)
        ) : null
    }))
};
const plans = planMovement({ moves: [move], endMinute: 600, scene: tavern, world });
assert.ok(Object.isFrozen(plans[0].actions));
assert.ok(plans[0].actions.some(a => a.kind === 'marker'));
assert.ok(plans[0].actions.some(a => a.kind === 'fade-out'));
console.log('PASS: typed connections, bar fades, table route, To/From, immutable actions');
