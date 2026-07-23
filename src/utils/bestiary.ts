import enemiesData from '../data/enemies.json';

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

export const BESTIARY_ENTRIES: BestiaryEntry[] = [
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
    color: '#f43f5e',
    category: 'Standard',
    baseHp: 18,
    baseAtk: 4,
    baseDef: 1,
    range: 1,
    speed: 1.0,
    description: 'A desperate, dual-wielding highway robber lurking in shadows. They strike with terrifying speed and are highly skilled in ambush tactics.',
    lootTable: [
      { name: 'Gold Purse', chance: '100%', description: 'Purse containing stolen currency (5-15g).', color: '#eab308' },
      { name: 'Steel Dagger', chance: '15%', description: 'A pristine, double-strike melee blade.', color: '#38bdf8' },
      { name: 'Light Armor Plate', chance: '22%', description: 'Ranger Greaves or chainmail linings for agile defenses.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Troll',
    name: 'Cave Troll',
    char: 'T',
    color: '#10b981',
    category: 'Standard',
    baseHp: 45,
    baseAtk: 7,
    baseDef: 4,
    range: 1,
    speed: 1.5,
    description: 'A gigantic, towering cave troll with moss-covered hide. Its magical constitution allows it to regenerate health rapidly every single turn.',
    lootTable: [
      { name: 'Troll Gold Stash', chance: '100%', description: 'Abundant gold found deep in troll hoards.', color: '#eab308' },
      { name: 'Mithril Ore', chance: '30%', description: 'Highly valuable deep-mine ore used for mastercraft weapons.', color: '#c084fc' },
      { name: 'Heavy Shield', chance: '22%', description: 'Chance to drop a high-armor Gothic Buckler.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Ghost',
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
      { name: 'Shadow Catalyst', chance: '#40%', description: 'A droplet of distilled shadow essence.', color: '#8b5cf6' },
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
      { name: 'Acid Secretion', chance: '60%', description: 'Corrosive goop used to coat blades with poison.', color: '#10b981' },
      { name: 'Poison Catalyst', chance: '30%', description: 'Enables toxic poison afflictions.', color: '#22c55e' }
    ]
  },
  {
    key: 'Spider',
    name: 'Sunder Webspinner',
    char: '🕷️',
    color: '#fb923c',
    category: 'Standard',
    baseHp: 15,
    baseAtk: 3,
    baseDef: 1,
    range: 2,
    speed: 0.9,
    description: 'A multi-legged crawler that blankets tiles in sticky webbing. Players trapped in its web suffer heavy speed penalties and are easy prey.',
    lootTable: [
      { name: 'Web Silk', chance: '75%', description: 'Pristine glowing thread used for crafting armor linings.', color: '#f8fafc' },
      { name: 'Poison Venom', chance: '40%', description: 'Highly concentrated toxic venom gland.', color: '#22c55e' }
    ]
  },
  {
    key: 'Necromancer',
    name: 'Acolyte Necromancer',
    char: '🧙',
    color: '#a855f7',
    category: 'Standard',
    baseHp: 20,
    baseAtk: 4,
    baseDef: 1,
    range: 4,
    speed: 1.1,
    description: 'A sinister spellcaster obsessed with rising dead. It maintains heavy distance while raising skeleton warriors to intercept and block your path.',
    lootTable: [
      { name: 'Spell Scrolls', chance: '35%', description: 'Scrolls containing elemental spells.', color: '#a855f7' },
      { name: 'Void Shard', chance: '10%', description: 'A legendary crystal pulsing with cosmic shadow force.', color: '#c084fc' },
      { name: 'Shadow Catalyst', chance: '45%', description: 'Shadow status elemental enhancer.', color: '#8b5cf6' }
    ]
  },
  {
    key: 'DreadKnight',
    name: 'Dread Iron Warden',
    char: '⛓️',
    color: '#94a3b8',
    category: 'Standard',
    baseHp: 35,
    baseAtk: 5,
    baseDef: 5,
    range: 1,
    speed: 1.2,
    description: 'A heavily armored fortress of a knight. Encased in high-quality iron steel plates, it absorbs massive physical strikes and hits like a battering ram.',
    lootTable: [
      { name: 'Steel Ingots', chance: '60%', description: 'Processed heavy metal used for forging shield panels.', color: '#94a3b8' },
      { name: 'Warden Armor Piece', chance: '25%', description: 'Gothic helmets, breastplates, or heavy gauntlets.', color: '#38bdf8' }
    ]
  },
  {
    key: 'Dragon',
    name: 'Sunder Ashwyrm Dragon',
    char: '🐉',
    color: '#ef4444',
    category: 'Standard',
    baseHp: 120,
    baseAtk: 11,
    baseDef: 6,
    range: 3,
    speed: 1.2,
    description: 'A legendary fire-breathing terror of the volcanic peaks and deep ruins. It can incinerate players from range 3 with molten breath. Extremely tough to kill, but rewards adventurers with priceless dragon treasure.',
    lootTable: [
      { name: 'Hoarded Treasure Stash', chance: '100%', description: 'A massive chest of pure gold coins (150g-300g).', color: '#eab308' },
      { name: 'Elder Dragon Scale', chance: '100%', description: 'An extremely durable volcanic scale used to craft elite armor plates. Guaranteed drop.', color: '#ef4444' },
      { name: 'Dragon Heart Core', chance: '15%', description: 'A pulsing fiery heart that instantly heals full HP and restores full MP.', color: '#f43f5e' },
      { name: 'High-Tier Elemental Catalyst', chance: '100%', description: 'A raw alchemical catalyst infused with powerful elemental properties. Guaranteed drop.', color: '#a855f7' }
    ]
  },

  // WILDLIFE
  {
    key: 'Deer',
    name: 'Wild Meadow Deer',
    char: '🦌',
    color: '#fb923c',
    category: 'Wildlife',
    baseHp: 12,
    baseAtk: 0,
    baseDef: 0,
    range: 1,
    speed: 0.8,
    description: 'A harmless and gentle forest deer. It panics and runs away rapidly at the slightest sound of conflict. Yields high-quality venison.',
    lootTable: [
      { name: 'Raw Meat', chance: '100%', description: 'Standard raw meat used for camp cooking.', color: '#ef4444' },
      { name: 'Prime Wild Meat', chance: '25%', description: 'Magnificent, rare tenderloin providing heavy HP restoration.', color: '#f43f5e' },
      { name: 'Thick Wildlife Hide', chance: '25%', description: 'Durable animal skin used for leather stitching.', color: '#a16207' }
    ]
  },
  {
    key: 'Boar',
    name: 'Sunder Forest Boar',
    char: '🐗',
    color: '#a16207',
    category: 'Wildlife',
    baseHp: 18,
    baseAtk: 3,
    baseDef: 1,
    range: 1,
    speed: 1.1,
    description: 'A tough, bad-tempered forest boar. Usually neutral, but it will charge aggressively with sharp tusks if disturbed or attacked by spellfire.',
    lootTable: [
      { name: 'Raw Meat', chance: '100%', description: 'Juicy, tough wild boar meat.', color: '#ef4444' },
      { name: 'Prime Wild Meat', chance: '30%', description: 'Excellent cuts of meat.', color: '#f43f5e' },
      { name: 'Thick Wildlife Hide', chance: '40%', description: 'Sturdy animal hide suitable for light armor.', color: '#a16207' }
    ]
  },
  {
    key: 'Goat',
    name: 'Mountain Billy Goat',
    char: '🐐',
    color: '#e2e8f0',
    category: 'Wildlife',
    baseHp: 10,
    baseAtk: 1,
    baseDef: 0,
    range: 1,
    speed: 0.9,
    description: 'A nimble mountain dweller capable of traversing treacherous rocky slopes. Yields standard hide and goat meat if hunted.',
    lootTable: [
      { name: 'Raw Meat', chance: '100%', description: 'Standard raw meat.', color: '#ef4444' },
      { name: 'Thick Wildlife Hide', chance: '20%', description: 'Decent hide used in blacksmithing.', color: '#a16207' }
    ]
  },
  {
    key: 'LootGoblin',
    name: 'Alchemical Loot Goblin',
    char: '🧚',
    color: '#facc15',
    category: 'Wildlife',
    baseHp: 25,
    baseAtk: 0,
    baseDef: 2,
    range: 1,
    speed: 0.8,
    description: 'A magical, glowing sprite laden with stolen items. It is completely non-aggressive and runs frantically, dropping rare materials and catalysts when struck.',
    lootTable: [
      { name: 'Massive Gold', chance: '100%', description: 'Drops 50-130 gold upon defeat, and 15-35g on every physical strike.', color: '#eab308' },
      { name: 'Rare Materials', chance: '100%', description: 'Guaranteed to drop multiple Mithril, Obsidian, or Steel chunks.', color: '#c084fc' },
      { name: 'High-Grade Catalysts', chance: '100%', description: 'Guaranteed drops of multiple elemental modifiers (Fire, Frost, Poison, Lightning, Shadow).', color: '#fb923c' }
    ]
  },

  // BOSSES
  {
    key: 'Morgath the Voidbringer',
    name: 'Morgath the Voidbringer',
    char: '☠',
    color: '#c084fc',
    category: 'Bosses',
    baseHp: 67, // base multiplied by 4.8
    baseAtk: 7,
    baseDef: 4,
    range: 4,
    speed: 0.9,
    description: 'A towering, ancient skeleton lich lord that commands void-magic. He blankets the floor in shadow storms and drains player life force.',
    lootTable: [
      { name: 'Epic Gold Horde', chance: '100%', description: 'A massive amount of gold coins (60-120g).', color: '#eab308' },
      { name: 'Void Heirloom Gear', chance: '100%', description: 'Guaranteed to drop Morgath-specific legendary equipment: e.g. Crown of Dominion, Visage of the Void, Doomcaller Broadsword.', color: '#f43f5e' },
      { name: 'Legendary Obsidian', chance: '100%', description: 'Sought-after magma-forged material for crafting Tier-3 weapons.', color: '#c084fc' },
      { name: 'Shadow Catalyst', chance: '100%', description: 'Rare catalyst to infuse weapons with life-drain.', color: '#8b5cf6' }
    ]
  },
  {
    key: 'Grommash the Undying Troll',
    name: 'Grommash the Undying Troll',
    char: '👹',
    color: '#f43f5e',
    category: 'Bosses',
    baseHp: 252, // base 45 * 5.6
    baseAtk: 14,
    baseDef: 9,
    range: 1,
    speed: 1.2,
    description: 'An immense, unyielding forest behemoth. Its regeneration rate is legendary, healing immense HP every turn. Wields raw physical earthquakes.',
    lootTable: [
      { name: 'Epic Gold Horde', chance: '100%', description: 'Troll treasure stash.', color: '#eab308' },
      { name: 'Undying Trollplate', chance: '100%', description: 'An indestructible legendary chest piece with passive HP regeneration.', color: '#f43f5e' },
      { name: 'Dragon Scale', chance: '100%', description: 'Mythic scale used to forge fire-resistant plate armors.', color: '#c084fc' },
      { name: 'Prime Wild Meat x2', chance: '100%', description: 'Prime hunting meat for elite restorations.', color: '#f43f5e' }
    ]
  },
  {
    key: 'Warlord Krosh Skullbreaker',
    name: 'Warlord Krosh Skullbreaker',
    char: '🧌',
    color: '#ea580c',
    category: 'Bosses',
    baseHp: 150, // base 30 * 5.0
    baseAtk: 13,
    baseDef: 8,
    range: 1,
    speed: 1.1,
    description: 'The supreme commander of the Sunder Orc clans. Enclad in massive plates, he swings a giant granite hammer that inflicts heavy knockback and stuns.',
    lootTable: [
      { name: 'Gold Stash', chance: '100%', description: 'Orc war treasury gold chest.', color: '#eab308' },
      { name: 'Doomcaller Broadsword', chance: '100%', description: 'Legendary Orc weapon with high base damage and critical multipliers.', color: '#f43f5e' },
      { name: 'Royal Iron Core', chance: '100%', description: 'Extremely dense forging material for unbreakable weaponry.', color: '#c084fc' }
    ]
  },
  {
    key: 'King Scurry the Plague Swarm',
    name: 'King Scurry the Plague Swarm',
    char: '🐀',
    color: '#a3e635',
    category: 'Bosses',
    baseHp: 33, // base 8 * 4.2
    baseAtk: 3,
    baseDef: 3,
    range: 1,
    speed: 0.7,
    description: 'The radioactive alpha rodent that rules the dungeon sewers. Incredibly fast, attacking multiple times and summoning swarm rats to overwhelm you.',
    lootTable: [
      { name: 'Sewer Treasures', chance: '100%', description: 'Gold coins gathered from the drainages.', color: '#eab308' },
      { name: 'Scurry Swift Boots', chance: '100%', description: 'Unique boots that double standard move speed and increase lockpicking chance.', color: '#f43f5e' },
      { name: 'Poison Catalyst', chance: '100%', description: 'Powerful alchemical catalyst.', color: '#22c55e' }
    ]
  },
  {
    key: 'Malakar the Phantom Trapsmith',
    name: 'Malakar the Phantom Trapsmith',
    char: '🥷',
    color: '#ec4899',
    category: 'Bosses',
    baseHp: 101, // base 22 * 4.6
    baseAtk: 7,
    baseDef: 6,
    range: 3,
    speed: 0.8,
    description: 'A sparkly, pink-suited ninja assassin. He covers the entire arena in explosive steam geysers, poison traps, and spikes, slipping into shadows.',
    lootTable: [
      { name: 'Ninja Purse', chance: '100%', description: 'Precious pouch of high-grade coins.', color: '#eab308' },
      { name: 'Malakar\'s Phantom Cowl', chance: '100%', description: 'Agile legendary headwear which displays trap locations on the minimap.', color: '#f43f5e' },
      { name: 'Frost or Poison Catalyst', chance: '100%', description: 'Double elemental enhancers.', color: '#22c55e' }
    ]
  },
  {
    key: 'Surtur the Magma Arch-demon',
    name: 'Surtur the Magma Arch-demon',
    char: '👿',
    color: '#ef4444',
    category: 'Bosses',
    baseHp: 297, // base 35 * 8.5
    baseAtk: 16, // base 5 * 3.2
    baseDef: 15, // base 5 + 10
    range: 1,
    speed: 0.9,
    description: 'The supreme ancient lord of the Molten Underworld. He rules from the volcanic lava throne on Floor 10, wielding a cataclysmic magma sword.',
    lootTable: [
      { name: 'Cosmic Sparks Horde', chance: '100%', description: 'The legendary wealth of Surtur (150-300g).', color: '#eab308' },
      { name: 'Surtur\'s Molten Greatsword', chance: '100%', description: 'Ultimate broadsword infusing basic strikes with explosive lava bursts.', color: '#ef4444' },
      { name: 'Magma Sovereign Plate', chance: '100%', description: 'Heavy plate armor providing 100% immunity to lava tile burns.', color: '#ef4444' },
      { name: 'Aegis of the Fire Lord', chance: '100%', description: 'Towering shield that reflects fire damage back onto target attackers.', color: '#ef4444' }
    ]
  },
  {
    key: 'Hiisi',
    name: 'Hiisi Forest Fiend',
    char: '👹',
    color: '#16a34a',
    category: 'Standard',
    baseHp: 25,
    baseAtk: 5,
    baseDef: 2,
    range: 1,
    speed: 1.0,
    description: 'An ancient forest goblin or rock-demon born of raw woodland malice. They guard ancestral stone mounds and hurl earthen curses.',
    lootTable: [
      { name: 'Pine Resin Flask', chance: '50%', description: 'Sticky resin used to brew focus elixirs.', color: '#f59e0b' },
      { name: 'Hiisi Rune Pebble', chance: '25%', description: 'A carved stone with defensive runes.', color: '#10b981' },
      { name: 'Gold Coins', chance: '100%', description: 'Stolen gold coins.', color: '#eab308' }
    ]
  },
  {
    key: 'Nakki',
    name: 'Näkki Water Kelpie',
    char: '🧜',
    color: '#06b6d4',
    category: 'Standard',
    baseHp: 22,
    baseAtk: 4,
    baseDef: 1,
    range: 2,
    speed: 0.9,
    description: 'A malevolent water spirit that slithers through riverbeds and swamp pools. It uses runic melodies to trap and drown unsuspecting travelers.',
    lootTable: [
      { name: 'Näkki Pearl', chance: '30%', description: 'A glowing river pearl with magical attributes.', color: '#38bdf8' },
      { name: 'Swamp Water Flask', chance: '100%', description: 'Alchemical water filled with flora essence.', color: '#06b6d4' },
      { name: 'Gold Coins', chance: '100%', description: 'Sunken coin relics.', color: '#eab308' }
    ]
  },
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
  }
];

export const incrementDefeatedEnemyCount = (
  defeatedEnemiesCount: { [key: string]: number } | undefined,
  enemyName: string | undefined,
  enemyType: string | undefined,
  isBoss: boolean
): { [key: string]: number } => {
  const counts = { ...(defeatedEnemiesCount || {}) };
  
  let key = enemyType || 'Unknown';
  if (isBoss && enemyName) {
    // Strip the boss symbols like "👑 " or "★ " or " ★"
    key = enemyName.replace('👑 ', '').replace('★ ', '').replace(' ★', '').trim();
    // Also handle special names like Surtur
    if (key.includes("Surtur")) {
      key = "Surtur the Magma Arch-demon";
    } else if (key.includes("Morgath")) {
      key = "Morgath the Voidbringer";
    } else if (key.includes("Grommash")) {
      key = "Grommash the Undying Troll";
    } else if (key.includes("Krosh")) {
      key = "Warlord Krosh Skullbreaker";
    } else if (key.includes("Scurry")) {
      key = "King Scurry the Plague Swarm";
    } else if (key.includes("Malakar")) {
      key = "Malakar the Phantom Trapsmith";
    } else if (key.includes("Otso")) {
      key = "Otso";
    } else if (key.includes("Louhi")) {
      key = "Louhi";
    }
  }

  // If standard name includes elite prefixes, match by base type
  if (!isBoss && key && typeof key === 'string' && (key.startsWith('★') || (enemyName && typeof enemyName === 'string' && enemyName.includes('★')))) {
    key = enemyType || 'Unknown';
  }

  counts[key] = (counts[key] || 0) + 1;
  return counts;
};
