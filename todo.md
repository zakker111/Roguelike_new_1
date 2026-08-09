# ⚔️ Sunder: Roguelike RPG Overworld Expansion To-Do List

This document outlines the master roadmap, active system checklists, and future feature backlogs for expanding the gameplay, system depth, and world responsiveness of **Sunder: Dungeon Crafting Roguelike** (Abyss Rogue).

---

## 📌 Master Milestone & Release Map

```
  [v2.3.0] Jumbo Chunks, Winter Frost & Modular Interiors (DONE)
     │
     ▼
  [v2.4.0] Interactive Landmark Choice Encounters (DONE)
     │
     ▼
  [v2.4.5] Drunk Wandering Merchant Seppo & Rare Surface Traders (DONE)
     │
     ▼
  [v2.5.0] Wandering Factions & Lively Overworld (DONE)
     │
     ▼
  [v2.6.0] Life Skills, Nodes Harvesting, Alchemy & Brewing (DONE ✔)
     │
     ▼
  [v2.7.0] Dynamic Trade Economy & Guild Houses (DONE ✔)
     │
     ▼
  [v2.8.0] Dynamic Challenge, Blood Moons & Stamina Exhaustion (DONE ✔)
     │
     ▼
  [v2.9.0] Tavern Minigames, Drunk Patrons & AI Chase Fixes (DONE ✔)
     │
     ▼
  [v2.9.6] Quality Assurance, Expanded Scar Database, Compact Chronologue Logs (DONE ✔)
     │
     ▼
  [v2.9.7] Sunder Secure Lockpicking Mini-Game & Tension Wire Forging (DONE ✔)
     │
     ▼
  [v2.9.9] Visceral Kinematics: CSS Damage Shakes & Fluid Blood Drips (DONE ✔)
     │
     ▼
  [v3.0.0] Abyssal Horde: New Dungeon Denizens & Legendary Bosses (DONE ✔)
     │
     ▼
  [v3.1.0] Dungeon Captives & Freedom Fighters (DONE ✔)
     │
     ▼
  [v3.2.0] Double-Edged Dungeon Shrines & Curses (DONE ✔)
     │
     ▼
  [v3.2.3] Caravan Escort Journeys & Threat Encounters (DONE ✔)
     │
     ▼
  [v3.2.4] Grimoire Magic Spell Tuning & Wands Tuning (DONE ✔)
     │
     ▼
  [v3.2.5] Sandbox Teleport Crash Isolation & Boundary Sync (DONE ✔)
     │
     ▼
  [v3.5.0] Dynamic Faction Wars & Territory Conquest (DONE ✔)
     │
     ▼
  [v3.6.0] Underworld Depths & Legendary Biome Bosses (DONE ✔)
     │
     ▼
  [v3.6.5] Finnish Mythology & Epic Rune-Songs Expansion (DONE ✔)
     │
     ▼
  [v3.6.6] Runic Trap Detection & Scouting Mastery (DONE ✔)
     │
     ▼
  [v3.6.7] Domain-Specific Engine Modularization & Code Cleanup (DONE ✔)
     │
     ▼
  [v3.6.8] Declarative World Generation & Meteorological Settings (DONE ✔)
     │
     ▼
  [v3.7.0] Enchanted Forged Artificer & Exotic Gear Overhaul (DONE ✔)
     │
     ▼
  [v3.8.0] Hardcore Caravan Escorts & Versatile Safehouse Companions (DONE ✔)
     │
     ▼
  [v3.8.5] Codebase Review, System Modularization & Markdown Alignment (DONE ✔)
     │
     ▼
  [v3.8.6] Dual-Hand Combat Durability & Gauntlets/Neck Piece Separation (DONE ✔)
     │
     ▼
  [v3.8.7] Universal Equipment Loot Drops & Rare Necklace Probability (DONE ✔)
     │
     ▼
  [v3.8.8] Immersive Storyteller Narratives & Tiered Loot Rarity (DONE ✔)
     │
     ▼
  [v3.8.9] NPC Coordinate Sanitization & Wall Spawn Prevention (DONE ✔)
     │
     ▼
   [v3.9.0] Safe Player Spawning & Companion Faction Targeting (DONE ✔)
      │
      ▼
   [v3.9.1] Faction Watchtower Garrisons & Tribute Chests (DONE ✔)
      │
      ▼
   [v3.9.2] Custom Structure Carving & Legend-Mapped Blueprint Designer (DONE ✔)
      │
      ▼
   [v3.9.3] Wilderness Traveling NPCs & Crime Witness System (DONE ✔)
      │
      ▼
   [v3.9.4] Roaming Outlaw Camps & Bored GM Interventions (DONE ✔)
      │
      ▼
   [v3.9.5] Quest-Giver Assaults & Responsive Multi-Viewport HUD (DONE ✔)
      │
      ▼
   [v3.9.6] Integrated Crafting & Alchemy Workbench (DONE ✔)
      │
      ▼
   [v3.9.7] Scars of the Defeated & Effective Stats System (DONE ✔)
      │
      ▼
   [v3.9.8] Legendary Feline Companions & "Cat Lover" Developer Memorial (DONE ✔)
       │
       ▼
   [v3.9.9] Ultimate Performance & Fluid Control Update (DONE ✔)
       │
       ▼
   [v3.9.12] Over-Forging Heat Bellows System & Risk/Reward Gauge (DONE ✔)
       │
       ▼
   [v3.9.13] Modular Architecture, Stackable Scrolls & Discard Gump Modal (DONE ✔)
       │
       ▼
   [v3.9.14] Unstable Mutation Synergy Chains & Dual-Element Infusion (DONE ✔)
       │
       ▼
    [v4.0.4] Engine Architectural Deconstruction, Custom Hooks & Rendering Optimization (DONE ✔)
        │
        ▼
     [v4.0.5-tbd] Infinite Ocean Navigation, Ship Crafting & Sea Monsters (ROADMAP)
```

---

## 🎯 Current Refactoring & Feature Implementation Roadmap

### Phase 1: Data & Catalog Isolation (DONE ✔)
- [x] Extract audio sound catalogues into `/src/data/soundCatalog.ts`
- [x] Isolate monster definitions into `/src/data/monsters.ts`
- [x] Isolate items and templates into `/src/data/items.ts`

### Phase 2: Domain UI Component Modularization & Navigation Consolidation (DONE ✔)
- [x] Modularize `CraftingPanel.tsx` with dedicated sub-tabs (`WeaponForgingTab`, `MutationCatalystTab`, `GearUpgradeTab`) in `/src/components/crafting/`
- [x] Modularize `GodPanelOverlay.tsx` with extracted sub-components (`GodStatEditor`, `GodWorldEditor`, `GodItemSpawner`, `GodEntitySpawner`, `GodCaravanManager`, `GodWeatherScarEditor`, `GodTeleportWarpPanel`, `GodStorytellerPanel`) in `/src/components/god/`
- [x] Modularize `GuildOverlay.tsx` with extracted `GuildStashPanel.tsx` in `/src/components/guild/`
- [x] Move "Chronicles & Lore" link exclusively into main navigation and clean up stale overlay references.

### Phase 3: 🎵 Live WebAudio Oscilloscope & Synthesizer Studio (DONE ✔)
- [x] Implement interactive WebAudio Oscilloscope visualization (waveform canvas renderer with dual oscilloscope & FFT spectrum modes)
- [x] Add synthesizer controls (frequency oscillator, filter cutoffs, ambient generator, custom procedural audio presets)

---

## 🏗️ Monolith Deconstruction & Architectural Refactoring Plan (v4.1.0 Roadmap)

### Phase 1: GodPanelOverlay.tsx Tab Splitting (Low Risk - IN PROGRESS / PHASE 1 DONE ✔)
* **Goal**: Reduce `GodPanelOverlay.tsx` from 7,435 lines to ~1,500 lines.
* **Action**: Extract dedicated UI tab sub-components into `/src/components/god/`:
  * [x] `GodEntitySpawner.tsx` (Monster/NPC/Follower spawn controls)
  * [x] `GodTeleportWarpPanel.tsx` (Abyss/Town/Dungeon warp controls)
  * [x] `GodWeatherScarEditor.tsx` (Scar manipulation & season controls)
  * [x] `GodCaravanManager.tsx` (Merchant & trade inspection controls)

### Phase 2: App.tsx Handler & Modal Decoupling (Medium Risk - PHASE 2 DONE ✔)
* **Goal**: Reduce `App.tsx` from 10,525 lines to ~3,500 lines.
* **Action**:
  * [x] Extract combat calculations and turn resolution handlers into a dedicated `/src/hooks/useCombatEngine.ts`.
  * [x] Extract inline modal rendering blocks into modular wrapper components inside `/src/components/modals/`.
  * [x] Move global event listeners (keyboard shortcut binders, save/load state serialization) into `/src/hooks/useGameStatePersistence.ts`.

### Phase 3: overworld.ts Subsystem Modularization (Low Risk - PHASE 3 DONE ✔)
* **Goal**: Reduce `overworld.ts` from 2,867 lines.
* **Action**:
  * [x] Move structure templates and placement logic into `/src/world/structureGenerators.ts`.
  * [x] Move POI (Watchtowers, Ruins, Shrines) state logic into `/src/world/poiGenerators.ts`.
  * [x] Retain core chunk heightmap & biome generation in `overworld.ts`.

### Phase 4: Guild & Crafting UI Extraction (Low Risk - PHASE 4 DONE ✔)
* **Goal**: Shrink `GuildOverlay.tsx` (1,979 lines) and `CraftingPanel.tsx` (1,738 lines).
* **Action**:
  * [x] Extract Guild Treasury (`GuildTreasuryPanel.tsx`) and Mission Board (`GuildMissionBoard.tsx`) sub-components into `/src/components/guild/`.
  * [x] Remove legacy Sanctuary Decor (View 2) and Factions (View 4) blocks from `GuildOverlay.tsx`.
  * [x] Extract Camp & Tools (`CampAndToolsTab.tsx`) and Scroll Scriptorium (`ScrollScriptoriumTab.tsx`) sub-components into `/src/components/crafting/`.

---

## 🔍 Codebase Health Audit: The Good & The Bad

### 🟢 What is Good (System Strengths):
1. **Strong Modular Folder Architecture**:
   - Clean UI decomposition into `/src/components/god/`, `/src/components/guild/`, `/src/components/crafting/`, and `/src/components/modals/`.
   - Dedicated canvas render layers in `/src/canvas/` (`spriteRenderer.ts`, `tileMapRenderer.ts`, `weatherLightingRenderer.ts`, `entityLayerRenderer.ts`).
   - World generation decoupled into `/src/world/` (`overworldGen.ts`, `poiGenerators.ts`, `structureGenerators.ts`, `dungeonGen.ts`).
   - Custom gameplay engine hooks in `/src/hooks/` (`useCombatEngine.ts`, `useEnemyAI.ts`, `useCraftingEngine.ts`, `useGameStatePersistence.ts`, `useSpellcasting.ts`, `useWorldInteraction.ts`).
2. **Comprehensive Automated Test Coverage & Zero-Defect Baseline**:
   - 8 test files with 36 Vitest automated unit tests covering combat math, world gen, AI pathfinding, trade economy, scar stat modifiers, save rehydration, and full gameplay simulation (`src/tests/gameplaySimulation.test.ts`).
   - 100% clean production build (`npm run build`) and zero linter/TypeScript errors (`tsc --noEmit`).
3. **Rich Deep Mechanics**:
   - Integrated Scar mechanics, mutation synergy chains, over-forging gauge, dynamic trade economy, companion dispatch, faction wars, scroll scriptorium, lockpicking, fishing, and storyteller GM logic.

---

### 🔴 What Needs Improvement ("The Bad"):
1. **Monolithic App.tsx State Density**:
   - `App.tsx` remains large (~6,000+ lines) because state initialization, keyboard interaction routing, and UI layout rendering are co-located in a single top-level orchestrator.
2. **Leftover Inline Tab Renderers**:
   - `GodPanelOverlay.tsx` still contains inline tab bodies for GM Storyteller controls and Item/Equipment Spawning.
   - `CraftingPanel.tsx` retains inline tab renderers for Cooking and Alchemy that can be extracted into dedicated tab sub-components.
3. **Dual Type Declarations**:
   - Type definitions are split across `/src/types.ts` and `/src/types/` (`game.ts`, `map.ts`, `entity.ts`), requiring occasional type casting in test cases.
4. **Data vs Utility Co-location**:
   - Large static items data, recipe catalogs, and shop inventories are embedded inside utility files rather than strictly isolated in `/src/data/`.

---

## 🛠️ Phased Remediation Plan (v4.2.0 Architecture Roadmap)

### Phase 1: App.tsx Layout & View State Partitioning (v4.2.1) [COMPLETED]
* **Goal**: Reduce `App.tsx` complexity by delegating HUD viewport and UI routing to layout modules.
* **Tasks**:
  * [x] Extract HUD status bars, combat log viewport, and active overlay routing into `/src/components/MainAppLayout.tsx`.
  * [x] Move global keyboard shortcut dispatchers completely into `/src/hooks/useKeyboardInput.ts`.

### Phase 2: Remaining Sub-Component Extractions (v4.2.2) [COMPLETED]
* **Goal**: Complete sub-component extraction for remaining overlay monolithic panels.
* **Tasks**:
  * [x] Extract `GodStorytellerPanel.tsx` and `GodItemSpawner.tsx` into `/src/components/god/`.
  * [x] Extract `CookingTab.tsx` and `AlchemyTab.tsx` into `/src/components/crafting/`.

### Phase 3: Type Hierarchy Consolidation (v4.2.3) [COMPLETED]
* **Goal**: Establish a unified, clean type definition architecture.
* **Tasks**:
  * [x] Consolidate legacy `/src/types.ts` into `/src/types/` modular definitions (`game.ts`, `entity.ts`, `items.ts`, `map.ts`).
  * [x] Eliminate legacy `any` casts in unit test suites.

### Phase 4: Data Catalog Isolation (v4.2.4) [COMPLETED]
* **Goal**: Separate raw static constants from utility logic.
* **Tasks**:
  * [x] Extract static item definitions, shop catalogs, and recipe matrices into `/src/data/` JSON or TypeScript data modules (`src/data/shops.json`).
  * [x] Ensure `/src/utils/` files contain strictly pure computation functions.

---

## 🛠️ Phased Remediation Plan (v4.3.0 Code Quality & Error Assertion Roadmap)

### Phase 5: Deep Quality Assurance & Error Assertion Hardening (v4.3.1) [COMPLETED]
* **Goal**: Replace silent null/empty default fallbacks across save/load, item lookup, and entity lookup functions with explicit error assertions and developer diagnostic logging.
* **Tasks**:
  * [x] Audit `useSaveLoad.ts` and `gameUtils.ts` to ensure corrupted/missing save data throws clear diagnostic errors rather than silent failure.
  * [x] Audit item/recipe/catalyst getter functions in `spellsAndEquipment.ts` and `shopData.ts` to throw descriptive errors when invalid IDs are passed.

