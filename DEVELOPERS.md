# 🌌 Cosmic Abyss Roguelike Engine: Developer & Modding Guide

Welcome, Sovereign Creator! This guide is designed to help you, or any developer, understand the core architecture of the **Cosmic Abyss Roguelike Engine** and easily extend its gameplay, weather, items, combat, or AI systems.

---

## 📂 Project Structure Overview

```bash
/src
  ├── App.tsx                    # Core Game Loop & Global State Machine (Turn Controller)
  ├── types.ts                   # Unified Game Engine Type Definitions
  ├── main.tsx                   # React Entry Point
  ├── index.css                  # Tailwinds Styling Entry Point
  │
  ├── 📂 hooks                   # Custom Domain Engine Hooks (v4.0.5)
  │   ├── useCraftingEngine.ts   # Forging, cooking, campfires, anvils, repairs & mutation forge (NEW)
  │   ├── useSpellcasting.ts     # Spell casting, mana verification, projectile targeting & scroll consumption (NEW)
  │   ├── useWorldInteraction.ts # Overworld stairs, resource harvesting (trees/ore), door opening (NEW)
  │   ├── useEnemyAI.ts          # Pathfinding, faction chase algorithms, and enemy turn solver
  │   ├── useCombatEngine.ts     # Attack calculations, scar triggers, overforge heat recoil
  │   ├── usePlayerMovement.ts   # Movement logic, tile collisions, stamina consumption
  │   ├── useKeyboardInput.ts    # Key bindings, hotkey actions, and modal input suppression
  │   ├── useEquipmentHandlers.ts# Equipment equipping, unequipping, swapping, durability & stat hooks
  │   └── useSaveLoad.ts         # LocalStorage serialization, auto-save timers
  │
  ├── 📂 world                   # Isolated World & Dungeon Generators (v4.0.4)
  │   ├── dungeonGen.ts          # Procedural Cave/Dungeon Generator
  │   └── overworldGen.ts        # Overworld chunk generation & landmark placement
  │
  ├── 📂 components              # Modular UI Components & Screens
  │   ├── GameCanvas.tsx         # Canvas-based Grid Rendering Engine
  │   ├── CraftingPanel.tsx      # Alchemy, Forging & Cook Station Panel
  │   ├── GodPanelOverlay.tsx    # Sovereign Developer Console (Toggles & Spawning)
  │   ├── ChunkMinimap.tsx       # Overworld Map & Fog of War Visualizer
  │   └── ...                    # Specific Modals & Interfaces
  │
  ├── 📂 data                    # Static Game Databases & JSON Schemas
  │   ├── balance.ts             # Centralized XP leveling formulas, armor mitigation, & combat curves (NEW)
  │   ├── economy.json           # Settlement trade tables, reputation tiers, & biome pricing (NEW)
  │   ├── dialogues.json         # Externalized NPC dialogue trees & quest matrices (NEW)
  │   ├── combatFlavors.ts       # Text generators for rich narrative combat
  │   ├── enemies.json           # Declarative base monster stats
  │   ├── gameConfig.json        # Engine tuning constants
  │   ├── townTemplates.json     # Town layouts and merchant spawn configs
  │   ├── worldConfig.json       # Biome thresholds, climate occurrence weights, and hazards
  │   ├── relics.json            # Externalized Relic definitions and properties
  │   ├── spellScrolls.json      # Externalized Spell Scroll templates and mana costs
  │   └── scars.json             # Externalized Scar definitions and severity tables
  │
  └── 📂 utils                   # Pure Functional Engine Sub-Systems
      ├── weatherEngine.ts       # Data-driven weather effects & modifiers (NEW)
      ├── spellsAndEquipment.ts  # Spell lists, starting gear, and magical spell structures (NEW)
      ├── shopData.ts            # Merchant stock generators and trade config utilities (NEW)
      ├── fleeQuotes.ts          # Procedural enemy fleeing dialogue quotes (NEW)
      ├── caravanAndTerritory.ts # Caravan schedules, traveling guards, and territory conquest maps (NEW)
      ├── itemsData.ts           # Item Templates, Catalysts, and Materials
      ├── dungeon.ts             # Procedural Cave/Dungeon Generator
      ├── overworld.ts           # Deterministic Chunk Generator with Seeds
      ├── ai.ts                  # Pathfinding (Bresenham, FOV, A*)
      ├── itemWeight.ts          # Encumbrance & Inventory Weight Calculator
      ├── scars.ts               # Permadeath "Scars of the Defeated" Generator
      └── tradeEconomy.ts        # Guild Upgrades, Commerce & Caravans
```

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

### Step 1: Add to `types.ts`
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
- **Spells & Spellcast**: Cast costs and custom magic projectiles are handled under `handleCastSpell` in `src/App.tsx`.
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
The God Panel includes a layout applicator JSON input field (`handleApplyHousesJson` in `GodPanelOverlay.tsx`). Modders can import custom coordinate maps to instantly carve multiple modular structures across the active settlement overworld in real-time.

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

## 🛠️ Modding Cheat Sheet / Developer Toggles

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

1. **Modular Hook Abstraction (`useEquipmentHandlers.ts`)**: Encapsulates slot assignment, stat recalculations, and durability decay tracking into a dedicated custom hook.
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

## ⚡ The Over-Forging Heat & Bellows Risk/Reward Engine (`OverforgeGauge.tsx`)

