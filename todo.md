# World Map Performance Optimization Roadmap & Phases

## 🎯 Objective
Achieve silky-smooth 60 FPS continuous zooming (0.4x to 3.5x) and fluid pan/drag interactions across large revealed maps (up to 2,600+ sectors) by implementing strict viewport frustum culling, an efficient LRU offscreen canvas cache, level-of-detail (LOD) subsampling, and render pass decoupling.

---

### 🗺️ Completed Developer Cartography Tooling & Mobile Controls
- [x] **Dev Panel Whole Realm PNG Exporter (40% Scale)**
  - Implemented `exportRealmMapToPng` in `/src/utils/worldmap/worldMapPngExporter.ts`.
  - Added "Save Whole Map to PNG (40% Scale)" button in Sovereign Cheats Tab (`GodCheatsTab.tsx`).
  - Seamlessly computes realm bounding box across all discovered/revealed chunks, renders terrain via `chunkTileRasterizer.ts`, draws coordinate grids & scales, and triggers browser image download.
- [x] **Mobile Touch Gestures, Smooth Inertia & Floating D-Pad Navigation**
  - Added touch deadzone threshold (6px) and velocity tracking with smooth ease-out inertia on release in `WorldMapCanvas.tsx`.
  - Suppressed hover tooltips during active drag on mobile.
  - Implemented collapsible inspection card (`WorldMapChunkTooltip.tsx`) with minimize/expand badge pill and close button.
  - Rendered non-intrusive glowing bracket reticle around selected sectors.
  - Built floating mobile Compass Navigator overlay with smooth D-pad directional panning, hero/origin centering, and zoom presets.

---

## 📋 Phases Overview

### Phase 1: Viewport Frustum Culling & LRU Chunk Bitmap Cache Engine (Completed)
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

### Phase 4: Async Background Generation & Streaming (Completed)
- [x] **Phase 4.1**: Chunk Batching & Non-blocking Pre-generation
  - Implemented `asyncChunkBatcher` service (`/src/utils/overworld/asyncChunkBatcher.ts`) using `requestIdleCallback` / micro-task time slicing (8ms threshold).
  - Background asynchronous pre-generation of surrounding chunk rings upon sector transitions and cartography modal inspection.
  - Seamless cache integration with `chunkTileRasterizer.ts` and `usePlayerTurnMovement.ts` to prevent frame stutters during massive world discovery.

---

# 🎨 Future Roadmap: Pluggable Dual-Mode Visual & Animated Tileset Engine

## 🎯 Architecture Objective
Evolve the visual presentation from pure ASCII/glyph rendering to a **pluggable dual-mode rendering architecture** supporting both **Classic High-DPI ASCII/Glyphs (Default)** and **HD Animated Tilesets**, allowing instant hot-swapping at runtime via Settings or hotkey (`F8` / `Alt+T`) without reloading or modifying game logic.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     PLUGGABLE DUAL-MODE VISUAL ARCHITECTURE                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                  GAME ENGINE & STATE (Shared)                                    │
│       PlayerContext • WorldContext • CombatContext • useGameLoop • AI Engine • Save/Load         │
└──────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
         ┌───────────────────────────┐                   ┌───────────────────────────┐
         │     MODE A (DEFAULT)      │                   │          MODE B           │
         │   Classic ASCII/Glyphs    │ ◄─── TOGGLE ───►  │    HD Animated Tilesets   │
         │  • Zero-load startup      │   [Settings/F8]   │  • Bitmasked Auto-Tiling  │
         │  • High-DPI text/emoji    │                   │  • Multi-frame Sprites    │
         │  • Pure procedural canvas │                   │  • Smooth Visual Lerp     │
         └───────────────────────────┘                   └───────────────────────────┘
```

---

## 📋 Implementation Phases

### 📦 Phase 1: Dual-Mode Registry, Renderer Strategy Pattern & Asset Fallback
- [x] **Phase 1.1**: Pluggable Renderer Interface (`src/canvas/types.ts`)
  - Define `IVisualRenderer` interface contract (`renderTerrain`, `renderEntities`, `renderVFX`).
  - Introduce `graphicsMode` setting (`'classic_glyph'` default vs. `'animated_tileset'`) persisted in `localStorage`.
- [x] **Phase 1.2**: Classic vs. Tileset Strategy Dispatcher in `HybridGraphicsEngine.ts`
  - Encapsulate current rendering into `ClassicGlyphRenderer.ts`.
  - Stub `AnimatedTilesetRenderer.ts` with transparent runtime fallback to classic glyphs for missing assets.
- [x] **Phase 1.3**: Texture Atlas Loader & Offscreen Bitmap Cache (`src/canvas/TilesetAtlasManager.ts`)
  - Load terrain and entity sprite-sheets with `imageSmoothingEnabled = false` for pixel-crisp rendering across Retina/High-DPI screens.
- [x] **Phase 1.4**: UI Hot-Swap Toggle
  - Add instant graphics mode toggle in Settings and Hotkey (`F8` / `Alt+T`).

---

### 🧱 Phase 2: Pluggable Auto-Tiling & Dual Terrain Rendering
- [x] **Phase 2.1**: 4-Bit / 8-Bit (Wang Tile) Neighbor Bitmasking Engine
  - Surrounding tile evaluation (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`) to calculate seamless connection sprite indices for walls, shorelines, and river paths.
- [x] **Phase 2.2**: Procedural Variant Selection
  - Deterministic hash-based tile variant selection (mossy stone, cracked dungeon brick, wild grass flowers) maintaining visual stability across turns.
- [x] **Phase 2.3**: Dual Terrain Render Pipeline
  - Classic mode renders procedural fills and procedural canvas water ripples; Tileset mode renders bitmasked sprite atlas slices.

---

### 🧙 Phase 3: Entity Sprite Engine with Multi-Frame Directional Animations
- [x] **Phase 3.1**: Character & Monster Sprite Atlas Catalog
  - Map `char` / `EnemyType` identifiers to sprite-sheet coordinates.
- [x] **Phase 3.2**: 4-Directional Animation State Machine
  - Track directional facing (`North`, `East`, `South`, `West`) and animation states (`Idle` 4-frame breathing, `Walk` 4-8 frame cycle, `Attack` windup/impact, `Hurt` flash).
- [x] **Phase 3.3**: Modular Equipment Paperdoll Layering
  - Layer equipped armors, weapons, shields, and helmets dynamically over base character sprites in Tileset mode.

---

