// Social interactions and conversations
import { buildings, gameConfig } from './constants.js';
import { randomItem, clamp } from './utils.js';
import { getPerson } from './people.js';
import { getRelationship } from './relationships.js';

export function getBuilding(id) {
  return buildings.find((building) => building.id === id);
}

export function shouldArgue(personA, personB, place, relationships) {
  const relation = getRelationship(relationships, personA.id, personB.id);
  const stress =
    (personA.hunger > 70 || personB.hunger > 70 ? 0.16 : 0) +
    (personA.happiness < 35 || personB.happiness < 35 ? 0.14 : 0) +
    (personA.energy < 30 || personB.energy < 30 ? 0.1 : 0) +
    (relation.conflict > 35 ? 0.18 : 0) +
    (relation.enemy ? 0.25 : 0) +
    (place.type === "home" ? 0.06 : 0);
  return Math.random() < Math.min(0.55, 0.08 + stress);
}

export function updateRelationship(personA, personB, place, argued, relationships, people, addLogFn) {
  const relation = getRelationship(relationships, personA.id, personB.id);
  const oldClose = relation.close;
  const oldCouple = relation.couple;
  const oldEnemy = relation.enemy;
  const sameHome = personA.homeId === personB.homeId;
  const sharedWork = personA.job?.building && personA.job.building === personB.job?.building;

  if (argued) {
    relation.friendship = clamp(relation.friendship - 16, 0, 100);
    relation.romance = clamp(relation.romance - (relation.couple ? 14 : 8), 0, 100);
    relation.conflict = clamp(relation.conflict + 24, 0, 100);
    relation.close = relation.friendship >= gameConfig.closeFriendThreshold && relation.conflict < 35;
    relation.enemy = relation.conflict >= gameConfig.enemyConflictThreshold && relation.friendship <= gameConfig.friendThreshold;

    if (!oldEnemy && relation.enemy) {
      addLogFn(`${personA.name} and ${personB.name} became enemies.`);
    }

    if (oldCouple && (relation.romance <= 18 || relation.conflict >= 65)) {
      relation.couple = false;
      const updatedPeople = people.map((person) => {
        if (person.id === personA.id || person.id === personB.id) {
          return { ...person, partnerId: null, happiness: clamp(person.happiness - 20, 0, 100) };
        }
        return person;
      });
      addLogFn(`${personA.name} and ${personB.name} broke up after arguing.`);
      return { relation, updatedPeople };
    }

    return { relation, updatedPeople: people };
  }

  const friendshipGain =
    8 +
    (place.type === "home" || sameHome ? 3 : 0) +
    (sharedWork ? 2 : 0) +
    (personA.trait === "Social" || personB.trait === "Social" ? 2 : 0);
  
  // Check if genders are compatible for romance (opposite genders only)
  const gendersCompatible = personA.gender !== personB.gender;
  
  const romanceGain =
    relation.friendship >= gameConfig.friendThreshold && 
    !personA.partnerId && 
    !personB.partnerId &&
    gendersCompatible
      ? 8 + (place.id === "restaurant" || place.id === "town-square" ? 6 : 0)
      : 0;

  relation.friendship = clamp(relation.friendship + friendshipGain, 0, 100);
  relation.romance = clamp(relation.romance + romanceGain, 0, 100);
  relation.conflict = clamp(relation.conflict - 8, 0, 100);
  relation.crush = relation.romance >= gameConfig.crushThreshold && !relation.couple;
  relation.close = relation.friendship >= gameConfig.closeFriendThreshold && relation.conflict < 35;
  relation.enemy = relation.conflict >= gameConfig.enemyConflictThreshold && relation.friendship <= gameConfig.friendThreshold;

  if (!oldClose && relation.close) {
    addLogFn(`${personA.name} and ${personB.name} became close friends.`);
  }

  if (relation.crush && relation.romance - romanceGain < gameConfig.crushThreshold) {
    addLogFn(`${personA.name} and ${personB.name} started feeling romantic.`);
  }

  // Prevent siblings from marrying
  const isIncest = (personA.parentAId && personB.parentAId && 
    (personA.parentAId === personB.parentAId || personA.parentBId === personB.parentAId ||
     personA.parentAId === personB.parentBId || personA.parentBId === personB.parentBId));

  if (
    !oldCouple &&
    !personA.partnerId &&
    !personB.partnerId &&
    !personA.isChild &&
    !personB.isChild &&
    !isIncest &&
    gendersCompatible &&
    relation.friendship >= gameConfig.coupleFriendThreshold &&
    relation.romance >= gameConfig.coupleRomanceThreshold &&
    personA.money >= 30 && personB.money >= 30 && // Lowered from 50 to 30 - easier to marry!
    Math.random() < 0.85 // Increased from 0.75 - more likely to marry
  ) {
    relation.couple = true;
    
    // Find the church
    const church = buildings.find(b => b.type === "church");
    
    // Identify all mutual or individual friends to invite
    const friendIds = people
      .filter(p => {
        if (!p.alive || p.id === personA.id || p.id === personB.id) return false;
        const relA = relationships[`${personA.id}|${p.id}`] || relationships[`${p.id}|${personA.id}`];
        const relB = relationships[`${personB.id}|${p.id}`] || relationships[`${p.id}|${personB.id}`];
        return (relA && relA.friendship >= gameConfig.friendThreshold) || 
               (relB && relB.friendship >= gameConfig.friendThreshold);
      })
      .map(f => f.id);

    const updatedPeople = people.map((person) => {
      if (person.id === personA.id) {
        return { ...person, partnerId: personB.id, money: person.money - 100, happiness: 100, locationId: church ? church.id : person.locationId, status: "Getting Married" };
      }
      if (person.id === personB.id) {
        return { ...person, partnerId: personA.id, money: person.money - 100, homeId: personA.homeId, happiness: 100, locationId: church ? church.id : person.locationId, status: "Getting Married" };
      }
      if (friendIds.includes(person.id) && church) {
        return { ...person, locationId: church.id, status: "Attending Wedding", happiness: clamp(person.happiness + 15, 0, 100) };
      }
      return person;
    });
    const event = { title: "Wedding Bells!", message: `💍 ${personA.name} and ${personB.name} got married! Their friends gathered at the Church to celebrate.` };
    addLogFn(event.message);
    return { relation, updatedPeople, event };
  }

  return { relation, updatedPeople: people };
}

