/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import shopsJson from './shops.json';

export interface ShopItemEntry {
  id: string;
  name: string;
  price?: number;
  value?: number;
  type?: string;
  subType?: string;
  defense?: number;
  damage?: number;
  critChance?: number;
  range?: number;
  color?: string;
  desc?: string;
  description?: string;
}

export const SHOPS_DATA = {
  blacksmithItems: shopsJson.blacksmithItems as ShopItemEntry[],
  merchantResources: shopsJson.merchantResources as ShopItemEntry[],
  tavernItems: shopsJson.tavernItems as ShopItemEntry[],
  apothecaryItems: shopsJson.apothecaryItems as ShopItemEntry[],
};

export function getShopItemsByType(type: 'blacksmith' | 'merchant' | 'tavern' | 'apothecary'): ShopItemEntry[] {
  switch (type) {
    case 'blacksmith':
      return SHOPS_DATA.blacksmithItems;
    case 'merchant':
      return SHOPS_DATA.merchantResources;
    case 'tavern':
      return SHOPS_DATA.tavernItems;
    case 'apothecary':
      return SHOPS_DATA.apothecaryItems;
    default:
      return [];
  }
}