### 🏃 Phase 4: Shared Visual Lerp & Camera Decoupling (Completed)
- [x] **Phase 4.1**: Decoupled Logical vs. Render Position Coordinates
  - Turn-based logical grid states (`e.x`, `e.y`) remain instantaneous integers.
  - Smooth render interpolation pool (`renderX`, `renderY`) gliding over 100–150ms with ease-out quadratic tween in `entityInterpolationManager.ts`.
- [x] **Phase 4.2**: Smooth Camera Following & Screen Shake
  - Smooth camera tracking and combat impact screen-shake in `cameraController.ts` integrated directly into `GameCanvas.tsx`.
- [x] **Phase 4.3**: "Instant Turn / Smooth Movement" Accessibility Setting
  - Optional toggle in `AppHeaderBar.tsx` and hot-swappable state in `entityInterpolationManager` to disable movement interpolation for fast turn-based grid snapping.

---

### ✨ Phase 5: Swappable VFX, Projectiles & Spell Animations (Completed)
- [x] **Phase 5.1**: Arcane Projectiles Engine
  - Flying arrows, fireballs, and frost bolts with bezier flight paths and rotating projectile sprites.
- [x] **Phase 5.2**: Melee Slash Arcs & Impact Decals
  - Directional weapon swipe arcs and ground impact animations.
- [x] **Phase 5.3**: Shared Particle Event Queue
  - Unified `spawn-game-effect` dispatcher servicing both Classic and Tileset visual styles.

---

### 💡 Phase 6: Atmosphere, Lighting Shaders & Weather Interactivity (Completed)
- [x] **Phase 6.1**: Dynamic 2D Radial Point-Light Shaders
  - Torches, campfires, lava pools, and lanterns emitting warm radial light gradients blended with fog of war.
- [x] **Phase 6.2**: Dynamic Candle/Torch Flicker
  - High-frequency harmonic noise light radius modulation ($\pm 6-8\%$) for ambient interior and dungeon atmosphere.
- [x] **Phase 6.3**: Weather Layer Interactivity
  - Rain puddle splashes, expanding ripple rings, snow accumulation on tree crowns and stone walls, and thunderstorm lightning flashes.

---

# ⚔️ Architectural Roadmap: Modular Faction Sub-Engine & Ruined Cities Skirmishes

## 📌 Feature Overview
A dedicated, fully decoupled global Faction Sub-Engine paired with dynamic Ruined City environments. Ruined cities are contested zones primarily controlled by rival factions (e.g. Bloodfang Orc Clans and Shadow Dagger Bandits) who hate each other as much as the player. When their lines of sight cross, they engage in real-time tactical skirmishes that the player can ambush, intervene in, or sneak past.

---

### 🏛️ Phase 1: Modular Faction Sub-Engine & Hostility Matrix (`src/factions/`)
- [x] **Phase 1.1**: Faction Domain Types & Contracts (`src/factions/types.ts`)
  - Define `FactionId`, `FactionDisposition` ($-100$ to $+100$), `FactionAlignment`, `FactionPerk`, and `FactionStanding`.
- [x] **Phase 1.2**: Data-Driven Faction Registry (`src/data/factions.json`)
  - Master catalog defining `orc_clan`, `bandit_syndicate`, `town_guard`, `undead_legion`, and `merchant_guild` with rivalries, banners, and default dispositions.
- [x] **Phase 1.3**: Relation Matrix Engine (`src/factions/FactionMatrix.ts`)
  - $O(1)$ lookup for faction attitudes (`Hostile`, `Feuding`, `Neutral`, `Allied`) and dynamic rivalries.
- [x] **Phase 1.4**: Entity Tagging & Backward Compatibility
  - Extend `Enemy` and `NPC` types with `factionId?: string` and `factionRank?: 'grunt' | 'scout' | 'elite' | 'leader'`.

---

### 🎖️ Phase 2: Player Faction Standing & Dynamic Reputation Engine
- [x] **Phase 2.1**: Player Standing Tracker (`src/factions/useFactionReputation.ts`)
  - Track per-faction reputation scores in `gameState.playerStats.factionReputation`.
  - Reputation adjustments based on kills, quest turn-ins, and dialogue choices.
- [x] **Phase 2.2**: Faction Standing Tiers & Privileges
  - `Hated (<= -50)`: Hostile on sight.
  - `Neutral (-49 to +20)`: Tolerated; no aggression unless provoked or trespassing.
  - `Friendly / Revered (>= +50)`: Unlocks faction black markets, exclusive forging recipes, safehouses, and NPC allies.

---

### 🏚️ Phase 3: Procedural Ruined City Generation Sub-Engine (`src/world/ruinedCity/`)
- [x] **Phase 3.1**: Ruined Architecture & Terrain Generators (`ruinedCityGenerator.ts`)
  - Collapsed stone masonry, crumbling watchtowers, rubble choke points, shattered plaza centerpieces, and overgrown vine-covered ruins.
- [x] **Phase 3.2**: Divided Turf & Camp Placement
  - **North-East Sector**: Orc Warcamp (bone totems, roasting spits, crude palisades, war brutes).
  - **South-West Sector**: Bandit Hideout (smuggler crates, tripwire traps, archery perches, loot stashes).
  - **Central Plaza**: Contested No-Man's Land (battle scars, charred earth, destroyed siege wagons).
- [x] **Phase 3.3**: Ruined City POIs & Vaults
  - Collapsed Vaults with high-tier locked chests (Lockpicking minigame integration) and forgotten shrines.

---

### 🧠 Phase 4: Multi-Target Autonomous AI & Line-of-Sight Threat Selector
- [x] **Phase 4.1**: Multi-Target Vision Scanning (`src/hooks/ai/useHostileAI.ts`)
  - Scan 6–8 tile vision radius for all potential targets (Player, Companions, Town Guards, and Rival Factions).
- [x] **Phase 4.2**: Priority & Threat Weighting
  - Prioritize: 1. Retaliation (who attacked me last), 2. Immediate melee threats (proximity), 3. Low-HP wounded rivals (finishing blows).
- [x] **Phase 4.3**: Inter-Monster Combat Resolution & Floaters
  - Resolve full combat equations (armor, criticals, status effects) between AI entities.
  - Render floating combat text and ambient battle logs (*"Orc Berserker cleaved Bandit Thug for 14 Dmg!"*).

---

### ⚔️ Phase 5: Dynamic Turf Wars, Ambush Encounters & Territory Rewards
- [ ] **Phase 5.1**: Emergent Skirmish State Generator
  - Ambient battle scenes: Active Plazas Melee, High-Ground Crossbow Ambushes, and Base Sieges.
