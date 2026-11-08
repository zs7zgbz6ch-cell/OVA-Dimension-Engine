import { INTERACTION_CONTENT } from '../content/interactions.js';
import { resolveInteraction, selectInteraction } from '../core/interaction-content.js';
import { sceneMeta } from './scene-view.js';

const TIME_COST_MINUTES = 5;
const TEXT_CHARACTERS_PER_SECOND = 35;
const CHECK_ENTER_MS = 180;
const CHECK_HOLD_MS = 2000;
const CHECK_EXIT_MS = 600;
const BOOP_MS = 220;
const SPEECH_HEAD_CLEARANCE_PX = 36;
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
    let portraitPixels = null;
    let portraitSource = null;
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
    // Alpha-aware hit testing: transparent pixels of a portrait are not interactive.
    // The canvas is only a cached mask; it never changes or redraws the artwork.
    function portraitHit(event) {
        if (event.target !== portrait || !portrait.complete || !portrait.naturalWidth) return false;
        if (portraitSource !== portrait.currentSrc) {
            portraitSource = portrait.currentSrc;
            portraitPixels = null;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = portrait.naturalWidth;
                canvas.height = portrait.naturalHeight;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                context.drawImage(portrait, 0, 0);
                portraitPixels = context.getImageData(0, 0, canvas.width, canvas.height);
            } catch (error) {
                // If a browser denies pixel access, keep the image interactive.
                return true;
            }
        }
        if (!portraitPixels) return true;
        const rect = portrait.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) * portraitPixels.width / rect.width);
        const y = Math.floor((event.clientY - rect.top) * portraitPixels.height / rect.height);
        if (x < 0 || y < 0 || x >= portraitPixels.width || y >= portraitPixels.height) return false;
        return portraitPixels.data[(y * portraitPixels.width + x) * 4 + 3] > 24;
    }

    function placeMenu(rect) {
        const width = 148;
        menu.style.left = `${clamp(rect.left + rect.width / 2 - width / 2, 12, innerWidth - width - 12)}px`;
        menu.style.top = `${clamp(rect.bottom + 8, 12, innerHeight - 148)}px`;
    }
    function start(person, node) {
        if (!player.isFree || !node || !person || person.state.location.scene !== player.sceneId) return;
        if (!INTERACTION_CONTENT[person.id]) return;
        current = person;
        player.setInteraction('PERSON');
        state = 'menu';
        boop(node);
        cardOrigin = node.getBoundingClientRect();
        placeMenu(cardOrigin);
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
        portraitPixels = null;
        portraitSource = null;
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
            ], { duration:320, easing:'cubic-bezier(.18,.88,.24,1.05)' });
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
        const anchorX = rect ? rect.left + rect.width / 2 : innerWidth / 2;
        const anchorY = rect ? rect.top + rect.height * .14 : innerHeight / 2;
        const margin = 12;
        const width = speech.offsetWidth || 340;
        const height = speech.offsetHeight || 85;
        const left = clamp(anchorX - width * .20, margin, Math.max(margin, innerWidth - width - margin));
        const top = clamp(anchorY - height - SPEECH_HEAD_CLEARANCE_PX, margin, Math.max(margin, innerHeight - height - 20));
        speech.style.left = `${left}px`;
        speech.style.top = `${top}px`;
        speech.style.setProperty('--speech-pointer-x', `${clamp(anchorX - left - 8, 20, width - 28)}px`);
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
        if (state === 'text') {
            advanceText();
            return;
        }
        if (state === 'check') return;
        const action = event.target.closest('[data-person-action]')?.dataset.personAction;
        if (!action) {
            if (state === 'card' || state === 'observe') {
                if (portraitHit(event)) boopPortrait();
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
