import { STREETS, toPercent, buildingBounds } from './layout.js';
import { WORLD } from './spaces.js';

export function isPatrolling(p, hour) {
  if (!p.alive || p.jailHoursRemaining > 0 || p.mealOrder || !p.job?.title?.includes('Police') || p.status !== 'On Patrol') return false;
  const {starts,ends} = p.job;
  return starts > ends ? hour >= starts || hour < ends : hour >= starts && hour < ends;
}
export function patrolPoint(person, motion) {
  const [left,right]=STREETS.vertical,[top,bottom]=STREETS.horizontal;
  const points=[{x:left-44,y:top-44},{x:right+44,y:top-44},
    {x:right+44,y:bottom+44},{x:left-44,y:bottom+44}];
  const seed=String(person.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0);
  if (!Number.isInteger(motion.patrolIndex)) motion.patrolIndex=seed%points.length;
  return toPercent(points[motion.patrolIndex%points.length].x,points[motion.patrolIndex%points.length].y);
}
export function travelMode(p) { return /running|fleeing|chasing/i.test(p.status) ? 'run' : 'walk'; }
export function nightAmount(hour) {
  return hour>=18?Math.min(1,(hour-18)/3):hour<6?1:hour<8?(8-hour)/2:0;
}
// Clip individual beam rays against buildings, so the cone stops at walls.
function rayLength(origin,dx,dy,boxes) {
  let result=100;
  for(const b of boxes) {
    let near=0,far=result;
    for(const [o,d,min,max] of [[origin.x,dx,b.left,b.right],[origin.y,dy,b.top,b.bottom]]) {
      if(Math.abs(d)<1e-8){if(o<min||o>max){far=-1;break;}continue;}
      const a=(min-o)/d,c=(max-o)/d;
      near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));
    }
    if(far>=near&&near>1)result=Math.min(result,near);
  }
  return result;
}
export function patrolBeam(person,motion,state,buildings) {
  if(!motion || !isPatrolling(person,state.hour) || !nightAmount(state.hour))return null;
  const x=motion.x*WORLD.width/100,y=motion.y*WORLD.height/100;
  const boxes=buildings.map(b=>buildingBounds(b));
  if(boxes.some(b=>x>b.left&&x<b.right&&y>b.top&&y<b.bottom))return null;
  const angle=({north:-Math.PI/2,south:Math.PI/2,east:0,west:Math.PI})[motion.facing||'south'];
  const offset=({north:[4,-20],south:[4,-12],east:[6,-16],west:[-6,-16]})[motion.facing||'south'];
  const origin={x:x+offset[0],y:y+offset[1]};
  const sweep=Math.sin((state.activitySeconds||0)*1.2)*.08;
  const points=Array.from({length:9},(_,i)=>{
    const a=angle+sweep-.32+i*.08,dx=Math.cos(a),dy=Math.sin(a),r=rayLength(origin,dx,dy,boxes);
    return {x:origin.x+dx*r,y:origin.y+dy*r};
  });
  return {origin,points};
}
