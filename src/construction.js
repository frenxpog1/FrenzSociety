import { findBuildablePosition, placementIssue, toPercent, toPixels } from './layout.js';

export const buildCatalog = {
  home: { label: 'Home', description: 'A furnished home for two residents.' },
  office: { label: 'Office', description: 'Six desks, computers, and space to work.' },
  school: { label: 'School', description: 'A classroom with six student desks.' },
  church: { label: 'Church', description: 'A place for the community to gather.' },
};
export const placementMessages = {
  edge: 'Keep the whole building inside the town boundary.',
  street: 'Leave the road and sidewalk clear.',
  building: 'Leave more space between buildings.',
  limit: 'This town has reached its 100-building limit.',
};

// A preview is never part of the live building collection or a saved town.
export function previewPlacement(type, pixels, existing) {
  if (!Object.hasOwn(buildCatalog, type)) return null;
  const candidate = { type, ...toPercent(Math.round(pixels.x / 10) * 10, Math.round(pixels.y / 10) * 10) };
  return { ...candidate, issue: existing.length >= 100 ? 'limit' : placementIssue(candidate, existing) };
}
export function suggestedPlacement(type, existing) {
  if (!Object.hasOwn(buildCatalog, type) || existing.length >= 100) return null;
  const position = findBuildablePosition(type, existing);
  return position ? previewPlacement(type, toPixels(position), existing) : null;
}
export function canBuild(type, position, existing) {
  return Object.hasOwn(buildCatalog, type) && existing.length < 100 &&
    Number.isFinite(position?.x) && Number.isFinite(position?.y) &&
    !placementIssue({ type, x: position.x, y: position.y }, existing);
}
