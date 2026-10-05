/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme } from './types';
import { getThemePalette } from './themePalettes';
import { drawPixelRect, getCell } from './drawingPrimitives';

/**
 * Procedurally generates the 16x16 Main Terrain & Structure Tileset
 */
export function renderMainTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
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
  const palette = getThemePalette(theme);

  const cell = (col: number, row: number) => getCell(col, row, size);

  // --- ROWS 0 to 3, COLS 0..3: 16-Bitmask Wall Autotiles ---
  for (let bitmask = 0; bitmask < 16; bitmask++) {
    const col = bitmask % 4;
    const row = Math.floor(bitmask / 4);
    const c = cell(col, row);

    // Base wall solid stone
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);

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
    const c = cell(col, row);

    // Deep calm water base
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.water);

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
    const c = cell(col, row);

    // Base terrain under path (Darker dirt)
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1c1917');

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
    const c = cell(12, 0);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
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
    const c = cell(13, 0);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.grass);
    ctx.fillStyle = palette.grassTuft;
    ctx.fillRect(c.x + 6, c.y + 8, 2, 4);
    ctx.fillRect(c.x + 8, c.y + 10, 2, 3);
    ctx.fillRect(c.x + 20, c.y + 18, 2, 4);
    ctx.fillRect(c.x + 22, c.y + 20, 2, 3);
    ctx.fillRect(c.x + 14, c.y + 22, 2, 3);
  }
  // Col 14: Sand (Warm Golden Dunes)
  {
    const c = cell(14, 0);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.sand);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(c.x + 4, c.y + 8, 6, 2);
    ctx.fillRect(c.x + 14, c.y + 18, 8, 2);
    ctx.fillRect(c.x + 22, c.y + 10, 4, 1);
  }
  // Col 15: Snow (Crisp Pale Crystalline Snow)
  {
    const c = cell(15, 0);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.snow);
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
    const c = cell(12, 1);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.lava);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(c.x + 4, c.y + 8, 8, 3);
    ctx.fillRect(c.x + 16, c.y + 16, 10, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(c.x + 6, c.y + 9, 4, 1);
    ctx.fillRect(c.x + 19, c.y + 17, 4, 2);
  }
  // Col 13: Wooden Door Closed (Sturdy Timber & Wrought Iron Bands)
  {
    const c = cell(13, 1);
    // Dark door frame outline
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1c1917');
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
    const c = cell(14, 1);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
    // Stone threshold lintel & jambs
    ctx.fillStyle = '#334155';
    ctx.fillRect(c.x, c.y, c.w, 3);
    ctx.fillRect(c.x, c.y, 4, c.h);
    ctx.fillRect(c.x + c.w - 4, c.y, 4, c.h);
    // Dark interior opening
    ctx.fillStyle = '#090d16';
    ctx.fillRect(c.x + 8, c.y + 3, c.w - 12, c.h - 3);
    // Swung-open wooden door panel on left
    drawPixelRect(ctx, c.x + 2, c.y + 3, 6, c.h - 5, palette.woodLight, '#1c1917');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(c.x + 3, c.y + 8, 4, 2);
    ctx.fillRect(c.x + 3, c.y + c.h - 10, 4, 2);
  }
  // Col 15: Signpost
  {
    const c = cell(15, 1);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    // Wooden stake
    ctx.fillStyle = palette.wood;
    ctx.fillRect(c.x + c.w * 0.44, c.y + 12, 4, c.h - 14);
    // Plaque board
    drawPixelRect(ctx, c.x + 4, c.y + 4, c.w - 8, 12, palette.woodLight, palette.wood);
    // Inscribed text lines
    ctx.fillStyle = '#451a03';
    ctx.fillRect(c.x + 7, c.y + 7, c.w - 14, 2);
    ctx.fillRect(c.x + 7, c.y + 11, c.w - 18, 2);
  }

  // --- ROW 2 (Cols 12..15): Stairs & Dungeon Thresholds ---
  // Col 12: Stairs Down (Dark descent)
  {
    const c = cell(12, 2);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
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
    const c = cell(13, 2);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
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
    const c = cell(14, 2);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#0f172a');
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
    const c = cell(15, 2);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);
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
  // Col 12: Oak / Deciduous Forest Tree
  {
    const c = cell(12, 3);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
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
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(c.x + 10, c.y + 14, 7, 0, Math.PI * 2);
    ctx.arc(c.x + 22, c.y + 14, 7, 0, Math.PI * 2);
    ctx.arc(c.x + 16, c.y + 10, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(c.x + 9, c.y + 12, 6, 0, Math.PI * 2);
    ctx.arc(c.x + 23, c.y + 12, 6, 0, Math.PI * 2);
    ctx.arc(c.x + 16, c.y + 8, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(c.x + 13, c.y + 6, 5, 0, Math.PI * 2);
    ctx.arc(c.x + 8, c.y + 10, 3, 0, Math.PI * 2);
    ctx.arc(c.x + 20, c.y + 7, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(c.x + 12, c.y + 4, 3, 2);
    ctx.fillRect(c.x + 18, c.y + 5, 2, 2);
    ctx.fillRect(c.x + 7, c.y + 9, 2, 2);
  }
  // Col 13: Pine / Conifer Tree
  {
    const c = cell(13, 3);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#451a03';
    ctx.fillRect(c.x + 13, c.y + 24, 6, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(c.x + 14, c.y + 24, 4, 5);

    // Tier 1: Bottom Wide Bough
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.moveTo(c.x + 16, c.y + 14);
    ctx.lineTo(c.x + 3, c.y + 25);
    ctx.lineTo(c.x + 29, c.y + 25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(c.x + 16, c.y + 14);
    ctx.lineTo(c.x + 4, c.y + 23);
    ctx.lineTo(c.x + 28, c.y + 23);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10b981';
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
  // Col 14: Birch Tree
  {
    const c = cell(14, 3);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(c.x + 13, c.y + 15, 6, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c.x + 14, c.y + 15, 3, 15);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(c.x + 13, c.y + 19, 4, 1);
    ctx.fillRect(c.x + 15, c.y + 23, 4, 1);
    ctx.fillRect(c.x + 13, c.y + 27, 5, 1);

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
  // Col 15: Berry Bush
  {
    const c = cell(15, 3);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(c.x + 16, c.y + 18, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(c.x + 11, c.y + 17, 7, 0, Math.PI * 2);
    ctx.arc(c.x + 21, c.y + 17, 7, 0, Math.PI * 2);
    ctx.arc(c.x + 16, c.y + 13, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(c.x + 14, c.y + 11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(c.x + 8, c.y + 16, 3, 3);
    ctx.fillRect(c.x + 19, c.y + 14, 3, 3);
    ctx.fillRect(c.x + 14, c.y + 20, 3, 3);
    ctx.fillRect(c.x + 22, c.y + 21, 3, 3);
    ctx.fillRect(c.x + 13, c.y + 12, 3, 3);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(c.x + 8, c.y + 16, 1, 1);
    ctx.fillRect(c.x + 19, c.y + 14, 1, 1);
    ctx.fillRect(c.x + 14, c.y + 20, 1, 1);
  }

  // --- ROW 4 (Cols 0..15): Props, Resources & Furniture ---
  // Col 0: Tree Stump
  {
    const c = cell(0, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#451a03';
    ctx.fillRect(c.x + 4, c.y + 16, c.w - 8, 12);
    ctx.fillRect(c.x + 2, c.y + 24, c.w - 4, 4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(c.x + 5, c.y + 17, c.w - 10, 10);
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(c.x + 16, c.y + 16, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(c.x + 16, c.y + 16, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(c.x + 15, c.y + 15, 2, 2);
  }
  // Col 1: Copper Ore Vein
  {
    const c = cell(1, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#0f172a';
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

    ctx.fillStyle = '#334155';
    ctx.fillRect(c.x + 7, c.y + 8, 8, 4);
    ctx.fillRect(c.x + 15, c.y + 6, 8, 3);

    // Copper Crystals
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(c.x + 7, c.y + 10, 8, 7);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(c.x + 8, c.y + 11, 6, 5);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(c.x + 9, c.y + 11, 4, 3);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(c.x + 9, c.y + 11, 2, 2);

    ctx.fillStyle = '#9a3412';
    ctx.fillRect(c.x + 16, c.y + 17, 9, 8);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(c.x + 17, c.y + 18, 7, 6);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(c.x + 18, c.y + 18, 5, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c.x + 19, c.y + 18, 2, 2);

    ctx.fillStyle = '#f97316';
    ctx.fillRect(c.x + 21, c.y + 9, 4, 4);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(c.x + 22, c.y + 9, 2, 2);
  }
  // Col 2: Iron Ore Vein
  {
    const c = cell(2, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
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

    ctx.fillStyle = '#334155';
    ctx.fillRect(c.x + 8, c.y + 7, 7, 4);
    ctx.fillRect(c.x + 15, c.y + 5, 7, 3);

    // Steel / Iron Nuggets
    ctx.fillStyle = '#334155';
    ctx.fillRect(c.x + 8, c.y + 10, 8, 7);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(c.x + 9, c.y + 11, 6, 5);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(c.x + 10, c.y + 11, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c.x + 10, c.y + 11, 2, 2);

    ctx.fillStyle = '#334155';
    ctx.fillRect(c.x + 16, c.y + 16, 9, 9);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(c.x + 17, c.y + 17, 7, 7);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(c.x + 18, c.y + 17, 5, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c.x + 19, c.y + 17, 3, 2);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(c.x + 20, c.y + 8, 5, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c.x + 21, c.y + 8, 2, 2);
  }
  // Col 3: Campfire
  {
    const c = cell(3, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.65, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.wood;
    ctx.fillRect(c.x + 8, c.y + 18, 16, 4);
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
    const c = cell(4, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = palette.wood;
    ctx.fillRect(c.x + c.w * 0.44, c.y + 12, 4, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(c.x + c.w * 0.5, c.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + 9, 2, 2);
  }
  // Col 5: Fireplace
  {
    const c = cell(5, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(c.x + 4, c.y + 6, c.w - 8, c.h - 8);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(c.x + c.w * 0.5, c.y + 18, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Col 6: Anvil
  {
    const c = cell(6, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#475569';
    ctx.fillRect(c.x + 8, c.y + 20, 16, 6);
    ctx.fillRect(c.x + 12, c.y + 14, 8, 6);
    ctx.fillRect(c.x + 4, c.y + 9, 24, 6);
  }
  // Col 7: Table
  {
    const c = cell(7, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 4, c.y + 6, c.w - 8, c.h - 12, palette.woodLight, palette.wood);
    ctx.fillStyle = palette.wood;
    ctx.fillRect(c.x + 6, c.y + 8, 3, 3);
    ctx.fillRect(c.x + c.w - 9, c.y + 8, 3, 3);
    ctx.fillRect(c.x + 6, c.y + c.h - 11, 3, 3);
    ctx.fillRect(c.x + c.w - 9, c.y + c.h - 11, 3, 3);
  }
  // Col 8: Chair
  {
    const c = cell(8, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, palette.woodLight, palette.wood);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(c.x + 10, c.y + 10, c.w - 20, c.h - 20);
  }
  // Col 9: Bed
  {
    const c = cell(9, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 4, c.y + 3, c.w - 8, c.h - 6, palette.wood, '#451a03');
    drawPixelRect(ctx, c.x + 6, c.y + 10, c.w - 12, c.h - 14, '#1d4ed8');
    drawPixelRect(ctx, c.x + 7, c.y + 5, c.w - 14, 5, '#f8fafc');
  }
  // Col 10: Bedroll
  {
    const c = cell(10, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 6, c.y + 6, c.w - 12, c.h - 12, '#334155', '#0f172a');
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
  }
  // Col 11: Field Tent
  {
    const c = cell(11, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(c.x + c.w * 0.5, c.y + 4);
    ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.closePath();
    ctx.fill();
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
    const c = cell(12, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.wallBase);
    drawPixelRect(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, '#0284c7', '#0369a1');
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + 4, 2, c.h - 8);
    ctx.fillRect(c.x + 4, c.y + c.h * 0.5 - 1, c.w - 8, 2);
  }
  // Col 13: Treasure Chest Closed
  {
    const c = cell(13, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 4, c.y + 8, c.w - 8, c.h - 12, palette.wood, '#0f172a');
    ctx.fillStyle = palette.gold;
    ctx.fillRect(c.x + 4, c.y + 14, c.w - 8, 2);
    ctx.fillRect(c.x + c.w * 0.5 - 2, c.y + 13, 4, 5);
  }
  // Col 14: Treasure Chest Opened
  {
    const c = cell(14, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 4, c.y + 12, c.w - 8, c.h - 16, palette.wood, '#0f172a');
    drawPixelRect(ctx, c.x + 4, c.y + 6, c.w - 8, 6, palette.woodLight, palette.wood);
    ctx.fillStyle = palette.gold;
    ctx.fillRect(c.x + 7, c.y + 13, 14, 4);
  }
  // Col 15: Mystic Shrine / Altar
  {
    const c = cell(15, 4);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    drawPixelRect(ctx, c.x + 4, c.y + 14, c.w - 8, c.h - 16, palette.wallBase, '#0f172a');
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
    const c = cell(0, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#334155');
    ctx.fillStyle = '#64748b';
    ctx.fillRect(c.x + 2, c.y + 2, 8, 8);
    ctx.fillRect(c.x + 14, c.y + 2, 8, 8);
  }
  // Col 1: Watchtower Slit
  {
    const c = cell(1, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1e293b');
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(c.x + c.w * 0.5 - 1, c.y + 6, 2, 14);
  }
  // Col 2: Watchtower Deck
  {
    const c = cell(2, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#451a03');
    ctx.fillStyle = '#78350f';
    ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
  }
  // Col 3: Watchtower Flag
  {
    const c = cell(3, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = palette.wood;
    ctx.fillRect(c.x + 6, c.y + 4, 3, c.h - 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(c.x + 9, c.y + 4, 14, 10);
  }
  // Col 4: Watchtower Barricade
  {
    const c = cell(4, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, 'transparent');
    ctx.fillStyle = palette.wood;
    ctx.fillRect(c.x + 4, c.y + 12, c.w - 8, 4);
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
    const c = cell(5, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, palette.floor);
    ctx.fillStyle = '#94a3b8';
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(c.x + 6 + k * 8, c.y + 6 + j * 8, 3, 3);
      }
    }
  }
  // Col 6: Fire Vent Trap
  {
    const c = cell(6, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#1c1917');
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
  }
  // Col 7: Poison Gas Trap
  {
    const c = cell(7, 5);
    drawPixelRect(ctx, c.x, c.y, c.w, c.h, '#022c22');
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(c.x + c.w * 0.5, c.y + c.h * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
