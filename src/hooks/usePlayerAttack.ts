import { Dispatch, SetStateAction, useCallback } from 'react';
import {
  GameState,
  Enemy,
  CraftedWeapon,
  WeaponBaseType,
  CatalystType,
  EnemyType,
  EquipmentItem,
  LootPile,
  Corpse,
  TileType,
} from '../types';
import { STARTING_WEAPON, SPELLS, getItemDurabilityDecay } from '../utils/spellsAndEquipment';
import { isPlayerInvincible } from '../utils/invincibility';
import { getEffectiveStats } from '../utils/scars';
import { COMBAT_FLAVOR_TEXTS, FALLBACK_FLAVORS } from '../data/combatFlavors';
import { calculateNetDamage } from '../data/balance';
import { calculateArchetypeDamageAdjustment, checkBossPhaseEnrage } from '../utils/combatArchetypes';
import { formatGameTime } from '../utils/overworld';
import { getRandomRelicDraft, SanctumRelic } from '../utils/relics';
import { getUpdatedTerritoriesOnKill } from '../utils/caravanAndTerritory';
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  hasEquippedTrait,
  isLunarBlessingActive,
  getEffectiveAttribute,
  generateRandomLootGear,
} from '../utils/gameUtils';
import { WEATHER_EFFECTS } from '../utils/weatherEngine';

export interface UsePlayerAttackParams {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  selectedSpellId: string;
  interactWithFollower: (followerEnemy: Enemy) => void;
  setUnlawfulGuardTarget: (target: { enemy: Enemy; index: number; pathPoints: any[] } | null) => void;
  setActiveRelicDraft: (draft: SanctumRelic[] | null) => void;
  gameConfig: {
    levelUpBonuses: {
      xpThresholdMultiplier: number;
      maxHp: number;
      maxMp: number;
      def: number;
      atk: number;
      attributePoints: number;
    };
    worldRates?: {
      equipmentDropRateBonusPerLuck?: number;
    };
  };
}

function incrementDefeatedEnemyCount(
  currentCounts: { [key: string]: number } | undefined,
  enemyName: string,
  enemyType: string,
  isBoss: boolean
): { [key: string]: number } {
  const counts = { ...(currentCounts || {}) };
  const key = isBoss ? `boss_${enemyName.toLowerCase().replace(/\s+/g, '_')}` : enemyType.toLowerCase();
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}

const isToolItem = (item: any, toolType: string) => {
  if (!item) return false;
  const name = item.name ? item.name.toLowerCase() : '';
  const sub = item.subType ? item.subType.toLowerCase() : '';
  const id = item.id ? item.id.toLowerCase() : '';
  return name.includes(toolType) || sub.includes(toolType) || id.includes(toolType);
};

