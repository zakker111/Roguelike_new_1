import { NPC, Enemy, EnemyType, EnemyState, TileType } from '../types';
import { hasTownAtChunk, findNearestSafeNpcTile, isTileSafeForNpc } from './overworld';

export const syncCaravanState = (prev: any, nextTimeVal: number, nextNpcs: NPC[], nextEnemies: Enemy[]): { npcs: NPC[], enemies: Enemy[] } => {
  let finalNpcs = [...nextNpcs];
  let finalEnemies = [...nextEnemies];

  if (prev.isOverworld && !prev.caravanTravel?.isTacticalCombat) {
    const currentDay = Math.floor(nextTimeVal / 1440) + 1;
    const cycle = (currentDay - 1) % 4; // 4-day cycle
    
    // Oakhaven owns caravan on Day 1 & 2 (cycle 0,1). Other towns own it on Day 3 & 4 (cycle 2,3).
    // Also respect explicitly parked caravan chunk.
    const hasTownInCurrentChunk = hasTownAtChunk(prev.currentChunkX, prev.currentChunkY);
    const isCaravanParkedHere = hasTownInCurrentChunk && (
      (prev.caravanParkedChunk && prev.caravanParkedChunk.x === prev.currentChunkX && prev.caravanParkedChunk.y === prev.currentChunkY) ||
      ((prev.currentChunkX === 0 && prev.currentChunkY === 0) ? (cycle === 0 || cycle === 1) : (cycle === 2 || cycle === 3))
    );

    if (isCaravanParkedHere) {
      const midX = Math.floor((prev.levelWidth || 64) / 2);
      const midY = Math.floor((prev.levelHeight || 40) / 2);

      const safeCaravanPos = prev.map ? findNearestSafeNpcTile(midX - 2, midY + 2, prev.map) : { x: midX - 2, y: midY + 2 };
      const safeGuard1Pos = prev.map ? findNearestSafeNpcTile(midX - 3, midY + 2, prev.map) : { x: midX - 3, y: midY + 2 };
      const safeGuard2Pos = prev.map ? findNearestSafeNpcTile(midX - 1, midY + 2, prev.map) : { x: midX - 1, y: midY + 2 };

      // Inject Lead Caravaneer
      const existingCaravanIdx = finalNpcs.findIndex(n => n.id === 'npc_caravan_merchant');
      if (existingCaravanIdx === -1) {
        finalNpcs.push({
          id: 'npc_caravan_merchant',
          name: 'Baron Tobias (Caravan)',
          role: 'merchant',
          char: 'C',
          color: '#fbbf24',
          x: safeCaravanPos.x,
          y: safeCaravanPos.y,
          homeX: safeCaravanPos.x,
          homeY: safeCaravanPos.y,
          workX: safeCaravanPos.x,
          workY: safeCaravanPos.y,
          scheduleState: 'work',
          dialogue: [
            "Greetings! My traveled merchant caravan has parked here in the town center square. I buy raw ores and sell fine supplies!",
            "My guards protect our horse carriage from bandits and trolls as we navigate the roads.",
            "We sleep inside our caravan covered wagons. Check out our fresh Bread and Frothy Beers!"
          ]
        });
      } else if (prev.map) {
        // Relocate existing caravan merchant if situated on an invalid or window tile
        const cNpc = finalNpcs[existingCaravanIdx];
        if (prev.map[cNpc.y]?.[cNpc.x] === TileType.Window || !isTileSafeForNpc(prev.map[cNpc.y]?.[cNpc.x])) {
          const relocated = findNearestSafeNpcTile(cNpc.x, cNpc.y, prev.map);
          finalNpcs[existingCaravanIdx] = {
            ...cNpc,
            x: relocated.x,
            y: relocated.y,
            homeX: relocated.x,
            homeY: relocated.y,
            workX: relocated.x,
            workY: relocated.y
          };
        }
      }

      // Inject Caravaneer Sentry guards (allied)
      if (!finalEnemies.some(e => e.id === 'caravan_guard_1')) {
        finalEnemies.push({
          id: 'caravan_guard_1',
          name: 'Caravan Ranger [Allied]',
          char: '🛡',
          color: '#60a5fa',
          hp: 55,
          maxHp: 55,
          atk: 5,
          def: 4,
          type: EnemyType.OrcBrute,
          x: safeGuard1Pos.x,
          y: safeGuard1Pos.y,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: safeGuard1Pos.x - 2, y: safeGuard1Pos.y }, { x: safeGuard1Pos.x + 2, y: safeGuard1Pos.y }],
          patrolIndex: 0,
          debuffs: [],
          isTownGuard: true,
          speed: 1.0,
          range: 1
        });
        finalEnemies.push({
          id: 'caravan_guard_2',
          name: 'Caravan Sentry [Allied]',
          char: '🛡',
          color: '#60a5fa',
          hp: 55,
          maxHp: 55,
          atk: 5,
          def: 4,
          type: EnemyType.OrcBrute,
          x: safeGuard2Pos.x,
          y: safeGuard2Pos.y,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: safeGuard2Pos.x, y: safeGuard2Pos.y - 1 }, { x: safeGuard2Pos.x, y: safeGuard2Pos.y + 1 }],
          patrolIndex: 0,
          debuffs: [],
          isTownGuard: true,
          speed: 1.0,
          range: 1
        });
      }
    } else {
      // Filter caravan out if departed
      finalNpcs = finalNpcs.filter(n => n.id !== 'npc_caravan_merchant');
      finalEnemies = finalEnemies.filter(e => e.id !== 'caravan_guard_1' && e.id !== 'caravan_guard_2');
    }
  }

  return { npcs: finalNpcs, enemies: finalEnemies };
};

