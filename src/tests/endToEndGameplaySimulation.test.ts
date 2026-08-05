import { describe, it, expect } from 'vitest';
import { generateOverworldChunk } from '../utils/overworld';
import { generateLevel } from '../utils/dungeon';
import { calculateNetDamage, calculateCritDamage, getXpForLevel } from '../data/balance';
import { getEffectiveStats, evaluateScarAcquisition, getScarStatus } from '../utils/scars';
import { TileType, PlayerStats, Enemy } from '../types';
import { BLACKSMITH_SHOP_ITEMS, MERCHANT_RESOURCES, TAVERN_SHOP_ITEMS, APOTHECARY_ITEMS } from '../utils/shopData';
import { GUILD_UPGRADES, GUILD_DECORS } from '../utils/tradeEconomy';
import { getGMStorytellerState, setGMStorytellerState, GM_ENCOUNTERS_DATABASE, GMPersonality } from '../utils/gmStoryteller';
import { validateSaveData } from '../hooks/useSaveLoad';

describe('Phase 7: End-to-End Extended Gameplay & Sub-System Simulation Suite', () => {
  it('Simulates an extensive 50-turn dungeon exploration and combat solver', () => {
    const dungeon = generateLevel(64, 40, 1, 50, 100);
    expect(dungeon.map.length).toBe(40);
    expect(dungeon.enemies.length).toBeGreaterThan(0);

    const playerStats: PlayerStats = {
      level: 1,
      hp: 50,
      maxHp: 50,
      mp: 20,
      maxMp: 20,
      atk: 12,
      def: 3,
      str: 10,
      dex: 10,
      int: 10,
      cha: 10,
      lck: 10,
      gold: 100,
      xp: 0,
      enemiesDefeated: 0,
      turnsPlayed: 0,
      scars: [],
    };

    // Ensure dungeon has at least 5 enemies for combat simulation
    for (let i = 0; i < 5; i++) {
      dungeon.enemies.push({
        id: `dummy_rat_${i}`,
        name: 'Cave Rat',
        type: 'rat',
        x: 5 + i,
        y: 5 + i,
        hp: 5,
        maxHp: 5,
        atk: 2,
        def: 0,
        range: 1,
        speed: 1,
        color: '#ff0000',
        char: 'r',
        state: 'hostile',
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
      } as any);
    }

    // Simulate 50 turns in dungeon
    for (let turn = 1; turn <= 50; turn++) {
      playerStats.turnsPlayed += 1;

      // Every 5 turns, battle an enemy if available
      if (turn % 5 === 0 && dungeon.enemies.length > 0) {
        const enemy = dungeon.enemies.shift() as Enemy;
        let combatTurn = 0;

        while (enemy.hp > 0 && playerStats.hp > 0 && combatTurn < 30) {
          combatTurn += 1;
          // Player attacks enemy
          const effectiveStats = getEffectiveStats(playerStats);
          const rawDmg = calculateCritDamage(effectiveStats.atk, effectiveStats.lck);
          const netDmg = Math.max(1, calculateNetDamage(rawDmg, enemy.def));
          enemy.hp = Math.max(0, enemy.hp - netDmg);

          if (enemy.hp <= 0) {
            playerStats.xp += 25;
            playerStats.gold += 15;
            playerStats.enemiesDefeated += 1;
            break;
          }

          // Enemy attacks player
          const enemyDmg = calculateNetDamage(enemy.atk, effectiveStats.def);
          playerStats.hp = Math.max(0, playerStats.hp - enemyDmg);
        }

        // Level up check
        const nextXp = getXpForLevel(playerStats.level + 1);
        if (playerStats.xp >= nextXp) {
          playerStats.level += 1;
          playerStats.maxHp += 10;
          playerStats.hp = playerStats.maxHp;
          playerStats.atk += 2;
        }
      }
    }

    expect(playerStats.turnsPlayed).toBe(50);
    expect(playerStats.enemiesDefeated).toBeGreaterThan(0);
    expect(playerStats.gold).toBeGreaterThan(100);
  });

  it('Simulates Town Commerce transactions across Blacksmith, Merchant, and Apothecary', () => {
    let playerGold = 500;
    const inventory: string[] = [];

    // Purchase Blacksmith Weapon
    const weapon = BLACKSMITH_SHOP_ITEMS[0];
    if (playerGold >= weapon.value) {
      playerGold -= weapon.value;
      inventory.push(weapon.id);
    }

    // Purchase Merchant Resource
    const resource = MERCHANT_RESOURCES[0];
    if (playerGold >= resource.price) {
      playerGold -= resource.price;
      inventory.push(resource.id);
    }

    // Purchase Apothecary Catalyst/Potion
    const potion = APOTHECARY_ITEMS[0];
    if (playerGold >= potion.price) {
      playerGold -= potion.price;
      inventory.push(potion.id);
    }

    expect(inventory.length).toBe(3);
    expect(playerGold).toBeLessThan(500);
  });

  it('Simulates Guild HQ Upgrades and Decor Purchases', () => {
    expect(GUILD_UPGRADES.length).toBeGreaterThan(0);
    expect(GUILD_DECORS.length).toBeGreaterThan(0);

    const upgrade = GUILD_UPGRADES[0];
    expect(upgrade.id).toBeDefined();
    expect(upgrade.costGold).toBeGreaterThan(0);
    expect(upgrade.name).toBeDefined();

    const decor = GUILD_DECORS[0];
    expect(decor.id).toBeDefined();
    expect(decor.costGold).toBeGreaterThan(0);
  });

  it('Simulates GM Storyteller dynamic boredom decay and encounter triggering', () => {
    let gmState = getGMStorytellerState();
    gmState = {
      ...gmState,
      personality: 'Mischievous' as GMPersonality,
      boredom: 85,
      tension: 60,
      disableGifts: false,
    };
    setGMStorytellerState(gmState);

    expect(getGMStorytellerState().boredom).toBe(85);

    // Filter encounters that meet minBoredom threshold
    const eligibleEncounters = GM_ENCOUNTERS_DATABASE.filter(
      (enc) => enc.minBoredom <= gmState.boredom
    );
    expect(eligibleEncounters.length).toBeGreaterThan(0);
  });

  it('Simulates Scar Acquisition and Effective Stats recalculation', () => {
    const scars = evaluateScarAcquisition(15, 10, 50, [], 10);
    // evaluateScarAcquisition might return null or a Scar depending on RNG
    // Verify getEffectiveStats function handles scar array gracefully
    const stats: PlayerStats = {
      level: 1,
      hp: 30,
      maxHp: 30,
      mp: 10,
      maxMp: 10,
      atk: 10,
      def: 2,
      str: 8,
      dex: 8,
      int: 8,
      cha: 8,
      lck: 8,
      gold: 0,
      xp: 0,
      enemiesDefeated: 0,
      turnsPlayed: 0,
      scars: scars ? [scars.scar] : [],
    };

    const effective = getEffectiveStats(stats);
    expect(effective.atk).toBeGreaterThanOrEqual(1);

    if (scars) {
      const status = getScarStatus(scars.scar, 10);
      expect(status.statusLabel).toBeDefined();
    }
  });

  it('Simulates Save Data integrity checks on complete game state snapshot', () => {
    const gameStateSnapshot = {
      playerX: 32,
      playerY: 20,
      playerStats: {
        level: 3,
        hp: 65,
        maxHp: 70,
        mp: 30,
        maxMp: 30,
        atk: 18,
        def: 5,
        str: 12,
        dex: 12,
        int: 12,
        cha: 10,
        lck: 10,
        gold: 320,
        xp: 150,
        enemiesDefeated: 8,
        turnsPlayed: 120,
        scars: [],
      },
      currentMapFloor: 1,
      overworldX: 0,
      overworldY: 0,
    };

    expect(validateSaveData(gameStateSnapshot)).toBe(true);
  });
});
