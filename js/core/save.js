const SAVE_KEY = 'ovad_clean_engine_save_v03';

export class SaveSystem {
    constructor({ gear, entities }) {
        this.gear = gear;
        this.entities = entities;
    }

    capture(presentation = {}) {
        return {
            version: 1,
            epochMinute: this.gear.epochMinute,
            entities: this.entities.snapshot(),
            presentation: { ...presentation }
        };
    }

    save(presentation = {}) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.capture(presentation)));
    }

    load() {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const save = JSON.parse(raw);
        if (save?.version !== 1 || !Number.isInteger(save.epochMinute) || !save.entities) {
            throw new Error('Unsupported OVA-D save data.');
        }
        this.gear.setEpochMinute(save.epochMinute);
        this.entities.restore(save.entities);
        return save.presentation || {};
    }

    clear() {
        localStorage.removeItem(SAVE_KEY);
    }
}
