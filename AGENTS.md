# Codebase Architecture & Directory Map

This document serves as the authoritative structural map and development ruleset for AI assistants and developers working on the codebase. It details the responsibility, architecture, and contents of each directory and module.

---

## 🏛️ Core Engine Principles & Development Rules

1. **Modular & Component-Based Architecture**:
   - Every system, mechanic, hook, and renderer MUST be kept focused, modular, and cleanly decoupled.
   - **Strict Anti-Monolith Rule**: Files MUST NOT grow into bloated monoliths. If a component, utility, hook, or generator exceeds single-responsibility scope or starts accumulating large sub-branches, proactively refactor and extract helper functions, sub-components, and sub-hooks into dedicated files.
   - Prefer small, highly cohesive files with clear input/output contracts over large all-in-one files.

2. **Highly Data-Driven Design**:
   - Game content (items, recipes, monsters, bestiary, spells, scrolls, story interventions, dialogues, relics, scars, sound effects, quests, and trade tariffs) MUST live in structured JSON registries under `/src/data/`.
   - Never hardcode static entity stats, recipes, or large text pools directly inside UI components or game hooks. Use the data loaders and type-safe catalog accessors in `/src/data/index.ts`.

3. **Easily Modifiable & Extensible Roguelike Engine**:
   - Adding new items, monsters, weather conditions, biomes, or story encounters should only require adding entries to the corresponding JSON catalog and type definitions without rewriting existing rendering or combat pipelines.
   - Keep interfaces flexible and extensible using TypeScript types in `/src/types/`.

4. **Continuous Synchronization**:
   - Whenever files, hooks, or directories are added, split, or refactored, ALWAYS update this `AGENTS.md` file to keep the structural blueprint synchronized for AI assistants.

---

## 📁 Root Configuration & Scripts
- `package.json` / `tsconfig.json` / `vite.config.ts`: Project manifest, TypeScript build configs, and Vite dev server configuration.
- `metadata.json`: Platform metadata (app name, description, capabilities).
- `scripts/`:
  - `auditCodebase.cjs`: Complete graph audit script (validates all JSON schemas, imports, exports, and file references).
  - `validateJson.cjs`: Automated JSON linting & catalog syntax validator.

---

## 📁 `/src` — Application Source

### 1. Root Application Files
- `src/App.tsx`: Central game coordinator, top-level state orchestrator, tab navigation, and overlay router.
- `src/main.tsx`: React DOM mount point and root provider wrapping.
- `src/index.css`: Global Tailwind CSS imports and pixel-art rendering rules.
- `src/types.ts`: Global re-export barrel for all domain types.
- `src/declarations.d.ts`: Ambient module declarations.

---

### 2. `/src/types/` — Domain Types & Interfaces
- `src/types/entities.ts`: Actor definitions, player stats, enemies, NPCs, companion followers, stats, buffs, and status effects.
- `src/types/items.ts`: Inventory items, weapon/armor templates, recipes, materials, catalysts, and equipment slots.
- `src/types/map.ts`: Tile types, world chunks, biomes, weather conditions, structures, dungeons, and POIs.
- `src/types/game.ts`: Game state, logs, chaos scores, storyteller state, and UI view modes.
- `src/types/index.ts`: Barrel index re-exporting all types.

---

### 3. `/src/data/` — Static Catalogs & JSON Registries
- `src/data/items.json`: Master item database (weapons, armor, tools, consumables, resources).
- `src/data/recipes.json`: Crafting, forging, alchemy, and cooking recipes.
- `src/data/enemies.json` / `src/data/bestiary.json`: Monster blueprints, AI archetype stats, resistances, and lore.
- `src/data/spells.json` / `src/data/spellScrolls.json`: Arcane spell definitions and scroll scriptorium catalogs.
- `src/data/storyEvents.json` / `src/data/storytellerQuotes.json`: Game Master interventions, pity/rescue hooks, and narrative events.
- `src/data/catalysts.json` / `src/data/relics.json` / `src/data/scars.json`: Mutation matrices, draftable sanctum relics, and permanent world scars.
- `src/data/tradeItems.json` / `src/data/quests.json` / `src/data/npcDialogues.json`: Regional trade tariffs, quest boards, and NPC dialogues.
- `src/data/historyBook.json` / `src/data/decorTemplates.json` / `src/data/soundCatalog.json`: Lore chronology, house decorator templates, and sound registers.
- `src/data/index.ts`: Type-safe helper accessors and validated loaders for all JSON files.

