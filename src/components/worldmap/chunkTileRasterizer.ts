import { TileType, OverworldChunk } from '../../types';
import { generateOverworldChunk } from '../../utils/overworld';
import { multiOctaveNoise } from '../../world/organic/biomeNoiseEngine';

// Cache for rendered chunk canvases with LRU (Least Recently Used) tracking
const chunkCanvasCache = new Map<string, HTMLCanvasElement>();
const chunkMacroCanvasCache = new Map<string, HTMLCanvasElement>();
const MAX_CHUNK_CACHE_SIZE = 350;
const MAX_MACRO_CACHE_SIZE = 600;

/**
 * Returns a high-contrast, cartographic color hex for a given tile and its biome context.
 */
export function getTileCartographyColor(tile: TileType, biome: string, x: number, y: number): string {
  // Deterministic micro-variation based on coordinate
  const noise = ((x * 17 + y * 31) % 10) / 10;

  switch (tile) {
    case TileType.Path:
    case TileType.TownGate:
      // Golden earthen cobblestone road highway & trade trails
      return noise > 0.6 ? '#f59e0b' : (noise > 0.3 ? '#d97706' : '#b45309');

    case TileType.Water:
      // Shimmering crystalline ocean, lakes, and river channels
      if (biome === 'tundra') return noise > 0.6 ? '#7dd3fc' : '#0284c7';
      if (biome === 'glacial') return noise > 0.6 ? '#e0f2fe' : '#38bdf8';
      if (biome === 'volcanic') return noise > 0.6 ? '#ef4444' : '#b91c1c';
      if (biome === 'coral_reef') return noise > 0.6 ? '#06b6d4' : '#0284c7';
      if (biome === 'swamp') return noise > 0.5 ? '#155e75' : '#083344';
      return noise > 0.7 ? '#38bdf8' : (noise > 0.3 ? '#0284c7' : '#0369a1');

    case TileType.Tree:
    case TileType.Bush:
    case TileType.TreeStump:
      if (biome === 'desert') return noise > 0.5 ? '#ca8a04' : '#a16207';
      if (biome === 'tundra') return noise > 0.5 ? '#0f766e' : '#115e59';
      if (biome === 'glacial') return noise > 0.5 ? '#7dd3fc' : '#0284c7';
      if (biome === 'volcanic') return noise > 0.5 ? '#7f1d1d' : '#450a0a';
      if (biome === 'coral_reef') return noise > 0.5 ? '#f472b6' : '#ec4899';
      if (biome === 'swamp') return noise > 0.5 ? '#365314' : '#1a2e05';
      return noise > 0.6 ? '#059669' : (noise > 0.3 ? '#047857' : '#065f46');

    case TileType.PineTree:
      if (biome === 'tundra') return noise > 0.5 ? '#14b8a6' : '#0f766e';
      return noise > 0.5 ? '#047857' : '#064e3b';

    case TileType.BirchTree:
      return noise > 0.5 ? '#6ee7b7' : '#10b981';

    case TileType.Wall:
    case TileType.WatchtowerWall:
    case TileType.WatchtowerSlit:
    case TileType.WatchtowerBarricade:
      // Slate granite fortress, castle walls & battlements
      return noise > 0.5 ? '#64748b' : '#334155';

    case TileType.Door:
      return '#d97706';

    case TileType.Floor:
    case TileType.Table:
    case TileType.Chair:
    case TileType.Bed:
    case TileType.Bedroll:
    case TileType.FieldTent:
    case TileType.Anvil:
    case TileType.Fireplace:
    case TileType.WatchtowerDeck:
      // Interior polished timber planks
      return noise > 0.5 ? '#78350f' : '#92400e';

    case TileType.IronVein:
      return '#38bdf8';

    case TileType.CopperVein:
      return '#fb923c';

    case TileType.DungeonEntrance:
    case TileType.StairsDown:
    case TileType.StairsUp:
      return '#c084fc';

    case TileType.Campfire:
    case TileType.Torch:
    case TileType.WatchtowerFlag:
      return '#ef4444';

    case TileType.Sign:
      return '#f59e0b';

    case TileType.Grass:
    case TileType.Empty:
    default:
      // Base Biome Ground Terrain
      if (biome === 'town') {
        return noise > 0.6 ? '#3b0764' : '#1e1b4b';
      }
      if (biome === 'desert') {
        return noise > 0.6 ? '#78350f' : (noise > 0.3 ? '#92400e' : '#b45309');
      }
      if (biome === 'tundra') {
        return noise > 0.7 ? '#e0f2fe' : (noise > 0.4 ? '#0369a1' : '#0c4a6e');
      }
      if (biome === 'glacial') {
        return noise > 0.7 ? '#f0f9ff' : (noise > 0.4 ? '#bae6fd' : '#0284c7');
      }
      if (biome === 'volcanic') {
        return noise > 0.7 ? '#450a0a' : (noise > 0.3 ? '#2a0a0a' : '#140303');
      }
      if (biome === 'coral_reef') {
        return noise > 0.7 ? '#083344' : (noise > 0.3 ? '#0c4a6e' : '#042738');
      }
      if (biome === 'swamp') {
        return noise > 0.6 ? '#1e3a1f' : (noise > 0.3 ? '#365314' : '#142911');
      }
      if (biome === 'mountain') {
        return noise > 0.6 ? '#334155' : '#0f172a';
      }
      // Forest
      return noise > 0.7 ? '#047857' : (noise > 0.3 ? '#064e3b' : '#022c22');
  }
}

