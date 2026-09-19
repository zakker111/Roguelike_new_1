/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, GameState, Enemy } from '../../types';
import { ElementalTile, ElementType, ElementalInteractionResult } from '../../types/elemental';
import { isPlayerInvincible } from '../invincibility';

export interface ElementalPropagationResult {
  updatedFields: ElementalTile[];
  mapModifications: { x: number; y: number; newTile: TileType }[];
  playerDamage: number;
  entityDamages: { entityId: string; damage: number }[];
  logs: { text: string; type: string }[];
  floaters: { x: number; y: number; text: string; type: 'dmg' | 'heal' | 'crit' }[];
  soundToPlay?: string;
}

/**
 * Checks whether a given tile is flammable wood, foliage, or organic material.
 */
export function isTileFlammable(tile: TileType): boolean {
  return (
    tile === TileType.Grass ||
    tile === TileType.Bush ||
    tile === TileType.Tree ||
    tile === TileType.PineTree ||
    tile === TileType.BirchTree ||
    tile === TileType.TreeStump ||
    tile === TileType.Door ||
    tile === TileType.Table ||
    tile === TileType.Chair ||
    tile === TileType.Bed ||
    tile === TileType.Bedroll ||
    tile === TileType.FieldTent
  );
}

/**
 * Checks whether a tile conducts electricity.
 */
export function isTileConductive(tile: TileType): boolean {
  return tile === TileType.Water;
}

/**
 * Checks whether a tile is freezable water.
 */
export function isTileFreezable(tile: TileType): boolean {
  return tile === TileType.Water;
}

/**
 * Adds or reinforces an elemental tile in the fields array.
 */
