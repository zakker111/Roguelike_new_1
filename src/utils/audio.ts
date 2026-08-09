/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundType, SOUND_CATALOG } from '../data/soundCatalog';
import { SOUND_SYNTH_PRESETS } from '../audio/soundPresets';
export type { SoundType };
export { SOUND_CATALOG, SOUND_SYNTH_PRESETS };

// Master Audio Context and Master Gain Nodes
let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let sfxGainNode: GainNode | null = null;
let ambientGainNode: GainNode | null = null;
let ambientMuffleFilterNode: BiquadFilterNode | null = null;
let analyserNode: AnalyserNode | null = null;

const AUDIO_STORAGE_KEY = 'cosmic_abyss_audio_settings_v1';

let masterVolume = 1.0;
let sfxVolume = 1.0;
let ambientVolume = 0.25;
let isAudioMuted = false;

// Auto-restore saved preferences on init
try {
  if (typeof window !== 'undefined' && localStorage) {
    const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.masterVolume === 'number') masterVolume = parsed.masterVolume;
      if (typeof parsed.sfxVolume === 'number') sfxVolume = parsed.sfxVolume;
      if (typeof parsed.ambientVolume === 'number') ambientVolume = parsed.ambientVolume;
      if (typeof parsed.isAudioMuted === 'boolean') isAudioMuted = parsed.isAudioMuted;
    }
  }
} catch (e) {
  // Fallback to default
}

function saveAudioPreferences() {
  try {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
        masterVolume,
        sfxVolume,
        ambientVolume,
        isAudioMuted,
      }));
    }
  } catch (e) {
    // Ignore storage errors
  }
}

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

export function getAudioSettings() {
  return {
    masterVolume,
    sfxVolume,
    ambientVolume,
    isAudioMuted,
  };
}

export function toggleAudioMute(): boolean {
  isAudioMuted = !isAudioMuted;
  setAudioMuted(isAudioMuted);
  return isAudioMuted;
}

export function setMasterVolume(val: number) {
  masterVolume = Math.max(0, Math.min(1, val));
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.setValueAtTime(isAudioMuted ? 0 : masterVolume, audioCtx.currentTime);
  }
  saveAudioPreferences();
}

export function setSfxVolume(val: number) {
  sfxVolume = Math.max(0, Math.min(1, val));
  if (sfxGainNode && audioCtx) {
    sfxGainNode.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
  }
  saveAudioPreferences();
}

export function setAmbientVolume(val: number) {
  ambientVolume = Math.max(0, Math.min(1, val));
  if (ambientGainNode && audioCtx) {
    ambientGainNode.gain.setValueAtTime(ambientVolume, audioCtx.currentTime);
  }
  saveAudioPreferences();
}

export function setAudioMuted(muted: boolean) {
  isAudioMuted = muted;
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.setValueAtTime(isAudioMuted ? 0 : masterVolume, audioCtx.currentTime);
  }
  saveAudioPreferences();
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Set up master routing nodes
      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.setValueAtTime(isAudioMuted ? 0 : masterVolume, audioCtx.currentTime);

      // Connect master gain to AnalyserNode for oscilloscope & visualizer
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 1024;
      analyserNode.smoothingTimeConstant = 0.8;
      masterGainNode.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);

      sfxGainNode = audioCtx.createGain();
      sfxGainNode.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
      sfxGainNode.connect(masterGainNode);

      ambientMuffleFilterNode = audioCtx.createBiquadFilter();
      ambientMuffleFilterNode.type = 'lowpass';
      ambientMuffleFilterNode.frequency.setValueAtTime(20000, audioCtx.currentTime);
      ambientMuffleFilterNode.connect(masterGainNode);

      ambientGainNode = audioCtx.createGain();
      ambientGainNode.gain.setValueAtTime(ambientVolume, audioCtx.currentTime);
      ambientGainNode.connect(ambientMuffleFilterNode);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getAudioAnalyser(): AnalyserNode | null {
  getAudioContext();
  return analyserNode;
}

export function getAudioWaveformData(array: Uint8Array): void {
  const analyser = getAudioAnalyser();
  if (analyser) {
    analyser.getByteTimeDomainData(array);
  }
}

