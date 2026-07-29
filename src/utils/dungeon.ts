/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Trap, TrapType, Chest, Enemy, EnemyType, EnemyState, CatalystType, Follower, DungeonProp, MaterialCategory } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from './itemsData';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from './gameUtils';
import enemyTemplates from '../data/enemies.json';

export function getEnemyTemplate(type: EnemyType | string) {
  if (type === 'captive') {
    return { name: 'Captive Villager', baseHp: 15, baseAtk: 0, baseDef: 0, range: 1, speed: 1.0, char: '👤', color: '#38bdf8' };
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

export const BOSS_TEMPLATES = [
  {
    name: 'Morgath the Voidbringer',
    type: EnemyType.SkeletonMage,
    char: '☠',
    color: '#c084fc', // Bright neon purple
    hpMultiplier: 4.8,
    atkMultiplier: 1.8,
    defBonus: 4,
    speed: 0.9,
    description: 'A terrifying giant skeleton mage channeling dark necrotic energies.'
  },
  {
    name: 'Grommash the Undying Troll',
    type: EnemyType.Troll,
    char: '👹',
    color: '#f43f5e', // Vibrant rose-red
    hpMultiplier: 5.6,
    atkMultiplier: 2.1,
    defBonus: 5,
    speed: 1.2, // Acts slower but stuns and regenerates hps
    description: 'A colossal cave beast with unfathomable stamina and brutal physical weight.'
  },
  {
    name: 'Warlord Krosh Skullbreaker',
    type: EnemyType.OrcBrute,
    char: '🧌',
    color: '#ea580c', // Dark orange
    hpMultiplier: 5.0,
    atkMultiplier: 2.3,
    defBonus: 5,
    speed: 1.1,
    description: 'A heavily plated orc carrying a massive stone hammer that shatters skulls.'
  },
  {
    name: 'King Scurry the Plague Swarm',
    type: EnemyType.Rat,
    char: '🐀',
    color: '#a3e635', // Poison green
    hpMultiplier: 4.2,
    atkMultiplier: 1.6,
    defBonus: 3,
    speed: 0.7, // Extremely quick
    description: 'An infected giant rodent that runs at blistering speeds and bites with toxic fangs.'
  },
  {
    name: 'Malakar the Phantom Trapsmith',
    type: EnemyType.Trapmaster,
    char: '🥷',
    color: '#ec4899', // Sparkly hot-pink
    hpMultiplier: 4.6,
    atkMultiplier: 1.9,
    defBonus: 4,
    speed: 0.8,
    description: 'A spectral rogue phantom weaving fires vents, darts, and spikes silently.'
  },
  {
    name: 'Lord Vladis Nocturna',
    type: EnemyType.Vampire,
    char: '🦇',
    color: '#e11d48', // Crimson Red
    hpMultiplier: 5.2,
    atkMultiplier: 2.0,
    defBonus: 4,
    speed: 0.8,
    description: 'The ancient sovereign of the crypts. He moves with dark velocity and siphons player vitality.'
  },
  {
    name: 'Viscous Goliath the Great Slime',
    type: EnemyType.Slime,
    char: '🦠',
    color: '#10b981', // Acid green
    hpMultiplier: 6.0,
    atkMultiplier: 1.5,
    defBonus: 6,
    speed: 1.3,
    description: 'A titanic, pulsating gelatinous mass that digests weapon armor and splits on heavy impacts.'
  },
  {
    name: 'Broodmother Arachnia',
    type: EnemyType.Spider,
    char: '🕷️',
    color: '#f59e0b', // Amber yellow
    hpMultiplier: 4.5,
    atkMultiplier: 1.9,
    defBonus: 3,
    speed: 0.8,
    description: 'A colossal multi-legged weaver that spews paralyzing web traps and injects necrotoxins.'
  },
  {
    name: 'Archlich Kel\'Thuzar',
    type: EnemyType.Necromancer,
    char: '🔮',
    color: '#8b5cf6', // Indigo violet
    hpMultiplier: 4.8,
    atkMultiplier: 2.2,
    defBonus: 4,
    speed: 1.0,
    description: 'The eternal lord of the undead who resurrects fallen skeletons and controls frost rituals.'
  },
  {
    name: 'Sir Kaelen the Black Warden',
    type: EnemyType.DreadKnight,
    char: '🛡️',
    color: '#475569', // Steel slate
    hpMultiplier: 5.8,
    atkMultiplier: 1.8,
    defBonus: 8,
    speed: 1.2,
    description: 'A fallen, obsidian-plated guardian wielding a cursed broadsword and utilizing unbreakable iron guards.'
  },
  {
    name: 'Ignis the Elder Fire Dragon',
    type: EnemyType.Dragon,
    char: '🐉',
    color: '#f97316', // Fiery orange
    hpMultiplier: 7.2,
    atkMultiplier: 2.6,
    defBonus: 7,
    speed: 1.1,
    description: 'An ancient volcanic dragon of legendary power. Its scales are harder than steel and its breath incinerates stone.'
  },
  {
    name: 'The Echo of Sunder',
    type: EnemyType.Ghost,
    char: '👻',
    color: '#6366f1', // Cool purple-blue
    hpMultiplier: 4.0,
    atkMultiplier: 1.7,
    defBonus: 7,
    speed: 0.9,
    description: 'A weeping translucent apparition that drifts through solid barriers, phasing through standard armor.'
  },
  {
    name: 'Iku-Turso Eternal Leviathan',
    type: EnemyType.IkuTurso,
    char: '🦑',
    color: '#0ea5e9',
    hpMultiplier: 6.8,
    atkMultiplier: 2.5,
    defBonus: 7,
    speed: 1.0,
    description: 'An ancient, terrifying kraken of Finnish lore rising from watery abysses.'
  },
  {
    name: 'Kalma Grave Goddess',
    type: EnemyType.Kalma,
    char: '💀',
    color: '#a855f7',
    hpMultiplier: 5.0,
    atkMultiplier: 2.1,
    defBonus: 5,
    speed: 0.9,
    description: 'The Finnish goddess of death and sweet decay. Haunts graves and casts lethal curses.'
  },
  {
    name: 'Otso the Honey-Paw Bear Spirit',
    type: EnemyType.Otso,
    char: '🐻',
    color: '#b45309',
    hpMultiplier: 6.5,
    atkMultiplier: 2.3,
    defBonus: 6,
    speed: 1.1,
    description: 'The sacred, golden-clawed forest bear spirit of Finnish mythology.'
  },
  {
    name: 'Louhi, Mistress of Pohjola',
    type: EnemyType.Louhi,
    char: '🦅',
    color: '#c084fc',
    hpMultiplier: 7.0,
    atkMultiplier: 2.7,
    defBonus: 8,
    speed: 0.8,
    description: 'The shape-shifting, blizzard-weaving ruler of the Northlands in Finnish mythology.'
  }
];

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function generateLevel(
  width: number,
  height: number,
  depth: number,
  turnsPlayed: number,
  realTimeSeconds: number,
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number },
  currentWeapon?: { damage: number; name?: string } | null,
  defeatedEnemiesCount?: { [key: string]: number },
  clearedCampsCount?: number
): {
  map: TileType[][];
  playerX: number;
  playerY: number;
  traps: Trap[];
  chests: Chest[];
  enemies: Enemy[];
} {
  const map: TileType[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(TileType.Wall));

  const rooms: Room[] = [];
  const minRoomSize = 4;
  const maxRoomSize = 9;
  const maxRoomsNum = 12;

  // 1. Generate Rectangular Rooms
  for (let i = 0; i < maxRoomsNum; i++) {
    const rx = Math.floor(Math.random() * (width - maxRoomSize - 2)) + 1;
    const ry = Math.floor(Math.random() * (height - maxRoomSize - 2)) + 1;
    const rw = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const rh = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;

    const newRoom: Room = { x: rx, y: ry, w: rw, h: rh };

    // Check overlap
    let overlap = false;
    for (const r of rooms) {
      if (
        newRoom.x < r.x + r.w + 1 &&
        newRoom.x + newRoom.w + 1 > r.x &&
        newRoom.y < r.y + r.h + 1 &&
        newRoom.y + newRoom.h + 1 > r.y
      ) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      rooms.push(newRoom);
      // Carve out floor
      for (let y = newRoom.y; y < newRoom.y + newRoom.h; y++) {
        for (let x = newRoom.x; x < newRoom.x + newRoom.w; x++) {
          map[y][x] = TileType.Floor;
        }
      }
    }
  }

  // Helper to connect points
  function carveCorridor(x1: number, y1: number, x2: number, y2: number) {
    // Carve horizontal then vertical
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    for (let x = startX; x <= endX; x++) {
      if (map[y1][x] === TileType.Wall) map[y1][x] = TileType.Floor;
    }

    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    for (let y = startY; y <= endY; y++) {
      if (map[y][x2] === TileType.Wall) map[y][x2] = TileType.Floor;
    }
  }

  // 2. Connect Rooms
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];
    const c1 = { x: Math.floor(r1.x + r1.w / 2), y: Math.floor(r1.y + r1.h / 2) };
    const c2 = { x: Math.floor(r2.x + r2.w / 2), y: Math.floor(r2.y + r2.h / 2) };
    carveCorridor(c1.x, c1.y, c2.x, c2.y);
  }

  // 3. Set Doors
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TileType.Floor) {
        // Simple door placement heuristic: Corridor-room intersection bounded by side-walls
        const horizontalWall = map[y][x - 1] === TileType.Wall && map[y][x + 1] === TileType.Wall;
        const verticalFloor = map[y - 1][x] === TileType.Floor && map[y + 1][x] === TileType.Floor;

        const verticalWall = map[y - 1][x] === TileType.Wall && map[y + 1][x] === TileType.Wall;
        const horizontalFloor = map[y][x - 1] === TileType.Floor && map[y][x + 1] === TileType.Floor;

        if ((horizontalWall && verticalFloor) || (verticalWall && horizontalFloor)) {
          if (Math.random() < 0.28) {
            map[y][x] = TileType.Door;
          }
        }
      }
    }
  }

  // 4. Place Player in first room
  const playerX = Math.floor(rooms[0].x + rooms[0].w / 2);
  const playerY = Math.floor(rooms[0].y + rooms[0].h / 2);
  map[playerY][playerX] = TileType.StairsUp;

  // 5. Place Stairs Down in the last room
  const lastRoom = rooms[rooms.length - 1];
  const stairsX = Math.floor(lastRoom.x + lastRoom.w / 2);
  const stairsY = Math.floor(lastRoom.y + lastRoom.h / 2);
  map[stairsY][stairsX] = TileType.StairsDown;

  // 5.5. Place Torches and Cozy Fireplaces in rooms
  rooms.forEach((room, index) => {
    // Put a Cozy Fireplace in some room centers (e.g. index 1 or 3 or 5)
    if ((index === 1 || index === 3 || index === 5) && index < rooms.length - 1) {
      const fx = Math.floor(room.x + room.w / 2);
      const fy = Math.floor(room.y + room.h / 2);
      if (map[fy][fx] === TileType.Floor && !(fx === playerX && fy === playerY) && !(fx === stairsX && fy === stairsY)) {
        map[fy][fx] = TileType.Fireplace;
      }
    }
    // Put torches in corners to create scenic dungeon lights
    const corners = [
      { x: room.x, y: room.y },
      { x: room.x + room.w - 1, y: room.y },
      { x: room.x, y: room.y + room.h - 1 },
      { x: room.x + room.w - 1, y: room.y + room.h - 1 }
    ];
    corners.forEach((pt) => {
      if (map[pt.y][pt.x] === TileType.Floor && !(pt.x === playerX && pt.y === playerY) && !(pt.x === stairsX && pt.y === stairsY)) {
        map[pt.y][pt.x] = TileType.Torch;
      }
    });
  });

  // 5.8. Underworld Lava Pools (depth >= 6)
  if (depth >= 6) {
    rooms.forEach((room) => {
      if (Math.random() < 0.45) {
        const lavaW = Math.floor(Math.random() * 2) + 2;
        const lavaH = Math.floor(Math.random() * 2) + 1;
        const lx = room.x + Math.floor(Math.random() * (room.w - lavaW - 1)) + 1;
        const ly = room.y + Math.floor(Math.random() * (room.h - lavaH - 1)) + 1;
        for (let y = ly; y < ly + lavaH; y++) {
          for (let x = lx; x < lx + lavaW; x++) {
            if (map[y] && map[y][x] === TileType.Floor && !(x === playerX && y === playerY) && !(x === stairsX && y === stairsY)) {
              map[y][x] = TileType.Water; // In underworld, Water is styled/treated as Lava!
            }
          }
        }
      }
    });
  }

  // 6. Spawn Traps
  const traps: Trap[] = [];
  const trapRate = 0.08; // Probability of placing traps in corridors or rooms
  let idCounter = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TileType.Floor && !(x === playerX && y === playerY) && !(x === stairsX && y === stairsY)) {
        // Don't spawn trap right next to stairs or doorway
        if (Math.random() < trapRate) {
          // Identify trap types
          const rand = Math.random();
          let trapType = TrapType.Spikes;
          if (rand > 0.66) trapType = TrapType.FireVent;
          else if (rand > 0.33) trapType = TrapType.PoisonGas;

          traps.push({
            id: `trap_${depth}_${idCounter++}`,
            x,
            y,
            type: trapType,
            isActive: trapType !== TrapType.FireVent ? true : Math.random() > 0.5,
            triggered: false,
            hidden: true,
            detected: false,
          });
        }
      }
    }
  }

  // 7. Spawn Chests
  const chests: Chest[] = [];
  const roomsForChests = rooms.slice(1); // avoid spawning chest in player start room
  roomsForChests.forEach((room, index) => {
    if (Math.random() < 0.65) {
      // Find a corner or empty space
      const cx = room.x + Math.floor(Math.random() * (room.w - 2)) + 1;
      const cy = room.y + Math.floor(Math.random() * (room.h - 2)) + 1;

      if (!(cx === stairsX && cy === stairsY)) {
        // Loot distribution
        const chestGold = Math.floor(Math.random() * 15) + 5 + depth * 3;
        const materialsInside: string[] = [];
        const catalystsInside: string[] = [];

        // Chance of materials depending on tier
        const matCount = Math.random() < 0.3 ? 1 : Math.random() < 0.82 ? 2 : 3;
        for (let m = 0; m < matCount; m++) {
          const depthWeight = Math.random() + (depth * 0.1);
          let candidates = BASIC_MATERIALS;
          if (depthWeight > 1.2) {
            candidates = BASIC_MATERIALS.filter((mat) => (mat.category as string) === 'Tier3' || mat.category === MaterialCategory.Tier3);
          } else if (depthWeight > 0.6) {
            candidates = BASIC_MATERIALS.filter((mat) => (mat.category as string) === 'Tier2' || mat.category === MaterialCategory.Tier2);
          } else {
            candidates = BASIC_MATERIALS.filter((mat) => (mat.category as string) === 'Tier1' || mat.category === MaterialCategory.Tier1);
          }
          if (!candidates || candidates.length === 0) {
            candidates = BASIC_MATERIALS;
          }
          if (candidates && candidates.length > 0) {
            const rolledMat = candidates[Math.floor(Math.random() * candidates.length)];
            if (rolledMat && rolledMat.id) {
              materialsInside.push(rolledMat.id);
            }
          }
        }

        // Chance of crystal catalyst
        if (Math.random() < 0.55 && ELEMENTAL_CATALYSTS && ELEMENTAL_CATALYSTS.length > 0) {
          const rolledCat = ELEMENTAL_CATALYSTS[Math.floor(Math.random() * ELEMENTAL_CATALYSTS.length)];
          if (rolledCat && rolledCat.id) {
            catalystsInside.push(rolledCat.id);
          }
        }

        chests.push({
          id: `chest_${depth}_${index}`,
          x: cx,
          y: cy,
          isOpened: false,
          materials: materialsInside,
          catalysts: catalystsInside,
          gold: chestGold,
        });
      }
    }
  });

  // 8. Spawn Enemies with scaling threat factors
  const enemies: Enemy[] = [];
  let enemyId = 0;

  // Real scalable challenge formula
  // Challenge increases because depth increases AND because player spends time in the dungeon.
  // We compute a Threat Tier factor:
  const timeHours = realTimeSeconds / 3600;
  const turnIntensity = turnsPlayed / 100; // escalated threat every 100 turns
  
  // Balanced base game difficulty scaling! (Reduced depth factor to 0.32, turnIntensity to 0.06, timeHours to 0.3)
  let baseThreatFactor = 1.0 + (depth - 1) * 0.32 + turnIntensity * 0.06 + timeHours * 0.3;

  // Active player-driven Chaos suppression/mitigation!
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

  // Apply active suppression to lower the base threat level, keeping a floor of 0.70x
  baseThreatFactor = Math.max(0.70, baseThreatFactor - chaosMitigation);

  // Dynamic scaling: Scale enemy difficulty based on player stats and currently equipped weapon
  let playerScaleCoeff = 1.0;
  if (playerStats) {
    const pLevel = playerStats.level || 1;
    const totalStats = (playerStats.str || 10) + 
                        (playerStats.dex || 10) + 
                        (playerStats.int || 10) + 
                        (playerStats.cha || 10) + 
                        (playerStats.lck || 10);
    const statExcess = Math.max(0, totalStats - 50);
    const statBonusFactor = statExcess * 0.015; // +1.5% difficulty per allocated stat point above base 50 (down from 5%)
    const levelBonusFactor = Math.max(0, pLevel - 1) * 0.08; // +8% difficulty per level above level 1 (down from 25%)
    playerScaleCoeff += levelBonusFactor + statBonusFactor;
  }
  
  if (currentWeapon) {
    const weaponVal = Math.max(0, currentWeapon.damage || 0);
    const weaponBonusFactor = weaponVal * 0.04; // +4% difficulty per point of weapon damage (down from 15%)
    playerScaleCoeff += weaponBonusFactor;
  }

  const globalThreatFactor = baseThreatFactor * playerScaleCoeff;

  // Spasmodic custom BOSS spawning: check on level entry (some levels under roll or depth % 3 === 0)
  // Higher BOSS spawn rate in deep runs!
  const hasBoss = (depth === 1 && Math.random() < 0.35) || 
                  (depth >= 2 && depth < 6 && (depth % 2 === 0 || Math.random() < 0.65)) ||
                  (depth >= 6 && depth < 10 && (depth % 2 === 0 || Math.random() < 0.75)) ||
                  (depth === 10);

  if (hasBoss && rooms.length >= 2) {
    const lastRoom = rooms[rooms.length - 1];
    
    // Choose template, default to BOSS_TEMPLATES or custom Surtur at Depth 10
    let bossTemplate = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];
    if (depth === 10) {
      bossTemplate = {
        name: 'Surtur the Magma Arch-demon',
        type: EnemyType.DreadKnight,
        char: '👿',
        color: '#ef4444', // Fiery Red
        hpMultiplier: 8.5,
        atkMultiplier: 3.2,
        defBonus: 10,
        speed: 0.9,
        description: 'The ancient fire god ruling the molten core of the Underworld depths. His massive obsidian blade burns with infinite heat.'
      };
    }

    const template = getEnemyTemplate(bossTemplate.type);

    let bx = lastRoom.x + Math.floor(lastRoom.w / 2);
    let by = lastRoom.y + Math.floor(lastRoom.h / 2);

    // Make sure it doesn't overlap exactly on the exit stairs
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

      const bossEnemy: Enemy = {
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
        eliteEffect: 'Titan',
        patrolPath: [{ x: bx, y: by }],
        patrolIndex: 0,
        debuffs: []
      };

      enemies.push(bossEnemy);
    }
  }

  roomsForChests.forEach((room) => {
    // Spawns 1 to 3 enemies per room depending on room size and threat
    const spawnCount = Math.floor(Math.random() * 2) + 1 + (depth > 4 ? 1 : 0);
    for (let sc = 0; sc < spawnCount; sc++) {
      const ex = room.x + Math.floor(Math.random() * (room.w - 2)) + 1;
      const ey = room.y + Math.floor(Math.random() * (room.h - 2)) + 1;

      // Ensure no collision with player, other enemies, chest, or stairs
      const onStairs = (ex === stairsX && ey === stairsY);
      const onChest = chests.some(c => c.x === ex && c.y === ey);
      const duplicated = enemies.some(e => e.x === ex && e.y === ey);

      if (!onStairs && !onChest && !duplicated) {
        // Roll Enemy Type using a dynamic weighted pool that adapts to dungeon depth
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

        // Adjust weights dynamically based on dungeon depth
        if (depth > 2) {
          // Deeper dungeons feature fewer basic pests and more formidable threats
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

        // Apply dynamic escalations and difficulty tiers
        const isElite = Math.random() < (0.10 + (globalThreatFactor - 1) * 0.12);
        let finalHp = Math.floor(baseHp * globalThreatFactor);
        let finalAtk = Math.max(1, Math.floor(baseAtk * Math.sqrt(globalThreatFactor)));
        let finalDef = Math.floor(baseDef + (depth / 2));
        let eliteEffect: string | undefined = undefined;

        if (isElite) {
          finalHp = Math.floor(finalHp * 1.8);
          finalAtk = Math.floor(finalAtk * 1.4);
          finalDef += 2;
          
          // Allocate randomized elite status perk
          const perks = ['Noxious', 'Ignited', 'Regenerative', 'Stonewall', 'Scurrying'];
          const perk = perks[Math.floor(Math.random() * perks.length)];
          name = `★ ${perk} ${name} ★`;
          color = '#ef4444'; // Radiant danger red
          eliteEffect = perk;
        }

        // Patrol paths around the room
        const roomCorners = [
          { x: room.x, y: room.y },
          { x: room.x + room.w - 1, y: room.y },
          { x: room.x + room.w - 1, y: room.y + room.h - 1 },
          { x: room.x, y: room.y + room.h - 1 },
        ];

        enemies.push({
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
        });
      }
    }
  });

  // 9. Spawn captives in rooms
  let captivesSpawned = 0;
  rooms.forEach((room) => {
    // limit max 2 captives per floor
    if (captivesSpawned >= 2) return;

    if (Math.random() < 0.25) {
      const cx = room.x + Math.floor(Math.random() * (room.w - 2)) + 1;
      const cy = room.y + Math.floor(Math.random() * (room.h - 2)) + 1;

      // Ensure no collision with player, stairs, chest, or other enemies
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
          atk: 3 + Math.floor(depth * 0.5), // pretty weak, but gets stronger with depth
          def: 1,
          range: 1,
          speed: 1,
          color: '#f59e0b', // warm lock / amber color
          char: '⛓️', // lock / chain cage representation
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: cx, y: cy }],
          patrolIndex: 0,
          debuffs: [],
          isCaptive: true,
          isFreed: false
        } as any);

        // Spawn 1 or 2 prison guards near the captive
        const guardDirections = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        let guardsSpawned = 0;
        for (const dir of guardDirections) {
          if (guardsSpawned >= 2) break; // limit to 2 guards max
          const gx = cx + dir.dx;
          const gy = cy + dir.dy;
          // Verify guard is inside room bounds and not on existing blockades
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
                color: '#f87171', // Red color for jailer
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

  return {
    map,
    playerX,
    playerY,
    traps,
    chests,
    enemies,
  };
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
      range: fol.role === 'Mage' ? 3 : 1,
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

export function generateDungeonProps(map: TileType[][], depth: number): DungeonProp[] {
  const propsList: DungeonProp[] = [];
  const height = map.length;
  const width = map[0]?.length || 0;

  const PROP_TEMPLATES = [
    { char: '☠', name: 'Pile of Bones', color: '#cbd5e1', description: 'Bleached mortal remains scattered in dust.' },
    { char: '🕸', name: 'Cobweb', color: '#64748b', description: 'Stretched ancient cobweb covering stone structures.' },
    { char: '⌸', name: 'Broken Barrel', color: '#78350f', description: 'A crushed wooden frame with rusted trim.' },
    { char: 'π', name: 'Ancient Column', color: '#94a3b8', description: 'A cracked stone pillar of forgotten craftsmanship.' },
    { char: '⎖', name: 'Iron Shackle', color: '#64748b', description: 'Heavy prison bolts anchored to damp floors.' },
    { char: '⎗', name: 'Stained Altar', color: '#b91c1c', description: 'A blackened granite stone carved with sacrificial runes.' }
  ];

  const SHRINE_TEMPLATES = [
    {
      id_prefix: 'forbidden_strength',
      char: '⛧',
      name: 'Shrine of Forbidden Strength',
      color: '#f87171',
      description: 'An obsidian pillar carved with bleeding runes. Pray to gain permanent +4 Strength, but suffer -15 HP and receive the Curse of Vulnerability (-5 Defense for 40 turns).'
    },
    {
      id_prefix: 'blind_oracle',
      char: '🔮',
      name: 'Shrine of the Blind Oracle',
      color: '#c084fc',
      description: 'A swirling void of deep cosmic purple. Touch to fully reveal the floor map and gain permanent +3 Intellect, but suffer Cursed Sight (-5 Attack and -15% Crit Chance for 45 turns).'
    },
    {
      id_prefix: 'blood_transfusion',
      char: '🧪',
      name: 'Shrine of Blood Transfusion',
      color: '#34d399',
      description: 'A bubbling font of dark jade ley-water. Offer blood to gain permanent +12 Max MP (mana is fully restored), but instantly drain -15 HP.'
    },
    {
      id_prefix: 'covetous_greed',
      char: '🏺',
      name: 'Altar of the Covetous Greed',
      color: '#facc15',
      description: 'A glowing brass urn of endless wealth. Claims a toll on your armor to grant +250 Gold instantly, but inflicts Cursed Weight (-2 Strength and -2 Dexterity for 30 turns).'
    },
    {
      id_prefix: 'reckless_berserker',
      char: '⚔️',
      name: 'Shrine of the Reckless Berserker',
      color: '#fb923c',
      description: 'A blood-spattered anvil of combat rage. Pray to permanently gain +15% Critical Strike Chance, but permanently sacrifices -20 Max HP.'
    },
    {
      id_prefix: 'chrono_shift',
      char: '🌀',
      name: 'Altar of the Chrono-Shift',
      color: '#60a5fa',
      description: 'A twisting sapphire temporal vortex. Pray to permanently gain +3 Dexterity, but suffer +30 physical exhaustion points immediately.'
    }
  ];

  // 1. Generate 12-20 decorative props
  const count = 12 + Math.floor(Math.random() * 9); // 12-20 props
  let attempts = 0;
  
  for (let i = 0; i < count && attempts < 1500; i++) {
    attempts++;
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    if (map[ry]?.[rx] === TileType.Floor) {
      const dup = propsList.some(p => p.x === rx && p.y === ry);
      if (!dup) {
        const t = PROP_TEMPLATES[Math.floor(Math.random() * PROP_TEMPLATES.length)];
        propsList.push({
          id: `d_prop_${Date.now()}_${Math.random()}`,
          x: rx,
          y: ry,
          char: t.char,
          name: t.name,
          color: t.color,
          description: t.description
        });
      }
    }
  }

  // 2. Ensure exactly 2 unique double-edged shrines per dungeon floor
  const shuffledShrines = [...SHRINE_TEMPLATES].sort(() => 0.5 - Math.random());
  const shrinesToSpawn = shuffledShrines.slice(0, 2);

  let shrinesSpawned = 0;
  let shrineAttempts = 0;
  while (shrinesSpawned < shrinesToSpawn.length && shrineAttempts < 1000) {
    shrineAttempts++;
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    if (map[ry]?.[rx] === TileType.Floor) {
      const dup = propsList.some(p => p.x === rx && p.y === ry);
      if (!dup) {
        const s = shrinesToSpawn[shrinesSpawned];
        propsList.push({
          id: `d_shrine_${s.id_prefix}_${Date.now()}_${Math.random()}`,
          x: rx,
          y: ry,
          char: s.char,
          name: s.name,
          color: s.color,
          description: s.description
        });
        shrinesSpawned++;
      }
    }
  }

  return propsList;
}
