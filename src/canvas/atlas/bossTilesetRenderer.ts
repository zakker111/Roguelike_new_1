/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme } from './types';

/**
 * Procedurally generates the 512x512 Oversized Multi-Tile Boss Atlas
 */
export function renderBossTileset(theme: MockupPaletteTheme = 'classic', size: number = 32): HTMLCanvasElement {
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
