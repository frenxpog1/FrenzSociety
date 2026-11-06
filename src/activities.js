import { hasArrived } from './movement.js';
import { encounterFor } from './crime.js';
import { isPatrolling } from './resident-behavior.js';
// Restaurant service advances in simulation seconds, and freezes whenever time is paused.
import { gameConfig, buildings } from "./constants.js";
import { isWorkHour } from "./simulation.js";
import { clamp } from "./utils.js";
const inService = (p) =>
  p.alive &&
  !p.jailHoursRemaining &&
  !p.mealOrder &&
  p.locationId === "restaurant" &&
  /work/i.test(p.status);
export function requestMeal(person) {
  person.locationId = "restaurant";
  person.status = "Walking to the café";
  person.mealOrder = { stage: "walking", elapsed: 0, paid: false, seat: null };
  return person;
}
export function activityText(person) {
  const order = person.mealOrder;
  if (!order) {
    if (person.serviceTask) return person.serviceTask;
    if (
      /work/i.test(person.status) &&
      /Clerk|Analyst/.test(person.job?.title || "")
    )
      return "Typing at the computer";
    return person.status;
  }
  return {
    walking: "Going to order",
    queued: "Waiting to order",
    cooking: "Meal being prepared",
    ready: "Waiting for pickup",
    served: "Taking food to a table",
    eating: "Eating lunch",
  }[order.stage];
}
// Use the same travel truth for the profile, follow card and map labels.
export function residentActivity(state,person) {
  if(!person.alive || encounterFor(state,person.id))return person.status;
  if(isPatrolling(person,state.hour))return 'Patrolling the streets';
  if(state.motion?.[person.id] && !hasArrived(state,person))
    return 'Walking to '+(buildings.find(b=>b.id===person.locationId)?.name || 'town');
  return activityText(person);
}
export function advanceActivities(
  state,
  seconds,
  arrived = new Set(),
  force = false,
) {
  if ((!state.running && !force) || seconds <= 0) return;
  const cooks = state.people.filter(
    (p) =>
      inService(p) &&
      p.job?.title.startsWith("Cook") &&
      isWorkHour(p, state.hour) &&
      arrived.has(p.id),
  );
  const servers = state.people.filter(
    (p) =>
      inService(p) &&
      p.job?.title.startsWith("Server") &&
      isWorkHour(p, state.hour) &&
      arrived.has(p.id),
  );
  for (const p of state.people) delete p.serviceTask;
  const orders = state.people.filter((p) => p.alive && p.mealOrder);
  const usedCooks = new Set(),
    usedServers = new Set();
  const reservedSeats = new Set(
    orders
      .filter((p) => p.mealOrder.seat !== null)
      .map((p) => p.mealOrder.seat),
  );
  for (const person of orders) {
    const order = person.mealOrder;
    if (
      (state.hour >= 20 || state.hour < 10) &&
      !["served", "eating"].includes(order.stage)
    ) {
      if (order.paid) person.money += gameConfig.mealCost;
      delete person.mealOrder;
      person.status = "Café closed";
      person.locationId = person.homeId || "town-square";
      continue;
    }
    if (order.stage === "walking") {
      if (arrived.has(person.id)) {
        order.stage = "queued";
        order.elapsed = 0;
      }
      continue;
    }
    if (order.stage === "queued") {
      // Queue positions are shared with navigation; only the front customer orders.
      const front = orders.find((p) =>
        p.mealOrder?.stage === 'queued' && arrived.has(p.id),
      );
      if (front !== person || !arrived.has(person.id)) continue;
      const server = servers.find((p) => !usedServers.has(p.id));
      if (!server) continue;
      usedServers.add(server.id);
      server.serviceTask = `Taking ${person.name}'s order`;
      order.elapsed += seconds;
      if (order.elapsed < 1.3) continue;
      if (person.money < gameConfig.mealCost) {
        delete person.mealOrder;
        person.status = "Could not afford a meal";
        person.locationId = person.homeId || "town-square";
        continue;
      }
      person.money -= gameConfig.mealCost;
      order.paid = true;
      order.stage = "cooking";
      order.elapsed = 0;
      continue;
    }
    if (order.stage === "cooking") {
      const cook = cooks.find((p) => !usedCooks.has(p.id));
      if (!cook) continue;
      usedCooks.add(cook.id);
      cook.serviceTask = `Cooking for ${person.name}`;
      order.elapsed += seconds;
      if (order.elapsed >= 3.5) {
        order.stage = "ready";
        order.elapsed = 0;
      }
      continue;
    }
    if (order.stage === "ready") {
      const server = servers.find((p) => !usedServers.has(p.id));
      const seat = [0, 1, 2, 3, 4, 5].find((i) => !reservedSeats.has(i));
      if (!server || seat === undefined) continue;
      usedServers.add(server.id);
      server.serviceTask = `Serving ${person.name}'s meal`;
      order.elapsed += seconds;
      if (order.elapsed >= 1.2) {
        order.stage = "served";
        order.elapsed = 0;
        order.seat = seat;
        reservedSeats.add(seat);
      }
      continue;
    }
    if (order.stage === "served") {
      if (arrived.has(person.id)) {
        order.stage = "eating";
        order.elapsed = 0;
      }
      continue;
    }
    if (order.stage === "eating") {
      order.elapsed += seconds;
      if (order.elapsed < 5) continue;
      person.hunger = clamp(person.hunger - 42, 0, 100);
      person.energy = clamp(person.energy + 4, 0, 100);
      person.happiness = clamp(person.happiness + 6, 0, 100);
      person.mealsMissed = 0;
      delete person.mealOrder;
      person.status = "Finished a meal";
      person.locationId = person.homeId || "town-square";
    }
  }
  for (const cook of cooks)
    if (!cook.serviceTask) cook.serviceTask = "Preparing ingredients";
  for (const server of servers)
    if (!server.serviceTask) server.serviceTask = "Ready at the counter";
}
