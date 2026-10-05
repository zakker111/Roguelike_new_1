/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AmbientParams } from './types';
import { getAudioContext, getAmbientGainNode, getIsAudioMuted } from './synthEngine';

export interface WeatherSynthOptions {
  weather: string;
  biome: string;
  isIndoor: boolean;
  inDungeon: boolean;
  isNight: boolean;
  volumeMultiplier?: number;
}

export interface WeatherActiveNodeGroup {
  id: string;
  gainNode: GainNode;
  sources: (AudioScheduledSourceNode | AudioNode)[];
  lfoNodes?: (OscillatorNode | GainNode)[];
  filters?: BiquadFilterNode[];
}

/**
 * Procedural Pink Noise buffer generator using Paul Kellet's refined 1/f filter approximation.
 * Generates warm, organic -3dB/octave noise ideal for natural rain, waterfalls, and wind.
 */
export function createPinkNoiseBuffer(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  const bufferSize = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  return buffer;
}

/**
 * Procedural Brown Noise buffer generator using leaky integration.
 * Generates deep, rumbling -6dB/octave noise ideal for thunder, heavy wind, and subterranean rumble.
 */
export function createBrownNoiseBuffer(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  const bufferSize = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }

  return buffer;
}

/**
 * Plays a procedural distant rolling thunder strike with spatial panning.
 */
export function playProceduralThunder(
  ctx: AudioContext,
  destination: AudioNode,
  options?: { volume?: number; pan?: number; isIndoor?: boolean }
) {
  if (getIsAudioMuted()) return;

  const now = ctx.currentTime;
  const vol = Math.max(0.01, (options?.volume ?? 0.35) * (options?.isIndoor ? 0.45 : 1.0));
  const panX = options?.pan ?? (Math.random() * 1.6 - 0.8);

  try {
    const masterThunderGain = ctx.createGain();
    masterThunderGain.gain.setValueAtTime(0.0001, now);
    masterThunderGain.gain.linearRampToValueAtTime(vol, now + 0.08);
    masterThunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    // Optional stereo panner
    let targetDest: AudioNode = masterThunderGain;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(panX, now);
      masterThunderGain.connect(panner);
      panner.connect(destination);
    } else {
      masterThunderGain.connect(destination);
    }

    // 1. Initial lightning crack transient (sharp bandpass burst)
    const crackBuf = createPinkNoiseBuffer(ctx, 0.25);
    const crackSource = ctx.createBufferSource();
    crackSource.buffer = crackBuf;

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(options?.isIndoor ? 800 : 1600, now);
    crackFilter.Q.setValueAtTime(2.0, now);

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.001, now);
    crackGain.gain.linearRampToValueAtTime(vol * 0.8, now + 0.04);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(targetDest);
    crackSource.start(now);
    crackSource.stop(now + 0.25);

    // 2. Deep Sub-Bass Rumble (Swept Sine Oscillator)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 2.8);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(vol * 1.1, now + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    subOsc.connect(subGain);
    subGain.connect(targetDest);
    subOsc.start(now);
    subOsc.stop(now + 3.3);

    // 3. Rolling Reverberation Tail (Brown Noise through lowpass filter)
    const rollBuf = createBrownNoiseBuffer(ctx, 3.5);
    const rollSource = ctx.createBufferSource();
    rollSource.buffer = rollBuf;

    const rollFilter = ctx.createBiquadFilter();
    rollFilter.type = 'lowpass';
    rollFilter.frequency.setValueAtTime(options?.isIndoor ? 110 : 180, now);
    rollFilter.frequency.linearRampToValueAtTime(60, now + 3.2);

    const rollGain = ctx.createGain();
    rollGain.gain.setValueAtTime(0.001, now);
    rollGain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.2);
    rollGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

    rollSource.connect(rollFilter);
    rollFilter.connect(rollGain);
    rollGain.connect(targetDest);
    rollSource.start(now);
    rollSource.stop(now + 3.7);

    // Cleanup node after tail ends
    setTimeout(() => {
      try {
        masterThunderGain.disconnect();
      } catch (e) {
        // safe disposal
      }
    }, 4000);
  } catch (e) {
    // safe fallback
  }
}

/**
 * Creates multi-layer procedural rain soundscape:
 * - Soil/foliage patter (lowpass pink noise)
 * - Rain droplet high splashes (modulated bandpass pink noise)
 * - Roof timber resonance when player is indoors
 */
