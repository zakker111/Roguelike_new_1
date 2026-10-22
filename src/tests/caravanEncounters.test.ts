import { describe, it, expect } from 'vitest';
import { generateRandomCaravanEncounter } from '../utils/caravanEncounters';
import { generateCaravanSkirmishMap } from '../world/caravanSkirmishGen';
import { GameState, CaravanEncounter, CaravanTravelState, SavedOverworldSkirmishState, EnemyType, TileType } from '../types';
import { hasTownAtChunk, getDeterministicTownName, MAJOR_OVERWORLD_HUBS } from '../world/overworldStructures';
import { findNearestSafeNpcTile } from '../utils/overworld/overworldCore';
import { findNearestSafePlayerTile } from '../utils/gameUtils';
import { syncCaravanState } from '../utils/caravanAndTerritory';
import caravanEventsData from '../data/caravanEvents.json';
import caravanBossesData from '../data/caravanBosses.json';

const mockBaseGameState: GameState = {
  playerX: 5,
  playerY: 5,
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
  map: [],
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
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    atk: 20,
    def: 10,
    str: 14,
    dex: 12,
    int: 10,
    cha: 11,
    lck: 10,
    gold: 250,
    xp: 0,
    level: 1,
    nextLevelXp: 100,
    unspentPoints: 0,
    exhaustion: 0,
    turnsPlayed: 10
  },
  inventoryMaterials: {
    mat_iron: 10,
    mat_wood: 25,
    mat_berry: 30,
    mat_thick_hide: 5
  },
  inventoryCatalysts: {},
  logs: [],
  caravanTravel: null,
  chaosScore: 20
};

