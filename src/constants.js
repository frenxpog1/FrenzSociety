// Game constants and configuration
export const names = [
  "Ari", "Bea", "Cleo", "Dani", "Eli", "Faye", "Gio", "Hana",
  "Ivan", "Jia", "Kai", "Lina", "Mika", "Nico", "Ola",
];

export const traits = [
  "Early Bird", "Night Owl", "Social", "Focused",
  "Calm", "Messy", "Ambitious", "Careful",
];

export const skills = [
  "Cooking", "Accounting", "Sales", "Cleaning",
  "Repair", "Coding", "Service", "Planning",
];

export const genders = ["Female", "Male"];

export const jobs = [
  { name: "Office Clerk", building: "office-1", starts: 9, ends: 17, wage: 16 },
  { name: "Analyst", building: "office-2", starts: 8, ends: 16, wage: 22 },
  { name: "Server", building: "restaurant", starts: 10, ends: 18, wage: 14 },
  { name: "Cook", building: "restaurant", starts: 11, ends: 19, wage: 18 },
];

export const gameConfig = {
  mealCost: 12,
  lowMoneyLine: 25,
  friendThreshold: 20,
  closeFriendThreshold: 35,
  crushThreshold: 15,              // Lowered from 25
  coupleFriendThreshold: 25,       // Lowered from 35
  coupleRomanceThreshold: 30,      // Lowered from 45
  enemyConflictThreshold: 45,
  childAdultAge: 18,               // Age when children become adults
  pregnancyChance: 0.10,           // 10% chance per day for couples
};

export const buildings = [
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `house-${index + 1}`,
    type: "home",
    name: `House ${index + 1}`,
    beds: 1,
    capacity: 2,
    x: [9, 23, 37, 63, 77, 91, 8, 24, 76, 92][index],
    y: [12, 12, 12, 12, 12, 12, 82, 82, 82, 82][index],
  })),
  { id: "office-1", type: "office", name: "Office A", jobs: 4, x: 22, y: 50 },
  { id: "office-2", type: "office", name: "Office B", jobs: 4, x: 78, y: 50 },
  { id: "restaurant", type: "restaurant", name: "Restaurant", jobs: 4, x: 50, y: 72 },
  { id: "town-square", type: "square", name: "Town Square", x: 50, y: 29 },
  { id: "school-1", type: "school", name: "Town School", x: 50, y: 12 },
  { id: "church-1", type: "church", name: "Town Church", x: 50, y: 90 },
  { id: "cinema-1", type: "cinema", name: "Cinema", x: 16, y: 30 },
  { id: "mall-1", type: "mall", name: "Town Mall", x: 84, y: 30 },
  { id: "casino-1", type: "casino", name: "Casino", x: 16, y: 65 },
  { id: "graveyard-1", type: "graveyard", name: "Town Graveyard", x: 84, y: 65 },
];