export function chooseConversationTopic(personA, personB, place, relation, recentTopics) {
  const topics = ["plans", "town", "skills"];
  if (place.type === "home") topics.push("home");
  if (place.type === "office" || personA.job?.building === personB.job?.building) topics.push("work");
  if (relation.enemy || relation.conflict >= 45) topics.push("argument");
  if (relation.friendship >= gameConfig.friendThreshold) topics.push("friendship");
  if (relation.romance >= gameConfig.crushThreshold || relation.couple) topics.push("romance", "romance", "romance");
  if (personA.money < gameConfig.lowMoneyLine || personB.money < gameConfig.lowMoneyLine) topics.push("money");
  if (personA.hunger > 55 || personB.hunger > 55) topics.push("food");
  if (personA.happiness < 35 || personB.happiness < 35) topics.push("mood");
  if (personA.sick || personB.sick) topics.push("health");
  if (place.type === "cinema" || place.type === "mall" || place.type === "casino") topics.push("entertainment");
  if (place.type === "graveyard" || personA.happiness < 25 || personB.happiness < 25) topics.push("grief");
  if (personA.money < 80 || personB.money < 80) topics.push("economy");
  if (place.type === "church" || place.type === "square") topics.push("community");
  if (personA.money <= 20 || personB.money <= 20 || personA.status === "In Jail" || personB.status === "In Jail") topics.push("robbery", "robbery");

  const recentA = recentTopics[personA.id] ?? [];
  const recentB = recentTopics[personB.id] ?? [];
  const freshTopics = topics.filter(
    (topic) => !recentA.includes(topic) && !recentB.includes(topic),
  );
  return randomItem(freshTopics.length ? freshTopics : topics);
}

export function conversationLinesForTopic(topic, a, b, place, relation) {
  const jobPlace = a.job ? getBuilding(a.job.building)?.name : "work";
  const starters = {
    money: [
      { speaker: a.name, text: `I only have ${Math.floor(a.money)} right now.` },
      { speaker: b.name, text: `Food is ${gameConfig.mealCost}, so that can disappear fast.` },
      { speaker: a.name, text: a.job ? `I might take extra hours at ${jobPlace}.` : "I need to find steady work soon." },
      { speaker: b.name, text: "Do that before you skip another meal." },
    ],
    food: [
      { speaker: a.name, text: `My hunger is at ${Math.round(a.hunger)}%.` },
      { speaker: b.name, text: "We should eat before it gets dangerous." },
      { speaker: a.name, text: `I can pay if I keep at least ${gameConfig.mealCost} ready.` },
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
    entertainment: [
      { speaker: a.name, text: place.type === "casino" ? "I hope I do not lose all my money here." : place.type === "cinema" ? "I heard this movie is really good." : "I love shopping around here." },
      { speaker: b.name, text: "It is good to take a break from work sometimes." },
      { speaker: a.name, text: "Yeah, the town feels so much more lively now." },
      { speaker: b.name, text: "Just make sure you have enough left for rent and taxes!" },
    ],
    economy: [
      { speaker: a.name, text: "The rent and taxes are really eating into my savings." },
      { speaker: b.name, text: "Tell me about it. The town treasury must be full." },
      { speaker: a.name, text: "I might need to ask for a raise or work more hours." },
      { speaker: b.name, text: "Or maybe win it big at the Casino... just kidding." },
    ],
    grief: [
      { speaker: a.name, text: "It is always hard to lose someone in town." },
      { speaker: b.name, text: "Life feels so fragile lately." },
      { speaker: a.name, text: "We should cherish the time we have." },
      { speaker: b.name, text: "I will always be here for you." },
    ],
    community: [
      { speaker: a.name, text: "It is nice to see everyone gathered together." },
      { speaker: b.name, text: "Yes, the town feels like a real community now." },
      { speaker: a.name, text: "So much has happened recently." },
      { speaker: b.name, text: "We just have to keep moving forward together." },
    ],
    robbery: [
      { speaker: a.name, text: "I heard some people are getting desperate enough to steal." },
      { speaker: b.name, text: "With the police patrols, it is a huge risk." },
      { speaker: a.name, text: "But when you have nothing left, jail starts to look like free food." },
      { speaker: b.name, text: "I just hope nobody gets killed over it." },
    ],
  };

  return starters[topic] ?? starters.plans;
}
