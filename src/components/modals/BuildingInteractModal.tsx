import React, { useState, useEffect } from 'react';
import { X, Shield, Wrench, Coins, ArrowUpCircle, Castle, Flag, Users } from 'lucide-react';
import { GameState } from '../../types';
import { playSound } from '../../utils/audio';

export interface BuildingInteractModalProps {
  structureId: string;
  structureName: string;
  structureType: 'watchtower' | 'guild_hall' | 'town_square' | 'settlement' | 'outpost' | 'refinery';
  controller?: 'vanguard' | 'syndicate' | 'outlaw' | 'player' | 'neutral';
  durability?: number;
  maxDurability?: number;
  garrisonCount?: number;
  accumulatedGold?: number;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export const BuildingInteractModal: React.FC<BuildingInteractModalProps> = ({
  structureId,
  structureName,
  structureType,
  controller = 'neutral',
  durability = 100,
  maxDurability = 100,
  garrisonCount = 2,
  accumulatedGold = 50,
  gameState,
  setGameState,
  onClose,
  addLogMessage,
}) => {
  const [currentDurability, setCurrentDurability] = useState(durability);
  const [currentGold, setCurrentGold] = useState(accumulatedGold);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const isPlayerOwned = controller === 'player' || controller === 'vanguard';

  const handleRepair = () => {
    if (gameState.playerStats.gold < 25) {
      playSound('deny');
      if (addLogMessage) addLogMessage("❌ You need at least 25 Gold to repair this structure!", "danger");
      return;
    }
    playSound('craft');
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold - 25,
      },
    }));
    setCurrentDurability(maxDurability);
    if (addLogMessage) {
      addLogMessage(`🔨 Repaired ${structureName} back to 100% durability (${maxDurability}/${maxDurability})!`, "craft");
    }
  };

  const handleCollectTax = () => {
    if (currentGold <= 0) {
      playSound('deny');
      if (addLogMessage) addLogMessage("⚠️ No taxes or revenue accumulated in this structure vault.", "info");
      return;
    }
    playSound('loot');
    const reward = currentGold;
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold + reward,
      },
    }));
    setCurrentGold(0);
    if (addLogMessage) {
      addLogMessage(`💰 Collected +${reward} Gold in revenue from ${structureName}!`, "loot");
    }
  };

  const handleReinforceGarrison = () => {
    if (gameState.playerStats.gold < 100) {
      playSound('deny');
      if (addLogMessage) addLogMessage("❌ You need at least 100 Gold to hire additional defenders!", "danger");
      return;
    }
    playSound('loot');
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold - 100,
      },
    }));
    if (addLogMessage) {
      addLogMessage(`🛡️ Garrison reinforced at ${structureName}! Defender guards dispatched.`, "system");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
              <Castle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                {structureName}
              </h3>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                {structureType.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Flag className="w-3 h-3 text-cyan-400" /> Controller
            </span>
            <span className="text-xs font-extrabold text-cyan-300 capitalize">{controller}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Integrity
            </span>
            <span className="text-xs font-extrabold text-emerald-300">{currentDurability} / {maxDurability}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> Vault Revenue
            </span>
            <span className="text-xs font-extrabold text-amber-300">{currentGold} Gold</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleCollectTax}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
          >
            <Coins className="w-4 h-4" />
            <span>Collect Vault Revenue (+{currentGold}g)</span>
          </button>

          <button
            onClick={handleRepair}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
            <span>Repair Structure (-25g)</span>
          </button>

          <button
            onClick={handleReinforceGarrison}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Hire Garrison Defender Guard (-100g)</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
          <span>Structure ID: {structureId}</span>
          <span>Status: {isPlayerOwned ? 'Secured' : 'Contested'}</span>
        </div>
      </div>
    </div>
  );
};

export default BuildingInteractModal;
