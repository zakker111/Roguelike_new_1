/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme, IThemeAtlasGenerator } from './types';
import { classicAtlasGenerator } from './classicAtlasGenerator';
import { forestAtlasGenerator } from './forestAtlasGenerator';
import { infernalAtlasGenerator } from './infernalAtlasGenerator';

export * from './types';
export * from './themePalettes';
export * from './drawingPrimitives';
export * from './mainTilesetRenderer';
export * from './entityTilesetRenderer';
export * from './bossTilesetRenderer';
export * from './itemsTilesetRenderer';
export * from './classicAtlasGenerator';
export * from './forestAtlasGenerator';
export * from './infernalAtlasGenerator';

const THEME_GENERATOR_MAP: Record<string, IThemeAtlasGenerator> = {
  classic: classicAtlasGenerator,
  forest: forestAtlasGenerator,
  infernal: infernalAtlasGenerator,
};

/**
 * Registers or overrides a procedural theme generator strategy
 */
export function registerThemeAtlasGenerator(theme: string, generator: IThemeAtlasGenerator): void {
  THEME_GENERATOR_MAP[theme] = generator;
}

/**
 * Returns the theme generator strategy for a specific palette theme
 */
export function getThemeAtlasGenerator(theme: string = 'classic'): IThemeAtlasGenerator {
  return THEME_GENERATOR_MAP[theme] || classicAtlasGenerator;
}
