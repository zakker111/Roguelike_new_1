/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EffectDefinition } from './types';

/**
 * Standard built-in effects catalog matching the engine specifications
 */
export const DEFAULT_EFFECTS: Record<string, EffectDefinition> = {
  poison: {
    id: 'poison',
    name: 'Poisoned',
    type: 'debuff',
    icon: '🤢',
    color: '#22c55e',
    description: 'Virulent toxin inflicting nature damage over time.',
    defaultDuration: 5,
    maxStacks: 5,
    stacking: 'stack_intensity',
    damagePerTurn: 3,
    damageType: 'poison',
    tags: ['dot', 'poison', 'nature'],
    onApplyLog: (name) => `☠️ ${name} has been poisoned!`,
    onTickLog: (name, val) => `🤢 ${name} suffers -${val} poison damage!`,
    onExpireLog: (name) => `✨ The venom in ${name}'s veins has faded.`,
  },
  burning: {
    id: 'burning',
    name: 'Burning',
    type: 'debuff',
    icon: '🔥',
    color: '#f97316',
    description: 'Engulfed in fiery embers scorching health each turn.',
    defaultDuration: 3,
    maxStacks: 3,
    stacking: 'refresh',
    damagePerTurn: 5,
    damageType: 'fire',
    tags: ['dot', 'fire', 'elemental'],
    onApplyLog: (name) => `🔥 ${name} catches on fire!`,
    onTickLog: (name, val) => `🔥 ${name} burns for -${val} fire damage!`,
    onExpireLog: (name) => `💨 The flames consuming ${name} have been extinguished.`,
  },
  bleeding: {
    id: 'bleeding',
    name: 'Bleeding',
    type: 'debuff',
    icon: '🩸',
    color: '#ef4444',
    description: 'Deep arterial laceration causing persistent physical damage.',
    defaultDuration: 4,
    maxStacks: 3,
    stacking: 'stack_intensity',
    damagePerTurn: 4,
    damageType: 'physical',
    tags: ['dot', 'physical', 'bleed'],
    onApplyLog: (name) => `🩸 ${name} begins bleeding profusely!`,
    onTickLog: (name, val) => `🩸 ${name} bleeds for -${val} physical damage!`,
    onExpireLog: (name) => `🩹 ${name}'s bleeding wound has clotted.`,
  },
  freezing: {
    id: 'freezing',
    name: 'Frozen',
    type: 'debuff',
    icon: '❄️',
    color: '#38bdf8',
    description: 'Encased in crystalline frost, entirely immobilizing the entity.',
    defaultDuration: 2,
    maxStacks: 1,
    stacking: 'refresh',
    damagePerTurn: 1,
    damageType: 'ice',
    inhibitions: {
      preventMovement: true,
      preventAttack: true,
      preventAbilities: true,
    },
    tags: ['crowd_control', 'ice', 'elemental', 'incapacitate'],
    onApplyLog: (name) => `❄️ ${name} is frozen solid in ice!`,
    onTickLog: (name) => `❄️ ${name} is encased in ice and unable to act!`,
    onExpireLog: (name) => `💧 The ice encasing ${name} thaws away.`,
  },
  stun: {
    id: 'stun',
    name: 'Stunned',
    type: 'debuff',
    icon: '💫',
    color: '#eab308',
    description: 'Violent concussion leaving the victim disoriented and unable to take actions.',
    defaultDuration: 1,
    maxStacks: 1,
    stacking: 'refresh',
    inhibitions: {
      preventMovement: true,
      preventAttack: true,
      preventAbilities: true,
      preventItemUse: true,
    },
    tags: ['crowd_control', 'stun', 'incapacitate'],
    onApplyLog: (name) => `💫 ${name} is stunned!`,
    onTickLog: (name) => `💫 ${name} reels from the concussive stun!`,
    onExpireLog: (name) => `🌟 ${name} recovers composure and shakes off the stun.`,
  },
  slow: {
    id: 'slow',
    name: 'Slowed',
    type: 'debuff',
    icon: '🕸️',
    color: '#a8a29e',
    description: 'Movements and reflexes hampered by viscous webbing or sluggish cold.',
    defaultDuration: 4,
    maxStacks: 2,
    stacking: 'refresh',
    statModifiers: {
      speed: 1, // +1 turn delay / half speed
      evasion: -10,
    },
    tags: ['debuff', 'movement', 'slow'],
    onApplyLog: (name) => `🕸️ ${name}'s movements become sluggish!`,
    onTickLog: (name) => `🕸️ ${name} is weighed down by slow.`,
    onExpireLog: (name) => `👟 ${name} breaks free from the sluggish slowdown.`,
  },
  shield: {
    id: 'shield',
    name: 'Aegis Shield',
    type: 'buff',
    icon: '🛡️',
    color: '#06b6d4',
    description: 'Spectral protective ward that absorbs incoming damage before health is lost.',
    defaultDuration: 10,
    maxStacks: 1,
    stacking: 'refresh',
    shieldAmount: 20,
    statModifiers: {
      def: 4,
    },
    tags: ['buff', 'defense', 'shield'],
    onApplyLog: (name) => `🛡️ An aegis barrier shimmers to life around ${name}!`,
    onTickLog: (name) => `🛡️ ${name}'s protective barrier holds strong.`,
    onExpireLog: (name) => `🛡️ ${name}'s aegis shield dissolves into thin air.`,
  },
  shielded: {
    id: 'shielded',
    name: 'Shielded Ward',
    type: 'buff',
    icon: '🛡️',
    color: '#06b6d4',
    description: 'Spectral protective ward that absorbs incoming damage before health is lost.',
    defaultDuration: 6,
    maxStacks: 1,
    stacking: 'refresh',
    shieldAmount: 20,
    statModifiers: {
      def: 4,
    },
    tags: ['buff', 'defense', 'shield'],
    onApplyLog: (name) => `🛡️ An aegis barrier shimmers to life around ${name}!`,
    onTickLog: (name) => `🛡️ ${name}'s protective barrier holds strong.`,
    onExpireLog: (name) => `🛡️ ${name}'s aegis shield dissolves into thin air.`,
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    type: 'buff',
    icon: '🌿',
    color: '#4ade80',
    description: 'Vital rejuvenation mending wounds and restoring health each turn.',
    defaultDuration: 6,
    maxStacks: 3,
    stacking: 'stack_intensity',
    healPerTurn: 4,
    tags: ['buff', 'healing', 'hot'],
    onApplyLog: (name) => `🌿 Soothing rejuvenating warmth flows into ${name}!`,
    onTickLog: (name, val) => `🌿 ${name} regenerates +${val} HP!`,
    onExpireLog: (name) => `🌿 The healing aura around ${name} dissipates.`,
  },
  weakened: {
    id: 'weakened',
    name: 'Weakened',
    type: 'debuff',
    icon: '💔',
    color: '#94a3b8',
    description: 'Drained of martial vigor, reducing damage dealt.',
    defaultDuration: 6,
    maxStacks: 1,
    stacking: 'refresh',
    statModifiers: {
      atk: -4,
    },
    tags: ['debuff', 'offense_reduction'],
    onApplyLog: (name) => `💔 ${name}'s combat strength is weakened!`,
    onExpireLog: (name) => `💪 ${name}'s strength returns to normal.`,
  },
  blessed: {
    id: 'blessed',
    name: 'Blessed Radiance',
    type: 'buff',
    icon: '✨',
    color: '#fbbf24',
    description: 'Sanctified glory bolstering attack strength and critical precision.',
    defaultDuration: 20,
    maxStacks: 1,
    stacking: 'refresh',
    statModifiers: {
      atk: 5,
      crit: 5,
    },
    tags: ['buff', 'holy', 'offense'],
    onApplyLog: (name) => `✨ Golden holy light surrounds ${name}!`,
    onExpireLog: (name) => `✨ ${name}'s blessed empowerment fades.`,
  },
  bloodlust: {
    id: 'bloodlust',
    name: 'Bloodlust',
    type: 'buff',
    icon: '🩸',
    color: '#dc2626',
    description: 'Frenzied battle trance granting bonus attack power and lethal critical chance.',
    defaultDuration: 8,
    maxStacks: 1,
    stacking: 'refresh',
    statModifiers: {
      atk: 4,
      crit: 15,
    },
    tags: ['buff', 'frenzy', 'offense'],
    onApplyLog: (name) => `🩸 ${name} enters an exhilarating bloodlust frenzy!`,
    onExpireLog: (name) => `🩸 ${name}'s battle rage subsides.`,
  },
  clarity: {
    id: 'clarity',
    name: 'Mind Clarity',
    type: 'buff',
    icon: '🔮',
    color: '#a855f7',
    description: 'Sharpened arcane perception enhancing luck and focus.',
    defaultDuration: 15,
    maxStacks: 1,
    stacking: 'refresh',
    statModifiers: {
      lck: 5,
      crit: 5,
    },
    tags: ['buff', 'magic', 'mind'],
    onApplyLog: (name) => `🔮 A tranquil focus settles over ${name}!`,
    onExpireLog: (name) => `🔮 ${name}'s mind clarity returns to normal.`,
  },
};

