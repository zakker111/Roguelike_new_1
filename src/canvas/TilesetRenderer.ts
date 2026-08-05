import { IGraphicsRenderer, TileRenderDetails, EntityRenderDetails } from './IGraphicsRenderer';
import { TextRenderer } from './TextRenderer';
import { assetPreloader } from './AssetPreloader';
import { tilesetAtlasManager } from './TilesetAtlasManager';
import { vfxEmitter } from './VFXEmitter';

export class TilesetRenderer implements IGraphicsRenderer {
  public mode: 'text' | 'tileset' = 'tileset';
  private fallbackTextRenderer: TextRenderer = new TextRenderer();

  public setMode(mode: 'text' | 'tileset'): void {
    this.mode = mode;
  }

  public getMode(): 'text' | 'tileset' {
    return this.mode;
  }

  public drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void {
    const atlasImage = assetPreloader.getImage('main_tileset');

    if (!atlasImage || !assetPreloader.isLoaded('main_tileset')) {
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
      atlasImage,
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
    const atlasImage = assetPreloader.getImage('entity_tileset');

    if (!atlasImage || !assetPreloader.isLoaded('entity_tileset')) {
      this.fallbackTextRenderer.drawEntity(ctx, screenX, screenY, details);
      return;
    }

    const size = details.size || 24;
    const spriteCoord = tilesetAtlasManager.getSpriteCoords(details.id, details.animState || 'idle', details.direction || 'south');

    if (!spriteCoord) {
      this.fallbackTextRenderer.drawEntity(ctx, screenX, screenY, details);
      return;
    }

    ctx.drawImage(
      atlasImage,
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
