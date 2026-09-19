/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyState, EnemyType } from '../../types';
import { applyCombatArchetypeAndChaosScaling } from '../../utils/combatArchetypes';
import { RuinedCityProp, RuinedCitySector } from './types';
export type { RuinedCitySector, RuinedCityProp };

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
    id: `rc_bonfire_${sector.id}`,
    x: centerX,
    y: centerY,
    char: '🔥',
    color: '#ea580c',
    name: 'Orcish Bloodfire Hearth',
    description: 'A roaring bonfire pit of charred logs and iron cauldrons. Warm yourself to restore vitality.',
    actionLabel: 'Warm Up at Hearth',
    interaction: 'warm_hearth',
    isInteracted: false,
    type: 'bonfire',
    interactive: true,
  });

  // Bone Totems around the warcamp
  props.push({
    id: `rc_totem_${sector.id}_1`,
    x: sector.x + 1,
    y: sector.y + 1,
    char: '🪓',
    color: '#c2410c',
    name: 'Goreaxe Clan Totem',
    description: 'An intimidating wooden totem hung with battle axes. War chants resonate from its wood.',
    actionLabel: 'Channel Totem',
    interaction: 'statue_blessing',
    isInteracted: false,
    type: 'totem',
    interactive: true,
  });
  props.push({
    id: `rc_totem_${sector.id}_2`,
    x: sector.x + sector.w - 2,
    y: sector.y + sector.h - 2,
    char: '💀',
    color: '#9a3412',
    name: 'Skull-Pike Boundary Marker',
    description: 'Grisly trophies marking the perimeter of the Goreaxe clan territory.',
    actionLabel: 'Inspect Marker',
    interaction: 'inspect',
    isInteracted: false,
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
    homeCampX: centerX,
    homeCampY: centerY,
    patrolPath: [
      { x: centerX, y: centerY },
      { x: Math.max(sector.x + 2, centerX - 3), y: centerY },
      { x: centerX, y: Math.max(sector.y + 2, centerY - 3) },
      { x: Math.min(sector.x + sector.w - 3, centerX + 3), y: centerY },
      { x: centerX, y: Math.min(sector.y + sector.h - 3, centerY + 3) },
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
      homeCampX: centerX,
      homeCampY: centerY,
      patrolPath: [
        { x: ox, y: oy },
        { x: Math.min(sector.x + sector.w - 2, ox + 3), y: oy },
        { x: ox, y: Math.min(sector.y + sector.h - 2, oy + 2) },
        { x: Math.max(sector.x + 1, ox - 2), y: Math.max(sector.y + 1, oy - 2) },
      ],
      patrolIndex: 0,
      debuffs: [],
    };
    enemies.push(applyCombatArchetypeAndChaosScaling(orc, chaosScore));
  }

  // Interactive Warcamp barricade for scrap salvaging
  props.push({
    id: `rc_barricade_${sector.id}`,
    x: sector.x + 1,
    y: centerY,
    char: '🪵',
    color: '#b45309',
    name: 'Goreaxe Spiked Barricade',
    description: 'Heavy timber logs lashed together with spiked iron bands. Can be dismantled for valuable timber and metal scrap.',
    actionLabel: 'Dismantle Barricade',
    interaction: 'salvage_barricade',
    isInteracted: false,
    type: 'barricade',
    interactive: true,
  });

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
    id: `rc_contraband_${sector.id}`,
    x: centerX,
    y: centerY,
    char: '🪵',
    color: '#78350f',
    name: 'Smuggled Contraband Crate',
    description: 'A reinforced timber smuggler cache filled with stolen gold and illicit scrap metal.',
    actionLabel: 'Loot Contraband',
    interaction: 'search_crate',
    isInteracted: false,
    type: 'chest',
    interactive: true,
  });

  props.push({
    id: `rc_tripwire_${sector.id}`,
    x: sector.x + 2,
    y: sector.y + 1,
    char: '🕸️',
    color: '#ef4444',
    name: 'Concealed Tripwire Trap',
    description: 'A sinister tripwire linked to razor spikes.',
    actionLabel: 'Disarm Tripwire',
    interaction: 'clear_web',
    isInteracted: false,
    type: 'tripwire',
  });

  props.push({
    id: `rc_barricade_${sector.id}_outlaw`,
    x: sector.x + sector.w - 2,
    y: centerY,
    char: '🪵',
    color: '#b45309',
    name: 'Outlaw Timber Barricade',
    description: 'Rough-hewn wooden palisade protecting the smuggler entrance. Can be dismantled for timber.',
    actionLabel: 'Dismantle Barricade',
    interaction: 'salvage_barricade',
    isInteracted: false,
    type: 'barricade',
    interactive: true,
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
    homeCampX: centerX,
    homeCampY: centerY,
    patrolPath: [
      { x: centerX, y: centerY - 1 },
      { x: Math.min(sector.x + sector.w - 2, centerX + 3), y: centerY - 1 },
      { x: centerX, y: Math.min(sector.y + sector.h - 2, centerY + 2) },
      { x: Math.max(sector.x + 1, centerX - 3), y: centerY },
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
      isHighGroundSniper: isArcher,
      faction: 'outlaw_bandits',
      factionRank: isArcher ? 'scout' : 'soldier',
      homeCampX: centerX,
      homeCampY: centerY,
      patrolPath: [
        { x: bx, y: by },
        { x: bx, y: Math.max(sector.y + 1, by - 2) },
        { x: Math.min(sector.x + sector.w - 2, bx + 3), y: by },
        { x: Math.max(sector.x + 1, bx - 2), y: Math.min(sector.y + sector.h - 2, by + 2) },
      ],
      patrolIndex: 0,
      debuffs: [],
    };
    enemies.push(applyCombatArchetypeAndChaosScaling(bandit, chaosScore));
  }

  return { enemies, props, nextId };
}

