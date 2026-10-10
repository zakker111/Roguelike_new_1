/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standard semantic room classification
 */
export type DungeonRoomType =
  | 'entrance'
  | 'exit'
  | 'encounter'
  | 'treasure'
  | 'shop'
  | 'shrine'
  | 'boss'
  | 'secret'
  | 'corridor_hub'
  | 'standard';

/**
 * Architecture shape archetype of a room
 */
export type DungeonRoomShape =
  | 'rectangle'
  | 'circular'
  | 'cross'
  | 'pillared'
  | 'cavern'
  | 'composite';

/**
 * Grid coordinates point
 */
export interface DungeonPoint {
  x: number;
  y: number;
}

/**
 * Rectangular bounds or room descriptor
 */
export interface DungeonRoomDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: DungeonRoomType;
  shape: DungeonRoomShape;
  doors?: DungeonPoint[];
  tags?: string[];
  customData?: Record<string, any>;
}

/**
 * Blueprint template for generating rooms with specific semantics and dimensions
 */
export interface RoomTemplate {
  id: string;
  name: string;
  type: DungeonRoomType;
  shape: DungeonRoomShape;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  weight: number;
  tags?: string[];
  description?: string;
  mandatoryFeatures?: string[];
  maxPerFloor?: number;
  minDepth?: number;
  customData?: Record<string, any>;
}

/**
 * Corridor connection between rooms or points
 */
export interface DungeonCorridorDefinition {
  fromRoomId?: string;
  toRoomId?: string;
  points: DungeonPoint[];
  width: number;
}

/**
 * Generic tile metadata representation in engine maps
 * Values are string keys (e.g. 'floor', 'wall', 'door', 'water', 'chasm', 'stairs_up', 'stairs_down')
 */
export type DungeonTile = string;

/**
 * Feature or prop placed within a dungeon
 */
export interface DungeonFeaturePlacement {
  id: string;
  type: 'chest' | 'trap' | 'shrine' | 'pillar' | 'torch' | 'shop_stall' | 'altar' | 'secret_cache' | string;
  x: number;
  y: number;
  properties?: Record<string, any>;
}

/**
 * Entity spawn point within a dungeon
 */
export interface DungeonSpawnPoint {
  id?: string;
  entityType: 'player' | 'enemy' | 'npc' | 'boss' | 'merchant' | string;
  x: number;
  y: number;
  tier?: number;
  tags?: string[];
  aiRole?: string;
}

/**
 * Result produced by any generic dungeon generator
 */
export interface DungeonGenerationResult {
  width: number;
  height: number;
  grid: DungeonTile[][];
  rooms: DungeonRoomDefinition[];
  corridors: DungeonCorridorDefinition[];
  playerSpawn: DungeonPoint;
  stairsDown?: DungeonPoint;
  features: DungeonFeaturePlacement[];
  spawns: DungeonSpawnPoint[];
  metadata?: Record<string, any>;
}

/**
 * Configurable generator parameters
 */
export interface DungeonGeneratorConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  depth?: number;
  seed?: number;
  
  // Room parameters
  minRooms?: number;
  maxRooms?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  roomPadding?: number;
  corridorWidth?: number;

  // Archetype distribution probabilities (0-1)
  treasureRoomChance?: number;
  shopRoomChance?: number;
  shrineRoomChance?: number;
  secretRoomChance?: number;

  // Custom configuration parameters
  extraParameters?: Record<string, any>;
}

/**
 * Universal interface for all pluggable dungeon generator algorithms
 */
export interface IDungeonGenerator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  generate(config: DungeonGeneratorConfig): DungeonGenerationResult;
}
