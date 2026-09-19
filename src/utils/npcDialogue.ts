import { NPC } from '../types';
import dialoguesData from '../data/dialogues.json';

export interface DialogueCatalog {
  dialogues: Record<string, string[]>;
  quests: Array<{
    id: string;
    title: string;
    description: string;
    objectiveCount: number;
    rewardGold: number;
    rewardXp: number;
  }>;
}

export const DIALOGUES_CATALOG: DialogueCatalog = dialoguesData as DialogueCatalog;

export function getRoleBaseDialogue(role: string): string[] {
  const normalizedRole = role.toLowerCase();
  for (const [key, lines] of Object.entries(DIALOGUES_CATALOG.dialogues)) {
    if (normalizedRole.includes(key)) {
      return lines;
    }
  }
  return [];
}

export interface DialogueContext {
  weather?: string;
  gameTime?: number; // 0-1439
  biome?: string;
  season?: string;
  townReputation?: number;
}

export function getTimeOfDayLabel(gameTime?: number): 'morning' | 'noon' | 'evening' | 'night' {
  if (gameTime === undefined) return 'noon';
  const hours = Math.floor(gameTime / 60) % 24;
  if (hours >= 5 && hours < 11) return 'morning';
  if (hours >= 11 && hours < 17) return 'noon';
  if (hours >= 17 && hours < 22) return 'evening';
  return 'night';
}

/**
 * Returns contextual weather dialogue tailored to the NPC role, weather, time of day, and biome.
 */
export function getWeatherTimeContextDialogue(npc: NPC, context: DialogueContext): string[] {
  const { weather = 'clear', gameTime = 720, biome = 'forest', season = 'spring' } = context;
  const timeOfDay = getTimeOfDayLabel(gameTime);
  const role = npc.role?.toLowerCase() || 'villager';

  const lines: string[] = [];

  // Weather-specific opening statement
  if (weather === 'rainy') {
    if (role.includes('blacksmith')) {
      lines.push("The moisture in the air keeps the charcoal coals damp, but the forge fire burns hot regardless!");
      lines.push("Mind the rain on your steel blade, traveler. Wipe off water to prevent rust!");
    } else if (role.includes('merchant')) {
      lines.push("Rainy days slow the trade caravans down, but my shop canopy keeps our goods nice and dry.");
      lines.push("A stout pair of boots or a warm cloak is worth its weight in gold in this downpour!");
    } else if (role.includes('guard')) {
      lines.push("Standing watch in full chainmail during a heavy rain is miserable work. Keep your head low.");
      lines.push("Outlaws love hiding in the rainstorms. Stay alert out on the muddy roads.");
    } else if (role.includes('fisherman') || role.includes('dockworker') || role.includes('sailor') || role.includes('fishmonger') || role.includes('harbor_master') || role.includes('ferried_navigator')) {
      lines.push("The fish are biting near the harbor docks today! Rain brings the deep-water trout right to the surface.");
      lines.push("Slippery harbor planks are treacherous in this downpour. Watch your step near the tide line.");
      lines.push("Rain won't stop the dock cranes! We've got barrels of salted cod and whale oil to unload.");
    } else if (role.includes('tavern') || role.includes('bartender')) {
      lines.push("Come inside out of the rain! The hearth fire is roaring and the spiced mead is hot.");
      lines.push("Nothing beats a dry bench and a hearty stew while rain patters on the roof.");
    } else {
      lines.push("This rain hasn't stopped all morning! I hope the river doesn't overflow its banks.");
      lines.push("The crops love the water, but my boots are completely soaked through.");
    }
  } else if (weather === 'blizzard' || weather === 'snowy') {
    if (role.includes('blacksmith')) {
      lines.push("Hah! The furnace is the warmest spot in the entire settlement in this blizzard!");
      lines.push("Cold steel turns brittle in sub-zero frost. Let me temper your gear with extra carbon.");
    } else if (role.includes('merchant')) {
      lines.push("The mountain passes are completely blocked with snow! Get your winter supplies while stock lasts.");
      lines.push("Trading in a blizzard is tough, but a true merchant never closes shop.");
    } else if (role.includes('guard')) {
      lines.push("I can barely see five paces through this blinding snow. Keep your torch lit!");
      lines.push("Frost wolves get desperate and bold during heavy blizzards. Don't wander alone into the drifts.");
    } else if (role.includes('fisherman') || role.includes('dockworker') || role.includes('sailor')) {
      lines.push("The harbor bay is icing over! Boats are tied up tight until the blizzard passes.");
      lines.push("I had to chop through two inches of ice near the quay just to check the net lines.");
    } else if (role.includes('tavern') || role.includes('bartender')) {
      lines.push("Step in before you freeze into an icicle! Warm ale and hot hearth bread on the house!");
      lines.push("The wind is howling like a frost demon out there. Best stay inside until morning.");
    } else {
      lines.push("Brrr! The frost is creeping right through the window seals today.");
      lines.push("Keep close to the fires! A blizzard in Sunder is no joke for unarmored folk.");
    }
  } else if (weather === 'sandstorm') {
    if (role.includes('guard')) {
      lines.push("Gah! Sand in my eyes and armor joints! Wrap your face tight before heading outside.");
      lines.push("Visiblity is zero in these desert gales. Bandit raiders love striking during sandstorms.");
    } else if (role.includes('merchant')) {
      lines.push("Cover the spice jars and silk bundles! The sandstorm is blowing dust into everything!");
      lines.push("Desert caravans pull over and set up tents when the gales howl like this.");
    } else {
      lines.push("Cover your face! Sandstorms in the arid wastes can strip paint right off wood.");
      lines.push("Seeking shelter indoors is the only wise choice until the desert winds calm down.");
    }
  } else if (weather === 'foggy') {
    if (role.includes('guard')) {
      lines.push("The mist is thick as pea soup today. I can hear footfalls before I see faces.");
      lines.push("Keep your weapon ready. Undead and swamp lurkers thrive in dense fog.");
    } else if (role.includes('fisherman') || role.includes('sailor')) {
      lines.push("Foghorns are sounding across the harbor. Ships drop anchor until the mist clears.");
      lines.push("Eerie shadows drift across the water when fog rolls in from the deep sea.");
    } else {
      lines.push("You can hardly see the watchtower through this heavy mist today.");
      lines.push("Misty days always bring unsettling rumors from the forest edges.");
    }
  } else {
    // Clear / pleasant weather
    if (timeOfDay === 'morning') {
      lines.push("Good morning, traveler! Clear skies bring good fortune to hardworking folk.");
      lines.push("The sun is rising over Sunder. Perfect weather for exploring or hunting.");
    } else if (timeOfDay === 'evening') {
      lines.push("Evening comes early, but the twilight sky is calm and peaceful.");
      lines.push("A fine clear day comes to an end. Time to wind down at the tavern soon.");
    } else if (timeOfDay === 'night') {
      lines.push("The night air is crisp under the starry sky. Stay vigilant in the dark.");
      lines.push("Clear night, but watch the shadows beyond the street lanterns.");
    } else {
      lines.push("A beautiful clear day in the settlement! Trade and work are moving smoothly.");
      lines.push("Clear weather makes for clear roads. Safe travels across Sunder!");
    }
  }

  // Add default role dialogue fallback if needed
  if (npc.dialogue && npc.dialogue.length > 0) {
    lines.push(...npc.dialogue);
  }

  return lines;
}

