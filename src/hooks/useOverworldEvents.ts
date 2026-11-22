import { Dispatch, SetStateAction, useCallback } from 'react';
import { GameState } from '../types';
import { SeasonEngine } from '../engine/environment/SeasonEngine';
import { SeasonType } from '../engine/environment/types';

export interface UseOverworldEventsParams {
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLog: (msg: string) => void;
}

export function useOverworldEvents({ setGameState, addLog }: UseOverworldEventsParams) {
  const tickTimeOfDay = useCallback(() => {
    setGameState((prev) => {
      const nextMinutes = (prev.timeMinutes ?? 0) + 10;
      let nextHours = prev.timeHours ?? 8;
      let nextDays = prev.daysPassed ?? 0;
      let nextMinutesWrapped = nextMinutes;

      if (nextMinutesWrapped >= 60) {
        nextHours += Math.floor(nextMinutesWrapped / 60);
        nextMinutesWrapped = nextMinutesWrapped % 60;
      }

      if (nextHours >= 24) {
        nextDays += Math.floor(nextHours / 24);
        nextHours = nextHours % 24;
        addLog(`🌅 A new day dawns upon the realm. Days passed: ${nextDays}.`);
      }

      const seasonEngine = SeasonEngine.getInstance();
      const turns = prev.playerStats?.turnsPlayed || (nextDays * 144);
      const nextSeason = seasonEngine.getSeasonForTurns(turns);

      return {
        ...prev,
        timeMinutes: nextMinutesWrapped,
        timeHours: nextHours,
        daysPassed: nextDays,
        season: nextSeason,
      };
    });
  }, [setGameState, addLog]);

  const triggerWeatherChange = useCallback((newWeather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard') => {
    setGameState((prev) => ({
      ...prev,
      weather: newWeather,
      logs: [
        {
          id: `weather_${Date.now()}`,
          text: `🌤️ The sky shifts... Weather is now ${newWeather.toUpperCase()}.`,
          type: 'info',
          timestamp: 'WORLD'
        },
        ...prev.logs.slice(0, 99)
      ],
    }));
  }, [setGameState]);

  const triggerSeasonChange = useCallback((newSeason: SeasonType) => {
    const seasonEngine = SeasonEngine.getInstance();
    const def = seasonEngine.getSeasonDefinition(newSeason);
    setGameState((prev) => ({
      ...prev,
      season: newSeason,
      logs: [
        {
          id: `season_${Date.now()}`,
          text: def.transitionLog,
          type: 'info',
          timestamp: 'WORLD'
        },
        ...prev.logs.slice(0, 99)
      ],
    }));
  }, [setGameState]);

  return {
    tickTimeOfDay,
    triggerWeatherChange,
    triggerSeasonChange,
  };
}

