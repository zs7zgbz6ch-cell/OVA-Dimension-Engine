import { MANUAL_SLOTS } from '../core/save-slots.js';
import { sceneMeta, renderLocations, renderPlayerScene } from './scene-view.js';

const $ = selector => document.querySelector(selector);

export function mountSaveMenu({ saves, world, player, devHud, say, closeMenu, autosave, isTitleMode = () => false, onTitleLoad = () => {} }) {
    const slotConfirm = $('#slotConfirm');
    let overwriteSlot = null;
    let motion = true;

    function presentationState() { return { motion }; }
    function applyPresentation(state) {
        motion = state.motion !== false;
        document.documentElement.style.setProperty('--motion', motion ? '1' : '0');
        $('#motionBtn').textContent = `MENU MOTION · ${motion ? 'ON' : 'REDUCED'}`;
    }
    function refreshSlots() {
        $('#legacyLoadBtn').hidden = !saves.hasLegacySave();
        refreshAutosaves();
        for (const [mode, listId] of [['save', 'saveSlotList'], ['load', 'loadSlotList']]) {
            const list = $(`#${listId}`);
            list.replaceChildren();
            for (const slot of MANUAL_SLOTS) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'save-slot';
                button.dataset.slot = String(slot);
                button.dataset.slotAction = mode;
                const info = document.createElement('span');
                info.className = 'save-slot-info';
                const title = document.createElement('span');
                title.className = 'save-slot-name';
                title.textContent = `SLOT ${String(slot).padStart(2, '0')}`;
                const detail = document.createElement('span');
                detail.className = 'save-slot-detail';
                const action = document.createElement('span');
                action.className = 'save-slot-action';
                try {
                    const data = saves.inspectManual(slot);
                    detail.textContent = data ? `${data.timeLabel} · ${sceneMeta(world, data.sceneId).title}` : 'EMPTY SLOT';
                    action.textContent = mode === 'save' ? (data ? 'OVERWRITE' : 'SAVE') : 'LOAD';
                    if (mode === 'load' && !data) button.disabled = true;
                } catch (error) {
                    console.error(error);
                    detail.textContent = 'UNAVAILABLE / INVALID SAVE';
                    action.textContent = '—';
                    button.disabled = true;
                }
                info.append(title, detail);
                button.append(info, action);
                list.append(button);
            }
        }
    }
    function refreshAutosaves() {
        const list = $('#autoSlotList');
        list.replaceChildren();
        for (const index of [0, 1]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'save-slot';
            button.dataset.autoIndex = String(index);
            const info = document.createElement('span');
            info.className = 'save-slot-info';
            const name = document.createElement('span');
            name.className = 'save-slot-name';
            name.textContent = index === 0 ? 'LATEST AUTOSAVE' : 'PREVIOUS AUTOSAVE';
            const detail = document.createElement('span');
            detail.className = 'save-slot-detail';
            const action = document.createElement('span');
            action.className = 'save-slot-action';
            action.textContent = 'LOAD';
            try {
                const data = saves.inspectAutosave(index);
                detail.textContent = data
                    ? `${data.timeLabel} · ${sceneMeta(world, data.sceneId).title}`
                    : 'EMPTY CHECKPOINT';
                button.disabled = !data;
            } catch (error) {
                console.error('Autosave metadata unavailable:', error);
                detail.textContent = 'UNAVAILABLE / INVALID AUTOSAVE';
                button.disabled = true;
            }
            info.append(name, detail);
            button.append(info, action);
            list.append(button);
        }
    }
    function saveToSlot(slot) {
        try {
            saves.saveManual(slot, presentationState());
            refreshSlots();
            say(`Saved to slot ${slot}.`);
        } catch (error) {
            console.error(error);
            say('Save failed · storage unavailable.');
        }
    }
    function finishLoad(state, message) {
        autosave.discardPending();
        applyPresentation(state);
        renderPlayerScene(world, player);
        renderLocations(world, player);
        devHud.render();
        const fromTitle = isTitleMode();
        closeMenu();
        if (fromTitle) {
            player.setInteraction('STARTUP');
            onTitleLoad();
        }
        else say(message);
    }
    function loadFromSlot(slot) {
        try {
            const state = saves.loadManual(slot);
            if (!state) {
                say('Empty save slot.');
                refreshSlots();
                return;
            }
            finishLoad(state, `Loaded slot ${slot}.`);
        } catch (error) {
            console.error(error);
            refreshSlots();
            say('Save could not be loaded.');
        }
    }
    $('#autoSlotList').addEventListener('click', event => {
        const button = event.target.closest('[data-auto-index]');
        if (!button || button.disabled) return;
        const index = Number(button.dataset.autoIndex);
        try {
            const state = saves.loadAutosaveAt(index);
            if (state === null) return;
            finishLoad(state, 'Autosave restored.');
        } catch (error) {
            console.error('Autosave recovery failed:', error);
            refreshSlots();
            say('This autosave could not be restored.');
        }
    });
    $('#legacyLoadBtn').addEventListener('click', () => {
        try {
            const state = saves.load();
            if (!state) { say('No previous save.'); return; }
            finishLoad(state, 'Previous save loaded.');
        } catch (error) {
            console.error(error);
            say('Previous save could not be loaded.');
        }
    });
    function closeSlotConfirm() {
        overwriteSlot = null;
        slotConfirm.classList.remove('open');
    }
    $('#cancelSlotOverwrite').addEventListener('click', closeSlotConfirm);
    $('#confirmSlotOverwrite').addEventListener('click', () => {
        const slot = overwriteSlot;
        closeSlotConfirm();
        if (slot !== null) saveToSlot(slot);
    });
    for (const listId of ['saveSlotList', 'loadSlotList']) {
        $(`#${listId}`).addEventListener('click', event => {
            const button = event.target.closest('[data-slot-action]');
            if (!button || button.disabled) return;
            const slot = Number(button.dataset.slot);
            if (button.dataset.slotAction === 'load') { loadFromSlot(slot); return; }
            try {
                if (saves.inspectManual(slot)) {
                    overwriteSlot = slot;
                    $('#slotConfirmText').textContent = `Replace the existing save in slot ${slot}?`;
                    slotConfirm.classList.add('open');
                } else saveToSlot(slot);
            } catch (error) {
                console.error(error);
                say('Save slot unavailable.');
            }
        });
    }
    $('#motionBtn').addEventListener('click', () => {
        motion = !motion;
        applyPresentation({ motion });
        say(motion ? 'Full menu motion.' : 'Reduced menu motion.');
    });
    return { refreshSlots, applyPresentation, presentationState };
}
