// Headless controller regression harness; browser QA separately validates the real DOM/canvas.
import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/state.js";
import { buildings } from "../src/constants.js";
import { drawWorld } from '../src/world.js';
class Element {
  constructor() {
    this.hidden = true;
    this.value = "";
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.children = [];
    this.classList = { toggle() {}, remove() {} };
    this.textContent = "";
  }
  addEventListener(name, fn) {
    this.listeners[name] = fn;
  }
  appendChild(el) {
    this.children.push(el);
  }
  replaceChildren(...els) {
    this.children = els;
  }
  set innerHTML(v) {
    this.children = [];
    this.html = v;
    this.descendants = new Map();
  }
  get innerHTML() {
    return this.html || "";
  }
  setAttribute() {}
  getBoundingClientRect() {
    return { left:0, top:0, width: 1200, height: 800 };
  }
  getContext() {
    return new Proxy(
      {},
      {
        get: (_, key) =>
          key === "measureText"
            ? () => ({ width: 40 })
            : key === "createLinearGradient" || key === "createRadialGradient"
              ? () => ({ addColorStop() {} })
              : () => {},
      },
    );
  }
  querySelector(selector) {
    if (!this.html) return null;
    this.descendants ??= new Map();
    if (!this.descendants.has(selector)) this.descendants.set(selector, new Element());
    return this.descendants.get(selector);
  }
  setPointerCapture() {}
  focus() {}
  click() {
    this.listeners.click?.({ target: this, currentTarget: this });
  }
}
const elements = new Map();
const get = (id) => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
globalThis.document = {
  readyState: "complete",
  querySelector: get,
  querySelectorAll: () => [],
  createElement: () => new Element(),
  addEventListener() {},
};
const intervals=new Map();let intervalSequence=0;
globalThis.window = {
  setInterval: fn => {const id=++intervalSequence;intervals.set(id,fn);return id;},
  clearInterval: id => intervals.delete(id),
  requestAnimationFrame: () => 1,
};
globalThis.devicePixelRatio = 1;
globalThis.ResizeObserver = class {
  observe() {}
};
globalThis.MutationObserver = class {
  observe() {}
};
get("#populationSize").value = "15";
get("#deathAge").value = "82";
await import("../src/app.js");
function dismiss() {
  for (let i = 0; i < 1000 && !get("#eventModal").hidden; i++)
    get("#closeEventModal").click();
  assert.ok(get("#eventModal").hidden);
}
test("arrival renders, preserves manual pause, and restart restores economy and buildings", () => {
  get("#toggleRun").click();
  assert.equal(state.running, false);
  get("#addPersonBtn").click();
  assert.equal(state.people.length, 16);
  dismiss();
  assert.equal(state.running, false);
  get("#addSchoolBtn").click();
  assert.equal(buildings.length, 21, 'preview must not build immediately');
  assert.doesNotThrow(() => drawWorld(100), 'construction preview renders without stopping the animation loop');
  get('#confirmConstruction').click();
  assert.equal(buildings.length, 22);
  state.townTreasury = 1000;
  state.casinoBankroll = 2;
  get("#restart").click();
  get("#confirmNewTown").click();
  assert.equal(buildings.length, 21);
  assert.equal(state.townTreasury, 0);
  assert.equal(state.casinoBankroll, 5000);
  assert.equal(state.people.length, 15);
  assert.equal(state.modalQueue.length, 0);
  assert.equal(state.running, true);
});
test('construction can be cancelled, rejects a blocked lot, and rechecks a preview at confirmation', () => {
  get('#addHomeBtn').click();
  assert.doesNotThrow(() => drawWorld(200));
  const before = buildings.length;
  assert.ok(state.buildMode);
  get('#cancelConstruction').click();
  assert.equal(state.buildMode, null);
  assert.equal(buildings.length, before);
  get('#addOfficeBtn').click();
  assert.doesNotThrow(() => drawWorld(300));
  const originalLot = { ...state.buildMode };
  const neighbor = buildings[0];
  state.buildMode = { ...state.buildMode, x: neighbor.x, y: neighbor.y, issue: null };
  get('#confirmConstruction').click();
  assert.equal(buildings.length, before, 'a stale green preview cannot bypass validation');
  assert.ok(state.buildMode, 'blocked preview stays available to move');
  state.buildMode = originalLot;
  get('#confirmConstruction').click();
  assert.equal(buildings.length, before + 1);
  assert.equal(buildings.at(-1).type, 'office');
  assert.equal(state.buildMode, null);
  assert.equal('issue' in buildings.at(-1), false, 'runtime preview fields do not leak into a building');
  get('#restart').click();get('#confirmNewTown').click();
});
test("30-person controller survives 40 days of updates with finite bounded needs", async () => {
  get("#populationSize").value = "30";
  get("#restart").click();
  get("#confirmNewTown").click();
  assert.equal(state.people.length, 30);
  let seed = 42;
  const original = Math.random;
  Math.random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  try {
    for (let i = 0; i < 40; i++) {
      get("#stepDay").click();
      dismiss();
      assert.ok(state.casinoBankroll >= 0);
      assert.ok(state.townTreasury >= 0);
      for (const p of state.people) {
        for (const key of ["money", "hunger", "energy", "happiness"])
          assert.ok(Number.isFinite(p[key]), `${p.name}: ${key}`);
        assert.ok(p.money >= 0, `${p.name}: negative balance`);
        for (const key of ["hunger", "energy", "happiness"])
          assert.ok(p[key] >= 0 && p[key] <= 100, `${p.name}: ${key}`);
      }
    }
    assert.equal(state.day, 41);
    const { createSnapshot, decodeSnapshot } =
      await import("../src/persistence.js");
    const { jobs } = await import("../src/constants.js");
    const saved = decodeSnapshot(
      JSON.stringify(createSnapshot(state, buildings, jobs)),
    );
    assert.equal(saved.state.people.length, state.people.length);
    assert.equal(saved.state.townTreasury, state.townTreasury);
  } finally {
    Math.random = original;
  }
});

