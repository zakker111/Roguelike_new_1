# 🛠️ Reusable Roguelike Engine Manual

> **Authoritative System Guide, Architecture Reference, and Content Authoring Manual**  
> *Engine Version: 1.0.0 (Step 10 Complete)*

---

## 🏛️ 1. Core Engine Philosophy & Architecture

The roguelike codebase is split into two cleanly separated tiers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HOW THE GAME WORKS  (ENGINE)                         │
│                                                                        │
│   • Entities & Spatial Grid       • Mathematical Combat Engine         │
│   • Ability Execution Pipeline    • Inventory & Container Engine       │
│   • Status Effects & Decay        • 2D Map, LOS & FOV Raycasters       │
│   • Modular AI Strategy Pattern   • Energy Turn Scheduling             │
│   • Procedural Dungeon Algorithms • Automated Content Validator        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         ContentRegistry (Coordinator)
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                  WHAT EXISTS IN THE GAME  (GAME)                       │
│                                                                        │
│   • Fantasy Lore & Bestiary       • Sci-Fi Space Station Demo          │
│   • JSON Data Catalogs            • Progression Curves & XP            │
│   • Weapon Crafting Blueprints    • Biome Weather & Factions           │
└────────────────────────────────────────────────────────────────────────┘
```

### The Golden Separation Rule:
- **`ENGINE`** = **HOW THE GAME WORKS** (Mechanics, math, algorithms, lifecycle scheduling, spatial geometry).
- **`GAME`** = **WHAT EXISTS IN THE GAME** (Enemies, items, weapons, spells, dungeon templates, progression balance).

The exact same engine can run **Fantasy Roguelikes**, **Sci-Fi Crawlers**, **Cyberpunk Arenas**, or **Lovecraftian Horror** without modifying engine source code.

---

## ⚡ 2. The 10 Engine Subsystems

### Subsystem 1: Clean Enemy Pipeline
```text
EnemyDefinition ──▶ EnemyRegistry ──▶ SpawnTable ──▶ Runtime Enemy ──▶ AI ──▶ Combat ──▶ Rendering
```
- **Definition** (`src/engine/entities/types.ts`): Data-driven schema containing `id`, `name`, `baseHp`, `baseAtk`, `baseDef`, `range`, `speed`, `char`, `color`, `aiRole`, `abilities`, `tags`, and `dropMaterials`.
- **Registry** (`src/engine/entities/EnemyRegistry.ts`): Singleton repository supporting runtime registration, fuzzy alias resolution (`wolf` -> `CryoStalker`), and threat scaling instantiation (`createRuntimeEnemy`).
- **Spawn Tables** (`src/engine/entities/SpawnTable.ts`): Weighted distribution tables with min/max depth bounds and tier constraints.

### Subsystem 2: Universal Abilities Pipeline
- **Contracts** (`src/engine/abilities/types.ts`): Standardized `AbilityDefinition` supporting single-target, radial area, directional, cone, and self targeting.
- **Executor** (`src/engine/abilities/AbilityExecutor.ts`): Validates mana costs and cooldowns, handles LOS checks, calculates base power scaling, applies secondary status effects, and dispatches procedural combat VFX stamps.

### Subsystem 3: Decoupled Status Effects
- **Definition** (`src/engine/effects/types.ts`): Pure declarative status effect definitions (`EffectDefinition`).
- **Manager** (`src/engine/effects/EffectManager.ts`): Manages active effect stacks, stacking models (`refresh`, `stack_duration`, `stack_intensity`), turn-based damage/healing ticks, damage absorption shields, stat modifiers, and action inhibition flags (stun/freeze).

### Subsystem 4: Generic Entity Taxonomy
- **Hierarchy** (`src/engine/entities/types.ts`): Unified taxonomy based on `BaseEntity` with 9 concrete variants:
  1. `PlayerEntity`: Hero stats, gold, inventory, equipment.
  2. `EnemyEntity`: Hostile entities, drop tables, elite modifiers.
  3. `NpcEntity`: Merchants, quest givers, schedules, dialogue.
  4. `AnimalEntity`: Neutral/huntable fauna, prey behaviors.
  5. `SummonEntity`: Conjured minions with turn lifespan decay.
  6. `TrapEntity`: Hidden/revealed step traps and disarm mechanics.
  7. `ProjectileEntity`: Ballistic projectiles flying across turns.
  8. `ItemEntity`: Physical ground loot and containers.
  9. `InteractableEntity`: Shrines, doors, chests, levers, campfires.
- **Spatial Manager** (`src/engine/entities/EntityManager.ts`): $O(1)$ spatial coordinate indexing (`getAt(x, y)`), collision queries, and turn lifecycle updates.

### Subsystem 5: Pluggable AI Strategy Pattern
- **Contract** (`src/engine/ai/types.ts`): `IAIStrategy.decideAction(context): AIAction`.
- **Built-in Strategies** (`src/engine/ai/strategies/`):
  - `MeleeStrategy`: Direct line-of-sight tracking and melee strikes.
  - `RangedStrategy`: Distance maintenance and line-of-sight projectile fire.
  - `KitingStrategy`: Standoff corridors, retreat from encroaching melee.
  - `CowardStrategy`: Unconditional fleeing away from threats.
  - `AggressiveStrategy`: Relentless pursuit disregarding personal health.
  - `DefensiveStrategy`: Guarding choke points and perimeter sentry duties.
  - `SummonerStrategy`: Tactical standoff summoning minion swarms.
  - `PatrolStrategy`: Scheduled waypoint route patrolling.
  - `BossStrategy`: Multi-phase behavior adapting dynamically as HP depletes.

### Subsystem 6: Modular Dungeon Generation
- **Contract** (`src/engine/dungeon/types.ts`): `IDungeonGenerator.generate(config): DungeonGenerationResult`.
- **Algorithms** (`src/engine/dungeon/generators/`):
  - `RoomAndCorridorGenerator`: Classical interconnected rooms with winding corridors.
  - `BSPDungeonGenerator`: Binary Space Partitioning tree with guaranteed connectivity.
  - `CellularAutomataCaveGenerator`: Organic caverns using cellular automata birth/survival rules.
  - `ArenaDungeonGenerator`: High-density trial colosseums and boss arenas.
- **Room Registry** (`src/engine/dungeon/RoomRegistry.ts`): Semantic room blueprints (`entrance`, `exit`, `encounter`, `treasure`, `shrine`, `shop`, `boss`, `secret`, `corridor_hub`, `cavern`) with bounded dimensional sampling.

### Subsystem 7: Mathematical Combat Engine
- **Engine** (`src/engine/combat/CombatEngine.ts`): Resolves attacks, hit rolls, critical strikes, armor penetration, flat/ratio mitigation, damage variance, resistances, and overkill calculation purely from numeric parameters.

### Subsystem 8: Generic Inventory Containers
- **Engine** (`src/engine/inventory/InventoryEngine.ts`): Container manager enforcing capacity limits, optional weight caps, item stack grouping, slot querying, and container-to-container transfers.

### Subsystem 9: 2D Spatial Geometry & Rules
- **Grid Map** (`src/engine/map/GridMap.ts`): 2D spatial grid supporting walkability/transparency flags, distance calculations (Manhattan, Euclidean, Chebyshev), Bresenham line-of-sight raycasting, and radial Field of View (FOV).
- **Pathfinder** (`src/engine/map/Pathfinder.ts`): Generic A* pathfinding finding shortest walkable routes around obstacles.
- **Turn Engine** (`src/engine/rules/TurnEngine.ts`): Speed-based action energy accumulation scheduling turns dynamically (faster actors act more frequently).

### Subsystem 10: Master Coordinator & Validation Engine
- **Coordinator** (`src/engine/registry/ContentRegistry.ts`): Singleton giving unified access to all 8+ sub-registries (`enemies`, `items`, `weapons`, `abilities`, `effects`, `rooms`, `generators`, `aiStrategies`, `entities`, `spawnTables`).
- **Validator** (`src/engine/validation/ContentValidator.ts`): Autonomous audit engine catching duplicate IDs, missing fields, invalid AI roles, unknown abilities, broken effect references, and malformed spawn tables.

---

## 📖 3. Content Authoring Guide: Adding Content in Minutes

### Adding a New Enemy
To register a new enemy in the game, define its entry:

```typescript
import { ContentRegistry } from './engine';

