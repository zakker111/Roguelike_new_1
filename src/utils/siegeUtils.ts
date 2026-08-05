import { Enemy, EnemyType, EnemyState } from '../types';

export const getSiegeCombatants = (
  wtX: number,
  wtY: number,
  cx: number,
  cy: number,
  attacker: string,
  defender: string,
  playerFaction: string,
  reputation: Record<string, number>
): Enemy[] => {
  const isAttackerFriendly = attacker === playerFaction || (reputation?.[attacker] !== undefined && reputation[attacker] > 40);
  const isDefenderFriendly = defender === playerFaction || (reputation?.[defender] !== undefined && reputation[defender] > 40);

  const attackerName = attacker === 'vanguard' ? 'Vanguard Crusader' : (attacker === 'syndicate' ? 'Syndicate Skirmisher' : 'Rust-Raider Outlaw');
  const attackerColor = attacker === 'vanguard' ? '#38bdf8' : (attacker === 'syndicate' ? '#c084fc' : '#f97316');
  const attackerChar = attacker === 'vanguard' ? '🗡️' : (attacker === 'syndicate' ? '☠️' : '🪓');
  
  const defenderName = defender === 'vanguard' ? 'Vanguard Shieldknight' : (defender === 'syndicate' ? 'Syndicate Enforcer' : (defender === 'bandits' ? 'Rust-Raider Sentry' : 'Independent Guard'));
  const defenderColor = defender === 'vanguard' ? '#60a5fa' : (defender === 'syndicate' ? '#a78bfa' : (defender === 'bandits' ? '#ea580c' : '#94a3b8'));
  const defenderChar = '🛡️';

  const siegeEnemies: Enemy[] = [];

  // Spawn defenders
  const defenderCoords = [
    { dx: 2, dy: 2 },
    { dx: 6, dy: 2 },
    { dx: 4, dy: 1 }
  ];
  defenderCoords.forEach((offset, idx) => {
    const isDefAllied = isDefenderFriendly;
    siegeEnemies.push({
      id: isDefAllied ? `wt_ally_defender_${idx}_${cx}_${cy}` : `siege_defender_${idx}_${cx}_${cy}`,
      x: wtX + offset.dx,
      y: wtY + offset.dy,
      type: EnemyType.OrcBrute,
      name: isDefAllied ? `🛡️ [ALLY] ${defenderName}` : `🛡️ [DEFENDER] ${defenderName}`,
      hp: 200,
      maxHp: 200,
      atk: 15,
      def: 8,
      range: 1,
      speed: 1.0,
      color: defenderColor,
      char: defenderChar,
      state: EnemyState.Chasing,
      isElite: true,
      faction: (defender === 'neutral' ? undefined : defender) as any,
      isFollower: isDefAllied,
      debuffs: [],
      patrolPath: [],
      patrolIndex: 0
    });
  });

  // Spawn attackers
  const attackerCoords = [
    { dx: 2, dy: 5 },
    { dx: 6, dy: 5 },
    { dx: 4, dy: 6 }
  ];
  attackerCoords.forEach((offset, idx) => {
    const isAttAllied = isAttackerFriendly;
    siegeEnemies.push({
      id: isAttAllied ? `wt_ally_attacker_${idx}_${cx}_${cy}` : `siege_attacker_${idx}_${cx}_${cy}`,
      x: wtX + offset.dx,
      y: wtY + offset.dy,
      type: EnemyType.Bandit,
      name: isAttAllied ? `⚔️ [ALLY] ${attackerName}` : `🔥 [ATTACKER] ${attackerName}`,
      hp: 180,
      maxHp: 180,
      atk: 18,
      def: 4,
      range: 1,
      speed: 1.0,
      color: attackerColor,
      char: attackerChar,
      state: EnemyState.Chasing,
      isElite: true,
      faction: attacker as any,
      isFollower: isAttAllied,
      debuffs: [],
      patrolPath: [],
      patrolIndex: 0
    });
  });

  // If player is neutral or has no friendly siege side, spawn 2 Allied Sellswords to fight alongside player!
  if (!isAttackerFriendly && !isDefenderFriendly) {
    const mercCoords = [
      { dx: 1, dy: 7 },
      { dx: 7, dy: 7 }
    ];
    mercCoords.forEach((offset, idx) => {
      siegeEnemies.push({
        id: `wt_ally_merc_${idx}_${cx}_${cy}`,
        x: wtX + offset.dx,
        y: wtY + offset.dy,
        type: EnemyType.Bandit,
        name: `⚔️ [ALLY] Allied Sellsword`,
        hp: 170,
        maxHp: 170,
        atk: 14,
        def: 5,
        range: 1,
        speed: 1.0,
        color: '#fbbf24',
        char: '⚔️',
        state: EnemyState.Chasing,
        isElite: true,
        isFollower: true,
        debuffs: [],
        patrolPath: [],
        patrolIndex: 0
      });
    });
  }

  return siegeEnemies;
};
