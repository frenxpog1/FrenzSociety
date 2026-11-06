import test from 'node:test';
import assert from 'node:assert/strict';
import {landscapePlots,plotBounds} from '../src/map-details.js';
import {buildings} from '../src/constants.js';
import {buildingBounds,intersects,streetDistance,toPercent} from '../src/layout.js';
import {entrancePaths} from '../src/navigation.js';
test('scenic plots are deterministic and clear buildings, roads and entrances',()=>{
 const entrances=entrancePaths(buildings),plots=landscapePlots(buildings,entrances);
 assert.ok(plots.length>=8);assert.deepEqual(landscapePlots(buildings,entrances),plots);
 for(const p of plots){
  assert.ok(streetDistance(p.x,p.y)>=115);
  for(const b of buildings)assert.equal(intersects(plotBounds(p),buildingBounds(b,24)),false);
  for(const {points} of entrances)for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
   const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
   assert.ok(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)>=75);
  }
 }
});
test('construction replaces overlapping scenery without modifying buildings or saved state',()=>{
 const original=structuredClone(buildings),p=landscapePlots(buildings,entrancePaths(buildings))[0];
 const expanded=[...buildings,{id:'new-home',type:'home',...toPercent(p.x,p.y)}];
 const after=landscapePlots(expanded,entrancePaths(expanded));
 assert.equal(after.some(other=>other.x===p.x&&other.y===p.y),false);
 assert.deepEqual(buildings,original);
});
