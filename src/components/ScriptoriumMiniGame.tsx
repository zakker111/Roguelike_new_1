/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import {
  ScriptoriumMiniGameProps,
  useScriptoriumLogic,
  RuneCanvasRenderer,
  ScriptoriumScoreCard,
} from './minigames/scriptorium';
import { GLYPH_MATRICES } from '../data/glyphs';

export { type ScriptoriumMiniGameProps };

export const ScriptoriumMiniGame: React.FC<ScriptoriumMiniGameProps> = ({
  onClose,
  onSuccess,
  onFail,
  targetScrollTemplateId,
  isSandboxMode = false,
}) => {
  const {
    scrollTemplate,
    currentGlyph,
    difficulty,
    setDifficulty,
    currentStage,
    totalStages,
    connectedNodes,
    currentPointer,
    instability,
    mistakeCount,
    startTime,
    isCompleted,
    isFailed,
    isDragging,
    shakeScreen,
    harmonicChains,
    activeSurge,
    surgeFlash,
    tempoCombo,
    tempoFeedback,
    nodePositions,
    elementTheme,
    nextExpectedNodeId,
    scribingResult,
    handleNodeHit,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetTracingState,
    svgRef,
  } = useScriptoriumLogic({
    targetScrollTemplateId,
    onClose,
  });

  return (
    <div
      id="scriptorium-minigame-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div
        className={`relative w-full max-w-2xl bg-slate-900 border ${elementTheme.border} rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-transform duration-100 ${
          shakeScreen ? 'translate-x-1.5 translate-y-1.5 rotate-1' : ''
        } ${surgeFlash ? 'ring-4 ring-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.5)]' : ''}`}
      >
        {/* Header bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${elementTheme.badgeBg} shrink-0 relative`}>
              <elementTheme.icon className="w-6 h-6" />
              {activeSurge && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                  {scrollTemplate ? scrollTemplate.name : 'Arcane Scriptorium'}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${elementTheme.badgeBg}`}>
                  {currentGlyph.element} • Tier {currentGlyph.tier}
                </span>
                {isSandboxMode && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[10px] font-mono font-bold">
                    SANDBOX
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {currentGlyph.name}: "{currentGlyph.flavorQuote}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetTracingState}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              title="Reset Stroke (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Stage & Difficulty Selector in Sandbox */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">Scribing Stage:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalStages }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border transition-colors ${
                    idx + 1 === currentStage
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : idx + 1 < currentStage
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <span>Difficulty:</span>
              {(['novice', 'adept', 'archmage'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setDifficulty(diff);
                    resetTracingState();
                  }}
                  className={`px-2 py-0.5 rounded capitalize text-[10px] font-bold border transition-all cursor-pointer ${
                    difficulty === diff
                      ? diff === 'archmage'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Arcane Surge Alert Banner */}
        {activeSurge && (
          <div
            className={`px-4 py-2 border-b text-xs flex items-center justify-between animate-pulse ${activeSurge.color}`}
          >
            <div className="flex items-center gap-2">
              <activeSurge.icon className="w-4 h-4 shrink-0" />
              <span className="font-bold uppercase tracking-wider">{activeSurge.name}:</span>
              <span>{activeSurge.description}</span>
            </div>
            <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-black/40">SURGE HAZARD</span>
          </div>
        )}

        {/* Interactive SVG Canvas Slate */}
        <RuneCanvasRenderer
          svgRef={svgRef}
          elementTheme={elementTheme}
          nodePositions={nodePositions}
          connectedNodes={connectedNodes}
          currentGlyph={currentGlyph}
          isDragging={isDragging}
          currentPointer={currentPointer}
          tempoCombo={tempoCombo}
          tempoFeedback={tempoFeedback}
          nextExpectedNodeId={nextExpectedNodeId}
          handleNodeHit={handleNodeHit}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
        />

        {/* Instability, Rhythm & Resonance HUD */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Arcane Instability:</span>
              <span
                className={`font-bold ${
                  instability > 70
                    ? 'text-rose-400 animate-bounce'
                    : instability > 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {Math.round(instability)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Harmonic Pace: <strong className="text-amber-300">{harmonicChains}x</strong>
              </span>
              <span className="text-slate-400">
                Mistakes: <strong className="text-rose-400">{mistakeCount}</strong>
              </span>
              <span className="text-slate-400">
                Speed: <strong className="text-sky-400">{((Date.now() - startTime) / 1000).toFixed(1)}s</strong>
              </span>
            </div>
          </div>

          {/* Instability Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 relative">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                instability > 75
                  ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : instability > 45
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, instability)}%` }}
            />
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/50" title="Surge Threshold" />
            <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-rose-600" title="Critical Overload" />
          </div>
        </div>

        {/* Completion / Failure Score Card Modal */}
        <ScriptoriumScoreCard
          isCompleted={isCompleted}
          isFailed={isFailed}
          scribingResult={scribingResult}
          harmonicChains={harmonicChains}
          mistakeCount={mistakeCount}
          onSuccess={onSuccess}
          onFail={onFail}
          onClose={onClose}
          resetTracingState={resetTracingState}
        />
      </div>
    </div>
  );
};

export default ScriptoriumMiniGame;
