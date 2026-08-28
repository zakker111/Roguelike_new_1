/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import decorTemplatesJson from './decorTemplates.json';

export interface DecorPropEntry {
  type: string;
  char: string;
  name: string;
  color: string;
  description: string;
  actionLabel: string;
  interaction: string;
}

export const DECOR_PROPS = {
  dungeon: decorTemplatesJson.dungeon as DecorPropEntry[],
  ruins: decorTemplatesJson.ruins as DecorPropEntry[],
  town: decorTemplatesJson.town as DecorPropEntry[],
};

export function getDecorPropsByCategory(category: 'dungeon' | 'ruins' | 'town'): DecorPropEntry[] {
  return DECOR_PROPS[category] || [];
}
