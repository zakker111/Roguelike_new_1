# Codebase Architecture & Directory Map

This document serves as the authoritative structural map and development ruleset for AI assistants and developers working on the codebase. It details the responsibility, architecture, and contents of each directory and module.

---

## 🏛️ Core Engine Principles & Development Rules

1. **Modular & Component-Based Architecture**:
   - Keep every system, mechanic, hook, and renderer focused and cleanly decoupled.
   - **Strict Anti-Monolith Rule**: Files MUST NOT grow into monoliths. Proactively extract helper functions, sub-components, and sub-hooks into dedicated modular files.

2. **Highly Data-Driven Design**:
   - Game content (items, recipes, monsters, bestiary, spells, scrolls, encounters, dialogues, relics, scars, SFX, quests, trade items) MUST live in structured JSON registries under `/src/data/`.
   - Never hardcode static entity stats or recipes in UI components. Use loaders in `/src/data/index.ts`.

3. **Easily Modifiable & Extensible Roguelike Engine**:
   - Adding content should only require adding entries to JSON catalogs and `/src/types/` without rewriting core pipelines.

4. **Continuous Synchronization**:
   - Update `AGENTS.md` whenever modules or directories are added or refactored.

---

## 📁 Root Configuration & Scripts
- `package.json` / `tsconfig.json` / `vite.config.ts`: Project manifest, TypeScript build configs, and Vite dev server (`base: './'`).
- `metadata.json`: Platform metadata (app name, description, capabilities).
- `LICENSE`: Open-source MIT License.
- `.github/workflows/deploy.yml`: Automated CI/CD GitHub Actions workflow (validates JSON, audits imports, executes 402 tests, builds, and deploys to GitHub Pages).
- `public/`:
  - `404.html`: SPA fallback redirect for GitHub Pages.
  - `.nojekyll`: Disables Jekyll asset processing on GitHub Pages.
  - `manifest.json`, `favicon.svg`, icons, and tilesets.
- `scripts/`:
  - `auditCodebase.cjs`: Complete graph audit script (validates all JSON schemas, imports, exports, and file references).
  - `validateJson.cjs`: Automated JSON linting & catalog syntax validator.

---

## 📁 `/src` — Application Source

### 1. Root Application Files
- `src/App.tsx`: Central game coordinator, top-level state orchestrator, tab navigation, and overlay router.
- `src/main.tsx` / `src/index.css`: React DOM mount point, Tailwind CSS imports, and pixel-art rendering rules.
- `src/types.ts` / `src/declarations.d.ts`: Global re-export barrel for domain types and ambient declarations.

---

### 2. `/src/types/` — Domain Types & Interfaces
- `src/types/entities.ts`: Actor definitions, player stats, enemies, NPCs, companion followers, buffs, and status effects.
- `src/types/items.ts`: Inventory items, weapon/armor templates, recipes, materials, catalysts, and equipment slots.
- `src/types/map.ts`: Tile types, world chunks, biomes, weather conditions, structures, dungeons, and POIs.
- `src/types/game.ts`: Game state, logs, chaos scores, storyteller state, and UI view modes.
- `src/types/index.ts`: Barrel index re-exporting all types.

---

### 3. `/src/data/` — Static Catalogs & JSON Registries
- Catalogs: `items.json`, `factions.json`, `recipes.json`, `enemies.json`, `bestiary.json`, `spells.json`, `spellScrolls.json`, `storyEvents.json`, `storytellerQuotes.json`, `catalysts.json`, `relics.json`, `scars.json`, `tradeItems.json`, `quests.json`, `npcDialogues.json`, `historyBook.json`, `decorTemplates.json`, `soundCatalog.json`.
- `src/data/index.ts`: Type-safe helper accessors and validated loaders for all JSON files.

---

### 3b. `/src/factions/` — Modular Faction Sub-Engine & Hostility Matrix
- `src/factions/types.ts`: Domain types for factions, standing tiers (`Hated` to `Revered`), alignments, and perks.
- `src/factions/FactionMatrix.ts`: Singleton engine for $O(1)$ pairwise hostility lookups and entity faction resolution.
- `src/factions/useFactionReputation.ts`: Player reputation management hook tracking scores, prices, perks, and safehouses.
- `src/factions/index.ts`: Faction sub-engine barrel export.