---

### 4. `/src/canvas/` — 2D Grid & Graphics Rendering Engine
- `src/canvas/HybridGraphicsEngine.ts`: Primary rendering coordinator (supports canvas 2D & WebGL fallbacks).
- `src/canvas/tileMapRenderer.ts`: Efficient viewport chunk renderer for terrain, water, roads, biomes, and indoor tiles.
- `src/canvas/entityLayerRenderer.ts`: Renders player, monsters, town guards, animals, projectiles, and floating combat text.
- `src/canvas/weatherLightingRenderer.ts`: Ambient day/night cycles, darkness shaders, fog of war, rain, snow, and storms.
- `src/canvas/waterShimmerRenderer.ts`: Procedural sine-wave specular ripples, wave foam lines, and crystalline glints for water tiles.
- `src/canvas/biomeAtmosphereRenderer.ts`: Ambient micro-particle renderer (falling snowflakes, swamp bioluminescent fireflies/wisps, and underworld volcanic embers).
- `src/canvas/shadowRenderer.ts`: Directional shadow projection for trees, buildings, and entities.
- `src/canvas/VFXEmitter.ts` / `src/canvas/visualFxParticleSystem.ts`: Particle effects (sparks, magic auras, leaf drifts, dust devils).
- `src/canvas/TilesetAtlasManager.ts` / `src/canvas/TilesetRenderer.ts`: Texture atlas loading and sprite-sheet tile slicing.
- `src/canvas/spriteAnimationManager.ts` / `src/canvas/spriteRenderer.ts`: Animated sprite frame progression.
- `src/canvas/TextRenderer.ts`: High-DPI floating numbers, overhead speech bubbles, and nametags.
- `src/canvas/AssetPreloader.ts`: Sprite preloading and bitmap caching.
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
- `src/hooks/useSpellcasting.ts`: Mana verification, spell casting, AOE targeting, and cooldowns.
- `src/hooks/useEnemyAI.ts`: Backward-compatible facade re-exporting the modular AI engine.
- `src/hooks/ai/`: Modular Autonomous AI & Combat Resolution Sub-Engine:
  - `types.ts`: Context parameters, environment outcomes, and hostile combat response structures.
  - `aiTurnEnvironment.ts`: Status effect resolution (DoTs, HoTs, poison, food buffs), environmental weather/seasons, day/night cycles, GM POI nudges, companion tactical advice, and adaptive roaming monster spawning.
  - `useFollowerAI.ts`: Follower targeting, ranged/melee attacks, dynamic weapon range detection (bow/staff/spear), and tactical fallback with player.
  - `useTownGuardAI.ts`: Town defense threat response, 30-tile alarm broadcast, day/night shift scheduling, and barracks bed sleeping routines.
  - `useHostileAI.ts`: Debuff/stun ticks, posture stagger recovery, telegraphed attack warning & impact/brace/dodge mechanics, wagon targeting, defender priority, player combat calculations (affixes, armor penetration, crits, scars, durability decay), pack flanking, and retreat reinforcement calls.
  - `useCivilianAI.ts`: Cat playful wandering, civilian schedules (work/leisure/campfire/home sleep), blizzard/rain shelter reactions, ambient barks, and hireable hero counter-attacks.
  - `aiCombatAggregator.ts`: Aggregated visual floating text dispatcher (`spawn-game-effect`) and tactical caravan skirmish victory evaluations.
  - `useEnemyAI.ts`: Central turnkey coordinator executing turn-based AI resolution.
  - `index.ts`: Modular AI engine barrel export.
