// Small vector primitives: every asset is drawn at the current display resolution.
export function rounded(
  ctx,
  x,
  y,
  w,
  h,
  r,
  fill,
  stroke = null,
  lineWidth = 1,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}
export function oval(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
export function stroke(ctx, points, color, width = 1) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}
export function gradient(ctx, x, y, w, h, top, bottom) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.18, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}
export function shadow(ctx, draw, blur = 10, y = 4, alpha = 0.16) {
  ctx.save();
  ctx.shadowColor = `rgba(32,49,53,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
  draw();
  ctx.restore();
}
export function text(
  ctx,
  content,
  x,
  y,
  size = 10,
  color = "#334a4d",
  weight = 600,
  align = "center",
) {
  ctx.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.fillText(content, x, y);
}
export function plant(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  shadow(ctx, () => rounded(ctx, -5, -1, 10, 9, 3, "#d8d9cd"), 4, 2, 0.13);
  oval(ctx, 0, -4, 7, 5, "#4d7b65");
  oval(ctx, -3, -7, 4, 5, "#6c9673");
  oval(ctx, 3, -8, 4, 5, "#79a180");
  stroke(
    ctx,
    [
      [0, -1],
      [0, -8],
    ],
    "#416b55",
    0.7,
  );
  ctx.restore();
}
