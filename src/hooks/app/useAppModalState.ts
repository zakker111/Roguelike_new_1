import { useState, useCallback } from 'react';
import { Enemy, NPC, EquipmentItem } from '../../types';
import { PoiType } from '../../components/PoiInteractionOverlay';
import { SanctumRelic } from '../../utils/relics';
import { performanceMonitor } from '../../utils/performanceMonitor';

export interface AppModalState {
  // Simple dialog flags
  isAudioSettingsOpen: boolean;
  setIsAudioSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHelpOpen: boolean;
  setIsHelpOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWorldThreatOpen: boolean;
  setIsWorldThreatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWorldMapOpen: boolean;
  setIsWorldMapOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGodPanelOpen: boolean;
  setIsGodPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGmPanelOpen: boolean;
  setIsGmPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSleepOpen: boolean;
  setIsSleepOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPerfHudOpen: boolean;
  setIsPerfHudOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBestiaryOpen: boolean;
  setIsBestiaryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFishingOpen: boolean;
  setIsFishingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLockpickingOpen: boolean;
  setIsLockpickingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isScriptoriumOpen: boolean;
  setIsScriptoriumOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWeatherControlOpen: boolean;
  setIsWeatherControlOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAutoplayActive: boolean;
  setIsAutoplayActive: React.Dispatch<React.SetStateAction<boolean>>;

  // Targeted / entity interaction state
  activeScriptoriumScrollTemplateId: string | null;
  setActiveScriptoriumScrollTemplateId: React.Dispatch<React.SetStateAction<string | null>>;
  activeLockpickingChestIndex: number | null;
  setActiveLockpickingChestIndex: React.Dispatch<React.SetStateAction<number | null>>;
  unlawfulGuardTarget: { enemy: Enemy; index: number; pathPoints: any[] } | null;
  setUnlawfulGuardTarget: React.Dispatch<React.SetStateAction<{ enemy: Enemy; index: number; pathPoints: any[] } | null>>;
  activePoi: PoiType | null;
  setActivePoi: React.Dispatch<React.SetStateAction<PoiType | null>>;
  activeDrunkNpc: NPC | null;
  setActiveDrunkNpc: React.Dispatch<React.SetStateAction<NPC | null>>;
  activeTravelerNpc: NPC | null;
  setActiveTravelerNpc: React.Dispatch<React.SetStateAction<NPC | null>>;
  activeDialogueNpc: NPC | null;
  setActiveDialogueNpc: React.Dispatch<React.SetStateAction<NPC | null>>;
  activeRelicDraft: SanctumRelic[] | null;
  setActiveRelicDraft: React.Dispatch<React.SetStateAction<SanctumRelic[] | null>>;
  activeRecallScroll: EquipmentItem | null;
  setActiveRecallScroll: React.Dispatch<React.SetStateAction<EquipmentItem | null>>;
  activeTargetedScroll: EquipmentItem | null;
  setActiveTargetedScroll: React.Dispatch<React.SetStateAction<EquipmentItem | null>>;

  // Convenience actions
  closeAllModals: () => void;
  openScriptorium: (templateId?: string | null) => void;
  openLockpicking: (chestIndex: number) => void;
}

/**
 * Custom hook encapsulating modal dialog and tactical overlay visibility states.
 * Decouples modal routing and overlay lifecycle management from the central App component.
 */