- `src/hooks/useCraftingEngine.ts`: Central crafting dispatcher.
  - `src/hooks/crafting/useEquipmentCrafting.ts`: Weapon/armor forging and tier upgrading.
  - `src/hooks/crafting/useSurvivalCrafting.ts`: Cooking, camp tools, and alchemy brewing.
  - `src/hooks/crafting/useUtilityCrafting.ts`: Scriptorium scroll scribing and catalyst infusions.
- `src/hooks/useCaravanTravel.ts` / `src/hooks/useTradeEconomy.ts`: Merchant caravan routes, fast travel, and regional trade prices.
- `src/hooks/usePoiAndWilderness.ts` / `src/hooks/useOverworldEvents.ts`: Shrines, berry bushes, ruins, dungeons, and world events.
- `src/hooks/useQuestsAndGuild.ts` / `src/hooks/useTownServices.ts`: Guild mission tracking, inn resting, and healer/blacksmith services.
- `src/hooks/useNpcInteraction.ts`: Conversational branching, trading, and companion hiring.
- `src/hooks/useSaveLoad.ts`: LocalStorage and cloud save game state serializer/deserializer.
- `src/hooks/useAmbientAudio.ts`: Procedural Web Audio music and environmental soundscape manager.
- `src/hooks/useAppHotkeys.ts` / `src/hooks/input/`: Key bindings, modal hotkeys, and directional controls.
- `src/hooks/god/useGodPanelState.ts`: Dedicated orchestrator for God Mode cheats, sandbox tweaks, structure blueprints, and developer testing state.
- `src/hooks/app/`: Modular Application-level orchestration hooks extracted from `App.tsx`:
  - `src/hooks/app/usePlayerTurnMovement.ts`: Turn-based step resolver and movement dispatcher.
  - `src/hooks/app/movement/`: Modular Movement & World Collision Sub-Engine:
    - `types.ts`: Movement contexts and step evaluation contracts.
    - `useStepResolver.ts`: Boundary detection, enemy/follower/NPC collision checks, and door opening triggers.
    - `useTerrainHazards.ts`: Mud/ice/sand terrain modifiers, exhaustion rates, and spike/poison/fire vent traps.
    - `useTileLooting.ts`: Tiered chest loot distribution, gold pickup, and inventory rewards.
    - `useChunkTransition.ts`: Continuous overworld chunk border streaming calculations.
    - `index.ts`: Modular movement barrel export.
  - `src/hooks/app/useGKeyInteraction.ts`: G-key multi-context interaction router (signs, beds, bushes, NPCs, shrines).
  - `src/hooks/app/useAutoplayAgent.ts`: Autonomous playtesting agent for simulated gameplay runs.
  - `src/hooks/app/useDungeonStairsAndTransitions.ts`: Multi-depth stair climbs and overworld-dungeon transitions.
  - `src/hooks/app/useTownInteractions.ts`: Town doors, resting, and resource harvesting.
  - `src/hooks/app/useCombatAndSpells.ts`: Attack dispatch, spellcasting, and scroll execution.
  - `src/hooks/app/useConsumablesAndCatalysts.ts`: Inventory consumables, catalyst infusions, and quick healing.
  - `src/hooks/app/useShopAndTradeHandlers.ts`: Merchant shops, caravan routes, and item transactions.
- `src/hooks/index.ts`: Hooks barrel export.

---

### 7. `/src/world/` & `/src/utils/overworld/` — Procedural Generation
- `src/world/overworldGen.ts`: Macro-scale continent, biome distribution, elevations, rivers, and coastlines.
- `src/world/dungeon/`: Modular Dungeon Generation Sub-Engine:
  - `types.ts`: Dungeon room types, generated level contracts, and boss templates.
  - `dungeonRooms.ts`: Organic multi-archetype room generation (rectangular, circular, cross chambers) and underworld lava pools.
  - `dungeonCorridors.ts`: Multi-tile wide corridor carving, loop connections, and doorway thresholds.
  - `dungeonTrapsAndChests.ts`: Spike vents, fire vents, poison gas traps, and tiered chest loot generation.
  - `dungeonEntities.ts`: Boss templates, enemy templates, threat factor math, elite perks, captive/jailer spawning, and follower resets.
  - `dungeonPropsAndShrines.ts`: Double-edged interactive shrines and dungeon props.
  - `dungeonGenerator.ts`: Master `generateLevel` orchestrator.
  - `index.ts`: Dungeon sub-engine barrel export.
