import { GameState, TileType, Enemy, EnemyState, EnemyType } from '../types';
import { getEnemyTemplate } from './dungeon';
import structuresData from '../data/structures.json';

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

export const STRUCTURE_PRESETS: StructurePreset[] = structuresData as StructurePreset[];

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
