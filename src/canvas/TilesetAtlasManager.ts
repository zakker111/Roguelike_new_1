import { TileType } from '../types';

export interface TileBitmaskConfig {
  [bitmask: number]: { sx: number; sy: number };
}

export interface OversizedEntityConfig {
  widthTiles: number;
  heightTiles: number;
  pixelWidth: number;
  pixelHeight: number;
  anchorY: number; // 1.0 = bottom-grounded, 0.5 = center
  atlasKey: string;
  sx: number;
  sy: number;
}

export interface TileAtlasMapping {
  atlasKey: string;
  col: number;
  row: number;
  frameCount?: number;
  ticksPerFrame?: number;
}

export class TilesetAtlasManager {
  private static instance: TilesetAtlasManager;
  private spriteSize: number = 32;
  private autotileBitmasks: Map<TileType, TileBitmaskConfig> = new Map();
  private tileStaticCoords: Map<string, TileAtlasMapping> = new Map();
  private entityRowMappings: Map<string, number> = new Map();
  private oversizedEntities: Map<string, OversizedEntityConfig> = new Map();

  private constructor() {
    this.initDefaultBitmasks();
    this.initStaticTileMappings();
    this.initEntityMappings();
    this.initOversizedBosses();
  }

  public static getInstance(): TilesetAtlasManager {
    if (!TilesetAtlasManager.instance) {
      TilesetAtlasManager.instance = new TilesetAtlasManager();
    }
    return TilesetAtlasManager.instance;
  }

  public getSpriteSize(): number {
    return this.spriteSize;
  }

  public setSpriteSize(size: number): void {
    this.spriteSize = Math.max(16, Math.min(128, size));
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

  /**
   * Calculates 8-neighbor Wang tile bitmask (N=1, NE=2, E=4, SE=8, S=16, SW=32, W=64, NW=128)
   */
  public calculate8NeighborBitmask(
    x: number,
    y: number,
    map: TileType[][],
    targetType: TileType
  ): number {
    let bitmask = 0;
    const height = map.length;
    const width = map[0]?.length || 0;

    const isMatch = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || ny >= height || nx >= width) return false;
      return map[ny]?.[nx] === targetType;
    };

    if (isMatch(x, y - 1)) bitmask |= 1;       // N
    if (isMatch(x + 1, y - 1)) bitmask |= 2;   // NE
    if (isMatch(x + 1, y)) bitmask |= 4;       // E
    if (isMatch(x + 1, y + 1)) bitmask |= 8;   // SE
    if (isMatch(x, y + 1)) bitmask |= 16;      // S
    if (isMatch(x - 1, y + 1)) bitmask |= 32;  // SW
    if (isMatch(x - 1, y)) bitmask |= 64;      // W
    if (isMatch(x - 1, y - 1)) bitmask |= 128; // NW

