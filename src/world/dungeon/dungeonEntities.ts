/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Enemy, EnemyType, EnemyState, Follower } from '../../types';
import enemyTemplates from '../../data/enemies.json';
import { applyCombatArchetypeAndChaosScaling } from '../../utils/combatArchetypes';
import { getActiveCustomMonsters } from '../../utils/moddingEngine';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { BossTemplate, Room } from './types';

export function getEnemyTemplate(type: EnemyType | string) {
  if (type === 'captive') {
    return { name: 'Captive Villager', baseHp: 15, baseAtk: 0, baseDef: 0, range: 1, speed: 1.0, char: '👤', color: '#38bdf8' };
  }

  // Modded monsters registered via Modding API
  const moddedMonsters = getActiveCustomMonsters();
  const moddedMatch = moddedMonsters.find(m => m.id === type || m.name.toLowerCase() === String(type).toLowerCase());
  if (moddedMatch) {
    return {
      name: moddedMatch.name,
      baseHp: moddedMatch.hp,
      baseAtk: moddedMatch.atk,
      baseDef: moddedMatch.def,
      range: moddedMatch.range || 1,
      speed: moddedMatch.speed || 1.0,
      char: moddedMatch.char,
      color: moddedMatch.color
    };
  }

  const customEnemies = typeof window !== 'undefined' ? (window as any).customEnemies : undefined;
  if (customEnemies) {
    const custom = customEnemies.find((e: any) => e.type === type);
    if (custom) {
      return {
        name: custom.name,
        baseHp: custom.baseHp,
        baseAtk: custom.baseAtk,
        baseDef: custom.baseDef,
        range: custom.range,
        speed: custom.speed !== undefined ? custom.speed : 1.0,
        char: custom.char,
        color: custom.color
      };
    }
  }

  // Alias lookup map
  let mappedKey = type;
  if (type === 'Brute') mappedKey = 'OrcBrute';
  if (type === 'Mage') mappedKey = 'SkeletonMage';

  // Fallback defaults loaded from easy-to-modify JSON
  const template = (enemyTemplates as any)[mappedKey] || (enemyTemplates as any)[type];
  if (template) {
    return {
      name: template.name,
      baseHp: template.baseHp,
      baseAtk: template.baseAtk,
      baseDef: template.baseDef,
      range: template.range,
      speed: template.speed !== undefined ? template.speed : 1.0,
      char: template.char,
      color: template.color
    };
  }

  // Extreme fallback default in case key is missing
  console.error(`[DEV ERROR] getEnemyTemplate: Unknown or missing enemy type '${type}'! Returning default Giant Plague Rat template.`);
  return { name: 'Giant Plague Rat', baseHp: 8, baseAtk: 2, baseDef: 0, range: 1, speed: 1.0, char: 'r', color: '#a1a1aa' };
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    name: 'Morgath the Voidbringer',
    type: EnemyType.SkeletonMage,
    char: '☠',
    color: '#c084fc',
    hpMultiplier: 2.8,
    atkMultiplier: 1.8,
    defBonus: 3,
    speed: 0.9,
    description: 'A terrifying giant skeleton mage channeling dark necrotic energies.'
  },
  {
    name: 'Grommash the Undying Troll',
    type: EnemyType.Troll,
    char: '👹',
    color: '#f43f5e',
    hpMultiplier: 3.2,
    atkMultiplier: 2.1,
    defBonus: 3,
    speed: 1.2,
    description: 'A colossal cave beast with unfathomable stamina and brutal physical weight.'
  },
  {
    name: 'Warlord Krosh Skullbreaker',
    type: EnemyType.OrcBrute,
    char: '🧌',
    color: '#ea580c',
    hpMultiplier: 3.0,
    atkMultiplier: 2.3,
    defBonus: 3,
    speed: 1.1,
    description: 'A heavily plated orc carrying a massive stone hammer that shatters skulls.'
  },
  {
    name: 'King Scurry the Plague Swarm',
    type: EnemyType.Rat,
    char: '🐀',
    color: '#a3e635',
    hpMultiplier: 2.5,
    atkMultiplier: 1.6,
    defBonus: 2,
    speed: 0.7,
    description: 'An infected giant rodent that runs at blistering speeds and bites with toxic fangs.'
  },
  {
    name: 'Malakar the Phantom Trapsmith',
    type: EnemyType.Trapmaster,
    char: '🥷',
    color: '#ec4899',
    hpMultiplier: 2.7,
    atkMultiplier: 1.9,
    defBonus: 2,
    speed: 0.8,
    description: 'A spectral rogue phantom weaving fires vents, darts, and spikes silently.'
  },
  {
    name: 'Lord Vladis Nocturna',
    type: EnemyType.Vampire,
    char: '🦇',
    color: '#e11d48',
    hpMultiplier: 3.0,
    atkMultiplier: 2.0,
    defBonus: 3,
    speed: 0.8,
    description: 'The ancient sovereign of the crypts. He moves with dark velocity and siphons player vitality.'
  },
  {
    name: 'Viscous Goliath the Great Slime',
    type: EnemyType.Slime,
    char: '🦠',
    color: '#10b981',
    hpMultiplier: 3.4,
    atkMultiplier: 1.5,
    defBonus: 4,
    speed: 1.3,
    description: 'A titanic, pulsating gelatinous mass that digests weapon armor and splits on heavy impacts.'
  },
  {
    name: 'Broodmother Arachnia',
    type: EnemyType.Spider,
    char: '🕷️',
    color: '#f59e0b',
    hpMultiplier: 2.6,
    atkMultiplier: 1.9,
    defBonus: 2,
    speed: 0.8,
    description: 'A colossal multi-legged weaver that spews paralyzing web traps and injects necrotoxins.'
  },
  {
    name: 'Archlich Kel\'Thuzar',
    type: EnemyType.Necromancer,
    char: '🔮',
    color: '#8b5cf6',
    hpMultiplier: 2.9,
    atkMultiplier: 2.2,
    defBonus: 3,
    speed: 1.0,
    description: 'The eternal lord of the undead who resurrects fallen skeletons and controls frost rituals.'
  },
  {
    name: 'Sir Kaelen the Black Warden',
    type: EnemyType.DreadKnight,
    char: '🛡️',
    color: '#475569',
    hpMultiplier: 3.3,
    atkMultiplier: 1.8,
    defBonus: 5,
    speed: 1.2,
    description: 'A fallen, obsidian-plated guardian wielding a cursed broadsword and utilizing unbreakable iron guards.'
  },
  {
    name: 'Ignis the Elder Fire Dragon',
    type: EnemyType.Dragon,
    char: '🐉',
    color: '#f97316',
    hpMultiplier: 3.8,
    atkMultiplier: 2.6,
    defBonus: 5,
    speed: 1.1,
    description: 'An ancient volcanic dragon of legendary power. Its scales are harder than steel and its breath incinerates stone.'
  },
  {
    name: 'The Echo of Sunder',
    type: EnemyType.Ghost,
    char: '👻',
    color: '#6366f1',
    hpMultiplier: 2.4,
    atkMultiplier: 1.7,
    defBonus: 3,
    speed: 0.9,
    description: 'A weeping translucent apparition that drifts through solid barriers, phasing through standard armor.'
  },
  {
    name: 'Iku-Turso Eternal Leviathan',
    type: EnemyType.IkuTurso,
    char: '🦑',
    color: '#0ea5e9',
    hpMultiplier: 3.6,
    atkMultiplier: 2.5,
    defBonus: 4,
    speed: 1.0,
    description: 'An ancient, terrifying kraken of Finnish lore rising from watery abysses.'
  },
  {
    name: 'Kalma Grave Goddess',
    type: EnemyType.Kalma,
    char: '💀',
    color: '#a855f7',
    hpMultiplier: 3.0,
    atkMultiplier: 2.1,
    defBonus: 3,
    speed: 0.9,
    description: 'The Finnish goddess of death and sweet decay. Haunts graves and casts lethal curses.'
  },
  {
    name: 'Otso the Honey-Paw Bear Spirit',
    type: EnemyType.Otso,
    char: '🐻',
    color: '#b45309',
    hpMultiplier: 3.5,
    atkMultiplier: 2.3,
    defBonus: 4,
    speed: 1.1,
    description: 'The sacred, golden-clawed forest bear spirit of Finnish mythology.'
  },
  {
    name: 'Louhi, Mistress of Pohjola',
    type: EnemyType.Louhi,
    char: '🦅',
    color: '#c084fc',
    hpMultiplier: 3.8,
    atkMultiplier: 2.7,
    defBonus: 5,
    speed: 0.8,
    description: 'The shape-shifting, blizzard-weaving ruler of the Northlands in Finnish mythology.'
  },
  {
    name: 'Sunken Dread Kraken',
    type: EnemyType.Kraken,
    char: '🦑',
    color: '#0369a1',
    hpMultiplier: 3.7,
    atkMultiplier: 2.5,
    defBonus: 4,
    speed: 1.0,
    description: 'The abyssal sovereign of sunken coral ruins. Commands whirlpools, geysers, and crushes hulls.'
  },
  {
    name: 'Ignis the Caldera Wyrm',
    type: EnemyType.IgnisWyrm,
    char: '🐲',
    color: '#dc2626',
    hpMultiplier: 4.0,
    atkMultiplier: 2.8,
    defBonus: 6,
    speed: 0.9,
    description: 'A subterranean dragon slumbering beneath the volcanic caldera. Searing magma flows in its veins.'
  },
  {
    name: 'Frostfang the Glacial Titan',
    type: EnemyType.FrostfangTitan,
    char: '❄️',
    color: '#0284c7',
    hpMultiplier: 3.9,
    atkMultiplier: 2.6,
    defBonus: 6,
    speed: 1.0,
    description: 'An ancient primordial titan carved of glacial blue ice. Shivers the ground with freezing shockwaves.'
  }
];

