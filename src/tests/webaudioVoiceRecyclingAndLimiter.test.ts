/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VoiceAllocationManager,
  MAX_VOICES,
  getSoundPriority,
  getSoundDuration,
  getVoiceManager,
} from '../utils/audio/voiceManager';
import { SoundPriority } from '../utils/audio/types';
import { playSound } from '../utils/audio/soundCatalog';
import { playCustomSynthesizer } from '../utils/audio/synthEngine';

// Mock WebAudio infrastructure for unit tests
class MockAudioParam {
  value: number;
  constructor(initial = 0) {
    this.value = initial;
  }
  setValueAtTime(val: number, _time: number) {
    this.value = val;
  }
  linearRampToValueAtTime(val: number, _time: number) {
    this.value = val;
  }
  exponentialRampToValueAtTime(val: number, _time: number) {
    this.value = val;
  }
  cancelScheduledValues(_time: number) {}
}

class MockAudioNode {
  connectedTo: MockAudioNode[] = [];
  connect(dest: MockAudioNode) {
    this.connectedTo.push(dest);
    return dest;
  }
  disconnect() {
    this.connectedTo = [];
  }
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam(1.0);
}

class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new MockAudioParam(20000);
  Q = new MockAudioParam(1);
}

class MockStereoPannerNode extends MockAudioNode {
  pan = new MockAudioParam(0);
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine';
  frequency = new MockAudioParam(440);
  isStarted = false;
  isStopped = false;
  start(_time?: number) {
    this.isStarted = true;
  }
  stop(_time?: number) {
    this.isStopped = true;
  }
}

class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state = 'running';
  destination = new MockAudioNode();

  createGain() {
    return new MockGainNode() as unknown as GainNode;
  }
  createBiquadFilter() {
    return new MockBiquadFilterNode() as unknown as BiquadFilterNode;
  }
  createStereoPanner() {
    return new MockStereoPannerNode() as unknown as StereoPannerNode;
  }
  createOscillator() {
    return new MockOscillatorNode() as unknown as OscillatorNode;
  }
  createBuffer(channels: number, length: number, rate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate: rate,
      getChannelData: () => new Float32Array(length),
    } as unknown as AudioBuffer;
  }
  createBufferSource() {
    const src = new MockOscillatorNode();
    return src as unknown as AudioBufferSourceNode;
  }
}

