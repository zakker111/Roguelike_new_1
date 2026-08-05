/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { TileType, Enemy, Trap, Chest, GameState } from '../types';
import { renderTileMap } from '../canvas/tileMapRenderer';
import { renderEntityLayer, GameVisualEffect } from '../canvas/entityLayerRenderer';
import { renderWeatherAndLighting } from '../canvas/weatherLightingRenderer';
import { hybridGraphicsEngine } from '../canvas/HybridGraphicsEngine';

export interface SpriteSheetTileMapping {
  /** Column index on the sprite sheet (0-indexed) */
  sx: number;
  /** Row index on the sprite sheet (0-indexed) */
  sy: number;
  /** Total frames for an animated sequence (defaults to 1 for static elements) */
  frameCount?: number;
  /** Custom width multiplier (e.g. for large multi-tile boss characters) */
  widthMultiplier?: number;
  /** Custom height multiplier */
  heightMultiplier?: number;
  /** Animation speed multiplier: game ticks to spend on each visual frame */
  ticksPerFrame?: number;
}

export interface SpriteSheetConfig {
  /** Master switch to enable sprite-sheet textured rendering. Defaults to false to use default stylized text/emojis. */
  enabled: boolean;
  /** File path or URL to the spritesheet image file */
  imageSrc: string;
  /** Native size of a single tile in the target spritesheet (typically 16 or 32 pixels) */
  spriteSize: number;
  /** Mapping of TileType enum values to their coordinates and animation sequences */
  tileMappings: Partial<Record<TileType, SpriteSheetTileMapping>>;
  /** Biome specific mappings to override standard TileType mappings dynamically */
  biomeMappings?: Record<string, Partial<Record<TileType, SpriteSheetTileMapping>>>;
  /** Traps mapping by trap name */
  trapMappings?: Record<string, SpriteSheetTileMapping>;
  /** Chest mappings by open/closed status */
  chestMappings?: {
    closed: SpriteSheetTileMapping;
    opened: SpriteSheetTileMapping;
  };
  /** Mapping of entity character characters (e.g. '@', 'S', 'O', 'G') to their animated sprite rows */
  entityMappings?: Record<string, SpriteSheetTileMapping>;
}

