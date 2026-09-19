/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TileType, Enemy, Trap, Chest, GameState, PlayerStats, GameLogMessage, WeaponBaseType, EnemyState, EnemyType, EquipmentItem, LootPile, NPC, OverworldChunk, Follower, DungeonProp, DungeonLevelState, GlyphScribingResult } from './types';
import { generateLevel, spawnFollowersOnLevelLoadByReset, generateDungeonProps } from './utils/dungeon';
import { computeFOV, bresenhamLine } from './utils/ai';
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
import ModalRouter from './components/ModalRouter';
import { useEquipmentHandlers } from './hooks/useEquipmentHandlers';
import { useSpellcasting } from './hooks/useSpellcasting';
import { useWorldInteraction } from './hooks/useWorldInteraction';
import { useCraftingEngine } from './hooks/useCraftingEngine';
import { useAppHotkeys } from './hooks/useAppHotkeys';
import { useWorldEventHandlers } from './hooks/useWorldEventHandlers';
import { useSaveLoad } from './hooks/useSaveLoad';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useCombatEngine } from './hooks/useCombatEngine';
import { useNpcInteraction } from './hooks/useNpcInteraction';
import { usePoiAndWilderness } from './hooks/usePoiAndWilderness';
import { usePlayerAttack } from './hooks/usePlayerAttack';
import { useEnemyAI } from './hooks/useEnemyAI';
import { useOverworldEvents } from './hooks/useOverworldEvents';
import { useTradeEconomy } from './hooks/useTradeEconomy';
import { useQuestsAndGuild } from './hooks/useQuestsAndGuild';
import { useCaravanTravel } from './hooks/useCaravanTravel';
import { useTownServices } from './hooks/useTownServices';
import { useGameLoop } from './hooks/useGameLoop';
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
  useAutoplayAgent,
  useGKeyInteraction,
  usePlayerTurnMovement,
} from './hooks/app';
import { createNewGameRun } from './utils/gameStateFactory';
import { exportAndDownloadGameLogs } from './utils/logExporter';

