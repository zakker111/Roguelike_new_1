/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { visualsConfig } from '../canvas/visualsConfig';
import { shadowConfig } from '../canvas/shadowRenderer';
import { waterShimmerConfig } from '../canvas/waterShimmerRenderer';
import { waterCausticsConfig } from '../canvas/waterCausticsRenderer';
import { biomeAtmosphereConfig } from '../canvas/biomeAtmosphereRenderer';
import { colorGradingEngine } from '../canvas/colorGradingEngine';
import { bloomEngine } from '../canvas/bloomEngine';
import { vignetteRenderer } from '../canvas/vignetteRenderer';

describe('Visuals Master Config Sub-Engine', () => {
  beforeEach(() => {
    visualsConfig.resetAll();
  });

  it('provides direct access to all visual sub-engines', () => {
    expect(visualsConfig.colorGrading).toBe(colorGradingEngine);
    expect(visualsConfig.bloom).toBe(bloomEngine);
    expect(visualsConfig.vignette).toBe(vignetteRenderer);
    expect(visualsConfig.shadows).toBe(shadowConfig);
    expect(visualsConfig.waterShimmer).toBe(waterShimmerConfig);
    expect(visualsConfig.waterCaustics).toBe(waterCausticsConfig);
    expect(visualsConfig.biomeAtmosphere).toBe(biomeAtmosphereConfig);
  });

  it('applies vivid visual preset accurately', () => {
    visualsConfig.applyPreset('vivid');

    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(true);
    expect(visualsConfig.colorGrading.getVibrancyMode()).toBe('vivid');
    expect(visualsConfig.colorGrading.getGodRayIntensityMultiplier()).toBe(1.25);
    expect(visualsConfig.bloom.getIsEnabled()).toBe(true);
    expect(visualsConfig.bloom.getIntensityMultiplier()).toBe(1.3);
    expect(visualsConfig.vignette.getDarknessMultiplier()).toBe(0.9);
    expect(visualsConfig.waterShimmer.getIntensityMultiplier()).toBe(1.2);
    expect(visualsConfig.waterCaustics.getIntensityMultiplier()).toBe(1.2);
    expect(visualsConfig.biomeAtmosphere.getDensityMultiplier()).toBe(1.2);
  });

  it('applies cinematic visual preset accurately', () => {
    visualsConfig.applyPreset('cinematic');

    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(true);
    expect(visualsConfig.colorGrading.getVibrancyMode()).toBe('cinematic');
    expect(visualsConfig.colorGrading.getGodRayIntensityMultiplier()).toBe(0.85);
    expect(visualsConfig.bloom.getIntensityMultiplier()).toBe(0.9);
    expect(visualsConfig.vignette.getDarknessMultiplier()).toBe(1.15);
    expect(visualsConfig.shadows.getOpacityMultiplier()).toBe(1.1);
  });

  it('applies retro_clean visual preset disabling post-processing filters', () => {
    visualsConfig.applyPreset('retro_clean');

    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(false);
    expect(visualsConfig.bloom.getIsEnabled()).toBe(false);
    expect(visualsConfig.vignette.getIsEnabled()).toBe(false);
    expect(visualsConfig.waterCaustics.getIsEnabled()).toBe(false);
    expect(visualsConfig.biomeAtmosphere.getIsEnabled()).toBe(false);
    expect(visualsConfig.shadows.getIsEnabled()).toBe(true);
  });

  it('applies performance preset shutting down heavy shaders and particles', () => {
    visualsConfig.applyPreset('performance');

    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(false);
    expect(visualsConfig.bloom.getIsEnabled()).toBe(false);
    expect(visualsConfig.vignette.getIsEnabled()).toBe(false);
    expect(visualsConfig.shadows.getIsEnabled()).toBe(false);
    expect(visualsConfig.waterShimmer.getIsEnabled()).toBe(false);
    expect(visualsConfig.waterCaustics.getIsEnabled()).toBe(false);
    expect(visualsConfig.biomeAtmosphere.getIsEnabled()).toBe(false);
  });

  it('resets all visual subsystems back to stock defaults', () => {
    visualsConfig.applyPreset('performance');
    visualsConfig.resetAll();

    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(true);
    expect(visualsConfig.bloom.getIsEnabled()).toBe(true);
    expect(visualsConfig.bloom.getIntensityMultiplier()).toBe(1.0);
    expect(visualsConfig.vignette.getIsEnabled()).toBe(true);
    expect(visualsConfig.vignette.getDarknessMultiplier()).toBe(1.0);
    expect(visualsConfig.shadows.getIsEnabled()).toBe(true);
    expect(visualsConfig.shadows.getOpacityMultiplier()).toBe(1.0);
    expect(visualsConfig.waterShimmer.getIsEnabled()).toBe(true);
    expect(visualsConfig.waterCaustics.getIsEnabled()).toBe(true);
    expect(visualsConfig.biomeAtmosphere.getIsEnabled()).toBe(true);
  });

  it('allows registering and reading custom theme palettes', () => {
    const customPalette = {
      wallBase: '#111111',
      wallHighlight: '#222222',
      wallShadow: '#000000',
      floor: '#151515',
      floorAlt: '#252525',
      grass: '#105520',
      grassTuft: '#30aa40',
      water: '#053070',
      waterHighlight: '#1060c0',
      waterFoam: '#90c0f0',
      path: '#403020',
      sand: '#906020',
      snow: '#e0e0e0',
      lava: '#dd2010',
      wood: '#502010',
      woodLight: '#804020',
      gold: '#f0b010',
      crystal: '#20d0e0',
    };

    visualsConfig.registerThemePalette('cyber_dungeon', customPalette);
    const retrieved = visualsConfig.getThemePalette('cyber_dungeon');
    expect(retrieved.wallBase).toBe('#111111');
    expect(retrieved.gold).toBe('#f0b010');
  });
});
