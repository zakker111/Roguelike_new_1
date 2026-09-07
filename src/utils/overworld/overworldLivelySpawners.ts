import { TileType, NPC, Enemy, Trap, Chest, WatchtowerState, EnemyType, EnemyState, TrapType } from "../../types";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from "../itemsData";
import { getEnemyTemplate } from "../dungeon";
import { POI_BLUEPRINTS, getPOIBlueprint } from "../../data/worldHistory";
import { applyCombatArchetypeAndChaosScaling } from "../combatArchetypes";
import {
  prng,
  findNearestSafeNpcTile,
} from "./overworldCore";
import {
  generateWatchtowerPOI,
  generateRuinsPOI,
  generatePointsOfInterest,
} from "../../world/poiGenerators";
import { ensureEntranceClearance, connectPoiSpokeToTrail } from "../../world/organic";
import { OverworldGenContext } from "./types";

export function spawnLivelyOverworldEntities(ctx: OverworldGenContext): void {
  const {
    chunkX,
    chunkY,
    width,
    height,
    hasTown,
    biome,
    map,
    npcs,
    enemies,
    chests,
    traps,
    dungeons,
    poisList,
  } = ctx;

  let watchtower: WatchtowerState | undefined = ctx.watchtower;
  let secondFloorMap: TileType[][] | undefined = ctx.secondFloorMap;
  let secondFloorDiscovered: boolean[][] | undefined = ctx.secondFloorDiscovered;
  let secondFloorVisible: boolean[][] | undefined = ctx.secondFloorVisible;

  // --- LIVELY OVERWORLD: WILD CAMPS & CARAVAN AMBUSH PROCEDURAL SPAWNER ---
  let isCampPlaced = false;
  let isCaravanPlaced = false;

  const distFromOrigin = Math.hypot(chunkX, chunkY);

  if (!hasTown && distFromOrigin > 1.5) {
    const campAndCaravanSeed = prng(chunkX * 19, chunkY * 31, 5543);
    
    if (campAndCaravanSeed < 0.28) {
      // 28% chance of a Hostile Wild Camp
      const campTypeRoll = prng(chunkX * 2, chunkY * 5, 122);
      let campType: 'outlaw' | 'goblin' | 'syndicate' | 'vanguard' = 'outlaw';
      if (campTypeRoll < 0.30) {
        campType = 'outlaw';
      } else if (campTypeRoll < 0.60) {
        campType = 'goblin';
      } else if (campTypeRoll < 0.80) {
        campType = 'syndicate';
      } else {
        campType = 'vanguard';
      }
      
      // Try to find a flat grass area away from borders
      let campX = -1;
      let campY = -1;
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 10 + Math.floor(prng(chunkX * 13, chunkY * 17, attempts + 10) * (width - 20));
        const ry = 6 + Math.floor(prng(chunkX * 19, chunkY * 11, attempts + 11) * (height - 12));
        
        if (map[ry]?.[rx] === TileType.Grass) {
          let isSafe = true;
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const tile = map[ry + dy]?.[rx + dx];
              if (tile && tile !== TileType.Grass && tile !== TileType.Tree && tile !== TileType.PineTree && tile !== TileType.BirchTree) {
                isSafe = false;
              }
            }
          }
          if (isSafe) {
            campX = rx;
            campY = ry;
            break;
          }
        }
      }

      if (campX !== -1) {
        isCampPlaced = true;
        // Build the Camp:
        // Center has a campfire
        map[campY][campX] = TileType.Campfire;
        
        // Stools/chairs around the campfire
        if (map[campY + 1]?.[campX] === TileType.Grass) map[campY + 1][campX] = TileType.Chair;
        if (map[campY - 1]?.[campX] === TileType.Grass) map[campY - 1][campX] = TileType.Chair;
        
        // Barricades / Tents flanking the campfire
        if (map[campY]?.[campX - 1] === TileType.Grass) map[campY][campX - 1] = TileType.Wall;
        if (map[campY]?.[campX + 1] === TileType.Grass) map[campY][campX + 1] = TileType.Wall;
        if (map[campY - 2]?.[campX - 1] === TileType.Grass) map[campY - 2][campX - 1] = TileType.Wall;
        if (map[campY - 2]?.[campX + 1] === TileType.Grass) map[campY - 2][campX + 1] = TileType.Wall;
        
        // Add torches for lighting
        if (map[campY + 1]?.[campX - 2] === TileType.Grass) map[campY + 1][campX - 2] = TileType.Torch;
        if (map[campY + 1]?.[campX + 2] === TileType.Grass) map[campY + 1][campX + 2] = TileType.Torch;

        // Faction-specific additions
        if (campType === 'vanguard') {
          // Dawn Vanguard Holy Shrine
          if (map[campY + 2]?.[campX] === TileType.Grass) {
            map[campY + 2][campX] = TileType.Sign;
          }
          // Spawn Vanguard Crusade Captain NPC
          npcs.push({
            id: `npc_vanguard_${chunkX}_${chunkY}`,
            name: 'Captain Valerius (Vanguard Captain)',
            role: 'faction_vanguard',
            char: 'V',
            color: '#fbbf24',
            x: campX + 1,
            y: campY + 1,
            homeX: campX + 1,
            homeY: campY + 1,
            workX: campX + 1,
            workY: campY + 1,
            scheduleState: 'work',
            dialogue: [
              'Praise the morning sun! The Vanguard Crusade maintains this holy sanctuary.',
              'Our garrison defends the outer borders. Tread lightly and respect our golden vaults.',
              'Donate to our crusade or pray at our Holy Shrine for an active healing blessing.'
            ]
          });
        } else if (campType === 'syndicate') {
          // Spawn Syndicate Smuggler NPC
          npcs.push({
            id: `npc_syndicate_${chunkX}_${chunkY}`,
            name: 'Sly Silas (Syndicate Smuggler)',
            role: 'faction_syndicate',
            char: 'y',
            color: '#a78bfa',
            x: campX - 1,
            y: campY + 1,
            homeX: campX - 1,
            homeY: campY + 1,
            workX: campX - 1,
            workY: campY + 1,
            scheduleState: 'work',
            dialogue: [
              'Greetings, shadow-walker. Silas sells choice lockpicks and shadow crystals, for a fee...',
              'The Syndicate values discretion. Do not touch our vaults and we will remain friendly.',
              'Need to secure some shadow materials? You can always slip me a bribe to rise in the ranks.'
            ]
          });
        }

        // Place a high-tier Loot Chest inside the tent area
        const chestId = campType === 'syndicate' 
          ? `syndicate_chest_${chunkX}_${chunkY}` 
          : campType === 'vanguard' 
            ? `vanguard_chest_${chunkX}_${chunkY}` 
            : `camp_chest_${chunkX}_${chunkY}`;

        chests.push({
          id: chestId,
          x: campX,
          y: campY - 2,
          isOpened: false,
          materials: campType === 'outlaw' 
            ? ['mat_mithril', 'mat_obsidian'] 
            : campType === 'syndicate'
              ? ['mat_thick_hide', 'mat_obsidian']
              : campType === 'vanguard'
                ? ['mat_iron', 'mat_mithril']
                : ['mat_iron', 'mat_mithril', 'mat_feybone'],
          catalysts: campType === 'outlaw' 
            ? ['cat_fire', 'cat_shadow'] 
            : campType === 'syndicate'
              ? ['cat_shadow', 'cat_poison']
              : campType === 'vanguard'
                ? ['cat_fire', 'cat_lightning']
                : ['cat_poison', 'cat_lightning'],
          gold: campType === 'outlaw' ? 120 : campType === 'syndicate' ? 150 : campType === 'vanguard' ? 140 : 100
        });

        // Spawn Hostile guards
        let guardNames = ['Outlaw Brigand', 'Outlaw Marksman', 'Outlaw Desperado'];
        let chars = ['O', 'M', 'D'];
        let colors = ['#f43f5e', '#fb7185', '#ec4899'];
        let enemyTypeStr: any = EnemyType.OrcBrute;

        if (campType === 'goblin') {
          guardNames = ['Goblin Raider', 'Goblin Archer', 'Goblin Pyromaniac'];
          chars = ['g', 'a', 'p'];
          colors = ['#22c55e', '#4ade80', '#10b981'];
          enemyTypeStr = EnemyType.Goblin;
        } else if (campType === 'syndicate') {
          guardNames = ['Syndicate Agent', 'Syndicate Silent Assassin', 'Syndicate Enforcer'];
          chars = ['s', 'a', 'e'];
          colors = ['#a78bfa', '#c084fc', '#8b5cf6'];
          enemyTypeStr = EnemyType.Bandit;
        } else if (campType === 'vanguard') {
          guardNames = ['Vanguard Sentinel', 'Vanguard Marksman', 'Vanguard Crusader'];
          chars = ['S', 'm', 'C'];
          colors = ['#fbbf24', '#f59e0b', '#d97706'];
          enemyTypeStr = EnemyType.OrcBrute;
        }

        // Spawn 3 hostile guards surrounding the camp campfire
        const positions = [
          { dx: -2, dy: -1 },
          { dx: 2, dy: -1 },
          { dx: 0, dy: 2 }
        ];

        positions.forEach((pos, idx) => {
          const gx = campX + pos.dx;
          const gy = campY + pos.dy;
          const guardName = guardNames[idx % guardNames.length];
          const guardChar = chars[idx % chars.length];
          const guardColor = colors[idx % colors.length];

          const isCaptain = idx === 2;
          const tier: 'standard' | 'tough' = isCaptain ? 'tough' : 'standard';

          let gHp = 24;
          let gAtk = 4;
          let gDef = 1;

          if (campType === 'goblin') {
            gHp = isCaptain ? 32 : (idx === 1 ? 16 : 18);
            gAtk = isCaptain ? 5 : 3;
            gDef = isCaptain ? 2 : 1;
          } else if (campType === 'syndicate') {
            gHp = isCaptain ? 44 : (idx === 1 ? 20 : 26);
            gAtk = isCaptain ? 6 : 4;
            gDef = isCaptain ? 3 : 2;
          } else if (campType === 'vanguard') {
            gHp = isCaptain ? 50 : (idx === 1 ? 22 : 28);
            gAtk = isCaptain ? 7 : 5;
            gDef = isCaptain ? 4 : 2;
          }

          const rawGuard: Enemy = {
            id: `camp_guard_${chunkX}_${chunkY}_${idx}`,
            x: gx,
            y: gy,
            type: enemyTypeStr,
            name: `${guardName} [${isCaptain ? 'Tough Camp Captain' : 'Camp Sentry'}]`,
            hp: gHp,
            maxHp: gHp,
            atk: gAtk,
            def: gDef,
            range: idx === 1 ? 4 : 1, // index 1 is Marksman/Archer with range 4!
            speed: 1,
            color: guardColor,
            char: guardChar,
            state: EnemyState.Patrolling,
            difficultyTier: tier,
            isElite: isCaptain, // Desperado/Pyromaniac/Enforcer/Crusader is elite
            eliteEffect: isCaptain ? 'Furious' : undefined,
            patrolPath: [{ x: gx, y: gy }, { x: gx + 1, y: gy }, { x: gx, y: gy + 1 }],
            patrolIndex: 0,
            debuffs: [],
            faction: campType
          };

          const scaledGuard = applyCombatArchetypeAndChaosScaling(
            rawGuard,
            0,
            ctx.playerStats,
            0
          );

          enemies.push(scaledGuard);
        });

        // Clear camp entrance clearance runway & connect road spoke
        ensureEntranceClearance(map, campX, campY + 2, width, height, 'south');
        connectPoiSpokeToTrail(map, campX, campY + 2, width, height, true);
      }
    } else if (campAndCaravanSeed >= 0.28 && campAndCaravanSeed < 0.45) {
      // 17% chance of a Wandering Caravan under active Bandit Ambush
      let caravanX = -1;
      let caravanY = -1;
      
      // Try to find a flat grass area or near paths
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 12 + Math.floor(prng(chunkX * 17, chunkY * 19, attempts + 20) * (width - 24));
        const ry = 8 + Math.floor(prng(chunkX * 23, chunkY * 13, attempts + 21) * (height - 16));
        
        if (map[ry]?.[rx] === TileType.Grass) {
          let isSafe = true;
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const tile = map[ry + dy]?.[rx + dx];
              if (tile && tile !== TileType.Grass && tile !== TileType.Path && tile !== TileType.Tree && tile !== TileType.PineTree && tile !== TileType.BirchTree) {
                isSafe = false;
              }
            }
          }
          if (isSafe) {
            caravanX = rx;
            caravanY = ry;
            break;
          }
        }
      }

      if (caravanX !== -1) {
        isCaravanPlaced = true;
        // Build the active caravan layout:
        // Place a Carriage sign / box
        if (map[caravanY]?.[caravanX] === TileType.Grass) map[caravanY][caravanX] = TileType.Sign;
        if (map[caravanY]?.[caravanX + 1] === TileType.Grass) map[caravanY][caravanX + 1] = TileType.Table;

        // Clear approach and connect caravan to road network
        ensureEntranceClearance(map, caravanX, caravanY + 1, width, height, 'all');
        connectPoiSpokeToTrail(map, caravanX, caravanY + 1, width, height, true);

        // Spawn interactive Baron Tobias NPC as Baron Tobias (Caravan Merchant)
        const safeMerchantPos = findNearestSafeNpcTile(caravanX, caravanY + 1, map);
        npcs.push({
          id: `ambushed_merchant_${chunkX}_${chunkY}`,
          name: 'Baron Tobias (Caravan Merchant)',
          role: 'merchant_caravan_ambushed' as any,
          char: 'C',
          color: '#fbbf24',
          x: safeMerchantPos.x,
          y: safeMerchantPos.y,
          homeX: safeMerchantPos.x,
          homeY: safeMerchantPos.y,
          workX: safeMerchantPos.x,
          workY: safeMerchantPos.y,
          scheduleState: 'work',
          dialogue: [
            "Help! We are being ambushed by bloodthirsty bandits! Defeat them all, and I'll grant you our coveted Rare Trade License!",
            "They came from the forest line... they want our fine alloys! Protect us, brave warrior!",
            "If we survive, my cargo is yours at extreme wholesale prices!"
          ]
        });

        // Spawn allied Caravan Sentries
        enemies.push({
          id: `caravan_ally_${chunkX}_${chunkY}_1`,
          name: 'Caravan defender [Allied]',
          char: '🛡',
          color: '#60a5fa',
          hp: 60,
          maxHp: 60,
          atk: 5,
          def: 3,
          type: EnemyType.OrcBrute,
          x: caravanX - 1,
          y: caravanY,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: caravanX - 1, y: caravanY }],
          patrolIndex: 0,
          debuffs: [],
          isTownGuard: true, // treats player as friend, and other monsters as hostiles
          speed: 1.0,
          range: 1
        });

        // Spawn 3 hostile bandit ambushers attacking them
        const ambushers = [
          { name: 'Bandit Pillager', char: 'B', color: '#f43f5e', dx: -3, dy: -1 },
          { name: 'Bandit Cutthroat', char: 'B', color: '#fb7185', dx: -3, dy: 1 },
          { name: 'Goblin Marauder', char: 'G', color: '#10b981', dx: 3, dy: 0 }
        ];

        ambushers.forEach((bnd, idx) => {
          const bx = caravanX + bnd.dx;
          const by = caravanY + bnd.dy;

          const rawAmbusher: Enemy = {
            id: `caravan_bandit_${chunkX}_${chunkY}_${idx}`,
            x: bx,
            y: by,
            type: bnd.char === 'G' ? EnemyType.Goblin : EnemyType.OrcBrute,
            name: `${bnd.name} [Hostile]`,
            hp: bnd.char === 'G' ? 18 : 24,
            maxHp: bnd.char === 'G' ? 18 : 24,
            atk: 4,
            def: 1,
            range: 1,
            speed: 1,
            color: bnd.color,
            char: bnd.char,
            state: EnemyState.Chasing,
            difficultyTier: 'standard',
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: []
          };

          const scaledAmbusher = applyCombatArchetypeAndChaosScaling(
            rawAmbusher,
            0,
            ctx.playerStats,
            0
          );

          enemies.push(scaledAmbusher);
        });
      }
    } else if (campAndCaravanSeed >= 0.45 && campAndCaravanSeed < 0.60) {
      // 15% chance of a peaceful Traveling Artificer Caravan!
      let caravanX = -1;
      let caravanY = -1;
      
      // Try to find a flat grass area or near paths
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 12 + Math.floor(prng(chunkX * 17, chunkY * 19, attempts + 40) * (width - 24));
        const ry = 8 + Math.floor(prng(chunkX * 23, chunkY * 13, attempts + 41) * (height - 16));
        
        if (map[ry]?.[rx] === TileType.Grass) {
          let isSafe = true;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const tile = map[ry + dy]?.[rx + dx];
              if (tile && tile !== TileType.Grass && tile !== TileType.Path && tile !== TileType.Tree && tile !== TileType.PineTree && tile !== TileType.BirchTree) {
                isSafe = false;
              }
            }
          }
          if (isSafe) {
            caravanX = rx;
            caravanY = ry;
            break;
          }
        }
      }

      if (caravanX !== -1) {
        // Place Carriage sign/table/tent indicators
        if (map[caravanY]?.[caravanX] === TileType.Grass) map[caravanY][caravanX] = TileType.Sign;
        if (map[caravanY]?.[caravanX + 1] === TileType.Grass) map[caravanY][caravanX + 1] = TileType.Table;

        // Customize merchant character, name, color, and dialogue based on biome
        let mChar = '🐎';
        let mColor = '#fbbf24';
        let mName = 'Lord Raymond (Artificer Merchant)';
        let mDialogue = [
          "A fine day for travel on the overworld roads! Would you like to check out my horse-drawn wagon's wares?",
          "I forge heavy Stallion-Sprung Greaves! You can buy enchanted boots from me to cover ground quickly.",
          "Keep an eye out for bandits in the wild! But feel free to browse our fine travelling carriage stock."
        ];

        if (biome === 'desert') {
          mChar = '🐫';
          mColor = '#f59e0b';
          mName = 'Yasmin (Dune Caravaneer)';
          mDialogue = [
            "Peace be upon you, traveler of the sands. My camels carry precious silks, exotic ores, and rare desert spices.",
            "The sun is fierce, but these Dune-Treader Sabatons will protect you from the desert sandstorms and heat fatigue!",
            "Rest here by our tents. Browse our caravans and stock up on dry bread, water, or fresh mountain ales."
          ];
        } else if (biome === 'tundra') {
          mChar = '🐕';
          mColor = '#38bdf8';
          mName = 'Kjell (Frost Sledger)';
          mDialogue = [
            "Hoo! It's freezing! My husky-drawn sled can slide across these glaciers with ease.",
            "I deal in fine furs and robust metals. Care to buy Worg-Spiked gauntlets for combat and wolf taming?",
            "Beware of ice elementals in the caves! If you are cold, grab some fresh warm pie from our stove."
          ];
        } else if (biome === 'swamp') {
          mChar = '🐊';
          mColor = '#10b981';
          mName = 'Gideon (Murky Barger)';
          mDialogue = [
            "Welcome to the bogs, traveler. My crocodile barge slides smoothly over the murky waters.",
            "Watch your step in the quicksand! I sell special thick hides, fish, and poison catalysts.",
            "You can buy Crocodile Bayou Sabatons from me to navigate these bayous at extreme speed and walk on water!"
          ];
        }

        npcs.push({
          id: `caravan_merchant_${chunkX}_${chunkY}`,
          name: mName,
          role: 'merchant_caravan' as any,
          char: mChar,
          color: mColor,
          x: caravanX,
          y: caravanY + 1,
          homeX: caravanX,
          homeY: caravanY + 1,
          workX: caravanX,
          workY: caravanY + 1,
          scheduleState: 'work',
          dialogue: mDialogue
        });
      }
    }
  }

  // Generate immersive Points of Interest (POIs) with World History/Lore snippets
  if (!hasTown) {
    generatePointsOfInterest(map, chunkX, chunkY, biome, width, height, prng, poisList);
  }

  // Generate immersive Traveling NPCs in chunks where there is no town/city/castle
  if (!hasTown) {
    const travelerRoll = prng(chunkX, chunkY, 8852);
    if (travelerRoll < 0.50) { // 50% chance to spawn one in this wilderness chunk
      const typeRoll = prng(chunkX, chunkY, 3211);
      let tRole: 'traveler_herbalist' | 'traveler_hunter' | 'traveler_pilgrim' = 'traveler_herbalist';
      let tChar = '🌿';
      let tColor = '#10b981'; // Emerald
      let tName = '';
      let tDialogue: string[] = [];

      const herbalistNames = ["Sage Cora", "Gatherer Eli", "Apothecary Maeve", "Alchemist Reed", "Botanist Jaxon"];
      const hunterNames = ["Tracker Silas", "Diana the Bowyer", "Hunter Keith", "Ranger Anya", "Woodsman Logan"];
      const pilgrimNames = ["Pilgrim Paul", "Wanderer Wendy", "Brother Timothy", "Sister Clara", "Peddler Pete"];

      if (typeRoll < 0.33) {
        tRole = 'traveler_herbalist';
        tChar = '🌿';
        tColor = '#34d399'; // Emerald mint
        const nameIdx = Math.floor(prng(chunkX, chunkY, 1) * herbalistNames.length);
        tName = `${herbalistNames[nameIdx]} (Wilderness Herbalist)`;
        tDialogue = [
          "I'm searching for rare starflowers and mountain sage here in the wild. Some of Sunder's finest alchemical herbs grow in these untamed lands.",
          "Be careful with those red mushrooms. Some make a savory stew, but others... well, they'll put you in a very deep sleep.",
          "The wild flora carries the ambient magic of Sunder. Would you like to buy some potent herbs or restorative elixirs?",
          "Zzz... clutching a pouch of lavender and wild chamomile..."
        ];
      } else if (typeRoll < 0.66) {
        tRole = 'traveler_hunter';
        tChar = '🏹';
        tColor = '#fb923c'; // Orange
        const nameIdx = Math.floor(prng(chunkX, chunkY, 2) * hunterNames.length);
        tName = `${hunterNames[nameIdx]} (Wilderness Hunter)`;
        tDialogue = [
          "Tracking some wild boars across these parts. Keep your distance from the old boars; they can charge with nasty force.",
          "I have fresh game meat and thick animal hides. A survivalist's treasure in Sunder's cold nights.",
          "Arrows oiled, bowstring tight. No beast escapes my sights.",
          "Zzz... snoring softly, resting a calloused hand on a bundle of pelts..."
        ];
      } else {
        tRole = 'traveler_pilgrim';
        tChar = '🚶';
        tColor = '#c084fc'; // Purple/Lavender
        const nameIdx = Math.floor(prng(chunkX, chunkY, 3) * pilgrimNames.length);
        tName = `${pilgrimNames[nameIdx]} (Traveling Pilgrim)`;
        tDialogue = [
          "I am traveling between distant settlements to deliver sacred texts and sell minor trinkets.",
          "The roads of Sunder are dangerous these days with Syndicate scouts and bandit bands roaming freely.",
          "Safe travels, friend. Sunder is a harsh and unforgiving land, but there is still beauty to be found in the wilderness.",
          "Zzz... dreaming of paved roads, stone arches, and safe havens..."
        ];
      }

      // Find a safe grass tile for the traveler
      let travX = -1;
      let travY = -1;
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 5 + Math.floor(prng(chunkX * 23, chunkY * 19, attempts + 1) * (width - 10));
        const ry = 5 + Math.floor(prng(chunkX * 13, chunkY * 29, attempts + 2) * (height - 10));
        if (map[ry]?.[rx] === TileType.Grass && !npcs.some(n => n.x === rx && n.y === ry)) {
          travX = rx;
          travY = ry;
          break;
        }
      }

      if (travX !== -1 && travY !== -1) {
        npcs.push({
          id: `traveler_${chunkX}_${chunkY}`,
          name: tName,
          role: tRole as any,
          char: tChar,
          color: tColor,
          x: travX,
          y: travY,
          homeX: travX,
          homeY: travY,
          workX: travX,
          workY: travY,
          scheduleState: 'work',
          dialogue: tDialogue
        });
      }
    }
  }

  npcs.forEach((npc) => {
    const safePos = findNearestSafeNpcTile(npc.x, npc.y, map);
    npc.x = safePos.x;
    npc.y = safePos.y;

    if (npc.homeX !== undefined && npc.homeY !== undefined) {
      const safeHome = findNearestSafeNpcTile(npc.homeX, npc.homeY, map);
      npc.homeX = safeHome.x;
      npc.homeY = safeHome.y;
    }

    if (npc.workX !== undefined && npc.workY !== undefined) {
      const safeWork = findNearestSafeNpcTile(npc.workX, npc.workY, map);
      npc.workX = safeWork.x;
      npc.workY = safeWork.y;
    }
  });

  // Pre-fill fog arrays
  const discovered = Array(height).fill(null).map(() => Array(width).fill(false));
  const visible = Array(height).fill(null).map(() => Array(width).fill(false));

  ctx.watchtower = watchtower;
  ctx.secondFloorMap = secondFloorMap;
  ctx.secondFloorDiscovered = secondFloorDiscovered;
  ctx.secondFloorVisible = secondFloorVisible;
}
