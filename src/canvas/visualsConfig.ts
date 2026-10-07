/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { colorGradingEngine, ColorGradingEngine, BiomeColorProfile, AtmosphericTimeProfile, VibrancyMode } from './colorGradingEngine';
import { bloomEngine, BloomEngine } from './bloomEngine';
import { vignetteRenderer, VignetteRenderer } from './vignetteRenderer';
import { shadowConfig } from './shadowRenderer';
import { waterShimmerConfig } from './waterShimmerRenderer';
import { waterCausticsConfig } from './waterCausticsRenderer';
import { biomeAtmosphereConfig } from './biomeAtmosphereRenderer';
import { THEME_PALETTES, registerThemePalette, getThemePalette } from './atlas/themePalettes';
import { ThemePaletteColors } from './atlas/types';

export type VisualPreset = 'vivid' | 'cinematic' | 'retro_clean' | 'performance';

/**
 * Sovereign Developer Visuals Configuration Sub-Engine.
 * Provides a unified, type-safe control surface to configure, customize,
 * or toggle every visual pass in the game engine with 1 line of code.
 */
export class VisualsMasterConfig {
  private static instance: VisualsMasterConfig;

  private constructor() {}

  public static getInstance(): VisualsMasterConfig {
    if (!VisualsMasterConfig.instance) {
      VisualsMasterConfig.instance = new VisualsMasterConfig();
    }
    return VisualsMasterConfig.instance;
  }

  // Subsystem accessors
  public readonly colorGrading = colorGradingEngine;
  public readonly bloom = bloomEngine;
  public readonly vignette = vignetteRenderer;
  public readonly shadows = shadowConfig;
  public readonly waterShimmer = waterShimmerConfig;
  public readonly waterCaustics = waterCausticsConfig;
  public readonly biomeAtmosphere = biomeAtmosphereConfig;

  // Theme palettes helper accessors
  public registerThemePalette(themeName: string, colors: ThemePaletteColors): void {
    registerThemePalette(themeName, colors);
  }

  public getThemePalette(theme: string = 'classic'): ThemePaletteColors {
    return getThemePalette(theme);
  }

  public getThemePalettes(): Record<string, ThemePaletteColors> {
    return THEME_PALETTES;
  }

  /**
   * Applies a cohesive, calibrated visual preset across all render passes.
   */
  public applyPreset(preset: VisualPreset): void {
    switch (preset) {
      case 'vivid':
        this.colorGrading.setEnabled(true);
        this.colorGrading.setVibrancyMode('vivid');
        this.colorGrading.setGodRayIntensityMultiplier(1.25);
        this.colorGrading.setGradeAlphaMultiplier(1.1);
        this.bloom.setEnabled(true);
        this.bloom.setIntensityMultiplier(1.3);
        this.vignette.setEnabled(true);
        this.vignette.setDarknessMultiplier(0.9);
        this.shadows.setEnabled(true);
        this.shadows.setOpacityMultiplier(1.0);
        this.shadows.setLengthMultiplier(1.0);
        this.waterShimmer.setEnabled(true);
        this.waterShimmer.setIntensityMultiplier(1.2);
        this.waterCaustics.setEnabled(true);
        this.waterCaustics.setIntensityMultiplier(1.2);
        this.biomeAtmosphere.setEnabled(true);
        this.biomeAtmosphere.setDensityMultiplier(1.2);
        break;

      case 'cinematic':
        this.colorGrading.setEnabled(true);
        this.colorGrading.setVibrancyMode('cinematic');
        this.colorGrading.setGodRayIntensityMultiplier(0.85);
        this.colorGrading.setGradeAlphaMultiplier(1.0);
        this.bloom.setEnabled(true);
        this.bloom.setIntensityMultiplier(0.9);
        this.vignette.setEnabled(true);
        this.vignette.setDarknessMultiplier(1.15);
        this.shadows.setEnabled(true);
        this.shadows.setOpacityMultiplier(1.1);
        this.shadows.setLengthMultiplier(1.1);
        this.waterShimmer.setEnabled(true);
        this.waterShimmer.setIntensityMultiplier(0.9);
        this.waterCaustics.setEnabled(true);
        this.waterCaustics.setIntensityMultiplier(0.9);
        this.biomeAtmosphere.setEnabled(true);
        this.biomeAtmosphere.setDensityMultiplier(1.0);
        break;

      case 'retro_clean':
        // Crisp, unmodulated pixel aesthetic without atmospheric filters or bloom
        this.colorGrading.setEnabled(false);
        this.bloom.setEnabled(false);
        this.vignette.setEnabled(false);
        this.shadows.setEnabled(true);
        this.shadows.setOpacityMultiplier(0.8);
        this.shadows.setLengthMultiplier(0.8);
        this.waterShimmer.setEnabled(true);
        this.waterShimmer.setIntensityMultiplier(1.0);
        this.waterCaustics.setEnabled(false);
        this.biomeAtmosphere.setEnabled(false);
        break;

      case 'performance':
        // Maximizes battery life and framerate on low-power devices
        this.colorGrading.setEnabled(false);
        this.bloom.setEnabled(false);
        this.vignette.setEnabled(false);
        this.shadows.setEnabled(false);
        this.waterShimmer.setEnabled(false);
        this.waterCaustics.setEnabled(false);
        this.biomeAtmosphere.setEnabled(false);
        break;
    }
  }

  /**
   * Resets all visual sub-engines to default production baselines.
   */
  public resetAll(): void {
    this.colorGrading.setEnabled(true);
    this.colorGrading.setVibrancyMode('vivid');
    this.colorGrading.setGodRayIntensityMultiplier(1.0);
    this.colorGrading.setGradeAlphaMultiplier(1.0);

    this.bloom.setEnabled(true);
    this.bloom.setIntensityMultiplier(1.0);

    this.vignette.setEnabled(true);
    this.vignette.setDarknessMultiplier(1.0);

    this.shadows.reset();
    this.waterShimmer.reset();
    this.waterCaustics.reset();
    this.biomeAtmosphere.reset();
  }
}

export const visualsConfig = VisualsMasterConfig.getInstance();
