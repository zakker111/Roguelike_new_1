/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type SeasonPhase = 'early' | 'mid' | 'late';

export interface SeasonModifiers {
  /** Multiplier on wilderness foraging (berries, herbs, truffles, mushrooms). Spring = 2.0, Autumn = 1.5, Summer = 1.0, Winter = 0.0 */
  harvestYieldMultiplier: number;
  /** Whether sweet berry bushes are frozen solid in ice */
  berryHarvestFrozen: boolean;
  /** Probability of overburden movement fatigue stumbling (Winter = 0.65, others = 0.45) */
  overburdenStrainChance: number;
  /** Whether open overworld water surfaces freeze into walkable TileType.Ice platforms */
  waterFreezesToIce: boolean;
  /** Critical strike damage multiplier for stealth / backstab attacks in misty autumn */
  stealthDamageMultiplier: number;
  /** Field of View radius modifier (-1 in thick autumn mist, 0 standard) */
  fovRadiusModifier: number;
  /** Turns between overworld dehydration Focus/MP drains under blazing summer sun (15 in summer, 0 = disabled) */
  heatDrainIntervalTurns: number;
  /** Multiplier on cellular automata fire propagation spread (Summer = 1.5, Winter = 0.7, others = 1.0) */
  fireSpreadMultiplier: number;
  /** Lightning / catalyst damage empowerment factor (Summer = 1.25, others = 1.0) */
  catalystDamageMultiplier: number;
  /** Ambient visual particle archetype */
  ambientParticles: 'petals' | 'heat_motes' | 'amber_leaves' | 'frost_crystals';
}

export interface SeasonDefinition {
  id: SeasonType;
  name: string;
  icon: string;
  title: string;
  quote: string;
  transitionLog: string;
  modifiers: SeasonModifiers;
}

export interface SeasonState {
  currentSeason: SeasonType;
  year: number;
  seasonTurnProgress: number; // 0 to turnsPerSeason
  seasonCycleProgress: number; // 0.0 to 1.0
  phase: SeasonPhase;
  turnsPerSeason: number;
  modifiers: SeasonModifiers;
}

export interface SeasonTransitionEvent {
  transitioned: boolean;
  previousSeason: SeasonType;
  currentSeason: SeasonType;
  year: number;
  transitionMessage: string;
  vfxBadge: string;
  modifiers: SeasonModifiers;
}
