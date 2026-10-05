/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme } from './types';
import { getCell } from './drawingPrimitives';

/**
 * Procedurally generates the 16x16 Items & Equipment Atlas
 */
export function renderItemsTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
  const cols = 16;
  const rows = 16;
  const canvas = document.createElement('canvas');
  canvas.width = cols * size;
  canvas.height = rows * size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cell = (col: number, row: number) => getCell(col, row, size);

  // Row 0: Weapons (Swords, Daggers, Axes, Bows, Staves)
  // 0,0: Broadsword
  {
    const c = cell(0, 0);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(c.x + 14, c.y + 4, 4, 18); // Blade
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(c.x + 8, c.y + 20, 16, 3); // Crossguard
    ctx.fillStyle = '#78350f';
    ctx.fillRect(c.x + 14, c.y + 23, 4, 6); // Hilt
  }
  // 1,0: Dagger
  {
    const c = cell(1, 0);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(c.x + 14, c.y + 8, 4, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(c.x + 10, c.y + 20, 12, 2);
    ctx.fillRect(c.x + 14, c.y + 22, 4, 4);
  }
  // 2,0: Battleaxe
  {
    const c = cell(2, 0);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(c.x + 14, c.y + 4, 4, 24); // Shaft
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(c.x + 6, c.y + 6, 8, 12); // Left blade
    ctx.fillRect(c.x + 18, c.y + 6, 8, 12); // Right blade
  }
  // 3,0: Longbow
  {
    const c = cell(3, 0);
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
    const c = cell(4, 0);
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
    const c = cell(0, 1);
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
    const c = cell(1, 1);
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
    const c = cell(2, 1);
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
