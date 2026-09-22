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
  │   ├── items.ts               # EquipmentItem, Recipe & Material Types
  │   └── elemental.ts           # Elemental Ground Fields, Intensities & Propagation Contracts
  │
  ├── 📂 hooks                   # Custom Domain Engine Hooks
  │   ├── 📂 ai                  # Modular AI Behavior & Enemy/Civilian Decision Trees
  │   │   ├── types.ts           # AI parameter context and state interfaces
  │   │   ├── aiTurnEnvironment.ts # Status ticks, weather/season modifiers, roaming spawns
  │   │   ├── useFollowerAI.ts   # Companion follow logic, ranged positioning, defensive assist & tactical retreat
  │   │   ├── useTownGuardAI.ts  # Town defense threat response, 30-tile alarm broadcast, day/night shifts
  │   │   ├── useHostileAI.ts    # Stagger posture, telegraphed attacks, wagon targeting, BRACE/DODGE & defender focus
  │   │   ├── useCivilianAI.ts   # Cat wandering, civilian schedules, weather shelter, hero counter-attacks
  │   │   ├── aiCombatAggregator.ts # Aggregated floating combat text & caravan skirmish resolution
  │   │   └── useEnemyAI.ts      # Turnkey AI coordinator executing turn-based AI resolution
  │   ├── 📂 god                 # God Mode & Developer Sandbox Orchestration
  │   │   └── useGodPanelState.ts # Centralized cheats, arena warp, spawn dispatch & sim runners
  │   ├── 📂 app                 # Extracted App-Level Orchestration Hooks
  │   │   ├── usePlayerTurnMovement.ts # Turn steps, chunk loading, terrain hazards, traps, and looting
  │   │   ├── 📂 movement        # Modular Movement & Collision Sub-Engine
  │   │   │   ├── types.ts       # Movement context & collision payload interfaces
  │   │   │   ├── useStepResolver.ts # Tile collisions, boundaries, followers, doors
  │   │   │   ├── useTerrainHazards.ts # Mud/ice/sand terrain modifiers & traps
  │   │   │   ├── useTileLooting.ts  # Tiered chest loot distribution & gold pickup
  │   │   │   ├── useChunkTransition.ts # Continuous overworld streaming boundaries
  │   │   │   └── index.ts       # Movement sub-engine barrel export
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
  │   ├── waterShimmerRenderer.ts# Procedural sine-wave specular ripples, wave foam lines & crystalline glints
  │   ├── biomeAtmosphereRenderer.ts# Ambient micro-particles (snowflakes, fireflies/wisps, volcanic embers)
  │   ├── visualFxParticleSystem.ts# Particle system: water ripples, rain footstep splashes, spell bursts
  │   ├── weatherLightingRenderer.ts# Weather lighting shaders, weather overlay cross-fades & transition fog
  │   ├── spriteAnimationManager.ts# Multi-frame 4-directional sprite state machine
  │   ├── spriteRenderer.ts      # Optimized sprite rendering & emoji regex caching
  │   ├── AssetPreloader.ts      # Asynchronous tile-sheet & sprite image loader
  │   ├── TilesetAtlasManager.ts # Sprite sheet grid & autotile coordinate mapper
  │   ├── VFXEmitter.ts          # Decoupled real-time particle VFX emitter queue
  │   ├── elementalVfxRenderer.ts# Canvas procedural VFX for fire, ice, sparks, steam, and poison gas
  │   ├── waterCausticsRenderer.ts# Multi-scale dynamic water caustics, wave light webs & submerged refraction
  │   ├── bloomEngine.ts         # Luminous HDR bloom pass, pre-cached gradient stamps for emitters & spells
  │   ├── vignetteRenderer.ts    # Atmospheric perimeter vignette, dungeon depth scaling & blood moon tints
  │   └── index.ts               # Canvas engine barrel export
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
  │   ├── 📂 crafting            # Modular Crafting Sub-Components & Stations
  │   │   ├── CraftingHeader.tsx # Discipline tabs switcher & search filter
  │   │   ├── RecipeCard.tsx     # Cost badges & level requirement cards
  │   │   ├── WeaponForgingTab.tsx # Weapon/armor forging & tier smithing
  │   │   ├── CookingTab.tsx     # Campfire culinary recipes & stamina rations
  │   │   ├── AlchemyTab.tsx     # Potion brewing & elixir synthesis
  │   │   ├── CampAndToolsTab.tsx # Survival tools, hatchets, pickaxes & campfire deployables
  │   │   ├── ScrollScriptoriumTab.tsx # Spell scroll scribing & arcane glyph matrices
  │   │   ├── MutationCatalystTab.tsx # Elemental catalyst equipment infusions
  │   │   └── GearUpgradeTab.tsx # Tier upgrades & equipment repair
  │   ├── UnifiedInventoryPanel.tsx # Decoupled composer coordinating modular sub-components
  │   ├── 📂 inventory           # Modular Inventory Sub-Components & Panels
  │   │   ├── types.ts                # Inventory interfaces & item rarity evaluators
  │   │   ├── HeroBiometricsCard.tsx  # Hero profile & Core RPG Attribute point allocation
  │   │   ├── EquipmentPaperdoll.tsx  # 8-slot equipped gear display & durability renderer
  │   │   ├── CombatStatsSummary.tsx  # Integrated combat stats, Cat Lover & Battle Scars
  │   │   ├── InventoryWeightBar.tsx  # Real-time carrying capacity limit gauge & overburdened alerts
  │   │   ├── InventoryFilterBar.tsx  # Sub-navigation tabs (Allies, Gear, Food, Mats) & Sort/Group actions
  │   │   ├── AlliesRosterView.tsx    # Active party follower roster & follower gear inspection
  │   │   ├── GearInventoryGrid.tsx   # Equipment cards, rarity tiers, 2H/Dual-Wield & discard gump
  │   │   ├── ProvisionsInventoryGrid.tsx # Consumables & potions display with recovery metrics & eat/drink
  │   │   ├── MaterialsInventoryGrid.tsx  # Dual-column layout for crafting alloys and elemental catalysts
  │   │   ├── BackpackSlotGrid.tsx    # Master coordinator composing weight bar, filters, and tab grids
  │   │   ├── AlchemicalTransmuterPanel.tsx # Portable Wild Alchemical Transmuter UI
  │   │   └── index.ts                # Inventory components barrel export
  │   ├── 📂 worldmap            # Modular Cartography World Map & Sector Intelligence
  │   │   ├── types.ts                # World map POIs, chunk models, pins & TraversalIndex
  │   │   ├── chunkTileRasterizer.ts  # Micro-tile surface rasterizer with topographic relief & dual LRU cache
  │   │   ├── WorldMapHeader.tsx      # Compass header, coordinate breadcrumbs, zoom stepper & filter toggles
  │   │   ├── WorldMapCanvas.tsx      # Dual-layer interactive canvas, smooth inertia, touch deadzone & Compass D-Pad
  │   │   ├── WorldMapChunkTooltip.tsx # Collapsible sector dossier with minimize pill & reticle frame
  │   │   ├── WorldMapPinsList.tsx    # Discovered Leyline Waystones and custom user explorer pins
  │   │   ├── CustomPinEditorModal.tsx # Landmark pin editor with icon palette and color picker
  │   │   ├── WorldMapLegend.tsx      # Cartographer's map legend and interactive controls guide
  │   │   ├── WorldMapModal.tsx       # Standalone modal wrapper
  │   │   └── index.ts                # World map barrel export
  │   ├── 📂 guild               # Modular Sunder Guild Sub-Engine
  │   │   ├── types.ts                # Guild tabs, props interfaces & safehouse storage contracts
  │   │   ├── useGuildOperations.ts   # Guild operations hook (HQ, research, war, vault, expeditions)
  │   │   ├── GuildHeaderBar.tsx      # Navigation tabs with responsive badge indicators
  │   │   ├── GuildHQPanel.tsx        # Headquarters founding, laboratory research & passive registry
  │   │   ├── GuildSanctuaryPanel.tsx # Custom installments, trophies & decor buffs
  │   │   ├── GuildFactionWarPanel.tsx # Faction gear blueprints, war treasury & conquest map
  │   │   ├── GuildMissionBoard.tsx   # Companion expedition dispatch board & rewards ledger
  │   │   ├── GuildStashPanel.tsx     # Dual-pane vault storage with Quick Stash All & safehouse rest
  │   │   ├── GuildTreasuryPanel.tsx  # Composed facade delegating to sub-panels
  │   │   └── index.ts                # Guild barrel export
  │   ├── 📂 god                 # Sovereign Developer Console Panels
  │   │   ├── GodStorytellerPanel.tsx # GM Storyteller mood, boredom & encounter console
  │   │   ├── GodItemSpawner.tsx      # Declarative item & equipment spawner
  │   │   ├── GodEntitySpawner.tsx    # Enemy, boss & companion spawner
  │   │   ├── GodWorldEditor.tsx      # Tile painter & map generator
  │   │   ├── GodDungeonEditor.tsx    # Grid-Based Custom Dungeon Editor & Painter
  │   │   ├── GodModdingTab.tsx       # Live JSON Schema Mod Manager & Plugin Console
  │   │   ├── GodCheatsTab.tsx        # Developer cheats, stat overrides, God Mode & Realm PNG Exporter
  │   │   ├── GodAdminEditor.tsx      # Raw game state JSON import/export
  │   │   ├── GodEnemyBlueprintEditor.tsx # Custom enemy blueprint designer
  │   │   ├── GodReplaySimulator.tsx  # Turn action replay scrubber
  │   │   └── GodSmoketestTab.tsx     # Client-side virtual smoke test suite panel
  │   ├── 📂 panels              # Dedicated Sidebar & Command Panels
  │   │   ├── PlayerSidebarPanel.tsx  # Health/Mana, stats, buffs, companions, quick spells
  │   │   ├── MobileCommandPad.tsx    # Touch D-Pad & mobile action buttons
  │   │   └── MobileHudBar.tsx        # Compact mobile status grid
  │   ├── 📂 screens             # Major Game State Screens
  │   │   ├── StartScreen.tsx         # Title screen, class selection & new game init
  │   │   ├── GameOverScreen.tsx      # Permadeath summary & run stats
  │   │   └── VictoryScreen.tsx       # Campaign victory screen
  │   ├── 📂 modals              # Standalone Modal Overlays
  │   │   ├── TradeModal.tsx     # Master composer coordinating modular trade sub-components
  │   │   ├── 📂 trade           # Modular Trade Sub-Engine Components
  │   │   │   ├── types.ts       # Trade modal interfaces, role context & caravan destinations
  │   │   │   ├── TradeHeaderBar.tsx # Trader counter header, NPC role badge & exit trigger
  │   │   │   ├── CaravanRoutesWidget.tsx # Regional caravan fast travel & route escort planner
  │   │   │   ├── BlacksmithRepairStation.tsx # Durability repair station, gear cards & forge tier upgrades
  │   │   │   ├── ApothecaryStation.tsx # Laboratory upgrade station & potion tier unlocks
  │   │   │   ├── TavernServiceStation.tsx # Rumor mongering gossip, room rental & mercenary recruitment
  │   │   │   ├── TradeBuyStockGrid.tsx # Left storefront buy column with dynamic price multipliers & charisma discounts
  │   │   │   ├── TradeSellStashGrid.tsx # Right liquidation sell column for gear, raw materials & catalysts
  │   │   │   └── index.ts       # Trade sub-components barrel export
  │   │   ├── DialogueModal.tsx  # NPC conversation trees & tavern gossip
  │   │   ├── CaravanActiveOverlay.tsx # Caravan travel progress & wagon HP
  │   │   └── DiscardItemModal.tsx # Item discard & ground loot drop gump
  │   ├── ChunkMinimap.tsx       # Overworld 2D Canvas Minimap & POI visualizer
  │   ├── DifficultyTracker.tsx  # Dynamic Chaos Matrix & Adaptive Threat Level HUD
  │   ├── ChaosConsole.tsx       # Chaos surge visualizer & mitigation dashboard
  │   ├── OverforgeGauge.tsx     # Over-forging heat gauge & bellows risk/reward engine
  │   ├── MutationSynergyPanel.tsx # Dual-element mutation synergy matrix & strain gauge
  │   ├── AudioSettingsModal.tsx # Volume sliders & sound preferences modal
  │   └── AudioOscilloscopeStudio.tsx # 60 FPS WebAudio oscilloscope & synth studio
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
  │   │   ├── acousticOcclusion.ts  # Raytraced acoustic occlusion, Bresenham obstacle raycasting & door muffling
  │   │   ├── soundCatalog.ts    # Procedural sound design definitions for UI, spells, combat, loot, crafting
  │   │   └── index.ts           # Unified audio barrel export
  │   ├── 📂 elemental           # Elemental Propagation Sub-Engine (Pillar 2)
  │   │   ├── elementalEngine.ts # Cellular fire spread, ash decomposition, water freeze/melt, shock conduction, gas explosions
  │   │   └── index.ts           # Elemental sub-engine barrel export
  │   ├── 📂 worldmap            # World Map & Cartography Utilities
  │   │   └── worldMapPngExporter.ts # Whole realm 40% scale offscreen canvas rasterizer & PNG exporter
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
  │   │   ├── overworldChunkGen.ts # Chunk assembler orchestrator
  │   │   └── asyncChunkBatcher.ts # Asynchronous chunk streaming & non-blocking background pre-generation
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
  └── 📂 tests                   # Automated Vitest Engine Test Suites (64 test files, 399 tests)
      ├── ai.test.ts             # Pathfinding, Bresenham line of sight & enemy AI tests
      ├── appHooksAndGameStateFactory.test.ts # App hooks & game state factory tests
      ├── audioEngineModular.test.ts # WebAudio synthesizer node graphs & sound catalog
      ├── automatedButtonSuite.test.ts # Interactive UI buttons across all top-level tabs & overlays
      ├── automatedCraftingButtonSuite.test.ts # Crafting, smithing, alchemy & cooking action buttons
      ├── automatedGodAndStudioButtonSuite.test.ts # Sovereign Developer cheats & Audio Oscilloscope buttons
      ├── automatedGuildButtonSuite.test.ts # Sunder Guild operations, vault stash & war buttons
      ├── automatedInventoryButtonSuite.test.ts # Inventory 8-slot paperdoll & attribute buttons
      ├── automatedSaveLoadAndMigrationSuite.test.ts # Save serialization, migration & corrupt state handling
      ├── automatedWorldMapButtonSuite.test.ts # World map cartography, waystones & custom pins buttons
      ├── berryBushAndRegenBatching.test.ts # Berry bush harvesting & regen batching
      ├── biomesAndUniqueDungeons.test.ts # 7 Whittaker biomes & 10 unique dungeon floor layouts
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
      ├── guildModularPanels.test.ts # Sunder Guild modular panels & safehouse storage
      ├── harborPort.test.ts     # Coastal harbor towns, docks & nautical trades
      ├── hooksIntegration.test.ts # Domain hook integration & state synchronization
      ├── inventoryComponents.test.ts # Modular inventory sub-components & biometrics
      ├── itemsAndInventory.test.ts # Inventory stacking, weight encumbrance & item durability
      ├── logAndDiagnostics.test.ts # Combat log formatting, diagnostic events & level scaling
      ├── modularAIEngine.test.ts# Autonomous AI modular sub-engine tests
      ├── npcDialogue.test.ts    # Weather and time reactive NPC dialogue trees
      ├── npcSchedulesAndShelter.test.ts # NPC daily routines, weather shelter & tavern drinking
      ├── organicWorldGen.test.ts# Multi-octave continuous noise, rivers & clustered vegetation
      ├── saveLoad.test.ts       # Serialization, save integrity validation & corruption handling
      ├── settlementScalingAndTaverns.test.ts # Settlement tier scaling & tavern layouts
      ├── shadowRenderer.test.ts # Dynamic sun & moon 24h directional drop shadows
      ├── spatialAcousticsAndVfx.test.ts # Raytraced acoustic occlusion, water caustics, bloom & vignette
      ├── spellsAndMana.test.ts  # Active spells catalog, mana costs & scroll conversions
      ├── storytellerAI.test.ts  # GM state, personality shifts & encounter triggers
      ├── storytellerModule.test.ts # Modular GM Storyteller sub-engine & chaos surges
      ├── toolHarvestingDurability.test.ts # Hatchet/pickaxe tool requirements & durability decay
      ├── waterShimmerAndAtmosphere.test.ts # Water ripple sine-waves & micro-particle atmosphere
      ├── waystonesAndCustomPins.test.ts # Leyline waystones, custom pins & fast travel
      ├── weatherAndMutations.test.ts # Weather effects, catalyst multipliers & dual-element synergies
      ├── wildernessEnemyTierVariance.test.ts # Wilderness monster tier variance & affix scaling
      ├── worldDungeonModular.test.ts # Modular dungeon sub-engine & room generation
      ├── worldGen.test.ts       # Chunk generation, biomes & dungeon floor layouts
      ├── worldMap.test.ts       # World map cartography, tile rasterizer & sector intelligence
      └── worldMapPngExporter.test.ts # 40% scale Realm PNG exporter rasterization & export tests
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

