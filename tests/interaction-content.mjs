import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveInteraction, selectInteraction } from '../js/core/interaction-content.js';
import { INTERACTION_CONTENT } from '../js/content/interactions.js';

const person = (id, activity = 'WORK_BAR') => ({ id, state: { activity } });

test('NPC lines rotate one at a time, only when caller commits selection', () => {
    const cursors = new Map();
    const set = resolveInteraction(INTERACTION_CONTENT, person('NPC_01'), 'BERKLITH_TAVERN', 'talk');
    const first = selectInteraction(set, cursors);
    assert.deepEqual(first.lines, ['Hello, how are you?']);
    assert.deepEqual(selectInteraction(set, cursors).lines, first.lines);
    cursors.set(first.key, first.next);
    assert.deepEqual(selectInteraction(set, cursors).lines, ['Oops, I just dropped a glass!']);
    cursors.set(first.key, 2);
    assert.deepEqual(selectInteraction(set, cursors).lines, ['I wish this night was over.']);
    cursors.set(first.key, 0);
    assert.deepEqual(selectInteraction(set, cursors).lines, first.lines);
});

test('character talk is one three-line conversation, check is independent', () => {
    const rionne = person('CHARACTER_01');
    assert.equal(selectInteraction(resolveInteraction(INTERACTION_CONTENT, rionne, 'BERKLITH_TAVERN', 'talk'), new Map()).lines.length, 3);
    assert.match(selectInteraction(resolveInteraction(INTERACTION_CONTENT, rionne, 'BERKLITH_TAVERN', 'check'), new Map()).lines[0], /spent some time watching Rionne/);
});

test('specific agenda/scene content wins; cursor keys are context-specific', () => {
    const content = { PERSON: {
        default: { talk: [['default']] },
        scenes: { MARKET: { talk: [['market']] } },
        contexts: { WORK: { talk: [['working']] }, 'MARKET:WORK': { talk: [['market work']] } }
    } };
    const p = person('PERSON', 'WORK');
    const a = resolveInteraction(content, p, 'MARKET', 'talk');
    const b = resolveInteraction(content, p, 'TAVERN', 'talk');
    assert.deepEqual(selectInteraction(a, new Map()).lines, ['market work']);
    assert.deepEqual(selectInteraction(b, new Map()).lines, ['working']);
    assert.notEqual(a.key, b.key);
    assert.deepEqual(selectInteraction(resolveInteraction(content, person('PERSON', 'REST'), 'MARKET', 'talk'), new Map()).lines, ['market']);
    assert.deepEqual(selectInteraction(resolveInteraction(content, person('PERSON', 'REST'), 'TAVERN', 'talk'), new Map()).lines, ['default']);
});

test('no dialogue means no invented fallback', () => {
    assert.equal(resolveInteraction(INTERACTION_CONTENT, person('OTHER'), 'MARKET', 'talk'), null);
});
