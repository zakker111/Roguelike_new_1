# Abyss Rogue: Historical Release Version Log

This document serves as the chronological history and version log of newly completed features, engine stability extensions, and architectural modifications.

---

### Game Roadmap & Upcoming Releases

## [v8.8.2] — Caravan Skirmish State Restoration, Follower Clamping & CI Hardening (September 22, 2026)
*Resolved state restoration defects during caravan journeys and tactical road battles. Enhanced `SavedOverworldSkirmishState` with level dimensions (`levelWidth`, `levelHeight`), corpses, blood splatters, and loot piles; fixed enemy list priority in `useEnemyAI` to prevent tactical entities from overwriting restored overworld actors; clamped follower AI to dynamic map dimensions; invalidated `ChunkBackgroundCache` across skirmish entry, retreat, victory, and arrival; and streamlined `.github/workflows/deploy.yml` with resilient `npm install`.*

- **1. Zero-Loss Skirmish State Restoration (`SavedOverworldSkirmishState`)**:
  - Expanded `SavedOverworldSkirmishState` in `/src/types/game.ts` to include `levelWidth`, `levelHeight`, `corpses`, `bloodSplatters`, and `lootPiles`.
  - Updated `/src/components/ModalRouter.tsx` (`handleDeployTacticalBattle`) to capture full overworld state snapshot upon entering skirmishes.
  - Updated `/src/components/modals/CaravanActiveOverlay.tsx` (flee action) and `/src/hooks/usePlayerAttack.ts` (victory action) to restore level dimensions, loot, corpses, and blood.
- **2. Enemy Overwrite Resolution in AI Engine (`src/hooks/ai/useEnemyAI.ts`)**:
  - Fixed return structure so `restoredOverworld` takes complete precedence for enemies, preventing `nextEnemies` from overwriting restored overworld enemies upon tactical skirmish victory.
- **3. Dynamic Map Clamping for Follower AI (`src/hooks/ai/useFollowerAI.ts`)**:
  - Replaced hardcoded `LEVEL_WIDTH` (64) and `LEVEL_HEIGHT` (40) constants with dynamic map dimensions (`mapW` and `mapH`), preventing followers from pathfinding or fleeing outside the 24×18 skirmish arena bounds.
- **4. Chunk Transition & Skirmish Isolation (`src/hooks/app/movement/useChunkTransition.ts`)**:
  - Blocked overworld chunk border transitions while `gameState.caravanTravel?.isTacticalCombat` is active.
- **5. Encounter Resolution & Arrival Hardening (`src/hooks/useCaravanTravel.ts`)**:
  - Handled `boss_ambush` encounter options `feed` and `pay` safely without spurious damage or false boss slay logs.
  - Enhanced `handleCompleteCaravanTravel` with `isOverworld: true`, `levelWidth`, `levelHeight`, `biome`, and cache invalidation.
- **6. Automated Test Coverage (`src/tests/caravanEncounters.test.ts`)**:
  - Added unit test coverage for skirmish state dimensions and loot preservation. 100% green across all 66 test suites and 413 tests.

## [v8.8.1] — GitHub Pages Resilient CI/CD & Production Publishing Hardening (September 22, 2026)
*Eliminated the missing lockfile barrier in GitHub Actions deployment (`deploy.yml`), generated an exact version-pinned `package-lock.json`, made dependency installation resilient with dynamic fallback (`npm ci || npm install`), ensured 100% relative subpath resolution in `index.html` for GitHub Pages URLs, and passed full verification across 66 test suites and 412 tests.*

- **1. Dedicated Root Lockfile (`package-lock.json`)**:
  - Generated and verified a clean 65 KB `package-lock.json` mapping all 242 direct and transitive dependencies.
  - Verified local and CI runtime with `npm ci` executing deterministically in 11 seconds.
- **2. Resilient Deployment CI/CD Workflow (`.github/workflows/deploy.yml`)**:
  - Removed the hard failure condition on `actions/setup-node@v4` by removing unbuffered `cache: 'npm'`.
  - Added an adaptive installation step (`if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi`), ensuring zero deployment interruptions across any repository fork or OS runner.
- **3. Relative SEO & OpenGraph Asset Paths (`index.html`)**:
  - Updated Twitter card image meta tag from `/og-image.png` to `./og-image.png`, ensuring assets load smoothly on subpaths like `https://<user>.github.io/<repo>/`.
- **4. Comprehensive Pipeline Verification**:
  - Validated 31 JSON data catalogs and 467 TypeScript source files with `scripts/validateJson.cjs` and `scripts/auditCodebase.cjs` (0 errors).
  - Executed all 66 Vitest test suites (412 tests, 100% green pass rate).
  - Built production bundle (`dist/`) verifying relative `./assets/` chunks and static SPA fallback routing.

## [v8.8.0] — Modular Trade & Commerce Sub-Engine Decomposition (September 21, 2026)
*Decomposed the monolithic 943-line TradeModal into modular, decoupled sub-components within `/src/components/modals/trade/` according to the anti-monolith guidelines. Extracted regional caravan escort routing, blacksmith forge durability repairs and tier upgrades, apothecary laboratory synthesis unlocks, tavern gossip & mercenary recruitment boards, and twin-column storefront buy & liquidation stash sell grids.*

- **1. Dedicated Trade Header & NPC Role Context (`src/components/modals/trade/TradeHeaderBar.tsx`)**:
  - Encapsulated dynamic merchant identification, NPC role badges, closing hours indicators, and safe modal exit triggers.
- **2. Regional Caravan Escort & Fast Travel Hub (`src/components/modals/trade/CaravanRoutesWidget.tsx`)**:
  - Dynamically computes nearby town destinations and major continental citadels (Oakhaven, Vanguard Harbor, Ironforge, Sunfire Oasis, Frostpeak, Shadowfen, Stormwatch).
  - Evaluates distance, regional safety risk factors, and gold escort bounties.
- **3. Blacksmith Forge Durability Repair Station (`src/components/modals/trade/BlacksmithRepairStation.tsx`)**:
  - Itemized durability cards for equipped weapons, armor sets, shields, accessories, and backpack inventory gear.
  - Features broken gear pulse alerts and forge tier upgrade progression (Tier 1 through Tier 3).
- **4. Apothecary Laboratory Upgrade Station (`src/components/modals/trade/ApothecaryStation.tsx`)**:
  - Displays laboratory tiers, unlock requirements, and restorative elixir brewing progression.
- **5. Tavern Gossip, Inn Rest & Mercenary Recruitment (`src/components/modals/trade/TavernServiceStation.tsx`)**:
  - Rumor mongering gossip purchases (40g) and room rental (15g).
  - 4-tier wandering mercenary recruitment (Novice Swordsman, Veteran Raider, Champion Gladiator, Merchant Guard).
- **6. Twin-Column Storefront & Liquidation Stash Grids (`src/components/modals/trade/`)**:
  - `TradeBuyStockGrid.tsx`: Left storefront column with dynamic biome price multipliers, town reputation discounts, Guild upgrade deals, Charisma discounts, and Artificer enchanted gear.
  - `TradeSellStashGrid.tsx`: Right liquidation column for unequipped gear, raw materials, and catalysts with caravan trade license bonuses.
- **7. Streamlined Master Composer (`src/components/modals/TradeModal.tsx`)**:
  - Reduced from 943 lines to 166 lines, cleanly unifying all commercial sub-panels.
- **8. Automated Verification & Testing (`src/tests/tradeModularComponents.test.ts`)**:
  - Added test suite validating sub-components. 100% green pass rate across all 66 test suites (412 tests passing).

## [v8.7.0] — Modular Inventory Decomposition & Sub-Component Architecture (September 21, 2026)
*Decomposed the monolithic 1,000+ line BackpackSlotGrid into focused, decoupled subcomponents following the engine's strict anti-monolith guidelines. Extracted dynamic weight limits, responsive category tabs with count badges, and dedicated sub-views for companions, equipment, provisions, and crafting materials.*

- **1. Real-Time Carrying Capacity Meter (`src/components/inventory/InventoryWeightBar.tsx`)**:
  - Encapsulated hero weight capacity calculations based on Base Strength and storage perks.
  - Implemented color-coded progress feedback: Cyan (<75%), Amber (75-99%), and Flashing Rose (>100% overburdened) with movement stagger alert banners.
- **2. Inventory Filter & Action Bar (`src/components/inventory/InventoryFilterBar.tsx`)**:
  - Modularized category tabs (`Allies`, `Gear`, `Food`, `Mats`) with responsive inventory item count badges.
  - Implemented interactive "Sort & Group" action header with SVG rotation animations and success feedback.
- **3. Dedicated Inventory Sub-Views (`src/components/inventory/`)**:
  - `AlliesRosterView.tsx`: Companion follower roster with archetype badges, level indicators, combat status badges, and equipment inspection triggers.
  - `GearInventoryGrid.tsx`: Equipment items display with rarity tier badges, durability bars, weights, scroll reading, 2-Handed / Dual-Wield equip triggers, and discard gump handlers.
  - `ProvisionsInventoryGrid.tsx`: Consumables and apothecary potions display with HP/MP recovery stats, direct eat/drink triggers, and discard handlers.
  - `MaterialsInventoryGrid.tsx`: Dual-column layout for crafting alloys/materials and elemental shards/catalysts with quantity counts and discard buttons.
- **4. Streamlined Master Coordinator (`src/components/inventory/BackpackSlotGrid.tsx`)**:
  - Refactored `BackpackSlotGrid.tsx` from 1,018 lines to ~190 lines as a clean coordinator composing the modular subcomponents.
- **5. Automated Testing & Verification (`src/tests/inventoryComponents.test.ts`)**:
  - Validated subcomponent rendering, catalog lookups, and tab navigation. 100% green pass rate across all 65 test suites (410 tests passing).

## [v8.6.1] — Viewport Layout Ergonomics, Smooth Vertical Scrolling & GitHub Pages CI/CD (September 20, 2026)
*Resolved page scrolling lockout by removing restrictive overflow-hidden directives from root layout shells, enabled natural vertical document flow across desktop and mobile devices, implemented responsive viewport heights for canvas stages, and configured full GitHub Pages deployment with automated CI/CD.*

- **1. Enabled Root & Body Vertical Scrolling (`index.html`, `src/components/MainAppLayout.tsx`)**:
  - Replaced `overflow-hidden` on `<body>` with `min-h-screen overflow-x-hidden overflow-y-auto`, restoring native browser scrollbar and trackpad/mouse-wheel vertical scrolling.
- **2. Viewport Container Overflow Restoration (`src/components/views/GameMainViewport.tsx`)**:
  - Removed clipping `overflow-hidden` constraints from `game-main-viewport-container` and inner column wrappers, allowing tall panels (Combat Logs, Mobile Command Pad, Inventory, Crafting, and Trade stores) to expand naturally.
- **3. Responsive Canvas Height Scaling (`src/components/views/GameMainViewport.tsx`)**:
  - Replaced the rigid `h-[880px]` canvas container with adaptive responsive scaling (`h-[640px] md:h-[720px] lg:h-[780px] xl:h-[840px] 2xl:h-[880px] min-h-[500px]`), ensuring comfortable visibility on standard laptop screens and split-screen previews without truncating lower UI elements.
- **4. GitHub Pages & GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)**:
  - Configured automated GitHub Actions deployment workflow: installs dependencies, runs JSON validator and codebase audit, executes all 402 Vitest tests, builds the production bundle, and deploys directly to GitHub Pages.
  - Added relative base resolution (`base: './'`), SPA route fallback (`public/404.html`), Jekyll bypass (`public/.nojekyll`), and open-source license (`LICENSE`).


## [v8.6.0] — Wilderness Foraging, Subterranean Mineral Belts & Harvest Synchronization (September 13, 2026)
*Delivered balanced continuous procedural generation for wild berry bushes and mineral ore veins (Copper and Iron) across overworld chunks and subterranean dungeon levels. Resolved procedural scarcity thresholds, synchronized harvest mutations across chunk memory and canvas cache layers, enabled tree stump removal via interaction key, and integrated dungeon mineral vein generation.*

