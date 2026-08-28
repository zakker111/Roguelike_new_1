# 🗺️ Sovereign Roguelike Engine — Codebase Structure & Architecture Map

This document is the authoritative structural reference for the entire **Sovereign Roguelike Engine**. It outlines every module, system directory, and component, establishing architectural principles to maintain clean modularity and avoid monolithic files.

---

## 🏛️ Core Engine Principles & Architecture Rules

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
   - Whenever files, hooks, or directories are added, split, or refactored, ALWAYS update this document and `AGENTS.md` to keep the structural blueprint synchronized for AI assistants and developers.

---

## 📁 System Architecture & Directory Map

### 1. Root Configuration & Scripts
- `package.json` / `tsconfig.json` / `vite.config.ts`: Project manifest, TypeScript build configs, and Vite dev server configuration.
- `metadata.json`: Platform metadata (app name, description, capabilities).
- `codebase_structure.md` / `AGENTS.md`: Codebase architecture maps and engine rules.
- `scripts/`:
  - `auditCodebase.cjs`: Complete graph audit script (validates all JSON schemas, imports, exports, and file references).
  - `validateJson.cjs`: Automated JSON linting & catalog syntax validator.

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
- `src/hooks/ai/`: Modular AI Behavior & Enemy/Civilian Decision Trees:
  - `types.ts`: AI parameter context, return contracts, and state typing.
  - `aiTurnEnvironment.ts`: Status effect ticks, weather/season shifts, daylight cycles, companion tactical advice, and roaming spawns.
  - `useFollowerAI.ts`: Companion follow logic, ranged weapon awareness (bow/magic/spear/melee), tactical retreats, and combat assist.
  - `useTownGuardAI.ts`: Town defense threat response, 30-tile alarm broadcast, day/night shift scheduling, and barracks bed sleeping routines.
  - `useHostileAI.ts`: Stagger posture mechanics, telegraphed attacks with BRACE/DODGE, wagon attacks, companion targeting, armor penetration, and wounded reinforcements call.
  - `useCivilianAI.ts`: Cat playful wandering, civilian schedules (work/leisure/campfire/home sleep), blizzard/rain shelter reactions, ambient barks, and hireable hero counter-attacks.
  - `aiCombatAggregator.ts`: Aggregated visual floating combat text dispatcher and tactical caravan skirmish victory evaluations.
  - `useEnemyAI.ts`: Central turnkey coordinator executing turn-based AI resolution.
  - `index.ts`: Modular AI engine barrel export.
- `src/hooks/useGameLoop.ts`: Central tick loop, turn progression, enemy AI processing, and status effect decay.
- `src/hooks/usePlayerMovement.ts`: Movement handling, wall collisions, door opening, and tile interaction triggers.
- `src/hooks/usePlayerAttack.ts` / `src/hooks/useCombatEngine.ts`: Melee/ranged attacks, damage calculations, crits, and mutations.
- `src/hooks/useSpellcasting.ts`: Mana verification, spell casting, AOE targeting, and cooldowns.
- `src/hooks/useEnemyAI.ts`: Backward-compatible facade delegating to `src/hooks/ai/`.
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
- `src/hooks/useAppHotkeys.ts`: Key bindings, modal hotkeys, and directional controls.
- `src/hooks/god/useGodPanelState.ts`: Dedicated orchestrator for God Mode cheats, sandbox tweaks, structure blueprints, and developer testing state.
- `src/hooks/app/`: Granular extracted App interaction hooks:
  - `usePlayerTurnMovement.ts`: Turn-based step resolver, chunk boundaries, terrain hazards, traps, and looting.
  - `useGKeyInteraction.ts`: G-key multi-context interaction router (signs, beds, bushes, NPCs, shrines).
  - `useAutoplayAgent.ts`: Autonomous playtesting agent for simulated gameplay runs.
  - `useShopAndTradeHandlers.ts`: Merchant shopping, regional trade buy/sell, and price tariff interactions.
  - `useQuestAndGuildHandlers.ts`: Guild missions, quest turn-ins, rank progression, and treasury management.
  - `useShrineAndChestHandlers.ts`: Dungeon shrines, chest unlocking, lockpick consumption, and mimic encounters.
  - `useConsumablesAndCatalysts.ts`: Meat roasting/eating, catalyst shifting, reactor surges, and stat point allocations.
  - `useDungeonStairsAndTransitions.ts`: Multi-depth stair climbs and overworld-dungeon transitions.
  - `useTownInteractions.ts`: Town doors, resting, and resource harvesting.
  - `useCombatAndSpells.ts`: Attack dispatch, spellcasting, and scroll execution.
