import { TRANSFER_TIMING } from '../core/transfer-plan.js';
import { movementPose, planMovement } from '../core/movement-plan.js';
import { MOTION, routeFrames, walkDuration } from '../core/route-path.js';
import { ENTITY_MOVEMENT_SPRITES } from '../content/game.js';

function spriteFor(entity, pose) {
    const sprites = ENTITY_MOVEMENT_SPRITES[entity?.content?.assetFamily];
    if (!sprites) return null;
    const facing = pose === 'stationary' ? 'front' : pose;
    if (sprites[facing]) return { src: sprites[facing], mirror: false };
    if (facing === 'right' || facing.endsWith('-right')) {
        const left = facing === 'right' ? 'left' : facing.replace(/-right$/, '-left');
        if (sprites[left]) return { src: sprites[left], mirror: true };
    }
    return sprites.front ? { src: sprites.front, mirror: false } : null;
}

function facingTransform(mirror) {
    return `translate(-50%, -100%)${mirror ? ' scaleX(-1)' : ''}`;
}

function anchor(spot, opacity = 1, mirror = false) {
    return {
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        height: `${spot.scale}%`,
        opacity,
        transform: facingTransform(mirror)
    };
}

function wait(ms, signal) {
    return new Promise(resolve => {
        if (signal.aborted || ms <= 0) return resolve();
        const timer = setTimeout(finish, ms);
        function finish() {
            clearTimeout(timer);
            signal.removeEventListener('abort', finish);
            resolve();
        }
        signal.addEventListener('abort', finish, { once: true });
    });
}

async function preparePose(node, entity, pose, signal) {
    const sprite = spriteFor(entity, pose);
    if (!sprite || signal.aborted) return null;
    if (node.getAttribute('src') !== sprite.src) {
        const image = new Image();
        image.src = sprite.src;
        try {
            if (image.decode) await image.decode();
        } catch {
            // A failed decode still permits the browser's ordinary image loading.
        }
        if (signal.aborted) return null;
        node.src = sprite.src;
    }
    return { mirror: sprite.mirror };
}

function createOverlay(stage, entityId, entity, start, state, opacity = 1) {
    const sprite = spriteFor(entity, 'front');
    if (!sprite) return null;
    const node = document.createElement('img');
    node.className = 'scene-actor movement-actor';
    node.alt = '';
    node.setAttribute('aria-hidden', 'true');
    node.dataset.movementEntity = entityId;
    node.src = sprite.src;
    Object.assign(node.style, anchor(start, opacity));
    stage.append(node);
    state.nodes.add(node);
    return node;
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
    try {
        await animation.finished;
    } catch (error) {
        if (!state.abort.signal.aborted) throw error;
    } finally {
        state.animations.delete(animation);
        if (!state.abort.signal.aborted) Object.assign(node.style, frames.at(-1));
        animation.cancel();
    }
}

async function fadeAt(node, entity, spot, from, to, state, facing = 'front') {
    const pose = await preparePose(node, entity, facing, state.abort.signal);
    if (!pose) return;
    const initial = anchor(spot, from, pose.mirror);
    Object.assign(node.style, initial);
    await animate(node, [initial, anchor(spot, to, pose.mirror)], MOTION.fadeMs, state);
}

async function playSettle(node, entity, plan, state) {
    if (plan.fadeOut) await fadeAt(node, entity, plan.fadeOut, 1, 0, state);
    if (!state.abort.signal.aborted && plan.fadeIn) {
        await fadeAt(node, entity, plan.fadeIn, 0, 1, state);
    }
}

function poseChanges(samples, legs) {
    const changes = [];
    for (let index = 1; index < samples.length; index++) {
        if (samples[index].legIndex !== samples[index - 1].legIndex) {
            changes.push({ offset: samples[index].offset, pose: legs[samples[index].legIndex].pose });
        }
    }
    return changes;
}

async function schedulePoses(node, entity, samples, legs, duration, state) {
    let previousOffset = 0;
    for (const change of poseChanges(samples, legs)) {
        await wait((change.offset - previousOffset) * duration, state.abort.signal);
        if (state.abort.signal.aborted) return;
        const pose = await preparePose(node, entity, change.pose, state.abort.signal);
        if (!pose) return;
        node.style.transform = facingTransform(pose.mirror);
        previousOffset = change.offset;
    }
}

