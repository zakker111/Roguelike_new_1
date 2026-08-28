/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { DiscardGumpModal, DiscardGumpData } from './DiscardGumpModal';
import {
  UnifiedInventoryPanelProps,
  HeroBiometricsCard,
  EquipmentPaperdoll,
  CombatStatsSummary,
  BackpackSlotGrid,
  AlchemicalTransmuterPanel,
} from './inventory';

function UnifiedInventoryPanelComponent({
  gameState,
  setGameState,
  handleEatMeat,
  handleEquipItem,
  handleDiscardItem,
  handleDiscardMaterial,
  handleDiscardCatalyst,
  handleShiftCatalyst,
  handleUnstableReactorSurge,
  handleUnequipHelmet,
  handleUnequipArmor,
  handleUnequipBoots,
  handleUnequipWeapon,
  handleUnequipShield,
  handleUnequipGloves,
  handleUnequipAmulet,
  handleAdjustAttribute,
  playSound,
}: UnifiedInventoryPanelProps) {
  const [discardGumpData, setDiscardGumpData] = useState<DiscardGumpData | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const startDiscardLongPress = (
    type: 'item' | 'material' | 'catalyst',
    id: string,
    name: string,
    icon: string,
    color: string | undefined,
    maxQuantity: number,
    unitWeight: number
  ) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setDiscardGumpData({ type, id, name, icon, color, maxQuantity, unitWeight });
    }, 350);
  };

  const cancelDiscardLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDiscardClick = (
    e: React.MouseEvent,
    type: 'item' | 'material' | 'catalyst',
    id: string,
    name: string,
    icon: string,
    color: string | undefined,
    maxQuantity: number,
    unitWeight: number
  ) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    cancelDiscardLongPress();

    if (maxQuantity > 1) {
      setDiscardGumpData({ type, id, name, icon, color, maxQuantity, unitWeight });
    } else {
      if (type === 'item') handleDiscardItem(id, 1);
      else if (type === 'material') handleDiscardMaterial(id, 1);
      else if (type === 'catalyst') handleDiscardCatalyst(id, 1);
    }
  };

  const handleConfirmDiscardFromGump = (data: DiscardGumpData, qty: number) => {
    if (data.type === 'item') handleDiscardItem(data.id, qty);
    else if (data.type === 'material') handleDiscardMaterial(data.id, qty);
    else if (data.type === 'catalyst') handleDiscardCatalyst(data.id, qty);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-6xl mx-auto h-full overflow-y-auto pr-1">
      {/* LEFT COLUMN: HERO PROFILE, ATTRIBUTES, PAPERDOLL & COMBAT STATS */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Hero Identity & Attributes Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <HeroBiometricsCard
            gameState={gameState}
            handleAdjustAttribute={handleAdjustAttribute}
          />
        </div>

        {/* Paperdoll Equipment Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="border-b border-slate-800/80 pb-2 flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <span>🛡️ EQUIPPED PAPERDOLL GEAR</span>
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Click slotted gear to unequip
            </span>
          </div>

          <EquipmentPaperdoll
            gameState={gameState}
            handleUnequipHelmet={handleUnequipHelmet}
            handleUnequipArmor={handleUnequipArmor}
            handleUnequipBoots={handleUnequipBoots}
            handleUnequipWeapon={handleUnequipWeapon}
            handleUnequipShield={handleUnequipShield}
            handleUnequipGloves={handleUnequipGloves}
            handleUnequipAmulet={handleUnequipAmulet}
          />
        </div>

        {/* Combat Stats & Battle Scars Summary */}
        <CombatStatsSummary
          gameState={gameState}
          setGameState={setGameState}
          playSound={playSound}
        />
      </div>

      {/* RIGHT COLUMN: AVAILABLE STORAGE BAGS, ALLIES, PROVISIONS & TRANSMUTER */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
        {/* Bag Equipment Container */}
        <BackpackSlotGrid
          gameState={gameState}
          setGameState={setGameState}
          handleEquipItem={handleEquipItem}
          handleEatMeat={handleEatMeat}
          playSound={playSound}
          startDiscardLongPress={startDiscardLongPress}
          cancelDiscardLongPress={cancelDiscardLongPress}
          handleDiscardClick={handleDiscardClick}
        />

        {/* Alchemical Transmuter Panel */}
        <AlchemicalTransmuterPanel
          gameState={gameState}
          handleShiftCatalyst={handleShiftCatalyst}
          handleUnstableReactorSurge={handleUnstableReactorSurge}
        />
      </div>

      {/* Discard Gump Modal */}
      <DiscardGumpModal
        data={discardGumpData}
        onClose={() => setDiscardGumpData(null)}
        onConfirm={handleConfirmDiscardFromGump}
      />
    </div>
  );
}

export const UnifiedInventoryPanel = React.memo(UnifiedInventoryPanelComponent);
export default UnifiedInventoryPanel;
