import { INTERACTION_CONTENT } from '../content/interactions.js';
import { resolveInteraction, selectInteraction } from '../core/interaction-content.js';
import { sceneMeta } from './scene-view.js';

const TIME_COST_MINUTES = 5;
const TEXT_CHARACTERS_PER_SECOND = 35;
const CHECK_ENTER_MS = 180;
const CHECK_HOLD_MS = 2000;
const CHECK_EXIT_MS = 600;
const BOOP_MS = 220;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function mountInteractions({ world, player, entities, simulation, say }) {
    const root = document.querySelector('#personInteraction');
    const menu = root.querySelector('.person-menu');
    const card = root.querySelector('.person-card');
    const portrait = root.querySelector('.person-portrait');
    const cardScene = root.querySelector('.person-card-scene');
    const speech = root.querySelector('.person-speech');
    const speechText = root.querySelector('.person-speech-text');
    const observation = root.querySelector('.person-observation');
    const cursors = new Map();
    let current = null;
    let state = 'idle';
    let typing = null;
    let lines = [];
    let lineIndex = 0;
    let selection = null;
    let dialogueFromCard = false;
    let finishing = false;

    function resetVisuals() {
        menu.hidden = true;
        card.hidden = true;
        speech.hidden = true;
        observation.hidden = true;
        root.classList.remove('open', 'with-card', 'portrait-observe');
    }
    function unlock() {
        clearInterval(typing);
        typing = null;
        current = null;
        selection = null;
        state = 'idle';
        resetVisuals();
        if (player.interaction === 'PERSON') player.setInteraction('FREE');
    }
    function complete(minutes = 0) {
        if (finishing) return;
        finishing = true;
        unlock();
        try {
            if (minutes) simulation.advance(minutes);
        } catch (error) {
            console.error('Interaction time advance failed:', error);
            say('Could not advance world time.');
        } finally {
            finishing = false;
        }
    }
    function boop(node) {
        if (!node.animate) return;
        node.animate([
            { transform: 'translate(-50%,-100%) scale(1)', filter: 'brightness(1)' },
            { transform: 'translate(-50%,-100%) scale(1.08,.91)', filter: 'brightness(1.23)', offset: .38 },
            { transform: 'translate(-50%,-100%) scale(.97,1.045)', filter: 'brightness(1.08)', offset: .72 },
            { transform: 'translate(-50%,-100%) scale(1)', filter: 'brightness(1)' }
        ], { duration: BOOP_MS, easing: 'ease-out' });
    }
    // The card artwork has a different transform origin than a scene sprite.
    // Animate the image itself without modifying its resting layout.
    function boopPortrait() {
        if (!portrait.animate) return;
        portrait.animate([
            { transform: 'translateX(-50%) scale(1)' },
            { transform: 'translateX(-50%) scale(1.045,.965)', offset: .38 },
            { transform: 'translateX(-50%) scale(.99,1.018)', offset: .72 },
            { transform: 'translateX(-50%) scale(1)' }
        ], { duration: BOOP_MS, easing: 'ease-out' });
    }
    function placeMenu(rect) {
        const width = 166;
        menu.style.left = `${clamp(rect.left + rect.width / 2 - width / 2, 12, innerWidth - width - 12)}px`;
        menu.style.top = `${clamp(rect.bottom + 8, 12, innerHeight - 162)}px`;
    }
    function start(person, node) {
        if (!player.isFree || !node || !person || person.state.location.scene !== player.sceneId) return;
        if (!INTERACTION_CONTENT[person.id]) return;
        current = person;
        player.setInteraction('PERSON');
        state = 'menu';
        boop(node);
        placeMenu(node.getBoundingClientRect());
        root.querySelector('[data-person-action="primary"]').textContent = person.kind === 'character' ? 'INTERACT' : 'TALK';
        root.classList.add('open');
        menu.hidden = false;
    }
    function showCard() {
        const content = INTERACTION_CONTENT[current.id];
        if (!content?.portrait) { complete(); return; }
        state = 'card';
        menu.hidden = true;
        card.hidden = false;
        root.classList.add('with-card');
        root.querySelector('.person-card-name').textContent = current.name.toUpperCase();
        root.querySelector('.person-card-subtitle').textContent = content.subtitle || '';
        portrait.src = content.portrait;
        cardScene.style.backgroundImage = `url("${sceneMeta(world, player.sceneId).image}")`;
        root.querySelector('.person-card-actions').hidden = false;
        root.querySelector('.person-observe-back').hidden = true;
        card.classList.remove('observing');
        root.classList.remove('portrait-observe');
    }
    function observe() {
        state = 'observe';
        card.classList.add('observing');
        root.classList.add('portrait-observe');
        root.querySelector('.person-card-actions').hidden = true;
        root.querySelector('.person-observe-back').hidden = false;
    }
    function showCheck() {
        const set = resolveInteraction(INTERACTION_CONTENT, current, player.sceneId, 'check');
        const selected = selectInteraction(set, cursors);
        if (!selected) { complete(); return; }
        state = 'check';
        menu.hidden = true;
        card.hidden = true;
        root.classList.remove('with-card');
        observation.textContent = selected.lines[0];
        observation.hidden = true;
        observation.classList.remove('leaving');
        // Hold the input lock through the entrance delay and the entire exit.
        const identity = current;
        (async () => {
            await delay(CHECK_ENTER_MS);
            if (state !== 'check' || current !== identity) return;
            observation.hidden = false;
            await delay(CHECK_HOLD_MS);
            if (state !== 'check' || current !== identity) return;
            observation.classList.add('leaving');
            await delay(CHECK_EXIT_MS);
            if (state !== 'check' || current !== identity) return;
            cursors.set(selected.key, selected.next);
            complete(TIME_COST_MINUTES);
        })();
    }
    function positionSpeech() {
        speech.classList.toggle('card-speech', dialogueFromCard);
        if (dialogueFromCard) {
            speech.style.left = '';
            speech.style.top = '';
            return;
        }
        const actor = document.querySelector(`[data-entity="${current.id}"]`) ||
            document.querySelector(`[data-movement-entity="${current.id}"]`);
        const rect = actor?.getBoundingClientRect();
        speech.style.left = `${clamp((rect?.left ?? innerWidth / 2) - 35, 12, innerWidth - 360)}px`;
        speech.style.top = `${clamp((rect?.top ?? innerHeight / 2) - 90, 12, innerHeight - 125)}px`;
    }
    function renderLine() {
        clearInterval(typing);
        const full = lines[lineIndex];
        speechText.textContent = '';
        let shown = 0;
        typing = setInterval(() => {
            shown = Math.min(full.length, shown + 1);
            speechText.textContent = full.slice(0, shown);
            if (shown === full.length) { clearInterval(typing); typing = null; }
        }, 1000 / TEXT_CHARACTERS_PER_SECOND);
    }
    function talk(fromCard) {
        const set = resolveInteraction(INTERACTION_CONTENT, current, player.sceneId, 'talk');
        selection = selectInteraction(set, cursors);
        if (!selection) { complete(); return; }
        dialogueFromCard = fromCard;
        lines = selection.lines;
        lineIndex = 0;
        state = 'text';
        menu.hidden = true;
        if (fromCard) root.querySelector('.person-card-actions').hidden = true;
        speech.hidden = false;
        positionSpeech();
        renderLine();
    }
    function advanceText() {
        if (state !== 'text') return;
        if (typing) {
            clearInterval(typing);
            typing = null;
            speechText.textContent = lines[lineIndex];
            return;
        }
        if (++lineIndex < lines.length) { renderLine(); return; }
        cursors.set(selection.key, selection.next);
        complete(TIME_COST_MINUTES);
    }
    // Capture input on the full-screen layer; a text-dismissal tap must never
    // activate another actor or scene control beneath it.
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
        event.stopPropagation();
        if (state === 'text') { advanceText(); return; }
        if (state === 'check') return;
        const action = event.target.closest('[data-person-action]')?.dataset.personAction;
        if (!action) {
            if ((state === 'card' || state === 'observe') && event.target === portrait) boopPortrait();
            return;
        }
        if (action === 'leave') complete();
        else if (action === 'primary' && state === 'menu') {
            if (current.kind === 'character') showCard();
            else talk(false);
        } else if (action === 'check' && state === 'menu') showCheck();
        else if (action === 'talk' && state === 'card') talk(true);
        else if (action === 'observe' && state === 'card') observe();
        else if (action === 'back' && state === 'observe') {
            state = 'card';
            card.classList.remove('observing');
            root.classList.remove('portrait-observe');
            root.querySelector('.person-card-actions').hidden = false;
            root.querySelector('.person-observe-back').hidden = true;
        }
    });
    document.querySelector('#scene').addEventListener('click', event => {
        const node = event.target.closest('[data-entity],[data-movement-entity]');
        if (!node) return;
        event.stopPropagation();
        start(entities.get(node.dataset.entity || node.dataset.movementEntity), node);
    });
    return { isActive: () => state !== 'idle' };
}
