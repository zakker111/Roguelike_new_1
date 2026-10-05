/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  Droplets,
  Moon,
  Sun,
} from 'lucide-react';
import { playSound } from '../../../utils/audio';
import { GLYPH_MATRICES, getGlyphForSpellElement } from '../../../data/glyphs';
import {
  GlyphDefinition,
  GlyphScribingResult,
  GlyphQualityOutcome,
} from '../../../types/minigames/glyphGame';
import { SPELL_SCROLLS, SpellScrollTemplate } from '../../../utils/spellScrolls';
import { NodePosition, DynamicSurgeEvent, ElementTheme } from './types';

export function useScriptoriumLogic({
  targetScrollTemplateId,
  onClose,
}: {
  targetScrollTemplateId?: string;
  onClose: () => void;
}) {
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
  const [, setDriftOffsetTime] = useState<number>(0);

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
  const elementTheme: ElementTheme = useMemo(() => {
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

  // Surge Trigger Dispatcher
  const triggerSurgeEvent = useCallback(
    () => {
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

  // Periodic Arcane Instability Surges & Natural Decay
  useEffect(() => {
    if (isCompleted || isFailed) return;

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

        if (next >= 50 && prev < 50 && !activeSurge) {
          triggerSurgeEvent();
        } else if (next >= 75 && prev < 75 && (!activeSurge || activeSurge.type !== 'void_collapse')) {
          triggerSurgeEvent();
        }

        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isCompleted, isFailed, difficulty, activeSurge, triggerSurgeEvent]);

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
        let isHarmonicPace = false;
        if (nextIndex > 0) {
          if (deltaMs >= 250 && deltaMs <= 1100) {
            isHarmonicPace = true;
            setTempoCombo((prev) => prev + 1);
            setHarmonicChains((prev) => prev + 1);
            setTempoFeedback({ text: '✦ HARMONIC RHYTHM! ✦', color: 'text-amber-300' });
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

        playSound('spell', {
          volume: 0.6,
          pitch: 0.9 + nextIndex * 0.12 + (isHarmonicPace ? 0.15 : 0),
        });

        const nextSequence = [...connectedNodes, nodeId];
        setConnectedNodes(nextSequence);

        if (nextSequence.length === currentGlyph.targetSequence.length) {
          playSound('critical_hit', { volume: 0.85 });

          if (currentStage < totalStages) {
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
            setInstability((prev) => Math.max(0, prev - 15));
            playSound('teleport', { volume: 0.7 });
          } else {
            setIsCompleted(true);
            playSound('levelUp', { volume: 0.95 });
          }
        }
      } else {
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

  const nextExpectedNodeId =
    connectedNodes.length < currentGlyph.targetSequence.length
      ? currentGlyph.targetSequence[connectedNodes.length]
      : null;

  return {
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
    surgesSurmounted,
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
  };
}
