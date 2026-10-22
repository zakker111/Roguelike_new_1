import { describe, it, expect } from 'vitest';
import { getWeatherAmbientBark } from '../utils/npcDialogue';
import { NPC } from '../types';
import { resolveCivilianNpcTurns } from '../hooks/ai/useCivilianAI';

describe('Phase 28.3: NPC Daily Schedules, Shelter Seeking & Weather Behaviors', () => {
  const dummyGuard: NPC = {
    id: 'npc_guard_1',
    name: 'Captain Vael (Town Guard)',
    role: 'faction_vanguard',
    char: '🛡️',
    color: '#3b82f6',
    x: 10,
    y: 10,
    homeX: 10,
    homeY: 10,
    workX: 10,
    workY: 10,
    dialogue: [],
    scheduleState: 'work'
  };

  const dummyVillager: NPC = {
    id: 'npc_villager_1',
    name: 'Garth (Villager)',
    role: 'villager',
    char: '🚶',
    color: '#10b981',
    x: 12,
    y: 12,
    homeX: 5,
    homeY: 5,
    workX: 15,
    workY: 15,
    dialogue: [],
    scheduleState: 'work'
  };

  const dummyDockworker: NPC = {
    id: 'npc_dockworker_1',
    name: 'Bram (Dockworker)',
    role: 'dockworker',
    char: '📦',
    color: '#f59e0b',
    x: 20,
    y: 20,
    homeX: 18,
    homeY: 18,
    workX: 22,
    workY: 22,
    dialogue: [],
    scheduleState: 'work'
  };

  it('should generate weather-reactive barks tailored to NPC roles during rainy weather', () => {
    const guardBark = getWeatherAmbientBark(dummyGuard, 'rainy', 'day');
    expect(guardBark).toContain('watch');

    const dockworkerBark = getWeatherAmbientBark(dummyDockworker, 'rainy', 'day');
    expect(dockworkerBark).toContain('pier');

    const villagerBark = getWeatherAmbientBark(dummyVillager, 'rainy', 'day');
    expect(villagerBark).toContain('rain');
  });

  it('should generate severe weather barks for blizzards and sandstorms', () => {
    const blizzardBark = getWeatherAmbientBark(dummyVillager, 'blizzard', 'day');
    expect(blizzardBark.toLowerCase()).toContain('blizzard');

    const sandstormBark = getWeatherAmbientBark(dummyVillager, 'sandstorm', 'day');
    expect(sandstormBark.toLowerCase()).toContain('sandstorm');
  });

  it('should generate night-time ambient barks when timeOfDay is night', () => {
    const nightBark = getWeatherAmbientBark(dummyVillager, 'clear', 'night');
    expect(nightBark.toLowerCase()).toContain('night');
  });

  it('should ensure Quest Board never moves, panics, or sleeps during night or when monsters attack', () => {
    const questBoard: NPC = {
      id: 'npc_questboard_0_0',
      name: 'Quest Board',
      role: 'quest_board',
      char: '▤',
      originalChar: '▤',
      color: '#fbbf24',
      x: 32,
      y: 18,
      homeX: 32,
      homeY: 18,
      workX: 32,
      workY: 18,
      dialogue: ['Notices'],
      scheduleState: 'work',
      isImmobile: true
    };

    // Simulate nighttime with blizzard and adjacent hostile monster
    const mockMap = Array.from({ length: 40 }, () => Array(64).fill(1)); // Floor tiles
    const mockGameState = {
      map: mockMap,
      gameTime: 1380, // 23:00 (Night)
      weather: 'blizzard',
      visible: Array.from({ length: 40 }, () => Array(64).fill(true)),
      discovered: Array.from({ length: 40 }, () => Array(64).fill(true)),
      enemies: [{
        id: 'hostile_1',
        name: 'Goblin Ambushed',
        x: 32,
        y: 19, // adjacent to quest board
        hp: 20,
        def: 0
      }]
    } as any;

    const result = resolveCivilianNpcTurns({
      nextNpcs: [questBoard],
      nextEnemies: mockGameState.enemies,
      updatedEnemiesList: [...mockGameState.enemies],
      prev: mockGameState,
      px: 30,
      py: 18,
      nextGuardsHostile: false,
      staticLogs: [],
      applyDamageToEnemy: () => false
    });

    expect(result.length).toBe(1);
    const updatedBoard = result[0];
    expect(updatedBoard.x).toBe(32);
    expect(updatedBoard.y).toBe(18);
    expect(updatedBoard.isImmobile).toBe(true);
    expect(updatedBoard.isAsleep).toBe(false);
    expect(updatedBoard.char).toBe('▤');
    expect(updatedBoard.char).not.toBe('😱');
    expect(updatedBoard.char).not.toBe('😴');
    expect(updatedBoard.char).not.toBe('💤');
  });

  it('should ensure guest_board typo or notice board IDs remain strictly immobile', () => {
    const guestBoard: NPC = {
      id: 'npc_guest_board_village',
      name: 'Guest Board',
      role: 'guest_board' as any,
      char: '▤',
      color: '#fbbf24',
      x: 15,
      y: 20,
      homeX: 15,
      homeY: 20,
      workX: 15,
      workY: 20,
      dialogue: ['Guest notices'],
      scheduleState: 'work'
    };

    const mockGameState = {
      map: Array.from({ length: 40 }, () => Array(64).fill(1)),
      gameTime: 1380, // Night
      weather: 'storm',
      visible: Array.from({ length: 40 }, () => Array(64).fill(true)),
      discovered: Array.from({ length: 40 }, () => Array(64).fill(true)),
      enemies: [{
        id: 'hostile_orc',
        name: 'Orc Raider',
        x: 16,
        y: 20,
        hp: 30,
        def: 2
      }]
    } as any;

    const result = resolveCivilianNpcTurns({
      nextNpcs: [guestBoard],
      nextEnemies: mockGameState.enemies,
      updatedEnemiesList: [...mockGameState.enemies],
      prev: mockGameState,
      px: 10,
      py: 20,
      nextGuardsHostile: false,
      staticLogs: [],
      applyDamageToEnemy: () => false
    });

    expect(result.length).toBe(1);
    const updated = result[0];
    expect(updated.x).toBe(15);
    expect(updated.y).toBe(20);
    expect(updated.isImmobile).toBe(true);
    expect(updated.char).toBe('▤');
    expect(updated.char).not.toBe('😱');
  });
});

