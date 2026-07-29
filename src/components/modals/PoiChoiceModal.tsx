import React from 'react';
import PoiInteractionOverlay, { PoiType } from '../PoiInteractionOverlay';
import { PlayerStats } from '../../types';

export interface PoiChoiceModalProps {
  poi: PoiType;
  playerStats: PlayerStats;
  townReputation: number;
  onClose: () => void;
  onSelectOption: (
    poiId: string,
    choiceId: string,
    effects: any
  ) => void;
}

export const PoiChoiceModal: React.FC<PoiChoiceModalProps> = (props) => {
  return <PoiInteractionOverlay {...props} />;
};

export default PoiChoiceModal;
