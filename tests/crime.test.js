import test from 'node:test';
import assert from 'node:assert/strict';
import { startRobbery, advanceCrimes, nearbyVictim, respondingOfficer, crimeDirective, surrenderChance, skipCrimeScenes } from '../src/crime.js';
import { advanceMovement } from '../src/movement.js';
import { personTargets } from '../src/spaces.js';
import { buildings, jobs } from '../src/constants.js';
import { toPercent } from '../src/layout.js';
import { createPeople } from '../src/people.js';
import { createSnapshot, decodeSnapshot } from '../src/persistence.js';
import { shotPulse, drawCrimeEffects } from '../src/crime-art.js';

function fixture(cop=true) {
  const people=createPeople(15).slice(0,3);
  people.forEach((p,i)=>Object.assign(p,{alive:true,isChild:false,money:i===1?300:50,happiness:50,
    locationId:'town-square',status:i===2?'On Patrol':'Walking',job:null,mealOrder:undefined,jailHoursRemaining:0,isSerialKiller:false,robberyConfidence:0}));
  people[2].job={...jobs.find(j=>j.name==='Police Officer (Day)'),title:'Police Officer (Day)',starts:6,ends:18};
  const state={people,day:3,hour:12,running:true,speed:1,activitySeconds:0,motion:{},relationships:{},
    eventLog:[],recentEvents:[],conversations:[],townTreasury:100,casinoBankroll:5000,deaths:0,
    deathAge:82,populationSize:15,resumeDelay:0,pauseForEvents:false};
  [[660,426],[716,426],cop?[580,426]:[2100,1400]].forEach(([x,y],i)=>{
    state.motion[people[i].id]={...toPercent(x,y),locationId:'town-square',route:[],facing:'east',pose:'idle'};
  });
  return {state,r:people[0],v:people[1],o:people[2]};
}
function begin(f,rng=()=>.9) {
  assert.equal(startRobbery(f.state,f.r.id,f.v.id,buildings,rng),true);
  return f.state.crimeEncounters[0];
}
function reachThreat(f) {
  for(let i=0;i<150&&f.state.crimeEncounters[0]?.phase==='approach';i++) {
    advanceMovement(f.state,personTargets(f.state,buildings),16);
    advanceCrimes(f.state,.016,buildings,()=>.9);
  }
  assert.equal(f.state.crimeEncounters[0].phase,'threat');
}
function confront(f,rng) {
  for(let i=0;i<500&&f.state.crimeEncounters[0]?.phase!=='confront';i++) {
    advanceMovement(f.state,personTargets(f.state,buildings),16);
    advanceCrimes(f.state,.016,buildings,rng);
  }
  assert.equal(f.state.crimeEncounters[0]?.phase,'confront');
}
const encode = s => JSON.stringify(createSnapshot(s,buildings,jobs,new Date('2026-11-05T00:00:00Z')));

