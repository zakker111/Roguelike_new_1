# 🌌 Cosmic Abyss Roguelike Engine: Developer & Modding Guide

Welcome, Sovereign Creator! This guide is designed to help you, or any developer, understand the core architecture of the **Cosmic Abyss Roguelike Engine** and easily extend its gameplay, weather, items, combat, or AI systems.

### 🌐 Live Testing & Playable Links
- **Development App (Live Environment)**: [https://ais-dev-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app](https://ais-dev-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app)
- **Shared Production Preview**: [https://ais-pre-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app](https://ais-pre-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app)

---

## 📂 Project Structure Overview

```bash
/src
  ├── App.tsx                    # Core Game Loop & UI Orchestration Shell
  ├── main.tsx                   # React Entry Point
  ├── index.css                  # Tailwind Styling Entry Point
  ├── types.ts                   # Global Type Aggregator & Re-exports
  │
  ├── 📂 types                   # Modular Type Definitions
  │   ├── game.ts                # Main GameState, UI & Navigation Enums
  │   ├── entities.ts            # PlayerStats, Enemy, Companion, Scar & NPC Types
  │   ├── map.ts                 # TileType, Chunk, POI & Map Coordinate Types
  │   └── items.ts               # EquipmentItem, Recipe & Material Types
  │
  ├── 📂 hooks                   # Custom Domain Engine Hooks
  │   ├── 📂 ai                  # Modular AI Behavior & Enemy/Civilian Decision Trees
  │   │   ├── types.ts           # AI parameter context and state interfaces
  │   │   ├── aiTurnEnvironment.ts # Status ticks, weather/season modifiers, roaming spawns
  │   │   ├── useFollowerAI.ts   # Companion follow logic, ranged positioning, defensive assist
  │   │   ├── useTownGuardAI.ts  # Town defense threat response, 30-tile alarm broadcast, day/night shifts
  │   │   ├── useHostileAI.ts    # Stagger posture, telegraphed attacks, wagon targeting, BRACE/DODGE
  │   │   ├── useCivilianAI.ts   # Cat wandering, civilian schedules, weather shelter, hero counter-attacks
  │   │   ├── aiCombatAggregator.ts # Aggregated floating combat text & caravan skirmish resolution
  │   │   └── useEnemyAI.ts      # Turnkey AI coordinator executing turn-based AI resolution
  │   ├── 📂 god                 # God Mode & Developer Sandbox Orchestration
  │   │   └── useGodPanelState.ts # Centralized cheats, arena warp, spawn dispatch & sim runners
  │   ├── 📂 app                 # Extracted App-Level Orchestration Hooks
  │   │   ├── usePlayerTurnMovement.ts # Turn steps, chunk loading, terrain hazards, traps, and looting
  │   │   ├── useGKeyInteraction.ts    # Multi-context G-key interaction router (signs, beds, bushes, shrines, NPCs)
  │   │   ├── useAutoplayAgent.ts      # Autonomous playtesting AI agent for automated runs
  │   │   ├── useShopAndTradeHandlers.ts # Merchant shopping, regional trade buy/sell, tariffs
  │   │   ├── useQuestAndGuildHandlers.ts # Guild missions, quest turn-ins, rank progression
  │   │   ├── useShrineAndChestHandlers.ts # Dungeon shrines, chest unlocking, lockpick consumption
  │   │   ├── useConsumablesAndCatalysts.ts # Meat eating, catalyst shifting, reactor surges, stats
  │   │   ├── useDungeonStairsAndTransitions.ts # Multi-depth stair climbs and overworld transitions
  │   │   ├── useTownInteractions.ts   # Town doors, resting, and resource harvesting
  │   │   └── useCombatAndSpells.ts    # Attack dispatch, spellcasting, and scroll execution
  │   ├── usePlayerAttack.ts     # Decoupled player melee/ranged attack resolution & follower intercepts
  │   ├── useCombatEngine.ts     # Attack calculations, scar triggers, overforge heat recoil
  │   ├── useEnemyAI.ts          # Backward-compatible AI facade delegating to /src/hooks/ai/
  │   ├── usePlayerMovement.ts   # Movement logic, tile collisions, stamina consumption
  │   ├── useKeyboardInput.ts    # Key bindings, hotkey actions, and modal input suppression
  │   ├── useAppHotkeys.ts       # Global shortcut routing & modal dismissal
  │   ├── useGameLoop.ts         # Real-time difficulty escalation & watchtower siege ticker
  │   ├── useCaravanTravel.ts    # Caravan travel progression, D20 encounter resolution & rewards
  │   ├── useTownServices.ts     # Forge upgrades, Apothecary labs, Bartender gossip, Inn rests & Mercenaries
  │   ├── useOverworldEvents.ts  # Weather ticks, dynamic daylight/night cycles, seasonal environmental events
  │   ├── useTradeEconomy.ts     # Merchant transactions, town economy scaling, buy/sell haggling
  │   ├── useQuestsAndGuild.ts   # Faction guild contracts, quest tracking & reward claims
  │   ├── useCraftingEngine.ts   # Forging, cooking, campfires, anvils, repairs & mutation forge
  │   ├── useSpellcasting.ts     # Spell casting, mana verification, projectile targeting & scroll consumption
  │   ├── useWorldInteraction.ts # Overworld stairs, resource harvesting (trees/ore), door opening
  │   ├── usePoiAndWilderness.ts # Landmark interactions, waystone network, and wilderness events
  │   ├── useNpcInteraction.ts   # NPC dialogue routing, merchant trading, and crime witness checks
  │   ├── useModalManager.ts     # Modal router state and overlay lifecycle management
  │   ├── useEquipmentHandlers.ts# Equipment equipping, unequipping, swapping, durability & stat hooks
  │   ├── useSaveLoad.ts         # LocalStorage serialization, auto-save timers
  │   ├── useAmbientAudio.ts     # Dynamic ambient audio triggers & environmental soundscapes
  │   ├── useWorldEventHandlers.ts# Overworld POI and landmark event dispatchers
  │   ├── 📂 crafting            # Crafting Sub-Engine Hooks
  │   │   ├── useEquipmentCrafting.ts # Weapon/Armor forging, repairs, mutations & upgrades
  │   │   ├── useSurvivalCrafting.ts  # Deployable structures, campfire cooking & fishing
  │   │   ├── useUtilityCrafting.ts   # Potion brewing & survival tools crafting
  │   │   └── types.ts           # Crafting sub-engine interfaces
  │   └── 📂 input               # Input Sub-Hooks
  │       ├── useKeyboardControls.ts  # WASD/Arrow/Numpad key routing
  │       └── useHotkeys.ts      # Menu & action hotkey bindings
  │
  ├── 📂 canvas                  # Hybrid Graphics Engine & Animation System
  │   ├── IGraphicsRenderer.ts   # Unified rendering controller interface
  │   ├── TextRenderer.ts        # Fast, lightweight unicode text & emoji fallback renderer
  │   ├── TilesetRenderer.ts     # Texture atlas sprite-slicing tile renderer
  │   ├── HybridGraphicsEngine.ts# Singleton graphics engine for dynamic mode switching
  │   ├── tileMapRenderer.ts     # Viewport-culled tile map grid renderer
  │   ├── entityLayerRenderer.ts # Entities, enemies, player, projectiles & floating text layer
  │   ├── shadowRenderer.ts      # Dynamic sun/moon 24h directional drop shadow renderer
  │   ├── visualFxParticleSystem.ts# Particle system: water ripples, rain footstep splashes, spell bursts
  │   ├── weatherLightingRenderer.ts# Weather lighting shaders, weather overlay cross-fades & transition fog
  │   ├── spriteAnimationManager.ts# Multi-frame 4-directional sprite state machine
  │   ├── spriteRenderer.ts      # Optimized sprite rendering & emoji regex caching
  │   ├── AssetPreloader.ts      # Asynchronous tile-sheet & sprite image loader
  │   ├── TilesetAtlasManager.ts # Sprite sheet grid & autotile coordinate mapper
  │   └── VFXEmitter.ts          # Decoupled real-time particle VFX emitter queue
  │
  ├── 📂 world                   # Isolated World & Dungeon Generators
  │   ├── 📂 dungeon              # Modular Dungeon Generation Sub-Engine
  │   │   ├── types.ts           # Dungeon room types, level contracts & boss templates
  │   │   ├── dungeonRooms.ts    # Multi-archetype rooms (rectangular, circular, cross) & lava pools
  │   │   ├── dungeonCorridors.ts# Wide corridors, loop connections & doorway thresholds
  │   │   ├── dungeonTrapsAndChests.ts # Archetype traps (Geyser, Magma Eruption, Frostbite Vent, Icicle) & chest loot
  │   │   ├── dungeonEntities.ts # Boss templates, threat factor math & elite perk spawns
  │   │   ├── dungeonPropsAndShrines.ts # Double-edged interactive shrines & dungeon props
  │   │   ├── dungeonGenerator.ts# Master generateLevel orchestrator (standard, sunken_ruins, volcanic_caldera, glacial_caverns)
  │   │   └── index.ts           # Dungeon sub-engine barrel export
  │   ├── 📂 town                 # Modular Town & Settlement Generation Sub-Engine
  │   │   ├── types.ts           # Town building coordinates & generation contracts
  │   │   ├── townPerimeter.ts   # Fortress walls, gatehouses & harbor port features
  │   │   ├── townGuards.ts      # Castle sentries & village defense patrols
  │   │   ├── townNpcs.ts        # Blacksmiths, Merchants, Apothecaries, Taverns & Quest Boards
  │   │   ├── townOutskirts.ts   # Border pest spawns & clear grass placement
  │   │   ├── townChunkGenerator.ts # Master generateTownChunk orchestrator
  │   │   └── index.ts           # Town sub-engine barrel export
  │   ├── 📂 organic              # Modular Organic World Generation Sub-Engine
  │   │   ├── biomeNoiseEngine.ts# Multi-octave continuous Simplex-like noise generator
  │   │   ├── naturalRiverCarver.ts # Natural continuous river splines & pathway bridges
  │   │   ├── vegetationClusterGen.ts # Cellular automata forest groves & mineral ore lodes
  │   │   ├── roadNetworkGen.ts  # Cross-chunk meandering highway trails
  │   │   └── index.ts           # Organic world sub-engine barrel export
  │   ├── overworldGen.ts        # Overworld chunk generation & landmark placement
  │   ├── overworldBiomes.ts     # Whittaker biome distribution (7 biomes) & noise matrices
  │   ├── overworldStructures.ts # Settlement tier layouts (Hamlets, Towns, Citadel Capitals)
  │   ├── structureGenerators.ts # Blueprint generation & modular building carving
  │   ├── poiGenerators.ts       # Landmark POI generators & Finnish mythology shrines
  │   ├── caravanSkirmishGen.ts  # Tactical "Defend the Wagon" Skirmish Map Generator
  │   ├── overworldNpcSpawning.ts# Safe tile locator & NPC coordinate validator
  │   └── overworldPoiGenerator.ts# Chunk point-of-interest generator wrappers
  │
  ├── 📂 components              # Modular UI Components & Screens
  │   ├── MainAppLayout.tsx      # Top-level shell layout, HUD & log viewports
  │   ├── AppHeaderBar.tsx       # Header controls, volume/mute toggles, mode switcher
  │   ├── AppNavigationTabs.tsx  # Bottom tab navigation bar with responsive arrows
  │   ├── AppOverlays.tsx        # Central modal overlay router & manager
  │   ├── ModalRouter.tsx        # High-performance overlay switcher
  │   ├── GameCanvas.tsx         # Canvas-based Grid Rendering Engine
  │   ├── GameLog.tsx            # Animated adventure log with filter chips & auto-scroll
  │   ├── CraftingPanel.tsx      # Modular Arcanum Workbench Panel
  │   ├── UnifiedInventoryPanel.tsx # Decoupled composer coordinating modular sub-components
  │   ├── 📂 inventory           # Modular Inventory Sub-Components & Panels
  │   │   ├── types.ts                # Inventory interfaces & item rarity evaluators
  │   │   ├── HeroBiometricsCard.tsx  # Hero profile & Core RPG Attribute point allocation
  │   │   ├── EquipmentPaperdoll.tsx  # 8-slot equipped gear display & durability renderer
  │   │   ├── CombatStatsSummary.tsx  # Integrated combat stats, Cat Lover & Battle Scars
  │   │   ├── BackpackSlotGrid.tsx    # Weight bar, sorting, and Allies/Gear/Food/Mats tabs
  │   │   ├── AlchemicalTransmuterPanel.tsx # Portable Wild Alchemical Transmuter UI
  │   │   └── index.ts                # Inventory components barrel export
  │   ├── ChunkMinimap.tsx       # Overworld 2D Canvas Minimap & POI visualizer
  │   ├── DifficultyTracker.tsx  # Dynamic Chaos Matrix & Adaptive Threat Level HUD
  │   ├── ChaosConsole.tsx       # Chaos surge visualizer & mitigation dashboard
  │   ├── OverforgeGauge.tsx     # Over-forging heat gauge & bellows risk/reward engine
  │   ├── MutationSynergyPanel.tsx # Dual-element mutation synergy matrix & strain gauge
  │   ├── AudioSettingsModal.tsx # Volume sliders & sound preferences modal
  │   ├── AudioOscilloscopeStudio.tsx # 60 FPS WebAudio oscilloscope & synth studio
  │   ├── 📂 god                 # Sovereign Developer Console Panels
  │   │   ├── GodStorytellerPanel.tsx # GM Storyteller mood, boredom & encounter console
  │   │   ├── GodItemSpawner.tsx      # Declarative item & equipment spawner
  │   │   ├── GodEntitySpawner.tsx    # Enemy, boss & companion spawner
  │   │   ├── GodWorldEditor.tsx      # Tile painter & map generator
  │   │   ├── GodDungeonEditor.tsx    # Grid-Based Custom Dungeon Editor & Painter
  │   │   ├── GodModdingTab.tsx       # Live JSON Schema Mod Manager & Plugin Console
  │   │   ├── GodCheatsTab.tsx        # Developer cheats, stat overrides & God Mode
  │   │   ├── GodAdminEditor.tsx      # Raw game state JSON import/export
  │   │   ├── GodEnemyBlueprintEditor.tsx # Custom enemy blueprint designer
  │   │   ├── GodReplaySimulator.tsx  # Turn action replay scrubber
  │   │   └── GodSmoketestTab.tsx     # Client-side virtual smoke test suite panel
  │   ├── 📂 crafting            # Crafting Arcanum Sub-Tabs
  │   │   ├── CookingTab.tsx      # Hearth & campfire culinary recipes
  │   │   ├── AlchemyTab.tsx      # Apothecary potion brewing & tier upgrades
  │   │   ├── CampAndToolsTab.tsx # Survival tools & recall scroll scribing
  │   │   └── ScrollScriptoriumTab.tsx # Spell scroll scribing arcanum
  │   ├── 📂 guild               # Guild HQ Treasury & Mission Board Panels
  │   └── 📂 modals              # Standalone Modal Overlays
  │       ├── TradeModal.tsx     # Merchant trading & caravan departures
  │       ├── DialogueModal.tsx  # NPC conversation trees & tavern gossip
  │       ├── CaravanActiveOverlay.tsx # Caravan travel progress & wagon HP
  │       └── DiscardItemModal.tsx # Item discard & ground loot drop gump
  │
  ├── 📂 data                    # Static Game Databases & Declarative JSON Schemas
  │   ├── balance.ts             # Centralized XP leveling formulas, armor mitigation, & combat curves
  │   ├── recipes.ts             # Recipe exports & typed accessors
  │   ├── items.ts               # Equipment, materials, and catalysts data exports
  │   ├── monsters.ts            # Monster catalog & bestiary definitions
  │   ├── soundCatalog.ts        # Sound type mappings & audio metadata
  │   ├── worldHistory.ts        # Lore chapters & mythic world history
  │   ├── combatFlavors.ts       # Weapon-specific narrative striking verbs
  │   ├── bestiary.json          # Declarative creature templates & stats
  │   ├── caravanBosses.json     # World Threat Boss Ambush templates & stat checks
  │   ├── caravanEvents.json     # Declarative caravan events & chance thresholds
  │   ├── catalysts.json         # Elemental catalyst crystal definitions
  │   ├── combatFlavors.json     # Weapon combat narrative strings
  │   ├── decorTemplates.json    # Interactive level decor prop configurations
  │   ├── dialogues.json         # Externalized NPC dialogue trees & quest matrices
  │   ├── economy.json           # Settlement trade tables, reputation tiers, & biome pricing
  │   ├── enemies.json           # Declarative base monster stats
  │   ├── enemyBlueprints.json   # Modifiable enemy templates
  │   ├── fleeQuotes.json        # Procedural coward fleeing quotes
  │   ├── gameConfig.json        # Engine tuning constants
  │   ├── guildData.json         # Guild upgrades, sanctuary decors & faction gear
  │   ├── materials.json         # Base crafting alloys & ore types
  │   ├── quests.json            # Guild missions & companion expeditions
  │   ├── recipes.json           # Declarative JSON recipes for culinary, alchemy, and tools
  │   ├── relics.json            # Externalized Relic definitions and properties
  │   ├── safehouse.json         # Safehouse upgrades & stash storage configs
  │   ├── scars.json             # Battle scar templates & modifier tables
  │   ├── shops.json             # Blacksmith, Merchant, Tavern & Apothecary items catalog
  │   ├── soundCatalog.json      # Structured sound effect catalog
  │   ├── spellScrolls.json      # Spell scroll templates and mana costs
  │   ├── spellsCatalog.json     # Active spells catalog & elemental schools
  │   ├── storyEvents.json       # Game Master event templates & interventions
  │   ├── structures.json        # World structure presets & blueprint layouts
  │   ├── townTemplates.json     # Town layouts and merchant spawn configs
  │   ├── weaponTemplates.json   # Base weapon archetypes & attributes
  │   ├── worldConfig.json       # Biome thresholds, climate occurrence weights, and hazards
  │   └── worldHistory.json      # Lore chronicles & Finnish landmark records
  │
  ├── 📂 utils                   # Pure Functional Engine Sub-Systems
  │   ├── ai.ts                  # Pathfinding (Bresenham, FOV, A*, Uint8Array BFS)
  │   ├── audio.ts               # Backward-compatible WebAudio synthesizer engine facade
  │   ├── 📂 audio               # Modular WebAudio Synthesizer Sub-Engine
  │   │   ├── types.ts           # Audio context interfaces, tone definitions, SFX registries, sound params
  │   │   ├── synthEngine.ts     # WebAudio node graphs, oscillators, ADSR envelopes, filters & gain control
  │   │   ├── spatialAudio.ts    # 2D tile coordinate panning, low-pass distance muffling & volume falloff
  │   │   ├── ambientSoundscapes.ts # Continuous environmental audio layers (rain, blizzards, winds, caves)
  │   │   ├── soundCatalog.ts    # Procedural sound design definitions for UI, spells, combat, loot, crafting
  │   │   └── index.ts           # Unified audio barrel export
  │   ├── bestiary.ts            # Bestiary lookup utilities & monster categorizer
  │   ├── buildingAudio.ts       # Building interior detection & acoustic filtering rules
  │   ├── caravanAndTerritory.ts # Caravan schedules, traveling guards, and territory conquest maps
  │   ├── caravanEncounters.ts   # D20 road encounter resolver & reward calculations
  │   ├── combatArchetypes.ts    # Golden Triangle combat archetypes & anomalies
  │   ├── combatFloaterDrift.ts  # Directional outward drift & projectile impact alignment
  │   ├── companionAdvice.ts     # Companion tactical advice & narrative triggers
  │   ├── decorEngine.ts         # Interactive Level Decor Props Engine
  │   ├── dungeon.ts             # Procedural Cave/Dungeon Generator
  │   ├── fleeQuotes.ts          # Procedural enemy fleeing dialogue quotes
  │   ├── gameUtils.ts           # Safe stairs finder, coordinate helpers & math utilities
  │   ├── gmNarrator.ts          # Offline storytelling AI & ambient direction nudges
  │   ├── gmStoryteller.ts       # Backward-compatible GM Storyteller facade
  │   ├── 📂 storyteller         # Modular Game Master Storyteller Sub-Engine
  │   │   ├── types.ts           # Storyteller interfaces, memory state, and catalog loaders
  │   │   ├── storytellerFlavor.ts # Narrative prompt and placeholder token interpolators
  │   │   ├── storytellerEncountersData.ts # Master registry of 26 dynamic GM encounters
  │   │   ├── storytellerChaos.ts# Chaos score math & 20-tier periodic Chaos Core Surge matrices
  │   │   ├── storytellerRescue.ts# Autonomous pity system & emergency savior triggers
  │   │   ├── storytellerEngine.ts # Tension pacing, boredom curves & turn tick runner
  │   │   └── index.ts           # Storyteller barrel export index
  │   ├── itemWeight.ts          # Encumbrance & Inventory Weight Calculator
  │   ├── itemsData.ts           # Item Templates, Catalysts, and Materials
  │   ├── moddingEngine.ts       # Runtime Modding API & Custom Dungeon Generator
  │   ├── mutationSynergy.ts     # Dual-element synergy chain engine & mutagenic strain
  │   ├── npcDialogue.ts         # Weather and time reactive NPC dialogue trees
  │   ├── overworld.ts           # Unified overworld generation re-export
  │   ├── 📂 overworld           # Modular Overworld Generation Sub-Modules
  │   │   ├── overworldCore.ts   # PRNG seeds, Whittaker biomes, noise maps
  │   │   ├── overworldTownGen.ts# Settlement layouts, harbors & castle keeps
  │   │   ├── overworldWildernessGen.ts # Wilderness terrain, lakes & hazards
  │   │   ├── overworldLivelySpawners.ts# Traveling merchants & bandit camps
  │   │   └── overworldChunkGen.ts # Chunk assembler orchestrator
  │   ├── questData.ts           # Quest tracking helpers & status validators
  │   ├── relics.ts              # Relic lookup and passive effect evaluators
  │   ├── scars.ts               # Permadeath "Scars of the Defeated" Generator
  │   ├── scrollUtils.ts         # Spell scroll scribing & inventory merge utilities
  │   ├── shopData.ts            # Merchant stock generators and trade config utilities
  │   ├── siegeUtils.ts          # Watchtower siege combatant spawning & timers
  │   ├── spellScrolls.ts        # Spell scroll casting handlers & mana verification
  │   ├── spellsAndEquipment.ts  # Spell lists, starting gear, and magical spell structures
  │   ├── structurePlacer.ts     # Modular blueprint carver & legend mapper
  │   ├── tradeEconomy.ts        # Guild Upgrades, Commerce & Caravans
  │   ├── weatherEngine.ts       # Data-driven weather effects & modifiers
  │   ├── wildernessCamping.ts   # Wilderness Campsite Quality, Insulation & Night-Watch Sentry Engine
  │   └── worldThreat.ts         # Adaptive world threat & chaos calculation
  │
  └── 📂 tests                   # Automated Vitest Engine Test Suites (50 test files, 308 tests)
      ├── ai.test.ts             # Pathfinding, Bresenham line of sight & enemy AI tests
      ├── berryBushAndRegenBatching.test.ts # Berry bush harvesting & regen batching
      ├── caravanEncounters.test.ts # D20 caravan road encounter triggers & rewards
      ├── combat.test.ts         # Combat damage, armor mitigation & attack resolution
      ├── combatBatching.test.ts # Turn combat batching & performance tests
      ├── combatFloaterDrift.test.ts # Directional outward drift & projectile impact alignment
      ├── combatSimulation.test.ts # Simulated combat encounters and multi-turn balance
      ├── companionAdvice.test.ts# Companion tactical advice & narrative triggers
      ├── comprehensiveGameplayScalingSimulation.test.ts # End-to-end 100-turn scaling simulation
      ├── craftingAndAlchemy.test.ts # Recipe matrix, brewing, catalysts & over-forge heat
      ├── dataCatalogs.test.ts   # JSON catalog validation and schema checks
      ├── dustDevils.test.ts     # Desert dust devil vortex particle physics
      ├── economyAndEvents.test.ts # Settlement trade, reputation & caravan event triggers
      ├── endToEndGameplaySimulation.test.ts # End-to-end 50-turn gameplay, commerce, guild & save
      ├── fallingLeaves.test.ts  # Ambient falling leaf, blossom & spore particles
      ├── gameplaySimulation.test.ts # Simulated multi-turn dungeon crawls & turn solver
      ├── harborPort.test.ts     # Coastal harbor towns, docks & nautical trades
      ├── hooksIntegration.test.ts # Domain hook integration & state synchronization
      ├── itemsAndInventory.test.ts # Inventory stacking, weight encumbrance & item durability
      ├── logAndDiagnostics.test.ts # Combat log formatting, diagnostic events & level scaling
      ├── npcDialogue.test.ts    # Weather and time reactive NPC dialogue trees
      ├── npcSchedulesAndShelter.test.ts # NPC daily routines, weather shelter & tavern drinking
      ├── saveLoad.test.ts       # Serialization, save integrity validation & corruption handling
      ├── settlementScalingAndTaverns.test.ts # Settlement tier scaling & tavern layouts
      ├── shadowRenderer.test.ts # Dynamic sun & moon 24h directional drop shadows
      ├── spellsAndMana.test.ts  # Active spells catalog, mana costs & scroll conversions
      ├── storytellerAI.test.ts  # GM state, personality shifts & encounter triggers
      ├── weatherAndMutations.test.ts # Weather effects, catalyst multipliers & dual-element synergies
      ├── wildernessEnemyTierVariance.test.ts # Wilderness monster tier variance & affix scaling
      └── worldGen.test.ts       # Chunk generation, biomes & dungeon floor layouts
```

---

## 📦 Zero-Friction Modular Data & Content Architecture (`/src/data`)

The engine strictly separates **gameplay systems** from **game content**. All game entities, items, recipes, quests, dialogues, spells, scars, and encounters live inside structured JSON catalogs under `/src/data/`, with high-performance, type-safe accessor functions exported through `/src/data/index.ts`.

### 🗂️ Master Content Registry & JSON Catalogs

| JSON Catalog | Data Loader / Module | Description & Accessor Functions |
|---|---|---|
| `bestiary.json` / `enemies.json` | `src/data/monsters.ts` | Base creature templates, boss blueprints, squad presets (`getMonsterDefinitionByKey`, `getMonstersByCategory`) |
| `materials.json` / `catalysts.json` | `src/data/items.ts` | Crafting alloys, ores, gems, elemental catalysts (`getMaterialById`, `getCatalystById`) |
| `weaponTemplates.json` | `src/data/items.ts` | Master weapon templates, damage profiles, ranges, attack speeds (`WEAPON_TEMPLATES`) |
| `relics.json` | `src/data/items.ts` | Draftable sanctum relics and passive modifiers (`getRelicById`, `RELIC_CATALOG`) |
| `recipes.json` | `src/data/recipes.ts` | Culinary dishes, apothecary potions, and survival tools (`COOKING_RECIPES`, `BREWING_RECIPES`, `TOOL_RECIPES`) |
| `quests.json` | `src/data/quests.ts` | Town bounties, gathering missions, faction contracts (`getQuestById`, `getQuestsByTown`, `getAvailableQuests`) |
| `spellsCatalog.json` | `src/data/spells.ts` | Active combat spells, elements, mana costs, formulas (`getSpellById`, `getSpellsByElement`) |
| `scars.json` | `src/data/scars.ts` | Battle scars, permanent stat penalties & veteran bonuses (`getScarByName`, `getRandomScar`) |
| `shops.json` | `src/data/shops.ts` | Blacksmith, Merchant, Tavern, and Apothecary inventories (`getShopItemsByType`) |
| `dialogues.json` / `fleeQuotes.json` | `src/data/dialogues.ts` | NPC conversation trees, atmospheric barks, cowardly fleeing quotes (`getDialoguesForCategory`, `getRandomDialogue`, `getRandomFleeQuote`) |
| `guildData.json` / `safehouse.json` | `src/data/guild.ts` | Sunder Guild laboratory upgrades, decor installments, faction war gear, safehouses (`getGuildUpgradeById`, `getCompanionQuestById`) |
| `caravanEvents.json` / `caravanBosses.json` | `src/data/caravan.ts` | D20 caravan road encounters, bandit blockades, world threat bosses (`getCaravanEventByThreshold`, `getRandomCaravanBoss`) |
| `storyEvents.json` | `src/data/storyEvents.ts` | Autonomous GM story interventions, chaos surges, emergency rescues (`getChaosSurgeByRoll`, `getStoryEncounterById`) |
| `decorTemplates.json` | `src/data/decor.ts` | Level interactive decor props for dungeons, ruins, and settlements (`getDecorPropsByCategory`) |
| `townTemplates.json` / `structures.json` | `src/data/structures.ts` | Settlement layouts, building interiors, town squares (`getTownSquareById`, `BUILDING_INTERIORS`) |
| `soundCatalog.json` | `src/data/soundCatalog.ts` | Procedural WebAudio sound parameters and SFX catalogs (`SOUND_CATALOG`) |
| `worldHistory.json` | `src/data/worldHistory.ts` | Mythic lore chronologue and historic lore book entries (`WORLD_HISTORY_CHAPTERS`) |

### 🚀 Developer Quick Start: Adding New Content in Seconds

Because data is decoupled from the UI, adding new game elements requires **zero UI rewrites**. Simply add an entry to the JSON file:

#### 1. Adding a New Crafting Recipe in `src/data/recipes.json`
```json
{
  "id": "recipe_void_infused_stew",
  "name": "🌌 Void-Infused Astral Stew",
  "description": "Brewed with void mushrooms and shadow crystals. Grants +15 Max MP and +4 Magic Damage for 80 turns.",
  "restoringHp": 60,
  "restoringMp": 45,
  "materials": { "mat_berry": 4, "mat_meat": 2 },
  "catalysts": { "cat_shadow": 1 },
  "buff": {
    "name": "Astral Resonance",
    "description": "+4 Magic Damage & Mana Regeneration",
    "atkBonus": 4,
    "defBonus": 0,
    "critBonus": 0.15,
    "speedBonus": 1,
    "turnsRemaining": 80
  }
}
```

#### 2. Adding a New Active Spell in `src/data/spellsCatalog.json`
```json
{
  "id": "solar_flare",
  "name": "Solar Flare",
  "icon": "☀️",
  "manaCost": 7,
  "damageMultiplier": 1.45,
  "element": "Fire",
  "description": "Blinds and incinerates all foes in a radius of 2.",
  "effectDescription": "Deals 145% fire damage to all adjacent enemies and blinds them for 2 turns."
}
```

#### 3. Accessing Data Anywhere in Code
```typescript
import { 
  getMonsterDefinitionByKey, 
  getQuestById, 
  getSpellById, 
  getRandomScar,
  COOKING_RECIPES 
} from '../data';

// All functions are fully typed with TypeScript autocompletion:
const dragon = getMonsterDefinitionByKey('dragon');
const activeQuest = getQuestById('q_pest_control');
const spell = getSpellById('solar_flare');
```

---

## 🧪 Automated Unit & Engine Test Suite (Vitest)

The engine features 50 test suites (308 unit & simulation tests passing 100% green) covering procedural generation, pathfinding AI, player combat execution (`usePlayerAttack`), directional shadows, water ripples, ambient particles, save/load validation and state migration, crafting, weather mechanics, dual-element synergies, GM Storyteller performance evaluation, and watchtower siege mechanics.

Run all automated unit tests:
```bash
npm run test
```

---

## 🔮 Central GM Storyteller & Adaptive Chaos Matrix

The **GM Storyteller (`src/utils/gmStoryteller.ts`)** acts as an autonomous Game Master that evaluates player performance on every turn:

1. **Adaptive Performance Tracking**:
   - Monitors recent kills (`monstersSlain`), player health ratio (`hpRatio`), and combat efficiency.
   - If the player slaughters enemies effortlessly with high HP, the GM triggers **Drastic Chaos Escalation (+8 to +15 Chaos Matrix)** with adaptive narrator dialogue ("Too easy? Let us test your true steel!").

2. **Dynamic Enemy Mutators**:
   - On GM Chaos adaptation, active monsters on the map dynamically mutate: gaining +30% HP, +2 ATK, +1 DEF, Chaos Tier upgrades, and elevated Elite / Anomaly modifiers.
   - Spawns and encounters scale with the Golden Triangle framework (`src/utils/combatArchetypes.ts`), spawning Golden Triangle Cheater Anomalies when Chaos exceeds 60.

---

## 🎮 Core Roguelike Turn Engine

The engine is completely turn-based. Actions by the player trigger a cascade of state transitions, followed by a deterministic enemy turn resolution:

1. **Player Movement / Wait (`makeMove(dx, dy)`)**:
   - Consumes physical exhaustion.
   - Triggers **Weather & Seasonal Fatigue checks** (e.g., slipping on mud, freezing in blizzards).
   - Resolves coordinate crossover boundaries (e.g. crossing overworld chunk edges).
   - If a target tile contains an enemy, converts movement into a **Melee/Ranged Strike**.

2. **Enemy Turn Resolution (`executeEnemiesTurn()`)**:
   - Re-evaluates Field-of-View (FOV).
   - Computes movement steps using pathfinding towards the player.
   - Processes ranged or melee attacks, applying on-hit debuffs and ticking damage-over-turn conditions.

---

## 🌦️ How to Add a New Weather Type

Weather is fully data-driven. To add a new weather type (e.g., `ashfall` or `acid_rain`):

### Step 1: Add to `src/types.ts`
Add your new weather key to the `weather` union in `src/types.ts`:
```typescript
export interface GameState {
  // ...
  weather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard' | 'ashfall';
}
```

### Step 2: Configure in `src/utils/weatherEngine.ts`
Simply declare your weather effect configuration, including movement penalties, combat multipliers, and logs:
```typescript
export const WEATHER_EFFECTS: Record<string, WeatherEffect> = {
  // ...
  ashfall: {
    id: 'ashfall',
    name: 'Molten Ashfall',
    icon: '🌋',
    description: 'Searing ash skies! Fire Catalyst deals +50% extra damage, but non-immune heroes lose health during movement.',
    movementPenaltyChance: 0.08,
    fatigueText: '🔥 BURN',
    fatigueLog: '🌋 [ASH INHALATION]: The hot sulfuring ash burns your lungs! You stumble and lose a turn. (Tip: Equip Fire-Resistant gear!)',
    combatModifiers: {
      catalystModifiers: {
        [CatalystType.Fire]: {
          multiplier: 1.50,
          logText: '🌋 [THERMAL FLAR]: Molten ash particles supercharge your fire magic for +50% damage!',
        }
      }
    }
  }
};
```

The engine will **automatically** parse your configuration for combat buffs, movement fatigue, active immunities, and narrative feedback!

---

## ⚔️ How to Customize Combat, Spells & Game Balance

- **Centralized Balance Constants (`src/data/balance.ts`)**: Tweak XP formulas (`getXpForLevel`), damage mitigation curves (`calculateNetDamage`), critical hit multipliers (`calculateCritDamage`), and exhaustion thresholds in one central configuration.
- **Basic Weapons & Crafting Materials**: Managed inside `src/utils/itemsData.ts`. Customize base templates, durability, range, and material modifiers.
- **Player Attacks & Combat Resolution (`src/hooks/usePlayerAttack.ts`)**: Core player melee/ranged attack resolution, weapon durability wear, directional floater drift triggering, companion assistance intercepts, and bump-to-attack routing.
- **Spells & Spellcast (`src/hooks/useSpellcasting.ts`)**: Cast costs, custom magic projectiles, mana verification, and scroll scribing conversions are handled under `useSpellcasting`.
- **Combat Narratives**: If you want to change how fights feel, modify `src/data/combatFlavors.ts` to add custom striking verbs, damage descriptions, and funny failure modes.
- **Economy & Price Rules (`src/data/economy.json`)**: Configure settlement reputation discounts, charisma trade scaling, caravan multipliers, and regional biome pricing tables.
- **NPC Dialogues & Quests (`src/data/dialogues.json`)**: Externalize and edit NPC dialogue trees, town rumors, and quest matrices.

---

## 👾 How to Create Custom Enemies

You can declare custom enemies by pushing templates into `window.customEnemies` or configuring `src/data/enemies.json`.
- Enemies support standard pathfinding (`speed`), attack ranges (`range`), defensive parameters (`baseDef`), and visual avatars (`char`, `color`).

---

## 📜 Custom Crafting & Friendly Interactions (Unified Workbench & Companions)

### Step 1: Crafting Recipes & Unified Workbench
The game features a fully consolidated **Crafting Arcanum Workbench** (`src/components/CraftingPanel.tsx`) that integrates all forms of assembly, cooking, and brewing into sub-tabs:
1. **Forge Equipment**: Forging custom high-tier weaponry and metallic armor components using base alloys and catalysts.
2. **Camp & Tools**: Crafting general survival gear, including Campfires, Fishing Poles, and Tension Lockpicks.
3. **Campfire Cooking**: Gourmet cooking of specialized dishes (e.g., Lightning Grilled Salmon, Shadow Smoked Jerky) that require proximity to a nearby `Campfire` tile.
4. **Alchemical Brewing**: Apothecary brewing of permanent stat-boosting elixirs, including upgrading the laboratory workstation's tier to unlock advanced formulas.
5. **Mutation Forge**: Fusing weapons and armor with catalysts for chaotic, elementally-prefixed modifications.
6. **Upgrade Gear**: Standard tier upgrade system for boosting item base values.

For example, our high-tier **Scroll of Recall** is integrated under the **Camp & Tools** sub-tab in `src/components/CraftingPanel.tsx` and resolved dynamically in `handleCraftRecallScroll` inside `src/App.tsx`.
- **Ingredients Required**: 
  - `1x` Wyrmscale (`mat_dragonscale` - harvested from high-tier Wyrms/Dragons)
  - `1x` Withered Fey Bone (`mat_feybone` - harvested from woodland/mystic undead)
  - `1x` Null Echo Stone (`cat_shadow` - shadow alchemical catalyst)
- **Output**: A consumable, single-use `scroll_recall_town` item that allows rapid spatial displacement back to any unlocked hub or wilderness sanctuary.

#### Declarative `recipes.json` & Flexible Tool Crafting
All recipes (Cooking, Alchemy, and Survival Tools) are defined in `/src/data/recipes.json` and exported via `/src/data/recipes.ts`:
- **Flexible Material Matching**: Survival tool recipes (such as Lumberjack Hatchet 🪓, Prospector Pickaxe ⛏️, and Ancient Fishing Pole 🎣) allow deducting **ANY** material belonging to category sets (e.g., `WOOD_KEYS`: `mat_wood`, `mat_pine_log`, `mat_birch_log`; `METAL_KEYS`: `mat_iron`, `mat_iron_ore`, `mat_steel`, `mat_copper_ore`, `mat_royal_iron`, `mat_mithril`, `mat_obsidian`).
- **Tree Stump Harvesting**: Chopping down overworld trees replaces the tree tile with a walkable `TileType.TreeStump` (🪵) graphics tile, preserving terrain movement while indicating harvested flora.

### Step 2: Modifying Ally & Companion Interactions
To ensure companion safety and enrich the world, friendly units intercept default weapon strikes or collision attacks. If the player attempts to move into or click a tile containing a freed captive, follower, or allied unit, the engine diverts the combat action:
- **Friendly Interception**: `performPlayerAttack` and movement logic in `src/App.tsx` routes the call to `interactWithFollower(enemy)`.
- **Procedural Archetype Dialogues**: The game parses the companion's archetype (`cat`, `guard`, `thief`, `captive`, `generic`) to select custom character quotes, log the statement with special narrative labels, and fire a floating 3D/2D text effect (e.g. `🐾 Purr!`, `🛡️ Shield!`, `🗡️ Rogue!`).

---

## 🏗️ Custom Structure Blueprint Presets & Rebuilds (`src/utils/structurePlacer.ts`)

The engine supports dynamic spatial carving of modular, predefined buildings and encounters directly onto active game coordinate grids. Modders can easily define new structures or live-carve blueprints through the God Panel.

### 1. Declaring a New Structure Preset
In `src/utils/structurePlacer.ts`, you can append custom presets to the `STRUCTURE_PRESETS` array. Each preset conforms to the `StructurePreset` interface:
- **`width` & `height`**: Bounding box size.
- **`grid`**: Array of string rows representing the layout.
- **`legend`**: Mapping of layout characters in `grid` to tile types (e.g., `{"#": "Wall", ".": "Floor"}`).
- **`enemies`** (Optional): Relative offsets and types of custom enemies to spawn within the structure bounds upon carving.

### 2. Live Blueprint Legend-Mapping
When loading non-standard structure grids into the **Custom Structure Designer** (under the God Panel):
- The `handleLoadPresetToDesigner` function reads the preset's `legend` object.
- It dynamically maps custom characters (like `W` for WatchtowerWall or `X` for WatchtowerBarricade) back to standard, editable designer types before filling the visual grid. This allows rapid building, customization, and export.

### 3. Immediate Active Settlement Rebuilding
The God Panel includes a layout applicator JSON input field (`handleApplyHousesJson` in `src/components/GodPanelOverlay.tsx`). Modders can import custom coordinate maps to instantly carve multiple modular structures across the active settlement overworld in real-time.

---

## 🧭 How to Add Custom Wilderness Travelers & Crime Witness Behaviors

The overworld's traveling NPC ecosystem is fully extensible. You can define new roles, customize their dialogue behaviors, and expand trading stocks:

### 1. Registering Traveling NPC Roles
In `src/types.ts`, traveling NPC roles are defined within the `NPC` interface's `role` union. To add a new traveler (e.g., `traveler_scholar`):
- Add `traveler_scholar` to the `role` union.
- Map the character and default color rendering in `src/components/GameCanvas.tsx` inside the NPC drawing routine (handling custom emojis or specialized glyphs).

### 2. Procedural Spawning & Dialogues (`src/utils/overworld.ts`)
During overworld chunk generation, travelers spawn in non-town chunks using deterministic PRNG seeds:
- Map new traveler roles to names, dialogue arrays, and coordinates.
- Set their default `scheduleState` to `'work'` and assign home/work coordinates matching their spawn coordinates to stabilize coordinates paths.

### 3. Modifying Shops and Inventories (`src/utils/shopData.ts`)
Map traveler roles to initial merchant inventories (e.g. mapping `traveler_scholar` to the `npc_apothecary` inventory, or creating a bespoke configuration under `MERCHANT_INITIALS`).

### 4. Customizing the Proximity Crime Witness Engine
When the player attacks a traveler, the `handleTravelerAttack` routine in `src/App.tsx` evaluates crime visibility:
- **Visibility Checks**: It scans the viewport's active visible tiles to see if any other non-hostile NPCs can observe the player.
- **Consequences**: You can configure custom penalties, faction outrage modifiers, or spawn specific bounty hunter tracking states depending on the witness count.

### 5. Interactive Assault Choices & Quest Failures
Traveling NPC dialog overlays (`src/components/TravelerInteractionOverlay.tsx`) offer buttons to directly attack or betray the traveler:
- **Quest Fail State**: We added a `'failed'` status to the `Quest['status']` union in `src/types.ts`.
- **Failing Active Quests**: When an attack is triggered via `onAttack` in the overlay, `handleTravelerAttack` maps the NPC's role to its associated quest ID (e.g. `q_traveler_herbalist_mushrooms`) and transitions its status to `'failed'`, logging the quest failure in the adventure logs.
- **Combat Transition**: The NPC is immediately converted into a hostile, aggressive enemy placed on the grid, ready to engage the player in combat.

---

## 📱 Multi-Viewport Responsive Layout & Mobile HUD

The engine dynamically adapts to both desktop ("Windows View") and mobile/touch layouts ("Mobile View"). This is governed by a unified layout detector:

### 1. Adaptive Viewport & Device Detection
In `src/App.tsx`, we evaluate both User Agent strings and pointer-touch capabilities combined with window widths to detect mobile environments:
```typescript
const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const isNarrow = window.innerWidth < 1024;
const isMob = isMobileUA || (isTouch && isNarrow) || isNarrow;
```
This sets `activeMobileView`, which switches the primary interface to Mobile Mode when `true`. Users can also manually toggle the mode using the top-bar button.

### 2. Compact Mobile HUD Statistics Grid
In Mobile Mode, screen space is premium, so the sidebars are hidden to avoid cluttering. Instead, we render a highly compact status grid immediately above the game canvas. It contains:
- **Vitals HP**: A colored heart status bar reflecting `gameState.playerStats.hp` and the `effectiveMaxHp` (taking active Moon Blessings into account).
- **Focus MP**: A colored energy bar reflecting active mana.
- **Gold**: Simple, clear gold wealth indicator.
- **XP / Level**: Experience progression and level up indicators.

### 3. Environment Sub-Bar
Adjacent to the Stats Grid, a dedicated detail bar consolidates essential environmental information:
- **Local Coordinates**: Current `(x, y)` coordinates.
- **Active Floor / Zone**: Tracks whether the player is in the 'Sunder Wilderness' or on specific 'Dungeon Floors'.
- **Faction Standing**: Renders town reputation status as a responsive color-coded percentage.
- **Game Clock**: Live game hour clock.
- **Dynamic Moon Phase**: Renders the current phase emoji and name (e.g., `🌕 Full Moon`) with interactive tooltips explaining active celestial blessings.

Developers can easily customize, append, or re-style these HUD grids inside `src/App.tsx` (around lines 15570-15665) without affecting the core rendering loop.

---

## 🎨 Hybrid Graphics Provider Architecture & Canvas Engine (`/src/canvas/`)

The engine features a decoupled, polymorphic graphics provider interface (`IGraphicsRenderer`) that supports dual-representational rendering (rich sprite-sheet texture atlases alongside lightweight unicode text/emoji fallbacks):

### 1. Abstract Renderer Interface (`src/canvas/IGraphicsRenderer.ts`)
```typescript
export interface IGraphicsRenderer {
  mode: 'text' | 'tileset';
  setMode(mode: 'text' | 'tileset'): void;
  drawTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: TileRenderDetails): void;
  drawEntity(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, details: EntityRenderDetails): void;
  renderVFX(ctx: CanvasRenderingContext2D, dt: number): void;
}
```

### 2. Dual-Representational Renderers
- **`src/canvas/TextRenderer.ts`**: Crisp, vector-aligned ASCII/emoji renderer. Renders custom colored background rects, shroud fog overlays, and centered glyph symbols.
- **`src/canvas/TilesetRenderer.ts`**: Reads texture maps through `AssetPreloader` and `TilesetAtlasManager`. If image assets fail to load, are missing, or graphics mode is switched to `'text'`, it gracefully falls back to `TextRenderer` without throwing errors.
- **`src/canvas/HybridGraphicsEngine.ts`**: High-level singleton dispatcher allowing dynamic mode toggling at runtime (`hybridGraphicsEngine.setMode('tileset')`).

### 3. Decoupled VFX Emitter Queue (`src/canvas/VFXEmitter.ts`)
Decouples turn-based state updates (synchronous step movements) from continuous continuous `requestAnimationFrame` render ticks. Combat slashes, spell bursts, and atmospheric embers are queued via `vfxEmitter.emitSpellBurst(x, y)` and flushed during continuous frame ticks without stalling gameplay logic.

---

## 🛠️ Modding Cheat Sheet & Sovereign Developer Console Tooling

Need to test features quickly?
1. Open the game's **Dev Tools / God Panel Overlay** (press `Ctrl + Shift + G` or use the UI toggle).
2. Use the tabs to:
   - Toggle **Sovereign Weather Controls** to instantly switch to any weather type.
   - Instantly **Heal** or **Add Gold/Mana/Catalysts**.
   - Spawn custom entities or teleport to the **Empty Sandbox Arena**.
   - Inject any available Battle Scar onto your character under the **Creator Lab** tab.

---

## 🩹 How to Add a New Battle Scar

The "Scars of the Defeated" system tracks physical trauma and rewards/penalizes the player depending on whether a scar is **Fresh (healing)** or **Healed (old)**. 

### Step 1: Open `src/utils/scars.ts`
All scars are defined inside `SCAR_DATABASE`, which is an array of `ScarTemplate` objects.

### Step 2: Add a Scar Template Entry
Add your new scar object into the database. A template supports the following fields:
- `name` (string, unique): The identifier shown to the player.
- `description` (string): Immersive text describing the wound.
- `icon` (string): A single emoji representing the scar.
- `severity` (`'Minor' | 'Major' | 'Grave' | 'Legendary'`): Controls how severe the hit must be to acquire it.
- `freshEffect` (string): Text describing the active debuff.
- `healedEffect` (string): Text describing the permanent mended bonus.
- `freshModifiers` (optional object): Attribute modifications applied while healing (typically negative).
- `healedModifiers` (optional object): Attribute modifications applied once healed (typically positive).

Supported attributes in modifiers: `hp`, `maxHp`, `mp`, `maxMp`, `atk`, `def`, `str`, `dex`, `int`, `cha`, `lck`.

#### Code Example:
```typescript
{
  name: "Grizzled Wolf Scratch",
  description: "Three parallel, jagged claw markings scoring across your forearm.",
  icon: "🐾",
  severity: "Minor",
  freshEffect: "Tender, inflamed muscle tissue. -1 Strength.",
  healedEffect: "Hardened claw scars and muscle recovery. +1 Dexterity.",
  freshModifiers: { str: -1 },
  healedModifiers: { dex: 1 }
}
```

The system handles the rest! 
- **Healing Cycle**: After exactly **25 turns**, the scar automatically shifts from *Fresh* to *Healed*.
- **Acquisition Triggers**: `evaluateScarAcquisition` checks if damage taken $\ge 12$ HP, or if the player falls below 35% health, rolling against a chance based on severity.

---

## 📈 The Effective Stats System

To prevent bugs and stat exploits, the game **never** permanently mutates base statistics directly when applying temporary buffs, weather conditions, or healing scars. Instead, we compute the player's attributes **on the fly**.

### The `getEffectiveStats` Access Pattern
Whenever you read player stats (such as Strength, Defense, Attack, or Max HP) in combat, inventory UI, or weight checks, you **must** pass `gameState.playerStats` through `getEffectiveStats`:

```typescript
import { getEffectiveStats } from './utils/scars';

const effective = getEffectiveStats(gameState.playerStats);
console.log("Base HP:", gameState.playerStats.maxHp);
console.log("Effective HP (with scar mods):", effective.maxHp);
```

### Integrated Systems:
1. **Combat Calculations (`src/App.tsx`)**: Weapon damage, armor defense calculations, and maximum HP tracking consume `getEffectiveStats`.
2. **Unified Inventory Panel (`src/components/UnifiedInventoryPanel.tsx`)**: Renders base values compared against green/red effective stats in real-time.
3. **Inventory Carrying Weight (`src/utils/itemWeight.ts`)**: Base carrying limits scale with effective Strength, ensuring that a fresh collarbone fracture (reducing effective strength) actually lowers carrying capacity temporarily.

---

## ⚖️ How to Tweak the Chaos & Difficulty Scaling Engine

Sunder features an active, bidirectional difficulty scaling and suppression engine to maintain dynamic tension without frustrating players. Difficulty is governed by the **Abyssal Chaos Coefficient** (global threat factor) and computed inside `src/utils/dungeon.ts` and `src/components/DifficultyTracker.tsx`:

### 1. The Scaling Formula
Base difficulty scales automatically over time and depth:
```typescript
let baseThreatFactor = 1.0 + (depth - 1) * 0.32 + turnIntensity * 0.06 + timeHours * 0.3;
```
*   **Depth Scale (`+32%`)**: Every dungeon level descended increases base threat.
*   **Dread Exhaustion (`+6%`)**: Every 100 turns played compounds difficulty.
*   **Void Contamination (`+30%`)**: Every hour of gameplay triggers passive contamination.

The base threat is multiplied by player power scaling (levels, allocated attribute points, weapon damage, and defense ratings) to calculate `globalThreatFactor`.

### 2. Player-Driven Chaos Suppression (Mitigation)
Players can actively push back against the scaling threat. The engine subtracts a mitigation score from the base threat rating:
```typescript
let chaosMitigation = 0;
chaosMitigation += bossesKilled * 0.35;         // -0.35x threat reduction per boss defeated
chaosMitigation += campsCount * 0.15;           // -0.15x threat reduction per wild camp cleared
chaosMitigation += Math.floor(foes / 10) * 0.05; // -0.05x threat reduction per 10 standard mobs slain
```
The base threat is clamped to a defensive floor of **0.70x** to maintain a minimum satisfying challenge level.

### 3. Modding / Balancing Instructions
- To adjust how fast the world scales up, modify the multipliers (`0.32`, `0.06`, `0.3`) in `baseThreatFactor` inside `src/utils/dungeon.ts`.
- To adjust how rewarding boss slays or camp liberations are, change the coefficients (`0.35` for bosses, `0.15` for camps, `0.05` for mobs) inside `src/utils/dungeon.ts` and `src/components/DifficultyTracker.tsx`.
- To change the absolute minimum challenge floor, modify `Math.max(0.70, baseThreatFactor - chaosMitigation)`.

---

## 🎒 Equipment & Inventory Swapping Architecture

The equipment management engine is encapsulated in `src/hooks/useEquipmentHandlers.ts` and handles equipping, swapping, and unequipping across all paperdoll slots (`equippedArmor`, `equippedHelmet`, `equippedGloves`, `equippedBoots`, `equippedShield`, `equippedAmulet`, and `currentWeapon`):

1. **Modular Hook Abstraction (`src/hooks/useEquipmentHandlers.ts`)**: Encapsulates slot assignment, stat recalculations, and durability decay tracking into a dedicated custom hook.
2. **Defensive Object Null-Safeguards**: Standard equipment items or drop loot that lack explicit `materialUsed` or `catalystUsed` objects are automatically populated with safe default objects (`Scrap Iron` material and `Normal/Shadow` catalyst) upon equipping and rendering, preventing runtime `TypeError: Cannot read properties of undefined (reading 'name')` exceptions.
3. **Instance Preservation**: When an item is equipped from `equipmentInventory`, only a single matching instance is removed from `equipmentInventory`, preventing duplicate item IDs from being accidentally purged.
4. **Bi-directional Swapping**: When equipping a new item into a slot that already contains an equipped item (including main hand weapons, off-hand shields, or body armor), the currently worn item is returned directly to `equipmentInventory` with all its original stats, durability, mutation counts, and stat bonuses intact.
5. **Full Unequip Capability**: Any weapon or piece of armor (including starter weapons) can be unequipped ("Doffed") directly from the character paperdoll or status panel into the inventory stash.
6. **Dual-Wielding & Two-Handed Rules**:
   - **One-Handed Weapons & Off-Hand Items**: One-handed weapons (Sword, Dagger, Hammer, Wand) can be equipped in either the Right Hand or Left Hand slot. Equipping a weapon in the off-hand adds a **Dual-Wielding Strike Bonus** (+50% off-hand weapon damage) to player attacks.
   - **Two-Handed Weapons**: Weapons marked as two-handed (Spear, Bow, Staff, Crossbow, Greatsword, Warhammer) require both hands. Equipping a 2-handed weapon in the Right Hand automatically unequips any item in the Left Hand back into inventory. Equipping an off-hand item while holding a 2-handed weapon automatically unequips the 2-handed weapon back to inventory.

---

## 🪓 Resource Gathering Tools & Crafting System

Resource gathering tools (e.g. Lumberjack Hatchets and Prospector Pickaxes) support automated inventory usage and consumable durability:

1. **Automatic Inventory Harvesting**: Tools can be equipped in hand or simply stored anywhere in `equipmentInventory`. When stepping on trees or mineral veins, the game automatically detects tools in hand or in inventory to harvest timber or mine ore.
2. **Craftable Tools**: Players can craft Lumberjack Hatchets (2x Scrap Wood, 1x Tempered Iron) and Prospector Pickaxes (2x Scrap Wood, 2x Tempered Iron) under `Crafting -> Survival`.
3. **Consumable & Unrepairable**: Tools feature `isTool: true` and `isRepairable: false`. Each harvest action consumes tool durability (20 points per use). When tool durability reaches 0, the tool breaks completely and is removed from inventory/hands. Blacksmith repair services (`handleRepairItem` and `handleRepairAll`) reject tool repairs, requiring players to craft new tools as needed.

---

## ⚡ The Over-Forging Heat & Bellows Risk/Reward Engine (`src/components/OverforgeGauge.tsx`)

The Over-Forging Heat System is a modular risk-versus-reward mechanic integrated into `src/components/CraftingPanel.tsx` (Forge Equipment, Mutation Forge, and Upgrade Gear sub-tabs).

### 1. Architectural Design
- **Standalone Component**: Located in `src/components/OverforgeGauge.tsx`.
- **Props**:
  - `heat`: Current over-forging heat level (0 to 100).
  - `onChangeHeat`: Callback `(newHeat: number) => void` to update the state.
  - `compact`: Optional boolean to render a streamlined gauge layout.
- **Calculations**:
  - `Power Bonus`: `+ (heat * 1.25)%` (Up to +125% or 2.25x stat multiplier).
  - `Shatter Risk`: `(heat * 0.65)%` (Up to 65% chance on craft/upgrade/mutation).
  - `Heat Recoil`: `Math.floor(heat * 0.15)` HP damage inflicted on the player.

### 2. Integration Pattern
In any crafting panel or action handler:
```tsx
import { OverforgeGauge, calculateOverforgeBonus } from './OverforgeGauge';

// Render the gauge in your UI:
<OverforgeGauge heat={overforgeHeat} onChangeHeat={setOverforgeHeat} />

// In your crafting/mutation/upgrade callback:
const { multiplier, isShattered, recoilDamage, isGodForged } = calculateOverforgeBonus(overforgeHeat);

if (isShattered) {
  // Item shatters! Refund 1x Scrap Material and log destruction
} else {
  // Apply multiplier to item stats (dmg, def, etc.) and prefix if isGodForged
}
```

---

## 🗑️ Discard & Drop Item Gump Modal (`src/components/modals/DiscardItemModal.tsx`)

When players select `[DISCARD]` on any item in the inventory (`src/components/UnifiedInventoryPanel.tsx`), the system opens an interactive fantasy-styled Gump modal.

### 1. Key Features
- **Visual Presentation**: Renders the item's icon, name, rarity border, description, and unit weight contribution.
- **Stackable Quantity Slider**: For stackable items (crafting alloys, catalysts, potions, spell scrolls), provides a quantity slider and number input to choose exactly how many items to discard or drop.
- **Two Disposal Pathways**:
  - **Drop on Ground**: Spawns a physical `GroundLootPile` on the player's tile (`playerPos.x, playerPos.y`). The item remains visible on the world canvas and can be picked back up at any time.
  - **Destroy / Vaporize**: Permanently purges the item/quantity from the game state.

### 2. Stackable Spell Scrolls
All scrolls (Scroll of Recall, Fireball Scrolls, Teleport Scrolls) are configured with `stackable: true` and `isScroll: true` in `src/utils/itemsData.ts`, ensuring multiple scrolls merge into single inventory stacks with quantity counts.

---

## 🌀 Unstable Mutation Synergy Chain Engine (`src/utils/mutationSynergy.ts` & `src/components/MutationSynergyPanel.tsx`)

The Unstable Mutation Synergy Chain Engine handles dual-element catalyst combinations, multi-tier chain levels, strain gauges, and trait perks during item mutations at the Blacksmith's Mutation Forge.

### 1. Key Modular Modules
- **`src/utils/mutationSynergy.ts`**: Contains `DUAL_ELEMENT_SYNERGIES` records and `resolveMutationSynergyChain(existingCatalysts, newCatalystType, mutationCount, overforgeHeat)` resolver.
- **`src/components/MutationSynergyPanel.tsx`**: Modular UI panel that renders active element chips, dual-element synergy traits, Mutagenic Strain Gauge (0% to 100%), and power multiplier forecasts.

### 2. How to Add a New Dual-Element Synergy Trait
To register a new elemental synergy trait (e.g. Earth + Fire -> Magma Burst):
1. Open `src/utils/mutationSynergy.ts`.
2. Append a new `MutationSynergyDefinition` object to `DUAL_ELEMENT_SYNERGIES`:
```ts
{
  id: 'syn_magma_burst',
  name: 'Magma Burst',
  elements: ['Fire', 'Earth'],
  traitName: '🌋 Magma Burst Meltdown',
  icon: '🌋',
  color: 'from-orange-600 to-amber-500',
  description: 'Superheated molten rock explodes on critical strikes, melting enemy defense.',
  bonusPowerPct: 40,
}
```
3. The engine automatically detects the catalyst combination and calculates power multipliers, strain gauges, and tooltip badges!

---

## 🛠️ Developer Quick-Reference: Adding New Content

### 1. How to Add a New Crafting Alloy or Catalyst
1. Open `src/utils/itemsData.ts`.
2. Add your material ID to the `MATERIALS_DATABASE` or `CATALYSTS_DATABASE` record.
3. Define its `id`, `name`, `type`, `description`, `icon`, `weight`, and `rarity`.
4. (Optional) Declare its price multipliers per biome in `src/utils/tradeEconomy.ts` under `BIOME_PRICE_MULTIPLIERS`.

### 2. How to Add a New Crafting Recipe
1. Open `src/components/CraftingPanel.tsx`.
2. To add a weapon/armor recipe, append a template definition object to the `BASE_WEAPONS` or `BASE_ARMORS` list.
3. Specify `id`, `name`, `type`, `subType`, `baseAtk` or `baseDef`, `durability`, `requiredMaterials`, and `icon`.

### 3. How to Add a New Spell Scroll
1. Open `src/data/spellScrolls.json` (or `src/utils/itemsData.ts`).
2. Register the scroll item with `isScroll: true`, `stackable: true`, and `subType: 'Scroll'`.
3. Add the scroll's cast resolution logic in `src/App.tsx` inside the scroll consumption handler.

### 4. How to Add a New Enemy or Boss
1. Open `src/data/enemies.json`.
2. Add a new enemy key (e.g. `"FrostGiant"`) with `name`, `baseHp`, `baseAtk`, `baseDef`, `range`, `speed`, `char`, and `color`.
3. (Optional) Add its custom drop matrix or boss flags in `src/utils/dungeon.ts` or `src/utils/overworld.ts`.

---

## 🚪 How to Construct & Spawn a Valid Dungeon Entrance Near the Player

To test dungeon generation, transition logic, or level mechanics, developers can construct a valid dungeon entrance directly near the player in three ways:

### Method A: Using Sovereign God Mode (Tile Painter)
1. Open Sovereign God Mode by pressing `~` (Tilde) or clicking the God Mode icon (`F12`).
2. Select the **World / Map Editor** tab.
3. In the Tile Palette, select **`StairsDown`** (`🧱 Staircase / Dungeon Entrance`).
4. Click on any walkable tile adjacent to the player's position `(playerX + 1, playerY)`.
5. Step onto the tile and press `>` or click **Enter Dungeon** in the action bar. The game engine will automatically call `generateLevel(...)` and link `TileType.StairsUp` at the entry.

### Method B: Using the GM Teleport / Portal Console Command
1. Open the GM Console (`/` or Sovereign Console).
2. Execute the **Open Portal to Abyss Dungeon** action (`/warp abyss` or select from GM Warp dropdown).
3. The engine instantly generates a full 40x64 dungeon floor at Depth 1, positions the player on a valid `TileType.StairsUp` tile, and populates enemies, chests, traps, and props flawlessy.

### Method C: Programmatic TypeScript Construction in Code
To spawn a valid dungeon entrance programmatically next to the player in a custom hook or developer trigger:

```typescript
import { TileType } from '../types';
import { findStairsOrWalkablePosition } from '../utils/gameUtils';
import { generateLevel, generateDungeonProps } from '../utils/dungeon';

// 1. Place a StairsDown tile adjacent to the player's current overworld coordinate
const targetX = gameState.playerX + 1;
const targetY = gameState.playerY;

// Mutate map tile safely
const updatedMap = gameState.map.map((row) => [...row]);
updatedMap[targetY][targetX] = TileType.StairsDown;

// 2. When player steps onto targetX, targetY and interacts, trigger transition:
const depth = 1;
const levelState = generateLevel(
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  depth,
  gameState.playerStats.turnsPlayed,
  gameState.playerStats.realTimeSeconds,
  gameState.playerStats,
  gameState.currentWeapon,
  gameState.defeatedEnemiesCount,
  gameState.clearedCamps?.length || 0
);

// 3. Find/repair entry stairs to guarantee a safe player spawn
const stairsUp = findStairsOrWalkablePosition(
  levelState.map,
  TileType.StairsUp,
  `Dungeon Depth ${depth}`
);

// 4. Update Game State with new dungeon map & props
const props = generateDungeonProps(levelState.map, depth);
setGameState((prev) => ({
  ...prev,
  map: levelState.map,
  playerX: stairsUp.x,
  playerY: stairsUp.y,
  inDungeon: true,
  currentDepth: depth,
  enemies: levelState.enemies,
  chests: levelState.chests,
  traps: levelState.traps,
  props,
}));
```

---

## 🏰 Special Themed Dungeon Types & Overworld Lairs

The dungeon generator (`src/world/dungeonGen.ts`, `src/world/poiGenerators.ts`) supports **10 specialized dungeon types & procedural overworld lairs**, each equipped with custom tile palettes, specialized lighting filters, unique monster spawn tables, and tailored boss encounters:

| Dungeon Type | ID Token | Theme & Architecture | Specific Monster Spawns & Bosses | Tilemap & Visual Palette |
| :--- | :--- | :--- | :--- | :--- |
| **Tuonela's Sunken Keep** | `sunken_keep` | Submerged undead fortress flooded with dark water channels and ancient stone pillars. | Skeleton Archmages, Nakki Water Spirits, Iku-Turso, Tuoni's Shadow Guardians. | Dark navy slate, indigo walls, luminous blue water reflections. |
| **Ancient Tomb & Crypt** | `ancient_tomb` | Pillar-lined catacombs containing ancestral sarcophagi, urns, and secret trapdoors. | Skeleton Warriors, Void Cultists, Mummy Champions, Tomb Specters. | Obsidian & purple floor tiles with smoldering void torches. |
| **Ilmarinen's Forge Hearth** | `forge_hearth` | Subterranean volcanic workshop with flowing lava channels, anvils, and elemental hearths. | Magma Golems, Fire Elementals, Corrupted Forge Smiths. | Crimson & fiery orange basalt stone tilemap with lava glow. |
| **Tapio's Ley-Well Shrine** | `leywell_shrine` | Overgrown mystical botanical sanctuary surrounding a central shimmering mana well. | Forest Spirits, Treants, Celestial Ley-Guardians. | Emerald moss, floral vines, and luminous crystal tiles. |
| **Väinämöinen's Rune Monolith**| `runic_monolith` | High-magic stone circle spires humming with Finnish mythology rune song chants (*Laulu*). | Arcane Constructs, Void Spell-singers, Rune Stalkers. | Golden-etched rune stone tiles with magic particle emitters. |
| **Antero Vipunen's Fossil** | `tectonic_fossil` | Cavern built inside the fossilized ribcage of an ancient primordial giant. | Earth Elementals, Cave Bears, Stone Golems, Tectonic Wurms. | Terracotta brown, bone-white, and amber crystal cavern tiles. |
| **Bandit Lair & Outlaw Camp** | `bandit_lair` / `outlaw_camp` | Wooden palisade outposts, roasting spits, barricades, and locked treasure vaults. | Bandit Crossbowmen, Outlaw Chiefs, Highway Barons. | Timber log walls, campfires, and dirt floor pathways. |
| **Tactical Caravan Skirmish** | `skirmish` | 24x18 open road map generated during caravan ambushes with a central Merchant Wagon (`🛒`). | Highway Terror Bosses, Bandit Ambushers, Dire Wolves. | Dirt crossroads with wagon props and guard campfire. |
| **Sanctum Boss Floor** | `boss_floor` | Grand single-room boss arena with entrance pillars, boss HUD health bars, and relic altars. | Act Bosses (*Abyssal Void Lord*, *Thunder Warlord Volkan*). | High-contrast floor marble with glowing relic draft altars. |
| **Rogue Cave Network** | `cave` | Classic cellular automata cave network populated with dynamic loot, traps, and monsters. | Goblins, Cave Spiders, Orc Warriors, Slimes. | Standard stone cavern tiles with dynamic lighting. |

---

## 🌌 Autonomous GM Engine Architecture & Controls

The **Autonomous GM (Game Master) Engine** (`src/utils/gmStoryteller.ts`) is an intelligent, reactive narrative controller running natively inside the game loop. It monitors battlefield tension, player HP ratios, movement patterns, and idle turns to dynamically steer gameplay events.

### ⚙️ Core Parameters & Default State
- **Default Enabled**: The Autonomous GM Engine is **ON by Default** (`gmAutonomousWeather: true` in initial `GameState` and `WorldContext`).
- **Ritual Turn Interval**: Configured by default to **25 turns** (`gmWeatherInterval: 25`), governing atmospheric weather transitions and narrative interventions.
- **Storyteller Personalities**: Dynamically shifts between `Benevolent`, `Intrigued`, `Mischievous`, `Sadistic`, and `Apathetic` based on player status and boredom metrics.

### 🌀 Dynamic Storyteller Interventions
When active, the Autonomous GM monitors each turn step and automatically invokes narrative interventions when specific battlefield conditions are met:
1. **Autonomous Weather Modulations (`gm_harsh_tempest`, `gm_benevolent_clear_skies`, `weather_mutation`)**:
   - Dynamically mutates overworld weather based on GM personality mood (*Sadistic* / *Mischievous* vs. *Benevolent*).
   - Biome-aware tempest escalations: calls down Blizzards in Tundra, Sandstorms in Deserts, and Torrential Rain in Forests/Swamps when tension surges.
   - Benevolent solar cleansings clear skies and dispense warm protective light when player HP is critical (< 35% max HP).
2. **Dynamic World Threat & Chaos Escalations (`gm_threat_escalation_surge`, `gm_celestial_eclipse_event`, `gm_triangle_cheater`)**:
   - Temporary Threat Tier surges increase elite monster affixes (*Shieldbreaker*, *Vampiric*, *Thorns*, *Reflective*).
   - Celestial Eclipses align celestial phases into Blood Moon surges when chaos spikes.
   - Golden Triangle Anomaly Corruptions mutate nearby enemies beyond standard class constraints into terrifying tactical anomalies.
3. **Autonomous Caravan Injections & Road Blockades (`gm_caravan_traveler_injection`, `gm_road_blockade_skirmish`)**:
   - Intrigued/Benevolent GM spawns travelling merchant wagons (`🛒`) in overworld wilderness chunks offering trade stock or escort contracts.
   - Sadistic GM triggers outlaw road blockades and highwayman ambushes commanded by Corrupted Road Barons on active trade routes.
4. **Divine Protection Aura**: Casts a protective shield when player HP drops into critical danger (< 15% max HP).
5. **Guardian Paladin Spawn**: Summons an Ethereal Holy Templar follower during extreme battlefield pressure or boss fights.
6. **Ether Mana Surge**: Channels raw MP directly to the player when their mana reservoir reaches 0.
7. **Alchemical Sprite Manifestation**: Drops a Volatile Alchemical Sprite near the player carrying high-tier elemental catalysts.
8. **Ore Thief & Bandit Camp Spawns**: Summons Ilmarinen's Ore Thieves carrying rare metals or outlaw encampments around campfires.
9. **Spike Traps & Chaos Surges**: Sadistic or mischievous moods trigger local floor spike hazards or passive chaos rolls.

### 🛠️ Developer Inspection & Controls
Developers can inspect and adjust the Autonomous GM Engine in real time through multiple tools:
1. **God Panel (`F12` / `~`)**:
   - Displays the **`GM ENGINE: ACTIVE (DEFAULT ON)`** live badge in the header.
   - Under the **Sovereign** tab, developers can toggle the Autonomous GM Engine on/off, adjust the Ritual Turn Interval (10, 25, 40, 60, 100 turns), and monitor GM Boredom Pressure.
2. **GM Storyteller Panel (`/` Console or GM Metrics Button)**:
   - Provides live readouts of the GM's internal monologue thoughts feed, active personality, boredom %, and tension rating.
   - Allows forcing specific interventions (e.g., Immediate Rift Spawn, Lightning Smite, Paladin Summoning) on demand.

---

## 🛡️ Town Guard Active Defense & Alarm AI Architecture

Town Guards (`isTownGuard: true`) feature a proactive multi-tier town defense system in `src/hooks/useEnemyAI.ts`:

### 1. Proactive Town-Wide Threat Detection & Alarm Network
- **Town-Wide Threat Scan**: On every enemy turn, town guards scan the entire settlement map for hostile entities (e.g. bandits, rogue monsters, or hostile invaders).
- **Active Pursuit & Pathfinding**: When a threat is detected anywhere in town, town guards immediately enter active pursuit, utilizing BFS pathfinding (`getNextStepTowards`) to march directly toward the hostile target.
- **Defensive Alarm Broadcast**: Detecting or engaging a hostile target causes the guard to sound an alarm, automatically waking up and alerting all dormant town guards within a 30-tile radius (e.g. sentries or guards resting in barracks beds) to form a coordinated defensive response force.

### 2. Multi-Target Combat & Defense
- **Target Selection & Reciprocal Attacks**: Guards engage hostiles using Chebyshev range calculations (`dx <= enemyRange && dy <= enemyRange`) and deal persistent damage using `applyDamageToEnemy`.
- **Hostile Target Prioritization**: Hostile monsters prioritize attacking active defenders (Town Guards and Followers) in their line of sight, allowing town guards to shield player settlements and engage in full multi-unit tactical combat.

---

## 📄 High-Performance Log System & Replay Importer Architecture

The game includes a zero-lag log management and simulation replay architecture (`src/components/GameLog.tsx`, `src/components/GodPanelOverlay.tsx`):

### 1. High-Volume Log Stream Virtualization & Duplicate Collapsing
- **Virtual DOM Slicing**: Rendered logs in `src/components/GameLog.tsx` are hard-capped at the latest **150 entries** (`maxRenderedLogs = 150`), preventing React DOM layout recalculation freezes even when 50,000+ combat actions are accumulated in memory.
- **Consecutive Message Aggregation**: Identical consecutive log events (e.g. repeated melee swings) are automatically collapsed into single rows with counter badges (`(x5)`), reducing visual clutter.

### 2. Zero-Lag Drag-and-Drop File Importer
- **File Reader Stream Loading**: The Replay Simulation Dock in God Panel accepts large log `.txt` or `.json` file uploads via drag-and-drop or direct device file picker.
- **Preview Truncation & Non-Allocating Parsing**: Text previews in state are truncated to 50,000 characters to ensure 60 FPS UI responsiveness, while the full file stream parses embedded JSON replay blocks (`--- COMPREHENSIVE SIMULATOR REPLAY DATA ---`) in background ticks.

---

## ⚡ Sovereign God Mode & Developer Cheats

The Sovereign Developer Console and God Panel (`F12` or `~`) provide developer overrides for rapid balance testing and debugging:

### God Mode & Weight Rules
- **God Mode (`godModeActive`)**: Grants absolute invulnerability against all incoming enemy attack damage, sidetracks health loss, and **automatically grants an unlimited weight limit** (`getMaxWeight` returns `9999.0` kg).
- **Unlimited Weight Bypass (`bypassWeightLimit`)**: Deactivates all inventory encumbrance checks and item weight calculations, allowing players to carry infinite equipment items, metals, timber, and catalysts without capacity restrictions.
- **Custom Max Weight Slider**: Allows dynamically setting base carrying capacity in memory (from 10 kg to 1000 kg) for encumbrance tuning tests.

---

## 🔊 WebAudio Synthesizer & Sound Engine

The engine relies on pure **procedural WebAudio synthesis** in `src/utils/audio.ts` without external static audio files.

### Key Highlights:
1. **Spatial Audio Panning & Attenuation**: Attenuates volume with $(1 - \text{dist}/\text{maxDist})^{1.5}$ and pans left/right dynamically based on tile coordinates ($x, y, \text{playerX}, \text{playerY}$).
2. **Dynamic Biome Ambiance & Accent Timers**: Background ambient layers for rain, wind, blizzard howl, sandstorms, dungeon sub-bass, and periodic biome accents (`owl_hoot`, `cricket_chirp`, `frog_croak`, `cave_echo`, `lute_pluck`, `ocean_wave`, `fire_crackle`, `water_drip`).
3. **Realistic Indoor Building Acoustic Soundscape (v4.3.6)**: Automatically detects when player enters a house, tavern, shop, keep, or watchtower (`src/utils/buildingAudio.ts`). Dynamically applies a lowpass acoustic muffle filter (~650 Hz cutoff) to outdoor weather/wind, triggers door creaks/latches (`door_open`, `door_close`), plays timber creaks and pendulum clocks (`wood_creak`, `clock_tick`), and switches footsteps between wooden planks (`wood_footstep`), stone tiles (`stone_footstep`), and outdoor grass (`grass_step`).
4. **Quick 1-Click HUD Mute & Persistence**: Instant **`🔊 Mute` / `🔇 Muted`** toggle in the main header bar and volume controls auto-persisted in `localStorage` (`cosmic_abyss_audio_settings_v1`).
5. **Developer Extension Guide**: See [`AUDIO.md`](/AUDIO.md) for full audio graph details, sound catalog, and a 3-step guide on adding custom synthesized sound effects.

---

## 🧪 Automated QA, Import Health Audit & Testing Suite

The codebase is protected by an automated QA & testing suite with 100% passing status across **49 Vitest test suites (295 total unit, simulation & automated interaction tests)**.

### 🛠️ Developer Scripts
- **`npm run audit`**: Launches the comprehensive codebase auditor (`scripts/auditCodebase.cjs`), verifying 378 source files, 29 JSON data catalog files, and relative import resolutions across all TypeScript files. It then runs TypeScript type checking (`tsc --noEmit`) and all 49 Vitest test suites.
- **`npm test`**: Runs all 49 Vitest test suites (`vitest run`).
- **`npm run lint`**: Performs TypeScript type verification without emitting build artifacts (`tsc --noEmit`).
- **`npm run build`**: Compiles the application for production deployment with Vite (`vite build`).

---

## 🎮 Developer Cheats, GM Commands & Debugging Tools Reference

The game engine provides an extensive suite of developer hotkeys, GM cheat commands, visual tilemap painters, and live diagnostics designed for rapid testing, balance tweaking, and content creation.

### 1. Global Developer Hotkeys
- **`G` Key**: Toggles the **Sovereign God Panel & GM Narrator Overlay** (`GodPanelOverlay.tsx`) instantly from anywhere in the game.
- **`F12` / `~` Key**: Opens the Developer Console overlay.
- **`/` Key**: Focuses the GM Console Input field inside the God Panel.

---

### 2. GM Cheat Commands Catalog (`src/data/gmCommands.ts`)

The God Panel features an interactive command line that accepts GM slash commands. Commands can be executed by typing in the input box or clicking the quick-action command pills.

| Command Name | Usage | Description |
| :--- | :--- | :--- |
| **`/god`** | `/god` | Toggles absolute Invincibility and unlimited carrying weight (`9999` kg). |
| **`/heal`** | `/heal` | Instantly restores player HP, Mana, and clears Fatigue/Injury debuffs. |
| **`/max_stats`** | `/max_stats` | Sets all player primary stats (STR, DEX, INT, CON, LCK, CHA) to `99`. |
| **`/gold`** | `/gold <amount>` | Grants specified gold pouch amount directly to the player (default: `1000`). |
| **`/xp`** | `/xp <amount>` | Awards experience points to trigger immediate level ups (default: `500`). |
| **`/spawn_boss`** | `/spawn_boss <name>` | Spawns a World Threat Boss Ambush enemy on adjacent canvas tiles. |
| **`/spawn_caravan`** | `/spawn_caravan` | Spawns a traveling merchant wagon group nearby. |
| **`/repair_wagon`** | `/repair_wagon` | Instantly restores active Merchant Caravan Wagon Hull HP to `100%`. |
| **`/teleport_town`** | `/teleport_town` | Fast-travels the player to the nearest overworld settlement chunk. |
| **`/clear_fog`** | `/clear_fog` | Completely reveals Fog of War across the current overworld chunk or dungeon floor. |
| **`/trigger_weather`** | `/trigger_weather <type>` | Forces immediate weather transition (`rain`, `blizzard`, `ashfall`, `sandstorm`, `void_fog`, `clear`). |
| **`/force_eclipse`** | `/force_eclipse` | Triggers a celestial Blood Moon / Eclipse phase for high-threat monster spawns. |
| **`/threat_level`** | `/threat_level <1-5>` | Directly overrides the global World Threat Tier (1 = Peaceful, 5 = Apocalypse). |
| **`/add_item`** | `/add_item <id>` | Spawns any equipment, scroll, or material directly into player inventory by ID. |
| **`/add_catalyst`** | `/add_catalyst <type>` | Grants 5x specified Elemental Catalyst (`fire`, `ice`, `lightning`, `holy`, `void`). |
| **`/add_relic`** | `/add_relic <id>` | Drafts and equips a Sanctum Relic by ID. |

---

### 3. Visual Developer Editors & Debuggers (`src/components/god/`)

1. **Visual Dungeon & Tilemap Painter (`GodDungeonEditor.tsx`)**:
   - 2D grid painter for visually designing dungeon rooms and skirmish battlegrounds.
   - Brush tools: **Wall**, **Floor**, **Water**, **Chasm**, **Chest**, **Monster**, **Torch**, **Guard**, **Wagon**.
   - Click **"Export Blueprint to Mod Manager"** to convert the painted layout directly into a JSON mod for runtime spawning.

2. **Runtime Mod Manager (`GodModdingTab.tsx`)**:
   - Live JSON editor featuring real-time syntax highlighting, error overlays, and mod toggle switches.
   - Allows importing, exporting, creating, and hot-reloading custom monsters, weapons, armor, spells, and dungeon blueprints.

3. **Item & Monster Spawners (`GodItemSpawner.tsx`, `GodMonsterSpawner.tsx`)**:
   - Dropdown catalog UI allowing developers to spawn any item, spell scroll, crafting material, or monster directly onto adjacent canvas tiles.

4. **Performance & Diagnostics Monitor (`GodDiagnosticsTab.tsx`)**:
   - Real-time performance readouts: active FPS, canvas draw calls per frame, particle count, active entity count, overworld chunk memory footprint, and WebAudio synthesizer node usage.







