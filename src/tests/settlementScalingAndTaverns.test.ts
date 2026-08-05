import { describe, it, expect } from 'vitest';
import { getSettlementTier } from '../world/overworldStructures';
import { getTavernDrinkingBark } from '../utils/npcDialogue';
import townTemplates from '../data/townTemplates.json';
import { NPC } from '../types';

describe('Phase 28.4: Settlement Scaling, Urban Density & Tavern Sitting', () => {
  const dummyVillager: NPC = {
    id: 'npc_villager_test',
    name: 'Garth (Villager)',
    role: 'villager',
    char: '🚶',
    color: '#10b981',
    x: 10,
    y: 10,
    homeX: 5,
    homeY: 5,
    workX: 15,
    workY: 15,
    dialogue: [],
    scheduleState: 'leisure'
  };

  it('should categorize settlement tiers properly', () => {
    const startTier = getSettlementTier(0, 0);
    expect(startTier).toBe('village');

    const portTier = getSettlementTier(3, -2);
    expect(portTier).toBe('town');
  });

  it('should generate tavern drinking barks', () => {
    const bark = getTavernDrinkingBark(dummyVillager);
    expect(bark).toContain('Garth');
    expect(bark.length).toBeGreaterThan(10);
  });

  it('should contain expanded tavern furniture in townTemplates.json', () => {
    const tavernInteriors = townTemplates.buildingInteriors.tavern;
    expect(tavernInteriors).toBeDefined();

    const hasTable = tavernInteriors.some((prop: any) => prop.tile === 'Table');
    const hasChair = tavernInteriors.some((prop: any) => prop.tile === 'Chair');
    const hasFireplace = tavernInteriors.some((prop: any) => prop.tile === 'Fireplace');

    expect(hasTable).toBe(true);
    expect(hasChair).toBe(true);
    expect(hasFireplace).toBe(true);
  });
});
