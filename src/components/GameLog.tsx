/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { GameLogMessage } from '../types';
import {
  LogFilterCategory,
  LogHeaderBar,
  LogMessageItem,
  LogEncounterRecapBar,
  CollapsedLogEntry,
} from './log';

export type { LogFilterCategory };

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

  // Filter logs based on active category filter and search query
  const filteredLogs = useMemo(() => {
    return (logs || []).filter((log) => {
      if (!log || typeof log !== 'object') return false;
      const textStr = typeof log.text === 'string' ? log.text : String(log.text || '');
      if (!textStr) return false;

      // Category matching
      if (activeFilter === 'combat') {
        const textLower = textStr.toLowerCase();
        const isCombat =
          log.type === 'combat' ||
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
        const isStory =
          log.type === 'system' ||
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
        const isLoot =
          log.type === 'loot' ||
          textLower.includes('found') ||
          textLower.includes('acquired') ||
          textLower.includes('picked up') ||
          textLower.includes('gold') ||
          textLower.includes('chest') ||
          textLower.includes('harvested');
        if (!isLoot) return false;
      } else if (activeFilter === 'craft') {
        const textLower = textStr.toLowerCase();
        const isCraft =
          log.type === 'craft' ||
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
  const collapsedLogs: CollapsedLogEntry[] = useMemo(() => {
    const list: CollapsedLogEntry[] = [];
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
      combat: logs.filter((l) => l.type === 'combat' || l.type === 'danger').length,
      story: logs.filter((l) => l.type === 'system' || l.type === 'quest').length,
      loot: logs.filter((l) => l.type === 'loot').length,
      craft: logs.filter((l) => l.type === 'craft').length,
    };
  }, [logs]);

  return (
    <div
      className={
        className ||
        'relative bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden h-56 flex flex-col shadow-2xl'
      }
      id="game-logs-panel-parent"
    >
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

      {/* Modular Log Header with Categories and Search */}
      <LogHeaderBar
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        categoryCounts={categoryCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCompact={isCompact}
        onToggleCompact={() => setIsCompact(!isCompact)}
        sortOrder={sortOrder}
        onToggleSortOrder={() =>
          setSortOrder((prev) => (prev === 'newest-first' ? 'oldest-first' : 'newest-first'))
        }
        onDownloadLogs={onDownloadLogs}
        onClearLogs={onClearLogs}
      />

      {/* Modular Post-Combat Encounter Recap & Tally Widget */}
      <LogEncounterRecapBar logs={logs} />

      {/* Log Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 min-h-0 overflow-y-auto custom-log-scrollbar bg-slate-950/40 ${
          isCompact ? 'p-2 text-[11px] leading-snug' : 'p-3 text-xs leading-relaxed'
        } font-mono flex flex-col gap-0.5`}
      >
        {collapsedLogs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-10 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl opacity-40">📜</span>
            <span className="text-xs">
              {searchQuery
                ? `No entries match "${searchQuery}" in ${activeFilter} filter.`
                : activeFilter === 'combat'
                ? 'No combat skirmishes recorded in this region yet...'
                : activeFilter === 'story'
                ? 'No storytelling interventions or ancient lore records yet...'
                : activeFilter === 'loot'
                ? 'No items harvested or chests unlocked yet...'
                : 'The halls are silent. Take a step to record your descent...'}
            </span>
          </div>
        ) : (
          displayLogs.map(({ log, count }, idx) => {
            if (!log) return null;
            const uniqueKey = log.id || `log_row_${idx}_${(log.text || '').slice(0, 10)}`;

            return (
              <LogMessageItem
                key={uniqueKey}
                log={log}
                count={count}
                isCompact={isCompact}
              />
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
          {sortOrder === 'newest-first' ? (
            <ArrowUpCircle className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownCircle className="w-3.5 h-3.5" />
          )}
          <span>Jump to Latest</span>
        </button>
      )}
    </div>
  );
}

export const GameLog = React.memo(GameLogComponent);
export default GameLog;