The engine features 65 test suites (410 unit & simulation tests passing 100% green) covering procedural generation, pathfinding AI, player combat execution (`usePlayerAttack`), directional shadows, water ripples, ambient particles, save/load validation and state migration, crafting, weather mechanics, dual-element synergies, GM Storyteller performance evaluation, living ecosystem simulation, modular inventory sub-components, and watchtower siege mechanics.

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

## 👾 How to Create Custom Enemies & Behavioral AI Roles

You can declare custom enemies by pushing templates into `window.customEnemies` or configuring `src/data/enemies.json`.
- **Combat Parameters**: Enemies support pathfinding speed (`speed`), attack ranges (`range`), defensive parameters (`baseDef`), health (`baseHp`), attack power (`baseAtk`), and visual avatars (`char`, `color`).
- **Behavioral AI Archetypes (`aiRole`)**:
  - `'melee'`: Standard front-line combatant. Advances directly towards targets and strikes in melee range.
  - `'skirmisher_kiting'`: Tactical ranged marksman / spellcaster. Advances to optimal 3–4 tile range. If a player or defender encroaches into melee (<= 2 tiles), calculates retreat vectors and kites backward to re-establish range before firing.
  - `'support_healer'`: Backline medic / shaman. Scans for wounded allies with HP < 75% within 6 tiles, casting restorative spells (+25% HP) on teammates with dynamic cooldown tracking (`supportSpellCooldown`).
  - `'support_buffer'`: Arcane totem / buffer. Prioritizes buffing elite and boss allies within 5 tiles with ATK/DEF enhancements.
  - `'tank'`: High-health, heavy vanguard that engages threats and absorbs pressure.
  - `'ambusher'`: High-evasion stealth or burrowing predator that strikes with high critical potency.

