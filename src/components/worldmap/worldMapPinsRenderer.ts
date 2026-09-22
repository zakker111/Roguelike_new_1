import { ChunkMapInfo, WorldMapFilterState } from './types';

export interface StaticPinsRenderOptions {
  ctx: CanvasRenderingContext2D;
  visibleMinX: number;
  visibleMaxX: number;
  visibleMinY: number;
  visibleMaxY: number;
  chunkSize: number;
  zoomLevel: number;
  getChunkData: (cx: number, cy: number) => ChunkMapInfo;
  filters: WorldMapFilterState;
  currentChunkX: number;
  currentChunkY: number;
  isOverworld: boolean;
  dungeonLevel: number;
  pulseAnim: number;
}

export interface DynamicOverlayRenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  panOffset: { x: number; y: number };
  visibleMinX: number;
  visibleMaxX: number;
  visibleMinY: number;
  visibleMaxY: number;
  chunkSize: number;
  zoomLevel: number;
  getChunkData: (cx: number, cy: number) => ChunkMapInfo;
  filters: WorldMapFilterState;
  currentChunkX: number;
  currentChunkY: number;
  selectedChunkCoord: { x: number; y: number } | null;
  pulseAnim: number;
}

const PIN_ICON_MAP: Record<string, string> = {
  star: '⭐',
  sword: '⚔️',
  shield: '🛡️',
  mine: '⛏️',
  gem: '💎',
  danger: '💀',
  camp: '🏕️',
  loot: '📦',
  herb: '🌿',
  portal: '🌀'
};

/**
 * Pure canvas pass to render static POI markers, town landmark banners,
 * dungeon crests, waystones, custom pins, and hero crosshairs.
 */
