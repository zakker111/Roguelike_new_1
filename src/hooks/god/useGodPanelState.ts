import React, { useState, useEffect } from 'react';
import { GameState, EnemyType, TileType, GameLogMessage } from '../../types';
import { playSound } from '../../utils/audio';
import { getEnemyTemplate, generateLevel, generateDungeonProps } from '../../utils/dungeon';
import { carveStructure, getAvailableStructures } from '../../utils/structurePlacer';
import { generateOverworldChunk, getCurrentWorldSeed, setWorldSeed } from '../../utils/overworld';
import { computeFOV } from '../../utils/ai';
import townTemplates from '../../data/townTemplates.json';
import { findStairsOrWalkablePosition } from '../../utils/gameUtils';

export const DESIGNER_LEGEND: Record<string, string> = {
  '#': 'Wall',
  '.': 'Floor',
  'D': 'Door',
  'B': 'Bed',
  'C': 'Chair',
  'T': 'Table',
  'f': 'Campfire',
  'F': 'Fireplace',
  'S': 'Sign',
  'G': 'Grass',
  'W': 'Water',
  'E': 'Entrance',
  't': 'Tree',
  'P': 'PineTree',
  'Y': 'BirchTree',
  'p': 'Path',
  'w': 'Window',
  'b': 'Bush',
  'o': 'Torch',
  'A': 'Anvil',
  'K': 'Bookshelf',
  'H': 'Counter',
  'M': 'Stool',
  'u': 'DrunkNpc',
  'N': 'Townsfolk',
  'g': 'Guard'
};

const MATERIAL_LABELS: Record<string, string> = {
  copper_ore: 'Copper Ore',
  iron_ore: 'Iron Ore',
  shadow_essence: 'Shadow Essence',
  beast_pelt: 'Beast Pelt',
  dragon_scale: 'Dragon Scale',
  void_shard: 'Void Shard',
  sun_stone: 'Sun Stone',
  mithril_ingot: 'Mithril Ingot'
};

const CATALYST_LABELS: Record<string, string> = {
  ember_core: 'Ember Core 🔥',
  glacial_shard: 'Glacial Shard ❄️',
  storm_conduit: 'Storm Conduit ⚡',
  poison_gland: 'Venom Sac 🧪',
  void_tear: 'Void Core 🌌',
  blood_stone: 'Blood Stone 🩸'
};

