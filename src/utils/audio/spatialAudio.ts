/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlaySoundOptions, SoundType } from './types';
import { playSound } from './soundCatalog';

export interface SpatialCalculationResult {
  audible: boolean;
  attenuation: number;
  panX: number;
  lowpassFreq: number;
  finalVol: number;
}

/**
 * Calculates spatial attenuation, stereo pan, and low-pass acoustic filtering based on source and listener coordinates.
 */
export function calculateSpatialParameters(
  vol: number,
  options?: PlaySoundOptions
): SpatialCalculationResult {
  let attenuation = 1.0;
  let panX = 0;
  let lowpassFreq = 20000;

  const maxDistance = options?.maxDistance ?? 14;
  const isIndoorEvent = !!options?.isIndoor;

  if (
    options?.x !== undefined &&
    options?.y !== undefined &&
    options?.playerX !== undefined &&
    options?.playerY !== undefined
  ) {
    const dx = options.x - options.playerX;
    const dy = options.y - options.playerY;
    const dist = Math.hypot(dx, dy);

    // Inaudible sound outside hearing range
    if (dist > maxDistance) {
      return {
        audible: false,
        attenuation: 0,
        panX: 0,
        lowpassFreq: 20000,
        finalVol: 0,
      };
    }

    attenuation = Math.pow(Math.max(0, 1 - dist / maxDistance), 1.5);
    panX = Math.max(-1, Math.min(1, dx / 8));
    lowpassFreq = 1200 + (18000 - 1200) * (1 - dist / maxDistance);

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
