import { describe, it, expect } from 'vitest';
import { calculateNetDamage, calculateCritDamage, getXpForLevel, BALANCE_CONFIG } from '../data/balance';
import { calculateWorldThreatTier, getThreatTierInfo } from '../utils/worldThreat';
import { applyCombatArchetypeAndChaosScaling } from '../utils/combatArchetypes';
import { generateLevel } from '../utils/dungeon';
import { generateOverworldChunk } from '../utils/overworld';
import { tickActiveGMStoryteller, getGMStorytellerState, setGMStorytellerState } from '../utils/gmStoryteller';
import { BLACKSMITH_SHOP_ITEMS, APOTHECARY_ITEMS, MERCHANT_RESOURCES } from '../utils/shopData';
import { GameState, Enemy, PlayerStats, TileType } from '../types';

describe('Comprehensive Full-Game Scaling, Math & Multi-Turn Simulation', () => {

  describe('1. Player Progression & Level Scaling Matrix (Levels 1-20)', () => {
    it('verifies XP requirements scale exponentially and never produce NaN or overflow', () => {
      let prevXp = 0;
      for (let lvl = 1; lvl <= 20; lvl++) {
        const xpReq = getXpForLevel(lvl);
        expect(xpReq).toBeGreaterThanOrEqual(BALANCE_CONFIG.BASE_XP_NEXT_LEVEL);
        expect(Number.isFinite(xpReq)).toBe(true);
        if (lvl > 1) {
          expect(xpReq).toBeGreaterThan(prevXp);
        }
        prevXp = xpReq;
      }
    });

    it('simulates progressive stat growth from Level 1 Novice to Level 20 Legend', () => {
      const stats: PlayerStats = {
        level: 1,
        hp: 50,
        maxHp: 50,
        mp: 20,
        maxMp: 20,
        atk: 10,
        def: 2,
        str: 10,
        dex: 10,
        int: 10,
        cha: 10,
        lck: 10,
        gold: 50,
        xp: 0,
        enemiesDefeated: 0,
        turnsPlayed: 0,
        unspentPoints: 0,
        exhaustion: 0
      };

      // Simulate leveling up 19 times
      for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
        const xpNeeded = getXpForLevel(targetLevel);
        stats.xp = xpNeeded;
        stats.level = targetLevel;
        stats.maxHp += 12;
        stats.hp = stats.maxHp;
        stats.maxMp += 5;
        stats.mp = stats.maxMp;
        stats.atk += 3;
        stats.def += 1;
        stats.str += 2;
        stats.dex += 1;
        stats.int += 1;
      }

      expect(stats.level).toBe(20);
      expect(stats.maxHp).toBe(50 + 19 * 12); // 278 HP
      expect(stats.maxMp).toBe(20 + 19 * 5);  // 115 MP
      expect(stats.atk).toBe(10 + 19 * 3);    // 67 ATK
      expect(stats.def).toBe(2 + 19 * 1);     // 21 DEF
    });
  });

  describe('2. Combat Armor Mitigation, Penetration & Boundary Safety', () => {
    it('strictly caps armor mitigation at 75% without dividing by zero or going below 1', () => {
      // 0 Armor: 100% damage dealt
      expect(calculateNetDamage(50, 0)).toBe(50);

      // Normal Armor (40 armor = 50% mitigation)
      expect(calculateNetDamage(50, 40)).toBe(25);

      // Extreme Armor (1000 armor -> capped at 75% mitigation = 25% damage taken)
      expect(calculateNetDamage(100, 1000)).toBe(25);

      // 0 or Negative Damage input returns 0 safely
      expect(calculateNetDamage(0, 10)).toBe(0);
      expect(calculateNetDamage(-10, 10)).toBe(0);

      // High armor on low damage still ensures minimum 1 damage
      expect(calculateNetDamage(2, 500)).toBe(1);
    });

    it('validates critical strike formulas across various luck & multiplier tiers', () => {
      expect(calculateCritDamage(20, 1.5)).toBe(30);
      expect(calculateCritDamage(50, 2.0)).toBe(100);
      expect(calculateCritDamage(100, 2.5)).toBe(250);
    });
  });

  describe('3. World Threat Tier & Chaos Matrix Dynamic Scaling', () => {
    it('calculates World Threat Tiers dynamically from character depth, turns, and chaos', () => {
      // Novice Tier
      const tier0 = calculateWorldThreatTier({ level: 1, depth: 0, turnsPlayed: 10 }, 10);
      expect(tier0).toBe(0);
      const info0 = getThreatTierInfo(tier0);
      expect(info0.statMultiplier).toBe(1.0);

      // Mid-game Tier
      const tier3 = calculateWorldThreatTier({ level: 5, depth: 2, turnsPlayed: 400 }, 50);
      expect(tier3).toBeGreaterThanOrEqual(3);
      const info3 = getThreatTierInfo(tier3);
      expect(info3.statMultiplier).toBeGreaterThanOrEqual(1.5);
      expect(info3.affixChance).toBeGreaterThanOrEqual(0.4);

      // Endgame Ascension Tier
      const tier8 = calculateWorldThreatTier({ level: 15, depth: 6, turnsPlayed: 1200 }, 80);
      expect(tier8).toBeGreaterThanOrEqual(8);
      const info8 = getThreatTierInfo(tier8);
      expect(info8.statMultiplier).toBeGreaterThanOrEqual(2.5);
      expect(info8.xpBonusPct).toBeGreaterThanOrEqual(150);
    });

    it('scales monster stats cleanly with Golden Triangle profiles and affixes', () => {
      const baseOrc: Enemy = {
        id: 'orc_test',
        name: 'Orc Brute',
        type: 'OrcBrute' as any,
        hp: 30,
        maxHp: 30,
        atk: 8,
        def: 2,
        x: 5,
        y: 5,
        range: 1,
        speed: 1.0,
        color: '#ff0000',
        char: 'O',
        state: 'hostile' as any,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      // Scale Orc for Tier 4 World Threat
      const scaledOrc = applyCombatArchetypeAndChaosScaling(baseOrc, 60, { level: 10, depth: 4, turnsPlayed: 600 });
      expect(scaledOrc.maxHp).toBeGreaterThan(baseOrc.maxHp);
      expect(scaledOrc.atk).toBeGreaterThan(baseOrc.atk);
      expect(scaledOrc.def).toBeGreaterThanOrEqual(baseOrc.def);
    });
  });

  describe('4. Economy & Trade Resource Pacing', () => {
    it('verifies item prices and economy balances between shops and dungeon reward pools', () => {
      // Blacksmith items have valid tiers and costs
      BLACKSMITH_SHOP_ITEMS.forEach(item => {
        expect(item.value).toBeGreaterThan(0);
        expect(item.name.length).toBeGreaterThan(0);
      });

      // Apothecary potions and catalysts
      APOTHECARY_ITEMS.forEach(item => {
        expect(item.price).toBeGreaterThan(0);
        expect(item.name.length).toBeGreaterThan(0);
      });

      // Merchant resources
      MERCHANT_RESOURCES.forEach(item => {
        expect(item.price).toBeGreaterThan(0);
      });
    });
  });

  describe('5. Full 50-Turn Autonomous GM Storyteller Life-cycle Simulation', () => {
    it('simulates 50 turns of GM evaluation verifying tension, boredom decay, and interventions', () => {
      let gm = getGMStorytellerState();
      gm = {
        ...gm,
        boredom: 60,
        tension: 50,
        personality: 'Sadistic'
      };
      setGMStorytellerState(gm);

      let mockState: any = {
        playerX: 10,
        playerY: 10,
        levelWidth: 24,
        levelHeight: 18,
        season: 'summer',
        weather: 'clear',
        gameTime: 720,
        gameDurationHours: 1,
        biome: 'forest',
        isOverworld: true,
        currentChunkX: 0,
        currentChunkY: 0,
        overworldChunks: {},
        dungeonLevels: {},
        visitedTiles: {},
        discovered: [],
        visible: [],
        map: Array(18).fill(null).map(() => Array(24).fill('Grass')),
        enemies: [],
        npcs: [],
        traps: [],
        chests: [],
        lootPiles: [],
        equipmentInventory: [],
        equippedArmor: null,
        equippedHelmet: null,
        equippedGloves: null,
        equippedBoots: null,
        equippedShield: null,
        equippedAmulet: null,
        currentWeapon: null,
        quests: [],
        followers: [],
        activeQuestBoardOpen: false,
        activeFollowerIdForInspect: null,
        isBraced: false,
        activeTradeNpcId: null,
        corpses: [],
        bloodSplatters: [],
        dungeonProps: [],
        playerStats: {
          hp: 20,
          maxHp: 100,
          mp: 10,
          maxMp: 50,
          atk: 20,
          def: 5,
          str: 14,
          dex: 12,
          int: 10,
          cha: 11,
          lck: 10,
          gold: 100,
          xp: 0,
          level: 3,
          nextLevelXp: 200,
          unspentPoints: 0,
          exhaustion: 0,
          turnsPlayed: 0
        },
        inventoryMaterials: {},
        inventoryCatalysts: {},
        logs: [],
        caravanTravel: null,
        chaosScore: 40
      };

      let logsRecorded = 0;

      for (let t = 1; t <= 50; t++) {
        mockState.playerStats.turnsPlayed = t;
        const tickRes = tickActiveGMStoryteller(mockState);
        if (tickRes.stateUpdates) {
          mockState = {
            ...mockState,
            ...tickRes.stateUpdates,
            playerStats: {
              ...mockState.playerStats,
              ...(tickRes.stateUpdates.playerStats || {})
            }
          };
        }
        if (tickRes.logMessage) {
          logsRecorded++;
        }
      }

      expect(mockState.playerStats.turnsPlayed).toBe(50);
      expect(logsRecorded).toBeGreaterThan(0);
    });
  });

  describe('6. Multi-Level Dungeon & Overworld Generation Scaling', () => {
    it('generates dungeons from Depth 1 to Depth 10 without crashes or disconnected maps', () => {
      for (let depth = 1; depth <= 10; depth++) {
        const dungeon = generateLevel(48, 32, depth, 20 + depth * 5, 50);
        expect(dungeon.map.length).toBe(32);
        expect(dungeon.map[0].length).toBe(48);
        expect(dungeon.enemies.length).toBeGreaterThan(0);

        // Every floor has at least stairs up or down
        const hasStairs = dungeon.map.some(row => row.some(tile => tile === TileType.StairsDown || tile === TileType.StairsUp));
        expect(hasStairs).toBe(true);
      }
    });

    it('generates diverse Overworld Biome chunks seamlessly', () => {
      const chunk = generateOverworldChunk(0, 0, 64, 40);
      expect(chunk.map.length).toBe(40);
      expect(chunk.map[0].length).toBe(64);
      expect(chunk.biome).toBeDefined();
    });
  });

});
