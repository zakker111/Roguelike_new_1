import { TileType } from '../../types';
import { multiOctaveNoise } from './biomeNoiseEngine';

/**
 * Natural meandering river carver connecting continuous world coordinates across chunk borders.
 * Ensures guaranteed multi-point crossings, shallow stepping-stone fords, and tile safety.
 */
export function carveNaturalRiversAndLakes(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  width: number,
  height: number,
  biome: string,
  worldSeed: number = 8675309
): void {
  // Check if a macro-river passes through this region using continuous world noise
  const worldOriginX = chunkX * width;
  const worldOriginY = chunkY * height;

  const isProtectedTile = (t: TileType): boolean => {
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
      t === TileType.Path ||
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
  };

  // Determine continuous river spline path for this chunk
  for (let y = 0; y < height; y++) {
    const wy = worldOriginY + y;
    // Primary River Spine (Meanders North-South)
    const riverNoise = multiOctaveNoise(wy * 0.4, chunkX * 10, 2, 0.5, 2.0, worldSeed + 77);
    const riverCenterX = Math.floor(riverNoise * (width - 8)) + 4;

    // Secondary River meander (East-West tributary in wet regions)
    const tributaryNoise = multiOctaveNoise(chunkY * 10, wy * 0.3, 2, 0.5, 2.0, worldSeed + 88);
    const isTributaryActive = tributaryNoise > 0.70 && biome !== 'desert';

    // Guaranteed multiple crossing positions across chunk height (top, mid, bottom, and periodic stepping stones)
    const isUpperBridge = y === 5 || y === 6;
    const isMidBridge = y === Math.floor(height / 2) || y === Math.floor(height / 2) + 1;
    const isLowerBridge = y === height - 7 || y === height - 6;
    const isPeriodicFord = Math.floor((wy + 1000) % 9) === 0;

    const isCrossingRow = isUpperBridge || isMidBridge || isLowerBridge || isPeriodicFord;

    for (let x = 0; x < width; x++) {
      const distFromRiver = Math.abs(x - riverCenterX);

      // Width varies naturally between 1 to 2.2 tiles based on sin noise
      const widthMod = Math.sin(wy * 0.35 + worldSeed) * 0.5;
      const currentRiverWidth = 1.3 + widthMod;

      if (distFromRiver <= currentRiverWidth) {
        if (isProtectedTile(map[y][x])) {
          // Keep protected road or structure tile intact
          continue;
        }

        if (isCrossingRow) {
          map[y][x] = TileType.Path;
        } else {
          map[y][x] = TileType.Water;
        }
      }

      // Tributary carving with crossing safety
      if (isTributaryActive && y === Math.floor(tributaryNoise * (height - 8)) + 4) {
        if (!isProtectedTile(map[y][x])) {
          const isTributaryBridge = x === riverCenterX || x === Math.floor(width / 2);
          map[y][x] = isTributaryBridge ? TileType.Path : TileType.Water;
        }
      }
    }
  }
}

