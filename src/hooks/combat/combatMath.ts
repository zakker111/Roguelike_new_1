import {
  GameState,
  Enemy,
  CraftedWeapon,
  WeaponBaseType,
  CatalystType,
  EnemyState
} from '../../types';
import { SPELLS, STARTING_WEAPON, Spell } from '../../utils/spellsAndEquipment';
import { getEffectiveStats } from '../../utils/scars';
import { calculateNetDamage } from '../../data/balance';
import {
  calculateArchetypeDamageAdjustment,
  checkBossPhaseEnrage
} from '../../utils/combatArchetypes';
import {
  hasEquippedTrait,
  isLunarBlessingActive
} from '../../utils/gameUtils';
import { WEATHER_EFFECTS } from '../../utils/weatherEngine';

export interface CombatHitResult {
  isMagic: boolean;
  activeSpell: Spell;
  spentMp: number;
  finalDmg: number;
  rollCrit: boolean;
  finalHit: number;
  comboTriggered: boolean;
  comboLog: string;
  comboEffectText: string;
  nextDebuffs: any[];
  archetypeAdjLog?: string;
  isPhased: boolean;
  thornsDmg: number;
}

export function calculatePlayerCombatHit(
  gameState: GameState,
  enemy: Enemy,
  selectedSpellId: string,
  addLogMessage: (msg: string, type?: string) => void,
  playSound: (sound: string) => void
): CombatHitResult | null {
  const weapon = gameState.currentWeapon || STARTING_WEAPON;
  const stats = getEffectiveStats(gameState.playerStats);

  const isMagic =
    weapon.baseType === WeaponBaseType.Staff || weapon.baseType === WeaponBaseType.Wand;
  const activeSpell = SPELLS.find((s) => s.id === selectedSpellId) || SPELLS[0];
  let finalManaCost = isMagic
    ? weapon.baseType === WeaponBaseType.Wand
      ? Math.max(2, activeSpell.manaCost - 1)
      : activeSpell.manaCost
    : 0;

  if (isMagic && stats.relics?.includes('mana_battery')) {
    finalManaCost = Math.max(1, finalManaCost - 3);
  }

  if (isMagic && stats.mp < finalManaCost) {
    addLogMessage(
      `❌ Magic casting with ${weapon.name} requires ${finalManaCost} Mana! Wait to restore Mana!`,
      'system'
    );
    playSound('bump');
    return null;
  }

  const spentMp = isMagic ? finalManaCost : 0;

  const isBroken = weapon.durability !== undefined && weapon.durability <= 0;
  const playerExhaustion = stats.exhaustion || 0;
  const exhaustionPenalty = (playerExhaustion / 100) * 0.15;

  let activeEffectsAtkBonus = 0;
  let activeEffectsCritBonus = 0;
  if (stats.activeEffects) {
    stats.activeEffects.forEach((eff) => {
      if (eff.statModifiers) {
        if (eff.statModifiers.atk) activeEffectsAtkBonus += eff.statModifiers.atk;
        if (eff.statModifiers.crit) activeEffectsCritBonus += eff.statModifiers.crit;
      }
    });
  }

  const factionCritBonus =
    gameState.factionTerritories?.['moonshadow_cove']?.controller === gameState.faction
      ? 0.05
      : 0;
  const finalCritChance = Math.max(
    0.01,
    weapon.critChance -
      exhaustionPenalty +
      (gameState.activeFoodBuff?.critBonus || 0) +
      activeEffectsCritBonus +
      factionCritBonus
  );
  const rollCrit = isBroken ? false : Math.random() < finalCritChance;
  if (playerExhaustion > 40 && !isBroken) {
    addLogMessage(
      `💤 [EXHAUSTED]: Physical fatigue (${playerExhaustion}% exhaustion) dampens your reflexes, reducing your critical strike chance to ${Math.round(
        finalCritChance * 100
      )}%!`,
      'info'
    );
  }

  let baseHit =
    (isBroken ? 1 : weapon.damage) +
    stats.atk +
    (gameState.activeFoodBuff?.atkBonus || 0) +
    activeEffectsAtkBonus;
  if (stats.relics?.includes('giants_blood')) {
    baseHit += 4;
  }
  if (hasEquippedTrait(gameState, 'WORG_FORCE')) {
    baseHit += 3;
  }

  if (
    gameState.equippedShield &&
    (gameState.equippedShield.type === 'weapon' || (gameState.equippedShield.damage ?? 0) > 0) &&
    gameState.equippedShield.subType !== 'Shield'
  ) {
    const offhandDmg = gameState.equippedShield.damage || 0;
    const offhandBonus = Math.max(1, Math.floor(offhandDmg * 0.5));
    baseHit += offhandBonus;
  }

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

  const playerDmgMult = (window as any).arenaPlayerDamageMultiplier || 1.0;
  baseHit = Math.round(baseHit * playerDmgMult);

  let critMult = 2.0;
  if (!isBroken && weapon.materialUsed?.extraProperty === 'CRIT_HEAVY' && rollCrit) {
    critMult = 2.5;
  }

  let finalHit = rollCrit ? Math.floor(baseHit * critMult) : baseHit;

  if (rollCrit && gameState.season === 'autumn') {
    finalHit = Math.floor(finalHit * 1.4);
    addLogMessage(
      `🍂 [AUTUMN STEALTH]: Shadow critical strikes from the amber mists deal +40% extra damage!`,
      'craft'
    );
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

  const catalyst = weapon.catalystUsed;
  if (
    gameState.season === 'summer' &&
    catalyst &&
    (catalyst.type === CatalystType.Lightning ||
      catalyst.id?.includes('lightning') ||
      catalyst.name?.includes('Lightning'))
  ) {
    finalHit = Math.floor(finalHit * 1.25);
    addLogMessage(
      `⚡ [SUMMER SUPERCHARGE]: Heatwaves supercharge your Lightning catalyst for +25% extra damage!`,
      'craft'
    );
  }

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

  let nextDebuffs = enemy.debuffs ? [...enemy.debuffs] : [];
  let comboDmgBonus = 0;
  let comboTriggered = false;
  let comboLog = '';
  let comboEffectText = '';

  if (isMagic) {
    if (
      activeSpell.id === 'frostbite_lance' &&
      nextDebuffs.some((d) => d.type === CatalystType.Lightning)
    ) {
      comboTriggered = true;
      comboDmgBonus = 25;
      nextDebuffs = nextDebuffs.filter((d) => d.type !== CatalystType.Lightning);
      comboLog = `❄️⚡ SPELL COMBO [SHATTER]: ${enemy.name} was Shocked, and your Frostbite Lance shattered the conductive ice! Deals +25 bonus damage!`;
      comboEffectText = `💥 SHATTER! +25`;
    } else if (
      activeSpell.id === 'chain_lightning' &&
      nextDebuffs.some((d) => d.type === CatalystType.Frost)
    ) {
      comboTriggered = true;
      comboDmgBonus = 25;
      nextDebuffs = nextDebuffs.filter((d) => d.type !== CatalystType.Frost);
      comboLog = `⚡❄️ SPELL COMBO [SHATTER]: ${enemy.name} was Frozen, and your Chain Lightning shattered the brittle frozen core! Deals +25 bonus damage!`;
      comboEffectText = `💥 SHATTER! +25`;
    } else if (
      activeSpell.id === 'pyroblast' &&
      nextDebuffs.some((d) => d.type === CatalystType.Frost)
    ) {
      comboTriggered = true;
      comboDmgBonus = 20;
      nextDebuffs = nextDebuffs.filter((d) => d.type !== CatalystType.Frost);
      comboLog = `🔥❄️ SPELL COMBO [MELT]: ${enemy.name} was Frozen, and your Pyroblast vaporized the ice in a burst of superheated steam! Deals +20 bonus damage!`;
      comboEffectText = `💧 STEAM BLAST! +20`;
    } else if (
      activeSpell.id === 'frostbite_lance' &&
      nextDebuffs.some((d) => d.type === CatalystType.Fire)
    ) {
      comboTriggered = true;
      comboDmgBonus = 20;
      nextDebuffs = nextDebuffs.filter((d) => d.type !== CatalystType.Fire);
      comboLog = `❄️🔥 SPELL COMBO [MELT]: ${enemy.name} was Burning, and your Frostbite Lance rapidly cooled the hot flesh causing severe thermal shock! Deals +20 bonus damage!`;
      comboEffectText = `💧 THERMAL SHOCK! +20`;
    } else if (
      activeSpell.id === 'pyroblast' &&
      nextDebuffs.some((d) => d.type === CatalystType.Poison)
    ) {
      comboTriggered = true;
      comboDmgBonus = 20;
      nextDebuffs = nextDebuffs.filter((d) => d.type !== CatalystType.Poison);
      comboLog = `🔥🧪 SPELL COMBO [COMBUSTION]: ${enemy.name} was Poisoned, and your Pyroblast ignited the noxious toxic fumes! Deals +20 bonus damage and triggers a gas burst!`;
      comboEffectText = `💥 COMBUSTION! +20`;
    } else if (
      activeSpell.id === 'void_siphon' &&
      nextDebuffs.some(
        (d) =>
          d.type === CatalystType.Fire ||
          d.type === CatalystType.Frost ||
          d.type === CatalystType.Poison ||
          d.type === CatalystType.Lightning
      )
    ) {
      comboTriggered = true;
      comboDmgBonus = 15;
      const targetDebuff = nextDebuffs.find(
        (d) =>
          d.type === CatalystType.Fire ||
          d.type === CatalystType.Frost ||
          d.type === CatalystType.Poison ||
          d.type === CatalystType.Lightning
      );
      if (targetDebuff) {
        nextDebuffs = nextDebuffs.filter((d) => d.type !== targetDebuff.type);
        comboLog = `🌌🔮 SPELL COMBO [VOID REAP]: Void Siphon consumed ${enemy.name}'s ${targetDebuff.type} affliction, tearing their lifeforce! Deals +15 bonus damage & restores +15 HP!`;
      } else {
        comboLog = `🌌🔮 SPELL COMBO [VOID REAP]: Void Siphon consumed ${enemy.name}'s affliction! Deals +15 bonus damage & restores +15 HP!`;
      }
      comboEffectText = `🌌 VOID REAP! +15`;
    }
  }

  let finalComboBonus = comboDmgBonus;
  if (comboTriggered && stats.relics?.includes('spell_weaver')) {
    finalComboBonus += 5;
  }

  const effectiveArmor = rollCrit ? Math.floor(enemy.def * 0.5) : enemy.def;
  const baseNetDamage = calculateNetDamage(finalHit, effectiveArmor);
  const minWeaponFloor = isBroken ? 1 : Math.max(2, Math.floor(((weapon.damage || 4) + (stats.atk || 0)) * 0.35));
  const rawDmg = Math.max(minWeaponFloor, baseNetDamage) + finalComboBonus;

  const archetypeAdj = calculateArchetypeDamageAdjustment(
    { archetype: 'glass_cannon', isCrit: rollCrit },
    { archetype: enemy.archetype, def: effectiveArmor },
    rawDmg
  );
  const finalDmg = archetypeAdj.damage;

  let isPhased = false;
  if (enemy.affixes?.includes('phasing') && Math.random() < 0.25) {
    isPhased = true;
  }

  let thornsDmg = 0;
  if (enemy.affixes?.includes('thorns') && finalDmg > 0 && !isMagic) {
    thornsDmg = Math.max(1, Math.floor(finalDmg * 0.25));
  }

  return {
    isMagic,
    activeSpell,
    spentMp,
    finalDmg,
    rollCrit,
    finalHit,
    comboTriggered,
    comboLog,
    comboEffectText,
    nextDebuffs,
    archetypeAdjLog: archetypeAdj.logNote,
    isPhased,
    thornsDmg
  };
}
