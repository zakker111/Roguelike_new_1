import { TileType, NPC, Enemy, Trap, Chest, EnemyType, EnemyState, TrapType } from "../../types";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from "../itemsData";
import { getEnemyTemplate } from "../dungeon";
import townTemplates from "../../data/townTemplates.json";
import {
  prng,
  getBuildingCoordinates,
  buildModularTownSquare,
  buildCastleKeep,
  findNearestSafeNpcTile,
} from "./overworldCore";
import {
  buildHouse,
  decorateBuildingFromJSON,
  parseCoord,
} from "../../world/structureGenerators";
import { OverworldGenContext } from "./types";

export function generateTownChunk(ctx: OverworldGenContext): void {
  const {
    chunkX,
    chunkY,
    width,
    height,
    spawnedCats,
    spawnedSeppo,
    map,
    npcs,
    enemies,
    chests,
    dungeons,
    towns,
    townName,
    isPortTown,
    isCastleTown,
  } = ctx;
  let { secondFloorMap, secondFloorDiscovered, secondFloorVisible } = ctx;

    // GENERATE A TOWN CHUNK
    towns.push({ x: Math.floor(width / 2), y: Math.floor(height / 2), name: townName });

    // Lay down paths/roads (horizontal and vertical crossroad in the town center)
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);

    for (let x = 0; x < width; x++) {
      map[midY][x] = TileType.Path;
      if (midY + 1 < height) map[midY + 1][x] = TileType.Path;
    }
    for (let y = 0; y < height; y++) {
      map[y][midX] = TileType.Path;
      if (midX + 1 < width) map[y][midX + 1] = TileType.Path;
    }

    // Place dynamic modular central town square
    buildModularTownSquare(map, midX, midY, chunkX * 7 + chunkY * 13);

    // Add wooden town Signpost next to the road intersection
    map[midY - 1][midX + 2] = TileType.Sign;

    // Build houses from dynamic JSON-configured templates
    let housesList = getBuildingCoordinates(width, height, chunkX, chunkY);

    // Apply deterministic building size & position shifts per chunk town!
    // This perfectly fulfills "make the villager buildings vary on size"
    housesList = housesList.map((building) => {
      // Create a deterministic hash seed for the building on this chunk
      const bHash1 = prng(chunkX, chunkY, building.id.charCodeAt(0) * 11);
      const bHash2 = prng(chunkX, chunkY, (building.id.charCodeAt(building.id.length - 1) || 99) * 19);

      const shiftX = Math.floor(bHash1 * 7) - 3; // -3 to +3
      const shiftY = Math.floor(bHash2 * 5) - 2; // -2 to +2
      const sizeW = Math.floor(bHash1 * 4) - 1; // -1 to +2
      const sizeH = Math.floor(bHash2 * 3) - 1; // -1 to +1

      let w = Math.max(5, Math.min(14, building.w + sizeW));
      let h = Math.max(4, Math.min(10, building.h + sizeH));

      // Make sure the tavern is always somewhat wide and barracks matches
      if (building.id === 'tavern') {
        w = Math.max(12, Math.min(16, building.w + sizeW));
        h = Math.max(6, Math.min(10, building.h + sizeH));
      } else if (building.id === 'barracks') {
        w = Math.max(12, Math.min(16, building.w + sizeW));
        h = Math.max(5, Math.min(9, building.h + sizeH));
      }

      const x = Math.max(4, Math.min(width - w - 4, building.x + shiftX));
      const y = Math.max(3, Math.min(height - h - 3, building.y + shiftY));

      return {
        ...building,
        x,
        y,
        w,
        h
      };
    });

    // Ensure every town has an empty guild house marked by a sign
    housesList.push({
      id: 'empty_guild_house',
      name: 'Empty Guild House (Reserved)',
      x: 38,
      y: 4,
      w: 8,
      h: 7
    });

    // Determine which buildings have second floors deterministically
    const secondFloorBuildings = new Set<string>();
    housesList.forEach((h: any) => {
      const hasSecond = h.id === 'tavern' || h.id === 'library' || (prng(chunkX, chunkY, h.x * 2 + h.y * 5) > 0.45 && h.id !== 'empty_guild_house');
      if (hasSecond) {
        secondFloorBuildings.add(h.id);
      }
    });

    secondFloorMap = Array(height)
      .fill(null)
      .map(() => Array(width).fill(TileType.Empty));
    secondFloorDiscovered = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));
    secondFloorVisible = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));

    housesList.forEach((h: any) => {
      const has2nd = secondFloorBuildings.has(h.id);
      const target2ndMap = has2nd ? secondFloorMap : undefined;

      if (h.id === 'barracks' && isCastleTown) {
        buildCastleKeep(map, h.x, h.y, h.w, h.h, target2ndMap);
      } else {
        buildHouse(map, h.x, h.y, h.w, h.h, midY, h.id, target2ndMap);
      }
    });

    // If Castle Town, fortify with robust features!
    if (isCastleTown) {
      // 1. Massive surrounding walls (fully dynamic based on width/height boundaries)
      for (let y = 1; y <= height - 2; y++) {
        map[y][2] = TileType.Wall;
        map[y][width - 3] = TileType.Wall;
      }
      for (let x = 2; x <= width - 3; x++) {
        map[1][x] = TileType.Wall;
        map[height - 2][x] = TileType.Wall;
      }

      // 2. Heavy Gates with flanking towers
      // West Gate
      map[midY][2] = TileType.TownGate;
      map[midY + 1][2] = TileType.TownGate;
      map[midY - 1][1] = TileType.Wall; map[midY - 1][2] = TileType.Wall; map[midY - 1][3] = TileType.Wall;
      map[midY + 2][1] = TileType.Wall; map[midY + 2][2] = TileType.Wall; map[midY + 2][3] = TileType.Wall;

      // East Gate
      map[midY][width - 3] = TileType.TownGate;
      map[midY + 1][width - 3] = TileType.TownGate;
      map[midY - 1][width - 4] = TileType.Wall; map[midY - 1][width - 3] = TileType.Wall; map[midY - 1][width - 2] = TileType.Wall;
      map[midY + 2][width - 4] = TileType.Wall; map[midY + 2][width - 3] = TileType.Wall; map[midY + 2][width - 2] = TileType.Wall;

      // North Gate
      map[1][midX] = TileType.TownGate;
      map[1][midX + 1] = TileType.TownGate;
      map[0][midX - 1] = TileType.Wall; map[1][midX - 1] = TileType.Wall; map[2][midX - 1] = TileType.Wall;
      map[0][midX + 2] = TileType.Wall; map[1][midX + 2] = TileType.Wall; map[2][midX + 2] = TileType.Wall;

      // South Gate
      map[height - 2][midX] = TileType.TownGate;
      map[height - 2][midX + 1] = TileType.TownGate;
      map[height - 3][midX - 1] = TileType.Wall; map[height - 2][midX - 1] = TileType.Wall; map[height - 1][midX - 1] = TileType.Wall;
      map[height - 3][midX + 2] = TileType.Wall; map[height - 2][midX + 2] = TileType.Wall; map[height - 1][midX + 2] = TileType.Wall;

      // 3. Pave Central Courtyard (center-based bounds)
      for (let y = midY - 3; y <= midY + 3; y++) {
        for (let x = midX - 12; x <= midX + 12; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width && map[y][x] === TileType.Grass) {
            map[y][x] = TileType.Floor;
          }
        }
      }

      // Courtyard Torches
      map[midY - 2][midX - 2] = TileType.Torch;
      map[midY - 2][midX + 2] = TileType.Torch;
      map[midY + 2][midX - 2] = TileType.Torch;
      map[midY + 2][midX + 2] = TileType.Torch;
    }

    // If Harbor Port Town, sculpt detailed harbor basin, wooden piers, moored vessels, Harbor Master Hut, Fish Market & Crane staging
    if (isPortTown) {
      // 1. Sculpt Coastal Harbor Water Basin
      for (let y = 0; y < height; y++) {
        for (let x = width - 12; x < width; x++) {
          map[y][x] = TileType.Water;
        }
      }

      // 2. Main Central Pier & Quay Promenade
      for (let x = width - 15; x < width - 1; x++) {
        map[midY - 2][x] = TileType.Path;
        map[midY - 1][x] = TileType.Path;
      }
      // Pier head quay
      for (let y = midY - 3; y <= midY; y++) {
        for (let x = width - 5; x <= width - 2; x++) {
          map[y][x] = TileType.Path;
        }
      }
      map[midY - 2][width - 2] = TileType.Torch; // Pier head beacon lantern

      // 3. North Pier & Moored Vessel ("HMS Tidebreaker")
      for (let x = width - 12; x <= width - 3; x++) {
        map[midY - 7][x] = TileType.Path;
      }
      map[midY - 7][width - 3] = TileType.Sign; // Mooring Sign

      // Vessel 1 hull/deck (HMS Tidebreaker)
      for (let vx = width - 6; vx <= width - 2; vx++) {
        for (let vy = midY - 10; vy <= midY - 8; vy++) {
          if (vy >= 0 && vy < height && vx >= 0 && vx < width) {
            map[vy][vx] = TileType.Floor; // Wooden Ship Deck
          }
        }
        if (midY - 11 >= 0) map[midY - 11][vx] = TileType.Wall; // Vessel Bow/Stern railing
      }
      if (midY - 9 >= 0) {
        map[midY - 9][width - 4] = TileType.Torch; // Ship Mast lantern
        map[midY - 9][width - 5] = TileType.Table; // Deck Cargo crate
      }
      if (midY - 8 >= 0) map[midY - 8][width - 3] = TileType.Sign; // HMS Tidebreaker Banner

      // 4. South Pier & Moored Vessel ("The Salty Siren")
      for (let x = width - 12; x <= width - 3; x++) {
        if (midY + 5 < height) map[midY + 5][x] = TileType.Path;
      }
      if (midY + 5 < height) map[midY + 5][width - 3] = TileType.Sign; // Mooring Sign

      // Vessel 2 hull/deck (The Salty Siren)
      for (let vx = width - 6; vx <= width - 2; vx++) {
        for (let vy = midY + 7; vy <= midY + 9; vy++) {
          if (vy >= 0 && vy < height && vx >= 0 && vx < width) {
            map[vy][vx] = TileType.Floor;
          }
        }
        if (midY + 10 < height) map[midY + 10][vx] = TileType.Wall;
      }
      if (midY + 8 < height) {
        map[midY + 8][width - 4] = TileType.Campfire; // Ship Stove / Deck Fire
        map[midY + 8][width - 5] = TileType.Table; // Fish Barrel crate
      }
      if (midY + 7 < height) map[midY + 7][width - 3] = TileType.Sign; // The Salty Siren Banner

      // 5. Harbor Master Hut (x: width - 18 to width - 13, y: midY - 8 to midY - 4)
      const hmX = width - 18;
      const hmY = midY - 8;
      const hmW = 6;
      const hmH = 5;
      for (let hy = hmY; hy < hmY + hmH; hy++) {
        for (let hx = hmX; hx < hmX + hmW; hx++) {
          if (hy >= 0 && hy < height && hx >= 0 && hx < width) {
            if (hy === hmY || hy === hmY + hmH - 1 || hx === hmX || hx === hmX + hmW - 1) {
              map[hy][hx] = TileType.Wall;
            } else {
              map[hy][hx] = TileType.Floor;
            }
          }
        }
      }
      if (hmY + 2 < height && hmX + hmW - 1 < width) map[hmY + 2][hmX + hmW - 1] = TileType.Door; // Door facing east towards docks
      if (hmY + 1 < height) {
        map[hmY + 1][hmX + 2] = TileType.Table; // Harbor Master Desk
        map[hmY + 1][hmX + 1] = TileType.Chair;
      }
      if (hmY + 3 < height) {
        map[hmY + 3][hmX + 1] = TileType.Bed;
        map[hmY + 3][hmX + 3] = TileType.Torch;
      }
      if (hmY + 2 < height) map[hmY + 2][hmX + hmW] = TileType.Sign; // "⚓ Harbor Master Command Hut"

      // 6. Fish Market & Fishmonger Stalls (x: width - 18 to width - 13, y: midY + 2 to midY + 6)
      const fmX = width - 18;
      const fmY = midY + 2;
      for (let fy = fmY; fy < fmY + 4; fy++) {
        for (let fx = fmX; fx < fmX + 5; fx++) {
          if (fy >= 0 && fy < height && fx >= 0 && fx < width) {
            map[fy][fx] = TileType.Floor;
          }
        }
      }
      if (fmY + 1 < height) map[fmY + 1][fmX + 1] = TileType.Table; // Fresh Fish Display Stall
      if (fmY + 2 < height) map[fmY + 2][fmX + 1] = TileType.Table; // Salted Cod Barrel Counter
      if (fmY + 1 < height) map[fmY + 1][fmX + 3] = TileType.Campfire; // Fish Smokehouse
      if (fmY < height) map[fmY][fmX + 2] = TileType.Sign; // "🐟 Harbor Fresh Catch & Salted Fish Market"

      // 7. Harbor Loading Crane & Cargo Staging Area
      if (midY - 4 >= 0) {
        map[midY - 4][width - 11] = TileType.Table; // Cargo Box 1
        map[midY - 4][width - 10] = TileType.Table; // Cargo Box 2
      }
      if (midY - 3 >= 0) {
        map[midY - 3][width - 11] = TileType.Anvil; // Dock Crane Mooring Winch
        map[midY - 3][width - 10] = TileType.Torch; // Loading Beacon
      }
    }

    // Spawn modular defense force of guards
    const barracksHouse = housesList.find((h: any) => h.id === 'barracks') || housesList[5] || { x: 18, y: height - 11, w: 14, h: 8 };

    // Explicitly place bed tiles in map inside the barracks house so guards have beds to sleep in!
    if (barracksHouse && map) {
      const bY = barracksHouse.y + 1;
      if (bY > 0 && bY < map.length - 1) {
        [2, 4, 6, 8].forEach(offsetX => {
          const bX = barracksHouse.x + offsetX;
          if (bX > 0 && bX < map[0].length - 1) {
            map[bY][bX] = TileType.Bed;
          }
        });
      }
    }

    const bBed1 = { x: barracksHouse.x + 2, y: barracksHouse.y + 1 };
    const bBed2 = { x: barracksHouse.x + 4, y: barracksHouse.y + 1 };
    const bBed3 = { x: barracksHouse.x + 6, y: barracksHouse.y + 1 };

    if (isCastleTown) {
      const blacksmithHouse = housesList.find((h: any) => h.id === 'blacksmith') || housesList[0];

      // Defenses with Archers (bowers), Swordsmen, and Crossbowmen (fully relative)
      const guardPositions = [
        { x: 3, y: midY - 2, role: 'Archer', name: 'Castle Archer Sentry', shift: 'sentry' as const, bed: bBed1 },
        { x: width - 6, y: midY - 2, role: 'Archer', name: 'Castle Archer Sentry', shift: 'sentry' as const, bed: bBed2 },
        { x: midX - 3, y: 3, role: 'Crossbowman', name: 'Gate Crossbow Sentry', shift: 'sentry' as const, bed: bBed3 },
        { x: midX + 3, y: height - 4, role: 'Crossbowman', name: 'Gate Crossbow Sentry', shift: 'sentry' as const, bed: bBed1 },
        { x: midX - 4, y: midY, role: 'Swordsman', name: 'Courtyard Day Guard', shift: 'day' as const, bed: bBed2 },
        { x: barracksHouse.x + 4, y: barracksHouse.y - 1, role: 'Swordsman', name: 'Keep Night Guard', shift: 'night' as const, bed: bBed3 }
      ];

      guardPositions.forEach((g, idx) => {
        let hp = 45;
        let atk = 6;
        let def = 4;
        let range = 1;
        let speed = 1;
        let color = '#3b82f6';
        let char = '🛡';

        if (g.role === 'Archer') {
          hp = 42;
          atk = 8;
          def = 3;
          range = 4;
          speed = 1;
          color = '#10b981'; // Emerald bower
          char = '🏹';
        } else if (g.role === 'Crossbowman') {
          hp = 52;
          atk = 12;
          def = 4;
          range = 3;
          speed = 2; // slow power shots
          color = '#a855f7'; // Purple crossbow
          char = '🏹';
        } else {
          // Swordsman
          hp = 65;
          atk = 9;
          def = 7;
          range = 1;
          speed = 1;
          color = '#2563eb'; // Deep Blue swordsman
          char = '⚔️';
        }

        enemies.push({
          id: `castle_guard_${chunkX}_${chunkY}_${idx + 1}`,
          x: g.x,
          y: g.y,
          type: EnemyType.Goblin, // uses goblin AI pathfinding
          name: g.name,
          hp,
          maxHp: hp,
          atk,
          def,
          range,
          speed,
          color,
          char,
          originalChar: char,
          state: EnemyState.Patrolling,
          isElite: false,
          shift: g.shift,
          barracksBed: g.bed,
          patrolPath: [
            { x: g.x, y: g.y },
            { x: g.x + (g.role === 'Swordsman' ? 6 : 2), y: g.y },
            { x: g.x, y: g.y },
            { x: g.x - (g.role === 'Swordsman' ? 6 : 2), y: g.y }
          ],
          patrolIndex: 0,
          debuffs: [],
          isTownGuard: true
        } as any);
      });
    } else {
      // Spawn standard simple village guards (Oakhaven and Vanguard harbor)
      enemies.push({
        id: `town_guard_${chunkX}_${chunkY}_1`,
        x: midX - 3,
        y: midY,
        type: EnemyType.Goblin,
        name: "Day Patrol Guard",
        hp: 45,
        maxHp: 45,
        atk: 6,
        def: 4,
        range: 1,
        speed: 1,
        color: '#3b82f6', // bright guard blue
        char: '🛡',
        originalChar: '🛡',
        state: EnemyState.Patrolling,
        isElite: false,
        shift: 'day',
        barracksBed: bBed1,
        patrolPath: [
          { x: midX - 8, y: midY },
          { x: midX + 8, y: midY },
          { x: midX, y: midY - 4 },
          { x: midX, y: midY + 4 }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);

      enemies.push({
        id: `town_guard_${chunkX}_${chunkY}_2`,
        x: midX + 3,
        y: midY + 1,
        type: EnemyType.Goblin,
        name: "Night Patrol Guard",
        hp: 45,
        maxHp: 45,
        atk: 6,
        def: 4,
        range: 1,
        speed: 1,
        color: '#3b82f6',
        char: '🛡',
        originalChar: '🛡',
        state: EnemyState.Patrolling,
        isElite: false,
        shift: 'night',
        barracksBed: bBed2,
        patrolPath: [
          { x: midX + 5, y: midY + 5 },
          { x: midX - 5, y: midY - 5 },
          { x: midX + 5, y: midY - 5 },
          { x: midX - 5, y: midY + 5 }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);

      enemies.push({
        id: `town_guard_${chunkX}_${chunkY}_3`,
        x: midX,
        y: midY + 5,
        type: EnemyType.Goblin,
        name: "Gate Sentry",
        hp: 50,
        maxHp: 50,
        atk: 7,
        def: 5,
        range: 1,
        speed: 1,
        color: '#2563eb',
        char: '🛡',
        originalChar: '🛡',
        state: EnemyState.Patrolling,
        isElite: false,
        shift: 'sentry',
        barracksBed: bBed3,
        patrolPath: [
          { x: midX - 3, y: midY + 5 },
          { x: midX + 3, y: midY + 5 }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);
    }

    // Spawn town NPCs
    const getNpcHomeCoords = (house: any, defaultOffsetX = 3, defaultOffsetY = 1) => {
      if (secondFloorBuildings.has(house.id)) {
        return {
          homeX: house.x + house.w - 2,
          homeY: house.y + 1,
          homeZ: 1
        };
      }
      return {
        homeX: house.x + defaultOffsetX,
        homeY: house.y + defaultOffsetY,
        homeZ: 0
      };
    };

    // 1. Blacksmith
    const blacksmithHomeIsShop = prng(chunkX, chunkY, 1111) > 0.4; // 60% chance home is shop
    const blacksmithHouse = housesList.find((h: any) => h.id === 'blacksmith') || housesList[0];
    const blacksmithWorkX = blacksmithHomeIsShop
      ? blacksmithHouse.x + 4
      : midX - 3; // stands next to anvil/forge outside
    const blacksmithWorkY = blacksmithHomeIsShop
      ? blacksmithHouse.y + 4
      : midY - 3;

    const bsHome = getNpcHomeCoords(blacksmithHouse, 3, 1);

    npcs.push({
      id: `npc_blacksmith_${chunkX}_${chunkY}`,
      name: 'Grom Garison (Blacksmith)',
      role: 'blacksmith',
      char: 'B',
      originalChar: 'B',
      color: '#fb923c', // orange color
      x: blacksmithHouse.x + 3, // active start
      y: blacksmithHouse.y + 3,
      z: 0,
      homeX: bsHome.homeX,
      homeY: bsHome.homeY,
      homeZ: bsHome.homeZ,
      workX: blacksmithWorkX,
      workY: blacksmithWorkY,
      workZ: 0,
      isHomeSameAsShop: blacksmithHomeIsShop,
      scheduleState: 'work',
      dialogue: [
        "Hey there! Need some heavy alloys? Mastercraft weapons are my specialty.",
        blacksmithHomeIsShop
          ? "My shop is also my home! I live in the back of this foundry so I can hammer steel at all hours."
          : "I live in the local stone house over there and walk to the town forge every single morning.",
        "Ah, the soot and heat... nothing beats working at the anvil.",
        "Zzz... No more orders tonight, let me sleep..."
      ]
    });

    // 2. Traveling Merchant (lives in Tavern & Inn)
    const tavernHouse = housesList.find((h: any) => h.id === 'tavern') || housesList[0];
    const merchantHomeIsShop = prng(chunkX, chunkY, 2222) > 0.5; // 50% chance her home is her shop
    const merchantHouse = merchantHomeIsShop
      ? (housesList.find((h: any) => h.id === 'villager1' || h.id === 'villager2') || tavernHouse)
      : tavernHouse;
    const merchantWorkX = merchantHomeIsShop
      ? merchantHouse.x + 4
      : midX + 3; // Stands at town square kiosk
    const merchantWorkY = merchantHomeIsShop
      ? merchantHouse.y + 4
      : midY - 2;

    const merHome = getNpcHomeCoords(merchantHouse, 3, 1);

    npcs.push({
      id: `npc_merchant_${chunkX}_${chunkY}`,
      name: 'Adelia Rose (Merchant)',
      role: 'merchant',
      char: 'M',
      originalChar: 'M',
      color: '#f43f5e', // rose crimson
      x: merchantHouse.x + 3,
      y: merchantHouse.y + 3,
      z: 0,
      homeX: merHome.homeX,
      homeY: merHome.homeY,
      homeZ: merHome.homeZ,
      workX: merchantWorkX,
      workY: merchantWorkY,
      workZ: 0,
      isHomeSameAsShop: merchantHomeIsShop,
      scheduleState: 'work',
      dialogue: [
        "Greetings, adventurer! Looking to trade? I sell rare armors, shields, and raw ores.",
        merchantHomeIsShop
          ? "This cozy cottage is both my home and my shop! I love living and selling under one roof."
          : "I rent a bed upstairs at the Tavern & Inn, then hike down here to my town square kiosk to sell goods.",
        "Deeper monsters carry spectacular loot. Bring me the scraps!",
        "Zzz... The shop is closed, come back in the morning."
      ]
    });

    // 3. Apothecary / Sage (lives in Apothecary Shop)
    const apothecaryHomeIsShop = prng(chunkX, chunkY, 3333) > 0.3; // 70% chance his home is his shop
    const apothecaryHouse = housesList.find((h: any) => h.id === 'apothecary') || housesList[1];
    const apothecaryWorkX = apothecaryHomeIsShop
      ? apothecaryHouse.x + 4
      : midX + 4;
    const apothecaryWorkY = apothecaryHomeIsShop
      ? apothecaryHouse.y + 4
      : midY + 3;

    const apoHome = getNpcHomeCoords(apothecaryHouse, 3, 1);

    npcs.push({
      id: `npc_apothecary_${chunkX}_${chunkY}`,
      name: 'Valerius of the Markwell',
      role: 'apothecary',
      char: 'A',
      originalChar: 'A',
      color: '#a855f7', // purple
      x: apothecaryHouse.x + 3,
      y: apothecaryHouse.y + 3,
      z: 0,
      homeX: apoHome.homeX,
      homeY: apoHome.homeY,
      homeZ: apoHome.homeZ,
      workX: apothecaryWorkX,
      workY: apothecaryWorkY,
      workZ: 0,
      isHomeSameAsShop: apothecaryHomeIsShop,
      scheduleState: 'work',
      dialogue: [
        "Dungeons are filled with dangerous gas and spikes... Drink a health potion to recover!",
        apothecaryHomeIsShop
          ? "This alchemical lab is my home! The scent of boiling mushrooms helps me sleep."
          : "I live here at the Apothecary, but walk over to my town square alchemy stand to sell daily.",
        "Have you seen the strange ruins out north?",
        "Zzz... Dreaming of spellcraft and starflowers..."
      ]
    });

    // 3.5 Tavern Master (InnkeeperBarnaby - lives & works in Tavern)
    npcs.push({
      id: `npc_tavernmaster_${chunkX}_${chunkY}`,
      name: 'Innkeeper Barnaby',
      role: 'tavern_master' as any,
      char: 'T',
      originalChar: 'T',
      color: '#f59e0b', // warm golden yellow
      x: tavernHouse.x + 3,
      y: tavernHouse.y + 3,
      z: 0,
      homeX: tavernHouse.x + tavernHouse.w - 2,
      homeY: tavernHouse.y + 2,
      homeZ: 1,
      workX: tavernHouse.x + 5, // stands at the counter in Tavern
      workY: tavernHouse.y + 4,
      workZ: 0,
      isHomeSameAsShop: true,
      scheduleState: 'work',
      dialogue: [
        "Warm hearth, cold beer! Come take a rest, or browse our fresh baked goods!",
        "My home is the Tavern itself! I live in the back room and run the counter all day.",
        "Drunk brawls spill from the tavern quite often, keep an eye on active overworld events!",
        "Zzz... Sweep the floor for me, will you..."
      ]
    });

    // 3.6 Drunk Villager inside the Tavern/Inn
    const isDrunkSpawned = prng(chunkX, chunkY, 1234) > 0.25; // 75% chance to spawn a drunk villager
    if (isDrunkSpawned) {
      const drunkNames = ['Drunk Seppo', 'Uncle Pete', 'Tipsy Toby', 'Loud Larry', 'Drunken Miller', 'Oakhaven Stumbler'];
      const drunkName = drunkNames[Math.floor(prng(chunkX, chunkY, 5678) * drunkNames.length)];
      npcs.push({
        id: `npc_drunkvillager_${chunkX}_${chunkY}`,
        name: `${drunkName} (Drunk Patron)`,
        role: 'drunk_villager' as any,
        char: '🥴',
        originalChar: '🥴',
        color: '#f43f5e', // Flush pink
        x: tavernHouse.x + 2,
        y: tavernHouse.y + 3,
        z: 0,
        homeX: tavernHouse.x + 2,
        homeY: tavernHouse.y + 1,
        homeZ: 1,
        workX: tavernHouse.x + 2,
        workY: tavernHouse.y + 3,
        workZ: 0,
        scheduleState: 'leisure',
        dialogue: [
          "Thiss tavern... is... spinny! Wait, is that a giant salmon in your pocket? Hic!",
          "I bet my left boot that Tobias is actually two goblins in a heavy leather trench coat!",
          "Another pint of that glowing lavender brew, Barnaby! *Burps*",
          "Zzz... No more tavern brawls... *mumbles about catalyst gems*"
        ]
      });
    }

    // 4. Strolling Villager (lives in Villager Cottage Left)
    const villagerHouse = housesList.find((h: any) => h.id === 'villager1') || housesList[3];
    const vilHome = getNpcHomeCoords(villagerHouse, 3, 1);

    npcs.push({
      id: `npc_villager_${chunkX}_${chunkY}`,
      name: 'Pip (Town Crier)',
      role: 'villager',
      char: 'V',
      originalChar: 'V',
      color: '#38bdf8', // sky blue
      x: villagerHouse.x + 3,
      y: villagerHouse.y + 3,
      z: 0,
      homeX: vilHome.homeX,
      homeY: vilHome.homeY,
      homeZ: vilHome.homeZ,
      workX: midX - 4, // strolls near crossroad
      workY: midY + 4,
      workZ: 0,
      scheduleState: 'work',
      dialogue: [
        "Hear ye, hear ye! Caves have appeared to the east and south!",
        "They say the dungeon crawls run 5 floors deep and contain a Forge Artifact!",
        "I love Oakhaven. It's safe... as long as we keep the town gates locked.",
        "Zzz... Just five more minutes..."
      ]
    });

    // 5. Town Notice Quest Board
    npcs.push({
      id: `npc_questboard_${chunkX}_${chunkY}`,
      name: 'Quest Board',
      role: 'quest_board' as any,
      char: '▤',
      originalChar: '▤',
      color: '#fbbf24', // amber yellow
      x: midX,
      y: midY - 2,
      z: 0,
      homeX: midX,
      homeY: midY - 2,
      homeZ: 0,
      workX: midX,
      workY: midY - 2,
      workZ: 0,
      scheduleState: 'work',
      dialogue: [
        "A heavy wooden post-board with pinned letters and bounty notices."
      ]
    });

    // 6. Recruitable blade companion (lives in Villager Cottage Right)
    const companionHouse = housesList.find((h: any) => h.id === 'villager2') || housesList[4];
    const isGuard = (Math.abs(chunkX + chunkY) % 2 === 0);
    const compHome = getNpcHomeCoords(companionHouse, 3, 1);

    npcs.push({
      id: `npc_companion_${chunkX}_${chunkY}`,
      name: isGuard ? 'Arne (Shield Guard)' : 'Sade (Agile Thief)',
      role: 'companion_hire' as any,
      char: isGuard ? '🛡' : '🗡',
      originalChar: isGuard ? '🛡' : '🗡',
      color: isGuard ? '#60a5fa' : '#34d399',
      x: companionHouse.x + 3,
      y: companionHouse.y + 3,
      z: 0,
      homeX: compHome.homeX,
      homeY: compHome.homeY,
      homeZ: compHome.homeZ,
      workX: midX + 2,
      workY: midY + 4,
      workZ: 0,
      scheduleState: 'leisure',
      dialogue: isGuard
        ? ["I can watch your back and block blows. Hire me for 180 Gold!"]
        : ["Need lockpicks and critical backstabs? I can tag along for 180 Gold."]
    });

    // 6.5 Spawning of legendary cats: Jekku, Pulla, Alli, Leevi (only if they have not been spawned yet in this gameplay)
    const catRoll = prng(chunkX, chunkY, 7772);
    const activeSpawnedCats = spawnedCats || [];
    
    if (catRoll < 0.015 && !activeSpawnedCats.includes('Jekku')) {
      npcs.push({
        id: `npc_cat_jekku`,
        name: 'Jekku (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#fb923c', // Orange
        x: midX - 2,
        y: midY + 1,
        homeX: midX - 2,
        homeY: midY + 1,
        workX: midX - 1,
        workY: midY + 2,
        scheduleState: 'leisure',
        dialogue: [
          "*Meow!* I am Jekku, the elusive orange trickster. I can guide your steps and keep you company!",
          "*Mew!* Let me join your party! I won't eat much scrap wood, I promise!",
          "*Purr...* (Nudges your ankles softly and chirps happily)"
        ]
      });
    } else if (catRoll >= 0.015 && catRoll < 0.030 && !activeSpawnedCats.includes('Pulla')) {
      npcs.push({
        id: `npc_cat_pulla`,
        name: 'Pulla (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#eab308', // Yellow / Cinnamon
        x: midX + 2,
        y: midY + 1,
        homeX: midX + 2,
        homeY: midY + 1,
        workX: midX + 1,
        workY: midY + 2,
        scheduleState: 'leisure',
        dialogue: [
          "*Prrrt!* I am Pulla, the chubby golden companion. Let's explore together!",
          "*Meow...* Do you have any fresh grilled fish? Just kidding, I'll follow you anyway!",
          "*Purr...* (Rolls over showing a fluffy, warm belly)"
        ]
      });
    } else if (catRoll >= 0.030 && catRoll < 0.045 && !activeSpawnedCats.includes('Alli')) {
      npcs.push({
        id: `npc_cat_alli`,
        name: 'Alli (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#cbd5e1', // Slate gray / Silver
        x: midX,
        y: midY + 2,
        homeX: midX,
        homeY: midY + 2,
        workX: midX,
        workY: midY + 3,
        scheduleState: 'leisure',
        dialogue: [
          "*Miau!* I am Alli, the mystical silver cat. The depths hold no fear for me.",
          "*Meow!* I can follow you into the dark abyss. Shall we go?",
          "*Purr...* (Blinks slowly with wise, glowing eyes)"
        ]
      });
    } else if (catRoll >= 0.045 && catRoll < 0.060 && !activeSpawnedCats.includes('Leevi')) {
      npcs.push({
        id: `npc_cat_leevi`,
        name: 'Leevi (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#f43f5e', // Crimson / Angry Red
        x: midX,
        y: midY - 2,
        homeX: midX,
        homeY: midY - 2,
        workX: midX + 1,
        workY: midY - 1,
        scheduleState: 'leisure',
        dialogue: [
          "*Hiss!* I am Leevi, the eternally angry cat. Touch me and you lose a finger!",
          "*Growl...* What are you staring at, adventurer? Fine, I'll follow you. But don't expect any cuddles!",
          "*Mrowr!* (Glares at you with intense, fiery yellow eyes and swishes his tail aggressively)"
        ]
      });
    }

    // 7. Nautical Population & Harbor Master Command Force
    if (isPortTown) {
      // 7.1 Harbor Master Captain Jack
      npcs.push({
        id: `npc_captain_${chunkX}_${chunkY}`,
        name: 'Captain Jack (Harbor Master)',
        role: 'harbor_master' as any,
        char: '⚓',
        color: '#2dd4bf', // teal
        x: width - 16,
        y: midY - 6,
        homeX: width - 17,
        homeY: midY - 5,
        workX: width - 16,
        workY: midY - 6,
        scheduleState: 'work',
        dialogue: [
          "Ahoy, traveler! I oversee vessel registrations, nautical charts, and sea port logistics.",
          "Looking for fresh salted cod, whale oil, or coastal sea charts? Check our harbor inventory!",
          "I can also arrange ferried passage across the coastal bays for 200 Gold.",
          "Zzz... Restful sleep after a day at the harbor desk..."
        ]
      });

      // 7.2 Fishmonger Finnegan
      npcs.push({
        id: `npc_fishmonger_${chunkX}_${chunkY}`,
        name: 'Finnegan (Fishmonger)',
        role: 'fishmonger' as any,
        char: '🐟',
        color: '#38bdf8', // cyan
        x: width - 16,
        y: midY + 3,
        homeX: width - 16,
        homeY: midY + 3,
        workX: width - 16,
        workY: midY + 3,
        scheduleState: 'work',
        dialogue: [
          "Fresh harbor catch and salted ocean cod! Direct from the fishing trawlers!",
          "Inland desert merchants pay massive gold for salted cod. Stock up before you travel!",
          "Smell that fresh ocean breeze? Nothing better than a early morning catch.",
          "Zzz... The fish stop biting at night..."
        ]
      });

      // 7.3 Dockworker Bram
      npcs.push({
        id: `npc_dockworker_${chunkX}_${chunkY}`,
        name: 'Bram (Dockworker)',
        role: 'dockworker' as any,
        char: '📦',
        color: '#f59e0b', // amber
        x: width - 11,
        y: midY - 3,
        homeX: width - 11,
        homeY: midY - 3,
        workX: width - 11,
        workY: midY - 3,
        scheduleState: 'work',
        dialogue: [
          "Heave-ho! Heavy barrels of ship pitch and refined whale oil coming off the ships!",
          "We operate the harbor cranes day and night to keep international trade moving.",
          "Watch your step on the wet wooden pier planks—they're slick with ocean spray!",
          "Zzz... My shoulders ache from carrying iron anchors..."
        ]
      });

      // 7.4 Old Sailor Seabert
      npcs.push({
        id: `npc_sailor_${chunkX}_${chunkY}`,
        name: 'Seabert (Old Sailor)',
        role: 'sailor' as any,
        char: '⛵',
        color: '#a78bfa', // purple
        x: width - 4,
        y: midY - 9,
        homeX: width - 4,
        homeY: midY - 9,
        workX: width - 4,
        workY: midY - 9,
        scheduleState: 'work',
        dialogue: [
          "Ahoy! The HMS Tidebreaker is tied up at the north pier after battling heavy fog.",
          "I've sailed from glacial northern tundras to scorching desert reef bays. Sunder's waters are wild!",
          "Need waterproof ship pitch for your boots or gear? I've got spare jars.",
          "Zzz... Rocked to sleep by gentle ocean waves..."
        ]
      });

      // 7.5 Ferried Navigator Corin
      npcs.push({
        id: `npc_ferried_nav_${chunkX}_${chunkY}`,
        name: 'Corin (Ferried Navigator)',
        role: 'ferried_navigator' as any,
        char: '🧭',
        color: '#10b981', // emerald
        x: width - 3,
        y: midY - 2,
        homeX: width - 3,
        homeY: midY - 2,
        workX: width - 3,
        workY: midY - 2,
        scheduleState: 'work',
        dialogue: [
          "Greetings, traveler! I pilot the ferried passage between Vanguard Harbor and East Port for 200 Gold.",
          "My nautical sea charts plot every safe channel around coastal reefs and whirlpools.",
          "Speak to me whenever you are ready to set sail!",
          "Zzz... Anchored until daybreak..."
        ]
      });
    }

    // Add visual touch: place anvils and merchant shop stalls in town center near paths
    map[midY - 3][midX - 3] = TileType.Floor; // Forge floor
    map[midY - 2][midX + 3] = TileType.Floor; // Market zone

    // Spawn low-level town pests in the outskirts of the town (safe from immediate village guard agro)
    // This allows players to kill simple low level monsters right away on the starting chunk!
    const outskirtPests = [
      { type: EnemyType.Rat, name: "Outskirt Sewer Rat", x: 6, y: 6 },
      { type: EnemyType.Slime, name: "Town Garden Slime", x: 8, y: height - 7 },
      { type: EnemyType.Goblin, name: "Stray Scavenger Goblin", x: width - 8, y: 7 },
      { type: EnemyType.Spider, name: "Stray Grass Spider", x: width - 7, y: height - 8 },
      { type: EnemyType.Rat, name: "Outskirt Field Mouse", x: 6, y: Math.floor(height / 2) - 4 },
      { type: EnemyType.Slime, name: "Stray Well Slime", x: width - 8, y: Math.floor(height / 2) + 5 }
    ];

    outskirtPests.forEach((pest, idx) => {
      // Find a safe spot near the ideal location (must be on TileType.Grass)
      let pxPos = pest.x;
      let pyPos = pest.y;
      let safeFound = false;

      // Search local area
      for (let r = 0; r < 5 && !safeFound; r++) {
        for (let dx = -r; dx <= r && !safeFound; dx++) {
          for (let dy = -r; dy <= r && !safeFound; dy++) {
            const tx = pxPos + dx;
            const ty = pyPos + dy;
            if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
              if (map[ty][tx] === TileType.Grass) {
                pxPos = tx;
                pyPos = ty;
                safeFound = true;
              }
            }
          }
        }
      }

      if (safeFound) {
        const template = getEnemyTemplate(pest.type);
        // Let's keep them very weak for the starting experience
        const baseHp = template.baseHp; 
        const baseAtk = template.baseAtk;
        const baseDef = template.baseDef;

        enemies.push({
          id: `town_pest_${chunkX}_${chunkY}_${idx}`,
          x: pxPos,
          y: pyPos,
          type: pest.type,
          name: pest.name,
          hp: baseHp,
          maxHp: baseHp,
          atk: baseAtk,
          def: baseDef,
          range: template.range !== undefined ? template.range : 1,
          speed: template.speed !== undefined ? template.speed : 1.0,
          color: template.color,
          char: template.char,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [
            { x: pxPos, y: pyPos },
            { x: Math.max(1, pxPos - 2), y: pyPos },
            { x: Math.max(1, pxPos - 2), y: Math.max(1, pyPos - 2) },
            { x: pxPos, y: Math.max(1, pyPos - 2) }
          ],
          patrolIndex: 0,
          debuffs: []
        } as any);
      }
    });

    // Place a dungeon entrance in town limits as well, or just in the wild! Let's put one to the east wild!
  ctx.secondFloorMap = secondFloorMap;
  ctx.secondFloorDiscovered = secondFloorDiscovered;
  ctx.secondFloorVisible = secondFloorVisible;
}