### Phase 6: Test Suite Expansion & Sub-System Coverage (v4.3.2) [COMPLETED]
* **Goal**: Expand Vitest test suites from 36 tests to 53+ tests covering newly refactored components and engine hooks.
* **Tasks**:
  * [x] Add `src/tests/craftingAndAlchemy.test.ts` to test cooking recipes, potion brewing, catalyst infusions, and over-forge heat mechanics.
  * [x] Add `src/tests/storytellerAI.test.ts` to test GM mood shifts, tension scaling, boredom calculation, and manual encounter triggers.
  * [x] Add `src/tests/spellsAndMana.test.ts` to test spell scroll scribing, mana verification, and magic damage scaling.
  * [x] Add `src/tests/endToEndGameplaySimulation.test.ts` to test full 50-turn gameplay simulations, town commerce, guild HQ upgrades, scar acquisition, and state save validation.

### Phase 7: Dead Code Elimination & Cleanup (v4.3.3) [COMPLETED]
* **Goal**: Scan and prune deprecated, unused imports, vestigial wrapper functions, and redundant comments across the codebase.
* **Tasks**:
  * [x] Clean up deprecated wrapper imports in `/src/world/` and `/src/utils/`.
  * [x] Audit unused variables and dead UI paths in component trees.

---

## 🚀 Architectural Refactoring & Modular Engine Roadmap (v4.4.0)

### Phase 1: Data & Catalog Isolation (`/src/data/`) [COMPLETED]
* **Goal**: Move static data definitions out of utility files into dedicated, pure data modules inside `/src/data/`.
* **Action Items**:
  * [x] Extract monster definitions, stats, and drop tables into `/src/data/monsters.ts`.
  * [x] Extract equipment, consumables, and catalyst items into `/src/data/items.ts`.
  * [x] Extract crafting, alchemy, scroll, and cooking recipes into `/src/data/recipes.ts`.
  * [x] Extract sound effect definitions and audio mappings into `/src/data/soundCatalog.ts`.
* **Impact**: Makes adding new content (enemies, loot, recipes) fast, safe, and decoupled from engine logic.

### Phase 2: UI Component & Overlay Sub-Tab Modularization (`/src/components/`) [DONE ✔]
* **Goal**: Deconstruct large monolithic overlay panels (`GodPanelOverlay.tsx`, `CraftingPanel.tsx`) into modular sub-components.
* **Action Items**:
  * [x] **Phase 1 (GodPanelOverlay)**: Extract `GodHouseDesigner.tsx`, `GodNpcRoutePlanner.tsx`, `GodEnemyBlueprintEditor.tsx`, and `GodStructureCarver.tsx` into `/src/components/god/`.
  * [x] **Phase 2 (CraftingPanel)**: Extract `CookingTab.tsx` and `AlchemyTab.tsx` into `/src/components/crafting/`.
  * [x] **Phase 3 (Audio Engine)**: Deconstruct `/src/utils/audio.ts` into modular synthesizer and catalog modules.
  * [x] **Phase 4 (App Layout)**: Extract top-level HUD (`AppHeaderBar.tsx`) and Navigation (`AppNavigationTabs.tsx`) from `App.tsx`.
* **Impact**: Drastically simplifies UI maintenance, component reuse, and visual styling updates.

### Phase 3: Domain Custom Hooks Partitioning (`/src/hooks/`) [DONE ✔]
* **Goal**: Delegate stateful subsystems from `App.tsx` into domain-specific React custom hooks.
* **Action Items**:
  * [x] Extract audio state, gain node controls, and visualizer hooks into `/src/hooks/useAmbientAudio.ts`.
  * [x] Extract trade economy, shop inventories, and merchant transaction logic into `/src/hooks/useTradeEconomy.ts`.
  * [x] Extract quest progress, guild ranks, and mission dispatch tracking into `/src/hooks/useQuestsAndGuild.ts`.
  * [x] Extract dynamic weather, blood moon, and seasonal event ticks into `/src/hooks/useOverworldEvents.ts`.
* **Impact**: Transforms `App.tsx` into a lightweight, high-level layout wrapper.

### Phase 4: Unified Game State & Action Dispatchers (`/src/context/` & `/src/state/`) [DONE ✔]
* **Goal**: Consolidate top-level loose state variables into a structured state container / reducer pattern.
* **Action Items**:
  * [x] Create domain-specific state slices for player stats, inventory, world chunks, active NPCs, and UI overlays in `/src/context/` (`PlayerContext.tsx`, `WorldContext.tsx`, `CombatContext.tsx`).
  * [x] Provide clean, typed action dispatchers for atomic state updates (e.g., `dispatch({ type: 'HEAL_PLAYER', amount })`).
* **Impact**: Eliminates prop-drilling, prevents state desynchronization, and simplifies feature expansion.

### Phase 5: Test Suite Expansion & Regression Hardening (`/src/tests/`) [DONE ✔]
* **Goal**: Maintain 100% clean compilation baseline and expand Vitest coverage to all newly extracted modules.
* **Action Items**:
  * [x] Add unit tests for isolated data catalog queries in `/src/tests/dataCatalogs.test.ts`.
  * [x] Add hook integration tests for trade economy and quest state transitions in `/src/tests/hooksIntegration.test.ts`.
  * [x] Verify full end-to-end gameplay simulation tests continue passing with zero regressions (15 test suites, 62 unit tests passing).
* **Impact**: Ensures total confidence when refactoring and modifying core game systems.

---
*   [x] **Engine Deconstruction & Custom Hooks Extraction (v4.0.4)**: Extracted `useSaveLoad.ts`, `useKeyboardInput.ts`, `usePlayerMovement.ts`, `useCombatEngine.ts`, and `useEnemyAI.ts` from `App.tsx` into standalone modular hooks.
*   [x] **World Generators Isolation (v4.0.4)**: Modularized `dungeonGen.ts` and `overworldGen.ts` into `src/world/`.
*   [x] **Performance & Rendering Optimization (v4.0.4)**: Implemented FOV spatial hash memoization and `React.memo` component render boundary isolation.
*   [x] **Landing Page Tactical Primer Update (v4.0.3)**: Updated movement text to WASD or Numpad and added floor trap avoidance guidance in Tactical Primer instructions on the landing start screen.
*   [x] **Engine Performance Pass, 2D Canvas Minimap & Context State Optimization (v4.0.2)**: 2D Canvas migration for ChunkMinimap, fast squared distance raycasting, and canvas context font setup optimization.
*   [x] **Autonomous GM Engine, Replay Sim Dock, Chaos Natural Decay & Combat Rest Guard (v4.0.1)**: Default Autonomous GM mode enabled, minimizable Replay Sim bottom HUD dock, peaceful Chaos natural decay toward 20%, and campfire combat rest restrictions.
*   [x] **Phase 4 Performance, Render Isolation & Admin Editor Safety (v4.0.0)**: Spatial hashing FOV optimizations, React.memo render boundaries, and Admin Editor crash fixes.
*   [x] **Portable Blacksmith Anvil & Field Station Adjacency (v3.9.15)**: Deployable anvil station allowing equipment forging, mutation, and upgrades in the wild.
*   [x] **Codebase Architecture, Refactoring & Performance Optimizations (v3.9.16)**: Systemic cleanup and modularization of monolithic files.
These features are fully completed, integrated into our core engine, and balanced:

*   [x] **Visceral Kinematics & Damage Feedback (v2.9.9)**:
    *   [x] **Sprite-Shake Feedback**: Non-linear, staggered `@keyframes sprite-shake` animation triggered instantly whenever the player or any enemy takes damage. Uses hardware-accelerated CSS transforms to eliminate any lag or stutter.
    *   [x] **Fluid Blood Splatter Drips**: Fluid, drip-dropping HTML/CSS overlays matching exact coordinates of blood splatters. These feature high-fidelity vector shapes, smooth entrance scaling, and turn-based fading decay.
*   [x] **Wandering Factions & Lively Overworld (v2.5.0)**:
    *   [x] **Hostile Raider & Goblin Wild Camps**: Procedural camp layout structures generated on 25% of wilderness chunks. Features camp sentries, ambient campfires, and a specialized locked high-tier Camp Chest containing epic loot. Clearing the camp sentries triggers regional liberation, lowering regional danger, restoring town order, and granting +15 Town Reputation and +150 XP.
    *   [x] **Baron Tobias' Traveling Caravans**: Dynamic trade wagons parked procedurally on wilderness crossroads. Saving Baron Tobias from ambushing Rogue Bandits triggers a heroic victory, rewarding +250 Gold, +200 XP, +25 Town Reputation, and a permanent **Rare Trade License** (+30% profit on material/equipment sales, -20% discount on purchase prices in town).
    *   [x] **Dynamic Weather Hazards & Visual Effects**: Swirling sandstorms in deserts (reducing field of view to 2 tiles and decreasing combat accuracy) and howling blizzard whiteouts in tundras (restricting vision, slowing movement speed, and inflicting cold bite unless standing adjacent to campfires, indoor hearths, or ley shrines).
*   [x] **Drunk Wandering Merchant Seppo (Rare Surface Trader)**:
    *   [x] Procedural spawning on grass tiles in wilderness (non-town) chunks (4% chance upon chunk generation). Can spawn multiple times across different wilderness zones to reward exploration.
    *   [x] Sells Seppo's Secret Hooch 🍶 (+75 HP / +40 MP with hilarious drunk-state logs), Finnish Sisu Hammer 🪵 (High-damage weapon with +22% Critical Chance), and the Ever-Burning Flask 🛡️ (shield with defense and warmth properties).
    *   [x] Features unique voice/dialogue lines and randomized drunk responses when the player purchases his wares.
*   [x] **Migrating Wildlife Herds**:
    *   [x] Spawning of passive grazers (Deer 🦌, Boar 🐗, Mountain Goats 🐐) that roam procedurally, grazing on grass fields and fleeing dynamically when the player gets too close.
    *   [x] Harvesting Prime Wild Meat and Thick Wildlife Hides upon hunting.
    *   [x] Cooking Raw Prime Meat at campfires into Prime Flame-Grilled Steaks for massive stat replenishment (+60 HP/+15 MP).
*   [x] **Procedural Overworld (64x40 Jumbo Chunks)**:
    *   [x] Biome variance: Verdant Forests (🌲), Arid Deserts (🏜️), Frozen Tundra (❄️), and Soggy Swamps (🐊).
    *   [x] Seamless cardinal boundaries scrolling and old chunk caching state memory.
    *   [x] Map viewport HUD directional compass overlays (NORTH, SOUTH, EAST, WEST).
    *   [x] High-Performance standalone `ChunkMinimap` component modularization for zero parent re-renders and full type safety.
*   [x] **Atmospheric Day-Night & Weather Shading**:
    *   [x] Real-time 24-hour solar cycle tracking with dynamic ambient opacity filters.
    *   [x] Falling rain, snowy blizzards, and dense fog weather generators adapting to current biomes.
*   [x] **Interactive Points of Interest (POIs) - Choice Encounters**:
    *   [x] **Ley-Well Shrine (⛲)**: Offer silent prayer (restoring HP/MP), siphon core (risking backlash for Max MP bonuses), or pay gold tributes to gain town reputation and catalyst shards.
    *   [x] **Flame Lord Crucible (🔥)**: Stoke embers for rare Ember Cores, meditate for Max HP and Fire Catalysts, or quench the hearth to salvage iron ore and coal.
    *   [x] **Ancient Runed Monolith (📜)**: Decipher ancient runes for XP wisdom, commune with ancestral spirits for Unspent Attribute Points, or carve player names to grow town reputation.
    *   [x] **Sunken Keep Fortress (🏰)**: Scavenge fortress scrap metals, delve unstable vaults (risking cave-in damage for massive gold and shadow catalysts), or hoist alliance flags to gain town renown.
    *   [x] **Tectonic Beast Fossil (🦴)**: Exhume calcified marrow for permanent +2 DEF armor, channel primeval dragon soul for Max HP boosts, or extract catalyst crystal shards from sockets.
*   [x] **Persistent Multi-Floor Abyss (Floors 1-5)**:
    *   [x] Dungeon staircase entrances descending into deep, procedurally generated, trap-laden challenge floors.
    *   [x] Dynamic state serialization freezing idle floors, preserving disarmed traps, opened chests, and monster placements.
*   [x] **Double-Edged Dungeon Shrines & Curses (v3.2.0)**:
    *   [x] **Procedural Level Generation**: Places exactly 2 unique double-edged shrines or altars on every deep dungeon floor layout.
    *   [x] **Six Blessing & Curse Templates**: Implemented high-impact stat modifiers and curses (Forbidden Strength, Blind Oracle, Blood Transfusion, Covetous Greed, Reckless Berserker, Chrono-Shift) forcing tactical trade-offs.
    *   [x] **Interactive Action Banner**: Added a high-contrast interaction banner that displays adjacent untouched shrines and enables the player to pray and accept the sacrifice.
    *   [x] **Visuals & Turn Decay**: Integrates sound triggers, bouncing combat particle numbers, real-time status effect listings, and turn-by-turn curse duration decay.
*   [x] **Advanced Crafting & Catalyst Synthesis**:
    *   [x] Blacksmithing Arcanum workbench utilizing pure alloy minerals (Iron, Steel, Copper, Mithril, Obsidian) and alchemical catalysts (Fire, Frost, Poison, Lightning, Shadow).
    *   [x] Direct-to-backpack weapon and heavy armor plate assembly protecting active gear slots.
    *   [x] Cosmic Mutation Forge workbench enabling chaotic gear realignment (0.85x to 1.55x multipliers) with majestic prefixes and suffixes.
    *   [x] **Advanced Audio Synthesis & Soundscape Overhaul (v3.2.1)**:
        *   [x] Heavy-metal forging sound (`forge`) combining detuned ringing tones with procedural water quench hiss (AudioBuffer random white-noise).
        *   [x] Chaotic gear mutation sound (`mutate`) featuring a rapid 40Hz vibrato pitch sweep and glittering chimes.
        *   [x] Tool assembly sound (`craft`) using rhythmic wood-tapping triangle pulses and success notes.
        *   [x] Precision lockpicking mechanical feedback (`lockpick_click`, `lockpick_snap`, and heavy metal chest `unlock`).
*   [x] **Responsive Mobile Virtual Gamepad**:
    *   [x] Unified 8-directional tactical overlay D-Pad with diagonals, parry braces, and interact keys.
*   [x] **Visceral Kinetic Battles & Splatters**:
    *   [x] Knockback mechanics pushing entities into adjacent tiles.
    *   [x] Floaty damage particles, modular weapon stroke narratives, and morale panic flea AI for cowardly subspecies.
    *   [x] Entity-matched blood splatter stains (crimson mammalian, toxic green swamp rat, spectral cyan skeleton mages) with turn-based cellular decay.
