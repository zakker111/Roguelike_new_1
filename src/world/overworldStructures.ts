import { TileType } from '../types';
import townTemplates from '../data/townTemplates.json';

// Calculate building positions from JSON expressions like "width - 12" safely without eval
export function getBuildingCoordinates(
  width: number,
  height: number,
  chunkX?: number,
  chunkY?: number,
  prngFn?: (x: number, y: number, seed?: number) => number
): any[] {
  // If it's the starting town and a GM has set a custom layout on window, use that
  if (chunkX === 0 && chunkY === 0 && typeof window !== 'undefined' && (window as any).customHouses) {
    return (window as any).customHouses;
  }

  // Otherwise, deterministically/randomly choose from the town layouts pool in JSON
  const layouts = townTemplates.townLayouts;
  let layoutIndex = 0;
  if (chunkX !== undefined && chunkY !== undefined && prngFn) {
    // deterministic prng based on coordinates
    layoutIndex = Math.floor(prngFn(chunkX, chunkY, 4821) * layouts.length);
  } else {
    // fallback or random layout selection
    layoutIndex = Math.floor(Math.random() * layouts.length);
  }

  const selectedLayout = layouts[layoutIndex];

  return selectedLayout.buildings.map((b: any) => {
    let computedX = 0;
    let computedY = 0;

    const xStr = String(b.x);
    if (xStr.includes('width')) {
      const offset = parseInt(xStr.replace('width', '').replace('-', '').replace('+', '').trim() || '0', 10);
      computedX = xStr.includes('-') ? width - offset : width + offset;
    } else {
      computedX = parseInt(xStr, 10);
    }

    const yStr = String(b.y);
    if (yStr.includes('height')) {
      const offset = parseInt(yStr.replace('height', '').replace('-', '').replace('+', '').trim() || '0', 10);
      computedY = yStr.includes('-') ? height - offset : height + offset;
    } else {
      computedY = parseInt(yStr, 10);
    }

    return {
      id: b.id,
      name: b.name,
      x: computedX,
      y: computedY,
      w: b.w,
      h: b.h,
    };
  });
}

const TOWN_PREFIXES = ["Stone", "Oak", "River", "Deep", "High", "Silver", "Iron", "Gold", "Green", "Winter", "Shadow", "Cloud"];
const TOWN_SUFFIXES = ["haven", "wood", "run", "fall", "crest", "ford", "keep", "ridge", "glen", "vale", "dale", "barrow", "town"];

export function hasTownAtChunk(
  chunkX: number,
  chunkY: number,
  prngFn: (x: number, y: number, seed?: number) => number
): boolean {
  if (chunkX === 0 && chunkY === 0) return true;
  if (chunkX === 3 && chunkY === -2) return true; // Vanguard Harbor Port is the sail destination

  const val = prngFn(chunkX, chunkY, 8271);
  return val < 0.12; // 12% probability of a town
}

export function isCastleTownAtChunk(
  chunkX: number,
  chunkY: number,
  prngFn: (x: number, y: number, seed?: number) => number
): boolean {
  if (chunkX === 0 && chunkY === 0) return false;
  if (chunkX === 3 && chunkY === -2) return false;
  if (!hasTownAtChunk(chunkX, chunkY, prngFn)) return false;

  // Castles are rarer than villages. Only 25% of random wild towns trigger Castle fortifications
  const val = prngFn(chunkX, chunkY, 9483);
  return val < 0.25;
}

export type SettlementTier = 'hamlet' | 'village' | 'town' | 'citadel';

export function getSettlementTier(
  cx: number,
  cy: number,
  prngFn?: (x: number, y: number, seed?: number) => number
): SettlementTier {
  if (cx === 0 && cy === 0) return 'village';
  if (cx === 3 && cy === -2) return 'town'; // Vanguard Harbor Port

  if (prngFn && isCastleTownAtChunk(cx, cy, prngFn)) {
    return 'citadel';
  }

  const val = prngFn ? prngFn(cx, cy, 3317) : 0.5;
  if (val < 0.35) return 'hamlet';
  if (val < 0.8) return 'village';
  return 'town';
}