- `src/hooks/index.ts`: Hooks barrel export.

---

### 7. `/src/world/` & `/src/utils/overworld/` — Procedural Generation
- `src/world/overworldGen.ts`: Macro-scale continent, biome distribution, elevations, rivers, and coastlines.
- `src/world/overworldBiomes.ts`: Multi-octave continuous noise distribution calculating 7 distinct overworld biomes (Forest, Desert, Tundra, Swamp, Glacial Ice Caverns, Volcanic Caldera, Sunken Coral Reef).
- `src/world/dungeon/`: Modular Dungeon Generation Sub-Engine:
  - `types.ts`: Dungeon room types, generated level contracts, and boss templates.
  - `dungeonRooms.ts`: Organic multi-archetype room generation (rectangular, circular, cross chambers) and underworld lava pools.
  - `dungeonCorridors.ts`: Multi-tile wide corridor carving, loop connections, and doorway thresholds.
  - `dungeonTrapsAndChests.ts`: Archetype-specific traps (Geyser, Magma Eruption, Frostbite Vent, Falling Icicle, Sulfur Vent, Spike, Fire, Poison) and tiered chest loot generation.
  - `dungeonEntities.ts`: Boss templates, enemy templates, threat factor math, elite perks, captive/jailer spawning, and follower resets.
  - `dungeonPropsAndShrines.ts`: Double-edged interactive shrines and dungeon props.
  - `dungeonGenerator.ts`: Master `generateLevel` orchestrator supporting unique archetypes (`standard`, `sunken_ruins`, `volcanic_caldera`, `glacial_caverns`, `crypt`).
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
  - `roadNetworkGen.ts`: Cross-chunk meandering highway trails and trade path carving.
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
- `src/utils/gameStateFactory.ts`: Initial game state and faction territory bootstrap factory.
- `src/utils/logExporter.ts`: Real-time session and combat log formatting and export utility.

---

### 9. `/src/components/` — UI Components & Views
- `src/App.tsx`: Central game coordinator, top-level state orchestrator, tab navigation, and overlay router.
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
- `src/components/CraftingPanel.tsx`: Multi-tab crafting station (Forge, Alchemy, Cooking, Scriptorium, Catalysts, Upgrades, Mutations).
- `src/components/crafting/`: Modular Crafting Sub-Engine & Decoupled Stations:
  - `CraftingHeader.tsx`: Discipline tab switcher (Forge, Alchemy, Cooking, Scriptorium, Catalysts, Upgrades) with live search and station badges.
  - `RecipeCard.tsx`: Modular recipe card with stock validation ledgers, rarity tiers, and responsive craft actions.
  - `OverforgeGauge.tsx`: Interactive Overforge heat risk gauge with bonus projections and backfire warnings.
  - `WeaponForgingTab.tsx` / `ArmorForgingTab.tsx`: Weapon & armor smithing templates and tier progression.
  - `MutationCatalystTab.tsx`: 3-column target gear selection, elemental catalyst infusion, and chaos matrices.
  - `AlchemyTab.tsx`: Potion brewing, elixir synthesis, and laboratory tier upgrades.
  - `CookingTab.tsx`: Wilderness ration cooking, campfire warmth checks, and meal buff duration indicators.
  - `ScriptoriumTab.tsx`: Arcane spell scroll scribing and town recall scroll creation.
  - `GearUpgradeTab.tsx`: Direct tier upgrade and overforge tempering.
  - `DisassembleTab.tsx`: Gear dismantling and material reclamation.
  - `index.ts`: Crafting sub-components barrel export.
