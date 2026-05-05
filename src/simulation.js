// Core simulation logic
import { gameConfig, buildings } from './constants.js';
import { clamp } from './utils.js';
import { getPerson } from './people.js';
import { getCloseFriend } from './relationships.js';

export function getBuilding(id) {
  return buildings.find((building) => building.id === id);
}

export function isWorkHour(person, hour) {
  if (!person.job) return false;
  return hour >= person.job.starts && hour < person.job.ends;
}

export function updatePerson(person, state, addLogFn) {
  if (!person.alive) return person;

  let next = { ...person };
  const ageYears = Math.floor(next.ageDays / 365);

  // Check if child becomes adult
  if (next.isChild && ageYears >= gameConfig.childAdultAge) {
    next.isChild = false;
    next.status = "At home";
    // Assign a job when they turn 18
    const availableJobs = [
      { name: "Office Clerk", building: "office-1", starts: 9, ends: 17, wage: 16 },
      { name: "Analyst", building: "office-2", starts: 8, ends: 16, wage: 22 },
      { name: "Server", building: "restaurant", starts: 10, ends: 18, wage: 14 },
      { name: "Cook", building: "restaurant", starts: 11, ends: 19, wage: 18 },
    ];
    const jobTemplate = availableJobs[Math.floor(Math.random() * availableJobs.length)];
    next.job = {
      ...jobTemplate,
      title: jobTemplate.name,
    };
    next.money = 50; // Starting money for new adults
    
    // Find a new home if there's one with capacity
    const availableHome = buildings.find(b => b.type === "home" && buildingOccupancy(state.people, b.id) < b.capacity);
    if (availableHome) {
      next.homeId = availableHome.id;
      next.locationId = next.homeId;
      addLogFn(`${next.name} turned ${gameConfig.childAdultAge}, got a job as ${next.job.title}, and moved into ${availableHome.name}!`);
    } else {
      addLogFn(`${next.name} turned ${gameConfig.childAdultAge} and got a job as ${next.job.title}!`);
    }
  }

  // Children don't work or have complex needs
  if (next.isChild) {
    next.hunger = clamp(next.hunger + 2, 0, 100);
    next.energy = clamp(next.energy - 2, 0, 100);
    next.happiness = clamp(next.happiness - 1, 0, 100);
    
    // Children stay at home or play
    if (state.hour >= 22 || state.hour < 8) {
      next.energy = clamp(next.energy + 15, 0, 100);
      next.status = "Sleeping";
      next.locationId = next.homeId;
    } else if (state.hour >= 9 && state.hour <= 15) {
      const school = buildings.find(b => b.type === "school");
      if (school) {
        next.status = "At School";
        next.locationId = school.id;
        next.happiness = clamp(next.happiness + 2, 0, 100);
      } else {
        next.status = "Playing";
        next.locationId = "town-square";
        next.happiness = clamp(next.happiness + 3, 0, 100);
      }
    } else {
      next.status = "Child at home";
      next.locationId = next.homeId;
    }
    
    // Parents feed children
    if (next.hunger >= 60) {
      const parentA = getPerson(state.people, next.parentAId);
      const parentB = getPerson(state.people, next.parentBId);
      const parent = parentA?.alive ? parentA : parentB?.alive ? parentB : null;
      
      if (parent && parent.money >= gameConfig.mealCost) {
        next.hunger = clamp(next.hunger - 40, 0, 100);
        next.happiness = clamp(next.happiness + 5, 0, 100);
      }
    }
    
    return next;
  }

  if (ageYears >= state.deathAge) {
    addLogFn(`${next.name} died of old age at ${ageYears}.`);
    return {
      ...next,
      alive: false,
      status: "Died of old age",
      locationId: next.homeId,
    };
  }

  const likelySleeping = state.hour >= 22 || state.hour < 6 || next.energy <= 18;
  next.hunger = clamp(next.hunger + (likelySleeping ? 3 : 8), 0, 100);
  next.energy = clamp(next.energy - 5, 0, 100);
  next.happiness = clamp(next.happiness - 2, 0, 100);

  if (next.sick) {
    next.sickHours += 1;
    next.energy = clamp(next.energy - 8, 0, 100);
    next.happiness = clamp(next.happiness - 4, 0, 100);
    if (next.sickHours >= 18 && (next.happiness <= 12 || Math.random() < 0.18)) {
      addLogFn(`${next.name} died after being sick and deeply unhappy.`);
      return {
        ...next,
        alive: false,
        status: "Died from sickness",
        locationId: next.homeId,
      };
    }
  }

  if (next.happiness <= 15) {
    next.depressedHours += 1;
    
    if (!next.isChild && next.money <= 0 && next.depressedHours >= 4) {
      if (Math.random() < 0.40) { // 40% chance per hour if broke and depressed
        addLogFn(`💔 ${next.name} ended their life after losing everything and falling into deep despair.`);
        return {
          ...next,
          alive: false,
          status: "Ended their own life",
          locationId: next.homeId,
        };
      }
    }

    if (!next.sick && next.depressedHours >= 8 && Math.random() < 0.28) {
      next.sick = true;
      next.sickHours = 1;
      addLogFn(`${next.name} became sick after staying depressed.`);
    }
  } else if (next.happiness >= 35) {
    next.depressedHours = Math.max(0, next.depressedHours - 2);
  }

  if (next.hunger >= 62) {
    if (next.money >= gameConfig.mealCost) {
      next.money -= gameConfig.mealCost;
      next.mealsMissed = 0;
      next.hunger = clamp(next.hunger - 42, 0, 100);
      next.energy = clamp(next.energy + 4, 0, 100);
      next.happiness = clamp(next.happiness + 6, 0, 100);
      if (next.sick && next.happiness >= 45 && Math.random() < 0.18) {
        next.sick = false;
        next.sickHours = 0;
        addLogFn(`${next.name} recovered after eating and feeling better.`);
      }
      next.locationId = "restaurant";
      next.status = "Eating";
      if (next.hunger <= 25) {
        addLogFn(`${next.name} bought food for ${gameConfig.mealCost}.`);
      }
      return next;
    }
    next.mealsMissed += 1;
    next.happiness = clamp(next.happiness - 10, 0, 100);
    if (next.hunger >= 96 && next.mealsMissed >= 4) {
      addLogFn(`${next.name} died from hunger after missing ${next.mealsMissed} meals.`);
      return {
        ...next,
        alive: false,
        status: "Died from hunger",
        locationId: next.homeId,
      };
    }
    next.locationId = next.homeId;
    next.status = "Too broke to eat";
    if (next.mealsMissed === 1 || next.mealsMissed % 3 === 0) {
      addLogFn(`${next.name} is hungry but only has ${Math.floor(next.money)}.`);
    }
    return next;
  }

  const shouldSleep = state.hour >= 22 || state.hour < 6 || next.energy <= 18;
  if (shouldSleep) {
    const recovery = state.hour >= 22 || state.hour < 6 ? 18 : 12;
    next.energy = clamp(next.energy + recovery, 0, 100);
    next.hunger = clamp(next.hunger + 1, 0, 100);
    next.happiness = clamp(next.happiness + (next.sick ? 1 : 3), 0, 100);
    next.locationId = next.homeId;
    next.status = next.sick ? "Sick in bed" : "Sleeping";
    return next;
  }

  const church = buildings.find(b => b.type === "church");
  if (church && state.day % 7 === 0 && state.hour >= 9 && state.hour <= 11 && !isWorkHour(next, state.hour)) {
    next.locationId = church.id;
    next.status = "At Church";
    next.happiness = clamp(next.happiness + 5, 0, 100);
    return next;
  }

  if (isWorkHour(next, state.hour)) {
    if (state.hour === 12 && next.energy >= 30 && Math.random() < 0.65) {
      next.locationId = next.money >= gameConfig.mealCost ? "restaurant" : "town-square";
      next.status = "Socializing";
      next.happiness = clamp(next.happiness + 3, 0, 100);
      return next;
    }
    next.locationId = next.job.building;
    next.status = "Working";
    next.money += next.job.wage;
    next.energy = clamp(next.energy - 3, 0, 100);
    next.happiness = clamp(next.happiness - (next.sick ? 12 : 6), 0, 100); // Massive happiness drain
    return next;
  }

  if (next.job && next.money < gameConfig.lowMoneyLine && state.hour >= 6 && state.hour <= 21) {
    next.locationId = next.job.building;
    next.status = "Working overtime";
    next.money += Math.round(next.job.wage * 0.75);
    next.energy = clamp(next.energy - 8, 0, 100);
    next.happiness = clamp(next.happiness - 12, 0, 100); // Brutal overtime drain
    return next;
  }

  // Entertainment & Gambling logic
  if (next.gamblingAddiction === undefined) next.gamblingAddiction = 0;
  const needsFun = next.happiness <= 70 || next.gamblingAddiction > 15;

  if (state.hour >= 17 && state.hour <= 23 && needsFun && next.money >= 35) {
    const entertainment = buildings.filter(b => ["cinema", "mall", "casino"].includes(b.type));
    if (entertainment.length > 0 && Math.random() < 0.5) { // 50% chance to go
      
      let place;
      if (next.gamblingAddiction > 15 && Math.random() < 0.8) {
        place = entertainment.find(b => b.type === "casino"); // Addicts prefer casino
      } else {
        place = entertainment[Math.floor(Math.random() * entertainment.length)];
      }

      if (place) {
        next.locationId = place.id;
        next.energy = clamp(next.energy - 10, 0, 100);

        if (place.type === "casino") {
          const bet = Math.min(next.money, 40 + (next.gamblingAddiction * 3)); // Addicts bet more!
          next.money -= bet;
          if (Math.random() < 0.49) { // 49% chance to win
            const winnings = bet * 2;
            next.money += winnings;
            next.happiness = clamp(next.happiness + 40, 0, 100);
            next.gamblingAddiction += 5; // Winning causes addiction
            next.status = "Won BIG at Casino!";
            if (bet >= 80) {
              addLogFn(`🎰 ${next.name} bet $${Math.floor(bet)} at the Casino and WON $${Math.floor(winnings)}!`);
              next.modalEvent = {
                title: "🎰 JACKPOT!",
                message: `${next.name} just won massive at the Casino, walking away with $${Math.floor(winnings)}! The drinks are on them!`
              };
            }
          } else {
            next.happiness = clamp(next.happiness - 15, 0, 100);
            next.gamblingAddiction += 2; // Losing still forms the habit
            next.status = "Lost money at Casino";
            if (next.money <= 10) addLogFn(`💸 ${next.name} went completely broke gambling at the Casino!`);
          }
        } else {
          next.status = `Having fun at ${place.name}`;
          next.money -= 35;
          next.happiness = clamp(next.happiness + 35, 0, 100);
        }
        return next;
      }
    }
  }

  if (state.hour >= 18 && state.hour <= 21 && next.trait === "Social") {
    next.locationId = "restaurant";
    next.status = "Socializing";
    next.energy = clamp(next.energy - 1, 0, 100);
    next.happiness = clamp(next.happiness + 4, 0, 100);
    return next;
  }

  if (state.hour >= 17 && state.hour <= 21 && next.energy >= 35) {
    const closeFriend = getCloseFriend(state.people, state.relationships, next);
    if (closeFriend && Math.random() < 0.55) {
      next.locationId =
        closeFriend.locationId === "restaurant" || closeFriend.locationId === "town-square"
          ? closeFriend.locationId
          : "town-square";
      next.status = closeFriend.id === next.partnerId ? "On a date" : "Hanging out";
      next.happiness = clamp(next.happiness + (closeFriend.id === next.partnerId ? 8 : 6), 0, 100);
      next.energy = clamp(next.energy - 2, 0, 100);
      return next;
    }

    const freeTimeRoll = Math.random();
    if (freeTimeRoll < 0.45) {
      next.locationId = "town-square";
      next.status = "Relaxing";
      next.happiness = clamp(next.happiness + 5, 0, 100);
    } else if (freeTimeRoll < 0.7 && next.money >= gameConfig.mealCost * 2) {
      next.locationId = "restaurant";
      next.status = "Socializing";
      next.happiness = clamp(next.happiness + 4, 0, 100);
    } else {
      next.locationId = next.homeId;
      next.status = "Running errands";
      next.happiness = clamp(next.happiness + 1, 0, 100);
    }
    next.energy = clamp(next.energy - 2, 0, 100);
    return next;
  }

  if (
    next.partnerId &&
    state.hour >= 12 &&
    state.hour <= 21 &&
    next.energy >= 32 &&
    Math.random() < 0.22
  ) {
    const partner = getPerson(state.people, next.partnerId);
    if (partner?.alive) {
      next.locationId =
        partner.locationId === "restaurant" || partner.locationId === "town-square"
          ? partner.locationId
          : "town-square";
      next.status = "On a date";
      next.happiness = clamp(next.happiness + 7, 0, 100);
      next.energy = clamp(next.energy - 2, 0, 100);
      return next;
    }
  }

  next.locationId = next.homeId;
  next.status = "At home";
  next.energy = clamp(next.energy + 4, 0, 100);
  next.happiness = clamp(next.happiness + 1, 0, 100);
  return next;
}

export function buildingOccupancy(people, buildingId) {
  return people.filter((person) => person.alive && person.locationId === buildingId).length;
}
