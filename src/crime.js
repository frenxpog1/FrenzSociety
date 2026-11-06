import { WORLD } from './spaces.js';
import { buildingBounds, toPixels } from './layout.js';
import { gameConfig } from './constants.js';
import { clamp } from './utils.js';

export const CRIME_RADIUS = 180, RESPONSE_RADIUS = 220;
const phases = new Set(['approach','threat','respond','confront','aftermath']);
const outcomes = new Set(['escaped','arrested','surrendered','robber-down','officer-down','victim-down']);
const personById = (state,id) => state.people.find(p=>p.id===id);
export const crimeDistance = (a,b) => Math.hypot((a.x-b.x)*WORLD.width/100,(a.y-b.y)*WORLD.height/100);
function outdoor(m,buildings) {
  const p=toPixels(m);
  return !buildings.some(b=>!['square','graveyard'].includes(b.type)&&(()=>{
    const r=buildingBounds(b);return p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom;
  })());
}
export function encounterFor(state,id) {
  return (state.crimeEncounters||[]).find(c=>[c.robberId,c.victimId,c.officerId].includes(id));
}
export function nearbyVictim(state,robber,victim,buildings) {
  const a=state.motion?.[robber.id],b=state.motion?.[victim.id];
  return !!(a&&b&&robber.alive&&victim.alive&&!robber.isChild&&!victim.isChild&&robber.id!==victim.id&&
    !robber.jailHoursRemaining&&!victim.jailHoursRemaining&&!robber.mealOrder&&!victim.mealOrder&&
    !victim.job?.title?.includes('Police')&&!encounterFor(state,robber.id)&&!encounterFor(state,victim.id)&&
    crimeDistance(a,b)<=CRIME_RADIUS&&outdoor(a,buildings)&&outdoor(b,buildings));
}
export function startRobbery(state,robberId,victimId,buildings,rng=Math.random) {
  return stageRobbery(state,personById(state,robberId),personById(state,victimId),buildings,rng);
}

