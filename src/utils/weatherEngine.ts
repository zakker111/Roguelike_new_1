import { CatalystType } from '../types';

export interface WeatherEffect {
  id: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard';
  name: string;
  icon: string;
  description: string;
  movementPenaltyChance: number;
  fatigueText: string;
  fatigueLog: string;
  combatModifiers?: {
    catalystModifiers?: Partial<Record<CatalystType, { multiplier: number; logText: string }>>;
    blindnessChance?: number;
    blindnessMultiplier?: number;
    blindnessLog?: string;
  };
}

export const WEATHER_EFFECTS: Record<string, WeatherEffect> = {
  clear: {
    id: 'clear',
    name: 'Clear Skies',
    icon: '☀️',
    description: 'Standard traveling speeds, clear fields of view.',
    movementPenaltyChance: 0,
    fatigueText: '',
    fatigueLog: '',
  },
  rainy: {
    id: 'rainy',
    name: 'Pouring Rain & Storms',
    icon: '🌧️',
    description: '⚡ +30% Lightning catalyst, -20% Fire dmg, instant fishing bites!',
    movementPenaltyChance: 0.05,
    fatigueText: '💧 SLIP',
    fatigueLog: '🌧️ [MUDDY PATHS]: You slip and slide on the muddy wet ground, wasting your turn recovering your footing.',
    combatModifiers: {
      catalystModifiers: {
        [CatalystType.Lightning]: {
          multiplier: 1.30,
          logText: '🌧️ [CONDUCTIVITY]: Wet conditions conduct your electric magic, dealing +30% extra Lightning damage!',
        },
        [CatalystType.Fire]: {
          multiplier: 0.80,
          logText: '🌧️ [DAMP AIR]: Heavy rain dampens your active flame infusion, reducing Fire damage by -20%.',
        },
      }
    }
  },
  foggy: {
    id: 'foggy',
    name: 'Thick Ambient Fog',
    icon: '🌫️',
    description: '🌫️ Vision is restricted, but +15% stealth dodge rate active!',
    movementPenaltyChance: 0,
    fatigueText: '',
    fatigueLog: '',
  },
  snowy: {
    id: 'snowy',
    name: 'Gentle Frosty Snowfall',
    icon: '❄️',
    description: '❄️ Fire attacks deal +20% damage. Small chance to slip.',
    movementPenaltyChance: 0.03,
    fatigueText: '🥶 SHIVER',
    fatigueLog: '❄️ [WINTER CHILL]: A frosty blast of freezing wind locks up your muscles! You shiver from frostbite fatigue and waste a turn.',
  },
  sandstorm: {
    id: 'sandstorm',
    name: 'Swirling Sandstorm',
    icon: '🌪️',
    description: '🌪️ Blinds normal attacks. Sandy winds blow through the dunes!',
    movementPenaltyChance: 0.10,
    fatigueText: '🌪️ BLINDED',
    fatigueLog: '🌪️ [SANDSTORM DUST]: Swirling sand fills your eyes, making you stumble blindly! You lose a turn trying to clear your vision.',
    combatModifiers: {
      blindnessChance: 0.25,
      blindnessMultiplier: 0.5,
      blindnessLog: '🌪️ [SANDSTORM BLINDNESS]: Blinding sandstorms obscure your target! Your attack only deals 50% damage.',
    }
  },
  blizzard: {
    id: 'blizzard',
    name: 'Severe Glacial Blizzard',
    icon: '🌨️',
    description: '🌨️ Freezing fatigue outdoor penalty. Frost deals +40% dmg!',
    movementPenaltyChance: 0.12,
    fatigueText: '🥶 FREEZE',
    fatigueLog: '🌨️ [BLIZZARD FREEZE]: A savage winter blizzard gale sweeps over you! You shiver from cold fatigue and lose a turn.',
    combatModifiers: {
      catalystModifiers: {
        [CatalystType.Frost]: {
          multiplier: 1.40,
          logText: '❄️ [BLIZZARD OVERDRIVE]: Freezing blizzard winds amplify your glacial frost, dealing +40% extra Ice damage!',
        }
      }
    }
  }
};
