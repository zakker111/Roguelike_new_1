/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SeasonType,
  SeasonPhase,
  SeasonModifiers,
  SeasonDefinition,
  SeasonState,
  SeasonTransitionEvent
} from './types';

export const DEFAULT_TURNS_PER_SEASON = 250;
export const TURNS_PER_YEAR = DEFAULT_TURNS_PER_SEASON * 4;

export const SEASON_DEFINITIONS: Record<SeasonType, SeasonDefinition> = {
  spring: {
    id: 'spring',
    name: 'Spring',
    icon: '🌸',
    title: 'Vernal Awakening',
    quote: 'Fresh blossoms bloom under gentle skies! Lowland fields and wild bushes flourish with double-yield bounties.',
    transitionLog:
      '🌸 [SEASON TRANSITION]: The cycle of life turns. Fresh blossoms bloom under gentle skies! Lowland fields are rich with double-yield Wild Berries.',
    modifiers: {
      harvestYieldMultiplier: 2.0,
      berryHarvestFrozen: false,
      overburdenStrainChance: 0.45,
      waterFreezesToIce: false,
      stealthDamageMultiplier: 1.0,
      fovRadiusModifier: 0,
      heatDrainIntervalTurns: 0,
      fireSpreadMultiplier: 1.0,
      catalystDamageMultiplier: 1.0,
      ambientParticles: 'petals'
    }
  },
  summer: {
    id: 'summer',
    name: 'Summer',
    icon: '☀️',
    title: 'Solar Zenith',
    quote: 'The midyear sun peaks! Severe drought heatwaves slow travel, dry vegetation ignites 50% faster, and dehydration saps Focus every 15 turns.',
    transitionLog:
      '☀️ [SEASON TRANSITION]: The midyear sun peaks! Severe drought heatwaves slow traveling speeds and slowly sap 1 Focus (MP) every 15 turns.',
    modifiers: {
      harvestYieldMultiplier: 1.0,
      berryHarvestFrozen: false,
      overburdenStrainChance: 0.45,
      waterFreezesToIce: false,
      stealthDamageMultiplier: 1.0,
      fovRadiusModifier: 0,
      heatDrainIntervalTurns: 15,
      fireSpreadMultiplier: 1.5,
      catalystDamageMultiplier: 1.25,
      ambientParticles: 'heat_motes'
    }
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    icon: '🍂',
    title: 'Amber Harvest',
    quote: 'Leaves turn amber and crimson. Thick shrouds of mist cover the land, reducing vision but boosting stealth critical strikes by +40%.',
    transitionLog:
      '🍂 [SEASON TRANSITION]: Leaves turn amber. Thick shrouds of mist cover the land, reducing vision by 50% but boosting stealth critical strikes by +40%.',
    modifiers: {
      harvestYieldMultiplier: 1.5,
      berryHarvestFrozen: false,
      overburdenStrainChance: 0.45,
      waterFreezesToIce: false,
      stealthDamageMultiplier: 1.4,
      fovRadiusModifier: -1,
      heatDrainIntervalTurns: 0,
      fireSpreadMultiplier: 1.0,
      catalystDamageMultiplier: 1.0,
      ambientParticles: 'amber_leaves'
    }
  },
  winter: {
    id: 'winter',
    name: 'Winter',
    icon: '❄️',
    title: 'Solstice Freeze',
    quote: 'Glacial blizzards sweep the continent. Overworld water freezes into solid walkable ice platforms, but foraging is frozen barren and overburden strain surges!',
    transitionLog:
      '❄️ [SEASON TRANSITION]: Solstice freeze! Glacial winter blizzards sweep the land. Overworld lakes and puddles freeze into solid walkable ice platforms, but your carrying weight penalties are 1.5x more severe and berry gathering is frozen barren!',
    modifiers: {
      harvestYieldMultiplier: 0.0,
      berryHarvestFrozen: true,
      overburdenStrainChance: 0.65,
      waterFreezesToIce: true,
      stealthDamageMultiplier: 1.0,
      fovRadiusModifier: 0,
      heatDrainIntervalTurns: 0,
      fireSpreadMultiplier: 0.7,
      catalystDamageMultiplier: 1.0,
      ambientParticles: 'frost_crystals'
    }
  }
};

/**
 * Universal Season & Environmental Progression Engine.
 * Conforms to ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md) & Reusable Engine Architecture.
 * Resolves 4-season progression, transition events, mechanical modifiers, and environmental impacts.
 */
export class SeasonEngine {
  private static instance: SeasonEngine;
  private turnsPerSeason: number;

  constructor(turnsPerSeason: number = DEFAULT_TURNS_PER_SEASON) {
    this.turnsPerSeason = Math.max(10, turnsPerSeason);
  }

  public static getInstance(): SeasonEngine {
    if (!SeasonEngine.instance) {
      SeasonEngine.instance = new SeasonEngine();
    }
    return SeasonEngine.instance;
  }

