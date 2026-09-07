/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  Award,
  RefreshCw,
  Zap,
  Shield,
  Flame,
  Droplets,
  Moon,
  Sun,
  CheckCircle,
  RotateCcw,
  Volume2,
  Wind,
  Activity,
  Compass,
  Radio,
  Timer
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { GLYPH_MATRICES, getGlyphForSpellElement } from '../data/glyphs';
import {
  GlyphDefinition,
  GlyphElement,
  GlyphScribingResult,
  GlyphQualityOutcome,
  GlyphNode,
} from '../types/minigames/glyphGame';
import { SPELL_SCROLLS, SpellScrollTemplate } from '../utils/spellScrolls';

export interface ScriptoriumMiniGameProps {
  onClose: () => void;
  onSuccess: (result: GlyphScribingResult) => void;
  onFail?: () => void;
  targetScrollTemplateId?: string;
  isSandboxMode?: boolean;
  parchmentCount?: number;
  inkCount?: number;
}

interface NodePosition {
  id: number;
  x: number;
  y: number;
}

interface DynamicSurgeEvent {
  id: string;
  name: string;
  description: string;
  type: 'flame_wave' | 'cryo_lock' | 'static_discharge' | 'void_collapse' | 'mana_whirl' | 'holy_judgment';
  color: string;
  icon: any;
  durationMs: number;
}

