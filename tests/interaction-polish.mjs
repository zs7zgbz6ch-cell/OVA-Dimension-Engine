import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const ui = read('js/ui/interactions.js').toString();
const css = read('css/ovad.css').toString();
const html = read('index.html').toString();
assert.equal(createHash('sha256').update(read('assets/characters/rionne-card.png')).digest('hex'),
  '6a0205be22096c154214aa0e00f931792cf4c6e1a8ba83e40972e5acc06a7f8d');
assert.match(ui, /function boopPortrait\(/);
assert.match(ui, /state === 'card' \|\| state === 'observe'/);
assert.match(ui, /complete\(TIME_COST_MINUTES\)/);
assert.match(ui, /if \(state === 'check'\) return/);
assert.match(css, /\.person-observation\{[^}]*background:none;border:0/);
assert.match(css, /\.person-card\.observing\{width:min\(510px,39vw\)\}/);
assert.match(html, /ROTATE FOR PORTRAIT VIEW/);
assert.doesNotMatch(html, /person-menu-name/);
assert.doesNotMatch(css, /person-card[^\n]*slide/i);
console.log('PASS: portrait identity, card boop, floating check, layout, no slide');
