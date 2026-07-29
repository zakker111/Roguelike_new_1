/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard cross-browser support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSound(type: 'bump' | 'slash' | 'spell' | 'loot' | 'trap' | 'levelUp' | 'injury' | 'defeat' | 'victory' | 'craft' | 'forge' | 'mutate' | 'lockpick_click' | 'lockpick_snap' | 'unlock' | 'eat' | 'drink' | 'click' | (string & {})) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
    return;
  }

  const now = ctx.currentTime;

  switch (type) {
    case 'bump': {
      // Short low clicky square wave for walking
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }
    case 'slash': {
      // Noise-like slash or metallic strike
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(330, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.exponentialRampToValueAtTime(300, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.15);
      osc2.stop(now + 0.15);
      break;
    }
    case 'spell': {
      // Arpeggio / sine magic surge
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(440, now + 0.05);
      osc.frequency.setValueAtTime(880, now + 0.10);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      break;
    }
    case 'loot': {
      // Joyous chimes
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.18, now + 0.08);
      gain.gain.setValueAtTime(0.15, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.40);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
      break;
    }
    case 'trap': {
      // Low metallic snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    }
    case 'injury': {
      // Dull growling pain sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }
    case 'levelUp': {
      // Triumphant ascending scale
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
      break;
    }
    case 'defeat': {
      // Sorrowful cascading descending scale
      const notes = [440, 392, 349.23, 293.66, 220, 110];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.3);
      });
      break;
    }
    case 'victory': {
      // Fanfare
      const notes = [392, 392, 392, 523.25, 659.25, 783.99];
      const durations = [0.1, 0.1, 0.1, 0.2, 0.2, 0.4];
      let cumulativeTime = 0;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + cumulativeTime);

        gain.gain.setValueAtTime(0.2, now + cumulativeTime);
        gain.gain.exponentialRampToValueAtTime(0.01, now + cumulativeTime + durations[idx]);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + cumulativeTime);
        osc.stop(now + cumulativeTime + durations[idx]);
        cumulativeTime += durations[idx] + 0.02;
      });
      break;
    }
    case 'craft': {
      // A light rhythmic crafting tap-tap-chime (wooden/light metal tools assembling an item)
      // First light tap
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.06);

      // Second light tap slightly offset
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(420, now + 0.09);
      gain2.gain.setValueAtTime(0.12, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.15);

      // Light metal click/success ring
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880, now + 0.18); // A5
      osc3.frequency.setValueAtTime(1046.50, now + 0.25); // C6
      gain3.gain.setValueAtTime(0.15, now + 0.18);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.18);
      osc3.stop(now + 0.48);
      break;
    }
    case 'forge': {
      // Powerful hammer strikes (deep bell clang + hot steel water quench hiss)
      // Deep heavy metallic ring 1
      const clangOsc1 = ctx.createOscillator();
      const clangOsc2 = ctx.createOscillator();
      const clangGain = ctx.createGain();

      clangOsc1.type = 'sawtooth';
      clangOsc1.frequency.setValueAtTime(110, now); // heavy resonance
      clangOsc1.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      clangOsc2.type = 'sine';
      clangOsc2.frequency.setValueAtTime(1200, now); // high hammer strike pitch
      clangOsc2.frequency.setValueAtTime(1580, now + 0.04);

      clangGain.gain.setValueAtTime(0.28, now);
      clangGain.gain.exponentialRampToValueAtTime(0.004, now + 0.28);

      clangOsc1.connect(clangGain);
      clangOsc2.connect(clangGain);
      clangGain.connect(ctx.destination);

      clangOsc1.start(now);
      clangOsc2.start(now);
      clangOsc1.stop(now + 0.3);
      clangOsc2.stop(now + 0.3);

      // Authentic white-noise water immersion hiss
      try {
        const bufferSize = ctx.sampleRate * 0.45; // 0.45s quench
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
        noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.04); // quick burst
        noiseGain.gain.exponentialRampToValueAtTime(0.002, now + 0.45);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseNode.start(now + 0.02);
        noiseNode.stop(now + 0.5);
      } catch (err) {
        // Safe synth fallback for steam hiss
        const fallbackOsc = ctx.createOscillator();
        const fallbackGain = ctx.createGain();
        fallbackOsc.type = 'sawtooth';
        fallbackOsc.frequency.setValueAtTime(2200, now + 0.04);
        fallbackOsc.frequency.exponentialRampToValueAtTime(700, now + 0.45);
        fallbackGain.gain.setValueAtTime(0.08, now + 0.04);
        fallbackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        fallbackOsc.connect(fallbackGain);
        fallbackGain.connect(ctx.destination);
        fallbackOsc.start(now + 0.04);
        fallbackOsc.stop(now + 0.48);
      }
      break;
    }
    case 'mutate': {
      // Unstable chaotic realignment (swelling frequency sweep + rapid LFO phase modulation + glittering cosmic chime)
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sawtooth';
      sweepOsc.frequency.setValueAtTime(90, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(920, now + 0.32);

      // Fast LFO to create vibrating, unstable, warped feedback
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(40, now); // 40Hz
      lfoGain.gain.setValueAtTime(45, now);
      lfo.connect(lfoGain);
      lfoGain.connect(sweepOsc.frequency);

      sweepGain.gain.setValueAtTime(0.14, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.004, now + 0.35);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);

      lfo.start(now);
      sweepOsc.start(now);
      lfo.stop(now + 0.35);
      sweepOsc.stop(now + 0.35);

      // Sparkling crystalline cascade
      const spark1 = ctx.createOscillator();
      const spark2 = ctx.createOscillator();
      const sparkGain = ctx.createGain();

      spark1.type = 'sine';
      spark1.frequency.setValueAtTime(1320, now + 0.25);
      spark2.type = 'triangle';
      spark2.frequency.setValueAtTime(1660, now + 0.25);

      sparkGain.gain.setValueAtTime(0.0, now);
      sparkGain.gain.setValueAtTime(0.16, now + 0.25);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      spark1.connect(sparkGain);
      spark2.connect(sparkGain);
      sparkGain.connect(ctx.destination);

      spark1.start(now + 0.25);
      spark2.start(now + 0.25);
      spark1.stop(now + 0.62);
      spark2.stop(now + 0.62);
      break;
    }
    case 'lockpick_click': {
      // Delicate spring-loaded tumbler click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.setValueAtTime(620, now + 0.01);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(450, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
      break;
    }
    case 'lockpick_snap': {
      // High-pitched tension break snap
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(280, now);
      osc1.frequency.linearRampToValueAtTime(15, now + 0.07);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(480, now);
      osc2.frequency.linearRampToValueAtTime(25, now + 0.05);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);
      break;
    }
    case 'unlock': {
      // Heavy double tumbler slide and metal bolt release
      const oscTumbler = ctx.createOscillator();
      const gainTumbler = ctx.createGain();
      oscTumbler.type = 'sawtooth';
      oscTumbler.frequency.setValueAtTime(140, now);
      oscTumbler.frequency.setValueAtTime(320, now + 0.03);
      gainTumbler.gain.setValueAtTime(0.22, now);
      gainTumbler.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      oscTumbler.connect(gainTumbler);
      gainTumbler.connect(ctx.destination);
      oscTumbler.start(now);
      oscTumbler.stop(now + 0.07);

      const oscLatch = ctx.createOscillator();
      const gainLatch = ctx.createGain();
      oscLatch.type = 'triangle';
      oscLatch.frequency.setValueAtTime(200, now + 0.1);
      oscLatch.frequency.linearRampToValueAtTime(360, now + 0.25);
      gainLatch.gain.setValueAtTime(0.0, now);
      gainLatch.gain.setValueAtTime(0.14, now + 0.1);
      gainLatch.gain.exponentialRampToValueAtTime(0.002, now + 0.3);
      oscLatch.connect(gainLatch);
      gainLatch.connect(ctx.destination);
      oscLatch.start(now + 0.1);
      oscLatch.stop(now + 0.31);
      break;
    }
    case 'eat': {
      // Rhythmic munch-munch-swallow sound
      // Munch 1 (crunch)
      const oscM1 = ctx.createOscillator();
      const gainM1 = ctx.createGain();
      oscM1.type = 'triangle';
      oscM1.frequency.setValueAtTime(250, now);
      oscM1.frequency.linearRampToValueAtTime(80, now + 0.06);
      gainM1.gain.setValueAtTime(0.18, now);
      gainM1.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
      oscM1.connect(gainM1);
      gainM1.connect(ctx.destination);
      oscM1.start(now);
      oscM1.stop(now + 0.07);

      // Munch 2 (crunch)
      const oscM2 = ctx.createOscillator();
      const gainM2 = ctx.createGain();
      oscM2.type = 'triangle';
      oscM2.frequency.setValueAtTime(220, now + 0.12);
      oscM2.frequency.linearRampToValueAtTime(70, now + 0.18);
      gainM2.gain.setValueAtTime(0.18, now + 0.12);
      gainM2.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      oscM2.connect(gainM2);
      gainM2.connect(ctx.destination);
      oscM2.start(now + 0.12);
      oscM2.stop(now + 0.19);

      // Swallow gulp
      const oscS = ctx.createOscillator();
      const gainS = ctx.createGain();
      oscS.type = 'sine';
      oscS.frequency.setValueAtTime(140, now + 0.24);
      oscS.frequency.exponentialRampToValueAtTime(280, now + 0.36);
      gainS.gain.setValueAtTime(0.0, now + 0.24);
      gainS.gain.linearRampToValueAtTime(0.15, now + 0.28);
      gainS.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      oscS.connect(gainS);
      gainS.connect(ctx.destination);
      oscS.start(now + 0.24);
      oscS.stop(now + 0.37);
      break;
    }
    case 'drink': {
      // Two wet swallows
      const swallow = (timeOffset: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(440, now + timeOffset + 0.08);
        gain.gain.setValueAtTime(0.0, now + timeOffset);
        gain.gain.linearRampToValueAtTime(0.16, now + timeOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.1);
      };
      swallow(0);
      swallow(0.15);
      break;
    }
    case 'click': {
      // Extremely quick and high-fidelity tactile button click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(450, now + 0.008);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.018);
      break;
    }
  }
}
