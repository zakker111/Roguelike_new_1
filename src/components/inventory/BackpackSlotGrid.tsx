/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, EquipmentItem } from '../../types';
import {
  getItemRarityValue,
  DiscardLongPressHandler,
  DiscardClickHandler,
} from './types';
import { InventoryWeightBar } from './InventoryWeightBar';
import { InventoryFilterBar, InventoryBagSubTab } from './InventoryFilterBar';
import { AlliesRosterView } from './AlliesRosterView';
import { GearInventoryGrid } from './GearInventoryGrid';
import { ProvisionsInventoryGrid } from './ProvisionsInventoryGrid';
import { MaterialsInventoryGrid } from './MaterialsInventoryGrid';

export interface BackpackSlotGridProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  handleEquipItem: (item: EquipmentItem, hand?: 'right' | 'left') => void;
  handleEatMeat: (foodKey: string) => void;
  playSound: (soundId: string) => void;
  startDiscardLongPress: DiscardLongPressHandler;
  cancelDiscardLongPress: () => void;
  handleDiscardClick: DiscardClickHandler;
}

export const BackpackSlotGrid: React.FC<BackpackSlotGridProps> = ({
  gameState,
  setGameState,
  handleEquipItem,
  handleEatMeat,
  playSound,
  startDiscardLongPress,
  cancelDiscardLongPress,
  handleDiscardClick,
}) => {
  const [bagSubTab, setBagSubTab] = useState<InventoryBagSubTab>('gear');
  const [isSortedFeedback, setIsSortedFeedback] = useState<boolean>(false);

  const handleSortInventory = () => {
    playSound('item');
    setIsSortedFeedback(true);
    setTimeout(() => setIsSortedFeedback(false), 800);

    setGameState((prev) => {
      const sortedGear = [...prev.equipmentInventory].sort((a, b) => {
        const typeOrder: Record<string, number> = { weapon: 1, armor: 2, other: 3 };
        const orderA = typeOrder[a.type] || 4;
        const orderB = typeOrder[b.type] || 4;
        if (orderA !== orderB) return orderA - orderB;

        const subOrder: Record<string, number> = {
          Sword: 1,
          Dagger: 2,
          Axe: 3,
          Mace: 4,
          Bow: 5,
          Staff: 6,
          Shield: 7,
          Helmet: 8,
          Plate: 9,
          Boots: 10,
          Gauntlets: 11,
          Amulet: 12,
          Scroll: 13,
        };
        const subA = subOrder[a.subType || ''] || 99;
        const subB = subOrder[b.subType || ''] || 99;
        if (subA !== subB) return subA - subB;

        const rA = getItemRarityValue(a);
        const rB = getItemRarityValue(b);
        if (rA !== rB) return rB - rA;

        return a.name.localeCompare(b.name);
      });

      return {
        ...prev,
        equipmentInventory: sortedGear,
      };
    });
  };

  const totalFoodCount = Object.entries(gameState.inventoryMaterials).reduce(
    (sum: number, [id, qty]: [string, any]) => {
      const isFood = [
        'mat_bread',
        'mat_cooked_meat',
        'mat_cooked_prime_meat',
        'mat_cooked_pie',
        'mat_cooked_fish',
        'mat_berry',
        'mat_beer',
        'mat_seppo_hooch',
        'mat_raw_fish',
        'mat_prime_meat',
        'mat_raw_meat',
      ].includes(id);
      return isFood ? sum + (qty || 0) : sum;
    },
    0
  );

  const totalMatsCount =
    Object.entries(gameState.inventoryMaterials).reduce(
      (sum: number, [id, qty]: [string, any]) => {
        const isFood = [
          'mat_bread',
          'mat_cooked_meat',
          'mat_cooked_prime_meat',
          'mat_cooked_pie',
          'mat_cooked_fish',
          'mat_berry',
          'mat_beer',
          'mat_seppo_hooch',
          'mat_raw_fish',
          'mat_prime_meat',
          'mat_raw_meat',
        ].includes(id);
        return !isFood ? sum + (qty || 0) : sum;
      },
      0
    ) +
    Object.values(gameState.inventoryCatalysts).reduce(
      (sum: number, qty: any) => sum + (qty || 0),
      0
    );

  const handleInspectFollower = (followerId: string) => {
    setGameState((prev) => ({
      ...prev,
      activeFollowerIdForInspect: followerId,
    }));
  };

  return (
    <div
      id="backpack-slot-grid"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col flex-1 min-h-[350px] overflow-hidden"
    >
      <div className="border-b border-slate-800/80 pb-2.5 mb-3 flex flex-col gap-2">
        {/* Interactive Carrying Weight Bar */}
        <InventoryWeightBar gameState={gameState} />

        {/* Inventory Actions Header & Sub-navigation Tabs */}
        <InventoryFilterBar
          bagSubTab={bagSubTab}
          setBagSubTab={setBagSubTab}
          totalFollowers={gameState.followers.length}
          totalGear={gameState.equipmentInventory.length}
          totalFood={totalFoodCount}
          totalMats={totalMatsCount}
          onSortInventory={handleSortInventory}
          isSortedFeedback={isSortedFeedback}
          playSound={playSound}
        />
      </div>

      {/* Content Area rendering based on Sub-tab */}
      <div className="flex-1 overflow-y-auto pr-1">
        {bagSubTab === 'allies' && (
          <AlliesRosterView
            followers={gameState.followers}
            onInspectFollower={handleInspectFollower}
            playSound={playSound}
          />
        )}

        {bagSubTab === 'gear' && (
          <GearInventoryGrid
            equipmentInventory={gameState.equipmentInventory}
            handleEquipItem={handleEquipItem}
            startDiscardLongPress={startDiscardLongPress}
            cancelDiscardLongPress={cancelDiscardLongPress}
            handleDiscardClick={handleDiscardClick}
          />
        )}

        {bagSubTab === 'food' && (
          <ProvisionsInventoryGrid
            inventoryMaterials={gameState.inventoryMaterials}
            handleEatMeat={handleEatMeat}
            startDiscardLongPress={startDiscardLongPress}
            cancelDiscardLongPress={cancelDiscardLongPress}
            handleDiscardClick={handleDiscardClick}
          />
        )}

        {bagSubTab === 'resources' && (
          <MaterialsInventoryGrid
            inventoryMaterials={gameState.inventoryMaterials}
            inventoryCatalysts={gameState.inventoryCatalysts}
            startDiscardLongPress={startDiscardLongPress}
            cancelDiscardLongPress={cancelDiscardLongPress}
            handleDiscardClick={handleDiscardClick}
          />
        )}
      </div>
    </div>
  );
};
