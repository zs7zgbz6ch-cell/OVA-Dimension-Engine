import { planMovement } from '../core/movement-plan.js';
import { ENTITY_MOVEMENT_SPRITES } from '../content/game.js';

// Stage-percent distances are presentation units, not simulated world distance.
export const MOTION = Object.freeze({ msPerPercent: 42, minWalkMs: 2200, fadeMs: 520, staggerMs: 170 });
export const routeDistance = legs => legs.reduce((sum, leg) => sum + Math.hypot(leg.to.x - leg.from.x, leg.to.y - leg.from.y), 0);
export const walkDuration = legs => legs.length ? Math.max(MOTION.minWalkMs, routeDistance(legs) * MOTION.msPerPercent) : 0;
// Preserve the previous public helper for tools/tests that inspect individual distances.
export const legDuration = (from, to) => Math.max(260, Math.hypot(to.x - from.x, to.y - from.y) * MOTION.msPerPercent);

const anchor = (spot, opacity = 1, mirror = false) => ({
    left: `${spot.x}%`, top: `${spot.y}%`, height: `${spot.scale}%`, opacity,
    transform: `translate(-50%, -100%)${mirror ? ' scaleX(-1)' : ''}`
});

function spriteFor(entity, pose) {
    const config = ENTITY_MOVEMENT_SPRITES[entity?.content?.assetFamily];
    if (!config) return null;
    const facing = pose === 'stationary' ? 'front' : pose;
    if (config[facing]) return { src: config[facing], mirror: false };
    if (facing === 'right' || facing.endsWith('-right')) {
        const left = facing === 'right' ? 'left' : facing.replace(/-right$/, '-left');
        if (config[left]) return { src: config[left], mirror: true };
    }
    return config.front ? { src: config.front, mirror: false } : null;
}

function wait(ms, signal) {
    return new Promise(resolve => {
        if (signal.aborted || ms <= 0) return resolve();
        const timer = setTimeout(done, ms);
        function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
        signal.addEventListener('abort', done, { once: true });
    });
}

// A single easing envelope spans the entire path. Intermediate waypoints do
// not have independent ease-in/out curves or artificial pauses.
export function routeFrames(legs, samples = 80) {
    if (!legs.length) return [];
    const lengths = legs.map(leg => Math.hypot(leg.to.x - leg.from.x, leg.to.y - leg.from.y));
    const total = lengths.reduce((a, b) => a + b, 0);
    const frames = [];
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const eased = t * t * (3 - 2 * t);
        let remaining = eased * total;
        let index = 0;
        while (index < legs.length - 1 && remaining > lengths[index]) remaining -= lengths[index++];
        const leg = legs[index];
        const f = lengths[index] ? Math.min(1, remaining / lengths[index]) : 1;
        frames.push({ offset: t, x: leg.from.x + (leg.to.x - leg.from.x) * f,
            y: leg.from.y + (leg.to.y - leg.from.y) * f,
            scale: leg.from.scale + (leg.to.scale - leg.from.scale) * f, legIndex: index });
    }
    return frames;
}

