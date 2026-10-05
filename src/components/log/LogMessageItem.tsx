/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { GameLogMessage } from '../../types';
import { LogPipIndicator, resolvePipCategory } from './LogPipIndicator';

interface LogMessageItemProps {
  log: GameLogMessage;
  count: number;
  isCompact: boolean;
}

export const LogMessageItem: React.FC<LogMessageItemProps> = ({ log, count, isCompact }) => {
  const [copied, setCopied] = useState(false);
  const textStr = typeof log.text === 'string' ? log.text : String(log.text || '');
  const pipCat = resolvePipCategory(log.type, textStr);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(textStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
          <span
            key={i}
            className={`font-bold px-1.5 py-0.5 mx-0.5 rounded text-[10.5px] border select-all font-mono ${badgeColor}`}
          >
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
          rendered = (
            <span className="text-amber-300 font-extrabold tracking-wider bg-amber-950/40 px-1 py-0.2 rounded border border-amber-500/30">
              {subPart}
            </span>
          );
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

  const getTextColor = (cat: typeof pipCat) => {
    switch (cat) {
      case 'danger':
        return 'text-rose-300 font-semibold';
      case 'combat':
        return 'text-amber-200/90';
      case 'heal':
        return 'text-emerald-300';
      case 'story':
        return 'text-purple-300 italic';
      case 'loot':
        return 'text-yellow-200';
      case 'craft':
        return 'text-teal-300 font-medium';
      case 'system':
        return 'text-sky-300';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-2.5 transition-colors rounded-lg px-2 hover:bg-slate-900/60 ${
        isCompact ? 'py-1 text-[11px]' : 'py-1.5 text-xs'
      }`}
    >
      {/* Category pip with vertical alignment */}
      <div className="pt-1.5">
        <LogPipIndicator category={pipCat} />
      </div>

      {/* Unboxed Monospace Timestamp & Turn */}
      {(log.timestamp || log.turn !== undefined) && (
        <span className="text-[10px] font-mono text-slate-500 select-none shrink-0 pt-0.5 tracking-tight">
          {`${log.turn !== undefined ? `T:${log.turn} · ` : ''}${log.timestamp || ''}`}
        </span>
      )}

      {/* Main Message Content */}
      <div className={`flex-1 leading-relaxed break-words font-sans min-w-0 ${getTextColor(pipCat)}`}>
        {parseMessageText(textStr)}

        {/* Smart Duplicate Stacking Badge */}
        {count > 1 && (
          <span
            className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 select-none animate-pulse"
            title={`Repeated ${count} times consecutively`}
          >
            {`×${count}`}
          </span>
        )}
      </div>

      {/* Hover Copy Action */}
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-slate-300 cursor-pointer shrink-0 rounded"
        title="Copy line to clipboard"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
};
