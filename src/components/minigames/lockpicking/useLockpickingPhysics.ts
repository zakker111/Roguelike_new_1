/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../../../utils/audio';
import { LockpickingStatus } from './types';

export interface UseLockpickingPhysicsProps {
  lockpickCount: number;
  onConsumeLockpick: () => void;
  onSuccess: (isPerfect: boolean) => void;
  onClose: () => void;
}

export function useLockpickingPhysics({
  lockpickCount,
  onConsumeLockpick,
  onSuccess,
  onClose,
}: UseLockpickingPhysicsProps) {
  const SWEET_SPOT_TOLERANCE = 8;
  const MAXIMUM_ROTATION = 90;

  const [activePicks, setActivePicks] = useState<number>(lockpickCount);
  const [status, setStatus] = useState<LockpickingStatus>('READY');
  const [isDraggingPick, setIsDraggingPick] = useState<boolean>(false);

  const pickAngleRef = useRef<number>(90);
  const targetAngleRef = useRef<number>(90);
  const screwdriverRotationRef = useRef<number>(0);
  const pickDurabilityRef = useRef<number>(100);
  const shakeIntensityRef = useRef<number>(0);
  const isPressingTensionRef = useRef<boolean>(false);
  const unlockedPerfectlyRef = useRef<boolean>(true);

  const dialRef = useRef<HTMLDivElement>(null);
  const cylinderRef = useRef<HTMLDivElement>(null);
  const wrenchRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef<HTMLDivElement>(null);
  const durabilityBarRef = useRef<HTMLDivElement>(null);
  const durabilityTextRef = useRef<HTMLSpanElement>(null);
  const angleTextRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const statusRef = useRef(status);
  const updateStatus = (newStatus: LockpickingStatus) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  };

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const randomAngle = Math.floor(Math.random() * 140) + 20;
    targetAngleRef.current = randomAngle;
    setActivePicks(lockpickCount);
    if (lockpickCount <= 0) {
      updateStatus('NO_PICKS');
    }
  }, []);

  useEffect(() => {
    setActivePicks(lockpickCount);
    if (lockpickCount <= 0) {
      updateStatus('NO_PICKS');
    }
  }, [lockpickCount]);

  const handlePickSnap = () => {
    playSound('lockpick_snap');
    onConsumeLockpick();
    setActivePicks((prev) => {
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
    playSound('unlock');
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

  const calculateAngle = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const angleRad = Math.atan2(-dy, dx);
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

  // 60 FPS Animation & Tension Loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      const currentStatus = statusRef.current;

      if (currentStatus === 'SUCCESS' || currentStatus === 'SNAPPED' || currentStatus === 'NO_PICKS') {
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
          let maxAllowedRotation = 0;
          if (pickOffset <= SWEET_SPOT_TOLERANCE) {
            maxAllowedRotation = MAXIMUM_ROTATION;
          } else {
            const distanceRatio = Math.max(0, 1 - pickOffset / 90);
            maxAllowedRotation = distanceRatio * (MAXIMUM_ROTATION * 0.4);
          }

          if (screwdriverRotation < maxAllowedRotation) {
            screwdriverRotation = Math.min(MAXIMUM_ROTATION, screwdriverRotation + 2.5);
            screwdriverRotationRef.current = screwdriverRotation;

            if (currentStatus !== 'READY') {
              updateStatus('READY');
            }
            shakeIntensity = 0;
            shakeIntensityRef.current = 0;
          } else {
            shakeIntensity = Math.min(5, shakeIntensity + 0.5);
            shakeIntensityRef.current = shakeIntensity;

            if (currentStatus !== 'SHAKING') {
              updateStatus('SHAKING');
            }
            unlockedPerfectlyRef.current = false;

            const damageAmount = Math.max(1.5, pickOffset / 15);
            pickDurability = Math.max(0, pickDurability - damageAmount);
            pickDurabilityRef.current = pickDurability;

            if (pickDurability <= 0) {
              handlePickSnap();
              animationFrameId = requestAnimationFrame(tick);
              return;
            }

            if (Math.random() > 0.8) {
              playSound('lockpick_click');
            }
          }
        } else {
          screwdriverRotation = Math.max(0, screwdriverRotation - 4);
          screwdriverRotationRef.current = screwdriverRotation;

          shakeIntensity = Math.max(0, shakeIntensity - 1);
          shakeIntensityRef.current = shakeIntensity;

          if (currentStatus === 'SHAKING') {
            updateStatus('READY');
          }
        }

        if (screwdriverRotation >= MAXIMUM_ROTATION) {
          handleSuccess();
          animationFrameId = requestAnimationFrame(tick);
          return;
        }
      }

      // Sync DOM elements
      const currentRot = screwdriverRotationRef.current;
      const currentAngle = pickAngleRef.current;
      const currentDur = pickDurabilityRef.current;
      const currentShake = shakeIntensityRef.current;
      const currentStatusActual = statusRef.current;

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

      if (wrenchRef.current) {
        wrenchRef.current.style.transform = `rotate(${currentRot}deg)`;
      }

      if (pickRef.current) {
        pickRef.current.style.transform = `rotate(${currentAngle - 90 + currentRot}deg)`;
      }

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

      if (durabilityTextRef.current) {
        durabilityTextRef.current.innerText = `${Math.round(currentDur)}%`;
        if (currentDur > 40) {
          durabilityTextRef.current.className = 'font-bold text-emerald-400';
        } else {
          durabilityTextRef.current.className = 'font-bold text-rose-400 animate-pulse';
        }
      }

      if (angleTextRef.current) {
        angleTextRef.current.innerText = `MOVE LOCKPICK ANGLE (${Math.round(currentAngle)}°)`;
      }

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
  }, [onClose]);

  // Global mouse & touch dragging
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

  const startPressingTension = () => {
    isPressingTensionRef.current = true;
  };

  const stopPressingTension = () => {
    isPressingTensionRef.current = false;
  };

  return {
    activePicks,
    status,
    isDraggingPick,
    dialRef,
    cylinderRef,
    wrenchRef,
    pickRef,
    durabilityBarRef,
    durabilityTextRef,
    angleTextRef,
    sliderRef,
    handleDialStart,
    handleSliderChange,
    resetAfterSnap,
    startPressingTension,
    stopPressingTension,
  };
}
