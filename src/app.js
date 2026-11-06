import { recruitForOffices } from './employment.js';
import { encounterFor, stageRobbery, skipCrimeScenes } from './crime.js';
import { renderCommunityGoals } from "./goals.js";
import { saveLocal, readLocal, createSnapshot, decodeSnapshot, applySnapshot } from './persistence.js';
import { focusBuilding, resetCamera, followResident, stopFollowing, startConstruction, cancelConstruction, findConstructionLot } from './world.js';
import { findBuildablePosition } from './layout.js';
import { canBuild, buildCatalog } from './construction.js';
import { renderBuildingInspector, renderBuildingDirectory } from './inspector.js';
import { advanceActivities } from './activities.js';
import { hasArrived } from './movement.js';
import { settleFinances, distributeTreasury } from './economy.js';
import { initUI, openPanel } from './ui.js';
// Main application entry point
import { gameConfig, buildings, jobs, names, genders, traits, skills, entryLevelJobs } from './constants.js';
import { formatHour, clamp, randomItem } from './utils.js';
import { state, initializeElements } from './state.js';
import { createPeople, getPerson, createChild } from './people.js';
import { getRelationshipEntries } from './relationships.js';
import { updatePerson, getBuilding, buildingOccupancy, isWorkHour } from './simulation.js';
import { shouldArgue, updateRelationship, chooseConversationTopic, conversationLinesForTopic } from './interactions.js';
import { renderStats, renderMap, renderPeopleList, renderDetails, renderConversations, renderLog, buildRelationshipRow } from './render.js';
import { animatePeople } from './animation.js';

// Pristine templates allow a true restart after upgrades and expansion.
const initialBuildings = structuredClone(buildings);
const initialJobs = structuredClone(jobs);
let resumeTimer = null;
let resumeAfterEvents = false;
let els;
let storage;
try { storage=globalThis.localStorage; } catch {}
function notify(message){state.notice={text:message,until:performance.now()+5000};}
function updateSaveStatus(message){const el=document.querySelector('#saveStatus');if(el)el.textContent=message;}
function persistTown(manual=false){
  if(state.saveBlocked&&!manual)return;
  const result=saveLocal(state,buildings,jobs,storage);
  if(result.ok){state.saveBlocked=false;updateSaveStatus(`Saved ${new Date(result.savedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`);if(manual)notify('Town saved on this device.');}
  else {updateSaveStatus('Save unavailable');if(manual)notify(result.error);}
}
function syncControls(){
  els.toggleRun.textContent=state.running?'Pause':'Resume';
  els.speedSelect.value=String(state.speed);els.resumeDelaySelect.value=String(state.resumeDelay);
  els.deathAge.value=String(state.deathAge);els.deathAgeLabel.textContent=`${state.deathAge} years`;els.populationSize.value=String(state.populationSize);
  document.querySelector('#pauseForEvents').checked=state.pauseForEvents;
  els.resumeDelaySelect.disabled=!state.pauseForEvents;
}
function restoreTown(snapshot,message){
  clearTimeout(resumeTimer);resumeTimer=null;els.eventModal.hidden=true;els.friendModal.hidden=true;els.closeEventModal.disabled=false;
  document.querySelector('#newTownConfirm').hidden=true;
  cancelConstruction();state.inspectedBuildingId=null;
  applySnapshot(snapshot,state,buildings,jobs);syncControls();scheduleTick();scheduleSocialTick();render();resetCamera();notify(message);
}


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
function resetSimulation(options = {}) {
  cancelConstruction();
  state.inspectedBuildingId = null;
  clearTimeout(resumeTimer);
  resumeTimer = null;
  buildings.splice(0, buildings.length, ...structuredClone(initialBuildings));
  jobs.splice(0, jobs.length, ...structuredClone(initialJobs));
  state.townTreasury = 0;
  state.casinoBankroll = gameConfig.casinoStartingBalance;
  state.deaths = 0;
  state.modalQueue = [];
  state.running = true;
  els.eventModal.hidden = true;
  els.friendModal.hidden = true;
  els.closeEventModal.disabled = false;
  els.toggleRun.textContent = "Pause";
  state.followId=null;
  state.recentEvents=[];
  state.hour = 9;
  state.activitySeconds = 0;
  state.day = 1;
  state.deathAge = Number(els.deathAge.value);
  state.populationSize = Number(els.populationSize.value);
  state.people = createPeople(clamp(state.populationSize || 15, 10, 30));
  state.people = state.people.map(p => isWorkHour(p,state.hour) ? {...p, status:p.job.title.includes('Police')?'At Police Station':'Working',locationId:p.job.building} : p);
  state.relationships = {};
  state.motion = {};
  state.crimeEncounters = [];
  state.pendingCrimeDeaths = [];
  state.speech = {};
  state.recentTopics = {};
  state.nextConversationAt = performance.now() + 2500;
  state.selectedId = state.people[0]?.id ?? null;
  state.eventLog = [];
  state.conversations = [];
  state.serialKillerEverSpawned = false; // Reset serial killer spawn flag
  addLog(`${state.people.length} humans moved into 10 houses.`);
  addLog(`The town opened 2 offices, 1 restaurant, and meals cost ${gameConfig.mealCost}.`);
  render();
  resetCamera();
  if(options.save!==false){document.querySelector('#closeDrawer').click();if(storage)persistTown(true);}
}