export function getDeterministicTownName(
  cx: number,
  cy: number,
  worldSeed: number = 8675309,
  prngFn?: (x: number, y: number, seed?: number) => number
): string {
  if (cx === 0 && cy === 0) return "Oakhaven Village";
  if (cx === 3 && cy === -2) return "Vanguard Harbor Port";

  const isCastle = prngFn ? isCastleTownAtChunk(cx, cy, prngFn) : false;

  const index = Math.abs(cx * 11 + cy * 19 + (worldSeed % 100));
  const pIdx = index % TOWN_PREFIXES.length;
  const sIdx = (index + 3) % TOWN_SUFFIXES.length;

  if (isCastle) {
    const castleDescriptors = ["Castle", "Citadel", "Fortress", "Bastion", "Stronghold", "Keep"];
    const dIdx = (index + 7) % castleDescriptors.length;
    return `${TOWN_PREFIXES[pIdx]} ${castleDescriptors[dIdx]}`;
  }

  return `Town of ${TOWN_PREFIXES[pIdx]}${TOWN_SUFFIXES[sIdx]}`;
}

export function buildModularTownSquare(map: TileType[][], cx: number, cy: number, seedVal: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (cx + dx >= 0 && cx + dx < map[0].length && cy + dy >= 0 && cy + dy < map.length) {
        map[cy + dy][cx + dx] = TileType.Path;
      }
    }
  }

  const squares = townTemplates.townSquares;
  const sIndex = Math.abs(seedVal) % squares.length;
  const selectedSquare = squares[sIndex];

  const grid = selectedSquare.grid;
  const legend: Record<string, string> = selectedSquare.legend;

  for (let dy = -2; dy <= 2; dy++) {
    const row = grid[dy + 2];
    if (!row) continue;
    for (let dx = -2; dx <= 2; dx++) {
      const char = row[dx + 2];
      if (!char) continue;
      const mappedTileName = legend[char];
      if (mappedTileName) {
        const tileVal = (TileType as any)[mappedTileName];
        const tx = cx + dx;
        const ty = cy + dy;
        if (tileVal && tx >= 0 && tx < map[0].length && ty >= 0 && ty < map.length) {
          map[ty][tx] = tileVal;
        }
      }
    }
  }
}

export function buildCastleKeep(
  map: TileType[][],
  startX: number,
  startY: number,
  w: number,
  h: number,
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

  const midWallX = startX + 6;
  if (midWallX > startX && midWallX < startX + w - 1) {
    for (let y = startY + 1; y < startY + h - 1; y++) {
      if (y !== startY + h - 3) {
        map[y][midWallX] = TileType.Wall;
      } else {
        map[y][midWallX] = TileType.Door;
      }
    }
  }

  const doorY = startY;
  if (startX + 4 < startX + w - 1 && startX + 5 < startX + w - 1) {
    map[doorY][startX + 4] = TileType.Door;
    map[doorY][startX + 5] = TileType.Door;
  } else {
    map[doorY][startX + Math.floor(w / 2)] = TileType.Door;
  }

  if (startX + 2 < startX + w - 1) map[startY][startX + 2] = TileType.Window;
  if (startX + 8 < startX + w - 1) map[startY][startX + 8] = TileType.Window;

  map[startY + 1][startX + 1] = TileType.Bed;
  if (startY + 2 < startY + h - 1) map[startY + 2][startX + 1] = TileType.Bed;
  map[startY + h - 2][startX + 1] = TileType.Fireplace;
  if (startX + 3 < startX + w - 1) map[startY + 2][startX + 3] = TileType.Table;
  if (startX + 4 < startX + w - 1) map[startY + 2][startX + 4] = TileType.Chair;

  const throneX = startX + w - 2;
  const throneY = startY + 2;
  if (throneX > startX && throneY < startY + h - 1) {
    map[throneY][throneX] = TileType.Chair;
    if (throneX - 1 > startX) map[throneY][throneX - 1] = TileType.Table;
    map[throneY - 1][throneX] = TileType.Torch;
    if (throneY + 1 < startY + h - 1) map[throneY + 1][throneX] = TileType.Torch;
  }

  const mapTableX = startX + w - 5;
  const mapTableY = startY + h - 3;
  if (mapTableX > startX && mapTableY > startY && mapTableY < startY + h - 1) {
    map[mapTableY][mapTableX] = TileType.Table;
    if (mapTableX - 1 > startX) map[mapTableY][mapTableX - 1] = TileType.Chair;
    if (mapTableY + 1 < startY + h - 1) map[mapTableY + 1][mapTableX] = TileType.Chair;
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
    // Stairs
    const stairsX = startX + 1;
    const stairsY = startY + 1;
    map[stairsY][stairsX] = TileType.StairsUp;
    secondFloorMap[stairsY][stairsX] = TileType.StairsDown;

    // Decorate second floor of Keep (e.g. Commander's bed and table)
    secondFloorMap[startY + 2][startX + w - 2] = TileType.Bed;
    secondFloorMap[startY + 3][startX + w - 3] = TileType.Table;
    secondFloorMap[startY + 3][startX + w - 4] = TileType.Chair;
  }
}
