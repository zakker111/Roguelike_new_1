/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TileType, Enemy, Trap, Chest, GameState, PlayerStats, GameLogMessage, WeaponBaseType, EnemyState, EnemyType, EquipmentItem, LootPile, NPC, OverworldChunk, Follower, DungeonProp, DungeonLevelState, GlyphScribingResult } from './types';
import { generateLevel, spawnFollowersOnLevelLoadByReset, generateDungeonProps } from './utils/dungeon';
import { computeFOV } from './utils/ai';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from './utils/itemsData';
import { playSound, getAudioSettings, toggleAudioMute } from './utils/audio';
import { generateOverworldChunk, formatGameTime, setWorldSeed, getDeterministicTownName, hasTownAtChunk, prng, getCurrentWorldSeed, getOrganicBiome } from './utils/overworld';
import { getCurrentWeight, getMaxWeight, checkWeightCapacity, getItemWeight, getMaterialUnitWeight } from './utils/itemWeight';
import { evaluateScarAcquisition, getEffectiveStats } from './utils/scars';
import { getBiomePriceMultiplier } from './utils/tradeEconomy';
import GameCanvas from './components/GameCanvas';
import gameConfig from './data/gameConfig.json';

import { useAmbientAudio } from './hooks/useAmbientAudio';
import { isPlayerIndoors } from './utils/buildingAudio';
import { AppModalRouter } from './components/modals/AppModalRouter';
import { initCustomRegistries } from './utils/customRegistryInit';
import { regenerateCurrentLocation } from './utils/locationRegenerator';
import { useEquipmentHandlers } from './hooks/useEquipmentHandlers';
import { useSpellcasting } from './hooks/useSpellcasting';
import { useWorldInteraction } from './hooks/useWorldInteraction';
import { useCraftingEngine } from './hooks/useCraftingEngine';
import { useAppHotkeys } from './hooks/useAppHotkeys';
import { useWorldEventHandlers } from './hooks/useWorldEventHandlers';
import { useSaveLoad } from './hooks/useSaveLoad';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useNpcInteraction } from './hooks/useNpcInteraction';
import { usePoiAndWilderness } from './hooks/usePoiAndWilderness';
import { usePlayerAttack } from './hooks/usePlayerAttack';
import { useEnemyAI } from './hooks/useEnemyAI';
import { useOverworldEvents } from './hooks/useOverworldEvents';
import { useTradeEconomy } from './hooks/useTradeEconomy';
import { useQuestsAndGuild } from './hooks/useQuestsAndGuild';
import { useCaravanTravel } from './hooks/useCaravanTravel';
import { useTownServices } from './hooks/useTownServices';
import { getSiegeCombatants } from './utils/siegeUtils';
import { handleDecorInteraction } from './utils/decorEngine';
import { StartScreen } from './components/screens/StartScreen';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { VictoryScreen } from './components/screens/VictoryScreen';
import { GameMainViewport } from './components/views/GameMainViewport';
import { SPELL_SCROLLS } from './utils/spellScrolls';
import { AppHeaderBar } from './components/AppHeaderBar';
import { PoiType } from './components/PoiInteractionOverlay';
import MainAppLayout from './components/MainAppLayout';
import { WEATHER_EFFECTS, getValidWeatherForBiome } from './utils/weatherEngine';
import { STARTING_WEAPON, STARTING_ARMOR } from './utils/spellsAndEquipment';
import { consumeItemFromInventory } from './utils/scrollUtils';
import { SanctumRelic } from './utils/relics';
import { performanceMonitor } from './utils/performanceMonitor';
import { initStorytellerEventListeners } from './utils/storyteller';
import { DEFAULT_QUESTS } from './utils/questData';
import { getMerchantConfig } from './utils/shopData';
import { appendBoundedLogs } from './utils/logBuffer';
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  findNearestSafePlayerTile,
  hasEquippedTrait,
  isLunarBlessingActive,
  getEffectiveAttribute,
  getCharismaDiscountMultiplier,
  generateRandomLootGear
} from './utils/gameUtils';
import {
  useShopAndTradeHandlers,
  useQuestAndGuildHandlers,
  useShrineAndChestHandlers,
  useConsumablesAndCatalysts,
  useGKeyInteraction,
  useAppModalState,
  useAppTurnCoordinator,
} from './hooks/app';
import { createNewGameRun } from './utils/gameStateFactory';
import { exportAndDownloadGameLogs } from './utils/logExporter';

