import { PlayerStats, EnemyAffix } from '../types';

export interface ThreatTierDetails {
  tier: number;
  title: string;
  badgeEmoji: string;
  statMultiplier: number;
  xpBonusPct: number;
  lootRarityBonusPct: number;
  affixChance: number;
  description: string;
  colorClass: string;
}

/**
 * Dynamically computes the World Threat Level based on player level, turns played,
 * dungeon depth, GM Chaos Matrix, and player-selected Ascension challenge bonuses.
 */
export function calculateWorldThreatTier(
  playerStats?: Partial<PlayerStats>,
  chaosScore: number = 20
): number {
  if (!playerStats) return 0;

  const levelFactor = Math.floor((playerStats.level - 1) / 2);
  const turnsFactor = Math.floor((playerStats.turnsPlayed || 0) / 180);
  const depthFactor = Math.floor((playerStats.depth || 0) / 2);
  const chaosFactor = Math.floor(chaosScore / 25);
  const customBonus = playerStats.customThreatBonus || 0;

  const totalTier = levelFactor + turnsFactor + depthFactor + chaosFactor + customBonus;
  return Math.max(0, totalTier);
}

/**
 * Returns UI metadata and combat modifiers for a given World Threat Tier.
 */
export function getThreatTierInfo(tier: number): ThreatTierDetails {
  if (tier <= 0) {
    return {
      tier: 0,
      title: 'Novice Horizon',
      badgeEmoji: '🌿',
      statMultiplier: 1.0,
      xpBonusPct: 0,
      lootRarityBonusPct: 0,
      affixChance: 0.0,
      description: 'Standard baseline realm threats. Balanced for early exploration.',
      colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
    };
  }

  if (tier === 1) {
    return {
      tier: 1,
      title: "Adventurer's Surge",
      badgeEmoji: '⚔️',
      statMultiplier: 1.15,
      xpBonusPct: 15,
      lootRarityBonusPct: 15,
      affixChance: 0.12,
      description: 'Hostile wildlife and monsters gain +15% stats. Minor chance for Corrupted Affixes.',
      colorClass: 'text-amber-400 border-amber-500/30 bg-amber-950/20'
    };
  }

  if (tier === 2) {
    return {
      tier: 2,
      title: "Veteran's Crucible",
      badgeEmoji: '🔥',
      statMultiplier: 1.30,
      xpBonusPct: 30,
      lootRarityBonusPct: 30,
      affixChance: 0.25,
      description: 'Monsters gain +30% stats and +10% armor penetration. 25% chance for Corrupted Affixes.',
      colorClass: 'text-orange-400 border-orange-500/30 bg-orange-950/20'
    };
  }

  if (tier === 3) {
    return {
      tier: 3,
      title: "Champion's Miasma",
      badgeEmoji: '⚡',
      statMultiplier: 1.50,
      xpBonusPct: 50,
      lootRarityBonusPct: 50,
      affixChance: 0.40,
      description: 'Monsters gain +50% stats, +20% armor penetration, and 40% chance for Corrupted Affixes.',
      colorClass: 'text-rose-400 border-rose-500/30 bg-rose-950/20'
    };
  }

  if (tier === 4) {
    return {
      tier: 4,
      title: "Master's Eclipse",
      badgeEmoji: '🌙',
      statMultiplier: 1.75,
      xpBonusPct: 75,
      lootRarityBonusPct: 75,
      affixChance: 0.60,
      description: 'Brutal realm corruption. +75% enemy stats, +30% armor penetration, 60% Affix chance.',
      colorClass: 'text-purple-400 border-purple-500/30 bg-purple-950/20'
    };
  }

  // Tier 5+
  const extraScaling = (tier - 5) * 0.25;
  return {
    tier,
    title: `Eclipse Ascension Tier ${tier}`,
    badgeEmoji: '👑',
    statMultiplier: 2.0 + extraScaling,
    xpBonusPct: 100 + Math.floor(extraScaling * 100),
    lootRarityBonusPct: 100 + Math.floor(extraScaling * 100),
    affixChance: Math.min(0.90, 0.75 + (tier - 5) * 0.05),
    description: `Apex challenge for legendary adventurers! +${Math.round((1.0 + extraScaling) * 100)}% enemy stats and guaranteed Mythic loot drops!`,
    colorClass: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/30'
  };
}

export interface AffixMeta {
  type: EnemyAffix;
  name: string;
  icon: string;
  color: string;
  shortDesc: string;
}

export function getAffixMeta(affix: EnemyAffix): AffixMeta {
  switch (affix) {
    case 'vampiric':
      return {
        type: 'vampiric',
        name: 'Vampiric',
        icon: '🧛',
        color: 'text-rose-400',
        shortDesc: 'Restores HP equal to 40% of damage dealt on strike.'
      };
    case 'shieldbreaker':
      return {
        type: 'shieldbreaker',
        name: 'Shieldbreaker',
        icon: '⚡',
        color: 'text-amber-400',
        shortDesc: 'Bypasses 50% of player armor defense.'
      };
    case 'venomous':
      return {
        type: 'venomous',
        name: 'Venomous',
        icon: '☠️',
        color: 'text-emerald-400',
        shortDesc: 'Inflicts stackable Poison DOT (3 dmg/turn for 3 turns).'
      };
    case 'thorns':
      return {
        type: 'thorns',
        name: 'Thorns',
        icon: '🛡️',
        color: 'text-yellow-400',
        shortDesc: 'Reflects 25% of physical melee damage back to player.'
      };
    case 'arcane_pulse':
      return {
        type: 'arcane_pulse',
        name: 'Arcane Pulse',
        icon: '🔮',
        color: 'text-cyan-400',
        shortDesc: 'Emits a 2-tile magic shockwave every 3 turns.'
      };
    case 'berserker':
      return {
        type: 'berserker',
        name: 'Berserker',
        icon: '🩸',
        color: 'text-red-500',
        shortDesc: 'Gains +50% ATK & +20% speed when below 50% HP.'
      };
    case 'phasing':
      return {
        type: 'phasing',
        name: 'Ethereal Phasing',
        icon: '👻',
        color: 'text-indigo-300',
        shortDesc: '25% chance to completely evade physical attacks.'
      };
  }
}
