import React from 'react';

export interface TavernServiceStationProps {
  onBuyRumor: () => void;
  onTavernRest: () => void;
  onHireMercenary: (type: 'novice' | 'veteran' | 'champion' | 'merchant_guard') => void;
}

export const TavernServiceStation: React.FC<TavernServiceStationProps> = ({
  onBuyRumor,
  onTavernRest,
  onHireMercenary
}) => {
  return (
    <div className="mb-4 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center text-left text-[11px] border-b border-amber-950/40 pb-2.5 gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide">🍻 Tavern Master — Rumor Mongering & Gossip</h4>
          <p className="text-[10px] text-slate-400">Buy a round for the bartender to gain valuable coordinates of wild riches.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onBuyRumor}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            🍺 Buy Gossip Round <span className="text-[9px] text-amber-900">(40g)</span>
          </button>
          <button
            onClick={onTavernRest}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-100 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            🛏️ Rent Cozy Room <span className="text-[9px] text-amber-200">(15g)</span>
          </button>
        </div>
      </div>

      <div className="text-left text-[11px]">
        <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide mb-2">👥 Wandering Mercenaries For Hire</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Novice Mercenary */}
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sky-400">🗡️ Novice Swordsman</span>
                <span className="text-[9px] font-mono text-slate-400">Lvl 2</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Basic cutthroat. Restores damage swings with 35 HP, +6 ATK.</p>
            </div>
            <button
              onClick={() => onHireMercenary('novice')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
            >
              <span>Hire Novice</span>
              <span className="text-amber-500 font-mono">(180g)</span>
            </button>
          </div>

          {/* Veteran Mercenary */}
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400">⚔️ Veteran Raider</span>
                <span className="text-[9px] font-mono text-slate-400">Lvl 4</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Heavy sellsword. Strong defenses with 55 HP, +9 ATK, 4 DEF.</p>
            </div>
            <button
              onClick={() => onHireMercenary('veteran')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
            >
              <span>Hire Veteran</span>
              <span className="text-amber-500 font-mono">(280g)</span>
            </button>
          </div>

          {/* Champion Gladiator */}
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-400">🏆 Champion Gladiator</span>
                <span className="text-[9px] font-mono text-slate-400">Lvl 6</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Gladiator. Unstoppable tanking with 85 HP, +14 ATK, 7 DEF.</p>
            </div>
            <button
              onClick={() => onHireMercenary('champion')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
            >
              <span>Hire Champion</span>
              <span className="text-amber-500 font-mono">(450g)</span>
            </button>
          </div>

          {/* Merchant Guard */}
          <div className="bg-slate-950/80 border border-purple-500/30 p-2.5 rounded-lg flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-400">💂 Merchant Guard</span>
                <span className="text-[9px] font-mono text-slate-400">Lvl 3</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Outpost defender. Essential for establishing and guarding wilderness safehouses.</p>
            </div>
            <button
              onClick={() => onHireMercenary('merchant_guard')}
              className="w-full py-1 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/20 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
            >
              <span>Hire Guard</span>
              <span className="text-amber-500 font-mono">(250g)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
