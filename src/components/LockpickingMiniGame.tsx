/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Key, AlertTriangle, ShieldAlert, Award, Hammer, RotateCcw } from 'lucide-react';
import { playSound } from '../utils/audio';

interface LockpickingMiniGameProps {
  onClose: () => void;
  onSuccess: (isPerfect: boolean) => void;
  onFail?: () => void;
  lockpickCount: number;
  onConsumeLockpick: () => void;
  chestName?: string;
  skeletonKeyCount?: number;
  onUseSkeletonKey?: () => void;
}

export default function LockpickingMiniGame({
  onClose,
  onSuccess,
  onFail,
  lockpickCount,
  onConsumeLockpick,
  chestName = "Locked Chest",
  skeletonKeyCount = 0,
  onUseSkeletonKey
}: LockpickingMiniGameProps) {
  // Config parameters
  const SWEET_SPOT_TOLERANCE = 8; // Degrees of sweet spot tolerance
  const MAXIMUM_ROTATION = 90; // Screwdriver fully turned is 90 degrees

  // React States only for key game flow transitions to avoid 60 FPS re-render lag
  const [activePicks, setActivePicks] = useState<number>(lockpickCount);
  const [status, setStatus] = useState<'READY' | 'SHAKING' | 'SNAPPED' | 'SUCCESS' | 'NO_PICKS'>('READY');
  const [isDraggingPick, setIsDraggingPick] = useState<boolean>(false);

  // Animation and physics values stored as refs to run at 60 FPS without React rendering lag
  const pickAngleRef = useRef<number>(90); // 0 to 180 degrees, default centered at 90
  const targetAngleRef = useRef<number>(90); // Randomized sweet-spot angle
  const screwdriverRotationRef = useRef<number>(0); // 0 to 90 degrees of tension
  const pickDurabilityRef = useRef<number>(100); // 100 to 0 (stress limit of current pick)
  const shakeIntensityRef = useRef<number>(0);
  const isPressingTensionRef = useRef<boolean>(false);
  const unlockedPerfectlyRef = useRef<boolean>(true);

  // DOM element references for direct, lag-free hardware-accelerated animations
  const dialRef = useRef<HTMLDivElement>(null);
  const cylinderRef = useRef<HTMLDivElement>(null);
  const wrenchRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef<HTMLDivElement>(null);
  const durabilityBarRef = useRef<HTMLDivElement>(null);
  const durabilityTextRef = useRef<HTMLSpanElement>(null);
  const angleTextRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Keep a stable ref to status to avoid tearing key event listeners
  const statusRef = useRef(status);
  const updateStatus = (newStatus: 'READY' | 'SHAKING' | 'SNAPPED' | 'SUCCESS' | 'NO_PICKS') => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  };

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Set random sweet spot on initialization (only once on mount)
  useEffect(() => {
    const randomAngle = Math.floor(Math.random() * 140) + 20; // 20 to 160 degrees
    targetAngleRef.current = randomAngle;
    setActivePicks(lockpickCount);
    if (lockpickCount <= 0) {
      updateStatus('NO_PICKS');
    }
  }, []);

  // Update activePicks if lockpickCount prop changes from parent
  useEffect(() => {
    setActivePicks(lockpickCount);
    if (lockpickCount <= 0) {
      updateStatus('NO_PICKS');
    }
  }, [lockpickCount]);

  const handlePickSnap = () => {
    playSound('lockpick_snap'); // snap sound
    onConsumeLockpick();
    setActivePicks(prev => {
      const nextPicks = Math.max(0, prev - 1);
      if (nextPicks <= 0) {
        updateStatus('NO_PICKS');
      } else {
        updateStatus('SNAPPED');
      }
      return nextPicks;
    });
    screwdriverRotationRef.current = 0;
    isPressingTensionRef.current = false;
  };

  const handleSuccess = () => {
    updateStatus('SUCCESS');
    playSound('unlock'); // click lock succeeded sound!
    isPressingTensionRef.current = false;
    setTimeout(() => {
      onSuccess(unlockedPerfectlyRef.current);
    }, 1500);
  };

  const resetAfterSnap = () => {
    const picksLeft = activePicks;
    if (picksLeft > 0) {
      updateStatus('READY');
      setActivePicks(picksLeft);
      pickDurabilityRef.current = 100;
      screwdriverRotationRef.current = 0;
      shakeIntensityRef.current = 0;
      isPressingTensionRef.current = false;
      unlockedPerfectlyRef.current = true;
    } else {
      updateStatus('NO_PICKS');
    }
  };

  // Coordinate calculations for direct dial touch/dragging
  const calculateAngle = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angleRad = Math.atan2(-dy, dx); // dy goes downwards, negate for Cartesian up-positive
    let angleDeg = (angleRad * 180) / Math.PI;

    if (angleDeg < 0) {
      if (angleDeg < -90) {
        angleDeg = 0;
      } else {
        angleDeg = 180;
      }
    } else {
      angleDeg = 180 - angleDeg;
    }

    pickAngleRef.current = Math.max(0, Math.min(180, angleDeg));
  };

  const handleDialStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const currentStatus = statusRef.current;
    if (currentStatus === 'SUCCESS' || currentStatus === 'NO_PICKS' || currentStatus === 'SNAPPED') return;
    setIsDraggingPick(true);

    if ('touches' in e) {
      if (e.touches.length > 0) {
        calculateAngle(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else {
      calculateAngle(e.clientX, e.clientY);
    }
  };

  // Cylinder tension & physics tick loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      const currentStatus = statusRef.current;
      
      if (currentStatus === 'SUCCESS' || currentStatus === 'SNAPPED' || currentStatus === 'NO_PICKS') {
        // Just ease tension back to 0 on game ending
        if (currentStatus === 'SUCCESS') {
          screwdriverRotationRef.current = MAXIMUM_ROTATION;
          shakeIntensityRef.current = 0;
        } else {
          screwdriverRotationRef.current = Math.max(0, screwdriverRotationRef.current - 4);
          shakeIntensityRef.current = Math.max(0, shakeIntensityRef.current - 1);
        }
      } else {
        const isPressingTension = isPressingTensionRef.current;
        const pickAngle = pickAngleRef.current;
        const targetAngle = targetAngleRef.current;
        let screwdriverRotation = screwdriverRotationRef.current;
        let pickDurability = pickDurabilityRef.current;
        let shakeIntensity = shakeIntensityRef.current;

        const pickOffset = Math.abs(pickAngle - targetAngle);

        if (isPressingTension) {
          // Calculate maximum rotation allowed at current pick offset
          let maxAllowedRotation = 0;
          if (pickOffset <= SWEET_SPOT_TOLERANCE) {
            maxAllowedRotation = MAXIMUM_ROTATION;
          } else {
            // If outside tolerance, allow a tiny bit of rotation based on distance
            const distanceRatio = Math.max(0, 1 - (pickOffset / 90));
            maxAllowedRotation = distanceRatio * (MAXIMUM_ROTATION * 0.4);
          }

          if (screwdriverRotation < maxAllowedRotation) {
            // Tension successfully rotating
            screwdriverRotation = Math.min(MAXIMUM_ROTATION, screwdriverRotation + 2.5);
            screwdriverRotationRef.current = screwdriverRotation;
            
            if (currentStatus !== 'READY') {
              updateStatus('READY');
            }
            shakeIntensity = 0;
            shakeIntensityRef.current = 0;
          } else {
            // Hits lock barrier (jammed!) - Starts shaking and taking damage
            shakeIntensity = Math.min(5, shakeIntensity + 0.5);
            shakeIntensityRef.current = shakeIntensity;

            if (currentStatus !== 'SHAKING') {
              updateStatus('SHAKING');
            }
            unlockedPerfectlyRef.current = false;

            // Damage pick based on distance from sweet spot
            const damageAmount = Math.max(1.5, (pickOffset / 15));
            pickDurability = Math.max(0, pickDurability - damageAmount);
            pickDurabilityRef.current = pickDurability;

            if (pickDurability <= 0) {
              handlePickSnap();
              animationFrameId = requestAnimationFrame(tick);
              return;
            }

            // Play a rapid clicking warning sound occasionally
            if (Math.random() > 0.8) {
              playSound('lockpick_click');
            }
          }
        } else {
          // Slowly ease tension back when not pressing
          screwdriverRotation = Math.max(0, screwdriverRotation - 4);
          screwdriverRotationRef.current = screwdriverRotation;

          shakeIntensity = Math.max(0, shakeIntensity - 1);
          shakeIntensityRef.current = shakeIntensity;

          if (currentStatus === 'SHAKING') {
            updateStatus('READY');
          }
        }

        // Check success condition: reaching 90 degrees
        if (screwdriverRotation >= MAXIMUM_ROTATION && currentStatus !== 'SUCCESS') {
          handleSuccess();
          animationFrameId = requestAnimationFrame(tick);
          return;
        }
      }

      // Read values from refs to apply to DOM
      const currentRot = screwdriverRotationRef.current;
      const currentAngle = pickAngleRef.current;
      const currentDur = pickDurabilityRef.current;
      const currentShake = shakeIntensityRef.current;
      const currentStatusActual = statusRef.current;

      // 1. Cylinder Ref
      if (cylinderRef.current) {
        let leftVal = '0px';
        let topVal = '0px';
        if (currentStatusActual === 'SHAKING') {
          leftVal = `${(Math.random() - 0.5) * currentShake * 1.5}px`;
          topVal = `${(Math.random() - 0.5) * currentShake * 1.5}px`;
        }
        cylinderRef.current.style.transform = `rotate(${currentRot}deg)`;
        cylinderRef.current.style.left = leftVal;
        cylinderRef.current.style.top = topVal;
      }

      // 2. Wrench Ref
      if (wrenchRef.current) {
        wrenchRef.current.style.transform = `rotate(${currentRot}deg)`;
      }

      // 3. Pick Ref
      if (pickRef.current) {
        pickRef.current.style.transform = `rotate(${currentAngle - 90 + currentRot}deg)`;
      }

      // 4. Durability Bar Ref
      if (durabilityBarRef.current) {
        durabilityBarRef.current.style.width = `${currentDur}%`;
        if (currentDur > 60) {
          durabilityBarRef.current.className = 'h-full transition-all duration-75 bg-emerald-500';
        } else if (currentDur > 30) {
          durabilityBarRef.current.className = 'h-full transition-all duration-75 bg-amber-500';
        } else {
          durabilityBarRef.current.className = 'h-full transition-all duration-75 bg-rose-500';
        }
      }

      // 5. Durability Text Ref
      if (durabilityTextRef.current) {
        durabilityTextRef.current.innerText = `${Math.round(currentDur)}%`;
        if (currentDur > 40) {
          durabilityTextRef.current.className = 'font-bold text-emerald-400';
        } else {
          durabilityTextRef.current.className = 'font-bold text-rose-400 animate-pulse';
        }
      }

      // 6. Angle Text Ref
      if (angleTextRef.current) {
        angleTextRef.current.innerText = `MOVE LOCKPICK ANGLE (${Math.round(currentAngle)}°)`;
      }

      // 7. Slider Ref
      if (sliderRef.current) {
        sliderRef.current.value = String(currentAngle);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    let keyInterval: number | null = null;
    const activeKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
        return;
      }

      if (e.repeat) return;
      activeKeys.add(e.key.toLowerCase());

      if (e.key === ' ' || e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        isPressingTensionRef.current = true;
        e.preventDefault();
      }

      if (!keyInterval) {
        keyInterval = window.setInterval(() => {
          const currentStatus = statusRef.current;
          if (currentStatus === 'SUCCESS' || currentStatus === 'SNAPPED' || currentStatus === 'NO_PICKS') return;

          let step = 0;
          if (activeKeys.has('a') || activeKeys.has('arrowleft')) {
            step = -2.5;
          } else if (activeKeys.has('d') || activeKeys.has('arrowright')) {
            step = 2.5;
          }

          if (step !== 0) {
            pickAngleRef.current = Math.max(0, Math.min(180, pickAngleRef.current + step));
          }
        }, 16);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase());
      if (e.key === ' ' || e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        isPressingTensionRef.current = false;
      }

      if (activeKeys.size === 0 && keyInterval) {
        window.clearInterval(keyInterval);
        keyInterval = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (keyInterval) window.clearInterval(keyInterval);
    };
  }, []);

  // Global mouse & touch dragging events
  useEffect(() => {
    if (!isDraggingPick) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const currentStatus = statusRef.current;
      if (currentStatus === 'SUCCESS' || currentStatus === 'NO_PICKS' || currentStatus === 'SNAPPED') {
        setIsDraggingPick(false);
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      calculateAngle(clientX, clientY);
    };

    const handleGlobalEnd = () => {
      setIsDraggingPick(false);
    };

    window.addEventListener('mousemove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, [isDraggingPick]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    pickAngleRef.current = val;
  };

  return (
    <div id="lockpicking-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-sans">
      <div 
        id="lockpicking-modal"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-950/80 px-4 py-3 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">
              Sunder Secure Lockpicking
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors hover:bg-slate-900 cursor-pointer"
            title="Force Close Lockpicking"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[340px]">
          
          <div className="mb-2 text-center">
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">{chestName}</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Drag lock face directly or use slider to pivot the pick</p>
          </div>

          {/* Graphic Interface Zone */}
          <div 
            ref={dialRef}
            onMouseDown={handleDialStart}
            onTouchStart={handleDialStart}
            className="relative w-48 h-48 bg-slate-950/40 rounded-full border border-slate-800 shadow-inner flex items-center justify-center my-4 overflow-hidden cursor-crosshair select-none active:border-amber-500/50 transition-colors duration-150 touch-none"
          >
            {/* Center Lock Cylinder ring */}
            <div 
              ref={cylinderRef}
              className="w-36 h-36 bg-slate-900 rounded-full border-4 border-slate-700 shadow-md flex items-center justify-center transition-transform relative"
              style={{
                transform: 'rotate(0deg)',
                left: '0px',
                top: '0px',
              }}
            >
              {/* Inner Keyhole Detail */}
              <div className="w-8 h-12 bg-slate-950 border-2 border-slate-600 rounded-full relative flex flex-col items-center justify-between py-1">
                <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                <div className="w-2 h-6 bg-slate-800 rounded-sm"></div>
              </div>

              {/* Decorative Lock Face Indicators */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-slate-800 rounded"></div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-slate-800 rounded"></div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-slate-800 rounded"></div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-slate-800 rounded"></div>
            </div>

            {/* Tension Screwdriver Wrench Representation */}
            <div 
              ref={wrenchRef}
              className="absolute w-2 h-20 origin-bottom rounded bg-slate-400 shadow-lg pointer-events-none"
              style={{
                bottom: '50%',
                left: 'calc(50% - 4px)',
                transform: 'rotate(0deg)',
                transformOrigin: 'bottom center',
                transition: 'transform 0.05s linear'
              }}
            >
              <div className="w-4 h-4 -mt-1 -ml-1 bg-slate-500 rounded-full border border-slate-300"></div>
            </div>

            {/* Lockpick Representation */}
            <div 
              ref={pickRef}
              className="absolute w-1 h-24 origin-bottom bg-amber-500/85 shadow-md pointer-events-none z-10"
              style={{
                bottom: '50%',
                left: 'calc(50% - 2px)',
                transform: 'rotate(0deg)',
                transformOrigin: 'bottom center'
              }}
            >
              {/* Lockpick Tip indicator */}
              <div className="absolute top-0 -left-1 w-3 h-3 bg-amber-400 rounded-full shadow border border-amber-300 animate-pulse"></div>
            </div>

            {/* Highlighted Alignment Feedback Zone */}
            <div className="absolute inset-0 border-2 border-transparent pointer-events-none rounded-full flex items-center justify-center">
              {status === 'SUCCESS' && (
                <div className="bg-emerald-500/20 text-emerald-400 p-2 text-[10px] rounded font-bold uppercase tracking-widest border border-emerald-500/30">
                  Unlocked!
                </div>
              )}
              {status === 'NO_PICKS' && (
                <div className="bg-rose-500/20 text-rose-400 p-2 text-[10px] rounded font-bold uppercase tracking-widest border border-rose-500/30">
                  No Picks
                </div>
              )}
            </div>
          </div>

          {/* Interactive Controls & States */}
          <div className="w-full max-w-sm flex flex-col gap-3">
            
            {/* Pick Rotation Slider */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-mono">
                <span>👈 LEFT</span>
                <span ref={angleTextRef} className="text-amber-400 font-bold">MOVE LOCKPICK ANGLE (90°)</span>
                <span>RIGHT 👉</span>
              </div>
              <input 
                ref={sliderRef}
                type="range"
                min="0"
                max="180"
                step="0.5"
                defaultValue="90"
                onChange={handleSliderChange}
                disabled={status === 'SUCCESS' || status === 'NO_PICKS' || status === 'SNAPPED'}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Lockpick Health & Active Quantity Stats */}
            <div className="flex gap-2 justify-between items-center text-xs font-mono">
              <div className="flex items-center gap-2 bg-slate-950/50 p-2 px-3 rounded border border-slate-850 border-box select-none">
                <span className="text-slate-400 text-[10px]">REMAINING PICKS:</span>
                <span className={`font-bold ${activePicks > 0 ? 'text-amber-400' : 'text-rose-500 font-bold'}`}>
                  🔑 x{activePicks}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1 bg-slate-950/50 p-2 px-3 rounded border border-slate-850">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 border-box select-none">PICK DURABILITY:</span>
                  <span ref={durabilityTextRef} className="font-bold text-emerald-400">
                    100%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    ref={durabilityBarRef}
                    className="h-full transition-all duration-75 bg-emerald-500"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Dynamic Status / Feedback Prompts */}
            <div className="min-h-[44px] flex items-center justify-center">
              {status === 'READY' && (
                <div className="text-[10px] text-slate-400 text-center font-mono">
                  ⌨️ Hold <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">SPACEBAR</kbd> or hold button below to apply tension.
                </div>
              )}
              {status === 'SHAKING' && (
                <div className="text-[11px] text-rose-400 font-bold text-center font-mono flex items-center gap-1.5 animate-bounce uppercase">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> LOCK JAMMED! RELEASE TENSION TO SAVE PICK!
                </div>
              )}
              {status === 'SNAPPED' && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-rose-500 font-bold uppercase font-mono tracking-wider">💥 SNAP! Your lockpick snapped!</span>
                  <button
                    onClick={resetAfterSnap}
                    className="mt-1 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold uppercase transition-all shadow cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Insert New Lockpick
                  </button>
                </div>
              )}
              {status === 'SUCCESS' && (
                <div className="text-center">
                  <span className="text-xs text-emerald-400 font-bold uppercase font-mono flex items-center gap-1 animate-pulse justify-center">
                    <Award className="w-4 h-4" /> SUCCESS! LOCK PICKED OPEN!
                  </span>
                  {unlockedPerfectlyRef.current && (
                    <span className="text-[9px] text-amber-400 font-mono block mt-0.5">⭐ PERFECT PERFORMANCE: pristine unlock bonus applied!</span>
                  )}
                </div>
              )}
              {status === 'NO_PICKS' && (
                <div className="text-center">
                  <span className="text-[11px] text-rose-400 font-bold uppercase font-mono flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 shrink-0" /> Out of lockpicks! Craft more in the Workbench!
                  </span>
                </div>
              )}
            </div>

            {/* Large Interactive Rotation Trigger Button */}
            <div className="grid grid-cols-1 gap-2">
              {skeletonKeyCount > 0 && onUseSkeletonKey && (
                <button
                  type="button"
                  onClick={onUseSkeletonKey}
                  className="py-3 bg-purple-950/70 hover:bg-purple-900 text-purple-300 hover:text-purple-100 rounded-lg text-xs font-bold uppercase border border-purple-500/40 hover:border-purple-500/80 transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] duration-200"
                >
                  💀 USE GRIM SKELETON KEY (INSTANT UNLOCK) (x{skeletonKeyCount})
                </button>
              )}

              <button
                onMouseDown={() => { if (statusRef.current === 'READY' || statusRef.current === 'SHAKING') isPressingTensionRef.current = true; }}
                onMouseUp={() => isPressingTensionRef.current = false}
                onMouseLeave={() => isPressingTensionRef.current = false}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (statusRef.current === 'READY' || statusRef.current === 'SHAKING') isPressingTensionRef.current = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  isPressingTensionRef.current = false;
                }}
                disabled={status === 'SUCCESS' || status === 'NO_PICKS' || status === 'SNAPPED'}
                className={`py-3.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 border transition-all select-none duration-150 touch-none ${
                  status === 'READY' || status === 'SHAKING'
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:border-slate-650 cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                }`}
              >
                <span>🔑 APPLY TENSION (ROTATE LOCK)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-bold uppercase border border-slate-850 transition-all cursor-pointer text-center"
              >
                🚪 STEP AWAY FROM CHEST (CLOSE)
              </button>
            </div>

          </div>

          {/* Quick Manual & Instructions Footer */}
          <div className="mt-4 border-t border-slate-800/60 pt-3 w-full max-w-sm flex flex-col gap-1 text-[8px] text-slate-500 font-mono select-none">
            <div className="flex justify-between w-full">
              <span>💻 A/D or Arrows / Drag dial to steer</span>
              <span>📱 Touch & Drag lock dial to steer</span>
            </div>
            <div className="flex justify-between w-full mt-0.5">
              <span>⌨️ Spacebar / W to apply tension</span>
              <span>📱 Hold tension button to apply torque</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
