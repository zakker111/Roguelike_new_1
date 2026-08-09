# ⚔️ Sunder: Roguelike RPG Engine Architecture & System Status (`all.md`)

Welcome to the comprehensive master system documentation for **Sunder: Chronicles of the Forge** (Abyss Rogue). This document serves as the unified reference for the project's codebase architecture, sub-engine modularizations, test suite status, and core game systems.

---

## 📌 1. Recent Architectural Modularization Milestones

### 1.1 `useCraftingEngine.ts` Sub-Engine Separation
To maximize code maintainability, domain isolation, and hook clarity, the monolithic `useCraftingEngine.ts` has been decomposed into modularized sub-hooks housed under `src/hooks/crafting/`:

* **`src/hooks/crafting/types.ts`**: Shared interface definitions (`CraftingSubEngineProps`) ensuring unified state dispatch and logging.
* **`src/hooks/crafting/useEquipmentCrafting.ts`**: Dedicated equipment forging and modification engine:
  - Weapon & armor forging (`handleCraftComplete`)
  - Item repairs (`handleRepairItem`, `handleRepairAll`)
  - Mutation & synergy alchemy (`handleMutateItem`)
  - Stat upgrading & passive infusion (`handleUpgradeItem`)
* **`src/hooks/crafting/useSurvivalCrafting.ts`**: Wilderness survival and cooking engine:
  - Deployable structures (`handlePlaceCampfire`, `handlePlaceAnvil`)
  - Culinary recipes (`handleCookMeat`, `handleCookPrimeMeat`, `handleCookFish`, `handleCookRecipe`)
  - Campfire resting (`handleRestCampfire`)
  - Minigame fishing hooks (`handleCatchFish`, `handleFailFish`)
* **`src/hooks/crafting/useUtilityCrafting.ts`**: Tools and consumable brewing engine:
  - Potion brewing (`handleBrewPotion`)
  - Utility tools crafting (`handleCraftFishingPole`, `handleCraftLockpicks`, `handleCraftHatchet`, `handleCraftPickaxe`, `handleCraftRecallScroll`)
* **`src/hooks/useCraftingEngine.ts`**: Lightweight wrapper delegating to sub-engines and presenting a seamless unified hook interface to `App.tsx`.

---

### 1.2 `overworld.ts` Procedural Overworld Separation
The procedural overworld generation pipeline was modularized from a monolithic file into targeted modules in `src/utils/overworld/`:

* **`src/utils/overworld/overworldCore.ts`**: PRNG seed utilities, noise maps, building placement geometry, Whittaker biomes, and safe tile searches.
* **`src/utils/overworld/overworldTownGen.ts`**: Procedural settlement layouts, market plazas, castle keeps, harbor ports, and town square structures.
* **`src/utils/overworld/overworldWildernessGen.ts`**: Organic wilderness, lakes, biome hazards, and wild monster camps.
* **`src/utils/overworld/overworldLivelySpawners.ts`**: Dynamic traveling merchants, wild camps, watchtowers, and ruins POIs.
* **`src/utils/overworld/overworldChunkGen.ts`**: Chunk orchestrator assembling overworld data structures.
* **`src/utils/overworld.ts`**: Unified re-export entrypoint preserving backward compatibility.

---

## 🧪 2. Verification & Test Suite Diagnostics

The test suite runs under Vitest and validates state mutations, combat calculations, procedural generation, AI schedules, and crafting routines across 20 test suites:

* **Total Test Suites**: 20 Passed (`100%`)
* **Total Unit Tests**: 80 Passed (`100%`)
* **Key Tested Domains**:
  1. `craftingAndAlchemy.test.ts`: Equipment forging, repairs, potion brewing, and recipe cooking.
  2. `worldGen.test.ts`: Overworld chunk generation, biome distribution, and town structure placement.
  3. `gameplaySimulation.test.ts`: Turn-based loop, tile interactions, and inventory management.
  4. `combatSimulation.test.ts` & `combat.test.ts`: Weapon hit chance, damage mitigation, critical strikes, and status effects.
  5. `ai.test.ts` & `npcSchedulesAndShelter.test.ts`: NPC daily schedule state transitions, weather shelter behavior, and enemy pathfinding.
  6. `harborPort.test.ts`: Port town generation, docks, and trade routes.
  7. `economyAndEvents.test.ts`: Market supply/demand scaling, merchant inventories, and gold transactions.
  8. `saveLoad.test.ts`: Local persistence serialization and state restoration.

---

## 🛠️ 3. Core Engine Structure Overview

```bash
src/
├── App.tsx                     # Main Game Loop & Orchestrator UI
├── hooks/
│   ├── crafting/               # Modularized Crafting Sub-Engine
│   │   ├── types.ts            # Crafting Props & Interfaces
│   │   ├── useEquipmentCrafting.ts # Weapon/Armor Forging & Upgrades
│   │   ├── useSurvivalCrafting.ts  # Campfire, Cooking & Fishing
│   │   └── useUtilityCrafting.ts   # Potions & Tool Crafting
│   ├── useCraftingEngine.ts    # Main Crafting Engine Aggregator
│   ├── useDungeonEngine.ts     # Dungeon Generation & Depth Logic
│   ├── usePlayerEngine.ts      # Player State, XP, & Stats
│   ├── useCombatEngine.ts      # Tactical Turn-based Combat Loop
│   ├── useNPCEngine.ts         # Schedules, Dialogue & Merchants
│   └── useAudioEngine.ts       # Synthesizer & Sound Effects
├── utils/
│   ├── overworld/              # Modular Overworld Generation Sub-System
│   └── overworld.ts            # Overworld Re-export Module
└── types/                      # Type Definitions
```

---

## 🚀 4. Summary & Health Status

* **TypeScript Compilation (`compile_applet`)**: ✅ SUCCESS
* **Linter Validation (`lint_applet`)**: ✅ 0 ERRORS
* **Automated Unit Tests (`npm test`)**: ✅ 80/80 PASSED
* **Runtime Dev Server**: ✅ Running on Port 3000

All requested refactoring, sub-engine separations, documentation updates, and verification tests are complete and verified working as intended.