---

### 3c. `/src/utils/elemental/` & `/src/types/elemental.ts` — Elemental Propagation Sub-Engine (Pillar 2)
- `src/types/elemental.ts`: Domain types for elemental fields (`fire`, `ice`, `shock`, `steam`, `poison_gas`), intensities, and propagation contracts.
- `src/utils/elemental/elementalEngine.ts`: Cellular automata fire spread, flammable vegetation consumption into Ash, water freezing into walkable Ice, contiguous water shock conduction, toxic gas deflagration explosions, and steam line-of-sight obscuration.
- `src/utils/elemental/index.ts`: Elemental sub-engine barrel export.
- `src/canvas/elementalVfxRenderer.ts`: Canvas procedural VFX renderer for fire flickers, ice frost glints, lightning arcs, steam plumes, and toxic poison clouds.

---

### 4. `/src/canvas/` — 2D Grid & Graphics Rendering Engine
- `src/canvas/types.ts` / `src/canvas/IGraphicsRenderer.ts`: Pluggable renderer interfaces (`IVisualRenderer`, `GraphicsVisualMode`, `TilesetSourceType`).
- `src/canvas/HybridGraphicsEngine.ts`: Primary rendering coordinator (supports hot-swapping `Classic ASCII`, `Classic PNG Mockup`, `Classic Code Canvas`).
- `src/canvas/ClassicGlyphRenderer.ts` / `src/canvas/TextRenderer.ts`: High-DPI procedural glyph and text renderer.
- `src/canvas/AnimatedTilesetRenderer.ts` / `src/canvas/TilesetRenderer.ts`: HD sprite atlas renderer with dual-source support (`classic_png` vs `classic_code`).
- `src/canvas/TilesetAtlasManager.ts`: Texture atlas coordinate mapping, Wang bitmask calculations, and sprite coordinates.
- `src/canvas/chunkBackgroundCache.ts`: Static terrain offscreen rasterizer and pre-computed bitmask cache.
- `src/canvas/tileMapRenderer.ts`: Viewport chunk renderer for terrain, water, roads, biomes, and indoor tiles.
- `src/canvas/projectileEngine.ts`: Ballistic projectile engine with arcs, waves, spirals, particle trails, and impact bursts.
- `src/canvas/meleeVfxEngine.ts`: Directional melee slash arcs, impact ripples, and fading ground combat decals.
- `src/canvas/combatVfxEngine.ts`: Unified Combat VFX orchestrator for projectiles, melee slashes, impact bursts, and floating combat text.
- `src/canvas/entityLayerRenderer.ts`: Renders player, monsters, town guards, animals, paperdoll gear, decals, and projectiles.
- `src/canvas/weatherLightingRenderer.ts` / `src/canvas/lightingEngine.ts`: Dynamic 2D lighting, day/night cycles, torches, lanterns, and fog of war.
- `src/canvas/weatherInteractivityRenderer.ts`: Weather ground effects (puddles, splashes, snow crust accumulations).
- `src/canvas/waterShimmerRenderer.ts`: Sine-wave specular ripples, wave foam lines, and crystalline glints for water tiles.
- `src/canvas/biomeAtmosphereRenderer.ts`: Ambient particles (snowflakes, swamp fireflies/wisps, volcanic embers).
- `src/canvas/waterCausticsRenderer.ts`: Multi-scale dynamic water caustics, wave light refraction webs, and submerged entity caustics.
- `src/canvas/bloomEngine.ts`: Luminous HDR bloom pass with pre-cached radial gradient bloom stamps.
- `src/canvas/vignetteRenderer.ts`: Contextual atmospheric perimeter vignette with dungeon depth scaling.
- `src/canvas/shadowRenderer.ts`: Directional shadow projection for trees, buildings, and entities.
- `src/canvas/particlePool.ts` / `src/canvas/VFXEmitter.ts`: Pre-allocated object pool ring-buffer and visual FX emitter.
- `src/canvas/spriteAnimationManager.ts` / `src/canvas/spriteRenderer.ts`: Animated sprite frame progression.
- `src/canvas/entityPaperdollEngine.ts`: Equipment paperdoll layering over base character sprites in Tileset mode.
- `src/canvas/entityInterpolationManager.ts`: Entity render position interpolation (lerp) with quadratic tweening.
- `src/canvas/cameraController.ts`: Smooth player-centered camera tracking and screen-shake decay.
- `src/canvas/AssetPreloader.ts`: Sprite preloading, in-memory canvas registration, and bitmap caching.
- `src/canvas/MockupAtlasGenerator.ts`: Procedural pixel-art atlas synthesis engine (Classic, Cyber, Forest, Infernal; 16–128px; 4 generated sheets).
- `src/canvas/index.ts`: Graphics engine barrel export.

