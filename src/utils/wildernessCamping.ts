/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TileType, Enemy, EnemyState, Follower } from '../types';
import { getOrganicBiome, hasTownAtChunk } from './overworld';
import { calculateWorldThreatTier } from './worldThreat';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from './gameUtils';

export type CampsiteShelterType = 'inn_bed' | 'field_tent' | 'bedroll' | 'campfire' | 'open_wilderness';

export interface CampsiteAnalysis {
  shelterType: CampsiteShelterType;
  title: string;
  description: string;
  icon: string;
  ambushBaseChance: number; // 0 to 1
  effectiveAmbushChance: number; // 0 to 1 after sentry & modifiers
  hasCompanionSentry: boolean;
  sentryName: string | null;
  hasFireLit: boolean;
  hpRecoveryMultiplier: number;
  mpRecoveryMultiplier: number;
  weatherInsulated: boolean;
  activeBiome: string;
  threatTier: number;
}

export interface AmbushEncounterResult {
  isAmbushed: boolean;
  interruptedHour: number;
  enemies: Enemy[];
  alertMessage: string;
  sentryAlerted: boolean;
}

/**
 * Evaluates the player's immediate surroundings to determine the quality of shelter and camping safety.
 */
export function analyzeCampsiteSurroundings(gameState: GameState): CampsiteAnalysis {
  const px = gameState.playerX;
  const py = gameState.playerY;
  const currentTile = gameState.map[py]?.[px];
  const isTown = hasTownAtChunk(gameState.currentChunkX, gameState.currentChunkY);
  const biome = gameState.isOverworld ? getOrganicBiome(gameState.currentChunkX, gameState.currentChunkY) : 'dungeon';
  const threatTier = gameState.isOverworld ? calculateWorldThreatTier(gameState.playerStats) : 3;

  // Check adjacent tiles for structures
  const adjacentTiles: TileType[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = px + dx;
      const ny = py + dy;
      if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
        const t = gameState.map[ny][nx];
        adjacentTiles.push(t);
      }
    }
  }

  const hasAdjacentCampfire = adjacentTiles.includes(TileType.Campfire) || adjacentTiles.includes(TileType.Fireplace);
  const hasAdjacentTent = adjacentTiles.includes(TileType.FieldTent) || currentTile === TileType.FieldTent;
  const hasAdjacentBedroll = adjacentTiles.includes(TileType.Bedroll) || currentTile === TileType.Bedroll;
  const hasAdjacentInnBed = (adjacentTiles.includes(TileType.Bed) || currentTile === TileType.Bed) && isTown;

  // Detect active follower sentry
  const activeFollower: Follower | undefined = gameState.followers?.find(f => f.hp > 0);
  const hasCompanionSentry = !!activeFollower;
  const sentryName = activeFollower ? activeFollower.name : null;

  let shelterType: CampsiteShelterType = 'open_wilderness';
  let title = 'Raw Wilderness Bivouac';
  let description = 'Resting directly on the bare ground. High exposure to the elements and lurking predators.';
  let icon = '🌲';
  let ambushBaseChance = 0.35 + threatTier * 0.08;
  let hpMultiplier = 1.0;
  let mpMultiplier = 1.0;
  let weatherInsulated = false;

  if (hasAdjacentInnBed) {
    shelterType = 'inn_bed';
    title = 'Town Tavern & Inn Bed';
    description = 'A warm featherbed guarded by the town watch. Completely safe from wild ambushes.';
    icon = '🏡';
    ambushBaseChance = 0;
    hpMultiplier = 1.5;
    mpMultiplier = 1.5;
    weatherInsulated = true;
  } else if (hasAdjacentTent) {
    shelterType = 'field_tent';
    title = 'Expedition Field Tent';
    description = 'Insulated canvas shelter protecting from severe weather with reinforced predator camouflage.';
    icon = '⛺';
    ambushBaseChance = 0.12 + threatTier * 0.04;
    hpMultiplier = 1.25;
    mpMultiplier = 1.25;
    weatherInsulated = true;
  } else if (hasAdjacentBedroll) {
    shelterType = 'bedroll';
    title = 'Traveler Survival Bedroll';
    description = 'A compact fur-lined bedroll offering comfortable rest away from cold stone.';
    icon = '🛏️';
    ambushBaseChance = 0.25 + threatTier * 0.06;
    hpMultiplier = 1.1;
    mpMultiplier = 1.1;
    weatherInsulated = false;
  } else if (hasAdjacentCampfire) {
    shelterType = 'campfire';
    title = 'Campfire Hearth Rest';
    description = 'The crackling fire provides warmth, cooks rations, and deters shy nocturnal beasts.';
    icon = '🔥';
    ambushBaseChance = 0.22 + threatTier * 0.05;
    hpMultiplier = 1.15;
    mpMultiplier = 1.1;
    weatherInsulated = false;
  }

  // Adjust for campfire deterring beasts
  if (hasAdjacentCampfire && shelterType !== 'inn_bed' && shelterType !== 'campfire') {
    ambushBaseChance = Math.max(0.05, ambushBaseChance * 0.75);
  }

  // Sentry reduction
  let effectiveAmbushChance = ambushBaseChance;
  if (hasCompanionSentry && shelterType !== 'inn_bed') {
    effectiveAmbushChance = Math.max(0.03, effectiveAmbushChance * 0.35); // 65% reduction with companion
  }

  // Moon phase & Nighttime effect
  const hour = Math.floor(gameState.gameTime / 60);
  const isNight = hour >= 20 || hour < 6;
  if (isNight && shelterType !== 'inn_bed') {
    effectiveAmbushChance = Math.min(0.9, effectiveAmbushChance * 1.2);
  }

  return {
    shelterType,
    title,
    description,
    icon,
    ambushBaseChance,
    effectiveAmbushChance,
    hasCompanionSentry,
    sentryName,
    hasFireLit: hasAdjacentCampfire,
    hpRecoveryMultiplier: hpMultiplier,
    mpRecoveryMultiplier: mpMultiplier,
    weatherInsulated,
    activeBiome: biome,
    threatTier
  };
}

