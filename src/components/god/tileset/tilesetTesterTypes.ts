/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MockupPaletteTheme } from '../../../canvas/MockupAtlasGenerator';

export interface PaletteThemeConfig {
  id: MockupPaletteTheme;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

export const PALETTE_THEMES: PaletteThemeConfig[] = [
  { id: 'classic', label: 'Classic Fantasy', desc: '16-bit earthen stones, verdant meadows, and steel gear', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/50' },
  { id: 'forest', label: 'Verdant Deepwood', desc: 'Lush mossy canopy, ancient pines, and emerald glades', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/50' },
  { id: 'infernal', label: 'Infernal Brimstone', desc: 'Volcanic magma stone, obsidian basalt, and hellfire embers', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/50' }
];

export const PRESET_SPRITE_SIZES = [16, 24, 32, 48, 64];

export const TEST_ENTITIES = [
  { id: 'player', label: 'Hero / Player', char: '@', defaultAnim: 'idle' },
  { id: 'warrior', label: 'Warrior', char: 'W', defaultAnim: 'walk' },
  { id: 'mage', label: 'Mage Arcane', char: 'M', defaultAnim: 'cast' },
  { id: 'rogue', label: 'Shadow Rogue', char: 'R', defaultAnim: 'attack' },
  { id: 'guard', label: 'Town Guard', char: 'g', defaultAnim: 'idle' },
  { id: 'goblin', label: 'Goblin Scout', char: 'G', defaultAnim: 'walk' },
  { id: 'skeleton', label: 'Skeleton', char: 'S', defaultAnim: 'attack' },
  { id: 'orc', label: 'Orc Berserker', char: 'O', defaultAnim: 'attack' },
  { id: 'spider', label: 'Venom Spider', char: 's', defaultAnim: 'walk' },
  { id: 'wolf', label: 'Dire Wolf', char: 'w', defaultAnim: 'walk' },
  { id: 'slime', label: 'Acid Slime', char: 'e', defaultAnim: 'idle' },
  { id: 'cat', label: 'Legendary Cat', char: 'c', defaultAnim: 'walk' }
];

export const TEST_BOSSES = [
  { id: 'dragon', label: 'Fire Drake / Dragon', size: '2x2 (64px)', anchor: '0.90' },
  { id: 'golem', label: 'Titan Stone Golem', size: '2x2 (64px)', anchor: '0.95' },
  { id: 'demon_lord', label: 'Demon Lord / Behemoth', size: '3x3 (96px)', anchor: '0.95' }
];

export const AUTOTILING_MASKS = [
  { mask: 0, label: '0: Pillar / Isolated' },
  { mask: 1, label: '1: End North' },
  { mask: 2, label: '2: End East' },
  { mask: 3, label: '3: Corner NE' },
  { mask: 4, label: '4: End South' },
  { mask: 5, label: '5: Straight NS' },
  { mask: 6, label: '6: Corner SE' },
  { mask: 7, label: '7: T-Junction NES' },
  { mask: 8, label: '8: End West' },
  { mask: 9, label: '9: Corner NW' },
  { mask: 10, label: '10: Straight EW' },
  { mask: 11, label: '11: T-Junction NEW' },
  { mask: 12, label: '12: Corner SW' },
  { mask: 13, label: '13: T-Junction NSW' },
  { mask: 14, label: '14: T-Junction SEW' },
  { mask: 15, label: '15: Crossroad 4-Way' }
];