*   [x] **Caravan Escort Travel (v3.2.3)**:
    *   [x] **Overworld Transit System**: Allows players to select destination towns on the world map and initiate a full turn-based Caravan Escort journey.
    *   [x] **Procedural Event Engine**: Employs an event resolver running 5 unique types of random road challenges: Bandit Ambushes, Dire Wolf Attacks, Rockslide Obstacles, Holy Pilgrim Blessings, and Broken Axles.
    *   [x] **Dynamic Roll Resolution**: Integrates d20 roll stat checks (Strength, Dexterity, Intellect, or Luck) and resource trade-offs (using up stored iron ore, wood boards, meat, or paying gold bribes) to safely bypass blockages.
    *   [x] **Renown & Treasury Multipliers**: Successfully reaching the destination awards large gold bounties, town reputation renown, and explorer XP.
*   [x] **Grimoire Magic Spell Tuning (v3.2.4)**:
    *   [x] **Automated Grimoire Overlay**: Dynamically injects a beautiful spell-selector grid in the player's active weaponry sidebar whenever they equip a staff or wand weapon.
    *   [x] **Interactive Spell Choices**: Allows immediate, tactful swapping of active magic spells: Fireball, Icicle, Lightning Shock, Poison Dart, and Shadow Orb.
    *   [x] **Wand Mana Conservation**: Automatically reduces mana-point (MP) requirements for all spells when channeling magic through delicate wands (with a floor of 2 MP).
    *   [x] **Real-Time Synergy Logs**: Directly displays updated spell descriptions, dynamic costs, and spellcast flavor strings in the chronicle logs.
*   [x] **Dynamic Faction Wars & Territory Conquest (v3.5.0)**:
    *   [x] **Procedural Faction Territories**: Implemented five regional zones (Borderlands, Shadow Fjord, Moonshadow Cove, Sunplate Ridge, Swamp of Whispers) tracking controller, control percentage, and accumulated tax products.
    *   [x] **Faction Conquest & War Room UI**: Created a rich Faction Conquest & War Room tab within the Guild Overlay, displaying visual control percentage gauges, active biome bonus alerts, and passive tax boxes.
    *   [x] **Passive Tax Collection Loops**: Programmed a per-turn background taxation module generating gold and craft ingredients for controlled zones, claimable anytime directly by the player.
    *   [x] **War Treasury Contributions**: Enabled reputation-aligned players to donate gold to their respective faction's War Treasury, instantly increasing faction standing and standing reserves.
    *   [x] **Tactical War Directives**: Enabled strategic spending of Faction War Treasury funds to deploy powerful faction-wide directives (Vanguard Shield Array, Syndicate Supply Poisoning) that influence territory control.
    *   [x] **Dynamic Defeat Territory Integration**: Defeating enemies on the overworld dynamically updates control ratios of nearby territories, creating a live tug-of-war world state.
*   [x] **Legendary Feline Companions & "Cat Lover" Developer Memorial (v3.9.8)**:
    *   [x] **Four Legendary Overworld Cats**: Programmed rare deterministic spawning of unique legendary felines on overworld chunks (Jekku, Pulla, Alli, Leevi), each with custom stats, visual colors, and unique combat capabilities.
    *   [x] **Detailed Companion Personas**: Configured specialized personalities and temperaments that players can inspect under the active retainer overlay modal.
    *   [x] **"Cat Lover" Memorial Trait**: Meeting or recruiting all four legendary cats awards the player a special permanent "Cat Lover" trait granting **+10 Luck** in memory of real-life feline companions. Added a dedicated emerald-glowing status card inside the main inventory status panel.

---

## 🚀 2. Town Progression & Renown Expansion (Planned: v2.5.5) (COMPLETED ✔)
Expand on the town ecosystem, making the local community feel reactive to player choices, crime, and wealth:

*   [x] **Comprehensive Renown Milestones**:
    *   [x] *Sunder Outlaw (0-20 Reputation)*: Town merchants refuse to trade; town guards deploy aggressive patrol units to hunt the player on sight.
    *   [x] *Wandering Mercenary (21-50 Reputation)*: Standard trade rates; unlocks simple bounty hunts.
    *   [x] *Champion of Sunder (81-100 Reputation)*: Unlocks a permanent 20% discount; enables recruiting elite heavy-plate city guards as companions; triggers special vendor stock.
*   [x] **Blacksmith & Apothecary Infrastructure Upgrades**:
    *   [x] Donate Gold and raw Alloys (Steel, Mithril, Obsidian) to the village blacksmith to upgrade the forge's Tier, unlocking advanced Legendary tier crafting templates.
    *   [x] Supply the apothecary with wild berries and catalyst shards to unlock higher-grade potions.
*   [x] **Tavern Rumor-mongering & Gossip**:
    *   [x] Spend Gold to purchase a flagon of Frothy Beer Mug for the bartender to receive "Wilderness Rumors". Marks the exact coordinates of hidden tombs or high-yield loot chests on the player's map.
    *   [x] Hire wandering mercenaries at the bar who scale in level based on the player's current renown level.

---

## ⛏️ 3. Life Skills, Nodes Harvesting & Brewing (v2.6.0) (COMPLETED ✔)
Expand on gathering and alchemical systems, giving the player rewarding side activities on the surface:

*   [x] **Lumberjacking & Mining Nodes**:
    *   [x] Spawn harvestable Pine/Birch trees and Rich Copper/Iron mineral veins on overworld chunks.
    *   [x] Striking the resource nodes with your equipped weapon lets the player manually harvest wood and raw ore.
*   [x] **Gourmet Alchemical Cooking**:
    *   [x] Introduce custom cooking recipes near campfires: combining harvested fish, wild berries, and boar meat with catalyst shards produces powerful food buffs (e.g., *Lightning Grilled Salmon*, *Spicy Crimson Salmon*, *Glacial Frost Ribs*, and *Shadow Smoked Jerky*).
*   [x] **Apothecary Alchemical Brewing & Lab Upgrades**:
    *   [x] Utilize alchemical workbenches inside the Life Skills Panel to brew potent elixirs (Regenerative Dew, Hyper Focus, Ironheart Fortitude, Shadow-Warp Void) that permanently increase your core attributes.
    *   [x] Upgrade your alchemical workstation from Tier 1 to Tier 3 using gold to unlock increasingly powerful formulae.

---

## 🏺 4. Advanced Trade Economy & Guild Houses (Planned: v2.7.0) (COMPLETED ✔)
Deeper world economy mechanics, player housing, and regional faction guilds:

*   [x] **Fluctuating Trade Markets**:
    *   [x] **Biome-Based Supply & Demand**: Wood, metals, potions, and catalysts scale in price and sell values dynamically based on the current active biome (e.g., raw wood sells for massive gold in the arid Desert; alchemical catalysts sell at premiums in the Frozen Tundras; Hooches spike in freezing blizzards).
    *   [x] **Dynamic Pricing Badges**: Real-time price fluctuations shown in trade booths, complete with color-coded rate badges (e.g., "▲ +40% premium", "▼ -20% surplus").
*   [x] **Guild House & Safehouses**:
    *   [x] **Sunder Guild Headquarters**: Found an expansive base of operations in Oakhaven Port Town for 500 Gold, unlocking modular lab upgrades, passive decoration buffs, and companion expeditions.
    *   [x] **Modular HQ Upgrades**: Invest gold and materials (iron, mithril, wood, etc.) to research:
        *   *Sunder Logistics Deals*: Increases material sell values by +20% per rank (Max Rank 3).
        *   *Expedition Map Room*: Accelerates companion autonomous scouts by +25% speed per rank (Max Rank 3).
        *   *Cooperative Bargaining*: Grants a passive -5% discount on vendor purchase transactions per rank (Max Rank 3).
    *   [x] **HQ Sanctuary Decorations**: Purchase and install permanent artifacts like the *Ambient Leystone Hearth*, *Oracle Crystal Orb*, *Champion Trophy Pedestal*, and *Sunder Vanguard Banner* to display inside your home and activate passive game multipliers.
    *   [x] **Wilderness Safehouses & Storage Chests**: Secure secure safehouses in any wilderness chunk for 300 Gold. Access deep-storage vaults to stash/retrieve raw materials, alchemical catalysts, and weapon/armor equipment across the overworld.
*   [x] **Secret Factions & Special Blueprints (The Moonshadow Syndicate & Dawn Vanguard)**:
    *   [x] **Faction Reputations**: Track standing from -100 to +100 with rival guilds. Unlocks upon completing companion dispatch operations or clearing enemy encampments.
    *   [x] **Special Blueprints**: Join an alliance once reputation reaches 40 to unlock the forge crafting recipes of elite faction gear:
        *   *Moonshadow Assassin Dirk*: High damage poison dagger.
        *   *Shadow Cowl*: Increases crit rate and shadow defense.
        *   *Dawn Vanguard Aegis*: Heavy iron/mithril shield.
        *   *Vanguard Sunplate*: Heavy defensive plated chestplate.
*   [x] **Companion Quest Board (Autonomous Dispatch)**:
    *   [x] Select idle standby followers to embark on high-reward autonomous scouting missions (e.g. *Border Patrol*, *Crimson Canyon Excavation*, *Apothecary Supply*).
    *   [x] Followers automatically travel and advance their steps with every overworld movement turn the player executes.
    *   [x] Safely claim massive rewards (Gold, XP, and materials) when companions return.

---

## 🛠️ 6. Developer Guidelines & Modular Tools (Dev Docs)
Everything is implemented with maximum modularity. Below is the blueprint map of how to add more content easily:

### A. File Structures
- **`/src/utils/tradeEconomy.ts`**: The central configuration engine. All raw formulas, biome price tables, guild upgrades, sanctuary decorations, companion missions, and faction gear blueprints are defined here as standard, structured array registries.
- **`/src/components/GuildOverlay.tsx`**: The modular UI overlay component. Self-contained sub-views (`hq`, `sanctuary`, `stash`, `factions`, `dispatch`) communicate cleanly via standard React props without polluting the main core loop.

### B. How to Add More Material price multipliers
In `/src/utils/tradeEconomy.ts`, simply insert a new rule inside the `BIOME_PRICE_MULTIPLIERS` record:
```typescript
export const BIOME_PRICE_MULTIPLIERS: Record<string, Partial<Record<'forest' | 'desert' | 'tundra' | 'swamp', number>>> = {
  // Example: Your custom material
  mat_my_alloy: {
    desert: 1.80, // Sells for 80% more in the desert!
    tundra: 0.60  // Abundant in the tundra, sells for 40% less.
  }
}
```

### C. How to Add a New Guild Upgrade
In `/src/utils/tradeEconomy.ts`, add a new object to the `GUILD_UPGRADES` list:
```typescript
export const GUILD_UPGRADES: GuildUpgrade[] = [
  {
    id: 'up_custom_research',
    name: 'Advanced Combat Drills',
    desc: 'Increases companion attack points by +2 per rank.',
    maxLevel: 3,
    costGold: 200,
    costMaterials: { 'mat_iron': 3 }
  }
];
```

### D. How to Add a Companion Expedition Mission
In `/src/utils/tradeEconomy.ts`, append a new mission template inside `COMPANION_QUEST_BOARD`:
```typescript
export const COMPANION_QUEST_BOARD: CompanionQuest[] = [
  {
    id: 'q_abyss_scout',
    title: 'Abyss Entrance Reconnaissance',
    desc: 'Scout the deep entry fissures for rare magical catalysts.',
    turnsRequired: 50,
    rewardGold: 180,
    rewardXp: 120,
    rewardMaterials: { 'cat_fire': 1, 'mat_steel': 2 }
  }
];
```

---

## ⚖️ 5. Dynamic Combat Challenge & Fun-Tuning Mechanics (v2.8.0) (COMPLETED ✔)
Systems designed to dynamically scale combat difficulty, introduce strategic risk-versus-reward toggles, and elevate general playability without creating frustrating power walls:

*   [x] **Dynamic "World Events" Turn-Ticker**:
    *   [x] **Blood Moon Celestial Rift (Every 300-550 turns)**: A dramatic, atmospheric sky coloration event. Monsters become highly aggressive and gain lifesteal but drop double crafting catalysts.
    *   [x] **The Alchemical Loot Goblin**: A non-aggressive wandering sprite with a custom icon. It flees frantically upon sensing the player; hitting it causes it to drop random alloys and catalysts on every hit before vanishing.
*   [x] **Tactical "Stamina & Campfire Rest" Loops**:
    *   [x] Combat maneuvers, heavy weapon swings, or spellcasting builds up physical exhaustion (reducing active dodge/crit rates by up to $15\%$).
    *   [x] Rest at cozy safehouses, pitch a temporary wilderness campfire, or spend gold at the Any Tavern to fully purge exhaustion, restoring tactical fighting peaks.

---

## 🌊 6. Ocean Exploration, Shipwrighting & Sea Monsters (Planned: v3.0.0)
Enter the high seas with modular ships, floating outposts, and deep sea dungeons:

*   [ ] **Oceanic Archipelagos & Sailing**: Generate infinite marine water chunks representing deep blue seas populated with pirate coves, tropical islands, and volcanic vents.
*   [ ] **Ship Hull Crafting**: Design hulls using customized Alloys (e.g., Obsidian Armor-Plated Galleons) with custom canons, sails, and anchor attachments.
*   [ ] **The Kraken Leviathan Boss**: Battle giant multi-tile sea monsters that drag companions into the deep unless stunned by heavy-projectiles.

---

## 🎮 7. Interactive Minigames & Tavern Activities (Planned: v2.9.0)
Enhance life skills, dungeon crawling, and town downtime with interactive, skill-based minigames:

*   [x] **Drunk Patrons in Inns & Taverns**:
    *   [x] Spawn interactive Drunk Patrons (e.g., *Drunk Seppo*, *Uncle Pete*, *Tipsy Toby*) inside every overworld town's Inn/Tavern with a custom Flushing Cheek (`🥴`) icon.
    *   [x] Sit down at the table to buy them a draft of Ale (-10 Gold) to hear rumors, receive materials, or gain the *Drunken Cheer* Critical Strike buff.
    *   [x] Play *Sunder Coin Toss* heads-or-tails wagers with them (Bet: 5 Gold) or slap them awake for wild, unpredictable outcomes!
*   [x] **1. Lockpicking / Vault Cracking Mini-game (Dungeon & Camp Chests)**:
    *   [x] Replace simple locked chests with a fully interactive "sweet-spot" lockpicking interface.
    *   [x] Use lockpicks crafted from iron/copper wires to tension the lock and find the break-point.
    *   [x] Failing or snapping a pick risks triggering a poison needle trap or alerting nearby dungeon sentries.
    *   [x] Perfect, clean unlocks yield bonus ancient gold coins or pristine catalyst crystals.
