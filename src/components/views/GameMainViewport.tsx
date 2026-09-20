import React from 'react';
import { GameState, DungeonProp, EquipmentItem, TileType } from '../../types';
import { PoiType } from '../PoiInteractionOverlay';
import { GameCanvas } from '../GameCanvas';
import { GameLog } from '../GameLog';
import { CraftingPanel } from '../CraftingPanel';
import BestiaryOverlay from '../BestiaryOverlay';
import { UnifiedInventoryPanel } from '../UnifiedInventoryPanel';
import { TradeModal } from '../modals/TradeModal';
import GuildOverlay from '../GuildOverlay';
import HistoryBookOverlay from '../HistoryBookOverlay';
import { AppNavigationTabs } from '../AppNavigationTabs';
import { PlayerSidebarPanel } from '../panels/PlayerSidebarPanel';
import { MobileHudBar } from '../panels/MobileHudBar';
import { MobileCommandPad } from '../panels/MobileCommandPad';
import { WeatherForecastBanner } from '../panels/WeatherForecastBanner';
import { ViewportAlertBanners } from '../panels/ViewportAlertBanners';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';

export interface GameMainViewportProps {
  activeMobileView: boolean;
  activeTab: any;
  setActiveTab: (tab: any) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: string) => void;
  scrollTabBar: (direction: 'left' | 'right') => void;
  effectiveMaxHp: number;
  effectivePlayerDef: number;
  brokenArmorDefReduction: number;
  selectedSpellId: string;
  setSelectedSpellId: (spellId: string) => void;
  handleUnequipArmor: () => void;
  handleUnequipWeapon: () => void;
  handleEquipItem: (item: EquipmentItem) => void;
  setActivePoi: (poi: PoiType | null) => void;
  handleInteractWithDungeonShrine: (prop: DungeonProp) => void;
  setIsFishingOpen: (open: boolean) => void;
  setIsWorldMapOpen?: (open: boolean) => void;
  handleTileClick: (x: number, y: number) => void;
  shakeTrigger: number;
  activeTargetedScroll: any;
  setActiveTargetedScroll: (scroll: any) => void;
  handleClearLogs: () => void;
  handleDownloadLogs: () => void;
  makeMove: (dx: number, dy: number) => void;
  handleGKeyInteract: () => void;
  handleBraceDefense: () => void;
  handleCraftComplete: any;
  handlePlaceCampfire: any;
  handlePlaceAnvil: any;
  handlePlaceBedroll?: any;
  handlePlaceFieldTent?: any;
  handleCookMeat: any;
  handleCookFish: any;
  handleCookPrimeMeat: any;
  handleCraftFishingPole: any;
  handleCraftLockpicks: any;
  handleCraftHatchet: any;
  handleCraftPickaxe: any;
  handleRestCampfire: any;
  handleMutateItem: any;
  handleUpgradeItem: any;
  handleCraftRecallScroll: any;
  handleCraftSpellScroll: any;
  onTriggerScriptorium?: (templateId: string) => void;
  handleCookRecipe: any;
  handleBrewPotion: any;
  handleUpgradeApothecary: any;
  handleEatMeat: any;
  handleDiscardItem: any;
  handleDiscardMaterial: any;
  handleDiscardCatalyst: any;
  handleShiftCatalyst: any;
  handleUnstableReactorSurge: any;
  handleUnequipHelmet: any;
  handleUnequipBoots: any;
  handleUnequipShield: any;
  handleUnequipGloves: any;
  handleUnequipAmulet: any;
  handleAdjustAttribute: any;
  handleStartCaravanTravel: any;
  handleRepairAll: any;
  handleRepairItem: any;
  handleUpgradeBlacksmith: any;
  handleBuyRumor: any;
  handleTavernRest: any;
  handleHireMercenary: any;
  handleBuyEnchantedGear: any;
  handleBuyEquipment: any;
  handleBuyResource: any;
  handleSellEquipment: any;
  handleSellResource: any;
  addLogMessage: any;
}

