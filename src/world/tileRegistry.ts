/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../types/map';

export type ShadowCastingType = 'wall' | 'tree' | 'prop' | 'structure';

export interface TileHarvestYield {
  materialId: string;
  count?: number;
  secondaryMaterialId?: string;
  secondaryCount?: number;
  name: string;
}

export interface TileStyleContext {
  isVisible: boolean;
  isOverworld: boolean;
  biome?: string;
  depth?: number;
  controller?: string;
  tileX?: number;
  tileY?: number;
}

export interface TileStyleResult {
  char: string;
  tileColor: string;
  glyphColor: string;
}

export interface TileDefinition {
  id: TileType | string;
  name: string;
  description?: string;
  defaultChar: string;
  defaultTileColor: string;
  defaultGlyphColor: string;
  isObstacle: boolean;
  canBeOpened?: boolean;          // E.g. Door
  isWater?: boolean;             // E.g. Water
  isBed?: boolean;               // E.g. Bed
  blocksVision?: boolean;        // E.g. Wall, Tree, Door, etc.
  castsShadow?: boolean;         // Casts sun/moon shadow
  shadowType?: ShadowCastingType;
  isLightSource?: boolean;       // For lighting engine
  lightRadius?: number;
  lightColor?: string;
  isIndoor?: boolean;            // Counts as building interior
  isHarvestable?: boolean;       // Resource harvesting
  harvestTool?: 'hatchet' | 'pickaxe' | 'none';
  harvestYield?: TileHarvestYield;
  harvestReplacementTile?: TileType;
  isSafeForNpc?: boolean;        // Safe for NPC spawning / placement
  atlasCoord?: { atlasKey?: string; col: number; row: number; frameCount?: number };
  resolveCustomStyle?: (ctx: TileStyleContext) => TileStyleResult;
}

/**
 * Authoritative Master Tile Definitions Registry
 */
