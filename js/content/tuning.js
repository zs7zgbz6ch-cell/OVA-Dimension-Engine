// Shared, presentation-only timing and geometry defaults.
// Authored scene positions and connection types remain owned by World Stage Lab.
export const MOTION = Object.freeze({
    msPerPercent: 55,
    minWalkMs: 2200,
    fadeMs: 520,
    staggerMs: 170,
    maxStaggerMs: 680,
    cornerRadius: 1.3,
    cornerSlowdown: 0.32
});

export const TRANSFER_TIMING = Object.freeze({
    arrivalPauseMs: 500,
    turnPauseMs: 500,
    fadeMs: 420,
    markerWalkMs: 2400
});


// Presentation and interaction defaults. No character-specific behavior.
export const INTERACTION_TUNING = Object.freeze({
    timeCostMinutes: 5,
    textCharactersPerSecond: 35,
    checkEnterMs: 180,
    checkHoldMs: 2000,
    checkExitMs: 600,
    boopMs: 220,
    cardOpenMs: 320,
    alphaThreshold: 24,
    menuWidthPx: 148,
    menuMarginPx: 12,
    menuGapPx: 8,
    menuBottomReservePx: 148,
    speechHeadClearancePx: 36,
    speechFallbackWidthPx: 340,
    speechFallbackHeightPx: 85,
    speechAnchorY: 0.14,
    speechHorizontalOffset: 0.20,
    speechMarginPx: 12,
    speechBottomMarginPx: 20,
    speechPointerInsetPx: 8,
    speechPointerMinPx: 20,
    speechPointerMaxInsetPx: 28
});
