/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCw, Play } from 'lucide-react';

export interface GodCaravanManagerProps {
  handleResetHouses: () => void;
  townTemplates: any;
  selectedLayoutIndex: number;
  handleSelectTownLayout: (idx: number) => void;
  housesJsonText: string;
  setHousesJsonText: (v: string) => void;
  handleApplyHousesJson: () => void;
}

export const GodCaravanManager: React.FC<GodCaravanManagerProps> = ({
  handleResetHouses,
  townTemplates,
  selectedLayoutIndex,
  handleSelectTownLayout,
  housesJsonText,
  setHousesJsonText,
  handleApplyHousesJson,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
        <div>
          <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1">
            <span>Oakhaven Settlement Builders (JSON)</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Reposition houses, customize widths/heights, or change structural shapes dynamically.
          </p>
        </div>
        <button
          onClick={handleResetHouses}
          className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          <RotateCw className="w-3 h-3 text-red-500" />
          <span>Restore Defaults</span>
        </button>
      </div>

      {/* Predefined Town Layouts Selector */}
      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
        <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider">Predefined Town Templates (From townTemplates.json):</span>
        <p className="text-[9px] text-slate-500 leading-normal">
          Select a preconfigured modular town layout pool to view or customize. Choosing one will populate the JSON coordinate box below.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {townTemplates?.townLayouts?.map((layout: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelectTownLayout(idx)}
              className={`p-2 rounded text-left border transition-all text-xs cursor-pointer ${
                selectedLayoutIndex === idx
                  ? 'border-purple-500 bg-purple-950/20 text-purple-300 font-bold'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold truncate">{layout.name}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{layout.buildings.length} Buildings • Town Square</div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual summaries of houses */}
      <div className="p-2.5 bg-slate-950/50 border border-slate-850 rounded-lg">
        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Customised Houses Blueprint:</span>
        <div className="grid grid-cols-4 gap-2 font-mono text-[10px]">
          {((window as any).customHouses || []).map((h: any, index: number) => (
            <div key={index} className="bg-slate-900 border border-slate-800 p-2 rounded">
              <div className="font-semibold text-slate-200 truncate">{h.name}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Pos: ({h.x}, {h.y})
              </div>
              <div className="text-[9px] text-slate-500">
                Size: {h.w} x {h.h}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON code box for houses */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 block font-bold">Configure Houses Layout (JSON):</span>
        <textarea
          value={housesJsonText}
          onChange={(e) => setHousesJsonText(e.target.value)}
          className="w-full h-64 p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] leading-relaxed text-slate-300 focus:border-red-600 focus:outline-none"
          spellCheck="false"
          placeholder="[{ 'id': 'blacksmith', 'name': 'Blacksmith Shop', 'x': 6, 'y': 4, 'w': 7, 'h': 7 }]"
        />
      </div>

      {/* Apply / Live Rebuild button */}
      <button
        onClick={handleApplyHousesJson}
        className="w-full py-2.5 bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
      >
        <Play className="w-4 h-4" />
        <span>Save Blueprints & Rebuild Active Settlement</span>
      </button>
    </div>
  );
};
