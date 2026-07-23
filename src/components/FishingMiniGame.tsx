/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Compass, ArrowRight, RotateCw, Trophy, Anchor } from 'lucide-react';
import { playSound } from '../utils/audio';

interface FishingMiniGameProps {
  onClose: () => void;
  onCatch: (itemName: string, itemId: string) => void;
  onFail?: () => void;
}

type FishingState = 'IDLE' | 'CASTING' | 'BITE' | 'REELING' | 'SUCCESS' | 'ESCAPE';

export default function FishingMiniGame({ onClose, onCatch, onFail }: FishingMiniGameProps) {
  const [gameState, setGameState] = useState<FishingState>('IDLE');
  const [biteCountdown, setBiteCountdown] = useState<number>(0);
  const [caughtFishName, setCaughtFishName] = useState<string>('Common Pond Gudgeon');
  const [caughtFishIcon, setCaughtFishIcon] = useState<string>('🐟');
  const [strikeCount, setStrikeCount] = useState<number>(0);
  const [isReeling, setIsReeling] = useState<boolean>(false);

  const sweetSpotRef = useRef<HTMLDivElement | null>(null);
  const needleRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);

  const fishTimeRef = useRef<number>(0);

  // Sweet spot bounds (e.g., dynamic range surrounding the moving fish)
  const sweetSpotSize = 24; // nice wide range

  const animationFrameIdRef = useRef<number | null>(null);
  const sliderPosRef = useRef<number>(15);
  const fishPosRef = useRef<number>(50);
  const reelProgressRef = useRef<number>(40);
  const strikeCountRef = useRef<number>(0);

  const sliderIntervalRef = useRef<number | null>(null);
  const sliderDirectionRef = useRef<'LEFT' | 'RIGHT'>('RIGHT');
  const stateRef = useRef<FishingState>('IDLE');
  const isReelingRef = useRef<boolean>(false);
  const soundThrottleRef = useRef<number>(0);

  // Keep stateRef and isReelingRef in sync to safely use inside event handlers and interval loops
  useEffect(() => {
    stateRef.current = gameState;
    if (gameState !== 'REELING') {
      setIsReeling(false);
    }
  }, [gameState]);

  useEffect(() => {
    isReelingRef.current = isReeling;
  }, [isReeling]);

  // Cleanup timers & intervals
  useEffect(() => {
    return () => {
      stopSlider();
    };
  }, []);

  // Keyboard controls handler: SPACE bar hooks/reels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return; // Prevent OS key hold repeat triggers
        
        const currentState = stateRef.current;
        if (currentState === 'REELING') {
          setIsReeling(true);
        } else {
          triggerCoreAction();
        }
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (stateRef.current === 'REELING') {
          setIsReeling(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse / Touch continuous hold helpers
  const handleReelStart = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
    }
    if (gameState === 'REELING') {
      setIsReeling(true);
    }
  };

  const handleReelStop = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
    }
    setIsReeling(false);
  };

  // Slider animation loop with drifting fish and players reel-tension physics
  const startSlider = () => {
    stopSlider();
    soundThrottleRef.current = 0;

    // Initialize refs with starting values
    sliderPosRef.current = 15;
    fishPosRef.current = 50;
    reelProgressRef.current = 40;
    strikeCountRef.current = 0;

    const tick = () => {
      if (stateRef.current !== 'REELING') {
        stopSlider();
        return;
      }

      // 1. Drift the green sweet spot (the fish target) slowly and smoothly
      fishTimeRef.current += 0.012; // slow, relaxed pace
      const currentFishPos = 50 + Math.sin(fishTimeRef.current) * 20 + Math.cos(fishTimeRef.current * 0.75) * 5;
      fishPosRef.current = currentFishPos;

      const localMin = Math.max(3, currentFishPos - 12);
      const localMax = Math.min(97, currentFishPos + 12);

      // 2. Adjust slider needle position based on player holding state
      const holding = isReelingRef.current;
      
      // Reeling pulls the cursor with comfortable speed to the right (strength: 1.5% per frame)
      // Letting go lets gravity slowly float the cursor back to the left (drift: -1.2% per frame)
      const step = holding ? 1.5 : -1.2;
      const nextSliderPos = Math.max(0, Math.min(100, sliderPosRef.current + step));
      sliderPosRef.current = nextSliderPos;

      // 3. Update reel progress based on overlap alignment
      const insideSweetSpot = nextSliderPos >= localMin && nextSliderPos <= localMax;

      let nextPrg = reelProgressRef.current;
      if (insideSweetSpot) {
        // Player successfully overlaps the drifting target: rise tension
        nextPrg = reelProgressRef.current + 0.65; // ~2.5 seconds of clean overlap needed to win
        soundThrottleRef.current++;
        if (soundThrottleRef.current % 15 === 0) {
          playSound('loot');
        }
      } else {
        // Out of bounds: progress decays gently to make it high-success and balanced
        nextPrg = reelProgressRef.current - 0.22;
        soundThrottleRef.current++;
        if (soundThrottleRef.current % 18 === 0) {
          playSound('bump');
        }
      }

      const finalPrg = Math.max(0, Math.min(100, nextPrg));
      reelProgressRef.current = finalPrg;

      // Danger indicator skulls (3 skulls max)
      const riskValue = 100 - finalPrg;
      let nextStrikeCount = 0;
      if (riskValue > 80) nextStrikeCount = 3;
      else if (riskValue > 55) nextStrikeCount = 2;
      else if (riskValue > 30) nextStrikeCount = 1;
      strikeCountRef.current = nextStrikeCount;

      // Direct DOM manipulation for maximum performance & zero React render overhead
      if (sweetSpotRef.current) {
        sweetSpotRef.current.style.left = `${localMin}%`;
        sweetSpotRef.current.style.width = `${localMax - localMin}%`;
      }
      if (needleRef.current) {
        needleRef.current.style.left = `${nextSliderPos}%`;
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${finalPrg}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.innerText = `${Math.round(finalPrg)}% / 100%`;
      }

      // Only set strike count state when it changes to trigger selective UI skull updates
      setStrikeCount((currentValue) => {
        if (currentValue !== nextStrikeCount) {
          return nextStrikeCount;
        }
        return currentValue;
      });

      // Win/Loss bounds checks
      if (finalPrg >= 100) {
        triggerWin();
        return;
      }
      if (finalPrg <= 0) {
        triggerLoss();
        return;
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);
  };

  const stopSlider = () => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (sliderIntervalRef.current) {
      clearInterval(sliderIntervalRef.current);
      sliderIntervalRef.current = null;
    }
  };

  // Start the fishing cycle!
  const startCasting = () => {
    setGameState('CASTING');
    playSound('spell');
    
    // Choose a random time for the fish to bite: 1.8 to 4 seconds
    const biteDelay = 1800 + Math.random() * 2200;
    setTimeout(() => {
      // Ensure we are still casting before triggering bite
      setGameState((current) => {
        if (current === 'CASTING') {
          playSound('trap');
          triggerBitePhase();
          return 'BITE';
        }
        return current;
      });
    }, biteDelay);
  };

  // Bite Phase: Player must act quickly!
  const triggerBitePhase = () => {
    // Player has exactly 1.3 seconds to hook!
    const timer = setTimeout(() => {
      setGameState((current) => {
        if (current === 'BITE') {
          playSound('defeat');
          return 'ESCAPE';
        }
        return current;
      });
    }, 1300);
  };

  // The primary button/Space-bar action depending on phase
  const triggerCoreAction = () => {
    const currentState = stateRef.current;

    if (currentState === 'IDLE' || currentState === 'SUCCESS' || currentState === 'ESCAPE') {
      reelProgressRef.current = 35;
      sliderPosRef.current = 10;
      setStrikeCount(0);
      setIsReeling(false);
      startCasting();
    } else if (currentState === 'CASTING') {
      // Pulling too early: escape!
      playSound('bump');
      setGameState('ESCAPE');
    } else if (currentState === 'BITE') {
      // Successfully hooked! Transition to Reeling tension game
      playSound('loot');
      setGameState('REELING');
      reelProgressRef.current = 40;
      sliderPosRef.current = 15;
      sliderDirectionRef.current = 'RIGHT';
      setIsReeling(true); // Automatically assume they clicked to hook and are holding
      startSlider();
    }
  };

  const triggerWin = () => {
    stopSlider();
    // Select random fish species
    const species = [
      { name: 'Oakhaven Mirror Carp', icon: '🐟', id: 'mat_raw_fish' },
      { name: 'Golden Ley Rainbow Trout', icon: '🐠', id: 'mat_raw_fish' },
      { name: 'Deep Whisper Salmon', icon: '🍣', id: 'mat_raw_fish' },
      { name: 'Glimmering River Perch', icon: '🐳', id: 'mat_raw_fish' },
      { name: 'Iron-Jaw Pike Fish', icon: '🦞', id: 'mat_raw_fish' }
    ];
    const chosen = species[Math.floor(Math.random() * species.length)];
    setCaughtFishName(chosen.name);
    setCaughtFishIcon(chosen.icon || '🐟');
    setGameState('SUCCESS');
    playSound('victory');
    onCatch(chosen.name, chosen.id);
  };

  const triggerLoss = () => {
    stopSlider();
    setGameState('ESCAPE');
    playSound('defeat');
    onFail?.();
  };

  return (
    <div id="fishing-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div 
        id="fishing-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Fishing Overlay"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header decoration */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 text-left">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Anchor className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">🎣 Angler's Whisper</h2>
            <p className="text-[10px] text-slate-400 font-sans">Oakhaven Riverbank & Water Basin Fishing</p>
          </div>
        </div>

        {/* CORE MINI GAME PANEL CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 min-h-[300px]">
          
          {/* 1. IDLE STATE */}
          {gameState === 'IDLE' && (
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <span className="text-7xl animate-bounce duration-1000 inline-block">🎣</span>
                <span className="absolute bottom-0 right-0 text-3xl">🌊</span>
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-sm font-bold text-slate-200">Cast Your Line</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Stand adjacent to any direct water. Wait for a bite, then perform a timely reeling capture! Works perfectly on touchpads, phones, or Space bar!
                </p>
              </div>
              <button
                onClick={triggerCoreAction}
                className="w-full max-w-xs py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-950/40 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>CAST LINE (Press SPACE)</span>
              </button>
            </div>
          )}

          {/* 2. CASTING STATE */}
          {gameState === 'CASTING' && (
            <div className="text-center space-y-6 w-full">
              <div className="flex justify-center">
                <div id="river-ripples" className="relative flex items-center justify-center">
                  <div className="w-24 h-24 bg-sky-500/10 border border-sky-500/30 rounded-full animate-ping absolute duration-1000" />
                  <div className="w-16 h-16 bg-sky-500/20 border border-sky-400/40 rounded-full animate-ping absolute" />
                  <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center p-2 relative shadow-inner">
                    <span className="text-3xl animate-pulse">🏮</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-sky-400 tracking-widest animate-pulse">Waiting for a Bite...</h3>
                <p className="text-[10px] text-slate-400 mt-2">Watch the bobber floating on the water currents...</p>
              </div>
              <button
                onClick={triggerCoreAction}
                className="py-2.5 px-6 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-750 text-slate-400 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
              >
                Pull Early (Cancel)
              </button>
            </div>
          )}

          {/* 3. BITE STATE */}
          {gameState === 'BITE' && (
            <div className="text-center space-y-6 w-full animate-bounce">
              <div className="text-7xl">
                ❗️🚨❗️
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-lg font-black text-rose-500 uppercase tracking-widest animate-pulse">🔥 BITE! HOOK IT! 🔥</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-semibold">
                  SPLAT! Something just struck your bait! Reel immediately!
                </p>
              </div>
              <button
                onClick={triggerCoreAction}
                className="w-full max-w-xs py-4 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-rose-950/60 animate-pulse duration-75 cursor-pointer uppercase border border-rose-400"
              >
                💥 STRIKE! (Space / Tap Now!)
              </button>
            </div>
          )}

          {/* 4. REELING STATE */}
          {gameState === 'REELING' && (
            <div className="w-full space-y-6 text-center">
              {/* Top info and strike slots */}
              <div className="flex justify-between items-center px-2">
                <div className="text-left">
                  <span className="text-[10px] uppercase text-indigo-400 tracking-wider font-bold">Fish Tension</span>
                  <p className="text-xs font-serif italic text-slate-300">Keep it steady...</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                  <span className="text-[9px] uppercase text-slate-500 font-mono font-black">Escape Risk:</span>
                  <div className="flex gap-1 text-[11px]">
                    <span className={strikeCount >= 1 ? "text-rose-500" : "text-slate-700"}>💀</span>
                    <span className={strikeCount >= 2 ? "text-rose-500" : "text-slate-700"}>💀</span>
                    <span className={strikeCount >= 3 ? "text-rose-500" : "text-slate-700"}>💀</span>
                  </div>
                </div>
              </div>

              {/* Slider Track Container */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 relative">
                {/* Horizontal slider timeline */}
                <div className="w-full h-8 bg-slate-900 rounded-lg relative overflow-hidden flex items-center border border-slate-850">
                  
                  {/* Sweet spot green overlay */}
                  <div 
                    ref={sweetSpotRef}
                    className="absolute bg-emerald-500/20 border-l border-r border-emerald-400/50 h-full flex items-center justify-center text-[8px] font-black text-emerald-400"
                    style={{ left: '38%', width: '24%' }}
                  >
                    🎯 REEL
                  </div>

                  {/* Indicator cursor node */}
                  <div 
                    ref={needleRef}
                    className="absolute w-4 h-10 bg-indigo-500 border border-white rounded shadow-md -translate-x-1/2 flex items-center justify-center"
                    style={{ left: '15%' }}
                  >
                    <div className="w-0.5 h-6 bg-white" />
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-between text-[9px] text-slate-500 mt-2 font-mono">
                  <span>◀ Drag</span>
                  <span className="text-emerald-400 font-bold">Sweet Spot (Space here)</span>
                  <span>Pull ▶</span>
                </div>
              </div>

              {/* Progress and core reel buttons */}
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
                    <span>Reel Progress</span>
                    <span ref={progressTextRef} className="font-bold text-slate-200">40% / 100%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 mt-1">
                    <div 
                      ref={progressBarRef}
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>

                <button
                  onMouseDown={handleReelStart}
                  onMouseUp={handleReelStop}
                  onMouseLeave={handleReelStop}
                  onTouchStart={handleReelStart}
                  onTouchEnd={handleReelStop}
                  onTouchCancel={handleReelStop}
                  className={`w-full py-4 text-white text-xs font-black rounded-xl tracking-wider shadow-lg uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer select-none ${
                    isReeling 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/30'
                  }`}
                >
                  ⚓ {isReeling ? 'REELING IN...' : 'HOLD TO REEL! (Space / Hold Mouse)'}
                </button>
              </div>
            </div>
          )}

          {/* 5. SUCCESS STATE */}
          {gameState === 'SUCCESS' && (
            <div className="text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="relative inline-block">
                <span className="text-8xl block filter drop-shadow-lg">{caughtFishIcon}</span>
                <div className="absolute -top-2 -right-2 p-1.5 bg-yellow-500 rounded-full text-slate-950 text-[11px] font-black font-mono">
                  ★
                </div>
              </div>

              <div>
                <span className="text-[10px] bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 font-mono font-bold px-2 py-0.5 rounded-full">
                  🏆 MASTERFUL CAPTURE 🏆
                </span>
                <h3 className="text-lg font-black text-slate-100 mt-2 font-sans">{caughtFishName}</h3>
                <p className="text-[11px] text-emerald-400 font-sans mt-0.5">
                  Successfully reeled! Raw fish added to your food storage.
                </p>
                <div className="mt-3 bg-slate-950/60 p-2.5 rounded border border-slate-850 inline-block text-[10px] text-slate-400 max-w-xs">
                  🐟 <strong>Raw Fish cooking:</strong> Slow-cook this at any Campfire to unlock the full nutritional value of Grilled campfire fish!
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                <button
                  onClick={triggerCoreAction}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Fish Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Close Window</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 6. ESCAPE / FAIL STATE */}
          {gameState === 'ESCAPE' && (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-200">
              <span className="text-7xl block filter grayscale duration-500">💨🐟</span>
              <div>
                <h3 className="text-md font-bold text-slate-300">The Fish Excape-d!</h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  The tension snapped, or your hook was pulled late. Let's try again with sharper reflexes!
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={onClose}
                  className="py-3 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Give Up
                </button>
                <button
                  onClick={triggerCoreAction}
                  className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer helper */}
        <div className="border-t border-slate-800 pt-3 mt-4 text-[9.5px] text-slate-500 font-mono flex justify-between">
          <span>{gameState === 'REELING' ? 'Hit Space when needle is centered!' : 'Wait for bite cue'}</span>
          <span>Esc closes window</span>
        </div>
      </div>
    </div>
  );
}
