import { INTERACTION_CONTENT } from '../content/interactions.js';
import { INTERACTION_TUNING } from '../content/tuning.js';
import { resolveInteraction, selectInteraction } from '../core/interaction-content.js';
import { sceneMeta } from './scene-view.js';
import { createAlphaHitTester } from './alpha-hit.js';
import { placePersonMenu } from './person-menu.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Keep speech bubbles inside the visible viewport.
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

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
    const portraitHitTester = createAlphaHitTester(portrait, INTERACTION_TUNING.alphaThreshold);
    let cardOrigin = null;

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
        ], { duration: INTERACTION_TUNING.boopMs, easing: 'ease-out' });
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
        ], { duration: INTERACTION_TUNING.boopMs, easing: 'ease-out' });
    }


    function start(person, node) {
        if (!player.isFree || !node || !person || person.state.location.scene !== player.sceneId) return;
        if (!INTERACTION_CONTENT[person.id]) return;
        current = person;
        player.setInteraction('PERSON');
        state = 'menu';
        boop(node);
        cardOrigin = node.getBoundingClientRect();
        placePersonMenu(menu, cardOrigin, innerWidth, innerHeight, INTERACTION_TUNING);
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
        const location = sceneMeta(world, player.sceneId);
        root.querySelector('.person-card-subtitle').textContent = location.title.toUpperCase();
        portraitHitTester.reset();
        portrait.src = content.portrait;
        cardScene.style.backgroundImage = `url("${sceneMeta(world, player.sceneId).image}")`;
        root.querySelector('.person-card-actions').hidden = false;
        root.querySelector('.person-observe-back').hidden = true;
        card.classList.remove('observing');
        root.classList.remove('portrait-observe');
        // Animate from the selected actor's screen position, not a fixed scene spot.
        if (cardOrigin && card.animate && matchMedia('(orientation:landscape)').matches &&
            !matchMedia('(prefers-reduced-motion:reduce)').matches) {
            const target = card.getBoundingClientRect();
            const dx = cardOrigin.left + cardOrigin.width / 2 - (target.left + target.width / 2);
            const dy = cardOrigin.top + cardOrigin.height / 2 - (target.top + target.height / 2);
            card.animate([
                { transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.16)`, opacity:.15 },
                { transform:'translate(-50%,-50%) scale(1.025)', opacity:1, offset:.84 },
                { transform:'translate(-50%,-50%) scale(1)', opacity:1 }
            ], { duration:INTERACTION_TUNING.cardOpenMs, easing:'cubic-bezier(.18,.88,.24,1.05)' });
        }
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
            await delay(INTERACTION_TUNING.checkEnterMs);
            if (state !== 'check' || current !== identity) return;
            observation.hidden = false;
            await delay(INTERACTION_TUNING.checkHoldMs);
            if (state !== 'check' || current !== identity) return;
            observation.classList.add('leaving');
            await delay(INTERACTION_TUNING.checkExitMs);
            if (state !== 'check' || current !== identity) return;
            cursors.set(selected.key, selected.next);
            complete(INTERACTION_TUNING.timeCostMinutes);
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
        const anchorX = rect ? rect.left + rect.width / 2 : innerWidth / 2;
        const anchorY = rect ? rect.top + rect.height * INTERACTION_TUNING.speechAnchorY : innerHeight / 2;
        const margin = INTERACTION_TUNING.speechMarginPx;
        const width = speech.offsetWidth || INTERACTION_TUNING.speechFallbackWidthPx;
        const height = speech.offsetHeight || INTERACTION_TUNING.speechFallbackHeightPx;
        const left = clamp(anchorX - width * INTERACTION_TUNING.speechHorizontalOffset, margin, Math.max(margin, innerWidth - width - margin));
        const top = clamp(anchorY - height - INTERACTION_TUNING.speechHeadClearancePx, margin, Math.max(margin, innerHeight - height - INTERACTION_TUNING.speechBottomMarginPx));
        speech.style.left = `${left}px`;
        speech.style.top = `${top}px`;
        speech.style.setProperty('--speech-pointer-x', `${clamp(anchorX - left - INTERACTION_TUNING.speechPointerInsetPx, INTERACTION_TUNING.speechPointerMinPx, width - INTERACTION_TUNING.speechPointerMaxInsetPx)}px`);
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
        }, 1000 / INTERACTION_TUNING.textCharactersPerSecond);
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
        complete(INTERACTION_TUNING.timeCostMinutes);
    }
    // Capture input on the full-screen layer; a text-dismissal tap must never
    // activate another actor or scene control beneath it.
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
        event.stopPropagation();
        if (state === 'text') {
            advanceText();
            return;
        }
        if (state === 'check') return;
        const action = event.target.closest('[data-person-action]')?.dataset.personAction;
        if (!action) {
            if (state === 'card' || state === 'observe') {
                if (portraitHitTester.hit(event)) boopPortrait();
                else if (event.target === root) complete();
            } else if (state === 'menu' && event.target === root) complete();
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
