import React from 'react';
import { GuildSubTab } from './types';
import { Castle, Sparkles, Send, ShieldCheck, Warehouse } from 'lucide-react';

interface GuildHeaderBarProps {
  activeSubTab: GuildSubTab;
  setActiveSubTab: (tab: GuildSubTab) => void;
  guildOwned: boolean;
}

export const GuildHeaderBar: React.FC<GuildHeaderBarProps> = ({
  activeSubTab,
  setActiveSubTab,
  guildOwned,
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center border-b border-slate-800/90 pb-3.5 mb-4 select-none gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400 shadow-inner">
          <Castle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-100 font-sans">
              Sunder Guild Headquarters & Wilderness Strongholds
            </h2>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              guildOwned 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              {guildOwned ? 'HQ CHARTERED' : 'UNESTABLISHED'}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
            Modular research laboratories, sanctuary trophies, autonomous follower expeditions & safehouse storage.
          </p>
        </div>
      </div>
      
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 font-sans bg-slate-950/80 p-1 rounded-xl border border-slate-850">
        <button 
          id="guild-tab-hq"
          onClick={() => setActiveSubTab('hq')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
            activeSubTab === 'hq' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Castle className="w-3 h-3" />
          <span>Guild HQ</span>
        </button>
        <button 
          id="guild-tab-sanctuary"
          disabled={!guildOwned}
          onClick={() => setActiveSubTab('sanctuary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            !guildOwned 
              ? 'opacity-30 cursor-not-allowed text-slate-600' 
              : (activeSubTab === 'sanctuary' ? 'bg-purple-600 text-white shadow-md cursor-pointer' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer')
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Sanctuary Decor</span>
        </button>
        <button 
          id="guild-tab-dispatch"
          disabled={!guildOwned}
          onClick={() => setActiveSubTab('dispatch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            !guildOwned 
              ? 'opacity-30 cursor-not-allowed text-slate-600' 
              : (activeSubTab === 'dispatch' ? 'bg-purple-600 text-white shadow-md cursor-pointer' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer')
          }`}
        >
          <Send className="w-3 h-3" />
          <span>Follower Dispatch</span>
        </button>
        <button 
          id="guild-tab-factions"
          disabled={!guildOwned}
          onClick={() => setActiveSubTab('factions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            !guildOwned 
              ? 'opacity-30 cursor-not-allowed text-slate-600' 
              : (activeSubTab === 'factions' ? 'bg-purple-600 text-white shadow-md cursor-pointer' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer')
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Factions & Blueprints</span>
        </button>
        <button 
          id="guild-tab-stash"
          onClick={() => setActiveSubTab('stash')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
            activeSubTab === 'stash' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Warehouse className="w-3 h-3" />
          <span>Safehouse Storage</span>
        </button>
      </div>
    </div>
  );
};
export default GuildHeaderBar;
