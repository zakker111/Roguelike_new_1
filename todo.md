# Roguelike Engine Improvement Plan

## 🎯 Goal
Turn the existing `Roguelike_new_1` project into a reliable, modular, reusable roguelike engine capable of powering multiple genres (fantasy, sci-fi, horror, dungeon crawlers) without breaking the current game or rewriting working systems.

---

## 🏛️ Top 5 Architecture & Code Problems (Audited)

1. **Fragmented Enemy Spawning & Template Resolution Pipelines [High Severity]**
   - *Files:* `src/world/dungeon/dungeonEntities.ts`, `src/hooks/ai/aiTurnEnvironment.ts`, `src/world/outposts/outpostSiegeSpawner.ts`
   - *Issue:* At least 4 ad-hoc entity instantiation pathways existed. `spawnDungeonStandardEnemies` maintained an inline hardcoded weight array mutated by depth checks instead of using `SpawnTableRegistry`.
   - *Resolution:* Registered `dungeon_standard` in `SpawnTableRegistry` with min/max depth scaling and connected `spawnDungeonStandardEnemies` and roaming spawns in `aiTurnEnvironment.ts` directly to `SpawnTableRegistry.rollEnemy('dungeon_standard', depth)`.

2. **Hardcoded Special Cases in Combat Drops & AI Behaviors [High Severity]**
   - *Files:* `src/hooks/combat/combatLoot.ts`, `src/hooks/ai/tactics/aiTelegraphTactics.ts`, `src/hooks/ai/tactics/aiSupportTactics.ts`, `src/hooks/ai/tactics/aiFlankingTactics.ts`, `src/hooks/ai/tactics/aiKitingTactics.ts`
   - *Issue:* Entity roles and drops relied on hardcoded `e.type === EnemyType.Hiisi` checks instead of checking `e.dropMaterials`, `e.aiRole === 'telegraph'`, `e.aiRole === 'support'`, or `e.tags.includes('water_walk')`.
   - *Resolution:* Converted drop calculation in `combatLoot.ts` to iterate over `enemy.dropMaterials` and `enemy.dropCatalysts`. Refactored `aiTelegraphTactics.ts`, `aiSupportTactics.ts`, and movement checks to evaluate `aiRole`, `abilities`, and `tags` cleanly.

3. **Rigid Enum-Bound Entity Taxonomy (`EnemyType`) [Medium Severity]**
   - *Files:* `src/types/entities.ts`, `src/engine/entities/EnemyRegistry.ts`, `src/world/dungeon/dungeonEntities.ts`
   - *Issue:* `Enemy.type` was constrained by the fantasy `EnemyType` enum, impeding modding or alternative genre content packs.
   - *Resolution:* Relaxed `Enemy.type: EnemyType | string`, added `abilities?: string[]`, `tags?: string[]`, and `isWaterWalkable?: boolean` to the canonical `Enemy` interface, and enabled string ID lookups and dynamic aliases in `EnemyRegistry`.

4. **Coupling of Core Game Rules & Math to React Hooks & DOM Events [Medium Severity]**
   - *Files:* `src/hooks/combat/combatMath.ts`, `src/hooks/usePlayerAttack.ts`, `src/engine/combat/CombatEngine.ts`
   - *Issue:* Turn-based game logic and damage calculations were intertwined with React state dispatchers, audio hooks, and DOM CustomEvents rather than executing through a pure headless simulation engine.
   - *Resolution:* Leveraged headless `CombatEngine`, `TurnEngine`, `GridMap`, and `Pathfinder` in `src/engine/` to enable pure simulation tests and genre hot-swapping outside React lifecycles.

5. **Content Validator Gaps in Spawn Tables, Abilities & AI Roles [Low-Medium Severity]**
   - *Files:* `scripts/validateContent.cjs`, `src/engine/validation/ContentValidator.ts`
   - *Issue:* Validation scripts checked enemy base stats and item names, but failed to validate spawn table references, enemy ability existence in `AbilityRegistry`, and AI role strings.
   - *Resolution:* Upgraded `scripts/validateContent.cjs` to validate `aiRole` values against known strategies and cross-referenced abilities against `AbilityRegistry`. Caught and resolved 2 real data bugs (`Hiisi` and `Nakki` using obsolete `'flanker'` instead of canonical `'flanking'`).

