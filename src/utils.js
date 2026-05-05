// Utility functions
export function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function relationshipKey(idA, idB) {
  return [idA, idB].sort().join("|");
}
