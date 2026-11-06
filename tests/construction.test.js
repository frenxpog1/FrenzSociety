import test from 'node:test';
import assert from 'node:assert/strict';
import { buildings } from '../src/constants.js';
import { previewPlacement, suggestedPlacement, canBuild } from '../src/construction.js';
import { toPixels, toPercent } from '../src/layout.js';
import { buildingSummary } from '../src/inspector.js';

test('placement previews use the actual footprint without mutating the town', () => {
  const original = structuredClone(buildings);
  const preview = suggestedPlacement('home', buildings);
  assert.ok(preview);
  assert.equal(preview.issue, null);
  assert.equal(canBuild('home', preview, buildings), true);
  const obstruction = previewPlacement('home', toPixels(buildings[0]), buildings);
  assert.equal(obstruction.issue, 'building');
  assert.equal(canBuild('home', obstruction, buildings), false);
  assert.equal(previewPlacement('office', { x: 400, y: 470 }, buildings).issue, 'street');
  assert.equal(previewPlacement('home', { x: 0, y: 0 }, buildings).issue, 'edge');
  assert.deepEqual(buildings, original);
});
test('construction refuses unknown types, nonnumeric coordinates, and the save capacity limit', () => {
  assert.equal(suggestedPlacement('castle', buildings), null);
  assert.equal(canBuild('home', { x: NaN, y: 10 }, buildings), false);
  assert.equal(canBuild('home', { x: '10', y: 10 }, buildings), false);
  const full = Array.from({ length: 100 }, (_, i) => ({ ...buildings[0], id: `test-${i}` }));
  assert.equal(suggestedPlacement('home', full), null);
  assert.equal(canBuild('home', toPercent(2100, 1300), full), false);
});
test('a preview becomes invalid when another building takes its lot', () => {
  const preview = suggestedPlacement('school', buildings);
  assert.equal(canBuild('school', preview, buildings), true);
  assert.equal(canBuild('school', preview, [...buildings, { ...preview, id: 'new-school' }]), false);
});
test('building profiles distinguish physical presence, arrivals, departures, and dead residents', () => {
  const b = buildings.find(b => b.type === 'office');
  const people = [
    { id: 'working', name: 'Working', alive: true, locationId: b.id, status: 'Working', job: { building: b.id } },
    { id: 'coming', name: 'Coming', alive: true, locationId: b.id, status: 'Working' },
    { id: 'leaving', name: 'Leaving', alive: true, locationId: 'town-square', status: 'Relaxing' },
    { id: 'dead', alive: false, locationId: b.id, status: 'Dead' },
  ];
  const state = { people, motion: { working: { x: b.x, y: b.y }, coming: toPercent(2100, 1400), leaving: { x: b.x, y: b.y }, dead: { x: b.x, y: b.y } } };
  const summary = buildingSummary(b, state);
  assert.deepEqual(Object.fromEntries(summary.facts), { 'Inside now': 2, 'On the way': 1, Workstations: 6, 'Staff assigned': 1, 'Job openings': 3 });
  assert.equal(summary.visitors.length, 3);
  assert.equal(summary.visitors.find(v => v.person.id === 'coming').action, 'On the way');
  assert.match(summary.visitors.find(v => v.person.id === 'leaving').action, /^Leaving for/);
});
test('home profiles report assigned housing even when residents are elsewhere', () => {
  const home = buildings.find(b => b.type === 'home');
  const summary = buildingSummary(home, { people: [{ id: 'away', alive: true, homeId: home.id, locationId: 'office-1' }], motion: {} });
  assert.equal(Object.fromEntries(summary.facts).Residents, 1);
  assert.equal(Object.fromEntries(summary.facts)['Housing capacity'], 2);
  assert.equal(summary.assigned.length, 1);
  assert.equal(summary.visitors.length, 0);
});
