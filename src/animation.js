// Character movement and animations
import { clamp } from './utils.js';
import { getPersonTargets } from './render.js';

export function animatePeople(state, els, frameAt = performance.now()) {
  const elapsed = state.lastFrameAt ? frameAt - state.lastFrameAt : 16;
  state.lastFrameAt = frameAt;

  if (state.running) {
    const targets = getPersonTargets(state, els);
    const moveFactor = 1 - Math.exp(-elapsed * 0.0016 * state.speed);

    state.people.forEach((person) => {
      const baseTarget = targets[person.id];
      const motion = state.motion[person.id];
      if (!baseTarget || !motion) return;

      const resting = person.status === "Sleeping" || !person.alive;
      if (!resting && frameAt >= motion.wanderAt) {
        const drift = 1.8;
        motion.targetX = clamp(baseTarget.x + (Math.random() - 0.5) * drift, 2, 98);
        motion.targetY = clamp(baseTarget.y + (Math.random() - 0.5) * drift, 2, 98);
        motion.wanderAt = frameAt + 900 / Math.max(state.speed, 0.5) + Math.random() * 900;
      } else if (resting) {
        motion.targetX = baseTarget.x;
        motion.targetY = baseTarget.y;
      }

      motion.x += (motion.targetX - motion.x) * moveFactor;
      motion.y += (motion.targetY - motion.y) * moveFactor;

      const token = els.townMap.querySelector(`[data-person-id="${person.id}"]`);
      if (token) {
        token.style.left = `${motion.x}%`;
        token.style.top = `${motion.y}%`;
      }
      const bubble = els.townMap.querySelector(`[data-speech-for="${person.id}"]`);
      if (bubble) {
        const speech = state.speech[person.id];
        if (!speech || speech.expiresAt <= frameAt) {
          delete state.speech[person.id];
          bubble.remove();
        } else {
          bubble.classList.toggle("below", motion.y < 22);
          bubble.classList.toggle("align-left", motion.x < 18);
          bubble.classList.toggle("align-right", motion.x > 82);
          bubble.style.left = `${motion.x}%`;
          bubble.style.top = `${motion.y}%`;
        }
      }
    });
  }

  state.animationFrame = window.requestAnimationFrame((frameAt) => animatePeople(state, els, frameAt));
}