// Run the actual animation function against the controller's current residents.
test("residents reach restaurant stations and service does not stall in transit", async () => {
  const { advanceMovement } = await import("../src/movement.js");
  const { personTargets } = await import("../src/spaces.js");
  const { advanceActivities } = await import("../src/activities.js");
  get("#populationSize").value = "15";
  get("#restart").click();
  get("#confirmNewTown").click();
  state.hour = 13;
  const { requestMeal } = await import("../src/activities.js");
  state.people.forEach((p) => {
    if (p.job?.building === "restaurant") {
      p.status = "Working";
      p.locationId = "restaurant";
    } else requestMeal(p);
  });
  state.running = true;
  const start = performance.now() + 100;
  for (let frame = 0; frame < 2800; frame++) {
    const arrived = advanceMovement(state, personTargets(state, buildings), 16);
    advanceActivities(state, 0.016, arrived);
  }
  const staff = state.people.filter((p) => p.job?.building === "restaurant");
  for (const p of staff) {
    const m = state.motion[p.id];
    assert.ok(
      Math.hypot(m.x - m.finalX, m.y - m.finalY) < 0.7,
      `${p.name} did not reach station: ${m.x}, ${m.y} -> ${m.finalX}, ${m.finalY}`,
    );
  }
  assert.ok(
    state.people.some((p) => p.status === "Finished a meal"),
    "no diner finished a meal",
  );
});

test("a resident is not charged when no housing footprint remains", async () => {
  const { findBuildablePosition } = await import("../src/layout.js");
  const { buyHouse } = await import("../src/app.js");
  const { buildings } = await import("../src/constants.js");
  for (let i = 0; i < 150; i++) {
    const position = findBuildablePosition("home", buildings);
    if (!position) break;
    buildings.push({
      id: `full-lot-${i}`,
      type: "home",
      name: "Test home",
      capacity: 2,
      beds: 1,
      ...position,
    });
  }
  assert.equal(findBuildablePosition("home", buildings), null);
  const person = state.people.find((p) => p.alive);
  person.money = 300;
  const home = person.homeId;
  buyHouse(person);
  assert.equal(person.money, 300);
  assert.equal(person.homeId, home);
});