export function calculateGlobalThreatFactor(
  depth: number,
  turnsPlayed: number,
  realTimeSeconds: number,
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number },
  currentWeapon?: { damage: number; name?: string } | null,
  defeatedEnemiesCount?: { [key: string]: number },
  clearedCampsCount?: number
): number {
  const timeHours = realTimeSeconds / 3600;
  const turnIntensity = turnsPlayed / 100;
  
  let baseThreatFactor = 1.0 + (depth - 1) * 0.32 + turnIntensity * 0.06 + timeHours * 0.3;

  let chaosMitigation = 0;
  if (defeatedEnemiesCount) {
    const bossesKilled = defeatedEnemiesCount['Bosses'] || 0;
    const standardKilled = defeatedEnemiesCount['Standard'] || 0;
    chaosMitigation += bossesKilled * 0.35;
    chaosMitigation += Math.floor(standardKilled / 10) * 0.05;
  }
  if (clearedCampsCount) {
    chaosMitigation += clearedCampsCount * 0.15;
  }

  baseThreatFactor = Math.max(0.70, baseThreatFactor - chaosMitigation);

  let playerScaleCoeff = 1.0;
  if (playerStats) {
    const pLevel = playerStats.level || 1;
    const totalStats = (playerStats.str || 10) + 
                        (playerStats.dex || 10) + 
                        (playerStats.int || 10) + 
                        (playerStats.cha || 10) + 
                        (playerStats.lck || 10);
    const statExcess = Math.max(0, totalStats - 50);
    const statBonusFactor = statExcess * 0.015;
    const levelBonusFactor = Math.max(0, pLevel - 1) * 0.08;
    playerScaleCoeff += levelBonusFactor + statBonusFactor;
  }
  
  if (currentWeapon) {
    const weaponVal = Math.max(0, currentWeapon.damage || 0);
    const weaponBonusFactor = weaponVal * 0.04;
    playerScaleCoeff += weaponBonusFactor;
  }

  return baseThreatFactor * playerScaleCoeff;
}

