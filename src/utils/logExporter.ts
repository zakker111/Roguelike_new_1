/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, GameLogMessage } from '../types';
import { getCurrentWorldSeed } from './overworld';

export interface LogExporterOptions {
  gameState: GameState;
  sessionLogs: GameLogMessage[];
  sessionSnapshots: Array<{ turn: number; gameTimeStr: string; state: GameState }>;
  appletId?: string;
}

export function exportAndDownloadGameLogs({
  gameState,
  sessionLogs,
  sessionSnapshots,
  appletId = "e743f047-96de-4fc7-8cf6-cc907f6ee5bd"
}: LogExporterOptions): void {
  const seed = getCurrentWorldSeed();
  const stats = gameState.playerStats;
  const finalWeapon = gameState.currentWeapon?.name || 'Recruit Hatchet';
  const timestampStr = new Date().toLocaleString();

  let content = `======================================================================\n`;
  content += `                SUNDER SANCTUM PLAYTHROUGH ADVENTURE LOGS\n`;
  content += `======================================================================\n`;
  content += `Time of Demise/Victory: ${timestampStr}\n`;
  content += `World Seed:       ${seed}\n`;
  content += `Floors Cleared:   ${stats.depth}\n`;
  content += `Turns Kept:       ${stats.turnsPlayed}\n`;
  content += `Gold Plundered:   ${stats.gold} Gold coins\n`;
  content += `Final Masterpiece: ${finalWeapon}\n`;
  content += `----------------------------------------------------------------------\n\n`;
  content += `CHRONOLOGICAL RUN JOURNAL:\n`;

  const logsToDownload = sessionLogs.length > 0 ? sessionLogs : gameState.logs;

  logsToDownload.forEach((log) => {
    content += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.text}\n`;
  });

  content += `\n======================================================================\n`;
  content += `                       END OF ADVENTURE JOURNAL\n`;
  content += `======================================================================\n`;

  // Comprehensive Simulation Payload
  content += `\n\n======================================================================\n`;
  content += `                 --- COMPREHENSIVE SIMULATOR REPLAY DATA ---          \n`;
  content += `======================================================================\n`;
  content += `The block below contains precise turn-by-turn state telemetry records.\n`;
  content += `This structured JSON can be loaded into an automated game engine/replay simulator.\n\n`;

  try {
    const simulationPayload = {
      appletId,
      gameName: "Sunder Sanctum",
      exportedAt: timestampStr,
      seed,
      finalStats: {
        depth: stats.depth,
        turnsPlayed: stats.turnsPlayed,
        realTimeSeconds: stats.realTimeSeconds,
        gold: stats.gold,
        level: stats.level,
        xp: stats.xp,
        hp: stats.hp,
        mp: stats.mp,
        maxHp: stats.maxHp,
        maxMp: stats.maxMp,
        exhaustion: stats.exhaustion,
      },
      finalWeapon,
      journalLogsCount: logsToDownload.length,
      snapshotsCount: sessionSnapshots.length,
      snapshots: sessionSnapshots.map(({ turn, gameTimeStr, state }) => ({ turn, gameTimeStr, state }))
    };

    content += JSON.stringify(simulationPayload, null, 2);
  } catch (e) {
    content += `// ERROR SERIALIZING TELEMETRY SNAPSHOTS: ${String(e)}\n`;
  }

  content += `\n======================================================================\n`;
  content += `                   --- END OF SIMULATOR REPLAY DATA ---               \n`;
  content += `======================================================================\n`;

  // Write to clipboard as an extremely robust fallback
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content);
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        const copyEv = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: `📋 LOGS COPIED!`, type: 'heal' },
        });
        window.dispatchEvent(copyEv);
      }
    }
  } catch (clipError) {
    console.warn('Could not copy to clipboard:', clipError);
  }

  if (typeof document !== 'undefined' && document.createElement && document.body) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sunder_sanctum_run_seed_${seed}_depth_${stats.depth}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (exportErr) {
      console.warn('Error triggering browser download link:', exportErr);
    }
  }
}
