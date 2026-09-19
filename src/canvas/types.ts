/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../types';

export type GraphicsVisualMode = 'classic_glyph' | 'animated_tileset';

export type TilesetSourceType = 'classic_png' | 'classic_code';

export interface SpriteSheetTileMapping {
  /** Column index on the sprite sheet (0-indexed) */
  sx: number;
  /** Row index on the sprite sheet (0-indexed) */
  sy: number;
  /** Total frames for an animated sequence (defaults to 1 for static elements) */
  frameCount?: number;
  /** Custom width multiplier (e.g. for large multi-tile boss characters) */
  widthMultiplier?: number;
  /** Custom height multiplier */
  heightMultiplier?: number;
  /** Animation speed multiplier: game ticks to spend on each visual frame */
  ticksPerFrame?: number;
}

export interface SpriteSheetConfig {
  /** Master switch to enable sprite-sheet textured rendering. Defaults to false to use default stylized text/emojis. */
  enabled: boolean;
  /** File path or URL to the spritesheet image file */
  imageSrc: string;
  /** Native size of a single tile in the target spritesheet (typically 16 or 32 pixels) */
  spriteSize: number;
  /** Mapping of TileType enum values to their coordinates and animation sequences */
  tileMappings: Partial<Record<TileType, SpriteSheetTileMapping>>;
  /** Biome specific mappings to override standard TileType mappings dynamically */
  biomeMappings?: Record<string, Partial<Record<TileType, SpriteSheetTileMapping>>>;
  /** Traps mapping by trap name */
  trapMappings?: Record<string, SpriteSheetTileMapping>;
  /** Chest mappings by open/closed status */
  chestMappings?: {
    closed: SpriteSheetTileMapping;
    opened: SpriteSheetTileMapping;
  };
  /** Mapping of entity character characters (e.g. '@', 'S', 'O', 'G') to their animated sprite rows */
  entityMappings?: Record<string, SpriteSheetTileMapping>;
}

export const DEFAULT_TILESET_CONFIG: SpriteSheetConfig = {
  enabled: false,
  imageSrc: '/assets/tileset.png',
  spriteSize: 32,
  tileMappings: {},
  biomeMappings: {},
  trapMappings: {
    'Spikes': { sx: 5, sy: 5, frameCount: 1 },
    'FireVent': { sx: 6, sy: 5, frameCount: 1 },
    'PoisonGas': { sx: 7, sy: 5, frameCount: 1 }
  },
  chestMappings: {
    closed: { sx: 13, sy: 4, frameCount: 1 },
    opened: { sx: 14, sy: 4, frameCount: 1 }
  },
  entityMappings: {
    '@': { sx: 0, sy: 0, frameCount: 4, ticksPerFrame: 12 },
    'S': { sx: 0, sy: 20, frameCount: 4, ticksPerFrame: 12 },
    'O': { sx: 0, sy: 24, frameCount: 4, ticksPerFrame: 12 },
    'G': { sx: 0, sy: 16, frameCount: 4, ticksPerFrame: 12 },
    'D': { sx: 0, sy: 32, frameCount: 4, ticksPerFrame: 12 },
  }
};

export interface TilesetSourceDefinition {
  id: TilesetSourceType;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  sourceType: 'png' | 'code';
}

export const TILESET_SOURCES: Record<TilesetSourceType, TilesetSourceDefinition> = {
  classic_png: {
    id: 'classic_png',
    name: 'Instinct Classic (PNG Mockups)',
    shortName: 'Instinct PNG',
    badge: 'public/tilesets/*.png (Static PNG)',
    description: 'Instinct Classic (PNG): Authentic pre-rendered pixel art tilesets loaded directly from /public/tilesets/ mockup assets.',
    sourceType: 'png',
  },
  classic_code: {
    id: 'classic_code',
    name: 'Instinct Classic (Procedural Code)',
    shortName: 'Instinct Code',
    badge: 'MockupAtlasGenerator (Canvas Code)',
    description: 'Instinct Classic (Code): Real-time procedural pixel art generated algorithmically by TypeScript on offscreen HTML5 canvases.',
    sourceType: 'code',
  },
};

export interface TileRenderDetails {
  tileType: string;
  char: string;
  color: string;
  bgColor?: string;
  bitmask?: number;
  tileSize: number;
  isVisible: boolean;
  isExplored: boolean;
}

export interface EntityRenderDetails {
  id: string;
  name: string;
  symbol: string;
  color: string;
  animState?: 'idle' | 'walk' | 'attack' | 'hurt' | 'cast' | 'death';
  direction?: 'north' | 'south' | 'east' | 'west';
  size?: number;
}

export interface IVisualRenderer {
  mode: GraphicsVisualMode;
  setMode(mode: GraphicsVisualMode): void;
  getMode(): GraphicsVisualMode;
  drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void;
  drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void;
  renderVFX(ctx: CanvasRenderingContext2D, dt: number): void;
}

const STORAGE_KEY = 'roguelike_graphics_mode';
const STORAGE_KEY_TILESET_SOURCE = 'roguelike_tileset_source';

let _activeVisualMode: GraphicsVisualMode = 'classic_glyph';

export function getActiveVisualMode(): GraphicsVisualMode {
  return _activeVisualMode;
}

export function setActiveVisualMode(mode: GraphicsVisualMode): void {
  _activeVisualMode = mode;
}

export function isTilesetModeActive(): boolean {
  return _activeVisualMode === 'animated_tileset';
}

export function getStoredGraphicsMode(): GraphicsVisualMode {
  // Always default to ASCII (classic_glyph) on game launch / start
  return 'classic_glyph';
}

export function setStoredGraphicsMode(mode: GraphicsVisualMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function getStoredTilesetSource(): TilesetSourceType {
  try {
    const val = localStorage.getItem(STORAGE_KEY_TILESET_SOURCE);
    if (val === 'classic_png' || val === 'classic_code') {
      return val;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return 'classic_png';
}

export function setStoredTilesetSource(source: TilesetSourceType): void {
  try {
    localStorage.setItem(STORAGE_KEY_TILESET_SOURCE, source);
  } catch (e) {
    // Ignore localStorage errors
  }
}