    return bitmask;
  }

  /**
   * Deterministic hash for coordinate-based tile variants
   */
  public getTileVariant(x: number, y: number, variantCount: number = 4): number {
    const hash = Math.abs((x * 73856093 ^ y * 19349663) % 10007);
    return hash % variantCount;
  }

  private initDefaultBitmasks() {
    // 16 cardinal variations for Walls (cols 0..3, rows 0..3)
    const wall16BitmaskConfig: TileBitmaskConfig = {
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

    // 16 cardinal variations for Water (cols 4..7, rows 0..3)
    const water16BitmaskConfig: TileBitmaskConfig = {
      0: { sx: 4, sy: 0 },
      1: { sx: 5, sy: 0 },
      2: { sx: 6, sy: 0 },
      3: { sx: 7, sy: 0 },
      4: { sx: 4, sy: 1 },
      5: { sx: 5, sy: 1 },
      6: { sx: 6, sy: 1 },
      7: { sx: 7, sy: 1 },
      8: { sx: 4, sy: 2 },
      9: { sx: 5, sy: 2 },
      10: { sx: 6, sy: 2 },
      11: { sx: 7, sy: 2 },
      12: { sx: 4, sy: 3 },
      13: { sx: 5, sy: 3 },
      14: { sx: 6, sy: 3 },
      15: { sx: 7, sy: 3 },
    };

    // 16 cardinal variations for Path / Roads (cols 8..11, rows 0..3)
    const path16BitmaskConfig: TileBitmaskConfig = {
      0: { sx: 8, sy: 0 },
      1: { sx: 9, sy: 0 },
      2: { sx: 10, sy: 0 },
      3: { sx: 11, sy: 0 },
      4: { sx: 8, sy: 1 },
      5: { sx: 9, sy: 1 },
      6: { sx: 10, sy: 1 },
      7: { sx: 11, sy: 1 },
      8: { sx: 8, sy: 2 },
      9: { sx: 9, sy: 2 },
      10: { sx: 10, sy: 2 },
      11: { sx: 11, sy: 2 },
      12: { sx: 8, sy: 3 },
      13: { sx: 9, sy: 3 },
      14: { sx: 10, sy: 3 },
      15: { sx: 11, sy: 3 },
    };

    this.autotileBitmasks.set(TileType.Wall, wall16BitmaskConfig);
    this.autotileBitmasks.set(TileType.Water, water16BitmaskConfig);
    this.autotileBitmasks.set(TileType.Path, path16BitmaskConfig);
  }

  private initStaticTileMappings() {
    // Row 0 static terrain tiles (cols 12..15)
    this.tileStaticCoords.set(TileType.Floor, { atlasKey: 'main_tileset', col: 12, row: 0, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Empty, { atlasKey: 'main_tileset', col: 12, row: 0, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Grass, { atlasKey: 'main_tileset', col: 13, row: 0, frameCount: 1 });

    // Row 1 doors, portals & signs (cols 12..15)
    this.tileStaticCoords.set(TileType.Door, { atlasKey: 'main_tileset', col: 13, row: 1, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Sign, { atlasKey: 'main_tileset', col: 15, row: 1, frameCount: 1 });

    // Row 2 stairs, gates & dungeon thresholds (cols 12..15)
    this.tileStaticCoords.set(TileType.StairsDown, { atlasKey: 'main_tileset', col: 12, row: 2, frameCount: 1 });
    this.tileStaticCoords.set(TileType.StairsUp, { atlasKey: 'main_tileset', col: 13, row: 2, frameCount: 1 });
    this.tileStaticCoords.set(TileType.DungeonEntrance, { atlasKey: 'main_tileset', col: 14, row: 2, frameCount: 1 });
    this.tileStaticCoords.set(TileType.TownGate, { atlasKey: 'main_tileset', col: 15, row: 2, frameCount: 1 });

    // Row 3 trees & harvestables (cols 12..15)
    this.tileStaticCoords.set(TileType.Tree, { atlasKey: 'main_tileset', col: 12, row: 3, frameCount: 1 });
    this.tileStaticCoords.set(TileType.PineTree, { atlasKey: 'main_tileset', col: 13, row: 3, frameCount: 1 });
    this.tileStaticCoords.set(TileType.BirchTree, { atlasKey: 'main_tileset', col: 14, row: 3, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Bush, { atlasKey: 'main_tileset', col: 15, row: 3, frameCount: 1 });

    // Row 4 props, resources & furniture (cols 0..15)
    this.tileStaticCoords.set(TileType.TreeStump, { atlasKey: 'main_tileset', col: 0, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.CopperVein, { atlasKey: 'main_tileset', col: 1, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.IronVein, { atlasKey: 'main_tileset', col: 2, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Campfire, { atlasKey: 'main_tileset', col: 3, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Torch, { atlasKey: 'main_tileset', col: 4, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Fireplace, { atlasKey: 'main_tileset', col: 5, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Anvil, { atlasKey: 'main_tileset', col: 6, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Table, { atlasKey: 'main_tileset', col: 7, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Chair, { atlasKey: 'main_tileset', col: 8, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Bed, { atlasKey: 'main_tileset', col: 9, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Bedroll, { atlasKey: 'main_tileset', col: 10, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.FieldTent, { atlasKey: 'main_tileset', col: 11, row: 4, frameCount: 1 });
    this.tileStaticCoords.set(TileType.Window, { atlasKey: 'main_tileset', col: 12, row: 4, frameCount: 1 });

    // Row 5 fortifications & structures (cols 0..7)
    this.tileStaticCoords.set(TileType.WatchtowerWall, { atlasKey: 'main_tileset', col: 0, row: 5, frameCount: 1 });
    this.tileStaticCoords.set(TileType.WatchtowerSlit, { atlasKey: 'main_tileset', col: 1, row: 5, frameCount: 1 });
    this.tileStaticCoords.set(TileType.WatchtowerDeck, { atlasKey: 'main_tileset', col: 2, row: 5, frameCount: 1 });
    this.tileStaticCoords.set(TileType.WatchtowerFlag, { atlasKey: 'main_tileset', col: 3, row: 5, frameCount: 1 });
    this.tileStaticCoords.set(TileType.WatchtowerBarricade, { atlasKey: 'main_tileset', col: 4, row: 5, frameCount: 1 });
  }

  private initEntityMappings() {
    // Humanoids and monsters base row indices in entity_tileset (each spans 4 directional rows: S, W, E, N)
    this.entityRowMappings.set('player', 0);
    this.entityRowMappings.set('@', 0);
    this.entityRowMappings.set('warrior', 0);
    this.entityRowMappings.set('mage', 4);
    this.entityRowMappings.set('rogue', 8);
    this.entityRowMappings.set('guard', 12);
    this.entityRowMappings.set('town_guard', 12);
    this.entityRowMappings.set('castle_guard', 12);
    this.entityRowMappings.set('sentry', 12);
    this.entityRowMappings.set('defender', 12);
    this.entityRowMappings.set('warden', 12);
    this.entityRowMappings.set('sentinel', 12);
    this.entityRowMappings.set('🛡', 12);
    this.entityRowMappings.set('Q', 12);
    this.entityRowMappings.set('g', 12);
    this.entityRowMappings.set('goblin', 16);
    this.entityRowMappings.set('G', 16);
    this.entityRowMappings.set('skeleton', 20);
    this.entityRowMappings.set('S', 20);
    this.entityRowMappings.set('orc', 24);
    this.entityRowMappings.set('O', 24);
    this.entityRowMappings.set('spider', 28);
    this.entityRowMappings.set('s', 28);
    this.entityRowMappings.set('wolf', 32);
    this.entityRowMappings.set('dire_wolf', 32);
    this.entityRowMappings.set('slime', 36);
    this.entityRowMappings.set('zombie', 20);
    this.entityRowMappings.set('Z', 20);
    this.entityRowMappings.set('civilian', 40);
    this.entityRowMappings.set('N', 40);
    this.entityRowMappings.set('cat', 44);
    this.entityRowMappings.set('c', 44);
    this.entityRowMappings.set('C', 44);
    this.entityRowMappings.set('🐱', 44);
    this.entityRowMappings.set('🐈', 44);
    this.entityRowMappings.set('dog', 32);
    this.entityRowMappings.set('wolf', 32);
    this.entityRowMappings.set('W', 32);
    this.entityRowMappings.set('🐺', 32);

    // Quadruped Wildlife & Overworld Animals
    this.entityRowMappings.set('deer', 48);
    this.entityRowMappings.set('wild_deer', 48);
    this.entityRowMappings.set('caribou', 48);
    this.entityRowMappings.set('stag', 48);
    this.entityRowMappings.set('🦌', 48);

    this.entityRowMappings.set('boar', 52);
    this.entityRowMappings.set('wild_boar', 52);
    this.entityRowMappings.set('caiman', 52);
    this.entityRowMappings.set('🐗', 52);
    this.entityRowMappings.set('🐊', 52);

    this.entityRowMappings.set('sheep', 56);
    this.entityRowMappings.set('goat', 56);
    this.entityRowMappings.set('wild_sheep', 56);
    this.entityRowMappings.set('mountain_goat', 56);
    this.entityRowMappings.set('toad', 56);
    this.entityRowMappings.set('frog', 56);
    this.entityRowMappings.set('🐐', 56);
    this.entityRowMappings.set('🐑', 56);
    this.entityRowMappings.set('🐸', 56);

    this.entityRowMappings.set('rat', 60);
    this.entityRowMappings.set('giant_rat', 60);
    this.entityRowMappings.set('mouse', 60);
    this.entityRowMappings.set('r', 60);
    this.entityRowMappings.set('🐀', 60);
    this.entityRowMappings.set('🐁', 60);

    this.entityRowMappings.set('bear', 64);
    this.entityRowMappings.set('wild_bear', 64);
    this.entityRowMappings.set('grizzly', 64);
    this.entityRowMappings.set('🐻', 64);

    this.entityRowMappings.set('camel', 68);
    this.entityRowMappings.set('desert_camel', 68);
    this.entityRowMappings.set('🐪', 68);
    this.entityRowMappings.set('🐫', 68);
  }

  /**
   * Intelligently resolves an entity's base row archetype via exact match or fuzzy keyword/symbol detection
   */
  public resolveArchetypeBaseRow(entityIdOrChar: string): number {
    const clean = entityIdOrChar.toLowerCase();

    // 1. Direct registry lookup
    if (this.entityRowMappings.has(clean)) {
      return this.entityRowMappings.get(clean)!;
    }
    if (this.entityRowMappings.has(entityIdOrChar)) {
      return this.entityRowMappings.get(entityIdOrChar)!;
    }

    // 2. Animals & Wildlife detection
    if (clean.includes('cat') || entityIdOrChar === '🐱' || entityIdOrChar === '🐈' || entityIdOrChar === 'c') {
      return 44;
    }
    if (clean.includes('deer') || clean.includes('caribou') || clean.includes('stag') || clean.includes('fawn') || entityIdOrChar === '🦌') {
      return 48;
    }
    if (clean.includes('boar') || clean.includes('pig') || clean.includes('caiman') || clean.includes('alligator') || clean.includes('crocodile') || entityIdOrChar === '🐗' || entityIdOrChar === '🐊') {
      return 52;
    }
    if (clean.includes('sheep') || clean.includes('goat') || clean.includes('ram') || clean.includes('frog') || clean.includes('toad') || clean.includes('bullfrog') || entityIdOrChar === '🐐' || entityIdOrChar === '🐑' || entityIdOrChar === '🐸') {
      return 56;
    }
    if (clean.includes('rat') || clean.includes('mouse') || clean.includes('rodent') || entityIdOrChar === '🐀' || entityIdOrChar === '🐁' || entityIdOrChar === 'r') {
      return 60;
    }
    if (clean.includes('bear') || entityIdOrChar === '🐻') {
      return 64;
    }
    if (clean.includes('camel') || entityIdOrChar === '🐪' || entityIdOrChar === '🐫') {
      return 68;
    }
    if (clean.includes('wolf') || clean.includes('worg') || clean.includes('hound') || clean.includes('dog') || entityIdOrChar === '🐺' || entityIdOrChar === '🐕' || entityIdOrChar === 'W') {
      return 32;
    }

    // 3. Monsters & NPCs detection
    if (clean.includes('spider') || entityIdOrChar === '🕷' || entityIdOrChar === 's') {
      return 28;
    }
    if (clean.includes('slime') || clean.includes('blob') || clean.includes('ooze') || clean.includes('jelly') || entityIdOrChar === 'g') {
      return 36;
    }
    if (clean.includes('skeleton') || clean.includes('bone') || clean.includes('lich') || clean.includes('zombie') || entityIdOrChar === 'S' || entityIdOrChar === 'Z') {
      return 20;
    }
    if (clean.includes('goblin') || entityIdOrChar === 'G') {
      return 16;
    }
    if (clean.includes('orc') || clean.includes('ogre') || entityIdOrChar === 'O') {
      return 24;
    }
    if (clean.includes('guard') || clean.includes('sentry') || clean.includes('patrol') || clean.includes('defender') || clean.includes('warden') || clean.includes('sentinel') || entityIdOrChar === '🛡' || entityIdOrChar === 'Q') {
      return 12;
    }
    if (clean.includes('civilian') || clean.includes('villager') || clean.includes('npc') || clean.includes('merchant') || clean.includes('caravan') || clean.includes('apothecary') || clean.includes('seppo') || entityIdOrChar === 'N' || entityIdOrChar === 'M' || entityIdOrChar === 'A' || entityIdOrChar === 'C') {
      return 40;
    }
    if (clean.includes('mage') || clean.includes('wizard') || clean.includes('sorcerer') || clean.includes('cleric')) {
      return 4;
    }
    if (clean.includes('rogue') || clean.includes('thief') || clean.includes('assassin') || clean.includes('bandit') || entityIdOrChar === 'B') {
      return 8;
    }
    if (clean.includes('player') || entityIdOrChar === '@') {
      return 0;
    }

    // Default to warrior
    return 0;
  }

  private initOversizedBosses() {
    // 2x2 Bosses (64x64px)
    this.oversizedEntities.set('dragon', {
      widthTiles: 2,
      heightTiles: 2,
      pixelWidth: 64,
      pixelHeight: 64,
      anchorY: 0.9,
      atlasKey: 'boss_tileset',
      sx: 0,
      sy: 0,
    });
    this.oversizedEntities.set('fire_drake', {
      widthTiles: 2,
      heightTiles: 2,
      pixelWidth: 64,
      pixelHeight: 64,
      anchorY: 0.9,
      atlasKey: 'boss_tileset',
      sx: 0,
      sy: 0,
    });
    this.oversizedEntities.set('golem', {
      widthTiles: 2,
      heightTiles: 2,
      pixelWidth: 64,
      pixelHeight: 64,
      anchorY: 0.95,
      atlasKey: 'boss_tileset',
      sx: 64,
      sy: 0,
    });
    this.oversizedEntities.set('titan_golem', {
      widthTiles: 2,
      heightTiles: 2,
      pixelWidth: 64,
      pixelHeight: 64,
      anchorY: 0.95,
      atlasKey: 'boss_tileset',
      sx: 64,
      sy: 0,
    });

    // 3x3 Bosses (96x96px)
    this.oversizedEntities.set('demon_lord', {
      widthTiles: 3,
      heightTiles: 3,
      pixelWidth: 96,
      pixelHeight: 96,
      anchorY: 0.95,
      atlasKey: 'boss_tileset',
      sx: 0,
      sy: 128,
    });
    this.oversizedEntities.set('abyssal_behemoth', {
      widthTiles: 3,
      heightTiles: 3,
      pixelWidth: 96,
      pixelHeight: 96,
      anchorY: 0.95,
      atlasKey: 'boss_tileset',
      sx: 0,
      sy: 128,
    });
  }

  public getOversizedEntityConfig(typeOrChar: string): OversizedEntityConfig | null {
    const key = typeOrChar.toLowerCase();
    return this.oversizedEntities.get(key) || null;
  }

  public registerOversizedEntity(type: string, config: OversizedEntityConfig): void {
    this.oversizedEntities.set(type.toLowerCase(), config);
  }

  public getAutotileCoords(type: TileType, bitmask: number): { sx: number; sy: number } | null {
    const config = this.autotileBitmasks.get(type);
    if (!config) return null;
    return config[bitmask] || config[0] || null;
  }

  public getTileCoords(
    tileType: string,
    bitmask: number = 0,
    variant: number = 0
  ): { atlasKey: string; sx: number; sy: number; sw: number; sh: number } | null {
    // 1. Check autotiled walls, water, paths
    const autotileCoord = this.getAutotileCoords(tileType as TileType, bitmask);
    if (autotileCoord) {
      return {
        atlasKey: 'main_tileset',
        sx: (autotileCoord.sx + (variant % 2 === 1 ? 0 : 0)) * this.spriteSize,
        sy: autotileCoord.sy * this.spriteSize,
        sw: this.spriteSize,
        sh: this.spriteSize,
      };
    }

    // 2. Check static tile registry
    const staticMapping = this.tileStaticCoords.get(tileType);
    if (staticMapping) {
      return {
        atlasKey: staticMapping.atlasKey,
        sx: staticMapping.col * this.spriteSize,
        sy: staticMapping.row * this.spriteSize,
        sw: this.spriteSize,
        sh: this.spriteSize,
      };
    }

    // Fallback: Default floor coordinate (col 12, row 0)
    return {
      atlasKey: 'main_tileset',
      sx: 12 * this.spriteSize,
      sy: 0,
      sw: this.spriteSize,
      sh: this.spriteSize,
    };
  }

  public getSpriteCoords(
    entityIdOrChar: string,
    animState: string = 'idle',
    direction: string = 'south',
    frameIndex: number = 0
  ): { atlasKey: string; sx: number; sy: number; sw: number; sh: number } | null {
    // Direction row offset: South = 0, West = 1, East = 2, North = 3
    let dirIndex = 0;
    if (direction === 'west') dirIndex = 1;
    if (direction === 'east') dirIndex = 2;
    if (direction === 'north') dirIndex = 3;

    // Resolve base row for entity archetype
    const baseRow = this.resolveArchetypeBaseRow(entityIdOrChar);

    const row = baseRow + dirIndex;

    // Animation state col offset
    let baseCol = 0;
    if (animState === 'walk') baseCol = 4;
    else if (animState === 'attack') baseCol = 8;
    else if (animState === 'hurt') baseCol = 12;
    else if (animState === 'cast') baseCol = 14;

    const frameCol = baseCol + (frameIndex % (animState === 'hurt' || animState === 'cast' ? 2 : 4));

    return {
      atlasKey: 'entity_tileset',
      sx: frameCol * this.spriteSize,
      sy: row * this.spriteSize,
      sw: this.spriteSize,
      sh: this.spriteSize,
    };
  }

  public getItemCoords(itemCategoryOrId: string): { atlasKey: string; sx: number; sy: number; sw: number; sh: number } {
    const key = itemCategoryOrId.toLowerCase();
    let col = 0;
    let row = 0;

    if (key.includes('sword') || key.includes('blade')) {
      col = 0; row = 0;
    } else if (key.includes('dagger') || key.includes('knife')) {
      col = 1; row = 0;
    } else if (key.includes('axe')) {
      col = 2; row = 0;
    } else if (key.includes('bow')) {
      col = 3; row = 0;
    } else if (key.includes('staff') || key.includes('wand')) {
      col = 4; row = 0;
    } else if (key.includes('heal') || key.includes('health') || key.includes('potion')) {
      col = 0; row = 1;
    } else if (key.includes('mana') || key.includes('elixir')) {
      col = 1; row = 1;
    } else if (key.includes('scroll') || key.includes('tome')) {
      col = 2; row = 1;
    }

    return {
      atlasKey: 'items_tileset',
      sx: col * this.spriteSize,
      sy: row * this.spriteSize,
      sw: this.spriteSize,
      sh: this.spriteSize,
    };
  }
}

export const tilesetAtlasManager = TilesetAtlasManager.getInstance();
