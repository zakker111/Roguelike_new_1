import { useEffect } from 'react';
import { GameState } from '../types';
import { updateAmbientSoundscape, stopAmbientSoundscape } from '../utils/audio';
import { isPlayerIndoors } from '../utils/buildingAudio';

export function useAmbientAudio(gameState: GameState) {
  useEffect(() => {
    if (!gameState) return;

    const px = gameState.playerX ?? 0;
    const py = gameState.playerY ?? 0;

    let hostileCountNearPlayer = 0;
    if (gameState.enemies) {
      for (const e of gameState.enemies) {
        if (e.hp > 0 && !e.isFollower && !e.isTownGuard) {
          const d = Math.hypot(e.x - px, e.y - py);
          if (d <= 10) {
            hostileCountNearPlayer++;
          }
        }
      }
    }

    const isNight = gameState.gameTime !== undefined ? (gameState.gameTime < 360 || gameState.gameTime > 1200) : false;
    const isIndoor = isPlayerIndoors(gameState);

    updateAmbientSoundscape({
      biome: gameState.isOverworld ? (gameState.biome || 'forest') : 'dungeon',
      weather: gameState.weather || 'clear',
      inDungeon: !gameState.isOverworld,
      dungeonLevel: gameState.playerStats?.depth || 1,
      isNight,
      isIndoor,
      hostileCountNearPlayer,
      playerHp: gameState.playerStats?.hp ?? 100,
      maxHp: gameState.playerStats?.maxHp ?? 100,
      playerX: px,
      playerY: py,
    });
  }, [
    gameState?.isOverworld,
    gameState?.biome,
    gameState?.weather,
    gameState?.gameTime,
    gameState?.playerStats?.depth,
    gameState?.playerStats?.hp,
    gameState?.playerStats?.maxHp,
    gameState?.playerX,
    gameState?.playerY,
    gameState?.enemies,
    gameState?.map,
  ]);

  useEffect(() => {
    return () => {
      stopAmbientSoundscape();
    };
  }, []);
}
