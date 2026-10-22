/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dice5, CheckCircle } from 'lucide-react';
import { GameState } from '../../types';
import {
  GodScriptoriumCard,
  GodLockpickingCard,
  GodFishingCard,
  GodTavernCard,
} from './minigames';

export interface GodMinigamesTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onTriggerLockpicking?: () => void;
  onTriggerFishing?: () => void;
  onTriggerScriptorium?: (scrollTemplateId?: string) => void;
  onTriggerDrunkGame?: () => void;
  onMinimizeGodPanel?: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
  triggerSuccessLog?: (msg: string) => void;
}

export const GodMinigamesTab: React.FC<GodMinigamesTabProps> = ({
  gameState,
  setGameState,
  onTriggerLockpicking,
  onTriggerFishing,
  onTriggerScriptorium,
  onTriggerDrunkGame,
  onMinimizeGodPanel,
  addLogMessage,
  triggerSuccessLog,
}) => {
  const [lastTestOutcome, setLastTestOutcome] = useState<string | null>(null);

  return (
    <div id="god-minigames-tab" className="space-y-6 font-mono text-xs text-slate-300 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-start justify-between shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg shrink-0 text-amber-400">
            <Dice5 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
                Interactive Minigame Testing Hub & Sandbox
              </h3>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-text-[10px] font-bold">
                DUAL TESTBED
              </span>
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Play and balance interactive minigames directly inside the tab below, or launch them as foreground modals with instant bypass cheats.
            </p>
          </div>
        </div>
      </div>

      {/* Active Outcome Banner */}
      {lastTestOutcome && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-300 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{lastTestOutcome}</span>
          </div>
          <button
            onClick={() => setLastTestOutcome(null)}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Minigames Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Arcane Scriptorium Minigame Card */}
        <GodScriptoriumCard
          gameState={gameState}
          setGameState={setGameState}
          onTriggerScriptorium={onTriggerScriptorium}
          onMinimizeGodPanel={onMinimizeGodPanel}
          addLogMessage={addLogMessage}
          triggerSuccessLog={triggerSuccessLog}
          setLastTestOutcome={setLastTestOutcome}
        />

        {/* 2. Lockpicking Tumbler Minigame Card */}
        <GodLockpickingCard
          gameState={gameState}
          setGameState={setGameState}
          onTriggerLockpicking={onTriggerLockpicking}
          onMinimizeGodPanel={onMinimizeGodPanel}
          addLogMessage={addLogMessage}
          triggerSuccessLog={triggerSuccessLog}
          setLastTestOutcome={setLastTestOutcome}
        />

        {/* 3. Fishing Minigame Card */}
        <GodFishingCard
          gameState={gameState}
          setGameState={setGameState}
          onTriggerFishing={onTriggerFishing}
          onMinimizeGodPanel={onMinimizeGodPanel}
          addLogMessage={addLogMessage}
          triggerSuccessLog={triggerSuccessLog}
          setLastTestOutcome={setLastTestOutcome}
        />

        {/* 4. Tavern Social & Coin Betting Card */}
        <GodTavernCard
          gameState={gameState}
          setGameState={setGameState}
          onTriggerDrunkGame={onTriggerDrunkGame}
          onMinimizeGodPanel={onMinimizeGodPanel}
          addLogMessage={addLogMessage}
          triggerSuccessLog={triggerSuccessLog}
          setLastTestOutcome={setLastTestOutcome}
        />
      </div>
    </div>
  );
};

export default GodMinigamesTab;