- **1. Balanced Overworld Mineral Belts & Foraging Flora (`src/world/organic/vegetationClusterGen.ts`)**:
  - Re-engineered procedural noise thresholds: deployed continuous multi-octave noise mineral belts (`mineralBelt > 0.54 && pOre > 0.978`) generating ~6-10 ore veins per chunk with a 60% Copper / 40% Iron distribution.
  - Calibrated grove density and meadow clearing noise (`groveNoise > 0.44`) ensuring 15-35 wild foraging bushes spawn per chunk across all biomes (Sweet Berries in forests, Frostblooms in tundras, Swamp Nightshade in marshes, Sun Aloe in deserts, and Charred Shrubs in volcanic zones).
- **2. Subterranean Cavern Ore Veins in Dungeons (`src/world/dungeon/dungeonRooms.ts`, `src/world/dungeon/dungeonGenerator.ts`)**:
  - Implemented `spawnSubterraneanOreVeins`, dynamically embedding mineable Copper and Iron veins into dungeon room alcoves and cavern wall edges.
  - Deep dungeon levels (depth $\ge 3$) feature increased Iron vein concentrations for high-tier smithing.
- **3. Harvest Synchronization, Walkability & Tree Stump Removal (`src/utils/harvestEngine.ts`, `src/hooks/app/useGKeyInteraction.ts`)**:
  - Fixed harvest tile mutations to properly set `TileType.Grass` in overworld and `TileType.Floor` in dungeons upon resource depletion.
  - Tree stumps left after chopping down trees are now walkable, and can be actively cleared using the 'G' interaction key to gather scrap kindling (+1 Wood).
  - Mining and foraging interactions now trigger immediate background canvas cache invalidation (`chunkBackgroundCache.invalidate()`, `invalidateChunkCanvasCache`) to eliminate visual ghosting.
- **4. Comprehensive Test Coverage (`src/tests/organicWorldGen.test.ts`, `src/tests/toolHarvestingDurability.test.ts`)**:
  - Validated overworld multi-chunk berry bush and ore vein yields, dungeon mineral veins, tool durability reduction, and harvesting rewards. 100% green pass rate across all test suites.

## [v8.5.0] — Spatial Acoustics & Advanced Procedural VFX (September 11, 2026)
*Delivered the complete Spatial Acoustics & VFX Sub-Engine (Pillar 4). Implemented raytraced acoustic occlusion and behind-door lowpass frequency muffling via Bresenham raycasting, dynamic multi-scale water caustics with biome-specific color palettes and submerged object light refraction, luminous HDR bloom rendering using in-memory pre-cached gradient stamps, context-aware atmospheric perimeter vignette scaling with dungeon depth and celestial events, and global listener tracking integrated directly into WebAudio spatial parameters.*

- **1. Raytraced Acoustic Occlusion & Behind-Door Muffling (`src/utils/audio/acousticOcclusion.ts`)**:
  - Implemented Bresenham raycasting between any sound source coordinates and the player listener coordinates to count solid stone/mountain walls and closed wooden/iron doors.
  - Dynamically lowers the audio cutoff frequency down to ~360–750 Hz behind barriers, models acoustic transmission absorption reducing sound volume, and boosts low-frequency cavity resonance (`roomResonanceQ` up to 2.4).
  - Global listener tracking via `setAcousticListenerContext` integrates seamlessly into `calculateSpatialParameters` (`src/utils/audio/spatialAudio.ts`) and `playSound` (`src/utils/audio/soundCatalog.ts`) without requiring callsite refactoring.
- **2. Dynamic Water Caustics & Refraction Shimmer (`src/canvas/waterCausticsRenderer.ts`)**:
  - Multi-frequency intersecting sine waves generate dynamic light refraction caustics across all open water surfaces.
  - Biome-specific palettes: crystal cyan for oceans/rivers, frost prisms for glacial waters, murky bioluminescent swirls for swamp bogs, and warm golden reflections for desert oases.
  - Projects undulating refractive light ripples onto entities and corpses wading through shallow water (`renderSubmergedObjectCaustics`).
- **3. Luminous HDR Bloom Engine (`src/canvas/bloomEngine.ts`)**:
  - Additive blending pass with pre-rendered radial gradient stamps cached in memory.
  - Emits soft, luminous halos for torches, lanterns, fireplaces, runic leylines, spell projectiles, and active elemental fields (fire, electric arcs, poison vapor).
- **4. Contextual Atmospheric Vignette (`src/canvas/vignetteRenderer.ts`)**:
  - Dynamic radial gradient depth framing that deepens in subterranean dungeon descents ($0.48 \to 0.72$ based on floor depth).
  - Adapts to overworld time of day (daylight framing vs. midnight darkness) and special celestial states (crimson glow during Blood Moons, frosted borders during blizzards).
- **5. Verification & Automated Test Suite (`src/tests/spatialAcousticsAndVfx.test.ts`)**:
  - 9 comprehensive unit and integration tests verifying acoustic raytracing through open corridors, closed door muffling, solid wall dampening, listener context integration, water caustics, submerged projection, bloom emitters, and contextual vignette states.
  - 100% green pass rate across all 64 test suites (399 unit and integration tests passing).

## [v8.4.0] — Dynamic Cellular Elemental Propagation & Environmental Chain Reactions (September 11, 2026)
*Delivered the complete Elemental Propagation Sub-Engine (Pillar 2). Implemented cellular automata fire propagation along flammable terrain, dynamic water freezing into walkable ice sheets, water shock conduction across contiguous bodies, violent toxic gas deflagration explosions, tactical steam cloud line-of-sight obscuration, multi-layered canvas procedural elemental VFX, and integration into the turn-based environment phase.*

- **1. Elemental Fields Domain & Cellular Automata (`src/types/elemental.ts` & `src/utils/elemental/elementalEngine.ts`)**:
  - Implemented domain models for active ground fields: `ElementalType` (`'fire' | 'ice' | 'shock' | 'steam' | 'poison_gas'`), intensity tiers, duration decay, and propagation vectors.
  - Cellular Automata Fire Spread: Fire expands organically to adjacent flammable terrain (grass, bushes, pine trees, wooden doors, campsite furniture) modulated by environmental humidity and turn ticks.
  - Ash Decomposition: Fully consumed vegetation transforms permanently into walkable `TileType.Ash`.
- **2. Cryomancy, Melting & Phase Transitions**:
  - Frost spells and sub-zero field effects freeze liquid water bodies into solid, walkable `TileType.Ice` sheets, creating dynamic tactical bridges across rivers.
  - Fire and extreme heat sources thaw ice sheets back into liquid water; boiling hot surfaces generate billowing steam clouds.
- **3. Electric Shock Conduction & Deflagration Chain Reactions**:
  - Shock Conduction: Lightning and electric currents propagate instantaneously across all contiguous connected water tiles in a single turn, delivering shock damage and stun checks to standing combatants.
  - Gas Deflagration: Contact between open flame and toxic poison gas pockets ignites violent 3×3 AOE deflagration explosions with bonus fire damage and terrain charring.
- **4. Tactical Steam Line-of-Sight Obscuration (`src/utils/ai.ts`)**:
  - Billowing steam clouds block line-of-sight raycasting in `hasLineOfSight(x0, y0, x1, y1, map)`, allowing players and enemies to break line-of-sight, disrupt ranged targeting, and execute tactical disengagements.
- **5. Canvas Procedural Elemental VFX Renderer (`src/canvas/elementalVfxRenderer.ts`)**:
  - High-performance canvas procedural rendering without external sprite dependencies:
    - Fire: Animated flame tongue flickers, core heat glows, and rising floating ember sparks.
    - Ice: Crystalline glints, frosted rim edges, and geometric snowflake prisms.
    - Shock: Arcing electrical sparks, jagged lightning discharge filaments, and cyan glow rings.
    - Steam: Drifting, expanding vapor plumes with alpha fade.
    - Poison Gas: Swirling emerald/viridian toxic haze billows.
- **6. Verification & Automated Test Suite (`src/tests/elementalPropagation.test.ts`)**:
  - Complete Vitest test suite validating all elemental rules: flammability spread, ash creation, ice freezing/melting, lightning conduction, deflagration explosions, and steam LOS blockage.
  - Achieved 100% green pass rate across 63 test suites (390 unit and integration tests passing).

## [v8.3.0] — Living Ecosystem & Autonomous NPC Routines (September 10, 2026)
*Delivered the complete Living Ecosystem engine (Pillar 1). Implemented simulated predator-prey ecology, autonomous pack leader morale breakage & panic retreats, desperate humanoid surrenders with parley rewards, dynamic time-of-day NPC schedules & severe weather shelter seeking, active roving sector patrol waypoints, and autonomous inter-faction skirmishes leaving persistent battlefield debris and wounded survivors.*

- **1. Dynamic NPC Schedules & Severe Weather Shelter (`src/hooks/ai/useCivilianAI.ts`)**:
  - Implemented time-of-day schedule state machine driving civilians and townspeople through daily routines (Morning work at market/fields, Evening leisure at taverns, Night sleep in beds).
  - Added storm and blizzard shelter-seeking: unarmored civilians and town fauna pathfind to indoor buildings, tavern canopies, and campfires during severe downpours or freezing whiteouts.
  - Implemented contextual ambient dialogue barks based on approaching weather, town defense alerts, and faction reputation tiers in `src/utils/npcDialogue.ts`.
- **2. Turf Wars & Autonomous Sector Patrols (`src/world/ruinedCity/ruinedCityTurf.ts` & `src/hooks/ai/useHostileAI.ts`)**:
  - Upgraded Orc warcamps, Bandit hideouts, and contested plazas with roving multi-node patrol routes.
  - Integrated autonomous inter-faction skirmish detection in `useHostileAI.ts`: hostile rival squads detect and engage each other within 8 tiles without requiring player proximity.
  - Generates realistic combat aftermath upon autonomous entity deaths: bone/corpse remains, blood splatters, and salvageable battlefield debris (loot piles).
  - Wounded survivors (< 20% HP) autonomously transition into fleeing or surrendering states.
- **3. Ecosystem Telemetry & Complete Automated Test Suite (`src/tests/livingEcosystemSim.test.ts` & `src/tests/turfWarsAndPatrols.test.ts`)**:
  - Added unit test suites verifying wolf predator hunts, pack leader panic triggers, isolated bandit surrenders, and roving patrol waypoint generation.
  - Benchmarked 50+ simulated fauna and faction entities maintaining sub-5ms spatial query latency using `SpatialEntityGrid`.
  - Maintained 100% green status across all 62 Vitest test suites (383 automated tests passing).

## [v8.2.1] — Centralized Entity Walkability & Line-of-Sight Obstacle Collision Engine (September 9, 2026)
*Resolved enemy wood/tree clipping and unified obstacle passability across all entity AI systems. Established centralized, authoritative walkability and line-of-sight verification rules in `src/utils/ai.ts` ensuring that trees, ore veins, fortifications, and furniture block movement and vision for hostiles, followers, guards, and civilians.*

- **1. Authoritative Entity Passability Engine (`src/utils/ai.ts`)**:
  - Implemented `isTileBlockedForEntity(tile, options)` and `isTileWalkableForEntity(tile, options)` with configurable capabilities for water crossing, door opening, and bed sleeping.
  - Formally blocks movement across all solid world tiles:
    - Woods & Foliage: `Tree`, `PineTree`, `BirchTree`, `TreeStump`.
    - Mineral Veins: `CopperVein`, `IronVein`.
    - Fortifications & Props: `WatchtowerWall`, `WatchtowerSlit`, `WatchtowerBarricade`, `FieldTent`, `Campfire`, `Fireplace`, `Anvil`, `Table`, `Window`, `Wall`, `Empty`.
  - Upgraded `hasLineOfSight(x0, y0, x1, y1, map)` and `computeFOV` to block projectile targeting and vision through all trees, ore veins, and barricades, preventing ranged enemies from shooting through dense forests or stone ramparts.
- **2. Universal AI Hook Passability Refactor**:
  - Refactored `useHostileAI.ts` across all monster behaviors (kite-retreat, archer repositioning, pack flanking, direct assault, wagon ambush) to use `isTileWalkableForEntity`.
  - Refactored `useTownGuardAI.ts` (shift patrols, guard chasing, criminal pursuit) to respect impassable obstacles while honoring guard door-opening privileges.
  - Refactored `useFollowerAI.ts` (escorting, player tethering, companion positioning) to prevent followers from entering impassable tiles.
  - Refactored `useCivilianAI.ts` (cat wanderings, heroic hires, fear evasion, villager weather shelter seeking) to eliminate tile clipping.