export function createMovementView({ world, entities, player }) {
    let current = null;

    function cancel() {
        if (!current) return;
        const state = current;
        current = null;
        state.abort.abort();
        for (const animation of state.animations) animation.cancel();
        for (const node of state.nodes) node.remove();
        for (const node of state.hidden) node.style.visibility = '';
        if (player.interaction === 'MOVEMENT') player.setInteraction('FREE');
    }

    async function animate(node, frames, duration, state) {
        if (state.abort.signal.aborted) return;
        if (!node.animate) {
            Object.assign(node.style, frames.at(-1));
            await wait(duration, state.abort.signal);
            return;
        }
        const animation = node.animate(frames, { duration, easing: 'linear', fill: 'forwards' });
        state.animations.add(animation);
        try { await animation.finished; } catch { /* Expected when cancelled. */ }
        state.animations.delete(animation);
        if (!state.abort.signal.aborted) Object.assign(node.style, frames.at(-1));
        animation.cancel();
    }

    async function preparePose(node, entity, pose, signal) {
        const sprite = spriteFor(entity, pose);
        if (!sprite || signal.aborted) return false;
        if (node.getAttribute('src') !== sprite.src) {
            // Decode before replacing the visible pose; cancellation stays harmless.
            const preload = new Image();
            preload.src = sprite.src;
            try { if (preload.decode) await preload.decode(); } catch { /* Fallback to normal loading. */ }
            if (signal.aborted) return false;
            node.src = sprite.src;
        }
        return sprite.mirror;
    }

    function makeOverlay(stage, entityId, entity, spot, state) {
        const sprite = spriteFor(entity, 'front');
        if (!sprite) return null;
        const node = document.createElement('img');
        node.className = 'scene-actor movement-actor';
        node.alt = '';
        node.setAttribute('aria-hidden', 'true');
        node.dataset.movementEntity = entityId;
        node.src = sprite.src;
        Object.assign(node.style, anchor(spot));
        stage.append(node);
        state.nodes.add(node);
        return node;
    }

    async function playPlan(plan, state, delay, stage) {
        await wait(delay, state.abort.signal);
        if (state.abort.signal.aborted) return;
        const entity = entities.get(plan.entityId);
        const signal = state.abort.signal;
        const first = plan.mode === 'settle' ? (plan.fadeOut || plan.fadeIn) :
            (plan.arrivals?.[0] || plan.legs?.[0]?.from || plan.departures?.[0]);
        if (!first) return;
        const node = makeOverlay(stage, plan.entityId, entity, first, state);
        if (!node) return;
        const runFade = async (spot, from, to) => {
            const mirror = await preparePose(node, entity, 'front', signal);
            if (signal.aborted) return;
            const a = anchor(spot, from, mirror), b = anchor(spot, to, mirror);
            Object.assign(node.style, a);
            await animate(node, [a, b], MOTION.fadeMs, state);
        };
        if (plan.mode === 'settle') {
            if (plan.fadeOut) await runFade(plan.fadeOut, 1, 0);
            if (!signal.aborted && plan.fadeIn) await runFade(plan.fadeIn, 0, 1);
        } else {
            const legs = plan.legs || [];
            if (plan.arrivals?.length) await runFade(plan.arrivals[0], 0, 1);
            if (!signal.aborted && legs.length) {
                const samples = routeFrames(legs);
                const duration = walkDuration(legs);
                // Pose changes at segment boundaries; position and scale use one
                // continuous timeline with a single start/end easing envelope.
                const distances = legs.map(l => Math.hypot(l.to.x-l.from.x,l.to.y-l.from.y));
                const total = distances.reduce((a,b)=>a+b,0);
                let covered = 0;
                for (let i = 0; i < legs.length; i++) {
                    if (signal.aborted) break;
                    const mirror = await preparePose(node, entity, legs[i].pose, signal);
                    if (signal.aborted) break;
                    const start = total ? covered / total : i / legs.length;
                    covered += distances[i];
                    const end = total ? covered / total : (i+1) / legs.length;
                    // Smoothstep inverse maps distance fractions onto global time.
                    const inverse = x => { let lo=0,hi=1; for(let k=0;k<20;k++){const m=(lo+hi)/2; if(m*m*(3-2*m)<x)lo=m;else hi=m;}return (lo+hi)/2; };
                    const t0 = inverse(start), t1 = inverse(end);
                    const frames = samples.filter(f => f.offset >= t0 && f.offset <= t1);
                    const segment = [ { offset: 0, ...anchor(legs[i].from, 1, mirror) },
                        ...frames.map(f => ({ offset: (f.offset-t0)/(t1-t0 || 1), ...anchor(f, 1, mirror) })),
                        { offset: 1, ...anchor(legs[i].to, 1, mirror) } ];
                    Object.assign(node.style, anchor(legs[i].from, 1, mirror));
                    await animate(node, segment, duration * (t1-t0), state);
                }
            }
            if (!signal.aborted && plan.departures?.length) await runFade(plan.departures.at(-1), 1, 0);
        }
        node.remove();
        state.nodes.delete(node);
    }

    function play(result, previous = new Map()) {
        cancel();
        if (!player.isFree || !result?.moves?.length) return;
        const plans = planMovement({ moves: result.moves, endMinute: result.now.epochMinute,
            scene: player.sceneId, world });
        if (!plans.length) return;
        const stage = document.querySelector('#scene .scene-actors');
        if (!stage) return;
        const state = { abort: new AbortController(), animations: new Set(), nodes: new Set(), hidden: new Set() };
        current = state;
        player.setInteraction('MOVEMENT');
        // Hide final-state sprites BEFORE any async work begins, otherwise the
        // authoritative refresh exposes arrivals before their fade-in.
        for (const plan of plans) {
            for (const node of stage.children) {
                if (node.dataset.entity === plan.entityId) {
                    node.style.visibility = 'hidden';
                    state.hidden.add(node);
                }
            }
        }
        const chains = new Map();
        const tasks = plans.map((plan, index) => {
            const previousTask = chains.get(plan.entityId) || Promise.resolve();
            const task = previousTask.then(() => playPlan(plan, state, Math.min(index * MOTION.staggerMs, 680), stage));
            chains.set(plan.entityId, task);
            return task;
        });
        Promise.allSettled(tasks).then(() => { if (current === state) cancel(); });
    }
    return { play, cancel };
}
