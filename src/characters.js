import { rounded, oval, stroke, gradient } from "./paint.js";

function hash(text) {
  let n = 2166136261;
  for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  return n;
}
const skins = [
  ["#e5b795", "#c98e6b"], ["#bd8967", "#985d43"],
  ["#926347", "#704631"], ["#efc9a8", "#d8a581"],
  ["#6f4937", "#503226"], ["#cea07e", "#ac7757"],
];
const outfits = [
  ["#6d928a", "#426e68", "#32464c"],
  ["#b78069", "#925e4e", "#364d5d"],
  ["#7f9ab0", "#566f88", "#35414e"],
  ["#c0ab7e", "#9b8359", "#3c4b47"],
  ["#8e879f", "#69627e", "#3c4254"],
  ["#d1d3c5", "#a9b5aa", "#46586b"],
  ["#536f80", "#355569", "#b2a38a"],
  ["#a7ad83", "#7d8761", "#405461"],
];
const hairColors = ["#302f2b", "#5d4537", "#846545", "#b09a75", "#3b3531", "#7f8076"];
const seatedPoses = new Set(["typing", "studying", "eating", "sitting"]);

// Identity is derived from the saved ID, never from needs, age ticks or random frames.
export function characterAppearance(person) {
  const seed = hash(person.id);
  const skin = skins[(seed >>> 4) % skins.length];
  const outfit = outfits[(seed >>> 10) % outfits.length];
  const title = person.job?.title || "";
  const role = title.startsWith("Cook") ? "cook"
    : title.startsWith("Server") ? "server"
    : title.includes("Police") ? "police" : "resident";
  const uniform = {
    cook: ["#f0eee4", "#c8cfc7", "#46555b"],
    server: ["#638a7f", "#3e6a60", "#364a4f"],
    police: ["#587a91", "#34576e", "#2d4356"],
  }[role] || outfit;
  return {
    seed, role, skin: skin[0], skinShade: skin[1],
    hair: hairColors[(seed >>> 19) % hairColors.length],
    hairstyle: (seed >>> 24) % 5,
    shirt: uniform[0], shirtShade: uniform[1], trousers: uniform[2],
    jacket: role === "resident" && (seed >>> 7) % 3 === 0,
    glasses: role === "resident" && (seed >>> 16) % 5 === 0,
    scale: person.isChild ? .65 : .88 + (seed % 5) * .015,
  };
}

