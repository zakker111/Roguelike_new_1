import { GameState, TileType } from '../types';
import { SpriteSheetConfig } from '../components/GameCanvas';
import { drawSpriteOrAscii } from './spriteRenderer';
import { getDirectionalShadowParams, renderEntityDirectionalShadow } from './shadowRenderer';
import { visualFxParticleSystem } from './visualFxParticleSystem';
import { entityInterpolationManager } from './entityInterpolationManager';
import { combatVfxEngine } from './combatVfxEngine';

const lastEntityPositions = new Map<string, { x: number; y: number }>();

function isWaterOrSwampTile(tile: any): boolean {
  if (!tile) return false;
  if (tile === TileType.Water || tile === 'Water' || tile === 'ShallowWater' || tile === 'Swamp' || tile === 'Stream') return true;
  if (typeof tile === 'string' && (tile.includes('🌊') || tile.includes('🐊') || tile.includes('~'))) return true;
  return false;
}

export interface GameVisualEffect {
  id: string;
  type: 'damage_num' | 'crit_num' | 'particle' | 'heal_num' | 'projectile';
  x: number;
  y: number;
  text?: string;
  color: string;
  vx: number;
  vy: number;
  life: number;
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

export interface RenderEntityLayerParams {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  camX: number;
  camY: number;
  dimensions?: { width: number; height: number };
  tileSize: number;
  tilesetConfig: SpriteSheetConfig;
  tilesetImage: HTMLImageElement | null;
  animationTick: number;
  effects: GameVisualEffect[];
  shakersMap: Record<string, boolean>;
}

let staleCleanupTick = 0;

export function renderEntityLayer({
  ctx,
  gameState,
  camX,
  camY,
  dimensions,
  tileSize,
  tilesetConfig,
  tilesetImage,
  animationTick,
  effects,
  shakersMap,
}: RenderEntityLayerParams) {
  // Viewport culling boundaries (with 2-tile margin padding)
  const minTileX = dimensions ? Math.floor(camX / tileSize) - 2 : -Infinity;
  const maxTileX = dimensions ? Math.ceil((camX + dimensions.width) / tileSize) + 2 : Infinity;
  const minTileY = dimensions ? Math.floor(camY / tileSize) - 2 : -Infinity;
  const maxTileY = dimensions ? Math.ceil((camY + dimensions.height) / tileSize) + 2 : Infinity;

  const isTileInViewport = (tx: number, ty: number) => {
    return tx >= minTileX && tx <= maxTileX && ty >= minTileY && ty <= maxTileY;
  };

  const shadowParams = getDirectionalShadowParams(gameState.gameTime || 720, gameState.weather);

  // Active entities cleanup for interpolation (throttled to every 120 frames to eliminate 60fps Set allocations)
  if (++staleCleanupTick % 120 === 0) {
    const activeIds = new Set<string>();
    activeIds.add('player');
    const enemyCount = gameState.enemies.length;
    for (let eIdx = 0; eIdx < enemyCount; eIdx++) {
      activeIds.add(`enemy_${gameState.enemies[eIdx].id}`);
    }
    if (gameState.npcs) {
      const npcCount = gameState.npcs.length;
      for (let nIdx = 0; nIdx < npcCount; nIdx++) {
        const n = gameState.npcs[nIdx];
        activeIds.add(`npc_${n.id || n.name}`);
      }
    }
    entityInterpolationManager.cleanupStale(activeIds);
  }

  // 4a. Render Ground Decals (blood, scorch marks, frost patches, stone cracks)
  combatVfxEngine.renderUnderLayer(ctx, camX, camY, tileSize);

  // 4b. Render Corpses (on top of blood, under living units/traps)
  if (gameState.corpses) {
    gameState.corpses.forEach((corpse) => {
      const x = corpse.x;
      const y = corpse.y;
      if (!isTileInViewport(x, y)) return;
      if (!gameState.discovered[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;
      const isVisible = gameState.visible[y]?.[x] ?? false;

      ctx.save();
      const fade = corpse.decayTurns !== undefined && corpse.decayTurns < 20
        ? Math.max(0.1, corpse.decayTurns / 20)
        : 1.0;
      ctx.globalAlpha = (isVisible ? 0.75 : 0.35) * fade;

      let corpseGlyph = '%';
      if (corpse.type === 'animal') {
        corpseGlyph = '🪶';
      } else if (corpse.name?.toLowerCase().includes('skeleton')) {
        corpseGlyph = '☠';
      }

      ctx.fillStyle = isVisible ? '#cbd5e1' : '#64748b';
      ctx.font = 'bold 12px "JetBrains Mono", Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(corpseGlyph, rx + tileSize / 2, ry + tileSize / 2);

      ctx.fillStyle = corpse.color || '#ef4444';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText(corpse.char, rx + tileSize / 2 - 5, ry + tileSize / 2 + 5);

      ctx.restore();
    });
  }

  // 4c. Render Decor & Dungeon Props (under traps and items)
  if (gameState.dungeonProps && gameState.dungeonProps.length > 0) {
    gameState.dungeonProps.forEach((prop) => {
      const x = prop.x;
      const y = prop.y;
      if (!isTileInViewport(x, y)) return;
      if (!gameState.discovered[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;
      const isVisible = gameState.visible[y]?.[x] ?? false;

      ctx.save();
      ctx.globalAlpha = isVisible ? 0.95 : 0.45;
      ctx.fillStyle = prop.color || '#64748b';
      ctx.font = 'bold 14px "JetBrains Mono", Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(prop.char, rx + tileSize / 2, ry + tileSize / 2);
      ctx.restore();
    });
  }

  // 5. Render Traps (if discovered)
  gameState.traps.forEach((trap) => {
    const x = trap.x;
    const y = trap.y;
    if (!isTileInViewport(x, y)) return;
    if (!gameState.discovered[y]?.[x]) return;

    if (trap.hidden && !trap.detected) return;

    const rx = x * tileSize - camX;
    const ry = y * tileSize - camY;
    const isVisible = gameState.visible[y]?.[x] ?? false;

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
    }, tilesetConfig, tilesetImage, animationTick, tileSize);
  });

  // 6. Render Chests (if discovered)
  gameState.chests.forEach((chest) => {
    const x = chest.x;
    const y = chest.y;
    if (!isTileInViewport(x, y)) return;
    if (!gameState.discovered[y]?.[x]) return;

    const rx = x * tileSize - camX;
    const ry = y * tileSize - camY;
    const isVisible = gameState.visible[y]?.[x] ?? false;

    const chestGlyph = chest.isOpened ? '⎓' : '🎁';
    const chestGlyphColor = isVisible ? '#f59e0b' : '#d97706';
    drawSpriteOrAscii(ctx, rx, ry, chestGlyph, 'transparent', chestGlyphColor, {
      chestOpened: chest.isOpened,
      fontSize: 'bold 13px "JetBrains Mono", monospace',
      alpha: isVisible ? 1.0 : 0.4
    }, tilesetConfig, tilesetImage, animationTick, tileSize);
  });

  // 5b. Render Points of Interest (POIs)
  if (gameState.isOverworld && gameState.overworldChunks) {
    const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
    const activeChunk = gameState.overworldChunks[chunkKey];
    const pois = activeChunk?.pois || [];
    
    pois.forEach((poi) => {
      const x = poi.x;
      const y = poi.y;
      if (!isTileInViewport(x, y)) return;
      if (!gameState.discovered[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;
      const isVisible = gameState.visible[y]?.[x] ?? false;

      ctx.strokeStyle = poi.color + (poi.isInteracted ? '33' : '66');
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rx + tileSize / 2, ry + tileSize / 2, tileSize * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      if (!poi.isInteracted && isVisible && (gameState.playerStats.turnsPlayed % 3 === 0)) {
        ctx.fillStyle = '#fef08a';
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillText('✦', rx + tileSize - 2, ry + 4);
      }

      ctx.fillStyle = isVisible ? poi.color : '#64748b';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(poi.char, rx + tileSize / 2, ry + tileSize / 2);

      ctx.fillStyle = isVisible ? poi.color + 'bb' : '#475569cc';
      ctx.font = '900 6px "Inter", sans-serif';
      ctx.fillText(poi.type.slice(0, 4).toUpperCase(), rx + tileSize / 2, ry + tileSize - 3.5);
    });
  }

  // 6a. Render Loot Piles
  if (gameState.lootPiles) {
    gameState.lootPiles.forEach((loot) => {
      const x = loot.x;
      const y = loot.y;
      if (!isTileInViewport(x, y)) return;
      if (!gameState.discovered[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;
      const isVisible = gameState.visible[y]?.[x] ?? false;

      ctx.fillStyle = isVisible ? '#fbbf24' : '#b45309';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', rx + tileSize / 2, ry + tileSize / 2);
    });
  }

  // 6b. Render Town NPCs
  if (gameState.npcs) {
    gameState.npcs.forEach((npc) => {
      const x = npc.x;
      const y = npc.y;
      if (!isTileInViewport(x, y)) return;
      const npcZ = npc.z !== undefined ? npc.z : 0;
      if (gameState.isOverworld && npcZ !== (gameState.overworldZ || 0)) return;
      if (!gameState.visible[y]?.[x]) return;

      const npcKey = `npc_${npc.id || npc.name}`;
      const npcInterp = entityInterpolationManager.getRenderPosition(npcKey, x, y);
      const rx = npcInterp.renderX * tileSize - camX;
      const ry = npcInterp.renderY * tileSize - camY;

      // Directional drop shadow for Town NPCs
      renderEntityDirectionalShadow(ctx, rx, ry, tileSize, shadowParams, 0.9);

      ctx.strokeStyle = npc.color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx + tileSize / 2, ry + tileSize / 2, tileSize * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      if (tilesetConfig.enabled && tilesetImage && npc.char !== '🛌') {
        const npcAnim = npcInterp.isMoving ? 'walk' : 'idle';
        const npcDir = npcInterp.facing;
        const npcId = npc.role ? npc.role.toLowerCase() : 'civilian';
        drawSpriteOrAscii(ctx, rx, ry, npc.char, 'transparent', npc.color, {
          entityChar: npc.char,
          entityId: npcId,
          direction: npcDir,
          animState: npcAnim,
          fontSize: 'bold 14px "JetBrains Mono", monospace'
        }, tilesetConfig, tilesetImage, animationTick, tileSize);
      } else {
        ctx.fillStyle = npc.color;
        if (npc.char === '🛌' || ['🌿', '🏹', '🚶'].includes(npc.char)) {
          ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        } else {
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.char, rx + tileSize / 2, ry + tileSize / 2);
      }

      if (npc.char === '🛌') {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        const offset = (Date.now() / 900) % 1;
        const zX = rx + tileSize * 0.75 + Math.sin(offset * Math.PI * 2) * 1.5;
        const zY = ry + tileSize * 0.25 - offset * 6;
        ctx.fillText('z', zX - 2, zY);
        ctx.fillText('Z', zX, zY + 3);
      }

      ctx.fillStyle = npc.color;
      ctx.font = '600 7px "Inter", sans-serif';
      ctx.fillText(npc.role.toUpperCase(), rx + tileSize / 2, ry + tileSize - 4);

      // Check movement for water ripples & rain splashes
      const prevNpcPos = lastEntityPositions.get(npcKey);
      if (prevNpcPos && (prevNpcPos.x !== x || prevNpcPos.y !== y)) {
        const tile = gameState.map[y]?.[x];
        if (isWaterOrSwampTile(tile)) {
          visualFxParticleSystem.spawnWaterRipple(rx + tileSize / 2, ry + tileSize / 2);
        }
        if (gameState.isOverworld && (gameState.weather === 'rainy' || (gameState.weather as string) === 'stormy')) {
          visualFxParticleSystem.spawnFootstepSplash(rx + tileSize / 2, ry + tileSize / 2, 5);
        }
      }
      lastEntityPositions.set(npcKey, { x, y });
    });
  }

  // 6.5 Render Telegraphed Attack Hazard Overlay Tiles
  gameState.enemies.forEach((enemy) => {
    if (enemy.telegraphedAttack) {
      const tx = enemy.telegraphedAttack.targetX;
      const ty = enemy.telegraphedAttack.targetY;
      if (isTileInViewport(tx, ty) && gameState.visible[ty]?.[tx]) {
        const trx = tx * tileSize - camX;
        const tryY = ty * tileSize - camY;

        ctx.save();
        const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.35 + pulse * 0.35})`;
        ctx.fillRect(trx, tryY, tileSize, tileSize);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(trx + 2, tryY + 2, tileSize - 4, tileSize - 4);

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️HAZARD', trx + tileSize / 2, tryY + tileSize / 2);
        ctx.restore();
      }
    }
  });

  // 7. Render Enemies
  gameState.enemies.forEach((enemy) => {
    const x = enemy.x;
    const y = enemy.y;
    if (!isTileInViewport(x, y)) return;
    if (!gameState.visible[y]?.[x]) return;

    const enemyKey = `enemy_${enemy.id}`;
    const enemyInterp = entityInterpolationManager.getRenderPosition(enemyKey, x, y);
    const rx = enemyInterp.renderX * tileSize - camX;
    const ry = enemyInterp.renderY * tileSize - camY;

    const isApex = enemy.isBoss || enemy.difficultyTier === 'apex';
    const isTough = enemy.isElite || enemy.difficultyTier === 'tough';

    // Directional drop shadow for Enemies
    renderEntityDirectionalShadow(
      ctx,
      rx,
      ry,
      tileSize,
      shadowParams,
      isApex ? 1.5 : isTough ? 1.25 : 0.95
    );

    if (isApex) {
      const radial = ctx.createRadialGradient(
        rx + tileSize / 2,
        ry + tileSize / 2,
        2,
        rx + tileSize / 2,
        ry + tileSize / 2,
        tileSize * 1.15
      );
      radial.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
      radial.addColorStop(0.5, 'rgba(168, 85, 247, 0.22)');
      radial.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(rx + tileSize / 2, ry + tileSize / 2, tileSize * 1.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (isTough) {
      const radial = ctx.createRadialGradient(
        rx + tileSize / 2,
        ry + tileSize / 2,
        2,
        rx + tileSize / 2,
        ry + tileSize / 2,
        tileSize * 0.75
      );
      radial.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      radial.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(rx + tileSize / 2, ry + tileSize / 2, tileSize * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!shakersMap[enemy.id]) {
      const enemyFontSize = enemy.isBoss
        ? `bold 18px "JetBrains Mono", Menlo, monospace`
        : `bold 15px "JetBrains Mono", Menlo, monospace`;

      const enemyDir = enemyInterp.facing;
      let enemyAnim: 'idle' | 'walk' | 'attack' | 'hurt' = enemyInterp.isMoving ? 'walk' : 'idle';
      if (enemy.isStaggered) enemyAnim = 'hurt';

      const isGuard = (enemy as any).isTownGuard || (enemy.name && enemy.name.toLowerCase().includes('guard')) || (enemy.name && enemy.name.toLowerCase().includes('sentry'));
      const resolvedEntityId = isGuard ? 'town_guard' : enemy.id;
      const resolvedChar = isGuard ? '🛡' : enemy.char;

      drawSpriteOrAscii(ctx, rx, ry, resolvedChar, 'transparent', enemy.color, {
        entityChar: resolvedChar,
        entityId: resolvedEntityId,
        direction: enemyDir,
        animState: enemyAnim,
        fontSize: enemyFontSize
      }, tilesetConfig, tilesetImage, animationTick, tileSize);

      if (enemy.isBoss && (!tilesetConfig.enabled || !tilesetImage)) {
        ctx.font = `8px "Inter", sans-serif`;
        ctx.fillStyle = enemy.color;
        ctx.textAlign = 'center';
        ctx.fillText('👑', rx + tileSize / 2, ry - 3);
      }

      if (enemy.state === 'Sleeping' || (enemy.state as string) === 'Sleeping') {
        ctx.font = `10px "Inter", sans-serif`;
        ctx.fillStyle = '#60a5fa';
        ctx.textAlign = 'center';
        ctx.fillText('💤', rx + tileSize - 2, ry + 4);
      }
    }

    const healthPercent = Math.max(0, enemy.hp / enemy.maxHp);
    const barWidth = tileSize - 4;
    const barHeight = enemy.isBoss ? 4 : 3;
    const barX = rx + 2;
    const barY = ry + 2;

    ctx.fillStyle = '#450a0a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = enemy.isBoss
      ? (healthPercent > 0.5 ? '#eab308' : '#ca8a04')
      : (healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Stagger / Guard Bar Rendering
    const maxStagger = enemy.maxStaggerMeter || (enemy.isBoss ? 120 : enemy.isElite ? 75 : 45);
    const currentStagger = enemy.staggerMeter || 0;
    if (currentStagger > 0 || enemy.isStaggered) {
      const staggerPercent = Math.min(1.0, currentStagger / maxStagger);
      const staggerBarY = barY + barHeight + 1;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(barX, staggerBarY, barWidth, 2);

      ctx.fillStyle = enemy.isStaggered ? '#f97316' : '#f59e0b';
      ctx.fillRect(barX, staggerBarY, barWidth * staggerPercent, 2);
    }

    if (enemy.isStaggered) {
      ctx.font = 'bold 8px "Inter", sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.textAlign = 'center';
      ctx.fillText('💥 STAGGERED', rx + tileSize / 2, ry - 3);
    }

    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 7px "Inter", sans-serif';
      ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, rx + tileSize / 2, ry + tileSize - 4);
    }

    // Check movement for water ripples & rain splashes
    const prevEnemyPos = lastEntityPositions.get(enemyKey);
    if (prevEnemyPos && (prevEnemyPos.x !== x || prevEnemyPos.y !== y)) {
      const tile = gameState.map[y]?.[x];
      if (isWaterOrSwampTile(tile)) {
        visualFxParticleSystem.spawnWaterRipple(rx + tileSize / 2, ry + tileSize / 2);
      }
      if (gameState.isOverworld && (gameState.weather === 'rainy' || (gameState.weather as string) === 'stormy')) {
        visualFxParticleSystem.spawnFootstepSplash(rx + tileSize / 2, ry + tileSize / 2, 5);
      }
    }
    lastEntityPositions.set(enemyKey, { x, y });
  });

  // 8. Render Player
  const playerInterp = entityInterpolationManager.getRenderPosition('player', gameState.playerX, gameState.playerY);
  const prx = playerInterp.renderX * tileSize - camX;
  const pry = playerInterp.renderY * tileSize - camY;

  // Directional drop shadow for Player
  renderEntityDirectionalShadow(ctx, prx, pry, tileSize, shadowParams, 1.0);

  if (!shakersMap['player']) {
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

    const playerDir = playerInterp.facing;
    const playerAnim = playerInterp.isMoving ? 'walk' : 'idle';

    drawSpriteOrAscii(ctx, prx, pry, playerChar, 'transparent', playerColor, {
      entityChar: playerChar,
      entityId: 'player',
      direction: playerDir,
      animState: playerAnim,
      fontSize: `900 16px "JetBrains Mono", Menlo, monospace`,
      paperdollEquipment: {
        helmet: gameState.equippedHelmet,
        armor: gameState.equippedArmor,
        weapon: gameState.currentWeapon,
        shield: gameState.equippedShield,
        boots: gameState.equippedBoots,
      }
    }, tilesetConfig, tilesetImage, animationTick, tileSize);
  }

  if (gameState.isBraced) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(prx + tileSize / 2, pry + tileSize / 2, tileSize * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ BRACED', prx + tileSize / 2, pry - 4);
    ctx.restore();
  }

  if (gameState.playerStats.hp < gameState.playerStats.maxHp * 0.3) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(prx + tileSize / 2, pry + tileSize / 2, tileSize * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Check player movement for water ripples & rain splashes
  const playerKey = 'player';
  const prevPlayerPos = lastEntityPositions.get(playerKey);
  if (prevPlayerPos && (prevPlayerPos.x !== gameState.playerX || prevPlayerPos.y !== gameState.playerY)) {
    const tile = gameState.map[gameState.playerY]?.[gameState.playerX];
    if (isWaterOrSwampTile(tile)) {
      visualFxParticleSystem.spawnWaterRipple(prx + tileSize / 2, pry + tileSize / 2);
    }
    if (gameState.isOverworld && (gameState.weather === 'rainy' || (gameState.weather as string) === 'stormy')) {
      visualFxParticleSystem.spawnFootstepSplash(prx + tileSize / 2, pry + tileSize / 2, 6);
    }
  }
  lastEntityPositions.set(playerKey, { x: gameState.playerX, y: gameState.playerY });

  // 9. Render Floating Particle Effects / Damage numbers / Projectiles
  effects.forEach((fx) => {
    const tileX = Math.floor(fx.x);
    const tileY = Math.floor(fx.y);
    if (!gameState.visible[tileY]?.[tileX]) return;

    const frx = fx.x * tileSize - camX;
    const fry = fx.y * tileSize - camY;

    if (fx.type === 'particle') {
      ctx.fillStyle = fx.color;
      ctx.globalAlpha = fx.life;
      ctx.beginPath();
      ctx.arc(frx, fry, fx.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else if (fx.type === 'projectile') {
      const startX = fx.startX ?? fx.x;
      const startY = fx.startY ?? fx.y;
      const targetX = fx.targetX ?? fx.x;
      const targetY = fx.targetY ?? fx.y;

      const fsrx = startX * tileSize - camX + tileSize / 2;
      const fsry = startY * tileSize - camY + tileSize / 2;
      const ftrx = targetX * tileSize - camX + tileSize / 2;
      const ftry = targetY * tileSize - camY + tileSize / 2;

      const fcx = fx.x * tileSize - camX + tileSize / 2;
      const fcy = fx.y * tileSize - camY + tileSize / 2;

      const dx = ftrx - fsrx;
      const dy = ftry - fsry;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(fcx, fcy);
      
      if (fx.projectileType === 'throwable') {
        ctx.rotate((fx.progress || 0) * Math.PI * 4);
      } else {
        ctx.rotate(angle);
      }

      if (fx.projectileType === 'arrow') {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(5, 0);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8'; 
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(0, -3.5);
        ctx.lineTo(0, 3.5);
        ctx.closePath();
        ctx.fill();

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
        const pulse = 1.0 + Math.sin((fx.progress || 0) * Math.PI * 6) * 0.2;
        const r = 5.0 * pulse;

        ctx.shadowBlur = 12;
        ctx.shadowColor = fx.color || '#a78bfa';

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#f472b6');
        grad.addColorStop(1, '#6d28d9');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
        ctx.stroke();

      } else if (fx.projectileType === 'electric_wand') {
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

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (fx.projectileType === 'skeleton_bolt') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0ea5e9';

        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();

      } else if (fx.projectileType === 'throwable') {
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-5, -2);
        ctx.lineTo(5, -2);
        ctx.lineTo(7, -6);
        ctx.lineTo(7, 6);
        ctx.lineTo(5, 2);
        ctx.lineTo(-5, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-10, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = fx.color || '#ec4899';
        ctx.shadowBlur = 10;
        ctx.shadowColor = fx.color || '#ec4899';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      ctx.save();
      const alpha = Math.min(1.0, Math.max(0, Math.pow(fx.life, 0.75)));
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isCrit = fx.type === 'crit_num';
      
      ctx.font = isCrit 
        ? 'bold 15px "Space Grotesk", system-ui' 
        : '900 13px "Inter", system-ui';

      // Crisp dark text outline for readability without obscuring background
      ctx.lineWidth = isCrit ? 3.5 : 2.5;
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.92)'; // deep slate shadow ring
      ctx.strokeText(fx.text || '', frx, fry);

      // Main vibrant fill
      ctx.fillStyle = fx.color;
      ctx.fillText(fx.text || '', frx, fry);

      ctx.restore();
    }
  });

  // 12. Render Active Projectiles, Melee Slashes, and Floating Damage Numbers
  combatVfxEngine.renderOverLayer(ctx, camX, camY, tileSize);
}