Example Enemy JSON Schema:
```json
{
  "Necromancer": {
    "name": "Acolyte Necromancer",
    "baseHp": 20,
    "baseAtk": 4,
    "baseDef": 1,
    "range": 4,
    "speed": 1.1,
    "char": "🧙",
    "color": "#a855f7",
    "aiRole": "support_healer"
  },
  "SkeletonMage": {
    "name": "Skeleton Spellflinger",
    "baseHp": 14,
    "baseAtk": 4,
    "baseDef": 0,
    "range": 4,
    "speed": 1.0,
    "char": "S",
    "color": "#60a5fa",
    "aiRole": "skirmisher_kiting"
  }
}
```

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

---

## 🗺️ Cartography & Deep-Zoom World Map Engine (`src/components/worldmap/` & `src/utils/worldmap/`)

The cartography system features an interactive, decoupled multi-layer sector visualizer with continuous coordinate tracking, dynamic frontier bounds expansion, and high-performance rasterization:

### 1. Dual-Canvas Decoupled Rendering Architecture (`WorldMapCanvas.tsx`)
To ensure high performance without layout thrashing:
- **Static Background Layer Canvas**: Renders discovered chunk terrain tiles, elevation contours, highway road splines, river water channels, settlement icons, and POI markers.
- **Dynamic Foreground Layer Canvas**: Operates in an animation loop rendering hero beacon pulse rings, animated Leyline Waystone auras, custom pin glow rings, and selected sector reticles.
- **Dynamic Frontier Bounds**: The map bounding box expands dynamically based on the maximum extents of player discovery, keeping the entire known realm within coordinate view.

### 2. Topographic Hillshading & Double LRU Cache (`chunkTileRasterizer.ts`)
- **Topographic Relief Lighting**: Computes Lambertian surface illumination from the Northwest (315° azimuth, 45° solar elevation) based on elevation gradients across adjacent chunk tiles.
- **Contour Intervals & Alpine Snow**: Renders subtle 5-step elevation contour lines, oceanic depth factors for coastal tiles, and alpine snow cap frost on mountain peaks.
- **Dual LRU Cache**: Employs two in-memory LRU canvas caches (a 64-entry micro-tile cache and a downsampled LOD macro canvas cache) to eliminate redundant per-frame tile generation.

### 3. Whole Realm 40% Scale PNG Exporter (`src/utils/worldmap/worldMapPngExporter.ts`)
- **Offscreen Canvas Rasterization**: Constructs an offscreen canvas scaling all discovered chunks to 40% resolution ($10 \times 10$ pixels per tile).
- **High-Resolution Visual Export**: Exports full terrain topography, river splines, road networks, settlements, POI icons, and cartographic grid lines into a standalone downloadable PNG.
- **Direct Trigger**: Available in the World Map header button bar and via the Sovereign God Panel (`exportRealmMapToPng(gameState)`).