export function spawnDungeonBoss(
  rooms: Room[],
  depth: number,
  width: number,
  height: number,
  stairsX: number,
  stairsY: number,
  globalThreatFactor: number,
  chaosScore: number = 0,
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number }
): Enemy | null {
  const hasBoss = (depth === 1 && Math.random() < 0.35) || 
                  (depth >= 2 && depth < 6 && (depth % 2 === 0 || Math.random() < 0.65)) ||
                  (depth >= 6 && depth < 10 && (depth % 2 === 0 || Math.random() < 0.75)) ||
                  (depth === 10);

  if (!hasBoss || rooms.length < 2) return null;

  const lastRoom = rooms[rooms.length - 1];
  
  let bossTemplate = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];
  if (depth === 10) {
    bossTemplate = {
      name: 'Surtur the Magma Arch-demon',
      type: EnemyType.DreadKnight,
      char: '👿',
      color: '#ef4444',
      hpMultiplier: 4.2,
      atkMultiplier: 3.2,
      defBonus: 6,
      speed: 0.9,
      description: 'The ancient fire god ruling the molten core of the Underworld depths. His massive obsidian blade burns with infinite heat.'
    };
  }

  const template = getEnemyTemplate(bossTemplate.type);

  let bx = lastRoom.x + Math.floor(lastRoom.w / 2);
  let by = lastRoom.y + Math.floor(lastRoom.h / 2);

  if (bx === stairsX && by === stairsY) {
    if (lastRoom.h > 3) {
      by -= 1;
    } else if (lastRoom.w > 3) {
      bx -= 1;
    } else {
      by = Math.max(lastRoom.y, by - 1);
    }
  }

  if (bx >= 0 && bx < width && by >= 0 && by < height) {
    const bossHp = Math.floor(template.baseHp * globalThreatFactor * bossTemplate.hpMultiplier);
    const bossAtk = Math.max(2, Math.floor(template.baseAtk * Math.sqrt(globalThreatFactor) * bossTemplate.atkMultiplier));
    const bossDef = Math.floor(template.baseDef + (depth / 2) + bossTemplate.defBonus);

    const bossEnemyRaw: Enemy = {
      id: `boss_${depth}_${Date.now()}`,
      x: bx,
      y: by,
      type: bossTemplate.type,
      name: `👑 ${bossTemplate.name}`,
      hp: bossHp,
      maxHp: bossHp,
      atk: bossAtk,
      def: bossDef,
      range: template.range,
      speed: bossTemplate.speed,
      color: bossTemplate.color,
      char: bossTemplate.char,
      state: EnemyState.Chasing,
      isElite: true,
      isBoss: true,
      archetype: 'boss_apex',
      eliteEffect: 'Titan',
      patrolPath: [{ x: bx, y: by }],
      patrolIndex: 0,
      debuffs: []
    };

    return applyCombatArchetypeAndChaosScaling(
      bossEnemyRaw,
      chaosScore,
      playerStats || undefined,
      depth
    );
  }

  return null;
}