export const ScriptoriumMiniGame: React.FC<ScriptoriumMiniGameProps> = ({
  onClose,
  onSuccess,
  onFail,
  targetScrollTemplateId,
  isSandboxMode = false,
  parchmentCount = 5,
  inkCount = 5,
}) => {
  // Find matching scroll template or fallback
  const scrollTemplate: SpellScrollTemplate | undefined = useMemo(() => {
    if (!targetScrollTemplateId) return SPELL_SCROLLS[0];
    return (
      SPELL_SCROLLS.find((s) => s.id === targetScrollTemplateId || s.id.includes(targetScrollTemplateId)) ||
      SPELL_SCROLLS[0]
    );
  }, [targetScrollTemplateId]);

  // Selected glyph(s)
  const initialGlyph: GlyphDefinition = useMemo(() => {
    if (scrollTemplate) {
      return getGlyphForSpellElement(scrollTemplate.element || 'Fire', (scrollTemplate as any).spellLevel || 1);
    }
    return GLYPH_MATRICES[0];
  }, [scrollTemplate]);

  const [currentGlyph, setCurrentGlyph] = useState<GlyphDefinition>(initialGlyph);
  const [difficulty, setDifficulty] = useState<'novice' | 'adept' | 'archmage'>('adept');

  // Multi-stage progression
  const [currentStage, setCurrentStage] = useState<number>(1);
  const totalStages = difficulty === 'archmage' ? 3 : difficulty === 'adept' ? 2 : 1;

  // Tracing State
  const [connectedNodes, setConnectedNodes] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
  const [instability, setInstability] = useState<number>(0);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [lastNodeHitTime, setLastNodeHitTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);

  // Advanced Arcane Mechanics
  const [harmonicChains, setHarmonicChains] = useState<number>(0);
  const [surgesSurmounted, setSurgesSurmounted] = useState<number>(0);
  const [activeSurge, setActiveSurge] = useState<DynamicSurgeEvent | null>(null);
  const [surgeFlash, setSurgeFlash] = useState<boolean>(false);
  const [tempoCombo, setTempoCombo] = useState<number>(0);
  const [tempoFeedback, setTempoFeedback] = useState<{ text: string; color: string } | null>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [driftOffsetTime, setDriftOffsetTime] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize node positions
  useEffect(() => {
    setNodePositions(
      currentGlyph.nodes.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
      }))
    );
  }, [currentGlyph]);

  // Styling theme per element
  const elementTheme = useMemo(() => {
    switch (currentGlyph.element) {
      case 'Fire':
        return {
          color: 'text-amber-500',
          bgGlow: 'from-amber-500/20 to-orange-600/10',
          border: 'border-amber-500/40',
          stroke: '#f59e0b',
          faintStroke: '#78350f',
          icon: Flame,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          activeNodeBg: '#f59e0b',
          surgeColor: '#ef4444',
        };
      case 'Frost':
        return {
          color: 'text-sky-400',
          bgGlow: 'from-sky-500/20 to-cyan-600/10',
          border: 'border-sky-500/40',
          stroke: '#38bdf8',
          faintStroke: '#0c4a6e',
          icon: Droplets,
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          activeNodeBg: '#38bdf8',
          surgeColor: '#0284c7',
        };
      case 'Lightning':
        return {
          color: 'text-yellow-300',
          bgGlow: 'from-yellow-500/20 to-amber-600/10',
          border: 'border-yellow-500/40',
          stroke: '#facc15',
          faintStroke: '#713f12',
          icon: Zap,
          badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          activeNodeBg: '#facc15',
          surgeColor: '#eab308',
        };
      case 'Void':
        return {
          color: 'text-purple-400',
          bgGlow: 'from-purple-900/30 to-indigo-950/20',
          border: 'border-purple-500/40',
          stroke: '#c084fc',
          faintStroke: '#3b0764',
          icon: Moon,
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          activeNodeBg: '#c084fc',
          surgeColor: '#a855f7',
        };
      case 'Holy':
        return {
          color: 'text-emerald-300',
          bgGlow: 'from-emerald-500/20 to-teal-600/10',
          border: 'border-emerald-500/40',
          stroke: '#34d399',
          faintStroke: '#064e3b',
          icon: Sun,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          activeNodeBg: '#34d399',
          surgeColor: '#10b981',
        };
      case 'Arcane':
      default:
        return {
          color: 'text-fuchsia-400',
          bgGlow: 'from-fuchsia-600/20 to-indigo-600/10',
          border: 'border-fuchsia-500/40',
          stroke: '#e879f9',
          faintStroke: '#4a044e',
          icon: Sparkles,
          badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          activeNodeBg: '#e879f9',
          surgeColor: '#d946ef',
        };
    }
  }, [currentGlyph.element]);

  // Node Drifting Physics Loop (Higher difficulty / tier causes organic orbital/sine drift)
  useEffect(() => {
    if (isCompleted || isFailed) return;

    let isRunning = true;
    const updateDrift = () => {
      if (!isRunning) return;
      const now = Date.now();
      const t = now * 0.002;
      setDriftOffsetTime(t);

      // In Adept and Archmage, nodes slowly orbit or oscillate around their base anchors
      const isAdeptOrArchmage = difficulty === 'adept' || difficulty === 'archmage';
      const driftMagnitude = difficulty === 'archmage' ? 3.2 : isAdeptOrArchmage ? 1.8 : 0.6;

      setNodePositions(
        currentGlyph.nodes.map((n, idx) => {
          const phase = idx * 1.35;
          const dx = Math.sin(t + phase) * driftMagnitude;
          const dy = Math.cos(t * 0.8 + phase) * driftMagnitude;
          return {
            id: n.id,
            x: Math.max(8, Math.min(92, n.x + dx)),
            y: Math.max(8, Math.min(92, n.y + dy)),
          };
        })
      );

      animFrameRef.current = requestAnimationFrame(updateDrift);
    };

    animFrameRef.current = requestAnimationFrame(updateDrift);
    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentGlyph, difficulty, isCompleted, isFailed]);

  // Periodic Arcane Instability Surges & Natural Decay
  useEffect(() => {
    if (isCompleted || isFailed) return;

    // Base instability accumulation rate
    const baseRate = difficulty === 'archmage' ? 2.8 : difficulty === 'adept' ? 1.7 : 0.9;
    const interval = setInterval(() => {
      setInstability((prev) => {
        const next = prev + baseRate;
        if (next >= 100) {
          setIsFailed(true);
          playSound('deny');
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 600);
          return 100;
        }

        // Trigger dynamic surge event at ~50% and ~75% instability
        if (next >= 50 && prev < 50 && !activeSurge) {
          triggerSurgeEvent('moderate');
        } else if (next >= 75 && prev < 75 && (!activeSurge || activeSurge.type !== 'void_collapse')) {
          triggerSurgeEvent('severe');
        }

        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isCompleted, isFailed, difficulty, activeSurge]);

  // Surge Trigger Dispatcher
  const triggerSurgeEvent = useCallback(
    (severity: 'moderate' | 'severe') => {
      let surge: DynamicSurgeEvent;
      switch (currentGlyph.element) {
        case 'Fire':
          surge = {
            id: `surge_${Date.now()}`,
            name: 'Solar Flare Overdrive',
            description: 'Intense thermals increase instability gain by +100%!',
            type: 'flame_wave',
            color: 'text-amber-400 border-amber-500 bg-amber-950/60',
            icon: Flame,
            durationMs: 4000,
          };
          break;
        case 'Frost':
          surge = {
            id: `surge_${Date.now()}`,
            name: 'Cryo-Lock Frostbite',
            description: 'Parchment crystalizes! Next 2 node hit windows are strictly tightened!',
            type: 'cryo_lock',
            color: 'text-sky-300 border-sky-500 bg-sky-950/60',
            icon: Droplets,
            durationMs: 4500,
          };
          break;
        case 'Lightning':
          surge = {
            id: `surge_${Date.now()}`,
            name: 'Static Overcharge',
            description: 'Arcane sparks deflect the conduit line!',
            type: 'static_discharge',
            color: 'text-yellow-300 border-yellow-500 bg-yellow-950/60',
            icon: Zap,
            durationMs: 3500,
          };
          break;
        case 'Void':
          surge = {
            id: `surge_${Date.now()}`,
            name: 'Gravitational Collapse',
            description: 'The void singularity pulls active nodes toward the center!',
            type: 'void_collapse',
            color: 'text-purple-300 border-purple-500 bg-purple-950/60',
            icon: Moon,
            durationMs: 4000,
          };
          break;
        case 'Holy':
          surge = {
            id: `surge_${Date.now()}`,
            name: 'Luminous Trial',
            description: 'Radiance illuminates false phantom nodes!',
            type: 'holy_judgment',
            color: 'text-emerald-300 border-emerald-500 bg-emerald-950/60',
            icon: Sun,
            durationMs: 4000,
          };
          break;
        case 'Arcane':
        default:
          surge = {
            id: `surge_${Date.now()}`,
            name: 'Mana Whirl Resonance',
            description: 'Leyline vortex shifts node polarity!',
            type: 'mana_whirl',
            color: 'text-fuchsia-300 border-fuchsia-500 bg-fuchsia-950/60',
            icon: Sparkles,
            durationMs: 4000,
          };
          break;
      }

      setActiveSurge(surge);
      setSurgeFlash(true);
      setShakeScreen(true);
      playSound('spell', { volume: 0.7, pitch: 0.6 });
      setTimeout(() => setSurgeFlash(false), 400);
      setTimeout(() => setShakeScreen(false), 300);

      // Auto clear surge after duration
      setTimeout(() => {
        setActiveSurge((curr) => {
          if (curr && curr.id === surge.id) {
            setSurgesSurmounted((prev) => prev + 1);
            return null;
          }
          return curr;
        });
      }, surge.durationMs);
    },
    [currentGlyph.element]
  );

  // Reset glyph tracing state
  const resetTracingState = useCallback(() => {
    setConnectedNodes([]);
    setCurrentPointer(null);
    setInstability(0);
    setMistakeCount(0);
    setStartTime(Date.now());
    setLastNodeHitTime(Date.now());
    setTempoCombo(0);
    setTempoFeedback(null);
    setActiveSurge(null);
    setHarmonicChains(0);
    setSurgesSurmounted(0);
    setIsCompleted(false);
    setIsFailed(false);
  }, []);

  // Handle node tap or drag hit with rhythm & tempo precision
  const handleNodeHit = useCallback(
    (nodeId: number) => {
      if (isCompleted || isFailed) return;

      const nextIndex = connectedNodes.length;
      const expectedNodeId = currentGlyph.targetSequence[nextIndex];
      const now = Date.now();
      const deltaMs = now - lastNodeHitTime;

      if (nodeId === expectedNodeId) {
        // Evaluate Tempo / Cadence Bonus (between 300ms and 1400ms is ideal rhythmic flow)
        let isHarmonicPace = false;
        if (nextIndex > 0) {
          if (deltaMs >= 250 && deltaMs <= 1100) {
            isHarmonicPace = true;
            setTempoCombo((prev) => prev + 1);
            setHarmonicChains((prev) => prev + 1);
            setTempoFeedback({ text: '✦ HARMONIC RHYTHM! ✦', color: 'text-amber-300' });
            // Stabilize minor heat on rhythm
            setInstability((prev) => Math.max(0, prev - 6));
          } else if (deltaMs < 250) {
            setTempoFeedback({ text: '⚡ RUSHED STROKE', color: 'text-sky-300' });
          } else {
            setTempoFeedback({ text: '⏱ HESITATION', color: 'text-slate-400' });
            setTempoCombo(0);
          }
          setTimeout(() => setTempoFeedback(null), 700);
        }

        setLastNodeHitTime(now);

        // Sound progression
        playSound('spell', {
          volume: 0.6,
          pitch: 0.9 + nextIndex * 0.12 + (isHarmonicPace ? 0.15 : 0),
        });

        const nextSequence = [...connectedNodes, nodeId];
        setConnectedNodes(nextSequence);

        // Check if current glyph sequence is finished
        if (nextSequence.length === currentGlyph.targetSequence.length) {
          playSound('critical_hit', { volume: 0.85 });

          if (currentStage < totalStages) {
            // Advance to next stage glyph
            const nextTier = Math.min(3, currentStage + 1) as 1 | 2 | 3;
            const nextGlyphOptions = GLYPH_MATRICES.filter(
              (g) => g.element === currentGlyph.element && g.tier === nextTier
            );
            const nextGlyph =
              nextGlyphOptions.length > 0
                ? nextGlyphOptions[Math.floor(Math.random() * nextGlyphOptions.length)]
                : GLYPH_MATRICES[Math.floor(Math.random() * GLYPH_MATRICES.length)];

            setCurrentStage((prev) => prev + 1);
            setCurrentGlyph(nextGlyph);
            setConnectedNodes([]);
            setCurrentPointer(null);
            setInstability((prev) => Math.max(0, prev - 15)); // Stage clear relief
            playSound('teleport', { volume: 0.7 });
          } else {
            setIsCompleted(true);
            playSound('levelUp', { volume: 0.95 });
          }
        }
      } else {
        // Mistake penalty with escalating severity
        playSound('bump', { volume: 0.7 });
        setMistakeCount((prev) => prev + 1);
        setTempoCombo(0);
        setTempoFeedback({ text: '💥 RUNIC DEVIATION!', color: 'text-rose-400' });
        setTimeout(() => setTempoFeedback(null), 800);

        const mistakePenalty = difficulty === 'archmage' ? 22 : difficulty === 'adept' ? 16 : 10;
        setInstability((prev) => Math.min(100, prev + mistakePenalty));
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 350);
      }
    },
    [
      connectedNodes,
      currentGlyph,
      currentStage,
      totalStages,
      isCompleted,
      isFailed,
      lastNodeHitTime,
      difficulty,
    ]
  );

  // SVG coordinate transformation
  const getSvgCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x, y };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isCompleted || isFailed) return;
    setIsDragging(true);
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (coords) setCurrentPointer(coords);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || isCompleted || isFailed) return;
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;
    setCurrentPointer(coords);

    // Check proximity to expected node using dynamic animated positions
    const nextIndex = connectedNodes.length;
    if (nextIndex < currentGlyph.targetSequence.length) {
      const expectedId = currentGlyph.targetSequence[nextIndex];
      const targetPos = nodePositions.find((n) => n.id === expectedId);
      if (targetPos) {
        const hitThreshold = difficulty === 'archmage' ? 6.5 : 8.5;
        const dist = Math.hypot(coords.x - targetPos.x, coords.y - targetPos.y);
        if (dist <= hitThreshold) {
          handleNodeHit(expectedId);
        }
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setCurrentPointer(null);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key >= '0' && e.key <= '9') {
        const keyNum = parseInt(e.key, 10);
        if (currentGlyph.nodes.some((n) => n.id === keyNum)) {
          handleNodeHit(keyNum);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        resetTracingState();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGlyph, handleNodeHit, resetTracingState, onClose]);

  // Compute final scoring & rigorous Masterwork qualification
  const scribingResult: GlyphScribingResult = useMemo(() => {
    const timeTaken = Math.max(100, Date.now() - startTime);
    const penaltyPerMistake = difficulty === 'archmage' ? 15 : 10;
    const penaltyPerInstability = difficulty === 'archmage' ? 0.4 : 0.25;

    let rawScore = 100 - mistakeCount * penaltyPerMistake - instability * penaltyPerInstability;
    rawScore = Math.max(5, Math.min(100, Math.round(rawScore)));

    // Strict Masterwork Criteria:
    // Requires >=90% score, 0 mistakes, under 35% instability, and at least 2 harmonic tempo chains
    let outcome: GlyphQualityOutcome = 'stable';
    if (rawScore >= 90 && instability < 38 && mistakeCount === 0) {
      outcome = 'flawless';
    } else if (rawScore < 60 || isFailed) {
      outcome = 'mishap';
    }

    const isMasterwork = outcome === 'flawless';
    const bonusPowerPct = isMasterwork ? 30 : outcome === 'stable' ? 10 : 0;
    const manaDiscountPct = isMasterwork ? 100 : outcome === 'stable' ? 20 : 0;

    return {
      glyphId: currentGlyph.id,
      glyphName: currentGlyph.name,
      element: currentGlyph.element,
      accuracyScore: rawScore,
      instabilityReached: Math.round(instability),
      timeTakenMs: timeTaken,
      outcome,
      isMasterwork,
      bonusPowerPct,
      manaDiscountPct,
      harmonicChainsAchieved: harmonicChains,
      surgesSurmounted,
    };
  }, [startTime, mistakeCount, instability, isFailed, currentGlyph, difficulty, harmonicChains, surgesSurmounted]);

  // Next expected node
  const nextExpectedNodeId =
    connectedNodes.length < currentGlyph.targetSequence.length
      ? currentGlyph.targetSequence[connectedNodes.length]
      : null;

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
        <div className={`p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between`}>
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
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Reset Stroke (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
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
                  className={`px-2 py-0.5 rounded capitalize text-[10px] font-bold border transition-all ${
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

            {/* Quick Sandbox Glyph Switcher */}
            {isSandboxMode && (
              <select
                value={currentGlyph.id}
                onChange={(e) => {
                  const found = GLYPH_MATRICES.find((g) => g.id === e.target.value);
                  if (found) {
                    setCurrentGlyph(found);
                    resetTracingState();
                  }
                }}
                className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded text-[10px] font-mono"
              >
                {GLYPH_MATRICES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.element} - {g.name} (T{g.tier})
                  </option>
                ))}
              </select>
            )}
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

        {/* Main Interactive Arcane Slate Canvas */}
        <div className="relative p-6 flex flex-col items-center justify-center bg-radial from-slate-900 to-slate-950">
          {/* Background Runic Circles and Grids */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div
              className={`w-80 h-80 rounded-full border-2 border-dashed ${elementTheme.border} animate-spin duration-[50s]`}
            />
            <div className={`absolute w-64 h-64 rounded-full border ${elementTheme.border}`} />
            <div className={`absolute w-96 h-96 rounded-full border border-slate-700/40`} />
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

                    {/* Node Number or Glyph Core Dot */}
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
            <span className="text-slate-500">
              {difficulty === 'archmage' ? '⚡ Moving Nodes • High Heat' : 'Drag or Press 0-9'}
            </span>
          </div>
        </div>

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
            {/* Surge Threshold Marker */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/50" title="Surge Threshold" />
            <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-rose-600" title="Critical Overload" />
          </div>
        </div>

        {/* Success Modal Overlay */}
        {isCompleted && (
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
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-xs flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Claim & Inscribe Scroll</span>
              </button>
              <button
                onClick={resetTracingState}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Inscribe Again
              </button>
            </div>
          </div>
        )}

        {/* Failure / Mishap Modal Overlay */}
        {isFailed && (
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
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-xs flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Inscription</span>
              </button>
              <button
                onClick={() => {
                  if (onFail) onFail();
                  onClose();
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Close Scriptorium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptoriumMiniGame;
