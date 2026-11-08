import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const controller = read('js/ui/interactions.js');
const hit = read('js/ui/alpha-hit.js');
const menu = read('js/ui/person-menu.js');
const tuning = read('js/content/tuning.js');
const build = read('js/content/build.js');
const html = read('index.html');
const sw = read('sw.js');
assert.match(hit, /createAlphaHitTester/);
assert.match(hit, /getImageData/);
assert.match(menu, /placePersonMenu/);
assert.match(controller, /portraitHitTester.hit/);
assert.match(controller, /placePersonMenu\(menu/);
assert.match(tuning, /INTERACTION_TUNING = Object.freeze/);
assert.match(build, /0\.4\.2e\.10/);
for (const name of ['alpha-hit.js', 'person-menu.js']) {
    assert.ok(html.includes(name), `Import map: ${name}`);
    assert.ok(sw.includes(name), `Offline cache: ${name}`);
}
console.log('PASS interaction module boundaries and release label');