/**
 * Returns quick ambient chat bark for town NPCs reacting to weather or events.
 */
export function getWeatherAmbientBark(npc: NPC, weather: string, timeOfDay: string): string {
  const name = npc.name.split(' (')[0];
  const role = (npc.role || 'villager').toLowerCase();

  if (weather === 'rainy') {
    if (role.includes('guard') || role.includes('archer') || role.includes('swordsman')) {
      return `${name}: "Standing watch in this downpour is miserable... Keep steel dry to prevent rust!"`;
    } else if (role.includes('blacksmith')) {
      return `${name}: "Rain hitting the hot anvil creates a blinding cloud of steam in the forge!"`;
    } else if (role.includes('merchant') || role.includes('fishmonger') || role.includes('apothecary')) {
      return `${name}: "Cover the display stalls! Heavy rain will ruin the dry spices and wares!"`;
    } else if (role.includes('dockworker') || role.includes('sailor') || role.includes('harbor_master') || role.includes('ferried_navigator')) {
      return `${name}: "Slippery pier planks in this downpour! Watch your step near the tide line."`;
    }
    return `${name}: "Gah, this heavy rain is soaking my clothes through! Seeking shelter!"`;
  } else if (weather === 'blizzard' || weather === 'snowy') {
    if (role.includes('guard') || role.includes('archer') || role.includes('swordsman')) {
      return `${name}: "Freezing blizzard patrol! Shields up against the biting gale!"`;
    } else if (role.includes('blacksmith')) {
      return `${name}: "Biting blizzard outside, but my forge hearth keeps the smithy warm and bright!"`;
    } else if (role.includes('merchant') || role.includes('fishmonger')) {
      return `${name}: "Blizzard's blocking the mountain trade passes! Cargo caravans will be delayed."`;
    } else if (role.includes('dockworker') || role.includes('sailor') || role.includes('harbor_master')) {
      return `${name}: "The harbor bay is icing over! Boats are tied up tight until the blizzard passes."`;
    }
    return `${name}: "Brrr! My fingers are freezing in this blizzard! Need to get inside near the hearth fire!"`;
  } else if (weather === 'sandstorm') {
    if (role.includes('guard')) {
      return `${name}: "Howling sandstorm! Squinting through the blowing dust for desert outlaws."`;
    } else if (role.includes('merchant') || role.includes('fishmonger')) {
      return `${name}: "Securing the cargo tarps before the sandstorm buries the wares!"`;
    }
    return `${name}: "Blowing sandstorm grit in my eyes! Heading under cover until the storm blows over!"`;
  } else if (weather === 'foggy') {
    if (role.includes('guard')) {
      return `${name}: "Thick fog rolling in... Stay sharp at the town gates!"`;
    } else if (role.includes('sailor') || role.includes('harbor_master') || role.includes('ferried_navigator')) {
      return `${name}: "Foghorns blaring across the harbor quay... Ships drop anchor until visibility returns."`;
    }
    return `${name}: "Can't see five steps ahead in this thick mist..."`;
  } else if (timeOfDay === 'night') {
    return `${name}: "Night falls... time to head indoors and keep close to the lantern light."`;
  }
  return `${name}: "Fine day in town today!"`;
}

