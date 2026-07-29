import { GameState } from '../types';
import { SpriteSheetConfig } from '../components/GameCanvas';
import { drawSpriteOrAscii } from './spriteRenderer';

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
  tileSize: number;
  tilesetConfig: SpriteSheetConfig;
  tilesetImage: HTMLImageElement | null;
  animationTick: number;
  effects: GameVisualEffect[];
  shakersMap: Record<string, boolean>;
}

export function renderEntityLayer({
  ctx,
  gameState,
  camX,
  camY,
  tileSize,
  tilesetConfig,
  tilesetImage,
  animationTick,
  effects,
  shakersMap,
}: RenderEntityLayerParams) {
  // 4b. Render Corpses (on top of blood, under living units/traps)
  if (gameState.corpses) {
    gameState.corpses.forEach((corpse) => {
      const x = corpse.x;
      const y = corpse.y;
      if (!gameState.discovered[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;
      const isVisible = gameState.visible[y]?.[x] ?? false;

      ctx.save();
      ctx.globalAlpha = isVisible ? 0.75 : 0.35;

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

  // 4c. Render Dungeon Props (under traps and items)
  if (!gameState.isOverworld && gameState.dungeonProps) {
    gameState.dungeonProps.forEach((prop) => {
      const x = prop.x;
      const y = prop.y;
      if (!gameState.discovered[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;
      const isVisible = gameState.visible[y]?.[x] ?? false;

      ctx.save();
      ctx.globalAlpha = isVisible ? 0.90 : 0.40;
      ctx.fillStyle = prop.color || '#64748b';
      ctx.font = 'bold 13px "JetBrains Mono", Menlo, monospace';
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
      const npcZ = npc.z !== undefined ? npc.z : 0;
      if (gameState.isOverworld && npcZ !== (gameState.overworldZ || 0)) return;
      if (!gameState.visible[y]?.[x]) return;

      const rx = x * tileSize - camX;
      const ry = y * tileSize - camY;

      ctx.strokeStyle = npc.color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx + tileSize / 2, ry + tileSize / 2, tileSize * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = npc.color;
      if (npc.char === '🛌' || ['🌿', '🏹', '🚶'].includes(npc.char)) {
        ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
      } else {
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(npc.char, rx + tileSize / 2, ry + tileSize / 2);

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
    });
  }

  // 7. Render Enemies
  gameState.enemies.forEach((enemy) => {
    const x = enemy.x;
    const y = enemy.y;
    if (!gameState.visible[y]?.[x]) return;

    const rx = x * tileSize - camX;
    const ry = y * tileSize - camY;

    if (enemy.isBoss) {
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
    } else if (enemy.isElite) {
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

      drawSpriteOrAscii(ctx, rx, ry, enemy.char, 'transparent', enemy.color, {
        entityChar: enemy.char,
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

    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 7px "Inter", sans-serif';
      ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, rx + tileSize / 2, ry + tileSize - 4);
    }
  });

  // 8. Render Player
  const prx = gameState.playerX * tileSize - camX;
  const pry = gameState.playerY * tileSize - camY;

  const torchGrad = ctx.createRadialGradient(
    prx + tileSize / 2,
    pry + tileSize / 2,
    4,
    prx + tileSize / 2,
    pry + tileSize / 2,
    tileSize * 1.5
  );
  torchGrad.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
  torchGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = torchGrad;
  ctx.beginPath();
  ctx.arc(prx + tileSize / 2, pry + tileSize / 2, tileSize * 1.5, 0, Math.PI * 2);
  ctx.fill();

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

    drawSpriteOrAscii(ctx, prx, pry, playerChar, 'transparent', playerColor, {
      entityChar: playerChar,
      fontSize: `900 16px "JetBrains Mono", Menlo, monospace`
    }, tilesetConfig, tilesetImage, animationTick, tileSize);
  }

  if (gameState.playerStats.hp < gameState.playerStats.maxHp * 0.3) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(prx + tileSize / 2, pry + tileSize / 2, tileSize * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 9. Render Floating Particle Effects / Damage numbers / Projectiles
  effects.forEach((fx) => {
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
      ctx.font = fx.type === 'crit_num' ? 'bold 15px "Space Grotesk", system-ui' : '950 13px "Inter", system-ui';
      ctx.fillStyle = fx.color;
      ctx.globalAlpha = fx.life;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      
      ctx.fillText(fx.text || '', frx, fry);
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }
  });
}
