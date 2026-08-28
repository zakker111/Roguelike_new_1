import React from 'react';
import { GameState, EquipmentItem } from '../../types';
import { GuildUpgrade, GuildDecor, FactionGear } from '../../utils/tradeEconomy';
import { GuildHQPanel } from './GuildHQPanel';
import { GuildSanctuaryPanel } from './GuildSanctuaryPanel';
import { GuildFactionWarPanel } from './GuildFactionWarPanel';

export interface GuildTreasuryPanelProps {
  gameState: GameState;
  isTownCenter: boolean;
  chunkKey: string;
  guildOwned: boolean;
  activeSubTab: 'hq' | 'sanctuary' | 'factions';
  handlePurchaseHQ: () => void;
  handleBuyUpgrade: (upgrade: GuildUpgrade) => void;
  handleBuyDecor: (decor: GuildDecor) => void;
  handleForgeFactionGear: (gear: FactionGear) => void;
  handleClaimTaxes: (territoryId: string) => void;
  handleContributeGold: (amount: number) => void;
  handleBuyTactic: (tacticName: string, costGold: number, territoryId: string) => void;
}

export const GuildTreasuryPanel: React.FC<GuildTreasuryPanelProps> = ({
  gameState,
  isTownCenter,
  chunkKey,
  guildOwned,
  activeSubTab,
  handlePurchaseHQ,
  handleBuyUpgrade,
  handleBuyDecor,
  handleForgeFactionGear,
  handleClaimTaxes,
  handleContributeGold,
  handleBuyTactic,
}) => {
  return (
    <>
      {activeSubTab === 'hq' && (
        <GuildHQPanel
          gameState={gameState}
          isTownCenter={isTownCenter}
          chunkKey={chunkKey}
          guildOwned={guildOwned}
          handlePurchaseHQ={handlePurchaseHQ}
          handleBuyUpgrade={handleBuyUpgrade}
        />
      )}

      {activeSubTab === 'sanctuary' && guildOwned && (
        <GuildSanctuaryPanel
          gameState={gameState}
          guildOwned={guildOwned}
          handleBuyDecor={handleBuyDecor}
        />
      )}

      {activeSubTab === 'factions' && guildOwned && (
        <GuildFactionWarPanel
          gameState={gameState}
          guildOwned={guildOwned}
          handleForgeFactionGear={handleForgeFactionGear}
          handleClaimTaxes={handleClaimTaxes}
          handleContributeGold={handleContributeGold}
          handleBuyTactic={handleBuyTactic}
        />
      )}
    </>
  );
};
