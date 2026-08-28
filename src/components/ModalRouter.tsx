import React from 'react';
import { GameState } from '../types';
import AppOverlays, { AppOverlaysProps } from './AppOverlays';
import QuestBoardOverlay from './QuestBoardOverlay';
import CaravanActiveOverlay from './modals/CaravanActiveOverlay';
import AudioSettingsModal from './AudioSettingsModal';
import { generateCaravanSkirmishMap } from '../world/caravanSkirmishGen';

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
    setGameState((prev) => ({
      ...prev,
      map: skirmish.map,
      discovered: skirmish.discovered,
      visible: skirmish.visible,
      enemies: skirmish.enemies,
      props: skirmish.props,
      playerX: skirmish.playerX,
      playerY: skirmish.playerY,
      caravanTravel: prev.caravanTravel ? {
        ...prev.caravanTravel,
        wagonX: skirmish.wagonX,
        wagonY: skirmish.wagonY,
        isTacticalCombat: true,
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
