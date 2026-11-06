import { drawPortrait } from "./characters.js";
import { followResident, locateResident } from './world.js';
import { personTargets } from './spaces.js';
import { residentActivity } from './activities.js';
import { mountWorld } from './world.js';
// Rendering and UI updates
import { buildings, gameConfig, jobs } from './constants.js';
import { formatHour, clamp } from './utils.js';
import { getPerson } from './people.js';
import { relationshipSummary, getRelationshipEntries } from './relationships.js';
import { buildingOccupancy, homeOccupancy } from './simulation.js';

export function getBuilding(id) {
  return buildings.find((building) => building.id === id);
}

export function renderStats(state, els) {
  const alive = state.people.filter((person) => person.alive);
  const averageMoney = alive.length
    ? Math.round(alive.reduce((total, person) => total + person.money, 0) / alive.length)
    : 0;
  const averageHappiness = alive.length
    ? Math.round(alive.reduce((total, person) => total + person.happiness, 0) / alive.length)
    : 0;
  const couples = Object.values(state.relationships).filter((relation) => relation.couple).length;
  const hud = document.querySelector("#hudStats");
  if (hud) hud.textContent = `${alive.length} residents · ${averageHappiness}% happy`;
  els.dayLabel.textContent = `Day ${state.day}`;
  els.timeLabel.textContent = formatHour(state.hour);
  els.aliveStat.textContent = alive.length;
  els.housedStat.textContent = alive.filter((person) => person.homeId).length;
  els.employedStat.textContent = alive.filter((person) => person.job).length;
  els.hungryStat.textContent = alive.filter((person) => person.hunger >= 62).length;
  els.moneyStat.textContent = `${averageMoney}`;
  els.happinessStat.textContent = `${averageHappiness}%`;
  els.couplesStat.textContent = couples;
  els.graveyardStat.textContent = (state.deaths || 0) + state.people.filter(p => !p.alive).length;
  
  if (els.kidsStat) els.kidsStat.textContent = alive.filter((person) => person.isChild).length;
  if (els.treasuryStat) els.treasuryStat.textContent = `$${Math.floor(state.townTreasury)}`;
  if (els.casinoStat) els.casinoStat.textContent = `$${Math.floor(state.casinoBankroll)}`;
  if (els.jailStat) els.jailStat.textContent = alive.filter((person) => person.jailHoursRemaining > 0).length;
}

export function renderMap(state, els, selectPersonFn, handlers) {
  mountWorld(els.townMap, state, selectPersonFn, handlers);
  const targets = getPersonTargets(state, els);
  for (const person of state.people) {
    const t = targets[person.id];
    if (!t) continue;
    const motion = state.motion[person.id] ?? { x: t.x, y: t.y, finalX:t.x, finalY:t.y, locationId:person.locationId, pose:t.pose, stationFacing:t.facing, route:[], wanderAt: 0 };
    motion.targetX ??= t.x;
    motion.targetY ??= t.y;
    state.motion[person.id] = motion;
  }
}

export function getPersonTargets(state) {
  return personTargets(state, buildings);
}

export function renderPeopleList(state, els, selectPersonFn) {
  els.peopleList.innerHTML = "";
  for (const person of state.people) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `person-card ${person.id === state.selectedId ? "selected" : ""} ${person.alive ? "" : "dead"}`;
    const age = Math.floor(person.ageDays / 365);
    const job = person.isChild ? "Child" : person.job?.title ?? "Job seeker";
    const needs = [["Hunger", person.hunger, "hunger"], ["Energy", person.energy, "energy"], ["Mood", person.happiness, "mood"]];
    card.innerHTML = `
      <div class="resident-identity">
        <canvas class="resident-avatar" aria-hidden="true"></canvas>
        <div><strong>${person.name}</strong><small>${job} · <span class="resident-age">${age} yrs</span></small></div>
        ${person.isChild ? "" : `<span class="resident-balance">$${Math.floor(person.money).toLocaleString("en-US")}</span>`}
      </div>
      <span class="resident-action">${residentActivity(state, person)}</span>
      ${person.alive ? `<div class="resident-needs">${needs.map(([label, raw, type]) => {
        const value = Math.round(raw);
        return `<div class="resident-need ${type}"><span>${label}</span><b>${value}%</b><i aria-hidden="true" style="--fill:${value}%"></i></div>`;
      }).join("")}</div>` : ""}
      ${person.sick || person.jailHoursRemaining > 0 ? `<div class="resident-alert">${person.sick ? "Sick" : ""}${person.sick && person.jailHoursRemaining > 0 ? " · " : ""}${person.jailHoursRemaining > 0 ? "In jail" : ""}</div>` : ""}
    `;
    drawPortrait(card.querySelector(".resident-avatar"), person);
    card.addEventListener("click", () => selectPersonFn(person.id));
    els.peopleList.appendChild(card);
  }
}

