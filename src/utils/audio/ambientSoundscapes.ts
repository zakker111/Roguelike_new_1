/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AmbientParams, ActiveAmbientLoop } from './types';
import {
  getAudioContext,
  getAmbientGainNode,
  getAmbientMuffleFilterNode,
  getIsAudioMuted,
  createNoiseBuffer,
} from './synthEngine';
import { playSound } from './soundCatalog';

let activeAmbientLoops: ActiveAmbientLoop[] = [];
let currentSoundscapeKey = '';
let accentTimer: any = null;
let heartbeatTimer: any = null;

export function stopAmbientSoundscape() {
  if (accentTimer) {
    clearInterval(accentTimer);
    accentTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  const ctx = getAudioContext();
  if (activeAmbientLoops.length > 0 && ctx) {
    const now = ctx.currentTime;
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
  if (!ctx || getIsAudioMuted()) return;

  const key = `${params.inDungeon ? 'dungeon_' + params.dungeonLevel : params.biome}_${params.weather}_${params.isNight ? 'night' : 'day'}_${params.isIndoor ? 'indoor' : 'outdoor'}`;

  // Check low HP condition (< 30% max HP)
  const isLowHp = params.maxHp > 0 && params.playerHp / params.maxHp <= 0.3;

  // Apply acoustic lowpass filter: muffles outdoor weather/wind when player is inside a building
  const ambientMuffleFilterNode = getAmbientMuffleFilterNode();
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

  const ambientGainNode = getAmbientGainNode();
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
