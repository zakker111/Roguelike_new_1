/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundType } from '../../data/soundCatalog';
import { SoundSynthConfig } from '../../audio/soundPresets';

export type { SoundType, SoundSynthConfig };

export interface PlaySoundOptions {
  x?: number;
  y?: number;
  playerX?: number;
  playerY?: number;
  maxDistance?: number;
  volume?: number;
  pitch?: number;
  isIndoor?: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  isAudioMuted: boolean;
}

export interface CustomSynthParams {
  type: OscillatorType | 'noise';
  startFreq: number;
  endFreq: number;
  freqRampType: 'linear' | 'exponential';
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number;
  filterType: 'none' | 'lowpass' | 'highpass' | 'bandpass';
  filterFreq: number;
  filterQ: number;
}

export interface AmbientParams {
  biome: string;
  weather: string;
  inDungeon: boolean;
  dungeonLevel?: number;
  isNight?: boolean;
  isIndoor?: boolean;
  hostileCountNearPlayer: number;
  playerHp: number;
  maxHp: number;
  playerX: number;
  playerY: number;
}

export interface ActiveAmbientLoop {
  source: AudioNode;
  gainNode: GainNode;
  type: string;
}
