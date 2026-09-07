/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FACTIONS_DATABASE, FACTIONS_MAP, normalizeFactionId } from '../data/factions';
import type {
  FactionDefinition,
  FactionDisposition,
  FactionId,
  FactionStandingInfo,
  FactionStandingTier,
} from './types';

/**
 * Faction Relationship Matrix
 * Provides O(1) pairwise lookup for faction dispositions, dynamic overrides,
 * player reputation standing calculations, and tactical skirmish target prioritization.
 */
export class FactionMatrix {
  private static instance: FactionMatrix;

  // Cached pairwise map: `${f1}:${f2}` -> FactionDisposition
  private matrixCache: Map<string, FactionDisposition> = new Map();

  // Dynamic overrides applied during runtime (e.g. diplomacy events or player actions)
  private dynamicOverrides: Map<string, FactionDisposition> = new Map();

  private constructor() {
    this.buildMatrix();
  }

  public static getInstance(): FactionMatrix {
    if (!FactionMatrix.instance) {
      FactionMatrix.instance = new FactionMatrix();
    }
    return FactionMatrix.instance;
  }

  /**
   * Initializes or rebuilds the pairwise disposition cache from static definitions
   */
  public buildMatrix(): void {
    this.matrixCache.clear();

    // Populate all configured default relationships
    for (const source of FACTIONS_DATABASE) {
      const sourceId = normalizeFactionId(source.id);
      
      // Default identity relationship: a faction is allied with itself
      this.matrixCache.set(`${sourceId}:${sourceId}`, 'allied');

      for (const [targetRawId, disposition] of Object.entries(source.defaultRelationships)) {
        const targetId = normalizeFactionId(targetRawId);
        this.matrixCache.set(`${sourceId}:${targetId}`, disposition);
      }
    }
  }

  /**
   * Gets the pairwise disposition between two factions.
   * Defaults to 'neutral' if unmapped, or 'allied' if identical.
   */
  public getDisposition(f1?: FactionId, f2?: FactionId): FactionDisposition {
    const norm1 = normalizeFactionId(f1);
    const norm2 = normalizeFactionId(f2);

    if (norm1 === norm2) {
      return norm1 === 'unaligned' ? 'neutral' : 'allied';
    }

    const key = `${norm1}:${norm2}`;

    // Check dynamic runtime overrides first
    if (this.dynamicOverrides.has(key)) {
      return this.dynamicOverrides.get(key)!;
    }

    // Check precomputed matrix cache
    if (this.matrixCache.has(key)) {
      return this.matrixCache.get(key)!;
    }

    // Check reverse pairwise key as fallback
    const reverseKey = `${norm2}:${norm1}`;
    if (this.matrixCache.has(reverseKey)) {
      return this.matrixCache.get(reverseKey)!;
    }

    // Default fallbacks
    if (norm1 === 'undead_scourge' || norm2 === 'undead_scourge') {
      return 'nemesis';
    }

    return 'neutral';
  }

  /**
   * Returns true if two factions will engage in combat on sight.
   */
  public isHostile(f1?: FactionId, f2?: FactionId): boolean {
    const disp = this.getDisposition(f1, f2);
    return disp === 'hostile' || disp === 'nemesis';
  }

  /**
   * Returns true if two factions are cooperative (will protect each other, share buffs).
   */
  public isAlliedOrFriendly(f1?: FactionId, f2?: FactionId): boolean {
    const disp = this.getDisposition(f1, f2);
    return disp === 'allied' || disp === 'friendly';
  }

  /**
   * Evaluates AI targeting priority for an entity picking between multiple rivals.
   * Higher score = higher priority target.
   */
  public getTargetPriority(
    attackerFaction?: FactionId,
    targetFaction?: FactionId,
    targetHpPercent: number = 1.0,
    isTargetPlayer: boolean = false,
    distance: number = 1
  ): number {
    const disp = this.getDisposition(attackerFaction, targetFaction);

    if (disp !== 'hostile' && disp !== 'nemesis') {
      return -1000; // Not a valid attack target
    }

    let priority = 100;

    // Nemesis hatred bonus
    if (disp === 'nemesis') {
      priority += 50;
    }

    // Proximity factor (closer targets are prioritized)
    priority += Math.max(0, 40 - distance * 5);

    // Wounded/Low HP target finish-off priority
    if (targetHpPercent < 0.35) {
      priority += 30;
    } else if (targetHpPercent < 0.6) {
      priority += 15;
    }

    // Player target bias modifier (slight natural threat)
    if (isTargetPlayer) {
      priority += 10;
    }

    return priority;
  }

