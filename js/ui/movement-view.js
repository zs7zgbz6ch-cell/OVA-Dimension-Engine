import { planMovement } from '../core/movement-plan.js';
import { ENTITY_MOVEMENT_SPRITES } from '../content/game.js';

const WALK_MS_PER_PERCENT = 38;
const MIN_LEG_MS = 260;
const MAX_LEG_MS = 1700;
const FADE_MS = 420;
const TRANSFER_PAUSE_MS = 220;
const STAGGER_MS = 170;

export function legDuration(from, to) {
    return Math.max(MIN_LEG_MS, Math.min(MAX_LEG_MS,
        Math.hypot(to.x - from.x, to.y - from.y) * WALK_MS_PER_PERCENT));
}

const anchor = (spot, opacity = 1, mirror = false) => ({
    left: `${spot.x}%`, top: `${spot.y}%`, height: `${spot.scale}%`, opacity,
    transform: `translate(-50%, -100%)${mirror ? ' scaleX(-1)' : ''}`
});

function spriteFor(entity, pose) {
    const family = entity?.content?.assetFamily;
    const config = ENTITY_MOVEMENT_SPRITES[family];
    if (!config) return null;
    const facing = pose === 'stationary' ? 'front' : pose;
    if (config[facing]) return { src: config[facing], mirror: false };
    if (facing === 'right' || facing.endsWith('-right')) {
        const left = facing === 'right' ? 'left' : facing.replace(/-right$/, '-left');
        if (config[left]) return { src: config[left], mirror: true };
    }
    return { src: config.front, mirror: false };
}

function wait(ms, signal) {
    return new Promise(resolve => {
        if (signal.aborted) return resolve();
        const timer = setTimeout(done, ms);
        function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
        signal.addEventListener('abort', done, { once: true });
    });
}

// Animation is presentation only. No writes to entity location or world time.
export function createMovementView({ world, entities, player }) {
    let current = null;

    function cancel() {
        if (!current) return;
        current.abort.abort();
        for (const animation of current.animations) animation.cancel();
        for (const node of current.nodes) node.remove();
        for (const node of current.hidden) node.style.visibility = '';
        if (player.interaction === 'MOVEMENT') player.setInteraction('FREE');
        current = null;
    }

    async function animate(node, from, to, duration, state) {
        if (state.abort.signal.aborted) return;
        if (!node.animate) { Object.assign(node.style, to); await wait(duration, state.abort.signal); return; }
        const animation = node.animate([from, to], { duration, easing: 'ease-in-out', fill: 'forwards' });
        state.animations.add(animation);
        try { await animation.finished; } catch { /* Cancellation is expected. */ }
        state.animations.delete(animation);
        if (!state.abort.signal.aborted) Object.assign(node.style, to);
        animation.cancel();
    }

    async function playPlan(plan, state, delay) {
        await wait(delay, state.abort.signal);
        if (state.abort.signal.aborted) return;
        const stage = document.querySelector('#scene .scene-actors');
        if (!stage) return;
        const entity = entities.get(plan.entityId);
        const base = [...stage.children].find(node => node.dataset.entity === plan.entityId);
        if (base && !state.hidden.has(base)) { base.style.visibility = 'hidden'; state.hidden.add(base); }
        const sprite = spriteFor(entity, plan.legs?.[0]?.pose);
        if (!sprite?.src) return;
        const node = document.createElement('img');
        node.className = 'scene-actor movement-actor';
        node.alt = '';
        node.setAttribute('aria-hidden', 'true');
        state.nodes.add(node);
        stage.append(node);
        const signal = state.abort.signal;
        const setPose = pose => {
            const next = spriteFor(entity, pose);
            if (!next) return false;
            if (node.getAttribute('src') !== next.src) node.src = next.src;
            return next.mirror;
        };
        const run = (from, to, ms, startOpacity = 1, endOpacity = 1, mirror = false) => {
            const start = anchor(from, startOpacity, mirror);
            Object.assign(node.style, start);
            return animate(node, start, anchor(to, endOpacity, mirror), ms, state);
        };

        if (plan.mode === 'settle') {
            if (plan.fadeOut) {
                const mirror = setPose('front');
                await run(plan.fadeOut, plan.fadeOut, FADE_MS, 1, 0, mirror);
            }
            if (signal.aborted) return;
            if (plan.fadeIn) {
                const mirror = setPose('front');
                await run(plan.fadeIn, plan.fadeIn, FADE_MS, 0, 1, mirror);
            }
        } else {
            const legs = plan.legs || [];
            if (plan.arrivals?.length && legs.length) {
                const mirror = setPose(legs[0].pose);
                await run(legs[0].from, legs[0].from, FADE_MS, 0, 1, mirror);
            } else if (plan.arrivals?.length && !legs.length) {
                const arrival = plan.arrivals[0];
                const mirror = setPose('front');
                await run(arrival, arrival, FADE_MS, 0, 1, mirror);
            }
            for (const leg of legs) {
                if (signal.aborted) return;
                const mirror = setPose(leg.pose);
                await run(leg.from, leg.to, legDuration(leg.from, leg.to), 1, 1, mirror);
            }
            if (signal.aborted) return;
            if (plan.departures?.length) {
                await wait(TRANSFER_PAUSE_MS, signal);
                if (signal.aborted) return;
                const departure = plan.departures.at(-1);
                const mirror = setPose(legs.at(-1)?.pose || 'back');
                await run(departure, departure, FADE_MS, 1, 0, mirror);
            }
        }
        node.remove();
        state.nodes.delete(node);
    }

    function play(result) {
        cancel();
        if (!player.isFree || !result?.moves?.length) return;
        const plans = planMovement({ moves: result.moves, endMinute: result.now.epochMinute,
            scene: player.sceneId, world });
        if (!plans.length) return;
        const state = { abort: new AbortController(), animations: new Set(), nodes: new Set(), hidden: new Set() };
        current = state;
        player.setInteraction('MOVEMENT');
        // Concurrent characters, modestly staggered. Movements for the same
        // character are serialized so one entity never gets duplicate overlays.
        const chains = new Map();
        const tasks = plans.map((plan, index) => {
            const previous = chains.get(plan.entityId) || Promise.resolve();
            const task = previous.then(() => playPlan(plan, state, Math.min(index * STAGGER_MS, 680)));
            chains.set(plan.entityId, task);
            return task;
        });
        Promise.allSettled(tasks).then(() => {
            if (current === state) cancel();
        });
    }
    return { play, cancel };
}
