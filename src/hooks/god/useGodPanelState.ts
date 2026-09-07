import React, { useState, useEffect } from 'react';
import { GameState } from '../../types';
import {
  UseGodPanelStateProps,
  GodActiveTab,
  DESIGNER_LEGEND,
  MATERIAL_LABELS,
  CATALYST_LABELS
} from './types';
import { useGodDesignerState } from './useGodDesignerState';
import { useGodBlueprintState } from './useGodBlueprintState';
import { useGodArenaState } from './useGodArenaState';
import { useGodSovereignActions } from './useGodSovereignActions';
import { useGodReplayAndSmokeTest } from './useGodReplayAndSmokeTest';

export { DESIGNER_LEGEND, MATERIAL_LABELS, CATALYST_LABELS };
export type { UseGodPanelStateProps, GodActiveTab };

export function useGodPanelState({
  gameState,
  setGameState,
  onClose,
  onRegenerateCurrentLocation,
  onTriggerLockpicking,
  onTriggerFishing,
  onTriggerScriptorium,
  isAutoplayActive = false,
  setIsAutoplayActive,
  addLogMessage
}: UseGodPanelStateProps) {
  const [activeTab, setActiveTab] = useState<GodActiveTab>('sovereign');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  const triggerSuccessLog = (msg: string) => {
    setJsonSuccess(msg);
    setTimeout(() => setJsonSuccess(null), 3000);
  };

  // NPC Route Planner & Day-Cycle Simulator states
  const [selectedSimNpcId, setSelectedSimNpcId] = useState<string | null>(null);
  const [simHour, setSimHour] = useState<number>(12);
  const [simWeather, setSimWeather] = useState<'clear' | 'rainy' | 'snowy'>('clear');

  useEffect(() => {
    if (gameState) {
      setSimHour(Math.floor(gameState.gameTime / 60));
      const w =
        gameState.weather === 'rainy' || gameState.weather === 'snowy' ? gameState.weather : 'clear';
      setSimWeather(w as any);
    }
  }, [gameState?.gameTime, gameState?.weather]);

  // Modular Sub-Engines
  const designer = useGodDesignerState(gameState, setGameState, triggerSuccessLog, setJsonError);
  const blueprint = useGodBlueprintState(triggerSuccessLog, setJsonError);
  const arena = useGodArenaState(triggerSuccessLog);
  const sovereign = useGodSovereignActions(
    gameState,
    setGameState,
    arena.godModeActive,
    arena.setGodModeActive,
    triggerSuccessLog,
    setJsonError,
    onClose
  );
  const replayAndSmoke = useGodReplayAndSmokeTest(
    gameState,
    setGameState,
    addLogMessage,
    triggerSuccessLog
  );

  return {
    activeTab,
    setActiveTab,
    isMinimized,
    setIsMinimized,
    jsonError,
    setJsonError,
    jsonSuccess,
    triggerSuccessLog,
    // Designer
    designerWidth: designer.designerWidth,
    designerHeight: designer.designerHeight,
    designerId: designer.designerId,
    setDesignerId: designer.setDesignerId,
    designerName: designer.designerName,
    setDesignerName: designer.setDesignerName,
    designerDescription: designer.designerDescription,
    setDesignerDescription: designer.setDesignerDescription,
    designerEmoji: designer.designerEmoji,
    setDesignerEmoji: designer.setDesignerEmoji,
    designerPaintChar: designer.designerPaintChar,
    setDesignerPaintChar: designer.setDesignerPaintChar,
    designerGrid: designer.designerGrid,
    customX: designer.customX,
    setCustomX: designer.setCustomX,
    customY: designer.customY,
    setCustomY: designer.setCustomY,
    clearDesignerGrid: designer.clearDesignerGrid,
    surroundDesignerWithWalls: designer.surroundDesignerWithWalls,
    handleLoadPresetToDesigner: designer.handleLoadPresetToDesigner,
    adjustDesignerGridDimensions: designer.adjustDesignerGridDimensions,
    paintCell: designer.paintCell,
    handleSaveCustomDesignerStructure: designer.handleSaveCustomDesignerStructure,
    handlePlaceDesignerStructure: designer.handlePlaceDesignerStructure,
    handleDownloadBlueprintJson: designer.handleDownloadBlueprintJson,
    handleCopyBlueprintJson: designer.handleCopyBlueprintJson,
    handleCopyAsTsConstant: designer.handleCopyAsTsConstant,
    handleImportFile: designer.handleImportFile,
    // Arena
    playerAtkMult: arena.playerAtkMult,
    setPlayerAtkMult: arena.setPlayerAtkMult,
    enemyHpMult: arena.enemyHpMult,
    setEnemyHpMult: arena.setEnemyHpMult,
    enemyAtkMultState: arena.enemyAtkMultState,
    setEnemyAtkMultState: arena.setEnemyAtkMultState,
    goldMult: arena.goldMult,
    setGoldMult: arena.setGoldMult,
    xpMult: arena.xpMult,
    setXpMult: arena.setXpMult,
    godModeActive: arena.godModeActive,
    setGodModeActive: arena.setGodModeActive,
    deathAuraActive: arena.deathAuraActive,
    setDeathAuraActive: arena.setDeathAuraActive,
    bypassWeightLimit: arena.bypassWeightLimit,
    setBypassWeightLimit: arena.setBypassWeightLimit,
    customBaseMaxWeight: arena.customBaseMaxWeight,
    setCustomBaseMaxWeight: arena.setCustomBaseMaxWeight,
    updateArenaValue: arena.updateArenaValue,
    handleResetArenaSettings: arena.handleResetArenaSettings,
    // Sovereign Cheats
    handleHealPlayer: sovereign.handleHealPlayer,
    handleGoldBounty: sovereign.handleGoldBounty,
    handleGrantMaterials: sovereign.handleGrantMaterials,
    handleGrantLevelBounty: sovereign.handleGrantLevelBounty,
    handleMaxUpgradeEquipped: sovereign.handleMaxUpgradeEquipped,
    handleWipeEnemies: sovereign.handleWipeEnemies,
    handleRevealFullMap: sovereign.handleRevealFullMap,
    handleRevealWholeWorldMap: sovereign.handleRevealWholeWorldMap,
    handleExportWorldMapPng: sovereign.handleExportWorldMapPng,
    handleToggleInvinciblePlayer: sovereign.handleToggleInvinciblePlayer,
    handleSpawnDecorCluster: sovereign.handleSpawnDecorCluster,
    handleResetLevelDecor: sovereign.handleResetLevelDecor,
    handleFastForwardTime: sovereign.handleFastForwardTime,
    handlePurgeExhaustion: sovereign.handlePurgeExhaustion,
    // Structure Placer
    selectedPresetId: designer.selectedPresetId,
    setSelectedPresetId: designer.setSelectedPresetId,
    handlePlaceStructure: (offsetX = 0, offsetY = 0, label = 'Custom Position') =>
      sovereign.handlePlaceStructure(designer.selectedPresetId, designer.customX, designer.customY, offsetX, offsetY, label),
    // Blueprint / Enemies
    customEnemiesState: blueprint.customEnemiesState,
    selectedEnemyIndex: blueprint.selectedEnemyIndex,
    selectEnemyTemplate: blueprint.selectEnemyTemplate,
    createNewEnemyTemplate: blueprint.createNewEnemyTemplate,
    deleteEnemyTemplate: blueprint.deleteEnemyTemplate,
    saveEnemyTemplate: blueprint.saveEnemyTemplate,
    handleResetEnemies: blueprint.handleResetEnemies,
    handleApplyEnemiesJson: blueprint.handleApplyEnemiesJson,
    formType: blueprint.formType,
    setFormType: blueprint.setFormType,
    formName: blueprint.formName,
    setFormName: blueprint.setFormName,
    formChar: blueprint.formChar,
    setFormChar: blueprint.setFormChar,
    formColor: blueprint.formColor,
    setFormColor: blueprint.setFormColor,
    formBaseHp: blueprint.formBaseHp,
    setFormBaseHp: blueprint.setFormBaseHp,
    formBaseAtk: blueprint.formBaseAtk,
    setFormBaseAtk: blueprint.setFormBaseAtk,
    formBaseDef: blueprint.formBaseDef,
    setFormBaseDef: blueprint.setFormBaseDef,
    formRange: blueprint.formRange,
    setFormRange: blueprint.setFormRange,
    formSpeed: blueprint.formSpeed,
    setFormSpeed: blueprint.setFormSpeed,
    enemiesJsonText: blueprint.enemiesJsonText,
    setEnemiesJsonText: blueprint.setEnemiesJsonText,
    handleSpawnEnemy: sovereign.handleSpawnEnemy,
    // Housing / Town
    housesJsonText: blueprint.housesJsonText,
    setHousesJsonText: blueprint.setHousesJsonText,
    selectedLayoutIndex: blueprint.selectedLayoutIndex,
    handleSelectTownLayout: blueprint.handleSelectTownLayout,
    handleApplyHousesJson: blueprint.handleApplyHousesJson,
    handleResetHouses: blueprint.handleResetHouses,
    // Structures JSON
    structuresJsonText: designer.structuresJsonText,
    setStructuresJsonText: designer.setStructuresJsonText,
    handleResetStructures: designer.handleResetStructures,
    handleApplyStructuresJson: designer.handleApplyStructuresJson,
    // NPC Planner
    selectedSimNpcId,
    setSelectedSimNpcId,
    simHour,
    setSimHour,
    simWeather,
    setSimWeather,
    // Smoke Test
    isSmokeTesting: replayAndSmoke.isSmokeTesting,
    runAutomatedSmokeTest: replayAndSmoke.runAutomatedSmokeTest,
    smokeTestLogs: replayAndSmoke.smokeTestLogs,
    setSmokeTestLogs: replayAndSmoke.setSmokeTestLogs,
    currentTestStep: replayAndSmoke.currentTestStep,
    setCurrentTestStep: replayAndSmoke.setCurrentTestStep,
    // Replay
    replayPayload: replayAndSmoke.replayPayload,
    setReplayPayload: replayAndSmoke.setReplayPayload,
    currentReplayIdx: replayAndSmoke.currentReplayIdx,
    setCurrentReplayIdx: replayAndSmoke.setCurrentReplayIdx,
    replayIsPlaying: replayAndSmoke.replayIsPlaying,
    setReplayIsPlaying: replayAndSmoke.setReplayIsPlaying,
    replaySpeed: replayAndSmoke.replaySpeed,
    setReplaySpeed: replayAndSmoke.setReplaySpeed,
    replayError: replayAndSmoke.replayError,
    setReplayError: replayAndSmoke.setReplayError,
    pastedLogs: replayAndSmoke.pastedLogs,
    setPastedLogs: replayAndSmoke.setPastedLogs,
    // Teleport
    TeleportToChunk: sovereign.TeleportToChunk,
    TeleportToEmptyArena: sovereign.TeleportToEmptyArena,
    TeleportToDungeon: sovereign.TeleportToDungeon,
    TeleportToDungeonEntranceOverworld: sovereign.TeleportToDungeonEntranceOverworld,
    // Weather
    handleSetWeatherBiome: sovereign.handleSetWeatherBiome
  };
}
