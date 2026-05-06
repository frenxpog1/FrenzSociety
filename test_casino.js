import { state } from './src/state.js';
import { createPeople } from './src/people.js';
import { updatePerson } from './src/simulation.js';

state.people = createPeople(20);

// Set someone up to gamble
let p = state.people[0];
p.money = 200;
p.gamblingAddiction = 20; // high addiction
p.happiness = 10;
p.job = null;
state.hour = 19;
p.trait = "Introvert";
p.energy = 50;
p.partnerId = null;
p.sick = false;

// Simulate 100 iterations
for (let i=0; i<100; i++) {
  let updated = updatePerson(p, state, () => {});
  if (updated.status.includes("Won BIG at Casino!")) {
    console.log("ITERATION " + i);
    console.log("Status after update:", updated.status);
    console.log("casinoLoss:", updated.casinoLoss);
    console.log("casinoWin:", updated.casinoWin);

    if (updated.casinoLoss) {
      state.casinoBankroll += updated.casinoLoss;
      delete updated.casinoLoss;
    }
    if (updated.casinoWin) {
      state.casinoBankroll -= updated.casinoWin;
      delete updated.casinoWin;
    }

    console.log("After: Bankroll = " + state.casinoBankroll);
    break;
  }
}
