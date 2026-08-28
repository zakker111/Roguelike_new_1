import React from 'react';
import { GameState, EquipmentItem, Follower } from '../../types';
import { 
  GuildUpgrade, 
  GuildDecor, 
  CompanionQuest, 
  FactionGear 
} from '../../utils/tradeEconomy';

export type GuildSubTab = 'hq' | 'sanctuary' | 'stash' | 'factions' | 'dispatch';

export interface GuildOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type: 'system' | 'combat' | 'loot' | 'danger' | 'craft') => void;
  playSound: (soundName: string) => void;
}

export interface GuildHQPanelProps {
  gameState: GameState;
  isTownCenter: boolean;
  chunkKey: string;
  guildOwned: boolean;
  handlePurchaseHQ: () => void;
  handleBuyUpgrade: (upgrade: GuildUpgrade) => void;
}

export interface GuildSanctuaryPanelProps {
  gameState: GameState;
  guildOwned: boolean;
  handleBuyDecor: (decor: GuildDecor) => void;
}

export interface GuildFactionWarPanelProps {
  gameState: GameState;
  guildOwned: boolean;
  handleForgeFactionGear: (gear: FactionGear) => void;
  handleClaimTaxes: (territoryId: string) => void;
  handleContributeGold: (amount: number) => void;
  handleBuyTactic: (tacticName: string, costGold: number, territoryId: string) => void;
}

export interface GuildMissionBoardProps {
  gameState: GameState;
  selectedFollowerId: string;
  setSelectedFollowerId: (id: string) => void;
  selectedQuestId: string;
  setSelectedQuestId: (id: string) => void;
  handleDispatchFollower: () => void;
  handleClaimDispatchRewards: (followerId: string) => void;
}

export interface SafehouseStashState {
  equipment: EquipmentItem[];
  materials: { [id: string]: number };
  catalysts: { [id: string]: number };
  potions?: { [id: string]: number };
}

export interface GuildStashPanelProps {
  hasStorageAccess: boolean;
  isTown: boolean;
  chunkKey: string;
  isTownCenter: boolean;
  guildOwned: boolean;
  isUsingGuildHQStash: boolean;
  gameState: GameState;
  handlePurchaseSafehouse: () => void;
  handleSafehouseRest: () => void;
  handleStashAll: () => void;
  handleStashMaterial: (matId: string, deposit: boolean) => void;
  handleStashCatalyst: (catId: string, deposit: boolean) => void;
  handleStashEquipment: (item: EquipmentItem, deposit: boolean) => void;
  currentSafehouseStash: SafehouseStashState;
  setActiveSubTab: (tab: GuildSubTab) => void;
}
