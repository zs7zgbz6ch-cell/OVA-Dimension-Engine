import { SaveSlots } from './save-slots.js';
import { clockFromEpochMinute, formatClock } from './dimension-gear.js';
// Keep the established storage key and v3 schema compatible with accepted 0.3.3c saves.
const SAVE_KEY = 'ovad_clean_engine_save_v032';

export class SaveSystem {
    constructor({ gear, entities, player, agendas = null }) {
        this.gear = gear;
        this.entities = entities;
        this.player = player;
        this.agendas = agendas;
        this.slots = new SaveSlots();
    }

    capture(presentation = {}) {
        return {
            version: 3,
            epochMinute: this.gear.epochMinute,
            player: this.player.snapshot(),
            entities: this.entities.snapshot(),
            presentation: { ...presentation }
        };
    }

    save(presentation = {}) {
        // Storage errors are intentionally propagated to the UI for honest feedback.
        const data = JSON.stringify(this.capture(presentation));
        localStorage.setItem(SAVE_KEY, data);
    }

    hasLegacySave() { return localStorage.getItem(SAVE_KEY) !== null; }

    // Existing single-save API remains available for legacy 0.3.4a saves.
    load() {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw === null ? null : this.restoreSerialized(raw);
    }

    restoreSerialized(raw) {
        const save = JSON.parse(raw);
        if (!save || save.version !== 3 || !save.player || !save.entities) {
            throw new Error('Unsupported OVA-D save data.');
        }

        // Prepare every subsystem before mutating any live state.
        const previousMinute = this.gear.epochMinute;
        const previousPlayer = this.player.snapshot();
        const previousEntities = this.entities.snapshot();
        const previousDate = this.gear.date;
        this.gear.setEpochMinute(save.epochMinute);
        const clock = this.gear.snapshot();
        this.gear.date = previousDate;
        const nextPlayer = this.player.prepareRestore(save.player);
        const nextEntities = this.entities.prepareRestore(save.entities, clock, this.agendas);

        // Defensive rollback even if an unexpected error occurs during commit.
        try {
            this.gear.setEpochMinute(save.epochMinute);
            this.player.restore(nextPlayer);
            this.entities.restore(Object.fromEntries(nextEntities), clock, this.agendas);
        } catch (error) {
            this.gear.setEpochMinute(previousMinute);
            this.player.restore(previousPlayer);
            this.entities.restore(previousEntities);
            throw error;
        }
        return save.presentation && typeof save.presentation === 'object' && !Array.isArray(save.presentation)
            ? save.presentation : {};
    }

    inspectManual(slot) {
        const raw = this.slots.readManual(slot);
        if (raw === null) return null;
        const data = JSON.parse(raw);
        if (!data || data.version !== 3 || !data.player || !data.entities ||
            !Number.isSafeInteger(data.epochMinute) ||
            typeof data.player.scene !== 'string' ||
            !this.player.world.hasScene(data.player.scene)) {
            throw new Error('Invalid manual save metadata.');
        }
        const clock = clockFromEpochMinute(data.epochMinute);
        return {
            sceneId: data.player.scene,
            epochMinute: data.epochMinute,
            timeLabel: formatClock(clock)
        };
    }

    saveManual(slot, presentation = {}) {
        this.slots.writeManual(slot, JSON.stringify(this.capture(presentation)));
    }

    loadManual(slot) {
        const raw = this.slots.readManual(slot);
        return raw === null ? null : this.restoreSerialized(raw);
    }

    saveAutosave(presentation = {}) {
        this.slots.writeAutosave(JSON.stringify(this.capture(presentation)));
    }

    // Try the previous checkpoint if the newest is corrupt. A valid snapshot
    // still goes through the same atomic restoration contract.
    loadAutosave() {
        const candidates = this.slots.readAutosaves();
        if (!candidates.length) return null;
        let lastError;
        for (const raw of candidates) {
            try { return this.restoreSerialized(raw); }
            catch (error) { lastError = error; }
        }
        throw lastError;
    }

    clear() {
        localStorage.removeItem(SAVE_KEY);
    }
}
