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
  priority?: number;
  map?: any;
  occlusion?: number;
  roomResonanceQ?: number;
}

export enum SoundPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export interface VoiceAllocationOptions {
  volume?: number;
  panX?: number;
  lowpassFreq?: number;
  filterType?: BiquadFilterType;
  filterQ?: number;
  priority?: SoundPriority | number;
}

export interface VoiceChannel {
  id: number;
  filterNode: BiquadFilterNode;
  gainNode: GainNode;
  pannerNode: StereoPannerNode | null;
  isActive: boolean;
  currentSound: string;
  currentPriority: number;
  startTime: number;
  endTime: number;
  sourceNodes: (AudioScheduledSourceNode | AudioNode)[];
  timerId: any;
  registerSource: (node: AudioScheduledSourceNode | AudioNode) => void;
  release: () => void;
  steal: () => void;
}

export interface VoiceManagerStats {
  maxVoices: number;
  activeVoices: number;
  totalAllocations: number;
  voiceThefts: number;
  throttledCount: number;
  activeChannelSounds: string[];
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
