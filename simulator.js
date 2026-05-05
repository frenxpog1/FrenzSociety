const names = [
  "Ari",
  "Bea",
  "Cleo",
  "Dani",
  "Eli",
  "Faye",
  "Gio",
  "Hana",
  "Ivan",
  "Jia",
  "Kai",
  "Lina",
  "Mika",
  "Nico",
  "Ola",
];

const traits = [
  "Early Bird",
  "Night Owl",
  "Social",
  "Focused",
  "Calm",
  "Messy",
  "Ambitious",
  "Careful",
];

const skills = [
  "Cooking",
  "Accounting",
  "Sales",
  "Cleaning",
  "Repair",
  "Coding",
  "Service",
  "Planning",
];

const genders = ["Female", "Male"];

const jobs = [
  { name: "Office Clerk", building: "office-1", starts: 9, ends: 17, wage: 16 },
  { name: "Analyst", building: "office-2", starts: 8, ends: 16, wage: 22 },
  { name: "Server", building: "restaurant", starts: 10, ends: 18, wage: 14 },
  { name: "Cook", building: "restaurant", starts: 11, ends: 19, wage: 18 },
];

const mealCost = 12;
const lowMoneyLine = 25;
const friendThreshold = 20;
const closeFriendThreshold = 35;
const crushThreshold = 25;
const coupleFriendThreshold = 35;
const coupleRomanceThreshold = 45;
const enemyConflictThreshold = 45;

const buildings = [
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `house-${index + 1}`,
    type: "home",
    name: `House ${index + 1}`,
    beds: 1,
    capacity: 2,
    x: [9, 23, 37, 63, 77, 91, 12, 28, 72, 88][index],
    y: [12, 12, 12, 12, 12, 12, 82, 82, 82, 82][index],
  })),
  {
    id: "office-1",
    type: "office",
    name: "Office A",
    jobs: 4,
    x: 22,
    y: 50,
  },
  {
    id: "office-2",
    type: "office",
    name: "Office B",
    jobs: 4,
    x: 78,
    y: 50,
  },
  {
    id: "restaurant",
    type: "restaurant",
    name: "Restaurant",
    jobs: 4,
    x: 50,
    y: 72,
  },
  {
    id: "town-square",
    type: "square",
    name: "Town Square",
    x: 50,
    y: 29,
  },
];

const state = {
  running: true,
  speed: 1,
  hour: 6,
  day: 1,
  people: [],
  relationships: {},
  motion: {},
  speech: {},
  recentTopics: {},
  selectedId: null,
  eventLog: [],
  conversations: [],
  deathAge: 82,
  populationSize: 12,
  tickTimer: null,
  socialTimer: null,
  nextConversationAt: 0,
  animationFrame: null,
  lastFrameAt: 0,
};

const els = {
  dayLabel: document.querySelector("#dayLabel"),
  timeLabel: document.querySelector("#timeLabel"),
  toggleRun: document.querySelector("#toggleRun"),
  stepHour: document.querySelector("#stepHour"),
  restart: document.querySelector("#restart"),
  speedSelect: document.querySelector("#speedSelect"),
  deathAge: document.querySelector("#deathAge"),
  deathAgeLabel: document.querySelector("#deathAgeLabel"),
  populationSize: document.querySelector("#populationSize"),
  aliveStat: document.querySelector("#aliveStat"),
  housedStat: document.querySelector("#housedStat"),
  employedStat: document.querySelector("#employedStat"),
  hungryStat: document.querySelector("#hungryStat"),
  moneyStat: document.querySelector("#moneyStat"),
  happinessStat: document.querySelector("#happinessStat"),
  couplesStat: document.querySelector("#couplesStat"),
  townMap: document.querySelector("#townMap"),
  peopleList: document.querySelector("#peopleList"),
  personDetails: document.querySelector("#personDetails"),
  conversationList: document.querySelector("#conversationList"),
  eventLog: document.querySelector("#eventLog"),
  friendModal: document.querySelector("#friendModal"),
  friendModalTitle: document.querySelector("#friendModalTitle"),
  friendModalBody: document.querySelector("#friendModalBody"),
  closeFriendModal: document.querySelector("#closeFriendModal"),
};

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getBuilding(id) {
  return buildings.find((building) => building.id === id);
}

