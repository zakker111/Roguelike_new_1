/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ShieldAlert, Coins, RefreshCw, Play, CheckCircle2, Truck, MapPin } from 'lucide-react';
import { GameState } from '../../types';
import { playSound } from '../../utils/audio';

export interface GodCaravanExpeditionTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog?: (msg: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export interface CaravanRouteConfig {
  id: string;
  name: string;
  origin: string;
  destination: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'deadly';
  payoutGold: number;
  totalDistance: number;
  description: string;
}

export const CARAVAN_ROUTES: CaravanRouteConfig[] = [
  {
    id: 'route_oakhaven_sunken_reach',
    name: 'Sunken Mire Highway',
    origin: 'Oakhaven Citadel',
    destination: 'Sunken Reach Port',
    dangerLevel: 'low',
    payoutGold: 180,
    totalDistance: 120,
    description: 'Safe coastal highway patrolled by Crown halberdiers. Low goblin bandit encounters.'
  },
  {
    id: 'route_oakhaven_iron_keep',
    name: 'Ironcrag Mountain Trail',
    origin: 'Oakhaven Citadel',
    destination: 'Iron Keep Forges',
    dangerLevel: 'medium',
    payoutGold: 320,
    totalDistance: 240,
    description: 'Rugged highlands with hostile mountain brutes, falling rockslides, and mercenary ambushes.'
  },
  {
    id: 'route_whisperwood_deep',
    name: 'Whisperwood Smuggler Trail',
    origin: 'Shadow Encampment',
    destination: 'Forgotten Ruins',
    dangerLevel: 'high',
    payoutGold: 540,
    totalDistance: 380,
    description: 'Dense forbidden forest plagued by Syndicate ambushers, phase spiders, and toxic fog.'
  },
  {
    id: 'route_abyss_threshold',
    name: 'Abyssal Chasm Convoy',
    origin: 'Castle Bastion',
    destination: 'Abyss Threshold Gate',
    dangerLevel: 'deadly',
    payoutGold: 1100,
    totalDistance: 600,
    description: 'High-risk military relief convoy carrying enchanted catalysts through demonic blight zones.'
  }
];

export const GodCaravanExpeditionTab: React.FC<GodCaravanExpeditionTabProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
  addLogMessage
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(CARAVAN_ROUTES[0].id);
  const [simWagonHp, setSimWagonHp] = useState<number>(100);
  const [simGuardsLeft, setSimGuardsLeft] = useState<number>(3);
  const [simEncounterOutcome, setSimEncounterOutcome] = useState<string | null>(null);

  const activeRoute = CARAVAN_ROUTES.find(r => r.id === selectedRouteId) || CARAVAN_ROUTES[0];

  const handleDispatchCaravan = () => {
    playSound('craft');
    const msg = `Dispatched Merchant Caravan on [${activeRoute.name}] (${activeRoute.origin} -> ${activeRoute.destination})!`;
    setSimEncounterOutcome(`Caravan in Transit: 0 / ${activeRoute.totalDistance} km. Guards deployed: ${simGuardsLeft}.`);
    if (triggerSuccessLog) triggerSuccessLog(msg);
    if (addLogMessage) addLogMessage(`🚚 [DEV] ${msg}`, 'system');
  };

  const handleSimulateBanditAmbush = () => {
    playSound('defeat');
    const dmg = Math.floor(Math.random() * 25) + 15;
    const nextHp = Math.max(0, simWagonHp - dmg);
    setSimWagonHp(nextHp);
    const lostGuard = Math.random() < 0.4 && simGuardsLeft > 0;
    if (lostGuard) setSimGuardsLeft(prev => Math.max(0, prev - 1));

    const msg = `Bandit Ambush Triggered! Wagon took -${dmg} damage (HP: ${nextHp}/100).${lostGuard ? ' 1 Guard perished in defense!' : ''}`;
    setSimEncounterOutcome(msg);
    if (triggerSuccessLog) triggerSuccessLog(msg);
    if (addLogMessage) addLogMessage(`⚔️ [DEV CARAVAN] ${msg}`, 'danger');
  };

  const handleRepairWagons = () => {
    playSound('craft');
    setSimWagonHp(100);
    setSimGuardsLeft(3);
    setSimEncounterOutcome('Wagons repaired to 100% HP. Guard garrison fully reinforced.');
    if (triggerSuccessLog) triggerSuccessLog('Wagons repaired to 100% HP!');
  };

  const handleInstantComplete = () => {
    playSound('victory');
    const payout = activeRoute.payoutGold;
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold + payout,
        xp: prev.playerStats.xp + 75
      }
    }));
    const msg = `Caravan arrived safely at [${activeRoute.destination}]! Awarded +${payout} Gold and +75 XP bonus.`;
    setSimEncounterOutcome(msg);
    if (triggerSuccessLog) triggerSuccessLog(msg);
    if (addLogMessage) addLogMessage(`🏆 [DEV CARAVAN] ${msg}`, 'loot');
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-start justify-between shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
                Merchant Caravan & Escort Director
              </h3>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                EXPEDITION LAB
              </span>
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Test regional trade routes, wagon durability mechanics, bandit ambushes, escort combat simulations, and destination trade tariffs.
            </p>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {simEncounterOutcome && (
        <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl flex items-center justify-between text-amber-300 shadow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{simEncounterOutcome}</span>
          </div>
          <button
            onClick={() => setSimEncounterOutcome(null)}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Route Selector Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Available Regional Trade Routes ({CARAVAN_ROUTES.length})</span>
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CARAVAN_ROUTES.map(route => {
            const isSelected = route.id === selectedRouteId;
            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{route.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      route.dangerLevel === 'low'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : route.dangerLevel === 'medium'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : route.dangerLevel === 'high'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-purple-950 text-purple-400 border-purple-800'
                    }`}>
                      {route.dangerLevel} DANGER
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{route.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{route.origin} ➔ {route.destination}</span>
                  <span className="text-amber-400 font-bold font-mono">+{route.payoutGold} Gold ({route.totalDistance} km)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Wagon & Guard Status Panel */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block border-b border-slate-800/80 pb-2">
          Expedition Simulation Controls
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Wagon Integrity:</span>
            <div className="flex items-center justify-between">
              <span className={`font-bold ${simWagonHp > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {simWagonHp}% HP
              </span>
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${simWagonHp > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${simWagonHp}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Escort Guards:</span>
            <div className="flex items-center gap-1 font-bold text-sky-400">
              <Shield className="w-3.5 h-3.5" />
              <span>{simGuardsLeft} / 3 Sentries Active</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px]">Player Gold:</span>
            <div className="flex items-center gap-1 font-bold text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{gameState.playerStats.gold} Gold</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          <button
            onClick={handleDispatchCaravan}
            className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Dispatch Route</span>
          </button>

          <button
            onClick={handleSimulateBanditAmbush}
            className="py-2.5 px-3 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Ambush</span>
          </button>

          <button
            onClick={handleRepairWagons}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Repair Wagons</span>
          </button>

          <button
            onClick={handleInstantComplete}
            className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Instant Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default GodCaravanExpeditionTab;
