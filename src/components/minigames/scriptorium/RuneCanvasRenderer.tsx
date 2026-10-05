/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlyphDefinition } from '../../../types/minigames/glyphGame';
import { ElementTheme, NodePosition } from './types';

export interface RuneCanvasRendererProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  elementTheme: ElementTheme;
  nodePositions: NodePosition[];
  connectedNodes: number[];
  currentGlyph: GlyphDefinition;
  isDragging: boolean;
  currentPointer: { x: number; y: number } | null;
  tempoCombo: number;
  tempoFeedback: { text: string; color: string } | null;
  nextExpectedNodeId: number | null;
  handleNodeHit: (nodeId: number) => void;
  handlePointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerUp: () => void;
}

export const RuneCanvasRenderer: React.FC<RuneCanvasRendererProps> = ({
  svgRef,
  elementTheme,
  nodePositions,
  connectedNodes,
  currentGlyph,
  isDragging,
  currentPointer,
  tempoCombo,
  tempoFeedback,
  nextExpectedNodeId,
  handleNodeHit,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
}) => {
  return (
    <div className="relative p-6 flex flex-col items-center justify-center bg-radial from-slate-900 to-slate-950">
      {/* Background Runic Circles and Grids */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div
          className={`w-80 h-80 rounded-full border-2 border-dashed ${elementTheme.border} animate-spin duration-[50s]`}
        />
        <div className={`absolute w-64 h-64 rounded-full border ${elementTheme.border}`} />
        <div className="absolute w-96 h-96 rounded-full border border-slate-700/40" />
      </div>

      {/* Real-time Rhythm / Cadence HUD Indicator */}
      {tempoFeedback && (
        <div
          className={`absolute top-8 z-10 px-3 py-1 bg-slate-950/90 border border-slate-700 rounded-full text-xs font-mono font-bold shadow-lg animate-bounce ${tempoFeedback.color}`}
        >
          {tempoFeedback.text}
        </div>
      )}

      {/* SVG Vector Drawing Slate */}
      <div className="relative w-full max-w-[420px] aspect-square bg-slate-950/80 border-2 border-slate-800 rounded-2xl shadow-inner overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hyperGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint Guide Silhouette of the target glyph */}
          {currentGlyph.targetSequence.map((nodeId, idx) => {
            if (idx === currentGlyph.targetSequence.length - 1) return null;
            const fromNode = nodePositions.find((n) => n.id === nodeId);
            const toNode = nodePositions.find((n) => n.id === currentGlyph.targetSequence[idx + 1]);
            if (!fromNode || !toNode) return null;
            return (
              <line
                key={`guide_${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={elementTheme.faintStroke}
                strokeWidth="1.2"
                strokeDasharray="2,2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Active Player-Traced Conduits */}
          {connectedNodes.map((nodeId, idx) => {
            if (idx === connectedNodes.length - 1) return null;
            const fromNode = nodePositions.find((n) => n.id === nodeId);
            const toNode = nodePositions.find((n) => n.id === connectedNodes[idx + 1]);
            if (!fromNode || !toNode) return null;
            return (
              <line
                key={`traced_${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={elementTheme.stroke}
                strokeWidth={tempoCombo > 2 ? '3.2' : '2.5'}
                strokeLinecap="round"
                filter="url(#glow)"
              />
            );
          })}

          {/* Trailing Pointer Line while Dragging */}
          {isDragging &&
            currentPointer &&
            connectedNodes.length > 0 &&
            (() => {
              const lastConnected = nodePositions.find(
                (n) => n.id === connectedNodes[connectedNodes.length - 1]
              );
              if (!lastConnected) return null;
              return (
                <line
                  x1={lastConnected.x}
                  y1={lastConnected.y}
                  x2={currentPointer.x}
                  y2={currentPointer.y}
                  stroke={elementTheme.stroke}
                  strokeWidth="1.8"
                  strokeDasharray="3,2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })()}

          {/* Dynamic Animated Glyph Nodes */}
          {nodePositions.map((node) => {
            const isConnected = connectedNodes.includes(node.id);
            const isNextExpected = node.id === nextExpectedNodeId;

            return (
              <g
                key={node.id}
                onClick={() => handleNodeHit(node.id)}
                className="cursor-pointer transition-transform duration-150 active:scale-125"
              >
                {/* Pulsing ring for next expected node */}
                {isNextExpected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="6.5"
                    fill="none"
                    stroke={elementTheme.stroke}
                    strokeWidth="1.2"
                    className="animate-ping opacity-70"
                  />
                )}

                {/* Outer node background */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4.5"
                  fill={isConnected ? elementTheme.activeNodeBg : '#0f172a'}
                  stroke={isNextExpected ? elementTheme.stroke : isConnected ? elementTheme.stroke : '#475569'}
                  strokeWidth={isNextExpected ? '2' : '1.5'}
                  filter={isConnected ? 'url(#glow)' : undefined}
                />

                {/* Node Number */}
                <text
                  x={node.x}
                  y={node.y + 1.2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isConnected ? '#020617' : '#94a3b8'}
                  fontSize="3.2"
                  fontWeight="bold"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Scribing Guide / Target Sequence */}
      <div className="mt-4 flex items-center justify-between w-full max-w-[420px] text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Target Sequence: {currentGlyph.targetSequence.join(' → ')}</span>
        </span>
      </div>
    </div>
  );
};
