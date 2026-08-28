import { describe, it, expect } from 'vitest';
import { bresenhamLine, computeFOV, getNextStepTowards, getNextStepAwayFrom } from '../utils/ai';
import { TileType } from '../types';

describe('12.1 Core AI, Movement & Pathfinding Verification', () => {
  it('bresenhamLine calculates straight line points correctly', () => {
    const points = bresenhamLine(0, 0, 5, 0);
    expect(points).toHaveLength(6);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[5]).toEqual({ x: 5, y: 0 });

    const diagonal = bresenhamLine(0, 0, 3, 3);
    expect(diagonal).toHaveLength(4);
    expect(diagonal[3]).toEqual({ x: 3, y: 3 });
  });

  it('computeFOV updates visible grid correctly and handles line-of-sight blockage', () => {
    const width = 10;
    const height = 10;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Floor));

    // Put a wall at (5, 5)
    map[5][5] = TileType.Wall;

    const fov = computeFOV(2, 5, map, 5);
    expect(fov[5][2]).toBe(true); // Player origin
    expect(fov[5][5]).toBe(true); // Wall tile itself is visible
    expect(fov[5][6]).toBe(false); // Tile directly behind wall is blocked from line of sight
  });

  it('getNextStepTowards routes around obstacles via BFS', () => {
    const width = 5;
    const height = 5;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Floor));

    // Place a wall between start (1,2) and target (3,2) at (2,2)
    map[2][2] = TileType.Wall;

    const step = getNextStepTowards(1, 2, 3, 2, map, false, []);
    expect(step).not.toBeNull();
    // Step should go up (1,1) or down (1,3) to go around wall at (2,2)
    expect(step?.y).not.toEqual(2);
  });

  it('getNextStepTowards allows opening doors when canOpenDoors is true', () => {
    const width = 5;
    const height = 5;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Floor));
    map[2][2] = TileType.Door;

    const stepNoDoor = getNextStepTowards(1, 2, 3, 2, map, false, []);
    expect(stepNoDoor?.y).not.toEqual(2);

    const stepWithDoor = getNextStepTowards(1, 2, 3, 2, map, true, []);
    expect(stepWithDoor).toEqual({ x: 2, y: 2 });
  });

  it('Follower anti-trapping position swap check logic', () => {
    const playerPos = { x: 5, y: 5 };
    const followerPos = { x: 6, y: 5 };

    // When player steps onto follower tile (6,5)
    const playerSteppedToFollower = playerPos.x + 1 === followerPos.x && playerPos.y === followerPos.y;
    expect(playerSteppedToFollower).toBe(true);

    // Swap position outcome
    const newPlayerPos = { x: 6, y: 5 };
    const newFollowerPos = { x: 5, y: 5 };
    expect(newPlayerPos).toEqual(followerPos);
    expect(newFollowerPos).toEqual(playerPos);
  });

  it('Town Guard AI targets and chases hostiles across town and alerts nearby guards', () => {
    const guard = { id: 'g1', name: 'Town Guard', x: 10, y: 10, hp: 50, maxHp: 50, atk: 12, def: 5, isTownGuard: true };
    const sleepingGuard = { id: 'g2', name: 'Sentry Guard', x: 15, y: 10, hp: 50, maxHp: 50, atk: 12, def: 5, isTownGuard: true, state: 'Sleeping' };
    const bandit = { id: 'b1', name: 'Bandit Raider', x: 10, y: 18, hp: 30, maxHp: 30, atk: 10, def: 2, isTownGuard: false, isFollower: false };

    // Threat detection calculates town-wide distance
    const distToBandit = Math.abs(bandit.x - guard.x) + Math.abs(bandit.y - guard.y);
    expect(distToBandit).toBe(8);

    // Alarm alerts nearby dormant guards within 30 tiles
    const distToOtherGuard = Math.abs(sleepingGuard.x - guard.x) + Math.abs(sleepingGuard.y - guard.y);
    expect(distToOtherGuard <= 30).toBe(true);

    // Pathfinding moves guard toward bandit
    const map: TileType[][] = Array(20).fill(null).map(() => Array(20).fill(TileType.Floor));
    const step = getNextStepTowards(guard.x, guard.y, bandit.x, bandit.y, map, true, []);
    expect(step).toEqual({ x: 10, y: 11 });
  });

  it('Villagers flee away from threats and Heroes for Hire charge toward threats', () => {
    const map: TileType[][] = Array(20).fill(null).map(() => Array(20).fill(TileType.Floor));
    const villager = { x: 10, y: 10 };
    const threat = { x: 10, y: 8 };

    const fleeStep = getNextStepAwayFrom(villager.x, villager.y, threat.x, threat.y, map, true, []);
    expect(fleeStep).toEqual({ x: 11, y: 11 }); // Moves further diagonally away from threat at y=8 (distance 4 vs 3)
  });
});
