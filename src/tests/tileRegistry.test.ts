import { describe, it, expect } from 'vitest';
import { TileType } from '../types/map';
import {
  MASTER_TILE_REGISTRY,
  getTileDefinition,
  isTileObstacle,
  isTileWalkable,
  doesTileBlockVision,
  isTileShadowCaster,
  getTileShadowType,
  isTileIndoor,
  isTileSafeForNpc,
  isTileLightSource,
  getTileLightInfo,
  registerCustomTile,
  getAllRegisteredTiles,
} from '../world/tileRegistry';
import { resolveTileStyle } from '../canvas/tileMapRenderer';
import { isTileBlockedForEntity, isTileWalkableForEntity, hasLineOfSight } from '../utils/ai';
import { isPlayerIndoors } from '../utils/buildingAudio';
import { isShadowCastingTile } from '../canvas/shadowRenderer';
import { isTileSafeForNpc as isSafeNpcSpawning } from '../world/overworldNpcSpawning';

describe('Central Master Tile Registry & 1-Step Tile Extensibility', () => {
  describe('Registry Integrity & Enumeration', () => {
    it('contains registered definitions for all standard TileType enum values', () => {
      const allEnumValues = Object.values(TileType);
      for (const tileType of allEnumValues) {
        const def = getTileDefinition(tileType);
        expect(def, `Missing registry definition for TileType.${tileType}`).toBeDefined();
        expect(def?.id).toBe(tileType);
        expect(def?.name).toBeTruthy();
        expect(def?.defaultChar).toBeDefined();
        expect(def?.defaultTileColor).toBeTruthy();
        expect(def?.defaultGlyphColor).toBeTruthy();
      }
    });

    it('getAllRegisteredTiles returns all registered tile definitions', () => {
      const all = getAllRegisteredTiles();
      expect(all.length).toBeGreaterThanOrEqual(Object.values(TileType).length);
    });
  });

  describe('Obstacle & Movement Passability', () => {
    it('correctly marks solid obstacles as impassable', () => {
      expect(isTileObstacle(TileType.Wall)).toBe(true);
      expect(isTileWalkable(TileType.Wall)).toBe(false);
      expect(isTileBlockedForEntity(TileType.Wall)).toBe(true);

      expect(isTileObstacle(TileType.Tree)).toBe(true);
      expect(isTileObstacle(TileType.PineTree)).toBe(true);
      expect(isTileObstacle(TileType.BirchTree)).toBe(true);
      expect(isTileObstacle(TileType.CopperVein)).toBe(true);
      expect(isTileObstacle(TileType.IronVein)).toBe(true);
      expect(isTileObstacle(TileType.Empty)).toBe(true);
      expect(isTileObstacle(TileType.WatchtowerWall)).toBe(true);
      expect(isTileObstacle(TileType.Campfire)).toBe(true);
    });

    it('correctly marks terrain as walkable', () => {
      expect(isTileWalkable(TileType.Floor)).toBe(true);
      expect(isTileWalkable(TileType.Grass)).toBe(true);
      expect(isTileWalkable(TileType.Path)).toBe(true);
      expect(isTileWalkable(TileType.StairsDown)).toBe(true);
      expect(isTileWalkable(TileType.StairsUp)).toBe(true);
      expect(isTileWalkable(TileType.TreeStump)).toBe(true);
      expect(isTileWalkable(TileType.Bedroll)).toBe(true);
      expect(isTileWalkable(TileType.WatchtowerDeck)).toBe(true);
      expect(isTileWalkable(TileType.Ice)).toBe(true);
      expect(isTileWalkable(TileType.Ash)).toBe(true);

      expect(isTileWalkableForEntity(TileType.Grass)).toBe(true);
      expect(isTileWalkableForEntity(TileType.Floor)).toBe(true);
    });

    it('handles conditional door traversal based on options', () => {
      // By default without door opening ability, Door is an obstacle
      expect(isTileObstacle(TileType.Door)).toBe(true);
      expect(isTileObstacle(TileType.Door, { canOpenDoors: false })).toBe(true);
      // With door opening ability, Door is walkable
      expect(isTileObstacle(TileType.Door, { canOpenDoors: true })).toBe(false);
      expect(isTileWalkable(TileType.Door, { canOpenDoors: true })).toBe(true);
    });

    it('handles conditional water traversal based on aquatic capability', () => {
      expect(isTileObstacle(TileType.Water)).toBe(true);
      expect(isTileObstacle(TileType.Water, { isWaterWalkable: false })).toBe(true);
      expect(isTileObstacle(TileType.Water, { isWaterWalkable: true })).toBe(false);
      expect(isTileWalkable(TileType.Water, { isWaterWalkable: true })).toBe(true);
    });

    it('handles conditional bed passability', () => {
      expect(isTileObstacle(TileType.Bed)).toBe(true);
      expect(isTileObstacle(TileType.Bed, { isBedWalkable: true })).toBe(false);
    });
  });

  describe('Vision & Line of Sight Raycasting', () => {
    it('identifies tiles that block line of sight', () => {
      expect(doesTileBlockVision(TileType.Wall)).toBe(true);
      expect(doesTileBlockVision(TileType.Door)).toBe(true);
      expect(doesTileBlockVision(TileType.Tree)).toBe(true);
      expect(doesTileBlockVision(TileType.PineTree)).toBe(true);
      expect(doesTileBlockVision(TileType.BirchTree)).toBe(true);
      expect(doesTileBlockVision(TileType.CopperVein)).toBe(true);
      expect(doesTileBlockVision(TileType.IronVein)).toBe(true);
      expect(doesTileBlockVision(TileType.WatchtowerWall)).toBe(true);
      expect(doesTileBlockVision(TileType.FieldTent)).toBe(true);
    });

    it('identifies transparent tiles that do not block vision', () => {
      expect(doesTileBlockVision(TileType.Floor)).toBe(false);
      expect(doesTileBlockVision(TileType.Grass)).toBe(false);
      expect(doesTileBlockVision(TileType.Path)).toBe(false);
      expect(doesTileBlockVision(TileType.Water)).toBe(false);
      expect(doesTileBlockVision(TileType.Window)).toBe(false);
      expect(doesTileBlockVision(TileType.Table)).toBe(false);
      expect(doesTileBlockVision(TileType.Chair)).toBe(false);
      expect(doesTileBlockVision(TileType.Bed)).toBe(false);
      expect(doesTileBlockVision(TileType.Campfire)).toBe(false);
      expect(doesTileBlockVision(TileType.Torch)).toBe(false);
    });

    it('integrates seamlessly with hasLineOfSight path raycasting', () => {
      const miniMap: TileType[][] = [
        [TileType.Floor, TileType.Floor, TileType.Floor],
        [TileType.Floor, TileType.Wall, TileType.Floor],
        [TileType.Floor, TileType.Floor, TileType.Floor],
      ];

      // Blocked through the wall at center (1, 1)
      expect(hasLineOfSight(0, 1, 2, 1, miniMap)).toBe(false);

      // Clear along the top row (0, 0) to (2, 0)
      expect(hasLineOfSight(0, 0, 2, 0, miniMap)).toBe(true);
    });
  });

  describe('Shadow Casting & Environmental Lighting', () => {
    it('accurately identifies shadow-casting structures and foliage', () => {
      expect(isTileShadowCaster(TileType.Wall)).toBe(true);
      expect(isTileShadowCaster(TileType.Tree)).toBe(true);
      expect(isTileShadowCaster(TileType.PineTree)).toBe(true);
      expect(isTileShadowCaster(TileType.BirchTree)).toBe(true);
      expect(isTileShadowCaster(TileType.CopperVein)).toBe(true);
      expect(isTileShadowCaster(TileType.Sign)).toBe(true);
      expect(isTileShadowCaster(TileType.Bush)).toBe(true);
      expect(isTileShadowCaster(TileType.Anvil)).toBe(true);
      expect(isTileShadowCaster(TileType.Fireplace)).toBe(true);

      // Cross-checked with shadowRenderer facade
      expect(isShadowCastingTile(TileType.Wall)).toBe(true);
      expect(isShadowCastingTile(TileType.Tree)).toBe(true);
    });

    it('returns null or false for non-shadow-casting flat ground', () => {
      expect(isTileShadowCaster(TileType.Floor)).toBe(false);
      expect(isTileShadowCaster(TileType.Grass)).toBe(false);
      expect(isTileShadowCaster(TileType.Path)).toBe(false);
      expect(isTileShadowCaster(TileType.Water)).toBe(false);
      expect(isShadowCastingTile(TileType.Grass)).toBe(false);
    });

    it('identifies light-emitting tiles and returns emission radius', () => {
      expect(isTileLightSource(TileType.Campfire)).toBe(true);
      expect(getTileLightInfo(TileType.Campfire)?.radius).toBe(5);

      expect(isTileLightSource(TileType.Torch)).toBe(true);
      expect(getTileLightInfo(TileType.Torch)?.radius).toBe(6);

      expect(isTileLightSource(TileType.Fireplace)).toBe(true);
      expect(isTileLightSource(TileType.Grass)).toBe(false);
      expect(getTileLightInfo(TileType.Grass)).toBeNull();
    });
  });

  describe('Building Interior Acoustic Shelters', () => {
    it('identifies indoor building components', () => {
      expect(isTileIndoor(TileType.Floor)).toBe(true);
      expect(isTileIndoor(TileType.Bed)).toBe(true);
      expect(isTileIndoor(TileType.Table)).toBe(true);
      expect(isTileIndoor(TileType.Chair)).toBe(true);
      expect(isTileIndoor(TileType.Anvil)).toBe(true);
      expect(isTileIndoor(TileType.Fireplace)).toBe(true);
      expect(isTileIndoor(TileType.StairsUp)).toBe(true);
      expect(isTileIndoor(TileType.StairsDown)).toBe(true);
      expect(isTileIndoor(TileType.Door)).toBe(true);
      expect(isTileIndoor(TileType.WatchtowerDeck)).toBe(true);

      // Wilderness tiles are not indoor
      expect(isTileIndoor(TileType.Grass)).toBe(false);
      expect(isTileIndoor(TileType.Tree)).toBe(false);
      expect(isTileIndoor(TileType.Path)).toBe(false);
    });

    it('integrates seamlessly with isPlayerIndoors helper', () => {
      const indoorMap: TileType[][] = [
        [TileType.Wall, TileType.Wall, TileType.Wall],
        [TileType.Wall, TileType.Floor, TileType.Wall],
        [TileType.Wall, TileType.Wall, TileType.Wall],
      ];

      expect(
        isPlayerIndoors({
          isOverworld: true,
          map: indoorMap,
          playerX: 1,
          playerY: 1,
        })
      ).toBe(true);

      const outdoorMap: TileType[][] = [
        [TileType.Grass, TileType.Grass],
        [TileType.Grass, TileType.Grass],
      ];

      expect(
        isPlayerIndoors({
          isOverworld: true,
          map: outdoorMap,
          playerX: 0,
          playerY: 0,
        })
      ).toBe(false);
    });
  });

  describe('Safe NPC Placement & Spawning', () => {
    it('marks open walkable terrain as safe for NPC placement', () => {
      expect(isTileSafeForNpc(TileType.Floor)).toBe(true);
      expect(isTileSafeForNpc(TileType.Grass)).toBe(true);
      expect(isTileSafeForNpc(TileType.Path)).toBe(true);
      expect(isTileSafeForNpc(TileType.WatchtowerDeck)).toBe(true);
      expect(isTileSafeForNpc(TileType.TreeStump)).toBe(true);

      expect(isSafeNpcSpawning(TileType.Floor)).toBe(true);
      expect(isSafeNpcSpawning(TileType.Grass)).toBe(true);
    });

    it('marks solid obstacles and hazards as unsafe for NPC placement', () => {
      expect(isTileSafeForNpc(TileType.Wall)).toBe(false);
      expect(isTileSafeForNpc(TileType.Window)).toBe(false);
      expect(isTileSafeForNpc(TileType.Tree)).toBe(false);
      expect(isTileSafeForNpc(TileType.Water)).toBe(false);
      expect(isTileSafeForNpc(TileType.Campfire)).toBe(false);
      expect(isTileSafeForNpc(TileType.Empty)).toBe(false);
      expect(isTileSafeForNpc(TileType.Door)).toBe(false);

      expect(isSafeNpcSpawning(TileType.Wall)).toBe(false);
      expect(isSafeNpcSpawning(TileType.Water)).toBe(false);
    });
  });

  describe('Effortless 1-Step Custom Tile Creation', () => {
    it('enables creating and registering new tiles with immediate cross-engine propagation', () => {
      // 1. Declare and register a brand new tile type
      const customTileId = 'CrystalObelisk';
      registerCustomTile({
        id: customTileId,
        name: 'Crystal Obelisk',
        description: 'Pulsing arcane spire emitting violet radiance.',
        defaultChar: '▲',
        defaultTileColor: '#1e112a',
        defaultGlyphColor: '#c084fc',
        isObstacle: true,
        blocksVision: true,
        castsShadow: true,
        shadowType: 'structure',
        isLightSource: true,
        lightRadius: 7,
      });

      // 2. Instantly recognized by registry
      const def = getTileDefinition(customTileId);
      expect(def).toBeDefined();
      expect(def?.name).toBe('Crystal Obelisk');

      // 3. Movement & Collision Engine automatically blocks path
      expect(isTileObstacle(customTileId as any)).toBe(true);
      expect(isTileWalkable(customTileId as any)).toBe(false);
      expect(isTileBlockedForEntity(customTileId as any)).toBe(true);

      // 4. Vision Engine automatically treats as blocking ray
      expect(doesTileBlockVision(customTileId as any)).toBe(true);

      // 5. Shadow Engine automatically registers as shadow caster
      expect(isTileShadowCaster(customTileId as any)).toBe(true);
      expect(getTileShadowType(customTileId as any)).toBe('structure');

      // 6. Lighting Engine automatically sees light radius
      expect(isTileLightSource(customTileId as any)).toBe(true);
      expect(getTileLightInfo(customTileId as any)?.radius).toBe(7);

      // 7. NPC Spawning automatically rejects spawning on it
      expect(isTileSafeForNpc(customTileId as any)).toBe(false);

      // 8. Renderer automatically resolves correct style without needing any new code in tileMapRenderer!
      const style = resolveTileStyle(customTileId as any, true, false, undefined, 1);
      expect(style.char).toBe('▲');
      expect(style.tileColor).toBe('#1e112a');
      expect(style.glyphColor).toBe('#c084fc');
    });
  });
});