test("a paused hour skip places actors at the displayed activity rather than an old location", async () => {
  get("#populationSize").value = "15";
  get("#restart").click();
  get("#confirmNewTown").click();
  get("#toggleRun").click();
  get("#stepHour").click();
  for (const p of state.people) {
    const m = state.motion[p.id];
    assert.equal(m.locationId, p.locationId);
    assert.equal(m.x, m.finalX);
    assert.equal(m.y, m.finalY);
  }
});

test('controller renders surrender, preserves jail on an hour skip, and clears encounters on restart', async () => {
  const {startRobbery,advanceCrimes}=await import('../src/crime.js');
  const {toPercent}=await import('../src/layout.js');
  get('#restart').click();get('#confirmNewTown').click();
  state.hour=12;state.pauseForEvents=false;
  const [r,v,o]=state.people;
  for(const p of [r,v,o])Object.assign(p,{alive:true,isChild:false,job:null,mealOrder:undefined,locationId:'town-square',status:'Walking',jailHoursRemaining:0,isSerialKiller:false});
  r.money=50;v.money=300;o.job={title:'Police Officer (Day)',name:'Police Officer (Day)',building:'police-1',starts:6,ends:18,wage:35,nextPromotion:null,daysToPromote:null};
  for(const [p,x]of [[r,698],[v,716],[o,670]])state.motion[p.id]={...toPercent(x,426),locationId:'town-square',route:[],facing:'east',pose:'idle'};
  assert.ok(startRobbery(state,r.id,v.id,buildings,()=>0));
  advanceCrimes(state,.016,buildings,()=>0);
  advanceCrimes(state,.7,buildings,()=>0);
  advanceCrimes(state,.016,buildings,()=>0);
  assert.equal(state.crimeEncounters[0].outcome,'surrendered');
  state.running=false;
  assert.doesNotThrow(()=>drawWorld(2500));
  get('#stepHour').click();
  assert.equal(state.crimeEncounters.length,0);assert.equal(r.locationId,'jail-1');
  const prisoner=state.people.find(p=>p.id===r.id);
  assert.equal(prisoner.locationId,'jail-1');assert.equal(prisoner.jailHoursRemaining,71);
  assert.ok(state.recentEvents.some(e=>e.title==='Robber surrendered'));
  get('#restart').click();get('#confirmNewTown').click();
  assert.deepEqual(state.crimeEncounters,[]);assert.deepEqual(state.pendingCrimeDeaths,[]);
});

