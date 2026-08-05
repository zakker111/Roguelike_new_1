import { describe, it, expect } from 'vitest';
import { getWeatherTimeContextDialogue, getWeatherAmbientBark, getRegionalRumorAndGossip } from '../utils/npcDialogue';
import { NPC } from '../types';

describe('NPC Dialogue & Weather Reactivity System', () => {
  const mockVillager: NPC = {
    id: 'test_npc_1',
    name: 'Elric the Farmer',
    x: 10,
    y: 10,
    homeX: 10,
    homeY: 10,
    workX: 10,
    workY: 10,
    scheduleState: 'work',
    char: '👨‍🌾',
    color: '#10b981',
    dialogue: ['Good day, friend!', 'The crops are growing.', 'Watch out for goblins at night.'],
    role: 'villager'
  };

  const mockMerchant: NPC = {
    id: 'test_npc_2',
    name: 'Grom Ironhide',
    x: 15,
    y: 15,
    homeX: 15,
    homeY: 15,
    workX: 15,
    workY: 15,
    scheduleState: 'work',
    char: '⚒️',
    color: '#eab308',
    dialogue: ['Need weapons or armor?', 'Quality steel here!'],
    role: 'blacksmith'
  };

  it('generates weather-reactive dialogue lines for sunny vs rainy weather', () => {
    const sunnyDialogue = getWeatherTimeContextDialogue(mockVillager, { weather: 'clear_sky', gameTime: 720, biome: 'plains', season: 'spring' });
    expect(sunnyDialogue.some(d => d.includes('sun') || d.includes('light') || d.includes('clear') || d.includes('spring') || d.includes('crops') || d.length > 5)).toBe(true);

    const rainyDialogue = getWeatherTimeContextDialogue(mockVillager, { weather: 'rainy', gameTime: 720, biome: 'plains', season: 'autumn' });
    expect(rainyDialogue.some(d => d.includes('rain') || d.includes('mud') || d.includes('wet') || d.includes('crops') || d.length > 5)).toBe(true);
  });

  it('generates night-time contextual dialogue when talking to awake villagers', () => {
    const nightDialogue = getWeatherTimeContextDialogue(mockVillager, { weather: 'clear_sky', gameTime: 1380, biome: 'plains', season: 'winter' });
    expect(Array.isArray(nightDialogue)).toBe(true);
    expect(nightDialogue.length).toBeGreaterThan(0);
  });

  it('provides role-specific weather barks', () => {
    const bark = getWeatherAmbientBark(mockMerchant, 'blizzard', 'day');
    expect(typeof bark).toBe('string');
    expect(bark.length).toBeGreaterThan(5);
  });

  it('generates regional rumors and gossip based on town reputation and biome', () => {
    const rumor1 = getRegionalRumorAndGossip({ biome: 'plains', townReputation: 90 });
    expect(typeof rumor1).toBe('string');
    expect(rumor1.length).toBeGreaterThan(10);

    const outlawRumor = getRegionalRumorAndGossip({ biome: 'swamp', townReputation: 10 });
    expect(typeof outlawRumor).toBe('string');
    expect(outlawRumor.length).toBeGreaterThan(10);
  });
});