### 4. Mobile Touch Gestures & Momentum Inertia Physics
- **6px Drag Deadzone**: Prevents accidental sector selection when initiating swipe gestures on mobile viewports.
- **Velocity Tracking & Smooth Inertia**: Samples touch movement delta vectors (`velocityX`, `velocityY`) with exponential decay damping (`friction = 0.92`) to provide smooth momentum panning on drag release.
- **Drag Hover Suppression**: Automatically deactivates mouse/touch tooltip overlays during active panning to prevent inspection cards from obstructing navigation.
- **Collapsible Sector Inspection Card (`WorldMapChunkTooltip.tsx`)**: Includes an interactive minimize/expand pill toggle (`ChevronDown`/`ChevronUp`), close button (`✕`), and selected sector glowing reticle frame (`#38bdf8`).
- **Floating Mobile Compass Navigator**: Renders an ergonomic touch D-pad overlay with instant directional stepping, zoom steppers, center hero (`Crosshair`), and center Oakhaven [0,0] (`Home`).

---

## 🐾 Follower Tactical AI, Defensive Intercepts & Dead State Persistence (`src/hooks/ai/`)

Follower AI (`src/hooks/ai/useFollowerAI.ts`) governs companion movement, tactical positioning, and combat coordination:

### 1. Multi-Archetype Combat Behavior
- **Dynamic Range Detection**: Evaluates companion weapon type to determine engagement distance (Bows engage at 4-tile range, Magic Staves at 3 tiles, Spears at 2 tiles, Swords/Daggers at 1 tile).
- **Tactical Fallback & Retreat**: When companion HP drops below 30%, defensive instincts trigger, causing the follower to fall back toward the player's coordinate and avoid melee clashes.
- **Hostile Defender Priority**: Monsters dynamically prioritize engaged followers and town guards over passive player movement, creating engaging frontline skirmishes.

### 2. Companion Dead State & Transition Persistence
- **Zero-HP Death State**: When a follower's HP reaches 0, `isDead: true` is permanently stamped onto the follower entity.
- **Transition Safeguards**: Follower arrays preserve `isDead` flags during dungeon stairs transitions, overworld chunk boundaries, and save/load serialization, preventing dead companions from reviving or ghost-attacking.

---

## 🧪 Automated QA, Import Health Audit & Testing Suite

The codebase is protected by an automated QA & testing suite with 100% passing status across **51 Vitest test suites (310 total unit, simulation & automated interaction tests)**.

### 🛠️ Developer Scripts
- **`npm run audit`**: Launches the comprehensive codebase auditor (`scripts/auditCodebase.cjs`), verifying 383 source files, 29 JSON data catalog files, and relative import resolutions across all TypeScript files. It then runs TypeScript type checking (`tsc --noEmit`) and all 51 Vitest test suites.
- **`npm test`**: Runs all 51 Vitest test suites (`vitest run`).
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

---

## 🎨 Pluggable Dual-Mode Graphics Engine & Sprite Sheet Guide (`/src/canvas/`)

The rendering pipeline is built on a modular, pluggable **Hybrid Graphics Architecture** (`HybridGraphicsEngine.ts`) allowing seamless toggling between high-DPI procedural glyphs and sprite-sheet texture atlases.

### 1. Default Visual Mode & Dynamic Switching
- **Default Mode**: The engine defaults to **`classic_glyph`** mode (`getStoredGraphicsMode()` in `src/canvas/types.ts`).
- **High-DPI Procedural Glyph Rendering**: In `classic_glyph` mode, every tile, monster, guard, animal, and structure is rendered with Crisp Unicode typography, distinct elemental color codes, directional shadows, smooth Lerp interpolation, animated water specular shimmer, and equipment paperdoll overlays.
- **1-Click Mode Switching**: Players and developers can switch anytime using the **`🔲 Classic ASCII` / `🎨 Animated Tileset`** button in the header bar or programmatically:
  ```typescript
  import { hybridGraphicsEngine } from '../canvas';

  // Toggle between 'classic_glyph' and 'animated_tileset'
  hybridGraphicsEngine.toggleMode();

  // Or set explicitly
  hybridGraphicsEngine.setMode('animated_tileset');
  ```
- **State Persistence**: The current graphics mode is saved in `localStorage` under `roguelike_graphics_mode`.

---

### 2. Sprite Sheet & Atlas Layout Specifications

When in `animated_tileset` mode, the engine accesses sprite coordinates managed by `TilesetAtlasManager.ts` and loaded through `AssetPreloader.ts`.

#### A. Terrain Tileset Atlas Layout (`main_tileset`)
- **Base Grid Size**: $32 \times 32$ pixels per tile.
- **Cardinal Autotiling Bitmask**: Walls, Water channels, Roads, and Fences use a 16-bitmask matrix ($N=1, E=2, S=4, W=8$):
  - `(0, 0)`: Isolated pillar (Bitmask 0)
  - `(1, 0)`: End North (Bitmask 1)
  - `(2, 0)`: End East (Bitmask 2)
  - `(3, 0)`: Corner North-East (Bitmask 3)
  - `(0, 1)`: End South (Bitmask 4)
  - `(1, 1)`: Straight North-South (Bitmask 5)
  - `(2, 1)`: Corner South-East (Bitmask 6)
  - `(3, 1)`: T-Junction North-East-South (Bitmask 7)
  - `(0, 2)`: End West (Bitmask 8)
  - `(1, 2)`: Corner North-West (Bitmask 9)
  - `(2, 2)`: Straight East-West (Bitmask 10)
  - `(3, 2)`: T-Junction North-East-West (Bitmask 11)
  - `(0, 3)`: Corner South-West (Bitmask 12)
  - `(1, 3)`: T-Junction North-South-West (Bitmask 13)
  - `(2, 3)`: T-Junction South-East-West (Bitmask 14)
  - `(3, 3)`: Cross Intersection North-East-South-West (Bitmask 15)

#### B. Entity & Character Animation Atlas Layout (`entity_tileset`)
- **Dimensions**: $32 \times 32$ pixels per frame.
- **Directional Rows**:
  - Row 0 (`sy = 0`): South (Facing Forward/Down)
  - Row 1 (`sy = 32`): West (Facing Left)
  - Row 2 (`sy = 64`): East (Facing Right)
  - Row 3 (`sy = 96`): North (Facing Up)
- **Animation Action Columns**:
  - Cols 0–3 (`sx = 0..96`): **Idle** animation frames (4-frame breathing cycle)
  - Cols 4–7 (`sx = 128..224`): **Walk** animation frames (4-frame stepping cycle)
  - Cols 8–11 (`sx = 256..352`): **Attack / Swipe** animation frames
  - Cols 12–13 (`sx = 384..416`): **Hurt / Stagger** reaction frames
  - Cols 14–15 (`sx = 448..480`): **Spellcast / Channeling** frames

---

### 3. How to Preload Custom Sprite Sheets
To load custom PNG sprite sheets (e.g. from `/assets/tileset.png` or external CDNs):
```typescript
import { assetPreloader } from '../canvas';

// Preload terrain atlas
await assetPreloader.preloadAtlas('main_tileset', '/assets/dungeon_tileset.png');

// Preload entities/monsters atlas
await assetPreloader.preloadAtlas('entity_tileset', '/assets/creatures_atlas.png');
```

#### 🛡️ Zero-Break Automatic Fallback
If an atlas image is not loaded or fails to load, `TilesetRenderer.ts` automatically intercepts draw calls and executes the high-DPI procedural glyph renderer. The game will never crash, stall, or display black boxes.

---

## ⚔️ Combat VFX, Ballistic Projectiles & Decals (`combatVfxEngine.ts`)

The **Combat VFX Engine** unifies projectile trajectories, directional melee slashes, impact particle bursts, and persistent ground decals across both classic and tileset modes.

