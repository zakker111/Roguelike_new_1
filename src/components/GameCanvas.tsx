/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { TileType, Enemy, Trap, Chest, GameState } from '../types';
import { GraphicsVisualMode } from '../canvas/types';
import { renderTileMap } from '../canvas/tileMapRenderer';
import { renderElementalFields } from '../canvas/elementalVfxRenderer';
import { renderEntityLayer, GameVisualEffect } from '../canvas/entityLayerRenderer';
import { renderWeatherAndLighting } from '../canvas/weatherLightingRenderer';
import { hybridGraphicsEngine } from '../canvas/HybridGraphicsEngine';
import { assetPreloader } from '../canvas/AssetPreloader';
import { mockupAtlasGenerator } from '../canvas/MockupAtlasGenerator';
import { tilesetAtlasManager } from '../canvas/TilesetAtlasManager';
import { cameraController } from '../canvas/cameraController';
import { entityInterpolationManager } from '../canvas/entityInterpolationManager';
import { combatVfxEngine } from '../canvas/combatVfxEngine';
import { calculateDirectionalDrift } from '../utils/combatFloaterDrift';
import { chunkBackgroundCache } from '../canvas/chunkBackgroundCache';
import { performanceMonitor } from '../utils/performanceMonitor';
import { bloomEngine } from '../canvas/bloomEngine';
import { vignetteRenderer } from '../canvas/vignetteRenderer';
import { setAcousticListenerContext } from '../utils/audio/acousticOcclusion';
import {
  SpriteSheetTileMapping,
  SpriteSheetConfig,
  DEFAULT_TILESET_CONFIG,
} from '../canvas/types';

export type { SpriteSheetTileMapping, SpriteSheetConfig };
export { DEFAULT_TILESET_CONFIG };

