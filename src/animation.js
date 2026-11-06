import { advanceCrimes } from './crime.js';
import { advanceActivities } from "./activities.js";
import { personTargets } from "./spaces.js";
import { advanceMovement } from "./movement.js";
import { buildings } from "./constants.js";
import { drawWorld } from "./world.js";
export function animatePeople(state, els, frameAt = performance.now(), onCrimeEvent = () => {}) {
  const elapsed = state.lastFrameAt
    ? Math.max(0, Math.min(frameAt - state.lastFrameAt, 100))
    : 16;
  state.lastFrameAt = frameAt;
  if (state.running) {
    const seconds = (elapsed / 1000) * Math.sqrt(state.speed);
    state.activitySeconds = (state.activitySeconds || 0) + seconds;
    const arrived = advanceMovement(
      state,
      personTargets(state, buildings),
      elapsed,
    );
    advanceActivities(state, seconds, arrived);
    for (const event of advanceCrimes(state, seconds, buildings)) onCrimeEvent(event);
  }
  drawWorld(frameAt);
  state.animationFrame = window.requestAnimationFrame((time) =>
    animatePeople(state, els, time, onCrimeEvent),
  );
}