export const MASTER_TILE_REGISTRY: Record<string, TileDefinition> = {
  [TileType.Wall]: {
    id: TileType.Wall,
    name: 'Stone Wall',
    description: 'Impassable solid stone barrier.',
    defaultChar: '#',
    defaultTileColor: '#1e293b',
    defaultGlyphColor: '#64748b',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'wall',
    isIndoor: true,
    atlasCoord: { col: 0, row: 1 },
  },
  [TileType.Floor]: {
    id: TileType.Floor,
    name: 'Dungeon Floor',
    description: 'Smooth flagstone flooring.',
    defaultChar: '.',
    defaultTileColor: '#0f172a',
    defaultGlyphColor: '#475569',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    isSafeForNpc: true,
    atlasCoord: { col: 1, row: 0 },
  },
  [TileType.Door]: {
    id: TileType.Door,
    name: 'Timber Door',
    description: 'Hinged wooden door that can be opened or shut.',
    defaultChar: '+',
    defaultTileColor: '#1e293b',
    defaultGlyphColor: '#b45309',
    isObstacle: true,
    canBeOpened: true,
    blocksVision: true,
    castsShadow: false,
    isIndoor: true,
    atlasCoord: { col: 4, row: 1 },
  },
  [TileType.StairsDown]: {
    id: TileType.StairsDown,
    name: 'Stairs Down',
    description: 'Stone descent leading deeper into the abyss.',
    defaultChar: '>',
    defaultTileColor: '#3f3f46',
    defaultGlyphColor: '#fbbf24',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    isSafeForNpc: true,
    atlasCoord: { col: 8, row: 1 },
  },
  [TileType.StairsUp]: {
    id: TileType.StairsUp,
    name: 'Stairs Up',
    description: 'Stone staircase ascending to the upper level.',
    defaultChar: '<',
    defaultTileColor: '#3f3f46',
    defaultGlyphColor: '#38bdf8',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    isSafeForNpc: true,
    atlasCoord: { col: 9, row: 1 },
  },
  [TileType.Empty]: {
    id: TileType.Empty,
    name: 'Abyssal Void',
    description: 'Impassable empty boundary.',
    defaultChar: ' ',
    defaultTileColor: '#020617',
    defaultGlyphColor: '#0f172a',
    isObstacle: true,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: false,
  },
  [TileType.Grass]: {
    id: TileType.Grass,
    name: 'Wilderness Grass',
    description: 'Open green terrain and wild flora.',
    defaultChar: '.',
    defaultTileColor: '#0a1d12',
    defaultGlyphColor: '#10b981',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: true,
    atlasCoord: { col: 0, row: 2 },
  },
  [TileType.Tree]: {
    id: TileType.Tree,
    name: 'Deciduous Tree',
    description: 'Mature oak tree harvestable for wood.',
    defaultChar: '♣',
    defaultTileColor: '#052e16',
    defaultGlyphColor: '#22c55e',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'tree',
    isHarvestable: true,
    harvestTool: 'hatchet',
    harvestYield: { materialId: 'mat_wood', name: 'Scrap Wood 🌲', count: 1 },
    harvestReplacementTile: TileType.TreeStump,
    atlasCoord: { col: 12, row: 3 },
  },
  [TileType.Water]: {
    id: TileType.Water,
    name: 'Deep Water',
    description: 'Liquid waterway requiring aquatic traversal.',
    defaultChar: '~',
    defaultTileColor: '#082f49',
    defaultGlyphColor: '#38bdf8',
    isObstacle: true,
    isWater: true,
    blocksVision: false,
    castsShadow: false,
    atlasCoord: { col: 0, row: 3 },
  },
  [TileType.Path]: {
    id: TileType.Path,
    name: 'Dirt Path',
    description: 'Beaten travel road between settlements.',
    defaultChar: '░',
    defaultTileColor: '#27170a',
    defaultGlyphColor: '#d97706',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: true,
    atlasCoord: { col: 8, row: 2 },
  },
  [TileType.DungeonEntrance]: {
    id: TileType.DungeonEntrance,
    name: 'Dungeon Crypt Entrance',
    description: 'Subterranean threshold leading into danger.',
    defaultChar: 'Ω',
    defaultTileColor: '#172554',
    defaultGlyphColor: '#60a5fa',
    isObstacle: false,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'structure',
    isLightSource: true,
    lightRadius: 4,
    atlasCoord: { col: 10, row: 1 },
  },
  [TileType.TownGate]: {
    id: TileType.TownGate,
    name: 'Town Fortress Gate',
    description: 'Guarded threshold entering town courtyard.',
    defaultChar: '∏',
    defaultTileColor: '#1e293b',
    defaultGlyphColor: '#fbbf24',
    isObstacle: false,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'structure',
    atlasCoord: { col: 11, row: 1 },
  },
  [TileType.Table]: {
    id: TileType.Table,
    name: 'Wooden Table',
    description: 'Solid tavern and house dining table.',
    defaultChar: '╤',
    defaultTileColor: '#2b1810',
    defaultGlyphColor: '#b45309',
    isObstacle: true,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    atlasCoord: { col: 7, row: 4 },
  },
  [TileType.Chair]: {
    id: TileType.Chair,
    name: 'Wooden Chair',
    description: 'Handcrafted interior seating.',
    defaultChar: 'h',
    defaultTileColor: '#27170a',
    defaultGlyphColor: '#d97706',
    isObstacle: true,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    atlasCoord: { col: 8, row: 4 },
  },
  [TileType.Bed]: {
    id: TileType.Bed,
    name: 'Resting Bed',
    description: 'Comfortable interior bed for resting.',
    defaultChar: '§',
    defaultTileColor: '#31101e',
    defaultGlyphColor: '#f43f5e',
    isObstacle: true,
    isBed: true,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    atlasCoord: { col: 9, row: 4 },
  },
  [TileType.Campfire]: {
    id: TileType.Campfire,
    name: 'Outdoor Campfire',
    description: 'Crackling campfire providing warmth and cooking heat.',
    defaultChar: '▲',
    defaultTileColor: '#351205',
    defaultGlyphColor: '#ea580c',
    isObstacle: true,
    blocksVision: false,
    castsShadow: false,
    isLightSource: true,
    lightRadius: 5,
    atlasCoord: { col: 3, row: 4 },
  },
  [TileType.Anvil]: {
    id: TileType.Anvil,
    name: 'Blacksmith Anvil',
    description: 'Heavy iron forging workstation.',
    defaultChar: 'T',
    defaultTileColor: '#1e293b',
    defaultGlyphColor: '#94a3b8',
    isObstacle: true,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'prop',
    isIndoor: true,
    atlasCoord: { col: 6, row: 4 },
  },
  [TileType.Fireplace]: {
    id: TileType.Fireplace,
    name: 'Stone Fireplace',
    description: 'Built-in stone chimney hearth.',
    defaultChar: '♨',
    defaultTileColor: '#2e0f06',
    defaultGlyphColor: '#f97316',
    isObstacle: true,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'prop',
    isIndoor: true,
    isLightSource: true,
    lightRadius: 5,
    atlasCoord: { col: 5, row: 4 },
  },
  [TileType.Window]: {
    id: TileType.Window,
    name: 'Glass Window',
    description: 'Building aperture that allows vision but blocks movement.',
    defaultChar: '⊞',
    defaultTileColor: '#0c2238',
    defaultGlyphColor: '#7dd3fc',
    isObstacle: true,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    atlasCoord: { col: 12, row: 4 },
  },
  [TileType.Bush]: {
    id: TileType.Bush,
    name: 'Wild Berry Bush',
    description: 'Foliage harvestable for rations and seeds.',
    defaultChar: '*',
    defaultTileColor: '#052e16',
    defaultGlyphColor: '#4ade80',
    isObstacle: true,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'prop',
    isHarvestable: true,
    atlasCoord: { col: 15, row: 3 },
  },
  [TileType.Sign]: {
    id: TileType.Sign,
    name: 'Wooden Signpost',
    description: 'Informational territory marker.',
    defaultChar: '¶',
    defaultTileColor: '#27170a',
    defaultGlyphColor: '#f59e0b',
    isObstacle: true,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'prop',
    atlasCoord: { col: 14, row: 4 },
  },
  [TileType.Torch]: {
    id: TileType.Torch,
    name: 'Wall Torch',
    description: 'Mounted sconce casting steady illuminating glow.',
    defaultChar: 'i',
    defaultTileColor: '#2c1203',
    defaultGlyphColor: '#fbbf24',
    isObstacle: true,
    blocksVision: false,
    castsShadow: false,
    isLightSource: true,
    lightRadius: 6,
    atlasCoord: { col: 4, row: 4 },
  },
  [TileType.PineTree]: {
    id: TileType.PineTree,
    name: 'Pine Tree',
    description: 'Evergreen needle tree flourishing in tundra and mountains.',
    defaultChar: '♠',
    defaultTileColor: '#022c22',
    defaultGlyphColor: '#10b981',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'tree',
    isHarvestable: true,
    harvestTool: 'hatchet',
    harvestYield: { materialId: 'mat_pine_log', secondaryMaterialId: 'mat_wood', name: 'Aromatic Pine Log 🌲', count: 1, secondaryCount: 1 },
    harvestReplacementTile: TileType.TreeStump,
    atlasCoord: { col: 13, row: 3 },
  },
  [TileType.BirchTree]: {
    id: TileType.BirchTree,
    name: 'Birch Tree',
    description: 'Pale-barked deciduous tree.',
    defaultChar: '♠',
    defaultTileColor: '#064e3b',
    defaultGlyphColor: '#a7f3d0',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'tree',
    isHarvestable: true,
    harvestTool: 'hatchet',
    harvestYield: { materialId: 'mat_birch_log', secondaryMaterialId: 'mat_wood', name: 'Pale Birch Log 🌳', count: 1, secondaryCount: 1 },
    harvestReplacementTile: TileType.TreeStump,
    atlasCoord: { col: 14, row: 3 },
  },
  [TileType.CopperVein]: {
    id: TileType.CopperVein,
    name: 'Copper Ore Vein',
    description: 'Mineral-rich boulder yielding raw copper.',
    defaultChar: '▲',
    defaultTileColor: '#341a0e',
    defaultGlyphColor: '#fb923c',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'wall',
    isHarvestable: true,
    harvestTool: 'pickaxe',
    harvestYield: { materialId: 'mat_copper_ore', name: 'Raw Copper Ore ⛋', count: 1 },
    atlasCoord: { col: 1, row: 4 },
  },
  [TileType.IronVein]: {
    id: TileType.IronVein,
    name: 'Iron Ore Vein',
    description: 'Dense metallic lode yielding raw iron.',
    defaultChar: '▲',
    defaultTileColor: '#1e293b',
    defaultGlyphColor: '#cbd5e1',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'wall',
    isHarvestable: true,
    harvestTool: 'pickaxe',
    harvestYield: { materialId: 'mat_iron_ore', name: 'Raw Iron Ore ⛋', count: 1 },
    atlasCoord: { col: 2, row: 4 },
  },
  [TileType.WatchtowerWall]: {
    id: TileType.WatchtowerWall,
    name: 'Fortress Outpost Wall',
    description: 'Reinforced timber parapet.',
    defaultChar: '#',
    defaultTileColor: '#2b1a10',
    defaultGlyphColor: '#a16207',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'wall',
    isIndoor: true,
    atlasCoord: { col: 0, row: 5 },
  },
  [TileType.WatchtowerSlit]: {
    id: TileType.WatchtowerSlit,
    name: 'Archer Arrow Slit',
    description: 'Narrow firing slit in fortress wall.',
    defaultChar: '|',
    defaultTileColor: '#1c100a',
    defaultGlyphColor: '#ca8a04',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'wall',
    isIndoor: true,
    atlasCoord: { col: 1, row: 5 },
  },
  [TileType.WatchtowerDeck]: {
    id: TileType.WatchtowerDeck,
    name: 'Watchtower Deck',
    description: 'Elevated wooden observation platform.',
    defaultChar: '=',
    defaultTileColor: '#29180d',
    defaultGlyphColor: '#b45309',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isIndoor: true,
    isSafeForNpc: true,
    atlasCoord: { col: 2, row: 5 },
  },
  [TileType.WatchtowerFlag]: {
    id: TileType.WatchtowerFlag,
    name: 'Faction Territory Banner',
    description: 'Fluttering faction pennant.',
    defaultChar: 'P',
    defaultTileColor: '#3b0707',
    defaultGlyphColor: '#ef4444',
    isObstacle: true,
    blocksVision: false,
    castsShadow: true,
    shadowType: 'prop',
    atlasCoord: { col: 3, row: 5 },
  },
  [TileType.WatchtowerBarricade]: {
    id: TileType.WatchtowerBarricade,
    name: 'Spiked Wooden Barricade',
    description: 'Defensive obstacle deterring enemy charges.',
    defaultChar: 'X',
    defaultTileColor: '#26150b',
    defaultGlyphColor: '#d97706',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'prop',
    atlasCoord: { col: 4, row: 5 },
  },
  [TileType.TreeStump]: {
    id: TileType.TreeStump,
    name: 'Felled Tree Stump',
    description: 'Walkable remnant of a harvested tree.',
    defaultChar: 'o',
    defaultTileColor: '#1f130b',
    defaultGlyphColor: '#a16207',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: true,
    atlasCoord: { col: 0, row: 4 },
  },
  [TileType.Bedroll]: {
    id: TileType.Bedroll,
    name: 'Traveler Bedroll',
    description: 'Portable sleeping gear on the trail.',
    defaultChar: '_',
    defaultTileColor: '#291515',
    defaultGlyphColor: '#f43f5e',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: true,
    atlasCoord: { col: 10, row: 4 },
  },
  [TileType.FieldTent]: {
    id: TileType.FieldTent,
    name: 'Caravan Tent',
    description: 'Sturdy canvas shelter for wilderness rest.',
    defaultChar: '▲',
    defaultTileColor: '#2d1b10',
    defaultGlyphColor: '#f59e0b',
    isObstacle: true,
    blocksVision: true,
    castsShadow: true,
    shadowType: 'structure',
    atlasCoord: { col: 11, row: 4 },
  },
  [TileType.Ice]: {
    id: TileType.Ice,
    name: 'Glacial Ice Sheet',
    description: 'Frozen, slick surface allowing high-speed sliding.',
    defaultChar: '❄',
    defaultTileColor: '#082f49',
    defaultGlyphColor: '#7dd3fc',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: true,
  },
  [TileType.Ash]: {
    id: TileType.Ash,
    name: 'Scorched Ash Field',
    description: 'Burned ground left in the wake of inferno.',
    defaultChar: '░',
    defaultTileColor: '#18181b',
    defaultGlyphColor: '#71717a',
    isObstacle: false,
    blocksVision: false,
    castsShadow: false,
    isSafeForNpc: true,
  },
};