---

## 🗺️ Implementation Progress

### Phase 1: Canonical Enemy & Entity Creation Pipeline
- [x] **1.1**: Audit existing enemy spawning pathways across dungeon, town, outposts, and overworld.
- [x] **1.2**: Connect `dungeonEntities.ts` (`spawnDungeonStandardEnemies`) to `SpawnTableRegistry` with depth filtering.
- [x] **1.3**: Wire roaming monster spawns in `aiTurnEnvironment.ts` to `SpawnTableRegistry.rollEnemy`.
- [x] **1.4**: Extend `getEnemyTemplate` and `spawnDungeonBoss` to pass full data-driven `dropMaterials`, `dropCatalysts`, `aiRole`, `abilities`, and `tags`.

### Phase 2: Data-Driven AI Roles, Capabilities & Loot Drops
- [x] **2.1**: Refactor `combatLoot.ts` to read drops directly from `enemy.dropMaterials` and `enemy.dropCatalysts`.
- [x] **2.2**: Refactor `aiTelegraphTactics.ts` to trigger on `aiRole === 'telegraph'` or `abilities.includes('ground_slam')` / `'heavy_cleave'`.
- [x] **2.3**: Refactor `aiSupportTactics.ts` to trigger on `aiRole === 'support'` or registered healing/buff abilities (`heal_ally`, `bloodlust`).
- [x] **2.4**: Refactor terrain traversal checks in `aiFlankingTactics.ts`, `aiKitingTactics.ts`, and `aiRetreatPatrolTactics.ts` to check `tags.includes('water_walk')` or `isWaterWalkable`.

### Phase 3: Entity Taxonomy & Registry Independence
- [x] **3.1**: Relax `Enemy.type` in `/src/types/entities.ts` to support `EnemyType | string`.
- [x] **3.2**: Add `abilities`, `tags`, and `isWaterWalkable` fields to the runtime `Enemy` interface.
- [x] **3.3**: Ensure `EnemyRegistry.createRuntimeEnemy` passes these fields to created runtime entities.

### Phase 4: Enhanced Content Validation & Referential Integrity
- [x] **4.1**: Upgrade `scripts/validateContent.cjs` to validate `aiRole` values against known strategies.
- [x] **4.2**: Register boss abilities (`ground_slam`, `heavy_cleave`, `blizzard`, `heal_ally`, `bloodlust`) into `AbilityRegistry`'s `DEFAULT_ABILITIES` and `gameAbilities.ts`.
- [x] **4.3**: Register strategy aliases (`flanking`, `flanker`, `telegraph`) in `AIStrategyRegistry`.
- [x] **4.4**: Verify standalone `validateContent.cjs` passes with 0 errors, 0 warnings.

### Phase 5: Reusable Engine Demonstration & Test Scenario
- [x] **5.1**: Verified hot-swapping demonstration via `bootstrapSciFiRoguelike` and `src/tests/engine/EngineGameSeparation.test.ts`.
- [x] **5.2**: Proved that entities, combat, weapons, and abilities resolve cleanly on an entirely different genre without modifying core engine files.

### Phase 6: Verification & CI Stability
- [x] **6.1**: Run full test suite: 98/98 test files passed (726/726 tests green).
- [x] **6.2**: Run static typecheck (`npm run lint` / `tsc --noEmit`): 0 errors.
- [x] **6.3**: Build and bundle compilation (`compile_applet`): 100% successful.
- [x] **6.4**: Verify Arto the Iron Breaker special rare companion (350g, once-per-session spawn, developer memorial tribute).

---

## 📊 Verification & Test Metrics
- Test Suites: 98 passing (726 unit/integration tests).
- Linting: 0 TypeScript errors (`tsc --noEmit`).
- Data Catalogs: 31 JSON catalogs validated.
- Standalone Validation: 0 errors, 0 warnings across all enemies, items, weapons, and drops.
- Gameplay Simulations: 100% green across all 28 simulated gameplay runs.

