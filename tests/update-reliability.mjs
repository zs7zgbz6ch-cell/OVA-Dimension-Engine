import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const world = readFileSync(new URL('../js/core/world.js', import.meta.url), 'utf8');
const slots = readFileSync(new URL('../js/core/save-slots.js', import.meta.url), 'utf8');
const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
for (const folder of ['core','ui','content']) for (const name of readdirSync(new URL(`../js/${folder}/`, import.meta.url)).filter(n => n.endsWith('.js'))) {
  const path = `./js/${folder}/${name}`;
  assert.equal(map[path], `${path}?v=042b`, path);
  assert.ok(sw.includes(`${path}?v=042b`), path);
}
assert.match(html, /main\.js\?v=042b/);
assert.match(html, /ovad\.css\?v=042b/);
assert.match(world, /world-stage\.json\?v=042b/);
assert.match(slots, /ovad_clean_engine_v034b_/);
assert.doesNotMatch(sw, /cache\.put\(/);
console.log('PASS: complete versioned module graph, asset manifest, stable save namespace');
