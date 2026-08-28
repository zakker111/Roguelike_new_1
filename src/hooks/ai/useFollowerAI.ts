import { Enemy, GameState, TileType } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { getNextStepTowards, hasLineOfSight } from '../../utils/ai';
import { incrementDefeatedEnemyCount } from '../../utils/bestiary';
import { FollowerAIParams, FollowerActionResult } from './types';

function safeDispatchEffect(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-game-effect', { detail });
    window.dispatchEvent(ev);
  }
}

export function processFollowerTurn(params: FollowerAIParams): FollowerActionResult {
  const {
    i,
    px,
    py,
    prev,
    nextGuardsHostile,
    nextEnemies,
    updatedEnemiesList,
    updatedStats,
    staticLogs,
    playSound,
    applyDamageToEnemy,
  } = params;

  let e = { ...params.e };
  let nextDefeatedCounts = { ...params.nextDefeatedCounts };

  // Determine follower attack range based on equipped equipment / tags
  let followerRange = e.range || 1;
  let rangedType: 'melee' | 'bow' | 'magic' | 'spear' = 'melee';
  const folNameLower = e.name.toLowerCase();

  const isArcher = folNameLower.includes('archer') || folNameLower.includes('ranger') || folNameLower.includes('hunter') || folNameLower.includes('marksman') || folNameLower.includes('bow');
  const isMage = folNameLower.includes('mage') || folNameLower.includes('wizard') || folNameLower.includes('sorcerer') || folNameLower.includes('warlock') || folNameLower.includes('druid') || folNameLower.includes('cleric');
  const isSpearman = folNameLower.includes('spear') || folNameLower.includes('pikeman') || folNameLower.includes('halberd') || folNameLower.includes('lancer');

  if (isArcher) {
    followerRange = Math.max(followerRange, 5);
    rangedType = 'bow';
  } else if (isMage) {
    followerRange = Math.max(followerRange, 4);
    rangedType = 'magic';
  } else if (isSpearman) {
    followerRange = Math.max(followerRange, 2);
    rangedType = 'spear';
  }

  // Find nearest hostile target
  let nearestTarget: Enemy | null = null;
  let minTargetDist = 999;

  for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
    if (targetIdx === i) continue;
    const target = nextEnemies[targetIdx];
    if (target.hp > 0 && !target.isFollower && (!target.isTownGuard || nextGuardsHostile)) {
      const d = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
      if (d < minTargetDist) {
        minTargetDist = d;
        nearestTarget = target;
      }
    }
  }

  let attackedEnemy = false;
  if (nearestTarget) {
    const target = nearestTarget;
    const dx = Math.abs(target.x - e.x);
    const dy = Math.abs(target.y - e.y);
    const inRange = followerRange === 1 
      ? (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0))
      : (dx <= followerRange && dy <= followerRange && (dx > 0 || dy > 0));

    if (inRange) {
      const canAttack = followerRange === 1 || hasLineOfSight(e.x, e.y, target.x, target.y, prev.map);
      if (canAttack) {
        let followerDmg = Math.max(1, e.atk - (target.def || 0));
        
        // Relic Synergy: Crown of Command boosts companion damage by +35%
        if (updatedStats.relics?.includes('crown_of_command')) {
          followerDmg = Math.round(followerDmg * 1.35);
        }

        // Apply critical strike chance to companions based on player Luck
        const isFolCrit = Math.random() < 0.15;
        if (isFolCrit) {
          followerDmg = Math.round(followerDmg * 1.5);
        }

        const isKilled = applyDamageToEnemy(target, followerDmg);
        const isActionVisible = (prev.visible[target.y]?.[target.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);

        if (isActionVisible) {
          if (rangedType === 'bow') {
            staticLogs.push(`🏹 [COMPANION RANGED]: ${e.name} shoots an arrow at ${target.name} for ${followerDmg} damage!`);
            playSound('arrow', { x: target.x, y: target.y, playerX: px, playerY: py });
          } else if (rangedType === 'magic') {
            staticLogs.push(`✨ [COMPANION SPELL]: ${e.name} launches an elemental bolt at ${target.name} for ${followerDmg} damage!`);
            playSound('spell', { x: target.x, y: target.y, playerX: px, playerY: py });
          } else if (rangedType === 'spear') {
            staticLogs.push(`🔱 [COMPANION REACH]: ${e.name} thrusts their spear at ${target.name} for ${followerDmg} damage!`);
            playSound('slash', { x: target.x, y: target.y, playerX: px, playerY: py });
          } else {
            staticLogs.push(`🛡️ [COMPANION]: ${e.name} strikes ${target.name} for ${followerDmg} damage!`);
            playSound('slash', { x: target.x, y: target.y, playerX: px, playerY: py });
          }

          safeDispatchEffect({ x: target.x, y: target.y, sourceX: e.x, sourceY: e.y, text: `-${followerDmg}`, type: 'dmg' });
        }

        attackedEnemy = true;
        if (isKilled) {
          if (isActionVisible) {
            staticLogs.push(`☠️ [COMPANION KILL]: ${e.name} defeated ${target.name}!`);
          }
          nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, target.name, target.type, !!target.isBoss);
        }
      }
    }
  }

  // Follower Movement Logic
  if (!attackedEnemy) {
    const distToPlayer = Math.abs(px - e.x) + Math.abs(py - e.y);
    let targetX = px;
    let targetY = py;

    if (nearestTarget && minTargetDist <= 8 && distToPlayer <= 10) {
      if (followerRange > 1) {
        if (minTargetDist < 2) {
          // Tactical Retreat: Back away from melee attackers to maintain optimal firing distance
          const dirX = Math.sign(e.x - nearestTarget.x);
          const dirY = Math.sign(e.y - nearestTarget.y);
          targetX = Math.max(0, Math.min(LEVEL_WIDTH - 1, e.x + dirX * 2));
          targetY = Math.max(0, Math.min(LEVEL_HEIGHT - 1, e.y + dirY * 2));
        } else {
          targetX = nearestTarget.x;
          targetY = nearestTarget.y;
        }
      } else {
        targetX = nearestTarget.x;
        targetY = nearestTarget.y;
      }
    } else {
      // Stay near the player
      const offsets = [
        { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
      ];
      let bestTile = { x: px, y: py };
      let bestDist = 999;

      for (const off of offsets) {
        const cx = px + off.dx;
        const cy = py + off.dy;
        if (cx >= 0 && cx < LEVEL_WIDTH && cy >= 0 && cy < LEVEL_HEIGHT) {
          const tile = prev.map[cy]?.[cx];
          const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
          if (isWalkable) {
            const d = Math.abs(cx - e.x) + Math.abs(cy - e.y);
            if (d < bestDist) {
              bestDist = d;
              bestTile = { x: cx, y: cy };
            }
          }
        }
      }
      targetX = bestTile.x;
      targetY = bestTile.y;
    }

    if (distToPlayer > 1 || (nearestTarget && minTargetDist > followerRange)) {
      const nextStep = getNextStepTowards(e.x, e.y, targetX, targetY, prev.map, true, updatedEnemiesList);
      if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
        const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                     nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
        const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
        if (!isTileBlockedByEnemy && isTileWalkable) {
          e.x = nextStep.x;
          e.y = nextStep.y;
        }
      }
    }
  }

  return {
    e,
    nextDefeatedCounts
  };
}
