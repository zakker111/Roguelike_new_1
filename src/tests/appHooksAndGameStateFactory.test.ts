import { describe, it, expect } from 'vitest';
import { createNewGameRun, INITIAL_FACTION_TERRITORIES, INITIAL_FACTION_WAR_TREASURY } from '../utils/gameStateFactory';
import { exportAndDownloadGameLogs } from '../utils/logExporter';
import {
  usePlayerTurnMovement,
  useGKeyInteraction,
  useAutoplayAgent,
  useConsumablesAndCatalysts,
  useShopAndTradeHandlers,
  useQuestAndGuildHandlers,
  useShrineAndChestHandlers
} from '../hooks/app';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../utils/gameUtils';
import { GameState } from '../types';

describe('App Hooks and GameState Factory Tests', () => {
  it('createNewGameRun produces a fully-populated, valid initial GameState', () => {
    const initialState = createNewGameRun(42);
    
    expect(initialState.isOverworld).toBe(true);
    expect(initialState.playerX).toBeGreaterThanOrEqual(0);
    expect(initialState.playerX).toBeLessThan(LEVEL_WIDTH);
    expect(initialState.playerY).toBeGreaterThanOrEqual(0);
    expect(initialState.playerY).toBeLessThan(LEVEL_HEIGHT);
    expect(initialState.map.length).toBe(LEVEL_HEIGHT);
    expect(initialState.map[0].length).toBe(LEVEL_WIDTH);
    expect(initialState.playerStats.hp).toBeGreaterThan(0);
    expect(initialState.playerStats.maxHp).toBeGreaterThan(0);
    expect(initialState.playerStats.mp).toBeGreaterThan(0);
    expect(initialState.currentWeapon).toBeDefined();
    expect(initialState.equippedArmor).toBeDefined();
    expect(initialState.quests.length).toBeGreaterThan(0);
    expect(initialState.factionTerritories).toBeDefined();
    expect(Object.keys(initialState.factionTerritories).length).toBeGreaterThan(0);
  });

  it('INITIAL_FACTION_TERRITORIES has properly configured default zones', () => {
    expect(INITIAL_FACTION_TERRITORIES.borderlands).toBeDefined();
    expect(INITIAL_FACTION_TERRITORIES.shadow_fjord).toBeDefined();
    expect(INITIAL_FACTION_TERRITORIES.moonshadow_cove).toBeDefined();
    expect(INITIAL_FACTION_TERRITORIES.borderlands.controlPercent).toBe(50);
    expect(INITIAL_FACTION_WAR_TREASURY).toBeDefined();
    expect(INITIAL_FACTION_WAR_TREASURY.vanguardGold).toBeGreaterThanOrEqual(0);
    expect(INITIAL_FACTION_WAR_TREASURY.syndicateGold).toBeGreaterThanOrEqual(0);
  });

  it('exportAndDownloadGameLogs is a defined exportable log utility', () => {
    expect(typeof exportAndDownloadGameLogs).toBe('function');
  });

  it('All extracted app hooks are exported and defined functions', () => {
    expect(typeof usePlayerTurnMovement).toBe('function');
    expect(typeof useGKeyInteraction).toBe('function');
    expect(typeof useAutoplayAgent).toBe('function');
    expect(typeof useConsumablesAndCatalysts).toBe('function');
    expect(typeof useShopAndTradeHandlers).toBe('function');
    expect(typeof useQuestAndGuildHandlers).toBe('function');
    expect(typeof useShrineAndChestHandlers).toBe('function');
  });
});
