/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { TileType, Enemy, EnemyState, EnemyType, TrapType } from '../types';
import {
  generateEmergentSkirmish,
  FACTION_SPOILS_ITEMS,
  getFactionSpoilsItem,
  getRandomFactionSpoils,
} from '../world/skirmish';
import { triggerSquadMoraleBreakOnLeaderDeath } from '../hooks/ai/factionMorale';
import { generateCombatLoot } from '../hooks/combat/combatLoot';
import { createNewGameRun } from '../utils/gameStateFactory';

describe('Phase 5: Dynamic Turf Wars, Emergent Skirmishes & Faction Spoils', () => {
  const createMockMap = (w = 64, h = 40): TileType[][] =>
    Array(h).fill(null).map(() => Array(w).fill(TileType.Grass));

  describe('5.1: Emergent Skirmish State Generator', () => {
    it('generates an emergent skirmish with valid entities and props', () => {
      const map = createMockMap();
      const result = generateEmergentSkirmish(map, {
        chunkX: 5,
        chunkY: 7,
        width: 64,
        height: 40,
        playerLevel: 3,
        chaosScore: 25,
      });

      expect(result).not.toBeNull();
      if (!result) return;

      expect(['active_plaza_melee', 'high_ground_ambush', 'base_siege_redoubt']).toContain(result.scenario);
      expect(result.enemies.length).toBeGreaterThanOrEqual(3);
      expect(result.chests.length).toBeGreaterThanOrEqual(1);
      expect(result.centerX).toBeGreaterThan(0);
      expect(result.centerY).toBeGreaterThan(0);
    });

    it('active_plaza_melee spawns opposing faction combatants facing each other', () => {
      // Find coordinates that yield active_plaza_melee
      let skirmish = null;
      for (let x = 1; x < 20; x++) {
        const map = createMockMap();
        const res = generateEmergentSkirmish(map, {
          chunkX: x,
          chunkY: 2,
          width: 64,
          height: 40,
          playerLevel: 2,
        });
        if (res && res.scenario === 'active_plaza_melee') {
          skirmish = res;
          break;
        }
      }

      expect(skirmish).not.toBeNull();
      if (!skirmish) return;

      expect(skirmish.factionA).toBe('vanguard');
      expect(skirmish.factionB).toBe('orc_clan');

      const vanguardEnemies = skirmish.enemies.filter((e) => e.faction === 'vanguard');
      const orcEnemies = skirmish.enemies.filter((e) => e.faction === 'orc_clan');

      expect(vanguardEnemies.length).toBeGreaterThanOrEqual(2);
      expect(orcEnemies.length).toBeGreaterThanOrEqual(2);
      expect(skirmish.chests.length).toBeGreaterThanOrEqual(1);
    });

    it('high_ground_ambush spawns long-range sharpshooters and choke-point traps', () => {
      let skirmish = null;
      for (let x = 1; x < 20; x++) {
        const map = createMockMap();
        const res = generateEmergentSkirmish(map, {
          chunkX: x,
          chunkY: 5,
          width: 64,
          height: 40,
          playerLevel: 2,
        });
        if (res && res.scenario === 'high_ground_ambush') {
          skirmish = res;
          break;
        }
      }

      expect(skirmish).not.toBeNull();
      if (!skirmish) return;

      const snipers = skirmish.enemies.filter((e) => e.range >= 4);
      expect(snipers.length).toBeGreaterThanOrEqual(2);
      expect(skirmish.traps.length).toBeGreaterThanOrEqual(2);
      expect(skirmish.traps[0].type).toBe(TrapType.Spikes);
    });

    it('base_siege_redoubt spawns a warlord boss, palisade gate, and locked War Chest', () => {
      let skirmish = null;
      for (let x = 1; x < 20; x++) {
        const map = createMockMap();
        const res = generateEmergentSkirmish(map, {
          chunkX: x,
          chunkY: 9,
          width: 64,
          height: 40,
          playerLevel: 4,
        });
        if (res && res.scenario === 'base_siege_redoubt') {
          skirmish = res;
          break;
        }
      }

      expect(skirmish).not.toBeNull();
      if (!skirmish) return;

      const warlord = skirmish.enemies.find((e) => e.isBoss && e.factionRank === 'warlord');
      expect(warlord).toBeDefined();
      expect(warlord?.hp).toBeGreaterThan(60);

      // Sentries must have packLeaderId linked to Warlord
      const minions = skirmish.enemies.filter((e) => e.id !== warlord?.id);
      expect(minions.length).toBeGreaterThanOrEqual(2);
      minions.forEach((m) => {
        expect(m.packLeaderId).toBe(warlord?.id);
      });

      // Locked War Chest
      const warChest = skirmish.chests.find((c) => c.isLocked);
      expect(warChest).toBeDefined();
      expect(warChest?.gold).toBeGreaterThan(150);
    });
  });

  describe('5.2: Morale Break & Leader Death Cascade', () => {
    it('slaying an Orc or Bandit Warlord causes subordinate sentries to panic and drop loot', () => {
      const warlord: Enemy = {
        id: 'warlord_test_1',
        name: 'Warlord Bloodfang Krug [Orc Chieftain]',
        char: '👑',
        color: '#dc2626',
        type: EnemyType.OrcBrute,
        hp: 0,
        maxHp: 80,
        atk: 10,
        def: 5,
        range: 1,
        speed: 1,
        faction: 'orc_clan',
        factionRank: 'warlord',
        isBoss: true,
        isElite: true,
        patrolPath: [],
        patrolIndex: 0,
        state: EnemyState.Patrolling,
        debuffs: [],
        x: 10,
        y: 10,
      };

      const minion1: Enemy = {
        id: 'minion_1',
        name: 'Goreaxe Raider',
        char: 'O',
        color: '#ef4444',
        type: EnemyType.OrcBrute,
        hp: 30,
        maxHp: 30,
        atk: 5,
        def: 2,
        range: 1,
        speed: 1,
        faction: 'orc_clan',
        factionRank: 'soldier',
        packLeaderId: 'warlord_test_1',
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        state: EnemyState.Chasing,
        debuffs: [],
        x: 11,
        y: 10,
      };

      const minion2: Enemy = {
        id: 'minion_2',
        name: 'Goreaxe Berserker',
        char: 'O',
        color: '#ef4444',
        type: EnemyType.OrcBrute,
        hp: 28,
        maxHp: 28,
        atk: 6,
        def: 1,
        range: 1,
        speed: 1,
        faction: 'orc_clan',
        factionRank: 'soldier',
        packLeaderId: 'warlord_test_1',
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        state: EnemyState.Chasing,
        debuffs: [],
        x: 10,
        y: 12,
      };

      const result = triggerSquadMoraleBreakOnLeaderDeath(
        warlord,
        [warlord, minion1, minion2]
      );

      expect(result.panickedCount).toBeGreaterThan(0);
      const panickedMinions = result.updatedEnemies.filter((e) => e.isPanicked && e.state === EnemyState.Retreating);
      expect(panickedMinions.length).toBeGreaterThan(0);
      expect(result.droppedPiles.length).toBeGreaterThan(0);
    });
  });

  describe('5.3: Faction Spoils & Scavenging Loops', () => {
    it('defines all 5 high-tier faction armaments with valid stats and descriptions', () => {
      const spoils = Object.values(FACTION_SPOILS_ITEMS);
      expect(spoils.length).toBe(5);

      for (const item of spoils) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.value).toBeGreaterThanOrEqual(150);
        expect(item.maxDurability).toBeGreaterThanOrEqual(100);
        expect(item.isRepairable).toBe(true);
        expect(item.color.startsWith('#')).toBe(true);
      }
    });

    it('getFactionSpoilsItem returns deep clone of requested gear', () => {
      const cleaver = getFactionSpoilsItem('orc_goreaxe_cleaver');
      expect(cleaver).toBeDefined();
      expect(cleaver?.name).toContain('Goreaxe');
      expect(cleaver?.damage).toBe(15);
      expect(cleaver?.critChance).toBe(0.18);

      const buckler = getFactionSpoilsItem('orc_spiked_buckler');
      expect(buckler).toBeDefined();
      expect(buckler?.defense).toBe(7);

      const leather = getFactionSpoilsItem('bandit_stalker_leather');
      expect(leather).toBeDefined();
      expect(leather?.critChance).toBe(0.12);
    });

    it('getRandomFactionSpoils returns weighted faction item', () => {
      const orcItem = getRandomFactionSpoils('orc_clan');
      expect(['orc_goreaxe_cleaver', 'orc_spiked_buckler']).toContain(orcItem.id);

      const banditItem = getRandomFactionSpoils('outlaws');
      expect(banditItem.id).toBe('bandit_stalker_leather');

      const syndicateItem = getRandomFactionSpoils('syndicate');
      expect(syndicateItem.id).toBe('syndicate_shadow_satchel');
    });

    it('generateCombatLoot awards Faction Spoils gear when defeating a warlord', () => {
      const state = createNewGameRun(1111);
      const warlord: Enemy = {
        id: 'warlord_test_2',
        name: 'Warlord Bloodfang Krug [Orc Chieftain]',
        char: '👑',
        color: '#dc2626',
        type: EnemyType.OrcBrute,
        hp: 0,
        maxHp: 85,
        atk: 10,
        def: 5,
        range: 1,
        speed: 1,
        faction: 'orc_clan',
        factionRank: 'warlord',
        isBoss: true,
        isElite: true,
        patrolPath: [],
        patrolIndex: 0,
        state: EnemyState.Patrolling,
        debuffs: [],
        x: 15,
        y: 15,
      };

      const lootResult = generateCombatLoot(state, warlord, {});
      expect(lootResult.newLootPile).toBeDefined();
      expect(lootResult.newLootPile.equipment.length).toBeGreaterThan(0);

      const droppedFactionGear = lootResult.newLootPile.equipment.find(
        (e) => e.id === 'orc_goreaxe_cleaver' || e.id === 'orc_spiked_buckler'
      );
      expect(droppedFactionGear).toBeDefined();
      expect(['orc_goreaxe_cleaver', 'orc_spiked_buckler']).toContain(droppedFactionGear?.id);
      expect(lootResult.extraLogs.some((l) => l.text.includes('WARLORD SPOILS'))).toBe(true);
    });
  });
});
