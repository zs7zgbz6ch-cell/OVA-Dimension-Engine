import assert from 'node:assert/strict';
import { createMovementView } from '../js/ui/movement-view.js';

// A tiny deterministic stage: test the real presenter, not source-text matches.
class FakeNode {
    constructor(tag = 'img') {
        this.tag = tag;
        this.style = {};
        this.dataset = {};
        this.children = [];
        this.attributes = {};
    }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return key === 'src' ? this.src : this.attributes[key]; }
    append(node) { this.children.push(node); node.parent = this; }
    remove() {
        if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this);
        this.parent = null;
    }
    animate() {
        let resolve;
        const finished = new Promise(done => { resolve = done; });
        const animation = { finished, cancel: () => resolve() };
        animations.push({ animation, finish: resolve });
        return animation;
    }
}

const animations = [];
const stage = new FakeNode('div');
const rionne = new FakeNode();
rionne.dataset.entity = 'rionne';
const barmaid = new FakeNode();
barmaid.dataset.entity = 'barmaid';
stage.append(rionne);
stage.append(barmaid);
globalThis.document = {
    querySelector: () => stage,
    createElement: tag => new FakeNode(tag)
};
globalThis.Image = class { set src(value) { this._src = value; } decode() { return Promise.resolve(); } };

const spots = {
    STAIRS: { x: 95, y: 90, scale: 60, type: 'transfer' },
    BAR: { x: 36, y: 68, scale: 27, type: 'idle' }
};
const world = { spot: (_scene, spot) => spots[spot] };
const entities = new Map([
    ['rionne', { content: { assetFamily: 'rionne' } }],
    ['barmaid', { content: { assetFamily: 'barmaid' } }]
]);
const player = {
    sceneId: 'TAVERN',
    interaction: 'FREE',
    get isFree() { return this.interaction === 'FREE'; },
    setInteraction(value) { this.interaction = value; }
};
const location = spot => ({ scene: 'TAVERN', spot });
const result = {
    now: { epochMinute: 420 },
    moves: [{
        entityId: 'rionne', minute: 420,
        from: location('STAIRS'), to: location('BAR'),
        route: [location('STAIRS'), location('BAR')]
    }]
};

const view = createMovementView({ world, entities, player });
view.play(result);
assert.equal(rionne.style.visibility, 'hidden', 'destination must be hidden synchronously');
assert.equal(barmaid.style.visibility, undefined, 'unrelated NPC must remain visible');
assert.equal(player.interaction, 'MOVEMENT');
view.cancel();
assert.equal(rionne.style.visibility, undefined, 'cancel restores original visibility');
assert.equal(barmaid.style.visibility, undefined);
assert.equal(player.interaction, 'FREE');

// A second day's movement must have the same synchronous ownership.
view.play(result);
assert.equal(rionne.style.visibility, 'hidden');
assert.equal(barmaid.style.visibility, undefined);
view.cancel();
assert.equal(rionne.style.visibility, undefined);
console.log('PASS: synchronous sprite ownership, independent NPCs, cancellation and repeat day');