/**
 * Rolls for wilderness ambush and spawns tactical night encounter enemies.
 */
export function rollWildernessAmbush(
  gameState: GameState,
  plannedHours: number,
  analysis: CampsiteAnalysis
): AmbushEncounterResult {
  if (analysis.shelterType === 'inn_bed' || analysis.effectiveAmbushChance <= 0) {
    return {
      isAmbushed: false,
      interruptedHour: plannedHours,
      enemies: [],
      alertMessage: '',
      sentryAlerted: false
    };
  }

  // Roll chance
  const roll = Math.random();
  const isAmbushed = roll < analysis.effectiveAmbushChance;

  if (!isAmbushed) {
    return {
      isAmbushed: false,
      interruptedHour: plannedHours,
      enemies: [],
      alertMessage: '',
      sentryAlerted: false
    };
  }

  // Ambush triggered! Pick an interruption hour midway through rest
  const interruptedHour = Math.max(1, Math.floor(Math.random() * plannedHours) + 1);

  // Spawn hostile ambush predators based on biome and threat tier
  const enemies: Enemy[] = generateAmbushEnemies(gameState, analysis);

  let alertMessage = '';
  if (analysis.hasCompanionSentry && analysis.sentryName) {
    alertMessage = `🛡️ [SENTRY WARNING]: ${analysis.sentryName} detected stealthy movement in the bushes and woke you before predators struck!`;
  } else {
    alertMessage = `💥 [NOCTURNAL AMBUSH!]: You were startled awake in the dead of night by hungry predators surrounding your campsite!`;
  }

  return {
    isAmbushed: true,
    interruptedHour,
    enemies,
    alertMessage,
    sentryAlerted: analysis.hasCompanionSentry
  };
}

/**
 * Generates thematic predators / bandits positioned around the campsite.
 */
