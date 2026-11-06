import test from "node:test";
import assert from "node:assert/strict";
import { createPeople } from "../src/people.js";
import { buildings, jobs } from "../src/constants.js";
import {
  createSnapshot,
  decodeSnapshot,
  applySnapshot,
  saveLocal,
  readLocal,
  SAVE_KEY,
  BACKUP_KEY,
} from "../src/persistence.js";
function fixture() {
  const people = createPeople(15);
  return {
    people,
    day: 3,
    hour: 13,
    relationships: {},
    motion: {},
    eventLog: [],
    conversations: [],
    recentEvents: [],
    townTreasury: 125,
    casinoBankroll: 4500,
    deaths: 0,
    deathAge: 82,
    populationSize: 15,
    speed: 1,
    resumeDelay: 0,
    pauseForEvents: false,
    serialKillerEverSpawned: false,
    selectedId: people[0].id,
    activitySeconds: 22,
    running: true,
  };
}
class MemoryStorage {
  data = new Map();
  getItem(k) {
    return this.data.get(k) || null;
  }
  setItem(k, v) {
    this.data.set(k, String(v));
  }
}
const encode = (s) => JSON.stringify(createSnapshot(s, buildings, jobs));
test("a full town round trip preserves economy, shifts, relationships, movement and a meal in progress", () => {
  const state = fixture(),
    p = state.people[0],
    q = state.people[1];
  state.relationships[`${p.id}|${q.id}`] = {
    friendship: 55,
    romance: 12,
    conflict: 0,
    close: true,
    couple: false,
  };
  p.locationId = "restaurant";
  p.money = 92;
  p.mealOrder = { stage: "eating", elapsed: 2.25, paid: true, seat: 1 };
  state.motion[p.id] = {
    x: 46,
    y: 70,
    finalX: 47,
    finalY: 71,
    locationId: "restaurant",
    route: [
      { x: 46, y: 70.5 },
      { x: 47, y: 71 },
    ],
    pose: "eating",
    stationFacing: "west",
  };
  const decoded = decodeSnapshot(encode(state)),
    restored = { tickTimer: 123, people: [], running: true },
    rooms = [],
    work = [];
  applySnapshot(decoded, restored, rooms, work);
  assert.equal(restored.running, false);
  assert.equal(restored.tickTimer, 123);
  assert.equal(restored.day, 3);
  assert.equal(restored.townTreasury, 125);
  assert.equal(restored.people[0].money, 92);
  assert.deepEqual(restored.people[0].mealOrder, p.mealOrder);
  assert.deepEqual(restored.motion[p.id].route, state.motion[p.id].route);
  assert.equal(restored.relationships[`${p.id}|${q.id}`].friendship, 55);
  assert.equal(rooms.length, 21);
  assert.equal(work.length, jobs.length);
});
test("the previous valid save remains available as a backup", () => {
  const s = fixture(),
    storage = new MemoryStorage();
  assert.ok(saveLocal(s, buildings, jobs, storage).ok);
  s.day = 4;
  assert.ok(saveLocal(s, buildings, jobs, storage).ok);
  assert.equal(readLocal(storage).snapshot.state.day, 4);
  assert.equal(readLocal(storage, true).snapshot.state.day, 3);
});
test("storage denial or quota failure reports a recoverable failure without changing the stored town", () => {
  const s = fixture(),
    storage = new MemoryStorage();
  saveLocal(s, buildings, jobs, storage);
  const original = storage.getItem(SAVE_KEY);
  storage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  s.day = 8;
  const result = saveLocal(s, buildings, jobs, storage);
  assert.equal(result.ok, false);
  assert.match(result.error, /Quota/);
  assert.equal(storage.getItem(SAVE_KEY), original);
});
test("bad JSON, unknown versions and duplicate identifiers are rejected", () => {
  assert.throws(() => decodeSnapshot("{broken"));
  const file = JSON.parse(encode(fixture()));
  file.version = 9;
  assert.throws(() => decodeSnapshot(JSON.stringify(file)), /version/);
  file.version = 1;
  file.town.people[1].id = file.town.people[0].id;
  assert.throws(() => decodeSnapshot(JSON.stringify(file)), /duplicate/);
});
test("invalid state never reaches the mutation step", () => {
  const s = fixture(),
    file = JSON.parse(encode(s));
  file.town.people[0].money = -1;
  const before = structuredClone(s);
  assert.throws(() => {
    const decoded = decodeSnapshot(JSON.stringify(file));
    applySnapshot(decoded, s, buildings, jobs);
  });
  assert.deepEqual(s, before);
});
test("overlapping buildings, missing destinations and duplicate dining seats are refused", () => {
  for (const kind of ["overlap", "destination", "seat"]) {
    const file = JSON.parse(encode(fixture()));
    if (kind === "overlap") {
      file.town.buildings[1].x = file.town.buildings[0].x;
      file.town.buildings[1].y = file.town.buildings[0].y;
    }
    if (kind === "destination") file.town.people[0].locationId = "missing";
    if (kind === "seat")
      for (const p of file.town.people.slice(0, 2))
        p.mealOrder = { stage: "eating", elapsed: 1, paid: true, seat: 0 };
    assert.throws(() => decodeSnapshot(JSON.stringify(file)));
  }
});
test("save data cannot restore timers or prototype keys, and display text is cleaned", () => {
  const file = JSON.parse(encode(fixture()));
  file.town.tickTimer = 999;
  file.town.people[0].name = "<img src=x onerror=alert(1)>";
  let decoded = decodeSnapshot(JSON.stringify(file));
  assert.equal(decoded.state.tickTimer, undefined);
  assert.ok(!/[<>]/.test(decoded.state.people[0].name));
  file.town.people[0].id = "__proto__";
  assert.throws(() => decodeSnapshot(JSON.stringify(file)), /identifier/);
});
test("a corrupted current save does not destroy a valid backup", () => {
  const storage = new MemoryStorage(),
    s = fixture();
  saveLocal(s, buildings, jobs, storage);
  s.day = 4;
  saveLocal(s, buildings, jobs, storage);
  storage.data.set(SAVE_KEY, "broken");
  assert.equal(readLocal(storage).ok, false);
  assert.equal(readLocal(storage, true).snapshot.state.day, 3);
});

