# World Map Performance Optimization Roadmap & Phases

## 🎯 Objective
Achieve silky-smooth 60 FPS continuous zooming (0.4x to 3.5x) and fluid pan/drag interactions across large revealed maps (up to 2,600+ sectors) by implementing strict viewport frustum culling, an efficient LRU offscreen canvas cache, level-of-detail (LOD) subsampling, and render pass decoupling.

---

1 Lets have button in dev panel to save whole map into beatyfull png format 40% of scaling so i can see it in picture 


## 📋 Phases Overview

### Phase 1: Viewport Frustum Culling & LRU Chunk Bitmap Cache Engine (Current)
- [x] **Phase 1.1**: Math-precise Viewport Frustum Bounding Box Calculation in `WorldMapCanvas.tsx`
  - Compute visible chunk bounds `[visibleMinX, visibleMaxX, visibleMinY, visibleMaxY]` directly from `panOffset`, `zoomLevel`, and container pixel dimensions.
  - Skip chunk loops entirely outside the visible screen rectangle (saving thousands of iterations per frame on large/revealed world maps).
- [x] **Phase 1.2**: High-Performance LRU (Least Recently Used) Offscreen Chunk Cache in `chunkTileRasterizer.ts`
  - Implement true LRU cache with eviction threshold (capped at ~300 bitmaps) and fast key lookups.
  - Fast chunk terrain blitting via `ctx.drawImage` with integer rounding to prevent subpixel jitter.
- [x] **Phase 1.3**: Chunk Metadata Memoization
  - Cache procedural biome, POI, town, and traversal metrics calculation per chunk key to prevent continuous math re-evaluation on every frame.

---

### Phase 2: Level-of-Detail (LOD) Subsampling & POI Clustering (Completed)
- [x] **Phase 2.1**: Low-Resolution Thumbnail Macro Mode (`zoomLevel < 0.75x`)
  - Rendered downsampled 16x10 LOD Macro canvases with LRU cache for wide-angle continental views (`zoomLevel < 0.75x`), cutting per-chunk pixel count by 93.75% (from 2,560 to 160 pixels) and eliminating micro-tile overhead.
- [x] **Phase 2.2**: POI Marker Density Management & Clustering
  - Simplified POI marker pips, disabled expensive text layout calculations (`ctx.measureText`), suppressed banner box rendering, and streamlined custom pin icon lookups when viewing wide map sectors.

---

### Phase 3: Layer Decoupling & Dirty State Render Loop (Completed)
- [x] **Phase 3.1**: Dual-Canvas Layering (Static Map Canvas vs. Dynamic UI Canvas)
  - Separated static terrain, roads, and POI markers onto a dedicated background canvas (`canvasRef`), decoupled from the high-frequency top animated canvas (`dynamicCanvasRef`).
- [x] **Phase 3.2**: Idle Throttle & Animation Loop Optimization
  - Static layer re-renders purely on state changes (pan, zoom, filter toggles, chunk discoveries), eliminating unnecessary terrain redraws during idle animation ticks.
  - Animated hero beacon pulses and leyline pulses execute cleanly on the lightweight top overlay canvas at throttled 30 FPS intervals.

---

### Phase 4: Async Background Generation & Streaming (Next)
- [ ] **Phase 4.1**: Chunk Batching & Non-blocking Pre-generation
  - Generate adjacent unexplored or newly revealed chunks in background slices.
