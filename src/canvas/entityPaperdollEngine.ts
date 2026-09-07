/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Direction, AnimationState } from './spriteAnimationManager';
import { EquipmentItem } from '../types';

export interface EntitySpriteMapping {
  row: number; // Row in master sprite atlas
  frameCount?: number; // default 4
  ticksPerFrame?: number; // default 8
  isLarge?: boolean; // 2x2 multi-tile boss or large mount
}

export interface PaperdollLayerConfig {
  slot: 'armor' | 'helmet' | 'weapon' | 'shield' | 'boots' | 'cloak';
  spriteRow: number;
  itemTypeMatch: string;
}

export const MONSTER_SPRITE_MAPPINGS: Record<string, EntitySpriteMapping> = {
  // Player
  '@': { row: 6, frameCount: 4, ticksPerFrame: 8 },
  'player': { row: 6, frameCount: 4, ticksPerFrame: 8 },

  // Standard monsters
  'S': { row: 7, frameCount: 4, ticksPerFrame: 10 }, // Skeleton
  'O': { row: 8, frameCount: 4, ticksPerFrame: 10 }, // Orc
  'Z': { row: 9, frameCount: 4, ticksPerFrame: 12 }, // Zombie
  'G': { row: 10, frameCount: 4, ticksPerFrame: 8 }, // Goblin
  'r': { row: 11, frameCount: 4, ticksPerFrame: 6 }, // Rat
  'B': { row: 12, frameCount: 4, ticksPerFrame: 9 }, // Bandit
  'T': { row: 13, frameCount: 4, ticksPerFrame: 10 }, // Troll
  'V': { row: 14, frameCount: 4, ticksPerFrame: 8 }, // Vampire
  's': { row: 15, frameCount: 4, ticksPerFrame: 8 }, // Spider
  'g': { row: 16, frameCount: 4, ticksPerFrame: 10 }, // Slime
  'N': { row: 17, frameCount: 4, ticksPerFrame: 10 }, // Necromancer
  'K': { row: 18, frameCount: 4, ticksPerFrame: 10 }, // Dread Knight
  'D': { row: 19, frameCount: 4, ticksPerFrame: 8, isLarge: true }, // Dragon Boss
  'W': { row: 20, frameCount: 4, ticksPerFrame: 7 }, // Worg / Wolf

  // Town & Neutral NPCs
  'M': { row: 21, frameCount: 4, ticksPerFrame: 10 }, // Merchant
  'Q': { row: 22, frameCount: 4, ticksPerFrame: 10 }, // Town Guard
  'A': { row: 23, frameCount: 4, ticksPerFrame: 12 }, // Apothecary
  'H': { row: 24, frameCount: 4, ticksPerFrame: 10 }, // Blacksmith / Hero
  'C': { row: 25, frameCount: 4, ticksPerFrame: 8 },  // Cat
};

export const PAPERDOLL_EQUIPMENT_SPRITES: Record<string, { sx: number; sy: number }> = {
  // Helmets
  'iron_helm': { sx: 0, sy: 26 },
  'steel_helm': { sx: 1, sy: 26 },
  'mithril_crown': { sx: 2, sy: 26 },
  'leather_cap': { sx: 3, sy: 26 },
  'hood': { sx: 4, sy: 26 },

  // Body Armor
  'iron_plate': { sx: 0, sy: 27 },
  'steel_plate': { sx: 1, sy: 27 },
  'leather_tunic': { sx: 2, sy: 27 },
  'arcane_robe': { sx: 3, sy: 27 },
  'chainmail': { sx: 4, sy: 27 },

  // Weapons (R-Hand)
  'iron_sword': { sx: 0, sy: 28 },
  'steel_broadsword': { sx: 1, sy: 28 },
  'battleaxe': { sx: 2, sy: 28 },
  'hunting_bow': { sx: 3, sy: 28 },
  'magic_staff': { sx: 4, sy: 28 },
  'dagger': { sx: 5, sy: 28 },

  // Shields (L-Hand)
  'wooden_buckler': { sx: 0, sy: 29 },
  'iron_shield': { sx: 1, sy: 29 },
  'tower_shield': { sx: 2, sy: 29 },
  'arcane_tome': { sx: 3, sy: 29 },

  // Boots
  'leather_boots': { sx: 0, sy: 30 },
  'iron_greaves': { sx: 1, sy: 30 },
  'swift_sandals': { sx: 2, sy: 30 },
};

