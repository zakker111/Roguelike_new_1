/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { assetPreloader } from './AssetPreloader';
import { tilesetAtlasManager } from './TilesetAtlasManager';
import {
  MockupPaletteTheme,
  AtlasDimensionConfig,
  getThemeAtlasGenerator,
} from './atlas';

export type { MockupPaletteTheme, AtlasDimensionConfig };
export * from './atlas';

/**
 * Master Procedural Atlas Coordinator
 * Delegates atlas rendering to modular theme generators under src/canvas/atlas/
 */
export class MockupAtlasGenerator {
  private static instance: MockupAtlasGenerator;
  private generatedCanvases: Map<string, HTMLCanvasElement> = new Map();
  private currentTheme: MockupPaletteTheme = 'classic';
  private baseSpriteSize: number = 32;

  public static getInstance(): MockupAtlasGenerator {
    if (!MockupAtlasGenerator.instance) {
      MockupAtlasGenerator.instance = new MockupAtlasGenerator();
    }
    return MockupAtlasGenerator.instance;
  }

  public getBaseSpriteSize(): number {
    return this.baseSpriteSize;
  }

  public setBaseSpriteSize(size: number) {
    this.baseSpriteSize = Math.max(16, Math.min(128, size));
    tilesetAtlasManager.setSpriteSize(this.baseSpriteSize);
    this.generateAllAtlases(this.currentTheme, this.baseSpriteSize);
  }

  public getTheme(): MockupPaletteTheme {
    return this.currentTheme;
  }

  public setTheme(theme: MockupPaletteTheme) {
    this.currentTheme = theme;
    this.generateAllAtlases(theme, this.baseSpriteSize);
  }

  public getCanvas(key: string): HTMLCanvasElement | null {
    return this.generatedCanvases.get(key) || null;
  }

  public getDataUrl(key: string): string | null {
    const canvas = this.getCanvas(key);
    return canvas ? canvas.toDataURL('image/png') : null;
  }

  /**
   * Generates all procedural mockup atlases and automatically mounts them into AssetPreloader
   */
  public generateAllAtlases(theme: MockupPaletteTheme = 'classic', size: number = 32): {
    main: HTMLCanvasElement;
    entity: HTMLCanvasElement;
    boss: HTMLCanvasElement;
    items: HTMLCanvasElement;
  } {
    this.currentTheme = theme;
    this.baseSpriteSize = size;
    tilesetAtlasManager.setSpriteSize(size);

    const generator = getThemeAtlasGenerator(theme);
    const mainCanvas = generator.generateMainTileset(size);
    const entityCanvas = generator.generateEntityTileset(size);
    const bossCanvas = generator.generateBossTileset(size);
    const itemsCanvas = generator.generateItemsTileset(size);

    this.generatedCanvases.set('main_tileset', mainCanvas);
    this.generatedCanvases.set('entity_tileset', entityCanvas);
    this.generatedCanvases.set('boss_tileset', bossCanvas);
    this.generatedCanvases.set('items_tileset', itemsCanvas);

    // Register into AssetPreloader so TilesetRenderer immediately sees them
    assetPreloader.registerCanvas('main_tileset', mainCanvas);
    assetPreloader.registerCanvas('entity_tileset', entityCanvas);
    assetPreloader.registerCanvas('boss_tileset', bossCanvas);
    assetPreloader.registerCanvas('items_tileset', itemsCanvas);

    return {
      main: mainCanvas,
      entity: entityCanvas,
      boss: bossCanvas,
      items: itemsCanvas,
    };
  }

  public generateMainTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    return getThemeAtlasGenerator(theme).generateMainTileset(size);
  }

  public generateEntityTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    return getThemeAtlasGenerator(theme).generateEntityTileset(size);
  }

  public generateBossTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    return getThemeAtlasGenerator(theme).generateBossTileset(size);
  }

  public generateItemsTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    return getThemeAtlasGenerator(theme).generateItemsTileset(size);
  }
}

export const mockupAtlasGenerator = MockupAtlasGenerator.getInstance();
