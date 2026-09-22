/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Follower } from '../../types';

export interface AlliesRosterViewProps {
  followers: Follower[];
  onInspectFollower: (followerId: string) => void;
  playSound: (soundId: string) => void;
}

export const AlliesRosterView: React.FC<AlliesRosterViewProps> = ({
  followers,
  onInspectFollower,
  playSound,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {followers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          {followers.map((f) => (
            <div
              key={f.id}
              className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all text-xs"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border border-slate-700 text-white font-mono shadow-inner shrink-0"
                    style={{ backgroundColor: `${f.color}20`, borderColor: f.color }}
                  >
                    {f.char || '👤'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 text-xs block">{f.name}</span>
                    <div className="flex gap-2 text-[9px] text-slate-500 font-mono">
                      <span>LVL {f.level}</span>
                      <span>•</span>
                      <span className="capitalize text-emerald-400 font-bold">
                        {f.archetypeId}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800">
                  {f.mode || 'FIGHT'}ING
                </span>
              </div>

              <div className="flex gap-1.5 border-t border-slate-900 mt-3 pt-2.5">
                <button
                  onClick={() => {
                    playSound('click');
                    onInspectFollower(f.id);
                  }}
                  className="flex-grow py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all hover:scale-[1.01] text-center shadow-sm"
                >
                  Inspect & Equip Gear 🛡️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-xs text-slate-600 italic bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
          <span className="text-2xl">👥</span>
          <span>
            No companions in your active group. Recruitment mercenaries can be hired at town taverns!
          </span>
        </div>
      )}
    </div>
  );
};
