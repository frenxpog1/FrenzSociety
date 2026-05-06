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
  state.serialKillerEverSpawned = false; // Reset serial killer spawn flag
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
        const alivePeople = state.people.filter(p => p.alive && !p.isChild);
        if (alivePeople.length > 0) {
          const redistributionAmount = Math.floor(state.townTreasury * 0.9); // 90% of treasury (was 50%)
          const perPerson = Math.floor(redistributionAmount / alivePeople.length);
          
          // Calculate need-based distribution - poor people get more
          const maxMoney = Math.max(...alivePeople.map(p => p.money), 1);
          const needScores = alivePeople.map(person => ({
            person,
            needScore: maxMoney - person.money + 10 // Inverse - poorer = higher score
          }));
          const totalNeed = needScores.reduce((sum, item) => sum + item.needScore, 0);
          
          if (totalNeed > 0) {
            state.people = state.people.map(person => {
              if (person.alive && !person.isChild) {
                const needItem = needScores.find(item => item.person.id === person.id);
                if (needItem) {
                  const share = Math.floor((needItem.needScore / totalNeed) * redistributionAmount);
                  return { ...person, money: person.money + share };
                }
              }
              return person;
            });
            
            state.townTreasury -= redistributionAmount;
            addLog(`💰 Weekly redistribution! $${redistributionAmount} distributed based on need (poor get more).`);
            
            triggerEvent("💰 Treasury Redistribution", `The town distributed $${redistributionAmount} (90% of treasury) based on need! Poor people received more!`);
          }
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
      const toFire = cops.sort((a, b) => a.happiness - b.happiness)[0];
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
      const candidates = aliveAdults.filter(p => !p.job || (!p.job.title.includes("Police")));
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
    
    // Help unemployed people find jobs
    const unemployed = aliveAdults.filter(p => !p.job && !p.isChild);
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
      const candidates = aliveAdults.filter(p => !p.isSerialKiller && !p.isChild);
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        chosen.isSerialKiller = true;
        chosen.lastKillDay = state.day;
        state.serialKillerEverSpawned = true; // Mark that serial killer has spawned
        
        const spawnType = state.serialKillerEverSpawned ? "returned" : "emerged";
        addLog(`🔪 A serial killer has ${spawnType} in the town... ${chosen.name} has dark secrets.`);
        triggerEvent("🔪 SERIAL KILLER EMERGES!", `⚠️ WARNING ⚠️\n\nA serial killer is now among us!\n\n${chosen.name} has begun their reign of terror. They will kill every 3 days. The town is in danger!`);
      }
    }
    
    // Serial killer kills every 3 days
    if (serialKiller && state.day - serialKiller.lastKillDay >= gameConfig.serialKillerKillInterval) {
      const victims = state.people.filter(p => p.alive && p.id !== serialKiller.id && !p.isChild);
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
  }

  const oldAlive = state.people.filter(p => p.alive).map(p => p.id);
  
  let jackpotEvent = null;
  let robberyEvents = [];
  state.people = state.people.map((person) => {
    const updated = updatePerson(person, state, addLog);
    if (updated.modalEvent) {
      jackpotEvent = updated.modalEvent;
      delete updated.modalEvent;
    }
    // Collect treasury contributions
    if (updated.treasuryContribution) {
      state.townTreasury += updated.treasuryContribution;
      delete updated.treasuryContribution;
    }
    // Casino balance updates
    if (updated.casinoPayout) {
      // Check if casino can afford to pay
      if (state.casinoBankroll >= updated.casinoPayout) {
        state.casinoBankroll -= updated.casinoPayout;
        console.log(`Casino paid out ${updated.casinoPayout}, new balance: ${state.casinoBankroll}`);
      } else {
        // Casino can only pay what it has
        const actualPayout = Math.max(0, state.casinoBankroll);
        state.casinoBankroll = 0;
        console.log(`Casino broke! Could only pay ${actualPayout} of ${updated.casinoPayout}`);
        addLog(`🎰💸 CASINO BROKE! Could only pay ${actualPayout} of ${updated.casinoPayout}. Balance: $0`);
      }
      delete updated.casinoPayout;
    }
    if (updated.casinoContribution) {
      state.casinoBankroll += updated.casinoContribution;
      console.log(`Casino received ${updated.casinoContribution}, new balance: ${state.casinoBankroll}`);
      delete updated.casinoContribution;
    }
    if (updated.robbingVictimId) {
      robberyEvents.push({ robberId: updated.id, victimId: updated.robbingVictimId });
      delete updated.robbingVictimId;
    }
    return updated;
  });
  
  for (const { robberId, victimId } of robberyEvents) {
    let robber = state.people.find(p => p.id === robberId);
    let victim = state.people.find(p => p.id === victimId);
    if (!robber || !victim || !robber.alive || !victim.alive || victim.status === "In Jail") continue;
    
    // Initialize robbery confidence if not set
    if (robber.robberyConfidence === undefined) robber.robberyConfidence = 0;
    
    // Check if cops on patrol
    const activeCops = state.people.filter(p => p.alive && p.job?.title.includes("Police") && isWorkHour(p, state.hour));
    
    // Serial killers are MUCH harder to catch - they're professionals
    const isSerialKiller = robber.isSerialKiller || false;
    
    // Confidence affects success rate - higher confidence = better at avoiding cops
    const baseDetectionRate = activeCops.length > 0 ? (isSerialKiller ? 0.15 : 0.7) : 0; // Serial killers: 15% base vs 70% normal
    const confidenceBonus = Math.min(robber.robberyConfidence * 0.05, isSerialKiller ? 0.8 : 0.4); // Serial killers get up to 80% bonus
    const actualDetectionRate = Math.max(baseDetectionRate - confidenceBonus, isSerialKiller ? 0.02 : 0.2); // Serial killers: min 2% vs 20% normal
    
    if (activeCops.length > 0 && Math.random() < actualDetectionRate) {
      // CAUGHT BY POLICE
      const cop = activeCops[Math.floor(Math.random() * activeCops.length)];
      
      // Serial killers are EXTREMELY dangerous when cornered
      const fightBackChance = isSerialKiller ? 0.8 : 0.1; // 80% for serial killers vs 10% normal
      const lethalChance = isSerialKiller ? 0.9 : 0.4; // 90% lethal for serial killers vs 40% normal
      
      // Reset confidence on getting caught (serial killers lose less)
      robber.robberyConfidence = Math.max(0, robber.robberyConfidence - (isSerialKiller ? 1 : 3));
      
      if (Math.random() < fightBackChance) { // Serial killers almost always fight back
        if (Math.random() < lethalChance) { // Serial killers are deadly
          cop.alive = false;
          cop.status = "Killed in the line of duty";
          cop.deathDay = state.day;
          const stolen = Math.floor(victim.money * 0.5);
          victim.money -= stolen;
          robber.money += stolen;
          robber.happiness = clamp(robber.happiness + 20, 0, 100);
          
          if (isSerialKiller) {
            robber.robberyConfidence = Math.min(robber.robberyConfidence + 3, 20); // Serial killer gains confidence from killing cop
            jackpotEvent = { title: "🔪🚓 COP MURDERED!", message: `The serial killer ${robber.name} was cornered by Officer ${cop.name}... and KILLED THE COP! They escaped with the money. The town is terrified!` };
          } else {
            jackpotEvent = { title: "🚓 Officer Down!", message: `Tragedy strikes! Officer ${cop.name} was shot and killed while trying to stop ${robber.name} from robbing ${victim.name}!` };
          }
        } else {
          robber.locationId = "jail-1";
          robber.jailHoursRemaining = isSerialKiller ? 240 : 120; // Serial killers get 10 days vs 5 days
          robber.happiness = clamp(robber.happiness - 40, 0, 100);
          
          if (isSerialKiller) {
            robber.isSerialKiller = false; // Lose serial killer status when caught
            jackpotEvent = { title: "🔪 SERIAL KILLER CAUGHT!", message: `After a violent shootout, Officer ${cop.name} managed to capture the serial killer ${robber.name}! They're sentenced to 10 days in jail. The town can finally breathe...` };
          } else {
            jackpotEvent = { title: "🔫 Shootout!", message: `Officer ${cop.name} was injured in a violent shootout, but managed to arrest ${robber.name}! They get 5 days in jail. Confidence: ${robber.robberyConfidence}` };
          }
        }
      } else if (Math.random() < 0.05) { // 5% lethal force
        robber.alive = false;
        robber.status = "Killed by Police";
        robber.deathDay = state.day;
        
        if (isSerialKiller) {
          jackpotEvent = { title: "🔫 SERIAL KILLER KILLED!", message: `In a dramatic confrontation, Officer ${cop.name} shot and killed the serial killer ${robber.name}! The nightmare is over!` };
        } else {
          jackpotEvent = { title: "🔫 Lethal Force", message: `During an attempted robbery, ${robber.name} was shot and killed by Officer ${cop.name}!` };
        }
      } else {
        robber.locationId = "jail-1";
        robber.jailHoursRemaining = isSerialKiller ? 240 : 72; // Serial killers: 10 days vs 3 days
        robber.happiness = clamp(robber.happiness - 30, 0, 100);
        
        if (isSerialKiller) {
          robber.isSerialKiller = false; // Lose serial killer status when caught
          jackpotEvent = { title: "🔪 SERIAL KILLER ARRESTED!", message: `The serial killer ${robber.name} was finally caught by Officer ${cop.name}! Sentenced to 10 days. The town celebrates!` };
        } else {
          jackpotEvent = { title: "🚓 Arrested!", message: `${robber.name} tried to rob ${victim.name} but was caught by Officer ${cop.name}! Sent to jail for 3 days. Confidence dropped to ${robber.robberyConfidence}.` };
        }
      }
    } else {
      // ROBBERY SUCCEEDS
      const stolenAmount = Math.floor(Math.random() * (gameConfig.robberyMaxSteal - gameConfig.robberyMinSteal + 1)) + gameConfig.robberyMinSteal;
      const actualStolen = Math.min(stolenAmount, victim.money);
      
      victim.money -= actualStolen;
      robber.money += actualStolen;
      victim.happiness = clamp(victim.happiness - 25, 0, 100);
      robber.happiness = clamp(robber.happiness + 30, 0, 100); // Big happiness boost from success
      robber.depressedHours = 0; // Reset depression
      
      // Increase confidence on successful robbery
      robber.robberyConfidence = Math.min(robber.robberyConfidence + 2, 20); // Max confidence 20
      
      addLog(`💰 ${robber.name} successfully robbed ${victim.name} and stole $${actualStolen}! Confidence increased to ${robber.robberyConfidence}.`);
      
      if (Math.random() < 0.05) { // 5% chance of violence
        victim.alive = false;
        victim.status = "Murdered during robbery";
        victim.deathDay = state.day;
        robber.robberyConfidence += 1; // Extra confidence from getting away with murder
        jackpotEvent = { title: "🔪 Murder!", message: `${robber.name} robbed and KILLED ${victim.name}! The town is in shock! Confidence: ${robber.robberyConfidence}` };
      } else {
        jackpotEvent = { title: "💰 Robbery Success!", message: `${robber.name} successfully robbed ${victim.name} of $${actualStolen}! Their confidence is growing (${robber.robberyConfidence}).` };
      }
      
      if (Math.random() < gameConfig.victimReportChance && activeCops.length > 0) {
        addLog(`📞 ${victim.name} reported the robbery to police.`);
      }
    }
    
    // Update the robber in state
    state.people = state.people.map(p => p.id === robber.id ? robber : p);
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
  els.eventModalBody.innerHTML = `<p>${modal.message}</p>`;
  
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
    if (!person.alive || person.isChild || !person.job) return;
    
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
    console.log('Continue button clicked!', 'Queue length:', state.modalQueue.length, 'Disabled:', els.closeEventModal.disabled);
    
    // Prevent multiple clicks during countdown
    if (els.closeEventModal.disabled) {
      console.log('Button is disabled, ignoring click');
      return;
    }
    
    // Mark that user clicked
    state.modalUserClicked = true;
    console.log('User clicked flag set to true');
    
    // Check if there are more modals in queue
    if (state.modalQueue.length > 0) {
      console.log('More modals in queue, showing next one');
      // More modals waiting, show next one immediately
      els.eventModal.hidden = true;
      showNextModal();
    } else {
      console.log('Last modal, handling resume delay. Delay setting:', state.resumeDelay);
      // This was the last modal, now handle resume delay
      if (state.resumeDelay === 'never') {
        // Manual mode - just close modal and stay paused
        console.log('Manual mode - closing modal');
        els.eventModal.hidden = true;
        return;
      }
      
      const delayMs = state.resumeDelay * 1000;
      if (delayMs > 0) {
        console.log('Adding countdown to modal, delay:', delayMs, 'ms');
        // Add countdown to the CURRENT modal (don't close it yet)
        const currentBody = els.eventModalBody.innerHTML;
        
        // Add countdown text to current modal
        els.eventModalBody.innerHTML = currentBody + `<p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); color: var(--muted);">⏳ Resuming in ${state.resumeDelay} seconds...</p>`;
        
        // Disable the continue button during countdown
        els.closeEventModal.disabled = true;
        els.closeEventModal.style.opacity = '0.5';
        
        setTimeout(() => {
          console.log('Countdown finished, resuming simulation');
          els.eventModal.hidden = true;
          els.closeEventModal.disabled = false;
          els.closeEventModal.style.opacity = '1';
          state.running = true;
          els.toggleRun.textContent = "Pause";
        }, delayMs);
      } else {
        console.log('Instant resume - closing modal immediately');
        // Resume immediately
        els.eventModal.hidden = true;
        state.running = true;
        els.toggleRun.textContent = "Pause";
      }
    }
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

  els.addSchoolBtn.addEventListener("click", () => addBuilding("school"));
  els.addChurchBtn.addEventListener("click", () => addBuilding("church"));
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
      id: `person-${Date.now()}`,
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
    renderAll();
  });

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
