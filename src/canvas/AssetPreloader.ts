import {
  TilesetSourceType,
  TILESET_SOURCES,
  TilesetSourceDefinition,
  getStoredTilesetSource,
  setStoredTilesetSource,
} from './types';

export const PNG_MOCKUP_URLS: Record<string, string> = {
  main_tileset: '/tilesets/main_tileset.png',
  entity_tileset: '/tilesets/entity_tileset.png',
  animations_tileset: '/tilesets/animations_tileset.png',
  boss_tileset: '/tilesets/boss_tileset.png',
  items_tileset: '/tilesets/items_tileset.png',
};

export class AssetPreloader {
  private static instance: AssetPreloader;

  // Distinct caches for the two true tileset sources
  private pngCache: Map<string, HTMLImageElement> = new Map();
  private codeCache: Map<string, HTMLCanvasElement> = new Map();
  private imageCache: Map<string, HTMLImageElement | HTMLCanvasElement> = new Map();

  private pngLoadStatus: Map<string, 'loading' | 'loaded' | 'failed'> = new Map();
  private loadStatus: Map<string, 'loading' | 'loaded' | 'failed'> = new Map();
  private listeners: Set<(atlasKey: string) => void> = new Set();

  private activeSource: TilesetSourceType = getStoredTilesetSource();

