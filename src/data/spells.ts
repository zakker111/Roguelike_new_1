/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import spellsCatalogJson from './spellsCatalog.json';

export interface SpellDefinition {
  id: string;
  name: string;
  icon: string;
  manaCost: number;
  damageMultiplier: number;
  element: 'Fire' | 'Frost' | 'Lightning' | 'Holy' | 'Dark' | 'Physical';
  description: string;
  effectDescription: string;
}

export const SPELLS_CATALOG: SpellDefinition[] = spellsCatalogJson as unknown as SpellDefinition[];

export function getSpellById(id: string): SpellDefinition | undefined {
  return SPELLS_CATALOG.find(s => s.id === id);
}

export function getSpellsByElement(element: string): SpellDefinition[] {
  return SPELLS_CATALOG.filter(s => s.element.toLowerCase() === element.toLowerCase());
}
