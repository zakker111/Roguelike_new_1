import React from 'react';
import { GuildOverlayProps } from './guild/types';
import { 
  useGuildOperations,
  GuildHeaderBar,
  GuildHQPanel,
  GuildSanctuaryPanel,
  GuildFactionWarPanel,
  GuildMissionBoard,
  GuildStashPanel
} from './guild';

export default function GuildOverlay({ gameState, setGameState, addLogMessage, playSound }: GuildOverlayProps) {
  const {
    activeSubTab,
    setActiveSubTab,
    selectedFollowerId,
    setSelectedFollowerId,
    selectedQuestId,
    setSelectedQuestId,
    chunkKey,
    isTownCenter,
    isTown,
    guildOwned,
    hasStorageAccess,
    isUsingGuildHQStash,
    currentSafehouseStash,
    handlePurchaseHQ,
    handlePurchaseSafehouse,
    handleSafehouseRest,
    handleBuyUpgrade,
    handleBuyDecor,
    handleStashMaterial,
    handleStashCatalyst,
    handleStashEquipment,
    handleStashAll,
    handleForgeFactionGear,
    handleClaimTaxes,
    handleContributeGold,
    handleBuyTactic,
    handleDispatchFollower,
    handleClaimDispatchRewards,
  } = useGuildOperations(gameState, setGameState, addLogMessage, playSound);

  return (
    <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow min-h-[420px]">
      {/* Header with Sub-tab Switcher */}
      <GuildHeaderBar
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        guildOwned={guildOwned}
      />

      {/* Main Viewport Content */}
      <div className="flex-grow flex flex-col min-h-0">
        {/* Tab 1: Guild Headquarters & Modular Upgrades */}
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

        {/* Tab 2: HQ Sanctuary & Custom Decor */}
        {activeSubTab === 'sanctuary' && guildOwned && (
          <GuildSanctuaryPanel
            gameState={gameState}
            guildOwned={guildOwned}
            handleBuyDecor={handleBuyDecor}
          />
        )}

        {/* Tab 3: Autonomous Follower Expedition Dispatch */}
        {activeSubTab === 'dispatch' && guildOwned && (
          <GuildMissionBoard
            gameState={gameState}
            selectedFollowerId={selectedFollowerId}
            setSelectedFollowerId={setSelectedFollowerId}
            selectedQuestId={selectedQuestId}
            setSelectedQuestId={setSelectedQuestId}
            handleDispatchFollower={handleDispatchFollower}
            handleClaimDispatchRewards={handleClaimDispatchRewards}
          />
        )}

        {/* Tab 4: Faction Armaments, Directives & Conquest Coffers */}
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

        {/* Tab 5: Safehouse Vault & Wilderness Storage */}
        {activeSubTab === 'stash' && (
          <GuildStashPanel
            hasStorageAccess={hasStorageAccess}
            isTown={isTown}
            chunkKey={chunkKey}
            isTownCenter={isTownCenter}
            guildOwned={guildOwned}
            isUsingGuildHQStash={isUsingGuildHQStash}
            gameState={gameState}
            handlePurchaseSafehouse={handlePurchaseSafehouse}
            handleSafehouseRest={handleSafehouseRest}
            handleStashAll={handleStashAll}
            handleStashMaterial={handleStashMaterial}
            handleStashCatalyst={handleStashCatalyst}
            handleStashEquipment={handleStashEquipment}
            currentSafehouseStash={currentSafehouseStash}
            setActiveSubTab={setActiveSubTab}
          />
        )}
      </div>
    </div>
  );
}
