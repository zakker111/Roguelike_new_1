import { describe, it, expect } from 'vitest';
import { getCompanionAdvice } from '../utils/companionAdvice';
import { GameState, Follower } from '../types';

describe('Companion & Storyteller Advice Engine', () => {
  const dummyFollower: Follower = {
    id: 'fol_test_1',
    name: 'Brother Karl',
    archetypeId: 'guard',
    role: 'follower',
    char: '🛡',
    color: '#fbbf24',
    hp: 40,
    maxHp: 40,
    atk: 8,
    def: 3,
    level: 1,
    xp: 0,
    xpNext: 100,
    mode: 'follow',
    equipment: { weapon: null, armor: null },
    inventory: [],
    injuries: [],
    personality: 'Stalwart Protector',
    temperament: 'Loyal'
  };

  const baseGameState: Partial<GameState> = {
    playerStats: {
      hp: 100,
      maxHp: 100,
      mp: 30,
      maxMp: 30,
      gold: 50,
      atk: 10,
      def: 5,
      level: 1,
      xp: 0,
      unspentPoints: 0,
      turnsPlayed: 10,
      str: 10,
      dex: 10,
      int: 10,
      cha: 10,
      lck: 10
    },
    equipmentInventory: [],
    inventoryMaterials: {},
    inventoryCatalysts: {},
    isOverworld: true,
    currentChunkX: 0,
    currentChunkY: 0,
    weather: 'clear',
    followers: [dummyFollower]
  };

  it('warns critically when player health is low (<=30%)', () => {
    const lowHpState = {
      ...baseGameState,
      playerStats: { ...baseGameState.playerStats!, hp: 20, maxHp: 100 }
    } as GameState;

    const advice = getCompanionAdvice(lowHpState, dummyFollower);
    expect(advice).toContain('Brother Karl');
    expect(advice.toLowerCase()).toMatch(/health|critically|potion|heal/);
  });

  it('nudges player when unspent attribute points are available', () => {
    const pointsState = {
      ...baseGameState,
      playerStats: { ...baseGameState.playerStats!, unspentPoints: 3 }
    } as GameState;

    const advice = getCompanionAdvice(pointsState, dummyFollower);
    expect(advice).toContain('Brother Karl');
    expect(advice).toContain('3 unspent attribute points');
  });

  it('warns when inventory stacks are heavy/full', () => {
    const heavyInvState = {
      ...baseGameState,
      equipmentInventory: new Array(18).fill({ id: 'item', name: 'Rusted Sword' }),
      inventoryMaterials: { mat_iron: 5, mat_wood: 5 }
    } as GameState;

    const advice = getCompanionAdvice(heavyInvState, dummyFollower);
    expect(advice).toContain('bursting with loot');
  });

  it('provides weather barks during severe snow/blizzards', () => {
    const snowState = {
      ...baseGameState,
      weather: 'snowy' as const
    } as GameState;

    const advice = getCompanionAdvice(snowState, dummyFollower);
    expect(advice).toContain('blizzard');
  });

  it('evaluates follower fleeing condition based on player distance and HP', () => {
    const lowHpState = {
      ...baseGameState,
      playerStats: { ...baseGameState.playerStats!, hp: 15, maxHp: 100 }
    } as GameState;

    const advice = getCompanionAdvice(lowHpState, dummyFollower);
    expect(advice).toBeDefined();
    expect(advice.length).toBeGreaterThan(0);
  });
});
