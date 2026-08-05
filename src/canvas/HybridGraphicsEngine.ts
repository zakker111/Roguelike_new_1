import { IGraphicsRenderer, TileRenderDetails, EntityRenderDetails } from './IGraphicsRenderer';
import { TextRenderer } from './TextRenderer';
import { TilesetRenderer } from './TilesetRenderer';

export class HybridGraphicsEngine implements IGraphicsRenderer {
  private static instance: HybridGraphicsEngine;
  private textRenderer: TextRenderer = new TextRenderer();
  private tilesetRenderer: TilesetRenderer = new TilesetRenderer();
  public mode: 'text' | 'tileset' = 'text';

  public static getInstance(): HybridGraphicsEngine {
    if (!HybridGraphicsEngine.instance) {
      HybridGraphicsEngine.instance = new HybridGraphicsEngine();
    }
    return HybridGraphicsEngine.instance;
  }

  public setMode(mode: 'text' | 'tileset'): void {
    this.mode = mode;
    this.textRenderer.setMode(mode);
    this.tilesetRenderer.setMode(mode);
  }

  public getMode(): 'text' | 'tileset' {
    return this.mode;
  }

  public drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void {
    if (this.mode === 'tileset') {
      this.tilesetRenderer.drawTile(ctx, screenX, screenY, details);
    } else {
      this.textRenderer.drawTile(ctx, screenX, screenY, details);
    }
  }

  public drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void {
    if (this.mode === 'tileset') {
      this.tilesetRenderer.drawEntity(ctx, screenX, screenY, details);
    } else {
      this.textRenderer.drawEntity(ctx, screenX, screenY, details);
    }
  }

  public renderVFX(ctx: CanvasRenderingContext2D, dt: number): void {
    if (this.mode === 'tileset') {
      this.tilesetRenderer.renderVFX(ctx, dt);
    } else {
      this.textRenderer.renderVFX(ctx, dt);
    }
  }
}

export const hybridGraphicsEngine = HybridGraphicsEngine.getInstance();
