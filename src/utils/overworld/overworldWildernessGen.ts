import { TileType, NPC, Enemy, Trap, Chest, EnemyType, EnemyState, TrapType } from "../../types";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from "../itemsData";
import { generateWatchtowerPOI, generateRuinsPOI } from "../../world/poiGenerators";
import worldConfig from "../../data/worldConfig.json";
import { getEnemyTemplate } from "../dungeon";
import { applyCombatArchetypeAndChaosScaling } from "../combatArchetypes";
import {
  prng,
  findNearestSafeNpcTile,
} from "./overworldCore";
import { OverworldGenContext } from "./types";

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

      // If islet was generated in the center, decorate it with an ancient tree or sweet berry bush
      if (lakeX >= 0 && lakeX < width && lakeY >= 0 && lakeY < height) {
        if (map[lakeY][lakeX] === TileType.Grass) {
          map[lakeY][lakeX] = (biome === 'forest' || biome === 'tundra') ? TileType.Tree : TileType.Bush;
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
              if (roll > 0.4) {
                map[y][x] = TileType.Tree; // Palm trees around Oasis water edge
              } else if (roll > 0.15) {
                map[y][x] = TileType.Bush; // Dense oasis green shrubs
              }
            }
          }
        }
        
        // Oasis high-value treasure chest!
        const chestX = Math.floor(lakeX + baseRadius - 1);
        const chestY = lakeY;
        if (chestX >= 0 && chestX < width && chestY >= 0 && chestY < height) {
          map[chestY][chestX] = TileType.Floor; // cleared pedestal tile
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

    // 2. Organic Wending River (flows vertically with a nice bridge crossing)
    const riverX = Math.floor(prng(chunkX, chunkY, 1) * (width - 15)) + 7;
    const bridgeY = Math.floor(prng(chunkX, chunkY, 2) * (height - 10)) + 5;

    for (let y = 0; y < height; y++) {
      // Wiggle of current river line
      const riverCurvature = Math.floor(Math.sin((y + chunkY) * 0.4) * 2.5);
      const rx = riverX + riverCurvature;
      
      if (rx >= 1 && rx < width - 1) {
        if (y === bridgeY || y === bridgeY + 1) {
          map[y][rx] = TileType.Path; // Bridge structure
          map[y][rx + 1] = TileType.Path;
        } else {
          map[y][rx] = TileType.Water;
          map[y][rx + 1] = TileType.Water;
        }
      }
    }

    // Place dynamic wooden Signpost next to the road bridge
    const signX = riverX < width - 4 ? riverX + 3 : riverX - 3;
    const signY = bridgeY < height - 3 ? bridgeY + 2 : bridgeY - 2;
    if (signX >= 0 && signX < width && signY >= 0 && signY < height) {
      map[signY][signX] = TileType.Sign;
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

    // Organic clustered forests development (clearing surrounding of paths)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === TileType.Grass) {
          let blocked = false;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const adjTile = map[ny][nx];
                if (adjTile === TileType.Path || adjTile === TileType.Door || adjTile === TileType.Water || adjTile === TileType.TownGate || adjTile === TileType.DungeonEntrance) {
                  blocked = true;
                }
              }
            }
          }

          if (!blocked) {
            const noiseVal = prng(x + chunkX * width, y + chunkY * height, 10);
            if (noiseVal < 0.12) {
              const treeTypeNoise = prng(x + chunkX * width, y + chunkY * height, 25);
              if (treeTypeNoise < 0.35) {
                map[y][x] = TileType.PineTree;
              } else if (treeTypeNoise < 0.65) {
                map[y][x] = TileType.BirchTree;
              } else {
                map[y][x] = TileType.Tree;
              }
            } else if (noiseVal < 0.16) {
              if (biome !== 'tundra') {
                map[y][x] = TileType.Bush; // Harvestable bushes
              } else {
                map[y][x] = TileType.PineTree; // Winter biome has snow-laden Pine trees
              }
            } else if (noiseVal < 0.18) {
              const veinNoise = prng(x + chunkX * width, y + chunkY * height, 42);
              if (veinNoise < 0.25) {
                map[y][x] = TileType.CopperVein;
              } else if (veinNoise < 0.45) {
                map[y][x] = TileType.IronVein;
              }
            }
          }
        }
      }
    }

    const isWatchtowerChunk = !hasTown && !isCastleTown && (Math.abs(chunkX) + Math.abs(chunkY)) % 3 === 2 && !(chunkX === 0 && chunkY === 0);

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
        if (doorRand === 0) {
          map[dungY + 2][dungX + 1] = TileType.Door; // South
        } else if (doorRand === 1) {
          map[dungY + 1][dungX] = TileType.Door; // West
        } else {
          map[dungY + 1][dungX + 2] = TileType.Door; // East
        }

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
          dungeons.push({
            x: dungX,
            y: dungY,
            id: `dungeon_${chunkX}_${chunkY}`,
            targetDepth: 1
          });
        }
      }

      // Spawn some atmospheric ruined buildings in the wild with premium loot chest!
      const spawnRuins = prng(chunkX, chunkY, 150) > 0.55;
      if (spawnRuins) {
        generateRuinsPOI(map, chunkX, chunkY, biome, width, height, prng, chests, enemies);
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

    // Spawn wild monsters roaming the grassy fields with biome-specific styles and naming loaded from WorldConfig!
    const minM = biomeConfig.monsterCountMin !== undefined ? biomeConfig.monsterCountMin : 2;
    const maxM = biomeConfig.monsterCountMax !== undefined ? biomeConfig.monsterCountMax : 4;
    const monsterCount = minM + Math.floor(prng(chunkX, chunkY, 12) * (maxM - minM + 1)); 
    for (let i = 0; i < monsterCount; i++) {
      const mx = Math.floor(prng(chunkX, chunkY, 100 + i) * (width - 4)) + 2;
      const my = Math.floor(prng(chunkX, chunkY, 200 + i) * (height - 4)) + 2;

      if (map[my]?.[mx] === TileType.Grass) {
        const mRoll = prng(mx, my, 99);
        let type = EnemyType.Rat;

        if (mRoll > 0.95) {
          if (biome === 'forest' && mRoll > 0.98) {
            type = EnemyType.Otso; // Rare golden bear spirit boss!
          } else if (biome === 'tundra' && mRoll > 0.97) {
            type = EnemyType.Louhi; // Rare Mistress of Pohjola boss!
          } else if (biome === 'swamp' && mRoll > 0.97) {
            type = EnemyType.IkuTurso; // Finnish ancient sea leviathan boss!
          } else {
            type = EnemyType.Dragon;
          }
        } else if (mRoll > 0.70) {
          if (biome === 'swamp' && mRoll > 0.82) {
            type = EnemyType.Kalma; // Finnish grave/death goddess!
          } else {
            type = EnemyType.OrcBrute;
          }
        } else if (mRoll > 0.45) {
          if (biome === 'forest' && mRoll > 0.58) {
            type = EnemyType.Hiisi; // Finnish forest fiend!
          } else if (biome === 'tundra' && mRoll > 0.58) {
            type = EnemyType.Kalma; // Grave goddess haunts the cold northern soil
          } else {
            type = EnemyType.Goblin;
          }
        } else if (mRoll > 0.25) {
          if (biome === 'swamp' && mRoll > 0.35) {
            type = EnemyType.Nakki; // Finnish water spirit!
          } else {
            type = EnemyType.SkeletonMage;
          }
        }

        const template = getEnemyTemplate(type);
        let name = "Wild " + template.name;
        if (type === EnemyType.Hiisi || type === EnemyType.Nakki || type === EnemyType.Otso || type === EnemyType.Louhi || type === EnemyType.IkuTurso || type === EnemyType.Kalma) {
          name = template.name; // Keep pure epic name
        }
        let char = template.char;
        let color = template.color;
        
        // Custom Biome Skins for monsters!
        if (biome === 'desert') {
          if (type === EnemyType.Rat) {
            name = "Desert Sand Beetle";
            char = '🐞';
            color = '#ea580c';
          } else if (type === EnemyType.Goblin) {
            name = "Dune Nomad Nomad";
            char = '⚲';
            color = '#f59e0b';
          } else if (type === EnemyType.OrcBrute) {
            name = "Sand Golem";
            char = '⚙';
            color = '#d97706';
          } else if (type === EnemyType.SkeletonMage) {
            name = "Sun Priest Pyromancer";
            char = '☄';
            color = '#fbbf24';
          } else if (type === EnemyType.Dragon) {
            name = "Desert Sun-Drake Dragon";
            char = '🐉';
            color = '#f97316';
          }
        } else if (biome === 'tundra') {
          if (type === EnemyType.Rat) {
            name = "Frost Biter Rat";
            char = '🐀';
            color = '#e2e8f0';
          } else if (type === EnemyType.Goblin) {
            name = "Frost Goblin";
            char = '❄';
            color = '#93c5fd';
          } else if (type === EnemyType.OrcBrute) {
            name = "Abominable Yeti";
            char = '⛄';
            color = '#ffffff';
          } else if (type === EnemyType.SkeletonMage) {
            name = "Ice Cryomancer Lich";
            char = '☸';
            color = '#38bdf8';
          } else if (type === EnemyType.Dragon) {
            name = "Glacial Frost-Wyrm Dragon";
            char = '🐉';
            color = '#cbd5e1';
          }
        } else if (biome === 'swamp') {
          if (type === EnemyType.Rat) {
            name = "Swamp Mud Slime";
            char = 'o';
            color = '#10b981';
          } else if (type === EnemyType.Goblin) {
            name = "Bog Lurker Sneak";
            char = '♟';
            color = '#84cc16';
          } else if (type === EnemyType.OrcBrute) {
            name = "Marsh Troll Giant";
            char = '☈';
            color = '#15803d';
          } else if (type === EnemyType.SkeletonMage) {
            name = "Swamp Witch Doctor";
            char = '✨';
            color = '#a855f7';
          } else if (type === EnemyType.Dragon) {
            name = "Noxious Acid Drake Dragon";
            char = '🐉';
            color = '#10b981';
          }
        } else {
          // Default/forest biome
          if (type === EnemyType.Dragon) {
            name = "Emerald Forest Dragon";
            char = '🐉';
            color = '#22c55e';
          }
        }

        let baseHp = template.baseHp;
        let baseAtk = template.baseAtk;
        let baseDef = template.baseDef;

        // Buff swamp monsters and yeti slightly for high end challenge value!
        if (biome === 'swamp') {
          baseHp = Math.floor(baseHp * 1.2);
          baseAtk += 1;
        } else if (biome === 'tundra' && type === EnemyType.OrcBrute) {
          baseHp = Math.floor(baseHp * 1.3); // Yeti is extra bulky!
        }

        // Apply scale difficulty more based on playerStats and weapon in hand
        let playerScaleCoeff = 1.0;
        if (playerStats) {
          const pLevel = playerStats.level || 1;
          const totalStats = (playerStats.str || 10) + 
                              (playerStats.dex || 10) + 
                              (playerStats.int || 10) + 
                              (playerStats.cha || 10) + 
                              (playerStats.lck || 10);
          const statExcess = Math.max(0, totalStats - 50);
          const statBonusFactor = statExcess * 0.01; // +1% per allocated stat point
          const levelBonusFactor = Math.max(0, pLevel - 1) * 0.05; // +5% per level above level 1
          playerScaleCoeff += levelBonusFactor + statBonusFactor;
        }
        
        if (currentWeapon) {
          const weaponVal = Math.max(0, currentWeapon.damage || 0);
          const weaponBonusFactor = weaponVal * 0.02; // +2% per weapon damage point
          playerScaleCoeff += weaponBonusFactor;
        }

        // Overworld scale factor: scale HP smoothly, but damp attack scaling to prevent 1-shots
        baseHp = Math.round(baseHp * playerScaleCoeff);
        const atkScaleCoeff = 1.0 + (playerScaleCoeff - 1.0) * 0.35;
        baseAtk = Math.round(baseAtk * atkScaleCoeff);
        baseDef = Math.round(baseDef * atkScaleCoeff);

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
          range: template.range !== undefined ? template.range : (type === EnemyType.Dragon ? 3 : (type === EnemyType.SkeletonMage ? 4 : 1)),
          speed: template.speed !== undefined ? template.speed : 1,
          color,
          char,
          state: EnemyState.Patrolling,
          isBoss: type === EnemyType.Otso || type === EnemyType.Louhi || type === EnemyType.IkuTurso,
          isElite: prng(mx, my, 25) > 0.88,
          eliteEffect: prng(mx, my, 25) > 0.88 ? 'Scurrying' : undefined,
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
          playerStats ? { ...playerStats, hp: 100, maxHp: 100, mp: 20, maxMp: 20, turnsPlayed: 0, str: playerStats.str, dex: playerStats.dex, int: playerStats.int, cha: playerStats.cha, lck: playerStats.lck, level: playerStats.level, gold: 0, xp: 0, atk: 10, def: 5 } : undefined,
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
