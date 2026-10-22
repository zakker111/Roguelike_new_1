/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FactionId, OutpostQuartermasterState, OutpostQuartermasterItem } from '../../types/worldEvents';

export function createOutpostQuartermaster(
  chunkX: number,
  chunkY: number,
  faction: FactionId,
  defenseTier: 1 | 2 | 3 = 1,
  bountyGold: number = 200
): OutpostQuartermasterState {
  const npcId = `quartermaster_${chunkX}_${chunkY}`;

  let name = 'Frontier Quartermaster';
  let greeting = 'Welcome, traveler. Our supplies are open to those who respect our flag.';
  let items: OutpostQuartermasterItem[] = [];

  if (faction === 'vanguard') {
    name = 'Sir Valen, Vanguard Quartermaster';
    greeting = 'Hail, ally of the Dawn! The Vanguard stands vigilant. Inspect our military armaments.';
    items = [
      {
        id: 'qm_vanguard_shield',
        name: 'Vanguard Tower Shield',
        type: 'armor',
        costGold: 140 * defenseTier,
        icon: '🛡️',
        description: 'Reinforced tower shield bearing the sunburst crest. Grants +8 DEF and absorbs heavy blow knockbacks.',
        factionExclusive: 'vanguard',
        stock: 1,
        effectDescription: '+8 DEF, +10% Block Chance'
      },
      {
        id: 'qm_vanguard_plate',
        name: 'Crusader Steel Cuirass',
        type: 'armor',
        costGold: 180 * defenseTier,
        icon: '🥋',
        description: 'Hardened steel plate polished to a golden sheen. Sturdy protection for frontier combat.',
        factionExclusive: 'vanguard',
        stock: 1,
        effectDescription: '+12 DEF, -1 Speed'
      },
      {
        id: 'qm_vanguard_rations',
        name: 'Vanguard Iron Rations',
        type: 'consumable',
        costGold: 25,
        icon: '🍞',
        description: 'Dense field bread and cured salted meat. Restores 45 HP and clears physical fatigue.',
        stock: 5,
        effectDescription: 'Heals 45 HP, reduces exhaustion'
      },
      {
        id: 'qm_war_horn',
        name: 'Vanguard War Horn',
        type: 'consumable',
        costGold: 65,
        icon: '📯',
        description: 'Blow the war horn to rally nearby defenders and grant +4 ATK and +2 DEF for 30 turns.',
        stock: 2,
        effectDescription: '+4 ATK & +2 DEF for 30 turns'
      },
      {
        id: 'qm_field_bandages',
        name: 'Sterilized Field Bandages',
        type: 'consumable',
        costGold: 30,
        icon: '🩹',
        description: 'Clean linen bandages treated with soothing balm. Removes Bleed and recovers 30 HP.',
        stock: 4,
        effectDescription: 'Cures Bleeding, heals 30 HP'
      }
    ];
  } else if (faction === 'syndicate') {
    name = 'Vesper, Syndicate Quartermaster';
    greeting = 'Step into the shadows, friend. Everything has a price, and we deal only in silent advantages.';
    items = [
      {
        id: 'qm_syndicate_stiletto',
        name: 'Syndicate Serrated Stiletto',
        type: 'weapon',
        costGold: 150 * defenseTier,
        icon: '🗡️',
        description: 'Deadly poisoned stiletto. Inflicts deep lacerations and virulent venom on unarmored targets.',
        factionExclusive: 'syndicate',
        stock: 1,
        effectDescription: '+10 ATK, +15% Crit Chance, Poisons on hit'
      },
      {
        id: 'qm_syndicate_cowl',
        name: 'Shadow-Weave Cowl',
        type: 'armor',
        costGold: 130 * defenseTier,
        icon: '🥷',
        description: 'Midnight silk cowl masking face and breath. Enhances stealth evasion and critical strikes.',
        factionExclusive: 'syndicate',
        stock: 1,
        effectDescription: '+5 DEF, +12% Evasion, +5% Crit'
      },
      {
        id: 'qm_smoke_flask',
        name: 'Moonshadow Smoke Flask',
        type: 'consumable',
        costGold: 45,
        icon: '💨',
        description: 'Throw to generate an opaque cloud of obscuring smoke, baffling enemy line-of-sight for 8 turns.',
        stock: 3,
        effectDescription: 'Obscures vision, enables tactical retreat'
      },
      {
        id: 'qm_syndicate_poison',
        name: 'Concentrated Venom Vial',
        type: 'catalyst',
        costGold: 50,
        icon: '🧪',
        description: 'Potent serpent poison for infusing weapons or applying to blade tips.',
        stock: 3,
        effectDescription: 'Catalyst: Poison element weapon infusion'
      },
      {
        id: 'qm_lockpicks',
        name: 'Masterwork Lockpicks',
        type: 'material',
        costGold: 40,
        icon: '🗝️',
        description: 'Tempered steel picks capable of bypassing fortified outpost gates and tribute chests.',
        stock: 3,
        effectDescription: 'Unlocks locked outpost chests'
      }
    ];
  } else {
    // Neutral or Outlaw
    name = 'Garrick, Frontier Freebooter';
    greeting = 'No lords, no laws out here. If you have gold, we have iron. Watch your back.';
    items = [
      {
        id: 'qm_frontier_crossbow',
        name: 'Frontier Heavy Arbalest',
        type: 'weapon',
        costGold: 160 * defenseTier,
        icon: '🏹',
        description: 'High-torque hunting arbalest capable of punching through knight plate from 6 tiles away.',
        stock: 1,
        effectDescription: '+11 ATK, Range 6'
      },
      {
        id: 'qm_raider_jerkin',
        name: 'Reinforced Raider Jerkin',
        type: 'armor',
        costGold: 120 * defenseTier,
        icon: '🥋',
        description: 'Layered boiled leather studded with iron rivets. Lightweight and resilient.',
        stock: 1,
        effectDescription: '+7 DEF, +5% Evasion'
      },
      {
        id: 'qm_dried_jerky',
        name: 'Spiced Frontier Jerky',
        type: 'consumable',
        costGold: 20,
        icon: '🥩',
        description: 'Heavily peppered jerky. Fills the stomach and restores 35 HP on the road.',
        stock: 6,
        effectDescription: 'Heals 35 HP'
      },
      {
        id: 'qm_caltrops',
        name: 'Spiked Steel Caltrops',
        type: 'consumable',
        costGold: 35,
        icon: '⛓️',
        description: 'Scatter sharp caltrops on a ground tile to puncture approaching foes for 20 damage and slow them.',
        stock: 4,
        effectDescription: 'Area hazard: 20 dmg + Slow'
      }
    ];
  }

  return {
    npcId,
    name,
    factionId: faction,
    items,
    restCostGold: 20 * defenseTier,
    restAvailable: true,
    bountyClaimAvailable: false,
    bountyRewardGold: bountyGold,
    dialogueGreeting: greeting
  };
}

