import React from 'react';
import { Code, RotateCw, Play } from 'lucide-react';

interface GodJSONDataTabProps {
  structuresJsonText: string;
  setStructuresJsonText: (val: string) => void;
  handleResetStructures: () => void;
  handleApplyStructuresJson: () => void;
}

export const GodJSONDataTab: React.FC<GodJSONDataTabProps> = ({
  structuresJsonText,
  setStructuresJsonText,
  handleResetStructures,
  handleApplyStructuresJson,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
        <div>
          <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Dynamic Structures Configurator (JSON)</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Build completely customized rooms, dungeons, houses, rings or custom arenas directly via simple JSON grids!
          </p>
        </div>
        <button
          onClick={handleResetStructures}
          className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          <RotateCw className="w-3 h-3 text-emerald-500" />
          <span>Restore Defaults</span>
        </button>
      </div>

      {/* Grid format guide explanation */}
      <div className="p-3 bg-emerald-950/10 border border-emerald-800/20 rounded-lg text-slate-300 space-y-1">
        <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-400 block">💡 Grid Characters Guide:</span>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Provide custom string maps in a <code className="text-emerald-300">grid</code> array! Specify widths/heights, and map keys to any available tile type:
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[9px] text-slate-400 pt-1 border-t border-slate-800/40">
          <div><strong className="text-slate-200">Wall</strong>: impenetrable boulder bounds</div>
          <div><strong className="text-slate-200">Floor</strong>: standard stone walking tiles</div>
          <div><strong className="text-slate-200">Door</strong>: entryways that slide open</div>
          <div><strong className="text-slate-200">DungeonEntrance</strong>: stairs leading deep</div>
          <div><strong className="text-slate-200">Bed / Table / Chair</strong>: cozy items</div>
          <div><strong className="text-slate-200">Campfire / Torch</strong>: ambient lighting</div>
        </div>
      </div>

      {/* JSON code box */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 block font-bold">Write / Paste Custom Structure JSON Array:</span>
        <textarea
          value={structuresJsonText}
          onChange={(e) => setStructuresJsonText(e.target.value)}
          className="w-full h-72 p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] leading-relaxed text-emerald-300 focus:border-emerald-600 focus:outline-none"
          spellCheck="false"
          placeholder="[ ... ]"
        />
      </div>

      {/* Apply / Compilation save button */}
      <button
        onClick={handleApplyStructuresJson}
        className="w-full py-2.5 bg-emerald-950/45 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
      >
        <Play className="w-4 h-4" />
        <span>Save Blueprints & Compile to Constructor Memory</span>
      </button>
    </div>
  );
};