### 1. Ballistic Projectile Engine (`projectileEngine.ts`)
Supports 4 trajectory dynamics:
- **`parabolic`**: Curved ballistic arc for bows, thrown daggers, throwing axes, and javelins.
- **`serpentine`**: Sinusoidal weaving wave for Frostbolts, Ice shards, and Poison darts.
- **`spiral`**: Orbiting vortex for Void siphons and Shadow bolts.
- **`straight`**: Direct high-speed beam for Fireballs, Magic Missiles, and Lightning javelins.

#### Spawning a Custom Projectile:
```typescript
import { combatVfxEngine } from '../canvas';

combatVfxEngine.spawnProjectile({
  fromX: playerX,
  fromY: playerY,
  toX: enemyX,
  toY: enemyY,
  color: '#f97316',
  coreColor: '#fed7aa',
  symbol: '🔥',
  shape: 'sphere',
  trajectory: 'parabolic',
  speed: 14.0,
  trailParticles: true,
  onImpact: (hitX, hitY) => {
    // Spawn directional impact decal & burst
    combatVfxEngine.spawnDecal('scorch', hitX, hitY);
  },
});
```

### 2. Directional Melee Slashes & Ground Decals (`meleeVfxEngine.ts`)
- **Melee Slashes**: Renders curved sweeping slash arcs rotated towards the target vector (N, NE, E, SE, S, SW, W, NW) with dynamic elemental glow.
- **Persistent Combat Decals**:
  - `'blood'`: Organic crimson blood splatters that linger and slowly fade on dungeon/overworld ground.
  - `'scorch'`: Charred, soot-blackened ground burns from fire spells and lava traps.
  - `'frost'`: Crystalline frost rime patches from ice attacks.
  - `'stone_fracture'`: Radial fractured stone cracks from heavy bludgeoning hits.

---

## 💡 Dynamic 2D Multi-Point Lighting & Weather Shaders (`lightingEngine.ts`)

The lighting engine provides real-time 2D multi-light rendering with harmonic flame flicker and optical destination-out radial blending.

### 1. Light Emitter Types
- **Player Lantern**: Follows the player with a warm amber radius ($\approx 145\text{px}$).
- **Campfires & Fireplaces**: Emits large roaring hearth illumination ($\approx 180\text{px}$) with lively crackling sparks.
- **Torches & Wall Sconces**: Casts ambient dungeon orange light ($\approx 120\text{px}$).
- **Lava & Traps**: Deep crimson volcanic glow ($\approx 110\text{px}$).
- **Shrines & Portals**: Pulsating mystical cyan/violet illumination ($\approx 135\text{px}$).

### 2. Multi-Frequency Harmonic Flame Flicker
Lights do not pulse in artificial synchrony. They calculate a 3-harmonic sine waveform:
$$r_{\text{flicker}} = r \times \big(1 + (0.5 \sin(1.7t + \phi) + 0.3 \cos(3.1t + 1.5\phi) + 0.2 \sin(6.3t + 2.3\phi)) \times \text{magnitude}\big)$$

### 3. Weather Ground Interactivity (`weatherInteractivityRenderer.ts`)
- **Rain Puddle Ripples**: Concentric circular ripples periodically expand and fade on walkable grass, stone paths, and cobblestones.
- **Droplet Splashes**: Micro-droplets bounce upwards from ground impacts during rainfall.
- **Snow Accumulation**: In winter, snowy biomes, or blizzard weather, delicate snow caps settle onto tree crowns and stone wall top edges.
- **Thunderstorm Flash**: Celestial lightning strikes momentarily illuminate the entire screen with day-bright electric light before fading.

---

## 🏛️ Faction Engine & Hostility Matrix (`src/factions/`)

The game features an extensible, modular faction system supporting dynamic standing tiers, merchant price adjustments, and multi-faction turf wars.

### 1. Faction Registry & Standing Tiers (`FactionMatrix.ts`)
- **Major Factions**:
  - `iron_pact`: Iron Pact Castle Town Defenders & Citadel Sentries.
  - `orc_clan`: Bloodfang Orc Clan raiders and warlords.
  - `shadow_guild`: Outlaw Bandits and highwaymen.
  - `sunder_guild`: Player-allied Sunder Adventurer Guild.
  - `nature_spirits`: Forest guardians and dryads.
  - `undead_scourge`: Crypt skeletons and necromancers.
- **Reputation Tiers**:
  - `Hated` ($< -500$): Kill on sight.
  - `Unfriendly` ($-500 \text{ to } -100$): Hostile interactions, high tariffs ($+50\%$).
  - `Neutral` ($-100 \text{ to } 100$): Standard trade, wary tolerance.
  - `Friendly` ($100 \text{ to } 500$): Faction discounts ($-10\%$), quest unlocks.
  - `Honored` ($500 \text{ to } 900$): Safehouse access, elite gear discounts ($-25\%$).
  - `Revered` ($> 900$): Legendary faction blueprints and allied reinforcements.

### 2. Hostility & Combat Integration
```typescript
import { factionMatrix } from '../factions';

// Check if two entities are hostile
const isHostile = factionMatrix.areHostile('iron_pact', 'orc_clan'); // true

// Adjust player faction reputation on enemy kill
factionMatrix.recordKill('orc_clan'); // Decreases orc standing, increases town standing
```

---

## 🎨 Procedural Mockup Atlas & Dynamic Tileset Engine

The engine provides a complete procedural sprite sheet and tileset generation architecture. It allows rapid testing, instant theme swapping, variable sprite resolution (16px–128px), and native rendering of multi-tile oversized boss entities without external graphic dependencies.

### 1. Architecture Components

1. **`MockupAtlasGenerator.ts`**:
   - Programmatically synthesizes 4 complete pixel-art texture atlas canvases:
     - `main_tileset`: Walls, floors, water, grass, paths, doors, stairs, props, and Wang autotile 16-bitmask variations.
     - `entity_tileset`: 4-directional 4-frame animation sheets for Player, Warrior, Mage, Rogue, Town Guards, Goblins, Skeletons, Orcs, Spiders, Wolves, Slimes, and Cats.
     - `boss_tileset`: Oversized multi-tile bosses (2x2 Dragons, 2x2 Titan Golems, 3x3 Demon Lords).
     - `items_tileset`: Weapons, shields, helmets, armor, potions, rings, scrolls, and catalysts.
   - Supports 4 distinct visual themes:
     - `classic`: 16-bit retro fantasy (warm stone, verdant foliage, golden trim).
     - `cyber`: Neon cyan gridlines, magenta energy, holo-circuits.
     - `forest`: Verdant deepwood, mossy slate, emerald leaf particles.
     - `infernal`: Volcanic basalt, molten lava, hellfire embers.

2. **`AssetPreloader.ts` (Canvas Injection & Event System)**:
   - Direct injection of in-memory `HTMLCanvasElement` sources via `registerCanvas(key, canvas)`.
   - Dynamic `getAtlasSource(key)` returning `CanvasImageSource` (either `HTMLImageElement` or `HTMLCanvasElement`).
   - Reactive `onAtlasChange(callback)` event listeners that automatically re-render the viewport when a theme or resolution change occurs.

3. **`TilesetAtlasManager.ts` (Dynamic Sizing & Oversized Entity Registry)**:
   - Dynamic base sprite size configuration (`setSpriteSize(16 | 24 | 32 | 48 | 64)`).
   - Dynamic coordinate resolution with `getSpriteCoords(entity, animState, direction, frame)`.
   - **`OversizedEntityConfig`**: Multi-tile entity configuration specifying `widthTiles`, `heightTiles`, source atlas pixel dimensions (`pixelWidth`, `pixelHeight`), and vertical ground anchor (`anchorY`).