export function useAppModalState(): AppModalState {
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWorldThreatOpen, setIsWorldThreatOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isGodPanelOpen, setIsGodPanelOpen] = useState(false);
  const [isGmPanelOpen, setIsGmPanelOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isPerfHudOpen, setIsPerfHudOpen] = useState(() => performanceMonitor.isHudOpen());
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isFishingOpen, setIsFishingOpen] = useState(false);
  const [isLockpickingOpen, setIsLockpickingOpen] = useState(false);
  const [isScriptoriumOpen, setIsScriptoriumOpen] = useState(false);
  const [isWeatherControlOpen, setIsWeatherControlOpen] = useState(false);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);

  // Contextual modal payloads
  const [activeScriptoriumScrollTemplateId, setActiveScriptoriumScrollTemplateId] = useState<string | null>(null);
  const [activeLockpickingChestIndex, setActiveLockpickingChestIndex] = useState<number | null>(null);
  const [unlawfulGuardTarget, setUnlawfulGuardTarget] = useState<{ enemy: Enemy; index: number; pathPoints: any[] } | null>(null);
  const [activePoi, setActivePoi] = useState<PoiType | null>(null);
  const [activeDrunkNpc, setActiveDrunkNpc] = useState<NPC | null>(null);
  const [activeTravelerNpc, setActiveTravelerNpc] = useState<NPC | null>(null);
  const [activeDialogueNpc, setActiveDialogueNpc] = useState<NPC | null>(null);
  const [activeRelicDraft, setActiveRelicDraft] = useState<SanctumRelic[] | null>(null);
  const [activeRecallScroll, setActiveRecallScroll] = useState<EquipmentItem | null>(null);
  const [activeTargetedScroll, setActiveTargetedScroll] = useState<EquipmentItem | null>(null);

  const closeAllModals = useCallback(() => {
    setIsAudioSettingsOpen(false);
    setIsHelpOpen(false);
    setIsWorldThreatOpen(false);
    setIsWorldMapOpen(false);
    setIsGodPanelOpen(false);
    setIsGmPanelOpen(false);
    setIsSleepOpen(false);
    setIsBestiaryOpen(false);
    setIsFishingOpen(false);
    setIsLockpickingOpen(false);
    setIsScriptoriumOpen(false);
    setIsWeatherControlOpen(false);
    setActiveScriptoriumScrollTemplateId(null);
    setActiveLockpickingChestIndex(null);
    setUnlawfulGuardTarget(null);
    setActivePoi(null);
    setActiveDrunkNpc(null);
    setActiveTravelerNpc(null);
    setActiveDialogueNpc(null);
    setActiveRelicDraft(null);
    setActiveRecallScroll(null);
    setActiveTargetedScroll(null);
  }, []);

  const openScriptorium = useCallback((templateId: string | null = null) => {
    setActiveScriptoriumScrollTemplateId(templateId);
    setIsScriptoriumOpen(true);
  }, []);

  const openLockpicking = useCallback((chestIndex: number) => {
    setActiveLockpickingChestIndex(chestIndex);
    setIsLockpickingOpen(true);
  }, []);

  return {
    isAudioSettingsOpen,
    setIsAudioSettingsOpen,
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
    isPerfHudOpen,
    setIsPerfHudOpen,
    isBestiaryOpen,
    setIsBestiaryOpen,
    isFishingOpen,
    setIsFishingOpen,
    isLockpickingOpen,
    setIsLockpickingOpen,
    isScriptoriumOpen,
    setIsScriptoriumOpen,
    isWeatherControlOpen,
    setIsWeatherControlOpen,
    isAutoplayActive,
    setIsAutoplayActive,
    activeScriptoriumScrollTemplateId,
    setActiveScriptoriumScrollTemplateId,
    activeLockpickingChestIndex,
    setActiveLockpickingChestIndex,
    unlawfulGuardTarget,
    setUnlawfulGuardTarget,
    activePoi,
    setActivePoi,
    activeDrunkNpc,
    setActiveDrunkNpc,
    activeTravelerNpc,
    setActiveTravelerNpc,
    activeDialogueNpc,
    setActiveDialogueNpc,
    activeRelicDraft,
    setActiveRelicDraft,
    activeRecallScroll,
    setActiveRecallScroll,
    activeTargetedScroll,
    setActiveTargetedScroll,
    closeAllModals,
    openScriptorium,
    openLockpicking,
  };
}
