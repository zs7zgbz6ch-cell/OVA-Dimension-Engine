function copyLocation(location) {
    return { scene: location.scene, spot: location.spot };
}

export class Navigator {
    constructor({ world, entities }) {
        this.world = world;
        this.entities = entities;
    }

    routeLocations(startLocation, destination) {
        if (!this.world.has(startLocation) || !this.world.has(destination)) return null;
        return this.world.findPath(startLocation, destination);
    }

    route(entityId, destination) {
        const entity = this.entities.get(entityId);

        if (!entity) throw new Error(`Unknown entity: ${entityId}`);
        if (!this.world.has(destination)) {
            throw new Error(`Bad destination for ${entityId}`);
        }

        const path = this.routeLocations(entity.state.location, destination);

        if (!path) {
            throw new Error(
                `No World route for ${entityId}: ` +
                `${this.world.key(entity.state.location.scene, entity.state.location.spot)} → ` +
                `${this.world.key(destination.scene, destination.spot)}`
            );
        }

        return path.map(node => ({
            scene: node.scene,
            spot: node.id,
            type: node.type
        }));
    }

    navigate(entityId, destination, epochMinute) {
        const entity = this.entities.get(entityId);
        const route = this.route(entityId, destination);
        const from = copyLocation(entity.state.location);

        // Logical simulation resolves the full route immediately.
        // Presentation can later animate these exact route steps when witnessed.
        for (const step of route.slice(1)) {
            this.entities.moveTo(entityId, step, epochMinute);
        }

        return {
            entityId,
            from,
            destination: copyLocation(destination),
            route,
            moved: route.length > 1
        };
    }
}
