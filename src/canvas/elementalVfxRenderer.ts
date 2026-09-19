/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState } from '../types';
import { ElementalTile } from '../types/elemental';

export interface RenderElementalParams {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  camX: number;
  camY: number;
  dimensions: { width: number; height: number };
  tileSize: number;
  animationTick: number;
}

/**
 * High-performance elemental field renderer for active Fire, Ice, Shock, Steam, and Poison Gas.
 */
export function renderElementalFields({
  ctx,
  gameState,
  camX,
  camY,
  dimensions,
  tileSize,
  animationTick,
}: RenderElementalParams): void {
  const fields = gameState.elementalFields;
  if (!fields || fields.length === 0) return;

  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;
  const minX = camX - halfWidth - tileSize * 2;
  const maxX = camX + halfWidth + tileSize * 2;
  const minY = camY - halfHeight - tileSize * 2;
  const maxY = camY + halfHeight + tileSize * 2;

  const time = animationTick * 0.05;

  ctx.save();

  for (const elem of fields) {
    const rx = elem.x * tileSize - camX + halfWidth;
    const ry = elem.y * tileSize - camY + halfHeight;

    // Viewport frustum culling
    if (rx + tileSize < 0 || rx > dimensions.width || ry + tileSize < 0 || ry > dimensions.height) {
      continue;
    }

    const phase = (elem.x * 3.14 + elem.y * 2.71 + time) % (Math.PI * 2);

    // 1. FIRE ELEMENT
    if (elem.element === 'fire') {
      const flicker = 0.6 + Math.sin(phase * 3) * 0.25;

      // Outer heat glow
      ctx.fillStyle = `rgba(249, 115, 22, ${(flicker * 0.35).toFixed(3)})`;
      ctx.fillRect(rx, ry, tileSize, tileSize);

      // Inner flame tongues
      const flameHeight = tileSize * (0.5 + Math.sin(phase * 4) * 0.25);
      const flameGrad = ctx.createLinearGradient(rx, ry + tileSize, rx, ry + tileSize - flameHeight);
      flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
      flameGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.8)');
      flameGrad.addColorStop(1, 'rgba(253, 224, 71, 0.9)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(rx + tileSize * 0.2, ry + tileSize);
      ctx.quadraticCurveTo(
        rx + tileSize * 0.3,
        ry + tileSize - flameHeight * 0.8,
        rx + tileSize * 0.5,
        ry + tileSize - flameHeight
      );
      ctx.quadraticCurveTo(
        rx + tileSize * 0.7,
        ry + tileSize - flameHeight * 0.8,
        rx + tileSize * 0.8,
        ry + tileSize
      );
      ctx.closePath();
      ctx.fill();

      // Dancing embers
      const emberY = ry + tileSize - ((animationTick * 2 + elem.x * 7) % tileSize);
      const emberX = rx + tileSize * 0.5 + Math.sin(phase * 2) * (tileSize * 0.3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(emberX, emberY, 2, 2);
    }

    // 2. ICE ELEMENT
    else if (elem.element === 'ice') {
      // Ice frosted surface
      ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.fillRect(rx, ry, tileSize, tileSize);

      // Crystalline border / frost cracks
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx + 2, ry + 2);
      ctx.lineTo(rx + tileSize - 2, ry + 2);
      ctx.lineTo(rx + tileSize - 2, ry + tileSize - 2);
      ctx.lineTo(rx + 2, ry + tileSize - 2);
      ctx.closePath();
      ctx.stroke();

      // Specular glint
      const glintVal = Math.sin(phase * 1.5);
      if (glintVal > 0.4) {
        ctx.fillStyle = '#ffffff';
        const gx = rx + tileSize * 0.4;
        const gy = ry + tileSize * 0.4;
        ctx.fillRect(gx, gy, 3, 3);
      }
    }

    // 3. SHOCK ELEMENT
    else if (elem.element === 'shock') {
      // Electric surge overlay
      const shockAlpha = 0.5 + Math.sin(phase * 8) * 0.3;
      ctx.fillStyle = `rgba(56, 189, 248, ${(shockAlpha * 0.3).toFixed(3)})`;
      ctx.fillRect(rx, ry, tileSize, tileSize);

      // Jagged electric arcs
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const p1x = rx + (Math.sin(phase * 5) * 0.3 + 0.5) * tileSize;
      const p1y = ry + 2;
      const p2x = rx + tileSize * 0.5 + Math.cos(phase * 6) * (tileSize * 0.25);
      const p2y = ry + tileSize * 0.5;
      const p3x = rx + (Math.cos(phase * 4) * 0.3 + 0.5) * tileSize;
      const p3y = ry + tileSize - 2;

      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.stroke();
    }

    // 4. STEAM ELEMENT
    else if (elem.element === 'steam') {
      const steamAlpha = 0.35 + Math.sin(phase * 2) * 0.15;
      ctx.fillStyle = `rgba(226, 232, 240, ${(steamAlpha).toFixed(3)})`;

      const puffX = rx + tileSize * 0.5 + Math.sin(phase) * 4;
      const puffY = ry + tileSize * 0.5 - Math.cos(phase) * 3;
      const radius = tileSize * 0.55;

      ctx.beginPath();
      ctx.arc(puffX, puffY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. POISON GAS ELEMENT
    else if (elem.element === 'poison_gas') {
      const gasAlpha = 0.4 + Math.sin(phase * 2.5) * 0.15;
      ctx.fillStyle = `rgba(34, 197, 94, ${(gasAlpha * 0.45).toFixed(3)})`;

      const gx = rx + tileSize * 0.5 + Math.cos(phase * 1.5) * 5;
      const gy = ry + tileSize * 0.5 + Math.sin(phase * 1.5) * 4;
      const radius = tileSize * 0.6;

      ctx.beginPath();
      ctx.arc(gx, gy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Noxious purple wisps
      ctx.fillStyle = `rgba(168, 85, 247, ${(gasAlpha * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(gx + 3, gy - 2, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
