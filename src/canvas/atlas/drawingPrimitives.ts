/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellRect } from './types';

/**
 * Helper to calculate grid cell bounding coordinates
 */
export function getCell(col: number, row: number, size: number): CellRect {
  return {
    x: col * size,
    y: row * size,
    w: size,
    h: size,
  };
}

/**
 * Helper to draw a pixel-art style rounded or beveled rectangle
 */
export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  strokeColor?: string
): void {
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);

  if (strokeColor && strokeColor !== 'transparent') {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}
