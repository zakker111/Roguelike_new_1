/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Initializes global runtime registries for custom modifiable components (enemies, houses) on window.
 */
export function initCustomRegistries(): void {
  if (typeof window === 'undefined') return;

  if (!(window as any).customEnemies) {
    (window as any).customEnemies = [
      { type: 'Rat', name: "Giant Plague Rat", baseHp: 6, baseAtk: 1, baseDef: 0, range: 1, speed: 1.0, char: "r", color: "#a1a1aa" },
      { type: 'Goblin', name: "Scavenger Goblin", baseHp: 12, baseAtk: 2, baseDef: 1, range: 1, speed: 1.0, char: "g", color: "#eab308" },
      { type: 'Mage', name: "Skeleton Spellflinger", baseHp: 14, baseAtk: 4, baseDef: 0, range: 4, speed: 1.0, char: "S", color: "#60a5fa" },
      { type: 'Brute', name: "Orc Skullbreaker", baseHp: 30, baseAtk: 6, baseDef: 3, range: 1, speed: 1.3, char: "O", color: "#ea580c" },
      { type: 'Trapmaster', name: "Kobold Trapsmith", baseHp: 22, baseAtk: 4, baseDef: 2, range: 3, speed: 1.0, char: "K", color: "#22c55e" },
      { type: 'Dragon', name: "Sunder Ashwyrm Dragon", baseHp: 120, baseAtk: 11, baseDef: 6, range: 3, speed: 1.2, char: "🐉", color: "#ef4444" },
      { type: 'Hiisi', name: "Hiisi Forest Fiend", baseHp: 25, baseAtk: 5, baseDef: 2, range: 1, speed: 1.0, char: "👹", color: "#16a34a" },
      { type: 'Nakki', name: "Näkki Water Kelpie", baseHp: 22, baseAtk: 4, baseDef: 1, range: 2, speed: 0.9, char: "🧜", color: "#06b6d4" },
      { type: 'Otso', name: "Otso the Honey-Paw", baseHp: 180, baseAtk: 12, baseDef: 7, range: 1, speed: 1.1, char: "🐻", color: "#b45309" },
      { type: 'Louhi', name: "Louhi, Mistress of Pohjola", baseHp: 260, baseAtk: 15, baseDef: 10, range: 4, speed: 0.8, char: "🦅", color: "#c084fc" },
      { type: 'IkuTurso', name: "Iku-Turso Eternal Leviathan", baseHp: 200, baseAtk: 14, baseDef: 8, range: 2, speed: 1.0, char: "🦑", color: "#0ea5e9" },
      { type: 'Kalma', name: "Kalma Grave Goddess", baseHp: 90, baseAtk: 8, baseDef: 4, range: 3, speed: 0.9, char: "💀", color: "#a855f7" }
    ];
  }

  if (!(window as any).customHouses) {
    (window as any).customHouses = [
      { id: 'blacksmith', name: 'Blacksmith Shop', x: 4, y: 3, w: 8, h: 8 },
      { id: 'apothecary', name: 'Apothecary Shop', x: 37, y: 3, w: 8, h: 8 },
      { id: 'tavern', name: 'Tavern & Inn', x: 18, y: 3, w: 14, h: 8 },
      { id: 'villager1', name: 'Villager Cottage Left', x: 4, y: 19, w: 8, h: 8 },
      { id: 'villager2', name: 'Villager Cottage Right', x: 37, y: 19, w: 8, h: 8 },
      { id: 'barracks', name: 'Guard Barracks', x: 18, y: 20, w: 14, h: 7 }
    ];
  }
}
