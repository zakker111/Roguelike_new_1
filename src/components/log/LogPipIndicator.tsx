/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PipCategory } from './types';

interface LogPipIndicatorProps {
  category: PipCategory;
  className?: string;
}

export function resolvePipCategory(type: string, text: string): PipCategory {
  const textLower = text.toLowerCase();
  
  if (type === 'danger' || textLower.includes('you took') || textLower.includes('damaged you') || textLower.includes('critical hit! you took')) {
    return 'danger';
  }
  
  if (textLower.includes('restored') || textLower.includes('healed') || textLower.includes('drank') || textLower.includes('+hp') || textLower.includes('+mp')) {
    return 'heal';
  }
  
  if (type === 'combat' || textLower.includes('struck') || textLower.includes('slain') || textLower.includes('cleaved') || textLower.includes('damage') || textLower.includes('attack')) {
    return 'combat';
  }
  
  if (type === 'loot' || textLower.includes('gold') || textLower.includes('chest') || textLower.includes('found') || textLower.includes('acquired') || textLower.includes('harvested')) {
    return 'loot';
  }
  
  if (type === 'craft' || textLower.includes('crafted') || textLower.includes('forged') || textLower.includes('brewed') || textLower.includes('cooked')) {
    return 'craft';
  }
  
  if (textLower.includes('weather') || textLower.includes('braced') || textLower.includes('dodged') || textLower.includes('rain') || textLower.includes('snow') || textLower.includes('wind')) {
    return 'system';
  }

  if (type === 'system' || textLower.includes('whispers') || textLower.includes('storyteller') || textLower.includes('relic') || textLower.includes('discovered')) {
    return 'story';
  }
  
  return 'neutral';
}

export const LogPipIndicator: React.FC<LogPipIndicatorProps> = ({ category, className = '' }) => {
  switch (category) {
    case 'danger':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)] shrink-0 ${className}`}
          title="Danger / Damage Received"
        />
      );
    case 'combat':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)] shrink-0 ${className}`}
          title="Combat Attack / Damage Dealt"
        />
      );
    case 'heal':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.6)] shrink-0 ${className}`}
          title="Healing / Recovery"
        />
      );
    case 'story':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.6)] shrink-0 ${className}`}
          title="Storyteller Lore / Relic"
        />
      );
    case 'loot':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.6)] shrink-0 ${className}`}
          title="Spoils & Loot"
        />
      );
    case 'craft':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_5px_rgba(45,212,191,0.6)] shrink-0 ${className}`}
          title="Crafting & Alchemy"
        />
      );
    case 'system':
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)] shrink-0 ${className}`}
          title="Tactical Shift / Weather"
        />
      );
    default:
      return (
        <span 
          className={`inline-block w-2 h-2 rounded-full bg-slate-500/70 shrink-0 ${className}`}
          title="Observation"
        />
      );
  }
};
