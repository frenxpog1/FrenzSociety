import { encounterFor } from './crime.js';

// Buildings own the vacancies. Job templates supply the pay and shift.
export function recruitForOffices(state, buildings, jobs) {
  const seekers = state.people.filter(person =>
    person.alive && !person.isChild && !person.job &&
    !person.jailHoursRemaining && !encounterFor(state, person.id)
  );
  const hired = [];
  for (const building of buildings.filter(item => item.type === 'office')) {
    const template = jobs.filter(job => job.building === building.id && Number.isFinite(job.wage))
      .sort((a, b) => a.wage - b.wage)[0];
    if (!template) continue;
    const assigned = state.people.filter(person =>
      person.alive && person.job?.building === building.id
    ).length;
    const vacancies = Math.max(0, Math.floor(building.jobs || 0) - assigned);
    for (let i = 0; i < vacancies && seekers.length; i++) {
      const person = seekers.shift();
      person.job = { ...template, title: template.name };
      person.daysWorked = 0;
      hired.push({ person, building });
    }
  }
  return hired;
}
