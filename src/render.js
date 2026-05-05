// Rendering and UI updates
import { buildings, gameConfig } from './constants.js';
import { formatHour, clamp } from './utils.js';
import { getPerson } from './people.js';
import { relationshipSummary, getRelationshipEntries } from './relationships.js';
import { buildingOccupancy } from './simulation.js';

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
  els.dayLabel.textContent = `Day ${state.day}`;
  els.timeLabel.textContent = formatHour(state.hour);
  els.aliveStat.textContent = alive.length;
  els.housedStat.textContent = alive.filter((person) => person.homeId).length;
  els.employedStat.textContent = alive.filter((person) => person.job).length;
  els.hungryStat.textContent = alive.filter((person) => person.hunger >= 62).length;
  els.moneyStat.textContent = `${averageMoney}`;
  els.happinessStat.textContent = `${averageHappiness}%`;
  els.couplesStat.textContent = couples;
  
  if (els.kidsStat) els.kidsStat.textContent = alive.filter((person) => person.isChild).length;
  if (els.treasuryStat) els.treasuryStat.textContent = `$${Math.floor(state.townTreasury)}`;
}

export function renderMap(state, els, selectPersonFn) {
  const selected = state.selectedId;
  const targets = getPersonTargets(state, els);
  els.townMap.innerHTML = `
    <div class="road horizontal"></div>
    <div class="road vertical"></div>
  `;

  buildings.forEach((building) => {
    const node = document.createElement("div");
    node.className = `building ${building.type}`;
    node.style.left = `${building.x}%`;
    node.style.top = `${building.y}%`;
    node.style.transform = "translate(-50%, -50%)";
    const meta =
      building.type === "home"
        ? `${buildingOccupancy(state.people, building.id)}/${building.capacity} people, ${building.beds} bed`
        : `${buildingOccupancy(state.people, building.id)} people`;
    node.innerHTML = `<strong>${building.name}</strong><span>${meta}</span>`;
    els.townMap.appendChild(node);
  });

  state.people.forEach((person) => {
    const target = targets[person.id];
    if (!target) return;
    const speech = state.speech[person.id];
    if (speech && speech.expiresAt <= performance.now()) {
      delete state.speech[person.id];
    }
    const motion = state.motion[person.id] ?? {
      x: target.x,
      y: target.y,
      targetX: target.x,
      targetY: target.y,
      wanderAt: performance.now() + Math.random() * 2000,
    };
    motion.targetX = target.x;
    motion.targetY = target.y;
    state.motion[person.id] = motion;

    const token = document.createElement("button");
    token.type = "button";
    token.className = `person-token ${person.status.toLowerCase().replaceAll(" ", "-")} ${
      person.hunger >= 70 ? "hungry" : ""
    } ${person.happiness <= 20 ? "depressed" : ""} ${person.sick ? "sick" : ""} ${
      !person.alive ? "dead" : ""
    } ${person.id === selected ? "selected" : ""}`;
    token.dataset.personId = person.id;
    token.style.left = `${motion.x}%`;
    token.style.top = `${motion.y}%`;
    token.textContent = person.name[0];
    token.title = `${person.name}: ${person.status}`;
    token.addEventListener("click", () => selectPersonFn(person.id));
    els.townMap.appendChild(token);

    if (state.speech[person.id]) {
      const bubble = document.createElement("div");
      bubble.className = `speech-bubble ${motion.y < 22 ? "below" : ""} ${
        motion.x < 18 ? "align-left" : ""
      } ${motion.x > 82 ? "align-right" : ""}`;
      bubble.dataset.speechFor = person.id;
      bubble.textContent = state.speech[person.id].text;
      bubble.style.left = `${motion.x}%`;
      bubble.style.top = `${motion.y}%`;
      els.townMap.appendChild(bubble);
    }
  });
}

