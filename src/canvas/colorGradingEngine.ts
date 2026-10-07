/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, getMoonPhase } from '../types';

export type TimeOfDayPhase = 'night' | 'dawn' | 'morning' | 'midday' | 'golden_hour' | 'twilight';
export type VibrancyMode = 'vivid' | 'cinematic' | 'natural';

export interface AtmosphericTimeProfile {
  phase: TimeOfDayPhase;
  progress: number; // 0.0 to 1.0 within phase
  sunAngle: number; // in radians (direction of sunbeams across viewport)
  godRayIntensity: number; // 0.0 to 1.0
  gradeColor: string; // Hex/rgba for ambient tone wash
  gradeAlpha: number; // Opacity factor
  highlightTint: string; // Specular highlight warmth
  shadowTint: string; // Ambient shadow tone
  ambientWarmth: number; // -1.0 (cold) to 1.0 (warm)
}

export interface BiomeColorProfile {
  primaryTint: string;
  accentTint: string;
  godRayColor: string;
  godRayDustColor: string;
  toneWeight: number; // 0.0 to 1.0
}

/**
 * Authoritative default biome tone profiles.
 * Readily customizable and extensible by developers.
 */
export const DEFAULT_BIOME_PROFILES: Record<string, BiomeColorProfile> = {
  forest: {
    primaryTint: 'rgba(34, 197, 94, 0.05)',
    accentTint: 'rgba(234, 179, 8, 0.04)',
    godRayColor: 'rgba(254, 240, 138, 0.065)',
    godRayDustColor: '#fde047',
    toneWeight: 0.8,
  },
  desert: {
    primaryTint: 'rgba(217, 119, 6, 0.07)',
    accentTint: 'rgba(251, 191, 36, 0.05)',
    godRayColor: 'rgba(254, 240, 138, 0.06)',
    godRayDustColor: '#fbbf24',
    toneWeight: 0.85,
  },
  tundra: {
    primaryTint: 'rgba(56, 189, 248, 0.06)',
    accentTint: 'rgba(224, 242, 254, 0.05)',
    godRayColor: 'rgba(240, 249, 255, 0.07)',
    godRayDustColor: '#bae6fd',
    toneWeight: 0.8,
  },
  swamp: {
    primaryTint: 'rgba(16, 185, 129, 0.06)',
    accentTint: 'rgba(101, 163, 13, 0.05)',
    godRayColor: 'rgba(217, 249, 157, 0.05)',
    godRayDustColor: '#86efac',
    toneWeight: 0.85,
  },
  volcanic: {
    primaryTint: 'rgba(220, 38, 38, 0.08)',
    accentTint: 'rgba(249, 115, 22, 0.04)',
    godRayColor: 'rgba(254, 215, 170, 0.06)',
    godRayDustColor: '#f97316',
    toneWeight: 0.9,
  },
  ruins: {
    primaryTint: 'rgba(100, 116, 139, 0.06)',
    accentTint: 'rgba(13, 148, 136, 0.04)',
    godRayColor: 'rgba(241, 245, 249, 0.05)',
    godRayDustColor: '#94a3b8',
    toneWeight: 0.75,
  },
  ocean: {
    primaryTint: 'rgba(14, 165, 233, 0.06)',
    accentTint: 'rgba(34, 197, 94, 0.03)',
    godRayColor: 'rgba(224, 242, 254, 0.06)',
    godRayDustColor: '#38bdf8',
    toneWeight: 0.8,
  },
  town: {
    primaryTint: 'rgba(245, 158, 11, 0.05)',
    accentTint: 'rgba(71, 85, 105, 0.04)',
    godRayColor: 'rgba(254, 240, 138, 0.06)',
    godRayDustColor: '#fde68a',
    toneWeight: 0.75,
  },
  crypt: {
    primaryTint: 'rgba(15, 118, 110, 0.05)',
    accentTint: 'rgba(30, 41, 59, 0.05)',
    godRayColor: 'rgba(204, 251, 241, 0.04)',
    godRayDustColor: '#5eead4',
    toneWeight: 0.7,
  },
  deep_ruins: {
    primaryTint: 'rgba(139, 92, 246, 0.06)',
    accentTint: 'rgba(56, 189, 248, 0.04)',
    godRayColor: 'rgba(224, 242, 254, 0.05)',
    godRayDustColor: '#c084fc',
    toneWeight: 0.8,
  },
  underworld: {
    primaryTint: 'rgba(239, 68, 68, 0.08)',
    accentTint: 'rgba(249, 115, 22, 0.05)',
    godRayColor: 'rgba(254, 215, 170, 0.06)',
    godRayDustColor: '#f97316',
    toneWeight: 0.9,
  },
};

