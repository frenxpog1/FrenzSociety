// Apply transient financial effects once, after each resident's hourly decision.
export function settleFinances(person, state) {
  state.casinoBankroll += person.casinoContribution || 0;
  const requested = person.casinoPayout || 0;
  const paid = Math.min(requested, Math.max(0, state.casinoBankroll));
  state.casinoBankroll -= paid;
  // updatePerson credits the net payout; reconcile defensively if funds changed.
  if (paid < requested) {
    const originalTax = Math.floor(requested * 0.2);
    const actualTax = Math.floor(paid * 0.2);
    person.money -= requested - originalTax - (paid - actualTax);
    person.treasuryContribution =
      (person.treasuryContribution || 0) - originalTax + actualTax;
  }
  state.townTreasury += person.treasuryContribution || 0;
  delete person.casinoContribution;
  delete person.casinoPayout;
  delete person.treasuryContribution;
  return person;
}

export function distributeTreasury(state) {
  const recipients = state.people.filter((p) => p.alive && !p.isChild);
  if (!recipients.length) return 0;
  const budget = Math.floor(state.townTreasury * 0.9);
  const richest = Math.max(...recipients.map((p) => p.money), 1);
  const totalNeed = recipients.reduce((n, p) => n + richest - p.money + 10, 0);
  let distributed = 0;
  for (const person of recipients) {
    const share = Math.floor(
      ((richest - person.money + 10) / totalNeed) * budget,
    );
    person.money += share;
    distributed += share;
  }
  state.townTreasury -= distributed;
  return distributed;
}
