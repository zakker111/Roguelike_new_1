import { EquipmentItem } from '../types';

/**
 * Helper to check if an EquipmentItem is a consumable scroll.
 */
export function isScrollItem(item: EquipmentItem | null | undefined): boolean {
  if (!item) return false;
  return item.subType === 'Scroll' || item.type === 'scroll' || item.name.toLowerCase().includes('scroll');
}

/**
 * Consolidates all scroll stacks in an inventory array.
 * Merges scrolls with identical names into single entries with combined quantity.
 */
export function consolidateStackableItems(inventory: EquipmentItem[]): EquipmentItem[] {
  if (!inventory) return [];
  const result: EquipmentItem[] = [];

  for (const item of inventory) {
    if (isScrollItem(item)) {
      const matchIndex = result.findIndex(r => isScrollItem(r) && r.name === item.name);
      if (matchIndex !== -1) {
        const existing = result[matchIndex];
        result[matchIndex] = {
          ...existing,
          quantity: (existing.quantity || 1) + (item.quantity || 1)
        };
      } else {
        result.push({
          ...item,
          quantity: item.quantity || 1
        });
      }
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Adds an EquipmentItem to inventory. Stacks scrolls automatically.
 */
export function addEquipmentItemToInventory(inventory: EquipmentItem[], newItem: EquipmentItem): EquipmentItem[] {
  const currentInv = inventory ? [...inventory] : [];
  
  if (isScrollItem(newItem)) {
    const existingIndex = currentInv.findIndex(
      it => isScrollItem(it) && (it.name === newItem.name || it.id.split('_')[0] === newItem.id.split('_')[0])
    );
    if (existingIndex !== -1) {
      const existing = currentInv[existingIndex];
      const curQty = existing.quantity || 1;
      const addQty = newItem.quantity || 1;
      currentInv[existingIndex] = {
        ...existing,
        quantity: curQty + addQty
      };
      return currentInv;
    }
  }

  return [...currentInv, { ...newItem, quantity: newItem.quantity || 1 }];
}

/**
 * Consumes 'amount' units from a stackable item in inventory.
 * If quantity <= amount (or 1), removes the item entry entirely.
 */
export function consumeItemFromInventory(inventory: EquipmentItem[], itemId: string, amount: number = 1): EquipmentItem[] {
  if (!inventory) return [];
  const target = inventory.find(i => i.id === itemId);
  if (!target) return inventory;

  const currentQty = target.quantity || 1;
  if (currentQty <= amount) {
    return inventory.filter(i => i.id !== itemId);
  }

  return inventory.map(i => {
    if (i.id === itemId) {
      return {
        ...i,
        quantity: currentQty - amount
      };
    }
    return i;
  });
}