export function createRainSynthGroup(
  ctx: AudioContext,
  destination: AudioNode,
  options: WeatherSynthOptions
): WeatherActiveNodeGroup {
  const now = ctx.currentTime;
  const pinkBuf = createPinkNoiseBuffer(ctx, 4);

  const masterGroupGain = ctx.createGain();
  masterGroupGain.gain.setValueAtTime(0.0001, now);
  masterGroupGain.gain.linearRampToValueAtTime(options.volumeMultiplier ?? 1.0, now + 0.6);
  masterGroupGain.connect(destination);

  const sources: (AudioScheduledSourceNode | AudioNode)[] = [];
  const lfoNodes: (OscillatorNode | GainNode)[] = [];
  const filters: BiquadFilterNode[] = [];

  try {
    // Layer A: Soil / Terrain Ground Patter
    const groundSource = ctx.createBufferSource();
    groundSource.buffer = pinkBuf;
    groundSource.loop = true;

    const groundFilter = ctx.createBiquadFilter();
    groundFilter.type = 'lowpass';
    groundFilter.frequency.setValueAtTime(options.isIndoor ? 420 : 750, now);

    const groundGain = ctx.createGain();
    groundGain.gain.setValueAtTime(options.isIndoor ? 0.025 : 0.05, now);

    groundSource.connect(groundFilter);
    groundFilter.connect(groundGain);
    groundGain.connect(masterGroupGain);

    groundSource.start(now);
    sources.push(groundSource);
    filters.push(groundFilter);

    // Layer B: Foliage / Droplet High Splashes with gentle organic swell LFO
    const dropletSource = ctx.createBufferSource();
    dropletSource.buffer = pinkBuf;
    dropletSource.loop = true;

    const dropletFilter = ctx.createBiquadFilter();
    dropletFilter.type = 'bandpass';
    dropletFilter.frequency.setValueAtTime(options.isIndoor ? 900 : 2200, now);
    dropletFilter.Q.setValueAtTime(options.isIndoor ? 2.5 : 1.4, now);

    const dropletGain = ctx.createGain();
    dropletGain.gain.setValueAtTime(options.isIndoor ? 0.015 : 0.035, now);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.25, now); // Gentle natural rain swell rate

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.012, now);

    lfo.connect(lfoGain);
    lfoGain.connect(dropletGain.gain);

    dropletSource.connect(dropletFilter);
    dropletFilter.connect(dropletGain);
    dropletGain.connect(masterGroupGain);

    dropletSource.start(now);
    lfo.start(now);

    sources.push(dropletSource);
    lfoNodes.push(lfo, lfoGain);
    filters.push(dropletFilter);
  } catch (e) {
    // safe fallback
  }

  return {
    id: 'rain_synth',
    gainNode: masterGroupGain,
    sources,
    lfoNodes,
    filters,
  };
}

/**
 * Creates multi-layer procedural blizzard soundscape:
 * - Howling wind gusts with swept resonant bandpass filter
 * - Sub-bass freezing gale force rumble
 * - Crystalline ice particle hiss
 */
