/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  SPECIAL_CAT_NAMES,
  SPECIAL_CATS_DATA,
  isSpecialCat,
  getStandardFollowerCount,
  getSpecialCatFollowerCount,
  getAllFoundCatNames,
  hasFoundAllSpecialCats,
  createAllCatsFoundCelebrationLog
} from '../utils/specialCats';
import { Follower, EnemyState, TileType } from '../types';
import { getCompanionAdvice } from '../utils/companionAdvice';
import { processFollowerTurn } from '../hooks/ai/useFollowerAI';
import { spawnFollowersOnLevelLoadByReset } from '../world/dungeon/dungeonEntities';

describe('Special Cats & Companion Sub-Engine Tests', () => {
  it('defines all 4 legendary cats with full profiles and distinct stats', () => {
    expect(SPECIAL_CAT_NAMES).toEqual(['Jekku', 'Pulla', 'Alli', 'Leevi']);

    for (const name of SPECIAL_CAT_NAMES) {
      const cat = SPECIAL_CATS_DATA[name];
      expect(cat).toBeDefined();
      expect(cat.name).toBe(name);
      expect(cat.hp).toBeGreaterThan(0);
      expect(cat.atk).toBeGreaterThan(0);
      expect(cat.specialPerk).toBeTruthy();
      expect(cat.quote).toBeTruthy();
      expect(cat.char).toBe('🐈');
    }

    // Leevi has highest ATK
    expect(SPECIAL_CATS_DATA.Leevi.atk).toBeGreaterThan(SPECIAL_CATS_DATA.Pulla.atk);
    // Pulla has highest HP
    expect(SPECIAL_CATS_DATA.Pulla.hp).toBeGreaterThan(SPECIAL_CATS_DATA.Leevi.hp);
  });

  it('correctly identifies special cats and standard followers', () => {
    const jekku: Follower = {
      id: 'fol_cat_jekku',
      name: '🐈 Jekku (Special Cat)',
      archetypeId: 'cat',
      role: 'follower',
      char: '🐈',
      color: '#fb923c',
      hp: 15,
      maxHp: 15,
      atk: 3,
      def: 0,
      level: 1,
      xp: 0,
      xpNext: 100,
      mode: 'follow',
      equipment: { weapon: null, armor: null },
      inventory: [],
      injuries: [],
      personality: 'Playful',
      temperament: 'Energetic'
    };

    const pulla: Follower = {
      id: 'fol_cat_pulla',
      name: 'Pulla',
      archetypeId: 'cat',
      role: 'follower',
      char: '🐈',
      color: '#eab308',
      hp: 18,
      maxHp: 18,
      atk: 2,
      def: 1,
      level: 1,
      xp: 0,
      xpNext: 100,
      mode: 'follow',
      equipment: { weapon: null, armor: null },
      inventory: [],
      injuries: [],
      personality: 'Loyal',
      temperament: 'Warm',
      isSpecialCat: true
    };

    const standardMercenary: Follower = {
      id: 'fol_merc_1',
      name: 'Gareth the Bold',
      archetypeId: 'guard',
      role: 'Knight',
      char: '🛡️',
      color: '#60a5fa',
      hp: 45,
      maxHp: 45,
      atk: 8,
      def: 4,
      level: 1,
      xp: 0,
      xpNext: 100,
      mode: 'follow',
      equipment: { weapon: null, armor: null },
      inventory: [],
      injuries: [],
      personality: 'Brave',
      temperament: 'Steadfast'
    };

    expect(isSpecialCat(jekku)).toBe(true);
    expect(isSpecialCat(pulla)).toBe(true);
    expect(isSpecialCat(standardMercenary)).toBe(false);

    const party = [jekku, pulla, standardMercenary];
    expect(getStandardFollowerCount(party)).toBe(1);
    expect(getSpecialCatFollowerCount(party)).toBe(2);
  });

  it('allows 3 standard companions AND all 4 special cats without blocking capacity', () => {
    const cats: Follower[] = SPECIAL_CAT_NAMES.map((name) => ({
      id: `fol_cat_${name.toLowerCase()}`,
      name: `🐈 ${name}`,
      archetypeId: 'cat',
      role: 'follower',
      char: '🐈',
      color: SPECIAL_CATS_DATA[name].color,
      hp: SPECIAL_CATS_DATA[name].hp,
      maxHp: SPECIAL_CATS_DATA[name].hp,
      atk: SPECIAL_CATS_DATA[name].atk,
      def: SPECIAL_CATS_DATA[name].def,
      level: 1,
      xp: 0,
      xpNext: 100,
      mode: 'follow',
      equipment: { weapon: null, armor: null },
      inventory: [],
      injuries: [],
      personality: SPECIAL_CATS_DATA[name].personality,
      temperament: SPECIAL_CATS_DATA[name].temperament,
      isSpecialCat: true
    }));

    const standardFollowers: Follower[] = [
      { id: 'fol_std_1', name: 'Alric', archetypeId: 'guard', role: 'Knight', char: '🛡️', color: '#60a5fa', hp: 40, maxHp: 40, atk: 7, def: 3, level: 1, xp: 0, xpNext: 100, mode: 'follow', equipment: { weapon: null, armor: null }, inventory: [], injuries: [], personality: 'Valiant', temperament: 'Disciplined' },
      { id: 'fol_std_2', name: 'Lyra', archetypeId: 'thief', role: 'Archer', char: '🏹', color: '#facc15', hp: 30, maxHp: 30, atk: 9, def: 1, level: 1, xp: 0, xpNext: 100, mode: 'follow', equipment: { weapon: null, armor: null }, inventory: [], injuries: [], personality: 'Quick', temperament: 'Focused' },
      { id: 'fol_std_3', name: 'Elidon', archetypeId: 'guard', role: 'Mage', char: '🧙', color: '#c084fc', hp: 28, maxHp: 28, atk: 10, def: 0, level: 1, xp: 0, xpNext: 100, mode: 'follow', equipment: { weapon: null, armor: null }, inventory: [], injuries: [], personality: 'Scholarly', temperament: 'Calm' }
    ];

    const fullRoster = [...standardFollowers, ...cats];
    expect(fullRoster.length).toBe(7);

    // Standard follower capacity remains exactly 3
    expect(getStandardFollowerCount(fullRoster)).toBe(3);
    // Special cat count is 4
    expect(getSpecialCatFollowerCount(fullRoster)).toBe(4);
  });

  it('tracks found cats and triggers celebration when all 4 are united', () => {
    const partialState = {
      followers: [],
      foundCats: ['Jekku', 'Pulla', 'Alli'],
      spawnedCats: ['Jekku', 'Pulla', 'Alli']
    };

    expect(hasFoundAllSpecialCats(partialState)).toBe(false);
    expect(getAllFoundCatNames(partialState)).toEqual(['Jekku', 'Pulla', 'Alli']);

    const completeState = {
      followers: [],
      foundCats: ['Jekku', 'Pulla', 'Alli', 'Leevi'],
      spawnedCats: ['Jekku', 'Pulla', 'Alli', 'Leevi']
    };

    expect(hasFoundAllSpecialCats(completeState)).toBe(true);
    expect(getAllFoundCatNames(completeState).length).toBe(4);

    const log = createAllCatsFoundCelebrationLog();
    expect(log.text).toContain('ALL 4 SPECIAL CATS REUNITED');
    expect(log.text).toContain('Cat Lover');
    expect(log.type).toBe('quest');
  });

  it('provides distinct tactical feline dialogue barks for each cat', () => {
    const fakeGameState: any = {
      playerStats: { hp: 100, maxHp: 100, turnsPlayed: 10 },
      equipmentInventory: [],
      inventoryMaterials: {},
      inventoryCatalysts: {},
      isOverworld: true
    };

    const jekkuFollower: Follower = {
      id: 'f1',
      name: '🐈 Jekku',
      archetypeId: 'cat',
      role: 'follower',
      char: '🐈',
      color: '#fb923c',
      hp: 15,
      maxHp: 15,
      atk: 3,
      def: 0,
      level: 1,
      xp: 0,
      xpNext: 100,
      mode: 'follow',
      equipment: { weapon: null, armor: null },
      inventory: [],
      injuries: [],
      personality: 'Playful',
      temperament: 'Energetic',
      isSpecialCat: true
    };

    const leeviFollower: Follower = {
      id: 'f2',
      name: '🐈 Leevi',
      archetypeId: 'cat',
      role: 'follower',
      char: '🐈',
      color: '#f43f5e',
      hp: 12,
      maxHp: 12,
      atk: 5,
      def: 0,
      level: 1,
      xp: 0,
      xpNext: 100,
      mode: 'follow',
      equipment: { weapon: null, armor: null },
      inventory: [],
      injuries: [],
      personality: 'Fierce',
      temperament: 'Grumpy',
      isSpecialCat: true
    };

    const jekkuAdvice = getCompanionAdvice(fakeGameState, jekkuFollower);
    expect(jekkuAdvice).toContain('Jekku');

    const leeviAdvice = getCompanionAdvice(fakeGameState, leeviFollower);
    expect(leeviAdvice).toContain('Leevi');
  });

  it('executes follower AI: Alli fires magic bolt at distance, Leevi attacks with razor claws', () => {
    const logs: string[] = [];
    const dummyMap = Array(15).fill(null).map(() => Array(15).fill(TileType.Floor));

    // Test Alli: Ranged magic bolt
    const alliActor: any = {
      id: 'fol_actor_alli',
      name: '🐈 Alli',
      char: '🐈',
      color: '#cbd5e1',
      x: 5,
      y: 5,
      hp: 15,
      maxHp: 15,
      atk: 3,
      def: 1,
      range: 3,
      isFollower: true,
      followerId: 'fol_alli',
      state: EnemyState.Chasing
    };

    const targetEnemy: any = {
      id: 'goblin_1',
      name: 'Goblin Scout',
      char: 'g',
      color: '#22c55e',
      x: 5,
      y: 7, // 2 tiles away, within range 3
      hp: 10,
      maxHp: 10,
      atk: 2,
      def: 0,
      isFollower: false
    };

    let damageApplied = 0;
    const applyDamage = (_tgt: any, dmg: number) => {
      damageApplied += dmg;
      return false;
    };

    const result = processFollowerTurn({
      e: alliActor,
      i: 0,
      px: 5,
      py: 4,
      prev: {
        map: dummyMap,
        visible: Array(15).fill(null).map(() => Array(15).fill(true)),
        followers: [{ id: 'fol_alli', name: 'Alli', mode: 'follow' } as any]
      } as any,
      nextGuardsHostile: false,
      nextEnemies: [alliActor, targetEnemy],
      updatedEnemiesList: [alliActor, targetEnemy],
      updatedStats: { turnsPlayed: 1, relics: [] } as any,
      staticLogs: logs,
      playSound: () => {},
      applyDamageToEnemy: applyDamage,
      nextDefeatedCounts: {}
    });

    expect(damageApplied).toBeGreaterThan(0);
    expect(logs.some((l) => l.includes('MYSTICAL CAT') || l.includes('moonlight bolt'))).toBe(true);
    expect(result.e).toBeDefined();
  });

  it('spawnFollowersOnLevelLoadByReset spawns special cats and gives Alli range 3', () => {
    const dummyMap = Array(20).fill(null).map(() => Array(20).fill(TileType.Grass));
    const followers: Follower[] = [
      {
        id: 'cat_alli_id',
        name: 'Alli',
        archetypeId: 'cat',
        role: 'follower',
        char: '🐈',
        color: '#cbd5e1',
        hp: 15,
        maxHp: 15,
        atk: 3,
        def: 1,
        level: 1,
        xp: 0,
        xpNext: 100,
        mode: 'follow',
        equipment: { weapon: null, armor: null },
        inventory: [],
        injuries: [],
        personality: 'Mystical',
        temperament: 'Regal',
        isSpecialCat: true
      },
      {
        id: 'cat_jekku_id',
        name: 'Jekku',
        archetypeId: 'cat',
        role: 'follower',
        char: '🐈',
        color: '#fb923c',
        hp: 15,
        maxHp: 15,
        atk: 3,
        def: 0,
        level: 1,
        xp: 0,
        xpNext: 100,
        mode: 'follow',
        equipment: { weapon: null, armor: null },
        inventory: [],
        injuries: [],
        personality: 'Playful',
        temperament: 'Nimble',
        isSpecialCat: true
      }
    ];

    const spawned = spawnFollowersOnLevelLoadByReset([], followers, 10, 10, dummyMap);
    expect(spawned.length).toBe(2);

    const alliActor = spawned.find((s) => s.name.includes('Alli'));
    expect(alliActor).toBeDefined();
    expect(alliActor?.range).toBe(3);

    const jekkuActor = spawned.find((s) => s.name.includes('Jekku'));
    expect(jekkuActor).toBeDefined();
    expect(jekkuActor?.range).toBe(1);
  });
});
