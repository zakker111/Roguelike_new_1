/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, ScrollText, Trash2, Download, Swords, Eye } from 'lucide-react';
import { GameLogMessage } from '../types';

interface GameLogProps {
  logs: GameLogMessage[];
  onClearLogs: () => void;
  onDownloadLogs?: () => void;
  className?: string;
}

function GameLogComponent({ logs, onClearLogs, onDownloadLogs, className }: GameLogProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest-first' | 'oldest-first'>('newest-first');
  const [isPinned, setIsPinned] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'combat'>('all');
  const [isCompact, setIsCompact] = useState(true);

  // Monitor scroll events to update if we are scrolled to the latest logs (pinned position)
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    if (sortOrder === 'oldest-first') {
      const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 40;
      setIsPinned(isBottom);
    } else {
      const isTop = el.scrollTop <= 40;
      setIsPinned(isTop);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    // Auto-scroll if pinned to latest logs
    if (isPinned) {
      if (sortOrder === 'oldest-first') {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = 0;
      }
    }
  }, [logs, isPinned, activeFilter, sortOrder]);

  // Handle order changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      if (sortOrder === 'oldest-first') {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = 0;
      }
      setIsPinned(true);
    }
  }, [sortOrder]);

  const handleScrollToLatest = () => {
    const el = scrollContainerRef.current;
    if (el) {
      if (sortOrder === 'oldest-first') {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = 0;
      }
      setIsPinned(true);
    }
  };

  function getMessageStyles(type: GameLogMessage['type']) {
    switch (type) {
      case 'combat':
        return 'text-rose-400 border-l-2 border-rose-500/50 pl-1.5';
      case 'loot':
        return 'text-amber-400 border-l-2 border-amber-500/50 pl-1.5';
      case 'trap':
        return 'text-fuchsia-400 border-l-2 border-fuchsia-500/50 pl-1.5';
      case 'craft':
        return 'text-emerald-400 border-l-2 border-emerald-500/50 pl-1.5 font-bold';
      case 'danger':
        return 'text-red-500 font-bold uppercase tracking-wide border-l-2 border-red-600 pl-1.5 bg-red-950/10 py-0.5 rounded-r animate-pulse';
      case 'system':
        return 'text-blue-400 border-l-2 border-blue-500/30 pl-1.5';
      default:
        return 'text-slate-300 border-l-2 border-slate-700/50 pl-1.5';
    }
  }

  function getMessageTextColor(type: GameLogMessage['type']) {
    switch (type) {
      case 'combat':
        return 'text-rose-400';
      case 'loot':
        return 'text-amber-400';
      case 'trap':
        return 'text-fuchsia-400';
      case 'craft':
        return 'text-emerald-400 font-bold';
      case 'danger':
        return 'text-red-500 font-bold uppercase tracking-wide';
      case 'system':
        return 'text-blue-400';
      default:
        return 'text-slate-300';
    }
  }

  const parseMessageText = (text: string) => {
    if (!text) return '';
    
    // Highlight bracketed info like [15 DMG · Bronze Sword]
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const inner = part.slice(1, -1);
        const isDamage = inner.includes('DMG') || inner.includes('damage') || inner.includes('HP');
        return (
          <span key={i} className={`font-bold px-1.5 py-0.5 mx-0.5 rounded text-[11px] select-all ${
            isDamage ? 'bg-rose-950/60 text-rose-300 border border-rose-900/40 font-mono' : 'bg-slate-950/60 text-amber-300 border border-slate-800'
          }`}>
            {inner}
          </span>
        );
      }

      // Handle custom animated highlights for Dragon and Dragon Scale elements
      const dragonRegex = /(Elder Dragon Scale|Primal Dragon Scale|Crimson Dragonscale|Dragonscale|DragonScale|Wyrmscale|Wyrm Scale|Dragon|DRAGON|dragon)/g;
      const subParts = part.split(dragonRegex);

      const parsedSubParts = subParts.map((subPart, subIdx) => {
        const lower = subPart.toLowerCase();
        if (lower.includes('scale') || lower.includes('wyrmscale')) {
          return (
            <span key={subIdx} className="animate-scale-shimmer">
              {subPart}
            </span>
          );
        } else if (lower === 'dragon') {
          return (
            <span key={subIdx} className="animate-dragon-glow">
              {subPart}
            </span>
          );
        }

        // Inline highlight keywords with specific colors
        let rendered: React.ReactNode = subPart;
        if (subPart.includes('CRITICAL') || subPart.includes('CRIT!')) {
          rendered = <span className="text-yellow-400 font-extrabold tracking-wider">{subPart}</span>;
        } else if (subPart.includes('Dodged!') || subPart.includes('evade') || subPart.includes('EVADED')) {
          rendered = <span className="text-sky-300 font-semibold">{subPart}</span>;
        } else if (subPart.includes('LIFESTEAL')) {
          rendered = <span className="text-red-400 font-bold tracking-tight">{subPart}</span>;
        } else if (subPart.includes('Braced!')) {
          rendered = <span className="text-teal-300 font-bold">{subPart}</span>;
        } else if (subPart.includes('broken!')) {
          rendered = <span className="text-red-500 font-extrabold">{subPart}</span>;
        }

        return <span key={subIdx}>{rendered}</span>;
      });

      return <React.Fragment key={i}>{parsedSubParts}</React.Fragment>;
    });
  };

  // Filter logs based on active filter safely
  const filteredLogs = (logs || []).filter((log) => {
    if (!log || typeof log !== 'object') return false;
    const textStr = typeof log.text === 'string' ? log.text : String(log.text || '');
    if (!textStr) return false;

    if (activeFilter === 'all') return true;
    
    // For combat filter, match types 'combat' or 'danger' or common combat action patterns
    const textLower = textStr.toLowerCase();
    return (
      log.type === 'combat' || 
      log.type === 'danger' || 
      textLower.includes('struck') ||
      textLower.includes('strikes') ||
      textLower.includes('damage') ||
      textLower.includes('healed') ||
      textLower.includes('defeated') ||
      textLower.includes('slain')
    );
  });

  // Aggregate consecutive duplicate log entries for cleaner feed
  const collapsedLogs: Array<{ log: GameLogMessage; count: number }> = [];
  filteredLogs.forEach((currentLog) => {
    const textStr = typeof currentLog.text === 'string' ? currentLog.text : String(currentLog.text || '');
    const lastItem = collapsedLogs[collapsedLogs.length - 1];
    if (lastItem) {
      const lastText = typeof lastItem.log.text === 'string' ? lastItem.log.text : String(lastItem.log.text || '');
      if (lastText === textStr && lastItem.log.type === currentLog.type) {
        lastItem.count += 1;
        return;
      }
    }
    collapsedLogs.push({ log: currentLog, count: 1 });
  });

  // Performance: Limit DOM rendering to the latest 150 log entries
  const maxRenderedLogs = 150;
  const slicedLogs = collapsedLogs.slice(-maxRenderedLogs);
  const displayLogs = sortOrder === 'newest-first' ? [...slicedLogs].reverse() : slicedLogs;

  return (
    <div className={className || "relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-52 flex flex-col shadow-inner"} id="game-logs-panel-parent">
      <style>{`
        @keyframes dragonGlow {
          0%, 100% {
            text-shadow: 0 0 3px #ef4444, 0 0 6px #f97316;
            color: #fca5a5;
          }
          50% {
            text-shadow: 0 0 6px #f97316, 0 0 12px #eab308, 0 0 18px #ef4444;
            color: #fef08a;
          }
        }
        @keyframes scaleShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-dragon-glow {
          animation: dragonGlow 2.5s ease-in-out infinite;
          font-weight: 850;
          letter-spacing: 0.025em;
          padding: 0 1px;
        }
        .animate-scale-shimmer {
          background: linear-gradient(90deg, #f43f5e 0%, #fb7185 25%, #fca5a5 50%, #f97316 75%, #f43f5e 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: scaleShimmer 3s linear infinite;
          font-weight: 900;
          text-shadow: 0 0 4px rgba(244, 63, 94, 0.4);
          display: inline-block;
          letter-spacing: 0.01em;
          padding: 0 1px;
        }
        .custom-log-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-log-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
        }
        .custom-log-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.35);
          border-radius: 3px;
        }
        .custom-log-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.55);
        }
      `}</style>

      {/* Log Header */}
      <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between z-10 select-none flex-wrap gap-1.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <ScrollText className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-300 font-sans font-medium text-[10px] uppercase tracking-wider hidden sm:inline">Adventure Chronologue</span>
            <span className="text-slate-300 font-sans font-medium text-[10px] uppercase tracking-wider sm:hidden">Logs</span>
          </div>
          
          {/* Tactical Filters */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('combat')}
              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all flex items-center gap-1 ${
                activeFilter === 'combat'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Swords className="w-2.5 h-2.5" />
              Combat
            </button>
          </div>

          {/* Compact Spacing Toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all border shrink-0 ${
              isCompact
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
            title="Toggle compact line spacing"
          >
            {isCompact ? 'Compact' : 'Standard'}
          </button>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'newest-first' ? 'oldest-first' : 'newest-first')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all border shrink-0 ${
              sortOrder === 'newest-first'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
            title="Toggle log ordering (Newest on top / Oldest on top)"
          >
            {sortOrder === 'newest-first' ? 'Newest' : 'Oldest'}
          </button>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          {onDownloadLogs && (
            <button
              onClick={onDownloadLogs}
              className="text-emerald-500 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-slate-900 flex items-center gap-1 text-[9px] font-sans font-semibold tracking-wide border border-emerald-500/20 px-1.5"
              title="Download Playthrough Simulation Logs"
              id="download-logs-game-btn"
            >
              <Download className="w-2.5 h-2.5 text-emerald-400" />
              <span className="hidden sm:inline">EXPORT LOGS</span>
              <span className="sm:hidden">EXPORT</span>
            </button>
          )}
          <button
            onClick={onClearLogs}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-900"
            title="Clear Chronologue"
            id="clear-logs-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 min-h-0 overflow-y-auto custom-log-scrollbar bg-slate-950/25 ${
          isCompact ? 'p-2 text-[12px] leading-snug' : 'p-3 text-[14px] leading-relaxed'
        } font-mono flex flex-col gap-1.5`}
      >
        {collapsedLogs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-8">
            {activeFilter === 'combat' 
              ? "No combat skirmishes recorded in this region yet..." 
              : "The halls are silent. Take a step to record your descent..."}
          </div>
        ) : (
          displayLogs.map(({ log, count }, idx) => {
            if (!log) return null;
            const safeText = typeof log.text === 'string' ? log.text : String(log.text || '');
            const textLower = safeText.toLowerCase();
            const isDragonLog = textLower.includes('dragon');
            const isScaleLog = textLower.includes('scale') || textLower.includes('wyrmscale');

            let rowStyle = '';
            if (isScaleLog && isDragonLog) {
              rowStyle = 'bg-gradient-to-r from-rose-950/20 via-orange-950/10 to-transparent border-l-2 border-rose-500 pl-1.5 pr-1 py-0.5 my-0.5 rounded-r';
            } else if (isScaleLog) {
              rowStyle = 'bg-rose-950/15 border-l-2 border-rose-500/60 pl-1.5 pr-1 py-0.5 my-0.5 rounded-r';
            } else if (isDragonLog) {
              rowStyle = 'bg-orange-950/15 border-l-2 border-orange-500/60 pl-1.5 pr-1 py-0.5 my-0.5 rounded-r';
            }

            const uniqueKey = log.id || `log_row_${idx}_${safeText.slice(0, 10)}`;

            return (
              <div key={uniqueKey} className={`flex items-start transition-all border-b border-slate-900/20 ${isCompact ? 'gap-1.5 py-0.5' : 'gap-2 py-1'} ${rowStyle}`}>
                <span className={`text-slate-600 shrink-0 select-none ${isCompact ? 'text-[10px]' : 'text-[11.5px]'}`}>[{log.timestamp || '00:00'}]</span>
                <div className={`flex-1 ${isCompact ? 'leading-snug' : 'leading-relaxed'} ${rowStyle ? getMessageTextColor(log.type) : getMessageStyles(log.type)}`}>
                  {parseMessageText(safeText)}
                  {count > 1 && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-sans font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      x{count}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Scroll to Latest Indicator */}
      {!isPinned && filteredLogs.length > 0 && (
        <button
          onClick={handleScrollToLatest}
          className="absolute bottom-2 right-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-sans font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-all border border-amber-400/20 cursor-pointer animate-bounce z-10"
        >
          <span>{sortOrder === 'newest-first' ? '↑ Scroll to Latest' : '↓ Scroll to Latest'}</span>
        </button>
      )}
    </div>
  );
}

export const GameLog = React.memo(GameLogComponent);
export default GameLog;