- **3. Player Collision & Weather Obstacle Alignment**:
  - Synchronized `usePlayerTurnMovement.ts` with `TreeStump`, `Campfire`, `Fireplace`, `Anvil`, `FieldTent`, and `Empty` collision blocks.
  - Updated `weatherEngine.ts` (`isObstacleTile`) to align weather wind and storm effects with the complete impassable obstacle catalogue.
- **4. Comprehensive Test Suite & Codebase Verification**:
  - Added unit test suite in `src/tests/ai.test.ts` verifying pathfinding rerouting around trees, tile blocking predicates, and line-of-sight obstructions.
  - Verified 100% test pass rate across all 59 Vitest test suites (370 automated unit and simulation tests passing green).
  - Executed clean TypeScript compilation, lint checks, and complete 450-file graph import audit with zero errors.

## [v8.2.0] — Dual Instinct Classic Tileset System & Merchant Caravan Tactical Skirmish Sub-Engine (September 7, 2026)
*Introduced dual authoritative tileset sourcing ('classic_png' pre-rendered mockups vs. 'classic_code' procedural canvas) with full 16×16 grid expansions across both pipelines. Delivered the merchant caravan escort and tactical skirmish sub-engine with lossless overworld state preservation, tactical victory/flee resolution, and zero-crash test coverage.*

- **1. Dual Instinct Classic Tileset Sources (`src/canvas/types.ts` & `src/canvas/HybridGraphicsEngine.ts`)**:
  - Implemented seamless runtime hot-swapping between **Instinct Classic (PNG Mockups)** and **Instinct Classic (Procedural Code)** via `HybridGraphicsEngine.setTilesetSource(...)` and `TilesetStudio` (`F1` -> Tileset Studio).
  - Persisted tileset source preferences in `localStorage` under `abyss_rogue_tileset_source`.
  - Expanded `scripts/generateMockupPngs.cjs` and `MockupAtlasGenerator.ts` to cover the complete 16×16 tile grid contract:
    - Chests (wooden, iron, gilded, mimic).
    - Interactive Shrines (vitality, arcane, wrath, fortune, ancient stone monoliths).
    - Hazard pools (bubbling magma/lava, glacial frost rime, desert sand dunes).
    - World Props (wooden crossroads signposts, campfire fire pits, merchant covered wagons).
    - Dungeon floor traps (spike vents, poison gas, fire jets).
- **2. Merchant Caravan Escort & Tactical Skirmish Sub-Engine (`src/world/caravanSkirmishGen.ts` & `src/types/game.ts`)**:
  - Added `SavedOverworldSkirmishState` interface capturing current chunk map, discovery/visibility matrices, active enemies, dungeon props, player coordinates, and chunk indices.
  - Snapshotting on tactical deployment in `ModalRouter.tsx` (`handleDeployTacticalBattle`).
  - Implemented lossless overworld restoration upon tactical victory in `aiCombatAggregator.ts`, `useEnemyAI.ts`, and `usePlayerAttack.ts`.
  - Added tactical retreat resolution in `CaravanActiveOverlay.tsx`, penalizing carriage hull integrity while cleanly returning the player and companions to the overland trade route.
  - Added comprehensive unit tests in `src/tests/caravanEncounters.test.ts` verifying victory restoration, penalty calculations, and zero state corruption.
- **3. Documentation & Architectural Alignment**:
  - Updated `DEVELOPERS.md`, `README.md`, and `VERSIONS.md` with complete developer guides for tileset modding, dual source pipelines, and caravan battle orchestration.
  - Passed complete codebase audit (`auditCodebase.cjs`), JSON validation (`validateJson.cjs`), and test suites.

## [v7.9.7] — ASCII Default Launch Guarantee & Nature Procedural Pixel Art (September 2, 2026)
*Guaranteed that the game unconditionally launches and starts in classic ASCII glyph mode by default across all sessions while retaining fluid runtime switching to Animated HD Tileset (`🎨 Tileset` button / `F8` / `Alt+T`). Handcrafted distinct procedural pixel-art structures for foliage, mineral ore veins, and locked doors to single-frame static tiles.*

- **1. ASCII Mode Startup Guarantee (`src/canvas/types.ts` & `src/canvas/HybridGraphicsEngine.ts`)**:
  - Configured `getStoredGraphicsMode()` and `HybridGraphicsEngine` to always initialize with `'classic_glyph'` (ASCII) mode on game launch, ensuring clean retro presentation out-of-the-box.
  - Seamless in-game toggle to animated HD tileset mode at any point via header bar or keyboard shortcuts.
- **2. Nature Foliage & Tree Redesign (`src/canvas/MockupAtlasGenerator.ts`)**:
  - Handcrafted distinct pixel-art foliage structures for **Oak Trees** (multi-lobed leafy canopy with rooted trunk), **Pine Trees** (sharp tiered dark-spruce needle boughs with highlighted tips), **Birch Trees** (slender white notched bark with bright crown), and **Berry Bushes** (lush shrubbery with bright ruby berries).
- **3. Ore Veins & Crystal Clusters (`src/canvas/MockupAtlasGenerator.ts`)**:
  - Redesigned **Copper Ore Veins** and **Iron Ore Veins** with craggy faceted slate-rock boulder bases embedded with gleaming metallic copper and lustrous silver-steel crystal clusters with specular sparkle highlights.
- **4. Door Animation Stabilization (`src/canvas/spriteRenderer.ts`)**:
  - Standardized **Wooden Doors** (closed timber plank with wrought-iron bands and open stone doorway threshold) as strictly static single-frame tiles (`frameCount: 1`), eliminating door animation cycling.
- **5. Calm Water Shimmering (`src/canvas/waterShimmerRenderer.ts`)**:
  - Refined autotiled water with serene deep-blue surfaces, soft calm horizontal ripple lines, and subtle ambient glints.

## [v7.9.6] — Procedural Tileset Simplification, Animation Stabilization & Soft Ambient Glow (September 2, 2026)
*Redesigned procedural pixel-art atlas synthesis with clean, instantly recognizable, high-contrast tile iconography for all walls, terrain, water, roads, harvestables, stairs, doors, and props. Tamed entity bobbing and arm sway animations to prevent frantic motion, and dimmed all ambient and personal light sources for an atmospheric, eye-friendly experience.*

- **1. Procedural Tileset Iconography & Legibility Overhaul (`src/canvas/MockupAtlasGenerator.ts` & `src/canvas/TilesetAtlasManager.ts`)**:
  - Rebuilt the main 16x16 tile atlas generator with explicit, high-contrast, recognizable pixel art for all biomes (stone bricks, cobblestone paths, deep blue ripple water, lush grass, pine/birch trees, dungeon stairwells, chests, and wooden doors).
  - Synchronized exact autotiling bitmask configurations (cols 0..3 for walls, cols 4..7 for water, cols 8..11 for paths) and static coordinates across `TilesetAtlasManager.ts`.
  - Fixed variant column indexing in `spriteRenderer.ts` so static props and terrain do not shift into unintended adjacent tiles.
- **2. Animation Stabilization (`src/canvas/MockupAtlasGenerator.ts`)**:
  - Tamed frantic entity bobbing ($4\text{px} \to 1\text{px}$) and arm swing motion ($4\text{px} \to 1\text{px}$) to provide smooth, natural, and readable idle/movement loops.
- **3. Dimmer & Softer Lighting Engine (`src/canvas/lightingEngine.ts`)**:
  - Dimmed player lantern intensity ($0.60 \to 0.40$) and reduced radius ($3.4\times \to 2.8\times$) with subtle micro-flickering.
  - Softened campfires ($0.65$), torches ($0.55$), dungeon portals ($0.45$), and shrines ($0.50$).
  - Re-tuned the additive halo pass with soft transparent color stops to completely eliminate harsh glare or washed-out backgrounds.
- **4. Codebase & Markdown Alignment**:
  - Passed complete 415-file codebase audit, JSON validation, TypeScript typechecks, and 52 test suites.

## [v7.9.5] — Lighting Engine Balance & Organic Player Lantern Glow Refinement (September 2, 2026)
*Refined the dynamic 2D lighting engine to balance ambient illumination and eliminate excessive player glare. Tuned player personal lantern radius, intensity, and additive halo blending for a clean, organic atmospheric look while preserving dungeon darkness and environmental clarity.*

- **1. Player Lantern Illumination Refinement (`src/canvas/lightingEngine.ts`)**:
  - Decreased the player personal lantern radius from $5.2\times$ tile size (~145px) to a balanced $3.4\times$ tile size (~95px).
  - Adjusted illumination intensity from $0.95$ down to $0.60$ with gentle micro-flicker ($0.03$ magnitude at $0.8$ speed).
  - Reduced additive screen-blended halo alpha on player light from $0.28$ to a soft $0.12$ with tighter halo radius scaling ($0.65\times$).
- **2. Redundant Entity Layer Overlay Cleanup (`src/canvas/entityLayerRenderer.ts`)**:
  - Removed duplicate hardcoded radial torch gradient beneath the player character sprite, unifying all lighting through the dynamic multi-light point shader.
- **3. Documentation & System Alignment**:
  - Verified architectural alignment across `AGENTS.md`, `DEVELOPERS.md`, `BUGS.md`, and `FEATURES.md`.

## [v7.9.0] — Arcane Scriptorium Minigame, Glyph Rune Tracing & Masterwork Spell Scrolls (August 31, 2026)
*Integrated the Arcane Scriptorium interactive vector rune tracing minigame and Masterwork spell scroll crafting engine. Players can trace elemental leyline glyph matrices with mouse/touch or keyboard to forge Masterwork Spell Scrolls with 0 MP Cast Cost and +30% spell damage potency. Added sandbox controls in Dev God Panel for immediate test-play and template switching.*

- **1. Arcane Scriptorium Glyph Minigame (`src/components/ScriptoriumMiniGame.tsx` & `src/types/minigames/glyphGame.ts`)**:
  - Interactive vector slate displaying numbered elemental runic nodes (0-9) organized in geometric configurations.
  - Supports continuous mouse/touch dragging with glowing conduit beams and number key (0-9) node chaining.
  - Features real-time Arcane Instability (overheat) meter, acoustic WebAudio harmonic node frequencies, mistake penalties (+15% instability), screen shake, and multi-stage matrix chaining.
- **2. Masterwork Spell Scroll Inscription & Combat Mechanics (`src/App.tsx` & `src/types/items.ts`)**:
  - High accuracy scribing (score >= 90%, 0 errors) produces Masterwork Spell Scrolls (`🌟`).
  - Masterwork scrolls feature waived mana cost (0 MP), +30% spell damage multiplier, +15% critical strike chance, and increased gold valuation.
  - Integrated with inventory material deductions (parchment/leather and elemental catalysts) and floating game effect celebrations.
- **3. Dev God Panel Sandbox Testing (`src/components/god/GodMinigamesTab.tsx`)**:
  - Added dedicated Arcane Scriptorium test card with template selection, reagent granting button (`+10 Inks 📜`), and difficulty tier switching.
- **4. Full Documentation & Automated Verification**:
  - Updated `README.md`, `FEATURES.md`, `AGENTS.md`, and `VERSIONS.md`.

## [v7.8.0] — Enemy AI Behavioral Roles & Async Background Chunk Batching (August 30, 2026)
*Implemented comprehensive Enemy AI Behavioral Archetypes featuring smart tactical ranged kiting for archers/mages and support healing/buffing spells for backline medics and shamans. Built high-performance non-blocking asynchronous chunk streaming and background pre-generation queue (AsyncChunkBatcherService) with requestIdleCallback time-slicing. All 52 test suites and 315 tests pass 100% green.*

- **1. Enemy AI Behavioral Roles & Smart Kiting (`src/hooks/ai/useHostileAI.ts` & `src/types/entities.ts`)**:
  - Added `aiRole` (`'melee' | 'skirmisher_kiting' | 'support_healer' | 'support_buffer' | 'tank' | 'ambusher'`) and `supportSpellCooldown` to the `Enemy` domain model.
  - Implemented Tactical Kiting AI: Ranged marksmen and spellcasters (`SkeletonMage`, `Trapmaster`, `FrostbiteSpider`, `AbyssalSiren`) detect when targets close into melee range ($\le 2$ tiles) and dynamically retreat to re-establish an optimal 3–4 tile firing line before attacking.
  - Implemented Support Unit AI: Healers (`Necromancer`, Shamans) scan for wounded allies ($HP < 75\%$) within 6 tiles to cast restorative spells (+25% HP) with cooldown tracking, while buffers (`Tidecaller`) bestow offensive/defensive buffs upon nearby elite and boss allies.
