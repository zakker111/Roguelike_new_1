import { TileType, GameState } from '../types';
import { SpriteSheetConfig, getStoredGraphicsMode } from './types';
import { resolveTileStyle } from './tileMapRenderer';
import { drawSpriteOrAscii } from './spriteRenderer';
import { tilesetAtlasManager } from './TilesetAtlasManager';

export interface ChunkCacheConfig {
  gameState: GameState;
  tileSize: number;
  tilesetConfig: SpriteSheetConfig;
  tilesetImage: HTMLImageElement | null;
  animationTick?: number;
  isTilesetMode?: boolean;
}

/**
 * High-Performance Static Terrain Offscreen Rasterizer & Bitmask Cache
 * Eliminates thousands of per-frame canvas operations by pre-rasterizing discovered
 * static terrain tiles into an offscreen canvas and blitting in a single O(1) drawImage call.
 */
export class ChunkBackgroundCache {
  private static instance: ChunkBackgroundCache;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  // Cached state signatures
  private cachedKey: string = '';
  private isDirty: boolean = true;
  private cachedLevelWidth: number = 0;
  private cachedLevelHeight: number = 0;
  private cachedTileSize: number = 0;
  private lastDiscoveryCount: number = -1;
  private lastMapVersion: number = 0;
  private lastMapRef: TileType[][] | null = null;
  private lastPlayerX: number = -1;
  private lastPlayerY: number = -1;
  private lastTurnsPlayed: number = -1;
  private lastChunkKey: string = '';

  // Pre-calculated Bitmask & Variant Grids (Typed Arrays for zero GC overhead)
  private cardinalBitmasks: Uint8Array | null = null;
  private tileVariants: Uint8Array | null = null;

