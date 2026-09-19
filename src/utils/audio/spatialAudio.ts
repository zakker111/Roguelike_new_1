/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlaySoundOptions, SoundType } from './types';
import { playSound } from './soundCatalog';
import { calculateAcousticOcclusion, getAcousticListenerContext } from './acousticOcclusion';

export interface SpatialCalculationResult {
  audible: boolean;
  attenuation: number;
  panX: number;
  lowpassFreq: number;
  finalVol: number;
  occlusionFactor?: number;
  roomResonanceQ?: number;
}

/**
 * Calculates spatial attenuation, stereo pan, and ray-traced acoustic occlusion filtering
 * based on sound source, listener coordinates, and intermediate dungeon doors/walls.
 */
export function calculateSpatialParameters(
  vol: number,
  options?: PlaySoundOptions
): SpatialCalculationResult {
  let attenuation = 1.0;
  let panX = 0;
  let lowpassFreq = 20000;
  let roomResonanceQ = 0.7;
  let occlusionFactor = 0;

  const maxDistance = options?.maxDistance ?? 14;
  const isIndoorEvent = !!options?.isIndoor;

  const listenerCtx = getAcousticListenerContext();
  const playerX = options?.playerX ?? listenerCtx?.playerX;
  const playerY = options?.playerY ?? listenerCtx?.playerY;
  const map = options?.map ?? listenerCtx?.map;

  if (
    options?.x !== undefined &&
    options?.y !== undefined &&
    playerX !== undefined &&
    playerY !== undefined
  ) {
    const dx = options.x - playerX;
    const dy = options.y - playerY;
    const dist = Math.hypot(dx, dy);

    // Inaudible sound outside hearing range
    if (dist > maxDistance) {
      return {
        audible: false,
        attenuation: 0,
        panX: 0,
        lowpassFreq: 20000,
        finalVol: 0,
        occlusionFactor: 1.0,
        roomResonanceQ: 0.7,
      };
    }

    attenuation = Math.pow(Math.max(0, 1 - dist / maxDistance), 1.5);
    panX = Math.max(-1, Math.min(1, dx / 8));
    lowpassFreq = 1200 + (18000 - 1200) * (1 - dist / maxDistance);

    // --- RAYTRACED ACOUSTIC OCCLUSION (Behind-Door / Behind-Wall Muffling) ---
    if (map) {
      const occlusionRes = calculateAcousticOcclusion(
        options.x,
        options.y,
        playerX,
        playerY,
        map
      );
      occlusionFactor = occlusionRes.occlusionFactor;
      lowpassFreq = Math.min(lowpassFreq, occlusionRes.effectiveLowpassFreq);
      attenuation *= occlusionRes.volumeMultiplier;
      roomResonanceQ = occlusionRes.roomResonanceQ;
    } else if (options.occlusion !== undefined) {
      occlusionFactor = Math.min(1, Math.max(0, options.occlusion));
      lowpassFreq = Math.min(lowpassFreq, 18000 * Math.exp(-2.2 * occlusionFactor));
      attenuation *= Math.max(0.4, 1 - occlusionFactor * 0.5);
    }

    // Acoustic dampening through building walls
    if (isIndoorEvent) {
      lowpassFreq = Math.min(lowpassFreq, 750);
      attenuation *= 0.75;
    }
  } else if (isIndoorEvent) {
    lowpassFreq = Math.min(lowpassFreq, 950);
  }

  const finalVol = vol * attenuation;

  return {
    audible: finalVol > 0.001,
    attenuation,
    panX,
    lowpassFreq,
    finalVol,
    occlusionFactor,
    roomResonanceQ,
  };
}

/**
 * Convenience wrapper for positional sound playback
 */
export function playSpatialSound(
  type: SoundType | string,
  sourceX: number,
  sourceY: number,
  playerX: number,
  playerY: number,
  options?: Omit<PlaySoundOptions, 'x' | 'y' | 'playerX' | 'playerY'>
) {
  playSound(type as SoundType, {
    ...options,
    x: sourceX,
    y: sourceY,
    playerX,
    playerY,
  });
}
