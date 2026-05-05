// Main application entry point
import { gameConfig, buildings, jobs } from './constants.js';
import { formatHour, clamp, randomItem } from './utils.js';
import { state, initializeElements } from './state.js';
import { createPeople, getPerson, createChild } from './people.js';
import { getRelationship, getRelationshipEntries } from './relationships.js';
import { updatePerson, getBuilding } from './simulation.js';
import { shouldArgue, updateRelationship, chooseConversationTopic, conversationLinesForTopic } from './interactions.js';
import { renderStats, renderMap, renderPeopleList, renderDetails, renderConversations, renderLog, buildRelationshipRow } from './render.js';
import { animatePeople } from './animation.js';

// Initialize DOM elements
let els;

// Event logging
function addLog(message) {
  const stamp = `Day ${state.day}, ${formatHour(state.hour)}`;
  state.eventLog.unshift({ stamp, message });
  state.eventLog = state.eventLog.slice(0, 40);
}

// Conversation management
function addConversation(personA, personB, lines) {
  const stamp = `Day ${state.day}, ${formatHour(state.hour)}`;
  const now = performance.now();
  const expiresAt = now + 9500;
  state.nextConversationAt = now + Math.max(6500, 11000 / Math.sqrt(state.speed));
  state.conversations.unshift({
    stamp,
    people: `${personA.name} and ${personB.name}`,
    lines,
  });
  state.speech[personA.id] = { text: lines.at(-2).text, expiresAt };
  state.speech[personB.id] = { text: lines.at(-1).text, expiresAt };
  state.conversations = state.conversations.slice(0, 30);
}

function rememberTopic(personId, topic) {
  const recent = state.recentTopics[personId] ?? [];
  state.recentTopics[personId] = [topic, ...recent.filter((item) => item !== topic)].slice(0, 4);
}

function makeConversation(personA, personB, place, relation, argued = false) {
  const topic = argued ? "argument" : chooseConversationTopic(personA, personB, place, relation, state.recentTopics);
  const lines = conversationLinesForTopic(topic, personA, personB, place, relation);
  return { topic, lines };
}

function visibleSpeechCount() {
  const now = performance.now();
  return Object.values(state.speech).filter((speech) => speech.expiresAt > now).length;
}

// Simulation control
function resetSimulation() {
  state.hour = 6;
  state.day = 1;
  state.deathAge = Number(els.deathAge.value);
  state.populationSize = Number(els.populationSize.value);
  state.people = createPeople(clamp(state.populationSize, 10, 15));
  state.relationships = {};
  state.motion = {};
  state.speech = {};
  state.recentTopics = {};
  state.nextConversationAt = performance.now() + 2500;
  state.selectedId = state.people[0]?.id ?? null;
  state.eventLog = [];
  state.conversations = [];
  addLog(`${state.people.length} humans moved into 10 houses.`);
  addLog(`The town opened 2 offices, 1 restaurant, and meals cost ${gameConfig.mealCost}.`);
  render();
}

