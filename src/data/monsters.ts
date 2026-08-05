/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LootItem {
  name: string;
  chance: string;
  description: string;
  color: string;
}

export interface BestiaryEntry {
  key: string;
  name: string;
  char: string;
  color: string;
  category: 'Standard' | 'Wildlife' | 'Bosses';
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  range: number;
  speed: number;
  description: string;
  lootTable: LootItem[];
}

export const MONSTER_ENTRIES: BestiaryEntry[] = [
  // STANDARD ENEMIES
  {
    key: 'Rat',
    name: 'Giant Plague Rat',
    char: 'r',
    color: '#a1a1aa',
    category: 'Standard',
    baseHp: 8,
    baseAtk: 2,
    baseDef: 0,
    range: 1,
    speed: 1.0,
    description: 'A fast, diseased rodent that scurries around dark sewers and forest undergrowth. It attacks with toxic, fever-inducing bites.',
    lootTable: [
      { name: 'Raw Meat', chance: '100%', description: 'Fresh, stringy meat suitable for roasting over campfires.', color: '#ef4444' },
      { name: 'Small Gold', chance: '100%', description: 'A couple of scattered gold pieces.', color: '#eab308' },
      { name: 'Scurrying Tooth', chance: '5%', description: 'A sharp incisor used as a minor alchemical ingredient.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Goblin',
    name: 'Scavenger Goblin',
    char: 'g',
    color: '#eab308',
    category: 'Standard',
    baseHp: 12,
    baseAtk: 3,
    baseDef: 1,
    range: 1,
    speed: 1.0,
    description: 'A mischievous and cowardly scavenger that attacks travelers in packs. They carry stolen copper coins, raw ores, and rusted scrap metal.',
    lootTable: [
      { name: 'Gold Coins', chance: '100%', description: 'Standard currency dropped in moderate quantities (4-12g).', color: '#eab308' },
      { name: 'Rusted Equipment', chance: '22%', description: 'Chance to drop physical armor or weapons like a Steel Saber or Bronze Buckler.', color: '#38bdf8' },
      { name: 'Copper or Iron Ore', chance: '35%', description: 'Raw mineral chunks used for forging weapon components.', color: '#94a3b8' }
    ]
  },
  {
    key: 'SkeletonMage',
    name: 'Skeleton Spellflinger',
    char: 'S',
    color: '#60a5fa',
    category: 'Standard',
    baseHp: 14,
    baseAtk: 4,
    baseDef: 0,
    range: 4,
    speed: 1.0,
    description: 'An ancient skeleton reanimated by dark magic. It channels volatile arcane bolts from a safe distance and flees if approached.',
    lootTable: [
      { name: 'Gold Coins', chance: '100%', description: 'Standard gold currency dropped on defeat.', color: '#eab308' },
      { name: 'Spell Scroll', chance: '15%', description: 'A magic-imbued scroll detailing spellcasting secrets.', color: '#a855f7' },
      { name: 'Elemental Catalyst', chance: '30%', description: 'Chance to drop a Fire, Frost, or Poison catalyst.', color: '#fb923c' }
    ]
  },
  {
    key: 'OrcBrute',
    name: 'Orc Skullbreaker',
    char: 'O',
    color: '#ea580c',
    category: 'Standard',
    baseHp: 30,
    baseAtk: 6,
    baseDef: 3,
    range: 1,
    speed: 1.3,
    description: 'A massive, battle-hardened orc encased in thick iron plate. Extremely dangerous in close quarters; wielding an enormous bone-breaking club.',
    lootTable: [
      { name: 'Large Gold Pile', chance: '100%', description: 'A robust stash of gold pieces.', color: '#eab308' },
      { name: 'Iron or Steel Ingots', chance: '45%', description: 'High-quality processed metals for advanced weapon forging.', color: '#94a3b8' },
      { name: 'Heavy Equipment', chance: '22%', description: 'Chance to drop heavy protection plates or a Greatsword.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Trapmaster',
    name: 'Kobold Trapsmith',
    char: 'K',
    color: '#22c55e',
    category: 'Standard',
    baseHp: 22,
    baseAtk: 4,
    baseDef: 2,
    range: 3,
    speed: 1.0,
    description: 'A devious kobold engineer that sets hidden triggers and shoots poison darts. It excels at drawing players into explosive and spiked hazards.',
    lootTable: [
      { name: 'Gold Coins', chance: '100%', description: 'Decent gold drops.', color: '#eab308' },
      { name: 'Lockpicks', chance: '50%', description: 'Essential locksmith tools used to disarm traps and pick chests.', color: '#38bdf8' },
      { name: 'Poison Catalyst', chance: '40%', description: 'A vial of concentrated toxic fluid.', color: '#22c55e' }
    ]
  },
  {
    key: 'Bandit',
    name: 'Outlaw Bandit',
    char: 'B',
    color: '#a855f7',
    category: 'Standard',
    baseHp: 18,
    baseAtk: 5,
    baseDef: 1,
    range: 1,
    speed: 1.1,
    description: 'A ruthless bandit lurking along forest roads and ruined outposts. Strikes quickly with a poisoned dagger.',
    lootTable: [
      { name: 'Stolen Gold', chance: '100%', description: 'Heavy pouch of stolen coins.', color: '#eab308' },
      { name: 'Ration / Meat', chance: '30%', description: 'Travel rations.', color: '#ef4444' }
    ]
  },
  {
    key: 'ShadowStalker',
    name: 'Void Shadow Stalker',
    char: 'V',
    color: '#ec4899',
    category: 'Standard',
    baseHp: 25,
    baseAtk: 7,
    baseDef: 2,
    range: 1,
    speed: 1.4,
    description: 'An ethereal shadow entity born from deep subterranean abysses. It teleports into melee range and drains mana on hit.',
    lootTable: [
      { name: 'Shadow Catalyst', chance: '50%', description: 'Void-imbued catalyst.', color: '#a855f7' },
      { name: 'Arcane Essence', chance: '35%', description: 'Concentrated magical residue.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Wraith',
    name: 'Wraith of the Depths',
    char: '👻',
    color: '#818cf8',
    category: 'Standard',
    baseHp: 14,
    baseAtk: 3,
    baseDef: 5,
    range: 2,
    speed: 0.9,
    description: 'A floating, spectral apparition resisting standard physical weaponry. Highly evasive, but extremely vulnerable to direct fire magic.',
    lootTable: [
      { name: 'Ectoplasm', chance: '100%', description: 'A glowing spirit residue used for enchanting.', color: '#818cf8' },
      { name: 'Shadow Catalyst', chance: '40%', description: 'A droplet of distilled shadow essence.', color: '#8b5cf6' },
      { name: 'Arcane Wand', chance: '15%', description: 'A lightweight magical firing catalyst.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Vampire',
    name: 'Fledgling Vampire',
    char: '🧛',
    color: '#f43f5e',
    category: 'Standard',
    baseHp: 24,
    baseAtk: 5,
    baseDef: 1,
    range: 1,
    speed: 0.8,
    description: 'A swift, bloodthirsty creature of the night. It sinks its fangs into players to steal vital essence, healing its own wounds during combat.',
    lootTable: [
      { name: 'Vampire Blood', chance: '50%', description: 'Thick blood used to concoct life-steal potions.', color: '#f43f5e' },
      { name: 'Shadow Catalyst', chance: '35%', description: 'Catalyst that inflicts shadow draining status.', color: '#8b5cf6' },
      { name: 'Polished Gem', chance: '25%', description: 'Precious rubies or sapphires used for trading wealth.', color: '#eab308' }
    ]
  },
  {
    key: 'Slime',
    name: 'Caustic Acid Slime',
    char: '🧼',
    color: '#10b981',
    category: 'Standard',
    baseHp: 18,
    baseAtk: 3,
    baseDef: 2,
    range: 1,
    speed: 1.2,
    description: 'A bubbling, gelatinous mass of corrosive goo. Upon taking heavy damage, it leaves highly toxic sludge pools that damage equipment durability.',
    lootTable: [
      { name: 'Slime Gel', chance: '100%', description: 'Viscous gel used for brewing health potions.', color: '#10b981' }
    ]
  },
  {
    key: 'Kalma',
    name: 'Kalma Grave Goddess',
    char: '💀',
    color: '#a855f7',
    category: 'Standard',
    baseHp: 90,
    baseAtk: 8,
    baseDef: 4,
    range: 3,
    speed: 0.9,
    description: 'The Finnish goddess of death and decay, who haunts cemetery yards and smells of sweet graveyard soil. Spreads pestilence and curses.',
    lootTable: [
      { name: 'Graveyard Ash Flask', chance: '60%', description: 'Potent ash used in necromantic alchemy.', color: '#a855f7' },
      { name: 'Scythe Shard', chance: '30%', description: 'A sharp metallic fragment infused with shadow power.', color: '#94a3b8' }
    ]
  },

  // WILDLIFE
  {
    key: 'Wolf',
    name: 'Dire Timber Wolf',
    char: 'w',
    color: '#94a3b8',
    category: 'Wildlife',
    baseHp: 16,
    baseAtk: 4,
    baseDef: 1,
    range: 1,
    speed: 1.2,
    description: 'A swift wilderness predator that hunts in packs throughout Oakhaven. Drops fur hides and fresh meat.',
    lootTable: [
      { name: 'Raw Meat', chance: '100%', description: 'Nutritious wilderness game meat.', color: '#ef4444' },
      { name: 'Wolf Pelts', chance: '40%', description: 'Valuable animal hides for trade.', color: '#e2e8f0' }
    ]
  },

  // BOSSES
  {
    key: 'Otso',
    name: 'Otso the Honey-Paw',
    char: '🐻',
    color: '#b45309',
    category: 'Bosses',
    baseHp: 180,
    baseAtk: 12,
    baseDef: 7,
    range: 1,
    speed: 1.1,
    description: 'The sacred King of the Forest, a majestic golden-clawed bear spirit. Revering Otso brings fortune; angering him unleashes tectonic claws.',
    lootTable: [
      { name: 'Mielikki\'s Sweet Honey', chance: '100%', description: 'Divine golden nectar that fully heals HP and increases Max HP by +5 permanently. Guaranteed drop.', color: '#fbbf24' },
      { name: 'Otso\'s Heavy Fur-Plate', chance: '100%', description: 'A legendary thick fur chestplate granting massive armor and warmth. Guaranteed drop.', color: '#b45309' },
      { name: 'Prime Wild Meat x3', chance: '100%', description: 'Pristine, rich, succulent steaks.', color: '#ef4444' }
    ]
  },
  {
    key: 'Louhi',
    name: 'Louhi, Mistress of Pohjola',
    char: '🦅',
    color: '#c084fc',
    category: 'Bosses',
    baseHp: 260,
    baseAtk: 15,
    baseDef: 10,
    range: 4,
    speed: 0.8,
    description: 'The terrifying, shape-shifting ruler of the Northland. She can manifest glacial blizzards and steals light from the heavens. Drops the mythical Sampo fragment.',
    lootTable: [
      { name: 'Sampo Fragment', chance: '100%', description: 'A sparkling cosmic shard that grants infinite passive wealth (+5 Gold per turn). Guaranteed drop.', color: '#fbbf24' },
      { name: 'Louhi\'s Runed Frost Staff', chance: '100%', description: 'A legendary ice-carved catalyst that doubles frost spell output. Guaranteed drop.', color: '#38bdf8' },
      { name: 'Epic Gold Horde', chance: '100%', description: 'Pohjola\'s winter treasury stash (200-400g).', color: '#eab308' }
    ]
  },
  {
    key: 'IkuTurso',
    name: 'Iku-Turso Eternal Leviathan',
    char: '🦑',
    color: '#0ea5e9',
    category: 'Bosses',
    baseHp: 200,
    baseAtk: 14,
    baseDef: 8,
    range: 2,
    speed: 1.0,
    description: 'An ancient, terrifying kraken or sea monster of Kalevala lore, rising from the deepest ocean trenches to drag sailors to a watery grave.',
    lootTable: [
      { name: 'Sea Leviathan Heart', chance: '100%', description: 'Consuming this restores all HP/MP and grants +10 Max MP permanently.', color: '#fbbf24' },
      { name: 'Oceanic Ring', chance: '50%', description: 'Ancient ring granting +5 Defense and +10% Magic critical chance.', color: '#38bdf8' },
      { name: 'Gold Coins', chance: '100%', description: 'Sunken sea gold coins.', color: '#eab308' }
    ]
  },
  {
    key: 'AbyssalDragon',
    name: 'Malakor the Abyssal Sovereign',
    char: 'D',
    color: '#ef4444',
    category: 'Bosses',
    baseHp: 350,
    baseAtk: 24,
    baseDef: 8,
    range: 3,
    speed: 1.5,
    description: 'The ancient winged terror of the deepest abyss. Exhales searing hellfire and unleashes catastrophic shockwaves.',
    lootTable: [
      { name: 'Dragon Heartscale', chance: '100%', description: 'Legendary material of untold power.', color: '#ef4444' },
      { name: 'Sovereign Crown', chance: '100%', description: 'Crown of the abyssal lord.', color: '#eab308' },
      { name: 'Relic / Catalyst Stash', chance: '100%', description: 'Immense vault of ancient relics and catalysts.', color: '#a855f7' }
    ]
  }
];

export function getMonsterDefinitionByKey(key: string): BestiaryEntry | undefined {
  return MONSTER_ENTRIES.find(entry => entry.key.toLowerCase() === key.toLowerCase());
}

export function getMonstersByCategory(category: 'Standard' | 'Wildlife' | 'Bosses'): BestiaryEntry[] {
  return MONSTER_ENTRIES.filter(entry => entry.category === category);
}
