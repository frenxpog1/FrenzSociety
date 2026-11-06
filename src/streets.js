import { landscapePlots, plotBounds, drawLandscapePlots, drawRiverDetails, drawStreetDetails } from "./map-details.js";
import { WORLD, roomSize } from "./spaces.js";
import { STREETS, buildingBounds, streetDistance, toPixels } from "./layout.js";
import { entrancePaths } from "./navigation.js";
import { rounded, oval, stroke, gradient, shadow, text } from "./paint.js";
const { width: W, height: H } = WORLD;
function noise(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export function drawTree(ctx, x, y, r = 20) {
  oval(ctx, x + 9, y + 12, r * 1.1, r * 0.65, "#294d3b20");
  stroke(
    ctx,
    [
      [x, y + 10],
      [x, y - 8],
    ],
    "#817966",
    3,
  );
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r);
  g.addColorStop(0, "#8fb686");
  g.addColorStop(0.55, "#65996f");
  g.addColorStop(1, "#4c7c62");
  shadow(ctx, () => {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = i / 16 * Math.PI * 2;
      const radius = r * (.92 + .09 * Math.sin(i * 2.4 + x * .02));
      const px = x + Math.cos(a) * radius, py = y - 6 + Math.sin(a) * radius * .88;
      if (i === 0) ctx.moveTo(px, py);
      else {
        const mid = a - Math.PI / 16;
        ctx.quadraticCurveTo(x + Math.cos(mid) * r * 1.06, y - 6 + Math.sin(mid) * r * .98, px, py);
      }
    }
    ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  }, 5, 3, .13);
  stroke(ctx, [[x, y + 7], [x - 3, y + 1], [x - 7, y - 2]], '#5c785744', 1.2);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7;
    oval(
      ctx,
      x + Math.cos(a) * r * 0.42,
      y - 8 + Math.sin(a) * r * 0.32,
      r * 0.42,
      r * 0.35,
      i % 2 ? "#78a17b33" : "#a6c59a33",
    );
  }
}
function car(ctx, x, y, rotation, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  shadow(
    ctx,
    () => rounded(ctx, -11, -22, 22, 44, 7, color, "#31464c33", 0.7),
    6,
    3,
    0.23,
  );
  rounded(
    ctx,
    -8,
    -12,
    16,
    23,
    5,
    gradient(ctx, -8, -12, 16, 23, "#b8d5da", "#486a79"),
  );
  rounded(ctx, -8, -9, 16, 17, 4, color);
  stroke(
    ctx,
    [
      [-7, 0],
      [7, 0],
    ],
    "#ffffff35",
    0.7,
  );
  rounded(ctx, -12, -8, 3, 5, 1, color);
  rounded(ctx, 9, -8, 3, 5, 1, color);
  rounded(ctx, -8, -20, 5, 2, 1, "#f8edcb");
  rounded(ctx, 3, -20, 5, 2, 1, "#f8edcb");
  rounded(ctx, -8, 18, 4, 2, 1, "#c77f74");
  rounded(ctx, 4, 18, 4, 2, 1, "#c77f74");
  ctx.restore();
}
function intersectionNear(x, y, margin) {
  return (
    STREETS.vertical.some((v) => Math.abs(x - v) < margin) &&
    STREETS.horizontal.some((h) => Math.abs(y - h) < margin)
  );
}
function roadSurface(ctx) {
  // Union all pavement first, then curbs, then asphalt. Intersections remain open.
  for (const [width, color] of [
    [108, "#d6ddda"],
    [70, "#edf0e8"],
    [60, "#56626c"],
  ]) {
    for (const y of STREETS.horizontal)
      rounded(ctx, 0, y - width / 2, W, width, 0, color);
    for (const x of STREETS.vertical)
      rounded(ctx, x - width / 2, 0, width, H, 0, color);
  }
  // Fine aggregate is deliberately subtle, rather than a visible pixel texture.
  for (let i = 0; i < 3000; i++) {
    const x = noise(i * 3) * W,
      y = noise(i * 3 + 1) * H;
    if (streetDistance(x, y) < 29)
      oval(ctx, x, y, 0.35, 0.35, i % 2 ? "#ffffff0a" : "#15283510");
  }
  for (const y of STREETS.horizontal) {
    for (let x = 14; x < W; x += 28) {
      if (STREETS.vertical.some((v) => Math.abs(x - v) < 104)) continue;
      stroke(
        ctx,
        [
          [x, y],
          [x + 12, y],
        ],
        "#ded7b2",
        1.1,
      );
    }
    for (let x = 0; x < W; x += 24) {
      if (STREETS.vertical.some((v) => Math.abs(x - v) < 56)) continue;
      for (const d of [-1, 1])
        stroke(
          ctx,
          [
            [x, y + d * 36],
            [x, y + d * 53],
          ],
          "#aab9b544",
          0.6,
        );
    }
    for (const d of [-1, 1])
      for (let x = 6; x < W; x += 28) {
        if (STREETS.vertical.some((v) => Math.abs(x - v) < 105)) continue;
        stroke(
          ctx,
          [
            [x, y + d * 27],
            [x + 23, y + d * 27],
          ],
          "#e8ede680",
          0.8,
        );
      }
  }
  for (const x of STREETS.vertical) {
    for (let y = 10; y < H; y += 28) {
      if (STREETS.horizontal.some((v) => Math.abs(y - v) < 104)) continue;
      stroke(
        ctx,
        [
          [x, y],
          [x, y + 12],
        ],
        "#ded7b2",
        1.1,
      );
    }
    for (let y = 0; y < H; y += 24) {
      if (STREETS.horizontal.some((v) => Math.abs(y - v) < 56)) continue;
      for (const d of [-1, 1])
        stroke(
          ctx,
          [
            [x + d * 36, y],
            [x + d * 53, y],
          ],
          "#aab9b544",
          0.6,
        );
    }
    for (const d of [-1, 1])
      for (let y = 4; y < H; y += 28) {
        if (STREETS.horizontal.some((v) => Math.abs(y - v) < 105)) continue;
        stroke(
          ctx,
          [
            [x + d * 27, y],
            [x + d * 27, y + 23],
          ],
          "#e8ede680",
          0.8,
        );
      }
  }
  for (const x of STREETS.vertical)
    for (const y of STREETS.horizontal) {
      // Zebra crossings sit outside the junction, aligned with pedestrian routes.
      for (const side of [-1, 1]) {
        const xx = x + side * 76,
          yy = y + side * 76;
        for (let k = -24; k <= 24; k += 8) {
          rounded(ctx, xx - 10, y + k - 2, 20, 4, 1, "#f5f5ea");
          rounded(ctx, x + k - 2, yy - 10, 4, 20, 1, "#f5f5ea");
        }
        stroke(
          ctx,
          [
            [x - 25, yy + side * 16],
            [x + 25, yy + side * 16],
          ],
          "#d4ded4",
          2,
        );
        stroke(
          ctx,
          [
            [xx + side * 16, y - 25],
            [xx + side * 16, y + 25],
          ],
          "#d4ded4",
          2,
        );
      }
      for (const dx of [-1, 1])
        for (const dy of [-1, 1]) {
          // Rounded corner planting replaces square junction edges.
          rounded(ctx, x + dx * 44 - 6, y + dy * 44 - 6, 12, 12, 4, "#afbca8");
          rounded(ctx, x + dx * 44 - 3, y + dy * 44 - 3, 6, 6, 2, "#688d74");
          const px = x + dx * 51,
            py = y + dy * 51;
          oval(ctx, px + 2, py + 3, 3, 2, "#263e4d22");
          stroke(
            ctx,
            [
              [px, py + 3],
              [px, py - 12],
            ],
            "#50626a",
            1.6,
          );
          rounded(ctx, px - 2, py - 14, 4, 9, 1.3, "#34464e");
          oval(ctx, px, py - 11, 1, 1, dx === dy ? "#8dc5a0" : "#dd9a8b");
        }
    }
}
export function drawEnvironment(ctx, buildings) {
  rounded(ctx, 0, 0, W, H, 0, gradient(ctx, 0, 0, W, H, "#aec4a0", "#91b497"));
  for (let i = 0; i < 60; i++) {
    const x = noise(i * 4) * W,
      y = noise(i * 4 + 1) * H;
    oval(
      ctx,
      x,
      y,
      40 + noise(i * 4 + 2) * 80,
      22 + noise(i * 4 + 3) * 60,
      "#d0dcc41a",
    );
  }
  // Soft riverbank and water, with smooth bezier banks.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(76, 0);
  ctx.bezierCurveTo(95, 300, 55, 370, 73, 600);
  ctx.bezierCurveTo(104, 900, 46, 1110, 77, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = "#d0d7b3";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(65, 0);
  ctx.bezierCurveTo(84, 300, 44, 370, 62, 600);
  ctx.bezierCurveTo(93, 900, 35, 1110, 66, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, 0, 0, 70, H, "#78b5bd", "#649da8");
  ctx.fill();
  for (let i = 0; i < 30; i++) {
    const x = 12 + noise(i) * 30,
      y = i * 49;
    stroke(
      ctx,
      [
        [x, y],
        [x + 19, y],
      ],
      "#d9f0e533",
      1,
    );
  }
  drawRiverDetails(ctx);
  const entrances = entrancePaths(buildings);
  const plots = landscapePlots(buildings, entrances);
  drawLandscapePlots(ctx, plots);
  // Door-to-sidewalk routes use the same obstacle-aware planner as residents.
  for (const { building, points } of entrances) {
    if (!points.length) continue;
    const b = toPixels(building),
      edgeY = b.y + roomSize(building)[1] / 2;
    const path = [[b.x, edgeY], ...points.map((p) => [p.x, p.y])];
    stroke(ctx, path, "#7f9f8544", 16);
    stroke(ctx, path, "#d4d7ca", 12);
    stroke(ctx, path, "#e6e6db80", 9);
  }
  roadSurface(ctx);
  drawStreetDetails(ctx);
  for (const y of STREETS.horizontal) {
    for (const dy of [-1, 1]) {
      stroke(
        ctx,
        [
          [0, y + dy * 40],
          [70, y + dy * 40],
        ],
        "#eef0de",
        2,
      );
      stroke(
        ctx,
        [
          [0, y + dy * 47],
          [70, y + dy * 47],
        ],
        "#637e7b",
        2,
      );
    }
  }
  // Street furniture and planted canopies are excluded from building footprints.
  for (let i = 0; i < 190; i++) {
    const x = 110 + noise(i * 5) * (W - 140),
      y = 45 + noise(i * 5 + 1) * (H - 90),
      r = 12 + noise(i * 5 + 2) * 11;
    if (
      streetDistance(x, y) < 68 ||
      plots.some(plot => { const p = plotBounds(plot); return x+r > p.left && x-r < p.right && y+r > p.top && y-r < p.bottom; }) ||
      buildings.some((b) => {
        const p = buildingBounds(b, 30);
        return x > p.left && x < p.right && y > p.top && y < p.bottom;
      })
    )
      continue;
    drawTree(ctx, x, y, r);
  }
  for (const y of STREETS.horizontal)
    for (let x = 150; x < W - 80; x += 270) {
      if (intersectionNear(x, y, 130)) continue;
      const yy = y - 45;
      stroke(
        ctx,
        [
          [x, yy + 4],
          [x, yy - 15],
          [x + 9, yy - 15],
        ],
        "#5c7175",
        1.5,
      );
      rounded(ctx, x + 5, yy - 17, 10, 3, 1.4, "#e4e8df");
      oval(ctx, x + 8, yy + 3, 9, 3, "#3e5b4730");
      rounded(ctx, x + 44, y + 40, 20, 8, 2, "#8b9d93");
      stroke(
        ctx,
        [
          [x + 45, y + 42],
          [x + 63, y + 42],
        ],
        "#c2cbc0",
        1,
      );
    }
  const parked = [
    [220, 448, Math.PI / 2, "#e5dfcf"],
    [530, 492, Math.PI / 2, "#547d8c"],
    [1110, 448, Math.PI / 2, "#d2dadd"],
    [1760, 492, Math.PI / 2, "#ba8172"],
    [420, 952, Math.PI / 2, "#8fada2"],
    [1140, 908, Math.PI / 2, "#e9e6dd"],
    [1700, 952, Math.PI / 2, "#647783"],
  ];
  for (const p of parked) car(ctx, ...p);
  text(
    ctx,
    "WILLOW AVENUE",
    1190,
    STREETS.horizontal[0] + 4,
    6.5,
    "#dde4dd70",
    500,
  );
  text(
    ctx,
    "PARK STREET",
    560,
    STREETS.horizontal[1] + 4,
    6.5,
    "#dde4dd70",
    500,
  );
}
