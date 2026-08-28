import { TileType, GameState } from '../types';
import { SpriteSheetConfig } from '../components/GameCanvas';
import { drawSpriteOrAscii } from './spriteRenderer';
import { getDirectionalShadowParams, isShadowCastingTile, renderTileDirectionalShadow } from './shadowRenderer';
import { renderWaterTileShimmer } from './waterShimmerRenderer';

export interface RenderTileMapParams {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  camX: number;
  camY: number;
  dimensions: { width: number; height: number };
  tileSize: number;
  tilesetConfig: SpriteSheetConfig;
  tilesetImage: HTMLImageElement | null;
  animationTick: number;
}

interface TileStyle {
  char: string;
  tileColor: string;
  glyphColor: string;
}

// Tile style memoization cache
const tileStyleCache = new Map<string, TileStyle>();
const MAX_TILE_STYLE_CACHE = 1000;

export function resolveTileStyle(
  tile: TileType,
  isVisible: boolean,
  isOverworld: boolean,
  biome: string | undefined,
  depth: number = 0,
  controller: string | undefined = undefined,
  tileX?: number,
  tileY?: number
): TileStyle {
  const coordHash = (tileX !== undefined && tileY !== undefined) ? Math.abs((tileX * 17 + tileY * 31) % 4) : 0;
  const key = `${tile}:${isVisible ? 1 : 0}:${isOverworld ? 1 : 0}:${biome || ''}:${depth >= 6 ? 1 : 0}:${controller || ''}:${coordHash}`;
  const cached = tileStyleCache.get(key);
  if (cached) return cached;

  const isUnderworld = !isOverworld && depth >= 6;
  let tileColor = isUnderworld ? '#140101' : '#0f172a';
  let glyphColor = isUnderworld ? '#580c0c' : '#475569';
  let char = '.';

  if (tile === TileType.Floor) {
    char = '.';
    if (isUnderworld) {
      tileColor = isVisible ? '#270505' : '#140101';
      glyphColor = isVisible ? '#ef4444' : '#7f1d1d';
    } else if (isOverworld && biome === 'desert') {
      tileColor = isVisible ? '#382215' : '#1c110a';
      glyphColor = isVisible ? '#eab308' : '#854d0e';
    }
  } else if (tile === TileType.Wall) {
    char = '#';
    if (isUnderworld) {
      tileColor = isVisible ? '#3b0707' : '#1a0303';
      glyphColor = isVisible ? '#f87171' : '#7f1d1d';
    } else if (isOverworld && biome === 'desert') {
      tileColor = isVisible ? '#451e12' : '#230f09';
      glyphColor = isVisible ? '#f97316' : '#9a3412';
    } else {
      tileColor = isVisible ? '#1e293b' : '#0f172a';
      glyphColor = isVisible ? '#64748b' : '#334155';
    }
  } else if (tile === TileType.Door) {
    char = '+';
    tileColor = isVisible ? '#1e293b' : '#0f172a';
    glyphColor = isVisible ? '#b45309' : '#78350f';
  } else if (tile === TileType.StairsDown) {
    char = '>';
    tileColor = isVisible ? '#3f3f46' : '#18181b';
    glyphColor = isVisible ? '#fbbf24' : '#b45309';
  } else if (tile === TileType.StairsUp) {
    char = '<';
    tileColor = isVisible ? '#3f3f46' : '#18181b';
    glyphColor = isVisible ? '#38bdf8' : '#0369a1';
  } else if (tile === TileType.Grass) {
    if (isOverworld) {
      if (biome === 'desert') {
        const hash = (tileX !== undefined && tileY !== undefined) ? Math.abs((tileX * 17 + tileY * 31) % 100) : 0;
        if (hash < 35) {
          char = '░';
          tileColor = isVisible ? '#341f12' : '#190f09';
          glyphColor = isVisible ? '#f59e0b' : '#92400e';
        } else if (hash < 60) {
          char = '~';
          tileColor = isVisible ? '#3c2416' : '#1e120b';
          glyphColor = isVisible ? '#fbbf24' : '#a16207';
        } else if (hash < 85) {
          char = '≈';
          tileColor = isVisible ? '#442919' : '#22140c';
          glyphColor = isVisible ? '#fb923c' : '#9a3412';
        } else {
          char = '·';
          tileColor = isVisible ? '#2a190f' : '#150c07';
          glyphColor = isVisible ? '#d97706' : '#78350f';
        }
      } else if (biome === 'tundra') {
        char = '"';
        tileColor = isVisible ? '#111827' : '#030712';
        glyphColor = isVisible ? '#f1f5f9' : '#4b5563';
      } else if (biome === 'glacial') {
        char = '❄';
        tileColor = isVisible ? '#0c2238' : '#040d18';
        glyphColor = isVisible ? '#bae6fd' : '#38bdf8';
      } else if (biome === 'volcanic') {
        char = '░';
        tileColor = isVisible ? '#2a0a0a' : '#140303';
        glyphColor = isVisible ? '#f97316' : '#991b1b';
      } else if (biome === 'coral_reef') {
        char = '🪸';
        tileColor = isVisible ? '#083344' : '#021820';
        glyphColor = isVisible ? '#f472b6' : '#06b6d4';
      } else if (biome === 'swamp') {
        char = '▒';
        tileColor = isVisible ? '#021e14' : '#000f0a';
        glyphColor = isVisible ? '#10b981' : '#064e3b';
      } else if (biome === 'town') {
        char = '▪';
        tileColor = isVisible ? '#1e2922' : '#0f1712';
        glyphColor = isVisible ? '#4ade80' : '#166534';
      } else {
        char = '"';
        tileColor = isVisible ? '#09210e' : '#041207';
        glyphColor = isVisible ? '#22c55e' : '#15803d';
      }
    } else {
      char = '"';
      tileColor = isVisible ? '#09210e' : '#041207';
      glyphColor = isVisible ? '#22c55e' : '#15803d';
    }
  } else if (tile === TileType.Tree) {
    if (isOverworld) {
      if (biome === 'desert') {
        const hash = (tileX !== undefined && tileY !== undefined) ? Math.abs((tileX * 13 + tileY * 29) % 100) : 0;
        if (hash > 70) {
          char = '🌴';
          tileColor = isVisible ? '#2e1c12' : '#170e09';
          glyphColor = isVisible ? '#34d399' : '#059669';
        } else {
          char = '🌵';
          tileColor = isVisible ? '#2a190f' : '#140c07';
          glyphColor = isVisible ? '#10b981' : '#047857';
        }
      } else if (biome === 'tundra') {
        char = '▲';
        tileColor = isVisible ? '#0b1321' : '#030712';
        glyphColor = isVisible ? '#a5f3fc' : '#0891b2';
      } else if (biome === 'glacial') {
        char = '▲';
        tileColor = isVisible ? '#081e32' : '#020d18';
        glyphColor = isVisible ? '#e0f2fe' : '#7dd3fc';
      } else if (biome === 'volcanic') {
        char = '▲';
        tileColor = isVisible ? '#1f0606' : '#0f0202';
        glyphColor = isVisible ? '#f97316' : '#7f1d1d';
      } else if (biome === 'coral_reef') {
        char = '🪸';
        tileColor = isVisible ? '#042738' : '#02121a';
        glyphColor = isVisible ? '#f472b6' : '#38bdf8';
      } else if (biome === 'swamp') {
        char = '🌳';
        tileColor = isVisible ? '#011c14' : '#000c08';
        glyphColor = isVisible ? '#a855f7' : '#6b21a8';
      } else {
        char = '🌲';
        tileColor = isVisible ? '#051909' : '#020c04';
        glyphColor = isVisible ? '#10b981' : '#047857';
      }
    } else {
      char = '🌲';
      tileColor = isVisible ? '#051909' : '#020c04';
      glyphColor = isVisible ? '#10b981' : '#047857';
    }
  } else if (tile === TileType.PineTree) {
    char = '🌲';
    tileColor = isVisible ? '#051d0c' : '#020e06';
    glyphColor = isVisible ? '#16a34a' : '#15803d';
  } else if (tile === TileType.BirchTree) {
    char = '🌳';
    tileColor = isVisible ? '#09210e' : '#041207';
    glyphColor = isVisible ? '#cbd5e1' : '#94a3b8';
  } else if (tile === TileType.TreeStump) {
    char = '🪵';
    tileColor = isVisible ? '#1c130d' : '#0e0906';
    glyphColor = isVisible ? '#b45309' : '#78350f';
  } else if (tile === TileType.CopperVein) {
    char = '⛋';
    tileColor = isVisible ? '#2e1c12' : '#1d110a';
    glyphColor = isVisible ? '#f97316' : '#c2410c';
  } else if (tile === TileType.IronVein) {
    char = '⛋';
    tileColor = isVisible ? '#1e293b' : '#0f172a';
    glyphColor = isVisible ? '#cbd5e1' : '#64748b';
  } else if (tile === TileType.Water) {
    if (isOverworld) {
      if (biome === 'tundra') {
        char = '=';
        tileColor = isVisible ? '#0284c7' : '#0369a1';
        glyphColor = isVisible ? '#e2e8f0' : '#cbd5e1';
      } else if (biome === 'glacial') {
        char = '❄';
        tileColor = isVisible ? '#0369a1' : '#075985';
        glyphColor = isVisible ? '#f0f9ff' : '#bae6fd';
      } else if (biome === 'volcanic') {
        char = '≈';
        tileColor = isVisible ? '#7f1d1d' : '#450a0a';
        glyphColor = isVisible ? '#fb923c' : '#ea580c';
      } else if (biome === 'coral_reef') {
        char = '≈';
        tileColor = isVisible ? '#0369a1' : '#0c4a6e';
        glyphColor = isVisible ? '#38bdf8' : '#0284c7';
      } else if (biome === 'swamp') {
        char = '≈';
        tileColor = isVisible ? '#143c19' : '#052c0e';
        glyphColor = isVisible ? '#a3e635' : '#4d7c0f';
      } else if (biome === 'desert') {
        char = '≈';
        tileColor = isVisible ? '#083344' : '#022d42';
        glyphColor = isVisible ? '#22d3ee' : '#0891b2';
      } else {
        char = '~';
        tileColor = isVisible ? '#081e3a' : '#040d1c';
        glyphColor = isVisible ? '#38bdf8' : '#0369a1';
      }
    } else {
      if (depth >= 6) {
        char = '≈';
        tileColor = isVisible ? '#7f1d1d' : '#450a0a';
        glyphColor = isVisible ? '#f97316' : '#ea580c';
      } else {
        char = '~';
        tileColor = isVisible ? '#081e3a' : '#040d1c';
        glyphColor = isVisible ? '#38bdf8' : '#0369a1';
      }
    }
  } else if (tile === TileType.Path) {
    if (isOverworld) {
      if (biome === 'desert') {
        char = '▪';
        tileColor = isVisible ? '#382215' : '#1c110a';
        glyphColor = isVisible ? '#f59e0b' : '#92400e';
      } else if (biome === 'tundra') {
        char = '▪';
        tileColor = isVisible ? '#1e293b' : '#0f172a';
        glyphColor = isVisible ? '#93c5fd' : '#3b82f6';
      } else if (biome === 'glacial') {
        char = '▫';
        tileColor = isVisible ? '#0c2842' : '#051421';
        glyphColor = isVisible ? '#bae6fd' : '#38bdf8';
      } else if (biome === 'swamp') {
        char = '▪';
        tileColor = isVisible ? '#112a1d' : '#08150e';
        glyphColor = isVisible ? '#4ade80' : '#166534';
      } else if (biome === 'volcanic') {
        char = '▪';
        tileColor = isVisible ? '#280e0e' : '#140707';
        glyphColor = isVisible ? '#fb923c' : '#c2410c';
      } else if (biome === 'coral_reef') {
        char = '·';
        tileColor = isVisible ? '#0c3247' : '#051924';
        glyphColor = isVisible ? '#67e8f9' : '#0891b2';
      } else if (biome === 'town') {
        char = '▪';
        tileColor = isVisible ? '#272d37' : '#13161c';
        glyphColor = isVisible ? '#94a3b8' : '#475569';
      } else {
        char = '▪';
        tileColor = isVisible ? '#27211b' : '#14100d';
        glyphColor = isVisible ? '#d6d3d1' : '#78716c';
      }
    } else {
      if (isUnderworld) {
        char = '▪';
        tileColor = isVisible ? '#260c0c' : '#130606';
        glyphColor = isVisible ? '#f87171' : '#991b1b';
      } else {
        char = '▪';
        tileColor = isVisible ? '#27211b' : '#14100d';
        glyphColor = isVisible ? '#d6d3d1' : '#78716c';
      }
    }
  } else if (tile === TileType.DungeonEntrance) {
    char = '∩';
    tileColor = isVisible ? '#1c1917' : '#0c0a09';
    glyphColor = isVisible ? '#e879f9' : '#a21caf';
  } else if (tile === TileType.TownGate) {
    char = '∏';
    tileColor = isVisible ? '#221f1d' : '#110f0e';
    glyphColor = isVisible ? '#fbbf24' : '#b45309';
  } else if (tile === TileType.Table) {
    char = '┬';
    tileColor = isVisible ? '#221610' : '#110b08';
    glyphColor = isVisible ? '#b45309' : '#78350f';
  } else if (tile === TileType.Chair) {
    char = 'c';
    tileColor = isVisible ? '#221610' : '#110b08';
    glyphColor = isVisible ? '#d97706' : '#92400e';
  } else if (tile === TileType.Bed) {
    char = 'b';
    tileColor = isVisible ? '#1e1b4b' : '#0f0e26';
    glyphColor = isVisible ? '#38bdf8' : '#0284c7';
  } else if (tile === TileType.Bedroll) {
    char = '🛏️';
    tileColor = isVisible ? '#1e1b4b' : '#0f0e26';
    glyphColor = isVisible ? '#38bdf8' : '#0284c7';
  } else if (tile === TileType.FieldTent) {
    char = '⛺';
    tileColor = isVisible ? '#132e1b' : '#0a1a0f';
    glyphColor = isVisible ? '#4ade80' : '#166534';
  } else if (tile === TileType.Campfire) {
    char = '🔥';
    tileColor = isVisible ? '#271306' : '#140a03';
    glyphColor = isVisible ? '#ea580c' : '#b45309';
  } else if (tile === TileType.Anvil) {
    char = '⚒';
    tileColor = isVisible ? '#1e293b' : '#0f172a';
    glyphColor = isVisible ? '#e2e8f0' : '#64748b';
  } else if (tile === TileType.Window) {
    char = '⊞';
    tileColor = isVisible ? '#172554' : '#0f172a';
    glyphColor = isVisible ? '#38bdf8' : '#1e3a8a';
  } else if (tile === TileType.Fireplace) {
    char = '♨';
    tileColor = isVisible ? '#451a03' : '#1c0d02';
    glyphColor = isVisible ? '#f97316' : '#7c2d12';
  } else if (tile === TileType.Bush) {
    if (isOverworld) {
      if (biome === 'desert') {
        const hash = (tileX !== undefined && tileY !== undefined) ? Math.abs((tileX * 11 + tileY * 23) % 100) : 0;
        if (hash > 60) {
          char = '🪻'; // Sun-blossom Aloe / Desert flower
          tileColor = isVisible ? '#2d1a10' : '#160d08';
          glyphColor = isVisible ? '#f59e0b' : '#92400e';
        } else {
          char = '🌾'; // Golden Dune Grass / Dry Shrub
          tileColor = isVisible ? '#27170e' : '#130b07';
          glyphColor = isVisible ? '#d97706' : '#78350f';
        }
      } else if (biome === 'tundra') {
        char = '🫐';
        tileColor = isVisible ? '#0c1a2e' : '#030712';
        glyphColor = isVisible ? '#93c5fd' : '#3b82f6';
      } else if (biome === 'swamp') {
        char = '🫐';
        tileColor = isVisible ? '#021e14' : '#000f0a';
        glyphColor = isVisible ? '#c084fc' : '#7e22ce';
      } else {
        char = '🍓';
        tileColor = isVisible ? '#064e3b' : '#022c22';
        glyphColor = isVisible ? '#f43f5e' : '#9f1239';
      }
    } else {
      char = '🍓';
      tileColor = isVisible ? '#064e3b' : '#022c22';
      glyphColor = isVisible ? '#f43f5e' : '#9f1239';
    }
  } else if (tile === TileType.Sign) {
    char = '🪧';
    tileColor = isVisible ? '#2d1d10' : '#150d07';
    glyphColor = isVisible ? '#f59e0b' : '#78350f';
  } else if (tile === TileType.Torch) {
    char = '🕯';
    tileColor = isVisible ? '#1c1917' : '#0c0a09';
    glyphColor = isVisible ? '#fbbf24' : '#b45309';
  } else if (tile === TileType.WatchtowerWall) {
    char = '█';
    tileColor = isVisible ? '#334155' : '#1e293b';
    glyphColor = isVisible ? '#64748b' : '#475569';
  } else if (tile === TileType.WatchtowerSlit) {
    char = '⌸';
    tileColor = isVisible ? '#1e293b' : '#0f172a';
    glyphColor = isVisible ? '#ef4444' : '#991b1b';
  } else if (tile === TileType.WatchtowerDeck) {
    char = '▒';
    tileColor = isVisible ? '#451a03' : '#1c0d02';
    glyphColor = isVisible ? '#b45309' : '#7c2d12';
  } else if (tile === TileType.WatchtowerBarricade) {
    char = '❌';
    tileColor = isVisible ? '#221610' : '#110b08';
    glyphColor = isVisible ? '#d97706' : '#7c2d12';
  } else if (tile === TileType.WatchtowerFlag) {
    char = '⚑';
    tileColor = isVisible ? '#1e1b4b' : '#0f0e26';
    if (controller === 'syndicate') {
      glyphColor = isVisible ? '#c084fc' : '#8b5cf6';
    } else if (controller === 'vanguard') {
      glyphColor = isVisible ? '#38bdf8' : '#0284c7';
    } else {
      glyphColor = isVisible ? '#cbd5e1' : '#64748b';
    }
  }

  const result: TileStyle = { char, tileColor, glyphColor };
  if (tileStyleCache.size >= MAX_TILE_STYLE_CACHE) {
    tileStyleCache.clear();
  }
  tileStyleCache.set(key, result);

  return result;
}

