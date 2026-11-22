/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RadiantQuestContract,
  QuestGenerationContext,
  QuestCategory,
  QuestDifficulty
} from './types';

interface EnemyTargetPool {
  id: string;
  name: string;
  minLevel: number;
}

const BOUNTY_NAMES = [
  'Grimjaw the Outlaw Reaver',
  'Bloodfang the Alpha Worg',
  'Vaelen the Shadow Necromancer',
  'Torag the Sunder Warlord',
  'Skarr the Red Mountain Chieftain',
  'Mire-Queen Vespera',
  'Kraghar the Iron-Clad Brute',
  'Zephyr the Wind-Strider Bandit',
];

const BEAST_TARGETS: EnemyTargetPool[] = [
  { id: 'Rat', name: 'Outskirt Sewer Rats', minLevel: 1 },
  { id: 'Wolf', name: 'Dire Wilderness Wolves', minLevel: 2 },
  { id: 'Spider', name: 'Cave Weaver Spiders', minLevel: 3 },
  { id: 'Hiisi', name: 'Hiisi Skirmishers', minLevel: 4 },
  { id: 'Nakki', name: 'Mire Swamp Walkers', minLevel: 5 },
  { id: 'Brute', name: 'Outlaw Enforcers', minLevel: 6 },
  { id: 'OrcBrute', name: 'Orc Vanguard Brutes', minLevel: 7 },
  { id: 'SkeletonMage', name: 'Crypt Lich Acolytes', minLevel: 8 },
  { id: 'LavaElemental', name: 'Magma Caldera Fiends', minLevel: 9 },
];

const MATERIAL_REQUISITIONS = [
  { id: 'mat_iron', name: 'Tempered Iron Bars', baseCount: 4, minLevel: 1 },
  { id: 'mat_copper', name: 'Raw Copper Ore', baseCount: 5, minLevel: 1 },
  { id: 'mat_wood', name: 'Seasoned Pine Timber', baseCount: 6, minLevel: 1 },
  { id: 'mat_berry', name: 'Sweet Wild Berries', baseCount: 5, minLevel: 1 },
  { id: 'mat_frostbloom', name: 'Glacial Frostbloom', baseCount: 3, minLevel: 3 },
  { id: 'mat_sun_aloe', name: 'Sun-Blossom Aloe', baseCount: 3, minLevel: 3 },
  { id: 'mat_swamp_nightshade', name: 'Bioluminescent Nightshade', baseCount: 3, minLevel: 4 },
  { id: 'mat_silver', name: 'Refined Silver Alloys', baseCount: 3, minLevel: 5 },
  { id: 'mat_mithril', name: 'Glimmering Royal Mithril', baseCount: 2, minLevel: 7 },
];

export class QuestGenerator {
  private static idCounter = 1;

  /**
   * Generates a procedurally scaled radiant quest contract
   */
  public static generateContract(
    context: QuestGenerationContext,
    forcedCategory?: QuestCategory
  ): RadiantQuestContract {
    const level = Math.max(1, context.playerLevel);
    const difficulty = this.getDifficultyForLevel(level);

    // Pick category
    const categories: QuestCategory[] = [
      'bounty',
      'beast_hunt',
      'supply_requisition',
      'relic_delve',
      'faction_skirmish',
    ];
    const category = forcedCategory || categories[Math.floor(Math.random() * categories.length)];

    const id = `radiant_q_${Date.now()}_${this.idCounter++}`;
    const townName = context.townName || 'Oakhaven Hamlet';

    switch (category) {
      case 'bounty':
        return this.generateBountyContract(id, townName, level, difficulty, context);
      case 'beast_hunt':
        return this.generateBeastHuntContract(id, townName, level, difficulty, context);
      case 'supply_requisition':
        return this.generateSupplyContract(id, townName, level, difficulty, context);
      case 'relic_delve':
        return this.generateRelicDelveContract(id, townName, level, difficulty, context);
      case 'faction_skirmish':
      default:
        return this.generateFactionSkirmishContract(id, townName, level, difficulty, context);
    }
  }

