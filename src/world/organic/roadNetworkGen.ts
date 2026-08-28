import { TileType } from '../../types';
import { multiOctaveNoise } from './biomeNoiseEngine';

/**
 * Checks whether a tile is a critical gameplay object or solid structure that must not be overwritten.
 */
export function isProtectedRoadTile(t: TileType): boolean {
  return (
    t === TileType.Wall ||
    t === TileType.Door ||
    t === TileType.DungeonEntrance ||
    t === TileType.TownGate ||
    t === TileType.Sign ||
    t === TileType.Campfire ||
    t === TileType.Floor ||
    t === TileType.StairsDown ||
    t === TileType.StairsUp ||
    t === TileType.Table ||
    t === TileType.Chair ||
    t === TileType.Bed ||
    t === TileType.Torch ||
    t === TileType.WatchtowerWall ||
    t === TileType.WatchtowerSlit ||
    t === TileType.WatchtowerDeck ||
    t === TileType.WatchtowerFlag ||
    t === TileType.WatchtowerBarricade
  );
}

/**
 * Safely places a road tile, converting trees, bushes, stones, and water into walkable path/bridge tiles.
 */
export function setRoadTile(
  map: TileType[][],
  x: number,
  y: number,
  width: number,
  height: number,
  isBridgeSpan: boolean = false
): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  const current = map[y][x];
  if (isProtectedRoadTile(current)) return false;
  map[y][x] = TileType.Path;
  return true;
}

/**
 * Ensures an entrance clearance buffer around a door or portal.
 * Guarantees a 2-3 tile walkable runway facing outward from the doorway.
 */
export function ensureEntranceClearance(
  map: TileType[][],
  doorX: number,
  doorY: number,
  width: number,
  height: number,
  facingDir: 'north' | 'south' | 'east' | 'west' | 'all' = 'all'
): void {
  const offsets: { dx: number; dy: number }[] = [];

  if (facingDir === 'north' || facingDir === 'all') {
    offsets.push({ dx: 0, dy: -1 }, { dx: 0, dy: -2 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 });
  }
  if (facingDir === 'south' || facingDir === 'all') {
    offsets.push({ dx: 0, dy: 1 }, { dx: 0, dy: 2 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 });
  }
  if (facingDir === 'east' || facingDir === 'all') {
    offsets.push({ dx: 1, dy: 0 }, { dx: 2, dy: 0 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 });
  }
  if (facingDir === 'west' || facingDir === 'all') {
    offsets.push({ dx: -1, dy: 0 }, { dx: -2, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 });
  }

  for (const off of offsets) {
    const nx = doorX + off.dx;
    const ny = doorY + off.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const tile = map[ny][nx];
      // Only clear non-protected blocker tiles
      if (!isProtectedRoadTile(tile)) {
        map[ny][nx] = TileType.Path;
      }
    }
  }
}

/**
 * Carves a 1-tile footpath spoke connecting an isolated POI or dungeon doorway
 * to the nearest road/trail in the chunk, and places a signpost at the junction.
 */
export function connectPoiSpokeToTrail(
  map: TileType[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  placeSignpostAtJunction: boolean = true
): { connected: boolean; junctionX?: number; junctionY?: number } {
  // 1. Search for nearest existing Path tile (ignoring tiles within radius 2 of start)
  let targetX = -1;
  let targetY = -1;
  let minDist = 999999;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TileType.Path) {
        const d = Math.hypot(x - startX, y - startY);
        if (d > 2.5 && d < minDist) {
          minDist = d;
          targetX = x;
          targetY = y;
        }
      }
    }
  }

  // If no path tile found in chunk, connect towards the center or horizontal edge
  if (targetX === -1 || targetY === -1) {
    targetX = startX < width / 2 ? 1 : width - 2;
    targetY = startY;
  }

  // 2. Step along Manhattan path from start to target
  let curX = startX;
  let curY = startY;
  const maxSteps = width + height;
  let steps = 0;

  while ((curX !== targetX || curY !== targetY) && steps < maxSteps) {
    steps++;
    const diffX = targetX - curX;
    const diffY = targetY - curY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      curX += Math.sign(diffX);
    } else if (diffY !== 0) {
      curY += Math.sign(diffY);
    } else {
      curX += Math.sign(diffX);
    }

    // Carve path tile
    setRoadTile(map, curX, curY, width, height);

    // If we reached an existing path (other than the start point), we formed a junction!
    if (map[curY][curX] === TileType.Path && curX === targetX && curY === targetY) {
      break;
    }
  }

  // 3. Place signpost at junction if requested
  const junctionX = curX;
  const junctionY = curY;

  if (placeSignpostAtJunction) {
    const neighborDirs = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
    ];

    for (const dir of neighborDirs) {
      const sx = junctionX + dir.dx;
      const sy = junctionY + dir.dy;
      if (sx >= 1 && sx < width - 1 && sy >= 1 && sy < height - 1) {
        const t = map[sy][sx];
        if (t === TileType.Grass || t === TileType.Bush) {
          map[sy][sx] = TileType.Sign;
          break;
        }
      }
    }
  }

  return { connected: true, junctionX, junctionY };
}

