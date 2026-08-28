import { describe, it, expect, vi } from 'vitest';
import {
  resolvePlayerStatusAndEnvironment,
  processFollowerTurn,
  processTownGuardTurn,
  processHostileTurn,
  resolveCivilianNpcTurns,
  emitAggregatedDamageFloater,
  checkTacticalCaravanVictory
} from '../hooks/ai';
import { EnemyState, EnemyType, TileType, GameState } from '../types';

function createMockGameState(): GameState {
  return {
    playerX: 10,
    playerY: 10,
    levelWidth: 30,
    levelHeight: 30,
    map: Array(30).fill(null).map(() => Array(30).fill(TileType.Floor)),
    discovered: Array(30).fill(null).map(() => Array(30).fill(true)),
    visible: Array(30).fill(null).map(() => Array(30).fill(true)),
    enemies: [],
    traps: [],
    chests: [],
    logs: [],
    playerStats: {
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      level: 1,
      xp: 0,
      gold: 50,
      atk: 10,
      def: 2,
      str: 10,
      dex: 10,
      int: 10,
      cha: 10,
      lck: 10,
      turnsPlayed: 10
    },
    currentWeapon: null,
    inventoryMaterials: {},
    inventoryCatalysts: {},
    gameDurationHours: 1,
    isOverworld: true,
    currentChunkX: 0,
    currentChunkY: 0,
    overworldChunks: {},
    equipmentInventory: [],
    equippedArmor: null,
    equippedHelmet: null,
    equippedGloves: null,
    equippedBoots: null,
    equippedShield: null,
    equippedAmulet: null,
    lootPiles: [],
    visitedTiles: {},
    gameTime: 500,
    npcs: [],
    activeTradeNpcId: null,
    biome: 'forest',
    weather: 'clear',
    season: 'spring',
    quests: [],
    followers: [],
    activeQuestBoardOpen: false,
    activeFollowerIdForInspect: null,
    isBraced: false,
    corpses: [],
    bloodSplatters: [],
    dungeonProps: [],
    dungeonLevels: {}
  };
}

