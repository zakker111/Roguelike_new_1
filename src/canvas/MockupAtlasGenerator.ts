/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../types';
import { assetPreloader } from './AssetPreloader';
import { tilesetAtlasManager } from './TilesetAtlasManager';

export type MockupPaletteTheme = 'classic' | 'cyber' | 'forest' | 'infernal';

export interface AtlasDimensionConfig {
  spriteSize: number; // Base cell dimension (e.g. 16, 32, 48, 64)
  cols: number;
  rows: number;
}

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

    const mainCanvas = this.generateMainTileset(theme, size);
    const entityCanvas = this.generateEntityTileset(theme, size);
    const bossCanvas = this.generateBossTileset(theme, size);
    const itemsCanvas = this.generateItemsTileset(theme, size);

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

  /**
   * Helper to draw a crisp pixel-art style rounded or beveled rectangle
   */
  private drawPixelRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke?: string
  ) {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(w) - 1, Math.floor(h) - 1);
    }
  }

  // =========================================================================
  // 1. MAIN TERRAIN & PROPS TILESET (512x512 with 16x16 grid of 32px tiles)
  // =========================================================================
  public generateMainTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    const cols = 16;
    const rows = 16;
    const canvas = document.createElement('canvas');
    canvas.width = cols * size;
    canvas.height = rows * size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Background transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Theme color palettes
    const palette = {
      classic: {
        wallBase: '#475569',
        wallHighlight: '#94a3b8',
        wallShadow: '#1e293b',
        floor: '#1e293b',
        floorAlt: '#334155',
        grass: '#15803d',
        grassTuft: '#22c55e',
        water: '#1d4ed8',
        waterHighlight: '#60a5fa',
        waterFoam: '#e0f2fe',
        path: '#64748b',
        sand: '#d97706',
        snow: '#e2e8f0',
        lava: '#dc2626',
        wood: '#78350f',
        woodLight: '#b45309',
        gold: '#fbbf24',
        crystal: '#38bdf8',
      },
      cyber: {
        wallBase: '#1e1b4b',
        wallHighlight: '#818cf8',
        wallShadow: '#0f0e26',
        floor: '#09090b',
        floorAlt: '#18181b',
        grass: '#064e3b',
        grassTuft: '#10b981',
        water: '#0369a1',
        waterHighlight: '#38bdf8',
        waterFoam: '#a5f3fc',
        path: '#334155',
        sand: '#9a3412',
        snow: '#64748b',
        lava: '#ec4899',
        wood: '#312e81',
        woodLight: '#4f46e5',
        gold: '#eab308',
        crystal: '#a855f7',
      },
      forest: {
        wallBase: '#3f3f46',
        wallHighlight: '#71717a',
        wallShadow: '#18181b',
        floor: '#292524',
        floorAlt: '#44403c',
        grass: '#166534',
        grassTuft: '#4ade80',
        water: '#0e7490',
        waterHighlight: '#22d3ee',
        waterFoam: '#cffafe',
        path: '#78716c',
        sand: '#b45309',
        snow: '#f1f5f9',
        lava: '#b91c1c',
        wood: '#57300a',
        woodLight: '#92400e',
        gold: '#f59e0b',
        crystal: '#10b981',
      },
      infernal: {
        wallBase: '#262626',
        wallHighlight: '#7f1d1d',
        wallShadow: '#0a0a0a',
        floor: '#171717',
        floorAlt: '#27272a',
        grass: '#3f1a0e',
        grassTuft: '#b45309',
        water: '#7f1d1d',
        waterHighlight: '#f87171',
        waterFoam: '#fca5a5',
        path: '#451a03',
        sand: '#78350f',
        snow: '#52525b',
        lava: '#ef4444',
        wood: '#450a0a',
        woodLight: '#991b1b',
        gold: '#f97316',
        crystal: '#dc2626',
      },
    }[theme];

    // Helper to get cell rect
    const getCell = (col: number, row: number) => ({
      x: col * size,
      y: row * size,
      w: size,
      h: size,
    });

    // --- ROWS 0 to 3, COLS 0..3: 16-Bitmask Wall Autotiles ---
    for (let bitmask = 0; bitmask < 16; bitmask++) {
      const col = bitmask % 4;
      const row = Math.floor(bitmask / 4);
      const c = getCell(col, row);

      // Base wall solid stone
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);

      // Mortar brick lines
      ctx.fillStyle = palette.wallShadow;
      ctx.fillRect(c.x, c.y + c.h * 0.5, c.w, 1);
      ctx.fillRect(c.x + c.w * 0.5, c.y, 1, c.h * 0.5);
      ctx.fillRect(c.x + c.w * 0.25, c.y + c.h * 0.5, 1, c.h * 0.5);
      ctx.fillRect(c.x + c.w * 0.75, c.y + c.h * 0.5, 1, c.h * 0.5);

      // Highlight top rim
      ctx.fillStyle = palette.wallHighlight;
      ctx.fillRect(c.x + 1, c.y + 1, c.w - 2, 2);

      // Cardinal connectivity visual cues (N=1, E=2, S=4, W=8)
      if (bitmask & 1) ctx.fillRect(c.x + c.w * 0.3, c.y, c.w * 0.4, 2); // N
      if (bitmask & 2) ctx.fillRect(c.x + c.w - 2, c.y + c.h * 0.3, 2, c.h * 0.4); // E
      if (bitmask & 4) ctx.fillRect(c.x + c.w * 0.3, c.y + c.h - 2, c.w * 0.4, 2); // S
      if (bitmask & 8) ctx.fillRect(c.x, c.y + c.h * 0.3, 2, c.h * 0.4); // W
    }

    // --- ROWS 0 to 3, COLS 4..7: 16-Bitmask Water Autotiles ---
    for (let bitmask = 0; bitmask < 16; bitmask++) {
      const col = 4 + (bitmask % 4);
      const row = Math.floor(bitmask / 4);
      const c = getCell(col, row);

      // Deep calm water base
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.water);

      // Gentle horizontal surface ripple lines
      ctx.fillStyle = palette.waterHighlight;
      ctx.fillRect(c.x + 4, c.y + 7, c.w - 8, 2);
      ctx.fillRect(c.x + 8, c.y + 17, c.w - 14, 2);

      // Delicate sun glint dots
      ctx.fillStyle = palette.waterFoam;
      ctx.fillRect(c.x + 6, c.y + 7, 2, 1);
      ctx.fillRect(c.x + 16, c.y + 17, 2, 1);

      // Cardinal shoreline foam borders on unattached edges (N=1, E=2, S=4, W=8)
      ctx.fillStyle = palette.waterFoam;
      if (!(bitmask & 1)) ctx.fillRect(c.x, c.y, c.w, 2); // North Shoreline Foam
      if (!(bitmask & 2)) ctx.fillRect(c.x + c.w - 2, c.y, 2, c.h); // East Shoreline Foam
      if (!(bitmask & 4)) ctx.fillRect(c.x, c.y + c.h - 2, c.w, 2); // South Shoreline Foam
      if (!(bitmask & 8)) ctx.fillRect(c.x, c.y, 2, c.h); // West Shoreline Foam
    }

    // --- ROWS 0 to 3, COLS 8..11: 16-Bitmask Path / Road Autotiles ---
    for (let bitmask = 0; bitmask < 16; bitmask++) {
      const col = 8 + (bitmask % 4);
      const row = Math.floor(bitmask / 4);
      const c = getCell(col, row);

      // Base terrain under path (Darker dirt)
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1c1917');

      // Cobblestones center ribbon
      ctx.fillStyle = palette.path;
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);

      // Cardinal connections
      if (bitmask & 1) ctx.fillRect(c.x + 6, c.y, c.w - 12, 5); // N
      if (bitmask & 2) ctx.fillRect(c.x + c.w - 5, c.y + 6, 5, c.h - 12); // E
      if (bitmask & 4) ctx.fillRect(c.x + 6, c.y + c.h - 5, c.w - 12, 5); // S
      if (bitmask & 8) ctx.fillRect(c.x, c.y + 6, 5, c.h - 12); // W

      // Individual round paving stones
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x + 8, c.y + 8, 4, 4);
      ctx.fillRect(c.x + 18, c.y + 10, 5, 4);
      ctx.fillRect(c.x + 10, c.y + 18, 5, 5);
      ctx.fillRect(c.x + 18, c.y + 20, 4, 4);
    }

    // --- ROW 0 (Cols 12..15): Core Basic Ground Tiles ---
    // Col 12: Floor (Clean Low-Noise Stone Slab)
    {
      const c = getCell(12, 0);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
      ctx.fillStyle = palette.floorAlt;
      ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.fillStyle = palette.wallShadow;
      ctx.strokeRect(c.x + 1.5, c.y + 1.5, c.w - 3, c.h - 3);
      // Subtle center paver dot
      ctx.fillStyle = palette.floor;
      ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + c.h * 0.5 - 1, 2, 2);
    }
    // Col 13: Grass (Vibrant Green with neat blade tufts)
    {
      const c = getCell(13, 0);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.grass);
      ctx.fillStyle = palette.grassTuft;
      ctx.fillRect(c.x + 6, c.y + 8, 2, 4);
      ctx.fillRect(c.x + 8, c.y + 10, 2, 3);
      ctx.fillRect(c.x + 20, c.y + 18, 2, 4);
      ctx.fillRect(c.x + 22, c.y + 20, 2, 3);
      ctx.fillRect(c.x + 14, c.y + 22, 2, 3);
    }
    // Col 14: Sand (Warm Golden Dunes)
    {
      const c = getCell(14, 0);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.sand);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x + 4, c.y + 8, 6, 2);
      ctx.fillRect(c.x + 14, c.y + 18, 8, 2);
      ctx.fillRect(c.x + 22, c.y + 10, 4, 1);
    }
    // Col 15: Snow (Crisp Pale Crystalline Snow)
    {
      const c = getCell(15, 0);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.snow);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x + 6, c.y + 12, 3, 2);
      ctx.fillRect(c.x + 18, c.y + 8, 3, 2);
      ctx.fillRect(c.x + 14, c.y + 22, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x + 8, c.y + 13, 1, 1);
      ctx.fillRect(c.x + 20, c.y + 9, 1, 1);
    }

    // --- ROW 1 (Cols 12..15): Portals, Doors & Signs ---
    // Col 12: Lava (Glowing Magma Pool)
    {
      const c = getCell(12, 1);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.lava);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(c.x + 4, c.y + 8, 8, 3);
      ctx.fillRect(c.x + 16, c.y + 16, 10, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(c.x + 6, c.y + 9, 4, 1);
      ctx.fillRect(c.x + 19, c.y + 17, 4, 2);
    }
    // Col 13: Wooden Door Closed (Sturdy Timber & Wrought Iron Bands)
    {
      const c = getCell(13, 1);
      // Dark door frame outline
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1c1917');
      // Rich vertical wood planks
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      // Plank tone variation
      ctx.fillStyle = palette.woodLight;
      ctx.fillRect(c.x + 4, c.y + 3, 6, c.h - 6);
      ctx.fillRect(c.x + 12, c.y + 3, 7, c.h - 6);
      ctx.fillRect(c.x + 21, c.y + 3, 6, c.h - 6);
      // Dark plank separation grooves
      ctx.fillStyle = '#291204';
      ctx.fillRect(c.x + 10, c.y + 2, 2, c.h - 4);
      ctx.fillRect(c.x + 19, c.y + 2, 2, c.h - 4);
      // Wrought-iron reinforced horizontal cross-bands
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(c.x + 2, c.y + 7, c.w - 4, 3);
      ctx.fillRect(c.x + 2, c.y + c.h - 10, c.w - 4, 3);
      // Heavy iron studs
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x + 5, c.y + 8, 1, 1);
      ctx.fillRect(c.x + 14, c.y + 8, 1, 1);
      ctx.fillRect(c.x + 23, c.y + 8, 1, 1);
      ctx.fillRect(c.x + 5, c.y + c.h - 9, 1, 1);
      ctx.fillRect(c.x + 14, c.y + c.h - 9, 1, 1);
      ctx.fillRect(c.x + 23, c.y + c.h - 9, 1, 1);
      // Polished brass doorknob & keyhole
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(c.x + c.w - 8, c.y + c.h * 0.5 - 2, 4, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(c.x + c.w - 7, c.y + c.h * 0.5 - 2, 2, 2);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(c.x + c.w - 6, c.y + c.h * 0.5 + 2, 2, 3);
    }
    // Col 14: Wooden Door Open (Stone doorway threshold with door swung open)
    {
      const c = getCell(14, 1);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
      // Stone threshold lintel & jambs
      ctx.fillStyle = '#334155';
      ctx.fillRect(c.x, c.y, c.w, 3);
      ctx.fillRect(c.x, c.y, 4, c.h);
      ctx.fillRect(c.x + c.w - 4, c.y, 4, c.h);
      // Dark interior opening
      ctx.fillStyle = '#090d16';
      ctx.fillRect(c.x + 8, c.y + 3, c.w - 12, c.h - 3);
      // Swung-open wooden door panel on left
      this.drawPixelRect(ctx, c.x + 2, c.y + 3, 6, c.h - 5, palette.woodLight, '#1c1917');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(c.x + 3, c.y + 8, 4, 2);
      ctx.fillRect(c.x + 3, c.y + c.h - 10, 4, 2);
    }
    // Col 15: Signpost
    {
      const c = getCell(15, 1);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Wooden stake
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + c.w * 0.44, c.y + 12, 4, c.h - 14);
      // Plaque board
      this.drawPixelRect(ctx, c.x + 4, c.y + 4, c.w - 8, 12, palette.woodLight, palette.wood);
      // Inscribed text lines
      ctx.fillStyle = '#451a03';
      ctx.fillRect(c.x + 7, c.y + 7, c.w - 14, 2);
      ctx.fillRect(c.x + 7, c.y + 11, c.w - 18, 2);
    }

    // --- ROW 2 (Cols 12..15): Stairs & Dungeon Thresholds ---
    // Col 12: Stairs Down (Dark descent)
    {
      const c = getCell(12, 2);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
      for (let s = 0; s < 4; s++) {
        const stepY = c.y + 4 + s * 6;
        const shade = ['#475569', '#334155', '#1e293b', '#090d16'][s];
        ctx.fillStyle = shade;
        ctx.fillRect(c.x + 4, stepY, c.w - 8, 4);
        ctx.fillStyle = '#fbbf24'; // Gold edge indicator
        ctx.fillRect(c.x + 4, stepY, c.w - 8, 1);
      }
    }
    // Col 13: Stairs Up (Ascending Light)
    {
      const c = getCell(13, 2);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
      for (let s = 0; s < 4; s++) {
        const stepY = c.y + 4 + s * 6;
        const shade = ['#1e293b', '#334155', '#64748b', '#94a3b8'][s];
        ctx.fillStyle = shade;
        ctx.fillRect(c.x + 4 + (3 - s) * 2, stepY, c.w - 8 - (3 - s) * 4, 4);
        ctx.fillStyle = '#38bdf8'; // Sky blue edge indicator
        ctx.fillRect(c.x + 4 + (3 - s) * 2, stepY, c.w - 8 - (3 - s) * 4, 1);
      }
    }
    // Col 14: Dungeon Entrance (Arcane Archway Portal)
    {
      const c = getCell(14, 2);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#0f172a');
      // Outer stone arch
      ctx.fillStyle = palette.wallBase;
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.5, c.w * 0.44, 0, Math.PI * 2);
      ctx.fill();
      // Swirling purple abyss
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.5, c.w * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.5, c.w * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    // Col 15: Town Gate / Portcullis
    {
      const c = getCell(15, 2);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);
      // Stone arch gateway
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 4);
      // Iron bars
      ctx.fillStyle = '#cbd5e1';
      for (let b = 0; b < 4; b++) {
        ctx.fillRect(c.x + 6 + b * 5, c.y + 4, 2, c.h - 4);
      }
      // Horizontal crosstie
      ctx.fillRect(c.x + 4, c.y + c.h * 0.5, c.w - 8, 2);
    }

    // --- ROW 3 (Cols 12..15): Trees & Foliage ---
    // Col 12: Oak / Deciduous Forest Tree (Authentic Pixel-Art Canopy & Rooted Trunk)
    {
      const c = getCell(12, 3);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Root flare & wooden trunk
      ctx.fillStyle = '#451a03'; // Deep bark shadow
      ctx.fillRect(c.x + 11, c.y + 16, 10, 14);
      ctx.fillRect(c.x + 9, c.y + 26, 14, 4); // Root base flare
      ctx.fillStyle = '#78350f'; // Midtone wood
      ctx.fillRect(c.x + 12, c.y + 16, 8, 12);
      ctx.fillStyle = '#92400e'; // Bark highlight streak
      ctx.fillRect(c.x + 13, c.y + 17, 2, 10);

      // Branch forks
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 8, c.y + 14, 5, 3);
      ctx.fillRect(c.x + 19, c.y + 14, 5, 3);

      // Multi-lobed lush leafy canopy
      // 1. Dark under-shadow foliage
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(c.x + 10, c.y + 14, 7, 0, Math.PI * 2);
      ctx.arc(c.x + 22, c.y + 14, 7, 0, Math.PI * 2);
      ctx.arc(c.x + 16, c.y + 10, 11, 0, Math.PI * 2);
      ctx.fill();

      // 2. Rich vibrant forest green foliage body
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(c.x + 9, c.y + 12, 6, 0, Math.PI * 2);
      ctx.arc(c.x + 23, c.y + 12, 6, 0, Math.PI * 2);
      ctx.arc(c.x + 16, c.y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      // 3. Bright sunlit leaf clusters (top-left sunlight)
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(c.x + 13, c.y + 6, 5, 0, Math.PI * 2);
      ctx.arc(c.x + 8, c.y + 10, 3, 0, Math.PI * 2);
      ctx.arc(c.x + 20, c.y + 7, 4, 0, Math.PI * 2);
      ctx.fill();

      // 4. Sparkling crisp leaf tip glints
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(c.x + 12, c.y + 4, 3, 2);
      ctx.fillRect(c.x + 18, c.y + 5, 2, 2);
      ctx.fillRect(c.x + 7, c.y + 9, 2, 2);
    }
    // Col 13: Pine / Conifer Tree (Sharp Tiered Evergreen Needle Boughs)
    {
      const c = getCell(13, 3);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Trunk at base
      ctx.fillStyle = '#451a03';
      ctx.fillRect(c.x + 13, c.y + 24, 6, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 14, c.y + 24, 4, 5);

      // 3 Layered triangular needle boughs (Bottom to Top)
      // Tier 1: Bottom Wide Bough
      ctx.fillStyle = '#022c22'; // Dark shadow
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 14);
      ctx.lineTo(c.x + 3, c.y + 25);
      ctx.lineTo(c.x + 29, c.y + 25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#047857'; // Emerald body
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 14);
      ctx.lineTo(c.x + 4, c.y + 23);
      ctx.lineTo(c.x + 28, c.y + 23);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#10b981'; // Highlights on tips
      ctx.fillRect(c.x + 5, c.y + 22, 4, 2);
      ctx.fillRect(c.x + 23, c.y + 22, 4, 2);

      // Tier 2: Mid Bough
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 8);
      ctx.lineTo(c.x + 6, c.y + 17);
      ctx.lineTo(c.x + 26, c.y + 17);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 8);
      ctx.lineTo(c.x + 7, c.y + 15);
      ctx.lineTo(c.x + 25, c.y + 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.fillRect(c.x + 8, c.y + 14, 3, 2);
      ctx.fillRect(c.x + 21, c.y + 14, 3, 2);

      // Tier 3: Top Crown Cone
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 2);
      ctx.lineTo(c.x + 9, c.y + 10);
      ctx.lineTo(c.x + 23, c.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 2);
      ctx.lineTo(c.x + 10, c.y + 9);
      ctx.lineTo(c.x + 22, c.y + 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(c.x + 15, c.y + 2, 2, 3);
    }
    // Col 14: Birch Tree (White Bark with Charcoal Knots & Sunny Golden-Green Canopy)
    {
      const c = getCell(14, 3);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Slender white/cream trunk
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(c.x + 13, c.y + 15, 6, 15);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x + 14, c.y + 15, 3, 15);
      // Horizontal black charcoal bark notches
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(c.x + 13, c.y + 19, 4, 1);
      ctx.fillRect(c.x + 15, c.y + 23, 4, 1);
      ctx.fillRect(c.x + 13, c.y + 27, 5, 1);

      // Airy bright lime/golden canopy
      ctx.fillStyle = '#3f6212';
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 9, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(c.x + 14, c.y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bef264';
      ctx.fillRect(c.x + 12, c.y + 4, 4, 2);
      ctx.fillRect(c.x + 18, c.y + 6, 3, 2);
    }
    // Col 15: Berry Bush (Dense Leafy Shrub with Ruby Berries)
    {
      const c = getCell(15, 3);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Shrub shadow base
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 18, 11, 0, Math.PI * 2);
      ctx.fill();
      // Lush foliage body
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.arc(c.x + 11, c.y + 17, 7, 0, Math.PI * 2);
      ctx.arc(c.x + 21, c.y + 17, 7, 0, Math.PI * 2);
      ctx.arc(c.x + 16, c.y + 13, 8, 0, Math.PI * 2);
      ctx.fill();
      // Top leaf highlight
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(c.x + 14, c.y + 11, 5, 0, Math.PI * 2);
      ctx.fill();
      // Ripe ruby berries
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(c.x + 8, c.y + 16, 3, 3);
      ctx.fillRect(c.x + 19, c.y + 14, 3, 3);
      ctx.fillRect(c.x + 14, c.y + 20, 3, 3);
      ctx.fillRect(c.x + 22, c.y + 21, 3, 3);
      ctx.fillRect(c.x + 13, c.y + 12, 3, 3);
      // Berry shine glints
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(c.x + 8, c.y + 16, 1, 1);
      ctx.fillRect(c.x + 19, c.y + 14, 1, 1);
      ctx.fillRect(c.x + 14, c.y + 20, 1, 1);
    }

    // --- ROW 4 (Cols 0..15): Props, Resources & Furniture ---
    // Col 0: Tree Stump (Cut Log with Growth Rings)
    {
      const c = getCell(0, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Root base flares
      ctx.fillStyle = '#451a03';
      ctx.fillRect(c.x + 4, c.y + 16, c.w - 8, 12);
      ctx.fillRect(c.x + 2, c.y + 24, c.w - 4, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 5, c.y + 17, c.w - 10, 10);
      // Top cut face
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(c.x + 16, c.y + 16, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(c.x + 16, c.y + 16, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Heartwood core & ring
      ctx.fillStyle = '#451a03';
      ctx.fillRect(c.x + 15, c.y + 15, 2, 2);
      ctx.stroke();
    }
    // Col 1: Copper Ore Vein (Craggy Rock Boulder Embedded with Lustrous Copper Crystals)
    {
      const c = getCell(1, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Craggy stone rock base
      ctx.fillStyle = '#0f172a'; // Deep cleft outline
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 4);
      ctx.lineTo(c.x + 28, c.y + 10);
      ctx.lineTo(c.x + 29, c.y + 24);
      ctx.lineTo(c.x + 22, c.y + 29);
      ctx.lineTo(c.x + 8, c.y + 29);
      ctx.lineTo(c.x + 3, c.y + 20);
      ctx.lineTo(c.x + 4, c.y + 9);
      ctx.closePath();
      ctx.fill();

      // Slate stone facets
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(c.x + 16, c.y + 6);
      ctx.lineTo(c.x + 27, c.y + 11);
      ctx.lineTo(c.x + 27, c.y + 23);
      ctx.lineTo(c.x + 21, c.y + 27);
      ctx.lineTo(c.x + 9, c.y + 27);
      ctx.lineTo(c.x + 5, c.y + 19);
      ctx.lineTo(c.x + 6, c.y + 10);
      ctx.closePath();
      ctx.fill();

      // Stone rock highlight ridge
      ctx.fillStyle = '#334155';
      ctx.fillRect(c.x + 7, c.y + 8, 8, 4);
      ctx.fillRect(c.x + 15, c.y + 6, 8, 3);

      // Embedded sparkling metallic copper crystal clusters
      // Crystal Cluster 1 (Top Left)
      ctx.fillStyle = '#9a3412'; // Dark copper shadow
      ctx.fillRect(c.x + 7, c.y + 10, 8, 7);
      ctx.fillStyle = '#ea580c'; // Vibrant metallic copper
      ctx.fillRect(c.x + 8, c.y + 11, 6, 5);
      ctx.fillStyle = '#f97316'; // Bright copper facet
      ctx.fillRect(c.x + 9, c.y + 11, 4, 3);
      ctx.fillStyle = '#fed7aa'; // Glistening facet glint
      ctx.fillRect(c.x + 9, c.y + 11, 2, 2);

      // Crystal Cluster 2 (Bottom Right)
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(c.x + 16, c.y + 17, 9, 8);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(c.x + 17, c.y + 18, 7, 6);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(c.x + 18, c.y + 18, 5, 4);
      ctx.fillStyle = '#ffffff'; // Specular glint
      ctx.fillRect(c.x + 19, c.y + 18, 2, 2);

      // Crystal Cluster 3 (Small Top Right)
      ctx.fillStyle = '#f97316';
      ctx.fillRect(c.x + 21, c.y + 9, 4, 4);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(c.x + 22, c.y + 9, 2, 2);
    }
    // Col 2: Iron Ore Vein (Craggy Rock Boulder Embedded with Brilliant Silver-Steel Crystals)
    {
      const c = getCell(2, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Craggy stone rock base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(c.x + 15, c.y + 3);
      ctx.lineTo(c.x + 27, c.y + 9);
      ctx.lineTo(c.x + 30, c.y + 22);
      ctx.lineTo(c.x + 23, c.y + 29);
      ctx.lineTo(c.x + 7, c.y + 29);
      ctx.lineTo(c.x + 2, c.y + 19);
      ctx.lineTo(c.x + 5, c.y + 8);
      ctx.closePath();
      ctx.fill();

      // Slate stone facets
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(c.x + 15, c.y + 5);
      ctx.lineTo(c.x + 25, c.y + 10);
      ctx.lineTo(c.x + 28, c.y + 21);
      ctx.lineTo(c.x + 22, c.y + 27);
      ctx.lineTo(c.x + 8, c.y + 27);
      ctx.lineTo(c.x + 4, c.y + 18);
      ctx.lineTo(c.x + 6, c.y + 9);
      ctx.closePath();
      ctx.fill();

      // Stone rock highlight ridge
      ctx.fillStyle = '#334155';
      ctx.fillRect(c.x + 8, c.y + 7, 7, 4);
      ctx.fillRect(c.x + 15, c.y + 5, 7, 3);

      // Embedded glistening steel/iron crystal nuggets
      // Nugget 1 (Top Left)
      ctx.fillStyle = '#334155'; // Dark steel base
      ctx.fillRect(c.x + 8, c.y + 10, 8, 7);
      ctx.fillStyle = '#64748b'; // Steel midtone
      ctx.fillRect(c.x + 9, c.y + 11, 6, 5);
      ctx.fillStyle = '#94a3b8'; // Silver facet
      ctx.fillRect(c.x + 10, c.y + 11, 4, 3);
      ctx.fillStyle = '#ffffff'; // Specular glint
      ctx.fillRect(c.x + 10, c.y + 11, 2, 2);

      // Nugget 2 (Bottom Right)
      ctx.fillStyle = '#334155';
      ctx.fillRect(c.x + 16, c.y + 16, 9, 9);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(c.x + 17, c.y + 17, 7, 7);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(c.x + 18, c.y + 17, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x + 19, c.y + 17, 3, 2);

      // Nugget 3 (Small Top Right)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x + 20, c.y + 8, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x + 21, c.y + 8, 2, 2);
    }
    // Col 3: Campfire
    {
      const c = getCell(3, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Stone ring
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.65, 10, 0, Math.PI * 2);
      ctx.fill();
      // Crossed logs
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + 8, c.y + 18, 16, 4);
      // Warm flame
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Col 4: Wall Torch
    {
      const c = getCell(4, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + c.w * 0.44, c.y + 12, 4, 12);
      // Flame head
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + 9, 2, 2);
    }
    // Col 5: Fireplace
    {
      const c = getCell(5, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(c.x + 4, c.y + 6, c.w - 8, c.h - 8);
      // Fire
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + 18, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Col 6: Anvil
    {
      const c = getCell(6, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      ctx.fillStyle = '#475569';
      // Base
      ctx.fillRect(c.x + 8, c.y + 20, 16, 6);
      // Stem
      ctx.fillRect(c.x + 12, c.y + 14, 8, 6);
      // Flat Top Horn
      ctx.fillRect(c.x + 4, c.y + 9, 24, 6);
    }
    // Col 7: Table
    {
      const c = getCell(7, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      this.drawPixelRect(ctx, c.x + 4, c.y + 6, c.w - 8, c.h - 12, palette.woodLight, palette.wood);
      // Table legs
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + 6, c.y + 8, 3, 3);
      ctx.fillRect(c.x + c.w - 9, c.y + 8, 3, 3);
      ctx.fillRect(c.x + 6, c.y + c.h - 11, 3, 3);
      ctx.fillRect(c.x + c.w - 9, c.y + c.h - 11, 3, 3);
    }
    // Col 8: Chair
    {
      const c = getCell(8, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      this.drawPixelRect(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, palette.woodLight, palette.wood);
      // Seat cushion
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x + 10, c.y + 10, c.w - 20, c.h - 20);
    }
    // Col 9: Bed
    {
      const c = getCell(9, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Wooden bed frame
      this.drawPixelRect(ctx, c.x + 4, c.y + 3, c.w - 8, c.h - 6, palette.wood, '#451a03');
      // Mattress & Blanket
      this.drawPixelRect(ctx, c.x + 6, c.y + 10, c.w - 12, c.h - 14, '#1d4ed8');
      // Pillow
      this.drawPixelRect(ctx, c.x + 7, c.y + 5, c.w - 14, 5, '#f8fafc');
    }
    // Col 10: Bedroll
    {
      const c = getCell(10, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Canvas roll
      this.drawPixelRect(ctx, c.x + 6, c.y + 6, c.w - 12, c.h - 12, '#334155', '#0f172a');
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
    }
    // Col 11: Field Tent
    {
      const c = getCell(11, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      // Canvas triangle
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(c.x + c.w * 0.5, c.y + 4);
      ctx.lineTo(c.x + 4, c.y + c.h - 4);
      ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
      ctx.closePath();
      ctx.fill();
      // Tent opening
      ctx.fillStyle = '#052e16';
      ctx.beginPath();
      ctx.moveTo(c.x + c.w * 0.5, c.y + 10);
      ctx.lineTo(c.x + 10, c.y + c.h - 4);
      ctx.lineTo(c.x + c.w - 10, c.y + c.h - 4);
      ctx.closePath();
      ctx.fill();
    }
    // Col 12: Window
    {
      const c = getCell(12, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);
      this.drawPixelRect(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, '#0284c7', '#0369a1');
      // Glass lattice pane
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + 4, 2, c.h - 8);
      ctx.fillRect(c.x + 4, c.y + c.h * 0.5 - 1, c.w - 8, 2);
    }
    // Col 13: Treasure Chest Closed
    {
      const c = getCell(13, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      this.drawPixelRect(ctx, c.x + 4, c.y + 8, c.w - 8, c.h - 12, palette.wood, '#0f172a');
      ctx.fillStyle = palette.gold;
      ctx.fillRect(c.x + 4, c.y + 14, c.w - 8, 2); // Rim
      ctx.fillRect(c.x + c.w * 0.5 - 2, c.y + 13, 4, 5); // Lock
    }
    // Col 14: Treasure Chest Opened
    {
      const c = getCell(14, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      this.drawPixelRect(ctx, c.x + 4, c.y + 12, c.w - 8, c.h - 16, palette.wood, '#0f172a');
      // Tilted lid
      this.drawPixelRect(ctx, c.x + 4, c.y + 6, c.w - 8, 6, palette.woodLight, palette.wood);
      ctx.fillStyle = palette.gold;
      ctx.fillRect(c.x + 7, c.y + 13, 14, 4); // Glittering treasure interior
    }
    // Col 15: Mystic Shrine / Altar
    {
      const c = getCell(15, 4);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      this.drawPixelRect(ctx, c.x + 4, c.y + 14, c.w - 8, c.h - 16, palette.wallBase, '#0f172a');
      // Hovering glowing crystal
      ctx.fillStyle = palette.crystal;
      ctx.beginPath();
      ctx.moveTo(c.x + c.w * 0.5, c.y + 3);
      ctx.lineTo(c.x + c.w * 0.5 + 5, c.y + 9);
      ctx.lineTo(c.x + c.w * 0.5, c.y + 15);
      ctx.lineTo(c.x + c.w * 0.5 - 5, c.y + 9);
      ctx.closePath();
      ctx.fill();
    }

    // --- ROW 5 (Cols 0..7): Watchtower Fortifications & Traps ---
    // Col 0: Watchtower Wall
    {
      const c = getCell(0, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#334155');
      ctx.fillStyle = '#64748b';
      ctx.fillRect(c.x + 2, c.y + 2, 8, 8);
      ctx.fillRect(c.x + 14, c.y + 2, 8, 8);
    }
    // Col 1: Watchtower Slit
    {
      const c = getCell(1, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1e293b');
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + 6, 2, 14);
    }
    // Col 2: Watchtower Deck
    {
      const c = getCell(2, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#451a03');
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    }
    // Col 3: Watchtower Flag
    {
      const c = getCell(3, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + 6, c.y + 4, 3, c.h - 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(c.x + 9, c.y + 4, 14, 10);
    }
    // Col 4: Watchtower Barricade
    {
      const c = getCell(4, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
      ctx.fillStyle = palette.wood;
      ctx.fillRect(c.x + 4, c.y + 12, c.w - 8, 4);
      // Spikes
      ctx.fillStyle = '#b45309';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(c.x + 6 + k * 6, c.y + 12);
        ctx.lineTo(c.x + 9 + k * 6, c.y + 5);
        ctx.lineTo(c.x + 12 + k * 6, c.y + 12);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Col 5: Spikes Trap
    {
      const c = getCell(5, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
      ctx.fillStyle = '#94a3b8';
      for (let k = 0; k < 3; k++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillRect(c.x + 6 + k * 8, c.y + 6 + j * 8, 3, 3);
        }
      }
    }
    // Col 6: Fire Vent Trap
    {
      const c = getCell(6, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1c1917');
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
    }
    // Col 7: Poison Gas Trap
    {
      const c = getCell(7, 5);
      this.drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#022c22');
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.5, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  // =========================================================================
  // 2. ENTITY & CHARACTER ANIMATION ATLAS (512x512 with 48 rows x 16 cols)
  // =========================================================================
  public generateEntityTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    const cols = 16;
    const rows = 72;
    const canvas = document.createElement('canvas');
    canvas.width = cols * size;
    canvas.height = rows * size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const entities = [
      { name: 'Hero Warrior', baseRow: 0, skin: '#ffedd5', armor: '#94a3b8', cape: '#3b82f6', weapon: '#e2e8f0' },
      { name: 'Hero Mage', baseRow: 4, skin: '#fef08a', armor: '#4f46e5', cape: '#7c3aed', weapon: '#a855f7' },
      { name: 'Hero Rogue', baseRow: 8, skin: '#fed7aa', armor: '#334155', cape: '#0f172a', weapon: '#94a3b8' },
      { name: 'Town Guard', baseRow: 12, skin: '#fed7aa', armor: '#64748b', cape: '#b91c1c', weapon: '#e2e8f0' },
      { name: 'Goblin Raider', baseRow: 16, skin: '#22c55e', armor: '#78350f', cape: '#854d0e', weapon: '#71717a' },
      { name: 'Skeleton Minion', baseRow: 20, skin: '#f8fafc', armor: '#475569', cape: '#334155', weapon: '#94a3b8' },
      { name: 'Bloodfang Orc', baseRow: 24, skin: '#15803d', armor: '#451a03', cape: '#991b1b', weapon: '#b91c1c' },
      { name: 'Cave Spider', baseRow: 28, skin: '#1e1b4b', armor: '#312e81', cape: '#4338ca', weapon: '#6366f1' },
      { name: 'Dire Wolf', baseRow: 32, skin: '#64748b', armor: '#475569', cape: '#334155', weapon: '#94a3b8' },
      { name: 'Toxic Slime', baseRow: 36, skin: '#10b981', armor: '#059669', cape: '#047857', weapon: '#34d399' },
      { name: 'Town Civilian', baseRow: 40, skin: '#ffedd5', armor: '#b45309', cape: '#0284c7', weapon: '#78350f' },
      { name: 'Cat Companion', baseRow: 44, skin: '#f97316', armor: '#ea580c', cape: '#c2410c', weapon: '#fdba74' },
      { name: 'Wild Deer', baseRow: 48, skin: '#b45309', armor: '#78350f', cape: '#92400e', weapon: '#fde047' },
      { name: 'Wild Boar', baseRow: 52, skin: '#78350f', armor: '#451a03', cape: '#292524', weapon: '#f8fafc' },
      { name: 'Mountain Goat', baseRow: 56, skin: '#f8fafc', armor: '#cbd5e1', cape: '#94a3b8', weapon: '#64748b' },
      { name: 'Giant Rat', baseRow: 60, skin: '#71717a', armor: '#52525b', cape: '#3f3f46', weapon: '#ef4444' },
      { name: 'Wild Bear', baseRow: 64, skin: '#451a03', armor: '#292524', cape: '#1c1917', weapon: '#f8fafc' },
      { name: 'Desert Camel', baseRow: 68, skin: '#d97706', armor: '#b45309', cape: '#92400e', weapon: '#fde047' },
    ];

    for (const ent of entities) {
      // 4 directions: 0 = South, 1 = West, 2 = East, 3 = North
      for (let dir = 0; dir < 4; dir++) {
        const row = ent.baseRow + dir;

        // 16 animation frames:
        // Col 0..3: Idle
        // Col 4..7: Walk
        // Col 8..11: Attack
        // Col 12..13: Hurt
        // Col 14..15: Cast
        for (let col = 0; col < 16; col++) {
          const cx = col * size;
          const cy = row * size;

          // Animation phase offset
          const animPhase = col % 4;
          let bobY = 0;
          let armSwing = 0;

          if (col >= 0 && col <= 3) {
            // Subtle idle breathing
            bobY = (animPhase === 1 || animPhase === 2) ? -1 : 0;
          } else if (col >= 4 && col <= 7) {
            // Walk bounce
            bobY = (animPhase % 2 === 1) ? -1 : 0;
            armSwing = (animPhase % 2 === 0) ? 2 : -2;
          } else if (col >= 8 && col <= 11) {
            // Attack lunge
            armSwing = (animPhase === 2) ? 6 : 2;
          } else if (col >= 12 && col <= 13) {
            // Hurt shake
            bobY = 1;
          } else if (col >= 14 && col <= 15) {
            // Cast raise
            bobY = -2;
          }

          // Draw humanoid or animal character sprite
          if (ent.name === 'Cat Companion') {
            // Cat Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 8, cy + 14 + bobY, 14, 10);
            // Head & Ears
            ctx.fillRect(cx + (dir === 1 ? 4 : dir === 2 ? 18 : 10), cy + 8 + bobY, 10, 8);
            ctx.fillStyle = '#431407';
            ctx.fillRect(cx + 10, cy + 6 + bobY, 2, 3); // Left ear
            ctx.fillRect(cx + 16, cy + 6 + bobY, 2, 3); // Right ear
            // Tail twitch
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 6, cy + 10 + bobY + (animPhase % 2), 3, 6);
          } else if (ent.name === 'Cave Spider') {
            // Spider Abdomen & Legs
            ctx.fillStyle = ent.skin;
            ctx.beginPath();
            ctx.arc(cx + size * 0.5, cy + size * 0.5 + bobY, 8, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(cx + 12, cy + 10 + bobY, 2, 2);
            ctx.fillRect(cx + 18, cy + 10 + bobY, 2, 2);
            // 8 Legs
            ctx.strokeStyle = ent.armor;
            ctx.lineWidth = 1.5;
            for (let l = 0; l < 4; l++) {
              ctx.beginPath();
              ctx.moveTo(cx + 8, cy + 12 + l * 3 + bobY);
              ctx.lineTo(cx + 2, cy + 8 + l * 4 + bobY + armSwing);
              ctx.moveTo(cx + 24, cy + 12 + l * 3 + bobY);
              ctx.lineTo(cx + 30, cy + 8 + l * 4 + bobY - armSwing);
              ctx.stroke();
            }
          } else if (ent.name === 'Toxic Slime') {
            // Slime Jelly Blob
            ctx.fillStyle = ent.skin;
            ctx.beginPath();
            ctx.ellipse(cx + size * 0.5, cy + size * 0.6 + bobY, 10 + bobY, 8 - bobY, 0, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = ent.weapon;
            ctx.beginPath();
            ctx.arc(cx + size * 0.5, cy + size * 0.6 + bobY, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (ent.name === 'Dire Wolf') {
            // Wolf Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 6, cy + 12 + bobY, 18, 10);
            // Head & Snout
            const hx = dir === 1 ? cx + 2 : dir === 2 ? cx + 20 : cx + 10;
            ctx.fillRect(hx, cy + 8 + bobY, 10, 8);
            // Ears
            ctx.fillStyle = ent.armor;
            ctx.fillRect(hx + 2, cy + 5 + bobY, 2, 3);
            ctx.fillRect(hx + 6, cy + 5 + bobY, 2, 3);
            // Legs
            ctx.fillStyle = ent.cape;
            ctx.fillRect(cx + 7, cy + 22 + bobY, 3, 6 + armSwing);
            ctx.fillRect(cx + 12, cy + 22 + bobY, 3, 6 - armSwing);
            ctx.fillRect(cx + 18, cy + 22 + bobY, 3, 6 + armSwing);
            // Bushy Tail
            ctx.fillStyle = ent.armor;
            ctx.fillRect(cx + 4, cy + 13 + bobY, 4, 6);
          } else if (ent.name === 'Wild Deer') {
            // Deer Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 8, cy + 12 + bobY, 16, 9);
            // Slender Legs
            ctx.fillStyle = ent.armor;
            ctx.fillRect(cx + 9, cy + 21 + bobY, 2, 8 + armSwing);
            ctx.fillRect(cx + 13, cy + 21 + bobY, 2, 8 - armSwing);
            ctx.fillRect(cx + 19, cy + 21 + bobY, 2, 8 + armSwing);
            // Head & Neck
            const dhx = dir === 1 ? cx + 4 : dir === 2 ? cx + 20 : cx + 11;
            ctx.fillStyle = ent.skin;
            ctx.fillRect(dhx, cy + 6 + bobY, 8, 8);
            // Antlers
            ctx.fillStyle = ent.weapon;
            ctx.fillRect(dhx + 1, cy + 2 + bobY, 2, 4);
            ctx.fillRect(dhx + 5, cy + 2 + bobY, 2, 4);
            ctx.fillRect(dhx - 1, cy + 2 + bobY, 4, 2);
            ctx.fillRect(dhx + 5, cy + 2 + bobY, 4, 2);
          } else if (ent.name === 'Wild Boar') {
            // Boar Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 6, cy + 12 + bobY, 20, 11);
            // Stout Legs
            ctx.fillStyle = ent.cape;
            ctx.fillRect(cx + 8, cy + 23 + bobY, 4, 5 + armSwing);
            ctx.fillRect(cx + 14, cy + 23 + bobY, 4, 5 - armSwing);
            ctx.fillRect(cx + 20, cy + 23 + bobY, 4, 5 + armSwing);
            // Head & Snout
            const bhx = dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 10;
            ctx.fillStyle = ent.armor;
            ctx.fillRect(bhx, cy + 10 + bobY, 10, 10);
            // Tusks
            ctx.fillStyle = ent.weapon;
            ctx.fillRect(bhx + (dir === 1 ? 0 : 8), cy + 16 + bobY, 2, 3);
          } else if (ent.name === 'Mountain Goat') {
            // Goat Fleece Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 7, cy + 11 + bobY, 18, 10);
            // Legs
            ctx.fillStyle = ent.weapon;
            ctx.fillRect(cx + 9, cy + 21 + bobY, 3, 7 + armSwing);
            ctx.fillRect(cx + 14, cy + 21 + bobY, 3, 7 - armSwing);
            ctx.fillRect(cx + 19, cy + 21 + bobY, 3, 7 + armSwing);
            // Head
            const ghx = dir === 1 ? cx + 3 : dir === 2 ? cx + 21 : cx + 11;
            ctx.fillStyle = ent.armor;
            ctx.fillRect(ghx, cy + 7 + bobY, 8, 8);
            // Curled Horns
            ctx.fillStyle = ent.weapon;
            ctx.fillRect(ghx + 1, cy + 3 + bobY, 3, 4);
            ctx.fillRect(ghx + 5, cy + 3 + bobY, 3, 4);
          } else if (ent.name === 'Giant Rat') {
            // Rat Low Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 7, cy + 16 + bobY, 17, 8);
            // Pointed Snout
            const rhx = dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 11;
            ctx.fillStyle = ent.armor;
            ctx.fillRect(rhx, cy + 14 + bobY, 8, 6);
            // Red Glowing Eyes
            ctx.fillStyle = ent.weapon;
            ctx.fillRect(rhx + (dir === 1 ? 2 : dir === 2 ? 5 : 3), cy + 15 + bobY, 2, 2);
            // Thin Tail
            ctx.fillStyle = ent.cape;
            ctx.fillRect(cx + 4, cy + 18 + bobY, 4, 2);
            // Feet
            ctx.fillRect(cx + 9, cy + 24 + bobY, 3, 3 + armSwing);
            ctx.fillRect(cx + 17, cy + 24 + bobY, 3, 3 - armSwing);
          } else if (ent.name === 'Wild Bear') {
            // Massive Bear Body
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 5, cy + 10 + bobY, 22, 14);
            // Heavy Paws
            ctx.fillStyle = ent.cape;
            ctx.fillRect(cx + 7, cy + 24 + bobY, 5, 6 + armSwing);
            ctx.fillRect(cx + 14, cy + 24 + bobY, 4, 6 - armSwing);
            ctx.fillRect(cx + 20, cy + 24 + bobY, 5, 6 + armSwing);
            // Broad Head & Rounded Ears
            const brhx = dir === 1 ? cx + 1 : dir === 2 ? cx + 22 : cx + 9;
            ctx.fillStyle = ent.armor;
            ctx.fillRect(brhx, cy + 8 + bobY, 12, 10);
            ctx.fillRect(brhx + 1, cy + 5 + bobY, 3, 3);
            ctx.fillRect(brhx + 8, cy + 5 + bobY, 3, 3);
          } else if (ent.name === 'Desert Camel') {
            // Camel Body & Hump
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 6, cy + 12 + bobY, 20, 10);
            // Hump
            ctx.fillStyle = ent.armor;
            ctx.fillRect(cx + 13, cy + 7 + bobY, 7, 6);
            // Long Neck & Head
            const chx = dir === 1 ? cx + 2 : dir === 2 ? cx + 22 : cx + 10;
            ctx.fillStyle = ent.skin;
            ctx.fillRect(chx, cy + 4 + bobY, 7, 10);
            // Long Sturdy Legs
            ctx.fillStyle = ent.cape;
            ctx.fillRect(cx + 8, cy + 22 + bobY, 3, 8 + armSwing);
            ctx.fillRect(cx + 14, cy + 22 + bobY, 3, 8 - armSwing);
            ctx.fillRect(cx + 20, cy + 22 + bobY, 3, 8 + armSwing);
          } else {
            // Humanoid Character
            // Head
            ctx.fillStyle = ent.skin;
            ctx.fillRect(cx + 11, cy + 4 + bobY, 10, 8);

            // Helmet / Hair
            ctx.fillStyle = ent.armor;
            ctx.fillRect(cx + 10, cy + 2 + bobY, 12, 4);

            // Eyes (with subtle blink during idle frame 2)
            if (dir !== 3) {
              const isBlink = (col === 2 && animPhase === 2);
              ctx.fillStyle = isBlink ? ent.skin : '#0f172a';
              const eyeX = dir === 1 ? 12 : dir === 2 ? 17 : 13;
              ctx.fillRect(cx + eyeX, cy + 7 + bobY, 2, isBlink ? 1 : 2);
              if (dir === 0) ctx.fillRect(cx + eyeX + 4, cy + 7 + bobY, 2, isBlink ? 1 : 2);
            }

            // Torso & Cuirass
            ctx.fillStyle = ent.armor;
            ctx.fillRect(cx + 9, cy + 12 + bobY, 14, 10);

            // Legs
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(cx + 10 + armSwing, cy + 22, 4, 7);
            ctx.fillRect(cx + 18 - armSwing, cy + 22, 4, 7);

            if (ent.name === 'Town Guard') {
              // Town Guard: Golden plume, Royal Crimson Tabard with cross, heater shield & halberd
              ctx.fillStyle = '#eab308'; // Gold plume
              ctx.fillRect(cx + 14, cy + 0 + bobY, 4, 3);
              ctx.fillStyle = ent.cape; // Crimson tabard
              ctx.fillRect(cx + 12, cy + 13 + bobY, 8, 8);
              ctx.fillStyle = '#eab308'; // Cross trim
              ctx.fillRect(cx + 15, cy + 13 + bobY, 2, 8);
              ctx.fillRect(cx + 12, cy + 16 + bobY, 8, 2);

              // Heater Shield on off-hand
              const shieldX = dir === 1 ? cx + 21 : cx + 3;
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(shieldX, cy + 11 + bobY, 6, 12);
              ctx.fillStyle = '#b91c1c';
              ctx.fillRect(shieldX + 1, cy + 12 + bobY, 4, 10);
              ctx.fillStyle = '#eab308';
              ctx.fillRect(shieldX + 2, cy + 15 + bobY, 2, 4);

              // Halberd / Guard Spear
              const spearX = dir === 1 ? cx + 3 : cx + 25;
              if (col >= 8 && col <= 11) {
                // Thrust forward
                ctx.fillStyle = '#713f12';
                ctx.fillRect(cx + (dir === 1 ? 0 : 20), cy + 14 + bobY, 12, 2);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(cx + (dir === 1 ? 0 : 28), cy + 12 + bobY, 4, 6);
              } else {
                ctx.fillStyle = '#713f12';
                ctx.fillRect(spearX, cy + 1 + bobY, 2, 24);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(spearX - 1, cy + 0 + bobY, 4, 5);
                ctx.fillStyle = '#eab308';
                ctx.fillRect(spearX + 2, cy + 2 + bobY, 2, 3);
              }
            } else {
              // Standard Weapon in hand
              ctx.fillStyle = ent.weapon;
              if (col >= 8 && col <= 11) {
                // Slashing weapon out
                ctx.fillRect(cx + (dir === 1 ? 2 : 24), cy + 10 + bobY, 6, 2);
                ctx.fillRect(cx + (dir === 1 ? 4 : 26), cy + 6 + bobY, 2, 10);
              } else {
                ctx.fillRect(cx + (dir === 1 ? 4 : 24), cy + 14 + bobY, 2, 8);
              }
            }
          }
        }
      }
    }

    return canvas;
  }

  // =========================================================================
  // 3. OVERSIZED MULTI-TILE BOSS ATLAS (512x512 with 64px and 96px creatures)
  // =========================================================================
  public generateBossTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Boss 1: Abyssal Fire Dragon (64x64 at 0,0)
    {
      const bx = 0;
      const by = 0;
      const bw = 64;
      const bh = 64;

      // Dragon Wings
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(bx + 32, by + 24);
      ctx.lineTo(bx + 4, by + 4);
      ctx.lineTo(bx + 12, by + 36);
      ctx.lineTo(bx + 60, by + 4);
      ctx.lineTo(bx + 52, by + 36);
      ctx.closePath();
      ctx.fill();

      // Dragon Body & Tail
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(bx + 32, by + 36, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fiery Underbelly
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(bx + 32, by + 40, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Horned Head
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(bx + 26, by + 16, 12, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx + 28, by + 20, 3, 3); // Glowing eyes
      ctx.fillRect(bx + 34, by + 20, 3, 3);

      // Horns
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx + 24, by + 12, 3, 6);
      ctx.fillRect(bx + 38, by + 12, 3, 6);
    }

    // 2. Boss 2: Ancient Stone Titan Golem (64x64 at 64,0)
    {
      const bx = 64;
      const by = 0;
      // Stone Blocks Body
      ctx.fillStyle = '#475569';
      ctx.fillRect(bx + 16, by + 16, 32, 28);
      // Glowing Runic Core
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx + 26, by + 24, 12, 12);
      // Massive Stone Fists
      ctx.fillStyle = '#334155';
      ctx.fillRect(bx + 6, by + 28, 10, 14);
      ctx.fillRect(bx + 48, by + 28, 10, 14);
      // Head
      ctx.fillStyle = '#64748b';
      ctx.fillRect(bx + 24, by + 8, 16, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx + 28, by + 12, 8, 2); // Visor eye slit
    }

    // 3. Boss 3: Towering Arch-Demon (96x96 at 0, 128)
    {
      const bx = 0;
      const by = 128;
      // Bat Wings
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(bx + 48, by + 40);
      ctx.lineTo(bx + 6, by + 8);
      ctx.lineTo(bx + 20, by + 60);
      ctx.lineTo(bx + 90, by + 8);
      ctx.lineTo(bx + 76, by + 60);
      ctx.closePath();
      ctx.fill();

      // Demon Torso
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(bx + 32, by + 32, 32, 36);

      // Horned Skull Head
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(bx + 36, by + 16, 24, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx + 40, by + 22, 4, 4);
      ctx.fillRect(bx + 52, by + 22, 4, 4);
    }

    return canvas;
  }

  // =========================================================================
  // 4. MASTER ITEMS & EQUIPMENT ATLAS (512x512 with 32px icons)
  // =========================================================================
  public generateItemsTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
    const cols = 16;
    const rows = 16;
    const canvas = document.createElement('canvas');
    canvas.width = cols * size;
    canvas.height = rows * size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const getCell = (col: number, row: number) => ({
      x: col * size,
      y: row * size,
      w: size,
      h: size,
    });

    // Row 0: Weapons (Swords, Daggers, Axes, Bows, Staves)
    // 0,0: Broadsword
    {
      const c = getCell(0, 0);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(c.x + 14, c.y + 4, 4, 18); // Blade
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(c.x + 8, c.y + 20, 16, 3); // Crossguard
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 14, c.y + 23, 4, 6); // Hilt
    }
    // 1,0: Dagger
    {
      const c = getCell(1, 0);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x + 14, c.y + 8, 4, 12);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x + 10, c.y + 20, 12, 2);
      ctx.fillRect(c.x + 14, c.y + 22, 4, 4);
    }
    // 2,0: Battleaxe
    {
      const c = getCell(2, 0);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 14, c.y + 4, 4, 24); // Shaft
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x + 6, c.y + 6, 8, 12); // Left blade
      ctx.fillRect(c.x + 18, c.y + 6, 8, 12); // Right blade
    }
    // 3,0: Longbow
    {
      const c = getCell(3, 0);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(c.x + 12, c.y + 16, 12, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x + 14, c.y + 4);
      ctx.lineTo(c.x + 14, c.y + 28);
      ctx.stroke();
    }
    // 4,0: Arcane Staff
    {
      const c = getCell(4, 0);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(c.x + 14, c.y + 8, 4, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Row 1: Potions, Scrolls & Resources
    // 0,1: Red Healing Potion
    {
      const c = getCell(0, 1);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(c.x + 14, c.y + 6, 4, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x + 13, c.y + 4, 6, 3); // Cork
    }
    // 1,1: Blue Mana Elixir
    {
      const c = getCell(1, 1);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(c.x + 14, c.y + 6, 4, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x + 13, c.y + 4, 6, 3);
    }
    // 2,1: Arcane Scroll
    {
      const c = getCell(2, 1);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(c.x + 8, c.y + 6, 16, 20);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x + 6, c.y + 6, 20, 2);
      ctx.fillRect(c.x + 6, c.y + 24, 20, 2);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(c.x + 12, c.y + 12, 8, 2);
    }

    return canvas;
  }
}

export const mockupAtlasGenerator = MockupAtlasGenerator.getInstance();
