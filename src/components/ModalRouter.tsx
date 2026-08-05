import React from 'react';
import { GameState } from '../types';
import AppOverlays, { AppOverlaysProps } from './AppOverlays';
import QuestBoardOverlay from './QuestBoardOverlay';
import CaravanActiveOverlay from './modals/CaravanActiveOverlay';

export interface ModalRouterProps extends AppOverlaysProps {
  handleResolveCaravanEncounterOption: (optionId: string) => void;
  handleAdvanceCaravanTravel: () => void;
  handleCompleteCaravanTravel: () => void;
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
  } = props;

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
      />
    </>
  );
};

export default ModalRouter;