  public static getInstance(): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader();
    }
    return AssetPreloader.instance;
  }

  public getSource(): TilesetSourceType {
    return this.activeSource;
  }

  public getSourceDefinition(source?: TilesetSourceType): TilesetSourceDefinition {
    const s = source || this.activeSource;
    return TILESET_SOURCES[s] || TILESET_SOURCES.classic_png;
  }

  public async setSource(source: TilesetSourceType): Promise<void> {
    this.activeSource = source;
    setStoredTilesetSource(source);

    if (source === 'classic_png') {
      await this.preloadAllPngs();
    }

    this.notifyChange('*');
    ['main_tileset', 'entity_tileset', 'boss_tileset', 'items_tileset', 'animations_tileset'].forEach((k) => {
      this.notifyChange(k);
    });
  }

  public toggleSource(): TilesetSourceType {
    const next = this.activeSource === 'classic_png' ? 'classic_code' : 'classic_png';
    this.setSource(next);
    return next;
  }

  public onAtlasChange(callback: (atlasKey: string) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyChange(atlasKey: string) {
    this.listeners.forEach((fn) => {
      try {
        fn(atlasKey);
      } catch (err) {
        console.error('Error notifying atlas listener:', err);
      }
    });
  }

  /**
   * Registers a procedural code-generated canvas atlas (Classic Code)
   */
  public registerCodeCanvas(key: string, canvas: HTMLCanvasElement): void {
    this.codeCache.set(key, canvas);
    this.imageCache.set(key, canvas);
    this.loadStatus.set(key, 'loaded');
    this.notifyChange(key);
  }

  /**
   * Registers a static PNG mockup image atlas (Classic PNG)
   */
  public registerPngImage(key: string, img: HTMLImageElement): void {
    this.pngCache.set(key, img);
    this.imageCache.set(key, img);
    this.pngLoadStatus.set(key, 'loaded');
    this.loadStatus.set(key, 'loaded');
    this.notifyChange(key);
  }

  // Backward compatibility alias
  public registerCanvas(key: string, canvas: HTMLCanvasElement): void {
    this.registerCodeCanvas(key, canvas);
  }

  // Backward compatibility alias
  public registerImage(key: string, img: HTMLImageElement): void {
    this.registerPngImage(key, img);
  }

  /**
   * Preloads a single PNG mockup atlas file from URL
   */
  public preloadPng(key: string, url?: string): Promise<boolean> {
    const targetUrl = url || PNG_MOCKUP_URLS[key];
    if (!targetUrl) return Promise.resolve(false);

    if (this.pngLoadStatus.get(key) === 'loaded' && this.pngCache.has(key)) {
      return Promise.resolve(true);
    }

    if (this.pngLoadStatus.get(key) === 'loading') {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.pngLoadStatus.get(key) !== 'loading') {
            clearInterval(checkInterval);
            resolve(this.pngLoadStatus.get(key) === 'loaded');
          }
        }, 50);
      });
    }

    this.pngLoadStatus.set(key, 'loading');

    if (typeof Image === 'undefined') {
      // In headless / Node / unit-test environments
      this.pngLoadStatus.set(key, 'loaded');
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.pngCache.set(key, img);
        this.pngLoadStatus.set(key, 'loaded');
        this.loadStatus.set(key, 'loaded');
        this.notifyChange(key);
        resolve(true);
      };
      img.onerror = () => {
        this.pngLoadStatus.set(key, 'failed');
        resolve(false);
      };
      img.src = targetUrl;
    });
  }

  /**
   * Preloads all static PNG mockup atlases from /public/tilesets/
   */
  public async preloadAllPngs(): Promise<boolean> {
    const promises = Object.entries(PNG_MOCKUP_URLS).map(([key, url]) => this.preloadPng(key, url));
    const results = await Promise.all(promises);
    return results.every(Boolean);
  }

  // Backward compatibility alias
  public preloadAtlas(key: string, url: string): Promise<boolean> {
    return this.preloadPng(key, url);
  }

  public isLoaded(key: string): boolean {
    if (this.activeSource === 'classic_png') {
      return this.pngLoadStatus.get(key) === 'loaded' || this.codeCache.has(key);
    }
    return this.codeCache.has(key) || this.loadStatus.get(key) === 'loaded';
  }

  public isPngLoaded(key: string): boolean {
    return this.pngLoadStatus.get(key) === 'loaded';
  }

  public isCodeLoaded(key: string): boolean {
    return this.codeCache.has(key);
  }

  public getImage(key: string): HTMLImageElement | HTMLCanvasElement | null {
    if (this.activeSource === 'classic_png') {
      return this.pngCache.get(key) || this.codeCache.get(key) || this.imageCache.get(key) || null;
    }
    return this.codeCache.get(key) || this.pngCache.get(key) || this.imageCache.get(key) || null;
  }

  /**
   * Retrieves the active atlas image/canvas source.
   * Can optionally request a specific source to compare PNG mockups vs Code generated canvases.
   */
  public getAtlasSource(key: string, overrideSource?: TilesetSourceType): CanvasImageSource | null {
    const source = overrideSource || this.activeSource;

    if (source === 'classic_png') {
      const pngSource = this.pngCache.get(key);
      if (pngSource) return pngSource;
      // Trigger background preload if not yet requested
      if (!this.pngLoadStatus.has(key)) {
        this.preloadPng(key);
      }
      // Fall back to code generated canvas or standard image cache if PNG is still loading
      return this.codeCache.get(key) || this.imageCache.get(key) || null;
    }

    if (source === 'classic_code') {
      const codeSource = this.codeCache.get(key);
      if (codeSource) return codeSource;
      return this.pngCache.get(key) || this.imageCache.get(key) || null;
    }

    return this.imageCache.get(key) || null;
  }

  public getStatus(key: string): 'loading' | 'loaded' | 'failed' | 'unloaded' {
    if (this.activeSource === 'classic_png') {
      return this.pngLoadStatus.get(key) || 'unloaded';
    }
    return this.codeCache.has(key) ? 'loaded' : (this.loadStatus.get(key) || 'unloaded');
  }

  public getAllAtlasKeys(): string[] {
    const keys = new Set<string>([
      ...this.pngCache.keys(),
      ...this.codeCache.keys(),
      ...this.imageCache.keys(),
      ...Object.keys(PNG_MOCKUP_URLS),
    ]);
    return Array.from(keys);
  }
}

export const assetPreloader = AssetPreloader.getInstance();

