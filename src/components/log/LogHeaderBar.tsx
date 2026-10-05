/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScrollText, Trash2, Download } from 'lucide-react';
import { LogFilterCategory } from './types';
import { LogFilterControls } from './LogFilterControls';

interface LogHeaderBarProps {
  activeFilter: LogFilterCategory;
  onSelectFilter: (category: LogFilterCategory) => void;
  categoryCounts: {
    all: number;
    combat: number;
    story: number;
    loot: number;
    craft: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCompact: boolean;
  onToggleCompact: () => void;
  sortOrder: 'newest-first' | 'oldest-first';
  onToggleSortOrder: () => void;
  onDownloadLogs?: () => void;
  onClearLogs: () => void;
}

export const LogHeaderBar: React.FC<LogHeaderBarProps> = ({
  activeFilter,
  onSelectFilter,
  categoryCounts,
  searchQuery,
  onSearchChange,
  isCompact,
  onToggleCompact,
  sortOrder,
  onToggleSortOrder,
  onDownloadLogs,
  onClearLogs,
}) => {
  return (
    <div className="bg-slate-950/95 px-3 py-2 border-b border-slate-800 flex items-center justify-between z-10 select-none flex-wrap gap-2">
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        {/* Title branding with thematic parchment icon */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <span className="text-slate-200 font-sans font-bold text-xs uppercase tracking-wider hidden sm:inline">
            Chronologue
          </span>
          <span className="text-slate-200 font-sans font-bold text-xs uppercase tracking-wider sm:hidden">
            Logs
          </span>
        </div>

        {/* Filter Categories and Search Input */}
        <LogFilterControls
          activeFilter={activeFilter}
          onSelectFilter={onSelectFilter}
          categoryCounts={categoryCounts}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>

      {/* Action and Utility Controls */}
      <div className="flex items-center gap-1.5 shrink-0 font-sans">
        {/* Density Spacing Toggle */}
        <button
          onClick={onToggleCompact}
          className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold transition-all border cursor-pointer ${
            isCompact
              ? 'bg-slate-800 text-slate-300 border-slate-700'
              : 'text-slate-500 hover:text-slate-300 border-transparent'
          }`}
          title="Toggle compact line spacing"
        >
          {isCompact ? 'Compact' : 'Spaced'}
        </button>

        {/* Chronological Sort Order Toggle */}
        <button
          onClick={onToggleSortOrder}
          className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold transition-all border cursor-pointer ${
            sortOrder === 'newest-first'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title="Toggle log ordering (Newest on top / Oldest on top)"
        >
          {sortOrder === 'newest-first' ? '↓ Newest' : '↑ Oldest'}
        </button>

        {/* Optional Export Logs */}
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

        {/* Clear Logs */}
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
  );
};