*   [x] **4. Tavern Dice & Card Gambling ("Sunder-Gambit")**:
    *   [x] Sit down at town taverns or campsite hearths to play wagering minigames against Drunk Seppo, guild master, or mercenary recruits.
    *   [x] Stake your gold, metal alloys, or prized equipment on tactical dice rolling or card matches.
    *   [x] Outsmarting master tavern gamblers unlocks top-tier cooking/brewing recipes and exclusive recruitment vouchers.

---

## 🧪 8. Client-Side Virtual Smoke Test Runner (v2.9.5) (COMPLETED ✔)
Implement an in-browser automated playthrough simulator to programmatically verify core game loop stability, rendering safety, state persistence, and regression safety.

### A. Architectural Overview
The **Virtual Smoke Test Runner** runs entirely client-side, controlled via the developer's **GOD Panel Overlay** or **GM Storyteller Terminal**. When activated, the runner takes programmatic control of the character state, overriding physical user key inputs, and rapidly executes sequences of game actions at high tick speeds.

### B. Core Testing Sequences (The Run Steps)
*   [x] **1. Spatial Navigation & Scrolling Test**: Programmatically walk the player in a 5x5 pattern, crossing overworld chunk boundaries to verify seamless chunk caching, map redrawing, and biome change rendering.
*   [x] **2. Resource Gathering & Harvest Check**: Detect adjacent Pine Trees or Iron Veins, trigger mineral vein mines, and assert that wood & iron ore are deposited into the backpack inventory.
*   [x] **3. Campfire Placement & Rest Verification**:
    *   [x] Check inventory for Scrap Wood, trigger custom camping functions, and verify campfire successfully occupies adjacent map coordinate.
    *   [x] Suffer deliberate Exhaustion, stand next to campfire, rest, and assert that Exhaustion value is purged back to 0%.
*   [x] **4. Tavern Social & Betting Loop**:
    *   [x] Find a patron, trigger Sunder Coin Toss wager with random results, and assert gold is deducted/added correctly.
    *   [x] Buy Ale, confirm deduction of 10 Gold, and verify the *Drunken Cheer* (+10% Crit) buff is added to active player statuses.
*   [x] **5. Guild Hall Upgrades & Treasury Allocations**: Open Sunder Guild Headquarters, unlock license, buy Guild Keep upgrades and deep vault space expansion.
*   [x] **6. Bounty Board Quest Tracking**: Accept the 'Hunt Swamp Crawlers' bounty from the Oakhaven Board, verify active status logging, and simulate quest turn-in claiming XP and reputation.
*   [x] **7. Companion Dispatch Operations**:
    *   [x] Recruit a companion via the GOD Panel.
    *   [x] Select idle companion and dispatch them on a scout expedition.
    *   [x] Advance simulator clock and verify companion returns with correct spoils (Gold, XP).
*   [x] **8. Survival Cooking & Alchemy Brewing**: Spend materials to cook raw meat into Cooked Meat and brew elemental flame catalyst elixirs.
*   [x] **9. Waterfront Angling Cast & Hook**: Cast rod next to deep riverbeds, trigger bite Hook event, and secure a rare Salmon inside the food storage.
*   [x] **10. Deep Dungeon Descent & Trap Mitigation**: Traverse levels downward, enter Level 2 underground dungeons, trigger pressure plates, and disarm dangerous poison floor traps.
*   [x] **11. Combat AI Pursuit & Fight Routine**:
    *   [x] Spawn Goblin Raider.
    *   [x] Verify the Goblin switches to chase state and moves closer.
    *   [x] Perform mutual strikes, verifying blood decals spawn, damage indicators float, and hostile dies.
*   [x] **12. Sleep Cycle & Stat Regeneration**: Setup unrolled bedroll shelter, initiate overnight sleep sequence, advance world time, restore HP/MP, and gain Well-Rested buff.

### C. Assertions & Log Terminal UI
*   [x] **Live Debug Output**: Rendered a dedicated diagnostics terminal alongside the canvas displaying test logs with beautiful contextual colors.
*   [x] **One-Button Sandbox Suite**: Start, pause, or clear logs at any time from the God panel with visual step progress indicators.

---

## 🧪 9. Domain-Specific Engine Modularization & Code Cleanup (v3.6.7) (COMPLETED ✔)
Decouple complex game loop configurations, constants, prices, formulas, and state synchronizers from visual React layout files to optimize project scalability, code maintainability, and compilation speeds.

*   [x] **Weather Cycle Meteorological Engine (`/src/utils/weatherEngine.ts`)**:
    *   [x] Establish standard climate properties (Sunny, Rainy, Foggy, Snowy, Sandstorm, Blizzard).
    *   [x] Implement biome-aware weather weighting, forged equipment immunities, movement speed constraints, and active combat/spellcasting modifiers.
*   [x] **Magical Arcanum & Spells Setup (`/src/utils/spellsAndEquipment.ts`)**:
    *   [x] Modularize spell metadata (Arcane Bolt, Pyroblast, Frostbite Lance, Storm Strike, Poison Dart, Shadow Orb) including element matching, splash/ignition, and mana counts.
    *   [x] Configure standard starting gear lists and inventory loadout templates.
*   [x] **Market Trade Inventories & Shop Stocks (`/src/utils/shopData.ts`)**:
    *   [x] Decouple trade item descriptions, base material prices, and blacksmith weapon/armor inventory configurations.
    *   [x] Define specific items stocked by General Traders, taverns, and Seppo's secret moonshine shop.
*   [x] **Fleeing Dialogue Generation (`/src/utils/fleeQuotes.ts`)**:
    *   [x] Procedurally compute random, flavor-rich panic text spoken or yelled by cowed wildlife, skeletons, or goblin bandits attempting to escape player pursuit.
*   [x] **Caravans & Territory Conquest Synchronizer (`/src/utils/caravanAndTerritory.ts`)**:
    *   [x] Unify overworld caravan spawning, movement paths, traveling guard assignments, and regional faction coordinate controls.

---

## ⛰️ 10. Declarative World Generation & Meteorological Settings (v3.6.8) (COMPLETED ✔)
Externalize all procedural map generation and weather logic constraints to a structured JSON file, separating environmental math parameters from the code base for improved custom balance control.

*   [x] **Declarative Overworld Configuration (`/src/data/worldConfig.json`)**:
    *   [x] Establish standard JSON-based database for overworld parameters.
*   [x] **Dynamic Whittaker Biome Mapping**:
    *   [x] Transition `getOrganicBiome` boundary conditions to fetch temperature and moisture cutoffs from JSON.
*   [x] **Climate Occurrence Frequencies**:
    *   [x] Transition hardcoded overworld weather picks to sample a cumulative frequency matrix weight model.
*   [x] **Dynamic Wilderness Features & Hazards**:
    *   [x] Unify lake counts, minimum/maximum lake radiuses, trap frequencies, trap hazards (Spikes, Fire, Poison), chest frequencies, and roaming monster density from configured biome constants.

---

## 🌲 11. Finnish Mythology Enemies & Rare World Bosses (v3.6.9) (COMPLETED ✔)
Successfully integrated immersive Finnish mythological entities as fully responsive overworld enemies and rare legendary bosses, complete with custom stats, thematic spellcasting behaviors, localized biome spawns, and specialized loot drops.

*   [x] **Enemy Roster Implementation**:
    *   [x] **Hiisi Forest Fiend (`Hiisi`)**: Added melee woodland rock-demons to the standard bestiary.
    *   [x] **Näkki Water Kelpie (`Nakki`)**: Configured ranged water-spellcasting entities with custom cyan water blasts.
    *   [x] **Otso the Honey-Paw (`Otso`)**: Crafted a majestic high-vitality forest king boss spawning rarely on overworld grass.
    *   [x] **Louhi, Mistress of Pohjola (`Louhi`)**: Added a legendary frost-shaping Northland boss carrying powerful projectile storms.
*   [x] **Thematic Projectile & Combat Behaviors**:
    *   [x] Registered `Nakki` and `Louhi` as active spellcasters within the enemy AI chase-loop.
    *   [x] Injected custom projectile elements (`water_blast` and `frost_storm`) with matching color palettes and impact texts.
*   [x] **Specialized Loot & Legendary Item Drops**:
    *   [x] Defined guaranteed and high-tier drop matrices for all four creatures.
    *   [x] Designed the mythical *Sampo Fragment* (cosmic wealth generator), *Otso's Heavy Fur-Plate* (high defense warm armor), and *Louhi's Runed Frost Staff* (frost-amplifying magic catalyst).
*   [x] **Ecosystem Integration & Dynamic Spawning**:
    *   [x] Integrated Finnish mythology spawning into biome-aware probability checks within `src/utils/overworld.ts`.
    *   [x] Configured rare boss triggers for `Otso` (Forest) and `Louhi` (Tundra) to surprise intrepid explorers.

---

## 🛡️ 12. Enchanted Forged Artificer & Exotic Gear Overhaul (v3.7.0) (COMPLETED ✔)
Successfully retired the legacy overworld riding mounts system and implemented an elegant "Forged Enchantments" passive armor trait system.

*   [x] **Mount Retirement**:
    *   [x] Safely decoupled all variables, state pointers, and logic handlers referring to mounting/dismounting riding steeds.
*   [x] **Artificer Caravan Merchant Integration**:
    *   [x] Replaced overworld traveling breeders with an Enchanted Artificer traveling merchant.
    *   [x] Configured custom inventory pricing and shop stock maps.
*   [x] **Passive Forged Enchantment Traits**:
    *   [x] Designed trait-bearing items: *Stallion-Sprung Greaves* (Stallion Speed), *Dune-Treader Sabatons* (Desert Immunity), *Worg-Spiked Gauntlets* (Worg Force), and *Crocodile Bayou Sabatons* (Swamp-Glide).
*   [x] **Aesthetic Active Status UI**:
    *   [x] Created a specialized active "Forged Enchantments" list display under the player HUD detailing all active equipped attributes with custom indicators.
*   [x] **Weather Immunity Synchronization**:
    *   [x] Synced meteorological penalties and overworld fatigue check systems to read active equipment traits for dynamic immunity.

---

## 🚍 13. Caravan Escort Hardcore Scaling & Versatile Safehouse Companions (v3.8.0) (COMPLETED ✔)
Successfully scaled Caravan Escort travel hazards to extreme difficulty, integrated interactive tab scroll controllers, added the Scroll of Recall as rare overworld loot, unified the Hero Profile with active battle scars, and retired the strict Merchant Guard archetype requirement for safehouses, allowing any companion follower to guard remote depots.

*   [x] **Hardcore Caravan Escort Difficulty Scaling**:
    *   [x] Increased random road encounter frequencies to a near-guaranteed **85%** per turn step.
    *   [x] Heightened d20 stat check difficulties (DC 17-19, up from 14-16) for handling bandit ambushes, rockslides, and animal blockages.
    *   [x] Inflated Gold bribe costs (500g, up from 250g) and material costs (15x berries, 8x iron ore, 18x planks) for peaceful choice resolutions.
    *   [x] Doubled failure penalties: failing combat checks now inflicts up to -28 HP damage and up to +45% physical Exhaustion.
*   [x] **Universal Companion Safehouse Guarding**:
    *   [x] Retired the rigid requirement where safehouse structures required a specialized *Merchant Guard* archetype.
    *   [x] Allowed **any companion follower** in the player's active party to be appointed as the safehouse guardian.
    *   [x] Programmed safehouse outposts to preserve the chosen companion's specific name, character icon (`char`), and custom visual color.
    *   [x] Added dynamic localized dialogue greetings that mention the companion by name.
*   [x] **Horizontal Navigation Tab Discoverability Controllers**:
    *   [x] Integrated clickable left (◀) and right (▶) arrow buttons overlaying the tab bar, enabling instant smooth, hardware-accelerated scroll operations.
    *   [x] Eliminates any discovery or scrolling difficulties for desktop and mobile players.
*   [x] **Scroll of Recall Loot Injection & Teleportation**:
    *   [x] Added the rare `scroll_town_recall` (Scroll of Recall) to Seppo's drunk merchant shop and chest drops (5% rare loot chance).
    *   [x] Implemented a full-screen teleportation overlay `/src/components/RecallScrollOverlay.tsx` to instantly recall to Oakhaven Town, Central Outpost, or any established Wilderness Safehouses.
*   [x] **Hero Profile & Scar Overlay Integration**:
    *   [x] Integrated the hero character sheet into the main "Hero Profile, Party & Backpack" tab.
    *   [x] Added a real-time battle scar counter that renders visual wound scratch overlays on the avatar paperdoll wireframe based on player scars.

---

## 🛡️ 14. Dual-Hand Combat Durability & Gauntlets/Neck Piece Armor Separation (v3.8.6) (COMPLETED ✔)
Overhauled physical weapon and shield combat durability degradation systems to correctly track damage across both slots, separated Gauntlets and Neck Pieces into distinct independent equipment categories with separate recipes and paperdoll slots, and introduced damage-based inventory sorting in the blacksmith repair shop.

*   [x] **Dual-Hand Combat Durability Overhaul**:
    *   [x] Reconfigured attack and block execution to correctly reduce durability for both Right Hand (weapon) and Left Hand (shield/weapon) slots.
    *   [x] Accounted for broken weapons, shield absorption rates, and dual-wielding, computing total damage dynamically in `effectiveWeaponDamage`.
*   [x] **Gauntlets & Neck Piece Separation**:
    *   [x] Split the combined slot configuration to establish **Gauntlets** (`Gloves` type, 🧤 emoji) and **Neck Pieces** (`Amulet` type, 📿 emoji) as two completely distinct items.
    *   [x] Implemented dedicated slots, shop configurations, crafting formulas, alchemical mutations, and unequip callbacks for both items.
*   [x] **Smart Repair Shop Inventory Sorting**:
    *   [x] Configured the blacksmith repair shop backpack list to prioritize equipment repairs by sorting broken items (0% durability) to the absolute top, followed by damaged gear, and pristine gear at the bottom.

---

## 🛡️ 15. Universal Equipment Loot Drops & Rare Necklace Probability (v3.8.7) (COMPLETED ✔)
Overhauled procedurally generated drops and chest contents to ensure all gear classes (helmets, gauntlets, boots, shields, armor, weapons) drop correctly under their matching subtypes for slot compatibility, and configured necklaces/amulets as rare, rewarding discoveries.

*   [x] **Universal Gear Looting**:
    *   [x] Implemented `generateRandomLootGear` to proceduralize all standard and high-tier equipment drops (weapons, shields, gloves, helmets, boots, body armors) mapping to their corresponding subType.
    *   [x] Overhauled chest opening rewards to roll from the universal equipment table (30% chance) with rare necklace probability filters.
*   [x] **Rare Necklace Balance**:
    *   [x] Tuned Amulet/Necklace drops to roll with a rare 5% chance from common mobs and a balanced 10-15% chance in treasure caches.
