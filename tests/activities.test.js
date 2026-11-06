import test from "node:test";
import assert from "node:assert/strict";
import { requestMeal, advanceActivities, residentActivity } from "../src/activities.js";
import { getLocalTarget, personTargets, cafe } from "../src/spaces.js";
import { buildings, jobs } from "../src/constants.js";
import { createPeople } from "../src/people.js";
function fixture() {
  const p = createPeople(4);
  const cook = p[0],
    server = p[1];
  for (const [person, title] of [
    [cook, "Cook I"],
    [server, "Server I"],
  ]) {
    person.job = { ...jobs.find((j) => j.name === title), title };
    person.locationId = "restaurant";
    person.status = "Working";
  }
  const s = { people: p, hour: 13, running: true };
  const a = p[2],
    b = p[3];
  a.money = b.money = 100;
  a.hunger = b.hunger = 80;
  requestMeal(a);
  return { s, cook, server, a, b, arrived: new Set(p.map((p) => p.id)) };
}
function advance(s, arrived, times = 1) {
  for (let i = 0; i < times; i++) advanceActivities(s, 1, arrived);
}
test("customer orders, cook prepares, server serves, diner eats before hunger changes", () => {
  const { s, cook, server, a, arrived } = fixture();
  advance(s, arrived);
  assert.equal(a.mealOrder.stage, "queued");
  advance(s, arrived, 2);
  assert.equal(a.money, 92);
  assert.equal(a.mealOrder.stage, "cooking");
  assert.equal(a.hunger, 80);
  advance(s, arrived, 4);
  assert.equal(a.mealOrder.stage, "ready");
  assert.match(cook.serviceTask, /Cooking/);
  advance(s, arrived, 2);
  assert.equal(a.mealOrder.stage, "served");
  assert.match(server.serviceTask, /Serving/);
  advance(s, arrived);
  assert.equal(a.mealOrder.stage, "eating");
  advance(s, arrived, 5);
  assert.equal(a.mealOrder, undefined);
  assert.equal(a.hunger, 38);
  assert.equal(a.money, 92);
});
test("no invisible staff: customer waits and keeps money if nobody is serving", () => {
  const { s, a, arrived, server } = fixture();
  server.locationId = server.homeId;
  advance(s, arrived, 30);
  assert.equal(a.mealOrder.stage, "queued");
  assert.equal(a.money, 100);
});
test("cooking waits for an on-duty, physically arrived cook", () => {
  const { s, cook, a, arrived } = fixture();
  arrived.delete(cook.id);
  advance(s, arrived, 20);
  assert.equal(a.mealOrder.stage, "cooking");
  assert.equal(a.mealOrder.elapsed, 0);
});
test("pause freezes the queue and no payment is repeated after resume", () => {
  const { s, a, arrived } = fixture();
  advance(s, arrived, 3);
  s.running = false;
  advance(s, arrived, 50);
  assert.equal(a.mealOrder.stage, "cooking");
  assert.equal(a.mealOrder.elapsed, 0);
  s.running = true;
  advance(s, arrived, 3);
  assert.equal(a.money, 92);
});
test("two diners reserve different real table seats", () => {
  const { s, a, b, arrived } = fixture();
  requestMeal(b);
  advance(s, arrived, 13);
  assert.ok(a.mealOrder && b.mealOrder);
  assert.notEqual(a.mealOrder.seat, b.mealOrder.seat);
  assert.equal(a.money, 92);
  assert.equal(b.money, 92);
});
test("office workers receive distinct workstation targets matching furniture", () => {
  const b = buildings.find((b) => b.id === "office-1");
  const people = createPeople(2).map((p) => ({
    ...p,
    locationId: b.id,
    status: "Working",
  }));
  const targets = personTargets({ people }, [b]);
  assert.notEqual(targets[people[0].id].y, targets[people[1].id].y);
  assert.equal(targets[people[0].id].pose, "typing");
});
test("served diner targets a table chair rather than the queue", () => {
  const { a } = fixture();
  a.mealOrder.stage = "served";
  a.mealOrder.seat = 2;
  const point = getLocalTarget(
    a,
    buildings.find((b) => b.id === "restaurant"),
    [a],
  );
  assert.equal(point.x, cafe.seats[2].x);
  assert.equal(point.y, cafe.seats[2].y);
});

test("closing time refunds an unfinished paid order only once", () => {
  const { s, a, arrived } = fixture();
  advance(s, arrived, 3);
  assert.equal(a.money, 92);
  s.hour = 20;
  advance(s, arrived, 3);
  assert.equal(a.mealOrder, undefined);
  assert.equal(a.money, 100);
});

test("a new customer can order while the previous meal is cooking", () => {
  const { s, a, b, arrived } = fixture();
  requestMeal(b);
  advance(s, arrived, 5);
  assert.equal(a.mealOrder.stage, "cooking");
  assert.equal(b.mealOrder.stage, "cooking");
  assert.equal(a.money, 92);
  assert.equal(b.money, 92);
});
test("accepted orders step aside from the ordering position", () => {
  const { a, b } = fixture();
  requestMeal(b);
  a.mealOrder.stage = "cooking";
  a.mealOrder.paid = true;
  const room = buildings.find((b) => b.id === "restaurant");
  const pickup = getLocalTarget(a, room, [a, b]),
    counter = getLocalTarget(b, room, [a, b]);
  assert.notEqual(pickup.x, counter.x);
  assert.equal(counter.x, cafe.queue[0].x);
});

test('a customer still walking cannot block another customer already waiting at the counter',()=>{
  const {s,a,b,arrived}=fixture();requestMeal(b);arrived.delete(a.id);
  advance(s,arrived,4);
  assert.equal(a.mealOrder.stage,'walking');assert.equal(a.money,100);
  assert.equal(b.mealOrder.stage,'cooking');assert.equal(b.money,92);
  const restaurant=buildings.find(b=>b.id==='restaurant');
  b.mealOrder.stage='queued';
  const target=getLocalTarget(b,restaurant,[a,b]);
  assert.equal(target.x,cafe.queue[0].x);assert.equal(target.y,cafe.queue[0].y);
});
test('activity labels distinguish travelling from working, patrols and a crime scene',()=>{
  const {s,a}=fixture();a.mealOrder=undefined;a.job={title:'Analyst I'};a.status='Working';a.locationId='office-2';
  s.motion={[a.id]:{x:10,y:20,finalX:70,finalY:40,locationId:'office-2',route:[]}};
  assert.equal(residentActivity(s,a),'Walking to Office B');
  Object.assign(s.motion[a.id],{x:70,y:40});
  assert.equal(residentActivity(s,a),'Typing at the computer');
  s.crimeEncounters=[{robberId:a.id}];a.status='Surrendering to police';
  assert.equal(residentActivity(s,a),'Surrendering to police');
});
