import test from "node:test";
import assert from "node:assert/strict";
import { buildings } from "../src/constants.js";
import {
  placementIssue,
  findBuildablePosition,
  buildingBounds,
  buildingDoor,
  nearestPavement,
  intersects,
  toPercent,
} from "../src/layout.js";
import { pedestrianPath, entrancePaths } from "../src/navigation.js";
test("every starting building clears its neighbors, the pavement, and the world edge", () => {
  for (const b of buildings)
    assert.equal(placementIssue(b, buildings), null, b.id);
});
test("expansion refuses streets and already occupied lots", () => {
  assert.equal(
    placementIssue(
      { id: "new", type: "home", ...toPercent(400, 470) },
      buildings,
    ),
    "street",
  );
  const copy = { ...buildings[0], id: "new" };
  assert.equal(placementIssue(copy, buildings), "building");
});
test("expansion never falls back to an overlapping random position when the map fills", () => {
  const town = structuredClone(buildings);
  let added = 0;
  for (let i = 0; i < 180; i++) {
    const type = ["home", "office", "school", "church"][i % 4],
      position = findBuildablePosition(type, town);
    if (!position) break;
    const b = { id: "extra-" + i, type, ...position };
    assert.equal(placementIssue(b, town), null);
    town.push(b);
    added++;
  }
  assert.ok(added > 10);
  assert.equal(findBuildablePosition("office", town), null);
});
test("each initial entrance has an unobstructed connection to pavement", () => {
  for (const { building, points } of entrancePaths(buildings)) {
    assert.ok(points.length >= 2, building.id);
    for (const p of points.slice(1, -1))
      for (const b of buildings) {
        const r = buildingBounds(b, 4);
        assert.ok(
          !(p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom),
          building.id + " cuts through " + b.id,
        );
      }
  }
});
test("the office-to-cafe commute routes around other buildings", () => {
  const a = buildings.find((b) => b.id === "office-1"),
    b = buildings.find((b) => b.id === "restaurant");
  const points = pedestrianPath(buildingDoor(a), buildingDoor(b), buildings);
  assert.ok(points.length > 3);
  for (const p of points.slice(1, -1))
    for (const room of buildings) {
      const r = buildingBounds(room, 4);
      assert.ok(
        !(p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom),
        room.id,
      );
    }
});
