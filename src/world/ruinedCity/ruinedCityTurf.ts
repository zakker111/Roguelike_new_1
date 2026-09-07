/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyState, EnemyType } from '../../types';
import { applyCombatArchetypeAndChaosScaling } from '../../utils/combatArchetypes';
import { RuinedCityProp, RuinedCitySector } from './types';

/**
 * Spawns an Orc Clan Warcamp sector with bone totems, campfires, and savage orcs.
 */
export function populateOrcWarcamp(
  sector: RuinedCitySector,
  enemyIdStart: number,
  playerLevel: number = 1,
  chaosScore: number = 20
): { enemies: Enemy[]; props: RuinedCityProp[]; nextId: number } {
  const enemies: Enemy[] = [];
  const props: RuinedCityProp[] = [];
  let nextId = enemyIdStart;

  const centerX = Math.floor(sector.x + sector.w / 2);
  const centerY = Math.floor(sector.y + sector.h / 2);

  // Central Orc Warfire
  props.push({
    x: centerX,
    y: centerY,
    char: '🔥',
    color: '#ea580c',
    name: 'Orcish Bloodfire Hearth',
    type: 'bonfire',
    interactive: true,
  });

  // Bone Totems around the warcamp
  props.push({
    x: sector.x + 1,
    y: sector.y + 1,
    char: '🪓',
    color: '#c2410c',
    name: 'Goreaxe Clan Totem',
    type: 'totem',
    interactive: true,
  });
  props.push({
    x: sector.x + sector.w - 2,
    y: sector.y + sector.h - 2,
    char: '💀',
    color: '#9a3412',
    name: 'Skull-Pike Boundary Marker',
    type: 'totem',
  });

  // 1. Orc Warlord / Clan Leader
  const warlord: Enemy = {
    id: `orc_warlord_${nextId++}`,
    x: centerX + 1,
    y: centerY,
    type: EnemyType.OrcBrute,
    name: 'Goreaxe Clan Warlord',
    hp: 48 + playerLevel * 6,
    maxHp: 48 + playerLevel * 6,
    atk: 8 + playerLevel * 2,
    def: 5 + Math.floor(playerLevel / 2),
    range: 1,
    speed: 1.1,
    char: '🧌',
    color: '#c2410c',
    state: EnemyState.Patrolling,
    isElite: true,
    eliteEffect: 'Primal Warcry',
    faction: 'orc_clans',
    factionRank: 'warlord',
    patrolPath: [
      { x: centerX + 1, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX, y: centerY + 1 },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(warlord, chaosScore));

  // 2. Orc Berserkers / Warriors
  const orcCount = 2 + Math.min(3, Math.floor(playerLevel / 3));
  for (let i = 0; i < orcCount; i++) {
    const ox = sector.x + 2 + (i % 3) * 2;
    const oy = sector.y + 2 + Math.floor(i / 3) * 2;
    const isShaman = i === 1;

    const orc: Enemy = {
      id: `orc_grunt_${nextId++}`,
      x: ox,
      y: oy,
      type: isShaman ? EnemyType.Goblin : EnemyType.OrcBrute,
      name: isShaman ? 'Goreaxe Blood Shaman' : 'Goreaxe Skullsplitter',
      hp: isShaman ? 24 + playerLevel * 4 : 32 + playerLevel * 5,
      maxHp: isShaman ? 24 + playerLevel * 4 : 32 + playerLevel * 5,
      atk: isShaman ? 5 + playerLevel : 6 + playerLevel,
      def: isShaman ? 2 : 3 + Math.floor(playerLevel / 3),
      range: isShaman ? 3 : 1,
      speed: 1.0,
      char: isShaman ? '🧙‍♂️' : 'O',
      color: isShaman ? '#ea580c' : '#f97316',
      state: EnemyState.Patrolling,
      isElite: false,
      faction: 'orc_clans',
      factionRank: isShaman ? 'shaman' : 'soldier',
      patrolPath: [
        { x: ox, y: oy },
        { x: ox + 1, y: oy },
      ],
      patrolIndex: 0,
      debuffs: [],
    };
    enemies.push(applyCombatArchetypeAndChaosScaling(orc, chaosScore));
  }

  return { enemies, props, nextId };
}

/**
 * Spawns a Bandit Hideout sector with tripwires, smuggler crates, and outlaws.
 */
export function populateBanditHideout(
  sector: RuinedCitySector,
  enemyIdStart: number,
  playerLevel: number = 1,
  chaosScore: number = 20
): { enemies: Enemy[]; props: RuinedCityProp[]; nextId: number } {
  const enemies: Enemy[] = [];
  const props: RuinedCityProp[] = [];
  let nextId = enemyIdStart;

  const centerX = Math.floor(sector.x + sector.w / 2);
  const centerY = Math.floor(sector.y + sector.h / 2);

  // Bandit Smuggler Crates & Campfire
  props.push({
    x: centerX,
    y: centerY,
    char: '🪵',
    color: '#78350f',
    name: 'Smuggled Contraband Crate',
    type: 'chest',
    interactive: true,
  });

  props.push({
    x: sector.x + 2,
    y: sector.y + 1,
    char: '🕸️',
    color: '#ef4444',
    name: 'Concealed Tripwire Trap',
    type: 'tripwire',
  });

  // 1. Bandit Captain / Assassin Leader
  const captain: Enemy = {
    id: `bandit_leader_${nextId++}`,
    x: centerX,
    y: centerY - 1,
    type: EnemyType.Bandit,
    name: 'Shadow Dagger Bandit Leader',
    hp: 42 + playerLevel * 5,
    maxHp: 42 + playerLevel * 5,
    atk: 8 + playerLevel * 2,
    def: 4 + Math.floor(playerLevel / 2),
    range: 1,
    speed: 0.9,
    char: '🥷',
    color: '#ef4444',
    state: EnemyState.Patrolling,
    isElite: true,
    eliteEffect: 'Shadowstep Backstab',
    faction: 'outlaw_bandits',
    factionRank: 'leader',
    patrolPath: [
      { x: centerX, y: centerY - 1 },
      { x: centerX + 2, y: centerY - 1 },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(captain, chaosScore));

  // 2. Bandit Archers and Trapsmiths
  const banditCount = 2 + Math.min(3, Math.floor(playerLevel / 3));
  for (let i = 0; i < banditCount; i++) {
    const bx = sector.x + 1 + (i % 3) * 2;
    const by = sector.y + 1 + Math.floor(i / 3) * 2;
    const isArcher = i % 2 === 1;

    const bandit: Enemy = {
      id: `bandit_grunt_${nextId++}`,
      x: bx,
      y: by,
      type: isArcher ? EnemyType.Trapmaster : EnemyType.Bandit,
      name: isArcher ? 'Outlaw Crossbow Sniper' : 'Bloodcrest Cutthroat',
      hp: 24 + playerLevel * 4,
      maxHp: 24 + playerLevel * 4,
      atk: isArcher ? 6 + playerLevel : 5 + playerLevel,
      def: 2 + Math.floor(playerLevel / 3),
      range: isArcher ? 4 : 1,
      speed: 1.0,
      char: isArcher ? '🏹' : 'B',
      color: '#f87171',
      state: EnemyState.Patrolling,
      isElite: false,
      faction: 'outlaw_bandits',
      factionRank: isArcher ? 'scout' : 'soldier',
      patrolPath: [
        { x: bx, y: by },
        { x: bx, y: by + 1 },
      ],
      patrolIndex: 0,
      debuffs: [],
    };
    enemies.push(applyCombatArchetypeAndChaosScaling(bandit, chaosScore));
  }

  return { enemies, props, nextId };
}

/**
 * Populates the Contested Central Plaza with rival scouts in close proximity,
 * creating dynamic, emergent turf skirmishes!
 */
export function populateContestedPlaza(
  sector: RuinedCitySector,
  enemyIdStart: number,
  playerLevel: number = 1,
  chaosScore: number = 20
): { enemies: Enemy[]; props: RuinedCityProp[]; nextId: number } {
  const enemies: Enemy[] = [];
  const props: RuinedCityProp[] = [];
  let nextId = enemyIdStart;

  const centerX = Math.floor(sector.x + sector.w / 2);
  const centerY = Math.floor(sector.y + sector.h / 2);

  // Plaza Centerpiece monument
  props.push({
    x: centerX,
    y: centerY,
    char: '⛲',
    color: '#38bdf8',
    name: 'Shattered Obsidian Fountain',
    type: 'rubble',
  });

  // Orc Scout positioned on North edge of plaza
  const orcScout: Enemy = {
    id: `plaza_orc_${nextId++}`,
    x: centerX - 2,
    y: centerY - 2,
    type: EnemyType.OrcBrute,
    name: 'Goreaxe Vanguard Raider',
    hp: 28 + playerLevel * 4,
    maxHp: 28 + playerLevel * 4,
    atk: 6 + playerLevel,
    def: 3,
    range: 1,
    speed: 1.0,
    char: 'O',
    color: '#ea580c',
    state: EnemyState.Chasing,
    isElite: false,
    faction: 'orc_clans',
    factionRank: 'scout',
    patrolPath: [{ x: centerX - 2, y: centerY - 2 }],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(orcScout, chaosScore));

  // Bandit Scout positioned on South edge of plaza (within vision of orc!)
  const banditScout: Enemy = {
    id: `plaza_bandit_${nextId++}`,
    x: centerX + 2,
    y: centerY + 2,
    type: EnemyType.Bandit,
    name: 'Bloodcrest Scout Marauder',
    hp: 26 + playerLevel * 4,
    maxHp: 26 + playerLevel * 4,
    atk: 6 + playerLevel,
    def: 2,
    range: 1,
    speed: 1.0,
    char: 'B',
    color: '#ef4444',
    state: EnemyState.Chasing,
    isElite: false,
    faction: 'outlaw_bandits',
    factionRank: 'scout',
    patrolPath: [{ x: centerX + 2, y: centerY + 2 }],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(banditScout, chaosScore));

  return { enemies, props, nextId };
}
