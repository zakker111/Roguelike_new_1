/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import glyphMatricesJson from './glyphMatrices.json';
import { GlyphDefinition, GlyphElement } from '../types/minigames/glyphGame';

export const GLYPH_MATRICES: GlyphDefinition[] = glyphMatricesJson as unknown as GlyphDefinition[];

export function getGlyphById(id: string): GlyphDefinition | undefined {
  return GLYPH_MATRICES.find(g => g.id === id);
}

export function getGlyphsByElement(element: GlyphElement): GlyphDefinition[] {
  return GLYPH_MATRICES.filter(g => g.element.toLowerCase() === element.toLowerCase());
}

export function getGlyphsByTier(tier: number): GlyphDefinition[] {
  return GLYPH_MATRICES.filter(g => g.tier === tier);
}

export function getGlyphForSpellElement(element: string, tier: number = 1): GlyphDefinition {
  const match = GLYPH_MATRICES.find(g => g.element.toLowerCase() === element.toLowerCase() && g.tier === tier);
  if (match) return match;
  const anyElementMatch = GLYPH_MATRICES.find(g => g.element.toLowerCase() === element.toLowerCase());
  return anyElementMatch || GLYPH_MATRICES[0];
}
