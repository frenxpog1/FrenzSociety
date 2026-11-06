// Presentation follows the encounter clock: pausing freezes fear, recoil and smoke.
import { toPixels } from './layout.js';
import { crimeDirective } from './crime.js';
import { characterAppearance, weaponGrip } from './characters.js';
import { oval, rounded, stroke } from './paint.js';
export const shotPulse = c => c.phase==='confront' && !!c.shotBy && c.elapsed<.13;
function bubble(ctx,m,label,color='#f2d79b') {
  const p=toPixels(m);
  ctx.font='600 9px Inter, system-ui';ctx.textAlign='center';
  const w=ctx.measureText(label).width+12;
  rounded(ctx,p.x-w/2,p.y-57,w,16,5,'#253e46ee',color,.6);
  ctx.fillStyle=color;ctx.fillText(label,p.x,p.y-46);
}
export function drawCrimeEffects(ctx,state) {
  for(const c of state.crimeEncounters||[]) {
    const r=state.motion[c.robberId],v=state.motion[c.victimId],o=state.motion[c.officerId];
    if(!r||!v)continue;
    ctx.save();
    const center=toPixels(v),pulse=.5+.5*Math.sin((state.activitySeconds||0)*5);
    ctx.strokeStyle=`rgba(223,159,93,${.24+pulse*.2})`;ctx.lineWidth=1.1;
    ctx.beginPath();ctx.ellipse(center.x,center.y+2,13+pulse*2,5,0,0,Math.PI*2);ctx.stroke();
    if(c.outcome==='surrendered') bubble(ctx,r,c.phase==='aftermath'?'Going to jail':'I surrender!','#b5dfd1');
    else if(c.phase==='aftermath') bubble(ctx,r,['arrested','robber-down'].includes(c.outcome)?'Stopped':`+$${c.amount}`);
    else if(c.phase==='respond'&&o)bubble(ctx,o,'Police! Stop!','#b4d5ec');
    else if(['threat','confront'].includes(c.phase))bubble(ctx,v,'Help!');
    if(c.shotBy && c.phase==='confront' && c.elapsed<.8) {
      const shooter=state.people.find(p=>p.id===c.shotBy),m=state.motion[c.shotBy],hit=state.motion[c.shotTarget];
      if(shooter&&m&&hit) {
        const directive=crimeDirective(state,shooter),g=weaponGrip(directive?.target.facing||m.facing||'south');
        const a=characterAppearance(shooter).scale,p=toPixels(m),target=toPixels(hit);
        const x=p.x+(g.x+Math.cos(g.angle)*7)*a,y=p.y+(g.y+Math.sin(g.angle)*7)*a;
        if(shotPulse(c)) {
          stroke(ctx,[[x,y],[target.x,target.y-17]],'#f9d786a6',.8);
          ctx.save();ctx.translate(x,y);ctx.rotate(g.angle);
          ctx.beginPath();ctx.moveTo(-1,-2);ctx.lineTo(5,-5);ctx.lineTo(4,-1);ctx.lineTo(10,0);
          ctx.lineTo(4,2);ctx.lineTo(5,5);ctx.lineTo(-1,2);ctx.closePath();ctx.fillStyle='#ffdc7a';ctx.fill();
          oval(ctx,1,0,2.5,1.6,'#fff6d5');ctx.restore();
        }
        const t=c.elapsed/.8;
        oval(ctx,x+Math.cos(g.angle)*t*7,y-t*10,1+t*4,1+t*3,`rgba(211,222,219,${(1-t)*.45})`);
      }
    }
    ctx.restore();
  }
}
