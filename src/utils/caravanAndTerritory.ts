import { NPC, Enemy, EnemyType, EnemyState } from '../types';
import { hasTownAtChunk } from './overworld';

export const syncCaravanState = (prev: any, nextTimeVal: number, nextNpcs: NPC[], nextEnemies: Enemy[]): { npcs: NPC[], enemies: Enemy[] } => {
  let finalNpcs = [...nextNpcs];
  let finalEnemies = [...nextEnemies];

  if (prev.isOverworld) {
    const currentDay = Math.floor(nextTimeVal / 1440) + 1;
    const cycle = (currentDay - 1) % 4; // 4-day cycle
    
    // Oakhaven owns caravan on Day 1 & 2 (cycle 0,1). Other towns own it on Day 3 & 4 (cycle 2,3)
    const hasTownInCurrentChunk = hasTownAtChunk(prev.currentChunkX, prev.currentChunkY);
    const isCaravanParkedHere = hasTownInCurrentChunk && (
      (prev.currentChunkX === 0 && prev.currentChunkY === 0) ? (cycle === 0 || cycle === 1) : (cycle === 2 || cycle === 3)
    );

    if (isCaravanParkedHere) {
      const midX = Math.floor((prev.levelWidth || 64) / 2);
      const midY = Math.floor((prev.levelHeight || 40) / 2);

      // Inject Lead Caravaneer
      if (!finalNpcs.some(n => n.id === 'npc_caravan_merchant')) {
        finalNpcs.push({
          id: 'npc_caravan_merchant',
          name: 'Baron Tobias (Caravan)',
          role: 'merchant',
          char: 'C',
          color: '#fbbf24',
          x: midX - 2,
          y: midY + 2,
          homeX: midX - 2,
          homeY: midY + 2,
          workX: midX - 2,
          workY: midY + 2,
          scheduleState: 'work',
          dialogue: [
            "Greetings! My traveled merchant caravan has parked here in the town center square. I buy raw ores and sell fine supplies!",
            "My guards protect our horse carriage from bandits and trolls as we navigate the roads.",
            "We sleep inside our caravan covered wagons. Check out our fresh Bread and Frothy Beers!"
          ]
        });
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
          x: midX - 3,
          y: midY + 2,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: midX - 5, y: midY + 2 }, { x: midX - 1, y: midY + 2 }],
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
          x: midX - 1,
          y: midY + 2,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: midX - 2, y: midY + 1 }, { x: midX - 2, y: midY + 3 }],
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