/**
 * Returns a tavern drinking / bar sitting ambient bark.
 */
export function getTavernDrinkingBark(npc: NPC): string {
  const name = npc.name.split(' (')[0];
  const barks = [
    `${name}: "Cheers! Nothing beats a cold pint of spiced mead at the tavern bar!"`,
    `${name}: "Ah... Sitting down at the bar stool to rest my feet after a long day."`,
    `${name}: "The tavern hearth fire is roaring and the ale is flowing fast tonight!"`,
    `${name}: "*Sip...* Ah! The innkeeper brews the finest dwarven stout in Sunder."`,
    `${name}: "Pass the flagon! A tavern song and a dark ale fix any trouble."`
  ];
  const idx = Math.abs((npc.id || name).charCodeAt(0) + Date.now()) % barks.length;
  return barks[idx];
}

/**
 * Returns a cozy outdoor campfire gathering ambient bark at dusk.
 */
export function getCampfireDialogueBark(npc: NPC): string {
  const name = npc.name.split(' (')[0];
  const barks = [
    `${name}: "Ah, huddling around the crackling campfire at dusk... warmth feels incredible after a long day!"`,
    `${name}: "*Warms hands by the glowing coals* There's nothing like good company around the evening campfire."`,
    `${name}: "Sharing tall tales and roasting spiced meats over the campfire embers..."`,
    `${name}: "*Humming a soft folk melody* The night air is cool, but this campfire circle keeps us warm."`,
    `${name}: "Watch the sparks fly up into the twilight sky! Rest well, traveler."`
  ];
  const idx = Math.abs((npc.id || name).charCodeAt(0) + Date.now()) % barks.length;
  return barks[idx];
}

/**
 * Returns an urgent blizzard / storm shelter seeking bark.
 */
export function getBlizzardShelterBark(npc: NPC): string {
  const name = npc.name.split(' (')[0];
  const barks = [
    `${name}: "*Shivering uncontrollably* Brrr! This blizzard is freezing me to the bone! Heading straight indoors for the hearth!"`,
    `${name}: "The howling gale is brutal! Get inside the tavern or house before frostbite sets in!"`,
    `${name}: "I can't feel my fingers in this snowstorm! Seeking warmth by the indoor fireside!"`,
    `${name}: "The wind is blinding! Hurry indoors before the blizzard seals the doors!"`
  ];
  const idx = Math.abs((npc.id || name).charCodeAt(0) + Date.now()) % barks.length;
  return barks[idx];
}

/**
 * Returns dynamic, weather and environment aware regional rumors and lore.
 */
export function getRegionalRumorAndGossip(context: DialogueContext): string {
  const { weather = 'clear', biome = 'forest', season = 'spring' } = context;

  const baseRumors = [
    "The Deep Abyss dungeons hold ancient artifacts, but tread lightly past floor 5.",
    "Bandits frequently raid the trade routes between Sunder and the Vanguard Fortress.",
    "Ancient shrines grant powerful elemental blessings if you make a small offering.",
    "Controlling watchtowers generates steady passive revenue for your faction guild.",
    "The harbor master at the port pays top gold for salted cod and whale oil.",
    "Merchant Seppo's rare inventory refreshes whenever new caravans enter town."
  ];

  const weatherRumors: string[] = [];

  if (weather === 'rainy') {
    weatherRumors.push("Local fishermen say thunder spirits appear in coastal bays during heavy rainstorms.");
    weatherRumors.push("Swamp herbs grow twice as fast after a downpour—herbalists are flocking to the marshes.");
  } else if (weather === 'blizzard' || weather === 'snowy') {
    weatherRumors.push("Frost giants have been sighted descending from the northern glaciers in this blizzard.");
    weatherRumors.push("The frozen harbors are forcing sea traders to sell their cargo at steep discounts in port.");
  } else if (weather === 'sandstorm') {
    weatherRumors.push("Desert gales uncover buried tombs in the dunes, but sand-scorpions crawl out too.");
  } else if (weather === 'foggy') {
    weatherRumors.push("Siren songs echo through coastal fogs—sailors who follow them are never seen again.");
  }

  if (biome === 'swamp') {
    weatherRumors.push("The Nakki water demons lurk in deep marsh pools, dragging unwary travelers under.");
  } else if (biome === 'tundra') {
    weatherRumors.push("Northern ice-caves hide ancient mithril ore veins frozen deep beneath the glacier.");
  }

  const combined = [...weatherRumors, ...baseRumors];
  return combined[Math.floor(Math.random() * combined.length)];
}