---

### 5. `/src/context/` — State Management Contexts
- `src/context/WorldContext.tsx`: Manages overworld/dungeon map state, dynamic tiles, structures, chunks, and weather.
- `src/context/PlayerContext.tsx`: Manages player location, level, XP, inventory, equipment, stats, and gold.
- `src/context/CombatContext.tsx`: Manages active enemies, turn timers, targeting, combat logs, and floaters.
- `src/context/index.ts`: Context barrel export.

---

### 6. `/src/hooks/` — Modular Game Logic & Hooks
- `src/hooks/useGameLoop.ts`: Central tick loop, turn progression, enemy AI processing, and status effect decay.
- `src/hooks/usePlayerMovement.ts`: Movement handling, wall collisions, door opening, and tile interaction triggers.
- `src/hooks/usePlayerAttack.ts` / `src/hooks/useCombatEngine.ts`: Melee/ranged attacks, damage calculations, crits, and mutations.
- `src/hooks/combat/`: Modular Player Combat Sub-Engine:
  - `types.ts`: Combat math parameters, target contexts, and combat result contracts.
  - `combatMath.ts`: Critical strikes, combos, backstabs, weapon base types, catalyst infusions, and boss defense.
  - `combatLoot.ts`: XP awards, gold drops, catalyst drops, loot piles, and monster corpses.
  - `combatDeathResolver.ts`: Durability decay, boss phase triggers, enemy defeat, and combat log messaging.
  - `index.ts`: Combat sub-engine barrel export.
- `src/hooks/useSpellcasting.ts`: Mana verification, spell casting, AOE targeting, and cooldowns.
- `src/hooks/useEnemyAI.ts`: Facade re-exporting the modular AI engine.
- `src/hooks/ai/`: Modular Autonomous AI & Combat Resolution Sub-Engine:
  - `types.ts`: Context parameters, environment outcomes, and hostile combat response structures.
  - `aiTurnEnvironment.ts`: Status effect resolution (DoTs, HoTs), weather/seasons, day/night cycles, and roaming spawns.
  - `useFollowerAI.ts`: Follower targeting, ranged/melee attacks, dynamic weapon range, and player escorting.
  - `useTownGuardAI.ts`: Town defense threat response, 30-tile alarm broadcast, and shift schedules.
  - `useHostileAI.ts`: Stagger recovery, telegraphed attacks, wagon targeting, and flanking behavior.
  - `useCivilianAI.ts`: Cat playful wandering, civilian daily routines, weather shelter reactions, and barks.
  - `factionMorale.ts`: Pack/squad morale breaks on leader/alpha death, panic scatter, and desperate surrender calculations.
  - `aiCombatAggregator.ts`: Aggregated visual floating text dispatcher and skirmish victory checks.
  - `useEnemyAI.ts`: Turn-based AI resolution coordinator.
  - `index.ts`: Modular AI engine barrel export.
