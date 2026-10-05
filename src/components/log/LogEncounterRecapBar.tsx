/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Swords, Shield, Heart, Coins, Trophy, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { GameLogMessage } from '../../types';
import { EncounterTally } from './types';

interface LogEncounterRecapBarProps {
  logs: GameLogMessage[];
}

export function computeEncounterTally(logs: GameLogMessage[]): EncounterTally {
  let damageDealt = 0;
  let damageTaken = 0;
  let damageBlocked = 0;
  let enemiesDefeated = 0;
  let goldLooted = 0;
  let itemsLooted = 0;
  let lastCombatTime = '';

  // Look back through the last 40 logs for combat and loot events
  const recentLogs = logs.slice(-40);

  recentLogs.forEach((log) => {
    const text = typeof log.text === 'string' ? log.text : String(log.text || '');
    const textLower = text.toLowerCase();

    // Damage Dealt: e.g. "You struck Goblin Raider for [14 DMG]" or "cleaved for 20 damage"
    if (textLower.includes('you struck') || textLower.includes('you cleaved') || textLower.includes('you hit') || textLower.includes('cast')) {
      const dmgMatch = text.match(/\[?(\d+)\s*(?:dmg|damage)/i);
      if (dmgMatch) {
        damageDealt += parseInt(dmgMatch[1], 10);
        lastCombatTime = log.timestamp || lastCombatTime;
      }
    }

    // Damage Taken: e.g. "Goblin Raider struck you for [8 DMG]"
    if (textLower.includes('struck you') || textLower.includes('you took') || textLower.includes('damaged you')) {
      const dmgMatch = text.match(/\[?(\d+)\s*(?:dmg|damage)/i);
      if (dmgMatch) {
        damageTaken += parseInt(dmgMatch[1], 10);
        lastCombatTime = log.timestamp || lastCombatTime;
      }
    }

    // Blocked: e.g. "Braced! Blocked [6 DMG]"
    if (textLower.includes('blocked') || textLower.includes('braced')) {
      const blockMatch = text.match(/blocked\s*\[?(\d+)/i);
      if (blockMatch) {
        damageBlocked += parseInt(blockMatch[1], 10);
      }
    }

    // Defeated: e.g. "You defeated Goblin Raider" or "slain"
    if (textLower.includes('defeated') || textLower.includes('was slain') || textLower.includes('slayed')) {
      enemiesDefeated += 1;
    }

    // Gold Looted: e.g. "Acquired [12 Gold]" or "picked up 15 gold"
    if (textLower.includes('gold') && (textLower.includes('acquired') || textLower.includes('picked up') || textLower.includes('looted') || textLower.includes('bribe'))) {
      const goldMatch = text.match(/(\d+)\s*gold/i);
      if (goldMatch) {
        goldLooted += parseInt(goldMatch[1], 10);
      }
    }

    // Items Looted
    if (log.type === 'loot' && !textLower.includes('gold')) {
      itemsLooted += 1;
    }
  });

  return {
    damageDealt,
    damageTaken,
    damageBlocked,
    enemiesDefeated,
    goldLooted,
    itemsLooted,
    lastCombatTime,
  };
}

export const LogEncounterRecapBar: React.FC<LogEncounterRecapBarProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const tally = useMemo(() => computeEncounterTally(logs), [logs]);

  // Don't show if zero recent combat action
  if (tally.damageDealt === 0 && tally.damageTaken === 0 && tally.enemiesDefeated === 0) {
    return null;
  }

  const handleCopyRecap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const summary = `⚔️ Encounter Recap (${tally.lastCombatTime || 'Recent'}):\n• Damage Dealt: ${tally.damageDealt} DMG\n• Damage Taken: ${tally.damageTaken} DMG (Blocked: ${tally.damageBlocked})\n• Enemies Slain: ${tally.enemiesDefeated}\n• Gold Acquired: ${tally.goldLooted}🪙\n• Items Looted: ${tally.itemsLooted}📦`;
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 px-3 py-1.5 transition-all text-xs font-mono select-none">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Toggle & Quick Stat Pills */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left cursor-pointer hover:text-slate-100 transition-colors"
        >
          <span className="flex items-center gap-1 font-bold text-amber-400 text-[11px] uppercase tracking-wider">
            <Swords className="w-3.5 h-3.5" />
            <span>Encounter Recap</span>
          </span>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 text-[10px] text-slate-300">
            <span className="flex items-center gap-1 text-amber-300">
              <span className="text-[10px]">⚔️</span>
              <span>{tally.damageDealt} dealt</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-rose-300">
              <Heart className="w-2.5 h-2.5 text-rose-500" />
              <span>{tally.damageTaken} taken</span>
            </span>
            {tally.enemiesDefeated > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-purple-300 font-bold">
                  <Trophy className="w-2.5 h-2.5 text-purple-400" />
                  <span>{tally.enemiesDefeated} slain</span>
                </span>
              </>
            )}
          </div>

          {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
        </button>

        {/* Copy recap button */}
        <button
          onClick={handleCopyRecap}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors px-2 py-0.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
          title="Copy formatted combat summary to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Recap</span>
            </>
          )}
        </button>
      </div>

      {/* Expanded Details Pane */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] animate-fade-in text-slate-300">
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Total Dealt:</span>
            <span className="font-bold text-amber-300">{tally.damageDealt} DMG</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Mitigated:</span>
            <span className="font-bold text-teal-300">{tally.damageBlocked} DMG</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Gold Spoils:</span>
            <span className="font-bold text-yellow-300">{tally.goldLooted}🪙</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
            <span className="text-slate-400">Items Looted:</span>
            <span className="font-bold text-emerald-300">{tally.itemsLooted} items</span>
          </div>
        </div>
      )}
    </div>
  );
};
