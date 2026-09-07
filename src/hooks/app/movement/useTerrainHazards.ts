import { GameState, TileType } from '../../../types';
import { getCurrentWeight, getMaxWeight } from '../../../utils/itemWeight';
import { WEATHER_EFFECTS } from '../../../utils/weatherEngine';
import { isPlayerInvincible } from '../../../utils/invincibility';

export function checkOverburdenedMovement(
  gameState: GameState,
  dx: number,
  dy: number,
  playSound: (sound: any) => void,
  addLogMessage: (text: string, type?: any) => void,
  executeEnemiesTurn: (px: number, py: number) => void
): boolean {
  const currentW = getCurrentWeight(gameState);
  const maxW = getMaxWeight(gameState);
  if (currentW > maxW && (dx !== 0 || dy !== 0)) {
    const staggerChance = gameState.season === 'winter' ? 0.65 : 0.45;
    if (Math.random() < staggerChance) {
      playSound('bump');
      const winterExt = gameState.season === 'winter' ? ' Glacial blizzards worsen overburden strain!' : '';
      addLogMessage(
        `⚠️ OVERBURDENED! You are carrying too much heavy gear (${currentW}/${maxW} kg).${winterExt} You stagger and stumble!`,
        'danger'
      );
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
      return true;
    }
  }
  return false;
}

export function checkWeatherMovementPenalties(
  gameState: GameState,
  dx: number,
  dy: number,
  hasEquippedTrait: (state: GameState, trait: string) => boolean,
  playSound: (sound: any) => void,
  addLogMessage: (text: string, type?: any) => void,
  executeEnemiesTurn: (px: number, py: number) => void
): boolean {
  if (gameState.isOverworld && (dx !== 0 || dy !== 0)) {
    const weather = gameState.weather || 'clear';
    const effect = WEATHER_EFFECTS[weather];
    if (effect && effect.movementPenaltyChance > 0) {
      let isImmune = false;
      let genericFatigueLog = effect.fatigueLog;
      if (weather === 'rainy') {
        isImmune = hasEquippedTrait(gameState, 'SWAMP_GLIDE') || hasEquippedTrait(gameState, 'NON_SLIPPERY');
        genericFatigueLog =
          '🌧️ [MUDDY PATHS]: You slip and slide on the muddy wet ground, wasting your turn recovering your footing. (Tip: Equip forged Non-Slippery shoes or Swamp-Glide boots!)';
      } else if (weather === 'sandstorm') {
        isImmune = hasEquippedTrait(gameState, 'DESERT_IMMUNITY');
        genericFatigueLog =
          '🌪️ [SANDSTORM DUST]: Swirling sand fills your eyes, making you stumble blindly! You lose a turn trying to clear your vision. (Tip: Equip forged Desert-Immune visor or dune boots!)';
      } else if (weather === 'blizzard') {
        isImmune = hasEquippedTrait(gameState, 'WORG_FORCE') || hasEquippedTrait(gameState, 'NON_SLIPPERY');
        genericFatigueLog =
          '🌨️ [BLIZZARD FREEZE]: A savage winter blizzard gale sweeps over you! You shiver from cold fatigue and lose a turn. (Tip: Equip forged Non-Slippery shoes or heavy Worg-Spiked gear!)';
      }

      if (!isImmune && Math.random() < effect.movementPenaltyChance) {
        playSound('bump');
        addLogMessage(genericFatigueLog, 'danger');
        const coldEv = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: effect.fatigueText, type: 'dmg' }
        });
        window.dispatchEvent(coldEv);
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return true;
      }
    } else if (gameState.season === 'winter' && (gameState.biome === 'tundra' || Math.random() < 0.05)) {
      if (Math.random() < 0.04) {
        playSound('bump');
        addLogMessage(
          `❄️ [WINTER CHILL]: A frosty blast of freezing wind locks up your muscles! You shiver from frostbite fatigue and waste a turn.`,
          'danger'
        );
        const coldEv = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: `🥶 SHIVER`, type: 'dmg' }
        });
        window.dispatchEvent(coldEv);
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return true;
      }
    }
  }
  return false;
}
