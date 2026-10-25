export class TravelSystem {
    constructor({ world, player }) {
        this.world = world;
        this.player = player;
    }

    canTravelTo(sceneId) {
        return this.world.hasScene(sceneId) && this.player.knows(sceneId);
    }

    travelTo(sceneId) {
        if (!this.canTravelTo(sceneId)) {
            throw new Error(`Player cannot travel to scene: ${sceneId}`);
        }
        const fromScene = this.player.sceneId;
        this.player.moveToScene(sceneId);
        return { fromScene, toScene: sceneId, changed: fromScene !== sceneId };
    }
}
