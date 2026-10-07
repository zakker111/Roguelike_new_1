/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme, ThemePaletteColors } from './types';

export const THEME_PALETTES: Record<string, ThemePaletteColors> = {
  classic: {
    wallBase: '#475569',
    wallHighlight: '#94a3b8',
    wallShadow: '#1e293b',
    floor: '#1e293b',
    floorAlt: '#334155',
    grass: '#15803d',
    grassTuft: '#22c55e',
    water: '#1d4ed8',
    waterHighlight: '#60a5fa',
    waterFoam: '#e0f2fe',
    path: '#64748b',
    sand: '#d97706',
    snow: '#e2e8f0',
    lava: '#dc2626',
    wood: '#78350f',
    woodLight: '#b45309',
    gold: '#fbbf24',
    crystal: '#38bdf8',
  },
  forest: {
    wallBase: '#3f3f46',
    wallHighlight: '#71717a',
    wallShadow: '#18181b',
    floor: '#292524',
    floorAlt: '#44403c',
    grass: '#166534',
    grassTuft: '#4ade80',
    water: '#0e7490',
    waterHighlight: '#22d3ee',
    waterFoam: '#cffafe',
    path: '#78716c',
    sand: '#b45309',
    snow: '#f1f5f9',
    lava: '#b91c1c',
    wood: '#57300a',
    woodLight: '#92400e',
    gold: '#f59e0b',
    crystal: '#10b981',
  },
  infernal: {
    wallBase: '#262626',
    wallHighlight: '#7f1d1d',
    wallShadow: '#0a0a0a',
    floor: '#171717',
    floorAlt: '#27272a',
    grass: '#3f1a0e',
    grassTuft: '#b45309',
    water: '#7f1d1d',
    waterHighlight: '#f87171',
    waterFoam: '#fca5a5',
    path: '#451a03',
    sand: '#78350f',
    snow: '#52525b',
    lava: '#ef4444',
    wood: '#450a0a',
    woodLight: '#991b1b',
    gold: '#f97316',
    crystal: '#dc2626',
  },
};

export function registerThemePalette(themeName: string, colors: ThemePaletteColors): void {
  THEME_PALETTES[themeName] = colors;
}

export function getThemePalette(theme: string = 'classic'): ThemePaletteColors {
  return THEME_PALETTES[theme] || THEME_PALETTES.classic;
}
