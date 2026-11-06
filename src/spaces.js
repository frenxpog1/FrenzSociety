// Shared dimensions and interaction points keep furniture, navigation and poses aligned.
export const WORLD = { width: 2300, height: 1600 };
export function roomSize(building) {
  return (
    {
      home: [120, 88],
      office: [190, 132],
      restaurant: [232, 148],
      school: [164, 110],
      police: [150, 112],
      jail: [142, 110],
      hospital: [164, 118],
      casino: [150, 112],
      church: [144, 110],
      square: [152, 100],
      graveyard: [134, 100],
    }[building.type] || [150, 110]
  );
}
export function deskSlots(building) {
  const [w] = roomSize(building);
  if (building.type === "office")
    return [-w * 0.32, 0, w * 0.32].flatMap((x) =>
      [-12, 42].map((y) => ({ x, y, facing: "north", pose: "typing" })),
    );
  if (building.type === "school")
    return [-48, 0, 48].flatMap((x) =>
      [-7, 32].map((y) => ({ x, y, facing: "north", pose: "studying" })),
    );
  return [
    { x: -35, y: -6, facing: "north", pose: "typing" },
    { x: 28, y: -6, facing: "north", pose: "typing" },
  ];
}
export const cafe = {
  stove: { x: -77, y: -23, facing: "north", pose: "cooking" },
  counter: { x: 57, y: -32, facing: "south", pose: "serving" },
  kitchen: { x: -34, y: -23, facing: "north", pose: "cooking" },
  queue: [
    { x: 62, y: 9 },
    { x: 86, y: 28 },
    { x: 87, y: 54 },
    { x: 60, y: 55 },
  ],
  tables: [
    { x: -75, y: 40 },
    { x: -20, y: 40 },
    { x: 30, y: 40 },
  ],
  seats: [
    { x: -92, y: 40, facing: "east" },
    { x: -58, y: 40, facing: "west" },
    { x: -37, y: 40, facing: "east" },
    { x: -3, y: 40, facing: "west" },
    { x: 13, y: 40, facing: "east" },
    { x: 47, y: 40, facing: "west" },
  ],
};
export function workKind(person, building) {
  if (!person.alive) return "dead";
  if (person.mealOrder) return "meal";
  const status = person.status.toLowerCase();
  if (status === 'working to maintain the square') return 'sweeping';
  if (status === 'resting before the next shift' && building.type === 'home') return 'sleeping';
  if (status.includes("sleep") || status.includes("bed")) return "sleeping";
  if (status.includes("eating")) return "eating";
  if (
    status.includes("talk") ||
    status.includes("social") ||
    status.includes("argu")
  )
    return "talking";
  if (status.includes("school")) return "studying";
  if (status.includes("treatment")) return "resting";
  if (status.includes("work") || status.includes("police station")) {
    if (building.type === "restaurant")
      return person.job?.title.startsWith("Cook") ? "cooking" : "serving";
    return "typing";
  }
  return "idle";
}
export function cafeQueue(occupants) {
  // People already at the counter get positions before customers still travelling.
  return ['queued','walking'].flatMap(stage=>occupants.filter(p=>p.alive && p.mealOrder?.stage===stage));
}
export function getLocalTarget(person, building, occupants) {
  const kind = workKind(person, building);
  const peers = occupants.filter((p) => workKind(p, building) === kind);
  const index = Math.max(
    0,
    peers.findIndex((p) => p.id === person.id),
  );
  const [w, h] = roomSize(building);
  if (kind === "meal") {
    const order = person.mealOrder;
    if (["served", "eating"].includes(order.stage))
      return {
        ...cafe.seats[order.seat],
        pose: order.stage === "eating" ? "eating" : "idle",
      };
    if(['cooking','ready'].includes(order.stage)){
      const waiting=occupants.filter(p=>p.mealOrder&&['cooking','ready'].includes(p.mealOrder.stage));
      const slot=Math.max(0,waiting.findIndex(p=>p.id===person.id));
      return slot<6?{x:-96+slot*24,y:15,facing:'north',pose:'waiting'}:{x:-82+(slot-6)%3*26,y:h/2+28+Math.floor((slot-6)/3)*32,facing:'north',pose:'waiting'};
    }
    const waiting=cafeQueue(occupants);
    const q = Math.max(
      0,
      waiting.findIndex((p) => p.id === person.id),
    );
    return {
      ...(cafe.queue[q] || { x: 87, y: h / 2 + 18 + (q - 4) * 18 }),
      facing: "north",
      pose: "waiting",
    };
  }
  if (building.type === "restaurant" && ['idle', 'talking'].includes(kind)) {
    const guests = occupants.filter(p => ['idle','talking'].includes(workKind(p,building)));
    const slot = Math.max(0,guests.findIndex(p => p.id === person.id));
    return {x:[-82,-56,-30,30,56,82][slot%6], y:h/2+28+Math.floor(slot/6)*32,
      facing:'south',pose:kind};
  }
  if (kind === "typing" || kind === "studying") {
    const slots = deskSlots(building);
    if (index < slots.length) return slots[index];
    return {
      x: w / 2 - 18,
      y: -h / 2 + 34 + (index - slots.length) * 18,
      facing: "west",
      pose: "reading",
    };
  }
  if (kind === "cooking")
    return {
      ...(index % 2 === 0 ? cafe.stove : cafe.kitchen),
      x:
        (index % 2 === 0 ? cafe.stove : cafe.kitchen).x +
        Math.floor(index / 2) * 18,
    };
  if (kind === "serving")
    return { ...cafe.counter, x: cafe.counter.x - index * 22 };
  if(kind==='eating'&&building.type==='restaurant'&&person.job?.building==='restaurant')return {x:-16+index*18,y:-23,facing:'east',pose:'eating'};
  if (kind === "sleeping" && building.type === "home")
    return {
      x: -35 + (index % 2) * 26,
      y: -h / 2 + 24,
      facing: "south",
      pose: "sleeping",
    };
  if (kind === "eating" && building.type === "home")
    return {
      x: 25 + (index % 2) * 20,
      y: 23,
      facing: index % 2 ? "west" : "east",
      pose: "eating",
    };
  if (kind === "resting" && building.type === "hospital")
    return {
      x: -49 + (index % 3) * 49,
      y: -17,
      facing: "south",
      pose: "sleeping",
    };
  if (building.type === "square")
    return {
      x: Math.cos(index * 2.4) * 53,
      y: Math.sin(index * 2.4) * 29 + 13,
      facing: "south",
      pose: kind,
    };
  if (building.type === "jail")
    return {
      x: -42 + (index % 3) * 41,
      y: 8 + Math.floor(index / 3) * 16,
      facing: "south",
      pose: "idle",
    };
  if (building.type === "church")
    return {
      x: -44 + (index % 5) * 22,
      y: -7 + Math.floor(index / 5) * 24,
      facing: "north",
      pose: "sitting",
    };
  return {
    x: -w * 0.25 + (index % 4) * 18,
    y: h * 0.25 + Math.floor(index / 4) * 17,
    facing: "south",
    pose: kind,
  };
}
export function personTargets(state, buildings) {
  const groups = new Map();
  for (const p of state.people) {
    const g = groups.get(p.locationId) || [];
    g.push(p);
    groups.set(p.locationId, g);
  }
  const result = {};
  for (const b of buildings)
    for (const p of groups.get(b.id) || []) {
      const point = getLocalTarget(p, b, groups.get(b.id));
      result[p.id] = {
        ...point,
        x: Math.min(98,Math.max(2,b.x + (point.x / WORLD.width) * 100)),
        y: Math.min(98,Math.max(2,b.y + (point.y / WORLD.height) * 100)),
      };
    }
  return result;
}