export function createBlizzardSynthGroup(
  ctx: AudioContext,
  destination: AudioNode,
  options: WeatherSynthOptions
): WeatherActiveNodeGroup {
  const now = ctx.currentTime;
  const pinkBuf = createPinkNoiseBuffer(ctx, 4);
  const brownBuf = createBrownNoiseBuffer(ctx, 4);

  const masterGroupGain = ctx.createGain();
  masterGroupGain.gain.setValueAtTime(0.0001, now);
  masterGroupGain.gain.linearRampToValueAtTime(options.volumeMultiplier ?? 1.0, now + 0.6);
  masterGroupGain.connect(destination);

  const sources: (AudioScheduledSourceNode | AudioNode)[] = [];
  const lfoNodes: (OscillatorNode | GainNode)[] = [];
  const filters: BiquadFilterNode[] = [];

  try {
    // Layer A: Swept Resonant Wind Howl (Pitch-swept bandpass filter)
    const howlSource = ctx.createBufferSource();
    howlSource.buffer = pinkBuf;
    howlSource.loop = true;

    const howlFilter = ctx.createBiquadFilter();
    howlFilter.type = 'bandpass';
    howlFilter.frequency.setValueAtTime(options.isIndoor ? 600 : 1100, now);
    howlFilter.Q.setValueAtTime(options.isIndoor ? 2.0 : 3.8, now);

    // LFO sweeping the resonant frequency between ~650Hz and ~1650Hz
    const howlLfo = ctx.createOscillator();
    howlLfo.type = 'sine';
    howlLfo.frequency.setValueAtTime(0.18, now); // Slow eerie gale cycle

    const howlLfoGain = ctx.createGain();
    howlLfoGain.gain.setValueAtTime(options.isIndoor ? 200 : 450, now);

    howlLfo.connect(howlLfoGain);
    howlLfoGain.connect(howlFilter.frequency);

    const howlGain = ctx.createGain();
    howlGain.gain.setValueAtTime(options.isIndoor ? 0.03 : 0.075, now);

    howlSource.connect(howlFilter);
    howlFilter.connect(howlGain);
    howlGain.connect(masterGroupGain);

    howlSource.start(now);
    howlLfo.start(now);

    sources.push(howlSource);
    lfoNodes.push(howlLfo, howlLfoGain);
    filters.push(howlFilter);

    // Layer B: Sub-Bass Freezing Gale Force Rumble
    const galeSource = ctx.createBufferSource();
    galeSource.buffer = brownBuf;
    galeSource.loop = true;

    const galeFilter = ctx.createBiquadFilter();
    galeFilter.type = 'lowpass';
    galeFilter.frequency.setValueAtTime(110, now);

    const galeGain = ctx.createGain();
    galeGain.gain.setValueAtTime(0.065, now);

    galeSource.connect(galeFilter);
    galeFilter.connect(galeGain);
    galeGain.connect(masterGroupGain);

    galeSource.start(now);
    sources.push(galeSource);
    filters.push(galeFilter);

    // Layer C: Crystalline Ice Particle Hiss
    if (!options.isIndoor) {
      const iceSource = ctx.createBufferSource();
      iceSource.buffer = pinkBuf;
      iceSource.loop = true;

      const iceFilter = ctx.createBiquadFilter();
      iceFilter.type = 'highpass';
      iceFilter.frequency.setValueAtTime(3800, now);

      const iceGain = ctx.createGain();
      iceGain.gain.setValueAtTime(0.015, now);

      iceSource.connect(iceFilter);
      iceFilter.connect(iceGain);
      iceGain.connect(masterGroupGain);

      iceSource.start(now);
      sources.push(iceSource);
      filters.push(iceFilter);
    }
  } catch (e) {
    // safe fallback
  }

  return {
    id: 'blizzard_synth',
    gainNode: masterGroupGain,
    sources,
    lfoNodes,
    filters,
  };
}

/**
 * Creates multi-layer procedural sandstorm soundscape:
 * - Gritty particulate swirl (dual resonant bandpass)
 * - Swept desert thermal wind
 */
export function createSandstormSynthGroup(
  ctx: AudioContext,
  destination: AudioNode,
  options: WeatherSynthOptions
): WeatherActiveNodeGroup {
  const now = ctx.currentTime;
  const pinkBuf = createPinkNoiseBuffer(ctx, 4);
  const brownBuf = createBrownNoiseBuffer(ctx, 4);

  const masterGroupGain = ctx.createGain();
  masterGroupGain.gain.setValueAtTime(0.0001, now);
  masterGroupGain.gain.linearRampToValueAtTime(options.volumeMultiplier ?? 1.0, now + 0.6);
  masterGroupGain.connect(destination);

  const sources: (AudioScheduledSourceNode | AudioNode)[] = [];
  const lfoNodes: (OscillatorNode | GainNode)[] = [];
  const filters: BiquadFilterNode[] = [];

  try {
    // Layer A: Gritty Sand Friction (Particulate Swirl)
    const gritSource = ctx.createBufferSource();
    gritSource.buffer = pinkBuf;
    gritSource.loop = true;

    const gritFilter = ctx.createBiquadFilter();
    gritFilter.type = 'bandpass';
    gritFilter.frequency.setValueAtTime(options.isIndoor ? 750 : 1550, now);
    gritFilter.Q.setValueAtTime(2.8, now);

    // Fast tremolo simulating granular sand bursts
    const tremolo = ctx.createOscillator();
    tremolo.type = 'sine';
    tremolo.frequency.setValueAtTime(1.3, now);

    const tremoloGain = ctx.createGain();
    tremoloGain.gain.setValueAtTime(0.02, now);

    const gritGain = ctx.createGain();
    gritGain.gain.setValueAtTime(options.isIndoor ? 0.025 : 0.065, now);

    tremolo.connect(tremoloGain);
    tremoloGain.connect(gritGain.gain);

    gritSource.connect(gritFilter);
    gritFilter.connect(gritGain);
    gritGain.connect(masterGroupGain);

    gritSource.start(now);
    tremolo.start(now);

    sources.push(gritSource);
    lfoNodes.push(tremolo, tremoloGain);
    filters.push(gritFilter);

    // Layer B: Desert Dune Thermal Drafts (Warm lowpass wind)
    const duneSource = ctx.createBufferSource();
    duneSource.buffer = brownBuf;
    duneSource.loop = true;

    const duneFilter = ctx.createBiquadFilter();
    duneFilter.type = 'lowpass';
    duneFilter.frequency.setValueAtTime(280, now);

    const duneGain = ctx.createGain();
    duneGain.gain.setValueAtTime(0.05, now);

    duneSource.connect(duneFilter);
    duneFilter.connect(duneGain);
    duneGain.connect(masterGroupGain);

    duneSource.start(now);
    sources.push(duneSource);
    filters.push(duneFilter);
  } catch (e) {
    // safe fallback
  }

  return {
    id: 'sandstorm_synth',
    gainNode: masterGroupGain,
    sources,
    lfoNodes,
    filters,
  };
}

