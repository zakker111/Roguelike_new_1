import { TileType } from '../types';
import { SpriteSheetConfig, SpriteSheetTileMapping } from '../components/GameCanvas';

const emojiCache = new Map<string, boolean>();
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

function isEmoji(char: string): boolean {
  let cached = emojiCache.get(char);
  if (cached === undefined) {
    cached = EMOJI_REGEX.test(char) || char === '🐈' || char === '🐱';
    emojiCache.set(char, cached);
  }
  return cached;
}

export function drawSpriteOrAscii(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  char: string,
  tileColor: string,
  glyphColor: string,
  options: {
    tileType?: TileType;
    biome?: string;
    trapType?: string;
    chestOpened?: boolean;
    entityChar?: string;
    fontSize?: string;
    alpha?: number;
  } = {},
  tilesetConfig: SpriteSheetConfig,
  tilesetImage: HTMLImageElement | null,
  animationTick: number,
  tileSize: number = 28
) {
  const hasAlpha = options.alpha !== undefined;
  if (hasAlpha) {
    ctx.globalAlpha = options.alpha!;
  }

  if (tilesetConfig.enabled && tilesetImage) {
    let mapping: SpriteSheetTileMapping | undefined;

    // 1. Map lookups by category context
    if (options.tileType !== undefined) {
      // Biome specific overrides
      if (options.biome && tilesetConfig.biomeMappings?.[options.biome]?.[options.tileType]) {
        mapping = tilesetConfig.biomeMappings[options.biome][options.tileType];
      } else {
        mapping = tilesetConfig.tileMappings[options.tileType];
      }
    } else if (options.trapType !== undefined) {
      mapping = tilesetConfig.trapMappings?.[options.trapType];
    } else if (options.chestOpened !== undefined) {
      mapping = options.chestOpened
        ? tilesetConfig.chestMappings?.opened
        : tilesetConfig.chestMappings?.closed;
    } else if (options.entityChar !== undefined) {
      mapping = tilesetConfig.entityMappings?.[options.entityChar];
    }

    if (mapping) {
      const size = tilesetConfig.spriteSize;
      const col = mapping.sx;
      const row = mapping.sy;
      const totalFrames = mapping.frameCount || 1;
      const ticksPerFrame = mapping.ticksPerFrame || 8;

      // Calculate dynamic animation frame based on continuous render tick ticks
      const currentFrame = totalFrames > 1
        ? Math.floor(animationTick / ticksPerFrame) % totalFrames
        : 0;

      const sourceX = (col + currentFrame) * size;
      const sourceY = row * size;

      // If rendering a non-floor tile with transparent base, draw standard tileColor as backdrop
      if (options.tileType !== TileType.Floor && tileColor !== 'transparent') {
        ctx.fillStyle = tileColor;
        ctx.fillRect(rx, ry, tileSize, tileSize);
      }

      ctx.drawImage(
        tilesetImage,
        sourceX,
        sourceY,
        size,
        size,
        rx,
        ry,
        tileSize,
        tileSize
      );
      if (hasAlpha) {
        ctx.globalAlpha = 1.0;
      }
      return;
    }
  }

  // Default Fallback: Classic beautifully colored ASCII characters or Emojis
  if (tileColor !== 'transparent') {
    ctx.fillStyle = tileColor;
    ctx.fillRect(rx, ry, tileSize, tileSize);
  }

  if (isEmoji(char)) {
    ctx.font = '15px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  } else if (options.fontSize) {
    ctx.font = options.fontSize;
  }
  ctx.fillStyle = glyphColor;
  ctx.fillText(char, rx + tileSize / 2, ry + tileSize / 2);

  if (options.fontSize) {
    ctx.font = `bold 14px "JetBrains Mono", Menlo, monospace`;
  }

  if (hasAlpha) {
    ctx.globalAlpha = 1.0;
  }
}