export function renderDetails(state, els, openFriendModalFn) {
  const person = state.people.find((candidate) => candidate.id === state.selectedId);
  if (!person) {
    els.personDetails.className = "person-details empty";
    els.personDetails.textContent = "Select a person on the map or in the list.";
    return;
  }

  const home = getBuilding(person.homeId);
  const location = getBuilding(person.locationId);
  const summary = relationshipSummary(state.people, state.relationships, person);
  const ageYears = Math.floor(person.ageDays / 365);
  
  // Get parent info for children
  let parentInfo = "";
  if (person.isChild && person.parentAId && person.parentBId) {
    const parentA = state.people.find(p => p.id === person.parentAId);
    const parentB = state.people.find(p => p.id === person.parentBId);
    if (parentA && parentB) {
      parentInfo = `<div class="detail-line"><span>Parents</span><strong>${parentA.name} & ${parentB.name}</strong></div>`;
    }
  }
  
  els.personDetails.className = "person-details";
  els.personDetails.innerHTML = `
    <div class="profile-identity"><canvas class="profile-portrait" aria-hidden="true"></canvas><div><span class="profile-kicker">WILLOW CREEK RESIDENT</span><div class="detail-name">${person.name}</div><p>${person.isChild ? "Child" : person.job?.title ?? "Resident"}</p></div></div>
    ${person.alive?'<div class="profile-actions"><button id="followResident">Follow resident</button><button id="locateResident">Find on map</button></div>':''}
    <div class="detail-line"><span>Status</span><strong id="liveActivity">${residentActivity(state,person)}</strong></div>
    <div class="detail-line"><span>Age</span><strong>${ageYears} ${person.isChild ? '(Child)' : ''}</strong></div>
    ${parentInfo}
    <div class="detail-line"><span>Home</span><strong>${home?.name ?? "None"}</strong></div>
    <div class="detail-line"><span>Destination</span><strong>${location?.name ?? "Unknown"}</strong></div>
    ${!person.isChild ? `<div class="detail-line"><span>Money</span><strong>${Math.floor(person.money)}</strong></div>` : ''}
    <div class="detail-line"><span>Gender</span><strong>${person.gender}</strong></div>
    ${!person.isChild ? `<div class="detail-line"><span>Partner</span><strong>${summary.partner?.name ?? "None"}</strong></div>` : ''}
    ${!person.isChild ? `<div class="detail-line"><span>Best Friend</span><strong>${summary.bestFriend ? `${summary.bestFriend.person.name} (${summary.bestFriend.relation.friendship})` : "None"}</strong></div>` : ''}
    <div class="detail-line"><span>Job</span><strong>${person.isChild ? 'Too young to work' : (person.job?.title ?? "Unemployed")}</strong></div>
    ${!person.isChild && person.job ? `<div class="detail-line"><span>Wage</span><strong>$${person.job.wage}/hour</strong></div>` : ''}
    ${!person.isChild && person.job && person.job.nextPromotion ? `<div class="detail-line"><span>Days Worked</span><strong>${person.daysWorked || 0}/${jobs.find(j => j.name === person.job.title)?.daysToPromote || '?'} (Next: ${person.job.nextPromotion})</strong></div>` : ''}
    ${!person.isChild && person.job && !person.job.nextPromotion ? `<div class="detail-line"><span>Rank</span><strong>MAX LEVEL ⭐</strong></div>` : ''}
    <div class="detail-line"><span>Health</span><strong>${person.sick ? `Sick for ${person.sickHours} hours` : "Healthy"}</strong></div>
    ${person.jailHoursRemaining > 0 ? `<div class="detail-line"><span>Jail Time</span><strong style="color: #ff4444;">${person.jailHoursRemaining} hours remaining</strong></div>` : ''}
    ${!person.isChild && person.robberyConfidence > 0 ? `<div class="detail-line"><span>Robbery Confidence</span><strong style="color: #ff8800;">${person.robberyConfidence}/20</strong></div>` : ''}
    <div class="detail-line"><span>Trait</span><strong>${person.trait}</strong></div>
    <div class="detail-line"><span>Skill</span><strong>${person.skill}</strong></div>
    <div class="detail-line"><span>Hunger</span><strong>${Math.round(person.hunger)}%</strong></div>
    <div class="meter hunger"><span style="width: ${person.hunger}%"></span></div>
    <div class="detail-line"><span>Energy</span><strong>${Math.round(person.energy)}%</strong></div>
    <div class="meter energy"><span style="width: ${person.energy}%"></span></div>
    <div class="detail-line"><span>Happiness</span><strong>${Math.round(person.happiness)}%</strong></div>
    <div class="meter happiness"><span style="width: ${person.happiness}%"></span></div>
    ${!person.isChild ? `<div class="detail-line"><span>Depressed Hours</span><strong>${person.depressedHours}</strong></div>` : ''}
    ${!person.isChild ? `<button id="openFriendModal" class="wide-button" type="button">View Friends (${summary.friendCount})</button>` : ''}
  `;

  drawPortrait(els.personDetails.querySelector(".profile-portrait"), person);
  document.querySelector('#followResident')?.addEventListener('click',()=>{followResident(person.id);document.querySelector('#closeDrawer').click();});
  document.querySelector('#locateResident')?.addEventListener('click',()=>{locateResident(person.id);document.querySelector('#closeDrawer').click();});
  if (!person.isChild) {
    document
      .querySelector("#openFriendModal")
      ?.addEventListener("click", () => openFriendModalFn(person.id));
  }
}

