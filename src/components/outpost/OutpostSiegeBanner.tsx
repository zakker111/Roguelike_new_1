/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { OverworldChunk } from '../../types';
import { getFactionDisplayName } from '../../world/outposts/territoryEngine';

export interface OutpostSiegeBannerProps {
  currentChunk?: OverworldChunk;
  onOpenQuartermaster?: () => void;
}

export const OutpostSiegeBanner: React.FC<OutpostSiegeBannerProps> = ({
  currentChunk,
  onOpenQuartermaster
}) => {
  if (!currentChunk || !currentChunk.watchtower) return null;

  const wt = currentChunk.watchtower;
  const isSiege = wt.siegeState?.isUnderSiege;

  if (isSiege) {
    const attackerName = getFactionDisplayName(wt.siegeState!.attacker);
    const defenderName = getFactionDisplayName(wt.siegeState!.defender);
    const bounty = wt.siegeState!.bountyGold || 200;
    const timeLeft = wt.siegeState!.siegeTimerSeconds ?? 120;

    return (
      <div className="bg-red-950/80 border border-red-500/50 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-md flex items-center justify-between text-xs animate-pulse">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚔️</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-300 uppercase tracking-wide">
                Frontier Outpost Under Siege!
              </span>
              <span className="text-[10px] bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded border border-red-700/50">
                {timeLeft}s remaining
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {defenderName} holding out against attacking {attackerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-amber-400 bg-black/40 px-2 py-1 rounded border border-amber-500/30">
            🏆 Bounty: {bounty}g
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Defeat attackers to liberate!
          </span>
        </div>
      </div>
    );
  }

  // If outpost has a quartermaster and is claimed
  if (wt.quartermaster && onOpenQuartermaster) {
    const qm = wt.quartermaster;
    const factionName = getFactionDisplayName(qm.factionId);

    return (
      <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2 shadow-lg backdrop-blur-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🏰</span>
          <div>
            <span className="font-bold text-slate-200">
              Fortified Outpost · Controlled by {factionName}
            </span>
            <span className="text-slate-400 text-[11px] ml-2">
              Quartermaster: {qm.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {qm.bountyClaimAvailable && (
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
              🏆 BOUNTY UNCLAIMED
            </span>
          )}
          <button
            onClick={onOpenQuartermaster}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-colors shadow"
          >
            Visit Quartermaster 🛍️
          </button>
        </div>
      </div>
    );
  }

  return null;
};
