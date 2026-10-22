/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Wine, Coins } from 'lucide-react';
import { playSound } from '../../../utils/audio';
import { GameState, PlayerEffect } from '../../../types';

export interface GodTavernCardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onTriggerDrunkGame?: () => void;
  onMinimizeGodPanel?: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
  triggerSuccessLog?: (msg: string) => void;
  setLastTestOutcome: (msg: string | null) => void;
}

export const GodTavernCard: React.FC<GodTavernCardProps> = ({
  gameState,
  setGameState,
  onTriggerDrunkGame,
  onMinimizeGodPanel,
  addLogMessage,
  triggerSuccessLog,
  setLastTestOutcome,
}) => {
  const [, setInlineCoinBet] = useState<'heads' | 'tails' | null>(null);
  const [inlineCoinResult, setInlineCoinResult] = useState<string | null>(null);

  const playerGold = gameState.playerStats.gold;

  const handleInlineCoinFlip = (bet: 'heads' | 'tails') => {
    playSound('ui_click');
    setInlineCoinBet(bet);
    const rolled = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = rolled === bet;

    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: Math.max(0, prev.playerStats.gold + (won ? 25 : -25))
      }
    }));

    if (won) {
      playSound('victory');
      setInlineCoinResult(`✨ WON! Coin flipped ${rolled.toUpperCase()}! (+25 Gold)`);
    } else {
      playSound('defeat');
      setInlineCoinResult(`💀 LOST! Coin flipped ${rolled.toUpperCase()}! (-25 Gold)`);
    }
  };

  const handleInlineBuyDrink = () => {
    playSound('spell');
    setGameState(prev => {
      const activeEffects = prev.playerStats.activeEffects || [];
      const hasBuff = activeEffects.some(b => b.name === 'Drunken Cheer');
      const updatedEffects: PlayerEffect[] = hasBuff
        ? activeEffects
        : [
            ...activeEffects,
            {
              id: 'buff_drunken_cheer',
              name: 'Drunken Cheer',
              type: 'buff',
              icon: '🍻',
              description: '+15% Crit chance for 20 turns',
              turnsRemaining: 20,
              color: '#f59e0b',
              statModifiers: { crit: 0.15 }
            }
          ];
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: Math.max(0, prev.playerStats.gold - 25),
          activeEffects: updatedEffects
        }
      };
    });
    setInlineCoinResult('🍻 CHEERS! Granted "Drunken Cheer" (+15% Crit chance for 20 turns).');
  };

  const handleLaunchTavernGamble = () => {
    playSound('ui_click');
    setLastTestOutcome('Launched Tavern Social & Coin Betting Foreground Modal!');
    if (triggerSuccessLog) triggerSuccessLog('Launched Tavern Gamble Modal! Active in foreground.');
    if (addLogMessage) addLogMessage('🍺 [DEV] Launched Tavern Gamble Modal.', 'system');
    if (onTriggerDrunkGame) {
      onTriggerDrunkGame();
    }
    if (onMinimizeGodPanel) {
      onMinimizeGodPanel();
    }
  };

  const handleGrantTavernGold = () => {
    playSound('craft');
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold + 100
      }
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted +100 Gold for tavern betting!');
  };

  return (
    <div className="p-4 bg-slate-950/70 border border-rose-500/40 rounded-xl space-y-3 flex flex-col justify-between hover:border-rose-500/70 transition-all">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <Wine className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">Tavern Social & Wagers</h4>
              <span className="text-[10px] text-slate-400 font-mono">Drunk Seppo & Coin Betting</span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-950 text-rose-300 border border-rose-800">
            Gold: {playerGold}g
          </span>
        </div>

        {/* In-Tab Interactive Simulator */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Live In-Tab Coin Flip & Drink Simulator:
          </span>

          {inlineCoinResult && (
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-center font-bold text-amber-300 text-[11px] animate-in fade-in">
              {inlineCoinResult}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleInlineCoinFlip('heads')}
              className="py-2.5 px-3 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Bet Heads (25g)</span>
            </button>
            <button
              onClick={() => handleInlineCoinFlip('tails')}
              className="py-2.5 px-3 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Bet Tails (25g)</span>
            </button>
          </div>

          <button
            onClick={handleInlineBuyDrink}
            className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Wine className="w-3.5 h-3.5" />
            <span>Buy Round: Drunken Cheer (+15% Crit)</span>
          </button>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            id="btn-launch-tavern-gamble-test"
            onClick={handleLaunchTavernGamble}
            className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Foreground Modal</span>
          </button>
          <button
            onClick={handleGrantTavernGold}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Grant +100 Gold"
          >
            +100 Gold 💰
          </button>
        </div>
      </div>
    </div>
  );
};
