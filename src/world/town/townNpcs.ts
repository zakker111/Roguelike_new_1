/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NPC } from '../../types';
import { prng } from '../../utils/overworld/overworldCore';

export function spawnTownNpcs(
  npcs: NPC[],
  chunkX: number,
  chunkY: number,
  width: number,
  height: number,
  midX: number,
  midY: number,
  housesList: any[],
  secondFloorBuildings: Set<string>,
  isPortTown: boolean,
  spawnedCats?: string[]
): void {
  const getNpcHomeCoords = (house: any, defaultOffsetX = 3, defaultOffsetY = 1) => {
    if (secondFloorBuildings.has(house.id)) {
      return {
        homeX: house.x + house.w - 2,
        homeY: house.y + 1,
        homeZ: 1
      };
    }
    return {
      homeX: house.x + defaultOffsetX,
      homeY: house.y + defaultOffsetY,
      homeZ: 0
    };
  };

  // 1. Blacksmith
  const blacksmithHomeIsShop = prng(chunkX, chunkY, 1111) > 0.4;
  const blacksmithHouse = housesList.find((h: any) => h.id === 'blacksmith') || housesList[0];
  const blacksmithWorkX = blacksmithHomeIsShop ? blacksmithHouse.x + 4 : midX - 3;
  const blacksmithWorkY = blacksmithHomeIsShop ? blacksmithHouse.y + 4 : midY - 3;
  const bsHome = getNpcHomeCoords(blacksmithHouse, 3, 1);

  npcs.push({
    id: `npc_blacksmith_${chunkX}_${chunkY}`,
    name: 'Grom Garison (Blacksmith)',
    role: 'blacksmith',
    char: 'B',
    originalChar: 'B',
    color: '#fb923c',
    x: blacksmithHouse.x + 3,
    y: blacksmithHouse.y + 3,
    z: 0,
    homeX: bsHome.homeX,
    homeY: bsHome.homeY,
    homeZ: bsHome.homeZ,
    workX: blacksmithWorkX,
    workY: blacksmithWorkY,
    workZ: 0,
    isHomeSameAsShop: blacksmithHomeIsShop,
    scheduleState: 'work',
    dialogue: [
      "Hey there! Need some heavy alloys? Mastercraft weapons are my specialty.",
      blacksmithHomeIsShop
        ? "My shop is also my home! I live in the back of this foundry so I can hammer steel at all hours."
        : "I live in the local stone house over there and walk to the town forge every single morning.",
      "Ah, the soot and heat... nothing beats working at the anvil.",
      "Zzz... No more orders tonight, let me sleep..."
    ]
  });

  // 2. Traveling Merchant
  const tavernHouse = housesList.find((h: any) => h.id === 'tavern') || housesList[0];
  const merchantHomeIsShop = prng(chunkX, chunkY, 2222) > 0.5;
  const merchantHouse = merchantHomeIsShop
    ? (housesList.find((h: any) => h.id === 'villager1' || h.id === 'villager2') || tavernHouse)
    : tavernHouse;
  const merchantWorkX = merchantHomeIsShop ? merchantHouse.x + 4 : midX + 3;
  const merchantWorkY = merchantHomeIsShop ? merchantHouse.y + 4 : midY - 2;
  const merHome = getNpcHomeCoords(merchantHouse, 3, 1);

  npcs.push({
    id: `npc_merchant_${chunkX}_${chunkY}`,
    name: 'Adelia Rose (Merchant)',
    role: 'merchant',
    char: 'M',
    originalChar: 'M',
    color: '#f43f5e',
    x: merchantHouse.x + 3,
    y: merchantHouse.y + 3,
    z: 0,
    homeX: merHome.homeX,
    homeY: merHome.homeY,
    homeZ: merHome.homeZ,
    workX: merchantWorkX,
    workY: merchantWorkY,
    workZ: 0,
    isHomeSameAsShop: merchantHomeIsShop,
    scheduleState: 'work',
    dialogue: [
      "Greetings, adventurer! Looking to trade? I sell rare armors, shields, and raw ores.",
      merchantHomeIsShop
        ? "This cozy cottage is both my home and my shop! I love living and selling under one roof."
        : "I rent a bed upstairs at the Tavern & Inn, then hike down here to my town square kiosk to sell goods.",
      "Deeper monsters carry spectacular loot. Bring me the scraps!",
      "Zzz... The shop is closed, come back in the morning."
    ]
  });

  // 3. Apothecary / Sage
  const apothecaryHomeIsShop = prng(chunkX, chunkY, 3333) > 0.3;
  const apothecaryHouse = housesList.find((h: any) => h.id === 'apothecary') || housesList[1];
  const apothecaryWorkX = apothecaryHomeIsShop ? apothecaryHouse.x + 4 : midX + 4;
  const apothecaryWorkY = apothecaryHomeIsShop ? apothecaryHouse.y + 4 : midY + 3;
  const apoHome = getNpcHomeCoords(apothecaryHouse, 3, 1);

  npcs.push({
    id: `npc_apothecary_${chunkX}_${chunkY}`,
    name: 'Valerius of the Markwell',
    role: 'apothecary',
    char: 'A',
    originalChar: 'A',
    color: '#a855f7',
    x: apothecaryHouse.x + 3,
    y: apothecaryHouse.y + 3,
    z: 0,
    homeX: apoHome.homeX,
    homeY: apoHome.homeY,
    homeZ: apoHome.homeZ,
    workX: apothecaryWorkX,
    workY: apothecaryWorkY,
    workZ: 0,
    isHomeSameAsShop: apothecaryHomeIsShop,
    scheduleState: 'work',
    dialogue: [
      "Dungeons are filled with dangerous gas and spikes... Drink a health potion to recover!",
      apothecaryHomeIsShop
        ? "This alchemical lab is my home! The scent of boiling mushrooms helps me sleep."
        : "I live here at the Apothecary, but walk over to my town square alchemy stand to sell daily.",
      "Have you seen the strange ruins out north?",
      "Zzz... Dreaming of spellcraft and starflowers..."
    ]
  });

  // 4. Tavern Master
  npcs.push({
    id: `npc_tavernmaster_${chunkX}_${chunkY}`,
    name: 'Innkeeper Barnaby',
    role: 'tavern_master' as any,
    char: 'T',
    originalChar: 'T',
    color: '#f59e0b',
    x: tavernHouse.x + 3,
    y: tavernHouse.y + 3,
    z: 0,
    homeX: tavernHouse.x + tavernHouse.w - 2,
    homeY: tavernHouse.y + 2,
    homeZ: 1,
    workX: tavernHouse.x + 5,
    workY: tavernHouse.y + 4,
    workZ: 0,
    isHomeSameAsShop: true,
    scheduleState: 'work',
    dialogue: [
      "Warm hearth, cold beer! Come take a rest, or browse our fresh baked goods!",
      "My home is the Tavern itself! I live in the back room and run the counter all day.",
      "Drunk brawls spill from the tavern quite often, keep an eye on active overworld events!",
      "Zzz... Sweep the floor for me, will you..."
    ]
  });

  // 5. Drunk Villager
  const isDrunkSpawned = prng(chunkX, chunkY, 1234) > 0.25;
  if (isDrunkSpawned) {
    const drunkNames = ['Drunk Seppo', 'Uncle Pete', 'Tipsy Toby', 'Loud Larry', 'Drunken Miller', 'Oakhaven Stumbler'];
    const drunkName = drunkNames[Math.floor(prng(chunkX, chunkY, 5678) * drunkNames.length)];
    npcs.push({
      id: `npc_drunkvillager_${chunkX}_${chunkY}`,
      name: `${drunkName} (Drunk Patron)`,
      role: 'drunk_villager' as any,
      char: '🥴',
      originalChar: '🥴',
      color: '#f43f5e',
      x: tavernHouse.x + 2,
      y: tavernHouse.y + 3,
      z: 0,
      homeX: tavernHouse.x + 2,
      homeY: tavernHouse.y + 1,
      homeZ: 1,
      workX: tavernHouse.x + 2,
      workY: tavernHouse.y + 3,
      workZ: 0,
      scheduleState: 'leisure',
      dialogue: [
        "Thiss tavern... is... spinny! Wait, is that a giant salmon in your pocket? Hic!",
        "I bet my left boot that Tobias is actually two goblins in a heavy leather trench coat!",
        "Another pint of that glowing lavender brew, Barnaby! *Burps*",
        "Zzz... No more tavern brawls... *mumbles about catalyst gems*"
      ]
    });
  }

  // 6. Strolling Villager
  const villagerHouse = housesList.find((h: any) => h.id === 'villager1') || housesList[3];
  const vilHome = getNpcHomeCoords(villagerHouse, 3, 1);

  npcs.push({
    id: `npc_villager_${chunkX}_${chunkY}`,
    name: 'Pip (Town Crier)',
    role: 'villager',
    char: 'V',
    originalChar: 'V',
    color: '#38bdf8',
    x: villagerHouse.x + 3,
    y: villagerHouse.y + 3,
    z: 0,
    homeX: vilHome.homeX,
    homeY: vilHome.homeY,
    homeZ: vilHome.homeZ,
    workX: midX - 4,
    workY: midY + 4,
    workZ: 0,
    scheduleState: 'work',
    dialogue: [
      "Hear ye, hear ye! Caves have appeared to the east and south!",
      "They say the dungeon crawls run 5 floors deep and contain a Forge Artifact!",
      "I love Oakhaven. It's safe... as long as we keep the town gates locked.",
      "Zzz... Just five more minutes..."
    ]
  });

  // 7. Town Notice Quest Board
  npcs.push({
    id: `npc_questboard_${chunkX}_${chunkY}`,
    name: 'Quest Board',
    role: 'quest_board' as any,
    char: '▤',
    originalChar: '▤',
    color: '#fbbf24',
    x: midX,
    y: midY - 2,
    z: 0,
    homeX: midX,
    homeY: midY - 2,
    homeZ: 0,
    workX: midX,
    workY: midY - 2,
    workZ: 0,
    scheduleState: 'work',
    dialogue: [
      "A heavy wooden post-board with pinned letters and bounty notices."
    ]
  });

  // 8. Recruitable Companion
  const companionHouse = housesList.find((h: any) => h.id === 'villager2') || housesList[4];
  const isGuard = (Math.abs(chunkX + chunkY) % 2 === 0);
  const compHome = getNpcHomeCoords(companionHouse, 3, 1);

  npcs.push({
    id: `npc_companion_${chunkX}_${chunkY}`,
    name: isGuard ? 'Arne (Shield Guard)' : 'Sade (Agile Thief)',
    role: 'companion_hire' as any,
    char: isGuard ? '🛡' : '🗡',
    originalChar: isGuard ? '🛡' : '🗡',
    color: isGuard ? '#60a5fa' : '#34d399',
    x: companionHouse.x + 3,
    y: companionHouse.y + 3,
    z: 0,
    homeX: compHome.homeX,
    homeY: compHome.homeY,
    homeZ: compHome.homeZ,
    workX: midX + 2,
    workY: midY + 4,
    workZ: 0,
    scheduleState: 'leisure',
    dialogue: isGuard
      ? ["I can watch your back and block blows. Hire me for 180 Gold!"]
      : ["Need lockpicks and critical backstabs? I can tag along for 180 Gold."]
  });

  // 9. Legendary Cats (Jekku, Pulla, Alli, Leevi)
  const catRoll = prng(chunkX, chunkY, 7772);
  const activeSpawnedCats = spawnedCats || [];
  
  if (catRoll < 0.015 && !activeSpawnedCats.includes('Jekku')) {
    npcs.push({
      id: `npc_cat_jekku`,
      name: 'Jekku (Legendary Cat)',
      role: 'special_cat' as any,
      char: '🐈',
      color: '#fb923c',
      x: midX - 2,
      y: midY + 1,
      homeX: midX - 2,
      homeY: midY + 1,
      workX: midX - 1,
      workY: midY + 2,
      scheduleState: 'leisure',
      dialogue: [
        "*Meow!* I am Jekku, the elusive orange trickster. I can guide your steps and keep you company!",
        "*Mew!* Let me join your party! I won't eat much scrap wood, I promise!",
        "*Purr...* (Nudges your ankles softly and chirps happily)"
      ]
    });
  } else if (catRoll >= 0.015 && catRoll < 0.030 && !activeSpawnedCats.includes('Pulla')) {
    npcs.push({
      id: `npc_cat_pulla`,
      name: 'Pulla (Legendary Cat)',
      role: 'special_cat' as any,
      char: '🐈',
      color: '#eab308',
      x: midX + 2,
      y: midY + 1,
      homeX: midX + 2,
      homeY: midY + 1,
      workX: midX + 1,
      workY: midY + 2,
      scheduleState: 'leisure',
      dialogue: [
        "*Prrrt!* I am Pulla, the chubby golden companion. Let's explore together!",
        "*Meow...* Do you have any fresh grilled fish? Just kidding, I'll follow you anyway!",
        "*Purr...* (Rolls over showing a fluffy, warm belly)"
      ]
    });
  } else if (catRoll >= 0.030 && catRoll < 0.045 && !activeSpawnedCats.includes('Alli')) {
    npcs.push({
      id: `npc_cat_alli`,
      name: 'Alli (Legendary Cat)',
      role: 'special_cat' as any,
      char: '🐈',
      color: '#cbd5e1',
      x: midX,
      y: midY + 2,
      homeX: midX,
      homeY: midY + 2,
      workX: midX,
      workY: midY + 3,
      scheduleState: 'leisure',
      dialogue: [
        "*Miau!* I am Alli, the mystical silver cat. The depths hold no fear for me.",
        "*Meow!* I can follow you into the dark abyss. Shall we go?",
        "*Purr...* (Blinks slowly with wise, glowing eyes)"
      ]
    });
  } else if (catRoll >= 0.045 && catRoll < 0.060 && !activeSpawnedCats.includes('Leevi')) {
    npcs.push({
      id: `npc_cat_leevi`,
      name: 'Leevi (Legendary Cat)',
      role: 'special_cat' as any,
      char: '🐈',
      color: '#f43f5e',
      x: midX,
      y: midY - 2,
      homeX: midX,
      homeY: midY - 2,
      workX: midX + 1,
      workY: midY - 1,
      scheduleState: 'leisure',
      dialogue: [
        "*Hiss!* I am Leevi, the eternally angry cat. Touch me and you lose a finger!",
        "*Growl...* What are you staring at, adventurer? Fine, I'll follow you. But don't expect any cuddles!",
        "*Mrowr!* (Glares at you with intense, fiery yellow eyes and swishes his tail aggressively)"
      ]
    });
  }

  // 10. Port Nautical Crew
  if (isPortTown) {
    npcs.push({
      id: `npc_captain_${chunkX}_${chunkY}`,
      name: 'Captain Jack (Harbor Master)',
      role: 'harbor_master' as any,
      char: '⚓',
      color: '#2dd4bf',
      x: width - 16,
      y: midY - 6,
      homeX: width - 17,
      homeY: midY - 5,
      workX: width - 16,
      workY: midY - 6,
      scheduleState: 'work',
      dialogue: [
        "Ahoy, traveler! I oversee vessel registrations, nautical charts, and sea port logistics.",
        "Looking for fresh salted cod, whale oil, or coastal sea charts? Check our harbor inventory!",
        "I can also arrange ferried passage across the coastal bays for 200 Gold.",
        "Zzz... Restful sleep after a day at the harbor desk..."
      ]
    });

    npcs.push({
      id: `npc_fishmonger_${chunkX}_${chunkY}`,
      name: 'Finnegan (Fishmonger)',
      role: 'fishmonger' as any,
      char: '🐟',
      color: '#38bdf8',
      x: width - 16,
      y: midY + 3,
      homeX: width - 16,
      homeY: midY + 3,
      workX: width - 16,
      workY: midY + 3,
      scheduleState: 'work',
      dialogue: [
        "Fresh harbor catch and salted ocean cod! Direct from the fishing trawlers!",
        "Inland desert merchants pay massive gold for salted cod. Stock up before you travel!",
        "Smell that fresh ocean breeze? Nothing better than a early morning catch.",
        "Zzz... The fish stop biting at night..."
      ]
    });

    npcs.push({
      id: `npc_dockworker_${chunkX}_${chunkY}`,
      name: 'Bram (Dockworker)',
      role: 'dockworker' as any,
      char: '📦',
      color: '#f59e0b',
      x: width - 11,
      y: midY - 3,
      homeX: width - 11,
      homeY: midY - 3,
      workX: width - 11,
      workY: midY - 3,
      scheduleState: 'work',
      dialogue: [
        "Heave-ho! Heavy barrels of ship pitch and refined whale oil coming off the ships!",
        "We operate the harbor cranes day and night to keep international trade moving.",
        "Watch your step on the wet wooden pier planks—they're slick with ocean spray!",
        "Zzz... My shoulders ache from carrying iron anchors..."
      ]
    });

    npcs.push({
      id: `npc_sailor_${chunkX}_${chunkY}`,
      name: 'Seabert (Old Sailor)',
      role: 'sailor' as any,
      char: '⛵',
      color: '#a78bfa',
      x: width - 4,
      y: midY - 9,
      homeX: width - 4,
      homeY: midY - 9,
      workX: width - 4,
      workY: midY - 9,
      scheduleState: 'work',
      dialogue: [
        "Ahoy! The HMS Tidebreaker is tied up at the north pier after battling heavy fog.",
        "I've sailed from glacial northern tundras to scorching desert reef bays. Sunder's waters are wild!",
        "Need waterproof ship pitch for your boots or gear? I've got spare jars.",
        "Zzz... Rocked to sleep by gentle ocean waves..."
      ]
    });

    npcs.push({
      id: `npc_ferried_nav_${chunkX}_${chunkY}`,
      name: 'Corin (Ferried Navigator)',
      role: 'ferried_navigator' as any,
      char: '🧭',
      color: '#10b981',
      x: width - 3,
      y: midY - 2,
      homeX: width - 3,
      homeY: midY - 2,
      workX: width - 3,
      workY: midY - 2,
      scheduleState: 'work',
      dialogue: [
        "Greetings, traveler! I pilot the ferried passage between Vanguard Harbor and East Port for 200 Gold.",
        "My nautical sea charts plot every safe channel around coastal reefs and whirlpools.",
        "Speak to me whenever you are ready to set sail!",
        "Zzz... Anchored until daybreak..."
      ]
    });
  }
}
