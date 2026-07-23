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
    [v4.0.0-tbd] Infinite Ocean Navigation, Ship Crafting & Sea Monsters (ROADMAP)
```

---

## 🗺️ 1. Active & Implemented Mechanics (Our Foundation)
*   [x] **Portable Blacksmith Anvil & Field Station Adjacency (v3.9.15)**: Deployable anvil station allowing equipment forging, mutation, and upgrades in the wild.
*   [⏳] **Codebase Architecture, Refactoring & Performance Optimizations (v3.9.16)**: Systemic cleanup and modularization of monolithic files.
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

*   [ ] **Abstract Graphics Provider Interface**:
    *   [ ] Establish a unified rendering controller interface (e.g., `IGraphicsRenderer`) with methods like `drawTile(x, y, details)`, `drawEntity(x, y, details)`, and `renderVFX(...)`.
    *   [ ] Implement a lightweight **TextRenderer** (using our current custom canvas, CSS overlays, and emoji sets) as the robust default core.
    *   [ ] Implement a **TilesetRenderer** (powered by HTML5 2D Context or lightweight PixiJS/WebGL) to slice texture atlases and draw tile buffers.
*   [ ] **Dual-Representational Entity Mapping**:
    *   [ ] Extend the static databases (such as `ITEMS_DATABASE`, `BESTIARY`, and overworld structures) to accept a polymorphic graphic descriptor holding both representation paths:
        ```typescript
        export interface SpriteRenderDetails {
          // Fallback (Current Text-Based)
          symbol: string;        // e.g., "🐺"
          color?: string;        // e.g., "#94a3b8"
          
          // Rich Graphical Tileset
          spritesheet?: string;  // e.g., "monsters_sheet"
          row?: number;          // Sheet Y-index
          col?: number;          // Sheet X-index
          frameCount?: number;   // Animation sequence count
          tickDuration?: number; // Speed of animation cycle (ms)
        }
        ```
*   [ ] **Asynchronous Asset Loader & Fallback Manager**:
    *   [ ] Build an asset load manager (`AssetPreloader`) to load external `.png` tile-sheets, texture manifests, and sprite-sheets asynchronously.
    *   [ ] Automatically fall back to symbolic emoji rendering if sprites fail to load, are missing, or if the user toggles graphics off in settings (`useTilesets: false`).
*   [ ] **Decoupled Main Tick Loop & VFX Queue**:
    *   [ ] Decouple turn-based state updates (synchronous input ticks) from rendering calculations (continuous `requestAnimationFrame` render ticks) to handle particle systems, moving projectiles, or walk animations.
    *   [ ] Route spells, strikes, and weather anomalies through a global `VFXEmitter` queue. In Text mode, they animate via CSS transitions or simple text-floats; in Tileset mode, they run sprite sequence frames or particle sprites.

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

#### **Phase 3: Core App Engine Deconstruction (`App.tsx` Monolith - 18,000+ lines)**
*   [ ] **3.1 Extract Custom Engine Hooks**:
    *   [ ] `useSaveLoad.ts`: LocalStorage serialization, auto-save timers, and save file sanitization.
    *   [ ] `usePlayerMovement.ts`: Key bindings, tile collisions, stamina consumption, and stair transitions.
    *   [ ] `useCombatEngine.ts`: Attack calculations, scar triggers, overforge heat recoil, and critical hits.
    *   [ ] `useEnemyAI.ts`: Pathfinding, faction chase algorithms, and turn-based enemy actions.
*   [ ] **3.2 Isolate World & Dungeon Generators**:
    *   [ ] Extract dungeon generation algorithms into `src/world/dungeonGen.ts`.
    *   [ ] Extract overworld chunk generation and landmark placement into `src/world/overworldGen.ts`.

#### **Phase 4: Performance & Rendering Optimization (High Performance Gains)**
*   [ ] **4.1 FOV & Line-of-Sight Raycasting Memoization**:
    *   [ ] Memoize raycasting computations to prevent re-running visibility checks on static turns.
*   [ ] **4.2 Render Boundary & Canvas Optimization**:
    *   [ ] Wrap canvas overlays and HUD sub-panels in `React.memo` to prevent cascading re-renders when unrelated state variables change.