- [ ] **Phase 5.2**: Morale Break & Retreat AI
  - Slaying an Orc Warlord or Bandit Leader triggers morale panic in surviving grunts.
- [ ] **Phase 5.3**: Faction Spoils & Scavenging Loops
  - Faction gear drops (Orc Cleavers, Spiked Shields, Bandit Leather, Smuggler Satchels).
  - Boss chests unlocked upon clearing faction camps.

---

### 🛡️ Phase 7: Merchant Caravan Escort & Tactical Skirmish Sub-Engine (COMPLETED)
- [x] **Phase 7.1**: Dedicated 24×18 Tactical Skirmish Battlefield Generator (`src/world/caravanSkirmishGen.ts`)
  - Generates realistic road battle with covered merchant wagon (`🛒`), guard campfire, 2 allied defenders, and bandit/raider ambushers.
- [x] **Phase 7.2**: Lossless Overworld State Preservation (`src/types/game.ts`, `src/components/ModalRouter.tsx`)
  - Captures `SavedOverworldSkirmishState` snapshot prior to battle; tactical victory or retreat restores the overworld chunk without desynchronization.
- [x] **Phase 7.3**: Caravan Travel Completion & Dynamic Rewards (`src/hooks/useCaravanTravel.ts`)
  - Destination arrival calculates rewards based on wagon hull integrity, awarding bonus elemental catalysts for pristine escort ($\ge 85\%$).

---

### 🎨 Phase 8: Dual Instinct Classic Tileset System & 16×16 Grid Expansion (COMPLETED)
- [x] **Phase 8.1**: Dual Sourcing Architecture (`classic_png` vs `classic_code`)
  - Support pre-rendered static `.png` mockups and procedural in-memory canvas code with runtime hot-swapping in Tileset Studio (`F1`).
- [x] **Phase 8.2**: Synchronized 16×16 Grid Coordinate Mapping (`TilesetAtlasManager.ts`)
  - Unified coordinate alignment for foliage, doors, stairs, chests, shrines, crossroads markers, traps, and hazard pools.
- [x] **Phase 8.3**: Automated Script Synthesis & Test Verification
  - Automated headless PNG generation via `scripts/generateMockupPngs.cjs` and complete suite verification in `src/tests/tilesetSourceSelection.test.ts`.

---

# ⚡ Comprehensive Performance Optimization Plan

## 🎯 Architecture Objective
Eliminate rendering bottlenecks, GC allocation spikes, redundant per-frame recalculations, and $O(N^2)$ entity search loops across the entire game engine. Deliver rock-solid 60 FPS performance on both desktop and mobile devices with sub-5ms turn resolution and zero memory leaks.

```
                   ┌─────────────────────────────────────────────────────────┐
                   │       COMPREHENSIVE PERFORMANCE OPTIMIZATION MAP        │
                   └─────────────────────────────────────────────────────────┘
                                                │
       ┌────────────────────────┬───────────────┴───────┬────────────────────────┐
       ▼                        ▼                       ▼                        ▼
 Phase 1: Spatial Grid   Phase 2: Object Pool    Phase 3: Render Loop    Phase 4: WebAudio Nodes  Phase 5: State & Memory
  • O(1) Spatial Hash     • VFX Ring Buffers      • Light Cache           • Voice Limiter          • Chunk Eviction Window
  • Zero-Alloc FOV Ray    • Combat Floater Pool   • Frustum Culling       • Shared Filter Nodes    • Log Bounding (200 max)
  • Matrix Recycling      • Ground Decal Cap      • Integer Blitting      • SFX Descheduling       • GC Pauses Minimized
```

---

## 📋 Comprehensive Optimization Phases

### 📍 Phase 1: Spatial Partitioning, Fast O(1) Entity Grid & FOV Memory Optimization (COMPLETED)
- [x] **Phase 1.1**: 2D Spatial Hash Index for Fast O(1) Entity & Trap Lookups (`src/utils/spatial/spatialEntityGrid.ts`)
  - Implement bit-packed `(y << 16) | (x & 0xFFFF)` hash grid supporting $O(1)$ coordinate queries.
  - Provide `getAt(x, y)`, `getNearby(x, y, radius)`, `insert(entity)`, `remove(entity)`, and `fromEnemies(enemies)` helpers.
  - Accelerate player step collisions, melee target selection, and spell splash targeting from $O(N)$ linear scans to $O(1)$.
- [x] **Phase 1.2**: High-Performance Zero-Allocation Raycasting & Fast Bresenham Iterator (`src/utils/ai.ts`)
  - Implement `traceLine(x0, y0, x1, y1, callback)` to eliminate intermediate `{x, y}[]` coordinate array allocations in hot vision paths.
  - Update `hasLineOfSight` to use `traceLine` directly with zero heap allocations.
- [x] **Phase 1.3**: FOV Matrix Recycling & GC Pause Elimination
  - Provide an FOV double-buffer / matrix pool in `src/utils/ai.ts` reusing boolean arrays across consecutive turns.
  - Eliminate the repeated generation of 25+ transient subarray objects on every player step.
- [x] **Phase 1.4**: Integration into Step Resolution, Collision, Spellcasting & AI Target Scanning
  - Wire `SpatialEntityGrid` into `useStepResolver.ts`, `usePlayerTurnMovement.ts`, `useHostileAI.ts`, and `useSpellcasting.ts`.
  - Dramatically reduce AI hostile scan overhead in crowded multi-entity encounters.
- [x] **Phase 1.5**: Automated Verification & Performance Benchmarking Unit Tests (`src/tests/performanceSpatialFOV.test.ts`)
  - Verify $O(1)$ entity retrieval accuracy against baseline linear scans.
  - Verify FOV vision calculation bit-for-bit parity with previous implementation.

---

### ♻️ Phase 2: High-Speed Particle, Projectile & Combat Floater Object Pools (COMPLETED)
- [x] **Phase 2.1**: Reusable Circular Ring-Buffer Object Pool for VFX (`src/canvas/particlePool.ts`)
  - Pre-allocated fixed pools for combat particles, spark emitters, and dust trails to eliminate transient object creation during combat.
- [x] **Phase 2.2**: Zero-Allocation Floating Combat Text Engine
  - Converted floating damage/healing numbers to a fixed-capacity ring buffer with recycling and $O(1)$ swap-and-pop deallocation.
