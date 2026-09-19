/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ElementType = 'fire' | 'water' | 'ice' | 'shock' | 'steam' | 'poison_gas';

export interface ElementalTile {
  id: string;
  x: number;
  y: number;
  element: ElementType;
  duration: number; // turns remaining before dissipating/extinguishing
  intensity: number; // 1 to 3
  spreadCounter?: number;
  source?: 'spell' | 'environment' | 'trap' | 'combustion' | string;
}

export interface ElementalInteractionResult {
  message?: string;
  sound?: string;
  spawnVfx?: {
    x: number;
    y: number;
    text: string;
    type: 'dmg' | 'heal' | 'crit' | 'block';
  };
  explosion?: {
    x: number;
    y: number;
    radius: number;
    damage: number;
  };
}