export function getAudioFrequencyData(array: Uint8Array): void {
  const analyser = getAudioAnalyser();
  if (analyser) {
    analyser.getByteFrequencyData(array);
  }
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

export function playCustomSynthesizer(params: CustomSynthParams): void {
  const ctx = getAudioContext();
  if (!ctx || isAudioMuted || !sfxGainNode) return;

  const now = ctx.currentTime;
  const attackEnd = now + Math.max(0.005, params.attack);
  const decayEnd = attackEnd + Math.max(0.005, params.decay);
  const totalDuration = decayEnd + Math.max(0.005, params.release);

  const gain = ctx.createGain();
  const peakVol = Math.max(0.001, params.volume);
  const sustainVol = Math.max(0.0001, peakVol * params.sustain);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakVol, attackEnd);
  gain.gain.linearRampToValueAtTime(sustainVol, decayEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, totalDuration);

  // Optional Biquad Filter
  let destNode: AudioNode = gain;
  if (params.filterType !== 'none') {
    const filter = ctx.createBiquadFilter();
    filter.type = params.filterType;
    filter.frequency.setValueAtTime(params.filterFreq, now);
    filter.Q.setValueAtTime(params.filterQ, now);
    gain.connect(filter);
    destNode = filter;
  }

  destNode.connect(sfxGainNode);

  if (params.type === 'noise') {
    const noiseBuf = createNoiseBuffer(ctx, totalDuration - now + 0.1);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuf;
    source.connect(gain);
    source.start(now);
    source.stop(totalDuration);
  } else {
    const osc = ctx.createOscillator();
    osc.type = params.type;
    osc.frequency.setValueAtTime(Math.max(20, params.startFreq), now);
    if (params.freqRampType === 'exponential') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, params.endFreq), totalDuration);
    } else {
      osc.frequency.linearRampToValueAtTime(Math.max(20, params.endFreq), totalDuration);
    }
    osc.connect(gain);
    osc.start(now);
    osc.stop(totalDuration);
  }
}

/**
 * Play a positional or general sound effect.
 * If x, y, playerX, and playerY are provided:
 * - Distance > maxDistance results in NO SOUND (inaudible off-screen/far event).
 * - Distance <= maxDistance scales volume with quadratic falloff and applies stereo panning.
 */