/**
 * Generates or retrieves an offscreen canvas rendering of the given chunk.
 * Renders the entire tile grid (roads, rivers, trees, buildings, ores, portals).
 */
export function getOrCreateChunkCanvas(
  chunkX: number,
  chunkY: number,
  chunk?: OverworldChunk | null,
  predictedBiome: string = 'forest'
): HTMLCanvasElement {
  const cacheKey = `${chunkX},${chunkY}_${chunk ? 'loaded' : 'gen'}`;
  
  const existing = chunkCanvasCache.get(cacheKey);
  if (existing) {
    // Refresh LRU order
    chunkCanvasCache.delete(cacheKey);
    chunkCanvasCache.set(cacheKey, existing);
    return existing;
  }

  // Obtain the map grid
  let mapGrid: TileType[][] = [];
  let biome = predictedBiome;

  try {
    if (chunk && chunk.map && chunk.map.length > 0) {
      mapGrid = chunk.map;
      biome = chunk.biome || predictedBiome;
    } else {
      // Generate chunk map on the fly
      const generated = generateOverworldChunk(chunkX, chunkY, 64, 40);
      mapGrid = generated.map;
      biome = generated.biome || predictedBiome;
    }
  } catch (err) {
    console.warn(`[Rasterizer] Chunk map fallback for (${chunkX},${chunkY}):`, err);
  }

  const height = mapGrid.length > 0 ? mapGrid.length : 40;
  const width = mapGrid[0]?.length || 64;

  if (typeof document === 'undefined') {
    return { width, height } as HTMLCanvasElement;
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  } catch {
    return { width, height } as HTMLCanvasElement;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return canvas;

  try {
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

  // Pre-fill pixels with topographic hillshading and contour relief
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = mapGrid[y][x] || TileType.Grass;
      const hex = getTileCartographyColor(tile, biome, x, y);

      // Parse hex to rgb
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);

      // Continuous world coordinates for elevation hillshading
      const wx = chunkX * width + x;
      const wy = chunkY * height + y;

      // Northwest-to-Southeast elevation gradient (Lambertian relief hillshading)
      const elevNW = multiOctaveNoise(wx - 1, wy - 1, 3, 0.5, 2.0, 8675309);
      const elevSE = multiOctaveNoise(wx + 1, wy + 1, 3, 0.5, 2.0, 8675309);
      const elevCenter = multiOctaveNoise(wx, wy, 3, 0.5, 2.0, 8675309);

      const slope = (elevNW - elevSE) * 2.4;
      let lightMod = 1.0 + slope * 0.38 + (elevCenter - 0.5) * 0.28;

      if (tile === TileType.Grass || tile === TileType.Empty) {
        // Subtle topographic contour interval ring accents
        if ((elevCenter * 22) % 1.0 < 0.055 && elevCenter > 0.35) {
          lightMod *= 0.84; // Crisp contour ridge line
        }
        // Alpine mountain peak highlight
        if (elevCenter > 0.72) {
          lightMod *= 1.22;
        }
      } else if (tile === TileType.Water) {
        // Oceanic / river channel depth gradient
        const depthFactor = 0.88 + (1 - elevCenter) * 0.24;
        lightMod = Math.min(1.2, Math.max(0.72, depthFactor + slope * 0.12));
      } else if (tile === TileType.Path || tile === TileType.TownGate) {
        // Preserve high legibility on trade roads
        lightMod = Math.min(1.15, Math.max(0.92, 1.0 + (elevCenter - 0.5) * 0.1));
      }

      // Clamp lighting bounds to prevent clipping or washing out
      lightMod = Math.min(1.38, Math.max(0.62, lightMod));

      r = Math.min(255, Math.max(0, Math.round(r * lightMod)));
      g = Math.min(255, Math.max(0, Math.round(g * lightMod)));
      b = Math.min(255, Math.max(0, Math.round(b * lightMod)));

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn(`[Rasterizer] Render error for (${chunkX},${chunkY}):`, err);
  }

  // Store in cache with strict LRU eviction
  if (chunkCanvasCache.size >= MAX_CHUNK_CACHE_SIZE) {
    const oldestKey = chunkCanvasCache.keys().next().value;
    if (oldestKey) chunkCanvasCache.delete(oldestKey);
  }

  chunkCanvasCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Generates or retrieves an ultra-lightweight downsampled 16x10 LOD Macro thumbnail canvas
 * for wide-angle continental views (zoom < 0.75x). Drastically minimizes memory and CPU draw times.
 */
export function getOrCreateChunkMacroCanvas(
  chunkX: number,
  chunkY: number,
  chunk?: OverworldChunk | null,
  predictedBiome: string = 'forest'
): HTMLCanvasElement {
  const cacheKey = `${chunkX},${chunkY}_macro_${chunk ? 'loaded' : 'gen'}`;

  const existing = chunkMacroCanvasCache.get(cacheKey);
  if (existing) {
    chunkMacroCanvasCache.delete(cacheKey);
    chunkMacroCanvasCache.set(cacheKey, existing);
    return existing;
  }

  // If full resolution canvas is already cached, downsample it directly
  const fullCacheKey = `${chunkX},${chunkY}_${chunk ? 'loaded' : 'gen'}`;
  const fullCanvas = chunkCanvasCache.get(fullCacheKey);
  if (fullCanvas && typeof document !== 'undefined') {
    try {
      const macroCanvas = document.createElement('canvas');
      macroCanvas.width = 16;
      macroCanvas.height = 10;
      const mctx = macroCanvas.getContext('2d');
      if (mctx) {
        mctx.imageSmoothingEnabled = true;
        mctx.drawImage(fullCanvas, 0, 0, 16, 10);
        if (chunkMacroCanvasCache.size >= MAX_MACRO_CACHE_SIZE) {
          const oldest = chunkMacroCanvasCache.keys().next().value;
          if (oldest) chunkMacroCanvasCache.delete(oldest);
        }
        chunkMacroCanvasCache.set(cacheKey, macroCanvas);
        return macroCanvas;
      }
    } catch {
      // Fall through to procedural generation
    }
  }

  // Obtain the map grid or generate on the fly
  let mapGrid: TileType[][] = [];
  let biome = predictedBiome;

  try {
    if (chunk && chunk.map && chunk.map.length > 0) {
      mapGrid = chunk.map;
      biome = chunk.biome || predictedBiome;
    } else {
      const generated = generateOverworldChunk(chunkX, chunkY, 64, 40);
      mapGrid = generated.map;
      biome = generated.biome || predictedBiome;
    }
  } catch (err) {
    console.warn(`[MacroRasterizer] Fallback for (${chunkX},${chunkY}):`, err);
  }

  const origHeight = mapGrid.length > 0 ? mapGrid.length : 40;
  const origWidth = mapGrid[0]?.length || 64;
  const macroW = 16;
  const macroH = 10;

  if (typeof document === 'undefined') {
    return { width: macroW, height: macroH } as HTMLCanvasElement;
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = document.createElement('canvas');
    canvas.width = macroW;
    canvas.height = macroH;
  } catch {
    return { width: macroW, height: macroH } as HTMLCanvasElement;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return canvas;

  try {
    const imgData = ctx.createImageData(macroW, macroH);
    const data = imgData.data;

    const stepX = Math.max(1, Math.floor(origWidth / macroW));
    const stepY = Math.max(1, Math.floor(origHeight / macroH));

    for (let my = 0; my < macroH; my++) {
      const origY = Math.min(origHeight - 1, my * stepY);
      for (let mx = 0; mx < macroW; mx++) {
        const origX = Math.min(origWidth - 1, mx * stepX);
        const tile = mapGrid[origY]?.[origX] || TileType.Grass;
        const hex = getTileCartographyColor(tile, biome, origX, origY);

        const r = parseInt(hex.slice(1, 3), 16) || 40;
        const g = parseInt(hex.slice(3, 5), 16) || 120;
        const b = parseInt(hex.slice(5, 7), 16) || 60;

        const idx = (my * macroW + mx) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn(`[MacroRasterizer] Render error for (${chunkX},${chunkY}):`, err);
  }

  if (chunkMacroCanvasCache.size >= MAX_MACRO_CACHE_SIZE) {
    const oldestKey = chunkMacroCanvasCache.keys().next().value;
    if (oldestKey) chunkMacroCanvasCache.delete(oldestKey);
  }

  chunkMacroCanvasCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Invalidates the canvas cache for a specific chunk or entirely.
 */
export function invalidateChunkCanvasCache(chunkX?: number, chunkY?: number) {
  if (typeof chunkX === 'number' && typeof chunkY === 'number') {
    chunkCanvasCache.delete(`${chunkX},${chunkY}_loaded`);
    chunkCanvasCache.delete(`${chunkX},${chunkY}_gen`);
    chunkMacroCanvasCache.delete(`${chunkX},${chunkY}_macro_loaded`);
    chunkMacroCanvasCache.delete(`${chunkX},${chunkY}_macro_gen`);
  } else {
    chunkCanvasCache.clear();
    chunkMacroCanvasCache.clear();
  }
}
