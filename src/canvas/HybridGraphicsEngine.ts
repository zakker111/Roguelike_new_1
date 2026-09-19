import {
  IVisualRenderer,
  GraphicsVisualMode,
  TileRenderDetails,
  EntityRenderDetails,
  TilesetSourceType,
  TILESET_SOURCES,
  getStoredGraphicsMode,
  setStoredGraphicsMode,
  setActiveVisualMode,
} from './types';
import { TextRenderer } from './TextRenderer';
import { TilesetRenderer } from './TilesetRenderer';
import { assetPreloader } from './AssetPreloader';
import { chunkBackgroundCache } from './chunkBackgroundCache';

export class HybridGraphicsEngine implements IVisualRenderer {
  private static instance: HybridGraphicsEngine;
  private textRenderer: TextRenderer = new TextRenderer();
  private tilesetRenderer: TilesetRenderer = new TilesetRenderer();
  public mode: GraphicsVisualMode = getStoredGraphicsMode();

  private constructor() {
    setActiveVisualMode(this.mode);
    this.syncSubRenderers(this.mode);
  }

  public static getInstance(): HybridGraphicsEngine {
    if (!HybridGraphicsEngine.instance) {
      HybridGraphicsEngine.instance = new HybridGraphicsEngine();
    }
    return HybridGraphicsEngine.instance;
  }

  private syncSubRenderers(mode: GraphicsVisualMode): void {
    const legacyMode = mode === 'animated_tileset' ? 'tileset' : 'text';
    this.textRenderer.setMode(legacyMode as any);
    this.tilesetRenderer.setMode(legacyMode as any);
  }

  public setMode(mode: GraphicsVisualMode): void {
    this.mode = mode;
    setActiveVisualMode(mode);
    this.syncSubRenderers(mode);
    setStoredGraphicsMode(mode);
    chunkBackgroundCache.invalidate();
  }

  public getMode(): GraphicsVisualMode {
    return this.mode;
  }

  public getTilesetSource(): TilesetSourceType {
    return assetPreloader.getSource();
  }

  public async setTilesetSource(source: TilesetSourceType): Promise<void> {
    await assetPreloader.setSource(source);
    chunkBackgroundCache.invalidate();
  }

  public toggleTilesetSource(): TilesetSourceType {
    const next = assetPreloader.toggleSource();
    chunkBackgroundCache.invalidate();
    return next;
  }

  public getModeLabel(): string {
    if (this.mode === 'classic_glyph') {
      return 'Classic ASCII';
    }
    return assetPreloader.getSourceDefinition().name;
  }

  public getShortModeLabel(): string {
    if (this.mode === 'classic_glyph') {
      return '🔤 ASCII';
    }
    return assetPreloader.getSource() === 'classic_png' ? '🖼️ Classic PNG' : '🎨 Classic Code';
  }

  /**
   * Seamlessly cycles through all visual options:
   * 1. Classic ASCII / Glyphs
   * 2. Classic (PNG Mockups from /public/tilesets)
   * 3. Classic (Procedural Code from MockupAtlasGenerator)
   */
  public cycleVisualMode(): { mode: GraphicsVisualMode; source: TilesetSourceType; label: string } {
    if (this.mode === 'classic_glyph') {
      this.setMode('animated_tileset');
      this.setTilesetSource('classic_png');
    } else if (this.getTilesetSource() === 'classic_png') {
      this.setTilesetSource('classic_code');
    } else {
      this.setMode('classic_glyph');
    }

    chunkBackgroundCache.invalidate();

    return {
      mode: this.mode,
      source: this.getTilesetSource(),
      label: this.getModeLabel(),
    };
  }

  public toggleMode(): GraphicsVisualMode {
    return this.cycleVisualMode().mode;
  }

  public isTilesetMode(): boolean {
    return this.mode === 'animated_tileset';
  }

  public drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void {
    if (this.mode === 'animated_tileset') {
      this.tilesetRenderer.drawTile(ctx, screenX, screenY, details);
    } else {
      this.textRenderer.drawTile(ctx, screenX, screenY, details);
    }
  }

  public drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void {
    if (this.mode === 'animated_tileset') {
      this.tilesetRenderer.drawEntity(ctx, screenX, screenY, details);
    } else {
      this.textRenderer.drawEntity(ctx, screenX, screenY, details);
    }
  }

  public renderVFX(ctx: CanvasRenderingContext2D, dt: number): void {
    if (this.mode === 'animated_tileset') {
      this.tilesetRenderer.renderVFX(ctx, dt);
    } else {
      this.textRenderer.renderVFX(ctx, dt);
    }
  }
}

export const hybridGraphicsEngine = HybridGraphicsEngine.getInstance();
