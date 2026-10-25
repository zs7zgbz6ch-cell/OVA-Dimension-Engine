export class World {
    constructor(data) {
        this.data = data;
        this.nodes = new Map();
        this.edges = new Map();

        for (const [sceneId, scene] of Object.entries(data.scenes)) {
            for (const spot of scene.spots) {
                const key = this.key(sceneId, spot.id);
                this.nodes.set(key, { scene: sceneId, ...spot });
                this.edges.set(key, new Set());
            }
        }

        for (const { a, b } of data.connections) {
            const keyA = this.key(a.scene, a.spot);
            const keyB = this.key(b.scene, b.spot);

            if (!this.nodes.has(keyA) || !this.nodes.has(keyB)) {
                throw new Error(`Bad World connection: ${keyA} ↔ ${keyB}`);
            }

            this.edges.get(keyA).add(keyB);
            this.edges.get(keyB).add(keyA);
        }
    }

    key(sceneId, spotId) {
        return `${sceneId}/${spotId}`;
    }

    scenes() {
        return Object.values(this.data.scenes);
    }

    scene(sceneId) {
        return this.data.scenes[sceneId] || null;
    }

    defaultLocationForScene(sceneId) {
        const scene = this.scene(sceneId);
        if (!scene?.spots?.length) return null;
        const preferred = scene.spots.find(spot => spot.type === 'transfer') || scene.spots[0];
        return { scene: sceneId, spot: preferred.id };
    }

    has(location) {
        return Boolean(
            location &&
            this.nodes.has(this.key(location.scene, location.spot))
        );
    }

    findPath(startLocation, destination) {
        const start = this.key(startLocation.scene, startLocation.spot);
        const end = this.key(destination.scene, destination.spot);

        if (!this.nodes.has(start) || !this.nodes.has(end)) return null;

        const queue = [start];
        const previous = new Map([[start, null]]);

        while (queue.length) {
            const current = queue.shift();

            if (current === end) {
                const path = [];
                for (let key = end; key !== null; key = previous.get(key)) {
                    path.push(this.nodes.get(key));
                }
                return path.reverse();
            }

            for (const neighbour of this.edges.get(current)) {
                if (!previous.has(neighbour)) {
                    previous.set(neighbour, current);
                    queue.push(neighbour);
                }
            }
        }

        return null;
    }
}

export async function loadWorld() {
    const response = await fetch("./world/world-stage.json", {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`World Stage failed to load (${response.status}).`);
    }

    return new World(await response.json());
}
