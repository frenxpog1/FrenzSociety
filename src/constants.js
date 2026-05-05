// Game constants and configuration
export const names = [
  // Original names
  "Ari", "Bea", "Cleo", "Dani", "Eli", "Faye", "Gio", "Hana",
  "Ivan", "Jia", "Kai", "Lina", "Mika", "Nico", "Ola",
  "Pia", "Quin", "Ray", "Sia", "Toby", "Uma", "Vera", "Wes", "Xen", "Yuri", "Zoe",
  // Additional female names
  "Ada", "Bella", "Clara", "Diana", "Emma", "Flora", "Grace", "Holly",
  "Iris", "Jade", "Kate", "Luna", "Maya", "Nina", "Olive", "Pearl",
  "Quinn", "Rosa", "Sara", "Tara", "Violet", "Willow", "Zara",
  "Alice", "Beth", "Cara", "Dawn", "Elle", "Faith", "Gwen", "Hope",
  "Ivy", "June", "Kira", "Leah", "Mia", "Nora", "Opal", "Piper",
  "Ruby", "Sage", "Tess", "Unity", "Vale", "Wren", "Yvonne",
  // Additional male names
  "Adam", "Ben", "Cole", "Dean", "Evan", "Finn", "Grant", "Hugo",
  "Ian", "Jack", "Kyle", "Leo", "Max", "Noah", "Owen", "Paul",
  "Reed", "Sam", "Troy", "Vince", "Wade", "Zack",
  "Alex", "Blake", "Chase", "Drake", "Eric", "Felix", "Gabe", "Henry",
  "Isaac", "Jake", "Kent", "Luke", "Mark", "Nash", "Oscar", "Pete",
  "Ross", "Seth", "Todd", "Victor", "Will", "Xavier", "York", "Zane"
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
  { name: "Cook I", building: "restaurant", starts: 11, ends: 19, wage: 25, nextPromotion: "Cook II", daysToPromote: 7 },
  { name: "Cook II", building: "restaurant", starts: 11, ends: 19, wage: 40, nextPromotion: "Cook III", daysToPromote: 14 },
  { name: "Cook III", building: "restaurant", starts: 11, ends: 19, wage: 60, nextPromotion: null, daysToPromote: null },
  { name: "Server I", building: "restaurant", starts: 10, ends: 18, wage: 20, nextPromotion: "Server II", daysToPromote: 7 },
  { name: "Server II", building: "restaurant", starts: 10, ends: 18, wage: 30, nextPromotion: "Server III", daysToPromote: 14 },
  { name: "Server III", building: "restaurant", starts: 10, ends: 18, wage: 45, nextPromotion: null, daysToPromote: null },
  { name: "Office Clerk I", building: "office-1", starts: 9, ends: 17, wage: 22, nextPromotion: "Office Clerk II", daysToPromote: 7 },
  { name: "Office Clerk II", building: "office-1", starts: 9, ends: 17, wage: 35, nextPromotion: "Office Clerk III", daysToPromote: 14 },
  { name: "Office Clerk III", building: "office-1", starts: 9, ends: 17, wage: 50, nextPromotion: null, daysToPromote: null },
  { name: "Analyst I", building: "office-2", starts: 8, ends: 16, wage: 30, nextPromotion: "Analyst II", daysToPromote: 7 },
  { name: "Analyst II", building: "office-2", starts: 8, ends: 16, wage: 45, nextPromotion: "Analyst III", daysToPromote: 14 },
  { name: "Analyst III", building: "office-2", starts: 8, ends: 16, wage: 65, nextPromotion: null, daysToPromote: null },
  { name: "Police Officer (Day)", building: "police-1", starts: 6, ends: 18, wage: 35, nextPromotion: "Police Chief", daysToPromote: 14 },
  { name: "Police Officer (Night)", building: "police-1", starts: 18, ends: 6, wage: 40, nextPromotion: "Police Chief", daysToPromote: 14 },
  { name: "Police Chief", building: "police-1", starts: 8, ends: 16, wage: 65, nextPromotion: null, daysToPromote: null },
];

export const entryLevelJobs = [
  "Office Clerk I",
  "Analyst I", 
  "Server I",
  "Cook I",
  "Police Officer (Day)"
];

export const gameConfig = {
  mealCost: 12,
  hospitalCost: 30,
  lowMoneyLine: 25,
  friendThreshold: 20,
  closeFriendThreshold: 35,
  crushThreshold: 15,              // Lowered from 25
  coupleFriendThreshold: 25,       // Lowered from 35
  coupleRomanceThreshold: 30,      // Lowered from 45
  enemyConflictThreshold: 45,
  childAdultAge: 18,               // Age when children become adults
  pregnancyChance: 0.45,           // 45% chance per day for couples (increased to encourage more kids)
  casinoStartingBalance: 5000,     // Casino starts with $5000
  casinoBrokeThreshold: 100,       // Casino closes if balance < $100
  robberyChance: 0.05,             // 5% chance per hour for desperate people
  robberyMinSteal: 50,             // Minimum amount stolen
  robberyMaxSteal: 150,            // Maximum amount stolen
  copCatchChance: 0.7,             // 70% chance cop catches robber
  victimReportChance: 0.3,         // 30% chance victim reports if no cop
  jailTimeHours: 24,               // Hours spent in jail
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
  { id: "police-1", type: "police", name: "Police Station", x: 16, y: 30 },
  { id: "jail-1", type: "jail", name: "Town Jail", x: 30, y: 30 },
  { id: "hospital-1", type: "hospital", name: "Town Hospital", x: 84, y: 30 },
  { id: "casino-1", type: "casino", name: "Casino", x: 16, y: 65 },
  { id: "graveyard-1", type: "graveyard", name: "Town Graveyard", x: 84, y: 65 },
];