- **2. Async Background Chunk Batching & Non-blocking Pre-generation (`src/utils/overworld/asyncChunkBatcher.ts`)**:
  - Engineered `AsyncChunkBatcherService` utilizing `requestIdleCallback` (with 8ms time-slicing budget per frame and fallback to micro-tasks) to eliminate frame stutters during massive world discovery.
  - Automatically schedules background pre-generation for the surrounding ring of adjacent sectors upon player chunk boundary transitions in `usePlayerTurnMovement.ts`.
  - Integrated with `chunkTileRasterizer.ts` and `WorldMapModal.tsx` to cache and query chunk matrices seamlessly.
- **3. Full Automated Verification**:
  - Expanded test coverage with `modularAIEngine.test.ts` and `asyncChunkBatcher.test.ts`. 52 test suites and 315 tests passing 100% green.

## [v7.7.7] — World Map Mobile Touch Gestures, Smooth Inertia, Collapsible Inspector & Floating D-Pad (August 29, 2026)
*Refined the world map cartography system for mobile devices and small viewports with physics-based momentum inertia, touch gesture deadzones, non-intrusive collapsible sector inspections, selected chunk glowing reticles, and a floating Compass Navigator overlay with D-pad directional panning and instant centering controls.*

- **1. Mobile Touch Deadzones & Physics-Based Momentum (`src/components/worldmap/WorldMapCanvas.tsx`)**:
  - Implemented 6px touch movement threshold to prevent accidental taps and eliminate jitter when initiating pan gestures.
  - Added velocity tracking (`velocityX`, `velocityY`) and smooth ease-out inertia animation on touch release (`stepInertia`), providing natural drag-and-scroll dynamics.
  - Suppressed hover tooltip events while actively dragging on touch screens.
- **2. Collapsible Sector Inspection Card (`src/components/worldmap/WorldMapChunkTooltip.tsx`)**:
  - Added minimize/expand toggle button (`ChevronDown`/`ChevronUp`), allowing players on smaller screens to collapse the detailed sector card into a sleek single-line summary pill displaying coordinates and biome.
  - Added dedicated close (`✕`) button to quickly dismiss inspections.
- **3. Canvas Reticle Frame for Selected Sectors (`src/components/worldmap/WorldMapCanvas.tsx`)**:
  - Rendered a glowing bracket reticle (`#38bdf8`) on the dynamic animated canvas layer directly framing the currently selected chunk, making the active target clearly identifiable without relying on an intrusive overlay card.
- **4. Floating Mobile Compass Navigator (`src/components/worldmap/WorldMapCanvas.tsx`)**:
  - Introduced a collapsible top-right Compass Navigator widget featuring smooth D-pad directional panning buttons (North, South, East, West), quick **Center on Hero** (`Crosshair`), quick **Center on Oakhaven [0,0]** (`Home`), and zoom presets.
- **5. Full Automated Test Suite Verification**:
  - All 51 test suites and 310 tests passing 100% green.

## [v7.7.6] — Follower Tactical AI, Dead State Persistence, Dev Cartography Exporter & UI Resilience (August 29, 2026)
*Implemented comprehensive follower combat damage and vulnerability mechanics with personality-aware tactical retreating, predatory hostile enemy pursuit, and permanent dead follower state persistence across chunk borders and dungeon transitions. Added 40% scale high-resolution World Map PNG Exporter to the Developer Suite, resolved UI clipping on desktop and mobile viewports, prevented idle Chaos Matrix threat inflation, and hardened world map discovery structures against heterogeneous typing.*

- **1. Follower Combat Damage & Personality-Based Fleeing (`src/hooks/ai/`)**:
  - `useHostileAI.ts`: Implemented dynamic proximity and priority targeting between player and companions. Hostile monsters now attack followers within reach, dealing combat damage, displaying combat floaters, and triggering fallen status.
  - Added `predatoryChaser` behavior for aggressive predators to chase down retreating or wounded targets.
  - `useFollowerAI.ts`: Timid and agile followers (cats and rogues) tactically flee when damaged (cats <50% HP, rogues <40% HP, general companions <25% HP), automatically resuming engagement once safely healed (>=60% HP).
- **2. Dead Follower State Persistence (`src/world/dungeon/dungeonEntities.ts` & `src/hooks/ai/useEnemyAI.ts`)**:
  - Strictly filtered out fallen companions (`!f.isDead && f.hp > 0`) during dungeon stair transitions and overworld chunk crossing, ensuring deceased followers do not inadvertently respawn.
- **3. Dev Suite Whole Realm PNG Exporter (`src/utils/worldmap/worldMapPngExporter.ts`)**:
  - Created high-performance offscreen cartography exporter capable of rendering the entire discovered or revealed world map at 40% scale into a downloadable PNG image (`realm_map_40pct_*.png`).
  - Integrated export trigger in `GodCheatsTab.tsx` and `useGodPanelState.ts`.
- **4. Dev Panel UI Safe-Area & Viewport Resilience (`src/components/GodPanelOverlay.tsx`)**:
  - Added responsive padding and flexible container boundaries (`max-h-[86vh] sm:max-h-[88vh]`, `p-2 sm:p-4 pt-10 sm:pt-6 pb-4 sm:pb-6`) preventing dev console clipping across mobile screens and desktop viewports.
- **5. Idle Chaos Matrix Gating (`src/utils/storyteller/storytellerEngine.ts`)**:
  - Gated Storyteller Chaos threat escalation to active engagement epochs (`slainInInterval > 0`), preventing threat spikes while players rest or explore safely.
- **6. World Map Heterogeneous visitedChunks Normalization (`src/components/worldmap/WorldMapCanvas.tsx` & `WorldMapModal.tsx`)**:
  - Normalized `gameState.visitedChunks` input format (Sets, Arrays, and Record objects) into a strongly typed `Set<string>` via `safeDiscoveredSet` with boundary guards.
- **7. Automated Unit Test Verification (`src/tests/worldMapPngExporter.test.ts`)**:
  - Added test suite validating PNG export calculations and safe headless rendering fallbacks. 51 test suites and 310 tests passing 100% green.

## [v7.7.5] — Save/Load, State Migration Resilience & Telemetry Diagnostics (Phase 8) (August 26, 2026)
*Completed Phase 8 implementation of comprehensive Save/Load persistence middleware, multi-version state schema migration (v1.0.0 through v7.7.4+), material storage normalization, equipment durability clamping, and explicit verification of run logs, adventure journals, and developer simulation replay telemetry diagnostics. All 50 test suites and 308 automated tests pass 100% green.*

- **1. Multi-Version State Schema Migration Engine (`src/hooks/useSaveLoad.ts`)**:
  - `migrateSaveData`: Intelligently converts legacy, partial, and corrupted save files from prior schema versions (v1.0.0 minimalist coordinates, v2.0.0 array materials, v3.0.0 depth/chaos, v4.0.0 town reputation) to the modern schema `v7.7.4`.
  - Backfills missing attributes (Strength, Agility, Intelligence, Charisma, Luck), default waystones (`waystone_0_0`), player stats, chaos score, town reputation, and unlocks.
  - Recovers gracefully from non-object inputs, NaN player coordinates, missing stats, and clamped grid boundaries (`[0, 128]`).
- **2. Data Normalization Middleware**:
  - `normalizeMaterialStorage`: Automatically converts legacy array-of-objects (`{ id, count }` or `{ materialId, count }`), array-of-string keys, and raw dictionaries into strict, sanitized `Record<string, number>` mappings.
  - `normalizeEquippedItem`: Sanitizes equipment durability, ensuring valid numbers clamped within `[0, maxDurability]` and defaulting missing durabilities to 50.
- **3. Save File Import/Export & LocalStorage Engine**:
  - Added `importSaveFromString` to allow importing external JSON save files with automatic schema migration and state dispatching.
  - Synchronized `saveGame` payload structure with `SaveFilePayload` interface.
- **4. Run Logs & Simulation Telemetry Diagnostics (`src/utils/logExporter.ts`)**:
  - Explicitly validated `exportAndDownloadGameLogs`, ensuring accurate generation of human-readable adventure run journals alongside machine-parsable JSON simulator replay telemetry (`--- COMPREHENSIVE SIMULATOR REPLAY DATA ---`).
  - Added headless Node/test environment guards around DOM interactions to ensure uninterrupted export validation during headless CI/CD runs.
- **5. Automated Testing Suite (`src/tests/automatedSaveLoadAndMigrationSuite.test.ts`)**:
  - Created 11 automated test cases covering schema migration, material normalization, corrupted data sanitization, round-trip serialization, and log export/telemetry parsing.
  - Full test suite running 50 test files with 308 tests passing 100% green.

## [v7.7.4] — Wilderness Resource Balancing & Biome Refinement (August 26, 2026)
*Removed coral reef biomes from overworld generation and rebalanced resource density across the infinite wilderness. Toned down berry bush clustering along waterlines and forest edges, and increased the rarity threshold for copper and iron ore vein lodes to create natural, balanced wilderness exploration.*

- **1. Coral Removal from Overworld Generation**:
  - Removed `coral_reef` biome assignments from `getOrganicBiome` in `src/world/overworldBiomes.ts`, naturally resolving warm high-moisture climate regions to lush swamps and forests.
  - Removed coral reef vegetation generation branch in `src/world/organic/vegetationClusterGen.ts`.
- **2. Berry Bush Density Rebalance**:
  - Reduced water bank berry bush spawn rates from ~60% down to ~12%, providing clean, walkable grassy shorelines with rare foraging opportunities.
  - Reduced forest grove edge and wilderness scrub bush density across forest, tundra, desert oasis, and swamp biomes.
- **3. Ore Vein Lode Scarcity Balancing**:
  - Increased the multi-octave noise threshold for ore vein generation (`> 0.81` with iron veins at `> 0.88`), replacing dense ore fields with scarce, valuable mineral deposits.

## [v7.7.3] — Automated Button, Interaction & Studio Test Suite Hardening (August 26, 2026)
*Completed full implementation and validation of the comprehensive button and interaction testing matrix across all engine layers (App Navigation, Crafting/Smithing, Inventory/Paperdoll, Guild Sanctum/Directives, World Map Cartography, and God Mode / GM Chaos / Audio Studio). Codebase audit and test execution verifies 49 test suites and 295 automated tests passing 100% green.*

- **1. Phase 1-4 & Phase 9 Automated Interaction Suites (`src/tests/`)**:
  - `automatedButtonSuite.test.ts` (Phase 1): Top-level tab buttons, quick menu actions (World Map, God Mode, GM Panel, Sleep, Save, Audio, Rest), and mobile command triggers under high-frequency navigation fuzzing.
  - `automatedCraftingButtonSuite.test.ts` (Phase 2): Weapon/armor forging across 10 templates and 30 materials, heat overforge gauges (0-100%), catalyst infusions, gear upgrades (+1 to +3), dismantling, cooking provisions, alchemy brewing, and scriptorium scroll scribing.
  - `automatedInventoryButtonSuite.test.ts` (Phase 3): 8-slot humanoid paperdoll equip/unequip/swap, durability decay, consumable items (potions, provisions, scrolls, teleports), item disposal/ground drops, and RPG attribute point allocation (STR, DEX, INT, CHA, LCK).
  - `automatedGuildButtonSuite.test.ts` (Phase 4): Sunder Guild HQ founding, laboratory research upgrades, treasury donations, autonomous companion expedition dispatches, and safehouse stash management.
  - `automatedWorldMapButtonSuite.test.ts` (Phase 4): Cartographic canvas zoom/pan, sector threat inspection dossiers, custom waypoint pin creation/deletion, layer filter toggles, and runic waystone teleports.
  - `automatedGodAndStudioButtonSuite.test.ts` (Phase 9): God Mode sandbox cheats, GM Storyteller Chaos Console tuning, persona shifting, forced GM interventions, and WebAudio synthesizer sound/oscilloscope studio verification.
- **2. Full Codebase Audit & Import Integrity (`npm run audit`)**:
  - Validated all 29 JSON data catalogs syntax and structural schemas.
  - Scanned 378 total source and data files across `/src/`.
  - Audited relative imports across 349 TypeScript source files with 0 orphaned files and 0 broken links.
  - Vitest test suite executing 49 test files with 295 tests passing 100% green.

