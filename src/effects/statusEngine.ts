/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerEffect } from '../types/entities';
import { getStatusEffectDefinition, StatusStatModifiers } from './statusEffectRegistry';

export interface ApplyStatusOptions {
  duration?: number;
  damagePerTurn?: number;
  healPerTurn?: number;
  statModifiers?: StatusStatModifiers;
}

/**
 * Creates or updates an active PlayerEffect from the central Status Effect Registry.
 */
export function createActiveStatus(id: string, options?: ApplyStatusOptions): PlayerEffect {
  const def = getStatusEffectDefinition(id);
  if (!def) {
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type: 'debuff',
      icon: '❓',
      description: 'Unknown status effect',
      turnsRemaining: options?.duration ?? 5,
      color: '#94a3b8',
      damagePerTurn: options?.damagePerTurn,
      healPerTurn: options?.healPerTurn,
      statModifiers: options?.statModifiers,
    };
  }

  return {
    id: def.id,
    name: def.name,
    type: def.type,
    icon: def.icon,
    color: def.color,
    description: def.description,
    turnsRemaining: options?.duration ?? def.defaultDuration,
    damagePerTurn: options?.damagePerTurn ?? def.damagePerTurn,
    healPerTurn: options?.healPerTurn ?? def.healPerTurn,
    statModifiers: options?.statModifiers ?? def.statModifiers,
  };
}

/**
 * Applies a status effect to an array of active effects. Replaces or refreshes existing effect duration.
 */
export function applyStatusToList(
  effects: PlayerEffect[] | undefined,
  effectId: string,
  options?: ApplyStatusOptions
): PlayerEffect[] {
  const list = effects ? [...effects] : [];
  const existingIdx = list.findIndex((e) => e.id === effectId);
  const newEffect = createActiveStatus(effectId, options);

  if (existingIdx >= 0) {
    list[existingIdx] = newEffect;
  } else {
    list.push(newEffect);
  }
  return list;
}

/**
 * Removes a specific status effect by ID.
 */
export function removeStatusFromList(effects: PlayerEffect[] | undefined, effectId: string): PlayerEffect[] {
  if (!effects) return [];
  return effects.filter((e) => e.id !== effectId);
}

/**
 * Checks whether an effect list has an active effect.
 */
export function hasStatusInList(effects: PlayerEffect[] | undefined, effectId: string): boolean {
  if (!effects) return false;
  return effects.some((e) => e.id === effectId && e.turnsRemaining > 0);
}

/**
 * Aggregates all stat modifiers across a list of active effects.
 */
export function aggregateStatusModifiers(effects: PlayerEffect[] | undefined): Required<StatusStatModifiers> {
  const res = { atk: 0, def: 0, crit: 0, lck: 0, speed: 0 };
  if (!effects) return res;

  for (const eff of effects) {
    if (eff.statModifiers) {
      if (eff.statModifiers.atk) res.atk += eff.statModifiers.atk;
      if (eff.statModifiers.def) res.def += eff.statModifiers.def;
      if (eff.statModifiers.crit) res.crit += eff.statModifiers.crit;
      if (eff.statModifiers.lck) res.lck += eff.statModifiers.lck;
    }
  }
  return res;
}
