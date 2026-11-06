import { WORLD } from "./spaces.js";
import {
  STREETS,
  buildingBounds,
  buildingDoor,
  nearestPavement,
  toPercent,
} from "./layout.js";
const STEP = 20,
  COLS = WORLD.width / STEP,
  ROWS = WORLD.height / STEP;
let gridKey = "",
  blocked,
  cache = new Map();
function signature(buildings) {
  return buildings.map((b) => `${b.id}:${b.x}:${b.y}`).join("|");
}
function prepare(buildings) {
  const key = signature(buildings);
  if (key === gridKey) return;
  gridKey = key;
  cache.clear();
  blocked = new Uint8Array(COLS * ROWS);
  for (const b of buildings) {
    const r = buildingBounds(b, 5);
    for (
      let y = Math.max(0, Math.floor(r.top / STEP));
      y <= Math.min(ROWS - 1, Math.ceil(r.bottom / STEP));
      y++
    )
      for (
        let x = Math.max(0, Math.floor(r.left / STEP));
        x <= Math.min(COLS - 1, Math.ceil(r.right / STEP));
        x++
      ) {
        const px = x * STEP + STEP / 2,
          py = y * STEP + STEP / 2;
        if (px > r.left && px < r.right && py > r.top && py < r.bottom)
          blocked[y * COLS + x] = 1;
      }
  }
}
function cost(x, y) {
  const px = x * STEP + STEP / 2,
    py = y * STEP + STEP / 2;
  const h = Math.min(...STREETS.horizontal.map((v) => Math.abs(py - v))),
    v = Math.min(...STREETS.vertical.map((v) => Math.abs(px - v))),
    d = Math.min(h, v);
  const zebra =
    (h < 31 &&
      STREETS.vertical.some((t) => Math.abs(Math.abs(px - t) - 76) < 14)) ||
    (v < 31 &&
      STREETS.horizontal.some((t) => Math.abs(Math.abs(py - t) - 76) < 14));
  if (zebra) return 1.15;
  if (d >= 32 && d <= 58) return 1;
  if (d < 32) return 14;
  return 3.5;
}
function cell(p) {
  return {
    x: Math.max(0, Math.min(COLS - 1, Math.floor(p.x / STEP))),
    y: Math.max(0, Math.min(ROWS - 1, Math.floor(p.y / STEP))),
  };
}
function freeCell(p) {
  const c = cell(p);
  if (!blocked[c.y * COLS + c.x]) return c;
  for (let r = 1; r < 7; r++)
    for (let y = c.y - r; y <= c.y + r; y++)
      for (let x = c.x - r; x <= c.x + r; x++)
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS && !blocked[y * COLS + x])
          return { x, y };
  return c;
}
// A compact binary heap avoids scanning thousands of open cells per route.
function push(heap, item) {
  heap.push(item);
  let i = heap.length - 1;
  while (i) {
    const p = (i - 1) >> 1;
    if (heap[p].f <= item.f) break;
    heap[i] = heap[p];
    i = p;
  }
  heap[i] = item;
}
function pop(heap) {
  const first = heap[0],
    last = heap.pop();
  if (heap.length) {
    let i = 0;
    while (i * 2 + 1 < heap.length) {
      let j = i * 2 + 1;
      if (j + 1 < heap.length && heap[j + 1].f < heap[j].f) j++;
      if (heap[j].f >= last.f) break;
      heap[i] = heap[j];
      i = j;
    }
    heap[i] = last;
  }
  return first;
}
export function pedestrianPath(from, to, buildings) {
  prepare(buildings);
  const start = freeCell(from),
    end = freeCell(to),
    sid = start.y * COLS + start.x,
    eid = end.y * COLS + end.x,
    key = sid + ":" + eid;
  if (cache.has(key))
    return [{ ...from }, ...cache.get(key).map((p) => ({ ...p })), { ...to }];
  const dist = new Float64Array(COLS * ROWS).fill(Infinity),
    parents = new Int32Array(COLS * ROWS).fill(-1),
    closed = new Uint8Array(COLS * ROWS),
    heap = [];
  dist[sid] = 0;
  push(heap, { id: sid, f: 0 });
  while (heap.length) {
    const { id } = pop(heap);
    if (closed[id]) continue;
    if (id === eid) break;
    closed[id] = 1;
    const x = id % COLS,
      y = Math.floor(id / COLS);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        nid = ny * COLS + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= COLS ||
        ny >= ROWS ||
        blocked[nid] ||
        closed[nid]
      )
        continue;
      const score = dist[id] + cost(nx, ny);
      if (score < dist[nid]) {
        dist[nid] = score;
        parents[nid] = id;
        push(heap, {
          id: nid,
          f: score + Math.abs(nx - end.x) + Math.abs(ny - end.y),
        });
      }
    }
  }
  if (!Number.isFinite(dist[eid])) return [];
  const path = [];
  for (let id = eid; id !== sid; id = parents[id]) {
    path.push({
      x: (id % COLS) * STEP + STEP / 2,
      y: Math.floor(id / COLS) * STEP + STEP / 2,
    });
  }
  path.reverse();
  // Keep turns; removing collinear points does not cut through obstacles.
  const turns = path.filter(
    (p, i) =>
      i === 0 ||
      i === path.length - 1 ||
      p.x - path[i - 1].x !== path[i + 1].x - p.x ||
      p.y - path[i - 1].y !== path[i + 1].y - p.y,
  );
  cache.set(key, turns);
  return [{ ...from }, ...turns, { ...to }];
}
export function commuteRoute(from, to, buildings) {
  return pedestrianPath(from, to, buildings).map((p) => toPercent(p.x, p.y));
}
export function entrancePaths(buildings) {
  return buildings.map((b) => {
    const door = buildingDoor(b);
    return {
      building: b,
      points: pedestrianPath(door, nearestPavement(door), buildings),
    };
  });
}