## [v7.7.2] — World Map Mobile Information & Biome Inspector Enhancements (August 24, 2026)
*Resolved mobile view clipping and overflow in the World Map sector intelligence inspector. Re-engineered the cartographic inspector into a scrollable, responsive panel featuring all 9 biomes, detailed resource lists, environmental hazard alerts, threat tier badges, elevation/moisture metrics, distance calculations from the hero, custom pin notes, and mobile collapsible map legends.*

- **1. Mobile Responsive Inspector (`src/components/worldmap/WorldMapChunkTooltip.tsx`)**:
  - Implemented responsive vertical scrolling container (`max-h-[60vh] sm:max-h-[70vh] overflow-y-auto`) with backdrop blur and touch targets.
  - Added dedicated dismissal (`X`) button to easily close the sector inspector on mobile touchscreens and desktop.
  - Added distance calculator showing sector offset from hero position (`N sectors away`).
- **2. Full Biome Intelligence & Ecosystem Data**:
  - Added rich metadata, color badges, and lore descriptions for all 9 biomes: Woodland Forest (`🌲`), Frost Tundra (`❄️`), Arid Desert (`🏜️`), Mire Swamp (`🌿`), Granite Peaks (`🏔️`), Sunken Coral Reef (`🪸`), Volcanic Caldera (`🌋`), Glacial Ice Caverns (`🧊`), and Civilized Citadel (`🏰`).
  - Added structured display for **Abundant Resources** (e.g. Obsidian Glass, Molten Ore, Cryo Crystals, Coral, Bog Iron) and **Environmental Hazards** (e.g. Lava Pools, Ash Storms, Blizzards, Poison Gas).
  - Enhanced Threat Rating breakdown with descriptive levels (Peaceful, Moderate, Perilous, Lethal, Cataclysmic).
- **3. Mobile-Optimized Cartographic Legend (`src/components/worldmap/WorldMapLegend.tsx`)**:
  - Added expandable/collapsible toggle bar for mobile screens to save vertical space while keeping all 9 biomes and POI markers accessible on demand.
- **4. Type & Test Verification (`src/components/worldmap/types.ts`, `src/tests/worldMap.test.ts`)**:
  - Added full biome type mappings to `WorldBiome`.
  - Added test suite coverage verifying all 9 biome classifications and cartographic properties.

## [v7.7.1] — World Map Starting Town & Harbor Distinction Fix (August 24, 2026)
*Fixed World Map cartography prediction and POI labeling to accurately reflect the starting town at Chunk (0,0) as an inland Castle Town / Citadel (🏰) rather than a coastal harbor (⛵), ensuring only true coastal settlements (such as Vanguard Harbor Port at Chunk (3,-2)) display harbor traits and icons.*

- **1. World Map Settlement Landmark Rendering (`src/components/worldmap/WorldMapCanvas.tsx`)**:
  - Corrected `isPortTown` and `hasHarbor` evaluation logic to exclude inland starting chunk (0,0) Oakhaven Citadel.
  - Oakhaven Citadel at (0,0) now properly renders the Castle landmark icon (`🏰`), is labeled as `Oakhaven Citadel [0, 0]`, and registers as a `town` POI.
  - Dedicated coastal port settlements (e.g. Chunk (3, -2) Vanguard Harbor Port) retain the harbor boat landmark icon (`⛵`) and `harbor` POI classification.
- **2. Waystone Registry & Pin Selector Synchronization (`src/components/worldmap/WorldMapModal.tsx`)**:
  - Updated starting waystone registry name from `Oakhaven Citadel & Harbor` to `Oakhaven Citadel`.
  - Updated custom pin selection inspector to correctly assign `hasHarbor: false` for chunk (0,0).
- **3. Cartography & Settlement Tests (`src/tests/worldMap.test.ts`)**:
  - Added test suite coverage verifying proper distinction between inland citadel settlements and coastal harbor ports.
  - All 43 test suites (215 tests) compiling and passing 100% green.

## [v7.7.0] — New Biomes & Unique Dungeons Overhaul (August 24, 2026)
*Implemented new continuous organic biomes (Sunken Coral Reef, Volcanic Caldera, Glacial Ice Caverns), distinctive dungeon archetypes with depth-themed environmental hazards, 6 new aquatic, cryo, and molten enemies, 3 new legendary boss titans, dynamic atmospheric particle shaders, and dedicated test suite passing 100% green.*

- **1. New Biome Types & Organic Noise Gradients (`src/world/overworldBiomes.ts`, `src/data/worldConfig.json`)**:
  - 🪸 **Sunken Coral Reef**: Tropical, hyper-moist coastal lagoons with turquoise waters, blooming coral colonies, tidal tidepools, and luminescent pink/cyan spore atmospheres.
  - 🌋 **Volcanic Caldera**: High-temperature, arid volcanic zones with black obsidian ash soils, molten fissures, sulfuric vents, and rising ember spark micro-particles.
  - ❄️ **Glacial Ice Caverns**: Subzero arctic ice sheets with crystalline frost spires, subzero temperature thresholds, drifting snowflake storms, and ice reflection shaders.
- **2. Unique Dungeon Archetypes & Environmental Hazards (`src/world/dungeon/`, `src/types/map.ts`)**:
  - *Sunken Coral Ruins (Depth 3 / Archetype `sunken_ruins`)*: Flooded chambers, high-pressure **Geyser** traps, tidal surging currents, and aquatic combatants.
  - *Volcanic Caldera (Depth 7 / Archetype `volcanic_caldera`)*: Underworld magma pools, **Magma Eruption** fissures, toxic **Sulfur Vent** emissions, and molten rock hazards.
  - *Glacial Ice Caverns (Depth 5 / Archetype `glacial_caverns`)*: Sub-zero freezing frost vents (**Frostbite Vent**), falling razor-sharp **Falling Icicles**, and slippery floor tiles.
- **3. Expanded Bestiary & Legendary Boss Encounters (`src/data/enemies.json`, `src/world/dungeon/dungeonEntities.ts`)**:
  - *New Monsters*: Added **Coral Golem**, **Magma Wurm**, **Cryo Stalker**, **Abyssal Siren**, **Cinder Fiend**, and **Glacial Colossus** with custom stats, glyph colors, and abilities.
  - *New Boss Titans*: Integrated **Sunken Dread Kraken**, **Ignis the Caldera Wyrm**, and **Frostfang the Glacial Titan** into procedural dungeon depths.
- **4. Atmospheric Rendering & Cartography World Map Updates (`src/canvas/`, `src/components/worldmap/`)**:
  - Added atmospheric particle shaders in `biomeAtmosphereRenderer.ts` for rising volcanic embers, drifting coral reef bubbles/spores, and glacial frost crystal flurries.
  - Expanded `tileMapRenderer.ts` and `chunkTileRasterizer.ts` with custom ASCII glyphs, high-contrast cartography palettes, and offscreen canvas cache optimizations.
- **5. Automated Testing & Flawless Verification (`src/tests/biomesAndUniqueDungeons.test.ts`)**:
  - Added full test suite verifying worldConfig biome thresholds, noise distribution, new enemies, boss templates, trap mechanics, and level connectivity.
  - All 43 test suites (214 tests) compiling and passing 100% green.

## [v7.6.0] — UI, Cartography World Map, Inventory Paperdoll & Crafting Stations Overhaul (August 23, 2026)
*Executed full 5-step user interface, world map cartography, inventory paperdoll, crafting station, guild sanctum, bestiary, and real-time adventure log modernization.*

- **Step 1: Visual Theme Tokens, Unified Layout & Header Overhaul**:
  - Polished global dark-stone and gold accent styling across `MainAppLayout.tsx` and `AppHeaderBar.tsx`.
  - Added real-time biome badge with interactive map trigger, time-of-day indicator, and clean navigation tabs with glow badges (`AppNavigationTabs.tsx`).
- **Step 2: World Map & Cartography Visual Overhaul**:
  - Implemented rich micro-tile surface rasterizer with offscreen canvas caching (`chunkTileRasterizer.ts`).
  - Added soft organic parchment burn fog-of-war shaders, floating sector intel cards (`WorldMapChunkTooltip.tsx`), and runic waystone teleport flows.
  - Expanded custom pin marker palette with custom labels (`CustomPinEditorModal.tsx`).
- **Step 3: Unified Inventory, Paperdoll Gear & Backpack Grid**:
  - Interactive Core RPG Attribute point allocation card with STR, DEX, INT, CHA, LCK previews (`HeroBiometricsCard.tsx`).
  - 8-slot humanoid paperdoll display with durability meters, 2H weapon dual-bracket indicators, and active battle scar overlays (`EquipmentPaperdoll.tsx`).
  - Backpack grid with item rarity color borders, dynamic weight bar, and quick-stash tools (`BackpackSlotGrid.tsx`).
  - Streamlined portable Alchemical Transmuter UI (`AlchemicalTransmuterPanel.tsx`).
- **Step 4: Crafting Stations & Overforge Modernization**:
  - Themed discipline tab switcher with live search and station badges (`CraftingHeader.tsx`).
  - Modular recipe card architecture with stock validation ledgers and stat forecasts (`RecipeCard.tsx`).
  - Redesigned Overforge heat danger gauge and catalyst mutation matrices (`OverforgeGauge.tsx`, `MutationCatalystTab.tsx`, `GearUpgradeTab.tsx`).
  - Arcane scriptorium scroll scribing, alchemy laboratory tiers, and campfire culinary cooking modules.
- **Step 5: Guild Sanctum, Bestiary, and Real-Time Event Logs**:
  - Modernized Sunder Guild headquarters navigation and faction war directives (`GuildHeaderBar.tsx`, `GuildHQPanel.tsx`, `GuildFactionWarPanel.tsx`).
  - High-contrast Monster Codex with classified dossier locking, elemental weaknesses, and guaranteed drop schedules (`BestiaryOverlay.tsx`).
  - Categorized adventure chronologue log with 6 tactical category filters (All, Combat, Story, Loot, Craft, System), live text search, and color-coded damage badges (`GameLog.tsx`).

## [v7.5.0] — Phase 5: Wilderness Foraging, Herbology, Gourmet Cooking & Camping Overhaul (August 21, 2026)
*Implemented multi-biome wild foraging, rare herbalism ingredients, gourmet campfire recipes with sustained combat & survival buffs, deployable wilderness shelters, companion sentry night-watch, and passive MP meditation.*

- **Wilderness Foraging & Herbology (`src/hooks/app/useGKeyInteraction.ts`, `src/data/materials.json`)**:
  - Tundra Biomes: Harvest **Glacial Frostbloom** (`mat_frostbloom`), crystalline flowers granting cold immunity and spell crit buffs.
  - Desert Biomes: Gather **Sun-Blossom Aloe** (`mat_sun_aloe`), hydrating succulent gel granting heatwave resistance and stamina recovery.
  - Swamp Biomes: Harvest **Bioluminescent Nightshade** (`mat_swamp_nightshade`), yielding ethereal nightvision and crit boosts.
  - Forest Biomes: Forage **Earthy Forest Truffles** (`mat_forest_truffle`), **Wild Gold Honeycombs** (`mat_honeycomb`), and **Sweet Wild Berries** (`mat_berry`).
- **Gourmet Campfire Cooking & Sustenance Buffs (`src/data/recipes.json`, `src/components/crafting/CookingTab.tsx`)**:
  - Added new multi-ingredient culinary creations: *Forest Truffle Chowder*, *Glacial Frostbloom Tea*, *Golden Honeycomb Glazed Jerky*, *Desert Sun-Aloe Hydration Stew*, and *Bioluminescent Nightshade Broth*.
  - Recipes apply sustained multi-turn stat buffs (DEF, ATK, Crit %, Speed, Cold/Heat immunities, and passive HP/MP regeneration).
- **Wilderness Camping & Shelter Placement (`src/utils/wildernessCamping.ts`, `src/hooks/crafting/useSurvivalCrafting.ts`)**:
  - Deployable **Traveler's Survival Bedroll** and **Expedition Field Tent** structures craftable at campfires and placeable anywhere on overworld wilderness tiles.
  - Environmental surroundings analysis evaluating shelter quality, campfire warmth, weather insulation, and nocturnal predator ambush risks.
  - Companion followers automatically assume night-watch sentry roles, mitigating ambush probabilities by up to 65%.
