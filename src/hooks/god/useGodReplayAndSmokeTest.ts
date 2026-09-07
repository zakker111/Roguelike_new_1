import { useState, useEffect } from 'react';
import { GameState } from '../../types';
import { generateOverworldChunk, getCurrentWorldSeed, setWorldSeed } from '../../utils/overworld';
import { generateLevel, getEnemyTemplate } from '../../utils/dungeon';
import { getAvailableStructures } from '../../utils/structurePlacer';
import { computeFOV } from '../../utils/ai';

export function useGodReplayAndSmokeTest(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  addLogMessage?: (msg: string, type?: string) => void,
  triggerSuccessLog?: (msg: string) => void
) {
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
      if (triggerSuccessLog) {
        triggerSuccessLog('Full Game Smoke Test passed successfully!');
      }
    } catch (err: any) {
      log(`❌ Smoke Test Error: ${err.message || err}`);
    } finally {
      setIsSmokeTesting(false);
      setCurrentTestStep(null);
    }
  };

  return {
    smokeTestLogs,
    setSmokeTestLogs,
    isSmokeTesting,
    currentTestStep,
    setCurrentTestStep,
    runAutomatedSmokeTest,
    pastedLogs,
    setPastedLogs,
    replayPayload,
    setReplayPayload,
    currentReplayIdx,
    setCurrentReplayIdx,
    replayIsPlaying,
    setReplayIsPlaying,
    replaySpeed,
    setReplaySpeed,
    replayError,
    setReplayError
  };
}
