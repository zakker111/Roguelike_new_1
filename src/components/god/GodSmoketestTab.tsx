import React from 'react';
import { Activity } from 'lucide-react';

interface GodSmoketestTabProps {
  isSmokeTesting: boolean;
  runAutomatedSmokeTest: () => void;
  smokeTestLogs: string[];
  setSmokeTestLogs: (logs: string[]) => void;
  currentTestStep: number | null;
  setCurrentTestStep: (step: number | null) => void;
}

export const GodSmoketestTab: React.FC<GodSmoketestTabProps> = ({
  isSmokeTesting,
  runAutomatedSmokeTest,
  smokeTestLogs,
  setSmokeTestLogs,
  currentTestStep,
  setCurrentTestStep,
}) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-teal-400 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>Client-Side Virtual Smoke Test Suite (v2.9.5)</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Execute a fully simulated playthrough to verify overworld scrolling, harvesting, rest mechanics, tavern coin flips, companions, and AI combat.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-bold text-[10px] text-slate-300 uppercase tracking-wider">Test Suite Control Deck</span>
          {isSmokeTesting && (
            <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1 animate-pulse">
              <span>●</span> Running Simulation...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={runAutomatedSmokeTest}
            disabled={isSmokeTesting}
            className={`py-2 px-3 rounded font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isSmokeTesting
                ? 'bg-slate-850 border border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-teal-950/40 hover:bg-teal-900/40 border border-teal-800 text-teal-300'
            }`}
          >
            <span>▶️ Run Complete Suite</span>
          </button>

          <button
            onClick={() => {
              setSmokeTestLogs([]);
              setCurrentTestStep(null);
            }}
            disabled={isSmokeTesting}
            className="py-2 px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🧹 Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Progress Steps Indicators */}
      <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-2">
        <span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block">Simulation Walkthrough Progress</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
          {[
            "1. Spatial Navigation & Scrolling",
            "2. Resource Gathering & Harvest Check",
            "3. Campfire Placement & Rest Purge",
            "4. Tavern Social & Coin Toss Betting",
            "5. Guild Upgrades & Treasury Allocations",
            "6. Quest Board Bounty Acquisition",
            "7. Companion Expedition Dispatch",
            "8. Survival Cooking & Alchemy Brewing",
            "9. Waterfront Angling Cast & Hook",
            "10. Deep Dungeon Descent, Traps & Lockpicking",
            "11. Combat AI Pursuit & Fight Routine",
            "12. Sleep Cycle & Stat Regeneration"
          ].map((stepStr, idx) => {
            const stepNum = idx + 1;
            const isActive = currentTestStep === stepNum;
            const isCompleted = currentTestStep !== null && currentTestStep > stepNum;

            let badgeColor = "bg-slate-900 text-slate-600 border-slate-800";
            let textColor = "text-slate-500";
            if (isActive) {
              badgeColor = "bg-teal-950/60 text-teal-300 border-teal-700 animate-pulse";
              textColor = "text-teal-200 font-semibold";
            } else if (isCompleted) {
              badgeColor = "bg-emerald-950/40 text-emerald-400 border-emerald-900";
              textColor = "text-slate-400 line-through decoration-slate-700";
            }

            return (
              <div key={idx} className={`flex items-center gap-2 px-2 py-1 rounded border transition-colors ${isActive ? 'bg-slate-950/50 border-teal-900/40' : 'border-transparent'}`}>
                <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[9px] border font-bold ${badgeColor}`}>
                  {isCompleted ? "✓" : stepNum}
                </span>
                <span className={`${textColor} truncate`}>{stepStr}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Diagnostics Terminal UI */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
          ⌨️ Diagnostics Terminal Feed:
        </span>
        <div className="w-full h-80 bg-black/95 border border-slate-800 rounded-lg p-3 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 leading-relaxed shadow-inner">
          {smokeTestLogs.length === 0 ? (
            <div className="text-slate-600 italic select-none h-full flex flex-col items-center justify-center gap-1">
              <span>Waiting for simulation trigger...</span>
              <span className="text-[9px]">Click "Run Complete Suite" above to play test framework features.</span>
            </div>
          ) : (
            smokeTestLogs.map((l, idx) => {
              let color = "text-emerald-400";
              if (l.includes("❌")) color = "text-red-400 font-bold";
              else if (l.includes("🎉") || l.includes("Success")) color = "text-emerald-300 font-bold";
              else if (l.includes("STEP") || l.includes("INITIALIZING")) color = "text-yellow-400 font-bold tracking-wide";
              else if (l.includes("Simulating") || l.includes("Crossing")) color = "text-cyan-400";

              return (
                <div key={idx} className={`${color} break-all whitespace-pre-wrap animate-in fade-in-50 duration-200`}>
                  {l}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
