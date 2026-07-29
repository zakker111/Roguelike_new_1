import { GameState, TileType, Enemy, EnemyState, EnemyType } from '../types';
import { getEnemyTemplate } from './dungeon';

export interface StructurePreset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  width: number;
  height: number;
  grid: string[];
  legend: Record<string, string>;
  enemies?: Array<{
    rx: number;
    ry: number;
    type: string;
    name?: string;
    isElite?: boolean;
  }>;
}

export const STRUCTURE_PRESETS: StructurePreset[] = [
  {
    id: 'tiny_shelter',
    name: 'Cozy Spawn Shelter',
    description: 'A 5x5 brick building equipped with a wooden door, solid wall boundaries, wooden floors, a comfortable sleeping Bed, and a table & chair set.',
    emoji: '🏠',
    width: 5,
    height: 5,
    grid: [
      "#####",
      "#B.T#",
      "#..C#",
      "#...#",
      "##D##"
    ],
    legend: {
      "#": "Wall",
      ".": "Floor",
      "B": "Bed",
      "C": "Chair",
      "T": "Table",
      "D": "Door"
    }
  },
  {
    id: 'combat_arena',
    name: 'Fenced Combat Arena',
    description: 'An 8x8 dirt/floor ring marked by impenetrable walls, containing two active Elite testing Orcs and high-difficulty indicators.',
    emoji: '⚔️',
    width: 8,
    height: 8,
    grid: [
      "########",
      "#......#",
      "#......#",
      "#......#",
      "........",
      "#......#",
      "#......#",
      "########"
    ],
    legend: {
      "#": "Wall",
      ".": "Floor"
    },
    enemies: [
      { rx: 2, ry: 3, type: "OrcBrute", name: "[ARENA] Orc gladiator", isElite: true },
      { rx: 5, ry: 4, type: "Goblin", name: "[ARENA] Goblin challenger", isElite: true }
    ]
  },
  {
    id: 'dungeon_portal',
    name: 'Mystic Dungeon Portal',
    description: 'A 5x5 sacred stone array with a Dungeon Entrance in the center, flanked by ancient warning walls and water trenches.',
    emoji: '🌀',
    width: 5,
    height: 5,
    grid: [
      "#...#",
      ".....",
      "..E..",
      ".....",
      "#...#"
    ],
    legend: {
      "#": "Wall",
      ".": "Floor",
      "E": "DungeonEntrance"
    }
  },
  {
    id: 'forest_oasis',
    name: 'Berry Forest Grove',
    description: 'A 7x7 refreshing natural grove replacing trees, placing soft Grass floors, rings of protective Trees, and highly harvestable sweet Berry Bushes.',
    emoji: '🍓',
    width: 7,
    height: 7,
    grid: [
      "TTTTTTT",
      "T.....T",
      "T..B..T",
      ".......",
      "T.....T",
      "T.....T",
      "TTTTTTT"
    ],
    legend: {
      "T": "Tree",
      ".": "Grass",
      "B": "Table"
    }
  },
  {
    id: 'inn_rest_stop',
    name: 'Royal Tavern & Lounge',
    description: 'A large 9x6 tavern layout featuring tables, multiple chairs, a fireplace/campfire focal point, multiple beds, and a clean path leading to the entrance door.',
    emoji: '🍻',
    width: 9,
    height: 6,
    grid: [
      "#########",
      "#B....CT#",
      "#B....CT#",
      "#.......#",
      "#.......#",
      "##D###D##"
    ],
    legend: {
      "#": "Wall",
      ".": "Floor",
      "B": "Bed",
      "C": "Chair",
      "T": "Table",
      "D": "Door"
    }
  },
  {
    id: 'faction_watchtower',
    name: 'Faction Watchtower Outpost',
    description: 'A heavily fortified outpost with stone battlements, arrow slits, defensive barricades, an elevated observation deck, and a faction flag.',
    emoji: '🏰',
    width: 9,
    height: 9,
    grid: [
      "WWSWWSWWW",
      "WKKKKKKKW",
      "SK.X.X.KS",
      "WK.....KW",
      "WK..F..KW",
      "WK.....KW",
      "SK.X.X.KS",
      "WKKKKKKKW",
      "WWWW+WWWW"
    ],
    legend: {
      "W": "WatchtowerWall",
      "S": "WatchtowerSlit",
      "K": "WatchtowerDeck",
      "F": "WatchtowerFlag",
      "X": "WatchtowerBarricade",
      ".": "Floor",
      "+": "Door"
    }
  }
];