/**
 * Dynamic registry map supporting custom user & modded tiles.
 */
const dynamicTileRegistry = new Map<string, TileDefinition>(
  Object.entries(MASTER_TILE_REGISTRY)
);

/**
 * Registers a new tile or overrides an existing tile definition.
 */
export function registerCustomTile(def: TileDefinition): void {
  dynamicTileRegistry.set(def.id, def);
}

/**
 * Retrieves the TileDefinition for a given TileType or string ID.
 */
export function getTileDefinition(tile: TileType | string | undefined): TileDefinition | undefined {
  if (!tile) return undefined;
  return dynamicTileRegistry.get(tile);
}

/**
 * Checks if a tile is a solid obstacle for movement.
 */
export function isTileObstacle(
  tile: TileType | string | undefined,
  options?: { canOpenDoors?: boolean; isWaterWalkable?: boolean; isBedWalkable?: boolean }
): boolean {
  if (!tile) return true;
  const def = dynamicTileRegistry.get(tile);
  if (!def) return false;

  // Specific override checks for dynamic traversals
  if (def.isWater) {
    return !options?.isWaterWalkable;
  }
  if (def.canBeOpened) {
    return !options?.canOpenDoors;
  }
  if (def.isBed) {
    return !options?.isBedWalkable;
  }

  return def.isObstacle;
}

