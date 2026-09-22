import React, { useEffect } from 'react';
import { ChunkMapInfo, WorldMapFilterState } from './types';
import { renderWorldMapDynamicOverlay } from './worldMapPinsRenderer';

export interface WorldMapPinsOverlayProps {
  dynamicCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  panOffset: { x: number; y: number };
  visibleMinX: number;
  visibleMaxX: number;
  visibleMinY: number;
  visibleMaxY: number;
  chunkSize: number;
  zoomLevel: number;
  getChunkData: (cx: number, cy: number) => ChunkMapInfo;
  filters: WorldMapFilterState;
  currentChunkX: number;
  currentChunkY: number;
  selectedChunkCoord: { x: number; y: number } | null;
  pulseAnim: number;
}

/**
 * WorldMapPinsOverlay:
 * Manages the dynamic animated canvas layer for hero beacon pulse,
 * leyline waystone auras, and selected chunk targeting reticles.
 * Serves as an interactive, decoupled overlay layer for world map POIs.
 */
export const WorldMapPinsOverlay: React.FC<WorldMapPinsOverlayProps> = ({
  dynamicCanvasRef,
  panOffset,
  visibleMinX,
  visibleMaxX,
  visibleMinY,
  visibleMaxY,
  chunkSize,
  zoomLevel,
  getChunkData,
  filters,
  currentChunkX,
  currentChunkY,
  selectedChunkCoord,
  pulseAnim,
}) => {
  useEffect(() => {
    const canvas = dynamicCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    renderWorldMapDynamicOverlay({
      ctx,
      width,
      height,
      panOffset,
      visibleMinX,
      visibleMaxX,
      visibleMinY,
      visibleMaxY,
      chunkSize,
      zoomLevel,
      getChunkData,
      filters,
      currentChunkX,
      currentChunkY,
      selectedChunkCoord,
      pulseAnim,
    });

    ctx.restore();
  }, [
    dynamicCanvasRef,
    panOffset,
    visibleMinX,
    visibleMaxX,
    visibleMinY,
    visibleMaxY,
    chunkSize,
    zoomLevel,
    getChunkData,
    filters,
    currentChunkX,
    currentChunkY,
    selectedChunkCoord,
    pulseAnim,
  ]);

  return (
    <canvas
      ref={dynamicCanvasRef}
      className="absolute inset-0 block w-full h-full pointer-events-none"
    />
  );
};
