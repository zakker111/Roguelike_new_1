import React from 'react';
import { GameState, Enemy, EnemyType, EnemyState, TileType, Follower, EquipmentItem } from '../types';
import { isCastleTownAtChunk } from '../utils/overworld';
import { generateLevel, generateDungeonProps } from '../utils/dungeon';
import { computeFOV } from '../utils/ai';
import { findStairsOrWalkablePosition } from '../utils/gameUtils';
import { getValidWeatherForBiome, BIOME_VALID_WEATHERS } from '../utils/weatherEngine';

export interface GmCommand {
  id: string;
  name: string;
  description: string;
  category: 'Weather Control' | 'Hero Blessings' | 'Spawning Actions' | 'Tactical Smites';
  iconName: 'Sun' | 'CloudRain' | 'CloudFog' | 'Snowflake' | 'Heart' | 'Coins' | 'Sparkles' | 'ShieldAlert' | 'Users' | 'Swords' | 'Skull' | 'Flame' | 'Gem' | 'Bomb';
  costBoredom: number; // Modulates how boredom shifts when the GM acts
  execute: (
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    addLog: (text: string, type: 'combat' | 'info' | 'loot' | 'system' | 'danger' | 'craft') => void
  ) => { success: boolean; message: string };
}

/**
 * Calculates direction string from player coordinate to target coordinate to nudge players.
 */
export function getDirectionString(px: number, py: number, tx: number, ty: number): string {
  const dx = tx - px;
  const dy = ty - py;
  
  if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
    return 'nearby';
  }
  
  let dir = '';
  if (dy < 0) dir += 'North';
  else if (dy > 0) dir += 'South';
  
  if (dx > 0) dir += dir ? '-East' : 'East';
  else if (dx < 0) dir += dir ? '-West' : 'West';
  
  return dir;
}

/**
 * Searches expanding rings around the player, preferentially starting further out
 * (e.g. radius 5 to 11, out of player vicinity) to spawn entities, falling back
 * to closer rings (radius 1 to 4) if no empty space exists there.
 */
