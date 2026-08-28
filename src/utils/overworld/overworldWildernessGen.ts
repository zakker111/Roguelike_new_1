import { TileType, NPC, Enemy, Trap, Chest, EnemyType, EnemyState, TrapType } from "../../types";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from "../itemsData";
import { generateWatchtowerPOI, generateRuinsPOI } from "../../world/poiGenerators";
import { generateRuinsDecorProps } from "../decorEngine";
import worldConfig from "../../data/worldConfig.json";
import { getEnemyTemplate } from "../dungeon";
import { applyCombatArchetypeAndChaosScaling } from "../combatArchetypes";
import {
  prng,
  findNearestSafeNpcTile,
} from "./overworldCore";
import { OverworldGenContext } from "./types";
import {
  carveNaturalRiversAndLakes,
  generateOrganicVegetationAndOres,
  carveOrganicTrailsAndRoads,
  ensureEntranceClearance,
  connectPoiSpokeToTrail,
} from "../../world/organic";

export function generateWildernessChunk(ctx: OverworldGenContext): void {
  const {
    chunkX,
    chunkY,
    width,
    height,
    spawnedCats,
    spawnedSeppo,
    playerStats,
    currentWeapon,
    biome,
    map,
    npcs,
    enemies,
    chests,
    traps,
    dungeons,
    hasTown,
    isCastleTown,
  } = ctx;
  let watchtower = ctx.watchtower;

    // GENERATE A WILDERNESS CHUNK WITH COMPLEX BIOMES, HAZARDS, AND ORGANIC LAKES
    const biomeConfig = (worldConfig.environmentalHazards as any)[biome] || { lakeCount: 2, baseLakeRadiusMin: 2, baseLakeRadiusMax: 4, trapCount: 0, trapType: "none" };
    
    // 1. Organic Lakes (Biome-Specific Shapes & Locations loaded from WorldConfig)
    const lakeCount = biomeConfig.lakeCount;
    for (let l = 0; l < lakeCount; l++) {
      // Deterministic center coordinates for lakes (ensure they stay away from direct chunk borders)
      const lakeX = Math.floor(prng(chunkX, chunkY, 100 + l * 20) * (width - 14)) + 7;
      const lakeY = Math.floor(prng(chunkX, chunkY, 150 + l * 20) * (height - 12)) + 6;
      
      const rMin = biomeConfig.baseLakeRadiusMin;
      const rMax = biomeConfig.baseLakeRadiusMax;
      const baseRadius = rMin + Math.floor(prng(chunkX, chunkY, 200 + l * 5) * (rMax - rMin + 1));
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - lakeX;
          const dy = y - lakeY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Organic contouring using deterministic coordinate-based sin/cos noise
          const angle = Math.atan2(dy, dx);
          const contourNoise = Math.sin(angle * 5 + prng(chunkX, chunkY, 300) * 10) * 0.8 + 
                               Math.cos(angle * 3 + prng(chunkX, chunkY, 350) * 10) * 0.5;
          const organicRadius = baseRadius + contourNoise;
          
          if (dist <= organicRadius) {
            // Larger Forest and Swamp lakes feature a majestic 1-tile central grassy islet!
            if (dist < 1.4 && baseRadius >= 4 && (biome === 'forest' || biome === 'swamp')) {
              map[y][x] = TileType.Grass;
            } else {
              map[y][x] = TileType.Water;
            }
          }
        }
      }

      // If islet was generated in the center, decorate it and connect with a natural stepping-stone ford to mainland
      if (lakeX >= 0 && lakeX < width && lakeY >= 0 && lakeY < height) {
        if (map[lakeY][lakeX] === TileType.Grass) {
          map[lakeY][lakeX] = (biome === 'forest' || biome === 'tundra') ? TileType.Tree : TileType.Bush;
          // Step path connecting islet eastwards to shoreline
          for (let step = 1; step <= baseRadius + 1; step++) {
            const sx = lakeX + step;
            if (sx >= 0 && sx < width && map[lakeY][sx] === TileType.Water) {
              map[lakeY][sx] = TileType.Path;
            }
          }
        }
      }
      
      // Lush vegetation ring around the Desert Oasis!
      if (biome === 'desert' && lakeX >= 0 && lakeX < width && lakeY >= 0 && lakeY < height) {
        const ringRadius = baseRadius + 2.0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = x - lakeX;
            const dy = y - lakeY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > baseRadius && dist <= ringRadius && map[y][x] === TileType.Grass) {
              const roll = prng(x, y, 77);
              if (roll > 0.78) {
                map[y][x] = TileType.Tree; // Palm trees around Oasis water edge
              } else if (roll > 0.72) {
                map[y][x] = TileType.Bush; // Rare oasis green shrub
              }
            }
          }
        }
        
        // Oasis high-value treasure chest!
        const chestX = Math.floor(lakeX + baseRadius - 1);
        const chestY = lakeY;
        if (chestX >= 0 && chestX < width && chestY >= 0 && chestY < height) {
          map[chestY][chestX] = TileType.Floor; // cleared pedestal tile
          // Guarantee walkable approach from land
          if (chestX + 1 < width && map[chestY][chestX + 1] === TileType.Water) {
            map[chestY][chestX + 1] = TileType.Path;
          }
          chests.push({
            id: `oasis_chest_${chunkX}_${chunkY}`,
            x: chestX,
            y: chestY,
            isOpened: false,
            materials: [
              BASIC_MATERIALS[1].id,
              BASIC_MATERIALS[Math.min(BASIC_MATERIALS.length - 1, Math.floor(prng(chunkX, chunkY, 88) * BASIC_MATERIALS.length))].id
            ],
            catalysts: [
              ELEMENTAL_CATALYSTS[Math.min(ELEMENTAL_CATALYSTS.length - 1, Math.floor(prng(chunkX, chunkY, 89) * ELEMENTAL_CATALYSTS.length))].id
            ],
            gold: Math.floor(prng(chestX, chestY, 90) * 45) + 55
          });
        }
      }
    }

    // 2. Organic Wending River with Guaranteed Multi-Point Crossings (Upper, Mid-ford, Lower)
    const riverX = Math.floor(prng(chunkX, chunkY, 1) * (width - 15)) + 7;
    const bridgeY1 = Math.floor(prng(chunkX, chunkY, 2) * (Math.floor(height / 2) - 8)) + 5;
    const bridgeY2 = Math.floor(prng(chunkX, chunkY, 22) * (Math.floor(height / 2) - 8)) + Math.floor(height / 2) + 2;
    const midFordY = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
      // Wiggle of current river line
      const riverCurvature = Math.floor(Math.sin((y + chunkY) * 0.4) * 2.5);
      const rx = riverX + riverCurvature;
      
      if (rx >= 1 && rx < width - 2) {
        const isBridge = (y === bridgeY1 || y === bridgeY1 + 1 || y === bridgeY2 || y === bridgeY2 + 1 || y === midFordY);

        if (isBridge) {
          if (map[y][rx] !== TileType.Wall && map[y][rx] !== TileType.Door) map[y][rx] = TileType.Path;
          if (map[y][rx + 1] !== TileType.Wall && map[y][rx + 1] !== TileType.Door) map[y][rx + 1] = TileType.Path;
        } else {
          if (map[y][rx] !== TileType.Wall && map[y][rx] !== TileType.Door && map[y][rx] !== TileType.DungeonEntrance && map[y][rx] !== TileType.Path) {
            map[y][rx] = TileType.Water;
          }
          if (map[y][rx + 1] !== TileType.Wall && map[y][rx + 1] !== TileType.Door && map[y][rx + 1] !== TileType.DungeonEntrance && map[y][rx + 1] !== TileType.Path) {
            map[y][rx + 1] = TileType.Water;
          }
        }
      }
    }

    // Place dynamic wooden Signpost next to the upper bridge
    const signX = riverX < width - 4 ? riverX + 3 : riverX - 3;
    const signY = bridgeY1 < height - 3 ? bridgeY1 + 2 : bridgeY1 - 2;
    if (signX >= 0 && signX < width && signY >= 0 && signY < height) {
      if (map[signY][signX] !== TileType.Water && map[signY][signX] !== TileType.Wall) {
        map[signY][signX] = TileType.Sign;
      }
    }

    // 3. Spawns biome-specific hazards and traps loaded from WorldConfig
    const trapCount = biomeConfig.trapCount || 0;
    const trapTypeStr = biomeConfig.trapType || "none";

    for (let i = 0; i < trapCount; i++) {
      const tx = Math.floor(prng(chunkX, chunkY, 500 + i) * (width - 6)) + 3;
      const ty = Math.floor(prng(chunkX, chunkY, 600 + i) * (height - 6)) + 3;
      if (map[ty]?.[tx] === TileType.Grass) {
        if (trapTypeStr === "poisonGas") {
          traps.push({
            id: `swamp_gas_${chunkX}_${chunkY}_${i}`,
            x: tx,
            y: ty,
            type: TrapType.PoisonGas,
            triggered: false,
            isActive: true,
            hidden: true,
            detected: false,
          });
          map[ty][tx] = TileType.Bush; // camouflage as toxic bush
        } else if (trapTypeStr === "spikes") {
          traps.push({
            id: `tundra_frost_${chunkX}_${chunkY}_${i}`,
            x: tx,
            y: ty,
            type: TrapType.Spikes,
            triggered: false,
            isActive: true,
            hidden: true,
            detected: false,
          });
        } else if (trapTypeStr === "fireVent") {
          traps.push({
            id: `desert_steam_${chunkX}_${chunkY}_${i}`,
            x: tx,
            y: ty,
            type: TrapType.FireVent,
            triggered: false,
            isActive: prng(tx, ty, 33) > 0.5,
            hidden: true,
            detected: false,
          } as any);
          map[ty][tx] = TileType.Campfire; // indicator
        }
      }
    }

    // Organic clustered forests & ore vein lodes
    generateOrganicVegetationAndOres(map, chunkX, chunkY, width, height, biome);

    // Carve organic cross-chunk trails and winding pathways
    carveOrganicTrailsAndRoads(map, chunkX, chunkY, width, height, hasTown);

    const distFromOrigin = Math.hypot(chunkX, chunkY);
    const isWatchtowerChunk = !hasTown && !isCastleTown && distFromOrigin > 1.5 && (Math.abs(chunkX) + Math.abs(chunkY)) % 3 === 2;

    if (isWatchtowerChunk) {
      watchtower = generateWatchtowerPOI(map, chunkX, chunkY, prng, chests, enemies);
    } else {
      // Spawn a Dungeon Entrance inside a small 3x3 stone building with random entrance door position
      const dungX = Math.floor(prng(chunkX, chunkY, 3) * (width - 10)) + 5;
      const dungY = Math.floor(prng(chunkX, chunkY, 4) * (height - 8)) + 4;

      let canPlaceDungeonBuilding = true;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const tx = dungX + dx;
          const ty = dungY + dy;
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
            if (map[ty][tx] === TileType.Water || map[ty][tx] === TileType.Path) {
              canPlaceDungeonBuilding = false;
            }
          } else {
            canPlaceDungeonBuilding = false;
          }
        }
      }

      if (canPlaceDungeonBuilding) {
        // Build 3x3 walls
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            map[dungY + dy][dungX + dx] = TileType.Wall;
          }
        }
        // Center of 3x3 building gets Floor + DungeonEntrance
        map[dungY + 1][dungX + 1] = TileType.Floor;
        map[dungY + 1][dungX + 1] = TileType.DungeonEntrance;

        // Random position for door (south, west, or east)
        const doorRand = Math.floor(prng(dungX, dungY, 82) * 3);
        let doorX = dungX + 1;
        let doorY = dungY + 2;
        let doorFacing: 'south' | 'west' | 'east' = 'south';

        if (doorRand === 0) {
          doorX = dungX + 1;
          doorY = dungY + 2;
          doorFacing = 'south';
          map[doorY][doorX] = TileType.Door; // South
        } else if (doorRand === 1) {
          doorX = dungX;
          doorY = dungY + 1;
          doorFacing = 'west';
          map[doorY][doorX] = TileType.Door; // West
        } else {
          doorX = dungX + 2;
          doorY = dungY + 1;
          doorFacing = 'east';
          map[doorY][doorX] = TileType.Door; // East
        }

        // Clear entrance clearance runway outward from dungeon doorway
        ensureEntranceClearance(map, doorX, doorY, width, height, doorFacing);

        // Connect spoke to nearest highway / trail
        const spokeStartX = doorFacing === 'south' ? doorX : (doorFacing === 'west' ? doorX - 1 : doorX + 1);
        const spokeStartY = doorFacing === 'south' ? doorY + 1 : doorY;
        connectPoiSpokeToTrail(map, spokeStartX, spokeStartY, width, height, true);

        dungeons.push({
          x: dungX + 1,
          y: dungY + 1,
          id: `dungeon_${chunkX}_${chunkY}`,
          targetDepth: 1
        });
      } else {
        // Fallback single tile
        if (map[dungY] && map[dungY][dungX] !== TileType.Water && map[dungY][dungX] !== TileType.Path) {
          map[dungY][dungX] = TileType.DungeonEntrance;
          ensureEntranceClearance(map, dungX, dungY, width, height, 'all');
          connectPoiSpokeToTrail(map, dungX, dungY, width, height, true);
          dungeons.push({
            x: dungX,
            y: dungY,
            id: `dungeon_${chunkX}_${chunkY}`,
            targetDepth: 1
          });
        }
      }

      // Spawn some atmospheric ruined buildings in the wild with premium loot chest outside starter buffer!
      const spawnRuins = distFromOrigin > 1.5 && prng(chunkX, chunkY, 150) > 0.55;
      if (spawnRuins) {
        generateRuinsPOI(map, chunkX, chunkY, biome, width, height, prng, chests, enemies);
        ctx.props = generateRuinsDecorProps(map);
      }
    }

    // Scatter a couple of resource Chests in the woods loaded from WorldConfig
    const chestCount = biomeConfig.chestCount !== undefined ? biomeConfig.chestCount : 2;
    for (let i = 0; i < chestCount; i++) {
      const cx = Math.floor(prng(chunkX, chunkY, 5 + i) * (width - 6)) + 3;
      const cy = Math.floor(prng(chunkX, chunkY, 15 + i) * (height - 6)) + 3;
      if (map[cy]?.[cx] === TileType.Grass) {
        const gold = Math.floor(prng(cx, cy, 7) * 20) + 10;
        const chestMats = [BASIC_MATERIALS[0].id];
        if (prng(cx, cy, 8) > 0.6) chestMats.push(BASIC_MATERIALS[1].id);
        chests.push({
          id: `overworld_chest_${chunkX}_${chunkY}_${i}`,
          x: cx,
          y: cy,
          isOpened: false,
          materials: chestMats,
          catalysts: prng(cx, cy, 9) > 0.5 ? [ELEMENTAL_CATALYSTS[Math.floor(prng(cx, cy, 10) * ELEMENTAL_CATALYSTS.length)].id] : [],
          gold
        });
      }
    }

    // Spawn wild monsters roaming the grassy fields with biome-specific styles, naming, and dynamic difficulty range!
    const minM = biomeConfig.monsterCountMin !== undefined ? biomeConfig.monsterCountMin : 2;
    const maxM = biomeConfig.monsterCountMax !== undefined ? biomeConfig.monsterCountMax : 4;
    const monsterCount = minM + Math.floor(prng(chunkX, chunkY, 12) * (maxM - minM + 1)); 

    // Calculate distance from origin (0,0) to adjust wilderness difficulty tier weights
    let easyWeight = 0.50;
    let standardWeight = 0.35;
    let toughWeight = 0.15;
    let apexWeight = 0.00;

    if (distFromOrigin <= 1.5) {
      // Safe / Starter Frontier near town: Strictly easy critters and light standard scouts (0% Tough, 0% Apex)
      easyWeight = 0.70;
      standardWeight = 0.30;
      toughWeight = 0.00;
      apexWeight = 0.00;
    } else if (distFromOrigin <= 3.5) {
      // Mid Wilderness
      easyWeight = 0.45;
      standardWeight = 0.35;
      toughWeight = 0.16;
      apexWeight = 0.04;
    } else {
      // Deep Frontier
      easyWeight = 0.35;
      standardWeight = 0.35;
      toughWeight = 0.22;
      apexWeight = 0.08;
    }

    for (let i = 0; i < monsterCount; i++) {
      const mx = Math.floor(prng(chunkX, chunkY, 100 + i) * (width - 4)) + 2;
      const my = Math.floor(prng(chunkX, chunkY, 200 + i) * (height - 4)) + 2;

      if (map[my]?.[mx] === TileType.Grass) {
        const tierRoll = prng(mx, my, 99);
        const subRoll = prng(mx, my, 199);

        let tier: 'easy' | 'standard' | 'tough' | 'apex' = 'easy';
        if (tierRoll < easyWeight) {
          tier = 'easy';
        } else if (tierRoll < easyWeight + standardWeight) {
          tier = 'standard';
        } else if (tierRoll < easyWeight + standardWeight + toughWeight) {
          tier = 'tough';
        } else {
          tier = 'apex';
        }

        let type = EnemyType.Rat;
        let name = "Wild Rat";
        let char = '🐀';
        let color = '#94a3b8';
        let baseHp = 8;
        let baseAtk = 2;
        let baseDef = 0;
        let range = 1;
        let isBoss = false;

        // Biome and Tier based enemy generation
        if (tier === 'easy') {
          // --- EASY TIER: Frail critters & scouts (fast, satisfying kills in 1-2 hits) ---
          if (biome === 'desert') {
            if (subRoll > 0.65) {
              type = EnemyType.Goblin;
              name = "Dusty Dune Scavenger [Easy]";
              char = '⚲';
              color = '#f59e0b';
              baseHp = 10; baseAtk = 2; baseDef = 0;
            } else if (subRoll > 0.35) {
              type = EnemyType.Spider;
              name = "Sun Scorpionling [Easy]";
              char = '🦂';
              color = '#fbbf24';
              baseHp = 8; baseAtk = 2; baseDef = 0;
            } else {
              type = EnemyType.Rat;
              name = "Desert Sand Beetle [Easy]";
              char = '🐞';
              color = '#ea580c';
              baseHp = 7; baseAtk = 1; baseDef = 1;
            }
          } else if (biome === 'tundra') {
            if (subRoll > 0.65) {
              type = EnemyType.Goblin;
              name = "Shivering Snow Kobold [Easy]";
              char = '❄';
              color = '#93c5fd';
              baseHp = 10; baseAtk = 2; baseDef = 0;
            } else if (subRoll > 0.35) {
              type = EnemyType.Spider;
              name = "Ice Web Weaver [Easy]";
              char = '🕸️';
              color = '#e2e8f0';
              baseHp = 8; baseAtk = 2; baseDef = 0;
            } else {
              type = EnemyType.Rat;
              name = "Frost Biter Rat [Easy]";
              char = '🐀';
              color = '#cbd5e1';
              baseHp = 7; baseAtk = 2; baseDef = 0;
            }
          } else if (biome === 'swamp') {
            if (subRoll > 0.65) {
              type = EnemyType.Goblin;
              name = "Feeble Mud Imp [Easy]";
              char = '♟';
              color = '#65a30d';
              baseHp = 10; baseAtk = 2; baseDef = 0;
            } else if (subRoll > 0.35) {
              type = EnemyType.Spider;
              name = "Bog Creeper Spider [Easy]";
              char = '🕷️';
              color = '#84cc16';
              baseHp = 9; baseAtk = 2; baseDef = 0;
            } else {
              type = EnemyType.Rat;
              name = "Swamp Mud Slimelet [Easy]";
              char = 'o';
              color = '#10b981';
              baseHp = 8; baseAtk = 1; baseDef = 1;
            }
          } else {
            // Forest / Default
            if (subRoll > 0.65) {
              type = EnemyType.Goblin;
              name = "Frail Goblin Scout [Easy]";
              char = 'g';
              color = '#eab308';
              baseHp = 10; baseAtk = 2; baseDef = 0;
            } else if (subRoll > 0.35) {
              type = EnemyType.Spider;
              name = "Scurrying Spiderling [Easy]";
              char = '🕷️';
              color = '#a1a1aa';
              baseHp = 8; baseAtk = 2; baseDef = 0;
            } else {
              type = EnemyType.Rat;
              name = "Forest Field Mouse [Easy]";
              char = '🐁';
              color = '#94a3b8';
              baseHp = 6; baseAtk = 1; baseDef = 0;
            }
          }
        } else if (tier === 'standard') {
          // --- STANDARD TIER: Balanced skirmishers ---
          if (biome === 'desert') {
            if (subRoll > 0.5) {
              type = EnemyType.Goblin;
              name = "Dune Nomad Raider";
              char = '⚲';
              color = '#f59e0b';
              baseHp = 22; baseAtk = 4; baseDef = 1;
            } else {
              type = EnemyType.SkeletonMage;
              name = "Sun Priest Acolyte";
              char = '☄';
              color = '#fbbf24';
              baseHp = 18; baseAtk = 4; baseDef = 0; range = 3;
            }
          } else if (biome === 'tundra') {
            if (subRoll > 0.5) {
              type = EnemyType.Goblin;
              name = "Frost Goblin Scout";
              char = '❄';
              color = '#60a5fa';
              baseHp = 22; baseAtk = 4; baseDef = 1;
            } else {
              type = EnemyType.SkeletonMage;
              name = "Ice Cryomancer Acolyte";
              char = '☸';
              color = '#38bdf8';
              baseHp = 18; baseAtk = 4; baseDef = 0; range = 3;
            }
          } else if (biome === 'swamp') {
            if (subRoll > 0.5) {
              type = EnemyType.Goblin;
              name = "Bog Lurker Sneak";
              char = '♟';
              color = '#84cc16';
              baseHp = 24; baseAtk = 4; baseDef = 1;
            } else {
              type = EnemyType.Nakki;
              name = "Näkki Water Spirit";
              char = '🧜';
              color = '#06b6d4';
              baseHp = 22; baseAtk = 4; baseDef = 1;
            }
          } else {
            // Forest / Default
            if (subRoll > 0.65) {
              type = EnemyType.Hiisi;
              name = "Hiisi Forest Scout";
              char = '👹';
              color = '#16a34a';
              baseHp = 24; baseAtk = 4; baseDef = 1;
            } else if (subRoll > 0.35) {
              type = EnemyType.Goblin;
              name = "Scavenger Goblin";
              char = 'g';
              color = '#84cc16';
              baseHp = 20; baseAtk = 4; baseDef = 1;
            } else {
              type = EnemyType.SkeletonMage;
              name = "Woodland Pyromancer";
              char = 'S';
              color = '#fb923c';
              baseHp = 18; baseAtk = 4; baseDef = 0; range = 3;
            }
          }
        } else if (tier === 'tough') {
          // --- TOUGH TIER: Heavy hitters & veterans ---
          if (biome === 'desert') {
            if (subRoll > 0.5) {
              type = EnemyType.OrcBrute;
              name = "Armored Sand Golem [Tough]";
              char = '⚙';
              color = '#d97706';
              baseHp = 48; baseAtk = 7; baseDef = 4;
            } else {
              type = EnemyType.SkeletonMage;
              name = "Sun Priest Pyromancer [Tough]";
              char = '☄';
              color = '#f97316';
              baseHp = 32; baseAtk = 8; baseDef = 2; range = 3;
            }
          } else if (biome === 'tundra') {
            if (subRoll > 0.5) {
              type = EnemyType.OrcBrute;
              name = "Abominable Yeti [Tough]";
              char = '⛄';
              color = '#ffffff';
              baseHp = 58; baseAtk = 8; baseDef = 4;
            } else {
              type = EnemyType.Kalma;
              name = "Kalma Frost Maiden [Tough]";
              char = '💀';
              color = '#93c5fd';
              baseHp = 38; baseAtk = 8; baseDef = 2;
            }
          } else if (biome === 'swamp') {
            if (subRoll > 0.5) {
              type = EnemyType.OrcBrute;
              name = "Marsh Troll Giant [Tough]";
              char = '☈';
              color = '#15803d';
              baseHp = 52; baseAtk = 7; baseDef = 3;
            } else {
              type = EnemyType.Kalma;
              name = "Kalma Grave Goddess [Tough]";
              char = '💀';
              color = '#a855f7';
              baseHp = 42; baseAtk = 8; baseDef = 2;
            }
          } else {
            // Forest / Default
            if (subRoll > 0.5) {
              type = EnemyType.OrcBrute;
              name = "Savage Orc Skullbreaker [Tough]";
              char = 'O';
              color = '#ea580c';
              baseHp = 46; baseAtk = 7; baseDef = 3;
            } else {
              type = EnemyType.Hiisi;
              name = "Hiisi Forest Fiend [Tough]";
              char = '👹';
              color = '#15803d';
              baseHp = 42; baseAtk = 7; baseDef = 2;
            }
          }
        } else {
          // --- APEX TIER: Rare Roaming Legends & Dragons ---
          isBoss = true;
          if (biome === 'desert') {
            type = EnemyType.Dragon;
            name = "👑 Desert Sun-Drake Dragon [Apex]";
            char = '🐉';
            color = '#f97316';
            baseHp = 140; baseAtk = 12; baseDef = 5; range = 3;
          } else if (biome === 'tundra') {
            if (subRoll > 0.5) {
              type = EnemyType.Louhi;
              name = "👑 Louhi, Mistress of Pohjola [Apex]";
              char = '🦅';
              color = '#c084fc';
              baseHp = 160; baseAtk = 13; baseDef = 6; range = 3;
            } else {
              type = EnemyType.Dragon;
              name = "👑 Glacial Frost-Wyrm Dragon [Apex]";
              char = '🐉';
              color = '#cbd5e1';
              baseHp = 140; baseAtk = 12; baseDef = 5; range = 3;
            }
          } else if (biome === 'swamp') {
            if (subRoll > 0.5) {
              type = EnemyType.IkuTurso;
              name = "👑 Iku-Turso Ancient Leviathan [Apex]";
              char = '🦑';
              color = '#0ea5e9';
              baseHp = 150; baseAtk = 12; baseDef = 5; range = 2;
            } else {
              type = EnemyType.Dragon;
              name = "👑 Noxious Acid Drake Dragon [Apex]";
              char = '🐉';
              color = '#10b981';
              baseHp = 135; baseAtk = 11; baseDef = 5; range = 3;
            }
          } else {
            // Forest / Default
            if (subRoll > 0.5) {
              type = EnemyType.Otso;
              name = "👑 Otso the Sacred Bear Spirit [Apex]";
              char = '🐻';
              color = '#b45309';
              baseHp = 150; baseAtk = 12; baseDef = 5;
            } else {
              type = EnemyType.Dragon;
              name = "👑 Emerald Canopy Drake [Apex]";
              char = '🐉';
              color = '#22c55e';
              baseHp = 130; baseAtk = 11; baseDef = 5; range = 3;
            }
          }
        }

        const rawEnemy: Enemy = {
          id: `wild_enemy_${chunkX}_${chunkY}_${i}`,
          x: mx,
          y: my,
          type,
          name,
          hp: baseHp,
          maxHp: baseHp,
          atk: baseAtk,
          def: baseDef,
          range,
          speed: 1,
          color,
          char,
          state: EnemyState.Patrolling,
          isBoss,
          difficultyTier: tier,
          isElite: tier === 'tough' ? prng(mx, my, 25) > 0.75 : (tier === 'apex'),
          eliteEffect: tier === 'tough' && prng(mx, my, 25) > 0.75 ? 'Scurrying' : undefined,
          patrolPath: [
            { x: mx, y: my },
            { x: Math.max(1, mx - 3), y: my },
            { x: Math.max(1, mx - 3), y: Math.max(1, my - 3) },
            { x: mx, y: Math.max(1, my - 3) }
          ],
          patrolIndex: 0,
          debuffs: []
        };

        const scaledEnemy = applyCombatArchetypeAndChaosScaling(
          rawEnemy,
          0,
          playerStats || undefined,
          0
        );

        enemies.push(scaledEnemy);
      }
    }

    // Spawn biome-appropriate harmless wild animals!
    const animalCount = Math.floor(prng(chunkX, chunkY, 33) * 3) + 2; 
    for (let i = 0; i < animalCount; i++) {
      const ax = Math.floor(prng(chunkX, chunkY, 300 + i) * (width - 4)) + 2;
      const ay = Math.floor(prng(chunkX, chunkY, 400 + i) * (height - 4)) + 2;

      if (map[ay]?.[ax] === TileType.Grass) {
        const aRoll = prng(ax, ay, 88);
        let animalType: 'deer' | 'boar' | 'sheep' = 'sheep';
        
        // Visual characters and labels customized by biome!
        let char = '🐑';
        let color = '#f8fafc';
        let hp = 6;
        let name = "Wild Sheep";

        if (biome === 'desert') {
          if (aRoll > 0.5) {
            animalType = 'deer';
            char = '🐪'; // Desert Camel!
            color = '#d97706';
            hp = 18;
            name = "Desert Camel";
          } else {
            animalType = 'sheep';
            char = '🦎'; // Desert Lizard
            color = '#84cc16';
            hp = 5;
            name = "Desert Horned Lizard";
          }
        } else if (biome === 'tundra') {
          if (aRoll > 0.5) {
            animalType = 'boar';
            char = '🐺'; // Arctic wolf
            color = '#94a3b8';
            hp = 16;
            name = "Arctic Icewolf"; // Neutral wolf!
          } else {
            animalType = 'deer';
            char = '🦌'; // caribou
            color = '#cbd5e1';
            hp = 12;
            name = "Wild Caribou";
          }
        } else if (biome === 'swamp') {
          if (aRoll > 0.5) {
            animalType = 'boar';
            char = '🐊'; // Caiman alligator
            color = '#14532d';
            hp = 22;
            name = "Swamp Caiman";
          } else {
            animalType = 'sheep';
            char = '🐸'; // Toxic toad
            color = '#22c55e';
            hp = 4;
            name = "Marsh Bullfrog";
          }
        } else {
          // Standard forest animals
          if (aRoll > 0.70) {
            animalType = 'deer';
            char = '🦌';
            color = '#d97706';
            hp = 8;
            name = "Wild Deer";
          } else if (aRoll > 0.35) {
            animalType = 'boar';
            char = '🐗';
            color = '#a1a1aa';
            hp = 14;
            name = "Wild Boar";
          } else {
            animalType = 'sheep';
            char = '🐐';
            color = '#f8fafc';
            hp = 10;
            name = "Wild Mountain Goat";
          }
        }

        let finalEnemyType = EnemyType.WildlifeGoat;
        if (animalType === 'deer') {
          finalEnemyType = EnemyType.WildlifeDeer;
        } else if (animalType === 'boar') {
          finalEnemyType = EnemyType.WildlifeBoar;
        }

        enemies.push({
          id: `wild_animal_${chunkX}_${chunkY}_${i}`,
          x: ax,
          y: ay,
          type: finalEnemyType,
          name,
          hp,
          maxHp: hp,
          atk: 0,
          def: 0,
          range: 1,
          speed: 1,
          color,
          char,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [
            { x: ax, y: ay },
            { x: Math.max(1, ax - 2), y: Math.min(height - 2, ay + 2) }
          ],
          patrolIndex: 0,
          debuffs: [],
          isAnimal: true,
          animalType
        });
      }
    }

    // 6. Spawn drunk wandering merchant Seppo (rarely in wilderness)
    let seppoX = -1;
    let seppoY = -1;
    if (!hasTown) {
      const seppoRoll = prng(chunkX, chunkY, 9912);
      if (seppoRoll < 0.04) {
        // Find a grass tile near the center
        for (let attempts = 0; attempts < 100; attempts++) {
          const rx = 10 + Math.floor(prng(chunkX * 17, chunkY * 13, attempts + 1) * (width - 20));
          const ry = 6 + Math.floor(prng(chunkX * 11, chunkY * 19, attempts + 2) * (height - 12));
          if (map[ry]?.[rx] === TileType.Grass) {
            seppoX = rx;
            seppoY = ry;
            break;
          }
        }
        
        if (seppoX !== -1) {
          npcs.push({
            id: `npc_seppo`,
            name: 'Seppo (Wandering Merchant)',
            role: 'merchant_seppo' as any,
            char: 'S',
            color: '#ff7e5f', // Coral pink/orange
            x: seppoX,
            y: seppoY,
            homeX: seppoX,
            homeY: seppoY,
            workX: seppoX,
            workY: seppoY,
            scheduleState: 'leisure',
            dialogue: [
              "*Hic!* Oh... hello there, traveler! Have you seen my reindeer? No? Then buy my stuff... *hic!* I have... premium goods, straight from my secret forest bath! *burp*",
              "They told me not to wander into the swamp. But... *hic*... swamp has the best yeast for brewing! Do you want a sip?",
              "A true warrior... *hic*... respects a solid tree trunk! Look at this Sisu Hammer! I found it in a ditch, works perfectly!",
              "*Mumbles*... I am completely sober... absolutely sober. Yes! Want to buy some authentic Seppo's secret hooch? It's... *hic*... 100% organic!",
              "*Clinks bottles together*... Ah, the sweet music of spirits! Sells for a bargain, buys... wait, what are we buying again?"
            ]
          });
        }
      }
    }
  }
