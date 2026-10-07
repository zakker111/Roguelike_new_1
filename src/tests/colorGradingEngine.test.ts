/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ColorGradingEngine } from '../canvas/colorGradingEngine';
import { GameState } from '../types';

describe('Option 1: ColorGradingEngine & Dynamic Tone Mapping Sub-Engine', () => {
  let engine: ColorGradingEngine;

  beforeEach(() => {
    engine = ColorGradingEngine.getInstance();
    engine.setEnabled(true);
    engine.setVibrancyMode('vivid');
  });

  describe('Time-of-Day Phase Resolution', () => {
    it('correctly maps 24-hour game time into distinct astronomical phases', () => {
      // 06:00 (360 mins) => dawn
      const dawn = engine.getTimePhase(360);
      expect(dawn.phase).toBe('dawn');
      expect(dawn.progress).toBeGreaterThanOrEqual(0);
      expect(dawn.progress).toBeLessThanOrEqual(1);

      // 09:30 (570 mins) => morning
      const morning = engine.getTimePhase(570);
      expect(morning.phase).toBe('morning');

      // 13:00 (780 mins) => midday
      const midday = engine.getTimePhase(780);
      expect(midday.phase).toBe('midday');

      // 18:30 (1110 mins) => golden_hour
      const goldenHour = engine.getTimePhase(1110);
      expect(goldenHour.phase).toBe('golden_hour');

      // 20:30 (1230 mins) => twilight
      const twilight = engine.getTimePhase(1230);
      expect(twilight.phase).toBe('twilight');

      // 02:00 (120 mins) => night
      const night = engine.getTimePhase(120);
      expect(night.phase).toBe('night');
    });

    it('handles negative or overflow minute values smoothly via modulo', () => {
      const overflow = engine.getTimePhase(1440 + 720); // 720 midday
      expect(overflow.phase).toBe('midday');

      const negative = engine.getTimePhase(-720); // 720 midday
      expect(negative.phase).toBe('midday');
    });
  });

  describe('Atmospheric Profile Computation', () => {
    it('computes warm sunrise angles and high god ray intensity during dawn', () => {
      const dawnState = {
        gameTime: 400, // ~06:40 AM
        isOverworld: true,
        weather: 'clear',
        biome: 'forest',
      } as unknown as GameState;

      const profile = engine.calculateAtmosphericProfile(dawnState);
      expect(profile.phase).toBe('dawn');
      expect(profile.ambientWarmth).toBeGreaterThan(0.4);
      expect(profile.godRayIntensity).toBeGreaterThan(0.5);
      expect(profile.gradeColor).toContain('251, 146, 60'); // Warm peach/amber
    });

    it('computes rich honey-gold and warm shadows during golden hour', () => {
      const goldenState = {
        gameTime: 1120, // ~18:40 PM
        isOverworld: true,
        weather: 'clear',
        biome: 'forest',
      } as unknown as GameState;

      const profile = engine.calculateAtmosphericProfile(goldenState);
      expect(profile.phase).toBe('golden_hour');
      expect(profile.ambientWarmth).toBeGreaterThan(0.7);
      expect(profile.godRayIntensity).toBeGreaterThan(0.5);
      expect(profile.gradeColor).toContain('245, 158, 11'); // Amber gold
    });

    it('computes deep moonlit indigo with high contrast and zero sunbeams during night', () => {
      const nightState = {
        gameTime: 1350, // 22:30 PM
        isOverworld: true,
        weather: 'clear',
        biome: 'forest',
        playerStats: { turnsPlayed: 10 },
      } as unknown as GameState;

      const profile = engine.calculateAtmosphericProfile(nightState);
      expect(profile.phase).toBe('night');
      expect(profile.ambientWarmth).toBeLessThan(0);
      expect(profile.godRayIntensity).toBe(0);
    });

    it('suppresses god rays during heavy storm and blizzard weather', () => {
      const stormState = {
        gameTime: 1120, // would be golden hour
        isOverworld: true,
        weather: 'stormy',
        biome: 'forest',
      } as unknown as GameState;

      const profile = engine.calculateAtmosphericProfile(stormState);
      expect(profile.godRayIntensity).toBe(0);
      expect(profile.ambientWarmth).toBeLessThan(0);
    });

    it('scales grade alpha according to vibrancy mode settings', () => {
      const testState = {
        gameTime: 1120,
        isOverworld: true,
        weather: 'clear',
        biome: 'forest',
      } as unknown as GameState;

      engine.setVibrancyMode('vivid');
      const vivid = engine.calculateAtmosphericProfile(testState);

      engine.setVibrancyMode('cinematic');
      const cinematic = engine.calculateAtmosphericProfile(testState);

      engine.setVibrancyMode('natural');
      const natural = engine.calculateAtmosphericProfile(testState);

      expect(vivid.gradeAlpha).toBeGreaterThan(cinematic.gradeAlpha);
      expect(cinematic.gradeAlpha).toBeGreaterThan(natural.gradeAlpha);
    });
  });

  describe('Biome & Dungeon Profiles', () => {
    it('produces distinctive palette profiles for desert, tundra, swamp, and inferno biomes', () => {
      const baseState = { isOverworld: true, weather: 'clear' } as unknown as GameState;

      const desert = engine.getBiomeProfile({ ...baseState, biome: 'desert' } as unknown as GameState);
      expect(desert.godRayDustColor).toBe('#fbbf24'); // Golden sand

      const tundra = engine.getBiomeProfile({ ...baseState, biome: 'tundra' } as unknown as GameState);
      expect(tundra.godRayDustColor).toBe('#bae6fd'); // Glacial frost

      const swamp = engine.getBiomeProfile({ ...baseState, biome: 'swamp' } as unknown as GameState);
      expect(tundra.primaryTint).not.toBe(swamp.primaryTint);

      const volcano = engine.getBiomeProfile({ ...baseState, biome: 'volcanic' } as unknown as GameState);
      expect(volcano.godRayDustColor).toBe('#f97316'); // Cinder ember
    });

    it('distinguishes crypts (depth 1-3) from deep ruins (depth 4-5) and underworld (depth 6+)', () => {
      const dungeonState = { isOverworld: false } as unknown as GameState;

      const crypt = engine.getBiomeProfile({ ...dungeonState, currentDungeonDepth: 2 } as unknown as GameState);
      const deepRuins = engine.getBiomeProfile({ ...dungeonState, currentDungeonDepth: 5 } as unknown as GameState);
      const underworld = engine.getBiomeProfile({ ...dungeonState, currentDungeonDepth: 7 } as unknown as GameState);

      expect(crypt.primaryTint).toContain('15, 118, 110'); // Teal crypt
      expect(deepRuins.primaryTint).toContain('139, 92, 246'); // Amethyst ruins
      expect(underworld.primaryTint).toContain('239, 68, 68'); // Magma underworld
    });
  });

  describe('Render Pass Execution', () => {
    it('renders ambient tone wash and volumetric god rays onto mock 2D context', () => {
      const mockGradient = {
        addColorStop: vi.fn(),
      };

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        createLinearGradient: vi.fn(() => mockGradient),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        fillStyle: '',
        globalCompositeOperation: '',
        globalAlpha: 1.0,
      } as unknown as CanvasRenderingContext2D;

      const goldenState = {
        gameTime: 1100, // Golden hour
        isOverworld: true,
        weather: 'clear',
        biome: 'forest',
      } as unknown as GameState;

      engine.renderColorGradingPass(mockCtx, { width: 800, height: 600 }, goldenState);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('skips rendering when disabled via setEnabled(false)', () => {
      const mockCtx = {
        save: vi.fn(),
        fillRect: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      engine.setEnabled(false);
      engine.renderColorGradingPass(mockCtx, { width: 800, height: 600 }, {} as GameState);

      expect(mockCtx.save).not.toHaveBeenCalled();
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    it('supports registering custom biome profiles and overrides at runtime', () => {
      engine.registerBiomeProfile('celestial_peak', {
        primaryTint: 'rgba(216, 180, 254, 0.08)',
        accentTint: 'rgba(244, 114, 182, 0.05)',
        godRayColor: 'rgba(250, 232, 255, 0.09)',
        godRayDustColor: '#e879f9',
        toneWeight: 0.95,
      });

      const celestialState = {
        isOverworld: true,
        biome: 'celestial_peak',
      } as unknown as GameState;

      const profile = engine.getBiomeProfile(celestialState);
      expect(profile.godRayDustColor).toBe('#e879f9');
      expect(profile.primaryTint).toContain('216, 180, 254');

      // Test custom time profile override
      engine.overrideTimeProfile('dawn', {
        godRayIntensity: 0.99,
        gradeColor: '255, 100, 100',
      });

      const dawnState = {
        gameTime: 400,
        isOverworld: true,
        weather: 'clear',
        biome: 'forest',
      } as unknown as GameState;

      const dawnProfile = engine.calculateAtmosphericProfile(dawnState);
      expect(dawnProfile.gradeColor).toBe('255, 100, 100');
      expect(dawnProfile.godRayIntensity).toBe(0.99);

      // Test global multipliers
      engine.setGodRayIntensityMultiplier(2.0);
      expect(engine.getGodRayIntensityMultiplier()).toBe(2.0);
      const scaledDawn = engine.calculateAtmosphericProfile(dawnState);
      expect(scaledDawn.godRayIntensity).toBe(1.98);

      // Test reset
      engine.resetCustomOverrides();
      expect(engine.getGodRayIntensityMultiplier()).toBe(1.0);
      const resetProfile = engine.calculateAtmosphericProfile(dawnState);
      expect(resetProfile.gradeColor).not.toBe('255, 100, 100');
    });
  });
});
