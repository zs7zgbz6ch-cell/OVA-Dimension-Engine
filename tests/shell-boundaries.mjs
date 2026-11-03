import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const main = read('js/main.js');
const hold = read('js/ui/hold-input.js');
const menu = read('js/ui/menu.js');
const travel = read('js/ui/travel-view.js');
const hud = read('js/ui/dev-hud.js');
const sw = read('sw.js');

for (const module of ['menu', 'save-menu', 'travel-view', 'hold-input', 'scene-view']) {
    assert.match(main, new RegExp(`from './ui/${module}\\.js'`));
    assert.ok(sw.includes(`./js/ui/${module}.js`), `service worker must cache ${module}`);
}
assert.match(hold, /!player\.isFree/);
assert.match(hold, /HOLD_DELAY_MS = 180/);
assert.match(hold, /HOLD_FILL_MS = 500/);
assert.match(menu, /if \(!player\.isFree\) return/);
assert.match(menu, /player\.interaction === 'MENU'/);
assert.match(travel, /finally \{/);
assert.match(travel, /fade\.classList\.remove\('on'\)/);
assert.match(travel, /travelling = false/);
assert.match(hud, /document\.addEventListener\('pointerdown'/);
assert.match(hud, /event\.stopPropagation\(\)/);
assert.doesNotMatch(main, /function clearHold|function refreshSlots|function travelToTarget/);
console.log('PASS: shell module boundaries, hold timing, travel cleanup, HUD outside dismissal');