function getPerson(id) {
  return state.people.find((person) => person.id === id);
}

function relationshipKey(idA, idB) {
  return [idA, idB].sort().join("|");
}

function getRelationship(idA, idB) {
  const key = relationshipKey(idA, idB);
  if (!state.relationships[key]) {
    state.relationships[key] = {
      friendship: 0,
      romance: 0,
      conflict: 0,
      crush: false,
      close: false,
      enemy: false,
      couple: false,
    };
  }
  return state.relationships[key];
}

function getCloseFriend(person) {
  const closeRelations = Object.entries(state.relationships)
    .filter(([, relation]) => relation.close || relation.couple)
    .map(([key, relation]) => {
      const [idA, idB] = key.split("|");
      const friendId = idA === person.id ? idB : idB === person.id ? idA : null;
      return friendId ? { friend: getPerson(friendId), relation } : null;
    })
    .filter((entry) => entry?.friend?.alive);

  if (person.partnerId) {
    const partner = getPerson(person.partnerId);
    if (partner?.alive) return partner;
  }

  if (closeRelations.length === 0) return null;
  closeRelations.sort((a, b) => b.relation.friendship - a.relation.friendship);
  return closeRelations[0].friend;
}

function addLog(message) {
  const stamp = `Day ${state.day}, ${formatHour(state.hour)}`;
  state.eventLog.unshift({ stamp, message });
  state.eventLog = state.eventLog.slice(0, 40);
}

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

function assignHomes(people) {
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

function assignJobs(people) {
  return people.map((person, index) => {
    if (index >= 12) {
      return { ...person, job: null };
    }
    const jobTemplate = jobs[index % jobs.length];
    return {
      ...person,
      job: {
        ...jobTemplate,
        title: jobTemplate.name,
      },
    };
  });
}

function createPeople() {
  const count = clamp(Number(els.populationSize.value) || 12, 10, 15);
  const people = Array.from({ length: count }, (_, index) => {
    const age = 18 + Math.floor(Math.random() * 42);
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
    };
  });

  return assignJobs(assignHomes(people)).map((person) => ({
    ...person,
    locationId: person.homeId,
  }));
}

function resetSimulation() {
  state.hour = 6;
  state.day = 1;
  state.deathAge = Number(els.deathAge.value);
  state.populationSize = Number(els.populationSize.value);
  state.people = createPeople();
  state.relationships = {};
  state.motion = {};
  state.speech = {};
  state.recentTopics = {};
  state.nextConversationAt = performance.now() + 2500;
  state.selectedId = state.people[0]?.id ?? null;
  state.eventLog = [];
  state.conversations = [];
  addLog(`${state.people.length} humans moved into 10 houses.`);
  addLog(`The town opened 2 offices, 1 restaurant, and meals cost $${mealCost}.`);
  render();
}

function isWorkHour(person) {
  if (!person.job) return false;
  return state.hour >= person.job.starts && state.hour < person.job.ends;
}

function advanceHour() {
  state.hour += 1;
  if (state.hour >= 24) {
    state.hour = 0;
    state.day += 1;
    state.people = state.people.map((person) => ({
      ...person,
      ageDays: person.ageDays + 1,
      talkedToday: 0,
    }));
  }

  state.people = state.people.map(updatePerson);
  processInteractions();
  render();
}

