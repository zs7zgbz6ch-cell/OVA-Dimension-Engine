import assert from 'node:assert/strict';
import { DimensionGear } from '../js/core/dimension-gear.js';
import { Simulation } from '../js/core/simulation.js';
import { EntityRegistry } from '../js/core/entities.js';
import { Navigator } from '../js/core/navigation.js';

const loc = spot => ({ scene: 'S', spot });
const spots = ['A', 'W', 'B'];
const world = {
    has: place => place?.scene === 'S' && spots.includes(place.spot),
    findPath: (from, to) => [from.spot, 'W', to.spot].filter((s, i, a) => i === 0 || s !== a[i - 1]).map(id => ({ scene: 'S', id, type: id === 'W' ? 'waypoint' : 'idle' })),
    key: (scene, spot) => `${scene}/${spot}`
};
const gear = new DimensionGear();
const entities = new EntityRegistry(world);
for (const id of ['one', 'two']) entities.register({ id, name: id, agendaId: id, start: { location: loc('A'), activity: 'IDLE' } });
const initial = gear.epochMinute;
let fail = false;
const agendas = { resolve(id, clock) {
    if (fail && id === 'two' && clock.epochMinute === initial + 5) throw Error('planned failure');
    return { id: 'go', activity: 'GO', destination: loc(clock.epochMinute >= initial + 4 ? 'A' : clock.epochMinute >= initial + 2 ? 'B' : 'A') };
} };
const sim = new Simulation({ gear, entities, agendas, navigator: new Navigator({ world, entities }) });
const observed = [];
sim.onSuccessfulAdvance(result => observed.push(result));
const first = sim.advance(2);
assert.equal(first.moves.length, 2);
assert.deepEqual(first.moves.map(move => move.entityId), ['one', 'two']);
for (const move of first.moves) {
    assert.equal(move.minute, initial + 2);
    assert.deepEqual(move.from, loc('A'));
    assert.deepEqual(move.to, loc('B'));
    assert.deepEqual(move.route.map(step => step.spot), ['A', 'W', 'B']);
    assert.ok(Object.isFrozen(move) && Object.isFrozen(move.from) && Object.isFrozen(move.to));
    assert.ok(Object.isFrozen(move.route) && move.route.every(Object.isFrozen));
}
assert.equal(observed.length, 1);
assert.strictEqual(observed[0], first);
assert.throws(() => { first.moves[0].route[0].spot = 'tampered'; }, TypeError);
assert.equal(sim.advance(1).moves.length, 0);
assert.equal(sim.advance(0).moves.length, 0);
// A failed multi-minute advance must not emit any partially completed moves.
const before = entities.snapshot();
const beforeMinute = gear.epochMinute;
const beforeLog = sim.log.length;
fail = true;
assert.throws(() => sim.advance(2), /planned failure/);
assert.deepEqual(entities.snapshot(), before);
assert.equal(gear.epochMinute, beforeMinute);
assert.equal(sim.log.length, beforeLog);
assert.equal(observed.length, 3);
console.log('PASS: committed multi-entity movement events, routes, timestamps, immutability, rollback');