describe('Modular AI Engine (src/hooks/ai/)', () => {
  it('correctly resolves player status and environmental shifts', () => {
    const gs = createMockGameState();
    const result = resolvePlayerStatusAndEnvironment(gs, 10, 10, () => false);

    expect(result.updatedStats.turnsPlayed).toBe(11);
    expect(result.nextTimeVal).toBe(504);
    expect(result.playerHp).toBe(100);
  });

  it('correctly processes follower attack targeting nearby hostile monsters', () => {
    const gs = createMockGameState();
    const follower = {
      id: 'fol_1',
      x: 10,
      y: 11,
      type: EnemyType.Goblin,
      name: 'Brave Guard',
      hp: 50,
      maxHp: 50,
      atk: 12,
      def: 4,
      range: 1,
      speed: 1,
      color: '#3b82f6',
      char: 'G',
      state: EnemyState.Chasing,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: [],
      isFollower: true
    };

    const hostile = {
      id: 'rat_1',
      x: 10,
      y: 12,
      type: EnemyType.Rat,
      name: 'Cave Rat',
      hp: 20,
      maxHp: 20,
      atk: 5,
      def: 0,
      range: 1,
      speed: 1,
      color: '#ef4444',
      char: 'r',
      state: EnemyState.Chasing,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    };

    const playSound = vi.fn();
    const applyDamage = vi.fn((target, dmg) => {
      target.hp -= dmg;
      return target.hp <= 0;
    });

    const staticLogs: string[] = [];
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const res = processFollowerTurn({
      e: follower,
      i: 0,
      px: 10,
      py: 10,
      prev: gs,
      nextGuardsHostile: false,
      nextEnemies: [follower, hostile],
      updatedEnemiesList: [follower],
      updatedStats: gs.playerStats,
      nextDefeatedCounts: {},
      staticLogs,
      playSound,
      applyDamageToEnemy: applyDamage
    });

    expect(applyDamage).toHaveBeenCalledWith(hostile, 12);
    expect(res.e.id).toBe('fol_1');
    expect(staticLogs.some(l => l.includes('Brave Guard strikes Cave Rat'))).toBe(true);

    randomSpy.mockRestore();
  });

  it('correctly processes town guard responses and threat intercepts', () => {
    const gs = createMockGameState();
    const guard = {
      id: 'guard_1',
      x: 15,
      y: 15,
      type: EnemyType.Goblin,
      name: 'Town Guard Sentry',
      hp: 60,
      maxHp: 60,
      atk: 15,
      def: 5,
      range: 1,
      speed: 1,
      color: '#3b82f6',
      char: '🛡️',
      state: EnemyState.Patrolling,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: [],
      isTownGuard: true,
      shift: 'day' as const
    };

    const hostile = {
      id: 'orc_1',
      x: 15,
      y: 16,
      type: EnemyType.OrcBrute,
      name: 'Orc Marauder',
      hp: 40,
      maxHp: 40,
      atk: 10,
      def: 2,
      range: 1,
      speed: 1,
      color: '#ef4444',
      char: 'O',
      state: EnemyState.Chasing,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    };

    const playSound = vi.fn();
    const applyDamage = vi.fn((target, dmg) => {
      target.hp -= dmg;
      return target.hp <= 0;
    });

    const staticLogs: string[] = [];
    const res = processTownGuardTurn({
      e: guard,
      i: 0,
      px: 10,
      py: 10,
      prev: gs,
      nextEnemies: [guard, hostile],
      updatedEnemiesList: [guard],
      nextDefeatedCounts: {},
      staticLogs,
      playSound,
      applyDamageToEnemy: applyDamage
    });

    expect(applyDamage).toHaveBeenCalledWith(hostile, 13);
    expect(res.e.id).toBe('guard_1');
    expect(staticLogs.some(l => l.includes('Town Guard strikes hostile Orc Marauder'))).toBe(true);
  });

  it('correctly processes hostile monster combat resolution against the player', () => {
    const gs = createMockGameState();
    const hostile = {
      id: 'orc_1',
      x: 10,
      y: 11,
      type: EnemyType.OrcBrute,
      name: 'Orc Marauder',
      hp: 30,
      maxHp: 30,
      atk: 14,
      def: 2,
      range: 1,
      speed: 1,
      color: '#ef4444',
      char: 'O',
      state: EnemyState.Chasing,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    };

    const playSound = vi.fn();
    const applyDamage = vi.fn();
    const staticLogs: string[] = [];

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const res = processHostileTurn({
      e: hostile,
      i: 0,
      px: 10,
      py: 10,
      playerHp: 100,
      prev: gs,
      nextGuardsHostile: false,
      nextEnemies: [hostile],
      updatedEnemiesList: [],
      updatedStats: gs.playerStats,
      activeScars: [],
      updatedEffects: [],
      nextDefeatedCounts: {},
      incomingPlayerDamage: 0,
      incomingPlayerHits: 0,
      hadPlayerCrit: false,
      hadPlayerBrace: false,
      staticLogs,
      playSound,
      applyDamageToEnemy: applyDamage
    });

    expect(res.playerHp).toBeLessThan(100);
    expect(res.incomingPlayerDamage).toBeGreaterThan(0);
    expect(res.incomingPlayerHits).toBe(1);
    expect(staticLogs.some(l => l.includes('Orc Marauder attacks you'))).toBe(true);

    randomSpy.mockRestore();
  });

  it('handles civilian NPC schedules and cat movements smoothly', () => {
    const gs = createMockGameState();
    const cat = {
      id: 'npc_cat_1',
      name: 'Jekku',
      role: 'special_cat' as const,
      char: '🐱',
      color: '#fbbf24',
      x: 12,
      y: 12,
      homeX: 12,
      homeY: 12,
      workX: 12,
      workY: 12,
      dialogue: ['Meow!'],
      scheduleState: 'home' as const
    };

    const staticLogs: string[] = [];
    const applyDamage = vi.fn();

    const npcs = resolveCivilianNpcTurns({
      nextNpcs: [cat],
      nextEnemies: [],
      updatedEnemiesList: [],
      prev: gs,
      px: 10,
      py: 10,
      nextGuardsHostile: false,
      staticLogs,
      applyDamageToEnemy: applyDamage
    });

    expect(npcs.length).toBe(1);
    expect(npcs[0].id).toBe('npc_cat_1');
  });

  it('checks tactical caravan combat victory and awards bonus gold and xp', () => {
    const playSound = vi.fn();
    const staticLogs: string[] = [];
    const stats = { ...createMockGameState().playerStats, gold: 100, xp: 50 };

    const caravan = {
      active: true,
      originX: 0,
      originY: 0,
      destX: 10,
      destY: 10,
      destName: 'Port Town',
      totalSteps: 10,
      currentStep: 5,
      stepsHistory: [],
      rewardGold: 100,
      wagonHp: 80,
      maxWagonHp: 100,
      isTacticalCombat: true,
      currentEncounter: {
        id: 'enc_1',
        type: 'bandit_ambush' as const,
        title: 'Bandit Ambush',
        desc: 'Bandits attacked!',
        options: [],
        resolved: false,
        isBossAmbush: false
      }
    };

    const res = checkTacticalCaravanVictory(caravan, [], stats, staticLogs, playSound);
    expect(res.nextCaravanTravel?.isTacticalCombat).toBe(false);
    expect(res.nextCaravanTravel?.currentEncounter?.resolved).toBe(true);
    expect(res.updatedStats.gold).toBe(225);
    expect(res.updatedStats.xp).toBe(150);
    expect(playSound).toHaveBeenCalledWith('victory');
  });
});