*   [x] **Legendary Boss & Dragon Treasure Scaling**:
    *   [x] Pre-defined explicit drop parameters for Surtur, Otso, Louhi, and Elder Wyrms so that boss gear maps to correct paperdoll slots with unique lore descriptions and color modifiers.

---

## 🛡️ 16. Immersive Storyteller Narratives & Tiered Loot Rarity (v3.8.8) (COMPLETED ✔)
Overhauled all active Game Master (GM) and God actions to maintain total player narrative immersion inside logs, and integrated a robust tiered loot quality system to ensure premium weapons/armor scale correctly and are scarce.

*   [x] **Organic Narrative Log System**:
    *   [x] Translated all player-facing output messages for GM commands, alchemical meteor strikes, or God actions from third-person labels to immersive overworld events.
    *   [x] Implemented descriptive natural logs (e.g., healing breezes, sudden alchemical alignment surges, seismic plate shifting) instead of fourth-wall-breaking indicators.
*   [x] **Tiered Loot Rarity Quality Matrix**:
    *   [x] Engineered a 5-tier loot rarity matrix within the procedural generator: Common (65%), Uncommon (22%), Rare (10%), Epic (2.5%), and Legendary (0.5%).
    *   [x] Made high-tier gear drop significantly rarer to fulfill high rarity specifications.
    *   [x] Enabled custom, stylistic naming prefixes, color-coded item indicators, and scaled equipment damage/defense and gold prices based on the rolled rarity.

---

## 🛡️ 17. NPC Coordinate Sanitization & Wall Spawn Prevention (v3.8.9) (COMPLETED ✔)
Engineered a comprehensive overworld layout-safety validation system to guarantee NPCs never spawn or relocate inside walls, mountains, trees, water, or other solid layout geometry.

*   [x] **Safety-First Block Filter**:
    *   [x] Added filter rules classifying blocked tiles (Wall, Window, Tree, PineTree, BirchTree, CopperVein, IronVein, Water, Table, Campfire, Empty).
*   [x] **Robust Spiral Search Pathfinding**:
    *   [x] Integrated a 20-tile scanning spiral search to relocate overlapping NPCs to safe walkable spaces.
*   [x] **Schedule Path Synchronization**:
    *   [x] Aligned active position and schedule points (`homeX`/`homeY`, `workX`/`workY`) so NPCs do not clip through structures during day/night transits.

---

## 🛡️ 18. Safe Player Spawning & Companion Faction Targeting (v3.9.0) (COMPLETED ✔)
Engineered player-character coordinate safety constraints to prevent getting stuck in natural structures or stone walls upon spawning, and refined the companion AI targeting routine so followers do not engage friendly or neutral NPCs unprovoked.

*   [x] **Universal Player Spawning Safety**:
    *   [x] Integrated the 20-tile scanning coordinate sanitizer `findNearestSafePlayerTile` into player repositioning event handlers.
    *   [x] Guaranteed safe coordinates during initial layout placement, cardinal border crossovers, caravan escort completions, and Recall Scroll teleports.
*   [x] **Follower Faction Target Filtering**:
    *   [x] Configured companions (such as special cats) to ignore town guards, law enforcers, and caravan defenders unprovoked.
    *   [x] Enabled dynamic join-in combat behavior immediately when the player provokes and attacks guards (setting the global `areGuardsHostile` state to true).

---

## 🛡️ 19. Faction Watchtower Garrisons, Tribute Chests & Siege Reprisals (v3.9.1) (COMPLETED ✔)
Establish high-altitude overworld watchtowers guarded by elite Syndicate and Vanguard faction garrisons, featuring rare faction-locked tribute chests, capture-the-flag overworld claim mechanics, and dynamic siege reprisal events.

*   [x] **Watchtower World Generation**:
    *   [x] Spawn procedurally generated Watchtower structures at crossroads and boundary bottlenecks in specific wilderness chunks.
    *   [x] Render custom stone battlements, archer arrow slits, barricades, and elevated observation decks.
*   [x] **Elite Garrison Defenders & Active Attackers**:
    *   [x] Populate each tower with elite, high-HP faction-specific defenders (Vanguard Knights, Syndicate Enforcers, and Tower Rangers).
    *   [x] Implement ranged defense logic so sentinel archers and attackers rain specialized arrows when hostiles approach, using active chasing AI.
*   [x] **Faction Tribute Chests & Flag Capture**:
    *   [x] Place a locked "Faction Tribute Chest" inside the central watchtower vault, requiring a unique Watchtower Key dropped by the Tower Commander.
    *   [x] Capture-the-Flag overworld claiming: Defeating the active garrison allows players to hoist their chosen guild/faction flag, turning the tower into a friendly safe haven that spawns allied reinforcements and produces tax tribute over time.
*   [x] **Dynamic Active Siege Reprisals**:
    *   [x] Spawn dynamic reprisal sieges where rival factions launch assaults on claimed watchtowers.
    *   [x] Render a beautiful live HUD status sidebar for tracking active watchtower sieges, displaying timers, combat states, and defender/attacker counts.

---

## 🛡️ 20. Custom Structure Carving & Legend-Mapped Blueprint Designer (v3.9.2) (COMPLETED ✔)
Establish a customizable structural constructor and layout designer, enabling developers and players to carve predefined layout templates (Spawn Shelters, Arenas, Groves, Portals, and Watchtowers) with dynamic enemies, and load non-standard layout characters into standard designer slots using a custom legend dictionary.

*   [x] **Modular Structure Placer & Presets (`structurePlacer.ts`)**:
    *   [x] Implemented six predefined structure templates: *Cozy Spawn Shelter*, *Fenced Combat Arena*, *Mystic Dungeon Portal*, *Berry Forest Grove*, *Royal Tavern & Lounge*, and *Faction Watchtower Outpost*.
    *   [x] Created the `carveStructure` routine which instantiates custom structures at chosen coordinates with boundary validation checks.
    *   [x] Built support for embedding dedicated enemy markers (`enemies` array in presets) to spawn custom/elite entities upon carving.
*   [x] **Dynamic Legend Mapping in Designer**:
    *   [x] Configured `handleLoadPresetToDesigner` in `GodPanelOverlay.tsx` to read the custom `legend` mapping on blueprints.
    *   [x] Dynamically maps non-standard characters from presets (e.g. `W`, `S`, `K`, `F`, `X`, `+` in Watchtowers) to standard, editable designer tiles (e.g. Wall, Window, Floor, etc.) prior to grid loading.
    *   [x] Resolves loading limitations and guarantees seamless custom settlement blueprint carving and rebuilding in real-time.
*   [x] **Sovereign Save & Live Rebuild**:
    *   [x] Leveraged `handleApplyHousesJson` to allow saving, editing, and immediate live rebuilding of the active overworld settlements.

---

## 🛡️ 21. Wilderness Traveling NPCs & Crime Witness System (v3.9.3) (COMPLETED ✔)
Introduce interactive, role-appropriate traveling NPCs across the overworld wilderness with a proximity-based visual crime witness system that enforces reputation laws for assault crimes.

*   [x] **Wilderness Traveling NPCs**:
    *   [x] Organically spawns specialized traveling NPCs (Wilderness Hunters `🏹`, Wilderness Herbalists `🌿`, and Traveling Pilgrims `🚶`) in non-town, non-castle wilderness overworld chunks with a 50% chance.
    *   [x] Designed character visual renderings, customized dialog matrices with tips, and role-appropriate buy/sell shops (Hunters buy/sell gear, Herbalists buy/sell potions/herbs, Pilgrims trade trinkets).
*   [x] **Proximity Crime Witness System**:
    *   [x] Built an engine to scan surrounding visible tiles for other active NPCs when attacking a traveler.
    *   [x] Assaulting a traveler with nearby witnesses drops town reputation by -35, triggering local law enforcement warnings.
    *   [x] Performing the assault in absolute isolation (unwitnessed) lets the player engage in combat without public reputation consequences, enabling stealthy gameplay.
*   [x] **Dynamic Combat Transformation**:
    *   [x] Transition traveling NPCs immediately into aggressive enemy entities on the active grid (ranged Hunters, melee Herbalists/Pilgrims) upon physical assault.
    *   [x] Seed appropriate high-fidelity stats and loot tables matching their wilderness roles.

---

## 🛡️ 22. Roaming Outlaw Camps & Bored GM Interventions (v3.9.4) (COMPLETED ✔)
Introduce dynamic overworld bandit camp spawns triggered autonomously when the Game Master is bored, complete with a dynamic lore monologue announcement, elite camp bandits, and on-demand GM panel commands.

*   [x] **Roaming Outlaw Camp Spawn**:
    *   [x] Spawns a small camp of 2-3 Outlaw Bandits around a newly lit wood campfire on walkable overworld tiles nearby.
    *   [x] Spawns an elite **Outlaw Bandit Leader** (85 HP) and auxiliary **Exile Camp Bandits** (55 HP).
    *   [x] Spawns them in an aggressive **Chasing** state so they immediately pursue and engage the player.
*   [x] **Dynamic Lore Monologue Announcement**:
    *   [x] Triggers an in-character narrative monologue in the adventure chronicle describing crackling wood and laughter nearby.
    *   [x] Maps the relative cardinal direction of the camp (e.g., NORTH-EAST) based on player coordinates and logs it.
*   [x] **Interactive Map Compass Pings**:
    *   [x] Spawns a floating text indicator over the campfire location with the directional tag.
*   [x] **GM Storyteller Integration**:
    *   [x] Hooks the camp spawn to the storyteller's Mischievous, Sadistic, and Intrigued personas to trigger once the GM's boredom exceeds 30.
    *   [x] Registers on-demand spawn controls under the GM commands interface.

---

## 🛡️ 23. Quest-Giver Assaults & Responsive Multi-Viewport HUD (v3.9.5) (COMPLETED ✔)
Introduce the ability to refuse, betray, and directly assault quest-giving traveling NPCs (failing their active/available quests and turning them into hostile map enemies), and implement a fully responsive multi-viewport UI that offers a beautiful, fully featured mobile HUD layout.

*   [x] **Interactive Quest-Giver Assault Option**:
    *   [x] Add interactive "Refuse & Attack" or "Betray & Attack" choices inside traveling NPC dialog overlays.
    *   [x] Fail associated quests (e.g., mushrooms, pelts, relics) and log quest failures with immersive reasons.
    *   [x] Spawns them as hostile, aggressive combat entities on the map ready to trade blows or fire arrows.
*   [x] **Fluid Multi-Viewport Responsiveness**:
    *   [x] Re-architect the layout checks to correctly handle narrow widths (< 1024px) as well as touch and mobile UA pointers.
    *   [x] Provide custom styling structures for compact mobile displays.
*   [x] **Compact Mobile HUD and Status Bars**:
    *   [x] Display a dedicated statistics grid above the game canvas in mobile mode for Vitals HP, Focus MP, Gold wealth, and Level/XP.
    *   [x] Render a sub-bar tracking local coordinates, current overworld biome / dungeon floors, reputation standing, game clock time, and dynamic Moon Phases with tooltip support.

---

## 🛡️ 24. Integrated Crafting & Alchemy Workbench (v3.9.6) (COMPLETED ✔)
Consolidate "Life Skills" (Campfire Cooking & Alchemical Brewing) into the main **Crafting Arcanum Workbench** (Forge) interface, creating a single unified workstation for all metallurgic, culinary, and alchemical creation, while updating developer guidelines.

*   [x] **Sub-Tab Integration inside Forge Panel**:
    *   [x] Migrated all culinary campfire cooking recipes and logic from standalone LifeSkillsPanel.
    *   [x] Migrated all laboratory alchemical brewing mixtures and laboratory tier upgrade systems.
    *   [x] Reorganized the Workbench navigation bar: Forge Equipment, Camp & Tools (campfire, fishing poles, lockpicks), Campfire Cooking (gourmet meals), Alchemical Brewing (elixirs), Mutation Forge, and Upgrade Gear.
*   [x] **Proximity Detection & Lab Upgrades**:
    *   [x] Retained proximity-based campfire detection within the culinary tab.
    *   [x] Integrated Apothecary Laboratory tier upgrader with proper gold and resource deduction handlers.
*   [x] **HUD/Navigation Cleanup**:
    *   [x] Removed the redundant standalone "Life Skills" top navigation tab and button from the HUD.
    *   [x] Deleted obsolete `/src/components/LifeSkillsPanel.tsx` file to maintain a clean, fully modularized workspace.
    *   [x] Verified that type checkers, linters, and compilers run with absolutely zero errors.

---

## 🛡️ 25. Scars of the Defeated & Effective Stats System (v3.9.7) (COMPLETED ✔)
Introduce a dynamic physical trauma tracking system ("Scars of the Defeated") coupled with an on-the-fly "Effective Stats" calculator to prevent stat mutation exploits and add strategic risks/rewards.

*   [x] **Centralized Scar Database & Scaling (`src/utils/scars.ts`)**:
    *   [x] Maintain a database of 24 distinct, high-impact battle scars across four severity levels: Minor, Major, Grave, and Legendary.
    *   [x] Roll against `evaluateScarAcquisition` under critical/high-damage hits ($\ge 12$ HP damage, or below 35% health) with controlled spawn rates.
*   [x] **Fresh vs. Healed Healing Cycle**:
    *   [x] Initialize newly acquired scars in a **Fresh** state, carrying a precise 25-turn active countdown.
    *   [x] Apply attribute penalties (e.g., `-1 Charisma`, `-1 Strength`) while the wound heals.
    *   [x] Transition scars to **Healed** state automatically upon timer expiration, replacing debuffs with permanent mended stat bonuses (e.g., `+1 Dexterity`, `+1 Attack`).
*   [x] **Dynamic On-The-Fly Stat Calculation (`getEffectiveStats`)**:
    *   [x] Restrict mutating base player parameters to prevent stacking bugs and state conflicts.
    *   [x] Calculate current effective player attributes on-the-fly during active combat rolls, defense checks, and HP bars.
    *   [x] Dynamically tie maximum inventory carry limits to the player's effective Strength (fresh injuries reduce carry capacity).
*   [x] **Real-Time Visual Feedback & Lab Controls**:
    *   [x] Render the character stats sheet with clear base-to-effective comparisons using green/red color codes and tooltip details.
    *   [x] Integrate full manual scar injection capabilities in the God Panel's Creator Lab tab for instant feature testing.

---

## 🎨 Future Architecture Roadmap: Hybrid Graphic Engine & Animation System (PROPOSAL)

An architectural plan to support rich tile-based graphics, sprite-sheet slicing, and fluid rendering transitions in future versions, while retaining complete backwards compatibility with the fast, lightweight text/emoji fallback engine:

*   [x] **Abstract Graphics Provider Interface**:
    *   [x] Establish a unified rendering controller interface (`IGraphicsRenderer`) with methods like `drawTile(x, y, details)`, `drawEntity(x, y, details)`, and `renderVFX(...)`.
    *   [x] Implement a lightweight **TextRenderer** (using our current custom canvas, CSS overlays, and emoji sets) as the robust default core.
    *   [x] Implement a **TilesetRenderer** (powered by HTML5 2D Context) to slice texture atlases and draw tile buffers.
