import React from 'react';

export interface MobileCommandPadProps {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onBraceDefense: () => void;
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenWorldMap?: () => void;
}

export const MobileCommandPad: React.FC<MobileCommandPadProps> = ({
  onMove,
  onInteract,
  onBraceDefense,
  onOpenInventory,
  onOpenQuests,
  onOpenWorldMap,
}) => {
  return (
    <div id="mobile-command-pad" className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none animate-fade-in">
      {/* D-PAD DIRECTIONAL GRID */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Movement D-Pad</span>
        <div className="grid grid-cols-3 gap-1.5 w-max">
          {/* Row 1 */}
          <button
            onClick={() => onMove(-1, -1)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Up-Left (Numpad 7)"
          >
            ↖
          </button>
          <button
            onClick={() => onMove(0, -1)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Up (Arrow Up / W)"
          >
            ▲
          </button>
          <button
            onClick={() => onMove(1, -1)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Up-Right (Numpad 9)"
          >
            ↗
          </button>

          {/* Row 2 */}
          <button
            onClick={() => onMove(-1, 0)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Left (Arrow Left / A)"
          >
            ◀
          </button>
          <button
            onClick={() => onMove(0, 0)}
            className="w-12 h-12 rounded-xl bg-slate-950/90 hover:bg-slate-850 border-2 border-slate-800 active:scale-95 text-slate-400 hover:text-slate-300 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-xs"
            title="Pass / Wait Turn (Space / .)"
          >
            WAIT
          </button>
          <button
            onClick={() => onMove(1, 0)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Right (Arrow Right / D)"
          >
            ▶
          </button>

          {/* Row 3 */}
          <button
            onClick={() => onMove(-1, 1)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Down-Left (Numpad 1)"
          >
            ↙
          </button>
          <button
            onClick={() => onMove(0, 1)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Down (Arrow Down / S)"
          >
            ▼
          </button>
          <button
            onClick={() => onMove(1, 1)}
            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
            title="Move Down-Right (Numpad 3)"
          >
            ↘
          </button>
        </div>
      </div>

      {/* QUICK SYSTEM ACTIONS CONTAINER */}
      <div className="flex-1 w-full flex flex-col gap-2.5 items-center sm:items-stretch">
        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase text-center sm:text-left">Tactical Quick Interactions</span>
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm sm:max-w-none">
          <button
            onClick={onInteract}
            className="h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
            title="Interact with adjacent objects / enter stairs"
          >
            <span className="text-sm">🔍</span>
            <span>Interact [G]</span>
          </button>

          <button
            onClick={onBraceDefense}
            className="h-11 rounded-lg bg-sky-500/95 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer uppercase tracking-wider"
            title="Double brace defense parry power"
          >
            <span className="text-sm">🛡️</span>
            <span>Guard [B]</span>
          </button>

          <button
            onClick={onOpenInventory}
            className="h-11 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 active:scale-95 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
            title="Open attributes character sheet overview"
          >
            <span className="text-sm">🎒</span>
            <span>Bag & Stats [C]</span>
          </button>

          <button
            onClick={onOpenQuests}
            className="h-11 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 active:scale-95 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
            title="Browse quest board in village town chunk"
          >
            <span className="text-sm">📜</span>
            <span>Quests Board</span>
          </button>

          {onOpenWorldMap && (
            <button
              onClick={onOpenWorldMap}
              className="h-11 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 active:scale-95 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer col-span-2"
              title="Open Realm Cartography World Map [M]"
            >
              <span className="text-sm">🗺️</span>
              <span>Realm World Map [M]</span>
            </button>
          )}
        </div>

        {/* Extra handy tips help */}
        <div className="text-[9.5px] font-mono text-slate-500 text-center sm:text-left bg-slate-950/40 p-2 rounded border border-slate-850/65 leading-relaxed w-full">
          ⚡ <strong>Tip:</strong> Tap adjoining map cells directly to auto-walk / strike, or tap the Movement D-Pad to traverse safely!
        </div>
      </div>
    </div>
  );
};

export default MobileCommandPad;
