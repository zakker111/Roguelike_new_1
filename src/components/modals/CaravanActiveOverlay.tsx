import React from 'react';
import { GameState } from '../../types';
import { getEffectiveAttribute } from '../../utils/gameUtils';

export interface CaravanActiveOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  handleResolveCaravanEncounterOption: (optionId: string) => void;
  handleAdvanceCaravanTravel: () => void;
  handleCompleteCaravanTravel: () => void;
}

export const CaravanActiveOverlay: React.FC<CaravanActiveOverlayProps> = ({
  gameState,
  setGameState,
  handleResolveCaravanEncounterOption,
  handleAdvanceCaravanTravel,
  handleCompleteCaravanTravel,
}) => {
  if (!gameState.caravanTravel?.active) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto font-sans text-slate-100">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-blue-500/30 rounded-2xl shadow-2xl flex flex-col min-h-[550px] max-h-[90vh] overflow-hidden">
        
        {/* Header Banner */}
        <div className={`p-4 ${gameState.caravanTravel.currentEncounter && !gameState.caravanTravel.currentEncounter.resolved ? 'bg-red-950/40 border-b border-red-500/20' : 'bg-blue-950/40 border-b border-blue-500/20'} flex justify-between items-center transition-colors duration-300`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🛡️</span>
            <div className="text-left">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400">ACTIVE OVERWORLD ESCORT MISSION</h2>
              <div className="text-sm font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                <span>Region Chunk ({gameState.caravanTravel.originX}, {gameState.caravanTravel.originY})</span>
                <span className="text-blue-500">➔</span>
                <span className="text-emerald-400 font-bold">{gameState.caravanTravel.destName}</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-1 bg-blue-950/80 border border-blue-800 rounded-lg text-xs font-mono font-bold text-blue-300">
            💰 Payout: {gameState.caravanTravel.rewardGold}g
          </div>
        </div>

        {/* Main Content Splitted Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
          
          {/* Left Column: Visual Map / Progress / Player Stats */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            {/* Parallax Traveling Wagon Carriage Animation */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-slate-950/50 pointer-events-none" />
              <div className="absolute top-2 right-4 text-xl">🌅</div>
              <div className="text-slate-800 text-3xl font-bold opacity-30 select-none tracking-tight absolute bottom-8">
                ▲▲▲▲▲▲▲▲▲▲▲
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 animate-pulse">
                  <span className="text-3xl filter drop-shadow">🐎</span>
                  <span className="text-3xl filter drop-shadow relative animate-bounce" style={{ animationDelay: '0.2s' }}>🛒</span>
                  <span className="text-xs text-blue-400 font-mono font-black animate-pulse">💨 ROLLING...</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">"Clack-clack! Giddyup!"</div>
              </div>
              <div className="w-full h-1 border-t-2 border-dashed border-slate-700 mt-2 absolute bottom-6" />
            </div>

            {/* Progress Tracks */}
            <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl text-left">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-2.5">
                Journey Milestones
              </h4>
              
              <div className="flex items-center justify-between gap-1 mt-4 px-2">
                <span className="text-[10px] text-slate-400 font-bold truncate max-w-[80px]">Start</span>
                <div className="flex-1 flex items-center justify-between relative px-2">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800" />
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500" 
                    style={{ width: `${(gameState.caravanTravel.currentStep / gameState.caravanTravel.totalSteps) * 100}%` }}
                  />
                  {Array.from({ length: gameState.caravanTravel.totalSteps + 1 }).map((_, i) => {
                    const isCleared = i <= gameState.caravanTravel.currentStep;
                    const isCurrent = i === gameState.caravanTravel.currentStep;
                    return (
                      <div 
                        key={i} 
                        className={`w-3.5 h-3.5 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-300 ${
                          isCurrent 
                            ? 'bg-blue-500 border-slate-900 scale-125 ring-2 ring-blue-500/40 shadow-blue-500/50 shadow-md' 
                            : isCleared 
                              ? 'bg-blue-800 border-blue-500' 
                              : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {isCleared && <span className="text-[6px] text-white">✓</span>}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] text-emerald-400 font-bold truncate max-w-[80px] text-right">{gameState.caravanTravel.destName}</span>
              </div>

              <div className="mt-4 flex justify-between items-center text-[11px] font-mono border-t border-slate-850 pt-3">
                <span className="text-slate-400">Escort Progress:</span>
                <span className="text-slate-100 font-bold">
                  {gameState.caravanTravel.currentStep} / {gameState.caravanTravel.totalSteps} Regions
                </span>
              </div>
            </div>

            {/* Guard Vital Stats */}
            <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl text-left">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-2.5">
                Guard Vitality
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                  <span className="text-lg">❤️</span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">HP</div>
                    <div className="font-bold font-mono text-rose-400">{gameState.playerStats.hp} / {gameState.playerStats.maxHp}</div>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                  <span className="text-lg">⚡</span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Exhaustion</div>
                    <div className="font-bold font-mono text-amber-400">{gameState.playerStats.exhaustion}%</div>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                  <span className="text-lg">🪙</span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Gold</div>
                    <div className="font-bold font-mono text-yellow-400">{gameState.playerStats.gold}g</div>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                  <span className="text-lg">⭐</span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Lvl</div>
                    <div className="font-bold font-mono text-emerald-400">Level {gameState.playerStats.level}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: History Narrative Log & Active Encounters */}
          <div className="md:col-span-7 flex flex-col gap-4 min-h-0">
            
            {/* Journey Logs narrative scroll */}
            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col min-h-[180px] max-h-[260px] overflow-hidden text-left shadow-inner">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-2 flex items-center gap-1 text-left">
                <span>📖</span> JOURNEY CHRONICLE
              </h4>
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 font-mono text-[10.5px] leading-relaxed scroll-smooth text-left">
                {gameState.caravanTravel.stepsHistory.map((stepMsg, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded-lg text-left ${
                      stepMsg.includes('🚨') 
                        ? 'bg-red-950/30 border border-red-500/20 text-red-300' 
                        : stepMsg.includes('🎲') 
                          ? 'bg-amber-950/30 border border-amber-500/20 text-amber-300 font-bold' 
                          : stepMsg.includes('🏆') 
                            ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 font-bold' 
                            : 'bg-slate-900/40 border border-slate-850 text-slate-300'
                    }`}
                  >
                    {stepMsg}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Wilderness Encounter Panel */}
            <div className="flex-grow flex flex-col">
              {gameState.caravanTravel.currentEncounter ? (
                <div className={`p-4 border rounded-xl flex flex-col gap-3 text-left transition-all shadow-lg ${
                  gameState.caravanTravel.currentEncounter.resolved 
                    ? 'bg-slate-950/40 border-slate-800' 
                    : 'bg-red-950/10 border-red-500/30 ring-2 ring-red-500/5'
                }`}>
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 text-left">
                    <div className="flex items-center gap-1.5 text-left">
                      <span className="animate-pulse">🚨</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 text-left">
                        {gameState.caravanTravel.currentEncounter.title}
                      </h4>
                    </div>
                    {gameState.caravanTravel.currentEncounter.resolved && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                        RESOLVED
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans text-left">
                    {gameState.caravanTravel.currentEncounter.desc}
                  </p>

                  {/* Display outcome if resolved, else option buttons */}
                  {gameState.caravanTravel.currentEncounter.resolved ? (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-emerald-300 leading-normal text-left">
                      <div className="font-bold text-slate-400 uppercase mb-1 flex items-center gap-1 text-left">
                        <span>🎲</span> RESOLVED ENCOUNTER RESULT:
                      </div>
                      {gameState.caravanTravel.currentEncounter.resultLog}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      {gameState.caravanTravel.currentEncounter.options.map((option, oIdx) => {
                        const hasGold = option.costGold ? gameState.playerStats.gold >= option.costGold : true;
                        let hasItems = true;
                        if (option.costItems) {
                          option.costItems.forEach(itemCost => {
                            const cnt = gameState.inventoryMaterials[itemCost.id] || 0;
                            if (cnt < itemCost.count) hasItems = false;
                          });
                        }

                        const isAffordable = hasGold && hasItems;

                        return (
                          <button
                            key={oIdx}
                            disabled={!isAffordable}
                            onClick={() => handleResolveCaravanEncounterOption(option.id)}
                            className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg transition-all border flex flex-col gap-1 ${
                              isAffordable 
                                ? 'bg-slate-950 hover:bg-slate-850 hover:border-blue-500/50 border-slate-800 text-slate-200 cursor-pointer' 
                                : 'bg-slate-950/50 border-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <span className="font-sans text-left">{option.text}</span>
                            {option.statCheck && (
                              <span className="text-[9px] font-mono text-blue-400 font-semibold uppercase text-left">
                                Your {option.statCheck.toUpperCase()}: {getEffectiveAttribute(gameState, option.statCheck)} (+{Math.floor(((getEffectiveAttribute(gameState, option.statCheck)) - 10) / 2)} modifier)
                              </span>
                            )}
                            {option.costItems && (
                              <span className="text-[9px] font-mono text-red-400 font-semibold flex items-center gap-1.5 text-left">
                                <span>⚠️ Cost:</span>
                                {option.costItems.map((ic, iIdx) => {
                                  const have = gameState.inventoryMaterials[ic.id] || 0;
                                  return (
                                    <span key={iIdx} className={have >= ic.count ? 'text-slate-400' : 'text-red-500 font-bold'}>
                                      {ic.count}x {ic.label} (You have: {have})
                                    </span>
                                  );
                                })}
                              </span>
                            )}
                            {option.costGold && (
                              <span className={`text-[9px] font-mono font-semibold text-left ${gameState.playerStats.gold >= option.costGold ? 'text-amber-400' : 'text-red-500 font-bold'}`}>
                                ⚠️ Cost: {option.costGold} Gold (You have: {gameState.playerStats.gold}g)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex-grow flex flex-col justify-center items-center border border-dashed border-slate-800 rounded-xl p-5 bg-slate-950/20">
                  <span className="text-3xl animate-pulse">🛣️</span>
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mt-2">Wilderness is Calm</h4>
                  <p className="text-[10px] text-slate-500 text-center mt-1 max-w-[280px]">
                    The carriage draft horses trot along a smooth pathway. Ready the next stage of the voyage!
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Bottom Action bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end items-center gap-3">
          {gameState.caravanTravel.currentEncounter && !gameState.caravanTravel.currentEncounter.resolved ? (
            <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
              <span>⚠️</span> MUST RESOLVE THE WILDERNESS ENCOUNTER FIRST!
            </div>
          ) : gameState.caravanTravel.currentEncounter && gameState.caravanTravel.currentEncounter.resolved ? (
            <button
              onClick={() => setGameState(prev => {
                const travel = prev.caravanTravel;
                if (!travel) return prev;
                return {
                  ...prev,
                  caravanTravel: {
                    ...travel,
                    currentEncounter: null
                  }
                };
              })}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-[1.01] border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all shadow cursor-pointer text-center"
            >
              Clear Path & Roll Onward ➔
            </button>
          ) : gameState.caravanTravel.currentStep < gameState.caravanTravel.totalSteps ? (
            <button
              onClick={handleAdvanceCaravanTravel}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-slate-50 font-black text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ring-2 ring-blue-500/20 text-center"
            >
              <span>Proceed Onward (Step {gameState.caravanTravel.currentStep + 1} of {gameState.caravanTravel.totalSteps}) ➔</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteCaravanTravel}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-slate-50 font-black text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-500/20 animate-pulse text-center"
            >
              <span>🎉 Arrive in {gameState.caravanTravel.destName} & Collect Reward! ➔</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CaravanActiveOverlay;