function advanceHour(skipRender = false) {
  state.hour += 1;
  if (state.hour >= 24) {
    state.hour = 0;
    state.day += 1;
    state.people = state.people.map((person) => {
      let money = person.money;
      if (!person.isChild && person.alive) {
        if (money >= 20) {
          money -= 20; // $15 rent + $5 tax
          state.townTreasury += 20;
        } else {
          state.townTreasury += money;
          money = 0;
        }
      }
      return {
        ...person,
        ageDays: person.ageDays + 91, // People age 1/4th of a year per day so kids grow up!
        talkedToday: 0,
        money
      };
    });
    
    // Check for pregnancies once per day
    checkPregnancies();
    
    // Check if anyone needs and can afford a new house
    state.people.forEach(person => {
      // If adult and they have more than 250 money, they might buy a house
      if (!person.isChild && person.money >= 250) {
        // Find if they share a house with an ex, or just want to move out from parents
        const home = buildings.find(b => b.id === person.homeId);
        const occupants = state.people.filter(p => p.alive && p.homeId === person.homeId);
        
        // If crowded or sharing with parents
        const crowded = home && occupants.length > home.capacity; // changed to > capacity to allow max capacity
        const sharingWithParents = occupants.some(p => 
          p.id === person.parentAId || 
          p.id === person.parentBId
        );

        if (crowded || sharingWithParents) {
          buyHouse(person);
        }
      }
    });

    // Autonomous town expansion if heavily crowded and no one bought a house
    const totalCapacity = buildings.filter(b => b.type === "home").reduce((sum, b) => sum + b.capacity, 0);
    const totalAlive = state.people.filter(p => p.alive).length;
    if (totalAlive >= totalCapacity) {
      const house = addBuilding("home");
      if (house) addLog(`The town expanded! A new house was built automatically for the growing population.`);
    }
  }

  const oldAlive = state.people.filter(p => p.alive).map(p => p.id);
  
  let jackpotEvent = null;
  state.people = state.people.map((person) => {
    const updated = updatePerson(person, state, addLog);
    if (updated.modalEvent) {
      jackpotEvent = updated.modalEvent;
      delete updated.modalEvent;
    }
    return updated;
  });
  
  const newAlive = state.people.filter(p => p.alive).map(p => p.id);
  const justDiedIds = oldAlive.filter(id => !newAlive.includes(id));

  let funeralHappened = false;
  if (justDiedIds.length > 0) {
    const graveyard = buildings.find(b => b.type === "graveyard");
    if (graveyard) {
      for (const deadId of justDiedIds) {
        const deadPerson = state.people.find(p => p.id === deadId);
        if (!deadPerson) continue;
        
        // Find friends
        const friendIds = state.people.filter(p => {
          if (!p.alive || p.id === deadId) return false;
          const rel = state.relationships[`${deadId}|${p.id}`] || state.relationships[`${p.id}|${deadId}`];
          return rel && rel.friendship >= gameConfig.friendThreshold;
        }).map(p => p.id);

        if (friendIds.length > 0) {
          state.people = state.people.map(p => {
            if (friendIds.includes(p.id)) {
              return { ...p, locationId: graveyard.id, status: "Mourning", happiness: Math.max(0, p.happiness - 30) };
            }
            return p;
          });
          triggerEvent("Town Mourns", `🪦 ${deadPerson.name} has passed away (${deadPerson.status}). Their friends have gathered at the Graveyard to mourn.`);
          funeralHappened = true;
        } else {
          triggerEvent("Death", `☠️ ${deadPerson.name} has passed away alone (${deadPerson.status}).`);
          funeralHappened = true;
        }
      }
    }
  }

  const interactionEvent = processInteractions(skipRender);
  const hasEvent = interactionEvent || funeralHappened || !!jackpotEvent;
  
  if (jackpotEvent && !funeralHappened && !interactionEvent) {
    triggerEvent(jackpotEvent.title, jackpotEvent.message);
  }
  
  if (!skipRender) render();
  return hasEvent;
}

function advanceDay() {
  for (let i = 0; i < 24; i++) {
    const hasEvent = advanceHour(true);
    if (hasEvent) {
      break; // Stop skipping if a major event occurs
    }
  }
  render();
}

function triggerEvent(title, message) {
  state.running = false;
  els.toggleRun.textContent = "Resume";
  els.eventModalTitle.textContent = title;
  els.eventModalBody.innerHTML = `<p>${message}</p>`;
  els.eventModal.hidden = false;
  render();
}

