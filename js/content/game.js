export const GAME_START = {
    // Temporary until HUB exists. Player presence is scene-level: the player
    // observes a Scene and is not staged on an entity navigation Spot.
    scene: 'BERKLITH_TAVERN',
    discoveredScenes: ['BERKLITH_TAVERN', 'RIONNES_ROOM']
};

// Player-facing content decorates scenes that physically exist in World Stage.
// It never creates geography and never stores runtime player state.
export const SCENE_CONTENT = {
    BERKLITH_TAVERN: {
        title: 'MAIN TAVERN',
        subtitle: 'BERKLITH TAVERN'
    },
    RIONNES_ROOM: {
        title: "RIONNE'S ROOM",
        subtitle: 'UPSTAIRS · PRIVATE QUARTERS'
    }
};

// Asset families are content configuration, not scene-renderer behavior.
// Additional characters can reuse a family without changing rendering code.
export const ENTITY_SPRITES = Object.freeze({
    rionne: './assets/sprites/rionne-front.png',
    barmaid: './assets/sprites/barmaid-serving.png'
});

// Directional artwork is content data, not renderer-specific character logic.
// Right-facing three-quarter views mirror the authored left variants.
export const ENTITY_MOVEMENT_SPRITES = Object.freeze({
    rionne: Object.freeze({
        front: './assets/sprites/rionne-front.png',
        back: './assets/sprites/rionne-back.png',
        left: './assets/sprites/rionne-front-three-quarter.png',
        'front-three-quarter-left': './assets/sprites/rionne-front-three-quarter.png',
        'back-three-quarter-left': './assets/sprites/rionne-back-three-quarter.png'
    }),
    barmaid: Object.freeze({ front: './assets/sprites/barmaid-serving.png' })
});
