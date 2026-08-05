# Abyss Rogue: Historical Release Version Log

This document serves as the chronological history and version log of newly completed features, engine stability extensions, and architectural modifications.

---

### Game Roadmap & Upcoming Releases

## [v5.2.0] — Phase 29 & 30: Codebase Refactoring, Hook Modularization & QA Suite (August 5, 2026)
*Deconstructed large monolith files (App.tsx, GodPanelOverlay.tsx, overworld.ts, audio.ts) into clean, specialized domain hooks and modules (`useGameLoop`, `siegeUtils`, `GodSmoketestTab`, `overworldNpcSpawning`, `overworldPoiGenerator`, `soundPresets`), achieving 100% test coverage (19 passing test suites, 77 tests) and zero-regression compilation.*

- **Game Loop Hook Extraction (`src/hooks/useGameLoop.ts` & `src/utils/siegeUtils.ts`)**:
  - Extracted real-time difficulty escalation, watchtower siege ticking, and countdown timers out of `App.tsx` into `useGameLoop.ts`.
  - Moved siege combatant spawner logic into dedicated `siegeUtils.ts` module.
- **God Panel Modularization (`src/components/god/GodSmoketestTab.tsx`)**:
  - Separated the client-side virtual smoke test runner component out of `GodPanelOverlay.tsx` into `GodSmoketestTab.tsx`.
- **World Generation Utility Splitting (`src/world/overworldNpcSpawning.ts` & `src/world/overworldPoiGenerator.ts`)**:
  - Extracted NPC tile safety validator (`isTileSafeForNpc`) and coordinate locator (`findNearestSafeNpcTile`) into `overworldNpcSpawning.ts`.
  - Extracted point-of-interest generator wrappers into `overworldPoiGenerator.ts`.
- **Audio Synthesizer Preset Extraction (`src/audio/soundPresets.ts`)**:
  - Isolated sound synthesizer preset configuration tables into `soundPresets.ts`.
- **Quality Assurance & Test Suite Verification**:
  - Verified all 19 Vitest test suites and 77 unit/integration tests pass with 0 failures.
  - Validated clean linter (`tsc --noEmit`) and production applet build (`npm run build`).

## [v5.1.1] — Phase 28: Living Towns, Cities, Harbors & Reactive NPC Life (August 4, 2026)
*Implemented dynamic weather-reactive NPC dialogue and barks, harbor port towns with specialized nautical roles and trade goods, NPC daily schedules with shelter seeking during severe storms, tavern sitting and drinking behaviors, and settlement tier scaling (Hamlets to Citadel Capitals).*

- **Dynamic Weather & Time Reactive Dialogue System (`src/utils/npcDialogue.ts`)**:
  - Expanded NPC conversation system with weather-reactive, time-of-day-reactive, and biome-sensitive dialogue lines across all NPC roles.
  - Implemented regional rumor and gossip generator incorporating local weather conditions, town reputation, and harbor lore.
- **Harbor Towns, Ports & Nautical Population (`src/utils/overworld.ts` & `src/data/shops.json`)**:
  - Generated harbor coastal town layouts featuring docks, anchorages, cranes, harbor master huts, fish markets, and moored ships.
  - Introduced specialized nautical NPC roles: Dockworker, Harbor Master, Sailor, Fishmonger, and Ferried Navigator.
  - Added harbor trade goods: Fresh Catch, Salted Cod, Whale Oil, Nautical Charts, and Ship Pitch.
- **NPC Daily Schedules & Tavern Sitting/Drinking (`src/hooks/useEnemyAI.ts` & `src/data/townTemplates.json`)**:
  - Implemented NPC AI daily routines with outdoor work during the day, tavern leisure visits in the evening, and bed rest at night.
  - Added shelter seeking during blizzards, heavy rain, and sandstorms with weather barks.
  - Populated tavern interiors with bar counter tables, chairs, and stools; NPCs sit at tavern bars/tables and drink ale/mead with custom barks.
- **Settlement Scaling & Modular Catalog (`src/world/overworldStructures.ts` & `src/data/recipes.json`)**:
  - Scaled settlement tiers dynamically from Hamlets, Villages, and Port Towns to Citadel Capitals.
  - Extracted cooking and brewing recipe catalogs into modular `./recipes.json` data structure.

## [v5.1.0] — Phase 28: Pathfinding Optimization, NPC Routines & Companion Follower Verification (August 3, 2026)
*Optimized BFS pathfinding memory buffers with Uint8Array, expanded town NPC day/night routines & building bed sleep states, linked God Mode to unlimited carry capacity, and verified companion follower systems.*

- **Pathfinding & AI Spatial Optimization (`src/utils/ai.ts` & `src/hooks/useEnemyAI.ts`)**:
  - Replaced high-allocation nested 2D arrays in BFS pathfinding with a flat `Uint8Array` memory buffer for instant visited lookups.
  - Replaced array queue `.shift()` calls with pointer head increments and converted `otherEnemies` spatial collision scans into O(1) index sets.
  - Optimized NPC schedule movement loops in `useEnemyAI.ts` with cached spatial coordinate lookup sets.
- **NPC Routines & Building Beds (`src/hooks/useEnemyAI.ts`)**:
  - Structured town NPC schedules to navigate to building beds during nighttime (`20:00 - 07:00`) or inclement weather (rain/snow).
  - Applied sleeping status indicators (`😴`) when NPCs reach home beds, resuming work/shop routines upon sunrise.
- **Sovereign God Mode Unlimited Carry Weight (`src/utils/itemWeight.ts` & `src/components/GodPanelOverlay.tsx`)**:
  - Integrated `godModeActive` check into `getMaxWeight()` so enabling Developer God Mode automatically grants an unlimited carry weight capacity (`9999.0` kg).
- **Merchant & Caravan Interface Separation (`src/components/modals/TradeModal.tsx`)**:
  - Cleanly distinguished town shopkeepers from traveling caravan merchants, ensuring independent stock, guard recruitment, and trade headers.
- **Follower Companion System Verification**:
  - Verified active follower spawning (`spawnFollowersOnLevelLoadByReset`), tactical battle positioning, companion quest dispatches on Guild boards, and follower guard safehouse assignments.

## [v5.0.0] — Phase 27: Canvas Viewport Rendering & Hybrid Engine Integration (August 3, 2026)
*Unified multi-layered canvas viewport rendering engine across TileMap, EntityLayer, and WeatherLighting layers, integrated HybridGraphicsEngine mode switching, and optimized viewport culling and particle physics.*

- **Canvas Viewport Rendering Engine (`/src/components/GameCanvas.tsx` & `/src/canvas/`)**:
  - Modularized canvas viewport rendering pipeline into dedicated layer modules (`tileMapRenderer`, `entityLayerRenderer`, `weatherLightingRenderer`).
  - Integrated `HybridGraphicsEngine` singleton with `graphicsMode` prop in `GameCanvas.tsx` to allow real-time toggling between symbolic text/ASCII glyphs and texture-mapped tileset rendering.
  - Optimized viewport culling logic with safety tile padding for smooth high-FPS scrolling and camera interpolation.
  - Synchronized real-time projectile trajectories, blood splatters, screen shakes, floating damage numbers, and weather/seasonal particle overlays on canvas coordinates.

## [v4.9.0] — Phase 26: App.tsx Monolith Reduction & Domain Custom Hooks Expansion (August 3, 2026)
*Extracted caravan travel & encounter state engine and town services logic out of App.tsx into specialized domain hooks (`useCaravanTravel`, `useTownServices`, `caravanEncounters`), reducing App.tsx size by over 1,000 lines.*

- **Caravan Travel & Encounter Subsystem (`/src/hooks/useCaravanTravel.ts` & `/src/utils/caravanEncounters.ts`)**:
  - Extracted caravan encounter generation into modular factory utility `caravanEncounters.ts`.
  - Encapsulated caravan travel initialization, turn advancement, D20 stat check encounter resolution, and arrival rewards into `useCaravanTravel.ts`.
- **Town Services Engine Hook (`/src/hooks/useTownServices.ts`)**:
  - Encapsulated Blacksmith forge upgrades, Apothecary lab upgrades, Bartender rumor gossip purchasing, Inn rests, and Mercenary party recruitment into `useTownServices.ts`.
- **App.tsx Monolith Deconstruction**:
  - Reduced `App.tsx` from 10,127 lines to 9,089 lines while preserving zero-regression state flow and clean type safety.

## [v4.8.0] — Hybrid Graphic Engine & Animation System Architecture (August 3, 2026)
*Established polymorphic graphics rendering provider architecture, asynchronous asset preloading fallback manager, and decoupled real-time VFX particle emitter queue.*

- **Abstract Graphics Provider Interface (`IGraphicsRenderer.ts`)**:
  - Unified tile, entity, and VFX rendering methods across standard unicode text glyphs and texture-mapped tile atlases.
  - Implemented `TextRenderer.ts` for fast, lightweight unicode/emoji vector fallback.
  - Implemented `TilesetRenderer.ts` using `TilesetAtlasManager` to slice texture atlas coordinates with automatic fallback to text rendering if assets are absent or disabled.
  - Built `HybridGraphicsEngine.ts` singleton for dynamic rendering mode switching.
- **Asynchronous Asset Preloader (`AssetPreloader.ts`)**:
  - Built singleton image caching and status tracking pipeline to load external `.png` texture atlases asynchronously with safe error boundaries and fallback handlers.
- **Decoupled Real-time VFX Emitter (`VFXEmitter.ts`)**:
  - Decoupled turn-based game loop ticks from continuous `requestAnimationFrame` render ticks.
  - Enqueued combat slashes, spell bursts, and ambient embers through a global particle emitter queue.

## [v4.7.0] — Phase 24 & 25: Domain Custom Hooks Partitioning & Organic Ambient Synthesizer Polish (August 3, 2026)
*Partitioned core game subsystems out of App.tsx into modular custom hooks (`useOverworldEvents`, `useTradeEconomy`, `useQuestsAndGuild`) and enriched WebAudio ambient synthesizers.*

- **Domain Custom Hooks Partitioning (`/src/hooks/`)**:
  - `useOverworldEvents.ts`: Isolated overworld time-of-day progression, 7-day seasonal rotations, and weather state transition triggers.
  - `useTradeEconomy.ts`: Isolated merchant transaction handlers, item purchasing/selling logic, and gold balance state updates.
  - `useQuestsAndGuild.ts`: Isolated guild contract acceptance, reward calculations, and active quest status management.
  - `useKeyboardInput.ts`: Added global `Escape` key handling to cancel/close open modals, gumps, overlays, trade windows, and audio panels while blurring active text inputs.
- **Organic Ambient Synthesizer Polish (`/src/utils/audio.ts` & `/src/data/soundCatalog.ts`)**:
  - Synthesized realistic songbird chirps (`bird_chirp`) featuring pitch trills and frequency sweeps for forest and plains biomes.
  - Synthesized night cricket calls (`cricket_chirp`) and hollow owl hoots (`owl_hoot`).
  - Implemented multi-layer organic rain audio swells combining low-pass soil impact patter with band-pass LFO-modulated droplet chatter.

## [v4.6.0] — Phase 18: Tile-Based Spritesheet & Animation Engine Architecture (August 2, 2026)
*Integrated a high-performance tileset atlas manager, multi-frame sprite state machine, and real-time visual FX particle emitter engine into the 60 FPS HTML5 Canvas pipeline.*

- **Tileset Atlas Manager (`src/canvas/TilesetAtlasManager.ts`)**:
  - Implemented 4-neighbor cardinal autotiling bitmask calculator (North=1, East=2, South=4, West=8) for 16 seamless wall, path, and biome border transition variants.
- **Sprite Animation State Controller (`src/canvas/spriteAnimationManager.ts`)**:
  - Created delta-time-driven animation state machine supporting `idle`, `walk`, `attack`, `hurt`, `cast`, and `death` multi-frame sprite sequences across 4 cardinal directions (North, South, East, West).
- **Visual FX Particle System (`src/canvas/visualFxParticleSystem.ts`)**:
  - Built real-time particle emitter engine rendering animated spell bursts, campfire embers, weather sparks, and magic circle glows directly into the canvas context render pass.

## [v4.5.0] — Phase 23: Codebase Health, Data Isolation & Monolith Deconstruction (August 2, 2026)
*Deconstructed large application components and extracted static data blueprints into isolated data modules to optimize memory footprint and codebase maintainability.*

- **Data-Driven Preset Isolation (`/src/data/`)**:
  - Isolated structure blueprints into `/src/data/structures.json`.
  - Isolated town templates and urban layouts into `/src/data/townTemplates.json`.
  - Isolated enemy blueprints and combat templates into `/src/data/enemyBlueprints.json`.
- **God Panel Overlay Deconstruction (`/src/components/god/`)**:
  - Extracted `GodEnemyBlueprintEditor.tsx` for custom mob creation.
  - Extracted `GodReplaySimulator.tsx` for turn-by-turn action replay scrubbing and smoke test suite verification.
  - Extracted `GodCheatsTab.tsx` for developer state overrides.
  - Extracted `GodAdminEditor.tsx` for raw state JSON snapshot imports and exports.
- **App.tsx Layout Modularization (`/src/components/`)**:
  - Extracted top application header into `AppHeaderBar.tsx`.
  - Extracted bottom tab navigation into `AppNavigationTabs.tsx`.

*Isolated all static game data, monster drop tables, item definitions, and sound catalog metadata into pure data modules under `/src/data/` while maintaining 100% backward compatibility.*

- **Monster Catalog Isolation (`/src/data/monsters.ts`)**:
  - Extracted standard, wildlife, and boss definitions into pure `MONSTER_ENTRIES` array with `getMonsterDefinitionByKey` and `getMonstersByCategory` helpers.
- **Items & Materials Catalog Isolation (`/src/data/items.ts`)**:
  - Consolidated basic materials, elemental catalysts, weapon templates, relics, and spell scrolls into single-source data exports with typed accessor helpers (`getMaterialById`, `getCatalystById`, `getRelicById`).
- **Sound Effect Catalog (`/src/data/soundCatalog.ts`)**:
  - Extracted `SoundType` union and structured `SOUND_CATALOG` list with categorized metadata for soundboard & oscilloscope preview.
- **Backward Compatibility Preserved**:
  - Re-exported all legacy symbols in `src/utils/bestiary.ts`, `src/utils/itemsData.ts`, and `src/utils/audio.ts` with zero breaking changes or runtime regressions.


## [v4.3.9] — Standalone Chronicles Link Removal & Main Panel Exclusive Layout (August 1, 2026)
*Removed duplicate secondary header buttons and external modal triggers so Chronicles of Oakhaven is exclusively accessed and rendered within the primary Main Panel tab navigation.*

- **Header Bar & Navigation Cleanup (`src/App.tsx`)**:
  - Removed secondary top header button for Chronicles.
  - Retained `CHRONICLES & LORE` (`chronicles`) exclusively in the primary Main Panel tab bar next to Expedition, Forge, Bestiary, Inventory, and Guild.
- **AppOverlays Cleanup (`src/components/AppOverlays.tsx`)**:
  - Removed modal backdrop instance from `AppOverlays` to maintain a single source of truth for lore exploration inside the Main Panel.

## [v4.3.8] — Main Panel Chronicles & Lore Tab Integration (August 1, 2026)
*Relocated the Chronicles of Oakhaven history book directly into the primary main panel tab navigation bar alongside Expedition, Guild, Bestiary, Arcanum Blacksmith, and Hero Profile.*

- **Main Panel Tab Navigation (`src/App.tsx`)**:
  - Added `CHRONICLES & LORE` (`chronicles`) to the primary tab bar with `BookOpen` icon badge and responsive mobile tab label.
  - Added full tab switching logic rendering `HistoryBookOverlay` inline in the main panel content pane.
- **Inline Tab & Standalone Modal Dual-Mode Engine (`src/components/HistoryBookOverlay.tsx`)**:
  - Added `inline` prop support to render embedded inside tab layouts without fixed modal backdrops while preserving standalone modal fallback options.
  - Provided direct `"← Back to Expedition"` return navigation when viewing Chronicles inline.
- **Global Hotkey Integration (`src/hooks/useKeyboardInput.ts`)**:
  - Updated key `H` hotkey to seamlessly toggle between the `'chronicles'` tab and `'dungeon'` expedition tab.
*Integrated a 60 FPS real-time WebAudio vector oscilloscope waveform trace, FFT frequency spectrum visualizer, procedural soundboard trigger studio, and live custom synthesizer patch generator.*

- **Real-Time WebAudio Analyser Engine (`src/utils/audio.ts`)**:
  - Connected `AnalyserNode` (`fftSize = 1024`) downstream of `masterGainNode` to capture raw time-domain waveforms and frequency spectrum arrays.
  - Exported `getAudioAnalyser()`, `getAudioWaveformData()`, `getAudioFrequencyData()`, and `playCustomSynthesizer()`.
- **Live Oscilloscope & Visualizer Studio (`src/components/AudioOscilloscopeStudio.tsx`)**:
  - Built 60 FPS Canvas visualizer supporting **Waveform Trace** (green phosphor trace with cyan glow), **FFT Spectrum** (frequency energy bars with peak hold indicators), and **Dual Split View**.
  - Integrated real-time peak level monitoring in **dBFS VU meter** display.