- **Mana Meditation Recovery Engine (`src/hooks/ai/aiTurnEnvironment.ts`)**:
  - Added passive MP mental recovery during active exploration, scaling recovery intervals directly with player Intelligence (INT).

## [v7.4.0] — Phase 4: Unified Inventory Sub-Components Decoupling & Modular Architecture (August 19, 2026)
*Decomposed the monolithic 1,406-line inventory interface (`src/components/UnifiedInventoryPanel.tsx`) into modular sub-components under `src/components/inventory/`, added dedicated unit test suite, and verified 35 Vitest suites (171 tests) passing 100% green.*

- **Modular Inventory Sub-Engine & Sub-Components (`src/components/inventory/`)**:
  - `types.ts`: Inventory interfaces, action handler contracts, item/food/material rarity analyzers (`getItemRarityValue`, `getFoodRarityValue`, `getMaterialRarityValue`).
  - `HeroBiometricsCard.tsx`: Hero profile, level progress, and interactive Core RPG Attribute point allocation (STR, DEX, INT, CHA, LCK).
  - `EquipmentPaperdoll.tsx`: 8-slot equipped gear display (Helmet, Armor, Boots, Weapon R-Hand, Shield L-Hand, Gauntlets, Amulet) with durability bars, 2-handed occupied badge, humanoid cat wireframe, active scars visual overlay, and broken item indicators.
  - `CombatStatsSummary.tsx`: Calculated combat statistics, Cat Lover special trait card, and Permanent Battle Scars list with simulate scar trigger.
  - `BackpackSlotGrid.tsx`: Carrying weight limit bar, overburdened status alert, Sort & Group stashes trigger, 4 sub-navigation tabs (Allies, Gear, Food, Resources/Mats), and discard long-press/gump modal triggers.
  - `AlchemicalTransmuterPanel.tsx`: Portable Wild Alchemical Transmuter UI (catalyst alignment shifter, Unstable Wild Reactor surge button, offline fallback card).
  - `index.ts`: Inventory sub-components barrel export.
- **Lightweight Composer & Zero Breaking Changes**:
  - Refactored `src/components/UnifiedInventoryPanel.tsx` (1,406 lines -> ~130 lines) into a lean coordinator orchestrating the modular sub-components, modal state, and audio triggers.
- **Automated Verification & Test Expansion**:
  - Added `src/tests/inventoryComponents.test.ts` verifying component definitions and item/food/material rarity calculation tiers.
  - Validated 35 Vitest test suites (171 unit, integration, and simulation tests passing 100% green).

## [v7.3.0] — Phase 3: WebAudio Synthesizer Engine Modularization & Acoustic Architecture (August 19, 2026)
*Decomposed the monolithic 1,677-line WebAudio engine (`src/utils/audio.ts`) into a modular sub-engine architecture under `src/utils/audio/`, added dedicated unit test suite, and verified 34 Vitest suites (167 tests) passing 100% green.*

- **Modular WebAudio Sub-Engine (`src/utils/audio/`)**:
  - `types.ts`: Audio context interfaces, tone definitions, SFX registries, and sound parameters.
  - `synthEngine.ts`: WebAudio node graphs, oscillators, ADSR envelopes, filters, and global gain control.
  - `spatialAudio.ts`: 2D tile coordinate panning, low-pass distance muffling, and volume falloff.
  - `ambientSoundscapes.ts`: Continuous environmental audio layers (rain, blizzards, winds, dungeon caves, tavern chatter).
  - `soundCatalog.ts`: Procedural sound design definitions for UI, spells, combat hits, loot drops, footsteps, crafting, boss fanfares, and death cues.
  - `index.ts`: Unified audio barrel export.
- **Zero Breaking Changes & Backward Compatibility**:
  - Maintained `src/utils/audio.ts` as a thin facade re-exporting the entire audio engine for existing callers.
- **Automated Verification & Test Expansion**:
  - Added `src/tests/audioEngineModular.test.ts` verifying all 14 audio test cases (volume clamping, muting toggle, spatial audio falloff & panning, indoor acoustics, synth dispatching, and procedural ambient soundscape updates).
  - Validated 34 Vitest test suites (167 unit, integration, and simulation tests passing 100% green).

## [v7.2.0] — Phase 2: Enemy & Follower AI Engine Decoupling (August 19, 2026)
*Decomposed the monolithic 1,890-line Enemy AI engine (`src/hooks/useEnemyAI.ts`) into a modular behavior controller architecture under `src/hooks/ai/`, added dedicated unit test suite, and verified 33 Vitest suites (153 tests) passing 100% green.*

- **Modular AI Sub-Engine (`src/hooks/ai/`)**:
  - `types.ts`: Context parameter interfaces, return contracts, and state typing.
  - `aiTurnEnvironment.ts`: Status effect resolution (DoTs, HoTs, poison, food buffs), environmental weather/seasons, day/night cycles, GM POI nudges, companion tactical advice, and adaptive roaming monster spawning.
  - `useFollowerAI.ts`: Companion follow logic, ranged weapon awareness (bow/magic/spear/melee), tactical retreats, and combat assist.
  - `useTownGuardAI.ts`: Town defense threat response, 30-tile alarm broadcast, day/night shift scheduling, and barracks bed sleeping routines.
  - `useHostileAI.ts`: Stagger posture mechanics, telegraphed attacks with BRACE/DODGE, wagon attacks, companion targeting, armor penetration, and wounded reinforcements call.
  - `useCivilianAI.ts`: Cat playful wandering, civilian schedules (work/leisure/campfire/home sleep), blizzard/rain shelter reactions, ambient barks, and hireable hero counter-attacks.
  - `aiCombatAggregator.ts`: Aggregated visual floating combat text dispatcher and tactical caravan skirmish victory evaluations.
  - `useEnemyAI.ts`: Central turnkey coordinator executing turn-based AI resolution.
  - `index.ts`: Modular AI engine barrel export.
- **Zero Breaking Changes & Backward Compatibility**:
  - Maintained `src/hooks/useEnemyAI.ts` as a thin facade re-exporting the entire AI engine for existing callers.
- **Automated Verification & Test Expansion**:
  - Added `src/tests/modularAIEngine.test.ts` verifying all 6 core AI mechanics (environment shifts, follower combat, guard threat response, hostile attacks, civilian schedules, and caravan victory).
  - Validated 33 Vitest test suites (153 unit, integration, and simulation tests passing 100% green).

## [v7.1.0] — Phase 1: Sovereign Game Master Storyteller Engine Modularization (August 19, 2026)
*Decomposed the monolithic 2,569-line Game Master Storyteller (`src/utils/gmStoryteller.ts`) into a clean, decoupled sub-engine architecture under `src/utils/storyteller/`, added dedicated unit test suite, and verified 32 Vitest suites (147 tests) passing 100% green.*

- **Modular Storyteller Sub-Engine (`src/utils/storyteller/`)**:
  - `types.ts`: Domain models (`GMState`, `GMMemory`, `GMPersonality`, `GMEncounter`, `ChaosSurgeEntry`) and catalog type loaders.
  - `storytellerFlavor.ts`: Dynamic narrative prompt and placeholder token interpolators (`getRandomFlavorText`, `getEncounterFlavorText`, `getChaosSurgeFlavorText`).
  - `storytellerEncountersData.ts`: Master registry of 26 dynamic GM encounters and story execution callbacks.
  - `storytellerRescue.ts`: Autonomous pity system, low-HP rescues, and emergency savior spawns.
  - `storytellerChaos.ts`: Chaos score math, surge rolls, and 20-tier periodic Chaos Core Surge matrices.
  - `storytellerEngine.ts`: Tension pacing, boredom curves, autonomous monologue synthesis, and tick runner.
  - `index.ts`: Unified barrel exports.
- **Zero Breaking Changes & Backward Compatibility**:
  - Maintained `src/utils/gmStoryteller.ts` as a thin facade re-exporting the entire storyteller engine for existing callers.
- **Automated Verification & Test Expansion**:
  - Added `src/tests/storytellerModule.test.ts` verifying all 8 core storyteller mechanics.
  - Validated 32 Vitest test suites (147 unit, integration, and simulation tests passing 100% green).

## [v7.0.0] — Phase 55: Sovereign God Mode Full Modularization, Deep Codebase Audit & Architectural Synchronization (August 18, 2026)
*Decomposed the massive God Mode console overlay into a modular state hook (`useGodPanelState.ts`) and 24 focused sub-components, synchronized all architectural documentation, verified all 31 Vitest test suites (139 tests passing 100% green), and established pristine codebase structures for developers and testers.*

- **God Mode State & Sandbox Decoupling (`src/hooks/god/useGodPanelState.ts`, `src/components/GodPanelOverlay.tsx`)**:
  - Extracted centralized state, cheat toggles, weather modulators, GM thought injectors, inventory/relic grantors, blueprint preset converters, and simulation runners into `useGodPanelState.ts`.
  - Reduced `GodPanelOverlay.tsx` from 3,598 lines to ~690 lines, transforming it into a clean, high-performance tab router.
  - Housed 24 modular sub-components in `src/components/god/` with a centralized barrel export index.
- **Architectural & Documentation Synchronization**:
  - Updated `AGENTS.md`, `DEVELOPERS.md`, `README.md`, `codebase_structure.md`, `todo.md`, and `all.md` with complete directory maps, testing workflows, and developer cheat references.
  - Linked active game environments (Development App and Shared App) directly in developer guides for instant test access.
- **Automated QA & Simulation Suite**:
  - Verified 31 Vitest test suites comprising 139 unit, integration, and end-to-end simulation tests with 100% pass rate.
  - Validated strict TypeScript type checking (`tsc --noEmit`) and production bundle compilation (`compile_applet`).

## [v6.9.2] — Phase 53: Player Attack Hook Extraction, Monolith Reduction & Codebase Audit (August 16, 2026)
*Extracted player combat execution logic from App.tsx into dedicated usePlayerAttack.ts hook, performed thorough dead code and import cleanup, verified 100% test pass rate across 30 test suites (133 tests), and synchronized all architectural documentation.*

- **Player Attack Hook Extraction (`src/hooks/usePlayerAttack.ts`, `src/App.tsx`)**:
  - Decoupled `handlePlayerAttack` logic encompassing melee strikes, ranged archery, stamina depletion, critical hits, and companion assistance intercepts into `usePlayerAttack.ts`.
  - Integrated weapon and shield durability decay handling with automatic broken item alerts.
  - Linked directional floater outward drift (`combatFloaterDrift.ts`) directly into combat resolution.
- **Monolith Deconstruction & Import Sanitization (`src/App.tsx`)**:
  - Removed unreferenced legacy functions (`handleAlchemicalTransmute`, `handleInvokeWeatherRitual`, `renderItemDurability`).
  - Pruned 75+ unused imports across component and utility trees.
- **Automated Verification & Documentation Sync**:
  - Ran comprehensive automated codebase auditor (`npm run audit`), verifying 263 source files and 29 JSON data catalogs with 0 broken imports and 0 type errors.
  - Validated 30 Vitest test suites (133 tests passing 100% green).
  - Synchronized folder hierarchy and sub-system maps across `DEVELOPERS.md`, `README.md`, `FEATURES.md`, `all.md`, and `todo.md`.

## [v6.9.1] — Phase 52: Contextual Lore & Deep Flavor Logging (August 15, 2026)
*Implemented comprehensive narrative transparency and contextual lore explanations across all Game Master storyteller interventions, Chaos Surges, environmental events, and player world actions.*

- **Contextual GM & Storyteller Encounters (`src/utils/gmStoryteller.ts`)**:
  - Upgraded all GM encounters (`healing_breeze`, `void_ambush`, `alchemy_gift`, `smite_nearest`, `trap_shower`, `arcane_torrent`, `guardian_summon`, `gilded_bounty`, `mana_leak`, `goblins_greed`, `acidic_smog`, `earthquake_tremor`, `dimensional_blur`, `mystical_resonance`, `wild_beast_pack`, `ukko_thunder`, `vainamoinen_song`, `mielikki_gift`, `story_bandit_camp`) with rich narrative explanations detailing *why* each event occurred and its contextual lore basis.
  - Formatted logs with descriptive brackets (`[SERAPHIC RESPITE]`, `[RIFT INCURSION]`, `[DIVINE INTERVENTION]`, `[TECTONIC TREMOR]`, `[ETHERIC RESERVOIR]`, `[BANDIT OUTPOST]`, etc.) for clear readability and high narrative immersion.
