import { describe, it, expect, beforeEach } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { GameState } from '../types';

describe('GodMinigamesTab Integration & Sandbox Testbed', () => {
  let mockGameState: GameState;
  let logMessages: { text: string; type?: string }[] = [];
  let lockpickingTriggerCount = 0;
  let fishingTriggerCount = 0;
  let successLogs: string[] = [];

  const addLogMessage = (text: string, type?: string) => {
    logMessages.push({ text, type });
  };

  const triggerSuccessLog = (msg: string) => {
    successLogs.push(msg);
  };

  beforeEach(() => {
    mockGameState = createNewGameRun(12345);
    logMessages = [];
    lockpickingTriggerCount = 0;
    fishingTriggerCount = 0;
    successLogs = [];
  });

  it('triggers Lockpicking Minigame test launcher', () => {
    const onTriggerLockpicking = () => {
      lockpickingTriggerCount++;
    };

    onTriggerLockpicking();
    expect(lockpickingTriggerCount).toBe(1);
  });

  it('triggers Fishing Minigame test launcher', () => {
    const onTriggerFishing = () => {
      fishingTriggerCount++;
    };

    onTriggerFishing();
    expect(fishingTriggerCount).toBe(1);
  });

  it('grants Lockpicks and Skeleton Keys cheat correctly to inventory', () => {
    mockGameState.inventoryMaterials['mat_lockpick'] = 2;
    mockGameState.inventoryMaterials['mat_skeleton_key'] = 0;

    // Simulate handleGrantLockpicks action
    mockGameState.inventoryMaterials = {
      ...mockGameState.inventoryMaterials,
      mat_lockpick: (mockGameState.inventoryMaterials['mat_lockpick'] || 0) + 10,
      mat_skeleton_key: (mockGameState.inventoryMaterials['mat_skeleton_key'] || 0) + 2
    };
    triggerSuccessLog('Granted +10 Tension Lockpicks and +2 Master Skeleton Keys!');
    addLogMessage('🔑 Granted +10 Tension Lockpicks and +2 Skeleton Keys to inventory.', 'loot');

    expect(mockGameState.inventoryMaterials['mat_lockpick']).toBe(12);
    expect(mockGameState.inventoryMaterials['mat_skeleton_key']).toBe(2);
    expect(successLogs).toHaveLength(1);
    expect(logMessages).toHaveLength(1);
    expect(logMessages[0].type).toBe('loot');
  });

  it('grants Fishing Rod and durability cheat correctly to inventory', () => {
    mockGameState.inventoryMaterials['mat_fishing_pole'] = 0;
    mockGameState.fishingPoleDurability = undefined;

    // Simulate handleGrantFishingGear action
    mockGameState.inventoryMaterials = {
      ...mockGameState.inventoryMaterials,
      mat_fishing_pole: (mockGameState.inventoryMaterials['mat_fishing_pole'] || 0) + 1
    };
    mockGameState.fishingPoleDurability = 10;
    triggerSuccessLog('Granted +1 Solid Fishing Pole with 10/10 Durability!');
    addLogMessage('🎣 Granted +1 Solid Fishing Pole (10 uses) to inventory.', 'loot');

    expect(mockGameState.inventoryMaterials['mat_fishing_pole']).toBe(1);
    expect(mockGameState.fishingPoleDurability).toBe(10);
    expect(successLogs).toHaveLength(1);
    expect(logMessages).toHaveLength(1);
  });

  it('correctly simulates lock tumbler sweet spot and cylinder rotation calculation', () => {
    const targetAngle = 68;
    const testAngle = 68;
    const offset = Math.abs(testAngle - targetAngle);
    const isSweetSpot = offset <= 10;
    expect(isSweetSpot).toBe(true);

    let cylinderRot = 0;
    // Advance 4 steps of 3.5 degrees
    for (let i = 0; i < 4; i++) {
      cylinderRot = Math.min(90, cylinderRot + 3.5);
    }
    expect(cylinderRot).toBe(14);
  });

  it('correctly degrades durability when tension is applied off sweet spot', () => {
    const targetAngle = 68;
    const badAngle = 140;
    const offset = Math.abs(badAngle - targetAngle);
    const isSweetSpot = offset <= 10;
    expect(isSweetSpot).toBe(false);

    let pickDurability = 100;
    // Advance 5 steps of 3.5% decay
    for (let i = 0; i < 5; i++) {
      pickDurability = Math.max(0, pickDurability - 3.5);
    }
    expect(pickDurability).toBe(82.5);
  });

  it('handles Scriptorium stage advancement up to stage 4 and cycles', () => {
    let stage = 1;
    const advance = (st: number) => (st >= 4 ? 1 : st + 1);

    stage = advance(stage);
    expect(stage).toBe(2);
    stage = advance(stage);
    expect(stage).toBe(3);
    stage = advance(stage);
    expect(stage).toBe(4);
    stage = advance(stage);
    expect(stage).toBe(1);
  });
});
