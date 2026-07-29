import { TileType, GameState, EquipmentItem, WeaponBaseType, getMoonPhase } from '../types';
import { formatGameTime } from './overworld';
import gameConfig from '../data/gameConfig.json';

export const LEVEL_WIDTH = 64;
export const LEVEL_HEIGHT = 40;

export function findNearestSafePlayerTile(
  startX: number,
  startY: number,
  map: TileType[][]
): { x: number; y: number } {
  const isSafe = (x: number, y: number): boolean => {
    if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) return false;
    const tile = map[y][x];
    return (
      tile !== TileType.Wall &&
      tile !== TileType.Window &&
      tile !== TileType.Tree &&
      tile !== TileType.PineTree &&
      tile !== TileType.BirchTree &&
      tile !== TileType.CopperVein &&
      tile !== TileType.IronVein &&
      tile !== TileType.Water &&
      tile !== TileType.Table &&
      tile !== TileType.Campfire &&
      tile !== TileType.Anvil &&
      tile !== TileType.Empty &&
      tile !== TileType.WatchtowerWall &&
      tile !== TileType.WatchtowerSlit &&
      tile !== TileType.WatchtowerBarricade &&
      tile !== TileType.WatchtowerFlag &&
      tile !== TileType.Bed &&
      tile !== TileType.Fireplace &&
      tile !== TileType.Torch &&
      tile !== TileType.Sign &&
      tile !== TileType.Bush
    );
  };

  if (isSafe(startX, startY)) {
    return { x: startX, y: startY };
  }

  // Spiral search out to a radius of 25 tiles
  for (let r = 1; r <= 25; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const testX = startX + dx;
          const testY = startY + dy;
          if (isSafe(testX, testY)) {
            return { x: testX, y: testY };
          }
        }
      }
    }
  }

  console.error(`[DEV ERROR] findNearestSafePlayerTile: No valid safe spawn point found within radius 25 around (${startX}, ${startY}). Defaulting to map center.`);
  return { x: Math.floor(LEVEL_WIDTH / 2), y: Math.floor(LEVEL_HEIGHT / 2) };
}

/**
 * Searches for a target stair or tile type on the map.
 * If missing, raises an explicit developer error instead of silently defaulting to hardcoded coordinates.
 */
export function findStairsOrWalkablePosition(
  map: TileType[][],
  targetTile: TileType,
  contextName: string = 'Dungeon Level'
): { x: number; y: number } {
  if (!map || map.length === 0) {
    console.error(`[DEV ERROR] ${contextName}: Provided map is empty or invalid!`);
    return { x: 1, y: 1 };
  }

  let targetY = map.findIndex((row) => row.includes(targetTile));
  let targetX = targetY !== -1 && map[targetY] ? map[targetY].indexOf(targetTile) : -1;

  if (targetY !== -1 && targetX !== -1) {
    return { x: targetX, y: targetY };
  }

  console.error(
    `[DEV ERROR] ${contextName}: Expected tile '${targetTile}' was missing from the map! Automatically repairing level map...`
  );

  // Search for the first walkable floor tile and repair the map
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const tile = map[y][x];
      if (tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path || tile === TileType.StairsUp || tile === TileType.StairsDown) {
        map[y][x] = targetTile;
        console.warn(`[DEV REPAIR] Placed missing '${targetTile}' at (${x}, ${y}) on ${contextName}.`);
        return { x, y };
      }
    }
  }

  console.error(`[DEV CRITICAL ERROR] ${contextName}: No walkable floor tile found on entire map!`);
  return { x: 1, y: 1 };
}

export function hasEquippedTrait(gameState: Partial<GameState>, trait: string): boolean {
  if (!gameState) return false;
  if (gameState.equippedBoots?.traits?.includes(trait)) return true;
  if (gameState.equippedHelmet?.traits?.includes(trait)) return true;
  if (gameState.equippedArmor?.traits?.includes(trait)) return true;
  if (gameState.equippedGloves?.traits?.includes(trait)) return true;
  if (gameState.equippedShield?.traits?.includes(trait)) return true;
  if (gameState.equippedAmulet?.traits?.includes(trait)) return true;
  if (gameState.currentWeapon?.traits?.includes(trait)) return true;
  if (gameState.currentWeapon?.materialUsed?.extraProperty === trait) return true;
  return false;
}

