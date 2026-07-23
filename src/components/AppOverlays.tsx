import React from 'react';
import { GameState, Enemy, NPC, EquipmentItem } from '../types';
import HelpOverlay from './HelpOverlay';
import GodPanelOverlay from './GodPanelOverlay';
import GmPanelOverlay from './GmPanelOverlay';
import SleepOverlay from './SleepOverlay';
import HistoryBookOverlay from './HistoryBookOverlay';
import BestiaryOverlay from './BestiaryOverlay';
import FishingMiniGame from './FishingMiniGame';
import LockpickingMiniGame from './LockpickingMiniGame';
import PoiInteractionOverlay, { PoiType } from './PoiInteractionOverlay';
import DrunkInteractionOverlay from './DrunkInteractionOverlay';
import TravelerInteractionOverlay from './TravelerInteractionOverlay';
import SanctumRelicsDraftOverlay from './SanctumRelicsDraftOverlay';
import RecallScrollOverlay from './RecallScrollOverlay';
import FollowerInspectOverlay from './FollowerInspectOverlay';
import QuestBoardOverlay from './QuestBoardOverlay';
import { SanctumRelic } from '../utils/relics';

export interface AppOverlaysProps {
  // States
  isHelpOpen: boolean;
  setIsHelpOpen: (val: boolean) => void;

  isGodPanelOpen: boolean;
  setIsGodPanelOpen: (val: boolean) => void;

  isGmPanelOpen: boolean;
  setIsGmPanelOpen: (val: boolean) => void;

  isSleepOpen: boolean;
  setIsSleepOpen: (val: boolean) => void;

  isHistoryBookOpen: boolean;
  setIsHistoryBookOpen: (val: boolean) => void;

  isBestiaryOpen: boolean;
  setIsBestiaryOpen: (val: boolean) => void;

  isFishingOpen: boolean;
  setIsFishingOpen: (val: boolean) => void;

  isLockpickingOpen: boolean;
  setIsLockpickingOpen: (val: boolean) => void;

  activeLockpickingChestIndex: number | null;
  setActiveLockpickingChestIndex: (val: number | null) => void;

  activePoi: PoiType | null;
  setActivePoi: (val: PoiType | null) => void;

  activeDrunkNpc: NPC | null;
  setActiveDrunkNpc: (val: NPC | null) => void;

  activeTravelerNpc: NPC | null;
  setActiveTravelerNpc: (val: NPC | null) => void;

  unlawfulGuardTarget: { enemy: Enemy; index: number; pathPoints: any[] } | null;
  setUnlawfulGuardTarget: (val: { enemy: Enemy; index: number; pathPoints: any[] } | null) => void;

  activeRelicDraft: SanctumRelic[] | null;
  setActiveRelicDraft: (val: SanctumRelic[] | null) => void;

  activeRecallScroll: EquipmentItem | null;
  setActiveRecallScroll: (val: EquipmentItem | null) => void;

  isAutoplayActive: boolean;
  setIsAutoplayActive: (val: boolean) => void;

  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;

  // Callbacks
  addLogMessage: (text: string, type?: string) => void;
  handleRegenerateCurrentLocation: () => void;
  handleConfirmSleep: (hours: number) => void;
  handleCatchFish: (fishType: string) => void;
  handleFailFish: () => void;
  handleOpenChest: (index: number, isPerfect: boolean) => void;
  handleConsumeLockpick: () => void;
  handlePoiChoiceSelected: (optionId: string) => void;
  handleDrunkNpcEffects: (effects: any) => void;
  handleTravelerTrade: (item: any) => void;
  handleTravelerAttack: () => void;
  handleAcceptQuest: (quest: any) => void;
  handleTurnInQuest: (questId: string) => void;
  handleConfirmUnlawfulAttack: () => void;
  handleRecallTeleport: (target: any) => void;
}