- `src/world/town/`: Modular Town & Settlement Generation Sub-Engine:
  - `types.ts`: Town building coordinates and generation interfaces.
  - `townPerimeter.ts`: Castle Town fortress walls, gatehouses with flanking towers, courtyard paving, and harbor port features (HMS Tidebreaker, The Salty Siren, fish market, crane).
  - `townGuards.ts`: Castle sentries, day/night shift schedules, barracks bed routines, and village defense patrols.
  - `townNpcs.ts`: Blacksmiths, Merchants, Apothecaries, Tavern Masters, Drunk Villagers, Town Criers, Quest Boards, Companions, Legendary Cats, and Harbor Crew.
  - `townOutskirts.ts`: Border pest spawns (rats, slimes, goblins, spiders) with safe grass placement.
  - `townChunkGenerator.ts`: Master `generateTownChunk` orchestrator.
  - `index.ts`: Town sub-engine barrel export.
- `src/world/overworldPoiGenerator.ts` / `src/world/poiGenerators.ts`: Spawns shrines, ruins, harvestables, and camps.
- `src/world/organic/`: Modular Organic World Generation Sub-Engine:
  - `biomeNoiseEngine.ts`: Multi-octave continuous Simplex-like noise generator with elevation, moisture, and temperature gradients.
  - `naturalRiverCarver.ts`: Natural continuous river splines, meanders, and natural pathway bridges.
  - `vegetationClusterGen.ts`: Cellular automata for forest groves, clearings, and clustered copper/iron mineral ore lodes.
  - `roadNetworkGen.ts`: Cross-chunk meandering highway trails, POI trail spoke connectors, crossroads signposts, and safe entrance clearance buffers.
  - `index.ts`: Organic world sub-engine barrel export.
- `src/world/overworldStructures.ts` / `src/world/structureGenerators.ts`: Procedural towns, houses, castles, and taverns.
- `src/world/overworldNpcSpawning.ts`: Townspeople, guards, merchants, and roaming fauna.
- `src/world/caravanSkirmishGen.ts`: Road blockades and roadside ambush encounters.
- `src/utils/overworld/overworldChunkGen.ts`: Dynamic streaming chunk generator for the infinite world.
- `src/utils/dungeon.ts` / `src/utils/overworld/overworldTownGen.ts`: Backward-compatible facade barrels re-exporting modular world sub-engines.

---

### 8. `/src/utils/` — Game Engines, Math, Lore & Audio
- `src/utils/gmStoryteller.ts`: Backward-compatible facade re-exporting the modular storyteller engine.
- `src/utils/storyteller/`: Autonomous AI Game Master sub-engine:
  - `types.ts`: Storyteller interfaces, memory state, personalities, and catalog types.
  - `storytellerFlavor.ts`: Dynamic narrative prompt and placeholder interpolators.
  - `storytellerEncountersData.ts`: Master catalog of 26 dynamic GM encounters.
  - `storytellerChaos.ts`: Chaos score modifications and 20-tier periodic Chaos Core Surge matrices.
  - `storytellerRescue.ts`: Critical life-saving rescue evaluations and emergency triggers.
  - `storytellerEngine.ts`: Tension, boredom, autonomous monologue, and turn tick runner.
  - `index.ts`: Storyteller barrel export.
