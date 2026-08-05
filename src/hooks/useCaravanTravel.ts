import React from 'react';
import { GameState, CaravanTravelState, CaravanEncounter } from '../types';
import { generateRandomCaravanEncounter } from '../utils/caravanEncounters';
import { generateOverworldChunk, formatGameTime } from '../utils/overworld';
import { computeFOV } from '../utils/ai';
import { spawnFollowersOnLevelLoadByReset } from '../utils/dungeon';
import { LEVEL_WIDTH, LEVEL_HEIGHT, findNearestSafePlayerTile, isLunarBlessingActive, getEffectiveAttribute } from '../utils/gameUtils';

interface UseCaravanTravelOptions {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (msg: string, type?: string) => void;
  playSound: (sound: string) => void;
}

export function useCaravanTravel({ setGameState, addLogMessage, playSound }: UseCaravanTravelOptions) {
  const handleStartCaravanTravel = (destX: number, destY: number, destName: string) => {
    playSound('levelUp');
    setGameState((prev) => {
      const distance = Math.max(Math.abs(destX - prev.currentChunkX), Math.abs(destY - prev.currentChunkY));
      const totalSteps = Math.max(1, distance * 2);
      const reward = 100 + distance * 80;

      const nextTravel: CaravanTravelState = {
        active: true,
        originX: prev.currentChunkX,
        originY: prev.currentChunkY,
        destX,
        destY,
        destName,
        totalSteps,
        currentStep: 0,
        stepsHistory: ["🏕️ Caravan gathers. Baron Tobias checks the heavy iron axles. 'Ready to roll, guard! Keep your hand on your sword hilt!'"],
        rewardGold: reward,
        currentEncounter: null
      };
      
      return {
        ...prev,
        activeTradeNpcId: null, // close trade menu
        caravanTravel: nextTravel
      };
    });

    addLogMessage(`🛡️ [ESCORT INITIATED]: Accompanying caravan to ${destName}! Safe journey!`, 'loot');
  };

  const handleAdvanceCaravanTravel = () => {
    playSound('slash');
    setGameState((prev) => {
      const travel = prev.caravanTravel;
      if (!travel) return prev;

      let nextStep = travel.currentStep + 1;
      const history = [...travel.stepsHistory];

      if (isLunarBlessingActive(prev, 'waxing_crescent') && Math.random() < 0.20 && nextStep < travel.totalSteps) {
        nextStep += 1;
        history.push(`✨ [LUNAR SWIFTNESS]: Stardust Swiftness Blessing speeds up the draft horses, skipping a tedious leg of the journey!`);
      }

      const descriptions = [
        "The heavy iron-reinforced wheels creak as the horses pull the massive wagons up a steep, pine-covered mountain ridge.",
        "A cool forest breeze blows through the caravan canvas. You walk alongside the archers, keeping a keen watch on the treeline.",
        "Baron Tobias hands you a flask of frothy ale. 'Good pace today! No bandit raiders in sight... yet.'",
        "The travelers sing a traditional dwarven road ballad to pass the hours as the shadow of distant mountains grows larger.",
        "You stop briefly by a crystalline creek to water the drafts. The caravan scouts check the pathway ahead for tracks.",
        "A low fog rolls over the dirt road. The caravan guards light their bronze torches, whispering of forest ghosts.",
        "Screeches of wild birds echo from the crags. You adjust your grip on your shield, feeling the wind turn cold."
      ];
      
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
      history.push(`📍 [Step ${nextStep}/${travel.totalSteps}]: ${desc}`);

      let encounter: CaravanEncounter | null = null;
      if (nextStep < travel.totalSteps && Math.random() < 0.85) {
        encounter = generateRandomCaravanEncounter(prev.biome || 'forest', prev);
        history.push(`🚨 EVENT TRIPPED: ${encounter.title}! Journey halted.`);
      }

      const updatedTravel: CaravanTravelState = {
        ...travel,
        currentStep: nextStep,
        stepsHistory: history,
        currentEncounter: encounter
      };

      return {
        ...prev,
        caravanTravel: updatedTravel
      };
    });
  };

  const handleResolveCaravanEncounterOption = (optionId: string) => {
    playSound('click');
    setGameState((prev) => {
      const travel = prev.caravanTravel;
      if (!travel || !travel.currentEncounter) return prev;

      const encounter = travel.currentEncounter;
      const option = encounter.options.find(o => o.id === optionId);
      if (!option) return prev;

      if (option.costGold && prev.playerStats.gold < option.costGold) {
        playSound('bump');
        return prev;
      }

      if (option.costItems) {
        let hasEnough = true;
        for (const itemCost of option.costItems) {
          const currentCount = prev.inventoryMaterials[itemCost.id] || 0;
          if (currentCount < itemCost.count) {
            hasEnough = false;
          }
        }
        if (!hasEnough) {
          playSound('bump');
          return prev;
        }
      }

      let nextGold = prev.playerStats.gold;
      if (option.costGold) {
        nextGold -= option.costGold;
      }

      const nextMats = { ...prev.inventoryMaterials };
      if (option.costItems) {
        option.costItems.forEach(itemCost => {
          nextMats[itemCost.id] = Math.max(0, (nextMats[itemCost.id] || 0) - itemCost.count);
        });
      }

      let d20 = 0;
      let modifier = 0;
      let totalRoll = 0;
      let isSuccess = true;
      let resultLog = '';
      let hpChange = 0;
      let xpGained = 0;
      let exhaustionChange = 0;

      const playerStats = prev.playerStats;

      if (option.statCheck) {
        d20 = Math.floor(Math.random() * 20) + 1;
        const attrVal = getEffectiveAttribute(prev, option.statCheck);
        modifier = Math.floor((attrVal - 10) / 2);
        totalRoll = d20 + modifier;
        isSuccess = totalRoll >= (option.difficulty || 10);
      }

      if (encounter.type === 'bandit_ambush') {
        if (option.id === 'fight') {
          if (isSuccess) {
            xpGained = 60;
            const rewardGold = 75;
            nextGold += rewardGold;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You draw your steel weapon and leap over the wagons. With a whirlwind strike, you cut down the bandit vanguard. The remaining outlaws flee, dropping a coin pouch! Gained +${xpGained} XP and +${rewardGold} Gold.`;
          } else {
            hpChange = -28;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! You charge the bandits but they hurl spike iron traps and fire crossbolts. You block several with your shield, but one grazes your thigh before they retreat. Lost -28 HP.`;
          }
        } else if (option.id === 'intimidate') {
          if (isSuccess) {
            xpGained = 40;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You step forward, ignite a magic spark, and threaten the captain with slow combustion. Terrified of your fearsome reputation, they pack up their spike strip and scurry off! Gained +${xpGained} XP.`;
          } else {
            hpChange = -16;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! They laugh at your threats. "Big words, tiny traveler!" They hurl a jagged throwing axe, grazing your shoulder before Baron Tobias's guards open fire. Lost -16 HP.`;
          }
        } else if (option.id === 'pay') {
          resultLog = `🤝 You count out 500 shiny gold coins and toss them to the bandit captain. Baron Tobias sighs. "An expensive road tax, but we live to trade another day." Paid 500 Gold.`;
        }
      } else if (encounter.type === 'beast_attack') {
        if (option.id === 'fight') {
          if (isSuccess) {
            xpGained = 50;
            nextMats['mat_raw_meat'] = (nextMats['mat_raw_meat'] || 0) + 2;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You intercept the lead alpha wolf, hacking it down with a swift strike. The rest of the pack panics and retreats back into the thick dark woodlands. Gained +${xpGained} XP and +2 Raw Meat.`;
          } else {
            hpChange = -22;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! A dire wolf lunges from behind, biting deep into your arm before you shake it off. Lost -22 HP.`;
          }
        } else if (option.id === 'feed') {
          xpGained = 35;
          resultLog = `🥩 You pull out your stashed Wild Berries and throw them on the road. The starving wolves eagerly fight over the forest harvest, completely ignoring the horses. The carriage rolls past safely! Gained +${xpGained} XP.`;
        } else if (option.id === 'intimidate') {
          if (isSuccess) {
            xpGained = 45;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You let out a terrifying, earth-shaking war cry, slamming your weapon against your breastplate. Shocked by your raw aura, the wolves tuck their tails and flee! Gained +${xpGained} XP.`;
          } else {
            hpChange = -18;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The wolves are too starved to care about your roars. They lunge in, biting your leg before being driven back by the caravan scouts. Lost -18 HP.`;
          }
        }
      } else if (encounter.type === 'obstacle') {
        if (option.id === 'push') {
          if (isSuccess) {
            xpGained = 40;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You plant your feet on the gravel road and leverage your colossal strength. With a loud grunt, you roll the massive boulder down the mountain cliffside, clearing the road! Gained +${xpGained} XP.`;
          } else {
            hpChange = -15;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! You strain your back muscles attempting to heave the giant rock. You manage to shift it just enough for the wagon to squeeze past, but your muscles ache. Lost -15 HP.`;
          }
        } else if (option.id === 'leverage') {
          if (isSuccess) {
            xpGained = 45;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You analyze the boulder's balance point and build a timber fulcrum lever. With minimal physical effort, you slide the stone out of the path! Gained +${xpGained} XP.`;
          } else {
            hpChange = -10;
            exhaustionChange = 25;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The wooden lever snaps under the boulder's weight. You are forced to dig it out manually, causing physical strain. Lost -10 HP and gained +25% Exhaustion.`;
          }
        } else if (option.id === 'detour') {
          if (isSuccess) {
            xpGained = 35;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Following a lucky deer trail, you guide the carriage through a beautiful forest bypass, completely avoiding the rockslide. Gained +${xpGained} XP.`;
          } else {
            exhaustionChange = 45;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The detour leads into a swampy marsh. The carriage gets stuck, and everyone spends hours pushing it out in the rain. Gained +45% Exhaustion.`;
          }
        }
      } else if (encounter.type === 'pilgrim') {
        if (option.id === 'bless') {
          resultLog = `✨ The road priest touches your forehead and murmurs a chant of the old gods. A warm golden vapor wraps around you. Your health, mana, and fatigue are completely restored!`;
        } else if (option.id === 'wisdom') {
          if (isSuccess) {
            xpGained = 80;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You discuss the lore of the Sunder Outlaws and the ancient dungeons. The priest is highly impressed by your intellect and shares forgotten runes of power. Gained +${xpGained} XP.`;
          } else {
            xpGained = 20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Your knowledge of old mythology is a bit rusty. The priest smiles gently and offers some simpler guidance. Gained +20 XP.`;
          }
        }
      } else if (encounter.type === 'wheel_break') {
        if (option.id === 'repair_metal') {
          xpGained = 50;
          resultLog = `🔨 You place the cracked iron band on an anvil block and forge-weld a reinforcement. The wagon axle is now stronger than before! Gained +${xpGained} XP. Used 8 Iron Ore.`;
        } else if (option.id === 'repair_lumber') {
          xpGained = 40;
          resultLog = `🌲 Using your stashed wood planks, you carve a solid timber splint to bind the broken axle. It holds perfectly. Gained +${xpGained} XP. Used 18 Wood Planks.`;
        } else if (option.id === 'wait_fix') {
          exhaustionChange = 35;
          resultLog = `⏳ Lacking materials, you spend hours carving and tying green branches to support the wheel. The caravan gets moving again, but you are thoroughly fatigued. Gained +35% Exhaustion.`;
        }
      } else if (encounter.type === 'mana_storm') {
        if (option.id === 'spell_barrier') {
          if (isSuccess) {
            xpGained = 60;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You erect a glowing blue sphere of pure arcane energy around the horses and carriage. The wild magenta lightning bolts bounce off the barrier, charging your inner power! Gained +${xpGained} XP.`;
          } else {
            hpChange = -20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The electrical pressure is too intense. The magic barrier bursts, sending a violent shock back into your hands, stinging your nervous system! Lost -20 HP.`;
          }
        } else if (option.id === 'ground_metal') {
          if (isSuccess) {
            xpGained = 55;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You quickly forge iron grounding lines from the metal stockpile down into the earth. The electrical charge safely dissipates into the muddy roadside, letting you cross without harm. Gained +${xpGained} XP.`;
          } else {
            hpChange = -15;
            exhaustionChange = 20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! A stray flash of plasma strikes a wagon frame as you wire the line. You are thrown back by the static discharge, suffering burns and exhaustion. Lost -15 HP and gained +20% Exhaustion.`;
          }
        } else if (option.id === 'ride_through') {
          if (isSuccess) {
            xpGained = 50;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Miraculously, you guide the horses in a zig-zag dash. Lightning bolts strike inches away, turning rocks to molten glass, but not a single spark touches the carriage! Gained +${xpGained} XP.`;
          } else {
            hpChange = -25;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Unlucky! A direct strike hits the primary storage wagon, blasting splinters everywhere and shocking everyone in the vicinity. Lost -25 HP.`;
          }
        }
      } else if (encounter.type === 'bridge_collapse') {
        if (option.id === 'carpentry') {
          xpGained = 55;
          resultLog = `🔨 You dismantle spare timbers and lay a sturdy cross-hatched reinforcement ramp across the gorge chasm. The heavy wagons roll smoothly over the breach! Gained +${xpGained} XP. Used 15 Scrap Wood logs.`;
        } else if (option.id === 'steer') {
          if (isSuccess) {
            xpGained = 70;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Taking the leather reins from Baron Tobias, you hold the lead horses steady. With breathtaking precision, you glide the heavy wooden wheels directly along the narrow structural girder! Gained +${xpGained} XP.`;
          } else {
            hpChange = -15;
            exhaustionChange = 30;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! One of the wheels slips off the girder, tilting the wagon dangerously! You strain your shoulder hauling it back onto safe dirt, but the rear carriage cargo took structural damage. Lost -15 HP and gained +30% Exhaustion.`;
          }
        } else if (option.id === 'magical_levitation') {
          if (isSuccess) {
            xpGained = 65;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Channeling wind currents, you form a soft, floating updraft beneath the heavy wooden carriages. The horses pull them with weightless ease across the shattered gap! Gained +${xpGained} XP.`;
          } else {
            hpChange = -12;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Your concentration wavers mid-cast, and the kinetic gravity lifts collapse abruptly. The carriage slams hard onto the rocky stone gap, giving everyone a jarring shock. Lost -12 HP.`;
          }
        }
      } else if (encounter.type === 'mysterious_merchant') {
        if (option.id === 'buy_herbs') {
          xpGained = 30;
          nextMats['mat_berry'] = (nextMats['mat_berry'] || 0) + 10;
          nextMats['mat_thick_hide'] = (nextMats['mat_thick_hide'] || 0) + 2;
          resultLog = `🪙 You hand over 100 gold coins. The eccentric trader laughs merrily and reaches into his tortoise saddlebags, gifting you a bundle of 10 Wild Berries and 2 Thick Wild Hides! Gained +30 XP.`;
        } else if (option.id === 'trade_hides') {
          xpGained = 40;
          nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + 4;
          resultLog = `🟤 You trade 3 Thick Wild Hides. The merchant inspects the furs with satisfaction and hands you 4 chunks of refined Scrap Iron metal from his forge trunk! Gained +40 XP. Used 3 Thick Wild Hides.`;
        } else if (option.id === 'ignore') {
          resultLog = `🚶 You wave a friendly goodbye. The eccentric tortoise merchant slowly moves aside, leaving the mountain path clear. Safe travels!`;
        }
      } else if (encounter.type === 'swamp_gas') {
        if (option.id === 'alchemy') {
          if (isSuccess) {
            xpGained = 60;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Combining mineral dust and moisture in an empty flask, you spray an acidic neutralizer. The thick yellow miasma dissolves into harmless vapor before it can harm the crew! Gained +${xpGained} XP.`;
          } else {
            hpChange = -18;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Your reagent ratio was incorrect, resulting in a minor chemical flash. You inhale a mouthful of sulfur gas, coughing violently. Lost -18 HP.`;
          }
        } else if (option.id === 'constitution') {
          if (isSuccess) {
            xpGained = 55;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! With lungs of iron, you lead the charge, guiding the horse carriage through the yellow fog at top speed. Your lungs burn but you pull everyone out safely without lasting damage! Gained +${xpGained} XP.`;
          } else {
            hpChange = -25;
            exhaustionChange = 20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! You inhale the poison mist. A horrible nausea overcomes you, leaving your limbs weak and heavy. Lost -25 HP and gained +20% Exhaustion.`;
          }
        } else if (option.id === 'herbs') {
          xpGained = 45;
          resultLog = `🌿 You mash 12 Wild Berries into a thick, sweet anti-toxic paste for the draft horses and guards. The natural fruit acids fully filter out the worst of the toxic fumes! Gained +${xpGained} XP. Used 12 Wild Berries.`;
        }
      }

      let nextHp = playerStats.hp;
      if (hpChange < 0) {
        nextHp = Math.max(1, playerStats.hp + hpChange);
        playSound('hurt');
      } else if (encounter.type === 'pilgrim' && option.id === 'bless') {
        nextHp = playerStats.maxHp;
        playSound('heal');
      }

      let nextMp = playerStats.mp;
      if (encounter.type === 'pilgrim' && option.id === 'bless') {
        nextMp = playerStats.maxMp;
      }

      let nextExhaustion = Math.max(0, Math.min(100, (playerStats.exhaustion || 0) + exhaustionChange));
      if (encounter.type === 'pilgrim' && option.id === 'bless') {
        nextExhaustion = 0;
      }

      let nextXp = playerStats.xp + xpGained;
      let nextLevel = playerStats.level;
      let nextMaxHp = playerStats.maxHp;
      let nextMaxMp = playerStats.maxMp;
      let nextUnspentPoints = playerStats.unspentPoints;
      let nextXpNext = playerStats.xpNext;

      if (nextXp >= nextXpNext) {
        nextLevel += 1;
        nextXp -= nextXpNext;
        nextXpNext = Math.round(nextXpNext * 1.5);
        nextMaxHp += 15;
        nextMaxMp += 8;
        nextHp = nextMaxHp;
        nextMp = nextMaxMp;
        nextUnspentPoints += 3;
        resultLog += ` 🎉 LEVEL UP! You have achieved Level ${nextLevel}! Attributes boosted.`;
        playSound('levelUp');
      }

      const updatedEncounter: CaravanEncounter = {
        ...encounter,
        resolved: true,
        selectedOptionId: optionId,
        rolledValue: totalRoll,
        resultLog
      };

      const updatedTravel: CaravanTravelState = {
        ...travel,
        currentEncounter: updatedEncounter,
        stepsHistory: [...travel.stepsHistory, resultLog]
      };

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold,
          hp: nextHp,
          mp: nextMp,
          exhaustion: nextExhaustion,
          xp: nextXp,
          level: nextLevel,
          maxHp: nextMaxHp,
          maxMp: nextMaxMp,
          xpNext: nextXpNext,
          unspentPoints: nextUnspentPoints
        },
        inventoryMaterials: nextMats,
        caravanTravel: updatedTravel
      };
    });
  };

  const handleCompleteCaravanTravel = () => {
    playSound('levelUp');
    setGameState((prev) => {
      const travel = prev.caravanTravel;
      if (!travel) return prev;

      const destX = travel.destX;
      const destY = travel.destY;
      const destName = travel.destName;
      const reward = travel.rewardGold;

      const nextGold = prev.playerStats.gold + reward;

      const targetChunkKey = `${destX},${destY}`;
      let updatedChunks = prev.overworldChunks ? { ...prev.overworldChunks } : {};
      let targetChunk = updatedChunks[targetChunkKey];
      let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
      let hasSeppoOnLoad = false;
      
      const newPx = Math.floor(LEVEL_WIDTH / 2);
      const newPy = Math.floor(LEVEL_HEIGHT / 2) + 2;

      if (!targetChunk) {
        targetChunk = generateOverworldChunk(destX, destY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
        targetChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        hasSeppoOnLoad = targetChunk.npcs.some(n => n.id === 'npc_seppo');
      }

      const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map);
      const finalPx = safePlayerPos.x;
      const finalPy = safePlayerPos.y;

      const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
      const discovered = targetChunk.map.map((row, y) =>
        row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
      );

      const nextVisited = { ...prev.visitedTiles };
      nextVisited[`${finalPx},${finalPy},${destX},${destY}`] = true;

      const newMsgs = [...prev.logs];
      newMsgs.push({
        id: `caravan_arrived_${Date.now()}`,
        text: `🏆 [CARAVAN SECURED]: You have safely escorted the merchant caravan to ${destName}! Baron Tobias smiles warmly and slides a heavy reward pouch into your hands. +${reward} Gold collected!`,
        type: 'loot',
        timestamp: formatGameTime(prev.gameTime).timeStr
      });

      return {
        ...prev,
        playerX: finalPx,
        playerY: finalPy,
        currentChunkX: destX,
        currentChunkY: destY,
        overworldChunks: {
          ...updatedChunks,
          [targetChunkKey]: targetChunk
        },
        spawnedCats: nextSpawnedCats,
        spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
        map: targetChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, finalPx, finalPy, targetChunk.map),
        traps: targetChunk.traps,
        chests: targetChunk.chests,
        npcs: targetChunk.npcs,
        lootPiles: targetChunk.lootPiles || [],
        logs: newMsgs,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold
        },
        caravanTravel: null
      };
    });
  };

  return {
    handleStartCaravanTravel,
    handleAdvanceCaravanTravel,
    handleResolveCaravanEncounterOption,
    handleCompleteCaravanTravel,
  };
}
