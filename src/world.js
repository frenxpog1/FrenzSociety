import { crimeDirective, encounterFor } from './crime.js';
import { drawCrimeEffects, shotPulse } from './crime-art.js';
import { travelMode, patrolBeam, isPatrolling } from "./resident-behavior.js";
import { worldDistance } from "./movement.js";
import { drawRoomActivity, drawRoomForeground } from "./scene-details.js";
import { drawLighting } from "./lighting.js";
import { drawEnvironment } from "./streets.js";
import { rounded, text } from "./paint.js";
import { drawRoom, drawExterior, drawPublicSpace, drawCafeCounter, drawCafeTabletop } from "./room-art.js";
import { drawCharacter, characterBounds } from "./characters.js";
import { roomSize, WORLD, cafe } from "./spaces.js";
import { residentActivity } from "./activities.js";
import { buildingBounds, toPixels } from "./layout.js";
import { buildCatalog, previewPlacement, suggestedPlacement, placementMessages } from "./construction.js";
// Canvas presentation only: the simulation owns all people, locations and time.
import { buildings } from "./constants.js";
import { clamp } from "./utils.js";
const W = WORLD.width,
  H = WORLD.height;
let canvas,
  ctx,
  state,
  select,
  actions = {},
  width = 1,
  height = 1,
  scale = 1;
let sceneryCache,
  sceneryKey = "";
let inspectorUpdatedAt = 0;
const camera = { zoom: 1, x: 0, y: 0 };
let interiors = true,
  focusedBuilding = null,
  hoveredPerson = null;
let labels = true,
  drag = null,
  hovered = null;
