/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Chest, Enemy, EnemyState, EnemyType, WatchtowerState, BiomeType } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../utils/itemsData';
import { POI_BLUEPRINTS, getPOIBlueprint } from '../data/worldHistory';
import { ensureEntranceClearance, connectPoiSpokeToTrail } from './organic/roadNetworkGen';

export function generateWatchtowerPOI(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  prng: (x: number, y: number, seed?: number) => number,
  chests: Chest[],
  enemies: Enemy[],
  width: number = 48,
  height: number = 32
): WatchtowerState {
  const wtX = 20;
  const wtY = 10;
  const wtW = 9;
  const wtH = 9;

  const grid = [
    "WWSWWSWWW",
    "WKKKKKKKW",
    "SK.X.X.KS",
    "WK.....KW",
    "WK..F..KW",
    "WK.....KW",
    "SK.X.X.KS",
    "WKKKKKKKW",
    "WWWW+WWWW"
  ];

  const legend: Record<string, TileType> = {
    "W": TileType.WatchtowerWall,
    "S": TileType.WatchtowerSlit,
    "K": TileType.WatchtowerDeck,
    "F": TileType.WatchtowerFlag,
    "X": TileType.WatchtowerBarricade,
    ".": TileType.Floor,
    "+": TileType.Door
  };

  // Carve onto map
  for (let y = 0; y < wtH; y++) {
    const rowStr = grid[y];
    for (let x = 0; x < wtW; x++) {
      const char = rowStr[x];
      const tileType = legend[char];
      if (tileType) {
        map[wtY + y][wtX + x] = tileType;
      }
    }
  }

  // Clear entrance clearance runway outward from watchtower gate & connect road spoke
  ensureEntranceClearance(map, wtX + 4, wtY + 8, width, height, 'south');
  connectPoiSpokeToTrail(map, wtX + 4, wtY + 9, width, height, true);

  // Initial Faction Owner
  const initialFaction = chunkX > 0 ? 'vanguard' : (chunkX < 0 ? 'syndicate' : 'neutral');

  const watchtower: WatchtowerState = {
    id: `watchtower_${chunkX}_${chunkY}`,
    chunkX,
    chunkY,
    x: wtX,
    y: wtY,
    width: wtW,
    height: wtH,
    controller: initialFaction,
    isClaimed: false,
    claimPercent: 0,
    garrisonDefeated: false,
    taxGoldAccumulated: 0,
    lastTaxTimeMinutes: 0
  };

  // Faction Tribute Chest inside the tower at (wtX + 4, wtY + 5)
  chests.push({
    id: `tribute_chest_${chunkX}_${chunkY}`,
    x: wtX + 4,
    y: wtY + 5,
    isOpened: false,
    materials: ['mat_mithril', 'mat_steel', 'mat_obsidian'],
    catalysts: ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'],
    gold: 250,
    isLocked: true,
    keyRequired: 'mat_watchtower_key'
  });

  // Spawn Sentinel Garrison
  const commanderId = `wt_commander_${chunkX}_${chunkY}`;
  enemies.push({
    id: commanderId,
    x: wtX + 4,
    y: wtY + 3,
    type: EnemyType.DreadKnight,
    name: initialFaction === 'vanguard' ? '👑 Vanguard Watchtower Commander' : (initialFaction === 'syndicate' ? '👑 Syndicate Watchtower Overlord' : '👑 Renegade Outpost Commander'),
    hp: 240,
    maxHp: 240,
    atk: 15,
    def: 7,
    range: 1,
    speed: 1.0,
    color: initialFaction === 'vanguard' ? '#38bdf8' : (initialFaction === 'syndicate' ? '#c084fc' : '#cbd5e1'),
    char: '👑',
    state: EnemyState.Patrolling,
    isBoss: true,
    isElite: true,
    difficultyTier: 'apex',
    patrolPath: [{ x: wtX + 4, y: wtY + 3 }],
    patrolIndex: 0,
    debuffs: []
  });

  const guardType = initialFaction === 'vanguard' ? 'Vanguard Watchtower Knight' : (initialFaction === 'syndicate' ? 'Syndicate Watchtower Enforcer' : 'Renegade Raider');
  const guardColor = initialFaction === 'vanguard' ? '#60a5fa' : (initialFaction === 'syndicate' ? '#a78bfa' : '#94a3b8');

  enemies.push({
    id: `wt_knight1_${chunkX}_${chunkY}`,
    x: wtX + 2,
    y: wtY + 4,
    type: EnemyType.OrcBrute,
    name: guardType,
    hp: 110,
    maxHp: 110,
    atk: 9,
    def: 4,
    range: 1,
    speed: 1.0,
    color: guardColor,
    char: '🛡',
    state: EnemyState.Patrolling,
    isElite: true,
    difficultyTier: 'tough',
    patrolPath: [{ x: wtX + 2, y: wtY + 4 }],
    patrolIndex: 0,
    debuffs: []
  });

  enemies.push({
    id: `wt_knight2_${chunkX}_${chunkY}`,
    x: wtX + 6,
    y: wtY + 4,
    type: EnemyType.OrcBrute,
    name: guardType,
    hp: 110,
    maxHp: 110,
    atk: 9,
    def: 4,
    range: 1,
    speed: 1.0,
    color: guardColor,
    char: '🛡',
    state: EnemyState.Patrolling,
    isElite: true,
    difficultyTier: 'tough',
    patrolPath: [{ x: wtX + 6, y: wtY + 4 }],
    patrolIndex: 0,
    debuffs: []
  });

  const rangerType = initialFaction === 'vanguard' ? 'Vanguard Sentinel Archer' : (initialFaction === 'syndicate' ? 'Syndicate Sentinel Ranger' : 'Renegade Ranger');
  const rangerColor = initialFaction === 'vanguard' ? '#93c5fd' : (initialFaction === 'syndicate' ? '#c4b5fd' : '#cbd5e1');

  const rangerSpots = [
    { x: wtX + 2, y: wtY + 1 },
    { x: wtX + 6, y: wtY + 1 },
    { x: wtX + 4, y: wtY + 2 }
  ];

  rangerSpots.forEach((spot, index) => {
    enemies.push({
      id: `wt_ranger_${index}_${chunkX}_${chunkY}`,
      x: spot.x,
      y: spot.y,
      type: EnemyType.SkeletonMage,
      name: rangerType,
      hp: 65,
      maxHp: 65,
      atk: 6,
      def: 1,
      range: 5,
      speed: 1.0,
      color: rangerColor,
      char: '🏹',
      state: EnemyState.Patrolling,
      isElite: false,
      difficultyTier: 'tough',
      patrolPath: [{ x: spot.x, y: spot.y }],
      patrolIndex: 0,
      debuffs: []
    });
  });

  return watchtower;
}

