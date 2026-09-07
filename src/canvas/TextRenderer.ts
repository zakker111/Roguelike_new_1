import { IGraphicsRenderer, TileRenderDetails, EntityRenderDetails, GraphicsVisualMode } from './IGraphicsRenderer';
import { vfxEmitter } from './VFXEmitter';

export class TextRenderer implements IGraphicsRenderer {
  public mode: GraphicsVisualMode = 'classic_glyph';

  public setMode(mode: GraphicsVisualMode): void {
    this.mode = mode;
  }

  public getMode(): GraphicsVisualMode {
    return this.mode;
  }

  public drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void {
    if (!details.isVisible && !details.isExplored) return;

    // Background tile rect
    if (details.bgColor) {
      ctx.fillStyle = details.isVisible ? details.bgColor : '#0f172a';
      ctx.fillRect(screenX, screenY, details.tileSize, details.tileSize);
    }

    // Unexplored / shroud fog
    if (!details.isVisible && details.isExplored) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(screenX, screenY, details.tileSize, details.tileSize);
    }

    // Symbolic glyph / char rendering
    ctx.fillStyle = details.isVisible ? details.color : '#475569';
    ctx.font = `${Math.floor(details.tileSize * 0.75)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      details.char,
      screenX + details.tileSize / 2,
      screenY + details.tileSize / 2
    );
  }

  public drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void {
    const size = details.size || 24;
    ctx.fillStyle = details.color || '#e2e8f0';
    ctx.font = `${Math.floor(size * 0.85)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      details.symbol || '👤',
      screenX + size / 2,
      screenY + size / 2
    );
  }

  public renderVFX(ctx: CanvasRenderingContext2D, dt: number): void {
    vfxEmitter.flushAndRender(ctx, dt);
  }
}
