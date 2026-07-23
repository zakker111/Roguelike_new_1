import { Scar, PlayerStats } from '../types';
import scarsJson from '../data/scars.json';

export interface ScarTemplate {
  name: string;
  description: string;
  icon: string;
  severity: 'Minor' | 'Major' | 'Grave' | 'Legendary';
  freshEffect: string;
  healedEffect: string;
  freshModifiers?: {
    hp?: number;
    maxHp?: number;
    mp?: number;
    maxMp?: number;
    atk?: number;
    def?: number;
    str?: number;
    dex?: number;
    int?: number;
    cha?: number;
    lck?: number;
  };
  healedModifiers?: {
    hp?: number;
    maxHp?: number;
    mp?: number;
    maxMp?: number;
    atk?: number;
    def?: number;
    str?: number;
    dex?: number;
    int?: number;
    cha?: number;
    lck?: number;
  };
}

export const SCAR_DATABASE: ScarTemplate[] = scarsJson as ScarTemplate[];


/**
 * Calculates a scar's status (Fresh/Healing vs. Healed/Old) based on how many turns have passed.
 */
export function getScarStatus(
  scar: Scar,
  currentTurnsPlayed: number
): { isFresh: boolean; statusLabel: string; effectDesc: string; modifiers: any } {
  const template = SCAR_DATABASE.find(t => t.name === scar.name);
  
  // A scar is fresh if it was acquired within the last 25 turns
  const turnsPassed = currentTurnsPlayed - scar.acquiredTurn;
  const isFresh = turnsPassed < 25;
  const turnsLeftToHeal = 25 - turnsPassed;

  if (!template) {
    return {
      isFresh,
      statusLabel: isFresh ? `Fresh (Healing - ${turnsLeftToHeal} turns left)` : "Healed (Old)",
      effectDesc: "A mysterious scar with unknown properties.",
      modifiers: {}
    };
  }

  return {
    isFresh,
    statusLabel: isFresh ? `Fresh (Healing - ${turnsLeftToHeal} turns left)` : "Healed (Old)",
    effectDesc: isFresh ? template.freshEffect : template.healedEffect,
    modifiers: isFresh ? (template.freshModifiers || {}) : (template.healedModifiers || {})
  };
}

/**
 * Calculates the player's effective stats on the fly by applying scar modifiers.
 */
export function getEffectiveStats(playerStats: PlayerStats): PlayerStats {
  const effective = { ...playerStats };
  if (!playerStats) return effective;
  
  const scars = playerStats.scars || [];
  const currentTurns = playerStats.turnsPlayed || 0;

  scars.forEach(scar => {
    const status = getScarStatus(scar, currentTurns);
    const mods = status.modifiers;

    if (mods) {
      if (mods.maxHp) effective.maxHp = Math.max(10, effective.maxHp + mods.maxHp);
      if (mods.maxMp) effective.maxMp = Math.max(0, effective.maxMp + mods.maxMp);
      if (mods.atk) effective.atk = Math.max(1, effective.atk + mods.atk);
      if (mods.def) effective.def = Math.max(0, effective.def + mods.def);
      if (mods.str) effective.str = Math.max(1, effective.str + mods.str);
      if (mods.dex) effective.dex = Math.max(1, effective.dex + mods.dex);
      if (mods.int) effective.int = Math.max(1, effective.int + mods.int);
      if (mods.cha) effective.cha = Math.max(1, effective.cha + mods.cha);
      if (mods.lck) effective.lck = Math.max(1, effective.lck + mods.lck);
    }
  });

  if (playerStats.hasCatLover) {
    effective.lck = (effective.lck || 0) + 10;
  }

  return effective;
}

/**
 * Evaluates whether a scar is gained based on damage taken and current HP.
 * Has check conditions to ensure scars happen on "critical" hits but "not often".
 * Returns the acquired Scar or null if none gained.
 */
export function evaluateScarAcquisition(
  dmgAmount: number,
  playerHp: number,
  maxHp: number,
  currentScars: Scar[],
  turn: number
): { scar: Scar; logText: string } | null {
  // Scars can happen if player takes:
  // 1) A hit dealing >= 12 HP (brutal damage) OR
  // 2) A hit that leaves player at low HP (< 35% of maxHp)
  const isHighDamage = dmgAmount >= 12;
  const isLowHp = playerHp > 0 && playerHp < maxHp * 0.35;

  if (!isHighDamage && !isLowHp) {
    return null;
  }

  // Base acquisition chance:
  // If high damage: 18% chance
  // If low HP: 12% chance
  // If both: 28% chance
  let chance = 0;
  if (isHighDamage) chance += 0.18;
  if (isLowHp) chance += 0.12;

  // Let luck represent some tiny variance
  if (Math.random() > chance) {
    return null;
  }

  // Filter out scars the player already has
  const existingNames = new Set(currentScars.map(s => s.name));
  const available = SCAR_DATABASE.filter(s => !existingNames.has(s.name));

  if (available.length === 0) {
    return null; // All possible scars already acquired!
  }

  // Determine severity tier based on how severe the blow was
  // If remaining health is very low or blow is massive, we can roll for Grave or Major scars
  const isExtreme = dmgAmount >= 18 || playerHp < maxHp * 0.15;
  let eligibleScars = available;

  if (isExtreme) {
    // Highly severe hits are eligible for any scars, including Grave & Legendary
    eligibleScars = available;
  } else {
    // Standard hits only produce Minor or Major scars
    eligibleScars = available.filter(s => s.severity === 'Minor' || s.severity === 'Major');
  }

  if (eligibleScars.length === 0) {
    eligibleScars = available.filter(s => s.severity === 'Minor' || s.severity === 'Major');
  }

  if (eligibleScars.length === 0) {
    eligibleScars = available; // fallback
  }

  const template = eligibleScars[Math.floor(Math.random() * eligibleScars.length)];

  const newScar: Scar = {
    id: `scar_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: template.name,
    description: template.description,
    icon: template.icon,
    severity: template.severity as any,
    acquiredTurn: turn
  };

  const logText = `🩹 NEW SCAR ACQUIRED: A fresh battle scar has formed [${newScar.name}] (${newScar.severity})! "${newScar.description}"`;

  return { scar: newScar, logText };
}
