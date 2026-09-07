/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GlyphElement = 'Fire' | 'Frost' | 'Lightning' | 'Void' | 'Arcane' | 'Holy';

export interface GlyphNode {
  id: number;
  x: number; // 0 to 100
  y: number; // 0 to 100
  label: string;
  isDrifting?: boolean;
  driftSpeed?: number;
  driftRadius?: number;
  decaySeconds?: number;
  isHarmonicAnchor?: boolean;
}

export interface GlyphDefinition {
  id: string;
  name: string;
  element: GlyphElement;
  tier: 1 | 2 | 3;
  description: string;
  flavorQuote: string;
  nodes: GlyphNode[];
  targetSequence: number[]; // Ordered node IDs
  surgeThreshold?: number; // % instability at which an elemental surge triggers
  surgeEffect?: 'flame_wave' | 'cryo_lock' | 'static_discharge' | 'void_collapse' | 'mana_whirl' | 'holy_judgment';
  harmonicResonanceToleranceMs?: number; // ms window for rhythm/tempo bonus
}

export type GlyphQualityOutcome = 'flawless' | 'stable' | 'mishap';

export interface GlyphScribingResult {
  glyphId: string;
  glyphName: string;
  element: GlyphElement;
  accuracyScore: number; // 0 to 100%
  instabilityReached: number; // 0 to 100%
  timeTakenMs: number;
  outcome: GlyphQualityOutcome;
  isMasterwork: boolean;
  bonusPowerPct: number;
  manaDiscountPct: number;
  harmonicChainsAchieved?: number;
  surgesSurmounted?: number;
}
