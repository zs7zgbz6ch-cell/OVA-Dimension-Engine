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

    all() {
        return [...this.entities.values()];
    }

    applyAgendaIntent(entityId, intent, epochMinute) {
        const entity = this.entities.get(entityId);

        if (!entity) throw new Error(`Unknown entity: ${entityId}`);
        if (!this.world.has(intent.destination)) {
            throw new Error(`Bad destination for ${entityId}`);
        }

        const old = entity.state;
        const changed =
            old.agendaBlockId !== intent.id ||
            old.activity !== intent.activity ||
            old.location.scene !== intent.destination.scene ||
            old.location.spot !== intent.destination.spot;

        if (!changed) return false;

        entity.state = {
            location: copyLocation(intent.destination),
            agendaBlockId: intent.id,
            activity: intent.activity,
            sinceEpochMinute: epochMinute
        };

        return true;
    }
}
