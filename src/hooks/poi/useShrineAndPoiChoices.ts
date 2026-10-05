/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { GameState } from '../../types';
import { formatGameTime } from '../../utils/overworld';
import { getRandomRelicDraft } from '../../utils/relics';
import { applyStatusToList } from '../../effects/statusEngine';
import { PoiType } from '../../components/PoiInteractionOverlay';
import { PoiChoiceEffects } from './types';

export interface UseShrineAndPoiChoicesParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setActivePoi: (poi: PoiType | null) => void;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  setActiveRelicDraft: (draft: any) => void;
  gameConfig: {
    levelUpBonuses: {
      xpThresholdMultiplier: number;
      maxHp: number;
      maxMp: number;
      atk: number;
      def: number;
      attributePoints: number;
    };
  };
}

export function useShrineAndPoiChoices({
  gameState,
  setGameState,
  setActivePoi,
  addLogMessage,
  playSound,
  setActiveRelicDraft,
  gameConfig,
}: UseShrineAndPoiChoicesParams) {
  const handlePoiChoiceSelected = useCallback((
    poiId: string,
    choiceId: string,
    effects: PoiChoiceEffects
  ) => {
    setActivePoi(null);

    // Add log message
    addLogMessage(effects.logText, 'loot');

    // Spawn event effect if specified
    if (effects.spawnEffectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: effects.spawnEffectText,
          type: effects.spawnEffectType || 'heal',
        },
      });
      window.dispatchEvent(ev);
    }

    setGameState((prev) => {
      // 1. Update POI isInteracted state in the current chunk
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const activeChunk = prev.overworldChunks[chunkKey];
      let nextChunks = { ...prev.overworldChunks };
      if (activeChunk && activeChunk.pois) {
        const updatedPois = activeChunk.pois.map((poi) => {
          if (poi.id === poiId) {
            return { ...poi, isInteracted: true };
          }
          return poi;
        });
        nextChunks[chunkKey] = {
          ...activeChunk,
          pois: updatedPois,
        };
      }

      // 2. Unlock History Scroll Chapter
      const currentChapters = prev.unlockedChapters || [];
      const matchedPoi = activeChunk?.pois?.find((p) => p.id === poiId);
      const nextChapters = matchedPoi && !currentChapters.includes(matchedPoi.chapterId)
        ? [...currentChapters, matchedPoi.chapterId]
        : currentChapters;

      // 3. Update player stats (HP, MP, MaxHP, MaxMP, XP, Gold, DEF, Unspent Points, Level-up)
      const bonuses = gameConfig.levelUpBonuses;
      let maxHp = prev.playerStats.maxHp + (effects.maxHpChange || 0);
      let maxMp = prev.playerStats.maxMp + (effects.maxMpChange || 0);
      let hp = Math.min(maxHp, Math.max(1, prev.playerStats.hp + (effects.hpChange || 0)));
      let mp = Math.min(maxMp, Math.max(0, prev.playerStats.mp + (effects.mpChange || 0)));
      let xp = prev.playerStats.xp + (effects.xpChange || 0);
      let gold = Math.max(0, prev.playerStats.gold + (effects.goldChange || 0));
      let def = prev.playerStats.def + (effects.defChange || 0);
      let unspent = (prev.playerStats.unspentPoints || 0) + (effects.unspentPointsChange || 0);
      let level = prev.playerStats.level;
      let nextThreshold = prev.playerStats.nextLevelXp;
      let atk = prev.playerStats.atk;

      while (xp >= nextThreshold) {
        level += 1;
        xp -= nextThreshold;
        nextThreshold = Math.floor(nextThreshold * bonuses.xpThresholdMultiplier);
        maxHp += bonuses.maxHp;
        hp = maxHp;
        maxMp += bonuses.maxMp;
        mp = maxMp;
        atk += bonuses.atk;
        def += bonuses.def;
        unspent += bonuses.attributePoints;
        addLogMessage(
          `🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`,
          'craft'
        );

        setTimeout(() => {
          playSound('levelUp');
        }, 120);

        setTimeout(() => {
          setGameState((current) => {
            const currentRelics = current.playerStats.relics || [];
            const draft = getRandomRelicDraft(3, currentRelics);
            setActiveRelicDraft(draft);
            return current;
          });
        }, 300);
      }

      // 4. Update Town Reputation
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, Math.max(0, currentRep + (effects.reputationChange || 0)));
      let nextGuardsHostile = prev.areGuardsHostile;
      const nextLogs = [...prev.logs];
      if (nextGuardsHostile && nextRep >= 50) {
        nextGuardsHostile = false;
        nextLogs.push({
          id: `pardon_${Date.now()}`,
          text: `⚖️ [TOWN NOTICE]: Your crimes have been pardoned over reputation restoration! Town guards are no longer hostile.`,
          type: 'info' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      // 5. Update Materials inventory
      const nextMats = { ...prev.inventoryMaterials };
      if (effects.addMaterials) {
        Object.entries(effects.addMaterials).forEach(([matId, count]) => {
          nextMats[matId] = (nextMats[matId] || 0) + count;
        });
      }

      // 6. Update Catalysts inventory
      const nextCats = { ...prev.inventoryCatalysts };
      if (effects.addCatalysts) {
        Object.entries(effects.addCatalysts).forEach(([catId, count]) => {
          nextCats[catId] = (nextCats[catId] || 0) + count;
        });
      }

      let activeEffectsList = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      if (effects.applyBlessed) {
        activeEffectsList = applyStatusToList(activeEffectsList, 'blessed', {
          duration: 30,
          statModifiers: { crit: 10, lck: 5 },
        });
      }
      if (effects.applyShielded) {
        activeEffectsList = applyStatusToList(activeEffectsList, 'shielded', {
          duration: 25,
          statModifiers: { def: 3 },
        });
      }

      return {
        ...prev,
        overworldChunks: nextChunks,
        unlockedChapters: nextChapters,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          level,
          xp,
          nextLevelXp: nextThreshold,
          hp,
          maxHp,
          mp,
          maxMp,
          gold,
          atk,
          def,
          unspentPoints: unspent,
          activeEffects: activeEffectsList,
        },
      };
    });
  }, [
    gameState.playerX,
    gameState.playerY,
    setActivePoi,
    addLogMessage,
    gameConfig,
    playSound,
    setActiveRelicDraft,
    setGameState,
  ]);

  return {
    handlePoiChoiceSelected,
  };
}
