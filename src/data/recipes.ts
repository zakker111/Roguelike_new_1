/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import recipesData from './recipes.json';

export interface CookingRecipe {
  id: string;
  name: string;
  description: string;
  restoringHp: number;
  restoringMp: number;
  materials: { [matId: string]: number };
  catalysts: { [catId: string]: number };
  buff: {
    name: string;
    description: string;
    atkBonus: number;
    defBonus: number;
    critBonus: number;
    speedBonus: number;
    turnsRemaining: number;
  } | null;
}

export interface BrewingRecipe {
  id: string;
  name: string;
  description: string;
  requiredTier: number;
  restoringHp: number;
  restoringMp: number;
  materials: { [matId: string]: number };
  catalysts: { [catId: string]: number };
  permanentStats: {
    str?: number;
    int?: number;
    def?: number;
    lck?: number;
    exhaustionReduction?: number;
  };
}

export const COOKING_RECIPES: CookingRecipe[] = recipesData.cookingRecipes as CookingRecipe[];
export const BREWING_RECIPES: BrewingRecipe[] = recipesData.brewingRecipes as BrewingRecipe[];