- `src/utils/gmNarrator.ts`: Narrative log generator and contextual event flavor broadcaster.
- `src/utils/worldThreat.ts`: World threat scaling and regional difficulty calculation.
- `src/utils/weatherEngine.ts`: Weather shifts, rain, snow, eclipses, and elemental field effects.
- `src/utils/wildernessCamping.ts`: Wilderness campsite surroundings analyzer, shelter quality calculations, weather insulation, companion night watch sentry detection, and nocturnal ambush encounter simulator.
- `src/utils/audio.ts`: Backward-compatible facade re-exporting the modular WebAudio synthesizer engine.
- `src/utils/audio/`: Modular WebAudio Synthesizer Sub-Engine:
  - `types.ts`: Audio context interfaces, tone definitions, SFX registries, and sound parameters.
  - `synthEngine.ts`: WebAudio node graphs, oscillators, ADSR envelopes, filters, and global gain control.
  - `spatialAudio.ts`: 2D tile coordinate panning, low-pass distance muffling, and volume falloff.
  - `ambientSoundscapes.ts`: Continuous environmental audio layers (rain, blizzards, winds, dungeon caves, tavern chatter).
  - `soundCatalog.ts`: Procedural sound design definitions for UI, spells, combat hits, loot drops, footsteps, crafting, boss fanfares, and death cues.
  - `index.ts`: Audio engine barrel export.
- `src/utils/buildingAudio.ts`: Indoor detection and acoustic sound dampening.
- `src/utils/combatArchetypes.ts` / `src/utils/combatFloaterDrift.ts`: Combat scaling, damage formulas, and visual floating text physics.
- `src/utils/mutationSynergy.ts` / `src/utils/relics.ts` / `src/utils/scars.ts`: Player mutation combinations, relic draft logic, and scar curses.
- `src/utils/tradeEconomy.ts` / `src/utils/shopData.ts`: Price fluctuation algorithm and merchant inventories.
- `src/utils/npcDialogue.ts` / `src/utils/companionAdvice.ts`: Contextual NPC dialogue trees and companion advisory quips.
- `src/utils/decorEngine.ts` / `src/utils/structurePlacer.ts`: Housing tile placement and decor furniture system.
- `src/utils/moddingEngine.ts`: Runtime custom item, spell, and enemy modding engine.
- `src/utils/harvestEngine.ts`: Modular resource harvesting engine enforcing tool requirements, active/broken durability checks (hatchet for trees, pickaxe for ore veins), and automatic inventory fallback.
- `src/utils/gameStateFactory.ts`: Initial game state and faction territory bootstrap factory.
- `src/utils/logExporter.ts`: Real-time session and combat log formatting and export utility.

---

### 9. `/src/components/` — UI Components & Views
- `src/components/MainAppLayout.tsx`: Top-level flex viewport, responsive sidebar, canvas stage, and bottom logs.
- `src/components/AppHeaderBar.tsx`: Game title, turn counter, gold, biome indicator, time of day, and main menu buttons.
- `src/components/AppNavigationTabs.tsx`: Tab navigation for Inventory, Crafting, Guild, Bestiary, Relics, and God Mode.
- `src/components/GameCanvas.tsx`: Canvas wrapper handling resize observation, touch/mouse drag, and rendering loop.
- `src/components/GameLog.tsx`: Real-time combat, story, and world interaction event log.
- `src/components/UnifiedInventoryPanel.tsx`: Lightweight composer coordinating modular sub-components for biometrics, paperdoll, combat stats, backpack stashes, and transmuter.
- `src/components/inventory/`: Modular Inventory Sub-Engine & Decoupled Panels:
  - `types.ts`: Inventory interfaces, action handler contracts, item/food/material rarity analyzers (`getItemRarityValue`, `getFoodRarityValue`, `getMaterialRarityValue`).
  - `HeroBiometricsCard.tsx`: Hero profile, level progress, and interactive Core RPG Attribute point allocation (STR, DEX, INT, CHA, LCK).
  - `EquipmentPaperdoll.tsx`: 8-slot equipped gear display (Helmet, Armor, Boots, Weapon R-Hand, Shield L-Hand, Gauntlets, Amulet) with durability bars, 2-handed occupied badge, humanoid cat wireframe, active scars visual overlay, and broken item indicators.
  - `CombatStatsSummary.tsx`: Calculated combat statistics, Cat Lover special trait card, and Permanent Battle Scars list with simulate scar trigger.
  - `BackpackSlotGrid.tsx`: Carrying weight limit bar, overburdened status alert, Sort & Group stashes trigger, 4 sub-navigation tabs (Allies, Gear, Food, Resources/Mats), and discard long-press/gump modal triggers.
  - `AlchemicalTransmuterPanel.tsx`: Portable Wild Alchemical Transmuter UI (catalyst alignment shifter, Unstable Wild Reactor surge button, offline fallback card).
  - `index.ts`: Inventory sub-components barrel export.
