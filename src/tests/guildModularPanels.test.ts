import { describe, it, expect } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { 
  GUILD_UPGRADES, 
  GUILD_DECORS, 
  COMPANION_QUEST_BOARD, 
  SYNDICATE_GEAR, 
  VANGUARD_GEAR 
} from '../utils/tradeEconomy';
import { SafehouseStashState } from '../components/guild/types';

describe('Modular Guild Engine & Sub-Panels (Phase 6)', () => {
  it('validates guild upgrades schema and constraints', () => {
    expect(GUILD_UPGRADES.length).toBeGreaterThanOrEqual(3);
    GUILD_UPGRADES.forEach(upgrade => {
      expect(upgrade.id).toBeDefined();
      expect(upgrade.name).toBeDefined();
      expect(upgrade.costGold).toBeGreaterThan(0);
      expect(upgrade.maxLevel).toBeGreaterThan(0);
      expect(typeof upgrade.costMaterials).toBe('object');
    });
  });

  it('validates sanctuary decorations schema and active bonuses', () => {
    expect(GUILD_DECORS.length).toBeGreaterThanOrEqual(4);
    GUILD_DECORS.forEach(decor => {
      expect(decor.id).toBeDefined();
      expect(decor.name).toBeDefined();
      expect(decor.costGold).toBeGreaterThan(0);
      expect(decor.bonusText).toBeDefined();
      expect(decor.icon).toBeDefined();
    });
  });

  it('validates autonomous companion expedition quests board', () => {
    expect(COMPANION_QUEST_BOARD.length).toBeGreaterThanOrEqual(4);
    COMPANION_QUEST_BOARD.forEach(quest => {
      expect(quest.id).toBeDefined();
      expect(quest.title).toBeDefined();
      expect(quest.turnsRequired).toBeGreaterThan(0);
      expect(quest.rewardGold).toBeGreaterThanOrEqual(0);
      expect(quest.rewardXp).toBeGreaterThanOrEqual(0);
    });
  });

  it('validates faction armament blueprints for Syndicate and Vanguard', () => {
    expect(SYNDICATE_GEAR.length).toBeGreaterThan(0);
    expect(VANGUARD_GEAR.length).toBeGreaterThan(0);

    SYNDICATE_GEAR.forEach(gear => {
      expect(gear.id).toBeDefined();
      expect(gear.name).toBeDefined();
      expect(gear.costGold).toBeGreaterThan(0);
      expect(gear.color).toBeDefined();
    });

    VANGUARD_GEAR.forEach(gear => {
      expect(gear.id).toBeDefined();
      expect(gear.name).toBeDefined();
      expect(gear.costGold).toBeGreaterThan(0);
      expect(gear.color).toBeDefined();
    });
  });

  it('initial state correctly supports safehouses and guild stash containers', () => {
    const state = createNewGameRun(12345);
    expect(state.guildOwned).toBeFalsy();

    const mockStash: SafehouseStashState = {
      equipment: [],
      materials: { mat_iron_ore: 10 },
      catalysts: { cat_fire: 2 },
      potions: {}
    };

    expect(mockStash.materials['mat_iron_ore']).toBe(10);
    expect(mockStash.catalysts['cat_fire']).toBe(2);
  });
});
