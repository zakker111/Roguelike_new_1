/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../../types/map';

export interface AcousticListenerContext {
  playerX: number;
  playerY: number;
  map: TileType[][] | null;
  isOverworld: boolean;
  depth?: number;
}

export interface AcousticOcclusionResult {
  /** Normalized acoustic obstruction factor (0.0 = open air to 1.0 = heavy stone/iron occlusion) */
  occlusionFactor: number;
  /** Number of solid wall or mountain tiles traversed along ray */
  wallCount: number;
  /** Number of closed door tiles traversed along ray */
  closedDoorCount: number;
  /** Alias for wallCount */
  wallsTraversed: number;
  /** Alias for closedDoorCount */
  doorsTraversed: number;
  /** Calculated lowpass cutoff frequency in Hz (typically 18,000Hz open air down to ~400Hz behind closed doors/walls) */
  effectiveLowpassFreq: number;
  /** Volume multiplier due to material transmission absorption (1.0 down to ~0.4) */
  volumeMultiplier: number;
  /** Resonant acoustic filter Q (shelf boost in low-mid frequencies) */
  roomResonanceQ: number;
  /** True if there is direct uninterrupted line-of-sight sound propagation */
  isDirectLineOfSight: boolean;
}

let activeListenerContext: AcousticListenerContext | null = null;

/**
 * Updates the global acoustic listener context (player position, active level map, and indoor/dungeon flags).
 * Supports either a partial context object or positional arguments (playerX, playerY, map).
 */
export function setAcousticListenerContext(
  contextOrX: Partial<AcousticListenerContext> | number,
  playerY?: number,
  map?: TileType[][] | null,
  isOverworld?: boolean,
  depth?: number
): void {
  if (typeof contextOrX === 'number') {
    activeListenerContext = {
      playerX: contextOrX,
      playerY: playerY ?? 0,
      map: map ?? null,
      isOverworld: isOverworld ?? true,
      depth: depth ?? 0,
    };
  } else {
    if (!activeListenerContext) {
      activeListenerContext = {
        playerX: contextOrX.playerX ?? 0,
        playerY: contextOrX.playerY ?? 0,
        map: contextOrX.map ?? null,
        isOverworld: contextOrX.isOverworld ?? true,
        depth: contextOrX.depth ?? 0,
      };
    } else {
      if (contextOrX.playerX !== undefined) activeListenerContext.playerX = contextOrX.playerX;
      if (contextOrX.playerY !== undefined) activeListenerContext.playerY = contextOrX.playerY;
      if (contextOrX.map !== undefined) activeListenerContext.map = contextOrX.map;
      if (contextOrX.isOverworld !== undefined) activeListenerContext.isOverworld = contextOrX.isOverworld;
      if (contextOrX.depth !== undefined) activeListenerContext.depth = contextOrX.depth;
    }
  }
}

/**
 * Resets the active acoustic listener context.
 */
export function resetAcousticListenerContext(): void {
  activeListenerContext = null;
}

/**
 * Retrieves the current active acoustic listener context.
 */
export function getAcousticListenerContext(): AcousticListenerContext | null {
  return activeListenerContext;
}

/**
 * Raycasts an acoustic transmission ray between a sound emitter (sourceX, sourceY)
 * and a listener (listenerX, listenerY) across the tile map.
 * 
 * Accurately models acoustic transmission loss through:
 * - Closed wooden/iron doors (classic heavy lowpass muffling at ~500-750 Hz)
 * - Solid stone/dungeon walls (deep bass thud at ~350-450 Hz)
 * - Open doors / corridors (zero transmission loss, crisp high fidelity)
 */