export function getRegionIdForChunk(cx: number, cy: number): 'borderlands' | 'shadow_fjord' | 'moonshadow_cove' | 'sunplate_ridge' | 'swamp_of_whispers' {
  if (Math.abs(cx) <= 1 && Math.abs(cy) <= 1) return 'borderlands';
  if (cx < 0 && cy < 0) return 'moonshadow_cove';
  if (cx > 0 && cy > 0) return 'sunplate_ridge';
  if (cx > 0 && cy < 0) return 'swamp_of_whispers';
  return 'shadow_fjord';
}

export function getUpdatedTerritoriesOnKill(
  prevTerritories: { [id: string]: any } | undefined,
  cx: number,
  cy: number,
  playerFaction: 'neutral' | 'syndicate' | 'vanguard',
  killedEnemy: any
): { territories: { [id: string]: any }; logText: string | null; isFlip: boolean } {
  if (!prevTerritories) return { territories: {}, logText: null, isFlip: false };
  const regionId = getRegionIdForChunk(cx, cy);
  const territory = prevTerritories[regionId];
  if (!territory) return { territories: prevTerritories, logText: null, isFlip: false };

  // Only update if player is aligned with syndicate or vanguard, and the killed enemy is not friendly
  if (playerFaction === 'neutral') return { territories: prevTerritories, logText: null, isFlip: false };
  if (killedEnemy.isFollower || killedEnemy.isTownGuard || killedEnemy.isAnimal) {
    return { territories: prevTerritories, logText: null, isFlip: false };
  }

  const nextTerritories = { ...prevTerritories };
  const currentController = territory.controller;
  const currentControlPercent = territory.controlPercent;
  const targetFaction = playerFaction;

  let newController = currentController;
  let newControlPercent = currentControlPercent;
  let logText = null;
  let isFlip = false;

  if (currentController === targetFaction) {
    newControlPercent = Math.min(100, currentControlPercent + 5);
    logText = `⚔️ Territory Conquest: Your faction's control of ${territory.name} increased to ${newControlPercent}%!`;
  } else {
    newControlPercent = currentControlPercent - 5;
    if (newControlPercent <= 0) {
      newController = targetFaction;
      newControlPercent = 5;
      isFlip = true;
      const fName = targetFaction === 'syndicate' ? 'Moonshadow Syndicate 🌙' : 'Dawn Vanguard ☀️';
      logText = `🚩 TERRITORY SECURED! The ${fName} has captured ${territory.name}! Claim tax dividends and buffs in the Guild War Room.`;
    } else {
      const opposingName = currentController === 'neutral' ? 'Neutral forces' : (currentController === 'outlaw' ? 'Outlaw syndicates' : (currentController === 'syndicate' ? 'Moonshadow Syndicate' : 'Dawn Vanguard'));
      logText = `⚔️ Territory Conquest: Influence of ${opposingName} in ${territory.name} reduced to ${newControlPercent}%!`;
    }
  }

  nextTerritories[regionId] = {
    ...territory,
    controller: newController,
    controlPercent: newControlPercent,
    contested: newControlPercent < 100
  };

  return { territories: nextTerritories, logText, isFlip };
}
