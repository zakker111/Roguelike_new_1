/**
 * Sovereign AI Game Master Storyteller Engine
 *
 * This module has been cleanly decoupled and decomposed into focused sub-modules under `src/utils/storyteller/`:
 * - `types.ts`: Storyteller interfaces, memory, moods, and catalog loaders.
 * - `storytellerFlavor.ts`: Dynamic narrative prompt and placeholder interpolators.
 * - `storytellerEncountersData.ts`: Master catalog of 26 dynamic GM encounters.
 * - `storytellerChaos.ts`: Chaos score modifications and 100-tier surge matrices.
 * - `storytellerRescue.ts`: Critical life-saving rescue evaluations.
 * - `storytellerEngine.ts`: Tension, boredom, autonomous monologue, and turn tick runner.
 */

export * from './storyteller';
