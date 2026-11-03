import assert from 'node:assert/strict';
import { SaveSlots } from '../js/core/save-slots.js';
const memory = new Map();
let failKey = null;
const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => { if (key === failKey) throw Error('quota'); memory.set(key, value); },
    removeItem: key => memory.delete(key)
};
const slots = new SaveSlots(storage);
assert.throws(() => slots.writeManual(4, '{}'));
for (const n of [1,2,3]) slots.writeManual(n, `manual-${n}`);
for (const n of [1,2,3]) assert.equal(slots.readManual(n), `manual-${n}`);
slots.writeAutosave('first');
slots.writeAutosave('second');
assert.deepEqual(slots.readAutosaves(), ['second','first']);
slots.writeAutosave('third');
assert.deepEqual(slots.readAutosaves(), ['third','second']);
failKey = 'ovad_clean_engine_v034b_auto_1';
assert.throws(() => slots.writeAutosave('broken'));
assert.deepEqual(slots.readAutosaves(), ['third','second']);
failKey = null;
slots.clearAutosaves();
assert.deepEqual(slots.readAutosaves(), []);
slots.clearManual(2);
assert.equal(slots.readManual(2), null);
assert.equal(slots.readManual(1), 'manual-1');
console.log('PASS: manual slot isolation, autosave rotation, failed write, clear');
