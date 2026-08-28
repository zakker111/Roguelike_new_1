/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundType, SOUND_CATALOG } from '../../data/soundCatalog';
import { SOUND_SYNTH_PRESETS } from '../../audio/soundPresets';
import { PlaySoundOptions } from './types';
import {
  getAudioContext,
  getSfxGainNode,
  getIsAudioMuted,
  createNoiseBuffer,
} from './synthEngine';

export { SOUND_CATALOG, SOUND_SYNTH_PRESETS };

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
  if (!ctx || getIsAudioMuted()) return;

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
  const sfxGainNode = getSfxGainNode();

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
        // 1. Initial Sharp Electrical Crackle (Highpass Noise Snap)
        const snapSize = ctx.sampleRate * 0.18;
        const snapBuffer = ctx.createBuffer(1, snapSize, ctx.sampleRate);
        const snapData = snapBuffer.getChannelData(0);
        for (let i = 0; i < snapSize; i++) {
          snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snapSize * 0.25));
        }
        const snapSource = ctx.createBufferSource();
        snapSource.buffer = snapBuffer;

        const snapFilter = ctx.createBiquadFilter();
        snapFilter.type = 'highpass';
        snapFilter.frequency.setValueAtTime(1400, now);

        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.45 * vol, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        snapSource.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(destNode);
        snapSource.start(now);

        // 2. Heavy Sub-Bass Thunder Boom (Pitch Swept Sawtooth)
        const boomOsc = ctx.createOscillator();
        const boomFilter = ctx.createBiquadFilter();
        const boomGain = ctx.createGain();

        boomOsc.type = 'sawtooth';
        boomOsc.frequency.setValueAtTime(160 * pitch, now);
        boomOsc.frequency.exponentialRampToValueAtTime(32 * pitch, now + 0.85);

        boomFilter.type = 'lowpass';
        boomFilter.frequency.setValueAtTime(450, now);
        boomFilter.frequency.exponentialRampToValueAtTime(80, now + 0.85);

        boomGain.gain.setValueAtTime(0.55 * vol, now + 0.02);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        boomOsc.connect(boomFilter);
        boomFilter.connect(boomGain);
        boomGain.connect(destNode);
        boomOsc.start(now + 0.01);
        boomOsc.stop(now + 0.96);

        // 3. Distant Rolling Thunder Echoes
        const rollSize = ctx.sampleRate * 1.2;
        const rollBuffer = ctx.createBuffer(1, rollSize, ctx.sampleRate);
        const rollData = rollBuffer.getChannelData(0);
        for (let i = 0; i < rollSize; i++) {
          rollData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rollSize, 2);
        }
        const rollSource = ctx.createBufferSource();
        rollSource.buffer = rollBuffer;

        const rollFilter = ctx.createBiquadFilter();
        rollFilter.type = 'lowpass';
        rollFilter.frequency.setValueAtTime(220, now + 0.1);

        const rollGain = ctx.createGain();
        rollGain.gain.setValueAtTime(0.001, now);
        rollGain.gain.linearRampToValueAtTime(0.28 * vol, now + 0.15);
        rollGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        rollSource.connect(rollFilter);
        rollFilter.connect(rollGain);
        rollGain.connect(destNode);
        rollSource.start(now + 0.05);
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
