export const GAME_START = {
    // Temporary production-shell start. When HUB is authored in World Stage,
    // only this configuration needs to change.
    location: { scene: 'BERKLITH_TAVERN', spot: 'SPOT_01' }
};

// Presentation metadata can decorate World scenes, but cannot create them.
export const SCENE_PRESENTATION = {
    BERKLITH_TAVERN: {
        title: 'MAIN TAVERN',
        subtitle: 'BERKLITH TAVERN'
    },
    RIONNES_ROOM: {
        title: "RIONNE'S ROOM",
        subtitle: 'UPSTAIRS · PRIVATE QUARTERS'
    }
};