export function stageRobbery(state, robber, victim, buildings, rng = Math.random) {
  state.crimeEncounters ??= [];
  if(!robber||!victim||state.crimeEncounters.length>=4||!nearbyVictim(state,robber,victim,buildings))return false;
  const {id:robberId}=robber, {id:victimId}=victim;
  const m=state.motion[victimId];
  const preferred=state.motion[robberId].x<m.x?-1:1;
  const side=[preferred,-preferred].find(side=>[18,50].every(offset=>outdoor({
    x:m.x+side*offset/WORLD.width*100,y:m.y+(offset===50?16:0)/WORLD.height*100
  },buildings)));
  if(!side)return false;
  const c={id:`crime-${state.day}-${Math.floor((state.activitySeconds||0)*1000)}-${robberId}`,
    robberId,victimId,officerId:null,phase:'approach',elapsed:0,age:0,
    weapon:robber.isSerialKiller?'knife':rng()<.35?'pistol':'knife',
    x:m.x,y:m.y,side,outcome:null,amount:0,
    shotBy:null,shotTarget:null,before:{}};
  for(const p of [robber,victim]) {
    c.before[p.id]={status:p.status,locationId:p.locationId};
    delete state.speech?.[p.id];
  }
  state.crimeEncounters.push(c);
  robber.status='Approaching a robbery target';victim.status='Being approached';
  return true;
}
function onDuty(p,hour) {
  if(!p.alive||p.isChild||p.jailHoursRemaining||p.mealOrder||!p.job?.title?.includes('Police'))return false;
  const {starts,ends}=p.job;
  return starts>ends?hour>=starts||hour<ends:hour>=starts&&hour<ends;
}
export function respondingOfficer(state,c,buildings) {
  const origin=state.motion[c.robberId];
  if(!origin)return null;
  return state.people.filter(p=>onDuty(p,state.hour)&&!encounterFor(state,p.id)&&
    state.motion[p.id]&&outdoor(state.motion[p.id],buildings)&&crimeDistance(origin,state.motion[p.id])<=RESPONSE_RADIUS)
    .sort((a,b)=>crimeDistance(origin,state.motion[a.id])-crimeDistance(origin,state.motion[b.id]))[0]||null;
}
function facing(a,b) {
  const dx=(b.x-a.x)*WORLD.width,dy=(b.y-a.y)*WORLD.height;
  return Math.abs(dx)>Math.abs(dy)?dx>0?'east':'west':dy>0?'south':'north';
}
export function crimeDirective(state,p) {
  const c=encounterFor(state,p.id),m=state.motion[p.id];
  if(!c||!m)return null;
  const robber=state.motion[c.robberId],victim={x:c.x,y:c.y};
  let target={x:m.x,y:m.y},look=robber||victim,pose='frightened',weapon=null,masked=false;
  if(p.id===c.robberId) {
    target={x:c.x+c.side*18/WORLD.width*100,y:c.y};
    look=c.officerId&&['confront','aftermath'].includes(c.phase)?state.motion[c.officerId]||victim:victim;
    pose=c.phase==='approach'?'idle':c.outcome==='surrendered'||c.outcome==='arrested'&&c.phase==='aftermath'?'surrender':'threaten';
    weapon=pose==='surrender'||c.phase==='approach'?null:c.weapon;masked=true;
  } else if(p.id===c.officerId) {
    target={x:c.x+c.side*50/WORLD.width*100,y:c.y+16/WORLD.height*100};
    look=robber||victim;pose=c.shotBy&&['confront','aftermath'].includes(c.phase)?'aim':'idle';
    weapon=c.shotBy||c.outcome==='officer-down'?'pistol':null;
  } else {target=victim;look=robber||victim;pose=c.phase==='approach'?'idle':'frightened';}
  if(['confront','aftermath'].includes(c.phase))target={x:m.x,y:m.y};
  return {key:`crime:${c.id}:${p.id}:${c.phase}`,target:{...target,facing:facing(m,look),pose},weapon,masked,encounter:c};
}
function release(state,c,cancelled=false) {
  for(const id of [c.robberId,c.victimId,c.officerId]) {
    const p=personById(state,id),before=c.before[id];
    if(!p||!p.alive||p.jailHoursRemaining||!before)continue;
    p.locationId=before.locationId;
    p.status=cancelled||id===c.officerId?before.status:id===c.victimId?'Shaken after robbery':'Fleeing after robbery';
    if(!cancelled&&id===c.robberId)p.locationId=p.homeId||'town-square';
  }
}
// Confidence changes the odds, but even experienced robbers can lose their nerve.
export function surrenderChance(robber) {
  return clamp((robber.isSerialKiller ? .08 : .68) - (robber.robberyConfidence || 0) * .02,
    robber.isSerialKiller ? .03 : .22, .8);
}
function chooseOutcome(state,c,rng) {
  const robber=personById(state,c.robberId);
  if(!c.officerId) {
    c.outcome=rng()<.05?'victim-down':'escaped';
    if(c.outcome==='victim-down'&&c.weapon==='pistol'){c.shotBy=c.robberId;c.shotTarget=c.victimId;}
    return;
  }
  if(rng()<surrenderChance(robber)) {
    c.outcome='surrendered';robber.status='Surrendering to police';
    return;
  }
  const dangerous=!!robber.isSerialKiller;
  if(rng()<(dangerous?.8:.1)) {
    c.outcome=rng()<(dangerous?.9:.4)?'officer-down':rng()<.15?'robber-down':'arrested';
    if(c.outcome==='robber-down'){c.shotBy=c.officerId;c.shotTarget=c.robberId;}
    else if(c.weapon==='pistol'){c.shotBy=c.robberId;c.shotTarget=c.officerId;}
    // A knife confrontation can be met by a defensive police shot.
    else if(['arrested','robber-down'].includes(c.outcome)){c.shotBy=c.officerId;c.shotTarget=c.robberId;}
  } else c.outcome='arrested';
}
function settle(state,c,rng) {
  const r=personById(state,c.robberId),v=personById(state,c.victimId),o=personById(state,c.officerId);
  const fatal=c.outcome==='victim-down'?v:c.outcome==='officer-down'?o:c.outcome==='robber-down'?r:null;
  if(fatal){fatal.alive=false;fatal.deathDay=state.day;fatal.status=c.outcome==='officer-down'?'Killed in the line of duty':c.outcome==='robber-down'?'Killed by Police':'Murdered during robbery';}
  if(['escaped','officer-down','victim-down'].includes(c.outcome)) {
    const desired=Math.floor(rng()*(gameConfig.robberyMaxSteal-gameConfig.robberyMinSteal+1))+gameConfig.robberyMinSteal;
    c.amount=Math.min(Math.max(0,v.money),desired);
    v.money-=c.amount;r.money+=c.amount;
    v.happiness=clamp(v.happiness-25,0,100);r.happiness=clamp(r.happiness+30,0,100);
    r.robberyConfidence=Math.min(20,(r.robberyConfidence||0)+2);r.depressedHours=0;
  } else {
    r.robberyConfidence=Math.max(0,(r.robberyConfidence||0)-3);
    if(r.alive){r.locationId='jail-1';r.jailHoursRemaining=r.isSerialKiller?240:c.shotBy?120:72;r.status='Arrested';r.isSerialKiller=false;r.happiness=clamp(r.happiness-30,0,100);}
  }
  if(fatal) {
    for(const p of state.people)if(p.partnerId===fatal.id)p.partnerId=null;
    for(const [key,relation]of Object.entries(state.relationships||{}))if(key.split('|').includes(fatal.id))relation.couple=false;
    state.pendingCrimeDeaths=[...(state.pendingCrimeDeaths||[]),fatal.id];
  }
  const title=c.outcome==='surrendered'?'Robber surrendered':c.outcome==='arrested'?'Robbery stopped':c.outcome==='escaped'?'Robbery':'Armed confrontation';
  const message=c.outcome==='surrendered'?`${r.name} lost their nerve, lowered their weapon and surrendered to Officer ${o.name}. ${v.name} kept their money. ${r.name} will serve ${r.jailHoursRemaining/24} days in jail.`:c.outcome==='arrested'?`Officer ${o.name} reached the scene and arrested ${r.name}. ${v.name} kept their money.`:
    c.outcome==='escaped'?`${r.name} robbed ${v.name} of $${c.amount}. No available officer reached the scene.`:
    c.outcome==='robber-down'?`Officer ${o.name} fired during the robbery. ${r.name} died at the scene.`:
    c.outcome==='officer-down'?`${r.name} killed Officer ${o.name} during the confrontation and escaped with $${c.amount}.`:
    `${v.name} died during ${r.name}'s robbery. $${c.amount} was stolen.`;
  return {title,message};
}
export function advanceCrimes(state,seconds,buildings,rng=Math.random) {
  if(!state.running||seconds<=0)return [];
  const events=[],keep=[];
  for(const c of state.crimeEncounters||[]) {
    const r=personById(state,c.robberId),v=personById(state,c.victimId);
    c.age+=seconds;c.elapsed+=seconds;
    if(c.phase==='aftermath') {if(c.elapsed<3)keep.push(c);else release(state,c);continue;}
    if(!r?.alive||!v?.alive||r.jailHoursRemaining||v.jailHoursRemaining||!state.motion[r.id]||!state.motion[v.id]||c.age>25){release(state,c,true);continue;}
    if(c.phase==='approach') {
      if(crimeDistance(state.motion[r.id],{x:c.x,y:c.y})<=24){c.phase='threat';c.elapsed=0;r.status='Threatening a robbery victim';v.status='Being robbed';}
    } else if(c.phase==='threat') {
      const cop=c.elapsed>=.6?respondingOfficer(state,c,buildings):null;
      if(cop){c.officerId=cop.id;c.before[cop.id]={status:cop.status,locationId:cop.locationId};cop.status='Responding to a robbery';delete state.speech?.[cop.id];c.phase='respond';c.elapsed=0;}
      else if(c.elapsed>=4){chooseOutcome(state,c,rng);c.phase='confront';c.elapsed=0;}
    } else if(c.phase==='respond') {
      const cop=personById(state,c.officerId),m=state.motion[c.officerId];
      if(!cop||!onDuty(cop,state.hour)||!m){if(cop?.alive)Object.assign(cop,c.before[cop.id]);delete c.before[c.officerId];c.officerId=null;c.phase='threat';c.elapsed=0;}
      else if(crimeDistance(m,state.motion[r.id])<45){chooseOutcome(state,c,rng);c.phase='confront';c.elapsed=0;cop.status='Intervening in a robbery';}
      else if(c.elapsed>=5){Object.assign(cop,c.before[cop.id]);delete c.before[cop.id];c.officerId=null;chooseOutcome(state,c,rng);c.phase='confront';c.elapsed=0;}
    } else if(c.phase==='confront'&&c.elapsed>=1){events.push(settle(state,c,rng));c.phase='aftermath';c.elapsed=0;}
    keep.push(c);
  }
  state.crimeEncounters=keep;
  return events;
}