  private static getDifficultyForLevel(level: number): QuestDifficulty {
    if (level <= 3) return 'novice';
    if (level <= 6) return 'adept';
    if (level <= 9) return 'veteran';
    if (level <= 13) return 'master';
    return 'legendary';
  }

  private static getDifficultyMultiplier(difficulty: QuestDifficulty): number {
    switch (difficulty) {
      case 'novice':
        return 1.0;
      case 'adept':
        return 1.6;
      case 'veteran':
        return 2.4;
      case 'master':
        return 3.5;
      case 'legendary':
        return 5.0;
    }
  }

  private static generateBountyContract(
    id: string,
    townName: string,
    level: number,
    difficulty: QuestDifficulty,
    ctx: QuestGenerationContext
  ): RadiantQuestContract {
    const bossName = BOUNTY_NAMES[Math.floor(Math.random() * BOUNTY_NAMES.length)];
    const mult = this.getDifficultyMultiplier(difficulty);
    const goldReward = Math.round((50 + level * 15) * mult);
    const xpReward = Math.round((60 + level * 20) * mult);

    const targetOffset = (id.length % 5) + 1;
    const targetChunkX = ctx.currentChunkX + (Math.random() > 0.5 ? targetOffset : -targetOffset);
    const targetChunkY = ctx.currentChunkY + (Math.random() > 0.5 ? targetOffset : -targetOffset);

    return {
      id,
      title: `🗡️ Wanted Bounty: ${bossName}`,
      description: `A notorious warlord, ${bossName}, has fortified a raider camp in chunk [${targetChunkX}, ${targetChunkY}]. Terminate this warlord and liberate the frontier roads!`,
      category: 'bounty',
      difficulty,
      giverName: `${townName} Marshal`,
      giverRole: 'Town Marshal',
      townName,
      status: 'available',
      objectives: [
        {
          id: `${id}_obj_1`,
          description: `Defeat ${bossName} at Chunk [${targetChunkX}, ${targetChunkY}]`,
          type: 'defeat_boss',
          targetId: bossName,
          targetCount: 1,
          currentCount: 0,
          completed: false,
        },
      ],
      rewards: {
        gold: goldReward,
        xp: xpReward,
        reputation: 25,
      },
      targetChunkX,
      targetChunkY,
      isRadiant: true,
      icon: '🗡️',
    };
  }

  private static generateBeastHuntContract(
    id: string,
    townName: string,
    level: number,
    difficulty: QuestDifficulty,
    ctx: QuestGenerationContext
  ): RadiantQuestContract {
    const eligible = BEAST_TARGETS.filter(b => b.minLevel <= level + 2);
    const target = eligible[Math.floor(Math.random() * eligible.length)] || BEAST_TARGETS[0];
    const killCount = Math.min(10, 3 + Math.floor(level / 3));

    const mult = this.getDifficultyMultiplier(difficulty);
    const goldReward = Math.round((35 + level * 10) * mult);
    const xpReward = Math.round((45 + level * 14) * mult);

    return {
      id,
      title: `🐺 Perimeter Culling: ${target.name}`,
      description: `A dangerous surge of feral ${target.name} has been spotted prowling near the settlement borders. Slay ${killCount}x ${target.name} to preserve village livestock.`,
      category: 'beast_hunt',
      difficulty,
      giverName: `${townName} Gamekeeper`,
      giverRole: 'Gamekeeper',
      townName,
      status: 'available',
      objectives: [
        {
          id: `${id}_obj_1`,
          description: `Slay ${killCount}x ${target.name}`,
          type: 'kill_enemy',
          targetId: target.id,
          targetCount: killCount,
          currentCount: 0,
          completed: false,
        },
      ],
      rewards: {
        gold: goldReward,
        xp: xpReward,
        reputation: 15,
      },
      targetChunkX: ctx.currentChunkX,
      targetChunkY: ctx.currentChunkY,
      isRadiant: true,
      icon: '🐺',
    };
  }