/**
 * Checks if a tile is walkable by entities.
 */
export function isTileWalkable(
  tile: TileType | string | undefined,
  options?: { canOpenDoors?: boolean; isWaterWalkable?: boolean; isBedWalkable?: boolean }
): boolean {
  return !isTileObstacle(tile, options);
}

/**
 * Checks if a tile blocks line of sight / field of view.
 */
export function doesTileBlockVision(tile: TileType | string | undefined): boolean {
  if (!tile) return false;
  const def = dynamicTileRegistry.get(tile);
  return def ? !!def.blocksVision : false;
}

/**
 * Checks if a tile casts dynamic sun/moon shadows.
 */
export function isTileShadowCaster(tile: TileType | string | undefined): boolean {
  if (!tile) return false;
  const def = dynamicTileRegistry.get(tile);
  return def ? !!def.castsShadow : false;
}

/**
 * Gets shadow rendering archetype ('wall', 'tree', 'prop', 'structure').
 */
export function getTileShadowType(tile: TileType | string | undefined): ShadowCastingType | null {
  if (!tile) return null;
  const def = dynamicTileRegistry.get(tile);
  return def?.shadowType ?? null;
}

/**
 * Checks if a tile counts as building interior for acoustic muffling and shelter.
 */
export function isTileIndoor(tile: TileType | string | undefined): boolean {
  if (!tile) return false;
  const def = dynamicTileRegistry.get(tile);
  return def ? !!def.isIndoor : false;
}

