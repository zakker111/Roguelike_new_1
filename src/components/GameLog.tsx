/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ScrollText, 
  Trash2, 
  Download, 
  Swords, 
  Sparkles, 
  Coins, 
  Hammer, 
  Search, 
  X, 
  ArrowDownCircle, 
  ArrowUpCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import { GameLogMessage } from '../types';

export type LogFilterCategory = 'all' | 'combat' | 'story' | 'loot' | 'craft' | 'system';

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
  const [activeFilter, setActiveFilter] = useState<LogFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  }, [logs, isPinned, activeFilter, searchQuery, sortOrder]);

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
        return 'text-rose-400 border-l-2 border-rose-500/50 pl-2';
      case 'loot':
        return 'text-amber-400 border-l-2 border-amber-500/50 pl-2';
      case 'trap':
        return 'text-fuchsia-400 border-l-2 border-fuchsia-500/50 pl-2';
      case 'craft':
        return 'text-emerald-400 border-l-2 border-emerald-500/50 pl-2 font-bold';
      case 'danger':
        return 'text-red-500 font-bold uppercase tracking-wide border-l-2 border-red-600 pl-2 bg-red-950/15 py-0.5 rounded-r animate-pulse';
      case 'system':
        return 'text-sky-400 border-l-2 border-sky-500/40 pl-2';
      default:
        return 'text-slate-300 border-l-2 border-slate-700/60 pl-2';
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
        return 'text-sky-400';
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
        const isHeal = inner.includes('HEAL') || inner.includes('+HP') || inner.includes('Restored');
        const isExp = inner.includes('XP') || inner.includes('Level');
        
        let badgeColor = 'bg-slate-950/70 text-amber-300 border-slate-800';
        if (isDamage) {
          badgeColor = 'bg-rose-950/70 text-rose-300 border-rose-800/50';
        } else if (isHeal) {
          badgeColor = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50';
        } else if (isExp) {
          badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-800/50';
        }

        return (
          <span key={i} className={`font-bold px-1.5 py-0.5 mx-0.5 rounded text-[10.5px] border select-all font-mono ${badgeColor}`}>
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
          rendered = <span className="text-amber-300 font-extrabold tracking-wider bg-amber-950/40 px-1 py-0.2 rounded border border-amber-500/30">{subPart}</span>;
        } else if (subPart.includes('Dodged!') || subPart.includes('evade') || subPart.includes('EVADED')) {
          rendered = <span className="text-sky-300 font-semibold">{subPart}</span>;
        } else if (subPart.includes('LIFESTEAL')) {
          rendered = <span className="text-rose-400 font-bold tracking-tight">{subPart}</span>;
        } else if (subPart.includes('Braced!')) {
          rendered = <span className="text-teal-300 font-bold">{subPart}</span>;
        } else if (subPart.includes('broken!')) {
          rendered = <span className="text-red-500 font-extrabold bg-red-950/50 px-1 rounded">{subPart}</span>;
        }

        return <span key={subIdx}>{rendered}</span>;
      });

      return <React.Fragment key={i}>{parsedSubParts}</React.Fragment>;
    });
  };

  // Filter logs based on active category filter and search query
  const filteredLogs = useMemo(() => {
    return (logs || []).filter((log) => {
      if (!log || typeof log !== 'object') return false;
      const textStr = typeof log.text === 'string' ? log.text : String(log.text || '');
      if (!textStr) return false;

      // Category matching
      if (activeFilter === 'combat') {
        const textLower = textStr.toLowerCase();
        const isCombat = log.type === 'combat' || 
          log.type === 'danger' || 
          textLower.includes('struck') ||
          textLower.includes('strikes') ||
          textLower.includes('damage') ||
          textLower.includes('healed') ||
          textLower.includes('defeated') ||
          textLower.includes('slain') ||
          textLower.includes('missed') ||
          textLower.includes('crit');
        if (!isCombat) return false;
      } else if (activeFilter === 'story') {
        const textLower = textStr.toLowerCase();
        const isStory = log.type === 'system' ||
          textLower.includes('whispers') ||
          textLower.includes('storyteller') ||
          textLower.includes('chronicler') ||
          textLower.includes('quest') ||
          textLower.includes('shrine') ||
          textLower.includes('ruins') ||
          textLower.includes('discovered');
        if (!isStory) return false;
      } else if (activeFilter === 'loot') {
        const textLower = textStr.toLowerCase();
        const isLoot = log.type === 'loot' ||
          textLower.includes('found') ||
          textLower.includes('acquired') ||
          textLower.includes('picked up') ||
          textLower.includes('gold') ||
          textLower.includes('chest') ||
          textLower.includes('harvested');
        if (!isLoot) return false;
      } else if (activeFilter === 'craft') {
        const textLower = textStr.toLowerCase();
        const isCraft = log.type === 'craft' ||
          textLower.includes('forged') ||
          textLower.includes('crafted') ||
          textLower.includes('brewed') ||
          textLower.includes('cooked') ||
          textLower.includes('scribed') ||
          textLower.includes('mutated') ||
          textLower.includes('upgraded');
        if (!isCraft) return false;
      } else if (activeFilter === 'system') {
        if (log.type !== 'system' && log.type !== 'trap') return false;
      }

      // Search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!textStr.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [logs, activeFilter, searchQuery]);

  // Aggregate consecutive duplicate log entries for cleaner feed
  const collapsedLogs: Array<{ log: GameLogMessage; count: number }> = useMemo(() => {
    const list: Array<{ log: GameLogMessage; count: number }> = [];
    filteredLogs.forEach((currentLog) => {
      const textStr = typeof currentLog.text === 'string' ? currentLog.text : String(currentLog.text || '');
      const lastItem = list[list.length - 1];
      if (lastItem) {
        const lastText = typeof lastItem.log.text === 'string' ? lastItem.log.text : String(lastItem.log.text || '');
        if (lastText === textStr && lastItem.log.type === currentLog.type) {
          lastItem.count += 1;
          return;
        }
      }
      list.push({ log: currentLog, count: 1 });
    });
    return list;
  }, [filteredLogs]);

  // Performance: Limit DOM rendering to latest 160 log entries
  const maxRenderedLogs = 160;
  const slicedLogs = collapsedLogs.slice(-maxRenderedLogs);
  const displayLogs = sortOrder === 'newest-first' ? [...slicedLogs].reverse() : slicedLogs;

  const categoryCounts = useMemo(() => {
    return {
      all: logs.length,
      combat: logs.filter(l => l.type === 'combat' || l.type === 'danger').length,
      loot: logs.filter(l => l.type === 'loot').length,
      craft: logs.filter(l => l.type === 'craft').length,
    };
  }, [logs]);

  return (
    <div className={className || "relative bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden h-56 flex flex-col shadow-2xl"} id="game-logs-panel-parent">
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
          background: rgba(15, 23, 42, 0.6);
        }
        .custom-log-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.35);
          border-radius: 3px;
        }
        .custom-log-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.6);
        }
      `}</style>

      {/* Log Header with Categories and Search */}
      <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between z-10 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="text-slate-200 font-sans font-bold text-xs uppercase tracking-wider hidden sm:inline">Chronologue</span>
            <span className="text-slate-200 font-sans font-bold text-xs uppercase tracking-wider sm:hidden">Logs</span>
          </div>
          
          {/* Tactical Filters */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] uppercase font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              All <span className="opacity-60 text-[8.5px]">({categoryCounts.all})</span>
            </button>
            <button
              onClick={() => setActiveFilter('combat')}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'combat'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Swords className="w-2.5 h-2.5" />
              Combat
            </button>
            <button
              onClick={() => setActiveFilter('story')}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'story'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Story
            </button>
            <button
              onClick={() => setActiveFilter('loot')}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'loot'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Coins className="w-2.5 h-2.5" />
              Loot
            </button>
            <button
              onClick={() => setActiveFilter('craft')}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'craft'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Hammer className="w-2.5 h-2.5" />
              Craft
            </button>
          </div>

          {/* Inline Search Filter Input */}
          <div className="relative flex items-center shrink-0">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-6 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 font-mono w-24 sm:w-32 focus:w-40 transition-all focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Actions & Utilities */}
        <div className="flex items-center gap-1.5 shrink-0 font-sans">
          {/* Spacing density toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold transition-all border cursor-pointer ${
              isCompact
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
            title="Toggle compact line spacing"
          >
            {isCompact ? 'Compact' : 'Spaced'}
          </button>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'newest-first' ? 'oldest-first' : 'newest-first')}
            className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold transition-all border cursor-pointer ${
              sortOrder === 'newest-first'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle log ordering (Newest on top / Oldest on top)"
          >
            {sortOrder === 'newest-first' ? '↓ Newest' : '↑ Oldest'}
          </button>

          {onDownloadLogs && (
            <button
              onClick={onDownloadLogs}
              className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 rounded-lg hover:bg-slate-900 flex items-center gap-1 text-[9px] font-bold border border-emerald-500/30 px-2 cursor-pointer"
              title="Download Playthrough Simulation Logs"
              id="download-logs-game-btn"
            >
              <Download className="w-2.5 h-2.5 text-emerald-400" />
              <span className="hidden sm:inline">EXPORT</span>
            </button>
          )}

          <button
            onClick={onClearLogs}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-900 cursor-pointer"
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
        className={`flex-1 min-h-0 overflow-y-auto custom-log-scrollbar bg-slate-950/40 ${
          isCompact ? 'p-2.5 text-[11.5px] leading-snug' : 'p-3 text-[13px] leading-relaxed'
        } font-mono flex flex-col gap-1.5`}
      >
        {collapsedLogs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-10 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl opacity-40">📜</span>
            <span className="text-xs">
              {searchQuery 
                ? `No entries match "${searchQuery}" in ${activeFilter} filter.` 
                : activeFilter === 'combat' 
                ? "No combat skirmishes recorded in this region yet..." 
                : activeFilter === 'story'
                ? "No storytelling interventions or ancient lore records yet..."
                : activeFilter === 'loot'
                ? "No items harvested or chests unlocked yet..."
                : "The halls are silent. Take a step to record your descent..."}
            </span>
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
              rowStyle = 'bg-gradient-to-r from-rose-950/25 via-orange-950/15 to-transparent border-l-2 border-rose-500 pl-2 pr-1 py-0.5 my-0.5 rounded-r';
            } else if (isScaleLog) {
              rowStyle = 'bg-rose-950/20 border-l-2 border-rose-500/70 pl-2 pr-1 py-0.5 my-0.5 rounded-r';
            } else if (isDragonLog) {
              rowStyle = 'bg-orange-950/20 border-l-2 border-orange-500/70 pl-2 pr-1 py-0.5 my-0.5 rounded-r';
            }

            const uniqueKey = log.id || `log_row_${idx}_${safeText.slice(0, 10)}`;

            return (
              <div key={uniqueKey} className={`flex items-start transition-all border-b border-slate-900/30 ${isCompact ? 'gap-1.5 py-0.5' : 'gap-2 py-1'} ${rowStyle}`}>
                <span className={`text-slate-600 shrink-0 select-none ${isCompact ? 'text-[9.5px]' : 'text-[11px]'}`}>[{log.timestamp || '00:00'}]</span>
                <div className={`flex-1 ${isCompact ? 'leading-snug' : 'leading-relaxed'} ${rowStyle ? getMessageTextColor(log.type) : getMessageStyles(log.type)}`}>
                  {parseMessageText(safeText)}
                  {count > 1 && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-sans font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
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
          className="absolute bottom-2.5 right-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-sans font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xl transition-all border border-amber-300 cursor-pointer animate-bounce z-10"
        >
          {sortOrder === 'newest-first' ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
          <span>Jump to Latest</span>
        </button>
      )}
    </div>
  );
}

export const GameLog = React.memo(GameLogComponent);
export default GameLog;
