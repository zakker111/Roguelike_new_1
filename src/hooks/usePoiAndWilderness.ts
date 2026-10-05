/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UsePoiAndWildernessParams,
  useWildernessSleep,
  useTravelerInteractions,
  useShrineAndPoiChoices,
  useWaystoneAndGuardian,
} from './poi';

export { type UsePoiAndWildernessParams };

/**
 * Unified POI & Wilderness Sub-Engine Hook
 * Coordinative facade integrating wilderness sleep, traveler interactions,
 * landmark/shrine choices, leyline waystone fast travel, and biome guardian trials.
 */
export function usePoiAndWilderness({
  gameState,
  setGameState,
  addLogMessage,
  playSound,
  setActiveTab,
  activeTravelerNpc,
  setActiveTravelerNpc,
  activePoi,
  setActivePoi,
  setIsSleepOpen,
  setActiveRelicDraft,
  executeEnemiesTurn,
  gameConfig,
}: UsePoiAndWildernessParams) {
  // 1. Wilderness Camping & Sleep Ambush Sub-Engine
  const { handleConfirmSleep } = useWildernessSleep({
    setGameState,
    playSound,
    setIsSleepOpen,
  });

  // 2. Wandering Traveler & Drunk NPC Sub-Engine
  const {
    handleDrunkNpcEffects,
    handleTravelerAttack,
    handleTravelerTrade,
  } = useTravelerInteractions({
    gameState,
    setGameState,
    addLogMessage,
    playSound,
    setActiveTab,
    activeTravelerNpc,
    setActiveTravelerNpc,
    executeEnemiesTurn,
  });

  // 3. Landmark & Shrine Choices Sub-Engine
  const { handlePoiChoiceSelected } = useShrineAndPoiChoices({
    gameState,
    setGameState,
    setActivePoi,
    addLogMessage,
    playSound,
    setActiveRelicDraft,
    gameConfig,
  });

  // 4. Leyline Waystone & Biome Guardian Sub-Engine
  const {
    handleAttuneWaystone,
    handleWaystoneFastTravel,
    handleChallengeBiomeGuardian,
  } = useWaystoneAndGuardian({
    setGameState,
    activePoi,
    setActivePoi,
    addLogMessage,
    playSound,
  });

  return {
    handleConfirmSleep,
    handleDrunkNpcEffects,
    handleTravelerAttack,
    handleTravelerTrade,
    handlePoiChoiceSelected,
    handleAttuneWaystone,
    handleWaystoneFastTravel,
    handleChallengeBiomeGuardian,
  };
}