function checkPregnancies() {
  const couples = Object.entries(state.relationships)
    .filter(([, relation]) => relation.couple)
    .map(([key]) => {
      const [idA, idB] = key.split("|");
      return { personA: getPerson(state.people, idA), personB: getPerson(state.people, idB) };
    })
    .filter(({ personA, personB }) => personA?.alive && personB?.alive);

  couples.forEach(({ personA, personB }) => {
    const ageA = Math.floor(personA.ageDays / 365);
    const ageB = Math.floor(personB.ageDays / 365);
    
    if (Math.random() < gameConfig.pregnancyChance) {
      const homeId = personA.homeId;
        const home = buildings.find(b => b.id === homeId);
        const occupants = state.people.filter(p => p.alive && p.homeId === homeId).length;

        // Check if there is enough space
        if (home && occupants >= home.capacity) {
          // If no space, check if they can afford an upgrade
          if (personA.money >= 150) {
            personA.money -= 150;
            home.capacity += 2;
            home.beds += 1;
            addLog(`${personA.name} paid $150 to upgrade their home for a new baby!`);
          } else if (personB.money >= 150) {
            personB.money -= 150;
            home.capacity += 2;
            home.beds += 1;
            addLog(`${personB.name} paid $150 to upgrade their home for a new baby!`);
          } else {
            // Cannot afford upgrade, cancel pregnancy
            return;
          }
        }

        const child = createChild(personA, personB, state);
        state.people.push(child);
        addLog(`${personA.name} and ${personB.name} had a baby named ${child.name}!`);
      }
  });
}

function processInteractions(force = false) {
  const now = performance.now();
  if (!force && (now < state.nextConversationAt || visibleSpeechCount() >= 2)) return;

  const socialPlaces = buildings.map((building) => building.id);
  const canTalk = state.people.filter(
    (person) =>
      person.alive &&
      socialPlaces.includes(person.locationId) &&
      ![
        "Sleeping",
        "Sick in bed",
        "Died of old age",
        "Died from hunger",
        "Died from sickness",
      ].includes(person.status) &&
      person.talkedToday < 6,
  );

  const occupiedPlaces = socialPlaces
    .map((placeId) => ({
      placeId,
      group: canTalk.filter((person) => person.locationId === placeId),
    }))
    .filter((entry) => entry.group.length >= 2);

  if (occupiedPlaces.length === 0) return;

  const orderedPlaces = occupiedPlaces.sort(() => Math.random() - 0.5);

  for (const { placeId, group } of orderedPlaces) {
    const place = getBuilding(placeId);
    if (!place) continue;
    
    const talkChance = place.type === "home" ? 0.35 : place.type === "office" ? 0.4 : 0.7;
    if (Math.random() > talkChance) continue;

    const first = randomItem(group);
    const second = randomItem(group.filter((person) => person.id !== first.id));
    if (!second) return;

    const willArgue = shouldArgue(first, second, place, state.relationships);
    const { relation, updatedPeople, event } = updateRelationship(first, second, place, willArgue, state.relationships, state.people, addLog);
    state.people = updatedPeople;
    
    if (event) {
      triggerEvent(event.title, event.message);
      return true; // Indicate that an event happened to stop skips
    }
    
    const conversation = makeConversation(first, second, place, relation, willArgue);

    state.people = state.people.map((person) => {
      if (person.id !== first.id && person.id !== second.id) return person;
      const recovered = person.sick && person.happiness + 12 >= 50 && Math.random() < 0.25;
      return {
        ...person,
        status: willArgue ? "Arguing" : "Talking",
        talkedToday: person.talkedToday + 1,
        energy: clamp(person.energy - 1, 0, 100),
        happiness: clamp(person.happiness + (willArgue ? -10 : 12), 0, 100),
        depressedHours: willArgue
          ? person.depressedHours + 1
          : Math.max(0, person.depressedHours - 3),
        sick: recovered ? false : person.sick,
        sickHours: recovered ? 0 : person.sickHours,
      };
    });

    rememberTopic(first.id, conversation.topic);
    rememberTopic(second.id, conversation.topic);
    addConversation(first, second, conversation.lines);
    addLog(`${first.name} talked with ${second.name} at ${place.name}.`);
    break;
  }
}

