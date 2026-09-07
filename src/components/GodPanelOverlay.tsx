import React from 'react';
import {
  X,
  Zap,
  Palette,
  Home,
  Sliders,
  Hammer,
  Clock,
  Activity,
  Maximize2,
  Code,
  ShieldAlert,
  Skull,
  History,
  Grid,
  Dice5
} from 'lucide-react';
import { GameState } from '../types';
import { playSound } from '../utils/audio';
import { useGodPanelState, DESIGNER_LEGEND } from '../hooks/god/useGodPanelState';
import townTemplates from '../data/townTemplates.json';

import { GodStatEditor } from './god/GodStatEditor';
import { GodWorldEditor } from './god/GodWorldEditor';
import { GodItemSpawner } from './god/GodItemSpawner';
import { GodEntitySpawner } from './god/GodEntitySpawner';
import { GodCaravanManager } from './god/GodCaravanManager';
import { GodWeatherScarEditor } from './god/GodWeatherScarEditor';
import { GodTeleportWarpPanel } from './god/GodTeleportWarpPanel';
import { GodStorytellerPanel } from './god/GodStorytellerPanel';
import { GodHouseDesigner } from './god/GodHouseDesigner';
import { GodNpcRoutePlanner } from './god/GodNpcRoutePlanner';
import { GodStructureCarver } from './god/GodStructureCarver';
import { GodEnemyBlueprintEditor } from './god/GodEnemyBlueprintEditor';
import { GodReplaySimulator } from './god/GodReplaySimulator';
import { GodCheatsTab } from './god/GodCheatsTab';
import { GodAdminEditor } from './god/GodAdminEditor';
import { GodSmoketestTab } from './god/GodSmoketestTab';
import { GodBestiaryTab } from './god/GodBestiaryTab';
import { GodJSONDataTab } from './god/GodJSONDataTab';
import { GodArenaTab } from './god/GodArenaTab';
import { GodReplayTab } from './god/GodReplayTab';
import { GodItemCreatorTab } from './god/GodItemCreatorTab';
import { GodAdminEditorTab } from './god/GodAdminEditorTab';
import { GodDungeonEditor } from './god/GodDungeonEditor';
import { GodModdingTab } from './god/GodModdingTab';
import { GodMinigamesTab } from './god/GodMinigamesTab';
import { TilesetTesterTab } from './god/TilesetTesterTab';

export { DESIGNER_LEGEND };

export const PALETTE_TILES = [
  { char: '#', name: 'Wall 🧱', color: '#475569', desc: 'Solid wall bounds' },
  { char: '.', name: 'Floor 🪵', color: '#1e293b', desc: 'Walkable floor tile' },
  { char: 'D', name: 'Door 🚪', color: '#b45309', desc: 'Wood walkway door' },
  { char: 'B', name: 'Bed 🛌', color: '#0d9488', desc: 'Comfortable sleeping bed' },
  { char: 'C', name: 'Chair 🪑', color: '#451a03', desc: 'Sitting stool' },
  { char: 'T', name: 'Table 🪵', color: '#78350f', desc: 'Wooden table' },
  { char: 'f', name: 'Campfire 🔥', color: '#ea580c', desc: 'Illuminating fire source' },
  { char: 'F', name: 'Fireplace 🔥', color: '#b91c1c', desc: 'Brick-built fireplace' },
  { char: 'S', name: 'Sign 🪧', color: '#78350f', desc: 'Wooden pointer sign' },
  { char: 'G', name: 'Grass 🌱', color: '#15803d', desc: 'Green grass tile' },
  { char: 'W', name: 'Water 💧', color: '#1d4ed8', desc: 'Impassable pool water' },
  { char: 'E', name: 'Entrance 🌀', color: '#6d28d9', desc: 'Mystical dungeon entryway' },
  { char: 't', name: 'Tree 🌲', color: '#166534', desc: 'Impassable green tree' },
  { char: 'P', name: 'Pine Tree 🌲', color: '#064e3b', desc: 'Dense needle pine tree' },
  { char: 'Y', name: 'Birch Tree 🌳', color: '#022c22', desc: 'Light pale bark tree' },
  { char: 'p', name: 'Path 🪨', color: '#64748b', desc: 'Stone path flooring' },
  { char: 'w', name: 'Window 🪟', color: '#38bdf8', desc: 'Glass frame window wall' },
  { char: 'b', name: 'Bush 🍓', color: '#047857', desc: 'Berry harvestable bush' },
  { char: 'o', name: 'Torch 🕯️', color: '#f59e0b', desc: 'Wall-mounted flame light' },
  { char: 'A', name: 'Anvil ⚒️', color: '#64748b', desc: 'Blacksmithing forging anvil' },
  { char: 'K', name: 'Bookshelf 📚', color: '#b45309', desc: 'Leather-bound research library' },
  { char: 'H', name: 'Counter 🪵', color: '#92400e', desc: 'Shopkeeper trade desk' },
  { char: 'M', name: 'Stool 🪵', color: '#78350f', desc: 'Bar seating stool' },
  { char: 'u', name: 'Drunkard 🍺', color: '#f59e0b', desc: 'Tavern drunk NPC' },
  { char: 'N', name: 'Townsfolk 🧑', color: '#38bdf8', desc: 'Peaceful settlement civilian' },
  { char: 'g', name: 'Guard 🛡️', color: '#f97316', desc: 'Ironclad town sentry' }
];

