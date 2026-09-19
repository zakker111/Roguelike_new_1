import {
  Enemy,
  EnemyState,
  EnemyType,
  GameState,
  TileType,
  PlayerEffect,
  CatalystType,
  EquipmentItem,
  CaravanTravelState
} from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT, isLunarBlessingActive } from '../../utils/gameUtils';
import { getNextStepTowards, getNextStepAwayFrom, hasLineOfSight, isTileWalkableForEntity, isTileBlockedForEntity } from '../../utils/ai';
import { getEnemyFleeQuote } from '../../utils/fleeQuotes';
import { incrementDefeatedEnemyCount } from '../../utils/bestiary';
import { evaluateScarAcquisition, getEffectiveStats } from '../../utils/scars';
import { getItemDurabilityDecay } from '../../utils/spellsAndEquipment';
import { calculateArchetypeDamageAdjustment } from '../../utils/combatArchetypes';
import { isPlayerInvincible } from '../../utils/invincibility';
import { isHostileBetween } from '../../factions/FactionMatrix';
import { SpatialEntityGrid } from '../../utils/spatial';
import { DefeatedEnemyCounts } from './types';
import { checkDesperateSurrender, triggerSquadMoraleBreakOnLeaderDeath } from './factionMorale';

function safeDispatchEffect(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-game-effect', { detail });
    window.dispatchEvent(ev);
  }
}

function safeDispatchProjectile(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-projectile', { detail });
    window.dispatchEvent(ev);
  }
}

export interface HostileAIParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  playerHp: number;
  prev: GameState;
  nextGuardsHostile: boolean;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  updatedStats: any;
  nextArmor?: EquipmentItem;
  nextHelmet?: EquipmentItem;
  nextGloves?: EquipmentItem;
  nextBoots?: EquipmentItem;
  nextShield?: EquipmentItem;
  activeScars: any[];
  updatedEffects: PlayerEffect[];
  nextCaravanTravel?: CaravanTravelState;
  nextDefeatedCounts: DefeatedEnemyCounts;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
  staticLogs: string[];
  playSound: (soundName: string, options?: any) => void;
  applyDamageToEnemy: (target: Enemy, damage: number) => boolean;
}

export interface HostileActionResult {
  e: Enemy | null;
  playerHp: number;
  nextArmor?: EquipmentItem;
  nextHelmet?: EquipmentItem;
  nextGloves?: EquipmentItem;
  nextBoots?: EquipmentItem;
  nextShield?: EquipmentItem;
  activeScars: any[];
  updatedEffects: PlayerEffect[];
  nextCaravanTravel?: CaravanTravelState;
  nextDefeatedCounts: DefeatedEnemyCounts;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
}

