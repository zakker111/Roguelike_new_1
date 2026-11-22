/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuestEngine,
  QuestGenerator,
  QuestRegistry,
  contractToLegacyQuest,
  legacyQuestToContract,
  QuestGenerationContext,
  RadiantQuestContract,
} from '../../engine/quests';
import { Quest } from '../../types';

describe('QuestEngine & Radiant Quest Subsystem', () => {
  let questEngine: QuestEngine;

  beforeEach(() => {
    QuestEngine.resetInstance();
    QuestRegistry.resetInstance();
    questEngine = QuestEngine.getInstance();
  });

  describe('Registry & Singleton Initialization', () => {
    it('initializes as a singleton and retrieves catalog quests', () => {
      const instance1 = QuestEngine.getInstance();
      const instance2 = QuestEngine.getInstance();
      expect(instance1).toBe(instance2);

      const registry = instance1.getRegistry();
      expect(registry).toBeDefined();

      const baseQuests = registry.getAllCatalogQuests();
      expect(baseQuests.length).toBeGreaterThan(0);
      expect(baseQuests.some(q => q.id === 'q_bandit_raid')).toBe(true);
    });

    it('retrieves specific quests by ID', () => {
      const registry = questEngine.getRegistry();
      const ironQuest = registry.getQuestById('q_iron_gather');
      expect(ironQuest).toBeDefined();
      expect(ironQuest?.title).toContain('Alloy');
    });
  });

  describe('Procedural Contract Generation (QuestGenerator)', () => {
    const baseContext: QuestGenerationContext = {
      playerLevel: 3,
      currentChunkX: 0,
      currentChunkY: 0,
      townName: 'Oakhaven Hamlet',
      townReputation: 100,
    };

    it('generates a valid bounty contract', () => {
      const contract = QuestGenerator.generateContract(baseContext, 'bounty');
      expect(contract.id).toContain('radiant_q_');
      expect(contract.category).toBe('bounty');
      expect(contract.isRadiant).toBe(true);
      expect(contract.objectives.length).toBeGreaterThan(0);
      expect(contract.objectives[0].type).toBe('defeat_boss');
      expect(contract.rewards.gold).toBeGreaterThan(0);
      expect(contract.rewards.xp).toBeGreaterThan(0);
      expect(contract.status).toBe('available');
    });

    it('generates a valid beast hunt contract', () => {
      const contract = QuestGenerator.generateContract(baseContext, 'beast_hunt');
      expect(contract.category).toBe('beast_hunt');
      expect(contract.objectives[0].type).toBe('kill_enemy');
      expect(contract.objectives[0].targetCount).toBeGreaterThanOrEqual(2);
    });

    it('generates a valid supply requisition contract', () => {
      const contract = QuestGenerator.generateContract(baseContext, 'supply_requisition');
      expect(contract.category).toBe('supply_requisition');
      expect(contract.objectives[0].type).toBe('gather_material');
      expect(contract.objectives[0].targetId).toMatch(/^mat_/);
    });

    it('generates a valid relic delve contract', () => {
      const contract = QuestGenerator.generateContract(baseContext, 'relic_delve');
      expect(contract.category).toBe('relic_delve');
      expect(contract.objectives[0].type).toBe('reach_depth');
      expect(contract.targetDepth).toBeGreaterThanOrEqual(1);
    });

    it('generates a valid faction skirmish contract', () => {
      const contract = QuestGenerator.generateContract(baseContext, 'faction_skirmish');
      expect(contract.category).toBe('faction_skirmish');
      expect(contract.objectives[0].type).toBe('kill_enemy');
      expect(contract.rewards.factionStanding).toBeDefined();
    });

    it('scales difficulty and rewards according to player level', () => {
      const lowLevelContext: QuestGenerationContext = {
        playerLevel: 1,
        currentChunkX: 0,
        currentChunkY: 0,
        townName: 'Oakhaven',
      };
      const highLevelContext: QuestGenerationContext = {
        playerLevel: 12,
        currentChunkX: 0,
        currentChunkY: 0,
        townName: 'Oakhaven',
      };

      const noviceContract = QuestGenerator.generateContract(lowLevelContext, 'bounty');
      const masterContract = QuestGenerator.generateContract(highLevelContext, 'bounty');

      expect(noviceContract.difficulty).toBe('novice');
      expect(masterContract.difficulty).toBe('master');
      expect(masterContract.rewards.gold).toBeGreaterThan(noviceContract.rewards.gold);
      expect(masterContract.rewards.xp).toBeGreaterThan(noviceContract.rewards.xp);
    });
  });

  describe('Town Board Replenishment', () => {
    it('replenishes available quests up to target count', () => {
      const context: QuestGenerationContext = {
        playerLevel: 2,
        currentChunkX: 0,
        currentChunkY: 0,
        townName: 'Oakhaven',
      };

      const initialQuests: Quest[] = [
        {
          id: 'q_active_1',
          townName: 'Oakhaven',
          type: 'gather',
          title: 'Active Task',
          description: 'Desc',
          rewardGold: 50,
          status: 'active',
        },
        {
          id: 'q_avail_1',
          townName: 'Oakhaven',
          type: 'encounter',
          title: 'Avail Task',
          description: 'Desc',
          rewardGold: 30,
          status: 'available',
        },
      ];

      const replenished = questEngine.replenishTownBoard(initialQuests, context, 4);
      const available = replenished.filter(q => q.status === 'available');

      expect(available.length).toBe(4);
      expect(replenished.length).toBe(5); // 1 active + 4 available
    });

    it('does not add quests if available count is already sufficient', () => {
      const context: QuestGenerationContext = {
        playerLevel: 2,
        currentChunkX: 0,
        currentChunkY: 0,
        townName: 'Oakhaven',
      };

      const fullQuests: Quest[] = Array.from({ length: 4 }).map((_, i) => ({
        id: `q_avail_${i}`,
        townName: 'Oakhaven',
        type: 'gather',
        title: `Task ${i}`,
        description: 'Desc',
        rewardGold: 40,
        status: 'available',
      }));

      const result = questEngine.replenishTownBoard(fullQuests, context, 4);
      expect(result.length).toBe(4);
    });
  });

  describe('Objective Progress Tracking (updateProgress)', () => {
    it('increments multi-kill kill_enemy objectives up to targetCount before completing', () => {
      const quests: Quest[] = [
        {
          id: 'contract_hunt_rat',
          townName: 'Oakhaven',
          type: 'encounter',
          title: 'Cull Outskirt Sewer Rats',
          description: 'Hunt down pest rats.',
          targetItem: 'Rat',
          targetCount: 3,
          currentProgress: 0,
          rewardGold: 35,
          status: 'active',
          isRadiant: true,
        },
        {
          id: 'contract_hunt_wolf',
          townName: 'Oakhaven',
          type: 'encounter',
          title: 'Hunt Wolves',
          description: 'Hunt dire wolves.',
          targetItem: 'Wolf',
          targetCount: 2,
          currentProgress: 0,
          rewardGold: 50,
          status: 'active',
          isRadiant: true,
        },
      ];

      // Kill 1 of 3
      const kill1 = questEngine.updateProgress(quests, {
        type: 'kill_enemy',
        targetId: 'Giant Plague Rat',
      });
      expect(kill1.completedQuests.length).toBe(0);
      expect(kill1.updatedQuests[0].status).toBe('active');
      expect(kill1.updatedQuests[0].currentProgress).toBe(1);
      expect(kill1.logMessages[0]).toContain('(1/3)');

      // Kill 2 of 3
      const kill2 = questEngine.updateProgress(kill1.updatedQuests, {
        type: 'kill_enemy',
        targetId: 'Rat',
      });
      expect(kill2.completedQuests.length).toBe(0);
      expect(kill2.updatedQuests[0].currentProgress).toBe(2);

      // Kill 3 of 3 completes the contract
      const kill3 = questEngine.updateProgress(kill2.updatedQuests, {
        type: 'kill_enemy',
        targetId: 'Rat',
      });
      expect(kill3.completedQuests.length).toBe(1);
      expect(kill3.completedQuests[0].id).toBe('contract_hunt_rat');
      expect(kill3.completedQuests[0].status).toBe('completed');
      expect(kill3.completedQuests[0].currentProgress).toBe(3);
      expect(kill3.updatedQuests.find(q => q.id === 'contract_hunt_wolf')?.status).toBe('active');
      expect(kill3.logMessages[0]).toContain('(3/3)');
    });

    it('matches and completes radiant bounty boss defeat events', () => {
      const contract = QuestGenerator.generateContract({
        playerLevel: 4,
        currentChunkX: 0,
        currentChunkY: 0,
        townName: 'Oakhaven Hamlet',
      }, 'bounty');
      const activeBounty: Quest = { ...contractToLegacyQuest(contract), status: 'active' };
      const bossName = activeBounty.targetItem || 'Warlord';

      const res = questEngine.updateProgress([activeBounty], {
        type: 'defeat_boss',
        targetId: `👑 ${bossName}`,
      });

      expect(res.completedQuests.length).toBe(1);
      expect(res.completedQuests[0].status).toBe('completed');
      expect(res.completedQuests[0].currentProgress).toBe(1);
    });

    it('completes reach_depth objectives when floor threshold is reached', () => {
      const quests: Quest[] = [
        {
          id: 'contract_delve_relic',
          townName: 'Oakhaven',
          type: 'encounter',
          title: 'Delve into Depths',
          description: 'Reach Depth 3 to recover ancient runes.',
          targetCount: 3,
          rewardGold: 90,
          status: 'active',
          isRadiant: true,
        },
      ];

      // Depth 2 is below target
      const attempt1 = questEngine.updateProgress(quests, {
        type: 'reach_depth',
        targetId: 'depth',
        depth: 2,
      });
      expect(attempt1.completedQuests.length).toBe(0);

      // Depth 3 satisfies target
      const attempt2 = questEngine.updateProgress(quests, {
        type: 'reach_depth',
        targetId: 'depth',
        depth: 3,
      });
      expect(attempt2.completedQuests.length).toBe(1);
      expect(attempt2.completedQuests[0].status).toBe('completed');
    });
  });

  describe('Turn-In Validation & Reward Claiming', () => {
    it('validates gather requirements against player material inventory', () => {
      const gatherQuest: Quest = {
        id: 'q_iron_gather',
        townName: 'Oakhaven',
        type: 'gather',
        title: 'Iron Alloys',
        description: 'Deliver iron',
        targetItem: 'mat_iron',
        targetCount: 5,
        rewardGold: 50,
        status: 'active',
      };

      const fail = questEngine.canTurnIn(gatherQuest, { mat_iron: 3 }, 100);
      expect(fail.canTurnIn).toBe(false);
      expect(fail.reason).toContain('Insufficient materials');

      const pass = questEngine.canTurnIn(gatherQuest, { mat_iron: 5 }, 100);
      expect(pass.canTurnIn).toBe(true);
    });

    it('validates gold donation for outlaw pardon', () => {
      const pardonQuest: Quest = {
        id: 'q_outlaw_pardon',
        townName: 'Oakhaven',
        type: 'gather',
        title: 'Outlaw Pardon',
        description: 'Donate 200 gold',
        targetCount: 200,
        rewardGold: 0,
        status: 'active',
      };

      const fail = questEngine.canTurnIn(pardonQuest, {}, 150);
      expect(fail.canTurnIn).toBe(false);

      const pass = questEngine.canTurnIn(pardonQuest, {}, 250);
      expect(pass.canTurnIn).toBe(true);
    });

    it('correctly calculates reward distribution on claim', () => {
      const quest: Quest = {
        id: 'contract_bounty_warlord',
        townName: 'Oakhaven',
        type: 'encounter',
        title: 'Bounty: Torag',
        description: 'Slay the warlord',
        rewardGold: 120,
        rewardXp: 240,
        status: 'completed',
        isRadiant: true,
      };

      const rewards = questEngine.claimRewards(quest);
      expect(rewards.goldGained).toBe(120);
      expect(rewards.xpGained).toBe(240);
      expect(rewards.repGained).toBe(25);
      expect(rewards.completionLog).toContain('CONTRACT COMPLETE');
    });
  });

  describe('Compatibility Adapters', () => {
    it('converts RadiantQuestContract to legacy Quest format and back', () => {
      const contract: RadiantQuestContract = {
        id: 'contract_test_1',
        title: 'Test Beast Hunt',
        description: 'Test hunting',
        category: 'beast_hunt',
        difficulty: 'adept',
        giverName: 'Master Hunter',
        giverRole: 'Hunter',
        townName: 'Oakhaven',
        status: 'available',
        objectives: [
          {
            id: 'obj_1',
            description: 'Kill 4 Wolves',
            type: 'kill_enemy',
            targetId: 'Wolf',
            targetCount: 4,
            currentCount: 0,
            completed: false,
          },
        ],
        rewards: {
          gold: 65,
          xp: 130,
          reputation: 20,
        },
        isRadiant: true,
        icon: '🐺',
      };

      const legacy = contractToLegacyQuest(contract);
      expect(legacy.id).toBe('contract_test_1');
      expect(legacy.type).toBe('encounter');
      expect(legacy.targetItem).toBe('Wolf');
      expect(legacy.targetCount).toBe(4);
      expect(legacy.rewardGold).toBe(65);
      expect(legacy.category).toBe('beast_hunt');
      expect(legacy.difficulty).toBe('adept');
      expect(legacy.isRadiant).toBe(true);

      const restored = legacyQuestToContract(legacy);
      expect(restored.id).toBe('contract_test_1');
      expect(restored.category).toBe('beast_hunt');
      expect(restored.rewards.gold).toBe(65);
    });
  });
});
