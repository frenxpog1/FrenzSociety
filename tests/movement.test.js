import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceMovement, worldDistance} from '../src/movement.js';
import {WORLD} from '../src/spaces.js';
function fixture(route, target) {
  const p={id:'walker',alive:true,locationId:'test'};
  const m={x:50,y:50,locationId:'test',finalX:target.x,finalY:target.y,route:structuredClone(route)};
  return {s:{people:[p],motion:{walker:m},speed:1},targets:{walker:target},m};
}
test('equal pixel distances take the same time in both map axes',()=>{
  const east=fixture([],{x:50+100/WORLD.width*100,y:50});
  const south=fixture([],{x:50,y:50+100/WORLD.height*100});
  advanceMovement(east.s,east.targets,200);advanceMovement(south.s,south.targets,200);
  const start={x:50,y:50};
  assert.ok(Math.abs(worldDistance(east.m,start)-37)<.001);
  assert.ok(Math.abs(worldDistance(south.m,start)-37)<.001);
});
test('a long frame consumes waypoints without stopping at each corner',()=>{
  const target={x:52,y:52};
  const route=[{x:50.1,y:50},{x:50.1,y:50.1},target];
  const a=fixture(route,target),b=fixture(route,target);
  advanceMovement(a.s,a.targets,400);
  for(let i=0;i<20;i++)advanceMovement(b.s,b.targets,20);
  assert.ok(worldDistance(a.m,b.m)<.001);
});
test('arrival requires reaching the station and keeps the final facing',()=>{
  const target={x:50.3,y:50,pose:'typing',facing:'north'};
  const f=fixture([],target);
  assert.equal(advanceMovement(f.s,f.targets,1).has('walker'),false);
  assert.equal(advanceMovement(f.s,f.targets,100).has('walker'),true);
  assert.equal(f.m.stationFacing,'north');
  assert.equal(f.m.pose,'typing');
  assert.equal(f.m.x,target.x);
});
