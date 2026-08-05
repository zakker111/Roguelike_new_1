import { TileType } from '../types/map';

export interface IndoorCheckParams {
  isOverworld?: boolean;
  isOnSecondFloor?: boolean;
  map?: TileType[][];
  playerX?: number;
  playerY?: number;
}

/**
 * Checks if a player or target coordinate is inside a building interior (house, tavern, shop, keep, dungeon, or 2nd floor).
 */
export function isPlayerIndoors(params?: IndoorCheckParams): boolean {
  if (!params) return false;

  // Dungeons and subterranean levels are indoors
  if (params.isOverworld === false) return true;

  // Upper 2nd floors of buildings (taverns, keeps, houses) are indoors
  if (params.isOnSecondFloor) return true;

  const px = params.playerX;
  const py = params.playerY;
  if (px === undefined || py === undefined || !params.map) return false;

  const currentTile = params.map[py]?.[px];
  if (!currentTile) return false;

  // Interior floor & structure tiles carved inside buildings
  return (
    currentTile === TileType.Floor ||
    currentTile === TileType.Bed ||
    currentTile === TileType.Table ||
    currentTile === TileType.Chair ||
    currentTile === TileType.Anvil ||
    currentTile === TileType.Fireplace ||
    currentTile === TileType.StairsUp ||
    currentTile === TileType.StairsDown ||
    currentTile === TileType.Door ||
    currentTile === TileType.WatchtowerDeck
  );
}