export function generateRuinsPOI(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  biome: string,
  width: number,
  height: number,
  prng: (x: number, y: number, seed?: number) => number,
  chests: Chest[],
  enemies: Enemy[]
) {
  const ruinsX = Math.floor(prng(chunkX, chunkY, 151) * (width - 15)) + 4;
  const ruinsY = Math.floor(prng(chunkX, chunkY, 152) * (height - 11)) + 3;
  const ruinsW = 5;
  const ruinsH = 4;

  let canPlaceRuins = true;
  for (let dy = 0; dy < ruinsH; dy++) {
    for (let dx = 0; dx < ruinsW; dx++) {
      const tx = ruinsX + dx;
      const ty = ruinsY + dy;
      if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
        if (map[ty][tx] === TileType.Water || map[ty][tx] === TileType.Path || map[ty][tx] === TileType.DungeonEntrance || map[ty][tx] === TileType.Door) {
          canPlaceRuins = false;
        }
      } else {
        canPlaceRuins = false;
      }
    }
  }

  if (canPlaceRuins) {
    for (let ry = ruinsY; ry < ruinsY + ruinsH; ry++) {
      for (let rx = ruinsX; rx < ruinsX + ruinsW; rx++) {
        if (ry === ruinsY || ry === ruinsY + ruinsH - 1 || rx === ruinsX || rx === ruinsX + ruinsW - 1) {
          if (prng(rx, ry, 153) > 0.35) {
            map[ry][rx] = TileType.Wall;
          } else {
            map[ry][rx] = TileType.Floor;
          }
        } else {
          map[ry][rx] = TileType.Floor;
        }
      }
    }

    map[ruinsY + 1][ruinsX + 1] = TileType.Table;
    map[ruinsY + 2][ruinsX + 1] = TileType.Chair;

    const luxX = ruinsX + Math.floor(ruinsW / 2);
    const luxY = ruinsY + Math.floor(ruinsH / 2);
    map[luxY][luxX] = TileType.Floor;

    chests.push({
      id: `ruined_chest_${chunkX}_${chunkY}`,
      x: luxX,
      y: luxY,
      isOpened: false,
      materials: [BASIC_MATERIALS[0].id, BASIC_MATERIALS[1].id, BASIC_MATERIALS[Math.floor(prng(chunkX, chunkY, 154) * BASIC_MATERIALS.length)].id],
      catalysts: [ELEMENTAL_CATALYSTS[Math.floor(prng(chunkX, chunkY, 155) * ELEMENTAL_CATALYSTS.length)].id],
      gold: Math.floor(prng(chunkX, chunkY, 156) * 50) + 50
    });

    let bossName = "Sylvanus, the Verdant Behemoth";
    let bossChar = "🌳";
    let bossColor = "#22c55e";
    let bossHp = 350;
    let bossAtk = 18;
    let bossDef = 8;
    let bossRange = 1;
    let bossType = EnemyType.OrcBrute;

    if (biome === 'desert') {
      bossName = "Sekhmet, the Searing Dune Sovereign";
      bossChar = "🦂";
      bossColor = "#eab308";
      bossHp = 400;
      bossAtk = 20;
      bossDef = 10;
      bossType = EnemyType.DreadKnight;
    } else if (biome === 'tundra') {
      bossName = "Ymir, the Frost-Weaver Titan";
      bossChar = "⛄";
      bossColor = "#cbd5e1";
      bossHp = 450;
      bossAtk = 22;
      bossDef = 12;
      bossRange = 2;
      bossType = EnemyType.Troll;
    } else if (biome === 'swamp') {
      bossName = "Charybdis, the Slime-Feaster";
      bossChar = "🦠";
      bossColor = "#10b981";
      bossHp = 380;
      bossAtk = 16;
      bossDef = 14;
      bossType = EnemyType.Slime;
    }

    const bx = ruinsX + Math.floor(ruinsW / 2);
    const by = ruinsY + Math.floor(ruinsH / 2) + 1;

    // Clear entrance clearance runway at ruins entrance & connect road spoke
    const entranceX = ruinsX + Math.floor(ruinsW / 2);
    const entranceY = ruinsY + ruinsH - 1;
    ensureEntranceClearance(map, entranceX, entranceY, width, height, 'south');
    connectPoiSpokeToTrail(map, entranceX, entranceY + 1, width, height, true);

    enemies.push({
      id: `ruin_boss_${chunkX}_${chunkY}`,
      x: bx,
      y: by,
      type: bossType,
      name: `👑 ${bossName}`,
      hp: bossHp,
      maxHp: bossHp,
      atk: bossAtk,
      def: bossDef,
      range: bossRange,
      speed: 0.9,
      color: bossColor,
      char: bossChar,
      state: EnemyState.Patrolling,
      isElite: true,
      isBoss: true,
      difficultyTier: 'apex',
      eliteEffect: 'Titan',
      patrolPath: [
        { x: bx, y: by },
        { x: Math.max(1, bx - 2), y: by },
        { x: Math.min(width - 2, bx + 2), y: by }
      ],
      patrolIndex: 0,
      debuffs: []
    });
  }
}

