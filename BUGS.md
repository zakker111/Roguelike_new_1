# Game Bug Tracking & Resolution Register

## 🔴 Current Open Bugs
*None! All reported bugs, feedback items, and edge cases have been resolved and verified.*

---

## 🟢 Resolved Issue Registry

### Recent Gameplay & Mechanics Fixes
- **[RESOLVED] Traveling Merchant Wilderness Inventory & Markup** — Traveling merchants (Herbalists, Hunters, Pilgrims, Wandering Caravaneers) now possess dedicated inventories (potions, catalysts, survival gear, pelts, scrolls, materials, equipment) marked up by 30% for bringing goods into dangerous wilderness territories.
- **[RESOLVED] Follower Damage & Combat Engagement** — Hostile enemies now actively target and deal damage to active companions/followers in proximity, with combat log reporting and fallen state notifications.
- **[RESOLVED] Line of Sight & Ranged Enemies Through Walls** — Added `hasLineOfSight` raycasting checks so enemies no longer shoot, cast spells, or sense players through solid walls or watchtower barricades.
- **[RESOLVED] Save Game Retention & State Resets** — Expanded `useSaveLoad.ts` serialization and auto-load handlers to persist all game state fields including `playerZ`, `overworldZ`, `inventoryMaterials`, `inventoryCatalysts`, `followers`, `quests`, `relics`, `unlockedRecipes`, `gameTime`, `season`, and `weather`.
- **[RESOLVED] Campfire Raw Food Cooking** — Added direct spit-roasting and flame-grilling controls in the Campfire Cooking tab for Raw Meat (+25 HP), Prime Meat (+45 HP), and Raw Fish (+30 HP).
- **[RESOLVED] Hatchet & Pickaxe Crafting Metal Recognition** — Updated `useUtilityCrafting.ts` to accept any metal/iron alloy (`mat_iron`, `mat_copper_ore`, `mat_steel`, `mat_mithril`, `mat_royal_iron`) when crafting hatchets or pickaxes rather than strictly requiring `mat_iron`.
- **[RESOLVED] Faction Watchtower Key & Chest Lockpicking** — Watchtower Commanders drop `mat_watchtower_key`. Faction Tribute Chests can be unlocked via the key, Tension Lockpicks, or Grim Skeleton Keys.
- **[RESOLVED] Caravan Travel Route Preview** — Caravan travel modals display target town destinations and route previews clearly before purchase.
- **[RESOLVED] Tavern Drink Interaction Scope** — Dialogue option to buy drinks is accessible when talking to patrons, tavern guests, or NPCs enjoying leisure time.
- **[RESOLVED] Seppo Hammer Inventory Integration** — Equipment inventory correctly receives and displays hammer items purchased or traded from Seppo.
- **[RESOLVED] Multi-floor Z-level Elevation Collision** — Fixed elevation collision logic so players inside inns do not collide with NPCs located on different z-floors.
- **[RESOLVED] Town Guard Aggro & Castle Outskirt Spawns** — Town guards prioritize hostile threats targeting the town, and castle enemy spawners spawn on outer perimeter outskirts.
- **[RESOLVED] Equipment & Scroll Stacking Handlers** — Equipment slots and scroll stacks operate reliably in inventory with accurate stat bonuses and durability.

### Phase 31 Code Audit, Types & Canvas Optimizations
- **[RESOLVED] `types.ts` export resolution issue** — Restored explicit module re-exports in `src/types.ts`.
- **[RESOLVED] Un-batched canvas weather rendering calls** — Batched paths across rain, snow, dust storm, blizzard, ember, and blossom effects in `weatherLightingRenderer.ts`.
- **[RESOLVED] Excessive emoji regex testing during tile rendering** — Added memoized lookup cache in `spriteRenderer.ts`.
- **[RESOLVED] Unbound VFX particle allocation** — Capped active particles at 250 in `visualFxParticleSystem.ts`.

### Core Systems & Stability
- **[RESOLVED] Dungeon level generation crashes** — Fixed stair indexing, safe template lookups, and missing level bounds checks.
- **[RESOLVED] Follower trapping & pathing issues** — Added anti-trapping position swap mechanics and idle dispersion jitter.
- **[RESOLVED] Dual-wielding & shield equipment handlers** — Fully supported left/right hand equipping without stat duplication or crashes.
- **[RESOLVED] GameLog filter bar responsive clipping** — Converted GameLog filters to responsive wrapped flex layouts.
- **[RESOLVED] Caravan travel interaction scope** — Restricted traveling prompt options exclusively to genuine caravan master NPCs.
- **[RESOLVED] Companion target prioritization** — Ensured cats and pet followers only target entities actively hostile to the player.
- **[RESOLVED] Damage scaling balance** — Rebalanced high-level stat and damage scaling using sub-linear power curves in `balance.ts`.
- **[RESOLVED] Camera viewport tracking** — Implemented instant snap positioning on world chunk boundary transitions.

---

## 📊 Current Defect Status: ZERO OPEN BUGS
- **TypeScript Verification**: Clean (`tsc --noEmit` exit 0)
- **Applet Build**: Production Build Clean (`npm run build` exit 0)