*   [x] **Dual-Representational Entity Mapping**:
    *   [x] Extend entity and tile rendering descriptors to accept polymorphic graphic descriptors holding both representation paths (symbolic emoji + sprite texture atlas coordinates).
*   [x] **Asynchronous Asset Loader & Fallback Manager**:
    *   [x] Build an asset load manager (`AssetPreloader`) to load external tile-sheets, texture manifests, and sprite-sheets asynchronously.
    *   [x] Automatically fall back to symbolic emoji rendering if sprites fail to load, are missing, or if the user toggles graphics off in settings (`useTilesets: false`).
*   [x] **Decoupled Main Tick Loop & VFX Queue**:
    *   [x] Decouple turn-based state updates (synchronous input ticks) from rendering calculations (continuous `requestAnimationFrame` render ticks) to handle particle systems, moving projectiles, or walk animations.
    *   [x] Route spells, strikes, and weather anomalies through a global `VFXEmitter` queue. In Text mode, they animate via CSS transitions or simple text-floats; in Tileset mode, they run sprite sequence frames or particle sprites.

---

## 🧹 26. Codebase Architecture, Refactoring & Performance Optimizations (v3.9.16) (RECOMMENDED ROADMAP)

Systemic architectural refactoring plan to eliminate code duplication, decompose monolithic files (`App.tsx`, `GodPanelOverlay.tsx`, `CraftingPanel.tsx`, `types.ts`), and optimize render performance for long-term maintainability.

### 🎯 Recommended Order of Execution (Execution Plan)

#### **Phase 1: Domain-Specific Type & Data Modularization (Low Risk, Immediate Foundation)**
*   [x] **1.1 Split `src/types.ts` into Domain Modules**:
    *   [x] Create `src/types/game.ts` (Core `GameState`, flags, system modes).
    *   [x] Create `src/types/items.ts` (`EquipmentItem`, `CraftedWeapon`, catalysts, materials).
    *   [x] Create `src/types/map.ts` (`TileType`, chunk grids, landmark structures).
    *   [x] Create `src/types/entities.ts` (`Enemy`, `NPC`, companion parameters, stats).
    *   [x] Re-export all domain types from `src/types/index.ts` to preserve existing import statements.
*   [x] **1.2 Extract Static Master Databases to `/src/data/`**:
    *   [x] Move static item lookups and recipes out of component files into `src/data/recipes.ts`.
    *   [x] Organised master JSON datasets (`materials.json`, `catalysts.json`, `weaponTemplates.json`, `scars.json`, `relics.json`) under `/src/data/`.

#### **Phase 2: UI Overlay Decomposition (Medium Risk, High Developer Speedup)**
*   [x] **2.1 Modularize `GodPanelOverlay.tsx` (~7,280 lines)**:
    *   [x] Extract `GodItemSpawner.tsx` for custom item generation and inventory cheats.
    *   [x] Extract `GodWorldEditor.tsx` for adjacent tile spawning, campfire/anvil deployment, and climate toggles.
    *   [x] Extract `GodStatEditor.tsx` for player stats, scar injection, and gold/exp sliders.
*   [x] **2.2 Modularize `CraftingPanel.tsx` (~2,260 lines)**:
    *   [x] Split sub-tabs into `src/components/crafting/CookingTab.tsx`, `AlchemyTab.tsx`, and auxiliary subcomponents.
    *   [x] Centralize shared overforge heat gauge logic (`OverforgeGauge.tsx`).

#### **Phase 3: Core App Engine Deconstruction & Custom Hooks (`src/hooks/`) - DONE ✔**
*   [x] **3.1 Extract Custom Engine Hooks**:
    *   [x] `useSaveLoad.ts`: LocalStorage serialization, auto-save timers, import/export save state sanitization.
    *   [x] `useKeyboardInput.ts`: Key bindings, WASD/Numpad/Arrow controls, hotkey actions, and modal input suppression.
    *   [x] `usePlayerMovement.ts`: Movement logic, tile collisions, stamina consumption, and stair transitions.
    *   [x] `useCombatEngine.ts`: Attack calculations, scar triggers, overforge heat recoil, and critical hits.
    *   [x] `useEnemyAI.ts`: Pathfinding, faction chase algorithms, and turn-based enemy actions.
*   [x] **3.2 Isolate World & Dungeon Generators**:
    *   [x] Extract dungeon generation algorithms into `src/world/dungeonGen.ts`.
    *   [x] Extract overworld chunk generation and landmark placement into `src/world/overworldGen.ts`.

#### **Phase 4: Performance & Rendering Optimization (High Performance Gains - DONE ✔)**
*   [x] **4.1 FOV & Line-of-Sight Raycasting Memoization**:
    *   [x] Memoize raycasting computations (`computeFOV`, `bresenhamLine`) with bounding-box hashing to prevent re-running visibility checks on static turns.
*   [x] **4.2 Render Boundary & Canvas Optimization**:
    *   [x] Wrap canvas overlays and HUD sub-panels (`GameCanvas`, `GameLog`, `DifficultyTracker`, `DungeonGlancePanel`, `UnifiedInventoryPanel`, `CraftingPanel`, `GodPanelOverlay`, `AppOverlays`, `MutationSynergyPanel`, `OverforgeGauge`, `CookingTab`, `AlchemyTab`) in `React.memo` to prevent cascading re-renders when unrelated state variables change.

#### **Phase 5: Infinite Ocean Navigation & Naval Crafting (v4.0.5 Roadmap)**
*   [ ] **5.1 Ship Building & Shipyard Crafting Station**:
    *   [ ] Add Shipyard building to coastal settlement chunks (`ShipyardTab.tsx`).
    *   [ ] Implement vessel blueprints: Longship, Brigantine, Ironclad Skiff.
    *   [ ] Add naval timber, sailcloth, and pitch crafting recipes.
*   [ ] **5.2 Open Sea Navigation & Archipelago Procedural Generation**:
    *   [ ] Generate infinite oceanic water chunks with coral reefs, deep trenches, and hidden islands.
    *   [ ] Implement wind vector mechanics affecting ship velocity and direction.
*   [ ] **5.3 Aquatic Bestiary & Abyssal Encounters**:
    *   [ ] Add sea monsters: Kraken tentacles, Leviathans, Sirens, Drowned Marauders.
    *   [ ] Implement ship-to-ship cannon combat and broadside mechanics.

#### **Phase 6: Faction Wars, Diplomacy & Territory Conquest (v4.0.6 Roadmap)**
*   [ ] **6.1 Dynamic Faction Reputation & Alliance System**:
    *   [ ] Implement 4 major factions: Pohjola Clan, Kalevala Guardians, Deep-Forge Guild, Sovereign Raiders.
    *   [ ] Add dynamic alliance matrix, bounty contracts, and regional influence indicators.
*   [ ] **6.2 Fortress Conquest & Territory Siege Engine**:
    *   [ ] Allow player-constructed outposts and guard towers to claim surrounding territory nodes.
    *   [ ] Implement siege weapons (catapults, ballistas) and automated faction raid defense events.

#### **Phase 7: Elemental Alchemy & High-Tier Spell Synthesizer (v4.0.7 Roadmap)**
*   [ ] **7.1 Advanced Catalyst Combination Matrix**:
    *   [ ] Implement multi-catalyst spell weaving combining Fire, Frost, Lightning, Void, and Solar affinities.
    *   [ ] Add lingering environmental hazards (electrified water, freezing miasma, burning oil trails).
*   [ ] **7.2 Mythic Boss Relics & Divine Transformation Engine**:
    *   [ ] Implement avatar transformations (Form of Surtur, Avatar of Ukko, Ice Sovereign).
    *   [ ] Add unique ultimate ability cooldowns and screen-shake combat visual feedback.

#### **Phase 8: Audio Engine & Procedural Soundscapes (v4.0.8 Roadmap)**
*   [x] **8.1 Multi-Layer Dynamic Ambient Audio System**:
    *   [x] Add biome-specific ambient audio loops (forest breeze, deep dungeon echoes, ocean waves, desert winds, swamp hum).
    *   [x] Dynamic soundscape transitions during weather shifts, hostile proximity/combat tension, and low-HP critical heartbeat pulse with lowpass muffle filter.
*   [x] **8.2 Spatial Weapon Sound FX & Proximity Audio Attenuation**:
    *   [x] Spatial 2D proximity audio math (distance falloff curve & stereo panning).
    *   [x] Distance-limited hearing range: player only hears sounds occurring near them in the chunk; distant off-screen sounds are muted.
    *   [x] Interactive Audio Settings Modal (`AudioSettingsModal.tsx`) with Master, SFX, Ambient volume sliders & Mute toggle.

#### **Phase 9: Modal UI Componentization & `App.tsx` Size Reduction (v4.0.9 Refactoring Roadmap)**
*   [x] **9.1 Extract Inline Modal Dialogs (`src/components/modals/`)**:
    *   [x] Extract NPC Dialogue & Quest Modal (`DialogueModal.tsx`).
    *   [x] Extract Merchant & Settlement Trade Modal (`TradeModal.tsx`).
    *   [x] Extract Caravan Escort Journey Modal (`CaravanEscortModal.tsx`).
    *   [x] Extract Point of Interest Choice Modal (`PoiChoiceModal.tsx`).
    *   [x] Extract Settlement & Structure Management Modal (`BuildingInteractModal.tsx`).
*   [x] **9.2 Reduce `App.tsx` Footprint**:
    *   [x] Modularize remaining inline UI handlers and trade/modal overlays into dedicated components.

#### **Phase 10: State Management & Context Slicing (v4.1.0 Architecture Roadmap)**
*   [x] **10.1 Modularize `GameState` into Domain Contexts (`src/context/`)**:
    *   [x] Create `PlayerContext.tsx` for stats, inventory, equipment, and active scars/effects.
    *   [x] Create `WorldContext.tsx` for chunk maps, dungeons, weather, time, and structures.
    *   [x] Create `CombatContext.tsx` for enemies, turn queues, combat logs, and AI state.
*   [x] **10.2 Atomic Reducer State Updates**:
    *   [x] Replace heavy monolithic `setGameState` spreads with targeted reducer actions to minimize memory churn.

#### **Phase 11: Data & Economy Centralization (`src/data/`)**
*   [x] **11.1 Centralize Dialogue Trees & Quest Matrices**:
    *   [x] Extract inline NPC dialogue text and quest trees into `src/data/dialogues.json`.
    *   [x] Extract settlement trade tables and price scaling rules into `src/data/economy.json`.
*   [x] **11.2 Centralize Game Balance Constants**:
    *   [x] Consolidate damage formulas, armor mitigation curves, and XP leveling thresholds into `src/data/balance.ts`.

#### **Phase 12: Automated Verification & Unit Testing Framework (Comprehensive Suite)**
*   [x] **12.1 Core AI, Movement & Pathfinding Verification**:
    *   [x] Add test suite for A* pathfinding algorithms, obstacle navigation, and Bresenham FOV line-of-sight raycasting math (`ai.ts` & spatial hashing).
    *   [x] Add test suite for follower movement AI, anti-trapping position swapping on player step, and idle jitter dispersion.
    *   [x] Add test suite for NPC coordinate sanitization & 20-tile spiral search validation to prevent spawning inside solid walls, trees, or water tiles.
    *   [x] Add test suite for enemy pursuit state machines, spellcasting projectile paths (`Nakki`, `Louhi`), and boss AI behaviors.
*   [x] **12.2 Combat Engine, Invasion Events & Debuff Property Safety**:
    *   [x] Add test suite for Watchtower Siege and Castle Invasion dynamic event spawners, validating that all spawned attackers/defenders have initialized `debuffs: []`, `maxHp`, and valid type definitions.
    *   [x] Add test suite for player melee, ranged, and scroll spell attacks against all enemy types and faction guards to ensure 0 crashes or missing property runtime errors.
    *   [x] Add test suite for combat damage calculations, armor mitigation formulas, and sub-linear ATK scaling dampening vs monster HP/DEF scaling.
    *   [x] Add test suite for status affliction processing (`turnsRemaining` vs `duration` fallbacks) and debuff tick damage in `useEnemyAI.ts` and `useSpellcasting.ts`.
    *   [x] Add test suite for dual-hand equipment durability degradation across weapon and shield slots under combat strikes and blocks.
    *   [x] Add test suite for scar acquisition probability checks ($\ge 12$ HP damage or $< 35\%$ HP), fresh countdown (25 turns) to healed transition, and `getEffectiveStats` attribute calculation accuracy.
    *   [x] Add test suite for overforge heat bellows gauge recoil, risk/reward modifiers, and blacksmith repair priority sorting.
*   [x] **12.3 World Generation, Chunk Scrolling & Camera Focus Tests**:
    *   [x] Add test suite for 64x40 overworld chunk generation, Whittaker biome mapping (`worldConfig.json`), and landmark structure preset carving (`carveStructure`).
    *   [x] Add test suite for dungeon level generation, staircase descend transitions, level state persistence, and return coordinate accuracy.
    *   [x] Add test suite for smooth camera tracking interpolation, chunk boundary jump snap repositioning, and minimap spatial hash updates.
*   [x] **12.4 Save File Serialization & Backward Compatibility Suite**:
    *   [x] Add test suite for LocalStorage game state serialization, schema validation (`useSaveLoad.ts`), and missing key sanitization.
    *   [x] Add test suite for backward compatibility and migration of legacy save files across versions without runtime exceptions.
    *   [x] Add test suite for export/import JSON payload verification, payload corruption recovery defaults, and log history export integrity.
*   [x] **12.5 Economy, Caravans, Trading & Life Skills Tests**:
    *   [x] Add test suite for biome-based trade price multiplier formulas, dynamic trade rate badges, and vendor purchase discounts (`tradeEconomy.ts`).
    *   [x] Add test suite for Caravan Escort road event resolver (Bandit Ambushes, Rockslides, d20 stat check DC thresholds, and resource deductions).
    *   [x] Add test suite for campfire cooking recipes, alchemical brewing inputs/outputs, and Apothecary lab tier upgrade deductions.
*   [x] **12.6 Log Integrity, UI Renderers & System Diagnostics Suite**:
    *   [x] Add test suite for `GameLog` text formatting, string null guards, unique row keys, duplicate log frequency counter collapsing, and log export utilities.
    *   [x] Add test suite for `entityLayerRenderer.ts` corpse and entity rendering string safety checks (`name?.toLowerCase()`).
    *   [x] Add test suite for Scroll of Recall and fast travel target coordinate sanitization (Oakhaven Town, Central Outpost, Safehouses).
    *   [x] Add test suite for Virtual Smoke Test Runner automated tick execution and continuous core loop stability checks.