export function generatePointsOfInterest(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  biome: BiomeType,
  width: number,
  height: number,
  prng: (x: number, y: number, seed?: number) => number,
  poisList: any[]
) {
  const poiRoll = prng(chunkX, chunkY, 1234);
  let pType: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil' = 'monolith';
  if (biome === 'desert') {
    pType = poiRoll > 0.5 ? 'hearth' : 'fossil';
  } else if (biome === 'tundra') {
    pType = poiRoll > 0.7 ? 'monolith' : 'fossil';
  } else if (biome === 'swamp') {
    pType = poiRoll > 0.45 ? 'sunken_keep' : 'shrine';
  } else {
    pType = poiRoll > 0.6 ? 'shrine' : 'monolith';
  }

  let poiX = -1;
  let poiY = -1;
  for (let attempts = 0; attempts < 100; attempts++) {
    const rx = 10 + Math.floor(prng(chunkX * 13, chunkY * 17, attempts + 1) * (width - 20));
    const ry = 6 + Math.floor(prng(chunkX * 19, chunkY * 11, attempts + 2) * (height - 12));

    if (map[ry]?.[rx] === TileType.Grass) {
      let isSafe = true;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const tile = map[ry + dy]?.[rx + dx];
          if (tile && (tile === TileType.Water || tile === TileType.Path || tile === TileType.DungeonEntrance || tile === TileType.Wall || tile === TileType.Door)) {
            isSafe = false;
          }
        }
      }
      if (isSafe) {
        poiX = rx;
        poiY = ry;
        break;
      }
    }
  }

  if (poiX === -1) {
    for (let y = 6; y < height - 6; y++) {
      for (let x = 6; x < width - 6; x++) {
        if (map[y]?.[x] === TileType.Grass) {
          poiX = x;
          poiY = y;
          break;
        }
      }
      if (poiX !== -1) break;
    }
  }

  if (poiX !== -1 && poiY !== -1) {
    if (pType === 'shrine') {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy === 0 && dx === 0) continue;
          if (map[poiY + dy]?.[poiX + dx] === TileType.Grass) {
            map[poiY + dy][poiX + dx] = TileType.Path;
          }
        }
      }
      if (map[poiY - 2]?.[poiX] === TileType.Grass) map[poiY - 2][poiX] = TileType.Bush;
      if (map[poiY + 2]?.[poiX] === TileType.Grass) map[poiY + 2][poiX] = TileType.Bush;
      if (map[poiY]?.[poiX - 2] === TileType.Grass) map[poiY][poiX - 2] = TileType.Tree;
      if (map[poiY]?.[poiX + 2] === TileType.Grass) map[poiY][poiX + 2] = TileType.Tree;
    } else if (pType === 'monolith') {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (map[poiY + dy]?.[poiX + dx] === TileType.Tree || map[poiY + dy]?.[poiX + dx] === TileType.Bush) {
            map[poiY + dy][poiX + dx] = TileType.Grass;
          }
        }
      }
      if (map[poiY - 1]?.[poiX] === TileType.Grass) map[poiY - 1][poiX] = TileType.Torch;
      if (map[poiY + 1]?.[poiX] === TileType.Grass) map[poiY + 1][poiX] = TileType.Torch;
    } else if (pType === 'hearth') {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          map[poiY + dy][poiX + dx] = TileType.Floor;
        }
      }
      if (map[poiY - 2]?.[poiX - 1] === TileType.Grass) map[poiY - 2][poiX - 1] = TileType.Campfire;
      if (map[poiY + 2]?.[poiX + 1] === TileType.Grass) map[poiY + 2][poiX + 1] = TileType.Campfire;
    } else if (pType === 'sunken_keep') {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dy === 0 && dx === 0) {
            map[poiY][poiX] = TileType.Floor;
          } else {
            if (map[poiY + dy]?.[poiX + dx] !== undefined) {
              map[poiY + dy][poiX + dx] = TileType.Water;
            }
          }
        }
      }
      if (poiX + 1 < width) map[poiY][poiX + 1] = TileType.Path;
      if (poiX + 2 < width) map[poiY][poiX + 2] = TileType.Path;
    } else if (pType === 'fossil') {
      if (map[poiY - 1]?.[poiX - 1] === TileType.Grass) map[poiY - 1][poiX - 1] = TileType.Wall;
      if (map[poiY - 2]?.[poiX + 1] === TileType.Grass) map[poiY - 2][poiX + 1] = TileType.Wall;
      if (map[poiY + 1]?.[poiX - 1] === TileType.Grass) map[poiY + 1][poiX - 1] = TileType.Wall;
      if (map[poiY + 2]?.[poiX + 1] === TileType.Grass) map[poiY + 2][poiX + 1] = TileType.Wall;
    }

    // Connect POI to nearest trail network with safe clearance
    ensureEntranceClearance(map, poiX, poiY, width, height, 'all');
    connectPoiSpokeToTrail(map, poiX, poiY, width, height, true);

    const blueprint = getPOIBlueprint(pType, biome, poiRoll);
    if (blueprint) {
      poisList.push({
        id: `poi_${chunkX}_${chunkY}_${pType}`,
        x: poiX,
        y: poiY,
        chunkX,
        chunkY,
        name: blueprint.name,
        type: pType,
        description: blueprint.description,
        historySnippet: blueprint.historySnippet,
        chapterId: blueprint.chapterId,
        isInteracted: false,
        isAttunedWaystone: false,
        guardianDefeated: false,
        guardianSpawned: false,
        char: blueprint.char,
        color: blueprint.color
      });
    }
  }
}
