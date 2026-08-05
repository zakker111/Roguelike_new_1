import { describe, it, expect } from 'vitest';
import { getWeatherAmbientBark } from '../utils/npcDialogue';
import { NPC } from '../types';

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
});
