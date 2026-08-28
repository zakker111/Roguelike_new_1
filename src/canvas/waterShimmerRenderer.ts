import { TileType } from '../types';

export interface WaterShimmerOptions {
  tileSize: number;
  timeMs?: number;
}

/**
 * Renders procedural sine-wave water shimmer ripples and shoreline foam crests on Water tiles.
 */
export function renderWaterTileShimmer(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  tileSize: number,
  tileX: number,
  tileY: number,
  biome: string = 'forest',
  isShallow: boolean = false,
  timeMs: number = Date.now()
) {
  const time = timeMs * 0.002;
  const isTundra = biome === 'tundra';
  const isSwamp = biome === 'swamp';
  const isDesert = biome === 'desert';

  // Spatial noise offset based on grid coordinates
  const coordOffset = (tileX * 3.7 + tileY * 5.3) % (Math.PI * 2);

  ctx.save();

  if (isTundra) {
    // Tundra: Icy crystalline glint & frosty sheen
    const glintPhase = Math.sin(time * 1.5 + coordOffset);
    if (glintPhase > 0.3) {
      const glintAlpha = (glintPhase - 0.3) * 0.45;
      ctx.fillStyle = `rgba(224, 242, 254, ${glintAlpha.toFixed(3)})`;
      const glintX = rx + ((tileX * 7 + tileY * 11) % (tileSize - 8)) + 4;
      const glintY = ry + ((tileX * 13 + tileY * 5) % (tileSize - 8)) + 4;
      
      ctx.beginPath();
      ctx.moveTo(glintX, glintY - 2.5);
      ctx.lineTo(glintX + 0.8, glintY - 0.8);
      ctx.lineTo(glintX + 2.5, glintY);
      ctx.lineTo(glintX + 0.8, glintY + 0.8);
      ctx.lineTo(glintX, glintY + 2.5);
      ctx.lineTo(glintX - 0.8, glintY + 0.8);
      ctx.lineTo(glintX - 2.5, glintY);
      ctx.lineTo(glintX - 0.8, glintY - 0.8);
      ctx.closePath();
      ctx.fill();
    }
  } else if (isSwamp) {
    // Swamp: Murky toxic bubbles and slow algae film drift
    const bubblePhase = (time * 0.8 + coordOffset) % (Math.PI * 2);
    if (bubblePhase > 4.5) {
      const bubbleProgress = (bubblePhase - 4.5) / (Math.PI * 2 - 4.5);
      const bubbleX = rx + ((tileX * 11) % (tileSize - 10)) + 5;
      const bubbleY = ry + tileSize - (bubbleProgress * (tileSize - 8));
      const bubbleRadius = 1.2 + bubbleProgress * 1.5;
      const bubbleAlpha = (1 - bubbleProgress) * 0.5;

      ctx.strokeStyle = `rgba(163, 230, 53, ${bubbleAlpha.toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Forest / Desert / Ocean: Flowing sinusoidal specular ripples & shore foam lines
    const ripple1 = Math.sin(time * 2.2 + coordOffset + ry * 0.1);
    const ripple2 = Math.cos(time * 1.6 - coordOffset + rx * 0.1);

    const baseColor = isDesert ? '34, 211, 238' : (isShallow ? '56, 189, 248' : '186, 230, 253');
    const alpha = Math.max(0, (ripple1 * 0.5 + ripple2 * 0.5) * 0.28);

    if (alpha > 0.05) {
      ctx.strokeStyle = `rgba(${baseColor}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.0;

      // Draw subtle dual wave ripples across the tile
      const yOffset1 = ry + 8 + Math.sin(time * 2.0 + tileX) * 3;
      const yOffset2 = ry + tileSize - 8 + Math.cos(time * 1.8 + tileY) * 3;

      ctx.beginPath();
      // Wave 1
      ctx.moveTo(rx + 3, yOffset1);
      ctx.quadraticCurveTo(rx + tileSize * 0.5, yOffset1 + ripple1 * 2, rx + tileSize - 3, yOffset1);
      
      // Wave 2
      ctx.moveTo(rx + 5, yOffset2);
      ctx.quadraticCurveTo(rx + tileSize * 0.5, yOffset2 - ripple2 * 2, rx + tileSize - 5, yOffset2);
      ctx.stroke();
    }

    // Occasional bright specular sparkle
    const sparkleCheck = (tileX * 19 + tileY * 23 + Math.floor(time * 0.8)) % 29;
    if (sparkleCheck === 0) {
      const sparkleAlpha = 0.35 + Math.sin(time * 4) * 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha.toFixed(2)})`;
      const spX = rx + ((tileX * 13) % (tileSize - 12)) + 6;
      const spY = ry + ((tileY * 17) % (tileSize - 12)) + 6;
      ctx.fillRect(spX, spY, 1.5, 1.5);
    }
  }

  ctx.restore();
}