- `src/hooks/useCraftingEngine.ts`: Central crafting dispatcher (`useEquipmentCrafting`, `useSurvivalCrafting`, `useUtilityCrafting`).
- `src/hooks/useCaravanTravel.ts` / `src/hooks/useTradeEconomy.ts`: Merchant caravan routes, fast travel, and regional trade tariffs.
- `src/hooks/usePoiAndWilderness.ts` / `src/hooks/useOverworldEvents.ts`: Shrines, bushes, ruins, dungeons, and world events.
- `src/hooks/useQuestsAndGuild.ts` / `src/hooks/useTownServices.ts`: Guild mission tracking, inn resting, and town services.
- `src/hooks/useNpcInteraction.ts`: Conversational branching, trading, and companion hiring.
- `src/hooks/useSaveLoad.ts`: LocalStorage and cloud save game state serializer/deserializer.
- `src/hooks/useAmbientAudio.ts`: Procedural Web Audio music and environmental soundscape manager.
- `src/hooks/useAppHotkeys.ts` / `src/hooks/input/`: Key bindings, modal hotkeys, and directional controls.
- `src/hooks/god/useGodPanelState.ts`: Dedicated orchestrator for God Mode cheats, sandbox tweaks, and testing.
- `src/hooks/app/`: Application orchestration hooks:
  - `usePlayerTurnMovement.ts`: Turn-based step resolver and movement dispatcher.
  - `movement/`: Modular Movement Sub-Engine (`useStepResolver`, `useTerrainHazards`, `useTileLooting`, `useChunkTransition`).
  - `useGKeyInteraction.ts`: Multi-context G-key interaction router (signs, beds, bushes, NPCs, shrines).
  - `useAutoplayAgent.ts`: Autonomous playtesting agent for simulated gameplay runs.
  - `useDungeonStairsAndTransitions.ts`: Multi-depth stair climbs and overworld-dungeon transitions.
  - `useTownInteractions.ts`: Town doors, resting, and resource harvesting.
  - `useCombatAndSpells.ts`: Attack dispatch, spellcasting, and scroll execution.
  - `useConsumablesAndCatalysts.ts`: Consumables, catalyst infusions, and quick healing.
  - `useShopAndTradeHandlers.ts`: Merchant shops, caravan routes, and item transactions.
- `src/hooks/index.ts`: Hooks barrel export.

---

### 7. `/src/world/` & `/src/utils/overworld/` — Procedural Generation
- `src/world/overworldGen.ts`: Macro-scale continent, biome distribution, elevations, rivers, and coastlines.
- `src/world/dungeon/`: Modular Dungeon Generation Sub-Engine:
  - `types.ts`: Dungeon room types, generated level contracts, and boss templates.
  - `dungeonRooms.ts`: Organic multi-archetype room generation and underworld lava pools.
  - `dungeonCorridors.ts`: Multi-tile wide corridor carving, loop connections, and doorway thresholds.
  - `dungeonTrapsAndChests.ts`: Archetype traps, fallback placement, and tiered chest loot generation.
  - `dungeonEntities.ts`: Boss templates, enemy templates, threat factor math, and follower resets.
  - `dungeonPropsAndShrines.ts`: Interactive shrines and dungeon props.
  - `dungeonGenerator.ts`: Master `generateLevel` orchestrator for multiple archetypes.
  - `index.ts`: Dungeon sub-engine barrel export.
- `src/world/town/`: Modular Town Settlement Sub-Engine:
  - `types.ts`: Town building coordinates and generation interfaces.
  - `townPerimeter.ts`: Castle Town fortress walls, gatehouses, courtyard paving, and harbor port.
  - `townGuards.ts`: Castle sentries, day/night shift schedules, and barracks routines.
  - `townNpcs.ts`: Blacksmiths, Merchants, Apothecaries, Taverns, Quest Boards, and Companions.
  - `townOutskirts.ts`: Border pest spawns with safe grass placement.
  - `townChunkGenerator.ts`: Master `generateTownChunk` orchestrator.
  - `index.ts`: Town sub-engine barrel export.
- `src/world/ruinedCity/`: Contested Ruined City Sub-Engine (`ruinedCityBuildings`, `ruinedCityTurf`, `ruinedCityGenerator`).
- `src/world/overworldPoiGenerator.ts` / `src/world/poiGenerators.ts`: Spawns shrines, ruins, harvestables, and camps.
- `src/world/organic/`: Modular Organic World Generation Sub-Engine:
  - `biomeNoiseEngine.ts`: Continuous Simplex-like noise generator with elevation, moisture, and temperature gradients.
  - `naturalRiverCarver.ts`: Continuous river splines, meanders, and bridge placement.
  - `vegetationClusterGen.ts`: Cellular automata for forest groves and mineral ore lodes.
  - `roadNetworkGen.ts`: Cross-chunk highway trails, POI spokes, and signposts.
  - `index.ts`: Organic world sub-engine barrel export.