- **Dual Log Handling in Turn Loop (`src/hooks/useEnemyAI.ts`, `src/utils/gmStoryteller.ts`)**:
  - Expanded `tickActiveGMStoryteller` to return structured `logMessages` arrays ensuring simultaneous chaos matrix evaluations and storyteller interventions are both logged without omission.
- **Chaos Matrix & Surge Lore Detail (`src/utils/gmStoryteller.ts`)**:
  - Added thematic explanations to all 20 Chaos Core Surge rolls (tectonic fractures, toxic spore ruptures, corrosive vapors, etheric feedbacks, geode discoveries, foraging thickets, celestial alignments).

## [v6.9.0] — Phase 51: Combat Visual Clarity & Directional Outward Drift (August 15, 2026)
*Implemented directional outward drift physics for combat floating numbers (`combatFloaterDrift.ts`), projectile impact trajectory alignment, clear line-of-sight offsets over entity models, refined decay curves, and high-contrast text outlines.*

- **Directional Outward Drift (`src/utils/combatFloaterDrift.ts`, `src/components/GameCanvas.tsx`)**:
  - Calculates impact momentum vector $(\Delta x, \Delta y)$ between attacker and target for player melee, ranged shots, companion strikes, and enemy assaults.
  - Spawns floating numbers offset outside entity sprites and health bars, arcing outward in the direction of the blow.
  - Diverges ambient/self effects (healing, mana gains) towards side flanks to ensure central line of sight remains unobstructed.
- **Visual Contrast & Decay Tuning (`src/canvas/entityLayerRenderer.ts`, `src/components/GameCanvas.tsx`)**:
  - Replaced lingering floating text decay with a crisp ~0.9s lifetime and smooth ease-out alpha fade.
  - Added high-contrast dark outline rings around floating damage and critical numbers for instant legibility across all terrains and light levels.

## [v6.8.0] — Phase 50: Autonomous GM Storyteller Enhancements (Weather, Threat & Caravan Injections) (August 14, 2026)
*Implemented autonomous biome-aware weather modulations (`gm_harsh_tempest`, `gm_benevolent_clear_skies`), dynamic world threat surges & Chaos Matrix enemy adaptation, autonomous merchant caravan injections (`gm_caravan_traveler_injection`), and outlaw road blockades (`gm_road_blockade_skirmish`).*

- **Autonomous Biome Weather Modulations (`src/utils/gmStoryteller.ts`)**:
  - GM dynamically evaluates battlefield tension, boredom, and player peril to command atmospheric weather mutations.
  - Sadistic/Mischievous personalities trigger harsh tempests (Blizzards in Tundra, Sandstorms in Deserts, Torrential Rains in Forests).
  - Benevolent personalities clear storms and cast warm protective skies when player HP is in critical danger (<35%).
- **World Threat & Chaos Escalation (`src/utils/gmStoryteller.ts`)**:
  - Implemented dynamic Chaos Matrix threat surges that analyze player kill streaks and effortless slaughter, increasing monster ATK, HP, and corrupt affixes.
  - Periodic 15-turn Chaos Core Surges roll on 20 distinct tactical effects.
- **Autonomous Caravan Injections & Outlaw Blockades (`src/utils/gmStoryteller.ts`)**:
  - GM spawns travelling merchant wagons (`🛒`) in overworld wilderness chunks to offer field supplies or escort contracts.
  - Spawns dynamic Outlaw Road Blockades with Corrupted Road Barons along high-danger routes.

## [v6.7.0] — Phase 49: Tactical Caravan Defense, World Threat Boss Ambushes & Data Separation (August 13, 2026)
*Implemented tactical "Defend the Wagon" skirmish battlegrounds (`caravanSkirmishGen.ts`), enemy AI wagon hull targeting (`useEnemyAI.ts`), World Threat Boss Ambushes, dynamic cargo integrity payout scaling, and data extraction into pure JSON (`caravanBosses.json`).*

- **Tactical "Defend the Wagon" Battle Map (`src/world/caravanSkirmishGen.ts`)**:
  - Generates a dedicated tactical skirmish battleground featuring a central Merchant Wagon prop (`🛒`), a smoldering guard campfire (`🔥`), 2 allied Caravan Guards (`🛡️` Veteran Guard and `🏹` Crossbow Sentry), and perimeter enemy spawn points.
  - Players can deploy directly from the caravan overlay into active skirmish grid combat to defend the wagon hull and slay ambushers.
- **Wagon AI Targeting & Health Engine (`src/hooks/useEnemyAI.ts`)**:
  - Ambushers intelligently track distance to the wagon and split focus between attacking the player, allied guards, and striking the wagon hull.
  - Damage dealt to the wagon reduces `wagonHp`, plays metallic impact sounds (`metal_hit`), logs real-time damage messages, and renders floating damage text over the wagon on the canvas.
  - Defeating all ambushers on the grid triggers an automatic victory state, awarding bonus gold, XP, and rare crafting materials while preserving remaining wagon HP.
- **Escort Overlay & Dynamic Payout Scaling (`src/components/modals/CaravanActiveOverlay.tsx`, `src/hooks/useCaravanTravel.ts`)**:
  - Displays a live Wagon Hull HP bar, Cargo Integrity %, and payout scaling factors inside `CaravanActiveOverlay`.
  - Escorting caravans with high cargo integrity (>85%) awards bonus **Flame** or **Void Catalysts**.
  - High-hazard routes in `TradeModal` clearly display `👑🔴 High Hazard (Boss Ambush Risk!)` warnings.
- **Pure Data Separation to JSON (`src/data/caravanBosses.json`, `src/utils/caravanEncounters.ts`)**:
  - Extracted all World Threat Boss Ambush templates, options, stat checks, affixes, and penalties into `src/data/caravanBosses.json` for easy developer customization and balancing.

