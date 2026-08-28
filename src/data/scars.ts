/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import scarsJson from './scars.json';

export interface ScarDefinition {
  name: string;
  description: string;
  icon: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  freshEffect: string;
  healedEffect: string;
  freshModifiers: {
    str?: number;
    dex?: number;
    int?: number;
    cha?: number;
    lck?: number;
    atk?: number;
    def?: number;
    hp?: number;
    maxHp?: number;
    mana?: number;
    maxMana?: number;
  };
  healedModifiers: {
    str?: number;
    dex?: number;
    int?: number;
    cha?: number;
    lck?: number;
    atk?: number;
    def?: number;
    hp?: number;
    maxHp?: number;
    mana?: number;
    maxMana?: number;
  };
}

export const SCARS_CATALOG: ScarDefinition[] = scarsJson as unknown as ScarDefinition[];

export function getScarByName(name: string): ScarDefinition | undefined {
  return SCARS_CATALOG.find(s => s.name.toLowerCase() === name.toLowerCase());
}

export function getRandomScar(): ScarDefinition {
  const index = Math.floor(Math.random() * SCARS_CATALOG.length);
  return SCARS_CATALOG[index];
}
