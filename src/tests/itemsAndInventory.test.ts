import { describe, it, expect } from 'vitest';
import {
  isScrollItem,
  consolidateStackableItems,
  addEquipmentItemToInventory,
  consumeItemFromInventory
} from '../utils/scrollUtils';
import { getCurrentWeight, getMaxWeight, WEIGHT_CONFIG } from '../utils/itemWeight';
import { EquipmentItem, WeaponBaseType } from '../types';

const createMockItem = (override: Partial<EquipmentItem>): EquipmentItem => ({
  id: 'item_1',
  name: 'Test Item',
  type: 'scroll',
  subType: 'Scroll',
  defense: 0,
  damage: 0,
  critChance: 0,
  range: 1,
  color: '#fff',
  description: 'A test scroll',
  value: 10,
  quantity: 1,
  ...override
});

describe('12.7 Item Stacking, Scroll Inventory & Overencumbrance Verification', () => {
  it('isScrollItem correctly identifies scroll items by type, subType, or name', () => {
    const scroll1 = createMockItem({ id: 's1', name: 'Scroll of Fireball', type: 'scroll', subType: 'Scroll' });
    const scroll2 = createMockItem({ id: 's2', name: 'Ancient Parchment', type: 'scroll', subType: 'Scroll' });
    const weapon = createMockItem({ id: 'w1', name: 'Steel Sword', type: 'weapon', subType: WeaponBaseType.Sword });

    expect(isScrollItem(scroll1)).toBe(true);
    expect(isScrollItem(scroll2)).toBe(true);
    expect(isScrollItem(weapon)).toBe(false);
    expect(isScrollItem(null)).toBe(false);
  });

  it('addEquipmentItemToInventory stacks identical scrolls and increments quantity', () => {
    const initialInv: EquipmentItem[] = [
      createMockItem({ id: 'scroll_fire_1', name: 'Scroll of Fireball', type: 'scroll', subType: 'Scroll', quantity: 2 })
    ];

    const newScroll = createMockItem({ id: 'scroll_fire_2', name: 'Scroll of Fireball', type: 'scroll', subType: 'Scroll', quantity: 1 });
    const updated = addEquipmentItemToInventory(initialInv, newScroll);

    expect(updated).toHaveLength(1);
    expect(updated[0].quantity).toBe(3);
  });

  it('consumeItemFromInventory decrements stack quantities or removes empty items', () => {
    const initialInv: EquipmentItem[] = [
      createMockItem({ id: 'scroll_fire_1', name: 'Scroll of Fireball', type: 'scroll', subType: 'Scroll', quantity: 3 }),
      createMockItem({ id: 'potion_hp_1', name: 'Health Potion', type: 'scroll', subType: 'Scroll', quantity: 1 })
    ];

    // Consume 1 scroll -> quantity becomes 2
    const afterOneScroll = consumeItemFromInventory(initialInv, 'scroll_fire_1', 1);
    expect(afterOneScroll.find(i => i.id === 'scroll_fire_1')?.quantity).toBe(2);

    // Consume potion (qty 1) -> item removed from array
    const afterPotion = consumeItemFromInventory(afterOneScroll, 'potion_hp_1', 1);
    expect(afterPotion.find(i => i.id === 'potion_hp_1')).toBeUndefined();
    expect(afterPotion).toHaveLength(1);
  });

  it('getCurrentWeight & getMaxWeight calculate inventory weights and max strength capacity', () => {
    const mockState = {
      playerStats: { str: 10 },
      equipmentInventory: [
        createMockItem({ id: 's1', name: 'Scroll of Fireball', type: 'scroll', subType: 'Scroll', quantity: 5 })
      ],
      inventoryMaterials: {
        mat_wood: 10 // 1.0 * 10 = 10.0 weight
      },
      inventoryCatalysts: {}
    } as any;

    const maxWeight = getMaxWeight(mockState);
    expect(maxWeight).toBe(80.0 + (10 * WEIGHT_CONFIG.strengthMultiplier)); // 120.0

    const currentWeight = getCurrentWeight(mockState);
    // 5 scrolls * 0.2 + 10 wood * 1.0 = 1.0 + 10.0 = 11.0
    expect(currentWeight).toBe(11.0);
  });
});
