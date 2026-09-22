import { ChunkMapInfo, WorldMapFilterState } from './types';
import { OverworldChunk } from '../../types';
import { getOrCreateChunkCanvas, getOrCreateChunkMacroCanvas } from './chunkTileRasterizer';

export interface TerrainRenderOptions {
  ctx: CanvasRenderingContext2D;
  visibleMinX: number;
  visibleMaxX: number;
  visibleMinY: number;
  visibleMaxY: number;
  chunkSize: number;
  zoomLevel: number;
  getChunkData: (cx: number, cy: number) => ChunkMapInfo;
  overworldChunks: Record<string, OverworldChunk>;
  filters: WorldMapFilterState;
}

/**
 * Renders the deep antique nautical cartography canvas background.
 */
export function renderWorldMapBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = '#060911';
  ctx.fillRect(0, 0, width, height);
}

/**
 * Pure canvas drawing pass for terrain chunks:
 * - Unexplored fog of war with organic burnt parchment stipples & coordinates
 * - Discovered micro-tile maps vs LOD macro surface maps
 * - Cartographic parchment borders
 * - Trade caravan arterial highways and crossroads junction diamonds
 * - Sector coordinate labels
 */
export function renderWorldMapTerrain({
  ctx,
  visibleMinX,
  visibleMaxX,
  visibleMinY,
  visibleMaxY,
  chunkSize,
  zoomLevel,
  getChunkData,
  overworldChunks,
  filters,
}: TerrainRenderOptions): void {
  for (let cy = visibleMinY; cy <= visibleMaxY; cy++) {
    for (let cx = visibleMinX; cx <= visibleMaxX; cx++) {
      const x = cx * chunkSize;
      const y = cy * chunkSize;

      const info = getChunkData(cx, cy);
      const key = `${cx},${cy}`;
      const existingChunk = overworldChunks[key];

      if (!info.isDiscovered) {
        // Unexplored Fog of War Parchment with organic burnt edge effect
        ctx.fillStyle = '#060a12';
        ctx.fillRect(x, y, chunkSize, chunkSize);

        // Subtle antique cartographic contour stipples & parchment grain
        ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
        ctx.beginPath();
        ctx.arc(x + chunkSize * 0.28, y + chunkSize * 0.35, chunkSize * 0.18, 0, Math.PI * 2);
        ctx.arc(x + chunkSize * 0.72, y + chunkSize * 0.65, chunkSize * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Organic burnt edge perimeter border
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, chunkSize, chunkSize);

        // Uncharted coordinate watermark
        if (zoomLevel >= 1.0) {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`? [${cx},${cy}]`, x + chunkSize / 2, y + chunkSize / 2);
        }

        // Custom pins in uncharted land
        if (filters.showCustomPins && info.customPins && info.customPins.length > 0) {
          const pin = info.customPins[0];
          ctx.fillStyle = pin.color || '#f59e0b';
          ctx.beginPath();
          ctx.arc(x + chunkSize / 2, y + chunkSize / 2, 3.5 * zoomLevel, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        continue;
      }

      // DISCOVERED CHUNK: High-Fidelity Micro-Tile vs LOD Macro Surface Map Rendering
      try {
        const chunkCanvas =
          zoomLevel < 0.75
            ? getOrCreateChunkMacroCanvas(cx, cy, existingChunk, info.biome)
            : getOrCreateChunkCanvas(cx, cy, existingChunk, info.biome);

        if (chunkCanvas && (chunkCanvas as HTMLCanvasElement).width > 0) {
          // Draw the raster map with integer pixel alignment
          ctx.imageSmoothingEnabled = zoomLevel < 0.75;
          ctx.drawImage(chunkCanvas, Math.round(x), Math.round(y), Math.round(chunkSize), Math.round(chunkSize));
        } else {
          ctx.fillStyle = info.biome === 'desert' ? '#ca8a04' : (info.biome === 'tundra' ? '#0f766e' : '#15803d');
          ctx.fillRect(Math.round(x), Math.round(y), Math.round(chunkSize), Math.round(chunkSize));
        }
      } catch {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(chunkSize), Math.round(chunkSize));
      }

      // Elegant cartographic parchment border (only when moderately zoomed in)
      if (zoomLevel >= 0.6) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, chunkSize, chunkSize);
      }

      // Draw Trade Caravan Highway overlay if enabled
      if (filters.showCaravanRoutes) {
        const isMainHighwayX = cx % 4 === 0;
        const isMainHighwayY = cy % 4 === 0;

        if (isMainHighwayX || isMainHighwayY) {
          // Outer casing / atmospheric glow
          ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
          ctx.lineWidth = Math.max(3, 4 * zoomLevel);
          ctx.beginPath();
          if (isMainHighwayX) {
            ctx.moveTo(x + chunkSize / 2, y);
            ctx.lineTo(x + chunkSize / 2, y + chunkSize);
          }
          if (isMainHighwayY) {
            ctx.moveTo(x, y + chunkSize / 2);
            ctx.lineTo(x + chunkSize, y + chunkSize / 2);
          }
          ctx.stroke();

          // Inner golden arterial trade highway line
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.lineWidth = Math.max(1.5, 2 * zoomLevel);
          ctx.setLineDash([5 * zoomLevel, 3 * zoomLevel]);
          ctx.beginPath();
          if (isMainHighwayX) {
            ctx.moveTo(x + chunkSize / 2, y);
            ctx.lineTo(x + chunkSize / 2, y + chunkSize);
          }
          if (isMainHighwayY) {
            ctx.moveTo(x, y + chunkSize / 2);
            ctx.lineTo(x + chunkSize, y + chunkSize / 2);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Crossroads junction diamond on highway intersections
          if (isMainHighwayX && isMainHighwayY) {
            const jX = x + chunkSize / 2;
            const jY = y + chunkSize / 2;
            const r = Math.max(3, 4.5 * zoomLevel);

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(jX, jY - r);
            ctx.lineTo(jX + r, jY);
            ctx.lineTo(jX, jY + r);
            ctx.lineTo(jX - r, jY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Coordinate Label
      if (zoomLevel >= 0.8) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`[${cx},${cy}]`, x + 3, y + 3);
      }
    }
  }
}

/**
 * Renders HUD elements: Nautical Compass Rose and Sector Scale Bar.
 */
export function renderWorldMapHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  chunkSize: number
): void {
  // HUD: Render Nautical Compass Rose
  const compassX = width - 48;
  const compassY = height - 48;

  ctx.save();
  ctx.translate(compassX, compassY);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // North arrow
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(5, -4);
  ctx.lineTo(-5, -4);
  ctx.closePath();
  ctx.fill();

  // South arrow
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(5, 4);
  ctx.lineTo(-5, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -10);
  ctx.restore();

  // Scale Bar
  const scaleBarW = chunkSize;
  const scaleBarX = 14;
  const scaleBarY = height - 16;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(scaleBarX - 4, scaleBarY - 14, scaleBarW + 8, 20);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(scaleBarX, scaleBarY);
  ctx.lineTo(scaleBarX + scaleBarW, scaleBarY);
  ctx.moveTo(scaleBarX, scaleBarY - 4);
  ctx.lineTo(scaleBarX, scaleBarY + 4);
  ctx.moveTo(scaleBarX + scaleBarW, scaleBarY - 4);
  ctx.lineTo(scaleBarX + scaleBarW, scaleBarY + 4);
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('1 Sector (64x40)', scaleBarX + scaleBarW / 2, scaleBarY - 6);
}
