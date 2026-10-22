/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyType, EnemyState } from '../../types';
import type { FactionId, OutpostSiegeState } from '../../types/worldEvents';

export interface SpawnSiegeParams {
  wtX: number;
  wtY: number;
  chunkX: number;
  chunkY: number;
  attackerFaction: FactionId;
  defenderFaction: FactionId;
  playerFaction: string;
  playerReputation: Record<string, number>;
  defenseTier?: 1 | 2 | 3;
}

export function spawnOutpostSiegeSquads({
  wtX,
  wtY,
  chunkX,
  chunkY,
  attackerFaction,
  defenderFaction,
  playerFaction,
  playerReputation,
  defenseTier = 1
}: SpawnSiegeParams): { enemies: Enemy[]; siegeState: OutpostSiegeState } {
  const enemies: Enemy[] = [];

  const isAttackerFriendly =
    attackerFaction === playerFaction ||
    (playerReputation?.[attackerFaction] !== undefined && playerReputation[attackerFaction] >= 25);

  const isDefenderFriendly =
    defenderFaction === playerFaction ||
    (playerReputation?.[defenderFaction] !== undefined && playerReputation[defenderFaction] >= 25);

  const statMultiplier = 1 + (defenseTier - 1) * 0.35;
  const bountyGold = Math.round(150 * defenseTier + (chunkX * chunkX + chunkY * chunkY) * 2);

  // 1. DEFENDER SQUAD
  const defPackId = `pack_def_${chunkX}_${chunkY}_${Date.now()}`;
  const defLeaderId = `siege_def_lead_${chunkX}_${chunkY}`;

  // Defender Commander
  const defLeaderName =
    defenderFaction === 'vanguard'
      ? 'Vanguard Outpost Captain'
      : defenderFaction === 'syndicate'
      ? 'Syndicate Cellmaster'
      : 'Frontier Outpost Commander';
  const defColor =
    defenderFaction === 'vanguard' ? '#38bdf8' : defenderFaction === 'syndicate' ? '#a855f7' : '#94a3b8';

  enemies.push({
    id: defLeaderId,
    x: wtX + 4,
    y: wtY + 3,
    type: EnemyType.DreadKnight,
    name: isDefenderFriendly ? `🛡️ [ALLY] ${defLeaderName}` : `🛡️ [DEFENDER] ${defLeaderName}`,
    hp: Math.round(220 * statMultiplier),
    maxHp: Math.round(220 * statMultiplier),
    atk: Math.round(16 * statMultiplier),
    def: Math.round(8 * statMultiplier),
    range: 1,
    speed: 1.0,
    color: defColor,
    char: '👑',
    state: EnemyState.Chasing,
    isElite: true,
    faction: (defenderFaction === 'neutral' ? undefined : defenderFaction) as any,
    isFollower: isDefenderFriendly,
    packId: defPackId,
    packLeaderId: defLeaderId,
    debuffs: [],
    patrolPath: [],
    patrolIndex: 0
  });

  // Defender Infantry (Shieldbearers)
  const defInfantrySpots = [
    { dx: 2, dy: 4 },
    { dx: 6, dy: 4 },
    { dx: 4, dy: 5 }
  ];
  defInfantrySpots.forEach((spot, idx) => {
    const infantryId = `siege_def_inf_${idx}_${chunkX}_${chunkY}`;
    const infantryName =
      defenderFaction === 'vanguard'
        ? 'Vanguard Shieldbearer'
        : defenderFaction === 'syndicate'
        ? 'Syndicate Enforcer'
        : 'Outpost Guard';

    enemies.push({
      id: infantryId,
      x: wtX + spot.dx,
      y: wtY + spot.dy,
      type: EnemyType.OrcBrute,
      name: isDefenderFriendly ? `🛡️ [ALLY] ${infantryName}` : `🛡️ [DEFENDER] ${infantryName}`,
      hp: Math.round(140 * statMultiplier),
      maxHp: Math.round(140 * statMultiplier),
      atk: Math.round(12 * statMultiplier),
      def: Math.round(6 * statMultiplier),
      range: 1,
      speed: 1.0,
      color: defColor,
      char: '🛡️',
      state: EnemyState.Chasing,
      isElite: false,
      faction: (defenderFaction === 'neutral' ? undefined : defenderFaction) as any,
      isFollower: isDefenderFriendly,
      packId: defPackId,
      packLeaderId: defLeaderId,
      debuffs: [],
      patrolPath: [],
      patrolIndex: 0
    });
  });

  // Defender Ranged Archer
  const archerId = `siege_def_arch_${chunkX}_${chunkY}`;
  enemies.push({
    id: archerId,
    x: wtX + 4,
    y: wtY + 1,
    type: EnemyType.SkeletonMage,
    name: isDefenderFriendly ? `🏹 [ALLY] Sentry Marksman` : `🏹 [DEFENDER] Sentry Marksman`,
    hp: Math.round(90 * statMultiplier),
    maxHp: Math.round(90 * statMultiplier),
    atk: Math.round(11 * statMultiplier),
    def: Math.round(3 * statMultiplier),
    range: 5,
    speed: 1.0,
    color: defColor,
    char: '🏹',
    state: EnemyState.Chasing,
    isElite: false,
    faction: (defenderFaction === 'neutral' ? undefined : defenderFaction) as any,
    isFollower: isDefenderFriendly,
    packId: defPackId,
    packLeaderId: defLeaderId,
    isHighGroundSniper: true,
    debuffs: [],
    patrolPath: [],
    patrolIndex: 0
  });

  // 2. ATTACKER SQUAD
  const attPackId = `pack_att_${chunkX}_${chunkY}_${Date.now()}`;
  const attLeaderId = `siege_att_lead_${chunkX}_${chunkY}`;

  const attLeaderName =
    attackerFaction === 'vanguard'
      ? 'Vanguard Vanguard Crusader-Lord'
      : attackerFaction === 'syndicate'
      ? 'Syndicate Night-Blade Commander'
      : 'Rust-Raider War Chief';
  const attColor =
    attackerFaction === 'vanguard' ? '#38bdf8' : attackerFaction === 'syndicate' ? '#c084fc' : '#ef4444';

  enemies.push({
    id: attLeaderId,
    x: wtX + 4,
    y: wtY + 8,
    type: EnemyType.Bandit,
    name: isAttackerFriendly ? `⚔️ [ALLY] ${attLeaderName}` : `🔥 [ATTACKER] ${attLeaderName}`,
    hp: Math.round(200 * statMultiplier),
    maxHp: Math.round(200 * statMultiplier),
    atk: Math.round(18 * statMultiplier),
    def: Math.round(5 * statMultiplier),
    range: 1,
    speed: 1.0,
    color: attColor,
    char: attackerFaction === 'vanguard' ? '🗡️' : attackerFaction === 'syndicate' ? '☠️' : '🪓',
    state: EnemyState.Chasing,
    isElite: true,
    faction: attackerFaction as any,
    isFollower: isAttackerFriendly,
    packId: attPackId,
    packLeaderId: attLeaderId,
    debuffs: [],
    patrolPath: [],
    patrolIndex: 0
  });

  // Attacker Shock Troops
  const attShockSpots = [
    { dx: 2, dy: 8 },
    { dx: 6, dy: 8 },
    { dx: 3, dy: 9 },
    { dx: 5, dy: 9 }
  ];
  attShockSpots.forEach((spot, idx) => {
    const shockId = `siege_att_shock_${idx}_${chunkX}_${chunkY}`;
    const shockName =
      attackerFaction === 'vanguard'
        ? 'Vanguard Knight'
        : attackerFaction === 'syndicate'
        ? 'Syndicate Infiltrator'
        : 'Bandit Berserker';

    enemies.push({
      id: shockId,
      x: wtX + spot.dx,
      y: wtY + spot.dy,
      type: EnemyType.Bandit,
      name: isAttackerFriendly ? `⚔️ [ALLY] ${shockName}` : `🔥 [ATTACKER] ${shockName}`,
      hp: Math.round(120 * statMultiplier),
      maxHp: Math.round(120 * statMultiplier),
      atk: Math.round(14 * statMultiplier),
      def: Math.round(3 * statMultiplier),
      range: 1,
      speed: 1.0,
      color: attColor,
      char: '⚔️',
      state: EnemyState.Chasing,
      isElite: false,
      faction: attackerFaction as any,
      isFollower: isAttackerFriendly,
      packId: attPackId,
      packLeaderId: attLeaderId,
      debuffs: [],
      patrolPath: [],
      patrolIndex: 0
    });
  });

  const siegeState: OutpostSiegeState = {
    isUnderSiege: true,
    attacker: attackerFaction,
    defender: defenderFaction,
    turnsRemaining: 100,
    maxTurns: 100,
    bountyGold,
    attackerSquadCount: 5,
    defenderSquadCount: 5,
    playerAssistedDefender: false,
    playerAssistedAttacker: false,
    siegeBannerX: wtX + 4,
    siegeBannerY: wtY + 5
  };

  return { enemies, siegeState };
}
