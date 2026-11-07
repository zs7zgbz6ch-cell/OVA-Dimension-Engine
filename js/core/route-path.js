// Pure presentation geometry. World Stage Lab owns all spot coordinates.
// Waypoint corners may be rounded; transfer anchors are always exact.
export const MOTION = Object.freeze({
    msPerPercent: 55,
    minWalkMs: 2200,
    fadeMs: 520,
    staggerMs: 170,
    cornerRadius: 1.3,
    cornerSlowdown: 0.32
});

export function routeDistance(legs) {
    return legs.reduce((sum, leg) => sum + Math.hypot(
        leg.to.x - leg.from.x,
        leg.to.y - leg.from.y
    ), 0);
}

export function walkDuration(legs) {
    return legs.length ? Math.max(MOTION.minWalkMs, routeDistance(legs) * MOTION.msPerPercent) : 0;
}

function interpolate(from, to, fraction) {
    return {
        x: from.x + (to.x - from.x) * fraction,
        y: from.y + (to.y - from.y) * fraction,
        scale: from.scale + (to.scale - from.scale) * fraction
    };
}

function distance(from, to) {
    return Math.hypot(to.x - from.x, to.y - from.y);
}

function cornerRadius(previous, middle, next) {
    if (middle.type !== 'waypoint') return 0;
    const incoming = distance(previous, middle);
    const outgoing = distance(middle, next);
    if (incoming <= 0.1 || outgoing <= 0.1) return 0;

    const dot = ((middle.x - previous.x) * (next.x - middle.x) +
        (middle.y - previous.y) * (next.y - middle.y)) / (incoming * outgoing);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle <= 0.12) return 0;
    return Math.min(MOTION.cornerRadius, incoming * 0.2, outgoing * 0.2) *
        Math.min(1, angle / (Math.PI / 2));
}

function pathPieces(legs) {
    const nodes = [legs[0].from, ...legs.map(leg => leg.to)];
    const pieces = [];
    let cursor = nodes[0];

    for (let index = 1; index < nodes.length - 1; index++) {
        const previous = nodes[index - 1];
        const middle = nodes[index];
        const next = nodes[index + 1];
        const radius = cornerRadius(previous, middle, next);

        if (radius <= 0.01) {
            pieces.push({ from: cursor, to: middle, legIndex: index - 1 });
            cursor = middle;
            continue;
        }

        const entry = interpolate(middle, previous, radius / distance(previous, middle));
        const exit = interpolate(middle, next, radius / distance(middle, next));
        pieces.push({ from: cursor, to: entry, legIndex: index - 1 });
        pieces.push({ from: entry, to: exit, control: middle, corner: true, legIndex: index });
        cursor = exit;
    }

    pieces.push({ from: cursor, to: nodes.at(-1), legIndex: legs.length - 1 });
    return pieces;
}

function pointOnPiece(piece, fraction) {
    if (!piece.control) return interpolate(piece.from, piece.to, fraction);
    const entry = interpolate(piece.from, piece.control, fraction);
    const exit = interpolate(piece.control, piece.to, fraction);
    return interpolate(entry, exit, fraction);
}

function distanceLookup(pieces) {
    const path = [];
    let weightedDistance = 0;
    const samplesPerPiece = 20;

    for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
        const piece = pieces[pieceIndex];
        for (let sample = 0; sample <= samplesPerPiece; sample++) {
            if (pieceIndex > 0 && sample === 0) continue;
            const point = pointOnPiece(piece, sample / samplesPerPiece);
            if (path.length) {
                const step = distance(path.at(-1), point);
                weightedDistance += step * (piece.corner ? 1 / (1 - MOTION.cornerSlowdown) : 1);
            }
            path.push({ ...point, weightedDistance, legIndex: piece.legIndex });
        }
    }
    return { path, weightedDistance };
}

export function routeFrames(legs, samples = 100) {
    if (!legs.length) return [];
    const { path, weightedDistance } = distanceLookup(pathPieces(legs));
    const frames = [];
    let upperIndex = 1;

    for (let index = 0; index <= samples; index++) {
        const offset = index / samples;
        const eased = offset * offset * (3 - 2 * offset);
        const target = eased * weightedDistance;
        while (upperIndex < path.length - 1 && path[upperIndex].weightedDistance < target) {
            upperIndex++;
        }
        const lower = path[upperIndex - 1] || path[0];
        const upper = path[upperIndex];
        const span = upper.weightedDistance - lower.weightedDistance;
        const fraction = span > 0 ? (target - lower.weightedDistance) / span : 0;
        frames.push({ offset, ...interpolate(lower, upper, fraction), legIndex: upper.legIndex });
    }
    return frames;
}