describe('Phase 4: WebAudio Node Recycling & Synthesizer Concurrency Limiter', () => {
  let mockCtx: MockAudioContext;
  let mockSfxGain: GainNode;
  let manager: VoiceAllocationManager;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    mockSfxGain = mockCtx.createGain();
    manager = new VoiceAllocationManager(MAX_VOICES);
    manager.init(mockCtx as unknown as AudioContext, mockSfxGain);
  });

  describe('Sound Priority and Duration Classification', () => {
    it('assigns CRITICAL priority to life-or-death and milestone cues', () => {
      expect(getSoundPriority('defeat')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('victory')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('levelUp')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('boss_roar')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('critical_hit')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('injury')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('hurt')).toBe(SoundPriority.CRITICAL);
      expect(getSoundPriority('heartbeat')).toBe(SoundPriority.CRITICAL);
    });

    it('assigns HIGH priority to combat attacks, spells, and traps', () => {
      expect(getSoundPriority('slash')).toBe(SoundPriority.HIGH);
      expect(getSoundPriority('spell')).toBe(SoundPriority.HIGH);
      expect(getSoundPriority('lightning_strike')).toBe(SoundPriority.HIGH);
      expect(getSoundPriority('trap')).toBe(SoundPriority.HIGH);
      expect(getSoundPriority('shield')).toBe(SoundPriority.HIGH);
      expect(getSoundPriority('arrow_fly')).toBe(SoundPriority.HIGH);
    });

    it('assigns MEDIUM priority to loot, crafting, and interaction sounds', () => {
      expect(getSoundPriority('loot')).toBe(SoundPriority.MEDIUM);
      expect(getSoundPriority('craft')).toBe(SoundPriority.MEDIUM);
      expect(getSoundPriority('forge')).toBe(SoundPriority.MEDIUM);
      expect(getSoundPriority('door_open')).toBe(SoundPriority.MEDIUM);
      expect(getSoundPriority('chest_open')).toBe(SoundPriority.MEDIUM);
    });

    it('assigns LOW priority to footsteps and subtle ambient sounds', () => {
      expect(getSoundPriority('footstep')).toBe(SoundPriority.LOW);
      expect(getSoundPriority('bump')).toBe(SoundPriority.LOW);
      expect(getSoundPriority('click')).toBe(SoundPriority.LOW);
      expect(getSoundPriority('water_drip')).toBe(SoundPriority.LOW);
      expect(getSoundPriority('bird_chirp')).toBe(SoundPriority.LOW);
    });

    it('provides accurate estimated durations for catalog sounds', () => {
      expect(getSoundDuration('click')).toBe(0.03);
      expect(getSoundDuration('footstep')).toBe(0.1);
      expect(getSoundDuration('slash')).toBe(0.18);
      expect(getSoundDuration('spell')).toBe(0.28);
      expect(getSoundDuration('victory')).toBe(1.2);
      expect(getSoundDuration('unknown_sound')).toBe(0.35); // fallback default
    });
  });

  describe('Voice Allocation & Concurrency Limiting (Max 8 Voices)', () => {
    it('allocates voice channels up to MAX_VOICES cap', () => {
      const allocatedChannels = [];

      for (let i = 0; i < MAX_VOICES; i++) {
        const ch = manager.allocateVoice(`sound_${i}`, 0.5, SoundPriority.MEDIUM);
        expect(ch).not.toBeNull();
        allocatedChannels.push(ch);
      }

      const stats = manager.getStats();
      expect(stats.activeVoices).toBe(MAX_VOICES);
      expect(stats.totalAllocations).toBe(MAX_VOICES);
      expect(stats.voiceThefts).toBe(0);
      expect(stats.throttledCount).toBe(0);
    });

    it('throttles incoming sounds when all voices are occupied with equal or higher priority', () => {
      // Fill all 8 voices with HIGH priority sounds
      for (let i = 0; i < MAX_VOICES; i++) {
        manager.allocateVoice(`combat_${i}`, 1.0, SoundPriority.HIGH);
      }

      expect(manager.getStats().activeVoices).toBe(8);

      // Attempt to allocate a LOW priority footstep
      const rejectedLow = manager.allocateVoice('footstep', 0.1, SoundPriority.LOW);
      expect(rejectedLow).toBeNull();

      // Attempt to allocate a MEDIUM priority loot sound
      const rejectedMedium = manager.allocateVoice('loot', 0.3, SoundPriority.MEDIUM);
      expect(rejectedMedium).toBeNull();

      const stats = manager.getStats();
      expect(stats.throttledCount).toBe(2);
      expect(stats.voiceThefts).toBe(0);
    });
  });

  describe('Priority Theft (Voice Stealing)', () => {
    it('steals the lowest priority active voice when a higher priority sound arrives', () => {
      // Allocate 7 HIGH sounds and 1 LOW footstep
      for (let i = 0; i < 7; i++) {
        manager.allocateVoice(`combat_${i}`, 1.0, SoundPriority.HIGH);
      }
      const footstepChannel = manager.allocateVoice('footstep', 0.5, SoundPriority.LOW);
      expect(footstepChannel).not.toBeNull();
      expect(manager.getStats().activeVoices).toBe(8);

      // Now allocate a CRITICAL boss roar
      const bossRoarChannel = manager.allocateVoice('boss_roar', 0.8, SoundPriority.CRITICAL);
      expect(bossRoarChannel).not.toBeNull();
      // It should have stolen the footstep channel (lowest priority)
      expect(bossRoarChannel!.id).toBe(footstepChannel!.id);

      const stats = manager.getStats();
      expect(stats.voiceThefts).toBe(1);
      expect(stats.activeVoices).toBe(8);
      expect(stats.activeChannelSounds).toContain('boss_roar');
    });

    it('cleanly stops and disconnects sources on the stolen channel', () => {
      const footstepChannel = manager.allocateVoice('footstep', 0.5, SoundPriority.LOW);
      expect(footstepChannel).not.toBeNull();

      // Register an oscillator on the footstep channel
      const mockOsc = mockCtx.createOscillator() as unknown as MockOscillatorNode;
      footstepChannel!.registerSource(mockOsc as unknown as AudioNode);
      expect(mockOsc.isStopped).toBe(false);

      // Fill remaining 7 channels
      for (let i = 0; i < 7; i++) {
        manager.allocateVoice(`sound_${i}`, 1.0, SoundPriority.HIGH);
      }

      // CRITICAL sound arrives and steals the footstep channel
      manager.allocateVoice('critical_hit', 0.4, SoundPriority.CRITICAL);

      // Previous oscillator on the stolen channel should have been stopped
      expect(mockOsc.isStopped).toBe(true);
    });

    it('steals a voice of equal priority if the existing sound has elapsed > 65% of duration', () => {
      mockCtx.currentTime = 0;

      // Allocate 8 MEDIUM sounds with duration 1.0s
      for (let i = 0; i < MAX_VOICES; i++) {
        manager.allocateVoice(`loot_${i}`, 1.0, SoundPriority.MEDIUM);
      }

      // Advance time by 0.75s (75% elapsed)
      mockCtx.currentTime = 0.75;

      // Allocate an incoming MEDIUM sound
      const newLoot = manager.allocateVoice('new_loot', 0.4, SoundPriority.MEDIUM);
      expect(newLoot).not.toBeNull();
      expect(manager.getStats().voiceThefts).toBe(1);
    });
  });

  describe('Node Graph Recycling & Filter / Panner Reuse', () => {
    it('preserves and reuses identical node instances across repeated allocations', () => {
      const channelA = manager.allocateVoice('slash', 0.2, SoundPriority.HIGH, {
        volume: 0.8,
        panX: -0.5,
        lowpassFreq: 4000,
      });
      expect(channelA).not.toBeNull();

      const originalFilter = channelA!.filterNode;
      const originalGain = channelA!.gainNode;
      const originalPanner = channelA!.pannerNode;

      // Release channel
      channelA!.release();
      expect(channelA!.isActive).toBe(false);

      // Reallocate on the same channel
      const channelB = manager.allocateVoice('spell', 0.3, SoundPriority.HIGH, {
        volume: 0.6,
        panX: 0.5,
        lowpassFreq: 8000,
      });

      expect(channelB).not.toBeNull();
      // Channel was reused from pool without creating new audio nodes
      expect(channelB!.id).toBe(channelA!.id);
      expect(channelB!.filterNode).toBe(originalFilter);
      expect(channelB!.gainNode).toBe(originalGain);
      expect(channelB!.pannerNode).toBe(originalPanner);
    });

    it('releases channels cleanly and resets active count on stopAllVoices', () => {
      for (let i = 0; i < 5; i++) {
        manager.allocateVoice(`sound_${i}`, 0.5, SoundPriority.MEDIUM);
      }
      expect(manager.getStats().activeVoices).toBe(5);

      manager.stopAllVoices();
      expect(manager.getStats().activeVoices).toBe(0);
    });
  });

  describe('Integration with Global Voice Manager and Dispatchers', () => {
    it('initializes global voice manager and handles playSound without errors', () => {
      const globalMgr = getVoiceManager(mockCtx as unknown as AudioContext, mockSfxGain);
      expect(globalMgr).toBeDefined();
      expect(globalMgr.getStats().maxVoices).toBe(8);

      expect(() => playSound('slash')).not.toThrow();
      expect(() => playSound('footstep', { volume: 0.5 })).not.toThrow();
      expect(() => playSound('critical_hit', { priority: SoundPriority.CRITICAL })).not.toThrow();
    });

    it('safely routes playCustomSynthesizer through voice channels', () => {
      expect(() =>
        playCustomSynthesizer({
          type: 'sawtooth',
          startFreq: 220,
          endFreq: 440,
          freqRampType: 'linear',
          attack: 0.01,
          decay: 0.05,
          sustain: 0.5,
          release: 0.1,
          volume: 0.5,
          filterType: 'lowpass',
          filterFreq: 1500,
          filterQ: 2,
        })
      ).not.toThrow();
    });
  });
});