export function isLunarBlessingActive(gameState: Partial<GameState>, phaseId: string): boolean {
  if (!gameState || gameState.gameTime === undefined || !gameState.playerStats) return false;
  const formatted = formatGameTime(gameState.gameTime);
  if (!formatted.isNight) return false;
  const currentPhase = getMoonPhase(gameState.playerStats.turnsPlayed);
  return currentPhase.id === phaseId;
}

export function getEffectiveAttribute(gameState: Partial<GameState>, statName: 'str' | 'dex' | 'int' | 'lck' | 'cha'): number {
  if (!gameState || !gameState.playerStats) return 10;
  let baseVal = gameState.playerStats[statName] || 10;
  
  if (statName === 'lck' && isLunarBlessingActive(gameState, 'waning_gibbous')) {
    baseVal += 15;
  }
  
  return baseVal;
}

export function getCharismaDiscountMultiplier(gameState: Partial<GameState>): number {
  const effectiveCha = getEffectiveAttribute(gameState, 'cha');
  const rate = gameConfig.worldRates?.townShopDiscountRatePerCharisma ?? 0.015;
  const discount = Math.max(0, effectiveCha - 10) * rate;
  return Math.max(0.50, 1.0 - discount); // Max 50% discount from Charisma
}

export function generateRandomAmulet(): EquipmentItem {
  const amuletTemplates = [
    { name: "Amber Pendant", primary: "dex", secondary: "lck", color: "#fbbf24" },
    { name: "Sapphire Charm", primary: "int", secondary: "cha", color: "#38bdf8" },
    { name: "Ruby Heart Talisman", primary: "str", secondary: "lck", color: "#f87171" },
    { name: "Jade Scarab", primary: "dex", secondary: "int", color: "#34d399" },
    { name: "Onyx Skull Amulet", primary: "str", secondary: "int", color: "#c084fc" },
    { name: "Emerald Eye Necklace", primary: "int", secondary: "dex", color: "#10b981" },
    { name: "Fey-Feather Charm", primary: "cha", secondary: "lck", color: "#f472b6" },
  ];
  
  const tmpl = amuletTemplates[Math.floor(Math.random() * amuletTemplates.length)];
  const isDouble = Math.random() < 0.35; // 35% chance to have two stat bonuses!
  
  const pVal = Math.floor(Math.random() * 5) + 1; // +1 to +5
  const bonuses: { [key: string]: number } = { [tmpl.primary]: pVal };
  
  if (isDouble && tmpl.secondary) {
    const sVal = Math.floor(Math.random() * Math.min(4, pVal)) + 1; // +1 to max +4 or primary val
    bonuses[tmpl.secondary] = sVal;
  }
  
  const bonusesText = Object.entries(bonuses).map(([stat, val]) => `+${val} ${stat.toUpperCase()}`).join(', ');
  
  return {
    id: `amulet_${Date.now()}_${Math.random()}`,
    name: `${tmpl.name} of Power`,
    type: 'armor',
    subType: 'Amulet',
    defense: 0,
    damage: 0,
    critChance: 0,
    range: 1,
    color: tmpl.color,
    description: `A rare shimmering ornament engraved with ancient runes. Grants passive attribute increases: ${bonusesText}.`,
    value: pVal * 50 + (isDouble ? 60 : 0),
    durability: undefined,
    maxDurability: undefined,
    statBonuses: bonuses,
  };
}

