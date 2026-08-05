import { TileType } from '../types';

/**
 * Safety guard: ensure NO npcs spawn in walls or other solid/blocked tiles
 */
export function isTileSafeForNpc(tile: TileType): boolean {
  return (
    tile !== TileType.Wall &&
    tile !== TileType.Window &&
    tile !== TileType.Tree &&
    tile !== TileType.PineTree &&
    tile !== TileType.BirchTree &&
    tile !== TileType.CopperVein &&
    tile !== TileType.IronVein &&
    tile !== TileType.Water &&
    tile !== TileType.Table &&
    tile !== TileType.Campfire &&
    tile !== TileType.Empty &&
    tile !== TileType.WatchtowerWall &&
    tile !== TileType.WatchtowerSlit &&
    tile !== TileType.WatchtowerBarricade &&
    tile !== TileType.WatchtowerFlag &&
    tile !== TileType.Bed &&
    tile !== TileType.Chair &&
    tile !== TileType.Fireplace &&
    tile !== TileType.Torch &&
    tile !== TileType.Sign &&
    tile !== TileType.DungeonEntrance &&
    tile !== TileType.TownGate &&
    tile !== TileType.Bush &&
    tile !== TileType.Door
  );
}

/**
 * Find nearest walkable, open tile for NPC placement
 */
export function findNearestSafeNpcTile(
  startX: number,
  startY: number,
  map: TileType[][]
): { x: number; y: number } {
  const height = map.length;
  const width = map[0].length;

  if (startY >= 0 && startY < height && startX >= 0 && startX < width) {
    if (isTileSafeForNpc(map[startY][startX])) {
      return { x: startX, y: startY };
    }
  }

  // Spiral search out to a radius of 20 tiles
  for (let r = 1; r <= 20; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const testX = startX + dx;
          const testY = startY + dy;
          if (testY >= 0 && testY < height && testX >= 0 && testX < width) {
            if (isTileSafeForNpc(map[testY][testX])) {
              return { x: testX, y: testY };
            }
          }
        }
      }
    }
  }

  // Fallback to center town crossroad
  return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
}
