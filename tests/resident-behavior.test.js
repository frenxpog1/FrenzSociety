import test from 'node:test';
import assert from 'node:assert/strict';
import {isPatrolling,patrolBeam,patrolPoint,travelMode} from '../src/resident-behavior.js';
import {advanceMovement,worldDistance} from '../src/movement.js';
import {toPercent} from '../src/layout.js';
const cop={id:'night-cop',alive:true,status:'On Patrol',locationId:'town-square',job:{title:'Police Officer (Night)',starts:18,ends:6}};
test('only on-duty available police patrol and carry a beam at night',()=>{
 assert.equal(isPatrolling(cop,23),true);assert.equal(isPatrolling(cop,12),false);
 assert.equal(isPatrolling({...cop,jailHoursRemaining:1},23),false);
 assert.equal(patrolBeam(cop,{...toPercent(716,426),facing:'east'},{hour:12},[]),null);
 assert.equal(patrolBeam({...cop,status:'Sleeping'},{...toPercent(716,426),facing:'east'},{hour:23},[]),null);
});
test('patrol cones face the walking direction and terminate at walls',()=>{
 const m={...toPercent(716,426),facing:'east'};
 const beam=patrolBeam(cop,m,{hour:23,activitySeconds:0},[{id:'wall',type:'home',...toPercent(830,426)}]);
 assert.ok(beam.points.every(p=>p.x>=beam.origin.x));
 assert.ok(beam.points.every(p=>p.x<=762.001));
 assert.equal(patrolBeam(cop,{...toPercent(830,426),facing:'east'},{hour:23},[{type:'home',...toPercent(830,426)}]),null);
});
test('police physically cover a sidewalk circuit and return to normal travel off duty',()=>{
 const m={...toPercent(716,426),locationId:'town-square',route:[],patrolIndex:1};
 const state={people:[{...cop}],motion:{'night-cop':m},hour:23,speed:1};
 const targets={'night-cop':{...toPercent(1100,700),pose:'idle',facing:'south'}};
 const start={...m};
 for(let i=0;i<250;i++)advanceMovement(state,targets,20);
 assert.ok(worldDistance(start,m)>200);assert.equal(m.mode,'patrol');
 state.people[0].status='Sleeping';state.hour=8;
 advanceMovement(state,targets,20);
 assert.equal(m.mode,'walk');assert.equal(m.patrolIndex,undefined);
 assert.equal(travelMode({status:'Running errands'}),'run');
});
