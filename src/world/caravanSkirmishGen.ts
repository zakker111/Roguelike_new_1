import { TileType, Enemy, EnemyState, EnemyType, GameState, CaravanEncounter, DungeonProp } from '../types';
import { calculateWorldThreatTier } from '../utils/worldThreat';

export interface CaravanSkirmishResult {
  map: TileType[][];
  discovered: boolean[][];
  visible: boolean[][];
  enemies: Enemy[];
  props: DungeonProp[];
  wagonX: number;
  wagonY: number;
  playerX: number;
  playerY: number;
}

export function generateCaravanSkirmishMap(state: GameState, encounter: CaravanEncounter): CaravanSkirmishResult {
  const width = 24;
  const height = 18;
  const threatTier = calculateWorldThreatTier(state.playerStats, state.chaosScore || 20);

  const map: TileType[][] = [];
  const discovered: boolean[][] = [];
  const visible: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const rowMap: TileType[] = [];
    const rowDisc: boolean[] = [];
    const rowVis: boolean[] = [];

    for (let x = 0; x < width; x++) {
      rowDisc.push(true);
      rowVis.push(true);

      // Borders
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        rowMap.push(TileType.Tree);
        continue;
      }

      // Dirt Road down the middle horizontal band (rows 8-10)
      if (y >= 8 && y <= 10) {
        rowMap.push(TileType.Path);
        continue;
      }

      // Decorative trees and barricades on flanks
      const rand = Math.random();
      if (rand < 0.08) {
        rowMap.push(TileType.Tree);
      } else if (rand < 0.12) {
        rowMap.push(TileType.PineTree);
      } else if (rand < 0.15) {
        rowMap.push(TileType.Bush);
      } else if (rand < 0.18) {
        rowMap.push(TileType.WatchtowerBarricade);
      } else {
        rowMap.push(TileType.Grass);
      }
    }

    map.push(rowMap);
    discovered.push(rowDisc);
    visible.push(rowVis);
  }

  const wagonX = 12;
  const wagonY = 9;
  const playerX = 12;
  const playerY = 11;

  // Clear tiles around central wagon and player
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const ty = wagonY + dy;
      const tx = wagonX + dx;
      if (ty > 0 && ty < height - 1 && tx > 0 && tx < width - 1) {
        map[ty][tx] = (ty >= 8 && ty <= 10) ? TileType.Path : TileType.Grass;
      }
    }
  }

  // Props
  const props: DungeonProp[] = [
    {
      id: 'caravan_wagon_skirmish',
      x: wagonX,
      y: wagonY,
      char: '🛒',
      name: 'Merchant Caravan Wagon',
      color: '#f59e0b',
      description: 'A heavy iron-reinforced covered trade carriage loaded with precious merchandise.',
      type: 'wagon'
    },
    {
      id: 'caravan_campfire_skirmish',
      x: wagonX - 2,
      y: wagonY + 1,
      char: '🔥',
      name: 'Guard Campfire',
      color: '#f97316',
      description: 'A smoldering guard campfire providing light.',
      type: 'campfire'
    }
  ];

  const enemies: Enemy[] = [];

  // Allied Guard 1 (Melee Defender)
  enemies.push({
    id: 'guard_ally_melee_' + Date.now(),
    x: wagonX - 1,
    y: wagonY,
    type: EnemyType.Bandit,
    name: 'Caravan Veteran Guard',
    hp: 130 + threatTier * 10,
    maxHp: 130 + threatTier * 10,
    atk: 15 + threatTier * 2,
    def: 10,
    range: 1,
    speed: 1,
    color: '#3b82f6',
    char: '🛡️',
    state: EnemyState.Chasing,
    isElite: false,
    isFollower: true,
    patrolPath: [],
    patrolIndex: 0,
    debuffs: []
  });

  // Allied Guard 2 (Crossbow Sentry)
  enemies.push({
    id: 'guard_ally_ranged_' + Date.now(),
    x: wagonX + 1,
    y: wagonY,
    type: EnemyType.SkeletonMage,
    name: 'Caravan Crossbow Sentry',
    hp: 95 + threatTier * 10,
    maxHp: 95 + threatTier * 10,
    atk: 18 + threatTier * 2,
    def: 6,
    range: 4,
    speed: 1,
    color: '#06b6d4',
    char: '🏹',
    state: EnemyState.Chasing,
    isElite: false,
    isFollower: true,
    patrolPath: [],
    patrolIndex: 0,
    debuffs: []
  });

  // Perimeter Enemies
  if (encounter.isBossAmbush) {
    // World Threat Boss
    enemies.push({
      id: 'boss_ambush_leader_' + Date.now(),
      x: wagonX,
      y: 3,
      type: EnemyType.OrcBrute,
      name: encounter.bossName || '👑 World Threat Boss',
      hp: 320 + threatTier * 45,
      maxHp: 320 + threatTier * 45,
      atk: 24 + threatTier * 3,
      def: 14,
      range: 1,
      speed: 1,
      color: '#ef4444',
      char: '👑',
      state: EnemyState.Chasing,
      isElite: true,
      isBoss: true,
      affixes: (encounter.bossAffixes as any) || ['vampiric', 'shieldbreaker', 'thorns'],
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    });

    // 4 Minion Attackers surrounding perimeter
    const minions = [
      { name: 'Corrupted Highwayman', char: '🗡️', x: 5, y: 4, type: EnemyType.Bandit, range: 1 },
      { name: 'Blood Shadow Marksman', char: '🏹', x: 19, y: 4, type: EnemyType.SkeletonMage, range: 4 },
      { name: 'Abyssal Ravager', char: '🧌', x: 5, y: 14, type: EnemyType.OrcBrute, range: 1 },
      { name: 'Dread Direwolf', char: '🐺', x: 19, y: 14, type: EnemyType.Rat, range: 1 }
    ];

    minions.forEach((m, idx) => {
      enemies.push({
        id: `boss_minion_${idx}_${Date.now()}`,
        x: m.x,
        y: m.y,
        type: m.type,
        name: m.name,
        hp: 85 + threatTier * 12,
        maxHp: 85 + threatTier * 12,
        atk: 14 + threatTier * 2,
        def: 6,
        range: m.range,
        speed: 1,
        color: '#f87171',
        char: m.char,
        state: EnemyState.Chasing,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      });
    });
  } else {
    // Regular Ambush / Attack
    const attackers = [
      { name: 'Outlaw Raider', char: '🗡️', x: 6, y: 4, type: EnemyType.Bandit, range: 1 },
      { name: 'Bandit Marksman', char: '🏹', x: 18, y: 4, type: EnemyType.SkeletonMage, range: 4 },
      { name: 'Hungry Forest Beast', char: '🐺', x: 6, y: 13, type: EnemyType.OrcBrute, range: 1 },
      { name: 'Road Marauder', char: '🪓', x: 18, y: 13, type: EnemyType.Bandit, range: 1 }
    ];

    attackers.forEach((a, idx) => {
      enemies.push({
        id: `ambush_attacker_${idx}_${Date.now()}`,
        x: a.x,
        y: a.y,
        type: a.type,
        name: a.name,
        hp: 75 + threatTier * 10,
        maxHp: 75 + threatTier * 10,
        atk: 13 + threatTier * 2,
        def: 5,
        range: a.range,
        speed: 1,
        color: '#f87171',
        char: a.char,
        state: EnemyState.Chasing,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      });
    });
  }

  return {
    map,
    discovered,
    visible,
    enemies,
    props,
    wagonX,
    wagonY,
    playerX,
    playerY
  };
}
