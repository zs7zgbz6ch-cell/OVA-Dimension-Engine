import { planMovement } from '../core/movement-plan.js';
import { ENTITY_MOVEMENT_SPRITES } from '../content/game.js';

// Presentation-only timing. Lab coordinates and world routes remain authoritative.
export const MOTION = Object.freeze({ msPerPercent: 55, minWalkMs: 2200, fadeMs: 520,
    staggerMs: 170, cornerRadius: 1.3, cornerSlowdown: 0.32 });
export const routeDistance = legs => legs.reduce((sum, leg) => sum + Math.hypot(leg.to.x - leg.from.x, leg.to.y - leg.from.y), 0);
export const walkDuration = legs => legs.length ? Math.max(MOTION.minWalkMs, routeDistance(legs) * MOTION.msPerPercent) : 0;
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

// A gently rounded route: small quadratic corners remain close to authored spots.
// Transfer nodes are never rounded; they will receive deliberate choreography in 0.4.2d.
export function routeFrames(legs, samples = 100) {
    if (!legs.length) return [];
    const nodes = [legs[0].from, ...legs.map(leg => leg.to)];
    const pieces = [];
    let cursor = nodes[0];
    const point = (a,b,f) => ({ x:a.x+(b.x-a.x)*f, y:a.y+(b.y-a.y)*f,
        scale:a.scale+(b.scale-a.scale)*f });
    for (let i=1; i<nodes.length-1; i++) {
        const prev=nodes[i-1], mid=nodes[i], next=nodes[i+1];
        const lenIn=Math.hypot(mid.x-prev.x,mid.y-prev.y);
        const lenOut=Math.hypot(next.x-mid.x,next.y-mid.y);
        const u=lenIn ? [(mid.x-prev.x)/lenIn,(mid.y-prev.y)/lenIn] : [0,0];
        const v=lenOut ? [(next.x-mid.x)/lenOut,(next.y-mid.y)/lenOut] : [0,0];
        const angle=Math.acos(Math.max(-1,Math.min(1,u[0]*v[0]+u[1]*v[1])));
        const canRound=legs[i-1].to.type==='waypoint' && angle>0.12 && lenIn>0.1 && lenOut>0.1;
        const radius=canRound ? Math.min(MOTION.cornerRadius,lenIn*0.2,lenOut*0.2)*Math.min(1,angle/(Math.PI/2)) : 0;
        if (radius>0.01) {
            const start=point(mid,prev,radius/lenIn), end=point(mid,next,radius/lenOut);
            pieces.push({a:cursor,b:start,corner:false,legIndex:i-1});
            pieces.push({a:start,b:end,control:mid,corner:true,legIndex:i});
            cursor=end;
        } else { pieces.push({a:cursor,b:mid,corner:false,legIndex:i-1}); cursor=mid; }
    }
    pieces.push({a:cursor,b:nodes.at(-1),corner:false,legIndex:legs.length-1});
    const curve=(p,t) => p.control ? point(point(p.a,p.control,t),point(p.control,p.b,t),t) : point(p.a,p.b,t);
    // Build a distance-based lookup, with lower effective speed near sharp corners.
    const samplesPerPiece=20;
    const path=[];
    let weighted=0;
    for (let j=0;j<pieces.length;j++) {
        const piece=pieces[j];
        for (let k=0;k<=samplesPerPiece;k++) {
            if (j && k===0) continue;
            const at=curve(piece,k/samplesPerPiece);
            if (path.length) {
                const prev=path.at(-1);
                const distance=Math.hypot(at.x-prev.x,at.y-prev.y);
                weighted+=distance*(piece.corner ? 1/(1-MOTION.cornerSlowdown) : 1);
            }
            path.push({...at,weighted,legIndex:piece.legIndex});
        }
    }
    const frames=[];
    for(let i=0;i<=samples;i++) {
        const t=i/samples;
        const eased=t*t*(3-2*t);
        const target=eased*weighted;
        let hi=1;
        while(hi<path.length-1 && path[hi].weighted<target) hi++;
        const left=path[hi-1]||path[0],right=path[hi];
        const fraction=right.weighted>left.weighted ? (target-left.weighted)/(right.weighted-left.weighted) : 0;
        frames.push({offset:t,...point(left,right,fraction),legIndex:right.legIndex});
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
        if (node && (plan.arrivals?.length || (plan.mode === 'settle' && !plan.fadeOut))) node.style.opacity = '0';
        if (!node) return;
        // A plan owns only its own final-state sprite, never other NPCs.
        // Hide it only after the overlay exists, and restore as soon as this
        // character finishes (not when the entire movement batch finishes).
        const originals = Array.from(stage.children).filter(child => child !== node && child.dataset.entity === plan.entityId);
        for (const original of originals) {
            original.style.visibility = 'hidden';
            state.hidden.add(original);
        }
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
                // One animation owns the entire curved route. Pose changes are
                // scheduled independently and never restart positional easing.
                const firstMirror = await preparePose(node, entity, legs[0].pose, signal);
                if (signal.aborted) return;
                const movementFrames = samples.map(frame => { const {transform, ...rest} = anchor(frame, 1, firstMirror); return rest; });
                node.style.transform = anchor(legs[0].from,1,firstMirror).transform;
                const transitions = [];
                for (let i=1;i<samples.length;i++) {
                    if (samples[i].legIndex !== samples[i-1].legIndex)
                        transitions.push({ at:samples[i].offset, pose:legs[samples[i].legIndex].pose });
                }
                const poseTask = (async () => {
                    let previous=0;
                    for (const transition of transitions) {
                        await wait((transition.at-previous)*duration,signal);
                        if (signal.aborted) return;
                        const mirror=await preparePose(node,entity,transition.pose,signal);
                        if (!signal.aborted) node.style.transform=anchor(samples.find(f=>f.offset>=transition.at),1,mirror).transform;
                        previous=transition.at;
                    }
                })();
                await animate(node,movementFrames,duration,state);
                await poseTask;
            }
            if (!signal.aborted && plan.departures?.length) await runFade(plan.departures.at(-1), 1, 0);
        }
        node.remove();
        state.nodes.delete(node);
        for (const original of originals) {
            original.style.visibility = '';
            state.hidden.delete(original);
        }
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
        // Skipped agenda events settle before witnessed walks. Otherwise a
        // delayed settle can make an unrelated NPC vanish during a long walk.
        const ordered = [...plans].sort((a,b) => (a.mode === 'settle' ? 0 : 1) - (b.mode === 'settle' ? 0 : 1));
        const chains = new Map();
        const settleTasks = [];
        const tasks = ordered.map((plan, index) => {
            const previousTask = chains.get(plan.entityId) || Promise.resolve();
            const priorSettles = plan.mode === 'walk' ? Promise.allSettled(settleTasks) : Promise.resolve();
            const task = Promise.all([previousTask, priorSettles]).then(() => playPlan(plan, state,
                plan.mode === 'settle' ? 0 : Math.min(index * MOTION.staggerMs, 680), stage));
            if (plan.mode === 'settle') settleTasks.push(task);
            chains.set(plan.entityId, task);
            return task;
        });
        Promise.allSettled(tasks).then(() => { if (current === state) cancel(); });
    }
    return { play, cancel };
}
