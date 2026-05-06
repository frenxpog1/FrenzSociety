// Global state management
export const state = {
  running: true,
  speed: 1,
  resumeDelay: 0, // Seconds to wait before auto-resuming after modal
  modalUserClicked: false, // Track if user clicked Continue on current modal
  townTreasury: 0,
  casinoBankroll: 5000,
  hour: 6,
  day: 1,
  people: [],
  buildings: [],
  relationships: {},
  motion: {},
  speech: {},
  recentTopics: {},
  selectedId: null,
  eventLog: [],
  conversations: [],
  deathAge: 82,
  populationSize: 15,
  tickTimer: null,
  socialTimer: null,
  nextConversationAt: 0,
  animationFrame: null,
  lastFrameAt: 0,
  modalQueue: [], // Queue for multiple modals
  serialKillerEverSpawned: false, // Track if serial killer has spawned at least once
};

// DOM element references - initialized after DOM loads
export let els = {};

export function initializeElements() {
  els = {
    dayLabel: document.querySelector("#dayLabel"),
    timeLabel: document.querySelector("#timeLabel"),
    toggleRun: document.querySelector("#toggleRun"),
    stepHour: document.querySelector("#stepHour"),
    stepDay: document.querySelector("#stepDay"),
    restart: document.querySelector("#restart"),
    speedSelect: document.querySelector("#speedSelect"),
    resumeDelaySelect: document.querySelector("#resumeDelaySelect"),
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
    kidsStat: document.querySelector("#kidsStat"),
    graveyardStat: document.querySelector("#graveyardStat"),
    treasuryStat: document.querySelector("#treasuryStat"),
    casinoStat: document.querySelector("#casinoStat"),
    jailStat: document.querySelector("#jailStat"),
    townMap: document.querySelector("#townMap"),
    peopleList: document.querySelector("#peopleList"),
    personDetails: document.querySelector("#personDetails"),
    conversationList: document.querySelector("#conversationList"),
    eventLog: document.querySelector("#eventLog"),
    friendModal: document.querySelector("#friendModal"),
    friendModalTitle: document.querySelector("#friendModalTitle"),
    friendModalBody: document.querySelector("#friendModalBody"),
    closeFriendModal: document.querySelector("#closeFriendModal"),
    eventModal: document.querySelector("#eventModal"),
    eventModalTitle: document.querySelector("#eventModalTitle"),
    eventModalBody: document.querySelector("#eventModalBody"),
    closeEventModal: document.querySelector("#closeEventModal"),
    addSchoolBtn: document.querySelector("#addSchoolBtn"),
    addChurchBtn: document.querySelector("#addChurchBtn"),
    addPersonBtn: document.querySelector("#addPersonBtn"),
  };
  return els;
}
