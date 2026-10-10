/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal inventory item instance
 */
export interface InventoryItem {
  id: string; // unique instance ID or definition ID
  definitionId: string;
  name: string;
  quantity: number;
  maxStack?: number; // default 1 (unstackable)
  weight?: number; // default 0
  value?: number;
  tags?: string[];
  customData?: Record<string, any>;
}

/**
 * Inventory container slot
 */
export interface InventorySlot {
  index: number;
  item: InventoryItem | null;
}

/**
 * Configuration options for an inventory container
 */
export interface InventoryContainerConfig {
  capacity: number; // max slots, e.g. 20
  maxWeight?: number; // optional weight limit
  allowOverfill?: boolean;
}

/**
 * Result returned when attempting to add or transfer items
 */
export interface InventoryOperationResult {
  success: boolean;
  addedQuantity: number;
  remainingQuantity: number;
  slotIndex?: number;
  message?: string;
}
