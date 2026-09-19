# Sunder: Chronicles of the Forge

Welcome to **Sunder: Chronicles of the Forge** (Abyss Rogue), an advanced procedurally generated full-screen tactical roguelike role-playing game. Below is an in-depth breakdown of the game's mechanics, aesthetics, and systems.

### 🌐 Play & Test the Game Live
- **Development App (Live Environment)**: [https://ais-dev-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app](https://ais-dev-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app)
- **Shared Production Preview**: [https://ais-pre-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app](https://ais-pre-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app)

---

## 1. World Exploration & Procedural Generation

### Infinite Overworld Chunks
- **Jumbo Map Dimensions**: Each overworld chunk is dynamically scaled to an expanded **64x40 grid** of tiles, widening the walk space and adding pristine density to natural and structural assets.
- **Dynamic Coordinate Boundaries**: The Overworld spans an infinitely scrolling tile grid. Crossing chunk borders dynamically prompts smooth procedural generation of new landscapes, saving the old chunks inside the game's state memory.
- **Biome Multiplicity**: Chunks feature distinct eco-regions:
  - 🌲 **Verdant Forests**: Soft plains filled with trees, wild grass pathways, spawning Sweet Berries (`mat_berry`) from wild bushes, rare Earthy Forest Truffles (`mat_forest_truffle`), and Wild Honeycombs (`mat_honeycomb`).
  - 🏜️ **Arid Deserts**: Barren golden sand dunes, cacti clusters, dry tumbleweeds (`*`), and harvestable Sun-Blossom Aloe succulents (`mat_sun_aloe`) from desert bushes.
  - ❄️ **Tundra Glaciers & Glacial Caverns**: Deep subzero ice fields with frozen evergreens, snowdrifts, frostbite vents, falling icicles, and delicate Glacial Frostbloom flowers (`mat_frostbloom`) harvested from frosted shrubs.
  - 🐊 **Soggy Swamps**: Dense mud pits, mossy floor tiles, stagnant water bodies, and harvestable Bioluminescent Nightshade herbs (`mat_swamp_nightshade`) harvested from marsh shrubs.
  - 🪸 **Sunken Coral Reefs**: Azure oceanic lagoons, vibrant pink/cyan coral colonies, geysers, tidal pools, and drifting aquatic bubble atmospheres.
  - 🌋 **Volcanic Calderas**: Searing magma fissures, obsidian crag plains, sulfur vents, rising ash particles, molten lava lakes, and charred shrubs yielding ash reagents.
  - ⛏️ **Mineral Belts & Subterranean Mining (v8.6.0)**: Overworld chunks generate rich mineral belts spawning clusters of Copper Veins (`TileType.CopperVein`) and deep Iron Veins (`TileType.IronVein`). In addition, subterranean dungeons feature cavern mineral veins embedded directly into dungeon room wall alcoves for deep mining expeditions. Equipped with a pickaxe, players can mine raw Copper and Iron ores for forge blacksmithing, with mining tool durability and interactive yield popups. Harvested veins cleanly revert to natural walkable terrain (`TileType.Grass` in the overworld, `TileType.Floor` in dungeons).
  - 🌿 **Wilderness Foraging & Tree Felling**: Foraging wild bushes gathers region-specific berries, herbs, and succulents. Chopping trees fells timber while leaving walkable tree stumps that can be cleared with the 'G' key for scrap kindling.
  - 🏰 **Towns & Settlements**: Civilized sanctuaries with shopkeepers, taverns, inns, and municipal town guards. Weather in town biomes remains mild and protected. Town guards (`isTownGuard: true`) feature an active defense AI that continuously scans the settlement map for hostile invaders (bandits, rogue beasts, or hostile monsters). When a threat is detected, guards wake sleeping sentries within 30 tiles, march towards the hostile using BFS pathfinding (`getNextStepTowards`), and engage in reciprocal combat dealing persistent damage.
- **Strict Biome-Aware Weather Rules Engine**: The weather simulation enforces biome climate rules—there is always strictly one active weather pattern played at a time, tailored to the current biome:
  - *Deserts*: Only sunny/clear, foggy, or sandstorm conditions (rain, snow, or blizzards never occur in deserts).
  - *Tundras & Glacial*: Only clear, snowy, or blizzard whiteouts.
  - *Forests & Swamps*: Clear, rainy, or foggy conditions.
  - *Volcanic*: Clear, foggy, or ashfall ember showers.
  - *Coral Reef*: Clear, rainy, or thunderstorm conditions.
  - *Towns*: Clear or mild weather.
  - *GM & God Panel Integration*: All Storyteller GM commands (`weather_rainy`, `weather_foggy`, `weather_snowy`) and God World Editor weather controls automatically validate and shift requested weather to valid biome equivalents using `getValidWeatherForBiome`.
- **Absolute Cardinal Navigation**: Fixed overlay markers displaying NORTH, SOUTH, EAST, and WEST along the respective viewport margins for seamless coordinates tracking.
- **High-Performance Chunk Minimap Component (`ChunkMinimap.tsx`)**: Refactored the inline coordinate-scanning mini-map into a decoupled React component. By employing `React.memo` and proper state isolation, the map avoids expensive parent re-renders during gameplay actions. It dynamically renders a 21x21 grid representing a 10-tile radius around the player, complete with custom color representations for walls, doors, stairs, water, trees, and special landmarks. Proper string-based `TileType[][]` enums are used to enforce type safety.

### Interactive Overworld Points of Interest (POIs)
The overworld is populated with unique, historical landmark coordinates. Approaching these POIs transitions passive exploration into **highly detailed, choice-driven narrative encounters** with varying alchemical, stat-modifying, or hazardous consequences:
- **Ley-Well Shrine (⛲)**: Concentrated wells of primal ley magic.
  - *Offer Silent Prayer*: Whispers a plea to heal **+35 HP & +25 MP**.
  - *Siphon Core*: Greedy extraction expanding player capacity (**+5 Max MP**), carrying a **35% risk of psychic feedback** inflicting damage (-15 HP).
  - *Tribute of Gold*: Sacrifices **15 Gold** in the basin to receive Pristine Favor (**+15 Town Reputation**, **+100 XP**), and a randomized elemental catalyst crystal shard.
- **Flame Lord Crucible (🔥)**: Ancient active geothermal forges.
  - *Stoke the Sacred Embers*: Intensely fans the forge crucible, salvaging a rare, high-value **Ember Core** for blacksmith weapon forging.
  - *Meditate in the Crucible*: Absorbs the intense heat radiation to permanently strengthen constitution (**+8 Max HP & +1 Fire Catalyst**).
  - *Quench the Fire*: Extinguishes the sacred embers to scavenge valuable fuel elements (**+3 Coal, +2 Iron Ore, +50 XP**).
- **Ancient Runed Monolith (📜)**: Obsidian tablets etched with early glyphs of Sunder.
  - *Decipher Ancient Runes*: Study early chronicles to gain ancient wisdom (**+80 XP**).
  - *Commune with Spirits*: Rests your head on the stone to channel ancestral souls, permanently gaining **+3 Unspent Attribute Points**.
  - *Carve Your Renowned Name*: Engrave your heroic sigil to spread rumors of your deeds (**+15 Town Reputation**), carrying a **10% risk of sudden kinetic feedback** (-10 HP).
- **Sunken Keep Fortress (🏰)**: Crumbling battlements of historical legions.
  - *Scavenge Fortress Scraps*: Salvage rusted military armories for raw minerals (**+3 Copper, +1 Military Steel**).
  - *Delve Shaking Vaults*: Clamber into unstable subterranean cellars to plunder treasure, granting **+150 Gold & 1x Shadow Catalyst**, but carrying a **35% risk of cave-ins** (-20 HP).
  - *Hoist Your Alliance Flag*: Erect a standard atop the high tower, declaring claim over the lands (**+20 Town Reputation, +120 XP**).
- **Tectonic Beast Fossil (🦴)**: Calcified skeletal remains of primeval dragons.
  - *Exhume Tectonic Marrow*: Chip away dense bone scales to permanently reinforce armor integrity (**+2 DEF**).
  - *Channel Primeval Life Soul*: Absorb primeval energy to permanently expand vitality (**+12 Max HP**), draining current **-15 MP**.
  - *Extract Magic Shards*: Dig into empty eye sockets to scavenge **2x randomized elemental catalyst shards** (Fire, Frost, Poison, Lightning, or Shadow).

### Runtime Modding API & Custom Dungeon Level Editor (v6.4.0 / Phase 47)
A complete runtime extension and level design suite built directly into the game engine:
- **Runtime Modding Engine & Plugin Manager (`src/utils/moddingEngine.ts`, `src/components/god/GodModdingTab.tsx`)**:
  - **Custom Entities & Content Types**: Supports registering Custom Monsters, Custom Equipment/Weapons/Armor, Custom Spells, and Custom Dungeon Level Blueprints at runtime.
  - **Local Persistence & Plugin Management**: Features full local storage persistence (`sunder_registered_mods_v1`), enable/disable toggles, JSON schema parsing with syntax validation, and instant export/import.
  - **Community Sample Mod Packs Included**:
    - *Mythical Behemoths Boss Pack*: Adds Titan Behemoth and Obsidian Dragon monsters.
    - *High-Elven Sorcery Spellbook*: Adds Arcane Supernova, Chrono Freeze, and Divine Restoration spells.
    - *Shadow Realm Relics Pack*: Adds Void Shatterer Scythe and Eclipse Ring items.
    - *Forgotten Catacombs Blueprint*: Custom pre-configured multi-room dungeon layout.
  - **Live Combat & Spawning Integration**: Integrated directly into `getEnemyTemplate()` in `src/utils/dungeon.ts`, making modded entities available across dungeon levels, overworld encounters, and God Panel spawners.
- **Visual Grid-Based Dungeon Level Editor (`src/components/god/GodDungeonEditor.tsx`)**:
  - **Multi-Brush Painter**:
    - *Tile Painting Palette*: Floor, Wall, Water, Door, Stairs Up/Down, Grass, Path, Tree, Campfire, Bed, Fireplace.
    - *Decor Prop Placement*: Sarcophagus, Weapon Rack, Bookshelf, Alchemist Table, Spring Well.
    - *Monster & Player Placement*: Enemy spawn points and custom Player spawn location (`P`).
  - **Procedural Generator Baseline**: One-click cellular automata cave generator to quickly carve out natural cavern layouts.
  - **Instant Test-Play Launcher**: Test custom dungeon levels immediately in live gameplay with customized level depth, biome settings, and player starting position.

### Interactive Level Decor Props & Ambient World Objects (v6.3.0)
The world features interactive decor objects and environmental structures placed throughout dungeons, towns, safehouses, and ruins:
- **Ten Interactive Decor Types**:
  - ⚰️ **Ancient Sarcophagus**: Carved marble sarcophagus from ancient lords. Offers rare equipment loot or ancient gold coins (or summons a spectral skeleton if disturbed!).
  - 🗡️ **Rusted Weapon Rack**: Racks holding antique blades and rusted spears. Grants random weapons or scrap metal alloys.
  - 📚 **Lore Bookshelf**: Shelves crammed with leather-bound arcane volumes. Grants +25 XP or random spell scrolls upon inspection.
  - 🧪 **Alchemist Worktable**: Bubbling glass retorts and herbal powders. Restores +25 MP and grants random elemental catalysts or brewing potions.
  - 🛏️ **Warm Feather Bed**: Comfortable feather bed for deep restoration. Completely restores HP/MP, purges exhaustion, and applies the Well-Rested buff.
  - 🔥 **Roaring Hearth**: A crackling brick fireplace dispelling cold. Restores HP, purges cold debuffs, and provides cozy warmth.
  - 🚰 **Town Spring Well**: Cool mountain spring water bucket. Restores +30 HP and cleanses poison/debuffs.
  - 📜 **Town Notice Board**: Pinned notices of local bounties and trade routes. Grants +15 Town Reputation and reveals regional rumors.
  - 🛢️ **Cinder Cask**: Oak barrel tapped with aged spiced mead. Restores HP/MP and applies Drunken Cheer (+10% Crit Rate).
  - ☀️ **Celestial Sundial**: Polished brass dial aligned with solar rays. Shifts time forward by +2 Hours and restores MP.
- **Interactive Alert Banner**: Stepping adjacent to any decor object automatically displays a dedicated HUD banner showing the object's name, description, and status with direct click or keyboard interaction options.

### Wandering Wilderness Merchants (Seppo)
Exploration yields encounters with rare traveling entities roaming the wilderness chunks:
- **Drunk Wandering Merchant Seppo (S)**:
  - *Procedural Wilderness Spawn*: Spawns rarely on grass tiles in wilderness (non-town) chunks (4% chance upon chunk generation). He can spawn multiple times across different coordinates, rewarding the player's wanderlust.
  - *Exclusive Shop Inventory*:
    - **Finnish Sisu Hammer 🪵**: A heavy, iron-spiked birch log with a copper bottle opener welded onto the end. Smashes skulls with ultimate Sisu energy! (+15 DMG, +22% Critical Chance).
    - **Ever-Burning Flask 🧪**: An ancient insulated brass flask filled with Seppo's self-replenishing fire-water. Blocks blows and keeps you toast-warm! (+5 DEF, Shield slot).
    - **Seppo's Secret Hooch 🍶**: Distilled in a copper tub deep in the woods. Restores massive stats (**+75 HP & +40 MP**), triggering humorous, highly-immersive drunk narration effects in the game logs.
  - *Interactive Dialogue & Audio Atmosphere*: Features custom drunk voiced lines, hiccuping responses, and clinking bottle narratives during purchases.

### Wandering Factions & Lively Overworld (v2.5.0)
The overworld is fully awake, containing faction encampments, moving trade routes, and dangerous localized climates:
- **Hostile Bandit & Raider Campsites**:
  - Small 5x5 fortified outlaw camps spawn procedurally on 25% of generated overworld chunks.
  - Features camp sentries, roasting spit decoration, and a locked camp-exclusive treasure chest.
  - Defeating the camp guards permanently lowers the regional danger level, rewards epic materials/catalysts from the chest, and awards **+15 Town Reputation** and **+150 XP**.
- **Baron Tobias' Traveling Caravans & Tactical Wagon Defense (v6.7.0)**:
  - **Dynamic Trade Escorts**: Dynamically spawns trade wagon groups parked on overworld crossroads or initiated from town Trade Modals.
  - **Tactical Skirmish Map Deployment (`caravanSkirmishGen.ts`)**: Players can deploy directly onto a 24x18 tactical skirmish grid featuring a central Merchant Wagon (`🛒`), a guard campfire (`🔥`), and 2 allied Caravan Guards (`🛡️` Veteran Guard & `🏹` Crossbow Sentry).
  - **Enemy AI Wagon Targeting & Hull Damage (`useEnemyAI.ts`)**: Ambushers split focus between the player, guards, and attacking the wagon's hull (`wagonHp`). Damage shows floating text alerts and reduces Cargo Integrity %.
  - **World Threat Boss Ambushes (`caravanBosses.json`)**: High threat levels, Eclipse/Blood Moon phases, and long trade routes trigger World Threat Boss Ambushes (*Corrupted Road Baron Malakor*, *Gloomfang Alpha Werewolf*, *Thunderlord Warlord Volkan*, *Abyssal Void Harbinger*) wielding corrupted affixes (*Vampiric*, *Shieldbreaker*, *Thorns*, *Berserker*).
  - **Cargo Integrity & Relic Payouts**: Escorting the wagon safely scales gold rewards based on remaining wagon HP %, and delivering caravans with >85% cargo integrity grants rare **Flame/Void Catalysts** and **+250 Gold & +200 XP**.
- **Caravan Trade License Perks**:
  - Automatically displays a gold-embossed credential certificate inside the player's sidebar stats.
  - Grants a permanent **+30% Gold Sales Bonus** when selling equipment/materials back to shopkeepers and a permanent **-20% Purchase Discount** on all town stores.
- **Dynamic Localized Climate Hazards**:
  - *Swirling Sandstorms (Deserts)*: Restricts view radius to 2 tiles and reduces standard physical attack hit chances by 20% while drawing beautiful amber sand-wind canvas particle winds.
  - *Arctic Frost Blizzards (Tundras)*: Restricts sight line to 3 tiles, slows movement speed by 1 tile, and inflicts constant cold bite unless standing adjacent to warm fire coordinates (campfires, town stoves, tavern hearths, or ley-shrines).

---

## 2. Advanced Persistent Dungeon Engine

### Multi-Tiered Abyss (Floors 1–10)
- **Staircase Navigation**: Players descend deeper into darker challenge levels containing escalating danger levels, elite monsters, and dangerous trap layouts.
- **The Underworld Depths (Floors 6–10)**: Reaching Abyss Floor 6 transports the player to the scorching lava chambers of the Underworld. Styled with basalt floor cracks, molten obsidian stone walls, and volcanic elements on the game canvas.
- **Molten Lava Hazards**: Underworld floors are riddled with active Lava Pools. Stepping on a lava tile inflicts **8 Fire Damage** directly, triggers screen damage shakes, and generates floating fire alerts.
- **Climactic Overlord Boss Surtur (Floor 10)**: Reaching the 10th floor guarantees a final showdown with *Surtur the Magma Arch-demon* 👿, a colossal boss wielding his blazing obsidian blade with massive multipliers and dropping legendary artifacts (Surtur's Molten Greatsword).
- **Terminal Victory Condition**: Conquering Floor 10 and descending past Surtur's chamber awards the ultimate victory, reclaiming the *Spark of the Cosmos* and restoring peace to Sunder.

### Colossal Legendary Biome Bosses
Guarding procedural overworld ruins and their valuable locked treasures are four massive biome-specific Legendary Bosses:
- 🌲 **Verdant Forests**: *Sylvanus, the Verdant Behemoth* (🌳) — A colossal forest guardian with high defense and crushing wooden smash attacks.
- 🏜️ **Arid Deserts**: *Sekhmet, the Searing Dune Sovereign* (🦂) — A giant scorpion king striking with razor-sharp tail stingers and high speed.
- ❄️ **Tundra Glaciers**: *Ymir, the Frost-Weaver Titan* (⛄) — A heavy frost titan with long-range frozen slams and immense health.
- 🐊 **Soggy Swamps**: *Charybdis, the Slime-Feaster* (🦠) — A giant toxic swamp monstrosity that absorbs physical blows with massive armor value.

### State Persistence & Frozen Simulation
- **No Respawn Policy**: Once the player clears room monsters, disarms spiked traps, or plunders heavy chests on a specific Floor, **re-entering that dungeon from the Overworld preserves that floor's state exactly as it was left**.
- **Tactical Standby Freeze**: While the player is active on other levels or traveling the Overworld, monsters inside deep dungeon levels remain completely frozen in active state memory. They neither duplicate nor roam until the player steps back onto that floor.

### Double-Edged Dungeon Shrines & Curses (v3.2.0)
Exactly 2 unique double-edged shrines or altars procedurally spawn on each floor of the dungeon depths, presenting risky opportunities to the daring adventurer:
- **Shrine of Forbidden Strength (⛧)**: Grants +4 Strength permanently, but siphons -15 HP and inflicts the *Curse of Vulnerability* (-5 Physical Defense for 40 turns).
- **Shrine of the Blind Oracle (🔮)**: Fully reveals the current dungeon floor layout and grants +3 Intellect permanently, but inflicts *Cursed Sight* (-5 Atk and -15% Critical Chance for 45 turns).

### Scouting, Trap Detection & Disarming (v3.6.6)
Sunder's dungeons and wilderness environments feature a deep, integrated Trap Detection and Scouting system, turning passive movement into an engaging risk-reward exploration challenge:
- **Procedural Camouflaged Hazards**: Traps (floor spikes `^`, boiling fire vents `▲`/`▵`, and toxic poison vents `░`) spawn in a fully camouflaged and hidden state. They do not render on the screen or minimap initially, demanding careful tactical movements.
- **Turn-based Perception Sweeps**: At the beginning of each turn, an automated scanning sweep runs to spot hidden hazards within a 2-tile radius around the player. The success chance is computed from a robust RPG formula:
  `Perception Chance = 20% + (Dexterity * 1%) + (Luck * 1%) + (Scouting Level * 10%)`
  Spotting a hidden trap triggers an alert message and awards **+15 Scouting XP**.
- **Tactical d20 Disarm Attempts**: If the player attempts to step on a detected trap tile, instead of suffering immediate damage, they initiate an active **Disarm Check**. A d20 is rolled and combined with modifiers:
  `Disarm Roll = d20 + Dexterity + (Scouting Level * 4)`
  This roll is contested against the trap's difficulty rating (DC 12 for Spikes, DC 14 for Poison Gas, and DC 18 for volcanic Fire Vents).
  - *Success*: The trap is disarmed safely, play sound effect, grant **+25 Scouting XP**, and allow the player to step on the tile without taking damage.
  - *Failure*: The trap snaps, inflicting normal damage, applying negative status conditions (like Poison), and carrying a risk of battlefield scars.
- **Scouting Rank Progression**: Reaching `100 * Scouting Level` XP advances the player's Scouting rank. Leveling up increases the automatic perception chance, expands visual cues, and grants heavy bonuses to d20 disarm rolls.
- **Immersive HUD Readout**: The active Scouting Level, current XP gauge progress bar, perception rate percentage, and active disarm roll modifier are displayed in real-time under a custom status container in the Character Sheet.
- **Shrine of Blood Transfusion (🧪)**: Grants +12 Max Mana and fully restores all Mana, but drains -15 HP instantly in a blood sacrifice.
- **Altar of the Covetous Greed (🏺)**: Grants +250 Gold instantly, but inflicts *Cursed Weight* (-2 Attack and -2 Defense for 30 turns).
- **Shrine of the Reckless Berserker (⚔️)**: Permanently grants +15% Critical Strike Chance, but permanently consumes -20 Max HP.
- **Altar of the Chrono-Shift (🌀)**: Grants +3 Dexterity permanently, but inflicts +30 physical exhaustion points immediately.

Accepting a shrine's sacrifice immediately displays a high-impact, floating combat text, triggers spellcasting visual updates, and documents the transaction with detailed logs in the history chronicle. All active curses decay step-by-step alongside standard player actions.

---

## 3. Visceral Combat & Battlefield Remaining Elements

### Kinetic Combat Effects & Damage Shakes (v2.9.9)
- **CSS Sprite-Shake Feedback**: Built an absolute HTML/CSS animation system for damage visual feedback. When the player or any enemy takes damage, their corresponding token triggers an intensive, non-linear staggered `@keyframes sprite-shake` animation using a custom cubic-bezier timing curve, combined with drop-shadow glows and brightness boosts.
- **Hammer Knockback Mechanics**: Striking monsters with high-impact heavy weapons like Hammers pushes hostile entities backward into adjacent empty tiles.
- **Floaty Particle Damage Numbers**: Each strike triggers dynamic bouncing floaty numbers indicating standard orange hits, crimson critical strikes, green healing values, or magic numbers.
- **Modular combat Flavor Text Generator**: Built an extensible `/src/data/combatFlavors.ts` file separating descriptive weapon stroke phrases. It replaces placeholders at runtime, rendering unique tactical statements dynamically.
- **Targeted Morale and Fleeing**: Brave monsters (skeletons, orcs, trolls, bosses) stand, defending and trading blows to their bitter death. Only cowardly creatures (rats, scavenger goblins, trapsmiths) have a low (8%) chance to panic and run away once health drops to an absolute critical minimum (under 12% max HP).

### Layered Biological Splatters with Turn-Based Decay
- **Entity Blood Color Matching**: Critical and heavy impacts splash biological residue across ground floor tiles:
  - 🔴 **Crimson Red**: Splattered by humanoids, animals, players, and companions.
  - 🟢 **Toxic Green**: Splattered by swamp vermin like Giant Rats.
  - 🔵 **Spectral Cyan**: Splattered by undead forces like Skeleton Mages.
- **CSS-Animated Drip-Dropping Entrance**: Splatters spawn as beautifully styled vector droplets that execute a fluid, scaling `@keyframes blood-drip` animation on entry. They are rendered using absolute coordinate overlays, keeping rendering performance exceptionally high and eliminating canvas redrawing overhead.
- **Organically Decaying Splatters**: Splatters maintain varying density tiers (3 to 1). On every player action, splatters have a small chance to gradually decay and eventually dissolve, leaving the floor clean over long periods.

### Physical Corpses Left Behind
- **Skeletal & Hunted Remains**: Defeated creatures spawn static, layered corpse debris under players or monsters:
  - Humanoids and standard creatures leave bone clusters.
  - Skeletons leave broken skull piles (`☠`).
  - Forest animals leave avian/feather templates (`🪶`).
  - Fallen tavern companions leave distinct blue-framed allied remains.

---

## 4. Atmospheric Dungeon Settings & Intelligent Logs

### Animated Adventure Chronologue Log Scroller
- **Slick custom Amber Scrollbars**: Offers beautifully styled Webkit custom scrolls matching Oakhaven's dark golden aesthetic.
- **Smart Bottom Pin Selection**: On incoming turn messages, the log automatically scrolls to the absolute bottom feed if the player was already bottom-locked.
- **Scroll Catching overlay**: Scrolled up to read historical turns? A clever bouncing indicator `↓ Scroll to Latest` appears; clicking it returns focus instantly, restoring lock.
- **RPG Storyteller Nudges**: Features an offline storytelling AI module (`src/utils/gmNarrator.ts`) that periodically posts classical text descriptions about adjacent tiles. It senses the surrounding world environment (cozy villages, tall stone keeps, deep underground dungeons, ancient mossy ruins) to push flavor sentences (carrying fragrances, breezes, warnings, and distant sounds) matching specific cardinal directions.

### Decorative Interiors & Modular Village Architecture
- **Modular Village Interiors**: Generating overworld chunks places modular village shops and residences. Shop identifiers are processed dynamically by `buildHouse(...)` to spawn customized interior decorations (anvil/furnace sets for blacksmiths, cozy bar counters/booths for taverns, alchemical workbenches/herb containers for apothecary stores, etc.).
- Generating a new Abyss floor spawns rich, ruined aesthetics sprinkled on empty tiles:
  - ☠ **Piles of Bones**: Mortal remains of earlier plundering guilds.
  - 🕸 **Cobwebs**: Dusty strands covering silent corners.
  - ⌸ **Broken Barrels**: Old heavy oak reserves split open.
  - π **Ancient Columns**: Cracked pillars supporting stone vaults.
  - ⎖ **Iron Shackles**: Rusted dungeon cuffs bolted to dark bedrock.
  - ⎗ **Stained Altars**: Dark monolithic slabs etched with crimson energy.

---

## 5. Party Recruitment & Tactical Commands

### Mercenary Companions
- **Tavern Hires & Active Spawning**: Players can visit towns to hire loyal allied companions at tavern bars for Gold. Upon purchase, companions do not vanish; instead, they immediately materialize as active physical combat actors on the map, follow the player across zones, and dynamically engage/attack any hostile monsters in the vicinity.
- **Behavioral Stance Controls**: Group members follow you and automatically acquire nearby targets, with toggles for aggressive pursuit or defensive holding (Waiting).
- **Companion Permadeath**: Allies take physical damage and can be slain permenantly, leaving behind personal blue-tinted corpse remains.

### Legendary Feline Companions & Developer Memorial (v3.9.8)
- **Four Legendary Overworld Cats**: Unique, non-standard companions that spawn deterministically on walkable overworld tiles:
  - **Alli 🐈**: Mystical silver-gray feline who carries a royal lineage (+1 DEF; Personality: "Royal Silver Cat", Temperament: "Dignified & Regal").
  - **Jekku 🐈**: An energetic, playful orange tabby with high combat enthusiasm (+3 ATK; Personality: "Trickster Orange Cat", Temperament: "Mischievous & Full of Energy").
  - **Pulla 🐈**: Warm, chubby golden companion representing ultimate loyalty (+18 Max HP, +1 DEF; Personality: "Warm Golden Companion", Temperament: "Obedient, Round & Faithful").
  - **Leevi 🐈**: Fierce, battle-hardened gray cat with a constant grumpy scowl (+5 ATK; Personality: "Eternally Angry Battle Cat", Temperament: "Fierce, Aggressive & Grumpy").
- **Persona Inspections**: The Follower Inspect interface displays specialized "Personality" and "Temperament" descriptions under the "Retainer Persona Traits" panel, granting each feline follower (and hired mercenaries) a unique mechanical and narrative identity.
- **"Cat Lover" Memorial Trait**: When the player encounters or hires all four legendary cats (Alli, Jekku, Pulla, Leevi) in a single run, they are awarded the permanent **"Cat Lover" Trait** (+10 Luck) in memory of real-life beloved feline friends.
- **Visual Memorial Card**: Displays an elegant, pulsing emerald status badge with decorative borders within the unified character sheet showing active bonus modifiers and dedicated logging summaries.

---

## 10. Dynamic World Threat & Adaptive Scaling Engine

### Stat allocation safeguards
- **Permanent Attribute Allocation Protection**: Players are strictly prevented from decreasing attributes (Strength, Dexterity, Intellect, Charisma, Luck) under any conditions. Stat allocations are permanent and committed immediately. The subtracting `-` buttons have been completely removed from the Character Attributes sheet, leaving only a beautiful pulsing `+` button that animates when unspent attribute points are available. This prevents any negative stat exploits or refund glitches.

### Adaptive Threat Level Multiplier
- **Progression Scaling**: The game master increases world-wide monster HP and attack scaling coefficients automatically based on three indicators:
  - **Player Level Multiplier**: +8% threat scaling per level above level 1.
  - **Attributes Spent**: +1.5% threat scaling per allocated stat point.
  - **Equipped Gear Rating**: +4% threat scaling per point of weapon damage or defense.
- **Active Chaos Suppression (Player Pushback)**: Players can actively fight back to suppress the Abyssal Chaos Coefficient in real-time by executing key combat and exploration milestones:
  - **Dungeon Bosses Slain**: Lowers the threat coefficient by **-0.35x** per boss defeated.
  - **Wilderness Camps Liberated**: Lowers the threat coefficient by **-0.15x** per cleared camp.
  - **Foes Defeated**: Lowers the threat coefficient by **-0.05x** for every 10 standard enemies defeated.
  - *Challenge Floor*: Active mitigation can bring the coefficient down significantly, but maintains a stable floor of **0.70x** to preserve a satisfying engagement level.
- **HUD Indicator & Mitigation Panel**: The character sheet and Chaos console display a highly stylized, responsive **ADAPTIVE THREAT LEVEL** indicator card alongside a dedicated **Active Chaos Suppression** panel showing exact stats of bosses slain, camps liberated, standard foes crushed, and their cumulative coefficient reductions.

---

## 6. Sovereign Creator Engine & Sandbox Modifiers

### Dynamic Structure Constructor (JSON Configurator)
- **Extensible Map Blueprints**: Players can write, customize, or paste JSON blueprints defining custom floor structures on the fly. Beautiful visual characters map cleanly to any available tile types (Doors, Walls, Chairs, Campfires, Torches).
- **Dynamic Entity Spawns**: Blueprints support embedded enemy markers allowing tailored combat scenarios, such as creating training grounds containing specific species, customized bosses, and trap rooms complete with coordinated coordinates.

### Sovereign Creator Laboratory (Creator Lab Tab)
- **🩹 Battle Scars & Physical Trauma Ingress**: Manually pick and inject any of the 12 battle scars directly onto your character model to test specific attribute penalties and custom cosmetic emojis.
- **👥 Custom Mercenary Retinue Recruiting**: Summons customized Elite Vanguard Sentinel defenders or Swift Shadow Thieves with bespoke name plates, upgraded weapon parameters, custom characters, and dedicated performance coefficients.
- **🧪 Inventory Alloys & Catalyst Supplies Infusion**: Select from all 12 raw crafting components and 5 precious alchemical catalyst types (Pyrotactile Fire, Cryo-forged Ice, Venom-stung Gas, Super-charged Spark, Void-gazing Shadow) to add or subtract specific amounts live!
- **⚔️ Bespoke Epic Weapon Crafter & Forge**: Customize weapon base archetypes (Sword, Bow, Dagger, Mace, Staff, Spear), configure base attack coefficients, critical hit percentages, active targeting scopes, mana cost parameters, and max wear durability. Forge and equip custom weapons onto active combat slots instantly.
- **🛡️ Custom Epic Armor & Greatshields Crafter**: Configure defensive protection slots (Shields, Heavy Plate-mail, Visor Helms, Gauntlets, boots), defense values, and maximum wear durability, then materialize those assets straight into your physical backpack inventory repository.
- **🌀 Environmental Hazard Materializer**: Instantly manifest interactive chess-board pieces on adjacent walkable coordinates around the player. Spawn warming campfires, rare loot-filled gold chests, active spikes, dangerous fire vents, or poison gas traps to test triggers or secure safe havens seamlessly in mid-fight.
- **⛈️ Biome & Meteorological Climate Modulators**: Force regional terrain shifts (Forest, Desert, Tundra, Swamp) or trigger ambient weather patterns (Sunny/Clear, Rainy storm, Snowy blizzard, Dense fog) with single-touch override inputs.

### Predefined Town Templates Pool Selector
- **Interactive Preset Selector**: Instantly select from multiple hand-crafted settlement layout blueprints defined in `townTemplates.json`.
- **Live Code Syncing**: Choosing a predefined template instantly compiles and translates coordinates, populating the Raw JSON coordinate box in the Housing developer tab. Rebuild Oakhaven town on-the-fly with a single click!

### In-Browser Virtual Smoke Test Runner (QA Suite)
- **Automated Sequential Playthrough**: Simulates a fully automated player walkthrough entirely client-side to test regression safety and state persistence at high execution speeds.
- **Robust Multi-Step Diagnostics**:
  1. *Spatial Navigation*: Moves player East across chunks, triggering boundary scrolling, terrain rebuilding, and field-of-view recalibration.
  2. *Harvest check*: Striking nearby trees/ore nodes and validating inventory resource increments.
  3. *Rest Purge*: Placing a campfire adjacent, applying high player exhaustion, and resting next to it to purge fatigue back to 0.
  4. *Tavern Social & Wager*: Sitting in the tavern inn, wagering gold on coin flips, and buying Stout Ale to verify the critical hit status buff.
  5. *Companion Expedition*: Recruiting Lyna Shadowsteel, dispatching her on autonomous expeditions, and checking XP/Gold rewards on her return.
  6. *Combat Loop*: Spawns hostiles, triggers pathfinding pursuit chasing states, verifies mutual strikes, damage indicators, and biological blood decal generation.
- **Scrollable Green Diagnostics Terminal**: Features a beautiful scrolling logger, displaying precise timestamps, status logs, failure catches, and colorful step counters.

### Integrated Sandbox Controls
- **Flexible Playthrough Modifiers**: Tweak incoming parameters to construct completely custom balance settings. Adjust player damage factors, enemy health ranges, drop multipliers, and XP ratios dynamically.
- **Instant Death Aura & God Shield**: Engage ultimate sovereign controls to invoke defensive invincibility or enable constant death waves wiping surrounding hostiles off the map instantly on every action.

---

## 7. Inventory Carrying Weight Limit & Capacity System

### Core Carrying Limit System
- **Weight Calculation**: Carrying load is determined dynamically based on the items in the Backpack. Equipped items are "worn" and thus exempt from carrying weight capacity.
- **Physical Item Weight Configs**: Item weights are proportioned realistically based on size and templates:
  - 🛡️ **Heavy Armor & Shields**: 6.0 kg to 10.0 kg.
  - ⚔️ **Standard Weapons (Swords, Hammers)**: 3.5 kg to 5.5 kg.
  - 🗡️ **Light Daggers & Belts**: 1.5 kg.
  - 🔩 **Raw Alloys & Ores**: 0.4 kg to 1.5 kg per unit.
  - 🔴 **Elemental Catalyst Crystals**: 0.2 kg per unit.
- **Overburdened Sluggish / Stagger Effect**: Exceeding maximum weight limits causes severe physical strain. On each action/movement, there is a **45% chance to stumble/stagger**, losing your active turn while adversaries take their actions.
- **In-Game Item Disposal**: Complete with manual discard toggles `[DISCARD]` for stashed weapon pieces, armor vest plates, alloys, and catalysts to free carrying load on the go.
- **Realistic Ground Litter**: Sweeping physical caches (Chests/LootPiles) checks capacity. Handled gracefully by taking any items that fit, and **dropping leftovers as physical ground loot piles** to prevent permanent loss.
- **Sovereign God Panel Controls**: Includes sandbox toggles to **Bypass Weight Verification** or **Adjust Carrying Threshold Multipliers** (10 kg to 200 kg) on the fly for stressless testing!

---

## 8. Autonomous GM Storyteller & Cosmic Mutation Forge

### 🌀 Cosmic Mutation Forge Workbench
- **Selective Gear Re-alignment**: Load any item into the mutation column of the Crafting Arcanum workbench (including active weapons and unequipped equipment like plates, shields, and helmets).
- **Core Infusion & Catalyst Blending**: Infuses target assets with standard alloy alloys and elemental catalysts to restructure underlying stats entirely. Stat multipliers range chaotic levels from **0.85x to 1.55x**.
- **Majestic Title Suffixes & Prefixes**: Triggers magical prefixes ("Volcanic", "Glacial", "Tempest", "Sovereign") and legendary high-tier suffixes ("of Chaos Destiny", "of the Abyss Void", "of the Divine Light", "of the Seraphic") indicating superior property gains.
- **100% Permanence**: Forge mutations consume precious resources and permanently seal the product's new identities and traits inside active state storage.

### 🎭 Autonomous Game Master Storyteller (Dynamic Interactive GM)
- **Memory & Passive Cognition**: Runs an active storytelling computer tracking total damage dealt/taken, monsters slain, coordinates, idle turn logs, chest counts, and player levels.
- **Active Persona Monologue**: Constantly switches between Mischievous, Sadistic, Benevolent, Intrigued, and Apathetic personas based on coordinates and health. The GM logs internal monologues into an active, scrollable Thought Feed stream.
- **Dynamic Programmatic Interventions**: Triggers five unique real-time game-world interventions based on state:
  - 📜 **Seraphic Healing Breeze**: Injected when player HP falls dangerously low; restores HP.
  - 🧟 **Sovereign Rift Ambush**: Triggers when player is idle or over-prepared, opening portals spawning custom adversaries.
  - 💎 **Alchemical Alloy Drop**: Spawns rare ores and alloys adjacent to player coordinates when GM notices resource deficits.
  - ⚡ **Lightning Bolt Smite**: Blasts hazardous obstacles or surrounding targets during high action.
  - 🌨 **Meteorological Climax**: Releases heavy blizzards/dense storms while scaling enemy status values dynamically.
- **GM Debug Console Oversight**: Access a detailed developer tab in the Game Master interface to manually toggle personas, adjust live parameters (Boredom & Tension), read ongoing thought lines, and force-trigger any intervention on desire.

---

## 9. Arcanum Blacksmithing Forge System

### ⚙️ Pure Alloy & Catalyst Forging
- **Alloy Exclusive Matrices**: The equipment workbench is explicitly restricted to pure base metal alloys (Iron, Mithril, Volcanic Obsidian, Astral Wyrmscale, and Ancient Feybone) fused with powerful elemental catalysts. No standard garbage junk can be fed.
- **Weapons & Defense Plates Forging**: Players can select between offensive and defensive tabs. Forge classic weapons (Sword, Dagger, Bow, Mace, Staff, Spear) or heavy protection pieces (Greatshields, Plate Mail, Visor Helms, Gauntlets, and boots).
- **Direct Backpack Deposit**: All completed blacksmith products are smoothly deposited straight into the player's Backpack Bag inventory. This protects active gear slots and allows convenient equipment management.

---

## 11. Guild Headquarters, Factions & Advanced Trade Economy (v2.7.0)

### 🏺 Biome-Based Supply & Demand Economy
- **Dynamic Trade Markets**: Commodities (wood, alloys, catalysts, potions) fluctuate in value based on the regional geography (current biome):
  - 🪵 **Raw Wood**: Plentiful in Verdant Forests but spikes to extreme prices in Arid Deserts (▲ +70% demand).
  - ❄️ **Freezing Blizzards**: Boosts value of warm Seppo's Hooch and restorative potions by 50% in Frozen Tundras.
  - 🔵 **Elemental Catalysts**: Spikes in price inside toxic Swamps and icy Glaciers where elemental materials are heavily sought after.
- **Fluctuation Badges**: Trade booths display active premium percentages and surplus discounts visually using clear color-coded indicators.

### 🏰 Sunder Guild Headquarters
- **Establishment**: Found a personal headquarters in Oakhaven Port Town for 500 Gold, unlocking specialized modular sub-systems and safehouse perks.
- **Modular Lab Upgrades**:
  - *Sunder Logistics Deals*: Increases material sell values by +20% per rank (Max Rank 3).
  - *Expedition Map Room*: Accelerates companion autonomous scouts by +25% speed per rank (Max Rank 3).
  - *Cooperative Bargaining*: Grants a passive -5% discount on vendor purchase transactions per rank (Max Rank 3).
- **Sanctuary Decoration placing**: Purchase decorative artifacts and place them inside the sanctuary to active permanent multiplier buffs:
  - ⛲ *Ambient Leystone Hearth*: Restores +10 HP and +5 MP upon completing any dungeon floor or overworld travel.
  - 🔮 *Oracle Crystal Orb*: Amplifies XP gains by +15%.
  - 🏆 *Champion Trophy Pedestal*: Increases critical strike chance by +5%.
  - 🛡️ *Sunder Vanguard Banner*: Grants flat +3 Armor defense.

### 🗄️ Secure safehouses & Storage Vaults
- **Wilderness Depots**: Purchase hidden safehouse shelters on any wilderness chunk for 300 Gold to establish a permanent base of operations outside of castle towns.
- **Universal Companion Guards**: Any companion follower present in your active party can be permanently stationed to guard the safehouse. Commissioning preserves their specific name, character icon (`char`), and custom visual color, complete with dynamic localized greeting dialogs.
- **Cross-Overworld Stash**: Includes deep storage vaults to securely stash and retrieve raw alloys, alchemical catalysts, and weapon/armor equipment from any safehouse.

### 🚍 Hardcore Caravan Escorts & Travel Challenges
- **Hardcore Event Probabilities**: Caravan escort road journeys are scaled to be highly challenging. The threat encounter check rate is increased to **85%** per turn step.
- **High-Stakes Stat Contests**: Every road event (e.g., Bandit Ambush, Rockslide, Beast Assault) features elevated d20 check difficulties (**DC 17-19**) and significantly higher item costs to resolve peacefully, including paying 500 Gold bribes, donating 15x sweet berries, spending 8x iron ore, or 18x wood planks. Check failures carry doubled penalties, inflicting up to -28 HP damage and up to +45% physical Exhaustion.
- **Rich Rewards**: Safely navigating the cargo carriage through hazardous highways rewards players with massive gold yields, custom explorer experience points, and high regional renown.

### 📱 Responsive Layout & Clickable Navigation Arrow Buttons
- **Interactive Clickable Scroll Arrows**: Smaller display viewports and mobile screens can hide parts of the horizontally aligned action panel tabs. To address this, dual absolute-positioned, clickable left (◀) and right (▶) arrow buttons overlay the tab bar, enabling instantaneous smooth, hardware-accelerated scrolling for both desktop and mobile players.

### ⚔️ Secret Factions (Moonshadow Syndicate & Dawn Vanguard)
- **Standing & Reputation**: Support rival factions to unlock special forge blueprints. Joining the **Moonshadow Syndicate** or **Dawn Vanguard** grants access to elite signature recipes:
  - 🗡️ *Moonshadow Assassin Dirk*: Fused with poison catalysts to inflict toxic venom strikes.
  - 🥷 *Shadow Cowl*: Conceals the player, boosting crit rate by +12%.
  - 🛡️ *Dawn Vanguard Aegis*: Heavy defensive iron shield.
  - 🧥 *Vanguard Sunplate*: Gold-trimmed steel plates providing massive defense and health stats.

### 🚀 Autonomous Companion Dispatch (Quest Board)
- **Active Expeditions**: Select idle followers to embark on valuable solo operations (e.g. *Border Patrol*, *Apothecary Supply*, *Ruined Fort Excavation*).
- **Turn-Based Progress**: Dispatched companions advance their exploration steps dynamically as the player moves on the overworld.
- **Claim Rewards**: Safely collect high-tier materials, catalysts, gold, and companion XP once the companions complete their voyages.

---

## 12. Campfire Cooking & Alchemical Apothecary Brewing (v3.9.6 Unified)

Breathed extensive mechanical and alchemical progression into Sunder by introducing dedicated gourmet cooking and potion brewing systems, now fully consolidated into the **Crafting Arcanum Workbench** (Forge) for streamlined gameplay.

### 🏕️ Campfire Gourmet Cooking
- **Integrated Workbench Culinary Sub-Tab**: Accessible directly inside the Forge panel, replacing the redundant top-level Life Skills tab.
- **Campfire Proximity Check**: Cooking exquisite meals requires being standing adjacent to or near (within 2 tiles) a warm campfire (`Campfire` tile). Players can utilize existing fire coordinates across castle towns/dungeons, or pitch campfires in the wilderness to begin cooking.
- **Exquisite Food Recipes**:
  - ⚡ **Lightning Grilled Salmon**: Restores 40 HP and infuses the player with *Sparking Reflexes*, boosting critical strike chance by +15% and speed for 25 turns.
  - 🔥 **Spicy Crimson Salmon**: Restores 50 HP and grants *Magma Aggression*, adding a robust +3 Attack bonus for 25 turns.
  - ❄️ **Glacial Frost Ribs**: Restores 50 HP and imbues the player with *Everfrost Bulwark*, providing +3 Defense bonus for 25 turns.
  - 🌙 **Shadow Smoked Jerky**: Prepared with twilight fumes. Restores 35 HP and completely purges player physical exhaustion back to 0%!

### 🧪 Apothecary Alchemical Brewing & Lab Upgrades
- **Integrated Apothecary Sub-Tab**: Conduct alchemical operations directly inside the central Workbench interface.
- **Alchemical Lab Tier System**: Upgrade your alchemical workstation from Tier 1 to Tier 3 using Gold directly from the interface to unlock increasingly powerful, ancient alchemical recipes.
- **Permanent Stat Elixirs**:
  - 🌸 **Regenerative Dew of Oakhaven** (Tier 1): Distilled with birch tree essences. Restores 80 HP and permanently grants +1 Strength (STR).
  - 🧪 **Hyper Focus Elixir** (Tier 1): Synthesized using pine sap crystals. Restores 30 MP and permanently grants +1 Intelligence (INT).
  - 🛡️ **Ironheart Fortitude Draught** (Tier 2): Infused with powdered iron minerals. Restores 60 HP, cleanses 20 Exhaustion, and permanently grants +2 Defense (DEF).
  - 🌌 **Shadow-Warp Void Elixir** (Tier 3): Deep void fermentation utilizing copper ore. Restores 50 HP and 50 MP, and permanently grants +1 Luck (LCK).

### ⛏️ Overworld Mining & Logging Nodes
- **Active Mineral Veins & Logging**: Overworld chunks generate harvestable Copper/Iron mineral veins and Pine/Birch logging trees.
- **Resource Harvesting**: Striking resource nodes with your equipped weapon salvages valuable metal ores and lumber, smoothly depositing them into your crafting inventory.

---

## 13. Celestial Blood Moons, Alchemical Loot Goblins & Stamina Exhaustion (v2.8.0)

Introduced high-stakes cosmic events, dynamic chase loot targets, and realistic physiological fatigue loops to enrich tactical decision-making and mechanical depth.

### 🔴 Blood Moon Celestial Rift
- **Celestial Cycle**: Every 300 to 550 turns, a dramatic Blood Moon rises, dyeing the overworld in a crimson light.
- **Dynamic Threat & Rewards**: Under the Blood Moon, all hostiles gain +25% attack scaling and 50% damage lifesteal. However, defeating them yields double precious alchemical catalysts.
- **Atmospheric Changes**: Immersive log notifications announce the emergence and end of the Blood Moon.

### 🪙 Alchemical Loot Goblins
- **Fleeing Sprites**: Rare, non-aggressive golden Loot Goblins spawn on overworld and dungeon floors.
- **Loot Drop Mechanics**: When attacked, the Loot Goblin attempts to flee frantically. On every single strike they receive, they drop valuable metal alloys (copper, iron, mithril) and alchemical catalysts before ultimately vanishing in a burst of light.

### 🔋 Stamina Exhaustion & Rest System
- **Physiological Fatigue**: Engaging in melee swings, special combat maneuvers, or powerful magic spells accumulates player Exhaustion (ranging from 0% up to 100%).
- **Fatigue Debuffs**: High exhaustion impairs combat performance, reducing your active Dodge and Critical Strike ratings by up to -15%.
- **Purging Exhaustion**: Players can purge exhaustion and rest by:
  - Resting adjacent to any warm campfire or town hearth.
  - Renting a bed inside town inns (-10 Gold).
  - Consuming specialized items such as Shadow Smoked Jerky.

---

## 14. Tavern Minigames, Drunk Patrons & AI Chase Fixes (v2.9.0)

Added immersive social activities inside town taverns, heads-or-tails betting wagers, and successfully refactored enemy chasing AI paths to ensure hostile monsters actively hunt down the player.

### 🥴 Tavern Drunk Patrons
- **Interactive Characters**: Inn and tavern locations feature unique drunk patrons (`🥴` - Drunk Seppo, Uncle Pete, Tipsy Toby, etc.).
- **Rumors & Gifts**: Buy them a draft of Ale for -10 Gold to listen to regional rumors, receive free forging alloys or alchemical ingredients, or gain the *Drunken Cheer* (+10% Critical Strike Chance for 25 turns) buff.
- **Slap Patrons**: Feeling mischievous? Slap them awake to trigger unpredictable, humorous comedic reactions and dialogue outcomes.

### 🪙 Sunder Coin Toss Betting Minigame
- **Wager Stakes**: Challenge any tavern patron to a game of heads-or-tails coin toss wagers of 5 Gold.
- **Win or Lose**: Correct guesses double your bet; incorrect guesses lose the gold. Track your streak and earnings straight from the log!

### 🎯 Intelligent Enemy AI Senses & Chase Routing
- **Active Sight Fields**: Overworld and dungeon enemies no longer remain frozen or passive. They calculate true Line-of-Sight up to 8 tiles sight range.
- **Blind Proximity Sensing**: If a hostile monster is within 5 tiles of the player, they will detect the player's presence blindly (e.g., sound or vibration) and enter the *Chasing* state.
- **Smart Pathfinding**: Chasing enemies navigate obstacles, walls, and corners using A* or intelligent step-towards routing. Passive wildlife and Loot Goblins maintain flee routing to escape the player.

---

## 15. Client-Side Virtual Smoke Test Runner (v2.9.6)
- **Active In-Browser Diagnostics Terminal**: Fully operational step-by-step diagnostic test-suite accessible via the "Smoke Test" tab in the Sovereign God Panel Overlay.
- **Deterministic Action Queues**: Overrides physical keyboard/controller inputs to feed structured commands directly into the core turn engine.
- **Cross-Chunk Spatial Boundaries**: Verifies camera positioning, fog of war calculations, chunk caching, and biome shifts during rapid border crossings.
- **Node-Striking & Camp Building**: Attacks resource nodes, confirms item accretion, buys campfires, places them, and tests the adjacent Exhaustion-purge rest cycle.
- **Social Minigames & Tavern Loops**: Walks inside town inns, bets 5 gold on coin flips, buys ale, and confirms the active *Drunken Cheer* status.
- **Companion Dispatch Integration**: Spawns companions via GOD Panel, sends them on dispatch expeditions via Guild Headquarters, ticks turns, and confirms loot retrieval.
- **Combat & Senses Validation**: Spawns enemies, asserts that hostile entities transition from `Patrolling` to `Chasing` when inside the 8-tile sight cone (or 5-tile blind range), resolves fights, spawns blood decals, and renders floaty damage numbers.

---

## 16. Sunder Secure Lockpicking Mini-Game & Tension Wire Forging (v2.9.7)

Introduced an immersive, tactical skill-based lockpicking mini-game for chests found in dungeon depth chambers and hostile outlaw camps, fully optimized for both desktop and mobile platforms.

### 🔑 Interactive Rotating Cylinder & Tension Physics
- **Dynamic Tumbler Search**: Finding the chest's sweet spot angle allows the screwdriver to successfully rotate. Players must coordinate pick placement and lock tension.
- **Lockpick Stress & Snap Mechanics**: Attempting to turn the lock when misaligned causes high lockpick stress, initiating a physical warning vibration of the dial before snapping the tension wire and consuming a precious lockpick item.
- **Perfect Performance Rewards**: Successfully unlocking chests with zero pick damage rewards players with +25 Gold pristine performance bonuses, a randomized elemental catalyst crystal shard, and +40 Lockpicking XP.

### 📱 Full Mobile-Optimized Tactile Gestures & Usability
- **Tactile Dial Touch Dragging**: Mobile players can drag their finger directly over the circular lock face itself, using precise Cartesian-to-angle mapping to rotate and position the pick smoothly.
- **Enhanced Prevention Controls**: Applied strict event-prevention overrides (`e.preventDefault()` and `touch-none`) on mobile touch-points. This prevents scrolling, page pulling, or double-tap zoom triggers during intense chest-cracking attempts.
- **Dual Platform UI Responsive Layouts**: Visual guidance messages, interactive sliders, and instruction cards adjust dynamically to fit all viewport bounds perfectly across mobile, tablet, and desktop screens.

### ⚒️ Survival Forging Recipes & Economy
- **Tension Wire Forging**: Players can use the survival crafting panel to smelt 1x Tempered Iron into 3x Tension Lockpicks to restock on the fly.
- **Merchant Restocks**: General Town Merchants, Caravan Traders, and Tavern Masters now stock lockpicks in their daily rotating inventory pools.
- **Smoke Test Step 10 Diagnostic Integration**: The automated smoke test sequentially triggers Step 10: simulating discovering, wire-crafting, tensioning, and opening locked chests flawlessly.

---

## 17. Wilderness Factions, Camps & Escapes (v2.9.8)

Introduced a comprehensive faction-aligned wilderness camp system, unique interactive camp leaders, custom faction enemy alignments, detailed reputation standings, and an active Escape Alarm pursuit mechanic with boundary crossing evasions.

### 🏕️ Procedural Faction Encampments
- **Syndicate & Vanguard Camps**: Procedurally spawns Moonshadow Syndicate and Dawn Vanguard camps on overworld chunks using specialized tiles (e.g. customized walls, faction banners, campfires, and guards).
- **Faction Locked Vault Chests**: Each camp holds a locked high-tier chest (with prefix `syndicate_chest_` or `vanguard_chest_`) containing rare alloys, precious catalysts, and large gold payouts.

### 👑 Interactive Camp Leaders (Silas & Valerius)
- **Silas (Moonshadow Syndicate)**: Spawns at Syndicate camps, offering branching interactive dialogue where players can declare allegiance, request poison daggers, or inquire about illicit smuggling routes.
- **Captain Valerius (Dawn Vanguard)**: Spawns at Vanguard camps, allowing players to join the holy legion, request heavy plating, or discuss regional security.

### ⚖️ Durable Reputation Standing & Fallout
- **Neutral Faction Sentry AI**: Faction guards start as neutral and will remain in passive, non-hostile patrol states unless attacked or if the player triggers an alarm.
- **Assault Standing Fallout**: Attacking a faction guard or leader reduces your reputation standing with that faction dynamically (-20 on assault, -50 total on kill). Detailed warnings are output in the chronologue.

### 🚨 Trespassing Vault Alarms & Escapes
- **Escape Pursuit Alarms**: Opening or stealing from a faction's chest without declaring alignment triggers an active **Escape Alarm** for that faction.
- **Aggressive Hunt State**: The active alarm alerts all faction guards in the current chunk, shifting their AI state to aggressively pursue and chase the player across obstacles and fog-of-war lines.
- **Boundary Cross Escape**: Successfully escaping the immediate pursuit is achieved by traversing the chunk borders. Crossing overworld chunk boundaries successfully clears the active Escape Alarm, resetting guard aggression and logging a descriptive narrative escape message.

---

## 18. Abyssal Horde: New Dungeon Denizens & Legendary Bosses (v3.0.0)

Introduced a massive roster of newly designed dungeon creatures, responsive magical projectile abilities, specialized vampire siphoning mechanics, adaptive deep-dungeon weighted spawning pools, and six legendary boss encounters with custom descriptions, visual glyphs, and high-threat stats.

### 💀 New Dungeon Denizens & Abilities
- **Wraith of the Depths (Ghost)**: A weeping translucent specter (`👻`) with high evasion capabilities. Fires ghostly cyan-indigo phantasmal bolts from distance.
- **Fledgling Vampire**: A lethal nocturnal crawler (`🧛`) that moves with swift velocity. Whenever they land a melee strike on the player, they siphon blood, restoring their own HP by a balanced 20% ratio of the dealt damage (capped at 4 HP per strike).
- **Caustic Acid Slime**: A gelatinous emerald blob (`🧼`) that slows and corrodes.
- **Sunder Webspinner (Spider)**: A multi-legged weaver (`🕷️`) that fires sticky web snare projectiles to trap prey.
- **Acolyte Necromancer**: An initiate of death magic (`🧙`). Projects dark violet shadow orbs from afar.
- **Dread Iron Warden (Dread Knight)**: A heavily armored juggernaut (`⛓️`) possessing massive physical defense.

### ⚖️ Adaptive Deep-Dungeon Spawning Pools
- **Weighted Tier Escalation**: Implemented a sophisticated spawning mechanism in the procedural engine. Shallow dungeons feature common pests like Rats and Goblins.
- **Abyssal Escalation**: As the player descends past depth 2, rats and basic goblins are largely filtered out, replaced by high weights of Vampires, Dread Knights, Ghosts, and Necromancers, creating an immersive difficulty curve.

### 👑 Six Legendary Bosses Added
- **Lord Vladis Nocturna (Vampire)**: Sovereign of crypts (`🦇`). Blazes across the arena with dark speed, siphoning a controlled 20% of hit damage (capped at 4 HP) to maintain a fair, winnable boss battle.
- **Viscous Goliath the Great Slime (Slime)**: A titanic pulsating ooze (`🦠`) that absorbs heavy blunt blows.
- **Broodmother Arachnia (Spider)**: Colossal weaver (`🕷️`) spewing toxic, paralyzing webs.
- **Archlich Kel'Thuzar (Necromancer)**: Master of frost rituals (`🔮`) who summons undead reinforcements.
- **Sir Kaelen the Black Warden (Dread Knight)**: A fallen knight in impenetrable armor (`🛡️`) wielding a cursed heavy blade.
- **The Echo of Sunder (Ghost)**: Translucent, floating specter (`👻`) that drifts through physical matter, dealing mental frost stress.

---

## 19. Dungeon Captives & Freedom Fighters (v3.1.0)

Added procedural caged captives locked inside dungeon depths. Once broken free, they act as independent neutral fighters who help battle monsters, with scaled health, separate turns, and unique narrative dialogue lines.

- **Caged / Locked States**: Captives generate inside randomized rooms as chained entities (`🔒`) with a padlock/cage glyph and are named after roles (e.g., Caged Cleric, Captive Miner, Trapped Wanderer).
- **Bump-to-Free Mechanism**: Bump collision logic intercepts standard physical attack sequences. Bumping into a locked cage immediately shatters the cell, triggering celebratory level-up sounds, floating "🔓 FREED!" text popups, and printing a randomized narrative dialogue log of gratitude.
- **Autonomous Hostile targeting**: Freed captives undergo dynamic state transition to Chasing. They do not follow the player or crowd your party but independently scan for nearby dungeon monsters to attack, moving step-by-step and dealing custom-scaled physical strikes.
- **Monster Retaliation & Death Resolution**: Active chasers and monsters recognize freed captives as high-priority hostile combatants, engaging in active physical skirmishes. If a captive reaches 0 HP, they die permanently, logging a descriptive obituary message and spawning their physical corpse on the map.

---

## 20. Overworld Caravan Escort Travel Journeys (v3.2.3)

Allows adventurers to travel across distant coordinates in the procedural overworld by signing up for Caravan Escort services. Rather than walking screen-by-screen, players can travel between discovered town coordinates on the world map securely, engaging in immersive road event resolution along the way.

- **Immersive Travel Step Progress**: Journeys are structured into multiple turn-advancing steps. Each step has rich narrative descriptions of the caravan traveling through dense forests, swampy marshes, or deep tundra fields.
- **Five Random Road Encounters**:
  - **Bandit Ambush**: Ruthless outlaws barricade the road. Players can fight them off with d20 check mechanics, intimidate them using magic, or pay high-coin bribes.
  - **Beast Attack**: Starved wild wolf packs lunge from the woods. Resolve by slaying them, intimidating them, or feeding them raw meats or berries.
  - **Rockslide Obstacle**: Massive boulders block the pass. Leverage physical strength d20 checks or construct wooden lever fulcrums to slide it away.
  - **Holy Pilgrim blessing**: A wandering priest grants divine chants that instantly replenish health (HP), mana (MP), and purge physical exhaustion.
  - **Broken Axle**: Heavy carriage wheels split. Craft splints using gathered timber planks, forge steel replacements with ore, or take time to manually repair.
- **Renown & Gold Payouts**: Safely guiding the wagons across miles of rugged trails triggers celebratory fanfares, awarding substantial gold coins, reputation renown, and explorer experience points.

---

## 21. Grimoire Magic Spell Tuning & Wands (v3.2.4)

Introduces a robust magical tuning interface for spellcasters and sages, offering dynamic spell selection, mana point (MP) adjustments, and weapon-linked synergy bonuses.

- **Automatic Grimoire Interface**: Equipping a magical Staff or Wand automatically populates an elegant spellcasting book overlay in the sidebar below active weaponry.
- **Interactive Spell Grid**: Enable spellcasters to switch active projectiles instantly:
  - 💥 **Fireball** (6 MP): Explodes on contact, dealing massive damage and igniting targets.
  - ❄️ **Icicle** (4 MP): Shoots ice spikes, slowing enemies and inflicting Frost.
  - ⚡ **Lightning Shock** (5 MP): Strikes with electric shocks, stunning hostiles.
  - 🟢 **Poison Dart** (3 MP): Imparts poison debuffs dealing damage over time.
  - 🔮 **Shadow Orb** (5 MP): Emits shadowy rifts draining target health.
- **Wand Mana Conservation Tuning**: Channeling spells through a delicate Wand reduces the mana requirement of all spells by **-1 MP** (down to a minimum floor of 2 MP), rewarding swift and agile magic slingers.
- **Interactive Combat Logs**: Real-time spellcasting logs, detailed costs, and spellcaster descriptions synchronize seamlessly with character status boards.

---

## 22. Dynamic Faction Wars & Territory Conquest (v3.5.0)

Introduces a fully realized geopolitical overworld layer tracking territorial disputes between factions, with real-time tax dividends, faction war chest financing, and tactical direct deployment.

- **Five Faction Territories**:
  - **Borderlands**: Contested forest pass. Grunts passive +10% melee damage to controlling faction.
  - **Shadow Fjord**: Soggy glacier rift. Grants passive +15% shadow resistance to controlling faction.
  - **Moonshadow Cove**: Desert sea-cave. Grants passive +10% trade profit bonus on material sales.
  - **Sunplate Ridge**: High tundra plateau. Grants passive +5 defense rating to controlling faction.
  - **Swamp of Whispers**: Damp, marshy bog. Grants passive +10% alchemical brewing yield.
- **Faction Conquest & War Room UI**: Adds an immersive tab to the Guild Headquarters Overlay where players can:
  - **Monitor Ownership**: Track territory ownership and faction control percentages (0-100%) through custom gauges.
  - **Claim Passive Taxes**: Withdraw accumulated gold coins and random craft supplies (metals, catalysts) generated in real-time by territories.
  - **Finance the War Chest**: Contribute gold directly to your aligned faction's War Treasury in exchange for reputation renown.
  - **Deploy Tactical Directives**: Authorize spending of faction treasury gold to implement powerful strategic directives (e.g. *Vanguard Aegis Shield*, *Syndicate Supply Poisoning*) that push territory control scales.
- **Real-Time Turn-Based Tax Accumulators**: Background taxation loops generate gold and raw alloys/catalysts with every step you take in the overworld.
- **Dynamic Conquest Defeat Hooks**: Defeating enemy soldiers or outlaws on the overworld map dynamically triggers tactical pushes, increasing control of adjacent territories for the player's allied faction.

---

## 23. Finnish Mythology & Epic Rune-Songs Expansion (v3.6.5)

Infuses Sunder with high-fidelity, interactive Finnish folklore, adding a comprehensive history book lore-delivery mechanic, biome-specific runic POIs, Game Master divine intervention spells, and immersive text adjustments.

- **10-Chapter Sunder-Finnish History Chronicle**: Adds a majestic lore-delivery system via the interactive History Book. Exploring the wild allows bards and mages to unlock chapters detailing:
  - 🥚 **Chapter I: The Primordial Egg of Creation** (How Sunder's earth and sky arose from eggs laid on the water-mother's knee).
  - 🎵 **Chapter II: The Ancient Rune-Singers** (The silver elves who learned to command the names of trees and stones).
  - 🌊 **Chapter III: Ahti's Ocean Wrath** (The drowning of King Kenneth's fortress by the waves of the sea-god).
  - 🦴 **Chapter IV: The Song-Giant Antero Vipunen** (Väinämöinen descending into the stomach of the sleeping song-giant to forge and retrieve power words).
  - 🌋 **Chapter V: The Volcanic Crucible of Pohjola** (The geothermal ovens of master smith Ilmarinen deep inside the desert).
  - 🌾 **Chapter VI: The Forging of the Sampo** (The miraculous multi-colored mill grinding endless corn, salt, and gold).
  - 🌲 **Chapter VII: Tapio's Evergreen Kingdom** (The woodland domain governed by the moss-coated king and Queen Mielikki).
  - 🛶 **Chapter VIII: The Swan of Tuonela** (The boiling, dark underworld river of the dead guarded by the majestic silver swan).
  - ⚡ **Chapter IX: Ukko's Golden Hammer** (The sky-father striking the basalt cliffs to produce the first spark of iron and seed of fire).
  - ❄️ **Chapter X: Louhi's Northland Frost** (The cold, dark witch of the far north stealing the sun and locking it in steel mountains).

- **Procedural, Biome-Aware Runic POIs**: Landmarks throughout the overworld adapt their name, description, visual layout, and lore according to the local ecosystem:
  - **Forest**: *Väinämöinen's Rune Stone* (🗿), *Shattered Sampo Fragment* (✨), or *Tapio's Evergreen Grove* (⛲).
  - **Swamp**: *The Gates of Tuonela* (🏰) or *Vellamo's Healing Spring* (⛲).
  - **Tundra**: *Ribs of Antero Vipunen* (🦴) or *Louhi's Frost Obelisk* (🗿).
  - **Desert**: *Forge of Ilmarinen* (🔥) or *Ukko's Lightning Bolt* (⚡).

- **Epic Mythical GM Interventions**: The Game Master storyteller can invoke three legendary events when the player needs guidance or is bored:
  - ⚡ **Ukko's Golden Bolt**: Ukko strikes the nearest hostile creature for **35 celestial damage** and infuses the player with sky-sparks, restoring **+10 Mana**.
  - 🎵 **Väinämöinen's Rune-Song**: Väinämöinen sings the ancient runes of creation, healing the hero for **+25 HP** and calming nearby hostiles back into patrolling.
  - 🍯 **Mielikki's Honey Drop**: The woodland queen places a special survival basket directly into the adventurer's inventory containing **1 Campfire Grilled Fish** and **1 Prime Flame-Grilled Steak**.

- **Finnish Mythological Overworld Enemies & Bosses**: Spawns unique, thematic folklore threats natively inside respective biomes in the overworld:
  - 👹 **Hiisi Forest Fiend**: A rock-demon or ancient forest goblin born of woodland malice. They hurl earthen curses, guard ancestral stone mounds, and drop *Hiisi Rune Pebbles* and pine resin.
  - 🧜 **Näkki Water Kelpie**: A malevolent swamp spirit that lures travelers with runic melodies. A ranged spellcaster that projects water blasts and drops *Näkki Pearls* and swamp water.
  - 🐻 **Otso the Honey-Paw (Legendary Boss)**: The sacred King of the Forest. A majestic golden-clawed bear spirit that spawns rarely in forests. Drops the legendary *Otso's Heavy Fur-Plate* (chestplate with warm properties), *Mielikki's Sweet Honey* (fully heals and permanently increases Max HP), and prime wild meat.
  - 🦅 **Louhi, Mistress of Pohjola (Legendary Boss)**: The shape-shifting ruler of the Northland, spawning in tundra glaciers. She casts glacial *frost storms* and drops the legendary *Louhi's Runed Frost Staff* (catalyst doubling frost magic) and the legendary *Sampo Fragment* (cosmic wealth-generator granting passive gold).

- **Flavored GM Narratives**: Overworld navigation logs are saturated with rich references to epic Finnish folklore, mentioning the bellows of Ilmarinen, the cold sorceries of Louhi, and the bounteous boons of Mielikki.

---

## 24. Domain-Specific Engine Modularization & Cleanups (v3.6.7)

Refactors Sunder's codebase to decouple dense game mechanics, system parameters, and configurations from the main visual layout components. Decoupling structures into highly specialized domain utilities inside `/src/utils/` ensures pristine maintainability, improved build speeds, and a simplified pathway for adding custom content.

- **`weatherEngine.ts` (Meteorology)**: Consolidates the game's climate profiles (Sunny, Rainy, Foggy, Snowy, Sandstorm, Blizzard) with detailed movement speed penalizations, forged equipment immunities, and spellcasting elemental damage modifiers.
- **`spellsAndEquipment.ts` (Arcanum Spells)**: Houses all player spell attributes (Arcane Bolt, Pyroblast, Frostbite Lance, Storm Strike, Poison Dart, Shadow Orb) including name, elements, mana costs, and splash/ignition properties.
- **`shopData.ts` (Merchant Catalogs)**: Regulates shop pricing modifiers and specific inventory arrays for Oakhaven's Blacksmiths, General Traders, Taverns, and the wandering Seppo's secret shop.
- **`fleeQuotes.ts` (Dialogue Generation)**: Generates context-appropriate comedic panic and escape quotes uttered by wildlife or cowardly hostiles when panicking or fleeing.
- **`caravanAndTerritory.ts` (Geopolitics & Transit)**: Controls the background caravan merchant transit schedules and maps out faction geopolitical territory structures across Oakhaven.

---

## 25. Declarative World Generation & Meteorological Settings (v3.6.8)

Further enhances engine modularity by externalizing overworld biome boundaries, climate probabilities, and environmental hazards into a declarative database:

- **`worldConfig.json` (World Database)**: Standardizes overworld parameter limits, decoupling procedural terrain equations from code.
- **Dynamic Whittaker Biome Mapping**: Biome thresholds (temperature limits, dryness indicators) are loaded dynamically, allowing instant re-tuning of world sizes or climates.
- **Meteorological Frequency Matrices**: Weather states (clear sky, blizzard, rain storm, fog bank) are sampled directly from JSON-defined weights, ensuring smooth, regional transition flows.
- **Procedural Environmental Hazards Control**: Fine-tunes lake counts, min/max lake radiuses, trap spawn frequencies, trap hazard profiles (Spikes, Fire Vents, Poison Marsh Geysers), loot chest volumes, and roaming monster populations dynamically on a per-biome basis.

---

## 26. Dual-Hand Combat Durability & Gauntlets/Neck Piece Armor Separation (v3.8.6)

Introduces comprehensive overhauls to physical combat durability simulations and disentangles legacy armor mappings to establish distinct equipment types for Gauntlets and Neck Pieces:

- **Dual-Hand Durability & Damage Simulation**:
  - Overhauled physical melee and defensive block state calculations to correctly register and decay both the Right Hand (weapon) and Left Hand (shield or secondary weapon) slots.
  - Attacking or blocking cleanly degrades weapon/shield durability based on hits/blocks, accounting for broken equipment states, dual-wielding combinations, and shield absorption rates.
  - Implements the exact tracking of `effectiveWeaponDamage` across both slots to dynamic combat modifiers.
- **Independent Armor Separation (Gauntlets & Neck Pieces)**:
  - Disentangled the combined equipment slots to establish separate **Gauntlets** (`Gloves` type, 🧤 emoji) and **Neck Pieces** (`Amulet` type, 📿 emoji) as fully independent categories.
  - Configures separate blacksmithing forge recipes, merchant inventory maps, alchemical mutations, and stat scaling systems for both slots.
  - Updates the primary equipment paperdoll HUD inside the character inventory sheet to render distinct slots, visual labels, and unequip callbacks.
- **Smart Repair Shop Sorting & Durability Overlays**:
  - Automatically sorts player backpack inventories inside the repair shop to prioritize damaged or broken equipment: broken items (0% durability) bubble to the top, followed by partially damaged items, and pristine items at the bottom.
  - Renders highly responsive, color-coded durability gauges and tooltips across all equipment displays.

---

## 27. Universal Equipment Loot Drops & Rare Necklace Probability (v3.8.7)

Overhauls the procedurally generated drops and treasure chest inventories to ensure all gear types are fully lootable, while balancing necklaces as rare, valuable finds, fully integrated with dynamic player Luck scaling:

- **Universal Gear Looting**:
  - Transferred static name arrays into a fully procedural, multi-class equipment generator (`generateRandomLootGear`).
  - Correctly types and classifies all dropped and discovered armor—such as Helmets, Gauntlets/Gloves, Boots, Shields, Heavy/Light body armor, and all weapon subtypes—ensuring they equip to their correct paperdoll slots without legacy slot collisions.
  - Implemented specialized, legendary boss/dragon pools with appropriate, authentic item properties and flavor text for Surtur, Otso, Louhi, and Elder Wyrms.
- **Luck-Scaled Drop & Loot Rates (v3.9.10)**:
  - **Monster Drops**: Defeating monsters features a dynamic equipment drop chance scaling factor of **+3% per point of LCK above base 10** (up from 2%), which directly boosts the base 22% drop rate (capped up to 85%).
  - **Chest Loot**: Finding random weapons, armor, or shields inside chests features a scaling factor of **+3% per point of LCK above base 10** (up from 2%), boosting the base 30% chest gear chance (capped up to 90%).
- **Rare Necklace/Amulet Balance**:
  - Tailored Necklaces/Amulets (`Amulet` subtype) to spawn with a low 5% probability from standard hostile remains and a balanced 10-15% chance in treasure caches.
  - Generates rare pendants and charms with unique, powerful passive attribute stat rolls, adding high excitement value to lucky finds.

---

## 28. Immersive Storyteller Narratives & Tiered Loot Rarity (v3.8.8)

Overhauls the active Game Master (GM) Storyteller outputs, debug commands, and procedural loot systems to fully preserve player immersion, alongside integrating a multi-tier rarity system for all lootable weapons and armor:

- **Immersive Narrative Logs**:
  - Removed all breaking of the fourth wall ("GM Storyteller", "God Gift", "GM Breathed", "GM Cast" labels inside player-facing adventure logs).
  - Translated all Game Master events, actions, and custom triggers into rich, in-character descriptions. Rather than reporting external intervention, logs now describe organic overworld happenings (e.g., healing is detailed as a *"sudden warm Seraphic Healing Breeze"* whispering through the air; resource additions are detailed as a *"forgotten Sovereign Resource Cache found on the ground"*).
- **Tiered Loot Rarity & Quality Scaling**:
  - Engineered a modular rarity generator within `generateRandomLootGear` assigning items one of five distinctive combat tiers: **Common** (Gray, 65% weight), **Uncommon** (Green, 22% weight, +1 stat roll), **Rare** (Blue, 10% weight, +2 to +3 stat rolls), **Epic** (Purple, 2.5% weight, +4 to +6 stat rolls), and **Legendary** (Orange, 0.5% weight, +7 to +11 stat rolls).
  - Scaled damage and defense attributes directly based on the rolled rarity. High-quality items are appropriately scarce, ensuring rare drops feel incredibly rewarding to discover.
  - Generates custom stylistic prefixes based on the item's rolled tier (e.g., *Worn/Standard* for Common, *Sturdy/Polished* for Uncommon, *Exquisite/Gilded* for Rare, *Champion's/Sovereign* for Epic, and *Sky-Splitter's/God-Forge's* for Legendary).

---

## 29. NPC Coordinate Sanitization & Wall Spawn Prevention (v3.8.9)

Introduces a robust overworld coordinate sanitization pass for all town citizens, merchants, tavernmasters, companions, and legendary cats, eliminating any possibility of NPCs spawning in walls or other solid layout geometry:

- **Lively Walkable Tile Safety Rules**:
  - Defines strict safety criteria ensuring NPCs can only spawn on non-blocking walkable tiles (specifically excluding `Wall`, `Window`, `Tree`, `PineTree`, `BirchTree`, `CopperVein`, `IronVein`, `Water`, `Table`, `Campfire`, and `Empty` states).
- **Proactive Spiral Pathfinding Search**:
  - Integrates an iterative, multi-layer spiral search algorithm scanning up to a 20-tile radius around desired spawn coordinates to find the nearest valid walkable tile in the event of an initial layout overlap or deterministic block shifting.
- **Dynamic Schedule Coherence**:
  - Seamlessly re-aligns NPC `x`/`y` current coordinates, as well as their scheduled `homeX`/`homeY` and `workX`/`workY` coordinates. This ensures that NPC pathing and schedule transitions never cause them to glitch or stand inside stone buildings or walls.

---

## 30. Safe Player Spawning & Companion Faction Targeting (v3.9.0)

Implements robust coordinate-safety validations to guarantee the player never spawns in blocked tiles (e.g. inside trees, walls, or water) during movement or teleportation events, and refines follower AI targeting mechanics so companions do not engage in combat with neutral or allied entities unprovoked:

- **Universal Player Coordinate Sanitization**:
  - Integrates the 20-tile scanning coordinate sanitizer `findNearestSafePlayerTile` into all critical player spawning and repositioning events.
  - Guarantees player safety during initial game boot placement, cardinal boundary chunk crossovers, caravan escort travel completions, and Recall Scroll teleports. If a destination coordinate overlaps with a tree, wall, water, or building, the scanner automatically shifts the player to the closest safe walkable tile.
- **Follower Faction Targeting Refinements**:
  - Configures all active companion followers (including recruited special cats) with intelligent tactical awareness.
  - Followers will ignore and never attack town guards, crown peacekeepers, or allied caravan defenders under normal circumstances.
- **Dynamic Provocation Aggression Hooks**:
  - Programmed companions to instantly engage in combat if the player provokes and attacks guards (which flags the global `areGuardsHostile` state to true). Followers maintain total immersion, acting as reliable party buffers.

## 31. Faction Watchtower Garrisons, Tribute Chests & Siege Reprisals (v3.9.1)

Introduces high-altitude overworld watchtower structures guarded by elite Syndicate and Vanguard faction garrisons, featuring rare faction-locked tribute chests, dynamic capture-the-flag overworld claim mechanics, and real-time active siege reprisal events:

- **Watchtower World Generation**:
  - Spawns procedurally generated Watchtower fortresses on specific wilderness crossroads chunks, complete with stone battlements, arrow slits, barricades, and elevated observation decks.
- **Elite Garrison Defenders**:
  - Populates each watchtower with elite, high-HP faction-specific defenders (such as Vanguard Knights, Syndicate Enforcers, and Tower Rangers) to guard the strategic territory.
- **Faction Tribute Chests & Flag Capture**:
  - Places a locked Tribute Chest inside the central watchtower vault, plundered by acquiring keys dropped by Tower Commanders.
  - Capture-the-Flag claiming: Defeating the active garrison allows players to hoist their chosen faction standard, converting the watchtower into an allied safe haven that spawns reinforcements and yields passive taxes.
- **Dynamic Active Siege Reprisals**:
  - Claimed watchtowers are subject to dynamic reprisal attacks from rival factions, triggering active siege alarms across the overworld.
  - Simulates active siege battlegrounds by spawning waves of hostile attackers and reinforcing friendly defenders. Players can join the fray to secure the watchtower or let the countdown clock resolve the capture organically.
  - Displays a high-fidelity **Active Watchtower Sieges** sidebar HUD widget showing active siege coordinates, defending/attacking forces, and countdown ticks.

---

## 32. Town Progression & Renown Expansion (v2.5.5)

Introduces a highly reactive Town Progression and Renown expansion, linking the player's reputation with merchant access, hiring options, regional guards, shop grades, and specialized questlines, augmented by player Charisma scaling:

- **Four Core Renown Milestone Tiers**:
  - 🏴‍☠️ **Sunder Outlaw (0-20 Reputation)**: Hostile Town Guards attack the player on sight. Merchants and blacksmiths reject all trade, refusing to buy or sell resources.
  - 🛡️ **Wandering Mercenary (21-50 Reputation)**: Standard trade relations with no price modifiers. Access to general quest board contracts.
  - 🎖️ **Honored Protector (51-80 Reputation)**: Unlocks a passive **10% discount** on all town store purchases.
  - 👑 **Champion of Sunder (81-100 Reputation)**: Unlocks a massive **20% discount** on purchases, triggers special legendary stocks, and enables recruiting elite heavy-plated City Guards as custom companions.
- **Charisma-Scaled Shop Discounts (v3.9.10)**:
  - Prices across all vendors—including the Blacksmith, Apothecary, Supply Merchant, Tavern Master, Exotic Artificer, and Caravan Merchants—are dynamically reduced by **-1.5% per point of CHA above base 10** (up from 1.0%), up to a maximum cumulative discount cap of **50%**.
- **Village Infrastructure Upgrades**:
  - **Blacksmith Forge & Apothecary Lab Upgrades**: Players can donate gold and metal alloys/crystals to upgrade the village blacksmith forge level and apothecary station tier.
  - **Reputation and Stock Rewards**: Each upgrade successfully completed rewards large renown increases (**+8 to +15 Town Reputation**) and permanently upgrades stock availability for advanced materials, formulas, and gear.
- **Outlaw Pardon Questline**:
  - Notorious Outlaws are barred from regular quests but can seek the specialized **"Sunder Outlaw Pardon"** contract. Resolving this questline clears their criminal record, restoring town relations back to neutral Wandering Mercenary standing.
- **Dynamic Renown Dashboard**:
  - Integrated an immersive, real-time reputation status panel directly inside the Quest Board UI. Displays progression towards milestones, detailed tier summaries, current standing values, and status alerts.

---

## 33. Custom Structure Carving & Legend-Mapped Blueprint Designer (v3.9.2)

Introduces a customizable structural carving mechanic and an advanced legend-mapping design engine to allow modders and players to create, customize, export, and dynamically apply spatial assets in the active game overworld:

- **Modular Blueprint Presets (`src/utils/structurePlacer.ts`)**:
  - Out of the box, the system features six highly detailed presets:
    - 🏠 **Cozy Spawn Shelter** (5x5): Brick walls, wooden floor, a cozy bed, tables, chairs, and an interactive door.
    - ⚔️ **Fenced Combat Arena** (8x8): Impenetrable walls flanking a sand ring, spawning two Elite Gladiators with hostile testing AI.
    - 🌀 **Mystic Dungeon Portal** (5x5): An ancient stone array centering a functional Dungeon Entrance portal.
    - 🍓 **Berry Forest Grove** (7x7): A lush natural grove replacing standard trees with walkable grass, dense canopy trees, and harvestable Berry Bushes.
    - 🍻 **Royal Tavern & Lounge** (9x6): Tavern layout boasting comfortable beds, chairs, dining tables, and multiple exit entryways.
    - 🏰 **Faction Watchtower Outpost** (9x9): High-defense watchtower structure lined with Watchtower Walls, Arrow Slits, Battlements, and a Faction Flag.
- **Dynamic Legend Blueprint Translation**:
  - Resolves non-standard grid coordinates by reading custom mapping hashes (`legend: Record<string, string>`) declared within layout blueprints.
  - The designer's parser (`handleLoadPresetToDesigner` in `GodPanelOverlay.tsx`) inspects the legend mapping and translates custom/non-standard chars (like `W` for WatchtowerWall, `S` for Slits, `K` for Decks, `F` for Flags, and `+` for Doors) back into their standard `DESIGNER_LEGEND` equivalents during grid reconstruction.
  - This guarantees that even complex, custom-mapped blueprints load flawlessly into the Structure Designer without character collisions or rendering errors.
- **Sovereign Settlement Rebuild Engine**:
  - Integrates the placement-validation engine `carveStructure` to ensure structures do not clip past world boundaries.
  - Features a custom layout importer JSON text block (`handleApplyHousesJson`) in the God Panel. Developers can enter coordinate arrays of structure JSONs to instantaneously build, wipe, or overhaul the active overworld settlements live.

---

## 34. Wilderness Traveling NPCs & Crime Witness System (v3.9.3)

Introduces interactive, role-appropriate traveling NPCs across the overworld wilderness with a proximity-based visual crime witness system that enforces reputation laws for assault crimes:

- **Wilderness Traveling NPCs**:
  - Organically spawns specialized traveling NPCs (Wilderness Hunters `🏹`, Wilderness Herbalists `🌿`, and Traveling Pilgrims `🚶`) in non-town, non-castle wilderness overworld chunks with a 50% chance.
  - Features customized themed advice dialogues, helpful gameplay and lore tips, and fully integrated role-specific buy/sell trading stores (Hunters trade weapons and pelts, Herbalists supply potions and herbs, Pilgrims sell minor trinkets).
- **Proximity Crime Witness Detection Engine**:
  - Implements a sophisticated proximity-based visual scan checking surrounding visible tiles for any other active town citizens or faction members when initiating an attack on a traveler.
  - If a witness sees the player assault the traveler, the crime is immediately reported to the Sunder authorities, dropping town reputation by **-35 Town Rep** and printing an public outrage warning.
  - Performing the assault in absolute isolation (unwitnessed) lets the player engage in combat without public reputation consequences, enabling stealthy gameplay.
- **Dynamic Combat Transition**:
  - Transition traveling NPCs immediately into aggressive enemy entities on the active grid (ranged Hunters, melee Herbalists/Pilgrims) upon physical assault, seamlessly loading their combat stats into the turn-based engine.

---

## 35. Roaming Outlaw Camps & Bored GM Interventions (v3.9.4)

Introduces dynamic, high-stakes overworld combat encounters triggered autonomously or manually when the Game Master grows bored, bringing lively local narrative flavor:

- **Roaming Outlaw Camp Spawn**:
  - The Game Master can spawn a small camp of 2-3 Outlaw Bandits around a newly lit wood campfire nearby on walkable tiles.
  - Features an elite **Outlaw Bandit Leader** (85 HP, 11 ATK, 4 DEF) and auxiliary **Exile Camp Bandits** (55 HP, 8 ATK, 2 DEF).
  - Spawns in an aggressive **Chasing** AI state, meaning they will actively pursue and engage the player immediately upon generation.
- **Dynamic Lore Monologue Announcement**:
  - On spawn, a dynamic narrative monologue is announced in-character to the adventure chronicle: *"🔥 LORE MONOLOGUE: You hear rowdy laughter and crackling wood nearby... A small Bandit Camp has set up campfire far to the [DIRECTION]! Go disperse them!"*
  - Floating indicator text (`🔥 Bandit Camp! [DIRECTION]`) appears above the map to guide player exploration.
- **Storyteller Integration**:
  - Automatically integrated as a high-threat, double-edged storyteller intervention. When the GM's mood is Mischievous, Sadistic, or Intrigued, and boredom exceeds 30, the camp can materialize nearby to challenge the player's tactical combat readiness.

---

## 36. Quest-Giver Assaults & Responsive Multi-Viewport HUD (v3.9.5)

Introduces the ability to reject, betray, and directly assault quest-giving traveling NPCs (instantly failing active/available quests and turning them hostile), and implements a fully responsive multi-viewport UI with custom mobile HUD systems:

- **Interactive Quest-Giver Assaults**:
  - Adds interactive choices ("Refuse & Attack" or "Betray & Attack") directly inside the traveling NPC dialog overlay interfaces.
  - Doing so immediately fails any associated quests (such as collecting mushrooms for Herbalists, pelts for Hunters, or relics for Pilgrims) and prints a dramatic quest failure notification in the chronicle.
  - Instantly spawns the traveling NPC as an active hostile map enemy with high stats and unique combat roles, letting you loot them on victory.
- **Fluid Multi-Viewport Responsiveness**:
  - Upgrades and refines the layout system checks to correctly support narrow displays (< 1024px) as well as touch devices and mobile user agent strings.
  - Ensures seamless navigation and layout parity between desktop, window-resized browsers, and mobile screens.
- **Compact Mobile HUD and Status Bars**:
  - Displays a beautifully structured, compact statistics grid immediately above the game canvas in mobile mode for Vitals HP, Focus MP, Gold wealth, and Level/XP progress.
  - Includes a dedicated environment sub-bar detailing exact map coordinates, current biomes or dungeon depths, town reputation standing, game clock time, and dynamic Moon Phases with tooltip support.

---

## 37. Scars of the Defeated & Effective Stats System (v3.9.7)

Introduces a dynamic physical trauma tracking system ("Scars of the Defeated") coupled with an on-the-fly "Effective Stats" calculator, eliminating direct stat-mutating bugs and adding rich risk-reward gameplay layers:

- **Battle Injuries & Dynamic Scar Scaling**:
  - When the player takes severe, high-damage blows (dealing $\ge 12$ HP) or falls below 35% health, the combat system triggers a potential scar acquisition roll (`evaluateScarAcquisition`).
  - Scars are categorized by severity levels: Minor, Major, Grave, and Legendary, pulling templates dynamically from a centralized database.
- **Fresh (Healing) vs. Healed (Old) Healing Mechanics**:
  - Newly acquired scars start in a **Fresh (Healing)** state, carrying an active countdown of **25 turns** to fully mend.
  - While Fresh, the wound is tender and inflamed, inflicting negative stat modifiers (e.g., *Jagged Cheek Gash* inflicts `-1 Charisma`; *Shattered Left Ear* inflicts `-1 Defense`; *Shattered Ribcage Dent* inflicts `-4 Max HP` and `-1 Strength`).
  - Once the 25-turn recovery cycle completes, the scar becomes **Healed (Old)**, hardening the adventurer and granting permanent mended bonuses (e.g., *Jagged Cheek Gash* grants `+1 Attack`; *Shattered Left Ear* grants `+1 Luck`; *Shattered Ribcage Dent* grants `+2 Defense`).
- **Real-Time On-the-Fly Attribute Calculations (`getEffectiveStats`)**:
  - To prevent glitches and permanent stat decay, the game engine calculates player attributes on-the-fly. The `getEffectiveStats` utility intercepts all stat access, computing modifications from scars, gear, and temporary curses dynamically.
  - **Combat & Vitals Integration**: Player weapon attacks, defense ratings, spell damage, and maximum health pools recalculate dynamically based on active scar statuses during each combat tick.
  - **Carrying Capacity Weight Sync**: Maximum carry limits automatically scale with effective Strength, meaning fresh muscle tears or collarbone fractures reduce inventory capacity temporarily until they heal.
  - **Character Sheet Visual Feedback**: The character dashboard highlights active base values alongside responsive, color-coded effective values (green for buffs, red for penalties), displaying scar details, healing countdowns, and active status labels.
- **Sovereign Creator Lab Manipulation**:
  - Integrates direct battle trauma controls in the God Panel's Creator Lab tab, letting testers manually apply, test, or trigger any of the 24 unique battle scars instantly.

---

## 38. The Over-Forging Heat Gauge & Bellows System (v3.9.12)

Introduces a high-stakes Over-Forging Bellows system across weapon forging, mutation, and equipment upgrades:

- **Interactive Bellows Heat Control**: Players can set or pump the Over-Forging Heat level (0% to 100%) prior to crafting, mutating, or upgrading gear.
- **Scaling Power Multipliers**: High heat scales equipment stats up to **2.25x** (+125% power) and unlocks divine "God-Forged" item titles and legendary prefixes.
- **Shatter Risk & Anvil Recoil**: High heat increases the risk of equipment shattering (up to 65% at max heat) yielding scrap material, and inflicts anvil heat recoil damage (up to 15 HP) on player HP upon crafting.
- **Modular Workbench Integration**: Extracted into `OverforgeGauge.tsx` and seamlessly integrated into Forge Equipment, Mutation Forge, and Upgrade Gear panels inside `CraftingPanel.tsx`.

---

## 39. Modular Engine Architecture & Discard Gump Modal (v3.9.13)

Modularized core crafting systems, introduced an interactive fantasy-styled item disposal modal, guaranteed scroll stackability, and updated developer guides:

- **Interactive Discard & Drop Gump Modal (`DiscardItemModal.tsx`)**: Built a retro fantasy-styled Gump modal for dropping or destroying items, supporting stack quantity sliders and physical ground loot placement.
- **Stackable Spell Scroll Systems**: Guaranteed that all scroll items (Recall, Fireball, Teleport, etc.) are fully stackable in inventory slots with quantity tracking.
- **Comprehensive Developer Documentation**: Updated `DEVELOPERS.md`, `FEATURES.md`, `README.md`, `VERSIONS.md`, and `todo.md` with clear instructions for adding custom items, recipes, weather, enemies, and structures.

---

## 40. Unstable Mutation "Synergy Chains" & Dual-Element Infusion (v3.9.14)

Engineered a modular Unstable Mutation Synergy Chain system allowing gear to accumulate elemental catalysts, unlocking 10+ dual-element synergy traits, chain tiers, and strain gauges:

- **Dual-Element Synergy Traits (`mutationSynergy.ts`)**: Infusing multiple elemental catalysts (Fire, Frost, Lightning, Shadow, Poison) unlocks named dual-element synergy traits such as *Thermal Shock*, *Plasma Arc*, *Hellfire Singularity*, and *Corrosive Blight*.
- **Multi-Tier Chain Progression**: Successive mutations build Chain Levels (Lv 1 to Lv 10). Chain Lv 3 triggers Supercritical Resonance (+25% power bonus), while Chain Lv 5+ unlocks Omega Chaos Overcharge (+50% power bonus).
- **Interactive Mutation Synergy Panel (`MutationSynergyPanel.tsx`)**: Displays infused elemental catalyst chips, active synergy traits, power multiplier forecasts, and a dynamic Mutagenic Strain Gauge (0% to 100%).
- **State & Inventory Integration**: Mutated items persist `synergyCatalysts`, `synergyTitle`, `mutationStrain`, and traits across player saves and item tooltips.

---

## 41. Portable Blacksmith Anvil & Field Station Adjacency (v3.9.15)

Implemented a deployable Blacksmith Anvil structure allowing players to forge, mutate, and upgrade equipment anywhere in the field:

- **Craftable Anvil Structure**: Craftable in the *Survival* tab using 5x Tempered Iron and 2x Scrap Wood. Deploys a solid Anvil tile (`⚒️`) at an adjacent map position.
- **Station Adjacency Requirements**: Forging weapons, mutating equipment, and upgrading gear require standing adjacent to a Blacksmith Anvil (`⚒️`) when in the field, or visiting Town. Clear informational banners guide players when away from a forge station.
- **Developer Cheats Integration**: Added an instant "Anvil (⚒️)" spawn button inside the Developer God Panel console (`GodPanelOverlay.tsx`) for rapid testing.
- **Map & AI Collisions**: Fully integrated `TileType.Anvil` into pathfinding (`ai.ts`), collision detection, mini-map rendering (`ChunkMinimap.tsx`), and sprite/glyph engine (`GameCanvas.tsx`).

---

## 42. Phase 4 Performance Optimization, Render Isolation & Admin Editor Safety (v4.0.0)

Engineered comprehensive performance, memoization, and stability enhancements across core game loops and visual overlays:

- **FOV & Line-of-Sight Spatial Hashing**: Bounded and memoized `computeFOV` and spatial visibility queries using bounding-box spatial hashes in `ai.ts`, eliminating redundant calculations on unchanged turns.
- **Render Boundary Isolation (`React.memo`)**: Wrapped key visual components and overlay containers (`GameCanvas`, `GameLog`, `DifficultyTracker`, `DungeonGlancePanel`, `UnifiedInventoryPanel`, `CraftingPanel`, `GodPanelOverlay`, `GodStatEditor`, `AppOverlays`, `MutationSynergyPanel`, `OverforgeGauge`, `CookingTab`, `AlchemyTab`) in `React.memo` to eliminate cascading parent re-renders.
- **Admin Editor Safety Patch**: Fixed `GodStatEditor` scar database fallback to `SCAR_DATABASE` to prevent uncaught `TypeError` crashes when clicking Admin Editor from the Dev Panel.
- **Safe Navigation Grid Guards**: Added strict safe-navigation array checks (`map?.[0]?.length`) in pathfinding and movement routines (`App.tsx`, `ai.ts`) to eliminate undefined grid access exceptions.

---

## 43. Autonomous GM Engine, Replay Sim Dock, Chaos Natural Decay & Combat Rest Guard (v4.0.1)

Delivered game master autonomy updates, simulation replay dock controls, peaceful chaos decay, and tactical combat resting restrictions:

- **Autonomous GM Storyteller Active by Default**: Enabled the autonomous GM Storyteller engine (`gmStoryteller.ts`) and removed gift restrictions (`disableGifts: false`) by default, allowing active story interventions, tactical shifts, and dynamic world event triggers.
- **Minimizable Replay Simulator Dock**: Built a `Minimize` feature in `GodPanelOverlay.tsx` that collapses the developer overlay into a compact floating bottom HUD during replay simulation playback, letting players watch live canvas gameplay while maintaining step, play/pause, scrub, and speed controls.
- **Peaceful Chaos Matrix Natural Decay**: Modified `gmStoryteller.ts` and `ChaosConsole.tsx` so Chaos/Boredom automatically decays toward the 20% natural baseline during peaceful or non-combat turns.
- **Campfire Combat Rest Guard**: Added a tactical proximity check in `App.tsx` preventing players from resting at campfires when hostile monsters are within 8 tiles.

---

## 44. Engine Performance Pass, 2D Canvas Minimap & Context State Optimization (v4.0.2)

Executed targeted performance enhancements across 2D rendering and raycasting hot paths:

- **Chunk Minimap Canvas Migration**: Replaced 441 React grid `<div>` nodes in `ChunkMinimap.tsx` with a single high-performance HTML5 2D `<canvas>` element, eliminating DOM allocation and garbage collection thrashing on player movement turns.
- **Raycasting Inner Loop Math**: Replaced floating-point `Math.sqrt` calculations in `ai.ts` line-of-sight raycasting with fast squared distance checks (`distSq > radiusSq`), accelerating FOV calculation.
- **Canvas Context State & Font Overhead Reduction**: Eliminated per-tile `ctx.save()` / `ctx.restore()` stack pushes in `GameCanvas.tsx` and initialized canvas font/alignment once before tile loops, avoiding re-parsing font strings 600+ times per frame.

---

## 45. Landing Page Tactical Primer Update (v4.0.3)

Refined landing screen documentation:

- **Tactical Primer Copy Refinement**: Updated movement controls text in `App.tsx` to explicitly indicate WASD or Numpad, and updated spike/trigger references to direct trap avoidance guidance.

---

## 46. Architectural Deconstruction, Custom Hooks & Engine Refactoring (v4.0.4)

Completed comprehensive modularization of the monolithic `App.tsx` game loops into domain-specific custom React hooks (`src/hooks/`), isolated world generators (`src/world/`), and applied performance optimizations:

- **Modular Enemy AI Engine (`useEnemyAI.ts`)**: Extracted turn-based enemy pathfinding, AI solvers, faction chase algorithms, weather state updates, GM storyteller event ticks, and seasonal turn cycles into a standalone hook.
- **Modular Combat Engine (`useCombatEngine.ts`)**: Extracted physical strike math, scar triggers, overforge heat recoil, durability decay, defensive bracing (`handleBraceDefense`), and critical hit calculations into a custom hook.
- **Modular Player Movement (`usePlayerMovement.ts`)**: Modularized player movement, terrain collision checks, tile traps, stamina consumption, and stair transitions (`descendToDungeonFirstFloor`, `advanceToNextDepth`, `climbToPreviousDepth`, `climbStairsUpToOverworld`).
- **Keyboard Input Controller (`useKeyboardInput.ts`)**: Isolated hotkeys (F1, C, P, O, H, V/K), WASD/Numpad movement bindings, and modal input suppression rules into a custom hook.
- **Save & Load State Manager (`useSaveLoad.ts`)**: Isolated LocalStorage serialization, auto-save timers, and JSON import/export routines.
- **Isolated World Generators (`src/world/`)**: Extracted procedural dungeon generation into `src/world/dungeonGen.ts` and overworld chunk/landmark placement into `src/world/overworldGen.ts`.
- **FOV Raycasting Spatial Hashing & Render Isolation**: Memoized line-of-sight raycasting (`computeFOV`, `bresenhamLine`) with spatial bounding-box hashing in `ai.ts`, and wrapped all canvas overlays and HUD sub-panels in `React.memo` to eliminate cascading re-renders.

---

## 47. Phase 11 Data Centralization, Equipment Hooks & Durability Null Safety Patch (v4.0.5)

Centralized game balance formulas, settlement economy matrices, and NPC dialogue trees into declarative data modules, decoupled equipment handling into `useEquipmentHandlers.ts`, and implemented defensive null-safety guards:

- **Centralized Balance Engine (`src/data/balance.ts`)**: Externalized XP leveling formulas (`getXpForLevel`), net damage mitigation curves (`calculateNetDamage`), critical hit multipliers (`calculateCritDamage`), and overforge safety thresholds into a unified, easily tunable module.
- **Centralized Settlement Economy Matrix (`src/data/economy.json`)**: Externalized reputation tier discount thresholds, charisma trade scaling formulas, caravan escort payouts, and biome price volatility factors into structured JSON schemas.
- **Centralized NPC Dialogue Trees & Quests (`src/data/dialogues.json`)**: Externalized shopkeeper conversations, tavern rumors, and quest objective matrices into declarative JSON configurations.
- **Equipment Management Hook (`useEquipmentHandlers.ts`)**: Decoupled equipment slot assignment, paperdoll updates, stat recalculations, and durability decay tracking into a dedicated custom hook.
- **Equipment Crash Null-Safety Guard**: Fixed runtime `TypeError: Cannot read properties of undefined (reading 'name')` crashes when equipping weapons or armor missing explicit `materialUsed` or `catalystUsed` objects by automatically injecting safe default fallback objects (`Forged Alloy` material and `Physical` catalyst) during item equipping and UI rendering.

---

## 48. Phase 21 WebAudio Spatial Sound Engine & Accent Ambiance (v4.3.5)

Implemented a pure procedural WebAudio synthesis engine (`src/utils/audio.ts`) with zero external audio dependencies:

- **Spatial Distance Attenuation & Stereo Panning**: Positional sound effects automatically calculate relative distance and panning relative to the player's tile coordinates ($x, y, \text{playerX}, \text{playerY}$), dropping off with quadratic falloff $(1 - \text{dist}/\text{maxDist})^{1.5}$ and filtering frequencies at distance.
- **Dynamic Accent Soundscapes**: Procedurally generates complex biome soundscapes including rain noise, blizzard howl, sandstorms, dungeon low-frequency sub-drones, and periodic biome accents (`owl_hoot`, `cricket_chirp`, `frog_croak`, `cave_echo`, `lute_pluck`, `ocean_wave`, `fire_crackle`, `water_drip`).
- **HUD Quick Mute & Preferences Persistence**: Features a 1-click **`🔊 Mute` / `🔇 Muted`** toggle in the main HUD header bar and saves user volume choices in `localStorage` (`cosmic_abyss_audio_settings_v1`).
- **Full Developer Guide**: Complete sound graph specs, node routing, and custom sound creation guide available in [`AUDIO.md`](/AUDIO.md).

---

## 49. Realistic Indoor Building Acoustic Soundscape & Acoustic Attenuation (v4.3.6)

Implemented realistic building interior acoustic detection, lowpass atmospheric wind muffling inside buildings, door opening/closing creaks and latches, indoor timber and clock accents, and surface-aware footstep audio:

- **Building Interior Acoustic Detection (`src/utils/buildingAudio.ts`)**: Automatically identifies when the player is inside houses, taverns, shops, keeps, watchtowers, 2nd floors, or subterranean levels.
- **Lowpass Atmospheric Wind Muffling**: Dynamically adjusts ambient audio lowpass filters (~650 Hz cutoff frequency when indoors) so outdoor rain, blizzards, wind, and storm soundscapes are muffled realistically behind wooden walls and stone roofs.
- **Indoor Building Accent Soundscapes**: Triggers indoor atmospheric background soundscapes (`fire_crackle`, `wood_creak`, `lute_pluck`, `clock_tick`) at soft gain levels (`0.06`–`0.09`) inside buildings.
- **Surface-Aware Footsteps & Door SFX**: Synthesizes procedural `door_open` creaks, `door_close` thuds, `wood_footstep` (warm plank step), `stone_footstep` (crisp tile step), and `grass_step` (outdoor rustle), dynamically switching sound effects as the player steps across different floor materials or threshold doors.
- **Acoustic Wall Occlusion**: Filters positional sound effects heard through building walls, low-pass filtering higher frequencies to simulate sound passing through solid barriers.

---

## 50. Dynamic Sun & Moon Directional Drop Shadows (v6.2.0)

Implemented astronomical 24h solar/lunar cycle drop shadow vector projection engine (`src/canvas/shadowRenderer.ts`):

- **Dynamic Vector Math**: Calculates real-time directional shadow vector offsets `(dx, dy)`, lengths, and opacities based on in-game 24h clock minutes (long morning shadows extending west at dawn, compact midday shadows at noon, long evening shadows extending east at dusk, cool slate moonlight shadows at night).
- **Comprehensive Environmental Projection**: Casts soft translucent directional drop shadows beneath trees (`🌲`, `🌳`, `▲`), rock walls/veins, structure gates/signs, as well as living entities (Player, NPCs, Enemies, Bosses) in `tileMapRenderer.ts` and `entityLayerRenderer.ts`.
- **Astronomical Precision**: Shadows smoothly rotate and elongate as hours pass, blending seamlessly into night slate hues under the moon.

---

## 51. Water Ripples & Footstep Splashes (v6.2.0)

Implemented kinetic water surface physics and rain footstep particles (`src/canvas/entityLayerRenderer.ts`, `src/canvas/visualFxParticleSystem.ts`):

- **Concentric Water Ripples**: Triggers expanding concentric ring ripple animations (`spawnWaterRipple`) when player, NPCs, or enemies move onto water (`🌊`), shallow stream, or swamp bog (`🐊`) tiles.
- **Rain Footstep Splashes**: Generates temporary water droplet splash particles (`spawnFootstepSplash`) when moving over any outdoor tile during active `rainy` or `stormy` weather conditions.
- **Entity Agnostic**: Functions dynamically for player steps, NPC routines, companion movement, and enemy chase paths.

---

## 52. Ambient Environmental Particles & Desert Dust Devils (v6.2.0)

Implemented biome-specific ambient particle systems in the 60 FPS HTML5 Canvas engine (`src/canvas/weatherLightingRenderer.ts`):

- **Falling Leaves, Cherry Blossoms & Spores**: Forest, Tundra, and Swamp biomes generate ambient floating leaf particles (`fallingLeaves`), cherry blossom petals (`cherryBlossoms`), and glowing bio-luminescent spores (`spores`).
- **Desert Dust Devils**: Desert biomes spawn animated spinning dust devil vortex particles with rotational physics and sandy trails.
- **60 FPS Performance Optimized**: Batched path drawing and capped active particle pools prevent canvas thrashing.

---

## 53. Weather Pattern Transition Fade & Atmospheric Overlays (v6.2.0)

Implemented smooth weather transition cross-fading and transitional atmospheric veil engine (`src/canvas/weatherLightingRenderer.ts`):

- **Smooth Weather Cross-Fade**: When weather conditions shift (e.g. from clear to rain, fog, sandstorm, or blizzard), outgoing and incoming weather layers cross-fade smoothly over a 2.4-second interval (`renderWeatherOverlay`).
- **Fade-to-Fog & Darken-Screen Veil**: During the transition window, a sine-wave bell curve overlay peaks at midpoint transition (`progress = 0.5`), casting a subtle darkening veil and soft rolling fog haze across the canvas.
- **Atmospheric Depth**: Prevents abrupt visual pops, providing a cinematic, gradual shift in sky tone, lighting, and ambient precipitation.

---

## 54. Autonomous GM Enhancements: Weather Directives, Threat Escalation & Caravan Injections (v6.8.0)

Implemented narrative GM storytelling intelligence extensions inside the core game loop (`src/utils/gmStoryteller.ts`, `src/data/gmCommands.ts`):

- **Autonomous Biome-Aware Weather Modulations**:
  - Sadistic & Mischievous GMs call down harsh tempests (`gm_harsh_tempest`): Blizzards in Tundra, Sandstorms in Deserts, and Torrential Storms in Forests.
  - Benevolent GMs part storm clouds (`gm_benevolent_clear_skies`), clearing rain and dispersing mist into calming warm light when player HP is low.
  - Meteorological climaxes and ambient audio cues (`thunder`, `wind_howl`, `spell_cast`) accompany all atmospheric state shifts.
- **Dynamic World Threat & Chaos Escalation**:
  - Dynamic threat surges and Chaos Matrix adaptation monitor player kill streaks, buffing monster stats, increasing elite corruption affixes, and summoning Anomaly mutations.
  - Periodic Chaos Core Surges (rolls 1-20) deliver tactical hazard traps or divine restoration boons.
- **Autonomous Caravan Injections & Outlaw Blockades**:
  - The GM autonomously manifests passing travelling merchant wagons (`🛒`) in overworld wilderness chunks to offer field supplies or escort contracts.
  - Dangerous trade corridors trigger dynamic Outlaw Road Blockades (`gm_road_blockade_skirmish`) led by Corrupted Road Barons.

---

## 55. Combat Visual Clarity & Directional Outward Drift (v6.9.0)

Implemented clear line-of-sight directional drift mechanics and crisp text rendering for all combat floating numbers (`src/utils/combatFloaterDrift.ts`, `src/components/GameCanvas.tsx`, `src/canvas/entityLayerRenderer.ts`):

- **Directional Outward Drift (Clear Line of Sight)**:
  - Floating damage, critical strike, and spell damage numbers calculate their vector trajectory away from the attack source point $(\Delta x, \Delta y)$.
  - Spawns offset outwards to the flank of the impacted entity, arcing smoothly away along the momentum vector with buoyant upward lift.
  - Keeps entity sprites, enemy health bars, casting animations, and telegraph tiles completely unobstructed during intense melee and ranged skirmishes.
- **Flank Divergence for Ambient / Self Effects**:
  - Healing, mana restoration, and self-inflicted damage diverge outwards to side flanks rather than sitting on top of the central character model.
- **Enhanced Contrast & Rapid Decay**:
  - Rendered with deep dark outlines and high-contrast color fills for legibility across all biomes and lighting conditions.
  - Refined decay rate (~0.9s duration) with smooth cubic ease-out alpha falloff to prevent visual clutter and screen crowding.

---

## 56. Contextual Lore & Deep Flavor Logging (v6.9.1)

Implemented comprehensive narrative transparency and contextual lore explanations across all Game Master storyteller interventions, Chaos Surges, environmental events, and player world actions (`src/utils/gmStoryteller.ts`, `src/hooks/useEnemyAI.ts`):

- **Contextual Narrative Explanations**:
  - Every GM intervention, environmental hazard, weather alteration, and chaos surge explicitly logs the *cause and context* behind the event.
  - Lore-grounded descriptors (such as ancient runic rejuvenation, leyline fractures, subterranean clockwork gears, celestial storms, and void rift tears) explain the mechanical consequences clearly.
- **Multi-Message Dispatch**:
  - The storyteller engine tracks and delivers simultaneous chaos evaluations and GM interventions as structured multi-message events to ensure no narrative logs are lost during combat or exploration turns.
- **Lore Transparency**:
  - All event logs maintain immersion by anchoring gameplay state mutations to established world lore, Finnish mythological themes, and dungeon mechanics.

---

## 57. Player Attack & Combat Resolution Hook Decoupling (v6.9.2)

Decoupled player combat resolution and bump-to-attack mechanics from the monolithic `App.tsx` into a dedicated custom hook (`src/hooks/usePlayerAttack.ts`):

- **Encapsulated Player Combat Mechanics**:
  - Encapsulates player melee strikes, ranged weapon shots, stamina consumption, and critical strike calculations.
  - Resolves weapon and shield durability decay across active hand slots with broken item notifications.
  - Triggers companion follower attack assists and intercept maneuvers.
  - Dispatches directional outward drift vectors (`combatFloaterDrift.ts`) for floating damage numbers and kinetic visual effects.
- **Monolith Decomposition & Clean Architecture**:
  - Streamlines `App.tsx` to serve as a focused UI and layout orchestrator.
  - Eliminated dead functions and removed 75+ unused imports across the main component tree.
  - Enforced 100% type safety and verified zero regressions across all 30 Vitest test suites (133 tests).

---

## 58. Sovereign God Mode Console Modularization (v7.0.0)

Extracted all God Mode developer state and sub-tools into a dedicated hook and component architecture:

- **Centralized Sandbox State Hook (`src/hooks/god/useGodPanelState.ts`)**:
  - Centralizes invincibility toggles, stat overrides, item/relic spawning, teleportation (overworld chunks, empty arena, dungeon floors), blueprint preset conversions, and simulation test runners.
- **Decomposed Tab Sub-Components (`src/components/god/`)**:
  - Modularized into 24 distinct developer panels (`GodArenaTab`, `GodCheatsTab`, `GodWorldEditor`, `GodEntitySpawner`, `GodItemSpawner`, `GodWeatherTab`, `GodStorytellerTab`, `GodReplayTab`, etc.).
  - Reduced `GodPanelOverlay.tsx` by ~3,000 lines down to a clean, high-performance tab layout container.
- **Automated Verification**:
  - Verified 31 Vitest test suites (139 tests passing 100% green).

---

## 59. Enemy AI Behavioral Archetypes & Tactical Kiting (v7.8.0)

Integrated deep behavioral archetypes into the modular hostile AI resolution engine (`src/hooks/ai/useHostileAI.ts`, `src/types/entities.ts`, `src/data/enemies.json`):

- **Tactical Ranged Kiting (`skirmisher_kiting`)**:
  - Marksmen and spellcasters (`SkeletonMage`, `Trapmaster`, `FrostbiteSpider`, `AbyssalSiren`) maintain optimal range.
  - When a target (player or defender) steps into melee range ($\le 2$ tiles), skirmishers calculate retreat vectors away from the threat and kite backward to re-establish a 3–4 tile firing line before attacking.
- **Support Healers & Buffers (`support_healer`, `support_buffer`)**:
  - Healers (`Necromancer`, Shamans) scan a 6-tile radius for wounded allies ($HP < 75\%$) and cast restorative spells (+25% HP) with cooldown tracking (`supportSpellCooldown`).
  - Buffers (`Tidecaller`) bestow offensive and defensive combat enhancements upon nearby elite and boss allies.
- **Vanguard Tanks & Ambushers (`tank`, `ambusher`)**:
  - Heavy tanks absorb incoming player pressure, while ambushers deliver high-critical strikes from concealment.

---

## 60. Async Background Chunk Batching & Non-Blocking Pre-generation (v7.8.0)

Implemented a high-performance background chunk generation and caching engine (`src/utils/overworld/asyncChunkBatcher.ts`):

- **Asynchronous Time-Slicing**:
  - Employs `requestIdleCallback` (with an 8ms time budget per frame and fallback to micro-tasks) to generate chunk slices without impacting rendering 60 FPS frame rates.
- **Proactive Surrounding Pre-generation**:
  - During player chunk boundary crossings in `usePlayerTurnMovement.ts`, the batcher automatically schedules background pre-generation for the adjacent ring of surrounding sectors.
- **Cartography Integration**:
  - `chunkTileRasterizer.ts` and `WorldMapModal.tsx` query and populate the async chunk cache, eliminating duplicate generation overhead when opening or deep-zooming the world map across massive sectors.

---

## 61. Arcane Scriptorium: Glyph Rune Tracing & Masterwork Spell Scrolls (v7.9.0)

Implemented an interactive vector rune tracing minigame and Masterwork scroll scribing workstation (`src/components/ScriptoriumMiniGame.tsx`, `src/types/minigames/glyphGame.ts`, `src/components/crafting/ScriptoriumStationTab.tsx`):

- **Vector Slate Glyph Inscription**:
  - Connect runic nodes (0–9) arranged in geometric formations matching spell elements (Fire, Frost, Lightning, Void, Holy, Arcane).
  - Supports mouse/touch dragging with fluid glowing conduit beams, direct keyboard number key (0–9) sequence inputs, reset stroke (`R`), and close (`Esc`).
- **Dynamic Arcane Instability Gauge**:
  - Real-time heat/instability timer with penalties (+15% instability) for wrong node connections.
  - Reaching 100% instability triggers an Arcane Backlash / Fizzle, destroying parchment in smoke.
- **Masterwork Spell Scroll Inscription**:
  - Scoring $\ge 90\%$ accuracy with 0 mistakes creates **Masterwork Spell Scrolls** featuring **0 MP Cast Cost**, **+30% Spell Damage Potency**, and **+15% Critical Strike Chance** in combat.
- **Sandbox Testing in God Panel**:
  - Integrated into `GodMinigamesTab.tsx` with instant reagent granting (`+10 Inks 📜`), template selection, and difficulty tier switching (Novice, Adept, Archmage).

---

## 62. ASCII Default Startup Guarantee & Nature Procedural Pixel Art (v7.9.7)

Guaranteed that every game session boots cleanly in classic ASCII glyph mode while allowing seamless runtime switching to Animated HD Tileset (`🎨 Tileset` button / `F8` / `Alt+T`).

- **ASCII Startup Default (`src/canvas/types.ts`)**:
  - `getStoredGraphicsMode()` unconditionally returns `'classic_glyph'` upon fresh game initialization.
- **Handcrafted Procedural Pixel Art (`src/canvas/MockupAtlasGenerator.ts`)**:
  - **Oak Trees**: Lush multi-lobed canopy with rooted trunk.
  - **Pine Trees**: Sharp tiered dark conifer boughs with highlighted needles.
  - **Birch Trees**: Slender white notched bark with bright crown.
  - **Sweet Berry Bushes**: Dense green foliage adorned with ruby berries.
  - **Mineral Ore Veins**: Copper and iron faceted slate rock boulders embedded with gleaming crystal clusters.
- **Door Animation Stabilization (`src/canvas/spriteRenderer.ts`)**:
  - Wooden doors configured as static single-frame tiles (`frameCount: 1`), eliminating door animation cycling.
- **Calm Water Autotiling (`src/canvas/waterShimmerRenderer.ts`)**:
  - Deep-blue base with gentle horizontal surface ripples and specular ambient glints.

---

## 63. Follower Combat Damage & Dynamic Enemy Target Swapping (v8.0.0)

Integrated multi-defender combat and target swapping across all hostile entities (`src/hooks/ai/useHostileAI.ts`):

- **Comprehensive Entity Evaluation**:
  - Hostile AI checks both `updatedEnemiesList` and `nextEnemies`, evaluating all active companions, town guards, and rival faction entities regardless of turn order.
- **Dynamic Threat Weighting**:
  - Enemies dynamically evaluate proximity, health status, and aggro. If a companion or town guard is closer or heavily wounded, enemies swap targets naturally instead of fixating exclusively on the player.
- **Direct Combat Resolution**:
  - Damage applies to followers with floating text, hit SFX, HP bar updates, and fallen ally persistence.

---

## 64. Early Dungeon Combat Balance & Guaranteed Damage Floor (v8.0.0)

Balanced novice dungeon accessibility and early survival progression:

- **Dungeon Depth Scaling Capping (`src/world/dungeon/dungeonEntities.ts`)**:
  - Capped `calculateGlobalThreatFactor` at floor depths 1 and 2 to ensure early floors remain accessible to newly created adventurers.
  - Enforced `DEF <= 1` and moderate HP pools for standard early dungeon foes.
- **Guaranteed Weapon Damage Floor (`src/hooks/combat/combatMath.ts`)**:
  - Enforced a minimum guaranteed hit damage floor (`minWeaponFloor = Math.max(1, Math.floor(weaponDmg * 0.45))`), preventing zero-damage hits when striking armored opponents with valid weapons.

---

## 65. Chunk Border Obstacle In-Place Carving vs. Player Warping (v8.0.0)

Eliminated disorienting player warps when transitioning overworld chunks into dense woods (`src/hooks/app/movement/useChunkTransition.ts`):

- **In-Place Obstacle Carving**:
  - When stepping across chunk boundaries into natural obstacles (`Tree`, `PineTree`, `BirchTree`, `Bush`), the system carves the obstacle tile into walkable `TileType.Grass` at the exact point of entry.
  - Retains player momentum and spatial orientation without long outward spiral searches.

---

## 66. Dual Instinct Classic Tileset System (v8.2.0)

Implemented a dual authoritative sourcing architecture for the Classic tileset:

- **Dual Sourcing (`classic_png` vs `classic_code`)**:
  - **Instinct Classic (PNG Mockups)**: Pre-rendered static `.png` sprite sheets loaded from `/public/tilesets/`.
  - **Instinct Classic (Procedural Code)**: Live programmatic HTML5 canvas renderer generated at runtime in memory.
  - Runtime hot-swapping in **Tileset Studio** (`F1` -> Tileset Studio tab) with `localStorage` persistence.
- **Synchronized 16×16 Grid Expansion**:
  - Full coordinate alignment between `TilesetAtlasManager.ts`, `MockupAtlasGenerator.ts`, and `scripts/generateMockupPngs.cjs`.
  - Dedicated cells for chests, shrines, crossroads signposts, campfires, covered wagons, dungeon floor traps (spikes, fire, poison, frost), and hazard pools (magma, ice, sand).

---

## 67. Merchant Caravan Escort & Tactical Skirmish Sub-Engine (v8.2.0)

Delivered an inter-settlement trade expedition and tactical battlefield system (`src/world/caravanSkirmishGen.ts`, `src/hooks/useCaravanTravel.ts`):

- **Dedicated 24×18 Tactical Skirmish Battlefield**:
  - Spawns central trade road, merchant covered carriage (`🛒`), guard campfire, 2 allied veteran defenders, and perimeter ambushers.
- **Lossless Overworld State Preservation**:
  - `SavedOverworldSkirmishState` captures an immutable snapshot of the active overworld chunk (`map`, `discovered`, `visible`, `enemies`, `dungeonProps`, player coordinates, and chunk indices).
  - Tactical victory unwraps the saved snapshot and restores the overland terrain and props with zero chunk memory loss.
- **Tactical Retreat Resolution**:
  - Retreating back to the wagon applies carriage damage penalties while safely returning the party to the overland route.
- **Wagon Integrity & High-Value Rewards**:
  - Arriving at the destination calculates rewards based on preserved wagon hull percentage, granting bonus elemental catalysts for pristine condition ($\ge 85\%$).

---

## 68. Living Ecosystem & Autonomous NPC Routines (v8.3.0)

Delivered a simulated ecological and autonomous AI behavior layer (Pillar 1):

- **Fauna Ecology & Predator-Prey Dynamics (`src/hooks/ai/useCivilianAI.ts`, `src/types/entities.ts`)**:
  - Wildlife herbivores (Deer, Rabbits) forage and flee from carnivores.
  - Apex predators (Wolves, Bears) track and hunt prey targets based on hunger thresholds, resolving kills without player involvement.
- **Morale Breaking, Panic Retreats & Surrenders (`src/hooks/ai/factionMorale.ts`)**:
  - Slaying a pack alpha (e.g. Dire Wolf Alpha) or squad leader triggers morale break checks on surviving pack members, causing them to panic and scatter.
  - Wounded humanoid enemies (< 20% HP) trigger desperate surrender states, allowing the player to parley for gold, rations, or information.
- **Dynamic Time-of-Day NPC Schedules & Severe Weather Shelter**:
  - Villagers follow circadian routines: morning commerce, evening tavern socializing, and nighttime bed sleeping.
  - Impending downpours and blizzards drive civilians and livestock into indoor buildings, porches, and around warm campfires.

---

## 69. Dynamic Cellular Elemental Propagation & Environmental Reactions (v8.4.0)

Delivered the complete cellular elemental propagation sub-engine (Pillar 2):

- **Cellular Automata Fire Spread (`src/utils/elemental/elementalEngine.ts`)**:
  - Open flames ignite adjacent flammable terrain (grass tufts, berry bushes, pine trees, wooden doors, campsite furniture).
  - Fire spread is governed by environmental humidity and turn ticks, organically consuming fuel.
  - Completely incinerated vegetation transforms permanently into walkable `TileType.Ash` tiles.
- **Cryomancy & Water Freezing / Melting**:
  - Frost spells and sub-zero ground fields freeze liquid water into solid walkable `TileType.Ice` sheets, creating tactical river crossings.
  - Fire and extreme heat thaw ice sheets back into liquid water; boiling hot surfaces generate dense steam clouds.
- **Electric Shock Conduction & Gas Deflagrations**:
  - Electric currents propagate instantaneously through all contiguous connected water bodies in a single turn, delivering shock damage and stun checks to entities standing in water.
  - Contact between open flames and toxic poison gas pockets ignites violent 3×3 AOE deflagration explosions with bonus fire damage and terrain charring.
- **Tactical Steam Clouds & Line-of-Sight Obscuration (`src/utils/ai.ts`)**:
  - Billowing steam fields block Bresenham raycasting in `hasLineOfSight`, enabling tactical escapes, broken enemy ranged locks, and dynamic stealth repositioning.
- **Procedural Canvas Elemental VFX Renderer (`src/canvas/elementalVfxRenderer.ts`)**:
  - Multi-layered procedural visual effects for fire tongues & embers, ice frost prisms, arcing electric sparks, billowing vapor plumes, and swirling poison clouds.
- **Comprehensive Automated Test Suite (`src/tests/elementalPropagation.test.ts`)**:
  - 7 comprehensive unit tests verifying flammability spread, ash creation, ice freezing/melting, lightning conduction, deflagration explosions, and steam sight blockage (63 test suites, 390 tests passing 100% green).

---

## 70. Spatial Acoustics & Advanced Procedural VFX (v8.5.0)

Delivered the complete spatial acoustics and visual rendering sub-engine (Pillar 4):

- **Raytraced Acoustic Occlusion & Behind-Door Muffling (`src/utils/audio/acousticOcclusion.ts`)**:
  - Implements Bresenham raycasting between any sound emitter and the player listener coordinates.
  - Automatically identifies solid dungeon walls and closed doors blocking the sound trajectory.
  - Dynamically lowers the audio cutoff frequency down to a muffled ~360–750 Hz behind barriers, models acoustic transmission absorption reducing sound volume, and boosts low-frequency cavity resonance (`roomResonanceQ` up to 2.4).
  - Global listener tracking via `setAcousticListenerContext` integrates seamlessly into `calculateSpatialParameters` (`src/utils/audio/spatialAudio.ts`) and `playSound` (`src/utils/audio/soundCatalog.ts`) without requiring callsite refactoring.
- **Dynamic Water Caustics & Refraction Shimmer (`src/canvas/waterCausticsRenderer.ts`)**:
  - Multi-frequency intersecting sine waves generate dynamic light refraction caustics across all open water surfaces.
  - Biome-specific palettes: crystal cyan for oceans/rivers, frost prisms for glacial waters, murky bioluminescent swirls for swamp bogs, and warm golden reflections for desert oases.
  - Projects undulating refractive light ripples onto entities and corpses wading through shallow water (`renderSubmergedObjectCaustics`).
- **Luminous HDR Bloom Engine (`src/canvas/bloomEngine.ts`)**:
  - Additive blending pass with pre-rendered radial gradient stamps cached in memory.
  - Emits soft, luminous halos for torches, lanterns, fireplaces, runic leylines, spell projectiles, and active elemental fields (fire, electric arcs, poison vapor).
- **Contextual Atmospheric Vignette (`src/canvas/vignetteRenderer.ts`)**:
  - Dynamic radial gradient depth framing that deepens in subterranean dungeon descents ($0.48 \to 0.72$ based on floor depth).
  - Adapts to overworld time of day (daylight framing vs. midnight darkness) and special celestial states (crimson glow during Blood Moons, frosted borders during blizzards).
- **Automated Test Suite (`src/tests/spatialAcousticsAndVfx.test.ts`)**:
  - 9 comprehensive unit and integration tests verifying acoustic raytracing through open corridors, closed door muffling, solid wall dampening, listener context integration, water caustics, submerged projection, bloom emitters, and contextual vignette states (64 test suites, 399 tests passing 100% green).