- `src/components/CraftingPanel.tsx`: Lightweight composer coordinating modular crafting stations.
- `src/components/crafting/`: Modular Crafting Sub-Engine & Decoupled Stations:
  - `types.ts`: Crafting station tabs, filter contracts, and handler interfaces.
  - `CraftingHeader.tsx`: Discipline tab switcher (Forge, Alchemy, Cooking, Scriptorium, Catalysts) with live text search.
  - `MaterialInventoryGrid.tsx`: Side ledger displaying current inventory materials and catalysts.
  - `RecipeCard.tsx`: Modular recipe card with cost badges and level requirements.
  - `ForgeStationTab.tsx`: Weapon & armor forging, tier upgrading, and equipment disassembly.
  - `AlchemyStationTab.tsx`: Potion brewing and elixir synthesis.
  - `CookingStationTab.tsx`: Wilderness ration cooking and stamina sustenance.
  - `ScriptoriumStationTab.tsx`: Spell scroll scribing and arcane glyph matrices.
  - `CatalystStationTab.tsx`: Elemental catalyst equipment infusions.
  - `ItemTierUpgradeModal.tsx` / `DisassembleModal.tsx`: Dedicated smithing modal dialogs.
  - `CraftingPanelContainer.tsx`: Central coordinator for stations and upgrade modals.
  - `index.ts`: Crafting sub-components barrel export.
- `src/components/AppOverlays.tsx` / `src/components/ModalRouter.tsx`: Modal coordinator for overlays.
- `src/components/panels/`:
  - `PlayerSidebarPanel.tsx`: Health/Mana bars, stats, active buffs, companion roster, and quick spells.
  - `MobileCommandPad.tsx` / `MobileHudBar.tsx`: Touch controls, D-pad, and quick action bars for mobile screens.
  - `ViewportAlertBanners.tsx` / `WeatherForecastBanner.tsx`: Active weather alerts and boss warnings.
- `src/components/screens/`:
  - `StartScreen.tsx`: Title screen, class selection, and new game initializer.
  - `GameOverScreen.tsx` / `VictoryScreen.tsx`: Permadeath summary, run statistics, and restart triggers.
- `src/components/GuildOverlay.tsx`: Lightweight composer coordinating modular sub-components for headquarters, sanctuary installments, faction war treasury, companion dispatch, and safehouse storage.
- `src/components/guild/`: Modular Sunder Guild Sub-Engine & Decoupled Panels:
  - `types.ts`: Guild tabs, props interfaces, and safehouse storage contracts.
  - `useGuildOperations.ts`: Central business logic hook handling HQ acquisition, laboratory research upgrades, sanctuary decor, safehouse purchasing/resting, storage transfers (materials, catalysts, equipment, bulk stash all), faction gear forging, tax claims, gold war contributions, tactical directives, and autonomous companion expeditions.
  - `GuildHeaderBar.tsx`: Navigation tabs with responsive badge indicators.
  - `GuildHQPanel.tsx`: Oakhaven Town (Chunk 0,0) headquarters founding, laboratory research upgrades, and passive guild registry stats.
  - `GuildSanctuaryPanel.tsx`: Custom installments, trophies, and active decor buffs.
  - `GuildFactionWarPanel.tsx`: Faction exclusive armaments & blueprint crafting, war treasury coffers, gold contributions, tactical campaign directives, and regional conquest territory maps with tax dividends.
  - `GuildMissionBoard.tsx`: Autonomous companion expedition dispatch board, speed modifiers, and rewards claim ledger.
  - `GuildStashPanel.tsx`: Dual-pane item/material/catalyst storage vault with Quick Stash All and wilderness safehouse purchase/rest.
  - `GuildTreasuryPanel.tsx`: Backward-compatible composed facade delegating to sub-panels.
  - `index.ts`: Guild sub-components barrel export.