export function usePlayerAttack({
  gameState,
  setGameState,
  addLogMessage,
  playSound,
  selectedSpellId,
  interactWithFollower,
  setUnlawfulGuardTarget,
  setActiveRelicDraft,
  gameConfig,
}: UsePlayerAttackParams) {

  const getCombatFlavorText = useCallback((weapon: CraftedWeapon, enemyName: string, isCrit: boolean): string => {
    const name = enemyName;
    const base = weapon.baseType;
    const pool = COMBAT_FLAVOR_TEXTS[base] || FALLBACK_FLAVORS;
    const array = isCrit ? pool.crit : pool.normal;
    const index = Math.floor(Math.random() * array.length);
    return array[index].replace(/{name}/g, name);
  }, []);

  const performPlayerAttack = useCallback((
    enemy: Enemy,
    index: number,
    pathPoints: { x: number; y: number }[]
  ): boolean => {
    if (enemy.isFollower || (enemy.isCaptive && enemy.isFreed)) {
      interactWithFollower(enemy);
      return false;
    }

    const weapon = gameState.currentWeapon || STARTING_WEAPON;
    const stats = getEffectiveStats(gameState.playerStats);

    // Check custom ammunition costs (Staff or Wand costs mana)
    const isMagic = weapon.baseType === WeaponBaseType.Staff || weapon.baseType === WeaponBaseType.Wand;
    const activeSpell = SPELLS.find(s => s.id === selectedSpellId) || SPELLS[0];
    let finalManaCost = isMagic
      ? (weapon.baseType === WeaponBaseType.Wand ? Math.max(2, activeSpell.manaCost - 1) : activeSpell.manaCost)
      : 0;

    if (isMagic && stats.relics?.includes('mana_battery')) {
      finalManaCost = Math.max(1, finalManaCost - 3);
    }

    if (isMagic && stats.mp < finalManaCost) {
      addLogMessage(`❌ Magic casting with ${weapon.name} requires ${finalManaCost} Mana! Wait to restore Mana!`, 'system');
      playSound('bump');
      return false;
    }

    // Spend mana
    let spentMp = 0;
    if (isMagic) {
      spentMp = finalManaCost;
      playSound('spell');
    } else {
      playSound('slash');
    }

    // Roll damage & critical rates
    const isBroken = weapon.durability !== undefined && weapon.durability <= 0;
    const playerExhaustion = stats.exhaustion || 0;
    const exhaustionPenalty = (playerExhaustion / 100) * 0.15;

    let activeEffectsAtkBonus = 0;
    let activeEffectsCritBonus = 0;
    if (stats.activeEffects) {
      stats.activeEffects.forEach(eff => {
        if (eff.statModifiers) {
          if (eff.statModifiers.atk) activeEffectsAtkBonus += eff.statModifiers.atk;
          if (eff.statModifiers.crit) activeEffectsCritBonus += eff.statModifiers.crit;
        }
      });
    }

    const factionCritBonus = (gameState.factionTerritories?.['moonshadow_cove']?.controller === gameState.faction) ? 0.05 : 0;
    const finalCritChance = Math.max(0.01, weapon.critChance - exhaustionPenalty + (gameState.activeFoodBuff?.critBonus || 0) + activeEffectsCritBonus + factionCritBonus);
    const rollCrit = isBroken ? false : (Math.random() < finalCritChance);
    if (playerExhaustion > 40 && !isBroken) {
      addLogMessage(`💤 [EXHAUSTED]: Physical fatigue (${playerExhaustion}% exhaustion) dampens your reflexes, reducing your critical strike chance to ${Math.round(finalCritChance * 100)}%!`, 'info');
    }
    let baseHit = (isBroken ? 1 : weapon.damage) + stats.atk + (gameState.activeFoodBuff?.atkBonus || 0) + activeEffectsAtkBonus;
    if (stats.relics?.includes('giants_blood')) {
      baseHit += 4;
    }
    if (hasEquippedTrait(gameState, 'WORG_FORCE')) {
      baseHit += 3;
    }

    // Dual Wielding Off-Hand Bonus (when holding a weapon in the off-hand slot)
    if (gameState.equippedShield && (gameState.equippedShield.type === 'weapon' || (gameState.equippedShield.damage ?? 0) > 0) && gameState.equippedShield.subType !== 'Shield') {
      const offhandDmg = gameState.equippedShield.damage || 0;
      const offhandBonus = Math.max(1, Math.floor(offhandDmg * 0.5));
      baseHit += offhandBonus;
    }
    
    // Apply spell power scaling if magic
    if (isMagic) {
      let spellScale = activeSpell.damageMultiplier;
      if (stats.relics?.includes('spell_weaver')) {
        spellScale *= 1.15;
      }
      if (isLunarBlessingActive(gameState, 'full_moon')) {
        spellScale *= 1.25;
      }
      baseHit = Math.round(baseHit * spellScale);
    }

    // Apply Sandbox Player Damage Multiplier
    const playerDmgMult = (window as any).arenaPlayerDamageMultiplier || 1.0;
    baseHit = Math.round(baseHit * playerDmgMult);
    
    // Core alloys effects (e.g. Obsidian deals +150% crit damage)
    let critMult = 2.0;
    if (!isBroken && weapon.materialUsed?.extraProperty === 'CRIT_HEAVY' && rollCrit) {
      critMult = 2.5;
    }

    let finalHit = rollCrit ? Math.floor(baseHit * critMult) : baseHit;

    // Autumn Stealth Crit Bonus (+40% extra damage on critical strikes in Autumn)
    if (rollCrit && gameState.season === 'autumn') {
      finalHit = Math.floor(finalHit * 1.40);
      addLogMessage(`🍂 [AUTUMN STEALTH]: Shadow critical strikes from the amber mists deal +40% extra damage!`, 'craft');
    }

    if (rollCrit && gameState.followers && gameState.followers.length > 0 && Math.random() < 0.6) {
      const folName = gameState.followers[0].name;
      const cheers = [
        `🛡️ ${folName}: "Sensational strike, master! Keep pressing!"`,
        `🛡️ ${folName}: "A devastating critical hit! Their armor shattered!"`,
        `🛡️ ${folName}: "By the Ancients, what a strike!"`
      ];
      addLogMessage(cheers[Math.floor(Math.random() * cheers.length)], 'loot');
    }

    // Summer Catalyst Spark / Lightning Charge (+25% extra lightning damage during Summer)
    const catalyst = weapon.catalystUsed;
    if (gameState.season === 'summer' && catalyst && (catalyst.type === CatalystType.Lightning || catalyst.id?.includes('lightning') || catalyst.name?.includes('Lightning'))) {
      finalHit = Math.floor(finalHit * 1.25);
      addLogMessage(`⚡ [SUMMER SUPERCHARGE]: Heatwaves supercharge your Lightning catalyst for +25% extra damage!`, 'craft');
    }

    // Weather Specific Combat Buffs and Modifiers
    if (gameState.isOverworld && gameState.weather) {
      const effect = WEATHER_EFFECTS[gameState.weather];
      if (effect && effect.combatModifiers) {
        const mods = effect.combatModifiers;
        if (catalyst && mods.catalystModifiers) {
          const catMod = mods.catalystModifiers[catalyst.type];
          if (catMod) {
            finalHit = Math.floor(finalHit * catMod.multiplier);
            addLogMessage(catMod.logText, 'craft');
          }
        }
        if (mods.blindnessChance && Math.random() < mods.blindnessChance) {
          finalHit = Math.floor(finalHit * (mods.blindnessMultiplier ?? 0.5));
          if (mods.blindnessLog) {
            addLogMessage(mods.blindnessLog, 'danger');
          }
        }
      }
    }

    // Initialize enemy debuffs
    let nextDebuffs = enemy.debuffs ? [...enemy.debuffs] : [];
    let comboDmgBonus = 0;
    let comboTriggered = false;
    let comboLog = '';
    let comboEffectText = '';

    // Spell Combo Mechanics (Elemental Interactions)
    if (isMagic) {
      // 1. SHATTER (Frostbite Lance + Lightning debuff OR Chain Lightning + Frost debuff)
      if (activeSpell.id === 'frostbite_lance' && nextDebuffs.some(d => d.type === CatalystType.Lightning)) {
        comboTriggered = true;
        comboDmgBonus = 25;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Lightning);
        comboLog = `❄️⚡ SPELL COMBO [SHATTER]: ${enemy.name} was Shocked, and your Frostbite Lance shattered the conductive ice! Deals +25 bonus damage!`;
        comboEffectText = `💥 SHATTER! +25`;
      } else if (activeSpell.id === 'chain_lightning' && nextDebuffs.some(d => d.type === CatalystType.Frost)) {
        comboTriggered = true;
        comboDmgBonus = 25;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Frost);
        comboLog = `⚡❄️ SPELL COMBO [SHATTER]: ${enemy.name} was Frozen, and your Chain Lightning shattered the brittle frozen core! Deals +25 bonus damage!`;
        comboEffectText = `💥 SHATTER! +25`;
      }
      // 2. MELT (Pyroblast + Frost debuff OR Frostbite Lance + Fire debuff)
      else if (activeSpell.id === 'pyroblast' && nextDebuffs.some(d => d.type === CatalystType.Frost)) {
        comboTriggered = true;
        comboDmgBonus = 20;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Frost);
        comboLog = `🔥❄️ SPELL COMBO [MELT]: ${enemy.name} was Frozen, and your Pyroblast vaporized the ice in a burst of superheated steam! Deals +20 bonus damage!`;
        comboEffectText = `💧 STEAM BLAST! +20`;
      } else if (activeSpell.id === 'frostbite_lance' && nextDebuffs.some(d => d.type === CatalystType.Fire)) {
        comboTriggered = true;
        comboDmgBonus = 20;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Fire);
        comboLog = `❄️🔥 SPELL COMBO [MELT]: ${enemy.name} was Burning, and your Frostbite Lance rapidly cooled the hot flesh causing severe thermal shock! Deals +20 bonus damage!`;
        comboEffectText = `💧 THERMAL SHOCK! +20`;
      }
      // 3. COMBUSTION (Pyroblast on Poison debuff)
      else if (activeSpell.id === 'pyroblast' && nextDebuffs.some(d => d.type === CatalystType.Poison)) {
        comboTriggered = true;
        comboDmgBonus = 20;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Poison);
        comboLog = `🔥🧪 SPELL COMBO [COMBUSTION]: ${enemy.name} was Poisoned, and your Pyroblast ignited the noxious toxic fumes! Deals +20 bonus damage and triggers a gas burst!`;
        comboEffectText = `💥 COMBUSTION! +20`;

        const splashEvent = new CustomEvent('spawn-game-effect', {
          detail: {
            x: enemy.x,
            y: enemy.y,
            text: `🔥 TOXIC DEFLAGRATION!`,
            type: 'crit'
          }
        });
        window.dispatchEvent(splashEvent);
      }
      // 4. VOID REAP (Void Siphon on ANY elemental debuff)
      else if (activeSpell.id === 'void_siphon' && nextDebuffs.some(d => d.type === CatalystType.Fire || d.type === CatalystType.Frost || d.type === CatalystType.Poison || d.type === CatalystType.Lightning)) {
        comboTriggered = true;
        comboDmgBonus = 15;
        const targetDebuff = nextDebuffs.find(d => d.type === CatalystType.Fire || d.type === CatalystType.Frost || d.type === CatalystType.Poison || d.type === CatalystType.Lightning);
        if (targetDebuff) {
          nextDebuffs = nextDebuffs.filter(d => d.type !== targetDebuff.type);
          comboLog = `🌌🔮 SPELL COMBO [VOID REAP]: Void Siphon consumed ${enemy.name}'s ${targetDebuff.type} affliction, tearing their lifeforce! Deals +15 bonus damage & restores +15 HP!`;
        } else {
          comboLog = `🌌🔮 SPELL COMBO [VOID REAP]: Void Siphon consumed ${enemy.name}'s affliction! Deals +15 bonus damage & restores +15 HP!`;
        }
        comboEffectText = `🌌 VOID REAP! +15`;

        // Void Siphon heals player for additional combo damage
        const isPlayerHurt = gameState.playerStats.hp < gameState.playerStats.maxHp;
        setGameState(prev => {
          const s = { ...prev.playerStats };
          s.hp = Math.min(s.maxHp, s.hp + 15);
          return { ...prev, playerStats: s };
        });

        if (isPlayerHurt) {
          const healEvent = new CustomEvent('spawn-game-effect', {
            detail: { x: gameState.playerX, y: gameState.playerY, text: `+15 Combo HP`, type: 'heal' },
          });
          window.dispatchEvent(healEvent);
        }
      }
    }

    let finalComboBonus = comboDmgBonus;
    if (comboTriggered && stats.relics?.includes('spell_weaver')) {
      finalComboBonus += 5;
    }
    // Calculate net physical/magical damage using diminishing armor formula (Crits penetrate 50% armor)
    const effectiveArmor = rollCrit ? Math.floor(enemy.def * 0.5) : enemy.def;
    const baseNetDamage = calculateNetDamage(finalHit, effectiveArmor);
    let rawDmg = Math.max(1, baseNetDamage) + finalComboBonus;

    const archetypeAdj = calculateArchetypeDamageAdjustment(
      { archetype: 'glass_cannon', isCrit: rollCrit },
      { archetype: enemy.archetype, def: effectiveArmor },
      rawDmg
    );
    const finalDmg = archetypeAdj.damage;
    if (archetypeAdj.logNote) {
      addLogMessage(archetypeAdj.logNote, 'info');
    }

    // Handle Enemy Ethereal Phasing Affix
    if (enemy.affixes?.includes('phasing') && Math.random() < 0.25) {
      addLogMessage(`👻 [ETHEREAL PHASING]: ${enemy.name} shifted out of phase, evading your physical attack!`, 'info');
      playSound('bump');
      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: enemy.x, y: enemy.y, text: `👻 PHASE DODGE!`, type: 'heal' },
      });
      window.dispatchEvent(ev);
      return true;
    }

    // Handle Enemy Thorns Reflection Affix
    if (enemy.affixes?.includes('thorns') && finalDmg > 0 && !isMagic) {
      if (isPlayerInvincible(gameState, gameState.playerStats)) {
        addLogMessage(`🛡️ [GOD MODE]: ${enemy.name}'s spiked thorns shatter against your invulnerable shield! (0 damage)`, 'info');
      } else {
        const thornDmg = Math.max(1, Math.floor(finalDmg * 0.25));
        setGameState(prev => ({
          ...prev,
          playerStats: { ...prev.playerStats, hp: Math.max(0, prev.playerStats.hp - thornDmg) }
        }));
        addLogMessage(`🛡️ [THORNS REFLECTION]: ${enemy.name}'s spiked hide reflects -${thornDmg} HP back to you!`, 'danger');
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: `-${thornDmg} Thorns`, type: 'dmg' },
        });
        window.dispatchEvent(ev);
      }
    }

    // Apply material specific property visual impact (e.g., Dragonforce circular ring explosion)
    if (rollCrit && weapon.materialUsed?.extraProperty === 'DRAGON_FORCE') {
      addLogMessage(`🔥 Crimson DragonScale sparks circular fire ring! Nearby targets crackle!`, 'craft');
    }

    if (comboTriggered) {
      addLogMessage(comboLog, 'craft');
      // Dispatch a second game effect slightly higher for the Spell Combo label
      setTimeout(() => {
        const comboEvent = new CustomEvent('spawn-game-effect', {
          detail: {
            x: enemy.x,
            y: enemy.y,
            text: comboEffectText,
            type: 'heal', // Greenish/bluish high contrast text
          }
        });
        window.dispatchEvent(comboEvent);
      }, 100);
    }

    // Apply on-hit elemental affliction catalysts if NO combo was triggered
    if (!comboTriggered) {
      if (isMagic && activeSpell.id === 'frostbite_lance') {
        const alreadyAfflicted = nextDebuffs.some((d) => d.type === CatalystType.Frost);
        if (!alreadyAfflicted) {
          let duration = 3;
          if (stats.relics?.includes('sunder_catalyst_relic')) {
            duration += 2;
          }
          nextDebuffs.push({
            type: CatalystType.Frost,
            duration: duration,
            damagePerTurn: 2,
          });
          addLogMessage(`❄️ Frostbite lance frozen infusion: ${enemy.name} is frozen solid in deep frost!${stats.relics?.includes('sunder_catalyst_relic') ? ' (Extended by Sunder Catalyst)' : ''}`, 'craft');
        }
      } else if (catalyst) {
        const afflictedRoll = Math.random() < catalyst.statusEffectChance;
        if (afflictedRoll) {
          const alreadyAfflicted = nextDebuffs.some((d) => d.type === catalyst.type);
          if (!alreadyAfflicted) {
            let overTurnDamage = 2;
            if (catalyst.type === CatalystType.Fire) overTurnDamage = 3;
            else if (catalyst.type === CatalystType.Poison) overTurnDamage = 4;

            let duration = catalyst.statusDuration;
            if (stats.relics?.includes('sunder_catalyst_relic')) {
              duration += 2;
            }

            nextDebuffs.push({
              type: catalyst.type,
              duration: duration,
              damagePerTurn: overTurnDamage,
            });
            addLogMessage(`✨ Fused elemental affliction: ${enemy.name} is now inflicted with ${catalyst.damageType}!${stats.relics?.includes('sunder_catalyst_relic') ? ' (Extended by Sunder Catalyst)' : ''}`, 'craft');
          }
        }
      }

      // Giant's Blood stun application for physical hits
      if (!isMagic && stats.relics?.includes('giants_blood') && Math.random() < 0.25) {
        const alreadyStunned = nextDebuffs.some((d) => d.type === CatalystType.Shadow);
        if (!alreadyStunned) {
          nextDebuffs.push({
            type: CatalystType.Shadow,
            duration: 1,
            damagePerTurn: 0,
          });
          addLogMessage(`🌋 [GIANT'S BLOOD]: Brutal strike stuns ${enemy.name}!`, 'craft');
          
          const stunEv = new CustomEvent('spawn-game-effect', {
            detail: { x: enemy.x, y: enemy.y, text: '💥 STUNNED!', type: 'dmg' },
          });
          window.dispatchEvent(stunEv);
        }
      }
    }

    // PHASE 3: WEAPON STAGGER / GUARD DAMAGE CALCULATION
    let staggerImpact = 15;
    const wSubType = (weapon as any).subType || weapon.baseType;
    if (wSubType === WeaponBaseType.Hammer || wSubType === ('Axe' as any) || wSubType === 'Shield' || (weapon.name && /hammer|mace|club|maul|axe|shield|pickaxe/i.test(weapon.name))) {
      staggerImpact = 28;
    } else if (wSubType === WeaponBaseType.Sword || wSubType === WeaponBaseType.Spear) {
      staggerImpact = 18;
    } else {
      staggerImpact = 12;
    }

    if (rollCrit) {
      staggerImpact = Math.round(staggerImpact * 1.8);
    }

    let staggerVulnerabilityMult = 1.0;
    if (enemy.isStaggered) {
      staggerVulnerabilityMult = 1.5;
      addLogMessage(`💥 [STAGGER SHATTER]: Striking STAGGERED ${enemy.name} for +50% Vulnerability Damage!`, 'loot');
    }

    const netAdjustedDmg = Math.round(finalDmg * staggerVulnerabilityMult);

    const curStag = enemy.staggerMeter || 0;
    const maxStag = enemy.maxStaggerMeter || (enemy.isBoss ? 120 : enemy.isElite ? 75 : 45);
    const newStag = Math.min(maxStag, curStag + staggerImpact);

    let isTargetStaggered = enemy.isStaggered || false;
    let stagTurns = enemy.staggerTurns || 0;

    if (newStag >= maxStag && !isTargetStaggered) {
      isTargetStaggered = true;
      stagTurns = 2;
      addLogMessage(`💥 [STAGGER BREAK]: You shattered ${enemy.name}'s stance and guard! Target is STAGGERED for 2 turns (+50% vulnerability damage)!`, 'danger');
      const stagEv = new CustomEvent('spawn-game-effect', {
        detail: { x: enemy.x, y: enemy.y, text: `💥 STAGGERED!`, type: 'crit' },
      });
      window.dispatchEvent(stagEv);
    }

    let enemyCandidate: Enemy = {
      ...enemy,
      hp: Math.max(0, enemy.hp - netAdjustedDmg),
      debuffs: nextDebuffs,
      staggerMeter: newStag,
      maxStaggerMeter: maxStag,
      isStaggered: isTargetStaggered,
      staggerTurns: stagTurns
    };

    if (enemyCandidate.hp > 0) {
      const enrageCheck = checkBossPhaseEnrage(enemyCandidate);
      if (enrageCheck.isEnragedNow && enrageCheck.logMessage) {
        addLogMessage(enrageCheck.logMessage, 'danger');
      }
      enemyCandidate = enrageCheck.updatedEnemy;
    }

    const updatedEnemy = enemyCandidate;

    // Vampirism material healing
    let healingDone = 0;
    if (weapon.materialUsed?.extraProperty === 'VAMPIRISM') {
      healingDone = Math.floor(finalDmg * 0.15);
    }
    if (isMagic && activeSpell.id === 'void_siphon') {
      healingDone += Math.floor(finalDmg * 0.25);
    }

    // Emit global Custom Event to trigger canvas graphics (floating text particle splatter)
    const isRanged = weapon.range > 1;
    let projType: 'arrow' | 'magic_staff' | 'electric_wand' | 'skeleton_bolt' | 'enemy_spell' | 'throwable' = 'arrow';
    if (weapon.baseType === WeaponBaseType.Staff) {
      projType = 'magic_staff';
    } else if (weapon.baseType === WeaponBaseType.Wand) {
      projType = 'electric_wand';
    } else if (weapon.baseType === WeaponBaseType.Spear || weapon.baseType === WeaponBaseType.Dagger) {
      projType = 'throwable';
    } else if (weapon.baseType === WeaponBaseType.Crossbow) {
      projType = 'arrow';
    }

    let projColor = weapon.color || '#38bdf8';
    if (isMagic) {
      if (activeSpell.id === 'pyroblast') projColor = '#f97316';
      else if (activeSpell.id === 'frostbite_lance') projColor = '#38bdf8';
      else if (activeSpell.id === 'chain_lightning') {
        projColor = '#eab308';
        projType = 'electric_wand';
      } else if (activeSpell.id === 'void_siphon') projColor = '#8b5cf6';
      else projColor = '#a78bfa';
    }

    const isPlayerHurt = gameState.playerStats.hp < gameState.playerStats.maxHp;

    if (isRanged) {
      const projEvent = new CustomEvent('spawn-projectile', {
        detail: {
          startX: gameState.playerX,
          startY: gameState.playerY,
          targetX: enemy.x,
          targetY: enemy.y,
          color: projColor,
          projectileType: projType,
          impactText: rollCrit ? `CRIT! -${finalDmg} HP` : `-${finalDmg} HP`,
          impactType: rollCrit ? 'crit' : 'dmg',
          impactHealingText: (healingDone > 0 && isPlayerHurt) ? `+${healingDone} Vamp HP` : null
        }
      });
      window.dispatchEvent(projEvent);
    } else {
      const event = new CustomEvent('spawn-game-effect', {
        detail: {
          x: enemy.x,
          y: enemy.y,
          sourceX: gameState.playerX,
          sourceY: gameState.playerY,
          text: rollCrit ? `CRIT! -${finalDmg} HP` : `-${finalDmg} HP`,
          type: rollCrit ? 'crit' : 'dmg',
        },
      });
      window.dispatchEvent(event);

      // If healing triggers
      if (healingDone > 0 && isPlayerHurt) {
        const healEvent = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: `+${healingDone} Vamp HP`, type: 'heal' },
        });
        window.dispatchEvent(healEvent);
      }
    }

    // Construct attack messages
    const flavor = getCombatFlavorText(weapon, enemy.name, rollCrit);
    addLogMessage(`${flavor} [${finalDmg} DMG · ${weapon.name}]`, 'combat');

    // Hammer Knockback Mechanics
    if (weapon.baseType === WeaponBaseType.Hammer) {
      const dx = enemy.x - gameState.playerX;
      const dy = enemy.y - gameState.playerY;
      const tX = enemy.x + Math.sign(dx);
      const tY = enemy.y + Math.sign(dy);

      // Verify bounds & empty tiles to push enemy back
      if (
        tX >= 0 &&
        tX < LEVEL_WIDTH &&
        tY >= 0 &&
        tY < LEVEL_HEIGHT &&
        (gameState.map[tY][tX] === TileType.Floor || gameState.map[tY][tX] === TileType.Grass || gameState.map[tY][tX] === TileType.Path)
      ) {
        updatedEnemy.x = tX;
        updatedEnemy.y = tY;
        addLogMessage(`🔨 Granite Heavy Mallet blows knock the ${enemy.name} backward!`, 'combat');
      }
    }

    // Update enemies array
    setGameState((prev) => {
      let nextEnemies = [...prev.enemies];
      let gainedXp = 0;
      let extraXpGained = 0;
      let guardWasAttacked = enemy.isTownGuard;
      let nextLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];
      let nextCorpses = prev.corpses ? [...prev.corpses] : [];
      let nextSplatters = prev.bloodSplatters ? [...prev.bloodSplatters] : [];
      let updatedLogs = [...prev.logs];
      let nextDefeatedCounts = prev.defeatedEnemiesCount ? { ...prev.defeatedEnemiesCount } : {};

      const finalEnemyIndex = nextEnemies.findIndex((e) => e.id === enemy.id);

      if (finalEnemyIndex === -1) {
        // Safe check if enemy is already removed/killed
        return prev;
      }

      // Process Pyroblast Splash or Chain Lightning Chaining
      if (isMagic && activeSpell.id === 'pyroblast') {
        const primaryX = enemy.x;
        const primaryY = enemy.y;
        const splashDmg = Math.max(1, Math.floor(finalDmg * 0.50));

        for (let sIdx = nextEnemies.length - 1; sIdx >= 0; sIdx--) {
          const splashEnemy = nextEnemies[sIdx];
          if (splashEnemy.id === enemy.id) continue;

          const distToTarget = Math.abs(splashEnemy.x - primaryX) + Math.abs(splashEnemy.y - primaryY);
          if (distToTarget <= 1) {
            const finalSplashDmg = Math.max(1, splashDmg - splashEnemy.def);
            splashEnemy.hp -= finalSplashDmg;
            if (splashEnemy.isTownGuard) {
              guardWasAttacked = true;
            }

            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: splashEnemy.x, y: splashEnemy.y, text: `💥 Splash -${finalSplashDmg} HP`, type: 'dmg' },
            });
            window.dispatchEvent(ev);

            updatedLogs.push({
              id: `pyro_splash_${Date.now()}_${Math.random()}`,
              text: `🔥 Pyroblast splash singes ${splashEnemy.name} for ${finalSplashDmg} damage!`,
              type: 'combat',
              timestamp: formatGameTime(prev.gameTime).timeStr
            });

            if (Math.random() < 0.40) {
              const currentSplashDebuffs = splashEnemy.debuffs || [];
              const alreadyAfflicted = currentSplashDebuffs.some((d) => d.type === CatalystType.Fire);
              if (!alreadyAfflicted) {
                splashEnemy.debuffs = [...currentSplashDebuffs, {
                  type: CatalystType.Fire,
                  duration: 3,
                  damagePerTurn: 3
                }];
                updatedLogs.push({
                  id: `pyro_splash_burn_${Date.now()}_${Math.random()}`,
                  text: `✨ Pyroblast ignited ${splashEnemy.name}!`,
                  type: 'craft',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
              }
            }

            if (splashEnemy.hp <= 0) {
              nextDefeatedCounts = incrementDefeatedEnemyCount(
                nextDefeatedCounts,
                splashEnemy.name,
                splashEnemy.type as string,
                !!splashEnemy.isBoss
              );
              nextEnemies.splice(sIdx, 1);
              nextCorpses.push({
                id: `corpse_${Date.now()}_${Math.random()}`,
                x: splashEnemy.x,
                y: splashEnemy.y,
                name: `${splashEnemy.name} Corpse`,
                char: splashEnemy.char,
                color: splashEnemy.color,
                type: splashEnemy.isAnimal ? 'animal' : 'enemy',
                isElite: splashEnemy.isElite,
              });
              nextSplatters.push({
                id: `splatter_slain_${Date.now()}_${Math.random()}`,
                x: splashEnemy.x,
                y: splashEnemy.y,
                intensity: 2,
                color: '#dc2626',
              });
              const splashGold = Math.floor(Math.random() * 4) + 2;
              nextLootPiles.push({
                id: `loot_${Date.now()}_${Math.random()}`,
                x: splashEnemy.x,
                y: splashEnemy.y,
                gold: splashGold,
                materials: [],
                catalysts: [],
                equipment: []
              });
              updatedLogs.push({
                id: `pyro_splash_kill_${Date.now()}_${Math.random()}`,
                text: `💀 ${splashEnemy.name} was incinerated by the blast! (+15 XP)`,
                type: 'loot',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
              extraXpGained += 15;
            }
          }
        }
      } else if (isMagic && activeSpell.id === 'chain_lightning') {
        const primaryX = enemy.x;
        const primaryY = enemy.y;
        const chainCandidates = nextEnemies
          .filter(e => e.id !== enemy.id)
          .map(e => ({ enemy: e, dist: Math.abs(e.x - primaryX) + Math.abs(e.y - primaryY) }))
          .filter(c => c.dist <= 3)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);

        chainCandidates.forEach((cand) => {
          const chainEnemy = cand.enemy;
          const chainDmg = Math.max(1, Math.floor(finalDmg * 0.80) - chainEnemy.def);
          chainEnemy.hp -= chainDmg;
          if (chainEnemy.isTownGuard) {
            guardWasAttacked = true;
          }

          const chainProjEvent = new CustomEvent('spawn-projectile', {
            detail: {
              startX: primaryX,
              startY: primaryY,
              targetX: chainEnemy.x,
              targetY: chainEnemy.y,
              color: '#eab308',
              projectileType: 'electric_wand',
              impactText: `⚡ Chain -${chainDmg} HP`,
              impactType: 'dmg'
            }
          });
          window.dispatchEvent(chainProjEvent);

          updatedLogs.push({
            id: `chain_lightning_${Date.now()}_${Math.random()}`,
            text: `⚡ Lightning chains to ${chainEnemy.name} for ${chainDmg} damage!`,
            type: 'combat',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });

          if (chainEnemy.hp <= 0) {
            const cIdx = nextEnemies.findIndex(e => e.id === chainEnemy.id);
            if (cIdx !== -1) {
              nextDefeatedCounts = incrementDefeatedEnemyCount(
                nextDefeatedCounts,
                chainEnemy.name,
                chainEnemy.type as string,
                !!chainEnemy.isBoss
              );
              nextEnemies.splice(cIdx, 1);
              nextCorpses.push({
                id: `corpse_${Date.now()}_${Math.random()}`,
                x: chainEnemy.x,
                y: chainEnemy.y,
                name: `${chainEnemy.name} Corpse`,
                char: chainEnemy.char,
                color: chainEnemy.color,
                type: chainEnemy.isAnimal ? 'animal' : 'enemy',
                isElite: chainEnemy.isElite,
              });
              nextSplatters.push({
                id: `splatter_slain_${Date.now()}_${Math.random()}`,
                x: chainEnemy.x,
                y: chainEnemy.y,
                intensity: 2,
                color: '#38bdf8',
              });
              const chainGold = Math.floor(Math.random() * 4) + 2;
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

      const isAnimal = updatedEnemy.isAnimal;
      const isLootGoblin = updatedEnemy.type === EnemyType.LootGoblin || updatedEnemy.name.toLowerCase().includes('loot goblin');
      const splatterColor = updatedEnemy.char === 'r' ? '#22c55e' : (updatedEnemy.char === 'S' || updatedEnemy.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
      const finalSplatterColor = isLootGoblin ? '#f59e0b' : splatterColor;

      if (updatedEnemy.hp <= 0) {
        // Enemy is dead - spawn corpse & high intensity death splatter
        const xpMult = (window as any).arenaXpMultiplier || 1.0;
        const goldMult = (window as any).arenaGoldMultiplier || 1.0;
        const isBoss = !!updatedEnemy.isBoss;
        const isDragon = updatedEnemy.type === EnemyType.Dragon;
        
        gainedXp = Math.round((isAnimal ? 5 : (isLootGoblin ? 60 : (isBoss ? 250 : (isDragon ? 120 : (updatedEnemy.isElite ? 45 : 15))))) * xpMult);
        const baseGold = isBoss
          ? Math.floor(Math.random() * 50) + 50 + prev.playerStats.depth * 15
          : (isDragon
              ? Math.floor(Math.random() * 80) + 80
              : Math.floor(Math.random() * 8) + 4 + prev.playerStats.depth * 3);
        const goldVal = Math.round(baseGold * goldMult);

        const newCorpse: Corpse = {
          id: `corpse_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          char: updatedEnemy.char,
          name: updatedEnemy.name,
          color: updatedEnemy.color,
          type: isAnimal ? 'animal' : 'enemy',
          isElite: updatedEnemy.isElite,
        };
        if (!isLootGoblin) {
          nextCorpses.push(newCorpse);
        }

        nextSplatters.push({
          id: `splatter_slain_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          intensity: (isBoss || isDragon) ? 5 : 3,
          color: isDragon ? '#f97316' : finalSplatterColor,
        });

        // Roll materials drop based on monster strength! Beautiful crafting resource supply loop!
        const materialRewards = Object.keys(prev.inventoryMaterials).filter(k => k !== 'mat_wood' && k !== 'mat_raw_meat' && k !== 'mat_cooked_meat');
        const rolledGiftMat = materialRewards[Math.floor(Math.random() * materialRewards.length)];

        // Armor/Weapon random equipment drop chance! (Guaranteed 100% on bosses, 60% on dragons, 22% otherwise, boosted by Luck!)
        const droppedEquip: EquipmentItem[] = [];
        const effectiveLck = getEffectiveAttribute(prev, 'lck');
        const luckBonus = Math.max(0, effectiveLck - 10) * (gameConfig.worldRates?.equipmentDropRateBonusPerLuck ?? 0.03);
        const finalDropChance = Math.min(0.85, 0.22 + luckBonus);
        if (!isAnimal && (isBoss || isDragon || Math.random() < finalDropChance)) {
          droppedEquip.push(generateRandomLootGear(isBoss, isDragon, updatedEnemy.name));
        }

        let bossMats = [rolledGiftMat];
        let bossCats = (!isAnimal && Math.random() > 0.65) ? [['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'][Math.floor(Math.random() * 5)]] : [];

        let goblinMats: string[] = [];
        let goblinCats: string[] = [];
        if (isLootGoblin) {
          if (updatedEnemy.name.toLowerCase().includes('honey')) {
            goblinMats = ['mat_cooked_fish', 'mat_cooked_prime_meat', 'mat_prime_meat'];
            goblinCats = ['cat_fire'];
          } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
            goblinMats = ['mat_obsidian', 'mat_mithril'];
            goblinCats = ['cat_fire', 'cat_frost', 'cat_lightning', 'cat_shadow'];
          } else {
            const dropMats = ['mat_iron', 'mat_steel', 'mat_mithril', 'mat_obsidian'];
            const dropCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
            goblinMats = [
              dropMats[Math.floor(Math.random() * dropMats.length)],
              dropMats[Math.floor(Math.random() * dropMats.length)],
              dropMats[Math.floor(Math.random() * dropMats.length)],
            ];
            goblinCats = [
              dropCats[Math.floor(Math.random() * dropCats.length)],
              dropCats[Math.floor(Math.random() * dropCats.length)],
            ];
          }
        }

        if (isBoss) {
          // Guaranteed rich double legendary component items
          const legendaryMats = ['mat_obsidian', 'mat_shadow_fabric', 'mat_dragon_scale', 'mat_void_shard', 'mat_royal_iron'];
          const m1 = legendaryMats[Math.floor(Math.random() * legendaryMats.length)] === 'mat_dragon_scale' ? 'mat_dragonscale' : legendaryMats[Math.floor(Math.random() * legendaryMats.length)];
          const m2 = legendaryMats[(Math.floor(Math.random() * (legendaryMats.length - 1)) + 1) % legendaryMats.length] === 'mat_dragon_scale' ? 'mat_dragonscale' : 'mat_obsidian';
          bossMats = [m1, m2];

          // Guaranteed double dynamic elemental modifiers
          const allCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
          const c1 = allCats[Math.floor(Math.random() * allCats.length)];
          const c2 = allCats[(Math.floor(Math.random() * (allCats.length - 1)) + 1) % allCats.length];
          bossCats = [c1, c2];
        }

        let animalMats = ['mat_raw_meat'];
        let animalMsg = `🥩 You hunted down ${enemy.name}! Gained +${gainedXp} XP and dropped Raw Meat. Collect it!`;
        const lowercaseEnemyName = enemy.name.toLowerCase();
        const isWildlife = lowercaseEnemyName.includes("deer") || lowercaseEnemyName.includes("boar") || lowercaseEnemyName.includes("goat") || enemy.type === EnemyType.WildlifeDeer || enemy.type === EnemyType.WildlifeBoar || enemy.type === EnemyType.WildlifeGoat;

        if (isAnimal && isWildlife) {
          // Drops Prime Meat and Thick Hide!
          animalMats = ['mat_prime_meat', 'mat_thick_hide'];
          animalMsg = `🥩 You hunted down a magnificent ${enemy.name}! Gained +${gainedXp} XP and dropped Prime Wild Meat and Thick Wildlife Hide. Collect it!`;
        }

        const isBloodMoon = prev.bloodMoonTurnsLeft !== undefined && prev.bloodMoonTurnsLeft > 0;
        
        // Dragon Specialized Loot: guaranteed Elder Dragon Scale (mat_dragonscale) and a high-tier random elemental catalyst
        const dragonCatalysts = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
        const randomDragonCatalyst = dragonCatalysts[Math.floor(Math.random() * dragonCatalysts.length)];
        
        let finalMats = isAnimal ? animalMats : (isLootGoblin ? goblinMats : (isDragon ? ['mat_dragonscale', 'mat_obsidian'] : bossMats));
        let finalCats = isLootGoblin ? goblinCats : (isDragon ? [randomDragonCatalyst] : bossCats);

        if (updatedEnemy.type === EnemyType.Hiisi) {
          finalMats = ['mat_wood', 'mat_iron'];
          finalCats = ['cat_poison'];
        } else if (updatedEnemy.type === EnemyType.Nakki) {
          finalMats = ['mat_iron', 'mat_feybone'];
          finalCats = ['cat_frost'];
        } else if (updatedEnemy.type === EnemyType.Otso) {
          finalMats = ['mat_prime_meat', 'mat_thick_hide', 'mat_obsidian'];
          finalCats = ['cat_fire', 'cat_lightning'];
        } else if (updatedEnemy.type === EnemyType.Louhi) {
          finalMats = ['mat_obsidian', 'mat_mithril', 'mat_feybone'];
          finalCats = ['cat_frost', 'cat_shadow'];
        }

        if (updatedEnemy.id?.startsWith('wt_commander_') || updatedEnemy.name?.toLowerCase().includes('watchtower commander') || updatedEnemy.name?.toLowerCase().includes('watchtower overlord') || updatedEnemy.name?.toLowerCase().includes('outpost commander')) {
          finalMats = [...finalMats, 'mat_watchtower_key'];
          updatedLogs.push({
            id: `wt_key_${Date.now()}`,
            text: `🔑 [KEY DROPPED]: ${updatedEnemy.name} dropped the Faction Watchtower Key! Collect the Loot Pile to claim it!`,
            type: 'loot',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }

        if (isBloodMoon && finalCats.length > 0) {
          finalCats = [...finalCats, ...finalCats]; // Double catalyst drops!
        }

        const newLootPile: LootPile = {
          id: `loot_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          gold: isAnimal ? 0 : (isLootGoblin ? Math.floor(Math.random() * 80) + 50 : goldVal),
          materials: finalMats,
          catalysts: finalCats,
          equipment: droppedEquip
        };

        // Remove dead enemy from array with index-safety check
        const currentPrimaryIndexForSplice = nextEnemies.findIndex((e) => e.id === enemy.id);
        if (currentPrimaryIndexForSplice !== -1) {
          nextEnemies.splice(currentPrimaryIndexForSplice, 1);
        }
        if (isAnimal) {
          addLogMessage(animalMsg, 'loot');
        } else if (isLootGoblin) {
          if (updatedEnemy.name.toLowerCase().includes('honey')) {
            addLogMessage(`🐗 [HONEY BOAR SLAIN]: With a satisfied squeal, Mielikki's Honey-Glazed Boar collapses, dropping honey-infused steaks, campfire fish, and high-quality gold! (+${gainedXp} XP)`, 'loot');
          } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
            addLogMessage(`✧ [ALCHEMICAL SPRITE HARVESTED]: The Alchemical Sprite pops in a burst of sparkling lights, releasing its full catalyst cargo onto the ground! (+${gainedXp} XP)`, 'loot');
          } else {
            addLogMessage(`🧚 [LOOT GOBLIN VANISHED]: With a panicked squeal, the Alchemical Loot Goblin dissolves in a puff of glittering stardust! It dropped its full inventory stash on the ground! (+${gainedXp} XP)`, 'loot');
          }
        } else if (isBoss) {
          addLogMessage(`👑 BOSS VANQUISHED! You have slain ${enemy.name}! The chamber trembles as ancient heirloom treasures spill onto the tile! (+${gainedXp} XP)`, 'danger');
        } else if (isDragon) {
          addLogMessage(`🐉 DRAGON SLAIN! You have vanquished the legendary ${enemy.name}! Hardened volcanic scales and hoarded gold scatter onto the ground! (+${gainedXp} XP)`, 'danger');
        } else {
          addLogMessage(`💀 You struck down ${enemy.name}! It dropped a shimmering Loot Pile ✦ on the ground! (+${gainedXp} XP)`, 'loot');
        }
        nextLootPiles.push(newLootPile);
      } else {
        // Still alive, modify coordinates and current health status with index-safety check
        const currentPrimaryIndexForUpdate = nextEnemies.findIndex((e) => e.id === enemy.id);
        if (currentPrimaryIndexForUpdate !== -1) {
          nextEnemies[currentPrimaryIndexForUpdate] = updatedEnemy;
        }

        if (isLootGoblin) {
          let rolledMat = 'mat_iron';
          let rolledCat = 'cat_fire';
          let customMsg = '';

          if (updatedEnemy.name.toLowerCase().includes('honey')) {
            rolledMat = Math.random() > 0.5 ? 'mat_cooked_fish' : 'mat_cooked_prime_meat';
            rolledCat = 'cat_fire';
            customMsg = `🐗 [HONEY BOAR HIT]: Hitting the Honey-Glazed Boar causes it to drop a warm ${rolledMat.replace('mat_', '').toUpperCase().replace('COOKED_', 'COOKED ')}!`;
          } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
            rolledMat = Math.random() > 0.5 ? 'mat_obsidian' : 'mat_mithril';
            rolledCat = ['cat_fire', 'cat_frost', 'cat_lightning', 'cat_shadow'][Math.floor(Math.random() * 4)];
            customMsg = `✧ [ALCHEMICAL SPRITE HIT]: Hitting the Alchemical Sprite causes a magical discharge, leaving behind 1x ${rolledMat.replace('mat_', '').toUpperCase()} and 1x ${rolledCat.replace('cat_', '').toUpperCase()} Catalyst!`;
          } else {
            const dropMats = ['mat_iron', 'mat_steel', 'mat_mithril', 'mat_obsidian'];
            const dropCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
            rolledMat = dropMats[Math.floor(Math.random() * dropMats.length)];
            rolledCat = dropCats[Math.floor(Math.random() * dropCats.length)];
            customMsg = `🧚 [LOOT GOBLIN HIT]: Hitting the Alchemical Loot Goblin causes it to panic and drop 1x ${rolledMat.replace('mat_', '').toUpperCase()} and 1x ${rolledCat.replace('cat_', '').toUpperCase()} Catalyst!`;
          }
          
          nextLootPiles.push({
            id: `goblin_hit_${Date.now()}_${Math.random()}`,
            x: updatedEnemy.x,
            y: updatedEnemy.y,
            gold: Math.floor(Math.random() * 20) + 15,
            materials: [rolledMat],
            catalysts: [rolledCat],
            equipment: []
          });
          
          addLogMessage(customMsg, 'loot');
          
          // Trigger visual hit effect
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: updatedEnemy.x, y: updatedEnemy.y, text: `✨ SPLASH!`, type: 'heal' },
          });
          window.dispatchEvent(ev);
        }

        // Spawn interactive hit splatter
        nextSplatters.push({
          id: `splatter_dmg_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          intensity: Math.random() > 0.5 ? 2 : 1,
          color: finalSplatterColor,
        });
      }

      // Roll level up calculations
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
        addLogMessage(`🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`, 'craft');
        
        setTimeout(() => {
          playSound('levelUp');
        }, 120);

        setTimeout(() => {
          setGameState(current => {
            const currentRelics = current.playerStats.relics || [];
            const draft = getRandomRelicDraft(3, currentRelics);
            setActiveRelicDraft(draft);
            return current;
          });
        }, 300);
      }

      // Check durability decay on primary weapon
      let nextWeapon = prev.currentWeapon;
      if (nextWeapon) {
        const curDur = nextWeapon.durability ?? 100;
        const maxD = nextWeapon.maxDurability ?? 100;
        const decayAmt = getItemDurabilityDecay(nextWeapon, 1);
        const nextDur = Math.max(0, curDur - decayAmt);
        if (nextDur === 0 && curDur > 0) {
          if (isToolItem(nextWeapon, 'hatchet') || isToolItem(nextWeapon, 'pickaxe') || (nextWeapon as any).isTool) {
            addLogMessage(`💥 TOOL BROKE: Your ${nextWeapon.name} broke into pieces from heavy wear and was destroyed! [Craft a new tool in Crafting -> Survival]`, 'danger');
            nextWeapon = null;
          } else {
            nextWeapon = { ...nextWeapon, durability: nextDur, maxDurability: maxD };
            addLogMessage(`⚠️ WARNING: Your Right Hand item [${nextWeapon.name}] has broken! Its damage drops to 1! Repair it at the Town Blacksmith!`, 'danger');
          }
        } else {
          nextWeapon = { ...nextWeapon, durability: nextDur, maxDurability: maxD };
        }
      }

      // Check durability decay on equipped offhand shield/weapon
      let nextShield = prev.equippedShield;
      if (nextShield) {
        if (nextShield.type === 'weapon' || isToolItem(nextShield, 'hatchet') || isToolItem(nextShield, 'pickaxe') || (nextShield as any).isTool) {
          const curDur = nextShield.durability ?? 100;
          const maxD = nextShield.maxDurability ?? 100;
          const decayAmt = getItemDurabilityDecay(nextShield, 1);
          const nextDur = Math.max(0, curDur - decayAmt);
          if (nextDur === 0 && curDur > 0) {
            if (isToolItem(nextShield, 'hatchet') || isToolItem(nextShield, 'pickaxe') || (nextShield as any).isTool) {
              addLogMessage(`💥 TOOL BROKE: Your ${nextShield.name} broke into pieces from heavy wear and was destroyed! [Craft a new tool in Crafting -> Survival]`, 'danger');
              nextShield = null;
            } else {
              nextShield = { ...nextShield, durability: nextDur, maxDurability: maxD };
              addLogMessage(`⚠️ WARNING: Your Left Hand weapon [${nextShield.name}] has broken! Its damage drops to 1! Repair it at the Town Blacksmith!`, 'danger');
            }
          } else {
            nextShield = { ...nextShield, durability: nextDur, maxDurability: maxD };
          }
        }
      }

      // Check Physical Exhaustion build-up from combat actions
      let nextExhaustion = prev.playerStats.exhaustion || 0;
      if (!isMagic && Math.random() < 0.25) {
        const vigorSaveChance = (stats.dex * 0.015) + (stats.str * 0.01);
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

      // Check Town Reputation penalty for assaulting town guards
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;
      
      if (enemy.isTownGuard) {
        let decrease = 25; // Base attack penalty
        if (updatedEnemy.hp <= 0) {
          decrease += 35; // Killing penalty
        }
        nextRep = Math.max(0, currentRep - decrease);
      }

      if (guardWasAttacked) {
        nextGuardsHostile = true;
      }

      let nextFactionReputation = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      if (enemy.faction === 'syndicate' || enemy.faction === 'vanguard' || enemy.faction === 'bandits' || enemy.faction === 'outlaw') {
        const repFaction = (enemy.faction === 'outlaw' || enemy.faction === 'bandits') ? 'bandits' : enemy.faction;
        const curFacRep = nextFactionReputation[repFaction] ?? 0;
        let decrease = 20;
        if (updatedEnemy.hp <= 0) {
          decrease += 30; // killing a faction guard drops reputation by another -30 (-50 total!)
        }
        const nextFacRep = Math.max(-100, curFacRep - decrease);
        nextFactionReputation[repFaction] = nextFacRep;
        
        updatedLogs.push({
          id: `faction_assault_${Date.now()}`,
          text: `⚠️ [REPUTATION FALLOUT]: Assaulting a member of the ${repFaction === 'syndicate' ? 'Moonshadow Syndicate' : (repFaction === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} reduced your standing by -${decrease}! (Standing: ${nextFacRep})`,
          type: 'danger',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      let nextFactionTerritories = prev.factionTerritories;
      if (updatedEnemy.hp <= 0 && prev.isOverworld) {
        const playerFaction = (prev.faction === 'syndicate' || prev.faction === 'vanguard') ? prev.faction : 'neutral';
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

      // Check tactical skirmish victory condition
      let nextCaravanTravel = prev.caravanTravel;
      if (nextCaravanTravel?.active && nextCaravanTravel.isTacticalCombat) {
        const hostilesAlive = nextEnemies.filter(e => !e.isFollower && !e.isTownGuard && e.hp > 0);
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

            nextCaravanTravel = {
              ...nextCaravanTravel,
              isTacticalCombat: false,
              rewardGold: nextCaravanTravel.rewardGold + bonusGold,
              currentEncounter: {
                ...curEnc,
                resolved: true,
                resultLog: `🏆 TACTICAL VICTORY! Slew all ambushers on the skirmish map! Hull HP preserved: ${nextCaravanTravel.wagonHp || 100}/${nextCaravanTravel.maxWagonHp || 100}`
              }
            };
          }
        }
      }

      return {
        ...prev,
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
          exhaustion: nextExhaustion,
        },
      };
    });

    return true; // turn used!
  }, [
    gameState,
    selectedSpellId,
    setGameState,
    addLogMessage,
    playSound,
    interactWithFollower,
    getCombatFlavorText,
    setActiveRelicDraft,
    gameConfig,
  ]);

  return {
    performPlayerAttack,
    getCombatFlavorText,
  };
}
