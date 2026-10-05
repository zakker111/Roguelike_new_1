/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Enemy, EnemyState, EnemyType, Chest, Trap, TrapType, DungeonProp } from '../../types';
import { applyCombatArchetypeAndChaosScaling } from '../../utils/combatArchetypes';
import { prng } from '../../utils/overworld/overworldCore';
import { EmergentSkirmishConfig, EmergentSkirmishResult, SkirmishScenarioType } from './types';
import { getRandomFactionSpoils } from './factionSpoils';

/**
 * Procedurally generates an emergent skirmish battlefield on an overworld chunk.
 */
export function generateEmergentSkirmish(
  map: TileType[][],
  config: EmergentSkirmishConfig
): EmergentSkirmishResult | null {
  const { chunkX, chunkY, width, height, playerLevel = 1, chaosScore = 20 } = config;

  // Find a suitable open 7x7 flat clearing away from chunk borders
  let centerX = -1;
  let centerY = -1;

  for (let attempt = 0; attempt < 80; attempt++) {
    const rx = 8 + Math.floor(prng(chunkX * 31, chunkY * 17, attempt + 1) * (width - 16));
    const ry = 6 + Math.floor(prng(chunkX * 23, chunkY * 29, attempt + 2) * (height - 12));

    let isClear = true;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const t = map[ry + dy]?.[rx + dx];
        if (
          !t ||
          t === TileType.Water ||
          t === TileType.Wall
        ) {
          isClear = false;
          break;
        }
      }
      if (!isClear) break;
    }

    if (isClear) {
      centerX = rx;
      centerY = ry;
      break;
    }
  }

  if (centerX === -1) {
    return null;
  }

  // Determine scenario archetype deterministically based on coordinates
  const scenarioRoll = prng(chunkX * 41, chunkY * 73, 902);
  let scenario: SkirmishScenarioType = 'active_plaza_melee';
  if (scenarioRoll < 0.35) {
    scenario = 'active_plaza_melee';
  } else if (scenarioRoll < 0.70) {
    scenario = 'high_ground_ambush';
  } else {
    scenario = 'base_siege_redoubt';
  }

  const enemies: Enemy[] = [];
  const chests: Chest[] = [];
  const traps: Trap[] = [];
  const props: DungeonProp[] = [];

  if (scenario === 'active_plaza_melee') {
    // ⚔️ SCENARIO 1: ACTIVE PLAZA MELEE (Dawn Vanguard vs Orc Clan clash)
    // Carve dirt plaza paving
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 4) {
          map[centerY + dy][centerX + dx] = TileType.Path;
        }
      }
    }

    // Central battle debris
    map[centerY][centerX] = TileType.Campfire;
    if (map[centerY][centerX - 1] === TileType.Path) map[centerY][centerX - 1] = TileType.Chair;

    // Squad A: Dawn Vanguard Crusaders (West side)
    const vanguardIds: string[] = [];
    const vanguardNames = ['Vanguard Crusader', 'Vanguard Sentry', 'Vanguard Lightbearer'];
    for (let i = 0; i < 2; i++) {
      const ex = centerX - 2;
      const ey = centerY - 1 + i * 2;
      const id = `skirmish_van_${chunkX}_${chunkY}_${i}`;
      vanguardIds.push(id);

      const rawEnemy: Enemy = {
        id,
        x: ex,
        y: ey,
        name: vanguardNames[i % vanguardNames.length],
        char: 'V',
        color: '#fbbf24',
        type: EnemyType.OrcBrute,
        hp: 34 + playerLevel * 4,
        maxHp: 34 + playerLevel * 4,
        atk: 5 + Math.floor(playerLevel * 0.8),
        def: 3,
        range: 1,
        speed: 1.0,
        faction: 'vanguard',
        factionRank: i === 0 ? 'captain' : 'soldier',
        isElite: i === 0,
        patrolPath: [{ x: ex, y: ey }],
        patrolIndex: 0,
        state: EnemyState.Chasing,
        difficultyTier: 'standard',
        debuffs: [],
      };
      enemies.push(applyCombatArchetypeAndChaosScaling(rawEnemy, 0, undefined, chaosScore));
    }

    // Squad B: Orc Bloodaxe Clan (East side)
    const orcNames = ['Goreaxe Berserker', 'Goreaxe Raider'];
    for (let i = 0; i < 2; i++) {
      const ex = centerX + 2;
      const ey = centerY - 1 + i * 2;
      const id = `skirmish_orc_${chunkX}_${chunkY}_${i}`;

      const rawEnemy: Enemy = {
        id,
        x: ex,
        y: ey,
        name: orcNames[i % orcNames.length],
        char: 'O',
        color: '#ef4444',
        type: EnemyType.OrcBrute,
        hp: 36 + playerLevel * 4,
        maxHp: 36 + playerLevel * 4,
        atk: 6 + Math.floor(playerLevel * 0.9),
        def: 2,
        range: 1,
        speed: 1.0,
        faction: 'orc_clan',
        factionRank: 'soldier',
        isElite: false,
        patrolPath: [{ x: ex, y: ey }],
        patrolIndex: 0,
        state: EnemyState.Chasing,
        difficultyTier: 'standard',
        debuffs: [],
      };
      enemies.push(applyCombatArchetypeAndChaosScaling(rawEnemy, 0, undefined, chaosScore));
    }

    // Battlefield Spoils Cache
    chests.push({
      id: `skirmish_spoils_${chunkX}_${chunkY}`,
      x: centerX,
      y: centerY - 2,
      isOpened: false,
      materials: ['mat_iron', 'mat_tempered_scrap', 'mat_thick_hide'],
      catalysts: ['cat_fire'],
      gold: 90 + Math.floor(playerLevel * 15),
    });

    return {
      scenario,
      name: 'Contested Crossroads Skirmish',
      description: 'Dawn Vanguard Crusaders and Orc Goreaxe Clan warriors clash violently in an open crossroad melee!',
      enemies,
      chests,
      traps,
      props,
      centerX,
      centerY,
      factionA: 'vanguard',
      factionB: 'orc_clan',
    };
  }

  if (scenario === 'high_ground_ambush') {
    // 🏹 SCENARIO 2: HIGH-GROUND CROSSBOW AMBUSH
    // Carve elevated barricades and torch towers
    map[centerY - 2][centerX - 2] = TileType.WatchtowerBarricade;
    map[centerY - 2][centerX + 2] = TileType.WatchtowerBarricade;
    map[centerY - 2][centerX] = TileType.Torch;
    map[centerY + 2][centerX] = TileType.Torch;

    // Spike traps on approach choke points
    traps.push({
      id: `ambush_trap_${chunkX}_${chunkY}_1`,
      x: centerX - 1,
      y: centerY + 1,
      type: TrapType.Spikes,
      isActive: true,
      triggered: false,
      hidden: true,
      detected: false,
    });
    traps.push({
      id: `ambush_trap_${chunkX}_${chunkY}_2`,
      x: centerX + 1,
      y: centerY + 1,
      type: TrapType.Spikes,
      isActive: true,
      triggered: false,
      hidden: true,
      detected: false,
    });

    // 2 High-Ground Outlaw Marksmen (Range 4)
    for (let i = 0; i < 2; i++) {
      const ex = i === 0 ? centerX - 2 : centerX + 2;
      const ey = centerY - 1;
      const rawEnemy: Enemy = {
        id: `ambush_sniper_${chunkX}_${chunkY}_${i}`,
        x: ex,
        y: ey,
        name: 'Outlaw Crossbow Sharpshooter [High Ground]',
        char: 'M',
        color: '#f43f5e',
        type: EnemyType.Bandit,
        hp: 24 + playerLevel * 3,
        maxHp: 24 + playerLevel * 3,
        atk: 5 + Math.floor(playerLevel * 0.7),
        def: 2,
        range: 4, // 4-tile lethal ranged sniper!
        speed: 1.0,
        faction: 'bandits',
        factionRank: 'scout',
        isElite: false,
        patrolPath: [{ x: ex, y: ey }],
        patrolIndex: 0,
        state: EnemyState.Patrolling,
        difficultyTier: 'tough',
        debuffs: [],
      };
      enemies.push(applyCombatArchetypeAndChaosScaling(rawEnemy, 0, undefined, chaosScore));
    }

    // 1 Outlaw Enforcer spotter on the ground
    const rawSpotter: Enemy = {
      id: `ambush_spotter_${chunkX}_${chunkY}`,
      x: centerX,
      y: centerY,
      name: 'Outlaw Spotter & Trapper',
      char: 'T',
      color: '#e11d48',
      type: EnemyType.Bandit,
      hp: 30 + playerLevel * 4,
      maxHp: 30 + playerLevel * 4,
      atk: 4 + Math.floor(playerLevel * 0.6),
      def: 2,
      range: 1,
      speed: 1.1,
      faction: 'bandits',
      factionRank: 'soldier',
      isElite: false,
      patrolPath: [{ x: centerX, y: centerY }],
      patrolIndex: 0,
      state: EnemyState.Patrolling,
      difficultyTier: 'standard',
      debuffs: [],
    };
    enemies.push(applyCombatArchetypeAndChaosScaling(rawSpotter, 0, undefined, chaosScore));

    // Stolen Merchant Tribute Chest
    chests.push({
      id: `ambush_chest_${chunkX}_${chunkY}`,
      x: centerX,
      y: centerY - 2,
      isOpened: false,
      materials: ['mat_thick_hide', 'mat_copper_ore', 'mat_iron_ore'],
      catalysts: ['cat_poison'],
      gold: 110 + Math.floor(playerLevel * 20),
    });

    return {
      scenario,
      name: 'Outlaw High-Ground Ambush Post',
      description: 'Lethal outlaw sharpshooters overlook the trail from fortified watch barricades with concealed spike traps!',
      enemies,
      chests,
      traps,
      props,
      centerX,
      centerY,
      factionA: 'bandits',
    };
  }

  // 🏰 SCENARIO 3: BASE SIEGE / FORTIFIED REDOUBT
  // Palisade walls with entrance
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (Math.abs(dx) === 3 || Math.abs(dy) === 3) {
        // Entrance gate at South center
        if (dy === 3 && (dx === 0 || dx === -1)) {
          map[centerY + dy][centerX + dx] = TileType.TownGate;
        } else {
          map[centerY + dy][centerX + dx] = TileType.WatchtowerBarricade;
        }
      } else {
        map[centerY + dy][centerX + dx] = TileType.Path;
      }
    }
  }

  // Torches at the gate
  map[centerY + 3][centerX - 2] = TileType.Torch;
  map[centerY + 3][centerX + 1] = TileType.Torch;
  map[centerY][centerX] = TileType.Campfire;

  // The Warlord Boss
  const bossId = `warlord_boss_${chunkX}_${chunkY}`;
  const orcFaction = prng(chunkX * 11, chunkY * 13, 501) < 0.5;
  const warlordName = orcFaction
    ? 'Warlord Bloodfang Krug [Orc Chieftain]'
    : 'Malakor the Ruthless [Bandit Warlord]';
  const warlordChar = orcFaction ? '👑' : 'B';
  const warlordColor = orcFaction ? '#dc2626' : '#991b1b';
  const warlordFaction = orcFaction ? 'orc_clan' : 'bandits';

  const rawWarlord: Enemy = {
    id: bossId,
    x: centerX,
    y: centerY - 1,
    name: warlordName,
    char: warlordChar,
    color: warlordColor,
    type: EnemyType.OrcBrute,
    hp: 65 + playerLevel * 8,
    maxHp: 65 + playerLevel * 8,
    atk: 8 + Math.floor(playerLevel * 1.2),
    def: 4 + Math.floor(playerLevel * 0.5),
    range: 1,
    speed: 1.0,
    faction: warlordFaction,
    factionRank: 'warlord',
    isBoss: true,
    isElite: true,
    eliteEffect: 'Furious',
    patrolPath: [{ x: centerX, y: centerY - 1 }],
    patrolIndex: 0,
    state: EnemyState.Patrolling,
    difficultyTier: 'apex',
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(rawWarlord, 0, undefined, chaosScore));

  // 2 Garrison Sentries linked to Warlord
  for (let i = 0; i < 2; i++) {
    const gx = i === 0 ? centerX - 1 : centerX + 1;
    const gy = centerY + 1;
    const rawSentry: Enemy = {
      id: `garrison_guard_${chunkX}_${chunkY}_${i}`,
      x: gx,
      y: gy,
      name: orcFaction ? 'Goreaxe Clan Enforcer' : 'Outlaw Raider Guard',
      char: orcFaction ? 'O' : 'R',
      color: orcFaction ? '#ea580c' : '#b91c1c',
      type: orcFaction ? EnemyType.OrcBrute : EnemyType.Bandit,
      hp: 30 + playerLevel * 4,
      maxHp: 30 + playerLevel * 4,
      atk: 5 + Math.floor(playerLevel * 0.7),
      def: 2,
      range: 1,
      speed: 1.0,
      faction: warlordFaction,
      factionRank: 'soldier',
      packLeaderId: bossId, // Linked to Warlord for morale break!
      isElite: false,
      patrolPath: [{ x: gx, y: gy }],
      patrolIndex: 0,
      state: EnemyState.Patrolling,
      difficultyTier: 'tough',
      debuffs: [],
    };
    enemies.push(applyCombatArchetypeAndChaosScaling(rawSentry, 0, undefined, chaosScore));
  }

  // Faction Spoils War Chest (Locked until Warlord defeated or picked)
  chests.push({
    id: `faction_war_chest_${chunkX}_${chunkY}`,
    x: centerX,
    y: centerY - 2,
    isOpened: false,
    isLocked: true,
    materials: orcFaction ? ['mat_iron', 'mat_mithril', 'mat_obsidian'] : ['mat_thick_hide', 'mat_mithril', 'mat_feybone'],
    catalysts: orcFaction ? ['cat_fire', 'cat_lightning'] : ['cat_shadow', 'cat_poison'],
    gold: 180 + Math.floor(playerLevel * 25),
  });

  return {
    scenario: 'base_siege_redoubt',
    name: `${warlordFaction === 'orc_clan' ? 'Orc Goreaxe Clan' : 'Outlaw Syndicate'} Fortified Redoubt`,
    description: `A heavily fortified stockade garrison led by ${warlordName}. Defeat the warlord to liberate the garrison and unlock the War Chest!`,
    enemies,
    chests,
    traps,
    props,
    centerX,
    centerY,
    factionA: warlordFaction,
  };
}
