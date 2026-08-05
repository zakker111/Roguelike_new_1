/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundType } from '../data/soundCatalog';

export interface SoundSynthConfig {
  oscType: OscillatorType;
  baseFreq: number;
  freqRamp?: { targetFreq: number; duration: number; type: 'linear' | 'exponential' };
  duration: number;
  initialGain: number;
}

export const SOUND_SYNTH_PRESETS: Partial<Record<SoundType, SoundSynthConfig>> = {
  bump: {
    oscType: 'triangle',
    baseFreq: 110,
    freqRamp: { targetFreq: 55, duration: 0.08, type: 'exponential' },
    duration: 0.08,
    initialGain: 0.2,
  },
  footstep: {
    oscType: 'triangle',
    baseFreq: 110,
    freqRamp: { targetFreq: 55, duration: 0.08, type: 'exponential' },
    duration: 0.08,
    initialGain: 0.2,
  },
  trap: {
    oscType: 'sawtooth',
    baseFreq: 180,
    freqRamp: { targetFreq: 40, duration: 0.12, type: 'linear' },
    duration: 0.12,
    initialGain: 0.3,
  },
  hurt: {
    oscType: 'sawtooth',
    baseFreq: 100,
    freqRamp: { targetFreq: 30, duration: 0.2, type: 'linear' },
    duration: 0.2,
    initialGain: 0.35,
  },
};
