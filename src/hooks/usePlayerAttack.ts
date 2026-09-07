/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import {
  Enemy,
  CraftedWeapon,
  CatalystType,
  TileType
} from '../types';
import { STARTING_WEAPON } from '../utils/spellsAndEquipment';
import { isPlayerInvincible } from '../utils/invincibility';
import { getEffectiveStats } from '../utils/scars';
import { COMBAT_FLAVOR_TEXTS, FALLBACK_FLAVORS } from '../data/combatFlavors';
import { checkBossPhaseEnrage } from '../utils/combatArchetypes';
import { formatGameTime } from '../utils/overworld';
import { getRandomRelicDraft } from '../utils/relics';
import { getUpdatedTerritoriesOnKill } from '../utils/caravanAndTerritory';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../utils/gameUtils';
import {
  UsePlayerAttackParams,
  calculatePlayerCombatHit,
  generateCombatLoot,
  incrementDefeatedEnemyCount,
  updateWeaponDurability,
  updateShieldDurability
} from './combat';

export type { UsePlayerAttackParams };

export function usePlayerAttack({
  gameState,
  setGameState,
  addLogMessage,
  playSound,
  selectedSpellId,
  interactWithFollower,
  setUnlawfulGuardTarget,
  setActiveRelicDraft,
  gameConfig
}: UsePlayerAttackParams) {
  const getCombatFlavorText = useCallback(
    (weapon: CraftedWeapon, enemyName: string, isCrit: boolean): string => {
      const base = weapon.baseType;
      const pool = COMBAT_FLAVOR_TEXTS[base] || FALLBACK_FLAVORS;
      const array = isCrit ? pool.crit : pool.normal;
      const index = Math.floor(Math.random() * array.length);
      return array[index].replace(/{name}/g, enemyName);
    },
    []
  );

  const performPlayerAttack = useCallback(
    (enemy: Enemy, index: number, pathPoints: { x: number; y: number }[]): boolean => {
      if (enemy.isFollower || (enemy.isCaptive && enemy.isFreed)) {
        interactWithFollower(enemy);
        return false;
      }

      const weapon = gameState.currentWeapon || STARTING_WEAPON;
      const stats = getEffectiveStats(gameState.playerStats);

      const hitCalc = calculatePlayerCombatHit(
        gameState,
        enemy,
        selectedSpellId,
        addLogMessage,
        playSound
      );
      if (!hitCalc) {
        return false;
      }

      const {
        isMagic,
        activeSpell,
        spentMp,
        finalDmg,
        rollCrit,
        comboTriggered,
        comboLog,
        comboEffectText,
        archetypeAdjLog,
        isPhased,
        thornsDmg
      } = hitCalc;
      let nextDebuffs = hitCalc.nextDebuffs;

      if (isMagic) {
        playSound('spell');
      } else {
        playSound('slash');
      }

      if (archetypeAdjLog) {
        addLogMessage(archetypeAdjLog, 'info');
      }

      if (isPhased) {
        addLogMessage(
          `👻 [ETHEREAL PHASING]: ${enemy.name} shifted out of phase, evading your physical attack!`,
          'info'
        );
        playSound('bump');
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: enemy.x, y: enemy.y, text: `👻 PHASE DODGE!`, type: 'heal' }
        });
        window.dispatchEvent(ev);
        return true;
      }

      if (thornsDmg > 0) {
        if (isPlayerInvincible(gameState, gameState.playerStats)) {
          addLogMessage(
            `🛡️ [GOD MODE]: ${enemy.name}'s spiked thorns shatter against your invulnerable shield! (0 damage)`,
            'info'
          );
        } else {
          setGameState((prev) => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              hp: Math.max(0, prev.playerStats.hp - thornsDmg)
            }
          }));
          addLogMessage(
            `🛡️ [THORNS REFLECTION]: ${enemy.name}'s spiked hide reflects -${thornsDmg} HP back to you!`,
            'danger'
          );
          const ev = new CustomEvent('spawn-game-effect', {
            detail: {
              x: gameState.playerX,
              y: gameState.playerY,
              text: `-${thornsDmg} Thorns`,
              type: 'dmg'
            }
          });
          window.dispatchEvent(ev);
        }
      }

      if (rollCrit && weapon.materialUsed?.extraProperty === 'DRAGON_FORCE') {
        addLogMessage(`🔥 Crimson DragonScale sparks circular fire ring! Nearby targets crackle!`, 'craft');
      }

      if (comboTriggered) {
        addLogMessage(comboLog, 'craft');
        setTimeout(() => {
          const comboEvent = new CustomEvent('spawn-game-effect', {
            detail: {
              x: enemy.x,
              y: enemy.y,
              text: comboEffectText,
              type: 'heal'
            }
          });
          window.dispatchEvent(comboEvent);
        }, 100);
      }

      if (!comboTriggered) {
        if (isMagic && activeSpell.id === 'frostbite_lance') {
          const alreadyAfflicted = nextDebuffs.some((d) => d.type === CatalystType.Frost);
          if (!alreadyAfflicted) {
            nextDebuffs.push({
              type: CatalystType.Frost,
              turnsLeft: 3,
              damagePerTurn: 3
            });
            addLogMessage(`❄️ [FROSTBITE]: ${enemy.name} was encased in frost! (Slowed & Frost Debuff)`, 'info');
          }
        } else if (isMagic && activeSpell.id === 'pyroblast') {
          const alreadyAfflicted = nextDebuffs.some((d) => d.type === CatalystType.Fire);
          if (!alreadyAfflicted) {
            nextDebuffs.push({
              type: CatalystType.Fire,
              turnsLeft: 3,
              damagePerTurn: 4
            });
            addLogMessage(`🔥 [IGNITION]: ${enemy.name} caught fire! (Burning Debuff -4 HP/turn)`, 'danger');
          }
        } else if (weapon.catalystUsed) {
          const cat = weapon.catalystUsed;
          const alreadyAfflicted = nextDebuffs.some((d) => d.type === cat.type);
          if (!alreadyAfflicted) {
            nextDebuffs.push({
              type: cat.type,
              turnsLeft: 3,
              damagePerTurn: cat.type === CatalystType.Fire ? 4 : cat.type === CatalystType.Poison ? 3 : 2
            });
            addLogMessage(`✨ [CATALYST INFUSION]: Your weapon inflicted ${cat.type} on ${enemy.name}!`, 'info');
          }
        }
      }

      const flavor = getCombatFlavorText(weapon, enemy.name, rollCrit);
      addLogMessage(`${flavor} (Dealt ${finalDmg} damage${rollCrit ? ' CRITICAL!' : ''})`, 'combat');

      const hitEvent = new CustomEvent('spawn-game-effect', {
        detail: {
          x: enemy.x,
          y: enemy.y,
          text: `-${finalDmg}${rollCrit ? ' CRIT!' : ''}`,
          type: rollCrit ? 'crit' : 'dmg'
        }
      });
      window.dispatchEvent(hitEvent);

      const isGuard = enemy.isTownGuard;
      const guardWasAttacked = isGuard && !gameState.areGuardsHostile;

      setGameState((prev) => {
        const nextEnemies = [...prev.enemies];
        let nextLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];
        let nextCorpses = prev.corpses ? [...prev.corpses] : [];
        let nextSplatters = prev.bloodSplatters ? [...prev.bloodSplatters] : [];
        let nextDefeatedCounts = prev.defeatedEnemiesCount;
        const updatedLogs = [...prev.logs];

        const targetEnemyIndex = nextEnemies.findIndex((e) => e.id === enemy.id);
        if (targetEnemyIndex === -1) return prev;

        let updatedEnemy = {
          ...nextEnemies[targetEnemyIndex],
          hp: Math.max(0, nextEnemies[targetEnemyIndex].hp - finalDmg),
          debuffs: nextDebuffs
        };

        if (updatedEnemy.isBoss && updatedEnemy.hp > 0) {
          const enrageResult = checkBossPhaseEnrage(updatedEnemy);
          if (enrageResult.isEnragedNow && enrageResult.logMessage) {
            addLogMessage(enrageResult.logMessage, 'danger');
            playSound('roar');
            updatedEnemy = enrageResult.updatedEnemy;
          }
        }

        let gainedXp = 0;
        let extraXpGained = 0;

        // Chain Lightning secondary arcs
        if (isMagic && activeSpell.id === 'chain_lightning') {
          const chainRadius = 3;
          const chainTargets = nextEnemies.filter(
            (e) =>
              e.id !== updatedEnemy.id &&
              !e.isFollower &&
              e.hp > 0 &&
              Math.abs(e.x - updatedEnemy.x) <= chainRadius &&
              Math.abs(e.y - updatedEnemy.y) <= chainRadius
          );

          chainTargets.slice(0, 2).forEach((chainEnemy) => {
            const chainDmg = Math.max(1, Math.floor(finalDmg * 0.65));
            chainEnemy.hp = Math.max(0, chainEnemy.hp - chainDmg);

            addLogMessage(`⚡ [CHAIN LIGHTNING]: Arc jolts to ${chainEnemy.name} for ${chainDmg} shock damage!`, 'combat');

            const arcEv = new CustomEvent('spawn-game-effect', {
              detail: {
                x: chainEnemy.x,
                y: chainEnemy.y,
                text: `⚡ -${chainDmg}`,
                type: 'dmg'
              }
            });
            window.dispatchEvent(arcEv);

            if (chainEnemy.hp <= 0) {
              const chainIdx = nextEnemies.findIndex((e) => e.id === chainEnemy.id);
              if (chainIdx !== -1) {
                nextEnemies.splice(chainIdx, 1);
                const chainGold = Math.floor(Math.random() * 6) + 2;
                nextLootPiles.push({
                  id: `loot_${Date.now()}_${Math.random()}`,
                  x: chainEnemy.x,
                  y: chainEnemy.y,
                  gold: chainGold,
                  materials: [],
                  catalysts: [],
                  equipment: []
                });
                updatedLogs.push({
                  id: `chain_kill_${Date.now()}_${Math.random()}`,
                  text: `💀 ${chainEnemy.name} was electrocuted by the chain! (+15 XP)`,
                  type: 'loot',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
                extraXpGained += 15;
              }
            }
          });
        }

        if (updatedEnemy.hp <= 0) {
          const lootData = generateCombatLoot(prev, updatedEnemy, gameConfig);
          gainedXp = lootData.gainedXp;
          if (lootData.newCorpse) {
            nextCorpses.push(lootData.newCorpse);
          }
          nextSplatters.push(...lootData.splatters);
          nextLootPiles.push(lootData.newLootPile);
          updatedLogs.push(...lootData.extraLogs);
          addLogMessage(lootData.killLog, 'loot');

          const currentPrimaryIndexForSplice = nextEnemies.findIndex((e) => e.id === enemy.id);
          if (currentPrimaryIndexForSplice !== -1) {
            nextEnemies.splice(currentPrimaryIndexForSplice, 1);
          }
        } else {
          const currentPrimaryIndexForUpdate = nextEnemies.findIndex((e) => e.id === enemy.id);
          if (currentPrimaryIndexForUpdate !== -1) {
            nextEnemies[currentPrimaryIndexForUpdate] = updatedEnemy;
          }

          nextSplatters.push({
            id: `splatter_dmg_${Date.now()}_${Math.random()}`,
            x: updatedEnemy.x,
            y: updatedEnemy.y,
            intensity: Math.random() > 0.5 ? 2 : 1,
            color: updatedEnemy.char === 'r' ? '#22c55e' : '#dc2626'
          });
        }

        gainedXp += extraXpGained;
        let updatedXp = prev.playerStats.xp + gainedXp;
        let level = prev.playerStats.level;
        let nextThreshold = prev.playerStats.nextLevelXp || 100;
        let hp = stats.hp;
        let maxHp = stats.maxHp;
        let mp = stats.mp - spentMp;
        let maxMp = stats.maxMp;
        let atk = stats.atk;
        let def = stats.def;
        let unspentPoints = stats.unspentPoints || 0;

        const bonuses = gameConfig.levelUpBonuses;
        while (updatedXp >= nextThreshold) {
          level += 1;
          updatedXp -= nextThreshold;
          nextThreshold = Math.floor(nextThreshold * bonuses.xpThresholdMultiplier);
          maxHp += bonuses.maxHp;
          hp = maxHp;
          maxMp += bonuses.maxMp;
          mp = maxMp;
          atk += bonuses.atk;
          def += bonuses.def;
          unspentPoints += bonuses.attributePoints;
          addLogMessage(
            `🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`,
            'craft'
          );

          setTimeout(() => {
            playSound('levelUp');
          }, 120);

          setTimeout(() => {
            setGameState((current) => {
              const currentRelics = current.playerStats.relics || [];
              const draft = getRandomRelicDraft(3, currentRelics);
              setActiveRelicDraft(draft);
              return current;
            });
          }, 300);
        }

        const nextWeapon = updateWeaponDurability(prev.currentWeapon, addLogMessage);
        const nextShield = updateShieldDurability(prev.equippedShield, addLogMessage);

        let nextExhaustion = prev.playerStats.exhaustion || 0;
        if (!isMagic && Math.random() < 0.25) {
          const vigorSaveChance = stats.dex * 0.015 + stats.str * 0.01;
          if (Math.random() >= vigorSaveChance) {
            nextExhaustion = Math.min(100, nextExhaustion + 2);
            if (nextExhaustion >= 80 && (prev.playerStats.exhaustion || 0) < 80) {
              updatedLogs.push({
                id: `extreme_fatigue_${Date.now()}`,
                text: `⚠️ [CRITICAL EXHAUSTION]: Heavy weapon swings have pushed you to severe physical fatigue (${nextExhaustion}%)! Rest at a campsite or town tavern to recover.`,
                type: 'danger',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
            }
          }
        }

        const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        let nextRep = currentRep;
        let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;

        if (enemy.isTownGuard) {
          let decrease = 25;
          if (updatedEnemy.hp <= 0) {
            decrease += 35;
          }
          nextRep = Math.max(0, currentRep - decrease);
        }

        if (guardWasAttacked) {
          nextGuardsHostile = true;
        }

        let nextFactionReputation = prev.factionReputation
          ? { ...prev.factionReputation }
          : { syndicate: 0, vanguard: 0, bandits: 0 };
        if (
          enemy.faction === 'syndicate' ||
          enemy.faction === 'vanguard' ||
          enemy.faction === 'bandits' ||
          enemy.faction === 'outlaw'
        ) {
          const repFaction =
            enemy.faction === 'outlaw' || enemy.faction === 'bandits' ? 'bandits' : enemy.faction;
          const curFacRep = nextFactionReputation[repFaction] ?? 0;
          let decrease = 20;
          if (updatedEnemy.hp <= 0) {
            decrease += 30;
          }
          const nextFacRep = Math.max(-100, curFacRep - decrease);
          nextFactionReputation[repFaction] = nextFacRep;

          updatedLogs.push({
            id: `faction_assault_${Date.now()}`,
            text: `⚠️ [REPUTATION FALLOUT]: Assaulting a member of the ${
              repFaction === 'syndicate'
                ? 'Moonshadow Syndicate'
                : repFaction === 'vanguard'
                ? 'Dawn Vanguard'
                : 'Rust-Raider Bandits'
            } reduced your standing by -${decrease}! (Standing: ${nextFacRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }

        let nextFactionTerritories = prev.factionTerritories;
        if (updatedEnemy.hp <= 0 && prev.isOverworld) {
          const playerFaction =
            prev.faction === 'syndicate' || prev.faction === 'vanguard' ? prev.faction : 'neutral';
          const { territories, logText } = getUpdatedTerritoriesOnKill(
            prev.factionTerritories,
            prev.currentChunkX,
            prev.currentChunkY,
            playerFaction,
            updatedEnemy
          );
          nextFactionTerritories = territories;
          if (logText) {
            updatedLogs.push({
              id: `conquest_kill_${Date.now()}_${Math.random()}`,
              text: logText,
              type: 'info',
              timestamp: formatGameTime(prev.gameTime).timeStr
            });
          }
        }

        if (updatedEnemy.hp <= 0) {
          nextDefeatedCounts = incrementDefeatedEnemyCount(
            nextDefeatedCounts,
            updatedEnemy.name,
            updatedEnemy.type as string,
            !!updatedEnemy.isBoss
          );
        }

        let nextCaravanTravel = prev.caravanTravel;
        let restoredSkirmishOverworld = undefined;
        if (nextCaravanTravel?.active && nextCaravanTravel.isTacticalCombat) {
          const hostilesAlive = nextEnemies.filter(
            (e) => !e.isFollower && !e.isTownGuard && e.hp > 0
          );
          if (hostilesAlive.length === 0) {
            const curEnc = nextCaravanTravel.currentEncounter;
            if (curEnc && !curEnc.resolved) {
              const bonusGold = curEnc.isBossAmbush ? 250 : 125;
              const bonusXp = curEnc.isBossAmbush ? 200 : 100;
              updatedLogs.push({
                id: `caravan_tactical_win_${Date.now()}`,
                text: `🏆 [TACTICAL VICTORY]: All attackers defeated! The merchant wagon was triumphantly defended! (+${bonusGold} Gold, +${bonusXp} XP)`,
                type: 'combat',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
              playSound('victory');
              updatedXp += bonusXp;

              restoredSkirmishOverworld = nextCaravanTravel.savedOverworldState;
              nextCaravanTravel = {
                ...nextCaravanTravel,
                isTacticalCombat: false,
                rewardGold: nextCaravanTravel.rewardGold + bonusGold,
                savedOverworldState: undefined,
                currentEncounter: {
                  ...curEnc,
                  resolved: true,
                  resultLog: `🏆 TACTICAL VICTORY! Slew all ambushers on the skirmish map! Hull HP preserved: ${
                    nextCaravanTravel.wagonHp || 100
                  }/${nextCaravanTravel.maxWagonHp || 100}`
                }
              };
            }
          }
        }

        return {
          ...prev,
          ...(restoredSkirmishOverworld ? {
            map: restoredSkirmishOverworld.map,
            discovered: restoredSkirmishOverworld.discovered,
            visible: restoredSkirmishOverworld.visible,
            enemies: restoredSkirmishOverworld.enemies,
            dungeonProps: restoredSkirmishOverworld.dungeonProps,
            playerX: restoredSkirmishOverworld.playerX,
            playerY: restoredSkirmishOverworld.playerY,
            currentChunkX: restoredSkirmishOverworld.currentChunkX,
            currentChunkY: restoredSkirmishOverworld.currentChunkY,
          } : {}),
          caravanTravel: nextCaravanTravel,
          enemies: nextEnemies,
          lootPiles: nextLootPiles,
          corpses: nextCorpses,
          bloodSplatters: nextSplatters,
          currentWeapon: nextWeapon,
          equippedShield: nextShield,
          townReputation: nextRep,
          areGuardsHostile: nextGuardsHostile,
          factionReputation: nextFactionReputation,
          factionTerritories: nextFactionTerritories,
          defeatedEnemiesCount: nextDefeatedCounts,
          logs: updatedLogs,
          playerStats: {
            ...prev.playerStats,
            xp: updatedXp,
            level,
            nextLevelXp: nextThreshold,
            hp,
            maxHp,
            mp,
            maxMp,
            atk,
            def,
            unspentPoints,
            exhaustion: nextExhaustion
          }
        };
      });

      return true;
    },
    [
      gameState,
      selectedSpellId,
      setGameState,
      addLogMessage,
      playSound,
      interactWithFollower,
      getCombatFlavorText,
      setActiveRelicDraft,
      gameConfig
    ]
  );

  return {
    performPlayerAttack,
    getCombatFlavorText
  };
}
