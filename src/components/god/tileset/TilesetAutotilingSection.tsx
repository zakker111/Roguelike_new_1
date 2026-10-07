/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grid } from 'lucide-react';
import { tilesetAtlasManager } from '../../../canvas/TilesetAtlasManager';
import { TileType } from '../../../types';
import { AUTOTILING_MASKS } from './tilesetTesterTypes';

export function TilesetAutotilingSection() {
  return (
    <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1">
          <Grid className="w-3.5 h-3.5 text-amber-400" />
          <span>16-Neighbor Cardinal Wang Autotile Layout (N=1, E=2, S=4, W=8)</span>
        </h4>
        <p className="text-xs text-slate-400">
          The engine evaluates 4 cardinal neighbor bits to dynamically stitch seamless walls, rivers, and stone pathways.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AUTOTILING_MASKS.map((bm) => {
          const coords = tilesetAtlasManager.getAutotileCoords(TileType.Wall, bm.mask);
          return (
            <div
              key={bm.mask}
              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 block">{bm.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Grid: Col {coords?.sx ?? 0}, Row {coords?.sy ?? 0}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono text-xs text-amber-300 font-black">
                {bm.mask}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
