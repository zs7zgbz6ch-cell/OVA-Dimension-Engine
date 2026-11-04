import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaveSystem } from '../js/core/save.js';

// Continue must prefer the newest snapshot, then recover using the older one.
const attempts = [];
const system = Object.create(SaveSystem.prototype);
system.slots = { readAutosaves: () => ['damaged', 'valid'] };
system.restoreSerialized = raw => {
    attempts.push(raw);
    if (raw === 'damaged') throw new Error('Invalid snapshot');
    return { motion: false };
};
assert.equal(system.hasAutosave(), true);
assert.deepEqual(system.loadAutosave(), { motion: false });
assert.deepEqual(attempts, ['damaged', 'valid']);
system.slots.readAutosaves = () => [];
assert.equal(system.hasAutosave(), false);
assert.equal(system.loadAutosave(), null);
system.slots.readAutosaves = () => ['damaged'];
assert.throws(() => system.loadAutosave(), /Invalid snapshot/);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
assert.match(html, /id="continueBtn"[^>]*hidden/);
assert.match(main, /saves\.loadAutosave\(\)/);
assert.match(main, /player\.setInteraction\('STARTUP'\);\s*leaveStartup\(\)/);
assert.match(main, /if \(event\.target\.closest\('#continueBtn'\)\) return/);
console.log('PASS: continue availability, fallback, failure, startup gating');