/**
 * Creates multi-layer procedural snowfall soundscape:
 * - Peaceful, crisp winter hush
 * - Soft breathing bandpass breeze
 */
export function createSnowySynthGroup(
  ctx: AudioContext,
  destination: AudioNode,
  options: WeatherSynthOptions
): WeatherActiveNodeGroup {
  const now = ctx.currentTime;
  const pinkBuf = createPinkNoiseBuffer(ctx, 4);

  const masterGroupGain = ctx.createGain();
  masterGroupGain.gain.setValueAtTime(0.0001, now);
  masterGroupGain.gain.linearRampToValueAtTime(options.volumeMultiplier ?? 1.0, now + 0.6);
  masterGroupGain.connect(destination);

  const sources: (AudioScheduledSourceNode | AudioNode)[] = [];
  const lfoNodes: (OscillatorNode | GainNode)[] = [];
  const filters: BiquadFilterNode[] = [];

  try {
    const snowSource = ctx.createBufferSource();
    snowSource.buffer = pinkBuf;
    snowSource.loop = true;

    const snowFilter = ctx.createBiquadFilter();
    snowFilter.type = 'bandpass';
    snowFilter.frequency.setValueAtTime(options.isIndoor ? 550 : 980, now);
    snowFilter.Q.setValueAtTime(0.9, now);

    const snowLfo = ctx.createOscillator();
    snowLfo.type = 'sine';
    snowLfo.frequency.setValueAtTime(0.09, now); // Ultra-gentle winter respiration

    const snowLfoGain = ctx.createGain();
    snowLfoGain.gain.setValueAtTime(0.008, now);

    const snowGain = ctx.createGain();
    snowGain.gain.setValueAtTime(options.isIndoor ? 0.02 : 0.045, now);

    snowLfo.connect(snowLfoGain);
    snowLfoGain.connect(snowGain.gain);

    snowSource.connect(snowFilter);
    snowFilter.connect(snowGain);
    snowGain.connect(masterGroupGain);

    snowSource.start(now);
    snowLfo.start(now);

    sources.push(snowSource);
    lfoNodes.push(snowLfo, snowLfoGain);
    filters.push(snowFilter);
  } catch (e) {
    // safe fallback
  }

  return {
    id: 'snowy_synth',
    gainNode: masterGroupGain,
    sources,
    lfoNodes,
    filters,
  };
}

/**
 * Creates multi-layer procedural fog soundscape:
 * - Damp atmospheric silence with low subterranean presence
 * - Ethereal ambient harmonic sine drone
 */