- **Soundboard & Spatial Test Matrix**:
  - Embedded instant preview triggers for all 35+ synthesized sound effects.
  - Included interactive **Pitch Multiplier** (0.5x - 2.0x), **Stereo Panning** (Left/Right), and **Distance Attenuation** sliders for developer testing.
- **Interactive Synthesizer Patch Workbench**:
  - Provides controls for Oscillator Waveform (`sine`, `square`, `sawtooth`, `triangle`, `white noise`), Frequency Sweeps (Hz), Envelope ADSR (Attack, Decay, Sustain, Release), and Biquad Filters (Lowpass, Highpass, Bandpass, Cutoff, Q resonance).
  - Includes **"Play Custom Patch"** and **"Copy TypeScript Code"** generator button.
- **HUD & Settings Modal Integration (`src/components/AudioSettingsModal.tsx`)**:
  - Added tab switcher `[ 🎛️ Volume Controls ] [ 🎵 Studio & Oscilloscope ]` with auto-expanding canvas layout.

## [v4.3.6] — Realistic Indoor Building Acoustic Soundscape & Acoustic Attenuation (August 1, 2026)
*Implemented realistic building interior acoustic detection, lowpass atmospheric wind muffling inside buildings, door opening/closing creaks and latches, indoor timber and clock accents, and surface-aware footstep audio.*

- **Realistic Building Acoustic Engine (`src/utils/buildingAudio.ts`, `src/utils/audio.ts`)**:
  - Created `isPlayerIndoors` utility to detect when the player is inside houses, taverns, shops, keeps, watchtowers, 2nd floors, or dungeon levels.
  - Dynamically modulates the lowpass muffle filter (~650 Hz cutoff) when indoors so outdoor weather, wind, rain, and blizzards sound realistically dampened behind wooden walls and stone roofs.
  - Added building interior accent soundscapes: hearth fire crackles (`fire_crackle`), timber creaks (`wood_creak`), acoustic lute strums (`lute_pluck`), and indoor pendulum clocks (`clock_tick`).
- **Door Creaks & Surface Footstep Audio**:
  - Implemented procedural WebAudio synthesizers for `door_open` (wooden creak + metal latch click), `door_close` (heavy wood thud + latch snap), `wood_footstep` (warm plank resonance), `stone_footstep` (crisp tile step), and `grass_step` (soft grass rustle).
  - Automatically plays door entry/exit sounds when stepping through doorways or opening building doors.
  - Dynamically switches footstep sounds depending on whether the player is stepping on indoor wood planks, stone floor tiles, or outdoor terrain.
  - Applied wall occlusion lowpass filtering to spatial positional sound effects heard across building walls.
- **Documentation & Test Verification**:
  - Updated `DEVELOPERS.md`, `AUDIO.md`, `README.md`, `FEATURES.md`, `VERSIONS.md`, and `todo.md`.

## [v4.3.5] — Phase 21 WebAudio Spatial Sound Engine & Developer Documentation (August 1, 2026)
*Expanded procedural sound synthesis, added spatial attenuation math and biome soundscapes, implemented 1-click HUD mute toggle with preferences persistence, and published comprehensive developer audio documentation.*

- **WebAudio Spatial Sound Engine Expansion (`src/utils/audio.ts`)**:
  - Expanded procedural sound synthesizers with new audio recipes: `chest_open`, `boss_roar`, `lightning_strike`, `critical_hit`, `equip`, `tab_click`, `potion_drink`, `owl_hoot`, `cricket_chirp`, `frog_croak`, `cave_echo`, `lute_pluck`, `ocean_wave`, `fire_crackle`.
  - Tuned default ambient gain and layer levels (`0.04`–`0.08`) so environmental soundscapes sit softly in the background without overpowering gameplay.
  - Implemented spatial distance attenuation $(1 - \text{dist}/\text{maxDist})^{1.5}$, stereo panning ($\Delta x/8$), and low-pass frequency filtering for positional sound events.
- **HUD Quick Mute & Preferences Persistence**:
  - Added 1-click **`🔊 Mute` / `🔇 Muted`** toggle button directly on the main header bar next to Audio settings.
  - Auto-persists master volume, SFX volume, ambient volume, and mute status to `localStorage` (`cosmic_abyss_audio_settings_v1`).
- **Comprehensive Developer Audio Guide (`/AUDIO.md`)**:
  - Created [`AUDIO.md`](/AUDIO.md) detailing WebAudio routing graphs, distance attenuation math, complete sound catalog, and a 3-step guide on adding custom sound effects.
  - Updated `DEVELOPERS.md`, `README.md`, `FEATURES.md`, and `todo.md`.

## [v4.3.3] — Phase 7 Dead Code Elimination & Comprehensive Verification (July 31, 2026)
*Completed code quality overhaul across Phases 5-7: pruned dead code paths, hardened diagnostic error assertions, expanded unit test suites to 57 passing tests, and updated architecture documentation.*

- **Dead Code Audit & Clean Pruning**:
  - Scanned and verified all procedural generation re-exports, component paths, and utility imports.
  - Confirmed 0 lint errors, 0 compilation warnings, and clean tree-shakable import paths across `/src/`.
- **Systematic Verification**:
  - Created `src/tests/endToEndGameplaySimulation.test.ts` to simulate full 50-turn dungeon exploration, town commerce, guild HQ upgrades, scar acquisition, and save integrity validation.
  - Created `src/tests/weatherAndMutations.test.ts` to validate weather movement penalties, catalyst damage multipliers, and dual-element mutation synergies.
  - Ran `npm run test` (13 test files, 57 unit tests passing 100% green).
  - Executed `lint_applet` and `compile_applet` to guarantee complete build integrity.
- **Documentation Synchronization**:
  - Updated `todo.md`, `DEVELOPERS.md`, `VERSIONS.md`, and project status logs.

## [v4.3.2] — Phase 6 Test Suite Expansion & Sub-System Coverage (July 31, 2026)
*Expanded Vitest unit test suites from 8 test files (37 tests) to 11 test files (47 tests), covering crafting, alchemy, Storyteller GM state dynamics, and spell scroll systems.*

- **Crafting & Alchemy Test Suite (`src/tests/craftingAndAlchemy.test.ts`)**:
  - Tested cooking and brewing recipe schemas, material costs, permanent stat increases, catalyst definitions, and over-forge heat shatter risk formulas.
- **Storyteller AI Test Suite (`src/tests/storytellerAI.test.ts`)**:
  - Tested autonomous GM state management, personality shifts, boredom/tension thresholds, and encounter trigger evaluations (e.g. Healing Breeze).
- **Spells & Mana Test Suite (`src/tests/spellsAndMana.test.ts`)**:
  - Tested active spell catalog, `getSpellById` error assertions, spell scroll templates, combo effects, and scroll-to-equipment conversions.
- **Automated Verification**: Vitest test suite passing 11 test files and 47 unit tests; zero TypeScript/linter errors (`lint_applet` & `compile_applet`).

## [v4.3.1] — Phase 5 Deep Quality Assurance & Error Assertion Hardening (July 31, 2026)
*Replaced silent null fallbacks with explicit error assertions, save data integrity validators, and catalog lookup assertions across core hooks and utilities.*

- **Save Data Integrity & Diagnostic Assertions (`src/hooks/useSaveLoad.ts`)**:
  - Implemented `validateSaveData(data)` function to explicitly throw descriptive error assertions if save files contain corrupted structures or invalid coordinates.
  - Hardened `loadGame` to log diagnostic error details and alert players gracefully via the system log when loading damaged save files.
- **Spell & Catalog Error Assertions (`src/utils/spellsAndEquipment.ts` & `src/utils/shopData.ts`)**:
  - Added `getSpellById(id)` with explicit error assertions when requesting unregistered or mistyped spell IDs.
  - Added `getShopItemById(itemId)` with strict diagnostic checks across all shop data catalogs.
- **Unit Test Coverage**: Added `validateSaveData` assertion tests into `saveLoad.test.ts` (37 tests passing green across 8 test suites).

## [v4.2.0] — v4.2 Architecture Refactoring & Modular Consolidation (July 31, 2026)
*Executed complete 4-phase architectural refactoring plan: partitioned layout viewports, extracted overlay sub-panels, consolidated type definitions, and isolated static data catalogs.*

- **Phase 1: App Layout & View Partitioning (`src/components/MainAppLayout.tsx`)**:
  - Extracted top-level header navigation, HUD status bar, main viewport grid, combat log viewport, and active overlay routing into `MainAppLayout.tsx`.
  - Moved global keyboard shortcut event dispatchers and input suppression handlers into `src/hooks/useKeyboardInput.ts`.
- **Phase 2: Remaining Sub-Component Extractions (`src/components/god/` & `src/components/crafting/`)**:
  - Extracted `GodStorytellerPanel.tsx` (Autonomous GM console, personality selector, dynamic boredom/tension gauges & encounter triggers) and `GodItemSpawner.tsx` into `/src/components/god/`.
  - Extracted `CookingTab.tsx` (campfire cooking recipes) and `AlchemyTab.tsx` (apothecary brewing & tier upgrades) into `/src/components/crafting/`.
- **Phase 3: Type Hierarchy Consolidation (`src/types/`)**:
  - Unified legacy type definitions into modular files: `game.ts`, `entities.ts`, `map.ts`, and `items.ts`.
  - Re-exported all types seamlessly through `src/types.ts` for backward compatibility, eliminating legacy `any` casts in test suites.
- **Phase 4: Data Catalog Isolation (`src/data/shops.json`)**:
  - Extracted Blacksmith shop inventory, Merchant resources, Tavern rations, and Apothecary catalysts/potions into `/src/data/shops.json`.
  - Updated `/src/utils/shopData.ts` to consume declarative JSON catalog data while maintaining pure computation helper functions.
- **Automated Verification**: Vitest test suite passing 8 test files and 36 unit tests; verified zero linter warnings and clean production compilation (`lint_applet` & `compile_applet`).

## [v4.1.1] — Phase 4 Guild & Crafting UI Extraction & Component Modularization (July 30, 2026)
*Deconstructed large monolithic UI files (GuildOverlay.tsx and CraftingPanel.tsx) into dedicated, highly maintainable sub-components in /src/components/guild/ and /src/components/crafting/.*

- **Guild Headquarters Extraction (`src/components/guild/`)**:
  - `GuildTreasuryPanel.tsx`: Isolated Guild House purchasing, research upgrades, sanctuary decor, and faction conquest map/war treasury tax coffers into a dedicated component.
  - `GuildMissionBoard.tsx`: Extracted companion follower dispatch, active expedition tracking, quest assignment, and mission resolution views into an isolated component.
- **Crafting & Alchemy Extraction (`src/components/crafting/`)**:
  - `CampAndToolsTab.tsx`: Modularized camp gear crafting (tents, torches, repair kits, skinning knives) into a dedicated tab component.
  - `ScrollScriptoriumTab.tsx`: Modularized spell scroll inscription (Recall, Teleport, Fireball, Identify, Mass Heal) into a dedicated scriptorium tab component.
- **Legacy UI Cleanup**: Removed deprecated legacy views (Sanctuary Decor View 2 and Factions View 4) from `GuildOverlay.tsx`, shrinking component size and improving render efficiency.
- **Verification & Test Coverage**: Updated test suite to 7 test files and 31 unit tests passing (`npm run test`); validated zero linter or compilation errors (`lint_applet` & `compile_applet`).

## [v4.1.0] — Phase 12 Automated Verification & Unit Testing Framework (July 29, 2026)
*Implemented comprehensive automated unit testing suite across AI pathfinding, combat damage formulas, scar stats, overworld & dungeon generation, save state serialization, economy pricing, and renderer string safety.*

- **Automated Vitest Test Engine Integration**: Configured Vitest runner (`npm run test`), providing 6 modular test suites and 25 unit tests running in <2 seconds.
- **AI & Pathfinding Verification (`src/tests/ai.test.ts`)**: Added unit tests for Bresenham FOV raycasting, line-of-sight blockage behind walls, BFS obstacle navigation around walls/doors, and follower anti-trapping position swapping.
- **Combat & Debuff Safety Verification (`src/tests/combat.test.ts`)**: Added unit tests for `calculateNetDamage` 75% max armor mitigation, critical damage multipliers, sub-linear XP scaling, scar acquisition evaluation thresholds ($\ge 12$ HP damage), `getEffectiveStats` scar modifier attribute applications, and debuff duration reduction without undefined access errors.
- **World & Dungeon Generation Verification (`src/tests/worldGen.test.ts`)**: Added unit tests for 64x40 overworld chunk generation across biomes, dungeon level generation across depths 1–5 ensuring non-wall player spawns, initialized enemy debuffs arrays, and camera snap repositioning on chunk transitions.
- **Save File & Backward Compatibility (`src/tests/saveLoad.test.ts`)**: Added unit tests for JSON save state payload serialization, legacy save schema deserialization with fallback defaults (`chaosScore`, `townReputation`), and corrupted JSON error handling.
- **Economy, Trading & Biome Scarcity (`src/tests/economyAndEvents.test.ts`)**: Added unit tests for regional trade price multipliers (e.g. 3.5x wood in desert, 0.8x in swamp, 2.5x frost catalyst in desert), regional market price report generation, and trade guild upgrade data structures.
- **Log Integrity & Renderer Diagnostics (`src/tests/logAndDiagnostics.test.ts`)**: Added unit tests for `entityLayerRenderer.ts` corpse glyph string safety (`corpse.name?.toLowerCase()`), unique row key generation for duplicate combat logs in `GameLog.tsx`, fast travel coordinate bounds sanitization, and virtual smoke testing engine execution.


## [v4.0.9] — Developer Error Diagnostics, Map Repair & Import Verification (July 28, 2026)
*Replaced silent coordinate/template fallbacks with explicit console errors and auto-repair logic; verified case-sensitive import paths across all 96 source files.*

- **Explicit Developer Diagnostics & Map Repair**: Created `findStairsOrWalkablePosition` in `src/utils/gameUtils.ts` that emits explicit `[DEV ERROR]` console messages when expected stairs or target tiles are missing, automatically repairing maps by placing the missing tile on the first walkable floor.
- **Dungeon & GM Teleport Stabilization**: Replaced silent stair lookups in `usePlayerMovement.ts`, `GodPanelOverlay.tsx`, and `gmCommands.ts` with `findStairsOrWalkablePosition`.
- **Enemy Template Error Guards**: Updated `getEnemyTemplate` in `src/utils/dungeon.ts` and `carveStructure` in `src/utils/structurePlacer.ts` to log explicit `[DEV ERROR]` alerts when unmapped templates or legend keys occur.
- **Full Project Import Audit & Direct Type Re-exports**: Updated `src/types.ts` to re-export directly from sub-modules (`map`, `items`, `entities`, `game`), eliminating language server index resolution shadowing between `src/types.ts` and `src/types/index.ts`. Built and executed automated import verification tool confirming 100% case-sensitive import path and exported symbol resolution across all 96 TS/TSX project files.
- **Dungeon Chest Generation Fix**: Fixed material tier filtering in `generateLevel()` inside `src/utils/dungeon.ts` to properly match `"Tier1"`, `"Tier2"`, and `"Tier3"` category strings from `materials.json`, preventing undefined rolls when populating chest loot. Added safe fallback arrays and optional chaining (`rolledMat?.id`).
- **JSON Module Resolution Fix**: Configured `"resolveJsonModule": true` in `tsconfig.json` and created `src/declarations.d.ts` with explicit `*.json` type declarations to resolve TS2307 module errors on `import enemyTemplates from '../data/enemies.json'`.
- **Full Dungeon Simulation Suite**: Created and ran a simulation runner testing `generateLevel()` across 15 depth tiers. Fixed SSR/Node `window` context checks in `getEnemyTemplate()` and added alias resolution for `Brute`, `Mage`, and `captive` enemy templates, ensuring zero runtime errors or warnings during dungeon transitions.

## [v4.0.8] — Phase 17 Dungeon Entrance Fix & Final Code Audit Cleanup (July 27, 2026)
*Resolved the dungeon transition crash, audited all module imports/exports, and verified zero typescript compile errors.*

- **Dungeon Transition Fix**: Added missing `dungeonLevels: nextDungeonLevels` state assignment in `usePlayerMovement.ts` first floor descend routine, preserving dungeon level data across state transitions.
- **Null Safety & Optional Chaining Audit**: Systematically guarded property lookups across `useSpellcasting.ts`, `useEquipmentHandlers.ts`, `useCraftingEngine.ts`, `GameCanvas.tsx`, `GuildOverlay.tsx`, `PoiInteractionOverlay.tsx`, and `App.tsx` trade booth tab button to prevent `Cannot read properties of undefined (reading 'id')` errors.
- **Module Import/Export Verification**: Audited module interfaces and component boundaries across all 17 completed refactoring phases; verified clean build (`compile_applet` & `tsc --noEmit`).

## [v4.0.7] — Comprehensive Engine Stability & AI Behavior Bug Fix Pass (July 27, 2026)
*Resolved all reported stability issues and NPC/feline behavior glitches in BUGS.md.*