const content = ContentRegistry.getInstance();

content.enemies.register({
  id: 'ShadowAssassin',
  name: 'Shadow Guild Assassin',
  baseHp: 24,
  baseAtk: 7,
  baseDef: 2,
  range: 1,
  speed: 1.4,               // 40% faster than standard speed
  char: 'a',
  color: '#8b5cf6',
  aiRole: 'skirmisher_kiting',
  abilities: ['shadow_step'],
  tags: ['humanoid', 'assassin', 'stealth'],
  dropMaterials: ['mat_shadow_silk']
});
```

### Adding a New Ability
```typescript
content.abilities.register({
  id: 'shadow_step',
  name: 'Shadow Step',
  type: 'teleport',
  targetType: 'single_tile',
  range: 5,
  cooldown: 4,
  manaCost: 10,
  icon: '🌑',
  color: '#7c3aed',
  description: 'Melts into shadows, reappearing behind the opponent.'
});
```

### Adding a New Status Effect
```typescript
content.effects.register({
  id: 'shadow_mark',
  name: 'Marked for Death',
  type: 'debuff',
  icon: '🎯',
  color: '#4c1d95',
  description: 'Lowers armor defense and increases incoming damage.',
  defaultDuration: 4,
  maxStacks: 1,
  stacking: 'refresh',
  statModifiers: { def: -4 }
});
```

### Creating an Overworld/Dungeon Spawn Table
```typescript
content.spawnTables.register({
  id: 'shadow_coven_encounters',
  name: 'Shadow Coven Depths',
  entries: [
    { enemyId: 'ShadowAssassin', weight: 35, minDepth: 3 },
    { enemyId: 'SkeletonMage', weight: 30, minDepth: 2 },
    { enemyId: 'OrcBrute', weight: 20 }
  ]
});
```

---

## 🚀 4. Proving the Final Test: Hot-Swapping Games

The engine's modularity was demonstrated in `src/game/demo/sciFiGameDemo.ts`. By invoking `bootstrapSciFiRoguelike()`, the exact same engine is repurposed into a **Cyberpunk / Sci-Fi Station Roguelike**:

```typescript
import { ContentRegistry, CombatEngine, GridMap, Pathfinder, TurnEngine } from './engine';
import { bootstrapSciFiRoguelike } from './game';

