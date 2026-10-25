function copyLocation(location) {
    return { scene: location.scene, spot: location.spot };
}

export class PlayerState {
    constructor({ world, start }) {
        this.world = world;
        if (!world.has(start.location)) throw new Error('Bad player start location.');
        this.state = {
            location: copyLocation(start.location),
            interaction: 'FREE'
        };
    }

    get location() { return copyLocation(this.state.location); }
    get interaction() { return this.state.interaction; }
    get sceneId() { return this.state.location.scene; }
    get isFree() { return this.state.interaction === 'FREE'; }

    setInteraction(interaction) {
        this.state.interaction = interaction || 'FREE';
    }

    moveTo(location) {
        if (!this.world.has(location)) throw new Error('Bad player destination.');
        this.state.location = copyLocation(location);
    }

    snapshot() {
        return { location: this.location, interaction: this.interaction };
    }

    restore(snapshot) {
        if (!snapshot || !this.world.has(snapshot.location)) throw new Error('Bad saved player location.');
        this.state = {
            location: copyLocation(snapshot.location),
            interaction: snapshot.interaction || 'FREE'
        };
    }
}
