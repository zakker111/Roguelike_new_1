import React from 'react';
import { Sparkles, Heart, Sliders, Hammer, Zap, Eye, MapPin, ShieldAlert } from 'lucide-react';
import { GameState } from '../../types';

interface GodCheatsTabProps {
  gameState: GameState;
  handleHealPlayer: () => void;
  handleGoldBounty: () => void;
  handleGrantMaterials: () => void;
  handleGrantLevelBounty: () => void;
  handleMaxUpgradeEquipped: () => void;
  handleWipeEnemies: () => void;
  handleRevealFullMap: () => void;
  TeleportToEmptyArena: () => void;
  onTriggerLockpicking?: () => void;
  onClose: () => void;
}

export const GodCheatsTab: React.FC<GodCheatsTabProps> = ({
  gameState,
  handleHealPlayer,
  handleGoldBounty,
  handleGrantMaterials,
  handleGrantLevelBounty,
  handleMaxUpgradeEquipped,
  handleWipeEnemies,
  handleRevealFullMap,
  TeleportToEmptyArena,
  onTriggerLockpicking,
  onClose
}) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="border-b border-amber-900/40 pb-2">
        <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Sovereign God Mode & Cheat Suite</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          Instant developer overrides for player attributes, currency, inventory, map visibility, and combat testing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={handleHealPlayer}
          className="py-2.5 px-3 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 text-rose-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Full HP & MP Restore</span>
          <Heart className="w-3.5 h-3.5 text-rose-500" />
        </button>

        <button
          onClick={handleGoldBounty}
          className="py-2.5 px-3 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 text-amber-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Add +500 Gold Bounty</span>
          <span>💰</span>
        </button>

        <button
          onClick={handleGrantMaterials}
          className="py-2.5 px-3 bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-800/50 text-indigo-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Grant 99x Crafting Alloys</span>
          <Hammer className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        <button
          onClick={handleGrantLevelBounty}
          className="py-2.5 px-3 bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/50 text-teal-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Gain +5 Level-up (+25 pts)</span>
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
        </button>

        <button
          onClick={() => {
            if (onTriggerLockpicking) {
              onTriggerLockpicking();
              onClose();
            }
          }}
          className="py-2.5 px-3 bg-purple-950/35 hover:bg-purple-900/40 border border-purple-850 text-purple-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Test Lockpicking Minigame</span>
          <span>🔑</span>
        </button>

        <button
          onClick={handleMaxUpgradeEquipped}
          className="py-2.5 px-3 bg-emerald-950/35 hover:bg-emerald-900/40 border border-emerald-850 text-emerald-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Max-Upgrade Equipped (+5)</span>
          <span>🐉</span>
        </button>

        <button
          onClick={handleRevealFullMap}
          className="py-2.5 px-3 bg-cyan-950/35 hover:bg-cyan-900/40 border border-cyan-850 text-cyan-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Reveal Entire Map FOV</span>
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        <button
          onClick={TeleportToEmptyArena}
          className="py-2.5 px-3 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/60 text-amber-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Sandbox Testing Arena</span>
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
        </button>

        <button
          onClick={handleWipeEnemies}
          className="py-2.5 px-3 bg-slate-950/40 hover:bg-red-950/30 border border-red-900/30 text-rose-400 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between col-span-1 sm:col-span-2"
        >
          <span>Clear All Active Chunk Enemies</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
        </button>
      </div>
    </div>
  );
};
