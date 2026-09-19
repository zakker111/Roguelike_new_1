import { NPC, Enemy, GameState, TileType } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { getNextStepTowards, getNextStepAwayFrom, isTileWalkableForEntity } from '../../utils/ai';
import {
  getWeatherAmbientBark,
  getTavernDrinkingBark,
  getCampfireDialogueBark,
  getBlizzardShelterBark,
  getTownAlarmReactionBark,
  getFactionStandingBark,
  getAnimalShelterBark,
  getMorningRoutineBark
} from '../../utils/npcDialogue';

function safeDispatchEffect(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-game-effect', { detail });
    window.dispatchEvent(ev);
  }
}

export interface CivilianAIParams {
  nextNpcs: NPC[];
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  prev: GameState;
  px: number;
  py: number;
  nextGuardsHostile: boolean;
  staticLogs: string[];
  applyDamageToEnemy: (target: Enemy, damage: number) => boolean;
}

export function resolveCivilianNpcTurns({
  nextNpcs,
  nextEnemies,
  updatedEnemiesList,
  prev,
  px,
  py,
  nextGuardsHostile,
  staticLogs,
  applyDamageToEnemy,
}: CivilianAIParams): NPC[] {
  if (!nextNpcs || nextNpcs.length === 0) {
    return [];
  }

  const moveDirs = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
  ];
  const currentMinutes = prev.gameTime || 0;
  const currentHour = Math.floor((currentMinutes % 1440) / 60);
  const currentW = prev.weather || 'clear';
  const isSevereWeather = currentW === 'blizzard' || currentW === 'snowy' || currentW === 'rainy' || currentW === 'sandstorm';
  const isNight = currentHour >= 20 || currentHour < 5;
  const isDawn = currentHour >= 5 && currentHour < 8;
  const isDusk = currentHour >= 17 && currentHour < 20;

  const tavernNpc = nextNpcs.find(n => n.id?.startsWith('npc_tavernmaster_'));

  // Find outdoor Campfire, Bed, Chair, and Indoor floor tiles on map
  let mapCampfire: { x: number; y: number } | null = null;
  const mapBeds: { x: number; y: number }[] = [];
  const mapChairs: { x: number; y: number }[] = [];
  const mapIndoorFloors: { x: number; y: number }[] = [];
  const mapAnvils: { x: number; y: number }[] = [];

  if (prev.map) {
    for (let ry = 0; ry < prev.map.length; ry++) {
      for (let rx = 0; rx < prev.map[0].length; rx++) {
        const t = prev.map[ry]?.[rx];
        if (t === TileType.Campfire && !mapCampfire) {
          mapCampfire = { x: rx, y: ry };
        } else if (t === TileType.Bed || t === TileType.Bedroll) {
          mapBeds.push({ x: rx, y: ry });
        } else if (t === TileType.Chair) {
          mapChairs.push({ x: rx, y: ry });
        } else if (t === TileType.Floor || t === TileType.WatchtowerDeck) {
          mapIndoorFloors.push({ x: rx, y: ry });
        } else if (t === TileType.Anvil) {
          mapAnvils.push({ x: rx, y: ry });
        }
      }
    }
  }

  // Build fast spatial lookup sets
  const enemyPosSet = new Set<string>();
  if (nextEnemies && nextEnemies.length > 0) {
    for (let i = 0; i < nextEnemies.length; i++) {
      const e = nextEnemies[i];
      if (e) enemyPosSet.add(`${e.x},${e.y}`);
    }
  }

  return nextNpcs.map((npc) => {
    if (!npc) return npc;
    const isCat = npc.id?.startsWith('npc_cat_') || npc.role === 'special_cat';

    // Stray Animals (cats, dogs, fauna)
    if (isCat) {
      if (isSevereWeather || isNight) {
        // Stray animal seeks shelter from severe weather or night cold
        const curTile = prev.map?.[npc.y]?.[npc.x];
        const isSheltered = curTile === TileType.Floor ||
                            curTile === TileType.WatchtowerDeck ||
                            curTile === TileType.Bed ||
                            curTile === TileType.Bedroll;

        if (isSheltered) {
          // Sheltered indoors: sits comfortably or sleeps
          const distToPlayer = Math.abs(npc.x - px) + Math.abs(npc.y - py);
          if (distToPlayer <= 5 && Math.random() < 0.04) {
            staticLogs.push(getAnimalShelterBark(npc, currentW));
          }
          return {
            ...npc,
            isSitting: true,
            isAsleep: isNight,
            char: isNight ? '💤' : '🐱'
          };
        } else if (mapIndoorFloors.length > 0) {
          // Path towards nearest indoor shelter tile
          let nearestIndoor: { x: number; y: number } | null = null;
          let minInDist = 999;
          for (const ind of mapIndoorFloors) {
            const d = Math.abs(ind.x - npc.x) + Math.abs(ind.y - npc.y);
            if (d < minInDist) {
              minInDist = d;
              nearestIndoor = ind;
            }
          }
          if (nearestIndoor) {
            const step = getNextStepTowards(npc.x, npc.y, nearestIndoor.x, nearestIndoor.y, prev.map, false, []);
            if (step && (step.x !== px || step.y !== py)) {
              const isBlockedByEnemy = enemyPosSet.has(`${step.x},${step.y}`);
              const isTileWalkable = isTileWalkableForEntity(prev.map[step.y]?.[step.x], { canOpenDoors: false });
              if (!isBlockedByEnemy && isTileWalkable) {
                return {
                  ...npc,
                  x: step.x,
                  y: step.y,
                  isSitting: false,
                  isAsleep: false,
                  char: '🐱'
                };
              }
            }
          }
        }
      }

      // Normal daytime clear weather: playful random wandering
      if (Math.random() < 0.6) {
        const dir = moveDirs[Math.floor(Math.random() * moveDirs.length)];
        const nx = npc.x + dir.dx;
        const ny = npc.y + dir.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const tile = prev.map[ny]?.[nx];
          const isWalkable = isTileWalkableForEntity(tile, { canOpenDoors: false });
          const isOccupiedByPlayer = nx === px && ny === py;
          const isOccupiedByEnemy = enemyPosSet.has(`${nx},${ny}`);
          if (isWalkable && !isOccupiedByPlayer && !isOccupiedByEnemy) {
            return { ...npc, x: nx, y: ny, isSitting: false, isAsleep: false, char: '🐱' };
          }
        }
      }
      return npc;
    }

    const origChar = npc.originalChar || npc.char;

    // Check for active hostile threats attacking the town
    let nearestHostile: Enemy | null = null;
    let minHostileDist = 999;
    for (let i = 0; i < updatedEnemiesList.length; i++) {
      const e = updatedEnemiesList[i];
      if (e && e.hp > 0 && !e.isFollower && (!e.isTownGuard || nextGuardsHostile)) {
        const d = Math.abs(e.x - npc.x) + Math.abs(e.y - npc.y);
        if (d < minHostileDist) {
          minHostileDist = d;
          nearestHostile = e;
        }
      }
    }

    const isHeroForHire = (npc.role as string) === 'companion_hire' || (npc.role as string) === 'guard';

    if (nearestHostile && minHostileDist <= 12) {
      // Alarm reaction bark when threat approaches town
      const distToPlayer = Math.abs(npc.x - px) + Math.abs(npc.y - py);
      if (distToPlayer <= 6 && Math.random() < 0.15) {
        staticLogs.push(`📢 ${getTownAlarmReactionBark(npc, nearestHostile.name)}`);
      }

      if (isHeroForHire) {
        const dx = Math.abs(nearestHostile.x - npc.x);
        const dy = Math.abs(nearestHostile.y - npc.y);
        const inAtkRange = dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);

        if (inAtkRange) {
          const heroDmg = Math.max(4, 12 - (nearestHostile.def || 0));
          const isKilled = applyDamageToEnemy(nearestHostile, heroDmg);
          const isVisible = (prev.visible[npc.y]?.[npc.x] ?? false) || (prev.visible[nearestHostile.y]?.[nearestHostile.x] ?? false);
          if (isVisible) {
            staticLogs.push(`⚔️ [HERO FOR HIRE]: ${npc.name} charges forward and strikes hostile ${nearestHostile.name} for ${heroDmg} damage!`);
            safeDispatchEffect({ x: nearestHostile.x, y: nearestHostile.y, text: `-${heroDmg} HP`, type: 'dmg' });
          }
          if (isKilled && isVisible) {
            staticLogs.push(`☠️ [TOWN HERO VICTORIOUS]: Hero ${npc.name} defeated ${nearestHostile.name}!`);
          }
          return {
            ...npc,
            isAsleep: false,
            isSitting: false,
            isDrinking: false,
            originalChar: origChar,
            char: '⚔️'
          };
        } else {
          const step = getNextStepTowards(npc.x, npc.y, nearestHostile.x, nearestHostile.y, prev.map, true, []);
          if (step && (step.x !== px || step.y !== py)) {
            const isBlockedByEnemy = enemyPosSet.has(`${step.x},${step.y}`);
            const isTileWalkable = isTileWalkableForEntity(prev.map[step.y]?.[step.x], { canOpenDoors: true });
            if (!isBlockedByEnemy && isTileWalkable) {
              if (distToPlayer <= 6 && Math.random() < 0.2) {
                staticLogs.push(`🗡️ [HERO FOR HIRE]: ${npc.name} draws their weapon to engage ${nearestHostile.name}!`);
              }
              return {
                ...npc,
                x: step.x,
                y: step.y,
                isAsleep: false,
                isSitting: false,
                isDrinking: false,
                originalChar: origChar,
                char: '⚔️'
              };
            }
          }
        }
      } else if (!isCat) {
        const fleeStep = getNextStepAwayFrom(npc.x, npc.y, nearestHostile.x, nearestHostile.y, prev.map, true, []);
        if (fleeStep) {
          const isBlockedByPlayer = fleeStep.x === px && fleeStep.y === py;
          const isBlockedByEnemy = enemyPosSet.has(`${fleeStep.x},${fleeStep.y}`);
          const isTileWalkable = isTileWalkableForEntity(prev.map[fleeStep.y]?.[fleeStep.x], { canOpenDoors: true });
          if (!isBlockedByPlayer && !isBlockedByEnemy && isTileWalkable) {
            if (distToPlayer <= 6 && Math.random() < 0.12) {
              staticLogs.push(`😱 [VILLAGER PANIC]: ${npc.name} screams in terror and flees from ${nearestHostile.name}!`);
            }
            return {
              ...npc,
              x: fleeStep.x,
              y: fleeStep.y,
              isAsleep: false,
              isSitting: false,
              isDrinking: false,
              originalChar: origChar,
              char: '😱'
            };
          }
        }
      }
    }

    if (npc.isAsleep && isNight && npc.scheduleState === 'home') {
      return npc;
    }

    const isBlizzard = (currentW as string) === 'blizzard' || (currentW as string) === 'snowy';

    if (!npc.isAsleep) {
      const dist = Math.abs(npc.x - px) + Math.abs(npc.y - py);
      if (dist <= 6) {
        if (isBlizzard && Math.random() < 0.04) {
          staticLogs.push(`🗣️ ${getBlizzardShelterBark(npc)}`);
        } else if (((currentW as string) === 'rainy' || (currentW as string) === 'sandstorm' || (currentW as string) === 'foggy') && Math.random() < 0.03) {
          const bark = getWeatherAmbientBark(npc, currentW, isNight ? 'night' : 'day');
          staticLogs.push(`🗣️ ${bark}`);
        } else if (isDawn && Math.random() < 0.03) {
          staticLogs.push(`🗣️ ${getMorningRoutineBark(npc)}`);
        } else if (dist <= 4 && prev.factionReputation && Math.random() < 0.03) {
          const repScore = (npc.role as string)?.includes('syndicate')
            ? (prev.factionReputation.syndicate ?? 0)
            : (npc.role as string)?.includes('bandit')
            ? (prev.factionReputation.bandits ?? 0)
            : (prev.factionReputation.vanguard ?? 0);
          const fName = (npc.role as string)?.includes('syndicate')
            ? 'Shadow Syndicate'
            : (npc.role as string)?.includes('bandit')
            ? 'Outlaw Clans'
            : 'Iron Vanguard';
          staticLogs.push(`🗣️ ${getFactionStandingBark(npc, repScore, fName)}`);
        }
      }
    }

    // Resolve schedule state based on time of day & weather
    let targetSched: 'home' | 'work' | 'leisure' | 'campfire' = 'work';

    if (isNight) {
      // Night: Return home to sleep in bed
      targetSched = 'home';
    } else if (isSevereWeather) {
      // Severe Weather: Seek shelter inside tavern or home
      const isTavernVisitor = [
        'villager', 'apothecary', 'companion_hire', 'merchant',
        'dockworker', 'sailor', 'patron', 'townsperson', 'guard', 'fishmonger', 'blacksmith'
      ].includes(npc.role);
      targetSched = (isTavernVisitor && tavernNpc) ? 'leisure' : 'home';
    } else if (isDusk) {
      // Dusk: Gather around outdoor campfire or tavern for ale & food
      if (mapCampfire && (npc.role === 'villager' || npc.role === 'townsperson' || npc.role === 'dockworker')) {
        targetSched = 'campfire';
      } else {
        const isTavernVisitor = [
          'villager', 'apothecary', 'companion_hire', 'merchant',
          'dockworker', 'sailor', 'patron', 'townsperson', 'guard', 'fishmonger', 'blacksmith'
        ].includes(npc.role);
        targetSched = (isTavernVisitor && tavernNpc) ? 'leisure' : 'home';
      }
    } else if (currentHour >= 12 && currentHour < 13) {
      // Midday lunch break at tavern
      const isTavernVisitor = ['villager', 'dockworker', 'patron', 'townsperson'].includes(npc.role);
      targetSched = (isTavernVisitor && tavernNpc) ? 'leisure' : 'work';
    } else if (isDawn || !isNight) {
      // Dawn & Daytime: Work at assigned station (forge anvil, market stalls, counter, or fields)
      targetSched = 'work';
    }

    let tx = npc.workX ?? npc.x;
    let ty = npc.workY ?? npc.y;

    if (targetSched === 'work') {
      if (npc.role === 'blacksmith' && mapAnvils.length > 0) {
        tx = mapAnvils[0].x;
        ty = mapAnvils[0].y;
      } else {
        tx = npc.workX ?? npc.x;
        ty = npc.workY ?? npc.y;
      }
    } else if (targetSched === 'home') {
      const baseHomeX = npc.homeX ?? npc.x;
      const baseHomeY = npc.homeY ?? npc.y;
      
      if (isNight) {
        // Sleep in bed: find nearest bed to home
        let nearestBed: { x: number; y: number } | null = null;
        let minBedDist = 999;
        for (const bed of mapBeds) {
          const d = Math.abs(bed.x - baseHomeX) + Math.abs(bed.y - baseHomeY);
          if (d < minBedDist && d <= 10) {
            minBedDist = d;
            nearestBed = bed;
          }
        }
        if (nearestBed) {
          tx = nearestBed.x;
          ty = nearestBed.y;
        } else {
          tx = baseHomeX;
          ty = baseHomeY;
        }
      } else {
        // Daytime / weather shelter at home: prefer sitting on home chair or sheltered indoor floor
        let nearestChair: { x: number; y: number } | null = null;
        let minChairDist = 999;
        for (const chair of mapChairs) {
          const d = Math.abs(chair.x - baseHomeX) + Math.abs(chair.y - baseHomeY);
          if (d < minChairDist && d <= 6) {
            minChairDist = d;
            nearestChair = chair;
          }
        }
        if (nearestChair) {
          tx = nearestChair.x;
          ty = nearestChair.y;
        } else {
          tx = baseHomeX;
          ty = baseHomeY;
        }
      }
    } else if (targetSched === 'leisure') {
      if (tavernNpc) {
        // Find tavern chairs near tavern master
        const tavernChairs = mapChairs.filter(c => {
          const d = Math.abs(c.x - tavernNpc.homeX) + Math.abs(c.y - tavernNpc.homeY);
          return d <= 8;
        });

        if (tavernChairs.length > 0) {
          const seed = Math.abs((npc.id || npc.name).charCodeAt(0));
          const assignedChair = tavernChairs[seed % tavernChairs.length];
          tx = assignedChair.x;
          ty = assignedChair.y;
        } else {
          const offset = Math.abs(((npc.name || '').charCodeAt(0) * 3) % 4) - 2;
          tx = tavernNpc.homeX + offset;
          ty = tavernNpc.homeY + 2;
        }
      } else {
        tx = npc.homeX ?? npc.x;
        ty = npc.homeY ?? npc.y;
      }
    } else if (targetSched === 'campfire' && mapCampfire) {
      const seed = Math.abs((npc.id || npc.name).charCodeAt(0));
      const offsets = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
      ];
      const chosen = offsets[seed % offsets.length];
      tx = Math.max(0, Math.min(LEVEL_WIDTH - 1, mapCampfire.x + chosen.dx));
      ty = Math.max(0, Math.min(LEVEL_HEIGHT - 1, mapCampfire.y + chosen.dy));
    }

    if (npc.x === tx && npc.y === ty) {
      if (targetSched === 'home' && isNight) {
        return {
          ...npc,
          scheduleState: 'home',
          isAsleep: true,
          isSitting: false,
          isDrinking: false,
          originalChar: origChar,
          char: '😴'
        };
      }
      if (targetSched === 'leisure') {
        const dist = Math.abs(npc.x - px) + Math.abs(npc.y - py);
        if (dist <= 6 && Math.random() < 0.04) {
          staticLogs.push(`🗣️ ${getTavernDrinkingBark(npc)}`);
        }
        return {
          ...npc,
          scheduleState: 'leisure',
          isAsleep: false,
          isSitting: true,
          isDrinking: true,
          originalChar: origChar,
          char: '🍻'
        };
      }
      if (targetSched === 'campfire') {
        const dist = Math.abs(npc.x - px) + Math.abs(npc.y - py);
        if (dist <= 6 && Math.random() < 0.05) {
          staticLogs.push(`🗣️ ${getCampfireDialogueBark(npc)}`);
        }
        return {
          ...npc,
          scheduleState: 'campfire',
          isAsleep: false,
          isSitting: true,
          isDrinking: false,
          originalChar: origChar,
          char: '🔥'
        };
      }
      if (targetSched === 'home') {
        return {
          ...npc,
          scheduleState: 'home',
          isAsleep: false,
          isSitting: true,
          isDrinking: false,
          originalChar: origChar,
          char: '🪑'
        };
      }
      return {
        ...npc,
        scheduleState: targetSched,
        isAsleep: false,
        isSitting: false,
        isDrinking: false,
        char: origChar
      };
    }

    const nextStep = getNextStepTowards(npc.x, npc.y, tx, ty, prev.map, true, []);
    if (nextStep) {
      const posKey = `${nextStep.x},${nextStep.y}`;
      const isBlockedByPlayer = nextStep.x === px && nextStep.y === py;
      const isBlockedByEnemy = enemyPosSet.has(posKey);
      let isBlockedByNpc = false;
      for (let i = 0; i < nextNpcs.length; i++) {
        const other = nextNpcs[i];
        if (other && other.id !== npc.id && other.x === nextStep.x && other.y === nextStep.y) {
          isBlockedByNpc = true;
          break;
        }
      }

      const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
        canOpenDoors: true,
        isBedWalkable: targetSched === 'home' && nextStep.x === tx && nextStep.y === ty
      });

      if (!isBlockedByPlayer && !isBlockedByEnemy && !isBlockedByNpc && isTileWalkable) {
        return {
          ...npc,
          x: nextStep.x,
          y: nextStep.y,
          scheduleState: targetSched,
          isAsleep: false,
          originalChar: origChar,
          char: origChar
        };
      }
    }

    return {
      ...npc,
      scheduleState: targetSched,
      isAsleep: false,
      originalChar: origChar,
      char: origChar
    };
  });
}