// Rendering
function render() {
  renderStats(state, els);
  renderMap(state, els, selectPerson);
  renderPeopleList(state, els, selectPerson);
  renderDetails(state, els, openFriendModal);
  renderConversations(state, els);
  renderLog(state, els);
}

function selectPerson(id) {
  state.selectedId = id;
  render();
}

// Modal management
function openFriendModal(personId) {
  const person = getPerson(state.people, personId);
  if (!person) return;
  els.friendModalTitle.textContent = `${person.name}'s Friend List`;
  
  const entries = getRelationshipEntries(state.people, state.relationships, person);
  const relationshipHTML = entries.length === 0
    ? '<p class="relation-empty">No friends yet. They need to talk to people first.</p>'
    : entries.map(({ other, relation }) => buildRelationshipRow(other, relation, true)).join("");
  
  els.friendModalBody.innerHTML = `
    <div class="modal-summary">
      <span>${person.gender}</span>
      <span>${person.partnerId ? `Partner: ${getPerson(state.people, person.partnerId)?.name ?? "Unknown"}` : "No partner"}</span>
    </div>
    <div class="friend-list modal-list">
      ${relationshipHTML}
    </div>
  `;
  els.friendModal.hidden = false;

  els.friendModalBody.querySelectorAll("[data-select-person]").forEach((button) => {
    button.addEventListener("click", () => {
      selectPerson(button.dataset.selectPerson);
      closeFriendModal();
    });
  });
}

function closeFriendModal() {
  els.friendModal.hidden = true;
}

// Scheduling
function scheduleTick() {
  if (state.tickTimer) {
    window.clearInterval(state.tickTimer);
  }
  const minute = 60_000;
  const delay = minute / state.speed;
  state.tickTimer = window.setInterval(() => {
    if (state.running) {
      advanceHour();
    }
  }, delay);
}

function scheduleSocialTick() {
  if (state.socialTimer) {
    window.clearInterval(state.socialTimer);
  }
  const delay = Math.max(1200, 8000 / state.speed);
  state.socialTimer = window.setInterval(() => {
    if (state.running) {
      processInteractions();
      render();
    }
  }, delay);
}

// Predefined slots for new buildings to ensure the town looks good
const predefinedSlots = {
  office: [
    { x: 22, y: 29 },
    { x: 78, y: 29 },
    { x: 22, y: 72 },
    { x: 78, y: 72 },
  ],
  school: [
    { x: 50, y: 12 }, // Perfect top-middle spot (fills gap between House 3 and 4)
    { x: 50, y: 88 }, // Bottom-middle spot
  ],
  church: [
    { x: 50, y: 90 }, // Bottom-middle spot
  ],
  home: [
    { x: 36, y: 29 }, // Between Office 3 and Town Square
    { x: 64, y: 29 }, // Between Office 4 and Town Square
    { x: 36, y: 50 }, // On horizontal road, between Office A and intersection
    { x: 64, y: 50 }, // On horizontal road, between Office B and intersection
    { x: 36, y: 72 }, // Between Office 5 and Restaurant
    { x: 64, y: 72 }, // Between Office 6 and Restaurant
    { x: 8, y: 32 },  // Far left middle-top
    { x: 92, y: 32 }, // Far right middle-top
    { x: 8, y: 68 },  // Far left middle-bottom
    { x: 92, y: 68 }, // Far right middle-bottom
  ]
};