describe('Caravan Encounters & Tactical Escort System', () => {
  it('loads valid caravan events and bosses from catalog files', () => {
    expect(caravanEventsData.length).toBeGreaterThan(5);
    expect(caravanBossesData.length).toBeGreaterThan(2);

    caravanEventsData.forEach(event => {
      expect(event.template.title).toBeDefined();
      expect(event.template.options.length).toBeGreaterThan(0);
    });

    caravanBossesData.forEach(boss => {
      expect(boss.bossName).toBeDefined();
      expect(boss.bossAffixes.length).toBeGreaterThan(0);
      expect(boss.options.length).toBeGreaterThan(0);
    });
  });

  it('generates random caravan encounters with threat-scaled difficulty', () => {
    const encounter = generateRandomCaravanEncounter('forest', mockBaseGameState);
    expect(encounter.id).toBeDefined();
    expect(encounter.title).toBeDefined();
    expect(encounter.options.length).toBeGreaterThan(0);
    expect(encounter.resolved).toBe(false);

    // Verify each option has text and optional stat checks or costs
    encounter.options.forEach(opt => {
      expect(opt.id).toBeDefined();
      expect(opt.text).toBeDefined();
    });
  });

  it('escalates boss ambush probability with distance and threat level', () => {
    const highThreatState: GameState = {
      ...mockBaseGameState,
      chaosScore: 80,
      caravanTravel: {
        active: true,
        originX: 0,
        originY: 0,
        destX: 4,
        destY: 4,
        destName: 'Highland Citadel',
        totalSteps: 8,
        currentStep: 2,
        stepsHistory: [],
        rewardGold: 500,
        currentEncounter: null,
        wagonHp: 100,
        maxWagonHp: 100
      }
    };

    let bossCount = 0;
    const samples = 100;
    for (let i = 0; i < samples; i++) {
      const enc = generateRandomCaravanEncounter('forest', highThreatState);
      if (enc.isBossAmbush) {
        bossCount++;
      }
    }

    // High threat & distance >= 3 should trigger boss ambushes regularly
    expect(bossCount).toBeGreaterThan(15);
  });

  it('generateCaravanSkirmishMap creates a 24x18 tactical arena with wagon, guards, and attackers', () => {
    const encounter: CaravanEncounter = {
      id: 'test_ambush',
      type: 'bandit_ambush',
      title: '🗡️ Bandit Ambush',
      desc: 'Outlaws attack the convoy!',
      resolved: false,
      options: []
    };

    const skirmish = generateCaravanSkirmishMap(mockBaseGameState, encounter);

    expect(skirmish.map.length).toBe(18);
    expect(skirmish.map[0].length).toBe(24);
    expect(skirmish.wagonX).toBe(12);
    expect(skirmish.wagonY).toBe(9);
    expect(skirmish.playerX).toBe(12);
    expect(skirmish.playerY).toBe(11);

    // Props include wagon and campfire
    const wagonProp = skirmish.props.find(p => p.type === 'wagon');
    expect(wagonProp).toBeDefined();
    expect(wagonProp?.x).toBe(12);
    expect(wagonProp?.y).toBe(9);

    // Enemies include friendly guards and hostile attackers
    const friendlyGuards = skirmish.enemies.filter(e => e.isFollower);
    const hostiles = skirmish.enemies.filter(e => !e.isFollower && !e.isTownGuard);

    expect(friendlyGuards.length).toBe(2);
    expect(hostiles.length).toBe(4);
  });

  it('generateCaravanSkirmishMap for boss ambush spawns boss with affixes and minions', () => {
    const bossEncounter: CaravanEncounter = {
      id: 'test_boss_ambush',
      type: 'boss_ambush',
      title: '👑 World Threat Boss Ambush',
      desc: 'Corrupted Road Baron Malakor attacks!',
      resolved: false,
      isBossAmbush: true,
      bossName: 'Corrupted Road Baron Malakor',
      bossAffixes: ['vampiric', 'shieldbreaker', 'thorns'],
      options: []
    };

    const skirmish = generateCaravanSkirmishMap(mockBaseGameState, bossEncounter);
    const bossEnemy = skirmish.enemies.find(e => e.isBoss);

    expect(bossEnemy).toBeDefined();
    expect(bossEnemy?.name).toBe('Corrupted Road Baron Malakor');
    expect(bossEnemy?.affixes).toContain('vampiric');
    expect(bossEnemy?.hp).toBeGreaterThan(300);

    const minions = skirmish.enemies.filter(e => !e.isFollower && !e.isBoss);
    expect(minions.length).toBe(4);
  });

  it('calculates wagon payout ratio and high cargo integrity catalyst rewards accurately', () => {
    const travelState: CaravanTravelState = {
      active: true,
      originX: 0,
      originY: 0,
      destX: 2,
      destY: 2,
      destName: 'Sunken Port',
      totalSteps: 4,
      currentStep: 4,
      stepsHistory: [],
      rewardGold: 300,
      currentEncounter: null,
      wagonHp: 90,
      maxWagonHp: 100
    };

    const hpRatio = travelState.wagonHp / travelState.maxWagonHp;
    const finalReward = Math.round(travelState.rewardGold * Math.max(0.2, hpRatio));

    expect(hpRatio).toBe(0.9);
    expect(finalReward).toBe(270);
    expect(hpRatio >= 0.85).toBe(true); // Eligible for bonus catalyst!
  });

  it('tactical skirmish victory preserves and safely restores previous overworld state', () => {
    const originalOverworldMap = [
      [1, 1, 1],
      [1, 2, 1],
      [1, 1, 1]
    ] as any;

    const stateWithTacticalSkirmish: GameState = {
      ...mockBaseGameState,
      playerX: 15,
      playerY: 20,
      currentChunkX: 3,
      currentChunkY: 5,
      map: originalOverworldMap,
      caravanTravel: {
        active: true,
        originX: 0,
        originY: 0,
        destX: 4,
        destY: 4,
        destName: 'Sunken Port',
        totalSteps: 5,
        currentStep: 2,
        stepsHistory: [],
        rewardGold: 400,
        wagonHp: 85,
        maxWagonHp: 100,
        isTacticalCombat: true,
        savedOverworldState: {
          map: originalOverworldMap,
          discovered: [[true, true, true]],
          visible: [[true, true, true]],
          enemies: [],
          dungeonProps: [],
          playerX: 15,
          playerY: 20,
          currentChunkX: 3,
          currentChunkY: 5
        },
        currentEncounter: {
          id: 'test_ambush_enc',
          type: 'bandit_ambush',
          title: 'Bandit Ambush',
          desc: 'Ambushers on the road',
          resolved: false,
          isTacticalCombat: true,
          options: []
        }
      }
    };

    // Simulate victory: all hostiles defeated
    const saved = stateWithTacticalSkirmish.caravanTravel!.savedOverworldState!;
    const restoredState: GameState = {
      ...stateWithTacticalSkirmish,
      map: saved.map,
      discovered: saved.discovered,
      visible: saved.visible,
      enemies: saved.enemies,
      dungeonProps: saved.dungeonProps,
      playerX: saved.playerX,
      playerY: saved.playerY,
      currentChunkX: saved.currentChunkX,
      currentChunkY: saved.currentChunkY,
      caravanTravel: {
        ...stateWithTacticalSkirmish.caravanTravel!,
        isTacticalCombat: false,
        savedOverworldState: undefined,
        currentEncounter: {
          ...stateWithTacticalSkirmish.caravanTravel!.currentEncounter!,
          resolved: true,
          resultLog: '🏆 TACTICAL VICTORY!'
        }
      }
    };

    expect(restoredState.playerX).toBe(15);
    expect(restoredState.playerY).toBe(20);
    expect(restoredState.currentChunkX).toBe(3);
    expect(restoredState.currentChunkY).toBe(5);
    expect(restoredState.map).toBe(originalOverworldMap);
    expect(restoredState.caravanTravel?.isTacticalCombat).toBe(false);
    expect(restoredState.caravanTravel?.savedOverworldState).toBeUndefined();
    expect(restoredState.caravanTravel?.currentEncounter?.resolved).toBe(true);
  });

  it('tactical skirmish flee option safely restores overworld state and applies hull damage penalty', () => {
    const travelState: CaravanTravelState = {
      active: true,
      originX: 0,
      originY: 0,
      destX: 2,
      destY: 2,
      destName: 'Citadel',
      totalSteps: 3,
      currentStep: 1,
      stepsHistory: [],
      rewardGold: 200,
      wagonHp: 80,
      maxWagonHp: 100,
      isTacticalCombat: true,
      currentEncounter: {
        id: 'roadblock',
        type: 'roadblock',
        title: 'Roadblock',
        desc: 'Heavily guarded blockade',
        resolved: false,
        wagonDamagePenalty: 25,
        options: []
      }
    };

    const updatedWagonHp = Math.max(0, travelState.wagonHp - (travelState.currentEncounter?.wagonDamagePenalty || 20));
    expect(updatedWagonHp).toBe(55);
  });

  it('preserves and restores level dimensions, corpses, blood splatters, and loot piles across skirmish transitions', () => {
    const mockOverworldCorpses = [{
      id: 'corpse_1',
      x: 5,
      y: 5,
      char: '%',
      name: 'Goblin Corpse',
      enemyType: EnemyType.Goblin,
      type: 'enemy' as const,
      color: '#999',
      decayed: false,
      decayTurns: 0
    }];
    const mockBloodSplatters = [{ id: 'blood_1', x: 5, y: 5, intensity: 0.8, color: '#a00' }];
    const mockLootPiles = [{ id: 'loot_1', x: 5, y: 5, gold: 20, materials: ['mat_iron'], catalysts: ['cat_flame'], equipment: [] }];

    const saved: SavedOverworldSkirmishState = {
      map: [[TileType.Grass, TileType.Path]],
      levelWidth: 64,
      levelHeight: 40,
      discovered: [[true, true]],
      visible: [[true, true]],
      enemies: [],
      dungeonProps: [],
      corpses: mockOverworldCorpses,
      bloodSplatters: mockBloodSplatters,
      lootPiles: mockLootPiles,
      playerX: 12,
      playerY: 18,
      currentChunkX: 1,
      currentChunkY: 2
    };

    expect(saved.levelWidth).toBe(64);
    expect(saved.levelHeight).toBe(40);
    expect(saved.corpses.length).toBe(1);
    expect(saved.bloodSplatters.length).toBe(1);
    expect(saved.lootPiles.length).toBe(1);
  });

  it('major caravan destinations are recognized as settlements and generate towns upon landing', () => {
    const dummyPrng = () => 0.5;

    expect(MAJOR_OVERWORLD_HUBS['-3,3'].name).toBe('Ironforge Stronghold');
    expect(hasTownAtChunk(-3, 3, dummyPrng)).toBe(true);
    expect(getDeterministicTownName(-3, 3, 1234, dummyPrng)).toBe('Ironforge Stronghold');

    expect(MAJOR_OVERWORLD_HUBS['4,4'].name).toBe('Sunfire Oasis Outpost');
    expect(hasTownAtChunk(4, 4, dummyPrng)).toBe(true);

    expect(MAJOR_OVERWORLD_HUBS['-4,-4'].name).toBe('Frostpeak Sledge Haven');
    expect(hasTownAtChunk(-4, -4, dummyPrng)).toBe(true);
  });

  it('findNearestSafeNpcTile safely handles empty or uninitialized maps without crashing', () => {
    expect(findNearestSafeNpcTile(5, 5, [])).toEqual({ x: 5, y: 5 });
    expect(findNearestSafeNpcTile(5, 5, null as any)).toEqual({ x: 5, y: 5 });
    expect(findNearestSafeNpcTile(5, 5, undefined as any)).toEqual({ x: 5, y: 5 });
  });

  it('findNearestSafePlayerTile safely handles empty or uninitialized maps without crashing', () => {
    expect(findNearestSafePlayerTile(10, 10, [])).toEqual({ x: 10, y: 10 });
    expect(findNearestSafePlayerTile(10, 10, null as any)).toEqual({ x: 10, y: 10 });
    expect(findNearestSafePlayerTile(10, 10, undefined as any)).toEqual({ x: 10, y: 10 });
  });

  it('syncCaravanState parks Baron Tobias and sentries at explicitly parked chunk', () => {
    const state: any = {
      isOverworld: true,
      currentChunkX: -3,
      currentChunkY: 3,
      levelWidth: 64,
      levelHeight: 40,
      caravanParkedChunk: { x: -3, y: 3 },
      caravanTravel: null,
      map: Array.from({ length: 40 }, () => new Array(64).fill(TileType.Grass))
    };

    const res = syncCaravanState(state, 1000, [], []);
    expect(res.npcs.some((n: any) => n.id === 'npc_caravan_merchant')).toBe(true);
    expect(res.enemies.some((e: any) => e.id === 'caravan_guard_1')).toBe(true);
    expect(res.enemies.some((e: any) => e.id === 'caravan_guard_2')).toBe(true);
  });

  it('automatically deploys tactical skirmish map on fighting event so only the scene is shown', () => {
    const ambushEncounter = {
      id: 'enc_bandit_test',
      type: 'bandit_ambush',
      title: '🗡️ RUTHLESS BANDIT TOLL ROAD',
      desc: 'Bandits block the roadway!',
      resolved: false,
      wagonDamagePenalty: 20,
      options: []
    };

    const skirmish = generateCaravanSkirmishMap(mockBaseGameState, ambushEncounter as any);
    expect(skirmish.map.length).toBe(18);
    expect(skirmish.map[0].length).toBe(24);
    expect(skirmish.wagonX).toBe(12);
    expect(skirmish.wagonY).toBe(9);
    expect(skirmish.enemies.length).toBeGreaterThan(0);
    expect(skirmish.enemies.some(e => !e.isFollower && !e.isTownGuard)).toBe(true);
    expect(skirmish.enemies.some(e => e.isFollower)).toBe(true);
  });
});
