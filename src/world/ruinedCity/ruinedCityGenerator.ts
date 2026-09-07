/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Enemy, NPC } from '../../types';
import {
  carvePlazaCenterpiece,
  carveRubbleBarricade,
  carveRuinedBuilding,
} from './ruinedCityBuildings';
import {
  populateBanditHideout,
  populateContestedPlaza,
  populateOrcWarcamp,
} from './ruinedCityTurf';
import type { GeneratedRuinedCity, RuinedCityProp, RuinedCitySector } from './types';

export const RUINED_CITY_WIDTH = 21;
export const RUINED_CITY_HEIGHT = 21;

export function generateRuinedCityChunk(
  chunkX: number,
  chunkY: number,
  playerLevel: number = 1,
  chaosScore: number = 20
): GeneratedRuinedCity {
  const width = RUINED_CITY_WIDTH;
  const height = RUINED_CITY_HEIGHT;

  // Initialize base terrain (cracked earth / open ground)
  const tiles: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      // Natural perimeter boundaries
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        // Leave 2-tile road entrances in the middle of each border
        const isNorthSouthDoor = (x === 10 || x === 11) && (y === 0 || y === height - 1);
        const isEastWestDoor = (y === 10 || y === 11) && (x === 0 || x === width - 1);
        if (isNorthSouthDoor || isEastWestDoor) {
          row.push(TileType.Path);
        } else {
          row.push(TileType.Wall);
        }
      } else {
        row.push(TileType.Floor);
      }
    }
    tiles.push(row);
  }

  // Cross-axial road grid connecting borders to the central plaza
  for (let x = 1; x < width - 1; x++) {
    tiles[10][x] = TileType.Path;
  }
  for (let y = 1; y < height - 1; y++) {
    tiles[y][10] = TileType.Path;
  }

  // 1. Central Plaza (Center)
  carvePlazaCenterpiece(tiles, 10, 10, 3);

  // 2. North-East Ruined Quarter (Orc Warcamp)
  carveRuinedBuilding(tiles, 13, 2, 7, 7, chunkX * 100 + chunkY);

  // 3. South-West Ruined Quarter (Bandit Hideout)
  carveRuinedBuilding(tiles, 2, 13, 7, 7, chunkX * 200 + chunkY);

  // 4. North-West Quarter (Forgotten Shrine)
  carveRuinedBuilding(tiles, 2, 2, 7, 7, chunkX * 300 + chunkY);

  // 5. South-East Quarter (Collapsed Vault)
  carveRuinedBuilding(tiles, 13, 13, 7, 7, chunkX * 400 + chunkY);

  // Tactical rubble barricades creating choke points along roads
  carveRubbleBarricade(tiles, 7, 10, 3, false);
  carveRubbleBarricade(tiles, 14, 10, 3, false);
  carveRubbleBarricade(tiles, 10, 7, 3, true);
  carveRubbleBarricade(tiles, 10, 14, 3, true);

  // Define Sectors
  const sectors: RuinedCitySector[] = [
    {
      id: 'orc_warcamp',
      zone: 'orc_warcamp',
      name: 'Goreaxe Warcamp & Bloodfire Hearth',
      x: 13,
      y: 2,
      w: 7,
      h: 7,
      controllingFaction: 'orc_clans',
      dangerLevel: Math.max(1, playerLevel + 1),
    },
    {
      id: 'bandit_hideout',
      zone: 'bandit_hideout',
      name: 'Shadow Dagger Outlaw Hideout',
      x: 2,
      y: 13,
      w: 7,
      h: 7,
      controllingFaction: 'outlaw_bandits',
      dangerLevel: playerLevel,
    },
    {
      id: 'contested_plaza',
      zone: 'contested_plaza',
      name: 'Contested Grand Plaza (No-Man\'s Land)',
      x: 8,
      y: 8,
      w: 5,
      h: 5,
      controllingFaction: 'contested',
      dangerLevel: playerLevel + 2,
    },
    {
      id: 'collapsed_vault',
      zone: 'collapsed_vault',
      name: 'Collapsed Treasury Vault',
      x: 13,
      y: 13,
      w: 7,
      h: 7,
      controllingFaction: 'ancient_guardians',
      dangerLevel: playerLevel + 1,
    },
    {
      id: 'forgotten_shrine',
      zone: 'forgotten_shrine',
      name: 'Overgrown Shrine of the Ancients',
      x: 2,
      y: 2,
      w: 7,
      h: 7,
      controllingFaction: 'ancient_guardians',
      dangerLevel: playerLevel,
    },
  ];

  let enemies: Enemy[] = [];
  const props: RuinedCityProp[] = [];
  let enemyId = 1;

  // Populate Sectors
  const orcRes = populateOrcWarcamp(sectors[0], enemyId, playerLevel, chaosScore);
  enemies.push(...orcRes.enemies);
  props.push(...orcRes.props);
  enemyId = orcRes.nextId;

  const banditRes = populateBanditHideout(sectors[1], enemyId, playerLevel, chaosScore);
  enemies.push(...banditRes.enemies);
  props.push(...banditRes.props);
  enemyId = banditRes.nextId;

  const plazaRes = populateContestedPlaza(sectors[2], enemyId, playerLevel, chaosScore);
  enemies.push(...plazaRes.enemies);
  props.push(...plazaRes.props);
  enemyId = plazaRes.nextId;

  // Add Forgotten Shrine prop
  props.push({
    x: 5,
    y: 5,
    char: '⛩️',
    color: '#38bdf8',
    name: 'Moss-Covered Aether Altar',
    type: 'shrine',
    interactive: true,
  });

  // Add Vault Door & Locked Masterwork Chest
  const vaultCoord = { x: 16, y: 16 };
  props.push({
    x: vaultCoord.x,
    y: vaultCoord.y,
    char: '🔒',
    color: '#fbbf24',
    name: 'Ancient Reinforced Vault Chest',
    type: 'chest',
    interactive: true,
  });

  const npcs: NPC[] = [];

  return {
    chunkX,
    chunkY,
    name: 'Ruins of Sol-Keth (Contested Battlefield)',
    tiles,
    enemies,
    npcs,
    props,
    sectors,
    hasVault: true,
    vaultCoord,
  };
}
