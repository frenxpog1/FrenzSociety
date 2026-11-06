import test from "node:test";
import assert from "node:assert/strict";
import { createPeople } from "../src/people.js";
import { updatePerson, isWorkHour } from "../src/simulation.js";
import { updateRelationship } from "../src/interactions.js";
import { settleFinances, distributeTreasury } from "../src/economy.js";
const quiet = () => {};
function world(people) {
  return {
    people,
    hour: 19,
    day: 1,
    deathAge: 82,
    relationships: {},
    casinoBankroll: 100,
    townTreasury: 0,
  };
}
function fixedRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}
test("30 residents can start even with only 20 housing spaces", () => {
  const p = createPeople(30);
  assert.equal(p.length, 30);
  assert.equal(p.filter((p) => p.homeId).length, 20);
  assert.ok(p.every((p) => p.locationId));
});
test("night shift crosses midnight but ends at 6", () => {
  const p = { job: { starts: 18, ends: 6 } };
  assert.ok(isWorkHour(p, 23));
  assert.ok(isWorkHour(p, 0));
  assert.ok(!isWorkHour(p, 6));
  assert.ok(!isWorkHour(p, 17));
});
test("winning casino wager conserves money and caps payout to funds", () => {
  const p = {
    ...createPeople(1)[0],
    job: null,
    money: 200,
    hunger: 0,
    happiness: 0,
    energy: 80,
  };
  const s = world([p]);
  const total = p.money + s.casinoBankroll;
  const result = fixedRandom(0, () => updatePerson(p, s, quiet));
  assert.equal(result.casinoPayout, 300);
  settleFinances(result, s);
  assert.equal(result.money + s.casinoBankroll + s.townTreasury, total);
  assert.equal(s.casinoBankroll, 0);
  assert.ok(result.money >= 0);
  settleFinances(result, s);
  assert.equal(result.money + s.casinoBankroll + s.townTreasury, total);
});
test("losing casino wager conserves money", () => {
  const p = {
    ...createPeople(1)[0],
    job: null,
    money: 200,
    hunger: 0,
    happiness: 0,
    energy: 80,
  };
  const s = world([p]);
  const result = fixedRandom(0.9, () => updatePerson(p, s, quiet));
  settleFinances(result, s);
  assert.equal(result.money + s.casinoBankroll + s.townTreasury, 300);
});
test("need distribution keeps rounding remainder in treasury", () => {
  const s = world(createPeople(3));
  s.townTreasury = 101;
  s.people.forEach((p, i) => (p.money = i * 10));
  const before = s.townTreasury + s.people.reduce((n, p) => n + p.money, 0);
  distributeTreasury(s);
  assert.equal(
    s.townTreasury + s.people.reduce((n, p) => n + p.money, 0),
    before,
  );
});
test("parent-child and child-adult pairs cannot develop romance", () => {
  for (const kind of ["parent", "child"]) {
    const [a, b] = createPeople(2);
    a.parentAId = kind === "parent" ? b.id : undefined;
    a.isChild = kind === "child";
    const relations = {};
    for (let i = 0; i < 20; i++)
      fixedRandom(0, () =>
        updateRelationship(
          a,
          b,
          { type: "square", id: "town-square" },
          false,
          relations,
          [a, b],
          quiet,
        ),
      );
    assert.ok(
      Object.values(relations).every((r) => r.romance === 0 && !r.couple),
    );
  }
});
test("wedding cannot spend more than each partner owns", () => {
  const [a, b] = createPeople(2);
  a.money = b.money = 10;
  const relations = {};
  for (let i = 0; i < 20; i++)
    fixedRandom(0, () =>
      updateRelationship(
        a,
        b,
        { type: "square", id: "town-square" },
        false,
        relations,
        [a, b],
        quiet,
      ),
    );
  assert.ok(Object.values(relations).every((r) => !r.couple));
});
test("jailed resident serves hours and cannot earn wages while incarcerated", () => {
  let p = { ...createPeople(1)[0], jailHoursRemaining: 2, money: 100 };
  const s = world([p]);
  p = updatePerson(p, s, quiet);
  assert.equal(p.jailHoursRemaining, 1);
  assert.equal(p.money, 100);
  p = updatePerson(p, s, quiet);
  assert.equal(p.jailHoursRemaining, 0);
  assert.equal(p.status, "Released from jail");
});

test('a rejected robbery continues into normal work without leaving a targeting status', async () => {
  const { toPercent } = await import('../src/layout.js');
  const [robber, victim] = createPeople(2);
  Object.assign(robber, { job:{title:'Analyst I',building:'office-2',starts:8,ends:16,wage:30}, money:12,
    happiness:35, hunger:0, energy:80, isCareerCriminal:true });
  victim.job = null;
  victim.money = 500;
  const state = world([robber, victim]);
  state.hour = 9;
  state.motion = {[robber.id]:toPercent(660,426),[victim.id]:toPercent(716,426)};
  let attempts = 0;
  const options = {tryRobbery:()=>{attempts++;return false;}};
  const result = fixedRandom(.1,()=>updatePerson(robber,state,quiet,options));
  assert.equal(attempts,1);
  assert.equal(result.status,'Working');
  assert.ok(result.money>robber.money);
  state.motion[victim.id]=toPercent(2000,1400);
  fixedRandom(.1,()=>updatePerson(robber,state,quiet,options));
  assert.equal(attempts,1,'a distant resident should never be offered as a target');
});

test('a penniless hungry employee earns wages and can eat the following hour',()=>{
  const [person] = createPeople(1);
  Object.assign(person,{job:{title:'Analyst I',building:'office-2',starts:8,ends:16,wage:30},money:0,
    hunger:90,energy:65,happiness:8,mealsMissed:4,depressedHours:8});
  const state=world([person]);state.hour=8;
  const worker=settleFinances(updatePerson(person,state,quiet),state);
  assert.equal(worker.alive,true);assert.equal(worker.status,'Working');assert.equal(worker.money+state.townTreasury,30);
  state.hour=9;
  const fed=updatePerson(worker,state,quiet);
  assert.equal(fed.alive,true);assert.equal(fed.mealsMissed,0);assert.ok(fed.hunger<worker.hunger);
});

test('paid town shifts use available treasury funds and police are paid for patrolling',()=>{
  const [seeker, officer]=createPeople(2);
  Object.assign(seeker,{job:null,money:0,hunger:90,energy:70,happiness:60});
  const state=world([seeker,officer]);state.hour=9;state.townTreasury=8;
  const worker=settleFinances(updatePerson(seeker,state,quiet),state);
  assert.equal(worker.status,'Working to maintain the square');assert.equal(worker.money,8);assert.equal(state.townTreasury,0);
  const second=settleFinances(updatePerson(seeker,state,quiet),state);
  assert.equal(second.money,0);assert.equal(state.townTreasury,0);
  Object.assign(officer,{hunger:0,happiness:80,energy:80,money:30});
  const patrol=fixedRandom(.1,()=>settleFinances(updatePerson(officer,state,quiet),state));
  assert.equal(patrol.status,'On Patrol');assert.equal(patrol.money-officer.money+state.townTreasury,officer.job.wage);
});
