export interface CustomMonsterMod {
  id: string;
  name: string;
  char: string;
  color: string;
  hp: number;
  atk: number;
  def: number;
  speed?: number;
  range?: number;
  isBoss?: boolean;
  archetype?: 'juggernaut' | 'glass_cannon' | 'skirmisher' | 'boss_apex';
  description?: string;
}

export interface CustomItemMod {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'scroll';
  subType: string;
  damage: number;
  defense: number;
  critChance: number;
  value: number;
  color: string;
  description: string;
  traits?: string[];
  statBonuses?: { str?: number; dex?: number; int?: number; lck?: number };
}

export interface CustomSpellMod {
  id: string;
  name: string;
  element: 'fire' | 'ice' | 'lightning' | 'dark' | 'holy' | 'arcane';
  manaCost: number;
  damage: number;
  range: number;
  description: string;
  particleColor: string;
}

export interface CustomDungeonBlueprintMod {
  id: string;
  name: string;
  depth: number;
  width: number;
  height: number;
  biome: 'dungeon' | 'crypt' | 'volcanic' | 'ice' | 'forest' | 'town';
  playerStart: { x: number; y: number };
  mapGrid: number[][]; // TileType numbers
  props?: { id: string; x: number; y: number; name: string; char: string; color: string; description: string; type: string }[];
  enemies?: { id: string; x: number; y: number; name: string; char: string; color: string; hp: number; atk: number; def: number; isBoss?: boolean }[];
}

export interface GameMod {
  id: string;
  title: string;
  author: string;
  version: string;
  description: string;
  enabled: boolean;
  customMonsters?: CustomMonsterMod[];
  customItems?: CustomItemMod[];
  customSpells?: CustomSpellMod[];
  customDungeons?: CustomDungeonBlueprintMod[];
  createdAt: string;
}

const STORAGE_KEY = 'sunder_registered_mods_v1';

// Preset Community Sample Mods
const SAMPLE_MODS: GameMod[] = [
  {
    id: 'mod_mythical_behemoths',
    title: 'Mythical Behemoths Boss Pack',
    author: 'Arch-Lich Valerius',
    version: '1.2.0',
    description: 'Introduces ancient mythic apex boss encounters: Vorpal Behemoth and Celestial Hydra.',
    enabled: true,
    createdAt: '2026-08-11',
    customMonsters: [
      {
        id: 'monster_vorpal_behemoth',
        name: 'Vorpal Behemoth',
        char: '👹',
        color: '#f43f5e',
        hp: 450,
        atk: 36,
        def: 18,
        speed: 1,
        range: 1,
        isBoss: true,
        archetype: 'boss_apex',
        description: 'A towering abomination clad in obsidian bone plates that rends mortal armor.'
      },
      {
        id: 'monster_celestial_hydra',
        name: 'Celestial Hydra',
        char: '🐉',
        color: '#38bdf8',
        hp: 600,
        atk: 42,
        def: 22,
        speed: 1,
        range: 2,
        isBoss: true,
        archetype: 'boss_apex',
        description: 'A multi-headed cosmic beast breathing starlight and frost flames.'
      }
    ]
  },
  {
    id: 'mod_elven_sorcery',
    title: 'High-Elven Sorcery Spellbook',
    author: 'Lady Lyra Moonwhisper',
    version: '2.0.0',
    description: 'Unlocks powerful ancient elven spells: Solar Flare and Void Collapse.',
    enabled: true,
    createdAt: '2026-08-11',
    customSpells: [
      {
        id: 'spell_solar_flare',
        name: 'Solar Flare',
        element: 'fire',
        manaCost: 35,
        damage: 120,
        range: 4,
        description: 'Calls down a column of blinding solar fire that incinerates nearby foes.',
        particleColor: '#f97316'
      },
      {
        id: 'spell_void_collapse',
        name: 'Void Collapse',
        element: 'dark',
        manaCost: 50,
        damage: 185,
        range: 5,
        description: 'Implodes gravity at the target tile, dealing massive dark damage.',
        particleColor: '#a855f7'
      }
    ]
  },
  {
    id: 'mod_shadow_relics',
    title: 'Shadow Realm Relics Pack',
    author: 'Shadow Smith Kaelen',
    version: '1.0.5',
    description: 'Forges legendary shadow-infused armament: Shadowbane Greatsword and Aegis of the Void.',
    enabled: true,
    createdAt: '2026-08-11',
    customItems: [
      {
        id: 'item_shadowbane_sword',
        name: 'Shadowbane Greatsword',
        type: 'weapon',
        subType: 'Greatsword',
        damage: 48,
        defense: 4,
        critChance: 22,
        value: 1250,
        color: '#c084fc',
        description: 'A forged dark-steel blade that drinks the light around its wielder.',
        traits: ['Lifesteal 10%', 'Shadow Strike'],
        statBonuses: { str: 6, dex: 2 }
      },
      {
        id: 'item_aegis_void',
        name: 'Aegis of the Void',
        type: 'armor',
        subType: 'Shield',
        damage: 0,
        defense: 28,
        critChance: 0,
        value: 1400,
        color: '#38bdf8',
        description: 'A heavy spectral shield that nullifies elemental damage.',
        traits: ['Magic Immunity 15%', 'Stun Deflect'],
        statBonuses: { def: 8, int: 4 } as any
      }
    ]
  },
  {
    id: 'mod_forgotten_catacombs',
    title: 'Forgotten Catacombs Dungeon Blueprint',
    author: 'Dungeon Master Sunder',
    version: '1.1.0',
    description: 'A pre-designed 20x16 haunted catacombs level packed with ancient sarcophagi, traps, and boss lair.',
    enabled: true,
    createdAt: '2026-08-11',
    customDungeons: [
      {
        id: 'dungeon_forgotten_catacombs',
        name: 'Forgotten Catacombs',
        depth: 5,
        width: 20,
        height: 16,
        biome: 'crypt',
        playerStart: { x: 2, y: 2 },
        mapGrid: [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
          [1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
          [1,0,0,0,4,0,0,0,0,1,0,0,1,1,4,1,1,0,0,1],
          [1,1,4,1,1,1,1,4,1,1,0,0,1,0,0,0,1,0,0,1],
          [1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1],
          [1,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,4,0,0,1],
          [1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1],
          [1,1,1,1,4,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
          [1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,1,1,1,1,1,0,0,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,6,1],
          [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        props: [
          { id: 'p1', x: 2, y: 3, name: 'Ancient Sarcophagus', char: '⚰️', color: '#94a3b8', description: 'Carved marble sarcophagus from ancient lords.', type: 'sarcophagus' },
          { id: 'p2', x: 15, y: 2, name: 'Lore Bookshelf', char: '📚', color: '#f59e0b', description: 'Shelves crammed with leather-bound arcane volumes.', type: 'bookshelf' },
          { id: 'p3', x: 14, y: 13, name: 'Rusted Weapon Rack', char: '🗡️', color: '#cbd5e1', description: 'Racks holding antique blades and rusted spears.', type: 'weapon_rack' }
        ],
        enemies: [
          { id: 'e1', x: 6, y: 2, name: 'Skeletal Sentinel', char: '💀', color: '#e2e8f0', hp: 60, atk: 14, def: 5 },
          { id: 'e2', x: 16, y: 13, name: 'Vorpal Behemoth', char: '👹', color: '#f43f5e', hp: 450, atk: 36, def: 18, isBoss: true }
        ]
      }
    ]
  }
];

export function loadAllMods(): GameMod[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return SAMPLE_MODS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_MODS));
      return SAMPLE_MODS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_MODS));
      return SAMPLE_MODS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load mods from storage, reverting to sample mods', err);
    return SAMPLE_MODS;
  }
}

