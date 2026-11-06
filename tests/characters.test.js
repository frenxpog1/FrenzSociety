import test from 'node:test';
import assert from 'node:assert/strict';
import { characterAppearance, characterBounds, drawCharacter, drawPortrait } from '../src/characters.js';
import { drawRoomActivity, drawRoomForeground } from '../src/scene-details.js';

const person = { id: 'resident-stable-42', alive: true, job: {title:'Analyst I'} };
test('appearance survives a save round trip and changes in simulation needs', () => {
  const restored = JSON.parse(JSON.stringify({...person, energy:0, hunger:99, money:200, ageDays:25000}));
  assert.deepEqual(characterAppearance(restored), characterAppearance(person));
  const cast = Array.from({length:30}, (_,i) => characterAppearance({...person,id:'person-'+i}));
  assert.ok(new Set(cast.map(a=>a.skin)).size >= 5);
  assert.ok(new Set(cast.map(a=>a.hairstyle)).size === 5);
  assert.equal(characterAppearance({...person,job:{title:'Cook III'}}).role,'cook');
});
test('foot-anchored picking bounds cover heads, seated feet, children and sleepers', () => {
  const adult = characterBounds(person), seated = characterBounds(person,'typing');
  const child = characterBounds({...person,isChild:true});
  assert.ok(adult.top < -32 && adult.top > -40 && adult.bottom > 0);
  assert.ok(seated.top > adult.top && seated.bottom >= 6);
  assert.ok(child.top > adult.top && child.right < adult.right);
  assert.ok(characterBounds({...person,alive:false}).top > -10);
  assert.ok(characterBounds(person,'sleeping').top > -25);
});
function context() {
  let saves = 0;
  const ctx = new Proxy({}, {get:(_,name)=>{
    if(name === 'save') return ()=>saves++;
    if(name === 'restore') return ()=>saves--;
    return (...args)=>{
      for(const arg of args) if(typeof arg === 'number') assert.ok(Number.isFinite(arg), name+' received a nonfinite coordinate');
      if(name === 'createLinearGradient') return {addColorStop(){}};
    };
  }});
  return {ctx, balanced:()=>assert.equal(saves,0)};
}
test('every character direction, uniform and activity renders with finite geometry and balanced transforms', () => {
  const {ctx,balanced} = context();
  for(const title of ['Analyst I','Cook I','Server I','Police Officer (Day)'])
    for(const facing of ['north','south','east','west'])
      for(const pose of ['idle','typing','studying','eating','sitting','sleeping','cooking','serving','waiting','reading','talking','frightened','surrender','threaten','aim'])
        for(const moving of [true,false]) {
          const p = {...person,job:{title}, serviceTask:'Cooking lunch',mealOrder:{stage:'served'}};
          drawCharacter(ctx,p,50,50,{facing,pose,moving,time:1.5,masked:pose==='threaten',weapon:pose==='threaten'?'knife':pose==='aim'?'pistol':null,firing:pose==='aim'});
          balanced();
        }
  drawPortrait({getContext:()=>ctx}, person);
  balanced();
  const actors = [{person,atStation:true,x:0,y:42,pose:'typing',facing:'north'}];
  drawRoomActivity(ctx,{type:'office'},actors,1.5,13);
  drawRoomForeground(ctx,{type:'office'},actors);
  balanced();
});
