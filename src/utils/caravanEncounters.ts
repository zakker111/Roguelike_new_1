import { GameState, CaravanEncounter } from '../types';

export const generateRandomCaravanEncounter = (biome: string, state: GameState): CaravanEncounter => {
  const roll = Math.random();
  
  if (roll < 0.11) {
    return {
      id: `enc_bandit_${Date.now()}`,
      type: 'bandit_ambush',
      title: '🗡️ RUTHLESS BANDIT TOLL ROAD (ELITE CHALLENGE)',
      desc: 'A faction of heavily-armed Sunder Outlaws blocks a tight mountain pass with spike traps and readied iron crossbows. "Disperse 500 Gold, or feed the vultures, rich merchant!" the bandit captain sneers.',
      resolved: false,
      options: [
        {
          id: 'fight',
          text: '⚔️ Draw steel and charge! (Requires Strength [STR] Check, Difficulty 19)',
          statCheck: 'str',
          difficulty: 19
        },
        {
          id: 'intimidate',
          text: '🗣️ Extort them back with deadly threats! (Requires Charisma [CHA] Check, Difficulty 18)',
          statCheck: 'cha',
          difficulty: 18
        },
        {
          id: 'pay',
          text: '🪙 Pay the 500 Gold toll to prevent bloodshed.',
          costGold: 500
        }
      ]
    };
  } else if (roll < 0.22) {
    return {
      id: `enc_beast_${Date.now()}`,
      type: 'beast_attack',
      title: '🐺 DIRE WOLF FOREST AMBUSH (FERAL THREAT)',
      desc: 'A pack of hungry, red-eyed Dire Wolves crawls out of the shadowy brushwood, snapping their jaws at the carriage draft horses!',
      resolved: false,
      options: [
        {
          id: 'fight',
          text: '⚔️ Leap in front of the carriage to slay them! (Requires Dexterity [DEX] Check, Difficulty 18)',
          statCheck: 'dex',
          difficulty: 18
        },
        {
          id: 'feed',
          text: '🥩 Feed them stashed Wild Berries to pacify them. (Costs 15 Berries)',
          costItems: [{ id: 'mat_berry', count: 15, label: 'Wild Berries' }]
        },
        {
          id: 'intimidate',
          text: '🗣️ Use a primal roar to terrify the beasts! (Requires Strength [STR] Check, Difficulty 19)',
          statCheck: 'str',
          difficulty: 19
        }
      ]
    };
  } else if (roll < 0.33) {
    return {
      id: `enc_obstacle_${Date.now()}`,
      type: 'obstacle',
      title: '🪨 AVALANCHE ROAD BLOCK',
      desc: 'A massive boulder and rockslide debris from the mountain peaks has crashed down, fully blocking the narrow dirt road. The caravan is stuck!',
      resolved: false,
      options: [
        {
          id: 'push',
          text: '💪 Lift and push the boulder with raw muscle! (Requires Strength [STR] Check, Difficulty 19)',
          statCheck: 'str',
          difficulty: 19
        },
        {
          id: 'leverage',
          text: '⚙️ Engineer a lever system with wooden logs. (Requires Intelligence [INT] Check, Difficulty 18)',
          statCheck: 'int',
          difficulty: 18
        },
        {
          id: 'detour',
          text: '🗺️ Guide the wagons through a dangerous swampy detour. (Requires Luck [LCK] Check, Difficulty 18)',
          statCheck: 'lck',
          difficulty: 18
        }
      ]
    };
  } else if (roll < 0.44) {
    return {
      id: `enc_pilgrim_${Date.now()}`,
      type: 'pilgrim',
      title: '✨ SHRINE OF THE FIRST AGE',
      desc: 'An ancient, crumbling stone altar glows with white crystalline light. A gentle roadway priest is meditating nearby, tending to a pure water well. He offers a prayer for the caravan guards.',
      resolved: false,
      options: [
        {
          id: 'bless',
          text: '🙏 Bow your head and accept a divine blessing. (Fills HP/MP, removes fatigue!)'
        },
        {
          id: 'wisdom',
          text: '📖 Recite ancient lore snippets with the priest. (Requires Intelligence [INT] Check, Difficulty 17)',
          statCheck: 'int',
          difficulty: 17
        }
      ]
    };
  } else if (roll < 0.55) {
    return {
      id: `enc_wheel_${Date.now()}`,
      type: 'wheel_break',
      title: '⚙️ CRACKED WOODEN AXLE',
      desc: 'CRACK! The heavy caravan carriage strikes a deep, stony ditch. The rear wheel wood splintered, snapping the axle support!',
      resolved: false,
      options: [
        {
          id: 'repair_metal',
          text: '🔨 Forge an iron bracing to fix it immediately. (Costs 8 Iron Ore)',
          costItems: [{ id: 'mat_iron', count: 8, label: 'Iron Ore' }]
        },
        {
          id: 'repair_lumber',
          text: '🌲 Splice a wooden support brace. (Requires 18 Wood Planks)',
          costItems: [{ id: 'mat_wood', count: 18, label: 'Wood Planks' }]
        },
        {
          id: 'wait_fix',
          text: '⏳ Take time to craft a replacement with simple tools. (Adds 30% physical Exhaustion, advances clock)'
        }
      ]
    };
  } else if (roll < 0.66) {
    return {
      id: `enc_storm_${Date.now()}`,
      type: 'mana_storm',
      title: '⛈️ DREADED MANA TEMPEST (ARCANE ANOMALY)',
      desc: 'A sudden vortex of unstable raw violet lightning sweeps over the gravel road. The air hums with volatile mana, and the carriage wheel axles are starting to spark with dangerous static friction!',
      resolved: false,
      options: [
        {
          id: 'spell_barrier',
          text: '🛡️ Cast an Arcane Dampening Barrier to shield the horses. (Requires Intelligence [INT] Check, Difficulty 18)',
          statCheck: 'int',
          difficulty: 18
        },
        {
          id: 'ground_metal',
          text: '⚡ Deploy copper/iron rod bypass groundings. (Requires Dexterity [DEX] Check, Difficulty 17)',
          statCheck: 'dex',
          difficulty: 17
        },
        {
          id: 'ride_through',
          text: '🐎 Gallop recklessly straight through the lightning field! (Requires Luck [LCK] Check, Difficulty 19)',
          statCheck: 'lck',
          difficulty: 19
        }
      ]
    };
  } else if (roll < 0.77) {
    return {
      id: `enc_bridge_${Date.now()}`,
      type: 'bridge_collapse',
      title: '🌉 CRACKED GORGE CHASM BRIDGE (STRUCTURAL DAMAGE)',
      desc: 'The old log-and-rope bridge spanning a deep chasm has partially buckled. Only a single narrow wooden beam remains. A heavy carriage will surely crash unless bolstered or steered with divine precision.',
      resolved: false,
      options: [
        {
          id: 'carpentry',
          text: '🪚 Build a sturdy timber brace ramp. (Costs 15 Scrap Wood logs)',
          costItems: [{ id: 'mat_wood', count: 15, label: 'Scrap Wood' }]
        },
        {
          id: 'steer',
          text: '🐎 Precision-steer the horse carriage across the narrow girder. (Requires Dexterity [DEX] Check, Difficulty 19)',
          statCheck: 'dex',
          difficulty: 19
        },
        {
          id: 'magical_levitation',
          text: '🌀 Cast an arcane levitation wind to support the wheels. (Requires Intelligence [INT] Check, Difficulty 18)',
          statCheck: 'int',
          difficulty: 18
        }
      ]
    };
  } else if (roll < 0.88) {
    return {
      id: `enc_merchant_${Date.now()}`,
      type: 'mysterious_merchant',
      title: '🎒 WANDERING SHELTER TRADER',
      desc: 'An eccentric merchant wearing heavy leather boots and riding a giant moss-covered tortoise waves you down. "Greetings travelers! I trade rare seeds and cure-all draughts for woodland supplies!"',
      resolved: false,
      options: [
        {
          id: 'buy_herbs',
          text: '🪙 Buy a basket of fresh restorative herbs. (Costs 100 Gold)',
          costGold: 100
        },
        {
          id: 'trade_hides',
          text: '🟤 Exchange heavy leather for refined scrap iron. (Costs 3 Thick Wild Hides)',
          costItems: [{ id: 'mat_thick_hide', count: 3, label: 'Thick Wild Hide' }]
        },
        {
          id: 'ignore',
          text: '🚶 Politely refuse and keep rolling along the road.'
        }
      ]
    };
  } else {
    return {
      id: `enc_gas_${Date.now()}`,
      type: 'swamp_gas',
      title: '🤢 NOXIOUS SULFUR MIASMA (POISON HAZARD)',
      desc: 'The mountain pass dips into a humid hollow filled with bubbling, yellow sulfur gas. The horses begin coughing and choking, and your lungs burn with every deep breath!',
      resolved: false,
      options: [
        {
          id: 'alchemy',
          text: '🧪 Synthesize neutralizing air filter vapors. (Requires Intelligence [INT] Check, Difficulty 17)',
          statCheck: 'int',
          difficulty: 17
        },
        {
          id: 'constitution',
          text: '💪 Push through the suffocating vapors with pure grit. (Requires Strength [STR] Check, Difficulty 18)',
          statCheck: 'str',
          difficulty: 18
        },
        {
          id: 'herbs',
          text: '🌿 Chew on stashed Wild Berries to neutralize the toxins. (Costs 12 Wild Berries)',
          costItems: [{ id: 'mat_berry', count: 12, label: 'Wild Berries' }]
        }
      ]
    };
  }
};
