/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InventoryItem, InventorySlot, InventoryContainerConfig, InventoryOperationResult } from './types';

/**
 * Generic, data-agnostic Inventory Container Manager.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 * Manages item slots, stack grouping, weight boundaries, and item transfers.
 */
export class InventoryEngine {
  private slots: InventorySlot[];
  private config: InventoryContainerConfig;

  constructor(config: Partial<InventoryContainerConfig> = {}) {
    this.config = {
      capacity: config.capacity ?? 20,
      maxWeight: config.maxWeight,
      allowOverfill: config.allowOverfill ?? false
    };

    this.slots = Array.from({ length: this.config.capacity }, (_, i) => ({
      index: i,
      item: null
    }));
  }

  /**
   * Adds an item to the inventory, stacking where possible.
   */
  public addItem(item: InventoryItem): InventoryOperationResult {
    let remaining = item.quantity;
    const maxStack = item.maxStack ?? 1;

    // Check weight limit
    if (this.config.maxWeight && item.weight) {
      const currentWeight = this.getTotalWeight();
      const addedWeight = item.weight * item.quantity;
      if (!this.config.allowOverfill && currentWeight + addedWeight > this.config.maxWeight) {
        return {
          success: false,
          addedQuantity: 0,
          remainingQuantity: remaining,
          message: 'Inventory weight limit exceeded.'
        };
      }
    }

    // 1. Try to stack into existing non-full slots of the same definition
    if (maxStack > 1) {
      for (const slot of this.slots) {
        if (slot.item && slot.item.definitionId === item.definitionId) {
          const spaceInSlot = (slot.item.maxStack ?? maxStack) - slot.item.quantity;
          if (spaceInSlot > 0) {
            const toAdd = Math.min(remaining, spaceInSlot);
            slot.item.quantity += toAdd;
            remaining -= toAdd;

            if (remaining <= 0) {
              return {
                success: true,
                addedQuantity: item.quantity,
                remainingQuantity: 0,
                slotIndex: slot.index
              };
            }
          }
        }
      }
    }

    // 2. Put remaining into first available empty slot
    while (remaining > 0) {
      const emptySlot = this.slots.find(s => s.item === null);
      if (!emptySlot) {
        return {
          success: remaining < item.quantity,
          addedQuantity: item.quantity - remaining,
          remainingQuantity: remaining,
          message: 'Inventory is completely full.'
        };
      }

      const toAdd = Math.min(remaining, maxStack);
      emptySlot.item = {
        ...item,
        quantity: toAdd
      };
      remaining -= toAdd;
    }

    return {
      success: true,
      addedQuantity: item.quantity,
      remainingQuantity: 0
    };
  }

  /**
   * Removes a specific quantity of an item by definitionId or slot index
   */
  public removeItem(definitionId: string, quantity: number = 1): boolean {
    const totalAvailable = this.countItem(definitionId);
    if (totalAvailable < quantity) return false;

    let remainingToRemove = quantity;
    for (const slot of this.slots) {
      if (slot.item && slot.item.definitionId === definitionId) {
        if (slot.item.quantity <= remainingToRemove) {
          remainingToRemove -= slot.item.quantity;
          slot.item = null;
        } else {
          slot.item.quantity -= remainingToRemove;
          remainingToRemove = 0;
        }

        if (remainingToRemove <= 0) break;
      }
    }

    return true;
  }

  /**
   * Clears a specific slot index
   */
  public clearSlot(index: number): InventoryItem | null {
    if (index < 0 || index >= this.slots.length) return null;
    const item = this.slots[index].item;
    this.slots[index].item = null;
    return item;
  }

  /**
   * Retrieves item at a given slot
   */
  public getSlot(index: number): InventorySlot | undefined {
    return this.slots[index];
  }

  /**
   * Counts the total quantity of an item by definitionId
   */
  public countItem(definitionId: string): number {
    return this.slots.reduce((sum, slot) => {
      if (slot.item && slot.item.definitionId === definitionId) {
        return sum + slot.item.quantity;
      }
      return sum;
    }, 0);
  }

  /**
   * Checks whether the inventory contains at least required quantity of definitionId
   */
  public hasItem(definitionId: string, quantity: number = 1): boolean {
    return this.countItem(definitionId) >= quantity;
  }

  /**
   * Returns all occupied slots
   */
  public getOccupiedSlots(): InventorySlot[] {
    return this.slots.filter(s => s.item !== null);
  }

  /**
   * Returns all items currently held
   */
  public getItems(): InventoryItem[] {
    return this.slots.filter(s => s.item !== null).map(s => s.item!);
  }

  /**
   * Returns total current weight
   */
  public getTotalWeight(): number {
    return this.slots.reduce((total, s) => {
      if (s.item && s.item.weight) {
        return total + s.item.weight * s.item.quantity;
      }
      return total;
    }, 0);
  }

  /**
   * Checks if inventory is completely full
   */
  public isFull(): boolean {
    return this.slots.every(s => s.item !== null);
  }

  /**
   * Returns count of remaining empty slots
   */
  public getFreeSlotsCount(): number {
    return this.slots.filter(s => s.item === null).length;
  }

  /**
   * Transfers an item from this inventory to another container
   */
  public transferTo(target: InventoryEngine, definitionId: string, quantity: number = 1): boolean {
    if (!this.hasItem(definitionId, quantity)) return false;

    const sample = this.slots.find(s => s.item?.definitionId === definitionId)?.item;
    if (!sample) return false;

    const toTransfer: InventoryItem = {
      ...sample,
      quantity
    };

    const addResult = target.addItem(toTransfer);
    if (!addResult.success || addResult.remainingQuantity > 0) {
      if (addResult.addedQuantity > 0) {
        target.removeItem(definitionId, addResult.addedQuantity);
      }
      return false;
    }

    this.removeItem(definitionId, quantity);
    return true;
  }

  /**
   * Clears all slots
   */
  public clear(): void {
    for (const slot of this.slots) {
      slot.item = null;
    }
  }
}
