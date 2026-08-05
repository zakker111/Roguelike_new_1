import React from 'react';
import { GameState } from '../../types';
import { COMPANION_QUEST_BOARD } from '../../utils/tradeEconomy';
import { ChevronRight } from 'lucide-react';

interface GuildMissionBoardProps {
  gameState: GameState;
  selectedFollowerId: string;
  setSelectedFollowerId: (id: string) => void;
  selectedQuestId: string;
  setSelectedQuestId: (id: string) => void;
  handleDispatchFollower: () => void;
  handleClaimDispatchRewards: (followerId: string) => void;
}

export const GuildMissionBoard: React.FC<GuildMissionBoardProps> = ({
  gameState,
  selectedFollowerId,
  setSelectedFollowerId,
  selectedQuestId,
  setSelectedQuestId,
  handleDispatchFollower,
  handleClaimDispatchRewards,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Mission ledger */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wilderness Autonomous Dispatch Quests Ledger</h3>
          <div className="flex flex-col gap-2">
            {COMPANION_QUEST_BOARD.map((mission) => {
              const isSelected = selectedQuestId === mission.id;
              const expeditionRank = gameState.guildUpgrades?.['up_expeditions'] || 0;
              const speedMultiplier = 1.0 - expeditionRank * 0.25;
              const dynamicTurns = Math.max(10, Math.round(mission.turnsRequired * speedMultiplier));

              return (
                <div 
                  key={mission.id} 
                  onClick={() => setSelectedQuestId(mission.id)}
                  className={`bg-slate-950/40 border p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                    isSelected ? 'border-purple-500 bg-purple-950/10' : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 max-w-[450px]">
                    <span className="font-bold text-slate-200 text-xs">{mission.title}</span>
                    <span className="text-[10px] text-slate-450 leading-relaxed font-mono mt-0.5">{mission.desc}</span>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-slate-500">
                      <span>⏳ Duration: <strong className="text-slate-350">{dynamicTurns} Turns</strong></span>
                      <span>🪙 Gold Reward: <strong className="text-amber-400">+{mission.rewardGold}g</strong></span>
                      <span>🌟 XP: <strong className="text-emerald-400">+{mission.rewardXp}</strong></span>
                      {mission.rewardMaterials && (
                        <span className="text-purple-400 font-sans">
                          🎁 Loot: {Object.entries(mission.rewardMaterials).map(([matId, qty]) => `${qty}x ${matId.replace('mat_', '').toUpperCase()}`).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-all ${isSelected ? 'transform rotate-90 text-purple-400' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Idle companions & dispatch actions */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready Companion Staff</h3>
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-[10px] font-sans text-slate-300">
              <label className="font-bold">1. Select Companion:</label>
              <select
                value={selectedFollowerId}
                onChange={(e) => setSelectedFollowerId(e.target.value)}
                className="bg-slate-900 border border-slate-800 p-2 text-[10.5px] rounded text-slate-200 font-mono mt-1 w-full"
              >
                <option value="">-- Choose standby Follower --</option>
                {gameState.followers.filter(f => f.hp > 0).map(f => {
                  const isDispatched = gameState.activeCompanionQuests?.some(q => q.followerId === f.id);
                  return (
                    <option key={f.id} value={f.id} disabled={isDispatched}>
                      {f.name} {isDispatched ? '(Dispatched ⚔️)' : `(Idle - Level ${f.level})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleDispatchFollower}
              disabled={!selectedFollowerId || !selectedQuestId}
              className={`mt-2 w-full py-2.5 text-[11px] font-bold rounded-lg shadow-md transition-all ${
                selectedFollowerId && selectedQuestId
                  ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              Dispatch Expedition
            </button>

            {/* Active scouts list */}
            <div className="mt-3.5 border-t border-slate-850 pt-3.5 flex flex-col gap-2.5">
              <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Current active expeditions:</span>
              {gameState.activeCompanionQuests && gameState.activeCompanionQuests.length > 0 ? (
                gameState.activeCompanionQuests.map((quest) => {
                  const companion = gameState.followers.find(f => f.id === quest.followerId);
                  const turnsLeft = quest.durationTurns;
                  return (
                    <div key={quest.followerId} className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-[10px] font-mono flex justify-between items-center animate-fade-in">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200">{companion?.name}</span>
                        <span className="text-[9px] text-slate-500">{quest.title}</span>
                        <span className="text-[9.5px] text-purple-400 font-bold mt-0.5">
                          {turnsLeft > 0 ? `⏳ Steps Left: ${turnsLeft}` : '✅ Completed! Ready for claim.'}
                        </span>
                      </div>
                      {turnsLeft <= 0 && (
                        <button
                          onClick={() => handleClaimDispatchRewards(quest.followerId)}
                          className="px-2.5 py-1 bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 border border-emerald-800/50 rounded font-bold text-[9.5px]"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-[9.5px] italic text-slate-600 font-mono">No companions currently dispatched on wilderness missions.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
