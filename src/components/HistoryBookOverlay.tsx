/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Lock, Landmark, Compass, Award } from 'lucide-react';
import { WORLD_HISTORY_CHAPTERS, LoreChapter } from '../data/worldHistory';

interface HistoryBookOverlayProps {
  unlockedChapters: string[];
  poisCount?: number;
  onClose?: () => void;
  inline?: boolean;
}

export default function HistoryBookOverlay({
  unlockedChapters = [],
  poisCount = 0,
  onClose,
  inline = false,
}: HistoryBookOverlayProps) {
  const [activeChapterId, setActiveChapterId] = useState<string>('sunder_oakhaven');

  // Close history book on Escape key if not inline
  useEffect(() => {
    if (!onClose || inline) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose, inline]);

  const chaptersArray = Object.entries(WORLD_HISTORY_CHAPTERS).map(([id, info]) => ({
    id,
    ...info,
    isUnlocked: unlockedChapters.includes(id)
  }));

  const unlockedCount = chaptersArray.filter(c => c.isUnlocked).length;

  const content = (
    <div 
      id="history-book-modal"
      className={`bg-slate-900 border border-slate-800 rounded-xl w-full flex flex-col overflow-hidden shadow-2xl ${
        inline ? 'h-full flex-1 min-h-[550px]' : 'max-w-4xl max-h-[85vh] h-[650px] animate-in fade-in-50 zoom-in-95 duration-150'
      }`}
    >
      {/* Header */}
      <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-200">📖 Chronicles of Oakhaven</span>
          {inline && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              Main Panel Tab
            </span>
          )}
        </div>
        {onClose && (
          <button 
            id="close-history-book-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-all text-xs flex items-center gap-1"
          >
            {inline ? (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">← Back to Expedition</span>
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/30 border-b border-slate-800/70 text-left">
          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40 flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold font-sans">Active Landmarks</div>
              <div className="text-xs font-bold font-mono text-slate-200">1 per Wilderness</div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40 flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold font-sans">Unlocked Chronicles</div>
              <div className="text-xs font-bold font-mono text-amber-400">{unlockedCount} / {chaptersArray.length} Chapters</div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40 flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold font-sans">Explorer Blessings</div>
              <div className="text-xs font-bold font-mono text-emerald-400">HP, MP, EXP & DEF buffs!</div>
            </div>
          </div>
        </div>

        {/* Dual Panel Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chapter Selector (Left panel) */}
          <div className="w-1/3 border-r border-slate-800 bg-slate-950/20 overflow-y-auto p-3 space-y-2 text-left">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Table of Contents</h4>
            {chaptersArray.map((chap) => {
              const isActive = chap.id === activeChapterId;
              return (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapterId(chap.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 cursor-pointer select-none ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                      : chap.isUnlocked
                        ? 'bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-850'
                        : 'bg-slate-900/10 border-slate-900 text-slate-500 hover:bg-slate-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] uppercase text-indigo-400/80 font-mono tracking-wider font-bold">
                      {chap.category}
                    </span>
                    {!chap.isUnlocked && (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold truncate">
                    {chap.title}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {chap.isUnlocked ? chap.description : "Locate correct shrine ruins to translate."}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Core Chronicle Content Pane (Right panel) */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40 flex flex-col items-center justify-start text-left min-h-0">
            {(() => {
              const chap = chaptersArray.find(c => c.id === activeChapterId);
              if (!chap) return null;

              if (!chap.isUnlocked) {
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <div className="p-4 bg-slate-950/50 rounded-full border border-slate-800">
                      <Lock className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">Chronology Locked</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This piece of human oral legend is undecipherable. Find the associated landmark (shrine, well, monolith, or volcanic altar) in the wilderness and touch it to translate this chapter!
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="w-full space-y-6">
                  {/* Chapter decoration layout */}
                  <div className="space-y-2 border-b border-slate-800 pb-4">
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest font-mono">
                      {chap.category}
                    </div>
                    <h2 className="text-xl font-bold font-sans tracking-tight text-slate-100 flex items-center gap-2">
                      <span>📖</span> {chap.title}
                    </h2>
                    <p className="text-xs italic text-slate-400 leading-relaxed font-sans">
                      {chap.description}
                    </p>
                  </div>

                  {/* Editorial Column */}
                  <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-lg space-y-4 font-serif text-[13px] leading-relaxed text-slate-300 text-justify">
                    {chap.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="indent-4 first:indent-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Footer translation notes */}
                  <div className="bg-indigo-500/5 p-3 rounded border border-indigo-500/10 text-[10.5px] text-indigo-300 font-sans leading-relaxed flex items-center gap-2">
                    <span>✨</span>
                    <span><strong>Discovery Benefit:</strong> Comprehending this chapter has blessed your spirit, granting permanent bonuses. Touch more monuments for infinite wisdom.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/50 flex justify-between items-center text-[10.5px] text-slate-500 font-mono">
          <span>Esc key / G adjacent closes</span>
          <span>© Scribbled in the Chronicles of Oakhaven</span>
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div id="history-book-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      {content}
    </div>
  );
}
