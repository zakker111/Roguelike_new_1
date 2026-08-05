import React from 'react';
import { Compass, Check, Flame, Hammer } from 'lucide-react';

interface CampAndToolsTabProps {
  scrapWoodCount: number;
  ironCount: number;
  dragonScaleCount: number;
  feyBoneCount: number;
  shadowCatalystCount: number;
  onPlaceCampfire?: () => void;
  onPlaceAnvil?: () => void;
  onCraftFishingPole?: () => void;
  onCraftLockpicks?: () => void;
  onCraftHatchet?: () => void;
  onCraftPickaxe?: () => void;
  onCraftRecallScroll?: () => void;
}

export const CampAndToolsTab: React.FC<CampAndToolsTabProps> = ({
  scrapWoodCount,
  ironCount,
  dragonScaleCount,
  feyBoneCount,
  shadowCatalystCount,
  onPlaceCampfire,
  onPlaceAnvil,
  onCraftFishingPole,
  onCraftLockpicks,
  onCraftHatchet,
  onCraftPickaxe,
  onCraftRecallScroll,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6" id="survival_camping_tab">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xl">⛺</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Camp & Survival Tools Assembly</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Prepare structures, resource harvesting gear, and teleportation scrolls for the wilderness</p>
          </div>
        </div>

        {/* Informative tutorial panel */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex items-start gap-3">
          <Compass className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-[11px] leading-relaxed text-slate-300">
            <p>
              <strong className="text-amber-400 font-sans">Tree Chopping Survival Guide:</strong> Stand next to any pine tree or lush vegetation <span className="text-emerald-400 font-bold">🌲</span> in the Overworld and walk into it to chop it down!
            </p>
            <p className="mt-1">
              Chopping down a tree removes the tile and awards you <strong className="text-amber-400 font-mono">1x Scrap Wood</strong>.
            </p>
          </div>
        </div>

        {/* Grid of Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Assemble Campfire */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>🔥</span>
                <span>Campfire Structure</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Deploys a permanent Campfire tile (🔥) adjacent to you. Used for resting and campfire gourmet cooking.</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                  scrapWoodCount >= 3 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                }`}>
                  <span>Scrap Wood ({scrapWoodCount}/3)</span>
                  {scrapWoodCount >= 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                </span>
              </div>
            </div>

            <button
              onClick={onPlaceCampfire}
              disabled={scrapWoodCount < 3}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                scrapWoodCount >= 3
                  ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-950" />
              <span>Build Campfire At Adjacent Field</span>
            </button>
          </div>

          {/* Card 1B: Portable Blacksmith Anvil */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>⚒️</span>
                <span>Portable Blacksmith Anvil</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Deploys an Anvil tile (⚒️) adjacent to you. Allows forging, mutating, and upgrading gear anywhere in the field!</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                    ironCount >= 5 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Any Iron / Metal ({ironCount}/5)</span>
                    {ironCount >= 5 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                  </span>
                  <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                    scrapWoodCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Scrap Wood ({scrapWoodCount}/2)</span>
                    {scrapWoodCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onPlaceAnvil}
              disabled={ironCount < 5 || scrapWoodCount < 2}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                ironCount >= 5 && scrapWoodCount >= 2
                  ? 'bg-slate-200 text-slate-950 border-white hover:bg-white hover:shadow-slate-400/20 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <Hammer className="w-4 h-4 text-slate-950" />
              <span>Build Anvil At Adjacent Field</span>
            </button>
          </div>

          {/* Card 2: Ancient Fishing Pole */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>🎣</span>
                <span>Ancient Fishing Pole</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Enables fishing in rivers, ponds, and deep ocean shores to capture Raw Fish ingredients.</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                  scrapWoodCount >= 3 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                }`}>
                  <span>Scrap Wood ({scrapWoodCount}/3)</span>
                  {scrapWoodCount >= 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                </span>
              </div>
            </div>

            <button
              onClick={onCraftFishingPole}
              disabled={scrapWoodCount < 3}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                scrapWoodCount >= 3
                  ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 hover:shadow-indigo-500/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <span>Craft Ancient Fishing Pole</span>
            </button>
          </div>

          {/* Card 3: Tension Lockpicks */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>🔑</span>
                <span>Tension Lockpicks (x3)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">High-tensile picks used to pick locked iron chests and dungeon grates discovered during exploration.</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                  ironCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                }`}>
                  <span>Iron / Metal ({ironCount}/1)</span>
                  {ironCount >= 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                </span>
              </div>
            </div>

            <button
              onClick={onCraftLockpicks}
              disabled={ironCount < 1}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                ironCount >= 1
                  ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <span>Craft Tension Lockpicks</span>
            </button>
          </div>

          {/* Card 3B: Lumberjack Hatchet */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>🪓</span>
                <span>Lumberjack Hatchet</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Harvests wood and logs automatically from inventory or hand when chopping trees. Unrepairable.</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                    ironCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Tempered Iron ({ironCount}/2)</span>
                    {ironCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                  </span>
                  <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                    scrapWoodCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Scrap Wood ({scrapWoodCount}/2)</span>
                    {scrapWoodCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onCraftHatchet}
              disabled={ironCount < 2 || scrapWoodCount < 2}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                ironCount >= 2 && scrapWoodCount >= 2
                  ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <span>Craft Lumberjack Hatchet</span>
            </button>
          </div>

          {/* Card 3C: Mining Pickaxe */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>⛏️</span>
                <span>Prospector Pickaxe</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Extracts iron ore veins and obsidian crystal clusters found throughout deep caverns.</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                    ironCount >= 3 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Tempered Iron ({ironCount}/3)</span>
                    {ironCount >= 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                  </span>
                  <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                    scrapWoodCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Scrap Wood ({scrapWoodCount}/2)</span>
                    {scrapWoodCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onCraftPickaxe}
              disabled={ironCount < 3 || scrapWoodCount < 2}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                ironCount >= 3 && scrapWoodCount >= 2
                  ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <span>Craft Prospector Pickaxe</span>
            </button>
          </div>

          {/* Card 4: Recall Scroll */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>📜</span>
                <span>Scroll of Recall</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Instantly teleports you back to Oakhaven sanctuary town square from anywhere in the world.</p>
              
              <div className="mb-4">
                <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Ingredients:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                    dragonScaleCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Wyrm Scale ({dragonScaleCount}/1)</span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                    feyBoneCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Relic Bone ({feyBoneCount}/1)</span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                    shadowCatalystCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                  }`}>
                    <span>Echo Stone ({shadowCatalystCount}/1)</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onCraftRecallScroll}
              disabled={dragonScaleCount < 1 || feyBoneCount < 1 || shadowCatalystCount < 1}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                dragonScaleCount >= 1 && feyBoneCount >= 1 && shadowCatalystCount >= 1
                  ? 'bg-sky-500 text-slate-950 border-sky-400 hover:bg-sky-400 hover:shadow-sky-500/10 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <span>Craft Scroll of Recall</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
