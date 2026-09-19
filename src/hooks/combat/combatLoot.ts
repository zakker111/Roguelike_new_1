import {
  GameState,
  Enemy,
  EnemyType,
  EquipmentItem,
  LootPile,
  Corpse,
  BloodSplatter
} from '../../types';
import { getEffectiveAttribute, generateRandomLootGear } from '../../utils/gameUtils';
import { formatGameTime } from '../../utils/overworld';

export interface CombatLootResult {
  gainedXp: number;
  newCorpse?: Corpse;
  splatters: BloodSplatter[];
  newLootPile: LootPile;
  killLog: string;
  extraLogs: { id: string; text: string; type: string; timestamp: string }[];
}

export function generateCombatLoot(
  prev: GameState,
  updatedEnemy: Enemy,
  gameConfig: { worldRates?: { equipmentDropRateBonusPerLuck?: number } }
): CombatLootResult {
  const isAnimal = updatedEnemy.isAnimal;
  const isLootGoblin =
    updatedEnemy.type === EnemyType.LootGoblin ||
    updatedEnemy.name.toLowerCase().includes('loot goblin');
  const splatterColor =
    updatedEnemy.char === 'r'
      ? '#22c55e'
      : updatedEnemy.char === 'S' || updatedEnemy.name.toLowerCase().includes('skeleton')
      ? '#38bdf8'
      : '#dc2626';
  const finalSplatterColor = isLootGoblin ? '#f59e0b' : splatterColor;

  const xpMult = (window as any).arenaXpMultiplier || 1.0;
  const goldMult = (window as any).arenaGoldMultiplier || 1.0;
  const isBoss = !!updatedEnemy.isBoss;
  const isDragon = updatedEnemy.type === EnemyType.Dragon;

  const gainedXp = Math.round(
    (isAnimal
      ? 5
      : isLootGoblin
      ? 60
      : isBoss
      ? 250
      : isDragon
      ? 120
      : updatedEnemy.isElite
      ? 45
      : 15) * xpMult
  );
  const baseGold = isBoss
    ? Math.floor(Math.random() * 50) + 50 + prev.playerStats.depth * 15
    : isDragon
    ? Math.floor(Math.random() * 80) + 80
    : Math.floor(Math.random() * 8) + 4 + prev.playerStats.depth * 3;
  const goldVal = Math.round(baseGold * goldMult);

  let newCorpse: Corpse | undefined;
  if (!isLootGoblin) {
    newCorpse = {
      id: `corpse_${Date.now()}_${Math.random()}`,
      x: updatedEnemy.x,
      y: updatedEnemy.y,
      char: updatedEnemy.char,
      name: updatedEnemy.name,
      color: updatedEnemy.color,
      type: isAnimal ? 'animal' : 'enemy',
      isElite: updatedEnemy.isElite,
      decayTurns: 70
    };
  }

  const splatters: BloodSplatter[] = [
    {
      id: `splatter_slain_${Date.now()}_${Math.random()}`,
      x: updatedEnemy.x,
      y: updatedEnemy.y,
      intensity: isBoss || isDragon ? 5 : 3,
      color: isDragon ? '#f97316' : finalSplatterColor
    }
  ];

  const materialRewards = Object.keys(prev.inventoryMaterials).filter(
    (k) => k !== 'mat_wood' && k !== 'mat_raw_meat' && k !== 'mat_cooked_meat'
  );
  const rolledGiftMat = materialRewards[Math.floor(Math.random() * materialRewards.length)];

  const droppedEquip: EquipmentItem[] = [];
  const effectiveLck = getEffectiveAttribute(prev, 'lck');
  const luckBonus =
    Math.max(0, effectiveLck - 10) * (gameConfig.worldRates?.equipmentDropRateBonusPerLuck ?? 0.03);
  const finalDropChance = Math.min(0.85, 0.22 + luckBonus);
  if (!isAnimal && (isBoss || isDragon || Math.random() < finalDropChance)) {
    droppedEquip.push(generateRandomLootGear(isBoss, isDragon, updatedEnemy.name));
  }

  let bossMats = [rolledGiftMat];
  let bossCats =
    !isAnimal && Math.random() > 0.65
      ? [['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'][Math.floor(Math.random() * 5)]]
      : [];

  let goblinMats: string[] = [];
  let goblinCats: string[] = [];
  if (isLootGoblin) {
    if (updatedEnemy.name.toLowerCase().includes('honey')) {
      goblinMats = ['mat_cooked_fish', 'mat_cooked_prime_meat', 'mat_prime_meat'];
      goblinCats = ['cat_fire'];
    } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
      goblinMats = ['mat_obsidian', 'mat_mithril'];
      goblinCats = ['cat_fire', 'cat_frost', 'cat_lightning', 'cat_shadow'];
    } else {
      const dropMats = ['mat_iron', 'mat_steel', 'mat_mithril', 'mat_obsidian'];
      const dropCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
      goblinMats = [
        dropMats[Math.floor(Math.random() * dropMats.length)],
        dropMats[Math.floor(Math.random() * dropMats.length)],
        dropMats[Math.floor(Math.random() * dropMats.length)]
      ];
      goblinCats = [
        dropCats[Math.floor(Math.random() * dropCats.length)],
        dropCats[Math.floor(Math.random() * dropCats.length)]
      ];
    }
  }

  if (isBoss) {
    const legendaryMats = [
      'mat_obsidian',
      'mat_shadow_fabric',
      'mat_dragon_scale',
      'mat_void_shard',
      'mat_royal_iron'
    ];
    const m1 =
      legendaryMats[Math.floor(Math.random() * legendaryMats.length)] === 'mat_dragon_scale'
        ? 'mat_dragonscale'
        : legendaryMats[Math.floor(Math.random() * legendaryMats.length)];
    const m2 =
      legendaryMats[(Math.floor(Math.random() * (legendaryMats.length - 1)) + 1) % legendaryMats.length] ===
      'mat_dragon_scale'
        ? 'mat_dragonscale'
        : 'mat_obsidian';
    bossMats = [m1, m2];

    const allCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
    const c1 = allCats[Math.floor(Math.random() * allCats.length)];
    const c2 = allCats[(Math.floor(Math.random() * (allCats.length - 1)) + 1) % allCats.length];
    bossCats = [c1, c2];
  }

  let animalMats = ['mat_raw_meat'];
  let animalMsg = `🥩 You hunted down ${updatedEnemy.name}! Gained +${gainedXp} XP and dropped Raw Meat. Collect it!`;
  const lowercaseEnemyName = updatedEnemy.name.toLowerCase();
  const isWildlife =
    lowercaseEnemyName.includes('deer') ||
    lowercaseEnemyName.includes('boar') ||
    lowercaseEnemyName.includes('goat') ||
    updatedEnemy.type === EnemyType.WildlifeDeer ||
    updatedEnemy.type === EnemyType.WildlifeBoar ||
    updatedEnemy.type === EnemyType.WildlifeGoat;

  if (isAnimal && isWildlife) {
    animalMats = ['mat_prime_meat', 'mat_thick_hide'];
    animalMsg = `🥩 You hunted down a magnificent ${updatedEnemy.name}! Gained +${gainedXp} XP and dropped Prime Wild Meat and Thick Wildlife Hide. Collect it!`;
  }

  const isBloodMoon = prev.bloodMoonTurnsLeft !== undefined && prev.bloodMoonTurnsLeft > 0;
  const dragonCatalysts = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
  const randomDragonCatalyst = dragonCatalysts[Math.floor(Math.random() * dragonCatalysts.length)];

  let finalMats = isAnimal
    ? animalMats
    : isLootGoblin
    ? goblinMats
    : isDragon
    ? ['mat_dragonscale', 'mat_obsidian']
    : bossMats;
  let finalCats = isLootGoblin ? goblinCats : isDragon ? [randomDragonCatalyst] : bossCats;

  if (updatedEnemy.type === EnemyType.Hiisi) {
    finalMats = ['mat_wood', 'mat_iron'];
    finalCats = ['cat_poison'];
  } else if (updatedEnemy.type === EnemyType.Nakki) {
    finalMats = ['mat_iron', 'mat_feybone'];
    finalCats = ['cat_frost'];
  } else if (updatedEnemy.type === EnemyType.Otso) {
    finalMats = ['mat_prime_meat', 'mat_thick_hide', 'mat_obsidian'];
    finalCats = ['cat_fire', 'cat_lightning'];
  } else if (updatedEnemy.type === EnemyType.Louhi) {
    finalMats = ['mat_obsidian', 'mat_mithril', 'mat_feybone'];
    finalCats = ['cat_frost', 'cat_shadow'];
  }

  const extraLogs: { id: string; text: string; type: string; timestamp: string }[] = [];

  if (
    updatedEnemy.id?.startsWith('wt_commander_') ||
    updatedEnemy.name?.toLowerCase().includes('watchtower commander') ||
    updatedEnemy.name?.toLowerCase().includes('watchtower overlord') ||
    updatedEnemy.name?.toLowerCase().includes('outpost commander')
  ) {
    finalMats = [...finalMats, 'mat_watchtower_key'];
    extraLogs.push({
      id: `wt_key_${Date.now()}`,
      text: `🔑 [KEY DROPPED]: ${updatedEnemy.name} dropped the Faction Watchtower Key! Collect the Loot Pile to claim it!`,
      type: 'loot',
      timestamp: formatGameTime(prev.gameTime).timeStr
    });
  }

  // Faction Turf War & Elite Spoils
  if (
    updatedEnemy.name?.toLowerCase().includes('warlord') ||
    updatedEnemy.name?.toLowerCase().includes('goreaxe')
  ) {
    finalMats = [...finalMats, 'mat_refined_iron', 'mat_tempered_scrap'];
    extraLogs.push({
      id: `orc_spoils_${Date.now()}`,
      text: `🏆 [WARLORD SPOILS]: Defeated ${updatedEnemy.name}! High-grade Refined Iron and Tempered Scrap scatter on the battlefield!`,
      type: 'loot',
      timestamp: formatGameTime(prev.gameTime).timeStr
    });
  } else if (
    updatedEnemy.name?.toLowerCase().includes('shadow dagger') ||
    updatedEnemy.name?.toLowerCase().includes('bandit leader')
  ) {
    finalMats = [...finalMats, 'mat_smuggler_key', 'mat_tempered_scrap'];
    extraLogs.push({
      id: `bandit_spoils_${Date.now()}`,
      text: `🗝️ [SYNDICATE SPOILS]: Defeated ${updatedEnemy.name}! Found a Smuggler's Key and Scavenged Scrap!`,
      type: 'loot',
      timestamp: formatGameTime(prev.gameTime).timeStr
    });
  } else if (updatedEnemy.faction === 'outlaw_bandits' && Math.random() < 0.35) {
    finalMats = [...finalMats, 'mat_smuggler_key'];
  } else if (updatedEnemy.faction === 'iron_fang_orcs' && Math.random() < 0.40) {
    finalMats = [...finalMats, 'mat_tempered_scrap'];
  }

  if (isBloodMoon && finalCats.length > 0) {
    finalCats = [...finalCats, ...finalCats];
  }

  const newLootPile: LootPile = {
    id: `loot_${Date.now()}_${Math.random()}`,
    x: updatedEnemy.x,
    y: updatedEnemy.y,
    gold: isAnimal ? 0 : isLootGoblin ? Math.floor(Math.random() * 80) + 50 : goldVal,
    materials: finalMats,
    catalysts: finalCats,
    equipment: droppedEquip
  };

  let killLog = '';
  if (isAnimal) {
    killLog = animalMsg;
  } else if (isLootGoblin) {
    if (updatedEnemy.name.toLowerCase().includes('honey')) {
      killLog = `🐗 [HONEY BOAR SLAIN]: With a satisfied squeal, Mielikki's Honey-Glazed Boar collapses, dropping honey-infused steaks, campfire fish, and high-quality gold! (+${gainedXp} XP)`;
    } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
      killLog = `✧ [ALCHEMICAL SPRITE HARVESTED]: The Alchemical Sprite pops in a burst of sparkling lights, releasing its full catalyst cargo onto the ground! (+${gainedXp} XP)`;
    } else {
      killLog = `🧚 [LOOT GOBLIN VANISHED]: With a panicked squeal, the Alchemical Loot Goblin dissolves in a puff of glittering stardust! It dropped its full inventory stash on the ground! (+${gainedXp} XP)`;
    }
  } else if (isBoss) {
    killLog = `👑 BOSS VANQUISHED! You have slain ${updatedEnemy.name}! The chamber trembles as ancient heirloom treasures spill onto the tile! (+${gainedXp} XP)`;
  } else if (isDragon) {
    killLog = `🐉 DRAGON SLAIN! You have vanquished the legendary ${updatedEnemy.name}! Hardened volcanic scales and hoarded gold scatter onto the ground! (+${gainedXp} XP)`;
  } else {
    killLog = `💀 You struck down ${updatedEnemy.name}! It dropped a shimmering Loot Pile ✦ on the ground! (+${gainedXp} XP)`;
  }

  return {
    gainedXp,
    newCorpse,
    splatters,
    newLootPile,
    killLog,
    extraLogs
  };
}
