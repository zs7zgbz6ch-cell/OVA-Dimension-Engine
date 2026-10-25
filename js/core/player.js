function uniqueSceneIds(sceneIds = []) {
    return [...new Set(sceneIds.filter(Boolean))];
}

export class PlayerState {
    constructor({ world, start }) {
        this.world = world;
        if (!world.hasScene(start.scene)) throw new Error('Bad player start scene.');

        const discoveredScenes = uniqueSceneIds([
            ...(start.discoveredScenes || []),
            start.scene
        ]);
        for (const sceneId of discoveredScenes) {
            if (!world.hasScene(sceneId)) throw new Error(`Bad discovered scene: ${sceneId}`);
        }

        this.state = {
            scene: start.scene,
            interaction: 'FREE',
            discoveredScenes
        };
    }

    get sceneId() { return this.state.scene; }
    get interaction() { return this.state.interaction; }
    get isFree() { return this.state.interaction === 'FREE'; }
    get discoveredScenes() { return [...this.state.discoveredScenes]; }

    setInteraction(interaction) {
        this.state.interaction = interaction || 'FREE';
    }

    moveToScene(sceneId) {
        if (!this.world.hasScene(sceneId)) throw new Error(`Bad player destination scene: ${sceneId}`);
        this.state.scene = sceneId;
        this.discover(sceneId);
    }

    discover(sceneId) {
        if (!this.world.hasScene(sceneId)) throw new Error(`Cannot discover unknown scene: ${sceneId}`);
        if (!this.state.discoveredScenes.includes(sceneId)) this.state.discoveredScenes.push(sceneId);
    }

    knows(sceneId) {
        return this.state.discoveredScenes.includes(sceneId);
    }

    snapshot() {
        return {
            scene: this.sceneId,
            interaction: this.interaction,
            discoveredScenes: this.discoveredScenes
        };
    }

    restore(snapshot) {
        if (!snapshot || !this.world.hasScene(snapshot.scene)) throw new Error('Bad saved player scene.');
        const discoveredScenes = uniqueSceneIds([...(snapshot.discoveredScenes || []), snapshot.scene]);
        for (const sceneId of discoveredScenes) {
            if (!this.world.hasScene(sceneId)) throw new Error(`Bad saved discovered scene: ${sceneId}`);
        }
        this.state = {
            scene: snapshot.scene,
            interaction: snapshot.interaction || 'FREE',
            discoveredScenes
        };
    }
}
