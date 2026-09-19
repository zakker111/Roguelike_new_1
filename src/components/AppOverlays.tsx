import React from 'react';
import { GameState, Enemy, NPC, EquipmentItem } from '../types';
import HelpOverlay from './HelpOverlay';
import GodPanelOverlay from './GodPanelOverlay';
import GmPanelOverlay from './GmPanelOverlay';
import SleepOverlay from './SleepOverlay';
import BestiaryOverlay from './BestiaryOverlay';
import FishingMiniGame from './FishingMiniGame';
import LockpickingMiniGame from './LockpickingMiniGame';
import ScriptoriumMiniGame from './ScriptoriumMiniGame';
import { GlyphScribingResult } from '../types';
import PoiInteractionOverlay, { PoiType } from './PoiInteractionOverlay';
import DrunkInteractionOverlay from './DrunkInteractionOverlay';
import TravelerInteractionOverlay from './TravelerInteractionOverlay';
import DialogueModal from './modals/DialogueModal';
import SanctumRelicsDraftOverlay from './SanctumRelicsDraftOverlay';
import RecallScrollOverlay from './RecallScrollOverlay';
import FollowerInspectOverlay from './FollowerInspectOverlay';
import QuestBoardOverlay from './QuestBoardOverlay';
import UnlawfulAssaultModal from './modals/UnlawfulAssaultModal';
import WorldThreatModal from './modals/WorldThreatModal';
import { WorldMapModal } from './worldmap/WorldMapModal';
import { SanctumRelic } from '../utils/relics';
import { PerformanceHud } from './PerformanceHud';
import { performanceMonitor } from '../utils/performanceMonitor';

export interface AppOverlaysProps {
  // States
  isPerfHudOpen?: boolean;
  setIsPerfHudOpen?: (val: boolean) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (val: boolean) => void;

  isWorldThreatOpen?: boolean;
  setIsWorldThreatOpen?: (val: boolean) => void;

  isWorldMapOpen?: boolean;
  setIsWorldMapOpen?: (val: boolean) => void;

  isGodPanelOpen: boolean;
  setIsGodPanelOpen: (val: boolean) => void;

  isGmPanelOpen: boolean;
  setIsGmPanelOpen: (val: boolean) => void;

  isSleepOpen: boolean;
  setIsSleepOpen: (val: boolean) => void;

  isBestiaryOpen: boolean;
  setIsBestiaryOpen: (val: boolean) => void;

  isFishingOpen: boolean;
  setIsFishingOpen: (val: boolean) => void;

  isLockpickingOpen: boolean;
  setIsLockpickingOpen: (val: boolean) => void;

  isScriptoriumOpen?: boolean;
  setIsScriptoriumOpen?: (val: boolean) => void;

  activeScriptoriumScrollTemplateId?: string | null;
  setActiveScriptoriumScrollTemplateId?: (val: string | null) => void;

  activeLockpickingChestIndex: number | null;
  setActiveLockpickingChestIndex: (val: number | null) => void;

  activePoi: PoiType | null;
  setActivePoi: (val: PoiType | null) => void;

  activeDrunkNpc: NPC | null;
  setActiveDrunkNpc: (val: NPC | null) => void;

  activeTravelerNpc: NPC | null;
  setActiveTravelerNpc: (val: NPC | null) => void;

  activeDialogueNpc?: NPC | null;
  setActiveDialogueNpc?: (val: NPC | null) => void;
  onOpenNpcTrade?: (npcId: string) => void;

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
  handleConfirmSleep: (hours: number, hpHealed?: number, mpHealed?: number) => void;
  handleCatchFish: (fishType: string, fishId?: string) => void;
  handleFailFish: () => void;
  handleOpenChest: (index: number, isPerfect: boolean) => void;
  handleConsumeLockpick: () => void;
  handlePoiChoiceSelected: (poiId: string, choiceId?: string, effects?: any) => void;
  handleDrunkNpcEffects: (effects: any) => void;
  handleTravelerTrade: (item?: any) => void;
  handleTravelerAttack: (witnessed?: boolean) => void;
  handleAcceptQuest: (quest: any) => void;
  handleTurnInQuest: (questId: string) => void;
  handleConfirmUnlawfulAttack: () => void;
  handleRecallTeleport: (destX: any, destY?: any, destName?: any) => void;
  onAttuneWaystone?: (poiId: string) => void;
  onWaystoneFastTravel?: (targetChunkX: number, targetChunkY: number, targetX: number, targetY: number, targetName: string) => void;
  onChallengeGuardian?: (poi: PoiType) => void;
  handleResolveCaravanEncounterOption?: (choice: any) => void;
  handleAdvanceCaravanTravel?: () => void;
  handleCompleteCaravanTravel?: () => void;
  isAudioSettingsOpen?: boolean;
  setIsAudioSettingsOpen?: (val: boolean) => void;
  handleScriptoriumSuccess?: (result: GlyphScribingResult) => void;
  handleScriptoriumFailure?: () => void;
  onTriggerScriptorium?: (scrollTemplateId?: string) => void;
}

