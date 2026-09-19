import { TileType, DungeonProp } from '../types/map';
import decorData from '../data/decorTemplates.json';

export interface DecorTemplate {
  type: string;
  char: string;
  name: string;
  color: string;
  description: string;
  actionLabel: string;
  interaction: string;
}

/**
 * Generate 25-35 atmospheric, interactive decor items for dungeon floors.
 */
export function generateDungeonDecorProps(map: TileType[][], depth: number): DungeonProp[] {
  const propsList: DungeonProp[] = [];
  const height = map.length;
  const width = map[0]?.length || 0;

  const dungeonTemplates = decorData.dungeon as DecorTemplate[];
  const decorCount = 20 + Math.floor(Math.random() * 12); // 20-31 props per floor
  let attempts = 0;

  while (propsList.length < decorCount && attempts < 2000) {
    attempts++;
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    if (map[ry]?.[rx] === TileType.Floor) {
      const isOccupied = propsList.some(p => p.x === rx && p.y === ry);
      if (!isOccupied) {
        const template = dungeonTemplates[Math.floor(Math.random() * dungeonTemplates.length)];
        propsList.push({
          id: `dec_dung_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          x: rx,
          y: ry,
          char: template.char,
          name: template.name,
          color: template.color,
          description: template.description,
          type: template.type,
          actionLabel: template.actionLabel,
          interaction: template.interaction,
          isInteracted: false
        });
      }
    }
  }

  return propsList;
}

/**
 * Generate interactive decor props for town building interiors and outdoor squares.
 */
export function generateTownHouseDecorProps(map: TileType[][], buildingType: string = 'general'): DungeonProp[] {
  const propsList: DungeonProp[] = [];
  const height = map.length;
  const width = map[0]?.length || 0;

  const townTemplates = decorData.town as DecorTemplate[];

  // Select appropriate decor based on building purpose
  const filterType = buildingType.toLowerCase();
  let selectedTemplates = townTemplates;

  if (filterType.includes('tavern') || filterType.includes('inn')) {
    selectedTemplates = townTemplates.filter(t => ['bed', 'fireplace', 'feast_table', 'cask', 'bookshelf'].includes(t.type));
  } else if (filterType.includes('apothecary') || filterType.includes('herbalist')) {
    selectedTemplates = townTemplates.filter(t => ['herb_pot', 'bookshelf', 'fireplace', 'bed'].includes(t.type));
  } else if (filterType.includes('blacksmith') || filterType.includes('forge')) {
    selectedTemplates = townTemplates.filter(t => ['fireplace', 'bed', 'notice_board', 'cask'].includes(t.type));
  } else if (filterType.includes('library') || filterType.includes('shrine')) {
    selectedTemplates = townTemplates.filter(t => ['bookshelf', 'fireplace', 'herb_pot'].includes(t.type));
  }

  const propCount = 3 + Math.floor(Math.random() * 4);
  let attempts = 0;

  while (propsList.length < propCount && attempts < 500) {
    attempts++;
    const rx = Math.floor(Math.random() * (width - 2)) + 1;
    const ry = Math.floor(Math.random() * (height - 2)) + 1;

    const currentTile = map[ry]?.[rx];
    if (currentTile === TileType.Floor || currentTile === TileType.Path) {
      const isOccupied = propsList.some(p => p.x === rx && p.y === ry);
      if (!isOccupied) {
        const template = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)] || townTemplates[0];
        propsList.push({
          id: `dec_town_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          x: rx,
          y: ry,
          char: template.char,
          name: template.name,
          color: template.color,
          description: template.description,
          type: template.type,
          actionLabel: template.actionLabel,
          interaction: template.interaction,
          isInteracted: false
        });
      }
    }
  }

  return propsList;
}

/**
 * Generate ancient ruin & overworld POI decor items.
 */
