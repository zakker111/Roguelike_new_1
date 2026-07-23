/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, Catalyst, CatalystType, WeaponBaseType, WeaponTemplate } from '../types';
import materialsJson from '../data/materials.json';
import catalystsJson from '../data/catalysts.json';
import weaponTemplatesJson from '../data/weaponTemplates.json';

export const BASIC_MATERIALS: Material[] = materialsJson as unknown as Material[];

export const ELEMENTAL_CATALYSTS: Catalyst[] = (catalystsJson as any[]).map(cat => ({
  ...cat,
  type: cat.type as CatalystType
}));

export const WEAPON_TEMPLATES: { [key in WeaponBaseType]: WeaponTemplate } = {} as any;

// Populate weapon templates with proper enum keys
Object.entries(weaponTemplatesJson).forEach(([key, value]) => {
  const baseType = key as WeaponBaseType;
  WEAPON_TEMPLATES[baseType] = {
    ...value,
    baseType
  } as WeaponTemplate;
});