export const DEFAULT_TILESET_CONFIG: SpriteSheetConfig = {
  enabled: false, // Defaulting to false to preserve the current high-contrast text/emoji tiles
  imageSrc: '/assets/tileset.png', // Placeholder URL for future artist assets
  spriteSize: 16, // Typical retro 16x16 pixel grids
  tileMappings: {
    [TileType.Wall]: { sx: 1, sy: 0 },
    [TileType.Floor]: { sx: 2, sy: 0 },
    [TileType.Door]: { sx: 3, sy: 0, frameCount: 2, ticksPerFrame: 10 }, // doors can transition open/closed
    [TileType.StairsDown]: { sx: 4, sy: 0 },
    [TileType.StairsUp]: { sx: 5, sy: 0 },
    [TileType.Path]: { sx: 6, sy: 0 },
    [TileType.DungeonEntrance]: { sx: 7, sy: 0 },
    [TileType.TownGate]: { sx: 8, sy: 0 },
    [TileType.Table]: { sx: 9, sy: 0 },
    [TileType.Chair]: { sx: 10, sy: 0 },
    [TileType.Bed]: { sx: 11, sy: 0 },
    [TileType.Campfire]: { sx: 12, sy: 0, frameCount: 4, ticksPerFrame: 6 }, // Animated campfire
    [TileType.Anvil]: { sx: 5, sy: 1 },
    [TileType.Fireplace]: { sx: 13, sy: 0, frameCount: 4, ticksPerFrame: 6 },
    [TileType.Window]: { sx: 14, sy: 0 },
    [TileType.Sign]: { sx: 15, sy: 0 },
    [TileType.Torch]: { sx: 0, sy: 1, frameCount: 3, ticksPerFrame: 8 }, // Animated flickering torch
    [TileType.PineTree]: { sx: 1, sy: 1 },
    [TileType.BirchTree]: { sx: 2, sy: 1 },
    [TileType.CopperVein]: { sx: 3, sy: 1 },
    [TileType.IronVein]: { sx: 4, sy: 1 },
  },
  biomeMappings: {
    desert: {
      [TileType.Grass]: { sx: 0, sy: 2 }, // Sand dunes
      [TileType.Tree]: { sx: 1, sy: 2 }, // Cactus
      [TileType.Water]: { sx: 2, sy: 2, frameCount: 4, ticksPerFrame: 12 }, // Shimmering Oasis Water
      [TileType.Bush]: { sx: 3, sy: 2 }, // Tumbleweed
    },
    tundra: {
      [TileType.Grass]: { sx: 0, sy: 3 }, // Snowy ground
      [TileType.Tree]: { sx: 1, sy: 3 }, // Snowy pine tree
      [TileType.Water]: { sx: 2, sy: 3 }, // Frozen ice cracks
      [TileType.Bush]: { sx: 3, sy: 3 }, // Ice shrub
    },
    swamp: {
      [TileType.Grass]: { sx: 0, sy: 4 }, // Murky bog mud
      [TileType.Tree]: { sx: 1, sy: 4 }, // Purple willow tree
      [TileType.Water]: { sx: 2, sy: 4, frameCount: 3, ticksPerFrame: 10 }, // Bubbling bog water
      [TileType.Bush]: { sx: 3, sy: 4 }, // Berry bush
    },
    forest: {
      [TileType.Grass]: { sx: 0, sy: 0 }, // Grass ground
      [TileType.Tree]: { sx: 1, sy: 0 }, // Standard forest tree
      [TileType.Water]: { sx: 5, sy: 1, frameCount: 4, ticksPerFrame: 10 }, // Animated river
      [TileType.Bush]: { sx: 6, sy: 1 }, // Berry bush
    }
  },
  trapMappings: {
    'Spikes': { sx: 0, sy: 5, frameCount: 2, ticksPerFrame: 1 }, // Spikes frame transitions
    'FireVent': { sx: 1, sy: 5, frameCount: 4, ticksPerFrame: 5 }, // Animated heat/fire
    'PoisonGas': { sx: 2, sy: 5, frameCount: 4, ticksPerFrame: 8 } // Pulsing gas clouds
  },
  chestMappings: {
    closed: { sx: 3, sy: 5 },
    opened: { sx: 4, sy: 5 }
  },
  entityMappings: {
    '@': { sx: 0, sy: 6, frameCount: 4, ticksPerFrame: 8 }, // Player walking/idle loop
    'S': { sx: 1, sy: 6, frameCount: 4, ticksPerFrame: 10 }, // Skeleton minion
    'O': { sx: 2, sy: 6, frameCount: 4, ticksPerFrame: 10 }, // Brutal Orc warrior
    'Z': { sx: 3, sy: 6, frameCount: 4, ticksPerFrame: 12 }, // Sluggish Zombie
    'G': { sx: 4, sy: 6, frameCount: 4, ticksPerFrame: 10 }, // Agile Goblin robber
    'D': { sx: 5, sy: 6, frameCount: 4, ticksPerFrame: 8 }, // Dragon Boss
  }
};

interface GameCanvasProps {
  gameState: GameState;
  onTileClick: (x: number, y: number) => void;
  shakeTrigger: number; // increments on damage to trigger screen shake
  graphicsMode?: 'text' | 'tileset';
}

const TILE_SIZE = 28;