  /**
   * Maps numerical reputation (-100 to 100) to a formal Standing Tier
   */
  public getStandingTier(score: number): FactionStandingTier {
    if (score <= -60) return 'Hated';
    if (score <= -20) return 'Unfriendly';
    if (score <= 19) return 'Neutral';
    if (score <= 59) return 'Friendly';
    if (score <= 89) return 'Honored';
    return 'Revered';
  }

  /**
   * Computes comprehensive standing details for a faction from player's reputation score
   */
  public getStandingInfo(factionId: FactionId, score: number = 0): FactionStandingInfo {
    const norm = normalizeFactionId(factionId);
    const def = FACTIONS_MAP[norm] || {
      id: norm,
      name: norm.toUpperCase(),
      shortName: norm,
      description: '',
      bannerEmoji: '🚩',
      primaryColor: '#64748b',
      secondaryColor: '#334155',
      alignment: 'neutral',
      preferredBiomes: [],
      enemyTypes: [],
      defaultRelationships: {},
      tactics: [],
      bountyLoot: { currency: 'Gold', rate: 1 },
      lore: '',
    };

    const clampedScore = Math.max(-100, Math.min(100, Math.round(score)));
    const tier = this.getStandingTier(clampedScore);

    let disposition: FactionDisposition = 'neutral';
    if (tier === 'Hated') disposition = 'nemesis';
    else if (tier === 'Unfriendly') disposition = 'unfriendly';
    else if (tier === 'Neutral') disposition = 'neutral';
    else if (tier === 'Friendly') disposition = 'friendly';
    else if (tier === 'Honored' || tier === 'Revered') disposition = 'allied';

    const perks: string[] = [];
    if (tier === 'Friendly' || tier === 'Honored' || tier === 'Revered') {
      perks.push('10% Merchant Price Discount in faction territories');
      perks.push('Safe passage through faction camps');
    }
    if (tier === 'Honored' || tier === 'Revered') {
      perks.push('Unlocked Elite Faction Blueprint Armory');
      perks.push('Access to Faction Safehouse beds & storages');
      perks.push('Patrolling guards assist you when attacked nearby');
    }
    if (tier === 'Revered') {
      perks.push('25% Merchant Price Discount');
      perks.push('Summon Faction Champion companion in battle');
      perks.push('Exempt from territorial travel tariffs');
    }
    if (tier === 'Hated') {
      perks.push('Guards and patrols attack relentlessly on sight');
      perks.push('High-bounty death squads track your wilderness movements');
    }

    return {
      factionId: norm,
      name: def.name,
      score: clampedScore,
      tier,
      disposition,
      perks,
      unlockedShops: tier !== 'Hated' && tier !== 'Unfriendly',
      unlockedSafehouse: tier === 'Honored' || tier === 'Revered',
    };
  }

  /**
   * Sets a dynamic runtime disposition override between two factions
   */
  public setOverride(f1: FactionId, f2: FactionId, disposition: FactionDisposition): void {
    const norm1 = normalizeFactionId(f1);
    const norm2 = normalizeFactionId(f2);
    this.dynamicOverrides.set(`${norm1}:${norm2}`, disposition);
    this.dynamicOverrides.set(`${norm2}:${norm1}`, disposition);
  }

  /**
   * Clears all dynamic overrides, restoring static defaults
   */
  public clearOverrides(): void {
    this.dynamicOverrides.clear();
  }

