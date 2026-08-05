/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, Catalyst, CatalystType, WeaponBaseType, WeaponTemplate } from '../types';
import { SanctumRelic } from '../utils/relics';
import materialsJson from './materials.json';
import catalystsJson from './catalysts.json';
import weaponTemplatesJson from './weaponTemplates.json';
import relicsJson from './relics.json';
import spellScrollsJson from './spellScrolls.json';

export const BASIC_MATERIALS: Material[] = materialsJson as unknown as Material[];

export const ELEMENTAL_CATALYSTS: Catalyst[] = (catalystsJson as any[]).map(cat => ({
  ...cat,
  type: cat.type as CatalystType
}));

export const WEAPON_TEMPLATES: { [key in WeaponBaseType]: WeaponTemplate } = {} as any;

Object.entries(weaponTemplatesJson).forEach(([key, value]) => {
  const baseType = key as WeaponBaseType;
  WEAPON_TEMPLATES[baseType] = {
    ...value,
    baseType
  } as WeaponTemplate;
});

export const RELIC_CATALOG: SanctumRelic[] = relicsJson as unknown as SanctumRelic[];

export interface SpellScrollData {
  id: string;
  name: string;
  school: string;
  tier: number;
  mpCost: number;
  description: string;
}

export const SPELL_SCROLL_CATALOG: SpellScrollData[] = spellScrollsJson as unknown as SpellScrollData[];

export function getMaterialById(id: string): Material | undefined {
  return BASIC_MATERIALS.find(mat => mat.id === id);
}

export function getCatalystById(id: string): Catalyst | undefined {
  return ELEMENTAL_CATALYSTS.find(cat => cat.id === id);
}

export function getRelicById(id: string): SanctumRelic | undefined {
  return RELIC_CATALOG.find(r => r.id === id);
}