export function renderWorldMapStaticPins({
  ctx,
  visibleMinX,
  visibleMaxX,
  visibleMinY,
  visibleMaxY,
  chunkSize,
  zoomLevel,
  getChunkData,
  filters,
  currentChunkX,
  currentChunkY,
  isOverworld,
  dungeonLevel,
  pulseAnim,
}: StaticPinsRenderOptions): void {
  for (let cy = visibleMinY; cy <= visibleMaxY; cy++) {
    for (let cx = visibleMinX; cx <= visibleMaxX; cx++) {
      const x = cx * chunkSize;
      const y = cy * chunkSize;

      const info = getChunkData(cx, cy);
      if (!info.isDiscovered) continue;

      // 1. Render Settlement / Town Landmark
      if (filters.showTowns && info.hasTown) {
        const centerX = x + chunkSize / 2;
        const centerY = y + chunkSize * 0.44;

        // Plaque background badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(5, 7.5 * zoomLevel), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icon: Harbor (⛵), Castle Stronghold (🏰), or Open Village/Hamlet (🏡)
        if (zoomLevel >= 0.6) {
          ctx.font = `${Math.max(8, Math.round(chunkSize * 0.14))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const townIcon = info.hasHarbor ? '⛵' : (info.isCastleTown ? '🏰' : '🏡');
          ctx.fillText(townIcon, centerX, centerY);
        } else {
          // Simplified gold pip at macro zoom
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Town Name Banner if Zoomed In
        if (zoomLevel >= 0.8) {
          const label = cx === 0 && cy === 0 ? 'Oakhaven Village' : info.regionName.split(' [')[0];
          ctx.font = 'bold 7.5px sans-serif';
          const metrics = ctx.measureText(label);
          const badgeW = metrics.width + 8;
          const badgeH = 11;
          const badgeY = y + chunkSize - 13;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(centerX - badgeW / 2, badgeY, badgeW, badgeH);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(centerX - badgeW / 2, badgeY, badgeW, badgeH);

          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, centerX, badgeY + badgeH / 2);
        }
      }
      // 2. Render Dungeon Landmark
      else if (filters.showDungeons && info.hasDungeon) {
        const centerX = x + chunkSize / 2;
        const centerY = y + chunkSize * 0.44;

        ctx.fillStyle = 'rgba(24, 9, 39, 0.85)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(5, 7 * zoomLevel), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (zoomLevel >= 0.6) {
          ctx.font = `${Math.max(7, Math.round(chunkSize * 0.13))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚔️', centerX, centerY);
        } else {
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        if (zoomLevel >= 0.9) {
          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`Vault T${info.threatTier}`, centerX, y + chunkSize - 3);
        }
      }
      // 3. Render Waystone Landmark
      else if (filters.showWaystones && info.hasWaystone) {
        const centerX = x + chunkSize / 2;
        const centerY = y + chunkSize * 0.44;

        if (info.isWaystoneAttuned) {
          // Animated pulsing Leyline aura (only when zoomed in enough)
          if (zoomLevel >= 0.75) {
            const waystonePulse = (4 + (pulseAnim * 5) % 6) * zoomLevel;
            const waystoneAlpha = Math.max(0, 0.8 - (waystonePulse / (10 * zoomLevel)));
            ctx.strokeStyle = `rgba(56, 189, 248, ${waystoneAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, waystonePulse, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Attuned runic core
          ctx.fillStyle = 'rgba(12, 74, 110, 0.85)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(5, 7 * zoomLevel), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (zoomLevel >= 0.6) {
            ctx.font = `${Math.max(7, Math.round(chunkSize * 0.13))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌀', centerX, centerY);
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Dormant Obelisk
          ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(4.5, 6 * zoomLevel), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (zoomLevel >= 0.6) {
            ctx.font = `${Math.max(6, Math.round(chunkSize * 0.11))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚪', centerX, centerY);
          } else {
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 4. Render Custom Player Map Pins
      if (filters.showCustomPins && info.customPins && info.customPins.length > 0) {
        const pin = info.customPins[0];
        const pinX = x + chunkSize * 0.84;
        const pinY = y + chunkSize * 0.18;

        ctx.fillStyle = pin.color || '#f59e0b';
        ctx.beginPath();
        ctx.arc(pinX, pinY, Math.max(3, 4 * zoomLevel), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (zoomLevel >= 0.7) {
          const iconEmoji = PIN_ICON_MAP[pin.icon] || '⭐';
          ctx.font = `${Math.max(5, Math.round(5.5 * zoomLevel))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(iconEmoji, pinX, pinY);
        }

        // Mini label if zoomed in
        if (zoomLevel >= 0.95) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pin.label.slice(0, 12), x + chunkSize / 2, y + chunkSize - 3);
        }
      }

      // 5. Hero Marker Static Base Dot and Crosshairs
      if (cx === currentChunkX && cy === currentChunkY) {
        // Highlight border around hero chunk
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, chunkSize - 2, chunkSize - 2);

        const heroX = x + chunkSize / 2;
        const heroY = y + chunkSize / 2;

        // Golden Beacon Center Core
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(heroX, heroY, 4 * zoomLevel, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hero Reticle Crosshair
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(heroX - 6 * zoomLevel, heroY);
        ctx.lineTo(heroX + 6 * zoomLevel, heroY);
        ctx.moveTo(heroX, heroY - 6 * zoomLevel);
        ctx.lineTo(heroX, heroY + 6 * zoomLevel);
        ctx.stroke();

        if (zoomLevel >= 0.85) {
          ctx.fillStyle = isOverworld ? '#fbbf24' : '#c084fc';
          ctx.font = '900 7.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const heroLabel = !isOverworld && dungeonLevel > 0 ? `HERO (D${dungeonLevel})` : 'HERO';
          ctx.fillText(heroLabel, heroX, y + chunkSize - 3);
        }
      }
    }
  }
}

/**
 * Pure canvas pass to render dynamic animated FX:
 * - Leyline waystone pulse auras
 * - Hero beacon expanding pulse waves
 * - Selected chunk reticle corners with cyan glow
 */
export function renderWorldMapDynamicOverlay({
  ctx,
  width,
  height,
  panOffset,
  visibleMinX,
  visibleMaxX,
  visibleMinY,
  visibleMaxY,
  chunkSize,
  zoomLevel,
  getChunkData,
  filters,
  currentChunkX,
  currentChunkY,
  selectedChunkCoord,
  pulseAnim,
}: DynamicOverlayRenderOptions): void {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);

  // 1. Render animated leyline waystone pulses (only when zoomed in)
  if (filters.showWaystones && zoomLevel >= 0.75) {
    for (let cy = visibleMinY; cy <= visibleMaxY; cy++) {
      for (let cx = visibleMinX; cx <= visibleMaxX; cx++) {
        const info = getChunkData(cx, cy);
        if (info.isDiscovered && info.hasWaystone && info.isWaystoneAttuned) {
          const x = cx * chunkSize;
          const y = cy * chunkSize;
          const centerX = x + chunkSize * 0.22;
          const centerY = y + chunkSize * 0.44;
          const waystonePulse = (4 + (pulseAnim * 5) % 6) * zoomLevel;
          const waystoneAlpha = Math.max(0, 0.8 - (waystonePulse / (10 * zoomLevel)));
          ctx.strokeStyle = `rgba(56, 189, 248, ${waystoneAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, waystonePulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  // 2. Render Hero Beacon Expanding Wave
  if (
    currentChunkX >= visibleMinX &&
    currentChunkX <= visibleMaxX &&
    currentChunkY >= visibleMinY &&
    currentChunkY <= visibleMaxY
  ) {
    const x = currentChunkX * chunkSize;
    const y = currentChunkY * chunkSize;
    const heroX = x + chunkSize / 2;
    const heroY = y + chunkSize / 2;

    const pulseRadius = (5 + (pulseAnim * 6) % 8) * zoomLevel;
    const pulseAlpha = Math.max(0, 1 - (pulseRadius / (14 * zoomLevel)));
    ctx.strokeStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(heroX, heroY, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Render Selected Chunk Reticle Frame
  if (selectedChunkCoord) {
    const { x: selX, y: selY } = selectedChunkCoord;
    if (selX >= visibleMinX && selX <= visibleMaxX && selY >= visibleMinY && selY <= visibleMaxY) {
      const x = selX * chunkSize;
      const y = selY * chunkSize;
      const cornerLen = Math.max(10, Math.min(22, 16 * zoomLevel));
      const pad = 2;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(1.8, 2.4 * zoomLevel);
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(x - pad, y - pad + cornerLen);
      ctx.lineTo(x - pad, y - pad);
      ctx.lineTo(x - pad + cornerLen, y - pad);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(x + chunkSize + pad - cornerLen, y - pad);
      ctx.lineTo(x + chunkSize + pad, y - pad);
      ctx.lineTo(x + chunkSize + pad, y - pad + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x - pad, y + chunkSize + pad - cornerLen);
      ctx.lineTo(x - pad, y + chunkSize + pad);
      ctx.lineTo(x - pad + cornerLen, y + chunkSize + pad);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x + chunkSize + pad - cornerLen, y + chunkSize + pad);
      ctx.lineTo(x + chunkSize + pad, y + chunkSize + pad);
      ctx.lineTo(x + chunkSize + pad, y + chunkSize + pad - cornerLen);
      ctx.stroke();

      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}
