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
} from './synthEngine';
import { playSound } from './soundCatalog';
import { weatherSynthEngine } from './weatherSynthEngine';

let activeAmbientLoops: ActiveAmbientLoop[] = [];
let currentSoundscapeKey = '';
let accentTimer: any = null;
let heartbeatTimer: any = null;

export function stopAmbientSoundscape() {
  weatherSynthEngine.stop();

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

  // Delegate procedural multi-layer weather and environmental wind/precipitation to weatherSynthEngine
  weatherSynthEngine.update(params);

  const ambientGainNode = getAmbientGainNode();
  if (!ambientGainNode) return;

  const now = ctx.currentTime;

  // LAYER: COMBAT TENSION DRONE
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