export function spawnDungeonStandardEnemies(
  rooms: Room[],
  depth: number,
  stairsX: number,
  stairsY: number,
  chests: { x: number; y: number }[],
  existingEnemies: Enemy[],
  globalThreatFactor: number,
  chaosScore: number = 0,
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number }
): Enemy[] {
  const enemies: Enemy[] = [...existingEnemies];
  let enemyId = 0;
  const roomsForChests = rooms.slice(1);

  roomsForChests.forEach((room) => {
    const spawnCount = Math.floor(Math.random() * 2) + 1 + (depth > 4 ? 1 : 0);
    for (let sc = 0; sc < spawnCount; sc++) {
      const ex = room.x + Math.floor(Math.random() * (room.w - 2)) + 1;
      const ey = room.y + Math.floor(Math.random() * (room.h - 2)) + 1;

      const onStairs = (ex === stairsX && ey === stairsY);
      const onChest = chests.some(c => c.x === ex && c.y === ey);
      const duplicated = enemies.some(e => e.x === ex && e.y === ey);

      if (!onStairs && !onChest && !duplicated) {
        const pool = [
          { type: EnemyType.Rat, weight: 20 },
          { type: EnemyType.Goblin, weight: 25 },
          { type: EnemyType.SkeletonMage, weight: 15 },
          { type: EnemyType.OrcBrute, weight: 12 },
          { type: EnemyType.Trapmaster, weight: 10 },
          { type: EnemyType.Slime, weight: 12 },
          { type: EnemyType.Spider, weight: 12 },
          { type: EnemyType.Ghost, weight: 8 },
          { type: EnemyType.Vampire, weight: 6 },
          { type: EnemyType.Necromancer, weight: 6 },
          { type: EnemyType.DreadKnight, weight: 5 },
          { type: EnemyType.Dragon, weight: 0 },
          { type: EnemyType.Hiisi, weight: 10 },
          { type: EnemyType.Nakki, weight: 10 },
        ];

        if (depth > 2) {
          const ratItem = pool.find(p => p.type === EnemyType.Rat);
          if (ratItem) ratItem.weight = Math.max(3, ratItem.weight - 12);

          const gobItem = pool.find(p => p.type === EnemyType.Goblin);
          if (gobItem) gobItem.weight = Math.max(8, gobItem.weight - 12);

          const vampireItem = pool.find(p => p.type === EnemyType.Vampire);
          if (vampireItem) vampireItem.weight += 10;

          const dreadItem = pool.find(p => p.type === EnemyType.DreadKnight);
          if (dreadItem) dreadItem.weight += 10;

          const necroItem = pool.find(p => p.type === EnemyType.Necromancer);
          if (necroItem) necroItem.weight += 8;

          const ghostItem = pool.find(p => p.type === EnemyType.Ghost);
          if (ghostItem) ghostItem.weight += 6;
        }

        if (depth >= 5) {
          const dragonItem = pool.find(p => p.type === EnemyType.Dragon);
          if (dragonItem) {
            dragonItem.weight = depth >= 8 ? 5 : 3;
          }
        }

        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let roll = Math.random() * totalWeight;
        let type = EnemyType.Rat;
        for (const item of pool) {
          roll -= item.weight;
          if (roll <= 0) {
            type = item.type;
            break;
          }
        }

        const template = getEnemyTemplate(type);
        let name = template.name;
        let baseHp = template.baseHp;
        let baseAtk = template.baseAtk;
        let baseDef = template.baseDef;
        let range = template.range;
        let speed = template.speed;
        let char = template.char;
        let color = template.color;

        const isEarlyGameDungeon = (depth < 2 && (playerStats?.level || 1) < 3);
        const isElite = !isEarlyGameDungeon && Math.random() < (0.10 + (globalThreatFactor - 1) * 0.12);
        let finalHp = Math.floor(baseHp * globalThreatFactor);
        let finalAtk = Math.max(1, Math.floor(baseAtk * Math.sqrt(globalThreatFactor)));
        let finalDef = Math.floor(baseDef + (depth / 2));
        let eliteEffect: string | undefined = undefined;

        if (isElite) {
          finalHp = Math.floor(finalHp * 1.8);
          finalAtk = Math.floor(finalAtk * 1.4);
          finalDef += 2;
          
          const perks = ['Noxious', 'Ignited', 'Regenerative', 'Stonewall', 'Scurrying'];
          const perk = perks[Math.floor(Math.random() * perks.length)];
          name = `★ ${perk} ${name} ★`;
          color = '#ef4444';
          eliteEffect = perk;
        }

        const roomCorners = [
          { x: room.x, y: room.y },
          { x: room.x + room.w - 1, y: room.y },
          { x: room.x + room.w - 1, y: room.y + room.h - 1 },
          { x: room.x, y: room.y + room.h - 1 },
        ];

        const baseEnemy: Enemy = {
          id: `enemy_${depth}_${enemyId++}`,
          x: ex,
          y: ey,
          type,
          name,
          hp: finalHp,
          maxHp: finalHp,
          atk: finalAtk,
          def: finalDef,
          range,
          speed,
          color,
          char,
          state: EnemyState.Patrolling,
          isElite,
          eliteEffect,
          patrolPath: roomCorners,
          patrolIndex: 0,
          debuffs: [],
        };

        const scaledEnemy = applyCombatArchetypeAndChaosScaling(
          baseEnemy,
          chaosScore,
          playerStats || undefined,
          depth
        );

        enemies.push(scaledEnemy);
      }
    }
  });

  return enemies;
}