interface GameCanvasProps {
  gameState: GameState;
  onTileClick: (x: number, y: number) => void;
  shakeTrigger: number; // increments on damage to trigger screen shake
  graphicsMode?: GraphicsVisualMode | 'text' | 'tileset';
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
      if (graphicsMode === 'text' || graphicsMode === 'classic_glyph') {
        hybridGraphicsEngine.setMode('classic_glyph');
      } else {
        hybridGraphicsEngine.setMode('animated_tileset');
      }
      chunkBackgroundCache.invalidate();
    }
  }, [graphicsMode]);

  // --- Tileset & Atlas Synchronization Hook ---
  const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
  const tilesetConfig = DEFAULT_TILESET_CONFIG; // Managed centrally by AssetPreloader
  const animationTickRef = useRef<number>(0);

  useEffect(() => {
    if (assetPreloader.getSource() === 'classic_png') {
      assetPreloader.preloadAllPngs();
    }
    if (!assetPreloader.isCodeLoaded('main_tileset')) {
      mockupAtlasGenerator.generateAllAtlases('classic', tilesetAtlasManager.getSpriteSize());
    }

    const unsubscribe = assetPreloader.onAtlasChange(() => {
      chunkBackgroundCache.invalidate();
    });
    return unsubscribe;
  }, []);

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
  const lastCssCamRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });

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
      const frameStart = performance.now();
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

      // 2. Update combat VFX engine (projectiles, slashes, decals, floating numbers)
      combatVfxEngine.update();

      // 2b. Update legacy/canvas particle effects in-place without creating new array instances
      const fxList = effectsRef.current;
      const newTrailParticles: GameVisualEffect[] = [];
      let i = fxList.length - 1;
      while (i >= 0) {
        const fx = fxList[i];
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

              const drift = calculateDirectionalDrift({
                targetX,
                targetY,
                sourceX: startX,
                sourceY: startY,
                isCrit: fx.impactType === 'crit',
              });

              newTrailParticles.push({
                id: `proj_impact_dmg_${Math.random()}`,
                type: fxType,
                x: drift.spawnX,
                y: drift.spawnY,
                text: fx.impactText,
                color: col,
                vx: drift.vx,
                vy: drift.vy,
                life: 1.0,
                size: fx.impactType === 'crit' ? 14 : 10,
              });

              // Splatters
              const splatterCount = fx.impactType === 'crit' ? 10 : 5;
              for (let s = 0; s < splatterCount; s++) {
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

            // Remove dead projectile via swap-and-pop
            fxList[i] = fxList[fxList.length - 1];
            fxList.pop();
            i--;
            continue;
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

          fx.x = currentX;
          fx.y = currentY;
          fx.progress = nextProgress;
        } else {
          const isText = fx.type !== 'particle';
          const speedMultiplier = isText ? 0.28 : 0.40;
          const decayRate = isText ? 0.018 : 0.016; // ~55 frames of crisp, clear lifetime (~0.9s)
          fx.x += fx.vx * speedMultiplier;
          fx.y += fx.vy * speedMultiplier;
          fx.life -= decayRate;

          if (fx.life <= 0) {
            fxList[i] = fxList[fxList.length - 1];
            fxList.pop();
            i--;
            continue;
          }
        }
        i--;
      }

      if (newTrailParticles.length > 0) {
        fxList.push(...newTrailParticles);
        if (fxList.length > 100) {
          fxList.splice(0, fxList.length - 100);
        }
      }

      // 3. Clear Canvas
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      ctx.save();
      // Camera Tracking: Focus on player's interpolated render position with responsive lerping
      const playerPos = entityInterpolationManager.getRenderPosition('player', gameState.playerX, gameState.playerY);

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

      const camState = cameraController.update(
        playerPos.renderX,
        playerPos.renderY,
        dimensions.width,
        dimensions.height,
        TILE_SIZE,
        contextChanged || dimsChanged
      );

      const camX = camState.x;
      const camY = camState.y;

      // Apply shake translations
      ctx.translate(camState.shakeX, camState.shakeY);

      // Persist the real coordinates for pinpoint exact clicking
      lastRenderedCamRef.current = { x: camX, y: camY };

      // Update CSS custom properties for absolute positioned overlays only when camera shifts (eliminates DOM style recalc lag)
      if (lastCssCamRef.current.x !== camX || lastCssCamRef.current.y !== camY) {
        lastCssCamRef.current.x = camX;
        lastCssCamRef.current.y = camY;
        if (containerRef.current) {
          containerRef.current.style.setProperty('--cam-x', `${camX}px`);
          containerRef.current.style.setProperty('--cam-y', `${camY}px`);
        }
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

      // 4b. Render Elemental Ground Fields (Fire, Ice, Shock, Steam, Poison Gas)
      renderElementalFields({
        ctx,
        gameState,
        camX,
        camY,
        dimensions,
        tileSize: TILE_SIZE,
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
        camX,
        camY,
        tileSize: TILE_SIZE,
      });

      // 7. Luminous HDR Bloom Pass (Torches, Fireplaces, Magic, Elemental Fields)
      bloomEngine.renderBloomPass(ctx, gameState, camX, camY, dimensions, TILE_SIZE);

      // 8. Atmospheric Perimeter Vignette Pass (Dungeon Depth, Day/Night, Storms)
      vignetteRenderer.renderVignettePass(ctx, dimensions, gameState);

      // Update acoustic raytracing listener coordinates & current map for real-time behind-door muffling
      setAcousticListenerContext(gameState.playerX, gameState.playerY, gameState.map);

      const frameDuration = performance.now() - frameStart;
      performanceMonitor.recordFrame(
        frameDuration,
        effectsRef.current.length + combatVfxEngine.getActiveFloaterCount(),
        3
      );

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
    const handleAddEffect = (event: CustomEvent<{ x: number; y: number; text: string; type: 'dmg' | 'crit' | 'heal' | 'mana'; sourceX?: number; sourceY?: number }>) => {
      const { x, y, text, type, sourceX, sourceY } = event.detail;

      // Dispatch to modern unified combat VFX engine
      combatVfxEngine.dispatchEffect({
        x,
        y,
        sourceX,
        sourceY,
        text,
        type,
        onImpactShake: (intensity) => {
          shakeRef.current.intensity = Math.max(shakeRef.current.intensity, intensity);
        },
      });

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
      projectileType: string;
      impactText?: string;
      impactType?: 'dmg' | 'crit' | 'heal' | 'mana';
      impactHealingText?: string | null;
    }>) => {
      const { startX, startY, targetX, targetY, color, projectileType, impactText, impactType, impactHealingText } = event.detail;

      combatVfxEngine.spawnProjectile({
        startX,
        startY,
        targetX,
        targetY,
        color,
        projectileType,
        impactText,
        impactType,
        impactHealingText,
      }, (intensity) => {
        shakeRef.current.intensity = Math.max(shakeRef.current.intensity, intensity);
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
      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 font-mono flex items-center gap-3.5 pointer-events-none shadow-lg z-20">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-sm shadow-amber-400/50" />
          <span className="text-slate-400">Depth:</span>
          <strong className="text-amber-300">{gameState.playerStats.depth === 0 ? 'Surface' : `${gameState.playerStats.depth}F`}</strong>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400">Turns:</span>
          <strong className="text-slate-100">{gameState.playerStats.turnsPlayed}</strong>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400">Threat:</span>
          <strong className="text-rose-400">{(1 + (gameState.playerStats.depth - 1) * 0.25 + (gameState.playerStats.turnsPlayed / 100) * 0.05 + (gameState.playerStats.realTimeSeconds / 3600) * 0.5).toFixed(2)}x</strong>
        </span>
      </div>

      {/* Cardinal Map Directions */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-800/80 text-[9px] font-mono tracking-widest text-slate-400/90 shadow-sm pointer-events-none select-none z-20">
        ▲ NORTH
      </div>
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-slate-800/80 text-[9px] font-mono tracking-widest text-slate-400/90 shadow-sm pointer-events-none select-none z-20">
        ▼ SOUTH
      </div>
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-slate-950/70 backdrop-blur-sm py-2.5 px-1 rounded-full border border-slate-800/80 text-[9px] font-mono tracking-widest text-slate-400/90 shadow-sm pointer-events-none select-none [writing-mode:vertical-lr] flex items-center justify-center z-20">
        ◀ WEST
      </div>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-950/70 backdrop-blur-sm py-2.5 px-1 rounded-full border border-slate-800/80 text-[9px] font-mono tracking-widest text-slate-400/90 shadow-sm pointer-events-none select-none [writing-mode:vertical-lr] flex items-center justify-center z-20">
        ▶ EAST
      </div>

      <div className="absolute bottom-3 py-1 px-3 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-2 rounded-xl shadow-lg select-none pointer-events-none z-20">
        <span className="hidden sm:inline">🖱️ Click tiles to walk/strike</span>
        <span className="hidden sm:inline text-slate-700">|</span>
        <span className="hidden sm:inline">⌨️ Arrow keys or WASD</span>
        <span className="inline sm:hidden">📱 Tap D-pad below or canvas to move</span>
      </div>
    </div>
  );
}

export const GameCanvas = React.memo(GameCanvasComponent);
export default GameCanvas;