test("idle autosaves retain the previous useful backup", () => {
  const s = fixture(),
    storage = new MemoryStorage();
  saveLocal(s, buildings, jobs, storage);
  s.hour = 14;
  saveLocal(s, buildings, jobs, storage);
  const backup = storage.getItem(BACKUP_KEY);
  saveLocal(s, buildings, jobs, storage);
  assert.equal(storage.getItem(BACKUP_KEY), backup);
  assert.equal(readLocal(storage, true).snapshot.state.hour, 13);
});
test("job-template holes and inconsistent paid meal states are rejected", () => {
  const first = JSON.parse(encode(fixture()));
  first.town.jobs.push(null);
  assert.throws(() => decodeSnapshot(JSON.stringify(first)), /job/);
  const second = JSON.parse(encode(fixture()));
  second.town.people[0].locationId = "restaurant";
  second.town.people[0].mealOrder = {
    stage: "eating",
    paid: false,
    seat: 0,
    elapsed: 1,
  };
  assert.throws(() => decodeSnapshot(JSON.stringify(second)), /payment/);
});

test('home finishes round-trip and old saves retain their original default',()=>{
 const town=structuredClone(buildings),home=town.find(b=>b.type==='home');
 home.interiorStyle='coastal';
 const file=createSnapshot(fixture(),town,jobs);
 assert.equal(decodeSnapshot(JSON.stringify(file)).buildings.find(b=>b.id===home.id).interiorStyle,'coastal');
 delete file.town.buildings.find(b=>b.id===home.id).interiorStyle;
 assert.equal(decodeSnapshot(JSON.stringify(file)).buildings.find(b=>b.id===home.id).interiorStyle,undefined);
 file.town.buildings.find(b=>b.id===home.id).interiorStyle='unknown-theme';
 assert.throws(()=>decodeSnapshot(JSON.stringify(file)),/interior style/);
});
