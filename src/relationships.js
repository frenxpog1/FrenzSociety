// Relationship management
import { relationshipKey } from './utils.js';
import { gameConfig } from './constants.js';
import { getPerson } from './people.js';

export function getRelationship(relationships, idA, idB) {
  const key = relationshipKey(idA, idB);
  if (!relationships[key]) {
    relationships[key] = {
      friendship: 0,
      romance: 0,
      conflict: 0,
      crush: false,
      close: false,
      enemy: false,
      couple: false,
    };
  }
  return relationships[key];
}

export function getCloseFriend(people, relationships, person) {
  const closeRelations = Object.entries(relationships)
    .filter(([, relation]) => relation.close || relation.couple)
    .map(([key, relation]) => {
      const [idA, idB] = key.split("|");
      const friendId = idA === person.id ? idB : idB === person.id ? idA : null;
      return friendId ? { friend: getPerson(people, friendId), relation } : null;
    })
    .filter((entry) => entry?.friend?.alive);

  if (person.partnerId) {
    const partner = getPerson(people, person.partnerId);
    if (partner?.alive) return partner;
  }

  if (closeRelations.length === 0) return null;
  closeRelations.sort((a, b) => b.relation.friendship - a.relation.friendship);
  return closeRelations[0].friend;
}

export function relationshipSummary(people, relationships, person) {
  const entries = Object.entries(relationships)
    .map(([key, relation]) => {
      const [idA, idB] = key.split("|");
      const otherId = idA === person.id ? idB : idB === person.id ? idA : null;
      return otherId ? { person: getPerson(people, otherId), relation } : null;
    })
    .filter((entry) => entry?.person);

  const partner = person.partnerId ? getPerson(people, person.partnerId) : null;
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

export function getRelationshipEntries(people, relationships, person) {
  return Object.entries(relationships)
    .map(([key, relation]) => {
      const [idA, idB] = key.split("|");
      const otherId = idA === person.id ? idB : idB === person.id ? idA : null;
      const other = otherId ? getPerson(people, otherId) : null;
      return other ? { other, relation } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.relation.friendship - a.relation.friendship);
}