/**
 * Contextual bark when town alarm sounds due to approaching hostiles or gate breaches.
 */
export function getTownAlarmReactionBark(npc: NPC, threatName?: string): string {
  const name = npc.name.split(' (')[0];
  const role = (npc.role || 'villager').toLowerCase();
  const monster = threatName || 'hostiles';

  if (role.includes('guard') || role.includes('vanguard')) {
    return `${name}: "To arms! ${monster} approaching the perimeter! Hold the gatehouse line!"`;
  }
  if (role.includes('blacksmith')) {
    return `${name}: "Sound the muster bell! I'll keep the forge hammers ready for defense!"`;
  }
  if (role.includes('merchant') || role.includes('apothecary')) {
    return `${name}: "Barricade the shop shutters! The guards have engaged ${monster} outside!"`;
  }
  return `${name}: "The alarm horn! Get behind the fortress walls before ${monster} break through!"`;
}

/**
 * Contextual bark acknowledging the player's faction reputation standing.
 */
export function getFactionStandingBark(npc: NPC, reputation: number, factionName?: string): string {
  const name = npc.name.split(' (')[0];
  const fName = factionName || 'the settlement';

  if (reputation >= 50) {
    // Revered / Honored
    return `${name}: "Hail, champion! Word of your deeds for ${fName} inspires everyone here."`;
  }
  if (reputation >= 20) {
    // Friendly
    return `${name}: "Good to see you again, friend. The people of ${fName} hold you in high regard."`;
  }
  if (reputation <= -30) {
    // Hated / Criminal
    return `${name}: "*Glares warily, hand on knife* Watch yourself... You aren't welcome in ${fName}."`;
  }
  if (reputation < 0) {
    // Suspicious
    return `${name}: "*Eyes you cautiously* We have enough trouble without outlaws causing a stir."`;
  }
  return `${name}: "Greetings, wanderer. Mind the peace within town borders."`;
}

/**
 * Stray animal shelter emotes during severe weather.
 */
export function getAnimalShelterBark(npc: NPC, weather: string): string {
  const isCat = npc.id?.startsWith('npc_cat_') || npc.role === 'special_cat';
  if (weather === 'blizzard' || weather === 'snowy') {
    return isCat
      ? `🐱 ${npc.name} curls into a tight ball by the warm hearth fire, shivering softly against the frost.`
      : `🐾 The animal huddles closely under the eaves, sheltering from the biting blizzard.`;
  }
  if (weather === 'rainy') {
    return isCat
      ? `🐱 ${npc.name} shakes cold raindrops from its fur and nestles comfortably under the tavern bench.`
      : `🐾 The animal ducks beneath the wooden canopy to escape the muddy downpour.`;
  }
  if (weather === 'sandstorm') {
    return isCat
      ? `🐱 ${npc.name} tucks its paws beneath its chest, squinting away from the blowing sand.`
      : `🐾 The animal hunkers down behind a stone wall, safe from the desert gale.`;
  }
  return isCat
    ? `🐱 ${npc.name} purrs softly, dozing on a sun-warmed floor tile.`
    : `🐾 The stray animal rests peacefully in the quiet corner.`;
}

/**
 * Morning routine opening barks at dawn.
 */
export function getMorningRoutineBark(npc: NPC): string {
  const name = npc.name.split(' (')[0];
  const role = (npc.role || 'villager').toLowerCase();

  if (role.includes('blacksmith')) {
    return `${name}: "Dawn breaks! Time to stoke the furnace coals and get the forge anvil ringing."`;
  }
  if (role.includes('merchant') || role.includes('fishmonger')) {
    return `${name}: "Fresh morning shipments arrived! Setting out the display stalls for the day."`;
  }
  if (role.includes('guard')) {
    return `${name}: "Morning shift taking over the watchtowers. Safe skies over the realm today."`;
  }
  if (role.includes('apothecary')) {
    return `${name}: "Brewing morning restoratives before the daily rush begins."`;
  }
  return `${name}: "The morning bell rings! Time to head to the stalls and start the day's work."`;
}