function advanceHour(skipRender = false, skipRequested = false) {
  const skipTravel=skipRequested||skipRender||!state.running;
  if (skipTravel) for (const event of skipCrimeScenes(state)) triggerEvent(event.title,event.message);
  const oldAlive = [...new Set([...state.people.filter(p => p.alive).map(p => p.id), ...(state.pendingCrimeDeaths || [])])];
  state.pendingCrimeDeaths = [];
  state.hour += 1;
  if (state.hour >= 24) {
    state.hour = 0;
    state.day += 1;
    state.people = state.people.map((person) => {
      let money = person.money;
      if (!person.isChild && person.alive) {
        // Daily expenses: $10 rent + $3 tax (reduced from $15 + $5)
        const dailyExpenses = 13;
        if (money >= dailyExpenses) {
          money -= dailyExpenses;
          state.townTreasury += dailyExpenses;
        } else {
          state.townTreasury += money;
          money = 0;
        }
      }
      let updatedPerson = {
        ...person,
        ageDays: person.ageDays + 91, // People age 1/4th of a year per day so kids grow up!
        talkedToday: 0,
        daysWorked: person.job && !person.isChild ? (person.daysWorked || 0) + 1 : (person.daysWorked || 0), // Increment days worked
        money
      };
      
      if (updatedPerson.status === "In Jail" && updatedPerson.jailDays > 0) {
        updatedPerson.jailDays -= 1;
        if (updatedPerson.jailDays <= 0) {
          updatedPerson.status = "At home";
          updatedPerson.locationId = updatedPerson.homeId;
          updatedPerson.money += 100; // Release money
          triggerEvent("🔓 Released", `${updatedPerson.name} served their time and was released from Jail with $100 to restart their life.`);
        }
      }
      
      return updatedPerson;
    });
    
    // Weekly treasury redistribution (every 7 days)
    if (state.day % 7 === 0) {
      if (state.casinoBankroll > 5000) {
        const excess = state.casinoBankroll - 5000;
        state.townTreasury += excess;
        state.casinoBankroll = 5000;
        addLog(`The Casino transferred $${Math.floor(excess)} in weekly profits to the Town Treasury.`);
      } else if (state.casinoBankroll < 5000) {
        // Casino gets refilled to $5000 from town investment
        const refill = 5000 - state.casinoBankroll;
        state.casinoBankroll = 5000;
        addLog(`🎰 The Casino was refilled to $5000 (added $${refill}) for the new week!`);
      }
      if (state.townTreasury > 0) {
        const distributed = distributeTreasury(state);
        if (distributed > 0) {
          addLog(`Weekly redistribution: $${distributed} distributed based on need.`);
          triggerEvent("Treasury Redistribution", `The town distributed $${distributed} to adult residents, with larger shares for those in need.`);
        }
      }
    }

    // Police Force Management
    const aliveCount = state.people.filter(p => p.alive).length;
    const aliveAdults = state.people.filter(p => p.alive && !p.isChild);
    const requiredCops = Math.floor(aliveCount / 5);
    const cops = aliveAdults.filter(p => p.job && p.job.title && p.job.title.includes("Police"));
    
    if (cops.length > requiredCops) {
      // Too many cops, fire the least happy one and give them a new job
      const toFire = cops.filter(p=>!encounterFor(state,p.id)).sort((a, b) => a.happiness - b.happiness)[0];
      if (toFire) {
        // Give them a new entry-level job instead of leaving them unemployed
        const newJobTitle = entryLevelJobs.filter(j => !j.includes("Police"))[Math.floor(Math.random() * (entryLevelJobs.length - 1))];
        const newJobTemplate = jobs.find(j => j.name === newJobTitle);
        
        if (newJobTemplate) {
          toFire.job = { ...newJobTemplate, title: newJobTemplate.name };
          toFire.daysWorked = 0;
          triggerEvent("👮 Job Change", `Due to population decline, ${toFire.name} was let go from the police force but found work as a ${newJobTitle}!`);
        } else {
          toFire.job = null; // Unemployed as fallback
          triggerEvent("👮 Cop Fired", `Due to population decline, the town has downsized the police force. ${toFire.name} was let go.`);
        }
      }
    } else if (cops.length < requiredCops) {
      // Need more cops, find an unemployed adult or random worker
      const candidates = aliveAdults.filter(p => !encounterFor(state,p.id) && (!p.job || !p.job.title.includes("Police")));
      if (candidates.length > 0) {
        const unemployed = candidates.filter(p => !p.job);
        const toHire = unemployed.length > 0 ? unemployed[Math.floor(Math.random() * unemployed.length)] : candidates[Math.floor(Math.random() * candidates.length)];
        
        const dayCops = cops.filter(c => c.job.title.includes("(Day)")).length;
        const nightCops = cops.filter(c => c.job.title.includes("(Night)")).length;
        const shift = nightCops < dayCops ? "Police Officer (Night)" : "Police Officer (Day)";
        
        const jobTemplate = jobs.find(j => j.name === shift);
        toHire.job = { ...jobTemplate, title: jobTemplate.name };
        toHire.daysWorked = 0;
        triggerEvent("👮 New Cop Recruited", `${toHire.name} has been recruited as a ${shift} to keep our growing town safe!`);
      }
    }
    
    for (const {person,building} of recruitForOffices(state,buildings,jobs)) addLog(`${person.name} found work at ${building.name}.`);

    // Help unemployed people find jobs
    const unemployed = aliveAdults.filter(p => !p.job && !p.jailHoursRemaining && !encounterFor(state,p.id));
    unemployed.forEach(person => {
      // Unemployed people actively look for work
      if (Math.random() < 0.3) { // 30% chance per day to find a job
        const newJobTitle = entryLevelJobs[Math.floor(Math.random() * entryLevelJobs.length)];
        const newJobTemplate = jobs.find(j => j.name === newJobTitle);
        
        if (newJobTemplate) {
          person.job = { ...newJobTemplate, title: newJobTemplate.name };
          person.daysWorked = 0;
          addLog(`💼 ${person.name} found work as a ${newJobTitle}!`);
        }
      }
    });
    
    // Serial Killer System - GUARANTEED spawn when population > 30, then 2% respawn chance
    const aliveAdultsCount = aliveAdults.length;
    const serialKiller = state.people.find(p => p.alive && p.isSerialKiller);
    
    // First spawn is GUARANTEED when population reaches threshold
    // After that, only 2% chance to respawn if killed/caught
    const shouldSpawn = !state.serialKillerEverSpawned 
      ? true // GUARANTEED first spawn
      : Math.random() < 0.02; // 2% chance to respawn
    
    if (aliveAdultsCount >= gameConfig.serialKillerMinPop && !serialKiller && shouldSpawn) {
      // Spawn a serial killer from existing population
      const candidates = aliveAdults.filter(p => !p.isSerialKiller && !p.isChild && !p.jailHoursRemaining && !encounterFor(state,p.id));
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        chosen.isSerialKiller = true;
        chosen.lastKillDay = state.day;
        const spawnType = state.serialKillerEverSpawned ? "returned" : "emerged";
        state.serialKillerEverSpawned = true;
        addLog(`🔪 A serial killer has ${spawnType} in the town... ${chosen.name} has dark secrets.`);
        triggerEvent("🔪 SERIAL KILLER EMERGES!", `⚠️ WARNING ⚠️\n\nA serial killer is now among us!\n\n${chosen.name} has begun their reign of terror. They will kill every 3 days. The town is in danger!`);
      }
    }
    
    // Serial killer kills every 3 days
    if (serialKiller && !encounterFor(state,serialKiller.id) && !serialKiller.jailHoursRemaining && state.day - serialKiller.lastKillDay >= gameConfig.serialKillerKillInterval) {
      const victims = state.people.filter(p => p.alive && p.id !== serialKiller.id && !p.isChild && !p.jailHoursRemaining && !encounterFor(state,p.id));
      if (victims.length > 0) {
        const victim = victims[Math.floor(Math.random() * victims.length)];
        victim.alive = false;
        victim.status = "Murdered by serial killer";
        victim.deathDay = state.day;
        serialKiller.lastKillDay = state.day;
        serialKiller.robberyConfidence = Math.min((serialKiller.robberyConfidence || 0) + 5, 20);
        
        addLog(`🔪💀 ${victim.name} was found dead! The serial killer has struck again!`);
        triggerEvent("🔪 MURDER!", `${victim.name} was brutally murdered!\n\nThe serial killer (${serialKiller.name}) has struck again! The body was found this morning. The town is terrified!`);
      }
    }
    
    // Check for pregnancies once per day
    checkPregnancies();
    
    // Check for job promotions
    checkPromotions();
    
    // Remove dead people after 3 days
    removeDead();
    
    // Housing management - assign homeless people to available houses
    const homeless = state.people.filter(p => p.alive && !p.homeId);
    homeless.forEach(person => {
      const houses = buildings.filter(b => b.type === "home");
      for (const house of houses) {
        const occupants = state.people.filter(p => p.alive && p.homeId === house.id).length;
        if (occupants < house.capacity) {
          person.homeId = house.id;
          person.locationId = house.id;
          addLog(`🏠 ${person.name} moved into ${house.name} (${occupants + 1}/${house.capacity} people)`);
          break;
        }
      }
    });
    
    // House capacity upgrade system - residents can pool money to upgrade
    const houses = buildings.filter(b => b.type === "home");
    houses.forEach(house => {
      const residents = state.people.filter(p => p.alive && p.homeId === house.id && !p.isChild);
      const occupants = state.people.filter(p => p.alive && p.homeId === house.id);
      
      // If house is at or near capacity and residents have money
      if (occupants.length >= house.capacity - 1 && residents.length > 0) {
        // Check if any resident can afford upgrade
        const richResident = residents.find(r => r.money >= 150);
        if (richResident && Math.random() < 0.3) { // 30% chance per day
          richResident.money -= 150;
          house.capacity += 2;
          house.beds += 1;
          addLog(`🏠 ${richResident.name} upgraded ${house.name} capacity to ${house.capacity} people for $150!`);
        }
      }
    });
    
    // Check if anyone needs and can afford a new house
    state.people.forEach(person => {
      // If adult and they have more than 250 money, they might buy a house
      if (person.alive && !person.isChild && person.money >= 250) {
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
  }

  
  let jackpotEvent = null;
  const tryRobbery = skipTravel ? undefined : (robber, victim) => {
    if (!stageRobbery(state, robber, victim, buildings)) return false;
    addLog(`${robber.name} is approaching ${victim.name} for a robbery.`);
    return true;
  };
  // Resolve one decision at a time so encounters reserve both participants.
  for (let i = 0; i < state.people.length; i++) {
    const person = state.people[i];
    if (encounterFor(state, person.id)) continue;
    const updated = updatePerson(person, state, addLog, { tryRobbery });
    if (updated.modalEvent) {
      jackpotEvent = updated.modalEvent;
      delete updated.modalEvent;
    }
    state.people[i] = settleFinances(updated, state);
  }

  for (const child of state.people) {
    if (child.mealPaidBy) {
      const parent = getPerson(state.people, child.mealPaidBy);
      if (parent) parent.money = Math.max(0, parent.money - gameConfig.mealCost);
      delete child.mealPaidBy;
    }
  }

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

  const aliveIds = new Set(state.people.filter(p => p.alive).map(p => p.id));
  for (const person of state.people) {
    if (person.partnerId && !aliveIds.has(person.partnerId)) person.partnerId = null;
  }
  for (const [key, relation] of Object.entries(state.relationships)) {
    if (key.split('|').some(id => !aliveIds.has(id))) relation.couple = false;
  }
  if (skipTravel) {
    // Explicit time skips include the service clock and abstract the skipped travel.
    advanceActivities(state, 6, new Set(state.people.filter(p=>p.alive).map(p=>p.id)), true);
    state.motion={};
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
  // Advance full 24 hours without breaking for events
  for (let i = 0; i < 24; i++) {
    advanceHour(true);
  }
  // Force a full render to show all updates
  render();
}

function triggerEvent(title, message) {
  const stamp=`Day ${state.day}, ${formatHour(state.hour)}`;
  state.recentEvents=[{title,message,stamp},...(state.recentEvents||[])].slice(0,12);
  addLog(`${title}: ${message}`);
  if(!state.pauseForEvents){notify(title);return;}

  if (els.eventModal.hidden) resumeAfterEvents = state.running;
  // Add to queue instead of showing immediately
  state.modalQueue.push({ title, message });
  
  // If no modal is currently showing, show the first one
  if (els.eventModal.hidden) {
    showNextModal();
  }
}

function showNextModal() {
  if (state.modalQueue.length === 0) {
    // No more modals - this shouldn't be called, but just in case
    return;
  }
  
  // Show next modal from queue
  const modal = state.modalQueue.shift();
  state.running = false;
  state.modalUserClicked = false; // Reset the flag for new modal
  els.toggleRun.textContent = "Resume";
  els.eventModalTitle.textContent = modal.title;
  els.eventModalBody.textContent = modal.message;
  
  // Show queue count if there are more modals
  if (state.modalQueue.length > 0) {
    els.eventModalBody.innerHTML += `<p style="margin-top: 12px; color: var(--muted); font-size: 0.9em;">📋 ${state.modalQueue.length} more event${state.modalQueue.length > 1 ? 's' : ''} waiting...</p>`;
  }
  
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
    // Count existing children
    const existingChildren = state.people.filter(p => 
      p.alive && p.isChild && 
      (p.parentAId === personA.id || p.parentBId === personA.id)
    ).length;
    
    // Bonus chance for first 3 kids, reduced after that
    let adjustedChance = gameConfig.pregnancyChance;
    if (existingChildren === 0) adjustedChance = 1.0; // 100% for first child - GUARANTEED!
    else if (existingChildren === 1) adjustedChance = 1.0; // 100% for second child - GUARANTEED!
    else if (existingChildren === 2) adjustedChance = 0.95; // 95% for third child
    else if (existingChildren >= 3) adjustedChance *= 0.5; // 47.5% after 3 kids
    
    if (Math.random() < adjustedChance) {
      const homeId = personA.homeId;
        const home = buildings.find(b => b.id === homeId);
        const occupants = state.people.filter(p => p.alive && p.homeId === homeId).length;

        // Check if there is enough space
        if (home && occupants >= home.capacity) {
          // If no space, check if they can afford an upgrade (cheaper now!)
          if (personA.money >= 100) {
            personA.money -= 100;
            home.capacity += 2;
            home.beds += 1;
            addLog(`${personA.name} paid $100 to upgrade their home for a new baby!`);
          } else if (personB.money >= 100) {
            personB.money -= 100;
            home.capacity += 2;
            home.beds += 1;
            addLog(`${personB.name} paid $100 to upgrade their home for a new baby!`);
          } else {
            // Town helps with expansion if they can't afford it!
            if (state.townTreasury >= 100) {
              state.townTreasury -= 100;
              home.capacity += 2;
              home.beds += 1;
              addLog(`🏛️ The town treasury paid $100 to help ${personA.name} and ${personB.name} expand their home for a baby!`);
            } else {
              // Cannot afford upgrade, cancel pregnancy
              return;
            }
          }
        }

        const child = createChild(personA, personB, state);
        state.people.push(child);
        
        // HUGE bonuses to encourage more kids!
        const babyBonus = 200; // Increased from $150
        const happinessBoost = 50; // Increased from 40 - MASSIVE boost!
        
        state.people = state.people.map(p => {
          if (p.id === personA.id || p.id === personB.id) {
            return {
              ...p,
              happiness: clamp(p.happiness + happinessBoost, 0, 100),
              money: p.money + babyBonus
            };
          }
          return p;
        });
        
        addLog(`👶 ${personA.name} and ${personB.name} had a baby named ${child.name}! They received $${babyBonus} baby bonus each!`);
        triggerEvent("👶 New Baby!", `${personA.name} and ${personB.name} just had a baby named ${child.name}! The town gave them $${babyBonus * 2} total to celebrate! ${existingChildren > 0 ? `They now have ${existingChildren + 1} children!` : ''}`);
      }
  });
}

function removeDead() {
  const toRemove = [];
  
  state.people.forEach((person) => {
    if (!person.alive && person.deathDay !== undefined) {
      const daysSinceDeath = state.day - person.deathDay;
      if (daysSinceDeath >= 3) {
        toRemove.push(person.id);
        addLog(`⚰️ ${person.name}'s body was laid to rest at the graveyard.`);
      }
    }
  });
  
  // Remove dead people from the list
  if (toRemove.length > 0) {
    state.deaths = (state.deaths || 0) + toRemove.length;
    state.people = state.people.filter(person => !toRemove.includes(person.id));
    
    // Clean up relationships involving removed people
    Object.keys(state.relationships).forEach(key => {
      const [idA, idB] = key.split("|");
      if (toRemove.includes(idA) || toRemove.includes(idB)) {
        delete state.relationships[key];
      }
    });
    
    // Clean up motion and speech data
    toRemove.forEach(id => {
      delete state.motion[id];
      delete state.speech[id];
      delete state.recentTopics[id];
    });
    
    // Update selected person if they were removed
    if (toRemove.includes(state.selectedId)) {
      const alivePerson = state.people.find(p => p.alive);
      state.selectedId = alivePerson?.id ?? null;
    }
  }
}

function checkPromotions() {
  state.people.forEach((person) => {
    if (!person.alive || person.isChild || !person.job || encounterFor(state,person.id)) return;
    
    // Check if eligible for promotion
    const currentJob = jobs.find(j => j.name === person.job.title);
    if (!currentJob || !currentJob.nextPromotion) return; // Already at top level
    
    // Promotion criteria: worked enough days and has some money
    const eligible = person.daysWorked >= currentJob.daysToPromote && person.money >= 50; // Removed happiness requirement!
    
    if (eligible) {
      const newJob = jobs.find(j => j.name === currentJob.nextPromotion);
      if (newJob) {
        const oldWage = person.job.wage;
        person.job = {
          ...newJob,
          title: newJob.name,
        };
        person.daysWorked = 0; // Reset days worked for next promotion
        const raise = newJob.wage - oldWage;
        addLog(`🎉 ${person.name} got promoted from ${currentJob.name} to ${newJob.name}! Salary increased by $${raise}/hour!`);
        person.happiness = clamp(person.happiness + 20, 0, 100);
        person.money += 50; // Promotion bonus
      }
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
      !person.jailHoursRemaining &&
      !encounterFor(state, person.id) &&
      person.status !== 'On Patrol' &&
      (force || hasArrived(state,person)) &&
      !person.mealOrder &&
      !/work/i.test(person.status) &&
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
        happiness: clamp(person.happiness + (willArgue ? -10 : 20), 0, 100), // Increased from 12 to 20 - conversations give BIG happiness boost!
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
  renderCommunityGoals(state, buildings, {
    residents: () => openPanel('residents'),
    cafe: () => { document.querySelector('#closeDrawer').click(); focusBuilding('restaurant'); },
    square: () => { document.querySelector('#closeDrawer').click(); focusBuilding('town-square'); },
  });
  renderMap(state, els, selectPerson, { inspect: inspectBuilding, build: confirmConstruction, refreshInspector: () => renderBuildingInspector(state, selectPerson) });
  renderBuildingDirectory();
  renderBuildingInspector(state, selectPerson);
  renderPeopleList(state, els, selectPerson);
  renderDetails(state, els, openFriendModal);
  renderConversations(state, els);
  renderLog(state, els);
}

function inspectBuilding(id) {
  if (!buildings.some(b => b.id === id)) return;
  state.inspectedBuildingId = id;
  renderBuildingInspector(state, selectPerson);
  openPanel('building');
}

function confirmConstruction() {
  const mode = state.buildMode;
  if (!mode) return;
  const added = addBuilding(mode.type, mode);
  if (!added) return;
  cancelConstruction();
  focusBuilding(added.id);
  inspectBuilding(added.id);
  persistTown();
}

function selectPerson(id) {
  const person = getPerson(state.people,id);
  if (!person) return;
  cancelConstruction();
  state.selectedId = id;
  if (person.alive) {
    document.querySelector('#closeDrawer').click();
    followResident(id);
  } else {
    stopFollowing();
    openPanel('person');
  }
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
  const minute = 15_000;
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

function addBuilding(type, chosenPosition) {
  const position = chosenPosition ?? findBuildablePosition(type,buildings);
  if(!canBuild(type,position,buildings)){
    const message=chosenPosition ? 'This lot is blocked. Choose a clear lot before building.' : 'No suitable lot is available. This building needs more space.';
    addLog(message);state.notice={text:message,until:performance.now()+5000};render();return null;
  }
  const count=buildings.filter(b=>b.type===type).length+1;
  const names={home:`House ${count}`,office:`Office ${count}`,school:`School ${count}`,church:`Church ${count}`};
  const added={id:`${type==='home'?'house':type}-${crypto.randomUUID()}`,type,name:names[type],x:position.x,y:position.y};
  if(type==='home')Object.assign(added,{beds:1,capacity:2});
  if(type==='office'){
    added.jobs=4;jobs.push({name:`Clerk ${count}`,building:added.id,starts:9,ends:17,wage:16});
  }
  buildings.push(added);
  const hired = type === 'office' ? recruitForOffices(state,[added],jobs) : [];
  for (const {person} of hired) addLog(`${person.name} found work at ${added.name}.`);
  const hiring = hired.length ? ` Hired ${hired.length} resident${hired.length === 1 ? '' : 's'}.` : '';
  addLog(`${added.name} opened on a new lot.${hiring}`);
  state.notice = {text:`${added.name} added to the neighborhood.${hiring}`,until:performance.now()+4000};
  render();return added;
}

export function buyHouse(person) {
  if (person.money >= 200) {
    const house = addBuilding("home");
    if (house) {
      person.money -= 200;
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
  initUI(state);
  
  // Event listeners
  document.querySelector('#inspectFollowed').addEventListener('click',()=>{
    const person=getPerson(state.people,state.followId);
    if(!person)return;
    state.selectedId=person.id;render();openPanel('person');
  });
  els.toggleRun.addEventListener("click", () => {
    if (!els.eventModal.hidden) return;
    state.running = !state.running;
    els.toggleRun.textContent = state.running ? "Pause" : "Resume";
  });

  els.stepHour.addEventListener("click", () => { if (els.eventModal.hidden) advanceHour(false,true); });
  els.stepDay.addEventListener("click", () => { if (els.eventModal.hidden) advanceDay(); });
  els.restart.addEventListener("click",()=>{document.querySelector('#newTownConfirm').hidden=false;});
  document.querySelector('#cancelNewTown').addEventListener('click',()=>{document.querySelector('#newTownConfirm').hidden=true;});
  document.querySelector('#confirmNewTown').addEventListener('click',()=>{document.querySelector('#newTownConfirm').hidden=true;resetSimulation();});
  document.querySelector('#pauseForEvents').addEventListener('change',e=>{state.pauseForEvents=e.currentTarget.checked;els.resumeDelaySelect.disabled=!state.pauseForEvents;});
  document.querySelector('#saveNow').addEventListener('click',()=>persistTown(true));
  document.querySelector('#downloadSave').addEventListener('click',()=>{
    const file=new Blob([JSON.stringify(createSnapshot(state,buildings,jobs),null,2)],{type:'application/json'}),url=URL.createObjectURL(file);
    const link=document.createElement('a');link.href=url;link.download=`Willow-Creek-Day-${state.day}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify('Town save downloaded. Use Load save to restore it.');
  });
  const upload=document.querySelector('#saveFile');
  document.querySelector('#loadSave').addEventListener('click',()=>upload.click());
  upload.addEventListener('change',async()=>{
    const file=upload.files?.[0];if(!file)return;
    try{
      if(file.size>2_000_000)throw new Error('Choose a save smaller than 2 MB.');
      const decoded=decodeSnapshot(await file.text());
      // Preserve the current town only after the incoming file has validated.
      if(storage)persistTown();
      restoreTown(decoded,'Town loaded. Time is paused.');persistTown();
    }catch(error){notify(error.message);}
    finally{upload.value='';}
  });
  document.querySelector('#restoreBackup').addEventListener('click',()=>{
    const result=readLocal(storage,true);
    if(!result.ok){notify(result.empty?'No backup is available yet.':result.error);return;}
    restoreTown(result.snapshot,'Previous town restored. Time is paused.');persistTown();
  });

  els.closeEventModal.addEventListener("click", () => {
    if (els.closeEventModal.disabled) return;
    if (state.modalQueue.length) {
      showNextModal();
      return;
    }
    const finish = () => {
      resumeTimer = null;
      els.eventModal.hidden = true;
      els.closeEventModal.disabled = false;
      state.running = resumeAfterEvents && state.resumeDelay !== 'never';
      els.toggleRun.textContent = state.running ? "Pause" : "Resume";
    };
    if (resumeAfterEvents && Number(state.resumeDelay) > 0) {
      els.closeEventModal.disabled = true;
      resumeTimer = setTimeout(finish, Number(state.resumeDelay) * 1000);
    } else finish();
  });

  els.speedSelect.addEventListener("change", () => {
    state.speed = Number(els.speedSelect.value);
    scheduleTick();
    scheduleSocialTick();
  });

  els.resumeDelaySelect.addEventListener("change", () => {
    const value = els.resumeDelaySelect.value;
    state.resumeDelay = value === 'never' ? 'never' : Number(value);
  });

  els.deathAge.addEventListener("input", () => {
    state.deathAge = Number(els.deathAge.value);
    els.deathAgeLabel.textContent = `${state.deathAge} years`;
  });

  els.populationSize.addEventListener("change", () => {
    els.populationSize.value = clamp(Number(els.populationSize.value) || 15, 10, 30);
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

  for (const type of Object.keys(buildCatalog)) {
    const id = { home: 'addHomeBtn', office: 'addOfficeBtn', school: 'addSchoolBtn', church: 'addChurchBtn' }[type];
    document.querySelector(`#${id}`).addEventListener('click', () => {
      if (startConstruction(type)) document.querySelector('#closeDrawer').click();
      else notify('No suitable lot is available for this building.');
    });
  }
  document.querySelector('#confirmConstruction').addEventListener('click', confirmConstruction);
  document.querySelector('#cancelConstruction').addEventListener('click', cancelConstruction);
  document.querySelector('#suggestConstruction').addEventListener('click', findConstructionLot);
  document.querySelector('#buildingSelect').addEventListener('change', e => {
    const id = e.target.value;
    if (!id) return;
    cancelConstruction();focusBuilding(id);inspectBuilding(id);e.target.value='';
  });
  els.addPersonBtn.addEventListener("click", () => {
    // Create a new immigrant with random name
    const usedNames = state.people.filter(p => p.alive).map(p => p.name);
    const availableNames = names.filter(n => !usedNames.includes(n));
    const randomName = availableNames.length > 0 
      ? availableNames[Math.floor(Math.random() * availableNames.length)]
      : names[Math.floor(Math.random() * names.length)];
    
    const age = Math.floor(Math.random() * 31) + 20; // Age 20-50
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const jobTitle = entryLevelJobs[Math.floor(Math.random() * entryLevelJobs.length)];
    const jobTemplate = jobs.find(j => j.name === jobTitle);
    const startingMoney = Math.floor(Math.random() * 200) + 100; // $100-300
    
    // Find available home
    const houses = buildings.filter(b => b.type === "home");
    let assignedHome = null;
    for (const house of houses) {
      const occupants = state.people.filter(p => p.alive && p.homeId === house.id).length;
      if (occupants < house.capacity) {
        assignedHome = house;
        break;
      }
    }
    
    const newPerson = {
      id: `person-${crypto.randomUUID()}`,
      name: randomName,
      ageDays: age * 365,
      hunger: 35 + Math.floor(Math.random() * 25),
      energy: 55 + Math.floor(Math.random() * 35),
      happiness: 48 + Math.floor(Math.random() * 35),
      money: startingMoney,
      mealsMissed: 0,
      talkedToday: 0,
      depressedHours: 0,
      sickHours: 0,
      sick: false,
      gender: gender,
      partnerId: null,
      alive: true,
      status: "Just arrived",
      locationId: assignedHome ? assignedHome.id : "town-square",
      trait: randomItem(traits),
      skill: randomItem(skills),
      homeId: assignedHome ? assignedHome.id : null,
      job: jobTemplate ? { ...jobTemplate, title: jobTemplate.name } : null,
      daysWorked: 0,
      isChild: false,
      jailHoursRemaining: 0,
      robberyConfidence: 0, // New property for robbery confidence
    };
    
    state.people.push(newPerson);
    addLog(`👋 ${newPerson.name} arrived in town from another place!`);
    triggerEvent("👋 New Arrival!", `${newPerson.name} (${gender}, age ${age}) has arrived in town as a ${jobTemplate ? jobTemplate.name : 'job seeker'} with $${startingMoney}!`);
    render();
  });

  // Resume safely: loading never advances the clock until the player presses Resume.
  const saved=readLocal(storage);
  if(saved.ok)restoreTown(saved.snapshot,`Restored Day ${saved.snapshot.state.day}. Press Resume when ready.`);
  else {
    const backup=saved.error?readLocal(storage,true):{ok:false};
    if(backup.ok)restoreTown(backup.snapshot,'Recovered the previous backup. Time is paused.');
    else {resetSimulation({save:false});if(saved.error){state.saveBlocked=true;notify('Your stored save could not be read. It has been left untouched.');}}
  }
  if(saved.ok)updateSaveStatus('Restored saved town');
  else if(state.saveBlocked)updateSaveStatus('Save needs attention');
  else updateSaveStatus(storage?'Autosave ready':'Local save unavailable');
  syncControls();scheduleTick();scheduleSocialTick();
  window.setInterval(()=>persistTown(),10000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistTown();});
  window.addEventListener?.('pagehide',()=>persistTown());
  animatePeople(state,els,performance.now(), event => {
    triggerEvent(event.title,event.message);
    render();
  });
  document.body?.removeAttribute('data-loading');
  document.body?.setAttribute('aria-busy','false');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