test('only nearby available outdoor adults can participate, once each',()=>{
  const f=fixture();
  assert.equal(nearbyVictim(f.state,f.r,f.v,buildings),true);
  assert.equal(nearbyVictim(f.state,f.r,{...f.v,isChild:true},buildings),false);
  assert.equal(nearbyVictim(f.state,f.r,{...f.v,jailHoursRemaining:4},buildings),false);
  const m=f.state.motion[f.v.id];
  f.state.motion[f.v.id]=toPercent(2000,1400);
  assert.equal(nearbyVictim(f.state,f.r,f.v,buildings),false);
  f.state.motion[f.v.id]={x:buildings[0].x,y:buildings[0].y};
  assert.equal(nearbyVictim(f.state,f.r,f.v,buildings),false);
  f.state.motion[f.v.id]=m;begin(f);
  assert.equal(startRobbery(f.state,f.r.id,f.v.id,buildings),false);
});
test('a nearby officer physically arrives before a nervous robber surrenders and goes to jail',()=>{
  const f=fixture(),c=begin(f,()=>.1),money=f.v.money;
  reachThreat(f);
  advanceCrimes(f.state,.7,buildings,()=>0);
  assert.equal(c.phase,'respond');assert.equal(c.officerId,f.o.id);
  assert.equal(f.r.jailHoursRemaining,0);assert.equal(f.v.money,money);
  assert.equal(crimeDirective(f.state,f.v).target.pose,'frightened');
  confront(f,()=>0);
  assert.equal(c.outcome,'surrendered');assert.equal(c.shotBy,null);assert.equal(shotPulse(c),false);
  assert.equal(crimeDirective(f.state,f.r).target.pose,'surrender');
  assert.equal(crimeDirective(f.state,f.r).weapon,null);
  assert.equal(f.r.jailHoursRemaining,0,'sentence follows the surrender animation');
  const events=advanceCrimes(f.state,1.1,buildings,()=>0);
  assert.equal(events.length,1);assert.match(events[0].message,/surrendered/);
  assert.equal(f.r.locationId,'jail-1');assert.equal(f.r.jailHoursRemaining,72);assert.equal(f.v.money,money);
  assert.equal(advanceCrimes(f.state,.2,buildings).length,0);
  advanceCrimes(f.state,3,buildings);
  assert.equal(f.state.crimeEncounters.length,0);assert.equal(crimeDirective(f.state,f.r),null);
  advanceMovement(f.state,personTargets(f.state,buildings),16);
  assert.equal(f.state.motion[f.r.id].mode,'walk');
  assert.equal(f.r.locationId,'jail-1');
});
test('confidence influences surrender odds and neither far nor off-duty police can arrest',()=>{
  assert.ok(surrenderChance({robberyConfidence:0})>surrenderChance({robberyConfidence:20}));
  assert.ok(surrenderChance({isSerialKiller:true})<surrenderChance({}));
  const f=fixture(false),c=begin(f);reachThreat(f);
  assert.equal(respondingOfficer(f.state,c,buildings),null);
  f.state.motion[f.o.id]=toPercent(670,426);f.state.hour=23;
  assert.equal(respondingOfficer(f.state,c,buildings),null);
  advanceCrimes(f.state,4,buildings,()=>.9);
  assert.equal(c.outcome,'escaped');assert.equal(c.officerId,null);
});
test('escape transfers only available money once, including after a saved aftermath',()=>{
  const f=fixture(false),c=begin(f);f.v.money=12;reachThreat(f);confront(f,()=>.9);
  const total=f.r.money+f.v.money;
  advanceCrimes(f.state,1.1,buildings,()=>.9);
  assert.equal(c.amount,12);assert.equal(f.v.money,0);assert.equal(f.r.money+f.v.money,total);
  const restored={...decodeSnapshot(encode(f.state)).state,running:true};
  advanceCrimes(restored,4,buildings,()=>0);
  assert.equal(restored.people.find(p=>p.id===f.r.id).money,f.r.money);
  assert.equal(restored.crimeEncounters.length,0);
});
test('pause and unfinished save round trips preserve the scene without applying its result',()=>{
  const f=fixture(),c=begin(f);reachThreat(f);confront(f,()=>0);
  f.state.running=false;
  const before=encode(f.state);
  assert.deepEqual(advanceCrimes(f.state,10,buildings),[]);assert.equal(encode(f.state),before);
  const restored={...decodeSnapshot(before).state,running:true};
  assert.equal(restored.crimeEncounters[0].outcome,'surrendered');
  advanceCrimes(restored,1.1,buildings,()=>0);
  assert.equal(restored.people.find(p=>p.id===f.r.id).jailHoursRemaining,72);
  assert.equal(c.phase,'confront');
  const old=JSON.parse(before);delete old.town.crimeEncounters;
  assert.deepEqual(decodeSnapshot(JSON.stringify(old)).state.crimeEncounters,[]);
});
test('a timed-out approach cancels without money loss or a permanent disguise',()=>{
  const f=fixture(),c=begin(f),before=f.r.status;advanceCrimes(f.state,26,buildings);
  assert.equal(f.state.crimeEncounters.length,0);assert.equal(f.r.money,50);assert.equal(f.v.money,300);
  assert.equal(crimeDirective(f.state,f.r),null);assert.equal(f.r.status,c.before[f.r.id].status);
  assert.notEqual(f.r.status,before);
});
test('flashes only accompany real pistol shots, with finite render geometry',()=>{
  const f=fixture(false),c=begin(f,()=>0);reachThreat(f);confront(f,()=>0);
  assert.equal(c.outcome,'victim-down');assert.equal(c.shotBy,f.r.id);assert.equal(shotPulse(c),true);
  const ctx=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:50}):(...args)=>{
    for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));
  }});
  assert.doesNotThrow(()=>drawCrimeEffects(ctx,f.state));
  c.elapsed=.2;assert.equal(shotPulse(c),false);
  advanceCrimes(f.state,1,buildings,()=>0);
  assert.equal(f.v.alive,false);assert.deepEqual(f.state.pendingCrimeDeaths,[f.v.id]);
  assert.doesNotThrow(()=>decodeSnapshot(encode(f.state)));
  const knife=fixture(false),k=begin(knife,()=>.9);reachThreat(knife);confront(knife,()=>0);
  assert.equal(k.weapon,'knife');assert.equal(k.shotBy,null);assert.equal(shotPulse(k),false);
});
test('malformed or overlapping encounter saves are rejected before loading',()=>{
  const f=fixture();begin(f);const file=JSON.parse(encode(f.state));
  const decode=()=>decodeSnapshot(JSON.stringify(file));
  file.town.crimeEncounters[0].victimId='missing';assert.throws(decode,/crime encounter/);
  file.town.crimeEncounters[0].victimId=f.v.id;
  file.town.crimeEncounters.push(structuredClone(file.town.crimeEncounters[0]));assert.throws(decode,/crime encounter/);
  file.town.crimeEncounters.pop();const c=file.town.crimeEncounters[0];
  c.phase='confront';c.outcome='surrendered';c.shotBy=f.r.id;c.shotTarget=f.v.id;
  assert.throws(decode,/crime encounter/);
});

test('explicit time skips dismiss an approach and settle a decided surrender exactly once',()=>{
  const f=fixture();begin(f);skipCrimeScenes(f.state);
  assert.equal(f.state.crimeEncounters.length,0);assert.equal(f.v.money,300);assert.equal(f.r.status,'Walking');
  begin(f);reachThreat(f);confront(f,()=>0);
  const events=skipCrimeScenes(f.state,()=>0);
  assert.equal(events.length,1);assert.equal(f.r.locationId,'jail-1');assert.equal(f.r.jailHoursRemaining,72);
  assert.equal(f.v.money,300);assert.equal(skipCrimeScenes(f.state).length,0);
});
