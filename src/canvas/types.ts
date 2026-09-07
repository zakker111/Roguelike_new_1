/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GraphicsVisualMode = 'classic_glyph' | 'animated_tileset';

export type TilesetSourceType = 'classic_png' | 'classic_code';

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
