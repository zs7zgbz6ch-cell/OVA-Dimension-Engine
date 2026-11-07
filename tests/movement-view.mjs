import assert from 'node:assert/strict';
import { legDuration, walkDuration, routeFrames, MOTION } from '../js/ui/movement-view.js';
import { ENTITY_MOVEMENT_SPRITES } from '../js/content/game.js';
const a={x:0,y:0,scale:30}, b={x:10,y:0,scale:40}, c={x:20,y:0,scale:50};
const legs=[{from:a,to:b},{from:b,to:c}];
assert.equal(walkDuration(legs), Math.max(MOTION.minWalkMs,20*MOTION.msPerPercent));
assert.equal(legDuration(a,b), 550);
const frames=routeFrames(legs,100);
assert.equal(frames.length,101);
assert.equal(frames[0].x,0);
assert.equal(frames.at(-1).x,20);
assert.ok(Math.abs(frames[50].x-10)<0.001);
assert.ok(frames[49].x<10 && frames[51].x>10);
assert.ok(frames[51].x-frames[50].x>0.2, 'waypoint must not stop');
assert.ok(ENTITY_MOVEMENT_SPRITES.rionne.front);
assert.ok(ENTITY_MOVEMENT_SPRITES.rionne.back);
console.log('PASS: continuous route pace, waypoint passage, directional assets');

// A waypoint corner is rounded without moving the authored endpoints.
const w={x:10,y:0,scale:40,type:'waypoint'}, end={x:10,y:10,scale:50};
const curved=routeFrames([{from:a,to:w},{from:w,to:end}],200);
assert.equal(curved[0].x,a.x);
assert.equal(curved.at(-1).y,end.y);
assert.ok(curved.some(f=>f.x<10 && f.x>8.5 && f.y>0 && f.y<1.5), 'sharp corner should be gently rounded');
const transfer={...w,type:'transfer'};
const unrounded=routeFrames([{from:a,to:transfer},{from:transfer,to:end}],200);
assert.ok(unrounded.some(f=>Math.abs(f.x-10)<0.001 && Math.abs(f.y)<0.001), 'transfer point must remain exact');
