import React from 'react';
import { X, ShieldAlert, Zap, Skull, Award, Flame, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';
import { GameState } from '../../types';
import { calculateWorldThreatTier, getThreatTierInfo, getAffixMeta } from '../../utils/worldThreat';
import { playSound } from '../../utils/audio';

export interface WorldThreatModalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export const WorldThreatModal: React.FC<WorldThreatModalProps> = ({
  gameState,
  setGameState,
  onClose,
  addLogMessage
}) => {
  const currentThreatTier = calculateWorldThreatTier(gameState.playerStats, gameState.chaosScore);
  const threatInfo = getThreatTierInfo(currentThreatTier);
  const customBonus = gameState.playerStats.customThreatBonus || 0;

  const handleAdjustBonus = (delta: number) => {
    const nextBonus = Math.max(0, Math.min(10, customBonus + delta));
    if (nextBonus === customBonus) return;

    playSound(delta > 0 ? 'levelup' : 'bump');
    setGameState(prev => {
      const updatedStats = {
        ...prev.playerStats,
        customThreatBonus: nextBonus
      };
      return {
        ...prev,
        playerStats: updatedStats
      };
    });

    const newTier = calculateWorldThreatTier({ ...gameState.playerStats, customThreatBonus: nextBonus }, gameState.chaosScore);
    const newInfo = getThreatTierInfo(newTier);

    if (addLogMessage) {
      if (delta > 0) {
        addLogMessage(`⚡ [ASCENSION ESCALATED]: Custom Threat Tier adjusted to +${nextBonus}! World Threat is now ${newInfo.badgeEmoji} ${newInfo.title} (${Math.round((newInfo.statMultiplier - 1) * 100)}% enemy stats, +${newInfo.xpBonusPct}% XP/Loot)!`, 'danger');
      } else {
        addLogMessage(`🛡️ [ASCENSION REDUCED]: Custom Threat Tier reduced to +${nextBonus}. Current Threat: ${newInfo.title}.`, 'info');
      }
    }
  };

  const activeAffixTypes: ('vampiric' | 'shieldbreaker' | 'venomous' | 'thorns' | 'arcane_pulse' | 'berserker' | 'phasing')[] = [
    'vampiric', 'shieldbreaker', 'venomous', 'thorns', 'arcane_pulse', 'berserker', 'phasing'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${threatInfo.colorClass}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-wide font-serif">
                  World Threat & Eclipse Ascension
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {threatInfo.badgeEmoji} Tier {currentThreatTier}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dynamic realm difficulty scaling & long-run challenge matrix
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('bump'); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Current Threat Tier Card */}
          <div className={`p-4 rounded-xl border ${threatInfo.colorClass} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold tracking-wider uppercase text-xs flex items-center gap-1.5 font-mono">
                <span>{threatInfo.badgeEmoji}</span>
                <span>{threatInfo.title}</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900/60 border border-current">
                {Math.round((threatInfo.statMultiplier - 1) * 100)}% Monster Power Boost
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {threatInfo.description}
            </p>
          </div>

          {/* Long-Run Progression Factors */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Realm Threat Drivers (Long-Run Progression)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Turns Survived</div>
                <div className="text-base font-bold font-mono text-amber-400">
                  {gameState.playerStats.turnsPlayed || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  +{(Math.floor((gameState.playerStats.turnsPlayed || 0) / 180))} Tier
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Player Level</div>
                <div className="text-base font-bold font-mono text-cyan-400">
                  Lvl {gameState.playerStats.level}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  +{(Math.floor((gameState.playerStats.level - 1) / 2))} Tier
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Dungeon Depth</div>
                <div className="text-base font-bold font-mono text-purple-400">
                  Floor {gameState.playerStats.depth || 0}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  +{(Math.floor((gameState.playerStats.depth || 0) / 2))} Tier
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">GM Chaos Matrix</div>
                <div className="text-base font-bold font-mono text-rose-400">
                  {gameState.chaosScore ?? 20} / 100
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  +{(Math.floor((gameState.chaosScore ?? 20) / 25))} Tier
                </div>
              </div>
            </div>
          </div>

          {/* Custom Ascension Challenge Level Adjuster */}
          <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-4 rounded-xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Custom Eclipse Ascension Challenge</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Voluntarily escalate World Threat level for extreme combat challenge and lucrative reward multipliers!
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleAdjustBonus(-1)}
                  disabled={customBonus <= 0}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 font-bold font-mono transition-colors"
                >
                  -
                </button>
                <div className="w-12 text-center font-mono font-bold text-amber-400 text-sm">
                  +{customBonus}
                </div>
                <button
                  onClick={() => handleAdjustBonus(1)}
                  disabled={customBonus >= 10}
                  className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">XP Bonus</span>
                <span className="text-emerald-400 font-bold">+{threatInfo.xpBonusPct}%</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Loot Rarity</span>
                <span className="text-amber-400 font-bold">+{threatInfo.lootRarityBonusPct}%</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Affix Chance</span>
                <span className="text-rose-400 font-bold">{Math.round(threatInfo.affixChance * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Corrupted Enemy Affixes Compendium */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Corrupted Enemy Affixes Compendium</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeAffixTypes.map(affix => {
                const meta = getAffixMeta(affix);
                return (
                  <div key={affix} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-start gap-3">
                    <span className="text-xl p-1 bg-slate-900 rounded-lg border border-slate-800">{meta.icon}</span>
                    <div>
                      <div className={`font-bold font-mono text-xs ${meta.color}`}>{meta.name}</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{meta.shortDesc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Higher Threat Tiers yield Mythic gear & Radiant catalysts on victory!</span>
          </div>
          <button
            onClick={() => { playSound('bump'); onClose(); }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldThreatModal;
