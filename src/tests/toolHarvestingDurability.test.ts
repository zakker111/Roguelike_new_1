import { describe, it, expect } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { TileType, EquipmentItem } from '../types';
import { harvestWorldResource } from '../utils/harvestEngine';

const createMockTool = (id: string, name: string, durability: number, maxDurability = 100): EquipmentItem => {
  return {
    id,
    name,
    type: 'weapon',
    subType: 'Axe' as any,
    defense: 0,
    damage: 5,
    critChance: 0.05,
    range: 1,
    durability,
    maxDurability,
    isTool: true,
    color: '#fff',
    description: 'Tool',
    value: 10
  };
};

describe('Tool Harvesting Durability & Broken State Enforcement', () => {
  it('allows harvesting wood when player has an unbroken hatchet equipped', () => {
    const state = createNewGameRun(123);
    const hatchet = createMockTool('axe_iron', 'Iron Hatchet', 100, 100);
    state.currentWeapon = hatchet as any;
    state.map[state.playerY][state.playerX + 1] = TileType.PineTree;

    const prevWood = state.inventoryMaterials['mat_wood'] || 0;
    const result = harvestWorldResource(
      TileType.PineTree,
      state.playerX + 1,
      state.playerY,
      state
    );

    expect(result.handled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.soundToPlay).toBe('spell');
    expect(result.newState).toBeDefined();
    expect(result.newState?.currentWeapon?.durability).toBe(80);
    expect(result.newState?.inventoryMaterials['mat_pine_log']).toBe(1);
    expect(result.newState?.inventoryMaterials['mat_wood']).toBe(prevWood + 1);
  });

  it('blocks harvesting wood when equipped hatchet is broken (0 durability)', () => {
    const state = createNewGameRun(123);
    const brokenHatchet = createMockTool('axe_iron', 'Iron Hatchet', 0, 100);
    state.currentWeapon = brokenHatchet as any;
    state.equipmentInventory = [];
    state.map[state.playerY][state.playerX + 1] = TileType.PineTree;

    const result = harvestWorldResource(
      TileType.PineTree,
      state.playerX + 1,
      state.playerY,
      state
    );

    expect(result.handled).toBe(true);
    expect(result.success).toBe(false);
    expect(result.soundToPlay).toBe('bump');
    expect(result.logType).toBe('danger');
    expect(result.logMessage).toContain('is broken (0 Durability)! You cannot chop wood with a broken hatchet/axe');
    expect(result.newState).toBeUndefined();
  });

  it('blocks mining ore when equipped pickaxe is broken (0 durability)', () => {
    const state = createNewGameRun(123);
    const brokenPickaxe = createMockTool('pick_iron', 'Iron Pickaxe', 0, 100);
    state.currentWeapon = brokenPickaxe as any;
    state.equipmentInventory = [];
    state.map[state.playerY][state.playerX + 1] = TileType.CopperVein;

    const result = harvestWorldResource(
      TileType.CopperVein,
      state.playerX + 1,
      state.playerY,
      state
    );

    expect(result.handled).toBe(true);
    expect(result.success).toBe(false);
    expect(result.soundToPlay).toBe('bump');
    expect(result.logType).toBe('danger');
    expect(result.logMessage).toContain('is broken (0 Durability)! You cannot mine ore with a broken pickaxe');
    expect(result.newState).toBeUndefined();
  });

  it('uses an unbroken hatchet from inventory if equipped weapon is broken or not a tool', () => {
    const state = createNewGameRun(123);
    const brokenHatchet = createMockTool('axe_wood', 'Crude Hatchet', 0, 50);
    const goodHatchet = createMockTool('axe_steel', 'Steel Hatchet', 80, 100);
    state.currentWeapon = brokenHatchet as any;
    state.equipmentInventory = [goodHatchet];
    state.map[state.playerY][state.playerX + 1] = TileType.BirchTree;

    const result = harvestWorldResource(
      TileType.BirchTree,
      state.playerX + 1,
      state.playerY,
      state
    );

    expect(result.handled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();
    // Inventored tool durability reduced from 80 to 60
    expect(result.newState?.equipmentInventory[0].durability).toBe(60);
    expect(result.newState?.inventoryMaterials['mat_birch_log']).toBe(1);
  });

  it('destroys tool when its durability reaches 0 on the final chop/mine', () => {
    const state = createNewGameRun(123);
    const fragileHatchet = createMockTool('axe_wood', 'Worn Hatchet', 20, 50);
    state.currentWeapon = fragileHatchet as any;
    state.map[state.playerY][state.playerX + 1] = TileType.Tree;

    const result = harvestWorldResource(
      TileType.Tree,
      state.playerX + 1,
      state.playerY,
      state
    );

    expect(result.handled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.isBroken).toBe(true);
    expect(result.logMessage).toContain('TOOL BROKE');
    expect(result.newState?.currentWeapon).toBeNull();
  });
});
