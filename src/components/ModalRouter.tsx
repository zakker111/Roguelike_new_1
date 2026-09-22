import React from 'react';
import { GameState } from '../types';
import AppOverlays, { AppOverlaysProps } from './AppOverlays';
import QuestBoardOverlay from './QuestBoardOverlay';
import CaravanActiveOverlay from './modals/CaravanActiveOverlay';
import AudioSettingsModal from './AudioSettingsModal';
import { generateCaravanSkirmishMap } from '../world/caravanSkirmishGen';
import { ChunkBackgroundCache } from '../canvas/chunkBackgroundCache';

export interface ModalRouterProps extends AppOverlaysProps {
  handleResolveCaravanEncounterOption?: (optionId: any) => void;
  handleAdvanceCaravanTravel?: () => void;
  handleCompleteCaravanTravel?: () => void;
  isAudioSettingsOpen?: boolean;
  setIsAudioSettingsOpen?: (open: boolean) => void;
}

export const ModalRouter: React.FC<ModalRouterProps> = (props) => {
  const {
    gameState,
    setGameState,
    handleAcceptQuest,
    handleTurnInQuest,
    handleResolveCaravanEncounterOption,
    handleAdvanceCaravanTravel,
    handleCompleteCaravanTravel,
    isAudioSettingsOpen = false,
    setIsAudioSettingsOpen,
  } = props;

  const handleDeployTacticalBattle = (encounter: any) => {
    const skirmish = generateCaravanSkirmishMap(gameState, encounter);
    ChunkBackgroundCache.getInstance().invalidate();
    setGameState((prev) => ({
      ...prev,
      map: skirmish.map,
      levelWidth: skirmish.map[0]?.length || 24,
      levelHeight: skirmish.map.length || 18,
      discovered: skirmish.discovered,
      visible: skirmish.visible,
      enemies: skirmish.enemies,
      dungeonProps: skirmish.props,
      corpses: [],
      bloodSplatters: [],
      lootPiles: [],
      playerX: skirmish.playerX,
      playerY: skirmish.playerY,
      caravanTravel: prev.caravanTravel ? {
        ...prev.caravanTravel,
        wagonX: skirmish.wagonX,
        wagonY: skirmish.wagonY,
        isTacticalCombat: true,
        savedOverworldState: {
          map: prev.map,
          levelWidth: prev.levelWidth,
          levelHeight: prev.levelHeight,
          discovered: prev.discovered,
          visible: prev.visible,
          enemies: prev.enemies,
          dungeonProps: prev.dungeonProps || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          lootPiles: prev.lootPiles || [],
          playerX: prev.playerX,
          playerY: prev.playerY,
          currentChunkX: prev.currentChunkX,
          currentChunkY: prev.currentChunkY,
        },
        currentEncounter: {
          ...encounter,
          isTacticalCombat: true,
          resolved: false
        }
      } : null
    }));
  };

  return (
    <>
      {/* Interactive Tactical Overlays */}
      <AppOverlays {...props} />

      {/* Quest Board Overlay */}
      {gameState.activeQuestBoardOpen && (
        <QuestBoardOverlay
          gameState={gameState}
          setGameState={setGameState}
          onClose={() => setGameState(prev => ({ ...prev, activeQuestBoardOpen: false }))}
          onAcceptQuest={handleAcceptQuest}
          onTurnInQuest={handleTurnInQuest}
        />
      )}

      {/* Caravan Travel Active Journey Overlay */}
      <CaravanActiveOverlay
        gameState={gameState}
        setGameState={setGameState}
        handleResolveCaravanEncounterOption={handleResolveCaravanEncounterOption}
        handleAdvanceCaravanTravel={handleAdvanceCaravanTravel}
        handleCompleteCaravanTravel={handleCompleteCaravanTravel}
        handleDeployTacticalBattle={handleDeployTacticalBattle}
      />

      {/* Procedural Audio & Soundscape Controls Modal */}
      {setIsAudioSettingsOpen && (
        <AudioSettingsModal
          isOpen={isAudioSettingsOpen}
          onClose={() => setIsAudioSettingsOpen(false)}
        />
      )}
    </>
  );
};

export default ModalRouter;