export function createFoggySynthGroup(
  ctx: AudioContext,
  destination: AudioNode,
  options: WeatherSynthOptions
): WeatherActiveNodeGroup {
  const now = ctx.currentTime;
  const pinkBuf = createPinkNoiseBuffer(ctx, 4);

  const masterGroupGain = ctx.createGain();
  masterGroupGain.gain.setValueAtTime(0.0001, now);
  masterGroupGain.gain.linearRampToValueAtTime(options.volumeMultiplier ?? 1.0, now + 0.6);
  masterGroupGain.connect(destination);

  const sources: (AudioScheduledSourceNode | AudioNode)[] = [];
  const filters: BiquadFilterNode[] = [];

  try {
    // Layer A: Damp Lowpass Hush
    const fogSource = ctx.createBufferSource();
    fogSource.buffer = pinkBuf;
    fogSource.loop = true;

    const fogFilter = ctx.createBiquadFilter();
    fogFilter.type = 'lowpass';
    fogFilter.frequency.setValueAtTime(160, now);

    const fogGain = ctx.createGain();
    fogGain.gain.setValueAtTime(0.04, now);

    fogSource.connect(fogFilter);
    fogFilter.connect(fogGain);
    fogGain.connect(masterGroupGain);

    fogSource.start(now);
    sources.push(fogSource);
    filters.push(fogFilter);

    // Layer B: Subtle Ethereal Sine Drone (Harmonic A2 110Hz tone)
    const sineOsc = ctx.createOscillator();
    sineOsc.type = 'sine';
    sineOsc.frequency.setValueAtTime(110, now);

    const sineGain = ctx.createGain();
    sineGain.gain.setValueAtTime(0.008, now);

    sineOsc.connect(sineGain);
    sineGain.connect(masterGroupGain);

    sineOsc.start(now);
    sources.push(sineOsc);
  } catch (e) {
    // safe fallback
  }

  return {
    id: 'foggy_synth',
    gainNode: masterGroupGain,
    sources,
    filters,
  };
}

/**
 * Creates multi-layer procedural clear weather / breeze soundscape:
 * - Natural organic breeze swell
 * - Deep cavern drone if in dungeon
 */
export function createClearSynthGroup(
  ctx: AudioContext,
  destination: AudioNode,
  options: WeatherSynthOptions
): WeatherActiveNodeGroup {
  const now = ctx.currentTime;
  const pinkBuf = createPinkNoiseBuffer(ctx, 4);
  const brownBuf = createBrownNoiseBuffer(ctx, 4);

  const masterGroupGain = ctx.createGain();
  masterGroupGain.gain.setValueAtTime(0.0001, now);
  masterGroupGain.gain.linearRampToValueAtTime(options.volumeMultiplier ?? 1.0, now + 0.6);
  masterGroupGain.connect(destination);

  const sources: (AudioScheduledSourceNode | AudioNode)[] = [];
  const lfoNodes: (OscillatorNode | GainNode)[] = [];
  const filters: BiquadFilterNode[] = [];

  try {
    if (options.inDungeon) {
      // Subterranean Cavern Bass Drone
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now); // Low A1

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.035, now);

      subOsc.connect(subGain);
      subGain.connect(masterGroupGain);
      subOsc.start(now);
      sources.push(subOsc);

      // Deep earth rumble
      const rumbleSource = ctx.createBufferSource();
      rumbleSource.buffer = brownBuf;
      rumbleSource.loop = true;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(90, now);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.05, now);

      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGroupGain);

      rumbleSource.start(now);
      sources.push(rumbleSource);
      filters.push(rumbleFilter);
    } else {
      // Wilderness Organic Breeze
      const breezeSource = ctx.createBufferSource();
      breezeSource.buffer = pinkBuf;
      breezeSource.loop = true;

      const breezeFilter = ctx.createBiquadFilter();
      breezeFilter.type = 'lowpass';
      breezeFilter.frequency.setValueAtTime(options.isIndoor ? 260 : 380, now);

      const breezeLfo = ctx.createOscillator();
      breezeLfo.type = 'sine';
      breezeLfo.frequency.setValueAtTime(0.06, now); // Ultra slow natural breeze swell

      const breezeLfoGain = ctx.createGain();
      breezeLfoGain.gain.setValueAtTime(0.01, now);

      const breezeGain = ctx.createGain();
      breezeGain.gain.setValueAtTime(options.isIndoor ? 0.02 : 0.045, now);

      breezeLfo.connect(breezeLfoGain);
      breezeLfoGain.connect(breezeGain.gain);

      breezeSource.connect(breezeFilter);
      breezeFilter.connect(breezeGain);
      breezeGain.connect(masterGroupGain);

      breezeSource.start(now);
      breezeLfo.start(now);

      sources.push(breezeSource);
      lfoNodes.push(breezeLfo, breezeLfoGain);
      filters.push(breezeFilter);
    }
  } catch (e) {
    // safe fallback
  }

  return {
    id: 'clear_synth',
    gainNode: masterGroupGain,
    sources,
    lfoNodes,
    filters,
  };
}

/**
 * Coordinator singleton for managing procedural weather soundscapes,
 * cross-fading, and periodic dynamic weather events (thunderclaps, wind gusts).
 */