/**
 * High-performance, zero-allocation Color Grading & Volumetric Sunbeams Engine.
 * Implements cinematic tone mapping, time-of-day atmospheric color grading,
 * and directional crepuscular rays (god rays) with floating atmospheric dust motes.
 */
export class ColorGradingEngine {
  private static instance: ColorGradingEngine;
  private isEnabled: boolean = true;
  private vibrancyMode: VibrancyMode = 'vivid';

  // Declarative Extensibility Registries
  private customBiomeProfiles: Map<string, BiomeColorProfile> = new Map();
  private timeProfileOverrides: Map<TimeOfDayPhase, Partial<AtmosphericTimeProfile>> = new Map();
  private godRayIntensityMultiplier: number = 1.0;
  private gradeAlphaMultiplier: number = 1.0;

  // Cached dust motes pool for god rays (zero garbage collection)
  private readonly dustMoteCount = 18;
  private dustMotes: { x: number; y: number; speed: number; size: number; phase: number }[];

  private constructor() {
    this.dustMotes = [];
    for (let i = 0; i < this.dustMoteCount; i++) {
      this.dustMotes.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.015 + Math.random() * 0.025,
        size: 0.8 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  public static getInstance(): ColorGradingEngine {
    if (!ColorGradingEngine.instance) {
      ColorGradingEngine.instance = new ColorGradingEngine();
    }
    return ColorGradingEngine.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setVibrancyMode(mode: VibrancyMode): void {
    this.vibrancyMode = mode;
  }

  public getVibrancyMode(): VibrancyMode {
    return this.vibrancyMode;
  }

  /**
   * Registers or updates a biome tone profile for custom or existing biomes.
   */
  public registerBiomeProfile(biomeKey: string, profile: BiomeColorProfile): void {
    this.customBiomeProfiles.set(biomeKey.toLowerCase(), profile);
  }

  /**
   * Overrides specific properties of a time-of-day phase profile (e.g. sunAngle or gradeColor).
   */
  public overrideTimeProfile(phase: TimeOfDayPhase, override: Partial<AtmosphericTimeProfile>): void {
    this.timeProfileOverrides.set(phase, override);
  }

  /**
   * Adjusts the overall global intensity multiplier for god rays.
   */
  public setGodRayIntensityMultiplier(multiplier: number): void {
    this.godRayIntensityMultiplier = Math.max(0, multiplier);
  }

  public getGodRayIntensityMultiplier(): number {
    return this.godRayIntensityMultiplier;
  }

  /**
   * Adjusts the overall global opacity multiplier for ambient color washes.
   */
  public setGradeAlphaMultiplier(multiplier: number): void {
    this.gradeAlphaMultiplier = Math.max(0, multiplier);
  }

  public getGradeAlphaMultiplier(): number {
    return this.gradeAlphaMultiplier;
  }

  /**
   * Resets all custom overrides and profiles back to factory defaults.
   */
  public resetCustomOverrides(): void {
    this.customBiomeProfiles.clear();
    this.timeProfileOverrides.clear();
    this.godRayIntensityMultiplier = 1.0;
    this.gradeAlphaMultiplier = 1.0;
  }

  /**
   * Evaluates the precise astronomical time-of-day phase and interpolation progress
   * from gameTime (0 to 1439 minutes; 720 = 12:00 PM).
   */
  public getTimePhase(rawMinutes: number): { phase: TimeOfDayPhase; progress: number } {
    const mins = ((rawMinutes % 1440) + 1440) % 1440;

    if (mins >= 330 && mins < 480) {
      // Dawn (05:30 to 08:00) - 150 mins
      return { phase: 'dawn', progress: (mins - 330) / 150 };
    } else if (mins >= 480 && mins < 660) {
      // Morning (08:00 to 11:00) - 180 mins
      return { phase: 'morning', progress: (mins - 480) / 180 };
    } else if (mins >= 660 && mins < 1050) {
      // Midday (11:00 to 17:30) - 390 mins
      return { phase: 'midday', progress: (mins - 660) / 390 };
    } else if (mins >= 1050 && mins < 1200) {
      // Golden Hour (17:30 to 20:00) - 150 mins
      return { phase: 'golden_hour', progress: (mins - 1050) / 150 };
    } else if (mins >= 1200 && mins < 1290) {
      // Twilight (20:00 to 21:30) - 90 mins
      return { phase: 'twilight', progress: (mins - 1200) / 90 };
    } else {
      // Night (21:30 to 05:30) - 480 mins
      const nightMins = mins >= 1290 ? mins - 1290 : mins + 150;
      return { phase: 'night', progress: nightMins / 480 };
    }
  }

  /**
   * Resolves the current atmospheric time profile including sunbeam angles and color wash.
   */
  public calculateAtmosphericProfile(gameState: GameState): AtmosphericTimeProfile {
    const gameTime = gameState.gameTime ?? 720;
    const { phase, progress } = this.getTimePhase(gameTime);

    let sunAngle = Math.PI * 0.25; // Default 45 deg angle
    let godRayIntensity = 0;
    let gradeColor = '255, 255, 255';
    let gradeAlpha = 0;
    let highlightTint = '#ffffff';
    let shadowTint = '#0f172a';
    let ambientWarmth = 0;

    switch (phase) {
      case 'dawn':
        // Sun rising in the East (upper-left to lower-right rays, ~35 to ~50 deg)
        sunAngle = 0.65 + progress * 0.25;
        godRayIntensity = 0.55 + Math.sin(progress * Math.PI) * 0.35;
        gradeColor = '251, 146, 60'; // Warm peach / amber rose
        gradeAlpha = 0.08 + Math.sin(progress * Math.PI) * 0.06;
        highlightTint = '#fed7aa';
        shadowTint = '#1e1b4b'; // Deep morning violet shadows
        ambientWarmth = 0.65;
        break;

      case 'morning':
        // Crisp warm golden daylight ascending toward midday
        sunAngle = 0.90 + progress * 0.40;
        godRayIntensity = 0.35 * (1.0 - progress * 0.6);
        gradeColor = '254, 240, 138'; // Light golden morning glow
        gradeAlpha = 0.05 * (1.0 - progress * 0.5);
        highlightTint = '#fef08a';
        shadowTint = '#0f172a';
        ambientWarmth = 0.35;
        break;

      case 'midday':
        // High noon / afternoon clear daylight - vibrant & crisp
        sunAngle = Math.PI * 0.5; // Vertical ~90 deg
        godRayIntensity = 0.15; // Subtle overhead shafts in forest/clear biomes
        gradeColor = '224, 242, 254'; // Subtle azure daylight clarity
        gradeAlpha = 0.03;
        highlightTint = '#ffffff';
        shadowTint = '#090d16';
        ambientWarmth = 0.05;
        break;

      case 'golden_hour':
        // Sun setting in the West (upper-right to lower-left rays, ~130 to ~150 deg)
        sunAngle = 2.10 + progress * 0.35;
        godRayIntensity = 0.65 + Math.sin(progress * Math.PI) * 0.35;
        gradeColor = '245, 158, 11'; // Honey-gold, amber and vermilion
        gradeAlpha = 0.09 + Math.sin(progress * Math.PI) * 0.07;
        highlightTint = '#fde68a';
        shadowTint = '#31102f'; // Warm plum / crimson shadows
        ambientWarmth = 0.85;
        break;

      case 'twilight':
        // Fading twilight amethyst into royal nocturnal blue
        sunAngle = 2.50;
        godRayIntensity = 0.10 * (1.0 - progress);
        gradeColor = '139, 92, 246'; // Amethyst violet
        gradeAlpha = 0.08 * (1.0 - progress * 0.3);
        highlightTint = '#c084fc';
        shadowTint = '#0b0f19';
        ambientWarmth = -0.30;
        break;

      case 'night':
        // Deep nocturnal moonlit indigo (high-contrast, making torches/fire pop)
        sunAngle = 1.85;
        godRayIntensity = 0;
        const moon = getMoonPhase(gameState.playerStats?.turnsPlayed || 0);
        if (moon.id === 'full_moon') {
          gradeColor = '165, 180, 252'; // Ethereal moonlit periwinkle
          gradeAlpha = 0.07;
          highlightTint = '#e0e7ff';
          shadowTint = '#020617';
        } else if (moon.id === 'blood_moon' || (gameState.bloodMoonTurnsLeft && gameState.bloodMoonTurnsLeft > 0)) {
          gradeColor = '220, 38, 38'; // Blood moon crimson gloom
          gradeAlpha = 0.12;
          highlightTint = '#f87171';
          shadowTint = '#2a0404';
        } else {
          gradeColor = '30, 58, 138'; // Deep nocturnal navy
          gradeAlpha = 0.05;
          highlightTint = '#93c5fd';
          shadowTint = '#020617';
        }
        ambientWarmth = -0.75;
        break;
    }

    // Weather modifications
    if (gameState.weather === 'rainy' || (gameState.weather as string) === 'stormy') {
      godRayIntensity = 0; // Dense storm clouds extinguish sunbeams
      gradeColor = '56, 189, 248'; // Wet storm azure
      gradeAlpha = Math.max(gradeAlpha, 0.06);
      ambientWarmth = -0.4;
    } else if (gameState.weather === 'foggy') {
      godRayIntensity *= 0.4; // Soft diffused light
      gradeColor = '203, 213, 225'; // Misty silver
      gradeAlpha = 0.08;
    } else if (gameState.weather === 'blizzard') {
      godRayIntensity = 0;
      gradeColor = '224, 242, 254'; // Glacial ice white
      gradeAlpha = 0.09;
      ambientWarmth = -0.9;
    } else if (gameState.weather === 'ashfall') {
      godRayIntensity *= 0.3;
      gradeColor = '180, 83, 9'; // Volcanic ash ochre
      gradeAlpha = 0.08;
      ambientWarmth = 0.5;
    }

    // Apply custom time overrides if registered
    const override = this.timeProfileOverrides.get(phase);
    if (override) {
      if (override.sunAngle !== undefined) sunAngle = override.sunAngle;
      if (override.godRayIntensity !== undefined) godRayIntensity = override.godRayIntensity;
      if (override.gradeColor !== undefined) gradeColor = override.gradeColor;
      if (override.gradeAlpha !== undefined) gradeAlpha = override.gradeAlpha;
      if (override.highlightTint !== undefined) highlightTint = override.highlightTint;
      if (override.shadowTint !== undefined) shadowTint = override.shadowTint;
      if (override.ambientWarmth !== undefined) ambientWarmth = override.ambientWarmth;
    }

    // Vibrancy and global multipliers
    const vibrancyMultiplier = this.vibrancyMode === 'vivid' ? 1.35 : this.vibrancyMode === 'cinematic' ? 1.0 : 0.70;
    gradeAlpha *= vibrancyMultiplier * this.gradeAlphaMultiplier;
    godRayIntensity *= this.godRayIntensityMultiplier;

    return {
      phase,
      progress,
      sunAngle,
      godRayIntensity,
      gradeColor,
      gradeAlpha,
      highlightTint,
      shadowTint,
      ambientWarmth,
    };
  }

  /**
   * Resolves the distinctive color grade profile according to biome and dungeon depth.
   */
  public getBiomeProfile(gameState: GameState): BiomeColorProfile {
    // 1. Subterranean Dungeons
    if (!gameState.isOverworld) {
      const depth = gameState.currentDungeonDepth || gameState.dungeonLevel || 1;
      if (depth >= 6) {
        return this.customBiomeProfiles.get('underworld') || DEFAULT_BIOME_PROFILES.underworld;
      } else if (depth >= 4) {
        return this.customBiomeProfiles.get('deep_ruins') || DEFAULT_BIOME_PROFILES.deep_ruins;
      } else {
        return this.customBiomeProfiles.get('crypt') || DEFAULT_BIOME_PROFILES.crypt;
      }
    }

    // 2. Overworld Biomes
    const biome = (gameState.biome || 'forest').toLowerCase();

    // Check custom registrations first
    if (this.customBiomeProfiles.has(biome)) {
      return this.customBiomeProfiles.get(biome)!;
    }

    if (biome.includes('desert') || biome.includes('dunes') || biome.includes('badlands')) {
      return DEFAULT_BIOME_PROFILES.desert;
    } else if (biome.includes('tundra') || biome.includes('snow') || biome.includes('glacier')) {
      return DEFAULT_BIOME_PROFILES.tundra;
    } else if (biome.includes('swamp') || biome.includes('marsh') || biome.includes('bog')) {
      return DEFAULT_BIOME_PROFILES.swamp;
    } else if (biome.includes('volcan') || biome.includes('infernal') || biome.includes('ash')) {
      return DEFAULT_BIOME_PROFILES.volcanic;
    } else if (biome.includes('ruin') || biome.includes('ruined_city')) {
      return DEFAULT_BIOME_PROFILES.ruins;
    } else if (biome.includes('ocean') || biome.includes('harbor') || biome.includes('coast')) {
      return DEFAULT_BIOME_PROFILES.ocean;
    } else if (biome.includes('town') || biome.includes('castle')) {
      return DEFAULT_BIOME_PROFILES.town;
    } else {
      // Default: Verdant Woodlands
      return DEFAULT_BIOME_PROFILES.forest;
    }
  }

  /**
   * Master render method: executes color grading tone mapping and volumetric god rays.
   */
  public renderColorGradingPass(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number },
    gameState: GameState
  ): void {
    if (!this.isEnabled) return;
    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    const timeProfile = this.calculateAtmosphericProfile(gameState);
    const biomeProfile = this.getBiomeProfile(gameState);

    // 1. Biome & Time-of-Day Ambient Tone Mapping Wash
    this.renderAmbientToneWash(ctx, dimensions, timeProfile, biomeProfile);

    // 2. Volumetric Sunbeams / Crepuscular God Rays
    if (timeProfile.godRayIntensity > 0.02) {
      this.renderVolumetricGodRays(ctx, dimensions, timeProfile, biomeProfile);
    }
  }

  /**
   * Renders the ambient chromatic tone wash. Uses hardware-accelerated 'soft-light'
   * or low-alpha 'source-over' to saturate and tint the world harmoniously.
   */
  private renderAmbientToneWash(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number },
    timeProfile: AtmosphericTimeProfile,
    biomeProfile: BiomeColorProfile
  ): void {
    const { width, height } = dimensions;
    ctx.save();

    // 1. Time-of-Day Atmospheric Hue Wash
    if (timeProfile.gradeAlpha > 0.005) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = `rgba(${timeProfile.gradeColor}, ${timeProfile.gradeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm highlight top-to-bottom gradient during sunrise/golden hour
      if (timeProfile.ambientWarmth > 0.2) {
        ctx.globalCompositeOperation = 'screen';
        const warmGrad = ctx.createLinearGradient(0, 0, 0, height);
        const topAlpha = (timeProfile.ambientWarmth * 0.06).toFixed(3);
        warmGrad.addColorStop(0, `rgba(${timeProfile.gradeColor}, ${topAlpha})`);
        warmGrad.addColorStop(0.65, `rgba(${timeProfile.gradeColor}, ${(parseFloat(topAlpha) * 0.3).toFixed(3)})`);
        warmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = warmGrad;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 2. Biome Tone Tint Overlay
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = biomeProfile.primaryTint;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  /**
   * Renders volumetric crepuscular rays (god rays) streaming diagonally across the scene.
   */
  private renderVolumetricGodRays(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number },
    timeProfile: AtmosphericTimeProfile,
    biomeProfile: BiomeColorProfile
  ): void {
    const { width, height } = dimensions;
    const now = Date.now() * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Harmonic slow atmospheric breathing
    const rayBreath = Math.sin(now * 0.4) * 0.015;
    const baseAlpha = Math.max(0, timeProfile.godRayIntensity * 0.06 + rayBreath);

    // Compute sun origin based on angle
    const angle = timeProfile.sunAngle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Render 4 distinctive, soft light shafts
    const shaftCount = 4;
    for (let i = 0; i < shaftCount; i++) {
      const shaftPhase = (i * 0.28) + Math.sin(now * 0.18 + i) * 0.03;
      const rayWidth = 65 + i * 35;
      
      // Calculate origin along the top/left edge
      const originX = (width * (0.2 + (i * 0.22))) + Math.cos(now * 0.1 + i) * 20;
      const originY = -30;

      // Project shaft along angle
      const projLength = Math.hypot(width, height) * 1.2;
      const endX = originX + cosA * projLength + shaftPhase * 40;
      const endY = originY + sinA * projLength;

      const shaftGrad = ctx.createLinearGradient(originX, originY, endX, endY);
      const alphaStr = (baseAlpha * (0.8 + (i % 2) * 0.4)).toFixed(3);
      shaftGrad.addColorStop(0, biomeProfile.godRayColor.replace(/[\d.]+\)$/, `${alphaStr})`));
      shaftGrad.addColorStop(0.35, biomeProfile.godRayColor.replace(/[\d.]+\)$/, `${(parseFloat(alphaStr) * 0.7).toFixed(3)})`));
      shaftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = shaftGrad;
      ctx.beginPath();
      // Trapezoid beam broadening as it traverses the atmosphere
      ctx.moveTo(originX - rayWidth * 0.4, originY);
      ctx.lineTo(originX + rayWidth * 0.4, originY);
      ctx.lineTo(endX + rayWidth * 1.4, endY);
      ctx.lineTo(endX - rayWidth * 1.4, endY);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Floating Sunbeam Dust Motes drifting through illuminated shafts
    ctx.fillStyle = biomeProfile.godRayDustColor;
    for (let m = 0; m < this.dustMotes.length; m++) {
      const mote = this.dustMotes[m];
      const curX = ((mote.x * width + now * 12 * mote.speed) % (width + 40)) - 20;
      const curY = ((mote.y * height + Math.sin(now * 1.2 + mote.phase) * 18) % (height + 40)) - 20;
      const moteAlpha = Math.max(0, 0.25 + Math.sin(now * 2.5 + mote.phase) * 0.18) * timeProfile.godRayIntensity;

      ctx.globalAlpha = moteAlpha;
      ctx.beginPath();
      ctx.arc(curX, curY, mote.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export const colorGradingEngine = ColorGradingEngine.getInstance();
