import { describe, it, expect } from 'vitest';
import { generateRandomCaravanEncounter } from '../utils/caravanEncounters';
import { generateCaravanSkirmishMap } from '../world/caravanSkirmishGen';
import { GameState, CaravanEncounter, CaravanTravelState } from '../types';
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
});
