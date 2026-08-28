/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import guildJson from './guildData.json';
import safehousePresetJson from './safehouse.json';

export interface GuildUpgradeEntry {
  id: string;
  name: string;
  desc: string;
  costGold: number;
  costMaterials: { [matId: string]: number };
  maxLevel: number;
}

export interface GuildDecorEntry {
  id: string;
  name: string;
  desc: string;
  costGold: number;
  icon: string;
  bonusText: string;
}

export interface CompanionQuestEntry {
  id: string;
  title: string;
  desc: string;
  turnsRequired: number;
  rewardGold: number;
  rewardXp: number;
  rewardMaterials: { [matId: string]: number };
}

export interface FactionGearEntry {
  id: string;
  name: string;
  type: string;
  subType: string;
  damage?: number;
  defense?: number;
  critChance?: number;
  range?: number;
  costGold: number;
  costMaterials: { [matId: string]: number };
  desc: string;
  color: string;
}

export const GUILD_UPGRADES: GuildUpgradeEntry[] = guildJson.guildUpgrades as unknown as GuildUpgradeEntry[];
export const GUILD_DECORS: GuildDecorEntry[] = guildJson.guildDecors as unknown as GuildDecorEntry[];
export const COMPANION_QUESTS: CompanionQuestEntry[] = guildJson.companionQuests as unknown as CompanionQuestEntry[];
export const SYNDICATE_GEAR: FactionGearEntry[] = guildJson.syndicateGear as unknown as FactionGearEntry[];
export const VANGUARD_GEAR: FactionGearEntry[] = guildJson.vanguardGear as unknown as FactionGearEntry[];
export const BANDIT_GEAR: FactionGearEntry[] = guildJson.banditGear as unknown as FactionGearEntry[];
export const SAFEHOUSE_PRESET = safehousePresetJson;

export function getGuildUpgradeById(id: string): GuildUpgradeEntry | undefined {
  return GUILD_UPGRADES.find(u => u.id === id);
}

export function getCompanionQuestById(id: string): CompanionQuestEntry | undefined {
  return COMPANION_QUESTS.find(q => q.id === id);
}