- **Dungeon Stairs Transition Safety**: Resolved dungeon entrance runtime crashes by adding safe coordinate resolution and array bounds checks for `StairsUp` and `StairsDown` array indexing in `usePlayerMovement.ts`.
- **Equipment Null-Safety Guard**: Fixed item equipment crashes in `useEquipmentHandlers.ts` by adding strict null checks on items and safe default values (`0` for missing defense/damage stats) across all paperdoll slot assignments and unequip routines.
- **Town Guard Defense AI**: Added active threat hunting to `useEnemyAI.ts` so town guards scan for, pursue, and attack hostile monsters (brawlers, bandits, goblins) entering the settlement.
- **Companion & Cat Targeting Safety**: Fixed companion and feline follower attack checks in `useEnemyAI.ts` so followers only target enemies hostile to the player, preventing cats from attacking friendly town guards.
- **Caravan Travel Merchant Restriction**: Fixed `TradeModal.tsx` so only genuine caravan master NPCs offer caravan escort and fast travel options instead of standard town shopkeepers.

## [v4.0.6] — Phase 13-16 Monolith Decomposition & Canvas Render Layer Modularization (July 27, 2026)
*Deconstructed App.tsx into dedicated hooks (useSpellcasting, useWorldInteraction, useCraftingEngine) and MainAppLayout, decomposed GodPanelOverlay into subcomponents, modularized overworld map generators, and modularized GameCanvas into isolated render layers (tileMapRenderer, entityLayerRenderer, weatherLightingRenderer, spriteRenderer).*

- **Main App Layout & View Shell (`src/components/MainAppLayout.tsx`)**: Decoupled HUD bars, status bars, canvas containers, and active modal overlays from `App.tsx` into a modular layout component.
- **Spellcasting Engine Hook (`src/hooks/useSpellcasting.ts`)**: Extracted spell casting, mana verification, projectile targeting, AOE effects, status applications, and scroll consumption out of `App.tsx`.
- **World Interaction Hook (`src/hooks/useWorldInteraction.ts`)**: Extracted overworld stairs navigation, resource harvesting (trees/ore veins), door opening, and environment interactions out of `App.tsx`.
- **Crafting & Alchemy Hook (`src/hooks/useCraftingEngine.ts`)**: Extracted weapon/armor crafting handlers, overforge heat calculations, equipment repairs, and alchemy brewing out of `App.tsx`.
- **God Panel Sub-System Decomposition (`src/components/god/`)**: Modularized `GodPanelOverlay.tsx` into `GodItemSpawner.tsx`, `GodWorldEditor.tsx`, and `GodStatEditor.tsx`.
- **Overworld Map Generator Decomposition (`src/world/`)**: Extracted biome distribution into `overworldBiomes.ts` and structure/POI placement into `overworldStructures.ts`.
- **GameCanvas Render Layer Modularization (`src/canvas/`)**: Modularized canvas drawing routines into isolated layers:
  - `tileMapRenderer.ts`: Grid map rendering loop with viewport culling, tile colors, and ASCII/sprite mappings.
  - `entityLayerRenderer.ts`: Corpses, dungeon props, traps, chests, POIs, loot piles, NPCs, enemies, player, and floating particle effects/projectiles.
  - `weatherLightingRenderer.ts`: Ambient day/night lighting shader, celestial rift effects, weather layers (rain, snow, fog, sandstorm, blizzard), and seasonal particle effects.
  - `spriteRenderer.ts`: Shared ASCII fallback and sprite sheet tile drawer.

## [v4.0.5] — Phase 11 Data Centralization, Equipment Hooks & Durability Null Safety Patch (July 26, 2026)
*Centralized game balance constants, economy matrices, and NPC dialogue trees into declarative data modules, extracted equipment handling into `useEquipmentHandlers.ts`, and implemented defensive null safeguards against equipment crashes.*

- **Centralized Balance Constants (`src/data/balance.ts`)**: Unified XP level thresholds (`getXpForLevel`), net damage mitigation curves (`calculateNetDamage`), critical hit multipliers (`calculateCritDamage`), and overforge safety limits into a central, easy-to-balance module.
- **Centralized Settlement Economy & Price Scaling (`src/data/economy.json`)**: Externalized reputation discount tiers, charisma trade scaling factors, caravan payout formulas, and regional biome pricing tables.
- **Centralized NPC Dialogue Trees & Quests (`src/data/dialogues.json`)**: Externalized shopkeeper dialogues, tavern rumors, and quest objective matrices into declarative JSON schemas.
- **Equipment Handlers Hook (`useEquipmentHandlers.ts`)**: Extracted paperdoll slot assignment, stat recalculations, and durability degradation into a standalone custom engine hook.
- **Equipment Null-Safety Guard**: Resolved runtime `TypeError: Cannot read properties of undefined (reading 'name')` crashes when equipping weapons or armor missing explicit `materialUsed` or `catalystUsed` properties by injecting safe default fallback objects (`Forged Alloy` material and `Physical` catalyst) during item equipping and rendering.

## [v4.0.4] — Phase 3 & 4 Architectural Deconstruction, Custom Hooks & Codebase Refactoring (July 25, 2026)
*Deconstructed core monolithic game loops into modular custom React hooks (`useEnemyAI`, `useCombatEngine`, `usePlayerMovement`, `useKeyboardInput`, `useSaveLoad`), isolated world generators (`dungeonGen.ts`, `overworldGen.ts`), and implemented spatial hash memoization and component render isolation (`React.memo`).*

- **Modular Enemy AI Hook (`useEnemyAI.ts`)**: Extracted and restored the turn-based AI solver, enemy melee and ranged attacks, follower combat assistance, player dodge calculations, armor durability decay, permanent scar acquisition, weather state transitions, GM storyteller events, and seasonal turn ticks into a custom hook.
- **Modular Combat Engine Hook (`useCombatEngine.ts`)**: Extracted physical strike damage calculations, scar acquisition evaluation, overforge heat recoil, durability decay, and critical hits into a custom hook.
- **Modular Player Movement Hook (`usePlayerMovement.ts`)**: Modularized player movement, terrain collisions, tile traps, stamina consumption, and stair navigation.
- **Modular Keyboard Input Hook (`useKeyboardInput.ts`)**: Decoupled WASD, Arrow, and Numpad hotkey bindings with modal input suppression logic.
- **Modular Save/Load Hook (`useSaveLoad.ts`)**: Extracted LocalStorage state serialization, auto-save timers, and save import/export sanitization.
- **World & Dungeon Generators Isolation (`src/world/`)**: Modularized procedural dungeon generation into `src/world/dungeonGen.ts` and overworld chunk/landmark placement into `src/world/overworldGen.ts`.
- **FOV & Line-of-Sight Spatial Hash Memoization**: Memoized raycasting visibility queries (`computeFOV`, `bresenhamLine`) with spatial bounding-box hashing in `ai.ts`.
- **Component Render Isolation (`React.memo`)**: Wrapped all HUD panels, overlays, and canvas subcomponents in `React.memo` to eliminate cascading re-renders.

## [v4.0.3] — Landing Page Tactical Primer Update (July 24, 2026)
*Cleaned up Tactical Primer copy and updated movement controls documentation on the landing page screen.*

- **Tactical Primer Copy Refinement**: Updated movement instructions in `App.tsx` to explicitly indicate WASD or Numpad movement, replaced obsolete push triggers reference with trap avoidance guidance, and refined landing screen instructions.

## [v4.0.2] — Engine Performance Pass, 2D Canvas Minimap & Context State Optimization (July 24, 2026)
*Migrated Chunk Minimap from 441 React DOM nodes to a 2D Canvas element, optimized raycasting distance math, and streamlined canvas context state calls.*

- **Chunk Minimap Canvas Migration**: Replaced 441 React grid `<div>` nodes in `ChunkMinimap.tsx` with a single high-performance HTML5 2D `<canvas>` element, eliminating DOM node allocation thrashing on player turns.
- **Raycasting Inner Loop Math**: Replaced floating-point `Math.sqrt` calculations in `ai.ts` line-of-sight raycasting with fast squared distance checks (`distSq > radiusSq`), accelerating FOV calculation.
- **Canvas Context State & Font Overhead Reduction**: Eliminated per-tile `ctx.save()` / `ctx.restore()` stack pushes in `GameCanvas.tsx` and initialized canvas font/alignment once before tile loops, avoiding re-parsing font strings 600+ times per frame.

## [v4.0.1] — Autonomous GM Engine, Replay Sim Dock, Chaos Natural Decay & Combat Rest Guard (July 24, 2026)
*Enabled default Autonomous GM Storyteller mode, added a collapsible/minimized Replay Simulator HUD, implemented peaceful Chaos natural decay, and restricted campfire resting during combat.*

- **Autonomous GM Storyteller Active by Default**: Enabled the autonomous GM Storyteller matrix and un-restricted gift interventions by default (`gmStoryteller.ts`), granting active story interventions and atmospheric monitoring.
- **Minimizable Replay Simulator Dock**: Added a `Minimize` button and compact bottom floating HUD to `GodPanelOverlay.tsx`, enabling real-time canvas gameplay observation while controlling simulation replay playback, scrubbing, and speed.
- **Peaceful Chaos Matrix Natural Decay**: Modified `gmStoryteller.ts` and `ChaosConsole.tsx` so Chaos automatically drifts down toward the 20% natural baseline during peaceful or non-combat turns.
- **Campfire Combat Rest Restriction**: Enforced a proximity check in `App.tsx` preventing players from resting at a campfire while hostile monsters are within 8 tiles.


## [v4.0.0] — Phase 4 Performance, Rendering & Admin Editor Safety Update (July 24, 2026)
*Implemented comprehensive memoization optimizations, spatial hashing for line-of-sight/FOV raycasting, React component render boundary isolation, and resolved Admin Editor initialization crash bugs.*

- **FOV & Line-of-Sight Spatial Hashing**: Bounded and memoized `computeFOV` and spatial visibility queries using bounding-box spatial hashes in `ai.ts`, eliminating redundant calculations on unchanged turns.
- **Render Boundary & Component Optimization (`React.memo`)**: Wrapped key UI overlays, HUD panels, and canvas components (`GameCanvas`, `GameLog`, `DifficultyTracker`, `DungeonGlancePanel`, `UnifiedInventoryPanel`, `CraftingPanel`, `GodPanelOverlay`, `GodStatEditor`, `AppOverlays`, `MutationSynergyPanel`, `OverforgeGauge`, `CookingTab`, `AlchemyTab`) in `React.memo` to eliminate cascading parent re-renders.
- **Admin Editor Safety Patch**: Fixed `GodStatEditor` scar database fallback to default `SCAR_DATABASE` to eliminate uncaught `TypeError` crashes when clicking Admin Editor in the Dev Panel.
- **Map Bound & Safe Pathing Guard**: Added strict safe-navigation array checks (`map?.[0]?.length`) in pathfinding and enemy movement routines (`App.tsx`, `ai.ts`) to prevent undefined grid crash risks.


## [v3.9.15] — Portable Blacksmith Anvil & Field Station Adjacency (July 23, 2026)
*Implemented a deployable Blacksmith Anvil structure allowing players to forge, mutate, and upgrade equipment anywhere in the field.*

- **Craftable Anvil Structure**: Added a craftable Blacksmith Anvil item in `CraftingPanel.tsx` under the *Survival* tab requiring 5x Tempered Iron and 2x Scrap Wood. Deploys an Anvil tile (`⚒️`) on adjacent floor tiles.
- **Forge Station Adjacency**: Enforced adjacent Anvil (`⚒️`) or Town location checks for weapon forging, equipment mutation, and gear upgrades, providing clear warning banners when out in the wild.
- **God Panel Testing Console**: Added an instant "Anvil (⚒️)" spawn button to `GodPanelOverlay.tsx` for developer testing.
- **System-Wide Map & Pathing Integration**: Integrated `TileType.Anvil` across AI collision logic (`ai.ts`), minimap (`ChunkMinimap.tsx`), and canvas sprite rendering (`GameCanvas.tsx`).

## [v3.9.14] — Unstable Mutation "Synergy Chains" & Dual-Element Infusion (July 23, 2026)
*Engineered a modular Unstable Mutation Synergy Chain system allowing gear to accumulate elemental catalysts, unlocking 10+ dual-element synergy traits, chain tiers, and strain gauges.*

- **Modular Mutation Synergy Engine (`mutationSynergy.ts`)**: Modularized synergy logic for combining elemental catalysts (Fire, Frost, Lightning, Shadow, Poison) into dual-element traits like *Thermal Shock*, *Plasma Arc*, *Hellfire Singularity*, and *Corrosive Blight*.
- **Multi-Tier Synergy Chains (Lv 1 to Lv 10)**: Sequential mutations build chain levels unlocking Supercritical Resonance (+25% power) and Omega Chaos Overcharge (+50% power).
- **Interactive Mutation Synergy Panel (`MutationSynergyPanel.tsx`)**: Displays active catalyst matrices, unlocked dual-element synergy traits, and a dynamic Mutagenic Strain Gauge (0% to 100%) in `CraftingPanel.tsx`.
- **Item State & Tooltip Integration**: Mutated items persist `synergyCatalysts`, `synergyTitle`, `mutationStrain`, and traits in `CraftedWeapon` and `EquipmentItem` interfaces.

## [v3.9.13] — Modular Engine Architecture & Developer Modding Standards (July 23, 2026)
*Modularized weapon forge over-forging mechanics, item discard modals, and updated developer guides to streamline community modding and system extension.*

- **Modularized Over-Forging Heat System**: Extracted over-forging logic and UI elements into modular React components and state handlers, simplifying integration across crafting panels.
- **Interactive Discard & Drop Gump Modal (`DiscardItemModal.tsx`)**: Built a retro fantasy-styled Gump modal for dropping or destroying items, supporting stack quantity selection and physical ground loot placement.
- **Stackable Spell Scroll Systems**: Guaranteed that all scroll items (Recall, Fireball, Teleport, etc.) are fully stackable in inventory slots with quantity tracking.
- **Comprehensive Developer Documentation**: Updated `DEVELOPERS.md`, `FEATURES.md`, `README.md`, and `todo.md` with clear instructions for adding custom items, recipes, weather, enemies, and structures.

## [v3.9.12] — The Over-Forging Risk/Reward Gauge & Bellows System (July 22, 2026)
*Introduced an interactive high-stakes Over-Forging Bellows system across weapon forging, mutation, and equipment upgrades.*

- **Interactive Bellows Heat Gauge**: Allows players to set or pump the Over-Forging Heat level (0% to 100%) prior to crafting, mutating, or upgrading gear.
- **Scaling Power Multiplier**: High heat scales equipment stats up to **2.25x** (+125% power) and unlocks divine "God-Forged" item titles and legendary prefixes.
- **Shatter Risk & Anvil Recoil**: High heat increases the risk of equipment shattering (up to 65% at max heat) yielding scrap material, and inflicts anvil heat recoil damage (up to 15 HP) on the player upon crafting.
- **Unified Workbench Integration**: Fully integrated over-forging heat gauge sliders and bellows pumps into Forge Equipment, Mutation Forge, and Upgrade Gear panels.

## [v3.9.11] — Active Chaos Suppression & Mitigation System (July 21, 2026)
*Empowered players with high-agency tactical counter-measures against the overworld and dungeon difficulty scaling systems, enabling active combat and exploration feats to suppress the Abyssal Chaos Coefficient in real-time.*

- **Active Threat Mitigation Calculations**: Introduced a dynamic subtraction mechanism inside the core difficulty engine (`src/utils/dungeon.ts`). Players can now suppress the Abyssal Chaos Coefficient through concrete, heroic tasks:
  - **Dungeon Bosses Slain**: Grants a whopping **-0.35x threat reduction** per boss defeated.
  - **Wilderness Camps Cleared**: Grants a robust **-0.15x threat reduction** per hostile campsite cleared.
  - **Foes Defeated**: Grants a steady **-0.05x threat reduction** for every 10 standard enemies vanquished.
- **Threat Floor Protection**: Established a safe-limit coefficient floor of **0.70x** to guarantee that highly skilled players aren't completely starved of challenge, maintaining a rewarding but manageable combat atmosphere.
- **Difficulty Tracker HUD Integration**: Overhauled the side-panel Difficulty and Chaos tracking interfaces to render a comprehensive, dedicated **Active Chaos Suppression** panel, visualizing exact stats of bosses slain, camps liberated, standard foes crushed, and their cumulative coefficient reductions.
- **Interactive Balance Synchronization**: Bound the new active mitigation equations directly to dungeon level generation and enemy stat scaling, transforming Sunder from a passive, ever-tightening survival race into an active, balanced territory pushback system.

## [v3.9.10] — Dynamic Stat Progression & Reward Scaling (July 21, 2026)
*Enhanced player agency and character specialization pathways by introducing real-time scaling and rewards for custom stat builds, while fully aligning early-game combat encounters for smooth progression.*

