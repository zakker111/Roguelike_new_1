import { GameState, Enemy, EnemyState, EnemyType, TileType, EquipmentItem, GameLogMessage, CatalystType, TrapType, Trap } from "../../types";
import { findWalkableSpotNearPlayer, getDirectionString } from "../../data/gmCommands";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from "../itemsData";
import { GMState, getGMStorytellerState, setGMStorytellerState } from "./types";
import { getChaosSurgeFlavorText } from "./storytellerFlavor";

export interface ChaosSurgeResult {
  mutatedState: Partial<GameState>;
  logText: string;
  effectSpawn?: { x: number; y: number; text: string; type: "heal" | "dmg" | "loot" };
  effName: string;
  effDesc: string;
  effType: "good" | "bad" | "neutral";
  roll: number;
}

export function executeChaosSurgeRoll(
  gameState: GameState,
  gmState: GMState,
  roll: number
): ChaosSurgeResult {
  let effName = "";
  let effDesc = "";
  let effType: "good" | "bad" | "neutral" = "neutral";
  let logText = "";
  let chaosStateUpdates: Partial<GameState> = {};
  let chaosEffectSpawn: { x: number; y: number; text: string; type: "heal" | "dmg" | "loot" } | undefined = undefined;

    if (roll === 1) {
      effName = "Dimensional Rupture (Critical Failure)";
      effDesc = "Unstable tectonic rift ruptures. -15 HP damage!";
      effType = 'bad';
      logText = getChaosSurgeFlavorText(
        1,
        `⚠️ [THE CHAOS CORE RUPTURED] (Roll 1): Deep subterranean fault lines snap under extreme tectonic friction! Jagged iron spikes burst through the flagstones, inflicting -15 HP damage!`,
        { dmg: 15 }
      );
      
      const px = gameState.playerX;
      const py = gameState.playerY;
      const newTrap: Trap = {
        id: `chaos_spike_crit_${Date.now()}`,
        x: px,
        y: py,
        type: TrapType.Spikes,
        isActive: true,
        triggered: true,
        hidden: false,
        detected: true
      };
      
      chaosStateUpdates = {
        traps: [...gameState.traps, newTrap],
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 15)
        }
      };
      chaosEffectSpawn = { x: px, y: py, text: "💥 Rupture!", type: 'dmg' };

    } else if (roll === 2) {
      effName = "Poison Spore Seepage";
      effDesc = "Toxic spore pods explode in the vicinity. Inflicts -12 HP damage and spawns an active hazard.";
      effType = 'bad';
      const spot = findWalkableSpotNearPlayer(gameState, 1, 3);
      let nextTraps = [...gameState.traps];
      if (spot) {
        nextTraps.push({
          id: `chaos_spore_vent_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          type: TrapType.FireVent,
          isActive: true,
          triggered: false,
          hidden: false,
          detected: true
        });
      }
      logText = getChaosSurgeFlavorText(
        2,
        `⚠️ [CHAOS SURGE: MYCELIAL ERUPTION] (Roll 2): Subterranean fungal pods burst open from underground pressure! Acrid poison gas seeps through the stones for -12 HP damage and primes an active gas vent!`,
        { dmg: 12 }
      );
      chaosStateUpdates = {
        traps: nextTraps,
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 12)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🤢 Poison Gas!", type: 'dmg' };

    } else if (roll === 3) {
      effName = "Corrosive Acid Fog";
      effDesc = "Corrosive fog dissolves equipment. Weapons and equipped armor decay by -20 durability!";
      effType = 'bad';
      let updatedWeapon = gameState.currentWeapon ? { ...gameState.currentWeapon } : null;
      if (updatedWeapon && updatedWeapon.durability !== undefined) {
        updatedWeapon.durability = Math.max(0, updatedWeapon.durability - 20);
      }
      let updatedArmor = gameState.equippedArmor ? { ...gameState.equippedArmor } : null;
      if (updatedArmor && updatedArmor.durability !== undefined) {
        updatedArmor.durability = Math.max(0, updatedArmor.durability - 20);
      }
      let updatedShield = gameState.equippedShield ? { ...gameState.equippedShield } : null;
      if (updatedShield && updatedShield.durability !== undefined) {
        updatedShield.durability = Math.max(0, updatedShield.durability - 20);
      }
      let extraDmg = 0;
      if (!updatedWeapon || (updatedWeapon.durability ?? 0) <= 0) extraDmg += 5;
      if (!updatedArmor || (updatedArmor.durability ?? 0) <= 0) extraDmg += 5;

      logText = getChaosSurgeFlavorText(
        3,
        `⚠️ [CHAOS SURGE: CORROSIVE VENTS] (Roll 3): Volcanic sulfur fissures spew hot acidic vapors across the stones! The caustic smog eats into metal temper, decaying equipped weapon, shield, and armor by -20 durability!${extraDmg > 0 ? ` Raw corrosion inflicted -${extraDmg} HP direct damage.` : ''}`,
        { decay: 20, extraDmg }
      );
      chaosStateUpdates = {
        currentWeapon: updatedWeapon,
        equippedArmor: updatedArmor,
        equippedShield: updatedShield,
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - extraDmg)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🧪 Acid Decay!", type: 'dmg' };

    } else if (roll === 4) {
      effName = "Void-Static Ambush";
      effDesc = "An unstable static discharge drains -15 Focus (MP) and summons a Void Rat.";
      effType = 'bad';
      const spot = findWalkableSpotNearPlayer(gameState, 2, 4);
      if (spot) {
        const voidRat: Enemy = {
          id: `chaos_void_rat_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          type: EnemyType.Rat,
          name: 'Void-Crazed Static Rat',
          hp: Math.round(15 * (1 + gameState.playerStats.level * 0.12)),
          maxHp: Math.round(15 * (1 + gameState.playerStats.level * 0.12)),
          atk: 3,
          def: 1,
          range: 1,
          speed: 1,
          color: '#a855f7',
          char: 'r',
          state: EnemyState.Chasing,
          isElite: true,
          eliteEffect: 'Void Static (Drains MP on strike)',
          patrolPath: [],
          patrolIndex: 0,
          debuffs: []
        };
        const direction = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
        logText = getChaosSurgeFlavorText(
          4,
          `⚠️ [CHAOS SURGE: VOID DISCHARGE] (Roll 4): A planar tear sparks with purple lightning! The static backlash drains -15 Focus (MP) and manifests a ravenous Void-Crazed Static Rat to the [${direction.toUpperCase()}]!`,
          { mpDrain: 15, direction: direction.toUpperCase() }
        );
        chaosStateUpdates = {
          enemies: [...gameState.enemies, voidRat],
          playerStats: {
            ...gameState.playerStats,
            mp: Math.max(0, gameState.playerStats.mp - 15)
          }
        };
        chaosEffectSpawn = { x: spot.x, y: spot.y, text: "👾 Void Portal!", type: 'dmg' };
      } else {
        logText = getChaosSurgeFlavorText(
          4,
          `⚠️ [CHAOS SURGE: VOID DISCHARGE] (Roll 4): Residual planar lightning crackles across the ceiling, burning away -15 Focus (MP)!`,
          { mpDrain: 15 }
        );
        chaosStateUpdates = {
          playerStats: {
            ...gameState.playerStats,
            mp: Math.max(0, gameState.playerStats.mp - 15)
          }
        };
      }

    } else if (roll === 5) {
      effName = "Sunder Thief Raid";
      effDesc = "Sunder outlaws pickpocket your coinpurse. Drains up to -30 Gold directly!";
      effType = 'bad';
      const stolenGold = Math.min(30, gameState.playerStats.gold);
      const remainder = 30 - stolenGold;
      const hpPenalty = remainder > 0 ? Math.round(remainder * 0.3) : 0;
      logText = getChaosSurgeFlavorText(
        5,
        `⚠️ [CHAOS SURGE: PHANTOM SIPHON] (Roll 5): Spectral dungeon shades phase through the chill air, lured by the clinking of precious metal to steal -${stolenGold} Gold coins from your pouch! You take -${hpPenalty} physical strain.`,
        { stolenGold, hpPenalty }
      );
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          gold: Math.max(0, gameState.playerStats.gold - 30),
          hp: Math.max(5, gameState.playerStats.hp - hpPenalty)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "💸 Stolen!", type: 'dmg' };

    } else if (roll === 6) {
      effName = "Unstable Magic Bleed";
      effDesc = "Atmospheric friction backfires on your spell cells. Drains -25 Focus (MP)!";
      effType = 'bad';
      logText = getChaosSurgeFlavorText(
        6,
        `⚠️ [CHAOS SURGE: AETHERIC BACKFIRE] (Roll 6): Leyline backpressure destabilizes your internal aether reservoir, releasing a sharp discharge that burns away -25 Focus (MP)!`,
        { mpDrain: 25 }
      );
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          mp: Math.max(0, gameState.playerStats.mp - 25)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "⚡ MP Burn!", type: 'dmg' };

    } else if (roll === 7) {
      effName = "Frostbite Chill";
      effDesc = "A localized freezing wind drains your stamina. -10 HP and -10 Focus (MP) damage.";
      effType = 'bad';
      logText = getChaosSurgeFlavorText(
        7,
        `⚠️ [CHAOS SURGE: RIEKKO'S FROSTBITE] (Roll 7): Sub-zero drafts from the icy peaks of Pohjola whistle through stone crevices, chilling your blood for -10 HP and freezing mental focus for -10 MP!`,
        { hpDmg: 10, mpDmg: 10 }
      );
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 10),
          mp: Math.max(0, gameState.playerStats.mp - 10)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "❄️ Chill!", type: 'dmg' };

    } else if (roll === 8) {
      effName = "Tectonic Trap Shift";
      effDesc = "Vibrations in the ground move tectonic rifts, spawning 2 volatile active hazard traps nearby!";
      effType = 'neutral';
      const spots = [
        findWalkableSpotNearPlayer(gameState, 1, 3),
        findWalkableSpotNearPlayer(gameState, 2, 4)
      ];
      let nextTraps = [...gameState.traps];
      spots.forEach((spot, i) => {
        if (spot) {
          nextTraps.push({
            id: `chaos_shift_trap_${Date.now()}_${i}`,
            x: spot.x,
            y: spot.y,
            type: i % 2 === 0 ? TrapType.Spikes : TrapType.FireVent,
            isActive: true,
            triggered: false,
            hidden: false,
            detected: true
          });
        }
      });
      logText = getChaosSurgeFlavorText(
        8,
        `⚡ [CHAOS SURGE: CLOCKWORK SHIFT] (Roll 8): Ancient iron counterweights and tripwires grind through stone channels, priming 2 volatile hazard traps adjacent to your coordinates!`,
        {}
      );
      chaosStateUpdates = { traps: nextTraps };
      const representativeSpot = spots[0] || { x: gameState.playerX, y: gameState.playerY };
      chaosEffectSpawn = { x: representativeSpot.x, y: representativeSpot.y, text: "⚠️ Traps!", type: 'dmg' };

    } else if (roll === 9) {
      effName = "Prismatic Monster Mutation";
      effDesc = "Aetheric feedback triggers genetic advancement. Mutates an active monster to an Elite form!";
      effType = 'neutral';
      const mutateTargetIdx = gameState.enemies.findIndex(e => !e.isBoss && !e.isElite && !e.isFollower && !e.isTownGuard && e.hp > 0);
      if (mutateTargetIdx !== -1) {
        const nextEnemies = [...gameState.enemies];
        const original = nextEnemies[mutateTargetIdx];
        const mutated: Enemy = {
          ...original,
          isElite: true,
          name: `Prismatic Mutant ${original.name}`,
          hp: Math.round(original.hp * 1.5),
          maxHp: Math.round(original.maxHp * 1.5),
          atk: original.atk + 3,
          def: original.def + 1,
          color: '#ec4899',
          char: '★',
          eliteEffect: 'Chaotic Regeneration (+2 HP/turn)'
        };
        nextEnemies[mutateTargetIdx] = mutated;
        logText = getChaosSurgeFlavorText(
          9,
          `⚡ [CHAOS SURGE: MUTAGENIC OVERFLOW] (Roll 9): Glowing leyline vapors envelop ${original.name}! Mutagenic energy advances it into an empowered Elite Star-marked form (+50% HP, +3 ATK)!`,
          { enemyName: original.name }
        );
        chaosStateUpdates = { enemies: nextEnemies };
        chaosEffectSpawn = { x: original.x, y: original.y, text: "⚡ Mutated!", type: 'dmg' };
      } else {
        const spot = findWalkableSpotNearPlayer(gameState, 2, 4);
        if (spot) {
          const newTrap: Trap = {
            id: `chaos_fire_trap_${Date.now()}`,
            x: spot.x,
            y: spot.y,
            type: TrapType.FireVent,
            isActive: true,
            triggered: false,
            hidden: false,
            detected: true
          };
          logText = getChaosSurgeFlavorText(
            9,
            `🔥 [CHAOS SURGE: TECTONIC FISSURE] (Roll 9): With no hostiles in sight, subterranean heat bursts upward instead, arming an active FireVent trap adjacent to your position!`,
            {}
          );
          chaosStateUpdates = { traps: [...gameState.traps, newTrap] };
          chaosEffectSpawn = { x: spot.x, y: spot.y, text: "🔥 Vent!", type: 'dmg' };
        } else {
          logText = getChaosSurgeFlavorText(
            9,
            `⚡ [CHAOS SURGE: QUIET ECHO] (Roll 9): Atmospheric static crackles harmlessly across empty stone corridors.`,
            {}
          );
        }
      }

    } else if (roll === 10) {
      effName = "Volatile Slag Discovery";
      effDesc = "You pry open a brittle volcanic slag node on the ground (-6 HP), but salvage valuable wood and iron remnants.";
      effType = 'neutral';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_wood'] = (nextMats['mat_wood'] || 0) + 2;
      nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + 1;
      logText = getChaosSurgeFlavorText(
        10,
        `⚡ [CHAOS SURGE: VOLCANIC FALLOUT] (Roll 10): You pry open a brittle volcanic geode node on the ground! It snaps with a sharp crack (-6 HP strain), but the blast reveals +2 Sturdy Wood and +1 Iron Ore in the rubble.`,
        { strain: 6 }
      );
      chaosStateUpdates = {
        inventoryMaterials: nextMats,
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 6)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "💥 Salvage!", type: 'dmg' };

    } else if (roll >= 11 && roll <= 12) {
      effName = "Elemental Geode Discovery";
      effDesc = "You uncover a cracked elemental geode sparkling with raw magical catalysts.";
      effType = 'good';
      
      const catalysts = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
      const chosen = catalysts[Math.floor(Math.random() * catalysts.length)];
      const nextCats = { ...gameState.inventoryCatalysts };
      nextCats[chosen] = (nextCats[chosen] || 0) + 1;
      
      const label = chosen.replace('cat_', '').toUpperCase();
      logText = getChaosSurgeFlavorText(
        roll,
        `🔮 [CHAOS SURGE: ELEMENTAL SEAM] (Roll ${roll}): You spot a glistening elemental crystal embedded within the rockface and pry free 1x ${label} Catalyst!`,
        { catalyst: label }
      );
      
      chaosStateUpdates = { inventoryCatalysts: nextCats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: `✨ +1 ${label}!`, type: 'loot' };

    } else if (roll === 13) {
      effName = "Wild Berry Thicket Forage";
      effDesc = "You stumble upon a hidden thicket of ripe wild berry bushes and traveler rations.";
      effType = 'good';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_berry'] = (nextMats['mat_berry'] || 0) + 3;
      nextMats['mat_bread'] = (nextMats['mat_bread'] || 0) + 1;
      logText = getChaosSurgeFlavorText(
        13,
        `🍓 [CHAOS SURGE: MIELIKKI'S BOUNTY] (Roll 13): Queen Mielikki's woodland blessing blooms across the trail, yielding +3 Sweet Wild Berries and +1 wholesome Traveler's Bread wrapped in leaves!`,
        {}
      );
      chaosStateUpdates = { inventoryMaterials: nextMats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🍓 +3 Berries!", type: 'loot' };

    } else if (roll === 14) {
      effName = "Forgotten Traveler's Coinpurse";
      effDesc = "Your boot catches on a lost leather coinpurse hidden beneath the stones.";
      effType = 'good';
      logText = getChaosSurgeFlavorText(
        14,
        `🪙 [CHAOS SURGE: LOST SATCHEL] (Roll 14): Your boot uncovers a lost royal courier's leather coinpurse lodged beneath the flagstones, adding +45 Gold coins to your pouch!`,
        { gold: 45 }
      );
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          gold: gameState.playerStats.gold + 45
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🪙 +45 Gold!", type: 'loot' };

    } else if (roll === 15) {
      effName = "Abandoned Supply Cache";
      effDesc = "You uncover a weathered wooden supply crate tucked inside a rocky alcove.";
      effType = 'good';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_wood'] = (nextMats['mat_wood'] || 0) + 2;
      nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + 2;
      logText = getChaosSurgeFlavorText(
        15,
        `📦 [CHAOS SURGE: MINER'S CACHE] (Roll 15): You uncover a sealed wooden supply crate left behind by an old prospecting expedition, salvaging +2 Sturdy Wood and +2 Iron Ore!`,
        {}
      );
      chaosStateUpdates = { inventoryMaterials: nextMats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "📦 +4 Mats!", type: 'loot' };

    } else if (roll === 16) {
      effName = "Lost Craftsman Toolkit";
      effDesc = "You notice a scout's leather toolkit wedged in a wall fissure.";
      effType = 'good';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_lockpick'] = (nextMats['mat_lockpick'] || 0) + 2;
      logText = getChaosSurgeFlavorText(
        16,
        `🔑 [CHAOS SURGE: LOCKSMITH'S ROLL] (Roll 16): You retrieve an abandoned master locksmith's leather tool roll wedged in a stone crevice, securing +2 High-Grade Lockpicks for future locks!`,
        { lockpicks: 2 }
      );
      chaosStateUpdates = { inventoryMaterials: nextMats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🔑 +2 Lockpicks!", type: 'loot' };

    } else if (roll === 17) {
      effName = "Harmonic Sanctuary Respite";
      effDesc = "A tranquil natural spring soothes your wounds (+25 HP) and calms your focus (+15 MP).";
      effType = 'good';
      
      const nextHp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + 25);
      const nextMp = Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 15);
      
      const nextDiscovered = gameState.discovered ? gameState.discovered.map(row => [...row]) : undefined;
      const px = gameState.playerX;
      const py = gameState.playerY;
      const r = 5;
      if (nextDiscovered) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const tx = px + dx;
            const ty = py + dy;
            if (tx >= 0 && tx < gameState.levelWidth && ty >= 0 && ty < gameState.levelHeight) {
              if (nextDiscovered[ty]) {
                nextDiscovered[ty][tx] = true;
              }
            }
          }
        }
      }

      logText = getChaosSurgeFlavorText(
        17,
        `✨ [CHAOS SURGE: SACRED GROTTO] (Roll 17): You step into a secluded sanctuary alcove filled with glowing restorative dew. Restored +25 HP and +15 Focus, and fully charted nearby terrain!`,
        { hp: 25, mp: 15 }
      );
      
      chaosStateUpdates = {
        ...(nextDiscovered ? { discovered: nextDiscovered } : {}),
        playerStats: {
          ...gameState.playerStats,
          hp: nextHp,
          mp: nextMp
        }
      };
      chaosEffectSpawn = { x: px, y: py, text: "💖 Rejuvenation!", type: 'heal' };

    } else if (roll === 18) {
      effName = "Scout's Clairvoyance";
      effDesc = "A flash of pure light reveals hidden traps and grants +35 Scouting XP.";
      effType = 'good';
      const nextTraps = gameState.traps.map(t => ({ ...t, detected: true }));
      const scoutingXpGain = 35;
      const updatedStats = {
        ...gameState.playerStats,
        scoutingXp: (gameState.playerStats.scoutingXp || 0) + scoutingXpGain
      };
      logText = getChaosSurgeFlavorText(
        18,
        `✨ [CHAOS SURGE: SEER'S EYE] (Roll 18): Cosmic foresight floods your awareness! An ancient seer's rune illuminates all hidden traps in the zone and grants +35 Scouting XP!`,
        { xp: 35 }
      );
      chaosStateUpdates = {
        traps: nextTraps,
        playerStats: updatedStats
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "👁️ Insight!", type: 'heal' };

    } else if (roll === 19) {
      effName = "Abyssal Forge Blessing";
      effDesc = "Dungeon static aligns with iron molecules, repairing equipped weapon and armor durability by +50!";
      effType = 'good';
      let updatedWeapon = gameState.currentWeapon ? { ...gameState.currentWeapon } : null;
      if (updatedWeapon) {
        const maxD = updatedWeapon.maxDurability ?? 100;
        updatedWeapon.durability = Math.min(maxD, (updatedWeapon.durability ?? 100) + 50);
      }
      let updatedArmor = gameState.equippedArmor ? { ...gameState.equippedArmor } : null;
      if (updatedArmor) {
        const maxD = updatedArmor.maxDurability ?? 100;
        updatedArmor.durability = Math.min(maxD, (updatedArmor.durability ?? 100) + 50);
      }
      let updatedShield = gameState.equippedShield ? { ...gameState.equippedShield } : null;
      if (updatedShield) {
        const maxD = updatedShield.maxDurability ?? 100;
        updatedShield.durability = Math.min(maxD, (updatedShield.durability ?? 100) + 50);
      }
      logText = getChaosSurgeFlavorText(
        19,
        `✨ [CHAOS SURGE: ILMARINEN'S TEMPER] (Roll 19): The eternal forge hammers of Ilmarinen resound through the stones! Holy anvil sparks align the iron lattice of your equipped weapon, armor, and shield, restoring +50 durability!`,
        { durability: 50 }
      );
      chaosStateUpdates = {
        currentWeapon: updatedWeapon,
        equippedArmor: updatedArmor,
        equippedShield: updatedShield
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🔧 Repaired!", type: 'heal' };

    } else {
      effName = "Cosmic Perfect Alignment";
      effDesc = "Full HP & MP restored, +100 Gold awarded, and a Glazed Boar spawned.";
      effType = 'good';
      
      const px = gameState.playerX;
      const py = gameState.playerY;
      const nextHp = gameState.playerStats.maxHp;
      const nextMp = gameState.playerStats.maxMp;
      const nextGold = gameState.playerStats.gold + 100;
      
      let nextEnemies = [...gameState.enemies];
      const spot = findWalkableSpotNearPlayer(gameState, 1, 3);
      let boarTxt = "";
      if (spot) {
        const honeyBoar: Enemy = {
          id: `chaos_perfect_boar_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          type: EnemyType.LootGoblin,
          name: "Mielikki's Glazed Boar",
          hp: 30,
          maxHp: 30,
          atk: 0,
          def: 1,
          range: 1,
          speed: 1,
          color: '#f59e0b',
          char: '🐗',
          state: EnemyState.Patrolling,
          isElite: true,
          eliteEffect: "Honey-Glazed (Drops prime roasts & fish)",
          patrolPath: [],
          patrolIndex: 0,
          debuffs: []
        };
        nextEnemies.push(honeyBoar);
        const direction = getDirectionString(px, py, spot.x, spot.y);
        boarTxt = ` alongside a succulent Honey-Glazed Boar spawned to the [${direction.toUpperCase()}]!`;
      }

      logText = getChaosSurgeFlavorText(
        20,
        `☄️ [CHAOS SURGE: COSMIC HARMONY] (Roll 20 - PERFECT HARMONY): Ancient celestial constellations align in radiant equilibrium! Body and soul are fully restored (100% HP & MP), +100 Gold rains into your pack${boarTxt}!`,
        { gold: 100 }
      );
      
      chaosStateUpdates = {
        enemies: nextEnemies,
        playerStats: {
          ...gameState.playerStats,
          hp: nextHp,
          mp: nextMp,
          gold: nextGold
        }
      };
      chaosEffectSpawn = { x: px, y: py, text: "☄️ Cosmic Harmony!", type: 'heal' };
    }


  return {
    mutatedState: chaosStateUpdates,
    logText,
    effectSpawn: chaosEffectSpawn,
    effName,
    effDesc,
    effType,
    roll
  };
}

export function modifyChaosScore(
  gameState: GameState,
  delta: number,
  reason: string
): {
  nextState: GameState;
  logMessage: GameLogMessage;
  effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
} {
  const oldScore = gameState.chaosScore ?? 20;
  const newScore = Math.max(0, Math.min(100, oldScore + delta));
  const actualDelta = newScore - oldScore;

  const icon = actualDelta > 0 ? '🔮' : actualDelta < 0 ? '✨' : '⚖️';
  const sign = actualDelta > 0 ? '+' : '';
  const logText = `${icon} [CHAOS MATRIX]: ${oldScore} → ${newScore} (${sign}${actualDelta}) — ${reason}`;

  const nextState: GameState = {
    ...gameState,
    chaosScore: newScore,
  };

  const logMessage: GameLogMessage = {
    id: `chaos_shift_${Date.now()}_${Math.random()}`,
    text: logText,
    type: actualDelta > 0 ? 'danger' : actualDelta < 0 ? 'loot' : 'info',
    timestamp: 'CHAOS'
  };

  const effectSpawn = {
    x: gameState.playerX,
    y: gameState.playerY,
    text: `Chaos ${sign}${actualDelta} (${reason})`,
    type: (actualDelta > 0 ? 'dmg' : 'heal') as 'dmg' | 'heal' | 'loot'
  };

  return { nextState, logMessage, effectSpawn };
}

/**
 * Manually triggers a Cosmic Chaos Surge d20 roll, applies the environmental effect,
 * records the event in GM Storyteller history, and returns state updates + logs.
 */
export function triggerManualChaosSurge(
  gameState: GameState,
  forcedRoll?: number
): {
  mutatedState: Partial<GameState>;
  logText: string;
  effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
  roll: number;
  effName: string;
  effDesc: string;
  effType: 'good' | 'bad' | 'neutral';
} {
  const currentGM = getGMStorytellerState();
  let roll = forcedRoll ?? (Math.floor(Math.random() * 20) + 1);
  if (currentGM.disableGifts && roll >= 11 && forcedRoll === undefined) {
    roll = Math.floor(Math.random() * 10) + 1;
  }

  let effName = "";
  let effDesc = "";
  let effType: 'good' | 'bad' | 'neutral' = 'neutral';
  let logText = "";
  let mutatedState: Partial<GameState> = {};
  let effectSpawn: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' } | undefined = undefined;
  const px = gameState.playerX;
  const py = gameState.playerY;

  if (roll === 1) {
    effName = "Dimensional Rupture (Critical Failure)";
    effDesc = "Unstable tectonic rift ruptures. -15 HP damage!";
    effType = 'bad';
    logText = getChaosSurgeFlavorText(
      1,
      `⚠️ [THE CHAOS CORE RUPTURED] (Roll 1 - Manual Surge): Deep subterranean fault lines snap under extreme tectonic friction! Jagged iron spikes burst through the flagstones, inflicting -15 HP damage!`,
      { dmg: 15 }
    );
    const newTrap: Trap = {
      id: `manual_chaos_spike_${Date.now()}`,
      x: px,
      y: py,
      type: TrapType.Spikes,
      isActive: true,
      triggered: true,
      hidden: false,
      detected: true
    };
    mutatedState = {
      traps: [...gameState.traps, newTrap],
      playerStats: {
        ...gameState.playerStats,
        hp: Math.max(5, gameState.playerStats.hp - 15)
      }
    };
    effectSpawn = { x: px, y: py, text: "💥 Rupture!", type: 'dmg' };
  } else if (roll <= 5) {
    effName = "Poison Spore Vent";
    effDesc = "Toxic spore pods explode nearby. Inflicts -12 HP damage.";
    effType = 'bad';
    logText = getChaosSurgeFlavorText(
      roll,
      `⚠️ [CHAOS SURGE: MYCELIAL ERUPTION] (Roll ${roll} - Manual Surge): Subterranean fungal pods burst open from underground pressure! Acrid poison gas seeps through the stones for -12 HP damage!`,
      { dmg: 12 }
    );
    mutatedState = {
      playerStats: {
        ...gameState.playerStats,
        hp: Math.max(5, gameState.playerStats.hp - 12)
      }
    };
    effectSpawn = { x: px, y: py, text: "🤢 Poison Gas!", type: 'dmg' };
  } else if (roll <= 10) {
    effName = "Corrosive Atmospheric Static";
    effDesc = "Corrosive static drains 10 Focus (MP) and creates a hazard.";
    effType = 'bad';
    logText = getChaosSurgeFlavorText(
      roll,
      `⚡ [CHAOS SURGE: AETHERIC BACKFIRE] (Roll ${roll} - Manual Surge): Leyline backpressure destabilizes your internal aether reservoir, draining away -10 Focus (MP)!`,
      { mpDrain: 10 }
    );
    mutatedState = {
      playerStats: {
        ...gameState.playerStats,
        mp: Math.max(0, gameState.playerStats.mp - 10)
      }
    };
    effectSpawn = { x: px, y: py, text: "⚡ Static Drain!", type: 'dmg' };
  } else if (roll <= 15) {
    effName = "Aetheric Vitality Flare";
    effDesc = "Warm atmospheric energy restores +25 HP and +15 MP!";
    effType = 'good';
    logText = getChaosSurgeFlavorText(
      roll,
      `✨ [CHAOS SURGE: SACRED RESIDUAL DEW] (Roll ${roll} - Manual Surge): A warm seraphic aura washes across your exhausted frame, restoring +25 HP and +15 MP!`,
      { hp: 25, mp: 15 }
    );
    mutatedState = {
      playerStats: {
        ...gameState.playerStats,
        hp: Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + 25),
        mp: Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 15)
      }
    };
    effectSpawn = { x: px, y: py, text: "✨ Vitality Surge!", type: 'heal' };
  } else {
    effName = "Cosmic Harmony Alignment";
    effDesc = "Full HP & MP restored, +75 Gold awarded!";
    effType = 'good';
    logText = getChaosSurgeFlavorText(
      roll,
      `☄️ [CHAOS SURGE: COSMIC HARMONY] (Roll ${roll} - Manual Surge): Celestial leyline nodes align in radiant equilibrium! Fully restored HP and MP, and recovered +75 Gold!`,
      { gold: 75 }
    );
    mutatedState = {
      playerStats: {
        ...gameState.playerStats,
        hp: gameState.playerStats.maxHp,
        mp: gameState.playerStats.maxMp,
        gold: gameState.playerStats.gold + 75
      }
    };
    effectSpawn = { x: px, y: py, text: "☄️ Cosmic Harmony!", type: 'heal' };
  }

  const turn = gameState.playerStats.turnsPlayed || 0;
  currentGM.lastChaosRoll = roll;
  currentGM.lastChaosEffectName = effName;
  currentGM.lastChaosEffectDesc = effDesc;
  if (!currentGM.chaosHistory) currentGM.chaosHistory = [];
  currentGM.chaosHistory.unshift({ turn, roll, name: effName, type: effType });
  if (currentGM.chaosHistory.length > 8) currentGM.chaosHistory.pop();
  currentGM.thoughts.unshift(`Turn ${turn}: GM MANUALLY TRIGGERED CHAOS SURGE (Roll ${roll}: ${effName}).`);
  setGMStorytellerState(currentGM);

  return {
    mutatedState,
    logText,
    effectSpawn,
    roll,
    effName,
    effDesc,
    effType
  };
}