export function addOrReinforceElementalTile(
  fields: ElementalTile[],
  x: number,
  y: number,
  element: ElementType,
  duration: number = 4,
  intensity: number = 1,
  source?: string
): ElementalTile[] {
  const existingIndex = fields.findIndex((f) => f.x === x && f.y === y && f.element === element);
  if (existingIndex !== -1) {
    const next = [...fields];
    next[existingIndex] = {
      ...next[existingIndex],
      duration: Math.max(next[existingIndex].duration, duration),
      intensity: Math.min(3, next[existingIndex].intensity + intensity - 1),
    };
    return next;
  }
  return [
    ...fields,
    {
      id: `elem_${element}_${x}_${y}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x,
      y,
      element,
      duration,
      intensity,
      source,
    },
  ];
}

/**
 * Ignites a target coordinate, setting it on fire.
 */
export function igniteTile(
  fields: ElementalTile[],
  x: number,
  y: number,
  duration: number = 4,
  intensity: number = 1
): ElementalTile[] {
  return addOrReinforceElementalTile(fields, x, y, 'fire', duration, intensity, 'combustion');
}

/**
 * Freezes a water tile into walkable ice.
 */
export function freezeWaterAt(
  map: TileType[][],
  fields: ElementalTile[],
  x: number,
  y: number,
  duration: number = 8
): { updatedMap: TileType[][]; updatedFields: ElementalTile[]; didFreeze: boolean } {
  const tile = map[y]?.[x];
  if (tile === TileType.Water) {
    const updatedMap = map.map((row, rY) =>
      rY === y ? row.map((col, cX) => (cX === x ? TileType.Ice : col)) : row
    );
    const updatedFields = addOrReinforceElementalTile(fields, x, y, 'ice', duration, 2, 'frost');
    return { updatedMap, updatedFields, didFreeze: true };
  }
  return { updatedMap: map, updatedFields: fields, didFreeze: false };
}

/**
 * Spawns a steam cloud that obscures vision and dampens fires.
 */
export function spawnSteamAt(
  fields: ElementalTile[],
  x: number,
  y: number,
  duration: number = 4
): ElementalTile[] {
  return addOrReinforceElementalTile(fields, x, y, 'steam', duration, 2, 'vapor');
}

/**
 * Spawns poison gas cloud.
 */
export function spawnPoisonGasAt(
  fields: ElementalTile[],
  x: number,
  y: number,
  duration: number = 5
): ElementalTile[] {
  return addOrReinforceElementalTile(fields, x, y, 'poison_gas', duration, 1, 'toxic_vent');
}

/**
 * Conducts electricity across contiguous water tiles starting from (startX, startY).
 */
export function electrifyConnectedWater(
  map: TileType[][],
  fields: ElementalTile[],
  startX: number,
  startY: number,
  maxSpread: number = 12
): { updatedFields: ElementalTile[]; shockedCoordinates: { x: number; y: number }[] } {
  const shockedCoordinates: { x: number; y: number }[] = [];
  const visited = new Set<string>();
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  visited.add(`${startX},${startY}`);

  let currentFields = [...fields];

  while (queue.length > 0 && shockedCoordinates.length < maxSpread) {
    const curr = queue.shift()!;
    const tile = map[curr.y]?.[curr.x];

    if (tile === TileType.Water || (curr.x === startX && curr.y === startY)) {
      shockedCoordinates.push(curr);
      currentFields = addOrReinforceElementalTile(currentFields, curr.x, curr.y, 'shock', 2, 2, 'electricity');

      const neighbors = [
        { x: curr.x + 1, y: curr.y },
        { x: curr.x - 1, y: curr.y },
        { x: curr.x, y: curr.y + 1 },
        { x: curr.x, y: curr.y - 1 },
      ];

      for (const n of neighbors) {
        const key = `${n.x},${n.y}`;
        if (!visited.has(key) && map[n.y]?.[n.x] === TileType.Water) {
          visited.add(key);
          queue.push(n);
        }
      }
    }
  }

  return { updatedFields: currentFields, shockedCoordinates };
}

/**
 * Checks if line of sight passes through a dense steam cloud.
 */
export function isVisionObscuredBySteam(
  fields: ElementalTile[] | undefined,
  x: number,
  y: number
): boolean {
  if (!fields || fields.length === 0) return false;
  return fields.some((f) => f.x === x && f.y === y && f.element === 'steam' && f.duration > 0);
}

/**
 * Master turn-based elemental propagation tick.
 * Handles cellular fire spread, water-fire vaporization into steam,
 * poison gas deflagrations, electrical conduction, and environmental damage.
 */
export function advanceElementalPropagation(
  state: GameState,
  px: number,
  py: number
): ElementalPropagationResult {
  const currentFields = state.elementalFields || [];
  if (currentFields.length === 0) {
    return {
      updatedFields: [],
      mapModifications: [],
      playerDamage: 0,
      entityDamages: [],
      logs: [],
      floaters: [],
    };
  }

  const map = state.map;
  const weather = state.weather || 'clear';
  const isWetWeather = weather === 'rainy' || weather === 'tidal_surge';
  const isDryWeather = weather === 'sandstorm';

  const mapModifications: { x: number; y: number; newTile: TileType }[] = [];
  const logs: { text: string; type: string }[] = [];
  const floaters: { x: number; y: number; text: string; type: 'dmg' | 'heal' | 'crit' }[] = [];
  let playerDamage = 0;
  const entityDamages: { entityId: string; damage: number }[] = [];
  let soundToPlay: string | undefined;

  // Spatial lookup for quick element queries
  const fieldLookup = new Map<string, ElementalTile>();
  for (const f of currentFields) {
    fieldLookup.set(`${f.x},${f.y}:${f.element}`, f);
  }

  const nextFields: ElementalTile[] = [];
  const newSpreadFields: ElementalTile[] = [];
  const deflagrationTiles = new Set<string>();

  // 1. Check for Gas Deflagrations (Fire touching Poison Gas)
  for (const f of currentFields) {
    if (f.element === 'fire') {
      const gasNeighbor = currentFields.find(
        (g) => g.element === 'poison_gas' && Math.abs(g.x - f.x) <= 1 && Math.abs(g.y - f.y) <= 1
      );
      if (gasNeighbor) {
        deflagrationTiles.add(`${gasNeighbor.x},${gasNeighbor.y}`);
      }
    }
  }

  // If any gas ignited, trigger deflagration explosion
  if (deflagrationTiles.size > 0) {
    soundToPlay = 'trap';
    logs.push({
      text: `💥 [GAS DEFLAGRATION]: The flame ignites a toxic gas pocket in a thunderous fireburst!`,
      type: 'danger',
    });

    for (const coordStr of deflagrationTiles) {
      const [gx, gy] = coordStr.split(',').map(Number);
      floaters.push({ x: gx, y: gy, text: '💥 EXPLOSION!', type: 'crit' });

      // AOE blast 3x3
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const bx = gx + dx;
          const by = gy + dy;

          // Damage player if in blast
          if (bx === px && by === py && !isPlayerInvincible(state, state.playerStats)) {
            const dmg = Math.floor(Math.random() * 10) + 15;
            playerDamage += dmg;
            floaters.push({ x: px, y: py, text: `-${dmg} Blast`, type: 'dmg' });
          }

          // Damage enemies in blast
          for (const enemy of state.enemies) {
            if (enemy.x === bx && enemy.y === by && enemy.hp > 0) {
              const dmg = Math.floor(Math.random() * 12) + 18;
              entityDamages.push({ entityId: enemy.id, damage: dmg });
              floaters.push({ x: bx, y: by, text: `-${dmg} Blast`, type: 'crit' });
            }
          }

          // Burn flammable terrain
          const tile = map[by]?.[bx];
          if (tile && isTileFlammable(tile)) {
            newSpreadFields.push({
              id: `elem_fire_${bx}_${by}_${Date.now()}`,
              x: bx,
              y: by,
              element: 'fire',
              duration: 4,
              intensity: 2,
              source: 'deflagration',
            });
          }
        }
      }
    }
  }

  // 2. Process Each Elemental Tile
  for (const elem of currentFields) {
    // If this gas tile was exploded, purge it
    if (elem.element === 'poison_gas' && deflagrationTiles.has(`${elem.x},${elem.y}`)) {
      continue;
    }

    let durationLoss = 1;
    if (elem.element === 'fire' && isWetWeather) {
      durationLoss = 2; // Rain quenches fire twice as fast
    }

    const currentTile = map[elem.y]?.[elem.x];

    // FIRE ELEMENT
    if (elem.element === 'fire') {
      // Fire on water or ice immediately creates steam and extinguishes
      if (currentTile === TileType.Water) {
        newSpreadFields.push({
          id: `elem_steam_${elem.x}_${elem.y}_${Date.now()}`,
          x: elem.x,
          y: elem.y,
          element: 'steam',
          duration: 3,
          intensity: 2,
        });
        continue; // Extinguished
      }

      if (currentTile === TileType.Ice) {
        // Melts ice back to water and creates steam
        mapModifications.push({ x: elem.x, y: elem.y, newTile: TileType.Water });
        newSpreadFields.push({
          id: `elem_steam_${elem.x}_${elem.y}_${Date.now()}`,
          x: elem.x,
          y: elem.y,
          element: 'steam',
          duration: 3,
          intensity: 2,
        });
        logs.push({
          text: `💧 Searing flames melt the frozen ice sheet back into cold water!`,
          type: 'info',
        });
        continue; // Extinguished by water
      }

      // Burn down flammable structures
      if (currentTile && isTileFlammable(currentTile)) {
        if (elem.duration <= 2) {
          // Destroys door or vegetation
          if (currentTile === TileType.Door) {
            mapModifications.push({ x: elem.x, y: elem.y, newTile: TileType.Floor });
            logs.push({
              text: `🚪🔥 A wooden door is reduced to glowing ash by the spreading fire!`,
              type: 'system',
            });
          } else if (
            currentTile === TileType.Bush ||
            currentTile === TileType.Grass ||
            currentTile === TileType.Tree ||
            currentTile === TileType.PineTree ||
            currentTile === TileType.BirchTree
          ) {
            mapModifications.push({ x: elem.x, y: elem.y, newTile: TileType.Ash });
          } else if (
            currentTile === TileType.Table ||
            currentTile === TileType.Chair ||
            currentTile === TileType.Bed ||
            currentTile === TileType.FieldTent ||
            currentTile === TileType.Bedroll
          ) {
            mapModifications.push({ x: elem.x, y: elem.y, newTile: TileType.Floor });
          }
        }
      }

      // Deal fire damage to player if standing in fire
      if (elem.x === px && elem.y === py && !isPlayerInvincible(state, state.playerStats)) {
        const fireDmg = Math.floor(Math.random() * 3) + 3;
        playerDamage += fireDmg;
        logs.push({
          text: `🔥 You take ${fireDmg} searing fire damage from the burning ground!`,
          type: 'danger',
        });
        floaters.push({ x: px, y: py, text: `-${fireDmg} Fire`, type: 'dmg' });
      }

      // Deal fire damage to enemies standing in fire
      for (const enemy of state.enemies) {
        if (enemy.x === elem.x && enemy.y === elem.y && enemy.hp > 0) {
          const eFireDmg = Math.floor(Math.random() * 4) + 4;
          entityDamages.push({ entityId: enemy.id, damage: eFireDmg });
          floaters.push({ x: enemy.x, y: enemy.y, text: `-${eFireDmg} Fire`, type: 'dmg' });
        }
      }

      // Cellular Fire Spread to orthogonal/diagonal neighbors
      const spreadChance = isDryWeather ? 0.55 : isWetWeather ? 0.08 : 0.35;
      if (Math.random() < spreadChance && elem.intensity >= 1) {
        const neighbors = [
          { x: elem.x + 1, y: elem.y },
          { x: elem.x - 1, y: elem.y },
          { x: elem.x, y: elem.y + 1 },
          { x: elem.x, y: elem.y - 1 },
          { x: elem.x + 1, y: elem.y + 1 },
          { x: elem.x - 1, y: elem.y - 1 },
        ];

        for (const n of neighbors) {
          const nTile = map[n.y]?.[n.x];
          if (nTile) {
            if (isTileFlammable(nTile)) {
              if (!fieldLookup.has(`${n.x},${n.y}:fire`)) {
                newSpreadFields.push({
                  id: `elem_fire_${n.x}_${n.y}_${Date.now()}_${Math.random()}`,
                  x: n.x,
                  y: n.y,
                  element: 'fire',
                  duration: 4,
                  intensity: 1,
                  source: 'spread',
                });
              }
            } else if (nTile === TileType.Water || nTile === TileType.Ice) {
              // Water border produces steam
              if (!fieldLookup.has(`${n.x},${n.y}:steam`)) {
                newSpreadFields.push({
                  id: `elem_steam_${n.x}_${n.y}_${Date.now()}_${Math.random()}`,
                  x: n.x,
                  y: n.y,
                  element: 'steam',
                  duration: 3,
                  intensity: 1,
                });
              }
            }
          }
        }
      }
    }

    // ICE ELEMENT
    else if (elem.element === 'ice') {
      // If duration expires, ice melts back into water
      if (elem.duration - durationLoss <= 0) {
        mapModifications.push({ x: elem.x, y: elem.y, newTile: TileType.Water });
        logs.push({
          text: `💧 The frozen ice has melted back into open water.`,
          type: 'info',
        });
      }
    }

    // SHOCK ELEMENT
    else if (elem.element === 'shock') {
      // Conductive shock damage to entities in the electrified area
      if (elem.x === px && elem.y === py && !isPlayerInvincible(state, state.playerStats)) {
        const shockDmg = Math.floor(Math.random() * 4) + 4;
        playerDamage += shockDmg;
        logs.push({
          text: `⚡ Electrified water shocks your body for ${shockDmg} shock damage!`,
          type: 'danger',
        });
        floaters.push({ x: px, y: py, text: `-${shockDmg} Shock`, type: 'dmg' });
      }

      for (const enemy of state.enemies) {
        if (enemy.x === elem.x && enemy.y === elem.y && enemy.hp > 0) {
          const eShockDmg = Math.floor(Math.random() * 5) + 5;
          entityDamages.push({ entityId: enemy.id, damage: eShockDmg });
          floaters.push({ x: enemy.x, y: enemy.y, text: `-${eShockDmg} Shock`, type: 'dmg' });
        }
      }
    }

    // POISON GAS ELEMENT
    else if (elem.element === 'poison_gas') {
      if (elem.x === px && elem.y === py && !isPlayerInvincible(state, state.playerStats)) {
        const pDmg = 3;
        playerDamage += pDmg;
        logs.push({
          text: `🧪 Noxious fumes poison your lungs for ${pDmg} toxic damage!`,
          type: 'danger',
        });
        floaters.push({ x: px, y: py, text: `-${pDmg} Poison`, type: 'dmg' });
      }

      for (const enemy of state.enemies) {
        if (enemy.x === elem.x && enemy.y === elem.y && enemy.hp > 0) {
          entityDamages.push({ entityId: enemy.id, damage: 3 });
          floaters.push({ x: enemy.x, y: enemy.y, text: `-3 Poison`, type: 'dmg' });
        }
      }
    }

    // Decrement duration
    const remaining = elem.duration - durationLoss;
    if (remaining > 0) {
      nextFields.push({
        ...elem,
        duration: remaining,
      });
    }
  }

  // Merge new spread fields
  for (const s of newSpreadFields) {
    const existing = nextFields.find((f) => f.x === s.x && f.y === s.y && f.element === s.element);
    if (!existing) {
      nextFields.push(s);
    }
  }

  return {
    updatedFields: nextFields,
    mapModifications,
    playerDamage,
    entityDamages,
    logs,
    floaters,
    soundToPlay,
  };
}