### 2. How to Programmatically Generate or Swap Atlases

```typescript
import { mockupAtlasGenerator } from './canvas/MockupAtlasGenerator';
import { assetPreloader } from './canvas/AssetPreloader';
import { tilesetAtlasManager } from './canvas/TilesetAtlasManager';

// 1. Generate all procedural atlases with a theme and sprite size
mockupAtlasGenerator.generateAllAtlases('cyber', 32);

// 2. Or switch theme on the fly
mockupAtlasGenerator.setTheme('infernal');

// 3. Or change resolution (e.g. 48x48 HD sprites)
mockupAtlasGenerator.setBaseSpriteSize(48);

// 4. Export atlas as PNG Data URL for offline editing
const pngUrl = mockupAtlasGenerator.getDataUrl('entity_tileset');
```

### 3. Adding New Oversized Boss Entities

To add a new multi-tile creature (e.g., a 2x2 Minotaur or 3x3 Kraken):

```typescript
import { tilesetAtlasManager } from './canvas/TilesetAtlasManager';

// Register oversized entity blueprint
tilesetAtlasManager.registerOversizedEntity('minotaur', {
  entityId: 'minotaur',
  atlasKey: 'boss_tileset',
  widthTiles: 2,
  heightTiles: 2,
  pixelWidth: 64,
  pixelHeight: 64,
  sx: 128,
  sy: 0,
  anchorY: 0.92, // Ground anchor offset
});
```

### 4. Developer Suite: Tileset Studio Tab

Access the **Tileset Studio** tab in the Sovereign Dev Panel (`F1` or God button):
- **Theme Switcher**: Instant one-click toggle between Classic, Cyber, Forest, and Infernal themes.
- **Resolution Scaler**: Live slider (16px to 64px) dynamically re-rasterizing the atlas and canvas.
- **Atlas Sheet Inspector**: High-resolution zoomable viewer with coordinate grid overlays and PNG export.
- **Character & Boss Animator**: Interactive 4-directional state machine previewer (Idle, Walk, Attack, Hurt, Cast) with adjustable FPS.
- **Autotiling 16-Grid**: Visual test matrix for all 16 cardinal connectivity bitmasks (N=1, E=2, S=4, W=8).
- **Live Test Spawner**: Instant spawn of standard characters or 2x2/3x3 bosses directly adjacent to the player on the active map.

---

## 🎨 Complete Tileset Modding & Hand-Crafting Guide

This section explains exactly **where all tileset and sprite files reside in the codebase** and provides a step-by-step tutorial on **how to create or replace tilesets by hand** (using custom PNG images or pixel-art tools like Aseprite, Photoshop, or GIMP).

### 🎨 0. Dual "Instinct Classic" Tileset Sources: PNG Mockups vs. Procedural Code

The engine establishes **two authoritative classic tileset sources** that share an identical 16×16 coordinate grid contract and can be seamlessly hot-swapped at runtime via the Tileset Studio (`F1` -> Tileset Studio) or `HybridGraphicsEngine.setTilesetSource(...)`:

1. **Instinct Classic (PNG Mockups)** (`TilesetSourceType: 'classic_png'`):
   - **Source Location**: `/public/tilesets/*.png` (`main_tileset.png`, `entity_tileset.png`, `animations_tileset.png`, `boss_tileset.png`, `items_tileset.png`).
   - **Asset Builder**: Generated and expanded via `scripts/generateMockupPngs.cjs` (`npm run generate:tilesets`).
   - **Characteristics**: Pre-rendered, deterministic, pixel-perfect PNG assets suitable for production shipping, external graphic editing, and zero-runtime CPU overhead.

2. **Instinct Classic (Procedural Code)** (`TilesetSourceType: 'classic_code'`):
   - **Source Location**: `src/canvas/MockupAtlasGenerator.ts`.
   - **Asset Builder**: Synthesizes 4 complete pixel-art texture atlas sheets in-memory directly onto HTML5 `CanvasRenderingContext2D` objects.
   - **Characteristics**: Infinite procedural themes (`classic`, `cyber`, `forest`, `infernal`), dynamic resolution scaling (16px–128px), and instant modifiability purely via TypeScript.

---

### 📁 1. Where Tilesets & Sprite Engines Live in the Files

All graphics, sprite-sheets, texture atlases, autotiling matrices, and tile-to-coordinate mappers live under `/src/canvas/` and standalone PNG mockups under `/public/tilesets/`:

| File Path | Core Role & Contents |
| :--- | :--- |
| **`/public/tilesets/*.png`** | **Instinct Classic (PNG Mockups)**: Ready-to-use PNG atlases (`main_tileset.png`, `entity_tileset.png`, `animations_tileset.png`, `boss_tileset.png`, `items_tileset.png`) generated by `scripts/generateMockupPngs.cjs`. |
| **`src/canvas/MockupAtlasGenerator.ts`** | **Instinct Classic (Procedural Code)**: Draws the 4 in-memory texture atlases (`main_tileset`, `entity_tileset`, `boss_tileset`, `items_tileset`) across 4 themes (`classic`, `cyber`, `forest`, `infernal`). Renders procedural pixel art directly onto HTML5 Canvas elements. |
| **`src/canvas/TilesetAtlasManager.ts`** | **Coordinate & Bitmask Mapping Registry**: Defines grid coordinates (column, row, atlas key) for every `TileType`, trap, chest, door, static prop, dynamic Wang autotile 16-bitmask matrix, entity animation frame mapping, and oversized boss dimensions. |
| **`src/canvas/AssetPreloader.ts`** | **Image & Canvas Loader / Cache**: Manages loading external PNG images via `preloadAtlas(key, url)` and in-memory canvases via `registerCanvas(key, canvas)`. Emits reactive update notifications when an atlas is swapped. |
| **`src/canvas/spriteRenderer.ts`** | **Unified Sprite Drawing Engine**: Translates high-level draw requests (`drawSpriteOrAscii`) into pixel-perfect atlas sub-rectangle clipping (`ctx.drawImage(atlas, sx, sy, sw, sh, dx, dy, dw, dh)`), handling frame rate ticks and visual modes. |
| **`src/canvas/tileMapRenderer.ts`** | **Overworld & Dungeon Chunk Grid Renderer**: Iterates over visible map tiles, resolves biome context, calculates autotiling bitmasks, and renders terrain, walls, decorations, and water shimmer. |
| **`src/canvas/entityPaperdollEngine.ts`** | **Equipment Paperdoll Layering**: Renders helmets, armor, boots, shields, and weapons as distinct modular layers over character sprites in Tileset mode. |
| **`src/components/god/TilesetTesterTab.tsx`** | **In-Game Tileset Studio GUI**: Interactive live visual studio (`F1` / God Mode -> Tileset Studio) where you can toggle between **Instinct Classic (PNG)** and **Instinct Classic (Code)**, inspect atlases with grid overlays, test animations, and export procedural tilesets. |

---

### 🎨 2. The 4 Core Texture Atlas Sheets & Grid Layout

The engine organizes all graphics into 4 distinct atlas keys (standard base grid size is **32×32px** per tile, scalable from 16px to 128px):