- **Luck-Scaled Item Drops**: Fully integrated player Luck (LCK) into the item drop systems. Defeating monsters now features a dynamic equipment drop rate scaling factor of **+3% per point of LCK above base 10** (up from 2%), which directly boosts the base 22% drop rate (capped up to 85%).
- **Luck-Scaled Chest Loot**: Applied Luck-scaling to the chest treasure generation. Finding equipment inside treasure caches is now boosted by **+3% per point of LCK above base 10** (up from 2%), up to a maximum 90% chance.
- **Charisma-Scaled Shop Discounts**: Fully connected player Charisma (CHA) to merchant trade loops. Prices across all vendors—including the Blacksmith, Apothecary, Supply Merchant, Tavern Master, Exotic Artificer, and Caravan Merchants—are dynamically reduced by **-1.5% per point of CHA above base 10** (up from 1.0%), up to a maximum discount cap of 50%. This beautifully rewards traders and charismatic playstyles.
- **Early-Game Balance Convergence**: Slashed starting stats for the baseline custom enemy registry (such as Giant Plague Rats to 6 HP & 1 ATK, Scavenger Goblins to 12 HP & 2 ATK) to perfectly prevent critical early-game deaths while leaving late-game underworld bosses intact.

## [v3.9.9] — The Ultimate Performance & Fluid Control Update (July 21, 2026)
*Implemented deep algorithmic and state architecture optimizations across the engine, rendering pipeline, and input controllers to deliver high-performance gameplay, eliminate micro-stutter, and guarantee flawless input responsiveness.*

- **Zero-Thrashing Keyboard Event Loop**: Decoupled the global keydown and action listener from React's state re-binding cycle. Key listeners now utilize a stable, high-performance callback ref (`handleKeyDownRef`) pointing to the latest `gameStateRef`. This stops the listener from being detached, destroyed, and rebuilt thousands of times as the player moves, reducing garbage collection spikes and improving keystroke response times to under 1ms.
- **Viewport-Culled Grid Renderer**: Optimized the Canvas rendering engine (`GameCanvas.tsx`) to calculate exact tile drawing ranges on-the-fly based on camera pixel boundaries. Eliminates the exhaustive $O(N \times M)$ double-loop iteration across all 10,000 tiles (100x100), trimming the daily tile drawing pipeline down to only the 30-40 visible rows and columns in the active viewport.
- **Ultra-Fast State Fingerprint Generator**: Replaced the heavy, redundant `JSON.stringify` on the full character state with a flat, lightning-fast string builder. This eliminates megabytes of garbage allocations per turn, preventing browser-level GC pauses.
- **Fast First-Step BFS Pathfinding**: Redesigned the pathfinding search algorithm (`getNextStepTowards`) in `ai.ts` by replacing costly array-spreading (`[...path, ...]` in every branch) with a single-pointer `firstStep` tracking system. Reduces overworld and dungeon monster tracking computations from $O(V \cdot E \cdot L)$ to $O(V + E)$ space complexity, making enemy moves instantaneous.
- **Infinite Game-Log DOM Limiter**: Capped active DOM-rendered logs to the 150 most recent entries in `GameLog.tsx`. This keeps the browser DOM lightweight and highly performant over hours of play, while fully preserving log export integrity when downloading full session history.
- **Lazy Shallow Copy Real-Time Evaluator**: Restructured the real-time background ticker interval (`App.tsx`) to lazily initialize copies of large collections (like chunk maps and active enemies) only when siege conditions actively trigger. This reduces idle CPU overhead to near 0%.
- **Deep Rogue-Balanced Combat & Scaling Tweak**: Adjusted starting statistics (starting HP from 75 to 80, MP from 25 to 30) and increased level up safety margins (HP gain per level from 15 to 18, MP from 5 to 6). Rebalanced threat multipliers to prevent scaling from punishing player progression, reducing depth factor escalations by 28% and stat-matching offsets by up to 70%. Additionally, weapon base damages (e.g. Swords, Greatswords, Bows, Hammers) are increased by 10-18% to keep physical combat punchy and highly rewarding.

---

## [v3.9.8] — Legendary Feline Companions & "Cat Lover" Developer Memorial (July 20, 2026)
*Introduced four unique legendary feline companions spawning across overworld chunks, unique inspectable personality and temperament profiles, and a special "Cat Lover" developer memorial trait that boosts player Luck when all cats are met.*

- **Four Legendary Overworld Felines**: Players exploring the overworld can encounter four unique legendary cats with specific characteristics, custom colors, and role configurations:
  - **Jekku 🐈**: The playful orange trickster, mischievous and energetic (+3 ATK).
  - **Pulla 🐈**: The chubby golden-yellow companion, warm and obedient (+18 HP, +1 DEF).
  - **Alli 🐈**: The mystical silver-gray cat, dignified and regal (+1 DEF).
  - **Leevi 🐈**: The eternally angry battle cat, fierce and grumpy (+5 ATK).
- **Inspectable Retainer Personas**: Extended the Follower Inspect modal (`FollowerInspectOverlay.tsx`) to show specialized **Personality** and **Temperament** traits for all companions, bringing rich narrative flavor to your retainers' stats.
- **Developer Memorial "Cat Lover" Trait**: Meeting or hiring all four legendary cats unlocks the permanent **"Cat Lover" Special Trait** (+10 Luck) in memory of beloved real-life feline companions. Triggers a custom console log and prints a special, heartfelt message in the adventure logs.
- **Visual Trait Card**: Adds a beautifully styled, high-contrast emerald status card within the `UnifiedInventoryPanel.tsx` that details the "Cat Lover" trait and the luck modifier.

---

## [v3.9.7] — Scars of the Defeated & Effective Stats System (July 20, 2026)
*Introduced a dynamic physical trauma tracking system ("Scars of the Defeated") coupled with an on-the-fly "Effective Stats" calculator, eliminating direct stat-mutating bugs and adding rich risk-reward gameplay layers.*

- **Battle Injuries & Dynamic Scar Acquisition**: Suffered high-damage blows (dealing $\ge 12$ HP) or falling below 35% health triggers potential permanent battle scars (`evaluateScarAcquisition`) from 24 unique templates.
- **Fresh vs. Healed Healing Cycle**: Scars start as **Fresh (Healing)** for exactly **25 turns**, applying tender/inflamed debuffs to attributes. After mending, they become **Healed (Old)**, providing permanent hardened stat bonuses.
- **Dynamic Effective Stats Calculation**: Prevents permanent stat decay or glitches by computing effective attributes (`getEffectiveStats`) on-the-fly for player combat stats, inventory carrying capacity (weight changes based on physical condition), and character sheet displays.
- **God Panel Sandbox Controls**: Allows immediate manual injection of any battle scars to test active effects and character overlays under the Creator Lab tab.

---

## [v3.9.6] — Integrated Crafting & Alchemy Workbench (July 20, 2026)
*Consolidated survival "Life Skills" (Campfire Cooking & Alchemical Brewing) into the main Crafting Arcanum Workbench (Forge) panel to streamline navigation and remove redundant standalone HUD tabs.*

- **Consolidated Crafting Workstation**: Integrated culinary campfire cooking, Apothecary alchemical brewing, and lab upgrade controls directly into the Arcanum Workbench (Forge) interface, eliminating the redundant standalone top-level tab.
- **Enhanced Workbench Navigation**: Structured the Forge panel into logical sub-sections: Forge Equipment, Camp & Tools, Campfire Cooking, Alchemical Brewing, Mutation Forge, and Upgrade Gear.
- **Durable Life Skill Handlers**: Retained proximity-based campfire calculations (requires nearby active campfire tile to cook) and alchemical lab upgrade prerequisites matching existing material and gold economy formulas.
- **Architectural Cleanup**: Removed the standalone Life Skills tab from the main HUD navigation bar and deleted the obsolete `/src/components/LifeSkillsPanel.tsx` component, achieving a fully streamlined and performant client codebase.

---

## [v3.9.5] — Quest-Giver Assaults & Responsive Multi-Viewport HUD (July 19, 2026)
*Introduced tactical option to assault quest-giving travelers directly (failing their quests and turning them hostile) and engineered a fluid multi-viewport UI with custom compact HUD controllers for mobile screens.*

- **Interactive Quest-Giver Assaults**: Players interacting with Traveling NPCs can now choose to reject or betray their trust, initiating physical combat directly. Doing so instantly fails any active or available associated quest, registers the failure in the adventure logs, and transforms the NPC into an active hostile on the battlefield.
- **Fluid Multi-Viewport Responsiveness**: Re-engineered the CSS layout and viewport checks to guarantee full visual polish on mobile screens (widths < 1024px) as well as desktop displays.
- **Compact Mobile HUD**: Placed a dynamic HUD bar immediately above the game canvas in Mobile View, rendering status indicators for Vitals HP, Focus MP, Gold wealth, and Experience Level progress.
- **Mobile Environment Sub-Bar**: Created an details bar tracking current coordinates, active biomes or dungeon depths, town reputation standing, and dynamic Moon Phases with hover-tooltips for active blessings.

## [v3.9.4] — Roaming Outlaw Camps & Bored GM Interventions (July 19, 2026)
*Introduced dynamic overworld bandit camp spawns triggered autonomously when the Game Master is bored, complete with a dynamic lore monologue announcement, elite camp bandits, and on-demand GM panel commands.*

- **Roaming Outlaw Camp Spawn**: Spawns a small camp of 2-3 Outlaw Bandits around a newly lit wood campfire on walkable overworld tiles nearby.
- **Elite Camp Adversaries**: Populates the camp with an elite **Outlaw Bandit Leader** (85 HP, 11 ATK, 4 DEF) and auxiliary **Exile Camp Bandits** (55 HP, 8 ATK, 2 DEF) in aggressive **Chasing** AI states to actively pursue and engage the player.
- **Dynamic Lore Monologue Announcement**: Announces the spawn in-character with a descriptive monologue tracking the cardinal direction of the camp (e.g., *"🔥 LORE MONOLOGUE: You hear rowdy laughter and crackling wood nearby... A small Bandit Camp has set up campfire far to the [NORTH-EAST]! Go disperse them!"*).
- **Interactive Map Compass Pings**: Spawns a floating warning text indicator with directional compass tags guiding the player to the camp location.
- **GM Storyteller Integration**: Integrated under the storyteller's Mischievous, Sadistic, and Intrigued personas to trigger once the GM's boredom exceeds 30. Can also be triggered instantly via the GM Debug overlay.

## [v3.9.3] — Wilderness Traveling NPCs & Crime Witness System (July 18, 2026)
*Introduced a dynamic traveling NPC ecosystem across non-town overworld wilderness, complete with custom trading inventories, tactical gameplay advice, and a proximity-based visual crime witness detection system.*

- **Wilderness Traveling NPCs**: Procedurally spawns three types of travelers (Wilderness Hunters `🏹`, Wilderness Herbalists `🌿`, and Traveling Pilgrims `🚶`) in non-town, non-castle overworld chunks (50% spawn chance).
- **Theme-Appropriate Advice & Trading**: Added dedicated interactive dialog mechanics. Players can chat for specialized gameplay/lore advice, or trade with travelers using role-specific shops (Herbalists supply elixirs/potions, Hunters trade weapons/pelts, Pilgrims offer trinkets).
- **Proximity Crime Witness Engine**: Engineered a visual witness detection system that checks the viewport's visible tiles for any other active town citizens or faction members who can see the crime.
- **Unlawful Assault Consequences**: Attacking a traveler with nearby witnesses instantly drops town reputation by -35. Attacking them in total isolation (unwitnessed) lets you engage in combat without public reputation consequences, keeping your stealthy misdeeds completely secret!
- **Dynamic Combat Transition**: Programmed the NPC to instantly transition into an active, aggressive enemy (Hunters shoot ranged arrows, Herbalists and Pilgrims engage in melee) upon assault, seamlessly loading their combat stats into the turn-based engine.

## [v3.9.2] — Custom Structure Carving & Legend-Mapped Blueprint Designer (July 17, 2026)
*Introduced a customizable structural constructor and layout designer, enabling developers and players to carve predefined layout templates (Spawn Shelters, Arenas, Groves, Portals, and Watchtowers) with dynamic enemies, and load non-standard layout characters into standard designer slots using a custom legend dictionary.*

- **Modular Structure Placer & Presets**: Integrated the `carveStructure` routine (`src/utils/structurePlacer.ts`) with six predefined templates: *Cozy Spawn Shelter*, *Fenced Combat Arena*, *Mystic Dungeon Portal*, *Berry Forest Grove*, *Royal Tavern & Lounge*, and *Faction Watchtower Outpost*.
- **Dynamic Legend Blueprint Designer**: Extended `handleLoadPresetToDesigner` in `GodPanelOverlay.tsx` to read the custom `legend` mapping on blueprints. Dynamically maps non-standard characters from presets (like `W`, `S`, `K`, `F`, `X`, `+` in Watchtowers) to standard, editable designer tiles (Wall, Window, Floor, etc.) prior to grid loading, resolving loading limitations.
- **Sovereign Save & Live Rebuild**: Leveraged `handleApplyHousesJson` to allow saving, editing, and immediate live rebuilding of active overworld settlements.

## [v2.5.5] — Town Progression & Renown Expansion (July 17, 2026)
*Expanded the town ecosystem and reputation mechanics, introducing deep renown progression tiers, reputation-gated merchants and companion recruitment, town infrastructure upgrades, and outlaw pardon quests.*

- **Renown Progression Tiers**: Implemented four high-impact reputation milestones tracking player standing in the overworld:
  - *Sunder Outlaw (0-20)*: Hostile city guards attack on sight; town merchants refuse all business transactions.
  - *Wandering Mercenary (21-50)*: Standard trading prices; access to basic quest boards.
  - *Honored Protector (51-80)*: Unlocks a passive 10% discount on all merchant transactions.
  - *Champion of Sunder (81-100)*: Unlocks a permanent 20% discount; enables recruitment of elite heavy-plate City Guards as companion followers.
- **Dynamic Renown Dashboard**: Integrated a beautifully polished, interactive reputation tracker directly into the Quest Board Overlay, complete with progress gauges and active status indicators.
- **Village Infrastructure Investments**: Enabled player donations of gold and metal alloys to upgrade the Blacksmith and Apothecary. Upgrading these shops grants massive reputation bonuses (+8 to +15), boosts merchant stock, and unlocks high-tier gear/potion availability.
- **Outlaw Pardon Questline**: Outlaws can accept the specialized "Sunder Outlaw Pardon" quest to clear their crimes, restoring their standing to Wandering Mercenary.
- **Multi-tiered Merchant Discounts**: Fully integrated renown thresholds into the town trade loop, dynamically updating buying prices across the Blacksmith, Apothecary, General Merchant, and Tavern.

## [v3.9.1] — Faction Watchtower Garrisons, Tribute Chests & Siege Reprisals (July 16, 2026)
*Introduced high-altitude overworld watchtowers guarded by elite Syndicate and Vanguard faction garrisons, featuring rare faction-locked tribute chests, capture-the-flag overworld claiming, and active real-time siege reprisal events.*

- **Watchtower World Generation**: Spawns procedurally generated stone Watchtower fortresses at strategic wilderness crossroad chunks, containing battlements, elevated decks, and barricades.
- **Elite Garrison Defenders**: Populates watchtowers with elite, high-HP faction-specific defenders (Vanguard Knights, Syndicate Enforcers, and Tower Rangers) that actively guard the territory.
- **Faction Tribute Chests & Flag Claiming**: Integrates locked Tribute Chests inside watchtower vaults (containing rare alloys, catalysts, and coins), openable by acquiring the unique key dropped by the Tower Commander. Defeating the garrison allows the player to hoist their faction flag to claim the watchtower, spawning friendly reinforcements and generating passive taxes.
- **Dynamic Active Siege Reprisals**: Claimed watchtowers are subject to dynamic enemy faction reprisal assaults, spawning live siege battlegrounds of attackers and defending garrisons on the map.
- **Active Sieges HUD Widget**: Implemented a dedicated "📡 WATCHTOWER SIEGES" real-time status widget in the sidebar showing active siege coordinates, countdown timers, and combatant ratios.

## [v3.9.0] — Safe Player Spawning & Companion Faction Targeting (July 14, 2026)
*Engineered robust player coordinate safety guarantees to prevent getting stuck in trees/walls during transitions and teleports, and implemented refined companion targeting parameters so followers never attack allied or neutral guards unprovoked.*

- **Safe Player Spawning**: Extended layout safety guarantees to the player character across all overworld spawning events. Integrating the 20-tile scanning coordinate sanitizer `findNearestSafePlayerTile` prevents the player from spawning inside blocked tiles (e.g. walls, trees, water, and buildings) during initial placement, boundary chunk crossovers, caravan travel completions, and Recall Scroll teleports.
- **Companion Faction Targeting**: Configured companion followers (including special cats) to act with intelligent situational awareness. They will never attack town guards, peacekeepers, or allied caravan defenders unprovoked.
- **Dynamic Provocation Join-In**: Programmed followers to immediately join combat if the player actively provokes and attacks guards (which sets the global `areGuardsHostile` state to true), maintaining both immersion and reliable backup.

