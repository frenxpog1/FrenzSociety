import { decodeCrimeEncounters } from './crime.js';
import { homeStyles } from "./home-design.js";
// Versioned saves contain gameplay data only. Timers, DOM and wall-clock deadlines are never restored.
import { placementIssue } from "./layout.js";
export const SAVE_KEY = "frenz-society.save.v1",
  BACKUP_KEY = "frenz-society.backup.v1";
const MAX_BYTES = 2_000_000;
const types = new Set([
  "home",
  "office",
  "restaurant",
  "square",
  "school",
  "church",
  "police",
  "jail",
  "hospital",
  "casino",
  "graveyard",
]);
const stages = new Set([
  "walking",
  "queued",
  "cooking",
  "ready",
  "served",
  "eating",
]);
function fail(message) {
  throw new Error(message);
}
const isObject = (x) =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const string = (x, max = 120) =>
  typeof x === "string"
    ? x.replace(/[<>&\u0000-\u001f]/g, "").slice(0, max)
    : "";
function id(x) {
  if (
    typeof x !== "string" ||
    ["__proto__", "prototype", "constructor"].includes(x) ||
    !/^[-a-zA-Z0-9_]{1,120}$/.test(x)
  )
    fail("The save contains an invalid identifier.");
  return x;
}
function number(x, min, max, label) {
  if (typeof x !== "number" || !Number.isFinite(x) || x < min || x > max)
    fail(`The save contains an invalid ${label}.`);
  return x;
}
function array(x, max, label) {
  if (!Array.isArray(x) || x.length > max)
    fail(`The save contains an invalid ${label}.`);
  return x;
}
function unique(items, label) {
  if (new Set(items.map((x) => x.id)).size !== items.length)
    fail(`The save has duplicate ${label}.`);
}
const optionalId = (x) => (x == null ? null : id(x));
function job(x, places) {
  if (x == null) return null;
  if (!isObject(x)) fail("Invalid job.");
  const b = id(x.building);
  if (!places.has(b)) fail("A job refers to a missing building.");
  return {
    name: string(x.name, 80),
    title: string(x.title || x.name, 80),
    building: b,
    starts: number(x.starts, 0, 23, "shift"),
    ends: number(x.ends, 0, 23, "shift"),
    wage: number(x.wage, 0, 10000, "wage"),
    nextPromotion: x.nextPromotion ? string(x.nextPromotion, 80) : null,
    daysToPromote:
      x.daysToPromote == null
        ? null
        : number(x.daysToPromote, 0, 10000, "promotion"),
  };
}
export function createSnapshot(state, buildings, jobs, now = new Date()) {
  const fields = [
    "day",
    "hour",
    "people",
    "relationships",
    "motion",
    "crimeEncounters",
    "pendingCrimeDeaths",
    "eventLog",
    "conversations",
    "recentEvents",
    "townTreasury",
    "casinoBankroll",
    "deaths",
    "deathAge",
    "populationSize",
    "speed",
    "resumeDelay",
    "pauseForEvents",
    "serialKillerEverSpawned",
    "selectedId",
    "activitySeconds",
  ];
  const data = {};
  for (const key of fields)
    if (state[key] !== undefined) data[key] = state[key];
  return {
    format: "frenz-society",
    version: 1,
    savedAt: now.toISOString(),
    town: structuredClone({ ...data, buildings, jobs }),
  };
}
export function decodeSnapshot(raw) {
  if (typeof raw !== "string" || raw.length > MAX_BYTES)
    fail("Choose a town save smaller than 2 MB.");
  let file;
  try {
    file = JSON.parse(raw);
  } catch {
    fail("This file is not a valid town save.");
  }
  if (
    file?.format !== "frenz-society" ||
    file.version !== 1 ||
    !isObject(file.town)
  )
    fail("This town save version is not supported.");
  if (!Number.isFinite(Date.parse(file.savedAt)))
    fail("The save date is invalid.");
  const t = file.town;
  const buildings = array(t.buildings, 100, "building list").map((b) => {
    if (!isObject(b) || !types.has(b.type))
      fail("The save contains an unknown building.");
    const record = {
      id: id(b.id),
      name: string(b.name, 70),
      type: b.type,
      x: number(b.x, 0, 100, "building position"),
      y: number(b.y, 0, 100, "building position"),
    };
    if (b.type === "home")
      Object.assign(record, {
        beds: number(b.beds, 1, 10000, "bed count"),
        capacity: number(b.capacity, 1, 10000, "housing capacity"),
      });
    if (b.interiorStyle !== undefined) {
      if (b.type !== 'home' || !Object.hasOwn(homeStyles,b.interiorStyle)) fail('Invalid home interior style.');
      record.interiorStyle = b.interiorStyle;
    }
    if (b.jobs !== undefined)
      record.jobs = number(b.jobs, 0, 10000, "workplace capacity");
    return record;
  });
  unique(buildings, "buildings");
  const places = new Set(buildings.map((b) => b.id));
  for (const b of buildings)
    if (placementIssue(b, buildings))
      fail("The save places buildings on occupied or reserved land.");
  for (const required of ["town-square", "restaurant", "police-1", "jail-1"])
    if (!places.has(required)) fail("A required town location is missing.");
  const jobs = array(t.jobs, 200, "job list").map((x) => {
    if (x == null) fail("Invalid job template.");
    return job(x, places);
  });
  const numeric = {
    ageDays: [0, 1e7],
    hunger: [0, 100],
    energy: [0, 100],
    happiness: [0, 100],
    money: [0, 1e12],
    mealsMissed: [0, 1e8],
    talkedToday: [0, 1e8],
    depressedHours: [0, 1e8],
    sickHours: [0, 1e8],
    daysWorked: [0, 1e8],
    jailHoursRemaining: [0, 1e8],
    robberyConfidence: [0, 1e6],
    gamblingAddiction: [0, 1e8],
    lastKillDay: [0, 1e8],
    deathDay: [0, 1e8],
  };
  const flags = [
    "alive",
    "sick",
    "isChild",
    "isCareerCriminal",
    "isSerialKiller",
  ];
  const people = array(t.people, 600, "resident list").map((p) => {
    if (!isObject(p)) fail("Invalid resident.");
    const result = { id: id(p.id) };
    for (const key of ["name", "status", "gender", "trait", "skill"])
      result[key] = string(p[key], key === "status" ? 120 : 60);
    if (!result.name) fail("A resident is missing a name.");
    if (result.status === 'Looking for an opportunity') result.status = 'Between activities';
    for (const [key, [min, max]] of Object.entries(numeric))
      if (p[key] !== undefined) result[key] = number(p[key], min, max, key);
    for (const required of [
      "ageDays",
      "hunger",
      "energy",
      "happiness",
      "money",
    ])
      if (result[required] === undefined)
        fail("A resident is missing a need or balance.");
    for (const key of flags) {
      if (p[key] !== undefined && typeof p[key] !== "boolean")
        fail("Invalid resident flag.");
      result[key] = p[key] ?? false;
    }
    result.homeId = optionalId(p.homeId);
    result.locationId = optionalId(p.locationId) || "town-square";
    if (
      (result.homeId && !places.has(result.homeId)) ||
      !places.has(result.locationId)
    )
      fail("A resident refers to a missing location.");
    for (const key of ["parentAId", "parentBId", "partnerId"])
      result[key] = optionalId(p[key]);
    for (const key of [
      "mealsMissed",
      "talkedToday",
      "depressedHours",
      "sickHours",
      "daysWorked",
      "jailHoursRemaining",
    ])
      result[key] ??= 0;
    result.job = job(p.job, places);
    if (p.mealOrder) {
      const o = p.mealOrder;
      if (result.locationId !== "restaurant")
        fail("A meal order refers to the wrong building.");
      if (!isObject(o) || !stages.has(o.stage) || typeof o.paid !== "boolean")
        fail("Invalid meal order.");
      if (o.paid !== ["cooking", "ready", "served", "eating"].includes(o.stage))
        fail("The meal payment state is inconsistent.");
      const seat = o.seat == null ? null : number(o.seat, 0, 5, "dining seat");
      if (seat !== null && !Number.isInteger(seat))
        fail("Invalid dining seat.");
      if (["served", "eating"].includes(o.stage) && seat === null)
        fail("A served meal needs a seat.");
      result.mealOrder = {
        stage: o.stage,
        paid: o.paid,
        elapsed: number(o.elapsed, 0, 10000, "meal progress"),
        seat,
      };
    }
    return result;
  });
  unique(people, "residents");
  const assigned = people
    .filter((p) => p.mealOrder?.seat != null)
    .map((p) => p.mealOrder.seat);
  if (new Set(assigned).size !== assigned.length)
    fail("Two meal orders reserve the same seat.");
  const residents = new Set(people.map((p) => p.id));
  const relationships = {};
  if (
    !isObject(t.relationships) ||
    Object.keys(t.relationships).length > 100000
  )
    fail("Invalid relationship list.");
  for (const [key, r] of Object.entries(t.relationships)) {
    const pair = key.split("|");
    if (pair.length !== 2 || !pair.every((x) => residents.has(x))) continue;
    if (!isObject(r)) fail("Invalid relationship.");
    const value = {};
    for (const k of ["friendship", "romance", "conflict"])
      value[k] = number(r[k], 0, 100, "relationship score");
    for (const k of ["crush", "close", "enemy", "couple"]) value[k] = !!r[k];
    relationships[key] = value;
  }
  const motion = {};
  if (isObject(t.motion))
    for (const p of people) {
      const m = t.motion[p.id];
      if (!isObject(m)) continue;
      const value = {};
      for (const k of ["x", "y", "targetX", "targetY", "finalX", "finalY"])
        if (m[k] !== undefined)
          value[k] = number(m[k], 0, 100, "resident position");
      if (value.x === undefined || value.y === undefined) continue;
      if (m.locationId && places.has(m.locationId))
        value.locationId = m.locationId;
      value.route = array(m.route || [], 10000, "walking route").map((v) => ({
        x: number(v.x, 0, 100, "path position"),
        y: number(v.y, 0, 100, "path position"),
      }));
      value.pose = string(m.pose, 30);
      value.stationFacing = string(m.stationFacing, 10);
      value.facing = string(m.facing, 10);
      value.wanderAt = 0;
      motion[p.id] = value;
    }
  const log = array(t.eventLog || [], 40, "event log").map((e) => ({
    stamp: string(e.stamp, 60),
    message: string(e.message, 1500),
  }));
  const conversations = array(t.conversations || [], 30, "conversations").map(
    (c) => ({
      stamp: string(c.stamp, 60),
      people: string(c.people, 150),
      lines: array(c.lines, 10, "conversation lines").map((l) => ({
        speaker: string(l.speaker, 60),
        text: string(l.text, 1000),
      })),
    }),
  );
  const recentEvents = array(t.recentEvents || [], 12, "recent events").map(
    (e) => ({
      title: string(e.title, 100),
      message: string(e.message, 1500),
      stamp: string(e.stamp, 60),
    }),
  );
  const day = number(t.day, 1, 1e8, "day"),
    hour = number(t.hour, 0, 23, "hour");
  if (!Number.isInteger(day) || !Number.isInteger(hour))
    fail("Invalid town clock.");
  const speed = number(t.speed, 0.5, 30, "speed");
  if (![0.5, 1, 3, 10, 30].includes(speed))
    fail("Unsupported simulation speed.");
  const settings = {
    deathAge: number(t.deathAge, 45, 120, "lifespan"),
    populationSize: number(t.populationSize, 10, 30, "starting population"),
    speed,
    resumeDelay:
      t.resumeDelay === "never"
        ? "never"
        : number(t.resumeDelay, 0, 10, "resume delay"),
    pauseForEvents: !!t.pauseForEvents,
  };
  return {
    savedAt: file.savedAt,
    buildings,
    jobs,
    state: {
      ...settings,
      day,
      hour,
      people,
      relationships,
      motion,
      crimeEncounters: decodeCrimeEncounters(t.crimeEncounters, people, places),
      pendingCrimeDeaths: array(t.pendingCrimeDeaths || [], 100, 'pending deaths').map(value => {
        if (!people.some(p => p.id === value && !p.alive)) fail('Invalid pending death.');
        return value;
      }),
      eventLog: log,
      conversations,
      recentEvents,
      townTreasury: number(t.townTreasury, 0, 1e12, "treasury"),
      casinoBankroll: number(t.casinoBankroll, 0, 1e12, "casino funds"),
      deaths: number(t.deaths || 0, 0, 1e8, "death count"),
      serialKillerEverSpawned: !!t.serialKillerEverSpawned,
      selectedId: residents.has(t.selectedId)
        ? t.selectedId
        : people[0]?.id || null,
      activitySeconds: number(t.activitySeconds || 0, 0, 1e12, "activity time"),
    },
  };
}
export function applySnapshot(snapshot, state, buildings, jobs) {
  // decodeSnapshot must complete before any mutation; a bad import cannot erase a town.
  buildings.splice(0, buildings.length, ...snapshot.buildings);
  jobs.splice(0, jobs.length, ...snapshot.jobs);
  Object.assign(state, snapshot.state, {
    running: false,
    followId: null,
    speech: {},
    recentTopics: {},
    modalQueue: [],
    lastFrameAt: 0,
    nextConversationAt: performance.now() + 2500,
    notice: null,
  });
}
export function saveLocal(state, buildings, jobs, storage) {
  try {
    if (!storage)
      throw new Error(
        "Browser storage is unavailable. Download a save to keep this town.",
      );
    const raw = JSON.stringify(createSnapshot(state, buildings, jobs));
    if (raw.length > MAX_BYTES)
      throw new Error("This town is too large for a local save.");
    const previous = storage.getItem(SAVE_KEY);
    if (previous) {
      try {
        const before = JSON.parse(previous),
          after = JSON.parse(raw);
        if (JSON.stringify(before.town) === JSON.stringify(after.town)) {
          decodeSnapshot(previous);
          return { ok: true, savedAt: before.savedAt };
        }
      } catch {}
    }
    if (previous) {
      try {
        decodeSnapshot(previous);
        storage.setItem(BACKUP_KEY, previous);
      } catch {}
    }
    storage.setItem(SAVE_KEY, raw);
    return { ok: true, savedAt: new Date().toISOString() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
export function readLocal(storage, backup = false) {
  try {
    const raw = storage?.getItem(backup ? BACKUP_KEY : SAVE_KEY);
    if (!raw) return { ok: false, empty: true };
    return { ok: true, snapshot: decodeSnapshot(raw) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
