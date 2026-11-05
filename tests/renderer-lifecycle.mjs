import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World } from '../js/core/world.js';
import { EntityRegistry } from '../js/core/entities.js';
import { RIONNE, BARMAID } from '../js/content/data.js';
import { renderPlayerScene } from '../js/ui/scene-view.js';

class Element {
    constructor(tag) { this.tag = tag; this.className = ''; this.style = {}; this.dataset = {}; this.children = []; this.parentNode = null; this.attrs = {}; this.listeners = {}; }
    append(...nodes) { for (const node of nodes) { if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1); node.parentNode = this; this.children.push(node); } }
    replaceChildren(...nodes) { for (const node of this.children) node.parentNode = null; this.children = []; this.append(...nodes); }
    querySelector(selector) { return this.children.find(child => `.${child.className}` === selector) || null; }
    setAttribute(key, value) { this.attrs[key] = value; }
    getAttribute(key) { return key === 'src' ? this.src : this.attrs[key]; }
    addEventListener(type, fn) { this.listeners[type] = fn; }
    replaceWith(node) { const p = this.parentNode; if (!p) return; p.children[p.children.indexOf(this)] = node; node.parentNode = p; this.parentNode = null; }
}
const root = new Element('div');
globalThis.document = { querySelector: selector => selector === '#scene' ? root : null, createElement: tag => new Element(tag) };
const world = new World(JSON.parse(readFileSync(new URL('../world/world-stage.json', import.meta.url))));
const entities = new EntityRegistry(world);
entities.register(RIONNE);
entities.register(BARMAID);
const player = { sceneId: 'BERKLITH_TAVERN' };
const actors = () => root.querySelector('.scene-stage').querySelector('.scene-actors');
renderPlayerScene(world, player, entities);
const barmaid = actors().children[0];
assert.equal(barmaid.dataset.entity, 'NPC_01');
assert.equal(barmaid.style.left, '27%');
renderPlayerScene(world, player, entities);
assert.equal(actors().children[0], barmaid, 'unchanged sprite is reused');
entities.moveTo('NPC_01', { scene: 'BERKLITH_TAVERN', spot: 'SPOT_07' }, 1);
renderPlayerScene(world, player, entities);
assert.equal(actors().children[0], barmaid, 'moving a character updates its existing sprite');
assert.equal(barmaid.style.top, '98.3%');
assert.equal(barmaid.style.height, '57%');
entities.moveTo('CHARACTER_01', { scene: 'BERKLITH_TAVERN', spot: 'SPOT_04' }, 2);
renderPlayerScene(world, player, entities);
assert.equal(actors().children.length, 2);
assert.equal(actors().children[1], barmaid, 'existing character survives another arrival');
entities.moveTo('NPC_01', { scene: 'RIONNES_ROOM', spot: 'SPOT_02' }, 3);
renderPlayerScene(world, player, entities);
assert.equal(actors().children.length, 1, 'departed character removed');
assert.equal(barmaid.parentNode, null);
const rionne = actors().children[0];
rionne.listeners.error();
assert.equal(actors().children[0].className, 'scene-actor-fallback', 'failed image uses placeholder');
assert.equal(actors().children[0].dataset.entity, 'CHARACTER_01');
console.log('PASS: keyed DOM reuse, movement, arrival, departure, image failure');