export function playSound(
  type: SoundType,
  options?: PlaySoundOptions | number
) {
  const ctx = getAudioContext();
  if (!ctx || isAudioMuted) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
    return;
  }

  let vol = 1.0;
  let pitch = 1.0;
  let x: number | undefined;
  let y: number | undefined;
  let playerX: number | undefined;
  let playerY: number | undefined;
  let maxDistance = 14;
  let isIndoorEvent = false;

  if (typeof options === 'number') {
    vol = options;
  } else if (options) {
    vol = options.volume ?? 1.0;
    pitch = options.pitch ?? 1.0;
    x = options.x;
    y = options.y;
    playerX = options.playerX;
    playerY = options.playerY;
    if (options.maxDistance) maxDistance = options.maxDistance;
    if (options.isIndoor) isIndoorEvent = true;
  }

  // --- POSITIONAL / PROXIMITY CALCULATIONS ---
  let attenuation = 1.0;
  let panX = 0;
  let lowpassFreq = 20000;

  if (x !== undefined && y !== undefined && playerX !== undefined && playerY !== undefined) {
    const dx = x - playerX;
    const dy = y - playerY;
    const dist = Math.hypot(dx, dy);

    // Strictly enforce: Player only hears what is around them!
    if (dist > maxDistance) {
      return; // Inaudible sound outside hearing range
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
  if (finalVol <= 0.001) return;

  const now = ctx.currentTime;

  // Build routing node graph for this sound
  const soundGain = ctx.createGain();
  soundGain.gain.setValueAtTime(finalVol, now);

  const filterNode = ctx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(lowpassFreq, now);

  // Connect Filter -> SoundGain -> Panner/Direct
  filterNode.connect(soundGain);

  let pannerNode: StereoPannerNode | null = null;
  if (typeof ctx.createStereoPanner === 'function') {
    pannerNode = ctx.createStereoPanner();
    pannerNode.pan.setValueAtTime(panX, now);
    soundGain.connect(pannerNode);
    pannerNode.connect(sfxGainNode || ctx.destination);
  } else {
    soundGain.connect(sfxGainNode || ctx.destination);
  }

  const destNode = filterNode;

  switch (type) {
    case 'bump':
    case 'footstep': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(55 * pitch, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }
    case 'slash': {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(330 * pitch, now);
      osc1.frequency.exponentialRampToValueAtTime(80 * pitch, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150 * pitch, now);
      osc2.frequency.exponentialRampToValueAtTime(300 * pitch, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(destNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.15);
      osc2.stop(now + 0.15);
      break;
    }
    case 'spell': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220 * pitch, now);
      osc.frequency.setValueAtTime(440 * pitch, now + 0.05);
      osc.frequency.setValueAtTime(880 * pitch, now + 0.10);
      osc.frequency.exponentialRampToValueAtTime(110 * pitch, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.25);
      break;
    }
    case 'loot': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25 * pitch, now);
      osc.frequency.setValueAtTime(659.25 * pitch, now + 0.08);
      osc.frequency.setValueAtTime(783.99 * pitch, now + 0.16);
      osc.frequency.setValueAtTime(1046.50 * pitch, now + 0.24);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.18, now + 0.08);
      gain.gain.setValueAtTime(0.15, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.40);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.42);
      break;
    }
    case 'trap': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 * pitch, now);
      osc.frequency.linearRampToValueAtTime(40 * pitch, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    }
    case 'injury':
    case 'hurt': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100 * pitch, now);
      osc.frequency.linearRampToValueAtTime(30 * pitch, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(200, now);

      osc.connect(subFilter);
      subFilter.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }
    case 'heal': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(660 * pitch, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.26);
      break;
    }
    case 'shield': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(280 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(80 * pitch, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.11);
      break;
    }
    case 'monster_growl': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65 * pitch, now);
      osc.frequency.linearRampToValueAtTime(85 * pitch, now + 0.15);
      osc.frequency.linearRampToValueAtTime(40 * pitch, now + 0.35);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.36);
      break;
    }
    case 'water_drip': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(700 * pitch, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }
    case 'owl_hoot': {
      const hoot = (delay: number, startFreq: number, endFreq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq * pitch, now + delay);
        osc.frequency.exponentialRampToValueAtTime(endFreq * pitch, now + delay + 0.28);
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28);
        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
      };
      hoot(0, 240, 190);
      hoot(0.22, 220, 170);
      break;
    }
    case 'cricket_chirp': {
      const chirp = (delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4200 * pitch, now + delay);
        osc.frequency.setValueAtTime(4600 * pitch, now + delay + 0.015);
        gain.gain.setValueAtTime(0.04, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.035);
        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + delay);
        osc.stop(now + delay + 0.04);
      };
      chirp(0);
      chirp(0.05);
      chirp(0.10);
      break;
    }
    case 'frog_croak': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110 * pitch, now);
      osc.frequency.linearRampToValueAtTime(75 * pitch, now + 0.12);
      osc.frequency.linearRampToValueAtTime(95 * pitch, now + 0.22);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.25);
      break;
    }
    case 'cave_echo': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(45 * pitch, now + 0.6);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.62);
      break;
    }
    case 'lute_pluck': {
      const freqs = [293.66, 369.99, 440.00];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f * pitch, now + i * 0.12);

        gain.gain.setValueAtTime(0.05, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.48);
      });
      break;
    }
    case 'ocean_wave': {
      try {
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(600, now + 0.4);
        filter.frequency.linearRampToValueAtTime(150, now + 0.8);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destNode);
        noise.start(now);
        noise.stop(now + 0.82);
      } catch (e) {
        // Fallback
      }
      break;
    }
    case 'fire_crackle': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(200 * pitch, now + 0.03);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.035);
      break;
    }
    case 'arrow_fly': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(200 * pitch, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }
    case 'heartbeat': {
      // Double thump pulse (lub-dub)
      const thump = (timeOffset: number, baseFreq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * pitch, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(30 * pitch, now + timeOffset + 0.08);

        gain.gain.setValueAtTime(0.35, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.1);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.11);
      };
      thump(0, 65);
      thump(0.12, 55);
      break;
    }
    case 'chest_open': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 * pitch, now);
      osc.frequency.linearRampToValueAtTime(280 * pitch, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.24);

      // Clank metal latch
      const latch = ctx.createOscillator();
      const latchGain = ctx.createGain();
      latch.type = 'square';
      latch.frequency.setValueAtTime(600 * pitch, now + 0.15);
      latch.frequency.exponentialRampToValueAtTime(150 * pitch, now + 0.22);
      latchGain.gain.setValueAtTime(0.12, now + 0.15);
      latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      latch.connect(latchGain);
      latchGain.connect(destNode);
      latch.start(now + 0.15);
      latch.stop(now + 0.24);
      break;
    }
    case 'boss_roar': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45 * pitch, now);
      osc.frequency.linearRampToValueAtTime(70 * pitch, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(30 * pitch, now + 0.7);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.75);
      break;
    }
    case 'lightning_strike': {
      try {
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noise.connect(gain);
        gain.connect(destNode);
        noise.start(now);
        noise.stop(now + 0.36);
      } catch (e) {
        // Fallback
      }
      break;
    }
    case 'critical_hit': {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * pitch, now + idx * 0.03);

        gain.gain.setValueAtTime(0.18, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.2);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.22);
      });
      break;
    }
    case 'equip': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(540 * pitch, now + 0.07);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.09);
      break;
    }
    case 'tab_click': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850 * pitch, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.035);
      break;
    }
    case 'potion_drink': {
      const gulp = (delay: number, startF: number, endF: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF * pitch, now + delay);
        osc.frequency.exponentialRampToValueAtTime(endF * pitch, now + delay + 0.08);
        gain.gain.setValueAtTime(0.08, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);
        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      };
      gulp(0, 300, 480);
      gulp(0.1, 350, 520);
      break;
    }
    case 'levelUp': {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * pitch, now + idx * 0.06);

        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
      break;
    }
    case 'defeat': {
      const notes = [440, 392, 349.23, 293.66, 220, 110];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * pitch, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.3);
      });
      break;
    }
    case 'victory': {
      const notes = [392, 392, 392, 523.25, 659.25, 783.99];
      const durations = [0.1, 0.1, 0.1, 0.2, 0.2, 0.4];
      let cumulativeTime = 0;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * pitch, now + cumulativeTime);

        gain.gain.setValueAtTime(0.2, now + cumulativeTime);
        gain.gain.exponentialRampToValueAtTime(0.01, now + cumulativeTime + durations[idx]);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(now + cumulativeTime);
        osc.stop(now + cumulativeTime + durations[idx]);
        cumulativeTime += durations[idx] + 0.02;
      });
      break;
    }
    case 'craft': {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320 * pitch, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc1.connect(gain1);
      gain1.connect(destNode);
      osc1.start(now);
      osc1.stop(now + 0.06);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(420 * pitch, now + 0.09);
      gain2.gain.setValueAtTime(0.12, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc2.connect(gain2);
      gain2.connect(destNode);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.15);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880 * pitch, now + 0.18);
      osc3.frequency.setValueAtTime(1046.50 * pitch, now + 0.25);
      gain3.gain.setValueAtTime(0.15, now + 0.18);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc3.connect(gain3);
      gain3.connect(destNode);
      osc3.start(now + 0.18);
      osc3.stop(now + 0.48);
      break;
    }
    case 'forge': {
      const clangOsc1 = ctx.createOscillator();
      const clangOsc2 = ctx.createOscillator();
      const clangGain = ctx.createGain();

      clangOsc1.type = 'sawtooth';
      clangOsc1.frequency.setValueAtTime(110 * pitch, now);
      clangOsc1.frequency.exponentialRampToValueAtTime(45 * pitch, now + 0.28);

      clangOsc2.type = 'sine';
      clangOsc2.frequency.setValueAtTime(1200 * pitch, now);
      clangOsc2.frequency.setValueAtTime(1580 * pitch, now + 0.04);

      clangGain.gain.setValueAtTime(0.28, now);
      clangGain.gain.exponentialRampToValueAtTime(0.004, now + 0.28);

      clangOsc1.connect(clangGain);
      clangOsc2.connect(clangGain);
      clangGain.connect(destNode);

      clangOsc1.start(now);
      clangOsc2.start(now);
      clangOsc1.stop(now + 0.3);
      clangOsc2.stop(now + 0.3);

      try {
        const bufferSize = ctx.sampleRate * 0.45;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3200, now + 0.04);
        noiseFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.5);
        noiseFilter.Q.setValueAtTime(1.8, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0, now);
        noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.04);
        noiseGain.gain.exponentialRampToValueAtTime(0.002, now + 0.45);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(destNode);

        noiseNode.start(now + 0.02);
        noiseNode.stop(now + 0.5);
      } catch (err) {
        // Fallback
      }
      break;
    }
    case 'mutate': {
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sawtooth';
      sweepOsc.frequency.setValueAtTime(90 * pitch, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(920 * pitch, now + 0.32);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(40, now);
      lfoGain.gain.setValueAtTime(45, now);
      lfo.connect(lfoGain);
      lfoGain.connect(sweepOsc.frequency);

      sweepGain.gain.setValueAtTime(0.14, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.004, now + 0.35);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(destNode);

      lfo.start(now);
      sweepOsc.start(now);
      lfo.stop(now + 0.35);
      sweepOsc.stop(now + 0.35);
      break;
    }
    case 'lockpick_click': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850 * pitch, now);
      osc.frequency.setValueAtTime(620 * pitch, now + 0.01);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(destNode);

      osc.start(now);
      osc.stop(now + 0.03);
      break;
    }
    case 'lockpick_snap': {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(280 * pitch, now);
      osc1.frequency.linearRampToValueAtTime(15 * pitch, now + 0.07);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(480 * pitch, now);
      osc2.frequency.linearRampToValueAtTime(25 * pitch, now + 0.05);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(destNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);
      break;
    }
    case 'unlock': {
      const oscTumbler = ctx.createOscillator();
      const gainTumbler = ctx.createGain();
      oscTumbler.type = 'sawtooth';
      oscTumbler.frequency.setValueAtTime(140 * pitch, now);
      oscTumbler.frequency.setValueAtTime(320 * pitch, now + 0.03);
      gainTumbler.gain.setValueAtTime(0.22, now);
      gainTumbler.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      oscTumbler.connect(gainTumbler);
      gainTumbler.connect(destNode);
      oscTumbler.start(now);
      oscTumbler.stop(now + 0.07);
      break;
    }
    case 'door_open': {
      // Wooden door creak & metallic latch release
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(290 * pitch, now + 0.18);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 * finalVol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.23);

      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(420 * pitch, now + 0.15);
      clickGain.gain.setValueAtTime(0.15 * finalVol, now + 0.15);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);
      click.connect(clickGain);
      clickGain.connect(destNode);
      click.start(now + 0.15);
      click.stop(now + 0.21);
      break;
    }
    case 'door_close': {
      // Heavy wood door thud + latch snap
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(110 * pitch, now);
      thud.frequency.exponentialRampToValueAtTime(35 * pitch, now + 0.12);
      thudGain.gain.setValueAtTime(0.22 * finalVol, now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      thud.connect(thudGain);
      thudGain.connect(destNode);
      thud.start(now);
      thud.stop(now + 0.15);

      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'square';
      snap.frequency.setValueAtTime(320 * pitch, now + 0.10);
      snapGain.gain.setValueAtTime(0.14 * finalVol, now + 0.10);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      snap.connect(snapGain);
      snapGain.connect(destNode);
      snap.start(now + 0.10);
      snap.stop(now + 0.15);
      break;
    }
    case 'wood_footstep': {
      // Warm indoor wooden floor step with acoustic resonance
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(75 * pitch, now + 0.07);
      gain.gain.setValueAtTime(0.14 * finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      const bpass = ctx.createBiquadFilter();
      bpass.type = 'bandpass';
      bpass.frequency.setValueAtTime(340, now);
      bpass.Q.setValueAtTime(2.0, now);

      osc.connect(bpass);
      bpass.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.09);
      break;
    }
    case 'stone_footstep': {
      // Crisp indoor stone tile footstep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(280 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(110 * pitch, now + 0.05);
      gain.gain.setValueAtTime(0.10 * finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.07);
      break;
    }
    case 'grass_step': {
      // Soft outdoor grass rustle step
      const noiseBuf = createNoiseBuffer(ctx, 0.1);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuf;
      const bfilter = ctx.createBiquadFilter();
      bfilter.type = 'bandpass';
      bfilter.frequency.setValueAtTime(1200 * pitch, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09 * finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      source.connect(bfilter);
      bfilter.connect(gain);
      gain.connect(destNode);
      source.start(now);
      source.stop(now + 0.07);
      break;
    }
    case 'wood_creak': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 * pitch, now);
      osc.frequency.linearRampToValueAtTime(180 * pitch, now + 0.25);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08 * finalVol, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.31);
      break;
    }
    case 'clock_tick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600 * pitch, now);
      gain.gain.setValueAtTime(0.06 * finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }
    case 'bird_chirp': {
      // Gentle, realistic songbird chirping with natural pitch trills
      const trillCount = 2 + Math.floor(Math.random() * 2);
      let t = now;
      const baseFreq = (2400 + Math.random() * 800) * pitch;
      for (let i = 0; i < trillCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.linearRampToValueAtTime(baseFreq + 700, t + 0.035);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 150, t + 0.075);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.09 * finalVol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

        osc.connect(gain);
        gain.connect(destNode);
        osc.start(t);
        osc.stop(t + 0.085);
        t += 0.085 + Math.random() * 0.035;
      }
      break;
    }
    case 'indoor_entry': {
      // Soft room entry chord & acoustic transition
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 * pitch, now);
      osc.frequency.linearRampToValueAtTime(240 * pitch, now + 0.25);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12 * finalVol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.31);
      break;
    }
    case 'eat': {
      const oscM1 = ctx.createOscillator();
      const gainM1 = ctx.createGain();
      oscM1.type = 'triangle';
      oscM1.frequency.setValueAtTime(250 * pitch, now);
      oscM1.frequency.linearRampToValueAtTime(80 * pitch, now + 0.06);
      gainM1.gain.setValueAtTime(0.18, now);
      gainM1.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
      oscM1.connect(gainM1);
      gainM1.connect(destNode);
      oscM1.start(now);
      oscM1.stop(now + 0.07);
      break;
    }
    case 'drink': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(440 * pitch, now + 0.08);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
    case 'deny': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150 * pitch, now);
      osc.frequency.setValueAtTime(110 * pitch, now + 0.05);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }
    case 'click':
    default: {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950 * pitch, now);
      osc.frequency.setValueAtTime(450 * pitch, now + 0.008);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(now);
      osc.stop(now + 0.018);
      break;
    }
  }
}

