/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatusCategory = 'buff' | 'debuff';

export interface StatusStatModifiers {
  atk?: number;
  def?: number;
  crit?: number;
  lck?: number;
  speed?: number;
}

export interface StatusEffectDefinition {
  id: string;
  name: string;
  type: StatusCategory;
  icon: string;
  color: string;
  description: string;
  defaultDuration: number;
  maxStacks?: number;
  damagePerTurn?: number;
  healPerTurn?: number;
  statModifiers?: StatusStatModifiers;
  preventsAction?: boolean; // E.g. Stun, Freeze
  onTickLog?: (entityName: string, damageOrHeal: number) => string;
  onApplyLog?: (entityName: string) => string;
  onExpireLog?: (entityName: string) => string;
}

/**
 * Authoritative Master Status Effect Registry Catalog
 */
export const STATUS_EFFECT_REGISTRY: Record<string, StatusEffectDefinition> = {
  poison: {
    id: 'poison',
    name: 'Poisoned',
    type: 'debuff',
    icon: '🤢',
    color: '#22c55e',
    description: 'Virulent venom sapping health each turn.',
    defaultDuration: 5,
    damagePerTurn: 3,
    onTickLog: (name, val) => `🤢 ${name} suffers -${val} toxic damage from poison!`,
    onApplyLog: (name) => `☠️ ${name} has been poisoned!`,
    onExpireLog: (name) => `✨ The venom in ${name}'s veins has faded.`,
  },
  bleeding: {
    id: 'bleeding',
    name: 'Bleeding',
    type: 'debuff',
    icon: '🩸',
    color: '#ef4444',
    description: 'Open wound hemorrhaging health upon movement and turns.',
    defaultDuration: 4,
    damagePerTurn: 4,
    onTickLog: (name, val) => `🩸 ${name} bleeds for -${val} damage!`,
    onApplyLog: (name) => `🩸 ${name} is bleeding profusely!`,
    onExpireLog: (name) => `🩹 ${name}'s bleeding has clotted.`,
  },
  burning: {
    id: 'burning',
    name: 'Burning',
    type: 'debuff',
    icon: '🔥',
    color: '#f97316',
    description: 'Intense flames scorching health each turn.',
    defaultDuration: 3,
    damagePerTurn: 5,
    onTickLog: (name, val) => `🔥 ${name} burns for -${val} fire damage!`,
    onApplyLog: (name) => `🔥 ${name} catches fire!`,
    onExpireLog: (name) => `💨 The flames on ${name} have been extinguished.`,
  },
  frozen: {
    id: 'frozen',
    name: 'Frozen',
    type: 'debuff',
    icon: '❄️',
    color: '#38bdf8',
    description: 'Encased in solid rime ice, preventing actions.',
    defaultDuration: 2,
    preventsAction: true,
    damagePerTurn: 1,
    onTickLog: (name) => `❄️ ${name} is frozen solid and cannot act!`,
    onApplyLog: (name) => `❄️ ${name} is frozen solid!`,
    onExpireLog: (name) => `💧 The ice encasing ${name} thaws away.`,
  },
  stunned: {
    id: 'stunned',
    name: 'Stunned',
    type: 'debuff',
    icon: '💫',
    color: '#eab308',
    description: 'Disoriented by concussive force, unable to act.',
    defaultDuration: 1,
    preventsAction: true,
    onTickLog: (name) => `💫 ${name} is stunned and reels from the impact!`,
    onApplyLog: (name) => `💫 ${name} has been stunned!`,
    onExpireLog: (name) => `🌟 ${name} shakes off the stun.`,
  },
  weakened: {
    id: 'weakened',
    name: 'Weakened',
    type: 'debuff',
    icon: '💔',
    color: '#94a3b8',
    description: 'Sap in strength, lowering attack power.',
    defaultDuration: 6,
    statModifiers: { atk: -4 },
    onApplyLog: (name) => `💔 ${name}'s attacks have been weakened!`,
    onExpireLog: (name) => `💪 ${name}'s vigor returns to normal.`,
  },
  blessed: {
    id: 'blessed',
    name: 'Blessed Radiance',
    type: 'buff',
    icon: '✨',
    color: '#fbbf24',
    description: 'Holy blessing empowering physical strikes.',
    defaultDuration: 25,
    statModifiers: { atk: 5, crit: 5 },
    onApplyLog: (name) => `✨ A golden aura surrounds ${name}!`,
    onExpireLog: (name) => `✨ ${name}'s divine blessing has expired.`,
  },
  shielded: {
    id: 'shielded',
    name: 'Aegis Shield',
    type: 'buff',
    icon: '🛡️',
    color: '#38bdf8',
    description: 'Spectral bulwark absorbing incoming blows.',
    defaultDuration: 20,
    statModifiers: { def: 6 },
    onApplyLog: (name) => `🛡️ An aegis barrier forms around ${name}!`,
    onExpireLog: (name) => `🛡️ ${name}'s aegis shield dissipates.`,
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    type: 'buff',
    icon: '🌿',
    color: '#4ade80',
    description: 'Restorative herbs gradually mending wounds each turn.',
    defaultDuration: 8,
    healPerTurn: 4,
    onTickLog: (name, val) => `🌿 ${name} regenerates +${val} HP!`,
    onApplyLog: (name) => `🌿 Soothing restorative energies flow into ${name}!`,
    onExpireLog: (name) => `🌿 The restorative regeneration fades from ${name}.`,
  },
  bloodlust: {
    id: 'bloodlust',
    name: 'Bloodlust',
    type: 'buff',
    icon: '🩸',
    color: '#dc2626',
    description: 'Frenzied battle surge maximizing critical chance.',
    defaultDuration: 10,
    statModifiers: { atk: 4, crit: 15 },
    onApplyLog: (name) => `🩸 ${name} enters a bloodlust frenzy!`,
    onExpireLog: (name) => `🩸 ${name}'s bloodlust frenzy subsides.`,
  },
  clarity: {
    id: 'clarity',
    name: 'Mind Clarity',
    type: 'buff',
    icon: '🔮',
    color: '#a855f7',
    description: 'Sharpened intellect enhancing luck and focus.',
    defaultDuration: 15,
    statModifiers: { lck: 5, crit: 5 },
    onApplyLog: (name) => `🔮 A tranquil focus settles over ${name}!`,
    onExpireLog: (name) => `🔮 The tranquil clarity dissolves.`,
  },
};

export function getStatusEffectDefinition(id: string): StatusEffectDefinition | undefined {
  return STATUS_EFFECT_REGISTRY[id];
}
