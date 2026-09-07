import { TileType } from '../types';
import { SpriteSheetConfig, SpriteSheetTileMapping } from '../components/GameCanvas';
import { hybridGraphicsEngine } from './HybridGraphicsEngine';
import { tilesetAtlasManager } from './TilesetAtlasManager';
import { assetPreloader } from './AssetPreloader';
import { mockupAtlasGenerator } from './MockupAtlasGenerator';
import { MONSTER_SPRITE_MAPPINGS, entityPaperdollEngine } from './entityPaperdollEngine';
import { Direction, AnimationState, spriteAnimationManager } from './spriteAnimationManager';

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
    entityId?: string;
    direction?: Direction;
    animState?: AnimationState;
    fontSize?: string;
    alpha?: number;
    bitmask?: number;
    variant?: number;
    paperdollEquipment?: any;
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

  const isTilesetActive = tilesetConfig.enabled || hybridGraphicsEngine.isTilesetMode();

  // Lazy ensure mockup atlases or PNGs are ready if in tileset mode
  if (isTilesetActive && !assetPreloader.isLoaded('main_tileset')) {
    if (assetPreloader.getSource() === 'classic_png') {
      assetPreloader.preloadAllPngs();
    }
    if (!assetPreloader.isCodeLoaded('main_tileset')) {
      mockupAtlasGenerator.generateAllAtlases('classic', tilesetAtlasManager.getSpriteSize());
    }
  }

  // Resolve active atlas source
  const targetAtlasKey = options.entityChar || options.entityId ? 'entity_tileset' : 'main_tileset';
  const effectiveAtlasSource = (tilesetImage as CanvasImageSource | null) ||
    assetPreloader.getAtlasSource(targetAtlasKey) ||
    assetPreloader.getAtlasSource('main_tileset');

  if (isTilesetActive && effectiveAtlasSource) {
    // 0. Check for oversized boss creature
    if (options.entityChar || options.entityId) {
      const bossConfig = tilesetAtlasManager.getOversizedEntityConfig(options.entityId || '') ||
        (options.entityChar ? tilesetAtlasManager.getOversizedEntityConfig(options.entityChar) : null);

      if (bossConfig) {
        const bossAtlas = assetPreloader.getAtlasSource(bossConfig.atlasKey) || effectiveAtlasSource;
        const renderW = bossConfig.widthTiles * tileSize;
        const renderH = bossConfig.heightTiles * tileSize;
        const offsetX = rx - (renderW - tileSize) * 0.5;
        const offsetY = ry - (renderH - tileSize) * bossConfig.anchorY;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          bossAtlas,
          bossConfig.sx,
          bossConfig.sy,
          bossConfig.pixelWidth,
          bossConfig.pixelHeight,
          offsetX,
          offsetY,
          renderW,
          renderH
        );

        if (hasAlpha) ctx.globalAlpha = 1.0;
        return;
      }
    }

    let mapping: SpriteSheetTileMapping | undefined;

    // 1. Map lookups by category context
    if (options.tileType !== undefined) {
      const coords = tilesetAtlasManager.getTileCoords(options.tileType, options.bitmask || 0, options.variant || 0);
      if (coords) {
        const spriteSize = tilesetAtlasManager.getSpriteSize();
        mapping = {
          sx: Math.floor(coords.sx / spriteSize),
          sy: Math.floor(coords.sy / spriteSize),
          frameCount: 1,
        };
      }
    } else if (options.trapType !== undefined) {
      // Row 5: Spikes (col 5), FireVent (col 6), PoisonGas (col 7)
      if (options.trapType === 'Spikes') mapping = { sx: 5, sy: 5, frameCount: 1 };
      else if (options.trapType === 'FireVent') mapping = { sx: 6, sy: 5, frameCount: 1 };
      else if (options.trapType === 'PoisonGas') mapping = { sx: 7, sy: 5, frameCount: 1 };
      else mapping = tilesetConfig.trapMappings?.[options.trapType];
    } else if (options.chestOpened !== undefined) {
      mapping = options.chestOpened
        ? { sx: 14, sy: 4, frameCount: 1 }
        : { sx: 13, sy: 4, frameCount: 1 };
    } else if (options.entityChar !== undefined || options.entityId !== undefined) {
      const dir = options.direction || 'south';
      const anim = options.animState || 'idle';
      const frameIndex = Math.floor(animationTick / 8) % 4;

      if (options.entityId) {
        const animInfo = spriteAnimationManager.getOrCreateState(options.entityId);
        if (options.animState) animInfo.state = options.animState;
        if (options.direction) animInfo.direction = options.direction;
      }

      const spriteCoords = tilesetAtlasManager.getSpriteCoords(
        options.entityId || options.entityChar || 'warrior',
        anim,
        dir,
        frameIndex
      );

      if (spriteCoords) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          effectiveAtlasSource,
          spriteCoords.sx,
          spriteCoords.sy,
          spriteCoords.sw,
          spriteCoords.sh,
          rx,
          ry,
          tileSize,
          tileSize
        );

        if (options.paperdollEquipment) {
          const size = tilesetAtlasManager.getSpriteSize();
          const layers = entityPaperdollEngine.getPaperdollLayers(options.paperdollEquipment);
          layers.forEach((layer) => {
            const layerX = (layer.spriteCoords.sx + frameIndex) * size;
            const layerY = layer.spriteCoords.sy * size;
            ctx.drawImage(
              effectiveAtlasSource,
              layerX,
              layerY,
              size,
              size,
              rx,
              ry,
              tileSize,
              tileSize
            );
          });
        }

        if (hasAlpha) ctx.globalAlpha = 1.0;
        return;
      }
    }

    if (mapping) {
      const size = tilesetAtlasManager.getSpriteSize();
      let col = mapping.sx;
      let row = mapping.sy;

      // Wang / cardinal autotile bitmask offset
      if (options.bitmask !== undefined && options.tileType !== undefined) {
        const autotileCoord = tilesetAtlasManager.getAutotileCoords(options.tileType, options.bitmask);
        if (autotileCoord) {
          col = autotileCoord.sx;
          row = autotileCoord.sy;
        }
      }

      // Only apply variant offset if mapping explicitly supports horizontal variants
      if (options.variant && (mapping as any).variantCount && (mapping as any).variantCount > 1) {
        col += options.variant % (mapping as any).variantCount;
      }

      // 4-Directional & Animation State Row/Col Multipliers for living entities
      if (options.entityChar) {
        const dir = options.direction || 'south';
        const anim = options.animState || 'idle';

        if (options.entityId) {
          const animInfo = spriteAnimationManager.getOrCreateState(options.entityId);
          if (options.animState) animInfo.state = options.animState;
          if (options.direction) animInfo.direction = options.direction;
        }

        // Adjust row by direction (South = +0, West = +1, East = +2, North = +3)
        const dirOffset = spriteAnimationManager.getDirectionRow(dir);
        row = row + dirOffset;

        // Anim state col offset (Idle = 0, Walk = 4, Attack = 8, Hurt = 12)
        let stateColOffset = 0;
        if (anim === 'walk') stateColOffset = 4;
        else if (anim === 'attack') stateColOffset = 8;
        else if (anim === 'hurt') stateColOffset = 12;

        col += stateColOffset;
      }

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

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        effectiveAtlasSource,
        sourceX,
        sourceY,
        size,
        size,
        rx,
        ry,
        tileSize,
        tileSize
      );

      // Render Paperdoll Equipment Layers if provided
      if (options.paperdollEquipment) {
        const layers = entityPaperdollEngine.getPaperdollLayers(options.paperdollEquipment);
        layers.forEach((layer) => {
          const layerX = (layer.spriteCoords.sx + currentFrame) * size;
          const layerY = layer.spriteCoords.sy * size;
          ctx.drawImage(
            effectiveAtlasSource,
            layerX,
            layerY,
            size,
            size,
            rx,
            ry,
            tileSize,
            tileSize
          );
        });
      }

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
