import { Dispatch, SetStateAction, useCallback } from 'react';
import { GameState, EquipmentItem } from '../types';

export interface UseTradeEconomyParams {
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLog: (msg: string) => void;
  playSound: (soundId: string) => void;
}

export function useTradeEconomy({ setGameState, addLog, playSound }: UseTradeEconomyParams) {
  const buyItemFromMerchant = useCallback((itemToBuy: EquipmentItem, price: number) => {
    setGameState((prev) => {
      const currentGold = prev.playerStats?.gold ?? 0;
      if (currentGold < price) {
        addLog(`🪙 Not enough gold! Needed ${price}g, but you only have ${currentGold}g.`);
        playSound('error');
        return prev;
      }

      const updatedInventory = [...(prev.equipmentInventory || []), { ...itemToBuy, id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` }];
      addLog(`🛍️ Purchased ${itemToBuy.name} for ${price} gold.`);
      playSound('coin');

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: currentGold - price,
        },
        equipmentInventory: updatedInventory,
      };
    });
  }, [setGameState, addLog, playSound]);

  const sellItemToMerchant = useCallback((itemToSell: EquipmentItem, price: number) => {
    setGameState((prev) => {
      const inventory = prev.equipmentInventory || [];
      const itemIndex = inventory.findIndex((i) => i.id === itemToSell.id);
      if (itemIndex === -1) return prev;

      const updatedInventory = [...inventory];
      updatedInventory.splice(itemIndex, 1);

      addLog(`💰 Sold ${itemToSell.name} for ${price} gold.`);
      playSound('coin');

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: (prev.playerStats?.gold ?? 0) + price,
        },
        equipmentInventory: updatedInventory,
      };
    });
  }, [setGameState, addLog, playSound]);

  return {
    buyItemFromMerchant,
    sellItemToMerchant,
  };
}


