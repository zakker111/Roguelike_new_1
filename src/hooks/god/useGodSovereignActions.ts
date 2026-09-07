import { GameState, EnemyType, TileType, GameLogMessage } from '../../types';
import { playSound } from '../../utils/audio';
import { getEnemyTemplate, generateLevel, generateDungeonProps } from '../../utils/dungeon';
import { carveStructure, getAvailableStructures } from '../../utils/structurePlacer';
import { generateOverworldChunk } from '../../utils/overworld';
import { findStairsOrWalkablePosition } from '../../utils/gameUtils';
import { exportRealmMapToPng } from '../../utils/worldmap/worldMapPngExporter';
import { MATERIAL_LABELS } from './types';

export function useGodSovereignActions(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  godModeActive: boolean,
  setGodModeActive: (active: boolean) => void,
  triggerSuccessLog: (msg: string) => void,
  setJsonError: (err: string | null) => void,
  onClose: () => void
) {
  const handleHealPlayer = () => {
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        hp: prev.playerStats.maxHp,
        mp: prev.playerStats.maxMp
      }
    }));
    const ev = new CustomEvent('spawn-game-effect', {
      detail: { x: gameState.playerX, y: gameState.playerY, text: `HEAL GODMODE`, type: 'heal' }
    });
    window.dispatchEvent(ev);
    triggerSuccessLog('Fully restored HP & MP!');
  };

  const handleGoldBounty = () => {
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold + 500
      }
    }));
    triggerSuccessLog('Added +500 Gold Bounty!');
  };

  const handleWipeEnemies = () => {
    const count = gameState.enemies.length;
    setGameState((prev) => ({
      ...prev,
      enemies: []
    }));
    triggerSuccessLog(`Sovereign Wrath: Cleared all ${count} active hostiles from layout!`);
  };

  const handleRevealFullMap = () => {
    setGameState((prev) => {
      const fullDisc = prev.map.map((row) => row.map(() => true));
      return {
        ...prev,
        discovered: fullDisc,
        visible: fullDisc
      };
    });
    triggerSuccessLog('👁️ GOD VISION: Revealed full local map and fog of war!');
    playSound('magic_cast');
  };

  const handleRevealWholeWorldMap = () => {
    setGameState((prev) => {
      const fullDisc = prev.map.map((row) => row.map(() => true));
      const visited = new Set<string>(prev.visitedChunks || []);
      for (let cx = -25; cx <= 25; cx++) {
        for (let cy = -25; cy <= 25; cy++) {
          visited.add(`${cx},${cy}`);
        }
      }
      return {
        ...prev,
        discovered: fullDisc,
        visible: fullDisc,
        worldMapFullyRevealed: true,
        visitedChunks: Array.from(visited),
        logs: [
          ...prev.logs,
          {
            id: `god_reveal_world_${Date.now()}`,
            text: `🗺️ OMNISCIENT CARTOGRAPHY: Fully revealed and charted the entire world map (2,601 sectors charted across all biomes, dungeons, waystones, and settlements)!`,
            type: 'loot',
            timestamp: 'GOD'
          }
        ]
      };
    });
    triggerSuccessLog('🗺️ OMNISCIENT CARTOGRAPHY: Fully charted and revealed the entire world map!');
    playSound('magic_cast');
  };

  const handleExportWorldMapPng = async () => {
    try {
      triggerSuccessLog('🎨 Generating beautiful 40% scale PNG map rendering...');
      const res = await exportRealmMapToPng(gameState, { scale: 0.4 });
      if (res.success) {
        triggerSuccessLog(`🗺️ MAP EXPORTED: Successfully saved ${res.totalChunks} chunks to ${res.filename} (${res.width}x${res.height}px at 40% scale)!`);
        playSound('quest_complete');
      } else {
        setJsonError(`Map export failed: ${res.error || 'Unknown error'}`);
        playSound('error');
      }
    } catch (err: any) {
      setJsonError(`Map export error: ${err?.message || String(err)}`);
      playSound('error');
    }
  };

  const handleToggleInvinciblePlayer = () => {
    const nextState = !godModeActive;
    (window as any).arenaGodModeActive = nextState;
    (window as any).isInvincibleActive = nextState;
    setGodModeActive(nextState);
    setGameState((prev) => ({
      ...prev,
      godMode: nextState,
      isInvincible: nextState,
      playerStats: {
        ...prev.playerStats,
        isInvincible: nextState,
        hp: nextState ? prev.playerStats.maxHp : prev.playerStats.hp
      },
      logs: [
        ...prev.logs,
        {
          id: `god_invincible_${Date.now()}`,
          text: nextState
            ? `🛡️ INVINCIBILITY ENABLED: Sovereign blessing active! Hero is completely immune to all enemy attacks, traps, environmental hazards, and DoT damage.`
            : `🛡️ Invincibility disabled. Standard damage rules restored.`,
          type: nextState ? 'loot' : 'system',
          timestamp: 'GOD'
        }
      ]
    }));
    playSound(nextState ? 'magic_cast' : 'button_click');
    triggerSuccessLog(
      nextState
        ? '🛡️ INVINCIBLE PLAYER ENABLED: You take 0 damage from all sources!'
        : 'Invincibility disabled. Standard damage rules restored.'
    );
  };

  const handleSpawnDecorCluster = () => {
    setGameState((prev) => {
      const px = prev.playerX;
      const py = prev.playerY;
      const existingProps = prev.dungeonProps || [];

      const decorTemplates = [
        {
          name: 'Ancient Sarcophagus',
          char: '⚰️',
          color: '#94a3b8',
          description: 'Carved marble sarcophagus from ancient lords.',
          interaction: 'sarcophagus'
        },
        {
          name: 'Rusted Weapon Rack',
          char: '🗡️',
          color: '#cbd5e1',
          description: 'Racks holding antique blades and rusted spears.',
          interaction: 'weapon_rack'
        },
        {
          name: 'Lore Bookshelf',
          char: '📚',
          color: '#f59e0b',
          description: 'Shelves crammed with leather-bound arcane volumes.',
          interaction: 'bookshelf'
        },
        {
          name: 'Alchemist Worktable',
          char: '🧪',
          color: '#10b981',
          description: 'Bubbling glass retorts and herbal powders.',
          interaction: 'alchemy_table'
        },
        {
          name: 'Warm Feather Bed',
          char: '🛏️',
          color: '#f43f5e',
          description: 'A comfortable feather bed for deep restoration.',
          interaction: 'bed'
        },
        {
          name: 'Roaring Hearth',
          char: '🔥',
          color: '#f97316',
          description: 'A crackling brick fireplace dispelling cold.',
          interaction: 'fireplace'
        },
        {
          name: 'Town Spring Well',
          char: '🚰',
          color: '#06b6d4',
          description: 'Cool mountain spring water bucket.',
          interaction: 'well'
        },
        {
          name: 'Town Notice Board',
          char: '📜',
          color: '#fbbf24',
          description: 'Pinned notices of local bounties and trade routes.',
          interaction: 'notice_board'
        },
        {
          name: 'Cinder Cask',
          char: '🛢️',
          color: '#a16207',
          description: 'Oak barrel tapped with aged spiced mead.',
          interaction: 'cask'
        },
        {
          name: 'Celestial Sundial',
          char: '☀️',
          color: '#eab308',
          description: 'Polished brass dial aligned with solar rays.',
          interaction: 'sun_dial'
        }
      ];

      const newProps = [...existingProps];
      let placedCount = 0;

      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const tx = px + dx;
          const ty = py + dy;

          if (tx >= 0 && tx < (prev.levelWidth || 64) && ty >= 0 && ty < (prev.levelHeight || 40)) {
            const tile = prev.map[ty]?.[tx];
            const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
            const hasProp = newProps.some((p) => p.x === tx && p.y === ty);

            if (isWalkable && !hasProp && placedCount < decorTemplates.length) {
              const template = decorTemplates[placedCount];
              newProps.push({
                id: `gm_decor_${Date.now()}_${placedCount}`,
                x: tx,
                y: ty,
                name: template.name,
                char: template.char,
                color: template.color,
                description: template.description,
                type: template.interaction as any,
                actionLabel: 'INTERACT',
                isInteracted: false
              });
              placedCount++;
            }
          }
        }
      }

      return {
        ...prev,
        dungeonProps: newProps
      };
    });
    playSound('magic_cast');
    triggerSuccessLog('✨ MANIFEST: Placed a cluster of interactive decor objects!');
  };

  const handleResetLevelDecor = () => {
    setGameState((prev) => {
      const nextProps = (prev.dungeonProps || []).map((p) => ({
        ...p,
        isInteracted: false,
        description: p.description.split(' (EXHAUSTED)')[0]
      }));
      return {
        ...prev,
        dungeonProps: nextProps
      };
    });
    playSound('loot');
    triggerSuccessLog('🔄 RESET: All level decor objects refreshed!');
  };

  const handleFastForwardTime = () => {
    setGameState((prev) => {
      const newTime = (prev.gameTime + 360) % 1440;
      return {
        ...prev,
        gameTime: newTime
      };
    });
    playSound('magic_cast');
    triggerSuccessLog('⏰ TIME SHIFT: Advanced world time by +6 Hours!');
  };

  const handlePurgeExhaustion = () => {
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        exhaustion: 0,
        statuses: (prev.playerStats.statuses || []).filter(
          (s) =>
            !s.toLowerCase().includes('poison') &&
            !s.toLowerCase().includes('curse') &&
            !s.toLowerCase().includes('fatigue')
        )
      }
    }));
    playSound('heal');
    triggerSuccessLog('💖 PURGED: Exhaustion reset to 0% and debuffs cleansed!');
  };

  const handleMaxUpgradeEquipped = () => {
    playSound('mutate');
    setGameState((prev) => {
      let nextWeapon = prev.currentWeapon;
      if (nextWeapon) {
        nextWeapon = {
          ...nextWeapon,
          name: `${nextWeapon.name.replace(/\s\+\d+$/, '')} +5`,
          damage: nextWeapon.damage + 12,
          critChance: Math.min(0.95, nextWeapon.critChance + 0.1),
          upgradeLevel: 5,
          color: '#f43f5e',
          effectDescription: `${nextWeapon.effectDescription || 'Custom Gear.'}\n[UPGRADE +5] Passive: Primal Fireburst - Erupts with dragon fire. Crits ignite targets for 3 turns.`
        };
      }

      const nextEquip = prev.equipmentInventory.map((item) => {
        const nextLevel = 5;
        const cleanBaseName = item.name.replace(/\s\+\d+$/, '');
        if (item.type === 'weapon') {
          return {
            ...item,
            name: `${cleanBaseName} +5`,
            damage: item.damage + 12,
            critChance: Math.min(0.95, item.critChance + 0.1),
            upgradeLevel: nextLevel,
            color: '#f43f5e',
            description: `${item.description || 'Custom Weapon.'} [UPGRADE +5] Passive: Primal Fireburst - Erupts with dragon fire.`
          };
        } else {
          return {
            ...item,
            name: `${cleanBaseName} +5`,
            defense: item.defense + 5,
            upgradeLevel: nextLevel,
            color: '#f43f5e',
            description: `${item.description || 'Custom Armor.'} [UPGRADE +5] Passive: Primal Fireburst - Erupts with dragon fire.`
          };
        }
      });

      const logMsg: GameLogMessage = {
        id: `upgrade_max_${Date.now()}`,
        text: `👑 SOVEREIGN CHEAT: Max-Upgraded all equipped items to +5 with Dragonscale Ruby enchantments! (+12 Damage, +5 Defense)`,
        type: 'craft',
        timestamp: 'FORGE'
      };

      return {
        ...prev,
        currentWeapon: nextWeapon,
        equipmentInventory: nextEquip,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });
    triggerSuccessLog('Max-Upgraded equipped items to +5 with Dragonscale!');
  };

  const handleGrantMaterials = () => {
    playSound('loot');
    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      Object.keys(MATERIAL_LABELS).forEach((mat) => {
        nextMats[mat] = (nextMats[mat] || 0) + 15;
      });
      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [
          ...prev.logs,
          {
            id: `god_mats_${Date.now()}`,
            text: `💎 SOVEREIGN VAULT: Granted +15x of all rare crafting minerals and materials!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      };
    });
    triggerSuccessLog('Granted +15x All Crafting Materials!');
  };

  const handleGrantLevelBounty = () => {
    playSound('spell');
    setGameState((prev) => {
      const nextLevel = prev.playerStats.level + 1;
      const nextXp = 0;
      const nextXpToLevel = Math.floor(prev.playerStats.xpToNextLevel * 1.5);
      const nextMaxHp = prev.playerStats.maxHp + 10;
      const nextMaxMp = prev.playerStats.maxMp + 5;
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          level: nextLevel,
          xp: nextXp,
          xpToNextLevel: nextXpToLevel,
          hp: nextMaxHp,
          maxHp: nextMaxHp,
          mp: nextMaxMp,
          maxMp: nextMaxMp,
          statPoints: (prev.playerStats.statPoints || 0) + 3
        },
        logs: [
          ...prev.logs,
          {
            id: `god_level_${Date.now()}`,
            text: `⭐ SOVEREIGN BOUNTY: Advanced to Level ${nextLevel}! (+10 Max HP, +5 Max MP, +3 Stat Points)`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      };
    });
    triggerSuccessLog('Level Advanced +1 with Stat Points!');
  };

  const handlePlaceStructure = (presetId: string, customX: number, customY: number, offsetX = 0, offsetY = 0, label = 'Custom Position') => {
    const finalX = Math.max(0, Math.min(gameState.levelWidth - 1, customX + offsetX));
    const finalY = Math.max(0, Math.min(gameState.levelHeight - 1, customY + offsetY));
    const result = carveStructure(gameState, presetId, finalX, finalY);
    if (result.success) {
      const activeStructures = getAvailableStructures();
      const matchedName = activeStructures.find((p) => p.id === presetId)?.name || 'Custom Structure';
      setGameState((prev) => ({
        ...prev,
        map: result.updatedMap,
        enemies: result.newEnemies,
        logs: [
          ...prev.logs,
          {
            id: `build_structure_${Date.now()}`,
            text: `🔨 CONSTRUCTOR: Seamlessly carved structural "${matchedName}" directly onto coordinates (${finalX}, ${finalY}) [${label}]!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      }));
      setJsonError(null);
      triggerSuccessLog(`Carved "${matchedName}" successfully at ${label}!`);
    } else {
      setJsonError(result.error || `Carving structure failed coordinate bounds checks.`);
      setTimeout(() => setJsonError(null), 6000);
    }
  };

  const TeleportToChunk = (cx: number, cy: number, reason: string) => {
    setGameState((prev) => {
      const nextLogs: GameLogMessage[] = [
        ...prev.logs,
        {
          id: `teleport_${Date.now()}`,
          text: `🔮 TELEPORT: Warped to ${reason} at chunk (${cx}, ${cy}) crossroads!`,
          type: 'system',
          timestamp: 'GOD'
        }
      ];

      const newChunk = generateOverworldChunk(cx, cy, 64, 40);
      const targetPos = findStairsOrWalkablePosition(newChunk.map, TileType.Grass, 'Overworld Chunk');

      return {
        ...prev,
        currentChunkX: cx,
        currentChunkY: cy,
        isOverworld: true,
        currentDungeonDepth: 0,
        map: newChunk.map,
        enemies: newChunk.enemies || [],
        npcs: newChunk.npcs || [],
        dungeonProps: newChunk.dungeons?.length ? [] : [],
        playerX: targetPos.x,
        playerY: targetPos.y,
        logs: nextLogs.slice(0, 200)
      };
    });
    playSound('magic_cast');
    triggerSuccessLog(`Warped to Chunk (${cx}, ${cy}) - ${reason}!`);
    onClose();
  };

  const TeleportToEmptyArena = () => {
    setGameState((prev) => {
      const arenaW = 40;
      const arenaH = 25;
      const arenaMap = Array(arenaH)
        .fill(null)
        .map((_, y) => {
          return Array(arenaW)
            .fill(null)
            .map((_, x) => {
              if (x === 0 || x === arenaW - 1 || y === 0 || y === arenaH - 1) {
                return TileType.Wall;
              }
              return TileType.Floor;
            });
        });

      return {
        ...prev,
        map: arenaMap,
        levelWidth: arenaW,
        levelHeight: arenaH,
        playerX: Math.floor(arenaW / 2),
        playerY: Math.floor(arenaH / 2),
        enemies: [],
        dungeonProps: [],
        logs: [
          ...prev.logs,
          {
            id: `teleport_arena_${Date.now()}`,
            text: `🏟️ WARP: Entered the Isolated Combat Simulation Arena!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      };
    });
    playSound('magic_cast');
    triggerSuccessLog('Warped into Isolated Combat Arena!');
    onClose();
  };

  const TeleportToDungeon = (targetDepth: number = 1) => {
    const dungeonLevel = generateLevel(50, 30, targetDepth, 0, 0);
    const startPos = findStairsOrWalkablePosition(dungeonLevel.map, TileType.StairsUp, 'Dungeon Level');
    const dungeonProps = generateDungeonProps(dungeonLevel.map, targetDepth);

    setGameState((prev) => ({
      ...prev,
      isOverworld: false,
      currentDungeonDepth: targetDepth,
      map: dungeonLevel.map,
      levelWidth: 50,
      levelHeight: 30,
      playerX: startPos.x,
      playerY: startPos.y,
      enemies: dungeonLevel.enemies,
      dungeonProps: dungeonProps,
      logs: [
        ...prev.logs,
        {
          id: `teleport_dungeon_${Date.now()}`,
          text: `🌀 WARP: Descended into Dungeon Depths Floor #${targetDepth}!`,
          type: 'system',
          timestamp: 'GOD'
        }
      ]
    }));
    playSound('stairs_down');
    triggerSuccessLog(`Teleported to Dungeon Depth ${targetDepth}!`);
    onClose();
  };

  const TeleportToDungeonEntranceOverworld = () => {
    setGameState((prev) => {
      let entranceX = -1;
      let entranceY = -1;

      for (let y = 0; y < prev.map.length; y++) {
        for (let x = 0; x < prev.map[y].length; x++) {
          if (prev.map[y][x] === TileType.DungeonEntrance) {
            entranceX = x;
            entranceY = y;
            break;
          }
        }
        if (entranceX !== -1) break;
      }

      if (entranceX === -1) {
        return prev;
      }

      return {
        ...prev,
        playerX: entranceX,
        playerY: entranceY + 1,
        logs: [
          ...prev.logs,
          {
            id: `teleport_entrance_${Date.now()}`,
            text: `🌀 WARP: Teleported directly in front of the Dungeon Portal!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      };
    });
    playSound('magic_cast');
    triggerSuccessLog('Warped to Dungeon Portal Entrance!');
    onClose();
  };

  const handleSpawnEnemy = (enemyType: EnemyType | string) => {
    const template = getEnemyTemplate(enemyType);
    const newEnemy = {
      id: `enemy_god_${Date.now()}_${Math.random()}`,
      name: template.name,
      type: (template as any).type || (enemyType as EnemyType),
      x: Math.min(gameState.levelWidth - 1, gameState.playerX + 2),
      y: gameState.playerY,
      hp: template.baseHp,
      maxHp: template.baseHp,
      atk: template.baseAtk,
      def: template.baseDef,
      range: template.range || 1,
      speed: template.speed || 1.0,
      char: template.char,
      color: template.color,
      state: 'idle' as any,
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: [],
      expValue: (template as any).expValue || 10
    };

    setGameState((prev) => ({
      ...prev,
      enemies: [...prev.enemies, newEnemy],
      logs: [
        ...prev.logs,
        {
          id: `god_spawn_${Date.now()}`,
          text: `👾 SOVEREIGN INVOCATION: Spawned "${template.name}" adjacent to player!`,
          type: 'system',
          timestamp: 'GOD'
        }
      ]
    }));
    playSound('monster_growl');
    triggerSuccessLog(`Spawned "${template.name}" at (${newEnemy.x}, ${newEnemy.y})!`);
  };

  const handleSetWeatherBiome = (weatherVal: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard' | 'ashfall' | 'tidal_surge') => {
    setGameState((prev) => ({
      ...prev,
      weather: weatherVal,
      logs: [
        ...prev.logs,
        {
          id: `god_weather_${Date.now()}`,
          text: `🌪️ SOVEREIGN WEATHER: Shifted regional climate atmosphere to "${weatherVal.toUpperCase()}"!`,
          type: 'system',
          timestamp: 'GOD'
        }
      ]
    }));
    playSound('weather_shift');
    triggerSuccessLog(`Shifted weather to "${weatherVal}"!`);
  };

  return {
    handleHealPlayer,
    handleGoldBounty,
    handleWipeEnemies,
    handleRevealFullMap,
    handleRevealWholeWorldMap,
    handleExportWorldMapPng,
    handleToggleInvinciblePlayer,
    handleSpawnDecorCluster,
    handleResetLevelDecor,
    handleFastForwardTime,
    handlePurgeExhaustion,
    handleMaxUpgradeEquipped,
    handleGrantMaterials,
    handleGrantLevelBounty,
    handlePlaceStructure,
    TeleportToChunk,
    TeleportToEmptyArena,
    TeleportToDungeon,
    TeleportToDungeonEntranceOverworld,
    handleSpawnEnemy,
    handleSetWeatherBiome
  };
}