// Explicit hour/day skips dismiss unfinished approaches. An already decided
// confrontation still applies once; a settled aftermath only releases its actors.
export function skipCrimeScenes(state,rng=Math.random) {
  const events=[];
  for(const c of state.crimeEncounters||[]) {
    if(c.phase==='confront'&&personById(state,c.robberId)?.alive&&personById(state,c.victimId)?.alive)
      events.push(settle(state,c,rng));
    release(state,c,!['confront','aftermath'].includes(c.phase));
  }
  state.crimeEncounters=[];
  return events;
}

export function decodeCrimeEncounters(input,people,places) {
  if(input===undefined)return [];
  const bad=()=>{throw new Error('Invalid crime encounter in save.');};
  if(!Array.isArray(input)||input.length>4)bad();
  const residents=new Map(people.map(p=>[p.id,p])),used=new Set(),ids=new Set();
  return input.map(c=>{
    if(!c||typeof c!=='object'||Array.isArray(c)||typeof c.id!=='string'||!/^[-a-zA-Z0-9_]{1,200}$/.test(c.id)||ids.has(c.id)||!phases.has(c.phase)||!['knife','pistol'].includes(c.weapon))bad();
    ids.add(c.id);
    for(const id of [c.robberId,c.victimId,...(c.officerId?[c.officerId]:[])]){if(!residents.has(id)||used.has(id))bad();used.add(id);}
    if(c.robberId===c.victimId||residents.get(c.robberId).isChild||residents.get(c.victimId).isChild)bad();
    for(const [key,min,max]of [['x',0,100],['y',0,100],['elapsed',0,60],['age',0,60],['amount',0,1e12]])if(typeof c[key]!=='number'||!Number.isFinite(c[key])||c[key]<min||c[key]>max)bad();
    if(![-1,1].includes(c.side)||c.officerId!==null&&(typeof c.officerId!=='string'||!residents.has(c.officerId)))bad();
    if(['confront','aftermath'].includes(c.phase)?!outcomes.has(c.outcome):c.outcome!==null)bad();
    if((c.outcome==='surrendered'||c.outcome==='arrested'||c.outcome==='officer-down'||c.outcome==='robber-down'||c.phase==='respond')&&!c.officerId)bad();
    if(c.shotBy!==null&&![c.robberId,c.officerId].includes(c.shotBy)||c.shotTarget!==null&&![c.robberId,c.victimId,c.officerId].includes(c.shotTarget))bad();
    if(!!c.shotBy!==!!c.shotTarget||c.shotBy===c.shotTarget&&c.shotBy)bad();
    if(c.shotBy===c.robberId&&c.weapon!=='pistol'||c.outcome==='surrendered'&&c.shotBy)bad();
    if(!['confront','aftermath'].includes(c.phase)&&c.shotBy||c.phase!=='aftermath'&&c.amount!==0)bad();
    if(c.officerId&&(residents.get(c.officerId).isChild||!residents.get(c.officerId).job?.title?.includes('Police')))bad();
    const before={};
    for(const id of [c.robberId,c.victimId,...(c.officerId?[c.officerId]:[])]){
      const b=c.before?.[id];if(!b||typeof b.status!=='string'||!places.has(b.locationId))bad();
      before[id]={status:b.status.replace(/[<>&\u0000-\u001f]/g,'').slice(0,120),locationId:b.locationId};
    }
    return {id:c.id,robberId:c.robberId,victimId:c.victimId,officerId:c.officerId,phase:c.phase,elapsed:c.elapsed,age:c.age,weapon:c.weapon,x:c.x,y:c.y,side:c.side,outcome:c.outcome,amount:c.amount,shotBy:c.shotBy,shotTarget:c.shotTarget,before};
  });
}