// 1. Re-initialize registries with Sci-Fi content
const content = ContentRegistry.getInstance();
bootstrapSciFiRoguelike(content);

// 2. All engine systems operate identically on the new content:
//    - Security Drones & Xenomorph Stalkers
//    - Plasma Rifles & Stun Batons
//    - Orbital Strikes & EMP Pulses
//    - Space Station Airlocks & Reactor Cores
```

No engine pipelines or rendering loops required modification.

---

## 🔍 5. Automated Validation & Verification

### Running Automated Content Validation
```bash
# Audits all JSON catalogs, references, and blueprint integrity
npm run validate:content
```

### Running the Full Test Suite
```bash
# Executes all 95 test suites (685 unit tests across the repository)
npm test

# Executes all engine-specific test suites (113 unit tests)
npx vitest run src/tests/engine/
```

### Build & Compilation Check
```bash
npm run build
```

---

## 📂 6. File Structure Reference

```text
/src/engine/
├── abilities/               # Ability contracts, registry, and execution pipeline
├── ai/                      # Strategy pattern behaviors and AI manager
├── combat/                  # Mathematical combat engine & damage formulas
├── dungeon/                 # Procedural generators, room blueprints, dungeon manager
├── effects/                 # Decoupled status effects and manager
├── entities/                # Universal taxonomy, blueprints, spatial indexing
├── inventory/               # Containers, slots, stacking, and transfer engine
├── items/                   # Data-driven items and weapon template registries
├── map/                     # GridMap, Bresenham LOS, radial FOV, A* Pathfinder
├── registry/                # Master ContentRegistry coordinator
├── rules/                   # Action energy turn scheduling engine
├── validation/              # Automated content validation engine
└── index.ts                 # Unified engine barrel export

/src/game/
├── content/                 # Game-specific content bootstrappers
├── rules/                   # Game balance curves and XP thresholds
├── demo/                    # Sci-Fi roguelike alternative genre demo pack
├── bootstrap.ts             # Master fantasy game content initializer
└── index.ts                 # Game content barrel export
```