- `src/components/worldmap/`: Modular Cartography World Map & Sector Intelligence:
  - `types.ts`: World map POIs, chunk map info, custom map pins, filter state contracts, biome models, and `TraversalIndex` travel ease models.
  - `chunkTileRasterizer.ts`: High-performance micro-tile surface rasterizer for discovered chunks with topographic hillshading (Lambertian relief lighting from NW, elevation contour intervals, alpine snow cap peaks, oceanic depth factor, and dual LRU cache bitmaps for micro-tiles and downsampled LOD macro canvas thumbnails).
  - `WorldMapHeader.tsx`: Compass header with coordinate tracking, chunk inspect breadcrumbs, zoom stepper, recenter hero button, custom pins/waystone ledger counters, dynamic frontier bounds indicator, and filter toggles.
  - `WorldMapCanvas.tsx`: High-performance 2D dual-canvas decoupled architecture (static terrain/highways/POI markers background layer + dynamic hero beacon pulse/leyline aura top layer) with mathematical frustum culling, dynamic realm frontier expansion, LOD downsampling, drag-to-pan, fog of war stippling, trade route highway paths with casing and crossroads junction markers, town/dungeon/harbor markers, glowing waystone obelisks, player pin badges, and pulsing hero pin.
  - `WorldMapChunkTooltip.tsx`: Sector inspection dossier displaying threat tiers, elevation/moisture metrics, Sector Traversal Index with speed % & terrain modifiers, known POIs, waystone status, and fast travel teleport triggers.
  - `WorldMapPinsList.tsx`: Side drawer ledger tracking discovered Leyline Waystones and custom user explorer pins with direct teleport and navigation triggers.
  - `CustomPinEditorModal.tsx`: Interactive explorer modal for creating, styling, color-coding, and noting custom chunk pins.
  - `WorldMapLegend.tsx`: Cartographer's map legend and interactive controls guide with micro-terrain indicators.
  - `WorldMapModal.tsx`: Top-level modal container coordinating header, canvas, inspector, custom pin editor, waystone teleporter drawer, and hotkey listeners.
  - `index.ts`: World map barrel export.
- `src/components/god/`: 23 God Mode developer tools (World Editor, Entity Spawner, Item Creator, Invincible Player Damage Immunity Toggle, Omniscient World Map Cartography Charting, Weather/Scar Editor, Replay Sim, etc.).
- `src/components/modals/`: Dialogue modals, town shops, bed resting, and fishing/lockpicking minigames.

---

### 10. `/src/tests/` — Automated Test Suite
- 50 comprehensive Vitest test suites (308 tests) covering every interactive action button across the application: God Mode Sandbox Cheats, GM Chaos Console & Audio Oscilloscope Studio (`automatedGodAndStudioButtonSuite.test.ts`), World Cartography, Waystones & Custom Pins (`automatedWorldMapButtonSuite.test.ts`), Sunder Guild Operations & Safehouse Vaults (`automatedGuildButtonSuite.test.ts`), Crafting/Smithing/Alchemy/Cooking/Transmuter suites (`automatedCraftingButtonSuite.test.ts`), Inventory/8-Slot Paperdoll/RPG Attribute suites (`automatedInventoryButtonSuite.test.ts`), Top-level Navigation Tabs & Controls (`automatedButtonSuite.test.ts`), combat, AI pathfinding, procedural world generation, organic multi-octave terrain and continuous rivers, realm cartography, chunk-by-chunk exploration and world map data, save/load serialization, data catalogs, weather, Storyteller GM engine, companion advice, economy, crafting station sub-engines, WebAudio synthesizer sub-engine, player movement sub-engine, inventory sub-components, tool harvesting durability enforcement, and water shimmer/biome micro-atmosphere visual rendering.


---

*Note: Whenever files or directories are added or refactored, update this document to keep the architectural reference synchronized.*
