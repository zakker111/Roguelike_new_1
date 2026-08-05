import { TileType } from '../types';

export interface TileBitmaskConfig {
  [bitmask: number]: { sx: number; sy: number };
}

export class TilesetAtlasManager {
  private static instance: TilesetAtlasManager;
  private spriteSize: number = 32;
  private autotileBitmasks: Map<TileType, TileBitmaskConfig> = new Map();

  private constructor() {
    this.initDefaultBitmasks();
  }

  public static getInstance(): TilesetAtlasManager {
    if (!TilesetAtlasManager.instance) {
      TilesetAtlasManager.instance = new TilesetAtlasManager();
    }
    return TilesetAtlasManager.instance;
  }

  /**
   * Calculates 4-neighbor cardinal bitmask for autotiling (N=1, E=2, S=4, W=8)
   */
  public calculateCardinalBitmask(
    x: number,
    y: number,
    map: TileType[][],
    targetType: TileType
  ): number {
    let bitmask = 0;
    const height = map.length;
    const width = map[0]?.length || 0;

    // North (1)
    if (y > 0 && map[y - 1]?.[x] === targetType) bitmask |= 1;
    // East (2)
    if (x < width - 1 && map[y]?.[x + 1] === targetType) bitmask |= 2;
    // South (4)
    if (y < height - 1 && map[y + 1]?.[x] === targetType) bitmask |= 4;
    // West (8)
    if (x > 0 && map[y]?.[x - 1] === targetType) bitmask |= 8;

    return bitmask;
  }

  private initDefaultBitmasks() {
    // 16 cardinal variations mapping to grid offset coordinates
    const wallBitmaskConfig: TileBitmaskConfig = {
      0: { sx: 0, sy: 0 },  // Isolated pillar
      1: { sx: 1, sy: 0 },  // End N
      2: { sx: 2, sy: 0 },  // End E
      3: { sx: 3, sy: 0 },  // Corner NE
      4: { sx: 0, sy: 1 },  // End S
      5: { sx: 1, sy: 1 },  // Straight NS
      6: { sx: 2, sy: 1 },  // Corner SE
      7: { sx: 3, sy: 1 },  // T-junction NES
      8: { sx: 0, sy: 2 },  // End W
      9: { sx: 1, sy: 2 },  // Corner NW
      10: { sx: 2, sy: 2 }, // Straight EW
      11: { sx: 3, sy: 2 }, // T-junction NEW
      12: { sx: 0, sy: 3 }, // Corner SW
      13: { sx: 1, sy: 3 }, // T-junction NSW
      14: { sx: 2, sy: 3 }, // T-junction SEW
      15: { sx: 3, sy: 3 }, // Cross NESW
    };

    this.autotileBitmasks.set(TileType.Wall, wallBitmaskConfig);
  }

  public getAutotileCoords(type: TileType, bitmask: number): { sx: number; sy: number } | null {
    const config = this.autotileBitmasks.get(type);
    if (!config) return null;
    return config[bitmask] || config[0] || null;
  }

  public getTileCoords(tileType: string, bitmask: number = 0): { sx: number; sy: number; sw: number; sh: number } | null {
    const coords = this.getAutotileCoords(tileType as TileType, bitmask);
    if (coords) {
      return { sx: coords.sx * this.spriteSize, sy: coords.sy * this.spriteSize, sw: this.spriteSize, sh: this.spriteSize };
    }
    return { sx: 0, sy: 0, sw: this.spriteSize, sh: this.spriteSize };
  }

  public getSpriteCoords(entityId: string, animState: string = 'idle', direction: string = 'south'): { sx: number; sy: number; sw: number; sh: number } | null {
    // Default grid coordinate lookup for entity spritesheets
    let dirIndex = 0;
    if (direction === 'east') dirIndex = 1;
    if (direction === 'north') dirIndex = 2;
    if (direction === 'west') dirIndex = 3;

    let stateIndex = 0;
    if (animState === 'walk') stateIndex = 1;
    if (animState === 'attack') stateIndex = 2;
    if (animState === 'hurt') stateIndex = 3;

    return {
      sx: stateIndex * this.spriteSize,
      sy: dirIndex * this.spriteSize,
      sw: this.spriteSize,
      sh: this.spriteSize,
    };
  }
}

export const tilesetAtlasManager = TilesetAtlasManager.getInstance();
