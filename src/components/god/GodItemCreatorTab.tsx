import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { GameState } from '../../types';
import { SCAR_DATABASE } from '../../utils/scars';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from '../../utils/spellScrolls';
import { GodItemSpawner } from './GodItemSpawner';
import { GodWorldEditor } from './GodWorldEditor';

export const MATERIAL_LABELS: { [key: string]: string } = {
  'mat_iron': 'Iron Alloy Ore',
  'mat_mithril': 'Mithril Royal Silver',
  'mat_obsidian': 'Obsidian Glass Shard',
  'mat_dragonscale': 'Volcanic Dragon Scale',
  'mat_feybone': 'Vaporized Fey Bone',
  'mat_wood': 'Driftwood Timber',
  'mat_raw_meat': 'Raw Game Meat',
  'mat_cooked_meat': 'Spit-Roasted Meat',
  'mat_berry': 'Wild Forest Berries',
  'mat_cooked_pie': 'Aura Berry Pie',
  'mat_beer': 'Sweet Malt Beer',
  'mat_bread': 'Stone-Baked Bread',
  'mat_lockpick': 'Tension Lockpick',
  'mat_skeleton_key': 'Grim Skeleton Key'
};

export const CATALYST_LABELS: { [key: string]: string } = {
  'cat_fire': 'Pyrotactile Fire Catalyst',
  'cat_frost': 'Cryo-forged Ice Catalyst',
  'cat_poison': 'Venom-stung Gas Catalyst',
  'cat_lightning': 'Super-charged Spark Catalyst',
  'cat_shadow': 'Void-gazing Dark Catalyst'
};

export interface GodItemCreatorTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  selectedScarName?: string;
  setSelectedScarName?: (name: string) => void;
  handleInjectScar?: (scarName: string) => void;
  handleModifyAttribute?: (attr: 'str' | 'dex' | 'int' | 'cha' | 'lck' | 'unspentPoints', val: number) => void;
  customFollowerName?: string;
  setCustomFollowerName?: (name: string) => void;
  handleRecruitCustomFollower?: (type: 'guard' | 'thief') => void;
  handleSetWeatherBiome?: (weather: any, biome?: any) => void;
  handleModifyQuantity?: (id: string, isCatalyst: boolean, val: number) => void;
  triggerSuccessLog: (msg: string) => void;
  setJsonError: (err: string | null) => void;
}

