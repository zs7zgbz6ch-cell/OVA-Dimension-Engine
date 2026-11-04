import assert from 'node:assert/strict';
import { AutosaveCoordinator, crossedAutosaveCheckpoint } from '../js/core/autosave.js';
import { DimensionGear } from '../js/core/dimension-gear.js';
import { Simulation } from '../js/core/simulation.js';
import { SaveSlots } from '../js/core/save-slots.js';

const day = 1440;
assert.equal(crossedAutosaveCheckpoint(355, 360), true);
assert.equal(crossedAutosaveCheckpoint(360, 360), false);
assert.equal(crossedAutosaveCheckpoint(360, 719), false);
assert.equal(crossedAutosaveCheckpoint(359, day + 1), true);
assert.equal(crossedAutosaveCheckpoint(720, 1080), true);
assert.throws(() => crossedAutosaveCheckpoint(10, 9));

const gear = new DimensionGear();
const player = { isFree: true };
const saved = [];
let failSave = false;
let warnings = 0;
const saves = { saveAutosave() { if (failSave) throw new Error('quota'); saved.push(gear.epochMinute); } };
const coordinator = new AutosaveCoordinator({ gear, player, saves, onError() { warnings++; } });
const simulation = new Simulation({ gear, entities: { snapshot: () => ({}), all: () => [] }, agendas: {}, navigator: {} });
simulation.onSuccessfulAdvance(result => coordinator.onAdvance(result));
// Starting 06:55, crossing 12:00 commits a snapshot at actual final time.
simulation.advance(306);
assert.equal(saved.length, 1);
assert.equal(saved[0], gear.epochMinute);
simulation.advance(1);
assert.equal(saved.length, 1);
// Multiple crossings while busy coalesce into one snapshot at the safe boundary.
player.isFree = false;
simulation.advance(1000);
assert.equal(saved.length, 1);
assert.equal(coordinator.pending, true);
player.isFree = true;
assert.equal(coordinator.flush(), true);
assert.equal(saved.length, 2);
assert.equal(coordinator.pending, false);
// Storage failure retains pending checkpoint, with no false success.
failSave = true;
simulation.advance(400);
assert.equal(coordinator.pending, true);
assert.equal(warnings, 1);
failSave = false;
assert.equal(coordinator.flush(), true);
assert.equal(coordinator.pending, false);
// Failed world advance must not create an autosave.
const before = saved.length;
assert.throws(() => simulation.advance(-1));
assert.equal(saved.length, before);
// Existing rotating storage contract: newest then previous, manual slot untouched.
const data = new Map();
const storage = { getItem: k => data.has(k) ? data.get(k) : null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
const slots = new SaveSlots(storage);
slots.writeManual(1, 'manual');
slots.writeAutosave('first');
slots.writeAutosave('second');
slots.writeAutosave('third');
assert.deepEqual(slots.readAutosaves(), ['third','second']);
assert.equal(slots.readManual(1), 'manual');
console.log('PASS: checkpoint crossing, settled save, coalescing, retry, failed advance, rotation');
