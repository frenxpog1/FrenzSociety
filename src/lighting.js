import { nightAmount, patrolBeam } from "./resident-behavior.js";
import { WORLD, roomSize } from "./spaces.js";
import { STREETS } from "./layout.js";
import { oval } from "./paint.js";
function glow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(246,222,167,0)");
  oval(ctx, x, y, r, r * 0.72, g);
}
export function drawLighting(ctx, state, buildings) {
  const night = nightAmount(state.hour);
  if (!night) return;
  ctx.save();
  ctx.fillStyle = `rgba(29,47,77,${night * 0.43})`;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = night;
  for (const y of STREETS.horizontal)
    for (let x = 150; x < WORLD.width - 80; x += 270) {
      if (STREETS.vertical.some((v) => Math.abs(x - v) < 130)) continue;
      glow(ctx, x + 8, y - 60, 44, "rgba(244,222,175,.28)");
      oval(ctx, x + 8, y - 61, 4, 2, "#f6e8bd");
    }
  for (const b of buildings) {
    if (["square", "graveyard"].includes(b.type)) continue;
    const [w, h] = roomSize(b),
      x = (b.x * WORLD.width) / 100,
      y = (b.y * WORLD.height) / 100;
    for (const side of [-1, 1]) {
      const xx = x + side * w * 0.31;
      glow(ctx, xx, y - h / 2 + 2, 19, "rgba(248,215,145,.17)");
      oval(ctx, xx, y - h / 2 - 7, 12, 2.5, "#efd6a4");
    }
  }
  for (const p of state.people) {
    const beam=patrolBeam(p,state.motion[p.id],state,buildings);
    if(!beam)continue;
    const {origin,points}=beam;
    const g=ctx.createRadialGradient(origin.x,origin.y,0,origin.x,origin.y,105);
    g.addColorStop(0,'rgba(255,244,198,.7)');
    g.addColorStop(.35,'rgba(250,235,181,.25)');
    g.addColorStop(1,'rgba(250,235,181,0)');
    ctx.beginPath();ctx.moveTo(origin.x,origin.y);
    for(const p of points)ctx.lineTo(p.x,p.y);
    ctx.closePath();ctx.fillStyle=g;ctx.fill();
    oval(ctx,origin.x,origin.y,1.4,1.4,'#fff0c3');
  }
  ctx.restore();
}