export const AppOverlays: React.FC<AppOverlaysProps> = ({
  isHelpOpen,
  setIsHelpOpen,
  isGodPanelOpen,
  setIsGodPanelOpen,
  isGmPanelOpen,
  setIsGmPanelOpen,
  isSleepOpen,
  setIsSleepOpen,
  isHistoryBookOpen,
  setIsHistoryBookOpen,
  isBestiaryOpen,
  setIsBestiaryOpen,
  isFishingOpen,
  setIsFishingOpen,
  isLockpickingOpen,
  setIsLockpickingOpen,
  activeLockpickingChestIndex,
  setActiveLockpickingChestIndex,
  activePoi,
  setActivePoi,
  activeDrunkNpc,
  setActiveDrunkNpc,
  activeTravelerNpc,
  setActiveTravelerNpc,
  unlawfulGuardTarget,
  setUnlawfulGuardTarget,
  activeRelicDraft,
  setActiveRelicDraft,
  activeRecallScroll,
  setActiveRecallScroll,
  isAutoplayActive,
  setIsAutoplayActive,
  gameState,
  setGameState,
  addLogMessage,
  handleRegenerateCurrentLocation,
  handleConfirmSleep,
  handleCatchFish,
  handleFailFish,
  handleOpenChest,
  handleConsumeLockpick,
  handlePoiChoiceSelected,
  handleDrunkNpcEffects,
  handleTravelerTrade,
  handleTravelerAttack,
  handleAcceptQuest,
  handleTurnInQuest,
  handleConfirmUnlawfulAttack,
  handleRecallTeleport,
}) => {
  return (
    <>
      {isHelpOpen && (
        <HelpOverlay onClose={() => setIsHelpOpen(false)} />
      )}

      {activeRecallScroll && (
        <RecallScrollOverlay
          isOpen={true}
          gameState={gameState}
          onClose={() => setActiveRecallScroll(null)}
          onTeleport={handleRecallTeleport}
        />
      )}

      {gameState.activeFollowerIdForInspect && (
        <FollowerInspectOverlay
          gameState={gameState}
          setGameState={setGameState}
          followerId={gameState.activeFollowerIdForInspect}
          onClose={() => setGameState(prev => ({ ...prev, activeFollowerIdForInspect: null }))}
        />
      )}

      {gameState.activeQuestBoardOpen && (
        <QuestBoardOverlay
          gameState={gameState}
          setGameState={setGameState}
          onClose={() => setGameState(prev => ({ ...prev, activeQuestBoardOpen: false }))}
          onAcceptQuest={handleAcceptQuest}
          onTurnInQuest={handleTurnInQuest}
        />
      )}

      {isGodPanelOpen && (
        <GodPanelOverlay
          gameState={gameState}
          setGameState={setGameState}
          onClose={() => setIsGodPanelOpen(false)}
          onRegenerateCurrentLocation={handleRegenerateCurrentLocation}
          onTriggerLockpicking={() => {
            setActiveLockpickingChestIndex(-1);
            setIsLockpickingOpen(true);
          }}
          isAutoplayActive={isAutoplayActive}
          setIsAutoplayActive={setIsAutoplayActive}
        />
      )}

      {isGmPanelOpen && (
        <GmPanelOverlay
          gameState={gameState}
          setGameState={setGameState}
          addLogMessage={addLogMessage}
          onClose={() => setIsGmPanelOpen(false)}
        />
      )}

      {isSleepOpen && (
        <SleepOverlay
          playerStats={gameState.playerStats}
          currentGameTime={gameState.gameTime}
          onClose={() => setIsSleepOpen(false)}
          onConfirmSleep={handleConfirmSleep}
        />
      )}

      {isHistoryBookOpen && (
        <HistoryBookOverlay
          unlockedChapters={gameState.unlockedChapters || []}
          poisCount={0}
          onClose={() => setIsHistoryBookOpen(false)}
        />
      )}

      {isBestiaryOpen && (
        <BestiaryOverlay
          defeatedEnemiesCount={gameState.defeatedEnemiesCount || {}}
          onClose={() => setIsBestiaryOpen(false)}
        />
      )}

      {isFishingOpen && (
        <FishingMiniGame
          onClose={() => setIsFishingOpen(false)}
          onCatch={handleCatchFish}
          onFail={handleFailFish}
        />
      )}

      {isLockpickingOpen && activeLockpickingChestIndex !== null && (
        <LockpickingMiniGame
          onClose={() => {
            setIsLockpickingOpen(false);
            setActiveLockpickingChestIndex(null);
            addLogMessage("🔒 You stepped away from the locked chest.", "info");
          }}
          onSuccess={(isPerfect) => {
            setIsLockpickingOpen(false);
            if (activeLockpickingChestIndex !== null) {
              if (activeLockpickingChestIndex === -1) {
                addLogMessage(`🎁 Sovereign Chest Opened Successfully!${isPerfect ? ' (⭐ Perfect Lockpicking Bonus +40 XP Applied)' : ''}`, 'loot');
              } else {
                handleOpenChest(activeLockpickingChestIndex, isPerfect);
              }
              setActiveLockpickingChestIndex(null);
            }
          }}
          lockpickCount={activeLockpickingChestIndex === -1 ? 99 : (gameState.inventoryMaterials['mat_lockpick'] || 0)}
          onConsumeLockpick={() => {
            if (activeLockpickingChestIndex !== -1) {
              handleConsumeLockpick();
            }
          }}
          skeletonKeyCount={activeLockpickingChestIndex === -1 ? 0 : (gameState.inventoryMaterials['mat_skeleton_key'] || 0)}
          onUseSkeletonKey={() => {
            setIsLockpickingOpen(false);
            if (activeLockpickingChestIndex !== null) {
              if (activeLockpickingChestIndex !== -1) {
                setGameState(prev => {
                  const nextMats = { ...prev.inventoryMaterials };
                  nextMats['mat_skeleton_key'] = Math.max(0, (nextMats['mat_skeleton_key'] || 0) - 1);
                  return {
                    ...prev,
                    inventoryMaterials: nextMats
                  };
                });
                addLogMessage("💀 Grim Skeleton Key inserted! The heavy lock dissolves instantly with a ghastly click!", "loot");
                handleOpenChest(activeLockpickingChestIndex, false);
              }
              setActiveLockpickingChestIndex(null);
            }
          }}
          chestName={
            activeLockpickingChestIndex === -1
              ? "Sovereign Testing Vault"
              : gameState.chests[activeLockpickingChestIndex]?.id?.includes("camp_chest")
              ? "Hostile Outlaw Camp Cache"
              : gameState.chests[activeLockpickingChestIndex]?.id?.includes("ruined_chest")
              ? "Ancient Ruins Treasure Vault"
              : gameState.chests[activeLockpickingChestIndex]?.id?.includes("oasis_chest")
              ? "Gilded Sarcophagus"
              : gameState.chests[activeLockpickingChestIndex]?.id?.startsWith("chest_")
              ? `Abyss Floor ${gameState.playerStats.depth} Dungeon Vault`
              : "Locked Treasure Chest"
          }
        />
      )}

      {activePoi && (
        <PoiInteractionOverlay
          poi={activePoi}
          playerStats={gameState.playerStats}
          townReputation={gameState.townReputation ?? 100}
          onClose={() => setActivePoi(null)}
          onSelectOption={handlePoiChoiceSelected}
        />
      )}

      {activeDrunkNpc && (
        <DrunkInteractionOverlay
          npc={activeDrunkNpc}
          playerStats={gameState.playerStats}
          onClose={() => setActiveDrunkNpc(null)}
          onApplyEffects={handleDrunkNpcEffects}
        />
      )}

      {activeTravelerNpc && (
        <TravelerInteractionOverlay
          npc={activeTravelerNpc}
          playerStats={gameState.playerStats}
          visibleTiles={gameState.visible}
          otherNpcs={gameState.npcs}
          onClose={() => setActiveTravelerNpc(null)}
          onTrade={handleTravelerTrade}
          onAttack={handleTravelerAttack}
          gameStateQuests={gameState.quests}
          inventoryMaterials={gameState.inventoryMaterials}
          onAcceptQuest={handleAcceptQuest}
          onTurnInQuest={handleTurnInQuest}
        />
      )}

      {unlawfulGuardTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 select-none animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center animate-scale-up">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚖️
            </div>
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wide text-rose-500 font-sans">
                Unlawful Offense Warned
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                You are about to assault <span className="font-bold text-slate-100">{unlawfulGuardTarget.enemy.name}</span>, a peacekeeper of the crown!
              </p>
              <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/40 p-2.5 rounded border border-slate-800">
                ⚠️ <span className="font-bold text-rose-400">CRITICAL CONSEQUENCE:</span> Attacking a town guard will make <strong className="text-slate-100">ALL TOWN GUARDS hostile</strong> to you and your companions permanently!
              </p>
            </div>
            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={() => setUnlawfulGuardTarget(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                Withdraw Assault
              </button>
              <button
                onClick={handleConfirmUnlawfulAttack}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Attack Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRelicDraft && (
        <SanctumRelicsDraftOverlay
          draft={activeRelicDraft}
          onSelectRelic={(relic) => {
            setGameState(prev => {
              const stats = { ...prev.playerStats };
              const relicsList = [...(stats.relics || [])];
              if (!relicsList.includes(relic.id)) {
                relicsList.push(relic.id);
              }
              return {
                ...prev,
                playerStats: {
                  ...stats,
                  relics: relicsList
                }
              };
            });
            addLogMessage(`🌟 Fused Sanctum Relic: Claimed the ${relic.name}!`, 'craft');
            setActiveRelicDraft(null);
          }}
        />
      )}
    </>
  );
};

export default AppOverlays;
