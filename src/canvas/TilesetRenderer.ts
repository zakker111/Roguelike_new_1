import { IGraphicsRenderer, TileRenderDetails, EntityRenderDetails, GraphicsVisualMode } from './IGraphicsRenderer';
import { TextRenderer } from './TextRenderer';
import { assetPreloader } from './AssetPreloader';
import { tilesetAtlasManager } from './TilesetAtlasManager';
import { mockupAtlasGenerator } from './MockupAtlasGenerator';
import { vfxEmitter } from './VFXEmitter';

export class TilesetRenderer implements IGraphicsRenderer {
  public mode: GraphicsVisualMode = 'animated_tileset';
  private fallbackTextRenderer: TextRenderer = new TextRenderer();
  private hasInitializedMockups: boolean = false;

  private ensureMockupsLoaded() {
    if (!this.hasInitializedMockups) {
      this.hasInitializedMockups = true;
      if (assetPreloader.getSource() === 'classic_png') {
        assetPreloader.preloadAllPngs();
      }
      if (!assetPreloader.isCodeLoaded('main_tileset')) {
        mockupAtlasGenerator.generateAllAtlases('classic', tilesetAtlasManager.getSpriteSize());
      }
    }
  }

  public setMode(mode: GraphicsVisualMode): void {
    this.mode = mode;
  }

  public getMode(): GraphicsVisualMode {
    return this.mode;
  }

  public drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void {
    this.ensureMockupsLoaded();

    const atlasSource = assetPreloader.getAtlasSource('main_tileset');

    if (!atlasSource || !assetPreloader.isLoaded('main_tileset')) {
      // Automatic fallback to symbolic glyph / emoji rendering
      this.fallbackTextRenderer.drawTile(ctx, screenX, screenY, details);
      return;
    }

    const tileCoord = tilesetAtlasManager.getTileCoords(details.tileType);
    if (!tileCoord) {
      this.fallbackTextRenderer.drawTile(ctx, screenX, screenY, details);
      return;
    }

    ctx.drawImage(
      atlasSource,
      tileCoord.sx,
      tileCoord.sy,
      tileCoord.sw,
      tileCoord.sh,
      screenX,
      screenY,
      details.tileSize,
      details.tileSize
    );

    if (!details.isVisible && details.isExplored) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(screenX, screenY, details.tileSize, details.tileSize);
    }
  }

  public drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void {
    this.ensureMockupsLoaded();

    const size = details.size || 28;

    // 1. Check for oversized boss / multi-tile creature config
    const oversized = tilesetAtlasManager.getOversizedEntityConfig(details.id) ||
      (details.symbol ? tilesetAtlasManager.getOversizedEntityConfig(details.symbol) : null);

    if (oversized) {
      const bossAtlas = assetPreloader.getAtlasSource(oversized.atlasKey);
      if (bossAtlas) {
        const renderW = oversized.widthTiles * size;
        const renderH = oversized.heightTiles * size;
        const offsetX = screenX - (renderW - size) * 0.5;
        const offsetY = screenY - (renderH - size) * oversized.anchorY;

        ctx.drawImage(
          bossAtlas,
          oversized.sx,
          oversized.sy,
          oversized.pixelWidth,
          oversized.pixelHeight,
          offsetX,
          offsetY,
          renderW,
          renderH
        );
        return;
      }
    }

    // 2. Standard entity rendering from entity_tileset
    const atlasSource = assetPreloader.getAtlasSource('entity_tileset');

    if (!atlasSource || !assetPreloader.isLoaded('entity_tileset')) {
      this.fallbackTextRenderer.drawEntity(ctx, screenX, screenY, details);
      return;
    }

    const spriteCoord = tilesetAtlasManager.getSpriteCoords(
      details.id || details.symbol || 'warrior',
      details.animState || 'idle',
      details.direction || 'south'
    );

    if (!spriteCoord) {
      this.fallbackTextRenderer.drawEntity(ctx, screenX, screenY, details);
      return;
    }

    ctx.drawImage(
      atlasSource,
      spriteCoord.sx,
      spriteCoord.sy,
      spriteCoord.sw,
      spriteCoord.sh,
      screenX,
      screenY,
      size,
      size
    );
  }

  public renderVFX(ctx: CanvasRenderingContext2D, dt: number): void {
    vfxEmitter.flushAndRender(ctx, dt);
  }
}