async function playLegs(node, entity, legs, state) {
    const signal = state.abort.signal;
    if (!legs.length || signal.aborted) return;
    const pose = await preparePose(node, entity, legs[0].pose, signal);
    if (!pose) return;
    const samples = routeFrames(legs);
    const duration = walkDuration(legs);
    node.style.transform = facingTransform(pose.mirror);
    const frames = samples.map(sample => {
        const position = anchor(sample, 1, pose.mirror);
        return {
            offset: sample.offset,
            left: position.left,
            top: position.top,
            height: position.height,
            opacity: 1
        };
    });
    const poseTask = schedulePoses(node, entity, samples, legs, duration, state);
    await animate(node, frames, duration, state);
    await poseTask;
}

async function playTurn(node, entity, action, state, facing) {
    const poseName = movementPose(action.from, action.to);
    if (poseName === 'stationary' || poseName === facing.pose) return facing;
    const pose = await preparePose(node, entity, poseName, state.abort.signal);
    if (!pose) return facing;
    node.style.transform = facingTransform(pose.mirror);
    await wait(TRANSFER_TIMING.turnPauseMs, state.abort.signal);
    return { pose: poseName };
}

async function playMarker(node, entity, action, state) {
    const poseName = movementPose(action.from, action.to);
    const pose = await preparePose(node, entity, poseName, state.abort.signal);
    if (!pose) return;
    const from = anchor(action.from, action.entering ? 0 : 1, pose.mirror);
    const to = anchor(action.to, action.entering ? 1 : 0, pose.mirror);
    Object.assign(node.style, from);
    await animate(node, [from, to], TRANSFER_TIMING.markerWalkMs, state);
}

async function playActions(node, entity, plan, state) {
    let facing = { pose: 'front' };
    for (const action of plan.actions) {
        if (state.abort.signal.aborted) return;
        switch (action.kind) {
            case 'walk':
                await playLegs(node, entity, action.legs, state);
                facing = { pose: action.legs.at(-1).pose };
                break;
            case 'pause':
                await wait(action.ms, state.abort.signal);
                break;
            case 'turn':
                facing = await playTurn(node, entity, action, state, facing);
                break;
            case 'fade-out':
                await fadeAt(node, entity, action.at, 1, 0, state, facing.pose);
                break;
            case 'fade-in':
                await fadeAt(node, entity, action.at, 0, 1, state, facing.pose);
                break;
            case 'marker':
                await playMarker(node, entity, action, state);
                facing = { pose: movementPose(action.from, action.to) };
                break;
            default:
                throw new Error(`Unknown movement action: ${action.kind}`);
        }
    }
}

async function playWalk(node, entity, plan, state) {
    if (plan.actions) {
        await playActions(node, entity, plan, state);
        return;
    }
    // Compatibility with older movement plans used by independent callers.
    for (const arrival of plan.arrivals || []) {
        await fadeAt(node, entity, arrival, 0, 1, state);
    }
    await playLegs(node, entity, plan.legs || [], state);
    for (const departure of plan.departures || []) {
        await fadeAt(node, entity, departure, 1, 0, state);
    }
}

function planStart(plan) {
    if (plan.mode === 'settle') return plan.fadeOut || plan.fadeIn;
    if (plan.actions?.length) {
        const first = plan.actions[0];
        return first.at || first.from || first.legs?.[0]?.from ||
            plan.legs?.[0]?.from;
    }
    return plan.arrivals?.[0] || plan.legs?.[0]?.from || plan.departures?.[0];
}

