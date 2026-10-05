/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { GlyphScribingResult } from '../../../types/minigames/glyphGame';

export interface ScriptoriumScoreCardProps {
  isCompleted: boolean;
  isFailed: boolean;
  scribingResult: GlyphScribingResult;
  harmonicChains: number;
  mistakeCount: number;
  onSuccess: (result: GlyphScribingResult) => void;
  onFail?: () => void;
  onClose: () => void;
  resetTracingState: () => void;
}

export const ScriptoriumScoreCard: React.FC<ScriptoriumScoreCardProps> = ({
  isCompleted,
  isFailed,
  scribingResult,
  harmonicChains,
  mistakeCount,
  onSuccess,
  onFail,
  onClose,
  resetTracingState,
}) => {
  if (isCompleted) {
    return (
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
        <div
          className={`p-4 rounded-2xl border ${
            scribingResult.isMasterwork
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-sky-500/20 border-sky-400 text-sky-300'
          } mb-4 shadow-xl`}
        >
          <Award className="w-12 h-12" />
        </div>

        <h3 className="text-lg font-black text-slate-100 uppercase tracking-wider">
          {scribingResult.isMasterwork ? '⭐ Flawless Masterwork Inscription! ⭐' : 'Scroll Scribed Successfully!'}
        </h3>

        <p className="text-xs text-slate-300 font-mono mt-1 max-w-sm">
          {scribingResult.isMasterwork
            ? 'Your rhythmic strokes harmonized with the ancient leylines! 0 MP cast cost, +30% spell damage potency, and increased sell value.'
            : 'The arcane glyphs hold steady on enchanted parchment. Ready for combat casting.'}
        </p>

        <div className="my-4 grid grid-cols-2 gap-3 w-full max-w-xs text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="text-left">
            <span className="text-slate-500">Accuracy:</span>
            <p className="font-bold text-emerald-400">{scribingResult.accuracyScore}%</p>
          </div>
          <div className="text-left">
            <span className="text-slate-500">Peak Heat:</span>
            <p className="font-bold text-sky-400">{scribingResult.instabilityReached}%</p>
          </div>
          <div className="text-left">
            <span className="text-slate-500">Mana Cost:</span>
            <p className="font-bold text-amber-300">
              {scribingResult.isMasterwork ? '0 MP (Free)' : 'Standard MP'}
            </p>
          </div>
          <div className="text-left">
            <span className="text-slate-500">Harmonics:</span>
            <p className="font-bold text-purple-300">{harmonicChains} rhythm links</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onSuccess(scribingResult);
              onClose();
            }}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Claim & Inscribe Scroll</span>
          </button>
          <button
            onClick={resetTracingState}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Inscribe Again
          </button>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-400 mb-4 shadow-xl">
          <AlertTriangle className="w-12 h-12" />
        </div>

        <h3 className="text-lg font-black text-rose-400 uppercase tracking-wider">
          💥 Arcane Backlash & Mana Mishap!
        </h3>

        <p className="text-xs text-slate-300 font-mono mt-1 max-w-sm">
          Instability overloaded the parchment runes! The ink fizzled into smoke before the glyph could be anchored.
        </p>

        <div className="my-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 max-w-xs">
          <p>
            Mistakes: <span className="text-rose-400 font-bold">{mistakeCount}</span>
          </p>
          <p>
            Instability: <span className="text-rose-400 font-bold">100% (Overheated)</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetTracingState}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Inscription</span>
          </button>
          <button
            onClick={() => {
              if (onFail) onFail();
              onClose();
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Close Scriptorium
          </button>
        </div>
      </div>
    );
  }

  return null;
};
