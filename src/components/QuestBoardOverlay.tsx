import React from 'react';
import { X, ClipboardList, Coins, CheckCircle, Award, Flame, RefreshCw } from 'lucide-react';
import { GameState, Quest } from '../types';
import { DEFAULT_QUESTS } from '../utils/questData';
import { QuestEngine } from '../engine/quests';

interface QuestBoardOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  onAcceptQuest: (questId: string) => void;
  onTurnInQuest: (questId: string) => void;
}

function getRenownTier(reputation: number) {
  if (reputation <= 20) {
    return {
      title: "Sunder Outlaw",
      color: "text-rose-450",
      badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      description: "Wanted posters are up! Town merchants refuse to trade with you, and town guards are permanently hostile.",
      icon: "🚨",
      progressColor: "bg-rose-600"
    };
  } else if (reputation <= 50) {
    return {
      title: "Wandering Mercenary",
      color: "text-sky-400",
      badgeBg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
      description: "Standard trade rates are active. Pinned notices on the quest board are available for gold rewards.",
      icon: "⚔️",
      progressColor: "bg-sky-500"
    };
  } else if (reputation <= 80) {
    return {
      title: "Honored Protector",
      color: "text-emerald-400",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      description: "Known peacekeeper! Unlocks an automatic 10% discount on vendor goods, and hired tavern mercenaries scale in level.",
      icon: "🛡️",
      progressColor: "bg-emerald-500"
    };
  } else {
    return {
      title: "Champion of Sunder",
      color: "text-amber-400",
      badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      description: "Permanent 20% trade discount, elite legendary vendor stock active, and elite heavy-plate city guards are hireable!",
      icon: "🏆",
      progressColor: "bg-amber-500"
    };
  }
}

