function copyLocation(location) {
    return { scene: location.scene, spot: location.spot };
}

export class EntityRegistry {
    constructor(world) {
        this.world = world;
        this.entities = new Map();
        this.initialStates = new Map();
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
        this.initialStates.set(entity.id, { ...entity.state, location: copyLocation(entity.state.location) });
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

    prepareRestore(snapshot, clock = null, agendas = null) {
        if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Bad saved entities.');
        const prepared = new Map();
        for (const entity of this.all()) {
            const saved = snapshot[entity.id];
            let state;
            if (saved === undefined) {
                // New characters in older saves begin from their authored agenda at saved time.
                const intent = clock && agendas?.resolve(entity.agendaId, clock);
                const initial = this.initialStates.get(entity.id);
                state = intent ? {
                    location: copyLocation(intent.destination), agendaBlockId: intent.id,
                    activity: intent.activity, sinceEpochMinute: clock.epochMinute
                } : { ...initial, location: copyLocation(initial.location) };
            } else {
                if (!saved || typeof saved !== 'object' || !saved.location ||
                    !this.world.has(saved.location) ||
                    typeof saved.activity !== 'string' ||
                    (saved.agendaBlockId != null && typeof saved.agendaBlockId !== 'string') ||
                    (saved.sinceEpochMinute != null && (!Number.isSafeInteger(saved.sinceEpochMinute) ||
                        (clock && saved.sinceEpochMinute > clock.epochMinute)))) {
                    throw new Error(`Bad saved entity: ${entity.id}`);
                }
                state = {
                    location: copyLocation(saved.location), agendaBlockId: saved.agendaBlockId ?? null,
                    activity: saved.activity, sinceEpochMinute: saved.sinceEpochMinute ?? null
                };
            }
            if (!this.world.has(state.location)) throw new Error(`Bad saved location: ${entity.id}`);
            prepared.set(entity.id, state);
        }
        return prepared;
    }

    restore(snapshot, clock = null, agendas = null) {
        const prepared = this.prepareRestore(snapshot, clock, agendas);
        for (const [id, state] of prepared) this.entities.get(id).state = state;
    }
}