## [v3.8.9] — NPC Coordinate Sanitization & Wall Spawn Prevention (July 14, 2026)
*Engineered a comprehensive overworld layout-safety validation system to guarantee NPCs never spawn or relocate inside walls, mountains, trees, water, or other solid layout geometry.*

- **Layout-Safety Validation Rule**: Added a solid-tile safety filter checking coordinates for any overlapping blocking geometry (`Wall`, `Window`, `Tree`, `PineTree`, `BirchTree`, `CopperVein`, `IronVein`, `Water`, `Table`, `Campfire`, `Empty` types).
- **Automated Spiral Pathfinding**: Implemented a robust 20-tile radius multi-layered spiral scanner that dynamically relocates NPCs to the nearest safe, walkable tile in case of random shifts or overlapping buildings.
- **Schedule Alignment**: Coherently sanitized active coordinate points as well as sleep/work schedule targets (`homeX`/`homeY` and `workX`/`workY`) to completely eliminate schedule-related navigation clipping inside stone walls.

## [v3.8.8] — Immersive Storyteller Narratives & Tiered Loot Rarity (July 14, 2026)
*Overhauled GM and God actions to maintain total player immersion inside the narrative logs, and engineered a comprehensive tiered loot quality matrix to make superior weapons and armors scarce and highly rewarding.*