function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function poly(points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function line(points, color, size = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}
function label(text, x, y, color = "#f7f2db", size = 12) {
  ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function toWorld(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left - width / 2 - camera.x) / scale + W / 2,
    y: (e.clientY - r.top - height / 2 - camera.y) / scale + H / 2,
  };
}
function pickResident(point) {
  return [...state.people].filter(p => state.motion[p.id]).sort((a, b) =>
    state.motion[b.id].y - state.motion[a.id].y).find(person => {
    const m = state.motion[person.id];
    const atStation = m.locationId === person.locationId &&
      worldDistance(m, {x: m.finalX ?? m.x, y: m.finalY ?? m.y}) < 1.5;
    const inside = buildings.find(b => b.id === person.locationId);
    if (!interiors && atStation && inside && !encounterFor(state,person.id) && !['square', 'graveyard'].includes(inside.type)) return false;
    const r = characterBounds(person, atStation ? m.pose : 'idle');
    const dx = point.x - m.x * W / 100, dy = point.y - m.y * H / 100;
    const pad = Math.max(0, 4 / scale - 1);
    return dx >= r.left - pad && dx <= r.right + pad && dy >= r.top - pad && dy <= r.bottom + pad;
  });
}
function constrain() {
  const limitX = Math.max(0, (W * scale - width) / 2) + width * 0.15;
  const limitY = Math.max(0, (H * scale - height) / 2) + height * 0.15;
  camera.x = clamp(camera.x, -limitX, limitX);
  camera.y = clamp(camera.y, -limitY, limitY);
}
export function zoomWorld(delta) {
  camera.zoom = clamp(camera.zoom * delta, 0.7, 8);
  resize();
}
export function resetCamera() {
  stopFollowing();
  focusedBuilding = null;
  camera.x = camera.y = 0;
  resize();
  camera.zoom = width < 600 ? 2.8 : 1;
  resize();
}
export function cancelConstruction() {
  if (state) state.buildMode = null;
  document.querySelector('#constructionBar').hidden = true;
  if (canvas) canvas.style.cursor = '';
}
export function startConstruction(type) {
  if (!state || !Object.hasOwn(buildCatalog, type)) return false;
  const suggested = suggestedPlacement(type, buildings);
  if (!suggested) return false;
  resetCamera();
  state.buildMode = suggested;
  if (width < 600) {
    camera.zoom = 3;
    resize();
    centerPlacement();
  }
  canvas.style.cursor = 'crosshair';
  canvas.focus();
  updateConstructionUI();
  return true;
}
export function findConstructionLot() {
  if (!state?.buildMode) return;
  const suggested = suggestedPlacement(state.buildMode.type, buildings);
  if (suggested) { state.buildMode = suggested; centerPlacement(); }
  updateConstructionUI();
}
function centerPlacement() {
  const p = toPixels(state.buildMode);
  camera.x = (W / 2 - p.x) * scale;
  camera.y = (H / 2 - p.y) * scale;
  constrain();
}
function updateConstructionUI() {
  const bar = document.querySelector('#constructionBar');
  if (!bar) return;
  const mode = state?.buildMode;
  bar.hidden = !mode;
  if (!mode) return;
  // Recheck against live expansion, including homes built by residents.
  Object.assign(mode, previewPlacement(mode.type, toPixels(mode), buildings));
  const name = document.querySelector('#constructionName'), status = document.querySelector('#constructionStatus');
  const title = `Place ${buildCatalog[mode.type].label.toLowerCase()}`;
  const message = mode.issue ? placementMessages[mode.issue] : 'Clear lot · ready to build';
  if (name.textContent !== title) name.textContent = title;
  if (status.textContent !== message) status.textContent = message;
  document.querySelector('#confirmConstruction').disabled = !!mode.issue;
  bar.dataset.valid = String(!mode.issue);
}
export function followResident(id) {
  if (!state?.people.some((p) => p.id === id && p.alive)) return;
  state.followId = id;
  focusedBuilding = null;
  interiors = true;
  const control=document.querySelector('#toggleInteriors');
  if(control) {control.checked=true;control.setAttribute('aria-pressed','true');}
  resize(); // Read the current playfield after closing a drawer.
  const desiredScale = width < 600 ? 1.45 : 2.4;
  camera.zoom = clamp(desiredScale / Math.min(width / W, height / H), 1, 8);
  resize();
  const m=state.motion[id];
  if(m) {
    camera.x=(W/2-m.x*W/100)*scale;
    camera.y=(H/2-m.y*H/100)*scale;
    constrain();
  }
}
export function stopFollowing() {
  if (state) state.followId = null;
}
export function locateResident(id) {
  followResident(id);
  stopFollowing();
}
export function focusBuilding(id) {
  stopFollowing();
  const b = buildings.find((b) => b.id === id);
  if (!b || !canvas) return;
  focusedBuilding = id;
  const [w, h] = roomSize(b);
  const base = Math.min(width / W, height / H);
  camera.zoom = clamp(
    Math.min(width / (w + 145), height / (h + 145)) / base,
    1.3,
    6,
  );
  scale = base * camera.zoom;
  camera.x = (W / 2 - (b.x * W) / 100) * scale;
  camera.y = (H / 2 - (b.y * H) / 100) * scale;
  constrain();
}
export function toggleInteriors() {
  interiors = !interiors;
  return interiors;
}
export function toggleLabels() {
  labels = !labels;
  return labels;
}
function resize(fitFocused = false) {
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  width = r.width;
  height = r.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  scale = Math.min(width / W, height / H) * camera.zoom;
  if (fitFocused && focusedBuilding) { focusBuilding(focusedBuilding); return; }
  constrain();
}
export function mountWorld(container, currentState, onSelect, handlers = {}) {
  state = currentState;
  select = onSelect;
  actions = handlers;
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.id = "worldCanvas";
  canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-label",
    "Top-down town. Drag to pan, plus and minus to zoom. Click a resident to follow them, or choose one in Residents. Open their Profile for details. Drag to stop following. When building, click a lot or use arrow keys to move the preview, then Enter to confirm. Escape cancels.",
  );
  container.replaceChildren(canvas);
  ctx = canvas.getContext("2d");
  if (canvas.getBoundingClientRect().width < 600) camera.zoom = 2.8;
  new ResizeObserver(() => resize(true)).observe(container);
  resize();
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoomWorld(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    },
    { passive: false },
  );
  canvas.addEventListener("pointerdown", (e) => {
    if (
      !document.querySelector("#eventModal").hidden ||
      !document.querySelector("#friendModal").hidden
    )
      return;
    drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      if (!drag.panning && Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<7) return;
      if (!drag.panning) {
        drag.panning=true;
        focusedBuilding = null;
        stopFollowing();
      }
      camera.x += e.clientX - drag.x;
      camera.y += e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      constrain();
    } else {
      const p = toWorld(e);
      hoveredPerson = pickResident(p)?.id;
      hovered = buildings.find(
        (b) =>
          Math.abs((b.x * W) / 100 - p.x) < roomSize(b)[0] / 2 &&
          Math.abs((b.y * H) / 100 - p.y) < roomSize(b)[1] / 2,
      )?.id;
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (
      drag && !drag.panning &&
      Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 7
    ) {
      const p = toWorld(e);
      if (state.buildMode) {
        state.buildMode = previewPlacement(state.buildMode.type, p, buildings);
        updateConstructionUI();
        drag = null;
        return;
      }
      const closest = pickResident(p);
      if (closest) select(closest.id);
      else {
        const b = [...buildings].reverse().find((b) => {
          const [w, h] = roomSize(b);
          return (
            Math.abs((b.x * W) / 100 - p.x) < w / 2 &&
            Math.abs((b.y * H) / 100 - p.y) < h / 2
          );
        });
        if (b) { focusBuilding(b.id); actions.inspect?.(b.id); }
      }
    }
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  canvas.addEventListener("keydown", (e) => {
    if (state.buildMode && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
      e.preventDefault();
      if (e.key === 'Escape') cancelConstruction();
      else if (e.key === 'Enter') actions.build?.();
      else {
        const point = toPixels(state.buildMode), amount = e.shiftKey ? 50 : 10;
        if (e.key === 'ArrowLeft') point.x -= amount;
        if (e.key === 'ArrowRight') point.x += amount;
        if (e.key === 'ArrowUp') point.y -= amount;
        if (e.key === 'ArrowDown') point.y += amount;
        state.buildMode = previewPlacement(state.buildMode.type, point, buildings);
        centerPlacement();
        updateConstructionUI();
      }
      return;
    }
    if (
      [
        "+",
        "=",
        "-",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
      ].includes(e.key)
    ) {
      e.preventDefault();
      if (e.key.startsWith("Arrow")) stopFollowing();
      if (e.key === "+" || e.key === "=") zoomWorld(1.2);
      if (e.key === "-") zoomWorld(1 / 1.2);
      if (e.key === "Home") resetCamera();
      if (e.key === "ArrowLeft") camera.x += 40;
      if (e.key === "ArrowRight") camera.x -= 40;
      if (e.key === "ArrowUp") camera.y += 40;
      if (e.key === "ArrowDown") camera.y -= 40;
      constrain();
    }
  });
}
function building(b) {
  ctx.save();
  ctx.translate((b.x * W) / 100, (b.y * H) / 100);
  if (["square", "graveyard"].includes(b.type)) drawPublicSpace(ctx, b);
  else if (interiors) drawRoom(ctx, b);
  else drawExterior(ctx, b);
  ctx.restore();
}
function buildingLabels() {
  const size = 10 / Math.max(0.8, scale),
    padding = 5 / Math.max(0.8, scale);
  for (const b of buildings) {
    if (!(
      (labels && (!focusedBuilding || focusedBuilding === b.id)) ||
      hovered === b.id
    ))
      continue;
    const x = (b.x * W) / 100,
      y = (b.y * H) / 100 + roomSize(b)[1] / 2 + 23;
    ctx.font = `600 ${size}px Inter,system-ui,sans-serif`;
    const tw = ctx.measureText(b.name).width;
    rounded(
      ctx,
      x - tw / 2 - padding,
      y - size,
      tw + padding * 2,
      size + padding * 1.6,
      3 / Math.max(0.8, scale),
      "#f4f6edee",
      "#8fa9a155",
      0.5,
    );
    text(ctx, b.name, x, y + padding * 0.2, size, "#3f5c5d", 600);
  }
}
function drawConstruction() {
  if (!state.buildMode) return;
  const mode = state.buildMode, p = toPixels(mode), bounds = buildingBounds(mode, 12);
  const color = mode.issue ? '#ba5349' : '#267b64';
  ctx.save();
  ctx.globalAlpha = .72;
  building({ ...mode, id: 'construction-preview', name: `New ${buildCatalog[mode.type].label}` });
  ctx.globalAlpha = 1;
  rounded(ctx, bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top, 5, mode.issue ? '#ce5b4926' : '#2d9f7526');
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / scale;
  ctx.setLineDash([7 / scale, 4 / scale]);
  ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.setLineDash([]);
  const size = 11 / Math.max(.8, scale);
  rounded(ctx, p.x - 60 / scale, bounds.top - 27 / scale, 120 / scale, 21 / scale, 5 / scale, color);
  text(ctx, mode.issue ? 'Choose another lot' : 'Clear lot', p.x, bounds.top - 12 / scale, size, '#fff', 650);
  ctx.restore();
}
export function drawWorld(frameAt) {
  if (!ctx || !width || !height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (state.followId) {
    const person = state.people.find((p) => p.id === state.followId && p.alive),
      m = state.motion[state.followId];
    if (!person || !m) stopFollowing();
    else {
      camera.x += ((W / 2 - (m.x * W) / 100) * scale - camera.x) * 0.2;
      camera.y += ((H / 2 - (m.y * H) / 100) * scale - camera.y) * 0.2;
      constrain();
    }
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rect(0, 0, width, height, "#a9bea0");
  ctx.translate(width / 2 + camera.x, height / 2 + camera.y);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -H / 2);
  const key = [
    interiors,
    buildings.map((b) => `${b.id}:${b.x}:${b.y}:${b.interiorStyle || "willow"}`).join(";"),
  ].join("|");
  const cacheScale = 2;
  if (!sceneryCache || sceneryKey !== key) {
    sceneryCache ??= document.createElement("canvas");
    sceneryCache.width = W * cacheScale;
    sceneryCache.height = H * cacheScale;
    const displayContext = ctx;
    ctx = sceneryCache.getContext("2d");
    ctx.scale(cacheScale, cacheScale);
    drawEnvironment(ctx, buildings);
    for (const b of [...buildings].sort((a, b) => a.y - b.y))
      building(b);
    ctx = displayContext;
    sceneryKey = key;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sceneryCache, 0, 0, W, H);
  const focused = buildings.find((b) => b.id === focusedBuilding);
  if (focused) building(focused);
  buildingLabels();
  const followedMotion = state.motion[state.followId];
  if (followedMotion?.route?.length) {
    ctx.save();
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.strokeStyle = "#537c7999";
    ctx.lineWidth = 2 / scale;
    ctx.beginPath();
    ctx.moveTo((followedMotion.x * W) / 100, (followedMotion.y * H) / 100);
    for (const p of followedMotion.route)
      ctx.lineTo((p.x * W) / 100, (p.y * H) / 100);
    ctx.stroke();
    ctx.restore();
  }
  if (interiors)
    for (const p of state.people) {
      if (!p.serviceTask?.startsWith("Cooking")) continue;
      const b = buildings.find((b) => b.id === p.locationId);
      if (!b) continue;
      for (let i = 0; i < 3; i++) {
        const phase = ((state.activitySeconds || 0) * 1.1 + i * 0.33) % 1;
        ellipse(
          (b.x * W) / 100 - 81 + i * 5,
          (b.y * H) / 100 - 66 - phase * 20,
          2 + phase * 2,
          2 + phase * 2,
          `rgba(237,233,209,${0.55 - phase * 0.5})`,
        );
      }
    }
  const residents = state.people.filter(p => state.motion[p.id]).map(p => {
    const m = state.motion[p.id];
    const atStation = m.locationId === p.locationId &&
      worldDistance(m, {x: m.finalX ?? m.x, y: m.finalY ?? m.y}) < 1.5;
    const combat = crimeDirective(state,p);
    const moving = state.running && m.moved && !atStation &&
      !['confront','aftermath'].includes(combat?.encounter.phase);
    return { person: p, m, combat, x: m.x * W / 100, y: m.y * H / 100, atStation,
      moving, pose: combat ? combat.target.pose : atStation ? m.pose : 'idle',
      facing: moving ? m.facing || 'south' : combat?.target.facing || m.stationFacing || 'south' };
  }).sort((a, b) => a.y - b.y);
  const roomResidents = new Map(buildings.map(b => [b.id, []]));
  const roomById = new Map(buildings.map(b => [b.id, b]));
  for (const r of residents) {
    const b = roomById.get(r.person.locationId);
    if (b) roomResidents.get(b.id).push({...r, x: r.x - b.x * W / 100, y: r.y - b.y * H / 100});
  }
  if (interiors) for (const b of buildings) {
    ctx.save(); ctx.translate(b.x * W / 100, b.y * H / 100);
    drawRoomActivity(ctx, b, roomResidents.get(b.id), state.activitySeconds || 0, state.hour);
    ctx.restore();
  }
  const furnitureLayers = interiors ? buildings.filter(b => b.type === 'restaurant').flatMap(b => [
    { b, y: b.y * H / 100 + 6, draw: () => drawCafeCounter(ctx, roomResidents.get(b.id).filter(r => r.person.mealOrder?.stage === "ready").length) },
    { b, y: b.y * H / 100 + 49, draw: () => cafe.tables.forEach(t => drawCafeTabletop(ctx, t)) },
  ]).sort((a, b) => a.y - b.y) : [];
  let furnitureIndex = 0;
  function paintFurnitureUntil(y) {
    while (furnitureIndex < furnitureLayers.length && furnitureLayers[furnitureIndex].y <= y) {
      const layer = furnitureLayers[furnitureIndex++];
      ctx.save(); ctx.translate(layer.b.x * W / 100, layer.b.y * H / 100);
      layer.draw(); ctx.restore();
    }
  }
  for (const resident of residents) {
    const { person: p, m, combat, x, y, atStation, moving, pose, facing } = resident;
    paintFurnitureUntil(y);
    const selected = p.id === state.selectedId;
    const inside = buildings.find(b => b.id === p.locationId);
    if (pose === 'talking' && !moving) {
      const partner = residents.find(r => r.person.id !== p.id && r.pose === 'talking' && Math.hypot(r.x-x,r.y-y)<55);
      if(partner) resident.facing = partner.x > x ? 'east' : 'west';
    }
    if (!interiors && inside && atStation && !combat && !['square', 'graveyard'].includes(inside.type)) continue;
    drawCharacter(ctx, p, x, y, {
      selected,
      moving,
      gaitPhase: m.gaitPhase,
      running: moving && travelMode(p) === "run",
      flashlight: !combat && !!patrolBeam(p,m,state,buildings),
      masked: combat?.masked,
      weapon: combat?.weapon,
      firing: combat?.encounter.shotBy===p.id && shotPulse(combat.encounter),
      pose,
      facing: resident.facing,
      time: state.activitySeconds || 0,
    });
    if (selected || p.id === hoveredPerson) {
      const text = selected
        ? `${p.name} · ${residentActivity(state,p)}`
        : residentActivity(state,p);
      const headTop = characterBounds(p, pose).top - 5 - (combat ? 25 : 0);
      const size = 12 / Math.max(1, scale),
        pad = 4 / Math.max(1, scale);
      ctx.font = `600 ${size}px Inter, system-ui`;
      const tw = ctx.measureText(text).width;
      rect(
        x - tw / 2 - pad,
        y + headTop - size,
        tw + pad * 2,
        size + pad * 2,
        "#243d32ed",
      );
      label(text, x, y + headTop + pad, "#f2e7c2", size);
    }
    const speech = state.speech[p.id];
    if (speech && speech.expiresAt < frameAt) delete state.speech[p.id];
    else if (speech && selected) {
      const words = speech.text.slice(0, 62);
      ctx.font = "12px sans-serif";
      const tw = ctx.measureText(words).width;
      rect(x - tw / 2 - 8, y - 60, tw + 16, 23, "#faf1dbeF");
      label(words, x, y - 44, "#30473c", 12);
    }
  }
  paintFurnitureUntil(Infinity);
  if (interiors) for (const b of buildings) {
    ctx.save(); ctx.translate(b.x * W / 100, b.y * H / 100);
    drawRoomForeground(ctx, b, roomResidents.get(b.id));
    ctx.restore();
  }
  if (interiors)
    for (const p of state.people) {
      const order = p.mealOrder;
      if (!order || !["served", "eating"].includes(order.stage)) continue;
      const b = buildings.find((b) => b.id === p.locationId),
        m = state.motion[p.id];
      if (!b || !m) continue;
      const x = (m.x * W) / 100,
        y = (m.y * H) / 100;
      if (order.stage === "eating") {
        const sx = (b.x * W) / 100 + [-75, -75, -20, -20, 30, 30][order.seat];
        ellipse(sx, y - 3, 7, 5, "#e8e3cd");
        ellipse(sx, y - 4, 4, 3, "#ab8854");
        rect(sx + 2, y - 6, 2, 4, "#6c8a50");
      }
    }
  drawLighting(ctx, state, buildings);
  drawCrimeEffects(ctx,state);
  updateConstructionUI();
  drawConstruction();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (frameAt - inspectorUpdatedAt > 500) {
    inspectorUpdatedAt = frameAt;
    const drawer = document.querySelector('#drawer');
    if (!drawer.hidden && drawer.dataset.open === 'building') actions.refreshInspector?.();
  }
  const card = document.querySelector("#followCard");
  if (card) {
    const person = state.people.find((p) => p.id === state.followId && p.alive);
    card.hidden = !person;
    if (person) {
      const name = document.querySelector("#followName"),
        action = document.querySelector("#followAction");
      name.textContent = person.name;
      action.textContent = residentActivity(state,person);
      const order = person.mealOrder;
      const duration =
        {
          walking: 0,
          queued: 1.3,
          cooking: 3.5,
          ready: 1.2,
          served: 0,
          eating: 5,
        }[order?.stage] || 0;
      const progress = document.querySelector("#followProgress");
      progress.hidden = !duration;
      progress.value = duration ? Math.min(1, order.elapsed / duration) : 0;
      document.querySelector("#followNeeds").textContent =
        `Hunger ${Math.round(person.hunger)}% · Energy ${Math.round(person.energy)}% · Happiness ${Math.round(person.happiness)}%`;
    }
  }
  const pulse = document.querySelector("#townPulse");
  if (pulse) {
    const event = state.recentEvents?.[0];
    pulse.hidden = !event;
    if (event) {
      const text = `${event.stamp} · ${event.title}`;
      if (pulse.textContent !== text) pulse.textContent = text;
    }
  }
  const liveActivity = document.querySelector("#liveActivity");
  const selectedPerson = state.people.find((p) => p.id === state.selectedId);
  if (liveActivity && selectedPerson) {
    const text = residentActivity(state,selectedPerson);
    if (liveActivity.textContent !== text) liveActivity.textContent = text;
  }
  const focus = document.querySelector("#placeFocus");
  if (focus) {
    const b = buildings.find((b) => b.id === focusedBuilding);
    focus.hidden = !b;
    if (b) {
      const [w, h] = roomSize(b);
      const present = state.people.filter((p) => {
        const m = state.motion[p.id];
        return (
          p.alive &&
          m &&
          Math.abs(((m.x - b.x) * W) / 100) < w / 2 &&
          Math.abs(((m.y - b.y) * H) / 100) < h / 2
        );
      });
      const incoming = state.people.filter(
        (p) => p.alive && p.locationId === b.id && p.status !== 'On Patrol' && !present.includes(p),
      ).length;
      const orders = state.people.filter(
        (p) => p.alive && p.locationId === b.id && p.mealOrder,
      ).length;
      const text = `${b.name} · ${present.length} inside${incoming ? " · " + incoming + " approaching" : ""}${b.type === "restaurant" ? " · " + orders + " orders" : ""}`;
      if (focus.textContent !== text) focus.textContent = text;
    }
  }
  const notice = document.querySelector("#townNotice");
  if (notice) {
    notice.hidden = !state.notice || state.notice.until < performance.now();
    if (!notice.hidden) notice.textContent = state.notice.text;
  }
  const zoom = document.querySelector("#zoomLevel");
  if (zoom) zoom.textContent = `${Math.round(camera.zoom * 100)}%`;
}
