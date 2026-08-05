import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { GameState, OverworldChunk, Enemy } from '../types';
import { playSound } from '../utils/audio';
import { getSiegeCombatants } from '../utils/siegeUtils';

export interface UseGameLoopProps {
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  setGameState: Dispatch<SetStateAction<GameState>>;
}

export const useGameLoop = ({
  isPlaying,
  isGameOver,
  isVictory,
  setGameState,
}: UseGameLoopProps) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && !isGameOver && !isVictory) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          const nextSec = prev.playerStats.realTimeSeconds + 1;
          
          let nextLogs = prev.logs;
          if (nextSec % 120 === 0) {
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

              wt.siegeState = {
                isUnderSiege: true,
                attacker,
                defender: wt.controller || 'neutral',
                siegeTimerSeconds: 120,
                maxTimerSeconds: 120
              };

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
                text: `📡 [WATCHTOWER SECTOR ALERT]: The Watchtower at Sector [${selectedChunk.chunkX}, ${selectedChunk.chunkY}] is being besieged by ${attacker === 'syndicate' ? 'Moonshadow Syndicate' : (attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} forces! Intervene within 120 seconds to defend!`,
                type: 'danger',
                timestamp: 'SIEGE'
              });
              
              playSound('trap');

              if (selectedChunk.chunkX === prev.currentChunkX && selectedChunk.chunkY === prev.currentChunkY) {
                const wtX = wt.x;
                const wtY = wt.y;
                const defender = wt.siegeState.defender;
                const playerFaction = prev.faction || 'neutral';
                const reputation = prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 };
                
                const siegeEnemies = getSiegeCombatants(
                  wtX,
                  wtY,
                  prev.currentChunkX,
                  prev.currentChunkY,
                  attacker,
                  defender,
                  playerFaction,
                  reputation
                );

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
                wt.isClaimed = true;
                wt.controller = sState.attacker;
                wt.claimPercent = 100;
                wt.garrisonDefeated = false;
                wt.siegeState = undefined;

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
                  text: `💔 [WATCHTOWER OVERTHROWN]: The watchtower at Sector [${chunk.chunkX}, ${chunk.chunkY}] has fallen! It is now controlled by the ${sState.attacker === 'syndicate' ? 'Moonshadow Syndicate' : (sState.attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')}.`,
                  type: 'danger',
                  timestamp: 'SYSTEM'
                });
                
                playSound('trap');

                if (chunk.chunkX === prev.currentChunkX && chunk.chunkY === prev.currentChunkY) {
                  const enemies = getUpdatedEnemies();
                  updatedEnemies = enemies.filter(e => !e.id.startsWith('siege_attacker_') && !e.id.startsWith('siege_defender_'));
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