test('selecting a living resident follows immediately, keeps the map open and exposes a profile',()=>{
  get('#restart').click();get('#confirmNewTown').click();
  state.running=false;
  get('#peopleList').children[0].click();
  assert.equal(state.followId,state.people[0].id);assert.equal(state.selectedId,state.followId);
  assert.equal(get('#drawer').hidden,true);
  drawWorld(3000);
  assert.equal(get('#followCard').hidden,false);
  assert.equal(get('#followName').textContent,state.people[0].name);
  assert.match(get('#followNeeds').textContent,/Hunger/);
  get('#inspectFollowed').click();
  assert.equal(get('#drawer').dataset.open,'person');assert.equal(get('#drawer').hidden,false);
  assert.equal(state.followId,state.people[0].id);
  const canvas=get('#townMap').children[0];
  canvas.listeners.pointerdown({clientX:100,clientY:100,pointerId:1});
  canvas.listeners.pointermove({clientX:102,clientY:101,pointerId:1});
  assert.equal(state.followId,state.people[0].id,'pointer jitter must not cancel tracking');
  canvas.listeners.pointermove({clientX:125,clientY:100,pointerId:1});
  assert.equal(state.followId,null,'deliberate panning takes camera control');
  canvas.listeners.pointercancel();
  get('#peopleList').children[0].click();
  get('#stopFollowing').click();drawWorld(3100);
  assert.equal(state.followId,null);assert.equal(get('#followCard').hidden,true);
  state.people[0].alive=false;get('#stepHour').click();
  get('#peopleList').children[0].click();
  assert.equal(state.followId,null);assert.equal(get('#drawer').dataset.open,'person');
});
test('normal conversations require arrival, while explicit time skips may abstract travel',()=>{
  get('#restart').click();get('#confirmNewTown').click();state.running=true;
  state.people.forEach(p=>p.talkedToday=6);
  for(const [i,p]of state.people.slice(0,2).entries()) {
    Object.assign(p,{talkedToday:0,job:null,status:'Socializing',locationId:'town-square',hunger:10,happiness:70,energy:80});
    state.motion[p.id]={x:10+i*50,y:50,finalX:47,finalY:40,locationId:'town-square',route:[{x:47,y:40}]};
  }
  state.speech={};state.conversations=[];state.nextConversationAt=0;
  const original=Math.random;Math.random=()=>.2;
  try {
    intervals.get(state.socialTimer)();
    assert.equal(state.conversations.length,0);
    for(const p of state.people.slice(0,2))state.motion[p.id]={x:47,y:40,finalX:47,finalY:40,locationId:'town-square',route:[]};
    state.nextConversationAt=0;intervals.get(state.socialTimer)();
    assert.equal(state.conversations.length,1);
  } finally {Math.random=original;}
});
test('running hour skips reconcile movement and daily deaths enter the mourning path',()=>{
  get('#restart').click();get('#confirmNewTown').click();
  state.running=true;state.hour=22;
  get('#stepHour').click();
  for(const p of state.people)assert.equal(state.motion[p.id].locationId,p.locationId);
  const killer=state.people[0];killer.isSerialKiller=true;killer.lastKillDay=0;killer.jailHoursRemaining=0;
  state.day=3;state.hour=23;state.pauseForEvents=false;
  const original=Math.random;Math.random=()=>.5;
  try {get('#stepHour').click();} finally {Math.random=original;}
  const victim=state.people.find(p=>p.status==='Murdered by serial killer');
  assert.ok(victim,'daily crime should execute in the test');
  assert.ok(state.recentEvents.some(e=>['Death','Town Mourns'].includes(e.title)&&e.message.includes(victim.name)));
});

test('building an office hires job seekers and sends them to the new workplace on the next work hour',()=>{
  get('#restart').click();get('#confirmNewTown').click();state.hour=9;state.running=false;
  const seeker=state.people[0];seeker.job=null;seeker.hunger=0;seeker.happiness=80;seeker.energy=80;seeker.isCareerCriminal=false;
  get('#addOfficeBtn').click();get('#confirmConstruction').click();
  const office=buildings.at(-1);
  assert.equal(office.type,'office');assert.equal(seeker.job.building,office.id);
  assert.ok(state.eventLog.some(e=>e.message.includes('Hired 1 resident')));
  get('#stepHour').click();
  assert.equal(state.people.find(p=>p.id===seeker.id).locationId,office.id);
});

test('hour skips leave residents working and live robberies reserve a victim only once',async()=>{
  const {toPercent}=await import('../src/layout.js');
  get('#restart').click();get('#confirmNewTown').click();state.hour=9;state.running=true;
  const [robber,victim,rival]=state.people;
  state.people=[robber,victim,rival];
  for(const person of [robber,rival])Object.assign(person,{job:{title:'Analyst I',building:'office-2',starts:8,ends:16,wage:30},
    money:20,happiness:35,hunger:0,energy:80,isCareerCriminal:true,locationId:'town-square'});
  Object.assign(victim,{money:500,hunger:0,energy:80,happiness:80,job:null,locationId:'town-square'});
  const original=Math.random;Math.random=()=>.1;
  try {
    get('#stepHour').click();
    assert.equal(state.crimeEncounters.length,0);
    assert.equal(state.people[0].status,'Working');
    for(const [index,person]of state.people.entries())state.motion[person.id]={...toPercent(660+index*28,426),route:[]};
    intervals.get(state.tickTimer)();
    assert.equal(state.crimeEncounters.length,1);
    assert.equal(state.crimeEncounters[0].victimId,victim.id);
    assert.equal(state.people[1].status,'Being approached');
    assert.equal(state.people[2].status,'Working');
  }finally{Math.random=original;}
});