function getPredefinedPos(type) {
  const slots = predefinedSlots[type] || [];
  for (const slot of slots) {
    // Check if slot is already taken by any building
    const isTaken = buildings.some(b => Math.abs(b.x - slot.x) < 5 && Math.abs(b.y - slot.y) < 5);
    if (!isTaken) return slot;
  }
  // Fallback to random if all predefined slots are taken
  for (let i = 0; i < 50; i++) {
    const x = 10 + Math.floor(Math.random() * 80);
    const y = 10 + Math.floor(Math.random() * 80);
    const overlap = buildings.some(b => Math.abs(b.x - x) < 12 && Math.abs(b.y - y) < 12);
    if (!overlap) return { x, y };
  }
  return { x: 10 + Math.floor(Math.random() * 80), y: 10 + Math.floor(Math.random() * 80) };
}

function addBuilding(type) {
  const { x, y } = getPredefinedPos(type);
  let addedBuilding = null;
  
  if (type === "home") {
    const count = buildings.filter(b => b.type === "home").length + 1;
    addedBuilding = {
      id: `house-${count + Date.now()}`,
      type: "home",
      name: `House ${count}`,
      beds: 1,
      capacity: 2,
      x, y
    };
    buildings.push(addedBuilding);
    addLog(`A new house was built!`);
  } else if (type === "office") {
    const count = buildings.filter(b => b.type === "office").length + 1;
    const officeId = `office-${count + Date.now()}`;
    buildings.push({
      id: officeId,
      type: "office",
      name: `Office ${count}`,
      jobs: 4,
      x, y
    });
    jobs.push(
      { name: `Clerk ${count}`, building: officeId, starts: 9, ends: 17, wage: 16 }
    );
    addLog(`A new office was opened! New jobs available.`);
  } else if (type === "school") {
    buildings.push({
      id: `school-${Date.now()}`,
      type: "school",
      name: `Town School`,
      x, y
    });
    addLog(`A new school was built! Kids can learn now.`);
  } else if (type === "church") {
    buildings.push({
      id: `church-${Date.now()}`,
      type: "church",
      name: `Town Church`,
      x, y
    });
    addLog(`A church was built for the community.`);
  }
  render();
  return addedBuilding;
}

export function buyHouse(person) {
  if (person.money >= 200) {
    person.money -= 200;
    const house = addBuilding("home");
    if (house) {
      person.homeId = house.id;
      person.locationId = house.id;
      addLog(`${person.name} paid $200 to build and move into their own home!`);
    }
  }
}

// Initialize application
function init() {
  // Initialize DOM elements
  els = initializeElements();
  
  // Event listeners
  els.toggleRun.addEventListener("click", () => {
    state.running = !state.running;
    els.toggleRun.textContent = state.running ? "Pause" : "Resume";
  });

  els.stepHour.addEventListener("click", () => advanceHour());
  els.stepDay.addEventListener("click", advanceDay);
  els.restart.addEventListener("click", resetSimulation);

  els.closeEventModal.addEventListener("click", () => {
    els.eventModal.hidden = true;
    state.running = true;
    els.toggleRun.textContent = "Pause";
  });

  els.speedSelect.addEventListener("change", () => {
    state.speed = Number(els.speedSelect.value);
    scheduleTick();
    scheduleSocialTick();
  });

  els.deathAge.addEventListener("input", () => {
    state.deathAge = Number(els.deathAge.value);
    els.deathAgeLabel.textContent = `${state.deathAge} years`;
  });

  els.populationSize.addEventListener("change", () => {
    els.populationSize.value = clamp(Number(els.populationSize.value) || 12, 10, 15);
  });

  els.closeFriendModal.addEventListener("click", closeFriendModal);

  els.friendModal.addEventListener("click", (event) => {
    if (event.target === els.friendModal) {
      closeFriendModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.friendModal.hidden) {
      closeFriendModal();
    }
  });

  els.addOfficeBtn.addEventListener("click", () => addBuilding("office"));
  els.addSchoolBtn.addEventListener("click", () => addBuilding("school"));
  els.addChurchBtn.addEventListener("click", () => addBuilding("church"));

  // Start simulation
  resetSimulation();
  scheduleTick();
  scheduleSocialTick();
  animatePeople(state, els);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
