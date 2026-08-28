/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Trap, TrapType, Chest, MaterialCategory } from '../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../utils/itemsData';
import { Room } from './types';

export function spawnDungeonTraps(
  map: TileType[][],
  width: number,
  height: number,
  depth: number,
  playerX: number,
  playerY: number,
  stairsX: number,
  stairsY: number,
  trapRate: number = 0.08,
  archetype?: string
): Trap[] {
  const traps: Trap[] = [];
  let idCounter = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TileType.Floor && !(x === playerX && y === playerY) && !(x === stairsX && y === stairsY)) {
        if (Math.random() < trapRate) {
          const rand = Math.random();
          let trapType = TrapType.Spikes;

          if (archetype === 'sunken_ruins' || depth === 3) {
            trapType = rand > 0.4 ? TrapType.Geyser : (rand > 0.2 ? TrapType.PoisonGas : TrapType.Spikes);
          } else if (archetype === 'volcanic_caldera' || depth === 7) {
            trapType = rand > 0.5 ? TrapType.MagmaEruption : (rand > 0.25 ? TrapType.SulfurVent : TrapType.FireVent);
          } else if (archetype === 'glacial_caverns' || depth === 5) {
            trapType = rand > 0.5 ? TrapType.FrostbiteVent : (rand > 0.25 ? TrapType.FallingIcicle : TrapType.Spikes);
          } else {
            if (rand > 0.70) trapType = TrapType.FireVent;
            else if (rand > 0.40) trapType = TrapType.PoisonGas;
            else if (rand > 0.20) trapType = TrapType.FallingIcicle;
          }

          traps.push({
            id: `trap_${depth}_${idCounter++}`,
            x,
            y,
            type: trapType,
            isActive: (trapType === TrapType.FireVent || trapType === TrapType.MagmaEruption) ? Math.random() > 0.5 : true,
            triggered: false,
            hidden: true,
            detected: false,
          });
        }
      }
    }
  }

  return traps;
}

export function spawnDungeonChests(
  rooms: Room[],
  depth: number,
  stairsX: number,
  stairsY: number
): Chest[] {
  const chests: Chest[] = [];
  const roomsForChests = rooms.length > 1 ? rooms.slice(1) : rooms;

  roomsForChests.forEach((room, index) => {
    // 65% chance per room, but guarantee at least one chest on the last room if none generated yet
    if (Math.random() < 0.65 || (index === roomsForChests.length - 1 && chests.length === 0)) {
      const cx = room.x + Math.floor(Math.random() * Math.max(1, room.w - 2)) + 1;
      const cy = room.y + Math.floor(Math.random() * Math.max(1, room.h - 2)) + 1;

      if (!(cx === stairsX && cy === stairsY)) {
        const chestGold = Math.floor(Math.random() * 15) + 5 + depth * 3;
        const materialsInside: string[] = [];
        const catalystsInside: string[] = [];

        // Chance of materials depending on tier
        const matCount = Math.random() < 0.3 ? 1 : Math.random() < 0.82 ? 2 : 3;
        for (let m = 0; m < matCount; m++) {
          const depthWeight = Math.random() + (depth * 0.1);
          let candidates = BASIC_MATERIALS;
          if (depthWeight > 1.2) {
            candidates = BASIC_MATERIALS.filter((mat) => (mat.category as string) === 'Tier3' || mat.category === MaterialCategory.Tier3);
          } else if (depthWeight > 0.6) {
            candidates = BASIC_MATERIALS.filter((mat) => (mat.category as string) === 'Tier2' || mat.category === MaterialCategory.Tier2);
          } else {
            candidates = BASIC_MATERIALS.filter((mat) => (mat.category as string) === 'Tier1' || mat.category === MaterialCategory.Tier1);
          }
          if (!candidates || candidates.length === 0) {
            candidates = BASIC_MATERIALS;
          }
          if (candidates && candidates.length > 0) {
            const rolledMat = candidates[Math.floor(Math.random() * candidates.length)];
            if (rolledMat && rolledMat.id) {
              materialsInside.push(rolledMat.id);
            }
          }
        }

        // Chance of crystal catalyst
        if (Math.random() < 0.55 && ELEMENTAL_CATALYSTS && ELEMENTAL_CATALYSTS.length > 0) {
          const rolledCat = ELEMENTAL_CATALYSTS[Math.floor(Math.random() * ELEMENTAL_CATALYSTS.length)];
          if (rolledCat && rolledCat.id) {
            catalystsInside.push(rolledCat.id);
          }
        }

        chests.push({
          id: `chest_${depth}_${index}`,
          x: cx,
          y: cy,
          isOpened: false,
          materials: materialsInside,
          catalysts: catalystsInside,
          gold: chestGold,
        });
      }
    }
  });

  return chests;
}