The Over-Forging Heat System is a modular risk-versus-reward mechanic integrated into `CraftingPanel.tsx` (Forge Equipment, Mutation Forge, and Upgrade Gear sub-tabs).

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

## 🗑️ Discard & Drop Item Gump Modal (`DiscardItemModal.tsx`)

When players select `[DISCARD]` on any item in the inventory (`UnifiedInventoryPanel.tsx`), the system opens an interactive fantasy-styled Gump modal.

### 1. Key Features
- **Visual Presentation**: Renders the item's icon, name, rarity border, description, and unit weight contribution.
- **Stackable Quantity Slider**: For stackable items (crafting alloys, catalysts, potions, spell scrolls), provides a quantity slider and number input to choose exactly how many items to discard or drop.
- **Two Disposal Pathways**:
  - **Drop on Ground**: Spawns a physical `GroundLootPile` on the player's tile (`playerPos.x, playerPos.y`). The item remains visible on the world canvas and can be picked back up at any time.
  - **Destroy / Vaporize**: Permanently purges the item/quantity from the game state.

### 2. Stackable Spell Scrolls
All scrolls (Scroll of Recall, Fireball Scrolls, Teleport Scrolls) are configured with `stackable: true` and `isScroll: true` in `itemsData.ts`, ensuring multiple scrolls merge into single inventory stacks with quantity counts.

---

## 🌀 Unstable Mutation Synergy Chain Engine (`mutationSynergy.ts` & `MutationSynergyPanel.tsx`)

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

## 🌌 Autonomous GM Engine Architecture & Controls

The **Autonomous GM (Game Master) Engine** (`src/utils/gmStoryteller.ts`) is an intelligent, reactive narrative controller running natively inside the game loop. It monitors battlefield tension, player HP ratios, movement patterns, and idle turns to dynamically steer gameplay events.

### ⚙️ Core Parameters & Default State
- **Default Enabled**: The Autonomous GM Engine is **ON by Default** (`gmAutonomousWeather: true` in initial `GameState` and `WorldContext`).
- **Ritual Turn Interval**: Configured by default to **25 turns** (`gmWeatherInterval: 25`), governing atmospheric weather transitions and narrative interventions.
- **Storyteller Personalities**: Dynamically shifts between `Benevolent`, `Intrigued`, `Mischievous`, `Sadistic`, and `Apathetic` based on player status and boredom metrics.

### 🌀 Dynamic Storyteller Interventions
When active, the Autonomous GM monitors each turn step and automatically invokes narrative interventions when specific battlefield conditions are met:
1. **Divine Protection Aura**: Casts a protective shield when player HP drops into critical danger (< 15% max HP).
2. **Guardian Paladin Spawn**: Summons an Ethereal Holy Templar follower during extreme battlefield pressure or boss fights.
3. **Ether Mana Surge**: Channels raw MP directly to the player when their mana reservoir reaches 0.
4. **Alchemical Sprite Manifestation**: Drops a Volatile Alchemical Sprite near the player carrying high-tier elemental catalysts.
5. **Ore Thief & Bandit Camp Spawns**: Summons Ilmarinen's Ore Thieves carrying rare metals or outlaw encampments around campfires.
6. **Spike Traps & Chaos Surges**: Sadistic or mischievous moods trigger local floor spike hazards or passive chaos rolls.
7. **Global Weather Rituals**: Autonomously invokes Solar Cleansings, Storm Callings, Shadow Fog Chants, Frostfalls, Sandstorms, and Glacial Blizzards.

### 🛠️ Developer Inspection & Controls
Developers can inspect and adjust the Autonomous GM Engine in real time through multiple tools:
1. **God Panel (`F12` / `~`)**:
   - Displays the **`GM ENGINE: ACTIVE (DEFAULT ON)`** live badge in the header.
   - Under the **Sovereign** tab, developers can toggle the Autonomous GM Engine on/off, adjust the Ritual Turn Interval (10, 25, 40, 60, 100 turns), and monitor GM Boredom Pressure.
2. **GM Storyteller Panel (`/` Console or GM Metrics Button)**:
   - Provides live readouts of the GM's internal monologue thoughts feed, active personality, boredom %, and tension rating.
   - Allows forcing specific interventions (e.g., Immediate Rift Spawn, Lightning Smite, Paladin Summoning) on demand.

---

## 📄 High-Performance Log System & Replay Importer Architecture

The game includes a zero-lag log management and simulation replay architecture (`src/components/GameLog.tsx`, `src/components/GodPanelOverlay.tsx`):

### 1. High-Volume Log Stream Virtualization & Duplicate Collapsing
- **Virtual DOM Slicing**: Rendered logs in `GameLog.tsx` are hard-capped at the latest **150 entries** (`maxRenderedLogs = 150`), preventing React DOM layout recalculation freezes even when 50,000+ combat actions are accumulated in memory.
- **Consecutive Message Aggregation**: Identical consecutive log events (e.g. repeated melee swings) are automatically collapsed into single rows with counter badges (`(x5)`), reducing visual clutter.

### 2. Zero-Lag Drag-and-Drop File Importer
- **File Reader Stream Loading**: The Replay Simulation Dock in God Panel accepts large log `.txt` or `.json` file uploads via drag-and-drop or direct device file picker.
- **Preview Truncation & Non-Allocating Parsing**: Text previews in state are truncated to 50,000 characters to ensure 60 FPS UI responsiveness, while the full file stream parses embedded JSON replay blocks (`--- COMPREHENSIVE SIMULATOR REPLAY DATA ---`) in background ticks.
[diff_block_end]