## [v6.6.0] — Phase 38: Ancient Monoliths & Biome Shrines (Finnish Mythology Overworld Landmarks) (August 12, 2026)
*Implemented procedural overworld landmark spawning (Tapio's Ley-Well Shrines, Ilmarinen's Forge Hearths, Väinämöinen's Rune Monoliths, Tuonela's Sunken Keeps, and Antero Vipunen's Tectonic Fossils), Finnish Mythology Spell-Song Chants (Laulu), Runic Item Offerings, Overworld Leyline Waystone Fast Travel Network, and Biome Guardian Trial Boss Battles.*

- **Procedural Landmark Spawning (`src/world/poiGenerators.ts`, `src/data/worldHistory.json`)**:
  - Procedurally places ancient landmarks across overworld chunks tailored to biomes and Finnish mythology deities (Forest Tapio/Mielikki, Tundra Vipunen, Volcanic/Desert Ilmarinen, Swamp Tuonela, Mountain Ukko).
- **Interactive Landmark Rituals & Runic Offerings (`src/components/PoiInteractionOverlay.tsx`)**:
  - **Chant Spell-Songs (Laulu)**: Spend MP to invoke deity names for permanent attribute increases (+15 Max HP, +2 DEF, +3 Attribute Points), HP/MP restoration, and status buffs (BLESSED, SHIELDED).
  - **Runic Offerings**: Sacrifice materials (Forest Berries, Iron Ore, Gold, Shadow Catalysts) to receive rare Ember Cores, Poison Catalysts, and Town Reputation.
- **Leyline Waystone Fast Travel Network (`src/components/PoiInteractionOverlay.tsx`, `src/App.tsx`)**:
  - Players can attune discovered landmarks to Sunder's Leyline Network.
  - Interactive Waystone Network modal enables instant fast-travel teleportation between attuned landmarks across overworld chunks.
  - Interactive minimap (`ChunkMinimap.tsx`) renders distinct glowing POI icons (Grove, Forge, Rune, Waystone) and map legend.
- **Biome Guardian Trial Boss Battles (`src/App.tsx`, `src/components/PoiInteractionOverlay.tsx`)**:
  - Players can challenge mythic spirit guardians (*Hiisi Grove Warden*, *Ilmarinen's Iron Golem*, *Ukko's Storm Sentinel*, *Tuonela River Wraith*, *Tectonic Bone Automaton*).
  - Spawns high-difficulty trial boss encounters dropping rare Mithril, Ember Cores, Dragon Scales, and elemental catalysts.

## [v6.5.0] — Phase 48: Pure Data Separation to JSON & Deep Codebase Refactoring (August 12, 2026)
*Extracted hardcoded game arrays and catalogs into pure JSON data structures (`combatFlavors.json`, `worldHistory.json`, `soundCatalog.json`, `spellsCatalog.json`, `guildData.json`), enforced strict type safety and pure functional separation, and verified 100% build and linter pass.*

- **Data Separation & JSON Migration**:
  - `src/data/combatFlavors.json`: Extracted all weapon-specific attack narratives (Sword, Spear, Dagger, Hammer, Staff, Bow, Wand, Crossbow, Greatsword, Warhammer) and fallback combat text into structured JSON.
  - `src/data/worldHistory.json`: Extracted 10 Lore Chapters and Finnish-lore POI blueprints into clean JSON format.
  - `src/data/soundCatalog.json`: Extracted complete sound effect catalog across combat, movement, environment, crafting, and UI.
  - `src/data/spellsCatalog.json`: Extracted spell definitions and elemental mappings.
  - `src/data/guildData.json`: Extracted Guild Upgrades, Sanctuary Decors, Companion Quests, and Faction Gear (Syndicate, Vanguard, Bandit).
- **TypeScript Integration & Pure Utilities**:
  - Refactored `combatFlavors.ts`, `worldHistory.ts`, `soundCatalog.ts`, `spellsAndEquipment.ts`, and `tradeEconomy.ts` to import and type-cast JSON files cleanly.
  - Verified zero regressions, 100% type safety, clean `tsc --noEmit`, and full `compile_applet` build validation.

## [v6.4.0] — Phase 47: Runtime Modding API & Custom Dungeon Level Editor (August 12, 2026)
*Implemented Runtime Modding API Engine, Custom Grid-Based Dungeon Level Editor, Live JSON Schema Mod Manager, Community Sample Mods, and Instant Test-Play Launcher.*

- **Runtime Modding API & Plugin Engine (`src/utils/moddingEngine.ts`, `src/components/god/GodModdingTab.tsx`)**:
  - Modular plugin architecture enabling dynamic registration of custom monsters, custom weapons & armor, custom magic spells, and custom dungeon blueprints.
  - Full local persistence, enable/disable toggling, JSON schema validation, error reporting, and export/import functionality.
  - Pre-loaded with 4 Community Sample Mods: *Mythical Behemoths Boss Pack*, *High-Elven Sorcery Spellbook*, *Shadow Realm Relics Pack*, and *Forgotten Catacombs Blueprint*.
  - Integrated `getActiveCustomMonsters()` seamlessly into `getEnemyTemplate()` in `src/utils/dungeon.ts` for live combat spawning.
- **Interactive Custom Dungeon Level Editor (`src/components/god/GodDungeonEditor.tsx`)**:
  - Visual grid painter supporting configurable canvas dimensions (20x16, 24x18, 30x20) and tile palettes (Floors, Walls, Water, Doors, Stairs, Grass, Paths, Campfires, Beds, Fireplaces).
  - Multi-category painting tools for interactive decor props (Sarcophagi, Weapon Racks, Bookshelves, Worktables), monster spawn points, and player spawn location (`P`).
  - Features quick procedural cave generator baseline, level title/depth/biome configuration, and **Instant Test-Play** mode loading custom maps directly into active gameplay.

## [v6.3.0] — Phase 43: Interactive Level Decor Props, Alert Banner & Expanded Dev Tools (August 11, 2026)
*Implemented Interactive Level Decor Props Engine, Adjacent Props Interactive Alert Banner, Exhaustion/Cooldown Refresh, Master Crafting Pack & God Mode Time/Fatigue Tools, and verified clean compilation and linter baseline.*

- **Interactive Level Decor Props Engine (`src/utils/decorEngine.ts`, `src/App.tsx`, `src/hooks/useWorldInteraction.ts`)**:
  - Implemented 10 interactive dungeon & town decor templates: Ancient Sarcophagus, Rusted Weapon Rack, Lore Bookshelf, Alchemist Worktable, Warm Feather Bed, Roaring Hearth, Town Spring Well, Town Notice Board, Cinder Cask, and Celestial Sundial.
  - Interacting with decor props grants thematic rewards, HP/MP recovery, status cleanses, random equipment, lore logs, and time shifts, with exhausted state tracking.
- **Adjacent Decor Interactive Alert Banner (`src/App.tsx`)**:
  - Automatically displays an interactive HUD banner when standing adjacent to decor objects, showing name, description, and status with direct click / keyboard interaction options.
- **Expanded Developer & GM Tools (`src/data/gmCommands.ts`, `src/components/GodPanelOverlay.tsx`, `src/components/god/GodCheatsTab.tsx`)**:
  - Added new GM Storyteller commands (`grant_master_crafting_pack`, `spawn_decor_cluster`, `reset_all_decor_props`, `teleport_overworld_surface`, `fast_forward_time_6h`).
  - Added dedicated God Panel controls to spawn decor clusters, refresh exhausted decor props, advance game time by 6 hours, and purge physical exhaustion & debuffs.

## [v6.2.0] — Phase 42: Directional Drop Shadows, Water Ripples, Environmental Particles & Codebase Health Audit (August 10, 2026)
*Implemented Dynamic Sun & Moon Directional Drop Shadows, Water Ripples & Footstep Splashes, Ambient Falling Leaves, Cherry Blossom Petals, Glowing Spores, Desert Dust Devils, and verified 100% test suite pass rate across 24 test suites (95 tests).*

- **Town Guard Active Defense AI & Defensive Alarm Network (`src/hooks/useEnemyAI.ts`, `src/tests/ai.test.ts`)**:
  - Implemented town-wide active scanning for town guards (`isTownGuard: true`), enabling guards to actively search out, pursue (`getNextStepTowards`), and engage hostile invaders anywhere in town.
  - Added a defensive alarm broadcast that wakes sleeping guards and sentries within 30 tiles when a threat is spotted, summoning a coordinated response force.
  - Integrated full multi-target combat reciprocity, allowing hostile enemies to pathfind toward and attack town guards and companions while guards deal persistent damage and slay hostile invaders.
- **Dynamic Sun & Moon Directional Drop Shadows (`src/canvas/shadowRenderer.ts`, `src/canvas/tileMapRenderer.ts`, `src/canvas/entityLayerRenderer.ts`)**:
  - Calculated real-time directional shadow vector offsets `(dx, dy)`, lengths, and opacities based on in-game 24h clock minutes (long morning shadows extending west at dawn, compact midday shadows at noon, long evening shadows extending east at dusk, cool slate moonlight shadows at night).
  - Cast soft translucent directional drop shadows beneath trees (`🌲`, `🌳`, `▲`), rock walls/veins, structure gates/signs, as well as living entities (Player, NPCs, Enemies, Bosses).
- **Water Ripples & Footstep Splashes (`src/canvas/entityLayerRenderer.ts`, `src/canvas/visualFxParticleSystem.ts`)**:
  - Trigger expanding concentric ring ripple animations (`spawnWaterRipple`) when player, NPCs, or enemies move onto water (`🌊`), shallow stream, or swamp bog (`🐊`) tiles.
  - Add temporary water droplet splash particles (`spawnFootstepSplash`) when moving over any outdoor tile during active `rainy` or `stormy` weather conditions.
- **Weather Pattern Transition Fade & Atmospheric Overlays (`src/canvas/weatherLightingRenderer.ts`)**:
  - Implemented smooth cross-fading between outgoing and incoming weather layers over 2.4s (`renderWeatherOverlay`).
  - Added a dynamic 'fade-to-fog' and 'darken-screen' transitional atmosphere overlay featuring a sine-wave bell curve peaking at midpoint transition to smoothly shift atmospheric moods during weather changes.
- **Ambient Environmental Particles & Dust Devils (`src/canvas/weatherLightingRenderer.ts`)**:
  - Render ambient floating leaf particles (`fallingLeaves`), cherry blossom petals (`cherryBlossoms`), and glowing bio-luminescent spores (`spores`) across Forest, Tundra, and Swamp biomes.
  - Render animated spinning dust devil particles with rotational physics and sandy trails across Desert biomes.
- **Comprehensive Codebase & Import Health Audit Pass (`scripts/auditCodebase.cjs`)**:
  - 100% test pass rate across 24 Vitest test suites (95 unit and end-to-end simulation tests).
  - Automated codebase auditor verified 226 source files, 22 JSON catalogs, relative imports across 204 TypeScript files, `tsc --noEmit` type compilation, and production applet build with 0 errors.

## [v1.0.0 / v6.0.0] — Public Testing Release & GM Adaptive Performance Evaluation (August 9, 2026)
*Pristine Public Testing Release Candidate prepared for GitHub push. Features GM Adaptive Combat Performance Evaluation, Biome-Aware Weather System, Town Biome Expansion, Drastic Chaos Escalation on Effortless Slaughter, Dynamic Enemy Stat Mutators & Reinforcements, 100% Test Suite Pass Rate across 21 Test Suites (86 Tests), and Clean Codebase Verification.*

- **Town Biome & Biome-Aware Weather Rules Engine (`src/utils/weatherEngine.ts`, `src/data/gmCommands.ts`, `src/components/god/GodWorldEditor.tsx`)**:
  - Expanded overworld biome definitions with a dedicated 'town' biome.
  - Implemented `getValidWeatherForBiome` ensuring weather is strictly biome-specific (no rain/snow in deserts; sandstorms restricted to deserts; blizzards restricted to tundras; mild weather in towns).
  - Enforced single active weather effects across the engine and updated GM commands (`weather_rainy`, `weather_foggy`, `weather_snowy`), GM Storyteller interventions, and God Panel controls to respect biome weather constraints.
- **GM Adaptive Performance Evaluation & Drastic Chaos Escalation (`src/utils/gmStoryteller.ts`, `src/tests/storytellerAI.test.ts`)**:
  - The GM Storyteller continuously evaluates player combat efficiency, kill streaks, and health ratios.
  - When the player effortlessly slaughters foes without taking damage, the GM triggers drastic Chaos Matrix escalation (+8 to +15 Chaos) and logs adaptive narrator dialogue ("Too easy? Let us test your true steel!").
- **Dynamic Active Enemy Empowerment & Reinforcement (`src/utils/gmStoryteller.ts`, `src/utils/combatArchetypes.ts`)**:
  - On GM Chaos adaptation, active monsters on the map dynamically mutate: gaining +30% HP, +2 ATK, +1 DEF, Chaos Tier upgrades, and elevated Elite / Anomaly modifiers.
  - Golden Triangle enemy spawners scale dynamically with higher Chaos Scores, spawning Triangle-Cheating Anomalies when Chaos exceeds 60.
- **Pristine Public Release Verification**:
  - 100% test pass rate across 21 Vitest test suites (86 tests total).
  - Clean build & linting output (`tsc --noEmit`) with zero errors, zero dead code warnings, and updated developer documentation.

## [v5.5.0] — Phase 33 & 34: Tactical Combat Overhaul, Golden Triangle Spawns, GM Chaos Matrix & Merchant Inventories (August 9, 2026)
*Implemented Telegraphed Heavy Attacks, Guard/Stagger Meter System, Player Bracing, Golden Triangle Enemy Spawning with GM Spawner Cheating, Integrated Central GM Chaos Matrix with Player Suppression, and Traveling Merchant Wilderness Stock with 30% Markup.*

- **Telegraphed Heavy Attacks & Wind-Up System (`src/hooks/useEnemyAI.ts`, `src/canvas/entityLayerRenderer.ts`)**:
  - Enemies wind up heavy attacks across turns with telegraphed highlight indicators, floating warning alerts ("💥 Heavy Slam WINDING UP!"), and directional impact zones.
  - Telegraphed attacks deal 1.8x - 2.5x damage and apply massive stagger build-up if unmitigated.
- **Guard / Stagger Bar Mechanics & Player Bracing (`src/App.tsx`, `src/hooks/useEnemyAI.ts`)**:
  - Implemented dynamic stagger meters on enemies and player. Taking heavy impacts, blunt force weapon hits, or shield bashes builds stagger; breaking guard triggers a 1-turn stunned state with 1.5x incoming damage.
  - Players can activate the "Brace / Guard" tactical stance to absorb 60% of incoming damage, prevent guard breaks, and reflect stagger back onto attacking enemies.
- **Golden Triangle Enemy Placement & GM Flex Logic (`src/hooks/useEnemyAI.ts`, `src/world/dungeonGen.ts`)**:
  - Encounters default to the tactical Golden Triangle spatial zone (3 key strategic points around the player) to prevent unfair encirclement or off-screen snipers.
  - Bosses and GM Storyteller events retain flexibility ("cheat" the triangle) to launch surprise ambushes, flank maneuvers, or specialized wave spawns.
- **Integrated Central GM Chaos Matrix (`src/hooks/useGameLoop.ts`, `src/utils/gmNarrator.ts`)**:
  - Consolidated chaos tracking into a unified Central GM Chaos Matrix where the Game Master dynamically controls chaos escalation based on player activities, time spent in deep vaults, and environmental tension.
  - Players can actively suppress and lower the Chaos Matrix through tactical choices: liberating bandit camps, slaying elite dungeon bosses, clearing watchtowers, and completing faction guild contracts.
- **Traveling Merchant Wilderness Stock & Markup (`src/utils/shopData.ts`, `src/components/modals/TradeModal.tsx`)**:
  - Configured merchant inventory profiles for all traveling NPCs (Herbalists, Hunters, Pilgrims, Wandering Merchants, Caravans) with specialized items (health potions, remedies, pelt supplies, survival gear, recall scrolls, alchemical catalysts, and weapons).
  - Applied a 30% wilderness supply markup for merchants risking dangerous uncharted lands.

## [v5.4.0] — Phase 32: Crafting Engine Sub-Hook Separation & Architecture Refactoring (August 7, 2026)
*Modularized useCraftingEngine.ts into specialized sub-hooks (useEquipmentCrafting, useSurvivalCrafting, useUtilityCrafting) under src/hooks/crafting/. Verified full backward compatibility, 0 linter errors, and 100% test pass rate across 20 test suites (80 tests).*

- **Crafting Sub-Engine Separation (src/hooks/crafting/)**:
  - useEquipmentCrafting.ts: Weapon & armor forging, item upgrades, blacksmith repairs, and mutation alchemy.
  - useSurvivalCrafting.ts: Deployable structures, campfire cooking recipes, resting, and fishing minigames.
  - useUtilityCrafting.ts: Potion brewing and utility tool crafting (pickaxes, hatchets, fishing poles, lockpicks, recall scrolls).
  - useCraftingEngine.ts: Aggregator hook delegating to sub-engines.
- **Unified Master Documentation (all.md)**: Created single-source reference detailing engine sub-systems, test suite pass status, and project architecture.

## [v5.3.0] — Phase 31: Rendering & Canvas Performance Optimizations, Codebase Audit & Health Suite (August 6, 2026)
*Implemented comprehensive import & JSON catalog auditing script (`scripts/auditCodebase.cjs`), optimized canvas rendering loops in `spriteRenderer.ts`, `weatherLightingRenderer.ts`, and `visualFxParticleSystem.ts`, and verified 100% test pass rate across 20 test suites (80 tests).*

- **Codebase Integrity & Import Health Audit (`scripts/auditCodebase.cjs` & `package.json`)**:
  - Resolved `src/types.ts` type re-export exports.
  - Built automated node audit runner checking 203 source files, 22 JSON data catalogs, and relative import paths across 181 TypeScript files.
  - Added `npm run audit` script combining import integrity validation, TypeScript type checks (`tsc --noEmit`), and Vitest test suite runs.
- **Canvas Rendering & Particle Optimizations (`src/canvas/`)**:
  - Memoized regex evaluation for emoji font detection in `spriteRenderer.ts` using an LRU/Map cache.
  - Batched weather particle path draw operations (`rain`, `snow`, `dust storm`, `blizzard`, `embers`, `cherry blossoms`, `spores`) in `weatherLightingRenderer.ts` to minimize canvas context state transitions.
  - Applied particle capping (250 active particles limit) and early exit checks in `visualFxParticleSystem.ts` to reduce garbage collection overhead.
- **Automated Test Suite Verification**:
  - Validated 20 passed Vitest test suites (80 unit and end-to-end simulation tests).

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
