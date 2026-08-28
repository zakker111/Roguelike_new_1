import React, { useState, useEffect } from 'react';
import { 
  GameMod, 
  loadAllMods, 
  saveAllMods, 
  toggleModState, 
  deleteMod, 
  exportModToJSON, 
  parseAndValidateModJSON, 
  saveSingleMod 
} from '../../utils/moddingEngine';
import { 
  Code, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  Upload, 
  Download, 
  Power, 
  Sparkles, 
  Box, 
  ShieldAlert, 
  BookOpen, 
  Grid, 
  RefreshCw 
} from 'lucide-react';

interface GodModdingTabProps {
  triggerSuccessLog: (msg: string) => void;
  playSound: (sound: string) => void;
}

export const GodModdingTab: React.FC<GodModdingTabProps> = ({
  triggerSuccessLog,
  playSound
}) => {
  const [modsList, setModsList] = useState<GameMod[]>([]);
  const [selectedModId, setSelectedModId] = useState<string | null>(null);
  const [modJsonText, setModJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadAllMods();
    setModsList(loaded);
    if (loaded.length > 0 && !selectedModId) {
      setSelectedModId(loaded[0].id);
      setModJsonText(exportModToJSON(loaded[0]));
    }
  }, []);

  const handleSelectMod = (mod: GameMod) => {
    setSelectedModId(mod.id);
    setModJsonText(exportModToJSON(mod));
    setJsonError(null);
    playSound('click');
  };

  const handleToggleMod = (modId: string, currentEnabled: boolean) => {
    const updated = toggleModState(modId, !currentEnabled);
    setModsList(updated);
    playSound('click');
    triggerSuccessLog(`🔌 MOD STATE: ${!currentEnabled ? 'Enabled' : 'Disabled'} mod "${modId}"!`);
  };

  const handleDeleteMod = (modId: string) => {
    if (!confirm('Are you sure you want to delete this custom mod?')) return;
    const updated = deleteMod(modId);
    setModsList(updated);
    if (updated.length > 0) {
      setSelectedModId(updated[0].id);
      setModJsonText(exportModToJSON(updated[0]));
    } else {
      setSelectedModId(null);
      setModJsonText('');
    }
    playSound('loot');
    triggerSuccessLog('🗑️ DELETED: Custom mod removed from Mod Manager!');
  };

  const handleSaveJsonEditor = () => {
    const validation = parseAndValidateModJSON(modJsonText);
    if (!validation.success || !validation.mod) {
      setJsonError(validation.error || 'Failed to parse JSON mod format.');
      playSound('error');
      return;
    }
    setJsonError(null);
    const updated = saveSingleMod(validation.mod);
    setModsList(updated);
    setSelectedModId(validation.mod.id);
    playSound('mutate');
    triggerSuccessLog(`✨ SAVED MOD: Registered custom mod "${validation.mod.title}"!`);
  };

  const handleCreateNewModTemplate = () => {
    const newMod: GameMod = {
      id: `mod_custom_${Date.now()}`,
      title: 'My Custom Mod Pack',
      author: 'Master Modder',
      version: '1.0.0',
      description: 'A custom content mod created with Sunder Modding API.',
      enabled: true,
      createdAt: new Date().toISOString().split('T')[0],
      customMonsters: [
        {
          id: `monster_custom_${Date.now()}`,
          name: 'Abyssal Nightmare',
          char: '👾',
          color: '#a855f7',
          hp: 200,
          atk: 25,
          def: 12,
          description: 'A custom eldritch entity created via Modding API.'
        }
      ],
      customItems: [
        {
          id: `item_custom_${Date.now()}`,
          name: 'Blade of Eternal Chaos',
          type: 'weapon',
          subType: 'Longsword',
          damage: 35,
          defense: 2,
          critChance: 18,
          value: 800,
          color: '#ef4444',
          description: 'A custom forged chaos blade.'
        }
      ],
      customSpells: [
        {
          id: `spell_custom_${Date.now()}`,
          name: 'Supernova Burst',
          element: 'fire',
          manaCost: 40,
          damage: 150,
          range: 4,
          description: 'Custom fire nova burst spell.',
          particleColor: '#f97316'
        }
      ]
    };

    const updated = saveSingleMod(newMod);
    setModsList(updated);
    setSelectedModId(newMod.id);
    setModJsonText(exportModToJSON(newMod));
    setJsonError(null);
    playSound('magic_cast');
    triggerSuccessLog('✨ CREATED: New Mod template generated!');
  };

  const handleCopyModJson = (mod: GameMod) => {
    const str = exportModToJSON(mod);
    navigator.clipboard.writeText(str);
    setCopiedId(mod.id);
    setTimeout(() => setCopiedId(null), 2500);
    playSound('loot');
    triggerSuccessLog(`📋 COPIED: JSON for mod "${mod.title}" copied to clipboard!`);
  };

  const selectedMod = modsList.find(m => m.id === selectedModId);

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 p-4 bg-slate-900/90 text-slate-200 font-mono text-xs">
      {/* Modding API Header */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="font-bold text-amber-400 flex items-center gap-2">
              <span>RUNTIME MODDING API & PLUGIN MANAGER</span>
              <span className="text-[10px] bg-indigo-950 border border-indigo-500/50 text-indigo-300 px-2 py-0.5 rounded">
                Phase 47 API
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Register custom monsters, weapons, magic spells, and dungeon blueprints at runtime.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNewModTemplate}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Mod Template</span>
        </button>
      </div>

      {/* Main Grid: Mod List & JSON Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Installed Mods List */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3 flex flex-col">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Installed Mods ({modsList.length})</span>
            <span className="text-[10px] text-indigo-400 font-mono">
              {modsList.filter(m => m.enabled).length} Active
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {modsList.map(mod => (
              <div
                key={mod.id}
                onClick={() => handleSelectMod(mod)}
                className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                  selectedModId === mod.id
                    ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-indigo-300 truncate">{mod.title}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMod(mod.id, mod.enabled);
                    }}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      mod.enabled
                        ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-600'
                    }`}
                    title={mod.enabled ? 'Mod Active (Click to Disable)' : 'Mod Disabled (Click to Enable)'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{mod.description}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span>v{mod.version} by {mod.author}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyModJson(mod);
                      }}
                      className="p-1 hover:text-amber-400 cursor-pointer"
                      title="Copy Mod JSON"
                    >
                      {copiedId === mod.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMod(mod.id);
                      }}
                      className="p-1 hover:text-rose-400 cursor-pointer"
                      title="Delete Mod"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (2 cols): Mod Details & Live JSON Schema Editor */}
        <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3 flex flex-col">
          {selectedMod ? (
            <>
              {/* Mod Title & Summary Badge */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-amber-400 text-sm">{selectedMod.title}</h3>
                  <p className="text-[10px] text-slate-400">{selectedMod.description}</p>
                </div>

                <button
                  onClick={handleSaveJsonEditor}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply & Save JSON</span>
                </button>
              </div>

              {/* JSON Error Display */}
              {jsonError && (
                <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2 rounded text-[11px] font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              {/* Active Mod Stats Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-bold">
                <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                  <span className="text-rose-400 block text-xs">{(selectedMod.customMonsters || []).length}</span>
                  <span className="text-slate-400">Monsters</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                  <span className="text-amber-400 block text-xs">{(selectedMod.customItems || []).length}</span>
                  <span className="text-slate-400">Items</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                  <span className="text-indigo-400 block text-xs">{(selectedMod.customSpells || []).length}</span>
                  <span className="text-slate-400">Spells</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded">
                  <span className="text-emerald-400 block text-xs">{(selectedMod.customDungeons || []).length}</span>
                  <span className="text-slate-400">Dungeons</span>
                </div>
              </div>

              {/* Live JSON Editor Textarea */}
              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">
                  Mod JSON Schema & Payload Editor:
                </label>
                <textarea
                  rows={14}
                  value={modJsonText}
                  onChange={(e) => setModJsonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-emerald-300 outline-none focus:border-indigo-500 flex-1 leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
              Select or create a mod to view and edit its JSON schema payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
