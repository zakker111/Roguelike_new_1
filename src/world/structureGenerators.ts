/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, EnemyState, EnemyType } from '../types';
import townTemplates from '../data/townTemplates.json';
import {
  getBuildingCoordinates,
  hasTownAtChunk,
  isCastleTownAtChunk,
  getDeterministicTownName,
  buildModularTownSquare,
  buildCastleKeep,
} from './overworldStructures';

export {
  getBuildingCoordinates,
  hasTownAtChunk,
  isCastleTownAtChunk,
  getDeterministicTownName,
  buildModularTownSquare,
  buildCastleKeep,
};

export function parseCoord(val: string | number, maxVal: number): number {
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  if (str.includes('w')) {
    const parts = str.split('/');
    if (parts.length > 1) {
      const denom = parseInt(parts[1]?.trim() || '2', 10);
      return Math.floor(maxVal / denom);
    }
    const offset = parseInt(str.replace('w', '').replace('-', '').replace('+', '').trim() || '0', 10);
    return str.includes('-') ? maxVal - offset : maxVal + offset;
  }
  if (str.includes('h')) {
    const parts = str.split('/');
    if (parts.length > 1) {
      const denom = parseInt(parts[1]?.trim() || '2', 10);
      return Math.floor(maxVal / denom);
    }
    const offset = parseInt(str.replace('h', '').replace('-', '').replace('+', '').trim() || '0', 10);
    return str.includes('-') ? maxVal - offset : maxVal + offset;
  }
  return parseInt(str, 10);
}

export function decorateBuildingFromJSON(
  map: TileType[][],
  buildingId: string,
  startX: number,
  startY: number,
  w: number,
  h: number
) {
  let normId = buildingId.toLowerCase();
  if (normId.startsWith('villager')) normId = 'villager';

  if (normId === 'empty_guild_house') {
    const midX = startX + Math.floor(w / 2);
    const midY = startY + Math.floor(h / 2);
    if (midY >= 0 && midY < map.length && midX >= 0 && midX < map[0].length) {
      map[midY][midX] = TileType.Table;
      map[midY][midX - 1] = TileType.Chair;
    }
    return;
  }

  const interiors: Record<string, any[]> = townTemplates.buildingInteriors;
  const props = interiors[normId] || interiors['villager'];

  props.forEach((prop: any) => {
    if (prop.minWidth && w < prop.minWidth) return;
    if (prop.minHeight && h < prop.minHeight) return;

    const rx = parseCoord(prop.x, w);
    const ry = parseCoord(prop.y, h);

    const tx = startX + rx;
    const ty = startY + ry;

    if (tx > startX && tx < startX + w - 1 && ty > startY && ty < startY + h - 1) {
      if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
        const tileVal = (TileType as any)[prop.tile];
        if (tileVal) {
          map[ty][tx] = tileVal;
        }
      }
    }
  });
}

export function buildHouse(
  map: TileType[][],
  startX: number,
  startY: number,
  w: number,
  h: number,
  crossroadY: number,
  buildingId: string = 'villager',
  secondFloorMap?: TileType[][]
) {
  for (let y = startY; y < startY + h; y++) {
    for (let x = startX; x < startX + w; x++) {
      if (y === startY || y === startY + h - 1 || x === startX || x === startX + w - 1) {
        map[y][x] = TileType.Wall;
      } else {
        map[y][x] = TileType.Floor;
      }
    }
  }

  for (let x = startX + 1; x < startX + w - 1; x += 3) {
    map[startY][x] = TileType.Window;
  }
  if (h >= 6) {
    map[startY + 2][startX] = TileType.Window;
    map[startY + 2][startX + w - 1] = TileType.Window;
  }

  const doorY = startY + h - 1;
  const doorX = startX + Math.floor(w / 2);
  map[doorY][doorX] = TileType.Door;

  if (buildingId === 'empty_guild_house') {
    if (doorY + 1 < map.length && doorX + 1 < map[0].length) {
      map[doorY + 1][doorX + 1] = TileType.Sign;
    }
  }

  const innerW = w - 2;
  const innerH = h - 2;
  if (innerW >= 2 && innerH >= 2) {
    decorateBuildingFromJSON(map, buildingId, startX, startY, w, h);
  }

  if (secondFloorMap) {
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        if (y === startY || y === startY + h - 1 || x === startX || x === startX + w - 1) {
          secondFloorMap[y][x] = TileType.Wall;
        } else {
          secondFloorMap[y][x] = TileType.Floor;
        }
      }
    }

    for (let x = startX + 1; x < startX + w - 1; x += 3) {
      secondFloorMap[startY][x] = TileType.Window;
    }
    if (h >= 6) {
      secondFloorMap[startY + 2][startX] = TileType.Window;
      secondFloorMap[startY + 2][startX + w - 1] = TileType.Window;
    }

    const stairsX = startX + 1;
    const stairsY = startY + 1;
    map[stairsY][stairsX] = TileType.StairsUp;
    secondFloorMap[stairsY][stairsX] = TileType.StairsDown;

    if (buildingId === 'tavern') {
      secondFloorMap[startY + 1][startX + w - 2] = TileType.Bed;
      if (w >= 10) {
        secondFloorMap[startY + 1][startX + w - 5] = TileType.Bed;
        secondFloorMap[startY + 2][startX + w - 4] = TileType.Table;
        secondFloorMap[startY + 2][startX + w - 3] = TileType.Chair;
      }
      if (h >= 6) {
        secondFloorMap[startY + h - 2][startX + w - 2] = TileType.Bed;
        secondFloorMap[startY + h - 2][startX + 2] = TileType.Fireplace;
      }
    } else {
      secondFloorMap[startY + 1][startX + w - 2] = TileType.Bed;
      if (innerW >= 4) {
        secondFloorMap[startY + 2][startX + w - 3] = TileType.Table;
        secondFloorMap[startY + 2][startX + w - 4] = TileType.Chair;
      }
    }
  }
}
