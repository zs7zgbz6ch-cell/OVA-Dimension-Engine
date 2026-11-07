import assert from 'node:assert/strict';
import { movementPose, planMovement, PRESENTATION_POLICY } from '../js/core/movement-plan.js';

// Authored scale is depth, not an incidental visual effect.
assert.equal(movementPose({x:95,y:90,scale:63}, {x:50,y:82,scale:45}), 'back-three-quarter-left');
assert.equal(movementPose({x:50,y:82,scale:45}, {x:30,y:73,scale:34}), 'back-three-quarter-left');
assert.equal(movementPose({x:30,y:73,scale:34}, {x:50,y:82,scale:45}), 'right');
assert.equal(movementPose({x:50,y:82,scale:45}, {x:50,y:65,scale:25}), 'back');
assert.equal(PRESENTATION_POLICY.maxAnimatedAdvanceMinutes, 60);

const spot = id => ({scene:'T',spot:id});
const world = { spot: (_scene, id) => ({id,type:'idle',x:10,y:50,scale:30}) };
const event = minute => ({entityId:'npc',minute,from:spot('A'),to:spot('B'),route:[spot('A'),spot('B')]});
const plan = (moves,startMinute,endMinute) => planMovement({moves,startMinute,endMinute,scene:'T',world});
assert.equal(plan([event(420)],419,420).length,1, 'live event should animate');
assert.equal(plan([event(420)],360,420).length,1, 'one-hour boundary event should animate');
assert.equal(plan([event(400)],360,420).length,0, 'earlier events should not replay');
assert.equal(plan([event(400),event(420),event(600),event(1080)],360,1080).length,0,
    '12-hour seek must show only final authoritative state');
assert.equal(plan([event(420),event(1080)],360,1080).length,0,
    'even an event exactly at the end of a long seek should not animate');
assert.equal(plan([event(1440),event(1500)],720,1500).length,0,
    'midnight-crossing seek must not replay old transitions');
assert.throws(()=>plan([event(421)],420,420), /after advance end/);
console.log('PASS: depth-aware pose, 1h events, 12h and midnight seeks');