/**
 * Convenience wrapper for positional sound playback
 */
export function playSpatialSound(
  type: string,
  sourceX: number,
  sourceY: number,
  playerX: number,
  playerY: number,
  options?: Omit<PlaySoundOptions, 'x' | 'y' | 'playerX' | 'playerY'>
) {
  playSound(type, {
    ...options,
    x: sourceX,
    y: sourceY,
    playerX,
    playerY,
  });
}

// ==========================================
// DYNAMIC PROCEDURAL AMBIENT SOUNDSCAPE ENGINE
// ==========================================

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

interface ActiveAmbientLoop {
  source: AudioNode;
  gainNode: GainNode;
  type: string;
}

let activeAmbientLoops: ActiveAmbientLoop[] = [];
let currentSoundscapeKey = '';
let accentTimer: any = null;
let heartbeatTimer: any = null;

function createNoiseBuffer(ctx: AudioContext, durationSec = 5): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function stopAmbientSoundscape() {
  if (accentTimer) {
    clearInterval(accentTimer);
    accentTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (activeAmbientLoops.length > 0 && audioCtx) {
    const now = audioCtx.currentTime;
    for (const loop of activeAmbientLoops) {
      try {
        loop.gainNode.gain.setValueAtTime(loop.gainNode.gain.value, now);
        loop.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.3);
        setTimeout(() => {
          if ('stop' in loop.source && typeof (loop.source as any).stop === 'function') {
            (loop.source as any).stop();
          }
          loop.source.disconnect();
        }, 350);
      } catch (e) {
        // Safe disposal
      }
    }
    activeAmbientLoops = [];
  }
  currentSoundscapeKey = '';
}

