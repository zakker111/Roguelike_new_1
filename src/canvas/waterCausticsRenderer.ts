/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WaterCausticsOptions {
  tileSize: number;
  timeMs?: number;
  isShallow?: boolean;
}

/**
 * Renders procedural, multi-scale dynamic water caustics, refracting light webs,
 * and current drift ripples on water tiles.
 */
export function renderDynamicWaterCaustics(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  tileSize: number,
  tileX: number,
  tileY: number,
  biome: string = 'forest',
  timeMs: number = Date.now()
): void {
  const t = timeMs * 0.0018;
  const isTundra = biome === 'tundra' || biome === 'glacial';
  const isSwamp = biome === 'swamp';
  const isDesert = biome === 'desert';

  // Spatial phase offset based on world coordinates to prevent uniform tiling repetition
  const phase1 = (tileX * 1.37 + tileY * 2.11) % (Math.PI * 2);
  const phase2 = (tileX * 2.73 - tileY * 1.49) % (Math.PI * 2);

  ctx.save();

  if (isTundra) {
    // Tundra / Glacial: Sharp prismatic ice-crystal refraction glints
    const glint = Math.sin(t * 1.4 + phase1) * Math.cos(t * 0.9 + phase2);
    if (glint > 0.25) {
      const alpha = Math.min(0.65, (glint - 0.25) * 0.9);
      ctx.fillStyle = `rgba(186, 230, 253, ${alpha.toFixed(3)})`;
      
      const cx = rx + tileSize * 0.5 + Math.sin(t * 0.6 + phase1) * (tileSize * 0.22);
      const cy = ry + tileSize * 0.5 + Math.cos(t * 0.8 + phase2) * (tileSize * 0.22);
      const size = 2.2 + glint * 1.8;

      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx + size * 0.35, cy - size * 0.35);
      ctx.lineTo(cx + size, cy);
      ctx.lineTo(cx + size * 0.35, cy + size * 0.35);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx - size * 0.35, cy + size * 0.35);
      ctx.lineTo(cx - size, cy);
      ctx.lineTo(cx - size * 0.35, cy - size * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  } else if (isSwamp) {
    // Swamp: Murky biophosphorescent caustic swirl and drifting scum filaments
    const wave = Math.sin(t * 0.7 + phase1) + Math.cos(t * 0.5 + phase2);
    if (wave > 0.4) {
      const alpha = Math.min(0.35, (wave - 0.4) * 0.3);
      ctx.strokeStyle = `rgba(132, 204, 22, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      const sx = rx + ((tileX * 13 + tileY * 7) % Math.max(1, tileSize - 8)) + 4;
      const sy = ry + ((tileX * 5 + tileY * 11) % Math.max(1, tileSize - 8)) + 4;
      ctx.arc(sx, sy, 2.5 + wave * 1.5, 0, Math.PI * 1.5);
      ctx.stroke();
    }
  } else {
    // Ocean, Rivers, Lakes: Undulating caustic light ribbons & intersecting wave crests
    const u1 = Math.sin(t * 1.2 + rx * 0.08 + phase1);
    const u2 = Math.cos(t * 0.9 + ry * 0.08 + phase2);
    const causticIntensity = (u1 * u2 + 1) * 0.5; // Normalized 0.0 to 1.0

    if (causticIntensity > 0.45) {
      const alpha = Math.min(0.42, (causticIntensity - 0.45) * 0.75);
      const strokeCol = isDesert
        ? `rgba(254, 240, 138, ${alpha.toFixed(3)})` // Desert Oasis golden reflection
        : `rgba(224, 242, 254, ${alpha.toFixed(3)})`; // Deep clear blue / silver caustic

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.2;

      // Curved caustic filament arc
      ctx.beginPath();
      const startX = rx + ((tileX * 11) % 6) + 3;
      const startY = ry + (causticIntensity * (tileSize - 6)) + 3;
      const ctrlX = rx + tileSize * 0.5 + u1 * 4;
      const ctrlY = ry + tileSize * 0.5 + u2 * 4;
      const endX = rx + tileSize - 3;
      const endY = ry + ((1 - causticIntensity) * (tileSize - 6)) + 3;

      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      ctx.stroke();

      // Intersecting secondary caustic strand
      if (causticIntensity > 0.72) {
        ctx.strokeStyle = isDesert
          ? `rgba(253, 224, 71, ${(alpha * 0.8).toFixed(3)})`
          : `rgba(186, 230, 253, ${(alpha * 0.8).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(rx + tileSize * 0.2, ry + tileSize - 4);
        ctx.quadraticCurveTo(ctrlX, ctrlY, rx + tileSize * 0.8, ry + 4);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * Renders shimmering caustic refraction ribbons projected onto submerged entities,
 * corpses, or loot items resting in shallow water.
 */
export function renderSubmergedObjectCaustics(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  timeMs: number = Date.now()
): void {
  const t = timeMs * 0.0022;
  const alpha1 = 0.14 + Math.sin(t * 1.5 + screenX * 0.05) * 0.09;
  const alpha2 = 0.14 + Math.cos(t * 1.1 + screenY * 0.05) * 0.09;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Soft undulating cyan caustic wash
  ctx.strokeStyle = `rgba(186, 230, 253, ${(alpha1 + alpha2).toFixed(3)})`;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  const yOffset = height * 0.45;
  ctx.moveTo(screenX, screenY + yOffset + Math.sin(t * 2) * 2);
  ctx.quadraticCurveTo(
    screenX + width * 0.5,
    screenY + yOffset - 3 + Math.cos(t * 2) * 3,
    screenX + width,
    screenY + yOffset + Math.sin(t * 2.3) * 2
  );
  ctx.stroke();

  ctx.restore();
}
