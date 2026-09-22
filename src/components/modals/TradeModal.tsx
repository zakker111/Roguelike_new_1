import React, { useMemo } from 'react';
import { getMerchantConfig } from '../../utils/shopData';
import {
  type TradeModalProps,
  TradeRoleContext,
  TradeHeaderBar,
  CaravanRoutesWidget,
  BlacksmithRepairStation,
  ApothecaryStation,
  TavernServiceStation,
  TradeBuyStockGrid,
  TradeSellStashGrid
} from './trade';

export type { TradeModalProps } from './trade';

export const TradeModal: React.FC<TradeModalProps> = ({
  gameState,
  setActiveTab,
  handleStartCaravanTravel,
  handleRepairAll,
  handleRepairItem,
  handleUpgradeBlacksmith,
  handleUpgradeApothecary,
  handleBuyRumor,
  handleTavernRest,
  handleHireMercenary,
  handleBuyEnchantedGear,
  handleBuyEquipment,
  handleBuyResource,
  handleSellEquipment,
  handleSellResource
}) => {
  const activeTradeNpcId = gameState.activeTradeNpcId;
  const activeNpc = gameState.npcs?.find(n => n.id === activeTradeNpcId);

  const roleContext: TradeRoleContext = useMemo(() => {
    const activeRole = activeNpc?.role || 
      (activeTradeNpcId?.includes('herbalist') ? 'traveler_herbalist' :
       activeTradeNpcId?.includes('hunter') ? 'traveler_hunter' :
       activeTradeNpcId?.includes('pilgrim') ? 'traveler_pilgrim' :
       activeTradeNpcId?.includes('caravan') || activeTradeNpcId?.includes('traveler') || activeTradeNpcId?.includes('wandering') ? 'traveler_merchant' :
       activeTradeNpcId === 'npc_caravan_merchant' ? 'merchant_caravan' : '');

    const isBlacksmith = activeRole === 'npc_blacksmith' || activeRole.includes('blacksmith') || activeTradeNpcId === 'npc_shop_blacksmith';
    const isMerchant = activeRole === 'npc_merchant' || activeRole.includes('merchant') || activeTradeNpcId === 'npc_shop_merchant' || activeRole === 'traveler_hunter' || activeRole === 'traveler_pilgrim' || activeRole === 'traveler_merchant' || activeRole.includes('traveler') || activeRole.includes('wandering') || activeRole.includes('caravan');
    const isApothecary = activeRole === 'npc_apothecary' || activeRole.includes('apothecary') || activeTradeNpcId === 'npc_shop_apothecary' || activeRole === 'traveler_herbalist';
    const isTavernMaster = activeRole === 'npc_innkeeper' || activeRole.includes('innkeeper') || activeTradeNpcId === 'npc_shop_innkeeper';
    const isSeppo = activeTradeNpcId === 'npc_seppo' || activeNpc?.name === 'Seppo the Smith' || activeRole === 'merchant_seppo';

    const isTraveler = 
      activeRole.startsWith('traveler_') ||
      activeRole.includes('caravan') ||
      activeRole.includes('wandering') ||
      activeRole === 'merchant_seppo' ||
      (activeTradeNpcId ? (activeTradeNpcId.includes('traveler') || activeTradeNpcId.includes('wandering') || activeTradeNpcId.includes('caravan')) : false);

    const travelerPriceMarkup = isTraveler ? 1.30 : 1.0;

    const isCaravanMerchant = 
      activeTradeNpcId === 'npc_caravan_merchant' || 
      activeTradeNpcId?.includes('caravan') ||
      activeTradeNpcId?.includes('wandering') ||
      activeTradeNpcId?.includes('traveler') ||
      activeTradeNpcId?.includes('merchant') ||
      activeNpc?.role === 'merchant_caravan' ||
      activeNpc?.role === ('merchant_caravan_ambushed' as any) ||
      activeNpc?.role === 'traveler_merchant' ||
      (activeNpc?.role && typeof activeNpc.role === 'string' && (activeNpc.role.includes('caravan') || activeNpc.role.includes('merchant'))) ||
      (activeNpc?.name && (
        activeNpc.name.toLowerCase().includes('caravan') ||
        activeNpc.name.toLowerCase().includes('sledger') ||
        activeNpc.name.toLowerCase().includes('barger') ||
        activeNpc.name.toLowerCase().includes('caravaneer') ||
        activeNpc.name.toLowerCase().includes('trader') ||
        activeNpc.name.toLowerCase().includes('merchant')
      )) || false;

    return {
      activeRole,
      isBlacksmith,
      isMerchant,
      isApothecary,
      isTavernMaster,
      isSeppo,
      isTraveler,
      isCaravanMerchant,
      travelerPriceMarkup
    };
  }, [activeNpc, activeTradeNpcId]);

  const getStock = (id: string, defaultVal: number = 3) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const mConfig = getMerchantConfig(roleContext.activeRole, activeId);
    
    return gameState.merchantStock?.[activeId]?.[id] !== undefined
      ? gameState.merchantStock[activeId][id]
      : (mConfig.defaultStock[id] !== undefined ? mConfig.defaultStock[id] : defaultVal);
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow min-h-[420px]">
      {/* Trader Banner header */}
      <TradeHeaderBar
        activeNpc={activeNpc}
        activeRole={roleContext.activeRole}
        onExit={() => setActiveTab('dungeon')}
      />

      {/* Caravan Journey & Escort Service Widget */}
      {roleContext.isCaravanMerchant && (
        <CaravanRoutesWidget
          currentChunkX={gameState.currentChunkX}
          currentChunkY={gameState.currentChunkY}
          onStartCaravanTravel={(destX, destY, name) => {
            handleStartCaravanTravel(destX, destY, name);
            setActiveTab('dungeon');
          }}
        />
      )}

      {/* Blacksmith Forge repair bay widget */}
      {roleContext.isBlacksmith && (
        <BlacksmithRepairStation
          gameState={gameState}
          onRepairAll={handleRepairAll}
          onRepairItem={handleRepairItem}
          onUpgradeBlacksmith={handleUpgradeBlacksmith}
        />
      )}

      {/* Apothecary Laboratory Upgrade Panel */}
      {roleContext.isApothecary && (
        <ApothecaryStation
          gameState={gameState}
          onUpgradeApothecary={handleUpgradeApothecary}
        />
      )}

      {/* Tavern Gossip & Mercenary Recruitment Board */}
      {roleContext.isTavernMaster && (
        <TavernServiceStation
          onBuyRumor={handleBuyRumor}
          onTavernRest={handleTavernRest}
          onHireMercenary={handleHireMercenary}
        />
      )}

      {/* Twin Columns: Buy on Left, Sell on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto">
        <TradeBuyStockGrid
          gameState={gameState}
          roleContext={roleContext}
          getStock={getStock}
          onBuyEnchantedGear={handleBuyEnchantedGear}
          onBuyEquipment={handleBuyEquipment}
          onBuyResource={handleBuyResource}
        />
        <TradeSellStashGrid
          gameState={gameState}
          onSellEquipment={handleSellEquipment}
          onSellResource={handleSellResource}
        />
      </div>
    </div>
  );
};

export default TradeModal;