export function generateRandomLootGear(isBoss: boolean, isDragon: boolean, enemyName: string): EquipmentItem {
  const isOtso = enemyName.includes("Otso");
  const isLouhi = enemyName.includes("Louhi");
  const isSurtur = enemyName.includes("Surtur");

  let subType: string = 'LightArmor';
  let type: 'weapon' | 'armor' = 'armor';
  let name = "Steel Saber";
  let defense = 0;
  let damage = 0;
  let critChance = 0.10;
  let range = 1;
  let color = '#38bdf8';
  let description = 'A physical item retrieved from a standard hostile entity’s remains.';
  let value = 15;

  if (isBoss) {
    color = '#f43f5e';
    value = Math.floor(Math.random() * 100) + 200;
    description = 'An ancient heirloom retrieved from a vanquished dungeon overlord. It pulses with intense magical force.';
    
    // Select specific legendary item
    let bossPool: Array<{ name: string; type: 'weapon' | 'armor'; subType: string; defense: number; damage: number; range: number; description?: string }> = [];
    if (isSurtur) {
      bossPool = [
        { name: "Surtur's Molten Greatsword", type: 'weapon', subType: WeaponBaseType.Greatsword, defense: 0, damage: 25, range: 1, description: "Surtur's colossal claymore, forged in the core of Mount Fire. It radiates blistering heat." },
        { name: "Magma Sovereign Plate", type: 'armor', subType: 'HeavyArmor', defense: 15, damage: 0, range: 1, description: "Full body plate mail forged from cooled volcanic magma. It deflects heavy crushing blows." },
        { name: "Aegis of the Fire Lord", type: 'armor', subType: 'Shield', defense: 10, damage: 0, range: 1, description: "A towering brass-gilded shield capable of absorbing massive impact forces." },
        { name: "Blazing Crown of Surtur", type: 'armor', subType: 'Helmet', defense: 6, damage: 0, range: 1, description: "The blazing crown worn by Surtur, radiating absolute authority over fire." }
      ];
    } else if (isOtso) {
      bossPool = [
        { name: "Otso's Heavy Fur-Plate", type: 'armor', subType: 'HeavyArmor', defense: 14, damage: 0, range: 1, description: "A sacred chestplate woven from the impenetrable pelt of the Great Forest Bear Otso." },
        { name: "Claw of the Forest King", type: 'weapon', subType: WeaponBaseType.Dagger, defense: 0, damage: 18, range: 1, description: "A razor-sharp dagger fashioned from Otso's primal claw, dealing massive critical damage." },
        { name: "Honey-Paw Greaves", type: 'armor', subType: 'Boots', defense: 5, damage: 0, range: 1, description: "Heavy metal boots blessed by forest spirits, enhancing the wearer's ground stability." }
      ];
    } else if (isLouhi) {
      bossPool = [
        { name: "Louhi's Runed Frost Staff", type: 'weapon', subType: WeaponBaseType.Staff, defense: 0, damage: 20, range: 3, description: "A crystalline staff carrying Louhi's freezing dark sorcery. Requires MP to project shards." },
        { name: "Pohjola's Winter Plate", type: 'armor', subType: 'HeavyArmor', defense: 14, damage: 0, range: 1, description: "Enchanted heavy plate armor chilled by the biting winds of Pohjola." },
        { name: "Sampo Fragment Pendant", type: 'armor', subType: 'Amulet', defense: 2, damage: 0, range: 1, description: "A miraculous fragment of the Sampo, bringing immense fortune and passive attributes." }
      ];
    } else {
      // General boss pool
      bossPool = [
        { name: "Crown of Dominion", type: 'armor', subType: 'Helmet', defense: 7, damage: 0, range: 1, description: "An ancient gilded crown of ultimate authority, protecting the mind and skull." },
        { name: "Visage of the Void", type: 'armor', subType: 'Helmet', defense: 6, damage: 0, range: 1, description: "A dark mask that seems to swallow light, protecting its wearer from direct physical trauma." },
        { name: "Undying Trollplate", type: 'armor', subType: 'HeavyArmor', defense: 14, damage: 0, range: 1, description: "Extremely resilient heavy armor that holds remnant regenerative moss properties." },
        { name: "Doomcaller Broadsword", type: 'weapon', subType: WeaponBaseType.Sword, defense: 0, damage: 22, range: 1, description: "A dread sword with a wicked, serrated edge that thrums with necrotic malice." },
        { name: "Whispering Shadowdagger", type: 'weapon', subType: WeaponBaseType.Dagger, defense: 0, damage: 17, range: 1, description: "A silent dagger wrapped in shadows, perfect for executing lethal critical strikes." },
        { name: "Shield of Aegis", type: 'armor', subType: 'Shield', defense: 11, damage: 0, range: 1, description: "A pristine legendary shield bearing the sigil of defense. Deflects heavy strikes with ease." },
        { name: "Malakar's Phantom Cowl", type: 'armor', subType: 'Helmet', defense: 5, damage: 0, range: 1, description: "The ghostly cowl of Malakar, concealing the wearer's gaze while providing defense." }
      ];
    }

    const item = bossPool[Math.floor(Math.random() * bossPool.length)];
    name = item.name;
    type = item.type;
    subType = item.subType;
    defense = item.defense;
    damage = item.damage;
    range = item.range;
    if (item.description) description = item.description;
    critChance = 0.20;
  } else if (isDragon) {
    color = '#f43f5e';
    value = Math.floor(Math.random() * 50) + 100;
    description = 'A legendary armament forged from raw dragon scales and core volcanic essence.';
    
    const dragonPool = [
      { name: "Elder Wyrm Greatsword", type: 'weapon' as const, subType: WeaponBaseType.Greatsword, defense: 0, damage: 18, range: 1 },
      { name: "Hardened Dragonplate Chest", type: 'armor' as const, subType: 'HeavyArmor', defense: 11, damage: 0, range: 1 },
      { name: "Shield of Volcanic Scales", type: 'armor' as const, subType: 'Shield', defense: 8, damage: 0, range: 1 },
      { name: "Crest of the Dragon Lord", type: 'armor' as const, subType: 'Helmet', defense: 5, damage: 0, range: 1 }
    ];

    const item = dragonPool[Math.floor(Math.random() * dragonPool.length)];
    name = item.name;
    type = item.type;
    subType = item.subType;
    defense = item.defense;
    damage = item.damage;
    range = item.range;
    critChance = 0.20;
  } else {
    // Regular enemy drop or standard chest gear!
    const roll = Math.random();
    if (roll < 0.05) {
      return generateRandomAmulet();
    }

    const rarityRoll = Math.random();
    let rarityName = "Common";
    let prefix = "";
    let statBoost = 0;
    let critBoost = 0;
    let colorVal = '#a1a1aa';
    let rarityDesc = 'A standard common item issued to recruits or simple guards.';
    let priceMultiplier = 1;

    if (rarityRoll < 0.005) {
      rarityName = "Legendary";
      const prefixes = ["Sky-Splitter's", "Oakhaven Relic", "God-Forge's", "Timeless", "Devastating", "Cursed", "Astral", "Apocalypse"];
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)] + " ";
      statBoost = Math.floor(Math.random() * 5) + 7;
      critBoost = 0.15;
      colorVal = '#f97316';
      rarityDesc = 'A peerless, legendary artifact of incomprehensible power. Its presence causes the ground to hum.';
      priceMultiplier = 10;
    } else if (rarityRoll < 0.03) {
      rarityName = "Epic";
      const prefixes = ["Champion's", "Shadow-infused", "Demonic", "Pristine", "Mythic", "Sovereign", "Abyssal", "Warlord's"];
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)] + " ";
      statBoost = Math.floor(Math.random() * 3) + 4;
      critBoost = 0.10;
      colorVal = '#a855f7';
      rarityDesc = 'An exceptionally rare, epic piece of masterwork equipment, carrying strong ambient magical energy.';
      priceMultiplier = 5;
    } else if (rarityRoll < 0.13) {
      rarityName = "Rare";
      const prefixes = ["Exquisite", "Gilded", "Honed", "Reinforced", "Engraved", "Heavy", "Balanced"];
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)] + " ";
      statBoost = Math.floor(Math.random() * 2) + 2;
      critBoost = 0.05;
      colorVal = '#38bdf8';
      rarityDesc = 'A highly sought-after rare item crafted with superior precision and fine materials.';
      priceMultiplier = 2.5;
    } else if (rarityRoll < 0.35) {
      rarityName = "Uncommon";
      const prefixes = ["Sturdy", "Sharp", "Polished", "Reliable", "Hardened", "Vanguard's", "Soldier's"];
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)] + " ";
      statBoost = 1;
      critBoost = 0.02;
      colorVal = '#34d399';
      rarityDesc = 'An uncommon item built to withstand heavy combat, noticeably superior to basic infantry issues.';
      priceMultiplier = 1.5;
    } else {
      rarityName = "Common";
      const prefixes = ["Worn", "Rusted", "Standard", "Novice", "Simple", "Common"];
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)] + " ";
      statBoost = 0;
      critBoost = 0;
      colorVal = '#a1a1aa';
      rarityDesc = 'A standard common item issued to recruits or simple guards.';
      priceMultiplier = 1;
    }

    const isWeapon = Math.random() < 0.45;
    if (isWeapon) {
      type = 'weapon';
      color = colorVal;
      description = `${rarityDesc} It is of [${rarityName}] quality.`;

      const weaponTypes = [
        { subType: WeaponBaseType.Sword, names: ["Steel Saber", "Claymore", "Iron Broadsword", "Standard Shortsword"], range: 1, damage: 7 },
        { subType: WeaponBaseType.Spear, names: ["Steel Pike", "Iron Halberd", "Vanguard Glaive"], range: 2, damage: 6 },
        { subType: WeaponBaseType.Dagger, names: ["Shadow Dagger", "Rogue Dirk", "Assassins Stiletto"], range: 1, damage: 5, critChance: 0.22 },
        { subType: WeaponBaseType.Hammer, names: ["Iron Mace", "Spiked Morningstar", "War Hammer"], range: 1, damage: 9 },
        { subType: WeaponBaseType.Staff, names: ["Elder Staff", "Runic Oak Staff", "Sages Gnarled Staff"], range: 3, damage: 6 },
        { subType: WeaponBaseType.Bow, names: ["Composite Shortbow", "Yew Longbow", "Recurve Hunting Bow"], range: 4, damage: 6 },
        { subType: WeaponBaseType.Wand, names: ["Apprentice Sparks Wand", "Crystal Focus Wand", "Ruby Scepter"], range: 3, damage: 6 },
        { subType: WeaponBaseType.Crossbow, names: ["Heavy Crossbow", "Arbalest Crossbow"], range: 4, damage: 10 },
        { subType: WeaponBaseType.Greatsword, names: ["Zweihander Greatsword", "Executioners Blade"], range: 1, damage: 12 },
        { subType: WeaponBaseType.Warhammer, names: ["Dreadnought Warhammer", "Titan Smasher"], range: 1, damage: 13 }
      ];

      const wTmpl = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      subType = wTmpl.subType;
      name = prefix + wTmpl.names[Math.floor(Math.random() * wTmpl.names.length)];
      damage = wTmpl.damage + Math.floor(Math.random() * 3) + statBoost;
      range = wTmpl.range;
      critChance = (wTmpl.critChance || 0.10) + critBoost;
      value = Math.floor((Math.random() * 15 + 15) * priceMultiplier);
    } else {
      type = 'armor';
      color = colorVal;
      description = `${rarityDesc} It is of [${rarityName}] quality.`;

      const armorTypes = [
        { subType: 'HeavyArmor', names: ["Steel Plate Cuirass", "Dwarf Iron Breastplate", "Alloy Mail Coat"], baseDef: 5 },
        { subType: 'LightArmor', names: ["Hardened Leather Jerkin", "Ranger Studded Vest", "Rogue Leather Jacket"], baseDef: 3 },
        { subType: 'Helmet', names: ["Gothic Iron Armet", "Steel Face Visor", "Great Centurion Helm", "Leather Sallet"], baseDef: 2 },
        { subType: 'Gloves', names: ["Vanguard Gauntlets", "Iron-Plated Gauntlets", "Hardened Leather Gloves"], baseDef: 1 },
        { subType: 'Boots', names: ["Sabatons", "Armored Greaves", "Ranger Leather Boots"], baseDef: 1 },
        { subType: 'Shield', names: ["Kite Guard Shield", "Iron Round Shield", "Bronze Buckler"], baseDef: 3 }
      ];

      const aTmpl = armorTypes[Math.floor(Math.random() * armorTypes.length)];
      subType = aTmpl.subType;
      name = prefix + aTmpl.names[Math.floor(Math.random() * aTmpl.names.length)];
      defense = aTmpl.baseDef + Math.floor(Math.random() * 2) + statBoost;
      value = Math.floor((Math.random() * 10 + 12) * priceMultiplier);
    }
  }

  return {
    id: `drop_${Date.now()}_${Math.random()}`,
    name,
    type,
    subType: subType as any,
    defense,
    damage,
    critChance,
    range,
    color,
    description,
    value,
    durability: 120,
    maxDurability: 120
  };
}
