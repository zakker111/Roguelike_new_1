import { STORY_EVENTS_CATALOG } from './types';

/**
 * Utility helper to randomly select a narrative string from a flavor pool and perform token replacements.
 */
export function getRandomFlavorText(
  pool: string[] | undefined,
  fallbackText: string,
  replacements: Record<string, string | number> = {}
): string {
  let template = fallbackText;
  if (pool && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    template = pool[idx];
  }
  return Object.entries(replacements).reduce((acc, [key, val]) => {
    return acc.replaceAll(`{${key}}`, String(val));
  }, template);
}

/**
 * Fetches a randomized flavor text for GM interventions/encounters with dynamic placeholders interpolated.
 */
export function getEncounterFlavorText(
  encounterId: string,
  fallbackText: string,
  replacements: Record<string, string | number> = {}
): string {
  const encData = STORY_EVENTS_CATALOG.encounters.find(e => e.id === encounterId);
  return getRandomFlavorText(encData?.flavorPool, fallbackText, replacements);
}

/**
 * Fetches a randomized flavor text for Chaos Surge rolls with dynamic placeholders interpolated.
 */
export function getChaosSurgeFlavorText(
  roll: number,
  fallbackText: string,
  replacements: Record<string, string | number> = {}
): string {
  const surgeData = STORY_EVENTS_CATALOG.chaosSurges.find(s => s.roll === roll);
  return getRandomFlavorText(surgeData?.flavorPool, fallbackText, replacements);
}
