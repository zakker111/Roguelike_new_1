import { useState, useRef, useEffect, useCallback } from 'react';
import { ChunkMapInfo } from './types';

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  renderMinX: number;
  renderMaxX: number;
  renderMinY: number;
  renderMaxY: number;
}

export interface UseWorldMapViewportOptions {
  currentChunkX: number;
  currentChunkY: number;
  zoomLevel: number;
  setZoomLevel?: React.Dispatch<React.SetStateAction<number>>;
  recenterTrigger?: number;
  realmBounds: ViewportBounds;
  getChunkData: (cx: number, cy: number) => ChunkMapInfo;
  onHoverChunk: (chunk: ChunkMapInfo | null) => void;
  onSelectChunk: (chunk: ChunkMapInfo) => void;
  onRightClickChunk?: (chunkX: number, chunkY: number) => void;
}

export const BASE_CHUNK_SIZE = 88;
export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 3.5;

export function useWorldMapViewport({
  currentChunkX,
  currentChunkY,
  zoomLevel,
  setZoomLevel,
  recenterTrigger = 0,
  realmBounds,
  getChunkData,
  onHoverChunk,
  onSelectChunk,
  onRightClickChunk,
}: UseWorldMapViewportOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dynamicCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan offset in canvas coordinates
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pulseAnim, setPulseAnim] = useState<number>(0);
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false);

  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const inertiaRafRef = useRef<number | null>(null);

  // Touch tracking references
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    velocityX: number;
    velocityY: number;
    initialDistance: number;
    initialZoom: number;
    startTime: number;
    hasMoved: boolean;
  } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  const chunkSize = BASE_CHUNK_SIZE * zoomLevel;

  // Screen to world chunk projection
  const screenToWorldChunk = useCallback((screenX: number, screenY: number): { cx: number; cy: number } => {
    const mouseX = screenX - panOffset.x;
    const mouseY = screenY - panOffset.y;
    return {
      cx: Math.floor(mouseX / chunkSize),
      cy: Math.floor(mouseY / chunkSize),
    };
  }, [panOffset.x, panOffset.y, chunkSize]);

  // World chunk to screen projection
  const worldChunkToScreen = useCallback((cx: number, cy: number): { x: number; y: number } => {
    return {
      x: cx * chunkSize + panOffset.x,
      y: cy * chunkSize + panOffset.y,
    };
  }, [panOffset.x, panOffset.y, chunkSize]);

  // Center pan on player
  const centerOnPlayer = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPanOffset({
        x: centerX - currentChunkX * chunkSize - chunkSize / 2,
        y: centerY - currentChunkY * chunkSize - chunkSize / 2,
      });
    }
  }, [currentChunkX, currentChunkY, chunkSize]);

  useEffect(() => {
    centerOnPlayer();
  }, [recenterTrigger]);

  // Initial center on mount
  useEffect(() => {
    centerOnPlayer();
  }, []);

  // Animation ticker for glowing hero ring & leyline waystones (throttled to 30fps when map is active)
  useEffect(() => {
    let animId: number;
    let start = performance.now();
    let lastTick = 0;
    const loop = (now: number) => {
      if (now - lastTick >= 33) {
        setPulseAnim((now - start) / 1000);
        lastTick = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Smooth Pan Animation Helpers
  const smoothPanBy = useCallback((deltaX: number, deltaY: number) => {
    stopInertia();
    const startX = panOffset.x;
    const startY = panOffset.y;
    const targetX = startX + deltaX;
    const targetY = startY + deltaY;
    const startTime = performance.now();
    const duration = 240;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setPanOffset({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease,
      });
      if (progress < 1) {
        inertiaRafRef.current = requestAnimationFrame(animate);
      } else {
        inertiaRafRef.current = null;
      }
    };
    inertiaRafRef.current = requestAnimationFrame(animate);
  }, [panOffset.x, panOffset.y, stopInertia]);

  const centerOnChunk = useCallback((cx: number, cy: number) => {
    if (!containerRef.current) return;
    stopInertia();
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const targetX = w / 2 - (cx * chunkSize + chunkSize / 2);
    const targetY = h / 2 - (cy * chunkSize + chunkSize / 2);

    const startX = panOffset.x;
    const startY = panOffset.y;
    const startTime = performance.now();
    const duration = 260;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setPanOffset({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease,
      });
      if (progress < 1) {
        inertiaRafRef.current = requestAnimationFrame(animate);
      } else {
        inertiaRafRef.current = null;
      }
    };
    inertiaRafRef.current = requestAnimationFrame(animate);
  }, [chunkSize, panOffset.x, panOffset.y, stopInertia]);

  // Handle Drag & Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    stopInertia();
    if (e.button === 0 || e.button === 1) { // Left or middle click
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
      if (dist > 4) {
        hasDraggedRef.current = true;
      }
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hover chunk evaluation (Desktop mouse only)
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      const cx = Math.floor(mouseX / chunkSize);
      const cy = Math.floor(mouseY / chunkSize);

      const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
      if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
        onHoverChunk(getChunkData(cx, cy));
      } else {
        onHoverChunk(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // If the user was dragging the map, ignore the click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      const cx = Math.floor(mouseX / chunkSize);
      const cy = Math.floor(mouseY / chunkSize);

      const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
      if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
        const chunkData = getChunkData(cx, cy);
        onSelectChunk(chunkData);
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!setZoomLevel || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const targetZoom = zoomLevel >= 2.8 ? 0.8 : Math.min(MAX_ZOOM, Math.round((zoomLevel + 0.5) * 10) / 10);
    const scaleFactor = targetZoom / zoomLevel;
    const newPanX = mouseX - (mouseX - panOffset.x) * scaleFactor;
    const newPanY = mouseY - (mouseY - panOffset.y) * scaleFactor;

    setPanOffset({ x: newPanX, y: newPanY });
    setZoomLevel(targetZoom);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (canvasRef.current && onRightClickChunk) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      const cx = Math.floor(mouseX / chunkSize);
      const cy = Math.floor(mouseY / chunkSize);

      const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
      if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
        onRightClickChunk(cx, cy);
      }
    }
  };

  // Wheel Zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!setZoomLevel || !containerRef.current) return;

    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoomLevel + delta) * 100) / 100));

    if (newZoom !== zoomLevel) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleFactor = newZoom / zoomLevel;
      const newPanX = mouseX - (mouseX - panOffset.x) * scaleFactor;
      const newPanY = mouseY - (mouseY - panOffset.y) * scaleFactor;

      setPanOffset({ x: newPanX, y: newPanY });
      setZoomLevel(newZoom);
    }
  };

  // Touch Gesture Handling: Pan, Tap-Select, Long-Press Pin, Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    stopInertia();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = performance.now();
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastTime: now,
        velocityX: 0,
        velocityY: 0,
        initialDistance: 0,
        initialZoom: zoomLevel,
        startTime: now,
        hasMoved: false,
      };

      // Set long press timer for custom pin creation (500ms hold)
      if (onRightClickChunk && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touchX = touch.clientX - rect.left - panOffset.x;
        const touchY = touch.clientY - rect.top - panOffset.y;
        const cx = Math.floor(touchX / chunkSize);
        const cy = Math.floor(touchY / chunkSize);

        longPressTimerRef.current = setTimeout(() => {
          if (touchStateRef.current && !touchStateRef.current.hasMoved) {
            onRightClickChunk(cx, cy);
          }
        }, 500);
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const now = performance.now();
      touchStateRef.current = {
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        lastX: (t1.clientX + t2.clientX) / 2,
        lastY: (t1.clientY + t2.clientY) / 2,
        lastTime: now,
        velocityX: 0,
        velocityY: 0,
        initialDistance: dist,
        initialZoom: zoomLevel,
        startTime: now,
        hasMoved: true,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStateRef.current) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = performance.now();
      const dx = touch.clientX - touchStateRef.current.startX;
      const dy = touch.clientY - touchStateRef.current.startY;

      if (Math.hypot(dx, dy) > 6) {
        if (!touchStateRef.current.hasMoved) {
          touchStateRef.current.hasMoved = true;
          onHoverChunk(null);
        }
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      const dt = now - touchStateRef.current.lastTime;
      if (dt > 5) {
        const vx = (touch.clientX - touchStateRef.current.lastX) / dt;
        const vy = (touch.clientY - touchStateRef.current.lastY) / dt;
        touchStateRef.current.velocityX = touchStateRef.current.velocityX * 0.4 + vx * 0.6;
        touchStateRef.current.velocityY = touchStateRef.current.velocityY * 0.4 + vy * 0.6;
        touchStateRef.current.lastX = touch.clientX;
        touchStateRef.current.lastY = touch.clientY;
        touchStateRef.current.lastTime = now;
      }

      const newPanX = touchStateRef.current.startPanX + dx;
      const newPanY = touchStateRef.current.startPanY + dy;
      setPanOffset({ x: newPanX, y: newPanY });
    } else if (e.touches.length === 2 && setZoomLevel && containerRef.current) {
      touchStateRef.current.hasMoved = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const initDist = touchStateRef.current.initialDistance;

      if (initDist > 0) {
        const scale = dist / initDist;
        const targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(touchStateRef.current.initialZoom * scale * 100) / 100));

        const rect = containerRef.current.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

        const scaleFactor = targetZoom / zoomLevel;
        const newPanX = midX - (midX - panOffset.x) * scaleFactor;
        const newPanY = midY - (midY - panOffset.y) * scaleFactor;

        setPanOffset({ x: newPanX, y: newPanY });
        setZoomLevel(targetZoom);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (touchStateRef.current) {
      if (!touchStateRef.current.hasMoved && containerRef.current) {
        const duration = performance.now() - touchStateRef.current.startTime;
        if (duration < 350) {
          const rect = containerRef.current.getBoundingClientRect();
          const touchX = touchStateRef.current.startX - rect.left - panOffset.x;
          const touchY = touchStateRef.current.startY - rect.top - panOffset.y;
          const cx = Math.floor(touchX / chunkSize);
          const cy = Math.floor(touchY / chunkSize);

          const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
          if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
            const chunkData = getChunkData(cx, cy);
            onSelectChunk(chunkData);
          }
        }
      } else if (touchStateRef.current.hasMoved) {
        const vx = touchStateRef.current.velocityX;
        const vy = touchStateRef.current.velocityY;
        const speed = Math.hypot(vx, vy);

        if (speed > 0.2) {
          let currentVx = vx * 12;
          let currentVy = vy * 12;
          let currentPanX = panOffset.x;
          let currentPanY = panOffset.y;

          const stepInertia = () => {
            currentVx *= 0.88;
            currentVy *= 0.88;
            currentPanX += currentVx;
            currentPanY += currentVy;
            setPanOffset({ x: currentPanX, y: currentPanY });

            if (Math.hypot(currentVx, currentVy) > 0.3) {
              inertiaRafRef.current = requestAnimationFrame(stepInertia);
            } else {
              inertiaRafRef.current = null;
            }
          };
          inertiaRafRef.current = requestAnimationFrame(stepInertia);
        }
      }
    }

    if (e.touches.length === 0) {
      touchStateRef.current = null;
    }
  };

  // Resize canvas to fill container with DPI scaling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current && dynamicCanvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;

        canvasRef.current.width = w * dpr;
        canvasRef.current.height = h * dpr;
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;

        dynamicCanvasRef.current.width = w * dpr;
        dynamicCanvasRef.current.height = h * dpr;
        dynamicCanvasRef.current.style.width = `${w}px`;
        dynamicCanvasRef.current.style.height = `${h}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      stopInertia();
    };
  }, [stopInertia]);

  return {
    containerRef,
    canvasRef,
    dynamicCanvasRef,
    panOffset,
    setPanOffset,
    isDragging,
    pulseAnim,
    showMobileNav,
    setShowMobileNav,
    chunkSize,
    screenToWorldChunk,
    worldChunkToScreen,
    centerOnPlayer,
    centerOnChunk,
    smoothPanBy,
    stopInertia,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