export function renderTileMap({
  ctx,
  gameState,
  camX,
  camY,
  dimensions,
  tileSize,
  tilesetConfig,
  tilesetImage,
  animationTick,
}: RenderTileMapParams) {
  // 4. Render Grid Map (Viewport Culling optimized to render only tiles visible in the camera)
  const startX = Math.max(0, Math.floor(camX / tileSize));
  const endX = Math.min(gameState.levelWidth, Math.ceil((camX + dimensions.width) / tileSize));
  const startY = Math.max(0, Math.floor(camY / tileSize));
  const endY = Math.min(gameState.levelHeight, Math.ceil((camY + dimensions.height) / tileSize));

  // Set baseline font & alignment ONCE before tile grid rendering loop
  ctx.font = `bold 14px "JetBrains Mono", Menlo, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
  const activeWatchtower = gameState.isOverworld ? gameState.overworldChunks?.[chunkKey]?.watchtower : undefined;
  const controller = activeWatchtower?.controller || 'neutral';
  const isOverworld = gameState.isOverworld;
  const biome = gameState.biome;
  const depth = gameState.playerStats.depth;

  const shadowParams = getDirectionalShadowParams(gameState.gameTime || 720, gameState.weather);

  for (let y = startY; y < endY; y++) {
    const mapRow = gameState.map[y];
    const discRow = gameState.discovered[y];
    const visRow = gameState.visible[y];
    if (!mapRow) continue;

    const ry = y * tileSize - camY;

    for (let x = startX; x < endX; x++) {
      const rx = x * tileSize - camX;
      const tile = mapRow[x];
      const isDiscovered = discRow ? discRow[x] ?? false : false;

      if (!isDiscovered) {
        // Draw pure dark fog of war
        ctx.fillStyle = '#020617';
        ctx.fillRect(rx, ry, tileSize, tileSize);
        continue;
      }

      const isVisible = visRow ? visRow[x] ?? false : false;

      const style = resolveTileStyle(tile, isVisible, isOverworld, biome, depth, controller, x, y);

      // Draw tile background and character glyph (or animated tileset sprite if enabled)
      drawSpriteOrAscii(ctx, rx, ry, style.char, style.tileColor, style.glyphColor, {
        tileType: tile,
        biome: isOverworld ? biome : undefined,
        fontSize: `bold 14px "JetBrains Mono", Menlo, monospace`
      }, tilesetConfig, tilesetImage, animationTick, tileSize);

      // Render procedural sine-wave water shimmer ripples and shoreline sparkle
      if (isVisible && tile === TileType.Water) {
        renderWaterTileShimmer(ctx, rx, ry, tileSize, x, y, isOverworld ? biome : undefined, false);
      }

      // Render dynamic sun & moon directional drop shadows for trees, walls, and structures
      if (isVisible && isShadowCastingTile(tile)) {
        renderTileDirectionalShadow(ctx, rx, ry, tileSize, tile, shadowParams);
      }
    }
  }

  // Batched tactical grid sub-borders pass in a single stroke call
  ctx.strokeStyle = '#3341551a';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = startX; x <= endX; x++) {
    const rx = x * tileSize - camX;
    const topY = startY * tileSize - camY;
    const botY = endY * tileSize - camY;
    ctx.moveTo(rx, topY);
    ctx.lineTo(rx, botY);
  }

  for (let y = startY; y <= endY; y++) {
    const ry = y * tileSize - camY;
    const leftX = startX * tileSize - camX;
    const rightX = endX * tileSize - camX;
    ctx.moveTo(leftX, ry);
    ctx.lineTo(rightX, ry);
  }

  ctx.stroke();
}

