import { useState } from 'react';
import { Enemy, NPC, EquipmentItem } from '../types';
import { PoiType } from '../components/PoiInteractionOverlay';
import { SanctumRelic } from '../utils/relics';

export function useModalManager() {
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGodPanelOpen, setIsGodPanelOpen] = useState(false);
  const [isGmPanelOpen, setIsGmPanelOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isFishingOpen, setIsFishingOpen] = useState(false);
  const [isLockpickingOpen, setIsLockpickingOpen] = useState(false);
  const [isWeatherControlOpen, setIsWeatherControlOpen] = useState(false);
  const [activeLockpickingChestIndex, setActiveLockpickingChestIndex] = useState<number | null>(null);
  const [unlawfulGuardTarget, setUnlawfulGuardTarget] = useState<{ enemy: Enemy; index: number; pathPoints: any[] } | null>(null);
  const [activePoi, setActivePoi] = useState<PoiType | null>(null);
  const [activeDrunkNpc, setActiveDrunkNpc] = useState<NPC | null>(null);
  const [activeTravelerNpc, setActiveTravelerNpc] = useState<NPC | null>(null);
  const [activeDialogueNpc, setActiveDialogueNpc] = useState<NPC | null>(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [activeRelicDraft, setActiveRelicDraft] = useState<SanctumRelic[] | null>(null);
  const [activeRecallScroll, setActiveRecallScroll] = useState<EquipmentItem | null>(null);
  const [activeTargetedScroll, setActiveTargetedScroll] = useState<EquipmentItem | null>(null);

  const closeAllModals = () => {
    setIsAudioSettingsOpen(false);
    setIsHelpOpen(false);
    setIsGodPanelOpen(false);
    setIsGmPanelOpen(false);
    setIsSleepOpen(false);
    setIsBestiaryOpen(false);
    setIsFishingOpen(false);
    setIsLockpickingOpen(false);
    setIsWeatherControlOpen(false);
    setActiveLockpickingChestIndex(null);
    setUnlawfulGuardTarget(null);
    setActivePoi(null);
    setActiveDrunkNpc(null);
    setActiveTravelerNpc(null);
    setActiveDialogueNpc(null);
    setActiveRelicDraft(null);
    setActiveRecallScroll(null);
    setActiveTargetedScroll(null);
  };

  return {
    isAudioSettingsOpen, setIsAudioSettingsOpen,
    isHelpOpen, setIsHelpOpen,
    isGodPanelOpen, setIsGodPanelOpen,
    isGmPanelOpen, setIsGmPanelOpen,
    isSleepOpen, setIsSleepOpen,
    isBestiaryOpen, setIsBestiaryOpen,
    isFishingOpen, setIsFishingOpen,
    isLockpickingOpen, setIsLockpickingOpen,
    isWeatherControlOpen, setIsWeatherControlOpen,
    activeLockpickingChestIndex, setActiveLockpickingChestIndex,
    unlawfulGuardTarget, setUnlawfulGuardTarget,
    activePoi, setActivePoi,
    activeDrunkNpc, setActiveDrunkNpc,
    activeTravelerNpc, setActiveTravelerNpc,
    activeDialogueNpc, setActiveDialogueNpc,
    isAutoplayActive, setIsAutoplayActive,
    activeRelicDraft, setActiveRelicDraft,
    activeRecallScroll, setActiveRecallScroll,
    activeTargetedScroll, setActiveTargetedScroll,
    closeAllModals,
  };
}