export const AppOverlays = React.memo<AppOverlaysProps>(({
  isPerfHudOpen,
  setIsPerfHudOpen,
  isHelpOpen,
  setIsHelpOpen,
  isWorldThreatOpen,
  setIsWorldThreatOpen,
  isWorldMapOpen,
  setIsWorldMapOpen,
  isGodPanelOpen,
  setIsGodPanelOpen,
  isGmPanelOpen,
  setIsGmPanelOpen,
  isSleepOpen,
  setIsSleepOpen,
  isBestiaryOpen,
  setIsBestiaryOpen,
  isFishingOpen,
  setIsFishingOpen,
  isLockpickingOpen,
  setIsLockpickingOpen,
  isScriptoriumOpen = false,
  setIsScriptoriumOpen,
  activeScriptoriumScrollTemplateId = null,
  setActiveScriptoriumScrollTemplateId,
  activeLockpickingChestIndex,
  setActiveLockpickingChestIndex,
  activePoi,
  setActivePoi,
  activeDrunkNpc,
  setActiveDrunkNpc,
  activeTravelerNpc,
  setActiveTravelerNpc,
  activeDialogueNpc,
  setActiveDialogueNpc,
  onOpenNpcTrade,
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
  onAttuneWaystone,
  onWaystoneFastTravel,
  onChallengeGuardian,
  handleScriptoriumSuccess,
  handleScriptoriumFailure,
  onTriggerScriptorium,
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
          onTriggerFishing={() => {
            setIsFishingOpen(true);
          }}
          onTriggerScriptorium={(scrollTemplateId) => {
            if (setActiveScriptoriumScrollTemplateId) {
              setActiveScriptoriumScrollTemplateId(scrollTemplateId || 'scroll_fireball');
            }
            if (setIsScriptoriumOpen) {
              setIsScriptoriumOpen(true);
            }
          }}
          isAutoplayActive={isAutoplayActive}
          setIsAutoplayActive={setIsAutoplayActive}
          isPerfHudOpen={isPerfHudOpen}
          setIsPerfHudOpen={setIsPerfHudOpen}
          addLogMessage={addLogMessage}
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
          gameState={gameState}
          onClose={() => setIsSleepOpen(false)}
          onConfirmSleep={handleConfirmSleep}
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

      {isScriptoriumOpen && (
        <ScriptoriumMiniGame
          targetScrollTemplateId={activeScriptoriumScrollTemplateId || undefined}
          onClose={() => {
            if (setIsScriptoriumOpen) setIsScriptoriumOpen(false);
            if (setActiveScriptoriumScrollTemplateId) setActiveScriptoriumScrollTemplateId(null);
            addLogMessage("📜 You set aside the arcane parchment and quill.", "info");
          }}
          onSuccess={(result) => {
            if (handleScriptoriumSuccess) {
              handleScriptoriumSuccess(result);
            }
            if (setIsScriptoriumOpen) setIsScriptoriumOpen(false);
            if (setActiveScriptoriumScrollTemplateId) setActiveScriptoriumScrollTemplateId(null);
          }}
          onFail={() => {
            if (handleScriptoriumFailure) {
              handleScriptoriumFailure();
            } else {
              addLogMessage("💥 The glyph destabilized and fizzled into ethereal smoke.", "danger");
            }
            if (setIsScriptoriumOpen) setIsScriptoriumOpen(false);
            if (setActiveScriptoriumScrollTemplateId) setActiveScriptoriumScrollTemplateId(null);
          }}
        />
      )}

      {activePoi && (
        <PoiInteractionOverlay
          poi={activePoi}
          playerStats={gameState.playerStats}
          townReputation={gameState.townReputation ?? 100}
          inventoryMaterials={gameState.inventoryMaterials}
          inventoryCatalysts={gameState.inventoryCatalysts}
          attunedWaystones={gameState.attunedWaystones || []}
          allKnownWaystones={(() => {
            const list: PoiType[] = [];
            Object.values(gameState.overworldChunks || {}).forEach((chunk: any) => {
              if (chunk.pois) list.push(...chunk.pois);
            });
            return list;
          })()}
          onClose={() => setActivePoi(null)}
          onSelectOption={handlePoiChoiceSelected}
          onAttuneWaystone={onAttuneWaystone}
          onFastTravel={onWaystoneFastTravel}
          onChallengeGuardian={onChallengeGuardian}
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

      {activeDialogueNpc && (
        <DialogueModal
          npc={activeDialogueNpc}
          playerStats={gameState.playerStats}
          townReputation={gameState.townReputation ?? 100}
          quests={gameState.quests}
          inventoryMaterials={gameState.inventoryMaterials}
          weather={gameState.weather}
          gameTime={gameState.gameTime}
          biome={gameState.biome}
          season={gameState.season}
          onClose={() => setActiveDialogueNpc?.(null)}
          onBuyTavernDrink={() => {
            if (setGameState && addLogMessage) {
              setGameState((prev) => {
                if (prev.playerStats.gold < 5) return prev;
                return {
                  ...prev,
                  playerStats: {
                    ...prev.playerStats,
                    gold: prev.playerStats.gold - 5,
                    hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + 15),
                    mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + 15),
                  }
                };
              });
              addLogMessage(`🍻 Shared a tavern toast! Restored +15 HP & +15 MP (-5 Gold)`, 'loot');
            }
          }}
          onOpenTrade={() => {
            if (onOpenNpcTrade && activeDialogueNpc) {
              onOpenNpcTrade(activeDialogueNpc.id);
            }
          }}
          addLogMessage={addLogMessage}
        />
      )}

      <UnlawfulAssaultModal
        unlawfulGuardTarget={unlawfulGuardTarget}
        onCancel={() => setUnlawfulGuardTarget(null)}
        onConfirm={handleConfirmUnlawfulAttack}
      />

      {isWorldThreatOpen && setIsWorldThreatOpen && (
        <WorldThreatModal
          gameState={gameState}
          setGameState={setGameState}
          onClose={() => setIsWorldThreatOpen(false)}
          addLogMessage={addLogMessage}
        />
      )}

      {isWorldMapOpen && setIsWorldMapOpen && (
        <WorldMapModal
          isOpen={isWorldMapOpen}
          onClose={() => setIsWorldMapOpen(false)}
          gameState={gameState}
          onFastTravelToChunk={(targetChunkX, targetChunkY, name) => {
            if (onWaystoneFastTravel) {
              onWaystoneFastTravel(targetChunkX, targetChunkY, 15, 10, name || 'Leyline Waystone');
            }
          }}
          onAddPin={(pin) => {
            setGameState(prev => ({
              ...prev,
              customMapPins: [...(prev.customMapPins || []), pin]
            }));
            addLogMessage(`📍 [CARTOGRAPHY]: Placed map marker "${pin.label}" at chunk [${pin.chunkX}, ${pin.chunkY}]`, 'info');
          }}
          onUpdatePin={(pin) => {
            setGameState(prev => ({
              ...prev,
              customMapPins: (prev.customMapPins || []).map(p => p.id === pin.id ? pin : p)
            }));
            addLogMessage(`✏️ [CARTOGRAPHY]: Updated map marker "${pin.label}"`, 'info');
          }}
          onDeletePin={(pinId) => {
            setGameState(prev => ({
              ...prev,
              customMapPins: (prev.customMapPins || []).filter(p => p.id !== pinId)
            }));
            addLogMessage(`🗑️ [CARTOGRAPHY]: Removed map marker`, 'info');
          }}
        />
      )}

      {activeRelicDraft && (
        <SanctumRelicsDraftOverlay
          draft={activeRelicDraft}
          onClose={() => setActiveRelicDraft(null)}
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

      {/* Real-Time Performance & Resource HUD */}
      {(isPerfHudOpen ?? performanceMonitor.isHudOpen()) && (
        <PerformanceHud
          gameState={gameState}
          onClose={() => {
            if (setIsPerfHudOpen) {
              setIsPerfHudOpen(false);
            }
            performanceMonitor.setHudOpen(false);
          }}
        />
      )}
    </>
  );
});

export default AppOverlays;