- `src/components/worldmap/`: Modular Cartography World Map & Sector Intelligence:
  - `types.ts`: World map POIs, chunk map info, custom map pins, filter state contracts, and biome models.
  - `chunkTileRasterizer.ts`: High-performance micro-tile surface rasterizer for discovered chunks with offscreen canvas caching.
  - `WorldMapHeader.tsx`: Compass header with coordinate tracking, chunk inspect breadcrumbs, zoom stepper, recenter hero button, custom pins/waystone ledger counters, dynamic frontier bounds indicator, and filter toggles.
  - `WorldMapCanvas.tsx`: Deep-zoom interactive canvas with parchment burnt fog-of-war edges, leyline waystones, custom pin markers, and smooth pan/drag.
  - `WorldMapChunkTooltip.tsx`: Floating tactical sector intelligence card (threat rating, mineral lodes, structures, dungeons, and leyline waystone travel).
  - `CustomPinEditorModal.tsx`: Custom landmark pin editor with color picker and icon glyph palette.
  - `index.ts`: World map barrel export.
- `src/components/guild/`: Modular Sunder Guild Sub-Engine & Decoupled Panels:
  - `types.ts`: Guild tabs, props interfaces, and safehouse storage contracts.
  - `useGuildOperations.ts`: Central business logic hook handling HQ acquisition, laboratory research upgrades, sanctuary decor, safehouse purchasing/resting, storage transfers, faction gear forging, tax claims, gold war contributions, tactical directives, and autonomous companion expeditions.
  - `GuildHeaderBar.tsx`: Navigation tabs with responsive badge indicators and chartered guild status.
  - `GuildHQPanel.tsx`: Oakhaven Town (Chunk 0,0) headquarters founding, laboratory research upgrades, and passive guild registry stats.
  - `GuildSanctuaryPanel.tsx`: Custom installments, trophies, and active decor buffs.
  - `GuildFactionWarPanel.tsx`: Faction exclusive armaments & blueprint crafting, war treasury coffers, gold contributions, tactical campaign directives, and regional conquest territory maps with tax dividends.
  - `GuildMissionBoard.tsx`: Autonomous companion expedition dispatch board, speed modifiers, and rewards claim ledger.
  - `GuildStashPanel.tsx`: Dual-pane item/material/catalyst storage vault with Quick Stash All and wilderness safehouse purchase/rest.
  - `GuildTreasuryPanel.tsx`: Composed facade delegating to sub-panels.
  - `index.ts`: Guild sub-components barrel export.
- `src/components/BestiaryOverlay.tsx`: Classified monster codex with dossier decryption, attribute telemetry, and guaranteed loot drop schedules.
- `src/components/GameLog.tsx`: Real-time adventure chronologue with 6 tactical category filters (All, Combat, Story, Loot, Craft, System), live text search, and animated damage badges.
- `src/components/AppOverlays.tsx` / `src/components/ModalRouter.tsx`: Modal coordinator for overlays.
- `src/components/panels/`:
  - `PlayerSidebarPanel.tsx`: Health/Mana bars, stats, active buffs, companion roster, and quick spells.
  - `MobileCommandPad.tsx` / `MobileHudBar.tsx`: Touch controls, D-pad, and quick action bars for mobile screens.
  - `ViewportAlertBanners.tsx` / `WeatherForecastBanner.tsx`: Active weather alerts and boss warnings.
- `src/components/screens/`:
  - `StartScreen.tsx`: Title screen, class selection, and new game initializer.
  - `GameOverScreen.tsx` / `VictoryScreen.tsx`: Permadeath summary, run statistics, and restart triggers.
- `src/components/god/`: 24 modular God Mode developer tools (`GodArenaTab`, `GodWorldEditor`, `GodEntitySpawner`, `GodItemSpawner`, `GodWeatherTab`, `GodStorytellerTab`, `GodReplayTab`, etc.).
- `src/components/modals/`: Dialogue modals, town shops, bed resting, and fishing/lockpicking minigames.

---

### 10. `/src/tests/` — Automated Test Suite
- 50 comprehensive Vitest test suites (308 unit, simulation, and integration tests) covering button interactions across all phases (`automatedButtonSuite.test.ts`, `automatedCraftingButtonSuite.test.ts`, `automatedInventoryButtonSuite.test.ts`, `automatedGuildButtonSuite.test.ts`, `automatedWorldMapButtonSuite.test.ts`, `automatedGodAndStudioButtonSuite.test.ts`), save/load serialization and legacy state migration (`automatedSaveLoadAndMigrationSuite.test.ts`), combat, AI pathfinding, procedural world generation, data catalogs, weather, Storyteller GM engine, companion advice, economy, crafting, app hooks, game state initialization, WebAudio synthesizer sub-engine, and modular inventory sub-components.

