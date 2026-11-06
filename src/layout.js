import { WORLD, roomSize } from "./spaces.js";
// The renderer, placement validator and pedestrian planner share these dimensions.
export const STREETS = {
  horizontal: [470, 930],
  vertical: [760, 1400],
  asphalt: 60,
  pavement: 108,
};
export const toPercent = (x, y) => ({
  x: (x / WORLD.width) * 100,
  y: (y / WORLD.height) * 100,
});
export const toPixels = (p) => ({
  x: (p.x * WORLD.width) / 100,
  y: (p.y * WORLD.height) / 100,
});
export function buildingBounds(b, padding = 0) {
  const { x, y } = toPixels(b),
    [w, h] = roomSize(b);
  return {
    left: x - w / 2 - 8 - padding,
    right: x + w / 2 + 8 + padding,
    top: y - h / 2 - 16 - padding,
    bottom: y + h / 2 + 16 + padding,
  };
}
export function intersects(a, b) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}
export function streetDistance(x, y) {
  return Math.min(
    ...STREETS.horizontal.map((v) => Math.abs(y - v)),
    ...STREETS.vertical.map((v) => Math.abs(x - v)),
  );
}
export function placementIssue(candidate, existing) {
  const bounds = buildingBounds(candidate, 12);
  if (
    bounds.left < 92 ||
    bounds.right > WORLD.width - 24 ||
    bounds.top < 24 ||
    bounds.bottom > WORLD.height - 20
  )
    return "edge";
  if (
    STREETS.horizontal.some(
      (y) =>
        bounds.top < y + STREETS.pavement / 2 &&
        bounds.bottom > y - STREETS.pavement / 2,
    ) ||
    STREETS.vertical.some(
      (x) =>
        bounds.left < x + STREETS.pavement / 2 &&
        bounds.right > x - STREETS.pavement / 2,
    )
  )
    return "street";
  if (
    existing.some(
      (b) => b.id !== candidate.id && intersects(bounds, buildingBounds(b, 12)),
    )
  )
    return "building";
  return null;
}
export function findBuildablePosition(type, existing) {
  const choices = [];
  for (let y = 100; y < WORLD.height - 65; y += 50)
    for (let x = 160; x < WORLD.width - 65; x += 50) {
      const p = { id: "candidate", type, ...toPercent(x, y) };
      if (!placementIssue(p, existing))
        choices.push({
          x,
          y,
          score: streetDistance(x, y) + Math.abs(y - 650) * 0.06,
        });
    }
  choices.sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x);
  return choices.length ? toPercent(choices[0].x, choices[0].y) : null;
}
export function buildingDoor(b) {
  const p = toPixels(b);
  return { x: p.x, y: p.y + roomSize(b)[1] / 2 + 34 };
}
export function nearestPavement(p) {
  const options = [];
  for (const y of STREETS.horizontal)
    for (const side of [-1, 1]) options.push({ x: p.x, y: y + side * 44 });
  for (const x of STREETS.vertical)
    for (const side of [-1, 1]) options.push({ x: x + side * 44, y: p.y });
  return options.sort(
    (a, b) =>
      Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
  )[0];
}