// Initialize global registries for custom modifiable components
initCustomRegistries();

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [activeTab, setActiveTab] = useState<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles'>('dungeon');

  useEffect(() => {
    if (activeTab === 'chaos') {
      setActiveTab('dungeon');
      setIsGmPanelOpen(true);
    }
  }, [activeTab]);
  const [bagSubTab, setBagSubTab] = useState<'allies' | 'gear' | 'food' | 'resources'>('allies');
  const [dungeonBagTab, setDungeonBagTab] = useState<'allies' | 'gear' | 'food' | 'mats'>('allies');
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Automatic mobile check & listener
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [forceLayoutMode, setForceLayoutMode] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const handleCheckMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isNarrow = window.innerWidth < 1024;
      const isMob = isMobileUA || (isTouch && isNarrow) || isNarrow;
      setIsMobileDevice(isMob);
      setForceLayoutMode(isMob ? 'mobile' : 'desktop');
    };

    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

  useEffect(() => {
    const handleGlobalButtonPress = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button');
      if (button) {
        playSound('click');
      }
    };
    window.addEventListener('pointerdown', handleGlobalButtonPress);
    return () => window.removeEventListener('pointerdown', handleGlobalButtonPress);
  }, []);

  // Initialize reactive Storyteller Event Bus listeners
  useEffect(() => {
    const unsubscribeStoryteller = initStorytellerEventListeners();
    return () => unsubscribeStoryteller();
  }, []);

  const activeMobileView = forceLayoutMode === 'mobile';

  // Overlay & modal states managed by modular sub-hook
  const modalState = useAppModalState();
  const {
    isAudioSettingsOpen, setIsAudioSettingsOpen,
    isHelpOpen, setIsHelpOpen,
    isWorldThreatOpen, setIsWorldThreatOpen,
    isWorldMapOpen, setIsWorldMapOpen,
    isGodPanelOpen, setIsGodPanelOpen,
    isGmPanelOpen, setIsGmPanelOpen,
    isSleepOpen, setIsSleepOpen,
    isPerfHudOpen, setIsPerfHudOpen,
    isBestiaryOpen, setIsBestiaryOpen,
    isFishingOpen, setIsFishingOpen,
    isLockpickingOpen, setIsLockpickingOpen,
    isScriptoriumOpen, setIsScriptoriumOpen,
    activeScriptoriumScrollTemplateId, setActiveScriptoriumScrollTemplateId,
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
  } = modalState;
  const [isMuted, setIsMuted] = useState(() => getAudioSettings().isAudioMuted);

  // Core App Game State
  const [gameState, setGameState] = useState<GameState>(() => createNewGameRun(12345));

  const gameStateRef = useRef<GameState>(gameState);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const scrollTabBar = (direction: 'left' | 'right') => {
    if (tabBarRef.current) {
      const scrollAmount = 200;
      tabBarRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Hook for world background events, cat traits, and playthrough session snapshots
  const { allSessionLogsRef, allSessionStateSnapshotsRef, resetSession } = useWorldEventHandlers({
    gameState,
    setGameState,
    isPlaying,
    formatGameTime: (m) => {
      const res = formatGameTime(m);
      return `${res.timeStr} (${res.period})`;
    },
  });

  const handleRegenerateCurrentLocation = () => {
    setGameState((prev) => ({
      ...prev,
      ...regenerateCurrentLocation(prev),
    }));
  };

  // Initialize a fresh new application run
  const handleStartNewGame = () => {
    resetSession();
    playSound('loot');
    const freshState = createNewGameRun();
    setGameState(freshState);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
    setActiveTab('dungeon');
  };

  const handleDownloadLogs = () => {
    exportAndDownloadGameLogs({
      gameState,
      sessionLogs: allSessionLogsRef.current,
      sessionSnapshots: allSessionStateSnapshotsRef.current,
    });
  };

  // Command logs helper
  const addLogMessage = (text: string, type: GameLogMessage['type'] = 'info') => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text,
        type,
        timestamp: timeStr,
      };
      
      return {
        ...prev,
        logs: appendBoundedLogs(prev.logs, newMsg, 200),
      };
    });
  };

  const { executeEnemiesTurn } = useEnemyAI({
    gameStateRef,
    setGameState,
    addLogMessage,
    playSound,
    hasEquippedTrait,
  });

  // Shrines, lockpicking, and chest rewards custom hook
  const {
    handleInteractWithDungeonShrine,
    handleConsumeLockpick,
    handleOpenChest,
  } = useShrineAndChestHandlers({
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    executeEnemiesTurn,
  });

  // Stair movement and floor transition custom hook
  const {
    climbStairsUpToOverworld,
    climbToPreviousDepth,
    advanceToNextDepth,
    descendToDungeonFirstFloor,
  } = usePlayerMovement({
    gameStateRef,
    setGameState,
    addLogMessage,
    playSound,
    executeEnemiesTurn: (px, py) => executeEnemiesTurn(px, py),
    setActiveTab,
    hasEquippedTrait,
    spawnFollowersOnLevelLoadByReset,
    generateDungeonProps,
  });

  const {
    handleOverworldStairsTransition,
    handleResourceHarvest,
    handleOpenDoor,
  } = useWorldInteraction({
    setGameState,
    addLogMessage,
    executeEnemiesTurn: (px, py) => executeEnemiesTurn(px, py),
    setIsGameOver,
    setShakeTrigger,
  });

  const {
    handleCraftComplete,
    handlePlaceCampfire,
    handlePlaceAnvil,
    handlePlaceBedroll,
    handlePlaceFieldTent,
    handleCookMeat,
    handleCookPrimeMeat,
    handleRestCampfire,
    handleCookRecipe,
    handleBrewPotion,
    handleCookFish,
    handleCraftFishingPole,
    handleCraftLockpicks,
    handleCraftHatchet,
    handleCraftPickaxe,
    handleCraftRecallScroll,
    handleCatchFish,
    handleFailFish,
    handleRepairItem,
    handleRepairAll,
    handleMutateItem,
    handleUpgradeItem,
  } = useCraftingEngine({
    setGameState,
    addLogMessage,
    setActiveTab,
    gameState,
  });

  const {
    handleOpenNpcTrade,
    interactWithNpc,
    interactWithFollower,
  } = useNpcInteraction({
    gameState,
    setGameState,
    addLogMessage,
    playSound,
    setActiveTab,
    setActiveDialogueNpc,
    setActiveTravelerNpc,
    setActiveDrunkNpc,
    spawnFollowersOnLevelLoadByReset,
  });

  const {
    handleConfirmSleep,
    handleDrunkNpcEffects,
    handleTravelerAttack,
    handleTravelerTrade,
    handlePoiChoiceSelected,
    handleAttuneWaystone,
    handleWaystoneFastTravel,
    handleChallengeBiomeGuardian,
  } = usePoiAndWilderness({
    gameState,
    setGameState,
    addLogMessage,
    playSound,
    setActiveTab,
    activeTravelerNpc,
    setActiveTravelerNpc,
    activePoi,
    setActivePoi,
    setIsSleepOpen,
    setActiveRelicDraft,
    executeEnemiesTurn: (px, py) => executeEnemiesTurn(px, py),
    gameConfig,
  });

  // Spellcasting & Arcanum Engine Hook
  const {
    selectedSpellId,
    setSelectedSpellId,
    activeSpell,
    handleCraftSpellScroll,
    executeSpellScrollCast,
  } = useSpellcasting({
    setGameState,
    addLogMessage,
  });

  const handleTriggerScriptorium = (scrollTemplateId?: string) => {
    setActiveScriptoriumScrollTemplateId(scrollTemplateId || 'scroll_fireball');
    setIsScriptoriumOpen(true);
  };

  const handleScriptoriumSuccess = (result: GlyphScribingResult) => {
    const template = SPELL_SCROLLS.find((t) => t.id === activeScriptoriumScrollTemplateId || t.id.includes(activeScriptoriumScrollTemplateId || '')) || SPELL_SCROLLS[0];
    const isMasterwork = result.isMasterwork || result.outcome === 'flawless';

    // Deduct recipe materials and catalysts
    const nextMats = { ...gameState.inventoryMaterials };
    const nextCats = { ...gameState.inventoryCatalysts };

    if (template.recipe) {
      if (template.recipe.materials) {
        Object.entries(template.recipe.materials).forEach(([matId, req]) => {
          nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - req.required);
        });
      }
      if (template.recipe.catalysts) {
        Object.entries(template.recipe.catalysts).forEach(([catId, req]) => {
          nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - req.required);
        });
      }
    } else {
      const parchmentKey = (nextMats['mat_parchment'] || 0) > 0 ? 'mat_parchment' : 'mat_leather';
      nextMats[parchmentKey] = Math.max(0, (nextMats[parchmentKey] || 0) - 1);
    }

    const newScroll: EquipmentItem = {
      id: `scroll_${template.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: isMasterwork ? `Masterwork ${template.name} 🌟` : `${template.name} 📜`,
      type: 'scroll' as any,
      subType: 'Scroll' as any,
      defense: 0,
      damage: isMasterwork ? Math.round(template.baseDamage * 1.3) : template.baseDamage,
      critChance: isMasterwork ? 0.25 : 0.1,
      range: 6,
      color: isMasterwork ? '#f59e0b' : '#38bdf8',
      description: isMasterwork
        ? `[MASTERWORK INKED] ${template.description} (0 MP cast cost, +30% potency, crafted with precision in the Arcane Scriptorium!)`
        : template.description,
      value: isMasterwork ? 300 : 150,
      durability: 100,
      maxDurability: 100,
      isMasterwork: isMasterwork,
      scrollTemplateId: template.id,
    };

    playSound('spell');

    setGameState((prev) => ({
      ...prev,
      inventoryMaterials: nextMats,
      inventoryCatalysts: nextCats,
      equipmentInventory: [...prev.equipmentInventory, newScroll],
      logs: appendBoundedLogs(prev.logs, {
        id: `script_${Date.now()}`,
        text: isMasterwork
          ? `🌟 [ARCANUM MASTERWORK]: You have flawlessly inscribed ${newScroll.name}! (${result.accuracyScore}% accuracy, 0 MP cost, +30% spell power)`
          : `📜 [ARCANUM INKED]: You successfully inscribed ${newScroll.name} onto enchanted parchment!`,
        type: 'loot' as const,
        timestamp: formatGameTime(prev.gameTime).timeStr,
      }, 200),
    }));

    window.dispatchEvent(
      new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: isMasterwork ? `🌟 Masterwork Scroll!` : `+1 Spell Scroll 📜`,
          type: 'heal',
        },
      })
    );
  };

  const handleScriptoriumFailure = () => {
    addLogMessage(`💥 [ARCANUM FIZZLE]: The glyph destabilized and dissolved into ash. Your parchment was lost to the ether.`, 'danger');
    const parchmentKey =
      gameState.inventoryMaterials['mat_parchment'] !== undefined &&
      gameState.inventoryMaterials['mat_parchment'] > 0
        ? 'mat_parchment'
        : 'mat_leather';
    setGameState((prev) => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        [parchmentKey]: Math.max(0, (prev.inventoryMaterials[parchmentKey] || 0) - 1),
      },
    }));
  };

  const {
    performPlayerAttack,
    getCombatFlavorText,
  } = usePlayerAttack({
    gameState,
    setGameState,
    addLogMessage,
    playSound,
    selectedSpellId,
    interactWithFollower,
    setUnlawfulGuardTarget,
    setActiveRelicDraft,
    gameConfig,
  });

  // Turn Coordinator: step sequencing, player movement, enemy AI turns, brace defense, autoplay, and tile clicks
  const {
    makeMove,
    handleBraceDefense,
    handleTileClick,
    handleConfirmUnlawfulAttack,
  } = useAppTurnCoordinator({
    isPlaying,
    isGameOver,
    setIsGameOver,
    isVictory,
    gameState,
    gameStateRef,
    setGameState,
    playSound,
    addLogMessage,
    hasEquippedTrait,
    setShakeTrigger,
    setActiveTab,
    executeEnemiesTurn,
    handleOverworldStairsTransition,
    handleResourceHarvest,
    handleOpenDoor,
    descendToDungeonFirstFloor,
    advanceToNextDepth,
    interactWithNpc,
    performPlayerAttack,
    handleOpenChest,
    interactWithFollower,
    executeSpellScrollCast,
    modalState,
  });

  const { handleGKeyInteract } = useGKeyInteraction({
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    descendToDungeonFirstFloor,
    advanceToNextDepth,
    climbStairsUpToOverworld,
    climbToPreviousDepth,
    setActivePoi,
    setIsSleepOpen,
    interactWithNpc,
    handleInteractWithDungeonShrine,
  });

  // Global Hotkeys & Keyboard Controller Hook
  useAppHotkeys({
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
    activeRecallScroll: !!activeRecallScroll,
    setActiveRecallScroll: setActiveRecallScroll as any,
    activeTargetedScroll,
    setActiveTargetedScroll,
    isHelpOpen,
    setIsHelpOpen,
    isPerfHudOpen,
    setIsPerfHudOpen,
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
  });

  // Persistent Save & Load engine hook
  const { saveGame, loadGame, exportSaveToFile } = useSaveLoad({
    gameStateRef,
    setGameState,
    addLogMessage,
  });

  // Auto-load existing save on startup if available
  useEffect(() => {
    const raw = localStorage.getItem('shadow_over_oakhaven_save_v1');
    if (raw) {
      try {
        loadGame('shadow_over_oakhaven_save_v1');
      } catch (err) {
        console.warn('Auto-load failed:', err);
      }
    }
  }, []);

  // Equipped Gear & Inventory Handlers Hook
  const {
    handleEquipItem,
    handleUnequipArmor,
    handleUnequipHelmet,
    handleUnequipGloves,
    handleUnequipBoots,
    handleUnequipShield,
    handleUnequipAmulet,
    handleUnequipWeapon,
    handleDiscardItem,
    handleDiscardMaterial,
    handleDiscardCatalyst,
  } = useEquipmentHandlers({
    gameState,
    setGameState,
    addLogMessage,
    setActiveTargetedScroll,
    setActiveTab,
    setActiveRecallScroll,
  });

  // Domain Partitioned Custom Hooks
  const { tickTimeOfDay, triggerWeatherChange } = useOverworldEvents({
    setGameState,
    addLog: addLogMessage,
  });

  const { buyItemFromMerchant, sellItemToMerchant } = useTradeEconomy({
    setGameState,
    addLog: addLogMessage,
    playSound: (s) => playSound(s as any),
  });

  const { acceptGuildQuest, claimQuestReward } = useQuestsAndGuild({
    setGameState,
    addLog: addLogMessage,
    playSound: (s) => playSound(s as any),
  });

  const {
    handleStartCaravanTravel,
    handleAdvanceCaravanTravel,
    handleResolveCaravanEncounterOption,
    handleCompleteCaravanTravel,
  } = useCaravanTravel({
    setGameState,
    addLogMessage,
    playSound: (s) => playSound(s as any),
  });

  const {
    handleUpgradeBlacksmith,
    handleUpgradeApothecary,
    handleBuyRumor,
    handleTavernRest,
    handleHireMercenary,
  } = useTownServices({
    setGameState,
    addLogMessage,
    playSound: (s) => playSound(s as any),
  });

  const {
    handleAcceptQuest,
    handleTurnInQuest,
  } = useQuestAndGuildHandlers({
    gameState,
    setGameState,
  });

  // Trade/Sellers callbacks hook
  const {
    handleBuyEquipment,
    handleBuyResource,
    handleBuyEnchantedGear,
    handleRecallTeleport,
    handleSellEquipment,
    handleSellResource,
  } = useShopAndTradeHandlers({
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    activeRecallScroll,
    setActiveRecallScroll,
    levelWidth: LEVEL_WIDTH,
    levelHeight: LEVEL_HEIGHT,
  });


  // Consumables, Catalysts & Attributes hook
  const {
    handleShiftCatalyst,
    handleUnstableReactorSurge,
    handleEatMeat,
    handleAdjustAttribute,
  } = useConsumablesAndCatalysts({
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    levelWidth: LEVEL_WIDTH,
    levelHeight: LEVEL_HEIGHT,
  });

  // Reset counters
  const handleClearLogs = () => {
    setGameState((prev) => ({ ...prev, logs: [] }));
  };

  // Dynamic computed stats based on durability / broken state
  const isRightHandBroken = gameState.currentWeapon !== null && gameState.currentWeapon.durability !== undefined && gameState.currentWeapon.durability <= 0;
  const rightHandDamage = gameState.currentWeapon !== null
    ? (isRightHandBroken ? 1 : (gameState.currentWeapon.damage ?? 0))
    : 4;

  const isLeftHandBroken = gameState.equippedShield !== null && gameState.equippedShield.durability !== undefined && gameState.equippedShield.durability <= 0;
  const leftHandDamage = gameState.equippedShield !== null
    ? (isLeftHandBroken ? 0 : (gameState.equippedShield.damage ?? 0))
    : 0;


  let brokenArmorDefReduction = 0;
  const armorSlotsKeysStr = ['equippedArmor', 'equippedHelmet', 'equippedGloves', 'equippedBoots', 'equippedShield', 'equippedAmulet'] as const;
  armorSlotsKeysStr.forEach(slot => {
    const item = gameState[slot];
    if (item && item.durability !== undefined && item.durability <= 0) {
      brokenArmorDefReduction += item.defense;
    }
  });
  let activeEffectsDefBonus = 0;
  if (gameState.playerStats.activeEffects) {
    gameState.playerStats.activeEffects.forEach(eff => {
      if (eff.statModifiers?.def) activeEffectsDefBonus += eff.statModifiers.def;
    });
  }
  const effectivePlayerDef = Math.max(0, getEffectiveStats(gameState.playerStats).def - brokenArmorDefReduction + activeEffectsDefBonus);
  const effectiveMaxHp = isLunarBlessingActive(gameState, 'waxing_gibbous') ? getEffectiveStats(gameState.playerStats).maxHp + 15 : getEffectiveStats(gameState.playerStats).maxHp;

  useAmbientAudio(gameState);

  return (
    <MainAppLayout
      header={(
        <AppHeaderBar
          isPlaying={isPlaying}
          activeMobileView={activeMobileView}
          gameState={gameState}
          formatGameTime={formatGameTime}
          climbStairsUpToOverworld={climbStairsUpToOverworld}
          climbToPreviousDepth={climbToPreviousDepth}
          forceLayoutMode={forceLayoutMode}
          setForceLayoutMode={setForceLayoutMode}
          isMuted={isMuted}
          toggleAudioMute={toggleAudioMute}
          setIsMuted={setIsMuted}
          getAudioSettings={getAudioSettings}
          setIsAudioSettingsOpen={setIsAudioSettingsOpen}
          setIsHelpOpen={setIsHelpOpen}
          setIsWorldThreatOpen={setIsWorldThreatOpen}
          setIsWorldMapOpen={setIsWorldMapOpen}
          playSound={playSound}
          setActiveTab={setActiveTab}
          setIsGodPanelOpen={setIsGodPanelOpen}
          setIsGmPanelOpen={setIsGmPanelOpen}
          setIsGameOver={setIsGameOver}
        />
      )}
      overlays={(
        <AppModalRouter
          {...modalState}
          gameState={gameState}
          setGameState={setGameState}
          addLogMessage={addLogMessage}
          handleRegenerateCurrentLocation={handleRegenerateCurrentLocation}
          handleConfirmSleep={handleConfirmSleep}
          handleCatchFish={handleCatchFish}
          handleFailFish={handleFailFish}
          handleOpenChest={handleOpenChest}
          handleConsumeLockpick={handleConsumeLockpick}
          handlePoiChoiceSelected={handlePoiChoiceSelected}
          handleDrunkNpcEffects={handleDrunkNpcEffects}
          handleTravelerTrade={handleTravelerTrade}
          handleTravelerAttack={handleTravelerAttack}
          handleAcceptQuest={handleAcceptQuest}
          handleTurnInQuest={handleTurnInQuest}
          handleConfirmUnlawfulAttack={handleConfirmUnlawfulAttack}
          handleRecallTeleport={handleRecallTeleport}
          onAttuneWaystone={handleAttuneWaystone}
          onWaystoneFastTravel={handleWaystoneFastTravel}
          onChallengeGuardian={handleChallengeBiomeGuardian}
          handleResolveCaravanEncounterOption={handleResolveCaravanEncounterOption}
          handleAdvanceCaravanTravel={handleAdvanceCaravanTravel}
          handleCompleteCaravanTravel={handleCompleteCaravanTravel}
          handleScriptoriumSuccess={handleScriptoriumSuccess}
          handleScriptoriumFailure={handleScriptoriumFailure}
          onTriggerScriptorium={handleTriggerScriptorium}
          onOpenNpcTrade={handleOpenNpcTrade}
        />
      )}
    >
      {!isPlaying ? (
        <StartScreen onStartNewGame={handleStartNewGame} />
      ) : isGameOver ? (
        <GameOverScreen
          gameState={gameState}
          onDownloadLogs={handleDownloadLogs}
          onStartNewGame={handleStartNewGame}
        />
      ) : isVictory ? (
        <VictoryScreen
          gameState={gameState}
          onDownloadLogs={handleDownloadLogs}
          onStartNewGame={handleStartNewGame}
        />
      ) : (
        <GameMainViewport
          activeMobileView={activeMobileView}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          gameState={gameState}
          setGameState={setGameState}
          playSound={playSound}
          scrollTabBar={scrollTabBar}
          effectiveMaxHp={effectiveMaxHp}
          effectivePlayerDef={effectivePlayerDef}
          brokenArmorDefReduction={brokenArmorDefReduction}
          selectedSpellId={selectedSpellId}
          setSelectedSpellId={setSelectedSpellId}
          handleUnequipArmor={handleUnequipArmor}
          handleUnequipWeapon={handleUnequipWeapon}
          handleEquipItem={handleEquipItem}
          setActivePoi={setActivePoi}
          handleInteractWithDungeonShrine={handleInteractWithDungeonShrine}
          setIsFishingOpen={setIsFishingOpen}
          setIsWorldMapOpen={setIsWorldMapOpen}
          handleTileClick={handleTileClick}
          shakeTrigger={shakeTrigger}
          activeTargetedScroll={activeTargetedScroll}
          setActiveTargetedScroll={setActiveTargetedScroll}
          handleClearLogs={handleClearLogs}
          handleDownloadLogs={handleDownloadLogs}
          makeMove={makeMove}
          handleGKeyInteract={handleGKeyInteract}
          handleBraceDefense={handleBraceDefense}
          handleCraftComplete={handleCraftComplete}
          handlePlaceCampfire={handlePlaceCampfire}
          handlePlaceAnvil={handlePlaceAnvil}
          handlePlaceBedroll={handlePlaceBedroll}
          handlePlaceFieldTent={handlePlaceFieldTent}
          handleCookMeat={handleCookMeat}
          handleCookFish={handleCookFish}
          handleCookPrimeMeat={handleCookPrimeMeat}
          handleCraftFishingPole={handleCraftFishingPole}
          handleCraftLockpicks={handleCraftLockpicks}
          handleCraftHatchet={handleCraftHatchet}
          handleCraftPickaxe={handleCraftPickaxe}
          handleRestCampfire={handleRestCampfire}
          handleMutateItem={handleMutateItem}
          handleUpgradeItem={handleUpgradeItem}
          handleCraftRecallScroll={handleCraftRecallScroll}
          handleCraftSpellScroll={handleCraftSpellScroll}
          onTriggerScriptorium={handleTriggerScriptorium}
          handleCookRecipe={handleCookRecipe}
          handleBrewPotion={handleBrewPotion}
          handleUpgradeApothecary={handleUpgradeApothecary}
          handleEatMeat={handleEatMeat}
          handleDiscardItem={handleDiscardItem}
          handleDiscardMaterial={handleDiscardMaterial}
          handleDiscardCatalyst={handleDiscardCatalyst}
          handleShiftCatalyst={handleShiftCatalyst}
          handleUnstableReactorSurge={handleUnstableReactorSurge}
          handleUnequipHelmet={handleUnequipHelmet}
          handleUnequipBoots={handleUnequipBoots}
          handleUnequipShield={handleUnequipShield}
          handleUnequipGloves={handleUnequipGloves}
          handleUnequipAmulet={handleUnequipAmulet}
          handleAdjustAttribute={handleAdjustAttribute}
          handleStartCaravanTravel={handleStartCaravanTravel}
          handleRepairAll={handleRepairAll}
          handleRepairItem={handleRepairItem}
          handleUpgradeBlacksmith={handleUpgradeBlacksmith}
          handleBuyRumor={handleBuyRumor}
          handleTavernRest={handleTavernRest}
          handleHireMercenary={handleHireMercenary}
          handleBuyEnchantedGear={handleBuyEnchantedGear}
          handleBuyEquipment={handleBuyEquipment}
          handleBuyResource={handleBuyResource}
          handleSellEquipment={handleSellEquipment}
          handleSellResource={handleSellResource}
          addLogMessage={addLogMessage}
        />
      )}
    </MainAppLayout>
  );
}
