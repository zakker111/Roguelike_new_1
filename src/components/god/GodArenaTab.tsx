import React from 'react';
import { Swords, RotateCw } from 'lucide-react';

export interface GodArenaTabProps {
  handleResetArenaSettings: () => void;
  TeleportToDungeonEntranceOverworld: () => void;
  TeleportToDungeon: (level: number) => void;
  TeleportToEmptyArena: () => void;
  godModeActive: boolean;
  setGodModeActive: (val: boolean) => void;
  deathAuraActive: boolean;
  setDeathAuraActive: (val: boolean) => void;
  bypassWeightLimit: boolean;
  setBypassWeightLimit: (val: boolean) => void;
  customBaseMaxWeight: number;
  setCustomBaseMaxWeight: (val: number) => void;
  playerAtkMult: number;
  setPlayerAtkMult: (val: number) => void;
  enemyHpMult: number;
  setEnemyHpMult: (val: number) => void;
  enemyAtkMultState: number;
  setEnemyAtkMultState: (val: number) => void;
  goldMult: number;
  setGoldMult: (val: number) => void;
  xpMult: number;
  setXpMult: (val: number) => void;
  updateArenaValue: (key: string, val: any, setter: (val: any) => void) => void;
}

export const GodArenaTab: React.FC<GodArenaTabProps> = ({
  handleResetArenaSettings,
  TeleportToDungeonEntranceOverworld,
  TeleportToDungeon,
  TeleportToEmptyArena,
  godModeActive,
  setGodModeActive,
  deathAuraActive,
  setDeathAuraActive,
  bypassWeightLimit,
  setBypassWeightLimit,
  customBaseMaxWeight,
  setCustomBaseMaxWeight,
  playerAtkMult,
  setPlayerAtkMult,
  enemyHpMult,
  setEnemyHpMult,
  enemyAtkMultState,
  setEnemyAtkMultState,
  goldMult,
  setGoldMult,
  xpMult,
  setXpMult,
  updateArenaValue,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
        <div>
          <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-blue-400" />
            <span>Arena Combat & Loot Sandbox Tweaks</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Modulate damage factors, XP ratios, item yields, and god attributes in real-time.
          </p>
        </div>
        <button
          onClick={handleResetArenaSettings}
          className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          <RotateCw className="w-3 h-3 text-blue-500" />
          <span>Reset Variables</span>
        </button>
      </div>

      {/* DUNGEON & ARENA QUICK WARP OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button 
          onClick={TeleportToDungeonEntranceOverworld}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-950/30 via-teal-950/30 to-slate-900/30 hover:from-emerald-900/40 hover:to-teal-900/50 border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-slate-100 font-bold cursor-pointer transition-all flex items-center justify-between text-xs shadow-md group"
        >
          <div className="flex items-center gap-2 text-left">
            <span className="text-base group-hover:scale-110 transition-transform">🚪</span>
            <div>
              <div className="font-bold text-slate-200">Teleport to Nearest Dungeon Entrance</div>
              <div className="text-[9px] text-slate-400 font-normal">Warps directly outside the closest dungeon door in the realm.</div>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-950/80 border border-emerald-700 font-bold px-2 py-1 rounded text-emerald-300">Entrance 🚪</span>
        </button>

        <button 
          onClick={() => TeleportToDungeon(1)}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-950/30 via-indigo-950/30 to-slate-900/30 hover:from-purple-900/40 hover:to-indigo-900/50 border border-purple-500/40 hover:border-purple-400 rounded-lg text-slate-100 font-bold cursor-pointer transition-all flex items-center justify-between text-xs shadow-md group"
        >
          <div className="flex items-center gap-2 text-left">
            <span className="text-base group-hover:scale-110 transition-transform">🌀</span>
            <div>
              <div className="font-bold text-slate-200">Enter Abyss Floor 1</div>
              <div className="text-[9px] text-slate-400 font-normal">Direct warp into Dungeon Abyss FL 1 interior.</div>
            </div>
          </div>
          <span className="text-[10px] bg-purple-950/80 border border-purple-700 font-bold px-2 py-1 rounded text-purple-300">Warp FL 1 🌀</span>
        </button>

        <button 
          onClick={TeleportToEmptyArena}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-red-950/20 via-indigo-950/20 to-slate-900/30 hover:from-amber-950/30 hover:to-indigo-900/40 border border-indigo-500/30 hover:border-indigo-500/80 rounded-lg text-slate-100 font-bold cursor-pointer transition-all flex items-center justify-between text-xs shadow-md group"
        >
          <div className="flex items-center gap-2 text-left">
            <span className="text-base group-hover:animate-spin">⚔️</span>
            <div>
              <div className="font-bold text-slate-200">Enter Testing Arena</div>
              <div className="text-[9px] text-slate-400 font-normal">Blank sandbox canvas with exit staircase at (25, 12).</div>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-950/80 border border-indigo-700 font-bold px-2 py-1 rounded text-indigo-300">Warp Arena ✨</span>
        </button>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3">
        {/* God Mode toggle */}
        <label className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 rounded-lg cursor-pointer transition-all">
          <div>
            <span className="font-bold text-slate-200 block">🛡️ God Mode (Invulnerable & Unlimited Weight)</span>
            <span className="text-[9px] text-slate-500">Block incoming enemy hits & grant unlimited carry weight</span>
          </div>
          <input
            type="checkbox"
            checked={godModeActive}
            onChange={(e) => {
              const val = e.target.checked;
              updateArenaValue('arenaGodModeActive', val, setGodModeActive);
              if (val) {
                updateArenaValue('bypassWeightLimit', true, setBypassWeightLimit);
              }
            }}
            className="w-4 h-4 text-blue-600 focus:ring-0 rounded border-slate-800"
          />
        </label>

        {/* Kill aura */}
        <label className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 rounded-lg cursor-pointer transition-all">
          <div>
            <span className="font-bold text-slate-200 block">⚡ Instant Death Aura</span>
            <span className="text-[9px] text-slate-500">Smites any enemy within adjacent tiles</span>
          </div>
          <input
            type="checkbox"
            checked={deathAuraActive}
            onChange={(e) => updateArenaValue('arenaDeathAuraActive', e.target.checked, setDeathAuraActive)}
            className="w-4 h-4 text-blue-600 focus:ring-0 rounded border-slate-800"
          />
        </label>
      </div>

      {/* Carry weight and capacity controls */}
      <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5">
        <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
          🎒 Sandbox Carry Weight Controllers
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Bypass toggle */}
          <label className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 rounded-lg cursor-pointer transition-all">
            <div>
              <span className="font-bold text-slate-200 block text-[11px]">🎈 Infinite Carry Mode</span>
              <span className="text-[9px] text-slate-500 font-mono">Bypass carry limit checks</span>
            </div>
            <input
              type="checkbox"
              checked={bypassWeightLimit}
              onChange={(e) => updateArenaValue('bypassWeightLimit', e.target.checked, setBypassWeightLimit)}
              className="w-4 h-4 text-blue-600 focus:ring-0 rounded border-slate-800"
            />
          </label>

          {/* Limit slider */}
          <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-1 flex flex-col justify-center">
            <div className="flex justify-between font-mono text-[9px]">
              <span className="text-slate-400 uppercase tracking-widest">Base Max Weight</span>
              <span className="text-emerald-400 font-bold font-mono">{customBaseMaxWeight} kg</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={customBaseMaxWeight}
              onChange={(e) => updateArenaValue('customBaseMaxWeight', parseFloat(e.target.value), setCustomBaseMaxWeight)}
              className="w-full h-1 accent-emerald-500 rounded bg-slate-850"
            />
            <div className="flex justify-between text-[8px] text-slate-600">
              <span>10kg</span>
              <span>80kg (Default)</span>
              <span>1000kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-3.5">
        {/* Player Damage */}
        <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-1.5">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400 uppercase tracking-wider">🗡️ Player Attack Damage Multiplier</span>
            <span className="text-blue-400 font-bold font-mono">{playerAtkMult}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="50.0"
            step="1.0"
            value={playerAtkMult}
            onChange={(e) => updateArenaValue('arenaPlayerDamageMultiplier', parseFloat(e.target.value), setPlayerAtkMult)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>1.0x (Normal)</span>
            <span>10.0x (Slayer)</span>
            <span>50.0x (Doom Slayer)</span>
          </div>
        </div>

        {/* Enemy HP multiplier */}
        <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-1.5">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400 uppercase tracking-wider">❤️ Monster Max HP Multiplier (New Spawn)</span>
            <span className="text-blue-400 font-bold font-mono">{enemyHpMult}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.1"
            value={enemyHpMult}
            onChange={(e) => updateArenaValue('arenaEnemyHpMultiplier', parseFloat(e.target.value), setEnemyHpMult)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>0.1x (Brittle paper)</span>
            <span>1.0x (Standard)</span>
            <span>10.0x (Titan Behemoth)</span>
          </div>
        </div>

        {/* Enemy Attack damage */}
        <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-1.5">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400 uppercase tracking-wider">💥 Enemy Strike Damage Factor</span>
            <span className="text-blue-400 font-bold font-mono">{enemyAtkMultState}x</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="5.0"
            step="0.2"
            value={enemyAtkMultState}
            onChange={(e) => updateArenaValue('arenaEnemyDamageMultiplier', parseFloat(e.target.value), setEnemyAtkMultState)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>0.0x (Pacifist mode)</span>
            <span>1.0x (Balanced)</span>
            <span>5.0x (Instant Executioner)</span>
          </div>
        </div>

        {/* Chest Gold and drop boost multiplier */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-1">
            <div className="flex justify-between font-mono text-[9px]">
              <span className="text-slate-400 uppercase tracking-wider">💎 Chest & Loot Gold</span>
              <span className="text-emerald-400 font-bold font-mono">{goldMult}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="1.0"
              value={goldMult}
              onChange={(e) => updateArenaValue('arenaGoldMultiplier', parseFloat(e.target.value), setGoldMult)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-1">
            <div className="flex justify-between font-mono text-[9px]">
              <span className="text-slate-400 uppercase tracking-wider">🧠 Defeat XP Gained</span>
              <span className="text-amber-400 font-bold font-mono">{xpMult}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="1.0"
              value={xpMult}
              onChange={(e) => updateArenaValue('arenaXpMultiplier', parseFloat(e.target.value), setXpMult)}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
