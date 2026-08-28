/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import worldHistoryData from './worldHistory.json';

// Core types for our immersive History and POI system
export interface LoreChapter {
  id: string;
  title: string;
  category: string;
  content: string;
  unlockedAt: string; // Dynamic info showing where the player found it
}

export interface POIBlueprint {
  type: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil';
  name: string;
  char: string;
  color: string;
  description: string;
  historySnippet: string;
  chapterId: string; // Unlocks this chapter in the History Log
}

export const WORLD_HISTORY_CHAPTERS: Record<string, { title: string; category: string; description: string; content: string }> = worldHistoryData.chapters;

export const POI_BLUEPRINTS: Record<string, POIBlueprint> = worldHistoryData.poiBlueprints as Record<string, POIBlueprint>;

/**
 * Dynamically returns a biome-aware, Finnish-lore-infused POI blueprint
 */
export function getPOIBlueprint(
  pType: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil',
  biome: string,
  prngVal: number
): POIBlueprint {
  if (biome === 'forest') {
    if (pType === 'shrine') {
      return {
        type: 'shrine',
        name: "Tapio's Evergreen Grove",
        char: '⛲',
        color: '#15803d',
        description: "A moss-draped wooden shrine dedicated to Tapio, the King of the Forest. The air hums with forest songs.",
        historySnippet: "Spruce bark tablet: 'Respect the forest, and Tapio's green cloak shall shield you from the dark.'",
        chapterId: 'tapio_realm'
      };
    } else {
      // monolith
      if (prngVal > 0.5) {
        return {
          type: 'monolith',
          name: "Väinämöinen's Rune Stone",
          char: '🗿',
          color: '#818cf8',
          description: "A monumental ancient stone inscribed with primeval runes. It vibrates with the Spell-Songs of the Eternal Bard.",
          historySnippet: "Copper glyphs: 'Out of a duck's egg, the sky was formed. Out of the song-weaver's voice, the world was born.'",
          chapterId: 'sunder_oakhaven'
        };
      } else {
        return {
          type: 'monolith',
          name: "Shattered Sampo Fragment",
          char: '✨',
          color: '#f59e0b',
          description: "A pulsating, geometric remnant of the legendary cosmic mill, half-buried in the soil, glowing with prosperity.",
          historySnippet: "Gold plating: 'The Sampo was forged to bring endless corn, salt, and gold, but was shattered into the sea.'",
          chapterId: 'kalevala_sampo'
        };
      }
    }
  } else if (biome === 'swamp') {
    if (pType === 'sunken_keep') {
      return {
        type: 'sunken_keep',
        name: "The Gates of Tuonela",
        char: '🏰',
        color: '#475569',
        description: "Dark, skeletal stone archways rising from the black swamp waters, resembling the threshold to the land of the dead.",
        historySnippet: "A chilling runic plaque: 'The black river of Tuonela flows forever. None cross unless they sing the spells of iron.'",
        chapterId: 'tuonela_river'
      };
    } else {
      // shrine
      return {
        type: 'shrine',
        name: "Vellamo's Healing Spring",
        char: '⛲',
        color: '#06b6d4',
        description: "A bubbling spring of pure water inside the murky swamp, blessed by Vellamo, the goddess of waves.",
        historySnippet: "Water-carved words: 'Wash your scars in Vellamo's foam. The waters of the deep carry the memories of the elven age.'",
        chapterId: 'elven_diaspora'
      };
    }
  } else if (biome === 'tundra') {
    if (pType === 'fossil') {
      return {
        type: 'fossil',
        name: "Ribs of Antero Vipunen",
        char: '🦴',
        color: '#f1f5f9',
        description: "Gigantic fossilized ribs rising from the frozen permafrost, belonging to the ancient giant sleeping beneath the soil.",
        historySnippet: "A metallic resonance: 'He who lies under the frozen earth holds three hundred words of power. Awake him, and Sunder shall shake.'",
        chapterId: 'titan_conflict'
      };
    } else {
      // monolith
      return {
        type: 'monolith',
        name: "Louhi's Frost Obelisk",
        char: '🗿',
        color: '#93c5fd',
        description: "A spire of pure black obsidian encrusted with blue glacier ice, marking the frosty power of Louhi, Mistress of Pohjola.",
        historySnippet: "Frozen text warns: 'From the Northland comes the cold that freezes the sun. Louhi commands the frost-giants to lock the sky.'",
        chapterId: 'louhi_shadow'
      };
    }
  } else {
    // desert
    if (pType === 'hearth') {
      return {
        type: 'hearth',
        name: "Forge of Ilmarinen",
        char: '🔥',
        color: '#f97316',
        description: "A massive obsidian forge anvil powered by deep volcanic vents, honoring the eternal smith who forged the heavens.",
        historySnippet: "Fiery inscription: 'I forged the sky-dome with no marks of tongs, and no signs of hammers. The steel must obey the fire.'",
        chapterId: 'ilmarinen_forge'
      };
    } else {
      // fossil
      return {
        type: 'fossil',
        name: "Ukko's Lightning Bolt",
        char: '⚡',
        color: '#eab308',
        description: "A calcified, crackling column of petrified lightning, struck down by Ukko the Sky-Father in the ancient dawn of time.",
        historySnippet: "A gold plate reads: 'Ukko's golden axe struck the basalt peaks, planting the first spark of iron and seed of fire.'",
        chapterId: 'ukko_fire'
      };
    }
  }
}
