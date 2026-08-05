export interface TileRenderDetails {
  tileType: string;
  char: string;
  color: string;
  bgColor?: string;
  bitmask?: number;
  tileSize: number;
  isVisible: boolean;
  isExplored: boolean;
}

export interface EntityRenderDetails {
  id: string;
  name: string;
  symbol: string;
  color: string;
  animState?: 'idle' | 'walk' | 'attack' | 'hurt' | 'cast' | 'death';
  direction?: 'north' | 'south' | 'east' | 'west';
  size?: number;
}

export interface IGraphicsRenderer {
  mode: 'text' | 'tileset';
  setMode(mode: 'text' | 'tileset'): void;
  getMode(): 'text' | 'tileset';
  drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void;
  drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void;
  renderVFX(ctx: CanvasRenderingContext2D, dt: number): void;
}