```
+-------------------------------------------------------------------------------------------------+
| 1. 'main_tileset' (16 cols × 16 rows = 512×512px @ 32px)                                        |
| Rows 0-3: 16-Bitmask Autotile Walls (Cardinal N/E/S/W connections)                              |
| Rows 4-5: Terrain & Autotile Water (Grass, Sand, Snow, Dirt, Paved Stone, Water shores)         |
| Row 6:    Forest & Foliage (Oak Tree, Pine Tree, Birch Tree, Berry Bush, Stumps)               |
| Row 7:    Ores & Minerals (Copper Ore Vein, Iron Ore Vein, Gold, Mithril, Rubble)               |
| Row 8:    Doors, Stairs & Structures (Closed Door, Open Door, Stairs Down, Stairs Up, Waystones) |
| Row 9:    Traps, Hazards & Props (Spikes, Fire Vent, Poison Gas, Campfires, Anvils, Shrines)     |
| Rows 10-15: Dungeon Theme Biome Variations (Sunken Crypt, Volcanic Basalt, Ice Cavern)         |
+-------------------------------------------------------------------------------------------------+
| 2. 'entity_tileset' (16 cols × 16 rows)                                                         |
| Rows 0-1: Player Character (Idle, Walk, Attack, Hurt - 4 directions × 4 frames)                 |
| Rows 2-3: Humanoid Allies (Warrior, Mage, Rogue, Town Guards)                                   |
| Rows 4-11: Common Monsters (Goblins, Skeletons, Orcs, Spiders, Dire Wolves, Cave Slimes, Bats)   |
| Rows 12-15: NPCs & Townspeople (Blacksmith, Merchant, Innkeeper, Legendary Stray Cats)          |
+-------------------------------------------------------------------------------------------------+
| 3. 'boss_tileset' (16 cols × 16 rows)                                                           |
| 2×2, 3×3, and 4×4 Oversized Monsters & Act Bosses (Abyssal Void Lord, Thunder Warlord, Dragon) |
+-------------------------------------------------------------------------------------------------+
| 4. 'items_tileset' (16 cols × 16 rows)                                                          |
| Weapons, Shields, Helmets, Armor, Spell Scrolls, Potions, Elemental Catalysts, Gems & Gold Coins|
+-------------------------------------------------------------------------------------------------+
```

---

### ✍️ 3. How to Create & Add a New Tileset By Hand

You can create and load custom tilesets using two primary methods:

#### Method A: Drawing a Custom PNG Image in an External Editor (Aseprite / GIMP / Photoshop)

1. **Export the Base Template**:
   - Launch the game and open the **Tileset Studio** tab (`F1` or God Mode button -> **Tileset Studio**).
   - Click **`Export PNG`** on the `main_tileset` (or `entity_tileset`) canvas to save the default layout as a `.png` file.
   - Alternatively, open an image editor and create a new image of size **512×512px** (for 32×32px tiles in a 16×16 grid).

2. **Paint Your Custom Tiles**:
   - Match the cell coordinates specified in `src/canvas/TilesetAtlasManager.ts` (e.g. Row 6 Col 0 = Oak Tree, Row 8 Col 0 = Closed Door, Row 8 Col 2 = Stairs Down).
   - Use transparent backgrounds for entities, foliage, and props so terrain renders underneath them.

3. **Save Your PNG to the Project**:
   - Place your custom sprite sheet in the `/public` directory (e.g., `/public/assets/tilesets/my_custom_tileset.png`).

4. **Register and Preload the Custom PNG**:
   - In `src/canvas/AssetPreloader.ts` (or during app initialization in `src/App.tsx`), call `preloadAtlas`:
   ```typescript
   import { assetPreloader } from './canvas/AssetPreloader';

   // Preload your custom PNG sprite sheet
   await assetPreloader.preloadAtlas('main_tileset', '/assets/tilesets/my_custom_tileset.png');
   ```
   - When loaded, `AssetPreloader` automatically replaces the procedural canvas and triggers a clean viewport re-render!

---

#### Method B: Programmatic Pixel-Art in TypeScript (`MockupAtlasGenerator.ts`)

If you prefer writing pure procedural pixel art without external image assets:

1. **Open `src/canvas/MockupAtlasGenerator.ts`**.
2. **Locate or Add Tile Drawing Routines**:
   - Scroll to the corresponding draw method (e.g., `drawWallTile`, `drawTreeTile`, `drawDoorTile`, `drawOreVeinTile`).
   - Use standard HTML5 Canvas 2D context methods (`ctx.fillRect`, `ctx.fillStyle`, `ctx.beginPath`, `ctx.arc`) using integer pixel coordinates:
   ```typescript
   // Example: Handcrafting a custom Magic Crystal Shrub at col 5, row 6
   private drawCrystalShrub(ctx: CanvasRenderingContext2D, px: number, py: number, size: number) {
     // Base soil shadow
     ctx.fillStyle = '#1e293b';
     ctx.fillRect(px + 4, py + size - 6, size - 8, 4);

     // Glowing amethyst crystal spire
     ctx.fillStyle = '#c084fc';
     ctx.fillRect(px + 12, py + 8, 8, 16);

     // Facet highlight
     ctx.fillStyle = '#f3e8ff';
     ctx.fillRect(px + 14, py + 10, 3, 10);
   }
   ```
3. **Map the Coordinates in `TilesetAtlasManager.ts`**:
   - If adding a brand new `TileType` or prop, register its static location in `initStaticTileMappings()`:
   ```typescript
   this.tileStaticCoords.set('MagicShrub', {
     atlasKey: 'main_tileset',
     col: 5,
     row: 6,
     frameCount: 1,
   });
   ```

---

### 🔄 4. Adding New Autotiling Rules (16-Bitmask Wall & Water Connectivity)

The engine uses a 4-neighbor cardinal bitmask algorithm (`N=1`, `E=2`, `S=4`, `W=8`) to select the seamless connected corner, junction, or wall cap:

1. In `src/canvas/TilesetAtlasManager.ts`, review `initDefaultBitmasks()`:
   - `bitmask: 0` = Isolated Pillar (`col: 3, row: 3`)
   - `bitmask: 3` (N+E) = Bottom-Left Corner (`col: 0, row: 2`)
   - `bitmask: 15` (N+E+S+W) = 4-Way Cross Intersection (`col: 1, row: 1`)
2. To add a new autotiled terrain type (e.g., Lava Shorelines or Crystal Walls), register a new entry in `this.autotileBitmasks.set(TileType.YourNewTile, customBitmaskConfig)`.

---

### 🧪 5. Testing Your Custom Tileset In-Game

1. Toggle into **Animated Tileset** mode by clicking **`🎨 Tileset`** in the top header bar or pressing `F8` / `Alt+T`.
2. Open **God Mode** (`F1` or `~`), navigate to the **Tileset Studio** tab, and verify your new atlas coordinates and animation playback.
3. Step near the new tiles in the overworld or dungeons to confirm pixel alignment, clipping margins, and lighting shader blending.

---

## 🛡️ Merchant Caravan Escort & Tactical Skirmish Sub-Engine

The caravan travel system orchestrates inter-settlement trade expeditions, random overland encounters, and dedicated 24×18 tactical skirmish battlefields.

### 1. State Machine & Flow (`src/hooks/useCaravanTravel.ts`)
- **Initiation**: `handleStartCaravanTravel(origin, dest, destName, rewardGold)` configures origin/dest chunk coordinates, calculated step count based on Manhattan distance, and initial 100 HP wagon integrity.
- **Overland Steps**: `handleAdvanceCaravanTravel()` steps along the trade route. Each step rolls for road encounters (`generateRandomCaravanEncounter`) scaled by regional threat tiers.
- **Encounter Types**:
  - **Narrative Checks**: Roadblocks, fallen bridges, muddy bogs, mysterious peddlers (resolved via STR, DEX, INT, CHA, or LCK skill checks).
  - **Hostile Ambushes**: Outlaw bands, beast packs, or Act Boss Ambushes.
