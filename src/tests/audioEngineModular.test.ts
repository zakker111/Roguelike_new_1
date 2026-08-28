import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAudioSettings,
  setMasterVolume,
  setSfxVolume,
  setAmbientVolume,
  setAudioMuted,
  toggleAudioMute,
  calculateSpatialParameters,
  playSpatialSound,
  playSound,
  playCustomSynthesizer,
  updateAmbientSoundscape,
  stopAmbientSoundscape,
  SOUND_CATALOG,
  SOUND_SYNTH_PRESETS,
} from '../utils/audio';

describe('Modular WebAudio Synthesizer Engine', () => {
  beforeEach(() => {
    setAudioMuted(false);
    setMasterVolume(1.0);
    setSfxVolume(1.0);
    setAmbientVolume(0.25);
  });

  describe('Audio Volume and State Controls', () => {
    it('initializes with valid default audio settings', () => {
      const settings = getAudioSettings();
      expect(settings.masterVolume).toBe(1.0);
      expect(settings.sfxVolume).toBe(1.0);
      expect(settings.ambientVolume).toBe(0.25);
      expect(settings.isAudioMuted).toBe(false);
    });

    it('clamps master volume between 0.0 and 1.0', () => {
      setMasterVolume(1.5);
      expect(getAudioSettings().masterVolume).toBe(1.0);

      setMasterVolume(-0.5);
      expect(getAudioSettings().masterVolume).toBe(0.0);

      setMasterVolume(0.65);
      expect(getAudioSettings().masterVolume).toBe(0.65);
    });

    it('clamps sfx volume and ambient volume correctly', () => {
      setSfxVolume(2.0);
      expect(getAudioSettings().sfxVolume).toBe(1.0);

      setAmbientVolume(0.8);
      expect(getAudioSettings().ambientVolume).toBe(0.8);
    });

    it('toggles audio mute status correctly', () => {
      expect(getAudioSettings().isAudioMuted).toBe(false);
      const isMuted = toggleAudioMute();
      expect(isMuted).toBe(true);
      expect(getAudioSettings().isAudioMuted).toBe(true);

      const unmuted = toggleAudioMute();
      expect(unmuted).toBe(false);
      expect(getAudioSettings().isAudioMuted).toBe(false);
    });
  });

  describe('Spatial Audio Calculations', () => {
    it('calculates full volume and zero pan for co-located sound', () => {
      const result = calculateSpatialParameters(1.0, {
        x: 10,
        y: 10,
        playerX: 10,
        playerY: 10,
        maxDistance: 14,
      });

      expect(result.audible).toBe(true);
      expect(result.attenuation).toBeCloseTo(1.0, 2);
      expect(result.panX).toBe(0);
      expect(result.finalVol).toBeCloseTo(1.0, 2);
    });

    it('returns inaudible for sounds outside max hearing radius', () => {
      const result = calculateSpatialParameters(1.0, {
        x: 30,
        y: 30,
        playerX: 10,
        playerY: 10,
        maxDistance: 14,
      });

      expect(result.audible).toBe(false);
      expect(result.finalVol).toBe(0);
      expect(result.attenuation).toBe(0);
    });

    it('applies directional stereo panning for offset sounds', () => {
      // Sound located to the right of player
      const rightResult = calculateSpatialParameters(1.0, {
        x: 14,
        y: 10,
        playerX: 10,
        playerY: 10,
        maxDistance: 14,
      });

      expect(rightResult.panX).toBeGreaterThan(0);

      // Sound located to the left of player
      const leftResult = calculateSpatialParameters(1.0, {
        x: 6,
        y: 10,
        playerX: 10,
        playerY: 10,
        maxDistance: 14,
      });

      expect(leftResult.panX).toBeLessThan(0);
    });

    it('applies acoustic wall dampening for indoor events', () => {
      const outdoorResult = calculateSpatialParameters(1.0, {
        x: 12,
        y: 10,
        playerX: 10,
        playerY: 10,
        maxDistance: 14,
        isIndoor: false,
      });

      const indoorResult = calculateSpatialParameters(1.0, {
        x: 12,
        y: 10,
        playerX: 10,
        playerY: 10,
        maxDistance: 14,
        isIndoor: true,
      });

      expect(indoorResult.finalVol).toBeLessThan(outdoorResult.finalVol);
      expect(indoorResult.lowpassFreq).toBeLessThanOrEqual(750);
    });
  });

  describe('Sound Catalog and Synthesis Dispatchers', () => {
    it('contains sound catalog registries and synth presets', () => {
      expect(SOUND_CATALOG).toBeDefined();
      expect(SOUND_SYNTH_PRESETS).toBeDefined();
      expect(SOUND_SYNTH_PRESETS.bump).toBeDefined();
      expect(SOUND_SYNTH_PRESETS.hurt).toBeDefined();
    });

    it('safely handles playSound calls without throwing in test environment', () => {
      expect(() => playSound('click')).not.toThrow();
      expect(() => playSound('slash', { volume: 0.8, pitch: 1.2 })).not.toThrow();
      expect(() => playSound('spell', 0.5)).not.toThrow();
      expect(() => playSound('loot')).not.toThrow();
      expect(() => playSound('levelUp')).not.toThrow();
      expect(() => playSound('victory')).not.toThrow();
      expect(() => playSound('defeat')).not.toThrow();
      expect(() => playSound('craft')).not.toThrow();
      expect(() => playSound('forge')).not.toThrow();
      expect(() => playSound('mutate')).not.toThrow();
      expect(() => playSound('door_open')).not.toThrow();
      expect(() => playSound('door_close')).not.toThrow();
      expect(() => playSound('lightning_strike')).not.toThrow();
    });

    it('safely handles playSpatialSound calls', () => {
      expect(() =>
        playSpatialSound('footstep', 12, 10, 10, 10, { volume: 0.7 })
      ).not.toThrow();
    });

    it('safely executes custom synthesizer player', () => {
      expect(() =>
        playCustomSynthesizer({
          type: 'sawtooth',
          startFreq: 440,
          endFreq: 880,
          freqRampType: 'exponential',
          attack: 0.05,
          decay: 0.1,
          sustain: 0.5,
          release: 0.2,
          volume: 0.3,
          filterType: 'lowpass',
          filterFreq: 1200,
          filterQ: 2,
        })
      ).not.toThrow();
    });
  });

  describe('Procedural Ambient Soundscapes', () => {
    it('safely manages ambient soundscape updates and cleanup', () => {
      expect(() =>
        updateAmbientSoundscape({
          biome: 'forest',
          weather: 'rainy',
          inDungeon: false,
          dungeonLevel: 1,
          isNight: false,
          isIndoor: false,
          hostileCountNearPlayer: 2,
          playerHp: 80,
          maxHp: 100,
          playerX: 10,
          playerY: 10,
        })
      ).not.toThrow();

      expect(() => stopAmbientSoundscape()).not.toThrow();
    });

    it('handles critical low HP soundscape transition without throwing', () => {
      expect(() =>
        updateAmbientSoundscape({
          biome: 'dungeon',
          weather: 'clear',
          inDungeon: true,
          dungeonLevel: 3,
          isNight: false,
          isIndoor: true,
          hostileCountNearPlayer: 4,
          playerHp: 15, // < 30% low HP trigger
          maxHp: 100,
          playerX: 20,
          playerY: 15,
        })
      ).not.toThrow();

      expect(() => stopAmbientSoundscape()).not.toThrow();
    });
  });
});
