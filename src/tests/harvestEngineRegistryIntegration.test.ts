/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { TileType, EquipmentItem } from '../types';
import { harvestWorldResource } from '../utils/harvestEngine';
import { registerCustomTile, isTileHarvestable, getTileHarvestTool, getTileHarvestYield } from '../world/tileRegistry';

const createMockTool = (id: string, name: string, subType: 'Axe' | 'Pickaxe', durability = 100): EquipmentItem => {
  return {
    id,
    name,
    type: 'weapon',
    subType: subType as any,
    defense: 0,
    damage: 5,
    critChance: 0.05,
    range: 1,
    durability,
    maxDurability: 100,
    isTool: true,
    color: '#fff',
    description: 'Tool',
    value: 10,
  };
};

describe('Harvest Engine & Tile Registry Declarative Integration', () => {
  it('correctly identifies harvestable tiles and their tools from tileRegistry', () => {
    expect(isTileHarvestable(TileType.Tree)).toBe(true);
    expect(getTileHarvestTool(TileType.Tree)).toBe('hatchet');
    expect(getTileHarvestYield(TileType.Tree)?.materialId).toBe('mat_wood');

    expect(isTileHarvestable(TileType.CopperVein)).toBe(true);
    expect(getTileHarvestTool(TileType.CopperVein)).toBe('pickaxe');
    expect(getTileHarvestYield(TileType.CopperVein)?.materialId).toBe('mat_copper_ore');

    expect(isTileHarvestable(TileType.Wall)).toBe(false);
    expect(getTileHarvestTool(TileType.Wall)).toBeUndefined();
  });

  it('rejects harvesting non-harvestable tiles like walls and floor', () => {
    const state = createNewGameRun(123);
    const axe = createMockTool('axe_test', 'Test Axe', 'Axe');
    state.currentWeapon = axe as any;

    const wallResult = harvestWorldResource(TileType.Wall, 5, 5, state);
    expect(wallResult.handled).toBe(false);
    expect(wallResult.success).toBe(false);

    const floorResult = harvestWorldResource(TileType.Floor, 5, 5, state);
    expect(floorResult.handled).toBe(false);
    expect(floorResult.success).toBe(false);
  });

  it('awards both primary and secondary yields as declared in TileDefinition', () => {
    const state = createNewGameRun(123);
    const axe = createMockTool('axe_test', 'Test Axe', 'Axe');
    state.currentWeapon = axe as any;
    const targetX = state.playerX + 1;
    const targetY = state.playerY;
    state.map[targetY][targetX] = TileType.PineTree;

    const prevWood = state.inventoryMaterials['mat_wood'] || 0;
    const prevPine = state.inventoryMaterials['mat_pine_log'] || 0;

    const result = harvestWorldResource(TileType.PineTree, targetX, targetY, state);
    expect(result.handled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.newState?.inventoryMaterials['mat_pine_log']).toBe(prevPine + 1);
    expect(result.newState?.inventoryMaterials['mat_wood']).toBe(prevWood + 1);
    expect(result.newState?.map[targetY][targetX]).toBe(TileType.TreeStump);
  });

  it('supports dynamically registered custom harvestable tiles without modifying harvestEngine', () => {
    const customTileId = 'MithrilVein' as any;
    registerCustomTile({
      id: customTileId,
      name: 'Glowing Mithril Lode',
      defaultChar: '♦',
      defaultTileColor: '#1e1b4b',
      defaultGlyphColor: '#818cf8',
      isObstacle: true,
      isHarvestable: true,
      harvestTool: 'pickaxe',
      harvestYield: {
        materialId: 'mat_mithril_ore',
        name: 'Pure Mithril Ore ✦',
        count: 2,
      },
    });

    expect(isTileHarvestable(customTileId)).toBe(true);
    expect(getTileHarvestTool(customTileId)).toBe('pickaxe');

    const state = createNewGameRun(123);
    const pickaxe = createMockTool('pick_test', 'Test Pickaxe', 'Pickaxe');
    state.currentWeapon = pickaxe as any;
    const targetX = state.playerX + 1;
    const targetY = state.playerY;
    state.map[targetY][targetX] = customTileId;

    const result = harvestWorldResource(customTileId, targetX, targetY, state);
    expect(result.handled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.newState?.inventoryMaterials['mat_mithril_ore']).toBe(2);
    expect(result.logMessage).toContain('Pure Mithril Ore ✦');
  });
});
