/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import townTemplatesJson from './townTemplates.json';
import structuresJson from './structures.json';

export interface TownSquareTemplate {
  id: string;
  name: string;
  grid: string[];
  legend: Record<string, string>;
}

export const TOWN_SQUARES: TownSquareTemplate[] = (townTemplatesJson.townSquares || []) as unknown as TownSquareTemplate[];
export const BUILDING_INTERIORS = townTemplatesJson.buildingInteriors || {};
export const TOWN_LAYOUTS = townTemplatesJson.townLayouts || [];
export const STRUCTURES_PRESETS = structuresJson;

export function getTownSquareById(id: string): TownSquareTemplate | undefined {
  return TOWN_SQUARES.find(sq => sq.id === id);
}