export function spawnDungeonCaptivesAndJailers(
  map: TileType[][],
  rooms: Room[],
  depth: number,
  playerX: number,
  playerY: number,
  stairsX: number,
  stairsY: number,
  chests: { x: number; y: number }[],
  enemies: Enemy[]
): void {
  let captivesSpawned = 0;
  rooms.forEach((room) => {
    if (captivesSpawned >= 2) return;

    if (Math.random() < 0.25) {
      const cx = room.x + Math.floor(Math.random() * (room.w - 2)) + 1;
      const cy = room.y + Math.floor(Math.random() * (room.h - 2)) + 1;

      const onStairs = (cx === stairsX && cy === stairsY);
      const onChest = chests.some(c => c.x === cx && c.y === cy);
      const isPlayerSpawn = (cx === playerX && cy === playerY);
      const duplicated = enemies.some(e => e.x === cx && e.y === cy);

      if (!onStairs && !onChest && !isPlayerSpawn && !duplicated) {
        const names = ["Caged Cleric", "Captive Miner", "Imprisoned Peasant", "Locked-up Merchant", "Trapped Wanderer"];
        const chosenName = names[Math.floor(Math.random() * names.length)];
        const captiveHp = 12 + Math.floor(depth * 2);

        enemies.push({
          id: `captive_${depth}_${Date.now()}_${Math.random()}`,
          x: cx,
          y: cy,
          type: 'captive',
          name: `🔒 ${chosenName}`,
          hp: captiveHp,
          maxHp: captiveHp,
          atk: 3 + Math.floor(depth * 0.5),
          def: 1,
          range: 1,
          speed: 1,
          color: '#f59e0b',
          char: '⛓️',
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: cx, y: cy }],
          patrolIndex: 0,
          debuffs: [],
          isCaptive: true,
          isFreed: false
        } as any);

        const guardDirections = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        let guardsSpawned = 0;
        for (const dir of guardDirections) {
          if (guardsSpawned >= 2) break;
          const gx = cx + dir.dx;
          const gy = cy + dir.dy;
          if (gx >= room.x && gx < room.x + room.w && gy >= room.y && gy < room.y + room.h) {
            const onStairsGuard = (gx === stairsX && gy === stairsY);
            const onChestGuard = chests.some(c => c.x === gx && c.y === gy);
            const isPlayerSpawnGuard = (gx === playerX && gy === playerY);
            const duplicatedGuard = enemies.some(e => e.x === gx && e.y === gy);
            
            if (!onStairsGuard && !onChestGuard && !isPlayerSpawnGuard && !duplicatedGuard && map[gy][gx] === TileType.Floor) {
              const guardType = depth >= 4 ? EnemyType.OrcBrute : EnemyType.Goblin;
              const guardHp = 40 + depth * 12;
              enemies.push({
                id: `prisoner_guard_${depth}_${Date.now()}_${Math.random()}`,
                x: gx,
                y: gy,
                type: guardType,
                name: `🚨 Dungeon Jailer`,
                hp: guardHp,
                maxHp: guardHp,
                atk: 7 + Math.floor(depth * 1.5),
                def: 2 + Math.floor(depth * 0.5),
                range: 1,
                speed: 1.0,
                color: '#f87171',
                char: '⚔️',
                state: EnemyState.Patrolling,
                isElite: Math.random() < 0.25,
                patrolPath: [{ x: gx, y: gy }, { x: cx, y: cy }],
                patrolIndex: 0,
                debuffs: []
              } as any);
              guardsSpawned++;
            }
          }
        }

        captivesSpawned++;
      }
    }
  });
}

