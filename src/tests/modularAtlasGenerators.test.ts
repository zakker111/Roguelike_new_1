/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Node.js test environment Canvas Mocking
if (typeof (globalThis as any).HTMLCanvasElement === 'undefined') {
  (globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {
    public width = 0;
    public height = 0;
    public getContext() {
      return {
        imageSmoothingEnabled: false,
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        ellipse: () => {},
        fill: () => {},
        stroke: () => {},
        drawImage: () => {},
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
      };
    }
    public toDataURL() {
      return 'data:image/png;base64,mockAtlasPng';
    }
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return new (globalThis as any).HTMLCanvasElement();
      }
      return {};
    },
  };
}

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockupAtlasGenerator,
  mockupAtlasGenerator,
  MockupPaletteTheme,
} from '../canvas/MockupAtlasGenerator';
import {
  getThemeAtlasGenerator,
  classicAtlasGenerator,
  forestAtlasGenerator,
  infernalAtlasGenerator,
  THEME_PALETTES,
  getThemePalette,
  drawPixelRect,
  getCell,
} from '../canvas/atlas';

describe('Modular Atlas Generators & Procedural Synthesis Engine', () => {
  beforeEach(() => {
    mockupAtlasGenerator.setTheme('classic');
    mockupAtlasGenerator.setBaseSpriteSize(32);
  });

  describe('1. Theme Palette Registry', () => {
    it('defines distinct palettes for all supported themes', () => {
      const themes: MockupPaletteTheme[] = ['classic', 'forest', 'infernal'];
      for (const theme of themes) {
        const palette = THEME_PALETTES[theme];
        expect(palette).toBeDefined();
        expect(palette.wallBase).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(palette.water).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(palette.grass).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(palette.floor).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('falls back to classic palette on unknown theme request', () => {
      const palette = getThemePalette('unknown' as any);
      expect(palette).toEqual(THEME_PALETTES.classic);
    });
  });

  describe('2. Drawing Primitives & Helpers', () => {
    it('calculates cell bounds correctly with getCell', () => {
      const c = getCell(3, 4, 32);
      expect(c.x).toBe(96);
      expect(c.y).toBe(128);
      expect(c.w).toBe(32);
      expect(c.h).toBe(32);
    });

    it('draws pixel rectangles cleanly with drawPixelRect', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      expect(() => {
        drawPixelRect(ctx, 4, 4, 24, 24, '#ff0000');
        drawPixelRect(ctx, 32, 4, 24, 24, '#00ff00', '#000000');
      }).not.toThrow();
    });
  });

  describe('3. Modular Theme Generators Strategy Pattern', () => {
    it('returns the registered strategy for each theme', () => {
      expect(getThemeAtlasGenerator('classic')).toBe(classicAtlasGenerator);
      expect(getThemeAtlasGenerator('forest')).toBe(forestAtlasGenerator);
      expect(getThemeAtlasGenerator('infernal')).toBe(infernalAtlasGenerator);
      expect(getThemeAtlasGenerator('invalid' as any)).toBe(classicAtlasGenerator);
    });

    it('classic generator synthesizes all 4 sheets with expected dimensions', () => {
      const main = classicAtlasGenerator.generateMainTileset(32);
      expect(main.width).toBe(16 * 32); // 512
      expect(main.height).toBe(16 * 32); // 512

      const entity = classicAtlasGenerator.generateEntityTileset(32);
      expect(entity.width).toBe(16 * 32); // 512
      expect(entity.height).toBe(72 * 32); // 2304

      const boss = classicAtlasGenerator.generateBossTileset(32);
      expect(boss.width).toBe(512);
      expect(boss.height).toBe(512);

      const items = classicAtlasGenerator.generateItemsTileset(32);
      expect(items.width).toBe(16 * 32);
      expect(items.height).toBe(16 * 32);
    });

    it('forest and infernal generators synthesize valid canvases', () => {
      const forest = forestAtlasGenerator.generateEntityTileset(16);
      expect(forest.width).toBe(16 * 16);
      expect(forest.height).toBe(72 * 16);

      const infernal = infernalAtlasGenerator.generateBossTileset(16);
      expect(infernal.width).toBe(512);
      expect(infernal.height).toBe(512);
    });
  });

  describe('4. Master Coordinator MockupAtlasGenerator', () => {
    it('implements singleton pattern and delegates to active theme generator', () => {
      const instance = MockupAtlasGenerator.getInstance();
      expect(instance).toBe(mockupAtlasGenerator);

      mockupAtlasGenerator.setTheme('forest');
      expect(mockupAtlasGenerator.getTheme()).toBe('forest');

      mockupAtlasGenerator.setBaseSpriteSize(48);
      expect(mockupAtlasGenerator.getBaseSpriteSize()).toBe(48);

      const atlases = mockupAtlasGenerator.generateAllAtlases('forest', 32);
      expect(atlases.main).toBeInstanceOf(HTMLCanvasElement);
      expect(atlases.entity).toBeInstanceOf(HTMLCanvasElement);
      expect(atlases.boss).toBeInstanceOf(HTMLCanvasElement);
      expect(atlases.items).toBeInstanceOf(HTMLCanvasElement);

      expect(mockupAtlasGenerator.getCanvas('main_tileset')).toBe(atlases.main);
      expect(mockupAtlasGenerator.getDataUrl('main_tileset')).toBeTruthy();
    });

    it('clamps sprite sizes within safe bounds [16, 128]', () => {
      mockupAtlasGenerator.setBaseSpriteSize(4);
      expect(mockupAtlasGenerator.getBaseSpriteSize()).toBe(16);

      mockupAtlasGenerator.setBaseSpriteSize(256);
      expect(mockupAtlasGenerator.getBaseSpriteSize()).toBe(128);
    });
  });
});
