/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { GameState, TileType } from '../../types';
import { hybridGraphicsEngine } from '../../canvas/HybridGraphicsEngine';
import { performanceMonitor } from '../../utils/performanceMonitor';

export interface UseKeyboardControlsParams {
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  isLockpickingOpen: boolean;
  setIsLockpickingOpen?: Dispatch<SetStateAction<boolean>>;
  isFishingOpen: boolean;
  setIsFishingOpen?: Dispatch<SetStateAction<boolean>>;
  isScriptoriumOpen?: boolean;
  setIsScriptoriumOpen?: Dispatch<SetStateAction<boolean>>;
  activeScriptoriumScrollTemplateId?: string | null;
  setActiveScriptoriumScrollTemplateId?: Dispatch<SetStateAction<string | null>>;
  activeLockpickingChestIndex?: number | null;
  setActiveLockpickingChestIndex?: Dispatch<SetStateAction<number | null>>;
  unlawfulGuardTarget?: any;
  setUnlawfulGuardTarget?: Dispatch<SetStateAction<any>>;
  activePoi?: any;
  setActivePoi?: Dispatch<SetStateAction<any>>;
  activeDrunkNpc?: any;
  setActiveDrunkNpc?: Dispatch<SetStateAction<any>>;
  activeTravelerNpc?: any;
  setActiveTravelerNpc?: Dispatch<SetStateAction<any>>;
  activeRelicDraft?: any;
  setActiveRelicDraft?: Dispatch<SetStateAction<any>>;
  activeRecallScroll?: boolean;
  setActiveRecallScroll?: Dispatch<SetStateAction<boolean>>;
  activeTargetedScroll?: any;
  setActiveTargetedScroll?: Dispatch<SetStateAction<any>>;
  isHelpOpen: boolean;
  setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
  isGodPanelOpen: boolean;
  setIsGodPanelOpen: Dispatch<SetStateAction<boolean>>;
  isGmPanelOpen: boolean;
  setIsGmPanelOpen: Dispatch<SetStateAction<boolean>>;
  isBestiaryOpen: boolean;
  setIsBestiaryOpen: Dispatch<SetStateAction<boolean>>;
  isWorldThreatOpen?: boolean;
  setIsWorldThreatOpen?: Dispatch<SetStateAction<boolean>>;
  isAudioSettingsOpen?: boolean;
  setIsAudioSettingsOpen?: Dispatch<SetStateAction<boolean>>;
  isSleepOpen?: boolean;
  setIsSleepOpen?: Dispatch<SetStateAction<boolean>>;
  isWeatherControlOpen?: boolean;
  setIsWeatherControlOpen?: Dispatch<SetStateAction<boolean>>;
  isWorldMapOpen?: boolean;
  setIsWorldMapOpen?: Dispatch<SetStateAction<boolean>>;
  isPerfHudOpen?: boolean;
  setIsPerfHudOpen?: Dispatch<SetStateAction<boolean>>;
  activeTab: 'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles';
  setActiveTab: Dispatch<SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles'>>;
  activeDialogueNpc?: any;
  setActiveDialogueNpc?: Dispatch<SetStateAction<any>>;
  handleBraceDefense: () => void;
  climbStairsUpToOverworld: () => void;
  climbToPreviousDepth: () => void;
  advanceToNextDepth: () => void;
  descendToDungeonFirstFloor: () => void;
  handleGKeyInteract: () => void;
  makeMove: (dx: number, dy: number) => void;
  addLogMessage: (text: string, type?: string) => void;
}