/**
 * Gets the merged list of default and custom user structures.
 */
export function getAvailableStructures(): StructurePreset[] {
  const custom = (window as any).customStructures || [];
  return [...STRUCTURE_PRESETS, ...custom];
}

/**
 * Carves a preset structure onto the active GameState map at target coordinates.
 * Coordinates (targetX, targetY) correspond to the top-left of the structure bounding box.
 */
export function carveStructure(
  gameState: GameState,
  presetId: string,
  targetX: number,
  targetY: number
): { success: boolean; error?: string; updatedMap: TileType[][]; newEnemies: Enemy[] } {
  
  const mapWidth = gameState.levelWidth;
  const mapHeight = gameState.levelHeight;
  const available = getAvailableStructures();
  const preset = available.find(p => p.id === presetId);

  if (!preset) {
    return { success: false, error: 'Unknown structure preset selective ID!', updatedMap: gameState.map, newEnemies: gameState.enemies };
  }

  // Safety boundaries checks
  if (
    targetX < 0 || 
    targetY < 0 || 
    targetX + preset.width > mapWidth || 
    targetY + preset.height > mapHeight
  ) {
    return { 
      success: false, 
      error: `Placement out of bounds! Structure is ${preset.width}x${preset.height} but placement goes beyond map borders (${mapWidth}x${mapHeight}). Try offsetting toward center.`, 
      updatedMap: gameState.map, 
      newEnemies: gameState.enemies 
    };
  }

  // Deep clone of map & enemies to remain immutable and functional
  const updatedMap = gameState.map.map(row => [...row]);
  const newEnemies = [...gameState.enemies];

  const sx = targetX;
  const sy = targetY;
  const w = preset.width;
  const h = preset.height;

  // Carve structure grid mapping
  for (let y = 0; y < h; y++) {
    const rowString = preset.grid[y];
    if (!rowString) continue;
    for (let x = 0; x < w; x++) {
      const char = rowString[x];
      if (!char) continue;
      const mappedTileName = preset.legend[char];
      if (mappedTileName && (TileType as any)[mappedTileName]) {
        updatedMap[sy + y][sx + x] = (TileType as any)[mappedTileName];
      } else if (char === ' ') {
        // Empty space leaves the tile untouched
      } else {
        console.error(`[DEV ERROR] carveStructure: Preset '${preset.id}' has unmapped char '${char}' at local offset (${x}, ${y})! Legend mapping failed. Defaulting tile to Floor.`);
        updatedMap[sy + y][sx + x] = TileType.Floor;
      }
    }
  }

  // Spawn optional specific enemies
  if (preset.enemies && Array.isArray(preset.enemies)) {
    preset.enemies.forEach((se, idx) => {
      const ex = sx + se.rx;
      const ey = sy + se.ry;
      if (ex >= 0 && ex < mapWidth && ey >= 0 && ey < mapHeight) {
        let etype = EnemyType.Goblin;
        if (se.type === 'Rat') etype = EnemyType.Rat;
        else if (se.type === 'Mage' || se.type === 'SkeletonMage') etype = EnemyType.SkeletonMage;
        else if (se.type === 'Brute' || se.type === 'OrcBrute') etype = EnemyType.OrcBrute;
        else if (se.type === 'Trapmaster') etype = EnemyType.Trapmaster;

        const template = getEnemyTemplate(etype);
        const customId = `struct_spawn_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`;
        
        const createdEnemy: Enemy = {
          id: customId,
          x: ex,
          y: ey,
          type: etype,
          name: se.name || `[CUSTOM] ${template.name}`,
          hp: se.isElite ? Math.round(template.baseHp * 1.5) : template.baseHp,
          maxHp: se.isElite ? Math.round(template.baseHp * 1.5) : template.baseHp,
          atk: se.isElite ? template.baseAtk + 2 : template.baseAtk,
          def: se.isElite ? template.baseDef + 1 : template.baseDef,
          range: template.range || 1,
          speed: template.speed || 1.0,
          color: se.isElite ? '#f43f5e' : template.color,
          char: template.char,
          state: EnemyState.Chasing,
          isElite: !!se.isElite,
          patrolPath: [{ x: ex, y: ey }],
          patrolIndex: 0,
          debuffs: []
        };

        if (!newEnemies.some(e => e.x === ex && e.y === ey)) {
          newEnemies.push(createdEnemy);
        }
      }
    });
  }

  return { success: true, updatedMap, newEnemies };
}
