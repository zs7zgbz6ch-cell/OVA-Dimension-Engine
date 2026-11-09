import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { MOTION, TRANSFER_TIMING } from '../js/content/tuning.js';
import { resolveInteraction } from '../js/core/interaction-content.js';

test('motion and transfer timing have one shared source', () => {
    assert.ok(Object.isFrozen(MOTION));
    assert.ok(Object.isFrozen(TRANSFER_TIMING));
    assert.equal(MOTION.maxStaggerMs, 680);
    assert.equal(TRANSFER_TIMING.arrivalPauseMs, 500);
});

test('dialogue precedence and stable cursor keys survive duplicate context references', () => {
    const shared = { talk: ['hello'] };
    const person = { id: 'P', state: { activity: 'WORK' } };
    const content = { P: { contexts: { 'TAVERN:WORK': shared, WORK: shared }, scenes: { TAVERN: shared }, default: shared } };
    assert.equal(resolveInteraction(content, person, 'TAVERN', 'talk').key, 'P:talk:activity:TAVERN:WORK');
    delete content.P.contexts['TAVERN:WORK'];
    assert.equal(resolveInteraction(content, person, 'TAVERN', 'talk').key, 'P:talk:activity:WORK');
    delete content.P.contexts.WORK;
    assert.equal(resolveInteraction(content, person, 'TAVERN', 'talk').key, 'P:talk:scene:TAVERN');
    delete content.P.scenes.TAVERN;
    assert.equal(resolveInteraction(content, person, 'TAVERN', 'talk').key, 'P:talk:default');
});

test('cache and import map include tuning module', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
    assert.match(html, /js\/content\/tuning\.js\?v=042e12/);
    assert.match(sw, /js\/content\/tuning\.js\?v=042e12/);
});
