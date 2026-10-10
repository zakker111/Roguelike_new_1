import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GodAudioSoundboardTab } from '../components/god/GodAudioSoundboardTab';
import { SOUND_CATALOG } from '../data/soundCatalog';

// Mock WebAudio and audio utils
vi.mock('../utils/audio', () => {
  return {
    playSound: vi.fn(),
    getAudioContext: vi.fn(() => ({
      state: 'running',
      currentTime: 10,
      resume: vi.fn(),
    })),
    getAudioWaveformData: vi.fn((arr: Uint8Array) => arr.fill(128)),
    getAudioFrequencyData: vi.fn((arr: Uint8Array) => arr.fill(64)),
    getAudioSettings: vi.fn(() => ({
      masterVolume: 1.0,
      sfxVolume: 1.0,
      ambientVolume: 0.25,
      isAudioMuted: false,
    })),
    setMasterVolume: vi.fn(),
    setSfxVolume: vi.fn(),
    toggleAudioMute: vi.fn(() => false),
    getVoiceManager: vi.fn(() => ({
      getStats: vi.fn(() => ({
        maxVoices: 8,
        activeVoices: 1,
        totalAllocations: 42,
        voiceThefts: 0,
        throttledCount: 0,
        activeChannelSounds: ['slash'],
      })),
      stopAllVoices: vi.fn(),
    })),
    playCustomSynthesizer: vi.fn(),
  };
});

describe('GodAudioSoundboardTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with master controls, telemetry, and categories', () => {
    const html = renderToString(<GodAudioSoundboardTab />);

    expect(html).toContain('Audio Engine Master');
    expect(html).toContain('Voice Concurrency Telemetry');
    expect(html).toContain('Live Audition Modulation Parameters');
    expect(html).toContain('All SFX');
    expect(html).toContain('Combat');
    expect(html).toContain('Movement');
    expect(html).toContain('Environment');
    expect(html).toContain('Crafting');
    expect(html).toContain('UI &amp; Fanfares');
  });

  it('contains sound effects from the master sound catalog', () => {
    const html = renderToString(<GodAudioSoundboardTab />);

    // Check presence of key sound cards
    expect(html).toContain('Weapon Slash');
    expect(html).toContain('Shield Bump');
    expect(html).toContain('Arcane Spell');
    expect(html).toContain('Audition SFX');
  });

  it('displays voice manager statistics and master channel volumes', () => {
    const html = renderToString(<GodAudioSoundboardTab />);

    expect(html).toContain('Active Voices');
    expect(html).toContain('/ 8');
    expect(html).toContain('Allocations');
    expect(html).toContain('Voice Thefts');
  });

  it('renders raw oscillator synth sandbox controls', () => {
    const html = renderToString(<GodAudioSoundboardTab />);

    expect(html).toContain('Raw Oscillator Synth Sandbox');
    expect(html).toContain('Play Procedural Synth Tone');
    expect(html).toContain('Oscillator Shape');
    expect(html).toContain('Center Frequency');
  });

  it('renders interactive modulation sliders for pitch, volume, distance and pan', () => {
    const html = renderToString(<GodAudioSoundboardTab />);

    expect(html).toContain('Pitch Multiplier');
    expect(html).toContain('Audition Volume');
    expect(html).toContain('Distance Falloff');
    expect(html).toContain('Stereo Pan');
    expect(html).toContain('Acoustic Filter');
  });
});