export class WeatherSynthEngine {
  private activeGroup: WeatherActiveNodeGroup | null = null;
  private currentKey = '';
  private thunderTimer: any = null;
  private weatherEventTimer: any = null;

  /**
   * Updates procedural weather synthesis based on ambient parameters.
   */
  public update(params: AmbientParams): void {
    const ctx = getAudioContext();
    if (!ctx || getIsAudioMuted()) {
      this.stop();
      return;
    }

    const key = `${params.weather}_${params.inDungeon ? 'dungeon' : params.biome}_${params.isIndoor ? 'indoor' : 'outdoor'}_${params.isNight ? 'night' : 'day'}`;
    if (key === this.currentKey && this.activeGroup) {
      return;
    }

    this.stop(0.4);
    this.currentKey = key;

    const ambientGainNode = getAmbientGainNode();
    if (!ambientGainNode) return;

    const opts: WeatherSynthOptions = {
      weather: params.weather,
      biome: params.biome,
      isIndoor: !!params.isIndoor,
      inDungeon: !!params.inDungeon,
      isNight: !!params.isNight,
    };

    // Instantiate procedural synth group based on weather type
    switch (params.weather) {
      case 'rainy':
        this.activeGroup = createRainSynthGroup(ctx, ambientGainNode, opts);
        this.startDynamicWeatherEvents(ctx, ambientGainNode, opts);
        break;
      case 'blizzard':
        this.activeGroup = createBlizzardSynthGroup(ctx, ambientGainNode, opts);
        this.startDynamicWeatherEvents(ctx, ambientGainNode, opts);
        break;
      case 'sandstorm':
        this.activeGroup = createSandstormSynthGroup(ctx, ambientGainNode, opts);
        this.startDynamicWeatherEvents(ctx, ambientGainNode, opts);
        break;
      case 'snowy':
        this.activeGroup = createSnowySynthGroup(ctx, ambientGainNode, opts);
        break;
      case 'foggy':
        this.activeGroup = createFoggySynthGroup(ctx, ambientGainNode, opts);
        break;
      case 'clear':
      default:
        this.activeGroup = createClearSynthGroup(ctx, ambientGainNode, opts);
        break;
    }
  }

  /**
   * Starts periodic dynamic weather events (e.g. distant thunderclaps during rainstorms).
   */
  private startDynamicWeatherEvents(ctx: AudioContext, destination: AudioNode, options: WeatherSynthOptions) {
    this.clearDynamicTimers();

    if (options.weather === 'rainy' && !options.inDungeon) {
      // Random distant rolling thunder every 22-38 seconds
      const scheduleNextThunder = () => {
        const nextDelayMs = 22000 + Math.random() * 16000;
        this.thunderTimer = setTimeout(() => {
          if (this.currentKey.startsWith('rainy')) {
            playProceduralThunder(ctx, destination, {
              isIndoor: options.isIndoor,
              volume: options.isIndoor ? 0.22 : 0.4,
            });
            scheduleNextThunder();
          }
        }, nextDelayMs);
      };
      scheduleNextThunder();
    }
  }

  private clearDynamicTimers() {
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
    if (this.weatherEventTimer) {
      clearTimeout(this.weatherEventTimer);
      this.weatherEventTimer = null;
    }
  }

  /**
   * Smoothly stops active weather synthesis node group.
   */
  public stop(fadeSec = 0.3): void {
    this.clearDynamicTimers();

    if (this.activeGroup) {
      const group = this.activeGroup;
      this.activeGroup = null;

      const ctx = getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        try {
          group.gainNode.gain.setValueAtTime(group.gainNode.gain.value, now);
          group.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeSec);

          setTimeout(() => {
            for (const src of group.sources) {
              try {
                if ('stop' in src && typeof (src as any).stop === 'function') {
                  (src as any).stop();
                }
                src.disconnect();
              } catch (e) {
                // safe disposal
              }
            }
            if (group.lfoNodes) {
              for (const lfo of group.lfoNodes) {
                try {
                  if ('stop' in lfo && typeof (lfo as any).stop === 'function') {
                    (lfo as any).stop();
                  }
                  lfo.disconnect();
                } catch (e) {
                  // safe disposal
                }
              }
            }
            group.gainNode.disconnect();
          }, Math.floor((fadeSec + 0.05) * 1000));
        } catch (e) {
          // safe disposal
        }
      }
    }
    this.currentKey = '';
  }

  public getActiveGroup(): WeatherActiveNodeGroup | null {
    return this.activeGroup;
  }
}

export const weatherSynthEngine = new WeatherSynthEngine();
