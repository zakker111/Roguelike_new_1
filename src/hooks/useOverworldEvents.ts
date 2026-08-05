import { Dispatch, SetStateAction, useCallback } from 'react';
import { GameState } from '../types';

export interface UseOverworldEventsParams {
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLog: (msg: string) => void;
}

export function useOverworldEvents({ setGameState, addLog }: UseOverworldEventsParams) {
  const tickTimeOfDay = useCallback(() => {
    setGameState((prev) => {
      const nextMinutes = prev.timeMinutes + 10;
      let nextHours = prev.timeHours;
      let nextDays = prev.daysPassed;
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

      // Check season rotation every 7 days
      const seasons: ('spring' | 'summer' | 'autumn' | 'winter')[] = ['spring', 'summer', 'autumn', 'winter'];
      const currentSeasonIndex = Math.floor((nextDays / 7) % 4);
      const nextSeason = seasons[currentSeasonIndex];

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
      logs: [`🌤️ The sky shifts... Weather is now ${newWeather.toUpperCase()}.`, ...prev.logs.slice(0, 99)],
    }));
  }, [setGameState]);

  return {
    tickTimeOfDay,
    triggerWeatherChange,
  };
}
