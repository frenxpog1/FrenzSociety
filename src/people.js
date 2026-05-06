// People and character management
import { names, genders, traits, skills, jobs, entryLevelJobs, buildings, gameConfig } from './constants.js';
import { randomItem, clamp } from './utils.js';

export function assignHomes(people) {
  const houses = buildings.filter((building) => building.type === "home");
  let houseIndex = 0;
  let occupants = 0;

  return people.map((person) => {
    const house = houses[houseIndex];
    const updated = { ...person, homeId: house.id };
    occupants += 1;
    if (occupants >= house.capacity) {
      houseIndex += 1;
      occupants = 0;
    }
    return updated;
  });
}

export function assignJobs(people) {
  return people.map((person, index) => {
    if (index >= 20) {
      return { ...person, job: null };
    }
    
    let jobTitle;
    if (index === 0 || index === 1) jobTitle = "Police Officer (Day)";
    else if (index === 2 || index === 3) jobTitle = "Police Officer (Night)";
    else jobTitle = entryLevelJobs[(index - 4) % entryLevelJobs.length];

    const jobTemplate = jobs.find(j => j.name === jobTitle);
    if (!jobTemplate) return { ...person, job: null };
    
    return {
      ...person,
      job: {
        ...jobTemplate,
        title: jobTemplate.name,
      },
    };
  });
}

export function createPeople(count) {
  // Determine how many gambling addicts and career criminals
  const numGamblingAddicts = Math.floor(count * gameConfig.gamblingAddictChance);
  const numCareerCriminals = Math.floor(count / gameConfig.careerCriminalRatio);
  
  const people = Array.from({ length: count }, (_, index) => {
    const age = 18 + Math.floor(Math.random() * 42);
    const isGamblingAddict = index < numGamblingAddicts;
    const isCareerCriminal = index >= numGamblingAddicts && index < (numGamblingAddicts + numCareerCriminals);
    
    return {
      id: `person-${index + 1}`,
      name: names[index],
      ageDays: age * 365 + Math.floor(Math.random() * 300),
      hunger: 35 + Math.floor(Math.random() * 25),
      energy: 55 + Math.floor(Math.random() * 35),
      happiness: 48 + Math.floor(Math.random() * 35),
      money: 70 + Math.floor(Math.random() * 95),
      mealsMissed: 0,
      talkedToday: 0,
      depressedHours: 0,
      sickHours: 0,
      sick: false,
      gender: genders[index % genders.length],
      partnerId: null,
      alive: true,
      status: "At home",
      locationId: null,
      trait: randomItem(traits),
      skill: randomItem(skills),
      homeId: null,
      job: null,
      daysWorked: 0, // Track days worked for promotion
      robberyConfidence: 0, // Track robbery confidence
      gamblingAddiction: isGamblingAddict ? 20 : 0, // Gambling addicts start with max addiction
      isCareerCriminal: isCareerCriminal, // Career criminals rob regardless of happiness
      isSerialKiller: false, // Serial killer status
      lastKillDay: 0, // Track when serial killer last killed
    };
  });

  return assignJobs(assignHomes(people)).map((person) => ({
    ...person,
    locationId: person.homeId,
  }));
}

export function getPerson(people, id) {
  return people.find((person) => person.id === id);
}

export function createChild(parentA, parentB, state) {
  const childId = `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const childGender = randomItem(genders);
  const childName = randomItem(names);
  
  return {
    id: childId,
    name: childName,
    ageDays: 0,
    hunger: 20,
    energy: 80,
    happiness: 70,
    money: 0,
    mealsMissed: 0,
    talkedToday: 0,
    depressedHours: 0,
    sickHours: 0,
    sick: false,
    gender: childGender,
    partnerId: null,
    alive: true,
    status: "Child at home",
    locationId: parentA.homeId,
    trait: randomItem(traits),
    skill: randomItem(skills),
    homeId: parentA.homeId,
    job: null,
    isChild: true,
    parentAId: parentA.id,
    parentBId: parentB.id,
    daysWorked: 0, // Track days worked for promotion
  };
}