- `src/world/overworldStructures.ts` / `src/world/structureGenerators.ts`: Towns, houses, castles, and taverns.
- `src/world/overworldNpcSpawning.ts`: Townspeople, guards, merchants, and roaming fauna.
- `src/world/caravanSkirmishGen.ts`: Dedicated 24×18 tactical skirmish road battle generator for caravan ambushes.
- `src/utils/overworld/overworldChunkGen.ts`: Dynamic streaming chunk generator for the infinite world.
- `src/utils/overworld/asyncChunkBatcher.ts`: Asynchronous chunk streaming and time-sliced background pre-generation.
- `src/utils/dungeon.ts` / `src/utils/overworld/overworldTownGen.ts`: Facade barrels re-exporting modular world sub-engines.

---

### 8. `/src/utils/` — Game Engines, Math, Lore & Audio
- `src/utils/gmStoryteller.ts`: Facade re-exporting the modular storyteller engine.
- `src/utils/storyteller/`: Autonomous AI Game Master sub-engine:
  - `types.ts` / `gmCoordinateUtils.ts`: Storyteller interfaces, memory state, spatial perimeter search, and direction calculations.
  - `storytellerFlavor.ts` / `storytellerEncountersData.ts`: 26 dynamic GM encounters and narrative interpolation.
  - `storytellerChaos.ts`: Chaos score modifications and 20-tier periodic Chaos Core Surge matrices.
  - `storytellerRescue.ts`: Emergency life-saving rescue evaluations and triggers.
  - `storytellerEngine.ts`: Tension, boredom, autonomous monologue, and turn tick runner.
  - `index.ts`: Storyteller barrel export.
- `src/utils/gmNarrator.ts`: Narrative log generator and contextual event flavor broadcaster.
- `src/utils/worldThreat.ts`: World threat scaling and regional difficulty calculation.
- `src/utils/weatherEngine.ts`: Weather shifts, rain, snow, eclipses, and elemental field effects.
- `src/utils/wildernessCamping.ts`: Wilderness campsite surroundings analyzer, shelter quality, and night watch.
- `src/utils/audio.ts`: Facade re-exporting the modular WebAudio synthesizer engine.
- `src/utils/audio/`: Modular WebAudio Synthesizer Sub-Engine:
  - `types.ts` / `voiceManager.ts`: 8-voice concurrency cap, 4-tier priority classification, and node graph recycling.
  - `synthEngine.ts` / `spatialAudio.ts`: Oscillators, ADSR envelopes, filters, and 2D spatial panning.
  - `ambientSoundscapes.ts` / `soundCatalog.ts`: Continuous environmental audio layers and procedural SFX definitions.
  - `acousticOcclusion.ts`: Bresenham obstacle raycasting, behind-door lowpass muffling, transmission volume absorption, and cavity resonance.
  - `index.ts`: Audio engine barrel export.
- `src/utils/buildingAudio.ts`: Indoor detection and acoustic sound dampening.
- `src/utils/combatArchetypes.ts` / `src/utils/combatFloaterDrift.ts`: Combat scaling and floating text physics.
- `src/utils/mutationSynergy.ts` / `src/utils/relics.ts` / `src/utils/scars.ts`: Mutation combinations, relic drafts, and scars.
- `src/utils/tradeEconomy.ts` / `src/utils/shopData.ts`: Price fluctuation algorithm and merchant inventories.
- `src/utils/npcDialogue.ts` / `src/utils/companionAdvice.ts`: NPC dialogue trees and companion advisory quips.
- `src/utils/decorEngine.ts` / `src/utils/structurePlacer.ts`: Housing tile placement and decor furniture system.
- `src/utils/moddingEngine.ts`: Runtime custom item, spell, and enemy modding engine.
- `src/utils/harvestEngine.ts`: Resource harvesting engine enforcing tool requirements and durability checks.
- `src/utils/gameStateFactory.ts`: Initial game state and faction territory bootstrap factory.
- `src/utils/spatial/`: Bit-packed `(y << 16) | (x & 0xFFFF)` 2D spatial hash grid supporting $O(1)$ lookups.
- `src/utils/overworld/chunkMemoryManager.ts`: Active chunk windowing manager with lossless RLE compression (25-chunk cap).
- `src/utils/logBuffer.ts`: Centralized FIFO game log bounding utility maintaining a strict cap of 200 messages.
- `src/utils/logExporter.ts`: Real-time session and combat log formatting and export utility.
- `src/utils/worldmap/worldMapPngExporter.ts`: Realm 40% scale offscreen canvas rasterizer and PNG exporter.
- `src/utils/catalogLiveTuner.ts`: Reactive live data catalog tuning engine for real-time balancing of weapons, bestiary monsters, spells, and global balance constants with JSON profile export/import.
- `src/utils/performanceMonitor.ts`: Real-time performance monitor and telemetry collector tracking frame times, FPS, active audio voices, spatial entity distributions, and chunk memory footprint.