export function generateRuinsDecorProps(map: TileType[][]): DungeonProp[] {
  const propsList: DungeonProp[] = [];
  const height = map.length;
  const width = map[0]?.length || 0;

  const ruinTemplates = decorData.ruins as DecorTemplate[];
  const propCount = 4 + Math.floor(Math.random() * 4);
  let attempts = 0;

  while (propsList.length < propCount && attempts < 500) {
    attempts++;
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    if (map[ry]?.[rx] === TileType.Floor || map[ry]?.[rx] === TileType.Grass) {
      const isOccupied = propsList.some(p => p.x === rx && p.y === ry);
      if (!isOccupied) {
        const template = ruinTemplates[Math.floor(Math.random() * ruinTemplates.length)];
        propsList.push({
          id: `dec_ruin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          x: rx,
          y: ry,
          char: template.char,
          name: template.name,
          color: template.color,
          description: template.description,
          type: template.type,
          actionLabel: template.actionLabel,
          interaction: template.interaction,
          isInteracted: false
        });
      }
    }
  }

  return propsList;
}

export interface InteractionResult {
  updatedProp: DungeonProp;
  statChanges: {
    hpChange?: number;
    mpChange?: number;
    maxMpChange?: number;
    goldChange?: number;
    expChange?: number;
    strChange?: number;
    intChange?: number;
    dexChange?: number;
    exhaustionChange?: number;
    addMaterial?: { id: string; count: number };
  };
  logs: string[];
  effectText: string;
  effectType: 'heal' | 'dmg' | 'loot';
}

export function handleDecorInteraction(prop: DungeonProp): InteractionResult {
  const result: InteractionResult = {
    updatedProp: {
      ...prop,
      isInteracted: true,
      description: `${prop.description.split(' (EXHAUSTED)')[0]} (EXHAUSTED) - You have claimed/searched this.`
    },
    statChanges: {},
    logs: [],
    effectText: '',
    effectType: 'loot'
  };

  const type = prop.type || prop.interaction || '';

  if (type === 'sarcophagus' || type === 'search_tomb') {
    const gold = Math.floor(Math.random() * 60) + 35;
    result.statChanges.goldChange = gold;
    result.statChanges.addMaterial = { id: 'mat_iron', count: 1 };
    result.logs.push(`⚰️ [TOMB]: You pry open the ancient marble sarcophagus. Discovered ${gold} ancient Gold coins and iron filings!`);
    result.effectText = `🪙 +${gold} GOLD`;
    result.effectType = 'loot';
  } else if (type === 'weapon_rack' || type === 'scavenge_weapon') {
    result.statChanges.addMaterial = { id: 'mat_iron', count: 2 };
    result.statChanges.expChange = 15;
    result.logs.push(`🗡️ [ARMORY]: You search the rusted weapon rack and scavenge 2x Iron Ingots!`);
    result.effectText = `🗡️ +2 IRON INGOTS`;
    result.effectType = 'loot';
  } else if (type === 'bookshelf' || type === 'read_tome' || type === 'read_chronicle') {
    result.statChanges.expChange = 30;
    result.statChanges.intChange = 1;
    result.logs.push(`📚 [KNOWLEDGE]: You study the ancient lore tomes. Your mind sharpens! Gained +35 XP and permanent +1 Intellect.`);
    result.effectText = `🧠 +1 INT / +35 XP`;
    result.effectType = 'heal';
  } else if (type === 'cask' || type === 'drink_cask') {
    result.statChanges.hpChange = 25;
    result.statChanges.exhaustionChange = -20;
    result.logs.push(`🛢️ [MEAD]: You tap the oak cask and drink refreshing spiced mead. Restored +25 HP and reduced exhaustion!`);
    result.effectText = `🍷 +25 HP`;
    result.effectType = 'heal';
  } else if (type === 'bone_pile' || type === 'search_bones') {
    const gold = Math.floor(Math.random() * 25) + 10;
    result.statChanges.goldChange = gold;
    result.logs.push(`☠️ [BONES]: You rummage through the skeleton pile. Found ${gold} leftover Gold coins.`);
    result.effectText = `🪙 +${gold} GOLD`;
    result.effectType = 'loot';
  } else if (type === 'crystal_cluster' || type === 'channel_crystal') {
    result.statChanges.mpChange = 35;
    result.logs.push(`💎 [CRYSTAL]: You channel the glowing mana crystal. A warm surge of magic replenishes +35 MP!`);
    result.effectText = `✨ +35 MP`;
    result.effectType = 'heal';
  } else if (type === 'cobweb' || type === 'clear_web') {
    result.statChanges.addMaterial = { id: 'mat_wood', count: 1 };
    result.logs.push(`🕸️ [WEB]: You clear away the thick webbing and collect silken threads.`);
    result.effectText = `🕸️ CLEARED`;
    result.effectType = 'loot';
  } else if (type === 'alchemy_table' || type === 'search_alchemy') {
    result.statChanges.addMaterial = { id: 'kingsfoil', count: 2 };
    result.logs.push(`🧪 [ALCHEMY]: You inspect the alchemist bench and find 2x Kingsfoil medicinal herbs!`);
    result.effectText = `🧪 +2 KINGSFOIL`;
    result.effectType = 'heal';
  } else if (type === 'statue' || type === 'statue_blessing') {
    result.statChanges.expChange = 25;
    result.statChanges.hpChange = 15;
    result.logs.push(`🗿 [STATUE]: You pray at the sentinel statue. An ancient blessing washes over you (+15 HP, +25 XP)!`);
    result.effectText = `🛡️ BLESSING`;
    result.effectType = 'heal';
  } else if (type === 'relic_chest' || type === 'open_relic_chest') {
    const gold = Math.floor(Math.random() * 80) + 60;
    result.statChanges.goldChange = gold;
    result.statChanges.addMaterial = { id: 'solstice_petals', count: 2 };
    result.logs.push(`📦 [RELIC]: You pop open the overgrown relic coffer! Obtained ${gold} Gold and rare Solstice Petals!`);
    result.effectText = `💎 +${gold} GOLD`;
    result.effectType = 'loot';
  } else if (type === 'salvage_barricade' || type === 'barricade') {
    result.statChanges.addMaterial = { id: 'mat_wood', count: 3 };
    result.statChanges.expChange = 15;
    result.logs.push(`🪵 [SALVAGE]: You dismantle the heavy wooden barricade, collecting 3x Timber Logs and clearing the choke point!`);
    result.effectText = `🪵 +3 WOOD`;
    result.effectType = 'loot';
  } else if (type === 'open_vault_chest' || type === 'vault_chest') {
    const gold = Math.floor(Math.random() * 80) + 120;
    result.statChanges.goldChange = gold;
    result.statChanges.expChange = 75;
    result.statChanges.addMaterial = { id: 'mat_refined_iron', count: 2 };
    result.logs.push(`👑 [CONQUEST VAULT]: You crack the reinforced iron vault chest! Discovered ${gold} Gold and 2x Refined Iron ingots!`);
    result.effectText = `👑 +${gold} GOLD / REFINED IRON`;
    result.effectType = 'loot';
  } else if (type === 'search_crate' || type === 'crate') {
    const gold = Math.floor(Math.random() * 40) + 40;
    result.statChanges.goldChange = gold;
    result.statChanges.expChange = 25;
    result.statChanges.addMaterial = { id: 'mat_tempered_scrap', count: 2 };
    result.logs.push(`📦 [CONTRABAND]: You pry open the cache crate! Found ${gold} Gold and 2x Tempered Metal Scrap.`);
    result.effectText = `🪙 +${gold} GOLD / SCRAP`;
    result.effectType = 'loot';
  } else if (type === 'drink_fountain' || type === 'fountain') {
    result.statChanges.hpChange = 35;
    result.statChanges.mpChange = 30;
    result.statChanges.exhaustionChange = -20;
    result.logs.push(`⛲ [FOUNTAIN]: You drink cold enchanted water from the obsidian fountain. Restored +35 HP, +30 MP, and quenched exhaustion!`);
    result.effectText = `💧 +35 HP / +30 MP`;
    result.effectType = 'heal';
  } else if (type === 'sun_dial' || type === 'align_sundial') {
    result.statChanges.dexChange = 1;
    result.logs.push(`☀️ [SUNDIAL]: You align the celestial sundial to sunlight. Gained permanent +1 Dexterity!`);
    result.effectText = `⚡ +1 DEX`;
    result.effectType = 'heal';
  } else if (type === 'bed' || type === 'rest_bed') {
    result.statChanges.hpChange = 1000;
    result.statChanges.mpChange = 1000;
    result.statChanges.exhaustionChange = -100;
    result.logs.push(`🛏️ [REST]: You rest comfortably on the feather bed. Health, Mana, and Stamina fully restored!`);
    result.effectText = `💤 FULLY RESTED`;
    result.effectType = 'heal';
  } else if (type === 'fireplace' || type === 'warm_hearth') {
    result.statChanges.hpChange = 20;
    result.statChanges.exhaustionChange = -15;
    result.logs.push(`🔥 [HEARTH]: You warm yourself by the crackling fire. Coldness dissipates and vitality returns (+20 HP)!`);
    result.effectText = `🔥 WARMED UP`;
    result.effectType = 'heal';
  } else if (type === 'herb_pot' || type === 'harvest_herbs') {
    result.statChanges.addMaterial = { id: 'kingsfoil', count: 2 };
    result.logs.push(`🪴 [HERBS]: You harvest fresh Kingsfoil herbs from the flower pot!`);
    result.effectText = `🌿 +2 KINGSFOIL`;
    result.effectType = 'heal';
  } else if (type === 'well' || type === 'drink_well') {
    result.statChanges.mpChange = 25;
    result.statChanges.exhaustionChange = -10;
    result.logs.push(`🚰 [WELL]: You draw a bucket of cool mountain spring water. Restored +25 MP and quenched thirst!`);
    result.effectText = `💧 +25 MP`;
    result.effectType = 'heal';
  } else if (type === 'notice_board' || type === 'inspect_board') {
    result.statChanges.expChange = 20;
    result.logs.push(`📜 [NOTICE]: You read the town notice board: 'Bounties awarded for clearing monsters in local dungeons. Trade caravans depart daily.' (+20 XP)`);
    result.effectText = `📜 NOTICES READ`;
    result.effectType = 'heal';
  } else if (type === 'feast_table' || type === 'eat_meal') {
    result.statChanges.hpChange = 30;
    result.statChanges.exhaustionChange = -25;
    result.logs.push(`🍞 [FEAST]: You enjoy a hearty tavern meal of fresh bread and roasted meats (+30 HP, -25 Exhaustion)!`);
    result.effectText = `🍖 +30 HP`;
    result.effectType = 'heal';
  } else {
    result.statChanges.expChange = 10;
    result.logs.push(`✨ [INSPECT]: You interact with ${prop.name}. Discovered subtle secrets!`);
    result.effectText = `✨ INSPECTED`;
    result.effectType = 'heal';
  }

  return result;
}