  private static generateSupplyContract(
    id: string,
    townName: string,
    level: number,
    difficulty: QuestDifficulty,
    ctx: QuestGenerationContext
  ): RadiantQuestContract {
    const eligible = MATERIAL_REQUISITIONS.filter(m => m.minLevel <= level + 1);
    const mat = eligible[Math.floor(Math.random() * eligible.length)] || MATERIAL_REQUISITIONS[0];
    const count = mat.baseCount + Math.floor(Math.random() * 2);

    const mult = this.getDifficultyMultiplier(difficulty);
    const goldReward = Math.round((40 + level * 12) * mult);
    const xpReward = Math.round((30 + level * 8) * mult);

    return {
      id,
      title: `🪓 Supply Requisition: ${mat.name}`,
      description: `The fortress workshops require an urgent stockpile of ${count}x ${mat.name}. Gather and deliver them to the town stores.`,
      category: 'supply_requisition',
      difficulty,
      giverName: `${townName} Quartermaster`,
      giverRole: 'Quartermaster',
      townName,
      status: 'available',
      objectives: [
        {
          id: `${id}_obj_1`,
          description: `Deliver ${count}x ${mat.name}`,
          type: 'gather_material',
          targetId: mat.id,
          targetCount: count,
          currentCount: 0,
          completed: false,
        },
      ],
      rewards: {
        gold: goldReward,
        xp: xpReward,
        reputation: 20,
      },
      isRadiant: true,
      icon: '🪓',
    };
  }

  private static generateRelicDelveContract(
    id: string,
    townName: string,
    level: number,
    difficulty: QuestDifficulty,
    ctx: QuestGenerationContext
  ): RadiantQuestContract {
    const targetDepth = Math.min(10, Math.max(2, Math.floor(level / 2) + 2));
    const mult = this.getDifficultyMultiplier(difficulty);
    const goldReward = Math.round((60 + targetDepth * 20) * mult);
    const xpReward = Math.round((80 + targetDepth * 25) * mult);

    return {
      id,
      title: `🏺 Subterranean Delve: Floor ${targetDepth}`,
      description: `Scholars seek reconnaissance of the ancient chambers on Dungeon Floor ${targetDepth}. Descend into the subterranean abyss and secure Floor ${targetDepth}.`,
      category: 'relic_delve',
      difficulty,
      giverName: `${townName} Lore-Keeper`,
      giverRole: 'Scholar',
      townName,
      status: 'available',
      objectives: [
        {
          id: `${id}_obj_1`,
          description: `Reach Subterranean Floor Depth ${targetDepth}`,
          type: 'reach_depth',
          targetId: String(targetDepth),
          targetCount: targetDepth,
          currentCount: 0,
          completed: false,
        },
      ],
      rewards: {
        gold: goldReward,
        xp: xpReward,
        reputation: 25,
      },
      targetDepth,
      isRadiant: true,
      icon: '🏺',
    };
  }

  private static generateFactionSkirmishContract(
    id: string,
    townName: string,
    level: number,
    difficulty: QuestDifficulty,
    ctx: QuestGenerationContext
  ): RadiantQuestContract {
    const killCount = Math.min(8, 3 + Math.floor(level / 4));
    const mult = this.getDifficultyMultiplier(difficulty);
    const goldReward = Math.round((45 + level * 14) * mult);
    const xpReward = Math.round((55 + level * 16) * mult);

    return {
      id,
      title: `⚔️ Border Defense: Repel Outlaw Vanguard`,
      description: `Rogue raiders and highway outlaws are ambushing road traffic. Patrol the perimeter and defeat ${killCount} hostile outlaws.`,
      category: 'faction_skirmish',
      difficulty,
      giverName: `${townName} Guard Captain`,
      giverRole: 'Captain',
      townName,
      status: 'available',
      objectives: [
        {
          id: `${id}_obj_1`,
          description: `Eliminate ${killCount}x Hostile Outlaws`,
          type: 'kill_enemy',
          targetId: 'Brute',
          targetCount: killCount,
          currentCount: 0,
          completed: false,
        },
      ],
      rewards: {
        gold: goldReward,
        xp: xpReward,
        reputation: 20,
        factionStanding: {
          faction: ctx.faction || 'vanguard',
          points: 15,
        },
      },
      isRadiant: true,
      icon: '⚔️',
    };
  }
}