export function useKeyboardControls({
  gameStateRef,
  setGameState,
  isPlaying,
  isGameOver,
  isVictory,
  isLockpickingOpen,
  setIsLockpickingOpen,
  isFishingOpen,
  setIsFishingOpen,
  isScriptoriumOpen,
  setIsScriptoriumOpen,
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
  activeRelicDraft,
  setActiveRelicDraft,
  activeRecallScroll,
  setActiveRecallScroll,
  activeTargetedScroll,
  setActiveTargetedScroll,
  isHelpOpen,
  setIsHelpOpen,
  isGodPanelOpen,
  setIsGodPanelOpen,
  isGmPanelOpen,
  setIsGmPanelOpen,
  isBestiaryOpen,
  setIsBestiaryOpen,
  isWorldThreatOpen,
  setIsWorldThreatOpen,
  isAudioSettingsOpen,
  setIsAudioSettingsOpen,
  isSleepOpen,
  setIsSleepOpen,
  isWeatherControlOpen,
  setIsWeatherControlOpen,
  isWorldMapOpen,
  setIsWorldMapOpen,
  isPerfHudOpen,
  setIsPerfHudOpen,
  activeTab,
  setActiveTab,
  activeDialogueNpc,
  setActiveDialogueNpc,
  handleBraceDefense,
  climbStairsUpToOverworld,
  climbToPreviousDepth,
  advanceToNextDepth,
  descendToDungeonFirstFloor,
  handleGKeyInteract,
  makeMove,
  addLogMessage,
}: UseKeyboardControlsParams) {
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const handleKeyDownInstance = (e: KeyboardEvent) => {
    // 1. If typing in an input, textarea, or contenteditable element, ignore non-Escape input
    if (
      document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.getAttribute('contenteditable') === 'true')
    ) {
      if (e.key !== 'Escape') {
        return;
      }
      (document.activeElement as HTMLElement).blur();
    }

    const key = e.key.toLowerCase();

    // Handle Escape globally to cancel/close all modals, gumps, overlays, and trade windows
    if (e.key === 'Escape') {
      e.preventDefault();

      let hadModalOpen = false;

      if (activeTargetedScroll) {
        if (setActiveTargetedScroll) setActiveTargetedScroll(null);
        addLogMessage('Targeted scroll casting cancelled.', 'system');
        hadModalOpen = true;
      }

      if (unlawfulGuardTarget) {
        if (setUnlawfulGuardTarget) setUnlawfulGuardTarget(null);
        hadModalOpen = true;
      }

      if (activeLockpickingChestIndex !== null && activeLockpickingChestIndex !== undefined) {
        if (setActiveLockpickingChestIndex) setActiveLockpickingChestIndex(null);
        hadModalOpen = true;
      }

      if (activeScriptoriumScrollTemplateId !== null && activeScriptoriumScrollTemplateId !== undefined) {
        if (setActiveScriptoriumScrollTemplateId) setActiveScriptoriumScrollTemplateId(null);
        hadModalOpen = true;
      }

      if (isScriptoriumOpen) {
        if (setIsScriptoriumOpen) setIsScriptoriumOpen(false);
        hadModalOpen = true;
      }

      if (isFishingOpen) {
        if (setIsFishingOpen) setIsFishingOpen(false);
        hadModalOpen = true;
      }

      if (isLockpickingOpen) {
        if (setIsLockpickingOpen) setIsLockpickingOpen(false);
        hadModalOpen = true;
      }

      if (isHelpOpen) {
        setIsHelpOpen(false);
        hadModalOpen = true;
      }

      if (isGodPanelOpen) {
        setIsGodPanelOpen(false);
        hadModalOpen = true;
      }

      if (isGmPanelOpen) {
        setIsGmPanelOpen(false);
        hadModalOpen = true;
      }

      if (isBestiaryOpen) {
        setIsBestiaryOpen(false);
        hadModalOpen = true;
      }

      if (isWorldMapOpen && setIsWorldMapOpen) {
        setIsWorldMapOpen(false);
        hadModalOpen = true;
      }

      if (isWorldThreatOpen && setIsWorldThreatOpen) {
        setIsWorldThreatOpen(false);
        hadModalOpen = true;
      }

      if (isAudioSettingsOpen && setIsAudioSettingsOpen) {
        setIsAudioSettingsOpen(false);
        hadModalOpen = true;
      }

      if (isSleepOpen && setIsSleepOpen) {
        setIsSleepOpen(false);
        hadModalOpen = true;
      }

      if (isWeatherControlOpen && setIsWeatherControlOpen) {
        setIsWeatherControlOpen(false);
        hadModalOpen = true;
      }

      if (isPerfHudOpen && setIsPerfHudOpen) {
        setIsPerfHudOpen(false);
        performanceMonitor.setHudOpen(false);
        hadModalOpen = true;
      }

      if (activeRelicDraft) {
        if (setActiveRelicDraft) setActiveRelicDraft(null);
        hadModalOpen = true;
      }

      if (activeRecallScroll) {
        if (setActiveRecallScroll) setActiveRecallScroll(false);
        hadModalOpen = true;
      }

      if (activePoi) {
        if (setActivePoi) setActivePoi(null);
        hadModalOpen = true;
      }

      if (activeDrunkNpc) {
        if (setActiveDrunkNpc) setActiveDrunkNpc(null);
        hadModalOpen = true;
      }

      if (activeTravelerNpc) {
        if (setActiveTravelerNpc) setActiveTravelerNpc(null);
        hadModalOpen = true;
      }

      if (activeDialogueNpc) {
        if (setActiveDialogueNpc) setActiveDialogueNpc(null);
        hadModalOpen = true;
      }

      const gs = gameStateRef.current;
      const hasOpenGameStateModal =
        gs.activeQuestBoardOpen ||
        gs.activeFollowerIdForInspect ||
        gs.activeTradeNpcId ||
        gs.inspectingItem ||
        gs.inspectingSkill ||
        gs.houseDesigner ||
        gs.customHouseBuilder ||
        gs.npcRoutePlanner ||
        gs.structureCarver ||
        gs.historyBookOpen ||
        gs.poiInteraction ||
        gs.activeTravelerNpc;

      if (hasOpenGameStateModal) {
        hadModalOpen = true;
        if (setActiveDialogueNpc) setActiveDialogueNpc(null);
        setGameState((prev) => ({
          ...prev,
          activeQuestBoardOpen: false,
          activeFollowerIdForInspect: null,
          activeTradeNpcId: null,
          inspectingItem: null,
          inspectingSkill: null,
          houseDesigner: null,
          customHouseBuilder: null,
          npcRoutePlanner: null,
          structureCarver: null,
          historyBookOpen: false,
          poiInteraction: null,
          activeTravelerNpc: null,
        }));
      }

      // If no overlay/modal was active, but user is on a secondary tab, return to dungeon!
      if (!hadModalOpen && activeTab !== 'dungeon') {
        setActiveTab('dungeon');
      }

      return;
    }

    // If game is not playing, or game over, or victory, ignore keyboard inputs
    if (!isPlaying || isGameOver || isVictory) return;

    // If lockpicking or fishing minigame is active, they handle their own key states
    if (isLockpickingOpen || isFishingOpen) return;

    // 2. Shortcut keys to toggle panels (accessible anytime while playing)
    switch (key) {
      case 'f1':
        e.preventDefault();
        setIsHelpOpen((p) => !p);
        return;
      case 'f3':
        e.preventDefault();
        if (setIsPerfHudOpen) {
          setIsPerfHudOpen((p) => {
            const next = !p;
            performanceMonitor.setHudOpen(next);
            addLogMessage(`⚡ Performance HUD ${next ? 'Activated' : 'Dismissed'} [F3]`, 'system');
            return next;
          });
        } else {
          const next = performanceMonitor.toggleHud();
          addLogMessage(`⚡ Performance HUD ${next ? 'Activated' : 'Dismissed'} [F3]`, 'system');
        }
        return;
      case 'c':
        e.preventDefault();
        setActiveTab('inventory');
        return;
      case 'p':
        e.preventDefault();
        setIsGodPanelOpen((p) => !p);
        return;
      case 'o':
      case 'y':
        e.preventDefault();
        setIsGmPanelOpen((p) => !p);
        return;
      case 'h':
        e.preventDefault();
        setActiveTab((prev) => (prev === 'chronicles' ? 'dungeon' : 'chronicles'));
        return;
      case 'v':
      case 'k':
        e.preventDefault();
        setActiveTab((prev) => (prev === 'bestiary' ? 'dungeon' : 'bestiary'));
        return;
      case 'f8':
        e.preventDefault();
        {
          const res = hybridGraphicsEngine.cycleVisualMode();
          addLogMessage(`🎨 Graphics Mode switched to: ${res.label}`, 'system');
        }
        return;
      case 't':
        if (e.altKey) {
          e.preventDefault();
          const res = hybridGraphicsEngine.cycleVisualMode();
          addLogMessage(`🎨 Graphics Mode switched to: ${res.label}`, 'system');
          return;
        }
        break;
      case 'm':
        e.preventDefault();
        if (setIsWorldMapOpen) {
          setIsWorldMapOpen((p) => !p);
        }
        return;
    }

    // 3. Prevent movement or interaction commands if ANY overlay panel is open, or if the player is in another tab (Forge, Market, etc.)
    const isAnyOverlayOpen =
      isHelpOpen ||
      isGodPanelOpen ||
      isGmPanelOpen ||
      isBestiaryOpen ||
      Boolean(isWorldMapOpen);

    if (isAnyOverlayOpen || activeTab !== 'dungeon') {
      return;
    }

    // Prevent browser default scroll for key inputs on active game screen
    if (
      [
        'arrowup',
        'arrowdown',
        'arrowleft',
        'arrowright',
        ' ',
        'w',
        's',
        'a',
        'd',
        'pageup',
        'pagedown',
        'home',
        'end',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
      ].includes(key)
    ) {
      e.preventDefault();
    }

    const currentGS = gameStateRef.current;

    // Core actions and movement (supporting WASD, Arrows, Top-row Numbers, and Numpad keys with NumLock ON/OFF)
    switch (key) {
      case 'b':
        e.preventDefault();
        handleBraceDefense();
        break;
      case '<':
        e.preventDefault();
        (() => {
          const px = currentGS.playerX;
          const py = currentGS.playerY;
          const currentTile = currentGS.map[py][px];
          if (currentTile === TileType.StairsUp) {
            if (currentGS.playerStats.depth === 1) {
              climbStairsUpToOverworld();
            } else {
              climbToPreviousDepth();
            }
          } else {
            addLogMessage('🪜 You need to stand on Stairs Up (<) to climb out / up.', 'system');
          }
        })();
        break;
      case '>':
        e.preventDefault();
        (() => {
          const px = currentGS.playerX;
          const py = currentGS.playerY;
          const currentTile = currentGS.map[py][px];
          if (currentTile === TileType.StairsDown) {
            advanceToNextDepth();
          } else if (currentTile === TileType.DungeonEntrance) {
            descendToDungeonFirstFloor();
          } else {
            addLogMessage('🪜 You need to stand on Stairs Down (>) or Dungeon Entrance to descend.', 'system');
          }
        })();
        break;
      case 'g':
        e.preventDefault();
        handleGKeyInteract();
        break;

      // Up / Orthogonal North
      case 'arrowup':
      case 'w':
      case '8':
        makeMove(0, -1);
        break;

      // Down / Orthogonal South
      case 'arrowdown':
      case 's':
      case '2':
        makeMove(0, 1);
        break;

      // Left / Orthogonal West
      case 'arrowleft':
      case 'a':
      case '4':
        makeMove(-1, 0);
        break;

      // Right / Orthogonal East
      case 'arrowright':
      case 'd':
      case '6':
        makeMove(1, 0);
        break;

      // Wait / Idle turn
      case ' ':
      case '.':
      case '5':
        makeMove(0, 0);
        break;

      // Up-Left / Diagonal North-West
      case '7':
      case 'home':
        makeMove(-1, -1);
        break;

      // Up-Right / Diagonal North-East
      case '9':
      case 'pageup':
        makeMove(1, -1);
        break;

      // Down-Left / Diagonal South-West
      case '1':
      case 'end':
        makeMove(-1, 1);
        break;

      // Down-Right / Diagonal South-East
      case '3':
      case 'pagedown':
        makeMove(1, 1);
        break;
    }
  };

  handleKeyDownRef.current = handleKeyDownInstance;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (handleKeyDownRef.current) {
        handleKeyDownRef.current(e);
      }
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);
}