/**
 * Calculates adjusted price based on player faction standing
 */
export function getQuartermasterPrice(
  basePrice: number,
  faction: FactionId,
  playerStanding: number = 0
): { price: number; discountPercent: number; isRefused: boolean } {
  if (playerStanding <= -50) {
    return { price: basePrice * 2, discountPercent: -100, isRefused: true };
  }
  if (playerStanding >= 60) {
    // Revered / Allied
    return { price: Math.max(1, Math.round(basePrice * 0.75)), discountPercent: 25, isRefused: false };
  }
  if (playerStanding >= 25) {
    // Friendly
    return { price: Math.max(1, Math.round(basePrice * 0.9)), discountPercent: 10, isRefused: false };
  }
  if (playerStanding <= -20) {
    // Unfriendly
    return { price: Math.round(basePrice * 1.25), discountPercent: -25, isRefused: false };
  }
  return { price: basePrice, discountPercent: 0, isRefused: false };
}

/**
 * Calculates standing discount percentage (0 to 0.35)
 */
export function calculateStandingDiscount(standing: number = 0): number {
  if (standing >= 75) return 0.35;
  if (standing >= 50) return 0.20;
  if (standing >= 25) return 0.10;
  return 0;
}

/**
 * Fully rests the player in the garrison barracks, clearing exhaustion and restoring HP/MP
 */
export function restInBarracks<T extends { playerStats: any }>(state: T): T {
  const maxHp = state.playerStats.maxHp;
  const maxMp = state.playerStats.maxMp;
  const existingEffects = state.playerStats.activeEffects || [];
  const buffEffect = {
    id: 'buff_barracks_rest',
    name: 'Frontier Bastion Fortified',
    duration: 120,
    statModifiers: { def: 4 }
  };
  const filtered = existingEffects.filter((e: any) => e.id !== 'buff_barracks_rest');
  filtered.push(buffEffect as any);

  return {
    ...state,
    playerStats: {
      ...state.playerStats,
      hp: maxHp,
      mp: maxMp,
      exhaustion: 0,
      activeEffects: filtered
    }
  };
}