- [x] **Phase 2.3**: Ground Decal & Combat Splatter Bounding
  - Enforced FIFO capacity limits (max 64 decals per chunk) on blood splatters, scorched earth, and frost rime to prevent memory bloat during deep dungeon runs.

---

### 💡 Phase 3: Render Loop, Lighting Shader & Dirty Viewport Optimization (COMPLETED)
- [x] **Phase 3.1**: Radial Light Gradient Cookie Stamp Engine & Darkness Canvas Reuse (`src/canvas/lightingEngine.ts`)
  - Reused persistent offscreen canvas for the ambient darkness mask, completely eliminating `document.createElement('canvas')` DOM allocations on every frame.
  - Pre-rendered 128x128 radial gradient cookie stamps for light cutouts and additive halos (lantern, campfire, magic, lava), replacing 40+ dynamic `createRadialGradient` calls and vector arc fills per frame with hardware-accelerated `drawImage` blits.
  - Implemented pre-allocated 64-slot `lightsPool` in `LightingEngine` to eliminate point light object instantiation in discovery loops.
- [x] **Phase 3.2**: Viewport Frustum Culling & Discovery Metric Throttling (`src/canvas/chunkBackgroundCache.ts`, `src/canvas/entityLayerRenderer.ts`)
  - Memoized discovery counts in `chunkBackgroundCache.ts` against player grid coordinates and turn counters, eliminating 6,400 tile array scans per frame during idle/render ticks.
  - Throttled entity interpolation `cleanupStale` in `entityLayerRenderer.ts` to execute every 120 frames (~2s), removing 60 FPS `Set<string>` and template string allocations.
- [x] **Phase 3.3**: DOM Style Recalculation Guard & Integer Coordinate Blitting (`src/components/GameCanvas.tsx`)
  - Guarded `--cam-x` and `--cam-y` CSS property mutations to fire strictly when camera coordinates shift, preventing continuous browser style invalidation.
  - Enforced integer pixel snapping for camera translations and light stamps to avoid sub-pixel antialiasing blur and GPU raster overhead.

---

### 🔊 Phase 4: WebAudio Node Recycling & Synthesizer Concurrency Limiter (COMPLETED)
- [x] **Phase 4.1**: WebAudio Voice Allocation Manager with Concurrency Throttling (`src/utils/audio/voiceManager.ts`)
  - Enforced a strict maximum concurrency cap (max 8 active voices) preventing WebAudio thread dropouts and CPU spikes during intense combat or storm turns.
  - Implemented 4-tier sound priority classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with dynamic priority theft / voice stealing (e.g. boss roars, critical strikes, and player defeats steal voices from low-priority footsteps or clicks).
  - Smooth anti-pop gain ramp-down (15ms release) and automatic cleanup of stopped oscillators/sources upon voice theft or expiration.
- [x] **Phase 4.2**: Shared Node Graph Panning & Filter Reuse (`src/utils/audio/voiceManager.ts`, `src/utils/audio/soundCatalog.ts`, `src/utils/audio/synthEngine.ts`)
  - Created 8 pre-allocated, persistent voice channel node graphs (`filterNode -> gainNode -> pannerNode -> sfxGainNode`), completely eliminating per-sound dynamic allocation of `GainNode`, `BiquadFilterNode`, and `StereoPannerNode`.
  - Transparent interceptors for audio scheduled source nodes ensuring immediate, leak-free disposal upon voice termination.
- [x] **Phase 4.3**: Automated Verification Unit Tests (`src/tests/webaudioVoiceRecyclingAndLimiter.test.ts`)
  - Unit tests verifying the 8-voice concurrency cap, sound priority classifications, priority theft, equal-priority expiration stealing, node recycling, and telemetry metrics.
  - All 14 dedicated tests and 57 total test suites (351 tests) passing cleanly.

---

### 🗄️ Phase 5: State Slicing, Chunk Memory Bounding & Long-Session Stabilization (COMPLETED)
- [x] **Phase 5.1**: LRU Active Overworld Chunk Eviction Window & RLE Compression (`src/utils/overworld/chunkMemoryManager.ts`)
  - Enforced an active in-memory window of the 25 nearest chunks around the player; distant sectors have heavy 2D matrices (`map`, `discovered`, `visible`, `secondFloorMap`) compressed using lossless Run-Length Encoding (RLE), reducing chunk memory footprint by >95%.
  - Transparent `ensureChunkDecompressed` and `getChunkMapGrid` utilities allowing seamless access during chunk transitions, fast-travel caravan journeys, and cartography map rendering.
  - Automatically evicts distant uncompressed chunks beyond 60-chunk radius during massive exploration sessions.
- [x] **Phase 5.2**: Game Log Memory Bounding & FIFO Truncation (`src/utils/logBuffer.ts`)
  - Centralized `appendBoundedLogs` utility enforcing a strict 200-message FIFO capacity cap on `gameState.logs`.
  - Integrated into all log dispatch points in `App.tsx`, `useEnemyAI.ts`, `useChunkTransition.ts`, and `useCaravanTravel.ts`, preventing unbounded React array growth during long sessions.
  - Bounded historical session logs (500 max) and diagnostic state snapshots (50 max) in `useWorldEventHandlers.ts` to stabilize long gameplay sessions.
- [x] **Phase 5.3**: Automated Verification Unit Tests (`src/tests/chunkMemoryAndLogBounding.test.ts`)
  - Unit tests verifying lossless RLE compression/decompression for 80x80 `TileType` and boolean discovery grids.
  - Verified 25-chunk active uncompressed window and distant sector compression.
  - Verified 200-item FIFO pruning for single and batched log updates.

---

# 🌿 Next-Gen Roguelike Engine Evolution Roadmap

## 🎯 Architecture Objective
Advance the core roguelike engine into a deeply systemic, emergent, living world. Build layered simulations for **Living Ecosystems & Autonomous NPC Routines**, **Dynamic Cellular Elemental Propagation**, and **Multi-Part Anatomical Boss Combat** while maintaining strict 60 FPS performance, modular decoupling, and test coverage.

---

## 📅 Roadmap Schedule & Priority Matrix