export function spawnFollowersOnLevelLoadByReset(
  enemiesArray: Enemy[],
  fList: Follower[],
  playerX: number,
  playerY: number,
  map: TileType[][],
  activeCompanionQuestsList?: any[]
): Enemy[] {
  const safeEnemies = enemiesArray || [];
  const filtered = safeEnemies.filter(e => !e?.isFollower || e?.id?.startsWith('wt_ally_'));
  const nextEnemies = [...filtered];
  
  const activeQuests = activeCompanionQuestsList || [];
  const activeQuestFollowerIds = activeQuests
    .filter((q: any) => q && q.durationTurns > 0)
    .map((q: any) => q.followerId);

  const safeFollowers = fList || [];
  const availableFollowers = safeFollowers.filter(fol => fol && !activeQuestFollowerIds.includes(fol.id));

  availableFollowers.forEach((fol) => {
    const spots = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];
    
    let spotX = playerX;
    let spotY = playerY;
    
    for (const s of spots) {
      const tx = playerX + s.dx;
      const ty = playerY + s.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (map[ty]?.[tx] === TileType.Floor || map[ty]?.[tx] === TileType.Grass || map[ty]?.[tx] === TileType.Path) {
          const occupied = nextEnemies.some(ne => ne.x === tx && ne.y === ty);
          if (!occupied) {
            spotX = tx;
            spotY = ty;
            break;
          }
        }
      }
    }

    const isCat = fol.archetypeId === 'cat' || fol.char === '🐈' || fol.char === '🐱' || ['Jekku', 'Pulla', 'Alli', 'Leevi'].some((c) => fol.name?.includes(c));
    const folChar = isCat ? '🐈' : (fol.char || (fol.role === 'Knight' ? '🛡️' : fol.role === 'Mage' ? '🧙' : '🏹'));
    const folColor = isCat ? (fol.color || '#fb923c') : (fol.color || (fol.role === 'Knight' ? '#60a5fa' : fol.role === 'Mage' ? '#c084fc' : '#facc15'));
    const folName = isCat ? (fol.name.startsWith('🐈') ? fol.name : `🐈 ${fol.name}`) : (fol.name.startsWith('🛡️') ? fol.name : `🛡️ ${fol.name} (${fol.role || 'Companion'})`);

    let folRange = 1;
    if (fol.equipment?.weapon?.range && fol.equipment.weapon.range > 1) {
      folRange = fol.equipment.weapon.range;
    } else if (['Bow', 'Crossbow'].includes(fol.equipment?.weapon?.subType as string)) {
      folRange = 4;
    } else if (['Staff', 'Wand'].includes(fol.equipment?.weapon?.subType as string)) {
      folRange = 3;
    } else if (fol.equipment?.weapon?.subType === 'Spear') {
      folRange = 2;
    } else if (['Mage', 'Archer', 'Ranger', 'Hunter', 'Crossbowman', 'Sorcerer'].includes(fol.role) || fol.archetypeId === 'thief') {
      folRange = (fol.role === 'Mage' || fol.role === 'Sorcerer') ? 3 : (['Archer', 'Ranger', 'Hunter', 'Crossbowman'].includes(fol.role) ? 4 : 2);
    }

    nextEnemies.push({
      id: `fol_${fol.id}_${Date.now()}`,
      x: spotX,
      y: spotY,
      type: EnemyType.Goblin,
      name: folName,
      hp: fol.hp,
      maxHp: fol.maxHp,
      atk: fol.atk,
      def: fol.def,
      range: folRange,
      speed: 1.0,
      char: folChar,
      color: folColor,
      state: EnemyState.Chasing,
      isElite: true,
      isFollower: true,
      followerId: fol.id,
      debuffs: [],
      patrolPath: [],
      patrolIndex: 0
    });
  });

  return nextEnemies;
}