export function calculateAcousticOcclusion(
  sourceX: number,
  sourceY: number,
  listenerX?: number,
  listenerY?: number,
  mapOverride?: TileType[][] | null
): AcousticOcclusionResult {
  const lx = listenerX ?? activeListenerContext?.playerX ?? 0;
  const ly = listenerY ?? activeListenerContext?.playerY ?? 0;
  const map = mapOverride ?? activeListenerContext?.map;

  const dx = sourceX - lx;
  const dy = sourceY - ly;
  const distance = Math.hypot(dx, dy);

  // If source and listener are on the exact same tile, or no map is available
  if (distance < 0.5 || !map || map.length === 0) {
    return {
      occlusionFactor: 0,
      wallCount: 0,
      closedDoorCount: 0,
      wallsTraversed: 0,
      doorsTraversed: 0,
      effectiveLowpassFreq: 20000,
      volumeMultiplier: 1.0,
      roomResonanceQ: 0.7,
      isDirectLineOfSight: true,
    };
  }

  // Bresenham line raycasting to count acoustic obstacles
  let wallCount = 0;
  let closedDoorCount = 0;

  const x0 = Math.round(sourceX);
  const y0 = Math.round(sourceY);
  const x1 = Math.round(lx);
  const y1 = Math.round(ly);

  const stepX = x0 < x1 ? 1 : -1;
  const stepY = y0 < y1 ? 1 : -1;
  const deltaX = Math.abs(x1 - x0);
  const deltaY = Math.abs(y1 - y0);

  let err = deltaX - deltaY;
  let curX = x0;
  let curY = y0;

  // Traverse ray from source to listener
  while (curX !== x1 || curY !== y1) {
    // Skip checking the source start tile and target listener tile
    if ((curX !== x0 || curY !== y0) && (curX !== x1 || curY !== y1)) {
      const tile = map[curY]?.[curX];
      if (tile !== undefined) {
        if (tile === TileType.Wall || tile === TileType.WatchtowerWall || (tile as any) === 'Wall' || (tile as any) === 'Mountain') {
          wallCount++;
        } else if (tile === TileType.Door || (tile as any) === 'Door' || (tile as any) === 'ClosedDoor') {
          closedDoorCount++;
        }
      }
    }

    const e2 = 2 * err;
    if (e2 > -deltaY) {
      err -= deltaY;
      curX += stepX;
    }
    if (e2 < deltaX) {
      err += deltaX;
      curY += stepY;
    }
  }

  const isDirectLineOfSight = wallCount === 0 && closedDoorCount === 0;

  // Calculate cumulative acoustic occlusion
  // Each closed door adds 0.35 occlusion; each wall adds 0.45 occlusion
  const rawOcclusion = closedDoorCount * 0.35 + wallCount * 0.45;
  const occlusionFactor = Math.min(1.0, rawOcclusion);

  // Base frequency decay over straight-line distance
  const maxDistance = 14;
  const distRatio = Math.min(1.0, distance / maxDistance);
  const baseFreq = 1400 + (18000 - 1400) * (1 - distRatio);

  let effectiveLowpassFreq = baseFreq;
  let volumeMultiplier = 1.0;
  let roomResonanceQ = 0.7;

  if (!isDirectLineOfSight) {
    // Acoustic lowpass frequency dampening
    // Closed doors reduce high frequencies dramatically down to ~600-750 Hz
    // Solid walls reduce down to ~380-480 Hz
    const dampeningExponent = closedDoorCount * 1.6 + wallCount * 2.2;
    const mufflingRatio = Math.max(0.02, Math.exp(-0.85 * dampeningExponent));
    
    effectiveLowpassFreq = Math.min(
      closedDoorCount > 0 && wallCount === 0 ? 750 : 480,
      Math.max(360, baseFreq * mufflingRatio)
    );

    // Acoustic transmission absorption reduces sound volume through walls
    volumeMultiplier = Math.max(0.38, 1.0 - (closedDoorCount * 0.22 + wallCount * 0.32));

    // Low-frequency hollow room resonance when sound thuds through closed dungeon doors
    roomResonanceQ = Math.min(2.4, 0.7 + closedDoorCount * 0.5 + wallCount * 0.7);
  }

  return {
    occlusionFactor,
    wallCount,
    closedDoorCount,
    wallsTraversed: wallCount,
    doorsTraversed: closedDoorCount,
    effectiveLowpassFreq: Math.round(effectiveLowpassFreq),
    volumeMultiplier: Number(volumeMultiplier.toFixed(3)),
    roomResonanceQ: Number(roomResonanceQ.toFixed(2)),
    isDirectLineOfSight,
  };
}
