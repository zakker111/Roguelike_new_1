/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadiantQuestContract, legacyQuestToContract } from './types';
import questsData from '../../data/quests.json';
import { Quest } from '../../types';

export class QuestRegistry {
  private static instance: QuestRegistry | null = null;
  private contracts: Map<string, RadiantQuestContract> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): QuestRegistry {
    if (!QuestRegistry.instance) {
      QuestRegistry.instance = new QuestRegistry();
    }
    return QuestRegistry.instance;
  }

  public static resetInstance(): void {
    QuestRegistry.instance = null;
  }

  /**
   * Bootstraps base authored quests from data catalog
   */
  public initFromCatalog(): void {
    if (this.initialized) return;
    const baseQuests = (questsData || []) as Quest[];
    for (const q of baseQuests) {
      const contract = legacyQuestToContract(q);
      this.registerContract(contract);
    }
    this.initialized = true;
  }

  /**
   * Registers a quest contract blueprint
   */
  public registerContract(contract: RadiantQuestContract): void {
    this.contracts.set(contract.id, { ...contract });
  }

  /**
   * Retrieves a quest contract by ID
   */
  public getContract(id: string): RadiantQuestContract | undefined {
    if (!this.initialized) {
      this.initFromCatalog();
    }
    const found = this.contracts.get(id);
    return found ? { ...found } : undefined;
  }

  public getQuestById(id: string): RadiantQuestContract | undefined {
    return this.getContract(id);
  }

  /**
   * Retrieves all registered quest contracts
   */
  public getAllContracts(): RadiantQuestContract[] {
    if (!this.initialized) {
      this.initFromCatalog();
    }
    return Array.from(this.contracts.values()).map(c => ({ ...c }));
  }

  public getAllCatalogQuests(): RadiantQuestContract[] {
    return this.getAllContracts();
  }

  /**
   * Retrieves contracts for a specific town
   */
  public getContractsByTown(townName: string): RadiantQuestContract[] {
    return this.getAllContracts().filter(
      c => c.townName.toLowerCase() === townName.toLowerCase()
    );
  }

  /**
   * Clears registry state
   */
  public clear(): void {
    this.contracts.clear();
    this.initialized = false;
  }
}
