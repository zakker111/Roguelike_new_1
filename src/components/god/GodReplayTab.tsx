import React from 'react';
import { History, FileText, Upload, Minimize2 } from 'lucide-react';

export interface GodReplayTabProps {
  replayError: string | null;
  setReplayError: (err: string | null) => void;
  replayPayload: any;
  setReplayPayload: (payload: any) => void;
  pastedLogs: string;
  setPastedLogs: (logs: string) => void;
  currentReplayIdx: number;
  setCurrentReplayIdx: (idx: number) => void;
  replayIsPlaying: boolean;
  setReplayIsPlaying: (playing: boolean) => void;
  replaySpeed: number;
  setReplaySpeed: (speed: number) => void;
  setIsMinimized: (minimized: boolean) => void;
}

export const GodReplayTab: React.FC<GodReplayTabProps> = ({
  replayError,
  setReplayError,
  replayPayload,
  setReplayPayload,
  pastedLogs,
  setPastedLogs,
  currentReplayIdx,
  setCurrentReplayIdx,
  replayIsPlaying,
  setReplayIsPlaying,
  replaySpeed,
  setReplaySpeed,
  setIsMinimized,
}) => {
  return (
    <div className="space-y-4 font-mono pb-6">
      <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-emerald-400 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Sunder Sanctum Adventure Replay Simulator</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Paste an exported playthrough log file to reconstruct and play back the entire run turn-by-turn.
          </p>
        </div>
      </div>

      {replayError && (
        <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-lg text-red-400 text-[11px] leading-relaxed">
          <span className="font-bold uppercase tracking-widest block mb-1">⚠️ Error Parsing Playthrough Logs</span>
          {replayError}
        </div>
      )}

      {/* Input section or Replay controls */}
      {!replayPayload ? (
        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg space-y-3">
          <div className="flex justify-between items-center pb-1 border-b border-slate-900">
            <label className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload or Paste Playthrough Log File</span>
            </label>
            <span className="text-[8px] text-slate-500 font-sans font-semibold">SUPPORTS MASSIVE LOG FILES (.TXT / .JSON)</span>
          </div>

          {/* Drag-and-Drop & File Upload Importer for Log Files */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                  const content = evt.target?.result as string;
                  if (content) {
                    setPastedLogs(content.length > 50000 ? content.slice(0, 50000) + "\n... [Truncated preview for UI smoothness]" : content);
                    setReplayError(null);
                    try {
                      const startMarker = "--- COMPREHENSIVE SIMULATOR REPLAY DATA ---";
                      const endMarker = "--- END OF SIMULATOR REPLAY DATA ---";
                      let searchSource = content;
                      const startIdx = content.indexOf(startMarker);
                      if (startIdx !== -1) {
                        const afterStart = content.substring(startIdx + startMarker.length);
                        const endIdx = afterStart.indexOf(endMarker);
                        searchSource = endIdx !== -1 ? afterStart.substring(0, endIdx) : afterStart;
                      }
                      const firstBrace = searchSource.indexOf('{');
                      const lastBrace = searchSource.lastIndexOf('}');
                      let jsonText = "";
                      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        jsonText = searchSource.substring(firstBrace, lastBrace + 1).trim();
                      } else if (firstBrace !== -1) {
                        jsonText = searchSource.substring(firstBrace).trim();
                      } else {
                        jsonText = searchSource.trim();
                      }
                      if (!jsonText) throw new Error("Could not find structured simulation JSON payload in file.");
                      const parsed = JSON.parse(jsonText);
                      if (!parsed.snapshots || !Array.isArray(parsed.snapshots)) throw new Error("Parsed data does not contain turn-by-turn snapshots.");
                      setReplayPayload(parsed);
                      setCurrentReplayIdx(0);
                      setReplayError(null);
                    } catch (err: any) {
                      setReplayError(err.message || String(err));
                    }
                  }
                };
                reader.readAsText(file);
              }
            }}
            onClick={() => {
              document.getElementById('log-replay-file-input')?.click();
            }}
            className="border border-dashed border-slate-800 hover:border-emerald-600/60 bg-slate-950/60 hover:bg-slate-950 p-3.5 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group"
          >
            <input
              id="log-replay-file-input"
              type="file"
              accept=".txt,.json,.log"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result as string;
                    if (content) {
                      setPastedLogs(content.length > 50000 ? content.slice(0, 50000) + "\n... [Truncated preview for UI smoothness]" : content);
                      setReplayError(null);
                      try {
                        const startMarker = "--- COMPREHENSIVE SIMULATOR REPLAY DATA ---";
                        const endMarker = "--- END OF SIMULATOR REPLAY DATA ---";
                        let searchSource = content;
                        const startIdx = content.indexOf(startMarker);
                        if (startIdx !== -1) {
                          const afterStart = content.substring(startIdx + startMarker.length);
                          const endIdx = afterStart.indexOf(endMarker);
                          searchSource = endIdx !== -1 ? afterStart.substring(0, endIdx) : afterStart;
                        }
                        const firstBrace = searchSource.indexOf('{');
                        const lastBrace = searchSource.lastIndexOf('}');
                        let jsonText = "";
                        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                          jsonText = searchSource.substring(firstBrace, lastBrace + 1).trim();
                        } else if (firstBrace !== -1) {
                          jsonText = searchSource.substring(firstBrace).trim();
                        } else {
                          jsonText = searchSource.trim();
                        }
                        if (!jsonText) throw new Error("Could not find structured simulation JSON payload in file.");
                        const parsed = JSON.parse(jsonText);
                        if (!parsed.snapshots || !Array.isArray(parsed.snapshots)) throw new Error("Parsed data does not contain turn-by-turn snapshots.");
                        setReplayPayload(parsed);
                        setCurrentReplayIdx(0);
                        setReplayError(null);
                      } catch (err: any) {
                        setReplayError(err.message || String(err));
                      }
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <Upload className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[10.5px] text-slate-300">
              📁 Drag & Drop Log File (.txt / .json) here
            </span>
            <span className="text-[8.5px] text-slate-500 font-sans">
              or click to choose log file directly from your device (Instant Zero-Lag Loader)
            </span>
          </div>

          <div className="relative">
            <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Or Paste Raw Log Text Below:
            </label>
            <textarea
              rows={6}
              value={pastedLogs}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData('text') || '';
                if (pasted.length > 50000) {
                  e.preventDefault();
                  setPastedLogs(pasted.slice(0, 50000) + "\n... [Truncated UI Preview - Large File Detected]");
                  setReplayError(null);
                  setTimeout(() => {
                    try {
                      const startMarker = "--- COMPREHENSIVE SIMULATOR REPLAY DATA ---";
                      const endMarker = "--- END OF SIMULATOR REPLAY DATA ---";
                      let searchSource = pasted;
                      const startIdx = pasted.indexOf(startMarker);
                      if (startIdx !== -1) {
                        const afterStart = pasted.substring(startIdx + startMarker.length);
                        const endIdx = afterStart.indexOf(endMarker);
                        searchSource = endIdx !== -1 ? afterStart.substring(0, endIdx) : afterStart;
                      }
                      const firstBrace = searchSource.indexOf('{');
                      const lastBrace = searchSource.lastIndexOf('}');
                      let jsonText = "";
                      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        jsonText = searchSource.substring(firstBrace, lastBrace + 1).trim();
                      } else if (firstBrace !== -1) {
                        jsonText = searchSource.substring(firstBrace).trim();
                      } else {
                        jsonText = searchSource.trim();
                      }
                      if (!jsonText) throw new Error("Could not find structured simulation JSON payload in pasted content.");
                      const parsed = JSON.parse(jsonText);
                      if (!parsed.snapshots || !Array.isArray(parsed.snapshots)) throw new Error("Parsed data does not contain turn-by-turn snapshots.");
                      setReplayPayload(parsed);
                      setCurrentReplayIdx(0);
                      setReplayError(null);
                    } catch (err: any) {
                      setReplayError(err.message || String(err));
                    }
                  }, 10);
                }
              }}
              onChange={(e) => {
                setPastedLogs(e.target.value);
                setReplayError(null);
              }}
              placeholder="Paste text of the downloaded .txt logs file here..."
              className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 placeholder-slate-600 resize-none"
            />
          </div>

          <button
            onClick={() => {
              try {
                if (!pastedLogs.trim()) {
                  throw new Error("Pasted content is empty.");
                }
                
                const startMarker = "--- COMPREHENSIVE SIMULATOR REPLAY DATA ---";
                const endMarker = "--- END OF SIMULATOR REPLAY DATA ---";
                
                let searchSource = pastedLogs;
                const startIdx = pastedLogs.indexOf(startMarker);
                if (startIdx !== -1) {
                  const afterStart = pastedLogs.substring(startIdx + startMarker.length);
                  const endIdx = afterStart.indexOf(endMarker);
                  searchSource = endIdx !== -1 ? afterStart.substring(0, endIdx) : afterStart;
                }
                
                const firstBrace = searchSource.indexOf('{');
                const lastBrace = searchSource.lastIndexOf('}');
                let jsonText = "";
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  jsonText = searchSource.substring(firstBrace, lastBrace + 1).trim();
                } else if (firstBrace !== -1) {
                  jsonText = searchSource.substring(firstBrace).trim();
                } else {
                  jsonText = searchSource.trim();
                }
                
                if (!jsonText) {
                  throw new Error("Could not find the structured simulation JSON payload in the pasted content.");
                }
                
                const parsed = JSON.parse(jsonText);
                if (!parsed.snapshots || !Array.isArray(parsed.snapshots)) {
                  throw new Error("The parsed data does not contain any turn-by-turn snapshots.");
                }

                setReplayPayload(parsed);
                setCurrentReplayIdx(0);
                setReplayError(null);
              } catch (err: any) {
                setReplayError(err.message || String(err));
              }
            }}
            className="w-full py-2.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>LOAD PLAYTHROUGH JOURNAL</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Journal summary card */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-slate-500">World Seed:</span>{' '}
              <span className="text-amber-400 font-bold">{replayPayload.seed}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Turns Recorded:</span>{' '}
              <span className="text-emerald-400 font-bold">{replayPayload.snapshots?.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Final Level:</span>{' '}
              <span className="text-indigo-400 font-bold">Lvl {replayPayload.finalStats?.level}</span>
            </div>
            <div>
              <span className="text-slate-500">Dungeon Depth:</span>{' '}
              <span className="text-sky-400 font-bold">{replayPayload.finalStats?.depth} Floors</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Final Weaponry:</span>{' '}
              <span className="text-rose-400 font-semibold">{replayPayload.finalWeapon}</span>
            </div>
          </div>

          {/* Replay Deck Controls */}
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-slate-300 font-bold">
              <span>Timeline Navigator</span>
              <span className="text-emerald-400">
                Turn {currentReplayIdx + 1} / {replayPayload.snapshots?.length}
              </span>
            </div>

            {/* Scrubbing slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={replayPayload.snapshots.length - 1}
                value={currentReplayIdx}
                onChange={(e) => {
                  setCurrentReplayIdx(parseInt(e.target.value));
                  setReplayIsPlaying(false);
                }}
                className="w-full accent-emerald-500 cursor-ew-resize"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>START (TURN 0)</span>
                <span>TURN {replayPayload.snapshots[currentReplayIdx]?.turn} ({replayPayload.snapshots[currentReplayIdx]?.gameTimeStr})</span>
                <span>END (TURN {replayPayload.snapshots[replayPayload.snapshots.length - 1]?.turn})</span>
              </div>
            </div>

            {/* Play controls and speed slider */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
              <div className="flex gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setCurrentReplayIdx(Math.max(0, currentReplayIdx - 1));
                    setReplayIsPlaying(false);
                  }}
                  disabled={currentReplayIdx === 0}
                  className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ◀ Step Back
                </button>
                <button
                  onClick={() => setReplayIsPlaying(!replayIsPlaying)}
                  className={`flex-1 sm:flex-none py-1.5 px-3 font-bold text-xs rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    replayIsPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {replayIsPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                </button>
                <button
                  onClick={() => {
                    setReplayIsPlaying(true);
                    setIsMinimized(true);
                  }}
                  className="flex-1 sm:flex-none py-1.5 px-3 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-600/80 text-emerald-300 font-bold text-xs rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                  title="Start playback and minimize panel to watch gameplay live on canvas"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>PLAY & MINIMIZE</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentReplayIdx(Math.min(replayPayload.snapshots.length - 1, currentReplayIdx + 1));
                    setReplayIsPlaying(false);
                  }}
                  disabled={currentReplayIdx === replayPayload.snapshots.length - 1}
                  className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Step Next ▶
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-[10px] font-mono">
                <span className="text-slate-500 whitespace-nowrap">TICK DELAY:</span>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(parseInt(e.target.value))}
                  className="w-24 accent-amber-500 cursor-ew-resize"
                />
                <span className="text-amber-400 font-bold w-12 text-right">{replaySpeed}ms</span>
              </div>
            </div>

            {/* Reset button to clear simulation data */}
            <button
              onClick={() => {
                setReplayPayload(null);
                setPastedLogs('');
                setReplayIsPlaying(false);
              }}
              className="w-full py-1.5 bg-red-950/30 hover:bg-red-900/30 border border-red-900 text-red-400 rounded text-[10px] font-bold transition-all"
            >
              CLEAR ACTIVE REPLAY SIMULATOR
            </button>
          </div>

          {/* Log View at Active Turn */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Chronology Event Feed (Replay Sync)
            </span>
            <div className="w-full h-40 bg-black/95 border border-slate-800 rounded-lg p-3 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1 leading-relaxed">
              {replayPayload.snapshots[currentReplayIdx]?.state?.logs?.slice(-20).map((l: any, idx: number) => {
                let color = "text-emerald-400";
                if (l.text.includes("❌") || l.type === 'danger') color = "text-red-400 font-bold";
                else if (l.text.includes("🎉") || l.type === 'loot') color = "text-amber-400 font-bold";
                else if (l.type === 'combat') color = "text-red-300";
                else if (l.type === 'craft') color = "text-teal-400";
                return (
                  <div key={idx} className={`${color} break-all whitespace-pre-wrap`}>
                    [{l.timestamp}] {l.text}
                  </div>
                );
              }) || (
                <div className="text-slate-600 italic">No events recorded for this turn.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