*   [x] **12.7 Item Stacking, Scroll Inventory & Overencumbrance Verification**:
    *   [x] Add test suite for scroll stack consolidation, scroll consumption, item adding, and inventory carrying weight capacity calculations (`itemsAndInventory.test.ts`).

#### **Phase 13: `src/App.tsx` Monolith Decomposition Roadmap**
*   [x] **13.1 Extract Spellcasting & Ability Engine (`src/hooks/useSpellcasting.ts`)**:
    *   [x] Move spell casting, mana verification, projectile targeting, AOE effects, status applications, and scroll consumption out of `App.tsx` into `useSpellcasting.ts`.
*   [x] **13.2 Extract World & Dungeon Interactions (`src/hooks/useWorldInteraction.ts`)**:
    *   [x] Extract overworld stairs navigation, resource harvesting (trees/ore veins), door opening, and environment interactions out of `App.tsx` into `useWorldInteraction.ts`.
*   [x] **13.3 Extract Crafting, Repair & Alchemy Engine (`src/hooks/useCraftingEngine.ts`)**:
    *   [x] Move weapon/armor crafting handlers, overforge heat recoil calculations, equipment repairs, and alchemy brewing out of `App.tsx`.
*   [x] **13.4 Extract Main App Layout & View Shell (`src/components/MainAppLayout.tsx`)**:
    *   [x] Decouple HUD elements, status bars, canvas containers, and active modal overlays from `App.tsx` to streamline top-level state rendering.

#### **Phase 14: `src/components/GodPanelOverlay.tsx` Sub-System Decomposition**
*   [x] **14.1 Split God Panel Tabs into Subcomponents (`src/components/god/`)**:
    *   [x] Move God Item/Weapon Spawner into `GodItemSpawner.tsx`.
    *   [x] Move World Map Editor & Biome Tools into `GodWorldEditor.tsx`.
    *   [x] Move Player Stat & Scar Modifier into `GodStatEditor.tsx`.

#### **Phase 15: `src/utils/overworld.ts` Map Generator Decomposition**
*   [x] **15.1 Modularize Overworld Generation Sub-modules**:
    *   [x] Extract Biome Distribution logic into `src/world/overworldBiomes.ts`.
    *   [x] Extract Structure & POI Placement into `src/world/overworldStructures.ts`.

#### **Phase 16: `src/components/GameCanvas.tsx` Render Layer Modularization**
*   [x] **16.1 Separate Canvas Layer Renderers**:
    *   [x] Modularize Tile Map Renderer, Entity Layer Renderer, and Weather/Lighting FX Layer into isolated rendering modules (`src/canvas/tileMapRenderer.ts`, `src/canvas/entityLayerRenderer.ts`, `src/canvas/weatherLightingRenderer.ts`, `src/canvas/spriteRenderer.ts`).

#### **Phase 17: Dungeon Entrance Crash Fix & Code Cleanup Audit**
*   [x] **17.1 Fix Dungeon Entrance Crash (`TypeError: Cannot read properties of undefined (reading 'id')`)**:
    *   [x] Save `dungeonLevels: nextDungeonLevels` in `usePlayerMovement.ts` first floor descend transition.
    *   [x] Guard `activeTargetedScroll` in `useSpellcasting.ts`.
    *   [x] Guard `item` and `item.id` in `useEquipmentHandlers.ts`.
    *   [x] Replace non-null assertions in `useCraftingEngine.ts` with safe fallbacks.
    *   [x] Guard `enemy.id` in `GameCanvas.tsx` shaker handler.
    *   [x] Guard `guardFollower.id` in `GuildOverlay.tsx`.
    *   [x] Guard `poi.id` and `choice.id` in `PoiInteractionOverlay.tsx`.
    *   [x] Add default merchant name fallback in `App.tsx` trade booth tab button.
*   [x] **17.2 Code Base Audit & Import/Export Cleanup**:
    *   [x] Verify zero TypeScript errors across all modules (`tsc --noEmit`).
    *   [x] Confirm production build succeeds (`compile_applet`).

#### **Phase 19: Line of Sight (FOV) Culling for Logs & Canvas FX**
*   [x] **19.1 Fog of War Line of Sight Filtering**:
    *   [x] Restrict status affliction logs (`🔥`, `💀`, `💫`) in `useEnemyAI.ts` to visible tiles (`prev.visible[y][x]`).
    *   [x] Restrict companion and town guard combat log messages (`🛡️ [COMPANION]`, `🛡️ [TOWN GUARD]`, `🛡️ [TOWN GUARD ALARM]`) and sound FX to visible tiles.
    *   [x] Cull floating damage text, particle effects, and projectile animations in `entityLayerRenderer.ts` when occurring on non-visible tiles.

#### **Phase 20: Follower Cross-Chunk Movement & Tethering**
*   [x] **20.1 Cross-Chunk & Fast Travel Companion Persistence**:
    *   [x] Verify overworld chunk edge transitions spawn active followers next to player's entry tile.
    *   [x] Update dungeon exits, stairwells, and Captain Jack ferry passages to spawn active followers near player upon chunk load.
    *   [x] Add rubberband tethering in `useEnemyAI.ts` to automatically teleport followers who lag >8 tiles behind due to complex terrain.
    *   [x] Pass active companion guild quests to filter out dispatched followers across level transitions.

#### **Phase 21: Ambient Sound Engine Tuning & UI Mute Button**
*   [x] **21.1 Subtle Background Ambiance & Quick Mute**:
    *   [x] Lower default ambient volume and individual layer gains (`0.04`–`0.08`) so soundscapes sit softly in the background.
    *   [x] Add instant 1-click **`🔇 Muted` / `🔊 Mute`** toggle button directly on the main HUD header bar next to Audio settings.
    *   [x] Add new procedural synthesizers (`owl_hoot`, `cricket_chirp`, `frog_croak`, `cave_echo`, `lute_pluck`, `ocean_wave`, `fire_crackle`).
    *   [x] Expand periodic atmospheric accent timers to dynamically trigger biomes/weather/night-specific ambient details.

#### **Phase 22: Realistic Indoor Building Acoustic Soundscape & Acoustic Attenuation (v4.3.6)**
*   [x] **22.1 Indoor Acoustic Detection & Wall Lowpass Dampening**:
    *   [x] Implement `isPlayerIndoors` utility in `src/utils/buildingAudio.ts` to detect building interiors, upper floors, dungeons, and watchtowers.
    *   [x] Apply ~650Hz lowpass filter to ambient soundscapes when player is indoors to muffle outdoor rain, wind, and blizzards.
    *   [x] Add indoor accent soundscapes (`fire_crackle`, `wood_creak`, `lute_pluck`, `clock_tick`) sitting at soft gain levels (`0.06`–`0.09`).
*   [x] **22.2 Door Creaks & Surface-Aware Footsteps**:
    *   [x] Synthesize procedural WebAudio SFX for `door_open`, `door_close`, `wood_footstep`, `stone_footstep`, and `grass_step`.
    *   [x] Trigger door creak/thud on building entry and step transitions in `App.tsx` and `useWorldInteraction.ts`.
    *   [x] Dynamically play wooden plank footsteps vs stone tile steps inside buildings.
    *   [x] Apply wall lowpass frequency attenuation to spatial positional audio heard across building walls.

#### **Phase 23: Codebase Health, Data Isolation & Monolith Deconstruction Roadmap (v4.5.0)**
*   [x] **Phase 23.1 Data-Driven Preset Isolation (`/src/data/`)**:
    *   [x] Move structure blueprints and custom house carved layouts into `/src/data/structures.json`.
    *   [x] Move town templates and urban layouts into `/src/data/townTemplates.json`.
    *   [x] Move enemy blueprints and combat templates into `/src/data/enemyBlueprints.json`.
*   [x] **Phase 23.2 God Panel Overlay Deconstruction (`/src/components/god/`)**:
    *   [x] Extract `GodEnemyBlueprintEditor.tsx` from `GodPanelOverlay.tsx`.
    *   [x] Extract `GodReplaySimulator.tsx` and smoke testing runner from `GodPanelOverlay.tsx`.
    *   [x] Extract `GodCheatsTab.tsx` and `GodAdminEditor.tsx` from `GodPanelOverlay.tsx`.
*   [x] **Phase 23.3 App.tsx Monolith Reduction (`/src/components/` & `/src/hooks/`)**:
    *   [x] Extract top navigation bar into `AppHeaderBar.tsx`.
    *   [x] Extract bottom tab navigation into `AppNavigationTabs.tsx`.
    *   [x] Delegate active view rendering into lightweight tab view components.

#### **Phase 24: Domain Custom Hooks Partitioning & Core Engine Health (`/src/hooks/`)**
*   [x] **24.1 Domain Custom Hooks Partitioning**:
    *   [x] Extract overworld weather, time-of-day, and seasonal ticks into `useOverworldEvents.ts`.
    *   [x] Extract merchant transactions, item purchasing/selling, and coin handlers into `useTradeEconomy.ts`.
    *   [x] Extract quest acceptance, guild contract tracking, and reward claims into `useQuestsAndGuild.ts`.
*   [x] **24.2 Global Modal & Window Navigation Esc Control**:
    *   [x] Enhance global `Escape` key listener in `useKeyboardInput.ts` to close active modal dialogs, trade windows, house builders, inspection gumps, audio panels, and return to dungeon view.
    *   [x] Blur active input/textarea elements cleanly on `Escape` key press.

#### **Phase 25: Organic Ambient Synthesizer & Audio Engine Polish (v4.7.0)**
*   [x] **25.1 Procedural Songbird & Night Ambient SFX Synthesis**:
    *   [x] Synthesize realistic `bird_chirp` with dual-sine pitch trills and frequency sweeps.
    *   [x] Synthesize `cricket_chirp` with dual-pulse high frequency bursts.
    *   [x] Synthesize `owl_hoot` with soft exponential frequency decay.
    *   [x] Register new sounds in `soundCatalog.ts` under the environment category.
*   [x] **25.2 Organic Multi-Layer Weather Audio Swells**:
    *   [x] Replace single noise rain loop with dual-layer rain synthesis (low-pass soil patter + band-pass LFO-swelled droplet chatter).

#### **Phase 26: App.tsx Monolith Reduction & Domain Custom Hooks Expansion (v4.9.0)**
*   [x] **26.1 Caravan Travel & Encounter Hook (`useCaravanTravel.ts`)**:
    *   [x] Extracted caravan encounter factory into `caravanEncounters.ts`.
    *   [x] Encapsulated caravan travel initiation, step progression, D20 stat check encounters, and arrival rewards.
*   [x] **26.2 Town Services Engine Hook (`useTownServices.ts`)**:
    *   [x] Encapsulated Blacksmith forge upgrades, Apothecary lab upgrades, Bartender rumor gossip purchasing, Inn rests, and Mercenary recruitment into `useTownServices.ts`.
*   [x] **26.3 App.tsx Monolith Reduction**:
    *   [x] Reduced `App.tsx` size by over 1,000 lines while maintaining clean type safety.

#### **Phase 27: Canvas Viewport Rendering & Hybrid Engine Integration (v5.0.0)**
*   [x] **27.1 Canvas Viewport Layer Coordination**:
    *   [x] Optimized view culling and render synchronization across TileMap, EntityLayer, and WeatherLighting renderers.
    *   [x] Integrated particle VFX systems, projectile physics, damage numbers, and blood splatters onto canvas coordinates.
*   [x] **27.2 Hybrid Graphics Engine Integration**:
    *   [x] Wired `hybridGraphicsEngine` into `GameCanvas.tsx` via `graphicsMode` prop (`'text'` or `'tileset'`).
    *   [x] Synchronized fallback text/emoji glyph renderer with tileset atlas asset preloader.

#### **Phase 28: Living Towns, Cities, Harbors & Reactive NPC Life (v5.1.0)**
*   [x] **28.1 Dynamic NPC Dialogue & Weather Reactivity Expansion**:
    *   [x] Expand NPC dialogue system with weather-reactive, time-of-day-reactive, and biome-sensitive lines for Guard, Villager, Fisherman, Dockworker, Sailor, Bartender, Merchant, and Blacksmith.
    *   [x] Pass environmental context (`weather`, `timeOfDay`, `season`, `biome`, `townReputation`) into `DialogueModal.tsx` and NPC conversation handlers.
    *   [x] Add weather-sensitive ambient reactions (e.g., NPCs complaining about blizzards, heatwaves, or rain, seeking shelter, or commenting on clear coastal winds).
    *   [x] Expand regional rumor & gossip generator with weather-aware and harbor/trade-route lore.
*   [x] **28.2 Harbor Towns, Ports & Nautical Population Spawning**:
    *   [x] Enhance harbor and coastal town layout generators with docks, anchorages, cranes, harbor master huts, fish markets, and moored ships.
    *   [x] Add specialized harbor NPC roles: Dockworker, Harbor Master, Sailor, Fishmonger, Ferried Navigator.
    *   [x] Implement harbor-specific trading goods (Fresh Catch, Salted Cod, Whale Oil, Nautical Charts, Ship Pitch).
*   [x] **28.3 NPC Daily Schedules, Shelter Seeking & Weather Behaviors**:
    *   [x] Implement NPC AI daily schedules (working outdoors during day, retreating to taverns/houses at night or during severe weather).
    *   [x] Make NPCs seek nearest shelter tiles during blizzards, heavy rain, and sandstorms.
    *   [x] Add visual indicators or chat bubble barks above town NPCs as weather changes.
*   [x] **28.4 Settlement Scaling & Urban Density (Hamlets to Citadel Capitals)**:
    *   [x] Scale NPC population and variety dynamically based on settlement tier (Hamlet, Village, Town, Citadel Capital).
    *   [x] Add urban atmosphere decorative elements (market stalls, street lamps, harbor piers, flower boxes, town square fountains).
*   [x] **28.5 Harbor Ferries & Regional Water Travel**:
    *   [x] Implement coastal ferry connections between harbor towns.
    *   [x] Add ferry travel mechanics for rapid overworld transit across bay channels and archipelagos.

#### **Phase 29: Codebase Modularization & Monolith Deconstruction**
*   [x] **29.1 App.tsx Handler Extraction & Modal Controller Decomposition**:
    *   [x] Extract keyboard navigation, hotkey shortcuts, and modal view states into custom hooks (`useKeyboardInput.ts`, `useModalManager.ts`).
    *   [x] Modularize rested/bed mechanics and turn-tick handlers out of `App.tsx`.
*   [x] **29.2 GodPanelOverlay.tsx Component Modularization**:
    *   [x] Deconstruct `GodPanelOverlay.tsx` into dedicated domain components inside `src/components/god/` (`GodSmoketestTab.tsx`, `GodItemSpawner.tsx`, `GodWorldEditor.tsx`, `GodEntitySpawner.tsx`, `GodCheatsTab.tsx`, `GodAdminEditor.tsx`).
*   [x] **29.3 overworld.ts Utility Splitting**:
    *   [x] Modularize `src/utils/overworld.ts` into specialized world generation modules in `src/world/` (`overworldNpcSpawning.ts`, `overworldPoiGenerator.ts`).
