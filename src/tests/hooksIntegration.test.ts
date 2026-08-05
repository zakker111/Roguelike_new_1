import { describe, it, expect } from 'vitest';
import { GUILD_UPGRADES, WOOD_MATERIAL } from '../utils/tradeEconomy';
import { DEFAULT_QUESTS } from '../utils/questData';

describe('Trade Economy & Quest Integration Tests', () => {
  it('trade economy defines valid material items and guild upgrades', () => {
    expect(WOOD_MATERIAL.price).toBeGreaterThan(0);
    expect(GUILD_UPGRADES.length).toBeGreaterThan(0);

    const logistics = GUILD_UPGRADES.find(u => u.id === 'up_supply_deals');
    expect(logistics).toBeDefined();
    expect(logistics?.costGold).toBeGreaterThan(0);
  });

  it('quest catalog initializes default available quests with rewards and descriptions', () => {
    expect(DEFAULT_QUESTS.length).toBeGreaterThan(0);
    const ratQuest = DEFAULT_QUESTS.find(q => q.id === 'q_pest_control');
    expect(ratQuest).toBeDefined();
    expect(ratQuest?.status).toBe('available');
    expect(ratQuest?.rewardGold).toBeGreaterThan(0);
  });
});