function updatePerson(person) {
  if (!person.alive) return person;

  let next = { ...person };
  const ageYears = Math.floor(next.ageDays / 365);

  if (ageYears >= state.deathAge) {
    addLog(`${next.name} died of old age at ${ageYears}.`);
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
      addLog(`${next.name} died after being sick and deeply unhappy.`);
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
    if (!next.sick && next.depressedHours >= 8 && Math.random() < 0.28) {
      next.sick = true;
      next.sickHours = 1;
      addLog(`${next.name} became sick after staying depressed.`);
    }
  } else if (next.happiness >= 35) {
    next.depressedHours = Math.max(0, next.depressedHours - 2);
  }

  if (next.hunger >= 62) {
    if (next.money >= mealCost) {
      next.money -= mealCost;
      next.mealsMissed = 0;
      next.hunger = clamp(next.hunger - 42, 0, 100);
      next.energy = clamp(next.energy + 4, 0, 100);
      next.happiness = clamp(next.happiness + 6, 0, 100);
      if (next.sick && next.happiness >= 45 && Math.random() < 0.18) {
        next.sick = false;
        next.sickHours = 0;
        addLog(`${next.name} recovered after eating and feeling better.`);
      }
      next.locationId = "restaurant";
      next.status = "Eating";
      if (next.hunger <= 25) {
        addLog(`${next.name} bought food for $${mealCost}.`);
      }
      return next;
    }
    next.mealsMissed += 1;
    next.happiness = clamp(next.happiness - 10, 0, 100);
    if (next.hunger >= 96 && next.mealsMissed >= 4) {
      addLog(`${next.name} died from hunger after missing ${next.mealsMissed} meals.`);
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
      addLog(`${next.name} is hungry but only has $${Math.floor(next.money)}.`);
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

  if (isWorkHour(next)) {
    if (state.hour === 12 && next.energy >= 30 && Math.random() < 0.65) {
      next.locationId = next.money >= mealCost ? "restaurant" : "town-square";
      next.status = "Socializing";
      next.happiness = clamp(next.happiness + 3, 0, 100);
      return next;
    }
    next.locationId = next.job.building;
    next.status = "Working";
    next.money += next.job.wage;
    next.energy = clamp(next.energy - 2, 0, 100);
    next.happiness = clamp(next.happiness - (next.sick ? 4 : 1), 0, 100);
    return next;
  }

  if (next.job && next.money < lowMoneyLine && state.hour >= 6 && state.hour <= 21) {
    next.locationId = next.job.building;
    next.status = "Working overtime";
    next.money += Math.round(next.job.wage * 0.75);
    next.energy = clamp(next.energy - 7, 0, 100);
    next.happiness = clamp(next.happiness - 6, 0, 100);
    return next;
  }

  if (state.hour >= 18 && state.hour <= 21 && next.trait === "Social") {
    next.locationId = "restaurant";
    next.status = "Socializing";
    next.energy = clamp(next.energy - 1, 0, 100);
    next.happiness = clamp(next.happiness + 4, 0, 100);
    return next;
  }

  if (state.hour >= 17 && state.hour <= 21 && next.energy >= 35) {
    const closeFriend = getCloseFriend(next);
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
    } else if (freeTimeRoll < 0.7 && next.money >= mealCost * 2) {
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
    const partner = getPerson(next.partnerId);
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

function processInteractions() {
  const now = performance.now();
  if (now < state.nextConversationAt || visibleSpeechCount() >= 2) return;

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
    const talkChance = place.type === "home" ? 0.35 : place.type === "office" ? 0.4 : 0.7;
    if (Math.random() > talkChance) continue;

    const first = randomItem(group);
    const second = randomItem(group.filter((person) => person.id !== first.id));
    if (!second) return;

    const willArgue = shouldArgue(first, second, place);
    const relation = updateRelationship(first, second, place, willArgue);
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

function visibleSpeechCount() {
  const now = performance.now();
  return Object.values(state.speech).filter((speech) => speech.expiresAt > now).length;
}

function shouldArgue(personA, personB, place) {
  const relation = getRelationship(personA.id, personB.id);
  const stress =
    (personA.hunger > 70 || personB.hunger > 70 ? 0.16 : 0) +
    (personA.happiness < 35 || personB.happiness < 35 ? 0.14 : 0) +
    (personA.energy < 30 || personB.energy < 30 ? 0.1 : 0) +
    (relation.conflict > 35 ? 0.18 : 0) +
    (relation.enemy ? 0.25 : 0) +
    (place.type === "home" ? 0.06 : 0);
  return Math.random() < Math.min(0.55, 0.08 + stress);
}

function updateRelationship(personA, personB, place, argued = false) {
  const relation = getRelationship(personA.id, personB.id);
  const oldClose = relation.close;
  const oldCouple = relation.couple;
  const oldEnemy = relation.enemy;
  const sameHome = personA.homeId === personB.homeId;
  const sharedWork = personA.job?.building && personA.job.building === personB.job?.building;

  if (argued) {
    relation.friendship = clamp(relation.friendship - 16, 0, 100);
    relation.romance = clamp(relation.romance - (relation.couple ? 14 : 8), 0, 100);
    relation.conflict = clamp(relation.conflict + 24, 0, 100);
    relation.close = relation.friendship >= closeFriendThreshold && relation.conflict < 35;
    relation.enemy = relation.conflict >= enemyConflictThreshold && relation.friendship <= friendThreshold;

    if (!oldEnemy && relation.enemy) {
      addLog(`${personA.name} and ${personB.name} became enemies.`);
    }

    if (oldCouple && (relation.romance <= 18 || relation.conflict >= 65)) {
      relation.couple = false;
      state.people = state.people.map((person) => {
        if (person.id === personA.id || person.id === personB.id) {
          return { ...person, partnerId: null, happiness: clamp(person.happiness - 20, 0, 100) };
        }
        return person;
      });
      addLog(`${personA.name} and ${personB.name} broke up after arguing.`);
    }

    return relation;
  }

  const friendshipGain =
    8 +
    (place.type === "home" || sameHome ? 3 : 0) +
    (sharedWork ? 2 : 0) +
    (personA.trait === "Social" || personB.trait === "Social" ? 2 : 0);
  const romanceGain =
    relation.friendship >= friendThreshold && !personA.partnerId && !personB.partnerId
      ? 8 + (place.id === "restaurant" || place.id === "town-square" ? 6 : 0)
      : 0;

  relation.friendship = clamp(relation.friendship + friendshipGain, 0, 100);
  relation.romance = clamp(relation.romance + romanceGain, 0, 100);
  relation.conflict = clamp(relation.conflict - 8, 0, 100);
  relation.crush = relation.romance >= crushThreshold && !relation.couple;
  relation.close = relation.friendship >= closeFriendThreshold && relation.conflict < 35;
  relation.enemy = relation.conflict >= enemyConflictThreshold && relation.friendship <= friendThreshold;

  if (!oldClose && relation.close) {
    addLog(`${personA.name} and ${personB.name} became close friends.`);
  }

  if (relation.crush && relation.romance - romanceGain < crushThreshold) {
    addLog(`${personA.name} and ${personB.name} started feeling romantic.`);
  }

  if (
    !oldCouple &&
    !personA.partnerId &&
    !personB.partnerId &&
    relation.friendship >= coupleFriendThreshold &&
    relation.romance >= coupleRomanceThreshold &&
    Math.random() < 0.75
  ) {
    relation.couple = true;
    state.people = state.people.map((person) => {
      if (person.id === personA.id) return { ...person, partnerId: personB.id, happiness: clamp(person.happiness + 18, 0, 100) };
      if (person.id === personB.id) return { ...person, partnerId: personA.id, happiness: clamp(person.happiness + 18, 0, 100) };
      return person;
    });
    addLog(`${personA.name} and ${personB.name} fell in love and became a couple.`);
  }

  return relation;
}

function rememberTopic(personId, topic) {
  const recent = state.recentTopics[personId] ?? [];
  state.recentTopics[personId] = [topic, ...recent.filter((item) => item !== topic)].slice(0, 4);
}

function makeConversation(personA, personB, place, relation, argued = false) {
  const topic = argued ? "argument" : chooseConversationTopic(personA, personB, place, relation);
  const lines = conversationLinesForTopic(topic, personA, personB, place, relation);
  return { topic, lines };
}

function chooseConversationTopic(personA, personB, place, relation) {
  const topics = ["plans", "town", "skills"];
  if (place.type === "home") topics.push("home");
  if (place.type === "office" || personA.job?.building === personB.job?.building) topics.push("work");
  if (relation.enemy || relation.conflict >= 45) topics.push("argument");
  if (relation.friendship >= friendThreshold) topics.push("friendship");
  if (relation.romance >= crushThreshold || relation.couple) topics.push("romance", "romance", "romance");
  if (personA.money < lowMoneyLine || personB.money < lowMoneyLine) topics.push("money");
  if (personA.hunger > 55 || personB.hunger > 55) topics.push("food");
  if (personA.happiness < 35 || personB.happiness < 35) topics.push("mood");
  if (personA.sick || personB.sick) topics.push("health");

  const recentA = state.recentTopics[personA.id] ?? [];
  const recentB = state.recentTopics[personB.id] ?? [];
  const freshTopics = topics.filter(
    (topic) => !recentA.includes(topic) && !recentB.includes(topic),
  );
  return randomItem(freshTopics.length ? freshTopics : topics);
}

function conversationLinesForTopic(topic, a, b, place, relation) {
  const jobPlace = a.job ? getBuilding(a.job.building)?.name : "work";
  const starters = {
    money: [
      { speaker: a.name, text: `I only have $${Math.floor(a.money)} right now.` },
      { speaker: b.name, text: `Food is $${mealCost}, so that can disappear fast.` },
      { speaker: a.name, text: a.job ? `I might take extra hours at ${jobPlace}.` : "I need to find steady work soon." },
      { speaker: b.name, text: "Do that before you skip another meal." },
    ],
    food: [
      { speaker: a.name, text: `My hunger is at ${Math.round(a.hunger)}%.` },
      { speaker: b.name, text: "We should eat before it gets dangerous." },
      { speaker: a.name, text: `I can pay if I keep at least $${mealCost} ready.` },
      { speaker: b.name, text: "The restaurant is becoming the center of town." },
    ],
    mood: [
      { speaker: a.name, text: `My happiness is only ${Math.round(a.happiness)}%.` },
      { speaker: b.name, text: "Stay here with me for a bit. Talking helps." },
      { speaker: a.name, text: "I was starting to feel alone." },
      { speaker: b.name, text: "Then let us check in again later." },
    ],
    health: [
      { speaker: a.name, text: a.sick ? "I feel sick today." : `${b.name}, you look worn down.` },
      { speaker: b.name, text: b.sick ? "I need rest and less stress." : "I am trying to keep my energy up." },
      { speaker: a.name, text: "Low happiness seems to make people worse here." },
      { speaker: b.name, text: "Then we should not let anyone stay isolated." },
    ],
    work: [
      { speaker: a.name, text: `How was ${place.type === "office" ? place.name : "work"} today?` },
      { speaker: b.name, text: "Busy, but the wage helps." },
      { speaker: a.name, text: `I want to use my ${a.skill.toLowerCase()} skill better.` },
      { speaker: b.name, text: "Maybe that becomes a better job later." },
    ],
    home: [
      { speaker: a.name, text: "This house feels crowded with one bed." },
      { speaker: b.name, text: "At least rent is not in the simulation yet." },
      { speaker: a.name, text: "Sleep still matters. I cannot work exhausted." },
      { speaker: b.name, text: "We should keep a better routine." },
    ],
    skills: [
      { speaker: a.name, text: `I have been thinking about ${a.skill.toLowerCase()}.` },
      { speaker: b.name, text: `That fits your ${a.trait.toLowerCase()} side.` },
      { speaker: a.name, text: `What about your ${b.skill.toLowerCase()} skill?` },
      { speaker: b.name, text: "Maybe the town needs that more than I thought." },
    ],
    town: [
      { speaker: a.name, text: `${place.name} is getting busy.` },
      { speaker: b.name, text: "People move around more when they have money." },
      { speaker: a.name, text: "And when they are happy enough to leave home." },
      { speaker: b.name, text: "The town feels alive when people talk." },
    ],
    plans: [
      { speaker: a.name, text: "After this I might rest, then check my money." },
      { speaker: b.name, text: "I am watching hunger, happiness, and energy now." },
      { speaker: a.name, text: "It is a lot to balance." },
      { speaker: b.name, text: "That is why conversations matter." },
    ],
    friendship: [
      { speaker: a.name, text: `I think our friendship is getting stronger.` },
      { speaker: b.name, text: `Yeah, I feel closer to you than before.` },
      { speaker: a.name, text: `We should hang out again after work.` },
      { speaker: b.name, text: relation.close ? "Definitely. Close friends should check in." : "I would like that." },
    ],
    romance: [
      { speaker: a.name, text: relation.couple ? "I am glad we are together." : "I like spending time with you." },
      { speaker: b.name, text: relation.couple ? "Me too. I still choose you." : "I was hoping you felt that too." },
      { speaker: a.name, text: relation.couple ? "Let us go somewhere together later." : "Maybe this is more than friendship." },
      { speaker: b.name, text: relation.couple ? "A date at the restaurant sounds good." : "Let us keep seeing where it goes." },
    ],
    argument: [
      { speaker: a.name, text: "You never listen when I say I am stressed." },
      { speaker: b.name, text: "I am stressed too. That does not make this easier." },
      { speaker: a.name, text: relation.couple ? "If we keep doing this, we might not last." : "This is why I avoid you sometimes." },
      { speaker: b.name, text: relation.enemy ? "Maybe we should stay away from each other." : "Fine. We both need space." },
    ],
  };

  return starters[topic] ?? starters.plans;
}

function buildingOccupancy(buildingId) {
  return state.people.filter((person) => person.alive && person.locationId === buildingId)
    .length;
}

function renderMap() {
  const selected = state.selectedId;
  const targets = getPersonTargets();
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
        ? `${buildingOccupancy(building.id)}/${building.capacity} people, ${building.beds} bed`
        : `${buildingOccupancy(building.id)} people`;
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
    token.addEventListener("click", () => selectPerson(person.id));
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

function getPersonTargets() {
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

function animatePeople(frameAt = performance.now()) {
  const elapsed = state.lastFrameAt ? frameAt - state.lastFrameAt : 16;
  state.lastFrameAt = frameAt;

  if (state.running) {
    const targets = getPersonTargets();
    const moveFactor = 1 - Math.exp(-elapsed * 0.0016 * state.speed);

    state.people.forEach((person) => {
      const baseTarget = targets[person.id];
      const motion = state.motion[person.id];
      if (!baseTarget || !motion) return;

      const resting = person.status === "Sleeping" || !person.alive;
      if (!resting && frameAt >= motion.wanderAt) {
        const drift = 1.8;
        motion.targetX = clamp(baseTarget.x + (Math.random() - 0.5) * drift, 2, 98);
        motion.targetY = clamp(baseTarget.y + (Math.random() - 0.5) * drift, 2, 98);
        motion.wanderAt = frameAt + 900 / Math.max(state.speed, 0.5) + Math.random() * 900;
      } else if (resting) {
        motion.targetX = baseTarget.x;
        motion.targetY = baseTarget.y;
      }

      motion.x += (motion.targetX - motion.x) * moveFactor;
      motion.y += (motion.targetY - motion.y) * moveFactor;

      const token = els.townMap.querySelector(`[data-person-id="${person.id}"]`);
      if (token) {
        token.style.left = `${motion.x}%`;
        token.style.top = `${motion.y}%`;
      }
      const bubble = els.townMap.querySelector(`[data-speech-for="${person.id}"]`);
      if (bubble) {
        const speech = state.speech[person.id];
        if (!speech || speech.expiresAt <= frameAt) {
          delete state.speech[person.id];
          bubble.remove();
        } else {
          bubble.classList.toggle("below", motion.y < 22);
          bubble.classList.toggle("align-left", motion.x < 18);
          bubble.classList.toggle("align-right", motion.x > 82);
          bubble.style.left = `${motion.x}%`;
          bubble.style.top = `${motion.y}%`;
        }
      }
    });
  }

  state.animationFrame = window.requestAnimationFrame(animatePeople);
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

function relationshipSummary(person) {
  const entries = Object.entries(state.relationships)
    .map(([key, relation]) => {
      const [idA, idB] = key.split("|");
      const otherId = idA === person.id ? idB : idB === person.id ? idA : null;
      return otherId ? { person: getPerson(otherId), relation } : null;
    })
    .filter((entry) => entry?.person);

  const partner = person.partnerId ? getPerson(person.partnerId) : null;
  const bestFriend = entries
    .filter((entry) => !entry.relation.couple)
    .sort((a, b) => b.relation.friendship - a.relation.friendship)[0];

  return {
    partner,
    bestFriend,
    closeCount: entries.filter((entry) => entry.relation.close).length,
    friendCount: entries.length,
  };
}

function renderPeopleList() {
  els.peopleList.innerHTML = "";
  state.people.forEach((person) => {
    const summary = relationshipSummary(person);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `person-card ${person.id === state.selectedId ? "selected" : ""} ${
      person.alive ? "" : "dead"
    }`;
    card.innerHTML = `
      <strong>${person.name}</strong>
      <span>${person.status} · Age ${Math.floor(person.ageDays / 365)}</span>
      <div class="chips">
        <b class="chip">${person.trait}</b>
        <b class="chip">${person.gender}</b>
        <b class="chip">${person.skill}</b>
        <b class="chip">${person.job?.title ?? "No job"}</b>
        <b class="chip">$${Math.floor(person.money)}</b>
        <b class="chip">${Math.round(person.happiness)}% happy</b>
        ${summary.partner ? `<b class="chip love">With ${summary.partner.name}</b>` : ""}
        ${summary.closeCount ? `<b class="chip friend">${summary.closeCount} close</b>` : ""}
        ${person.sick ? '<b class="chip danger">Sick</b>' : ""}
      </div>
      <span>Hunger ${Math.round(person.hunger)} · Energy ${Math.round(person.energy)} · Missed meals ${person.mealsMissed}</span>
    `;
    card.addEventListener("click", () => selectPerson(person.id));
    els.peopleList.appendChild(card);
  });
}

function renderDetails() {
  const person = state.people.find((candidate) => candidate.id === state.selectedId);
  if (!person) {
    els.personDetails.className = "person-details empty";
    els.personDetails.textContent = "Select a person on the map or in the list.";
    return;
  }

  const home = getBuilding(person.homeId);
  const location = getBuilding(person.locationId);
  const summary = relationshipSummary(person);
  els.personDetails.className = "person-details";
  els.personDetails.innerHTML = `
    <div class="detail-name">${person.name}</div>
    <div class="detail-line"><span>Status</span><strong>${person.status}</strong></div>
    <div class="detail-line"><span>Age</span><strong>${Math.floor(person.ageDays / 365)}</strong></div>
    <div class="detail-line"><span>Home</span><strong>${home?.name ?? "None"}</strong></div>
    <div class="detail-line"><span>Current Place</span><strong>${location?.name ?? "Unknown"}</strong></div>
    <div class="detail-line"><span>Money</span><strong>$${Math.floor(person.money)}</strong></div>
    <div class="detail-line"><span>Gender</span><strong>${person.gender}</strong></div>
    <div class="detail-line"><span>Partner</span><strong>${summary.partner?.name ?? "None"}</strong></div>
    <div class="detail-line"><span>Best Friend</span><strong>${summary.bestFriend ? `${summary.bestFriend.person.name} (${summary.bestFriend.relation.friendship})` : "None"}</strong></div>
    <div class="detail-line"><span>Job</span><strong>${person.job?.title ?? "Unemployed"}</strong></div>
    <div class="detail-line"><span>Wage</span><strong>${person.job ? `$${person.job.wage}/hour` : "$0/hour"}</strong></div>
    <div class="detail-line"><span>Health</span><strong>${person.sick ? `Sick for ${person.sickHours} hours` : "Healthy"}</strong></div>
    <div class="detail-line"><span>Trait</span><strong>${person.trait}</strong></div>
    <div class="detail-line"><span>Skill</span><strong>${person.skill}</strong></div>
    <div class="detail-line"><span>Hunger</span><strong>${Math.round(person.hunger)}%</strong></div>
    <div class="meter hunger"><span style="width: ${person.hunger}%"></span></div>
    <div class="detail-line"><span>Energy</span><strong>${Math.round(person.energy)}%</strong></div>
    <div class="meter energy"><span style="width: ${person.energy}%"></span></div>
    <div class="detail-line"><span>Happiness</span><strong>${Math.round(person.happiness)}%</strong></div>
    <div class="meter happiness"><span style="width: ${person.happiness}%"></span></div>
    <div class="detail-line"><span>Depressed Hours</span><strong>${person.depressedHours}</strong></div>
    <button id="openFriendModal" class="wide-button" type="button">View Friends (${summary.friendCount})</button>
  `;

  document
    .querySelector("#openFriendModal")
    ?.addEventListener("click", () => openFriendModal(person.id));
}

function getRelationshipEntries(person) {
  return Object.entries(state.relationships)
    .map(([key, relation]) => {
      const [idA, idB] = key.split("|");
      const otherId = idA === person.id ? idB : idB === person.id ? idA : null;
      const other = otherId ? getPerson(otherId) : null;
      return other
        ? {
            other,
            relation,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.relation.friendship - a.relation.friendship);
}

function buildRelationshipLines(person, modal = false) {
  const entries = getRelationshipEntries(person);

  if (entries.length === 0) {
    return '<p class="relation-empty">No friends yet. They need to talk to people first.</p>';
  }

  return entries
    .map(({ other, relation }) => buildRelationshipRow(other, relation, modal))
    .join("");
}

function buildRelationshipRow(other, relation, modal) {
  const tags = [
    relation.enemy ? "Enemy" : null,
    relation.couple ? "Couple" : null,
    relation.crush && !relation.couple ? "Crush" : null,
    relation.close ? "Close friend" : null,
    relation.friendship >= friendThreshold && !relation.close && !relation.enemy ? "Friend" : null,
    relation.friendship < friendThreshold && !relation.enemy ? "Acquaintance" : null,
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

function openFriendModal(personId) {
  const person = getPerson(personId);
  if (!person) return;
  els.friendModalTitle.textContent = `${person.name}'s Friend List`;
  els.friendModalBody.innerHTML = `
    <div class="modal-summary">
      <span>${person.gender}</span>
      <span>${person.partnerId ? `Partner: ${getPerson(person.partnerId)?.name ?? "Unknown"}` : "No partner"}</span>
    </div>
    <div class="friend-list modal-list">
      ${buildRelationshipLines(person, true)}
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

function renderLog() {
  els.eventLog.innerHTML = "";
  state.eventLog.forEach((event) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${event.stamp}</strong> ${event.message}`;
    els.eventLog.appendChild(item);
  });
}

function renderConversations() {
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

function renderStats() {
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
  els.moneyStat.textContent = `$${averageMoney}`;
  els.happinessStat.textContent = `${averageHappiness}%`;
  els.couplesStat.textContent = couples;
}

function render() {
  renderStats();
  renderMap();
  renderPeopleList();
  renderDetails();
  renderConversations();
  renderLog();
}

function selectPerson(id) {
  state.selectedId = id;
  render();
}

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

els.toggleRun.addEventListener("click", () => {
  state.running = !state.running;
  els.toggleRun.textContent = state.running ? "Pause" : "Resume";
});

els.stepHour.addEventListener("click", advanceHour);

els.restart.addEventListener("click", resetSimulation);

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

resetSimulation();
scheduleTick();
scheduleSocialTick();
animatePeople();