export function saveAllMods(mods: GameMod[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mods));
  } catch (err) {
    console.error('Failed to save mods to storage', err);
  }
}

export function toggleModState(modId: string, enabled: boolean): GameMod[] {
  const mods = loadAllMods();
  const updated = mods.map(m => m.id === modId ? { ...m, enabled } : m);
  saveAllMods(updated);
  return updated;
}

export function saveSingleMod(mod: GameMod): GameMod[] {
  const mods = loadAllMods();
  const index = mods.findIndex(m => m.id === mod.id);
  let updated: GameMod[];
  if (index >= 0) {
    updated = [...mods];
    updated[index] = mod;
  } else {
    updated = [mod, ...mods];
  }
  saveAllMods(updated);
  return updated;
}

export function deleteMod(modId: string): GameMod[] {
  const mods = loadAllMods();
  const updated = mods.filter(m => m.id !== modId);
  saveAllMods(updated);
  return updated;
}

export function exportModToJSON(mod: GameMod): string {
  return JSON.stringify(mod, null, 2);
}

export function parseAndValidateModJSON(jsonString: string): { success: boolean; mod?: GameMod; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.id || !parsed.title) {
      return { success: false, error: 'Mod JSON must include "id" and "title" string fields.' };
    }
    const validatedMod: GameMod = {
      id: String(parsed.id),
      title: String(parsed.title),
      author: String(parsed.author || 'Anonymous Modder'),
      version: String(parsed.version || '1.0.0'),
      description: String(parsed.description || 'Custom user created mod.'),
      enabled: parsed.enabled !== false,
      createdAt: parsed.createdAt || new Date().toISOString().split('T')[0],
      customMonsters: Array.isArray(parsed.customMonsters) ? parsed.customMonsters : [],
      customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
      customSpells: Array.isArray(parsed.customSpells) ? parsed.customSpells : [],
      customDungeons: Array.isArray(parsed.customDungeons) ? parsed.customDungeons : []
    };
    return { success: true, mod: validatedMod };
  } catch (err: any) {
    return { success: false, error: `Invalid JSON syntax: ${err.message}` };
  }
}

// Active Custom Content Queries across all ENABLED mods
export function getActiveCustomMonsters(): CustomMonsterMod[] {
  const mods = loadAllMods();
  const activeMonsters: CustomMonsterMod[] = [];
  mods.filter(m => m.enabled).forEach(m => {
    if (m.customMonsters) {
      activeMonsters.push(...m.customMonsters);
    }
  });
  return activeMonsters;
}

export function getActiveCustomItems(): CustomItemMod[] {
  const mods = loadAllMods();
  const activeItems: CustomItemMod[] = [];
  mods.filter(m => m.enabled).forEach(m => {
    if (m.customItems) {
      activeItems.push(...m.customItems);
    }
  });
  return activeItems;
}

export function getActiveCustomSpells(): CustomSpellMod[] {
  const mods = loadAllMods();
  const activeSpells: CustomSpellMod[] = [];
  mods.filter(m => m.enabled).forEach(m => {
    if (m.customSpells) {
      activeSpells.push(...m.customSpells);
    }
  });
  return activeSpells;
}

export function getActiveCustomDungeons(): CustomDungeonBlueprintMod[] {
  const mods = loadAllMods();
  const activeDungeons: CustomDungeonBlueprintMod[] = [];
  mods.filter(m => m.enabled).forEach(m => {
    if (m.customDungeons) {
      activeDungeons.push(...m.customDungeons);
    }
  });
  return activeDungeons;
}
