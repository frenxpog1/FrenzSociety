import { homeStyle } from "./home-design.js";
import { drawRoomDecor, drawFrontage } from "./scene-details.js";
import { roomSize, deskSlots, cafe } from "./spaces.js";
import {
  rounded,
  oval,
  stroke,
  gradient,
  shadow,
  text,
  plant,
} from "./paint.js";
const accents = {
  home: "#668880",
  office: "#668e9b",
  restaurant: "#bc9070",
  school: "#7d9c82",
  police: "#6688a2",
  jail: "#7b8d94",
  hospital: "#79a3a1",
  casino: "#8f82a3",
  church: "#a59a85",
};
function chair(ctx, x, y, c = "#718e8e") {
  shadow(
    ctx,
    () =>
      rounded(
        ctx,
        x - 6.8,
        y - 5,
        13.6,
        12,
        4,
        gradient(ctx, x - 6, y - 5, 13, 12, "#a8b9b0", c),
      ),
    2,
    1,
    0.15,
  );
  rounded(ctx, x - 7.2, y + 4, 14.4, 4, 2, "#476067");
  stroke(
    ctx,
    [
      [x - 4, y + 7],
      [x - 5, y + 10],
    ],
    "#58696a",
    1.1,
  );
  stroke(
    ctx,
    [
      [x + 4, y + 7],
      [x + 5, y + 10],
    ],
    "#58696a",
    1.1,
  );
}
function mug(ctx, x, y) {
  oval(ctx, x + 2, y + 2, 3.3, 2, "#445c5122");
  rounded(ctx, x - 1.6, y - 2, 4, 5, 1.4, "#f3f0e6");
  oval(ctx, x + 0.4, y - 2, 2, 1, "#b8a58e");
  ctx.beginPath();
  ctx.arc(x + 3, y, 1.7, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.strokeStyle = "#e7e7db";
  ctx.lineWidth = 1;
  ctx.stroke();
}
function monitor(ctx, x, y) {
  rounded(ctx, x - 2, y - 4, 4, 8, 1, "#708088");
  oval(ctx, x, y + 4, 7, 1.5, "#64757a");
  shadow(
    ctx,
    () => rounded(ctx, x - 13, y - 17, 26, 16, 1.8, "#344c58"),
    2,
    1,
    0.14,
  );
  rounded(
    ctx,
    x - 11.7,
    y - 15.8,
    23.4,
    12.5,
    1,
    gradient(ctx, x, y, 22, 12, "#b4d9e0", "#77acbc"),
  );
  const view = Math.abs(Math.round(x + y)) % 3;
  rounded(ctx, x - 10.7, y - 14.7, 4, 10.5, .5, "#517780");
  for (let i = 0; i < 4; i++)
    rounded(ctx, x - 9.7, y - 13.5 + i * 2, 2, .65, .2, "#cae0d8a0");
  if (view === 0) {
    rounded(ctx, x - 5.4, y - 14, 14, 9.8, .4, "#e8eee3");
    for (let i = 0; i < 4; i++)
      stroke(ctx, [[x - 3.8, y - 12.5 + i * 1.8], [x + 6 - i % 2 * 3, y - 12.5 + i * 1.8]], "#9db6ad", .55);
  } else if (view === 1) {
    for (let i = 0; i < 4; i++)
      rounded(ctx, x - 4 + i * 3, y - 7 - i % 3 * 2, 1.8, 3 + i % 3 * 2, .3, ["#d6d8ad", "#9ac5b7", "#c5d9dc"][i % 3]);
    stroke(ctx, [[x - 5, y - 4], [x + 9, y - 4]], "#e1eee4", .5);
  } else {
    for (let i = 0; i < 5; i++) {
      stroke(ctx, [[x - 4 + i % 2 * 2, y - 13.2 + i * 1.8], [x + 7 - i % 3, y - 13.2 + i * 1.8]], i % 2 ? "#d8e2c6" : "#e9f0df", .65);
    }
  }
  oval(ctx, x, y - 2, 0.6, 0.5, "#b0d0c8");
}
function desk(ctx, x, y, computer = true) {
  stroke(
    ctx,
    [
      [x - 18, y + 4],
      [x - 18, y + 14],
    ],
    "#6e7e7e",
    1.6,
  );
  stroke(
    ctx,
    [
      [x + 18, y + 4],
      [x + 18, y + 14],
    ],
    "#6e7e7e",
    1.6,
  );
  shadow(
    ctx,
    () =>
      rounded(
        ctx,
        x - 23,
        y - 13,
        46,
        24,
        3,
        gradient(ctx, x - 23, y - 13, 46, 24, "#d9c9ac", "#b6a386"),
        "#9c9d8e",
        0.6,
      ),
    3,
    2,
    0.16,
  );
  stroke(
    ctx,
    [
      [x - 21, y - 10],
      [x + 20, y - 10],
    ],
    "#f7f0d933",
    0.8,
  );
  if (computer) {
    monitor(ctx, x, y - 8);
    rounded(ctx, x - 11, y - 3, 20, 5, 1.2, "#d8dfd8", "#8c9b99", 0.4);
    for (let k = 0; k < 6; k++)
      for (let j = 0; j < 2; j++)
        rounded(
          ctx,
          x - 9 + k * 2.6,
          y - 2.2 + j * 1.6,
          1.5,
          0.9,
          0.2,
          "#879b9c",
        );
    rounded(ctx, x + 12, y - 3, 8, 8, 1, "#91a8a17a");
    oval(ctx, x + 16, y + 0.2, 1.7, 2.7, "#e2e4da");
    mug(ctx, x - 18, y + 3);
  } else {
    rounded(ctx, x - 12, y - 7, 18, 12, 1, "#e7ecdf");
    stroke(
      ctx,
      [
        [x - 10, y - 4],
        [x + 2, y - 4],
      ],
      "#aac1b1",
      0.7,
    );
    stroke(
      ctx,
      [
        [x - 10, y - 1],
        [x + 1, y - 1],
      ],
      "#aac1b1",
      0.7,
    );
    stroke(
      ctx,
      [
        [x + 9, y - 5],
        [x + 8, y + 4],
      ],
      "#947e6d",
      1.2,
    );
  }
  chair(ctx, x, y + 20);
}
function bed(ctx, x, y, c = "#a0c0bd") {
  shadow(
    ctx,
    () => rounded(ctx, x - 12, y - 24, 24, 49, 3, "#899e9a"),
    3,
    2,
    0.16,
  );
  rounded(ctx, x - 11, y - 21, 22, 44, 2, "#f0f0e6");
  rounded(ctx, x - 10, y - 20, 20, 11, 3, "#fbf9ee", "#e0e4d8", 0.5);
  rounded(
    ctx,
    x - 10,
    y - 6,
    20,
    29,
    2,
    gradient(ctx, x, y, 20, 29, c, "#718f93"),
  );
  stroke(
    ctx,
    [
      [x - 9, y - 4],
      [x + 9, y - 4],
    ],
    "#d6e5da",
    2.4,
  );
  stroke(
    ctx,
    [
      [x - 6, y + 3],
      [x - 6, y + 19],
    ],
    "#ffffff20",
    0.6,
  );
  rounded(ctx, x - 13, y - 26, 26, 5, 2, "#86988f");
}
function couch(ctx, x, y, color = "#8aa59a") {
  shadow(
    ctx,
    () => rounded(ctx, x - 23, y - 10, 46, 20, 6, color),
    3,
    2,
    0.15,
  );
  rounded(ctx, x - 19, y - 7, 18, 13, 3, "#b0c1b1");
  rounded(ctx, x + 1, y - 7, 18, 13, 3, "#a4b8a9");
  rounded(ctx, x - 24, y - 9, 6, 22, 3, "#789789");
  rounded(ctx, x + 18, y - 9, 6, 22, 3, "#789789");
  rounded(ctx, x - 20, y - 13, 40, 6, 2.8, "#7f9d8d");
}
function cabinet(ctx, x, y, w, h) {
  shadow(
    ctx,
    () => rounded(ctx, x, y, w, h, 2, "#b5c5be", "#8aa39d", 0.6),
    2,
    2,
    0.12,
  );
  stroke(
    ctx,
    [
      [x + w / 2, y + 2],
      [x + w / 2, y + h - 2],
    ],
    "#8aa29b",
    0.5,
  );
  for (const d of [-1, 1])
    stroke(
      ctx,
      [
        [x + w / 2 + d * 2, y + h / 2 - 2],
        [x + w / 2 + d * 2, y + h / 2 + 2],
      ],
      "#627c7e",
      0.6,
    );
}
// Reused in the depth pass so kitchen staff stand behind the service counter.
export function drawCafeCounter(ctx, readyMeals = 0) {
  shadow(
    ctx,
    () => rounded(ctx, -105, -14, 180, 20, 3, "#bda88b"),
    4,
    2,
    0.17,
  );
  rounded(
    ctx,
    -105,
    -15,
    180,
    13,
    3,
    gradient(ctx, -105, -15, 180, 13, "#eee8d7", "#d8d0b9"),
  );
  stroke(
    ctx,
    [
      [-104, 0],
      [74, 0],
    ],
    "#9e8f77",
    1,
  );
  // Espresso machine, group head and cup rail on the service counter.
  rounded(ctx, -96, -31, 28, 17, 2, "#a7bbb7", "#789996", 0.5);
  rounded(ctx, -94, -29, 24, 10, 1.5, "#d9e1d9");
  rounded(ctx, -91, -26, 18, 5, 1, "#48666b");
  stroke(
    ctx,
    [
      [-89, -21],
      [-89, -17],
    ],
    "#506d6f",
    1.2,
  );
  stroke(
    ctx,
    [
      [-77, -21],
      [-77, -17],
    ],
    "#506d6f",
    1.2,
  );
  rounded(ctx, -94, -15, 25, 2, 1, "#698381");
  mug(ctx, -86, -16);
  mug(ctx, -76, -16);
  rounded(ctx, 45, -26, 22, 12, 2, "#4d6770");
  rounded(ctx, 47, -24, 18, 8, 1, "#b1d5d6");
  rounded(ctx, 53, -14, 6, 3, 1, "#667e7e");
  text(ctx, "COFFEE · LUNCH", -20, -6, 4.2, "#7b8d7b", 600);
  for (let i = 0; i < Math.min(6, readyMeals); i++) {
    oval(ctx, -32 + i * 14, -8, 6, 2.8, '#f4efde');
    oval(ctx, -32 + i * 14, -8.5, 3.5, 1.6, '#ba9c6e');
  }
}
export function drawCafeTabletop(ctx, t) {
  rounded(ctx, t.x - 15, t.y - 13, 30, 25, 5, '#baa98e');
  rounded(ctx, t.x - 14, t.y - 13, 28, 22, 4,
    gradient(ctx, t.x, t.y, 28, 22, '#e4d9c1', '#caba9c'));
  mug(ctx, t.x + 4, t.y - 5);
  oval(ctx, t.x - 4, t.y - 3, 4, 4, '#f0eee2');
  rounded(ctx, t.x + 7, t.y + 3, 4, 4, .4, '#efede3');
  stroke(ctx, [[t.x + 8, t.y + 3.5], [t.x + 8, t.y + 6.5]], '#7e918b', .45);
  oval(ctx, t.x - 6, t.y - 7, 1.2, 1.7, '#ad7b65');
  oval(ctx, t.x - 2.8, t.y - 7, 1.2, 1.7, '#b5a283');
}
export function drawRoom(ctx, b) {
  const [w, h] = roomSize(b),
    x = -w / 2,
    y = -h / 2,
    accent = b.type === "home" ? homeStyle(b).wall : accents[b.type] || accents.home;
  // Terraced foundation, material floor and low cutaway walls.
  shadow(
    ctx,
    () => rounded(ctx, x - 7, y - 10, w + 14, h + 20, 5, "#e2e7da"),
    10,
    7,
    0.2,
  );
  rounded(ctx, x - 4, y - 5, w + 8, h + 10, 3, "#c2cec4");
  const tiled = ["restaurant", "hospital", "jail"].includes(b.type),
    floor = tiled ? "#e7ebe2" : b.type === "office" ? "#aebfc0" : b.type === "home" ? homeStyle(b).floor : "#d5c8af";
  rounded(ctx, x, y, w, h, 2, floor);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (tiled) {
    for (let i = 0; i < w; i += 18)
      for (let j = 0; j < h; j += 18) {
        rounded(
          ctx,
          x + i + 0.5,
          y + j + 0.5,
          17,
          17,
          0,
          (i / 18 + j / 18) % 2 ? "#dce4dc" : "#e9ede4",
        );
      }
  } else if (b.type === "office") {
    for (let i = 0; i < w; i += 24)
      stroke(
        ctx,
        [
          [x + i, y],
          [x + i, y + h],
        ],
        "#91a8ab38",
        0.5,
      );
    for (let j = 0; j < h; j += 24)
      stroke(
        ctx,
        [
          [x, y + j],
          [x + w, y + j],
        ],
        "#91a8ab38",
        0.5,
      );
  } else {
    for (let j = 0; j < h; j += 9) {
      stroke(
        ctx,
        [
          [x, y + j],
          [x + w, y + j],
        ],
        "#a9987f35",
        0.5,
      );
      for (let i = 0; i < w; i += 36)
        stroke(
          ctx,
          [
            [x + i + (j % 18 ? 18 : 0), y + j],
            [x + i + (j % 18 ? 18 : 0), y + j + 9],
          ],
          "#a9987f30",
          0.5,
        );
    }
  }
  ctx.restore();
  rounded(
    ctx,
    x - 4,
    y - 14,
    w + 8,
    15,
    2,
    gradient(ctx, x, y - 14, w, 15, "#e9ede3", accent),
  );
  stroke(
    ctx,
    [
      [x - 3, y - 13],
      [w / 2 + 3, y - 13],
    ],
    "#ffffffc0",
    1.1,
  );
  rounded(ctx, x - 4, y, 5, h, 1, "#99aea4");
  rounded(ctx, w / 2 - 1, y, 5, h, 1, "#99aea4");
  for (const xx of [-w * 0.31, w * 0.31]) {
    rounded(
      ctx,
      xx - 16,
      y - 11,
      32,
      9,
      1,
      gradient(ctx, xx, y - 11, 32, 9, "#d4edf0", "#93bcca"),
      "#788f96",
      0.6,
    );
    stroke(
      ctx,
      [
        [xx, y - 11],
        [xx, y - 2],
      ],
      "#eef6ed",
      1,
    );
    stroke(
      ctx,
      [
        [xx - 14, y - 10],
        [xx - 3, y - 3],
      ],
      "#ffffff55",
      0.7,
    );
  }
  if (b.type === "office") {
    for (const slot of deskSlots(b)) desk(ctx, slot.x, slot.y - 20);
    cabinet(ctx, w / 2 - 27, h / 2 - 27, 17, 20);
    rounded(ctx, w / 2 - 26, h / 2 - 31, 15, 9, 2, "#e5ebe1");
    rounded(ctx, w / 2 - 23, h / 2 - 29, 10, 2, 1, "#718c94");
    rounded(ctx, w / 2 - 22, h / 2 - 25, 8, 5, 0.5, "#f5f3e8");
    plant(ctx, -w / 2 + 13, h / 2 - 17, 1.1);
    rounded(ctx, -22, y - 11, 44, 8, 1, "#f0eee2");
    for (let i = 0; i < 4; i++)
      rounded(
        ctx,
        -17 + i * 9,
        y - 10,
        6,
        5,
        0.5,
        ["#a6c7c3", "#e6c6a3", "#adc0c8", "#d5bdb1"][i],
      );
  } else if (b.type === "restaurant") {
    rounded(ctx, x + 5, y + 4, w - 10, 43, 1, "#9fb5ab");
    cabinet(ctx, -104, -67, 51, 25);
    rounded(ctx, -101, -65, 45, 20, 2, "#3e545d");
    for (const xx of [-91, -70])
      for (const yy of [-60, -50]) {
        oval(ctx, xx, yy, 5.2, 4, "#667b82");
        oval(ctx, xx, yy, 3.5, 2.6, "#293f47");
        stroke(
          ctx,
          [
            [xx - 4, yy],
            [xx + 4, yy],
          ],
          "#94aaa5",
          0.6,
        );
      }
    cabinet(ctx, -46, -67, 51, 25);
    rounded(ctx, -41, -63, 24, 14, 2, "#c4b794");
    for (let i = 0; i < 3; i++)
      oval(ctx, -35 + i * 4, -57, 2, 1.7, ["#8da66c", "#b8c18a", "#d2aa74"][i]);
    stroke(
      ctx,
      [
        [-12, -62],
        [-15, -51],
      ],
      "#4a6266",
      1.5,
    );
    cabinet(ctx, 14, -67, 34, 25);
    rounded(ctx, 19, -64, 24, 18, 3, "#90acae");
    rounded(ctx, 22, -62, 18, 14, 3, "#b9ccca");
    stroke(
      ctx,
      [
        [33, -67],
        [33, -58],
      ],
      "#4e7d87",
      1.6,
    );
    shadow(
      ctx,
      () =>
        rounded(
          ctx,
          73,
          -68,
          30,
          35,
          3,
          gradient(ctx, 73, -68, 30, 35, "#f0f2e9", "#b3c8c4"),
          "#8aaba7",
          0.6,
        ),
      3,
      2,
      0.13,
    );
    stroke(
      ctx,
      [
        [98, -61],
        [98, -48],
      ],
      "#759a9d",
      1.5,
    );
    stroke(
      ctx,
      [
        [76, -45],
        [100, -45],
      ],
      "#8ca9a4",
      0.6,
    );
    drawCafeCounter(ctx);
    for (const t of cafe.tables) {
      shadow(
        ctx,
        () => rounded(ctx, t.x - 15, t.y - 13, 30, 25, 5, "#baa98e"),
        3,
        2,
        0.17,
      );
      rounded(
        ctx,
        t.x - 14,
        t.y - 13,
        28,
        22,
        4,
        gradient(ctx, t.x, t.y, 28, 22, "#e4d9c1", "#caba9c"),
      );
      chair(ctx, t.x - 17, t.y, "#78978d");
      chair(ctx, t.x + 17, t.y, "#78978d");
      mug(ctx, t.x + 4, t.y - 5);
      oval(ctx, t.x - 4, t.y - 3, 4, 4, "#f0eee2");
    }
  } else if (b.type === "home") {
    bed(
      ctx,
      -35,
      -11,
      homeStyle(b).fabric,
    );
    bed(ctx, -9, -11, "#bfbaa2");
    cabinet(ctx, 10, y + 3, 42, 17);
    rounded(ctx, 13, y + 5, 14, 12, 2, "#dfe7de");
    oval(ctx, 20, y + 11, 5, 4, "#9eb6b2");
    rounded(ctx, 33, y + 5, 17, 12, 1.5, "#465e65");
    for (const k of [37, 45]) oval(ctx, k, y + 11, 2.5, 2.5, "#879d9b");
    rounded(ctx, 12, 9, 39, 21, 5, "#d2c0a2", "#baa98b", 0.5);
    chair(ctx, 12, 21);
    chair(ctx, 51, 21);
    plant(ctx, 47, -3, 0.85);
    couch(ctx, -32, 30, homeStyle(b).sofa);
  } else if (b.type === "school") {
    rounded(ctx, -48, y + 3, 96, 16, 2, "#426d6d", "#b4c8bb", 1);
    for (let i = 0; i < 4; i++)
      stroke(
        ctx,
        [
          [-40 + i * 22, y + 8],
          [-25 + i * 22, y + 8],
        ],
        "#d7e6d5",
        0.7,
      );
    for (const slot of deskSlots(b)) desk(ctx, slot.x, slot.y - 16, false);
  } else if (b.type === "hospital") {
    for (const xx of [-49, 0, 49]) {
      bed(ctx, xx, -17, "#b5d2c7");
      cabinet(ctx, xx + 16, -40, 10, 21);
      rounded(ctx, xx + 18, -38, 6, 4, 1, "#738d97");
      stroke(
        ctx,
        [
          [xx + 22, -36],
          [xx + 28, -28],
        ],
        "#839e9c",
        0.6,
      );
    }
    rounded(ctx, -50, 31, 100, 15, 3, "#9bb8ad");
    rounded(ctx, -17, 27, 34, 10, 2, "#e1e9dc");
    stroke(
      ctx,
      [
        [-2, 28],
        [-2, 35],
      ],
      "#b6837b",
      2,
    );
    stroke(
      ctx,
      [
        [-6, 31],
        [2, 31],
      ],
      "#b6837b",
      2,
    );
  } else if (b.type === "police") {
    for (const slot of deskSlots(b)) desk(ctx, slot.x, slot.y - 20);
    cabinet(ctx, -55, 31, 45, 15);
    plant(ctx, 55, 31);
    rounded(ctx, 38, y + 4, 22, 11, 2, "#b6c8cf");
    stroke(
      ctx,
      [
        [44, y + 9],
        [54, y + 9],
      ],
      "#678895",
      1,
    );
  } else if (b.type === "jail") {
    for (let i = 0; i < 3; i++) {
      const xx = -48 + i * 47;
      bed(ctx, xx, -22, "#a8b5ad");
      stroke(
        ctx,
        [
          [xx + 21, y],
          [xx + 21, h / 2 - 5],
        ],
        "#899a9c",
        1.5,
      );
      for (let k = 0; k < 5; k++)
        stroke(
          ctx,
          [
            [xx - 20 + k * 8, 25],
            [xx - 20 + k * 8, 43],
          ],
          "#75898e",
          1.3,
        );
      stroke(
        ctx,
        [
          [xx - 20, 28],
          [xx + 15, 28],
        ],
        "#9fafa8",
        1.4,
      );
    }
  } else if (b.type === "casino") {
    for (const xx of [-43, 27]) {
      shadow(
        ctx,
        () => rounded(ctx, xx - 24, -21, 48, 34, 12, "#305e58", "#c7b491", 1.5),
        4,
        2,
        0.15,
      );
      for (let j = 0; j < 3; j++) {
        rounded(ctx, xx - 13 + j * 10, -7, 6, 9, 0.8, "#eeeade");
        oval(
          ctx,
          xx - 11 + j * 10,
          6,
          2.3,
          2.3,
          ["#bf897b", "#abbda9", "#cbb287"][j],
        );
      }
      chair(ctx, xx, 29, "#a3979c");
    }
  } else if (b.type === "church") {
    rounded(ctx, -18, y + 5, 36, 18, 3, "#e6d9be");
    stroke(
      ctx,
      [
        [0, y - 2],
        [0, y + 13],
      ],
      "#a09177",
      2.5,
    );
    stroke(
      ctx,
      [
        [-5, y + 3],
        [5, y + 3],
      ],
      "#a09177",
      2.5,
    );
    for (let j = 0; j < 3; j++)
      for (const xx of [-55, 13]) {
        rounded(ctx, xx, -12 + j * 23, 42, 11, 3, "#baa78c");
        rounded(ctx, xx, -14 + j * 23, 42, 4, 2, "#998975");
      }
  }
  drawRoomDecor(ctx, b);
  drawFrontage(ctx, b);
  // Low front parapets leave the occupants visible, and a glazed entrance anchors the path.
  rounded(ctx, x - 4, h / 2 - 4, w / 2 - 13, 5, 1.5, "#a6b7ad");
  rounded(ctx, 17, h / 2 - 4, w / 2 - 13, 5, 1.5, "#a6b7ad");
  rounded(ctx, -16, h / 2 - 1, 32, 8, 2, "#d4d9cc");
  stroke(
    ctx,
    [
      [-15, h / 2 + 3],
      [15, h / 2 + 3],
    ],
    "#eef0e8",
    0.8,
  );
}
export function drawExterior(ctx, b) {
  const [w, h] = roomSize(b),
    x = -w / 2,
    y = -h / 2;
  shadow(
    ctx,
    () => rounded(ctx, x - 6, y - 7, w + 12, h + 18, 5, "#dde3d8"),
    9,
    6,
    0.2,
  );
  rounded(
    ctx,
    x,
    y,
    w,
    h,
    4,
    gradient(ctx, x, y, w, h, "#f0efe5", "#a8bcb6"),
    "#889e99",
    0.8,
  );
  const color = b.type === "home" ? "#647c7e" : "#93aaa8";
  rounded(
    ctx,
    x + 4,
    y - 10,
    w - 8,
    h - 8,
    4,
    gradient(ctx, x, y, w, h, "#afc3bb", color),
    "#657f7f",
    0.7,
  );
  stroke(
    ctx,
    [
      [x + 7, y - 6],
      [w / 2 - 7, y - 6],
    ],
    "#d8e4db",
    1.2,
  );
  // Solar array, roof light and air handler communicate contemporary architecture.
  for (let i = 0; i < (b.type === "home" ? 2 : 3); i++) {
    const xx = x + 13 + i * 25;
    rounded(ctx, xx, y + 9, 21, 29, 1.2, "#4a687b", "#9bb8bf", 0.7);
    for (let k = 1; k < 3; k++)
      stroke(
        ctx,
        [
          [xx + 1, y + 9 + k * 9],
          [xx + 20, y + 9 + k * 9],
        ],
        "#8ba9b878",
        0.5,
      );
    stroke(
      ctx,
      [
        [xx + 10, y + 10],
        [xx + 10, y + 37],
      ],
      "#8ba9b878",
      0.5,
    );
  }
  rounded(ctx, w / 2 - 33, y + 13, 21, 23, 3, "#c8d4cc", "#89a5a4", 0.5);
  oval(ctx, w / 2 - 22.5, y + 24, 6, 6, "#a0b6b5");
  stroke(
    ctx,
    [
      [w / 2 - 27, y + 24],
      [w / 2 - 18, y + 24],
    ],
    "#708d91",
    1,
  );
  for (const xx of [-w * 0.3, w * 0.3])
    rounded(
      ctx,
      xx - 18,
      h / 2 - 17,
      36,
      9,
      1,
      gradient(ctx, xx, h / 2 - 17, 36, 9, "#d0e9eb", "#83adb9"),
      "#638692",
      0.7,
    );
  rounded(ctx, -13, h / 2 - 10, 26, 13, 1, "#7ea0a5");
  stroke(
    ctx,
    [
      [0, h / 2 - 9],
      [0, h / 2 + 3],
    ],
    "#d8e4d9",
    0.8,
  );
  rounded(ctx, -17, h / 2 + 2, 34, 7, 1.5, "#d8dcca");
  // Building-specific roof equipment and frontage keep the silhouettes legible.
  if (b.type === "home") {
    rounded(ctx, x + 11, y + 45, w - 49, 20, 2, "#b7a486");
    for (let k = 0; k < 5; k++)
      stroke(
        ctx,
        [
          [x + 13, y + 47 + k * 3.6],
          [w / 2 - 40, y + 47 + k * 3.6],
        ],
        "#e6d3b3",
        0.6,
      );
    oval(ctx, x + 28, y + 55, 6, 4, "#e9e5d6");
    oval(ctx, x + 20, y + 55, 2.5, 3, "#829c8d");
    oval(ctx, x + 37, y + 55, 2.5, 3, "#829c8d");
    plant(ctx, w / 2 - 23, y + 53, 0.8);
  } else if (b.type === "office") {
    rounded(
      ctx,
      -21,
      y + 49,
      42,
      35,
      4,
      gradient(ctx, -21, y + 49, 42, 35, "#c8e0e3", "#7ba5b5"),
      "#c5d6d0",
      2,
    );
    for (const dx of [-7, 7])
      stroke(
        ctx,
        [
          [dx, y + 51],
          [dx, y + 82],
        ],
        "#e2efeb",
        1.1,
      );
    stroke(
      ctx,
      [
        [-19, y + 66],
        [19, y + 66],
      ],
      "#e2efeb",
      1.1,
    );
    rounded(ctx, -w / 2 + 11, h / 2 - 5, w - 22, 5, 1, "#658c9c");
  } else if (b.type === "restaurant") {
    rounded(
      ctx,
      -w / 2 + 5,
      h / 2 - 15,
      w - 10,
      16,
      3,
      gradient(ctx, 0, h / 2 - 15, w, 16, "#b89d7e", "#8e826c"),
    );
    text(ctx, "WILLOW CAFÉ", 0, h / 2 - 4, 7, "#f4eedf", 600);
    for (let i = 0; i < 3; i++) {
      rounded(ctx, w / 2 - 32 - i * 15, y + 47, 9, 13, 2, "#b7c8bf");
      oval(ctx, w / 2 - 27.5 - i * 15, y + 50, 3, 2, "#789592");
    }
  } else if (b.type === "hospital") {
    rounded(ctx, -19, y + 45, 38, 29, 6, "#edf1e7");
    stroke(
      ctx,
      [
        [0, y + 51],
        [0, y + 68],
      ],
      "#a9716a",
      6,
    );
    stroke(
      ctx,
      [
        [-8, y + 59],
        [8, y + 59],
      ],
      "#a9716a",
      6,
    );
    rounded(ctx, -w / 2 + 8, h / 2 - 6, w - 16, 5, 1, "#8fb9ac");
  } else if (b.type === "school") {
    rounded(ctx, -35, y + 45, 70, 20, 3, "#b9d1ca", "#e2ebe0", 1.1);
    for (let i = 1; i < 4; i++)
      stroke(
        ctx,
        [
          [-35 + i * 17.5, y + 47],
          [-35 + i * 17.5, y + 63],
        ],
        "#e2ebe0",
        1,
      );
    text(ctx, "LEARNING CENTER", 0, h / 2 - 5, 5.2, "#e3eee4", 600);
  } else if (b.type === "police") {
    rounded(ctx, -42, h / 2 - 6, 84, 6, 2, "#557c99");
    text(ctx, "POLICE", 0, y + 59, 8, "#e7f0e4", 600);
  } else if (b.type === "jail") {
    for (let i = 0; i < 5; i++)
      rounded(ctx, -30 + i * 13, y + 48, 7, 19, 1, "#a6b9b5", "#738e91", 0.6);
  } else if (b.type === "casino") {
    rounded(ctx, -w / 2 + 9, h / 2 - 17, w - 18, 17, 4, "#7c8395");
    text(ctx, "SOCIAL CLUB", 0, h / 2 - 5, 6, "#eeead7", 600);
    rounded(ctx, -28, y + 47, 56, 17, 3, "#c0b799");
    for (let i = 0; i < 6; i++)
      oval(ctx, -22 + i * 9, y + 55, 1.5, 1.5, "#ece8cd");
  } else if (b.type === "church") {
    stroke(
      ctx,
      [
        [0, y + 42],
        [0, y + 70],
      ],
      "#d5decb",
      4,
    );
    stroke(
      ctx,
      [
        [-10, y + 51],
        [10, y + 51],
      ],
      "#d5decb",
      4,
    );
  }
  drawFrontage(ctx, b);
  plant(ctx, x + 10, h / 2 + 4, 0.8);
  plant(ctx, w / 2 - 10, h / 2 + 4, 0.8);
}
export function drawPublicSpace(ctx, b) {
  const [w, h] = roomSize(b);
  shadow(
    ctx,
    () => rounded(ctx, -w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 8, "#c5d2bd"),
    8,
    4,
    0.14,
  );
  rounded(
    ctx,
    -w / 2,
    -h / 2,
    w,
    h,
    6,
    b.type === "graveyard" ? "#a6bea7" : "#dce0d1",
  );
  if (b.type === "square") {
    for (let x = -w / 2 + 12; x < w / 2; x += 18)
      stroke(
        ctx,
        [
          [x, -h / 2 + 2],
          [x, h / 2 - 2],
        ],
        "#bdc9bc55",
        0.6,
      );
    shadow(ctx, () => oval(ctx, 0, 0, 28, 25, "#f0f0e6"), 5, 2, 0.18);
    oval(
      ctx,
      0,
      -1,
      23,
      20,
      gradient(ctx, -23, -20, 46, 40, "#a5d6d8", "#74a9b7"),
    );
    oval(ctx, 0, -4, 14, 12, "#c3e6de");
    oval(ctx, 0, -10, 7, 5, "#edf3e6");
    stroke(
      ctx,
      [
        [0, -11],
        [0, -20],
      ],
      "#bce9e2",
      2,
    );
    for (const xx of [-57, 50]) {
      rounded(ctx, xx, -22, 8, 44, 3, "#a38f76");
      for (let k = 0; k < 3; k++)
        stroke(
          ctx,
          [
            [xx + 1 + k * 2, -20],
            [xx + 1 + k * 2, 20],
          ],
          "#dac9a8",
          0.6,
        );
    }
    plant(ctx, -56, -37, 1.3);
    plant(ctx, 56, 34, 1.3);
  } else {
    for (let i = 0; i < 8; i++) {
      const x = -45 + (i % 4) * 30,
        y = -25 + Math.floor(i / 4) * 41;
      rounded(ctx, x - 8, y, 16, 20, 3, "#c9d4c6", "#9aaa9f", 0.5);
      rounded(ctx, x - 5, y + 5, 10, 2, 1, "#a5b7ad");
      oval(ctx, x + 3, y + 24, 4, 2, "#d4c5a4");
    }
    stroke(
      ctx,
      [
        [-w / 2 + 2, -h / 2 + 1],
        [w / 2 - 2, -h / 2 + 1],
      ],
      "#708f7f",
      2,
    );
  }
}
