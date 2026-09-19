/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { TileType, EnemyType, EnemyState, GameState, ElementalTile } from '../types';
import {
  advanceElementalPropagation,
  igniteTile,
  freezeWaterAt,
  electrifyConnectedWater,
  spawnPoisonGasAt,
  isTileFlammable,
} from '../utils/elemental';
import { hasLineOfSight } from '../utils/ai';
import { createNewGameRun } from '../utils/gameStateFactory';

describe('Pillar 2: Elemental Propagation Engine', () => {
  it('correctly determines flammable vs non-flammable tiles', () => {
    expect(isTileFlammable(TileType.Grass)).toBe(true);
    expect(isTileFlammable(TileType.Tree)).toBe(true);
    expect(isTileFlammable(TileType.Door)).toBe(true);
    expect(isTileFlammable(TileType.Water)).toBe(false);
    expect(isTileFlammable(TileType.Wall)).toBe(false);
    expect(isTileFlammable(TileType.Floor)).toBe(false);
  });

  it('ignites a tile and adds it to the active elemental field list', () => {
    const fields = igniteTile([], 5, 5, 4, 3);
    expect(fields.length).toBe(1);
    expect(fields[0].element).toBe('fire');
    expect(fields[0].x).toBe(5);
    expect(fields[0].y).toBe(5);
    expect(fields[0].duration).toBe(4);
    expect(fields[0].intensity).toBe(3);
  });

  it('spreads fire to adjacent flammable tiles and turns consumed vegetation to Ash', () => {
    const baseState = createNewGameRun(12345);
    // Setup a 10x10 area of grass
    const map: TileType[][] = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => TileType.Floor)
    );
    map[5][5] = TileType.Grass;
    map[5][6] = TileType.Grass;
    map[6][5] = TileType.Tree;

    let currentState: GameState = {
      ...baseState,
      map,
      elementalFields: [
        { id: 'f1', element: 'fire', x: 5, y: 5, duration: 3, intensity: 3 },
      ],
      enemies: [],
    };

    let hasSpread = false;
    let hasTurnedToAsh = false;

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

    try {
      for (let turn = 0; turn < 6; turn++) {
        const res = advanceElementalPropagation(currentState, 0, 0);
        if (res.mapModifications.some((m) => m.x === 5 && m.y === 5 && m.newTile === TileType.Ash)) {
          hasTurnedToAsh = true;
        }
        if (res.updatedFields.some((f) => f.element === 'fire' && (f.x !== 5 || f.y !== 5))) {
          hasSpread = true;
        }
        const nextMap = currentState.map.map((row) => [...row]);
        for (const mod of res.mapModifications) {
          nextMap[mod.y][mod.x] = mod.newTile;
        }
        currentState = {
          ...currentState,
          map: nextMap,
          elementalFields: res.updatedFields,
        };
        if (hasSpread && hasTurnedToAsh) break;
      }
    } finally {
      randomSpy.mockRestore();
    }

    expect(hasTurnedToAsh).toBe(true);
    expect(hasSpread).toBe(true);
  });

  it('freezes water into Ice tiles and melts back to water when exposed to fire', () => {
    const map: TileType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => TileType.Water)
    );

    // Freeze water at (2, 2)
    const freezeRes = freezeWaterAt(map, [], 2, 2, 5);
    expect(freezeRes.updatedMap[2][2]).toBe(TileType.Ice);
    expect(freezeRes.updatedFields.some((f) => f.element === 'ice' && f.x === 2 && f.y === 2)).toBe(true);

    // Ignite fire on the ice tile: fire should melt ice into water and create steam
    const baseState = createNewGameRun(12345);
    const gameState: GameState = {
      ...baseState,
      map: freezeRes.updatedMap,
      elementalFields: [
        { id: 'ice1', element: 'ice', x: 2, y: 2, duration: 5, intensity: 1 },
        { id: 'fire1', element: 'fire', x: 2, y: 2, duration: 2, intensity: 2 },
      ],
      enemies: [],
    };

    const res = advanceElementalPropagation(gameState, 0, 0);
    const waterMod = res.mapModifications.find((m) => m.x === 2 && m.y === 2);
    expect(waterMod?.newTile).toBe(TileType.Water);
    expect(res.updatedFields.some((f) => f.element === 'steam' && f.x === 2 && f.y === 2)).toBe(true);
  });

  it('electrifies contiguous water bodies and shocks targets standing in them', () => {
    const map: TileType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => TileType.Floor)
    );
    // Connect water in a line: (1,1), (2,1), (3,1)
    map[1][1] = TileType.Water;
    map[1][2] = TileType.Water;
    map[1][3] = TileType.Water;

    const shockRes = electrifyConnectedWater(map, [], 1, 1, 4);
    expect(shockRes.shockedCoordinates.length).toBe(3);
    expect(shockRes.updatedFields.length).toBe(3);
    expect(shockRes.updatedFields.every((f) => f.element === 'shock')).toBe(true);

    // Target standing in electrified water takes shock damage
    const baseState = createNewGameRun(12345);
    const gameState: GameState = {
      ...baseState,
      map,
      elementalFields: shockRes.updatedFields,
      enemies: [
        {
          id: 'test_goblin',
          name: 'Goblin',
          type: EnemyType.Goblin,
          x: 3,
          y: 1,
          hp: 20,
          maxHp: 20,
          atk: 3,
          def: 0,
          range: 1,
          speed: 1,
          color: '#fff',
          char: 'g',
          state: EnemyState.Chasing,
          isElite: false,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
        },
      ],
    };

    const res = advanceElementalPropagation(gameState, 0, 0);
    const enemyDmg = res.entityDamages.find((d) => d.entityId === 'test_goblin');
    expect(enemyDmg).toBeDefined();
    expect(enemyDmg!.damage).toBeGreaterThan(0);
  });

  it('triggers a violent gas deflagration explosion when fire contacts poison gas', () => {
    const baseState = createNewGameRun(12345);
    const map: TileType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => TileType.Floor)
    );

    const gameState: GameState = {
      ...baseState,
      map,
      elementalFields: [
        { id: 'gas1', element: 'poison_gas', x: 2, y: 2, duration: 4, intensity: 2 },
        { id: 'fire1', element: 'fire', x: 2, y: 2, duration: 3, intensity: 2 },
      ],
      enemies: [
        {
          id: 'explosive_target',
          name: 'Bandit',
          type: EnemyType.Bandit,
          x: 2,
          y: 2,
          hp: 30,
          maxHp: 30,
          atk: 5,
          def: 0,
          range: 1,
          speed: 1,
          color: '#fff',
          char: 'b',
          state: EnemyState.Chasing,
          isElite: false,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
        },
      ],
    };

    const res = advanceElementalPropagation(gameState, 0, 0);

    // Deflagration should damage entities in the radius
    const targetDamage = res.entityDamages.find((d) => d.entityId === 'explosive_target');
    expect(targetDamage).toBeDefined();
    expect(targetDamage!.damage).toBeGreaterThan(10); // Heavy explosion damage

    // Log should announce deflagration
    expect(res.logs.some((l) => l.text.includes('DEFLAGRATION'))).toBe(true);

    // Poison gas should be consumed
    expect(res.updatedFields.some((f) => f.element === 'poison_gas' && f.x === 2 && f.y === 2)).toBe(false);
  });

  it('blocks line of sight through steam clouds', () => {
    const map: TileType[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => TileType.Floor)
    );

    // Without steam, line of sight is clear
    expect(hasLineOfSight(0, 0, 4, 0, map, [])).toBe(true);

    // With steam cloud between points at (2, 0), vision is obscured
    const steamFields: ElementalTile[] = [
      { id: 'steam_1', element: 'steam', x: 2, y: 0, duration: 5, intensity: 1 }
    ];
    expect(hasLineOfSight(0, 0, 4, 0, map, steamFields)).toBe(false);
  });
});
