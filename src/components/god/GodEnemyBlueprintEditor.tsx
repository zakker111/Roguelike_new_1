import React from 'react';
import { Skull, RefreshCw, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';

interface GodEnemyBlueprintEditorProps {
  enemiesJsonText: string;
  setEnemiesJsonText: (val: string) => void;
  jsonError: string | null;
  jsonSuccess: string | null;
  customEnemiesState: any[];
  handleApplyEnemiesJson: () => void;
  handleResetEnemies: () => void;
  handleSpawnEnemy: (enemyType: string) => void;
}

export const GodEnemyBlueprintEditor: React.FC<GodEnemyBlueprintEditorProps> = ({
  enemiesJsonText,
  setEnemiesJsonText,
  jsonError,
  jsonSuccess,
  customEnemiesState,
  handleApplyEnemiesJson,
  handleResetEnemies,
  handleSpawnEnemy
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-red-900/40 pb-2">
        <div>
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-400" />
            <span>Monster & Boss Blueprint Editor</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Edit live JSON templates for monsters, spawn custom boss templates, or reset blueprints to defaults.
          </p>
        </div>
        <button
          onClick={handleResetEnemies}
          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {jsonError && (
        <div className="p-2.5 bg-rose-950/50 border border-rose-800 rounded text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{jsonError}</span>
        </div>
      )}

      {jsonSuccess && (
        <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{jsonSuccess}</span>
        </div>
      )}

      {/* Quick Spawn Buttons */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Spawn Combat Entities</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {['Rat', 'Goblin', 'Mage', 'Brute', 'Trapmaster', 'Dragon', 'Hiisi', 'Louhi', 'Dummy'].map((type) => (
            <button
              key={type}
              onClick={() => handleSpawnEnemy(type)}
              className="py-1.5 px-2 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/60 rounded text-left text-xs font-bold text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>{type}</span>
              <Plus className="w-3 h-3 text-red-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Live JSON Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">Live JSON Blueprint Schema</label>
          <span className="text-[10px] text-slate-400 font-mono">{customEnemiesState.length} Templates Active</span>
        </div>
        <textarea
          value={enemiesJsonText}
          onChange={(e) => setEnemiesJsonText(e.target.value)}
          rows={12}
          className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-red-500/50 resize-y"
        />
        <div className="flex justify-end">
          <button
            onClick={handleApplyEnemiesJson}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition-colors cursor-pointer shadow-lg shadow-red-950/40"
          >
            Apply JSON Blueprints
          </button>
        </div>
      </div>
    </div>
  );
};
