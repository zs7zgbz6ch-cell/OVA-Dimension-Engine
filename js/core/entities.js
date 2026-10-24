function copyLocation(location) {
    return { scene: location.scene, spot: location.spot };
}

export class EntityRegistry {
    constructor(world) {
        this.world = world;
        this.entities = new Map();
    }

    register(definition) {
        if (this.entities.has(definition.id)) {
            throw new Error(`Duplicate entity: ${definition.id}`);
        }

        if (!this.world.has(definition.start.location)) {
            throw new Error(`Bad start location: ${definition.id}`);
        }

        const entity = {
            ...definition,
            state: {
                location: copyLocation(definition.start.location),
                agendaBlockId: null,
                activity: definition.start.activity,
                sinceEpochMinute: null
            }
        };

        this.entities.set(entity.id, entity);
        return entity;
    }

    get(entityId) {
        return this.entities.get(entityId) || null;
    }

    all() {
        return [...this.entities.values()];
    }

    applyAgendaState(entityId, intent, epochMinute) {
        const entity = this.get(entityId);
        if (!entity) throw new Error(`Unknown entity: ${entityId}`);

        const changed =
            entity.state.agendaBlockId !== intent.id ||
            entity.state.activity !== intent.activity;

        if (!changed) return false;

        entity.state.agendaBlockId = intent.id;
        entity.state.activity = intent.activity;
        entity.state.sinceEpochMinute = epochMinute;
        return true;
    }

    moveTo(entityId, location, epochMinute) {
        const entity = this.get(entityId);

        if (!entity) throw new Error(`Unknown entity: ${entityId}`);
        if (!this.world.has(location)) {
            throw new Error(`Bad location for ${entityId}`);
        }

        const changed =
            entity.state.location.scene !== location.scene ||
            entity.state.location.spot !== location.spot;

        if (!changed) return false;

        entity.state.location = copyLocation(location);
        entity.state.sinceEpochMinute = epochMinute;
        return true;
    }
    snapshot() {
        return Object.fromEntries(this.all().map(entity => [entity.id, {
            location: copyLocation(entity.state.location),
            agendaBlockId: entity.state.agendaBlockId,
            activity: entity.state.activity,
            sinceEpochMinute: entity.state.sinceEpochMinute
        }]));
    }

    restore(snapshot) {
        for (const entity of this.all()) {
            const state = snapshot[entity.id];
            if (!state) throw new Error(`Missing saved entity: ${entity.id}`);
            if (!this.world.has(state.location)) throw new Error(`Bad saved location: ${entity.id}`);
            entity.state = {
                location: copyLocation(state.location),
                agendaBlockId: state.agendaBlockId ?? null,
                activity: state.activity,
                sinceEpochMinute: state.sinceEpochMinute ?? null
            };
        }
    }

}