export interface GodPanelOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  onRegenerateCurrentLocation?: () => void;
  onTriggerLockpicking?: () => void;
  onTriggerFishing?: () => void;
  onTriggerScriptorium?: (scrollTemplateId?: string) => void;
  isAutoplayActive?: boolean;
  setIsAutoplayActive?: (active: boolean) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

function GodPanelOverlayComponent({
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
}: GodPanelOverlayProps) {
  const godState = useGodPanelState({
    gameState,
    setGameState,
    onClose,
    onRegenerateCurrentLocation,
    onTriggerLockpicking,
    onTriggerFishing,
    onTriggerScriptorium,
    isAutoplayActive,
    setIsAutoplayActive,
    addLogMessage
  });

  const {
    activeTab,
    setActiveTab,
    isMinimized,
    setIsMinimized,
    jsonError,
    setJsonError,
    jsonSuccess,
    triggerSuccessLog,
    designerWidth,
    designerHeight,
    designerId,
    setDesignerId,
    designerName,
    setDesignerName,
    designerDescription,
    setDesignerDescription,
    designerEmoji,
    setDesignerEmoji,
    designerPaintChar,
    setDesignerPaintChar,
    designerGrid,
    customX,
    setCustomX,
    customY,
    setCustomY,
    clearDesignerGrid,
    surroundDesignerWithWalls,
    handleLoadPresetToDesigner,
    adjustDesignerGridDimensions,
    paintCell,
    handleSaveCustomDesignerStructure,
    handlePlaceDesignerStructure,
    handleDownloadBlueprintJson,
    handleCopyBlueprintJson,
    handleCopyAsTsConstant,
    handleImportFile,
    playerAtkMult,
    setPlayerAtkMult,
    enemyHpMult,
    setEnemyHpMult,
    enemyAtkMultState,
    setEnemyAtkMultState,
    goldMult,
    setGoldMult,
    xpMult,
    setXpMult,
    godModeActive,
    setGodModeActive,
    deathAuraActive,
    setDeathAuraActive,
    bypassWeightLimit,
    setBypassWeightLimit,
    customBaseMaxWeight,
    setCustomBaseMaxWeight,
    updateArenaValue,
    handleResetArenaSettings,
    handleHealPlayer,
    handleGoldBounty,
    handleGrantMaterials,
    handleGrantLevelBounty,
    handleMaxUpgradeEquipped,
    handleWipeEnemies,
    handleRevealFullMap,
    handleRevealWholeWorldMap,
    handleExportWorldMapPng,
    handleToggleInvinciblePlayer,
    handleSpawnDecorCluster,
    handleResetLevelDecor,
    handleFastForwardTime,
    handlePurgeExhaustion,
    selectedPresetId,
    setSelectedPresetId,
    handlePlaceStructure,
    customEnemiesState,
    selectedEnemyIndex,
    selectEnemyTemplate,
    createNewEnemyTemplate,
    deleteEnemyTemplate,
    saveEnemyTemplate,
    handleResetEnemies,
    handleApplyEnemiesJson,
    formType,
    setFormType,
    formName,
    setFormName,
    formChar,
    setFormChar,
    formColor,
    setFormColor,
    formBaseHp,
    setFormBaseHp,
    formBaseAtk,
    setFormBaseAtk,
    formBaseDef,
    setFormBaseDef,
    formRange,
    setFormRange,
    formSpeed,
    setFormSpeed,
    enemiesJsonText,
    setEnemiesJsonText,
    handleSpawnEnemy,
    housesJsonText,
    setHousesJsonText,
    selectedLayoutIndex,
    handleSelectTownLayout,
    handleApplyHousesJson,
    handleResetHouses,
    structuresJsonText,
    setStructuresJsonText,
    handleResetStructures,
    handleApplyStructuresJson,
    selectedSimNpcId,
    setSelectedSimNpcId,
    simHour,
    setSimHour,
    simWeather,
    setSimWeather,
    isSmokeTesting,
    runAutomatedSmokeTest,
    smokeTestLogs,
    setSmokeTestLogs,
    currentTestStep,
    setCurrentTestStep,
    replayPayload,
    setReplayPayload,
    currentReplayIdx,
    setCurrentReplayIdx,
    replayIsPlaying,
    setReplayIsPlaying,
    replaySpeed,
    setReplaySpeed,
    replayError,
    setReplayError,
    pastedLogs,
    setPastedLogs,
    TeleportToChunk,
    TeleportToEmptyArena,
    TeleportToDungeon,
    TeleportToDungeonEntranceOverworld,
    handleSetWeatherBiome
  } = godState;

  // Render minimized dock widget if in Replay mode
  if (isMinimized && activeTab === 'replay' && replayPayload) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border-2 border-emerald-500 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-sm w-full animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  replayIsPlaying ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  replayIsPlaying ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="text-xs font-bold text-slate-100">
              REPLAY DOCK • Turn {replayPayload.snapshots[currentReplayIdx]?.state?.turnsCount ?? currentReplayIdx}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(false)}
              className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-600/80 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
              title="Expand full Developer Overlay panel"
            >
              <Maximize2 className="w-3 h-3" />
              <span>EXPAND</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 cursor-pointer"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setCurrentReplayIdx(Math.max(0, currentReplayIdx - 1));
              setReplayIsPlaying(false);
            }}
            disabled={currentReplayIdx === 0}
            className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] rounded disabled:opacity-30 cursor-pointer"
          >
            ◀ Step
          </button>
          <button
            onClick={() => setReplayIsPlaying(!replayIsPlaying)}
            className={`py-1 px-3 font-bold text-[11px] rounded cursor-pointer ${
              replayIsPlaying ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {replayIsPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>
          <button
            onClick={() => {
              setCurrentReplayIdx(Math.min(replayPayload.snapshots.length - 1, currentReplayIdx + 1));
              setReplayIsPlaying(false);
            }}
            disabled={currentReplayIdx === replayPayload.snapshots.length - 1}
            className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] rounded disabled:opacity-30 cursor-pointer"
          >
            Step ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pt-10 sm:pt-6 pb-4 sm:pb-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-red-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[86vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-red-500/30 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-black tracking-wider text-red-400 uppercase truncate">
              SOVEREIGN DEVELOPER CONSOLE & GOD SUITE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {jsonSuccess && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2 text-xs text-emerald-300 font-mono shrink-0">
            {jsonSuccess}
          </div>
        )}
        {jsonError && (
          <div className="bg-red-950/90 border-b border-red-500/50 px-4 py-2 text-xs text-red-300 font-mono shrink-0">
            {jsonError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-nowrap border-b border-slate-800 bg-slate-950/60 text-xs overflow-x-auto shrink-0 scrollbar-thin">
          {[
            { id: 'sovereign', label: 'Cheats', icon: Zap, color: 'text-yellow-400' },
            { id: 'tileset_tester', label: 'Tileset Studio', icon: Palette, color: 'text-amber-400' },
            { id: 'minigames', label: 'Minigames', icon: Dice5, color: 'text-amber-400' },
            { id: 'arena', label: 'Arena Tweaker', icon: Sliders, color: 'text-blue-400' },
            { id: 'structures', label: 'Structure Placer', icon: Hammer, color: 'text-green-400' },
            { id: 'house_editor', label: 'House Painter', icon: Home, color: 'text-emerald-400' },
            { id: 'struct_json', label: 'Struct JSON', icon: Code, color: 'text-emerald-400' },
            { id: 'enemies', label: 'Enemy Defs', icon: Skull, color: 'text-indigo-400' },
            { id: 'town', label: 'Town JSON', icon: Home, color: 'text-purple-400' },
            { id: 'npc_planner', label: 'NPC Routes', icon: Clock, color: 'text-amber-400' },
            { id: 'creator', label: 'Item Lab', icon: Activity, color: 'text-rose-400' },
            { id: 'admin_editor', label: 'Admin Edit', icon: Grid, color: 'text-cyan-400' },
            { id: 'smoketest', label: 'Smoketest', icon: Activity, color: 'text-teal-400' },
            { id: 'replay', label: 'Replay Sim', icon: History, color: 'text-amber-400' },
            { id: 'bestiary_test', label: 'Bestiary', icon: Skull, color: 'text-orange-400' },
            { id: 'dungeon_editor', label: 'Dungeon Floors', icon: Grid, color: 'text-purple-400' },
            { id: 'modding_api', label: 'Modding API', icon: Code, color: 'text-pink-400' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setJsonError(null);
                }}
                className={`py-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-red-500 text-red-300 bg-slate-800/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Views */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/50">
          {/* Tileset & Sprite Studio Tester */}
          {activeTab === 'tileset_tester' && (
            <TilesetTesterTab
              gameState={gameState}
              setGameState={setGameState}
              addLogMessage={addLogMessage}
            />
          )}

          {/* Sovereign Cheats & World Warps */}
          {activeTab === 'sovereign' && (
            <div className="space-y-6">
              <GodCheatsTab
                gameState={gameState}
                handleHealPlayer={handleHealPlayer}
                handleGoldBounty={handleGoldBounty}
                handleGrantMaterials={handleGrantMaterials}
                handleGrantLevelBounty={handleGrantLevelBounty}
                handleMaxUpgradeEquipped={handleMaxUpgradeEquipped}
                handleWipeEnemies={handleWipeEnemies}
                handleRevealFullMap={handleRevealFullMap}
                handleRevealWholeWorldMap={handleRevealWholeWorldMap}
                handleExportWorldMapPng={handleExportWorldMapPng}
                handleToggleInvinciblePlayer={handleToggleInvinciblePlayer}
                godModeActive={godModeActive}
                TeleportToEmptyArena={TeleportToEmptyArena}
                handleSpawnDecorCluster={handleSpawnDecorCluster}
                handleResetLevelDecor={handleResetLevelDecor}
                handleFastForwardTime={handleFastForwardTime}
                handlePurgeExhaustion={handlePurgeExhaustion}
                onClose={onClose}
              />
              <GodTeleportWarpPanel
                TeleportToChunk={TeleportToChunk}
                TeleportToEmptyArena={TeleportToEmptyArena}
                TeleportToDungeon={TeleportToDungeon}
                TeleportToDungeonEntranceOverworld={TeleportToDungeonEntranceOverworld}
                gameState={gameState}
              />
              <GodWeatherScarEditor
                gameState={gameState}
                setGameState={setGameState}
                triggerSuccessLog={triggerSuccessLog}
                playSound={playSound}
                handleSetWeatherBiome={handleSetWeatherBiome}
              />
              <GodStorytellerPanel
                gameState={gameState}
                setGameState={setGameState}
                triggerSuccessLog={triggerSuccessLog}
              />
            </div>
          )}

          {/* Minigames Testbed */}
          {activeTab === 'minigames' && (
            <GodMinigamesTab
              gameState={gameState}
              setGameState={setGameState}
              onTriggerLockpicking={onTriggerLockpicking}
              onTriggerFishing={onTriggerFishing}
              onTriggerScriptorium={onTriggerScriptorium}
              addLogMessage={addLogMessage}
              triggerSuccessLog={triggerSuccessLog}
            />
          )}

          {/* Arena Tweaker */}
          {activeTab === 'arena' && (
            <GodArenaTab
              handleResetArenaSettings={handleResetArenaSettings}
              TeleportToDungeonEntranceOverworld={TeleportToDungeonEntranceOverworld}
              TeleportToDungeon={TeleportToDungeon}
              TeleportToEmptyArena={TeleportToEmptyArena}
              godModeActive={godModeActive}
              setGodModeActive={setGodModeActive}
              deathAuraActive={deathAuraActive}
              setDeathAuraActive={setDeathAuraActive}
              bypassWeightLimit={bypassWeightLimit}
              setBypassWeightLimit={setBypassWeightLimit}
              customBaseMaxWeight={customBaseMaxWeight}
              setCustomBaseMaxWeight={setCustomBaseMaxWeight}
              playerAtkMult={playerAtkMult}
              setPlayerAtkMult={setPlayerAtkMult}
              enemyHpMult={enemyHpMult}
              setEnemyHpMult={setEnemyHpMult}
              enemyAtkMultState={enemyAtkMultState}
              setEnemyAtkMultState={setEnemyAtkMultState}
              goldMult={goldMult}
              setGoldMult={setGoldMult}
              xpMult={xpMult}
              setXpMult={setXpMult}
              updateArenaValue={updateArenaValue}
            />
          )}

          {/* Structure Carver */}
          {activeTab === 'structures' && (
            <GodStructureCarver
              gameState={gameState}
              selectedPresetId={selectedPresetId}
              setSelectedPresetId={setSelectedPresetId}
              customX={customX}
              setCustomX={setCustomX}
              customY={customY}
              setCustomY={setCustomY}
              handlePlaceStructure={handlePlaceStructure}
              triggerSuccessLog={triggerSuccessLog}
            />
          )}

          {/* House Designer */}
          {activeTab === 'house_editor' && (
            <GodHouseDesigner
              gameState={gameState}
              designerWidth={designerWidth}
              designerHeight={designerHeight}
              designerId={designerId}
              setDesignerId={setDesignerId}
              designerName={designerName}
              setDesignerName={setDesignerName}
              designerEmoji={designerEmoji}
              setDesignerEmoji={setDesignerEmoji}
              designerDescription={designerDescription}
              setDesignerDescription={setDesignerDescription}
              designerPaintChar={designerPaintChar}
              setDesignerPaintChar={setDesignerPaintChar}
              designerGrid={designerGrid}
              customX={customX}
              setCustomX={setCustomX}
              customY={customY}
              setCustomY={setCustomY}
              clearDesignerGrid={clearDesignerGrid}
              surroundDesignerWithWalls={surroundDesignerWithWalls}
              handleLoadPresetToDesigner={handleLoadPresetToDesigner}
              adjustDesignerGridDimensions={adjustDesignerGridDimensions}
              paintCell={paintCell}
              handleSaveCustomDesignerStructure={handleSaveCustomDesignerStructure}
              handlePlaceDesignerStructure={handlePlaceDesignerStructure}
              handleDownloadBlueprintJson={handleDownloadBlueprintJson}
              handleCopyBlueprintJson={handleCopyBlueprintJson}
              handleCopyAsTsConstant={handleCopyAsTsConstant}
              handleImportFile={handleImportFile}
              triggerSuccessLog={triggerSuccessLog}
            />
          )}

          {/* Structure JSON */}
          {activeTab === 'struct_json' && (
            <GodJSONDataTab
              structuresJsonText={structuresJsonText}
              setStructuresJsonText={setStructuresJsonText}
              handleResetStructures={handleResetStructures}
              handleApplyStructuresJson={handleApplyStructuresJson}
            />
          )}

          {/* Enemy Blueprints */}
          {activeTab === 'enemies' && (
            <GodEntitySpawner
              customEnemiesState={customEnemiesState}
              selectedEnemyIndex={selectedEnemyIndex}
              selectEnemyTemplate={selectEnemyTemplate}
              createNewEnemyTemplate={createNewEnemyTemplate}
              deleteEnemyTemplate={deleteEnemyTemplate}
              saveEnemyTemplate={saveEnemyTemplate}
              handleResetEnemies={handleResetEnemies}
              handleApplyEnemiesJson={handleApplyEnemiesJson}
              formType={formType}
              setFormType={setFormType}
              formName={formName}
              setFormName={setFormName}
              formChar={formChar}
              setFormChar={setFormChar}
              formColor={formColor}
              setFormColor={setFormColor}
              formBaseHp={formBaseHp}
              setFormBaseHp={setFormBaseHp}
              formBaseAtk={formBaseAtk}
              setFormBaseAtk={setFormBaseAtk}
              formBaseDef={formBaseDef}
              setFormBaseDef={setFormBaseDef}
              formRange={formRange}
              setFormRange={setFormRange}
              formSpeed={formSpeed}
              setFormSpeed={setFormSpeed}
              enemiesJsonText={enemiesJsonText}
              setEnemiesJsonText={setEnemiesJsonText}
              gameState={gameState}
              setGameState={setGameState}
              triggerSuccessLog={triggerSuccessLog}
              playSound={playSound}
            />
          )}

          {/* Town Buildings */}
          {activeTab === 'town' && (
            <GodCaravanManager
              handleResetHouses={handleResetHouses}
              townTemplates={townTemplates}
              selectedLayoutIndex={selectedLayoutIndex}
              handleSelectTownLayout={handleSelectTownLayout}
              housesJsonText={housesJsonText}
              setHousesJsonText={setHousesJsonText}
              handleApplyHousesJson={handleApplyHousesJson}
            />
          )}

          {/* NPC Route Planner */}
          {activeTab === 'npc_planner' && (
            <GodNpcRoutePlanner
              gameState={gameState}
              setGameState={setGameState}
              selectedSimNpcId={selectedSimNpcId}
              setSelectedSimNpcId={setSelectedSimNpcId}
              simHour={simHour}
              setSimHour={setSimHour}
              simWeather={simWeather}
              setSimWeather={setSimWeather}
              onRegenerateCurrentLocation={onRegenerateCurrentLocation}
              triggerSuccessLog={triggerSuccessLog}
            />
          )}

          {/* Smoke Testing */}
          {activeTab === 'smoketest' && (
            <GodSmoketestTab
              isSmokeTesting={isSmokeTesting}
              runAutomatedSmokeTest={runAutomatedSmokeTest}
              smokeTestLogs={smokeTestLogs}
              setSmokeTestLogs={setSmokeTestLogs}
              currentTestStep={currentTestStep}
              setCurrentTestStep={setCurrentTestStep}
            />
          )}

          {/* Replay Simulation */}
          {activeTab === 'replay' && (
            <GodReplayTab
              replayError={replayError}
              setReplayError={setReplayError}
              replayPayload={replayPayload}
              setReplayPayload={setReplayPayload}
              pastedLogs={pastedLogs}
              setPastedLogs={setPastedLogs}
              currentReplayIdx={currentReplayIdx}
              setCurrentReplayIdx={setCurrentReplayIdx}
              replayIsPlaying={replayIsPlaying}
              setReplayIsPlaying={setReplayIsPlaying}
              replaySpeed={replaySpeed}
              setReplaySpeed={setReplaySpeed}
              setIsMinimized={setIsMinimized}
            />
          )}

          {/* Bestiary Tab */}
          {activeTab === 'bestiary_test' && (
            <GodBestiaryTab
              setGameState={setGameState}
              triggerSuccessLog={triggerSuccessLog}
              isAutoplayActive={isAutoplayActive}
              setIsAutoplayActive={setIsAutoplayActive}
            />
          )}

          {/* Item / Follower Lab */}
          {activeTab === 'creator' && (
            <GodItemCreatorTab
              gameState={gameState}
              setGameState={setGameState}
              triggerSuccessLog={triggerSuccessLog}
              setJsonError={setJsonError}
            />
          )}

          {/* Admin Editor */}
          {activeTab === 'admin_editor' && (
            <GodAdminEditorTab
              gameState={gameState}
              setGameState={setGameState}
              triggerSuccessLog={triggerSuccessLog}
            />
          )}

          {/* Dungeon Editor */}
          {activeTab === 'dungeon_editor' && (
            <GodDungeonEditor
              gameState={gameState}
              setGameState={setGameState}
              onClose={onClose}
              triggerSuccessLog={triggerSuccessLog}
              playSound={playSound}
            />
          )}

          {/* Runtime Modding */}
          {activeTab === 'modding_api' && (
            <GodModdingTab
              triggerSuccessLog={triggerSuccessLog}
              playSound={playSound}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-950 text-center text-[10px] text-slate-500">
          GOD Command Module Interface v3.0 • Decoupled Antigravity Sandbox
        </div>
      </div>
    </div>
  );
}

export const GodPanelOverlay = React.memo(GodPanelOverlayComponent);
export default GodPanelOverlay;
