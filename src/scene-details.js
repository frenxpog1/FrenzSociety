import { rounded, oval, stroke, gradient, text, plant } from './paint.js';
import { roomSize, deskSlots, cafe } from './spaces.js';

function book(ctx, x, y, color, w = 6, h = 9) {
  rounded(ctx, x, y, w, h, .6, color);
  stroke(ctx, [[x + 1.3, y + 1], [x + 1.3, y + h - 1]], '#ffffff70', .6);
  stroke(ctx, [[x + 2.6, y + 2], [x + w - 1, y + 2]], '#ffffff90', .55);
}
function frame(ctx, x, y, color) {
  rounded(ctx, x, y, 12, 10, .6, '#9a8c75');
  rounded(ctx, x + 1, y + 1, 10, 8, .3, '#f0e9d8');
  oval(ctx, x + 8, y + 3, 1.3, 1.3, '#ceab78');
  ctx.beginPath(); ctx.moveTo(x + 2, y + 8); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x + 10, y + 8);
  ctx.fillStyle = color; ctx.fill();
}
function planter(ctx, x, y) {
  rounded(ctx, x - 8, y - 1, 16, 6, 1, '#a8b5ab');
  rounded(ctx, x - 9, y - 2, 18, 3, 1, '#d5dace');
  for (let i = 0; i < 5; i++) {
    const xx = x - 6 + i * 3;
    stroke(ctx, [[xx, y], [xx + .5, y - 4 - i % 2]], '#65826a', .8);
    oval(ctx, xx + .5, y - 5 - i % 2, 1.9, 1.5, i % 2 ? '#eee0b9' : '#b99083');
  }
}
export function drawRoomDecor(ctx, b) {
  const [w, h] = roomSize(b), top = -h / 2;
  // Small entry mats make the shared navigation doorway visually identifiable.
  rounded(ctx, -14, h / 2 - 14, 28, 8, 1, b.type === 'restaurant' ? '#788b78' : '#839b8d');
  for (let i = 0; i < 4; i++) stroke(ctx, [[-11 + i * 7, h / 2 - 12], [-11 + i * 7, h / 2 - 8]], '#dce2d640', .6);
  if (b.type === 'office' || b.type === 'police') {
    const slots = deskSlots(b);
    for (const [i, slot] of slots.entries()) {
      const x = slot.x, y = slot.y - 20;
      // Desk blotter, page corners, pen and a memo sit clear of keyboard and mouse.
      book(ctx, x + 12, y + 6, ['#81968f', '#9a8696', '#ac8f6d'][i % 3], 7, 5);
      stroke(ctx, [[x + 9, y + 5], [x + 8, y + 9]], '#536d74', .65);
      rounded(ctx, x - 20, y - 10, 5, 4, .25, '#e3cd8e');
      stroke(ctx, [[x - 19, y - 8], [x - 16, y - 8]], '#9c936b', .4);
      // Monitor cable tucks under the back edge rather than across the aisle.
      stroke(ctx, [[x + 2, y + 11], [x + 3, y + 15], [x + 10, y + 15]], '#778b8955', .6);
    }
    const xx = w / 2 - 18;
    rounded(ctx, xx - 6, 1, 12, 23, 1.2, '#e3e8df', '#a1b1aa', .5);
    rounded(ctx, xx - 4, 4, 8, 5, .5, '#c2d4cc');
    for (let i = 0; i < 3; i++) {
      rounded(ctx, xx - 3, 12 + i * 3, 2, 2, .2, ['#c2ad83', '#7f9b8c', '#af9390'][i]);
      stroke(ctx, [[xx, 13 + i * 3], [xx + 3, 13 + i * 3]], '#9caea5', .45);
    }
    text(ctx, 'TEAM', xx, 2, 2.8, '#718b83', 600);
  } else if (b.type === 'restaurant') {
    // A real menu at the back wall, utensils at tables, and marked queue positions.
    rounded(ctx, -26, top - 12.5, 52, 10.5, 1, '#405d57', '#b6a283', .7);
    text(ctx, 'WILLOW CAFÉ  /  LUNCH $8', 0, top - 5.5, 3.4, '#f0ebd5', 550);
    for (const t of cafe.tables) {
      rounded(ctx, t.x + 7, t.y + 3, 4, 4, .4, '#efede3');
      stroke(ctx, [[t.x + 8, t.y + 3.5], [t.x + 8, t.y + 6.5]], '#7e918b', .45);
      oval(ctx, t.x - 6, t.y - 7, 1.2, 1.7, '#ad7b65');
      oval(ctx, t.x - 2.8, t.y - 7, 1.2, 1.7, '#b5a283');
    }
    for (const q of cafe.queue.slice(1)) {
      stroke(ctx, [[q.x - 3, q.y + 4], [q.x + 3, q.y + 4]], '#9caa9550', .85);
    }
    book(ctx, 88, -59, '#a0b19a', 9, 11);
    text(ctx, 'OPEN', 21, h / 2 - 7, 3, '#5c7d6b', 650);
  } else if (b.type === 'home') {
    frame(ctx, -52, top - 11, '#839f8c');
    frame(ctx, -36, top - 11, '#8296a1');
    rounded(ctx, -54, -26, 10, 13, 1, '#baa88d');
    oval(ctx, -49, -24, 3.2, 1.6, '#e6d7b8');
    stroke(ctx, [[-49, -24], [-49, -29]], '#788d85', .8);
    rounded(ctx, -53, -33, 8, 5, 2, '#e8deca');
    book(ctx, 19, 10, '#9aac9a', 8, 5);
    oval(ctx, 39, 18, 3.3, 2.8, '#eae6d5');
    oval(ctx, 39, 17.5, 2.1, 1.7, '#c4ad82');
    rounded(ctx, 15, top + 8, 3, 4, .5, '#faf5e5');
    book(ctx, -44, 26, '#c0ab87', 7, 5);
    book(ctx, -36, 27, '#7f9c92', 6, 4);
  } else if (b.type === 'school') {
    for (const [i, s] of deskSlots(b).entries()) {
      book(ctx, s.x + 13, s.y - 21, ['#8da794', '#bb9786', '#8da4b7'][i % 3], 6, 8);
      oval(ctx, s.x + 18, s.y - 10, 1.4, 1.5, '#c5a782');
    }
    text(ctx, 'TODAY: EXPLORE · LEARN · CREATE', 0, top + 14, 3.5, '#d4e4d3', 550);
  } else if (b.type === 'hospital') {
    for (const x of [-49, 0, 49]) {
      rounded(ctx, x + 16.5, -41, 8, 7, .6, '#dde9dd');
      stroke(ctx, [[x + 17.5, -37], [x + 19, -37], [x + 20, -39], [x + 21, -35], [x + 22, -37], [x + 23, -37]], '#79a490', .55);
    }
  }
}
export function drawFrontage(ctx, b) {
  const [w, h] = roomSize(b);
  if (b.type === 'home') {
    // House number and mailbox are beside the door, outside its walking lane.
    rounded(ctx, -w / 2 + 7, h / 2 + 3, 13, 3, 1, '#91a38e');
    stroke(ctx, [[-w / 2 + 13, h / 2 + 4], [-w / 2 + 13, h / 2 + 15]], '#788f84', 1.1);
    rounded(ctx, -w / 2 + 7, h / 2 - 1, 13, 8, 2, '#5f7d78');
    rounded(ctx, -w / 2 + 9, h / 2 + 1, 9, 1, .3, '#b1c5b7');
    text(ctx, b.id.replace(/\D/g, '') || '1', -w / 2 + 13, h / 2 + 5.5, 3, '#f1ecdc', 650);
    planter(ctx, w / 2 - 17, h / 2 + 5);
  } else if (b.type === 'office' || b.type === 'school') {
    // A compact cycle stand and one bicycle make the frontage feel used.
    const x = w / 2 - 32, y = h / 2 + 10;
    for (const xx of [x - 5, x + 7]) {
      ctx.beginPath(); ctx.ellipse(xx, y, 4, 4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#637d79'; ctx.lineWidth = .9; ctx.stroke();
    }
    stroke(ctx, [[x - 5, y], [x, y - 6], [x + 3, y], [x - 5, y], [x - 1, y - 4], [x + 7, y], [x + 4, y - 8], [x + 7, y - 8]], '#a4866b', 1);
    stroke(ctx, [[x - 2, y - 6], [x + 1, y - 6]], '#3e5558', 1);
    plant(ctx, -w / 2 + 13, h / 2 + 4, .7);
  } else if (b.type === 'restaurant') {
    planter(ctx, -w / 2 + 18, h / 2 + 5);
    planter(ctx, w / 2 - 18, h / 2 + 5);
    rounded(ctx, 31, h / 2 - 3, 14, 16, 1, '#526d60', '#baa88a', 1);
    text(ctx, 'LUNCH', 38, h / 2 + 3, 3, '#eee9d2', 600);
    text(ctx, '$8', 38, h / 2 + 8, 4, '#eee9d2', 600);
    stroke(ctx, [[31, h / 2 + 12], [30, h / 2 + 15]], '#8c8975', 1);
    stroke(ctx, [[45, h / 2 + 12], [46, h / 2 + 15]], '#8c8975', 1);
  }
}
export function drawRoomActivity(ctx, b, people, time, hour) {
  if (!['office', 'school', 'restaurant', 'police'].includes(b.type)) return;
  const [w, h] = roomSize(b);
  // Clock time follows the actual town clock, including pause and time skips.
  const x = b.type === 'restaurant' ? 38 : 32, y = -h / 2 - 7;
  oval(ctx, x, y, 4.5, 4.5, '#728c86');
  oval(ctx, x, y, 3.8, 3.8, '#f5f3e6');
  const angle = hour % 12 / 12 * Math.PI * 2 - Math.PI / 2;
  stroke(ctx, [[x, y], [x + Math.cos(angle) * 2.2, y + Math.sin(angle) * 2.2]], '#5d7870', .7);
  stroke(ctx, [[x, y], [x, y - 3]], '#8c9e91', .5);
  for (const { person, x: px, y: py, atStation, pose } of people) {
    if (!atStation) continue;
    if (pose === 'typing') {
      // A blinking insertion point and work indicator appear only at occupied desks.
      if (Math.floor(time * 2) % 2 === 0) stroke(ctx, [[px + 5, py - 37], [px + 5, py - 35]], '#f8fcf3', .7);
      oval(ctx, px + 10, py - 22, .7, .6, '#8fc7b4');
    }
    if (pose === 'cooking' && person.serviceTask?.startsWith('Cooking')) {
      oval(ctx, -91, -60, 4, 2.6, '#daac6333');
      stroke(ctx, [[-94, -58], [-91, -57], [-88, -58]], '#c9955e', .7);
    }

  }
}
export function drawRoomForeground(ctx, b, people) {
  // The chair back is in front of a seated person's waist, not behind their feet.
  for (const { x, y, atStation, pose, facing } of people) {
    if (!atStation || !['typing', 'studying', 'sitting'].includes(pose) || facing !== 'north') continue;
    if (!['office', 'police', 'school'].includes(b.type)) continue;
    rounded(ctx, x - 6.5, y - 8, 13, 7.5, 2.5,
      gradient(ctx, x, y - 8, 13, 8, '#9eafa8', '#637f7b'), '#5f7775', .45);
    stroke(ctx, [[x - 4.5, y - 6], [x + 4.5, y - 6]], '#d6dfd34a', .6);
  }
}
