// Core simulation logic
import { gameConfig, buildings, entryLevelJobs, jobs } from './constants.js';
import { clamp } from './utils.js';
import { getPerson } from './people.js';
import { getCloseFriend } from './relationships.js';

export function getBuilding(id) {
  return buildings.find((building) => building.id === id);
}

export function isWorkHour(person, hour) {
  if (!person.job) return false;
  if (person.job.starts < person.job.ends) {
    return hour >= person.job.starts && hour < person.job.ends;
  } else {
    // Night shift crosses midnight
    return hour >= person.job.starts || hour < person.job.ends;
  }
}

export function updatePerson(person, state, addLogFn) {
  if (!person.alive) return person;

  let next = { ...person };
  const ageYears = Math.floor(next.ageDays / 365);

  // Check if child becomes adult
  if (next.isChild && ageYears >= gameConfig.childAdultAge) {
    next.isChild = false;
    next.status = "At home";
    // Assign an entry-level job when they turn 18
    const jobTitle = entryLevelJobs[Math.floor(Math.random() * entryLevelJobs.length)];
    const jobTemplate = jobs.find(j => j.name === jobTitle);
    
    if (jobTemplate) {
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
      deathDay: state.day,
    };
  }

  // Handle jail time
  if (next.jailHoursRemaining > 0) {
    next.jailHoursRemaining -= 1;
    next.locationId = "jail-1";
    next.status = `In Jail (${next.jailHoursRemaining}h left)`;
    next.happiness = clamp(next.happiness - 3, 0, 100);
    next.energy = 50;
    next.hunger = 50; // fed in jail
    
    if (next.jailHoursRemaining === 0) {
      next.status = "Released from jail";
      next.locationId = next.homeId;
      addLogFn(`🚔 ${next.name} was released from jail after serving their time.`);
    }
    return next;
  }

  const likelySleeping = state.hour >= 22 || state.hour < 6 || next.energy <= 18;
  next.hunger = clamp(next.hunger + (likelySleeping ? 3 : 8), 0, 100);
  next.energy = clamp(next.energy - 5, 0, 100);
  next.happiness = clamp(next.happiness - 2, 0, 100);

  if (next.sick) {
    next.sickHours += 1;
    next.energy = clamp(next.energy - 8, 0, 100);
    next.happiness = clamp(next.happiness - 4, 0, 100);
    
    // Sick people go to hospital if they can afford it
    const hospital = buildings.find(b => b.type === "hospital");
    if (hospital && next.money >= gameConfig.hospitalCost && state.hour >= 8 && state.hour <= 20 && Math.random() < 0.6) {
      next.locationId = hospital.id;
      next.status = "Getting treatment";
      next.money -= gameConfig.hospitalCost;
      next.sick = false;
      next.sickHours = 0;
      next.happiness = clamp(next.happiness + 25, 0, 100);
      next.energy = clamp(next.energy + 15, 0, 100);
      addLogFn(`🏥 ${next.name} went to the hospital and recovered! Cost: $${gameConfig.hospitalCost}`);
      return next;
    }
    
    if (next.sickHours >= 18 && (next.happiness <= 12 || Math.random() < 0.18)) {
      addLogFn(`${next.name} died after being sick and deeply unhappy.`);
      return {
        ...next,
        alive: false,
        status: "Died from sickness",
        locationId: next.homeId,
        deathDay: state.day,
      };
    }
  }

  if (next.happiness <= 15) {
    next.depressedHours += 1;
    
    // LAST CHANCE: If happiness hits 0 and they have money, go all-in at casino
    const isCop = next.job && next.job.title && next.job.title.includes("Police");
    if (next.happiness === 0 && next.money >= 20 && state.hour >= 10 && state.hour <= 23 && (!isCop || Math.random() < 0.3)) {
      const casino = buildings.find(b => b.type === "casino");
      if (casino) {
        next.locationId = casino.id;
        const allIn = Math.floor(next.money); // Bet EVERYTHING
        next.money = 0;
        next.energy = clamp(next.energy - 10, 0, 100);
        // Bet tracked for casino balance
        
        if (Math.random() < 0.61) { // 61% chance to win
          const winnings = allIn * 2;
          next.casinoPayout = winnings; // Casino pays out
          const tax = Math.floor(winnings * 0.2);
          next.treasuryContribution = tax;
          next.money = (winnings - tax);
          next.happiness = clamp(next.happiness + 60, 0, 100); // MASSIVE boost
          next.gamblingAddiction = (next.gamblingAddiction || 0) + 10;
          next.depressedHours = 0;
          next.status = "WON EVERYTHING at Casino!";
          addLogFn(`🎰🔥 ${next.name} bet their LAST $${allIn} in a final desperate gamble and WON $${winnings}! LIFE SAVED!`);
          next.modalEvent = {
            title: "🎰🔥 MIRACLE WIN!",
            message: `${next.name} was at rock bottom (0% happiness) and bet their LAST $${allIn}... and WON $${winnings}! Their life is saved!`
          };
        } else {
          next.happiness = 0;
          // 50% of losses go to town treasury
          const treasuryShare = Math.floor(allIn * 0.5);
          next.treasuryContribution = treasuryShare;
            const casinoShare = allIn - treasuryShare;
            next.casinoContribution = casinoShare;
          next.gamblingAddiction = (next.gamblingAddiction || 0) + 5;
          next.status = "Lost everything - final gamble";
          addLogFn(`💀 ${next.name} bet everything ($${allIn}) in a final desperate gamble... and lost it all.`);
          next.modalEvent = {
            title: "💀 TOTAL RUIN",
            message: `${next.name} bet their last $${allIn} in desperation... and lost everything. Balance: $0. They may not survive this.`
          };
        }
        return next;
      }
    }
    
    // Desperate people try entertainment/gambling as last resort BEFORE suicide
    if (!next.isChild && next.money <= 50 && next.depressedHours >= 3 && state.hour >= 10 && state.hour <= 23) {
      const entertainment = buildings.filter(b => ["cinema", "casino"].includes(b.type));
      if (entertainment.length > 0 && next.money >= 15) {
        // Desperate people gamble more - it's their last hope
        const casino = entertainment.find(b => b.type === "casino");
        const isCop = next.job && next.job.title && next.job.title.includes("Police");
        if (casino && Math.random() < 0.7 && (!isCop || Math.random() < 0.3)) { // Cops less likely to gamble desperately
          next.locationId = casino.id;
          const bet = Math.floor(next.money * 0.8); // Bet almost everything!
          next.money -= bet;
          next.energy = clamp(next.energy - 8, 0, 100);
          // Bet tracked for casino balance
          
          if (Math.random() < 0.61) { // 61% chance to win
            const winnings = bet * 2;
            next.casinoPayout = winnings; // Casino pays out
            const tax = Math.floor(winnings * 0.2);
            next.treasuryContribution = tax;
            next.money += (winnings - tax);
            next.happiness = clamp(next.happiness + 50, 0, 100); // HUGE happiness boost
            next.gamblingAddiction = (next.gamblingAddiction || 0) + 8;
            next.depressedHours = 0; // Reset depression!
            next.status = "Won BIG at Casino!";
            addLogFn(`🎰💰 ${next.name} was desperate and bet everything ($${bet}) at the Casino and WON $${winnings}! Life saved!`);
            if (bet >= 100) { // Only show modal for big desperate wins ($100+)
              next.modalEvent = {
                title: "🎰💰 DESPERATE WIN!",
                message: `${next.name} was desperate (${Math.round(next.happiness - 50)}% happiness) and bet $${bet}... and WON $${winnings}! They're saved!`
              };
            }
          } else {
            const balanceLeft = Math.floor(next.money);
            // 50% of losses go to town treasury
            const treasuryShare = Math.floor(bet * 0.5);
            next.treasuryContribution = treasuryShare;
            const casinoShare = bet - treasuryShare;
            next.casinoContribution = casinoShare;
            next.happiness = clamp(next.happiness - 20, 0, 100);
            next.gamblingAddiction = (next.gamblingAddiction || 0) + 3;
            next.status = "Lost everything gambling";
            addLogFn(`💸 ${next.name} gambled their last $${bet} in desperation and lost it all... Balance: $${balanceLeft}`);
            if (bet >= 100) { // Only show modal for big desperate losses ($100+)
              next.modalEvent = {
                title: "💸 DESPERATE LOSS",
                message: `${next.name} was desperate and bet $${bet}... and lost it all. Balance: $${balanceLeft}. Things are looking grim.`
              };
            }
          }
          return next;
        }
        
        // Or try cinema/mall if they have a bit more money
        const cheapFun = entertainment.filter(b => b.type !== "casino");
        if (cheapFun.length > 0 && next.money >= 25) {
          const place = cheapFun[Math.floor(Math.random() * cheapFun.length)];
          next.locationId = place.id;
          next.status = `Desperately seeking joy at ${place.name}`;
          next.money -= 25;
          next.happiness = clamp(next.happiness + 30, 0, 100);
          next.energy = clamp(next.energy - 8, 0, 100);
          next.depressedHours = Math.max(0, next.depressedHours - 2);
          addLogFn(`${next.name} spent their last money at ${place.name} trying to feel better.`);
          return next;
        }
      }
    }
    
    // DESPERATION: Try robbery before suicide
    if (!next.isChild && next.money <= 15 && next.depressedHours >= 3 && next.happiness <= 30) {
      // Initialize robbery confidence if not set
      if (next.robberyConfidence === undefined) next.robberyConfidence = 0;
      
      // Desperate people attempt robbery instead of suicide
      // Target the RICHEST people to balance wealth
      const victims = state.people.filter(p => 
        p.alive && 
        p.id !== next.id && 
        p.money > 50 && 
        !p.isChild &&
        !(p.job && p.job.title && p.job.title.includes("Police")) && 
        !p.jailHoursRemaining
      );
      
      if (victims.length > 0) {
        // Sort by money and pick from top 3 richest
        const richest = victims.sort((a, b) => b.money - a.money).slice(0, 3);
        const victim = richest[Math.floor(Math.random() * richest.length)];
        next.robbingVictimId = victim.id;
        next.status = "Desperate - attempting robbery";
        addLogFn(`💰 ${next.name} is desperate and targeting ${victim.name} who has $${Math.floor(victim.money)}...`);
        return next;
      }
    }
    
    // LAST RESORT: Suicide only if completely broke, depressed, and can't rob
    if (!next.isChild && next.money <= 0 && next.depressedHours >= 8 && next.happiness <= 10) {
      if (Math.random() < 0.15) { // Reduced from 35% - robbery is now preferred
        addLogFn(`💔 ${next.name} ended their life after losing everything and falling into deep despair.`);
        return {
          ...next,
          alive: false,
          status: "Ended their own life",
          locationId: next.homeId,
          deathDay: state.day,
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
        deathDay: state.day,
      };
    }
    next.locationId = next.homeId;
    next.status = "Too broke to eat";
    if (next.mealsMissed === 1 || next.mealsMissed % 3 === 0) {
      addLogFn(`${next.name} is hungry but only has ${Math.floor(next.money)}.`);
    }
    return next;
  }

  let shouldSleep = false;
  if (next.job && next.job.starts > next.job.ends) {
    // Night shift (e.g. 18 to 6). Sleep during the day, e.g. 8 to 16
    shouldSleep = (state.hour >= 8 && state.hour < 16) || next.energy <= 18;
  } else {
    // Normal schedule
    shouldSleep = (state.hour >= 22 || state.hour < 6 || next.energy <= 18);
  }

  if (shouldSleep && !isWorkHour(next, state.hour)) {
    const recovery = next.energy <= 18 ? 12 : 18;
    next.energy = clamp(next.energy + recovery, 0, 100);
    next.hunger = clamp(next.hunger + 1, 0, 100);
    next.happiness = clamp(next.happiness + (next.sick ? 1 : 3), 0, 100);
    next.locationId = next.homeId;
    next.status = next.sick ? "Sick in bed" : "Sleeping";
    return next;
  }

  // Police patrol during work hours
  const isPolice = next.job && next.job.title && next.job.title.includes("Police");
  if (isPolice && isWorkHour(next, state.hour) && !shouldSleep) {
    // Cops patrol town square and streets
    if (Math.random() < 0.6) {
      next.locationId = "town-square";
      next.status = "On Patrol";
    } else {
      next.locationId = next.job.building;
      next.status = "At Police Station";
    }
    next.happiness = clamp(next.happiness + 2, 0, 100);
    next.energy = clamp(next.energy - 2, 0, 100);
    return next;
  }

  // Crime logic (Robbery) - people with low money target the rich
  if (next.money <= 30 && next.happiness < 40 && !isPolice && !next.isChild) {
    // Higher chance based on desperation and confidence
    const baseChance = gameConfig.robberyChance * 3; // 15% base chance (was 5%)
    const confidenceBonus = (next.robberyConfidence || 0) * 0.02; // +2% per confidence point
    const robberyChance = Math.min(baseChance + confidenceBonus, 0.5); // Max 50% chance
    
    if (Math.random() < robberyChance) {
      // Initialize robbery confidence if not set
      if (next.robberyConfidence === undefined) next.robberyConfidence = 0;
      
      // Target the RICHEST people to balance wealth
      const victims = state.people.filter(p => 
        p.alive && 
        p.id !== next.id && 
        p.money > 100 && // Only rob people with significant money
        !p.isChild &&
        !(p.job && p.job.title && p.job.title.includes("Police")) && 
        !p.jailHoursRemaining
      );
      
      if (victims.length > 0) {
        // Sort by money and pick from top 5 richest
        const richest = victims.sort((a, b) => b.money - a.money).slice(0, 5);
        const victim = richest[Math.floor(Math.random() * richest.length)];
        next.robbingVictimId = victim.id;
        next.status = "Attempting robbery";
        addLogFn(`💰 ${next.name} (confidence: ${next.robberyConfidence}) is targeting ${victim.name} who has $${Math.floor(victim.money)}...`);
        return next;
      }
    }
  }

  // Broke people work whenever possible (even on weekends!)
  if (next.job && next.money <= 15 && state.hour >= 6 && state.hour <= 21 && !isWorkHour(next, state.hour) && next.energy >= 20) {
    next.locationId = next.job.building;
    next.status = "Desperately working for money";
    const grossWage = Math.round(next.job.wage * 0.5);
    const incomeTax = Math.floor(grossWage * 0.15); // 15% income tax
    const netWage = grossWage - incomeTax;
    next.money += netWage;
    next.treasuryContribution = (next.treasuryContribution || 0) + incomeTax;
    next.energy = clamp(next.energy - 12, 0, 100);
    next.happiness = clamp(next.happiness - 15, 0, 100);
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
    const grossWage = next.job.wage;
    const incomeTax = Math.floor(grossWage * 0.15); // 15% income tax
    const netWage = grossWage - incomeTax;
    next.money += netWage;
    next.treasuryContribution = (next.treasuryContribution || 0) + incomeTax;
    next.energy = clamp(next.energy - 3, 0, 100);
    next.happiness = clamp(next.happiness - (next.sick ? 12 : 6), 0, 100); // Massive happiness drain
    return next;
  }

  if (next.job && next.money < gameConfig.lowMoneyLine && state.hour >= 6 && state.hour <= 21) {
    next.locationId = next.job.building;
    next.status = "Working overtime";
    const grossWage = Math.round(next.job.wage * 0.75);
    const incomeTax = Math.floor(grossWage * 0.15); // 15% income tax
    const netWage = grossWage - incomeTax;
    next.money += netWage;
    next.treasuryContribution = (next.treasuryContribution || 0) + incomeTax;
    next.energy = clamp(next.energy - 8, 0, 100);
    next.happiness = clamp(next.happiness - 12, 0, 100); // Brutal overtime drain
    return next;
  }

  // Gambling addicts work extra to fund their addiction!
  if (next.job && next.gamblingAddiction > 10 && next.money < 100 && state.hour >= 6 && state.hour <= 21 && !isWorkHour(next, state.hour)) {
    next.locationId = next.job.building;
    next.status = "Working for gambling money";
    const grossWage = Math.round(next.job.wage * 0.6);
    const incomeTax = Math.floor(grossWage * 0.15); // 15% income tax
    const netWage = grossWage - incomeTax;
    next.money += netWage;
    next.treasuryContribution = (next.treasuryContribution || 0) + incomeTax;
    next.energy = clamp(next.energy - 10, 0, 100);
    next.happiness = clamp(next.happiness - 8, 0, 100);
    return next;
  }

  // Entertainment & Gambling logic - NO COOLDOWN, SPAM AWAY!
  if (next.gamblingAddiction === undefined) next.gamblingAddiction = 0;
  const needsFun = next.happiness <= 70 || next.gamblingAddiction > 15;

  if (state.hour >= 17 && state.hour <= 23 && needsFun && next.money >= 35) {
    const entertainment = buildings.filter(b => ["cinema", "casino"].includes(b.type));
    if (entertainment.length > 0 && Math.random() < 0.5) { // 50% chance to go
      
      let place;
      if (next.gamblingAddiction > 15 && Math.random() < 0.8) {
        // Check if casino is broke
        const casinoBroke = state.casinoBankroll <= 0;
        if (casinoBroke) {
          // Casino is broke, hang out at town square instead
          next.locationId = "town-square";
          next.status = "Casino closed - hanging out";
          next.happiness = clamp(next.happiness + 10, 0, 100);
          next.energy = clamp(next.energy - 5, 0, 100);
          if (next.money >= 15) {
            next.money -= 15;
            next.happiness = clamp(next.happiness + 10, 0, 100);
            next.status = "Buying snacks (Casino closed)";
            next.treasuryContribution = (next.treasuryContribution || 0) + 3;
          }
          return next;
        }
        place = entertainment.find(b => b.type === "casino"); // Addicts prefer casino
      } else {
        place = entertainment[Math.floor(Math.random() * entertainment.length)];
      }

      if (place) {
        next.locationId = place.id;
        next.energy = clamp(next.energy - 10, 0, 100);

        if (place.type === "casino") {
          const isCop = next.job && next.job.title && next.job.title.includes("Police");
          if (isCop && Math.random() < 0.8) return next; // Cops mostly avoid gambling, but can sometimes
          const bet = Math.min(next.money, 40 + (next.gamblingAddiction * 3)); // Addicts bet more!
          next.money -= bet;
          // Bet tracked for casino balance
          if (Math.random() < 0.61) { // 61% chance to win
            const winnings = bet * 2;
            next.casinoPayout = winnings; // Casino pays out
            const tax = Math.floor(winnings * 0.2);
            next.treasuryContribution = tax;
            next.money += (winnings - tax);
            next.happiness = clamp(next.happiness + 40, 0, 100);
            next.gamblingAddiction += 5; // Winning causes addiction
            next.status = "Won BIG at Casino!";
            if (bet >= 150) { // Only show modal for HUGE wins ($150+)
              addLogFn(`🎰 ${next.name} bet $${Math.floor(bet)} at the Casino and WON $${Math.floor(winnings)}!`);
              next.modalEvent = {
                title: "🎰 JACKPOT!",
                message: `${next.name} just won massive at the Casino, walking away with $${Math.floor(winnings)}! The drinks are on them!`
              };
            }
          } else {
            // 50% of losses go to town treasury
            const treasuryShare = Math.floor(bet * 0.5);
            next.treasuryContribution = treasuryShare;
            const casinoShare = bet - treasuryShare;
            next.casinoContribution = casinoShare;
            next.happiness = clamp(next.happiness - 15, 0, 100);
            next.gamblingAddiction += 2; // Losing still forms the habit
            next.status = "Lost money at Casino";
            const balanceLeft = Math.floor(next.money);
            if (bet >= 150) { // Only show modal for HUGE losses ($150+)
              addLogFn(`💸 ${next.name} lost $${Math.floor(bet)} at the Casino! Balance: $${balanceLeft}`);
              next.modalEvent = {
                title: "💸 CRUSHING LOSS!",
                message: `${next.name} just lost $${Math.floor(bet)} at the Casino! They're down to only $${balanceLeft}...`
              };
            } else if (next.money <= 10) {
              addLogFn(`💸 ${next.name} went completely broke gambling at the Casino!`);
            }
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
      
      if (next.locationId === "town-square" && next.money >= 10) {
        next.money -= 10;
        next.happiness = clamp(next.happiness + 15, 0, 100);
        next.status = "Buying snacks at Square";
        next.treasuryContribution = (next.treasuryContribution || 0) + 2;
      }
      
      next.energy = clamp(next.energy - 2, 0, 100);
      return next;
    }

    const freeTimeRoll = Math.random();
    if (freeTimeRoll < 0.45) {
      next.locationId = "town-square";
      if (next.money >= 10) {
        next.money -= 10;
        next.happiness = clamp(next.happiness + 20, 0, 100);
        next.status = "Buying snacks at Square";
        next.treasuryContribution = (next.treasuryContribution || 0) + 2;
      } else {
        next.status = "Relaxing";
        next.happiness = clamp(next.happiness + 5, 0, 100);
      }
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
      
      if (next.locationId === "town-square" && next.money >= 10) {
        next.money -= 10;
        next.happiness = clamp(next.happiness + 15, 0, 100);
        next.status = "Buying snacks on Date";
        next.treasuryContribution = (next.treasuryContribution || 0) + 2;
      }
      
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

export function homeOccupancy(people, homeId) {
  return people.filter((person) => person.alive && person.homeId === homeId).length;
}