/**
 * Carves natural winding dirt trails, cross-chunk footpaths, and cobblestone trade highways.
 * Automatically constructs 2-tile wide timber bridges whenever crossing rivers or lakes.
 */
export function carveOrganicTrailsAndRoads(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  width: number,
  height: number,
  hasTown: boolean,
  worldSeed: number = 8675309
): void {
  // If town is present, town generator builds the main gatehouse roads
  if (hasTown) return;

  const worldOriginX = chunkX * width;
  const worldOriginY = chunkY * height;

  // 1. Major Inter-Regional Trade Highways (Every 4 chunks)
  const isEastWestHighway = Math.abs(chunkY % 4) === 0;
  const isNorthSouthHighway = Math.abs(chunkX % 4) === 0;

  if (isEastWestHighway) {
    const roadMidY = Math.floor(height / 2);
    for (let x = 0; x < width; x++) {
      const wx = worldOriginX + x;
      const meanderY = Math.floor(multiOctaveNoise(wx * 0.15, chunkY * 10, 2, 0.5, 2.0, worldSeed + 99) * 4) - 2;
      const ry = Math.max(1, Math.min(height - 2, roadMidY + meanderY));

      const isWater = map[ry][x] === TileType.Water;
      setRoadTile(map, x, ry, width, height, isWater);
      if (isWater && ry + 1 < height - 1) {
        setRoadTile(map, x, ry + 1, width, height, true); // 2-tile wide bridge span across water
      }
    }
  }

  if (isNorthSouthHighway) {
    const roadMidX = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
      const wy = worldOriginY + y;
      const meanderX = Math.floor(multiOctaveNoise(chunkX * 10, wy * 0.15, 2, 0.5, 2.0, worldSeed + 111) * 4) - 2;
      const rx = Math.max(1, Math.min(width - 2, roadMidX + meanderX));

      const isWater = map[y][rx] === TileType.Water;
      setRoadTile(map, rx, y, width, height, isWater);
      if (isWater && rx + 1 < width - 1) {
        setRoadTile(map, rx + 1, y, width, height, true); // 2-tile wide bridge span across water
      }
    }
  }

  // Crossroads Signpost on major highway intersection
  if (isEastWestHighway && isNorthSouthHighway) {
    const crossX = Math.floor(width / 2) + 1;
    const crossY = Math.floor(height / 2) + 1;
    if (crossX < width - 1 && crossY < height - 1 && map[crossY][crossX] === TileType.Grass) {
      map[crossY][crossX] = TileType.Sign;
    }
  }

  // 2. Wilderness Explorer Footpaths (meandering natural trails connecting borders for non-highway chunks)
  if (!isEastWestHighway && !isNorthSouthHighway) {
    // Meandering diagonal/lateral game trail
    const trailStartY = Math.floor(((chunkX * 7 + chunkY * 13 + 1000) % (height - 12))) + 6;
    for (let x = 0; x < width; x++) {
      const wx = worldOriginX + x;
      const trailOffset = Math.floor(multiOctaveNoise(wx * 0.12, (chunkY + 5) * 8, 2, 0.4, 2.0, worldSeed + 222) * 6) - 3;
      const ty = Math.max(2, Math.min(height - 3, trailStartY + trailOffset));

      const isWater = map[ty][x] === TileType.Water;
      setRoadTile(map, x, ty, width, height, isWater);
      if (isWater && ty + 1 < height - 1) {
        setRoadTile(map, x, ty + 1, width, height, true); // Safe bridge crossing across water
      }
    }
  }
}