export class EntityPaperdollEngine {
  private static instance: EntityPaperdollEngine;

  public static getInstance(): EntityPaperdollEngine {
    if (!EntityPaperdollEngine.instance) {
      EntityPaperdollEngine.instance = new EntityPaperdollEngine();
    }
    return EntityPaperdollEngine.instance;
  }

  /**
   * Resolves paperdoll sprite layers matching player equipped items
   */
  public getPaperdollLayers(equipment: {
    helmet?: EquipmentItem | null;
    armor?: EquipmentItem | null;
    weapon?: EquipmentItem | null;
    shield?: EquipmentItem | null;
    boots?: EquipmentItem | null;
  }): Array<{ slot: string; spriteCoords: { sx: number; sy: number }; name: string }> {
    const layers: Array<{ slot: string; spriteCoords: { sx: number; sy: number }; name: string }> = [];

    // 1. Armor / Tunic (base body layer)
    if (equipment.armor) {
      const match = this.matchPaperdollKey(equipment.armor.id || equipment.armor.name);
      if (match) layers.push({ slot: 'armor', spriteCoords: match, name: equipment.armor.name });
    }

    // 2. Boots
    if (equipment.boots) {
      const match = this.matchPaperdollKey(equipment.boots.id || equipment.boots.name);
      if (match) layers.push({ slot: 'boots', spriteCoords: match, name: equipment.boots.name });
    }

    // 3. Helmet / Hood
    if (equipment.helmet) {
      const match = this.matchPaperdollKey(equipment.helmet.id || equipment.helmet.name);
      if (match) layers.push({ slot: 'helmet', spriteCoords: match, name: equipment.helmet.name });
    }

    // 4. Weapon (Right Hand)
    if (equipment.weapon) {
      const match = this.matchPaperdollKey(equipment.weapon.id || equipment.weapon.name);
      if (match) layers.push({ slot: 'weapon', spriteCoords: match, name: equipment.weapon.name });
    }

    // 5. Shield (Left Hand)
    if (equipment.shield) {
      const match = this.matchPaperdollKey(equipment.shield.id || equipment.shield.name);
      if (match) layers.push({ slot: 'shield', spriteCoords: match, name: equipment.shield.name });
    }

    return layers;
  }

  private matchPaperdollKey(rawNameOrId: string): { sx: number; sy: number } | null {
    if (!rawNameOrId) return null;
    const lower = rawNameOrId.toLowerCase();

    for (const [key, coords] of Object.entries(PAPERDOLL_EQUIPMENT_SPRITES)) {
      if (lower.includes(key.replace('_', ' ')) || lower.includes(key)) {
        return coords;
      }
    }

    // Fallback keyword matching
    if (lower.includes('robe') || lower.includes('cloth')) return PAPERDOLL_EQUIPMENT_SPRITES['arcane_robe'];
    if (lower.includes('plate') || lower.includes('cuirass')) return PAPERDOLL_EQUIPMENT_SPRITES['iron_plate'];
    if (lower.includes('leather')) return PAPERDOLL_EQUIPMENT_SPRITES['leather_tunic'];
    if (lower.includes('bow')) return PAPERDOLL_EQUIPMENT_SPRITES['hunting_bow'];
    if (lower.includes('staff') || lower.includes('wand')) return PAPERDOLL_EQUIPMENT_SPRITES['magic_staff'];
    if (lower.includes('shield') || lower.includes('buckler')) return PAPERDOLL_EQUIPMENT_SPRITES['iron_shield'];
    if (lower.includes('helm') || lower.includes('crown')) return PAPERDOLL_EQUIPMENT_SPRITES['iron_helm'];
    if (lower.includes('sword') || lower.includes('blade')) return PAPERDOLL_EQUIPMENT_SPRITES['iron_sword'];
    if (lower.includes('axe')) return PAPERDOLL_EQUIPMENT_SPRITES['battleaxe'];
    if (lower.includes('dagger')) return PAPERDOLL_EQUIPMENT_SPRITES['dagger'];

    return null;
  }
}

export const entityPaperdollEngine = EntityPaperdollEngine.getInstance();