---

### 9. `/src/components/` — UI Components & Views
- `src/components/MainAppLayout.tsx`: Top-level flex viewport, responsive sidebar, canvas stage, and bottom logs.
- `src/components/AppHeaderBar.tsx`: Game title, turn counter, gold, biome indicator, time of day, and main menu buttons.
- `src/components/AppNavigationTabs.tsx`: Tab navigation for Inventory, Crafting, Guild, Bestiary, Relics, and God Mode.
- `src/components/GameCanvas.tsx`: Canvas wrapper handling resize observation, touch/mouse drag, and rendering loop.
- `src/components/GameLog.tsx`: Real-time combat, story, and world interaction event log with 6 tactical category filters.
- `src/components/UnifiedInventoryPanel.tsx`: Composer coordinating modular inventory sub-components.
- `src/components/inventory/`: Modular Inventory Sub-Engine:
  - `types.ts`: Inventory interfaces and rarity analyzer utilities.
  - `HeroBiometricsCard.tsx`: Profile, level progress, and interactive RPG attribute point allocation (STR, DEX, INT, CHA, LCK).
  - `EquipmentPaperdoll.tsx`: 8-slot equipped gear display with durability meters, 2H badge, and scars overlay.
  - `CombatStatsSummary.tsx`: Combat statistics, Cat Lover trait, and permanent battle scars list.
  - `BackpackSlotGrid.tsx`: Carrying weight bar, sort/group triggers, sub-tabs (Allies, Gear, Food, Mats), and item discard.
  - `AlchemicalTransmuterPanel.tsx`: Portable Wild Alchemical Transmuter UI.
  - `index.ts`: Inventory sub-components barrel export.
- `src/components/CraftingPanel.tsx`: Composer coordinating modular crafting stations.
- `src/components/crafting/`: Modular Crafting Sub-Engine:
  - `types.ts`: Crafting station tabs, filter contracts, and handler interfaces.
  - `CraftingHeader.tsx`: Discipline tab switcher (Forge, Alchemy, Cooking, Scriptorium, Catalysts) with search.
  - `MaterialInventoryGrid.tsx`: Side ledger displaying current inventory materials and catalysts.
  - `RecipeCard.tsx`: Modular recipe card with cost badges and level requirements.
  - `ForgeStationTab.tsx`: Weapon & armor forging, tier upgrading, and equipment disassembly.
  - `AlchemyStationTab.tsx`: Potion brewing and elixir synthesis.
  - `CookingStationTab.tsx`: Wilderness ration cooking and stamina sustenance.
  - `ScriptoriumStationTab.tsx`: Spell scroll scribing and arcane glyph tracing minigame.
  - `CatalystStationTab.tsx`: Elemental catalyst equipment infusions.
  - `ItemTierUpgradeModal.tsx` / `DisassembleModal.tsx`: Dedicated smithing modal dialogs.
  - `CraftingPanelContainer.tsx`: Central coordinator for stations and upgrade modals.
  - `index.ts`: Crafting sub-components barrel export.
- `src/components/AppOverlays.tsx` / `src/components/ModalRouter.tsx`: Modal coordinator for dialogs and overlays.
- `src/components/panels/`:
  - `PlayerSidebarPanel.tsx`: Health/Mana bars, stats, active buffs, companion roster, and quick spells.
  - `MobileCommandPad.tsx` / `MobileHudBar.tsx`: Touch controls, D-pad, and quick action bars for mobile screens.
  - `ViewportAlertBanners.tsx` / `WeatherForecastBanner.tsx`: Active weather alerts and boss warnings.
- `src/components/screens/`:
  - `StartScreen.tsx`: Title screen, class selection, and new game initializer.
  - `GameOverScreen.tsx` / `VictoryScreen.tsx`: Permadeath summary, run statistics, and restart triggers.
