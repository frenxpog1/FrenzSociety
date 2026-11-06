import test from 'node:test';
import assert from 'node:assert/strict';
import {communityGoals} from '../src/goals.js';
const homes=[{id:'home',type:'home'}];
const person=id=>({id,alive:true,homeId:'home',hunger:20,happiness:80});
test('community goals derive from current living residents and real homes',()=>{
 const state={people:[person('a'),{...person('b'),homeId:'missing',hunger:80,happiness:30},{...person('dead'),alive:false}],relationships:{}};
 const goals=communityGoals(state,homes);
 assert.equal(goals[0].current,1);assert.equal(goals[0].target,2);assert.equal(goals[0].complete,false);
 assert.equal(goals[1].current,1);assert.equal(goals[2].current,1);
 assert.deepEqual(communityGoals(JSON.parse(JSON.stringify(state)),homes),goals);
});
test('friend goal excludes enemies, self relations and absent or dead residents',()=>{
 const state={people:[person('a'),person('b'),person('c'),{...person('d'),alive:false}],relationships:{'a|b':{friendship:40},'a|c':{friendship:80,enemy:true},'a|d':{friendship:90},'b|missing':{friendship:90},'a|a':{friendship:90}}};
 assert.equal(communityGoals(state,homes)[3].current,1);
});
test('empty towns do not complete resident goals and progress stays bounded',()=>{
 const goals=communityGoals({people:[],relationships:{}},homes);
 assert.ok(goals.every(g=>!g.complete&&Number.isFinite(g.progress)));
 const people=Array.from({length:4},(_,i)=>person(String(i)));
 const relationships={'0|1':{friendship:90},'0|2':{friendship:90},'0|3':{friendship:90},'1|2':{friendship:90}};
 assert.equal(communityGoals({people,relationships},homes)[3].progress,1);
});