function GameCanvasComponent({ gameState, onTileClick, shakeTrigger, graphicsMode }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

  // Synchronize graphics mode with HybridGraphicsEngine
  useEffect(() => {
    if (graphicsMode) {
      hybridGraphicsEngine.setMode(graphicsMode);
    }
  }, [graphicsMode]);

  // --- Future-Proof Tileset & Animation System Body hooks ---
  const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
  const tilesetConfig = DEFAULT_TILESET_CONFIG; // Easily swappable or configurable via props in the future
  const animationTickRef = useRef<number>(0);

  useEffect(() => {
    if (!tilesetConfig.enabled) {
      setTilesetImage(null);
      return;
    }
    const img = new Image();
    img.src = tilesetConfig.imageSrc;
    img.onload = () => {
      setTilesetImage(img);
    };
    img.onerror = () => {
      console.warn(`Failed to load tileset image at ${tilesetConfig.imageSrc}. Falling back to default ASCII tiles.`);
      setTilesetImage(null);
    };
  }, [tilesetConfig.enabled, tilesetConfig.imageSrc]);

  // Unified renderer supporting high-fidelity tileset sprites, animated loops, and retro ASCII glyph fallback
  const drawSpriteOrAscii = (
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
    } = {}
  ) => {
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
          ? Math.floor(animationTickRef.current / ticksPerFrame) % totalFrames
          : 0;

        const sourceX = (col + currentFrame) * size;
        const sourceY = row * size;

        // If rendering a non-floor tile with transparent base, draw standard tileColor as backdrop
        if (options.tileType !== TileType.Floor && tileColor !== 'transparent') {
          ctx.fillStyle = tileColor;
          ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
        }

        ctx.drawImage(
          tilesetImage,
          sourceX,
          sourceY,
          size,
          size,
          rx,
          ry,
          TILE_SIZE,
          TILE_SIZE
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
      ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
    }

    if (options.fontSize) {
      ctx.font = options.fontSize;
    }
    ctx.fillStyle = glyphColor;
    ctx.fillText(char, rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);

    if (options.fontSize) {
      ctx.font = `bold 14px "JetBrains Mono", Menlo, monospace`;
    }

    if (hasAlpha) {
      ctx.globalAlpha = 1.0;
    }
  };

  // Manage visual effects list
  const effectsRef = useRef<GameVisualEffect[]>([]);
  // Manage screenshake offset
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  // Track shaking characters and reference for game loop bypass
  const [shakers, setShakers] = useState<Record<string, { x: number; y: number; char: string; color: string; isBoss?: boolean; timestamp: number }>>({});
  const shakersRef = useRef<Record<string, boolean>>({});

  // Always keep a ref to the latest gameState to prevent stale closures
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Smooth Camera custom interpolation references
  const cameraRef = useRef<{ x: number; y: number } | null>(null);
  const prevContextRef = useRef<{
    isOverworld: boolean;
    depth: number;
    chunkX: number;
    chunkY: number;
  } | null>(null);
  const lastRenderedCamRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Listen to shake trigger
  useEffect(() => {
    if (shakeTrigger > 0) {
      shakeRef.current.intensity = 12; // pixels of maximum shift
    }
  }, [shakeTrigger]);

  // Track player coordinates to create spawns of aesthetic particles
  const prevPlayerPos = useRef({ x: gameState.playerX, y: gameState.playerY });
  useEffect(() => {
    const px = gameState.playerX;
    const py = gameState.playerY;

    if (px !== prevPlayerPos.current.x || py !== prevPlayerPos.current.y) {
      // Spawn dust trail particles behind player walking
      const color = gameState.currentWeapon?.color || '#38bdf8';
      for (let i = 0; i < 4; i++) {
        effectsRef.current.push({
          id: `step_${Math.random()}`,
          type: 'particle',
          x: prevPlayerPos.current.x + 0.5,
          y: prevPlayerPos.current.y + 0.5,
          color,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          life: 1.0,
          size: Math.random() * 3 + 1.5,
        });
      }
      prevPlayerPos.current = { x: px, y: py };
    }
  }, [gameState.playerX, gameState.playerY]);

  // Handle ResizeObserver as requested
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Calculate max width and height based on chunk map ends
      const maxW = gameState.levelWidth * TILE_SIZE;
      const maxH = gameState.levelHeight * TILE_SIZE;

      const finalW = Math.min(maxW, Math.max(300, width));
      const finalH = Math.min(maxH, Math.max(250, height));
      setDimensions({ width: finalW, height: finalH });
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [gameState.levelWidth, gameState.levelHeight]);

  // Update effects and render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animId: number;

    const render = () => {
      const gameState = gameStateRef.current;
      // Increment continuous visual frame tick counter for sprite animations
      animationTickRef.current += 1;

      // 1. Update screenshake
      if (shakeRef.current.intensity > 0.1) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.intensity *= 0.85; // damp
      } else {
        shakeRef.current.x = 0;
        shakeRef.current.y = 0;
        shakeRef.current.intensity = 0;
      }

      // 2. Update particle/number effects (texts float slower and decay significantly slower!)
      const newTrailParticles: GameVisualEffect[] = [];
      effectsRef.current = effectsRef.current
        .map((fx) => {
          if (fx.type === 'projectile') {
            const nextProgress = (fx.progress || 0) + (fx.speed || 0.08);
            const startX = fx.startX ?? fx.x;
            const startY = fx.startY ?? fx.y;
            const targetX = fx.targetX ?? fx.x;
            const targetY = fx.targetY ?? fx.y;

            const currentX = startX + (targetX - startX) * Math.min(1, nextProgress);
            const currentY = startY + (targetY - startY) * Math.min(1, nextProgress);

            if (nextProgress >= 1.0) {
              // LANDED! Spawn impact visual effects
              if (fx.impactText) {
                let col = '#f87171'; // pale red default
                let fxType: 'damage_num' | 'crit_num' | 'heal_num' = 'damage_num';

                if (fx.impactType === 'crit') {
                  col = '#fbbf24'; // bright gold
                  fxType = 'crit_num';
                } else if (fx.impactType === 'heal') {
                  col = '#22c55e'; // green
                  fxType = 'heal_num';
                } else if (fx.impactType === 'mana') {
                  col = '#60a5fa'; // blue
                  fxType = 'heal_num';
                }

                newTrailParticles.push({
                  id: `proj_impact_dmg_${Math.random()}`,
                  type: fxType,
                  x: targetX + 0.5 + (Math.random() - 0.5) * 0.2,
                  y: targetY + 0.2,
                  text: fx.impactText,
                  color: col,
                  vx: (Math.random() - 0.5) * 0.04,
                  vy: -0.06 - Math.random() * 0.04,
                  life: 1.0,
                  size: fx.impactType === 'crit' ? 14 : 10,
                });

                // Splatters
                const splatterCount = fx.impactType === 'crit' ? 10 : 5;
                for (let i = 0; i < splatterCount; i++) {
                  newTrailParticles.push({
                    id: `proj_splat_${Math.random()}`,
                    type: 'particle',
                    x: targetX + 0.5,
                    y: targetY + 0.5,
                    color: fx.color || col,
                    vx: (Math.random() - 0.5) * 0.16,
                    vy: (Math.random() - 0.5) * 0.16,
                    life: 0.8,
                    size: Math.random() * 2 + 1,
                  });
                }

                // Shake intensity trigger
                shakeRef.current.intensity = fx.impactType === 'crit' ? 14 : 7;
              }

              if (fx.impactHealingText) {
                newTrailParticles.push({
                  id: `proj_impact_heal_${Math.random()}`,
                  type: 'heal_num',
                  x: startX + 0.5 + (Math.random() - 0.5) * 0.2,
                  y: startY + 0.2,
                  text: fx.impactHealingText,
                  color: '#22c55e',
                  vx: (Math.random() - 0.5) * 0.04,
                  vy: -0.06 - Math.random() * 0.04,
                  life: 1.0,
                  size: 10,
                });
              }

              return {
                ...fx,
                x: targetX,
                y: targetY,
                progress: 1.0,
                life: 0.0 // dies immediately
              };
            }

            // Spawn trail particles during flight
            if (Math.random() < 0.65) {
              let trailColor = fx.color || '#38bdf8';
              let trailSize = Math.random() * 1.5 + 0.8;
              let trailVx = (Math.random() - 0.5) * 0.04;
              let trailVy = (Math.random() - 0.5) * 0.04;

              if (fx.projectileType === 'magic_staff') {
                trailColor = Math.random() > 0.5 ? '#a78bfa' : '#f472b6';
                trailSize = Math.random() * 2.2 + 1.2;
              } else if (fx.projectileType === 'electric_wand') {
                trailColor = Math.random() > 0.4 ? '#fbbf24' : '#f59e0b';
                trailSize = Math.random() * 1.6 + 0.6;
                trailVx = (Math.random() - 0.5) * 0.08;
                trailVy = (Math.random() - 0.5) * 0.08;
              } else if (fx.projectileType === 'skeleton_bolt') {
                trailColor = Math.random() > 0.5 ? '#93c5fd' : '#cbd5e1';
                trailSize = Math.random() * 1.8 + 0.8;
              } else if (fx.projectileType === 'arrow') {
                trailColor = Math.random() > 0.6 ? '#b45309' : '#cbd5e1';
                trailSize = Math.random() * 1.2 + 0.5;
              }

              newTrailParticles.push({
                id: `proj_trail_${Math.random()}`,
                type: 'particle',
                x: currentX + 0.5,
                y: currentY + 0.5,
                color: trailColor,
                vx: trailVx,
                vy: trailVy,
                life: 0.6,
                size: trailSize,
              });
            }

            return {
              ...fx,
              x: currentX,
              y: currentY,
              progress: nextProgress
            };
          }

          const isText = fx.type !== 'particle';
          const speedMultiplier = isText ? 0.12 : 0.40;
          const decayRate = isText ? 0.005 : 0.012; // 0.005 decay rate translates to over 200 frames of visible lifetime (3.3 seconds!)
          return {
            ...fx,
            x: fx.x + fx.vx * speedMultiplier,
            y: fx.y + fx.vy * speedMultiplier,
            life: fx.life - decayRate,
          };
        })
        .filter((fx) => fx.life > 0);

      if (newTrailParticles.length > 0) {
        effectsRef.current.push(...newTrailParticles);
      }

      // 3. Clear Canvas
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      ctx.save();
      // Apply shake translations
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // Camera Tracking player: always center focused on player position with responsive lerping
      const targetCamX = gameState.playerX * TILE_SIZE - dimensions.width / 2 + TILE_SIZE / 2;
      const targetCamY = gameState.playerY * TILE_SIZE - dimensions.height / 2 + TILE_SIZE / 2;

      const contextChanged = !prevContextRef.current || 
        prevContextRef.current.isOverworld !== gameState.isOverworld ||
        prevContextRef.current.depth !== gameState.playerStats.depth ||
        prevContextRef.current.chunkX !== gameState.currentChunkX ||
        prevContextRef.current.chunkY !== gameState.currentChunkY;

      // Track if dimensions altered
      const dimsChanged = lastDimensionsRef.current.width !== dimensions.width || lastDimensionsRef.current.height !== dimensions.height;
      if (dimsChanged) {
        lastDimensionsRef.current = { width: dimensions.width, height: dimensions.height };
      }

      // Update previous context memory
      prevContextRef.current = {
        isOverworld: gameState.isOverworld,
        depth: gameState.playerStats.depth,
        chunkX: gameState.currentChunkX,
        chunkY: gameState.currentChunkY
      };

      const currentDist = cameraRef.current ? Math.hypot(targetCamX - cameraRef.current.x, targetCamY - cameraRef.current.y) : 0;

      if (contextChanged || dimsChanged || !cameraRef.current || currentDist > 96) {
        cameraRef.current = { x: targetCamX, y: targetCamY };
      } else {
        // Highly responsive smooth interpolation focusing on player
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.35;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.35;
      }

      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // Persist the real coordinates for pinpoint exact clicking
      lastRenderedCamRef.current = { x: camX, y: camY };

      // Update CSS custom properties for absolute positioned overlays (eliminates React re-render lag)
      if (containerRef.current) {
        containerRef.current.style.setProperty('--cam-x', `${camX}px`);
        containerRef.current.style.setProperty('--cam-y', `${camY}px`);
      }

      // 4. Render Tile Map Layer
      renderTileMap({
        ctx,
        gameState,
        camX,
        camY,
        dimensions,
        tileSize: TILE_SIZE,
        tilesetConfig,
        tilesetImage,
        animationTick: animationTickRef.current,
      });

      // 5. Render Entity Layer (Corpses, Props, Traps, Chests, POIs, Loot, NPCs, Enemies, Player, Effects)
      renderEntityLayer({
        ctx,
        gameState,
        camX,
        camY,
        dimensions,
        tileSize: TILE_SIZE,
        tilesetConfig,
        tilesetImage,
        animationTick: animationTickRef.current,
        effects: effectsRef.current,
        shakersMap: shakersRef.current,
      });

      ctx.restore();

      // 6. Render Weather & Lighting FX Layer
      renderWeatherAndLighting({
        ctx,
        gameState,
        dimensions,
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [dimensions]);

  // Handle click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Read coordinates precisely from the last rendered frame to handle smooth lerp and alignment
    const camX = lastRenderedCamRef.current.x;
    const camY = lastRenderedCamRef.current.y;

    const finalGridX = Math.floor((clickX + camX) / TILE_SIZE);
    const finalGridY = Math.floor((clickY + camY) / TILE_SIZE);

    const currentGameState = gameStateRef.current;
    if (finalGridX >= 0 && finalGridX < currentGameState.levelWidth && finalGridY >= 0 && finalGridY < currentGameState.levelHeight) {
      onTileClick(finalGridX, finalGridY);

      // Spawn click ripple effects
      effectsRef.current.push({
        id: `click_${Math.random()}`,
        type: 'particle',
        x: finalGridX + 0.5,
        y: finalGridY + 0.5,
        color: 'rgba(251, 191, 36, 0.45)',
        vx: 0,
        vy: -0.05,
        life: 0.8,
        size: 2.0,
      });
    }
  };

  // Allows parents to append floating damage text
  // We can write a custom DOM event or reference to inject nice numbers!
  // Let's hook up a global window listener for floating particles to decouple turn effects
  useEffect(() => {
    const handleAddEffect = (event: CustomEvent<{ x: number; y: number; text: string; type: 'dmg' | 'crit' | 'heal' | 'mana' }>) => {
      const { x, y, text, type } = event.detail;
      let color = '#f87171'; // pale red
      let fxType: 'damage_num' | 'crit_num' | 'heal_num' = 'damage_num';

      if (type === 'crit') {
        color = '#f59e0b'; // golden crit
        fxType = 'crit_num';
      } else if (type === 'heal') {
        color = '#22c55e'; // green heal
        fxType = 'heal_num';
      } else if (type === 'mana') {
        color = '#60a5fa'; // blue mana
        fxType = 'heal_num';
      }

      effectsRef.current.push({
        id: `damage_fx_${Math.random()}`,
        type: fxType,
        x: x + 0.5 + (Math.random() - 0.5) * 0.2,
        y: y + 0.2,
        text,
        color,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.06 - Math.random() * 0.04,
        life: 1.0,
        size: type === 'crit' ? 12 : 9,
      });

      // Spawn splatter burst particles as well!
      const splatterCount = type === 'crit' ? 8 : 4;
      for (let i = 0; i < splatterCount; i++) {
        effectsRef.current.push({
          id: `blood_${Math.random()}`,
          type: 'particle',
          x: x + 0.5,
          y: y + 0.5,
          color,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          life: 0.8,
          size: Math.random() * 2 + 1,
        });
      }

      // 💥 Handle CSS Shake for damage taking!
      if (type === 'dmg' || type === 'crit') {
        const currentGS = gameStateRef.current;
        const isPlayer = currentGS.playerX === x && currentGS.playerY === y;
        const enemy = currentGS.enemies.find(e => e.x === x && e.y === y);

        if (isPlayer) {
          const shakerId = 'player';
          shakersRef.current[shakerId] = true;
          setTimeout(() => {
            setShakers(prev => ({
              ...prev,
              [shakerId]: {
                x,
                y,
                char: '@',
                color: '#fbbf24',
                timestamp: Date.now()
              }
            }));
          }, 0);
          setTimeout(() => {
            delete shakersRef.current[shakerId];
            setShakers(prev => {
              const next = { ...prev };
              delete next[shakerId];
              return next;
            });
          }, 350);
        } else if (enemy && enemy.id) {
          const shakerId = enemy.id;
          shakersRef.current[shakerId] = true;
          setTimeout(() => {
            setShakers(prev => ({
              ...prev,
              [shakerId]: {
                x,
                y,
                char: enemy.char,
                color: enemy.color,
                isBoss: enemy.isBoss,
                timestamp: Date.now()
              }
            }));
          }, 0);
          setTimeout(() => {
            delete shakersRef.current[shakerId];
            setShakers(prev => {
              const next = { ...prev };
              delete next[shakerId];
              return next;
            });
          }, 350);
        }
      }
    };

    const handleSpawnProjectile = (event: CustomEvent<{
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      color: string;
      projectileType: 'arrow' | 'magic_staff' | 'electric_wand' | 'skeleton_bolt' | 'enemy_spell' | 'throwable';
      impactText?: string;
      impactType?: 'dmg' | 'crit' | 'heal' | 'mana';
      impactHealingText?: string | null;
    }>) => {
      const { startX, startY, targetX, targetY, color, projectileType, impactText, impactType, impactHealingText } = event.detail;

      // Determine projectile travel speed based on projectileType (expanded weapon physics!)
      let speed = 0.08;
      if (projectileType === 'electric_wand') speed = 0.15; // fast voltage crackle
      if (projectileType === 'arrow') speed = 0.11; // fast arrow string launch
      if (projectileType === 'magic_staff') speed = 0.06; // heavy celestial magic charge
      if (projectileType === 'skeleton_bolt') speed = 0.075; // chilly ice blast progress
      if (projectileType === 'throwable') speed = 0.085; // spinning axes

      effectsRef.current.push({
        id: `projectile_${Math.random()}`,
        type: 'projectile',
        x: startX,
        y: startY,
        color,
        vx: 0,
        vy: 0,
        life: 1.0,
        size: 3.0,
        startX,
        startY,
        targetX,
        targetY,
        progress: 0,
        speed,
        projectileType,
        impactText,
        impactType,
        impactHealingText
      });
    };

    window.addEventListener('spawn-game-effect' as any, handleAddEffect);
    window.addEventListener('spawn-projectile' as any, handleSpawnProjectile);
    return () => {
      window.removeEventListener('spawn-game-effect' as any, handleAddEffect);
      window.removeEventListener('spawn-projectile' as any, handleSpawnProjectile);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex-grow bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-inner min-h-[220px] md:min-h-[300px] flex items-center justify-center cursor-crosshair select-none"
    >
      <canvas
        ref={canvasRef}
        id="dungeon-canvas"
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        className="block"
      />

      {/* Absolute high-performance overlay matching canvas viewport */}
      <div
        className="absolute pointer-events-none text-[0px]"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          overflow: 'hidden',
        }}
      >
        {/* Render CSS-animated Blood Splatters */}
        {gameState.bloodSplatters && gameState.bloodSplatters.slice(-40).map((splatter) => {
          const x = splatter.x;
          const y = splatter.y;
          if (!gameState.discovered[y]?.[x]) return null;

          const intensity = splatter.intensity;
          const color = splatter.color || '#dc2626';

          // Compute deterministic offset from unique ID so they stay stationary
          const seed = splatter.id.split('_').pop()?.charCodeAt(0) || 7;
          const centerOffsetX = (seed % 8) - 4;
          const centerOffsetY = ((seed >> 2) % 8) - 4;

          return (
            <div
              key={splatter.id}
              className="absolute pointer-events-none animate-blood-drip flex items-center justify-center"
              style={{
                left: `calc(${x} * 28px - var(--cam-x))`,
                top: `calc(${y} * 28px - var(--cam-y))`,
                width: '28px',
                height: '28px',
                transform: `translate(${centerOffsetX}px, ${centerOffsetY}px)`,
                opacity: intensity * 0.28,
                color: color,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-5 h-5 fill-current select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                <path d="M50 20 C40 20 30 30 30 45 C30 55 35 60 40 68 C43 72 45 78 50 78 C55 78 57 72 60 68 C65 60 70 55 70 45 C70 30 60 20 50 20 Z" />
                <circle cx="20" cy="45" r="7" />
                <circle cx="80" cy="50" r="5" />
                <circle cx="45" cy="85" r="6" />
                <circle cx="55" cy="15" r="4" />
              </svg>
            </div>
          );
        })}

        {/* Render CSS-shaking damage overlay sprites */}
        {Object.entries(shakers).map(([id, shakerVal]) => {
          const shaker = shakerVal as { x: number; y: number; char: string; color: string; isBoss?: boolean; timestamp: number };
          return (
            <div
              key={id}
              className="absolute pointer-events-none animate-sprite-shake flex items-center justify-center select-none"
              style={{
                left: `calc(${shaker.x} * 28px - var(--cam-x))`,
                top: `calc(${shaker.y} * 28px - var(--cam-y))`,
                width: '28px',
                height: '28px',
                fontFamily: '"JetBrains Mono", Menlo, monospace',
                fontWeight: 'bold',
                fontSize: shaker.isBoss ? '18px' : '15px',
                color: shaker.color,
                filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.95)) brightness(1.5)',
              }}
            >
              {shaker.char}
            </div>
          );
        })}
      </div>
      
      {/* HUD Quick overlays inside the Canvas zone */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-slate-400 font-mono flex gap-4 pointer-events-none shadow">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
          Depth: <strong className="text-white">{gameState.playerStats.depth === 0 ? 'Surface' : `${gameState.playerStats.depth}F`}</strong>
        </span>
        <span>Turns: <strong className="text-white">{gameState.playerStats.turnsPlayed}</strong></span>
        <span>Threat: <strong className="text-red-400">{(1 + (gameState.playerStats.depth - 1) * 0.25 + (gameState.playerStats.turnsPlayed / 100) * 0.05 + (gameState.playerStats.realTimeSeconds / 3600) * 0.5).toFixed(2)}x</strong></span>
      </div>

      {/* Cardinal Map Directions */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-800/40 text-[9px] font-mono tracking-widest text-slate-400 opacity-60 pointer-events-none select-none">
        ▲ NORTH
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-800/40 text-[9px] font-mono tracking-widest text-slate-400 opacity-60 pointer-events-none select-none">
        ▼ SOUTH
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/40 backdrop-blur-xs py-2 px-1 rounded-full border border-slate-800/40 text-[9px] font-mono tracking-widest text-slate-400 opacity-60 pointer-events-none select-none [writing-mode:vertical-lr] flex items-center justify-center">
        ◀ WEST
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/40 backdrop-blur-xs py-2 px-1 rounded-full border border-slate-800/40 text-[9px] font-mono tracking-widest text-slate-400 opacity-60 pointer-events-none select-none [writing-mode:vertical-lr] flex items-center justify-center">
        ▶ EAST
      </div>

      <div className="absolute bottom-3 py-1 px-3 bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-2 rounded select-none pointer-events-none">
        <span className="hidden sm:inline">🖱️ Click tiles to walk/strike</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">⌨️ Arrow keys or WASD</span>
        <span className="inline sm:hidden">📱 Tap D-pad below or canvas to move</span>
      </div>
    </div>
  );
}

export const GameCanvas = React.memo(GameCanvasComponent);
export default GameCanvas;