/**
 * Checks if a tile is safe for placing NPCs and neutral spawns.
 */
export function isTileSafeForNpc(tile: TileType | string | undefined): boolean {
  if (!tile) return false;
  const def = dynamicTileRegistry.get(tile);
  if (!def) return true;
  if (def.isSafeForNpc !== undefined) return def.isSafeForNpc;
  return !def.isObstacle;
}

/**
 * Checks if a tile is an ambient light source.
 */
export function isTileLightSource(tile: TileType | string | undefined): boolean {
  if (!tile) return false;
  const def = dynamicTileRegistry.get(tile);
  return def ? !!def.isLightSource : false;
}

/**
 * Gets light emission properties for a tile.
 */
export function getTileLightInfo(tile: TileType | string | undefined): { radius: number; color?: string } | null {
  if (!tile) return null;
  const def = dynamicTileRegistry.get(tile);
  if (def?.isLightSource) {
    return {
      radius: def.lightRadius ?? 4,
      color: def.lightColor,
    };
  }
  return null;
}

/**
 * Returns all currently registered tile definitions.
 */
export function getAllRegisteredTiles(): TileDefinition[] {
  return Array.from(dynamicTileRegistry.values());
}

/**
 * Checks if a tile is harvestable for resources (trees, ores, etc.).
 */
export function isTileHarvestable(tile: TileType | string | undefined): boolean {
  if (!tile) return false;
  const def = dynamicTileRegistry.get(tile);
  return !!def?.isHarvestable;
}

/**
 * Gets the required tool for harvesting a tile.
 */
export function getTileHarvestTool(tile: TileType | string | undefined): 'hatchet' | 'pickaxe' | 'none' | undefined {
  if (!tile) return undefined;
  const def = dynamicTileRegistry.get(tile);
  return def?.harvestTool;
}

/**
 * Gets the declarative harvest yield data for a tile.
 */
export function getTileHarvestYield(tile: TileType | string | undefined): TileHarvestYield | undefined {
  if (!tile) return undefined;
  const def = dynamicTileRegistry.get(tile);
  return def?.harvestYield;
}

/**
 * Gets the replacement tile after a tile is harvested.
 */
export function getTileHarvestReplacement(tile: TileType | string | undefined, isOverworld: boolean): TileType {
  if (!tile) return isOverworld ? TileType.Grass : TileType.Floor;
  const def = dynamicTileRegistry.get(tile);
  if (def?.harvestReplacementTile) {
    return def.harvestReplacementTile;
  }
  return isOverworld ? TileType.Grass : TileType.Floor;
}