// Initialize global registries for custom modifiable components
if (typeof window !== 'undefined') {
  if (!(window as any).customEnemies) {
    (window as any).customEnemies = [
      { type: 'Rat', name: "Giant Plague Rat", baseHp: 6, baseAtk: 1, baseDef: 0, range: 1, speed: 1.0, char: "r", color: "#a1a1aa" },
      { type: 'Goblin', name: "Scavenger Goblin", baseHp: 12, baseAtk: 2, baseDef: 1, range: 1, speed: 1.0, char: "g", color: "#eab308" },
      { type: 'Mage', name: "Skeleton Spellflinger", baseHp: 14, baseAtk: 4, baseDef: 0, range: 4, speed: 1.0, char: "S", color: "#60a5fa" },
      { type: 'Brute', name: "Orc Skullbreaker", baseHp: 30, baseAtk: 6, baseDef: 3, range: 1, speed: 1.3, char: "O", color: "#ea580c" },
      { type: 'Trapmaster', name: "Kobold Trapsmith", baseHp: 22, baseAtk: 4, baseDef: 2, range: 3, speed: 1.0, char: "K", color: "#22c55e" },
      { type: 'Dragon', name: "Sunder Ashwyrm Dragon", baseHp: 120, baseAtk: 11, baseDef: 6, range: 3, speed: 1.2, char: "🐉", color: "#ef4444" },
      { type: 'Hiisi', name: "Hiisi Forest Fiend", baseHp: 25, baseAtk: 5, baseDef: 2, range: 1, speed: 1.0, char: "👹", color: "#16a34a" },
      { type: 'Nakki', name: "Näkki Water Kelpie", baseHp: 22, baseAtk: 4, baseDef: 1, range: 2, speed: 0.9, char: "🧜", color: "#06b6d4" },
      { type: 'Otso', name: "Otso the Honey-Paw", baseHp: 180, baseAtk: 12, baseDef: 7, range: 1, speed: 1.1, char: "🐻", color: "#b45309" },
      { type: 'Louhi', name: "Louhi, Mistress of Pohjola", baseHp: 260, baseAtk: 15, baseDef: 10, range: 4, speed: 0.8, char: "🦅", color: "#c084fc" },
      { type: 'IkuTurso', name: "Iku-Turso Eternal Leviathan", baseHp: 200, baseAtk: 14, baseDef: 8, range: 2, speed: 1.0, char: "🦑", color: "#0ea5e9" },
      { type: 'Kalma', name: "Kalma Grave Goddess", baseHp: 90, baseAtk: 8, baseDef: 4, range: 3, speed: 0.9, char: "💀", color: "#a855f7" }
    ];
  }
  if (!(window as any).customHouses) {
    (window as any).customHouses = [
      { id: 'blacksmith', name: 'Blacksmith Shop', x: 4, y: 3, w: 8, h: 8 },
      { id: 'apothecary', name: 'Apothecary Shop', x: 37, y: 3, w: 8, h: 8 },
      { id: 'tavern', name: 'Tavern & Inn', x: 18, y: 3, w: 14, h: 8 },
      { id: 'villager1', name: 'Villager Cottage Left', x: 4, y: 19, w: 8, h: 8 },
      { id: 'villager2', name: 'Villager Cottage Right', x: 37, y: 19, w: 8, h: 8 },
      { id: 'barracks', name: 'Guard Barracks', x: 18, y: 20, w: 14, h: 7 }
    ];
  }
}

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

  const activeMobileView = forceLayoutMode === 'mobile';

  // Overlay states
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getAudioSettings().isAudioMuted);
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
  const [activeScriptoriumScrollTemplateId, setActiveScriptoriumScrollTemplateId] = useState<string | null>(null);
  const [isWeatherControlOpen, setIsWeatherControlOpen] = useState(false);
  const [activeLockpickingChestIndex, setActiveLockpickingChestIndex] = useState<number | null>(null);
  const [unlawfulGuardTarget, setUnlawfulGuardTarget] = useState<{ enemy: Enemy, index: number, pathPoints: any[] } | null>(null);
  const [activePoi, setActivePoi] = useState<PoiType | null>(null);
  const [activeDrunkNpc, setActiveDrunkNpc] = useState<NPC | null>(null);
  const [activeTravelerNpc, setActiveTravelerNpc] = useState<NPC | null>(null);
  const [activeDialogueNpc, setActiveDialogueNpc] = useState<NPC | null>(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [activeRelicDraft, setActiveRelicDraft] = useState<SanctumRelic[] | null>(null);
  const [activeRecallScroll, setActiveRecallScroll] = useState<EquipmentItem | null>(null);
  const [activeTargetedScroll, setActiveTargetedScroll] = useState<EquipmentItem | null>(null);

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

  // Cleanly handle player death to prevent React side-effect state update crashes
  useEffect(() => {
    if (isPlaying && !isGameOver && !isVictory && gameState.playerStats && gameState.playerStats.hp <= 0) {
      playSound('defeat');
      setIsGameOver(true);
    }
  }, [gameState.playerStats?.hp, isPlaying, isGameOver, isVictory]);


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
    if (gameState.isOverworld) {
      const updatedChunk = generateOverworldChunk(
        gameState.currentChunkX,
        gameState.currentChunkY,
        LEVEL_WIDTH,
        LEVEL_HEIGHT,
        gameState.spawnedCats,
        gameState.spawnedSeppo,
        gameState.playerStats,
        gameState.currentWeapon
      );
      setGameState((prev) => {
        // compute initial visibility mask around the player
        const visibleMask = computeFOV(prev.playerX, prev.playerY, updatedChunk.map, 6);
        const nextLogs = appendBoundedLogs(prev.logs, {
          id: `regen_${Date.now()}`,
          text: `⚡ SYSTEM: Live-regenerated Overworld Chunk (${prev.currentChunkX}, ${prev.currentChunkY}) using modified JSON configurations!`,
          type: 'system' as const,
          timestamp: 'GOD'
        }, 200);
        const nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
        updatedChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        const hasSeppo = updatedChunk.npcs.some(n => n.id === 'npc_seppo');
        return {
          ...prev,
          map: updatedChunk.map,
          npcs: updatedChunk.npcs,
          enemies: updatedChunk.enemies,
          chests: updatedChunk.chests,
          traps: updatedChunk.traps,
          discovered: visibleMask,
          visible: visibleMask,
          spawnedCats: nextSpawnedCats,
          spawnedSeppo: prev.spawnedSeppo || hasSeppo,
          overworldChunks: {
            ...prev.overworldChunks,
            [`${prev.currentChunkX},${prev.currentChunkY}`]: updatedChunk
          },
          logs: nextLogs
        };
      });
    } else {
      const newDungeon = generateLevel(LEVEL_WIDTH, LEVEL_HEIGHT, gameState.playerStats.depth, gameState.playerStats.turnsPlayed, gameState.playerStats.realTimeSeconds, gameState.playerStats, gameState.currentWeapon, gameState.defeatedEnemiesCount, gameState.clearedCamps?.length || 0);
      setGameState((prev) => {
        const visibleMask = computeFOV(newDungeon.playerX, newDungeon.playerY, newDungeon.map, 6);
        const nextLogs = appendBoundedLogs(prev.logs, {
          id: `regen_${Date.now()}`,
          text: `⚡ SYSTEM: Live-regenerated Dungeon Level ${prev.playerStats.depth} using modified JSON enemy templates!`,
          type: 'system' as const,
          timestamp: 'GOD'
        }, 200);
        return {
          ...prev,
          map: newDungeon.map,
          playerX: newDungeon.playerX,
          playerY: newDungeon.playerY,
          enemies: newDungeon.enemies,
          chests: newDungeon.chests,
          traps: newDungeon.traps,
          discovered: visibleMask,
          visible: visibleMask,
          logs: nextLogs
        };
      });
    }
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

  // Real-time difficulty ticking game loop hook
  useGameLoop({
    isPlaying,
    isGameOver,
    isVictory,
    setGameState,
  });

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

  const { makeMove } = usePlayerTurnMovement({
    isPlaying,
    isGameOver,
    isVictory,
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    executeEnemiesTurn,
    setIsGameOver,
    setShakeTrigger,
    setActiveTab,
    setActiveLockpickingChestIndex,
    setIsLockpickingOpen,
    setUnlawfulGuardTarget,
    handleOverworldStairsTransition,
    handleResourceHarvest,
    handleOpenDoor,
    descendToDungeonFirstFloor,
    advanceToNextDepth,
    interactWithNpc,
    performPlayerAttack,
    handleOpenChest,
    hasEquippedTrait,
  });


  // Callback when a tile is clicked on GameCanvas (allows moving or shooting)
  const handleTileClick = (tx: number, ty: number) => {
    // Manhattan click offset distance
    const dx = tx - gameState.playerX;
    const dy = ty - gameState.playerY;

    if (activeTargetedScroll) {
      const template = SPELL_SCROLLS.find(t => activeTargetedScroll.id.includes(t.id));
      const isMasterwork = activeTargetedScroll.isMasterwork || activeTargetedScroll.name?.includes('Masterwork');
      const requiredMp = isMasterwork ? 0 : (template ? template.mpCost : 20);

      if (gameState.playerStats.mp < requiredMp) {
        addLogMessage(`❌ Insufficient Mana! You need at least ${requiredMp} MP to channel the scroll.`, 'system');
        setActiveTargetedScroll(null);
        return;
      }

      const success = executeSpellScrollCast(tx, ty, gameState, activeTargetedScroll, requiredMp);
      if (success) {
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
      }
      return;
    }

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      // Normal adjacent standard move / strike
      makeMove(dx, dy);
    } else {
      // Ranged active combat click
      // e.g., if we hold a Staff, Spear or Bow, check if clicked coordinate intersects target range
      const weapon = gameState.currentWeapon || STARTING_WEAPON;
      const targetEnemyIdx = gameState.enemies.findIndex((e) => e.x === tx && e.y === ty);

      if (targetEnemyIdx !== -1) {
        const enemy = gameState.enemies[targetEnemyIdx];
        const distance = Math.floor(Math.sqrt(dx ** 2 + dy ** 2));

        if (distance <= weapon.range) {
          // Direct Line of Sight blocks check
          const bresenline = bresenhamLine(gameState.playerX, gameState.playerY, tx, ty);
          let obscured = false;
          
          for (let i = 1; i < bresenline.length - 1; i++) {
            const pt = bresenline[i];
            const tile = gameState.map[pt.y][pt.x];
            if (tile === TileType.Wall || tile === TileType.Door) {
              obscured = true;
              break;
            }
          }

          if (!obscured) {
            // If the target is a follower or companion, trigger friendly chat instead of attacking
            if (enemy.isFollower || (enemy.isCaptive && enemy.isFreed)) {
              interactWithFollower(enemy);
              return;
            }

            // If the target is a town guard and they are not yet hostile, trigger prompt!
            if (enemy.isTownGuard && !gameState.areGuardsHostile) {
              setUnlawfulGuardTarget({ enemy, index: targetEnemyIdx, pathPoints: bresenline });
              return;
            }
            // Shoot Ranged strike!
            const acted = performPlayerAttack(enemy, targetEnemyIdx, bresenline);
            if (acted) {
              executeEnemiesTurn(gameState.playerX, gameState.playerY);
            }
          } else {
            addLogMessage(`❌ Direct vision trajectory is obscured by wall barriers.`, 'system');
          }
        } else {
          addLogMessage(`❌ Enemy resides outside this weapon's active assault reach (${weapon.range} tiles).`, 'system');
        }
      } else {
        addLogMessage(`❌ Click Adjacent cells to walk. Distance is too great.`, 'system');
      }
    }
  };

  const handleConfirmUnlawfulAttack = () => {
    if (!unlawfulGuardTarget) return;
    const { enemy, index, pathPoints } = unlawfulGuardTarget;
    setUnlawfulGuardTarget(null);

    // Make town guards permanently hostile and log criminal offense
    setGameState(prev => {
      return {
        ...prev,
        areGuardsHostile: true,
        logs: appendBoundedLogs(prev.logs, {
          id: `unlawful_${Date.now()}`,
          text: `⚖️ [CRIMINAL OFFENSE]: You have assaulted a peacekeeper of the crown! Town guards are now hostile!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        }, 200)
      };
    });

    // Execute the unlawful assault
    const acted = performPlayerAttack(enemy, index, pathPoints);
    if (acted) {
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
    }
  };

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

  const { handleBraceDefense } = useCombatEngine({
    gameStateRef,
    setGameState,
    addLogMessage,
    playSound,
    makeMove,
  });

  useAutoplayAgent({
    isAutoplayActive,
    isPlaying,
    isGameOver,
    isVictory,
    gameState,
    setGameState,
    makeMove,
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

  // Market trade helper variables for correct role checks
  const activeNpcRole = gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.role;
  const isBlacksmith = activeNpcRole === 'blacksmith' || activeNpcRole === 'npc_blacksmith';
  const isMerchant = activeNpcRole === 'merchant' || activeNpcRole === 'npc_merchant' || activeNpcRole === 'traveler_hunter' || activeNpcRole === 'traveler_pilgrim';
  const isApothecary = activeNpcRole === 'apothecary' || activeNpcRole === 'npc_apothecary' || activeNpcRole === 'traveler_herbalist';
  const isTavernMaster = activeNpcRole === 'tavern_master';
  const isSeppo = activeNpcRole === 'merchant_seppo' || activeNpcRole === ('merchant_seppo' as any);

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
        <ModalRouter
          isHelpOpen={isHelpOpen}
          setIsHelpOpen={setIsHelpOpen}
          isWorldThreatOpen={isWorldThreatOpen}
          setIsWorldThreatOpen={setIsWorldThreatOpen}
          isWorldMapOpen={isWorldMapOpen}
          setIsWorldMapOpen={setIsWorldMapOpen}
          isPerfHudOpen={isPerfHudOpen}
          setIsPerfHudOpen={setIsPerfHudOpen}
          isGodPanelOpen={isGodPanelOpen}
          setIsGodPanelOpen={setIsGodPanelOpen}
          isGmPanelOpen={isGmPanelOpen}
          setIsGmPanelOpen={setIsGmPanelOpen}
          isSleepOpen={isSleepOpen}
          setIsSleepOpen={setIsSleepOpen}
          isBestiaryOpen={isBestiaryOpen}
          setIsBestiaryOpen={setIsBestiaryOpen}
          isFishingOpen={isFishingOpen}
          setIsFishingOpen={setIsFishingOpen}
          isLockpickingOpen={isLockpickingOpen}
          setIsLockpickingOpen={setIsLockpickingOpen}
          isScriptoriumOpen={isScriptoriumOpen}
          setIsScriptoriumOpen={setIsScriptoriumOpen}
          activeScriptoriumScrollTemplateId={activeScriptoriumScrollTemplateId}
          setActiveScriptoriumScrollTemplateId={setActiveScriptoriumScrollTemplateId}
          handleScriptoriumSuccess={handleScriptoriumSuccess}
          handleScriptoriumFailure={handleScriptoriumFailure}
          onTriggerScriptorium={handleTriggerScriptorium}
          activeLockpickingChestIndex={activeLockpickingChestIndex}
          setActiveLockpickingChestIndex={setActiveLockpickingChestIndex}
          activePoi={activePoi}
          setActivePoi={setActivePoi}
          activeDrunkNpc={activeDrunkNpc}
          setActiveDrunkNpc={setActiveDrunkNpc}
          activeTravelerNpc={activeTravelerNpc}
          setActiveTravelerNpc={setActiveTravelerNpc}
          activeDialogueNpc={activeDialogueNpc}
          setActiveDialogueNpc={setActiveDialogueNpc}
          onOpenNpcTrade={handleOpenNpcTrade}
          unlawfulGuardTarget={unlawfulGuardTarget}
          setUnlawfulGuardTarget={setUnlawfulGuardTarget}
          activeRelicDraft={activeRelicDraft}
          setActiveRelicDraft={setActiveRelicDraft}
          activeRecallScroll={activeRecallScroll}
          setActiveRecallScroll={setActiveRecallScroll}
          isAutoplayActive={isAutoplayActive}
          setIsAutoplayActive={setIsAutoplayActive}
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
          isAudioSettingsOpen={isAudioSettingsOpen}
          setIsAudioSettingsOpen={setIsAudioSettingsOpen}
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
