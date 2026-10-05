/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MockupPaletteTheme = 'classic' | 'forest' | 'infernal';

export interface AtlasDimensionConfig {
  spriteSize: number; // Base cell dimension (e.g. 16, 32, 48, 64)
  cols: number;
  rows: number;
}

export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ThemePaletteColors {
  wallBase: string;
  wallHighlight: string;
  wallShadow: string;
  floor: string;
  floorAlt: string;
  grass: string;
  grassTuft: string;
  water: string;
  waterHighlight: string;
  waterFoam: string;
  path: string;
  sand: string;
  snow: string;
  lava: string;
  wood: string;
  woodLight: string;
  gold: string;
  crystal: string;
}

export interface IThemeAtlasGenerator {
  readonly theme: MockupPaletteTheme;
  readonly displayName: string;
  generateMainTileset(size?: number): HTMLCanvasElement;
  generateEntityTileset(size?: number): HTMLCanvasElement;
  generateBossTileset(size?: number): HTMLCanvasElement;
  generateItemsTileset(size?: number): HTMLCanvasElement;
}