  /**
   * Resolves canonical faction ID and rank for an enemy or NPC given their type, name, and existing tags.
   */
  public resolveEntityFaction(
    type?: string,
    name?: string,
    explicitFaction?: string,
    explicitRank?: string
  ): { factionId: FactionId; factionRank: 'grunt' | 'scout' | 'soldier' | 'captain' | 'warlord' | 'shaman' | 'assassin' | 'champion' | 'leader' } {
    if (explicitFaction) {
      const norm = normalizeFactionId(explicitFaction);
      const rank = (explicitRank as any) || 'soldier';
      return { factionId: norm, factionRank: rank };
    }

    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();

    // 1. Vanguard
    if (t.includes('vanguard') || n.includes('vanguard') || n.includes('paladin') || n.includes('crusader')) {
      const rank = (n.includes('captain') || n.includes('commander')) ? 'captain' : (n.includes('knight') || n.includes('champion')) ? 'champion' : 'soldier';
      return { factionId: 'iron_vanguard', factionRank: rank };
    }

    // 2. Syndicate
    if (t.includes('syndicate') || n.includes('syndicate') || n.includes('shadow') || n.includes('assassin') || n.includes('nightblade')) {
      const rank = (n.includes('master') || n.includes('shadowmaster')) ? 'leader' : n.includes('assassin') ? 'assassin' : 'scout';
      return { factionId: 'shadow_syndicate', factionRank: rank };
    }

    // 3. Town Guard
    if (t.includes('guard') || n.includes('guard') || n.includes('sentry') || n.includes('militia') || n.includes('patrol')) {
      const rank = n.includes('captain') ? 'captain' : 'soldier';
      return { factionId: 'town_guard', factionRank: rank };
    }

    // 4. Outlaw Bandits
    if (t.includes('bandit') || t.includes('outlaw') || t.includes('trapmaster') || n.includes('bandit') || n.includes('outlaw') || n.includes('thief') || n.includes('marauder') || n.includes('cutthroat')) {
      const rank = n.includes('leader') || n.includes('chief') ? 'leader' : (n.includes('trap') || n.includes('archer')) ? 'scout' : 'soldier';
      return { factionId: 'outlaw_bandits', factionRank: rank };
    }

    // 5. Orc Clans & Goblins
    if (t.includes('orc') || t.includes('goblin') || t.includes('troll') || t.includes('hiisi') || n.includes('orc') || n.includes('goblin') || n.includes('troll') || n.includes('ogre') || n.includes('warlord')) {
      const rank = n.includes('warlord') || n.includes('chieftain') ? 'warlord' : (n.includes('shaman') || n.includes('witch')) ? 'shaman' : (n.includes('goblin') || n.includes('scavenger')) ? 'grunt' : 'soldier';
      return { factionId: 'orc_clans', factionRank: rank };
    }

    // 6. Undead Scourge
    if (t.includes('skeleton') || t.includes('zombie') || t.includes('ghost') || t.includes('wraith') || t.includes('lich') || t.includes('vampire') || t.includes('necromancer') || n.includes('skeleton') || n.includes('lich') || n.includes('crypt') || n.includes('undead') || n.includes('death')) {
      const rank = (n.includes('lich') || n.includes('necromancer')) ? 'leader' : (n.includes('mage') || n.includes('wraith')) ? 'shaman' : 'grunt';
      return { factionId: 'undead_scourge', factionRank: rank };
    }

    // 7. Ancient Guardians / Constructs
    if (t.includes('golem') || t.includes('automaton') || t.includes('sentinel') || n.includes('golem') || n.includes('automaton') || n.includes('aether')) {
      return { factionId: 'ancient_guardians', factionRank: 'champion' };
    }

    // 8. Wild Beasts
    if (t.includes('wolf') || t.includes('bear') || t.includes('spider') || t.includes('bat') || t.includes('slime') || t.includes('rat') || t.includes('boar') || n.includes('wolf') || n.includes('bear') || n.includes('spider') || n.includes('rat') || n.includes('slime')) {
      return { factionId: 'wild_beasts', factionRank: 'grunt' };
    }

    // 9. Passive Wildlife & Unaligned
    if (t.includes('deer') || t.includes('sheep') || t.includes('goat') || n.includes('deer') || n.includes('sheep') || n.includes('goat') || n.includes('villager') || n.includes('pilgrim')) {
      return { factionId: 'unaligned', factionRank: 'grunt' };
    }

    return { factionId: 'unaligned', factionRank: 'soldier' };
  }
}

// Convenience Singleton Exports
export const factionMatrix = FactionMatrix.getInstance();

export function getFactionDisposition(f1?: FactionId, f2?: FactionId): FactionDisposition {
  return factionMatrix.getDisposition(f1, f2);
}

export function isHostileBetween(f1?: FactionId, f2?: FactionId): boolean {
  return factionMatrix.isHostile(f1, f2);
}

export function isAlliedBetween(f1?: FactionId, f2?: FactionId): boolean {
  return factionMatrix.isAlliedOrFriendly(f1, f2);
}
