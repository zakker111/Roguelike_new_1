/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RadiantQuestContract,
  QuestGenerationContext,
  QuestProgressEvent,
  contractToLegacyQuest,
  legacyQuestToContract
} from './types';
import { QuestGenerator } from './QuestGenerator';
import { QuestRegistry } from './QuestRegistry';
import { Quest } from '../../types';

/**
 * Master Quest & Radiant Contract Subsystem.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 * Manages procedural contract generation, objective tracking, board replenishment, and reward distribution.
 */
export class QuestEngine {
  private static instance: QuestEngine | null = null;
  private registry: QuestRegistry;

  private constructor() {
    this.registry = QuestRegistry.getInstance();
  }

  public static getInstance(): QuestEngine {
    if (!QuestEngine.instance) {
      QuestEngine.instance = new QuestEngine();
    }
    return QuestEngine.instance;
  }

  public static resetInstance(): void {
    QuestEngine.instance = null;
  }

  public getRegistry(): QuestRegistry {
    return this.registry;
  }

  /**
   * Generates a single radiant contract
   */
  public generateContract(context: QuestGenerationContext): RadiantQuestContract {
    return QuestGenerator.generateContract(context);
  }

  /**
   * Replenishes a town quest board with radiant contracts so players always have available jobs
   */
  public replenishTownBoard(
    currentQuests: Quest[],
    context: QuestGenerationContext,
    targetAvailableCount: number = 4
  ): Quest[] {
    const available = currentQuests.filter(q => q.status === 'available');
    const needed = targetAvailableCount - available.length;

    if (needed <= 0) {
      return currentQuests;
    }

    const nextQuests = [...currentQuests];
    for (let i = 0; i < needed; i++) {
      const contract = QuestGenerator.generateContract(context);
      const legacy = contractToLegacyQuest(contract);
      nextQuests.push(legacy);
    }

    return nextQuests;
  }

  /**
   * Evaluates a game event (e.g. enemy kill, material gather, depth reached) against active quests
   */
  public updateProgress(
    quests: Quest[],
    event: QuestProgressEvent
  ): {
    updatedQuests: Quest[];
    completedQuests: Quest[];
    logMessages: string[];
  } {
    let hasChanges = false;
    const completedQuests: Quest[] = [];
    const logMessages: string[] = [];

    const updatedQuests = quests.map(q => {
      if (q.status !== 'active') return q;

      // Handle enemy kill objectives
      if (event.type === 'kill_enemy' || event.type === 'defeat_boss') {
        const targetIdLower = (event.targetId || '').toLowerCase();
        const isLegacyMultiTarget = q.id === 'q_pest_control' || q.id === 'q_bandit_raid';
        const isPestMatch = q.id === 'q_pest_control' && targetIdLower.includes('rat');
        const isBanditMatch = q.id === 'q_bandit_raid' && (targetIdLower.includes('bandit') || targetIdLower.includes('brute'));
        const isBountyMatch =
          q.category === 'bounty' &&
          event.type === 'defeat_boss' &&
          ((q.targetItem && (
            targetIdLower.includes(q.targetItem.toLowerCase()) ||
            q.targetItem.toLowerCase().includes(targetIdLower) ||
            q.targetItem === 'boss_warlord'
          )) || q.title.toLowerCase().includes(targetIdLower));

        const isTarget =
          q.type === 'encounter' &&
          targetIdLower.length > 0 &&
          (isPestMatch ||
            isBanditMatch ||
            isBountyMatch ||
            q.id.toLowerCase().includes(targetIdLower) ||
            q.title.toLowerCase().includes(targetIdLower) ||
            q.description.toLowerCase().includes(targetIdLower) ||
            (q.targetItem && (
              q.targetItem.toLowerCase() === targetIdLower ||
              targetIdLower.includes(q.targetItem.toLowerCase()) ||
              q.targetItem.toLowerCase().includes(targetIdLower)
            )));

        if (isTarget) {
          hasChanges = true;
          const needed = q.targetCount || (isLegacyMultiTarget ? 3 : 1);
          const nextProgress = Math.min(needed, (q.currentProgress || 0) + (event.amount || 1));

          if (nextProgress >= needed) {
            const completedQuest: Quest = {
              ...q,
              currentProgress: nextProgress,
              status: 'completed',
            };
            completedQuests.push(completedQuest);
            logMessages.push(`🎯 QUEST OBJECTIVE MET: Completed goals for "${q.title}" (${nextProgress}/${needed})! Return to the Town Board to claim your reward.`);
            return completedQuest;
          } else {
            logMessages.push(`🎯 QUEST PROGRESS: "${q.title}" (${nextProgress}/${needed})`);
            return {
              ...q,
              currentProgress: nextProgress,
            };
          }
        }
      }

      // Handle dungeon depth reach objectives
      if (event.type === 'reach_depth' && event.depth !== undefined) {
        if (
          q.category === 'relic_delve' ||
          q.id.includes('delve') ||
          q.description.toLowerCase().includes('depth') ||
          q.description.toLowerCase().includes('floor')
        ) {
          const targetDepth = q.targetCount || 2;
          if (event.depth >= targetDepth) {
            hasChanges = true;
            const completedQuest: Quest = {
              ...q,
              currentProgress: event.depth,
              status: 'completed',
            };
            completedQuests.push(completedQuest);
            logMessages.push(`🏺 DUNGEON DELVE OBJECTIVE MET: Breached target Depth ${event.depth} for "${q.title}"! Return to town to claim your bounty.`);
            return completedQuest;
          }
        }
      }

      return q;
    });

    return {
      updatedQuests: hasChanges ? updatedQuests : quests,
      completedQuests,
      logMessages,
    };
  }

