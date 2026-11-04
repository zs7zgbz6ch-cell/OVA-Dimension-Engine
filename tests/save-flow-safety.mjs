import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaveSlots } from '../js/core/save-slots.js';
import { SaveSystem } from '../js/core/save.js';

const storage = new Map();
const fakeStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
};
const slots = new SaveSlots(fakeStorage);
slots.writeAutosave('old');
slots.writeAutosave('new');
assert.equal(slots.readAutosave(0), 'new');
assert.equal(slots.readAutosave(1), 'old');
assert.throws(() => slots.readAutosave(2), /Invalid autosave index/);
const saves = Object.create(SaveSystem.prototype);
saves.slots = slots;
saves.restoreSerialized = raw => ({ restored: raw });
assert.deepEqual(saves.loadAutosaveAt(1), { restored: 'old' });
assert.deepEqual(saves.loadAutosaveAt(0), { restored: 'new' });
assert.deepEqual(slots.readAutosaves(), ['new', 'old']); // loading never rotates

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../js/ui/menu.js', import.meta.url), 'utf8');
const saveMenu = readFileSync(new URL('../js/ui/save-menu.js', import.meta.url), 'utf8');
for (const id of ['continueBtn', 'newGameBtn', 'titleLoadBtn', 'titleExtraBtn',
    'titleSettingsBtn', 'newGameConfirm', 'autoSlotList']) {
    assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /Be warned that a new game will overwrite previous autosaves/);
assert.match(main, /if \(saves\.hasAutosave\(\)\) newGameConfirm/);
assert.match(menu, /if \(!wasTitle\) autosave\.flush\(\)/);
assert.match(saveMenu, /saves\.loadAutosaveAt\(index\)/);
assert.match(saveMenu, /if \(fromTitle\)/);
console.log('PASS: two recovery snapshots, no load rotation, explicit title choices, warning and title isolation');
