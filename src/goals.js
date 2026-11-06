import { gameConfig } from './constants.js';

// These are live community conditions, not historical achievements or paid rewards.
export function communityGoals(state, buildings) {
  const alive = state.people.filter(p => p.alive);
  const ids = new Set(alive.map(p => p.id));
  const homes = new Set(buildings.filter(b => b.type === 'home').map(b => b.id));
  const housed = alive.filter(p => homes.has(p.homeId)).length;
  const fed = alive.filter(p => p.hunger < 62).length;
  const happy = alive.filter(p => p.happiness >= 70).length;
  const friendships = Object.entries(state.relationships || {}).filter(([key,r]) => {
    const pair = key.split('|');
    return pair.length === 2 && pair[0] !== pair[1] && pair.every(id => ids.has(id)) &&
      !r.enemy && r.friendship >= gameConfig.friendThreshold;
  }).length;
  const make = (id,title,description,current,target,action,label) => ({id,title,description,current,target,
    progress: target ? Math.min(1,current/target) : 0,
    complete: target > 0 && current >= target, action,label});
  return [
    make('homes','A place for everyone','Every living resident has a home.',housed,alive.length,'residents','Meet the residents'),
    make('meals','A well-fed neighborhood','Keep every resident below 62 hunger. Watch orders move through the café.',fed,alive.length,'cafe','Watch the café'),
    make('happiness','Somewhere to belong','Help at least 80% of residents reach 70 happiness.',happy,Math.ceil(alive.length*.8),'residents','Check their needs'),
    make('friends','New connections','Let three friendships grow between living residents.',friendships,3,'square','Visit the square'),
  ];
}
export function renderCommunityGoals(state, buildings, actions) {
  const root = document.querySelector('#communityGoals');
  if (!root) return;
  const goals = communityGoals(state,buildings);
  const signature = goals.map(g=>`${g.id}:${g.current}:${g.target}`).join('|');
  if (root.dataset.signature === signature) return;
  root.dataset.signature = signature;
  root.replaceChildren(...goals.map(g => {
    const card = document.createElement('article');
    card.className = 'community-goal' + (g.complete ? ' is-met' : '');
    card.innerHTML = `<div class="goal-heading"><strong>${g.title}</strong><span>${g.complete?'Met now':'Growing'}</span></div><p>${g.description}</p><progress max="1" value="${g.progress}" aria-label="${g.title}"></progress><div class="goal-footer"><span>${g.current} / ${g.target}</span><button type="button">${g.label} →</button></div>`;
    card.querySelector('button').addEventListener('click',()=>actions[g.action]?.());
    return card;
  }));
}