  /**
   * Calculates the authoritative season for a given cumulative turn count
   */
  public getSeasonForTurns(turns: number): SeasonType {
    const safeTurns = Math.max(0, Math.floor(turns));
    const cycle = Math.floor(safeTurns / this.turnsPerSeason) % 4;
    switch (cycle) {
      case 0:
        return 'spring';
      case 1:
        return 'summer';
      case 2:
        return 'autumn';
      case 3:
      default:
        return 'winter';
    }
  }

  /**
   * Calculates the in-game year (starts at Year 1)
   */
  public getYearForTurns(turns: number): number {
    const safeTurns = Math.max(0, Math.floor(turns));
    return Math.floor(safeTurns / (this.turnsPerSeason * 4)) + 1;
  }

  /**
   * Computes the current season state snapshot
   */
  public getSeasonState(turns: number): SeasonState {
    const currentSeason = this.getSeasonForTurns(turns);
    const year = this.getYearForTurns(turns);
    const safeTurns = Math.max(0, Math.floor(turns));
    const seasonTurnProgress = safeTurns % this.turnsPerSeason;
    const seasonCycleProgress = seasonTurnProgress / this.turnsPerSeason;

    let phase: SeasonPhase = 'early';
    if (seasonCycleProgress >= 0.66) {
      phase = 'late';
    } else if (seasonCycleProgress >= 0.33) {
      phase = 'mid';
    }

    return {
      currentSeason,
      year,
      seasonTurnProgress,
      seasonCycleProgress,
      phase,
      turnsPerSeason: this.turnsPerSeason,
      modifiers: this.getModifiers(currentSeason)
    };
  }

  /**
   * Checks if an atomic turn step crossed a seasonal boundary
   */
  public checkTransition(prevTurns: number, nextTurns: number): SeasonTransitionEvent | null {
    const prevSeason = this.getSeasonForTurns(prevTurns);
    const nextSeason = this.getSeasonForTurns(nextTurns);

    if (prevSeason === nextSeason) {
      return null;
    }

    const year = this.getYearForTurns(nextTurns);
    const def = SEASON_DEFINITIONS[nextSeason];

    return {
      transitioned: true,
      previousSeason: prevSeason,
      currentSeason: nextSeason,
      year,
      transitionMessage: def.transitionLog,
      vfxBadge: `${nextSeason.toUpperCase()} TIME!`,
      modifiers: def.modifiers
    };
  }

  /**
   * Returns authoritative mechanical modifiers for a given season
   */
  public getModifiers(season: SeasonType): SeasonModifiers {
    return SEASON_DEFINITIONS[season]?.modifiers || SEASON_DEFINITIONS.spring.modifiers;
  }

  /**
   * Returns multiplier on wild foraging (Spring = 2.0, Autumn = 1.5, Summer = 1.0, Winter = 0.0)
   */
  public getHarvestMultiplier(season: SeasonType): number {
    return this.getModifiers(season).harvestYieldMultiplier;
  }

  /**
   * Checks if dehydration should tick during overworld travel in summer
   */
  public checkDehydrationTick(
    season: SeasonType,
    turns: number,
    isOverworld: boolean
  ): { shouldDrain: boolean; message?: string } {
    if (!isOverworld) return { shouldDrain: false };
    const interval = this.getModifiers(season).heatDrainIntervalTurns;
    if (interval <= 0) return { shouldDrain: false };

    if (turns > 0 && turns % interval === 0) {
      return {
        shouldDrain: true,
        message: '☀️ [SUMMER HEAT]: The blazing sun saps your concentration! You lose 1 Focus (MP) to dehydration.'
      };
    }
    return { shouldDrain: false };
  }

  /**
   * Checks if water should freeze into solid ice platforms
   */
  public shouldWaterFreeze(season: SeasonType, biome?: string): boolean {
    if (biome === 'tundra' || biome === 'glacial') return true;
    return this.getModifiers(season).waterFreezesToIce;
  }

  /**
   * Computes stealth critical strike damage empowered by autumn mists
   */
  public calculateStealthDamage(
    baseDamage: number,
    season: SeasonType,
    isCrit: boolean
  ): { damage: number; boosted: boolean } {
    if (!isCrit) return { damage: baseDamage, boosted: false };
    const mult = this.getModifiers(season).stealthDamageMultiplier;
    if (mult > 1.0) {
      return {
        damage: Math.floor(baseDamage * mult),
        boosted: true
      };
    }
    return { damage: baseDamage, boosted: false };
  }

  /**
   * Returns the metadata definition of a season
   */
  public getSeasonDefinition(season: SeasonType): SeasonDefinition {
    return SEASON_DEFINITIONS[season] || SEASON_DEFINITIONS.spring;
  }

  /**
   * Returns all 4 season definitions in chronological order
   */
  public getAllSeasons(): SeasonDefinition[] {
    return [
      SEASON_DEFINITIONS.spring,
      SEASON_DEFINITIONS.summer,
      SEASON_DEFINITIONS.autumn,
      SEASON_DEFINITIONS.winter
    ];
  }
}
