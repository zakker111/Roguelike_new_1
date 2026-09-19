import React, { useState, useCallback } from 'react';
import { SPELLS } from '../utils/spellsAndEquipment';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from '../utils/spellScrolls';
import { GameState, GameLogMessage, TileType } from '../types';
import { CatalystType } from '../types/items';
import { consumeItemFromInventory } from '../utils/scrollUtils';
import { playSound } from '../utils/audio';
import { formatGameTime } from '../utils/overworld';
import { hasLineOfSight } from '../utils/ai';
import { calculateArchetypeDamageAdjustment, checkBossPhaseEnrage } from '../utils/combatArchetypes';
import { igniteTile, freezeWaterAt, electrifyConnectedWater, spawnPoisonGasAt } from '../utils/elemental';

export interface UseSpellcastingProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
}

export function useSpellcasting({ setGameState, addLogMessage }: UseSpellcastingProps) {
  const [selectedSpellId, setSelectedSpellId] = useState<string>('arcane_bolt');

  const activeSpell = SPELLS.find((s) => s.id === selectedSpellId) || SPELLS[0];

  /**
   * Crafts a spell scroll using raw materials & catalysts in inventory
   */
  const handleCraftSpellScroll = useCallback((scrollTemplateId: string) => {
    setGameState((prev) => {
      const template = SPELL_SCROLLS.find((t) => t.id === scrollTemplateId || t.id.includes(scrollTemplateId));
      if (!template) {
        return prev;
      }

      const normTime = prev.gameTime % 1440;
      const { timeStr } = formatGameTime(normTime);
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const nextMats = { ...prev.inventoryMaterials };
      const nextCatalysts = { ...prev.inventoryCatalysts };

      // Check materials and catalysts dynamically
      let hasRequired = true;
      for (const [matId, matReq] of Object.entries(template.recipe.materials)) {
        if ((prev.inventoryMaterials[matId] || 0) < matReq.required) {
          hasRequired = false;
        }
      }
      for (const [catId, catReq] of Object.entries(template.recipe.catalysts)) {
        if ((prev.inventoryCatalysts[catId] || 0) < catReq.required) {
          hasRequired = false;
        }
      }

      if (!hasRequired) {
        const matListStr = [
          ...Object.entries(template.recipe.materials).map(([_, req]) => `${req.required}x ${req.name}`),
          ...Object.entries(template.recipe.catalysts).map(([_, req]) => `${req.required}x ${req.name}`),
        ].join(', ');

        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `❌ You lack the materials (${matListStr}) to craft a ${template.name}!`,
          type: 'system',
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg],
        };
      }

      // Deduct materials
      for (const [matId, matReq] of Object.entries(template.recipe.materials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - matReq.required);
      }
      for (const [catId, catReq] of Object.entries(template.recipe.catalysts)) {
        nextCatalysts[catId] = Math.max(0, (nextCatalysts[catId] || 0) - catReq.required);
      }

      const newScroll = getSpellScrollAsEquipmentItem(template, Date.now());

      playSound('spell');

      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: template.successMsgText,
        type: 'craft',
        timestamp: timeStr,
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCatalysts,
        equipmentInventory: [...prev.equipmentInventory, newScroll],
        logs: [...truncatedLogs, successMsg],
      };
    });
  }, [setGameState]);

  /**
   * Casts a targeted spell scroll against an enemy on tile (tx, ty)
   */
  const executeSpellScrollCast = useCallback(
    (
      tx: number,
      ty: number,
      gameState: GameState,
      activeTargetedScroll: any,
      requiredMp: number
    ): boolean => {
      if (!activeTargetedScroll || !activeTargetedScroll.id) return false;

      const template = activeTargetedScroll.scrollTemplateId
        ? SPELL_SCROLLS.find((t) => t.id === activeTargetedScroll.scrollTemplateId)
        : null;

      const dx = tx - gameState.playerX;
      const dy = ty - gameState.playerY;

      const targetEnemyIdx = gameState.enemies.findIndex((e) => e.x === tx && e.y === ty);
      if (targetEnemyIdx === -1) {
        addLogMessage(`❌ You must click on an enemy on the battlefield to unleash the scroll magic!`, 'system');
        return false;
      }

      const enemy = gameState.enemies[targetEnemyIdx];
      const distance = Math.floor(Math.sqrt(dx ** 2 + dy ** 2));
      const castRange = 6;
      if (distance > castRange) {
        addLogMessage(`❌ ${enemy.name} is too far away! Spell Scroll casting range is ${castRange} tiles.`, 'system');
        return false;
      }

      // Check line of sight with zero allocations
      const hasClearPath = hasLineOfSight(gameState.playerX, gameState.playerY, tx, ty, gameState.map);

      if (!hasClearPath) {
        addLogMessage(`❌ Spell trajectory to ${enemy.name} is obscured by solid barriers.`, 'system');
        return false;
      }

      // Player casting spell scroll!
      // 1. Consume scroll from equipmentInventory
      const nextEquip = consumeItemFromInventory(gameState.equipmentInventory, activeTargetedScroll.id, 1);

      // 2. Reduce MP
      const nextMp = Math.max(0, gameState.playerStats.mp - requiredMp);

      // 3. Determine spell scroll traits/type and deal damage & debuffs
      let baseDmg = 35 + gameState.playerStats.int * 2;
      let effectText = '🔥 PYROBLAST!';
      let msgText = '';
      let debuffToApply: { type: CatalystType; duration: number; damagePerTurn: number } | null = null;

      let nextDebuffs = enemy.debuffs ? [...enemy.debuffs] : [];
      let comboTriggered = false;
      let comboDmgBonus = 0;
      let comboLog = '';
      let comboEffectText = '';

      if (template) {
        const isMasterwork = activeTargetedScroll.isMasterwork || activeTargetedScroll.name?.includes('Masterwork');
        const dmgMultiplier = isMasterwork ? 1.3 : 1.0;
        baseDmg = Math.round((template.baseDamage * dmgMultiplier) + gameState.playerStats.int * 2);
        const icon = template.name.split(' ').slice(-1)[0] || '✨';
        const rawName = template.name.replace('Scroll of ', '');
        effectText = isMasterwork ? `🌟 MASTERWORK ${rawName.toUpperCase()}!` : `${icon} ${rawName.toUpperCase()}!`;
        debuffToApply = {
          type: template.debuff.type,
          duration: template.debuff.duration + (isMasterwork ? 1 : 0),
          damagePerTurn: template.debuff.damagePerTurn + (isMasterwork ? 2 : 0),
        };
        msgText = isMasterwork
          ? `🌟 [MASTERWORK SCROLL SPELL]: You read the ${activeTargetedScroll.name}, unleashing amplified arcanum at ${enemy.name}! Deals ${baseDmg} damage!`
          : `📜 [SCROLL SPELL]: You read the ${template.name}, unleashing its arcanum at ${enemy.name}! Deals ${baseDmg} elemental damage and afflicts them!`;

        // Check current debuffs on enemy for combo triggers!
        const activeCombo = template.combos.find((c) => nextDebuffs.some((d) => d.type === c.onDebuff));
        if (activeCombo) {
          comboTriggered = true;
          comboDmgBonus = activeCombo.bonusDamage;
          nextDebuffs = nextDebuffs.filter((d) => d.type !== activeCombo.onDebuff);
          comboLog = `✨ SPELL COMBO: ${enemy.name} ${activeCombo.logMessage}`;
          comboEffectText = activeCombo.effectText;
        }
      } else {
        // Fallback for custom basic scrolls
        effectText = '⚡ SCROLL LIGHTNING!';
        debuffToApply = { type: CatalystType.Lightning, duration: 3, damagePerTurn: 4 };
        msgText = `📜 [SCROLL SPELL]: You read a spell scroll, striking ${enemy.name} with magic! Deals ${baseDmg} damage.`;
      }

      // Apply new debuff if not consumed/combo-wiped
      if (debuffToApply && !comboTriggered) {
        const existIdx = nextDebuffs.findIndex((d) => d.type === debuffToApply!.type);
        if (existIdx !== -1) {
          nextDebuffs[existIdx].duration = debuffToApply.duration;
        } else {
          nextDebuffs.push(debuffToApply);
        }
      }

      let rawSpellDmg = baseDmg + comboDmgBonus;
      const archetypeAdj = calculateArchetypeDamageAdjustment(
        null,
        { archetype: enemy.archetype, def: enemy.def },
        rawSpellDmg
      );
      const totalDmg = archetypeAdj.damage;
      if (archetypeAdj.logNote) {
        addLogMessage(archetypeAdj.logNote, 'info');
      }

      let targetEnemyState = {
        ...enemy,
        hp: Math.max(0, enemy.hp - totalDmg),
        debuffs: nextDebuffs,
      };

      if (targetEnemyState.hp > 0) {
        const enrageCheck = checkBossPhaseEnrage(targetEnemyState);
        if (enrageCheck.isEnragedNow && enrageCheck.logMessage) {
          addLogMessage(enrageCheck.logMessage, 'danger');
        }
        targetEnemyState = enrageCheck.updatedEnemy;
      }

      const nextHp = targetEnemyState.hp;

      playSound('spell');

      // Dispatch arcane scroll projectile
      let scrollProjType = 'magic_staff';
      let scrollProjColor = '#38bdf8';
      if (debuffToApply?.type === CatalystType.Fire || /fire|flame|pyro|meteor/i.test(template?.name || '')) {
        scrollProjType = 'fireball';
        scrollProjColor = '#f97316';
      } else if (debuffToApply?.type === CatalystType.Frost || /frost|ice|blizzard|glacier/i.test(template?.name || '')) {
        scrollProjType = 'frostbolt';
        scrollProjColor = '#38bdf8';
      } else if (debuffToApply?.type === CatalystType.Lightning || /lightning|thunder|shock|storm/i.test(template?.name || '')) {
        scrollProjType = 'electric_wand';
        scrollProjColor = '#fbbf24';
      } else if (debuffToApply?.type === CatalystType.Poison || /poison|venom|toxic|decay/i.test(template?.name || '')) {
        scrollProjType = 'nature_dart';
        scrollProjColor = '#4ade80';
      } else if (/void|shadow|dark|chaos/i.test(template?.name || '')) {
        scrollProjType = 'void_siphon';
        scrollProjColor = '#c084fc';
      }

      window.dispatchEvent(
        new CustomEvent('spawn-projectile', {
          detail: {
            startX: gameState.playerX,
            startY: gameState.playerY,
            targetX: enemy.x,
            targetY: enemy.y,
            color: scrollProjColor,
            projectileType: scrollProjType,
            impactText: `-${totalDmg} Spell Dmg 📜`,
            impactType: 'dmg',
          },
        })
      );

      window.dispatchEvent(
        new CustomEvent('spawn-game-effect', {
          detail: { x: enemy.x, y: enemy.y, text: effectText, type: 'status' },
        })
      );

      addLogMessage(msgText, 'craft');

      if (comboTriggered) {
        addLogMessage(comboLog, 'craft');
        window.dispatchEvent(
          new CustomEvent('spawn-game-effect', {
            detail: { x: enemy.x, y: enemy.y, text: comboEffectText, type: 'status' },
          })
        );
      }

      // Check if enemy slain by scroll
      let xpAwarded = 0;
      let goldLooted = 0;
      let killedName = '';
      const updatedEnemies = [...gameState.enemies];

      if (nextHp <= 0) {
        killedName = enemy.name;
        xpAwarded = (enemy as any).xpValue || Math.max(10, Math.floor(enemy.maxHp * 0.35));
        goldLooted = Math.floor(Math.random() * 10) + 5;
        updatedEnemies.splice(targetEnemyIdx, 1);

        addLogMessage(`☠️ ${enemy.name} was reduced to elemental ash by your scroll magic! (+${xpAwarded} XP, +${goldLooted} Gold)`, 'combat');
        playSound('kill');
      } else {
        updatedEnemies[targetEnemyIdx] = {
          ...enemy,
          hp: nextHp,
          debuffs: nextDebuffs,
        };
      }

      // Apply state update
      setGameState((prev) => {
        const nextXp = prev.playerStats.xp + xpAwarded;
        const nextGold = prev.playerStats.gold + goldLooted;
        let nextLevel = prev.playerStats.level;
        let nextHpMax = prev.playerStats.maxHp;
        let currentHp = prev.playerStats.hp;

        // Level up check
        const requiredXp = nextLevel * 100;
        if (nextXp >= requiredXp) {
          nextLevel += 1;
          nextHpMax += 15;
          currentHp = nextHpMax;
          addLogMessage(`🎉 LEVEL UP! You reached Level ${nextLevel}! HP restored and max HP increased!`, 'craft');
          playSound('levelup');
        }

        // Apply elemental field effects on target tile
        let nextElemental = prev.elementalFields || [];
        let nextMap = prev.map;

        if (debuffToApply?.type === CatalystType.Fire || /fire|flame|pyro|meteor/i.test(template?.name || '')) {
          nextElemental = igniteTile(nextElemental, enemy.x, enemy.y, 5, 2);
        } else if (debuffToApply?.type === CatalystType.Frost || /frost|ice|blizzard/i.test(template?.name || '')) {
          const freezeRes = freezeWaterAt(nextMap, nextElemental, enemy.x, enemy.y, 10);
          nextMap = freezeRes.updatedMap;
          nextElemental = freezeRes.updatedFields;
        } else if (debuffToApply?.type === CatalystType.Lightning || /lightning|thunder|shock/i.test(template?.name || '')) {
          const shockRes = electrifyConnectedWater(nextMap, nextElemental, enemy.x, enemy.y, 8);
          nextElemental = shockRes.updatedFields;
        } else if (debuffToApply?.type === CatalystType.Poison || /poison|venom|toxic/i.test(template?.name || '')) {
          nextElemental = spawnPoisonGasAt(nextElemental, enemy.x, enemy.y, 5);
        }

        return {
          ...prev,
          map: nextMap,
          elementalFields: nextElemental,
          equipmentInventory: nextEquip,
          playerStats: {
            ...prev.playerStats,
            mp: nextMp,
            xp: nextXp,
            gold: nextGold,
            level: nextLevel,
            maxHp: nextHpMax,
            hp: currentHp,
            enemiesDefeated: prev.playerStats.enemiesDefeated + (nextHp <= 0 ? 1 : 0),
          },
          enemies: updatedEnemies,
          activeTargetedScroll: null, // clear active scroll target state
        };
      });

      return true;
    },
    [addLogMessage, setGameState]
  );

  return {
    selectedSpellId,
    setSelectedSpellId,
    activeSpell,
    handleCraftSpellScroll,
    executeSpellScrollCast,
  };
}
