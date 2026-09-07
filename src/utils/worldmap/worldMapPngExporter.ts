import { GameState, OverworldChunk, TileType } from '../../types';
import { getOrCreateChunkCanvas } from '../../components/worldmap/chunkTileRasterizer';
import { getDeterministicTownName, hasTownAtChunk, isCastleTownAtChunk } from '../../world/overworldStructures';
import { getContinuousTerrainMetrics } from '../../world/organic/biomeNoiseEngine';

export interface MapExportOptions {
  scale?: number; // Default 0.4 (40%)
  rangeChunks?: number; // Default 12 (renders from -12 to +12)
  includeLabels?: boolean;
  filename?: string;
}

export interface MapExportResult {
  success: boolean;
  width: number;
  height: number;
  filename: string;
  totalChunks: number;
  error?: string;
}

/**
 * Renders and exports the entire realm overworld map into a PNG file at 40% scaling.
 */
export async function exportRealmMapToPng(
  gameState: GameState,
  options: MapExportOptions = {}
): Promise<MapExportResult> {
  const scale = options.scale ?? 0.4;
  const filename = options.filename || `realm_overworld_map_scale_${Math.round(scale * 100)}pct.png`;
  const includeLabels = options.includeLabels ?? true;

  if (typeof document === 'undefined') {
    return { success: false, width: 0, height: 0, filename, totalChunks: 0, error: 'Window/Document not available' };
  }

  try {
    const currentChunkX = gameState.currentChunkX ?? 0;
    const currentChunkY = gameState.currentChunkY ?? 0;
    const overworldChunks = (gameState.overworldChunks || {}) as Record<string, OverworldChunk>;

    // Determine realm bounding box
    let minX = currentChunkX - 8;
    let maxX = currentChunkX + 8;
    let minY = currentChunkY - 6;
    let maxY = currentChunkY + 6;

    if (gameState.worldMapFullyRevealed) {
      minX = -12;
      maxX = 12;
      minY = -10;
      maxY = 10;
    } else {
      // Include all discovered / loaded chunks
      Object.keys(overworldChunks).forEach((k) => {
        const [x, y] = k.split(',').map(Number);
        if (!isNaN(x) && !isNaN(y)) {
          minX = Math.min(minX, x - 2);
          maxX = Math.max(maxX, x + 2);
          minY = Math.min(minY, y - 2);
          maxY = Math.max(maxY, y + 2);
        }
      });

      if (gameState.visitedChunks && Array.isArray(gameState.visitedChunks)) {
        gameState.visitedChunks.forEach((k: string) => {
          const [x, y] = k.split(',').map(Number);
          if (!isNaN(x) && !isNaN(y)) {
            minX = Math.min(minX, x - 2);
            maxX = Math.max(maxX, x + 2);
            minY = Math.min(minY, y - 2);
            maxY = Math.max(maxY, y + 2);
          }
        });
      }
    }

    // Clamp bounds to reasonable max export limits
    minX = Math.max(-20, minX);
    maxX = Math.min(20, maxX);
    minY = Math.max(-15, minY);
    maxY = Math.min(15, maxY);

    const chunkWidthTiles = 64;
    const chunkHeightTiles = 40;
    const baseTileSizePx = 6; // Base high-res tile size in pixels
    const scaledTileSizePx = baseTileSizePx * scale; // 40% scaling applied

    const chunkPixelWidth = chunkWidthTiles * scaledTileSizePx;
    const chunkPixelHeight = chunkHeightTiles * scaledTileSizePx;

    const totalCols = maxX - minX + 1;
    const totalRows = maxY - minY + 1;
    const totalChunks = totalCols * totalRows;

    const headerHeight = 80;
    const footerHeight = 40;
    const padding = 24;

    const mapCanvasWidth = Math.round(totalCols * chunkPixelWidth + padding * 2);
    const mapCanvasHeight = Math.round(totalRows * chunkPixelHeight + headerHeight + footerHeight + padding * 2);

    const canvas = document.createElement('canvas');
    canvas.width = mapCanvasWidth;
    canvas.height = mapCanvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { success: false, width: 0, height: 0, filename, totalChunks: 0, error: 'Could not get 2D canvas context' };
    }

    // 1. Background Parchment & Ocean Base
    ctx.fillStyle = '#060d17'; // Deep oceanic slate
    ctx.fillRect(0, 0, mapCanvasWidth, mapCanvasHeight);

    // Decorative outer border
    ctx.strokeStyle = '#b45309'; // Rich Amber/Gold Cartography border
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, mapCanvasWidth - 16, mapCanvasHeight - 16);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, mapCanvasWidth - 24, mapCanvasHeight - 24);

    // 2. Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 16, mapCanvasWidth - 32, headerHeight - 8);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚔️ DUNGEON CRAFTING ROGUELIKE — REALM CARTOGRAPHY OVERWORLD ⚔️', mapCanvasWidth / 2, 38);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(
      `Sectors: [${minX},${minY}] to [${maxX},${maxY}] (${totalChunks} Chunks) • Scale: ${Math.round(scale * 100)}% • Exported at Turn ${gameState.playerStats?.turnsPlayed || 0}`,
      mapCanvasWidth / 2,
      64
    );

    // 3. Render all Chunks
    const mapOffsetX = padding;
    const mapOffsetY = headerHeight + padding;

    const mapPrng = (x: number, y: number, seed: number = 8675309) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    // Draw chunk grids
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const chunkKey = `${cx},${cy}`;
        const chunkData = overworldChunks[chunkKey];
        const destX = mapOffsetX + (cx - minX) * chunkPixelWidth;
        const destY = mapOffsetY + (cy - minY) * chunkPixelHeight;

        // Generate or fetch chunk raster canvas
        const chunkCanvas = getOrCreateChunkCanvas(cx, cy, chunkData, chunkData?.biome || 'forest');

        if (chunkCanvas) {
          ctx.drawImage(chunkCanvas, destX, destY, chunkPixelWidth, chunkPixelHeight);
        }

        // Chunk grid borders
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(destX, destY, chunkPixelWidth, chunkPixelHeight);

        // Highlight Player Location
        if (cx === currentChunkX && cy === currentChunkY) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(destX + 1, destY + 1, chunkPixelWidth - 2, chunkPixelHeight - 2);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(destX + chunkPixelWidth / 2, destY + chunkPixelHeight / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Town & Settlement Markers
        const hasTown = (cx === 0 && cy === 0) || Boolean(chunkData?.towns?.length) || hasTownAtChunk(cx, cy, mapPrng);
        if (hasTown && includeLabels) {
          const townName = cx === 0 && cy === 0 ? 'Oakhaven Capital' : (chunkData?.towns?.[0]?.name || getDeterministicTownName(cx, cy, 8675309, mapPrng));
          const isCastle = isCastleTownAtChunk(cx, cy, mapPrng);

          // Marker icon
          ctx.fillStyle = isCastle ? '#fbbf24' : '#60a5fa';
          ctx.beginPath();
          ctx.arc(destX + chunkPixelWidth / 2, destY + chunkPixelHeight / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(townName, destX + chunkPixelWidth / 2, destY + chunkPixelHeight / 2 - 8);
        }
      }
    }

    // 4. Footer & Legend
    const footerY = mapCanvasHeight - footerHeight / 2 - 8;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🟡 Towns & Settlements   🟣 Dungeons & Portals   🔴 Player Location   🟩 Forests & Meadows   🟦 Oceans & Rivers', mapCanvasWidth / 2, footerY);

    // 5. Convert to Data URL & Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      width: mapCanvasWidth,
      height: mapCanvasHeight,
      filename,
      totalChunks
    };
  } catch (err: any) {
    console.error('[MapExporter] Failed to export map:', err);
    return {
      success: false,
      width: 0,
      height: 0,
      filename,
      totalChunks: 0,
      error: err?.message || String(err)
    };
  }
}