export function processHostileTurn(params: HostileAIParams): HostileActionResult {
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
  let playerHp = params.playerHp;
  let nextArmor = params.nextArmor;
  let nextHelmet = params.nextHelmet;
  let nextGloves = params.nextGloves;
  let nextBoots = params.nextBoots;
  let nextShield = params.nextShield;
  const activeScars = [...params.activeScars];
  const updatedEffects = [...params.updatedEffects];
  let nextCaravanTravel = params.nextCaravanTravel;
  let nextDefeatedCounts = { ...params.nextDefeatedCounts };
  let incomingPlayerDamage = params.incomingPlayerDamage;
  let incomingPlayerHits = params.incomingPlayerHits;
  let hadPlayerCrit = params.hadPlayerCrit;
  let hadPlayerBrace = params.hadPlayerBrace;
  let lastAttackerX = params.lastAttackerX;
  let lastAttackerY = params.lastAttackerY;

  // Process enemy debuffs
  let isStunned = false;
  if (e.debuffs && e.debuffs.length > 0) {
    const nextDebuffs = [];
    for (const d of e.debuffs) {
      const dType = String(d.type || '');
      const turns = (d as any).turnsRemaining ?? (d as any).duration ?? 1;
      if (dType === 'stun' || dType === 'freeze' || dType === CatalystType.Frost || dType === CatalystType.Shadow) {
        isStunned = true;
      } else if (dType === 'burn' || dType === 'poison' || dType === CatalystType.Fire || dType === CatalystType.Poison || dType === CatalystType.Lightning) {
        const tickVal = d.damagePerTurn || 3;
        e.hp -= tickVal;
        if (prev.visible[e.y]?.[e.x]) {
          staticLogs.push(`🔥 ${e.name} takes -${tickVal} damage from status affliction!`);
          safeDispatchEffect({ x: e.x, y: e.y, text: `-${tickVal}`, type: 'dmg' });
        }
      }
      if (turns > 1) {
        nextDebuffs.push({ ...d, duration: turns - 1, turnsRemaining: turns - 1 });
      }
    }
    e.debuffs = nextDebuffs;
  }

  if (e.hp <= 0) {
    if (prev.visible[e.y]?.[e.x]) {
      staticLogs.push(`💀 ${e.name} succumbed to status ailments!`);
    }
    nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, e.name, e.type, !!e.isBoss);
    return {
      e: null,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel,
      nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    };
  }

  if (isStunned) {
    if (prev.visible[e.y]?.[e.x]) {
      staticLogs.push(`💫 ${e.name} is stunned/frozen and skips their turn!`);
    }
    return {
      e,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel,
      nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    };
  }

  // Stagger / Guard Recovery
  if (e.isStaggered) {
    e.staggerTurns = (e.staggerTurns || 1) - 1;
    if (e.staggerTurns <= 0) {
      e.isStaggered = false;
      e.staggerMeter = 0;
      if (prev.visible[e.y]?.[e.x]) {
        staticLogs.push(`🛡️ ${e.name} recovers their posture and stance!`);
      }
    } else {
      if (prev.visible[e.y]?.[e.x]) {
        staticLogs.push(`💫 ${e.name} is STAGGERED and helpless!`);
      }
      return {
        e,
        playerHp,
        nextArmor,
        nextHelmet,
        nextGloves,
        nextBoots,
        nextShield,
        activeScars,
        updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      };
    }
  }

  // Decrement support spell cooldown
  let isHostile = !e.isFollower && (!e.isTownGuard || nextGuardsHostile);

  if (e.supportSpellCooldown && e.supportSpellCooldown > 0) {
    e.supportSpellCooldown -= 1;
  }

  // Support Healer / Buffer AI Phase
  const isSupportUnit = e.aiRole === 'support_healer' ||
                        e.aiRole === 'support_buffer' ||
                        e.type === EnemyType.Necromancer ||
                        e.type === EnemyType.Tidecaller ||
                        /shaman|cleric|priest|druid|healer|apothecary|witch/i.test(e.name);

  if (isHostile && isSupportUnit && (!e.supportSpellCooldown || e.supportSpellCooldown <= 0)) {
    // 1. Scan for wounded allies to heal
    let mostWoundedAlly: Enemy | null = null;
    let lowestHpRatio = 0.75;

    for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
      if (targetIdx === i) continue;
      const ally = nextEnemies[targetIdx];
      if (ally.hp > 0 && !ally.isFollower && !ally.isTownGuard) {
        const allyDist = Math.abs(ally.x - e.x) + Math.abs(ally.y - e.y);
        if (allyDist <= 6) {
          const ratio = ally.hp / ally.maxHp;
          if (ratio < lowestHpRatio) {
            lowestHpRatio = ratio;
            mostWoundedAlly = ally;
          }
        }
      }
    }

    if (mostWoundedAlly) {
      const healAmt = Math.max(8, Math.round(e.atk * 1.5 + (e.isBoss ? 25 : 8)));
      mostWoundedAlly.hp = Math.min(mostWoundedAlly.maxHp, mostWoundedAlly.hp + healAmt);
      
      const ueIdx = updatedEnemiesList.findIndex(item => item.id === mostWoundedAlly!.id);
      if (ueIdx !== -1) {
        updatedEnemiesList[ueIdx].hp = mostWoundedAlly.hp;
      }
      
      e.supportSpellCooldown = 3;
      const isVisible = (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[mostWoundedAlly.y]?.[mostWoundedAlly.x] ?? false);
      if (isVisible) {
        staticLogs.push(`✨ [SUPPORT HEAL]: ${e.name} channels restorative healing into ${mostWoundedAlly.name} (+${healAmt} HP)!`);
        playSound('potion', { x: mostWoundedAlly.x, y: mostWoundedAlly.y, playerX: px, playerY: py });
        safeDispatchEffect({ x: mostWoundedAlly.x, y: mostWoundedAlly.y, sourceX: e.x, sourceY: e.y, text: `+${healAmt} HP`, type: 'heal' });
      }

      return {
        e,
        playerHp,
        nextArmor,
        nextHelmet,
        nextGloves,
        nextBoots,
        nextShield,
        activeScars,
        updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      };
    }

    // 2. Scan for heavy/elite allies to buff
    if (Math.random() < 0.45) {
      let buffTarget: Enemy | null = null;
      for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
        const ally = nextEnemies[targetIdx];
        if (ally.hp > 0 && !ally.isFollower && !ally.isTownGuard) {
          const allyDist = Math.abs(ally.x - e.x) + Math.abs(ally.y - e.y);
          if (allyDist <= 5 && (ally.isBoss || ally.isElite || ally.maxHp >= 30 || ally.id === e.id)) {
            buffTarget = ally;
            break;
          }
        }
      }

      if (buffTarget) {
        buffTarget.atk = Math.round(buffTarget.atk + 2);
        buffTarget.def = Math.round(buffTarget.def + 2);
        e.supportSpellCooldown = 4;
        const isVisible = (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[buffTarget.y]?.[buffTarget.x] ?? false);
        if (isVisible) {
          staticLogs.push(`🔮 [SUPPORT BUFF]: ${e.name} chants an incantation of Bloodlust on ${buffTarget.name} (+2 ATK, +2 DEF)!`);
          playSound('magic', { x: buffTarget.x, y: buffTarget.y, playerX: px, playerY: py });
          safeDispatchEffect({ x: buffTarget.x, y: buffTarget.y, sourceX: e.x, sourceY: e.y, text: `⚡ BUFFED!`, type: 'heal' });
        }

        return {
          e,
          playerHp,
          nextArmor,
          nextHelmet,
          nextGloves,
          nextBoots,
          nextShield,
          activeScars,
          updatedEffects,
          nextCaravanTravel,
          nextDefeatedCounts,
          incomingPlayerDamage,
          incomingPlayerHits,
          hadPlayerCrit,
          hadPlayerBrace,
          lastAttackerX,
          lastAttackerY
        };
      }
    }
  }

  // Telegraphed Attack Resolution
  if (e.telegraphedAttack) {
    const attack = e.telegraphedAttack;
    attack.turnsRemaining -= 1;
    if (attack.turnsRemaining <= 0) {
      const tx = attack.targetX;
      const ty = attack.targetY;
      const dmg = attack.damage;

      if (px === tx && py === ty) {
        if (isPlayerInvincible(prev, prev.playerStats)) {
          staticLogs.push(`🛡️ [GOD MODE]: You are invincible! ${e.name}'s ${attack.name} strikes your divine shield for 0 damage!`);
          playSound('shield');
          safeDispatchEffect({ x: tx, y: ty, text: `🛡️ IMMUNE`, type: 'heal' });
        } else if (prev.isBraced) {
          const reducedDmg = Math.max(1, Math.floor(dmg * 0.25));
          playerHp = Math.max(0, playerHp - reducedDmg);
          incomingPlayerDamage += reducedDmg;
          incomingPlayerHits += 1;
          hadPlayerBrace = true;
          const curStagger = e.staggerMeter || 0;
          const maxStag = e.maxStaggerMeter || (e.isBoss ? 120 : e.isElite ? 75 : 45);
          e.staggerMeter = Math.min(maxStag, curStagger + 35);
          if (e.staggerMeter >= maxStag && !e.isStaggered) {
            e.isStaggered = true;
            e.staggerTurns = 2;
          }
          staticLogs.push(`🛡️ [PERFECT BRACE]: You braced firmly against ${e.name}'s ${attack.name}! Absorbed 75% of damage (-${reducedDmg} HP) and counter-staggered the attacker!`);
          playSound('shield');
        } else {
          playerHp = Math.max(0, playerHp - dmg);
          incomingPlayerDamage += dmg;
          incomingPlayerHits += 1;
          staticLogs.push(`💥 [TELEGRAPHED IMPACT]: ${e.name}'s heavy ${attack.name} smashes you at (${tx}, ${ty}) for -${dmg} HP!`);
          playSound('injury');
        }
      } else {
        staticLogs.push(`💨 [TACTICAL DODGE]: ${e.name}'s ${attack.name} smashes empty ground at (${tx}, ${ty}) as you dodged out of danger!`);
        playSound('bump');
        safeDispatchEffect({ x: tx, y: ty, text: `💨 DODGED!`, type: 'heal' });
      }
      e.telegraphedAttack = null;
      return {
        e,
        playerHp,
        nextArmor,
        nextHelmet,
        nextGloves,
        nextBoots,
        nextShield,
        activeScars,
        updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      };
    }
  }

  // Morale Break and Desperate Surrender Evaluation
  if (e.isSurrendered) {
    e.surrenderTurns = (e.surrenderTurns || 1) - 1;
    if (e.surrenderTurns <= 0) {
      e.isSurrendered = false;
    }
    e.state = EnemyState.Retreating;
    isHostile = false; // Cease hostile aggression while surrendered
  } else if (e.isPanicked) {
    e.panicTurns = (e.panicTurns || 1) - 1;
    if (e.panicTurns <= 0) {
      e.isPanicked = false;
    }
    e.state = EnemyState.Retreating;
    isHostile = false; // In panic, flight overrides aggression
  } else if (isHostile) {
    // Check if wounded, isolated hostile decides to throw down their weapons
    const surrenderResult = checkDesperateSurrender(
      e,
      nextEnemies,
      (msg) => staticLogs.push(msg),
      (x, y, txt, col) => safeDispatchEffect({ x, y, text: txt, color: col, type: 'heal' }),
      playSound
    );
    if (surrenderResult.didSurrender) {
      e = surrenderResult.enemy;
      isHostile = false;
    }
  }

  const sameZ = (e.z ?? 0) === ((prev as any).overworldZ ?? 0);
  const distToPlayer = Math.abs(e.x - px) + Math.abs(e.y - py);
  const enemyRange = e.range || 1;
  const dxToPlayer = Math.abs(e.x - px);
  const dyToPlayer = Math.abs(e.y - py);
  const hasLOS = hasLineOfSight(e.x, e.y, px, py, prev.map);
  const isWithinAttackRange = sameZ && dxToPlayer <= enemyRange && dyToPlayer <= enemyRange && (dxToPlayer > 0 || dyToPlayer > 0) && (enemyRange === 1 || hasLOS);

  // Perception check
  const isInPerceptionRange = distToPlayer <= 10;
  if (sameZ && isInPerceptionRange && isHostile && (enemyRange === 1 || hasLOS)) {
    e.state = EnemyState.Chasing;
    if (!e.hasWarnedElite && (e.isBoss || e.maxHp >= 75 || e.name.toLowerCase().includes('commander') || e.name.toLowerCase().includes('elite')) && prev.followers && prev.followers.length > 0) {
      e.hasWarnedElite = true;
      const folName = prev.followers[0].name;
      staticLogs.push(`🛡️ ${folName}: "Master, heads up! An elite foe (${e.name}) is bearing down on us!"`);
    }
  }

  // Build unified registry of all living active entities with latest turn states
  const updatedMap = new Map<string, Enemy>();
  for (const ue of updatedEnemiesList) {
    updatedMap.set(ue.id, ue);
  }
  const allActiveEntities = nextEnemies
    .map(ne => updatedMap.get(ne.id) || ne)
    .filter(item => item && item.hp > 0 && item.id !== e.id);

  // Build unified spatial index of all living active entities with latest turn states
  const entitySpatialGrid = SpatialEntityGrid.fromEnemies(allActiveEntities);

  // Autonomous Inter-Faction Skirmish Perception: detect rival faction combatants within 8 tiles
  let detectedRivalFaction: Enemy | null = null;
  if (e.faction && isHostile && e.state !== EnemyState.Fleeing && e.state !== EnemyState.Surrendered && e.state !== EnemyState.Retreating) {
    const nearbyPotentialRivals = entitySpatialGrid.getNearby(e.x, e.y, 8);
    for (const other of nearbyPotentialRivals) {
      if (other.id !== e.id && other.hp > 0 && isHostileBetween(e.faction, other.faction)) {
        if (hasLineOfSight(e.x, e.y, other.x, other.y, prev.map)) {
          detectedRivalFaction = other;
          break;
        }
      }
    }
    if (detectedRivalFaction && e.state !== EnemyState.Chasing) {
      e.state = EnemyState.Chasing;
    }
  }

  // Wagon Attack Targeting
  if (isHostile && nextCaravanTravel?.active && (nextCaravanTravel.wagonHp ?? 100) > 0) {
    const wagonX = 12;
    const wagonY = 9;
    const wDistX = Math.abs(wagonX - e.x);
    const wDistY = Math.abs(wagonY - e.y);
    const atkRange = e.range || 1;
    const inWagonRange = atkRange === 1 ? (wDistX <= 1 && wDistY <= 1) : (wDistX <= atkRange && wDistY <= atkRange);

    if (inWagonRange && Math.random() < 0.60) {
      const rawWagonDmg = Math.max(5, Math.round(e.atk * 0.85));
      const currentWagonHp = nextCaravanTravel.wagonHp ?? 100;
      const updatedWagonHp = Math.max(0, currentWagonHp - rawWagonDmg);
      nextCaravanTravel = {
        ...nextCaravanTravel,
        wagonHp: updatedWagonHp
      };
      staticLogs.push(`💥 [WAGON DAMAGED]: ${e.name} strikes the Merchant Wagon for -${rawWagonDmg} Hull Damage! (${updatedWagonHp}/${nextCaravanTravel.maxWagonHp || 100} HP remaining)`);
      playSound('metal_hit');
      safeDispatchEffect({ x: wagonX, y: wagonY, text: `-${rawWagonDmg} Wagon`, type: 'dmg' });

      if (updatedWagonHp <= 0) {
        staticLogs.push(`💥 [CARGO DESTROYED]: The merchant wagon frame was shattered! Cargo has been lost!`);
      }
      return {
        e,
        playerHp,
        nextArmor,
        nextHelmet,
        nextGloves,
        nextBoots,
        nextShield,
        activeScars,
        updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      };
    }
  }

  // Target Defenders (Followers, Town Guards & Rival Faction Enemies)
  let targetDefender: Enemy | null = null;
  let isRivalFactionCombat = false;
  let bestDefenderPriority = Infinity;

  if (isHostile) {
    const atkRange = e.range || 1;
    // O(K) spatial query instead of O(N) full array scan
    const localCandidates = entitySpatialGrid.getNearby(e.x, e.y, atkRange);

    // 1. First check followers and town guards within reach
    for (const defender of localCandidates) {
      if ((defender.isFollower || (defender.isTownGuard && !nextGuardsHostile)) && defender.hp > 0) {
        const fDistX = Math.abs(defender.x - e.x);
        const fDistY = Math.abs(defender.y - e.y);
        const inAtkRange = atkRange === 1 ? (fDistX <= 1 && fDistY <= 1 && (fDistX > 0 || fDistY > 0)) : (fDistX <= atkRange && fDistY <= atkRange && (fDistX > 0 || fDistY > 0));
        if (inAtkRange) {
          if (atkRange === 1 || hasLineOfSight(e.x, e.y, defender.x, defender.y, prev.map)) {
            const dist = fDistX + fDistY;
            const priority = dist + (defender.hp / defender.maxHp);
            if (priority < bestDefenderPriority) {
              bestDefenderPriority = priority;
              targetDefender = defender;
              isRivalFactionCombat = false;
            }
          }
        }
      }
    }

    // 2. If no defender found, check for hostile rival faction enemies within attack range
    if (!targetDefender) {
      for (const rival of localCandidates) {
        if (rival.id !== e.id && rival.hp > 0 && isHostileBetween(e.faction, rival.faction)) {
          const rDistX = Math.abs(rival.x - e.x);
          const rDistY = Math.abs(rival.y - e.y);
          const inAtkRange = atkRange === 1 ? (rDistX <= 1 && rDistY <= 1 && (rDistX > 0 || rDistY > 0)) : (rDistX <= atkRange && rDistY <= atkRange && (rDistX > 0 || rDistY > 0));
          if (inAtkRange) {
            if (atkRange === 1 || hasLineOfSight(e.x, e.y, rival.x, rival.y, prev.map)) {
              targetDefender = rival;
              isRivalFactionCombat = true;
              break;
            }
          }
        }
      }
    }
  }

  // Dynamic target swapping between player, followers, town guards, and rivals
  let shouldAttackDefender = false;
  if (targetDefender) {
    if (!isWithinAttackRange) {
      // Player is not in reach, but defender is: attack defender immediately!
      shouldAttackDefender = true;
    } else {
      // Both player and defender/follower are within attack reach: swap targets dynamically!
      const distToDefender = Math.abs(targetDefender.x - e.x) + Math.abs(targetDefender.y - e.y);
      const isDefenderWounded = targetDefender.hp < targetDefender.maxHp * 0.5;

      if (distToDefender < distToPlayer) {
        shouldAttackDefender = Math.random() < 0.75;
      } else if (isDefenderWounded) {
        shouldAttackDefender = Math.random() < 0.65;
      } else {
        // Equal proximity: 50% chance to target follower vs player
        shouldAttackDefender = Math.random() < 0.50;
      }
    }
  }

  if (isHostile && targetDefender && shouldAttackDefender) {
    const fDmg = Math.max(1, e.atk - (targetDefender.def || 0));
    const isKilled = applyDamageToEnemy(targetDefender, fDmg);
    const isVisible = (prev.visible[targetDefender.y]?.[targetDefender.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);
    if (isVisible) {
      if (isRivalFactionCombat) {
        staticLogs.push(`⚔️ [FACTION SKIRMISH]: ${e.name} strikes rival ${targetDefender.name} for -${fDmg} HP! (${Math.max(0, targetDefender.hp)}/${targetDefender.maxHp} HP remaining)`);
      } else {
        const defLabel = targetDefender.isTownGuard ? 'Town Guard' : 'companion';
        staticLogs.push(`⚔️ [HOSTILE ATTACK]: ${e.name} strikes ${defLabel} ${targetDefender.name} for -${fDmg} HP! (${Math.max(0, targetDefender.hp)}/${targetDefender.maxHp} HP remaining)`);
      }
      playSound('injury');
      safeDispatchEffect({ x: targetDefender.x, y: targetDefender.y, sourceX: e.x, sourceY: e.y, text: `-${fDmg} HP`, type: 'dmg' });
    }
    if (isKilled) {
      if (isVisible) {
        if (isRivalFactionCombat) {
          staticLogs.push(`💀 [TURF CASUALTY]: ${targetDefender.name} was slain by ${e.name} in the faction clash!`);
        } else if (targetDefender.isTownGuard) {
          staticLogs.push(`☠️ [TOWN GUARD FALLEN]: ${targetDefender.name} was slain defending the town!`);
        } else {
          staticLogs.push(`💔 [COMPANION FALLEN]: ${targetDefender.name} has been slain in combat!`);
        }
      }

      // Check if the fallen entity was a faction leader
      const moraleResult = triggerSquadMoraleBreakOnLeaderDeath(
        targetDefender,
        nextEnemies,
        (msg) => staticLogs.push(msg),
        (x, y, txt, col) => safeDispatchEffect({ x, y, text: txt, color: col, type: 'heal' }),
        playSound
      );
      if (moraleResult.panickedCount > 0) {
        for (let m = 0; m < nextEnemies.length; m++) {
          const updated = moraleResult.updatedEnemies.find((ue) => ue.id === nextEnemies[m].id);
          if (updated) {
            nextEnemies[m] = updated;
          }
        }
      }
    }
    return {
      e,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel,
      nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    };
  }

  const isRangedKiterUnit = (e.range && e.range > 1) ||
                            e.aiRole === 'skirmisher_kiting' ||
                            e.type === EnemyType.SkeletonMage ||
                            e.type === EnemyType.Necromancer ||
                            e.type === EnemyType.Tidecaller ||
                            e.type === EnemyType.AbyssalSiren ||
                            e.type === EnemyType.Trapmaster ||
                            /archer|bowman|ranger|marksman|sorcerer|mage|wizard|warlock|shaman|tidecaller|spellflinger|trapsmith/i.test(e.name);

  // When a ranged kiter is in melee range (<= 2 tiles), prioritize retreating to optimal firing range unless trapped
  const isTooCloseInMeleeToKite = isRangedKiterUnit && distToPlayer <= 2;
  const shouldAttackNow = isHostile && isWithinAttackRange && !isTooCloseInMeleeToKite;

  // Hostile Attacks Player
  if (shouldAttackNow) {
    const isHeavy = e.isBoss || e.isElite || e.type === EnemyType.OrcBrute || e.type === EnemyType.Dragon || e.type === EnemyType.DreadKnight || e.type === EnemyType.Louhi || e.type === EnemyType.IkuTurso;
    const telegraphChance = isHeavy ? 0.35 : 0.18;

    if (!e.telegraphedAttack && Math.random() < telegraphChance) {
      const atkName = e.isBoss ? 'Sunder Titan Slam' : isHeavy ? 'Brutal Heavy Cleave' : 'Heavy Ground Strike';
      e.telegraphedAttack = {
        targetX: px,
        targetY: py,
        turnsRemaining: 1,
        damage: Math.round(e.atk * 1.6),
        name: atkName
      };
      staticLogs.push(`⚠️ [TELEGRAPH WARNING]: ${e.name} winds up ${atkName} targeting (${px}, ${py})! Move away or BRACE (B) to block!`);
      playSound('alert');
      safeDispatchEffect({ x: e.x, y: e.y, text: `⚠️ TELEGRAPHING!`, type: 'dmg' });
      return {
        e,
        playerHp,
        nextArmor,
        nextHelmet,
        nextGloves,
        nextBoots,
        nextShield,
        activeScars,
        updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      };
    }

    let lunarDodgeBonus = 0;
    if (isLunarBlessingActive(prev, 'new_moon')) lunarDodgeBonus = 0.15;
    else if (isLunarBlessingActive(prev, 'waxing_crescent')) lunarDodgeBonus = 0.10;

    const effectiveDex = getEffectiveStats(prev.playerStats).dex || 10;
    const dodgeChance = Math.min(0.5, Math.max(0, (effectiveDex - 10) * 0.02 + lunarDodgeBonus));

    if (Math.random() < dodgeChance) {
      staticLogs.push(`💨 You dodged ${e.name}'s attack!`);
      playSound('bump');
    } else {
      let baseAtk = e.atk;
      if (e.affixes?.includes('berserker') && e.hp < e.maxHp * 0.5) {
        baseAtk = Math.round(baseAtk * 1.5);
        staticLogs.push(`🩸 [BERSERKER RAGE]: ${e.name} strikes with frenzied rage (+50% DMG)!`);
      }

      const effectiveDef = getEffectiveStats(prev.playerStats).def || 0;
      const totalArmorDef = (nextArmor?.defense || 0) + 
                       (nextHelmet?.defense || 0) + 
                       (nextGloves?.defense || 0) + 
                       (nextBoots?.defense || 0) + 
                       (nextShield?.defense || 0) + 
                       effectiveDef;
      
      let penPercent = (e.armorPenetrationPercent || 0) + (e.affixes?.includes('shieldbreaker') ? 0.50 : 0);
      penPercent = Math.min(0.85, penPercent);
      
      const braceMult = prev.isBraced ? 2.0 : 1.0;
      const netArmorDef = Math.floor(totalArmorDef * (1.0 - penPercent));
      const absorbedDef = Math.floor(netArmorDef * braceMult);
      const rawStrike = Math.max(1, baseAtk - absorbedDef);

      if (isPlayerInvincible(prev, prev.playerStats)) {
        staticLogs.push(`🛡️ [GOD MODE]: ${e.name}'s attack strikes your divine shield for 0 damage!`);
        playSound('shield');
        safeDispatchEffect({ x: px, y: py, text: `🛡️ IMMUNE`, type: 'heal' });
        return {
          e,
          playerHp,
          nextArmor,
          nextHelmet,
          nextGloves,
          nextBoots,
          nextShield,
          activeScars,
          updatedEffects,
          nextCaravanTravel,
          nextDefeatedCounts,
          incomingPlayerDamage: 0,
          incomingPlayerHits: 0,
          hadPlayerCrit: false,
          hadPlayerBrace: false,
          lastAttackerX: e.x,
          lastAttackerY: e.y
        };
      }

      if (penPercent > 0) {
        staticLogs.push(`⚡ [ARMOR PENETRATION]: ${e.name}'s strike bypassed ${Math.round(penPercent * 100)}% of your armor!`);
      }

      const isCritHit = Math.random() < 0.15;
      const archetypeAdj = calculateArchetypeDamageAdjustment(
        { archetype: e.archetype, isCrit: isCritHit },
        null,
        rawStrike
      );
      let sniperBonus = 0;
      const distToP = Math.hypot(px - e.x, py - e.y);
      if (e.isHighGroundSniper && distToP > 1.5) {
        sniperBonus = 2;
        staticLogs.push(`🏹 [HIGH-GROUND SNIPER]: ${e.name} fires a precision bolt from the elevated barricade perch! (+2 Pierce DMG)`);
      }

      const strikeDmg = archetypeAdj.damage + sniperBonus;
      if (archetypeAdj.logNote) {
        staticLogs.push(archetypeAdj.logNote);
      }

      playerHp = Math.max(0, playerHp - strikeDmg);
      incomingPlayerDamage += strikeDmg;
      incomingPlayerHits += 1;
      lastAttackerX = e.x;
      lastAttackerY = e.y;
      if (isCritHit) hadPlayerCrit = true;
      if (prev.isBraced) hadPlayerBrace = true;

      staticLogs.push(`⚔️ ${e.name} attacks you for -${strikeDmg} HP!`);
      playSound('injury');

      if (distToP > 1.5) {
        let enemyProjType = 'arrow';
        let enemyProjColor = '#d97706';
        if (e.type === EnemyType.SkeletonMage || /mage|wizard|sorcerer|spell/i.test(e.name)) {
          enemyProjType = 'skeleton_bolt';
          enemyProjColor = '#38bdf8';
        } else if (e.type === EnemyType.Necromancer || /void|warlock|cultist|shadow/i.test(e.name)) {
          enemyProjType = 'void_siphon';
          enemyProjColor = '#a855f7';
        } else if (/fire|dragon|imp|demon/i.test(e.name)) {
          enemyProjType = 'fireball';
          enemyProjColor = '#f97316';
        }

        safeDispatchProjectile({
          startX: e.x,
          startY: e.y,
          targetX: px,
          targetY: py,
          color: enemyProjColor,
          projectileType: enemyProjType,
          impactText: isCritHit ? `CRIT! -${strikeDmg} HP` : `-${strikeDmg} HP`,
          impactType: isCritHit ? 'crit' : 'dmg',
        });
      }

      if (e.affixes?.includes('vampiric') && strikeDmg > 0) {
        const leech = Math.max(1, Math.floor(strikeDmg * 0.40));
        e.hp = Math.min(e.maxHp, e.hp + leech);
        staticLogs.push(`🧛 [VAMPIRIC DRAIN]: ${e.name} drained +${leech} HP from you!`);
      }

      if (e.affixes?.includes('venomous') && Math.random() < 0.75) {
        updatedEffects.push({
          id: 'venom_dot_' + Date.now() + Math.random(),
          name: 'Toxic Venom',
          type: 'debuff',
          icon: '☠️',
          description: 'Infected with toxic venom (-3 HP/turn)',
          turnsRemaining: 3,
          color: '#10b981',
          damagePerTurn: 3
        });
        staticLogs.push(`☠️ [VENOMOUS STRIKE]: ${e.name} infected you with toxic venom! (-3 HP/turn)`);
      }

      if (nextArmor && Math.random() < 0.25) {
        const decayAmt = getItemDurabilityDecay(nextArmor, 1);
        const curDur = nextArmor.durability ?? nextArmor.maxDurability ?? 100;
        const newDur = Math.max(0, curDur - decayAmt);
        nextArmor = { ...nextArmor, durability: newDur };
        if (newDur === 0) {
          staticLogs.push(`🛡️ [EQUIPMENT BROKEN]: Your ${nextArmor.name} has broken!`);
        }
      }
      if (nextShield && Math.random() < 0.25) {
        const decayAmt = getItemDurabilityDecay(nextShield, 1);
        const curDur = nextShield.durability ?? nextShield.maxDurability ?? 100;
        const newDur = Math.max(0, curDur - decayAmt);
        nextShield = { ...nextShield, durability: newDur };
        if (newDur === 0) {
          staticLogs.push(`🛡️ [EQUIPMENT BROKEN]: Your ${nextShield.name} has broken!`);
        }
      }

      const scarResult = evaluateScarAcquisition(strikeDmg, playerHp, updatedStats.maxHp, activeScars, updatedStats.turnsPlayed);
      if (scarResult) {
        activeScars.push(scarResult.scar);
        staticLogs.push(scarResult.logText);
      }
    }

    return {
      e,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel,
      nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    };
  }

  // Wounded Retreat State
  if (e.state === EnemyState.Chasing && !e.isBoss && (e.hp < e.maxHp * 0.25 || e.type === EnemyType.LootGoblin)) {
    e.state = EnemyState.Retreating;
    if (Math.random() < 0.35) {
      staticLogs.push(getEnemyFleeQuote(e.name, e.type));
    }
  }

  // Hostile Movement & Flanking Logic
  if (e.state === EnemyState.Chasing && isHostile) {
    let chaseTargetX = px;
    let chaseTargetY = py;
    let minDefenderDist = Math.abs(px - e.x) + Math.abs(py - e.y);

    if (nextCaravanTravel?.active && (nextCaravanTravel.wagonHp ?? 100) > 0) {
      const wagonX = 12;
      const wagonY = 9;
      const wagonDist = Math.abs(wagonX - e.x) + Math.abs(wagonY - e.y);
      if (wagonDist < minDefenderDist) {
        minDefenderDist = wagonDist;
        chaseTargetX = wagonX;
        chaseTargetY = wagonY;
      }
    }

    for (const defender of allActiveEntities) {
      if (defender.hp > 0 && (defender.isFollower || (defender.isTownGuard && !nextGuardsHostile))) {
        const defDist = Math.abs(defender.x - e.x) + Math.abs(defender.y - e.y);
        const isDefenderWoundedOrFleeing = defender.state === EnemyState.Retreating || (defender.hp < defender.maxHp * 0.4);
        
        // Predatory pursuit: enemies chase retreating/wounded defenders or closer targets
        if (isDefenderWoundedOrFleeing ? (defDist <= minDefenderDist + 2) : (defDist <= minDefenderDist)) {
          minDefenderDist = defDist;
          chaseTargetX = defender.x;
          chaseTargetY = defender.y;
        }
      } else if (defender.hp > 0 && defender.id !== e.id && isHostileBetween(e.faction, defender.faction)) {
        // Pursuit of rival faction enemies in turf wars
        const rivalDist = Math.abs(defender.x - e.x) + Math.abs(defender.y - e.y);
        if (rivalDist <= 7 && hasLineOfSight(e.x, e.y, defender.x, defender.y, prev.map)) {
          if (rivalDist < minDefenderDist) {
            minDefenderDist = rivalDist;
            chaseTargetX = defender.x;
            chaseTargetY = defender.y;
          }
        }
      }
    }

    const isRangedKiter = (e.range && e.range > 1) ||
                          e.aiRole === 'skirmisher_kiting' ||
                          e.type === EnemyType.SkeletonMage ||
                          e.type === EnemyType.Necromancer ||
                          e.type === EnemyType.Tidecaller ||
                          e.type === EnemyType.AbyssalSiren ||
                          e.type === EnemyType.Trapmaster ||
                          /archer|bowman|ranger|marksman|sorcerer|mage|wizard|warlock|shaman|tidecaller|spellflinger|trapsmith/i.test(e.name);

    if (isRangedKiter) {
      const preferredRange = Math.min(4, Math.max(3, e.range || 3));
      const curDistToTarget = Math.abs(chaseTargetX - e.x) + Math.abs(chaseTargetY - e.y);
      const targetHasLOS = hasLineOfSight(e.x, e.y, chaseTargetX, chaseTargetY, prev.map);

      // If target is too close in melee (<= 2 tiles), kite backwards/away to maintain firing distance
      if (curDistToTarget <= 2) {
        const retreatDirs = [
          { x: e.x + (e.x > chaseTargetX ? 1 : e.x < chaseTargetX ? -1 : 0), y: e.y + (e.y > chaseTargetY ? 1 : e.y < chaseTargetY ? -1 : 0) },
          { x: e.x + (e.x > chaseTargetX ? 1 : -1), y: e.y },
          { x: e.x, y: e.y + (e.y > chaseTargetY ? 1 : -1) },
          { x: e.x + 1, y: e.y },
          { x: e.x - 1, y: e.y },
          { x: e.x, y: e.y + 1 },
          { x: e.x, y: e.y - 1 }
        ];

        let bestKiteStep: { x: number; y: number } | null = null;
        let maxKiteDist = curDistToTarget;

        for (const step of retreatDirs) {
          if (step.x >= 0 && step.x < LEVEL_WIDTH && step.y >= 0 && step.y < LEVEL_HEIGHT) {
            const tile = prev.map[step.y]?.[step.x];
            const isWalkable = isTileWalkableForEntity(tile, {
              isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
              canOpenDoors: false
            });
            const isBlocked = (step.x === px && step.y === py) ||
                              updatedEnemiesList.some(other => other.x === step.x && other.y === step.y) ||
                              nextEnemies.some((other, idx) => idx > i && other.x === step.x && other.y === step.y);
            if (isWalkable && !isBlocked) {
              const newDist = Math.abs(chaseTargetX - step.x) + Math.abs(chaseTargetY - step.y);
              if (newDist > maxKiteDist) {
                maxKiteDist = newDist;
                bestKiteStep = step;
              }
            }
          }
        }

        if (bestKiteStep) {
          e.x = bestKiteStep.x;
          e.y = bestKiteStep.y;
          if (Math.random() < 0.20 && prev.visible[e.y]?.[e.x]) {
            staticLogs.push(`🏹 [TACTICAL KITE]: ${e.name} steps backward to maintain firing distance!`);
          }
        }
      } else if (curDistToTarget >= 3 && curDistToTarget <= preferredRange && targetHasLOS) {
        // Ideal sweet spot firing position with clear line-of-sight: hold ground to shoot rather than walking into melee
      } else {
        // Outside firing range or LOS broken by obstacles: advance towards firing range
        const nextStep = getNextStepTowards(e.x, e.y, chaseTargetX, chaseTargetY, prev.map, false, updatedEnemiesList, false);
        if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
          const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                       nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
          const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
            isWaterWalkable: false,
            canOpenDoors: false
          });
          if (!isTileBlockedByEnemy && isTileWalkable) {
            e.x = nextStep.x;
            e.y = nextStep.y;
          }
        }
      }
    } else {
      const packTypes: (EnemyType | string)[] = [EnemyType.Goblin, EnemyType.Bandit, EnemyType.LootGoblin, EnemyType.OrcBrute, EnemyType.Hiisi];
      const isPackUnit = packTypes.includes(e.type) ||
                         /goblin|wolf|bandit|outlaw|raider|pack|beast|rogue|hiisi|orc/i.test(e.name);

      if (isPackUnit) {
        const flankAngles = [
          { x: chaseTargetX, y: chaseTargetY - 1 },
          { x: chaseTargetX + 1, y: chaseTargetY },
          { x: chaseTargetX, y: chaseTargetY + 1 },
          { x: chaseTargetX - 1, y: chaseTargetY },
        ];

        let chosenFlank: { x: number; y: number } | null = null;
        for (const pos of flankAngles) {
          if (pos.x >= 0 && pos.x < LEVEL_WIDTH && pos.y >= 0 && pos.y < LEVEL_HEIGHT) {
            const tile = prev.map[pos.y]?.[pos.x];
            const isWalkable = isTileWalkableForEntity(tile, {
              isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
              canOpenDoors: false
            });
            if (isWalkable) {
              const isOccupied = updatedEnemiesList.some(other => other.x === pos.x && other.y === pos.y) ||
                                 nextEnemies.some((other, idx) => idx > i && other.x === pos.x && other.y === pos.y);
              if (!isOccupied) {
                chosenFlank = pos;
                break;
              }
            }
          }
        }

        if (chosenFlank) {
          chaseTargetX = chosenFlank.x;
          chaseTargetY = chosenFlank.y;
        }
      }

      const nextStep = getNextStepTowards(e.x, e.y, chaseTargetX, chaseTargetY, prev.map, false, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
      if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
        const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                     nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
        const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
          isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
          canOpenDoors: false
        });
        if (!isTileBlockedByEnemy && isTileWalkable) {
          e.x = nextStep.x;
          e.y = nextStep.y;
        }
      }
    }
  } else if (e.state === EnemyState.Retreating) {
    let nearestDormant: Enemy | null = null;
    let minDormantDist = 999;

    if (!e.hasAlertedBackup && !e.isPanicked && !e.isSurrendered) {
      for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
        if (targetIdx === i) continue;
        const target = nextEnemies[targetIdx];
        if (target.hp > 0 && !target.isFollower && !target.isTownGuard) {
          const isDormant = target.state === EnemyState.Sleeping || target.state === EnemyState.Patrolling || target.state !== EnemyState.Chasing;
          if (isDormant) {
            const d = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
            if (d < minDormantDist) {
              minDormantDist = d;
              nearestDormant = target;
            }
          }
        }
      }
    }

    let retreatTargetX = e.x;
    let retreatTargetY = e.y;

    if (nearestDormant && minDormantDist <= 18) {
      retreatTargetX = nearestDormant.x;
      retreatTargetY = nearestDormant.y;

      if (minDormantDist <= 2) {
        e.hasAlertedBackup = true;
        nearestDormant.state = EnemyState.Chasing;
        if (nearestDormant.originalChar) nearestDormant.char = nearestDormant.originalChar;

        for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
          const nearby = nextEnemies[targetIdx];
          if (nearby.hp > 0 && !nearby.isFollower && !nearby.isTownGuard) {
            const distToGroup = Math.abs(nearby.x - nearestDormant.x) + Math.abs(nearby.y - nearestDormant.y);
            if (distToGroup <= 6) {
              nearby.state = EnemyState.Chasing;
              if (nearby.originalChar) nearby.char = nearby.originalChar;
            }
          }
        }

        const isActionVisible = (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[nearestDormant.y]?.[nearestDormant.x] ?? false);
        if (isActionVisible) {
          staticLogs.push(`📢 [REINFORCEMENTS]: Wounded ${e.name} yells for backup, alerting nearby ${nearestDormant.name} to attack!`);
          playSound('bump', { x: e.x, y: e.y, playerX: px, playerY: py });
        }
      }
    } else if (e.homeCampX !== undefined && e.homeCampY !== undefined) {
      retreatTargetX = e.homeCampX;
      retreatTargetY = e.homeCampY;
    } else {
      const dirX = Math.sign(e.x - px) || (Math.random() < 0.5 ? 1 : -1);
      const dirY = Math.sign(e.y - py) || (Math.random() < 0.5 ? 1 : -1);
      retreatTargetX = Math.max(0, Math.min(LEVEL_WIDTH - 1, e.x + dirX * 5));
      retreatTargetY = Math.max(0, Math.min(LEVEL_HEIGHT - 1, e.y + dirY * 5));
    }

    let nextStep: { x: number; y: number } | null = null;
    const isTargetWalkable = isTileWalkableForEntity(prev.map[retreatTargetY]?.[retreatTargetX], {
      isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
      canOpenDoors: false
    });
    if (isTargetWalkable) {
      nextStep = getNextStepTowards(e.x, e.y, retreatTargetX, retreatTargetY, prev.map, false, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
    }
    if (!nextStep) {
      nextStep = getNextStepAwayFrom(e.x, e.y, px, py, prev.map, false, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
    }
    if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
      const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep!.x && other.y === nextStep!.y) ||
                                   nextEnemies.some((other, idx) => idx > i && other.x === nextStep!.x && other.y === nextStep!.y);
      const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
        isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
        canOpenDoors: false
      });
      if (!isTileBlockedByEnemy && isTileWalkable) {
        e.x = nextStep.x;
        e.y = nextStep.y;
      }
    }
    if (Math.random() < 0.10) {
      staticLogs.push(getEnemyFleeQuote(e.name, e.type));
    }
  } else if (e.state === EnemyState.Patrolling && e.patrolPath && e.patrolPath.length > 0) {
    let currentPatrolIdx = e.patrolIndex || 0;
    let targetTile = e.patrolPath[currentPatrolIdx];
    
    // If waypoint is reached or waypoint tile itself is impassable, cycle to next waypoint
    const isTargetBlocked = targetTile && isTileBlockedForEntity(prev.map[targetTile.y]?.[targetTile.x], {
      isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
      canOpenDoors: false
    });

    if (targetTile && ((e.x === targetTile.x && e.y === targetTile.y) || isTargetBlocked)) {
      currentPatrolIdx = (currentPatrolIdx + 1) % e.patrolPath.length;
      e.patrolIndex = currentPatrolIdx;
      targetTile = e.patrolPath[currentPatrolIdx];
    }

    if (targetTile) {
      const nextStep = getNextStepTowards(e.x, e.y, targetTile.x, targetTile.y, prev.map, false, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
      if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
        const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                     nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
        const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
          isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
          canOpenDoors: false
        });
        if (!isTileBlockedByEnemy && isTileWalkable) {
          e.x = nextStep.x;
          e.y = nextStep.y;
        }
      }
    }
  }

  return {
    e,
    playerHp,
    nextArmor,
    nextHelmet,
    nextGloves,
    nextBoots,
    nextShield,
    activeScars,
    updatedEffects,
    nextCaravanTravel,
    nextDefeatedCounts,
    incomingPlayerDamage,
    incomingPlayerHits,
    hadPlayerCrit,
    hadPlayerBrace,
    lastAttackerX,
    lastAttackerY
  };
}