export function getPersonTargets(state, els) {
  const targets = {};
  const locationCounts = new Map();
  const rect = els.townMap.getBoundingClientRect();
  const width = rect.width || 900;
  const height = rect.height || 590;

  state.people.forEach((person) => {
    const building = getBuilding(person.locationId);
    if (!building) return;
    const count = locationCounts.get(person.locationId) ?? 0;
    locationCounts.set(person.locationId, count + 1);
    const offset = getOffset(count);
    targets[person.id] = {
      x: clamp(building.x + (offset.x / width) * 100, 2, 98),
      y: clamp(building.y + (offset.y / height) * 100, 2, 98),
    };
  });

  return targets;
}

function getOffset(index) {
  const positions = [
    { x: -28, y: -36 },
    { x: 0, y: -38 },
    { x: 28, y: -36 },
    { x: -34, y: -8 },
    { x: 34, y: -8 },
    { x: -24, y: 28 },
    { x: 0, y: 32 },
    { x: 24, y: 28 },
  ];
  return positions[index % positions.length];
}

export function renderPeopleList(state, els, selectPersonFn) {
  els.peopleList.innerHTML = "";
  state.people.forEach((person) => {
    const summary = relationshipSummary(state.people, state.relationships, person);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `person-card ${person.id === state.selectedId ? "selected" : ""} ${
      person.alive ? "" : "dead"
    }`;
    
    const ageYears = Math.floor(person.ageDays / 365);
    const jobInfo = person.isChild ? "Child" : (person.job?.title ?? "No job");
    
    card.innerHTML = `
      <strong>${person.name}</strong>
      <span>${person.status} · Age ${ageYears}</span>
      <div class="chips">
        <b class="chip">${person.trait}</b>
        <b class="chip">${person.gender}</b>
        <b class="chip">${person.skill}</b>
        <b class="chip">${jobInfo}</b>
        ${!person.isChild ? `<b class="chip">${Math.floor(person.money)}</b>` : ''}
        <b class="chip">${Math.round(person.happiness)}% happy</b>
        ${summary.partner ? `<b class="chip love">With ${summary.partner.name}</b>` : ""}
        ${summary.closeCount ? `<b class="chip friend">${summary.closeCount} close</b>` : ""}
        ${person.sick ? '<b class="chip danger">Sick</b>' : ""}
        ${person.isChild ? '<b class="chip" style="background: #e7d4f5; color: #6b2d8f;">Child</b>' : ""}
      </div>
      <span>Hunger ${Math.round(person.hunger)} · Energy ${Math.round(person.energy)} · Missed meals ${person.mealsMissed}</span>
    `;
    card.addEventListener("click", () => selectPersonFn(person.id));
    els.peopleList.appendChild(card);
  });
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
    <div class="detail-name">${person.name}</div>
    <div class="detail-line"><span>Status</span><strong>${person.status}</strong></div>
    <div class="detail-line"><span>Age</span><strong>${ageYears} ${person.isChild ? '(Child)' : ''}</strong></div>
    ${parentInfo}
    <div class="detail-line"><span>Home</span><strong>${home?.name ?? "None"}</strong></div>
    <div class="detail-line"><span>Current Place</span><strong>${location?.name ?? "Unknown"}</strong></div>
    ${!person.isChild ? `<div class="detail-line"><span>Money</span><strong>${Math.floor(person.money)}</strong></div>` : ''}
    <div class="detail-line"><span>Gender</span><strong>${person.gender}</strong></div>
    ${!person.isChild ? `<div class="detail-line"><span>Partner</span><strong>${summary.partner?.name ?? "None"}</strong></div>` : ''}
    ${!person.isChild ? `<div class="detail-line"><span>Best Friend</span><strong>${summary.bestFriend ? `${summary.bestFriend.person.name} (${summary.bestFriend.relation.friendship})` : "None"}</strong></div>` : ''}
    <div class="detail-line"><span>Job</span><strong>${person.isChild ? 'Too young to work' : (person.job?.title ?? "Unemployed")}</strong></div>
    ${!person.isChild && person.job ? `<div class="detail-line"><span>Wage</span><strong>${person.job.wage}/hour</strong></div>` : ''}
    <div class="detail-line"><span>Health</span><strong>${person.sick ? `Sick for ${person.sickHours} hours` : "Healthy"}</strong></div>
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
