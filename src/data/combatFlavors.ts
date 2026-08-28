import { WeaponBaseType } from '../types';
import combatFlavorsData from './combatFlavors.json';

export interface FlavorSet {
  normal: string[];
  crit: string[];
}

export const COMBAT_FLAVOR_TEXTS: Record<WeaponBaseType, FlavorSet> = combatFlavorsData.combatFlavors as unknown as Record<WeaponBaseType, FlavorSet>;

export const FALLBACK_FLAVORS: FlavorSet = combatFlavorsData.fallbackFlavors as FlavorSet;