*   [x] **29.4 Audio Engine & Utility Cleanup**:
    *   [x] Extract sound effect synthesizer definitions from `src/utils/audio.ts` into `src/audio/soundPresets.ts`.
    *   [x] Audit and remove unused dead code, redundant imports, and leftover variables across all modified files.
*   [x] **29.5 Verification, Lint & Test Suite Execution**:
    *   [x] Run TypeScript linter (`npm run lint`), `compile_applet`, and `vitest` test suite to ensure 100% green build and zero regression.

#### **Phase 30: Quality Assurance, Deep Test Coverage & Final Polish (v5.2.0)**
*   [x] **30.1 Full Test Suite Verification**:
    *   [x] Verify all 19 test suites and 77 unit/integration tests pass with 0 failures.
*   [x] **30.2 Type Safety & Compilation Check**:
    *   [x] Run `compile_applet` and `lint_applet` to confirm flawless build output without TypeScript or ESLint errors.

#### **Phase 31: Combat Pacing & Enemy Health/Armor Scaling Rebalance**
*   [x] **31.1 Armor Mitigation Formula Synchronization**:
    *   [x] Replaced linear defense subtraction (`finalHit - enemy.def`) in `App.tsx` with the diminishing returns armor formula (`calculateNetDamage`) from `src/data/balance.ts`.
    *   [x] Implemented 50% armor penetration on Critical Hits (`effectiveArmor = Math.floor(enemy.def * 0.5)`), allowing critical strikes to punch through heavily armored targets.
*   [x] **31.2 Boss & High-Tier HP/DEF Scaling Rebalance**:
    *   [x] Rebalanced inflated boss HP multipliers in `src/utils/dungeon.ts`, `src/hooks/useEnemyAI.ts`, and `src/data/enemyBlueprints.json` from extreme 5.0x–8.5x down to responsive 2.5x–3.8x multipliers.
    *   [x] Adjusted boss `defBonus` values (2–5) and cap scaling coefficients to ensure bosses remain epic and tactical without becoming 100+ hit damage sponges.
*   [x] **31.3 Safety Fallbacks & Build Verification**:
    *   [x] Guaranteed non-null safety fallbacks on template icons (`WEAPON_TEMPLATES[gameState.currentWeapon.baseType]?.icon || '⚔️'`).
    *   [x] Executed full test suite (`npm test`), linter (`lint_applet`), and compiler (`compile_applet`) to ensure 100% test pass rate.

#### **Phase 32: Core Monolith Decomposition & Custom Hook Architecture (`App.tsx` & `GodPanelOverlay.tsx`)**
*   [x] **32.1 Combat Engine Extraction (`useCombatEngine.ts`)**:
    *   [x] Extract player attack resolution, weapon durability wear, critical hit multipliers, and material property effects from `App.tsx` into a custom `/src/hooks/useCombatEngine.ts` hook.
*   [x] **32.2 Inventory & Gear Engine Extraction (`useInventoryEngine.ts`)**:
    *   [x] Move item equipping, weapon swapping, inventory sorting/filtering, durability repair, and alchemy brewing handlers into `/src/hooks/useInventoryEngine.ts`.
*   [x] **32.3 Overworld Exploration & Movement Extraction (`useOverworldEngine.ts`)**:
    *   [x] Extract chunk movement, tile collision detection, POI structure interaction, and weather tick logic into `/src/hooks/useOverworldEngine.ts`.
*   [x] **32.4 GodPanelOverlay Inline Sub-Tab Refactoring**:
    *   [x] Deconstruct remaining inline modal tabs in `GodPanelOverlay.tsx` into dedicated sub-components in `src/components/god/` (`GodBestiaryTab.tsx`, `GodJSONDataTab.tsx`).

#### **Phase 33: Engine Modularization & JSON Data Catalogs**
*   [x] **33.1 Flee Quotes & Creature Dialogues Modularization (`src/data/fleeQuotes.json`)**:
    *   [x] Extract hardcoded flee quotes and panic responses from `src/utils/fleeQuotes.ts` into structured `src/data/fleeQuotes.json` categorized by creature archetype.
*   [x] **33.2 Quests & Bounty Contract Catalog Modularization (`src/data/quests.json`)**:
    *   [x] Move main quests, guild contracts, and side objectives from `src/utils/questData.ts` into `src/data/quests.json` with prerequisites, targets, rewards, and faction reputation changes.
*   [x] **33.3 Caravan Encounters & Roadside Events Data Catalog (`src/data/caravanEvents.json`)**:
    *   [x] Extract trade ambushes, traveling merchant encounters, and roadside events from `src/utils/caravanEncounters.ts` into `src/data/caravanEvents.json`.
*   [x] **33.4 Bestiary Entries & Lore Footnotes Data Catalog (`src/data/bestiary.json`)**:
    *   [x] Move creature lore footnotes, weakness tags, drop tables, and entry metadata from `src/utils/bestiary.ts` into `src/data/bestiary.json`.
*   [x] **33.5 AI Storyteller & GM Chaos Events Data Catalog (`src/data/storyEvents.json`)**:
    *   [x] Extract disaster scenarios, chaos surge effects, weather triggers, and GM narrative prompts from `src/utils/gmStoryteller.ts` into `src/data/storyEvents.json`.

#### **Phase 37: Codebase Health Audit, Canvas Performance & Particle Capping**
*   [x] **37.1 Codebase Integrity & Import Health Audit (`scripts/auditCodebase.cjs`)**:
    *   [x] Restored `src/types.ts` explicit module re-exports.
    *   [x] Created automated codebase audit tool verifying 203 source files, 22 JSON catalogs, and relative import resolutions.
    *   [x] Configured `npm run audit` script combining import integrity check, TypeScript type checks (`tsc --noEmit`), and Vitest test runner.
*   [x] **37.2 Canvas Rendering Loop & Particle Optimizations (`src/canvas/`)**:
    *   [x] Memoized regex font testing in `spriteRenderer.ts` using string lookup cache.
    *   [x] Batched weather particle path draw operations (`rain`, `snow`, `dust storm`, `blizzard`, `embers`, `cherry blossoms`, `spores`) in `weatherLightingRenderer.ts`.
    *   [x] Capped max active visual FX particles at 250 in `visualFxParticleSystem.ts` with early exit guard on empty particle queues.
*   [x] **37.3 QA & Test Suite Validation**:
    *   [x] Verified 100% pass rate across 20 Vitest test suites (80 total unit & end-to-end simulation tests).

#### **Phase 34: Oceanic Archipelagos, Shipyards & Naval Warfare**
*   [ ] **34.1 Shipyard Crafting & Vessel Blueprints**:
    *   [ ] Add Shipyard building to coastal settlement chunks (`ShipyardTab.tsx`) with vessel blueprints (Longship, Brigantine, Ironclad Skiff).
    *   [ ] Implement naval timber, sailcloth, and pitch crafting recipes.
*   [ ] **34.2 Procedural Archipelago & Open Sea Navigation**:
    *   [ ] Generate infinite oceanic water chunks with coral reefs, deep trenches, and hidden island settlements.
    *   [ ] Implement wind vector mechanics affecting ship velocity and direction.
*   [ ] **34.3 Aquatic Bestiary & Broadside Naval Combat**:
    *   [ ] Add sea monsters: Kraken tentacles, Leviathans, Sirens, and Drowned Marauders.
    *   [ ] Implement ship-to-ship cannon combat and broadside mechanics.

#### **Phase 35: Dynamic Faction War, Reputation & Territory Siege Engine**
*   [ ] **35.1 Faction Reputation Matrix & Alliance System**:
    *   [ ] Implement 4 major factions: Pohjola Clan, Kalevala Guardians, Deep-Forge Guild, Sovereign Raiders.
    *   [ ] Add dynamic alliance matrix, bounty contracts, and regional influence indicators.
*   [ ] **35.2 Fortress Outpost Conquest & Territory Siege Engine**:
    *   [ ] Enable player-constructed outposts and guard towers to claim surrounding territory nodes.
    *   [ ] Implement siege weapons (catapults, ballistas) and automated faction raid defense events.

#### **Phase 36: Mythic Spell Weaving, Environmental Hazards & Transmutation**
*   [ ] **36.1 Multi-Catalyst Elemental Spell Weaving**:
    *   [ ] Implement multi-catalyst spell weaving combining Fire, Frost, Lightning, Void, and Solar affinities.
    *   [ ] Add lingering environmental hazards (electrified water, freezing miasma, burning oil trails).
*   [ ] **36.2 Mythic Boss Relics & Divine Transformation Engine**:
    *   [ ] Implement mythic avatar transformations (Form of Surtur, Avatar of Ukko, Ice Sovereign).
    *   [ ] Add unique ultimate ability cooldowns and screen-shake combat visual feedback.

#### **Phase 38: Ancient Monoliths & Biome Shrines (World Landmarks & Exploration Mechanics)**
*   [ ] **38.1 Landmark Spawning & Procedural World Placement (`overworldLivelySpawners.ts` / `overworldChunkGen.ts`)**:
    *   [ ] Spawn unique biome-tailored Monoliths & Shrines across overworld wilderness chunks (Sun Shrine in Deserts, Frost Obelisk in Tundras, Blood Monolith in Swamps, Storm Pillar in Mountains, Rune Altar in Forests).
    *   [ ] Add visual tile icons/sprites and map legend markers to detect nearby landmarks on the minimap/overworld HUD.
*   [ ] **38.2 Interactive Shrine Activation & Offering System (`ShrineModal.tsx` / `useOverworldEngine.ts`)**:
    *   [ ] Add interactive modal/dialogue when player steps onto a Shrine tile.
    *   [ ] Implement Offering mechanics: Player can offer materials, catalysts, gold, or blood (sacrificing max HP/stamina) to commune with the ancient monolith.
    *   [ ] Implement Alignment & Blessing rewards: Temporary or permanent blessings (e.g., +15% Fire Damage, Health Regeneration, Critical Strike Aura, Resource Harvest Duplication).
*   [ ] **38.3 Biome Guardian Encounters & Trial Battles**:
    *   [ ] Trigger optional "Trial of the Ancients" when activating uncorrupted or trial-bound monoliths.
    *   [ ] Spawn elite biome guardians (e.g., Stone Sentinel, Frost Drake Spirit, Ancient Rune Automaton) that drop rare Catalyst Shards, Ancient Relics, and Unique Crafting Blueprints upon defeat.
*   [ ] **38.4 Monolith Waystone Fast Travel & World Resonance (`FastTravelModal.tsx`)**:
    *   [ ] Attuning to a Monolith unlocks it as an Overworld Waystone network node.
    *   [ ] Allow players to spend Leyline Dust / Mana to fast travel between attuned Monoliths across discovered chunks.

#### **Phase 39: Tactical Combat Overhaul, Golden Triangle Enemy Spawns & GM Central Chaos Matrix (COMPLETED ✔)**
*   [x] **39.1 Telegraphed Heavy Attacks & Wind-Up Highlights (`useEnemyAI.ts`, `entityLayerRenderer.ts`)**:
    *   [x] Enemies wind up heavy attacks across turns with telegraphed highlight indicators, floating warning alerts ("💥 Heavy Slam WINDING UP!"), and directional impact zones.
    *   [x] Telegraphed attacks deal 1.8x - 2.5x damage and apply heavy stagger build-up if unmitigated.
*   [x] **39.2 Guard / Stagger Bar Mechanics & Player Bracing (`App.tsx`, `useEnemyAI.ts`)**:
    *   [x] Added dynamic stagger meters for enemies and player. Taking heavy impacts, blunt weapon hits, or shield bashes builds stagger; breaking guard triggers a 1-turn stunned state with 1.5x incoming damage.
    *   [x] Added tactical "Brace / Guard" stance for player to absorb 60% incoming damage, prevent guard breaks, and reflect stagger back onto attacking foes.
*   [x] **39.3 Golden Triangle Enemy Placement & GM Flex Logic (`useEnemyAI.ts`, `dungeonGen.ts`)**:
    *   [x] Encounters default to the tactical Golden Triangle spatial zone (3 key strategic points around the player: damage/resilience/speed archetype placement) to prevent unfair encirclement.
    *   [x] Bosses and GM Storyteller events retain flexibility ("cheat" the triangle) to launch surprise ambushes, flank maneuvers, or specialized wave spawns.
*   [x] **39.4 Integrated Central GM Chaos Matrix (`useGameLoop.ts`, `gmNarrator.ts`)**:
    *   [x] Consolidated chaos tracking into a unified Central GM Chaos Matrix where the Game Master dynamically controls chaos escalation based on player activities, time spent in deep vaults, and environmental tension.
    *   [x] Players can actively suppress and lower the Chaos Matrix through tactical choices: liberating bandit camps, slaying elite dungeon bosses, clearing watchtowers, and completing faction guild contracts.
*   [x] **39.5 Traveling Merchant Wilderness Stock & Markup (`shopData.ts`, `TradeModal.tsx`)**:
    *   [x] Configured merchant inventory profiles for all traveling NPCs (Herbalists, Hunters, Pilgrims, Wandering Merchants, Caravans) with specialized items (health potions, remedies, pelt supplies, survival gear, recall scrolls, alchemical catalysts, and weapons).
    *   [x] Applied a 30% wilderness supply markup for merchants risking dangerous uncharted lands.

#### **Phase 40: GM Adaptive Performance Evaluation, Drastic Chaos Matrix Escalation & Public Testing Release Candidate v1.0.0 (COMPLETED ✔)**
*   [x] **40.1 GM Adaptive Combat Performance Tracking (`gmStoryteller.ts`, `useEnemyAI.ts`)**:
    *   [x] GM Storyteller continuously monitors player combat performance, kill count velocity, and health ratio.
    *   [x] Effortless slaughter triggers drastic Chaos Matrix escalation (+8 to +15 points) accompanied by GM narrator alerts ("Slain foes without breaking a sweat? Let us test your true steel!").
*   [x] **40.2 Dynamic Enemy Stat Mutators & Reinforcement Upgrades (`gmStoryteller.ts`, `combatArchetypes.ts`)**:
    *   [x] On GM Chaos adaptation, active monsters dynamically mutate: gaining +30% HP, +2 ATK, +1 DEF, higher Chaos Tiers, and elevated Elite / Anomaly modifiers.
    *   [x] Spawner and Golden Triangle algorithms scale monster stats and spawn Triangle-Cheating Anomalies when Chaos exceeds 60.
*   [x] **40.3 Public Testing Release Candidate Verification & Test Suite Validation**:
    *   [x] Verified 100% test pass rate across 21 Vitest test suites (86 tests total) including new storyteller test cases.
    *   [x] Verified zero TypeScript or linting errors (`tsc --noEmit`), zero dead code warnings, and bumped project version to 1.0.0 for GitHub push & public testing release.

















