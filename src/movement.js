import { crimeDirective } from './crime.js';
import { isPatrolling, patrolPoint, travelMode } from "./resident-behavior.js";
import { commuteRoute } from "./navigation.js";
import { buildingDoor, toPercent, toPixels } from "./layout.js";
import { WORLD, roomSize } from "./spaces.js";
import { buildings } from "./constants.js";
export function worldDistance(a, b) {
  return Math.hypot((a.x - b.x) * WORLD.width / 100, (a.y - b.y) * WORLD.height / 100);
}
export function hasArrived(state, person) {
  const m=state.motion?.[person.id];
  return !!m && m.locationId===person.locationId && !m.route?.length &&
    worldDistance(m,{x:m.finalX ?? m.x,y:m.finalY ?? m.y})<1.5;
}
export function advanceMovement(state, targets, elapsed) {
  const arrived = new Set();
  for (const person of state.people) {
    let target = targets[person.id];
    const m = state.motion[person.id];
    if (!target || !m || !person.alive) continue;
    const directive = crimeDirective(state, person);
    const patrol = !directive && isPatrolling(person, state.hour);
    if (directive) target = directive.target;
    if (patrol) target = {...patrolPoint(person,m),pose:'patrol',facing:m.facing||'south'};
    const b = buildings.find((b) => b.id === person.locationId);
    const changed =
      Math.hypot(
        (m.finalX ?? target.x) - target.x,
        (m.finalY ?? target.y) - target.y,
      ) > 0.25;
    if (directive) {
      if (m.mode !== directive.key || changed) {
        m.route = worldDistance(m,target) < 1.5 ? [] : commuteRoute(toPixels(m),toPixels(target),buildings);
        m.mode = directive.key;
      }
    } else if (m.mode?.startsWith('crime:')) {
      // Resume at the current street position, without inventing an old indoor exit.
      m.mode = 'walk';
      const door = b ? toPercent(buildingDoor(b).x,buildingDoor(b).y) : target;
      m.route = [...commuteRoute(toPixels(m),toPixels(door),buildings), target];
      m.locationId = person.locationId;
    } else if (patrol) {
      if (m.mode !== 'patrol' || !m.route?.length) {
        m.route = commuteRoute(toPixels(m),toPixels(target),buildings);
        m.mode = 'patrol';
      }
      m.locationId = person.locationId;
    } else if (m.mode === 'patrol') {
      m.mode = 'walk';
      delete m.patrolIndex;
      m.route = commuteRoute(toPixels(m),toPixels(target),buildings);
      m.locationId = person.locationId;
    } else if (m.locationId !== person.locationId) {
      const door = b ? toPercent(buildingDoor(b).x, buildingDoor(b).y) : target;
      const old = buildings.find((b) => b.id === m.locationId);
      const exit = old
        ? toPercent(buildingDoor(old).x, buildingDoor(old).y)
        : m;
      let leave = old ? [exit] : [];
      if (old?.type === "restaurant") {
        const aisleX = old.x + (100 / WORLD.width) * 100;
        leave =
          m.y < old.y + 1
            ? [{ x: aisleX, y: m.y }, { x: aisleX, y: exit.y }, exit]
            : [{ x: m.x, y: old.y + (62 / WORLD.height) * 100 }, exit];
      } else if (old?.type === "office") {
        const aisleX = old.x + ((m.x < old.x ? -31 : 31) / WORLD.width) * 100;
        leave = [{ x: aisleX, y: m.y }, { x: aisleX, y: exit.y }, exit];
      }
      let enter = [{ x: b?.x ?? target.x, y: target.y }, target];
      if (b?.type === "restaurant") {
        const aisleX = b.x + (100 / WORLD.width) * 100;
        enter = [{ x: aisleX, y: door.y }, { x: aisleX, y: target.y }, target];
      } else if (b?.type === "office") {
        const aisleX = b.x + ((target.x < b.x ? -31 : 31) / WORLD.width) * 100;
        enter = [{ x: aisleX, y: door.y }, { x: aisleX, y: target.y }, target];
      }
      m.route = [
        ...leave,
        ...commuteRoute(toPixels(exit), toPixels(door), buildings),
        ...enter,
      ];
      m.locationId = person.locationId;
    } else if (changed) {
      // Queue shuffling must not reset a long walk that is still in progress.
      if (m.route?.length && Math.hypot(m.x - target.x, m.y - target.y) > 8) {
        m.route[m.route.length - 1] = target;
      } else
        m.route = [
          {
            x: m.x,
            y:
              (b?.y ?? target.y) +
              (b?.type === "restaurant" ? (16 / WORLD.height) * 100 : 0.8),
          },
          {
            x: target.x,
            y:
              (b?.y ?? target.y) +
              (b?.type === "restaurant" ? (16 / WORLD.height) * 100 : 0.8),
          },
          target,
        ];
    }
    m.finalX = target.x;
    m.finalY = target.y;
    m.pose = target.pose;
    m.stationFacing = target.facing;
    // Spend the frame's distance across waypoints, measured in world pixels.
    // Normalized map percentages made east/west travel faster than north/south.
    const blockedCrime = directive && !m.route?.length && worldDistance(m,target)>=1.5;
    const milliseconds = Math.max(0, Math.min(elapsed, 1000));
    const running = travelMode(person) === 'run';
    const budget = blockedCrime ? 0 : milliseconds * .185 * Math.sqrt(state.speed) * (running ? 1.6 : 1);
    let remaining = budget;
    let hops = 0;
    while (hops++ < 128) {
      const point = m.route?.[0] || target;
      const dx = (point.x - m.x) * WORLD.width / 100;
      const dy = (point.y - m.y) * WORLD.height / 100;
      const distance = Math.hypot(dx, dy);
      m.targetX = point.x;
      m.targetY = point.y;
      if (distance > .1) m.facing = Math.abs(dx) > Math.abs(dy)
        ? dx > 0 ? 'east' : 'west' : dy > 0 ? 'south' : 'north';
      if (distance <= remaining + .001) {
        m.x = point.x; m.y = point.y;
        remaining = Math.max(0, remaining - distance);
        if (m.route?.length) { m.route.shift(); continue; }
        break;
      }
      if (remaining <= 0) break;
      m.x += dx / distance * remaining / WORLD.width * 100;
      m.y += dy / distance * remaining / WORLD.height * 100;
      break;
    }
    const travelled = budget - remaining;
    m.moved = travelled > .05;
    // Advance the stride only when the character covers ground. Limit the
    // cadence at high simulation speeds so individual steps remain readable.
    const turn = Math.PI * 2;
    const cycle = running ? 82 : 70;
    m.gaitPhase = ((m.gaitPhase || 0) + Math.min(travelled / cycle * turn, milliseconds * .022)) % turn;
    if (worldDistance(m, target) < 1.5 && !m.route?.length) {
      if (patrol) m.patrolIndex = (m.patrolIndex + 1) % 4;
      else arrived.add(person.id);
    }
  }
  return arrived;
}
