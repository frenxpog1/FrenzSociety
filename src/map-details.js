import { WORLD } from './spaces.js';
import { STREETS, buildingBounds, intersects, streetDistance } from './layout.js';
import { rounded, oval, stroke, gradient, shadow, text } from './paint.js';

const unit = n => { const s = Math.sin(n * 127.1 + 83.7) * 43758.5453; return s - Math.floor(s); };
function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy || 1)));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function plotBounds(p) {
  return {left:p.x-48,right:p.x+48,top:p.y-42,bottom:p.y+42};
}
// Scenery is derived, never saved as buildings. Expansion always takes precedence.
export function landscapePlots(buildings, entrances) {
  const plots = [], obstacles = buildings.map(b=>buildingBounds(b,24));
  const segments = entrances.flatMap(({points})=>points.slice(1).map((p,i)=>[points[i],p]));
  for(let i=0;i<150 && plots.length<18;i++) {
    const p={x:150+unit(i*3)*(WORLD.width-240),y:80+unit(i*3+1)*(WORLD.height-160),kind:i%3};
    const r=plotBounds(p);
    if(streetDistance(p.x,p.y)<115 || obstacles.some(b=>intersects(r,b)) ||
      plots.some(other=>Math.hypot(other.x-p.x,other.y-p.y)<185) ||
      segments.some(([a,b])=>segmentDistance(p,a,b)<75)) continue;
    plots.push(p);
  }
  return plots;
}
function flowers(ctx,x,y,width=28) {
  rounded(ctx,x-width/2,y-7,width,14,6,'#899b7455');
  for(let i=0;i<10;i++) {
    const xx=x-width/2+3+unit(i+width)* (width-6), yy=y-3+unit(i+7)*6;
    stroke(ctx,[[xx,yy+3],[xx,yy-1]],'#5f805d',.7);
    oval(ctx,xx,yy-1,1.8,1.4,['#e9d8af','#b99195','#eae9d2'][i%3]);
    oval(ctx,xx+.3,yy-1,.5,.5,'#c8ac74');
  }
}
function bench(ctx,x,y) {
  oval(ctx,x+2,y+7,18,4,'#3853441c');
  for(const d of [-1,1]) stroke(ctx,[[x+d*12,y-3],[x+d*12,y+7]],'#5e7471',1.5);
  rounded(ctx,x-16,y-6,32,9,2,'#bca68b','#978b73',.5);
  for(let i=0;i<3;i++) stroke(ctx,[[x-14,y-4+i*2.5],[x+14,y-4+i*2.5]],'#e1cdb0',.65);
  rounded(ctx,x-17,y-10,34,4,1.3,'#9c8c73');
  stroke(ctx,[[x-17,y-4],[x-17,y+1]],'#627c75',1.5);
  stroke(ctx,[[x+17,y-4],[x+17,y+1]],'#627c75',1.5);
}
function shrub(ctx,x,y,size=7) {
  oval(ctx,x+2,y+3,size*1.1,size*.55,'#355d4420');
  oval(ctx,x,y,size,size*.7,'#6c916d');
  oval(ctx,x-2,y-2,size*.65,size*.45,'#8da87b');
  for(let i=0;i<3;i++) oval(ctx,x-3+i*3,y-2+i%2,1,1,'#c0c99b66');
}
export function drawLandscapePlots(ctx, plots) {
  for(const p of plots) {
    ctx.save();ctx.translate(p.x,p.y);
    if(p.kind===0) {
      // A small contemporary pocket garden, with gravel and raised flower beds.
      rounded(ctx,-43,-33,86,66,13,'#8fa78544');
      rounded(ctx,-37,-27,74,54,10,'#d1d4bf');
      rounded(ctx,-33,-23,66,46,8,'#dfe0cb');
      for(let i=0;i<24;i++) oval(ctx,-30+unit(i)*60,-19+unit(i+21)*37,.45,.4,'#a9b19c70');
      for(const x of [-24,24]) { rounded(ctx,x-10,-19,20,38,3,'#a9b39a'); flowers(ctx,x,-7,16); shrub(ctx,x,10,7); }
      bench(ctx,0,28);
    } else if(p.kind===1) {
      // Picnic furniture and a folded parasol; no canopy hides residents.
      oval(ctx,1,9,38,22,'#a3b78b44');
      for(const x of [-12,12]) stroke(ctx,[[x,-8],[x,17]],'#6c7f6d',2);
      shadow(ctx,()=>rounded(ctx,-21,-12,42,24,3,'#bca98a'),3,2,.13);
      for(let i=0;i<5;i++) stroke(ctx,[[-18,-9+i*4.5],[18,-9+i*4.5]],'#dfcba9',.8);
      rounded(ctx,-25,-20,50,7,2,'#a28f73');
      rounded(ctx,-25,19,50,7,2,'#a28f73');
      oval(ctx,4,-1,5,3,'#ede9d5');
      oval(ctx,-6,-3,2,2.4,'#7f9b86');
      stroke(ctx,[[24,4],[24,-24]],'#8f8a73',1.3);
      rounded(ctx,22,-27,4,15,2,'#d5c5a2');
      flowers(ctx,-28,31,20);
    } else {
      // Looser planted islands break up the lawns without filling every lot.
      oval(ctx,0,0,37,24,'#8eaa7b33');
      flowers(ctx,0,5,42);
      shrub(ctx,-23,-6,11);shrub(ctx,20,-10,9);
      oval(ctx,15,17,7,4,'#b4b9a4');oval(ctx,12,15,5,2,'#d1d3bc');
      oval(ctx,-14,18,4,2.6,'#a9b29e');
    }
    ctx.restore();
  }
}
export function drawRiverDetails(ctx) {
  for(let i=0;i<28;i++) {
    const y=38+i*56;
    if(STREETS.horizontal.some(s=>Math.abs(y-s)<70))continue;
    const x=63+Math.sin(y*.008)*8;
    for(let j=0;j<4;j++) {
      const xx=x+j*2, yy=y+unit(i+j)*5;
      stroke(ctx,[[xx,yy+5],[xx-2,yy-8-j%2*3]],'#72916d',.8);
      stroke(ctx,[[xx-1,yy-3],[xx-5,yy-5]],'#8b9f75',.7);
    }
    oval(ctx,x+7,y+9,5,3,'#a7b29c');
    oval(ctx,x+6,y+8,3.5,1.6,'#d0d1b6');
    if(i%3===0) {
      ctx.beginPath();ctx.ellipse(24,y+15,12,3,0,0,Math.PI*2);
      ctx.strokeStyle='#d7e9dd55';ctx.lineWidth=.7;ctx.stroke();
      // Two little water lilies, far from the bridge surface.
      oval(ctx,13,y+4,3,2,'#81a786');oval(ctx,16,y+1,2.4,1.7,'#91b08b');
    }
  }
}
export function drawStreetDetails(ctx) {
  for(const y of STREETS.horizontal) {
    for(let x=200;x<WORLD.width-80;x+=225) {
      if(STREETS.vertical.some(v=>Math.abs(v-x)<110))continue;
      // Flush drainage grates and utility covers never obstruct walkers.
      for(const side of [-1,1]) {
        rounded(ctx,x-4,y+side*26-2,9,4,1,'#3f5157');
        for(let j=0;j<4;j++)stroke(ctx,[[x-3+j*2,y+side*26-1],[x-3+j*2,y+side*26+1]],'#89978d',.45);
      }
      oval(ctx,x+70,y+12,5,4,'#68747a');
      ctx.beginPath();ctx.ellipse(x+70,y+12,4,3,0,0,Math.PI*2);
      ctx.strokeStyle='#9aa69f';ctx.lineWidth=.5;ctx.stroke();
      stroke(ctx,[[x+67,y+12],[x+73,y+12]],'#53656a',.65);
    }
  }
  for(const x of STREETS.vertical)for(const y of STREETS.horizontal) {
    stroke(ctx,[[x-62,y-65],[x-62,y-86]],'#647d73',1.2);
    rounded(ctx,x-80,y-86,36,6,1,'#52796b');
    text(ctx,y===470?'WILLOW AVE':'PARK ST',x-62,y-81.5,3.1,'#eff0de',600);
    rounded(ctx,x-76,y-79,28,5,1,'#638778');
    text(ctx,x===760?'CREEK RD':'GARDEN RD',x-62,y-75.2,2.7,'#f1f1df',550);
  }
}