function generateAmbushEnemies(gameState: GameState, analysis: CampsiteAnalysis): Enemy[] {
  const px = gameState.playerX;
  const py = gameState.playerY;
  const biome = analysis.activeBiome;
  const tier = analysis.threatTier;
  const playerLvl = gameState.playerStats.level || 1;

  interface AmbushArchetype {
    name: string;
    symbol: string;
    color: string;
    hp: number;
    atk: number;
    def: number;
    xp: number;
  }

  let archetypes: AmbushArchetype[] = [];

  if (biome === 'desert') {
    archetypes = [
      { name: 'Dune Scavenger Bandit', symbol: 'b', color: '#f59e0b', hp: 28 + tier * 8, atk: 7 + tier * 2, def: 2 + tier, xp: 25 },
      { name: 'Nightstalker Scorpion', symbol: 's', color: '#ea580c', hp: 22 + tier * 6, atk: 9 + tier * 2, def: 4 + tier, xp: 30 },
      { name: 'Desert Jackal', symbol: 'd', color: '#d97706', hp: 20 + tier * 5, atk: 6 + tier * 2, def: 1, xp: 20 }
    ];
  } else if (biome === 'tundra') {
    archetypes = [
      { name: 'Glacial Dire Wolf', symbol: 'w', color: '#93c5fd', hp: 32 + tier * 10, atk: 8 + tier * 3, def: 3 + tier, xp: 35 },
      { name: 'Frostbite Marauder', symbol: 'm', color: '#60a5fa', hp: 30 + tier * 8, atk: 7 + tier * 2, def: 4 + tier, xp: 30 },
      { name: 'Winter Wendigo Prowler', symbol: 'W', color: '#c084fc', hp: 40 + tier * 12, atk: 11 + tier * 3, def: 5 + tier, xp: 50 }
    ];
  } else if (biome === 'swamp') {
    archetypes = [
      { name: 'Bog Lurker', symbol: 'l', color: '#10b981', hp: 34 + tier * 8, atk: 8 + tier * 2, def: 3 + tier, xp: 32 },
      { name: 'Marshland Viper', symbol: 's', color: '#34d399', hp: 18 + tier * 5, atk: 9 + tier * 3, def: 1, xp: 22 },
      { name: 'Swamp Outlaw', symbol: 'o', color: '#059669', hp: 26 + tier * 7, atk: 7 + tier * 2, def: 2 + tier, xp: 28 }
    ];
  } else {
    // Forest / default overworld
    archetypes = [
      { name: 'Nocturnal Timber Wolf', symbol: 'w', color: '#a8a29e', hp: 24 + tier * 7, atk: 7 + tier * 2, def: 2 + tier, xp: 25 },
      { name: 'Forest Bandit Scout', symbol: 'b', color: '#f87171', hp: 26 + tier * 8, atk: 8 + tier * 2, def: 2 + tier, xp: 28 },
      { name: 'Shadow Goblin Prowler', symbol: 'g', color: '#4ade80', hp: 20 + tier * 5, atk: 6 + tier * 2, def: 1 + tier, xp: 20 }
    ];
  }

  const count = Math.min(3, Math.max(1, Math.floor(Math.random() * 2) + Math.floor(tier / 2) + 1));
  const enemies: Enemy[] = [];

  const spawnOffsets = [
    { dx: 2, dy: 1 },
    { dx: -2, dy: -1 },
    { dx: 1, dy: -2 },
    { dx: -1, dy: 2 },
    { dx: 2, dy: -2 },
    { dx: -2, dy: 2 }
  ];

  for (let i = 0; i < count; i++) {
    const template = archetypes[i % archetypes.length];
    const offset = spawnOffsets[i % spawnOffsets.length];
    let ex = Math.min(LEVEL_WIDTH - 2, Math.max(1, px + offset.dx));
    let ey = Math.min(LEVEL_HEIGHT - 2, Math.max(1, py + offset.dy));

    // Ensure valid walkable tile
    const tile = gameState.map[ey]?.[ex];
    if (tile === TileType.Wall || tile === TileType.Water) {
      ex = Math.min(LEVEL_WIDTH - 2, Math.max(1, px + (offset.dx > 0 ? 1 : -1)));
      ey = Math.min(LEVEL_HEIGHT - 2, Math.max(1, py));
    }

    const enemy: Enemy = {
      id: `ambush_${Date.now()}_${i}`,
      name: template.name,
      x: ex,
      y: ey,
      type: 'AmbushPredator',
      hp: template.hp,
      maxHp: template.hp,
      atk: template.atk,
      def: template.def,
      char: template.symbol,
      color: template.color,
      range: 1,
      speed: 1,
      state: EnemyState.Chasing,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: [],
      difficultyTier: tier > 2 ? 'tough' : 'standard',
    };

    enemies.push(enemy);
  }

  return enemies;
}
