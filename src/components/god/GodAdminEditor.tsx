import React, { useState } from 'react';
import { Sliders, CheckCircle2, AlertTriangle, Download, Upload, Cpu } from 'lucide-react';
import { GameState } from '../../types';

interface GodAdminEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
}

export const GodAdminEditor: React.FC<GodAdminEditorProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog
}) => {
  const [jsonSaveText, setJsonSaveText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExportSave = () => {
    try {
      const dump = JSON.stringify(gameState, null, 2);
      setJsonSaveText(dump);
      setErrorMsg(null);
      triggerSuccessLog("Exported current live GameState to JSON buffer!");
    } catch (err: any) {
      setErrorMsg(`Export failed: ${err.message}`);
    }
  };

  const handleImportSave = () => {
    try {
      const parsed = JSON.parse(jsonSaveText);
      if (!parsed || typeof parsed !== 'object' || !parsed.playerStats) {
        throw new Error("Invalid GameState structure! Missing playerStats object.");
      }
      setGameState(parsed);
      setErrorMsg(null);
      triggerSuccessLog("Successfully imported state into live engine memory!");
    } catch (err: any) {
      setErrorMsg(`Import failed: ${err.message}`);
    }
  };

  const toggleAutonomousGM = () => {
    setGameState(prev => ({
      ...prev,
      gmAutonomousWeather: !(prev.gmAutonomousWeather ?? true)
    }));
    triggerSuccessLog(`Autonomous GM Engine toggled to ${(gameState.gmAutonomousWeather ?? true) ? 'OFF' : 'ON'}!`);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="border-b border-rose-900/40 pb-2">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>Sovereign Admin & Engine State Editor</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          Raw memory snapshot exporter, state injector, and runtime simulation engine toggles.
        </p>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-rose-950/50 border border-rose-800 rounded text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Engine Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Runtime System Toggles</span>
        </h4>

        <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">Autonomous GM Storyteller & Climate Engine</div>
            <div className="text-[10px] text-slate-400">Controls automatic procedural weather changes and dynamic world flavor events</div>
          </div>
          <button
            onClick={toggleAutonomousGM}
            className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
              (gameState.gmAutonomousWeather ?? true)
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
          >
            {(gameState.gmAutonomousWeather ?? true) ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Raw State JSON Buffer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">Raw GameState Snapshot Buffer</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportSave}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Export State</span>
            </button>
            <button
              onClick={handleImportSave}
              className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Upload className="w-3 h-3 text-amber-400" />
              <span>Inject State</span>
            </button>
          </div>
        </div>

        <textarea
          value={jsonSaveText}
          onChange={(e) => setJsonSaveText(e.target.value)}
          placeholder="Click 'Export State' to generate full JSON dump or paste state to inject..."
          rows={10}
          className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-xs text-rose-300 focus:outline-none focus:border-rose-500/50 resize-y"
        />
      </div>
    </div>
  );
};
