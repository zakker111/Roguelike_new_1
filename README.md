# Abyss Rogue: Chronicles of the Forge

Abyss Rogue is highly interactive, procedurally generated full-screen tactical roguelike RPG with durable persistence, deep combat systems, and a dynamic material crafting system.

---

## 🎮 Game Summary & Core Features

Abyss Rogue provides a classical grid-based turn-based adventure built with supreme visual fidelity and robust offline state simulation:

1. **Procedural Infinite Overworld**:
   - Scroll infinitely across distinct environmental biomes (Forests, Deserts, Swamps, and Glaciers) powered by jumbo-sized **64x40 grids** per chunk.
   - **Safe Player Spawning & Repositioning**: Incorporates a 20-tile scanning safety validator `findNearestSafePlayerTile` so that players never spawn or get stuck in walls, trees, water, or mountains during initial boots, chunk boundary crossings, caravan arrivals, and Recall Scroll teleports.
   - Experience active daylight shading and climate overlays (falling rain, snowstorms, dense fog) that shift dynamically every 40 turns.
   - **Winter Frost Berry Freeze**: Sweet berry bushes are frozen in glacial tundra biomes. Attempting to harvest them displays an immersive winter freeze notice while swamp biomes feature custom purple wild elderberries (`🫐`).
   - **Modular Building Design**: Evaluates building IDs sequentially to spawn shop-specific furniture (anvils, warm hearths, glass vials, tables, counter blocks).
   - **Castle Fortresses**: Fortified keeps and citadels have a 25% chance of spawning in place of standard overworld villages, dynamically calculating stone wall perimeters, gates, courtyard paving and torch points using the full 64x40 chunk boundaries.
   - **Cardinal Compass Overlays**: Pristine glasses-style direction indicators (NORTH, SOUTH, EAST, WEST) bounding the game canvas margins to simplify overworld travel.
   - **Modular Chunk Minimap (`ChunkMinimap.tsx`)**: Refactored the previous inline map grid renderer into a high-performance, memoized standalone component. Renders an active 21x21 grid representing a 10-tile radius around the adventurer, matching individual terrain colors (walls, water, roads, stairs, landmarks) with robust string-based `TileType` enum checking.
   - **Storyteller Point of Interest Nudges**: Implements deterministic storytelling updates about nearby castles, cozy villages, ruins, and caverns depending on adjacent chunk positions (located in `/src/utils/gmNarrator.ts`).
   - **Interactive Landmark POIs**: Encounter active Landmarks (Shrines, Crucibles, Monoliths, Keeps, and Fossils). Approaching them launches rich, choice-driven encounters for custom alchemical, physical, and stat-modifying rewards.
   - **Wandering Wilderness Merchants**: Encounter rare roving traders like **Drunk Merchant Seppo (S)** who spawns procedurally on grass tiles in wilderness chunks (4% chance). Sells premium items (Finnish Sisu Hammer 🪵, Ever-Burning Flask 🛡️, Seppo's Secret Hooch 🍶) and features rich, comedic log commentary.
   - **Adaptive Seasonal Cycles (Planned Roadmap)**: Dynamic Spring, Summer, Autumn, and Winter cycles with high-fidelity mechanical and visual impacts (e.g., Spring harvest abundance, Summer dehydrating heat, Autumnal stealth fog, and Winter lake freezes).
2. **Persistent Multi-Floor Dungeons**:
   - Climb up and down staircases between Abyss floor depths 1 to 10. Reaching Floor 6 breaches the volcanic Underworld Depths, complete with bubbling lava hazard pools and the guaranteed Surtur the Magma Arch-demon Overlord boss encounter at Floor 10.
   - Layout state is completely frozen and saved when leaving standard floors, preventing enemy duplication or lost effort.
3. **Visceral Kinetic Battles**:
   - Knock back enemies using blunt heavy weapons into adjacent grid cells.
   - Real-time animated particles floating when characters suffer injuries or heal.
   - Dynamic blood color matching (outlaws bleed crimson red, giant swamp bugs leave toxic green, and skeleton mages splash celestial cyan).
   - Turn-based blood decay organically cleaning the dungeons tile-by-tile.
4. **Allied Companions**:
   - Recruit mercenaries from dynamic tavern bars; upon hire they spawn as physical allies in the world, follow you across chunks, and dynamically attack nearby monsters.
   - **Intelligent Faction Awareness**: Companions and followers (including special cats) never attack friendly town guards, peacekeepers, or allied caravan defenders unprovoked. They will immediately join the fight if the player initiates hostilities.
   - Core behavioral stances (target aggressive vs hold/wait) can be toggled on demand.
   - Real character permadeath and physical companion remains are preserved natively on the battlefield.
5. **Dungeon Forge Crafting & Adaptive World Threat**:
   - Gather basic metals, bones, elemental catalysts (Flame Ignition Core, Everfrost Shard, Viper Poison Sap, Volt Amber Clump) from chests and slain beasts.
   - Shape unique weapons at anvils with custom scaling multipliers.
   - **Adaptive Threat Scaling**: World difficulty automatically scales monster HP and damage dynamically based on your level, spent stat points, and equipped gear quality.
   - **Trauma Safeguards**: Spend unspent attribute points securely; a fully permanent allocation mechanism with no decrementing minus buttons ensures all spent points are committed immediately, completely eliminating refund exploits or negative stat tricks.
6. **Advanced Trade Economy & Guild Houses (v3.8.0)**:
   - Experience biome-based supply and demand, with prices and payouts fluctuating visually depending on the active overworld biome (e.g. Desert wood price premiums, tundra hooch spikes).
   - Found a personal **Guild Headquarters** in Oakhaven Town to research Sunder Logistics deals, Map Room speed increases, and decorate your home with powerful sanctuary ornaments.
   - Secure wilderness safehouses with deep cross-overworld stashes to store extra metals, catalysts, weapons, and armor. Assign **any active companion follower** as a dedicated guardian who keeps your stash safe under custom nameplates and personalized dialogs.
   - Survive **Hardcore Caravan Escorts** to transport merchants between discovered overworld towns. Features an extreme (85%) random road event rate with high-difficulty d20 checks (DC 17-19), doubled failure penalties, and high toll/repair requirements (500g, 15x berries, 8x iron ore, 18x planks), yielding massive renown and currency payouts on success.
   - Conduct **Autonomous Companion Expeditions** to dispatch standby companions on scouting missions and collect high-tier rewards.
   - Pledge alliances to the **Moonshadow Syndicate** or the **Dawn Vanguard** to craft exclusive high-tier faction gear.
7. **Town Progression & Renown Expansion (v2.5.5)**:
   - Advance through 4 distinct reputation milestone tiers: *Sunder Outlaw* (0-20, hostile guards, trading blocked), *Wandering Mercenary* (21-50, standard rates), *Honored Protector* (51-80, 10% discount), and *Champion of Sunder* (81-100, 20% discount, elite guard companion recruitment, rare stocks).
   - Upgrade the Blacksmith forge and Apothecary lab to earn massive reputation boosts (+8 to +15), unlock higher-tier resources, and buy advanced equipment.
   - Embark on the unique Outlaw Pardon Quest to wipe your criminal record clean if your reputation falls into the criminal outlaw bracket.
8. **Life Skills, Campfire Cooking & Apothecary Brewing (v2.6.0)**:
   - Harvest raw lumber from Birch/Pine logging trees and minerals from rich Copper/Iron veins generated on overworld chunks.
   - Cook gourmet meals (Lightning Grilled Salmon, Spicy Crimson Salmon, Glacial Frost Ribs, Shadow Smoked Jerky) adjacent to any warm Campfire to gain powerful active combat buffs or completely purge physical exhaustion.
   - Upgrade your Apothecary Laboratory up to Tier 3 to brew ancient elixirs (Regenerative Dew, Hyper Focus, Ironheart Fortitude, Shadow-Warp Void) that restore vital stats and permanently increase your Strength, Intelligence, Defense, or Luck.
9. **Celestial Blood Moons, Alchemical Loot Goblins & Stamina Exhaustion (v2.8.0)**:
   - Survive the **Celestial Blood Moon Rift** cycle triggering every 300-550 turns, where hostiles gain aggressive damage and lifesteal properties but drop double alchemical catalysts.
   - Hunt down the rare **Alchemical Loot Goblin**, a fast golden sprite that drops ores and catalysts on hit.
   - Manage your **Stamina Exhaustion** physiological fatigue loop. Swings and spells increase exhaustion, decreasing active dodge and crit ratings by up to 15%. Rest adjacent to any campfire or rent a tavern bed to fully purge exhaustion.
10. **Tavern Minigames & Drunk Patrons (v2.9.0)**:
   - Visit town taverns to interact with flushing-cheeked (`🥴`) characters (Drunk Seppo, Uncle Pete, Tipsy Toby) to buy them drafts of Ale (-10 Gold) for rumors, free ingredients, or the *Drunken Cheer* critical strike buff.
   - Gamble in **Sunder Coin Toss** heads-or-tails betting wagers, or slap patrons awake for humorous comedic dialogues.
   - Experience aggressive **Enemy AI Chase & Senses** mechanics—enemies calculate Line-of-Sight or close proximity to hunt you down rather than remain frozen.
11. **Sunder Secure Lockpicking & Tension Wire Forging (v2.9.7)**:
   - Crack open locked chests in outlaw campsites and deep dungeon floors using an interactive lock cylinder rotation simulator.
   - Features realistic lockpick tension physics, wobble warning stress, snap degradation, and perfect performance reward modifiers (+25g pristine unlock, free catalyst shard, +40 Lockpicking XP).
   - Fully optimized for mobile screens: players can drag and pivot the lockpick directly by swiping/dragging their finger over the circular lock face, with customized touch prevention settings.
   - Restock supplies by forging 3x lockpicks with 1x Tempered Iron at campfires or visiting town shops.
12. **Dynamic Faction Wars & Territory Conquest (v3.5.0)**:
   - Campaign for regional dominance across 5 unique territories (Borderlands, Shadow Fjord, Moonshadow Cove, Sunplate Ridge, Swamp of Whispers) that track active faction control and control percentages.
   - Monitor, govern, and interact with the war landscape inside the Faction War Room Dashboard.
   - Collect accumulated gold and alchemical/mineral tax products generated continuously on a turn-by-turn basis.
   - Finance your faction's War Treasury by donating gold in exchange for reputation and prestige.
   - Spend war reserves to deploy game-wide tactical directives (Aegis Shielding, Supply Poisoning) that shift territory control percentages.
   - Defeating faction enemies or outlaws on the overworld map dynamically triggers tactical pushes, increasing control of adjacent territories for the player's allied faction.
13. **Dual-Hand Combat Durability & Gauntlets/Neck Piece Armor Separation (v3.8.6)**:
   - Overhauled weapon and shield durability decay systems to dynamically trace damage across both active hand slots (Right Hand weapon and Left Hand shield/weapon).
   - Established separate slots, recipes, and status multipliers for **Gauntlets** (🧤) and **Neck Pieces** (📿), separating them into fully independent categories.
   - Added an automatic damage-based sorting module inside the blacksmith repair shop, bubbling broken items to the top of the list for seamless repair workflows.
14. **Universal Equipment Loot Drops & Rare Necklace Probability (v3.8.7)**:
   - Migrated drop systems to a procedurally balanced equipment generator (`generateRandomLootGear`), ensuring all gear classes—including Helmets, Gauntlets, Shields, Boots, and Weapons—are fully lootable with accurate subtype properties.
   - Tailored Necklaces/Amulets (`Amulet` subtype) to spawn as rare, satisfying items (5% from regular enemies, 10-15% from chests/bosses) with powerful passive attribute enhancements.
15. **Immersive Storyteller Narratives & Tiered Loot Rarity (v3.8.8)**:
   - Fully decoupled GM storyteller actions and debug commands from third-person labels. All log outputs are written organically in-character to maintain complete narrative immersion.
   - Designed a comprehensive tiered rarity quality matrix (Common, Uncommon, Rare, Epic, Legendary) assigning custom name prefixes, color indicators, and scaling stats, making superior gear drop rarer.
16. **NPC Coordinate Sanitization & Wall Spawn Prevention (v3.8.9)**:
   - Engineered an automated overworld coordinate sanitization routine ensuring NPCs (villagers, shopkeepers, bards, companions, and legendary cats) never spawn inside walls or solid layout tiles.
   - Implemented a multi-layered spiral scan scanning up to a 20-tile radius to position NPCs safely and coherently align current, home, and work schedule points.
17. **Faction Watchtowers & Active Siege Reprisals (v3.9.1)**:
   - Explore and claim strategic high-altitude overworld watchtowers guarded by elite Syndicate and Vanguard faction garrisons, featuring rare faction-locked tribute chests and dynamic capture-the-flag overworld claiming.
   - Defend your claimed watchtowers from rival faction reprisal raids that launch active overworld siege battlegrounds with real-time countdown clocks.
   - Track active battles at a glance through the dedicated "📡 WATCHTOWER SIEGES" HUD sidebar showing timers, coordinates, and faction combatant ratios.
18. **Custom Structure Carving & Legend-Mapped Blueprint Designer (v3.9.2)**:
   - Instantiate customizable structural layout templates (Spawn Shelters, Arenas, Groves, Portals, and Watchtowers) that can be carved onto overworld coordinates with boundary validation checks.
   - Experience a smart Blueprint Designer (`handleLoadPresetToDesigner` in `GodPanelOverlay.tsx`) that reads custom `legend` maps from presets. It dynamically translates non-standard characters from blueprints (like `W`, `S`, `K`, `F`, `X`, `+` in Watchtowers) to standard, editable designer tiles prior to grid loading, resolving loading limitations.
   - Save, modify, and live rebuild active overworld structures or settlements via the custom layout JSON input field inside the Sovereign God Panel.
19. **Wilderness Traveling NPCs & Crime Witness System (v3.9.3)**:
   - **Wilderness Traveling NPCs**: Organically spawns specialized travelers (Wilderness Hunters `🏹`, Wilderness Herbalists `🌿`, and Traveling Pilgrims `🚶`) in non-town, non-castle wilderness overworld chunks.
   - **Interactive Dialog & Commerce**: Engage in role-appropriate trade or receive valuable gameplay/lore tips from traveling NPCs via fully functional custom shop interfaces.
   - **Proximity Crime Witness Detection**: Evaluates surrounding tile visibility when initiating an attack on a traveler. Assaults committed with nearby witnesses cause your town reputation to drop by -35, whereas silent attacks in total isolation preserve your reputation perfectly!
   - **Combat Transformation**: Assaulted traveling NPCs immediately transition into active, aggressive enemies (ranged Hunters, melee Herbalists and Pilgrims) on the overworld canvas.
20. **Roaming Outlaw Camps & Bored GM Interventions (v3.9.4)**:
   - **Dynamic Bandit Camps**: Spawns a small camp of 2-3 Outlaw Bandits around a newly lit wood campfire on walkable tiles nearby.
   - **Elite Camp Adversaries**: Features an elite **Outlaw Bandit Leader** (85 HP) and auxiliary **Exile Camp Bandits** (55 HP) in aggressive, immediate chasing AI states to engage the player.
   - **In-Character Storyteller Announcements**: Features a dynamic lore monologue narrated in the adventure log describing crackling wood and rowdy laughter nearby, complete with cardinal direction tags and floating compass popups.
21. **Quest-Giver Assaults & Responsive Multi-Viewport HUD (v3.9.5)**:
   - **Interactive Quest-Giver Assaults**: Players interacting with traveling NPCs can choose to reject, betray, and directly assault them in the dialog overlay. Doing so immediately fails any associated quest (with custom log messages), registers the failure, and spawns them as a hostile combatant on the map.
   - **Fluid Multi-Viewport Responsiveness**: Re-engineered the UI layout structures to fully support desktop, resized windows, and mobile viewports (widths < 1024px) seamlessly.
   - **Compact Mobile HUD**: Implemented a comprehensive HUD bar directly above the game canvas in mobile viewports, rendering status gauges for Vitals HP, Focus MP, Gold wealth, and Level/XP progress.
   - **Mobile Environment Sub-HUD**: Added an elegant detail bar showing active coordinates, current biome or floor level, town reputation, game clock time, and dynamic Moon Phases with tooltip support.
22. **Scars of the Defeated & Effective Stats System (v3.9.7)**:
   - **Battle Injuries & Dynamic Scar Acquisition**: Suffered high-damage blows (dealing $\ge 12$ HP) or falling below 35% health triggers potential permanent battle scars (`evaluateScarAcquisition`) from 24 unique templates.
   - **Fresh vs. Healed Healing Cycle**: Scars start as **Fresh (Healing)** for exactly **25 turns**, applying tender/inflamed debuffs to attributes. After mending, they become **Healed (Old)**, providing permanent hardened stat bonuses.
   - **Dynamic Effective Stats Calculation**: Prevents permanent stat decay or glitches by computing effective attributes (`getEffectiveStats`) on-the-fly for player combat stats, inventory carrying capacity (weight changes based on physical condition), and character sheet displays.
   - **God Panel Sandbox Controls**: Allows immediate manual injection of any battle scars to test active effects and character overlays under the Creator Lab tab.
23. **The Over-Forging Risk/Reward Gauge & Bellows System (v3.9.12)**:
   - **Interactive Heat Control**: Pump or adjust bellows heat level (0% to 100%) prior to crafting, mutating, or upgrading weapons and armor.
   - **Stat Scaling & Divine Titles**: Scale equipment stats up to **2.25x** (+125% power bonus) and unlock "God-Forged" divine item titles.
   - **Anvil Shatter & Heat Recoil**: High heat introduces item shatter risks (up to 65%) yielding scrap metal and heat recoil damage on the player's health.
24. **Modular Engine Architecture & Item Discard Gump Modal (v3.9.13)**:
   - **Modularized Over-Forging Component**: Extracted `OverforgeGauge.tsx` for clean decoupling and easy reuse across workbench interfaces.
   - **Interactive Discard & Drop Gump**: Retro fantasy-styled modal for discarding or dropping items on the ground with stack quantity sliders and physical loot spawns.
   - **Stackable Spell Scrolls**: Ensured all scroll items (Recall, Fireball, Teleport, etc.) merge into inventory stacks with quantity tracking.
25. **Unstable Mutation "Synergy Chains" (v3.9.14)**:
   - **Modular Synergy Engine**: Combining multiple elemental catalysts unlocks dual-element traits like *Thermal Shock*, *Plasma Arc*, *Hellfire Singularity*, and *Corrosive Blight*.
   - **Chain Tiers & Strain Gauge**: Multi-stage mutation chains unlock Supercritical (+25%) and Omega (+50%) power surges with live Mutagenic Strain Gauges.


---

## 🛠️ Modular Data Configuration

Abyss Rogue is engineered with a fully decouplable model, separating architectural graphics and layouts from hardcoded structures so that adding content or balancing rules is trivial.

### 1. Dynamic Buildings (`/src/data/buildings.json`)
Town structures are loaded and built dynamically. Coordinates can use absolute grid locations or flexible expressions evaluated against overworld chunk sizes (`width` and `height`):

```json
[
  {
    "id": "blacksmith",
    "name": "Blacksmith Shop",
    "x": "4",
    "y": "3",
    "w": 8,
    "h": 8
  },
  {
    "id": "apothecary",
    "name": "Apothecary Shop",
    "x": "width - 12",
    "y": "3",
    "w": 8,
    "h": 8
  }
]
```

### 2. Scalable Enemy Templates (`/src/data/enemies.json`)
Every hostile actor, gatekeeper, and royal sentry fetches their stats dynamically. You can adjust health pool (`baseHp`), attack rating (`baseAtk`), defensive damage absorb (`baseDef`), movement speed, threat range, or representation icon instantly:

```json
{
  "Troll": {
    "name": "Cave Troll",
    "baseHp": 45,
    "baseAtk": 7,
    "baseDef": 4,
    "range": 1,
    "speed": 1.5,
    "char": "T",
    "color": "#10b981"
  }
}
```

### 3. Overworld & Climatic Biome Config (`/src/data/worldConfig.json`)
The overworld terrain, Whittaker-style biomes, and meteorological conditions are governed by a central JSON database. You can adjust temperature and moisture boundaries, customize weather frequencies, and tune environmental hazard parameters (lakes, traps, and monsters) on a per-biome basis:

```json
{
  "biomeThresholds": {
    "tundra": { "temperatureMax": 0.35 },
    "desert": { "minTemperature": 0.35, "maxMoisture": 0.35 },
    "swamp": { "minTemperature": 0.60, "minMoisture": 0.60 }
  },
  "weatherFrequencies": {
    "forest": { "clear": 0.45, "foggy": 0.20, "rainy": 0.35 },
    "swamp": { "clear": 0.20, "foggy": 0.30, "rainy": 0.50 }
  },
  "environmentalHazards": {
    "swamp": {
      "lakeCount": 3,
      "baseLakeRadiusMin": 3,
      "baseLakeRadiusMax": 5,
      "trapCount": 3,
      "trapType": "poisonGas",
      "chestCount": 2,
      "monsterCountMin": 4,
      "monsterCountMax": 7
    }
  }
}
```

### 4. Decoupled Engine Domain-Specific Utility Files (`/src/utils/`)
To maximize maintainability and simplify project growth, our core systems are decoupled into specialized domain modules:
- **`weatherEngine.ts`**: Governs meteorological systems, biome weather profile definitions, and dynamic movement/combat modifiers (e.g., wet conditions boosting lightning, blizzards draining heat).
- **`spellsAndEquipment.ts`**: Encapsulates player magical spell configurations (Arcane Bolt, Pyroblast, Frostbite Lance, Storm Strike, Poison Dart, Shadow Orb) and starting gear blueprints.
- **`shopData.ts`**: Manages rotating inventories, buy/sell price multipliers, and special items stocked by Blacksmiths, Town General Merchants, Taverns, and Wandering Seppo.
- **`fleeQuotes.ts`**: Handles procedural comedic panic quotes whispered or yelled by fleeing wildlife, coward goblins, rattling skeletons, or heavy orc brutes.
- **`caravanAndTerritory.ts`**: Controls active Caravan merchant schedules, escort caravan path tracking, and geographical territory alignment structures.

---

## 🚀 Adding Custom Content

### How to Add Combat & Flee Flavor Text
1. Open `/src/data/combatFlavors.ts`.
2. Locate the weapon type you want to expand (e.g., `[WeaponBaseType.Sword]` or `[WeaponBaseType.Bow]`).
3. Append your high-stakes descriptive sentences to the `normal` (regular strikes) or `crit` (critical strikes) array.
4. **Placeholder Substitution**: Ensure you use the `{name}` placeholder where the target's name fits. It will be replaced automatically at runtime! Examples:
   ```typescript
   "Your sword shears clean through the shield strap, leaving {name} staggered!"
   ```

### How to Add a New Town Building
1. Open `/src/data/buildings.json`.
2. Append a new object specifying the building's dimensional constraints:
   ```json
   {
     "id": "library",
     "name": "Grand Library of Sages",
     "x": "12",
     "y": "height - 9",
     "w": 10,
     "h": 8
   }
   ```
3. Save the file. The overworld generator will build this house automatically with windows, windowsills, a functional door direction, and wooden furniture (book tables/chairs).

### How to Add a New Enemy Type
1. Edit `/src/types.ts` to add your new tag into the `EnemyType` enum:
   ```typescript
   export enum EnemyType {
     ...
     DragonKeeper = 'DragonKeeper'
   }
   ```
2. Open `/src/data/enemies.json` and declare its base properties:
   ```json
   "DragonKeeper": {
     "name": "Primal Dragon Keeper",
     "baseHp": 60,
     "baseAtk": 10,
     "baseDef": 5,
     "range": 2,
     "speed": 1.2,
     "char": "D",
     "color": "#ef4444"
   }
   ```
3. Spawn your new beast in the wild or inside level spawners!

### How to Expand the Advanced Trade Economy & Guild Houses
All variables, lists, and formulas are fully modularized and defined inside `/src/utils/tradeEconomy.ts`.

#### 1. Add Biome Price Multipliers for New Materials:
Simply add a new entry to `BIOME_PRICE_MULTIPLIERS` matching the item's material ID:
```typescript
export const BIOME_PRICE_MULTIPLIERS: Record<string, Partial<Record<'forest' | 'desert' | 'tundra' | 'swamp', number>>> = {
  mat_platinum: {
    tundra: 1.65, // Rare tundra find, sells high!
    swamp: 0.70   // Common swamp wash, sells low.
  }
};
```

#### 2. Create a Custom Guild Lab Research Upgrade:
Add your upgrade definition directly into the `GUILD_UPGRADES` array:
```typescript
export const GUILD_UPGRADES: GuildUpgrade[] = [
  {
    id: 'up_magic_prowess',
    name: 'Leyline Channeling',
    desc: 'Reduces mana costs of spells by -10% per level.',
    maxLevel: 3,
    costGold: 250,
    costMaterials: { 'cat_shadow': 2 }
  }
];
```

#### 3. Register a New Companion Expedition:
Append a mission definition object to the `COMPANION_QUEST_BOARD` array:
```typescript
export const COMPANION_QUEST_BOARD: CompanionQuest[] = [
  {
    id: 'q_mine_recon',
    title: 'Forgotten Mine Excavation',
    desc: 'Send a companion to explore abandoned tunnels for raw steel alloys.',
    turnsRequired: 40,
    rewardGold: 150,
    rewardXp: 80,
    rewardMaterials: { 'mat_steel': 3, 'mat_iron': 2 }
  }
];
```

### 🛠️ Developer & Game Master Toolkits (In-Game Console)
The game includes comprehensive built-in developer instruments designed for live-session playtesting:
- **GOD Command Module Overlay (`🛡️`)**: Toggle absolute damage invulnerability, instantly grant +99 of all crafting alloys and alchemical catalysts, skip player levels, or spawn custom named companions.
- **GM Storyteller Dashboard (`🌀`)**: Manually override weather and solar cycles, trigger specific encounters, and inspect live GM AI "thoughts" and behavioral variables (Boredom, Tension, Mood).

### 🧪 Quality Assurance: Client-Side Virtual Smoke Test Runner (v2.9.6) (DONE)
To ensure seamless updates and zero-regression reliability, we have implemented an automated, in-browser **Virtual Playthrough Runner** directly accessible from the "Smoke Test" tab in the Sovereign God Panel Overlay. It executes end-to-end loops including:
1. **Movement & Scrolling**: Walks through cardinal chunks to trigger procedural terrain redraws and coordinates alignment.
2. **Harvesting & Crafting**: Attacks logging nodes, collects lumber, buys and pitches campfires, and tests the adjacent Exhaustion-purge resting cycle.
3. **Social & Tavern Minigames**: Tosses coin flips with patrons, buys ale, and confirms the active Drunken Cheer critical buff.
4. **Companion Dispatch**: Assigns followers to active guild expeditions, progresses turns, and claims high-tier rewards.
5. **AI Combat Tests**: Spawns hostiles, verifies line-of-sight chase targeting, combat damage logging, blood splatters, and floating indicators.
6. **Dungeon Traps & Lockpicking**: Descends to floor depths, disarms trap-plates, crafts Tension Lockpicks, and cracks open locked Ancient Chests successfully.

