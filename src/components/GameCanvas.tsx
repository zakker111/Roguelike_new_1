/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { TileType, Enemy, Trap, Chest, GameState, getMoonPhase } from '../types';

interface GameVisualEffect {
  id: string;
  type: 'damage_num' | 'crit_num' | 'particle' | 'heal_num' | 'projectile';
  x: number; // grid x
  y: number; // grid y
  text?: string;
  color: string;
  vx: number; // velocity x
  vy: number; // velocity y
  life: number; // 0 to 1
  size: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  progress?: number;
  speed?: number;
  projectileType?: 'arrow' | 'magic_staff' | 'electric_wand' | 'skeleton_bolt' | 'enemy_spell' | 'throwable';
  impactText?: string;
  impactType?: 'dmg' | 'crit' | 'heal' | 'mana';
  impactHealingText?: string | null;
}

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
}

const TILE_SIZE = 28;

export default function GameCanvas({ gameState, onTileClick, shakeTrigger }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

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
    ctx.save();
    if (options.alpha !== undefined) {
      ctx.globalAlpha = options.alpha;
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
        ctx.restore();
        return;
      }
    }

    // Default Fallback: Classic beautifully colored ASCII characters or Emojis
    if (tileColor !== 'transparent') {
      ctx.fillStyle = tileColor;
      ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
    }

    ctx.font = options.fontSize || `bold 14px "JetBrains Mono", Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = glyphColor;
    ctx.fillText(char, rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);

    ctx.restore();
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

      // Camera Tracking player with smooth lerping & auto-snapping on teleport/cross chunk
      const idealCamX = gameState.playerX * TILE_SIZE - dimensions.width / 2 + TILE_SIZE / 2;
      const idealCamY = gameState.playerY * TILE_SIZE - dimensions.height / 2 + TILE_SIZE / 2;

      // Map bounds clamping targets
      const mapWidthPx = gameState.levelWidth * TILE_SIZE;
      const mapHeightPx = gameState.levelHeight * TILE_SIZE;

      let targetCamX = idealCamX;
      let targetCamY = idealCamY;

      if (mapWidthPx > dimensions.width) {
        targetCamX = Math.max(0, Math.min(mapWidthPx - dimensions.width, idealCamX));
      } else {
        targetCamX = -(dimensions.width - mapWidthPx) / 2;
      }

      if (mapHeightPx > dimensions.height) {
        targetCamY = Math.max(0, Math.min(mapHeightPx - dimensions.height, idealCamY));
      } else {
        targetCamY = -(dimensions.height - mapHeightPx) / 2;
      }

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

      if (contextChanged || dimsChanged || !cameraRef.current) {
        cameraRef.current = { x: targetCamX, y: targetCamY };
      } else {
        // Highly responsive smooth interpolation
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.18;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.18;
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

      // 4. Render Grid Map (Viewport Culling optimized to render only tiles visible in the camera)
      const startX = Math.max(0, Math.floor(camX / TILE_SIZE));
      const endX = Math.min(gameState.levelWidth, Math.ceil((camX + dimensions.width) / TILE_SIZE));
      const startY = Math.max(0, Math.floor(camY / TILE_SIZE));
      const endY = Math.min(gameState.levelHeight, Math.ceil((camY + dimensions.height) / TILE_SIZE));

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const rx = x * TILE_SIZE - camX;
          const ry = y * TILE_SIZE - camY;

          const tile = gameState.map[y]?.[x];
          const isDiscovered = gameState.discovered[y]?.[x] ?? false;
          const isVisible = gameState.visible[y]?.[x] ?? false;

          if (!isDiscovered) {
            // Draw pure dark fog of war
            ctx.fillStyle = '#020617';
            ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
            continue;
          }

          // Shading based on current visibility
          const isUnderworld = !gameState.isOverworld && gameState.playerStats.depth >= 6;
          let tileColor = isUnderworld ? '#140101' : '#0f172a'; // floor discovered, not visible deep crimson vs slate-900
          let glyphColor = isUnderworld ? '#580c0c' : '#475569'; // dim crimson vs slate-600
          let char = '.';

          if (tile === TileType.Floor) {
            char = '.';
            if (isUnderworld) {
              tileColor = isVisible ? '#270505' : '#140101'; // glowing embers base
              glyphColor = isVisible ? '#ef4444' : '#7f1d1d'; // magma sparks
            }
          } else if (tile === TileType.Wall) {
            char = '#';
            if (isUnderworld) {
              tileColor = isVisible ? '#3b0707' : '#1a0303'; // obsidian with red veins
              glyphColor = isVisible ? '#f87171' : '#7f1d1d';
            } else {
              tileColor = isVisible ? '#1e293b' : '#0f172a'; // wall highlight
              glyphColor = isVisible ? '#64748b' : '#334155';
            }
          } else if (tile === TileType.Door) {
            char = '+';
            tileColor = isVisible ? '#1e293b' : '#0f172a';
            glyphColor = isVisible ? '#b45309' : '#78350f'; // wood amber door
          } else if (tile === TileType.StairsDown) {
            char = '>';
            tileColor = isVisible ? '#3f3f46' : '#18181b';
            glyphColor = isVisible ? '#fbbf24' : '#b45309'; // stairs Down ladder gold
          } else if (tile === TileType.StairsUp) {
            char = '<';
            tileColor = isVisible ? '#3f3f46' : '#18181b';
            glyphColor = isVisible ? '#38bdf8' : '#0369a1'; // stairs Up ladder blue/sky
          } else if (tile === TileType.Grass) {
            if (gameState.isOverworld) {
              if (gameState.biome === 'desert') {
                char = '░';
                tileColor = isVisible ? '#271911' : '#140c08'; // dune brown
                glyphColor = isVisible ? '#eab308' : '#854d0e'; // golden sand grains
              } else if (gameState.biome === 'tundra') {
                char = '"';
                tileColor = isVisible ? '#111827' : '#030712'; // frosty ground
                glyphColor = isVisible ? '#f1f5f9' : '#4b5563'; // crisp snow
              } else if (gameState.biome === 'swamp') {
                char = '▒';
                tileColor = isVisible ? '#021e14' : '#000f0a'; // murky marsh base
                glyphColor = isVisible ? '#10b981' : '#064e3b'; // mossy mold
              } else {
                char = '"';
                tileColor = isVisible ? '#09210e' : '#041207'; // forest greens
                glyphColor = isVisible ? '#22c55e' : '#15803d';
              }
            } else {
              char = '"';
              tileColor = isVisible ? '#09210e' : '#041207';
              glyphColor = isVisible ? '#22c55e' : '#15803d';
            }
          } else if (tile === TileType.Tree) {
            if (gameState.isOverworld) {
              if (gameState.biome === 'desert') {
                char = '🌵';
                tileColor = isVisible ? '#22150d' : '#110b06';
                glyphColor = isVisible ? '#10b981' : '#047857'; // green prickly cactus
              } else if (gameState.biome === 'tundra') {
                char = '▲';
                tileColor = isVisible ? '#0b1321' : '#030712';
                glyphColor = isVisible ? '#a5f3fc' : '#0891b2'; // frozen pine trees
              } else if (gameState.biome === 'swamp') {
                char = '♣';
                tileColor = isVisible ? '#011c14' : '#000c08';
                glyphColor = isVisible ? '#a855f7' : '#6b21a8'; // purple willow trees
              } else {
                char = '♣';
                tileColor = isVisible ? '#051909' : '#020c04';
                glyphColor = isVisible ? '#10b981' : '#047857';
              }
            } else {
              char = '♣';
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
          } else if (tile === TileType.CopperVein) {
            char = '⛋';
            tileColor = isVisible ? '#2e1c12' : '#1d110a';
            glyphColor = isVisible ? '#f97316' : '#c2410c';
          } else if (tile === TileType.IronVein) {
            char = '⛋';
            tileColor = isVisible ? '#1e293b' : '#0f172a';
            glyphColor = isVisible ? '#cbd5e1' : '#64748b';
          } else if (tile === TileType.Water) {
            if (gameState.isOverworld) {
              if (gameState.biome === 'tundra') {
                char = '='; // icy glacial shelf
                tileColor = isVisible ? '#0284c7' : '#0369a1';
                glyphColor = isVisible ? '#e2e8f0' : '#cbd5e1'; // frozen ice cracks
              } else if (gameState.biome === 'swamp') {
                char = '≈'; // wavy murky bogwater
                tileColor = isVisible ? '#143c19' : '#052c0e';
                glyphColor = isVisible ? '#a3e635' : '#4d7c0f'; // slime green bubbles
              } else if (gameState.biome === 'desert') {
                char = '≈'; // shimmering crystal oasis water
                tileColor = isVisible ? '#083344' : '#022d42';
                glyphColor = isVisible ? '#22d3ee' : '#0891b2';
              } else {
                char = '~';
                tileColor = isVisible ? '#081e3a' : '#040d1c';
                glyphColor = isVisible ? '#38bdf8' : '#0369a1';
              }
            } else {
              const isUnderworld = gameState.playerStats.depth >= 6;
              if (isUnderworld) {
                char = '≈'; // bubbling lava ripples
                tileColor = isVisible ? '#7f1d1d' : '#450a0a'; // deep boiling blood red
                glyphColor = isVisible ? '#f97316' : '#ea580c'; // fiery orange / hot magma red
              } else {
                char = '~';
                tileColor = isVisible ? '#081e3a' : '#040d1c';
                glyphColor = isVisible ? '#38bdf8' : '#0369a1';
              }
            }
          } else if (tile === TileType.Path) {
            char = '.';
            tileColor = isVisible ? '#221f1d' : '#110f0e'; // road slate
            glyphColor = isVisible ? '#a8a29e' : '#57534e';
          } else if (tile === TileType.DungeonEntrance) {
            char = '∩';
            tileColor = isVisible ? '#1c1917' : '#0c0a09';
            glyphColor = isVisible ? '#e879f9' : '#a21caf'; // purple abyss cave
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
            if (gameState.isOverworld) {
              if (gameState.biome === 'desert') {
                char = '*'; // dry tumbleweed
                tileColor = isVisible ? '#22150d' : '#110b06';
                glyphColor = isVisible ? '#b45309' : '#78350f';
              } else if (gameState.biome === 'tundra') {
                char = '❄'; // frosted ice crystals
                tileColor = isVisible ? '#111827' : '#030712';
                glyphColor = isVisible ? '#cbd5e1' : '#64748b';
              } else if (gameState.biome === 'swamp') {
                char = '🫐'; // wild elderberries / nightshade berries
                tileColor = isVisible ? '#021e14' : '#000f0a';
                glyphColor = isVisible ? '#c084fc' : '#7e22ce';
              } else {
                char = '♣';
                tileColor = isVisible ? '#064e3b' : '#022c22';
                glyphColor = isVisible ? '#f43f5e' : '#9f1239'; // sweet red berry bushes
              }
            } else {
              char = '♣';
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
            glyphColor = isVisible ? '#ef4444' : '#991b1b'; // Red glow from slits
          } else if (tile === TileType.WatchtowerDeck) {
            char = '▒';
            tileColor = isVisible ? '#451a03' : '#1c0d02'; // Wooden planks
            glyphColor = isVisible ? '#b45309' : '#7c2d12';
          } else if (tile === TileType.WatchtowerBarricade) {
            char = '❌';
            tileColor = isVisible ? '#221610' : '#110b08';
            glyphColor = isVisible ? '#d97706' : '#7c2d12';
          } else if (tile === TileType.WatchtowerFlag) {
            const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
            const activeWatchtower = gameState.isOverworld ? gameState.overworldChunks?.[chunkKey]?.watchtower : undefined;
            const controller = activeWatchtower?.controller || 'neutral';
            
            char = '⚑';
            tileColor = isVisible ? '#1e1b4b' : '#0f0e26';
            if (controller === 'syndicate') {
              glyphColor = isVisible ? '#c084fc' : '#8b5cf6'; // Purple flag
            } else if (controller === 'vanguard') {
              glyphColor = isVisible ? '#38bdf8' : '#0284c7'; // Blue flag
            } else {
              glyphColor = isVisible ? '#cbd5e1' : '#64748b'; // Grey flag
            }
          }

          // Draw tile background and character glyph (or animated tileset sprite if enabled)
          drawSpriteOrAscii(ctx, rx, ry, char, tileColor, glyphColor, {
            tileType: tile,
            biome: gameState.isOverworld ? gameState.biome : undefined,
            fontSize: `bold 14px "JetBrains Mono", Menlo, monospace`
          });

          // Sub-borders / Grid Lines for tactical aesthetic
          ctx.strokeStyle = '#3341551a'; // extremely faint
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, ry, TILE_SIZE, TILE_SIZE);
        }
      }

      // 4a. Render Blood Splatters (Delegated to high-performance absolute CSS overlay for animated drips & splatters!)

      // 4b. Render Corpses (on top of blood, under living units/traps)
      if (gameState.corpses) {
        gameState.corpses.forEach((corpse) => {
          const x = corpse.x;
          const y = corpse.y;
          if (!gameState.discovered[y]?.[x]) return;

          const rx = x * TILE_SIZE - camX;
          const ry = y * TILE_SIZE - camY;
          const isVisible = gameState.visible[y]?.[x] ?? false;

          ctx.save();
          // Dim if not currently in LOS
          ctx.globalAlpha = isVisible ? 0.75 : 0.35;

          // Select classic raw corpse symbol % or alternative skull icon
          let corpseGlyph = '%';
          if (corpse.type === 'animal') {
            corpseGlyph = '🪶';
          } else if (corpse.name.toLowerCase().includes('skeleton')) {
            corpseGlyph = '☠';
          }

          // Render bone base
          ctx.fillStyle = isVisible ? '#cbd5e1' : '#64748b';
          ctx.font = 'bold 12px "JetBrains Mono", Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(corpseGlyph, rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);

          // Draw the slightly askew character indicator for added aesthetic depth
          ctx.fillStyle = corpse.color || '#ef4444';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText(corpse.char, rx + TILE_SIZE / 2 - 5, ry + TILE_SIZE / 2 + 5);

          ctx.restore();
        });
      }

      // 4c. Render Dungeon Props (under traps and items)
      if (!gameState.isOverworld && gameState.dungeonProps) {
        gameState.dungeonProps.forEach((prop) => {
          const x = prop.x;
          const y = prop.y;
          if (!gameState.discovered[y]?.[x]) return;

          const rx = x * TILE_SIZE - camX;
          const ry = y * TILE_SIZE - camY;
          const isVisible = gameState.visible[y]?.[x] ?? false;

          ctx.save();
          ctx.globalAlpha = isVisible ? 0.90 : 0.40;
          ctx.fillStyle = prop.color || '#64748b';
          ctx.font = 'bold 13px "JetBrains Mono", Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(prop.char, rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);
          ctx.restore();
        });
      }

      // 5. Render Traps (if discovered)
      gameState.traps.forEach((trap) => {
        const x = trap.x;
        const y = trap.y;
        if (!gameState.discovered[y]?.[x]) return;

        // Hide traps if they are hidden and have not been detected yet
        if (trap.hidden && !trap.detected) return;

        const rx = x * TILE_SIZE - camX;
        const ry = y * TILE_SIZE - camY;
        const isVisible = gameState.visible[y]?.[x] ?? false;

        // Draw sub-tile decoration supporting trap sprites & animation frame sequences
        let trapChar = '';
        let trapGlyphColor = '#334155';
        if (trap.type === 'FireVent') {
          trapChar = trap.isActive && isVisible ? '▲' : '▵';
          trapGlyphColor = trap.isActive && isVisible ? '#ea580c' : '#475569';
        } else if (trap.type === 'Spikes') {
          trapChar = '^';
          trapGlyphColor = trap.triggered ? '#b91c1c' : isVisible ? '#b45309' : '#334155';
        } else if (trap.type === 'PoisonGas') {
          trapChar = '░';
          trapGlyphColor = isVisible ? '#22c55e' : '#334155';
        }

        const trapBgColor = trap.detected && !trap.triggered ? 'rgba(239, 68, 68, 0.22)' : 'transparent';

        drawSpriteOrAscii(ctx, rx, ry, trapChar, trapBgColor, trapGlyphColor, {
          trapType: trap.type,
          fontSize: `12px "JetBrains Mono", monospace`,
          alpha: isVisible ? 1.0 : 0.4
        });
      });

      // 6. Render Chests (if discovered)
      gameState.chests.forEach((chest) => {
        const x = chest.x;
        const y = chest.y;
        if (!gameState.discovered[y]?.[x]) return;

        const rx = x * TILE_SIZE - camX;
        const ry = y * TILE_SIZE - camY;
        const isVisible = gameState.visible[y]?.[x] ?? false;

        // Draw Chest with animated/sprite capability
        const chestGlyph = chest.isOpened ? '⎓' : '🎁';
        const chestGlyphColor = isVisible ? '#f59e0b' : '#d97706';
        drawSpriteOrAscii(ctx, rx, ry, chestGlyph, 'transparent', chestGlyphColor, {
          chestOpened: chest.isOpened,
          fontSize: 'bold 13px "JetBrains Mono", monospace',
          alpha: isVisible ? 1.0 : 0.4
        });
      });

      // 5b. Render Points of Interest (POIs) with World Lore and interactive halos
      if (gameState.isOverworld && gameState.overworldChunks) {
        const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
        const activeChunk = gameState.overworldChunks[chunkKey];
        const pois = activeChunk?.pois || [];
        
        pois.forEach((poi) => {
          const x = poi.x;
          const y = poi.y;
          if (!gameState.discovered[y]?.[x]) return;

          const rx = x * TILE_SIZE - camX;
          const ry = y * TILE_SIZE - camY;
          const isVisible = gameState.visible[y]?.[x] ?? false;

          // Drawing custom pulsing circular aura around POIs
          ctx.strokeStyle = poi.color + (poi.isInteracted ? '33' : '66');
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(rx + TILE_SIZE / 2, ry + TILE_SIZE / 2, TILE_SIZE * 0.45, 0, Math.PI * 2);
          ctx.stroke();

          // Spawn ambient stars if un-examined and currently visible
          if (!poi.isInteracted && isVisible && (gameState.playerStats.turnsPlayed % 3 === 0)) {
            ctx.fillStyle = '#fef08a';
            ctx.font = '7px "JetBrains Mono", monospace';
            ctx.fillText('✦', rx + TILE_SIZE - 2, ry + 4);
          }

          // Render symbol (🗿, ⛲, 🔥, 🏰, 🦴)
          ctx.fillStyle = isVisible ? poi.color : '#64748b'; // dimmed in fog of war
          ctx.font = 'bold 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(poi.char, rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);

          // Render name abbreviation below symbol
          ctx.fillStyle = isVisible ? poi.color + 'bb' : '#475569cc';
          ctx.font = '900 6px "Inter", sans-serif';
          ctx.fillText(poi.type.slice(0, 4).toUpperCase(), rx + TILE_SIZE / 2, ry + TILE_SIZE - 3.5);
        });
      }

      // 6a. Render Loot Piles (dropped by slain monsters)
      if (gameState.lootPiles) {
        gameState.lootPiles.forEach((loot) => {
          const x = loot.x;
          const y = loot.y;
          if (!gameState.discovered[y]?.[x]) return;

          const rx = x * TILE_SIZE - camX;
          const ry = y * TILE_SIZE - camY;
          const isVisible = gameState.visible[y]?.[x] ?? false;

          ctx.fillStyle = isVisible ? '#fbbf24' : '#b45309';
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✦', rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);
        });
      }

      // 6b. Render Town NPCs (if visible or in player's memory)
      if (gameState.npcs) {
        gameState.npcs.forEach((npc) => {
          const x = npc.x;
          const y = npc.y;
          const npcZ = npc.z !== undefined ? npc.z : 0;
          if (gameState.isOverworld && npcZ !== (gameState.overworldZ || 0)) return;
          if (!gameState.visible[y]?.[x]) return;

          const rx = x * TILE_SIZE - camX;
          const ry = y * TILE_SIZE - camY;

          // Draw a small ambient circle around NPCs
          ctx.strokeStyle = npc.color + '44';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(rx + TILE_SIZE / 2, ry + TILE_SIZE / 2, TILE_SIZE * 0.45, 0, Math.PI * 2);
          ctx.stroke();

          // NPC Character
          ctx.fillStyle = npc.color;
          if (npc.char === '🛌' || ['🌿', '🏹', '🚶'].includes(npc.char)) {
            ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
          } else {
            ctx.font = 'bold 14px "JetBrains Mono", monospace';
          }
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(npc.char, rx + TILE_SIZE / 2, ry + TILE_SIZE / 2);

          // Draw a tiny floating animated "Zzz" bubble if asleep
          if (npc.char === '🛌') {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            const offset = (Date.now() / 900) % 1; // slow wave offset
            const zX = rx + TILE_SIZE * 0.75 + Math.sin(offset * Math.PI * 2) * 1.5;
            const zY = ry + TILE_SIZE * 0.25 - offset * 6;
            ctx.fillText('z', zX - 2, zY);
            ctx.fillText('Z', zX, zY + 3);
          }

          // Draw small text label for NPC's role
          ctx.fillStyle = npc.color;
          ctx.font = '600 7px "Inter", sans-serif';
          ctx.fillText(npc.role.toUpperCase(), rx + TILE_SIZE / 2, ry + TILE_SIZE - 4);
        });
      }

      // 7. Render Enemies (ONLY if directly visible by player's FOV light)
      gameState.enemies.forEach((enemy) => {
         const x = enemy.x;
         const y = enemy.y;
         if (!gameState.visible[y]?.[x]) return;

        const rx = x * TILE_SIZE - camX;
        const ry = y * TILE_SIZE - camY;

        // Render ambient aura for elite and boss monsters
        if (enemy.isBoss) {
          const radial = ctx.createRadialGradient(
            rx + TILE_SIZE / 2,
            ry + TILE_SIZE / 2,
            2,
            rx + TILE_SIZE / 2,
            ry + TILE_SIZE / 2,
            TILE_SIZE * 1.15
          );
          radial.addColorStop(0, 'rgba(234, 179, 8, 0.45)'); // Glowing gold
          radial.addColorStop(0.5, 'rgba(168, 85, 247, 0.22)'); // Purple outer
          radial.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(rx + TILE_SIZE / 2, ry + TILE_SIZE / 2, TILE_SIZE * 1.15, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.isElite) {
          const radial = ctx.createRadialGradient(
            rx + TILE_SIZE / 2,
            ry + TILE_SIZE / 2,
            2,
            rx + TILE_SIZE / 2,
            ry + TILE_SIZE / 2,
            TILE_SIZE * 0.75
          );
          radial.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
          radial.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(rx + TILE_SIZE / 2, ry + TILE_SIZE / 2, TILE_SIZE * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Enemy Symbol with animated sprite/tileset frame sequences
        if (!shakersRef.current[enemy.id]) {
          const enemyFontSize = enemy.isBoss
            ? `bold 18px "JetBrains Mono", Menlo, monospace`
            : `bold 15px "JetBrains Mono", Menlo, monospace`;

          drawSpriteOrAscii(ctx, rx, ry, enemy.char, 'transparent', enemy.color, {
            entityChar: enemy.char,
            fontSize: enemyFontSize
          });

          if (enemy.isBoss && (!tilesetConfig.enabled || !tilesetImage)) {
            ctx.font = `8px "Inter", sans-serif`;
            ctx.fillStyle = enemy.color;
            ctx.textAlign = 'center';
            ctx.fillText('👑', rx + TILE_SIZE / 2, ry - 3);
          }
        }

        // Draw Health Bar
        const healthPercent = Math.max(0, enemy.hp / enemy.maxHp);
        const barWidth = TILE_SIZE - 4;
        const barHeight = enemy.isBoss ? 4 : 3;
        const barX = rx + 2;
        const barY = ry + 2;

        ctx.fillStyle = '#450a0a'; // dark red back
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Green/Yellow bar based on value (Or special gold color for bosses!)
        ctx.fillStyle = enemy.isBoss
          ? (healthPercent > 0.5 ? '#eab308' : '#ca8a04')
          : (healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444');
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Name popup on hover or brief top overlay
        if (enemy.hp < enemy.maxHp) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 7px "Inter", sans-serif';
          ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, rx + TILE_SIZE / 2, ry + TILE_SIZE - 4);
        }
      });

      // 8. Render Player (Always visible at player x, y)
      const prx = gameState.playerX * TILE_SIZE - camX;
      const pry = gameState.playerY * TILE_SIZE - camY;

      // Draw standard warm aura representing visual light circle torch
      const torchGrad = ctx.createRadialGradient(
        prx + TILE_SIZE / 2,
        pry + TILE_SIZE / 2,
        4,
        prx + TILE_SIZE / 2,
        pry + TILE_SIZE / 2,
        TILE_SIZE * 1.5
      );
      torchGrad.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
      torchGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = torchGrad;
      ctx.beginPath();
      ctx.arc(prx + TILE_SIZE / 2, pry + TILE_SIZE / 2, TILE_SIZE * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw actual player avatar supporting custom player walking/idle sprite sheets
      if (!shakersRef.current['player']) {
        let playerChar = '@';
        let playerColor = '#fbbf24';
        if (gameState.activeMount === 'horse') {
          playerChar = '🏇';
        } else if (gameState.activeMount === 'camel') {
          playerChar = '🐫';
          playerColor = '#f59e0b';
        } else if (gameState.activeMount === 'worg') {
          playerChar = '🐺';
          playerColor = '#94a3b8';
        } else if (gameState.activeMount === 'crocodile') {
          playerChar = '🐊';
          playerColor = '#10b981';
        }

        drawSpriteOrAscii(ctx, prx, pry, playerChar, 'transparent', playerColor, {
          entityChar: playerChar,
          fontSize: `900 16px "JetBrains Mono", Menlo, monospace`
        });
      }

      // Draw light shield rings on low hp
      if (gameState.playerStats.hp < gameState.playerStats.maxHp * 0.3) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(prx + TILE_SIZE / 2, pry + TILE_SIZE / 2, TILE_SIZE * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 9. Render Floating Particle Effects / Damage numbers
      effectsRef.current.forEach((fx) => {
        const frx = fx.x * TILE_SIZE - camX;
        const fry = fx.y * TILE_SIZE - camY;

        if (fx.type === 'particle') {
          ctx.fillStyle = fx.color;
          ctx.globalAlpha = fx.life;
          ctx.beginPath();
          ctx.arc(frx, fry, fx.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0; // reset
        } else if (fx.type === 'projectile') {
          // DRAW DYNAMIC PROJECTILE WITH ANGLE ROTATION
          const startX = fx.startX ?? fx.x;
          const startY = fx.startY ?? fx.y;
          const targetX = fx.targetX ?? fx.x;
          const targetY = fx.targetY ?? fx.y;

          const fsrx = startX * TILE_SIZE - camX + TILE_SIZE / 2;
          const fsry = startY * TILE_SIZE - camY + TILE_SIZE / 2;
          const ftrx = targetX * TILE_SIZE - camX + TILE_SIZE / 2;
          const ftry = targetY * TILE_SIZE - camY + TILE_SIZE / 2;

          // Interpolated screen center coordinates
          const fcx = fx.x * TILE_SIZE - camX + TILE_SIZE / 2;
          const fcy = fx.y * TILE_SIZE - camY + TILE_SIZE / 2;

          // Calculate angle of flight
          const dx = ftrx - fsrx;
          const dy = ftry - fsry;
          const angle = Math.atan2(dy, dx);

          ctx.save();
          ctx.translate(fcx, fcy);
          
          if (fx.projectileType === 'throwable') {
            // Spinning item! Spin based on progress (2 full rotations)
            ctx.rotate((fx.progress || 0) * Math.PI * 4);
          } else {
            ctx.rotate(angle);
          }

          if (fx.projectileType === 'arrow') {
            // Sleek wooden arrow chevron
            ctx.strokeStyle = '#d97706'; // wood shaft
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-9, 0);
            ctx.lineTo(5, 0);
            ctx.stroke();

            // Arrow head metal tip
            ctx.fillStyle = '#94a3b8'; 
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(0, -3.5);
            ctx.lineTo(0, 3.5);
            ctx.closePath();
            ctx.fill();

            // Fletching (red & white feathers)
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-9, 0);
            ctx.lineTo(-12, -3);
            ctx.moveTo(-6, 0);
            ctx.lineTo(-9, -3);
            ctx.moveTo(-9, 0);
            ctx.lineTo(-12, 3);
            ctx.moveTo(-6, 0);
            ctx.lineTo(-9, 3);
            ctx.stroke();

          } else if (fx.projectileType === 'magic_staff') {
            // Purple glowing cosmic core orb with pulsing rings
            const pulse = 1.0 + Math.sin((fx.progress || 0) * Math.PI * 6) * 0.2;
            const r = 5.0 * pulse;

            ctx.shadowBlur = 12;
            ctx.shadowColor = fx.color || '#a78bfa';

            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#f472b6'); // pink glow
            grad.addColorStop(1, '#6d28d9'); // deep violet

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Outer energy orbit ring
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
            ctx.stroke();

          } else if (fx.projectileType === 'electric_wand') {
            // Jagged bright gold electric current
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fbbf24';

            ctx.beginPath();
            ctx.moveTo(-7, 0);
            ctx.lineTo(-3, -4);
            ctx.lineTo(1, 4);
            ctx.lineTo(6, 0);
            ctx.stroke();

            // Flash core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();

          } else if (fx.projectileType === 'skeleton_bolt') {
            // Chilling ice blast shard
            ctx.fillStyle = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#0ea5e9';

            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            // Ice cross star crystal
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.stroke();

          } else if (fx.projectileType === 'throwable') {
            // Spinning iron axe head or dagger
            ctx.fillStyle = '#94a3b8';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            // simple axe shape
            ctx.moveTo(-5, -2);
            ctx.lineTo(5, -2);
            ctx.lineTo(7, -6);
            ctx.lineTo(7, 6);
            ctx.lineTo(5, 2);
            ctx.lineTo(-5, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Wood handle
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(-10, 0);
            ctx.stroke();
          } else {
            // Generic hostile magic sphere
            ctx.fillStyle = fx.color || '#ec4899';
            ctx.shadowBlur = 10;
            ctx.shadowColor = fx.color || '#ec4899';
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
          ctx.shadowBlur = 0; // reset
        } else {
          // Text values (made bigger as requested: bold 15px and 13px instead of 11px and 9px)
          ctx.font = fx.type === 'crit_num' ? 'bold 15px "Space Grotesk", system-ui' : '950 13px "Inter", system-ui';
          ctx.fillStyle = fx.color;
          ctx.globalAlpha = fx.life;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
          
          ctx.fillText(fx.text || '', frx, fry);
          
          ctx.shadowBlur = 0; // reset
          ctx.globalAlpha = 1.0; // reset
        }
      });

      ctx.restore();

      // Day-Night Lighting Ambient Shader and Weather Elements (Only on Overworld chunks)
      if (gameState.isOverworld) {
        const rawMins = gameState.gameTime % 1440;
        let lightCoeff = 1.0; 
        
        if (rawMins < 360) {
          // Night (12 AM to 6 AM): very dark
          lightCoeff = 0.3 + (rawMins / 360) * 0.4;
        } else if (rawMins >= 360 && rawMins < 480) {
          // Dawn (6 AM to 8 AM): transitioning up
          lightCoeff = 0.7 + ((rawMins - 360) / 120) * 0.3;
        } else if (rawMins >= 480 && rawMins < 1080) {
          // Midday (8 AM to 6 PM): crystal clear
          lightCoeff = 1.0;
        } else if (rawMins >= 1080 && rawMins < 1200) {
          // Dusk (6 PM to 8 PM): transitioning down
          lightCoeff = 1.0 - ((rawMins - 1080) / 120) * 0.4;
        } else {
          // Evening / Twilight (8 PM to 12 AM)
          lightCoeff = 0.6 - ((rawMins - 1200) / 240) * 0.3;
        }

        if (lightCoeff < 0.95) {
          // Determine moon phase for gorgeous custom ambient colors during night hours!
          const currentPhase = getMoonPhase(gameState.playerStats?.turnsPlayed || 0);
          let tintColor = `rgba(15, 23, 42, ${0.48 * (1.0 - lightCoeff)})`; // Default slate dark
          
          if (rawMins >= 1200 || rawMins < 360) { // strictly at night hours
            if (currentPhase.id === 'new_moon') {
              // Deep shadow veil violet
              tintColor = `rgba(8, 2, 16, ${0.65 * (1.0 - lightCoeff)})`;
            } else if (currentPhase.id === 'full_moon') {
              // Soft ethereal silver glow
              tintColor = `rgba(224, 231, 255, ${0.28 * (1.0 - lightCoeff)})`;
            } else if (currentPhase.id === 'waxing_crescent') {
              // Soft amber twilight stardust
              tintColor = `rgba(251, 191, 36, ${0.20 * (1.0 - lightCoeff)})`;
            } else if (currentPhase.id === 'first_quarter') {
              // High contrast deep cosmic indigo
              tintColor = `rgba(30, 27, 75, ${0.45 * (1.0 - lightCoeff)})`;
            } else if (currentPhase.id === 'waning_gibbous') {
              // Cool oceanic aquamarine
              tintColor = `rgba(13, 148, 136, ${0.25 * (1.0 - lightCoeff)})`;
            }
          }
          
          ctx.fillStyle = tintColor; 
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        // Render Weather Elements (Rain, Snow, Fog)
        const weather = gameState.weather || 'clear';
        if (weather === 'rainy') {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1;
          const now = Date.now() * 0.04;
          for (let i = 0; i < 28; i++) {
            const rx = (i * 47 + now * 2.2) % dimensions.width;
            const ry = (i * 83 + now * 5.4) % dimensions.height;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 2, ry + 12);
            ctx.stroke();
          }
        } else if (weather === 'snowy') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          const now = Date.now() * 0.012;
          for (let i = 0; i < 30; i++) {
            const rx = (i * 39 + Math.sin(now + i) * 15) % dimensions.width;
            const ry = (i * 73 + now * 0.9) % dimensions.height;
            ctx.beginPath();
            ctx.arc(rx, ry, Math.abs(i % 3) + 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (weather === 'foggy') {
          const fogGrad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
          fogGrad.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
          fogGrad.addColorStop(0.5, 'rgba(148, 163, 184, 0.28)');
          fogGrad.addColorStop(1, 'rgba(148, 163, 184, 0.15)');
          ctx.fillStyle = fogGrad;
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        } else if (weather === 'sandstorm') {
          // Swift swirling desert sandstorm lines
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)'; // Amber/Orange tint
          ctx.lineWidth = 1.5;
          const now = Date.now() * 0.08;
          for (let i = 0; i < 40; i++) {
            const rx = (i * 59 + now * 8.5) % dimensions.width;
            const ry = (i * 37 + Math.sin(now + i) * 8) % dimensions.height;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + 20, ry + 2);
            ctx.stroke();
          }
          // Ambient haze
          ctx.fillStyle = 'rgba(120, 53, 4, 0.08)'; // Deep brown/orange dust glow
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        } else if (weather === 'blizzard') {
          // Rapid swirling ice shards
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)'; // Sky blue ice tint
          ctx.lineWidth = 1;
          const now = Date.now() * 0.05;
          for (let i = 0; i < 50; i++) {
            const rx = (i * 41 + now * 12.0) % dimensions.width;
            const ry = (i * 61 + now * 5.0) % dimensions.height;
            // Draw snowflake
            ctx.beginPath();
            ctx.arc(rx, ry, Math.abs(i % 2) + 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw cold wind swirl lines
            if (i % 5 === 0) {
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx - 15, ry + 3);
              ctx.stroke();
            }
          }
          // Ambient frosty whiteout haze
          ctx.fillStyle = 'rgba(224, 242, 254, 0.12)'; // Frosted ice glow
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        // --- Seasonal Ambient Visual Layers & Particles ---
        const isBloodMoonActive = gameState.bloodMoonTurnsLeft !== undefined && gameState.bloodMoonTurnsLeft > 0;
        if (isBloodMoonActive) {
          // Blood Moon Celestial Rift ambient red haze & embers!
          ctx.fillStyle = 'rgba(220, 38, 38, 0.14)'; // deep red dramatic overlay
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);

          // Drifting fire embers rising up!
          ctx.fillStyle = 'rgba(239, 68, 68, 0.72)';
          const now = Date.now() * 0.005;
          for (let i = 0; i < 25; i++) {
            const rx = (i * 61 + Math.sin(now * 0.4 + i) * 30) % dimensions.width;
            const ry = (dimensions.height - (i * 71 + now * 2.0) % dimensions.height);
            ctx.beginPath();
            ctx.arc(rx, ry, Math.sin(now + i) > 0.3 ? 2.0 : 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const season = gameState.season || 'spring';
        if (season === 'spring') {
          // Spring Cherry Blossoms drifting down
          ctx.fillStyle = 'rgba(244, 63, 94, 0.48)'; // cherry pink
          const now = Date.now() * 0.005;
          for (let i = 0; i < 20; i++) {
            const rx = (i * 53 + Math.sin(now + i) * 35) % dimensions.width;
            const ry = (i * 89 + now * 1.6) % dimensions.height;
            ctx.beginPath();
            ctx.ellipse(rx, ry, 3.8, 2.2, Math.PI / 4 + Math.sin(now + i) * 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (season === 'summer') {
          // Warm Golden Summer Air Overlay & Shimmers
          ctx.fillStyle = 'rgba(251, 191, 36, 0.035)';
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);

          // Glowing dust motes rising / floating
          ctx.fillStyle = 'rgba(253, 224, 71, 0.48)';
          const now = Date.now() * 0.004;
          for (let i = 0; i < 16; i++) {
            const rx = (i * 61 + Math.sin(now * 0.5 + i) * 22) % dimensions.width;
            const ry = (dimensions.height - (i * 97 + now * 1.2) % dimensions.height);
            ctx.beginPath();
            ctx.arc(rx, ry, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (season === 'autumn') {
          // Rusty Autumn Leaf colors
          const leafColors = ['rgba(217, 119, 6, 0.55)', 'rgba(239, 68, 68, 0.48)', 'rgba(245, 158, 11, 0.55)'];
          const now = Date.now() * 0.006;
          for (let i = 0; i < 24; i++) {
            ctx.fillStyle = leafColors[i % 3];
            const rx = (i * 41 + Math.sin(now + i) * 48) % dimensions.width;
            const ry = (i * 79 + now * 2.4) % dimensions.height;
            ctx.beginPath();
            // Diamond leaf shape drawing
            ctx.moveTo(rx, ry - 3.5);
            ctx.lineTo(rx + 4.5, ry);
            ctx.lineTo(rx, ry + 3.5);
            ctx.lineTo(rx - 4.5, ry);
            ctx.closePath();
            ctx.fill();
          }
        } else if (season === 'winter') {
          // Frosty glacial pale blue filter
          ctx.fillStyle = 'rgba(186, 230, 253, 0.05)';
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);

          // Sparkling frosty micro-crystals
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          const now = Date.now() * 0.008;
          for (let i = 0; i < 20; i++) {
            const rx = (i * 59 + Math.cos(now + i) * 18) % dimensions.width;
            const ry = (i * 67 + now * 3.0) % dimensions.height;
            ctx.beginPath();
            ctx.arc(rx, ry, 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

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
        } else if (enemy) {
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