  /**
   * Validates whether a quest can be turned in
   */
  public canTurnIn(
    quest: Quest,
    materials: Record<string, number>,
    playerGold: number,
    activeEnemies: { name: string }[] = []
  ): { canTurnIn: boolean; reason?: string } {
    if (quest.status === 'turned_in') {
      return { canTurnIn: false, reason: 'Already turned in.' };
    }

    if (quest.id === 'q_outlaw_pardon') {
      const cost = quest.targetCount || 200;
      if (playerGold < cost) {
        return {
          canTurnIn: false,
          reason: `Insufficient Gold! Need ${cost} Gold for church poorbox donation.`,
        };
      }
      return { canTurnIn: true };
    }

    if (quest.type === 'gather') {
      const itemKey = quest.targetItem || (quest.id === 'q_apothecary_supply' ? 'mat_berry' : quest.id === 'q_mithril_heist' ? 'mat_mithril' : 'mat_iron');
      const userCount = materials[itemKey] || 0;
      const needed = quest.targetCount || (quest.id === 'q_apothecary_supply' ? 10 : quest.id === 'q_mithril_heist' ? 3 : 5);
      if (userCount < needed) {
        return {
          canTurnIn: false,
          reason: `Insufficient materials! Need ${needed}x items, carry ${userCount}.`,
        };
      }
      return { canTurnIn: true };
    }

    if (quest.type === 'encounter') {
      if (quest.status === 'completed') {
        return { canTurnIn: true };
      }

      // Check legacy encounter targets
      if (quest.id === 'q_pest_control') {
        const pests = activeEnemies.filter(e => e.name.includes('Quest Sewer Rat'));
        if (pests.length > 0) {
          return {
            canTurnIn: false,
            reason: 'Quest Sewer Rats are still active! You must defeat all 3 rats in the town map.',
          };
        }
        return { canTurnIn: true };
      }

      if (quest.id === 'q_bandit_raid') {
        const bandits = activeEnemies.filter(e => e.name.includes('Bandit Raider'));
        if (bandits.length > 0) {
          return {
            canTurnIn: false,
            reason: 'Bandit Raiders are still active! You must defeat all 3 raiders in the town map.',
          };
        }
        return { canTurnIn: true };
      }

      // Radiant contracts require completed status
      if (quest.isRadiant) {
        return {
          canTurnIn: false,
          reason: 'Contract objectives not yet fulfilled! Complete targets first.',
        };
      }

      return { canTurnIn: true };
    }

    return { canTurnIn: false, reason: 'Quest objectives not yet completed.' };
  }

  /**
   * Resolves quest turn-in and calculates reward distributions
   */
  public claimRewards(
    quest: Quest
  ): {
    goldGained: number;
    xpGained: number;
    repGained: number;
    deductedItemKey?: string;
    deductedItemCount?: number;
    completionLog: string;
  } {
    const goldGained = quest.rewardGold || 40;
    const xpGained = quest.rewardXp || goldGained * 2;
    let repGained = goldGained >= 100 ? 25 : goldGained >= 50 ? 20 : 15;

    let deductedItemKey: string | undefined;
    let deductedItemCount: number | undefined;
    let completionLog = `🎉 CONTRACT COMPLETE: You turned in "${quest.title}"! Received +${goldGained} Gold, +${xpGained} XP, and +${repGained} Renown!`;

    if (quest.id === 'q_outlaw_pardon') {
      repGained = 35;
      deductedItemKey = 'gold';
      deductedItemCount = quest.targetCount || 200;
      completionLog = `⚖️ PARDON GRANTED: You donated ${deductedItemCount} Gold to the Church. Your crimes are pardoned! (+35 Town Reputation)`;
    } else if (quest.id === 'q_iron_gather') {
      repGained = 15;
      deductedItemKey = 'mat_iron';
      deductedItemCount = quest.targetCount || 5;
      completionLog = `🎉 QUEST COMPLETED: Delivered materials! You received +${goldGained} Gold and +15 Town Reputation!`;
    } else if (quest.id === 'q_apothecary_supply') {
      repGained = 12;
      deductedItemKey = 'mat_berry';
      deductedItemCount = quest.targetCount || 10;
      completionLog = `🎉 QUEST COMPLETED: Delivered materials! You received +${goldGained} Gold and +12 Town Reputation!`;
    } else if (quest.id === 'q_mithril_heist') {
      repGained = 25;
      deductedItemKey = 'mat_mithril';
      deductedItemCount = quest.targetCount || 3;
      completionLog = `🎉 QUEST COMPLETED: Delivered materials! You received +${goldGained} Gold and +25 Town Reputation!`;
    } else if (quest.id === 'q_pest_control') {
      repGained = 10;
      completionLog = `🎉 QUEST COMPLETED: Outskirts cleaned of pests! Grom rewards you with +${goldGained} Gold and +10 Town Reputation!`;
    } else if (quest.id === 'q_bandit_raid') {
      repGained = 25;
      completionLog = `🎉 QUEST COMPLETED: Town secured! Grom rewards you with +${goldGained} Gold and +25 Town Reputation!`;
    } else if (quest.type === 'gather' && quest.targetItem) {
      deductedItemKey = quest.targetItem;
      deductedItemCount = quest.targetCount || 3;
    }

    return {
      goldGained,
      xpGained,
      repGained,
      deductedItemKey,
      deductedItemCount,
      completionLog,
    };
  }
}