export const GodItemCreatorTab: React.FC<GodItemCreatorTabProps> = ({
  gameState,
  setGameState,
  selectedScarName: propSelectedScarName,
  setSelectedScarName: propSetSelectedScarName,
  handleInjectScar: propHandleInjectScar,
  handleModifyAttribute: propHandleModifyAttribute,
  customFollowerName: propCustomFollowerName,
  setCustomFollowerName: propSetCustomFollowerName,
  handleRecruitCustomFollower: propHandleRecruitCustomFollower,
  handleSetWeatherBiome: propHandleSetWeatherBiome,
  handleModifyQuantity: propHandleModifyQuantity,
  triggerSuccessLog,
  setJsonError,
}) => {
  const [localScarName, setLocalScarName] = React.useState<string>(SCAR_DATABASE[0]?.name || '');
  const [localFollowerName, setLocalFollowerName] = React.useState<string>('Sentry Godfrey');

  const selectedScarName = propSelectedScarName ?? localScarName;
  const setSelectedScarName = propSetSelectedScarName ?? setLocalScarName;
  const customFollowerName = propCustomFollowerName ?? localFollowerName;
  const setCustomFollowerName = propSetCustomFollowerName ?? setLocalFollowerName;

  const handleInjectScar = propHandleInjectScar || ((scarName: string) => {
    const tmpl = SCAR_DATABASE.find(s => s.name === scarName);
    if (!tmpl) return;
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        scars: [
          ...(prev.playerStats.scars || []),
          {
            ...tmpl,
            id: `scar_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            acquiredTurn: prev.playerStats.turnsPlayed || 0
          }
        ]
      }
    }));
    triggerSuccessLog(`Inscribed scar: ${tmpl.name}`);
  });

  const handleModifyAttribute = propHandleModifyAttribute || ((attr: 'str' | 'dex' | 'int' | 'cha' | 'lck' | 'unspentPoints', val: number) => {
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        [attr]: Math.max(0, ((prev.playerStats as any)[attr] || 0) + val)
      }
    }));
    triggerSuccessLog(`Modified ${attr} by ${val > 0 ? '+' : ''}${val}`);
  });

  const handleRecruitCustomFollower = propHandleRecruitCustomFollower || ((type: 'guard' | 'thief') => {
    const newFollower = {
      id: `fol_${Date.now()}`,
      name: customFollowerName || (type === 'guard' ? 'Sentinel Guard' : 'Shadow Thief'),
      char: type === 'guard' ? '🛡️' : '👥',
      color: type === 'guard' ? '#38bdf8' : '#c084fc',
      level: 1,
      hp: type === 'guard' ? 90 : 60,
      maxHp: type === 'guard' ? 90 : 60,
      x: gameState.playerX,
      y: gameState.playerY,
      targetX: gameState.playerX,
      targetY: gameState.playerY,
      archetypeId: type === 'guard' ? 'tank' : 'rogue',
      weaponRange: 1
    };
    setGameState(prev => ({
      ...prev,
      followers: [...(prev.followers || []), newFollower as any]
    }));
    triggerSuccessLog(`Recruited companion: ${newFollower.name}`);
  });

  const handleSetWeatherBiome = propHandleSetWeatherBiome || ((weather: any, biome?: any) => {
    setGameState(prev => ({
      ...prev,
      weather: weather || prev.weather,
      biome: biome || prev.biome
    }));
    triggerSuccessLog(`Environment set: ${weather || ''} ${biome || ''}`);
  });

  const handleModifyQuantity = propHandleModifyQuantity || ((id: string, isCatalyst: boolean, val: number) => {
    setGameState(prev => {
      if (isCatalyst) {
        const next = { ...prev.inventoryCatalysts };
        next[id] = Math.max(0, (next[id] || 0) + val);
        return { ...prev, inventoryCatalysts: next };
      } else {
        const next = { ...prev.inventoryMaterials };
        next[id] = Math.max(0, (next[id] || 0) + val);
        return { ...prev, inventoryMaterials: next };
      }
    });
  });
  return (
    <div className="space-y-6 font-mono pb-6">
      
      {/* Header Badge */}
      <div className="flex justify-between items-center border-b border-rose-950 pb-2">
        <div>
          <h4 className="font-bold text-rose-400 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Sovereign Creator Laboratory & Materializers</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
            Instantly manifest and configure physical battle scars, followers, legendary custom equipment, alchemical catalysts, and hazards.
          </p>
        </div>
      </div>

      {/* Bento Row 1: Physical Battle Scars & Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Panel 1A: Battle Scars Spawning */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
            <span className="text-rose-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              🩹 Physical Trauma & Battle SCARS Spawning
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Spawn any scar from the trauma database directly into the character's active trauma ledger. Test stat penalties and cosmetic scarring immediately.
          </p>
          
          <div className="space-y-2">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Select Trauma Pattern:</label>
            <select
              value={selectedScarName}
              onChange={(e) => setSelectedScarName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
            >
              {SCAR_DATABASE.map(scar => (
                <option key={scar.name} value={scar.name}>
                  {scar.icon} {scar.name} ({scar.severity}) — {scar.description.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleInjectScar(selectedScarName)}
            className="w-full py-2 bg-rose-955/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inscribe Physical Trauma Scar onto Player</span>
          </button>

          {/* Active scars indicator */}
          <div className="pt-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Active Player Scars Count:</span>
            <div className="flex flex-wrap gap-1">
              {gameState.playerStats.scars && gameState.playerStats.scars.length > 0 ? (
                gameState.playerStats.scars.map((s, idx) => (
                  <span key={`${s.id}_${idx}`} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold rounded text-slate-300 flex items-center gap-1">
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-slate-500 italic font-sans animate-pulse">No scars currently inscribed on player stats.</span>
              )}
            </div>
          </div>
        </div>

        {/* Panel 1B: Player Attribute Boosts */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
            <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              📊 Custom Attribute Boosters & Stat Editor
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Instantly add or subtract points to raw attributes to playtest dynamic scaling. Overwrite points directly.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'str', label: '💪 Strength', color: 'text-red-400' },
              { key: 'dex', label: '🏹 Dexterity', color: 'text-emerald-400' },
              { key: 'int', label: '🪄 Intelligence', color: 'text-sky-400' },
              { key: 'cha', label: '👑 Charisma', color: 'text-purple-400' },
              { key: 'lck', label: '🍀 Luck', color: 'text-yellow-400' },
              { key: 'unspentPoints', label: '✨ Stat Points', color: 'text-pink-400' },
            ].map(item => {
              const curVal = gameState.playerStats[item.key as any] || 0;
              return (
                <div key={item.key} className="p-2 bg-slate-950/60 border border-slate-850 rounded flex items-center justify-between">
                  <div>
                    <span className={`text-[9px] font-bold block ${item.color}`}>{item.label}</span>
                    <span className="text-xs text-white font-mono font-bold animate-pulse">{curVal}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleModifyAttribute(item.key as any, -5)}
                      className="px-1 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white rounded cursor-pointer leading-none"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleModifyAttribute(item.key as any, 5)}
                      className="px-1 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white rounded cursor-pointer leading-none"
                    >
                      +5
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-2 bg-amber-955/15 border border-amber-900/35 rounded text-[9px] text-amber-500 font-semibold leading-relaxed font-sans">
            💡 Modifying Stats live automatically propagates secondary attributes like armor class block rate, critical damage bonus, and magic spell potency!
          </div>
        </div>

      </div>

      {/* Bento Row 2: Follower Recruitment & Sandbox Weather Climate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Panel 2A: Followers Recruitment Lab */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
            <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              👥 Tactical Retinue Recruitment Lab
            </span>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Custom Recruit Name:</label>
            <input
              type="text"
              value={customFollowerName}
              onChange={(e) => setCustomFollowerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. Sentry Godfrey"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleRecruitCustomFollower('guard')}
              className="p-3 bg-blue-955/20 hover:bg-blue-900/40 border border-blue-900/70 text-blue-300 rounded-lg flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all"
            >
              <span className="text-xl">🛡️</span>
              <span className="font-bold text-[10px]">Hire Sentinel Guard</span>
              <span className="text-[8px] text-slate-500 font-mono">90 HP | 16 ATK | 6 DEF</span>
            </button>

            <button
              onClick={() => handleRecruitCustomFollower('thief')}
              className="p-3 bg-purple-955/20 hover:bg-purple-900/40 border border-purple-900/70 text-purple-300 rounded-lg flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all"
            >
              <span className="text-xl">👥</span>
              <span className="font-bold text-[10px]">Summon Shadow Thief</span>
              <span className="text-[8px] text-slate-500 font-mono">60 HP | 13 ATK | 2 DEF</span>
            </button>
          </div>

          {/* Active followers count indicator */}
          <div className="pt-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Current Followers List:</span>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
              {gameState.followers && gameState.followers.length > 0 ? (
                gameState.followers.map((f, idx) => (
                  <div key={`${f.id}_${idx}`} className="p-1 px-2.5 bg-slate-950/60 border border-slate-850 rounded text-[9.5px] text-slate-400 flex items-center justify-between font-mono">
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      <span>{f.char}</span>
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <span className="capitalize text-[8px] px-1 bg-slate-900 border border-slate-800 rounded ml-1 text-blue-400 font-bold">{f.archetypeId}</span>
                    </span>
                    <span>Lv.{f.level} • HP:{f.hp}/{f.maxHp}</span>
                  </div>
                ))
              ) : (
                <span className="text-[9px] text-slate-500 italic font-sans animate-pulse">No companions summoned yet. Recruit some core followers.</span>
              )}
            </div>
          </div>
        </div>

        {/* Panel 2B: Weather & Biome Realignment */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
            <span className="text-sky-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              ⛈️ Regional Biome & Climate Controllers
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Hot-swap regional climate factors instantly to check rendering mechanics, foggy vision restrictions, or snowy cold hazards.
          </p>

          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Shift Weather:</span>
            <div className="grid grid-cols-3 gap-1.5 font-mono">
              {[
                { val: 'clear', label: '☀️ Clear', color: 'border-amber-900 text-amber-400 hover:bg-amber-950/10' },
                { val: 'rainy', label: '🌧️ Rainy', color: 'border-blue-900 text-blue-400 hover:bg-blue-950/10' },
                { val: 'foggy', label: '🌫️ Foggy', color: 'border-slate-800 text-slate-450 hover:bg-slate-900/20' },
                { val: 'snowy', label: '❄️ Snowy', color: 'border-sky-900 text-sky-400 hover:bg-sky-950/10' },
                { val: 'sandstorm', label: '🏜️ Sandstorm', color: 'border-orange-900 text-orange-400 hover:bg-orange-950/10' },
                { val: 'blizzard', label: '🥶 Blizzard', color: 'border-indigo-900 text-indigo-400 hover:bg-indigo-950/10' },
              ].map(w => (
                <button
                  key={w.val}
                  onClick={() => handleSetWeatherBiome(w.val as any)}
                  className={`py-1.5 border hover:border-slate-650 rounded text-[9.5px] font-bold cursor-pointer transition-all text-center ${
                    gameState.weather === w.val 
                      ? 'bg-slate-950 border-white text-white shadow font-black' 
                      : `bg-slate-950/50 ${w.color}`
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Shift Biome Environment:</span>
            <div className="grid grid-cols-5 gap-1.5 font-mono">
              {[
                { val: 'forest', label: '🌲 Forest', color: 'border-emerald-950 text-emerald-400 hover:bg-emerald-950/10' },
                { val: 'desert', label: '🏜️ Desert', color: 'border-orange-950 text-orange-400 hover:bg-orange-950/10' },
                { val: 'tundra', label: '🏔️ Tundra', color: 'border-cyan-950 text-cyan-400 hover:bg-cyan-950/10' },
                { val: 'swamp', label: '🐊 Swamp', color: 'border-lime-950 text-lime-400 hover:bg-lime-950/10' },
                { val: 'town', label: '🏰 Town', color: 'border-amber-950 text-amber-400 hover:bg-amber-950/10' },
              ].map(b => (
                <button
                  key={b.val}
                  onClick={() => handleSetWeatherBiome(gameState.weather, b.val as any)}
                  className={`py-1.5 border hover:border-slate-650 rounded text-[9.5px] font-bold cursor-pointer transition-all text-center ${
                    gameState.biome === b.val 
                      ? 'bg-slate-950 border-white text-white shadow font-black' 
                      : `bg-slate-950/50 ${b.color}`
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/50 border border-slate-850 rounded text-[9px] font-mono text-slate-400 flex justify-between">
            <div>Current Biome: <strong className="text-white capitalize">{gameState.biome}</strong></div>
            <div>Current Climate: <strong className="text-white capitalize">{gameState.weather}</strong></div>
          </div>
        </div>

      </div>

      {/* Bento Row 3: Live SUPPLY Inventory Infusion & Alchemical Forge */}
      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
          <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            🧪 Inventory Alloys, Provisions, & Catalysts Infusion
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal font-sans">
          Tactically edit count totals for all 12 raw resources and 5 rare catalysts elements. Skip timeconsuming mining completely.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Part A: Materials List adjusted */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Materials Supplies:</span>
            <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto pr-1">
              {Object.keys(MATERIAL_LABELS).map(id => {
                const count = gameState.inventoryMaterials[id] || 0;
                return (
                  <div key={id} className="p-1.5 bg-slate-950/60 border border-slate-850 rounded flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] font-mono block text-slate-350 truncate font-semibold" title={MATERIAL_LABELS[id]}>
                        {MATERIAL_LABELS[id]}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">{count} qty</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleModifyQuantity(id, false, -10)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8.5px] font-bold text-slate-400 hover:text-white rounded cursor-pointer leading-none"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleModifyQuantity(id, false, +10)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8.5px] font-bold text-slate-400 hover:text-white rounded cursor-pointer leading-none"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Part B: Catalysts List adjusted */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Rare Alchemical Catalysts:</span>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(CATALYST_LABELS).map(id => {
                const count = gameState.inventoryCatalysts[id] || 0;
                return (
                  <div key={id} className="p-2 bg-slate-950/60 border border-slate-850 rounded flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] block text-slate-200 font-semibold">{CATALYST_LABELS[id]}</span>
                      <span className="text-indigo-400 font-bold font-mono text-[10.5px]">{count} units</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleModifyQuantity(id, true, -5)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 hover:text-white rounded cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleModifyQuantity(id, true, +5)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 hover:text-white rounded cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Part C: Instant Recall Scroll Generator */}
        <div className="border-t border-slate-800/80 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-sky-400 font-bold block uppercase tracking-wider">🔮 Instant Recall Scroll Generator</span>
            <span className="text-[9px] text-slate-400 block leading-normal mt-0.5">Spawns a fresh magic-imbued Scroll of Recall directly into the player's pack backpack inventory.</span>
          </div>
          <button
            onClick={() => {
              const newScroll = {
                id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
                name: 'Scroll of Recall 📜',
                type: 'scroll' as any,
                subType: 'Scroll' as any,
                defense: 0,
                damage: 0,
                critChance: 0,
                range: 0,
                color: '#38bdf8',
                description: 'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!',
                value: 200,
                durability: 100,
                maxDurability: 100
              };
              setGameState((prev) => ({
                ...prev,
                equipmentInventory: [...prev.equipmentInventory, newScroll],
                logs: [
                  ...prev.logs,
                  {
                    id: `dev_recall_scroll_${Date.now()}`,
                    text: `📜 DEV INJECTION: Manifested 1x Scroll of Recall directly into your equipment inventory!`,
                    type: 'craft',
                    timestamp: 'GOD'
                  }
                ]
              }));
              const talkEvent = new CustomEvent('spawn-game-effect', {
                detail: { x: gameState.playerX, y: gameState.playerY, text: `📜 Scroll Spawned!`, type: 'heal' },
              });
              window.dispatchEvent(talkEvent);
              triggerSuccessLog("Manifested Scroll of Recall into Inventory!");
            }}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black text-xs rounded-lg hover:from-sky-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>📜 SPAWN RECALL SCROLL</span>
          </button>
        </div>

        {/* Part D: Instant Spell Scrolls Generator */}
        <div className="border-t border-slate-800/80 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-orange-400 font-bold block uppercase tracking-wider">🔥 Spell Scrolls Manifestation</span>
            <span className="text-[9px] text-slate-400 block leading-normal mt-0.5">Manifests any of the custom spell scrolls instantly into your inventory backpack.</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {SPELL_SCROLLS.map((template) => {
              const simpleName = template.name.replace('Scroll of ', '').toUpperCase();
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    const newScroll = getSpellScrollAsEquipmentItem(template, Date.now());
                    setGameState((prev) => ({
                      ...prev,
                      equipmentInventory: [...prev.equipmentInventory, newScroll],
                      logs: [
                        ...prev.logs,
                        {
                          id: `dev_${template.id}_${Date.now()}`,
                          text: `📜 DEV INJECTION: Manifested 1x ${template.name} directly into your equipment inventory!`,
                          type: 'craft',
                          timestamp: 'GOD'
                        }
                      ]
                    }));
                    window.dispatchEvent(new CustomEvent('spawn-game-effect', {
                      detail: { x: gameState.playerX, y: gameState.playerY, text: `${template.name.split(' ').slice(-1)[0]} Spawned!`, type: 'heal' },
                    }));
                    triggerSuccessLog(`Manifested ${template.name}!`);
                  }}
                  className="px-2.5 py-1.5 text-white font-bold text-[10px] rounded hover:opacity-90 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                  style={{ backgroundColor: template.color }}
                >
                  <span>{simpleName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sovereign Item & Equipment Spawner */}
      <GodItemSpawner
        gameState={gameState}
        setGameState={setGameState}
        triggerSuccessLog={triggerSuccessLog}
      />

      {/* Sovereign World & Environmental Objects Editor */}
      <GodWorldEditor
        gameState={gameState}
        setGameState={setGameState}
        setJsonError={setJsonError}
      />
    </div>
  );
};