| Pillar & Phase | Focus Area | Complexity | Recommended Start Order | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Pillar 1: Living Ecosystem & Autonomous AI** | **Simulated Ecology, Predator-Prey, Morale, Surrenders, Routines, Turf Wars** | **Medium-High** | **Completed** | **Completed (100% Green)** |
| **Pillar 2: Elemental Propagation** | **Cellular Fire Spread, Water Freezing, Electricity, Vapor, Gas Explosions** | **Medium** | **Completed** | **Completed (100% Green)** |
| **Pillar 3: Anatomical Combat** | Multi-Part Bosses, Severable Limbs, Wall Knockbacks | High | **READY TO START NOW** | **Next in Queue** |
| **Pillar 4: Spatial Acoustics & VFX** | Muffled Behind-Door Audio, Dynamic Water Caustics, Bloom | Low-Medium | Parallel / Polish | Planned |
| **Pillar 5: Runtime Mod Engine** | JSON Mod Packs, Custom Classes, Spell Scripting | Medium | Future | Planned |

> **🚀 CURRENT HORIZON: Pillar 3: Anatomical Combat & Multi-Part Bosses**
> **WE ARE READY TO START PILLAR 3!**
> Prerequisites are satisfied:
> 1. Elemental fields and reactions (fire, ice, shock, steam, poison gas) are fully working and verified.
> 2. Living ecosystem and autonomous multi-target AI are active.
> 3. Spatial hash grid and projectile/VFX pools are optimized for multi-part entities.

---

## 📋 Phased Implementation Plan: Living Ecosystem & NPC Autonomous Routines

### 🐺 Phase E1: Fauna & Wildlife Ecology Layer (Predator-Prey Simulation)
- [x] **Phase E1.1**: Animal Diet & Ecology Tagging in Entity Catalogs (`src/data/enemies.json`, `src/types/entities.ts`)
  - Added `diet: 'herbivore' | 'carnivore' | 'omnivore'` and `packId?: string` to fauna (deer, rabbits, wild boars, wolves, bears).
  - Added `hungerLevel?: number` (0 to 100) and `preyTargetTypes?: string[]` to carnivores.
- [x] **Phase E1.2**: Autonomous Fauna Foraging & Grazing Routines (`src/hooks/ai/useFaunaAI.ts`)
  - Herbivores graze near `TileType.Grass`, `TileType.Bush`, or water shores when undisturbed.
  - Flee instincts trigger when detecting carnivores or humanoid actors within 5 tiles.
- [x] **Phase E1.3**: Predator Stalking & Hunting Behavior
  - Wolves, panthers, and bears identify nearest prey using the `SpatialEntityGrid`.
  - Carnivores track and stalk prey, consuming food upon defeat (restoring HP and reducing aggression toward the player if well-fed).

---

### 🏳️ Phase E2: Morale, Fear & Surrender Mechanics
- [x] **Phase E2.1**: Pack Leader & Warlord Linkage
  - Support `packLeaderId?: string` and `packId?: string` linking grunts (e.g., Goblin Scavengers, Wolf Pups, Bandit Thugs) to their leader.
  - Slaying the pack leader/alpha instantly triggers a Morale Check on all linked subordinates.
- [x] **Phase E2.2**: Panic & Scatter Behavior
  - Failed morale checks inflict `isPanicked = true`, causing enemies to drop defensive stances and flee using `getNextStepAwayFrom`, dropping panic coins/scrap.
- [x] **Phase E2.3**: Intelligent Surrender & Parley Interaction
  - Wounded humanoids/bandits (< 20% HP with no nearby allies) surrender (`isSurrendered = true`, displays `🏳️ YIELD` badge).
  - Player can interact (`G` key): Accept surrender (receive gold bribe and crafting materials, enemy flees peacefully) or execute (+100% critical strike and execution flavor log).

---

### ⏰ Phase E3: Dynamic NPC Schedules & Weather Reactions
- [x] **Phase E3.1**: Time-of-Day Schedule State Machine (`src/hooks/ai/useCivilianAI.ts`)
  - Townspeople, shopkeepers, and guards follow daily routines:
    - Dawn: Head to market stalls / fields / barracks.
    - Dusk: Gather at the tavern for food and ale.
    - Night: Return to beds/shelters to sleep.
- [x] **Phase E3.2**: Environmental Reactions to Severe Weather
  - Thunderstorms and blizzards cause non-combatants and stray animals to seek shelter under roofed buildings and tavern canopies.
