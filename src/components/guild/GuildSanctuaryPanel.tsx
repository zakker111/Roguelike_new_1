import React from 'react';
import { GUILD_DECORS, GuildDecor } from '../../utils/tradeEconomy';
import { GuildSanctuaryPanelProps } from './types';

export const GuildSanctuaryPanel: React.FC<GuildSanctuaryPanelProps> = ({
  gameState,
  guildOwned,
  handleBuyDecor,
}) => {
  if (!guildOwned) return null;

  return (
    <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sanctuary Custom Installments & Trophies</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUILD_DECORS.map((decor: GuildDecor) => {
          const purchased = gameState.guildSanctuary?.includes(decor.id);
          return (
            <div key={decor.id} className="bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 flex justify-between items-start">
              <div className="flex gap-3 items-start">
                <span className="text-3xl p-1 bg-slate-900 border border-slate-800 rounded-lg">{decor.icon}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-200 text-xs">{decor.name}</span>
                  <span className="text-[10px] text-slate-450 font-mono">{decor.desc}</span>
                  <span className="text-[9px] font-bold text-purple-400 mt-1 font-sans">{decor.bonusText}</span>
                </div>
              </div>
              <button
                disabled={purchased || gameState.playerStats.gold < decor.costGold}
                onClick={() => handleBuyDecor(decor)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-bold shrink-0 font-sans ${
                  purchased
                    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40'
                    : (gameState.playerStats.gold >= decor.costGold ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed')
                }`}
              >
                {purchased ? 'Installed ✔' : `Install: ${decor.costGold}g`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