/**
 * Populates the Contested Central Plaza with rival squads locked in an emergent clash!
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
    id: `rc_fountain_${sector.id}`,
    x: centerX,
    y: centerY,
    char: '⛲',
    color: '#38bdf8',
    name: 'Shattered Obsidian Fountain',
    description: 'A grand ornamental fountain carved from dark volcanic glass. Pure enchanted water still trickles inside.',
    actionLabel: 'Drink Fountain Water',
    interaction: 'drink_fountain',
    isInteracted: false,
    type: 'rubble',
    interactive: true,
  });

  // Battle rubble & salvageable debris from clash
  props.push({
    id: `rc_shield_debris_${sector.id}`,
    x: centerX - 1,
    y: centerY,
    char: '🛡️',
    color: '#94a3b8',
    name: 'Shattered War Shield & Broken Spear',
    description: 'Debris from recent skirmishes. Valuable metal scraps can be recovered.',
    actionLabel: 'Scavenge Metal Scraps',
    interaction: 'scavenge_weapon',
    isInteracted: false,
    type: 'rubble',
    interactive: true,
  });

  props.push({
    id: `rc_barricade_${sector.id}_plaza`,
    x: sector.x + 1,
    y: centerY,
    char: '🪵',
    color: '#78350f',
    name: 'Reinforced Plaza Barricade',
    description: 'Heavy fortifications built by rival factions across the central road.',
    actionLabel: 'Dismantle Barricade',
    interaction: 'salvage_barricade',
    isInteracted: false,
    type: 'barricade',
    interactive: true,
  });

  props.push({
    id: `rc_crate_${sector.id}_plaza`,
    x: sector.x + sector.w - 2,
    y: centerY,
    char: '📦',
    color: '#d97706',
    name: 'Scattered Supply Crate',
    description: 'Abandoned faction military rations, ammunition, and crafting timber.',
    actionLabel: 'Loot Supply Crate',
    interaction: 'search_crate',
    isInteracted: false,
    type: 'chest',
    interactive: true,
  });

  // --- ORC SQUAD (Engaged in clash on North/West flank of fountain) ---
  // 1. Orc Vanguard Raider (battle-worn frontliner)
  const orcVanguardMaxHp = 28 + playerLevel * 4;
  const orcScout: Enemy = {
    id: `plaza_orc_${nextId++}`,
    x: centerX - 2,
    y: centerY - 1,
    type: EnemyType.OrcBrute,
    name: 'Goreaxe Vanguard Raider',
    hp: Math.max(14, Math.round(orcVanguardMaxHp * 0.85)), // Pre-damaged in active skirmish
    maxHp: orcVanguardMaxHp,
    atk: 6 + playerLevel,
    def: 3,
    range: 1,
    speed: 1.0,
    char: 'O',
    color: '#ea580c',
    state: EnemyState.Patrolling,
    isElite: false,
    faction: 'orc_clans',
    factionRank: 'scout',
    homeCampX: sector.x - 5,
    homeCampY: sector.y - 5,
    patrolPath: [
      { x: centerX - 3, y: centerY - 1 },
      { x: centerX - 1, y: centerY },
      { x: centerX, y: centerY - 1 },
      { x: centerX - 2, y: centerY + 1 },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(orcScout, chaosScore));

  // 2. Orc Skullsplitter (heavy bruiser)
  const orcBruiserMaxHp = 32 + playerLevel * 4;
  const orcBruiser: Enemy = {
    id: `plaza_orc_${nextId++}`,
    x: centerX - 1,
    y: centerY - 2,
    type: EnemyType.OrcBrute,
    name: 'Goreaxe Skullsplitter',
    hp: Math.max(16, Math.round(orcBruiserMaxHp * 0.90)),
    maxHp: orcBruiserMaxHp,
    atk: 7 + playerLevel,
    def: 4,
    range: 1,
    speed: 1.0,
    char: '🧌',
    color: '#f97316',
    state: EnemyState.Patrolling,
    isElite: false,
    faction: 'orc_clans',
    factionRank: 'soldier',
    homeCampX: sector.x - 5,
    homeCampY: sector.y - 5,
    patrolPath: [
      { x: centerX - 2, y: centerY - 2 },
      { x: centerX - 1, y: centerY - 1 },
      { x: centerX + 1, y: centerY - 1 },
      { x: centerX - 1, y: centerY + 1 },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(orcBruiser, chaosScore));

  // 3. Orc Blood Shaman (casting support from rear)
  const orcShaman: Enemy = {
    id: `plaza_orc_${nextId++}`,
    x: centerX - 3,
    y: centerY - 2,
    type: EnemyType.Goblin,
    name: 'Goreaxe Blood Shaman',
    hp: 22 + playerLevel * 3,
    maxHp: 22 + playerLevel * 3,
    atk: 5 + playerLevel,
    def: 2,
    range: 3,
    speed: 1.0,
    char: '🧙‍♂️',
    color: '#ea580c',
    state: EnemyState.Patrolling,
    isElite: false,
    faction: 'orc_clans',
    factionRank: 'shaman',
    homeCampX: sector.x - 5,
    homeCampY: sector.y - 5,
    patrolPath: [
      { x: centerX - 3, y: centerY - 2 },
      { x: centerX - 2, y: centerY - 1 },
      { x: centerX - 1, y: centerY },
      { x: centerX - 3, y: centerY },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(orcShaman, chaosScore));

  // --- BANDIT SQUAD (Facing orcs across the fountain on South/East flank) ---
  // 1. Bloodcrest Cutthroat (flanker)
  const banditCutthroatMaxHp = 26 + playerLevel * 4;
  const banditScout: Enemy = {
    id: `plaza_bandit_${nextId++}`,
    x: centerX + 2,
    y: centerY + 1,
    type: EnemyType.Bandit,
    name: 'Bloodcrest Cutthroat',
    hp: Math.max(14, Math.round(banditCutthroatMaxHp * 0.80)), // Pre-damaged
    maxHp: banditCutthroatMaxHp,
    atk: 6 + playerLevel,
    def: 2,
    range: 1,
    speed: 1.0,
    char: 'B',
    color: '#ef4444',
    state: EnemyState.Patrolling,
    isElite: false,
    faction: 'outlaw_bandits',
    factionRank: 'soldier',
    homeCampX: sector.x + sector.w + 5,
    homeCampY: sector.y + sector.h + 5,
    patrolPath: [
      { x: centerX + 3, y: centerY + 1 },
      { x: centerX + 1, y: centerY },
      { x: centerX, y: centerY + 1 },
      { x: centerX + 2, y: centerY - 1 },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(banditScout, chaosScore));

  // 2. Bloodcrest Scout Marauder
  const banditMarauder: Enemy = {
    id: `plaza_bandit_${nextId++}`,
    x: centerX + 1,
    y: centerY + 2,
    type: EnemyType.Bandit,
    name: 'Bloodcrest Scout Marauder',
    hp: 24 + playerLevel * 4,
    maxHp: 24 + playerLevel * 4,
    atk: 5 + playerLevel,
    def: 2,
    range: 1,
    speed: 1.0,
    char: 'B',
    color: '#f87171',
    state: EnemyState.Patrolling,
    isElite: false,
    faction: 'outlaw_bandits',
    factionRank: 'scout',
    homeCampX: sector.x + sector.w + 5,
    homeCampY: sector.y + sector.h + 5,
    patrolPath: [
      { x: centerX + 2, y: centerY + 2 },
      { x: centerX + 1, y: centerY + 1 },
      { x: centerX - 1, y: centerY + 1 },
      { x: centerX + 1, y: centerY - 1 },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(banditMarauder, chaosScore));

  // 3. Outlaw Crossbow Sniper (stationed behind barricade, firing long-range bolts)
  const banditSniper: Enemy = {
    id: `plaza_bandit_${nextId++}`,
    x: centerX + 3,
    y: centerY + 2,
    type: EnemyType.Trapmaster,
    name: 'Outlaw Crossbow Sniper',
    hp: 22 + playerLevel * 3,
    maxHp: 22 + playerLevel * 3,
    atk: 7 + playerLevel,
    def: 2,
    range: 4,
    speed: 1.0,
    char: '🏹',
    color: '#f87171',
    state: EnemyState.Patrolling,
    isElite: false,
    isHighGroundSniper: true,
    faction: 'outlaw_bandits',
    factionRank: 'scout',
    homeCampX: sector.x + sector.w + 5,
    homeCampY: sector.y + sector.h + 5,
    patrolPath: [
      { x: centerX + 3, y: centerY + 2 },
      { x: centerX + 2, y: centerY + 1 },
      { x: centerX + 1, y: centerY },
      { x: centerX + 3, y: centerY },
    ],
    patrolIndex: 0,
    debuffs: [],
  };
  enemies.push(applyCombatArchetypeAndChaosScaling(banditSniper, chaosScore));

  return { enemies, props, nextId };
}

