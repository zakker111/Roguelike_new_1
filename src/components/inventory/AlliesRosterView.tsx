/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Follower } from '../../types';
import {
  isSpecialCat,
  getStandardFollowerCount,
  getSpecialCatFollowerCount,
  SPECIAL_CAT_NAMES,
  SPECIAL_CATS_DATA,
  SpecialCatName
} from '../../utils/specialCats';
import { Heart, Sparkles, Shield, Swords, Award } from 'lucide-react';

export interface AlliesRosterViewProps {
  followers?: Follower[];
  foundCats?: string[];
  hasCatLover?: boolean;
  onInspectFollower: (followerId: string) => void;
  playSound: (soundId: string) => void;
}

export const AlliesRosterView: React.FC<AlliesRosterViewProps> = ({
  followers = [],
  foundCats = [],
  hasCatLover = false,
  onInspectFollower,
  playSound,
}) => {
  const safeFollowers = Array.isArray(followers) ? followers.filter(Boolean) : [];
  const safeFoundCats = Array.isArray(foundCats) ? foundCats : [];

  const stdCount = getStandardFollowerCount(safeFollowers);
  const catCount = getSpecialCatFollowerCount(safeFollowers);

  // Determine which special cats have been found or are in party
  const foundSet = new Set<string>(safeFoundCats);
  safeFollowers.forEach((f) => {
    if (isSpecialCat(f) && f?.name) {
      const cleanName = f.name.replace(/^[🐈🐱🛡️⚔️🏹\s]+/, '').split(' (')[0].trim();
      for (const catName of SPECIAL_CAT_NAMES) {
        if (cleanName.includes(catName) || f.name.includes(catName)) {
          foundSet.add(catName);
        }
      }
    }
  });

  const allCatsFound = SPECIAL_CAT_NAMES.every((name) => foundSet.has(name));

  return (
    <div className="flex flex-col gap-3 font-sans">
      {/* Capacity & Special Cats Status Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">👥 Party Roster</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {stdCount} / 3 Standard Slots
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
            <span>🐈 {catCount} Special Feline{catCount !== 1 ? 's' : ''} (Free Slots)</span>
          </span>
        </div>

        {/* 4 Special Cats Reunion Tracker */}
        <div className="border-t border-slate-850 pt-2 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Legendary Special Cats ({foundSet.size}/4 Found)</span>
            </span>
            {allCatsFound || hasCatLover ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[9px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                <Award className="w-3 h-3 text-emerald-400" /> Cat Lover Active (+10 Lck, +15 HP, +5 Def)
              </span>
            ) : (
              <span className="text-slate-500 text-[9px] italic">
                Find all 4 in towns to unlock the Cat Lover trait!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-0.5">
            {SPECIAL_CAT_NAMES.map((name: SpecialCatName) => {
              const data = SPECIAL_CATS_DATA[name];
              if (!data) return null;
              const isFound = foundSet.has(name);
              const isInParty = safeFollowers.some(
                (f) => f && isSpecialCat(f) && (f.name || '').includes(name)
              );

              return (
                <div
                  key={name}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    isInParty
                      ? 'bg-amber-950/30 border-amber-600/60 ring-1 ring-amber-500/30'
                      : isFound
                      ? 'bg-slate-900/60 border-slate-700'
                      : 'bg-slate-950/40 border-slate-850 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{data.char}</span>
                    <span
                      className={`text-[8px] font-mono font-bold px-1 rounded ${
                        isInParty
                          ? 'bg-amber-500 text-slate-950'
                          : isFound
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {isInParty ? 'IN PARTY' : isFound ? 'FOUND' : 'SEEKING'}
                    </span>
                  </div>
                  <div className="font-bold text-[11px] text-slate-200 mt-0.5 truncate" style={{ color: data.color }}>
                    {name}
                  </div>
                  <div className="text-[8.5px] text-slate-400 truncate">
                    {data.temperament ? data.temperament.split('&')[0].trim() : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Followers List */}
      {safeFollowers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          {safeFollowers.map((f) => {
            if (!f) return null;
            const isCat = isSpecialCat(f);
            const cleanName = (f.name || '').replace(/^[🐈🐱🛡️⚔️🏹\s]+/, '').split(' (')[0].trim();
            const matchedCat = SPECIAL_CAT_NAMES.find((c) => cleanName.includes(c) || (f.name || '').includes(c));
            const catInfo = matchedCat ? SPECIAL_CATS_DATA[matchedCat] : null;

            return (
              <div
                key={f.id}
                className={`bg-slate-950 border p-3 rounded-xl flex flex-col justify-between transition-all text-xs ${
                  isCat
                    ? 'border-amber-600/40 hover:border-amber-500/70 shadow-sm'
                    : 'border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold border text-white font-mono shadow-inner shrink-0"
                      style={{
                        backgroundColor: `${f.color || '#60a5fa'}20`,
                        borderColor: f.color || '#fb923c'
                      }}
                    >
                      {f.char || (isCat ? '🐈' : '👤')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-xs block">{f.name || 'Companion'}</span>
                        {isCat && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            SPECIAL CAT (FREE)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-[9px] text-slate-400 font-mono mt-0.5">
                        <span>LVL {f.level || 1}</span>
                        <span>•</span>
                        <span className="capitalize text-emerald-400 font-bold">
                          {isCat ? 'Special Companion' : f.archetypeId || 'ally'}
                        </span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 inline" /> {f.hp || 0}/{f.maxHp || 1} HP
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800">
                    {f.mode || 'FIGHT'}ING
                  </span>
                </div>

                {/* Special Cat Perk or Companion Info */}
                {catInfo && (
                  <div className="mt-2 p-1.5 rounded bg-amber-950/20 border border-amber-800/30 text-[9.5px] text-amber-200/90 leading-tight">
                    <span className="font-bold text-amber-400">🐾 {catInfo.specialPerk}</span>
                  </div>
                )}

                {/* Quick Combat Stats */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900 text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Swords className="w-3 h-3" />
                    <span>Attack: {f.atk || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <Shield className="w-3 h-3" />
                    <span>Defense: {f.def || 0}</span>
                  </div>
                </div>

                <div className="flex gap-1.5 border-t border-slate-900 mt-2.5 pt-2">
                  <button
                    onClick={() => {
                      playSound('click');
                      onInspectFollower(f.id);
                    }}
                    className={`flex-grow py-1.5 font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all hover:scale-[1.01] text-center shadow-sm ${
                      isCat
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    Inspect & Interact 🐾
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-slate-600 italic bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">👥 🐈</span>
          <span>
            No companions currently in your active group.
          </span>
          <span className="text-[10px] text-slate-500">
            Mercenaries can be hired at town taverns, and legendary special cats can be befriended in castle towns!
          </span>
        </div>
      )}
    </div>
  );
};
