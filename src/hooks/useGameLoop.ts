import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { GameState, OverworldChunk, Enemy } from '../types';
import { playSound } from '../utils/audio';
import { getSiegeCombatants } from '../utils/siegeUtils';
import { gameEventBus } from '../events/core/EventBus';
import {
  spawnOutpostSiegeSquads,
  createOutpostQuartermaster,
  getOutpostName
} from '../world/outposts';

export const DEFAULT_IDLE_TIMEOUT_MS = 30000; // 30 seconds of inactivity = idle

export interface UseGameLoopProps {
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  setGameState: Dispatch<SetStateAction<GameState>>;
  idleTimeoutMs?: number;
}

export const useGameLoop = ({
  isPlaying,
  isGameOver,
  isVictory,
  setGameState,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
}: UseGameLoopProps) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastTurnsPlayedRef = useRef<number>(-1);
  const lastEscalationTurnsRef = useRef<number>(0);

  // Track user input activity across the window and event bus
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recordActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    window.addEventListener('keydown', recordActivity, { passive: true });
    window.addEventListener('pointerdown', recordActivity, { passive: true });

    // Also reset idle timer on any player action dispatched across the Event Bus
    const eventBusSub = gameEventBus.on('*', recordActivity);

    return () => {
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('pointerdown', recordActivity);
      eventBusSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isPlaying && !isGameOver && !isVictory) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const isIdle = now - lastActivityTimeRef.current >= idleTimeoutMs;

        // If player is idle, do not advance real-time seconds or trigger threat escalation
        if (isIdle) {
          return;
        }

        setGameState((prev) => {
          const currentTurns = prev.playerStats?.turnsPlayed || 0;

          // If turns played advanced, record activity
          if (lastTurnsPlayedRef.current !== -1 && currentTurns > lastTurnsPlayedRef.current) {
            lastActivityTimeRef.current = now;
          }
          lastTurnsPlayedRef.current = currentTurns;

          const nextSec = prev.playerStats.realTimeSeconds + 1;
          
          let nextLogs = prev.logs;
          // Only scale chaos threat if player is active AND has progressed turns since last escalation
          if (nextSec % 120 === 0 && currentTurns > lastEscalationTurnsRef.current) {
            lastEscalationTurnsRef.current = currentTurns;
            nextLogs = [...prev.logs, {
              id: `threat_escalation_${nextSec}`,
              text: `⚠️ THE ATMOSPHERE HEAVENS GROWS HEAVIER - Chaos Threat has scaled! Monsters are reinforced!`,
              type: 'danger',
              timestamp: 'CHALLENGE',
            }];
            playSound('trap');
          }

          let updatedChunks: Record<string, OverworldChunk> | null = null;
          let updatedEnemies: Enemy[] | null = null;
          let chunksChanged = false;
          let enemiesChanged = false;

          const getUpdatedChunks = () => {
            if (!updatedChunks) {
              updatedChunks = { ...prev.overworldChunks };
            }
            return updatedChunks;
          };

          const getUpdatedEnemies = () => {
            if (!updatedEnemies) {
              updatedEnemies = [...prev.enemies];
            }
            return updatedEnemies;
          };

          if (nextSec > 15 && nextSec % 80 === 0 && Math.random() < 0.35) {
            const watchtowerChunks = Object.values(prev.overworldChunks as Record<string, OverworldChunk>).filter(c => c.watchtower && c.watchtower.isClaimed && !c.watchtower.siegeState?.isUnderSiege);
            if (watchtowerChunks.length > 0) {
              const selectedChunk = watchtowerChunks[Math.floor(Math.random() * watchtowerChunks.length)] as OverworldChunk;
              const wt = { ...selectedChunk.watchtower! };
              
              const possibleAttackers: Array<'syndicate' | 'vanguard' | 'bandits'> = ['syndicate', 'vanguard', 'bandits'];
              const filteredAttackers = possibleAttackers.filter(a => a !== wt.controller);
              const attacker = filteredAttackers[Math.floor(Math.random() * filteredAttackers.length)];

              const outpostName = getOutpostName(selectedChunk.chunkX, selectedChunk.chunkY, wt.controller as any);
              wt.siegeState = {
                isUnderSiege: true,
                attacker,
                defender: wt.controller || 'neutral',
                siegeTimerSeconds: 120,
                maxTimerSeconds: 120,
                bountyGold: 250,
                playerAssistedDefender: false,
                playerAssistedAttacker: false
              };

              gameEventBus.emit('world:outpost_siege', {
                outpostId: wt.id,
                outpostName,
                chunkX: selectedChunk.chunkX,
                chunkY: selectedChunk.chunkY,
                attacker,
                defender: wt.controller || 'neutral',
                turnsRemaining: 120,
                bountyGold: 250
              });

              const chunks = getUpdatedChunks();
              chunks[`${selectedChunk.chunkX},${selectedChunk.chunkY}`] = {
                ...selectedChunk,
                watchtower: wt
              };
              chunksChanged = true;

              if (nextLogs === prev.logs) {
                nextLogs = [...prev.logs];
              }
              nextLogs.push({
                id: `siege_alert_${Date.now()}`,
                text: `📡 [OUTPOST SIEGE]: ${outpostName} is under assault by ${attacker === 'syndicate' ? 'Moonshadow Syndicate' : (attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} forces! Bounty: 250 Gold!`,
                type: 'danger',
                timestamp: 'SIEGE'
              });
              
              playSound('trap');

              if (selectedChunk.chunkX === prev.currentChunkX && selectedChunk.chunkY === prev.currentChunkY) {
                const { enemies: siegeEnemies } = spawnOutpostSiegeSquads({
                  wtX: wt.x,
                  wtY: wt.y,
                  chunkX: selectedChunk.chunkX,
                  chunkY: selectedChunk.chunkY,
                  attackerFaction: attacker,
                  defenderFaction: (wt.controller as any) || 'neutral',
                  playerFaction: prev.faction || 'neutral',
                  playerReputation: prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 },
                  defenseTier: 1
                });

                const enemies = getUpdatedEnemies();
                updatedEnemies = [...enemies, ...siegeEnemies];
                enemiesChanged = true;
              }
            }
          }

          for (const key of Object.keys(prev.overworldChunks)) {
            const chunk = prev.overworldChunks[key] as OverworldChunk;
            if (chunk.watchtower && chunk.watchtower.siegeState?.isUnderSiege) {
              const wt = { ...chunk.watchtower };
              const sState = { ...wt.siegeState };
              sState.siegeTimerSeconds -= 1;

              if (sState.siegeTimerSeconds <= 0) {
                const victor = sState.attacker;
                const outpostName = getOutpostName(chunk.chunkX, chunk.chunkY, victor);
                const qm = createOutpostQuartermaster(chunk.chunkX, chunk.chunkY, victor, 1, 150);
                wt.isClaimed = true;
                wt.controller = victor;
                wt.claimPercent = 100;
                wt.garrisonDefeated = false;
                wt.siegeState = undefined;
                wt.quartermaster = qm;

                gameEventBus.emit('world:outpost_liberated', {
                  outpostId: wt.id,
                  outpostName,
                  chunkX: chunk.chunkX,
                  chunkY: chunk.chunkY,
                  victor,
                  playerAssisted: false,
                  bountyAwarded: 0,
                  reputationGain: 0
                });

                const chunks = getUpdatedChunks();
                chunks[key] = {
                  ...chunk,
                  watchtower: wt
                };
                chunksChanged = true;

                if (nextLogs === prev.logs) {
                  nextLogs = [...prev.logs];
                }
                nextLogs.push({
                  id: `siege_loss_${Date.now()}`,
                  text: `💔 [OUTPOST FALLEN]: ${outpostName} has fallen! It is now controlled by the ${sState.attacker === 'syndicate' ? 'Moonshadow Syndicate' : (sState.attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')}.`,
                  type: 'danger',
                  timestamp: 'SYSTEM'
                });
                
                playSound('trap');

                if (chunk.chunkX === prev.currentChunkX && chunk.chunkY === prev.currentChunkY) {
                  const enemies = getUpdatedEnemies();
                  updatedEnemies = enemies.filter(e => !e.id.startsWith('siege_attacker_') && !e.id.startsWith('siege_defender_') && !e.id.startsWith('siege_att_') && !e.id.startsWith('siege_def_'));
                  enemiesChanged = true;
                }
              } else {
                wt.siegeState = sState;
                const chunks = getUpdatedChunks();
                chunks[key] = {
                  ...chunk,
                  watchtower: wt
                };
                chunksChanged = true;
              }
            }
          }

          return {
            ...prev,
            playerStats: {
              ...prev.playerStats,
              realTimeSeconds: nextSec,
            },
            logs: nextLogs,
            overworldChunks: chunksChanged && updatedChunks ? updatedChunks : prev.overworldChunks,
            enemies: enemiesChanged && updatedEnemies ? updatedEnemies : prev.enemies,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver, isVictory, setGameState]);
};