/**
 * Updates the multi-layer procedural ambient soundscape based on biome, weather, dungeon state,
 * nearby hostiles, and low HP critical state.
 */
export function updateAmbientSoundscape(params: AmbientParams) {
  const ctx = getAudioContext();
  if (!ctx || isAudioMuted) return;

  const key = `${params.inDungeon ? 'dungeon_' + params.dungeonLevel : params.biome}_${params.weather}_${params.isNight ? 'night' : 'day'}_${params.isIndoor ? 'indoor' : 'outdoor'}`;

  // Check low HP condition (< 30% max HP)
  const isLowHp = params.maxHp > 0 && params.playerHp / params.maxHp <= 0.3;

  // Apply acoustic lowpass filter: muffles outdoor weather/wind when player is inside a building
  if (ambientMuffleFilterNode) {
    let targetFreq = 20000;
    if (isLowHp) {
      targetFreq = 600; // Tunnel-vision lowpass filter
    } else if (params.isIndoor) {
      targetFreq = 650; // Realistic indoor wall & roof acoustic dampening for outdoor weather/wind
    }
    ambientMuffleFilterNode.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.25);
  }

  // Manage Heartbeat pulse timer during critical HP
  if (isLowHp && !heartbeatTimer) {
    heartbeatTimer = setInterval(() => {
      playSound('heartbeat', { volume: 0.8 });
    }, 900);
  } else if (!isLowHp && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (key === currentSoundscapeKey) {
    return;
  }

  stopAmbientSoundscape();
  currentSoundscapeKey = key;

  if (!ambientGainNode) return;

  const now = ctx.currentTime;
  const noiseBuf = createNoiseBuffer(ctx, 4);

  // LAYER 1: BASE ENVIRONMENTAL WIND / DRONE
  try {
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuf;
    noiseNode.loop = true;

    const filter = ctx.createBiquadFilter();
    const layerGain = ctx.createGain();

    if (params.inDungeon) {
      // Cavernous sub-bass rumble
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      layerGain.gain.setValueAtTime(0.001, now);
      layerGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    } else if (params.biome === 'desert' || params.weather === 'sandstorm') {
      // Dry whistling wind
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(2.5, now);
      layerGain.gain.setValueAtTime(0.001, now);
      layerGain.gain.linearRampToValueAtTime(0.06, now + 0.5);
    } else if (params.biome === 'tundra' || params.weather === 'blizzard') {
      // Freezing blizzard howl
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.5, now);
      layerGain.gain.setValueAtTime(0.001, now);
      layerGain.gain.linearRampToValueAtTime(0.07, now + 0.5);
    } else if (params.biome === 'swamp') {
      // Murky swamp hum
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      layerGain.gain.setValueAtTime(0.001, now);
      layerGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    } else {
      // Forest gentle leaf rustle
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, now);
      layerGain.gain.setValueAtTime(0.001, now);
      layerGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    }

    noiseNode.connect(filter);
    filter.connect(layerGain);
    layerGain.connect(ambientGainNode);

    noiseNode.start(now);
    activeAmbientLoops.push({ source: noiseNode, gainNode: layerGain, type: 'base_wind' });
  } catch (e) {
    // Safe buffer fallback
  }

  // LAYER 2: RAIN / WEATHER OVERLAY (Organic multi-layer rain with gentle swell modulation)
  if (params.weather === 'rainy') {
    try {
      // 1. Soft low-frequency patter on soil/roofs
      const rainLow = ctx.createBufferSource();
      rainLow.buffer = noiseBuf;
      rainLow.loop = true;

      const rainLowFilter = ctx.createBiquadFilter();
      rainLowFilter.type = 'lowpass';
      rainLowFilter.frequency.setValueAtTime(800, now);

      const rainLowGain = ctx.createGain();
      rainLowGain.gain.setValueAtTime(0.001, now);
      rainLowGain.gain.linearRampToValueAtTime(0.04, now + 0.5);

      rainLow.connect(rainLowFilter);
      rainLowFilter.connect(rainLowGain);
      rainLowGain.connect(ambientGainNode);

      rainLow.start(now);
      activeAmbientLoops.push({ source: rainLow, gainNode: rainLowGain, type: 'rain_low' });

      // 2. Modulated high rain droplets swell (slow organic 0.3Hz swell)
      const rainHigh = ctx.createBufferSource();
      rainHigh.buffer = noiseBuf;
      rainHigh.loop = true;

      const rainHighFilter = ctx.createBiquadFilter();
      rainHighFilter.type = 'bandpass';
      rainHighFilter.frequency.setValueAtTime(2200, now);
      rainHighFilter.Q.setValueAtTime(1.2, now);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.3, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.012, now);

      const rainHighGain = ctx.createGain();
      rainHighGain.gain.setValueAtTime(0.02, now);

      lfo.connect(lfoGain);
      lfoGain.connect(rainHighGain.gain);

      rainHigh.connect(rainHighFilter);
      rainHighFilter.connect(rainHighGain);
      rainHighGain.connect(ambientGainNode);

      rainHigh.start(now);
      lfo.start(now);

      activeAmbientLoops.push({ source: rainHigh, gainNode: rainHighGain, type: 'rain_high' });
    } catch (e) {
      // Safe fallback
    }
  }

  // LAYER 3: COMBAT TENSION DRONE
  if (params.hostileCountNearPlayer > 0) {
    try {
      const tensionOsc = ctx.createOscillator();
      const tensionGain = ctx.createGain();

      tensionOsc.type = 'sawtooth';
      tensionOsc.frequency.setValueAtTime(55, now); // Low A1 note

      tensionGain.gain.setValueAtTime(0.001, now);
      tensionGain.gain.linearRampToValueAtTime(0.04, now + 0.4);

      tensionOsc.connect(tensionGain);
      tensionGain.connect(ambientGainNode);

      tensionOsc.start(now);
      activeAmbientLoops.push({ source: tensionOsc, gainNode: tensionGain, type: 'tension' });
    } catch (e) {
      // Safe fallback
    }
  }

  // ACCENT TIMERS: DIVERSE ATMOSPHERIC BACKGROUND SOUNDS
  accentTimer = setInterval(() => {
    if (Math.random() < 0.55) {
      const roll = Math.random();
      const opts = {
        x: params.playerX + (Math.random() * 10 - 5),
        y: params.playerY + (Math.random() * 10 - 5),
        playerX: params.playerX,
        playerY: params.playerY,
      };

      if (params.isIndoor) {
        // Realistic indoor building accent soundscapes
        if (roll < 0.40) {
          playSound('fire_crackle', { ...opts, volume: 0.09, isIndoor: true });
        } else if (roll < 0.65) {
          playSound('wood_creak', { ...opts, volume: 0.08, isIndoor: true });
        } else if (roll < 0.85) {
          playSound('lute_pluck', { ...opts, volume: 0.07, isIndoor: true });
        } else {
          playSound('clock_tick', { ...opts, volume: 0.06, isIndoor: true });
        }
      } else if (params.inDungeon) {
        if (roll < 0.6) {
          playSound('water_drip', { ...opts, volume: 0.15 });
        } else {
          playSound('cave_echo', { ...opts, volume: 0.12 });
        }
      } else if (params.biome === 'swamp') {
        if (roll < 0.6) {
          playSound('frog_croak', { ...opts, volume: 0.12 });
        } else {
          playSound('water_drip', { ...opts, volume: 0.10 });
        }
      } else if (params.isNight) {
        if (roll < 0.65) {
          playSound('cricket_chirp', { ...opts, volume: 0.12 });
        } else {
          playSound('owl_hoot', { ...opts, volume: 0.10 });
        }
      } else if (params.biome === 'forest' || params.biome === 'plains') {
        if (roll < 0.65) {
          playSound('bird_chirp', { ...opts, volume: 0.10 });
        } else {
          playSound('wood_creak', { ...opts, volume: 0.06 });
        }
      } else if (params.biome === 'desert') {
        playSound('ocean_wave', { ...opts, volume: 0.08, pitch: 1.4 }); // sand gust
      } else if (params.biome === 'ocean') {
        playSound('ocean_wave', { ...opts, volume: 0.10 });
      } else {
        playSound('lute_pluck', { ...opts, volume: 0.08 });
      }
    }
  }, 3500);
}
