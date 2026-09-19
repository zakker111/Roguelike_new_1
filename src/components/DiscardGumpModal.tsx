import React, { useState, useEffect } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

export interface DiscardGumpData {
  type: 'item' | 'material' | 'catalyst';
  id: string;
  name: string;
  icon?: string;
  color?: string;
  maxQuantity: number;
  unitWeight: number;
}

interface DiscardGumpModalProps {
  data: DiscardGumpData | null;
  onClose: () => void;
  onConfirm: (data: DiscardGumpData, quantityToDiscard: number) => void;
}

export const DiscardGumpModal: React.FC<DiscardGumpModalProps> = ({
  data,
  onClose,
  onConfirm
}) => {
  if (!data) return null;

  const [qty, setQty] = useState<number>(1);

  // Reset qty to 1 when target item changes
  useEffect(() => {
    setQty(1);
  }, [data?.id]);

  // Close Discard Gump on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const maxQty = data.maxQuantity;
  const weightSaved = (data.unitWeight * qty).toFixed(1);
  const remainingQty = maxQty - qty;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setQty(1);
    } else {
      setQty(Math.min(maxQty, Math.max(1, val)));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQty(parseInt(e.target.value, 10));
  };

  const handleQuickSet = (value: number) => {
    setQty(Math.min(maxQty, Math.max(1, value)));
  };

  const handleAdd = (delta: number) => {
    setQty((prev) => Math.min(maxQty, Math.max(1, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl max-w-md w-full shadow-2xl p-5 flex flex-col gap-4 text-slate-100 relative overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)' }}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="font-bold text-amber-400 text-sm tracking-wider uppercase font-mono">
                📜 Discard Quantity Gump
              </h3>
              <p className="text-[10px] text-slate-400">Choose quantity to cast into the abyss</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Info Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{data.icon || '📦'}</span>
            <div className="min-w-0">
              <span className="font-bold text-sm truncate block" style={{ color: data.color || '#f1f5f9' }}>
                {data.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Unit weight: {data.unitWeight} kg
              </span>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-center shrink-0">
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Available</span>
            <span className="text-sm font-bold font-mono text-amber-400">x{maxQty}</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex flex-col gap-3 my-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-300 font-semibold">Quantity to Discard:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdd(-1)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-amber-400 font-bold font-mono text-sm flex items-center justify-center cursor-pointer transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={handleInputChange}
                className="w-16 h-8 bg-slate-950 border border-amber-500/50 rounded-lg text-center font-mono font-bold text-amber-400 text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => handleAdd(1)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-amber-400 font-bold font-mono text-sm flex items-center justify-center cursor-pointer transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={maxQty}
            value={qty}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
          />

          {/* Quick Buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            <button
              onClick={() => handleQuickSet(1)}
              className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              1
            </button>
            <button
              onClick={() => handleQuickSet(qty - 5)}
              className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              -5
            </button>
            <button
              onClick={() => handleQuickSet(qty + 5)}
              className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              +5
            </button>
            <button
              onClick={() => handleQuickSet(Math.max(1, Math.floor(maxQty / 2)))}
              className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              HALF
            </button>
            <button
              onClick={() => handleQuickSet(maxQty)}
              className="py-1 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-rose-400 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              ALL
            </button>
          </div>
        </div>

        {/* Discard Summary */}
        <div className="bg-slate-900/60 border border-rose-900/30 rounded-xl p-3 flex flex-col gap-1 text-[11px] font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Discarding:</span>
            <span className="font-bold text-rose-400">{qty}x {data.name}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Remaining in bag:</span>
            <span className="text-amber-400 font-bold">{remainingQty}x</span>
          </div>
          <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1 mt-1">
            <span>Carry Weight Saved:</span>
            <span className="text-emerald-400 font-bold">-{weightSaved} kg</span>
          </div>
        </div>

        {/* Warning note */}
        <div className="flex items-center gap-1.5 text-[10px] text-rose-400/80 bg-rose-950/20 p-2 rounded-lg border border-rose-900/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Discarded items cannot be recovered once thrown into the abyss.</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              onConfirm(data, qty);
              onClose();
            }}
            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 uppercase font-mono"
          >
            🔥 DISCARD {qty}x
          </button>
        </div>
      </div>
    </div>
  );
};