export interface UseGodPanelStateProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  onRegenerateCurrentLocation?: () => void;
  onTriggerLockpicking?: () => void;
  isAutoplayActive?: boolean;
  setIsAutoplayActive?: (active: boolean) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export function useGodPanelState({
  gameState,
  setGameState,
  onClose,
  onRegenerateCurrentLocation,
  onTriggerLockpicking,
  isAutoplayActive = false,
  setIsAutoplayActive,
  addLogMessage
}: UseGodPanelStateProps) {
  const [activeTab, setActiveTab] = useState<
    | 'sovereign'
    | 'arena'
    | 'structures'
    | 'struct_json'
    | 'enemies'
    | 'town'
    | 'creator'
    | 'admin_editor'
    | 'smoketest'
    | 'replay'
    | 'bestiary_test'
    | 'house_editor'
    | 'npc_planner'
    | 'dungeon_editor'
    | 'modding_api'
  >('sovereign');

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  const triggerSuccessLog = (msg: string) => {
    setJsonSuccess(msg);
    setTimeout(() => setJsonSuccess(null), 3000);
  };

  // Visual House & Structure Designer state
  const [designerWidth, setDesignerWidth] = useState<number>(6);
  const [designerHeight, setDesignerHeight] = useState<number>(6);
  const [designerId, setDesignerId] = useState<string>('custom_house_1');
  const [designerName, setDesignerName] = useState<string>('Cozy House');
  const [designerDescription, setDesignerDescription] = useState<string>(
    'A custom crafted house featuring clean wooden floorboards and brick wall bounds.'
  );
  const [designerEmoji, setDesignerEmoji] = useState<string>('🏠');
  const [designerPaintChar, setDesignerPaintChar] = useState<string>('#');
  const [designerGrid, setDesignerGrid] = useState<string[][]>(() => {
    return Array(6)
      .fill(null)
      .map(() => Array(6).fill('.'));
  });

  // NPC Route Planner & Day-Cycle Simulator states
  const [selectedSimNpcId, setSelectedSimNpcId] = useState<string | null>(null);
  const [simHour, setSimHour] = useState<number>(12);
  const [simWeather, setSimWeather] = useState<'clear' | 'rainy' | 'snowy'>('clear');

  useEffect(() => {
    if (gameState) {
      setSimHour(Math.floor(gameState.gameTime / 60));
      const w =
        gameState.weather === 'rainy' || gameState.weather === 'snowy' ? gameState.weather : 'clear';
      setSimWeather(w as any);
    }
  }, [gameState?.gameTime, gameState?.weather]);

  const adjustDesignerGridDimensions = (newW: number, newH: number) => {
    setDesignerWidth(newW);
    setDesignerHeight(newH);
    setDesignerGrid((prev) => {
      return Array(newH)
        .fill(null)
        .map((_, y) => {
          return Array(newW)
            .fill(null)
            .map((_, x) => {
              if (prev[y] && prev[y][x] !== undefined) {
                return prev[y][x];
              }
              return '.';
            });
        });
    });
  };

  // Interactive Arena Sandbox state variables
  const [playerAtkMult, setPlayerAtkMult] = useState(() => (window as any).arenaPlayerDamageMultiplier || 1.0);
  const [enemyHpMult, setEnemyHpMult] = useState(() => (window as any).arenaEnemyHpMultiplier || 1.0);
  const [enemyAtkMultState, setEnemyAtkMultState] = useState(
    () => (window as any).arenaEnemyDamageMultiplier || 1.0
  );
  const [goldMult, setGoldMult] = useState(() => (window as any).arenaGoldMultiplier || 1.0);
  const [xpMult, setXpMult] = useState(() => (window as any).arenaXpMultiplier || 1.0);
  const [godModeActive, setGodModeActive] = useState(() => (window as any).arenaGodModeActive || false);
  const [deathAuraActive, setDeathAuraActive] = useState(() => (window as any).arenaDeathAuraActive || false);
  const [bypassWeightLimit, setBypassWeightLimit] = useState(() => (window as any).bypassWeightLimit || false);
  const [customBaseMaxWeight, setCustomBaseMaxWeight] = useState(
    () => ((window as any).customBaseMaxWeight !== undefined ? (window as any).customBaseMaxWeight : 80.0)
  );

  // Dynamic Structure placements
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tiny_shelter');
  const [customX, setCustomX] = useState<number>(gameState?.playerX || 0);
  const [customY, setCustomY] = useState<number>(gameState?.playerY || 0);

  // JSON editors state
  const [enemiesJsonText, setEnemiesJsonText] = useState(() => {
    const list = (window as any).customEnemies || [];
    return JSON.stringify(list, null, 2);
  });

  const [customEnemiesState, setCustomEnemiesState] = useState<any[]>(() => {
    return (window as any).customEnemies || [];
  });

  // Visual Form state for Enemy Blueprint Editor
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState<number | null>(0);
  const [formType, setFormType] = useState<string>('Rat');
  const [formName, setFormName] = useState<string>('Giant Plague Rat');
  const [formBaseHp, setFormBaseHp] = useState<number>(8);
  const [formBaseAtk, setFormBaseAtk] = useState<number>(2);
  const [formBaseDef, setFormBaseDef] = useState<number>(0);
  const [formRange, setFormRange] = useState<number>(1);
  const [formSpeed, setFormSpeed] = useState<number>(1.0);
  const [formChar, setFormChar] = useState<string>('r');
  const [formColor, setFormColor] = useState<string>('#a1a1aa');

  // Load first template on mount if available
  useEffect(() => {
    const first = (window as any).customEnemies?.[0];
    if (first) {
      setSelectedEnemyIndex(0);
      setFormType(first.type || '');
      setFormName(first.name || '');
      setFormBaseHp(first.baseHp !== undefined ? first.baseHp : first.hp || 10);
      setFormBaseAtk(first.baseAtk !== undefined ? first.baseAtk : first.atk || 3);
      setFormBaseDef(first.baseDef !== undefined ? first.baseDef : first.def || 0);
      setFormRange(first.range || 1);
      setFormSpeed(first.speed || 1.0);
      setFormChar(first.char || 'r');
      setFormColor(first.color || '#a1a1aa');
    }
  }, []);

  const selectEnemyTemplate = (index: number) => {
    const enemy = customEnemiesState[index];
    if (enemy) {
      setSelectedEnemyIndex(index);
      setFormType(enemy.type || '');
      setFormName(enemy.name || '');
      setFormBaseHp(enemy.baseHp !== undefined ? enemy.baseHp : enemy.hp || 10);
      setFormBaseAtk(enemy.baseAtk !== undefined ? enemy.baseAtk : enemy.atk || 3);
      setFormBaseDef(enemy.baseDef !== undefined ? enemy.baseDef : enemy.def || 0);
      setFormRange(enemy.range || 1);
      setFormSpeed(enemy.speed || 1.0);
      setFormChar(enemy.char || 'E');
      setFormColor(enemy.color || '#ea580c');
    }
  };

  const createNewEnemyTemplate = () => {
    setSelectedEnemyIndex(null);
    setFormType('SkeletonArcher');
    setFormName('Skeletal Archer');
    setFormBaseHp(25);
    setFormBaseAtk(5);
    setFormBaseDef(1);
    setFormRange(3);
    setFormSpeed(1.1);
    setFormChar('🏹');
    setFormColor('#94a3b8');
  };

  const saveEnemyTemplate = () => {
    if (!formType.trim() || !formName.trim()) {
      setJsonError('Type ID and Display Name are required!');
      return;
    }
    const cleanType = formType.replace(/\s+/g, '');
    const newRecord = {
      type: cleanType,
      name: formName,
      baseHp: formBaseHp,
      baseAtk: formBaseAtk,
      baseDef: formBaseDef,
      range: formRange,
      speed: formSpeed,
      char: formChar,
      color: formColor
    };

    let updatedList = [...customEnemiesState];
    if (selectedEnemyIndex !== null && selectedEnemyIndex >= 0 && selectedEnemyIndex < updatedList.length) {
      updatedList[selectedEnemyIndex] = newRecord;
      triggerSuccessLog(`Successfully updated blueprint "${formName}"!`);
    } else {
      const isDuplicate = updatedList.some((e) => e.type.toLowerCase() === cleanType.toLowerCase());
      if (isDuplicate) {
        setJsonError(`A blueprint with Type ID "${cleanType}" already exists! Select it to edit or use a unique ID.`);
        setTimeout(() => setJsonError(null), 4000);
        return;
      }
      updatedList.push(newRecord);
      setSelectedEnemyIndex(updatedList.length - 1);
      triggerSuccessLog(`Successfully added brand new blueprint "${formName}"!`);
    }

    (window as any).customEnemies = updatedList;
    setCustomEnemiesState(updatedList);
    setEnemiesJsonText(JSON.stringify(updatedList, null, 2));
    setJsonError(null);
  };

  const deleteEnemyTemplate = (index: number, ev: React.MouseEvent) => {
    ev.stopPropagation();
    const updatedList = customEnemiesState.filter((_, i) => i !== index);
    (window as any).customEnemies = updatedList;
    setCustomEnemiesState(updatedList);
    setEnemiesJsonText(JSON.stringify(updatedList, null, 2));
    setSelectedEnemyIndex(null);
    triggerSuccessLog('Blueprint removed successfully!');
  };

  const [housesJsonText, setHousesJsonText] = useState(() => {
    const list = (window as any).customHouses || [];
    return JSON.stringify(list, null, 2);
  });

  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState(0);

  const handleSelectTownLayout = (layoutIdx: number) => {
    setSelectedLayoutIndex(layoutIdx);
    const layout = townTemplates.townLayouts[layoutIdx];
    if (layout) {
      const width = 50;
      const height = 30;
      const coordinates = layout.buildings.map((b: any) => {
        let computedX = 0;
        let computedY = 0;

        if (typeof b.x === 'string') {
          const str = b.x.trim();
          if (str.startsWith('w/')) {
            const denom = parseInt(str.split('/')[1] || '2', 10);
            computedX = Math.floor(width / denom);
          } else {
            computedX = parseInt(str, 10);
          }
        } else {
          computedX = b.x;
        }

        if (typeof b.y === 'string') {
          const str = b.y.trim();
          if (str.startsWith('h/')) {
            const denom = parseInt(str.split('/')[1] || '2', 10);
            computedY = Math.floor(height / denom);
          } else {
            computedY = parseInt(str, 10);
          }
        } else {
          computedY = b.y;
        }

        return {
          id: b.id,
          name: b.name,
          x: computedX,
          y: computedY,
          w: b.w,
          h: b.h
        };
      });

      setHousesJsonText(JSON.stringify(coordinates, null, 2));
      triggerSuccessLog(`Loaded layout template: "${layout.name}" (${layout.buildings.length} structures)`);
    }
  };

  const [smokeTestLogs, setSmokeTestLogs] = useState<string[]>([]);
  const [isSmokeTesting, setIsSmokeTesting] = useState(false);
  const [currentTestStep, setCurrentTestStep] = useState<number | null>(null);

  // Replay Simulator State
  const [pastedLogs, setPastedLogs] = useState('');
  const [replayPayload, setReplayPayload] = useState<any | null>(null);
  const [currentReplayIdx, setCurrentReplayIdx] = useState<number>(0);
  const [replayIsPlaying, setReplayIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(300);
  const [replayError, setReplayError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (replayIsPlaying && replayPayload && replayPayload.snapshots) {
      timer = setInterval(() => {
        setCurrentReplayIdx((prevIdx) => {
          const nextIdx = prevIdx + 1;
          if (nextIdx >= replayPayload.snapshots.length) {
            setReplayIsPlaying(false);
            return prevIdx;
          }
          return nextIdx;
        });
      }, replaySpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [replayIsPlaying, replayPayload, replaySpeed]);

  useEffect(() => {
    if (replayPayload && replayPayload.snapshots && replayPayload.snapshots[currentReplayIdx]) {
      const snapshot = replayPayload.snapshots[currentReplayIdx];
      if (snapshot && snapshot.state) {
        const targetSeed = replayPayload.seed;
        if (targetSeed && getCurrentWorldSeed() !== targetSeed) {
          setWorldSeed(targetSeed);
        }

        setGameState((prev) => {
          const mapToUse = snapshot.state.map || prev.map;
          const px = snapshot.state.playerX ?? prev.playerX;
          const py = snapshot.state.playerY ?? prev.playerY;

          let restoredVisible = snapshot.state.visible;
          if (!restoredVisible && mapToUse && mapToUse.length > 0) {
            restoredVisible = computeFOV(px, py, mapToUse, 6);
          }

          let restoredDiscovered = snapshot.state.discovered;
          if (!restoredDiscovered && restoredVisible && mapToUse && mapToUse.length > 0) {
            restoredDiscovered = mapToUse.map((row: any[], y: number) =>
              row.map((_, x) => (restoredVisible && restoredVisible[y] ? restoredVisible[y][x] : false))
            );
          }

          return {
            ...prev,
            ...snapshot.state,
            ...(restoredVisible ? { visible: restoredVisible } : {}),
            ...(restoredDiscovered ? { discovered: restoredDiscovered } : {})
          };
        });
      }
    }
  }, [currentReplayIdx, replayPayload, setGameState]);

  const runAutomatedSmokeTest = async () => {
    if (isSmokeTesting) return;
    setIsSmokeTesting(true);
    setCurrentTestStep(0);
    setSmokeTestLogs([]);

    const log = (msg: string) => {
      setSmokeTestLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      if (addLogMessage) {
        addLogMessage(msg, 'system');
      } else {
        setGameState((prev) => ({
          ...prev,
          logs: [
            {
              id: `sim_log_${Date.now()}_${Math.random()}`,
              text: msg,
              type: 'system',
              timestamp: 'SIM'
            },
            ...(prev.logs || [])
          ].slice(0, 200)
        }));
      }
    };

    try {
      log('🚀 Starting Automated Full-Game Engine Smoke Test...');
      await new Promise((r) => setTimeout(r, 400));

      setCurrentTestStep(1);
      log('🔍 [1/6] Verifying Overworld Terrain Chunks & Biome Generator...');
      const chunk = generateOverworldChunk(0, 0, 64, 40);
      if (!chunk || !chunk.map || chunk.map.length === 0) {
        throw new Error('Overworld chunk generation returned empty map structure!');
      }
      log(`✅ Overworld chunk (0, 0) generated successfully (${chunk.biome}).`);
      await new Promise((r) => setTimeout(r, 400));

      setCurrentTestStep(2);
      log('🔍 [2/6] Verifying Dungeon Depth Generator & Props...');
      const dungeon = generateLevel(40, 25, 1, 0, 0);
      if (!dungeon || !dungeon.map || dungeon.map.length === 0) {
        throw new Error('Dungeon generation failed at depth 1!');
      }
      log(`✅ Dungeon Depth 1 generated with ${dungeon.enemies.length} enemies and valid walkable tiles.`);
      await new Promise((r) => setTimeout(r, 400));

      setCurrentTestStep(3);
      log('🔍 [3/6] Verifying Enemy Blueprints and Stat Matrices...');
      const rat = getEnemyTemplate('Rat');
      const skeleton = getEnemyTemplate('Skeleton');
      if (!rat || !skeleton) {
        throw new Error('Master enemy catalog is missing basic hostile templates!');
      }
      log(`✅ Verified Rat (HP: ${rat.baseHp}) and Skeleton (HP: ${skeleton.baseHp}) blueprints.`);
      await new Promise((r) => setTimeout(r, 400));

      setCurrentTestStep(4);
      log('🔍 [4/6] Testing Player Recovery & Vitality Engine...');
      setGameState((prev) => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          hp: prev.playerStats.maxHp,
          mp: prev.playerStats.maxMp,
          exhaustion: 0
        }
      }));
      log('✅ Player HP, MP, and Exhaustion restored to 100% full capacity.');
      await new Promise((r) => setTimeout(r, 400));

      setCurrentTestStep(5);
      log('🔍 [5/6] Verifying Structure Presets and Architectural Placement...');
      const structures = getAvailableStructures();
      log(`✅ Successfully loaded ${structures.length} structural presets.`);
      await new Promise((r) => setTimeout(r, 400));

      setCurrentTestStep(6);
      log('🎉 [6/6] All Core Game Systems PASSED Smoke Testing with 0 errors!');
      triggerSuccessLog('Full Game Smoke Test passed successfully!');
    } catch (err: any) {
      log(`❌ Smoke Test Error: ${err.message || err}`);
    } finally {
      setIsSmokeTesting(false);
      setCurrentTestStep(null);
    }
  };

  const [structuresJsonText, setStructuresJsonText] = useState(() => {
    const list = (window as any).customStructures || [
      {
        id: 'combat_arena_custom',
        name: 'Custom Training Grounds',
        description: 'A custom blueprint containing training dummies and high walls generated on-the-fly.',
        emoji: '🏟️',
        width: 6,
        height: 6,
        grid: ['######', '#....#', '#.cc.#', '#.ff.#', '#....#', '##D###'],
        legend: {
          '#': 'Wall',
          '.': 'Floor',
          D: 'Door',
          c: 'Chair',
          f: 'Campfire'
        },
        enemies: [
          { rx: 2, ry: 1, type: 'Rat', name: 'Training Target r' },
          { rx: 3, ry: 4, type: 'Mage', name: 'Spelldummy S', isElite: true }
        ]
      }
    ];
    if (!(window as any).customStructures) {
      (window as any).customStructures = list;
    }
    return JSON.stringify(list, null, 2);
  });

  const updateArenaValue = (key: string, value: any, setter: (val: any) => void) => {
    (window as any)[key] = value;
    setter(value);
    triggerSuccessLog(`Updated: ${key.replace('arena', '')} configured to ${value}`);
  };

  const handleResetArenaSettings = () => {
    (window as any).arenaPlayerDamageMultiplier = 1.0;
    (window as any).arenaEnemyHpMultiplier = 1.0;
    (window as any).arenaEnemyDamageMultiplier = 1.0;
    (window as any).arenaGoldMultiplier = 1.0;
    (window as any).arenaXpMultiplier = 1.0;
    (window as any).arenaGodModeActive = false;
    (window as any).arenaDeathAuraActive = false;
    (window as any).bypassWeightLimit = false;
    (window as any).customBaseMaxWeight = 80.0;

    setPlayerAtkMult(1.0);
    setEnemyHpMult(1.0);
    setEnemyAtkMultState(1.0);
    setGoldMult(1.0);
    setXpMult(1.0);
    setGodModeActive(false);
    setDeathAuraActive(false);
    setBypassWeightLimit(false);
    setCustomBaseMaxWeight(80.0);
    triggerSuccessLog('Successfully restored all Arena multipliers to balanced 1.0x variables!');
  };

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

  const handlePlaceStructure = (offsetX = 0, offsetY = 0, label = 'Custom Position') => {
    const finalX = Math.max(0, Math.min(gameState.levelWidth - 1, customX + offsetX));
    const finalY = Math.max(0, Math.min(gameState.levelHeight - 1, customY + offsetY));
    const result = carveStructure(gameState, selectedPresetId, finalX, finalY);
    if (result.success) {
      const activeStructures = getAvailableStructures();
      const matchedName = activeStructures.find((p) => p.id === selectedPresetId)?.name || 'Custom Structure';
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

  const paintCell = (x: number, y: number) => {
    setDesignerGrid((prev) => {
      return prev.map((r, ri) => {
        return r.map((c, ci) => {
          if (ri === y && ci === x) {
            return designerPaintChar;
          }
          return c;
        });
      });
    });
  };

  const handleSaveCustomDesignerStructure = () => {
    if (!designerId.trim() || !designerName.trim()) {
      setJsonError('Structure ID and Display Name are required!');
      return;
    }
    const rows = designerGrid.map((row) => row.join(''));
    const newStructurePreset = {
      id: designerId.trim(),
      name: designerName.trim(),
      description: designerDescription.trim(),
      emoji: designerEmoji.trim(),
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: { ...DESIGNER_LEGEND }
    };

    let updatedList = [...((window as any).customStructures || [])];
    const existingIndex = updatedList.findIndex((p: any) => p.id === designerId);

    if (existingIndex >= 0) {
      updatedList[existingIndex] = newStructurePreset;
      triggerSuccessLog(`Successfully updated custom structure "${designerName}"!`);
    } else {
      updatedList.push(newStructurePreset);
      triggerSuccessLog(`Successfully compiled "${designerName}" to memory!`);
    }

    (window as any).customStructures = updatedList;
    setStructuresJsonText(JSON.stringify(updatedList, null, 2));
    setSelectedPresetId(designerId);
    setJsonError(null);
  };

  const handlePlaceDesignerStructure = () => {
    if (!designerId.trim() || !designerName.trim()) {
      setJsonError('Structure ID and Display Name are required before carving!');
      return;
    }
    const rows = designerGrid.map((row) => row.join(''));
    const newStructurePreset = {
      id: designerId.trim(),
      name: designerName.trim(),
      description: designerDescription.trim(),
      emoji: designerEmoji.trim(),
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: { ...DESIGNER_LEGEND }
    };

    let updatedList = [...((window as any).customStructures || [])];
    const existingIndex = updatedList.findIndex((p: any) => p.id === designerId);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = newStructurePreset;
    } else {
      updatedList.push(newStructurePreset);
    }
    (window as any).customStructures = updatedList;
    setStructuresJsonText(JSON.stringify(updatedList, null, 2));
    setSelectedPresetId(designerId);

    const finalX = Math.max(0, Math.min(gameState.levelWidth - 1, customX));
    const finalY = Math.max(0, Math.min(gameState.levelHeight - 1, customY));
    const result = carveStructure(gameState, designerId, finalX, finalY);
    if (result.success) {
      setGameState((prev) => ({
        ...prev,
        map: result.updatedMap,
        enemies: result.newEnemies,
        logs: [
          ...prev.logs,
          {
            id: `build_designer_structure_${Date.now()}`,
            text: `🔨 ARCHITECT: Visually painted & carved custom "${designerName}" directly onto coordinates (${finalX}, ${finalY})!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      }));
      setJsonError(null);
      triggerSuccessLog(`Carved "${designerName}" successfully at (${finalX}, ${finalY})!`);
    } else {
      setJsonError(result.error || `Carving structure failed coordinate bounds checks.`);
      setTimeout(() => setJsonError(null), 6000);
    }
  };

  const handleLoadPresetToDesigner = (preset: any) => {
    setDesignerId(preset.id);
    setDesignerName(preset.name);
    setDesignerDescription(preset.description || '');
    setDesignerEmoji(preset.emoji || '🏠');
    setDesignerWidth(preset.width);
    setDesignerHeight(preset.height);

    const parsedGrid: string[][] = Array(preset.height)
      .fill(null)
      .map((_, y) => {
        const rowStr = preset.grid[y] || '';
        return Array(preset.width)
          .fill(null)
          .map((_, x) => {
            const rawChar = rowStr[x];
            if (!rawChar) return '.';
            if (preset.legend) {
              const tileTypeName = preset.legend[rawChar];
              if (tileTypeName) {
                const standardChar = Object.keys(DESIGNER_LEGEND).find(
                  (key) => DESIGNER_LEGEND[key] === tileTypeName
                );
                if (standardChar) return standardChar;
              }
            }
            return rawChar;
          });
      });
    setDesignerGrid(parsedGrid);
    triggerSuccessLog(`Loaded template "${preset.name}" into visual painter!`);
  };

  const clearDesignerGrid = () => {
    setDesignerGrid(
      Array(designerHeight)
        .fill(null)
        .map(() => Array(designerWidth).fill('.'))
    );
    triggerSuccessLog('Reset designer grid to empty floor tiles!');
  };

  const surroundDesignerWithWalls = () => {
    setDesignerGrid((prev) => {
      return prev.map((row, y) => {
        return row.map((char, x) => {
          if (y === 0 || y === designerHeight - 1 || x === 0 || x === designerWidth - 1) {
            return '#';
          }
          return char;
        });
      });
    });
    triggerSuccessLog('Built wall shell surrounding the structure!');
  };

  const handleCopyBlueprintJson = () => {
    const rows = designerGrid.map((row) => row.join(''));
    const legendFiltered: Record<string, string> = {};
    rows.forEach((row) => {
      for (const char of row) {
        if (DESIGNER_LEGEND[char]) {
          legendFiltered[char] = DESIGNER_LEGEND[char];
        }
      }
    });
    const blueprint = {
      id: designerId.trim() || 'custom_house',
      name: designerName.trim() || 'Custom House',
      description: designerDescription.trim() || 'A custom painted house.',
      emoji: designerEmoji.trim() || '🏠',
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: legendFiltered
    };
    navigator.clipboard
      .writeText(JSON.stringify(blueprint, null, 2))
      .then(() => triggerSuccessLog(`Copied raw JSON for "${designerName}" to clipboard!`))
      .catch(() => triggerSuccessLog(`Failed to copy to clipboard`));
  };

  const handleCopyAsTsConstant = () => {
    const rows = designerGrid.map((row) => row.join(''));
    const legendFiltered: Record<string, string> = {};
    rows.forEach((row) => {
      for (const char of row) {
        if (DESIGNER_LEGEND[char]) {
          legendFiltered[char] = DESIGNER_LEGEND[char];
        }
      }
    });
    const tsCode = `  {
    id: '${designerId.trim() || 'custom_house'}',
    name: '${designerName.trim() || 'Custom House'}',
    description: '${designerDescription.trim() || 'A custom crafted structure.'}',
    emoji: '${designerEmoji.trim() || '🏠'}',
    width: ${designerWidth},
    height: ${designerHeight},
    grid: [
${rows.map((r) => `      "${r}"`).join(',\n')}
    ],
    legend: {
${Object.entries(legendFiltered)
  .map(([k, v]) => `      "${k}": "${v}"`)
  .join(',\n')}
    }
  }`;
    navigator.clipboard
      .writeText(tsCode)
      .then(() => triggerSuccessLog(`Copied TypeScript Preset Constant for "${designerName}" to clipboard!`))
      .catch(() => triggerSuccessLog(`Failed to copy TS Preset Code`));
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Must be a single JSON structure object.');
        }
        if (!parsed.id) throw new Error("Missing 'id' field in blueprint.");
        if (!parsed.name) throw new Error("Missing 'name' field in blueprint.");
        if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
          throw new Error("Missing or invalid 'width' or 'height' fields (must be numbers).");
        }
        if (!parsed.grid || !Array.isArray(parsed.grid)) {
          throw new Error("Missing or invalid 'grid' field (must be an array of strings).");
        }
        const cleanWidth = Math.max(3, Math.min(12, parsed.width));
        const cleanHeight = Math.max(3, Math.min(12, parsed.height));
        setDesignerId(parsed.id);
        setDesignerName(parsed.name);
        setDesignerDescription(parsed.description || '');
        setDesignerEmoji(parsed.emoji || '🏠');
        setDesignerWidth(cleanWidth);
        setDesignerHeight(cleanHeight);
        const parsedGrid: string[][] = Array(cleanHeight)
          .fill(null)
          .map((_, y) => {
            const rowStr = parsed.grid[y] || '';
            return Array(cleanWidth)
              .fill(null)
              .map((_, x) => rowStr[x] || '.');
          });
        setDesignerGrid(parsedGrid);
        triggerSuccessLog(`Imported "${parsed.name}" blueprint successfully!`);
      } catch (err: any) {
        triggerSuccessLog(`⚠️ Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadBlueprintJson = () => {
    const rows = designerGrid.map((row) => row.join(''));
    const legendFiltered: Record<string, string> = {};
    rows.forEach((row) => {
      for (const char of row) {
        if (DESIGNER_LEGEND[char]) {
          legendFiltered[char] = DESIGNER_LEGEND[char];
        }
      }
    });
    const blueprint = {
      id: designerId.trim() || 'custom_house',
      name: designerName.trim() || 'Custom House',
      description: designerDescription.trim() || 'A custom painted house.',
      emoji: designerEmoji.trim() || '🏠',
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: legendFiltered
    };
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${designerId.trim() || 'custom_house'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerSuccessLog(`Downloaded "${designerName}" blueprint file successfully!`);
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

  const handleApplyEnemiesJson = () => {
    try {
      const parsed = JSON.parse(enemiesJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Custom enemies configuration must be a JSON array of blueprints!');
      }
      (window as any).customEnemies = parsed;
      setCustomEnemiesState(parsed);
      triggerSuccessLog(`Successfully applied ${parsed.length} custom enemy blueprints!`);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleResetEnemies = () => {
    (window as any).customEnemies = [];
    setCustomEnemiesState([]);
    setEnemiesJsonText('[]');
    setSelectedEnemyIndex(null);
    triggerSuccessLog('Reset custom enemies array to default!');
  };

  const handleApplyHousesJson = () => {
    try {
      const parsed = JSON.parse(housesJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Custom houses configuration must be a JSON array!');
      }
      (window as any).customHouses = parsed;
      triggerSuccessLog(`Successfully applied ${parsed.length} custom settlement buildings!`);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleResetHouses = () => {
    (window as any).customHouses = [];
    setHousesJsonText('[]');
    triggerSuccessLog('Reset custom houses to procedural default!');
  };

  const handleApplyStructuresJson = () => {
    try {
      const parsed = JSON.parse(structuresJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Custom structures configuration must be a JSON array!');
      }
      (window as any).customStructures = parsed;
      triggerSuccessLog(`Successfully applied ${parsed.length} custom structure presets!`);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleResetStructures = () => {
    (window as any).customStructures = [];
    setStructuresJsonText('[]');
    triggerSuccessLog('Reset custom structures to factory presets!');
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
    activeTab,
    setActiveTab,
    isMinimized,
    setIsMinimized,
    jsonError,
    setJsonError,
    jsonSuccess,
    triggerSuccessLog,
    // Designer
    designerWidth,
    designerHeight,
    designerId,
    setDesignerId,
    designerName,
    setDesignerName,
    designerDescription,
    setDesignerDescription,
    designerEmoji,
    setDesignerEmoji,
    designerPaintChar,
    setDesignerPaintChar,
    designerGrid,
    customX,
    setCustomX,
    customY,
    setCustomY,
    clearDesignerGrid,
    surroundDesignerWithWalls,
    handleLoadPresetToDesigner,
    adjustDesignerGridDimensions,
    paintCell,
    handleSaveCustomDesignerStructure,
    handlePlaceDesignerStructure,
    handleDownloadBlueprintJson,
    handleCopyBlueprintJson,
    handleCopyAsTsConstant,
    handleImportFile,
    // Arena
    playerAtkMult,
    setPlayerAtkMult,
    enemyHpMult,
    setEnemyHpMult,
    enemyAtkMultState,
    setEnemyAtkMultState,
    goldMult,
    setGoldMult,
    xpMult,
    setXpMult,
    godModeActive,
    setGodModeActive,
    deathAuraActive,
    setDeathAuraActive,
    bypassWeightLimit,
    setBypassWeightLimit,
    customBaseMaxWeight,
    setCustomBaseMaxWeight,
    updateArenaValue,
    handleResetArenaSettings,
    // Cheats
    handleHealPlayer,
    handleGoldBounty,
    handleGrantMaterials,
    handleGrantLevelBounty,
    handleMaxUpgradeEquipped,
    handleWipeEnemies,
    handleRevealFullMap,
    handleRevealWholeWorldMap,
    handleToggleInvinciblePlayer,
    handleSpawnDecorCluster,
    handleResetLevelDecor,
    handleFastForwardTime,
    handlePurgeExhaustion,
    // Structure Placer
    selectedPresetId,
    setSelectedPresetId,
    handlePlaceStructure,
    // Blueprint / Enemies
    customEnemiesState,
    selectedEnemyIndex,
    selectEnemyTemplate,
    createNewEnemyTemplate,
    deleteEnemyTemplate,
    saveEnemyTemplate,
    handleResetEnemies,
    handleApplyEnemiesJson,
    formType,
    setFormType,
    formName,
    setFormName,
    formChar,
    setFormChar,
    formColor,
    setFormColor,
    formBaseHp,
    setFormBaseHp,
    formBaseAtk,
    setFormBaseAtk,
    formBaseDef,
    setFormBaseDef,
    formRange,
    setFormRange,
    formSpeed,
    setFormSpeed,
    enemiesJsonText,
    setEnemiesJsonText,
    handleSpawnEnemy,
    // Housing / Town
    housesJsonText,
    setHousesJsonText,
    selectedLayoutIndex,
    handleSelectTownLayout,
    handleApplyHousesJson,
    handleResetHouses,
    // Structures JSON
    structuresJsonText,
    setStructuresJsonText,
    handleResetStructures,
    handleApplyStructuresJson,
    // NPC Planner
    selectedSimNpcId,
    setSelectedSimNpcId,
    simHour,
    setSimHour,
    simWeather,
    setSimWeather,
    // Smoke Test
    isSmokeTesting,
    runAutomatedSmokeTest,
    smokeTestLogs,
    setSmokeTestLogs,
    currentTestStep,
    setCurrentTestStep,
    // Replay
    replayPayload,
    setReplayPayload,
    currentReplayIdx,
    setCurrentReplayIdx,
    replayIsPlaying,
    setReplayIsPlaying,
    replaySpeed,
    setReplaySpeed,
    replayError,
    setReplayError,
    pastedLogs,
    setPastedLogs,
    // Teleport
    TeleportToChunk,
    TeleportToEmptyArena,
    TeleportToDungeon,
    TeleportToDungeonEntranceOverworld,
    // Weather
    handleSetWeatherBiome
  };
}
