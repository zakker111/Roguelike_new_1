/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  getItemRarityValue,
  getFoodRarityValue,
  getMaterialRarityValue,
  HeroBiometricsCard,
  EquipmentPaperdoll,
  CombatStatsSummary,
  BackpackSlotGrid,
  InventoryWeightBar,
  InventoryFilterBar,
  AlliesRosterView,
  GearInventoryGrid,
  ProvisionsInventoryGrid,
  MaterialsInventoryGrid,
  AlchemicalTransmuterPanel,
  EATABLES_CATALOG,
  CRAFTING_MATERIALS_LIST,
  ELEMENTAL_CATALYSTS_LIST,
} from '../components/inventory';
import { UnifiedInventoryPanel } from '../components/UnifiedInventoryPanel';
import { EquipmentItem, WeaponBaseType } from '../types';

describe('Inventory Sub-Components Decoupling & Rarity Evaluation', () => {
  it('exports all decoupled subcomponents properly', () => {
    expect(HeroBiometricsCard).toBeDefined();
    expect(EquipmentPaperdoll).toBeDefined();
    expect(CombatStatsSummary).toBeDefined();
    expect(BackpackSlotGrid).toBeDefined();
    expect(InventoryWeightBar).toBeDefined();
    expect(InventoryFilterBar).toBeDefined();
    expect(AlliesRosterView).toBeDefined();
    expect(GearInventoryGrid).toBeDefined();
    expect(ProvisionsInventoryGrid).toBeDefined();
    expect(MaterialsInventoryGrid).toBeDefined();
    expect(AlchemicalTransmuterPanel).toBeDefined();
    expect(UnifiedInventoryPanel).toBeDefined();
  });

  it('validates food, material and catalyst catalog definitions', () => {
    expect(EATABLES_CATALOG.length).toBeGreaterThanOrEqual(15);
    expect(EATABLES_CATALOG.some((item) => item.id === 'mat_bread')).toBe(true);
    expect(EATABLES_CATALOG.some((item) => item.id === 'scroll_recall')).toBe(true);

    expect(CRAFTING_MATERIALS_LIST.length).toBeGreaterThanOrEqual(10);
    expect(CRAFTING_MATERIALS_LIST.some((mat) => mat.id === 'mat_iron')).toBe(true);

    expect(ELEMENTAL_CATALYSTS_LIST.length).toBe(5);
    expect(ELEMENTAL_CATALYSTS_LIST.some((cat) => cat.id === 'cat_fire')).toBe(true);
  });

  it('getItemRarityValue categorizes items correctly based on colors', () => {
    const legendaryItem: EquipmentItem = {
      id: 'i1',
      name: 'Dragon Blade',
      type: 'weapon',
      subType: WeaponBaseType.Sword,
      damage: 50,
      defense: 0,
      critChance: 0.2,
      range: 1,
      color: '#f43f5e',
      description: 'Legendary sword',
      value: 500,
    };
    expect(getItemRarityValue(legendaryItem)).toBe(4);

    const epicItem: EquipmentItem = {
      ...legendaryItem,
      color: '#a855f7',
    };
    expect(getItemRarityValue(epicItem)).toBe(3);

    const rareItem: EquipmentItem = {
      ...legendaryItem,
      color: '#38bdf8',
    };
    expect(getItemRarityValue(rareItem)).toBe(2);

    const uncommonItem: EquipmentItem = {
      ...legendaryItem,
      color: '#34d399',
    };
    expect(getItemRarityValue(uncommonItem)).toBe(1);

    const commonItem: EquipmentItem = {
      ...legendaryItem,
      color: '#ffffff',
    };
    expect(getItemRarityValue(commonItem)).toBe(0);
  });

  it('getFoodRarityValue identifies food & potion tiers properly', () => {
    expect(getFoodRarityValue('potion_full_rejuvenation')).toBe(4);
    expect(getFoodRarityValue('mat_seppo_hooch')).toBe(3);
    expect(getFoodRarityValue('scroll_recall')).toBe(3);
    expect(getFoodRarityValue('potion_medium_hp')).toBe(2);
    expect(getFoodRarityValue('mat_cooked_fish')).toBe(1);
    expect(getFoodRarityValue('mat_bread')).toBe(0);
    expect(getFoodRarityValue('unknown_food')).toBe(0);
  });

  it('getMaterialRarityValue identifies resource tiers properly', () => {
    expect(getMaterialRarityValue('mat_dragonscale')).toBe(4);
    expect(getMaterialRarityValue('mat_mithril')).toBe(3);
    expect(getMaterialRarityValue('mat_obsidian')).toBe(2);
    expect(getMaterialRarityValue('mat_iron')).toBe(1);
    expect(getMaterialRarityValue('mat_wood')).toBe(0);
    expect(getMaterialRarityValue('unknown_mat')).toBe(0);
  });
});
