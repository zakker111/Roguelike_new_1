import React, { useState } from 'react';
import { 
  X, Skull, Shield, Sword, Heart, Activity, 
  Coins, Sparkles, Lock, HelpCircle, Search, 
  ChevronRight, Compass, Info, Zap
} from 'lucide-react';
import { BESTIARY_ENTRIES, BestiaryEntry, LootItem } from '../utils/bestiary';

interface BestiaryOverlayProps {
  defeatedEnemiesCount?: { [key: string]: number };
  onClose?: () => void;
  inline?: boolean;
}

export default function BestiaryOverlay({ defeatedEnemiesCount = {}, onClose, inline = false }: BestiaryOverlayProps) {
  const [activeTab, setActiveTab] = useState<'Standard' | 'Wildlife' | 'Bosses'>('Standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryKey, setSelectedEntryKey] = useState<string>('');

  // Grouped entries under the current tab, filtered by search query
  const filteredEntries = BESTIARY_ENTRIES.filter(entry => {
    if (entry.category !== activeTab) return false;
    if (searchQuery.trim() === '') return true;
    
    const isUnlocked = (defeatedEnemiesCount[entry.key] || 0) > 0;
    const nameToSearch = isUnlocked ? entry.name : 'Unknown Creature';
    return nameToSearch.toLowerCase().includes(searchQuery.toLowerCase()) || 
           entry.char.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Automatically select the first visible entry if nothing is selected or if selection is invalid
  const activeEntry = filteredEntries.find(e => e.key === selectedEntryKey) || filteredEntries[0];

  // Global unlock summary
  const totalEntries = BESTIARY_ENTRIES.length;
  const unlockedCount = BESTIARY_ENTRIES.filter(entry => (defeatedEnemiesCount[entry.key] || 0) > 0).length;
  const completionPercent = Math.round((unlockedCount / totalEntries) * 100) || 0;

  const content = (
    <div 
      id="bestiary-modal"
      className={`bg-slate-900 border border-slate-800 rounded-xl w-full flex flex-col overflow-hidden shadow-2xl ${inline ? 'h-[700px]' : 'h-[85vh] max-w-4xl animate-in fade-in-50 zoom-in-95 duration-150'}`}
    >
      {/* Header */}
      <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-950/40" id="bestiary-header">
        <div className="flex items-center gap-3">
          <div className="bg-rose-950/40 p-1.5 rounded border border-rose-500/20">
            <Skull className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-extrabold uppercase tracking-widest text-slate-100 font-sans block">
              Oakhaven Wilderness Bestiary
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              COMPLETED: <span className="text-rose-400 font-bold">{unlockedCount}/{totalEntries}</span> ({completionPercent}%) • VANQUISH TO UNLOCK LORE & STATS
            </span>
          </div>
        </div>
        {!inline && onClose && (
          <button 
            id="close-bestiary-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-900/40">
          
          {/* LEFT PANEL: Sidebar Lists */}
          <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/20" id="bestiary-sidebar">
            {/* Category Tabs */}
            <div className="flex border-b border-slate-800 p-1 bg-slate-950/40" id="bestiary-sidebar-tabs">
              {(['Standard', 'Wildlife', 'Bosses'] as const).map(tab => {
                const countInTab = BESTIARY_ENTRIES.filter(e => e.category === tab).length;
                const unlockedInTab = BESTIARY_ENTRIES.filter(e => e.category === tab && (defeatedEnemiesCount[e.key] || 0) > 0).length;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSearchQuery('');
                      // Select the first of the new tab
                      const firstOfTab = BESTIARY_ENTRIES.find(e => e.category === tab);
                      if (firstOfTab) setSelectedEntryKey(firstOfTab.key);
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer text-center ${
                      activeTab === tab 
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {tab === 'Standard' ? '⚔️ Foe' : tab === 'Wildlife' ? '🦌 Beast' : '👑 Boss'}
                    <span className="block text-[8px] opacity-70 font-mono mt-0.5">
                      {unlockedInTab}/{countInTab}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Filter */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/20 relative" id="bestiary-search-container">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-4 top-4" />
              <input 
                type="text"
                placeholder="Search bestiary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 pl-7 text-[11px] text-slate-200 placeholder-slate-500 font-sans focus:outline-none focus:border-rose-500/40"
              />
            </div>

            {/* List scroll container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1" id="bestiary-entries-list">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-[11px] font-sans">
                  No matching entries found
                </div>
              ) : (
                filteredEntries.map(entry => {
                  const kills = defeatedEnemiesCount[entry.key] || 0;
                  const isUnlocked = kills > 0;
                  const isSelected = activeEntry && activeEntry.key === entry.key;

                  return (
                    <button
                      key={entry.key}
                      onClick={() => setSelectedEntryKey(entry.key)}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-rose-500/5 border-rose-500/30 shadow' 
                          : 'bg-slate-900/30 border-slate-800/60 hover:bg-slate-800/30 hover:border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-8 h-8 rounded bg-slate-950/65 flex items-center justify-center font-mono text-base border border-slate-800 shadow-inner"
                          style={{ color: isUnlocked ? entry.color : '#475569' }}
                        >
                          {isUnlocked ? entry.char : '?'}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[11px] font-bold block truncate ${isUnlocked ? 'text-slate-200' : 'text-slate-500 font-medium'}`}>
                            {isUnlocked ? entry.name : '??? Locked ???'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                            {isUnlocked ? (
                              <>
                                <span className="text-rose-400 font-semibold">Defeated:</span> {kills}
                              </>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 inline" /> Lock status
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-rose-400 translate-x-0.5' : 'text-slate-600'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Details Canvas */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col" id="bestiary-details-panel">
            {activeEntry ? (() => {
              const kills = defeatedEnemiesCount[activeEntry.key] || 0;
              const isUnlocked = kills > 0;

              if (!isUnlocked) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 max-w-lg mx-auto my-auto shadow-inner animate-fade-in" id="bestiary-locked-card">
                    <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-600 shadow mb-4">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase block mb-1">
                      CLASSIFIED DOSSIER
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-2 font-sans">
                      Encrypted Combat Coordinates
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-normal mb-5 max-w-sm">
                      Detailed combat telemetry, core attributes, and full loot drop schedules are currently locked. Track down and defeat <strong className="text-rose-400">1x {activeEntry.category === 'Bosses' ? activeEntry.name : activeEntry.name}</strong> in combat to unlock this record.
                    </p>
                    <div className="bg-slate-950/50 border border-slate-800 px-4 py-2.5 rounded-lg text-[10px] font-mono text-slate-500 max-w-xs leading-normal flex gap-2">
                      <Compass className="w-4 h-4 text-rose-500/60 shrink-0 mt-0.5" />
                      <span>
                        {activeEntry.category === 'Bosses' 
                          ? `Find this boss guarding key milestones or spawning randomly deep in the dungeons.`
                          : activeEntry.category === 'Wildlife' 
                          ? `Wildlife can be encountered roaming the overworld wilderness and grass fields.`
                          : `Standard monsters roam dungeon halls or regional biomes of Oakhaven.`}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-6 text-left animate-in fade-in-40 duration-200" id="bestiary-unlocked-card">
                  {/* Title Preview Card */}
                  <div className="flex flex-col md:flex-row gap-5 items-center md:items-stretch bg-slate-950/30 p-4 rounded-xl border border-slate-800/80 shadow">
                    
                    {/* Glowing glyph display */}
                    <div 
                      className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-slate-950 flex items-center justify-center font-mono text-4xl border border-slate-800 shadow-inner shrink-0 relative overflow-hidden group select-none"
                      style={{ textShadow: `0 0 16px ${activeEntry.color}` }}
                    >
                      {/* background scanlines */}
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/90 pointer-events-none" />
                      <div className="text-center font-sans z-10" style={{ color: activeEntry.color }}>
                        {activeEntry.char}
                      </div>
                    </div>

                    {/* Quick Core Info */}
                    <div className="flex-1 flex flex-col justify-between text-center md:text-left">
                      <div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                          <span className="text-[9px] font-mono font-bold tracking-widest bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase">
                            {activeEntry.category} Foe
                          </span>
                          <span className="text-[9px] font-mono font-semibold bg-slate-800/80 px-2 py-0.5 rounded text-slate-400">
                            Key: {activeEntry.key}
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-100 uppercase tracking-wide leading-tight">
                          {activeEntry.name}
                        </h2>
                        <p className="text-[11px] text-slate-300 mt-1.5 leading-normal font-sans italic">
                          "{activeEntry.description}"
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono mt-3 border-t border-slate-800/50 pt-2.5 flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start">
                        <span>
                          👑 TYPE: <strong className="text-slate-200">{activeEntry.category === 'Bosses' ? 'Legendary Boss' : 'Wild Entity'}</strong>
                        </span>
                        <span>
                          💀 TOTAL VANQUISHED: <strong className="text-rose-400 font-bold">{kills}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div>
                    <h4 className="font-mono text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2.5 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      <span>Combat Attributes Telemetry</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {/* HP */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                        <div className="bg-red-500/10 p-1.5 rounded text-red-400">
                          <Heart className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block">BASE HP</span>
                          <span className="text-xs font-bold text-red-400 font-mono">{activeEntry.baseHp}</span>
                        </div>
                      </div>

                      {/* ATK */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                        <div className="bg-amber-500/10 p-1.5 rounded text-amber-400">
                          <Sword className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block">BASE ATK</span>
                          <span className="text-xs font-bold text-amber-400 font-mono">{activeEntry.baseAtk}</span>
                        </div>
                      </div>

                      {/* DEF */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                        <div className="bg-sky-500/10 p-1.5 rounded text-sky-400">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block">BASE DEF</span>
                          <span className="text-xs font-bold text-sky-400 font-mono">{activeEntry.baseDef}</span>
                        </div>
                      </div>

                      {/* RANGE */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                        <div className="bg-purple-500/10 p-1.5 rounded text-purple-400">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block">RANGE</span>
                          <span className="text-xs font-bold text-purple-400 font-mono">
                            {activeEntry.range > 1 ? `${activeEntry.range} Tiles` : '1 (Melee)'}
                          </span>
                        </div>
                      </div>

                      {/* SPEED */}
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-2">
                        <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-400">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 block">ACT DELAY</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {activeEntry.speed === 1.0 ? 'Standard (1.0x)' : activeEntry.speed < 1.0 ? `Fast (${activeEntry.speed}x)` : `Slow (${activeEntry.speed}x)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loot Table Section */}
                  <div>
                    <h4 className="font-mono text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2.5 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>LOOT DROP SCHEDULE (DISCOVERED BLUEPRINTS)</span>
                    </h4>

                    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/30">
                      <table className="w-full text-left text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            <th className="p-3 w-1/3">Item Asset</th>
                            <th className="p-3 w-1/6">Frequency</th>
                            <th className="p-3 w-1/2">Alchemical Telemetry & Utility description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {activeEntry.lootTable.map((loot, idx) => (
                            <tr key={idx} className="hover:bg-slate-950/20 transition-colors">
                              <td className="p-3 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: loot.color }} />
                                <span style={{ color: loot.color }}>{loot.name}</span>
                              </td>
                              <td className="p-3 font-mono">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase ${
                                  loot.chance === '100%' 
                                    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/15'
                                    : 'bg-amber-950/20 text-amber-400 border border-amber-500/10'
                                }`}>
                                  {loot.chance}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 leading-normal">
                                {loot.description}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Standard fallback message for dynamic gear drops */}
                          {activeEntry.category !== 'Wildlife' && (
                            <tr className="bg-slate-900/10">
                              <td className="p-3 font-bold text-sky-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span>Tactical Armors & Weapons</span>
                              </td>
                              <td className="p-3 font-mono">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-950/20 text-sky-400 border border-sky-500/10">
                                  {activeEntry.category === 'Bosses' ? '100%' : '22%'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 leading-normal">
                                {activeEntry.category === 'Bosses' 
                                  ? `Guaranteed drop of high-tier heirloom artifacts (e.g. Broadswords, Surtur's Blade, custom defensive plate shields).`
                                  : `Chance to recover standard utility equipment such as Gothic Bucklers, Ranger Greaves, Steel Sabers, or leather shields.`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bestiary Lore Footnote */}
                  <div className="bg-slate-950/25 border border-slate-850 p-3 rounded-lg flex gap-2.5 text-[10px] text-slate-400 leading-normal">
                    <Info className="w-4 h-4 text-rose-500/50 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tactical Combat Note:</strong> Elite targets (indicated by ★ stars ★) carry random combat modifiers such as <strong className="text-slate-300">Noxious</strong>, <strong className="text-slate-300">Regenerative</strong>, or <strong className="text-slate-300">Stonewall</strong>. Their base HP is boosted by 1.8x and basic attack ratings are boosted by 1.4x, but they drop larger quantities of materials and catalysts upon defeat.
                    </span>
                  </div>
                </div>
              );
            })() : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-sans">
                Select an entry on the left to inspect detailed telemetry.
              </div>
            )}
          </div>

        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      {content}
    </div>
  );
}