export function findWalkableSpotNearPlayer(gameState: GameState, minRadius: number = 5, maxRadius: number = 11): { x: number; y: number } | null {
  const px = gameState.playerX;
  const py = gameState.playerY;
  const map = gameState.map;
  const w = gameState.levelWidth;
  const h = gameState.levelHeight;

  // 1. First choice: Search out of vicinity (5 to 11 tiles away)
  for (let r = minRadius; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = px + dx;
        const ty = py + dy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          const tile = map[ty]?.[tx];
          const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
          
          const isPlayer = tx === px && ty === py;
          const hasEnemy = gameState.enemies.some(e => e.x === tx && e.y === ty);
          const hasNpc = gameState.npcs && gameState.npcs.some(n => n.x === tx && n.y === ty);
          
          if (isWalkable && !isPlayer && !hasEnemy && !hasNpc) {
            return { x: tx, y: ty };
          }
        }
      }
    }
  }

  // 2. Backup choice: Fallback to closer vicinity (1 to 4 tiles away) if requested range has no room
  for (let r = 1; r <= 4; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = px + dx;
        const ty = py + dy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          const tile = map[ty]?.[tx];
          const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
          
          const isPlayer = tx === px && ty === py;
          const hasEnemy = gameState.enemies.some(e => e.x === tx && e.y === ty);
          const hasNpc = gameState.npcs && gameState.npcs.some(n => n.x === tx && n.y === ty);
          
          if (isWalkable && !isPlayer && !hasEnemy && !hasNpc) {
            return { x: tx, y: ty };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Centered configuration for all Game Master commands.
 * Very modular! To add a new command, simply add another object to this array.
 */
export const GM_COMMANDS: GmCommand[] = [
  // ==========================================
  // WEATHER CONTROL CATEGORY
  // ==========================================
  {
    id: 'weather_clear',
    name: 'Cast Solar Radiance',
    description: 'Banish rain, frost and dark mists instantly. Restores overworld weather to CLEAR.',
    category: 'Weather Control',
    iconName: 'Sun',
    costBoredom: -10,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => ({ ...prev, weather: 'clear' }));
      addLog('☀️ A radiant solar wave sweeps over the lands! The overworld weather clears of cloud formations.', 'system');
      return { success: true, message: 'Sunny warmth restores the lands!' };
    }
  },
  {
    id: 'weather_rainy',
    name: 'Summon Torrential Rains',
    description: 'Force thick gray storm clouds over the area, changing overworld weather to RAINY (if supported by biome).',
    category: 'Weather Control',
    iconName: 'CloudRain',
    costBoredom: -15,
    execute: (gameState, setGameState, addLog) => {
      const currentBiome = gameState.biome || 'forest';
      const validWeather = getValidWeatherForBiome(currentBiome, 'rainy');
      if (validWeather !== 'rainy') {
        addLog(`⚠️ GM Command Warning: The ${currentBiome.toUpperCase()} biome cannot sustain rain storm weather! Shifted to ${validWeather.toUpperCase()} instead.`, 'system');
        setGameState(prev => ({ ...prev, weather: validWeather }));
        return { success: false, message: `Rain is not supported in ${currentBiome.toUpperCase()} biome.` };
      }
      setGameState(prev => ({ ...prev, weather: 'rainy' }));
      addLog('🌧️ Dark storm clouds gather suddenly as Torrential Rains sweep across the area, pouring water droplets against the paths.', 'system');
      return { success: true, message: 'Fierce rainstorms activated.' };
    }
  },
  {
    id: 'weather_foggy',
    name: 'Breathe Nether Fog',
    description: 'Settle heavy gray blind-fog blankets over the land, shifting weather to FOGGY.',
    category: 'Weather Control',
    iconName: 'CloudFog',
    costBoredom: -12,
    execute: (gameState, setGameState, addLog) => {
      const currentBiome = gameState.biome || 'forest';
      const validWeather = getValidWeatherForBiome(currentBiome, 'foggy');
      setGameState(prev => ({ ...prev, weather: validWeather }));
      addLog('😶‍🌫️ A heavy, chilled Nether Fog blankets the soil, limiting ambient light perception.', 'system');
      return { success: true, message: 'Low-visibility fog summoned.' };
    }
  },
  {
    id: 'weather_snowy',
    name: 'Command Frost Storm',
    description: 'Draw freezing sub-zero clouds over active wilderness, changing weather to SNOWY (if supported by biome).',
    category: 'Weather Control',
    iconName: 'Snowflake',
    costBoredom: -18,
    execute: (gameState, setGameState, addLog) => {
      const currentBiome = gameState.biome || 'forest';
      const validWeather = getValidWeatherForBiome(currentBiome, 'snowy');
      if (validWeather !== 'snowy') {
        addLog(`⚠️ GM Command Warning: The ${currentBiome.toUpperCase()} biome cannot sustain snow storm weather! Shifted to ${validWeather.toUpperCase()} instead.`, 'system');
        setGameState(prev => ({ ...prev, weather: validWeather }));
        return { success: false, message: `Snow is not supported in ${currentBiome.toUpperCase()} biome.` };
      }
      setGameState(prev => ({ ...prev, weather: 'snowy' }));
      addLog('❄️ Howling sub-zero winds initiate a fierce Frost Storm, scattering freezing mountain frost particles across the landscape.', 'system');
      return { success: true, message: 'Arctic white-out initiated!' };
    }
  },

  // ==========================================
  // HERO BLESSINGS & BOONS
  // ==========================================
  {
    id: 'heal_vitality',
    name: 'Divine Healing Flare',
    description: 'Grant instant absolute regeneration, restoring player Max Vitality (HP) and Mana (MP).',
    category: 'Hero Blessings',
    iconName: 'Heart',
    costBoredom: -20,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          hp: prev.playerStats.maxHp,
          mp: prev.playerStats.maxMp
        }
      }));
      addLog('💖 A celestial healing resonance washes through you! Your health and cosmic mana reservoirs are fully filled.', 'loot');
      return { success: true, message: 'Full HP and Mana completely restored!' };
    }
  },
  {
    id: 'grant_gold',
    name: 'Sovereign Resource Care-Package',
    description: 'Inject +5 premium metal alloys and +2 elemental catalysts into the backpack.',
    category: 'Hero Blessings',
    iconName: 'Gem',
    costBoredom: -15,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => {
        const nextMats = { ...prev.inventoryMaterials };
        nextMats['mat_mithril'] = (nextMats['mat_mithril'] || 0) + 3;
        nextMats['mat_obsidian'] = (nextMats['mat_obsidian'] || 0) + 2;

        const nextCats = { ...prev.inventoryCatalysts };
        nextCats['cat_lightning'] = (nextCats['cat_lightning'] || 0) + 1;
        nextCats['cat_fire'] = (nextCats['cat_fire'] || 0) + 1;

        return {
          ...prev,
          inventoryMaterials: nextMats,
          inventoryCatalysts: nextCats
        };
      });
      addLog('📦 You found a forgotten Sovereign Resource Cache on the ground containing (+3 Mithril, +2 Obsidian, and +2 Catalyst Shards)!', 'loot');
      return { success: true, message: 'Premium materials package deposited safely.' };
    }
  },
  {
    id: 'warp_dungeon_depth1',
    name: 'Open Portal to Abyss Dungeon',
    description: 'Instantly warp the hero straight into Depth 1 of the Abyss Dungeon.',
    category: 'Spawning Actions',
    iconName: 'Sparkles',
    costBoredom: -20,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => {
        const chunkX = prev.currentChunkX;
        const chunkY = prev.currentChunkY;
        const dungeonKey = `${chunkX},${chunkY}_depth-1`;
        const dungeonLevelsSafe = prev.dungeonLevels || {};
        const existing = dungeonLevelsSafe[dungeonKey];

        if (existing) {
          const { x: stairsUpX, y: stairsUpY } = findStairsOrWalkablePosition(existing.map, TileType.StairsUp, `Abyss Floor 1`);

          const fov = computeFOV(stairsUpX, stairsUpY, existing.map, 8);
          const discovered = existing.map.map((row, y) =>
            row.map((cell, x) => (existing.discovered?.[y]?.[x] || fov?.[y]?.[x] || false))
          );

          return {
            ...prev,
            isOverworld: false,
            isArena: false,
            dungeonEntranceChunkX: chunkX,
            dungeonEntranceChunkY: chunkY,
            dungeonEntrancePlayerX: prev.isOverworld ? prev.playerX : (prev.dungeonEntrancePlayerX ?? prev.playerX),
            dungeonEntrancePlayerY: prev.isOverworld ? prev.playerY : (prev.dungeonEntrancePlayerY ?? prev.playerY),
            playerX: stairsUpX,
            playerY: stairsUpY,
            map: existing.map,
            visible: fov,
            discovered: discovered,
            enemies: existing.enemies,
            traps: existing.traps,
            chests: existing.chests,
            npcs: [],
            dungeonProps: existing.props || [],
            playerStats: {
              ...prev.playerStats,
              depth: 1
            }
          };
        } else {
          const nextLvl = generateLevel(
            64,
            40,
            1,
            prev.playerStats.turnsPlayed,
            prev.playerStats.realTimeSeconds,
            prev.playerStats,
            prev.currentWeapon,
            prev.defeatedEnemiesCount,
            prev.clearedCamps?.length || 0
          );
          const fov = computeFOV(nextLvl.playerX, nextLvl.playerY, nextLvl.map, 8);
          const discovered = nextLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
          const props = generateDungeonProps(nextLvl.map, 1);

          return {
            ...prev,
            isOverworld: false,
            isArena: false,
            dungeonEntranceChunkX: chunkX,
            dungeonEntranceChunkY: chunkY,
            dungeonEntrancePlayerX: prev.isOverworld ? prev.playerX : (prev.dungeonEntrancePlayerX ?? prev.playerX),
            dungeonEntrancePlayerY: prev.isOverworld ? prev.playerY : (prev.dungeonEntrancePlayerY ?? prev.playerY),
            playerX: nextLvl.playerX,
            playerY: nextLvl.playerY,
            map: nextLvl.map,
            visible: fov,
            discovered: discovered,
            enemies: nextLvl.enemies,
            traps: nextLvl.traps,
            chests: nextLvl.chests,
            npcs: [],
            dungeonProps: props,
            dungeonLevels: {
              ...dungeonLevelsSafe,
              [dungeonKey]: {
                depth: 1,
                chunkX,
                chunkY,
                map: nextLvl.map,
                discovered,
                enemies: nextLvl.enemies,
                traps: nextLvl.traps,
                chests: nextLvl.chests,
                lootPiles: [],
                corpses: [],
                bloodSplatters: [],
                props
              }
            },
            playerStats: {
              ...prev.playerStats,
              depth: 1
            }
          };
        }
      });
      addLog('🌀 GM TELEPORT: Opened an abyss portal, warping you directly into Dungeon Abyss Floor 1!', 'system');
      return { success: true, message: 'Warped to Dungeon Abyss Floor 1!' };
    }
  },
  {
    id: 'buff_combat_stats',
    name: 'Aegis Vanguard Rune',
    description: 'Etch ancient star-runes into the player, delivering +4 permanent bonus Damage and +4 Defense.',
    category: 'Hero Blessings',
    iconName: 'Sparkles',
    costBoredom: -25,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          atk: prev.playerStats.atk + 4,
          def: prev.playerStats.def + 4
        }
      }));
      addLog('✨ An ancient Aegis Vanguard Rune manifests upon your skin! Granted a permanent bonus of +4 Attack and +4 Defense.', 'loot');
      return { success: true, message: '+4 ATK & +4 DEF granted permanently!' };
    }
  },
  {
    id: 'grant_exp',
    name: 'Infuse Arcane Grimoire',
    description: 'Unleash direct cognitive feedback, feeding +250 XP onto the player instantly.',
    category: 'Hero Blessings',
    iconName: 'Gem',
    costBoredom: -15,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => {
        const nextXp = prev.playerStats.xp + 250;
        let finalXp = nextXp;
        let level = prev.playerStats.level;
        let nextLevelXp = prev.playerStats.nextLevelXp;
        let maxHp = prev.playerStats.maxHp;
        let maxMp = prev.playerStats.maxMp;
        let atk = prev.playerStats.atk;
        let def = prev.playerStats.def;
        let levelledUp = false;

        // Level Up cycles
        while (finalXp >= nextLevelXp) {
          levelledUp = true;
          finalXp -= nextLevelXp;
          level += 1;
          nextLevelXp = Math.floor(nextLevelXp * 1.5);
          maxHp += 15;
          maxMp += 8;
          atk += 1;
          def += 1;
        }

        const nextStats = {
          ...prev.playerStats,
          xp: finalXp,
          level,
          nextLevelXp,
          maxHp,
          maxMp,
          hp: levelledUp ? maxHp : prev.playerStats.hp,
          mp: levelledUp ? maxMp : prev.playerStats.mp,
          atk,
          def
        };

        return {
          ...prev,
          playerStats: nextStats
        };
      });

      addLog('🔮 You studied an Arcane Grimoire! Absorbed +250 Experience Points from the glowing glyphs.', 'loot');
      return { success: true, message: 'Synthesized +250 XP into player mind!' };
    }
  },
  {
    id: 'repair_durability',
    name: 'Aero Forge Mend',
    description: 'Use specialized micro-kinetic sparks to completely repair all active equipped weapons and armor pieces back to max durability.',
    category: 'Hero Blessings',
    iconName: 'Bomb',
    costBoredom: -15,
    execute: (gameState, setGameState, addLog) => {
      const repairItem = (item: EquipmentItem | null): EquipmentItem | null => {
        if (!item) return null;
        return {
          ...item,
          durability: item.maxDurability || 100
        };
      };

      setGameState(prev => {
        const nextWeapon = prev.currentWeapon ? {
          ...prev.currentWeapon,
          durability: prev.currentWeapon.maxDurability || 100
        } : null;

        return {
          ...prev,
          currentWeapon: nextWeapon,
          equippedArmor: repairItem(prev.equippedArmor),
          equippedHelmet: repairItem(prev.equippedHelmet),
          equippedGloves: repairItem(prev.equippedGloves),
          equippedBoots: repairItem(prev.equippedBoots),
          equippedShield: repairItem(prev.equippedShield),
        };
      });

      addLog('🛡️ A soothing Aero Forge Mend wind wraps around your gear! All active equipment and weapons are fully repaired.', 'loot');
      return { success: true, message: 'All equipped gears fully restored to 100% durability!' };
    }
  },

  // ==========================================
  // SPAWNING ACTIONS CATEGORY
  // ==========================================
  {
    id: 'spawn_ally_soldier',
    name: 'Summon Iron-Clad Companion',
    description: 'Spawns a durable Shieldbearer mercenary adjacent to player to shield and attack alongside your party.',
    category: 'Spawning Actions',
    iconName: 'Users',
    costBoredom: -30,
    execute: (gameState, setGameState, addLog) => {
      if (gameState.followers.length >= 3) {
        return { success: false, message: 'Maximum 3 active allies are already reached!' };
      }

      const spot = findWalkableSpotNearPlayer(gameState);
      if (!spot) {
        return { success: false, message: 'No safe walkable coordinates nearby to spawn ally!' };
      }

      const companionId = `gm_ally_${Date.now()}`;
      const newAlly: Follower = {
        id: companionId,
        name: 'Grom (Iron Defender)',
        archetypeId: 'guard',
        role: 'Iron Defender',
        char: '🐕',
        color: '#f59e0b',
        hp: 120,
        maxHp: 120,
        atk: 9,
        def: 8,
        level: 1,
        xp: 0,
        xpNext: 100,
        mode: 'follow',
        equipment: {
          weapon: null,
          armor: null
        },
        inventory: [],
        injuries: [],
        personality: 'Stoic vanguard and guardian.',
        temperament: 'Calm'
      };

      setGameState(prev => {
        const newAllyActor: Enemy = {
          id: `actor_${companionId}`,
          x: spot.x,
          y: spot.y,
          type: EnemyType.Goblin, // Standard melee follow/fight brain matches Goblin's basic triggers
          name: newAlly.name,
          hp: newAlly.hp,
          maxHp: newAlly.maxHp,
          atk: newAlly.atk,
          def: newAlly.def,
          range: 1,
          speed: 1,
          color: newAlly.color,
          char: newAlly.char,
          state: EnemyState.Chasing,
          isElite: false,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
          isFollower: true,
          followerId: companionId
        };

        return {
          ...prev,
          enemies: [...prev.enemies, newAllyActor],
          followers: [...prev.followers, newAlly]
        };
      });

      const dirStr = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
      addLog(`⚔️ Grom (Iron Defender) runs onto the path from the [${dirStr.toUpperCase()}], rushing to shield your party!`, 'loot');
      return { success: true, message: `Summoned defender far to the ${dirStr} at (${spot.x}, ${spot.y}).` };
    }
  },
  {
    id: 'spawn_gift_chest',
    name: 'Manifest Dragon Cache',
    description: 'Erect an ancient ancient chest on a walkable space filled with Dragon scales and valuable Mithril ores.',
    category: 'Spawning Actions',
    iconName: 'Gem',
    costBoredom: -25,
    execute: (gameState, setGameState, addLog) => {
      const spot = findWalkableSpotNearPlayer(gameState);
      if (!spot) {
        return { success: false, message: 'No spacing for a chest.' };
      }

      const newChest = {
        id: `gm_chest_${Date.now()}`,
        x: spot.x,
        y: spot.y,
        isOpened: false,
        materials: ['mat_dragonscale', 'mat_mithril', 'mat_obsidian'],
        catalysts: ['cat_fire', 'cat_lightning'],
        gold: 0
      };

      setGameState(prev => ({
        ...prev,
        chests: [...prev.chests, newChest]
      }));

      const dirStr = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
      addLog(`🎁 You spot a glowing, forgotten Dragon Cache resting on the ground to the [${dirStr.toUpperCase()}]! Go claim those ultimate materials!`, 'loot');
      return { success: true, message: `Manifested cache to the ${dirStr} at (${spot.x}, ${spot.y})!` };
    }
  },
  {
    id: 'spawn_titan_troll',
    name: 'Materialize Cavern Behemoth',
    description: 'Force-sap an elite massive Troll boss onto the local terrain containing huge healthpools. Spawns legendary materials on defeat!',
    category: 'Spawning Actions',
    iconName: 'Skull',
    costBoredom: -35,
    execute: (gameState, setGameState, addLog) => {
      const spot = findWalkableSpotNearPlayer(gameState);
      if (!spot) {
        return { success: false, message: 'No safe space nearby!' };
      }

      const behemothId = `gm_behemoth_${Date.now()}`;
      const behemoth: Enemy = {
        id: behemothId,
        x: spot.x,
        y: spot.y,
        type: EnemyType.Troll,
        name: 'Gargan (Titan Cave Troll)',
        hp: 450,
        maxHp: 450,
        atk: 24,
        def: 12,
        range: 1,
        speed: 2, // acts slowly but strikes with heavy shockwaves
        color: '#f43f5e',
        char: '👹',
        state: EnemyState.Patrolling,
        isElite: true,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      setGameState(prev => ({
        ...prev,
        enemies: [...prev.enemies, behemoth]
      }));

      const dirStr = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
      addLog(`💀 WARNING: A heavy thud rumbles from the [${dirStr.toUpperCase()}] as Gargan (Titan Cave Troll) emerges from the deeper caverns! Prepare for battle!`, 'danger');
      return { success: true, message: `Injected behemoth to the ${dirStr} at (${spot.x}, ${spot.y})!` };
    }
  },
  {
    id: 'castle_invasion',
    name: 'Cast Castle invasion Force',
    description: 'Trigger an active siege horde! Strategic assault squads of Orcs, Undead, and Goblins will storm the gate arches. (Can only be cast within active overworld Castle Towns)',
    category: 'Spawning Actions',
    iconName: 'ShieldAlert',
    costBoredom: -40,
    execute: (gameState, setGameState, addLog) => {
      // Check if we are in a Castle Town in the overworld (depth === 0)
      const isAtCastle = gameState.playerStats.depth === 0 && isCastleTownAtChunk(gameState.currentChunkX, gameState.currentChunkY);
      if (!isAtCastle) {
        return { success: false, message: 'This event can only be triggered while inside an active overworld Castle Town!' };
      }

      const midX = Math.floor(gameState.levelWidth / 2);
      const midY = Math.floor(gameState.levelHeight / 2);

      // Define small teams outside/inside of the 4 gates
      const invadersToSpawn = [
        // West Gate Team
        { x: 1, y: midY, name: 'Invasion Orc Raider', type: EnemyType.OrcBrute, char: '👹', color: '#f43f5e', hp: 80, atk: 11, def: 4, range: 1, speed: 1 },
        { x: 1, y: midY - 2, name: 'Invasion Skeleton Sentry', type: EnemyType.SkeletonMage, char: '🏹', color: '#94a3b8', hp: 40, atk: 7, def: 2, range: 3, speed: 1 },
        
        // East Gate Team
        { x: 48, y: midY, name: 'Invasion Orc Gladiator', type: EnemyType.OrcBrute, char: '👹', color: '#f43f5e', hp: 80, atk: 11, def: 4, range: 1, speed: 1 },
        { x: 48, y: midY + 2, name: 'Invasion Witchdoctor', type: EnemyType.SkeletonMage, char: '🧙', color: '#e11d48', hp: 50, atk: 9, def: 3, range: 3, speed: 1 },

        // North Gate Team
        { x: midX, y: 0, name: 'Warlord Siege Chieftain', type: EnemyType.Troll, char: '👺', color: '#be123c', hp: 140, atk: 14, def: 6, range: 1, speed: 2 },
        { x: midX - 2, y: 0, name: 'Invasion Goblin Thief', type: EnemyType.Goblin, char: '💣', color: '#16a34a', hp: 45, atk: 10, def: 2, range: 1, speed: 1 },

        // South Gate Team
        { x: midX, y: 29, name: 'Invasion Exile Bandit', type: EnemyType.Bandit, char: '👤', color: '#d97706', hp: 65, atk: 9, def: 3, range: 1, speed: 1 },
        { x: midX + 2, y: 29, name: 'Invasion Spy', type: EnemyType.Rat, char: '🐀', color: '#a1a1aa', hp: 30, atk: 5, def: 2, range: 1, speed: 1 }
      ];

      setGameState(prev => {
        const timestamp = Date.now();
        const nextEnemies = [...prev.enemies];

        invadersToSpawn.forEach((inv, index) => {
          const ty = Math.max(0, Math.min(prev.levelHeight - 1, inv.y));
          const tx = Math.max(0, Math.min(prev.levelWidth - 1, inv.x));
          
          nextEnemies.push({
            id: `invasion_enemy_${timestamp}_${index}`,
            x: tx,
            y: ty,
            type: inv.type,
            name: inv.name,
            hp: inv.hp,
            maxHp: inv.hp,
            atk: inv.atk,
            def: inv.def,
            range: inv.range,
            speed: inv.speed,
            color: inv.color,
            char: inv.char,
            state: EnemyState.Chasing,
            isElite: inv.name.includes('Chieftain'),
            patrolPath: [],
            patrolIndex: 0,
            debuffs: []
          });
        });

        return {
          ...prev,
          enemies: nextEnemies
        };
      });

      addLog('⚔️ CASTLE UNDER SIEGE: Horns blow as a massive Gate Invasion begins! Defend Oakhaven Keep from incoming assault squads!', 'danger');
      return { success: true, message: 'Deployed 8 assault invaders across the 4 castle gate entryways!' };
    }
  },
  {
    id: 'spawn_bandit_camp',
    name: 'Spawn Roaming Bandit Camp',
    description: 'Summons a small camping outpost of 2-3 Outlaw Bandits around a newly lit wood campfire nearby.',
    category: 'Spawning Actions',
    iconName: 'Swords',
    costBoredom: -25,
    execute: (gameState, setGameState, addLog) => {
      const campSpot = findWalkableSpotNearPlayer(gameState, 5, 11);
      if (!campSpot) {
        return { success: false, message: 'No safe spacing nearby to set up a bandit camp!' };
      }

      setGameState(prev => {
        const nextMap = prev.map.map(row => [...row]);
        // Set the campfire at the center
        nextMap[campSpot.y][campSpot.x] = TileType.Campfire;

        // Set the surrounding spaces discovered and visible to make the announcement and lore clear
        const nextVisible = prev.visible.map(row => [...row]);
        const nextDiscovered = prev.discovered.map(row => [...row]);
        
        // Exposing a 3x3 around the camp
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ty = campSpot.y + dy;
            const tx = campSpot.x + dx;
            if (tx >= 0 && tx < prev.levelWidth && ty >= 0 && ty < prev.levelHeight) {
              nextVisible[ty][tx] = true;
              nextDiscovered[ty][tx] = true;
            }
          }
        }

        const nextEnemies = [...prev.enemies];
        const count = Math.floor(Math.random() * 2) + 2; // 2 or 3 bandits
        const timestamp = Date.now();
        let spawnedCount = 0;

        // Find surrounding cells
        const neighbors = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: -1 },
          { dx: 1, dy: -1 },
          { dx: -1, dy: 1 },
          { dx: 1, dy: 1 }
        ];

        // Shuffle neighbors list to distribute bandits randomly around the campfire
        const shuffledNeighbors = [...neighbors].sort(() => Math.random() - 0.5);

        for (const offset of shuffledNeighbors) {
          if (spawnedCount >= count) break;
          const ex = campSpot.x + offset.dx;
          const ey = campSpot.y + offset.dy;

          if (ex >= 0 && ex < prev.levelWidth && ey >= 0 && ey < prev.levelHeight) {
            const tile = nextMap[ey][ex];
            const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
            const isPlayer = ex === prev.playerX && ey === prev.playerY;
            const hasExistingEnemy = nextEnemies.some(e => e.x === ex && e.y === ey);
            const hasExistingNpc = prev.npcs && prev.npcs.some(n => n.x === ex && n.y === ey);

            if (isWalkable && !isPlayer && !hasExistingEnemy && !hasExistingNpc) {
              nextEnemies.push({
                id: `bandit_camp_mob_${timestamp}_${spawnedCount}`,
                x: ex,
                y: ey,
                type: EnemyType.Bandit,
                name: spawnedCount === 0 ? 'Outlaw Bandit Leader' : 'Exile Camp Bandit',
                hp: spawnedCount === 0 ? 85 : 55,
                maxHp: spawnedCount === 0 ? 85 : 55,
                atk: spawnedCount === 0 ? 11 : 8,
                def: spawnedCount === 0 ? 4 : 2,
                range: 1,
                speed: 1,
                color: spawnedCount === 0 ? '#b91c1c' : '#d97706',
                char: '👤',
                state: EnemyState.Patrolling,
                isElite: spawnedCount === 0,
                patrolPath: [],
                patrolIndex: 0,
                debuffs: []
              });
              spawnedCount++;
            }
          }
        }

        return {
          ...prev,
          map: nextMap,
          visible: nextVisible,
          discovered: nextDiscovered,
          enemies: nextEnemies
        };
      });

      const dirStr = getDirectionString(gameState.playerX, gameState.playerY, campSpot.x, campSpot.y);
      addLog(`🔥 You hear rowdy laughter and crackling wood nearby... A small Bandit Camp has set up campfire to the [${dirStr.toUpperCase()}]! Go disperse them!`, 'danger');
      return { success: true, message: `Successfully spawned a bandit campfire and outlaw bandits to the ${dirStr}!` };
    }
  },

  // ==========================================================
  // TACTICAL SMITES & CLEARS
  // ==========================================
  {
    id: 'smite_all_foes',
    name: 'Cast Cataclysm Solar Flare',
    description: 'Chamber a massive thermo-electric storm dealing 40 instant fire damage to ALL spawned hostile enemies on the current floor.',
    category: 'Tactical Smites',
    iconName: 'Flame',
    costBoredom: -30,
    execute: (gameState, setGameState, addLog) => {
      let hostileCount = 0;
      setGameState(prev => {
        const nextEnemies = prev.enemies.map(enemy => {
          // Exclude companions/allies and town guards
          const isHostile = !enemy.isFollower && !enemy.isTownGuard;
          if (isHostile) {
            hostileCount++;
            return {
              ...enemy,
              hp: Math.max(0, enemy.hp - 40)
            };
          }
          return enemy;
        }).filter(enemy => enemy.hp > 0 || !(!enemy.isFollower && !enemy.isTownGuard)); // allow to die immediately if HP drops to 0

        return {
          ...prev,
          enemies: nextEnemies
        };
      });

      addLog(`🔥 A devastating Cataclysm Solar Flare breaks from the skies! Searing light deals 40 Damage to ${hostileCount} hostile entities on screen.`, 'danger');
      return { success: true, message: `Singed ${hostileCount} enemies with 40 holy fire damage.` };
    }
  },
  {
    id: 'clear_floor_traps',
    name: 'Dispel Hex Trap Sweep',
    description: 'Force a sonic sweeping resonance that instantly breaks and deactivates ALL hidden/active traps on the map.',
    category: 'Tactical Smites',
    iconName: 'ShieldAlert',
    costBoredom: -20,
    execute: (gameState, setGameState, addLog) => {
      let trapCount = 0;
      setGameState(prev => {
        trapCount = prev.traps.length;
        return {
          ...prev,
          traps: [] // completely wipes out layout traps for maximum player safety!
        };
      });

      addLog('🔊 A powerful Dispel Hex Trap Sweep resonates through the ground! All ground spikes, vents, and lethal spring traps are safely vaporized!', 'system');
      return { success: true, message: `Disarmed all ${trapCount} traps on this floor layout.` };
    }
  },
  {
    id: 'gm_spawn_poi',
    name: 'Summon Ancient Monument',
    description: 'Materialize a random ancient monument (shrine, monolith, sulfur altar, fossil) right next to the player, sculpting the surrounding scenery layout.',
    category: 'Spawning Actions',
    iconName: 'Sparkles',
    costBoredom: -15,
    execute: (gameState, setGameState, addLog) => {
      if (!gameState.isOverworld) {
        return { success: false, message: "Monuments can only be summoned in the Overworld wilderness!" };
      }
      const spot = findWalkableSpotNearPlayer(gameState);
      if (!spot) {
        return { success: false, message: "No empty space nearby to materialize a monument!" };
      }

      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      const types: ('monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil')[] = ['monolith', 'shrine', 'hearth', 'sunken_keep', 'fossil'];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      
      const POI_DATA = {
        monolith: { name: "Whispering Lore Monolith", char: '🗿', color: '#818cf8', desc: "An ancient dark slate obelisk whispering history.", snap: "Spelled inside the monolith: 'Let those who seek wisdom look to the Sun-Titan Sunder.'", chapter: "sunder_oakhaven" },
        shrine: { name: "Leyline Whisper Shrine", char: '⛲', color: '#10b981', desc: "A silver-marble Elven well bubbling with liquid lavender mana.", snap: "A silver tablet reads: 'Touch the Ley water with humbleness.'", chapter: "elven_diaspora" },
        hearth: { name: "Altar of the Flame Lord", char: '🔥', color: '#f97316', desc: "An active volcanic pedestal venting sulphur vapors.", snap: "A dwarf rune warns: 'Only real metals may endure the crucible. Feed the altar.'", chapter: "flame_lords_crucible" },
        sunken_keep: { name: "Sunken Royal Bastion", char: '🏰', color: '#38bdf8', desc: "Limestone columns of King Kenneth submerging in deep water.", snap: "A mossy inscription: 'Our crown rests at the root of the flooded lake.'", chapter: "sunken_crown" },
        fossil: { name: "Titan Fossil Ribcage", char: '🦴', color: '#e2e8f0', desc: "Gigantic calcified calcium spurs humming tectonic energy.", snap: "An inscription: 'The colossal giants of the first age fell hard, leaving mountains.'", chapter: "titan_conflict" }
      }[selectedType];

      setGameState(prev => {
        const nextChunks = { ...prev.overworldChunks };
        const activeChunk = nextChunks[chunkKey];
        if (!activeChunk) return prev;

        const nextMap = prev.map.map(row => [...row]);
        if (selectedType === 'hearth') {
          nextMap[spot.y][spot.x] = TileType.Floor;
          if (nextMap[spot.y-1]?.[spot.x]) nextMap[spot.y-1][spot.x] = TileType.Campfire;
        } else if (selectedType === 'sunken_keep') {
          nextMap[spot.y][spot.x] = TileType.Floor;
          if (nextMap[spot.y-1]?.[spot.x]) nextMap[spot.y-1][spot.x] = TileType.Water;
        } else if (selectedType === 'shrine') {
          nextMap[spot.y][spot.x] = TileType.Path;
        } else if (selectedType === 'monolith') {
          if (nextMap[spot.y-1]?.[spot.x]) nextMap[spot.y-1][spot.x] = TileType.Torch;
        } else if (selectedType === 'fossil') {
          if (nextMap[spot.y-1]?.[spot.x]) nextMap[spot.y-1][spot.x] = TileType.Wall;
        }

        const newPoiObj = {
          id: `poi_gm_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          name: POI_DATA.name,
          type: selectedType,
          description: POI_DATA.desc,
          historySnippet: POI_DATA.snap,
          chapterId: POI_DATA.chapter,
          isInteracted: false,
          char: POI_DATA.char,
          color: POI_DATA.color
        };

        const oldPois = activeChunk.pois || [];
        nextChunks[chunkKey] = {
          ...activeChunk,
          map: nextMap,
          pois: [...oldPois, newPoiObj]
        };

        const nextVisible = prev.visible.map(row => [...row]);
        const nextDiscovered = prev.discovered.map(row => [...row]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (nextVisible[spot.y + dy]?.[spot.x + dx] !== undefined) {
              nextVisible[spot.y + dy][spot.x + dx] = true;
              nextDiscovered[spot.y + dy][spot.x + dx] = true;
            }
          }
        }

        return {
          ...prev,
          map: nextMap,
          visible: nextVisible,
          discovered: nextDiscovered,
          overworldChunks: nextChunks
        };
      });

      const dirStr = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
      addLog(`⚡ The earth shifts as [${POI_DATA.name}] emerges far to the [${dirStr.toUpperCase()}]! The ground rumbles with ancient history.`, 'system');
      return { success: true, message: `Successfully spawned ${POI_DATA.name} far to the ${dirStr}!` };
    }
  },
  {
    id: 'gm_spawn_lake',
    name: 'Sculpt Serene Fishing Lake',
    description: 'Carve a 3x3 freshwater lake containing active fish directly nearby, adding immersive historical water lore to Oakhaven.',
    category: 'Spawning Actions',
    iconName: 'CloudRain',
    costBoredom: -20,
    execute: (gameState, setGameState, addLog) => {
      if (!gameState.isOverworld) {
        return { success: false, message: "Lakes can only be sculpted in the Overworld wilderness!" };
      }
      const pX = gameState.playerX;
      const pY = gameState.playerY;
      
      const spot = findWalkableSpotNearPlayer(gameState);
      if (!spot) {
        return { success: false, message: "No empty space nearby to base a fishing lake!" };
      }

      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      
      setGameState(prev => {
        const nextChunks = { ...prev.overworldChunks };
        const activeChunk = nextChunks[chunkKey];
        if (!activeChunk) return prev;

        const nextMap = prev.map.map(row => [...row]);
        const w = prev.levelWidth;
        const h = prev.levelHeight;

        // Carve a 3x3 lake centered at 'spot'
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const tx = spot.x + dx;
            const ty = spot.y + dy;
            if (tx === pX && ty === pY) continue;
            if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
              nextMap[ty][tx] = TileType.Water;
            }
          }
        }

        const shoreX = Math.max(0, Math.min(w - 1, spot.x + 2));
        const shoreY = spot.y;
        if (shoreX !== pX || shoreY !== pY) {
          nextMap[shoreY][shoreX] = TileType.Path;
        }

        const newPoiObj = {
          id: `poi_lake_${Date.now()}`,
          x: shoreX,
          y: shoreY,
          name: "Whispering Mirror Lake",
          type: 'lake',
          description: "A crystal clear glacial lake of deep mineral water. Ripples of active silver-scaled fish catch the twilight glare.",
          historySnippet: "Inscribed on a wet stone: 'Here flows the pristine runoff of Titan Oakhaven, where the primal waters of life emerge.'",
          chapterId: "sunken_crown",
          isInteracted: false,
          char: '⛲',
          color: '#06b6d4'
        };

        const oldPois = activeChunk.pois || [];
        nextChunks[chunkKey] = {
          ...activeChunk,
          map: nextMap,
          pois: [...oldPois, newPoiObj]
        };

        const nextMats = {
          ...prev.inventoryMaterials,
          'mat_raw_fish': (prev.inventoryMaterials['mat_raw_fish'] || 0) + 1
        };

        const nextVisible = prev.visible.map(row => [...row]);
        const nextDiscovered = prev.discovered.map(row => [...row]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (nextVisible[spot.y + dy]?.[spot.x + dx] !== undefined) {
              nextVisible[spot.y + dy][spot.x + dx] = true;
              nextDiscovered[spot.y + dy][spot.x + dx] = true;
            }
          }
        }

        return {
          ...prev,
          map: nextMap,
          visible: nextVisible,
          discovered: nextDiscovered,
          inventoryMaterials: nextMats,
          overworldChunks: nextChunks
        };
      });

      const dirStr = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
      addLog(`🌊 A pristine body of water, Whispering Mirror Lake, forms far to the [${dirStr.toUpperCase()}]! Cold freshwater surges outward, splashy with river fish.`, 'system');
      return { success: true, message: `Materialized Mirror Lake far to the ${dirStr}, granting 1x Raw River Fish.` };
    }
  },
  {
    id: 'gm_locate_poi',
    name: 'Locate Nearest Landmark',
    description: 'Invoke oracle sights to reveal coordinates and distance to the nearest ancient landmark in this wilderness.',
    category: 'Hero Blessings',
    iconName: 'Sparkles',
    costBoredom: -5,
    execute: (gameState, setGameState, addLog) => {
      if (!gameState.isOverworld) {
        return { success: false, message: "Landmarks only exist in the overworld wilderness!" };
      }
      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      const activeChunk = gameState.overworldChunks[chunkKey];
      const pois = activeChunk?.pois || [];
      if (pois.length === 0) {
        return { success: false, message: "No active landmarks found in this region chunk!" };
      }

      const px = gameState.playerX;
      const py = gameState.playerY;
      
      let nearest = pois[0];
      let minDist = 9999;
      pois.forEach(p => {
        const d = Math.abs(px - p.x) + Math.abs(py - p.y);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      });

      setGameState(prev => {
        const nextDiscovered = prev.discovered.map(row => [...row]);
        if (nextDiscovered[nearest.y]?.[nearest.x] !== undefined) {
          nextDiscovered[nearest.y][nearest.x] = true;
        }
        return { ...prev, discovered: nextDiscovered };
      });

      addLog(`🧭 Ancestral Guidance: Landmarked monument [${nearest.name}] is located ${minDist} tiles away at coordinates (${nearest.x}, ${nearest.y})!`, 'loot');
      return { success: true, message: `Pointed hero to ${nearest.name} at coordinate (${nearest.x}, ${nearest.y}).` };
    }
  },
  {
    id: 'gm_teleport_poi',
    name: 'Teleport to Nearest Landmark',
    description: 'Instantly warp space and fold time to land directly adjacent to the nearest ancient landmark.',
    category: 'Hero Blessings',
    iconName: 'Sparkles',
    costBoredom: -10,
    execute: (gameState, setGameState, addLog) => {
      if (!gameState.isOverworld) {
        return { success: false, message: "Landmarks only exist in the overworld wilderness!" };
      }
      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      const activeChunk = gameState.overworldChunks[chunkKey];
      const pois = activeChunk?.pois || [];
      if (pois.length === 0) {
        return { success: false, message: "No active landmarks found in this region chunk!" };
      }

      const nearest = pois[0];
      let targetX = nearest.x;
      let targetY = nearest.y + 1;
      if (targetY >= gameState.levelHeight) {
        targetY = nearest.y - 1;
      }

      setGameState(prev => {
        const nextVisible = prev.visible.map(row => [...row]);
        const nextDiscovered = prev.discovered.map(row => [...row]);
        
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (nextVisible[targetY + dy]?.[targetX + dx] !== undefined) {
              nextVisible[targetY + dy][targetX + dx] = true;
              nextDiscovered[targetY + dy][targetX + dx] = true;
            }
          }
        }

        return {
          ...prev,
          playerX: targetX,
          playerY: targetY,
          visible: nextVisible,
          discovered: nextDiscovered
        };
      });

      addLog(`🌌 Space and time fold momentarily! You are warped directly adjacent to the ancient monument [${nearest.name}].`, 'info');
      return { success: true, message: `Warped player directly to ${nearest.name}!` };
    }
  },
  {
    id: 'gm_alchemical_alignment',
    name: 'Invoke Alchemical Alignment',
    description: 'Bestow the Portable Alchemical Transmuter (Wild Magic Flask) to the hero instantly. Grants 3 random catalysts if already possessed.',
    category: 'Hero Blessings',
    iconName: 'Sparkles',
    costBoredom: -10,
    execute: (gameState, setGameState, addLog) => {
      let isAlreadyPossessed = gameState.hasTransmuter;
      setGameState(prev => {
        if (isAlreadyPossessed) {
          // Grant random catalysts
          const nextCats = { ...prev.inventoryCatalysts };
          const catPool = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
          for (let i = 0; i < 3; i++) {
            const randCat = catPool[Math.floor(Math.random() * catPool.length)];
            nextCats[randCat] = (nextCats[randCat] || 0) + 1;
          }
          return {
            ...prev,
            inventoryCatalysts: nextCats
          };
        } else {
          return {
            ...prev,
            hasTransmuter: true
          };
        }
      });

      if (isAlreadyPossessed) {
        addLog(`🧪 An alchemical surge occurs! You already have the Transmuter, so 3 random elemental shards have materialized in your backpack!`, 'loot');
        return { success: true, message: 'Granted 3 random catalyst shards!' };
      } else {
        addLog(`🧪 A sudden alchemical alignment occurs! A mysterious Wild Magic Flask has materialised in your backpack, unlocking the Portable Alchemical Transmuter!`, 'loot');
        return { success: true, message: 'Portable Alchemical Transmuter unlocked!' };
      }
    }
  },
  {
    id: 'gm_meteor_strike',
    name: 'Summon Alchemical Meteor',
    description: 'Direct a blazing Wild Magic meteor to strike at the hero\'s coordinates, leaving a dense loot pile of rare materials, shards, and potential Transmuters.',
    category: 'Spawning Actions',
    iconName: 'Bomb',
    costBoredom: -20,
    execute: (gameState, setGameState, addLog) => {
      setGameState(prev => {
        const nextLoot = [...prev.lootPiles];
        const includeTransmuter = !prev.hasTransmuter && Math.random() < 0.40;
        
        const materials = ['mat_mithril', 'mat_obsidian'];
        if (Math.random() < 0.5) materials.push('mat_dragonscale');
        if (Math.random() < 0.3) materials.push('mat_feybone');
        
        const catalysts = ['cat_fire', 'cat_lightning', 'cat_shadow'];

        nextLoot.push({
          id: `meteor_${Date.now()}`,
          x: prev.playerX,
          y: prev.playerY,
          gold: Math.floor(Math.random() * 120) + 80,
          materials,
          catalysts,
          equipment: includeTransmuter ? [] : [] // We'll handle Transmuter unlock on pickup, or add it as a fake mat that triggers on pickup
        });

        let updatedHasTransmuter = prev.hasTransmuter;
        let transmuterText = "";
        if (includeTransmuter) {
          updatedHasTransmuter = true;
          transmuterText = " Inside the ash, you discover the intact 🧪 Portable Alchemical Transmuter flask!";
        }

        return {
          ...prev,
          lootPiles: nextLoot,
          hasTransmuter: updatedHasTransmuter
        };
      });

      const hasFlaskText = !gameState.hasTransmuter ? " Inside the crater, the legendary 🧪 Portable Alchemical Transmuter flask was found!" : " The strike is rich with stellar alloys!";
      addLog(`☄️ A blazing Alchemical Meteor tears through the sky! A celestial fireball impacts with a deafening boom directly at your feet!${hasFlaskText}`, 'danger');
      return { success: true, message: 'Alchemical Meteor strike complete!' };
    }
  }
];

/**
 * Quick instructions for adding more GM events:
 * Just follow this structure and append it inside the GM_COMMANDS array:
 * 
 * {
 *   id: 'my_unique_id',
 *   name: 'Name of Command',
 *   description: 'Description of what this does.',
 *   category: 'Hero Blessings', // or 'Weather Control', 'Spawning Actions', 'Tactical Smites'
 *   iconName: 'Sparkles',
 *   costBoredom: -10,
 *   execute: (gameState, setGameState, addLog) => {
 *      // Make state mutations here:
 *      setGameState(prev => ({
 *         ...prev,
 *         playerStats: {
 *            ...prev.playerStats,
 *            gold: prev.playerStats.gold + 100
 *         }
 *      }));
 *      addLog('GM gave stuff!', 'loot');
 *      return { success: true, message: 'Victory message' };
 *   }
 * }
 */
