import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AutosaveCoordinator } from '../js/core/autosave.js';

const snapshots = [];
const player = { isFree: true };
let motion = false;
const coordinator = new AutosaveCoordinator({
    gear: {}, player,
    saves: { saveAutosave: presentation => snapshots.push(presentation) },
    getPresentation: () => ({ motion })
});
coordinator.onAdvance({ old: { epochMinute: 359 }, now: { epochMinute: 361 } });
assert.deepEqual(snapshots, [{ motion: false }]);
motion = true;
coordinator.onAdvance({ old: { epochMinute: 719 }, now: { epochMinute: 721 } });
assert.deepEqual(snapshots[1], { motion: true });
player.isFree = false;
motion = false;
coordinator.onAdvance({ old: { epochMinute: 1079 }, now: { epochMinute: 1081 } });
assert.equal(snapshots.length, 2);
player.isFree = true;
coordinator.flush();
assert.deepEqual(snapshots[2], { motion: false });

const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui/save-menu.js', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
assert.match(main, /autosave\.getPresentation = saveMenu\.presentationState/);
assert.match(ui, /return \{ refreshSlots, applyPresentation, presentationState \}/);
assert.match(sw, /await \(await caches\.open\(CACHE\)\)\.match\(req\)/);
assert.match(sw, /await \(await caches\.open\(CACHE\)\)\.match\(new URL/);
assert.doesNotMatch(sw, /\.match\(req\) \|\|/);
console.log('PASS: autosave motion preference, delayed snapshot, service worker cache fallback');
