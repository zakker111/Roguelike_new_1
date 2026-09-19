/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateAcousticOcclusion,
  setAcousticListenerContext,
  getAcousticListenerContext,
  resetAcousticListenerContext,
} from '../utils/audio/acousticOcclusion';
import { calculateSpatialParameters } from '../utils/audio/spatialAudio';
import {
  renderDynamicWaterCaustics,
  renderSubmergedObjectCaustics,
} from '../canvas/waterCausticsRenderer';
import { BloomEngine } from '../canvas/bloomEngine';
import { VignetteRenderer } from '../canvas/vignetteRenderer';
import { TileType, GameState } from '../types';

describe('Pillar 4: Spatial Acoustics & VFX Sub-Engine', () => {
  beforeEach(() => {
    resetAcousticListenerContext();
  });

  describe('Acoustic Occlusion Raytracing', () => {
    it('provides clear, unoccluded acoustic transmission through open air corridors', () => {
      // 5x5 open floor room
      const map: TileType[][] = [
        [TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor],
      ];

      const res = calculateAcousticOcclusion(0, 0, 4, 0, map);
      expect(res.doorsTraversed).toBe(0);
      expect(res.wallsTraversed).toBe(0);
      expect(res.occlusionFactor).toBe(0);
      expect(res.effectiveLowpassFreq).toBeGreaterThan(12000);
      expect(res.isDirectLineOfSight).toBe(true);
      expect(res.volumeMultiplier).toBe(1.0);
    });

    it('muffles acoustic frequencies and attenuates volume behind closed doors', () => {
      // Player at (0, 2), Closed Door at (2, 2), Sound at (4, 2)
      const map: TileType[][] = [
        [TileType.Wall, TileType.Wall, TileType.Wall, TileType.Wall, TileType.Wall],
        [TileType.Floor, TileType.Floor, TileType.Wall, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Door, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Wall, TileType.Floor, TileType.Floor],
        [TileType.Wall, TileType.Wall, TileType.Wall, TileType.Wall, TileType.Wall],
      ];

      const res = calculateAcousticOcclusion(4, 2, 0, 2, map);
      expect(res.doorsTraversed).toBe(1);
      expect(res.wallsTraversed).toBe(0);
      expect(res.occlusionFactor).toBeGreaterThan(0.3);
      // Lowpass should be significantly lower than open air (18,000Hz)
      expect(res.effectiveLowpassFreq).toBeLessThan(1000);
      expect(res.effectiveLowpassFreq).toBeGreaterThan(300);
      expect(res.volumeMultiplier).toBeLessThan(0.85);
      expect(res.roomResonanceQ).toBeGreaterThan(0.7);
    });

    it('heavily muffles sound penetrating solid dungeon stone walls', () => {
      // Solid wall between listener and sound
      const map: TileType[][] = [
        [TileType.Floor, TileType.Wall, TileType.Floor],
        [TileType.Floor, TileType.Wall, TileType.Floor],
        [TileType.Floor, TileType.Wall, TileType.Floor],
      ];

      const res = calculateAcousticOcclusion(2, 1, 0, 1, map);
      expect(res.wallsTraversed).toBe(1);
      expect(res.effectiveLowpassFreq).toBeLessThan(3500);
      expect(res.volumeMultiplier).toBeLessThanOrEqual(0.70);
    });

    it('integrates with listener context seamlessly in calculateSpatialParameters', () => {
      const map: TileType[][] = [
        [TileType.Floor, TileType.Door, TileType.Floor],
      ];

      setAcousticListenerContext(0, 0, map);
      const ctx = getAcousticListenerContext();
      expect(ctx).toBeDefined();
      expect(ctx?.playerX).toBe(0);
      expect(ctx?.playerY).toBe(0);

      // Sound is at (2, 0) behind the door
      const spatial = calculateSpatialParameters(1.0, {
        x: 2,
        y: 0,
      });

      expect(spatial.audible).toBe(true);
      expect(spatial.occlusionFactor).toBeGreaterThan(0.3);
      expect(spatial.lowpassFreq).toBeLessThan(8000);
    });
  });

  describe('Water Caustics & Refraction Renderer', () => {
    it('executes dynamic water caustics across all biomes without throwing', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        quadraticCurveTo: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
      } as unknown as CanvasRenderingContext2D;

      expect(() => {
        renderDynamicWaterCaustics(mockCtx, 100, 100, 28, 4, 4, 'forest', 1000);
        renderDynamicWaterCaustics(mockCtx, 100, 100, 28, 4, 4, 'tundra', 1000);
        renderDynamicWaterCaustics(mockCtx, 100, 100, 28, 4, 4, 'swamp', 1000);
        renderDynamicWaterCaustics(mockCtx, 100, 100, 28, 4, 4, 'desert', 1000);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('renders submerged entity refractive caustics with additive blending', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        stroke: vi.fn(),
        globalCompositeOperation: 'source-over',
        strokeStyle: '',
        lineWidth: 1,
      } as unknown as CanvasRenderingContext2D;

      renderSubmergedObjectCaustics(mockCtx, 50, 50, 28, 28, 500);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });

  describe('Luminous HDR Bloom Engine', () => {
    it('manages singleton state and enable/disable toggling', () => {
      const engine = BloomEngine.getInstance();
      expect(engine).toBeDefined();
      expect(engine.getIsEnabled()).toBe(true);

      engine.setEnabled(false);
      expect(engine.getIsEnabled()).toBe(false);
      engine.setEnabled(true);
    });

    it('handles bloom pass rendering safely for players and active fields', () => {
      const engine = BloomEngine.getInstance();
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
        globalCompositeOperation: 'source-over',
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;

      const mockGameState = {
        playerX: 5,
        playerY: 5,
        levelWidth: 20,
        levelHeight: 20,
        map: [[TileType.Floor]],
        visible: [[true]],
        elementalFields: [
          { x: 5, y: 5, element: 'fire', duration: 3, intensity: 2 },
          { x: 6, y: 5, element: 'shock', duration: 2, intensity: 1 },
        ],
      } as unknown as GameState;

      expect(() => {
        engine.renderBloomPass(mockCtx, mockGameState, 0, 0, { width: 400, height: 300 }, 28);
      }).not.toThrow();
    });
  });

  describe('Atmospheric Vignette Renderer', () => {
    it('manages singleton state and adapts to dungeon depth and blood moons', () => {
      const vignette = VignetteRenderer.getInstance();
      expect(vignette).toBeDefined();

      let gradientStops: { stop: number; color: string }[] = [];
      const mockGradient = {
        addColorStop: vi.fn((stop: number, color: string) => {
          gradientStops.push({ stop, color });
        }),
      };

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        createRadialGradient: vi.fn(() => mockGradient),
        fillRect: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      // 1. Overworld Daytime Test
      const overworldState = {
        isOverworld: true,
        timeOfDay: 'day',
        weather: 'clear',
        biome: 'forest',
      } as unknown as GameState;

      vignette.renderVignettePass(mockCtx, { width: 600, height: 400 }, overworldState);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 600, 400);

      // 2. Subterranean Deep Dungeon Test
      gradientStops = [];
      const dungeonState = {
        isOverworld: false,
        dungeonDepth: 3,
        weather: 'clear',
      } as unknown as GameState;

      vignette.renderVignettePass(mockCtx, { width: 600, height: 400 }, dungeonState);
      expect(mockGradient.addColorStop).toHaveBeenCalled();

      // 3. Blood Moon Test
      gradientStops = [];
      const bloodMoonState = {
        isOverworld: true,
        bloodMoonTurnsLeft: 12,
        timeOfDay: 'night',
        weather: 'clear',
      } as unknown as GameState;

      vignette.renderVignettePass(mockCtx, { width: 600, height: 400 }, bloodMoonState);
      const hasCrimson = gradientStops.some((s) => s.color.includes('80, 7, 7') || s.color.includes('40, 2, 2'));
      expect(hasCrimson).toBe(true);
    });
  });
});