- **Immersive Narrative Logs**: Overhauled all active GM storyteller event logs, debug commands, and divine care-package outputs to remove mentions of "GM Storyteller" or "God Gift". All logs are written in-character to describe organic world events (e.g., healing breezes, finding forgotten caches).
- **Tiered Loot Rarity Matrix**: Integrated a 5-tier loot quality system (Common: gray, Uncommon: green, Rare: blue, Epic: purple, Legendary: orange) with lower drop chances for high-quality items.
- **Dynamic Stats & Pricing Scaling**: Configured rolled items to automatically append custom stylistic prefixes (e.g. *Sturdy*, *Exquisite*, *Sky-Splitter's*) and scale stats/defense/damage and value based on the rolled rarity.

## [v3.8.7] — Universal Equipment Loot Drops & Rare Necklace Probability (July 14, 2026)
*Overhauled enemies and chest drop lists to ensure all types of equipment (helmets, gauntlets, boots, shields, armor, weapons) are fully lootable with their correct subtypes, and configured necklaces/amulets as rare, rewarding finds with passive attribute rolls.*

- **Universal Equipment Looting**: Introduced a comprehensive equipment generator (`generateRandomLootGear`) to dynamically drop weapons, shields, gloves, helmets, boots, and body armors, perfectly assigning them their matching `subType` for slot compatibility.
- **Rare Necklace Probability**: Balanced Necklaces/Amulets (`Amulet` subtype) to drop as a rare item (5% from regular enemies, 10-15% from chests and boss battles), delivering exciting passive attribute stat modifications (+DEX, +STR, +INT, +LCK, +CHA).
- **Epic Boss & Dragon Treasures**: Mapped specific high-tier items with flavor descriptions and epic multipliers for legendary boss fights (Surtur, Otso, Louhi, Elder Dragons), ensuring legendary gear drops map to their precise equipment slots.

## [v3.8.6] — Dual-Hand Combat Durability & Gauntlets/Neck Piece Armor Separation (July 14, 2026)
*Overhauled physical weapon and shield combat durability degradation systems to correctly track damage across both slots, separated Gauntlets and Neck Pieces into distinct independent equipment categories with separate recipes and paperdoll slots, and introduced damage-based inventory sorting in the blacksmith repair shop.*

- **Dual-Hand Combat Durability**: Overhauled physical melee and defensive blocking durability decay. Attacks and blocks cleanly reduce durability for both the Right Hand (weapon) and Left Hand (shield/weapon) slots, correctly handling dual-wielding, broken weapons, and shield absorption rates while processing cumulative combat damage mathematically in `effectiveWeaponDamage`.
- **Armor Separation (Gauntlets & Neck Pieces)**: Disentangled the legacy combined equipment slots to establish separate **Gauntlets** (`Gloves` type, 🧤 emoji) and **Neck Pieces** (`Amulet` type, 📿 emoji) as fully independent categories.
- **Unified Inventory Integration**: Configured dedicated blacksmithing recipes, alchemical mutations, shop catalogs, and paperdoll visual slots on the `UnifiedInventoryPanel.tsx` component, including separate unequip handlers.
- **Smart Repair Shop Inventory Sorting**: Configured the blacksmith repair shop inventory backpack list to automatically sort equipment by wear: broken items (0% durability) bubble to the top, followed by partially damaged items, and pristine items at the bottom.
- **All-Green Verification**: Confirmed flawless compilation and linting runs with zero errors or warnings.

## [v3.8.5] — Codebase Audit, Verification & Markdown Documentation Alignment (July 12, 2026)
*Conducted a comprehensive codebase modularization check, verified clean compilation and linting runs with zero errors or warnings, ensured absolute alignment across all technical markdown guides, and improved project structure.*

- **Sovereign Codebase & Module Audit**: Fully audited all modular components in `/src/components/` and utility files in `/src/utils/`. Ensured that complex, heavy-weight components like `GodPanelOverlay.tsx` (containing sovereign controls and sandboxes) maintain stable type interfaces.
- **Verification Integrity**: Ran both production compiler builds and strict TypeScript linter checks, successfully confirming zero structural errors, zero implicit returns, and clean build logs.
- **Unified Markdown Alignment**: Synchronized master features in `FEATURES.md`, historical milestones in `VERSIONS.md`, active backlogs in `todo.md`, and architectural overviews in `DEVELOPERS.md` and `README.md` to ensure absolute consistency for developers and players alike.

## [v3.8.0] — Caravan Escort Hardcore Scaling & Versatile Safehouse Companions (July 10, 2026)
*Amplified Caravan Escort road event frequencies, increased stat check difficulties, integrated interactive tab scroll controllers, added the Scroll of Recall, unified Hero Profile with active battle scars, and expanded the safehouse system so any companion follower can protect your remote outposts.*

- **Hardcore Caravan Escort Difficulty**: Scaled caravan journey threats. Event trigger probabilities raised to a near-guaranteed 85% per travel step. Boosted all interactive road encounter check DCs (raising stat check DCs to 17-19) and significantly inflated toll gold costs (500g) and repair materials (15x berries, 8x iron ore, 18x planks). Doubled check-failure penalties to up to -28 HP damage and up to +45% physical Exhaustion.
- **Universal Companion Safehouse Guards**: Dismantled the strict requirement for the specialized *Merchant Guard* follower archetype to build outposts. Any recruited companion follower in your active party can now be designated as the permanent Safehouse Guardian.
- **Dynamic Safehouse NPC Customization**: Commissioned outposts preserve the specific guard's name, custom character glyph, and visual colors. Features custom localized dialogues referencing the companion by name.
- **Interactive Clickable Navigation Arrows**: Solved tab scrollability and discoverability constraints by building dual absolute-positioned, clickable left (◀) and right (▶) arrow buttons overlaying the tab bar, enabling instantaneous smooth scrolling for both desktop and mobile players.
- **Scroll of Recall Loot Injection**: Introduced the rare `scroll_town_recall` (Scroll of Recall) into the surface economy (available in Seppo's drunk merchant shop and as a 5% rare chest loot drop). Teleport instantly using `/src/components/RecallScrollOverlay.tsx` to Oakhaven Town, Central Outpost, or any discovered Wilderness Safehouses.
- **Hero Profile & Scar Overlay**: Integrated the hero character sheet into the main "Hero Profile, Party & Backpack" tab. Added a real-time battle scar counter that renders visual wound scratch overlays on the avatar wireframe based on active player scars.

## [v3.7.0] — Enchanted Forged Artificer & Exotic Gear Overhaul (July 9, 2026)
*Decoupled and retired the legacy overworld riding mounts system, fully replacing it with an elegant "Forged Enchantments" passive armor trait system and introducing the Enchanted Artificer Merchant.*

- **Mount Retirement**: Safely dismantled all code paths, variables, and state markers associated with mounting/dismounting riding steeds (horses, camels, worgs, crocodiles).
- **Artificer Caravan Merchant**: Replaced traveling breeders with a specialized traveling caravan Artificer who crafts and sells rare pre-enchanted exotic armor pieces.
- **Forged Passive Gear Traits**: Engineered custom trait-bearing armor items that grant permanent utility when equipped:
  - **Stallion-Sprung Greaves 🥾** (*Stallion Speed*): Boosts overworld travel speed (3m/turn travel cost).
  - **Dune-Treader Sabatons 🐫** (*Desert Immunity*): Negates desert sandstorm blindness and heat fatigue.
  - **Worg-Spiked Gauntlets 🧤** (*Worg Force*): Adds +3 physical attack damage and pacifies aggressive wild wolves.
  - **Crocodile Bayou Sabatons 🐊** (*Swamp-Glide*): Allows extreme swamp pathing speed (2m/turn) and walking safely over open water.
- **Aesthetic Active Enchantments UI**: Implemented an automated status block within the player HUD displaying all currently equipped "Forged Enchantments" with elegant indicators and dynamic descriptions.
- **Weather & Climate Resistance Alignment**: Unified weather engine climate penalties with player-equipped traits, mapping physical resistances directly to armor selections.

---

## [v3.6.8] — Declarative World Generation & Meteorological Settings (July 6, 2026)
*Externalized all overworld map generation parameters, temperature/moisture biome boundaries, regional weather weight ratios, and biome-specific environmental hazard statistics into a dedicated WorldConfig database file.*

- **Modular World Config (`worldConfig.json`)**: Established a standardized, easily configurable game database defining biome boundaries and climates.
- **Dynamic Whittaker Biome Mapping**: Rewrote `getOrganicBiome` to load and test bounds dynamically from JSON thresholds, separating geography from hardcoded values.
- **Dynamic Weather Samples**: Updated `generateOverworldChunk`'s weather picker to execute a cumulative probability roll driven entirely by JSON weather frequency weights.
- **Dynamic Environmental Hazards**: Refactored lake counters, trap volume triggers, chest spawn frequencies, and roaming monster populations to generate organically using biome hazard stats from the config.

---

## [v3.6.7] — Domain-Specific Engine Modularization & Code Cleanup (July 6, 2026)
*Refactored the sprawling codebase to decouple core engine sub-systems, game loops, static data profiles, and spellcasting mechanisms from layout components into dedicated domain utilities, substantially boosting project maintainability and compilation speed.*

- **Atmospheric Weather Engine (`weatherEngine.ts`)**: Modularized weather cycle configurations and climate matrices. Unifies standard penalties, forged equipment immunities, and spellcasting amplifiers (e.g. wet paths, sandstorm-induced blindness, frozen tundra blizzards).
- **Magical Spellbook & Starting Equipment (`spellsAndEquipment.ts`)**: Decoupled wizard spell metadata (Arcane Bolt, Pyroblast, Frostbite Lance, Storm Strike, Poison Dart, Shadow Orb) alongside default loadout structures.
- **Dynamic Trade Catalogs & Stocking Pools (`shopData.ts`)**: Decoupled daily merchant stock generators and purchase prices for Blacksmiths, Town General Merchants, Taverns, and Wandering Seppo's secret shop.
- **Comedic Panic Dialogue Generation (`fleeQuotes.ts`)**: Decoupled fleeing quotes for wildlife (Deer, Boar, Goat), coward goblins, skeleton units, and heavy orc brutes.
- **Caravans & Geopolitical Territory synchronization (`caravanAndTerritory.ts`)**: Refactored Oakhaven town caravans, traveling guards, and territorial data conquest bounds.

---

## [v3.6.6] — Runic Trap Detection & Scouting Mastery (July 5, 2026)
*Enhanced dungeon and overworld exploration with a complete procedural trap detection and active disarming system, a new Scouting level/XP progression track, and a custom status sheet readout.*

- **Procedural Camouflaged Traps**: Upgraded overworld biome hazards (swamps, tundras, deserts) and procedural dungeons to generate traps in a fully hidden and unrendered state until detected, rewarding slow, mindful movements.
- **Turn-based Perception Checks**: Engineered an automatic perception scanning sweep that rolls each turn for hidden traps in a 2-tile radius. Detection success scales dynamically with player Dexterity, Luck, and active Scouting Level.
- **Interactive Disarm Mechanics**: Attempting to step on a detected trap triggers an interactive d20 Disarm check. Modifiers are based on Dexterity and Scouting level against trap DC ratings. Success clears the trap safely, granting XP. Failure triggers the trap immediately.
- **Scouting XP & Leveling Track**: Awarded +15 Scouting XP for spotting traps and +25 Scouting XP for successful disarms. At 100 * Level XP, the player advances their Scouting rank, boosting perception rates and disarm modifiers.
- **Aesthetic Stats Page Expansion**: Added a beautifully integrated Scouting & Trap Detection panel within the Character Sheet displaying active level, progress bars, current perception chances, and total disarm roll modifiers.

---

## [v3.6.5] — Finnish Mythology & Epic Rune-Songs Expansion (July 5, 2026)
*Infused the game world of Sunder with rich Finnish folklore, including a complete 10-chapter Sunder-Finnish History Book, biome-themed runic points of interest, Finnish Mythology GM Interventions, and myth-rich narrative flavor text.*

- **10-Chapter Sunder-Finnish Lore Collection**: Added a cohesive historical collection within the interactive History Book detailing Sunder's creation:
  - *Chapter I: The Primordial Egg of Creation* (Ukko's first spark)
  - *Chapter II: The Ancient Rune-Singers* (Spell-songs/Laulut)
  - *Chapter III: Ahti's Ocean Wrath* (Drowning of Kenneth's keep)
  - *Chapter IV: The Song-Giant Antero Vipunen* (Sleeping titan)
  - *Chapter V: The Volcanic Crucible of Pohjola* (Ilmarinen's hot furnaces)
  - *Chapter VI: The Forging of the Sampo* (The prosperity mill)
  - *Chapter VII: Tapio's Evergreen Kingdom* (Forest and queen Mielikki)
  - *Chapter VIII: The Swan of Tuonela* (The dark boiling underworld river)
  - *Chapter IX: Ukko's Golden Hammer* (The first seed of fire)
  - *Chapter X: Louhi's Northland Frost* (Stealing the spring sun)
- **Runic Points of Interest (POIs)**: Redesigned overworld POIs to procedurally spawn as iconic Finnish myth landmarks based on current biome:
  - **Forest**: *Väinämöinen's Rune Stone*, *Shattered Sampo Fragment*, and *Tapio's Evergreen Grove*.
  - **Swamp**: *The Gates of Tuonela* and *Vellamo's Healing Spring*.
  - **Tundra**: *Ribs of Antero Vipunen* and *Louhi's Frost Obelisk*.
  - **Desert**: *Forge of Ilmarinen* and *Ukko's Lightning Bolt*.
- **Finnish Myth GM Interventions**: Programmed three high-immersion divine events into the Game Master storyteller engine:
  - **Ukko's Golden Bolt**: Ukko Ylijumala strikes the nearest hostile with sky-sparks, dealing 35 Damage and restoring +10 MP to the player.
  - **Väinämöinen's Rune-Song**: The Eternal Bard sings ancient verses that heal the player for +25 HP and pacify chasing enemies into calm patrolling states.
  - **Mielikki's Honey Drop**: The Forest Queen drops a pack containing a Campfire Grilled Fish and a Prime Flame-Grilled Steak.
- **Narrative Lore Infusion**: Expanded the Game Master's ambient navigation log messages with references to Finnish mythology, reflecting ancient bards, magical smithies, and arctic frost sorceries.

---

## [v3.6.0] — Underworld Depths & Legendary Biome Bosses (July 5, 2026)
*Introduced a massive deep-game expansion featuring 10 full dungeon floors, the molten basalt Underworld Depths environment, boiling hazard lava pools, and catastrophic colossal Legendary Biome Bosses guarding ancient wilderness ruins.*

- **Extending Abyss to 10 Dungeon Floors**: Expanded the dungeon generator depth limit from 5 to 10. Reaching floor 10 leads to the ultimate magma chamber.
- **The Underworld Depths (Floors 6-10)**: Created a new thematic environment with glowing basalt floor cracks, molten obsidian stone walls, and high-contrast volcanic aesthetics on the game canvas.
- **Molten Lava Pool Hazards**: Infused procedural lava pools across Underworld floors. Stepping on lava deals 8 Fire Damage, triggers physical damage shakes, and generates screen-space magma splatter effects.
- **Climactic Overlord Boss "Surtur"**: Programmed a guaranteed climactic battle at depth 10 against *Surtur the Magma Arch-demon* featuring colossal health, massive physical multipliers, and unique fire-themed legendary drops (Surtur's Molten Greatsword, Magma Sovereign Plate).
- **Colossal Legendary Biome Bosses**: Added four colossal biome-appropriate bosses spawning inside procedural overworld ruins guarding high-value chests:
  - **Forest**: *Sylvanus, the Verdant Behemoth* 🌳
  - **Desert**: *Sekhmet, the Searing Dune Sovereign* 🦂
  - **Tundra**: *Ymir, the Frost-Weaver Titan* ⛄
  - **Swamp**: *Charybdis, the Slime-Feaster* 🦠
- **Victory Condition Expansion**: Updated the game victory event to trigger when the player successfully conquers Floor 10 and descends past Surtur's chamber, bringing peace to the overworld.

---

## [v3.5.0] — Dynamic Faction Wars & Territory Conquest (July 4, 2026)
*Introduced a fully integrated, persistent faction territory conquest engine and tactical war room console. Players can now govern territories, collect passive materials/gold taxes, finance their allied faction war chest, and deploy war directives.*

- **Procedural Faction Territories**: Expanded the world schema with five unique geographical territories (Borderlands, Shadow Fjord, Moonshadow Cove, Sunplate Ridge, Swamp of Whispers) that track active faction control, control percentages, and active climate bonuses.
- **Faction War Room Dashboard**: Built a beautiful tactical dashboard inside the Guild Overlay to manage faction stood, view ownership gauges, claim accumulated tax resources, and review active territory buffs.
- **Background Taxation & Collection Loops**: Hooked per-turn tax multipliers to generate passive gold and resource deposits for any territories controlled by the player's allied faction.
- **War Chest Finance & Directives**: Enabled players to contribute gold to their aligned faction's War Treasury in exchange for reputation. Spent faction treasury reserves to deploy powerful strategic directives (Vanguard Aegis Dome, Syndicate Venom Traps) that dynamically shift territory percentages.
- **Defeat-to-Conquest Triggering**: Defeating faction soldiers or outlaws on the overworld map dynamically affects nearby territory control percentages, simulating a real-time responsive war landscape.

---

## [v3.2.5] — Sandbox Teleport Crash Isolation & Boundary Sync (July 4, 2026)
*Resolved a critical overworld chunk generation crash by unifying teleport-to-chunk layouts with our standard 64x40 jumbo chunk dimensions.*

- **Sovereign Teleport Dimension Sync**: Corrected the God Panel's chunk generator coordinates from the hardcoded `50x30` template to the standard `64x40` dimensions (`LEVEL_WIDTH` and `LEVEL_HEIGHT`).
- **Initial Spawn Coordinate Bounds**: Updated the teleport player destination coordinate markers from `(25, 15)` to the standard center-weighted position `(32, 22)`, perfectly aligning the player on safe tile grids.
- **Out-of-Bounds Crash Prevention**: Eliminated `undefined` reference exceptions and rendering freezes when players walked or crossed chunk boundaries after utilizing God Panel shortcuts, restoring 100% stable chunk loading loops.

---

## [v3.2.4] — Grimoire Magic Spell Tuning & Wands (July 3, 2026)
*Introduced an interactive Grimoire spellcasting book overlay that dynamically adapts based on equipped magical staffs or wands, allowing real-time spell swaps and mana reduction synergies.*

- **Dynamic Grimoire Sidebar Section**: Programmed the player's active weaponry widget to automatically inject a magical grimoire menu when wielding a magical Staff or Wand.
- **Spell Selector and Previews**: Enabled immediate selection from five prime magical spells (Fireball, Icicle, Lightning Shock, Poison Dart, Shadow Orb), complete with tooltips showing exact damages, durations, and dynamic costs.
- **Wand Mana Conservation Synergies**: Integrated automatic cost reductions that lower spell costs by `-1 MP` (with a hard floor of 2 MP) when casting through light, agile magic Wands, adding high-tier strategic reward paths.
- **Synchronized Combat Logs**: Linked grimoire selections to real-time spellcast outputs, providing clean combat flavor descriptions in the primary chronicles feed.

---

## [v3.2.3] — Overworld Caravan Escort Travel Journeys (July 3, 2026)
*Added a full-featured, interactive overworld Caravan Escort service enabling players to journey between distant discovered town locations through a rich series of road encounters and d20 checks.*

- **Overworld Caravan Transit**: Created a full-featured transit state that initiates a multi-step journey between overworld towns with scenic, turn-by-turn road logs.
- **Five Specialized Road Event Templates**:
  - **Bandit Ambush**: Fight with a d20 Strength/Dexterity check, intimidate with Intellect, or pay a 150 gold coin bribe.
  - **Beast Attack**: Hack down wolves with a Strength test, intimidate them, or feed them berries/meat.
  - **Rockslide Obstacle**: Shift boulders with raw Strength or build timber fulcrums with Luck/Intellect.
  - **Holy Pilgrim Encounter**: Receive a divine blessing that fully heals HP/MP and purges all fatigue.
  - **Broken Axle**: Repair the wagon axle using iron ore or wood planks, or suffer fatigue from manual repair.
- **Renown & Treasury Payouts**: Safely guiding the carriage to its destination awards significant XP, town reputation, and gold coins.

---

## [v3.2.2] — Retro Sprite Sheet Future-Proofing & Tactile Universal Soundscapes (July 2, 2026)
*Paved the way for rich custom artist assets with a comprehensive, animatable SpriteSheet rendering pipeline, and introduced universal button-push soundscapes with specialized eating and drinking synthesis.*

- **Future-Proof SpriteSheet Pipeline**:
  - Integrated a master `SpriteSheetConfig` that supports specifying coordinates (`sx`, `sy`), custom sizes, and multi-frame animation loops (e.g. animated campfires, torches, flowing rivers, or running character sequences) triggered by a continuous render frame tick counter.
  - Developed a unified canvas drawing routine `drawSpriteOrAscii` that gracefully maps game elements, biomes, enemies, and traps to spritesheets while seamlessly falling back to high-contrast retro ASCII/Unicode when disabled.
- **Universal Button Soundscape**:
  - Engineered a global pointerdown event listener that captures clicks on any and all HTML `<button>` elements in the application, playing an extremely polished, high-fidelity tactile feedback tick (`click`) immediately.
  - Created bespoke, delicious eating and gulping synthesizer models (`eat` and `drink`) to play juicy chewing crunches or liquid swallowing gulps when the player consumes meat, bread, berries, beers, or Seppo's secret hooch.

---

## [v3.2.1] — Advanced Audio Synthesis & Soundscape Overhaul (July 2, 2026)
*Overhauled the Web Audio API sound generator to produce bespoke, retro-style synthesized sound effects for advanced activities like weapon forging, chaotic transmutations, tool construction, and precision lockpicking mechanical feedback.*

- **Heavy Metal Forging Synthesis (`forge`)**: Designed a heavy, dual-oscillator anvil hammer impact clang (detuned sawtooth and sine wave ringing pitches) blended with an authentic white-noise water-quenching thermal hiss (AudioBuffer random signal with a sweeping bandpass filter).
- **Chaotic Gear Mutation Sound (`mutate`)**: Engineered an unstable quantum transmutation effect featuring an exponential rising frequency sweep modulated by a 40Hz low-frequency oscillator (vibrato/phase warping) followed by a brilliant, sparkling chime.
- **Rhythmic Tool Assembling (`craft`)**: Integrated an elegant wood/light-metal tapping sequencer (rhythmic triangle waves) followed by a major-third ascending sine chime to represent crafting fishing poles, lockpicks, and other apparatus.
- **Precision Lockpicking Feedback**:
  - **Mechanical Tumbler Clicking (`lockpick_click`)**: Programmed a high-frequency, envelope-controlled highpass filtered click representing fine pick rotation and mechanical tension warnings.
  - **Tension Snap Breakage (`lockpick_snap`)**: Added a sharp, snapping sawtooth-square rupture sound triggered when a lockpick shears under high stress.
  - **Heavy Lock Unlock (`unlock`)**: Formulated a heavy double-tumbler steel rotation and sliding latch deadbolt sound for plundering chests.
- **Wired Game Handlers**: Connected all specialized synthesized sounds to their respective UI actions and triggers, eliminating silent craft events and replacing generic chime fallbacks.

---

## [v3.2.0] — Double-Edged Dungeon Shrines & Curses (July 2, 2026)
*Introduced a mystical system of procedurally spawned interactive shrines throughout the dungeon depths. Activating them grants powerful permanent attribute boosts and floor reveals, but inflicts severe immediate costs and long-lasting combat curses.*

- **Procedural Dungeon Shrine Spawning**: Programmed randomized level generation to place exactly 2 unique double-edged shrines or altars on every dungeon floor, ensuring high replayability and strategic choices.
- **Six Unique Shrine Templates**:
  - **Shrine of Forbidden Strength (⛧)**: Grants +4 Strength permanently, but siphons -15 HP and inflicts the *Curse of Vulnerability* (-5 Physical Defense for 40 turns).
  - **Shrine of the Blind Oracle (🔮)**: Fully reveals the current dungeon floor layout and grants +3 Intellect permanently, but inflicts *Cursed Sight* (-5 Atk and -15% Critical Chance for 45 turns).
  - **Shrine of Blood Transfusion (🧪)**: Grants +12 Max Mana and fully restores all Mana, but drains -15 HP instantly in a blood sacrifice.
  - **Altar of the Covetous Greed (🏺)**: Grants +250 Gold instantly, but inflicts *Cursed Weight* (-2 Attack and -2 Defense for 30 turns).
  - **Shrine of the Reckless Berserker (⚔️)**: Permanently grants +15% Critical Strike Chance, but permanently consumes -20 Max HP.
  - **Altar of the Chrono-Shift (🌀)**: Grants +3 Dexterity permanently, but inflicts +30 physical exhaustion points immediately.
- **Interactive Acceptance Banner**: Integrated a smooth, responsive action banner inside the primary dungeon tab viewport that alerts players when they are adjacent to an untouched shrine and allows them to accept its double-edged power.
- **Visuals & Log Chronicle**: Triggers sound effects, floating spell feedback text, and publishes high-contrast alerts directly to the adventure log tracking the blessing and curse.

---

## [v3.1.4] — Balanced Adversary Regeneration & Combat Scaling (July 2, 2026)
*Tuned down passive enemy health recovery mechanisms and siphoned lifesteal factors to make tough battles challenging yet completely winnable.*

- **Vampiric & Blood Moon Lifesteal Capping**: Slashed hostile lifesteal ratios from 50%-60% down to 15%-20% of strike damage. Implemented a strict 4 HP healing cap per enemy strike to prevent runaway recovery cycles.
- **Troll Passive Recovery Tuning**: Decreased the turn-by-turn overworld and dungeon Troll regeneration rate from +3 HP to a steady +1 HP, allowing players to consistently defeat them.

---

## [v3.1.3] — Permanent Attribute Allocation & Secure Level Up Guard (July 2, 2026)
*Secured the Level Up attribute spent system by making all stat allocations permanent and final. Removed decrementing controls (`-` buttons) to avoid exploits or illegal status refactoring after level milestones.*

- **Permanent Stat Allocation**: Enforced that allocated attribute points (Strength, Dexterity, Intellect, Charisma, Luck) are final and permanent. 
- **Premium UI Cleanup**: Removed the subtracting `-` buttons completely from the Character attributes tab. Designed a single, glowing `+` indicator that active-pulses whenever the adventurer has unspent stat points.
- **Backend Protection**: Hard-coded a safety boundary check in `handleAdjustAttribute` preventing any negative stat adjustments under any conditions.

---

## [v3.1.2] — High-Performance Component Modularization & Scalable Mobile UI Checks (July 1, 2026)
*Decoupled the inline chunk minimap renderer into a fully optimized, separate memoized component (`ChunkMinimap.tsx`), resolved TypeScript compilation type mismatches, and conducted comprehensive mobile and desktop layout responsiveness checks.*

- **Modular Chunk Minimap Component**: Extracted and modularized the overworld coordinate-scanning mini-map into `/src/components/ChunkMinimap.tsx`, utilizing `React.memo` to eliminate unnecessary rendering overhead during fast turn ticks.
- **Robust Type Alignment**: Cleaned up the component's internal properties, changing the `map` property type to the robust `TileType[][]` enum matrix, resolving compiler type-overlap warnings and restoring pristine type-safety.
- **Responsive Layout Auditing**: Verified that both Windows (Desktop) and Mobile views remain highly responsive. The horizontal scrolling navigation tabs prevent UI breaking or squishing on small mobile screens.
- **Complete Feature Access**: Ensured that stats, primary attributes, equipped paperdoll gear, and the interactive carrying weight gauge are fully readable under the 'Character' tab on mobile view, providing a balanced experience even when the left desktop sidebar is hidden.

---

## [v3.1.0] — Dungeon Captives & Freedom Fighters (June 30, 2026)
*Added procedurally spawned caged captives inside dungeons who can be freed to fight alongside you as autonomous, independent combat helpers.*

- **Dungeon Depth Captive Spawning**: Programmed randomized, room-based cage generation creating named captive types (e.g. Caged Cleric, Captive Miner, Trapped Wanderer) bound under locked glyph markers (`🔒`/`⛓️`).
- **Seamless Bump-to-Free Action**: Rewrote the standard bump attack sequence. Walking into a captive cage breaks them out of captivity instantly with high-feedback level-up sound cues, floating "🔓 FREED!" effects, and dialogue messages of eternal gratitude.
- **Autonomous Monster Hunting**: Enabled an independent, non-companion AI pathfinding state for freed captives. They autonomously seek out, chase down, and strike monsters with custom melee hits, and will randomly wander the corridors if the immediate vicinity is cleared.
- **Dynamic Monster Aggro & Retaliation**: Programmed hostile dungeon monsters and spellcasters to actively target, pathfind, and retaliate against freed captives.
- **Full Obituary & Corpse Logging**: If a captive helper falls in combat, they die permanently, triggering red impact blood splatters, placing their physical skull corpse on the map, and printing an obituary message in the combat log.

---

## [v3.0.0] — Abyssal Horde: New Dungeon Denizens & Legendary Bosses (June 30, 2026)
*Introduced six new high-threat dungeon enemy templates, adaptive deep-dungeon weighted spawning algorithms, custom ranged projectile actions, lifesteal triggers, and six legendary boss encounters.*

- **Six New Creature Templates**: Integrated Ghost (`👻`), Vampire (`🧛`), Slime (`🧼`), Spider (`🕷️`), Necromancer (`🧙`), and Dread Knight (`⛓️`) into standard enemy spawning sheets.
- **Deep-Dungeon Adaptive Spawning Pool**: Developed an algorithmic weighting matrix. While depth 1 features common rats and scavenger goblins, deeper floors procedurally filter these out and swamp the player with high tiers of vampires, necromancers, ghosts, and dread knights.
- **Ranged Magic Casts & Projectiles**: Integrated Ghost and Necromancer templates into the ranged AI routine, casting custom shadow orbs and ghostly phantasmal echoes with beautiful colored projectile animations on turn completion.
- **Vampiric Lifesteal Combat Triggers**: Programmed fledgling vampires to trigger immediate health siphon siphoning 60% of dealt melee strike damage back into their HP pool.
- **Six Legendary Bosses Added**: Spawned custom-threat bosses featuring higher scale multipliers, unique titles, descriptions, and glyph representations (e.g. Lord Vladis Nocturna, Archlich Kel'Thuzar, Sir Kaelen).
- **All-Green Verification**: Fully compiled and verified stable under all testing profiles.

---

## [v2.9.9] — Visceral Kinematics: CSS Damage Shakes & Fluid Blood Drips (June 30, 2026)
*Introduced a dynamic CSS-based kinematic animation package. This includes high-performance shake feedback for both player and enemy characters taking damage, along with a beautifully animated, fluid-dropping blood splatter system that decays dynamically over a series of turns on the floor.*

- **Kinematic Character Damage Shake**: Integrated a customized `@keyframes sprite-shake` animation using a non-linear cubic-bezier timing function. Whenever a character (the player or any enemy) takes damage, their canvas-overlay sprite briefly shakes in a realistic, staggered kinetic vibration with drop-shadow glows and brightness boosts.
- **Fluid Blood Splatter Drips**: Implemented absolute CSS-animated overlay structures replacing static canvas renderings for active blood splatters. These feature a high-fidelity vector-dripping vector shape styled with a `@keyframes blood-drip` entrance sequence, realistic decay, and turn-based fading opacity.
- **All-Green Verification**: Fully compiled, linted, and verified stable.

---

## [v2.9.8] — Wilderness Factions, Camps & Escapes (June 30, 2026)
*Introduced a comprehensive faction campsite system, unique interactive camp leaders with customized dialogue, customized faction enemies, detailed reputation standing adjustments, and an active Escape Alarm pursuit mechanic with boundary crossing evasions.*

- **Procedural Faction Camps Spawned**: Moonshadow Syndicate and Dawn Vanguard camps generate procedurally on overworld chunks with specialized flags, faction-specific lockpicked chests, campfires, and guards.
- **Interactive Leaders (Silas & Valerius)**: Silas (Syndicate) and Valerius (Vanguard) NPCs spawn at their respective camps, offering rich, branching interactive dialogue trees with options to declare allegiance or request faction gear.
- **Durable Standing & Fallout Mechanics**: Standard faction guards are neutral and will remain in passive patrol routes unless attacked or provoked. Attacking a faction guard deducts reputation standing dynamically.
- **Vault Raiding & Escape Pursuit Alarms**: Trespassing and opening faction chests without proper allegiance triggers the **Escape Alarm** for that faction. This drops standing by -20 and instructs all faction members in the chunk to hunt and pursue the player aggressively.
- **Chunk Boundary Escape Mitigation**: Moving past overworld chunk boundaries successfully clears any active faction pursuit alarm, logging a narrative escape message of slipping away.
- **All-Green Verification**: Passes all type-safety and regression checks with zero errors.

---

## [v2.9.7] — Sunder Secure Lockpicking Mini-Game & Tension Wire Forging (June 29, 2026)
*Introduced an immersive, interactive skill-based lockpicking mini-game for chests in hostile outlaws camps and dungeons. Players can forge lockpicks from iron wire, purchase stock from town merchants, and attempt to unlock chests by navigating target sweet spots while managing tension torque and pick stress.*

- **Interactive Lockpicking Mini-Game**: Replaced instantaneous chest opening with a high-fidelity cylinder rotating simulation. Players steer the lockpick angle and apply screwdriver tension torque.
- **Lockpick Stress, Damage, & Snap Mechanics**: Stressing jammed picks heats and degrades durability, eventually snapping the wire and consuming 1x lockpick.
- **Tension Wire Crafting & Forging**: Added a crafting recipe to the survival panel allowing players to forge 3x Tension Lockpicks using 1x Tempered Iron.
- **Merchant Stocks Upgraded**: Merchant caravaneers, general town merchants, and tavern masters now stock Tension Lockpicks.
- **Perfect Performance & Lockpicking Experience**: Perfect unlocks with zero pick stress grant +25g bonus, a free elemental catalyst shard, and players earn +40 Lockpicking XP on successful opens.
- **Automated Smoke Test Validation Expanded**: Expanded step 10 of the diagnostics suite to simulate discovering, wire crafting, tensioning, and opening locked chests successfully.

---

## [v2.9.6] — Quality Assurance, Extended Scar Database & Compact Chronologue Logs (June 29, 2026)
*Conducted a comprehensive game mechanics audit focusing on fishing/cooking, enemy loot drops, and character stat security. Expanded the trauma scar database and introduced an ultra-readable 'Compact' view toggle for the adventure log.*

- **Secure Stat Progression**: Verified and enforced rigorous boundary guards preventing any possible attribute reduction below base points across all levels and session events.
- **Enhanced Trauma Database**: Expanded the available physical scars with premium, high-fidelity entries (e.g. *Wyrm Breath Vapor Burn*, *Grizzled Eyebrow Split*, *Spectral Lich Shiver Curse*, and *Heart of the Abyss Seal*).
- **Culinary & Angling Audit**: Confirmed seamless fishing cycles (poles, durability loss, fish catch events) and campfire grilling (adjacent campfire tile queries, meat/fish conversion, and dietary status adjustments).
- **Compact Log Toggle**: Implemented a responsive state modifier toggling between Standard and Compact layouts inside the adventure chronologue to drastically reduce line height and increase information density.

---

## [v2.9.5] — Quality Assurance: In-Browser Virtual Smoke Test Runner (June 28, 2026)
*Architected a robust, fully automated client-side playthrough simulator inside the developer suites to execute sequences of moves, resource harvesting, camping, resting exhaustion purges, tavern ale wagers, companion expeditions, and combat AI tracking to ensure zero regressions.*

- **Automated Sequential Playback**: Feed mocked, deterministic inputs to check spatial chunk boundary crossings, fog of war, and UI layout in real-time.
- **Harvest & Construction Sim**: Direct player to strike adjacent mineral veins, gather loot, buy campfires, place them, and rest to verify stat recoveries and resource accretion.
- **Tavern Social & Companion Dispatch**: Automates entering inns, playing coin flips, buying ales, dispatching standby followers on expeditions, and claiming spoils.
- **Combat Pursuits Assertions**: Spawns hostiles, checks behavioral changes from `Patrolling` to `Chasing` inside visual/proximity ranges, verifies battle mechanics, damage formulas, and blood decals.
- **Predefined Town Layouts**: Integrated standard town templates dropdown in the Dev console Housing tab, allowing developers to instantly load and edit modular coordinates from `townTemplates.json`.

---

### Key Historical Versions

## [v2.9.0] — Tavern Minigames, Coin Toss & Combat AI Tracking (June 28, 2026)
*Added immersive social activities inside town taverns including heads-or-tails betting minigames, dynamic drunk tavern patrons, and successfully refactored enemy chasing AI paths to ensure hostile monsters actively hunt down the player.*

- **Aggressive Enemy Senses & Chase AI**: Resolved an issue where some overworld and dungeon enemies appeared frozen or passive. Enemies now actively calculate Line-of-Sight (up to 8 tiles sight range) or sense close proximity (up to 5 tiles blindly) to trigger aggressive pursuit states, while passive wildlife and Loot Goblins maintain intelligent escape/fleeing paths.
- **Active Drunk Patrons**: Spawns interactive, flushing-cheeked (`🥴`) characters in town inns and taverns (such as Drunk Seppo, Uncle Pete, Tipsy Toby) who offer rumors, free alloys/ingredients, or the *Drunken Cheer* Critical Strike buff in exchange for a draft of Ale (-10 Gold).
- **Sunder Coin Toss Minigame**: Engage in heads-or-tails betting wagers of 5 Gold with tavern patrons, or slap them awake to trigger unpredictable, hilarious dialogue and event outcomes.

## [v2.8.0] — Celestial Blood Moons, Alchemical Loot Goblins & Stamina Exhaustion (June 27, 2026)
*Introduced high-stakes cosmic events, dynamic chase loot targets, and realistic physiological fatigue loops to enrich tactical decision-making.*

- **Blood Moon Celestial Rift**: Programmed a dramatic red solar coloring event triggering every 300-550 turns. Hostiles gain +25% attack scaling and 50% damage lifesteal under the crimson light, but drop double precious alchemical catalysts.
- **Alchemical Loot Goblin Sprite**: Spawns rare, non-aggressive golden creatures. Goblins flee frantically from players; striking them causes them to drop valuable metal alloys and catalysts on every hit before vanishing.
- **Tactical Stamina & Campfire Rest**: Combat maneuvers and heavy weapon swings accumulate Exhaustion (up to 100%), reducing dodge and critical strike chances by up to -15%. Relaxing adjacent to warm Campfires, indoor Town Hearths, or renting tavern beds fully purges exhaustion.

## [v2.7.0] — Advanced Trade Economy & Guild Houses (June 26, 2026)
*Breathed incredible mechanical depth into the economy and player progression by introducing purchaseable Guild Headquarters, passive sanctuary decorations, modular lab research upgrades, secure wilderness safehouses, faction alliances, and autonomous companion expeditions.*

- **Biome-Based Trade Economy**: Implemented dynamic price fluctuation logic where item costs and sell values scale realistically depending on current active overworld biomes (e.g. Wood spikes in deserts, hooch spikes in tundras). Color-coded premium and discount badges are rendered inside merchant booths.
- **Sunder Guild Headquarters**: Found a massive guild hall in Oakhaven Port Town for 500 Gold, unlocking modular lab research (Sunder Logistics, Map Room, Cooperative Bargaining) and custom sanctuary decoration overlays.
- **Sanctuary Decoration placing**: Purchase permanent structures (Leystone Hearth, Oracle Orb, Champion Pedestal, Vanguard Banner) to decorate your HQ and activate powerful passive character bonuses.
- **Secure safehouses & Storage Vaults**: Establish safehouses across wilderness chunks for 300 Gold to securely stash and retrieve alloys, catalysts, and gear in cross-overworld deep storage vaults.
- **Secret Factions & Gear Blueprints**: Support the rival *Moonshadow Syndicate* and *Dawn Vanguard* guilds. Build reputation through companion missions to forge elite, poison-coated dirks, stealth cowls, vanguard shields, and sunplates.
- **Autonomous Companion Dispatch (Quest Board)**: Station idle followers on solo voyages (Border Patrol, Excavations, Supplies) that progress with each step you take on the overworld map. Collect massive resources, gold, and XP when they return.
- **Modularity & Developer Extensibility (Dev Docs)**: Centralized all variables, formulas, item prices, upgrades, blueprints, and quests inside `/src/utils/tradeEconomy.ts` for ultimate modularity.

## [v2.6.0] — Life Skills, Gourmet Campfire Cooking & Alchemical Apothecary Brewing (June 25, 2026)
*Introduced a comprehensive, highly interactive alchemical and culinary life skills system, featuring harvestable logging and mining nodes on overworld chunks, warm campfire-reliant gourmet cooking, and a deep, multi-tier apothecary potion brewing system providing permanent attribute increments.*

- **Harvestable Natural Nodes**: Overworld chunks now procedurally generate harvestable Pine/Birch logging trees and rich Copper/Iron mining veins. Striking nodes with an equipped weapon chops wood or mines metal ore, directly depositing raw crafting ingredients into your backpack.
- **Campfire Gourmet Cooking**: Cook exquisite recipes by standing within 2 tiles of any warm campfire.
  - *Lightning Grilled Salmon*: Restores 40 HP and infuses the player with *Sparking Reflexes*, boosting critical strike chance by +15% and speed for 25 turns.
  - *Spicy Crimson Salmon*: Restores 50 HP and grants *Magma Aggression*, adding a robust +3 Attack bonus for 25 turns.
  - *Glacial Frost Ribs*: Restores 50 HP and imbues the player with *Everfrost Bulwark*, providing +3 Defense bonus for 25 turns.
  - *Shadow Smoked Jerky*: Prepared with twilight fumes. Restores 35 HP and completely purges player physical exhaustion back to 0%!
- **Apothecary Laboratory & Permanent Elixirs**:
  - *Alchemical Lab Tier System*: Upgrade your alchemical workstation from Tier 1 to Tier 3 using Gold to unlock increasingly powerful, ancient alchemical recipes.
  - *Regenerative Dew of Oakhaven* (Tier 1): Distilled with birch tree essences. Restores 80 HP and permanently grants +1 Strength (STR).
  - *Hyper Focus Elixir* (Tier 1): Synthesized using pine sap crystals. Restores 30 MP and permanently grants +1 Intelligence (INT).
  - *Ironheart Fortitude Draught* (Tier 2): Infused with powdered iron minerals. Restores 60 HP, cleanses 20 Exhaustion, and permanently grants +2 Defense (DEF).
  - *Shadow-Warp Void Elixir* (Tier 3): Deep void fermentation utilizing copper ore. Restores 50 HP and 50 MP, and permanently grants +1 Luck (LCK).
- **Interactive Life Skills Interface**: Integrated a highly responsive, custom-themed tab featuring detailed recipe guides, inventory resource trackers, campfire status reminders, and beautiful button animations.

## [v2.5.0] — Wandering Factions & Lively Overworld (June 25, 2026)
*Breathed immense mechanical life into the overworld by implementing hostile military campsites, active merchant caravans vulnerable to bandit ambushes, premium transaction trade licenses, and stunning animated weather hazards.*

- **Hostile Bandit & Raider Campsites**: 
  - Generates small 5x5 fortified outlaw camps on 25% of wilderness chunks (equipped with warm roasting spits, tents, and sentries).
  - Clearing a camp's guards permanently lowers the regional danger rating and unlocks a high-tier locked chest filled with epic alloys and catalysts, rewarding players with +15 Town Reputation and +150 XP.
- **Traveling Caravans & Bandit Ambushes**:
  - Dynamically spawns Baron Tobias' merchant wagon on overworld road crossroads.
  - Defending the wagon against waves of ruthless Bandit Ambushers triggers a Heroic Victory screen, rewarding the player with +250 Gold, +200 XP, +25 Town Reputation, and a permanent **Rare Caravan Trade License**.
- **Caravan Trade License Perks**:
  - Unlocks a beautifully designed, high-contrast gold-embossed ledger on the player sidebar.
  - Grants a permanent **+30% Sell Payout** premium on all equipment and material sales and a **-20% Purchase Discount** on all town store items.
- **Stunning Climate Weather Particles**:
  - *Swirling Sandstorms (Desert)*: Restricts overworld visual field to 2 tiles and lowers combat accuracy by 20% while drawing fast-flowing horizontal amber sand winds and deep desert dust hazes.
  - *Frostbite Blizzards (Tundra)*: Imposes extreme frost conditions that drain health, slow player movement speed, and restrict sight lines. Safe zones (campfires, cozy taverns, warm hearths, and ley-shrine wells) provide instant warmth to stave off the freezing cold.

## [v2.4.5] — Drunk Wandering Merchant Seppo & Rare Surface Traders (June 25, 2026)
*Introduced a rare wandering merchant entity spawning in non-town overworld wilderness chunks who offers highly stylized unique weapons, shields, and consumables, complete with rich comedic dialogue and dynamic purchase logs.*

### 🥴 Drunk Wandering Merchant Seppo (S)
- **Procedural Wilderness Spawning**: Seppo has a rare 4% chance to spawn on a grass tile in non-town chunks during chunk generation. He is not restricted to appearing once per game; exploration of distant wilderness tiles can reveal more instances of this beloved merchant.
- **Finnish Sisu Hammer 🪵**: Designed and implemented an exclusive weapon (+15 ATK, +22% Critical Chance) complete with an immersive thematic description matching Seppo's craft.
- **Ever-Burning Flask 🛡️**: Implemented a defensive brass shield (+5 DEF) keeping players toast-warm and blocking incoming blows.
- **Seppo's Secret Hooch 🍶**: Implemented a consumable beverage restoring substantial stats (+75 HP, +40 MP) that triggers hilarious, custom-logged drunk messages upon consumption.
- **Thematic Comedic Logs & Dialogue**: Programmed specialized shopping feedback where Seppo grumbles and clinks bottles with high comedic value, in addition to unique log text when the player consumes his hooch.

## [v2.4.0] — Interactive Landmark Choice Encounters & Chronicles (June 24, 2026)
*Upgraded the overworld's passive landscape landmarks into active, choice-driven alchemical and physical narrative events with rich outcome paths, status changes, and permanent attribute upgrades, fully integrated with history chronicle logs.*

### ⛲ Interactive Overworld Points of Interest (POIs)
- **Deep Choice-Driven Narratives**: Converted passive overworld discoveries into immersive landmark hotspots (Ley-well Shrines, Flame crucibles, Monoliths, Keeps, Fossils) offering three distinct custom paths per node.
- **Dynamic Alchemical & Physical Outcomes**: Choices trigger real rewards (health restores, gold tributes, alchemical catalyst shards, raw ores) or permanent stat upgrades (Max HP, Max MP, Defense, and Unspent Attribute Points).
- **Risk and Backfire Mechanics**: Greedier or riskier choices contain logical backfire hazards (psychic feedback, cave-ins, and thermal burns) dealing direct physical damage to player status.
- **Responsive Landmark Banner HUD**: Stand within 1 tile of any overworld landmark to trigger an elegant top alert banner on the sidebar, highlighting landmark type, readiness states, and custom action trigger overlays.
- **Unlocked Chronicles**: Interacting with Landmarks saves and unlocks historical chapter summaries, readable inside Oakhaven's royal history scroll.

## [v2.3.0] — Winter Frost Berry Freeze, Modular Buildings & Jumbo Overworld Chunks (June 23, 2026)
*Introduced a climate-responsive harvest barrier freezing sweet berry bushes in winter biomes, completely modular village building layouts, jumbo overworld chunks for expansive exploration, and slower, highly readable floating action text.*

### ❄️ Winter Frost Berry Freeze & Swamp Elderberries
- **Frozen Tundra Barriers**: Swapped berry bush spawning in tundra biomes for snow-laden pine trees. Handled winter gathering tries with a clear warning popup so players know bushes are frozen stiff.
- **Swamp Elderberries**: Replaced the previous toxic biohazard '☣' mark on swamp bushes with premium wild purple elderberries '🫐' for high-fidelity immersion.

### 🏠 Structural Architecture Refactor (Modular Buildings)
- **Modular Interiors**: Passed building IDs directly into `buildHouse` to generate house-specific modular furniture collections, lighting, and interior decorations.
- **Responsive Fortress Design**: Dynamically calculated castle town fortress walls, gates, courtyard paving, and perimeter torches using actual width and height boundaries.

### 🗺️ Bigger, Slower Exploration Balance
- **Jumbo Overworld Chunks**: Expanded chunk dimensions from 50x30 to 64x40 tiles, increasing walk space and terrain generation margins.
- **Leisurely Action Pace**: Slowed down turn-based day-night time ticks to 4 minutes per step for more natural day exploration pacing.
- **Magnified Combat Floating Text**: Oversized floating action and damage numbers by over 50% using stylish system typography accompanied by higher shadow blur for instant combat feedback.

## [v2.2.0] — Blacksmith Forge Revision & Epic Armor Sandbox Creator (June 23, 2026)
*Upgraded Oakhaven's blacksmithing arcanum to limit equipment forging to pure high-grade metal alloys and catalysts with direct-to-backpack delivery, paired with a specialized Epic Armor & Greatshields designer inside the Sovereign Dev Lab.*

### 🔨 Alloy-Only Blacksmith Equipment Forge
- **Alloy Restriction**: Redesigned the entire Blacksmith Forge to prioritize pure base alloys (Iron, Mithril, Obsidian, etc.) and catalysts as primary ingredients for forging both high-tier weapons and heavy armor gears.
- **Direct-to-Pack Delivery**: Successfully rerouted forged physical items to deposite directly into the player's Backpack Bag instead of overriding active equipment slots instantly, preventing accidental loss of high-tier gear during workbench exploration.
- **Armor Crafting Templates**: Integrated customizable slot types including Heavy Plates, Visor Helms, Gauntlets, boots, and Greatshields into the active Forge option columns.

### 🛡️ Sovereign Custom Armor Creator
- **Precision Armor Designer**: Extended the developer "Creator Lab" panel layout to house a live custom Armor Component Crafter. Developers are empowered to adjust Armor Slots (Shield, Heavy Plate, Helmet, Gloves, Boots), name tags, defense ratings, and maximum wear durability.
- **Backpack Sandbox Ingress**: Created solid sandbox triggers to materialize custom armor structures on command and insert them directly into the player's physical stashed repository bags for instant test-play.

## [v2.1.0] — The Sovereign Creator Lab & Trauma Materializer (June 22, 2026)
*Released an ultimate high-touch developer and sandbox interface tab called the "Creator Lab", empowering players with precise tactical control over physical battle trauma scars, allied mercenary recruitment, climate patterns, resource supply lines, weapon forging, and environmental hazard placement.*

### 🩹 Trauma Scar & Attribute Infusion
- **Active Scars Injection**: Select from all 12 scars in the trauma database (such as *Shattered Knee*, *Mangled Hand*, or *Grave Concussion*) and instantly inscribe them onto your character stats ledger to test specific physical debuffs and cosmetic emojis.
- **Micro-Attribute Editor**: Directly adjust core player statistics (Strength, Dexterity, Intelligence, Charisma, Luck, and unspent points) in intervals of ±5. Changes immediately propagate into secondary variables like critical hit modifiers, block ratings, and attack coefficients.

### 👥 Tactical Retinue summoned
- **Sovereign Mercenary Hone**: Summon custom companions, configure their names, and spawn either high-defense Sentinel Guards or fast, high-damage Critical Shadow Thieves in single-click. Allies automatically join your exploration party and defend your coordinates.

### 🧪 supply Line Alloys & Catalyst Infusion
- **Quantitative Supply Editor**: Add or subtract items by 10x intervals for all 12 raw materials (Iron alloys, timber, pies, wild berries, cooked meats, stone baked bread, etc.) and by 5x intervals for all 5 precious elemental alchemical catalysts (Fire, Frost, Poison, Lightning, and Shadow) to skip tedious resource gathering.

### ⚔️ Bespoke Epic Weapon Crafter
- **Custom Weapon Forge**: Modify weapon base archetypes (Sword, Bow, Dagger, Mace, Staff, Spear), configure base damage, critical strike chance, tile attack range, mana costs, and durability. Click to compile and equip any customized weapon directly to the active slot.

### 🌀 Environmental Hazards Ingress
- **Tile Materializers**: Spot-spawn environmental features on adjacent walkable squares around the player. Instantly materialize active Spikes, Fire Vents, Poison Gas traps, warm Campfires, or treasure chests overflowing with mythril, dragons scales, and heavy gold payouts.
- **Meteorological Override Swaps**: Shift climate variables (sunny/clear, snowy, rainy, foggy) and regional biome attributes (forest, desert, tundra, swamp) directly via responsive UI controls to test climate-specific reactions.

## [v2.0.0] — The Autonomous Storyteller & Mutation Forge (June 21, 2026)
*Introduced a fully autonomous Game Master Storyteller entity that dynamically monitors player history to trigger specialized encounters, paired with the powerful Cosmic Mutation Forge for high-tier item modifiers.*

### 🌀 Cosmic Mutation Forge Engine
- **Target Gear Selection & Multi-Fuel Matrix**: Added support for selecting any weapon, armor piece, helmet, gloves, boots, or shield in the player's equipment inventory or active loadout. Consumes a flexible combination of specialized basic alloys (Iron, Steel, Copper, Obsidian, Mythril, Orichalcum) and elemental catalysts (Fire, Frost, Storm, Light, Shadow).
- **Stat Transformation & Prefix/Suffix Injection**: Equipment stats undergo a chaotic realignment (ranging from 0.85x to 1.55x multipliers) and inject majestic elemental prefixes (e.g., "Volcanic", "Glacial") and epic high-tier suffix titles (e.g., "of Chaos Destiny", "of the Abyss Void", "of the Seraphic").
- **Dynamic Workbench UI**: Designed a luxurious dark cosmic-themed Mutation sub-tab overlay inside the Crafting Arcanum workbench, complete with forge calculation previews, validation guides, and animated spin-indicator controls.

### 🎭 Autonomous GM Storyteller Entity (Dynamic Game Master)
- **Deep Cognitive Memory State**: Built `gmStoryteller.ts` which tracks detailed player behaviors, coordinates, idle counts, boss fights, total damage, and level-ups to drive GM tension, personality transitions, and boredom indexes.
- **Dynamic Personality Monologue Engine**: Storyteller shifts between Mischievous, Sadistic, Benevolent, Intrigued, and Apathetic personas. monologues are recorded dynamically into an internal thought stream.
- **Dynamic Encounter Database**: Added five major autonomous storyteller interventions: *Seraphic Healing Breeze*, *Sovereign Rift Ambush*, *Alchemical Alloy Drop*, *Lightning Bolt Smite*, and *Meteorological Climax*.
- **High-Fidelity GM Debug Console Tab**: Added an "Autonomous GM" live control dock inside the GM panel. GMs can manually override base personalities, slide Boredom and Tension parameters, read active thought feeds, and force-trigger any programmatic encounter on the fly.

## [v1.8.0] — Carrying Weight Limits & Gear Disposal (June 20, 2026)
*Introduced a realistic, customizable carrying weight limitation system influenced directly by equipment templates and resource size, including stagger consequences, manual disposal hooks, physical ground drop spilling, and god panel bypass scales.*

### ⚖️ Carrying Weight Limit Engine
- **Item-Sized Mass Formulas**: Programmed rigorous physical weight distribution calculations for gear pieces and raw alloy resources (Armor plates at 10kg, weapons at 3.5kg–5kg, raw alloys at 1.5kg, and elemental catalyst crystals at 0.2kg). Equipped items are active and worn, thus exempt from backpack carrying weight.
- **Overburdened Sluggish / Stagger Effect**: Exceeding carrying thresholds imposes a 45% chance to lose action turns to a stagger animation, granting adversaries active free strikes.
- **Loot Spilling Physical Piles**: Collecting physical loot caches or popping open chests checks weight limits. Any items exceeding maximum thresholds drop elegantly onto the dungeon floor as physical LootPiles, keeping them safe.
- **Micro-engineered Discard Modules**: Implemented on-demand `[DISCARD]` buttons with unit weight trackers for any individual weapon pieces, armor vest plates, alloys, and catalysts inside the backpack to allow manual load balancing on the go.
- **Interactive Weight HUD**: Framed a sleek glassmorphism weight limit status indicator and gauge track inside the backpack layout with pulse warning states during overburdened phases.
- **God Panel Sovereign Overrides**: Integrated test-friendly toggles to bypass carrying weight rules entirely or customize the base weight index (ranging from 10 kg up to 200 kg) via custom sliders inside the sovereign control interface.

## [v1.7.0] — Storyteller Narrator & Siege Bastions (June 20, 2026)
*Introduced an immersive, procedurally driven RPG Storyteller Narrator that nudges players toward points of interest, rare Castle Towns spawning in the overworld, a tactical Castle Invasion GM command, and cardinal direction indicators.*

### 📜 RPG Storyteller Narrator (Point of Interest Nudges)
- **Dynamic Directional Cues**: Created a deterministic narration engine that analyzes adjacent chunks to deliver sensory, immersive RPG cues in the adventure log (e.g., carrying the smell of malted ale and chiming chimney smoke to the East, high battlements piercing gray clouds to the West, or iron chains rattling to the South).
- **Proportional Pacing**: Narrations trigger occasionally (on turn offset 22 per 55-turn cycle) to prevent feed clogging.
- **Modular Architecture**: Extracted all narration cues, chunk analysis, and scenic text lines to a new modular helper `/src/utils/gmNarrator.ts` for clean structural execution.

### 🏰 Castle Towns & Bastion Fortifications
- **Fortress Generations**: Upgraded the overworld generator to earmark 25% of generated overworld villages as high-walled, fortified Keep bastions (Castle, Citadel, Keep, Bastion, Fortress, Stronghold) with unique suffix designations.
- **Map Viewport Overlays**: Added sleek cardinal indicators (NORTH, SOUTH, WEST, EAST) directly on the game canvas corners using glassmorphism-shaded overlays to guide map navigation fluidly.

### ⚔️ GM Castle Gate Siege Invasion
- **Active Siege horde**: Created a high-tier Spawning command in the GM Console, "Cast Castle Invasion Force," to deploy 8 tactical raiders (Orc gladiators, goblin infiltrators, outlaw spies, and skeletal archers) strategically surrounding the castle gates during overworld fortress visits.

## [v1.6.0] — Sovereign Creator Engine & Sandbox Constructor (June 19, 2026)
*Introduced live customizable JSON-based blueprints for constructing custom house interiors, traps, dungeons, or training arenas on the fly, paired with fine-grained sandbox playthrough modifiers.*

### 🧱 Customizable JSON Structures
- **Live Tile Blueprint Grids**: Created the Structures JSON pane in the God Panel allowing players to declare layout string matrices mapping characters directly to versatile tile textures (Doors, Walls, Chairs, Campfires, etc.).
- **Dynamic Character Spawner**: Integrated optional coordinates to spawn customized NPC factions right in the placed maps (with support for Custom Rats, Skeletons, Mages, and elites).
- **Infinite Real-Time Placement**: Enabled immediate layout parsing directly into the active viewport coordinates from the constructor memory without restarting the current game session.

### 🎛️ Sandbox Multiplier Frameworks
- **Balance Scales**: Enabled real-time customization of player and enemy damage values, base health levels, drop rates, and experience scales from the sovereign control suite.
- **Sovereign Shield & Destructive Waves**: Implemented instant death aura capabilities alongside god mode invulnerability selectors to simplify balanced test-play environments.

---

## [v1.5.0] — Extensible Narrative & Chronologue Scroll (June 19, 2026)
*Decoupled the combat flavor generator into modular configuration files, restricted combat retreating behaviors to low-HP cowardly subspecies, and added intelligent scrolling mechanics to the adventure log.*

### 📖 Extensible Tactical Narratives
- **Modular Data Config**: Migrated all hardcoded combat weapon strike strings into `/src/data/combatFlavors.ts` configuration files, resolving client placeholders (`{name}`) at runtime. Any user can easily expand weapon catalogs now.
- **Bravery-vs-Cowardice Morale**: Stripped high default flee ratings. Elite/brave enemies (Skeleton spellflingers, Orc skullbreakers, Cave trolls, bosses) now stand firm, fighting to the death. Cowardly sub-beasts (rats, scavenger goblins, trapsmiths) have a miniature (only 8%) retreat chance once dropped past vital critical thresholds (under 12% HP).

### 📜 Intelligent Chronologue UI
- **Scroll Pinning Logic**: Embedded custom scrolling listeners maintaining log pins at the bottom on new turn logs.
- **Bouncing Return Widget**: Programmed a sliding, interactive overlay button (`↓ Scroll to Latest`) when reading archived posts, recovering attention instantly upon clicking.
- **Visual Fine-tuning**: Styled custom high-contrast dark amber webkit thumbs on the log viewport.

---

## [v1.4.2] — Visceral Combat Narrative Engine (June 18, 2026)
*Constructed highly specialized, randomized combat flavor text responding to specific player weapon base types and accurate target hit configurations.*

### ⚔️ Combat Immersive Text Systems
- **Bespoke Weapon Archetypes**: Built customized hit arrays for all 7 primary weapon base classes: `Sword`, `Spear`, `Dagger`, `Hammer`, `Staff`, `Bow`, and `Wand` with randomized targets and damage descriptions.
- **Dynamic Critical Hits**: Programmed highly descriptive critical hits representing heavy strikes (e.g., smashing skulls, shattering collarbones, severing shoulder plates, or vaporizing visors) alongside default precision impacts.
- **Detailed Damage Reports**: Preserved essential game statistics by embedding active weapon descriptions and actual DMG integers alongside the sensory combat descriptions within the Chronologue feed.

---

## [v1.4.1] — Micro-Scaled Minimap Resolution (June 18, 2026)
*Upgraded local range visibility while retaining the exact compact structural dimensions of the HUD.*

### 🗺️ Navigation & Interface Systems
- **Double-Range Sight**: Expanded local chunk sight range from an 11x11 tile field (5 tiles radius) to a 21x21 tile field (10 tiles radius), displaying nearly quadruple the density of surrounding paths, water blocks, walls, doors, and NPCs.
- **Dynamic CSS Grid Auto-Packing**: Discarded rigid grid-cols declarations in favor of a responsive inline CSS Grid framework scaling each tile cell precisely to `5px` with a sleek `1px` grid gap, preserving identical outer card bounds.

---

## [v1.4.0] — Unified Touch Portal & Dynamic Device Layout (June 18, 2026)
*Integrated reactive device profiling and modern virtual touch gamepad controls to support natural mobile browser mechanics and premium desktop execution simultaneously.*

### 📱 Responsive & Touch Systems
- **Seamless Browser Detection**: Built a twin-tier detector combining `navigator.userAgent` analysis, active touch capability checks, and real-time screen width profiling to automatically classify host environments on mount and window resize.
- **Micro-engineered Virtual D-Pad**: Conceived an aesthetic, touch-friendly 8-directional D-Pad panel exceeding 44px ergonomics (min 48px tactile buttons) featuring diagonals and an intuitive wait/pass button.
- **Unified Action Cockpit**: Extracted dungeon interaction logic (`G` key functions) and defensive parry triggers (`B` key brace functions) into clean, decoupled hooks serving both keyboard and mobile touch buttons.
- **Intelligent Grid Re-ordering**: Structured CSS grid rendering to dynamically slide statistics columns underneath the dungeon canvas when played on phone or tablet sizes, putting direct action at immediate accessibility. 
- **Manual Mode Refinement**: Integrated a compact device layout override toggle directly into the header so players can switch styles manually at will.

---

## [v1.3.0] — Dynamic Architecture & Modular Data Extraction (June 18, 2026)
*Extracted hardcoded parameters into decoupled configuration sets data structures to accelerate game customization and community contribution.*

### 🚀 New Features & Enhancements
- **JSON Building Loader**: Extracted village building coordinate structures and dimensions into `src/data/buildings.json`. Enabled flexible coordinate equations (e.g. `width - 12`) parsed dynamically.
- **JSON Monster Templates**: Extracted fallback default stats, names, health pools, ranges, colors, and characters for all standard enemies (Bandits, Trolls, Goblins, etc.) into `src/data/enemies.json`.
- **System Documentation**: Released comprehensive game guide in `README.md` and chronological feature log inside `VERSIONS.md` to map modular expansions.

---

## [v1.2.0] — Visceral Combat & Battlefield Remaining Elements (Mid-June 2026)
*Enriched visual feedback loops for physical action and tactical environmental elements.*

### 🎭 Visual & Gameplay Added Features
- **Dynamic Colored Splatters**: Implemented distinct blood splatter colors customized per entity breed (toxic green for marsh vermin, spectral cyan for skeleton mages, and crimson red for mammalian targets).
- **Turn-based Blood Decay**: Programmed 4% random decay rate on every player step to naturally dissolve blood stains and clean floors.
- **Physical Corpses**: Ground layers now render corpse characters (e.g., `☠` for skeleton debris, `🪶` for animals, standard `%` symbols for humanoids) under actors.
- **Dungeon Ruin Props**: Added interactive dungeon background props (Stained Altars, broken kegs, iron cuffs, ancient columns, bone mounds, and cobwebs) to heighten dungeon crawls atmosphere.

---

## [v1.1.0] — Mercenaries & Stance Coordinates (Early-June 2026)
*Added team coordination mechanics and companion entities support.*

### 👥 Party Mechanics
- **Tavern Recruiting**: Enabled hireable blade companions (e.g., Arne, Sade) at tavern counters.
- **Allied Commands**: Programmed aggressive pursuit vs defensive holding triggers to control combat stances.
- **Allied Debris**: Slain companions leave behind custom blue-framed physical corpse markers so players can pay respect to their memory.

---

## [v1.0.0] — Base Roguelike Framework (Launch Release)
*Established core mathematical grid frameworks, overworld chunks generator, and tactical crafting loops.*

### ⚙️ Core Engines
- **Infinite Overworld & Biomes**: Swappable chunk memory spanning forests, dry deserts, snowy tundras, and deep swampland.
- **Durable Abyss Levels**: Multi-floor persistent state management across depths 1 to 5, preventing monster duplicates when ascending/descending.
- **Dungeon Forge Crafting**: Built elemental material synthesis system allowing custom crafted weapon generation.
- **Day-Night Shading & Weather**: Added 24-hr atmospheric shading tints with live snow, rain, and fog layouts.
