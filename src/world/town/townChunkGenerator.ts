/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../../types';
import { OverworldGenContext } from '../../utils/overworld/types';
import {
  prng,
  getBuildingCoordinates,
  buildModularTownSquare,
  buildCastleKeep,
  findNearestSafeNpcTile,
  isTileSafeForNpc,
} from '../../utils/overworld/overworldCore';
import { buildHouse } from '../structureGenerators';
import { generateTownHouseDecorProps } from '../../utils/decorEngine';
import { buildCastlePerimeterAndGates, buildPortHarborFeatures } from './townPerimeter';
import { setupBarracksBeds, spawnTownGuards } from './townGuards';
import { spawnTownNpcs } from './townNpcs';
import { spawnTownOutskirtPests } from './townOutskirts';

export function generateTownChunk(ctx: OverworldGenContext): void {
  const {
    chunkX,
    chunkY,
    width,
    height,
    spawnedCats,
    map,
    npcs,
    enemies,
    towns,
    townName,
    isPortTown,
    isCastleTown,
  } = ctx;
  let { secondFloorMap, secondFloorDiscovered, secondFloorVisible } = ctx;

  // 1. Register town location
  towns.push({ x: Math.floor(width / 2), y: Math.floor(height / 2), name: townName });

  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);

  // 2. Lay down crossroad paths
  for (let x = 0; x < width; x++) {
    map[midY][x] = TileType.Path;
    if (midY + 1 < height) map[midY + 1][x] = TileType.Path;
  }
  for (let y = 0; y < height; y++) {
    map[y][midX] = TileType.Path;
    if (midX + 1 < width) map[y][midX + 1] = TileType.Path;
  }

  // 3. Central Town Square & Signpost
  buildModularTownSquare(map, midX, midY, chunkX * 7 + chunkY * 13);
  map[midY - 1][midX + 2] = TileType.Sign;

  // 4. Calculate dynamic building positions & variations
  let housesList = getBuildingCoordinates(width, height, chunkX, chunkY);
  housesList = housesList.map((building) => {
    const bHash1 = prng(chunkX, chunkY, building.id.charCodeAt(0) * 11);
    const bHash2 = prng(chunkX, chunkY, (building.id.charCodeAt(building.id.length - 1) || 99) * 19);

    const shiftX = Math.floor(bHash1 * 7) - 3;
    const shiftY = Math.floor(bHash2 * 5) - 2;
    const sizeW = Math.floor(bHash1 * 4) - 1;
    const sizeH = Math.floor(bHash2 * 3) - 1;

    let w = Math.max(5, Math.min(14, building.w + sizeW));
    let h = Math.max(4, Math.min(10, building.h + sizeH));

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

  // Empty guild house reserved space
  housesList.push({
    id: 'empty_guild_house',
    name: 'Empty Guild House (Reserved)',
    x: 38,
    y: 4,
    w: 8,
    h: 7
  });

  // 5. Second Floor Detection
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

  // 6. Build Houses
  housesList.forEach((h: any) => {
    const has2nd = secondFloorBuildings.has(h.id);
    const target2ndMap = has2nd ? secondFloorMap : undefined;

    if (h.id === 'barracks' && isCastleTown) {
      buildCastleKeep(map, h.x, h.y, h.w, h.h, target2ndMap);
    } else {
      buildHouse(map, h.x, h.y, h.w, h.h, midY, h.id, target2ndMap);
    }
  });

  // 7. Fortifications & Perimeters
  if (isCastleTown) {
    buildCastlePerimeterAndGates(map, width, height, midX, midY);
  }

  // 8. Port Harbor Features
  if (isPortTown) {
    buildPortHarborFeatures(map, width, height, midX, midY);
  }

  // 9. Barracks Beds & Town Guards
  const barracksHouse = housesList.find((h: any) => h.id === 'barracks') || housesList[5] || { x: 18, y: height - 11, w: 14, h: 8 };
  setupBarracksBeds(map, barracksHouse);
  spawnTownGuards(enemies, chunkX, chunkY, width, height, midX, midY, !!isCastleTown, barracksHouse);

  // 10. Town NPCs
  spawnTownNpcs(npcs, chunkX, chunkY, width, height, midX, midY, housesList, secondFloorBuildings, !!isPortTown, spawnedCats);

  // 10b. Comprehensive NPC tile safety sanitization (strictly prevent spawning inside windows, walls, or solid obstacles)
  for (let i = 0; i < npcs.length; i++) {
    const npc = npcs[i];
    const targetMap = (npc.z === 1 && secondFloorMap) ? secondFloorMap : map;
    const currentTile = targetMap[npc.y]?.[npc.x];
    if (currentTile === TileType.Window || !isTileSafeForNpc(currentTile)) {
      const safePos = findNearestSafeNpcTile(npc.x, npc.y, targetMap);
      npc.x = safePos.x;
      npc.y = safePos.y;
    }
    if (npc.homeX !== undefined && npc.homeY !== undefined) {
      const homeMap = (npc.homeZ === 1 && secondFloorMap) ? secondFloorMap : map;
      const homeTile = homeMap[npc.homeY]?.[npc.homeX];
      if (homeTile === TileType.Window || !isTileSafeForNpc(homeTile)) {
        const safeHome = findNearestSafeNpcTile(npc.homeX, npc.homeY, homeMap);
        npc.homeX = safeHome.x;
        npc.homeY = safeHome.y;
      }
    }
    if (npc.workX !== undefined && npc.workY !== undefined) {
      const workTile = map[npc.workY]?.[npc.workX];
      if (workTile === TileType.Window || !isTileSafeForNpc(workTile)) {
        const safeWork = findNearestSafeNpcTile(npc.workX, npc.workY, map);
        npc.workX = safeWork.x;
        npc.workY = safeWork.y;
      }
    }
  }

  // 11. Visual touches in Town Center
  map[midY - 3][midX - 3] = TileType.Floor;
  map[midY - 2][midX + 3] = TileType.Floor;

  // 12. Town Outskirts
  spawnTownOutskirtPests(enemies, map, chunkX, chunkY, width, height);

  // 13. Decor Props & Context assignment
  ctx.props = generateTownHouseDecorProps(map, townName);
  ctx.secondFloorMap = secondFloorMap;
  ctx.secondFloorDiscovered = secondFloorDiscovered;
  ctx.secondFloorVisible = secondFloorVisible;
}
