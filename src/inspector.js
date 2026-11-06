import { homeStyles, setHomeStyle } from "./home-design.js";
import { buildings } from './constants.js';
import { toPixels } from './layout.js';
import { deskSlots, cafe, roomSize } from './spaces.js';
import { activityText } from './activities.js';

const descriptions = {
  home: ['HOME', 'Kitchen, living room, and a place to rest.'],
  office: ['WORKPLACE', 'Desks, computers, and a shared workspace.'],
  restaurant: ['CAFÉ', 'Orders at the counter, meals from the kitchen.'],
  school: ['EDUCATION', 'A classroom for the next generation.'],
  church: ['COMMUNITY', 'A quiet place to come together.'],
  hospital: ['HEALTHCARE', 'Care and recovery for the neighborhood.'],
  police: ['PUBLIC SAFETY', 'The town’s police station.'],
  jail: ['PUBLIC SAFETY', 'Residents serving their sentence.'],
  square: ['PUBLIC SPACE', 'An open space for a break and a conversation.'],
  casino: ['LEISURE', 'Games, drinks, and a little risk.'],
  graveyard: ['MEMORIAL', 'A place to remember past residents.'],
};
export function buildingSummary(building, state) {
  const alive = state.people.filter(p => p.alive);
  const [w, h] = roomSize(building), center = toPixels(building);
  const visitors = alive.map(person => {
    const m = state.motion[person.id];
    const point = m && toPixels(m);
    const inside = !!point && Math.abs(point.x - center.x) <= w / 2 && Math.abs(point.y - center.y) <= h / 2;
    const leaving = person.locationId !== building.id;
    const positioning = m && Number.isFinite(m.finalX) && Number.isFinite(m.finalY) && Math.hypot(m.x - m.finalX, m.y - m.finalY) > .65;
    return { person, inside, action: inside ? (leaving ? 'Leaving for ' + (buildings.find(b => b.id === person.locationId)?.name || 'town') : positioning ? 'Getting into position' : activityText(person)) : 'On the way' };
  }).filter(v => v.inside || v.person.locationId === building.id && v.person.status !== 'On Patrol');
  const assigned = alive.filter(p => building.type === 'home' ? p.homeId === building.id : p.job?.building === building.id);
  const present = visitors.filter(v => v.inside).length;
  const facts = [['Inside now', present], ['On the way', visitors.length - present]];
  if (building.type === 'home') facts.push(['Residents', assigned.length], ['Housing capacity', building.capacity ?? 2]);
  else if (building.type === 'restaurant') {
    facts.push(['Dining seats', cafe.seats.length], ['Active orders', visitors.filter(v => v.person.mealOrder).length]);
  } else if (['office', 'school'].includes(building.type)) {
    facts.push([building.type === 'office' ? 'Workstations' : 'Student desks', deskSlots(building).length], ['Staff assigned', assigned.length]);
    if(building.type==='office')facts.push(['Job openings',Math.max(0,(building.jobs||0)-assigned.length)]);
  } else if (['hospital', 'police'].includes(building.type)) facts.push(['Staff assigned', assigned.length]);
  const [category, description] = descriptions[building.type] || ['BUILDING', 'Part of the neighborhood.'];
  return { category, description, facts, visitors, assigned };
}

let displayedBuilding = null;
export function renderBuildingInspector(state, onSelect) {
  const b = buildings.find(b => b.id === state.inspectedBuildingId);
  if (!b) return;
  const root = document.querySelector('#buildingDetails');
  if (!root) return;
  if (displayedBuilding !== b.id || !root.querySelector('.building-visitors')) {
    displayedBuilding = b.id;
    root.innerHTML = `<div class="section-heading"><span class="building-category"></span><h2 class="building-name"></h2><p class="building-description"></p></div><div class="home-design-controls" hidden><label>Interior finishes<select aria-label="Interior finishes"></select></label><small>Free sandbox styling · saved with this home</small></div><div class="building-facts"></div><h3>Here &amp; arriving</h3><p class="building-empty">Nobody here right now. Residents will visit as their day unfolds.</p><div class="building-visitors"></div><h3 class="assigned-heading">Assigned here</h3><p class="building-assigned"></p>`;
  }
  const design = root.querySelector('.home-design-controls');
  design.hidden = b.type !== 'home';
  if (b.type === 'home') {
    const select = design.querySelector('select');
    if (select.dataset.home !== b.id) {
      select.innerHTML = Object.entries(homeStyles).map(([id,style])=>`<option value="${id}">${style.label}</option>`).join('');
      select.dataset.home = b.id;
      select.addEventListener('change',()=>setHomeStyle(b,select.value));
    }
    select.value = b.interiorStyle || 'willow';
  }
  const summary = buildingSummary(b, state);
  root.querySelector('.building-category').textContent = summary.category;
  root.querySelector('.building-name').textContent = b.name;
  root.querySelector('.building-description').textContent = summary.description;
  const facts = root.querySelector('.building-facts');
  if (facts.children.length !== summary.facts.length) {
    facts.replaceChildren(...summary.facts.map(() => {
      const item = document.createElement('div');
      item.innerHTML = '<span></span><strong></strong>';
      return item;
    }));
  }
  summary.facts.forEach(([label, value], i) => {
    facts.children[i].querySelector('span').textContent = label;
    facts.children[i].querySelector('strong').textContent = value;
  });
  const list = root.querySelector('.building-visitors');
  const signature = summary.visitors.map(v => v.person.id).join(',');
  if (list.dataset.people !== signature) {
    list.dataset.people = signature;
    list.replaceChildren(...summary.visitors.map(({ person }) => {
      const button = document.createElement('button');
      button.className = 'building-person';
      button.innerHTML = '<span class="presence-dot"></span><span><strong></strong><small></small></span><svg class="profile-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>';
      button.addEventListener('click', () => onSelect(person.id));
      return button;
    }));
  }
  summary.visitors.forEach(({ person, inside, action }, i) => {
    const button = list.children[i];
    button.querySelector('strong').textContent = person.name;
    button.querySelector('small').textContent = action;
    button.classList.toggle('arriving', !inside);
  });
  root.querySelector('.building-empty').hidden = summary.visitors.length > 0;
  root.querySelector('.assigned-heading').textContent = b.type === 'home' ? 'Lives here' : 'Staff';
  root.querySelector('.building-assigned').textContent = summary.assigned.map(p => p.name).join(', ') || (b.type === 'home' ? 'This home is available.' : 'No staff assigned.');
  const hasAssignments = ['home', 'office', 'restaurant', 'school', 'police', 'hospital'].includes(b.type);
  root.querySelector('.assigned-heading').hidden = !hasAssignments;
  root.querySelector('.building-assigned').hidden = !hasAssignments;
}

export function renderBuildingDirectory() {
  const select = document.querySelector('#buildingSelect');
  if (!select) return;
  const signature = buildings.map(b => `${b.id}:${b.name}`).join('|');
  if (select.dataset.buildings === signature) return;
  select.dataset.buildings = signature;
  const options = [Object.assign(document.createElement('option'), { value: '', textContent: 'Choose a building…' }),
    ...buildings.map(b => Object.assign(document.createElement('option'), { value: b.id, textContent: b.name }))];
  select.replaceChildren(...options);
}