/**
 * Registry class managing all effect definitions
 */
export class EffectRegistry {
  private static instance: EffectRegistry;
  private registry: Map<string, EffectDefinition> = new Map();

  constructor() {
    this.loadDefaultEffects();
  }

  public static getInstance(): EffectRegistry {
    if (!EffectRegistry.instance) {
      EffectRegistry.instance = new EffectRegistry();
    }
    return EffectRegistry.instance;
  }

  public static resetInstance(): void {
    (EffectRegistry as any).instance = null;
  }

  public loadDefaultEffects(): void {
    this.registry.clear();
    for (const [id, def] of Object.entries(DEFAULT_EFFECTS)) {
      this.registry.set(id, { ...def });
    }
  }

  public register(def: EffectDefinition): void {
    this.registerEffect(def);
  }

  public registerEffect(def: EffectDefinition): void {
    this.registry.set(def.id, { ...def });
  }

  public get(id: string): EffectDefinition | undefined {
    return this.getEffect(id);
  }

  public getEffect(id: string): EffectDefinition | undefined {
    const def = this.registry.get(id);
    return def ? { ...def } : undefined;
  }

  public has(id: string): boolean {
    return this.hasEffect(id);
  }

  public hasEffect(id: string): boolean {
    return this.registry.has(id);
  }

  public getAll(): EffectDefinition[] {
    return this.getAllEffects();
  }

  public getAllEffects(): EffectDefinition[] {
    return Array.from(this.registry.values()).map((def) => ({ ...def }));
  }

  public clear(): void {
    this.registry.clear();
  }
}