- [x] **Phase E3.3**: Dynamic Ambient NPC Dialogues & Barks
  - Context-aware speech bubbles triggered by local occurrences (approaching storm, recent monster attack on the gates, player's faction standing).

---

### ⚔️ Phase E4: Turf Wars & Autonomous Faction Patrols
- [x] **Phase E4.1**: Active Sector Patrol Nodes
  - Orc warbands and Bandit patrols follow roving waypoints across the Ruined City and Wilderness borders.
- [x] **Phase E4.2**: Autonomous Inter-Faction Skirmishes
  - Clashing patrol paths trigger skirmishes independent of player presence, leaving battlefield debris and wounded survivors to discover.

---

### 🧪 Phase E5: Ecosystem Telemetry & Test Verification Suite
- [x] **Phase E5.1**: Automated Ecological Simulation Tests (`src/tests/livingEcosystemSim.test.ts`)
  - Test wolf predator hunts resolving without player intervention.
  - Test pack leader defeat triggering subordinate panic and retreat.
  - Test bandit surrender trigger and interaction payout.
- [x] **Phase E5.2**: Performance & Entity Cap Benchmark
  - Verify that 40+ simulated fauna and faction patrols maintain 60 FPS and $< 5\text{ms}$ AI turn latency using the $O(1)$ spatial grid.

---

## 📋 Phased Implementation Plan: Pillar 2 — Elemental Propagation Sub-Engine (COMPLETED)

### 🔥 Phase P2.1: Elemental Fields & Grid Cellular Automata (`src/types/elemental.ts`, `src/utils/elemental/elementalEngine.ts`)
- [x] **Phase P2.1.1**: Domain Types for Elemental Ground Effects (`src/types/elemental.ts`)
  - Defined `ElementalType` (`'fire' | 'ice' | 'shock' | 'steam' | 'poison_gas'`), `ElementalTile`, `ElementalIntensity`, and propagation contracts.
- [x] **Phase P2.1.2**: Cellular Fire Spread & Ash Decomposition (`elementalEngine.ts`)
  - Fire fields propagate along flammable terrain (grass, bushes, trees, wooden doors, campsite furniture) based on humidity and turn ticks.
  - Fully consumed vegetation decomposes into permanent walkable `TileType.Ash` tiles.
- [x] **Phase P2.1.3**: Cryomancy & Water Freezing / Melting
  - Cold spells/frost fields freeze water bodies into solid walkable `TileType.Ice` sheets.
  - Fire/heat sources melt ice back into water, while boiling produces obscuring steam clouds.

### ⚡ Phase P2.2: Reactive Conductors & Deflagration Chain Reactions
- [x] **Phase P2.2.1**: Water Shock Conduction
  - Lightning and shock waves propagate across contiguous connected water bodies in a single turn.
  - Deals amplified shock damage and stun checks to entities standing in water.
- [x] **Phase P2.2.2**: Toxic Gas Deflagration Explosions
  - Fire contact with flammable poison gas pockets triggers violent deflagration explosions (3×3 AOE, fire damage, wall soot, screen-shake).
- [x] **Phase P2.2.3**: Tactical Steam Clouds & Line-of-Sight Obscuration (`src/utils/ai.ts`)
  - Dense steam clouds block Bresenham raycasting in `hasLineOfSight`, enabling tactical escapes and broken enemy targeting.

### 🎨 Phase P2.3: Procedural Canvas VFX & World Integration
- [x] **Phase P2.3.1**: Canvas Procedural Elemental VFX Renderer (`src/canvas/elementalVfxRenderer.ts`)
  - Multi-layered procedural VFX for fire flickers & embers, ice frost glints, arcing electric sparks, billowing steam plumes, and toxic gas swirls.
- [x] **Phase P2.3.2**: Spellcasting & Turn Environment Integration
  - Wired into `aiTurnEnvironment.ts` for environmental ticks and `useCombatAndSpells.ts` for spellcast terrain impacts.
- [x] **Phase P2.3.3**: Automated Test Suite (`src/tests/elementalPropagation.test.ts`)
  - 7 comprehensive unit and integration tests verifying flammability, fire spread, ash creation, water freeze/melt, shock conduction, gas deflagration, and steam sight blockage.

---

## 🎧 Phased Implementation Plan: Pillar 4 — Spatial Acoustics & VFX (COMPLETED)

### 🔊 Phase P4.1: Raytraced Acoustic Occlusion & Behind-Door Muffling (`src/utils/audio/acousticOcclusion.ts`)
- [x] **Phase P4.1.1**: Bresenham Acoustic Obstacle Raycasting
  - Raycasts sound propagation lines between sound emitters and the player listener.
  - Detects solid stone/mountain walls and closed wooden/iron doors along the direct transmission path.
  - Models realistic lowpass frequency muffling (clamping cutoff down to 360-750 Hz behind doors/walls) and material transmission absorption (volume down to 38-70%).
  - Adds low-frequency acoustic cavity boost (`roomResonanceQ` up to 2.4).
- [x] **Phase P4.1.2**: Global Acoustic Listener Context & Engine Integration
  - `setAcousticListenerContext` synchronizes player coordinates and active level map in `GameCanvas.tsx`.
  - Integrated with `calculateSpatialParameters` in `spatialAudio.ts` and `playSound` in `soundCatalog.ts` for automated behind-door muffling without callsite refactoring.

### 🌊 Phase P4.2: Dynamic Water Caustics & Refraction Shimmer (`src/canvas/waterCausticsRenderer.ts`)
- [x] **Phase P4.2.1**: Multi-Scale Dynamic Caustic Light Webs
  - Intersecting dual-frequency sine wave caustics creating animated light refraction webs across water surfaces.
  - Biome-specific caustic palettes: crystal cyan for oceans/rivers, ice glints for tundra, murky bioluminescent swirls for swamps, and golden reflections for desert oases.
  - Integrated into `tileMapRenderer.ts` alongside water tile shimmer.
- [x] **Phase P4.2.2**: Submerged Object Refractive Projection
  - `renderSubmergedObjectCaustics` projects additive light refraction ribbons across players, monsters, and corpses wading through water or swamp tiles.

### 🌟 Phase P4.3: Luminous HDR Bloom & Atmospheric Vignette (`src/canvas/bloomEngine.ts`, `src/canvas/vignetteRenderer.ts`)
- [x] **Phase P4.3.1**: Luminous Canvas HDR Bloom Engine
  - Additive blending pass (`lighter`) with pre-cached radial gradient bloom stamps in memory.
  - Emits multi-frequency soft luminous halos for lanterns, torches, fireplaces, runic shrines, magic missiles, and active elemental fields (fire, shock, poison gas, frost).
- [x] **Phase P4.3.2**: Context-Aware Atmospheric Vignette Renderer
  - Dynamic radial gradient depth framing that deepens in subterranean dungeons according to dungeon depth ($0.48 \to 0.72$).
  - Adapts to overworld time of day (daylight framing vs. midnight darkness) and special atmospheric states (crimson glow during Blood Moons, frosted borders during blizzards).
- [x] **Phase P4.3.3**: Automated Test Suite (`src/tests/spatialAcousticsAndVfx.test.ts`)
  - 9 comprehensive unit and integration tests verifying acoustic raytracing through open corridors, closed door muffling, solid wall dampening, listener context integration, water caustics, submerged projection, bloom emitters, and contextual vignette states (100% passing).

---

## 📋 Phased Implementation Plan: Pillar 3 — Anatomical Combat & Multi-Part Bosses (NEXT IN QUEUE)

### 🐉 Phase P3.1: Multi-Part Anatomical Boss Archetypes & Data Contracts (`src/types/entities.ts`)
- [ ] **Phase P3.1.1**: Anatomical Body Part Data Model
  - Extend bosses (e.g. Surtur the Magma Arch-demon, Hydra, Bone Dragon) with targetable sub-parts:
    - *Head / Horns*: Controls breath attacks & spellcasting; high defense, critical vulnerability.
    - *Left / Right Claws / Wings*: Controls cleaving sweeps & mobility range; severable.
    - *Tail / Stinger*: Controls rear sweeping stuns & venom attacks; severable.
    - *Heart / Core*: Heavily armored; exposed only when stagger thresholds are breached.
- [ ] **Phase P3.1.2**: Boss Part Hit Point Pools & Damage Redirection
  - Attacks can be aimed specifically at exposed parts, or default to central torso.
  - Each part possesses independent HP pool, armor value, and elemental vulnerabilities.

### ⚔️ Phase P3.2: Dismemberment, Severable Limbs & Phase Transitions
- [ ] **Phase P3.2.1**: Severing Mechanics & Combat Disable States
  - Severing a wing reduces boss movement speed and disables flying dive-bombs.
  - Severing a weapon arm or claw permanently disables cleave attacks and drops high-tier crafting materials (e.g., *Dragon Claw Ore*, *Hydra Tendon*).
  - Severing the tail eliminates rear retaliatory stuns.
- [ ] **Phase P3.2.2**: Berserk Enrage & Phase Shifts
  - Dismembering multiple parts pushes the boss into desperate, volatile enrage states (faster attack speed, erratic movement, area-denial fire or poison).

### 💥 Phase P3.3: Kinetic Wall Knockbacks & Environmental Splatters
- [ ] **Phase P3.3.1**: Physics-Based Wall Knockback Damage
  - Sunder blunt strikes and boss kinetic slams knock target entities backward $1-3$ tiles.
  - Colliding with walls, trees, or solid obstacles inflicts bonus kinetic impact damage and applies a 1-turn Daze/Stun.
- [ ] **Phase P3.3.2**: Structural Destruction
  - High-magnitude boss attacks shatter fragile furniture, crack wooden doors, and splinter fences.

---

## 🌾 Completed Milestone: Wilderness Foraging, Mineral Belts & Harvest Durability (v8.6.0)
- [x] **Balanced Overworld Mineral Belts (`src/world/organic/vegetationClusterGen.ts`)**:
  - Continuous multi-octave noise mineral belts generating clustered Copper and Iron veins.
  - 60/40 Copper vs. Iron distribution for progression from early tinker smithing to durable armaments.
- [x] **Wilderness Foraging Flora (`src/world/organic/vegetationClusterGen.ts`)**:
  - Consistent generation of 15-35 foraging berry bushes per chunk across all biomes (Sweet Berries, Frostblooms, Nightshade, Sun Aloe, Charred Shrubs).
- [x] **Subterranean Mining in Dungeons (`src/world/dungeon/dungeonRooms.ts`, `src/world/dungeon/dungeonGenerator.ts`)**:
  - `spawnSubterraneanOreVeins` placing Copper and Iron veins inside dungeon room wall alcoves.
- [x] **Harvest State & Canvas Cache Synchronization (`src/utils/harvestEngine.ts`, `src/hooks/app/useGKeyInteraction.ts`)**:
  - Harvested veins and bushes revert cleanly to walkable Grass in overworld and Floor in dungeons.
  - Tree stumps left after chopping are walkable and clearable via 'G' key for scrap kindling.
  - Canvas cache invalidation immediately updates rendering without visual ghosting.

---

## 🚀 Completed Milestone: Viewport Ergonomics & GitHub Pages CI/CD Deployment (v8.6.1)
- [x] **Viewport Vertical Scrolling Restoration (`index.html`, `GameMainViewport.tsx`)**:
  - Replaced restrictive `overflow-hidden` with `overflow-y-auto min-h-screen` on body and viewport container.
  - Adapted canvas container to responsive height tiers (`h-[640px] md:h-[720px] lg:h-[780px] xl:h-[840px] 2xl:h-[880px] min-h-[500px]`), restoring natural scrolling to lower controls, mobile HUDs, logs, and craft stations.
- [x] **GitHub Launch & GitHub Pages CI/CD Pipeline (`.github/workflows/deploy.yml`)**:
  - Automated deployment workflow running schema validations, import audits, 402 Vitest tests, and production bundling.
  - Configured relative asset base (`base: './'`) in `vite.config.ts`, `public/manifest.json`, and `index.html`.
  - Added SPA route fallback (`public/404.html`), Jekyll bypass (`public/.nojekyll`), and open-source license (`LICENSE`).
  - Added `npm run build:pages` and compound `npm run audit` commands to `package.json`.

---

## 🏗️ Codebase Modularization & Developer Extensibility Roadmap (v8.7.0+)

### 🎯 Primary Architectural Objective
Eliminate remaining monolithic code files (>800-1,600 lines), establish pluggable strategy patterns, and decouple canvas drawing from UI event logic. This enables developers and modders to easily implement new enemy tactics, custom map overlays, game items, UI components, and debug commands without touching complex core engine files.

---

### 📦 Phase M1: `App.tsx` Coordinator De-Monolithization
*Current size: ~1,191 lines. Target size: ~350-400 lines.*
- [x] **Phase M1.1: Extract `useAppModalState.ts`** (`src/hooks/app/useAppModalState.ts`)
  - Successfully extracted all 24 modal, overlay, dialog, and targeted scroll states into a modular sub-hook.
  - Simplified `ModalRouter` props in `App.tsx` using `{...modalState}` spread.
  - Exported and integrated cleanly through `src/hooks/app/index.ts`.
- [x] **Phase M1.2: Extract `useAppTurnCoordinator.ts`** (`src/hooks/app/useAppTurnCoordinator.ts`)
  - Successfully decoupled turn step sequencing, player movement dispatching, game loop difficulty ticks, enemy AI turns, tactical brace defense, automated autoplay steps, and tile targeting from layout rendering.
  - Reduced `App.tsx` by ~150 lines and removed redundant turn coordination boilerplate.
  - **Dev Outcome**: Isolates turn timing and autoplay hooks from UI rendering.

---

### 🗺️ Phase M2: World Map Architecture Modularization (`WorldMapCanvas.tsx`)
*Current size: ~1,552 lines. Target size: ~350 lines per module.*
- [x] **Phase M2.1: Extract `useWorldMapViewport.ts`** (`src/components/worldmap/useWorldMapViewport.ts`)
  - Isolated zoom clamping (`0.4x - 3.5x`), pan offsets, mouse/touch drag velocity, inertia physics, and screen-to-world coordinate projections.
- [x] **Phase M2.2: Extract `worldMapTerrainRenderer.ts`** (`src/components/worldmap/worldMapTerrainRenderer.ts`)
  - Moved pure canvas drawing passes (chunk tile blitting from LRU cache, biomes, rivers, roads, fog of war, and grid outlines) into dedicated pure functions.
- [x] **Phase M2.3: Extract `WorldMapPinsOverlay.tsx` & `worldMapPinsRenderer.ts`** (`src/components/worldmap/WorldMapPinsOverlay.tsx`)
  - Rendered towns, castles, dungeons, quest POIs, custom waystones, leyline auras, and hover tooltips as a lightweight, interactive overlay layer with extracted `WorldMapControls.tsx`.
  - **Dev Outcome**: Modders and developers can design new POI markers or tweak terrain visuals without touching drag/zoom physics.

---

### ⚔️ Phase M3: Hostile AI Tactics & Strategy Pattern (`useHostileAI.ts`) (Completed)
- [x] **Phase M3.1: Define AI Behavior Strategy Interface** (`src/hooks/ai/tactics/types.ts`)
  - Created standard contract: `executeAITactic(context: AITacticContext): AITacticResult | null`, `HostileAIParams`, `HostileActionResult`, and event dispatch helpers.
- [x] **Phase M3.2: Extract Modular Tactic Strategies** (`src/hooks/ai/tactics/`)
  - `aiKitingTactics.ts`: Ranged archers/mages maintaining standoff distance and dynamic firing corridors.
  - `aiFlankingTactics.ts`: Pack hunters (wolves, bandits) coordinating surrounding positions.
  - `aiTelegraphTactics.ts`: Heavy brutes charging up high-impact telegraphed slams.
  - `aiSupportTactics.ts`: Dedicated healer/buffer spells for friendly wounded and elite allies.
  - `aiDefenderCombatTactics.ts`: Caravan wagon, companion followers, town guard, and rival faction targeting.
  - `aiPlayerAttackTactics.ts`: Direct player attack resolution, dodge checks, armor penetration, equipment durability loss, and scars.
  - `aiRetreatPatrolTactics.ts`: Wounded retreat to alert sleeping/patrolling allies and waypoint navigation.
  - `aiBossPhaseTactics.ts`: Multi-phase boss transformations, summons, and elite perception warnings.
  - **Dev Outcome**: Monster tactics are now cleanly decoupled into dedicated modular strategy files, reducing `useHostileAI.ts` from 1,224 lines to a concise master coordinator. Covered by 65 test suites and 409 passing tests.

---

### 🎒 Phase M4: Inventory & Equipment Component Decomposition (`BackpackSlotGrid.tsx`)
*Current size: Decoupled into modular components (~100-250 lines each).*
- [x] **Phase M4.1: Extract `InventoryFilterBar.tsx`** (`src/components/inventory/InventoryFilterBar.tsx`)
  - Sub-navigation tabs (Allies, Gear, Food, Mats), inventory item counter badges, and "Sort & Group" actions header with visual feedback.
- [x] **Phase M4.2: Extract `InventoryWeightBar.tsx`** (`src/components/inventory/InventoryWeightBar.tsx`)
  - Real-time carrying capacity limit gauge, color-coded capacity thresholds (teal, amber, rose pulse), and overburdened movement stagger rate warnings.
- [x] **Phase M4.3: Extract Modular Inventory Tab Sub-Views**
  - `AlliesRosterView.tsx`: Active party followers roster with archetype badges, level indicators, combat mode indicators, and companion equipment inspection triggers.
  - `GearInventoryGrid.tsx`: Equipment items display with rarity tier badges, durability bars, weights, scroll reading, 2-Handed and Dual-Wield equip triggers, and discard gump handlers.
  - `ProvisionsInventoryGrid.tsx`: Provisions and potion consumables display with healing/mana recovery metrics, direct eat/drink triggers, and discard handlers.
  - `MaterialsInventoryGrid.tsx`: Dual-column layout for crafting alloys/materials and elemental shards/catalysts with quantity counts and discard buttons.
- [x] **Phase M4.4: Streamline Master `BackpackSlotGrid.tsx`**
  - Refactored `BackpackSlotGrid.tsx` from 1,018 lines to ~190 lines as a clean coordinator composing the extracted modular subcomponents.
  - **Dev Outcome**: Developers can easily customize backpack tab views, weight gauges, or equipment slots in isolated, lightweight subcomponents. Covered by 65 test suites and 410 passing tests.
- [x] **Phase M4.5: Modular Trade & Commerce Sub-Engine Decomposition (`TradeModal.tsx`)**
  - Extracted modular commercial subcomponents into `/src/components/modals/trade/`: `TradeHeaderBar.tsx`, `CaravanRoutesWidget.tsx`, `BlacksmithRepairStation.tsx`, `ApothecaryStation.tsx`, `TavernServiceStation.tsx`, `TradeBuyStockGrid.tsx`, and `TradeSellStashGrid.tsx`.
  - Refactored master `TradeModal.tsx` from 943 lines to 166 lines.
  - **Dev Outcome**: Added dedicated test suite `tradeModularComponents.test.ts`. All 66 test suites (412 tests) passing 100% green.
- [x] **Phase M4.6: GitHub Pages CI/CD Resilient Lockfile Workflow (`.github/workflows/deploy.yml`)**
  - Generated dedicated root `package-lock.json` (65 KB).
  - Hardened GitHub Actions deploy workflow with adaptive fallback (`npm ci || npm install`) eliminating the "Dependencies lock file is not found" failure.
  - Set all asset paths to relative (`./og-image.png`) in `index.html`. Fully verified on production build.

---

### 🎨 Phase M5: Procedural Atlas Synthesis Decomposition (`MockupAtlasGenerator.ts`)
*Current size: ~1,616 lines. Target size: ~350-400 lines per theme generator.*
- [ ] **Phase M5.1: Create Modular Atlas Theme Generators** (`src/canvas/atlas/`)
  - `classicAtlasGenerator.ts`: Standard fantasy medieval pixel-art tiles and sprites.
  - `cyberAtlasGenerator.ts`: Sci-fi neon cyber-grid terrain and mechanical entities.
  - `forestAtlasGenerator.ts`: Lush verdant woodland tiles, flora, and beasts.
  - `infernalAtlasGenerator.ts`: Volcanic obsidian, lava pools, and demon sprites.
- [ ] **Phase M5.2: Streamline Master `MockupAtlasGenerator.ts`**
  - Act as a lightweight dispatcher delegating to the selected theme generator.
  - **Dev Outcome**: Adding a new visual theme (e.g. Desert, Celestial, Underworld) only requires adding a single isolated generator module.

---

### 💻 Phase M6: Declarative GM & Debug Command System (`gmCommands.ts`)
*Current size: ~1,430 lines. Target size: Schema-driven modular command registry.*
- [ ] **Phase M6.1: Command Registry Pattern** (`src/data/commands/`)
  - `teleportCommands.ts`: Teleport to chunks, biomes, dungeons, towns.
  - `spawnCommands.ts`: Spawn items, gold, bosses, enemies, NPCs.
  - `environmentCommands.ts`: Set weather, time of day, seasons, chaos score.
  - `characterCommands.ts`: God mode, level up, max stats, heal.
- [ ] **Phase M6.2: Auto-Generated Command Auto-Complete & Help**
  - Derive command descriptions, arguments, and suggestions directly from the registry.
  - **Dev Outcome**: Adding testing tools for any new game mechanic takes ~10 lines of declarative code.








