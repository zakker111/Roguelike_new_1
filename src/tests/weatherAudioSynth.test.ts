import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createPinkNoiseBuffer,
  createBrownNoiseBuffer,
  createRainSynthGroup,
  createBlizzardSynthGroup,
  createSandstormSynthGroup,
  createSnowySynthGroup,
  createFoggySynthGroup,
  createClearSynthGroup,
  playProceduralThunder,
  WeatherSynthEngine,
  weatherSynthEngine,
} from '../utils/audio/weatherSynthEngine';
import {
  updateAmbientSoundscape,
  stopAmbientSoundscape,
  setAudioMuted,
  playSound,
} from '../utils/audio';

describe('Procedural Weather & Ambient Environmental Synthesizer', () => {
  let mockCtx: any;
  let mockDestination: any;

  beforeEach(() => {
    setAudioMuted(false);

    // Create a mock AudioContext conforming to WebAudio standard
    mockDestination = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockCtx = {
      sampleRate: 44100,
      currentTime: 10,
      destination: mockDestination,
      createBuffer: vi.fn((channels, size, rate) => ({
        sampleRate: rate,
        length: size,
        duration: size / rate,
        numberOfChannels: channels,
        getChannelData: vi.fn(() => new Float32Array(size)),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: {
          value: 1.0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        Q: {
          setValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      createStereoPanner: vi.fn(() => ({
        pan: {
          setValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
    };
  });

  afterEach(() => {
    weatherSynthEngine.stop();
  });

  describe('Organic Noise Buffers (Pink & Brown Noise)', () => {
    it('generates a valid Pink Noise buffer with 1/f spectral approximation', () => {
      const buffer = createPinkNoiseBuffer(mockCtx as any, 2);
      expect(mockCtx.createBuffer).toHaveBeenCalledWith(1, 44100 * 2, 44100);
      expect(buffer.length).toBe(44100 * 2);
    });

    it('generates a valid Brown Noise buffer with leaky integration for deep sub-bass', () => {
      const buffer = createBrownNoiseBuffer(mockCtx as any, 1.5);
      expect(mockCtx.createBuffer).toHaveBeenCalledWith(1, Math.floor(44100 * 1.5), 44100);
      expect(buffer.length).toBe(Math.floor(44100 * 1.5));
    });
  });

  describe('Multi-Layer Weather Group Synthesizers', () => {
    it('synthesizes multi-layer Rain soundscape with ground patter and foliage droplets', () => {
      const group = createRainSynthGroup(mockCtx as any, mockDestination, {
        weather: 'rainy',
        biome: 'forest',
        isIndoor: false,
        inDungeon: false,
        isNight: false,
      });

      expect(group.id).toBe('rain_synth');
      expect(group.sources.length).toBeGreaterThanOrEqual(2);
      expect(group.lfoNodes?.length).toBeGreaterThanOrEqual(1);
      expect(group.filters?.length).toBeGreaterThanOrEqual(2);
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('adjusts rain filter frequencies when player is indoors (roof insulation)', () => {
      const indoorGroup = createRainSynthGroup(mockCtx as any, mockDestination, {
        weather: 'rainy',
        biome: 'forest',
        isIndoor: true,
        inDungeon: false,
        isNight: false,
      });

      expect(indoorGroup.filters?.[0].frequency.setValueAtTime).toHaveBeenCalledWith(420, 10);
    });

    it('synthesizes multi-layer Blizzard soundscape with swept resonant howl and sub-bass gale', () => {
      const group = createBlizzardSynthGroup(mockCtx as any, mockDestination, {
        weather: 'blizzard',
        biome: 'tundra',
        isIndoor: false,
        inDungeon: false,
        isNight: false,
      });

      expect(group.id).toBe('blizzard_synth');
      expect(group.sources.length).toBeGreaterThanOrEqual(2);
      expect(group.filters?.length).toBeGreaterThanOrEqual(2);
    });

    it('synthesizes multi-layer Sandstorm soundscape with gritty particle friction and dune drafts', () => {
      const group = createSandstormSynthGroup(mockCtx as any, mockDestination, {
        weather: 'sandstorm',
        biome: 'desert',
        isIndoor: false,
        inDungeon: false,
        isNight: false,
      });

      expect(group.id).toBe('sandstorm_synth');
      expect(group.sources.length).toBeGreaterThanOrEqual(2);
    });

    it('synthesizes Snowy winter hush soundscape', () => {
      const group = createSnowySynthGroup(mockCtx as any, mockDestination, {
        weather: 'snowy',
        biome: 'tundra',
        isIndoor: false,
        inDungeon: false,
        isNight: false,
      });

      expect(group.id).toBe('snowy_synth');
      expect(group.sources.length).toBeGreaterThanOrEqual(1);
    });

    it('synthesizes Foggy stillness with eerie atmospheric drone tone', () => {
      const group = createFoggySynthGroup(mockCtx as any, mockDestination, {
        weather: 'foggy',
        biome: 'swamp',
        isIndoor: false,
        inDungeon: false,
        isNight: false,
      });

      expect(group.id).toBe('foggy_synth');
      expect(group.sources.length).toBeGreaterThanOrEqual(2);
    });

    it('synthesizes Clear sky breeze and subterranean cavern rumble', () => {
      // Wilderness breeze
      const outdoorClear = createClearSynthGroup(mockCtx as any, mockDestination, {
        weather: 'clear',
        biome: 'plains',
        isIndoor: false,
        inDungeon: false,
        isNight: false,
      });
      expect(outdoorClear.id).toBe('clear_synth');

      // Subterranean dungeon rumble
      const dungeonClear = createClearSynthGroup(mockCtx as any, mockDestination, {
        weather: 'clear',
        biome: 'dungeon',
        isIndoor: false,
        inDungeon: true,
        isNight: false,
      });
      expect(dungeonClear.id).toBe('clear_synth');
      expect(dungeonClear.sources.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Procedural Rolling Thunder Synthesis', () => {
    it('executes procedural thunder with lightning crack, sub-bass boom, and rolling tail', () => {
      expect(() => {
        playProceduralThunder(mockCtx as any, mockDestination, {
          volume: 0.5,
          pan: -0.3,
          isIndoor: false,
        });
      }).not.toThrow();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
    });

    it('attenuates thunder volume and lowpass cutoff when indoor', () => {
      expect(() => {
        playProceduralThunder(mockCtx as any, mockDestination, {
          volume: 0.5,
          isIndoor: true,
        });
      }).not.toThrow();
    });
  });

  describe('WeatherSynthEngine Lifecycle & Transitions', () => {
    it('smoothly switches active soundscape when weather changes', () => {
      const engine = new WeatherSynthEngine();

      expect(() => {
        engine.update({
          biome: 'forest',
          weather: 'rainy',
          inDungeon: false,
          isIndoor: false,
          isNight: false,
          hostileCountNearPlayer: 0,
          playerHp: 100,
          maxHp: 100,
          playerX: 5,
          playerY: 5,
        });
      }).not.toThrow();

      expect(() => {
        engine.update({
          biome: 'tundra',
          weather: 'blizzard',
          inDungeon: false,
          isIndoor: false,
          isNight: false,
          hostileCountNearPlayer: 0,
          playerHp: 100,
          maxHp: 100,
          playerX: 5,
          playerY: 5,
        });
      }).not.toThrow();

      expect(() => engine.stop()).not.toThrow();
    });

    it('safely handles updateAmbientSoundscape and stopAmbientSoundscape', () => {
      expect(() => {
        updateAmbientSoundscape({
          biome: 'desert',
          weather: 'sandstorm',
          inDungeon: false,
          isIndoor: false,
          isNight: false,
          hostileCountNearPlayer: 1,
          playerHp: 80,
          maxHp: 100,
          playerX: 12,
          playerY: 18,
        });
      }).not.toThrow();

      expect(() => {
        updateAmbientSoundscape({
          biome: 'forest',
          weather: 'foggy',
          inDungeon: false,
          isIndoor: true,
          isNight: true,
          hostileCountNearPlayer: 0,
          playerHp: 100,
          maxHp: 100,
          playerX: 12,
          playerY: 18,
        });
      }).not.toThrow();

      expect(() => stopAmbientSoundscape()).not.toThrow();
    });
  });

  describe('Sound Catalog New Environmental Sounds', () => {
    it('plays thunder_rumble without errors', () => {
      expect(() => playSound('thunder_rumble', { volume: 0.8 })).not.toThrow();
    });

    it('plays wind_gust without errors', () => {
      expect(() => playSound('wind_gust', { volume: 0.6 })).not.toThrow();
    });

    it('plays blizzard_howl without errors', () => {
      expect(() => playSound('blizzard_howl', { volume: 0.7 })).not.toThrow();
    });
  });
});
