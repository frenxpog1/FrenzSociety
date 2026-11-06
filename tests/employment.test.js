import test from 'node:test';
import assert from 'node:assert/strict';
import {findBuildablePosition} from '../src/layout.js';
import {recruitForOffices} from '../src/employment.js';
import {updatePerson} from '../src/simulation.js';
import {createPeople} from '../src/people.js';
import {buildings,jobs} from '../src/constants.js';
import {createSnapshot,decodeSnapshot} from '../src/persistence.js';

const office={id:'office-new',type:'office',name:'New office',jobs:2,...findBuildablePosition('office',buildings)};
const template={name:'Clerk 3',building:office.id,starts:9,ends:17,wage:16};
test('office openings recruit eligible unemployed adults without taking staff from other jobs',()=>{
  const people=createPeople(6);people.forEach(p=>p.job=null);
  people[1].isChild=true;people[2].jailHoursRemaining=4;people[3].job={building:'existing'};
  const state={people,crimeEncounters:[{robberId:people[4].id}]};
  const hired=recruitForOffices(state,[office],[template]);
  assert.deepEqual(hired.map(h=>h.person.id),[people[0].id,people[5].id]);
  assert.equal(people[3].job.building,'existing');
  assert.equal(recruitForOffices(state,[office],[template]).length,0);
});
test('newly hired clerks attend their workplace, earn wages and retain the job after saving',()=>{
  const people=createPeople(15);people[0].job=null;people[0].hunger=0;people[0].happiness=80;people[0].energy=80;people[0].isCareerCriminal=false;
  const state={people,day:1,hour:10,motion:{},relationships:{},eventLog:[],conversations:[],recentEvents:[],townTreasury:0,casinoBankroll:5000,
    deathAge:82,populationSize:15,speed:1,resumeDelay:0};
  recruitForOffices(state,[office],[template]);
  const before=people[0].money;
  const p=updatePerson(people[0],state,()=>{});state.people[0]=p;
  assert.equal(p.locationId,office.id);assert.equal(p.status,'Working');assert.ok(p.money>before);
  const restored=decodeSnapshot(JSON.stringify(createSnapshot(state,[...buildings,office],[...jobs,template])));
  assert.equal(restored.state.people[0].job.building,office.id);
});
