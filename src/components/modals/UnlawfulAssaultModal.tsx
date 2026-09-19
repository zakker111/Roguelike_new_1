/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Enemy } from '../../types';

export interface UnlawfulAssaultModalProps {
  unlawfulGuardTarget: { enemy: Enemy; index: number; pathPoints: any[] } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const UnlawfulAssaultModal: React.FC<UnlawfulAssaultModalProps> = ({
  unlawfulGuardTarget,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!unlawfulGuardTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [unlawfulGuardTarget, onCancel]);

  if (!unlawfulGuardTarget) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center animate-scale-up">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⚖️
        </div>
        <div>
          <h3 className="text-base font-extrabold uppercase tracking-wide text-rose-500 font-sans">
            Unlawful Offense Warned
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            You are about to assault <span className="font-bold text-slate-100">{unlawfulGuardTarget.enemy.name}</span>, a peacekeeper of the crown!
          </p>
          <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/40 p-2.5 rounded border border-slate-800">
            ⚠️ <span className="font-bold text-rose-400">CRITICAL CONSEQUENCE:</span> Attacking a town guard will make <strong className="text-slate-100">ALL TOWN GUARDS hostile</strong> to you and your companions permanently!
          </p>
        </div>
        <div className="flex gap-3 justify-center mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            Withdraw Assault
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg shadow-rose-950/50"
          >
            Attack Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlawfulAssaultModal;