function getCategoryBadge(category?: string) {
  switch (category) {
    case 'bounty':
      return { icon: '🎯', label: 'Bounty', color: 'text-rose-400 border-rose-500/30 bg-rose-950/40' };
    case 'beast_hunt':
      return { icon: '🐺', label: 'Beast Hunt', color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' };
    case 'relic_delve':
      return { icon: '🏺', label: 'Relic Delve', color: 'text-purple-400 border-purple-500/30 bg-purple-950/40' };
    case 'supply_requisition':
      return { icon: '📦', label: 'Requisition', color: 'text-sky-400 border-sky-500/30 bg-sky-950/40' };
    case 'faction_skirmish':
      return { icon: '⚔️', label: 'Faction War', color: 'text-red-400 border-red-500/30 bg-red-950/40' };
    default:
      return { icon: '📜', label: 'Town Notice', color: 'text-amber-300 border-amber-500/20 bg-amber-950/30' };
  }
}

function getDifficultyBadge(diff?: string) {
  switch (diff) {
    case 'novice':
      return 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30';
    case 'adept':
      return 'bg-sky-950/60 text-sky-400 border border-sky-500/30';
    case 'veteran':
      return 'bg-amber-950/60 text-amber-400 border border-amber-500/30';
    case 'master':
      return 'bg-purple-950/60 text-purple-400 border border-purple-500/30';
    case 'legendary':
      return 'bg-rose-950/60 text-rose-400 border border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

export default function QuestBoardOverlay({
  gameState,
  setGameState,
  onClose,
  onAcceptQuest,
  onTurnInQuest
}: QuestBoardOverlayProps) {
  const activeTownName = "Oakhaven Hamlet";
  const reputation = gameState.townReputation !== undefined ? gameState.townReputation : 100;
  const currentTier = getRenownTier(reputation);

  // Initialize or check quests with radiant replenishment
  React.useEffect(() => {
    if (gameState.quests.length === 0) {
      const context = {
        playerLevel: gameState.playerStats?.level || 1,
        currentChunkX: gameState.currentChunkX || 0,
        currentChunkY: gameState.currentChunkY || 0,
        townName: activeTownName,
        townReputation: reputation,
      };
      const replenished = QuestEngine.getInstance().replenishTownBoard(DEFAULT_QUESTS, context, 4);
      setGameState(prev => ({ ...prev, quests: replenished }));
    }
  }, [gameState.quests, setGameState, gameState.playerStats?.level, gameState.currentChunkX, gameState.currentChunkY, reputation]);

  // Close quest board on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleRefreshBoard = () => {
    const context = {
      playerLevel: gameState.playerStats?.level || 1,
      currentChunkX: gameState.currentChunkX || 0,
      currentChunkY: gameState.currentChunkY || 0,
      townName: activeTownName,
      townReputation: reputation,
    };
    setGameState(prev => {
      const availableCount = prev.quests.filter(q => q.status === 'available').length;
      const replenished = QuestEngine.getInstance().replenishTownBoard(prev.quests, context, availableCount + 2);
      return { ...prev, quests: replenished };
    });
  };

  const handleAcceptQuest = onAcceptQuest;
  const handleTurnInQuest = onTurnInQuest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs text-left">
      <div 
        id="questboard-modal"
        className="bg-slate-900 border border-amber-600/30 rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-amber-900/10">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-amber-200">Town Square Quest Board</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshBoard}
              title="Post fresh radiant notices"
              className="text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-950/50 border border-amber-600/30 hover:bg-amber-900/50 cursor-pointer text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Post Notices</span>
            </button>
            <button 
              id="close-quest-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow p-5 overflow-y-auto space-y-4">
          
          {/* Renown Progression Dashboard */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Your Sunder Renown</span>
                <h3 className={`text-base font-black tracking-wide flex items-center gap-1.5 mt-0.5 ${currentTier.color}`}>
                  <span>{currentTier.icon}</span>
                  <span>{currentTier.title}</span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Reputation</span>
                <p className="text-sm font-bold font-mono text-slate-100 mt-0.5">{Math.round(reputation)} / 100</p>
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/40 relative">
              <div className={`h-full ${currentTier.progressColor} transition-all duration-300`} style={{ width: `${reputation}%` }} />
              {/* Markers */}
              <div className="absolute left-[20%] top-0 w-0.5 h-full bg-slate-950/40" title="Outlaw Limit" />
              <div className="absolute left-[50%] top-0 w-0.5 h-full bg-slate-950/40" title="Mercenary Limit" />
              <div className="absolute left-[80%] top-0 w-0.5 h-full bg-slate-950/40" title="Protector Limit" />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
              {currentTier.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Crime increases hostility</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Quests increase reputation</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono block mt-2">Pinned Notices at {activeTownName}:</span>
          
          <div className="space-y-4 font-sans">
            {gameState.quests.map((q) => {
              // Hide specialized outlaw pardon if they are not an outlaw
              if (q.id === 'q_outlaw_pardon' && reputation > 20) return null;
              
              // Hide high-reputation quests if their reputation is too low
              if (q.id === 'q_mithril_heist' && reputation <= 20) return null;

              return (
                <div 
                  key={q.id} 
                  className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                    q.status === 'turned_in' 
                      ? 'bg-slate-900/30 border-slate-800/40 opacity-50' 
                      : q.status === 'active'
                        ? 'bg-slate-900 border-amber-600/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Header title & category badges */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(() => {
                          const cat = getCategoryBadge(q.category);
                          return (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${cat.color}`}>
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </span>
                          );
                        })()}
                        {q.difficulty && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${getDifficultyBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        )}
                        {q.isRadiant && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                            Radiant
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-100 text-[13px] mt-0.5">{q.title}</h4>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                      q.status === 'turned_in'
                        ? 'bg-slate-950 text-slate-500'
                        : q.status === 'completed'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : q.status === 'active'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-950 text-amber-400 border border-amber-500/10'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  {/* Description text */}
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                    {q.description}
                  </p>

                  {/* Rewards specs / targets */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-800/50 pt-2.5 text-[10px] font-mono text-slate-500">
                    {q.rewardGold > 0 && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Reward: <strong className="text-white">{q.rewardGold}g</strong></span>
                      </span>
                    )}

                    {q.rewardXp ? (
                      <span className="flex items-center gap-1 text-sky-400">
                        <span>XP: <strong>+{q.rewardXp}</strong></span>
                      </span>
                    ) : null}
                    
                    {/* Reputation reward notice */}
                    {q.id !== 'q_outlaw_pardon' && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reputation: <strong>+{q.id === 'q_iron_gather' ? 15 : (q.id === 'q_apothecary_supply' ? 12 : (q.id === 'q_mithril_heist' ? 25 : (q.rewardGold >= 100 ? 25 : q.rewardGold >= 50 ? 20 : 10)))}</strong></span>
                      </span>
                    )}

                    {q.id === 'q_iron_gather' && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <span>Needs: <strong className="text-slate-200">{q.targetCount || 3}x Scrap Iron alloys</strong></span>
                      </span>
                    )}
                    {q.id === 'q_apothecary_supply' && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <span>Needs: <strong className="text-slate-200">{q.targetCount || 3}x Wild Berries</strong></span>
                      </span>
                    )}
                    {q.id === 'q_mithril_heist' && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <span>Needs: <strong className="text-slate-200">{q.targetCount || 3}x Mithril alloys</strong></span>
                      </span>
                    )}
                    {q.id === 'q_outlaw_pardon' && (
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <span>Cost: <strong className="text-rose-300">{q.targetCount || 200} Gold coins</strong></span>
                      </span>
                    )}
                    {q.isRadiant && q.targetItem && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <span>
                          Target: <strong className="text-amber-300">{q.targetCount ? `${q.targetCount}x ` : ''}{q.targetItem}</strong>
                          {(q.status === 'active' || q.status === 'completed') && q.type === 'encounter' && q.targetCount && (
                            <span className="ml-1.5 text-emerald-400 font-bold">
                              ({Math.min(q.targetCount, q.currentProgress || 0)}/{q.targetCount})
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                    {q.targetChunkX !== undefined && q.targetChunkY !== undefined && (
                      <span className="flex items-center gap-1 text-rose-300">
                        <span>Coords: <strong>[{q.targetChunkX}, {q.targetChunkY}]</strong></span>
                      </span>
                    )}
                    {q.type === 'encounter' && !q.isRadiant && (
                      <span className="flex items-center gap-1 text-rose-450">
                        <span>
                          Targets: <strong className="text-rose-400">{q.targetCount || 3}x Hostiles</strong>
                          {(q.status === 'active' || q.status === 'completed') && (
                            <span className="ml-1.5 text-emerald-400 font-bold">
                              ({Math.min(q.targetCount || 3, q.currentProgress || 0)}/{q.targetCount || 3})
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Button controls */}
                  <div className="mt-2.5 flex justify-end">
                    {q.status === 'available' && (
                      <button
                        onClick={() => handleAcceptQuest(q.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold uppercase rounded cursor-pointer duration-150 transition-colors"
                      >
                        Accept Notice
                      </button>
                    )}
                    {(q.status === 'active' || q.status === 'completed') && (
                      <button
                        onClick={() => handleTurnInQuest(q.id)}
                        className={`px-3 py-1.5 text-slate-950 text-[10px] font-bold uppercase rounded cursor-pointer duration-150 transition-colors flex items-center gap-1 ${
                          q.status === 'completed'
                            ? 'bg-emerald-400 hover:bg-emerald-300 ring-2 ring-emerald-400/40'
                            : 'bg-emerald-500 hover:bg-emerald-400'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{q.status === 'completed' ? 'Claim Reward' : 'Claim / Turn In'}</span>
                      </button>
                    )}
                    {q.status === 'turned_in' && (
                      <span className="text-[10px] text-emerald-500 font-mono italic flex items-center gap-1">
                        ✓ Bounty Rewards Claimed
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-850 p-4 bg-slate-950/40 text-[10px] text-slate-500 text-center font-mono">
          Gold can be used to hire companions or buy high-grade armor!
        </div>

      </div>
    </div>
  );
}
