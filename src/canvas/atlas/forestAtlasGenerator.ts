/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IThemeAtlasGenerator, MockupPaletteTheme } from './types';
import { renderMainTileset } from './mainTilesetRenderer';
import { renderEntityTileset } from './entityTilesetRenderer';
import { renderBossTileset } from './bossTilesetRenderer';
import { renderItemsTileset } from './itemsTilesetRenderer';

/**
 * Verdant Woodland Forest Atlas Generator
 */
export class ForestAtlasGenerator implements IThemeAtlasGenerator {
  public readonly theme: MockupPaletteTheme = 'forest';
  public readonly displayName: string = 'Lush Verdant Forest';

  public generateMainTileset(size: number = 32): HTMLCanvasElement {
    return renderMainTileset(this.theme, size);
  }

  public generateEntityTileset(size: number = 32): HTMLCanvasElement {
    return renderEntityTileset(this.theme, size);
  }

  public generateBossTileset(size: number = 32): HTMLCanvasElement {
    return renderBossTileset(this.theme, size);
  }

  public generateItemsTileset(size: number = 32): HTMLCanvasElement {
    return renderItemsTileset(this.theme, size);
  }
}

export const forestAtlasGenerator = new ForestAtlasGenerator();
