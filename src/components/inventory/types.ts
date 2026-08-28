/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState, EquipmentItem } from '../../types';
import { DiscardGumpData } from '../DiscardGumpModal';

export interface UnifiedInventoryPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  handleEatMeat: (foodKey: string) => void;
  handleEquipItem: (item: EquipmentItem, hand?: 'right' | 'left') => void;
  handleDiscardItem: (id: string, qty?: number) => void;
  handleDiscardMaterial: (id: string, qty?: number) => void;
  handleDiscardCatalyst: (id: string, qty?: number) => void;
  handleShiftCatalyst: (id: string) => void;
  handleUnstableReactorSurge: () => void;
  handleUnequipHelmet: () => void;
  handleUnequipArmor: () => void;
  handleUnequipBoots: () => void;
  handleUnequipWeapon: () => void;
  handleUnequipShield: () => void;
  handleUnequipGloves: () => void;
  handleUnequipAmulet: () => void;
  handleAdjustAttribute: (attr: 'str' | 'dex' | 'int' | 'cha' | 'lck', amount: number) => void;
  playSound: (soundId: string) => void;
}

export type DiscardLongPressHandler = (
  type: 'item' | 'material' | 'catalyst',
  id: string,
  name: string,
  icon: string,
  color: string | undefined,
  maxQuantity: number,
  unitWeight: number
) => void;

export type DiscardClickHandler = (
  e: React.MouseEvent,
  type: 'item' | 'material' | 'catalyst',
  id: string,
  name: string,
  icon: string,
  color: string | undefined,
  maxQuantity: number,
  unitWeight: number
) => void;

export const getItemRarityValue = (item: EquipmentItem): number => {
  const color = item.color?.toLowerCase() || '';
  if (
    color === '#f43f5e' ||
    color === '#f97316' ||
    color.includes('orange') ||
    color.includes('rose') ||
    color === '#ef4444' ||
    color === '#f87171'
  )
    return 4;
  if (color === '#a855f7' || color.includes('purple') || color === '#c084fc') return 3;
  if (color === '#38bdf8' || color.includes('blue') || color.includes('sky')) return 2;
  if (color === '#34d399' || color.includes('green') || color.includes('emerald') || color === '#10b981') return 1;
  return 0;
};

export const getFoodRarityValue = (id: string): number => {
  const FOOD_POTION_RARITY_VALUES: Record<string, number> = {
    potion_full_rejuvenation: 4,
    potion_full_rejuv: 4,
    mat_seppo_hooch: 3,
    potion_medium_hp: 2,
    potion_medium_mp: 2,
    mat_cooked_prime_meat: 2,
    mat_cooked_pie: 2,
    potion_hp: 1,
    potion_mp: 1,
    mat_cooked_fish: 1,
    mat_cooked_meat: 1,
    scroll_recall: 3,
    mat_bread: 0,
    mat_berry: 0,
    mat_beer: 0,
    mat_raw_fish: 0,
    mat_prime_meat: 0,
    mat_raw_meat: 0,
  };
  return FOOD_POTION_RARITY_VALUES[id] || 0;
};

export const getMaterialRarityValue = (id: string): number => {
  const MATERIAL_RARITY_VALUES: Record<string, number> = {
    mat_dragonscale: 4,
    mat_feybone: 3,
    mat_mithril: 3,
    mat_obsidian: 2,
    mat_skeleton_key: 2,
    mat_iron: 1,
    mat_thick_hide: 1,
    mat_lockpick: 1,
    mat_fishing_pole: 0,
    mat_wood: 0,
  };
  return MATERIAL_RARITY_VALUES[id] || 0;
};
