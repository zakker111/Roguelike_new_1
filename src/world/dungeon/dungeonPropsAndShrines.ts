/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, DungeonProp } from '../../types';
import { generateDungeonDecorProps } from '../../utils/decorEngine';

export const SHRINE_TEMPLATES = [
  {
    id_prefix: 'forbidden_strength',
    char: '⛧',
    name: 'Shrine of Forbidden Strength',
    color: '#f87171',
    description: 'An obsidian pillar carved with bleeding runes. Pray to gain permanent +4 Strength, but suffer -15 HP and receive the Curse of Vulnerability (-5 Defense for 40 turns).'
  },
  {
    id_prefix: 'blind_oracle',
    char: '🔮',
    name: 'Shrine of the Blind Oracle',
    color: '#c084fc',
    description: 'A swirling void of deep cosmic purple. Touch to fully reveal the floor map and gain permanent +3 Intellect, but suffer Cursed Sight (-5 Attack and -15% Crit Chance for 45 turns).'
  },
  {
    id_prefix: 'blood_transfusion',
    char: '🧪',
    name: 'Shrine of Blood Transfusion',
    color: '#34d399',
    description: 'A bubbling font of dark jade ley-water. Offer blood to gain permanent +12 Max MP (mana is fully restored), but instantly drain -15 HP.'
  },
  {
    id_prefix: 'covetous_greed',
    char: '🏺',
    name: 'Altar of the Covetous Greed',
    color: '#facc15',
    description: 'A glowing brass urn of endless wealth. Claims a toll on your armor to grant +250 Gold instantly, but inflicts Cursed Weight (-2 Strength and -2 Dexterity for 30 turns).'
  },
  {
    id_prefix: 'reckless_berserker',
    char: '⚔️',
    name: 'Shrine of the Reckless Berserker',
    color: '#fb923c',
    description: 'A blood-spattered anvil of combat rage. Pray to permanently gain +15% Critical Strike Chance, but permanently sacrifices -20 Max HP.'
  },
  {
    id_prefix: 'chrono_shift',
    char: '🌀',
    name: 'Altar of the Chrono-Shift',
    color: '#60a5fa',
    description: 'A twisting sapphire temporal vortex. Pray to permanently gain +3 Dexterity, but suffer +30 physical exhaustion points immediately.'
  }
];

export function generateDungeonProps(map: TileType[][], depth: number): DungeonProp[] {
  const propsList: DungeonProp[] = generateDungeonDecorProps(map, depth);
  const height = map.length;
  const width = map[0]?.length || 0;

  // Ensure exactly 2 unique double-edged shrines per dungeon floor
  const shuffledShrines = [...SHRINE_TEMPLATES].sort(() => 0.5 - Math.random());
  const shrinesToSpawn = shuffledShrines.slice(0, 2);

  let shrinesSpawned = 0;
  let shrineAttempts = 0;
  while (shrinesSpawned < shrinesToSpawn.length && shrineAttempts < 1000) {
    shrineAttempts++;
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    if (map[ry]?.[rx] === TileType.Floor) {
      const dup = propsList.some(p => p.x === rx && p.y === ry);
      if (!dup) {
        const s = shrinesToSpawn[shrinesSpawned];
        propsList.push({
          id: `d_shrine_${s.id_prefix}_${Date.now()}_${Math.random()}`,
          x: rx,
          y: ry,
          char: s.char,
          name: s.name,
          color: s.color,
          description: s.description,
          type: 'shrine',
          actionLabel: 'Pray at Shrine',
          interaction: 'pray_shrine',
          isInteracted: false
        });
        shrinesSpawned++;
      }
    }
  }

  return propsList;
}