// Foot-anchored visual bounds are shared with pointer picking.
export function characterBounds(person, pose = "idle") {
  const s = characterAppearance(person).scale;
  if (!person.alive) return {left: -11 * s, right: 11 * s, top: -6 * s, bottom: 3 * s};
  if (pose === "sleeping") return {left: -7 * s, right: 7 * s, top: -23 * s, bottom: 8 * s};
  return { left: -10 * s, right: 10 * s,
    top: (seatedPoses.has(pose) ? -35 : -38) * s, bottom: 8 * s };
}
function shape(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function head(ctx, a, y, facing, time, portrait = false, eyesClosed = false) {
  const side = facing === "east" || facing === "west";
  ctx.save();
  ctx.translate(0, y);
  if (facing === "west") ctx.scale(-1, 1);
  // Hair behind the neck; five silhouettes stay distinct from every direction.
  if (a.hairstyle === 2) {
    rounded(ctx, -4.1, -3, 1.9, 11, 1, a.hair);
    rounded(ctx, 2.2, -3, 1.9, 11, 1, a.hair);
    stroke(ctx, [[-2.5, 0], [-2.9, 6]], "#ffffff14", .65);
  }
  if (a.hairstyle === 3) oval(ctx, side ? -3.5 : 3.2, -1, 2.2, 3.1, a.hair);
  oval(ctx, side ? -.4 : 0, -.7, 3.75, 4.45, a.hair);
  // Tapered jaw and small ears, with no oversized eye whites.
  ctx.beginPath();
  ctx.moveTo(-3.25, -2.4);
  ctx.bezierCurveTo(-3.6, -.7, -2.8, 3.2, -1.6, 3.85);
  ctx.quadraticCurveTo(0, 4.7, 1.8, 3.6);
  ctx.bezierCurveTo(3.2, 2.4, 3.6, -.8, 3.1, -2.5);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, -3, -3, 6, 8, a.skin, a.skinShade);
  ctx.fill();
  if (side) {
    oval(ctx, -2.4, .6, .7, 1.1, a.skin);
    shape(ctx, [[2.7, -.2], [4.1, 1.2], [2.6, 1.5]], a.skin);
  } else {
    oval(ctx, -3.25, .5, .65, 1.05, a.skin);
    oval(ctx, 3.25, .5, .65, 1.05, a.skin);
  }
  // Back of head is a complete hair mass, not a front face with eyes removed.
  if (facing === "north") {
    oval(ctx, 0, -1.1, 3.8, 4.25, a.hair);
    if (a.hairstyle === 2) rounded(ctx, -3.7, -1, 7.4, 8.8, 2.8, a.hair);
    if (a.hairstyle === 1) oval(ctx, -.5, -4.5, 2.5, 1.6, a.hair);
    if (a.hairstyle === 3) {
      oval(ctx, 0, -1, 2, 2.4, "#ffffff0d");
      oval(ctx, 0, 4, 1.7, 2.5, a.hair);
    }
    stroke(ctx, [[-1.8, -4], [.2, -4.3], [1.7, -3.6]], "#ffffff18", .6);
  } else {
    ctx.beginPath();
    ctx.moveTo(-3.7, .1);
    ctx.bezierCurveTo(-4.4, -6.5, 3.2, -6.6, 3.7, -1.8);
    if (a.hairstyle === 1) {
      ctx.lineTo(1.2, -3.3); ctx.lineTo(-1, -1.4); ctx.lineTo(-2.7, -1.5);
    } else if (a.hairstyle === 4) {
      ctx.lineTo(2.1, -2.8); ctx.lineTo(-1.8, -2.5);
    } else {
      ctx.quadraticCurveTo(.2, -1.4, -2.3, -2.1);
    }
    ctx.closePath(); ctx.fillStyle = a.hair; ctx.fill();
    stroke(ctx, [[-2.5, -3.3], [-.7, -4.1], [1.6, -3.7]], "#ffffff1c", .55);
    if (a.hairstyle === 2) rounded(ctx, -3.8, -1, 1.4, 6.8, .8, a.hair);
    const blink = eyesClosed || !portrait && (time + (a.seed % 101)) % 6.3 < .11;
    const eyeXs = side ? [2] : [-1.45, 1.45];
    for (const x of eyeXs) {
      stroke(ctx, [[x - .45, -.6], [x + .4, -.65]], a.hair, .45);
      if (blink) stroke(ctx, [[x - .35, .35], [x + .35, .35]], "#3e3933", .45);
      else oval(ctx, x, .35, .28, .38, "#34352f");
    }
    if (!side) stroke(ctx, [[.15, .8], [.4, 1.8], [-.15, 2]], a.skinShade, .45);
    stroke(ctx, [[side ? 2.2 : -.65, 2.8], [side ? 2.9 : .7, 2.85]], "#8e5d4d", .42);
    if (a.glasses) {
      for (const x of eyeXs) rounded(ctx, x - 1, -.5, 2.1, 1.7, .55, "#d0e0d315", "#455458", .35);
      if (!side) stroke(ctx, [[-.4, .1], [.4, .1]], "#455458", .35);
    }
  }
  if (a.role === "cook") {
    rounded(ctx, -4, -5, 8, 2.5, .8, "#d5ded6");
    rounded(ctx, -3.6, -8, 7.2, 4.2, 1.4, "#f7f5eb");
    stroke(ctx, [[-1.6, -7], [-1.6, -4.5]], "#dce3db", .5);
  } else if (a.role === "police") {
    rounded(ctx, -3.9, -5.5, 7.8, 3, 1.3, "#3f6179");
    rounded(ctx, side ? 1 : -4, -3, side ? 4.7 : 8, 1, .4, "#2b465b");
    if (facing !== "north") oval(ctx, side ? 2.3 : 0, -4.1, .6, .7, "#d1bc7d");
  }
  ctx.restore();
}
function arm(ctx, a, shoulder, elbow, hand, sleeveLong = true) {
  stroke(ctx, [shoulder, elbow, hand], a.skinShade, 2.2);
  stroke(ctx, [shoulder, elbow, hand], a.skin, 1.8);
  const end = sleeveLong ? [.4 * elbow[0] + .6 * hand[0], .4 * elbow[1] + .6 * hand[1]] : elbow;
  stroke(ctx, [shoulder, elbow, ...(sleeveLong ? [end] : [])], a.shirtShade, 2.65);
  stroke(ctx, [shoulder, elbow, ...(sleeveLong ? [end] : [])], a.shirt, 2.05);
  oval(ctx, hand[0], hand[1], 1, 1.2, a.skin);
}
export function weaponGrip(facing) {
  return {x:facing==='west'?-8:facing==='east'?8:facing==='north'?3:5,
    y:facing==='north'?-25:facing==='south'?-16:-18,
    angle:{east:0,west:Math.PI,north:-Math.PI/2,south:Math.PI/2}[facing] ?? Math.PI/2};
}
export function drawCharacter(ctx, person, x, y, options = {}) {
  const { facing = "south", pose = "idle", moving = false, time = 0, selected = false, running = false, flashlight = false, masked = false, weapon = null, firing = false, gaitPhase } = options;
  let a = characterAppearance(person);
  if(masked) a = {...a,role:'robber',shirt:'#46535b',shirtShade:'#2b3b46',trousers:'#35414b',jacket:false,glasses:false};
  const side = facing === "east" || facing === "west", sign = facing === "west" ? -1 : 1;
  const seated = seatedPoses.has(pose);
  const phase = (gaitPhase ?? time * (running ? 13 : 8.5)) + (a.seed % 11);
  const stride = moving ? Math.sin(phase) * (running ? 1.55 : 1) : 0;
  const bob = moving ? Math.cos(phase * 2) * (running ? .7 : .48) : Math.sin(time * 1.5 + a.seed % 7) * .12;
  ctx.save(); ctx.translate(x + (pose==='frightened'?Math.sin(time*18)*.3:0), y); ctx.scale(a.scale, a.scale);
  oval(ctx, 1.5, 2, 7.5, 2.6, "#253c4826");
  if (selected) {
    ctx.strokeStyle = "#e5bb6b"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 1.5, 9.5, 4, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (!person.alive) {
    rounded(ctx, -10, -4, 20, 5, 3, "#93a396"); ctx.restore(); return;
  }
  if (pose === "sleeping") {
    rounded(ctx, -6, -9, 12, 15, 2.5, "#b0c6c2");
    head(ctx, a, -13, "south", time, false, true);
    ctx.restore(); return;
  }
  const hipY = seated ? -9 : -12;
  const shoulderY = (seated ? -23 : -24) - bob;
  const neckY = shoulderY - 2.5;
  const headY = shoulderY - 6.5;
  // Side poses are narrower and use bent knees and alternating arm/leg swings.
  const shoulderW = side ? 3.7 : 5.6;
  for (const i of [-1, 1]) {
    const sx = side ? i * 1.5 : i * 2.7;
    const swing = i * stride;
    const lift = moving ? Math.max(0, i * Math.cos(phase)) * (running ? 3.4 : 2.1) : 0;
    const knee = seated ? [sx + (side ? sign * 3.5 : i * .8), -1]
      : [sx + (side ? sign * (swing * 2.9 + lift * .45) : i * .35), -8.4 - lift * .5];
    const ankle = seated ? [sx + (side ? sign * 5 : i * .5), 6]
      : [sx + (side ? sign * swing * 4.7 : i * .5), (side ? 0 : swing * 1.9) - lift];
    stroke(ctx, [[sx, hipY - 1], knee, ankle], a.trousers, 3.1);
    stroke(ctx, [[sx - .6, hipY + 1], [knee[0] - .5, knee[1]]], "#ffffff13", .65);
    oval(ctx, ankle[0] + (side ? sign * .9 : .3), ankle[1] + .5, side ? 2.7 : 2.1, 1.25, "#2e3c42");
    stroke(ctx, [[ankle[0] - 1, ankle[1] + 1.1], [ankle[0] + 1.6, ankle[1] + 1.1]], "#bec9c145", .5);
  }
  const active = ["typing", "studying", "cooking"].includes(pose);
  const gesture = Math.sin(time * (pose === "cooking" ? 5 : 9) + a.seed % 17) * .7;
  let hands = [[-6.2, hipY + 1 - stride], [6.2, hipY + 1 + stride]];
  let elbows = [[-6, shoulderY + 7], [6, shoulderY + 7]];
  if (pose === 'frightened' || pose === 'surrender') {
    const tremble = pose === 'frightened' ? Math.sin(time*18)*.35 : 0;
    hands = [[-8,headY-1+tremble],[8,headY-1-tremble]];
    elbows = [[-10,shoulderY+3],[10,shoulderY+3]];
  } else if (pose === 'threaten' || pose === 'aim') {
    const grip = weaponGrip(facing), recoil = firing ? 1 : 0;
    hands[1] = [grip.x-Math.cos(grip.angle)*recoil,grip.y-Math.sin(grip.angle)*recoil];
    elbows[1] = [side?sign*5:7,shoulderY+7];
    if(pose==='aim') { hands[0]=[hands[1][0]-1,hands[1][1]+1]; elbows[0]=[-4,shoulderY+7]; }
  } else if (active && facing === "north") {
    hands = [[-4.5, shoulderY + 2 + gesture], [4.8, shoulderY + 2 - gesture]];
    elbows = [[-7.5, shoulderY + 8], [7.5, shoulderY + 8]];
  } else if (pose === "eating") {
    hands = [[side ? sign * 6 : -5, shoulderY + 7], [side ? sign * 5 : 3, headY + 3 + gesture]];
    elbows = [[side ? sign * 5 : -6, shoulderY + 5], [side ? sign * 8 : 7, shoulderY + 5]];
  } else if (["reading", "studying", "waiting"].includes(pose)) {
    hands = [[-2, shoulderY + 9], [2.5, shoulderY + 9]];
    elbows = [[-6.5, shoulderY + 8], [6.5, shoulderY + 8]];
  } else if (pose === "serving") {
    hands = [[-5, shoulderY + 9], [5, shoulderY + 9]];
  } else if (pose === "talking") {
    hands[1] = [8, shoulderY + 4 + Math.sin(time * 3) * 1.8];
    elbows[1] = [6.7, shoulderY + 8];
  }
  if (side && !active && !["eating", "reading", "waiting", "talking", "frightened", "surrender", "threaten", "aim"].includes(pose)) {
    const armSwing = sign * stride * (running ? 4.1 : 3.4);
    const handY = hipY - (running && moving ? 3 : 0);
    hands = [[armSwing, handY], [-armSwing + sign, handY]];
    elbows = [[armSwing * .45, shoulderY + 7], [-armSwing * .45 + sign, shoulderY + 7]];
  }
  if (pose === 'sweeping') {
    const sweep = Math.sin(time * 4) * 2.8;
    hands = [[-3 + sweep, shoulderY + 6], [4 + sweep, shoulderY + 11]];
    elbows = [[-6, shoulderY + 7], [7, shoulderY + 9]];
  }
  if (flashlight) {
    hands[1] = [side ? sign * 7 : 5, shoulderY + 6];
    elbows[1] = [side ? sign * 4 : 7, shoulderY + 8];
  }
  // Far arm, shaped torso, then near arm gives real depth instead of a flat doll.
  arm(ctx, a, [-shoulderW, shoulderY + 2], elbows[0], hands[0], a.role !== "server");
  shape(ctx, [[-shoulderW + .6, shoulderY], [-2, shoulderY - .6], [2, shoulderY - .6],
    [shoulderW - .6, shoulderY], [shoulderW, shoulderY + 4], [3.6, hipY],
    [-3.6, hipY], [-shoulderW, shoulderY + 4]],
  gradient(ctx, -5, shoulderY, 10, hipY - shoulderY, a.shirt, a.shirtShade));
  stroke(ctx, [[-3.2, hipY - .4], [3.2, hipY - .4]], a.shirtShade, .7);
  if (a.jacket) {
    const inner = facing === "north" ? "#ffffff12" : "#e5e4d7";
    shape(ctx, [[-1.8, shoulderY], [1.8, shoulderY], [1.5, hipY - 1], [-1.5, hipY - 1]], inner);
    stroke(ctx, [[-2.5, shoulderY], [-1, shoulderY + 4]], a.shirtShade, .7);
    stroke(ctx, [[2.5, shoulderY], [1, shoulderY + 4]], a.shirtShade, .7);
  }
  if (a.role === "cook" || a.role === "server") {
    if (facing === "north") {
      stroke(ctx, [[-4, hipY - 5], [4, hipY - 5]], "#d4d9c9", .8);
      stroke(ctx, [[0, hipY - 5], [-1.5, hipY - 2.5]], "#c3cebf", .7);
      stroke(ctx, [[0, hipY - 5], [1.5, hipY - 2.5]], "#c3cebf", .7);
    } else {
      rounded(ctx, -3.2, shoulderY + 5, 6.4, hipY - shoulderY - 4, .6, a.role === "cook" ? "#7e9790" : "#d8c9aa");
      stroke(ctx, [[-3.2, shoulderY + 7], [3.2, shoulderY + 7]], "#ffffff50", .6);
      rounded(ctx, -.6, hipY - 3.5, 2.5, 2, .3, "#ffffff25");
    }
  }
  if (a.role === "police") {
    stroke(ctx, [[-4, hipY - 1.5], [4, hipY - 1.5]], "#273d50", 1.4);
    if (facing !== "north") oval(ctx, 2.6, shoulderY + 4, .8, 1.1, "#dac588");
    rounded(ctx, -4.8, shoulderY + 6, 2.2, 3.2, .4, "#304556");
  }
  rounded(ctx, -1.2, neckY, 2.4, 3.3, .7, a.skinShade);
  if (facing !== "north") {
    stroke(ctx, [[-2.5, shoulderY], [0, shoulderY + 1.8], [2.5, shoulderY]], "#e5e5da9c", .7);
    if (!side && !a.jacket && a.role === "resident")
      stroke(ctx, [[0, shoulderY + 2], [0, hipY - 1.5]], "#ffffff22", .45);
  }
  arm(ctx, a, [shoulderW, shoulderY + 2], elbows[1], hands[1], a.role !== "server");
  if (pose === "reading" || pose === "studying" && facing !== "north") {
    shape(ctx, [[-5, shoulderY + 6], [0, shoulderY + 7], [5, shoulderY + 6], [5, shoulderY + 11], [0, shoulderY + 12], [-5, shoulderY + 11]], "#e7e5d4");
    stroke(ctx, [[0, shoulderY + 7], [0, shoulderY + 12]], "#b3bba7", .5);
  }
  if (person.mealOrder?.stage === "served") {
    oval(ctx, side ? sign * 6 : 0, shoulderY + 10, 6, 2.4, "#f2eee0");
    oval(ctx, side ? sign * 6 : 0, shoulderY + 9.5, 3.7, 1.5, "#b79865");
  }
  if (pose === "cooking" && person.serviceTask?.startsWith("Cooking")) {
    stroke(ctx, [[5, shoulderY - 1], [10, shoulderY - 3]], "#344c54", 1);
    oval(ctx, 12, shoulderY - 3, 4.5, 2.5, "#34464c");
    oval(ctx, 12, shoulderY - 3.5, 3.3, 1.7, "#b3a276");
  }
  if (flashlight) {
    stroke(ctx,[[hands[1][0],hands[1][1]],[hands[1][0]+(side?sign*4:0),hands[1][1]+(facing==='north'?-4:side?0:4)]],'#31424d',2);
  }
  if (pose === 'sweeping') {
    const [gripX, gripY] = hands[1];
    const brushX = gripX + 5 + Math.sin(time * 4) * 2;
    stroke(ctx, [[gripX - 4, gripY - 9], [brushX, 1]], '#8f6f48', 1.35);
    rounded(ctx, brushX - 3.7, 0, 7.4, 2.5, .8, '#bd9860');
    stroke(ctx, [[brushX - 2.6, 2.2], [brushX + 2.7, 2.2]], '#826443', .65);
  }
  if(weapon && !['surrender','frightened'].includes(pose)) {
    ctx.save();ctx.translate(...hands[1]);ctx.rotate(weaponGrip(facing).angle);
    if(weapon==='pistol') {
      rounded(ctx,0,-1.5,7,2.6,.5,'#26343e');
      rounded(ctx,.5,0,2.6,4,.5,'#344854');
      stroke(ctx,[[1,-1],[6,-1]],'#879aa1',.5);
    } else {
      rounded(ctx,-1,-1,4,2, .5,'#635545');
      shape(ctx,[[3,-1.1],[9,-.6],[8,1.1],[3,1.3]],'#d2e0df');
      stroke(ctx,[[3,-1.2],[3,1.5]],'#a4b6b7',.8);
    }
    ctx.restore();
  }
  head(ctx, a, headY, facing, time);
  if(masked) {
    // A temporary hood and face covering replace work headwear only during the incident.
    ctx.save();ctx.translate(0,headY);
    if(facing==='north') oval(ctx,0,-.8,4.6,5.4,'#2e3d47');
    else {
      stroke(ctx,[[-4,2],[-4.1,-3],[-2,-5.2],[1.6,-5.4],[4,-3],[4,2]],'#2e3d47',2);
      rounded(ctx,-3.5,1,7,3.7,1.4,'#334650');
      stroke(ctx,[[-2.2,2],[2.2,2]],'#6f838a',.45);
    }
    ctx.restore();
  }
  if (pose === "talking") {
    rounded(ctx, 7, headY - 10, 11, 6, 2, "#f5f4e9");
    for (let i = 0; i < 3; i++) oval(ctx, 9.5 + i * 2.7, headY - 7, .5, .5, "#6a8780");
  }
  ctx.restore();
}

// Portraits use the same face, hair and uniform as the resident on the map.
export function drawPortrait(canvas, person) {
  const ctx = canvas.getContext("2d"), a = characterAppearance(person);
  canvas.width = 144; canvas.height = 144;
  ctx.clearRect(0, 0, 144, 144);
  const bg = ctx.createLinearGradient(0, 0, 144, 144);
  bg.addColorStop(0, "#e7eee2"); bg.addColorStop(1, "#cadbd2");
  rounded(ctx, 0, 0, 144, 144, 24, bg);
  ctx.save(); ctx.translate(72, 119); ctx.scale(6.2, 6.2);
  shape(ctx, [[-8, 6], [-6, -3], [-3, -4], [3, -4], [6, -3], [8, 6]], a.shirt);
  rounded(ctx, -1.2, -6, 2.4, 3.5, .7, a.skinShade);
  stroke(ctx, [[-2.5, -3.8], [0, -2.2], [2.5, -3.8]], "#ecede291", .6);
  if (a.role === "server" || a.role === "cook") rounded(ctx, -3.5, 0, 7, 6, .5, "#d8c9aa");
  head(ctx, a, -10, "south", 1, true);
  ctx.restore();
}