- `src/components/GuildOverlay.tsx`: Composer coordinating headquarters, sanctuary, war treasury, companion dispatch, and vaults.
- `src/components/guild/`: Modular Guild Sub-Engine:
  - `types.ts`: Guild tabs and storage contracts.
  - `useGuildOperations.ts`: Business logic hook for HQ, upgrades, sanctuary, safehouses, war treasury, and expeditions.
  - `GuildHeaderBar.tsx` / `GuildHQPanel.tsx` / `GuildSanctuaryPanel.tsx`: Guild navigation, HQ, and decor buffs.
  - `GuildFactionWarPanel.tsx`: Faction gear crafting, war treasury, tactical directives, and territory maps.
  - `GuildMissionBoard.tsx`: Autonomous companion expedition dispatch board and rewards ledger.
  - `GuildStashPanel.tsx`: Dual-pane item/material/catalyst storage vault with Quick Stash All and safehouses.
  - `index.ts`: Guild sub-components barrel export.
- `src/components/worldmap/`: Modular Cartography World Map & Sector Intelligence:
  - `types.ts`: World map POIs, chunk map info, custom pins, filter state, and biome models.
  - `chunkTileRasterizer.ts`: Micro-tile surface rasterizer with topographic hillshading and dual LRU cache bitmaps.
  - `WorldMapHeader.tsx`: Compass header with coordinate tracking, inspect breadcrumbs, and filter toggles.
  - `WorldMapCanvas.tsx`: Dual-canvas architecture with frustum culling, drag-to-pan inertia, and mobile D-pad.
  - `WorldMapChunkTooltip.tsx`: Sector inspection dossier with collapsible minimize/expand pill toggle.
  - `WorldMapPinsList.tsx` / `CustomPinEditorModal.tsx` / `WorldMapLegend.tsx`: Custom pin management and legend.
  - `WorldMapModal.tsx`: Top-level modal container coordinating map components and hotkeys.
  - `index.ts`: World map barrel export.
- `src/components/god/`: 27 God Mode developer tools (`TilesetTesterTab`, `GodCatalogLiveTuner`, `GodMinigamesTab`, `GodArenaTab`, `GodWorldEditor`, `GodEntitySpawner`, `GodItemSpawner`, `GodWeatherScarEditor`, `GodStorytellerPanel`, `GodReplayTab`, etc.).
- `src/components/modals/`: Dialogue modals, town shops, bed resting, caravan battles, and fishing/lockpicking minigames.
- `src/components/PerformanceHud.tsx`: Real-Time Performance & Resource HUD with live FPS graph, memory meters, voice monitor, entity distribution gauges, viewport resolution, and position cycling.

---

### 10. `/src/tests/` — Automated Test Suite
- 63 comprehensive Vitest test suites (390 unit, simulation, and integration tests passing 100% green) covering elemental propagation and environmental chain reactions (`elementalPropagation.test.ts`), button interactions across all phases (`automatedButtonSuite.test.ts`, `godMinigamesTab.test.ts`, `automatedCraftingButtonSuite.test.ts`, `automatedInventoryButtonSuite.test.ts`, `automatedGuildButtonSuite.test.ts`, `automatedWorldMapButtonSuite.test.ts`, `automatedGodAndStudioButtonSuite.test.ts`), morale and surrender sub-engine (`moraleAndSurrenderE2.test.ts`), performance telemetry & HUD (`performanceHudAndMonitoring.test.ts`), live data catalog tuning (`catalogLiveTuner.test.ts`), tileset source selection (`tilesetSourceSelection.test.ts`), unique dungeon biomes and chest generation (`biomesAndUniqueDungeons.test.ts`), caravan tactical skirmishes (`caravanEncounters.test.ts`), async chunk batching (`asyncChunkBatcher.test.ts`), save/load serialization and legacy state migration (`automatedSaveLoadAndMigrationSuite.test.ts`), cartography PNG exporter (`worldMapPngExporter.test.ts`), combat, AI pathfinding and behavioral roles, procedural world generation, data catalogs, weather, Storyteller GM engine, companion advice, economy, crafting, app hooks, game state initialization, WebAudio synthesizer sub-engine, and modular inventory sub-components.

---

*Note: Whenever files or directories are added or refactored, update this document to keep the architectural reference synchronized.*