- **Tactical Skirmish Deployment**: When players engage in combat, `handleDeployTacticalBattle` captures a lossless snapshot of the current overworld chunk into `savedOverworldState` (`map`, `discovered`, `visible`, `enemies`, `dungeonProps`, `playerX`, `playerY`, `currentChunkX`, `currentChunkY`).
- **Skirmish Battlefield (`src/world/caravanSkirmishGen.ts`)**: Generates a self-contained 24×18 arena with central road band, trade carriage wagon prop (`🛒`), guard campfire, 2 allied veteran defenders, and perimeter ambushers.
- **Victory & Defeat Resolution**:
  - **Tactical Victory**: In `aiCombatAggregator.ts` and `usePlayerAttack.ts`, defeating all hostile ambushers grants bonus gold/XP and immediately restores the saved overworld state without losing chunk memory.
  - **Tactical Flee**: In `CaravanActiveOverlay.tsx`, retreating back to the convoy carriage penalizes hull HP while safely restoring the overworld chunk.
  - **Journey Completion**: Arriving at the destination invokes `handleCompleteCaravanTravel`, validating destination chunk safety via `findNearestSafePlayerTile`, transferring rewards based on preserved wagon hull percentage, and granting bonus elemental catalysts for high integrity (>= 85%).
- **Zero-Crash Guarantees**:
  - Full null-safety checks on `updatedChunks` and `nextOverworldChunks`.
  - Immutable state snapshots prevent map or coordinate desynchronization.
  - Guard and merchant spawns enforce window and obstacle avoidance algorithms.

---

## 🎒 Modular Inventory Architecture & Decomposition (`src/components/inventory/`)

The inventory system was decomposed from a monolithic 1,000+ line component into lightweight, decoupled subcomponents following the engine's strict anti-monolith guidelines.

### Component Map & Responsibilities
- **`InventoryWeightBar.tsx`**:
  - Dynamically calculates hero carrying capacity based on Base Strength attributes and backpack capacity perks.
  - Implements smooth color-coded thresholds: Cyan/Teal (<75%), Warm Amber (75-99%), and Flashing Rose (>100% encumbered).
  - Emits real-time warning badges alerting the player to movement stagger penalties when overburdened.
- **`InventoryFilterBar.tsx`**:
  - Encapsulates inventory category tabs (`Allies`, `Gear`, `Food`, `Mats`) with responsive item count badges.
  - Houses the "Sort & Group" action header with SVG rotation animations and transient success feedback.
  - Triggers distinct procedural audio cues (`ui_click`) on selection.
- **`AlliesRosterView.tsx`**:
  - Displays recruited party followers with archetype badges, level indicators, and combat posture statuses.
  - Features companion equipment inspection triggers and dismiss/manage workflows.
- **`GearInventoryGrid.tsx`**:
  - Renders equipped and stashed equipment cards with rarity borders (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`).
  - Renders weapon/armor durability bars, unit weights, and attack/defense statistics.
  - Supports contextual equip actions: 1-Handed, 2-Handed, and Dual-Wield off-hand equipping.
  - Integrates spell scroll reading and the custom item discard gump dialog.
- **`ProvisionsInventoryGrid.tsx`**:
  - Manages consumables, cooked campfire rations, wild forageables, and apothecary potions.
  - Shows explicit health and mana restoration values before consumption.
  - Integrates direct Eat/Drink action buttons with consumption audio triggers.
- **`MaterialsInventoryGrid.tsx`**:
  - Structured dual-column inventory for raw crafting materials (Wood, Copper, Iron, Herbs) and elemental catalysts (Fire, Ice, Shock, Poison, Shadow).
  - Displays individual resource counts, icons, and contextual drop/discard handlers.
- **`BackpackSlotGrid.tsx` (Master Coordinator)**:
  - Reduced from 1,018 lines to ~190 lines. Composes the weight bar, filter controls, and active sub-view tabs, maintaining pure reactive state bindings without monolithic layout code.

### 27. Modular Trade & Commerce Sub-Engine (`/src/components/modals/trade/`)
The commerce and town trading interface (`TradeModal.tsx`), formerly a 943-line monolithic modal, has been decoupled into dedicated sub-components within `/src/components/modals/trade/`:
- **`TradeHeaderBar.tsx`**: Renders dynamic trader identity, NPC role badges, closing hours indicators, and safe modal exit triggers.
- **`CaravanRoutesWidget.tsx`**: Calculates regional overworld destinations, risk factors, distance metrics, and triggers wagon escort fast travel.
- **`BlacksmithRepairStation.tsx`**: Manages weapon/armor durability, equipped gear cards, broken item alerts, repair costs (0.5g per durability point lost), and forge tier upgrades.
- **`ApothecaryStation.tsx`**: Handles laboratory upgrades, catalyst brewing tiers, and restorative potion unlocks.
- **`TavernServiceStation.tsx`**: Implements bartender gossip rumor purchases (40g), cozy room rentals (15g), and 4-tier wandering mercenary recruitment (Novice, Veteran, Champion, Merchant Guard).
- **`TradeBuyStockGrid.tsx`**: Storefront stock column with dynamic regional biome price multipliers, town reputation discounts, Guild upgrade deals, and Charisma discounts. Includes Artificer enchanted gear, Blacksmith arms, Merchant provisions, Apothecary potions, and Seppo the Smith's rare wares.
- **`TradeSellStashGrid.tsx`**: Liquidation column for stashed equipment, raw crafting materials, and elemental catalysts with active trade license multipliers.
- **`TradeModal.tsx` (Master Coordinator)**: Reduced from 943 lines to 166 lines. Unifies all commercial sub-panels cleanly with memoized role context.

---

## 🚀 Build, CI/CD Pipeline & GitHub Pages Deployment

### 1. Verification Scripts & Automated Testing
The engine provides a unified test and audit pipeline:
```bash
# Run catalog linting, file import graph audit, TypeScript typecheck, and full test suite:
npm run audit

# Run unit and integration tests only:
npm test

# Run strict TypeScript compiler verification:
npm run lint

# Validate all JSON game catalogs in src/data/:
node scripts/validateJson.cjs

# Scan all source modules for circular dependencies and broken imports:
node scripts/auditCodebase.cjs
```
- **Test Suite Status**: 66 test suites, 412 tests passing 100% green.
- **Catalog Validation**: 31 JSON catalogs validated with zero schema defects.
- **Import Audit**: 467 source files scanned with zero broken imports or orphaned modules.

### 2. GitHub Pages Build & Deployment Pipeline
- **Production Build Scripts**:
  - `npm run build`: Standard Vite production build into `dist/`.
  - `npm run build:pages`: Explicit relative-base build (`vite build --base=./`).
- **Automated GitHub Actions (`.github/workflows/deploy.yml`)**:
  - Triggers automatically on push to `main` or `master` branches.
  - Performs clean install (`npm ci`), runs validation (`npm test`), compiles the production bundle, and deploys directly to GitHub Pages.
- **Single Page Application Support**:
  - `public/404.html`: Redirects 404 URL hits to the game root, preventing route breaks on GitHub Pages.
  - `public/.nojekyll`: Instructs GitHub Pages not to process files through Jekyll, preserving Vite assets and folders.
  - `vite.config.ts`: Configures `base: './'` for dynamic repository subpath resolution.
- **License**: Released under the standard MIT License (`LICENSE`).
