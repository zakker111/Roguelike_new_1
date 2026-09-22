import React from 'react';
import { X } from 'lucide-react';
import { NPC } from '../../../types';

export interface TradeHeaderBarProps {
  activeNpc?: NPC;
  activeRole: string;
  onExit: () => void;
}

export const TradeHeaderBar: React.FC<TradeHeaderBarProps> = ({
  activeNpc,
  activeRole,
  onExit
}) => {
  return (
    <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center bg-slate-950/30 p-3 rounded-lg border border-slate-850">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏪</span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
            {activeNpc?.name || 'Town Armorer'}'s Trading Counter
          </h3>
          <p className="text-[11px] text-slate-400">
            Role: <strong className="text-emerald-400 capitalize">{activeRole.replace('npc_', '') || 'Merchant'}</strong> | Closes at night (8:00 PM - 8:00 AM)
          </p>
        </div>
      </div>
      <button
        onClick={onExit}
        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-100 rounded cursor-pointer transition-all border border-slate-700 flex items-center gap-1.5"
      >
        <X className="w-3.5 h-3.5" />
        <span>Exit Trading</span>
      </button>
    </div>
  );
};