  private constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
      if (this.offscreenCtx) {
        this.offscreenCtx.imageSmoothingEnabled = false;
      }
    }
  }

  public static getInstance(): ChunkBackgroundCache {
    if (!ChunkBackgroundCache.instance) {
      ChunkBackgroundCache.instance = new ChunkBackgroundCache();
    }
    return ChunkBackgroundCache.instance;
  }

  /**
   * Manually invalidate cache (e.g. on chunk warp, dungeon depth change, graphics mode toggle, tile harvest)
   */
  public invalidate(): void {
    this.isDirty = true;
    this.cachedKey = '';
    this.lastDiscoveryCount = -1;
    this.lastMapRef = null;
  }

  /**
   * Notify that a specific tile changed (e.g. door opened, tree chopped, ore mined, wall dug)
   */
  public invalidateTile(x: number, y: number, gameState: GameState, tileSize: number, tilesetConfig: SpriteSheetConfig, tilesetImage: HTMLImageElement | null): void {
    this.lastMapVersion++;
    if (!this.offscreenCanvas || !this.offscreenCtx || this.isDirty) {
      this.isDirty = true;
      return;
    }

    // Re-calculate bitmasks for this tile and its 4 neighbors
    this.updateBitmaskAt(x, y, gameState.map);
    this.updateBitmaskAt(x - 1, y, gameState.map);
    this.updateBitmaskAt(x + 1, y, gameState.map);
    this.updateBitmaskAt(x, y - 1, gameState.map);
    this.updateBitmaskAt(x, y + 1, gameState.map);

    // Patch dirty tiles directly on the offscreen canvas
    this.rasterizeSingleTile(x, y, gameState, tileSize, tilesetConfig, tilesetImage);
    this.rasterizeSingleTile(x - 1, y, gameState, tileSize, tilesetConfig, tilesetImage);
    this.rasterizeSingleTile(x + 1, y, gameState, tileSize, tilesetConfig, tilesetImage);
    this.rasterizeSingleTile(x, y - 1, gameState, tileSize, tilesetConfig, tilesetImage);
    this.rasterizeSingleTile(x, y + 1, gameState, tileSize, tilesetConfig, tilesetImage);
  }

  /**
   * Counts discovered tiles to quickly detect if fog of war cleared without scanning all booleans
   */
  private computeDiscoveryMetrics(discovered: boolean[][]): number {
    let count = 0;
    const height = discovered.length;
    for (let y = 0; y < height; y++) {
      const row = discovered[y];
      if (!row) continue;
      const width = row.length;
      for (let x = 0; x < width; x++) {
        if (row[x]) count++;
      }
    }
    return count;
  }

  /**
   * Pre-calculates all cardinal autotile bitmasks into a flat Uint8Array
   */
  private precomputeBitmasks(map: TileType[][], width: number, height: number): void {
    const totalTiles = width * height;
    if (!this.cardinalBitmasks || this.cardinalBitmasks.length !== totalTiles) {
      this.cardinalBitmasks = new Uint8Array(totalTiles);
      this.tileVariants = new Uint8Array(totalTiles);
    }

    for (let y = 0; y < height; y++) {
      const row = map[y];
      if (!row) continue;
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        const tile = row[x];
        const idx = rowOffset + x;

        // Deterministic variant (0..3)
        this.tileVariants[idx] = Math.abs((x * 17 + y * 31) % 4);

        if (tile === TileType.Wall || tile === TileType.Water || tile === TileType.Path) {
          this.cardinalBitmasks[idx] = tilesetAtlasManager.calculateCardinalBitmask(x, y, map, tile);
        } else {
          this.cardinalBitmasks[idx] = 0;
        }
      }
    }
  }

  private updateBitmaskAt(x: number, y: number, map: TileType[][]): void {
    if (!this.cardinalBitmasks || !this.tileVariants) return;
    const height = map.length;
    const width = map[0]?.length || 0;
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    const tile = map[y][x];
    const idx = y * width + x;
    if (tile === TileType.Wall || tile === TileType.Water || tile === TileType.Path) {
      this.cardinalBitmasks[idx] = tilesetAtlasManager.calculateCardinalBitmask(x, y, map, tile);
    } else {
      this.cardinalBitmasks[idx] = 0;
    }
  }

  public getCardinalBitmask(x: number, y: number, width: number): number {
    if (!this.cardinalBitmasks) return 0;
    const idx = y * width + x;
    return this.cardinalBitmasks[idx] || 0;
  }

  public getTileVariant(x: number, y: number, width: number): number {
    if (!this.tileVariants) return 0;
    const idx = y * width + x;
    return this.tileVariants[idx] || 0;
  }

  /**
   * Renders or retrieves the pre-rasterized offscreen chunk background canvas
   */
  public getOrRenderBackground(config: ChunkCacheConfig): HTMLCanvasElement | null {
    if (!this.offscreenCanvas || !this.offscreenCtx) return null;

    const { gameState, tileSize, tilesetConfig, tilesetImage, animationTick = 0 } = config;
    const isOverworld = gameState.isOverworld;
    const biome = gameState.biome || 'grassland';
    const depth = gameState.playerStats.depth;
    const width = gameState.levelWidth;
    const height = gameState.levelHeight;
    const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
    const activeWatchtower = isOverworld ? gameState.overworldChunks?.[chunkKey]?.watchtower : undefined;
    const controller = activeWatchtower?.controller || 'neutral';
    const isTileset = tilesetConfig.enabled || config.isTilesetMode || getStoredGraphicsMode() === 'animated_tileset';

    // Auto-detect if map reference changed (e.g. tree chopped, ore mined, door opened, terraformed)
    if (this.lastMapRef !== gameState.map) {
      this.lastMapRef = gameState.map;
      this.lastMapVersion++;
      this.isDirty = true;
    }

    const turnsPlayed = gameState.playerStats?.turnsPlayed || 0;
    const playerX = gameState.playerX;
    const playerY = gameState.playerY;

    let discoveryCount = this.lastDiscoveryCount;
    if (
      this.isDirty ||
      this.lastDiscoveryCount === -1 ||
      playerX !== this.lastPlayerX ||
      playerY !== this.lastPlayerY ||
      turnsPlayed !== this.lastTurnsPlayed ||
      chunkKey !== this.lastChunkKey
    ) {
      discoveryCount = this.computeDiscoveryMetrics(gameState.discovered);
      this.lastDiscoveryCount = discoveryCount;
      this.lastPlayerX = playerX;
      this.lastPlayerY = playerY;
      this.lastTurnsPlayed = turnsPlayed;
      this.lastChunkKey = chunkKey;
    }

    // Build unique composite cache key
    const currentKey = `${chunkKey}:${isOverworld ? 'ow' : 'dg'}:${depth}:${biome}:${controller}:${isTileset ? 1 : 0}:${tileSize}:${width}x${height}:${discoveryCount}:${this.lastMapVersion}`;

    if (!this.isDirty && currentKey === this.cachedKey && this.offscreenCanvas.width === width * tileSize && this.offscreenCanvas.height === height * tileSize) {
      return this.offscreenCanvas;
    }

    // Canvas resize if dimensions changed
    const targetPixelWidth = width * tileSize;
    const targetPixelHeight = height * tileSize;
    if (this.offscreenCanvas.width !== targetPixelWidth || this.offscreenCanvas.height !== targetPixelHeight) {
      this.offscreenCanvas.width = targetPixelWidth;
      this.offscreenCanvas.height = targetPixelHeight;
      this.offscreenCtx.imageSmoothingEnabled = false;
    }

    // Precompute all bitmasks for this chunk in one pass
    this.precomputeBitmasks(gameState.map, width, height);

    // Render full background
    const ctx = this.offscreenCtx;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, targetPixelWidth, targetPixelHeight);

    ctx.font = `bold 14px "JetBrains Mono", Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < height; y++) {
      const mapRow = gameState.map[y];
      const discRow = gameState.discovered[y];
      const visRow = gameState.visible[y];
      if (!mapRow) continue;

      const ry = y * tileSize;

      for (let x = 0; x < width; x++) {
        const isDiscovered = discRow ? discRow[x] ?? false : false;
        if (!isDiscovered) continue;

        const tile = mapRow[x];
        const rx = x * tileSize;
        const isVisible = visRow ? visRow[x] ?? false : false;

        const style = resolveTileStyle(tile, isVisible, isOverworld, biome, depth, controller, x, y);
        const idx = y * width + x;
        const bitmask = this.cardinalBitmasks ? this.cardinalBitmasks[idx] : 0;
        const variant = this.tileVariants ? this.tileVariants[idx] : 0;

        drawSpriteOrAscii(ctx, rx, ry, style.char, style.tileColor, style.glyphColor, {
          tileType: tile,
          biome: isOverworld ? biome : undefined,
          fontSize: `bold 14px "JetBrains Mono", Menlo, monospace`,
          bitmask,
          variant,
        }, tilesetConfig, tilesetImage, animationTick, tileSize);
      }
    }

    // Render tactical grid sub-borders once onto the cached offscreen canvas
    ctx.strokeStyle = '#3341551a';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= width; x++) {
      const rx = x * tileSize;
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, targetPixelHeight);
    }

    for (let y = 0; y <= height; y++) {
      const ry = y * tileSize;
      ctx.moveTo(0, ry);
      ctx.lineTo(targetPixelWidth, ry);
    }

    ctx.stroke();

    // Update cached signatures
    this.cachedKey = currentKey;
    this.cachedLevelWidth = width;
    this.cachedLevelHeight = height;
    this.cachedTileSize = tileSize;
    this.lastDiscoveryCount = discoveryCount;
    this.isDirty = false;

    return this.offscreenCanvas;
  }

  /**
   * Re-draws a single tile onto the offscreen canvas for localized live updates
   */
  private rasterizeSingleTile(
    x: number,
    y: number,
    gameState: GameState,
    tileSize: number,
    tilesetConfig: SpriteSheetConfig,
    tilesetImage: HTMLImageElement | null
  ): void {
    if (!this.offscreenCtx || !this.offscreenCanvas) return;
    const width = gameState.levelWidth;
    const height = gameState.levelHeight;
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    const ctx = this.offscreenCtx;
    const rx = x * tileSize;
    const ry = y * tileSize;

    const isDiscovered = gameState.discovered[y]?.[x] ?? false;
    if (!isDiscovered) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(rx, ry, tileSize, tileSize);
      return;
    }

    const tile = gameState.map[y]?.[x];
    if (tile === undefined) return;

    const isVisible = gameState.visible[y]?.[x] ?? false;
    const isOverworld = gameState.isOverworld;
    const biome = gameState.biome || 'grassland';
    const depth = gameState.playerStats.depth;
    const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
    const activeWatchtower = isOverworld ? gameState.overworldChunks?.[chunkKey]?.watchtower : undefined;
    const controller = activeWatchtower?.controller || 'neutral';

    const style = resolveTileStyle(tile, isVisible, isOverworld, biome, depth, controller, x, y);
    const idx = y * width + x;
    const bitmask = this.cardinalBitmasks ? this.cardinalBitmasks[idx] : 0;
    const variant = this.tileVariants ? this.tileVariants[idx] : 0;

    // Clear tile area
    ctx.fillStyle = '#020617';
    ctx.fillRect(rx, ry, tileSize, tileSize);

    drawSpriteOrAscii(ctx, rx, ry, style.char, style.tileColor, style.glyphColor, {
      tileType: tile,
      biome: isOverworld ? biome : undefined,
      fontSize: `bold 14px "JetBrains Mono", Menlo, monospace`,
      bitmask,
      variant,
    }, tilesetConfig, tilesetImage, 0, tileSize);

    // Draw grid lines
    ctx.strokeStyle = '#3341551a';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, tileSize, tileSize);
  }
}

export const chunkBackgroundCache = ChunkBackgroundCache.getInstance();
