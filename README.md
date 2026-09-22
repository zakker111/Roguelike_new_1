# Abyss Rogue: Chronicles of the Forge

Abyss Rogue is a highly interactive, procedurally generated full-screen tactical roguelike RPG with durable persistence, deep combat systems, and a dynamic material crafting system.

### 🌐 Play & Test the Game Live
- **Development App (Live Preview)**: [https://ais-dev-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app](https://ais-dev-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app)
- **Shared App**: [https://ais-pre-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app](https://ais-pre-glz2sadkrfnpw5wllszk7w-939355296758.europe-west2.run.app)

---

## 🎮 Game Summary & Core Features

Abyss Rogue provides a classical grid-based turn-based adventure built with supreme visual fidelity and robust offline state simulation:

1. **Procedural Infinite Overworld**:
   - Scroll infinitely across distinct environmental biomes (Forests, Deserts, Swamps, Glaciers, and Castle Towns) powered by jumbo-sized **64x40 grids** per chunk.
   - **Safe Player Spawning & Repositioning**: Incorporates a 20-tile scanning safety validator `findNearestSafePlayerTile` so that players never spawn or get stuck in walls, trees, water, or mountains during initial boots, chunk boundary crossings, caravan arrivals, and Recall Scroll teleports.
   - **Biome-Aware Meteorological Engine**: Experience active daylight shading and single active climate overlays (falling rain, snowstorms, dense fog, sandstorms, blizzards) that shift dynamically over extended 120-turn intervals (configurable up to 300 turns) and adhere strictly to biome climate rules (no rain in deserts, sandstorms exclusively in deserts, blizzards exclusively in tundras, and mild weather in towns). All Storyteller GM commands and God Panel controls enforce these biome weather constraints.
   - **Winter Frost Berry Freeze**: Sweet berry bushes are frozen in glacial tundra biomes. Attempting to harvest them displays an immersive winter freeze notice while swamp biomes feature custom purple wild elderberries (`🫐`).
   - **Modular Building Design**: Evaluates building IDs sequentially to spawn shop-specific furniture (anvils, warm hearths, glass vials, tables, counter blocks).
   - **Castle Fortresses**: Fortified keeps and citadels have a 25% chance of spawning in place of standard overworld villages, dynamically calculating stone wall perimeters, gates, courtyard paving and torch points using the full 64x40 chunk boundaries.
   - **Cardinal Compass Overlays**: Pristine glasses-style direction indicators (NORTH, SOUTH, EAST, WEST) bounding the game canvas margins to simplify overworld travel.
   - **Modular Chunk Minimap (`ChunkMinimap.tsx`)**: Refactored the previous inline map grid renderer into a high-performance, memoized standalone component. Renders an active 21x21 grid representing a 10-tile radius around the adventurer, matching individual terrain colors (walls, water, roads, stairs, landmarks) with robust string-based `TileType` enum checking.
   - **Storyteller Point of Interest Nudges**: Implements deterministic storytelling updates about nearby castles, cozy villages, ruins, and caverns depending on adjacent chunk positions (located in `/src/utils/gmNarrator.ts`).
   - **Interactive Landmark POIs**: Encounter active Landmarks (Shrines, Crucibles, Monoliths, Keeps, and Fossils). Approaching them launches rich, choice-driven encounters for custom alchemical, physical, and stat-modifying rewards.
   - **Interactive Level Decor Props**: Discover interactive decor objects (Sarcophagi, Weapon Racks, Lore Bookshelves, Alchemy Tables, Feather Beds, Roaring Hearths, Town Wells, Notice Boards, Cinder Casks, Sundials). Stepping adjacent automatically displays an interactive HUD alert banner with click/key interactions.
   - **Runtime Modding API & Custom Dungeon Editor**: Register custom monsters, weapons, armor, spells, and dungeon level blueprints at runtime. Includes a visual grid painter with customizable canvas sizes, tile palettes, decor props, enemy placements, and instant Test-Play mode!
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
8. **Life Skills, Wilderness Foraging, Gourmet Campfire Cooking & Survival Camping (v7.5.0)**:
   - **Multi-Biome Foraging & Herbology**: Harvest Glacial Frostbloom (Tundra), Sun-Blossom Aloe (Desert), Bioluminescent Nightshade (Swamp), Earthy Truffles, Wild Honeycombs, and Forest Berries (Forest).
   - **Gourmet Culinary Buffet**: Cook advanced meals (Forest Truffle Chowder, Glacial Frostbloom Tea, Honeycomb Glazed Jerky, Sun-Aloe Hydration Stew, Nightshade Broth) at campfires for sustained stat increases, passive HP/MP regeneration, and extreme weather insulation.
   - **Survival Shelters & Camping**: Craft and deploy Traveler's Bedrolls and Expedition Field Tents on any overworld wilderness tile. Analyzes campsite surroundings, insulation, and companion sentry night-watch duties to mitigate nocturnal predator ambushes.
   - **Passive Mana Meditation**: Restores Focus/MP periodically during exploration, scaling recovery rate with player Intelligence (INT).
   - **Raw Resources & Brewing**: Harvest raw lumber from logging trees, minerals from rich Copper/Iron veins, and brew ancient stat elixirs at upgraded Apothecary Laboratories.
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
12. **Master UI, Cartography World Map & Crafting Overhaul (v7.6.0)**:
   - **Unified HUD & Top Header**: High-contrast gold and slate layout with real-time biome badges, turn counters, time-of-day clock, and glowing navigation tab indicators.
   - **Interactive World Map & Cartography**: Micro-tile surface rasterizer with offscreen canvas caching, soft parchment-burn fog of war, deep-zoom canvas controls, sector threat intelligence dossiers, custom waypoint pins, and runic waystone teleport flows.
   - **Unified Inventory & Paperdoll**: 8-slot humanoid gear paperdoll with segmented durability meters, dual-slot 2H brackets, and active scar overlays. Interactive RPG attribute allocation card (STR, DEX, INT, CHA, LCK), tiered item rarity glows, and portable Alchemical Transmuter.
   - **Modernized Crafting Stations & Overforge**: Multi-discipline tab switcher with live search, stock validation ledgers, Overforge heat danger gauges, scriptorium scroll scribing, alchemy laboratory tiers, and cooking stations.
   - **Monster Codex Bestiary & Categorized Chronologue Log**: Classified monster dossier locking with stat telemetry and loot tables. High-performance categorized adventure log with 6 tactical filters and color-coded damage badges.
13. **Dynamic Faction Wars & Territory Conquest (v3.5.0)**:
   - Campaign for regional dominance across 5 unique territories (Borderlands, Shadow Fjord, Moonshadow Cove, Sunplate Ridge, Swamp of Whispers) that track active faction control and control percentages.
   - Monitor, govern, and interact with the war landscape inside the Faction War Room Dashboard.
   - Collect accumulated gold and alchemical/mineral tax products generated continuously on a turn-by-turn basis.
   - Finance your faction's War Treasury by donating gold in exchange for reputation and prestige.
   - Spend war reserves to deploy game-wide tactical directives (Aegis Shielding, Supply Poisoning) that shift territory control percentages.
   - Defeating faction enemies or outlaws on the overworld map dynamically triggers tactical pushes, increasing control of adjacent territories for the player's allied faction.
14. **Dual-Hand Combat Durability & Gauntlets/Neck Piece Armor Separation (v3.8.6)**:
   - Overhauled weapon and shield durability decay systems to dynamically trace damage across both active hand slots (Right Hand weapon and Left Hand shield/weapon).
   - Established separate slots, recipes, and status multipliers for **Gauntlets** (🧤) and **Neck Pieces** (📿), separating them into fully independent categories.
   - Added an automatic damage-based sorting module inside the blacksmith repair shop, bubbling broken items to the top of the list for seamless repair workflows.
15. **Universal Equipment Loot Drops & Rare Necklace Probability (v3.8.7)**:
   - Migrated drop systems to a procedurally balanced equipment generator (`generateRandomLootGear`), ensuring all gear classes—including Helmets, Gauntlets, Shields, Boots, and Weapons—are fully lootable with accurate subtype properties.
   - Tailored Necklaces/Amulets (`Amulet` subtype) to spawn as rare, satisfying items (5% from regular enemies, 10-15% from chests/bosses) with powerful passive attribute enhancements.
16. **Immersive Storyteller Narratives & Tiered Loot Rarity (v3.8.8)**:
   - Fully decoupled GM storyteller actions and debug commands from third-person labels. All log outputs are written organically in-character to maintain complete narrative immersion.
   - Designed a comprehensive tiered rarity quality matrix (Common, Uncommon, Rare, Epic, Legendary) assigning custom name prefixes, color indicators, and scaling stats, making superior gear drop rarer.
17. **NPC Coordinate Sanitization & Wall Spawn Prevention (v3.8.9)**:
   - Engineered an automated overworld coordinate sanitization routine ensuring NPCs (villagers, shopkeepers, bards, companions, and legendary cats) never spawn inside walls or solid layout tiles.
   - Implemented a multi-layered spiral scan scanning up to a 20-tile radius to position NPCs safely and coherently align current, home, and work schedule points.
18. **Faction Watchtowers & Active Siege Reprisals (v3.9.1)**:
   - Explore and claim strategic high-altitude overworld watchtowers guarded by elite Syndicate and Vanguard faction garrisons, featuring rare faction-locked tribute chests and dynamic capture-the-flag overworld claiming.
   - Defend your claimed watchtowers from rival faction reprisal raids that launch active overworld siege battlegrounds with real-time countdown clocks.
   - Track active battles at a glance through the dedicated "📡 WATCHTOWER SIEGES" HUD sidebar showing timers, coordinates, and faction combatant ratios.
19. **Custom Structure Carving & Legend-Mapped Blueprint Designer (v3.9.2)**:
   - Instantiate customizable structural layout templates (Spawn Shelters, Arenas, Groves, Portals, and Watchtowers) that can be carved onto overworld coordinates with boundary validation checks.
   - Experience a smart Blueprint Designer (`handleLoadPresetToDesigner` in `GodPanelOverlay.tsx`) that reads custom `legend` maps from presets. It dynamically translates non-standard characters from blueprints (like `W`, `S`, `K`, `F`, `X`, `+` in Watchtowers) to standard, editable designer tiles prior to grid loading, resolving loading limitations.
   - Save, modify, and live rebuild active overworld structures or settlements via the custom layout JSON input field inside the Sovereign God Panel.
20. **Wilderness Traveling NPCs & Crime Witness System (v3.9.3)**:
   - **Wilderness Traveling NPCs**: Organically spawns specialized travelers (Wilderness Hunters `🏹`, Wilderness Herbalists `🌿`, and Traveling Pilgrims `🚶`) in non-town, non-castle wilderness overworld chunks.
   - **Interactive Dialog & Commerce**: Engage in role-appropriate trade or receive valuable gameplay/lore tips from traveling NPCs via fully functional custom shop interfaces.
   - **Proximity Crime Witness Detection**: Evaluates surrounding tile visibility when initiating an attack on a traveler. Assaults committed with nearby witnesses cause your town reputation to drop by -35, whereas silent attacks in total isolation preserve your reputation perfectly!
   - **Combat Transformation**: Assaulted traveling NPCs immediately transition into active, aggressive enemies (ranged Hunters, melee Herbalists and Pilgrims) on the overworld canvas.
21. **Roaming Outlaw Camps & Bored GM Interventions (v3.9.4)**:
   - **Dynamic Bandit Camps**: Spawns a small camp of 2-3 Outlaw Bandits around a newly lit wood campfire on walkable tiles nearby.
   - **Elite Camp Adversaries**: Features an elite **Outlaw Bandit Leader** (85 HP) and auxiliary **Exile Camp Bandits** (55 HP) in aggressive, immediate chasing AI states to engage the player.
   - **In-Character Storyteller Announcements**: Features a dynamic lore monologue narrated in the adventure log describing crackling wood and rowdy laughter nearby, complete with cardinal direction tags and floating compass popups.
22. **Quest-Giver Assaults & Responsive Multi-Viewport HUD (v3.9.5)**:
   - **Interactive Quest-Giver Assaults**: Players interacting with traveling NPCs can choose to reject, betray, and directly assault them in the dialog overlay. Doing so immediately fails any associated quest (with custom log messages), registers the failure, and spawns them as a hostile combatant on the map.
   - **Fluid Multi-Viewport Responsiveness**: Re-engineered the UI layout structures to fully support desktop, resized windows, and mobile viewports (widths < 1024px) seamlessly.
   - **Compact Mobile HUD**: Implemented a comprehensive HUD bar directly above the game canvas in mobile viewports, rendering status gauges for Vitals HP, Focus MP, Gold wealth, and Level/XP progress.
   - **Mobile Environment Sub-HUD**: Added an elegant detail bar showing active coordinates, current biome or floor level, town reputation, game clock time, and dynamic Moon Phases with tooltip support.
23. **Scars of the Defeated & Effective Stats System (v3.9.7)**:
   - **Battle Injuries & Dynamic Scar Acquisition**: Suffered high-damage blows (dealing $\ge 12$ HP) or falling below 35% health triggers potential permanent battle scars (`evaluateScarAcquisition`) from 24 unique templates.
   - **Fresh vs. Healed Healing Cycle**: Scars start as **Fresh (Healing)** for exactly **25 turns**, applying tender/inflamed debuffs to attributes. After mending, they become **Healed (Old)**, providing permanent hardened stat bonuses.
   - **Dynamic Effective Stats Calculation**: Prevents permanent stat decay or glitches by computing effective attributes (`getEffectiveStats`) on-the-fly for player combat stats, inventory carrying capacity (weight changes based on physical condition), and character sheet displays.
   - **God Panel Sandbox Controls**: Allows immediate manual injection of any battle scars to test active effects and character overlays under the Creator Lab tab.
24. **The Over-Forging Risk/Reward Gauge & Bellows System (v3.9.12)**:
   - **Interactive Heat Control**: Pump or adjust bellows heat level (0% to 100%) prior to crafting, mutating, or upgrading weapons and armor.
   - **Stat Scaling & Divine Titles**: Scale equipment stats up to **2.25x** (+125% power bonus) and unlock "God-Forged" divine item titles.
   - **Anvil Shatter & Heat Recoil**: High heat introduces item shatter risks (up to 65%) yielding scrap metal and heat recoil damage on the player's health.
25. **Modular Engine Architecture & Item Discard Gump Modal (v3.9.13)**:
   - **Modularized Over-Forging Component**: Extracted `OverforgeGauge.tsx` for clean decoupling and easy reuse across workbench interfaces.
   - **Interactive Discard & Drop Gump**: Retro fantasy-styled modal for discarding or dropping items on the ground with stack quantity sliders and physical loot spawns.
   - **Stackable Spell Scrolls**: Ensured all scroll items (Recall, Fireball, Teleport, etc.) merge into inventory stacks with quantity tracking.
26. **Unstable Mutation "Synergy Chains" (v3.9.14)**:
   - **Modular Synergy Engine**: Combining multiple elemental catalysts unlocks dual-element traits like *Thermal Shock*, *Plasma Arc*, *Hellfire Singularity*, and *Corrosive Blight*.
   - **Chain Tiers & Strain Gauge**: Multi-stage mutation chains unlock Supercritical (+25%) and Omega (+50%) power surges with live Mutagenic Strain Gauges.
27. **Portable Blacksmith Anvil & Field Station Adjacency (v3.9.15)**:
   - **Deployable Field Anvils**: Craftable Anvil structure (`⚒️`) in the Survival tab allowing gear forging, mutations, and upgrades anywhere in the wild.
   - **Adjacency Checks**: Enforces nearby Anvil or Town proximity for crafting, with warning notices when far from a workbench.
28. **Phase 4 Performance, Rendering & Admin Editor Safety (v4.0.0)**:
   - **Spatial Hashing & Memoized FOV**: Bounded and memoized spatial visibility raycasting in `ai.ts`, eliminating unnecessary turns computations.
   - **Component Render Isolation (`React.memo`)**: Wrapped overlays, HUDs, and canvas views in `React.memo` to eliminate cascading re-renders.
   - **Admin Editor & Guard Safety Patch**: Fixed Admin Editor scar database fallback to prevent uncaught `TypeError` crashes and guarded array safe-navigation checks across pathfinding loops.
29. **Autonomous GM, Replay Sim Dock, Chaos Natural Decay & Combat Rest Guard (v4.0.1)**:
   - **Autonomous GM Active by Default**: Defaulted the Autonomous GM Storyteller to active mode with gift interventions enabled.
   - **Minimizable Replay Simulator Dock**: Added a `Minimize` button and bottom floating HUD for watching gameplay on the canvas while scrubbing or playing log replays.
   - **Peaceful Chaos Natural Decay**: Chaos/Boredom automatically decays toward the 20% baseline during peaceful turns.
   - **Campfire Combat Rest Restriction**: Blocked resting at campfires while hostile monsters are within 8 tiles.
30. **Engine Performance Pass, 2D Canvas Minimap & Context State Optimization (v4.0.2)**:
   - **Chunk Minimap Canvas Migration**: Converted the 441-node React grid in `ChunkMinimap.tsx` to a single high-performance 2D Canvas element.
   - **Raycasting Distance Math**: Replaced floating-point square root calculations in `ai.ts` FOV routines with fast squared distance comparisons.
   - **Canvas Context & Font Optimization**: Streamlined canvas context state handling in `GameCanvas.tsx`, avoiding per-tile `save()`/`restore()` calls and font parsing overhead.
31. **Landing Page Tactical Primer Update (v4.0.3)**:
   - **Tactical Primer Copy Refinement**: Updated movement controls in `App.tsx` to explicitly indicate WASD or Numpad, and added trap avoidance guidance to the Tactical Primer card.
32. **Architectural Deconstruction, Custom Hooks & Engine Refactoring (v4.0.4)**:
   - **Modular Custom Engine Hooks (`src/hooks/`)**: Modularized monolithic game loops into `useEnemyAI.ts` (pathfinding, AI solvers, faction chase), `useCombatEngine.ts` (attack math, scars, recoil, durability), `usePlayerMovement.ts` (movement, terrain traps, stamina), `useKeyboardInput.ts` (WASD/Numpad controls, hotkey toggles), and `useSaveLoad.ts` (LocalStorage auto-save, JSON import/export).
   - **World Generators Isolation (`src/world/`)**: Isolated procedural generators into `src/world/dungeonGen.ts` and `src/world/overworldGen.ts`.
   - **Raycasting Memoization & Render Isolation**: Memoized line-of-sight raycasting (`computeFOV`, `bresenhamLine`) with spatial bounding-box hashing in `ai.ts`, and isolated HUD components with `React.memo`.
33. **Phase 11 Data Centralization, Equipment Hooks & Durability Null Safety Patch (v4.0.5)**:
   - **Centralized Balance Constants (`src/data/balance.ts`)**: Externalized XP leveling formulas, damage mitigation curves, critical strike multipliers, and overforge limits.
   - **Centralized Settlement Economy (`src/data/economy.json`)**: Externalized reputation discounts, charisma scaling, caravan payouts, and regional biome pricing tables.
   - **Centralized Dialogue Trees (`src/data/dialogues.json`)**: Externalized NPC shop dialogues, tavern rumors, and quest objective matrices.
   - **Equipment Management Hook (`src/hooks/useEquipmentHandlers.ts`)**: Decoupled equipment paperdoll actions and durability tracking into a custom hook with safe default fallbacks (`Forged Alloy` material and `Physical` catalyst) preventing equipment crashes.
34. **Phase 17-21 Systems, Spatial Audio Engine & HUD Mute Button (v4.3.5)**:
   - **Procedural WebAudio Synthesizer**: Spatial attenuation with $(1 - \text{dist}/\text{maxDist})^{1.5}$ decay, stereo panning, dynamic biome/weather soundscapes, companion cross-chunk tethering, and instant 1-click **`🔊 Mute` / `🔇 Muted`** HUD toggle button.
35. **Realistic Indoor Building Acoustic Soundscape & Acoustic Attenuation (v4.3.6)**:
   - **Building Interior Acoustic Engine (`src/utils/buildingAudio.ts`)**: Automatically detects houses, taverns, shops, keeps, watchtowers, 2nd floors, and subterranean levels.
   - **Lowpass Atmospheric Weather Muffling**: Applies ~650Hz acoustic lowpass filtering inside buildings so outdoor wind, rain, and blizzards sound muffled behind wooden walls and stone roofs.
   - **Indoor Accents & Door/Step SFX**: Plays synthesized hearth crackles (`fire_crackle`), timber creaks (`wood_creak`), lute strums (`lute_pluck`), pendulum clocks (`clock_tick`), door creaks (`door_open`, `door_close`), and surface-aware footsteps (`wood_footstep`, `stone_footstep`, `grass_step`).
36. **Deconstructed Codebase Architecture & Data Isolation (v4.5.0)**:
   - **JSON Preset Isolation**: Extracted structure blueprints (`structures.json`), town templates (`townTemplates.json`), and enemy blueprints (`enemyBlueprints.json`) into `/src/data/`.
   - **God Panel Overlay Deconstruction**: Extracted modular tools into `/src/components/god/` (`GodEnemyBlueprintEditor`, `GodReplaySimulator`, `GodCheatsTab`, `GodAdminEditor`).
   - **App Layout Shell Modularization**: Extracted header and navigation bar into `AppHeaderBar.tsx` and `AppNavigationTabs.tsx`.
37. **Tile-Based Spritesheet Atlas & Animation Engine Architecture (v4.6.0)**:
   - **Tileset Atlas Manager (`TilesetAtlasManager.ts`)**: Supports 16-variant 4-neighbor cardinal autotiling bitmask rules (North=1, East=2, South=4, West=8) for walls, paths, and biomes.
   - **Multi-Frame Sprite State Machine (`spriteAnimationManager.ts`)**: Controls 4-directional sprite states (`idle`, `walk`, `attack`, `hurt`, `cast`, `death`) for player and monsters.
   - **Visual FX Particle System (`visualFxParticleSystem.ts`)**: Emitters render dynamic spell bursts, magic circles, campfire embers, and atmospheric particles into the 60 FPS HTML5 Canvas loop.
38. **Dynamic Sun & Moon Directional Drop Shadows (v6.2.0)**:
   - **24h Solar Vector Projection (`shadowRenderer.ts`)**: Casts soft translucent directional drop shadows beneath trees (`🌲`, `🌳`, `▲`), rock walls/veins, structure gates/signs, as well as living entities (Player, NPCs, Enemies, Bosses).
   - **Real-Time Astronomical Calculations**: Shadows smoothly rotate and elongate based on the in-game 24h clock, shifting from morning west shadows to evening east shadows and cool slate moonlight shadows at night.
39. **Kinetic Water Ripples, Rain Footstep Splashes & Ambient Particles (v6.2.0)**:
   - **Expanding Water Ripples**: Steps onto water (`🌊`), streams, or swamp bogs (`🐊`) trigger expanding concentric ring animations.
   - **Rain Footstep Splashes**: Movement across outdoor tiles during rainy or stormy weather produces temporary water droplet splash particles.
   - **Ambient Particles & Dust Devils**: Forest, Tundra, and Swamp biomes generate ambient floating leaves, cherry blossoms, and bio-luminescent spores, while Deserts spawn animated spinning dust devil vortexes.
40. **Directional Outward Drift & Combat Floating Physics (v6.9.0)**:
   - **Kinetic Impact Momentum Vectors (`combatFloaterDrift.ts`)**: Floating damage, heals, and crits calculate directional impact trajectories between attacker and defender, arcing outward outside entity sprites and health bars.
   - **High-Contrast Text Outlines**: Dark outline rings ensure crystal-clear combat legibility across all terrains, biomes, and lighting conditions.
41. **Player Attack & Combat Logic Decoupling (v6.9.2)**:
   - **Modular Attack Hook (`usePlayerAttack.ts`)**: Decoupled player melee/ranged attack resolution, weapon durability wear, directional floater physics, and companion assistance intercepts into a standalone hook.
   - **Monolith Decomposition**: Deconstructed `App.tsx` orchestrator, eliminating dead functions and pruning 75+ unused imports.
42. **Enemy AI Behavioral Archetypes & Tactical Kiting (v7.8.0)**:
   - **Tactical Skirmisher Kiting**: Ranged archers and spellcasters (`SkeletonMage`, `Trapmaster`, `FrostbiteSpider`) detect close melee threats and dynamically kite backward to re-establish optimal firing lines.
   - **Support Healers & Buffers**: Medics and shamans scan for wounded allies to cast restorative healing spells (+25% HP) and bestow offensive/defensive combat buffs upon boss/elite companions.
43. **Async Background Chunk Streaming & Non-Blocking Pre-generation (v7.8.0)**:
   - **Time-Sliced Batching (`asyncChunkBatcher.ts`)**: Utilizes `requestIdleCallback` (8ms budget per frame) to compute adjacent sector rings asynchronously without frame stutters.
   - **Cartography Integration**: Deep-zoom world map rasterization and turn movements query the cache to eliminate generation latency.
44. **Arcane Scriptorium: Glyph Rune Tracing & Masterwork Spell Scrolls (v7.9.0)**:
   - **Vector Slate Glyph Inscription**: Inscribe enchanted parchment with elemental catalysts through an interactive Leyline Glyph Tracing minigame with mouse/touch dragging and keyboard (0-9) node chaining.
   - **Arcane Instability Gauge**: Manage real-time arcane instability buildup and sequence errors to prevent chaotic fizzle backlashes.
   - **Masterwork Spell Scrolls**: Achieving high accuracy (≥90% score, 0 mistakes) creates **Masterwork Spell Scrolls** featuring **0 MP Cast Cost**, **+30% Spell Damage Potency**, and **+15% Critical Strike Chance** in combat.
45. **Dual Instinct Classic Tileset System & 16×16 Coordinate Alignment (v8.2.0)**:
   - **Dual Authoritative Sources**: Choose between **Instinct Classic (PNG Mockups)** loaded from `/public/tilesets/` or **Instinct Classic (Procedural Code)** generated live in memory.
   - **Seamless Hot-Swapping**: Switch anytime in **Tileset Studio** (`F1` -> Tileset Studio tab) with `localStorage` persistence.
   - **Full 16×16 Grid Synchronization**: Aligned all coordinate mappings across terrain, doors, chests, shrines, traps, and hazard pools.
46. **Merchant Caravan Escort & Tactical Skirmish Sub-Engine (v8.2.0)**:
   - **24×18 Tactical Battlefield**: Road encounters spawn a specialized combat arena featuring a covered wagon (`🛒`), guard campfire, and 2 allied veteran defenders.
   - **Lossless Overworld Recovery**: Captures an immutable `SavedOverworldSkirmishState` snapshot prior to battle, restoring the overworld chunk seamlessly upon victory or retreat with zero state loss.
   - **Dynamic Wagon Integrity Rewards**: Preserving wagon hull integrity awards bonus gold, renown, and rare elemental catalysts at your trade destination.

---

## 📜 How the Arcane Scriptorium Works

The **Arcane Scriptorium** is a dedicated arcane workstation and interactive minigame allowing mages, rogues, and warriors to craft potent single-use **Spell Scrolls** (such as *Fireball*, *Frost Nova*, *Lightning Chain*, *Void Rift*, *Sacred Radiance*, and *Recall*).

### 1. Inscription Methods
When accessing the Scriptorium station in the Crafting menu, each scroll recipe provides two crafting paths:
- **Instant Scribe**: Consumes Enchanted Parchment (or Leather) and Elemental Catalysts to immediately generate a standard spell scroll.
- **Trace Leyline Glyph (Masterwork Minigame)**: Launches the interactive vector glyph slate. Flawless execution inscribes a **Masterwork Spell Scroll** with enhanced properties.

### 2. Minigame Mechanics & Advanced Arcane Hazards
- **Geometric & Orbital Node Drift**: The arcane slate displays elemental runic nodes (0–9) placed in geometric formations (pentagrams, triangles, hexagonal sigils). On Adept and Archmage tiers, runic nodes undergo continuous orbital drifting ($\sin/\cos$ harmonic trajectories), requiring precision timing as nodes shift dynamically across the slate.
- **Node Chaining**: Connect the nodes in the target sequence displayed at the bottom of the slate (e.g., `0 → 2 → 5 → 7 → 9`):
  - **Mouse / Touch**: Click or touch and drag glowing leyline conduit beams through the nodes in sequential order.
  - **Keyboard**: Press the number keys `0`–`9` corresponding to the next node in the sequence.
  - **Hotkey `R`**: Resets the current stroke if a mistake is made.
  - **Hotkey `Esc`**: Safely closes the slate.
- **Arcane Instability & Overheat**: As time elapses, instability ticks upward. Incorrect node connections incur a +15% instability penalty, screen shake, and sonic disruption. Reaching 100% instability causes a **Glyph Backlash**, dissolving the parchment into ash.
- **Dynamic Arcane Surges**: Exceeding 50% and 75% instability triggers volatile elemental surges (e.g., *Solar Flare Overdrive*, *Cryo-Lock Frostbite*, *Void Collapse Gravitational Pull*, *Static Discharge Spikes*), accelerating instability decay and distorting node vectors. Connecting nodes through surges grants bonus Arcane Mastery score.
- **Harmonic Tempo & Rhythm Cadence**: Connecting nodes within the optimal harmonic window (250ms–1100ms interval) triggers "PERFECT!" and "TEMPO RUSH!" resonance feedback, reducing instability by -3.5% and accelerating stroke chaining.
- **Multi-Matrix Chaining**: Advanced spells on Adept and Archmage tiers require chaining 2 or 3 successive rune matrices in succession to seal the enchantment.
- **Synthesized Harmonic Resonance**: Every connected node generates an ascending WebAudio sine wave tone. Sealing the entire matrix triggers a resonant flash and fanfare.

### 3. Masterwork Outcomes & Combat Benefits
| Outcome | Performance Metric | Resulting Item Quality & Stat Bonuses |
| :--- | :--- | :--- |
| **🌟 Masterwork (Flawless)** | Score ≥ 90%, 0 mistakes, Peak Instability < 38% | **Masterwork Spell Scroll** (`0 MP Cost`, `+30% Spell Damage`, `+15% Crit Chance`, `300 Gold Value`) |
| **📜 Standard (Stable)** | Score 60% – 89%, Peak Instability < 100% | **Standard Spell Scroll** (Standard MP cost, base damage, `150 Gold Value`) |
| **💥 Fizzle / Backlash** | 100% Instability / Failed | Parchment destroyed in ethereal smoke |

### 4. Testing in the Dev / God Panel
- Open the **God Mode / Dev Panel** → **Minigames Tab** (`GodMinigamesTab`).
- Select any spell scroll template from the dropdown (Fireball, Frost Nova, Void Rift, etc.).
- Click **`+10 Inks 📜`** to grant all necessary reagents (parchment, leather, catalysts).
- Click **`Launch Scriptorium Test`** to run and test the minigame with customizable difficulty tiers and instant sandbox verification.

---

## 🛠️ Modular Data Configuration

Abyss Rogue is engineered with a fully decouplable model, separating architectural graphics and layouts from hardcoded structures so that adding content or balancing rules is trivial.

### 1. Dynamic Buildings & Town Templates (`/src/data/townTemplates.json` & `/src/data/structures.json`)
Town structures, building interiors, and blueprints are loaded and built dynamically. Coordinates can use absolute grid locations or flexible expressions evaluated against overworld chunk sizes (`width` and `height`):

```json
[
  {
    "id": "tiny_shelter",
    "name": "Cozy Spawn Shelter",
    "description": "A 5x5 brick building equipped with a wooden door, solid wall boundaries, wooden floors, a comfortable sleeping Bed, and a table & chair set.",
    "emoji": "🏠",
    "width": 5,
    "height": 5,
    "grid": [
      "#####",
      "#B.T#",
      "#..C#",
      "#...#",
      "##D##"
    ],
    "legend": {
      "#": "Wall",
      ".": "Floor",
      "B": "Bed",
      "C": "Chair",
      "T": "Table",
      "D": "Door"
    }
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
- **`spells.ts` / `spellScrolls.json`**: Encapsulates player magical spell configurations (Arcane Bolt, Pyroblast, Frostbite Lance, Storm Strike, Poison Dart, Shadow Orb) and scroll scriptorium catalysts.
- **`shops.json` / `shopData.ts`**: Manages rotating inventories, buy/sell price multipliers, and special items stocked by Blacksmiths, Town General Merchants, Taverns, and Wandering Seppo.
- **`fleeQuotes.json`**: Handles procedural comedic panic quotes whispered or yelled by fleeing wildlife, coward goblins, rattling skeletons, or heavy orc brutes.
- **`tradeEconomy.ts` / `caravan.ts`**: Controls active Caravan merchant schedules, escort caravan path tracking, and geographical territory alignment structures.

---

## 🚀 Adding Custom Content

### How to Add Combat & Flee Flavor Text
1. Open `/src/data/combatFlavors.json`.
2. Locate the weapon type you want to expand (e.g., `"Sword"` or `"Bow"`).
3. Append your high-stakes descriptive sentences to the `normal` (regular strikes) or `crit` (critical strikes) array.
4. **Placeholder Substitution**: Ensure you use the `{name}` placeholder where the target's name fits. It will be replaced automatically at runtime! Examples:
   ```json
   "Your sword shears clean through the shield strap, leaving {name} staggered!"
   ```

### How to Add a New Town Building or Structure Preset
1. Open `/src/data/structures.json` or `/src/data/townTemplates.json`.
2. Append a new object specifying the building's dimensional constraints:
   ```json
   {
     "id": "grand_library",
     "name": "Grand Library of Sages",
     "description": "An imposing stone repository of ancient scrolls with carved lecterns and reading tables.",
     "emoji": "📚",
     "width": 6,
     "height": 6,
     "grid": [
       "######",
       "#B..B#",
       "#.TT.#",
       "#.CC.#",
       "#....#",
       "##DD##"
     ],
     "legend": {
       "#": "Wall",
       ".": "Floor",
       "B": "Bookshelf",
       "T": "Table",
       "C": "Chair",
       "D": "Door"
     }
   }
   ```
3. Save the file. The overworld and structure generator will build this structure automatically with doors, walls, and interactable furniture!

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

### How to Add a New Procedural Sound Effect
The audio engine uses pure **WebAudio procedural synthesis** (`src/utils/audio.ts`). No audio assets are required!
1. Add your sound key to the `playSound` type in `src/utils/audio.ts`.
2. Add a `switch (type)` case using oscillator/noise nodes and gain envelopes:
   ```typescript
   case 'chest_open': {
     const osc = ctx.createOscillator();
     osc.type = 'sawtooth';
     osc.frequency.setValueAtTime(140 * pitch, now);
     osc.frequency.linearRampToValueAtTime(280 * pitch, now + 0.18);
     // ...
     break;
   }
   ```
3. Call `playSound('chest_open', { x, y, playerX, playerY })` anywhere in the codebase for spatial attenuation and stereo panning!
4. For full documentation, node routing diagrams, and the full catalog of sounds, read [`AUDIO.md`](/AUDIO.md).

### 🛠️ Developer & Game Master Toolkits (In-Game Console)
The game includes comprehensive built-in developer instruments designed for live-session playtesting:
- **GOD Command Module Overlay (`🛡️`)**: Toggle absolute damage invulnerability, instantly grant +99 of all crafting alloys and alchemical catalysts, skip player levels, or spawn custom named companions.
- **In-Game Data Catalog Live Tuner (`🎛️`)**: Modify base weapon damages, crit rates, durability, bestiary monster HP/ATK/DEF, spell mana costs, and global balance multipliers in real time with instant combat effect and JSON balance patch export/import.
- **GM Storyteller Dashboard (`🌀`)**: Manually override weather and solar cycles, trigger specific encounters, and inspect live GM AI "thoughts" and behavioral variables (Boredom, Tension, Mood).

### 🧪 Quality Assurance: Client-Side Virtual Smoke Test Runner (v2.9.6) (DONE)
To ensure seamless updates and zero-regression reliability, we have implemented an automated, in-browser **Virtual Playthrough Runner** directly accessible from the "Smoke Test" tab in the Sovereign God Panel Overlay. It executes end-to-end loops including:
1. **Movement & Scrolling**: Walks through cardinal chunks to trigger procedural terrain redraws and coordinates alignment.
2. **Harvesting & Crafting**: Attacks logging nodes, collects lumber, buys and pitches campfires, and tests the adjacent Exhaustion-purge resting cycle.
3. **Social & Tavern Minigames**: Tosses coin flips with patrons, buys ale, and confirms the active Drunken Cheer critical buff.
4. **Companion Dispatch**: Assigns followers to active guild expeditions, progresses turns, and claims high-tier rewards.
5. **AI Combat Tests**: Spawns hostiles, verifies line-of-sight chase targeting, combat damage logging, blood splatters, and floating indicators.
6. **Dungeon Traps & Lockpicking**: Descends to floor depths, disarms trap-plates, crafts Tension Lockpicks, and cracks open locked Ancient Chests successfully.

---

### 🔍 Codebase Health & Import Audit Runner (`npm run audit`)

Maintain codebase health with our automated import and catalog scanner:
```bash
# Run codebase import integrity check + TypeScript linter + Vitest suite
npm run audit
```
This checks all 467 source files and 31 JSON data catalogs for broken relative imports, validates TypeScript types (`tsc --noEmit`), and executes all 66 Vitest test suites (**413/413 tests passing 100% green**).

---

## 🚀 GitHub Launch & GitHub Pages Deployment

Abyss Rogue is configured for out-of-the-box deployment to **GitHub Pages** using automated GitHub Actions CI/CD.

### Features Configured for GitHub Launch:
- **Resilient CI/CD Workflow (`.github/workflows/deploy.yml`)**: Automatically validates JSON catalogs, tests imports, runs the full test suite, builds the production bundle, and deploys to GitHub Pages on every push to `main` or `master`. Features an automated lockfile fallback (`npm ci || npm install`) ensuring seamless execution regardless of platform differences.
- **Dedicated Lockfile (`package-lock.json`)**: Version-pinned lockfile committed in repository root for fast, deterministic, reproducible builds.
- **Subpath & Custom Domain Compatibility**: Configured `base: './'` in `vite.config.ts` and relative paths in `public/manifest.json` and `index.html` so the game runs on `https://<username>.github.io/<repo>/` or any custom domain.
- **SPA Fallback Routing (`public/404.html`)**: Prevents 404 errors on deep links or manual refreshes by redirecting back to the root application.
- **Jekyll Disabled (`public/.nojekyll`)**: Bypasses GitHub Jekyll processing so all Vite asset files and underscored directories load smoothly.
- **Open Source License (`LICENSE`)**: Standard MIT License included for distribution.

### Quick Deployment Checklist:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Abyss Rogue v8.8.2 release"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git push -u origin main
   ```
2. **Enable GitHub Pages**:
   - In your GitHub repository, open **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, switch to **GitHub Actions**.
3. **Monitor Live Deployment**:
   - Open the **Actions** tab on GitHub to monitor the workflow execution.
   - Once the action finishes, your game is live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/`!



