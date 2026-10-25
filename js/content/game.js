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