export const GameMainViewport: React.FC<GameMainViewportProps> = ({
  activeMobileView,
  activeTab,
  setActiveTab,
  gameState,
  setGameState,
  playSound,
  scrollTabBar,
  effectiveMaxHp,
  effectivePlayerDef,
  brokenArmorDefReduction,
  selectedSpellId,
  setSelectedSpellId,
  handleUnequipArmor,
  handleUnequipWeapon,
  handleEquipItem,
  setActivePoi,
  handleInteractWithDungeonShrine,
  setIsFishingOpen,
  setIsWorldMapOpen,
  handleTileClick,
  shakeTrigger,
  activeTargetedScroll,
  setActiveTargetedScroll,
  handleClearLogs,
  handleDownloadLogs,
  makeMove,
  handleGKeyInteract,
  handleBraceDefense,
  handleCraftComplete,
  handlePlaceCampfire,
  handlePlaceAnvil,
  handlePlaceBedroll,
  handlePlaceFieldTent,
  handleCookMeat,
  handleCookFish,
  handleCookPrimeMeat,
  handleCraftFishingPole,
  handleCraftLockpicks,
  handleCraftHatchet,
  handleCraftPickaxe,
  handleRestCampfire,
  handleMutateItem,
  handleUpgradeItem,
  handleCraftRecallScroll,
  handleCraftSpellScroll,
  onTriggerScriptorium,
  handleCookRecipe,
  handleBrewPotion,
  handleUpgradeApothecary,
  handleEatMeat,
  handleDiscardItem,
  handleDiscardMaterial,
  handleDiscardCatalyst,
  handleShiftCatalyst,
  handleUnstableReactorSurge,
  handleUnequipHelmet,
  handleUnequipBoots,
  handleUnequipShield,
  handleUnequipGloves,
  handleUnequipAmulet,
  handleAdjustAttribute,
  handleStartCaravanTravel,
  handleRepairAll,
  handleRepairItem,
  handleUpgradeBlacksmith,
  handleBuyRumor,
  handleTavernRest,
  handleHireMercenary,
  handleBuyEnchantedGear,
  handleBuyEquipment,
  handleBuyResource,
  handleSellEquipment,
  handleSellResource,
  addLogMessage,
}) => {
  return (
    <div id="game-main-viewport-container" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-visible">
      {/* LEFT SIDEPANEL: Heroes Card and Assets checklist */}
      {!activeMobileView && (
        <PlayerSidebarPanel
          gameState={gameState}
          effectiveMaxHp={effectiveMaxHp}
          effectivePlayerDef={effectivePlayerDef}
          brokenArmorDefReduction={brokenArmorDefReduction}
          selectedSpellId={selectedSpellId}
          setSelectedSpellId={setSelectedSpellId}
          handleUnequipArmor={handleUnequipArmor}
          handleUnequipWeapon={handleUnequipWeapon}
          handleUnequipShield={handleUnequipShield}
          handleUnequipHelmet={handleUnequipHelmet}
          handleUnequipGloves={handleUnequipGloves}
          handleUnequipBoots={handleUnequipBoots}
          handleUnequipAmulet={handleUnequipAmulet}
          handleEquipItem={handleEquipItem}
          setIsWorldMapOpen={setIsWorldMapOpen}
        />
      )}

      {/* RIGHT CENTER: High visual controls and viewport tabs */}
      <div className={`${activeMobileView ? 'col-span-12' : 'lg:col-span-9 col-span-12'} flex flex-col gap-4 overflow-visible min-w-0 order-1 lg:order-none`}>
        {/* Nav tabs controls */}
        <AppNavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeMobileView={activeMobileView}
          gameState={gameState}
          playSound={playSound}
          scrollTabBar={scrollTabBar}
        />

        {/* Render Tab Viewports */}
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {activeTab === 'dungeon' && (
            <div className="flex-grow flex flex-col min-h-0 gap-4">
              {/* Interactive Landmark Hotspot / Prop / Fishing Alert Banners */}
              <ViewportAlertBanners
                gameState={gameState}
                onOpenPoi={setActivePoi}
                onInteractWithDungeonShrine={handleInteractWithDungeonShrine}
                onOpenFishing={() => setIsFishingOpen(true)}
                playSound={playSound}
              />

              {/* Compact Mobile HUD Overlay */}
              {activeMobileView && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-lg select-none text-xs font-mono animate-fade-in shrink-0">
                  {/* HP & MP */}
                  <div className="flex gap-2">
                    <div className="bg-red-950/40 border border-red-900/30 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-red-500 font-bold">❤️</span>
                      <span className="text-slate-200 font-bold">{gameState.playerStats.hp}/{gameState.playerStats.maxHp}</span>
                    </div>
                    <div className="bg-blue-950/40 border border-blue-900/30 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-blue-400 font-bold">🧪</span>
                      <span className="text-slate-200 font-bold">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</span>
                    </div>
                  </div>

                  {/* Gold & Active Weapon / Armor */}
                  <div className="flex gap-2 items-center">
                    <div className="bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-amber-500">🪙</span>
                      <span className="text-amber-400 font-bold">{gameState.playerStats.gold}</span>
                    </div>
                    {gameState.currentWeapon && (
                      <div className="bg-slate-950/60 border border-slate-800 px-2 py-1 rounded flex items-center gap-1 text-[10px] text-slate-300">
                        <span>⚔️</span>
                        <span className="truncate max-w-[80px] font-sans font-bold" style={{ color: gameState.currentWeapon.color }}>
                          {gameState.currentWeapon.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Atmospheric Weather forecasting banner */}
              <WeatherForecastBanner gameState={gameState} />

              {!activeMobileView ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[640px] md:h-[720px] lg:h-[780px] xl:h-[840px] 2xl:h-[880px] min-h-[500px] overflow-hidden">
                  <div className="lg:col-span-8 flex flex-col min-h-0 relative h-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950">
                    <GameCanvas
                      gameState={gameState}
                      onTileClick={handleTileClick}
                      shakeTrigger={shakeTrigger}
                    />
                    {activeTargetedScroll && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/95 border-2 border-amber-500 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 z-50 animate-bounce">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Casting Spell Scroll</span>
                          <span className="text-xs text-slate-200 font-bold">{activeTargetedScroll.name} (Click an enemy to cast)</span>
                        </div>
                        <button
                          onClick={() => setActiveTargetedScroll(null)}
                          className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                    <GameLog
                      logs={gameState.logs}
                      onClearLogs={handleClearLogs}
                      onDownloadLogs={handleDownloadLogs}
                      className="relative bg-slate-950/90 border border-slate-800/90 rounded-2xl overflow-hidden h-full flex flex-col shadow-xl min-h-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-850 shadow-xl">
                  {/* COMPACT MOBILE HUD */}
                  <MobileHudBar gameState={gameState} effectiveMaxHp={effectiveMaxHp} />

                  <div className="relative">
                    <GameCanvas
                      gameState={gameState}
                      onTileClick={handleTileClick}
                      shakeTrigger={shakeTrigger}
                    />
                    {activeTargetedScroll && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/95 border-2 border-amber-500 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 z-50 animate-bounce animate-duration-1000">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Casting Spell Scroll</span>
                          <span className="text-xs text-slate-200 font-bold">{activeTargetedScroll.name}</span>
                        </div>
                        <button
                          onClick={() => setActiveTargetedScroll(null)}
                          className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Command cockpit controls */}
              {activeMobileView && (
                <MobileCommandPad
                  onMove={makeMove}
                  onInteract={handleGKeyInteract}
                  onBraceDefense={handleBraceDefense}
                  onOpenInventory={() => {
                    playSound('click');
                    setActiveTab('inventory');
                  }}
                  onOpenQuests={() => {
                    setGameState((prev) => ({
                      ...prev,
                      activeQuestBoardOpen: true,
                    }));
                  }}
                  onOpenWorldMap={() => {
                    if (setIsWorldMapOpen) {
                      playSound('click');
                      setIsWorldMapOpen(true);
                    }
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'forge' && (
            <div className="flex-grow flex flex-col">
              {(() => {
                const adjCampfire = [
                  { dx: 0, dy: 0 },
                  { dx: 0, dy: -1 },
                  { dx: 0, dy: 1 },
                  { dx: -1, dy: 0 },
                  { dx: 1, dy: 0 },
                  { dx: -1, dy: -1 },
                  { dx: 1, dy: -1 },
                  { dx: -1, dy: 1 },
                  { dx: 1, dy: 1 },
                ].some((d) => {
                  const nx = gameState.playerX + d.dx;
                  const ny = gameState.playerY + d.dy;
                  return (
                    nx >= 0 &&
                    nx < LEVEL_WIDTH &&
                    ny >= 0 &&
                    ny < LEVEL_HEIGHT &&
                    gameState.map[ny]?.[nx] === TileType.Campfire
                  );
                });
                const adjAnvil = [
                  { dx: 0, dy: 0 },
                  { dx: 0, dy: -1 },
                  { dx: 0, dy: 1 },
                  { dx: -1, dy: 0 },
                  { dx: 1, dy: 0 },
                  { dx: -1, dy: -1 },
                  { dx: 1, dy: -1 },
                  { dx: -1, dy: 1 },
                  { dx: 1, dy: 1 },
                ].some((d) => {
                  const nx = gameState.playerX + d.dx;
                  const ny = gameState.playerY + d.dy;
                  const tileAt = gameState.map[ny]?.[nx];
                  return (
                    nx >= 0 &&
                    nx < LEVEL_WIDTH &&
                    ny >= 0 &&
                    ny < LEVEL_HEIGHT &&
                    (tileAt === TileType.Anvil || tileAt === TileType.Fireplace)
                  );
                });
                return (
                  <CraftingPanel
                    inventoryMaterials={gameState.inventoryMaterials}
                    inventoryCatalysts={gameState.inventoryCatalysts}
                    equipmentInventory={gameState.equipmentInventory}
                    onCraftWeapon={handleCraftComplete}
                    currentWeapon={gameState.currentWeapon}
                    onPlaceCampfire={handlePlaceCampfire}
                    onPlaceAnvil={handlePlaceAnvil}
                    onPlaceBedroll={handlePlaceBedroll}
                    onPlaceFieldTent={handlePlaceFieldTent}
                    onCookMeat={handleCookMeat}
                    onCookFish={handleCookFish}
                    onCookPrimeMeat={handleCookPrimeMeat}
                    onCraftFishingPole={handleCraftFishingPole}
                    onCraftLockpicks={handleCraftLockpicks}
                    onCraftHatchet={handleCraftHatchet}
                    onCraftPickaxe={handleCraftPickaxe}
                    onRestCampfire={handleRestCampfire}
                    isNextToCampfire={adjCampfire}
                    isNextToAnvil={adjAnvil}
                    onMutateItem={handleMutateItem}
                    onUpgradeItem={handleUpgradeItem}
                    blacksmithForgeLevel={gameState.blacksmithForgeLevel ?? 1}
                    onCraftRecallScroll={handleCraftRecallScroll}
                    onCraftSpellScroll={handleCraftSpellScroll}
                    onTriggerScriptorium={onTriggerScriptorium}
                    gameState={gameState}
                    onCookRecipe={handleCookRecipe}
                    onBrewPotion={handleBrewPotion}
                    onUpgradeApothecary={handleUpgradeApothecary}
                  />
                );
              })()}
            </div>
          )}

          {activeTab === 'bestiary' && (
            <div className="flex-1 flex flex-col min-h-0">
              <BestiaryOverlay
                defeatedEnemiesCount={gameState.defeatedEnemiesCount || {}}
                inline={true}
              />
            </div>
          )}

          {activeTab === 'inventory' && (
            <UnifiedInventoryPanel
              gameState={gameState}
              setGameState={setGameState}
              handleEatMeat={handleEatMeat}
              handleEquipItem={handleEquipItem}
              handleDiscardItem={handleDiscardItem}
              handleDiscardMaterial={handleDiscardMaterial}
              handleDiscardCatalyst={handleDiscardCatalyst}
              handleShiftCatalyst={handleShiftCatalyst}
              handleUnstableReactorSurge={handleUnstableReactorSurge}
              handleUnequipHelmet={handleUnequipHelmet}
              handleUnequipArmor={handleUnequipArmor}
              handleUnequipBoots={handleUnequipBoots}
              handleUnequipWeapon={handleUnequipWeapon}
              handleUnequipShield={handleUnequipShield}
              handleUnequipGloves={handleUnequipGloves}
              handleUnequipAmulet={handleUnequipAmulet}
              handleAdjustAttribute={handleAdjustAttribute}
              playSound={playSound}
            />
          )}

          {activeTab === 'market' && (
            <TradeModal
              gameState={gameState}
              setGameState={setGameState}
              setActiveTab={setActiveTab}
              handleStartCaravanTravel={handleStartCaravanTravel}
              handleRepairAll={handleRepairAll}
              handleRepairItem={handleRepairItem}
              handleUpgradeBlacksmith={handleUpgradeBlacksmith}
              handleUpgradeApothecary={handleUpgradeApothecary}
              handleBuyRumor={handleBuyRumor}
              handleTavernRest={handleTavernRest}
              handleHireMercenary={handleHireMercenary}
              handleBuyEnchantedGear={handleBuyEnchantedGear}
              handleBuyEquipment={handleBuyEquipment}
              handleBuyResource={handleBuyResource}
              handleSellEquipment={handleSellEquipment}
              handleSellResource={handleSellResource}
              playSound={playSound}
            />
          )}

          {activeTab === 'guild' && (
            <GuildOverlay
              gameState={gameState}
              setGameState={setGameState}
              addLogMessage={addLogMessage}
              playSound={playSound}
            />
          )}

          {activeTab === 'chronicles' && (
            <div className="flex-1 flex flex-col min-h-0">
              <HistoryBookOverlay
                unlockedChapters={gameState.unlockedChapters || []}
                poisCount={gameState.poisCount || 0}
                onClose={() => setActiveTab('dungeon')}
                inline={true}
              />
            </div>
          )}
        </div>

        {/* Bottom Log Area (Hidden on Dungeon tab in desktop view since we render it side-by-side) */}
        {!(activeTab === 'dungeon' && !activeMobileView) && (
          <GameLog
            logs={gameState.logs}
            onClearLogs={handleClearLogs}
            onDownloadLogs={handleDownloadLogs}
          />
        )}
      </div>
    </div>
  );
};

export default GameMainViewport;