export function createMovementView({ world, entities, player }) {
    let current = null;

    function restore(state) {
        for (const [node, visibility] of state.hidden) node.style.visibility = visibility;
        state.hidden.clear();
    }

    function cancel() {
        if (!current) return;
        const state = current;
        current = null;
        state.abort.abort();
        for (const animation of state.animations) animation.cancel();
        for (const node of state.nodes) node.remove();
        restore(state);
        if (player.interaction === 'MOVEMENT') player.setInteraction('FREE');
    }

    function hidePlannedOriginals(stage, plans, state) {
        const participating = new Set(plans.map(plan => plan.entityId));
        // Synchronous: no frame may paint an authoritative final-position
        // sprite before its corresponding presentation starts.
        for (const node of stage.children) {
            if (!participating.has(node.dataset.entity)) continue;
            state.hidden.set(node, node.style.visibility);
            node.style.visibility = 'hidden';
        }
    }

    function restoreEntity(state, entityId) {
        for (const [node, visibility] of state.hidden) {
            if (node.dataset.entity !== entityId) continue;
            node.style.visibility = visibility;
            state.hidden.delete(node);
        }
    }

    async function playPlan(plan, state, stage, preparedNode = null) {
        const start = planStart(plan);
        if (!start || state.abort.signal.aborted) return;
        const entity = entities.get(plan.entityId);
        const node = preparedNode || createOverlay(stage, plan.entityId, entity, start, state);
        if (!node) return;

        try {
            if (plan.mode === 'settle') {
                await playSettle(node, entity, plan, state);
            } else {
                await playWalk(node, entity, plan, state);
            }
        } finally {
            node.remove();
            state.nodes.delete(node);
        }
    }

    function play(result) {
        cancel();
        if (!player.isFree || !result?.moves?.length) return;
        const plans = planMovement({
            moves: result.moves,
            endMinute: result.now.epochMinute,
            startMinute: result.old.epochMinute,
            scene: player.sceneId,
            world
        });
        if (!plans.length) return;
        const stage = document.querySelector('#scene .scene-actors');
        if (!stage) return;

        const state = {
            abort: new AbortController(),
            animations: new Set(),
            nodes: new Set(),
            hidden: new Map()
        };
        current = state;
        player.setInteraction('MOVEMENT');
        hidePlannedOriginals(stage, plans, state);

        // A walking character must remain visible at the *starting* spot while
        // other characters settle. The authoritative destination is hidden above,
        // and the replacement is mounted synchronously, before any async wait.
        // Arrival fades begin transparent; otherwise the initial pose is visible.
        const preparedWalks = new Map();
        const settlingEntities = new Set(
            plans.filter(plan => plan.mode === 'settle').map(plan => plan.entityId)
        );
        for (const plan of plans) {
            if (plan.mode !== 'walk') continue;
            const start = planStart(plan);
            if (!start) continue;
            const entity = entities.get(plan.entityId);
            const entering = plan.actions?.[0]?.kind === 'fade-in' ||
                (plan.actions?.[0]?.kind === 'marker' && plan.actions[0].entering);
            const opacity = entering || settlingEntities.has(plan.entityId) ? 0 : 1;
            const node = createOverlay(stage, plan.entityId, entity, start, state, opacity);
            if (node) preparedWalks.set(plan, node);
        }

        // Settle missed events before witnessed walks. Per-entity chains retain
        // ownership of the final-position sprite until the last plan finishes.
        const ordered = [...plans].sort((left, right) =>
            Number(left.mode === 'walk') - Number(right.mode === 'walk'));
        const chains = new Map();
        const settleTasks = [];
        let walkIndex = 0;
        const tasks = ordered.map(plan => {
            const previous = chains.get(plan.entityId) || Promise.resolve();
            const priorSettles = plan.mode === 'walk'
                ? Promise.allSettled(settleTasks)
                : Promise.resolve();
            const delay = plan.mode === 'walk'
                ? Math.min(walkIndex++ * MOTION.staggerMs, 680)
                : 0;
            const task = Promise.all([previous, priorSettles]).then(async () => {
                await wait(delay, state.abort.signal);
                if (!state.abort.signal.aborted) {
                    const preparedNode = preparedWalks.get(plan) || null;
                    if (preparedNode && settlingEntities.has(plan.entityId) && !plan.arrivals?.length && plan.actions?.[0]?.kind !== 'fade-in') {
                        preparedNode.style.opacity = 1;
                    }
                    await playPlan(plan, state, stage, preparedNode);
                }
            });
            if (plan.mode === 'settle') settleTasks.push(task);
            chains.set(plan.entityId, task);
            return task;
        });

        // Restore each actor only after its final plan, not after an intermediate
        // fade. Other characters remain independently hidden or visible.
        for (const [entityId, task] of chains) {
            task.finally(() => {
                if (current === state) restoreEntity(state, entityId);
            }).catch(() => {});
        }
        Promise.allSettled(tasks).then(results => {
            for (const result of results) {
                if (result.status === 'rejected' && !state.abort.signal.aborted) {
                    console.error('Movement presentation failed:', result.reason);
                }
            }
            if (current === state) cancel();
        });
    }

    return { play, cancel };
}
