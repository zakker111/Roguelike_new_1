/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioSettings, CustomSynthParams, SoundPriority } from './types';
import { getVoiceManager } from './voiceManager';

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
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage) {
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
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage) {
      localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({
          masterVolume,
          sfxVolume,
          ambientVolume,
          isAudioMuted,
        })
      );
    }
  } catch (e) {
    // Ignore storage errors
  }
}

export function getAudioSettings(): AudioSettings {
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

export function getAudioContext(): AudioContext | null {
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

      // Initialize persistent voice channels
      getVoiceManager(audioCtx, sfxGainNode);

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

export function getSfxGainNode(): GainNode | null {
  return sfxGainNode;
}

export function getAmbientGainNode(): GainNode | null {
  return ambientGainNode;
}

export function getAmbientMuffleFilterNode(): BiquadFilterNode | null {
  return ambientMuffleFilterNode;
}

export function getIsAudioMuted(): boolean {
  return isAudioMuted;
}

export function createNoiseBuffer(ctx: AudioContext, durationSec = 5): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playCustomSynthesizer(params: CustomSynthParams): void {
  const ctx = getAudioContext();
  if (!ctx || isAudioMuted || !sfxGainNode) return;

  const now = ctx.currentTime;
  const attackEnd = now + Math.max(0.005, params.attack);
  const decayEnd = attackEnd + Math.max(0.005, params.decay);
  const totalDuration = decayEnd + Math.max(0.005, params.release);
  const durationSec = Math.max(0.02, totalDuration - now);

  const voiceManager = getVoiceManager(ctx, sfxGainNode);
  const channel = voiceManager.allocateVoice('custom_synth', durationSec, SoundPriority.MEDIUM, {
    volume: 1.0,
    filterType: params.filterType !== 'none' ? (params.filterType as BiquadFilterType) : 'lowpass',
    lowpassFreq: params.filterType !== 'none' ? params.filterFreq : 20000,
    filterQ: params.filterQ,
  });

  if (!channel) return;

  const gain = ctx.createGain();
  const peakVol = Math.max(0.001, params.volume);
  const sustainVol = Math.max(0.0001, peakVol * params.sustain);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakVol, attackEnd);
  gain.gain.linearRampToValueAtTime(sustainVol, decayEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, totalDuration);

  // Connect into channel's reused filter/gain/panner pipeline
  gain.connect(channel.filterNode);

  if (params.type === 'noise') {
    const noiseBuf = createNoiseBuffer(ctx, totalDuration - now + 0.1);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuf;
    source.connect(gain);
    channel.registerSource(source);
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
    channel.registerSource(osc);
    osc.start(now);
    osc.stop(totalDuration);
  }
}
