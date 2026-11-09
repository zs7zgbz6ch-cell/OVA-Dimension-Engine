export class World {
    constructor(data) {
        this.data = data;
        this.nodes = new Map();
        this.edges = new Map();
        this.connectionTypes = new Map();
        this.toFrom = new Map();

        for (const [sceneId, scene] of Object.entries(data.scenes)) {
            for (const spot of scene.spots) {
                const key = this.key(sceneId, spot.id);
                this.nodes.set(key, { scene: sceneId, ...spot });
                this.edges.set(key, new Set());
            }
        }

        for (const { a, b, movement = 'walk' } of data.connections) {
            const keyA = this.key(a.scene, a.spot);
            const keyB = this.key(b.scene, b.spot);

            if (!this.nodes.has(keyA) || !this.nodes.has(keyB)) {
                throw new Error(`Bad World connection: ${keyA} ↔ ${keyB}`);
            }

            const first = this.nodes.get(keyA);
            const second = this.nodes.get(keyB);
            if (first.type === 'tofrom' || second.type === 'tofrom') {
                if (first.type === second.type ||
                    (first.type !== 'transfer' && second.type !== 'transfer') ||
                    first.scene !== second.scene || movement !== 'walk') {
                    throw new Error(`Invalid To/From connection: ${keyA} ↔ ${keyB}`);
                }
                const transfer = first.type === 'transfer' ? keyA : keyB;
                const marker = first.type === 'tofrom' ? first : second;
                if (this.toFrom.has(transfer)) throw new Error(`Duplicate To/From: ${transfer}`);
                this.toFrom.set(transfer, marker);
                continue;
            }
            if (movement !== 'walk' && movement !== 'fade') {
                throw new Error(`Unknown connection movement: ${movement}`);
            }
            this.edges.get(keyA).add(keyB);
            this.edges.get(keyB).add(keyA);
            this.connectionTypes.set(this.edgeKey(keyA, keyB), movement);
        }
    }

    key(sceneId, spotId) {
        return `${sceneId}/${spotId}`;
    }

    edgeKey(first, second) {
        return [first, second].sort().join(' ↔ ');
    }

    connectionMovement(from, to) {
        return this.connectionTypes.get(this.edgeKey(
            this.key(from.scene, from.spot), this.key(to.scene, to.spot)
        )) || null;
    }

    transferMarker(scene, spot) {
        const marker = this.toFrom.get(this.key(scene, spot));
        return marker ? { ...marker } : null;
    }

    scenes() {
        return Object.values(this.data.scenes);
    }

    scene(sceneId) {
        return this.data.scenes[sceneId] || null;
    }

    hasScene(sceneId) {
        return Boolean(this.scene(sceneId));
    }

    has(location) {
        return Boolean(
            location &&
            this.nodes.has(this.key(location.scene, location.spot))
        );
    }

    spot(sceneId, spotId) {
        const node = this.nodes.get(this.key(sceneId, spotId));
        return node ? { ...node } : null;
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
    const response = await fetch("./world/world-stage.json?v=042e12", {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`World Stage failed to load (${response.status}).`);
    }

    return new World(await response.json());
}