export function renderConversations(state, els) {
  els.conversationList.innerHTML = "";
  if (state.conversations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "conversation empty";
    empty.textContent = "People will talk here when they meet during free time.";
    els.conversationList.appendChild(empty);
    return;
  }

  state.conversations.forEach((conversation) => {
    const item = document.createElement("article");
    item.className = "conversation";
    item.innerHTML = `
      <span>${conversation.stamp} · ${conversation.people}</span>
      ${conversation.lines
        .map((line) => `<p><strong>${line.speaker}:</strong> ${line.text}</p>`)
        .join("")}
    `;
    els.conversationList.appendChild(item);
  });
}

export function renderLog(state, els) {
  els.eventLog.innerHTML = "";
  state.eventLog.forEach((event) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${event.stamp}</strong> ${event.message}`;
    els.eventLog.appendChild(item);
  });
}

export function buildRelationshipRow(other, relation, modal) {
  const tags = [
    relation.enemy ? "Enemy" : null,
    relation.couple ? "Couple" : null,
    relation.crush && !relation.couple ? "Crush" : null,
    relation.close ? "Close friend" : null,
    relation.friendship >= gameConfig.friendThreshold && !relation.close && !relation.enemy ? "Friend" : null,
    relation.friendship < gameConfig.friendThreshold && !relation.enemy ? "Acquaintance" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const rowTag = modal ? "button" : "div";
  const actionAttrs = modal ? `type="button" data-select-person="${other.id}"` : "";

  return `
    <${rowTag} class="relation-row ${modal ? "clickable" : ""}" ${actionAttrs}>
      <div>
        <strong>${other.name}</strong>
        <small>${other.gender} · ${tags}</small>
      </div>
      <span>Status: ${other.status}</span>
      <span>Friendship ${relation.friendship}/100</span>
      <div class="mini-meter"><i style="width: ${relation.friendship}%"></i></div>
      <span>Romance ${relation.romance}/100</span>
      <div class="mini-meter romance"><i style="width: ${relation.romance}%"></i></div>
      <span>Conflict ${relation.conflict}/100</span>
      <div class="mini-meter conflict"><i style="width: ${relation.conflict}%"></i></div>
    </${rowTag}>
  `;
}
