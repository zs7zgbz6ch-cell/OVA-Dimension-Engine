// Keep the established storage key and v3 schema compatible with accepted 0.3.3c saves.
const SAVE_KEY = 'ovad_clean_engine_save_v032';

export class SaveSystem {
    constructor({ gear, entities, player, agendas = null }) {
        this.gear = gear;
        this.entities = entities;
        this.player = player;
        this.agendas = agendas;
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

    load() {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw === null) return null;
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

    clear() {
        localStorage.removeItem(SAVE_KEY);
    }
}
